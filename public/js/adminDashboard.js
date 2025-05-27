// public/js/adminDashboard.js (Consolidado)

// Classe StateManager (como antes)
class StateManager {
  constructor() {
    this.services = [];
    this.filterStatus = "all";
    this.searchQuery = "";
    this.dateFilter = "";
    this.serviceToDelete = null;
    this.currentPage = 1;
    this.itemsPerPage = 5; // Padrão de itens por página
  }
  getServices() {
    return [...this.services];
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
  getServiceToDelete() {
    return this.serviceToDelete;
  }
  getCurrentPage() {
    return this.currentPage;
  }
  getItemsPerPage() {
    return this.itemsPerPage;
  }
  setServices(services) {
    this.services = [...services];
  }
  setFilterStatus(status) {
    this.filterStatus = status;
  }
  setSearchQuery(query) {
    this.searchQuery = query;
  }
  setDateFilter(date) {
    this.dateFilter = date;
  }
  setServiceToDelete(id) {
    this.serviceToDelete = id;
  }
  setCurrentPage(page) {
    this.currentPage = page;
  }
  setItemsPerPage(items) {
    this.itemsPerPage = parseInt(items, 10);
  }
  resetFilters() {
    this.filterStatus = "all";
    this.searchQuery = "";
    this.dateFilter = "";
    this.currentPage = 1; // Resetar para a primeira página ao limpar filtros
  }
  resetCurrentPage() {
    this.currentPage = 1;
  }
}

// Classe ServicesManager (como antes)
class ServicesManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
    this.apiUrl = "/api/services";
  }
  getToken() {
    return localStorage.getItem("token");
  }

  async fetchServices() {
    const token = this.getToken();
    if (!token) {
      console.error("Admin: Token não encontrado.");
      if (typeof window.showToast === "function")
        window.showToast("Sessão expirada. Faça login.", "error"); //
      localStorage.removeItem("user"); // Limpar usuário também
      window.location.href = "/login";
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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof window.showToast === "function")
          window.showToast("Acesso negado ou sessão expirada.", "error"); //
        window.location.href = "/login";
        return false;
      }
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erro HTTP ${response.status}` }));
        throw new Error(
          errorData.message || `Erro ao buscar serviços: ${response.status}`
        );
      }
      const servicesFromAPI = await response.json();
      this.state.setServices(servicesFromAPI);
      return true;
    } catch (error) {
      console.error("Erro ao buscar serviços (admin):", error);
      if (typeof window.showToast === "function") {
        //
        window.showToast(
          error.message || "Falha ao carregar os serviços.",
          "error"
        );
      }
      // Não redirecionar daqui, deixar o usuário tentar novamente ou ver a mensagem de erro.
      // A menos que seja um erro de autenticação, já tratado acima.
      return false;
    }
  }

  getFilteredServices() {
    let filtered = this.state.getServices();
    const status = this.state.getFilterStatus();
    const query = this.state.getSearchQuery().toLowerCase();
    const date = this.state.getDateFilter();

    if (status !== "all") {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (query) {
      filtered = filtered.filter(
        (s) =>
          (s.client_name && s.client_name.toLowerCase().includes(query)) ||
          (s.clientName && s.clientName.toLowerCase().includes(query)) ||
          (s.equipment_type &&
            s.equipment_type.toLowerCase().includes(query)) ||
          (s.id && s.id.toString().includes(query)) ||
          (s.client_cpf && s.client_cpf.includes(query))
      );
    }
    if (date) {
      filtered = filtered.filter((s) => {
        const serviceDate = new Date(s.created_at).toISOString().split("T")[0];
        return serviceDate === date;
      });
    }
    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ); // Ordenar aqui
  }

  async updateServiceStatus(id, newStatus) {
    const token = this.getToken();
    if (!token) {
      if (typeof window.showToast === "function")
        window.showToast("Sessão expirada. Faça login.", "error"); //
      window.location.href = "/login";
      return null;
    }
    try {
      const response = await fetch(`${this.apiUrl}/${id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erro HTTP ${response.status}` }));
        throw new Error(
          errorData.message || `Erro ao atualizar status: ${response.status}`
        );
      }
      const updatedService = await response.json();
      // Atualiza o estado local
      const services = this.state.getServices();
      const serviceIndex = services.findIndex((service) => service.id === id);
      if (serviceIndex !== -1) {
        services[serviceIndex] = {
          ...services[serviceIndex],
          ...updatedService,
        };
        this.state.setServices(services); // Atualiza a lista de serviços no estado
      }
      return updatedService;
    } catch (error) {
      console.error(`Erro ao atualizar status do serviço ${id}:`, error);
      if (typeof window.showToast === "function")
        showToast(error.message || "Erro ao atualizar status.", "error"); //
      return null;
    }
  }

  async deleteService(id) {
    const token = this.getToken();
    if (!token) {
      if (typeof window.showToast === "function")
        window.showToast("Sessão expirada. Faça login.", "error"); //
      window.location.href = "/login";
      return false;
    }
    try {
      const response = await fetch(`${this.apiUrl}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `Erro HTTP ${response.status}` }));
        throw new Error(
          errorData.message || `Erro ao excluir serviço: ${response.status}`
        );
      }
      // Atualiza o estado local removendo o serviço
      let services = this.state.getServices();
      this.state.setServices(services.filter((service) => service.id !== id));
      return true;
    } catch (error) {
      console.error(`Erro ao excluir serviço ${id}:`, error);
      if (typeof window.showToast === "function")
        showToast(error.message || "Erro ao excluir serviço.", "error"); //
      return false;
    }
  }
  calculateMetrics() {
    const services = this.state.getServices(); // Pega todos os serviços, não apenas os filtrados para métricas globais
    return {
      total: services.length,
      inProgress: services.filter(
        (s) => s.status === "analysis" || s.status === "maintenance"
      ).length,
      finished: services.filter((s) => s.status === "finished").length,
    };
  }
}

