// Arquivo: mentorias/dashboard/script.js

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

// getStatusClass agora define classes para o BADGE (Item 2)
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
        return { status: 'error', message: error.message };
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
const filterCountBadge = document.querySelector('.filter-count-badge'); // Contador de filtros (Item 5)


// Função para renderizar as atividades na tabela
function renderActivities(activitiesToRender) {
    activitiesTableBody.innerHTML = ''; // Limpa a tabela

    if (activitiesToRender.length === 0) {
        noActivitiesMessage.style.display = 'block';
        return;
    } else {
        noActivitiesMessage.style.display = 'none';
    }

    activitiesToRender.forEach(activity => {
        // MUDANÇA: Adiciona log para verificar o objeto 'activity' no início do loop
        console.log("Início do loop: Processando atividade para renderização:", activity);
        
        const isCompleted = activity.StatusAtual === 'Concluída';
        const row = document.createElement('tr'); // Linha 102 (ou próxima)
        row.classList.toggle('completed-task', isCompleted);

        // MUDANÇA: Adiciona log para verificar se 'row' foi criado com sucesso
        console.log("Elemento 'row' criado com document.createElement('tr'):", row);

        // LOGS DE DEBUG DA DESCRIÇÃO (Mantenho para quando este bug for resolvido)
        console.log("Atividade.descricaoObservacoes (do objeto):", activity.descricaoObservacoes); 
        console.log("Valor final para injetar na descrição:", String(activity.descricaoObservacoes || 'VAZIO_NO_OBJETO_OU_CAMPO')); 

        // MUDANÇA: Conteúdo de innerHTML para depuração e exibição
        row.innerHTML = `
            <td><input type="checkbox" data-activity-id="${activity.IDdaAtividade}" ${isCompleted ? 'checked' : ''}></td>
            <td>${activity.Atividade || 'Atividade Vazia'}</td> <td>${String(activity.descricaoObservacoes || 'Descrição Vazia')}</td> <td>${formatarDataParaExibicao(activity.DataLimite)}</td>
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
        
        // MUDANÇA: Adiciona log para verificar o HTML gerado antes de anexar
        console.log("InnerHTML gerado para a linha:", row.innerHTML);

        activitiesTableBody.appendChild(row); // Linha 107 (ou próxima)
    });

    // Adiciona event listeners aos novos elementos (checkboxes, badges, botões)
    addActivityEventListeners();
}


// ... (Também na função openEditModal, mude activityToEdit.descricaoObservacoes para activityToEdit.descricaoObservacoes) ...
function openEditModal(event) {
    // ...
    activityDescriptionInput.value = activityToEdit.descricaoObservacoes || ''; // MUDANÇA AQUI
    // ...
}

// Filtra e busca as atividades carregadas
function filterAndSearchActivities() {
    let filtered = allActivities.filter(activity => {
        // Lógica do toggle "Ver Concluídas" / "Ocultar Concluídas"
        if (!showCompletedTasks && activity.StatusAtual === 'Concluída') {
            return false;
        }
        // Lógica do filtro de status multi-seleção (Item 5)
        if (selectedStatusFilters.length > 0 && !selectedStatusFilters.includes(activity.StatusAtual)) {
            return false;
        }
        // Lógica da busca (Item 9)
        const searchTermLower = currentSearchTerm.toLowerCase();
        return (
            String(activity.Atividade || '').toLowerCase().includes(searchTermLower) ||
            String(activity.descricaoObservacoes || '').toLowerCase().includes(searchTermLower)
        );
    });
    console.log("Atividades filtradas e/ou buscadas:", filtered); // Log para depuração
    renderActivities(filtered);

    // Atualiza o contador de filtros selecionados (Item 5)
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
    console.log("Resposta bruta do Apps Script (loadActivities):", result);
    loadingActivitiesMessage.style.display = 'none';

    if (result.status === 'success' && result.activities) {
        console.log("Atividades recebidas do Apps Script:", result.activities); // Log para depuração
        allActivities = result.activities;
        filterAndSearchActivities(); // Renderiza com base nos filtros e busca atuais
    } else {
        allActivities = [];
        filterAndSearchActivities(); // Renderiza vazio e exibe mensagem de 'Nenhuma atividade'
        console.error("Falha ao carregar atividades (frontend interpretado):", result.message);
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

    notificationBar.classList.add('show'); // Adiciona a classe 'show' para visibilidade
    notificationBar.style.display = 'flex'; // Garante que o display seja flex para layout

    // Reinicia a animação da linha de progresso
    if (showUndo) {
        progressLine.style.animation = 'none';
        void progressLine.offsetWidth; // Trigger reflow
        progressLine.style.animation = null;
        progressLine.style.animation = 'progressAnimation 3s linear forwards'; // MUDANÇA: 3 segundos (Item 7)

        clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            notificationBar.classList.remove('show'); // Remove a classe 'show' para ocultar
            notificationBarTimeoutId = setTimeout(() => { // Usa notificationBarTimeoutId
                notificationBar.style.display = 'none';
                lastCompletedActivity = null; // Limpa a atividade após o tempo
            }, 300); // Espera a transição de opacidade
        }, 3000); // MUDANÇA: 3 segundos (Item 7)
    } else {
        // Para outras notificações, apenas desaparece após um tempo menor
        clearTimeout(undoTimeout);
        notificationBarTimeoutId = setTimeout(() => { // Usa notificationBarTimeoutId
            notificationBar.classList.remove('show'); // Remove a classe 'show' para ocultar
            setTimeout(() => {
                notificationBar.style.display = 'none';
            }, 300);
        }, 3000); // MUDANÇA: 3 segundos (Item 7)
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

    if (result.status === 'success') {
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
        checkbox.checked = !isChecked; // Reverte o checkbox no frontend
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

    // Clique no badge de status abre o modal de edição (Comportamento temporário - Item 3)
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

        if (result.status === 'success') {
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
// Modal de Adição/Edição de Atividade (Comportamento real-time - Item 12)
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
const activityStatusSelect = document.getElementById('activityStatus'); // Este SELECT ainda é usado no modal

// Adiciona Event Listener para aplicar a classe de status ao select do modal (Item 4)
activityStatusSelect.addEventListener('change', (event) => {
    // Remove todas as classes de status existentes
    activityStatusSelect.classList.remove('status-nao-iniciada', 'status-executando', 'status-concluida', 'status-atrasada', 'status-perto-expirar');
    // Adiciona a classe correspondente ao status selecionado
    activityStatusSelect.classList.add(getStatusClass(event.target.value));
});


addActivityBtn.addEventListener('click', () => {
    modalTitle.textContent = "Adicionar Nova Atividade";
    activityForm.reset();
    activityIdInput.value = '';
    activityStatusSelect.value = 'Não iniciada'; // Status padrão
    // Aplica a classe inicial ao select do modal ao abrir para nova atividade
    activityStatusSelect.className = `status-select ${getStatusClass('Não iniciada')}`;
    activityModal.style.display = 'flex';
});

closeActivityModalBtn.addEventListener('click', () => {
    activityModal.style.display = 'none';
});

// Fechar modal ao clicar fora
window.addEventListener('click', (event) => {
    if (event.target === activityModal) {
        activityModal.style.display = 'none';
    }
});

activityForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuario || !usuario.cpf) {
        showNotification("Erro: Usuário não identificado para salvar atividade.", false);
        return;
    }

    const isEditing = activityIdInput.value !== '';

    const activityData = {
        id: activityIdInput.value,
        cpfMentorado: usuario.cpf.replace(/\D/g, ''),
        nomeMentorado: usuario.nome || '',
        atividade: activityNameInput.value,
        descricao: activityDescriptionInput.value,
        dataLimite: activityDueDateInput.value,
        statusAtual: activityStatusSelect.value,
        statusAnterior: activityStatusSelect.value // No início, status anterior é o mesmo
    };

    const submitButton = activityForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Salvando Edição..." : "Adicionando...";

    const result = await callAppsScript('saveActivity', activityData);

    submitButton.disabled = false;
    submitButton.textContent = "Salvar Atividade";

    if (result.status === 'success') {
        activityModal.style.display = 'none';
        showNotification(isEditing ? "Atividade atualizada com sucesso!" : "Atividade adicionada com sucesso!", false);
        
        // MUDANÇA (Item 12): Atualiza o array allActivities localmente sem recarregar tudo
        if (result.activity) { // O Apps Script deve retornar a atividade salva/atualizada
            if (isEditing) {
                const index = allActivities.findIndex(act => act.IDdaAtividade == result.activity.IDdaAtividade);
                if (index !== -1) {
                    allActivities[index] = result.activity;
                }
            } else {
                allActivities.push(result.activity);
            }
        }
        filterAndSearchActivities(); // Re-renderiza a tabela para refletir a mudança local
    } else {
        showNotification(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} atividade: ${result.message}`, false);
    }
});

