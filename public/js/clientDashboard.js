// public/js/clientDashboard.js

class ClientStateManager {
  constructor() {
    this.allServices = [];
    this.filteredServices = [];
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.selectedService = null;
    this.filterStatus = "all";
    this.searchQuery = "";
    this.dateFilter = "";
  }
  getAllServices() { return [...this.allServices]; }
  getFilteredServicesState() { return [...this.filteredServices]; }
  getCurrentPage() { return this.currentPage; }
  getItemsPerPage() { return this.itemsPerPage; }
  getSelectedService() { return this.selectedService; }
  getFilterStatus() { return this.filterStatus; }
  getSearchQuery() { return this.searchQuery; }
  getDateFilter() { return this.dateFilter; }

  setAllServices(services) {
    this.allServices = [...services].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    this.applyFilters();
  }
  setFilteredServices(services) { this.filteredServices = [...services]; }
  setCurrentPage(page) { this.currentPage = page; }
  setItemsPerPage(items) { this.itemsPerPage = parseInt(items, 10); this.resetCurrentPage(); }
  setSelectedService(service) { this.selectedService = service; }
  setFilterStatus(status) { this.filterStatus = status; this.applyFilters(); this.resetCurrentPage(); }
  setSearchQuery(query) { this.searchQuery = query; this.applyFilters(); this.resetCurrentPage(); }
  setDateFilter(date) { this.dateFilter = date; this.applyFilters(); this.resetCurrentPage(); }

  resetFilters() {
    this.filterStatus = "all"; this.searchQuery = ""; this.dateFilter = "";
    this.currentPage = 1; this.applyFilters();
  }
  resetCurrentPage() { this.currentPage = 1; }

  applyFilters() {
    let services = [...this.allServices];
    const status = this.getFilterStatus();
    const query = this.getSearchQuery().toLowerCase();
    const date = this.getDateFilter();
    if (status !== "all") { services = services.filter(s => s.status === status); }
    if (query) {
      services = services.filter(s =>
        (s.equipment_type && s.equipment_type.toLowerCase().includes(query)) ||
        (s.service_type && s.service_type.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.id && s.id.toString().includes(query))
      );
    }
    if (date) { services = services.filter(s => new Date(s.created_at).toISOString().split("T")[0] === date); }
    this.setFilteredServices(services);
  }
  calculateMetrics() {
    const services = this.getAllServices();
    return {
      total: services.length,
      inProgress: services.filter(s => s.status === "analysis" || s.status === "maintenance").length,
      finished: services.filter(s => s.status === "finished").length,
    };
  }
}

class ClientServicesManager {
  constructor(stateManagerInstance) { this.state = stateManagerInstance; this.apiUrl = "/api/services"; }
  getToken() { return localStorage.getItem("token"); }
  async fetchServices() { /* ... (como na sua versão anterior, chamando this.state.setAllServices) ... */ }
  getServiceById(id) { return this.state.getAllServices().find((service) => service.id === id); }
}

class ClientPaginationManager {
  constructor(stateManagerInstance) { this.state = stateManagerInstance; }
  getPaginatedServices() { /* ... (como antes, usando state.getFilteredServicesState) ... */ }
  getTotalPages() { /* ... (como antes, usando state.getFilteredServicesState) ... */ }
  goToNextPage() { /* ... (como antes) ... */ }
  goToPreviousPage() { /* ... (como antes) ... */ }
  goToPage(page) { /* ... (como antes) ... */ }
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
        if (this.closeDetailsButton) this.closeDetailsButton.addEventListener("click", () => this.closeServiceDetailsModal());
        if (this.serviceDetailsModal) this.serviceDetailsModal.addEventListener("click", (event) => { if (event.target === this.serviceDetailsModal) this.closeServiceDetailsModal();});
    }
    showServiceDetailsModal(service) { /* ... (como na sua versão anterior, usando window.formatDate e window.createStatusBadge) ... */ }
    closeServiceDetailsModal() { if (this.serviceDetailsModal) this.serviceDetailsModal.classList.add("hidden");}
}

