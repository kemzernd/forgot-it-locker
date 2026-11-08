// ====================================
// 1. UTILS & DATA STORAGE
// ====================================
function getTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || {};
}

function saveTransactions(transactions) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (err) {
    console.log("Audio play blocked by browser:", err);
  }
}

// Prevents broken layout when showing user-typed text
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

// ====================================
// 2. QR CAMERA CONTROLLER
// ====================================
const startScanBtn = document.getElementById("start-scan-btn");
const stopScanBtn = document.getElementById("stop-scan-btn");
const qrReaderWrapper = document.getElementById("qr-reader-wrapper");
const qrFileInput = document.getElementById("qr-file-input");
const scannedInfoCard = document.getElementById("scanned-info-card");
const scannedInfoContent = document.getElementById("scanned-info-content");

let html5QrCode = null; // camera scanner
let fileScanner = null; // separate instance for image-file scanning
let scanHandled = false; // blocks repeat scans of the same QR

if (startScanBtn) startScanBtn.addEventListener("click", startCamera);
if (stopScanBtn) stopScanBtn.addEventListener("click", stopCamera);

// Scan box = 70% of the video's smaller side (never bigger than the video)
function getQrBoxSize(viewfinderWidth, viewfinderHeight) {
  const edge = Math.min(viewfinderWidth, viewfinderHeight);
  const size = Math.max(Math.floor(edge * 0.7), 50);
  return { width: size, height: size };
}

async function startCamera() {
  if (typeof Html5Qrcode === "undefined") {
    notify(
      "HTML5 QR Code library failed to load. Check your internet connection.",
      "error",
    );
    return;
  }

  // Browsers only allow the camera on HTTPS or localhost
  if (!window.isSecureContext) {
    notify(
      "Camera is blocked on this address.\n\nOpen the site using http://localhost (Live Server) or HTTPS.",
      "error",
    );
    return;
  }

  scanHandled = false;
  qrReaderWrapper.style.display = "flex";
  startScanBtn.style.display = "none";

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
  }

  const config = { fps: 10, qrbox: getQrBoxSize };

  try {
    // Try the back camera first
    await html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess,
      onScanError,
    );
  } catch (err) {
    console.warn("Back camera unavailable, trying front camera...", err);
    try {
      await html5QrCode.start(
        { facingMode: "user" },
        config,
        onScanSuccess,
        onScanError,
      );
    } catch (fatalErr) {
      console.error(fatalErr);
      notify(
        "Camera Access Error:\n\n1. Open the site via http://localhost or HTTPS.\n2. Allow camera permission in your browser.\n3. Close other apps/tabs that use the camera.",
        "error",
      );
      await stopCamera();
    }
  }
}

async function stopCamera() {
  try {
    if (html5QrCode && html5QrCode.isScanning) {
      await html5QrCode.stop();
    }
    if (html5QrCode) html5QrCode.clear();
  } catch (err) {
    console.error("Error stopping camera:", err);
  }
  qrReaderWrapper.style.display = "none";
  startScanBtn.style.display = "inline-block";
}

function onScanError() {
  // Fires on every frame with no QR found - ignore
}

// ====================================
// 3. FILE SCANNER FALLBACK
// ====================================
if (qrFileInput) {
  qrFileInput.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) return;

    const imageFile = e.target.files[0];
    if (!fileScanner) fileScanner = new Html5Qrcode("qr-file-reader");

    try {
      const decodedText = await fileScanner.scanFile(imageFile, false);
      playBeep();
      handleDecodedText(decodedText);
    } catch (err) {
      notify("Could not read a valid QR code from that image.", "error");
    }
    qrFileInput.value = ""; // allow picking the same file again
  });
}

// ====================================
// 4. WHEN A QR IS SCANNED (CAMERA)
// ====================================
function onScanSuccess(decodedText) {
  if (scanHandled) return; // ignore extra frames
  scanHandled = true;

  playBeep();

  // Stop the camera so the same QR can't be processed twice
  stopCamera().then(() => {
    startScanBtn.textContent = "Scan Next";
  });

  handleDecodedText(decodedText);
}

function parseQr(decodedText) {
  let qrData = null;
  let txId = null;

  try {
    const parsed = JSON.parse(decodedText);
    if (parsed && typeof parsed === "object") {
      qrData = parsed;
      txId = parsed.transactionID || parsed.txId || parsed.id;
    }
  } catch (e) {
    // not JSON - plain text QR
  }

  if (!txId) txId = decodedText.trim();
  return { qrData, txId };
}

