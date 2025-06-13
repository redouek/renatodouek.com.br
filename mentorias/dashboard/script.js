// Arquivo: mentorias/dashboard/script.js (CORRIGIDO)

// Variáveis globais para armazenar as atividades e o estado do toggle de concluídas
let allActivities = []; // Armazenará todas as atividades carregadas do servidor
let currentSearchTerm = '';
let showCompletedTasks = false; // False = Ocultar Concluídas, True = Ver Concluídas.
let selectedStatusFilters = []; // Para o filtro multi-seleção de status

// Variáveis para o modal de confirmação customizado
let customConfirmPromiseResolve;
let customConfirmPromiseReject;
let notificationBarTimeoutId; // Para limpar o timeout da notificação ao trocar de seção
let undoTimeout; // Variável para controlar o timeout da notificação "Desfazer"
let lastCompletedActivity = null; // Para armazenar a última atividade concluída para desfazer

// ===============================================================
// Funções Auxiliares
// ===============================================================

function formatarDataParaExibicao(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) {
        return dataString;
    }
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarDataParaInput(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) {
        return '';
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// getStatusClass agora define classes para o BADGE
function getStatusClass(status) {
    switch (status) {
        case "Não iniciada": return "status-nao-iniciada";
        case "Executando": return "status-executando";
        case "Concluída": return "status-concluida";
        case "Atrasada": return "status-atrasada";
        case "Perto de expirar": return "status-perto-expirar";
        default: return "";
    }
}

// ===============================================================
// Comunicação com Google Apps Script (GAS)
// ===============================================================

const webAppUrl = "https://script.google.com/macros/s/AKfycbxac_E54M7LJJm9M5VgUI1SgSiJJxx_YbI_9SlSukJKn1daKXFvBBNTlCAaV0Nv1Ocu-g/exec"; // Sua URL do Web App

async function callAppsScript(action, data = {}) {
    const formData = new FormData();
    formData.append('action', action);
    for (const key in data) {
        formData.append(key, data[key]);
    }

    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro na comunicação com o servidor (${response.status}): ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro ao chamar Apps Script para ação ${action}:`, error);
        showNotification(`Erro de comunicação: ${error.message}. Por favor, verifique sua conexão ou tente novamente.`, false);
        return { success: false, message: error.message };
    }
}

// ===============================================================
// Gerenciamento de Atividades (Frontend)
// ===============================================================

const activitiesTableBody = document.getElementById('activitiesTableBody');
const loadingActivitiesMessage = document.getElementById('loadingActivities');
const noActivitiesMessage = document.getElementById('noActivitiesMessage');
const toggleCompletedTasksBtn = document.getElementById('toggleCompletedTasksBtn');
const toggleTextSpan = toggleCompletedTasksBtn.querySelector('.toggle-text');
const toggleIconSpan = toggleCompletedTasksBtn.querySelector('.mdi');
const filterCountBadge = document.querySelector('.filter-count-badge'); // Contador de filtros

// Função para renderizar as atividades na tabela
function renderActivities(activitiesToRender) {
    activitiesTableBody.innerHTML = '';

    if (activitiesToRender.length === 0) {
        noActivitiesMessage.style.display = 'block';
        return;
    } else {
        noActivitiesMessage.style.display = 'none';
    }

    activitiesToRender.forEach(activity => {
        const row = document.createElement('tr');
        const isCompleted = activity.StatusAtual === 'Concluída';
        
        if (isCompleted) {
            row.classList.add('completed-task');
        }

        console.log("Atividade a ser renderizada (para descrição):", activity.DescricaoObservacoes);
        console.log("Valor a ser injetado na descrição:", String(activity.DescricaoObservacoes || 'VAZIO_NO_OBJETO'));

        row.innerHTML = `
            <td><input type="checkbox" data-activity-id="${activity.IDdaAtividade}" ${isCompleted ? 'checked' : ''}></td>
            <td>${activity.Atividade || ''}</td>
            <td>${activity.DescricaoObservacoes || ''}</td>
            <td>${formatarDataParaExibicao(activity.DataLimite)}</td>
            <td>
                <span class="status-badge ${getStatusClass(activity.StatusAtual)}" data-activity-id="${activity.IDdaAtividade}" title="Clique para editar status">${activity.StatusAtual}</span>
            </td>
            <td>
                <button class="edit-activity-btn icon-action-btn" data-activity-id="${activity.IDdaAtividade}" title="Editar">
                    <span class="mdi mdi-pencil"></span>
                </button>
                <button class="delete-activity-btn icon-action-btn" data-activity-id="${activity.IDdaAtividade}" title="Excluir">
                    <span class="mdi mdi-delete"></span>
                </button>
            </td>
        `;
        
        activitiesTableBody.appendChild(row);
    });

    addActivityEventListeners();
}

// Filtra e busca as atividades carregadas
function filterAndSearchActivities() {
    let filtered = allActivities.filter(activity => {
        // Lógica do toggle "Ver Concluídas" / "Ocultar Concluídas"
        if (!showCompletedTasks && activity.StatusAtual === 'Concluída') {
            return false;
        }
        // Lógica do filtro de status multi-seleção
        if (selectedStatusFilters.length > 0 && !selectedStatusFilters.includes(activity.StatusAtual)) {
            return false;
        }
        // Lógica da busca
        const searchTermLower = currentSearchTerm.toLowerCase();
        return (
            String(activity.Atividade || '').toLowerCase().includes(searchTermLower) ||
            String(activity.DescricaoObservacoes || '').toLowerCase().includes(searchTermLower)
        );
    });
    console.log("Atividades filtradas e/ou buscadas:", filtered);
    renderActivities(filtered);

    // Atualiza o contador de filtros selecionados
    if (filterCountBadge) {
        if (selectedStatusFilters.length > 0) {
            filterCountBadge.textContent = selectedStatusFilters.length;
            filterCountBadge.style.display = 'inline-block';
        } else {
            filterCountBadge.style.display = 'none';
        }
    }
}

// Carregar atividades do Apps Script
async function loadActivities() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || !usuario.cpf) {
        console.error("CPF do usuário não encontrado para carregar atividades.");
        noActivitiesMessage.textContent = "Erro: Usuário não identificado para carregar atividades.";
        noActivitiesMessage.style.display = 'block';
        loadingActivitiesMessage.style.display = 'none';
        return;
    }

    loadingActivitiesMessage.style.display = 'block';
    noActivitiesMessage.style.display = 'none';
    activitiesTableBody.innerHTML = ''; // Limpa a tabela antes de carregar

    const result = await callAppsScript('getActivitiesByCpf', { cpf: usuario.cpf.replace(/\D/g, '') });

    loadingActivitiesMessage.style.display = 'none';

    // CORREÇÃO: Mudança de result.status para result.success
    if (result.success && result.activities) {
        console.log("Atividades recebidas do Apps Script:", result.activities);
        allActivities = result.activities;
        filterAndSearchActivities(); // Renderiza com base nos filtros e busca atuais
    } else {
        allActivities = [];
        filterAndSearchActivities(); // Renderiza vazio e exibe mensagem de 'Nenhuma atividade'
        console.error("Falha ao carregar atividades:", result.message);
        showNotification("Erro ao carregar atividades: " + result.message, false);
    }
}

// ===============================================================
// Interações da Tabela de Atividades
// ===============================================================

function showNotification(message, showUndo = false) {
    // Garante que a notificação anterior seja limpa antes de mostrar uma nova
    clearTimeout(notificationBarTimeoutId);
    const notificationBar = document.getElementById('taskCompletedNotification');
    const notificationText = notificationBar.querySelector('span');
    const undoButton = document.getElementById('undoTaskButton');
    const progressLine = notificationBar.querySelector('.progress-line');

    notificationText.textContent = message;
    undoButton.style.display = showUndo ? 'inline-block' : 'none';
    progressLine.style.display = showUndo ? 'block' : 'none';

    notificationBar.classList.add('show');
    notificationBar.style.display = 'flex';

    // Reinicia a animação da linha de progresso
    if (showUndo) {
        progressLine.style.animation = 'none';
        void progressLine.offsetWidth; // Trigger reflow
        progressLine.style.animation = null;
        progressLine.style.animation = 'progressAnimation 3s linear forwards';

        clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            notificationBar.classList.remove('show');
            notificationBarTimeoutId = setTimeout(() => {
                notificationBar.style.display = 'none';
                lastCompletedActivity = null;
            }, 300);
        }, 3000);
    } else {
        clearTimeout(undoTimeout);
        notificationBarTimeoutId = setTimeout(() => {
            notificationBar.classList.remove('show');
            setTimeout(() => {
                notificationBar.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

async function handleCheckboxChange(event) {
    const checkbox = event.target;
    const activityId = checkbox.dataset.activityId;
    const isChecked = checkbox.checked;
    const activityRow = checkbox.closest('tr');

    const activity = allActivities.find(act => act.IDdaAtividade == activityId);
    if (!activity) return;

    let newStatus, oldStatusForUndo = activity.StatusAtual;

    if (isChecked) {
        newStatus = "Concluída";
        lastCompletedActivity = { ...activity, StatusAnterior: activity.StatusAtual };
        showNotification("Tarefa concluída!", true);
    } else {
        newStatus = activity.StatusAnterior || "Não iniciada";
        showNotification("Tarefa desmarcada.");
        lastCompletedActivity = null;
    }

    const result = await callAppsScript('updateActivityStatus', {
        id: activityId,
        newStatus: newStatus,
        oldStatusForUndo: oldStatusForUndo,
        concluidaPorCheckbox: isChecked ? 'Sim' : 'Não'
    });

    // CORREÇÃO: Mudança de result.status para result.success
    if (result.success) {
        const updatedActivity = allActivities.find(act => act.IDdaAtividade == activityId);
        if (updatedActivity) {
            updatedActivity.StatusAtual = newStatus;
            updatedActivity.StatusAnterior = oldStatusForUndo;
            updatedActivity.ConcluidaPorCheckbox = isChecked ? 'Sim' : 'Não';
        }
        activityRow.classList.toggle('completed-task', newStatus === 'Concluída');
        const statusBadge = activityRow.querySelector('.status-badge');
        statusBadge.textContent = newStatus;
        statusBadge.className = `status-badge ${getStatusClass(newStatus)}`;

        filterAndSearchActivities();
    } else {
        checkbox.checked = !isChecked;
        activityRow.classList.toggle('completed-task', !isChecked);
        showNotification("Erro ao atualizar tarefa: " + result.message, false);
    }
}

// Adiciona event listeners para os elementos dinâmicos da tabela
function addActivityEventListeners() {
    document.querySelectorAll('#activitiesTableBody input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange);
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    document.querySelectorAll('#activitiesTableBody .status-badge').forEach(badge => {
        badge.removeEventListener('click', openEditModal); 
        badge.addEventListener('click', openEditModal);
    });

    document.querySelectorAll('.edit-activity-btn').forEach(button => {
        button.removeEventListener('click', openEditModal);
        button.addEventListener('click', openEditModal);
    });

    document.querySelectorAll('.delete-activity-btn').forEach(button => {
        button.removeEventListener('click', handleDeleteActivity);
        button.addEventListener('click', handleDeleteActivity);
    });
}

// Lógica do botão "Desfazer" na notificação
document.getElementById('undoTaskButton').addEventListener('click', async () => {
    if (lastCompletedActivity) {
        const activityId = lastCompletedActivity.IDdaAtividade;
        const previousStatus = lastCompletedActivity.StatusAnterior;
        const checkbox = document.querySelector(`#activitiesTableBody input[type="checkbox"][data-activity-id="${activityId}"]`);
        const activityRow = checkbox.closest('tr');

        // Reverte no frontend imediatamente para feedback visual
        if (checkbox) checkbox.checked = false;
        const statusBadge = activityRow.querySelector('.status-badge');
        if(statusBadge) {
            statusBadge.textContent = previousStatus;
            statusBadge.className = `status-badge ${getStatusClass(previousStatus)}`;
        }
        activityRow.classList.remove('completed-task');

        showNotification("Desfeito!", false);
        clearTimeout(undoTimeout);

        const result = await callAppsScript('updateActivityStatus', {
            id: activityId,
            newStatus: previousStatus,
            oldStatusForUndo: previousStatus,
            concluidaPorCheckbox: 'Não'
        });

        // CORREÇÃO: Mudança de result.status para result.success
        if (result.success) {
            const updatedActivity = allActivities.find(act => act.IDdaAtividade == activityId);
            if (updatedActivity) {
                updatedActivity.StatusAtual = previousStatus;
                updatedActivity.ConcluidaPorCheckbox = 'Não';
            }
            filterAndSearchActivities();
        } else {
            showNotification("Erro ao desfazer: " + result.message, false);
        }
        lastCompletedActivity = null;
    }
});

