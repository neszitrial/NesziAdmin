// js/components/admin-popup.js

class AdminPopup extends HTMLElement {
  connectedCallback() {
    this.render();
    this.querySelector(".close-popup-btn").addEventListener("click", () => {
      this.hide();
    });
  }

  render() {
    this.innerHTML = `
      <div id="popup-modal" class="popup-container" style="display: none;">
        <div class="popup-content">
          <button class="close-popup-btn">&times;</button>
          <i class="popup-icon fas"></i>
          <h3 class="popup-title"></h3>
          <p class="popup-message"></p>
          <div id="popup-custom-content"></div>
        </div>
      </div>
    `;
  }

  show({ title, message, iconClass }) {
    const popup = this.querySelector("#popup-modal");
    const titleElement = this.querySelector(".popup-title");
    const messageElement = this.querySelector(".popup-message");
    const iconElement = this.querySelector(".popup-icon");
    const customContentElement = this.querySelector("#popup-custom-content");

    titleElement.textContent = title || "Notification";
    messageElement.innerHTML = message;
    iconElement.className = `popup-icon fas ${iconClass || ""}`;
    customContentElement.innerHTML = "";
    popup.style.display = "flex";
  }

  showCustomContent({ title, customHtml, iconClass }) {
    const popup = this.querySelector("#popup-modal");
    const titleElement = this.querySelector(".popup-title");
    const messageElement = this.querySelector(".popup-message");
    const iconElement = this.querySelector(".popup-icon");
    const customContentElement = this.querySelector("#popup-custom-content");

    titleElement.textContent = title || "Notification";
    iconElement.className = `popup-icon fas ${iconClass || ""}`;
    messageElement.innerHTML = "";
    customContentElement.innerHTML = customHtml;
    popup.style.display = "flex";
  }

  // New method for confirmation dialog
  confirm({ title, message, iconClass = "fa-question-circle" }) {
    return new Promise((resolve) => {
      const customHtml = `
          <div class="popup-actions">
              <button id="confirm-cancel-btn" class="popup-action-btn secondary-btn">Cancel</button>
              <button id="confirm-ok-btn" class="popup-action-btn primary-btn">Okay</button>
          </div>
      `;

      // Use the showCustomContent method to display the confirmation message
      this.showCustomContent({
        title,
        iconClass,
        customHtml: `<p class="popup-message">${message}</p>${customHtml}`,
      });

      const okBtn = this.querySelector("#confirm-ok-btn");
      const cancelBtn = this.querySelector("#confirm-cancel-btn");
      const modal = this.querySelector("#popup-modal");
      const closeBtn = this.querySelector(".close-popup-btn");

      const cleanup = () => {
        okBtn.removeEventListener("click", handleOk);
        cancelBtn.removeEventListener("click", handleCancel);
        closeBtn.removeEventListener("click", handleCancel);
        modal.removeEventListener("click", handleModalClick);
        this.hide();
      };

      const handleOk = () => {
        cleanup();
        resolve(true); // Resolve with true for "Okay"
      };

      const handleCancel = () => {
        cleanup();
        resolve(false); // Resolve with false for "Cancel"
      };

      const handleModalClick = (e) => {
        if (e.target === modal) {
          handleCancel(); // Treat clicking outside the modal as a cancellation
        }
      };

      okBtn.addEventListener("click", handleOk, { once: true });
      cancelBtn.addEventListener("click", handleCancel, { once: true });
      closeBtn.addEventListener("click", handleCancel, { once: true });
      modal.addEventListener("click", handleModalClick);
    });
  }

  hide() {
    const popup = this.querySelector("#popup-modal");
    if (popup) {
      popup.style.display = "none";
    }
  }
}

customElements.define("admin-popup", AdminPopup);
