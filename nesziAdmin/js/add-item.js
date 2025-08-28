// js/add-items.js

import { makeAuthenticatedRequest } from "./api.js";
import { showToast } from "./utils/alert.js";
import { BrowserMultiFormatReader } from "https://cdn.skypack.dev/@zxing/browser";

let quill;
let currentInput = null;
let codeReader = null;
let videoControls = null;

// Helper function to add a green highlight for a successful scan for 2 seconds.
function setInputSuccessState(inputElement) {
  if (inputElement) {
    inputElement.classList.add("scan-success");
    setTimeout(() => {
      inputElement.classList.remove("scan-success");
    }, 2000);
  }
}

/**
 * Starts the local barcode scanner.
 * @param {HTMLElement} inputElement The input field to populate with the scan result.
 */
async function startLocalScanner(inputElement) {
  currentInput = inputElement;
  stopAllScanners(); // Stop any previous scanner instance to prevent conflicts.

  const scannerModal = document.getElementById("scanner-modal");
  if (scannerModal) {
    scannerModal.style.display = "flex";
    scannerModal.querySelector("#reader").style.display = "block"; // Show the video element
    scannerModal.querySelector(".scanner-status").textContent =
      "Scanning with local camera...";

    // Hide the toggle button as we are not switching to a remote scanner
    const toggleScannerBtn = document.getElementById("toggle-scanner-btn");
    if (toggleScannerBtn) {
      toggleScannerBtn.style.display = "none";
    }
  }

  codeReader = new BrowserMultiFormatReader();

  try {
    const videoInputDevices =
      await BrowserMultiFormatReader.listVideoInputDevices();
    const selectedDeviceId = videoInputDevices.find(
      (device) => device.kind === "videoinput"
    )?.deviceId;

    if (!selectedDeviceId) {
      throw new Error(
        "No camera found. Please ensure camera permissions are granted."
      );
    }

    videoControls = await codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      "reader",
      (result, error, controls) => {
        if (result) {
          if (currentInput) {
            currentInput.value = result.getText();
            setInputSuccessState(currentInput);
            stopAllScanners();
          }
        }
        // Only log unexpected scanning errors, not the common "NotFoundException".
        if (
          error &&
          error.name !== "NotFoundException" &&
          error.name !== "FormatException"
        ) {
          console.error("Scanning error:", error);
        }
      }
    );
  } catch (err) {
    console.error("Failed to start local scanner:", err);
    showToast(err.message, "error");
    stopAllScanners();
  }
}

/**
 * Stops all scanner functionalities and resets the UI.
 */
function stopAllScanners() {
  if (videoControls) {
    videoControls.stop();
    videoControls = null;
  }
  const scannerModal = document.getElementById("scanner-modal");
  if (scannerModal) {
    scannerModal.style.display = "none";
  }
  currentInput = null;
  codeReader = null;
}

/**
 * Manages the tags input field, allowing users to add and remove tags.
 * @param {HTMLElement} tagInput The input field for tags.
 * @param {HTMLElement} tagsContainer The container for the tags.
 */
function setupTagsInput(tagInput, tagsContainer) {
  if (!tagInput || !tagsContainer) return;

  tagInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && tagInput.value.trim()) {
      e.preventDefault();
      const tagText = tagInput.value.trim();
      const existingTags = Array.from(tagsContainer.children).map((tag) =>
        tag.textContent.slice(0, -1)
      );
      if (existingTags.includes(tagText)) {
        tagInput.value = "";
        return;
      }

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagText;
      tag.innerHTML += `<span class="remove" title="Remove tag">×</span>`;
      tagsContainer.appendChild(tag);
      tagInput.value = "";

      tag.querySelector(".remove").addEventListener("click", () => {
        tag.remove();
      });
    }
  });
}

/**
 * Dynamically generates inventory input fields based on the stock count.
 * @param {number} stockCount The number of stock items.
 */
function generateInventoryFields(stockCount) {
  const inventoryContainer = document.getElementById("inventoryContainer");
  const inventoryFieldsContainer = document.getElementById("inventoryFields");

  if (!inventoryContainer || !inventoryFieldsContainer) {
    console.error("Inventory containers not found.");
    return;
  }

  inventoryContainer.innerHTML = "";
  const count = parseInt(stockCount, 10);
  if (isNaN(count) || count <= 0) {
    inventoryFieldsContainer.style.display = "none";
    return;
  }

  inventoryFieldsContainer.style.display = "block";

  for (let i = 0; i < count; i++) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "inventory-item";
    itemDiv.innerHTML = `
            <label>Item ${i + 1}</label>
            <div class="inventory-inputs">
                <input type="text" id="barcode-${i}" placeholder="Barcode" required autocomplete="off" />
                <button type="button" class="scan-btn" data-input-id="barcode-${i}" aria-label="Scan barcode for item ${
      i + 1
    }">Scan</button>
                <input type="text" id="serial-${i}" placeholder="Serial Number" required autocomplete="off" />
                <button type="button" class="scan-btn" data-input-id="serial-${i}" aria-label="Scan serial number for item ${
      i + 1
    }">Scan</button>
            </div>
        `;
    inventoryContainer.appendChild(itemDiv);
  }

  document.querySelectorAll(".scan-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const inputId = button.dataset.inputId;
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        startLocalScanner(inputElement);
      }
    });
  });
}