// Classe PaginationManager (como antes)
class PaginationManager {
  constructor(stateManagerInstance, servicesManagerInstance) {
    this.state = stateManagerInstance;
    this.services = servicesManagerInstance; // Instância de ServicesManager
  }
  getPaginatedServices() {
    const filtered = this.services.getFilteredServices(); // Usa os serviços filtrados
    const startIndex =
      (this.state.getCurrentPage() - 1) * this.state.getItemsPerPage();
    const endIndex = startIndex + this.state.getItemsPerPage();
    return filtered.slice(startIndex, endIndex);
  }
  getTotalPages() {
    const filtered = this.services.getFilteredServices(); // Usa os serviços filtrados
    if (this.state.getItemsPerPage() === 0) return 0; // Evita divisão por zero
    return Math.ceil(filtered.length / this.state.getItemsPerPage());
  }
  adjustCurrentPageAfterDeletion() {
    const totalPages = this.getTotalPages();
    if (this.state.getCurrentPage() > totalPages && totalPages > 0) {
      this.state.setCurrentPage(totalPages);
    } else if (totalPages === 0 && this.state.getServices().length > 0) {
      // Se não há resultados filtrados, mas há serviços
      this.state.setCurrentPage(1); // Volta para a pág 1
    } else if (this.state.getServices().length === 0) {
      // Se não há serviços de todo
      this.state.setCurrentPage(1);
    }
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
    // Se a página solicitada estiver fora do intervalo, mas for a única página possível (ou seja, 1)
    if (page === 1 && this.getTotalPages() <= 1) {
      this.state.setCurrentPage(1);
      return true;
    }
    return false;
  }
}

// Classe FiltersManager (como antes)
class FiltersManager {
  constructor(stateManagerInstance) {
    this.state = stateManagerInstance;
    this.searchInput = document.getElementById("search-input");
    this.statusFilterSelect = document.getElementById("status-filter");
    this.dateFilterInput = document.getElementById("date-filter");
    this.clearFiltersButton = document.getElementById("clear-filters");
  }
  handleSearchChange(value) {
    this.state.setSearchQuery(value.trim());
    this.state.resetCurrentPage();
  }
  handleStatusFilterChange(value) {
    this.state.setFilterStatus(value);
    this.state.resetCurrentPage();
  }
  handleDateFilterChange(value) {
    this.state.setDateFilter(value);
    this.state.resetCurrentPage();
  }
  clearFiltersAndUI() {
    this.state.resetFilters(); // Reseta o estado
    // Reseta os valores dos inputs no DOM
    if (this.searchInput) this.searchInput.value = "";
    if (this.statusFilterSelect) this.statusFilterSelect.value = "all";
    if (this.dateFilterInput) this.dateFilterInput.value = "";
    this.updateFiltersUI(); // Atualiza a visibilidade do botão "Limpar filtros"
  }
  hasActiveFilters() {
    return (
      this.state.getFilterStatus() !== "all" ||
      this.state.getSearchQuery() !== "" ||
      this.state.getDateFilter() !== ""
    );
  }
  updateFiltersUI() {
    if (this.clearFiltersButton) {
      this.clearFiltersButton.classList.toggle(
        "hidden",
        !this.hasActiveFilters()
      );
    }
  }
}

