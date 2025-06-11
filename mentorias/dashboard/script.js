// Arquivo: mentorias/dashboard/script.js

// Variáveis globais para armazenar as atividades e o estado do toggle de concluídas
let allActivities = []; // Armazenará todas as atividades carregadas do servidor
let currentFilter = 'all';
let currentSearchTerm = '';
let showCompletedTasks = true; // True = Ver Concluídas (default), False = Ocultar Concluídas

// ===============================================================
// Funções Auxiliares
// ===============================================================

function formatarDataParaExibicao(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    // Verifica se a data é válida antes de formatar
    if (isNaN(data.getTime())) {
        return dataString; // Retorna a string original se for inválida
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
        return ''; // Retorna vazio se inválida
    }
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
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
        alert(`Ocorreu um erro: ${error.message}. Por favor, tente novamente.`);
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
        const isCompleted = activity.StatusAtual === 'Concluída';
        const row = document.createElement('tr');
        row.classList.toggle('completed-task', isCompleted); // Adiciona classe riscada

        row.innerHTML = `
            <td><input type="checkbox" data-activity-id="${activity.IDdaAtividade}" ${isCompleted ? 'checked' : ''}></td>
            <td>${activity.Atividade}</td>
            <td>${activity.DescricaoObservacoes}</td>
            <td>${formatarDataParaExibicao(activity.DataLimite)}</td>
            <td>
                <select class="status-select ${getStatusClass(activity.StatusAtual)}" data-activity-id="${activity.IDdaAtividade}">
                    <option value="Não iniciada" ${activity.StatusAtual === 'Não iniciada' ? 'selected' : ''}>Não iniciada</option>
                    <option value="Executando" ${activity.StatusAtual === 'Executando' ? 'selected' : ''}>Executando</option>
                    <option value="Concluída" ${activity.StatusAtual === 'Concluída' ? 'selected' : ''}>Concluída</option>
                    <option value="Atrasada" ${activity.StatusAtual === 'Atrasada' ? 'selected' : ''}>Atrasada</option>
                    <option value="Perto de expirar" ${activity.StatusAtual === 'Perto de expirar' ? 'selected' : ''}>Perto de expirar</option>
                </select>
            </td>
            <td>
                <button class="edit-activity-btn" data-activity-id="${activity.IDdaAtividade}">Editar</button>
                <button class="delete-activity-btn" data-activity-id="${activity.IDdaAtividade}">Excluir</button>
            </td>
        `;
        activitiesTableBody.appendChild(row);
    });

    // Adiciona event listeners aos novos elementos (checkboxes, selects, botões)
    addActivityEventListeners();
}

// Filtra e busca as atividades carregadas
function filterAndSearchActivities() {
    let filtered = allActivities.filter(activity => {
        // Lógica do toggle "Ocultar Concluídas"
        if (!showCompletedTasks && activity.StatusAtual === 'Concluída') {
            return false;
        }
        // Lógica do filtro de status
        if (currentFilter !== 'all' && activity.StatusAtual !== currentFilter) {
            return false;
        }
        // Lógica da busca
        const searchTermLower = currentSearchTerm.toLowerCase();
        return (
            activity.Atividade.toLowerCase().includes(searchTermLower) ||
            activity.DescricaoObservacoes.toLowerCase().includes(searchTermLower)
        );
    });
    renderActivities(filtered);
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

    if (result.status === 'success' && result.activities) {
        allActivities = result.activities;
        filterAndSearchActivities(); // Renderiza com base nos filtros e busca atuais
    } else {
        allActivities = [];
        filterAndSearchActivities(); // Renderiza vazio e exibe mensagem de 'Nenhuma atividade'
        console.error("Falha ao carregar atividades:", result.message);
    }
}

// ===============================================================
// Interações da Tabela de Atividades
// ===============================================================

let undoTimeout; // Variável para controlar o timeout da notificação "Desfazer"
let lastCompletedActivity = null; // Armazena a última atividade marcada como concluída para o "Desfazer"

