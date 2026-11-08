const checkoutForm = document.getElementById("checkout-form");
const rentNotice = document.getElementById("rent-notice");

// The transaction type is no longer typed in the form.
// It comes from the items in the cart (set by the admin in the inventory page).
function getCartTransactionType(cartItems) {
  const masterItems = JSON.parse(localStorage.getItem("items")) || [];
  const hasRental = cartItems.some((cartItem) => {
    const invItem = masterItems.find((inv) => inv.id === cartItem.id) || {};
    return (cartItem.type || invItem.type) === "Rent";
  });
  return hasRental ? "Rent" : "Buy";
}

// Show the 24-hour return reminder when the cart has a rental item
if (rentNotice) {
  const currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  if (getCartTransactionType(currentCart) === "Rent") {
    rentNotice.style.display = "block";
  }
}

// Function to generate a non-reusable 6-digit transaction ID
function generateUnique6DigitId(existingTransactions) {
  let uniqueId = "";
  let isUnique = false;

  while (!isUnique) {
    // Generate 6-digit integer from 100000 to 999999
    const random6Digits = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    uniqueId = `FIL-${random6Digits}`;

    // Check if ID already exists in stored transactions
    if (!existingTransactions[uniqueId]) {
      isUnique = true;
    }
  }

  return uniqueId;
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let masterInventory = JSON.parse(localStorage.getItem("items")) || [];
    let allTransactions =
      JSON.parse(localStorage.getItem("transactions")) || {};

    if (cart.length === 0) {
      notify("Your cart is empty!", "error");
      setTimeout(function () {
        window.location.href = "Cart.html";
      }, 1800);
      return;
    }

    const studentIdInput = document.getElementById("studentid").value.trim();

    // ====================================
    // UNRETURNED ITEM CHECK
    // ====================================
    const activeUnreturnedTx = Object.values(allTransactions).find(
      (tx) =>
        tx.studentId === studentIdInput &&
        (tx.status === "Rented" ||
          (tx.status === "Active" && tx.transactionType === "Rent")),
    );

    if (activeUnreturnedTx) {
      notify(
        `CHECKOUT BLOCKED!\n\nStudent ID "${studentIdInput}" currently has an active rental item that has NOT been returned yet.\n\nPlease return the item before creating a new order or rental.`,
        "error",
      );
      return;
    }

    // Generate non-reusable 6-digit transaction ID (e.g., FIL-849201)
    const uniqueTxId = generateUnique6DigitId(allTransactions);

    const formData = {
      txId: uniqueTxId,
      fullName: document.getElementById("fullname").value,
      studentId: studentIdInput,
      courseSection: document.getElementById("course-section").value.trim(),
      transactionType: getCartTransactionType(cart),
      pickupTime: document.getElementById("pickup-time").value,
      items: cart,
      status: "Active", // Initial state
      timestamp: new Date().toISOString(),
    };

    // Deduct stock from master inventory
    cart.forEach((cartItem) => {
      let inventoryItem = masterInventory.find((inv) => inv.id === cartItem.id);
      if (inventoryItem) {
        inventoryItem.quantity -= cartItem.cartQty;
        if (inventoryItem.quantity < 0) inventoryItem.quantity = 0;
      }
    });

    localStorage.setItem("items", JSON.stringify(masterInventory));
    allTransactions[uniqueTxId] = formData;
    localStorage.setItem("transactions", JSON.stringify(allTransactions));
    localStorage.removeItem("cart");

    window.location.href = `success.html?id=${uniqueTxId}`;
  });
}
