// Arquivo: mentorias/dashboard/script.js

// Variáveis globais para armazenar as atividades e o estado do toggle de concluídas
let allActivities = []; // Armazenará todas as atividades carregadas do servidor
let selectedStatusFilters = new Set(); // Armazenará os status selecionados para filtragem
let currentSearchTerm = '';
let showCompletedTasks = false; 

// ===============================================================
// Funções Auxiliares
// ===============================================================

function formatarDataParaExibicao(dataString) {
    if (!dataString) return '';
    const data = (dataString instanceof Date) ? dataString : new Date(dataString + 'T00:00:00'); 
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
    if (dataString instanceof Date) {
        const ano = dataString.getFullYear();
        const mes = String(dataString.getMonth() + 1).padStart(2, '0');
        const dia = String(dataString.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }
    return dataString; 
}

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

const webAppUrl = "https://script.google.com/macros/s/AKfycbwxweNQUDALWE7Ai7-u73WbUFKsjtH-RlqQQJGGYcBo372PClCIN3MMrNzDcoogfCpq/exec"; 

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
            let errorDetails = {};
            let responseText = await response.text().catch(() => null); 
            
            if (responseText) {
                try {
                    errorDetails = JSON.parse(responseText); 
                } catch (jsonError) {
                    errorDetails.message = responseText; 
                }
            } else {
                errorDetails.message = response.statusText || 'Erro desconhecido';
            }
            throw new Error(`Erro no servidor (${response.status}): ${errorDetails.message || 'Erro desconhecido'}`);
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

function renderActivities(activitiesToRender) {
    activitiesTableBody.innerHTML = ''; 

    if (activitiesToRender.length === 0) {
        noActivitiesMessage.style.display = 'block';
        loadingActivitiesMessage.style.display = 'none'; 
        return;
    } else {
        noActivitiesMessage.style.display = 'none';
        loadingActivitiesMessage.style.display = 'none'; 
    }

    activitiesToRender.forEach(activity => {
        const isCompleted = activity.StatusAtual === 'Concluída';
        const row = document.createElement('tr');
        row.classList.toggle('completed-task', isCompleted); 

        row.innerHTML = `
            <td data-label=""><input type="checkbox" data-activity-id="${activity.IDdaAtividade}" ${isCompleted ? 'checked' : ''}></td>
            <td data-label="Atividade">${activity.Atividade}</td>
            <td data-label="Descrição/Observações">${activity.DescricaoObservacoes || ''}</td> <td data-label="Data limite">${formatarDataParaExibicao(activity.DataLimite)}</td>
            <td data-label="Status">
                <span class="status-badge ${getStatusClass(activity.StatusAtual)}" data-activity-id="${activity.IDdaAtividade}" title="Clique para editar status">${activity.StatusAtual}</span>
            </td>
            <td data-label="Ações">
                <button class="edit-activity-btn icon-action-btn" data-activity-id="${activity.IDdaAtividade}" title="Editar">
                    <span class="mdi mdi-pencil"></span>
                </button>
                <button class="delete-activity-btn icon-action-btn" data-activity-id="${activity.IDdaAtividade}" title="Excluir">
                    <span class="mdi mdi-delete"></span>
                </button>
            </td>
        `;
         document.getElementById('activitiesTableBody').appendChild(row);
    });

    addActivityEventListeners();
}

function filterAndSearchActivities() {
    let filtered = allActivities.filter(activity => {
        if (!showCompletedTasks && activity.StatusAtual === 'Concluída') {
            return false;
        }

        if (selectedStatusFilters.size > 0 && !selectedStatusFilters.has(activity.StatusAtual)) {
            return false;
        }

        const searchTermLower = currentSearchTerm.toLowerCase();
        return (
            String(activity.Atividade || '').toLowerCase().includes(searchTermLower) ||
            String(activity.DescricaoObservacoes || '').toLowerCase().includes(searchTermLower)
        );
    });
    console.log("Atividades filtradas e/ou buscadas:", filtered); 
    renderActivities(filtered);
}

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
    activitiesTableBody.innerHTML = ''; 

    const result = await callAppsScript('getActivitiesByCpf', { cpf: usuario.cpf.replace(/\D/g, '') });

    if (result.status === 'success' && result.activities) {
        console.log("Atividades recebidas do Apps Script:", result.activities); 
        allActivities = result.activities;
        filterAndSearchActivities(); 
    } else {
        allActivities = [];
        filterAndSearchActivities(); 
        console.error("Falha ao carregar atividades:", result.message);
        showNotification("Erro ao carregar atividades: " + result.message, false);
    }
}

// ===============================================================
// Interações da Tabela de Atividades
// ===============================================================

let undoTimeout; 
let lastCompletedActivity = null; 