function showNotification(message, showUndo = false) {
    const notificationBar = document.getElementById('taskCompletedNotification');
    const notificationText = notificationBar.querySelector('span');
    const undoButton = document.getElementById('undoTaskButton');
    const progressLine = notificationBar.querySelector('.progress-line');

    notificationText.textContent = message;
    undoButton.style.display = showUndo ? 'inline-block' : 'none';
    progressLine.style.display = showUndo ? 'block' : 'none';

    notificationBar.style.display = 'flex';
    notificationBar.style.opacity = '1';

    // Reinicia a animação da linha de progresso
    if (showUndo) {
        progressLine.style.animation = 'none';
        void progressLine.offsetWidth; // Trigger reflow
        progressLine.style.animation = null;
        progressLine.style.animation = 'progressAnimation 5s linear forwards';

        clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            notificationBar.style.opacity = '0';
            setTimeout(() => {
                notificationBar.style.display = 'none';
                lastCompletedActivity = null; // Limpa a atividade após o tempo
            }, 300); // Espera a transição de opacidade
        }, 5000);
    } else {
        // Para outras notificações, apenas desaparece após um tempo menor
        clearTimeout(undoTimeout);
        undoTimeout = setTimeout(() => {
            notificationBar.style.opacity = '0';
            setTimeout(() => {
                notificationBar.style.display = 'none';
            }, 300);
        }, 3000); // 3 segundos para mensagens sem "Desfazer"
    }
}

async function handleCheckboxChange(event) {
    const checkbox = event.target;
    const activityId = checkbox.dataset.activityId;
    const isChecked = checkbox.checked;
    const activityRow = checkbox.closest('tr'); // Pega a linha da tabela

    const activity = allActivities.find(act => act.IDdaAtividade == activityId);
    if (!activity) return;

    let newStatus, oldStatusForUndo = activity.StatusAtual;

    if (isChecked) {
        newStatus = "Concluída";
        // Armazena o estado atual da atividade para o "Desfazer"
        lastCompletedActivity = { ...activity, StatusAnterior: activity.StatusAtual };
        showNotification("Tarefa concluída!", true);
    } else {
        newStatus = activity.StatusAnterior || "Não iniciada"; // Volta ao status anterior ou "Não iniciada"
        showNotification("Tarefa desmarcada.");
        lastCompletedActivity = null;
    }

    const result = await callAppsScript('updateActivityStatus', {
        id: activityId,
        newStatus: newStatus,
        oldStatusForUndo: oldStatusForUndo, // Envia o status antes da mudança para "Concluída"
        concluidaPorCheckbox: isChecked ? 'Sim' : 'Não'
    });

    if (result.status === 'success') {
        // Atualiza a atividade no array local
        const updatedActivity = allActivities.find(act => act.IDdaAtividade == activityId);
        if (updatedActivity) {
            updatedActivity.StatusAtual = newStatus;
            updatedActivity.StatusAnterior = oldStatusForUndo; // Salva o status anterior
            updatedActivity.ConcluidaPorCheckbox = isChecked ? 'Sim' : 'Não';
        }
        // Aplica/remove estilo riscado diretamente na linha
        activityRow.classList.toggle('completed-task', newStatus === 'Concluída');
        // Atualiza o select para refletir o novo status
        activityRow.querySelector('.status-select').value = newStatus;
        activityRow.querySelector('.status-select').className = `status-select ${getStatusClass(newStatus)}`;

        // Recarrega (ou filtra e renderiza) para garantir a consistência
        filterAndSearchActivities();
    } else {
        // Em caso de erro, reverte o checkbox no frontend
        checkbox.checked = !isChecked;
        activityRow.classList.toggle('completed-task', !isChecked); // Reverte o estilo
        showNotification("Erro ao atualizar tarefa: " + result.message);
    }
}

async function handleStatusSelectChange(event) {
    const select = event.target;
    const activityId = select.dataset.activityId;
    const newStatus = select.value;
    const checkbox = select.closest('tr').querySelector('input[type="checkbox"]');

    const activity = allActivities.find(act => act.IDdaAtividade == activityId);
    if (!activity) return;

    let oldStatusForUndo = activity.StatusAtual; // Guarda o status antes da mudança para 'Concluída'

    // Se o status for alterado manualmente para Concluída, trata como checkbox
    if (newStatus === 'Concluída' && !checkbox.checked) {
        checkbox.checked = true;
        // O restante da lógica de marcar como concluída será chamada pela função do checkbox
        // Mas para evitar loop ou dupla chamada, podemos chamar diretamente a atualização no backend aqui
        // e então atualizar o array local e renderizar.
    }
    // Se o status for alterado DE Concluída para outro, desmarca o checkbox
    else if (activity.StatusAtual === 'Concluída' && newStatus !== 'Concluída') {
        checkbox.checked = false;
    }
    // Se não for uma transição de/para Concluída pelo checkbox, apenas atualiza
    
    // Atualiza a classe de estilo do select
    select.className = `status-select ${getStatusClass(newStatus)}`;

    const result = await callAppsScript('updateActivityStatus', {
        id: activityId,
        newStatus: newStatus,
        oldStatusForUndo: oldStatusForUndo, // Envia o status atual como "anterior" para o GAS
        concluidaPorCheckbox: checkbox.checked ? 'Sim' : 'Não' // Atualiza o estado do checkbox no backend
    });

    if (result.status === 'success') {
        const updatedActivity = allActivities.find(act => act.IDdaAtividade == activityId);
        if (updatedActivity) {
            updatedActivity.StatusAtual = newStatus;
            // Se o status não for 'Concluída' e não veio de checkbox, salva o status anterior para futuras operações
            if (newStatus !== 'Concluída') {
                updatedActivity.StatusAnterior = oldStatusForUndo;
            }
            updatedActivity.ConcluidaPorCheckbox = checkbox.checked ? 'Sim' : 'Não';
        }
        select.closest('tr').classList.toggle('completed-task', newStatus === 'Concluída');
        filterAndSearchActivities(); // Re-renderiza para aplicar filtros se necessário
        showNotification("Status da tarefa atualizado.");
    } else {
        // Em caso de erro, reverte o select e o checkbox no frontend
        select.value = activity.StatusAtual; // Volta ao valor original
        checkbox.checked = activity.ConcluidaPorCheckbox === 'Sim'; // Volta ao estado original
        select.className = `status-select ${getStatusClass(activity.StatusAtual)}`; // Reverte o estilo
        showNotification("Erro ao atualizar status: " + result.message);
    }
}

