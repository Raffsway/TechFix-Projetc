// public/js/authService.js
document.addEventListener("DOMContentLoaded", () => {
  const { showToast, formatCPF } = window;

  const displayFormMessage = (formElement, message, type) => {
    const messageDivId = formElement.id.includes("signup")
      ? "signup-general-message"
      : "login-general-message";
    const messageDiv = document.getElementById(messageDivId);
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = "form-feedback-message hidden";
      messageDiv.classList.add(type); // 'error', 'success', 'info'
      messageDiv.classList.remove("hidden");
    }
  };

  const displayInputError = (inputId, message) => {
    // Para login, os IDs dos divs de erro são como 'email-login-error'
    const errorDiv = document.getElementById(
      inputId.includes("-login") ? inputId + "-error" : inputId + "-error"
    );
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
    const cpfInput = document.getElementById("cpf");
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

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFormMessage(signupForm);
      clearAllInputErrors(signupForm);
      let isValid = true;

      const cpfValue = cpfInput.value;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const cleanedCpf = cpfValue.replace(/\D/g, "");

      if (cleanedCpf.length !== 11) {
        displayInputError("cpf", "CPF deve conter 11 dígitos.");
        isValid = false;
      }
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
            email: email,
            password: password,
            cpf: cleanedCpf,
          }),
        });

        const data = await response.json(); // Tenta parsear JSON independentemente do status para obter a mensagem

        if (!response.ok) {
          const errorMessage =
            data.message || `Erro ${response.status}: ${response.statusText}.`;
          displayFormMessage(signupForm, errorMessage, "error");
          if (showToast) showToast(errorMessage, "error");
        } else {
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
        }
      } catch (error) {
        // Erros de rede ou falha grave no fetch/JSON parse
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
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
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
      clearAllInputErrors(loginForm);

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      let isValid = true;

      if (!email) {
        displayInputError("email-login", "Email é obrigatório.");
        isValid = false;
      } else {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          displayInputError("email-login", "Formato de e-mail inválido.");
          isValid = false;
        }
      }
      if (!password) {
        displayInputError("password-login", "Senha é obrigatória.");
        isValid = false;
      }

      if (!isValid) {
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Entrando...";

      try {
        const response = await fetch("/api/auth/login", {
          // A linha que você mencionou
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        // Tenta obter a resposta como texto primeiro, para o caso de não ser JSON
        const responseText = await response.text();
        let data;

        if (!response.ok) {
          // Trata erros HTTP (4xx, 5xx)
          let errorMessage = `Erro ${response.status}.`;
          try {
            data = JSON.parse(responseText); // Tenta parsear como JSON
            errorMessage =
              data.message ||
              responseText ||
              `Erro ${response.status}: ${response.statusText}.`;
          } catch (e) {
            // Não era JSON, usa o texto da resposta se for curto e informativo, ou o statusText
            errorMessage =
              responseText.length > 0 && responseText.length < 200
                ? responseText
                : `Erro ${response.status}: ${response.statusText}.`;
          }
          displayFormMessage(loginForm, errorMessage, "error");
          if (showToast) showToast(errorMessage, "error");
          // Não precisa de 'return' aqui, pois o 'finally' cuidará do botão
        } else {
          // Resposta OK (2xx)
          try {
            data = JSON.parse(responseText); // Parseia o JSON da resposta de sucesso
            if (showToast)
              showToast(data.message || "Login bem-sucedido!", "success");

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            if (data.user && data.user.role === "admin") {
              window.location.href = "/admin";
            } else {
              window.location.href = "/cliente";
            }
          } catch (e) {
            // Resposta 2xx mas não era JSON válido
            console.error(
              "Erro ao parsear JSON da resposta de login:",
              e,
              "Raw response:",
              responseText
            );
            const errorMsg = "Resposta inesperada do servidor após o login.";
            displayFormMessage(loginForm, errorMsg, "error");
            if (showToast) showToast(errorMsg, "error");
          }
        }
      } catch (error) {
        // Captura erros de rede ou falhas na promessa do fetch
        console.error("Erro na requisição de login (catch):", error);
        // O 'error.message' pode ser "Failed to fetch" ou similar
        const errorMsg =
          error.message && error.message.includes("Failed to fetch")
            ? "Não foi possível conectar ao servidor. Verifique sua internet."
            : "Erro de conexão. Tente novamente.";
        displayFormMessage(loginForm, errorMsg, "error");
        if (showToast) showToast(errorMsg, "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Entrar";
      }
    });
  }
});