function showNotification(message, showUndo = false) {
    const notificationBar = document.getElementById('taskCompletedNotification');
    const notificationText = notificationBar.querySelector('span');
    const undoButton = document.getElementById('undoTaskButton');
    const progressLine = notificationBar.querySelector('.progress-line');

    clearTimeout(undoTimeout); 

    notificationText.textContent = message;
    undoButton.style.display = showUndo ? 'inline-block' : 'none';
    progressLine.style.display = showUndo ? 'block' : 'none';

    notificationBar.classList.remove('show'); 
    void notificationBar.offsetWidth; 
    notificationBar.classList.add('show'); 
    notificationBar.style.display = 'flex'; 

    if (showUndo) {
        progressLine.style.animation = 'none';
        void progressLine.offsetWidth; 
        progressLine.style.animation = 'progressAnimation 5s linear forwards'; 

        undoTimeout = setTimeout(() => {
            notificationBar.classList.remove('show'); 
            setTimeout(() => {
                notificationBar.style.display = 'none';
                lastCompletedActivity = null; 
            }, 300); 
        }, 5000);
    } else {
        undoTimeout = setTimeout(() => {
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
    
    const activity = allActivities.find(act => act.IDdaAtividade == activityId);
    if (!activity) {
        console.error("Atividade não encontrada no array local para ID:", activityId);
        checkbox.checked = !isChecked; 
        return;
    }

    let newStatus;
    let originalStatusBeforeChange = activity.StatusAtual; 

    if (isChecked) {
        newStatus = "Concluída";
        lastCompletedActivity = { ...activity }; // Guarda o estado ANTES de marcar como Concluída
        showNotification("Tarefa concluída!", true);
    } else {
        // MUDANÇA: newStatus será o StatusAnterior que estava salvo no lastCompletedActivity,
        // garantindo o retorno ao estado correto antes da conclusão.
        newStatus = lastCompletedActivity?.StatusAnterior || activity.StatusAnterior || "Não iniciada"; 
        showNotification("Tarefa desmarcada.");
        lastCompletedActivity = null; // Limpa lastCompletedActivity imediatamente ao desmarcar
    }

    const result = await callAppsScript('updateActivityStatus', {
        id: activityId,
        newStatus: newStatus,
        oldStatusForUndo: originalStatusBeforeChange, 
        concluidaPorCheckbox: isChecked ? 'Sim' : 'Não'
    });

    if (result.status === 'success' && result.activity) { 
        const returnedActivity = result.activity; 
        const index = allActivities.findIndex(act => act.IDdaAtividade == returnedActivity.IDdaAtividade);
        if (index !== -1) {
            allActivities[index] = returnedActivity; 
        }
        filterAndSearchActivities(); 
    } else {
        showNotification(`Erro ao atualizar tarefa: ${result.message}`, false);
        console.error("Erro ao atualizar tarefa:", result.message, "Resultado completo:", result);
        
        checkbox.checked = !isChecked; 
        activity.StatusAtual = originalStatusBeforeChange; 
        const activityRow = checkbox.closest('tr'); 
        activityRow.classList.toggle('completed-task', originalStatusBeforeChange === 'Concluída');
        const statusBadge = activityRow.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.textContent = originalStatusBeforeChange;
            statusBadge.className = `status-badge ${getStatusClass(originalStatusBeforeChange)}`;
        }
    }
}

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

document.getElementById('undoTaskButton').addEventListener('click', async () => {
    if (lastCompletedActivity) {
        const activityId = lastCompletedActivity.IDdaAtividade;
        const targetStatusForReversion = lastCompletedActivity.StatusAnterior || "Não iniciada"; 
        
        const activityToUndoCopy = { ...lastCompletedActivity }; 
        lastCompletedActivity = null; // MUDANÇA: Limpa lastCompletedActivity *antes* da chamada API

        showNotification("Desfeito!", false); 

        const result = await callAppsScript('updateActivityStatus', {
            id: activityId,
            newStatus: targetStatusForReversion, 
            oldStatusForUndo: "Concluída", 
            concluidaPorCheckbox: 'Não' 
        });

        if (result.status === 'success' && result.activity) {
            const returnedActivity = result.activity;
            const index = allActivities.findIndex(act => act.IDdaAtividade == returnedActivity.IDdaAtividade);
            if (index !== -1) {
                allActivities[index] = returnedActivity; 
            }
            filterAndSearchActivities();
        } else {
            showNotification("Erro ao desfazer: " + result.message); 
            console.error("Erro ao desfazer tarefa:", result.message, "Resultado completo:", result);
        }
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

addActivityBtn.addEventListener('click', () => {
    modalTitle.textContent = "Adicionar Nova Atividade";
    activityForm.reset(); 
    activityIdInput.value = ''; 
    activityStatusSelect.value = 'Não iniciada'; 
    activityModal.style.display = 'flex'; 
});

closeActivityModalBtn.addEventListener('click', () => {
    activityModal.style.display = 'none'; 
});

window.addEventListener('click', (event) => {
    if (event.target === activityModal) {
        activityModal.style.display = 'none';
    }
    if (!statusFilterDropdownBtn.contains(event.target) && !statusFilterOptions.contains(event.target)) {
        statusFilterOptions.style.display = 'none';
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
        statusAnterior: '' 
    };

    const submitButton = activityForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = isEditing ? "Salvando Edição..." : "Adicionando...";

    const result = await callAppsScript('saveActivity', activityData);

    submitButton.disabled = false;
    submitButton.textContent = "Salvar Atividade";

    if (result.status === 'success' && result.activity) { 
        activityModal.style.display = 'none';
        showNotification(isEditing ? "Atividade atualizada com sucesso!" : "Atividade adicionada com sucesso!", false);
        
        const returnedActivity = result.activity;
        if (isEditing) {
            const index = allActivities.findIndex(act => act.IDdaAtividade == returnedActivity.IDdaAtividade);
            if (index !== -1) {
                allActivities[index] = returnedActivity; 
            }
        } else {
            allActivities.push(returnedActivity); 
        }
        filterAndSearchActivities(); 
    } else {
        showNotification(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} atividade: ${result.message}`, false);
        console.error(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} atividade:`, result.message, "Resultado completo:", result);
    }
});

function openEditModal(event) {
    const clickedElement = event.target.closest('.edit-activity-btn, .status-badge');
    
    if (!clickedElement) {
        showNotification("Erro: Elemento clicado inválido para edição.", false);
        console.error("Erro: clickedElement é nulo, event.target:", event.target);
        return;
    }
    const activityId = clickedElement.dataset.activityId;
    console.log("Tentando editar atividade com ID:", activityId); 
    
    if (!activityId) {
        showNotification("Erro: ID da atividade não encontrado para edição.", false);
        console.error("Erro: activityId é nulo/indefinido após closest, clickedElement:", clickedElement);
        return;
    }

    const activityToEdit = allActivities.find(act => act.IDdaAtividade == activityId);

    if (!activityToEdit) {
        showNotification("Atividade não encontrada para edição.", false);
        console.error("Atividade não encontrada no array local para ID:", activityId); 
        return;
    }

    modalTitle.textContent = "Editar Atividade";
    activityIdInput.value = activityToEdit.IDdaAtividade;
    activityNameInput.value = activityToEdit.Atividade;
    activityDescriptionInput.value = activityToEdit.DescricaoObservacoes || '';
    activityDueDateInput.value = formatarDataParaInput(activityToEdit.DataLimite);
    activityStatusSelect.value = activityToEdit.StatusAtual;

    activityModal.style.display = 'flex';
}

async function handleDeleteActivity(event) {
    const clickedElement = event.target.closest('.delete-activity-btn');
    if (!clickedElement) {
        console.error("Erro: Elemento clicado não é um botão de exclusão válido.", event.target);
        return;
    }
    const activityId = clickedElement.dataset.activityId;
    console.log("Tentando excluir atividade com ID:", activityId);

    const confirmed = await showCustomConfirm("Confirmação", "Você tem certeza que deseja excluir esta atividade?");

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
// Busca e Filtro
// ===============================================================

const activitySearchInput = document.getElementById('activitySearch');
const clearSearchBtn = document.getElementById('clearSearchBtn');

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

const statusFilterDropdownBtn = document.getElementById('statusFilterDropdownBtn');
const statusFilterOptions = document.getElementById('statusFilterOptions');
const statusFilterCheckboxes = statusFilterOptions.querySelectorAll('input[type="checkbox"]');
const filterCountBadge = document.querySelector('.filter-count-badge');

statusFilterDropdownBtn.addEventListener('click', (event) => {
    event.stopPropagation(); 
    statusFilterOptions.style.display = statusFilterOptions.style.display === 'block' ? 'none' : 'block';
});

statusFilterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            selectedStatusFilters.add(checkbox.value);
        } else {
            selectedStatusFilters.delete(checkbox.value);
        }
        updateFilterCountBadge();
        filterAndSearchActivities();
    });
});