// Adiciona event listeners para os elementos dinâmicos da tabela
function addActivityEventListeners() {
    document.querySelectorAll('#activitiesTableBody input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange); // Remove para evitar duplicidade
        checkbox.addEventListener('change', handleCheckboxChange);
    });

    document.querySelectorAll('#activitiesTableBody .status-select').forEach(select => {
        select.removeEventListener('change', handleStatusSelectChange);
        select.addEventListener('change', handleStatusSelectChange);
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
        const select = document.querySelector(`#activitiesTableBody .status-select[data-activity-id="${activityId}"]`);
        const activityRow = checkbox.closest('tr');

        // Reverte no frontend imediatamente para feedback visual
        if (checkbox) checkbox.checked = false;
        if (select) select.value = previousStatus;
        activityRow.classList.remove('completed-task');
        if (select) select.className = `status-select ${getStatusClass(previousStatus)}`;

        showNotification("Desfeito!");
        clearTimeout(undoTimeout); // Impede a notificação de desaparecer automaticamente

        // Envia a reversão para o Apps Script
        const result = await callAppsScript('updateActivityStatus', {
            id: activityId,
            newStatus: previousStatus,
            oldStatusForUndo: previousStatus, // Não importa muito aqui, mas para consistência
            concluidaPorCheckbox: 'Não'
        });

        if (result.status === 'success') {
            // Atualiza a atividade no array local
            const updatedActivity = allActivities.find(act => act.IDdaAtividade == activityId);
            if (updatedActivity) {
                updatedActivity.StatusAtual = previousStatus;
                updatedActivity.ConcluidaPorCheckbox = 'Não';
            }
            filterAndSearchActivities(); // Re-renderiza para garantir consistência
        } else {
            // Se falhar, talvez avisar o usuário e tentar reverter o estado no frontend (complexo)
            showNotification("Erro ao desfazer: " + result.message);
            // Poderia-se tentar recarregar as atividades: loadActivities();
        }
        lastCompletedActivity = null; // Limpa após desfazer
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
    activityForm.reset(); // Limpa o formulário
    activityIdInput.value = ''; // Limpa o ID para indicar nova atividade
    activityStatusSelect.value = 'Não iniciada'; // Status padrão
    activityModal.style.display = 'flex'; // Exibe o modal
});

closeActivityModalBtn.addEventListener('click', () => {
    activityModal.style.display = 'none'; // Esconde o modal
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
        alert("Erro: Usuário não identificado para salvar atividade.");
        return;
    }

    const isEditing = activityIdInput.value !== '';

    const activityData = {
        id: activityIdInput.value, // Vazio para nova, ID para edição
        cpfMentorado: usuario.cpf.replace(/\D/g, ''),
        nomeMentorado: usuario.nome || '', // Enviar o nome do mentorado também
        atividade: activityNameInput.value,
        descricao: activityDescriptionInput.value,
        dataLimite: activityDueDateInput.value, // Data no formato YYYY-MM-DD
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
        // Não exibe alerta de sucesso, vai direto para a recarga da lista
        loadActivities(); // Recarrega todas as atividades para atualizar a tabela
    } else {
        alert(`Erro ao ${isEditing ? 'atualizar' : 'adicionar'} atividade: ${result.message}`);
    }
});

