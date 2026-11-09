// ====================================
// 1. LOAD SAVED INVENTORY
// ====================================
let items = JSON.parse(localStorage.getItem("items")) || [];
let nextId = Number(localStorage.getItem("nextId")) || 1;
let editId = null;
let selectedId = null;

// ====================================
// 2. GET HTML ELEMENTS
// ====================================
let form = document.getElementById("item-form");
let itemName = document.getElementById("item-name");
let itemImage = document.getElementById("item-image");
let itemDescription = document.getElementById("item-description");
let itemQuantity = document.getElementById("item-quantity");
let itemPrice = document.getElementById("item-price");
let itemCategory = document.getElementById("item-category");
let itemType = document.getElementById("item-type");
let itemList = document.getElementById("items");
let submitBtn = document.getElementById("submit-btn");
let clearBtn = document.getElementById("clear-btn");

// Preview Elements
let previewImg = document.getElementById("preview-img");
let previewPlaceholder = document.getElementById("preview-placeholder");
let previewTitle = document.getElementById("preview-title");
let previewDesc = document.getElementById("preview-desc");
let previewPrice = document.getElementById("preview-price");
let previewCategory = document.getElementById("preview-category");

// Action Menu elements
let actionMenu = document.getElementById("action-menu");
let editBtn = document.getElementById("edit-btn");
let deleteBtn = document.getElementById("delete-btn");
let cancelActionBtn = document.getElementById("cancel-action-btn");

// ====================================
// 3. PREVIEW SIMULATION LOGIC
// ====================================
// Update text dynamically as user types
itemName.addEventListener("input", (e) => {
  previewTitle.textContent = e.target.value || "Item Name";
});

itemDescription.addEventListener("input", (e) => {
  previewDesc.textContent = e.target.value || "Item Description";
});

itemCategory.addEventListener("change", (e) => {
  previewCategory.textContent = e.target.value || "Item Category";
});

itemPrice.addEventListener("input", (e) => {
  let val = Number(e.target.value);
  previewPrice.textContent = val > 0 ? `₱${val.toFixed(2)}` : "₱0.00";
});

// Update image preview
itemImage.addEventListener("change", function () {
  if (this.files && this.files[0]) {
    let reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
      previewPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    resetPreviewImage();
  }
});

// Helper to reset the preview back to default
function resetPreview() {
  previewTitle.textContent = "Item Name";
  previewDesc.textContent = "Item Description";
  previewCategory.textContent = "Item Category";
  previewPrice.textContent = "₱0.00";
  resetPreviewImage();
}

function resetPreviewImage() {
  previewImg.src = "";
  previewImg.style.display = "none";
  previewPlaceholder.style.display = "block";
}

// Function to populate preview when editing an existing item
function setPreviewFromItem(item) {
  previewTitle.textContent = item.name;
  previewDesc.textContent = item.description;
  previewCategory.textContent = item.category || "Item Category";
  previewPrice.textContent = `₱${item.price.toFixed(2)}`;
  if (item.image) {
    previewImg.src = item.image;
    previewImg.style.display = "block";
    previewPlaceholder.style.display = "none";
  }
}

// ====================================
// 4. FORM ACTIONS LOGIC
// ====================================
// Clear Button
clearBtn.addEventListener("click", () => {
  form.reset();
  resetPreview();
  editId = null;
  submitBtn.textContent = "Add Item"; // Reset button text
  itemImage.required = true;
});

// Save Data
function saveData() {
  localStorage.setItem("items", JSON.stringify(items));
  localStorage.setItem("nextId", nextId);
}

