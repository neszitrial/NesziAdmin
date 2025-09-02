// js/components/admin-header.js

import { showToast } from "../js/utils/alert.js";

class AdminHeader extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setActiveLink();
    this.checkAuth();
  }

  render() {
    this.innerHTML = `
      <header class="admin-header">
        <div class="logo">
          <img src="../assets/logo.svg" alt="Pawa" />
        </div>
        <div class="header-actions">
          <button id="theme-toggle" class="btn btn--icon" aria-label="Toggle theme">
            <i class="fas fa-sun"></i>
          </button>
          <button id="logoutBtn" class="btn btn--secondary" aria-label="Logout">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <aside id="sidebar" class="sidebar">
        <nav>
          <ul>
            <li>
              <a href="add-items.html" aria-label="Add Items">
                <i class="fas fa-plus-circle"></i> <span>Add Items</span>
              </a>
            </li>
            <li>
              <a href="list-items.html" aria-label="List Items">
                <i class="fas fa-list"></i> <span>List Items</span>
              </a>
            </li>
            <li>
              <a href="orders.html" aria-label="Orders">
                <i class="fas fa-box"></i> <span>Orders</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    `;
  }

  setupEventListeners() {
    const logoutBtn = this.querySelector("#logoutBtn");
    const themeToggleBtn = this.querySelector("#theme-toggle");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.handleLogout);
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    // Set the initial theme on component load
    this.themeManager();
  }

  async handleLogout() {
    // Get the admin-popup instance from the document body
    const adminPopup = document.querySelector("admin-popup");

    if (!adminPopup) {
      console.error("Admin popup component not found.");
      return;
    }

    try {
      // Use the custom popup for confirmation
      const userConfirmed = await adminPopup.confirm({
        title: "Confirm Logout",
        message: "Are you sure you want to log out?",
        iconClass: "fa-sign-out-alt",
      });

      if (userConfirmed) {
        // Show a "Goodbye" toast message after confirmation
        showToast("Goodbye! Logging you out...", "success");

        // Clear the token and redirect after a short delay
        setTimeout(() => {
          localStorage.removeItem("adminToken");
          window.location.href = "index.html";
        }, 1500); // Wait for the toast to be seen
      }
    } catch (error) {
      // Catch any potential errors from the popup confirmation promise
      console.error("Logout process failed:", error);
      showToast("An error occurred during logout.", "error");
    }
  }

  toggleTheme() {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    const themeIcon = this.querySelector("#theme-toggle i");

    // Update the icon and localStorage based on the new theme
    if (isDarkMode) {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      localStorage.setItem("theme", "dark");
    } else {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      localStorage.setItem("theme", "light");
    }
  }

  themeManager() {
    const storedTheme = localStorage.getItem("theme");
    const themeIcon = this.querySelector("#theme-toggle i");

    if (storedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
    } else {
      document.body.classList.remove("dark-mode");
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
    }
  }

  setActiveLink() {
    const navLinks = this.querySelectorAll(".sidebar a");
    const currentPath = window.location.pathname.split("/").pop();

    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("href");
      if (linkPath === currentPath) {
        link.classList.add("active");
      }
    });
  }

  checkAuth() {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "index.html";
    }
  }
}

customElements.define("admin-header", AdminHeader);