// Função para abrir o modal em modo edição
function openEditModal(event) {
    const activityId = event.target.dataset.activityId;
    const activityToEdit = allActivities.find(act => act.IDdaAtividade == activityId);

    if (!activityToEdit) {
        alert("Atividade não encontrada para edição.");
        return;
    }

    modalTitle.textContent = "Editar Atividade";
    activityIdInput.value = activityToEdit.IDdaAtividade;
    activityNameInput.value = activityToEdit.Atividade;
    activityDescriptionInput.value = activityToEdit.DescricaoObservacoes;
    activityDueDateInput.value = formatarDataParaInput(activityToEdit.DataLimite); // Formata para input type="date"
    activityStatusSelect.value = activityToEdit.StatusAtual;

    activityModal.style.display = 'flex';
}

// Função para deletar atividade
async function handleDeleteActivity(event) {
    const activityId = event.target.dataset.activityId;
    if (confirm("Tem certeza que deseja excluir esta atividade?")) {
        const result = await callAppsScript('deleteActivity', { id: activityId });
        if (result.status === 'success') {
            alert("Atividade excluída com sucesso!");
            loadActivities(); // Recarrega as atividades
        } else {
            alert("Erro ao excluir atividade: " + result.message);
        }
    }
}

// ===============================================================
// Busca e Filtro
// ===============================================================

const activitySearchInput = document.getElementById('activitySearch');
const activityFilterSelect = document.getElementById('activityFilter');

activitySearchInput.addEventListener('input', (event) => {
    currentSearchTerm = event.target.value;
    filterAndSearchActivities();
});

activityFilterSelect.addEventListener('change', (event) => {
    currentFilter = event.target.value;
    filterAndSearchActivities();
});

// ===============================================================
// Evento principal DOMContentLoaded
// ===============================================================

document.addEventListener("DOMContentLoaded", () => {
    // Recupera o usuário do localStorage
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    // Exibe pagina de acesso restrito se não estiver autenticado
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

    // Preenche o nome do usuário
    const nomeEl = document.getElementById("userName");
    if (nomeEl) nomeEl.textContent = usuario.nome || "Mentorado";

    // Gera iniciais do nome para o avatar
    const avatarEl = document.getElementById("profileAvatar");
    if (avatarEl && usuario.nome) {
        const partes = usuario.nome.trim().split(" ");
        const iniciais = partes.length >= 2
            ? partes[0][0] + partes[partes.length - 1][0]
            : partes[0][0];
        avatarEl.textContent = iniciais.toUpperCase();
    }

    // Lógica de logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("usuarioLogado");
            window.location.href = "/mentorias/login/";
        });
    }

    // ======== MENU LATERAL COM HOVER DESLIZANTE =========

    const menu = document.querySelector(".sidebar-menu");
    const buttons = document.querySelectorAll(".icon-btn");
    const sections = document.querySelectorAll(".content-section");

    // Cria a caixa animada amarela
    const hoverBox = document.createElement("div");
    hoverBox.classList.add("hover-box");
    menu.appendChild(hoverBox);

    // Função que move a hoverBox até o botão clicado
    const moveHoverBox = (button) => {
        const topPos = button.offsetTop;
        hoverBox.style.top = `${topPos}px`;
    };

    // Inicia na posição do botão com a classe "active"
    const initialBtn = document.querySelector(".icon-btn.active") || buttons[0];
    moveHoverBox(initialBtn);

    // Adiciona event listeners para os botões do menu lateral
    buttons.forEach((btn) => {
        btn.addEventListener("click", async () => {
            // Remove classe active de todos
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            // Move a animação para o novo botão
            moveHoverBox(btn);

            // Exibe a seção correspondente
            const sectionId = btn.dataset.section;
            sections.forEach((s) => {
                s.style.display = s.id === `section-${sectionId}` ? "block" : "none";
            });

            // Se for a seção de atividades, carrega as atividades
            if (sectionId === 'activities') {
                await loadActivities();
            } else if (sectionId === 'overview') {
                // Lógica para carregar a visão geral, quando implementada
            }
            // Outras seções...
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
        filterAndSearchActivities(); // Re-renderiza para aplicar o novo estado
    });

    // Carrega as atividades se a seção de atividades for a inicial ou a primeira a ser mostrada
    // Você pode querer chamar loadActivities() apenas quando o botão de atividades for clicado
    // Ou, se a seção de atividades for a seção ativa padrão ao carregar a página:
    if (document.getElementById('section-activities').classList.contains('form-step-active') || initialBtn.dataset.section === 'activities') {
        loadActivities();
    }
});
