// public/js/modals.js
class ModalsManager {
  constructor(stateManagerInstance, handleStatusChangeCallback) {
    // Aceita o callback
    this.state = stateManagerInstance;
    this.handleStatusChangeCallback = handleStatusChangeCallback; // Armazena o callback
    // ... (seletores de modal como antes) ...
    this._initEventListeners();
  }

  _initEventListeners() {
    // ... (listeners para fechar modais)
  }

  // ... (showServiceDetails - altere a parte dos botões de status)
  showServiceDetails(service) {
    // ... (código para preencher título e conteúdo básico do modal) ...
    this.modalTitle.textContent = `Detalhes do Atendimento #${service.id}`;
    this.modalContent.innerHTML = `
      <div class="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-techfix-light-blue" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <h3 class="text-lg font-medium">#${service.id} - ${
      service.serviceType || service.equipmentType
    }</h3>
        <span class="ml-auto">${
          createStatusBadge(service.status).outerHTML
        }</span>
      </div>
      <div class="text-sm"><span class="font-semibold">Cliente:</span> ${
        service.clientName || "N/A"
      } (CPF: ${
      service.client_cpf ? formatCPF(service.client_cpf) : "N/A"
    })</div>
      ${
        service.phone
          ? `<div class="text-sm"><span class="font-semibold">Telefone:</span> ${formatPhone(
              service.phone
            )}</div>`
          : ""
      }
      <div class="text-sm"><span class="font-semibold">Tipo de Equipamento:</span> ${
        service.equipmentType
      }</div>
      ${
        service.serviceType
          ? `<div class="text-sm"><span class="font-semibold">Tipo de Serviço:</span> ${service.serviceType}</div>`
          : ""
      }
      <div class="text-sm"><span class="font-semibold">Data de Criação:</span> ${formatDate(
        service.createdAt
      )}</div>
      <div class="mt-2"><span class="font-semibold">Descrição:</span>
        <p class="mt-1 text-gray-700 text-sm">${service.description}</p>
      </div>
      ${
        service.photo_url
          ? `<div class="mt-2"><strong class="block mb-1">Foto:</strong><img src="${service.photo_url}" alt="Foto do equipamento" class="max-w-xs h-auto rounded-md border mx-auto"></div>`
          : ""
      }
      <div class="mt-4 space-y-2">
        <div>
          <span class="font-semibold">Alterar Status:</span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            ${Object.entries(window.statusLabels || {})
              .map(
                ([key, label]) => `
              <button
                class="btn btn-sm ${
                  service.status === key ? "btn-primary" : "btn-outline"
                } rounded-md py-1.5 px-2 text-xs"
                data-status-key="${key}" 
                data-service-id="${service.id}"
              >
                ${label}
              </button>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
    this.serviceDetailsModal.classList.remove("hidden");

    // Adiciona listeners aos novos botões de status
    this.modalContent
      .querySelectorAll("button[data-status-key]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const newStatus = button.dataset.statusKey;
          const serviceId = parseInt(button.dataset.serviceId, 10);
          if (this.handleStatusChangeCallback) {
            this.handleStatusChangeCallback(serviceId, newStatus); // Chama o callback do AdminDashboard
          }
        });
      });
    return this.modalContent;
  }

  // ... (closeServiceDetailsModal, showDeleteConfirmModal, closeDeleteConfirmModal, toggleStatusPopover, closeAllPopovers como antes)
  // ... (Certifique-se que toggleStatusPopover também use o handleStatusChangeCallback)
  toggleStatusPopover(
    triggerElement,
    serviceId,
    handleStatusChangeCallbackLocal
  ) {
    // ... (código do popover)
    // No listener de clique do botão de status do popover:
    // handleStatusChangeCallbackLocal(serviceId, newStatus); // Ou this.handleStatusChangeCallback
  }
}
