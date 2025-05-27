// public/js/clientDashboard.js (Consolidado)

// Classe ClientStateManager (como antes)
class ClientStateManager {
  constructor() {
    this.services = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.selectedService = null; // Para o modal de detalhes
  }
  getServices() {
    return [...this.services];
  }
  getCurrentPage() {
    return this.currentPage;
  }
  getItemsPerPage() {
    return this.itemsPerPage;
  }
  getSelectedService() {
    return this.selectedService;
  }
  setServices(services) {
    this.services = [...services];
  }
  setCurrentPage(page) {
    this.currentPage = page;
  }
  setItemsPerPage(items) {
    this.itemsPerPage = parseInt(items, 10);
  }
  setSelectedService(service) {
    this.selectedService = service;
  }
  resetCurrentPage() {
    this.currentPage = 1;
  }
}

// Classe ClientServicesManager (como antes)
class ClientServicesManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
    this.apiUrl = "/api/services";
  }
  getToken() {
    return localStorage.getItem("token");
  }
  async fetchServices() {
    const token = this.getToken();
    const user = JSON.parse(localStorage.getItem("user")); // Necessário para pegar o CPF no backend implícito
    if (!token || !user) {
      console.error("Cliente: Token ou usuário não encontrado.");
      if (typeof window.showToast === "function") window.showToast("Sessão expirada. Faça login.", "error"); //
      localStorage.removeItem("token"); // Garantir limpeza
      localStorage.removeItem("user");
      window.location.href = "/login";
      return false;
    }
    try {
      const response = await fetch(this.apiUrl, { // O backend filtra pelo CPF do token
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof window.showToast === "function") window.showToast("Acesso negado ou sessão expirada.", "error"); //
        window.location.href = "/login";
        return false;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
        throw new Error(
          errorData.message || `Erro ao buscar serviços: ${response.status}`
        );
      }
      const servicesFromAPI = await response.json();
      this.state.setServices(servicesFromAPI);
      return true;
    } catch (error) {
      console.error("Erro ao buscar serviços (cliente):", error);
      if (typeof window.showToast === "function") { //
        window.showToast(
          error.message || "Falha ao carregar seus atendimentos.",
          "error"
        );
      }
      this.state.setServices([]); // Define como vazio em caso de erro
      return false;
    }
  }
  getServices() {
    const services = this.state.getServices();
    return services.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  getServiceById(id) {
    return this.state.getServices().find((service) => service.id === id);
  }
}

// Classe ClientPaginationManager (como antes)
class ClientPaginationManager {
  constructor(stateManagerInstance, servicesManagerInstance) {
    this.state = stateManagerInstance;
    this.services = servicesManagerInstance;
  }
  getPaginatedServices() {
    const allServices = this.services.getServices(); // Já ordenados
    const startIndex =
      (this.state.getCurrentPage() - 1) * this.state.getItemsPerPage();
    const endIndex = startIndex + this.state.getItemsPerPage();
    return allServices.slice(startIndex, endIndex);
  }
  getTotalPages() {
    const allServices = this.services.getServices();
    if (this.state.getItemsPerPage() === 0) return 0;
    return Math.ceil(allServices.length / this.state.getItemsPerPage());
  }
  goToNextPage() {
    if (this.state.getCurrentPage() < this.getTotalPages()) {
      this.state.setCurrentPage(this.state.getCurrentPage() + 1);
      return true;
    }
    return false;
  }
  goToPreviousPage() {
    if (this.state.getCurrentPage() > 1) {
      this.state.setCurrentPage(this.state.getCurrentPage() - 1);
      return true;
    }
    return false;
  }
  goToPage(page) {
     if (page >= 1 && page <= this.getTotalPages()) {
      this.state.setCurrentPage(page);
      return true;
    }
    if (page === 1 && this.getTotalPages() <= 1) { // Edge case para quando só há uma página
        this.state.setCurrentPage(1);
        return true;
    }
    return false;
  }
}

// Classe ClientModalsManager (nova, adaptada de ModalsManager do admin)
class ClientModalsManager {
    constructor(stateManagerInstance) {
        this.state = stateManagerInstance;
        this.serviceDetailsModal = document.getElementById("service-details-modal");
        this.modalTitle = document.getElementById("modal-title-client"); // ID do título do modal do cliente
        this.modalContent = document.getElementById("modal-content-client"); // ID do conteúdo do modal do cliente
        this.closeDetailsButton = document.getElementById("close-modal-client"); // ID do botão de fechar do cliente
        this._initEventListeners();
    }

