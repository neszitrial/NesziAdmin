// Sidebar Toggle & Navigation, API Calls, and Event Handling
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".sidebar a");
  const mainContent = document.querySelector(".main-content");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const productListBody = document.getElementById("productListBody");
  const ordersList = document.getElementById("ordersList");
  const addProductForm = document.getElementById("addProductForm");
  const editProductForm = document.getElementById("editProductForm");
  const tagsContainer = document.querySelector(".tags-container");
  const tagInput = document.querySelector(".tag-input");
  const modal = document.getElementById("editModal");
  const closeModal = document.querySelector(".close");

  // API Configuration
  const API_BASE_URL = "http://localhost:5000/api/admin";

  let quill;

  // --- Utility Functions ---

  function showLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }
  }

  function hideLoading() {
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }

  async function makeAuthenticatedRequest(
    url,
    method = "GET",
    body = null,
    isFormData = false
  ) {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("Session expired. Please log in again.");
      window.location.href = "index.html";
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Do NOT set Content-Type header manually for FormData
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const config = { method, headers };

    if (body) {
      if (isFormData) {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      showLoading();
      const response = await fetch(url, config);
      hideLoading();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("adminToken");
        window.location.href = "index.html";
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request Failed:", error);
      hideLoading();
      alert(`Error: ${error.message}`);
      return null;
    }
  }

  // --- Login & Auth ---

  function checkAuth() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "index.html";
    } else {
      initializeDashboard();
    }
  }

  function handleLogin() {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("adminToken", data.token);
          window.location.href = "dashboard.html";
        } else {
          alert(`Login failed: ${data.error}`);
        }
      } catch (error) {
        console.error("Login Error:", error);
        alert("An error occurred during login. Please try again.");
      }
    });
  }

  // --- Dashboard Initialization ---

  async function initializeDashboard() {
    // Initialize Quill Editor for rich text
    const richEditor = document.getElementById("rich-editor");
    if (richEditor) {
      quill = new Quill("#rich-editor", {
        theme: "snow",
        placeholder: "Write a rich description...",
      });
    }

    // Sidebar Navigation
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("href").slice(1);

        pages.forEach((page) => page.classList.remove("active"));
        const targetPage = document.getElementById(target);
        if (targetPage) {
          targetPage.classList.add("active");
        }

        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");

        // Fetch data for the active page
        if (target === "list-items") fetchProducts();
        if (target === "orders") fetchOrders();
      });
    });

    // Logout Button
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to log out?")) {
          localStorage.removeItem("adminToken");
          window.location.href = "index.html";
        }
      });
    }

    // Tags Input for Add Product Form
    if (tagInput && tagsContainer) {
      tagInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter" && tagInput.value.trim()) {
          e.preventDefault();
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = tagInput.value.trim();
          tag.innerHTML += `<span class="remove">×</span>`;
          tagsContainer.appendChild(tag);
          tagInput.value = "";

          tag.querySelector(".remove").addEventListener("click", () => {
            tag.remove();
          });
        }
      });
    }

    // Add Product Form Submission
    if (addProductForm) {
      addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Create a new FormData object
        const formData = new FormData();

        // Append all form fields, including the file
        formData.append("name", document.getElementById("productName").value);
        formData.append(
          "description",
          document.getElementById("productDescription").value
        );
        formData.append(
          "rich_description",
          quill ? quill.root.innerHTML : null
        );
        formData.append("brand", document.getElementById("productBrand").value);
        formData.append(
          "price_cents",
          Math.round(
            parseFloat(document.getElementById("productPrice").value) * 100
          )
        );
        formData.append(
          "stock_quantity",
          parseInt(document.getElementById("productStock").value, 10)
        );
        // Check if the is_featured checkbox is checked and append accordingly
        const isFeatured = document.getElementById("isFeatured").checked;
        formData.append("is_featured", isFeatured);

        // Get the keywords from the tags container
        const keywords = Array.from(tagsContainer.children).map((tag) =>
          tag.textContent.slice(0, -1)
        );
        formData.append("keywords", JSON.stringify(keywords)); // Stringify array for transport

        // **Append the image file from the input field**
        const imageFile = document.getElementById("productImage").files[0];
        if (imageFile) {
          formData.append("image", imageFile);
        } else {
          alert("Please select a product image.");
          return;
        }

        // Call the updated request function with FormData
        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/products`,
          "POST",
          formData,
          true // Pass a flag to indicate FormData is being used
        );

        if (response) {
          alert("Product added successfully!");
          addProductForm.reset();
          if (quill) quill.setContents([]);
          tagsContainer.innerHTML = "";
          fetchProducts(); // Refresh the product list
        }
      });
    }

    // Edit Modal Logic
    if (modal) {
      closeModal.onclick = () => {
        modal.style.display = "none";
      };
      window.onclick = (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      };
    }

    if (editProductForm) {
      editProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const productId = document.getElementById("editProductId").value;
        const updatedData = {
          name: document.getElementById("editProductName").value,
          description: document.getElementById("editProductDescription").value,
          price_cents: Math.round(
            parseFloat(document.getElementById("editProductPrice").value) * 100
          ),
          stock_quantity: parseInt(
            document.getElementById("editProductStock").value
          ),
        };

        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/products/${productId}`,
          "PUT",
          updatedData
        );
        if (response) {
          alert("Product updated successfully!");
          modal.style.display = "none";
          fetchProducts();
        }
      });
    }

    // Initial data fetch for the first page
    fetchProducts();
  }

  // --- Data Fetching & Rendering ---

  async function fetchProducts() {
    if (!productListBody) return;
    const products = await makeAuthenticatedRequest(`${API_BASE_URL}/products`);
    if (!products) return;

    productListBody.innerHTML = "";
    products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td><img src="${product.image}" alt="${product.name}" /></td>
                <td>${product.name}</td>
                <td>KES ${(product.price_cents / 100).toFixed(2)}</td>
                <td>${product.stock_quantity}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${
                      product.id
                    }" data-name="${product.name}" data-desc="${
        product.description
      }" data-price="${product.price_cents / 100}" data-stock="${
        product.stock_quantity
      }">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${
                      product.id
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      productListBody.appendChild(row);
    });

    // Add event listeners for new buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const productId = e.currentTarget.dataset.id;
        const productName = e.currentTarget.dataset.name;
        const productDesc = e.currentTarget.dataset.desc;
        const productPrice = e.currentTarget.dataset.price;
        const productStock = e.currentTarget.dataset.stock;

        document.getElementById("editProductId").value = productId;
        document.getElementById("editProductName").value = productName;
        document.getElementById("editProductDescription").value = productDesc;
        document.getElementById("editProductPrice").value = productPrice;
        document.getElementById("editProductStock").value = productStock;

        modal.style.display = "flex";
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const productId = e.currentTarget.dataset.id;
        if (
          confirm(`Are you sure you want to delete product ID: ${productId}?`)
        ) {
          const response = await makeAuthenticatedRequest(
            `${API_BASE_URL}/products/${productId}`,
            "DELETE"
          );
          if (response) {
            alert(response.message);
            fetchProducts();
          }
        }
      });
    });
  }

  async function fetchOrders() {
    if (!ordersList) return;
    const orders = await makeAuthenticatedRequest(`${API_BASE_URL}/orders`);
    if (!orders) return;

    ordersList.innerHTML = "";
    orders.forEach((order) => {
      const orderCard = document.createElement("div");
      orderCard.className = "order-card";
      orderCard.innerHTML = `
                <div class="col"><i class="fas fa-box-open fa-2x"></i></div>
                <div class="col">
                    <strong>Order ID:</strong> #${order.id}<br>
                    <strong>Customer:</strong> ${order.user_name}<br>
                    <strong>Address:</strong> ${
                      order.delivery_address.street
                    }, ${order.delivery_address.city}<br>
                    <strong>Items:</strong><ul>${order.items
                      .map((item) => `<li>${item.name} x${item.quantity}</li>`)
                      .join("")}</ul>
                </div>
                <div class="col">
                    <strong>Total Items:</strong> ${order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}<br>
                    <strong>Method:</strong> ${order.payment_method}<br>
                    <strong>Receipt #:</strong> ${
                      order.mpesa_receipt_number || "N/A"
                    }<br>
                    <strong>Time:</strong> ${new Date(
                      order.order_time
                    ).toLocaleString()}
                </div>
                <div class="col">
                    <strong>KES ${(order.total_cost_cents / 100).toFixed(
                      2
                    )}</strong>
                </div>
                <div class="col">
                    <select class="status-dropdown" data-order-id="${order.id}">
                        <option value="Pending" ${
                          order.status === "Pending" ? "selected" : ""
                        }>Pending</option>
                        <option value="Packing" ${
                          order.status === "Packing" ? "selected" : ""
                        }>Packing</option>
                        <option value="Shipped" ${
                          order.status === "Shipped" ? "selected" : ""
                        }>Shipped</option>
                        <option value="Out for Delivery" ${
                          order.status === "Out for Delivery" ? "selected" : ""
                        }>Out for Delivery</option>
                        <option value="Delivered" ${
                          order.status === "Delivered" ? "selected" : ""
                        }>Delivered</option>
                    </select>
                </div>
            `;
      ordersList.appendChild(orderCard);
    });

    // Add event listener for status change
    document.querySelectorAll(".status-dropdown").forEach((dropdown) => {
      dropdown.addEventListener("change", async (e) => {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.value;
        const response = await makeAuthenticatedRequest(
          `${API_BASE_URL}/orders/${orderId}/status`,
          "PUT",
          { status: newStatus }
        );
        if (response) {
          alert(`Order #${orderId} status updated to ${newStatus}`);
        }
      });
    });
  }

  // Determine whether to handle login or dashboard
  if (mainContent) {
    checkAuth();
  } else if (loginForm) {
    handleLogin();
  }
});