// Função para abrir o modal em modo edição (Item 10)
function openEditModal(event) {
    // MUDANÇA (Item 10): Garante que pega o dataset do botão clicado ou do pai mais próximo
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
    activityDescriptionInput.value = activityToEdit.descricaoObservacoes || '';
    activityDueDateInput.value = formatarDataParaInput(activityToEdit.DataLimite);
    activityStatusSelect.value = activityToEdit.StatusAtual;
    activityStatusSelect.className = `status-select ${getStatusClass(activityToEdit.StatusAtual)}`; // Aplica a classe do status

    activityModal.style.display = 'flex';
}

// MUDANÇA: Função de confirmação customizada para substituir alert/confirm nativo (Item 1)
async function customConfirm(title, message) {
    const modal = document.getElementById('customConfirmModal');
    const confirmTitle = document.getElementById('customConfirmTitle');
    const confirmMessage = document.getElementById('customConfirmMessage');
    const confirmOKBtn = document.getElementById('customConfirmOK');
    const confirmCancelBtn = document.getElementById('customConfirmCancel');
    const closeConfirmModalBtn = document.getElementById('closeCustomConfirmModal');

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    modal.style.display = 'flex';

    return new Promise((resolve, reject) => {
        // Limpa listeners anteriores para evitar duplicação (se o modal for reutilizado)
        const removeListeners = () => {
            confirmOKBtn.removeEventListener('click', handleConfirmClick);
            confirmCancelBtn.removeEventListener('click', handleCancelClick);
            closeConfirmModalBtn.removeEventListener('click', handleCancelClick);
            window.removeEventListener('click', handleOutsideClick); // Remove listener de clique fora
        };

        const handleConfirmClick = () => {
            removeListeners();
            modal.style.display = 'none';
            resolve(true);
        };

        const handleCancelClick = () => {
            removeListeners();
            modal.style.display = 'none';
            resolve(false);
        };

        confirmOKBtn.addEventListener('click', handleConfirmClick);
        confirmCancelBtn.addEventListener('click', handleCancelClick);
        closeConfirmModalBtn.addEventListener('click', handleCancelClick);
        
        const handleOutsideClick = (event) => {
            if (event.target === modal) {
                handleCancelClick();
            }
        };
        // Usa { once: true } ou remove o listener explicitamente se o modal for reutilizado
        window.addEventListener('click', handleOutsideClick);
    });
}

