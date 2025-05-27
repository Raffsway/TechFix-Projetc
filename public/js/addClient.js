// public/js/addClient.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  let userData = null;
  let cpfAlreadyExists = false;

  if (userString) {
    try {
      userData = JSON.parse(userString);
    } catch (e) {
      console.error("Erro ao parsear dados do usuário:", e);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window.showToast === "function")
        window.showToast("Sessão inválida. Faça login.", "error");
      window.location.href = "/login";
      return;
    }
  }

  if (!token || !userData || userData.role !== "admin") {
    if (typeof window.showToast === "function")
      window.showToast("Acesso não autorizado.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  // --- Lógica do Menu ---
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  const userNameDisplay = document.getElementById("user-name-display");
  const userNameDropdown = document.getElementById("user-name-dropdown");
  const logoutButton = document.getElementById("logout-button");

  function populateUserMenuInfo() {
    if (userData) {
      if (userNameDisplay) {
        userNameDisplay.textContent = userData.name
          ? userData.name.split(" ")[0]
          : "Admin";
      }
      if (userNameDropdown) {
        userNameDropdown.textContent = userData.email || "N/A";
      }
    }
  }
  function setupUserMenuListeners() {
    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener("click", function (event) {
        event.stopPropagation();
        userDropdown.classList.toggle("hidden");
        userMenuButton.setAttribute(
          "aria-expanded",
          !userDropdown.classList.contains("hidden")
        );
      });
      document.addEventListener("click", function (event) {
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
        if (typeof window.showToast === "function")
          window.showToast("Sessão encerrada.", "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      });
    }
  }
  populateUserMenuInfo();
  setupUserMenuListeners();
  // --- Fim da Lógica do Menu ---

  const form = document.getElementById("add-client-form");
  const nameInput = document.getElementById("name");
  const cpfInput = document.getElementById("cpf");
  const phoneInput = document.getElementById("phone");
  const cepInput = document.getElementById("cep");
  const estadoSelect = document.getElementById("estado");
  const cidadeInput = document.getElementById("cidade");
  const bairroInput = document.getElementById("bairro");
  const submitButton = form
    ? form.querySelector('button[type="submit"]')
    : null;
  const generalMessageDiv = document.getElementById(
    "add-client-general-message"
  );

  const cpfErrorDiv = document.getElementById("cpf-error");
  const nameErrorDiv = document.getElementById("name-error");
  const phoneErrorDiv = document.getElementById("phone-error");
  const cepErrorDiv = document.getElementById("cep-error");
  const estadoErrorDiv = document.getElementById("estado-error");

  // Máscaras
  if (cpfInput && typeof window.formatCPF === "function") {
    cpfInput.addEventListener(
      "input",
      (e) => (e.target.value = window.formatCPF(e.target.value))
    );
  }
  if (phoneInput && typeof window.formatPhone === "function") {
    phoneInput.addEventListener(
      "input",
      (e) => (e.target.value = window.formatPhone(e.target.value))
    );
  }

  if (cepInput && estadoSelect && cidadeInput && bairroInput && cepErrorDiv) {
    cepInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      value = value.substring(0, 8);
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, "$1-$2");
      }
      e.target.value = value;
      // Limpar feedback de erro de FORMATO do CEP ao digitar novamente
      cepErrorDiv.textContent = "";
      cepErrorDiv.classList.add("hidden");
      cepInput.classList.remove(
        "border-red-500",
        "focus:border-red-500",
        "focus:ring-red-500"
      );
      cepInput.classList.add(
        "border-gray-300",
        "focus:border-techfix-light-blue",
        "focus:ring-techfix-light-blue"
      );
    });

    cepInput.addEventListener("blur", async () => {
      const cepValue = cepInput.value.replace(/\D/g, "");

      // Limpar feedback de erro de FORMATO do CEP antes de nova busca
      cepErrorDiv.textContent = "";
      cepErrorDiv.classList.add("hidden");
      cepInput.classList.remove(
        "border-red-500",
        "focus:border-red-500",
        "focus:ring-red-500"
      );
      cepInput.classList.add(
        "border-gray-300",
        "focus:border-techfix-light-blue",
        "focus:ring-techfix-light-blue"
      );

      // Limpar campos de endereço antes de nova busca
      estadoSelect.value = "";
      cidadeInput.value = "";
      bairroInput.value = "";

      if (cepValue.length === 8) {
        try {
          const response = await fetch(
            `https://viacep.com.br/ws/${cepValue}/json/`
          );
          const data = await response.json();

          if (!response.ok || data.erro) {
            const errorMessage = data.erro
              ? "CEP não encontrado."
              : `Falha ao buscar CEP (${response.status}).`;
            if (typeof window.showToast === "function")
              window.showToast(errorMessage, "error");
            return;
          }
          // Sucesso na busca do CEP
          estadoSelect.value = data.uf || "";
          cidadeInput.value = data.localidade || "";
          bairroInput.value = data.bairro || "";
          if (typeof window.showToast === "function")
            window.showToast("Endereço preenchido pelo CEP.", "success");
        } catch (error) {
          console.warn("Erro na requisição para ViaCEP:", error);
          const warnMessage =
            "Não foi possível buscar o CEP. Verifique a conexão ou preencha manualmente.";
          if (typeof window.showToast === "function")
            window.showToast(warnMessage, "warn");
        }
      } else if (cepValue.length > 0 && cepValue.length < 8) {
        cepErrorDiv.textContent = "CEP inválido (deve ter 8 dígitos).";
        cepErrorDiv.className =
          "input-field-error-text text-xs mt-1 text-red-500";
        cepErrorDiv.classList.remove("hidden");
        cepInput.classList.add(
          "border-red-500",
          "focus:border-red-500",
          "focus:ring-red-500"
        );
        cepInput.classList.remove(
          "border-gray-300",
          "focus:border-techfix-light-blue",
          "focus:ring-techfix-light-blue"
        );
      }
    });
  }

  const displayInputError = (inputId, message, isCpfField = false) => {
    const errorDiv = document.getElementById(`${inputId}-error`);
    const inputEl = document.getElementById(inputId);

    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove("hidden");
      errorDiv.className = "input-field-error-text text-xs mt-1 text-red-500";

      if (inputEl) {
        inputEl.classList.add(
          "border-red-500",
          "focus:border-red-500",
          "focus:ring-red-500"
        );
        inputEl.classList.remove(
          "border-gray-300",
          "focus:border-techfix-light-blue",
          "focus:ring-techfix-light-blue"
        );
      }
    }
  };

  const clearInputErrorStyle = (inputId) => {
    const inputEl = document.getElementById(inputId);
    const errorDiv = document.getElementById(`${inputId}-error`);
    if (inputEl) {
      inputEl.classList.remove(
        "border-red-500",
        "focus:border-red-500",
        "focus:ring-red-500"
      );
      inputEl.classList.add(
        "border-gray-300",
        "focus:border-techfix-light-blue",
        "focus:ring-techfix-light-blue"
      );
    }
    if (errorDiv) {
      errorDiv.textContent = "";
      errorDiv.classList.add("hidden");
      errorDiv.className = "input-field-error-text hidden";
    }
  };

  const displayGeneralMessage = (message, type) => {
    if (generalMessageDiv) {
      generalMessageDiv.textContent = message;
      generalMessageDiv.className = "form-feedback-message hidden"; // Reset classes
      if (message && type) {
        generalMessageDiv.classList.add(type); // 'error', 'success', 'info'
        generalMessageDiv.classList.remove("hidden");
      }
    }
  };

  const clearGeneralMessage = () => {
    if (generalMessageDiv) {
      generalMessageDiv.textContent = "";
      generalMessageDiv.className = "form-feedback-message hidden";
    }
  };

  const clearAllInputValidationErrors = () => {
    clearInputErrorStyle("name");
    clearInputErrorStyle("phone");
    clearInputErrorStyle("estado");
    clearInputErrorStyle("cep");
    clearInputErrorStyle("cpf"); // CORRIGIDO: Usando clearInputErrorStyle para CPF
  };

  let cpfDebounceTimer;
  if (cpfInput && cpfErrorDiv) {
    cpfInput.addEventListener("input", () => {
      clearTimeout(cpfDebounceTimer);
      const cleanedCpf = cpfInput.value.replace(/\D/g, "");
      clearInputErrorStyle("cpf"); // CORRIGIDO: Usando clearInputErrorStyle para CPF
      cpfAlreadyExists = false;

      if (cepErrorDiv && cepErrorDiv.textContent) {
        clearInputErrorStyle("cep");
      }

      if (cleanedCpf.length === 11) {
        cpfErrorDiv.textContent = "Verificando CPF...";
        cpfErrorDiv.className =
          "input-field-error-text text-xs mt-1 text-gray-500";
        cpfErrorDiv.classList.remove("hidden");

        cpfDebounceTimer = setTimeout(async () => {
          try {
            const response = await fetch(
              `/api/admin/clients/check-cpf/${cleanedCpf}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (response.ok && data.exists) {
              displayInputError(
                "cpf",
                data.message || "Este CPF já está cadastrado.",
                true
              );
              cpfAlreadyExists = true;
            } else if (!response.ok) {
              displayInputError(
                "cpf",
                data.message || "Erro ao verificar CPF.",
                true
              );
            } else {
              cpfErrorDiv.textContent = "CPF disponível para novo cadastro.";
              cpfErrorDiv.className =
                "input-field-error-text text-xs mt-1 text-green-600";
              cpfAlreadyExists = false;
            }
          } catch (err) {
            console.error("Erro ao verificar CPF via API:", err);
            displayInputError(
              "cpf",
              "Não foi possível verificar o CPF no momento.",
              true
            );
          }
        }, 600);
      } else {
        // Limpa mensagem de verificação se o CPF não tem 11 dígitos ainda
        if (cpfErrorDiv.textContent === "Verificando CPF...") {
          cpfErrorDiv.textContent = "";
          cpfErrorDiv.classList.add("hidden");
        }
      }
    });
  }

  if (form && submitButton) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearGeneralMessage();
      clearAllInputValidationErrors();

      let isValid = true;

      const name = nameInput.value.trim();
      const cpf = cpfInput.value.replace(/\D/g, "");
      const phone = phoneInput.value.replace(/\D/g, "");
      const cep = cepInput.value.replace(/\D/g, "");
      const estado = estadoSelect.value;
      const cidade = cidadeInput.value.trim();
      const bairro = bairroInput.value.trim();

      if (!cpf || cpf.length !== 11) {
        displayInputError(
          "cpf",
          "CPF é obrigatório e deve ter 11 dígitos.",
          true
        );
        isValid = false;
      } else if (cpfAlreadyExists) {
        displayInputError(
          "cpf",
          "Este CPF já está cadastrado. Não é possível adicionar novamente.",
          true
        );
        isValid = false;
      } else if (
        // Adicionado para garantir que a validação do debounce seja considerada
        cpfErrorDiv &&
        cpfErrorDiv.textContent !== "CPF disponível para novo cadastro." &&
        !cpfErrorDiv.classList.contains("hidden") &&
        cpfErrorDiv.textContent !== ""
      ) {
        // Se houver uma mensagem de erro ativa no CPF (que não seja a de sucesso), considera inválido
        if (!cpfErrorDiv.textContent.includes("Verificando CPF...")) {
          // Evita bloquear se ainda estiver verificando
          isValid = false;
        }
      }

      if (!name) {
        displayInputError("name", "Nome é obrigatório.");
        isValid = false;
      }
      if (phone && phone.length !== 10 && phone.length !== 11) {
        displayInputError(
          "phone",
          "Telefone deve ter 10 ou 11 dígitos (se preenchido)."
        );
        isValid = false;
      }

      if (cep && cep.length !== 8) {
        displayInputError("cep", "CEP deve ter 8 dígitos (se preenchido).");
        isValid = false;
      } else if (cep && cep.length === 8 && !estado && !cidadeInput.value) {
        // Permite cidade manual se CEP não preencheu tudo
        // Se o CEP foi preenchido e é válido, mas não preencheu o estado automaticamente (ViaCEP falhou ou CEP incompleto)
        // E a cidade também não foi preenchida manualmente, então o estado pode ser opcional
        // Mas se o admin quiser preencher estado, ele pode.
        // Vamos remover a obrigatoriedade de estado aqui se o ViaCEP não retornou.
        // A validação do estado pode ser feita no backend se for estritamente necessária.
      }

      if (!isValid) {
        displayGeneralMessage(
          "Por favor, corrija os erros indicados.",
          "error"
        );
        if (typeof window.showToast === "function")
          window.showToast("Verifique os campos do formulário.", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Salvando...`;

      try {
        const response = await fetch("/api/admin/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            cpf,
            phone,
            cep,
            estado,
            cidade,
            bairro,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          const message =
            data.message ||
            `Erro ${response.status}. Não foi possível adicionar o cliente.`;
          displayGeneralMessage(message, "error");
          if (typeof window.showToast === "function")
            window.showToast(message, "error");
          if (response.status === 409 && cpfInput) {
            displayInputError("cpf", message, true);
            cpfAlreadyExists = true;
          }
        } else {
          const message =
            data.message || "Informações do cliente adicionadas com sucesso!";
          if (form) form.reset();
          clearAllInputValidationErrors(); // Limpa todos os erros, incluindo os de CPF e CEP
          if (cpfErrorDiv) {
            // Limpa explicitamente a mensagem de status do CPF
            cpfErrorDiv.textContent = "";
            cpfErrorDiv.classList.add("hidden");
          }
          cpfAlreadyExists = false;
          if (typeof window.showToast === "function")
            window.showToast(message, "success");
          setTimeout(() => {
            window.location.href = "/admin";
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao adicionar informações do cliente:", error);
        const message = "Erro de conexão ao tentar salvar as informações.";
        displayGeneralMessage(message, "error");
        if (typeof window.showToast === "function")
          window.showToast(message, "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Adicionar Cliente";
        }
      }
    });
  }
});