function handleDecodedText(decodedText) {
  const { qrData, txId } = parseQr(decodedText);

  // Validate format starts with FIL-
  if (!txId.startsWith("FIL-")) {
    renderScannedInfo({
      decodedText,
      qrData,
      tx: null,
      message: "This is not a Forgot-It Locker QR code.",
      level: "error",
    });
    return;
  }

  const transactions = getTransactions();
  const tx = transactions[txId];

  if (!tx) {
    renderScannedInfo({
      decodedText,
      qrData,
      tx: null,
      message: `ID ${txId} was not found in this browser's records.`,
      level: "error",
    });
    return;
  }

  const result = updateTransactionStatus(tx);
  saveTransactions(transactions);

  renderScannedInfo({
    decodedText,
    qrData,
    tx,
    message: result.message,
    level: result.level,
  });
}

// ====================================
// 5. AUTOMATIC STATUS SWITCHING
// ====================================
function updateTransactionStatus(tx) {
  const currentStatus = tx.status === "Active" ? "Pending" : tx.status;

  if (currentStatus === "Cancelled") {
    return {
      message: "Notice: This transaction was cancelled.",
      level: "notice",
    };
  }

  if (tx.transactionType === "Buy") {
    if (currentStatus === "Pending") {
      tx.status = "Claimed";
      return { message: "SUCCESS: Item Claimed!", level: "success" };
    }
    return {
      message: `NOTICE: Order is already ${currentStatus}.`,
      level: "notice",
    };
  }

  if (tx.transactionType === "Rent") {
    if (currentStatus === "Pending") {
      tx.status = "Rented";
      return { message: "SUCCESS: Item Rented Out!", level: "success" };
    }

    if (currentStatus === "Rented") {
      tx.status = "Returned";

      // Put the quantities back into inventory
      const masterInventory = JSON.parse(localStorage.getItem("items")) || [];
      tx.items.forEach((cartItem) => {
        const invItem = masterInventory.find((i) => i.id === cartItem.id);
        if (invItem) invItem.quantity += cartItem.cartQty;
      });
      localStorage.setItem("items", JSON.stringify(masterInventory));

      return {
        message: "SUCCESS: Item Returned to Inventory!",
        level: "success",
      };
    }

    return {
      message: `NOTICE: Rental is already ${currentStatus}.`,
      level: "notice",
    };
  }

  return { message: "Unknown transaction type.", level: "error" };
}

// ====================================
// 6. SHOW QR INFO BELOW THE SCANNER
// ====================================
function infoRow(label, value) {
  return `<p><strong>${label}:</strong> <span>${escapeHtml(value)}</span></p>`;
}

function renderScannedInfo({ decodedText, qrData, tx, message, level }) {
  let html = `
    <p class="scan-message scan-${level}">${escapeHtml(message)}</p>
    <p><strong>QR Code Content:</strong></p>
    <code class="scan-raw">${escapeHtml(decodedText)}</code>
  `;

  if (tx) {
    const items = (tx.items || [])
      .map((i) => `${i.name} (x${i.cartQty})`)
      .join(", ");

    html += infoRow("Transaction ID", tx.txId);
    html += infoRow("Student Name", tx.fullName);
    html += infoRow("Student ID", tx.studentId);
    html += infoRow(
      "Course/Section",
      tx.courseSection || `${tx.section} - ${tx.course}`,
    );
    html += infoRow("Transaction Type", tx.transactionType);
    html += infoRow("Pick Up Time", new Date(tx.pickupTime).toLocaleString());
    html += infoRow("Item(s)", items || "N/A");
    html += `<p><strong>Updated Status:</strong> <span class="scan-status">${escapeHtml(tx.status)}</span></p>`;
  } else if (qrData) {
    html += infoRow("Name", qrData.name);
    html += infoRow("Student ID", qrData.studentId);
    html += infoRow("Section", qrData.section);
    html += infoRow("Type", qrData.type);
    html += infoRow("Pick Up", qrData.pickup);
    html += infoRow(
      "Item(s)",
      Array.isArray(qrData.items) ? qrData.items.join(", ") : qrData.items,
    );
  }

  scannedInfoContent.innerHTML = html;
  scannedInfoCard.style.display = "block";
  scannedInfoCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