// Classe ModalsManager (como antes)
class ModalsManager {
  constructor(
    stateManagerInstance,
    handleStatusChangeCallback,
    handleDeleteServiceCallback
  ) {
    this.state = stateManagerInstance;
    this.handleStatusChangeCallback = handleStatusChangeCallback; // para AdminDashboardApp.handleStatusChange
    this.handleDeleteServiceCallback = handleDeleteServiceCallback; // para AdminDashboardApp.handleDeleteService

    this.serviceDetailsModal = document.getElementById("service-details-modal");
    this.deleteConfirmModal = document.getElementById("delete-confirm-modal");
    this.modalTitle = document.getElementById("modal-title-details");
    this.modalContent = document.getElementById("modal-content-details");
    this.closeDetailsButton = document.getElementById("close-modal-details");
    this.cancelDeleteButton = document.getElementById("cancel-delete");
    this.confirmDeleteButton = document.getElementById("confirm-delete");
    this._initEventListeners();
  }

  _initEventListeners() {
    if (this.closeDetailsButton) {
      this.closeDetailsButton.addEventListener("click", () =>
        this.closeServiceDetailsModal()
      );
    }
    if (this.serviceDetailsModal) {
      this.serviceDetailsModal.addEventListener("click", (event) => {
        if (event.target === this.serviceDetailsModal)
          this.closeServiceDetailsModal();
      });
    }
    if (this.cancelDeleteButton) {
      this.cancelDeleteButton.addEventListener("click", () =>
        this.closeDeleteConfirmModal()
      );
    }
    if (this.deleteConfirmModal) {
      this.deleteConfirmModal.addEventListener("click", (event) => {
        if (event.target === this.deleteConfirmModal)
          this.closeDeleteConfirmModal();
      });
    }
    // O confirmDeleteButton é configurado em AdminDashboardApp para chamar handleDeleteServiceCallback
  }

  showServiceDetails(service) {
    if (!this.serviceDetailsModal || !this.modalTitle || !this.modalContent)
      return;

    const serviceData =
      this.state.getServices().find((s) => s.id === service.id) || service;

    this.modalTitle.textContent = `Detalhes do Atendimento #${serviceData.id}`;
    const clientName =
      serviceData.client_name || serviceData.clientName || "N/A";
    const clientCpf = serviceData.client_cpf
      ? typeof window.formatCPF === "function"
        ? window.formatCPF(serviceData.client_cpf)
        : serviceData.client_cpf //
      : "N/A";
    const clientPhone = serviceData.client_phone
      ? typeof window.formatPhone === "function"
        ? window.formatPhone(serviceData.client_phone)
        : serviceData.client_phone //
      : serviceData.phone
      ? typeof window.formatPhone === "function"
        ? window.formatPhone(serviceData.phone)
        : serviceData.phone
      : ""; //

    this.modalContent.innerHTML = `
             <div class="flex items-center gap-2 mb-3">
                 <svg xmlns="http://www.w3.org/2000/svg" class="text-techfix-light-blue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                 <h3 class="text-lg font-medium">#${serviceData.id} - ${
      serviceData.service_type || serviceData.equipment_type
    }</h3>
                 <span class="ml-auto">${
                   typeof window.createStatusBadge === "function"
                     ? window.createStatusBadge(serviceData.status).outerHTML
                     : serviceData.status
                 }</span> </div>
             <div class="text-sm"><span class="font-semibold">Cliente:</span> ${clientName}</div>
             ${
              clientCpf
                ? `<div class="text-sm"><span class="font-semibold">CPF:</span> ${clientCpf}</div>`
                : ""
            }
             ${
               clientPhone
                 ? `<div class="text-sm"><span class="font-semibold">Telefone:</span> ${clientPhone}</div>`
                 : ""
             }
             <div class="text-sm"><span class="font-semibold">Tipo de Equipamento:</span> ${
               serviceData.equipment_type
             }</div>
             ${
               serviceData.service_type
                 ? `<div class="text-sm"><span class="font-semibold">Tipo de Serviço:</span> ${serviceData.service_type}</div>`
                 : ""
             }
             <div class="text-sm"><span class="font-semibold">Data de Criação:</span> ${
               typeof window.formatDate === "function"
                 ? window.formatDate(serviceData.created_at)
                 : serviceData.created_at
             }</div> <div class="text-sm"><span class="font-semibold">Última Atualização:</span> ${
      typeof window.formatDate === "function"
        ? window.formatDate(serviceData.updated_at)
        : serviceData.updated_at
    }</div> <div class="mt-2"><span class="font-semibold">Descrição:</span>
                <p class="mt-1 text-gray-700 text-sm break-words">${
                  serviceData.description
                }</p>
             </div>
             ${
               serviceData.photo_url
                 ? `<div class="mt-2"><strong class="block mb-1">Foto:</strong><img src="${serviceData.photo_url}" alt="Foto do equipamento ${serviceData.equipment_type}" class="modal-service-image h-auto rounded-md border mx-auto"></div>` // Adicionada a classe 'modal-service-image' e removida 'max-w-xs'
                 : ""
             }
             <div class="mt-4 space-y-2">
                 <div>
                 <span class="font-semibold">Alterar Status:</span>
                 <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                     ${Object.entries(
                       window.statusLabels || {
                         received: "Recebido",
                         analysis: "Em Análise",
                         maintenance: "Em Manutenção",
                         finished: "Finalizado",
                       }
                     ) //
                       .map(
                         ([key, label]) => `
                     <button class="btn btn-sm ${
                       serviceData.status === key
                         ? "btn-primary"
                         : "btn-outline"
                     } rounded-md py-1.5 px-2 text-xs modal-change-status-btn" data-status-key="${key}" data-service-id="${
                           serviceData.id
                         }">
                         ${label}
                     </button>`
                       )
                       .join("")}
                 </div>
                 </div>
             </div>`;
    this.serviceDetailsModal.classList.remove("hidden");

