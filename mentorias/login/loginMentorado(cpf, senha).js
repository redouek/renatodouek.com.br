
function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error("Requisição inválida: parâmetros ausentes.");
    }

    if (e.parameter.acao === "login") {
      return loginMentorado(e.parameter.cpf, e.parameter.senha);
    }

    return ContentService.createTextOutput("Ação não reconhecida");
  } catch (erro) {
    Logger.log("Erro no doPost: " + erro);
    return ContentService.createTextOutput("Erro interno: " + erro.message);
  }
}

function loginMentorado(cpf, senha) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Mentorados");
  const dados = sheet.getDataRange().getValues();

  Logger.log("Iniciando verificação de login");
  Logger.log("CPF recebido: " + cpf);
  Logger.log("Senha recebida: " + senha);

  for (let i = 1; i < dados.length; i++) {
    const linha = dados[i];
    const cpfPlanilha = linha[1].toString().trim();
    const senhaPlanilha = linha[5].toString().trim();

    Logger.log("Linha " + (i+1) + ": CPF = " + cpfPlanilha + ", Senha = " + senhaPlanilha);

    if (cpfPlanilha === cpf.trim()) {
      Logger.log("CPF encontrado!");
      if (senhaPlanilha === senha.trim()) {
        Logger.log("Senha correta!");
        sheet.getRange(i + 1, 7).setValue(new Date());
        return ContentService.createTextOutput(JSON.stringify({
          status: "ok",
          nome: linha[0],
          perfil: linha[4],
          email: linha[2]
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        Logger.log("Senha incorreta.");
        return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "Senha incorreta" })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  Logger.log("CPF não encontrado.");
  return ContentService.createTextOutput(JSON.stringify({ status: "erro", mensagem: "CPF não encontrado" })).setMimeType(ContentService.MimeType.JSON);
}
