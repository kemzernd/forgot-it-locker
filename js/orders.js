// ====================================
// 1. DATA INITIALIZATION & UTILS
// ====================================
const ordersTableBody = document.getElementById("orders-table-body");

function getTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || {};
}

function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function calculateRetrievalTime(pickupString) {
  if (!pickupString) return "N/A";
  const date = new Date(pickupString);
  date.setDate(date.getDate() + 1); // Add 24 hours
  return date.toISOString();
}

// ====================================
// 2. RENDER ORDERS TABLE
// ====================================
function renderOrders() {
  if (!ordersTableBody) return; // Prevent errors on non-table pages

  const transactions = getTransactions();
  const txKeys = Object.keys(transactions);

  ordersTableBody.innerHTML = "";

  if (txKeys.length === 0) {
    ordersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders found.</td></tr>`;
    return;
  }

  // Sort newest first based on timestamp
  const sortedTx = txKeys
    .map((key) => transactions[key])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  sortedTx.forEach((tx) => {
    let currentStatus = tx.status === "Active" ? "Pending" : tx.status;

    let itemsStr = tx.items
      .map((item) => `• ${item.name} (x${item.cartQty})`)
      .join("<br>");

    let retrievalStr = "N/A";
    if (tx.transactionType === "Rent") {
      retrievalStr = formatDateTime(calculateRetrievalTime(tx.pickupTime));
    }

    let badgeClass = "status-pending";
    if (currentStatus === "Claimed") badgeClass = "status-claimed";
    else if (currentStatus === "Rented") badgeClass = "status-rented";
    else if (currentStatus === "Returned") badgeClass = "status-returned";
    else if (currentStatus === "Cancelled") badgeClass = "status-cancelled";

    const row = `
      <tr>
        <td><strong>${tx.txId}</strong></td>
        <td>${tx.fullName}</td>
        <td>${itemsStr}</td>
        <td>${formatDateTime(tx.pickupTime)}</td>
        <td>${retrievalStr}</td>
        <td><span class="status-badge ${badgeClass}">${currentStatus}</span></td>
      </tr>
    `;
    ordersTableBody.insertAdjacentHTML("beforeend", row);
  });
}

// Initialize Table
renderOrders();

// ====================================
// 3. DELETE ALL RECORDS (confirmation modal)
// ====================================
const deleteAllBtn = document.getElementById("delete-all-btn");
const deleteModal = document.getElementById("delete-modal");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");

function openDeleteModal() {
  if (Object.keys(getTransactions()).length === 0) {
    notify("There are no order records to delete.", "error");
    return;
  }
  deleteModal.hidden = false;
  deleteCancelBtn.focus();
}

function closeDeleteModal() {
  deleteModal.hidden = true;
}

if (deleteAllBtn && deleteModal) {
  deleteAllBtn.addEventListener("click", openDeleteModal);
  deleteCancelBtn.addEventListener("click", closeDeleteModal);

  deleteModal.addEventListener("click", function (e) {
    if (e.target === deleteModal) closeDeleteModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !deleteModal.hidden) closeDeleteModal();
  });

  deleteConfirmBtn.addEventListener("click", function () {
    localStorage.removeItem("transactions");
    closeDeleteModal();
    renderOrders();
    notify("All order records deleted.", "success");
  });
}

// ====================================
// 4. SAVE CSV
// ====================================
const saveCsvBtn = document.getElementById("save-csv-btn");

function csvCell(value) {
  let text = String(value === undefined || value === null ? "" : value);
  // Stop spreadsheet apps from running typed text as a formula
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function saveOrdersCsv() {
  const transactions = getTransactions();
  const keys = Object.keys(transactions);

  if (keys.length === 0) {
    notify("There are no order records to save.", "error");
    return;
  }

  // Same order and values as the table (newest first)
  const rows = keys
    .map((key) => transactions[key])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((tx) => {
      const status = tx.status === "Active" ? "Pending" : tx.status;
      const itemsText = tx.items
        .map((item) => `${item.name} (x${item.cartQty})`)
        .join("; ");
      const retrieval =
        tx.transactionType === "Rent" ?
          formatDateTime(calculateRetrievalTime(tx.pickupTime))
        : "N/A";

      return [
        tx.txId,
        tx.fullName,
        itemsText,
        formatDateTime(tx.pickupTime),
        retrieval,
        status,
      ];
    });

  const header = [
    "Unique ID",
    "Student Name",
    "Item(s) & Qty",
    "Pick Up Time",
    "Retrieval Time",
    "Status",
  ];

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  // "\ufeff" lets Excel read the file as UTF-8
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  notify("CSV file saved.", "success");
}

if (saveCsvBtn) saveCsvBtn.addEventListener("click", saveOrdersCsv);
