// js/list-items.js

import { makeAuthenticatedRequest } from "./api.js";
import { showToast } from "./utils/alert.js";
import { Html5Qrcode } from "html5-qrcode";

// Global variables for DOM elements, initialized inside DOMContentLoaded
let productListContainer;
let loadingIndicator;
let editModal;
let editProductForm;
let addInventoryModal;
let addInventoryForm;
let inventoryQuantityInput;
let dynamicInputsContainer;
let singleScannerContainer;
let adminPopup; // New global variable for the popup

let singleScannerInstance = null;

// Helper function to start the single barcode scanner
function startSingleScanner() {
  if (!Html5Qrcode) {
    console.error("Html5Qrcode is not loaded or not available.");
    return;
  }

  // Hide the dynamic inputs container when the scanner is active
  if (dynamicInputsContainer) {
    dynamicInputsContainer.style.display = "none";
  }

  if (singleScannerInstance) {
    singleScannerContainer.style.display = "block";
    return;
  }

  singleScannerInstance = new Html5Qrcode(singleScannerContainer.id);
  const qrCodeConfig = { fps: 10, qrbox: { width: 250, height: 100 } };

  singleScannerInstance
    .start(
      { facingMode: "environment" },
      qrCodeConfig,
      (decodedText) => {
        // Find the first empty barcode input and populate it
        const emptyInput = dynamicInputsContainer.querySelector(
          'input[type="text"]:not([value])'
        );
        if (emptyInput) {
          emptyInput.value = decodedText;
          showToast(`Scanned: ${decodedText}`, "success");
        } else {
          showToast("All barcode fields are full.", "warning");
        }
        // Keep the scanner running for multiple scans if needed
      },
      (errorMessage) => {
        console.error(`Scanner error: ${errorMessage}`);
      }
    )
    .catch((err) => {
      console.error("Failed to start scanner:", err);
      showToast(
        "Failed to start scanner. Please ensure your camera is enabled.",
        "error"
      );
    });
}

// Helper function to stop the single barcode scanner
function stopSingleScanner() {
  if (singleScannerInstance && singleScannerInstance.isScanning) {
    singleScannerInstance.stop().catch((err) => {
      console.error("Failed to stop scanner:", err);
    });
    singleScannerInstance = null;
  }
}

// Function to generate dynamic barcode inputs
function generateDynamicInputs(quantity) {
  if (dynamicInputsContainer) {
    dynamicInputsContainer.innerHTML = ""; // Clear previous inputs
    dynamicInputsContainer.style.display = "block";

    for (let i = 0; i < quantity; i++) {
      const inputGroup = document.createElement("div");
      inputGroup.classList.add("form-group");

      const label = document.createElement("label");
      label.textContent = `Barcode ${i + 1}`;

      const input = document.createElement("input");
      input.type = "text";
      input.name = `barcode-${i}`;
      input.placeholder = `Scan or type barcode ${i + 1}`;
      input.required = true;

      inputGroup.appendChild(label);
      inputGroup.appendChild(input);
      dynamicInputsContainer.appendChild(inputGroup);
    }
  }
}

