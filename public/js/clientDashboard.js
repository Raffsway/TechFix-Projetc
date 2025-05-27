// public/js/clientDashboard.js

class ClientStateManager {
  constructor() {
    this.allServices = [];
    this.filteredServices = [];
    this.currentPage = 1;
    this.itemsPerPage = 5; // Padrão de itens por página
    this.selectedService = null;
    this.filterStatus = "all";
    this.searchQuery = "";
    this.dateFilter = "";
  }
  getAllServices() {
    return [...this.allServices];
  }
  getFilteredServicesState() {
    return [...this.filteredServices];
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
  getFilterStatus() {
    return this.filterStatus;
  }
  getSearchQuery() {
    return this.searchQuery;
  }
  getDateFilter() {
    return this.dateFilter;
  }

  setAllServices(services) {
    // Ordena por data de criação, mais recentes primeiro
    this.allServices = [...services].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    this.applyFilters(); // Aplica filtros imediatamente após definir os serviços
  }
  setFilteredServices(services) {
    this.filteredServices = [...services];
  }
  setCurrentPage(page) {
    this.currentPage = page;
  }
  setItemsPerPage(items) {
    this.itemsPerPage = parseInt(items, 10);
    this.resetCurrentPage();
  }
  setSelectedService(service) {
    this.selectedService = service;
  }
  setFilterStatus(status) {
    this.filterStatus = status;
    this.applyFilters();
    this.resetCurrentPage();
  }
  setSearchQuery(query) {
    this.searchQuery = query;
    this.applyFilters();
    this.resetCurrentPage();
  }
  setDateFilter(date) {
    this.dateFilter = date;
    this.applyFilters();
    this.resetCurrentPage();
  }

  resetFilters() {
    this.filterStatus = "all";
    this.searchQuery = "";
    this.dateFilter = "";
    this.currentPage = 1;
    this.applyFilters();
  }
  resetCurrentPage() {
    this.currentPage = 1;
  }

  applyFilters() {
    let services = [...this.allServices];
    const status = this.getFilterStatus();
    const query = this.getSearchQuery().toLowerCase();
    const date = this.getDateFilter();

    if (status !== "all") {
      services = services.filter((s) => s.status === status);
    }
    if (query) {
      services = services.filter(
        (s) =>
          (s.equipment_type &&
            s.equipment_type.toLowerCase().includes(query)) ||
          (s.service_type && s.service_type.toLowerCase().includes(query)) ||
          (s.description && s.description.toLowerCase().includes(query)) || // Clientes podem querer buscar na descrição
          (s.id && s.id.toString().includes(query)) // Permitir busca por ID
      );
    }
    if (date) {
      services = services.filter(
        (s) => new Date(s.created_at).toISOString().split("T")[0] === date
      );
    }
    this.setFilteredServices(services);
  }

  calculateMetrics() {
    const services = this.getAllServices(); // Usa todos os serviços para métricas, não apenas os filtrados
    return {
      total: services.length,
      // Considera "received", "analysis" e "maintenance" como em andamento para o cliente.
      inProgress: services.filter(
        (s) =>
          s.status === "analysis" ||
          s.status === "maintenance" ||
          s.status === "received"
      ).length,
      finished: services.filter((s) => s.status === "finished").length,
    };
  }
}

class ClientServicesManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
    this.apiUrl = "/api/services"; // Endpoint da API para buscar serviços
  }
  getToken() {
    return localStorage.getItem("token");
  }

  async fetchServices() {
    const token = this.getToken();
    if (!token) {
      console.error("Client: Token não encontrado.");
      if (typeof window.showToast === "function")
        window.showToast("Sessão expirada. Faça login.", "error");
      if (
        window.clientApp &&
        typeof window.clientApp.redirectToLogin === "function"
      ) {
        window.clientApp.redirectToLogin("Sessão expirada. Faça login.");
      } else {
        // Fallback se clientApp não estiver disponível (embora deva estar)
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return false;
    }
    try {
      const response = await fetch(this.apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401 || response.status === 403) {
        if (typeof window.showToast === "function")
          window.showToast("Acesso negado ou sessão expirada.", "error");
        if (
          window.clientApp &&
          typeof window.clientApp.redirectToLogin === "function"
        ) {
          window.clientApp.redirectToLogin("Acesso negado ou sessão expirada.");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return false;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erro HTTP ${response.status}` }));
        throw new Error(
          errorData.message ||
            `Erro ao buscar seus serviços: ${response.statusText}`
        );
      }
      const servicesFromAPI = await response.json();
      this.state.setAllServices(servicesFromAPI); // Atualiza o estado com os serviços buscados
      return true;
    } catch (error) {
      console.error("Erro ao buscar serviços (cliente):", error);
      if (typeof window.showToast === "function") {
        window.showToast(
          error.message || "Falha ao carregar os seus serviços.",
          "error"
        );
      }
      this.state.setAllServices([]); // Define como array vazio em caso de erro
      return false;
    }
  }

  getServiceById(id) {
    // Busca o serviço no estado para garantir que tem a versão mais completa disponível no frontend
    return this.state.getAllServices().find((service) => service.id === id);
  }
}

class ClientPaginationManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
  }

  getPaginatedServices() {
    const filtered = this.state.getFilteredServicesState();
    const startIndex =
      (this.state.getCurrentPage() - 1) * this.state.getItemsPerPage();
    const endIndex = startIndex + this.state.getItemsPerPage();
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages() {
    const filtered = this.state.getFilteredServicesState();
    if (this.state.getItemsPerPage() === 0) return 0;
    return Math.ceil(filtered.length / this.state.getItemsPerPage());
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
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.state.setCurrentPage(page);
      return true;
    }
    // Se tentar ir para a página 1 e ela for a única página ou não houver páginas, ajusta para 1.
    if (page === 1 && totalPages <= 1) {
      this.state.setCurrentPage(1);
      return true;
    }
    return false;
  }
}

class ClientModalsManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
    this.serviceDetailsModal = document.getElementById("service-details-modal");
    this.modalTitle = document.getElementById("modal-title-client");
    this.modalContent = document.getElementById("modal-content-client");
    this.closeDetailsButton = document.getElementById("close-modal-client");
    this._initEventListeners();
  }

  _initEventListeners() {
    if (this.closeDetailsButton) {
      this.closeDetailsButton.addEventListener("click", () =>
        this.closeServiceDetailsModal()
      );
    }
    if (this.serviceDetailsModal) {
      // Permite fechar o modal clicando fora do conteúdo dele
      this.serviceDetailsModal.addEventListener("click", (event) => {
        if (event.target === this.serviceDetailsModal)
          this.closeServiceDetailsModal();
      });
    }
  }

  showServiceDetailsModal(service) {
    if (!this.serviceDetailsModal || !this.modalTitle || !this.modalContent) {
      console.error("Elementos do modal de detalhes não encontrados.");
      return;
    }
    // Busca a versão mais atualizada do serviço do estado
    const serviceData =
      this.state.getAllServices().find((s) => s.id === service.id) || service;

    this.modalTitle.textContent = `Detalhes do Atendimento #${serviceData.id}`;
    this.modalContent.innerHTML = `
            <div class="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-techfix-light-blue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <h3 class="text-lg font-medium">#${serviceData.id} - ${
      serviceData.service_type || serviceData.equipment_type
    }</h3>
                <span class="ml-auto">${
                  window.createStatusBadge
                    ? window.createStatusBadge(serviceData.status).outerHTML
                    : serviceData.status
                }</span>
            </div>
            <div class="text-sm"><span class="font-semibold">Tipo de Equipamento:</span> ${
              serviceData.equipment_type || "N/A"
            }</div>
            ${
              serviceData.service_type
                ? `<div class="text-sm"><span class="font-semibold">Tipo de Serviço:</span> ${serviceData.service_type}</div>`
                : ""
            }
            <div class="text-sm"><span class="font-semibold">Data da Solicitação:</span> ${
              window.formatDate
                ? window.formatDate(serviceData.created_at)
                : serviceData.created_at
            }</div>
            <div class="text-sm"><span class="font-semibold">Última Atualização:</span> ${
              window.formatDate
                ? window.formatDate(serviceData.updated_at)
                : serviceData.updated_at
            }</div>
            <div class="mt-2"><span class="font-semibold">Descrição do Problema/Serviço:</span>
                <p class="mt-1 text-gray-700 text-sm break-words">${
                  serviceData.description || "N/A"
                }</p>
            </div>
            ${
              serviceData.photo_url
                ? `
                <div class="mt-2">
                    <strong class="block mb-1">Foto do Equipamento:</strong>
                    <img src="${serviceData.photo_url}" alt="Foto do equipamento ${serviceData.equipment_type}" class="modal-service-image h-auto rounded-md border mx-auto" style="max-height: 300px; object-fit: contain;">
                </div>`
                : ""
            }
            `;
    this.serviceDetailsModal.classList.remove("hidden");
  }

  closeServiceDetailsModal() {
    if (this.serviceDetailsModal)
      this.serviceDetailsModal.classList.add("hidden");
  }
}

class ClientUIRenderer {
  constructor(
    stateManagerInstance,
    servicesManagerInstance,
    paginationManagerInstance,
    modalsManagerInstance
  ) {
    this.state = stateManagerInstance;
    this.servicesManager = servicesManagerInstance;
    this.pagination = paginationManagerInstance;
    this.modals = modalsManagerInstance;

    this.totalServicesEl = document.getElementById("client-total-services");
    this.inProgressServicesEl = document.getElementById(
      "client-in-progress-services"
    );
    this.finishedServicesEl = document.getElementById(
      "client-finished-services"
    );
    this.servicesTableBody = document.getElementById(
      "client-services-table-body"
    );
    this.paginationContainer = document.getElementById(
      "client-pagination-container"
    );
    this.searchInput = document.getElementById("client-search-input");
    this.statusFilterSelect = document.getElementById("client-status-filter");
    this.dateFilterInput = document.getElementById("client-date-filter");
    this.clearFiltersButton = document.getElementById("client-clear-filters");
  }

  renderMetrics() {
    if (
      !this.totalServicesEl ||
      !this.inProgressServicesEl ||
      !this.finishedServicesEl
    )
      return;
    const metrics = this.state.calculateMetrics();
    this.totalServicesEl.textContent = metrics.total;
    this.inProgressServicesEl.textContent = metrics.inProgress;
    this.finishedServicesEl.textContent = metrics.finished;
  }

  renderServicesTable() {
    if (!this.servicesTableBody) {
      console.error(
        "Elemento client-services-table-body não encontrado para renderizar tabela."
      );
      return;
    }
    const paginatedServices = this.pagination.getPaginatedServices();
    this.servicesTableBody.innerHTML = "";

    if (paginatedServices.length === 0) {
      const emptyRow = document.createElement("tr");
      const filterActive =
        this.state.getFilterStatus() !== "all" ||
        this.state.getSearchQuery() !== "" ||
        this.state.getDateFilter() !== "";
      emptyRow.innerHTML = `<td colspan="6" class="text-center py-8 text-gray-500">${
        filterActive
          ? "Nenhum serviço encontrado para os filtros aplicados."
          : "Você ainda não possui solicitações de serviço."
      }</td>`;
      this.servicesTableBody.appendChild(emptyRow);
    } else {
      paginatedServices.forEach((service) => {
        this.servicesTableBody.appendChild(this.createServiceRow(service));
      });
    }
    this.renderPagination();
    this.updateClearFiltersButtonVisibility();
  }

  createServiceRow(service) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";

    // Colunas conforme client-dashboard.html: ID, Equipamento, Tipo de Serviço, Data Solicitação, Status, Ações
    row.innerHTML = `
        <td class="px-4 py-3 text-left font-medium text-gray-700 w-[80px]">#${
          service.id
        }</td>
        <td class="px-4 py-3 text-left text-gray-700">${
          service.equipment_type || "N/A"
        }</td>
        <td class="px-4 py-3 text-left text-gray-700">${
          service.service_type || "N/A"
        }</td>
        <td class="px-4 py-3 text-left text-gray-700">${
          window.formatDate
            ? window.formatDate(service.created_at)
            : service.created_at
        }</td>
        <td class="px-4 py-3 text-left text-gray-700">${
          window.createStatusBadge
            ? window.createStatusBadge(service.status).outerHTML
            : service.status
        }</td>
        <td class="px-4 py-3 text-left text-gray-700">
            <button class="table-action-btn view-details-client" title="Ver Detalhes" data-service-id="${
              service.id
            }">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
        </td>
    `;

    const viewButton = row.querySelector(".view-details-client");
    if (viewButton) {
      viewButton.addEventListener("click", () => {
        const fullService = this.servicesManager.getServiceById(service.id);
        if (fullService) {
          this.modals.showServiceDetailsModal(fullService);
        } else {
          console.warn(
            "Serviço não encontrado no estado para mostrar detalhes:",
            service.id
          );
          // Opcional: Mostrar um toast de erro ou tentar buscar o serviço individualmente se não encontrado.
          // this.modals.showServiceDetailsModal(service); // Mostra com os dados parciais se for o caso.
        }
      });
    }
    return row;
  }

  renderPagination() {
    if (!this.paginationContainer) return;
    this.paginationContainer.innerHTML = "";
    const totalPages = this.pagination.getTotalPages();
    const filteredCount = this.state.getFilteredServicesState().length;

    if (totalPages <= 1 && filteredCount <= this.state.getItemsPerPage()) {
      if (filteredCount > 0) {
        this.paginationContainer.appendChild(
          this.createPaginationInfo(filteredCount, true)
        );
      }
      return;
    }

    this.paginationContainer.appendChild(
      this.createPaginationInfo(filteredCount)
    );
    if (totalPages > 1) {
      this.paginationContainer.appendChild(
        this.createPaginationButtons(totalPages)
      );
    }
  }

  createPaginationInfo(filteredCount, singlePage = false) {
    const paginationInfoDiv = document.createElement("div");
    paginationInfoDiv.className = "flex items-center justify-between mb-4";

    const info = document.createElement("p");
    info.className = "text-sm text-gray-700";
    const currentPage = this.state.getCurrentPage();
    const itemsPerPage = this.state.getItemsPerPage();
    const start = Math.min((currentPage - 1) * itemsPerPage + 1, filteredCount);
    const end = Math.min(currentPage * itemsPerPage, filteredCount);

    if (filteredCount > 0) {
      info.textContent = `Mostrando ${start} a ${end} de ${filteredCount} resultados`;
    } else {
      info.textContent = "Nenhum resultado";
    }
    paginationInfoDiv.appendChild(info);

    // Só mostra seletor se não for página única E houver mais itens que o limite por página
    if (!singlePage && filteredCount > itemsPerPage) {
      paginationInfoDiv.appendChild(this.createItemsPerPageSelector());
    }
    return paginationInfoDiv;
  }

  createItemsPerPageSelector() {
    const container = document.createElement("div");
    container.className = "flex items-center gap-2";
    const label = document.createElement("label");
    label.textContent = "Itens por página:";
    label.className = "text-sm text-gray-700";
    label.htmlFor = "client-items-per-page-select"; // ID único para o select do cliente

    const select = document.createElement("select");
    select.id = "client-items-per-page-select";
    select.className = "border rounded-md px-2 py-1 text-sm bg-white";
    [5, 10, 15, 20].forEach((num) => {
      const option = document.createElement("option");
      option.value = num;
      option.textContent = num;
      if (this.state.getItemsPerPage() === num) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", (e) => {
      this.state.setItemsPerPage(parseInt(e.target.value, 10));
      // Certifique-se que window.clientApp está definido e acessível
      if (window.clientApp) window.clientApp.renderAllFiltered();
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

    if (totalPages >= pagesToShow && endPage - startPage + 1 < pagesToShow) {
      if (startPage === 1) endPage = Math.min(totalPages, pagesToShow);
      else if (endPage === totalPages)
        startPage = Math.max(1, totalPages - pagesToShow + 1);
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
    button.className =
      "px-3 py-1.5 rounded-md border text-sm min-w-[36px] transition-colors duration-150";

    if (type === "previous") {
      button.disabled = currentPage === 1;
      button.addEventListener("click", () => {
        if (this.pagination.goToPreviousPage() && window.clientApp)
          window.clientApp.renderAllFiltered();
      });
    } else if (type === "next") {
      button.disabled = currentPage === totalPages;
      button.addEventListener("click", () => {
        if (this.pagination.goToNextPage() && window.clientApp)
          window.clientApp.renderAllFiltered();
      });
    } else if (type === "page") {
      button.className +=
        pageNumber === currentPage
          ? " bg-techfix-dark-blue text-white border-techfix-dark-blue"
          : " bg-white text-gray-700 border-gray-300 hover:bg-gray-100";
      if (pageNumber === currentPage)
        button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        if (this.pagination.goToPage(pageNumber) && window.clientApp)
          window.clientApp.renderAllFiltered();
      });
    }
    if (button.disabled)
      button.className +=
        " bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200";
    return button;
  }

  updateClearFiltersButtonVisibility() {
    if (this.clearFiltersButton) {
      const isActive =
        this.state.getFilterStatus() !== "all" ||
        this.state.getSearchQuery() !== "" ||
        this.state.getDateFilter() !== "";
      this.clearFiltersButton.classList.toggle("hidden", !isActive);
    }
  }

  setupFilterEventListeners() {
    if (this.clearFiltersButton) {
      this.clearFiltersButton.addEventListener("click", () => {
        this.state.resetFilters(); // Reseta o estado dos filtros
        // Limpa os campos da UI
        if (this.searchInput) this.searchInput.value = "";
        if (this.statusFilterSelect) this.statusFilterSelect.value = "all";
        if (this.dateFilterInput) this.dateFilterInput.value = "";
        // Re-renderiza tudo
        if (window.clientApp) window.clientApp.renderAllFiltered();
      });
    }

    if (this.searchInput) {
      let searchDebounceTimer;
      this.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounceTimer);
        const query = e.target.value;
        searchDebounceTimer = setTimeout(() => {
          this.state.setSearchQuery(query); // Atualiza o estado
          if (window.clientApp) window.clientApp.renderAllFiltered(); // Re-renderiza
        }, 300); // Debounce para evitar renderizações excessivas
      });
    }

    if (this.statusFilterSelect) {
      this.statusFilterSelect.addEventListener("change", (e) => {
        this.state.setFilterStatus(e.target.value); // Atualiza o estado
        if (window.clientApp) window.clientApp.renderAllFiltered(); // Re-renderiza
      });
    }

    if (this.dateFilterInput) {
      this.dateFilterInput.addEventListener("change", (e) => {
        this.state.setDateFilter(e.target.value); // Atualiza o estado
        if (window.clientApp) window.clientApp.renderAllFiltered(); // Re-renderiza
      });
    }
  }
}