// Função para deletar atividade (MODIFICADA para usar customConfirm - Item 1)
async function handleDeleteActivity(event) {
    // MUDANÇA (Item 10): Garante que pega o dataset do botão clicado ou do pai mais próximo
    const clickedElement = event.target.closest('.delete-activity-btn');
    const activityId = clickedElement ? clickedElement.dataset.activityId : null;

    console.log("Tentando excluir atividade com ID:", activityId); // Log no frontend

    if (!activityId) { // Adiciona verificação para ID nulo/vazio
        showNotification("Erro: ID da atividade não encontrado para exclusão.", false);
        return;
    }

    const confirmed = await customConfirm("Confirmar Exclusão", "Tem certeza que deseja excluir esta atividade?");

    if (confirmed) {
        const result = await callAppsScript('deleteActivity', { id: activityId });
        if (result.status === 'success') {
            allActivities = allActivities.filter(act => act.IDdaAtividade != activityId);
            filterAndSearchActivities();
            showNotification("Atividade excluída com sucesso!", false);
        } else {
            showNotification("Erro ao excluir atividade: " + result.message, false);
            console.error("Erro detalhado ao excluir atividade:", result.message, "ID:", activityId);
        }
    }
}


// ===============================================================
// Busca e Filtro (Multi-seleção de status - Item 5)
// ===============================================================