// ===============================================================
// Modal de Adição/Edição de Atividade
// ===============================================================

const activityModal = document.getElementById('activityModal');
const addActivityBtn = document.getElementById('addActivityBtn');
const closeActivityModalBtn = document.getElementById('closeActivityModal');
const activityForm = document.getElementById('activityForm');
const modalTitle = document.getElementById('modalTitle');
const activityIdInput = document.getElementById('activityId');
const activityNameInput = document.getElementById('activityName');
const activityDescriptionInput = document.getElementById('activityDescription');
const activityDueDateInput = document.getElementById('activityDueDate');
const activityStatusSelect = document.getElementById('activityStatus');

// Função para abrir o modal de edição
function openEditModal(event) {
    const clickedElement = event.target.closest('.edit-activity-btn') || event.target.closest('.status-badge');
    const activityId = clickedElement ? clickedElement.dataset.activityId : null;
    
    if (!activityId) {
        showNotification("Erro: ID da atividade não encontrado para edição.", false);
        return;
    }

    const activityToEdit = allActivities.find(act => act.IDdaAtividade == activityId);

    if (!activityToEdit) {
        showNotification("Atividade não encontrada para edição.", false);
        return;
    }

    modalTitle.textContent = "Editar Atividade";
    activityIdInput.value = activityToEdit.IDdaAtividade;
    activityNameInput.value = activityToEdit.Atividade;
    activityDescriptionInput.value = activityToEdit.DescricaoObservacoes || '';
    activityDueDateInput.value = formatarDataParaInput(activityToEdit.DataLimite);
    activityStatusSelect.value = activityToEdit.StatusAtual;
    activityStatusSelect.className = `status-select ${getStatusClass(activityToEdit.StatusAtual)}`;

    activityModal.style.display = 'flex';
}

