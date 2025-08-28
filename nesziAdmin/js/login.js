// js/login.js

import { showToast } from "./utils/alert.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.querySelector("#loginForm button[type='submit']");
  const API_BASE_URL = "https://neszi-backend.onrender.com/api/admin";

  const showLoading = (isLoading) => {
    if (isLoading) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Logging in...
      `;
    } else {
      loginBtn.disabled = false;
      loginBtn.innerHTML = "Log In";
    }
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      showLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("adminToken", data.token);
          showToast("Login successful!", "success");
          setTimeout(() => {
            // Redirect to the correct path in the 'pages' folder
            window.location.href = "pages/list-items.html";
          }, 1000); // Wait for toast to be seen
        } else {
          showToast(`Login failed: ${data.error}`, "error");
        }
      } catch (error) {
        console.error("Login Error:", error);
        showToast("An error occurred. Please try again.", "error");
      } finally {
        showLoading(false);
      }
    });
  }
});
