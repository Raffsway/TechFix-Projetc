// public/js/addClient.js
document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA PADRÃO DO MENU (ELEMENTOS E DADOS INICIAIS) ---
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  const userNameDisplay = document.getElementById("user-name-display");
  const userNameDropdown = document.getElementById("user-name-dropdown");
  const logoutButton = document.getElementById("logout-button");
  const menuToggleButton = document.getElementById("menu-toggle"); // Mesmo que o botão seja removido do HTML
  const mainNav = document.getElementById("main-nav");
  
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  let userData = null;

  if (userString) {
      try { userData = JSON.parse(userString); }
      catch (e) {
          console.error("Erro ao parsear dados do usuário:", e);
          localStorage.removeItem("token"); localStorage.removeItem("user");
          if (typeof window.showToast === 'function') window.showToast("Sessão inválida. Faça login.", "error");
          window.location.href = "/login";
          return;
      }
  }
  // --- FIM DOS ELEMENTOS E DADOS INICIAIS DO MENU ---

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO ESPECÍFICA DA PÁGINA ---
  if (!token || !userData || userData.role !== 'admin') {
      if (typeof window.showToast === 'function') window.showToast("Acesso não autorizado.", "error");
      localStorage.removeItem("token"); localStorage.removeItem("user");
      window.location.href = "/login";
      return;
  }

  // --- LÓGICA PADRÃO DO MENU (FUNÇÕES E CHAMADAS) ---
  function populateUserMenuInfo() {
      if (userData) {
          if (userNameDisplay) { userNameDisplay.textContent = userData.name ? userData.name.split(" ")[0] : 'Admin'; }
          if (userNameDropdown) { userNameDropdown.textContent = userData.email || "N/A"; }
      }
  }
  function setupUserMenuListeners() {
      if (userMenuButton && userDropdown) {
          userMenuButton.addEventListener("click", function(event) { event.stopPropagation(); userDropdown.classList.toggle("hidden"); userMenuButton.setAttribute("aria-expanded", !userDropdown.classList.contains("hidden")); });
          document.addEventListener("click", function(event) { if (userMenuButton && !userMenuButton.contains(event.target) && userDropdown && !userDropdown.contains(event.target) && !userDropdown.classList.contains("hidden")) { userDropdown.classList.add("hidden"); userMenuButton.setAttribute("aria-expanded", "false"); } });
      }
      if (logoutButton) { logoutButton.addEventListener("click", () => { localStorage.removeItem("token"); localStorage.removeItem("user"); if (typeof window.showToast === 'function') window.showToast("Sessão encerrada.", "success"); setTimeout(() => { window.location.href = "/login"; }, 1500); });}
  }
  function setupMobileMenuListener() {
      if (menuToggleButton && mainNav) { menuToggleButton.addEventListener("click", function(event) { event.stopPropagation(); mainNav.classList.toggle("hidden"); mainNav.classList.toggle("flex", !mainNav.classList.contains("hidden")); menuToggleButton.setAttribute("aria-expanded", String(!mainNav.classList.contains("hidden"))); });}
  }
  populateUserMenuInfo();
  setupUserMenuListeners();
  setupMobileMenuListener();
  // --- FIM DA LÓGICA PADRÃO DO MENU ---

  // --- RESTANTE DO CÓDIGO ESPECÍFICO DE addClient.js ---
  const form = document.getElementById("add-client-form");
  const nameInput = document.getElementById("name");
  const cpfInput = document.getElementById("cpf");
  const phoneInput = document.getElementById("phone");
  const cepInput = document.getElementById("cep");
  const estadoSelect = document.getElementById("estado");
  const cidadeInput = document.getElementById("cidade");
  const bairroInput = document.getElementById("bairro");
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  const generalMessageDiv = document.getElementById("add-client-general-message");
  const cpfErrorDiv = document.getElementById("cpf-error");
  let cpfAlreadyExists = false;

  if (cpfInput && typeof window.formatCPF === 'function') { cpfInput.addEventListener('input', (e) => e.target.value = window.formatCPF(e.target.value)); }
  if (phoneInput && typeof window.formatPhone === 'function') { phoneInput.addEventListener('input', (e) => e.target.value = window.formatPhone(e.target.value));}
  if (cepInput) {
      cepInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, ""); value = value.substring(0, 8);
          if (value.length > 5) { value = value.replace(/^(\d{5})(\d)/, "$1-$2");}
          e.target.value = value;
      });
      cepInput.addEventListener('blur', async () => {
          const cepValue = cepInput.value.replace(/\D/g, "");
          if (cepValue.length === 8) {
              if(typeof window.showToast === 'function') window.showToast("Buscando CEP...", "info", false);
              try { /* ... (lógica ViaCEP como em newService.js) ... */ }
              catch (error) { /* ... (tratamento de erro ViaCEP) ... */ }
          }
      });
  }
  
  const displayInputError = (inputId, message, isCpfError = false) => {
      const errorDiv = document.getElementById(`${inputId}-error`);
      if (errorDiv) { 
          errorDiv.textContent = message; errorDiv.classList.remove("hidden");
          if (isCpfError && inputId === 'cpf' && cpfInput) {
              cpfInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
              cpfInput.classList.remove('border-gray-300', 'focus:border-techfix-light-blue', 'focus:ring-techfix-light-blue');
          }
      }
  };
  const clearCpfErrorStyle = () => {
      if (cpfInput) {
          cpfInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
          cpfInput.classList.add('border-gray-300', 'focus:border-techfix-light-blue', 'focus:ring-techfix-light-blue');
          if(cpfErrorDiv) { cpfErrorDiv.textContent = ""; cpfErrorDiv.classList.add("hidden"); }
      }
  };
  const displayGeneralMessage = (message, type) => { /* ... (como antes) ... */ };
  const clearGeneralMessage = () => { /* ... (como antes) ... */ };
  const clearAllInputErrorsLocal = () => {
      if(form) form.querySelectorAll(".input-field-error-text").forEach(el => { el.textContent = ""; el.classList.add("hidden"); });
      clearCpfErrorStyle(); 
  };


  let cpfDebounceTimer;
  if (cpfInput && cpfErrorDiv) {
      cpfInput.addEventListener('input', () => {
          clearTimeout(cpfDebounceTimer);
          const cleanedCpf = cpfInput.value.replace(/\D/g, "");
          clearCpfErrorStyle(); 
          cpfAlreadyExists = false; 

          if (cleanedCpf.length === 11) {
              cpfDebounceTimer = setTimeout(async () => {
                  try {
                      const response = await fetch(`/api/admin/clients/check-cpf/${cleanedCpf}`, { headers: { "Authorization": `Bearer ${token}` }});
                      const data = await response.json();
                      if (response.ok && data.exists) {
                          displayInputError('cpf', data.message || "Este CPF já está cadastrado.", true);
                          cpfAlreadyExists = true;
                      } else if (!response.ok) {
                           displayInputError('cpf', data.message || "Erro ao verificar CPF.", true);
                      } else { 
                          clearCpfErrorStyle(); cpfAlreadyExists = false;
                      }
                  } catch (err) {
                      console.error("Erro ao verificar CPF via API:", err);
                      displayInputError('cpf', "Não foi possível verificar o CPF no momento.", true);
                  }
              }, 600); 
          } else {
              if (cpfErrorDiv.textContent.includes("cadastrado") || cpfErrorDiv.textContent.includes("verificar")) {
                  clearCpfErrorStyle();
              }
          }
      });
  }

  if (form && submitButton) {
      form.addEventListener("submit", async (event) => {
          event.preventDefault();
          clearGeneralMessage();
          clearAllInputErrorsLocal(); 
          let isValid = true;

          const name = nameInput.value.trim();
          const cpf = cpfInput.value.replace(/\D/g, "");
          const phone = phoneInput.value.replace(/\D/g, "");
          const cep = cepInput.value.replace(/\D/g, "");
          const estado = estadoSelect.value;
          const cidade = cidadeInput.value.trim();
          const bairro = bairroInput.value.trim();

          if (!cpf || cpf.length !== 11) { displayInputError("cpf", "CPF é obrigatório e deve ter 11 dígitos.", true); isValid = false; }
          else if (cpfAlreadyExists) { displayInputError("cpf", "Este CPF já está cadastrado. Não é possível adicionar novamente.", true); isValid = false; }
          else { clearCpfErrorStyle(); }

          if (!name) { displayInputError("name", "Nome é obrigatório."); isValid = false; }
          // ... (outras validações como antes)

          if (!isValid) {
              displayGeneralMessage("Por favor, corrija os erros indicados.", "error");
              if (typeof window.showToast === 'function') window.showToast("Verifique os campos do formulário.", "error");
              return;
          }

          submitButton.disabled = true;
          submitButton.innerHTML = `Salvando...`; // Adicione spinner se desejar

          try {
              const response = await fetch("/api/admin/clients", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`},
                  body: JSON.stringify({ name, cpf, phone, cep, estado, cidade, bairro })
              });
              const data = await response.json();

              if (!response.ok) { 
                  const message = data.message || `Erro ${response.status}.`;
                  displayGeneralMessage(message, "error");
                  if (typeof window.showToast === 'function') window.showToast(message, "error");
                  if (response.status === 409 && cpfInput) { 
                      displayInputError("cpf", message, true);
                      cpfAlreadyExists = true;
                  }
              } else { 
                  const message = data.message || "Informações do cliente adicionadas com sucesso!";
                  if(form) form.reset();
                  clearCpfErrorStyle(); 
                  cpfAlreadyExists = false;
                  if (typeof window.showToast === 'function') window.showToast(message, "success");
                  setTimeout(() => { window.location.href = "/admin"; }, 1500);
              }
          } catch (error) {
              console.error("Erro ao adicionar informações do cliente:", error);
              const message = "Erro de conexão ao tentar salvar.";
              displayGeneralMessage(message, "error");
              if (typeof window.showToast === 'function') window.showToast(message, "error");
          } finally {
              if(submitButton){
                  submitButton.disabled = false;
                  submitButton.textContent = "Salvar Informações do Cliente";
              }
          }
      });
  }
});