// Event listeners para o modal
addActivityBtn.addEventListener('click', () => {
    modalTitle.textContent = "Adicionar Nova Atividade";
    activityForm.reset();
    activityIdInput.value = '';
    activityStatusSelect.className = 'status-select';
    activityModal.style.display = 'flex';
});

closeActivityModalBtn.addEventListener('click', () => {
    activityModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === activityModal) {
        activityModal.style.display = 'none';
    }
});

// Submissão do formulário de atividade
activityForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || !usuario.cpf) {
        showNotification("Erro: Usuário não identificado para salvar atividade.", false);
        return;
    }

    const formData = {
        id: activityIdInput.value,
        cpfMentorado: usuario.cpf.replace(/\D/g, ''),
        nomeMentorado: usuario.nome || '',
        atividade: activityNameInput.value,
        descricao: activityDescriptionInput.value,
        dataLimite: activityDueDateInput.value,
        statusAtual: activityStatusSelect.value,
        statusAnterior: ''
    };

    const result = await callAppsScript('saveActivity', formData);

    // CORREÇÃO: Mudança de result.status para result.success
    if (result.success) {
        showNotification(result.message, false);
        activityModal.style.display = 'none';
        loadActivities(); // Recarrega as atividades
    } else {
        showNotification("Erro ao salvar atividade: " + result.message, false);
    }
});

