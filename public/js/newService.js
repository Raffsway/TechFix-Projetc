// public/js/newService.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("new-service-form");
  // Novos campos para dados do cliente
  const clientNameInput = document.getElementById("clientName");
  const clientPhoneInput = document.getElementById("clientPhone");
  const clientCpfInput = document.getElementById("clientCpf");

  const equipmentTypeSelect = document.getElementById("equipmentType");
  const serviceTypeSelect = document.getElementById("serviceType");
  const descriptionTextarea = document.getElementById("description");
  const imageInput = document.getElementById("photo");
  const imageUploadArea = document.getElementById("imageUploadArea");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewContainer = document.getElementById(
    "imagePreviewContainer"
  );
  const uploadIconContainer = document.getElementById("uploadIconContainer");

  // Lógica de preview da imagem com validação de tipo
  if (imageUploadArea && imageInput) {
    imageUploadArea.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];
        const allowedExtensions = /\.(jpg|jpeg|png|gif)$/i;
        if (
          !allowedTypes.includes(file.type) ||
          !allowedExtensions.test(file.name)
        ) {
          if (typeof window.showToast === "function") {
            window.showToast(
              "Tipo de arquivo inválido. Por favor, selecione uma imagem JPG, JPEG, PNG ou GIF.",
              "error"
            );
          }
          imageInput.value = "";
          imagePreview.src = "#";
          imagePreviewContainer.classList.add("hidden");
          uploadIconContainer.classList.remove("hidden");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          imagePreview.src = reader.result;
          imagePreviewContainer.classList.remove("hidden");
          uploadIconContainer.classList.add("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = "#";
        imagePreviewContainer.classList.add("hidden");
        uploadIconContainer.classList.remove("hidden");
      }
    });
  }

  // Aplicar máscaras
  if (clientCpfInput && typeof window.formatCPF === "function") {
    clientCpfInput.addEventListener("input", (e) => {
      e.target.value = window.formatCPF(e.target.value);
    });
  }
  if (clientPhoneInput && typeof window.formatPhone === "function") {
    clientPhoneInput.addEventListener("input", (e) => {
      e.target.value = window.formatPhone(e.target.value);
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";

      const clientName = clientNameInput.value.trim();
      const clientPhoneValue = clientPhoneInput.value.replace(/\D/g, ""); // Limpa para enviar apenas dígitos
      const clientCpfValue = clientCpfInput.value.replace(/\D/g, ""); // Limpa para enviar apenas dígitos
      const equipmentType = equipmentTypeSelect.value;
      const serviceType = serviceTypeSelect.value;
      const description = descriptionTextarea.value.trim();
      const photoFile = imageInput.files[0];

      // Validações básicas (incluindo os novos campos como essenciais)
      if (!clientName) {
        if (typeof window.showToast === "function")
          window.showToast("Nome do cliente é obrigatório.", "error");
        clientNameInput.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }
      if (
        !clientPhoneValue ||
        (clientPhoneValue.length !== 10 && clientPhoneValue.length !== 11)
      ) {
        if (typeof window.showToast === "function")
          window.showToast(
            "Telefone do cliente é obrigatório e deve ter 10 ou 11 dígitos.",
            "error"
          );
        clientPhoneInput.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }
      if (!clientCpfValue || clientCpfValue.length !== 11) {
        if (typeof window.showToast === "function")
          window.showToast(
            "CPF do cliente é obrigatório e deve ter 11 dígitos.",
            "error"
          );
        clientCpfInput.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }
      if (!equipmentType) {
        if (typeof window.showToast === "function")
          window.showToast("Tipo de equipamento é obrigatório.", "error");
        equipmentTypeSelect.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }
      if (!serviceType) {
        if (typeof window.showToast === "function")
          window.showToast("Tipo de serviço é obrigatório.", "error");
        serviceTypeSelect.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }
      if (!description) {
        if (typeof window.showToast === "function")
          window.showToast("Descrição do problema é obrigatória.", "error");
        descriptionTextarea.focus();
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        return;
      }

      const formData = new FormData();
      formData.append("clientName", clientName);
      formData.append("clientPhone", clientPhoneValue);
      formData.append("clientCpf", clientCpfValue);
      formData.append("equipmentType", equipmentType);
      formData.append("serviceType", serviceType);
      formData.append("description", description);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (typeof window.showToast === "function")
          window.showToast("Sessão expirada. Faça login novamente.", "error");
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          if (typeof window.showToast === "function")
            window.showToast(
              data.message ||
                `Erro ${response.status}: Não foi possível criar o serviço.`,
              "error"
            );
        } else {
          if (typeof window.showToast === "function")
            window.showToast(
              data.message || "Serviço cadastrado com sucesso!",
              "success"
            );
          form.reset();
          imagePreview.src = "#";
          imagePreviewContainer.classList.add("hidden");
          uploadIconContainer.classList.remove("hidden");
          setTimeout(() => {
            window.location.href = "/admin";
          }, 1500);
        }
      } catch (error) {
        console.error("Erro ao criar serviço:", error);
        if (typeof window.showToast === "function")
          window.showToast("Erro de conexão ao tentar criar serviço.", "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar Solicitação";
      }
    });
  }

  // Lógica do menu de usuário e logout (mantida como no seu último fornecimento)
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  const logoutButton = document.getElementById("logout-button");
  const userNameDropdown = document.getElementById("user-name-dropdown");

  if (userMenuButton && userDropdown) {
    userMenuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isHidden = userDropdown.classList.toggle("hidden");
      userMenuButton.setAttribute("aria-expanded", !isHidden);
    });
    document.addEventListener("click", (event) => {
      if (
        userMenuButton &&
        !userMenuButton.contains(event.target) &&
        userDropdown &&
        !userDropdown.contains(event.target) &&
        !userDropdown.classList.contains("hidden")
      ) {
        userDropdown.classList.add("hidden");
        userMenuButton.setAttribute("aria-expanded", "false");
      }
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window.showToast === "function") {
        window.showToast("Sessão encerrada com sucesso!", "success");
      }
      window.location.href = "/login";
    });
  }
  const storedUser = localStorage.getItem("user");
  if (storedUser && userNameDropdown) {
    try {
      const userData = JSON.parse(storedUser);
      userNameDropdown.textContent = userData.email || "Usuário Admin";
    } catch (e) {
      console.error("Erro ao parsear dados do usuário:", e);
      userNameDropdown.textContent = "Usuário Admin";
    }
  }
});
