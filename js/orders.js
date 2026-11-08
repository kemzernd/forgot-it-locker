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