    this.modalContent
      .querySelectorAll(".modal-change-status-btn")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const newStatus = button.dataset.statusKey;
          const serviceId = parseInt(button.dataset.serviceId, 10);
          if (this.handleStatusChangeCallback) {
            this.closeServiceDetailsModal();
            this.handleStatusChangeCallback(serviceId, newStatus);
          }
        });
      });
  }
  closeServiceDetailsModal() {
    if (this.serviceDetailsModal)
      this.serviceDetailsModal.classList.add("hidden");
  }
  showDeleteConfirmModal(id) {
    if (!this.deleteConfirmModal) return;
    this.state.setServiceToDelete(id);
    this.deleteConfirmModal.classList.remove("hidden");
  }
  closeDeleteConfirmModal() {
    if (this.deleteConfirmModal)
      this.deleteConfirmModal.classList.add("hidden");
    this.state.setServiceToDelete(null);
  }
}

// Classe UIRenderer (como antes, mas com chamadas explícitas a window.formatDate, etc.)
class UIRenderer {
  constructor(
    stateManagerInstance,
    servicesManagerInstance,
    paginationManagerInstance,
    modalsManagerInstance,
    filtersManagerInstance // Adicionado
  ) {
    this.state = stateManagerInstance;
    this.services = servicesManagerInstance;
    this.pagination = paginationManagerInstance;
    this.modals = modalsManagerInstance;
    this.filters = filtersManagerInstance; // Adicionado

    this.totalServicesElement = document.getElementById("total-services");
    this.inProgressServicesElement = document.getElementById(
      "in-progress-services"
    );
    this.finishedServicesElement = document.getElementById("finished-services");
    this.servicesTableBody = document.getElementById("services-table-body");
    this.paginationContainer = document.getElementById("pagination-container");
  }

  renderMetrics() {
    if (
      !this.totalServicesElement ||
      !this.inProgressServicesElement ||
      !this.finishedServicesElement
    )
      return;
    const metrics = this.services.calculateMetrics();
    this.totalServicesElement.textContent = metrics.total;
    this.inProgressServicesElement.textContent = metrics.inProgress;
    this.finishedServicesElement.textContent = metrics.finished;
  }

  renderServicesTable() {
    if (!this.servicesTableBody) return;
    const paginatedServices = this.pagination.getPaginatedServices();
    this.servicesTableBody.innerHTML = "";

    if (paginatedServices.length === 0) {
      const emptyRow = document.createElement("tr");
      const filterActive = this.filters.hasActiveFilters();
      emptyRow.innerHTML = `<td colspan="7" class="text-center py-8 text-gray-500">${
        filterActive
          ? "Nenhum serviço encontrado para os filtros aplicados."
          : "Nenhuma manutenção cadastrada."
      }</td>`;
      this.servicesTableBody.appendChild(emptyRow);
    } else {
      paginatedServices.forEach((service) => {
        this.servicesTableBody.appendChild(this.createServiceRow(service));
      });
    }
    this.renderPagination();
    this.filters.updateFiltersUI(); // Garante que o botão de limpar filtros seja atualizado
  }

