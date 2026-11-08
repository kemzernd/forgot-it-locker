// ====================================
// 1. GET URL PARAMETERS & TRANSACTION DATA
// ====================================
const urlParams = new URLSearchParams(window.location.search);
const txId = urlParams.get("id");

const allTransactions = JSON.parse(localStorage.getItem("transactions")) || {};
const transaction = allTransactions[txId];

const qrcodeContainer = document.getElementById("qrcode-container");
const txDetailsBox = document.getElementById("tx-details-box");
const downloadBtn = document.getElementById("download-btn");
const cancelBtn = document.getElementById("cancel-btn");

// ====================================
// 2. VALIDATE TRANSACTION & RENDER
// ====================================
if (!transaction || transaction.status !== "Active") {
  notify("Invalid or already claimed/cancelled transaction session.", "error");
  setTimeout(function () {
    window.location.href = "shop.html";
  }, 1800);
} else {
  // Only the transaction ID goes in the QR, so it stays small and easy to scan.
  // The scanner page looks up the full details from the saved records.
  const qrCode = new QRCode(qrcodeContainer, {
    text: transaction.txId,
    width: 240,
    height: 240,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });

  // Render Transaction Summary Details
  let itemsSummary = transaction.items
    .map((i) => `${i.name} (Qty: ${i.cartQty})`)
    .join(", ");
  txDetailsBox.innerHTML = `
    <h3>Transaction Summary</h3>
    <p><strong>ID:</strong> <span>${transaction.txId}</span></p>
    <p><strong>Name:</strong> <span>${transaction.fullName} (${transaction.studentId})</span></p>
    <p><strong>Type:</strong> <span>${transaction.transactionType}</span></p>
    <p><strong>Pickup:</strong> <span>${new Date(transaction.pickupTime).toLocaleString()}</span></p>
    <p><strong>Items:</strong> <span>${itemsSummary}</span></p>
  `;

  // ====================================
  // 3. DOWNLOAD QR CODE LOGIC (white background + white margin)
  // ====================================
  downloadBtn.addEventListener("click", function () {
    const qrCanvas = qrcodeContainer.querySelector("canvas");
    const qrImg = qrcodeContainer.querySelector("img");

    // Prefer the canvas (always ready); fall back to the image if it has loaded
    let source = null;
    let qrWidth = 0;
    let qrHeight = 0;

    if (qrCanvas && qrCanvas.width > 0) {
      source = qrCanvas;
      qrWidth = qrCanvas.width;
      qrHeight = qrCanvas.height;
    } else if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
      source = qrImg;
      qrWidth = qrImg.naturalWidth;
      qrHeight = qrImg.naturalHeight;
    }

    if (!source) {
      notify("QR code image is still generating. Please try again.", "error");
      return;
    }

    // Build a new canvas: white background + white border around the QR
    const padding = 32;
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = qrWidth + padding * 2;
    outputCanvas.height = qrHeight + padding * 2;

    const ctx = outputCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    ctx.imageSmoothingEnabled = false; // keeps the QR squares sharp
    ctx.drawImage(source, padding, padding, qrWidth, qrHeight);

    const link = document.createElement("a");
    link.href = outputCanvas.toDataURL("image/png");
    link.download = `Transaction-${transaction.txId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ====================================
  // 4. CANCEL TRANSACTION LOGIC
  // ====================================
  cancelBtn.addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to cancel this transaction? Your items will be returned to inventory.",
      )
    ) {
      // Restore stock back to master inventory
      let masterInventory = JSON.parse(localStorage.getItem("items")) || [];

      transaction.items.forEach((cartItem) => {
        let invItem = masterInventory.find((i) => i.id === cartItem.id);
        if (invItem) {
          invItem.quantity += cartItem.cartQty;
        }
      });

      localStorage.setItem("items", JSON.stringify(masterInventory));

      // Mark transaction as cancelled/inactive so ID cannot be reused
      transaction.status = "Cancelled";
      localStorage.setItem("transactions", JSON.stringify(allTransactions));

      notify("Transaction cancelled successfully. Returning to shop.", "success");
      setTimeout(function () {
        window.location.href = "shop.html";
      }, 1800);
    }
  });
}
