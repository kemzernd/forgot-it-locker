// ====================================
// 1. LOAD DATA FROM LOCALSTORAGE
// ====================================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ====================================
// 2. GET HTML ELEMENTS
// ====================================
const cartContainer = document.getElementById("cart-container");
const searchInput = document.getElementById("search-input");
const cartTotalDisplay = document.getElementById("cart-total-display");
const checkoutBtn = document.getElementById("checkout-btn");
const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");

// ====================================
// 3. RENDER CART ITEMS
// ====================================
function renderCart(itemsToRender) {
  cartContainer.innerHTML = "";

  if (itemsToRender.length === 0) {
    const emptyMessage =
      cart.length > 0 ?
        "No cart items match your filters."
      : "Your cart is currently empty.";
    cartContainer.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">${emptyMessage}</p>`;
    cartTotalDisplay.textContent = "Total: ₱0.00";
    return;
  }

  let grandTotal = 0;

  itemsToRender.forEach((cartItem) => {
    let itemTotal = cartItem.price * cartItem.cartQty;
    grandTotal += itemTotal;

    let imageContent =
      cartItem.image ?
        `<img src="${cartItem.image}" alt="${cartItem.name}">`
      : `<div class="no-image-text">No Image</div>`;

    const cardHTML = `
      <div class="cart-card">
        <div class="cart-card-image-wrapper">
          ${imageContent}
        </div>
        
        <div class="cart-card-details">
          <div>
            <h3 class="cart-item-title">${cartItem.name}</h3>
            <p class="cart-item-desc">${cartItem.description}</p>
          </div>
          
          <div>
            <div class="price-qty-row">
              <div class="cart-item-price">₱${cartItem.price.toFixed(2)}</div>
              <div class="qty-control">
                <button type="button" class="qty-btn" aria-label="Decrease quantity" onclick="changeCartQty(${cartItem.id}, -1)">&minus;</button>
                <input 
                  type="number" 
                  class="qty-input" 
                  id="cart-qty-${cartItem.id}" 
                  min="1" 
                  max="${cartItem.quantity}" 
                  value="${cartItem.cartQty}" 
                  onchange="updateQuantity(${cartItem.id}, this)"
                  title="Max available: ${cartItem.quantity}"
                >
                <button type="button" class="qty-btn" aria-label="Increase quantity" onclick="changeCartQty(${cartItem.id}, 1)">+</button>
              </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${cartItem.id})">Remove</button>
          </div>
        </div>
      </div>
    `;

    cartContainer.insertAdjacentHTML("beforeend", cardHTML);
  });

  cartTotalDisplay.textContent = `Total: ₱${grandTotal.toFixed(2)}`;
}

// ====================================
// 4. UPDATE QUANTITY & SEARCH
// ====================================
function updateQuantity(id, inputElement) {
  let newQty = parseInt(inputElement.value);
  let cartItem = cart.find((item) => item.id === id);

  // Always fetch fresh inventory data to validate stock properly
  let currentInventory = JSON.parse(localStorage.getItem("items")) || [];
  let inventoryItem = currentInventory.find((item) => item.id === id);

  if (newQty < 1) {
    newQty = 1;
    inputElement.value = 1;
  }

  if (inventoryItem && newQty > inventoryItem.quantity) {
    notify(`Only ${inventoryItem.quantity} left in stock!`, "error");
    newQty = inventoryItem.quantity;
    inputElement.value = newQty;
  }

  if (cartItem) {
    cartItem.cartQty = newQty;
    localStorage.setItem("cart", JSON.stringify(cart));
    applyCartFilters();
  }
}

// - and + buttons beside the quantity box
function changeCartQty(id, change) {
  const input = document.getElementById(`cart-qty-${id}`);
  if (!input) return;
  input.value = (parseInt(input.value) || 1) + change;
  updateQuantity(id, input);
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  applyCartFilters();
}

// Search + category + transaction type filters
function applyCartFilters() {
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "";
  const type = typeFilter ? typeFilter.value : "";

  // Older cart entries may not have category/type saved, so check the inventory too
  const inventory = JSON.parse(localStorage.getItem("items")) || [];

  const filtered = cart.filter((item) => {
    const invItem = inventory.find((inv) => inv.id === item.id) || {};
    const itemCategory = item.category || invItem.category;
    const itemType = item.type || invItem.type;

    return (
      item.name.toLowerCase().includes(term) &&
      (category === "" || itemCategory === category) &&
      (type === "" || itemType === type)
    );
  });
  renderCart(filtered);
}

if (searchInput) searchInput.addEventListener("input", applyCartFilters);
if (categoryFilter) categoryFilter.addEventListener("change", applyCartFilters);
if (typeFilter) typeFilter.addEventListener("change", applyCartFilters);

// ====================================
// 5. REDIRECT TO CHECKOUT FORM PAGE
// ====================================
checkoutBtn.addEventListener("click", function () {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    notify("Your cart is empty!", "error");
    return;
  }

  // Redirect to student checkout form page
  window.location.href = "../student/student-form.html";
});
// ====================================
// 6. INITIALIZE CART
// ====================================
renderCart(cart);