  createServiceRow(service) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    const clientName = service.client_name || service.clientName || "N/A";
    const serviceTypeDisplay = service.service_type || "N/A";

    row.innerHTML = `
             <td class="px-4 py-3 font-medium">#${service.id}</td>
             <td class="px-4 py-3">${clientName}</td>
             <td class="px-4 py-3">${service.equipment_type}</td>
             <td class="px-4 py-3">${serviceTypeDisplay}</td>
             <td class="px-4 py-3">${
               typeof window.formatDate === "function"
                 ? window.formatDate(service.created_at)
                 : service.created_at
             }</td> <td class="px-4 py-3">${
      typeof window.createStatusBadge === "function"
        ? window.createStatusBadge(service.status).outerHTML
        : service.status
    }</td> <td class="px-4 py-3 text-right">
                 <div class="flex justify-end gap-2">
                     <button class="table-action-btn view-details" title="Ver Detalhes" data-service-id="${
                       service.id
                     }">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                     </button>
                     <button class="table-action-btn delete-service text-red-600 hover:bg-red-100 hover:border-red-500" title="Excluir" data-service-id="${
                       service.id
                     }">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                     </button>
                 </div>
             </td>`;

    row.querySelector(".view-details").addEventListener("click", () => {
      const fullService = this.state
        .getServices()
        .find((s) => s.id === service.id);
      if (fullService) this.modals.showServiceDetails(fullService);
    });
    row.querySelector(".delete-service").addEventListener("click", () => {
      this.modals.showDeleteConfirmModal(service.id);
    });
    return row;
  }

  renderPagination() {
    if (!this.paginationContainer) return;
    this.paginationContainer.innerHTML = "";

    const totalPages = this.pagination.getTotalPages();
    const filteredCount = this.services.getFilteredServices().length;

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
      info.textContent = "Nenhum resultado para os filtros atuais";
    }
    paginationInfoDiv.appendChild(info);

    // Só mostra o seletor de itens por página se houver mais de uma página ou se não for uma página única forçada
    if (!singlePage && filteredCount > itemsPerPage) {
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
    label.htmlFor = "items-per-page-select";
    const select = document.createElement("select");
    select.id = "items-per-page-select";
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
      this.state.resetCurrentPage(); // Volta para a primeira página ao mudar itens por página
      window.adminApp.renderAll();
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
    const pagesToShow = 5; // Número de botões de página a serem mostrados (excluindo prev/next)
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + pagesToShow - 1);

    // Ajusta startPage e endPage para garantir que 'pagesToShow' sejam exibidos se possível
    if (totalPages >= pagesToShow && endPage - startPage + 1 < pagesToShow) {
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
    button.className =
      "px-3 py-1.5 rounded-md border text-sm min-w-[36px] transition-colors duration-150";
    if (type === "previous") {
      button.disabled = currentPage === 1;
      button.addEventListener("click", () => {
        if (this.pagination.goToPreviousPage()) window.adminApp.renderAll();
      });
    } else if (type === "next") {
      button.disabled = currentPage === totalPages;
      button.addEventListener("click", () => {
        if (this.pagination.goToNextPage()) window.adminApp.renderAll();
      });
    } else if (type === "page") {
      button.className +=
        pageNumber === currentPage
          ? " bg-techfix-dark-blue text-white border-techfix-dark-blue"
          : " bg-white text-gray-700 border-gray-300 hover:bg-gray-100";
      if (pageNumber === currentPage)
        button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        if (this.pagination.goToPage(pageNumber)) window.adminApp.renderAll();
      });
    }
    if (button.disabled)
      button.className +=
        " bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200";
    return button;
  }
}