// ----------------------------------------------------
// Core Product Fetch and Rendering
// ----------------------------------------------------
export async function fetchProducts() {
  if (!productListContainer) return;

  // Show the skeleton loader by default
  productListContainer.classList.remove("loaded");
  productListContainer.innerHTML = `
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-details">
        <div class="skeleton-line skeleton-name"></div>
        <div class="skeleton-line skeleton-price"></div>
      </div>
    </div>
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-details">
        <div class="skeleton-line skeleton-name"></div>
        <div class="skeleton-line skeleton-price"></div>
      </div>
    </div>
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-details">
        <div class="skeleton-line skeleton-name"></div>
        <div class="skeleton-line skeleton-price"></div>
      </div>
    </div>
  `;

  try {
    const API_BASE_URL = "http://localhost:5000/api/admin";
    const products = await makeAuthenticatedRequest(`${API_BASE_URL}/products`);

    productListContainer.innerHTML = ""; // Clear the skeletons

    if (!products || products.length === 0) {
      productListContainer.innerHTML = "<p>No products found.</p>";
      return;
    }

    products.forEach((product) => {
      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML = `
        <img src="${product.image}" alt="${
        product.name
      }" class="product-image" />
        <div class="product-details">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">KES ${(product.price_cents / 100).toFixed(
            2
          )}</p>
        </div>
        <div class="card-actions">
          <button class="action-btn-add-inventory add-inventory-btn" data-id="${
            product.id
          }">
            <i class="fas fa-plus"></i>
          </button>
          <button class="action-btn-edit edit-btn"
                  data-id="${product.id}"
                  data-name="${product.name}"
                  data-desc="${product.description}"
                  data-price="${product.price_cents / 100}"
                  data-stock="${product.stock_quantity}"
                  data-image="${product.image}">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="action-btn-delete delete-btn" data-id="${product.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      productListContainer.appendChild(card);
    });
    setupEventListeners();
  } catch (error) {
    console.error("Failed to fetch products:", error);
    showToast("Failed to load products. Please try again later.", "error");
    productListContainer.innerHTML =
      "<p>Failed to load products. Please try again later.</p>";
  } finally {
    // Hide the skeletons by adding the 'loaded' class
    productListContainer.classList.add("loaded");
  }
}
// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  // Edit button click handler
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const { id, name, desc, price, stock } = e.currentTarget.dataset;
      if (editModal && editProductForm) {
        editProductForm.querySelector("#editProductId").value = id;
        editProductForm.querySelector("#editProductName").value = name;
        editProductForm.querySelector("#editProductDescription").value = desc;
        editProductForm.querySelector("#editProductPrice").value = price;
        editProductForm.querySelector("#editProductStock").value = stock;
        editModal.style.display = "flex";
      }
    });
  });

  // Delete button click handler
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.currentTarget.dataset.id;

      // Use the custom popup for confirmation
      const userConfirmed = await adminPopup.confirm({
        title: "Confirm Deletion",
        message:
          "Are you sure you want to delete this product? This action cannot be undone.",
      });

      if (userConfirmed) {
        try {
          const API_BASE_URL = "http://localhost:5000/api/admin";
          const response = await makeAuthenticatedRequest(
            `${API_BASE_URL}/products/${productId}`,
            "DELETE"
          );
          showToast(response.message, "success");
          fetchProducts();
        } catch (error) {
          console.error("Failed to delete product:", error);
          showToast(error.message || "Failed to delete product.", "error");
        }
      }
    });
  });

  // Add Inventory button click handler
  document.querySelectorAll(".add-inventory-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      if (addInventoryModal && addInventoryForm) {
        addInventoryForm.querySelector("#inventoryProductId").value = productId;
        addInventoryModal.style.display = "flex";

        // Generate inputs for the default quantity (1) when the modal opens
        const initialQuantity = parseInt(
          addInventoryForm.querySelector("#inventoryQuantity").value,
          10
        );
        generateDynamicInputs(initialQuantity);

        startSingleScanner();
      }
    });
  });

  // Listen for changes on the quantity input
  if (inventoryQuantityInput) {
    inventoryQuantityInput.addEventListener("input", (e) => {
      const quantity = parseInt(e.target.value, 10);
      if (quantity > 0) {
        generateDynamicInputs(quantity);
      } else {
        dynamicInputsContainer.innerHTML = "";
      }
    });
  }

  // Add Inventory modal close handler
  if (document.querySelector(".close-inventory-modal")) {
    document
      .querySelector(".close-inventory-modal")
      .addEventListener("click", () => {
        addInventoryModal.style.display = "none";
        stopSingleScanner();
        addInventoryForm.reset();
      });
  }

  window.addEventListener("click", (e) => {
    if (e.target === addInventoryModal) {
      addInventoryModal.style.display = "none";
      stopSingleScanner();
      addInventoryForm.reset();
    }
  });

  // Add Inventory form submission handler
  if (addInventoryForm) {
    addInventoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      stopSingleScanner();

      const productId = addInventoryForm.querySelector(
        "#inventoryProductId"
      ).value;

      const inventoryItems = [];
      const baseTimestamp = Date.now();
      let hasEmptyBarcode = false;

      // Loop through the dynamically created inputs
      const barcodeInputs =
        dynamicInputsContainer.querySelectorAll('input[type="text"]');
      for (let i = 0; i < barcodeInputs.length; i++) {
        const barcode = barcodeInputs[i].value.trim();
        if (!barcode) {
          hasEmptyBarcode = true;
          break; // Exit the loop if an empty barcode is found
        }
        const serialNumber = `${barcode}-${baseTimestamp}-${i}`;
        inventoryItems.push({
          barcode: barcode,
          serial_number: serialNumber,
        });
      }

      if (hasEmptyBarcode) {
        showToast("Please fill in all barcode fields.", "error");
        return;
      }

      if (inventoryItems.length === 0) {
        showToast(
          "No inventory items to add. Please enter at least one barcode.",
          "error"
        );
        return;
      }

      try {
        const API_BASE_URL = "http://localhost:5000/api/admin";
        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/inventory/batch`,
          "POST",
          { product_id: productId, inventory_items: inventoryItems }
        );
        showToast(response.message, "success");
        addInventoryModal.style.display = "none";
        addInventoryForm.reset();
        fetchProducts();
      } catch (error) {
        console.error("Failed to add inventory items:", error);
        showToast(error.message || "Failed to add inventory items.", "error");
      }
    });
  }

  // Edit form submission logic
  // Edit form submission logic
  if (editProductForm) {
    editProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const productId = editProductForm.querySelector("#editProductId").value;

      // Get the original image URL from the dataset of the edit button
      const originalImage = document.querySelector(
        `.edit-btn[data-id="${productId}"]`
      ).dataset.image;

      const updatedData = {
        name: editProductForm.querySelector("#editProductName").value,
        description: editProductForm.querySelector("#editProductDescription")
          .value,
        price_cents: Math.round(
          parseFloat(editProductForm.querySelector("#editProductPrice").value) *
            100
        ),
        stock_quantity: parseInt(
          editProductForm.querySelector("#editProductStock").value
        ),
        // Pass the original image URL back
        image: originalImage,
      };

      try {
        const API_BASE_URL = "http://localhost:5000/api/admin";
        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/products/${productId}`,
          "PUT",
          updatedData
        );
        showToast(response.message, "success");
        editModal.style.display = "none";
        fetchProducts();
      } catch (error) {
        console.error("Failed to update product:", error);
        showToast(error.message || "Failed to update product.", "error");
      }
    });
  }
}

// ----------------------------------------------------
// Initialize on DOMContentLoaded
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Get references to all necessary DOM elements now that they are available
  productListContainer = document.getElementById("productListContainer");
  // loadingIndicator = document.getElementById("loadingIndicator");
  editModal = document.getElementById("editModal");
  editProductForm = document.getElementById("editProductForm");
  addInventoryModal = document.getElementById("addInventoryModal");
  addInventoryForm = document.getElementById("addInventoryForm");
  inventoryQuantityInput = document.getElementById("inventoryQuantity");
  dynamicInputsContainer = document.getElementById("dynamic-inputs-container");
  singleScannerContainer = document.getElementById("scanner-container");
  adminPopup = document.querySelector("admin-popup"); // Get a reference to your custom element

  // Now that we have the elements, we can fetch products and set up listeners
  fetchProducts();
});