function updateFilterCountBadge() {
    if (selectedStatusFilters.size > 0) {
        filterCountBadge.textContent = selectedStatusFilters.size;
        filterCountBadge.style.display = 'inline-block';
    } else {
        filterCountBadge.style.display = 'none';
    }
}

// ===============================================================
// Custom Confirm Modal
// ===============================================================
const customConfirmModal = document.getElementById('customConfirmModal');
const customConfirmTitle = document.getElementById('customConfirmTitle');
const customConfirmMessage = document.getElementById('customConfirmMessage');
const customConfirmCancelBtn = document.getElementById('customConfirmCancel');
const customConfirmOKBtn = document.getElementById('customConfirmOK');
const closeCustomConfirmModal = document.getElementById('closeCustomConfirmModal');

let resolveCustomConfirm;

function showCustomConfirm(title, message) {
    customConfirmTitle.textContent = title;
    customConfirmMessage.textContent = message;
    customConfirmModal.style.display = 'flex';

    return new Promise(resolve => {
        resolveCustomConfirm = resolve;
    });
}

customConfirmOKBtn.addEventListener('click', () => {
    customConfirmModal.style.display = 'none';
    resolveCustomConfirm(true);
});

customConfirmCancelBtn.addEventListener('click', () => {
    customConfirmModal.style.display = 'none';
    resolveCustomConfirm(false);
});