    _initEventListeners() {
        if (this.closeDetailsButton) {
            this.closeDetailsButton.addEventListener("click", () => this.closeServiceDetailsModal());
        }
        if (this.serviceDetailsModal) {
            this.serviceDetailsModal.addEventListener("click", (event) => {
                if (event.target === this.serviceDetailsModal) this.closeServiceDetailsModal();
            });
        }
    }

    showServiceDetailsModal(service) {
        if (!this.serviceDetailsModal || !this.modalTitle || !this.modalContent) {
            console.error("Elementos do modal de detalhes do cliente não encontrados.");
            return;
        }
        
        const serviceData = this.state.getServices().find(s => s.id === service.id) || service;

        this.modalTitle.textContent = `Detalhes do Atendimento #${serviceData.id}`;
        this.modalContent.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                 <svg xmlns="http://www.w3.org/2000/svg" class="text-techfix-light-blue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 <h3 class="text-lg font-medium">#${serviceData.id} - ${serviceData.service_type || serviceData.equipment_type}</h3>
                 <span class="ml-auto">${(typeof window.createStatusBadge === 'function' ? window.createStatusBadge(serviceData.status).outerHTML : serviceData.status)}</span> </div>
            <div class="text-sm"><span class="font-semibold">Tipo de Equipamento:</span> ${serviceData.equipment_type}</div>
            ${serviceData.service_type ? `<div class="text-sm"><span class="font-semibold">Tipo de Serviço:</span> ${serviceData.service_type}</div>` : ""}
            <div class="text-sm"><span class="font-semibold">Data da Solicitação:</span> ${(typeof window.formatDate === 'function' ? window.formatDate(serviceData.created_at) : serviceData.created_at)}</div> <div class="text-sm"><span class="font-semibold">Última Atualização:</span> ${(typeof window.formatDate === 'function' ? window.formatDate(serviceData.updated_at) : serviceData.updated_at)}</div> <div class="mt-2"><span class="font-semibold">Descrição do Problema:</span>
                <p class="mt-1 text-gray-700 text-sm break-words">${serviceData.description}</p>
            </div>
            ${serviceData.photo_url ? `<div class="mt-2 text-center"><strong class="block mb-1">Foto do Equipamento:</strong><img src="${serviceData.photo_url}" alt="Foto do equipamento ${serviceData.equipment_type}" class="modal-service-image"></div>` : ""}
        `;
        this.serviceDetailsModal.classList.remove("hidden");
    }

    closeServiceDetailsModal() {
        if (this.serviceDetailsModal) {
            this.serviceDetailsModal.classList.add("hidden");
        }
    }
}


// Classe ClientUIRenderer (como antes, mas com chamadas explícitas a window.formatDate, etc.)
class ClientUIRenderer {
  constructor(
    stateManagerInstance,
    servicesManagerInstance,
    paginationManagerInstance,
    modalsManagerInstance // Adicionado
  ) {
    this.state = stateManagerInstance;
    this.services = servicesManagerInstance;
    this.pagination = paginationManagerInstance;
    this.modals = modalsManagerInstance; // Adicionado

    this.servicesTableBody = document.querySelector("#services-table tbody"); //
    this.paginationContainer = document.getElementById("pagination-container"); //
  }
  renderServicesTable() {
    if (!this.servicesTableBody) {
      console.error("Elemento services-table-body não encontrado!");
      return;
    }
    const paginatedServices = this.pagination.getPaginatedServices();
    this.servicesTableBody.innerHTML = "";
    if (paginatedServices.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML =
        '<td colspan="6" class="text-center py-8 text-gray-500">Nenhum atendimento encontrado.</td>';
      this.servicesTableBody.appendChild(emptyRow);
    } else {
      paginatedServices.forEach((service) => {
        this.servicesTableBody.appendChild(this.createServiceRow(service));
      });
    }
    this.renderPagination();
  }
  createServiceRow(service) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
      <td class="px-4 py-3 font-medium">#${service.id}</td>
      <td class="px-4 py-3">${service.equipment_type}</td>
      <td class="px-4 py-3 max-w-xs truncate" title="${service.description}">${service.description}</td>
      <td class="px-4 py-3">${(typeof window.formatDate === 'function' ? window.formatDate(service.created_at) : service.created_at)}</td> <td class="px-4 py-3">${(typeof window.createStatusBadge === 'function' ? window.createStatusBadge(service.status).outerHTML : service.status)}</td> <td class="px-4 py-3">
        <button class="text-techfix-light-blue hover:underline text-sm view-details-btn" data-service-id="${service.id}">Ver detalhes</button>
      </td>`;
    const viewDetailsButton = row.querySelector(".view-details-btn");
    if (viewDetailsButton) {
      viewDetailsButton.addEventListener("click", () => {
         const fullService = this.services.getServiceById(service.id);
         if(fullService) this.modals.showServiceDetailsModal(fullService);
        }
      );
    }
    return row;
  }
  renderPagination() {
    if (!this.paginationContainer) return;
    this.paginationContainer.innerHTML = "";

    const totalPages = this.pagination.getTotalPages();
    const totalServices = this.services.getServices().length;

    if (totalPages <= 1 && totalServices <= this.state.getItemsPerPage()) {
      if (totalServices > 0) {
        this.paginationContainer.appendChild(
          this.createPaginationInfo(totalServices, true)
        );
      }
      return;
    }

    this.paginationContainer.appendChild(
      this.createPaginationInfo(totalServices)
    );
    if (totalPages > 1) {
      this.paginationContainer.appendChild(
        this.createPaginationButtons(totalPages)
      );
    }
  }

