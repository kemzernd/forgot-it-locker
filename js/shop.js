// ====================================
// 1. LOAD INVENTORY DATA
// ====================================
let items = JSON.parse(localStorage.getItem("items")) || [];

// ====================================
// 2. GET HTML ELEMENTS
// ====================================
const shopContainer = document.getElementById("shop-container");
const searchInput = document.getElementById("search-input");
const burgerBtn = document.getElementById("burger-btn");
const closeMenuBtn = document.getElementById("close-menu-btn");
const navLinks = document.getElementById("nav-links");

// ====================================
// 2.5 MOBILE & LAPTOP DRAWER NAVIGATION LOGIC
// ====================================
function openMobileMenu() {
  if (navLinks) {
    navLinks.classList.add("active");
  }
}

function closeMobileMenu() {
  if (navLinks) {
    navLinks.classList.remove("active");
  }
}

if (burgerBtn) burgerBtn.addEventListener("click", openMobileMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener("click", closeMobileMenu);

if (navLinks) {
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
}

// ====================================
// 3. RENDER ITEMS (grouped by category)
// ====================================
const CATEGORY_ORDER = [
  "School Supplies",
  "Personal Essentials",
  "Hygiene Products",
];

function buildCard(item) {
  let imageContent =
    item.image ?
      `<img src="${item.image}" alt="${item.name}">`
    : `<div class="no-image-text">No Image</div>`;

  const isOutOfStock = item.quantity <= 0;
  const stockText = isOutOfStock ? "Out of stock" : `Stock: ${item.quantity}`;
  const disabledAttr = isOutOfStock ? "disabled" : "";

  return `
      <div class="card${isOutOfStock ? " out-of-stock" : ""}">
        <div class="card-image-wrapper">
          ${imageContent}
        </div>
        
        <div class="card-details">
          <h3 class="card-title">${item.name}</h3>
          <p class="card-desc">${item.description}</p>
          <p class="card-stock">${stockText}</p>
          
          <div class="price-qty-row">
            <div class="card-price">₱${item.price.toFixed(2)}</div>
            <div class="qty-control">
              <button type="button" class="qty-btn" aria-label="Decrease quantity" onclick="changeQty(${item.id}, -1)" ${disabledAttr}>&minus;</button>
              <input 
                type="number" 
                class="qty-input" 
                id="qty-${item.id}" 
                min="1" 
                max="${item.quantity}" 
                value="1" 
                title="Available: ${item.quantity}"
                ${disabledAttr}
              >
              <button type="button" class="qty-btn" aria-label="Increase quantity" onclick="changeQty(${item.id}, 1)" ${disabledAttr}>+</button>
            </div>
          </div>
        </div>
        
        <button class="add-to-cart-btn" onclick="addToCart(${item.id}, '${item.name.replace(/'/g, "\\'")}')" ${disabledAttr}>
          Add to Cart
        </button>
      </div>
    `;
}

function renderItems(itemsToRender) {
  shopContainer.innerHTML = "";

  if (itemsToRender.length === 0) {
    shopContainer.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px 0;">No items found.</p>`;
    return;
  }

  // Group the items by the category chosen in the inventory page
  const groups = {};
  itemsToRender.forEach((item) => {
    const key = CATEGORY_ORDER.includes(item.category) ? item.category : "Uncategorized";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const orderedKeys = [...CATEGORY_ORDER, "Uncategorized"].filter((key) => groups[key]);

  orderedKeys.forEach((key) => {
    const cardsHTML = groups[key].map(buildCard).join("");
    shopContainer.insertAdjacentHTML(
      "beforeend",
      `
      <section class="category-section">
        <h2 class="category-title">${key}</h2>
        <div class="category-grid">${cardsHTML}</div>
      </section>
    `,
    );
  });
}

// ====================================
// 4. SEARCH + CATEGORY + TRANSACTION TYPE FILTERS
// ====================================
const categoryFilter = document.getElementById("category-filter");
const typeFilter = document.getElementById("type-filter");

function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "";
  const type = typeFilter ? typeFilter.value : "";

  const filteredItems = items.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchTerm) &&
      (category === "" || item.category === category) &&
      (type === "" || item.type === type)
    );
  });
  renderItems(filteredItems);
}

if (searchInput) searchInput.addEventListener("input", applyFilters);
if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
if (typeFilter) typeFilter.addEventListener("change", applyFilters);

// ====================================
// 4.5 QUANTITY - AND + BUTTONS
// ====================================
function changeQty(itemId, change) {
  const qtyInput = document.getElementById(`qty-${itemId}`);
  const targetItem = items.find((i) => i.id === itemId);
  if (!qtyInput || !targetItem) return;

  let newQty = (Number(qtyInput.value) || 1) + change;

  if (newQty < 1) newQty = 1;

  if (newQty > targetItem.quantity) {
    notify(`Only ${targetItem.quantity} left in stock!`, "error");
    newQty = targetItem.quantity;
  }

  qtyInput.value = newQty;
}

// ====================================
// 5. ADD TO CART LOGIC
// ====================================
function addToCart(itemId, itemName) {
  // Get the specific quantity input for this item
  const qtyInput = document.getElementById(`qty-${itemId}`);
  const quantity = Number(qtyInput.value);

  // Basic validation
  if (quantity < 1) {
    notify("Please enter a valid quantity.", "error");
    return;
  }

  // Find the target item from your items array
  const targetItem = items.find((i) => i.id === itemId);
  if (!targetItem) return;

  if (quantity > targetItem.quantity) {
    notify(`Only ${targetItem.quantity} left in stock!`, "error");
    qtyInput.value = targetItem.quantity;
    return;
  }

  // 1. Get existing cart from localStorage or initialize empty array
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // 2. Check if the item is already in the cart
  let existingCartItem = cart.find((cartItem) => cartItem.id === itemId);

  if (existingCartItem) {
    // If it exists, update the quantity (make sure it doesn't exceed stock)
    let newCartQty = existingCartItem.cartQty + quantity;
    if (newCartQty > targetItem.quantity) {
      notify("You already have maximum available stock in your cart!", "error");
      return;
    }
    existingCartItem.cartQty = newCartQty;
  } else {
    // If it's a new item, add it with a 'cartQty' property
    cart.push({
      ...targetItem,
      cartQty: quantity,
    });
  }

  // 3. Save the updated cart back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();

  // Success feedback
  notify(`Success! Added ${quantity} of "${itemName}" to your cart.`, "success");
  qtyInput.value = 1;
}
// ====================================
// 6. INITIALIZATION
// ====================================
renderItems(items);