/**
 * Toggles the loading state of the form submission button.
 * @param {boolean} isLoading True to show loading, false to hide.
 */
function showLoading(isLoading) {
  const submitBtn = document.querySelector("#addProductForm .btn--primary");
  if (!submitBtn) return;
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Adding Product...`;
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `Add Product`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const addProductForm = document.getElementById("addProductForm");
  const formSkeleton = document.getElementById("form-skeleton");
  const tagsContainer = document.querySelector(".tags-container");
  const tagInput = document.getElementById("tagInput");
  const productStockInput = document.getElementById("productStock");
  const richEditor = document.getElementById("rich-editor");
  const scannerModal = document.getElementById("scanner-modal");
  const scannerCloseBtn = document.getElementById("scanner-close");

  if (richEditor) {
    quill = new Quill(richEditor, {
      theme: "snow",
      placeholder: "Write a rich description...",
    });
  }

  if (tagInput && tagsContainer) {
    setupTagsInput(tagInput, tagsContainer);
  }

  if (productStockInput) {
    productStockInput.addEventListener("input", function () {
      generateInventoryFields(this.value);
    });
  }

  if (scannerCloseBtn) {
    scannerCloseBtn.addEventListener("click", stopAllScanners);
  }

  // The toggle button and its listener are now completely removed
  // as the remote scanner functionality is no longer needed.

  if (addProductForm) {
    addProductForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showLoading(true);

      try {
        // Form data collection
        const productName = document.getElementById("productName").value.trim();
        const productBrand = document
          .getElementById("productBrand")
          .value.trim();
        const productPriceValue = document
          .getElementById("productPrice")
          .value.trim();
        const productImageInput = document.getElementById("productImage");
        const productDescription = document
          .getElementById("productDescription")
          .value.trim();
        const richDescription = quill ? quill.root.innerHTML : "";
        const stockQuantity = parseInt(productStockInput.value, 10) || 0;

        // Form validation
        if (
          !productName ||
          !productBrand ||
          !productPriceValue ||
          !productImageInput.files[0]
        ) {
          showToast("Please fill in all required product details.", "error");
          return;
        }

        // Inventory validation
        const inventoryItems = [];
        for (let i = 0; i < stockQuantity; i++) {
          const barcodeInput = document.getElementById(`barcode-${i}`);
          const serialInput = document.getElementById(`serial-${i}`);

          if (!barcodeInput || !serialInput) {
            showToast(
              "Inventory inputs are missing. Check your form.",
              "error"
            );
            return;
          }

          const barcode = barcodeInput.value.trim();
          const serialNumber = serialInput.value.trim();

          if (!barcode || !serialNumber) {
            showToast(
              `Please fill in both barcode and serial number for item ${
                i + 1
              }.`,
              "warning"
            );
            return;
          }
          inventoryItems.push({ barcode, serial_number: serialNumber });
        }

        const keywords = Array.from(tagsContainer.children).map((tag) =>
          tag.textContent.slice(0, -1).trim()
        );

        // Prepare and send API request
        const formData = new FormData();
        formData.append("name", productName);
        formData.append("description", productDescription);
        formData.append("rich_description", richDescription);
        formData.append("brand", productBrand);
        formData.append(
          "price_cents",
          Math.round(parseFloat(productPriceValue) * 100)
        );
        formData.append(
          "is_featured",
          document.getElementById("isFeatured").checked
        );
        formData.append("keywords", JSON.stringify(keywords));
        formData.append("image", productImageInput.files[0]);
        formData.append("inventory_items", JSON.stringify(inventoryItems));

        const response = await makeAuthenticatedRequest(
          "http://localhost:5000/api/admin/products",
          "POST",
          formData,
          true
        );

        if (response) {
          showToast("Product added successfully!", "success");
          addProductForm.reset();
          if (quill) quill.setContents([]);
          tagsContainer.innerHTML = "";
          generateInventoryFields(0); // Hide inventory fields after successful submission
        } else {
          showToast("Failed to add product.", "error");
        }
      } catch (error) {
        console.error("Error adding product:", error);
        showToast(
          "An unexpected error occurred. Please check the console.",
          "error"
        );
      } finally {
        showLoading(false);
      }
    });
  }

  // Hide the skeleton and show the form after all initializations are complete.
  if (formSkeleton && addProductForm) {
    formSkeleton.style.display = "none";
    addProductForm.style.display = "grid";
  }
});
