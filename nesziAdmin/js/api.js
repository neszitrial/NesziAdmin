// js/api.js

const API_BASE_URL = "https://neszi-backend.onrender.com/api/admin";
const loadingIndicator = document.getElementById("loadingIndicator");

export function showLoading() {
  if (loadingIndicator) {
    loadingIndicator.style.display = "flex";
  }
}

export function hideLoading() {
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

export async function makeAuthenticatedRequest(
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
