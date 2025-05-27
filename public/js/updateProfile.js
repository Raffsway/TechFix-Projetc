// public/js/updateProfile.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  let userData = null; // Definida para ser acessível e atualizável no escopo do DOMContentLoaded

  // --- Elementos do DOM ---
  const userMenuButton = document.getElementById("user-menu-button");
  const userDropdown = document.getElementById("user-dropdown");
  // O HTML de update-profile.html fornecido na última interação (filename: update-profile.html)
  // já tem o #user-name-display no botão.
  const userNameDisplayInButton = document.getElementById("user-name-display");
  const userNameInDropdown = document.getElementById("user-name-dropdown");
  const logoutButton = document.getElementById("logout-button");

  // IDs conforme o HTML de update-profile.html que você forneceu mais recentemente (filename: update-profile.html)
  const homeLogoLink = document.getElementById("home-logo-link");
  const backToDashboardMainLink = document.getElementById(
    "back-to-dashboard-main-link"
  );

  const updateProfileForm = document.getElementById("update-profile-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const submitButton = updateProfileForm
    ? updateProfileForm.querySelector('button[type="submit"]')
    : null;

  // --- Função para atualizar o nome/email do usuário na UI do menu ---
  function localUpdateUserMenuDisplay(currentUserData) {
    if (!currentUserData) return;

    // O nome exibido no botão pode ser só o primeiro nome.
    const nameForButtonDisplay = currentUserData.name
      ? currentUserData.name.split(" ")[0]
      : "Usuário";
    // O email é geralmente exibido no dropdown.
    const emailForDropdownDisplay =
      currentUserData.email || "usuario@exemplo.com";

    if (userNameDisplayInButton) {
      userNameDisplayInButton.textContent = nameForButtonDisplay;
    }
    if (userNameInDropdown) {
      userNameInDropdown.textContent = emailForDropdownDisplay;
    }
  }

  // --- Inicialização da Página ---
  const userDataString = localStorage.getItem("user");
  if (!token || !userDataString) {
    if (typeof window.showToast === "function")
      window.showToast("Sessão inválida. Faça login.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // Redireciona para a página de login HTML
    return;
  }

  try {
    userData = JSON.parse(userDataString);
    localUpdateUserMenuDisplay(userData); // Atualiza o menu no carregamento
  } catch (e) {
    if (typeof window.showToast === "function")
      window.showToast("Dados de usuário corrompidos. Faça login.", "error");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // Redireciona para a página de login HTML
    return;
  }

  // Preencher formulário e links dinâmicos
  // A URL do dashboard é definida com base no 'role' do usuário.
  const dashboardUrl = userData.role === "admin" ? "/admin" : "/cliente";
  // O HTML de update-profile.html (filename: update-profile.html) que você forneceu
  // já tem os IDs corretos para os links.
  if (homeLogoLink) homeLogoLink.href = dashboardUrl;
  if (backToDashboardMainLink) backToDashboardMainLink.href = dashboardUrl;

  if (nameInput) nameInput.value = userData.name || "";
  if (emailInput) emailInput.value = userData.email || "";
  // Certifica-se de que userData.phone existe e que formatPhone está disponível.
  if (phoneInput && typeof window.formatPhone === "function") {
    phoneInput.value = userData.phone ? window.formatPhone(userData.phone) : "";
    phoneInput.addEventListener("input", (e) => {
      e.target.value = window.formatPhone(e.target.value);
    });
  }

  // Setup User Menu Listeners
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
      if (typeof window.showToast === "function")
        window.showToast("Sessão encerrada com sucesso!", "success");
      window.location.href = "/login";
    });
  }

  // Handle profile update form submission
  if (updateProfileForm) {
    updateProfileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Salvando...";
      }

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phoneValue = phoneInput.value.replace(/\D/g, "");
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;

      let updateData = {
        name,
        email,
        phone: phoneValue === "" ? null : phoneValue,
      };
      let formIsValid = true;

      // Validações do formulário
      if (!name) {
        if (typeof window.showToast === "function")
          window.showToast("Nome completo é obrigatório.", "error");
        formIsValid = false;
      }
      if (!email) {
        if (typeof window.showToast === "function")
          window.showToast("Email é obrigatório.", "error");
        formIsValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (typeof window.showToast === "function")
          window.showToast("Formato de email inválido.", "error");
        formIsValid = false;
      }
      // Permite telefone vazio, mas se preenchido, valida o comprimento
      if (phoneValue && (phoneValue.length < 10 || phoneValue.length > 11)) {
        if (typeof window.showToast === "function")
          window.showToast("Telefone deve ter 10 ou 11 dígitos.", "error");
        formIsValid = false;
      }

      if (newPassword) {
        // Apenas processa campos de senha se uma nova senha for inserida
        if (!currentPassword) {
          if (typeof window.showToast === "function")
            window.showToast(
              "Senha atual é obrigatória para alterar a senha.",
              "error"
            );
          formIsValid = false;
        }
        if (newPassword.length < 6) {
          if (typeof window.showToast === "function")
            window.showToast(
              "Nova senha deve ter no mínimo 6 caracteres.",
              "error"
            );
          formIsValid = false;
        }
        if (newPassword !== confirmNewPassword) {
          if (typeof window.showToast === "function")
            window.showToast("As novas senhas não coincidem.", "error");
          formIsValid = false;
        }
        // Adiciona senhas aos dados de atualização somente se o formulário ainda for válido
        if (formIsValid) {
          updateData.currentPassword = currentPassword;
          updateData.newPassword = newPassword;
        }
      }

      if (!formIsValid) {
        if (submitButton) {
          // Reabilita o botão se a validação falhar
          submitButton.disabled = false;
          submitButton.textContent = "Salvar Alterações";
        }
        return;
      }

      // Tentativa de requisição ao backend
      try {
        const response = await fetch("/api/users/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        let result;
        try {
          // Tenta parsear o corpo da resposta como JSON.
          // O backend deve enviar JSON para mensagens de erro também.
          result = await response.json();
        } catch (jsonError) {
          // Se response.json() falhar (ex: corpo vazio ou não-JSON, erro de proxy)
          console.error(
            "Falha ao parsear resposta JSON do servidor:",
            jsonError,
            "Status da resposta:",
            response.status,
            response.statusText
          );
          if (typeof window.showToast === "function") {
            showToast(
              response.ok
                ? "Erro ao processar dados do servidor."
                : `Erro do servidor (${response.status}). Tente novamente.`,
              "error"
            );
          }
          // Lançar um erro específico para ser pego pelo catch externo e evitar processamento adicional
          throw new Error("InvalidJSONResponse");
        }

        if (!response.ok) {
          // Se o status HTTP indica um erro (4xx, 5xx)
          if (typeof window.showToast === "function") {
            showToast(
              result.message || `Erro ao atualizar: ${response.statusText}`,
              "error"
            );
          }
        } else {
          // Sucesso (status HTTP 2xx)
          if (typeof window.showToast === "function") {
            showToast(
              result.message || "Perfil atualizado com sucesso!",
              "success"
            );
          }

          if (result.user) {
            // Atualiza a variável local 'userData' e o localStorage
            userData = { ...userData, ...result.user };
            localStorage.setItem("user", JSON.stringify(userData));
            localUpdateUserMenuDisplay(userData); // Atualiza o display do menu
          } else {
            // Se o backend não retornar 'user' na resposta de sucesso, loga um aviso.
            console.warn(
              "Resposta de sucesso do servidor não continha o objeto 'user' atualizado."
            );
          }

          // Limpar campos de senha se uma nova senha foi fornecida (e processada)
          if (newPassword) {
            if (currentPasswordInput) currentPasswordInput.value = "";
            if (newPasswordInput) newPasswordInput.value = "";
            if (confirmNewPasswordInput) confirmNewPasswordInput.value = "";
          }
        }
      } catch (error) {
        // Captura erros de rede ou o erro "InvalidJSONResponse" lançado acima
        console.error(
          "Erro na operação de atualização de perfil:",
          error.message
        );
        // Evita mostrar "Erro de conexão" se já mostramos um erro de parse JSON mais específico
        if (error.message !== "InvalidJSONResponse") {
          if (typeof window.showToast === "function") {
            showToast(
              "Erro de conexão ao tentar atualizar. Verifique sua internet.",
              "error"
            );
          }
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Salvar Alterações";
        }
      }
    });
  }
});