class ClientUIRenderer {
  constructor(stateManagerInstance, servicesManagerInstance, paginationManagerInstance, modalsManagerInstance) {
    this.state = stateManagerInstance;
    this.servicesManager = servicesManagerInstance;
    this.pagination = paginationManagerInstance;
    this.modals = modalsManagerInstance;
    this.totalServicesEl = document.getElementById("client-total-services");
    this.inProgressServicesEl = document.getElementById("client-in-progress-services");
    this.finishedServicesEl = document.getElementById("client-finished-services");
    this.servicesTableBody = document.getElementById("client-services-table-body");
    this.paginationContainer = document.getElementById("client-pagination-container");
    this.searchInput = document.getElementById("client-search-input");
    this.statusFilterSelect = document.getElementById("client-status-filter");
    this.dateFilterInput = document.getElementById("client-date-filter");
    this.clearFiltersButton = document.getElementById("client-clear-filters");
  }
  renderMetrics() { /* ... (como antes) ... */ }
  renderServicesTable() { /* ... (como antes) ... */ }
  createServiceRow(service) { /* ... (como antes, usando window.formatDate e window.createStatusBadge) ... */ }
  renderPagination() { /* ... (como antes, chamando createPaginationInfo e createPaginationButtons) ... */ }
  createPaginationInfo(totalServices, singlePage = false) { /* ... (como antes, incluindo createItemsPerPageSelector) ... */ }
  createItemsPerPageSelector() { /* ... (como antes, chamando window.clientApp.renderAllFiltered()) ... */ }
  createPaginationButtons(totalPages) { /* ... (como antes, chamando window.clientApp.renderAllFiltered()) ... */ }
  createPaginationButton(type, text, totalPages, pageNumber = null) { /* ... (como antes, chamando window.clientApp.renderAllFiltered()) ... */ }
  updateClearFiltersButtonVisibility() { /* ... (como antes) ... */ }
  setupFilterEventListeners() { /* ... (como antes, chamando window.clientApp.renderAllFiltered()) ... */ }
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
    this.ui = new ClientUIRenderer(this.state, this.servicesManager, this.pagination, this.modals);
  }

  populateUserMenuInfo() {
    if (this.userData) {
        if (this.userNameDisplay) {
            this.userNameDisplay.textContent = this.userData.name ? this.userData.name.split(" ")[0] : 'Cliente';
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
        if (this.userMenuButton && !this.userMenuButton.contains(event.target) &&
            this.userDropdown && !this.userDropdown.contains(event.target) &&
            !this.userDropdown.classList.contains("hidden")) {
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

    if (!token || !userDataString) { this.redirectToLogin("Sessão inválida. Faça login."); return; }
    try { this.userData = JSON.parse(userDataString); } 
    catch (e) { this.redirectToLogin("Dados de usuário corrompidos. Faça login."); return; }
    
    if (!this.userData || this.userData.role !== "client") {
      if (this.userData && this.userData.role === "admin") { window.location.href = "/admin"; return; }
      this.redirectToLogin("Acesso não autorizado para este painel."); return;
    }

    this.populateUserMenuInfo();
    this.setupUserMenuListeners();
    this.setupMobileMenuListener();

    await this.servicesManager.fetchServices();
    this.renderAllFiltered();
    if (this.ui && typeof this.ui.setupFilterEventListeners === 'function') { // Verifica se ui e o método existem
        this.ui.setupFilterEventListeners();
    } else {
        console.error("Erro: UI ou setupFilterEventListeners não está definido no ClientDashboardApp.");
    }
  }

  redirectToLogin(toastMessage = "Acesso não autorizado.") {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    if (typeof window.showToast === "function") window.showToast(toastMessage, "error");
    setTimeout(() => { window.location.href = "/login"; }, 1500);
  }
  logoutUser() {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    if (typeof window.showToast === "function") window.showToast("Sessão encerrada com sucesso!", "success");
    setTimeout(() => { window.location.href = "/login"; }, 1000);
  }
  renderAllFiltered() {
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