// Classe principal AdminDashboardApp
class AdminDashboardApp {
  constructor() {
    this.state = new StateManager();
    this.services = new ServicesManager(this.state);
    this.pagination = new PaginationManager(this.state, this.services);
    this.filters = new FiltersManager(this.state);
    // Passar o método de atualização do AdminDashboardApp para o ModalsManager
    this.modals = new ModalsManager(
      this.state,
      this.handleStatusChange.bind(this),
      this.handleDeleteService.bind(this)
    );
    this.ui = new UIRenderer(
      this.state,
      this.services,
      this.pagination,
      this.modals,
      this.filters
    );

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
    console.log("Admin Dashboard Initializing...");
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

    if (userData.role !== "admin") {
      this.redirectToLogin("Acesso não autorizado para este painel.");
      return;
    }

    this.displayUserName(userData);
    this.setupUserMenuListeners();
    // this.setupMobileMenuListener(); // Se houver menu mobile principal

    const servicesLoaded = await this.services.fetchServices();
    if (servicesLoaded) {
      this.renderAll(); // Renderiza tudo após carregar os serviços
    } else {
      // Mesmo se os serviços não carregarem, renderizar a tabela (que mostrará "nenhum serviço")
      // e as métricas (que mostrarão 0) é melhor que uma página em branco.
      this.renderAll();
    }
    this.setupEventListeners();
  }

  redirectToLogin(toastMessage = "Acesso não autorizado.") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function")
      window.showToast(toastMessage, "error"); //
    // Atraso para o toast ser visível antes do redirecionamento
    setTimeout(
      () => {
        window.location.href = "/login";
      },
      typeof window.showToast === "function" ? 1500 : 0
    );
  }

  displayUserName(userData) {
    const nameToDisplay =
      userData && userData.name ? userData.name.split(" ")[0] : "Admin";
    const emailToDisplay =
      userData && userData.email ? userData.email : "admin@techfix.com";

    if (this.userNameDisplay) {
      // No botão
      this.userNameDisplay.textContent = nameToDisplay;
    }
    if (this.userNameDropdown) {
      // No dropdown
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
      this.logoutButton.addEventListener("click", () => {
        this.logoutUser();
      });
    }
  }

  logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (typeof window.showToast === "function")
      window.showToast("Sessão encerrada com sucesso!", "success"); //
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  }

  setupEventListeners() {
    // Filtros
    if (this.filters.searchInput) {
      this.filters.searchInput.addEventListener("input", (e) => {
        this.filters.handleSearchChange(e.target.value);
        this.renderAll();
      });
    }
    if (this.filters.statusFilterSelect) {
      this.filters.statusFilterSelect.addEventListener("change", (e) => {
        this.filters.handleStatusFilterChange(e.target.value);
        this.renderAll();
      });
    }
    if (this.filters.dateFilterInput) {
      this.filters.dateFilterInput.addEventListener("change", (e) => {
        this.filters.handleDateFilterChange(e.target.value);
        this.renderAll();
      });
    }
    if (this.filters.clearFiltersButton) {
      this.filters.clearFiltersButton.addEventListener("click", () => {
        this.filters.clearFiltersAndUI(); // Limpa estado e UI
        this.renderAll();
      });
    }

    // Modal de deleção
    if (this.modals.confirmDeleteButton) {
      this.modals.confirmDeleteButton.addEventListener("click", async () => {
        const serviceId = this.state.getServiceToDelete();
        if (serviceId) {
          await this.handleDeleteService(serviceId); // Chama o método do app
        }
      });
    }
  }

  async handleStatusChange(serviceId, newStatus) {
    const updatedService = await this.services.updateServiceStatus(
      serviceId,
      newStatus
    );
    if (updatedService) {
      if (typeof window.showToast === "function")
        window.showToast(
          `Status do serviço #${serviceId} atualizado para "${window.statusLabels[newStatus]}".`,
          "success"
        ); //
      this.renderAll(); // Re-renderiza para refletir a mudança
    }
  }

  async handleDeleteService(serviceId) {
    const success = await this.services.deleteService(serviceId);
    this.modals.closeDeleteConfirmModal();
    if (success) {
      if (typeof window.showToast === "function")
        window.showToast(
          `Serviço #${serviceId} excluído com sucesso.`,
          "success"
        ); //
      this.pagination.adjustCurrentPageAfterDeletion(); // Ajusta a página atual se necessário
      this.renderAll(); // Re-renderiza tudo
    }
    // Se não for sucesso, o showToast de erro já foi chamado em services.deleteService
  }

  renderAll() {
    this.ui.renderMetrics();
    this.ui.renderServicesTable(); // renderServicesTable agora chama renderPagination e updateFiltersUI
  }
}

// Inicialização do App do Admin Dashboard
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("admin-dashboard-page")) {
    //
    window.adminApp = new AdminDashboardApp();
    window.adminApp.init();
  }
});
