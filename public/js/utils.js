// public/js/utils.js

const statusLabels = {
  received: "Recebido",
  analysis: "Em Análise",
  maintenance: "Em Manutenção",
  finished: "Finalizado",
  canceled: "Cancelado", // Se você usar esta opção
};
window.statusLabels = statusLabels;

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
window.formatDate = formatDate;

function createStatusBadge(status) {
  const badge = document.createElement("span");
  // Ensure status is not null or undefined before calling toLowerCase
  const statusClass = status ? status.toLowerCase() : "unknown";
  badge.className = `status-badge status-${statusClass}`;
  badge.textContent = statusLabels[statusClass] || status || "N/A";
  return badge;
}
window.createStatusBadge = createStatusBadge;

function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.warn("Toast container not found. Toast not shown:", message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Add ability to dismiss toast by clicking on it
  toast.addEventListener("click", () => {
    toast.style.opacity = "0"; // Start fade out
    setTimeout(() => {
      toast.remove();
    }, 300); // Remove after fade out
  });

  // Auto-remove after 3 seconds if not clicked
  setTimeout(() => {
    if (toast.parentElement) {
      // Check if it hasn't been removed by click
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }, 3000);
}
window.showToast = showToast;

function formatCPF(cpf) {
  if (!cpf) return "";
  cpf = String(cpf).replace(/\D/g, ""); // Garante que cpf é string, remove não-dígitos
  cpf = cpf.substring(0, 11); // Limita a 11 dígitos
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o primeiro ponto: XXX.X
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2"); // Coloca o segundo ponto: XXX.XXX.X (aplicado ao resultado anterior)
  // A LINHA ABAIXO É A QUE COLOCA O TRAÇO
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); // Coloca o traço: XXX.XXX.XXX-XX
  return cpf;
}
window.formatCPF = formatCPF;

function formatPhone(phone) {
  if (!phone) return "";
  phone = String(phone).replace(/\D/g, ""); // Ensure phone is a string
  phone = phone.substring(0, 11);
  if (phone.length === 11) {
    phone = phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (phone.length === 10) {
    phone = phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (phone.length > 2) {
    // Ensure there are enough digits for area code
    phone = `(${phone.substring(0, 2)}) ${phone.substring(2)}`;
  } else {
    // Handle cases with 2 or less digits if necessary, or just return as is
    // For now, returns as is if not 10 or 11 digits and not enough for (XX) X...
  }
  return phone;
}
window.formatPhone = formatPhone;

// Mobile Menu Toggle for main navigation (used in adminDashboard.js and clientDashboard.js)
// This function is generic enough to be here if multiple pages use similar toggles,
// but specific menu logic is now in adminDashboard.js and clientDashboard.js
// For this utils.js, we can keep it as a generic toggle example or remove if not used directly by other pages
function initializeMenuToggle(toggleButtonId, menuId) {
  const menuToggleButton = document.getElementById(toggleButtonId);
  const navMenu = document.getElementById(menuId);

  if (menuToggleButton && navMenu) {
    menuToggleButton.addEventListener("click", () => {
      const isHidden = navMenu.classList.toggle("hidden");
      // For accessibility:
      menuToggleButton.setAttribute("aria-expanded", String(!isHidden));
      // Additional logic for flex/md:flex can be handled here or in specific dashboard JS
      if (!isHidden) {
        navMenu.classList.add("flex"); // Show as flex
        navMenu.classList.remove("md:flex"); // Temporarily remove md:flex for open mobile menu
      } else {
        navMenu.classList.remove("flex");
        navMenu.classList.add("md:flex"); // Restore md:flex for larger screens when hidden
      }
    });
  }
}
// Example of how you might call it if pages had consistent IDs and wanted this util to handle it:
// document.addEventListener('DOMContentLoaded', () => {
//   initializeMenuToggle('menu-toggle', 'main-nav');
// });
// However, current implementation has this logic within dashboard JS files.

// Adjust body padding for fixed header
function adjustBodyPaddingForFixedHeader() {
  const body = document.querySelector(
    // Added .update-profile-page for the new page, ensure this class is on its body tag
    "body.auth-page-body, body.admin-dashboard-page, body.client-dashboard-page, body.new-service-page, body.landing-page-body, body.update-profile-page"
  );
  // More robust header selection, assuming only one main fixed header
  const header = document.querySelector(
    "body > header.fixed.bg-techfix-dark-blue"
  );

  if (body && header) {
    const headerHeight = header.offsetHeight;
    body.style.paddingTop = `${headerHeight}px`;
  } else if (body) {
    // If no fixed header, ensure padding is reset
    body.style.paddingTop = "0";
  }
}

// Call on load and resize
document.addEventListener("DOMContentLoaded", adjustBodyPaddingForFixedHeader);
window.addEventListener("resize", adjustBodyPaddingForFixedHeader);
// Make it globally available if called from other scripts, though DOMContentLoaded and resize should cover it.
window.adjustBodyPaddingForFixedHeader = adjustBodyPaddingForFixedHeader;

// Function to display form-level messages (e.g., for signup, login, update profile)
function displayFormMessage(formElement, message, type, messageDivId) {
  const messageDiv = document.getElementById(messageDivId);
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = "form-feedback-message hidden"; // Reset classes
    if (message && type) {
      messageDiv.classList.add(type); // 'error', 'success', 'info'
      messageDiv.classList.remove("hidden");
    } else {
      messageDiv.classList.add("hidden"); // Hide if no message or type
    }
  }
}
window.displayFormMessage = displayFormMessage;

// Function to display input-specific error messages
function displayInputError(inputId, message, errorDivIdSuffix = "-error") {
  const errorDiv = document.getElementById(`${inputId}${errorDivIdSuffix}`);
  if (errorDiv) {
    errorDiv.textContent = message || ""; // Clear if no message
    errorDiv.classList.toggle("hidden", !message);
  }
}
window.displayInputError = displayInputError;

// Function to clear all input errors within a form
function clearAllInputErrors(
  formElement,
  errorDivClass = "input-field-error-text"
) {
  if (formElement) {
    formElement.querySelectorAll(`.${errorDivClass}`).forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
  }
}
window.clearAllInputErrors = clearAllInputErrors;
