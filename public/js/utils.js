// public/js/utils.js

const statusLabels = {
  received: "Recebido",
  analysis: "Em Análise",
  maintenance: "Em Manutenção",
  finished: "Finalizado",
  canceled: "Cancelado",
};
window.statusLabels = statusLabels;

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    // Opcional: adicionar hora se relevante para alguma visualização
    // hour: '2-digit',
    // minute: '2-digit',
  });
}
window.formatDate = formatDate;

function createStatusBadge(status) {
  const badge = document.createElement("span");
  const statusClass = status ? status.toLowerCase() : "unknown";
  badge.className = `status-badge status-${statusClass}`;
  badge.textContent = statusLabels[statusClass] || status || "N/A";
  return badge;
}
window.createStatusBadge = createStatusBadge;

function showToast(message, type = "info", autoDismiss = true) {
  // Adicionado autoDismiss
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    console.warn("Toast container not found. Toast não exibido:", message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type.replace("_no_timeout", "")} ${
    type.startsWith("info")
      ? "toast-info"
      : type.startsWith("success")
      ? "toast-success"
      : "toast-error"
  }`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  toast.addEventListener("click", () => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  });

  if (autoDismiss && type !== "info_no_timeout") {
    // Não autodispensa se for info_no_timeout
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = "0";
        setTimeout(() => {
          toast.remove();
        }, 300);
      }
    }, 3000);
  }
}
window.showToast = showToast;

function formatCPF(cpf) {
  if (!cpf) return "";
  cpf = String(cpf).replace(/\D/g, "");
  cpf = cpf.substring(0, 11);
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return cpf;
}
window.formatCPF = formatCPF;

function formatPhone(phone) {
  if (!phone) return "";
  phone = String(phone).replace(/\D/g, "");
  phone = phone.substring(0, 11);
  if (phone.length === 11) {
    phone = phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (phone.length === 10) {
    phone = phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (phone.length > 2) {
    phone = `(${phone.substring(0, 2)}) ${phone.substring(2)}`;
  }
  return phone;
}
window.formatPhone = formatPhone;

function adjustBodyPaddingForFixedHeader() {
  const body = document.querySelector(
    "body.auth-page-body, body.admin-dashboard-page, body.client-dashboard-page, body.new-service-page, body.landing-page-body, body.update-profile-page"
  );
  const header = document.querySelector("body > header.fixed.site-header"); // Usar site-header para ser mais específico

  if (body && header) {
    const headerHeight = header.offsetHeight;
    body.style.paddingTop = `${headerHeight}px`;
  } else if (body) {
    body.style.paddingTop = "0";
  }
}

document.addEventListener("DOMContentLoaded", adjustBodyPaddingForFixedHeader);
window.addEventListener("resize", adjustBodyPaddingForFixedHeader);
window.adjustBodyPaddingForFixedHeader = adjustBodyPaddingForFixedHeader;

function displayFormMessage(formElement, message, type, messageDivId) {
  const messageDiv = document.getElementById(messageDivId);
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = "form-feedback-message hidden";
    if (message && type) {
      messageDiv.classList.add(type);
      messageDiv.classList.remove("hidden");
    } else {
      messageDiv.classList.add("hidden");
    }
  }
}
window.displayFormMessage = displayFormMessage;

function displayInputError(inputId, message, errorDivIdSuffix = "-error") {
  const errorDiv = document.getElementById(`${inputId}${errorDivIdSuffix}`);
  if (errorDiv) {
    errorDiv.textContent = message || "";
    errorDiv.classList.toggle("hidden", !message);
  }
}
window.displayInputError = displayInputError;

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

// Ajuste no listener do menu toggle para adminDashboard e clientDashboard
// (Se o menu toggle for o mesmo ID para ambos)
// Essa lógica de toggle pode ser mais bem centralizada no JS de cada dashboard se forem diferentes.
// Por enquanto, assumindo que é genérico
function initializeMobileMenuToggle(
  toggleButtonId,
  menuId,
  navLinksContainerId
) {
  const menuToggleButton = document.getElementById(toggleButtonId);
  const mainNav = document.getElementById(navLinksContainerId); // O contêiner dos links de navegação

  if (menuToggleButton && mainNav) {
    menuToggleButton.addEventListener("click", () => {
      const isHidden = mainNav.classList.toggle("hidden");
      mainNav.classList.toggle("flex", !isHidden); // Adiciona flex se não estiver hidden
      mainNav.classList.toggle("md:flex", isHidden); // Garante md:flex quando escondido (para desktop)

      menuToggleButton.setAttribute("aria-expanded", String(!isHidden));
    });
  }
}
// Chamada no adminDashboard.js e clientDashboard.js:
// initializeMobileMenuToggle('menu-toggle', 'main-nav', 'main-nav'); // Assumindo que 'main-nav' é o container dos links.