// Função para deletar atividade
async function handleDeleteActivity(event) {
    const activityId = event.target.closest('.delete-activity-btn').dataset.activityId;
    
    if (await customConfirm("Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.")) {
        const result = await callAppsScript('deleteActivity', { id: activityId });
        
        // CORREÇÃO: Mudança de result.status para result.success
        if (result.success) {
            showNotification("Atividade excluída com sucesso!", false);
            loadActivities(); // Recarrega as atividades
        } else {
            showNotification("Erro ao excluir atividade: " + result.message, false);
        }
    }
}

// ===============================================================
// Filtros e Busca
// ===============================================================

const activitySearchInput = document.getElementById('activitySearch');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const statusFilterDropdownBtn = document.getElementById('statusFilterDropdown');
const statusFilterOptions = document.getElementById('statusFilterOptions');
const statusFilterCheckboxes = document.querySelectorAll('#statusFilterOptions input[type="checkbox"]');

// Event listeners para busca
activitySearchInput.addEventListener('input', (event) => {
    currentSearchTerm = event.target.value;
    if (currentSearchTerm.length > 0) {
        clearSearchBtn.style.display = 'block';
    } else {
        clearSearchBtn.style.display = 'none';
    }
    filterAndSearchActivities();
});

clearSearchBtn.addEventListener('click', () => {
    activitySearchInput.value = '';
    currentSearchTerm = '';
    clearSearchBtn.style.display = 'none';
    filterAndSearchActivities();
});