const activitySearchInput = document.getElementById('activitySearch');
const clearSearchBtn = document.getElementById('clearSearchBtn'); // OK

// Elementos para o filtro multi-seleção de status (Item 5)
const statusFilterDropdownBtn = document.getElementById('statusFilterDropdownBtn');
const statusFilterOptions = document.getElementById('statusFilterOptions');
const statusFilterCheckboxes = statusFilterOptions.querySelectorAll('input[type="checkbox"]');
// filterCountBadge já existe e é atualizado em filterAndSearchActivities

activitySearchInput.addEventListener('input', (event) => {
    currentSearchTerm = event.target.value;
    if (currentSearchTerm.length > 0) {
        clearSearchBtn.style.display = 'flex';
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
    event.stopPropagation(); // Evita que o clique feche o dropdown imediatamente
    statusFilterOptions.style.display = statusFilterOptions.style.display === 'block' ? 'none' : 'block';
});

// Lógica para selecionar/desselecionar filtros de status
statusFilterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        selectedStatusFilters = Array.from(statusFilterCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.value);
        filterAndSearchActivities();
    });
});

// Fechar dropdown de filtro de status ao clicar fora
window.addEventListener('click', (event) => {
    // Certifique-se de que o clique não foi dentro do dropdown ou no botão que o abre
    if (statusFilterOptions.style.display === 'block' && 
        !statusFilterOptions.contains(event.target) && 
        event.target !== statusFilterDropdownBtn && 
        !statusFilterDropdownBtn.contains(event.target)) { // Inclui o botão para evitar fechar ao clicar nele
        statusFilterOptions.style.display = 'none';
    }
});