class ClientDashboardApp {
  constructor() {
    this.userMenuButton = document.getElementById("user-menu-button");
    this.userDropdown = document.getElementById("user-dropdown");
    this.userNameDisplay = document.getElementById("user-name-display");
    this.userNameDropdown = document.getElementById("user-name-dropdown");
    this.logoutButton = document.getElementById("logout-button");
    this.menuToggleButton = document.getElementById("menu-toggle");
    this.mainNav = document.getElementById("main-nav");
    this.userData = null;

    this.state = new ClientStateManager();
    this.servicesManager = new ClientServicesManager(this.state);
    this.pagination = new ClientPaginationManager(this.state);
    this.modals = new ClientModalsManager(this.state);
    this.ui = new ClientUIRenderer(
      this.state,
      this.servicesManager,
      this.pagination,
      this.modals
    );
  }

  populateUserMenuInfo() {
    if (this.userData) {
      if (this.userNameDisplay) {
        this.userNameDisplay.textContent = this.userData.name
          ? this.userData.name.split(" ")[0]
          : "Cliente";
      }
      if (this.userNameDropdown) {
        this.userNameDropdown.textContent = this.userData.email || "N/A";
      }
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
        if (
          this.userMenuButton &&
          !this.userMenuButton.contains(event.target) &&
          this.userDropdown &&
          !this.userDropdown.contains(event.target) &&
          !this.userDropdown.classList.contains("hidden")
        ) {
          this.userDropdown.classList.add("hidden");
          this.userMenuButton.setAttribute("aria-expanded", "false");
        }
      });
    }
    if (this.logoutButton) {
      this.logoutButton.addEventListener("click", () => this.logoutUser());
    }
  }
  setupMobileMenuListener() {
    // Se o menu mobile for relevante para o client-dashboard, sua lógica iria aqui.
    // Se não houver botão de menu mobile (id="menu-toggle"), esta função não fará nada.
    if (this.menuToggleButton && this.mainNav) {
      this.menuToggleButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const isHidden = this.mainNav.classList.toggle("hidden");
        this.mainNav.classList.toggle("flex", !isHidden);
        this.menuToggleButton.setAttribute("aria-expanded", String(!isHidden));
      });
    }
  }

  async init() {
    const token = localStorage.getItem("token");
    const userDataString = localStorage.getItem("user");

    if (!token || !userDataString) {
      this.redirectToLogin("Sessão inválida. Faça login.");
      return;
    }
    try {
      this.userData = JSON.parse(userDataString);
    } catch (e) {
      this.redirectToLogin("Dados de usuário corrompidos. Faça login.");
      return;
    }

    if (!this.userData || this.userData.role !== "client") {
      if (this.userData && this.userData.role === "admin") {
        window.location.href = "/admin";
        return;
      }
      this.redirectToLogin("Acesso não autorizado para este painel.");
      return;
    }

    this.populateUserMenuInfo();
    this.setupUserMenuListeners();
    this.setupMobileMenuListener();

    const fetchSuccess = await this.servicesManager.fetchServices(); // Aguarda a busca de serviços

    if (fetchSuccess) {
      // Só renderiza e configura filtros se a busca for bem-sucedida
      this.renderAllFiltered();
      if (this.ui && typeof this.ui.setupFilterEventListeners === "function") {
        this.ui.setupFilterEventListeners();
      } else {
        console.error(
          "Erro: UI ou setupFilterEventListeners não está definido no ClientDashboardApp."
        );
      }
    }
  }

  redirectToLogin(toastMessage = "Acesso não autorizado.") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function")
      window.showToast(toastMessage, "error");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1500);
  }
  logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function")
      window.showToast("Sessão encerrada com sucesso!", "success");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  }
  renderAllFiltered() {
    // A função applyFilters é chamada automaticamente pelo StateManager quando os filtros são alterados.
    // Portanto, aqui apenas renderizamos com base no estado atual.
    this.ui.renderMetrics();
    this.ui.renderServicesTable();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("client-dashboard-page")) {
    window.clientApp = new ClientDashboardApp();
    window.clientApp.init();
  }
});
