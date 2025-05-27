// public/js/newService.js
document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA PADRÃO DO MENU (ELEMENTOS E DADOS INICIAIS) ---
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  const userNameDisplay = document.getElementById("user-name-display");
  const userNameDropdown = document.getElementById("user-name-dropdown");
  const logoutButton = document.getElementById("logout-button");
  const menuToggleButton = document.getElementById("menu-toggle"); // Mantido para evitar erros se o HTML mudar
  const mainNav = document.getElementById("main-nav");
  
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  let userData = null;

  if (userString) {
      try {
          userData = JSON.parse(userString);
      } catch (e) {
          console.error("Erro ao parsear dados do usuário do localStorage:", e);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (typeof window.showToast === 'function') window.showToast("Sessão inválida. Faça login.", "error");
          // A verificação de !token || !userData abaixo cuidará do redirecionamento
      }
  }
  // --- FIM DOS ELEMENTOS E DADOS INICIAIS DO MENU ---

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO ESPECÍFICA DA PÁGINA ---
  if (!token || !userData || userData.role !== 'admin') {
      if (typeof window.showToast === 'function') window.showToast("Acesso não autorizado. Faça login como administrador.", "error");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return; 
  }

  // --- LÓGICA PADRÃO DO MENU (FUNÇÕES E CHAMADAS) ---
  function populateUserMenuInfo() {
      if (userData) {
          if (userNameDisplay) {
              userNameDisplay.textContent = userData.name ? userData.name.split(" ")[0] : 'Admin';
          }
          if (userNameDropdown) {
              userNameDropdown.textContent = userData.email || "N/A";
          }
      }
  }

  function setupUserMenuListeners() {
      if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener("click", function(event) {
          event.stopPropagation();
          const isHidden = userDropdown.classList.toggle("hidden");
          userMenuButton.setAttribute("aria-expanded", !isHidden);
        });
        document.addEventListener("click", function(event) {
          if (userMenuButton && !userMenuButton.contains(event.target) &&
              userDropdown && !userDropdown.contains(event.target) &&
              !userDropdown.classList.contains("hidden")) {
            userDropdown.classList.add("hidden");
            userMenuButton.setAttribute("aria-expanded", "false");
          }
        });
      }
      if (logoutButton) {
        logoutButton.addEventListener("click", () => {
          localStorage.removeItem("token"); localStorage.removeItem("user");
          if (typeof window.showToast === 'function') window.showToast("Sessão encerrada com sucesso!", "success");
          setTimeout(() => { window.location.href = "/login"; }, 1500); // Atraso para o toast
        });
      }
  }

  function setupMobileMenuListener() {
      // Mesmo que o botão seja removido do HTML, manter a função vazia ou com checks não quebra.
      if (menuToggleButton && mainNav) {
        menuToggleButton.addEventListener("click", function(event) {
          event.stopPropagation();
          const isHidden = mainNav.classList.toggle("hidden");
          mainNav.classList.toggle("flex", !isHidden);
          menuToggleButton.setAttribute("aria-expanded", String(!isHidden));
        });
      }
  }

  populateUserMenuInfo();
  setupUserMenuListeners();
  setupMobileMenuListener(); // Chamada mantida, mas o botão pode não existir no HTML
  // --- FIM DA LÓGICA PADRÃO DO MENU ---

  // --- RESTANTE DO CÓDIGO ESPECÍFICO DE newService.js ---
  const form = document.getElementById("new-service-form");
  const clientCpfInput = document.getElementById("clientCpf");
  const clientNameInput = document.getElementById("clientName");
  const clientPhoneInput = document.getElementById("clientPhone");
  const clientCpfFeedback = document.getElementById("clientCpf-feedback");

  const equipmentTypeSelect = document.getElementById("equipmentType");
  const serviceTypeSelect = document.getElementById("serviceType");
  const descriptionTextarea = document.getElementById("description");
  const imageInput = document.getElementById("photo");
  const imageUploadArea = document.getElementById("imageUploadArea");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewContainer = document.getElementById("imagePreviewContainer");
  const uploadIconContainer = document.getElementById("uploadIconContainer");
  const submitButton = document.getElementById("submit-service-button");

  function resetImagePreview() {
      if (imageInput) imageInput.value = ""; 
      if (imagePreview) imagePreview.src = "#";
      if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
      if (uploadIconContainer) uploadIconContainer.classList.remove("hidden");
  }

  if (imageUploadArea && imageInput && imagePreviewContainer && uploadIconContainer && imagePreview) {
      imageUploadArea.addEventListener("click", () => { if(imageInput) imageInput.click()});
      imagePreviewContainer.addEventListener("click", () => { 
          if (imagePreview.src && imagePreview.src !== '#' && !imagePreview.src.endsWith("/#")) {
               if (confirm("Deseja remover ou alterar a imagem atual?")) {
                  resetImagePreview();
              }
          } else {
              if(imageInput) imageInput.click(); 
          }
      });
      imageInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
              const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
              const maxSize = 5 * 1024 * 1024; 

              if (!allowedTypes.includes(file.type)) {
                  if (typeof window.showToast === "function") window.showToast("Tipo de arquivo inválido. Use JPG, PNG ou GIF.", "error");
                  resetImagePreview(); return;
              }
              if (file.size > maxSize) {
                  if (typeof window.showToast === "function") window.showToast("A imagem é muito grande (Máx 5MB).", "error");
                  resetImagePreview(); return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                  if(imagePreview) imagePreview.src = reader.result;
                  if(imagePreviewContainer) imagePreviewContainer.classList.remove("hidden");
                  if(uploadIconContainer) uploadIconContainer.classList.add("hidden");
              };
              reader.readAsDataURL(file);
          }
      });
  }

  if (clientCpfInput && typeof window.formatCPF === 'function') {
      clientCpfInput.addEventListener('input', (e) => e.target.value = window.formatCPF(e.target.value));
  }
  if (clientPhoneInput && typeof window.formatPhone === 'function') {
      clientPhoneInput.addEventListener('input', (e) => e.target.value = window.formatPhone(e.target.value));
  }

  function setClientFieldsReadOnly(isReadOnly, namePlaceholder, phonePlaceholder) {
      if (clientNameInput) {
          clientNameInput.readOnly = isReadOnly;
          clientNameInput.placeholder = namePlaceholder;
          clientNameInput.classList.toggle("readonly-style", isReadOnly); 
      }
      if (clientPhoneInput) {
          clientPhoneInput.readOnly = isReadOnly;
          clientPhoneInput.placeholder = phonePlaceholder;
          clientPhoneInput.classList.toggle("readonly-style", isReadOnly);
      }
  }
  setClientFieldsReadOnly(true, "Busque por CPF para preencher", "Busque por CPF para preencher");

  let debounceTimerCpf;
  if (clientCpfInput && clientNameInput && clientPhoneInput && clientCpfFeedback) {
      clientCpfInput.addEventListener('input', () => {
          clearTimeout(debounceTimerCpf);
          const cpfValue = clientCpfInput.value.replace(/\D/g, "");
          
          if (cpfValue.length < 11) {
              clientNameInput.value = ""; clientPhoneInput.value = "";
              setClientFieldsReadOnly(true, "Busque por CPF para preencher", "Busque por CPF para preencher");
              clientCpfFeedback.textContent = "";
              return;
          }
          
          clientCpfFeedback.textContent = "Verificando CPF...";
          clientCpfFeedback.className = "text-xs mt-1 text-gray-500";

          debounceTimerCpf = setTimeout(async () => {
              if (cpfValue.length === 11) { 
                  try {
                    const response = await fetch(`/api/clients/by-cpf/${cpfValue}`, {
                      method: "GET",
                      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
                    });

                    if (response.ok) {
                      const clientData = await response.json();
                      clientNameInput.value = clientData.name || "";
                      clientPhoneInput.value = clientData.phone ? (window.formatPhone ? window.formatPhone(clientData.phone) : clientData.phone) : "";
                      setClientFieldsReadOnly(true, "Dados preenchidos", "Dados preenchidos");
                      clientCpfFeedback.textContent = "Cliente encontrado. Dados preenchidos.";
                      clientCpfFeedback.className = "text-xs mt-1 text-green-600";
                    } else if (response.status === 404) {
                      clientNameInput.value = ""; clientPhoneInput.value = "";
                      setClientFieldsReadOnly(false, "Nome completo (novo cliente)", "(00) 00000-0000 (novo cliente)");
                       clientCpfFeedback.textContent = "Cliente não cadastrado. Preencha os dados manualmente.";
                      clientCpfFeedback.className = "text-xs mt-1 text-blue-600";
                    } else { 
                      const errorData = await response.json().catch(() => ({ message: "Erro ao buscar CPF." }));
                      clientNameInput.value = ""; clientPhoneInput.value = "";
                      setClientFieldsReadOnly(false, "Nome completo (erro na busca)", "(00) 00000-0000 (erro na busca)");
                      clientCpfFeedback.textContent = `Erro ao buscar CPF: ${errorData.message || response.statusText}`;
                      clientCpfFeedback.className = "text-xs mt-1 text-red-600";
                    }
                  } catch (error) { 
                    console.error("Falha na requisição ao buscar cliente por CPF:", error);
                    clientNameInput.value = ""; clientPhoneInput.value = "";
                    setClientFieldsReadOnly(false, "Nome completo (erro na conexão)", "(00) 00000-0000 (erro na conexão)");
                    clientCpfFeedback.textContent = "Erro de conexão ao buscar CPF.";
                    clientCpfFeedback.className = "text-xs mt-1 text-red-600";
                  }
              }
          }, 700);
      });
  }

  if (form && submitButton) {
      form.addEventListener("submit", async (event) => {
          event.preventDefault();
          submitButton.disabled = true;
          submitButton.classList.add("opacity-50", "cursor-not-allowed");
          submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Enviando...`;

          const clientName = clientNameInput.value.trim();
          const clientPhoneValue = clientPhoneInput.value.replace(/\D/g, "");
          const clientCpfValue = clientCpfInput.value.replace(/\D/g, "");
          const equipmentType = equipmentTypeSelect.value;
          const serviceType = serviceTypeSelect.value;
          const description = descriptionTextarea.value.trim();
          const photoFile = imageInput.files[0];
          let isValid = true;
          const showValidationError = (inputElem, message) => {
              if (typeof window.showToast === "function") window.showToast(message, "error");
              if(inputElem && typeof inputElem.focus === 'function') inputElem.focus();
              isValid = false;
          };

          if (!clientCpfValue || clientCpfValue.length !== 11) showValidationError(clientCpfInput, "CPF do cliente é obrigatório (11 dígitos).");
          if (isValid && !clientName) showValidationError(clientNameInput, "Nome do cliente é obrigatório.");
          if (isValid && (!clientPhoneValue || (clientPhoneValue.length !== 10 && clientPhoneValue.length !== 11))) showValidationError(clientPhoneInput, "Telefone do cliente é obrigatório (10 ou 11 dígitos).");
          if (isValid && !equipmentType) showValidationError(equipmentTypeSelect, "Tipo de equipamento é obrigatório.");
          if (isValid && !serviceType) showValidationError(serviceTypeSelect, "Tipo de serviço é obrigatório.");
          if (isValid && !description) showValidationError(descriptionTextarea, "Descrição do problema é obrigatória.");

          if (!isValid) {
              submitButton.disabled = false;
              submitButton.classList.remove("opacity-50", "cursor-not-allowed");
              submitButton.textContent = "Enviar Solicitação";
              return;
          }

          const formData = new FormData();
          formData.append("clientCpf", clientCpfValue);
          formData.append("clientName", clientName);
          formData.append("clientPhone", clientPhoneValue);
          formData.append("equipmentType", equipmentType);
          formData.append("serviceType", serviceType);
          formData.append("description", description);
          if (photoFile) formData.append("photo", photoFile);

          try {
              const response = await fetch("/api/services", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData });
              const data = await response.json();

              if (!response.ok) {
                  if (typeof window.showToast === 'function') window.showToast(data.message || `Erro ${response.status}.`, "error");
              } else {
                  if (typeof window.showToast === 'function') window.showToast(data.message || "Serviço cadastrado!", "success");
                  if(form) form.reset();
                  resetImagePreview();
                  if(clientCpfFeedback) clientCpfFeedback.textContent = "";
                  setClientFieldsReadOnly(true, "Busque por CPF para preencher", "Busque por CPF para preencher");
                  if(clientNameInput) clientNameInput.value = ""; 
                  if(clientPhoneInput) clientPhoneInput.value = ""; 
                  setTimeout(() => { window.location.href = "/admin"; }, 1500);
              }
          } catch (error) {
              console.error("Erro ao criar serviço:", error);
              if (typeof window.showToast === 'function') window.showToast("Erro de conexão ao criar serviço.", "error");
          } finally {
              if(submitButton) {
                  submitButton.disabled = false;
                  submitButton.classList.remove("opacity-50", "cursor-not-allowed");
                  submitButton.textContent = "Enviar Solicitação";
              }
          }
      });
  }
});