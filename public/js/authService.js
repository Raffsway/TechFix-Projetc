// public/js/authService.js
document.addEventListener("DOMContentLoaded", () => {
  const { showToast, formatCPF } = window; // formatPhone não é mais necessário aqui

  const displayFormMessage = (formElement, message, type) => {
    const messageDivId = formElement.id.includes("signup")
      ? "signup-general-message"
      : "login-general-message";
    const messageDiv = document.getElementById(messageDivId);
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = "form-feedback-message hidden";
      messageDiv.classList.add(type);
      messageDiv.classList.remove("hidden");
    }
  };
  const displayInputError = (inputId, message) => {
    const errorDiv = document.getElementById(`${inputId}-error`); // Os divs de erro para nome e telefone devem ser removidos do HTML também
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove("hidden");
    }
  };
  const clearAllInputErrors = (formElement) => {
    formElement.querySelectorAll(".input-field-error-text").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
  };
  const clearFormMessage = (formElement) => {
    const messageDivId = formElement.id.includes("signup")
      ? "signup-general-message"
      : "login-general-message";
    const messageDiv = document.getElementById(messageDivId);
    if (messageDiv) {
      messageDiv.classList.add("hidden");
      messageDiv.textContent = "";
      messageDiv.className = "form-feedback-message hidden";
    }
  };

  // --- Lógica de Cadastro (signup.html) ---
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    // const nameInput = document.getElementById("name"); // REMOVIDO
    const cpfInput = document.getElementById("cpf");
    // const phoneInput = document.getElementById("phone"); // REMOVIDO
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const submitButton = signupForm.querySelector('button[type="submit"]');

    if (cpfInput && typeof formatCPF === "function") {
      cpfInput.addEventListener(
        "input",
        (e) => (e.target.value = formatCPF(e.target.value))
      );
    }
    // Listener para phoneInput removido

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormMessage(signupForm);
      clearAllInputErrors(signupForm);
      let isValid = true;

      // const name = nameInput.value.trim(); // REMOVIDO
      const cpfValue = cpfInput.value;
      // const phoneValue = phoneInput.value; // REMOVIDO
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      // Validações
      const cleanedCpf = cpfValue.replace(/\D/g, "");
      if (cleanedCpf.length !== 11) {
        displayInputError("cpf", "CPF deve conter 11 dígitos.");
        isValid = false;
      }
      // Validação de 'phone' REMOVIDA

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        displayInputError("email", "Email é obrigatório.");
        isValid = false;
      } else if (!emailPattern.test(email)) {
        displayInputError("email", "Formato de e-mail inválido.");
        isValid = false;
      }
      if (!password) {
        displayInputError("password", "Senha é obrigatória.");
        isValid = false;
      } else if (password.length < 6) {
        displayInputError(
          "password",
          "A senha deve ter pelo menos 6 caracteres."
        );
        isValid = false;
      }
      if (!confirmPassword) {
        displayInputError(
          "confirm-password",
          "Confirmação de senha é obrigatória."
        );
        isValid = false;
      } else if (password && password !== confirmPassword) {
        displayInputError("confirm-password", "As senhas não coincidem.");
        isValid = false;
      }

      if (!isValid) {
        displayFormMessage(
          signupForm,
          "Por favor, corrija os erros indicados.",
          "error"
        );
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Criando conta...";

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // name: name, // REMOVIDO - o backend precisará lidar com 'name' sendo NOT NULL na tabela users
            email: email,
            password: password,
            cpf: cleanedCpf,
            // phone: cleanedPhone, // REMOVIDO
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Erro ${response.status}: ${response.statusText}.`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (e) {
            /* Ignora se errorText não for JSON */
          }

          displayFormMessage(signupForm, errorMessage, "error");
          if (showToast) showToast(errorMessage, "error");
          return;
        }

        const data = await response.json();
        displayFormMessage(
          signupForm,
          (data.message || "Operação bem-sucedida!") +
            " Redirecionando para login...",
          "success"
        );
        if (showToast)
          showToast(data.message || "Cadastro realizado!", "success");
        signupForm.reset();
        setTimeout(() => {
          window.location.href =
            "/login?status=signup_success&email=" + encodeURIComponent(email);
        }, 2500);
      } catch (error) {
        console.error("Erro ao cadastrar (catch):", error);
        const errorMsg = "Erro de conexão ao tentar realizar o cadastro.";
        displayFormMessage(signupForm, errorMsg, "error");
        if (showToast) showToast(errorMsg, "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Criar Conta";
      }
    });
  }

  // --- Lógica de Login (login.html) ---
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    // ... (código de login permanece o mesmo que no arquivo original) ...
    const emailInput = document.getElementById("email"); // Adicionado para referência
    const passwordInput = document.getElementById("password"); // Adicionado para referência
    const submitButton = loginForm.querySelector('button[type="submit"]');

    const params = new URLSearchParams(window.location.search);
    if (params.has("status") && params.get("status") === "signup_success") {
      const successMsg =
        "Cadastro realizado com sucesso! Faça o login para continuar.";
      displayFormMessage(loginForm, successMsg, "info");
      if (showToast) showToast(successMsg, "success");
      const registeredEmail = params.get("email");
      if (registeredEmail && emailInput) {
        emailInput.value = registeredEmail;
      }
      if (window.history.replaceState) {
        const cleanURL = window.location.pathname;
        window.history.replaceState({ path: cleanURL }, "", cleanURL);
      }
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormMessage(loginForm);
      clearAllInputErrors(loginForm); // Limpar erros específicos de input também

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      let isValid = true;

      if (!email) {
        displayInputError("email-login", "Email é obrigatório."); // Usa ID específico do input de login
        isValid = false;
      } else {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          displayInputError("email-login", "Formato de e-mail inválido.");
          isValid = false;
        }
      }
      if (!password) {
        displayInputError("password-login", "Senha é obrigatória."); // Usa ID específico do input de login
        isValid = false;
      }

      if (!isValid) {
        // A mensagem geral pode ser desnecessária se os erros de input são mostrados
        // displayFormMessage(loginForm, "Email e senha são obrigatórios e o e-mail deve ser válido.", "error");
        // if (showToast) showToast("Email e senha são obrigatórios e o e-mail deve ser válido.", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Entrando...";

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Erro ${response.status}: ${response.statusText}.`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson && errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (e) {
            /* Ignora */
          }
          displayFormMessage(loginForm, errorMessage, "error");
          if (showToast) showToast(errorMessage, "error");
          return;
        }

        const data = await response.json();
        if (showToast)
          showToast(data.message || "Login bem-sucedido!", "success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // user agora inclui phone

        if (data.user.role === "admin") {
          window.location.href = "/admin";
        } else {
          // Assumindo que 'client' é o único outro role principal para dashboard
          window.location.href = "/cliente";
        }
      } catch (error) {
        console.error("Erro ao fazer login (catch):", error);
        const errorMsg = "Erro de conexão. Tente novamente.";
        displayFormMessage(loginForm, errorMsg, "error");
        if (showToast) showToast(errorMsg, "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Entrar";
      }
    });
  }
});
