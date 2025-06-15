// Arquivo: AppsScriptActivities.gs 

// ===============================================================
// Função de normalização padronizada para usar em todo o GAS
// Definida globalmente para ser acessível por ActivitiesHandler
// ===============================================================
function normalizeHeader(header) {
    var normalized = header;
    
    // Remove caracteres especiais comuns
    normalized = normalized.replace(/\//g, "");
    normalized = normalized.replace(/\-/g, "");
    normalized = normalized.replace(/\./g, "");
    normalized = normalized.replace(/\,/g, "");
    normalized = normalized.replace(/\(/g, "");
    normalized = normalized.replace(/\)/g, "");
    normalized = normalized.replace(/\[/g, "");
    normalized = normalized.replace(/\]/g, "");
    normalized = normalized.replace(/\{/g, "");
    normalized = normalized.replace(/\}/g, "");
    normalized = normalized = normalized.replace(/\!/g, "");
    normalized = normalized.replace(/\@/g, "");
    normalized = normalized.replace(/\#/g, "");
    normalized = normalized.replace(/\$/g, "");
    normalized = normalized.replace(/\%/g, "");
    normalized = normalized.replace(/\^/g, "");
    normalized = normalized.replace(/\&/g, "");
    normalized = normalized.replace(/\*/g, "");
    normalized = normalized.replace(/\+/g, "");
    normalized = normalized.replace(/\=/g, "");
    normalized = normalized.replace(/\|/g, "");
    normalized = normalized.replace(/\\/g, "");
    normalized = normalized.replace(/\:/g, "");
    normalized = normalized.replace(/\;/g, "");
    normalized = normalized.replace(/\"/g, "");
    normalized = normalized.replace(/\'/g, "");
    normalized = normalized.replace(/\</g, "");
    normalized = normalized.replace(/\>/g, "");
    normalized = normalized.replace(/\?/g, "");
    
    // Remove acentos
    normalized = normalized.replace(/[áàâãä]/g, "a");
    normalized = normalized.replace(/[éèêë]/g, "e");
    normalized = normalized.replace(/[íìîï]/g, "i");
    normalized = normalized.replace(/[óòôõö]/g, "o");
    normalized = normalized.replace(/[úùûü]/g, "u");
    normalized = normalized.replace(/[ç]/g, "c");
    normalized = normalized.replace(/[ÁÀÂÃÄ]/g, "A");
    normalized = normalized.replace(/[ÉÈÊË]/g, "E");
    normalized = normalized.replace(/[ÍÌÎÏ]/g, "I");
    normalized = normalized.replace(/[ÓÒÔÕÖ]/g, "O");
    normalized = normalized.replace(/[ÚÙÛÜ]/g, "U");
    normalized = normalized.replace(/[Ç]/g, "C");
    
    // Remove espaços
    normalized = normalized.replace(/\s+/g, "");
    
    // Primeira letra maiúscula
    if (normalized.length > 0) {
        normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    Logger.log("Original Header: '" + header + "' -> Normalized: '" + normalized + "'");

    return normalized;
}

var ActivitiesHandler = {
    SPREADSHEET_ID: "1XuhhSSwhamHl_zM1rG9Xpp9y5bQ2PqFlYOXkqqTRpMs", 
    SHEET_NAME_ACTIVITIES: "Atividades",
    SHEET_NAME_MENTORADOS: "Mentorados",

    // Colunas da aba "Atividades" (indices baseados em 0)
    COL_ID: 0,
    COL_CPF_MENTORADO: 1,
    COL_NOME_MENTORADO: 2,
    COL_ATIVIDADE: 3,
    COL_DESCRICAO: 4, 
    COL_DATA_LIMITE: 5,
    COL_STATUS_ATUAL: 6,
    COL_STATUS_ANTERIOR: 7,
    COL_CONCLUIDA_CHECKBOX: 8,
    COL_CRIADO_EM: 9,
    COL_ULTIMA_ATUALIZACAO: 10,

    COL_MENTORADOS_NOME: 0, 
    COL_MENTORADOS_CPF: 1, 

    getActivitiesSheet: function() {
        const ss = SpreadsheetApp.openById(this.SPREADSHEET_ID);
        return ss.getSheetByName(this.SHEET_NAME_ACTIVITIES);
    },

    getMentoradosSheet: function() {
        const ss = SpreadsheetApp.openById(this.SPREADSHEET_ID);
        return ss.getSheetByName(this.SHEET_NAME_MENTORADOS);
    },

    getAllActivitiesData: function() {
        const sheet = this.getActivitiesSheet();
        if (!sheet) throw new Error("Aba \'" + this.SHEET_NAME_ACTIVITIES + "\' não encontrada.");
        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) return []; 
        
        const headers = data[0];
        const activities = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const activity = {};
            headers.forEach((header, index) => {
                const normalizedHeader = normalizeHeader(header);
                if (normalizedHeader === 'DataLimite' && row[index] instanceof Date) {
                    const date = row[index];
                    activity[normalizedHeader] = Utilities.formatDate(date, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
                } else if (row[index] !== null && row[index] !== undefined) {
                    activity[normalizedHeader] = String(row[index]).trim();
                } else {
                    activity[normalizedHeader] = "";
                }
            });
            activities.push(activity);
        }
        Logger.log("Dados de todas as atividades lidos (primeira atividade para exemplo): " + JSON.stringify(activities[0])); 
        return activities;
    },

    getActivitiesByCpf: function(e) {
        Logger.log("getActivitiesByCpf acionada para CPF: " + e.parameter.cpf);
        const cpf = e.parameter.cpf ? e.parameter.cpf.replace(/[^\d]+/g, "").trim() : "";
        if (!cpf) {
            return this.createJsonResponse(false, "CPF não fornecido.");
        }

        try {
            const allActivities = this.getAllActivitiesData();
            const userActivities = allActivities.filter(activity => 
                String(activity.CPFdoMentorado || "").replace(/\D/g, "") === cpf
            );
            
            const activitiesWithCalculatedStatus = userActivities.map(activity => {
                const updatedActivity = { ...activity };
                updatedActivity.StatusAtual = this.getCalculatedStatusBasedOnDate(activity); 
                return updatedActivity;
            });

            Logger.log("Atividades filtradas e processadas para o frontend (CPF: " + cpf + ", Count: " + activitiesWithCalculatedStatus.length + "): " + JSON.stringify(activitiesWithCalculatedStatus));

            return this.createJsonResponse(true, "Atividades carregadas com sucesso.", { activities: activitiesWithCalculatedStatus });
        } catch (error) {
            return this.createJsonResponse(false, "Erro ao carregar atividades: " + error.message + " | Detalhes: " + error.stack);
        }
    },

    saveActivity: function(e) {
        Logger.log("saveActivity acionada para ID: " + e.parameter.id);
        const sheet = this.getActivitiesSheet();
        if (!sheet) return this.createJsonResponse(false, "Aba \'Atividades\' não encontrada.");

        try {
            const id = e.parameter.id || Utilities.getUuid();
            const cpfMentorado = e.parameter.cpfMentorado ? e.parameter.cpfMentorado.replace(/[^\d]+/g, "").trim() : "";
            const nomeMentorado = e.parameter.nomeMentorado || "";
            const atividade = e.parameter.atividade || "";
            const descricao = e.parameter.descricao || ""; 
            Logger.log("Descrição recebida em saveActivity: \'" + descricao + "\'"); 
            const dataLimite = e.parameter.dataLimite ? new Date(e.parameter.dataLimite + "T00:00:00") : null; 
            const statusAtual = e.parameter.statusAtual || "Não iniciada";
            const statusAnteriorParam = e.parameter.statusAnterior || ""; 

            const now = new Date();

            let rowData = [
                id,                                  // COL_ID
                cpfMentorado,                        // COL_CPF_MENTORADO
                nomeMentorado,                       // COL_NOME_MENTORADO
                atividade,                           // COL_ATIVIDADE
                descricao,                           // COL_DESCRICAO
                dataLimite,                          // COL_DATA_LIMITE
                statusAtual,                         // COL_STATUS_ATUAL
                "",                                 // COL_STATUS_ANTERIOR (será preenchido pela lógica)
                "Não",                               // COL_CONCLUIDA_CHECKBOX (sempre Não para adição/edição via modal)
                now,                                 // COL_CRIADO_EM
                now                                  // COL_ULTIMA_ATUALIZACAO
            ];

            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const idColIndex = headers.indexOf("ID da Atividade");
            Logger.log("Cabeçalhos da planilha: " + JSON.stringify(headers));
            Logger.log("ID da Atividade (index 0): " + idColIndex);

            if (idColIndex === -1) {
                throw new Error("Coluna \'ID da Atividade\' não encontrada na planilha.");
            }

            let rowToUpdate = -1;
            const data = sheet.getDataRange().getValues();
            if (data.length > 1) { 
                Logger.log("IDs na planilha para busca (primeiras 5 linhas): " + data.slice(1, Math.min(6, data.length)).map(row => String(row[idColIndex] || "") + (row[idColIndex] ? " (Tipo: " + typeof row[idColIndex] + ")" : "")).join(", "));
            } else {
                Logger.log("Planilha de atividades está vazia ou contém apenas cabeçalho.");
            }

            for (let i = 1; i < data.length; i++) {
                if (String(data[i][idColIndex] || "").trim() === String(id).trim()) {
                    rowToUpdate = i + 1;
                    Logger.log("ID \'" + id + "\' encontrado para edição na linha: " + rowToUpdate);
                    break;
                }
            }

            let savedActivityData; 
            if (rowToUpdate !== -1) {
                const existingRowValues = sheet.getRange(rowToUpdate, 1, 1, sheet.getLastColumn()).getValues()[0];
                
                const statusAtualAnterior = existingRowValues[this.COL_STATUS_ATUAL]; 
                if (statusAtual === "Concluída") { 
                    existingRowValues[this.COL_STATUS_ANTERIOR] = statusAtualAnterior;
                } else {
                    existingRowValues[this.COL_STATUS_ANTERIOR] = "";
                }

                existingRowValues[this.COL_ID] = rowData[this.COL_ID];
                existingRowValues[this.COL_CPF_MENTORADO] = rowData[this.COL_CPF_MENTORADO];
                existingRowValues[this.COL_NOME_MENTORADO] = rowData[this.COL_NOME_MENTORADO];
                existingRowValues[this.COL_ATIVIDADE] = rowData[this.COL_ATIVIDADE];
                existingRowValues[this.COL_DESCRICAO] = rowData[this.COL_DESCRICAO];
                existingRowValues[this.COL_DATA_LIMITE] = rowData[this.COL_DATA_LIMITE];
                existingRowValues[this.COL_STATUS_ATUAL] = rowData[this.COL_STATUS_ATUAL];
                existingRowValues[this.COL_CONCLUIDA_CHECKBOX] = "Não"; 
                existingRowValues[this.COL_ULTIMA_ATUALIZACAO] = rowData[this.COL_ULTIMA_ATUALIZACAO];

                sheet.getRange(rowToUpdate, 1, 1, existingRowValues.length).setValues([existingRowValues]);
                Logger.log("Atividade atualizada: " + id + " na linha: " + rowToUpdate);
                savedActivityData = existingRowValues; 
            } else {
                rowData[this.COL_STATUS_ANTERIOR] = ""; 
                sheet.appendRow(rowData);
                rowToUpdate = sheet.getLastRow();
                Logger.log("Nova atividade adicionada: " + id + " na linha: " + rowToUpdate);
                savedActivityData = sheet.getRange(rowToUpdate, 1, 1, sheet.getLastColumn()).getValues()[0]; 
            }
            
            sheet.getRange(rowToUpdate, this.COL_DATA_LIMITE + 1).setNumberFormat("DD/MM/YYYY");
            sheet.getRange(rowToUpdate, this.COL_CRIADO_EM + 1).setNumberFormat("DD/MM/YYYY HH:mm:ss");
            sheet.getRange(rowToUpdate, this.COL_ULTIMA_ATUALIZACAO + 1).setNumberFormat("DD/MM/YYYY HH:mm:ss");

            const activityToReturn = this.mapRowToActivityObject(headers, savedActivityData);
            return this.createJsonResponse(true, "Atividade salva com sucesso!", { id: id, activity: activityToReturn });

        } catch (error) {
            return this.createJsonResponse(false, "Erro ao salvar atividade: " + error.message + " | Detalhes: " + error.stack);
        }
    },

    mapRowToActivityObject: function(headers, rowValues) {
        const activity = {};
        headers.forEach((header, index) => {
            const normalizedHeader = normalizeHeader(header);
            let value = (rowValues[index] !== null && rowValues[index] !== undefined) ? rowValues[index] : "";

            if (normalizedHeader === 'DataLimite' && value instanceof Date) {
                value = Utilities.formatDate(value, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
            } else if (['CriadoEm', 'UltimaAtualizacao'].includes(normalizedHeader) && value instanceof Date) {
                 value = Utilities.formatDate(value, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            } else {
                value = String(value).trim();
            }
            activity[normalizedHeader] = value;
        });
        
        return activity;
    },

    updateActivityStatus: function(e) {
        Logger.log("updateActivityStatus acionada para ID: " + e.parameter.id);
        const sheet = this.getActivitiesSheet();
        if (!sheet) return this.createJsonResponse(false, "Aba \'Atividades\' não encontrada.");

        try {
            const id = e.parameter.id;
            const newStatus = e.parameter.newStatus;
            // oldStatusForUndo que vem do frontend é o StatusAtual que a tarefa tinha ANTES da ação (marcar/desmarcar).
            const oldStatusForUndo = e.parameter.oldStatusForUndo || ""; 
            const concluidaPorCheckbox = e.parameter.concluidaPorCheckbox || "Não";

            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const idColIndex = headers.indexOf("ID da Atividade");
            const statusColIndex = headers.indexOf("Status Atual");
            const statusAnteriorColIndex = headers.indexOf("Status Anterior");
            const concluidaCheckboxColIndex = headers.indexOf("Concluída por Checkbox"); 
            const ultimaAtualizacaoColIndex = headers.indexOf("Última Atualização");

            if (idColIndex === -1 || statusColIndex === -1 || statusAnteriorColIndex === -1 || concluidaCheckboxColIndex === -1 || ultimaAtualizacaoColIndex === -1) {
                throw new Error("Uma ou mais colunas essenciais não encontradas para atualização de status. Verifique: ID da Atividade, Status Atual, Status Anterior, Concluída por Checkbox, Última Atualização.");
            }

            const data = sheet.getDataRange().getValues();
            let rowToUpdate = -1;

            for (let i = 1; i < data.length; i++) {
                if (String(data[i][idColIndex] || "").trim() === String(id).trim()) {
                    rowToUpdate = i + 1; 
                    break;
                }
            }

            if (rowToUpdate !== -1) {
                const row = sheet.getRange(rowToUpdate, 1, 1, sheet.getLastColumn());
                const rowValues = row.getValues()[0];

                const statusAtualNaPlanilhaAntesDaMudanca = rowValues[statusColIndex];
                const statusAnteriorGuardadoNaPlanilha = rowValues[statusAnteriorColIndex]; // Valor do StatusAnterior na planilha

                let finalNewStatusForSheet = newStatus; // O status que o frontend *quer* setar
                let finalNewStatusAnteriorForSheet = statusAnteriorGuardadoNaPlanilha; // Padrão é o que já está lá

                if (newStatus === "Concluída") { // Usuário marcou como "Concluída"
                    finalNewStatusForSheet = "Concluída";
                    finalNewStatusAnteriorForSheet = statusAtualNaPlanilhaAntesDaMudanca; // Armazena o status que tinha antes de concluir
                } else { // Usuário desmarcou (newStatus NÃO é "Concluída")
                    // A nova lógica para determinar o status ao desfazer/desmarcar
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let dataLimite;
                    if (rowValues[this.COL_DATA_LIMITE] instanceof Date) { 
                        dataLimite = rowValues[this.COL_DATA_LIMITE];
                    } else if (typeof rowValues[this.COL_DATA_LIMITE] === 'string' && rowValues[this.COL_DATA_LIMITE]) { 
                        dataLimite = new Date(rowValues[this.COL_DATA_LIMITE] + 'T00:00:00');
                    } else { 
                        dataLimite = null;
                    }

                    // Regra: Se o status anterior era "Atrasada" E a data ainda é passada --> mantém Atrasada
                    if (statusAnteriorGuardadoNaPlanilha === "Atrasada" && dataLimite && dataLimite < today) {
                        finalNewStatusForSheet = "Atrasada";
                    } 
                    // Regra: Se o status anterior era "Perto de expirar" OU "Não iniciada" OU "Executando"
                    // Reavalia com getCalculatedStatusBasedOnDate no contexto do status anterior guardado
                    else if (["Não iniciada", "Executando", "Perto de expirar"].includes(statusAnteriorGuardadoNaPlanilha)) {
                        const activityContextForReversion = {
                            StatusAtual: statusAnteriorGuardadoNaPlanilha, 
                            DataLimite: rowValues[this.COL_DATA_LIMITE] 
                        };
                        finalNewStatusForSheet = this.getCalculatedStatusBasedOnDate(activityContextForReversion);
                    } else {
                        // Se StatusAnterior era algo inesperado ou vazio, volta para Não iniciada como fallback.
                        finalNewStatusForSheet = "Não iniciada";
                    }
                    finalNewStatusAnteriorForSheet = ""; // Limpa StatusAnterior depois de desfazer/desmarcar
                }
                
                rowValues[statusColIndex] = finalNewStatusForSheet;
                rowValues[statusAnteriorColIndex] = finalNewStatusAnteriorForSheet;
                rowValues[concluidaCheckboxColIndex] = concluidaPorCheckbox; 
                rowValues[ultimaAtualizacaoColIndex] = new Date();

                try {
                    row.setValues([rowValues]);
                    Logger.log(`Status da atividade ${id} atualizado para: ${finalNewStatusForSheet}. Status Anterior (no sheet) agora é: ${finalNewStatusAnteriorForSheet}`);
                
                    const updatedActivityData = sheet.getRange(rowToUpdate, 1, 1, sheet.getLastColumn()).getValues()[0];
                    const activityToReturn = this.mapRowToActivityObject(headers, updatedActivityData);
                    return this.createJsonResponse(true, "Status atualizado com sucesso!", { activity: activityToReturn });
                } catch (innerError) {
                    Logger.log(`ERRO CRÍTICO ao setValues para atividade ${id}: ${innerError.message} | Stack: ${innerError.stack}`);
                    return this.createJsonResponse(false, `Erro interno ao persistir atualização: ${innerError.message}`);
                }
            } else {
                return this.createJsonResponse(false, "Atividade não encontrada para atualização de status.");
            }

        } catch (error) {
            Logger.log("Erro em updateActivityStatus (geral): " + error.message + " | Stack: " + error.stack);
            return this.createJsonResponse(false, "Erro ao atualizar status: " + error.message);
        }
    },

    deleteActivity: function(e) {
        Logger.log("deleteActivity acionada para ID: " + e.parameter.id);
        const sheet = this.getActivitiesSheet();
        if (!sheet) return this.createJsonResponse(false, "Aba \'Atividades\' não encontrada.");

        try {
            const id = e.parameter.id;
            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const idColIndex = headers.indexOf("ID da Atividade");

            if (idColIndex === -1) {
                throw new Error("Coluna \'ID da Atividade\' não encontrada na planilha.");
            }

            const data = sheet.getDataRange().getValues();
            let rowToDelete = -1;

            Logger.log("ID recebido para exclusão (frontend): \'" + id + "\' (Tipo: " + typeof id + ")");
            if (data.length > 1) {
                Logger.log("Primeiros 5 IDs na planilha para busca: " + data.slice(1, Math.min(6, data.length)).map(row => String(row[idColIndex] || "") + (row[idColIndex] ? " (Tipo: " + typeof row[idColIndex] + ")" : "")).join(", "));
            } else {
                Logger.log("Planilha de atividades está vazia ou contém apenas cabeçalho.");
            }
            Logger.log("Procurando ID \'" + id + "\' na coluna de ID (índice 0, coluna A).");


            for (let i = 1; i < data.length; i++) {
                if (String(data[i][idColIndex] || "").trim() === String(id).trim()) {
                    rowToDelete = i + 1; 
                    Logger.log("ID \'" + id + "\' encontrado na linha da planilha: " + rowToDelete);
                    break;
                }
            }

            if (rowToDelete !== -1) {
                sheet.deleteRow(rowToDelete);
                Logger.log("Atividade " + id + " excluída com sucesso da linha " + rowToDelete + ".");
                return this.createJsonResponse(true, "Atividade excluída com sucesso!");
            } else {
                Logger.log("Atividade com ID \'" + id + "\' NÃO encontrada na planilha para exclusão.");
                return this.createJsonResponse(false, "Atividade não encontrada para exclusão.");
            }

        } catch (error) {
            return this.createJsonResponse(false, "Erro ao excluir atividade: " + error.message + " | Detalhes: " + error.stack);
        }
    },

    // MUDANÇA: Lógica aprimorada para getCalculatedStatusBasedOnDate
    getCalculatedStatusBasedOnDate: function(activity) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentStatus = activity.StatusAtual; // O status que está sendo avaliado (pode ser o original ou um temporário)

        // Regra 1: Concluída é um estado final para esta função.
        if (currentStatus === "Concluída") {
            return "Concluída"; 
        }

        let dataLimite;
        if (activity.DataLimite instanceof Date) { 
            dataLimite = activity.DataLimite;
        } else if (typeof activity.DataLimite === 'string' && activity.DataLimite) { 
            dataLimite = new Date(activity.DataLimite + 'T00:00:00');
        } else { 
            dataLimite = null;
        }

        // Se não há data limite válida, mantém o status atual (ação do usuário)
        if (!dataLimite || isNaN(dataLimite.getTime())) {
            return currentStatus; 
        }

        // Regra Automática 2: Se data limite passou -> Atrasada (alta prioridade)
        if (dataLimite < today) {
            return "Atrasada"; 
        }

        // Calcular diferença em dias para "Perto de expirar"
        const diffTime = Math.abs(dataLimite.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Regra Automática 1: Se é "Não iniciada" OU "Executando" E data limite <= 3 dias -> "Perto de expirar"
        if ((currentStatus === "Não iniciada" || currentStatus === "Executando") && diffDays <= 3) { 
            return "Perto de expirar";
        }

        // Se nenhuma regra automática se aplicou, retorna o status que estava em contexto.
        return currentStatus;
    },

    applyDueDateStatusLogic: function(activities) {
        return activities.map(activity => {
            const newActivity = { ...activity };
            newActivity.StatusAtual = this.getCalculatedStatusBasedOnDate(activity);
            return newActivity;
        });
    },

    createJsonResponse: function(success, message, data = {}) {
        const response = { status: success ? "success" : "error", message: message, ...data };
        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);
    }
};
