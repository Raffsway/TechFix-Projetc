// public/js/updateProfile.js
document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA PADRÃO DO MENU (ELEMENTOS E DADOS INICIAIS) ---
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  const userNameDisplayInButton = document.getElementById("user-name-display");
  const userNameInDropdown = document.getElementById("user-name-dropdown");
  const logoutButton = document.getElementById("logout-button");
  const menuToggleButton = document.getElementById("menu-toggle"); // Pode não existir nesta página, mas a função verifica
  const mainNav = document.getElementById("main-nav"); // Pode não existir nesta página, mas a função verifica
  const homeLogoLink = document.getElementById("home-logo-link");
  const navNewServiceLink = document.getElementById("nav-new-service"); // Pode não existir nesta página
  const backToDashboardMainLink = document.getElementById(
    "back-to-dashboard-main-link"
  ); // Definido mais tarde, mas usado em populateUserMenuInfo

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
      // A verificação de !token || !userData abaixo cuidará do redirecionamento
    }
  }
  // --- FIM DOS ELEMENTOS E DADOS INICIAIS DO MENU ---

  // --- VERIFICAÇÃO DE AUTENTICAÇÃO ESPECÍFICA DA PÁGINA ---
  if (!token || !userData) {
    if (typeof window.showToast === "function")
      window.showToast("Sessão inválida. Faça login.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  // --- LÓGICA PADRÃO DO MENU (FUNÇÕES E CHAMADAS) ---
  function populateUserMenuInfo() {
    if (userData) {
      if (userNameDisplayInButton) {
        userNameDisplayInButton.textContent = userData.name
          ? userData.name.split(" ")[0]
          : userData.role === "admin"
          ? "Admin"
          : "Cliente";
      }
      if (userNameInDropdown) {
        userNameInDropdown.textContent = userData.email || "Não definido";
      }

      const dashboardUrl = userData.role === "admin" ? "/admin" : "/cliente";
      if (homeLogoLink) {
        homeLogoLink.href = dashboardUrl;
      }
      // backToDashboardMainLink é selecionado mais abaixo no código específico da página,
      // mas sua referência no header (se houver uma com este ID) também seria atualizada.
      // O link principal de "Voltar ao painel" na página é o que será atualizado aqui:
      if (backToDashboardMainLink) {
        // Este é o link no corpo da página
        backToDashboardMainLink.href = dashboardUrl;
      }

      // Lógica para navNewServiceLink (se existir no HTML desta página, o que não é o caso)
      if (navNewServiceLink) {
        if (userData.role === "admin") {
          navNewServiceLink.style.display = "";
          navNewServiceLink.href = "/new-service";
        } else {
          navNewServiceLink.style.display = "none";
        }
      }
    }
  }

  function setupUserMenuListeners() {
    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener("click", function (event) {
        event.stopPropagation();
        const isHidden = userDropdown.classList.toggle("hidden");
        userMenuButton.setAttribute("aria-expanded", !isHidden);
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
          window.showToast("Sessão encerrada com sucesso!", "success");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      });
    }
  }

  function setupMobileMenuListener() {
    // Esta função é copiada de newService.js.
    // Os elementos menuToggleButton e mainNav provavelmente não existem no update-profile.html.
    // A verificação `if (menuToggleButton && mainNav)` impede erros.
    if (menuToggleButton && mainNav) {
      menuToggleButton.addEventListener("click", function (event) {
        event.stopPropagation();
        const isHidden = mainNav.classList.toggle("hidden");
        mainNav.classList.toggle("flex", !isHidden); // Adiciona flex se não estiver hidden
        // A linha abaixo para md:flex pode não ser necessária se não houver menu hambúrguer
        // mainNav.classList.toggle("md:flex", isHidden);
        menuToggleButton.setAttribute("aria-expanded", String(!isHidden));
      });
    }
  }

  populateUserMenuInfo();
  setupUserMenuListeners();
  setupMobileMenuListener();
  // --- FIM DA LÓGICA PADRÃO DO MENU ---

  // --- RESTANTE DO CÓDIGO ESPECÍFICO DE updateProfile.js ---
  // const backToDashboardMainLink = document.getElementById("back-to-dashboard-main-link"); // Já definido acima
  const profileForm = document.getElementById("update-profile-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const cepInput = document.getElementById("cep-update");
  const estadoSelect = document.getElementById("estado-update");
  const cidadeInput = document.getElementById("cidade-update");
  const bairroInput = document.getElementById("bairro-update");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const generalMessageDiv = document.getElementById("update-general-message");
  const profileCpfDisplay = document.getElementById("profile-cpf-display");
  const passwordInstructions = document.getElementById("password-instructions");
  const currentPasswordLabel = document.getElementById("currentPasswordLabel");

  // Preencher CPF (não editável) e dados existentes
  if (profileCpfDisplay && userData && userData.cpf) {
    profileCpfDisplay.textContent = `CPF: ${
      window.formatCPF ? window.formatCPF(userData.cpf) : userData.cpf
    }`;
  }

  if (userData) {
    nameInput.value = userData.name || "";
    emailInput.value = userData.email || "";
    phoneInput.value = userData.phone
      ? window.formatPhone
        ? window.formatPhone(userData.phone)
        : userData.phone
      : "";
    cepInput.value = userData.cep
      ? userData.cep.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2")
      : ""; // Formata CEP se existir
    estadoSelect.value = userData.estado || "";
    cidadeInput.value = userData.cidade || "";
    bairroInput.value = userData.bairro || "";

    // Ajustar a UI de senha com base se o usuário já tem uma senha
    if (userData.password) {
      // Presume-se que se `userData.password` existe (mesmo que seja o hash), ele tem uma senha.
      passwordInstructions.textContent =
        "Deixe os campos de senha em branco se não desejar alterá-la.";
      currentPasswordLabel.textContent = "Senha Atual";
      currentPasswordInput.placeholder = "Sua senha atual";
    } else {
      passwordInstructions.textContent =
        "Defina sua senha pela primeira vez. A senha atual não é necessária.";
      currentPasswordLabel.textContent = "Senha Atual (não necessária)";
      currentPasswordInput.placeholder =
        "Não é necessário para o primeiro acesso";
      // currentPasswordInput.disabled = true; // Opcional: desabilitar
      // currentPasswordInput.readOnly = true; // Ou tornar readonly
    }
  }

  // Aplica máscara de telefone
  if (phoneInput && typeof window.formatPhone === "function") {
    phoneInput.addEventListener(
      "input",
      (e) => (e.target.value = window.formatPhone(e.target.value))
    );
  }

  // Lógica do ViaCEP
  if (cepInput && estadoSelect && cidadeInput && bairroInput) {
    cepInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      value = value.substring(0, 8);
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, "$1-$2");
      }
      e.target.value = value;
      if (window.displayInputError) window.displayInputError("cep-update", ""); // Limpa erro de formato
    });

    cepInput.addEventListener("blur", async () => {
      const cepValue = cepInput.value.replace(/\D/g, "");
      if (window.displayInputError) window.displayInputError("cep-update", "");

      if (cepValue.length === 8) {
        // if (typeof window.showToast === "function") window.showToast("Buscando CEP...", "info_no_timeout");
        try {
          const response = await fetch(
            `https://viacep.com.br/ws/${cepValue}/json/`
          );
          const data = await response.json();
          // if (document.querySelector('.toast-info_no_timeout')) { // Remove o toast de "buscando"
          //     document.querySelector('.toast-info_no_timeout').remove();
          // }

          if (!response.ok || data.erro) {
            if (typeof window.showToast === "function")
              window.showToast(
                data.erro ? "CEP não encontrado." : "Falha ao buscar CEP.",
                "error"
              );
            estadoSelect.value = "";
            cidadeInput.value = "";
            bairroInput.value = "";
          } else {
            estadoSelect.value = data.uf || "";
            cidadeInput.value = data.localidade || "";
            bairroInput.value = data.bairro || "";
            // if (typeof window.showToast === "function") window.showToast("Endereço preenchido.", "success");
          }
        } catch (error) {
          // if (document.querySelector('.toast-info_no_timeout')) { // Remove o toast de "buscando"
          //    document.querySelector('.toast-info_no_timeout').remove();
          // }
          console.warn("Erro na requisição para ViaCEP:", error);
          if (typeof window.showToast === "function")
            window.showToast(
              "Erro ao buscar CEP. Verifique a conexão.",
              "warn"
            );
          estadoSelect.value = "";
          cidadeInput.value = "";
          bairroInput.value = "";
        }
      } else if (cepValue.length > 0 && cepValue.length < 8) {
        if (window.displayInputError)
          window.displayInputError(
            "cep-update",
            "CEP inválido (deve ter 8 dígitos)."
          );
      }
    });
  }

  // Submissão do formulário
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (window.displayFormMessage)
        window.displayFormMessage(
          profileForm,
          "",
          "",
          "update-general-message"
        );
      if (window.clearAllInputErrors) window.clearAllInputErrors(profileForm);
      let isValid = true;

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.replace(/\D/g, "");
      const cep = cepInput.value.replace(/\D/g, "");
      const estado = estadoSelect.value;
      const cidade = cidadeInput.value.trim();
      const bairro = bairroInput.value.trim();
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;

      if (!name) {
        if (window.displayInputError)
          window.displayInputError(
            "name-update",
            "Nome completo é obrigatório."
          );
        isValid = false;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        if (window.displayInputError)
          window.displayInputError("email-update", "Email é obrigatório.");
        isValid = false;
      } else if (!emailPattern.test(email)) {
        if (window.displayInputError)
          window.displayInputError(
            "email-update",
            "Formato de e-mail inválido."
          );
        isValid = false;
      }
      if (phone && (phone.length < 10 || phone.length > 11)) {
        if (window.displayInputError)
          window.displayInputError(
            "phone-update",
            "Telefone deve ter 10 ou 11 dígitos (se preenchido)."
          );
        isValid = false;
      }
      if (cep && cep.length !== 8) {
        if (window.displayInputError)
          window.displayInputError(
            "cep-update",
            "CEP deve ter 8 dígitos (se preenchido)."
          );
        isValid = false;
      }

      // Validação de Senha
      if (newPassword || confirmNewPassword) {
        // Se um dos campos de nova senha for preenchido
        if (userData.password && !currentPassword) {
          // Se já tem senha e não informou a atual
          if (window.displayInputError)
            window.displayInputError(
              "currentPassword-update",
              "Senha atual é obrigatória para definir uma nova."
            );
          isValid = false;
        }
        if (newPassword.length < 6) {
          if (window.displayInputError)
            window.displayInputError(
              "newPassword-update",
              "Nova senha deve ter pelo menos 6 caracteres."
            );
          isValid = false;
        }
        if (newPassword !== confirmNewPassword) {
          if (window.displayInputError)
            window.displayInputError(
              "confirmNewPassword-update",
              "As novas senhas não coincidem."
            );
          isValid = false;
        }
      } else if (!userData.password && currentPassword) {
        // Tentando definir senha atual sem precisar
        if (window.displayInputError)
          window.displayInputError(
            "currentPassword-update",
            "Senha atual não é necessária para definir a primeira senha. Deixe em branco."
          );
        isValid = false;
      }

      if (!isValid) {
        if (typeof window.showToast === "function")
          window.showToast("Por favor, corrija os erros indicados.", "error");
        return;
      }

      const submitButton = profileForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Salvando...`;

      const body = {
        name,
        email,
        phone,
        cep,
        estado,
        cidade,
        bairro,
      };
      if (newPassword) {
        body.currentPassword = currentPassword; // Mesmo que seja vazia se for o primeiro cadastro de senha
        body.newPassword = newPassword;
      }

      try {
        const response = await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const data = await response.json();

        if (!response.ok) {
          const message =
            data.message ||
            `Erro ${response.status}. Não foi possível atualizar.`;
          if (window.displayFormMessage)
            window.displayFormMessage(
              profileForm,
              message,
              "error",
              "update-general-message"
            );
          if (typeof window.showToast === "function")
            window.showToast(message, "error");
        } else {
          if (window.displayFormMessage)
            window.displayFormMessage(
              profileForm,
              data.message || "Perfil atualizado!",
              "success",
              "update-general-message"
            );
          if (typeof window.showToast === "function")
            window.showToast(
              data.message || "Perfil atualizado com sucesso!",
              "success"
            );

          // Atualizar localStorage
          localStorage.setItem("user", JSON.stringify(data.user));
          userData = data.user; // Atualiza a variável local
          populateUserMenuInfo(); // Re-popula o menu com nome atualizado se houver

          // Limpar campos de senha após sucesso
          if (currentPasswordInput) currentPasswordInput.value = "";
          if (newPasswordInput) newPasswordInput.value = "";
          if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";

          // Ajustar a UI de senha novamente com base se o usuário agora tem uma senha
          if (userData.password) {
            passwordInstructions.textContent =
              "Deixe os campos de senha em branco se não desejar alterá-la.";
            currentPasswordLabel.textContent = "Senha Atual";
            currentPasswordInput.placeholder = "Sua senha atual";
          } else {
            // Este caso não deve ocorrer se a atualização de senha foi bem sucedida
            passwordInstructions.textContent =
              "Defina sua senha pela primeira vez. A senha atual não é necessária.";
            currentPasswordLabel.textContent = "Senha Atual (não necessária)";
            currentPasswordInput.placeholder =
              "Não é necessário para o primeiro acesso";
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        const message = "Erro de conexão ao tentar atualizar o perfil.";
        if (window.displayFormMessage)
          window.displayFormMessage(
            profileForm,
            message,
            "error",
            "update-general-message"
          );
        if (typeof window.showToast === "function")
          window.showToast(message, "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Salvar Alterações";
      }
    });
  }
});