// ===============================================================
// Evento principal DOMContentLoaded
// ===============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Esconde a notificação "Desfeito!" se estiver visível ao carregar a página (Item 10)
    const notificationBar = document.getElementById('taskCompletedNotification');
    if (notificationBar) {
        notificationBar.classList.remove('show'); // Esconde usando a classe
        notificationBar.style.display = 'none'; // Garante que não ocupa espaço
        clearTimeout(notificationBarTimeoutId);
        clearTimeout(undoTimeout);
    }


    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!usuario) {
        document.body.innerHTML = `
            <div style="min-height: 100vh; background-color: #333333; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
                <div style="background-color: #1a1a1a; padding: 3rem 2rem; border-radius: 12px; max-width: 600px; width: 90%; text-align: center; box-shadow: 0 0 16px rgba(0,0,0,0.6);">
                    <img src="https://renatodouek.com.br/assets/imagens/rd_pb_logo.png" alt="Logo Renato Douek" style="width: 140px; margin-bottom: 2rem;" />
                    <h1 style="color: #FFCE00; font-size: 1.8rem; margin-bottom: 1rem;">Acesso restrito!</h1>
                    <h2 style="color: #FFFFFF; font-size: 1rem; line-height: 1.4; margin-bottom: 2.5rem;">
                        Página de acesso exclusivo para mentorados do Renato Douek.
                    </h2>
                    <div style="display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                        <a href="https://renatodouek.com.br" style="flex: 1; text-align: center; padding: 0.75rem 1.5rem; border-radius: 32px; border: 2px solid #FFCE00; color: #FFCE00; text-decoration: none; font-weight: 500; transition: 0.3s;">
                            Ainda não sou mentorado
                        </a>
                        <a href="/mentorias/login/" style="flex: 1; text-align: center; padding: 0.75rem 1.5rem; border-radius: 32px; background-color: #FFCE00; color: #000; text-decoration: none; font-weight: 500; transition: 0.3s;">
                            Login
                        </a>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const nomeEl = document.getElementById("userName");
    if (nomeEl) nomeEl.textContent = usuario.nome || "Mentorado";

    const avatarEl = document.getElementById("profileAvatar");
    if (avatarEl && usuario.nome) {
        const partes = usuario.nome.trim().split(" ");
        const iniciais = partes.length >= 2
            ? partes[0][0] + partes[partes.length - 1][0]
            : partes[0][0];
        avatarEl.textContent = iniciais.toUpperCase();
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/mentorias/login/";
        });
    }

    const menu = document.querySelector(".sidebar-menu");
    const buttons = document.querySelectorAll(".icon-btn");
    const sections = document.querySelectorAll(".content-section");

    const hoverBox = document.createElement("div");
    hoverBox.classList.add("hover-box");
    menu.appendChild(hoverBox);

    const moveHoverBox = (button) => {
        const topPos = button.offsetTop;
        hoverBox.style.top = `${topPos}px`;
    };

    const initialBtn = document.querySelector(".icon-btn.active") || buttons[0];
    moveHoverBox(initialBtn);

    // Limpa a notificação ao trocar de seção no menu lateral (Item 10)
    buttons.forEach((btn) => {
        btn.addEventListener("click", async () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            moveHoverBox(btn);

            const sectionId = btn.dataset.section;
            sections.forEach((s) => {
                s.style.display = s.id === `section-${sectionId}` ? "block" : "none";
            });

            // Oculta a notificação ao trocar de seção
            if (notificationBar) {
                notificationBar.classList.remove('show');
                notificationBar.style.display = 'none';
                clearTimeout(notificationBarTimeoutId);
                clearTimeout(undoTimeout);
            }

            if (sectionId === 'activities') {
                await loadActivities();
            } else if (sectionId === 'overview') {
                // Lógica para carregar a visão geral
            }
        });
    });

    // Lógica do toggle "Ocultar Concluídas"
    toggleCompletedTasksBtn.addEventListener('click', () => {
        showCompletedTasks = !showCompletedTasks;
        if (showCompletedTasks) {
            toggleIconSpan.classList.remove('mdi-eye-off-outline');
            toggleIconSpan.classList.add('mdi-eye-outline');
            toggleTextSpan.textContent = "Ocultar Concluídas";
        } else {
            toggleIconSpan.classList.remove('mdi-eye-outline');
            toggleIconSpan.classList.add('mdi-eye-off-outline');
            toggleTextSpan.textContent = "Ver Concluídas";
        }
        filterAndSearchActivities();
    });

    // Garante que a seção de visão geral seja a padrão ao carregar e as atividades carreguem ao clicar no botão
    const overviewSection = document.getElementById('section-overview');
    const activitiesSection = document.getElementById('section-activities');
    
    // Esconde todas as seções primeiro
    sections.forEach(s => s.style.display = 'none');

    // Se o botão de atividades for o ativo padrão ao carregar, mostra a seção de atividades e carrega.
    if (initialBtn && initialBtn.dataset.section === 'activities') {
        activitiesSection.style.display = 'block';
        loadActivities();
    } else { // Caso contrário, mostra a visão geral por padrão (se não estiver ativa a seção de atividades)
        overviewSection.style.display = 'block';
    }
});