closeCustomConfirmModal.addEventListener('click', () => {
    customConfirmModal.style.display = 'none';
    resolveCustomConfirm(false); 
});

// ===============================================================
// Evento principal DOMContentLoaded
// ===============================================================

document.addEventListener("DOMContentLoaded", async () => { 
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

    // ======== MENU LATERAL COM HOVER DESLIZANTE =========
    try {
        console.log("Iniciando setup do menu lateral.");
        const menu = document.querySelector(".sidebar-menu");
        console.log("Menu element:", menu);

        const buttons = document.querySelectorAll(".icon-btn");
        console.log("Buttons elements (NodeList):", buttons);

        const sections = document.querySelectorAll(".content-section");
        console.log("Sections elements (NodeList):", sections);

        if (!menu) {
            console.error("Erro: Elemento .sidebar-menu não encontrado. O menu lateral não funcionará.");
        } else {
            const hoverBox = document.createElement("div");
            hoverBox.classList.add("hover-box");
            menu.appendChild(hoverBox);
            console.log("HoverBox appended.");

            const moveHoverBox = (button) => {
                if (!button || !hoverBox || !menu) { 
                    console.warn("moveHoverBox: button, hoverBox ou menu é nulo/indefinido. Não é possível mover.");
                    return;
                }
                const topPos = button.offsetTop;
                hoverBox.style.top = `${topPos}px`;
            };

            const initialBtn = document.querySelector(".icon-btn.active") || buttons[0];
            console.log("Initial active button:", initialBtn);
            if (initialBtn) {
                moveHoverBox(initialBtn);
                console.log("MoveHoverBox called for initial button.");
            } else {
                console.warn("Nenhum botão inicial ativo ou botões de menu não encontrados. HoverBox pode não ser posicionada.");
            }

            if (buttons.length > 0) {
                buttons.forEach((btn) => {
                    btn.addEventListener("click", async () => {
                        console.log("Botão de menu clicado:", btn.dataset.section);
                        buttons.forEach((b) => b.classList.remove("active"));
                        btn.classList.add("active");

                        moveHoverBox(btn);

                        const sectionId = btn.dataset.section;
                        sections.forEach((s) => {
                            s.style.display = s.id === `section-${sectionId}` ? "block" : "none";
                        });

                        if (sectionId === 'activities') {
                            console.log("Loading activities for section-activities.");
                            await loadActivities();
                        } else if (sectionId === 'overview') {
                            console.log("Navigated to overview section.");
                        }
                    });
                });
                console.log("Event listeners attached to menu buttons.");
            } else {
                console.warn("Nenhum botão de menu encontrado. Listeners de clique não anexados.");
            }
        }
    } catch (error) {
        console.error("Erro fatal no setup do menu lateral:", error);
    }

    toggleCompletedTasksBtn.addEventListener('click', () => {
        showCompletedTasks = !showCompletedTasks; 
        updateToggleCompletedTasksUI(); 
        filterAndSearchActivities(); 
    });

    updateToggleCompletedTasksUI(); 
    updateFilterCountBadge();

    const sectionActivities = document.getElementById('section-activities');
    if (sectionActivities && (sectionActivities.style.display === 'block' || initialBtn.dataset.section === 'activities')) {
        await loadActivities(); 
    } else {
        noActivitiesMessage.textContent = "Navegue para a seção de Atividades para ver suas tarefas.";
        noActivitiesMessage.style.display = 'block';
        loadingActivitiesMessage.style.display = 'none';
        activitiesTableBody.innerHTML = ''; 
    }
});

function updateToggleCompletedTasksUI() {
    if (showCompletedTasks) { 
        toggleIconSpan.classList.remove('mdi-eye-off-outline');
        toggleIconSpan.classList.add('mdi-eye-outline');
        toggleTextSpan.textContent = "Ocultar Concluídas"; 
    } else { 
        toggleIconSpan.classList.remove('mdi-eye-outline');
        toggleIconSpan.classList.add('mdi-eye-off-outline');
        toggleTextSpan.textContent = "Ver Concluídas"; 
    }
}