// Lógica para abrir/fechar o dropdown de filtro de status
statusFilterDropdownBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    statusFilterOptions.style.display = statusFilterOptions.style.display === 'block' ? 'none' : 'block';
});

// Lógica para selecionar/desselecionar filtros de status
statusFilterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const status = checkbox.value;
        if (checkbox.checked) {
            if (!selectedStatusFilters.includes(status)) {
                selectedStatusFilters.push(status);
            }
        } else {
            selectedStatusFilters = selectedStatusFilters.filter(s => s !== status);
        }
        filterAndSearchActivities();
    });
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', (event) => {
    if (!statusFilterDropdownBtn.contains(event.target) && !statusFilterOptions.contains(event.target)) {
        statusFilterOptions.style.display = 'none';
    }
});

// ===============================================================
// Toggle de Tarefas Concluídas
// ===============================================================

toggleCompletedTasksBtn.addEventListener('click', () => {
    showCompletedTasks = !showCompletedTasks;
    
    if (showCompletedTasks) {
        toggleTextSpan.textContent = 'Ocultar Concluídas';
        toggleIconSpan.className = 'mdi mdi-eye-off';
    } else {
        toggleTextSpan.textContent = 'Ver Concluídas';
        toggleIconSpan.className = 'mdi mdi-eye';
    }
    
    filterAndSearchActivities();
});

// ===============================================================
// Modal de Confirmação Customizado
// ===============================================================

const customConfirmModal = document.getElementById('customConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');

function customConfirm(message) {
    return new Promise((resolve, reject) => {
        customConfirmPromiseResolve = resolve;
        customConfirmPromiseReject = reject;
        
        confirmMessage.textContent = message;
        customConfirmModal.style.display = 'flex';
    });
}

confirmYesBtn.addEventListener('click', () => {
    customConfirmModal.style.display = 'none';
    if (customConfirmPromiseResolve) {
        customConfirmPromiseResolve(true);
    }
});

confirmNoBtn.addEventListener('click', () => {
    customConfirmModal.style.display = 'none';
    if (customConfirmPromiseResolve) {
        customConfirmPromiseResolve(false);
    }
});

// ===============================================================
// Inicialização
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
});