  createPaginationInfo(totalServices, singlePage = false) {
    const paginationInfoDiv = document.createElement("div");
    paginationInfoDiv.className = "flex items-center justify-between mb-4";
    const info = document.createElement("p");
    info.className = "text-sm text-gray-700";
    const currentPage = this.state.getCurrentPage();
    const itemsPerPage = this.state.getItemsPerPage();
    const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalServices);
    const end = Math.min(currentPage * itemsPerPage, totalServices);
    if (totalServices > 0) {
      info.textContent = `Mostrando ${start} a ${end} de ${totalServices} atendimentos`;
    } else {
      info.textContent = "Nenhum atendimento";
    }
    paginationInfoDiv.appendChild(info);
    if (!singlePage && totalServices > itemsPerPage) {
      const itemsPerPageContainer = this.createItemsPerPageSelector();
      paginationInfoDiv.appendChild(itemsPerPageContainer);
    }
    return paginationInfoDiv;
  }

  createItemsPerPageSelector() {
    const container = document.createElement("div");
    container.className = "flex items-center gap-2";
    const label = document.createElement("label");
    label.textContent = "Itens por página:";
    label.className = "text-sm text-gray-700";
    label.htmlFor = "client-items-per-page-select";
    const select = document.createElement("select");
    select.id = "client-items-per-page-select";
    select.className = "border rounded-md px-2 py-1 text-sm bg-white";
    [5, 10, 15].forEach((num) => {
      const option = document.createElement("option");
      option.value = num;
      option.textContent = num;
      if (this.state.getItemsPerPage() === num) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", (e) => {
      this.state.setItemsPerPage(parseInt(e.target.value, 10));
      this.state.resetCurrentPage();
      window.clientApp.renderAll();
    });
    container.appendChild(label);
    container.appendChild(select);
    return container;
  }

  createPaginationButtons(totalPages) {
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "flex items-center justify-center gap-1";
    buttonsContainer.appendChild(
      this.createPaginationButton("previous", "Anterior", totalPages)
    );
    const currentPage = this.state.getCurrentPage();
    const pagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
     if (totalPages >= pagesToShow && (endPage - startPage + 1 < pagesToShow)) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, pagesToShow);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, totalPages - pagesToShow + 1);
        }
    }

    if (startPage > 1) {
      buttonsContainer.appendChild(
        this.createPaginationButton("page", "1", totalPages, 1)
      );
      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "px-3 py-1.5 text-gray-700";
        ellipsis.innerHTML = "&hellip;";
        buttonsContainer.appendChild(ellipsis);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      buttonsContainer.appendChild(
        this.createPaginationButton("page", i.toString(), totalPages, i)
      );
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "px-3 py-1.5 text-gray-700";
        ellipsis.innerHTML = "&hellip;";
        buttonsContainer.appendChild(ellipsis);
      }
      buttonsContainer.appendChild(
        this.createPaginationButton(
          "page",
          totalPages.toString(),
          totalPages,
          totalPages
        )
      );
    }
    buttonsContainer.appendChild(
      this.createPaginationButton("next", "Próxima", totalPages)
    );
    return buttonsContainer;
  }

  createPaginationButton(type, text, totalPages, pageNumber = null) {
    const button = document.createElement("button");
    const currentPage = this.state.getCurrentPage();
    button.textContent = text;
    button.className = "px-3 py-1.5 rounded-md border text-sm min-w-[36px] transition-colors duration-150";
    if (type === "previous") {
      button.disabled = currentPage === 1;
      button.addEventListener("click", () => {
        if (this.pagination.goToPreviousPage()) window.clientApp.renderAll();
      });
    } else if (type === "next") {
      button.disabled = currentPage === totalPages;
      button.addEventListener("click", () => {
        if (this.pagination.goToNextPage()) window.clientApp.renderAll();
      });
    } else if (type === "page") {
      button.className +=
        pageNumber === currentPage
          ? " bg-techfix-dark-blue text-white border-techfix-dark-blue"
          : " bg-white text-gray-700 border-gray-300 hover:bg-gray-50";
      if (pageNumber === currentPage)
        button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        if (this.pagination.goToPage(pageNumber)) window.clientApp.renderAll();
      });
    }
     if (button.disabled)
      button.className += " bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200";
    return button;
  }
}