// Submit Form
form.addEventListener("submit", function (event) {
  event.preventDefault();

  let name = itemName.value.trim();
  let description = itemDescription.value.trim();
  let quantity = Number(itemQuantity.value);
  let price = Number(itemPrice.value);
  let category = itemCategory.value;
  let type = itemType.value;
  let imageFile = itemImage.files[0];

  if (
    name === "" ||
    description === "" ||
    quantity < 0 ||
    price < 0 ||
    category === "" ||
    type === ""
  ) {
    notify("Please enter valid information.", "error");
    return;
  }

  function processItem(image) {
    if (editId === null) {
      // CREATE: Add new item
      let newItem = {
        id: nextId,
        image: image,
        name: name,
        description: description,
        quantity: quantity,
        price: price,
        category: category,
        type: type,
      };
      items.push(newItem);
      nextId++;
      notify("Item added successfully!", "success");
    } else {
      // UPDATE: Find existing item
      let item = items.find((item) => item.id === editId);
      if (item) {
        item.name = name;
        item.description = description;
        item.quantity = quantity;
        item.price = price;
        item.category = category;
        item.type = type;
        if (image !== null) {
          item.image = image;
        }
      }
      editId = null;
      submitBtn.textContent = "Add Item"; // Reset button text after update
      itemImage.required = true;
      notify("Item updated successfully!", "success");
    }

    saveData();
    form.reset();
    resetPreview();
    displayItems();
  }

  if (imageFile) {
    let reader = new FileReader();
    reader.onload = function () {
      processItem(reader.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    processItem(null); // Passing null ignores image update on edit
  }
});

// ====================================
// 5. READ: DISPLAY INVENTORY
// ====================================
function displayItems() {
  let output = "";

  // Apply the navbar filters (category, transaction type, search by name)
  let searchTerm = document.getElementById("search-input").value.toLowerCase();
  let categoryValue = document.getElementById("category-filter").value;
  let typeValue = document.getElementById("type-filter").value;

  let visibleItems = items.filter(function (item) {
    return (
      item.name.toLowerCase().includes(searchTerm) &&
      (categoryValue === "" || item.category === categoryValue) &&
      (typeValue === "" || item.type === typeValue)
    );
  });

  if (visibleItems.length === 0) {
    itemList.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No items found.</td></tr>`;
    return;
  }

  visibleItems.forEach(function (item) {
    // Stock status: 10 or below = Low (red), 11 or more = Sufficient (green)
    let isLow = item.quantity <= 10;
    let statusText =
      item.quantity === 0 ? "Out of stock"
      : isLow ? "Low"
      : "Sufficient";
    let statusClass = isLow ? "stock-low" : "stock-sufficient";

    output += `
      <tr>
        <td>${item.id}</td>
        <td>
          <img src="${item.image || ""}" width="60" alt="Item image">
        </td>
        <td>${item.name}</td>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>₱${item.price.toFixed(2)}</td>
        <td class="${statusClass}">${statusText}</td>
        <td>
          <button class="action-btn" onclick="toggleActionMenu(event, ${item.id})">⋮</button>
        </td>
      </tr>
    `;
  });
  itemList.innerHTML = output;
}

["search-input", "category-filter", "type-filter"].forEach(function (id) {
  let control = document.getElementById(id);
  control.addEventListener(id === "search-input" ? "input" : "change", displayItems);
});

// ====================================
// 6. TOGGLE ACTION MENU (Right Top Aligned)
// ====================================
function toggleActionMenu(event, id) {
  event.stopPropagation();
  selectedId = id;

  actionMenu.classList.add("active");

  // Get coordinates of the clicked three-dots button
  let rect = event.target.getBoundingClientRect();

  // Aligned top, pushed to the right
  actionMenu.style.top = `${rect.top + window.scrollY}px`;
  actionMenu.style.left = `${rect.right + window.scrollX + 8}px`; // 8px gap
}

// ====================================
// 7. CLOSE MENU LOGIC
// ====================================
document.addEventListener("click", function () {
  actionMenu.classList.remove("active");
});

actionMenu.addEventListener("click", function (event) {
  event.stopPropagation();
});

cancelActionBtn.addEventListener("click", function () {
  actionMenu.classList.remove("active");
});

// ====================================
// 8. EDIT BUTTON LOGIC
// ====================================
editBtn.addEventListener("click", function () {
  actionMenu.classList.remove("active");
  editItem(selectedId);
});

// ====================================
// 9. UPDATE: EDIT INVENTORY
// ====================================
function editItem(id) {
  let item = items.find((item) => item.id === id);

  if (item) {
    // Populate form
    itemName.value = item.name;
    itemDescription.value = item.description;
    itemQuantity.value = item.quantity;
    itemPrice.value = item.price;
    itemCategory.value = item.category || "";
    itemType.value = item.type || "";
    editId = id;

    // Make image optional on edit
    itemImage.required = false;
    submitBtn.textContent = "Update Item"; // Updates to context-specific label

    // Populate card simulation
    setPreviewFromItem(item);

    form.scrollIntoView({ behavior: "smooth" });
  }
}

// ====================================
// 10. DELETE BUTTON LOGIC
// ====================================
deleteBtn.addEventListener("click", function () {
  actionMenu.classList.remove("active");
  deleteItem(selectedId);
});

// ====================================
// 11. DELETE: REMOVE INVENTORY
// ====================================
function deleteItem(id) {
  let confirmation = confirm("Are you sure you want to delete this item?");
  if (confirmation) {
    let index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items.splice(index, 1);
    }
    // If user deleted the item they were currently editing
    if (editId === id) {
      editId = null;
      form.reset();
      resetPreview();
      itemImage.required = true;
      submitBtn.textContent = "Add Item"; // Reset string
    }
    saveData();
    displayItems();
    notify("Item deleted successfully!", "success");
  }
}

// ====================================
// 12. INITIALIZE
// ====================================
displayItems();