// Classe principal ClientDashboardApp
class ClientDashboardApp {
  constructor() {
    this.state = new ClientStateManager();
    this.services = new ClientServicesManager(this.state);
    this.pagination = new ClientPaginationManager(this.state, this.services);
    this.modals = new ClientModalsManager(this.state); // Novo ClientModalsManager
    this.ui = new ClientUIRenderer(this.state, this.services, this.pagination, this.modals);

    // Elementos do Menu do Usuário
    this.userMenuButton = document.getElementById("user-menu-button");
    this.userDropdown = document.getElementById("user-dropdown");
    this.userNameDisplay = document.getElementById("user-name-display");
    this.userNameDropdown = document.getElementById("user-name-dropdown");
    this.logoutButton = document.getElementById("logout-button");
    // this.menuToggle = document.getElementById("menu-toggle"); // Se houver menu mobile principal
    // this.mainNav = document.getElementById("main-nav"); // Se houver menu mobile principal
  }

  async init() {
    console.log("Client Dashboard Initializing...");
    const token = localStorage.getItem("token");
    const userDataString = localStorage.getItem("user");

    if (!token || !userDataString) {
      this.redirectToLogin("Sessão inválida ou expirada. Faça login.");
      return;
    }

    let userData;
    try {
      userData = JSON.parse(userDataString);
    } catch (e) {
      this.redirectToLogin("Dados de usuário corrompidos. Faça login.");
      return;
    }

    // Verifica se o papel é 'client', caso contrário redireciona.
    // Se for 'admin', redireciona para o painel de admin.
    if (userData.role !== "client") {
        if (userData.role === "admin") {
            window.location.href = "/admin"; // ou "/admin-dashboard"
            return;
        }
      this.redirectToLogin("Acesso não autorizado para este painel.");
      return;
    }

    this.displayUserName(userData);
    this.setupUserMenuListeners();
    // this.setupMobileMenuListener(); // Se houver menu mobile principal

    const servicesLoaded = await this.services.fetchServices();
    // Renderiza mesmo que os serviços não carreguem para mostrar "Nenhum serviço"
    this.renderAll();
    // this.setupEventListeners(); // Se houver outros listeners globais da página
  }

  redirectToLogin(toastMessage = "Acesso não autorizado.") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function") window.showToast(toastMessage, "error"); //
     setTimeout(() => {
      window.location.href = "/login";
    }, typeof window.showToast === "function" ? 1500 : 0);
  }

  displayUserName(userData) {
    const nameToDisplay =
      userData && userData.name ? userData.name.split(" ")[0] : "Cliente";
    const emailToDisplay =
      userData && userData.email ? userData.email : "cliente@email.com";

    if (this.userNameDisplay) {
      this.userNameDisplay.textContent = nameToDisplay;
    }
    if (this.userNameDropdown) {
      this.userNameDropdown.textContent = emailToDisplay;
    }
  }

  setupUserMenuListeners() {
    if (this.userMenuButton && this.userDropdown) {
      this.userMenuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const isHidden = this.userDropdown.classList.toggle("hidden");
        this.userMenuButton.setAttribute("aria-expanded", !isHidden);
      });

      document.addEventListener("click", (event) => {
        if (this.userMenuButton && !this.userMenuButton.contains(event.target) &&
            this.userDropdown && !this.userDropdown.contains(event.target) &&
            !this.userDropdown.classList.contains("hidden")) {
          this.userDropdown.classList.add("hidden");
          this.userMenuButton.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (this.logoutButton) {
      this.logoutButton.addEventListener("click", () => {
        this.logoutUser();
      });
    }
  }

  logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function") window.showToast("Sessão encerrada com sucesso!", "success"); //
    setTimeout(() => {
        window.location.href = "/login";
    }, 1000);
  }

  renderAll() {
    this.ui.renderServicesTable(); // renderServicesTable agora chama renderPagination
  }
}

// Inicialização do App do Client Dashboard
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("client-dashboard-page")) { //
    window.clientApp = new ClientDashboardApp();
    window.clientApp.init();
  }
});