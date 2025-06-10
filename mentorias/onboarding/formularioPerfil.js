function doPost(e) {
  var spreadsheetId = '1RTBgpD6_pSiD_Cv-33mW2JPQnlV_jpXwlJhMhI9BC8M'; // ID da sua PLANILHA
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName("Candidatos");

  var data = e.parameter;


  // Obter a data e hora atual no fuso horário do Brasil
  var now = new Date();
  var timezone = Session.getScriptTimeZone(); // Obtém o fuso horário do script
  var formattedDateTime = Utilities.formatDate(now, timezone, "dd/MM/yyyy HH:mm");

  // Arrays para armazenar as respostas das perguntas de 1 a 15
  var respostasPerguntas = [];

  // Mapeamento dos entry IDs para as perguntas de 1 a 15 (ordem que você listou anteriormente)
  var entryIdsPerguntas = [
    'Ao se deparar com um grande desafio, qual é sua reação mais comum?', // Pergunta 1
    'O que você espera do mentor durante as sessões?', // Pergunta 2
    'Como você reage quando alguém faz críticas sobre seu desempenho?', // Pergunta 3
    'Como você costuma planejar suas atividades profissionais?', // Pergunta 4
    'Qual dessas afirmações melhor descreve você ao aprender algo novo?', // Pergunta 5
    'Em relação a mudanças bruscas na sua rotina, você:', // Pergunta 6
    'Diante de decisões difíceis, sua atitude mais frequente é:', // Pergunta 7
    'Em projetos em grupo, geralmente você:', // Pergunta 8
    'Ao cometer um erro significativo, você normalmente:', // Pergunta 9
    'Qual estilo de comunicação você espera do seu mentor?', // Pergunta 10
    'O que mais te motiva em uma mentoria?',  // Pergunta 11
    'Como você lida com sugestões diferentes daquilo que imaginava?',  // Pergunta 12
    'Em situações difíceis, qual é sua postura mais comum?', // Pergunta 13
    'Sobre a iniciativa no trabalho, você diria que costuma:', // Pergunta 14
    'Quando enfrenta uma situação que exige mudança, você:'  // Pergunta 15
  ];

  var countReflexivo = 0;
  var countPragmatico = 0;
  var countDesalinhado = 0;

  // Processar cada pergunta para contar os perfis
  for (var i = 0; i < entryIdsPerguntas.length; i++) {
    var resposta = data[entryIdsPerguntas[i]];
    respostasPerguntas.push(resposta); // Adiciona a resposta bruta ao array para preencher a planilha

    // Contagem baseada na resposta (primeira, segunda ou terceira opção)
    // ATENÇÃO: Os valores exatos das opções (o que está no 'value' do input radio)
    // precisam corresponder ao que você tem no seu formulário HTML.
    // Ajuste esses valores SE forem diferentes do que está abaixo.

    // Pergunta 1. Ao se deparar com um grande desafio, qual é sua reação mais comum?
    if (entryIdsPerguntas[i] === 'Ao se deparar com um grande desafio, qual é sua reação mais comum?') {
      if (resposta === "Analiso cuidadosamente o cenário antes de agir.") {
        countReflexivo++;
      } else if (resposta === "Procuro resolver rapidamente com ações diretas e práticas.") {
        countPragmatico++;
      } else if (resposta === "Normalmente fico desconfortável ou evito lidar diretamente.") {
        countDesalinhado++;
      }
    }
    // Pergunta 2. O que você espera do mentor durante as sessões?
    else if (entryIdsPerguntas[i] === 'O que você espera do mentor durante as sessões?') {
      if (resposta === "Que me ajude a refletir sobre as melhores escolhas.") {
        countReflexivo++;
      } else if (resposta === "Que me dê orientações objetivas para aplicação imediata.") {
        countPragmatico++;
      } else if (resposta === "Que tome decisões por mim e resolva meus problemas.") {
        countDesalinhado++;
      }
    }
    // Pergunta 3. Como você reage quando alguém faz críticas sobre seu desempenho?
    else if (entryIdsPerguntas[i] === 'Como você reage quando alguém faz críticas sobre seu desempenho?') {
      if (resposta === "Costumo refletir com calma antes de responder.") {
        countReflexivo++;
      } else if (resposta === "Recebo bem, especialmente se forem claras e objetivas.") {
        countPragmatico++;
      } else if (resposta === "Não aceito bem e me sinto incomodado.") {
        countDesalinhado++;
      }
    }
    // Pergunta 4. Como você costuma planejar suas atividades profissionais?
    else if (entryIdsPerguntas[i] === 'Como você costuma planejar suas atividades profissionais?') {
      if (resposta === "Faço um planejamento detalhado e antecipado.") {
        countReflexivo++;
      } else if (resposta === "Planejo rapidamente de forma prática e direta.") {
        countPragmatico++;
      } else if (resposta === "Não tenho muito hábito de planejar, resolvo conforme surge.") {
        countDesalinhado++;
      }
    }
    // Pergunta 5. Qual dessas afirmações melhor descreve você ao aprender algo novo?
    else if (entryIdsPerguntas[i] === 'Qual dessas afirmações melhor descreve você ao aprender algo novo?') {
      if (resposta === "Prefiro entender primeiro as teorias e contextos.") {
        countReflexivo++;
      } else if (resposta === "Aprendo fazendo, na prática e rapidamente.") {
        countPragmatico++;
      } else if (resposta === "Não costumo investir tempo aprendendo coisas novas.") {
        countDesalinhado++;
      }
    }
    // Pergunta 6. Em relação a mudanças bruscas na sua rotina, você:
    else if (entryIdsPerguntas[i] === 'Em relação a mudanças bruscas na sua rotina, você:') {
      if (resposta === "Preciso refletir para entender os impactos primeiro.") {
        countReflexivo++;
      } else if (resposta === "Me adapto rapidamente e sigo em frente.") {
        countPragmatico++;
      } else if (resposta === "Tenho dificuldade em lidar com mudanças repentinas.") {
        countDesalinhado++;
      }
    }
    // Pergunta 7. Diante de decisões difíceis, sua atitude mais frequente é:
    else if (entryIdsPerguntas[i] === 'Diante de decisões difíceis, sua atitude mais frequente é:') {
      if (resposta === "Considero cuidadosamente todas as possibilidades.") {
        countReflexivo++;
      } else if (resposta === "Decido rápido para evitar perder tempo.") {
        countPragmatico++;
      } else if (resposta === "Evito ao máximo decidir ou passo a responsabilidade.") {
        countDesalinhado++;
      }
    }
    // Pergunta 8. Em projetos em grupo, geralmente você:
    else if (entryIdsPerguntas[i] === 'Em projetos em grupo, geralmente você:') {
      if (resposta === "Contribuo com ideias estratégicas e reflexões.") {
        countReflexivo++;
      } else if (resposta === "Gosto de executar tarefas rapidamente e com clareza.") {
        countPragmatico++;
      } else if (resposta === "Prefiro não me envolver diretamente nas decisões.") {
        countDesalinhado++;
      }
    }
    // Pergunta 9. Ao cometer um erro significativo, você normalmente:
    else if (entryIdsPerguntas[i] === 'Ao cometer um erro significativo, você normalmente:') {
      if (resposta === "Analiso o erro detalhadamente para entender e evitar repetições.") {
        countReflexivo++;
      } else if (resposta === "Corrijo rapidamente e não gasto muito tempo analisando.") {
        countPragmatico++;
      } else if (resposta === "Evito assumir responsabilidade ou culpo circunstâncias externas.") {
        countDesalinhado++;
      }
    }
    // Pergunta 10. Qual estilo de comunicação você espera do seu mentor?
    else if (entryIdsPerguntas[i] === 'Qual estilo de comunicação você espera do seu mentor?') {
      if (resposta === "Exploratório, com perguntas e reflexão.") {
        countReflexivo++;
      } else if (resposta === "Direto, claro e focado em resultados imediatos.") {
        countPragmatico++;
      } else if (resposta === "Não gosto muito de receber opiniões ou sugestões.") {
        countDesalinhado++;
      }
    }
    // Pergunta 11. O que mais te motiva em uma mentoria?
    else if (entryIdsPerguntas[i] === 'O que mais te motiva em uma mentoria?') {
      if (resposta === "Ter mais clareza e segurança sobre minhas decisões.") {
        countReflexivo++;
      } else if (resposta === "Sair com metas claras e aplicáveis imediatamente.") {
        countPragmatico++;
      } else if (resposta === "Resolver rapidamente meus problemas com mínimo esforço.") {
        countDesalinhado++;
      }
    }
    // Pergunta 12. Como você lida com sugestões diferentes daquilo que imaginava?
    else if (entryIdsPerguntas[i] === 'Como você lida com sugestões diferentes daquilo que imaginava?') {
      if (resposta === "Analiso com calma e busco compreender o valor real da sugestão.") {
        countReflexivo++;
      } else if (resposta === "Avalio rapidamente e aceito bem se forem práticas.") {
        countPragmatico++;
      } else if (resposta === "Tenho dificuldade em aceitar opiniões diferentes.") {
        countDesalinhado++;
      }
    }
    // Pergunta 13. Em situações difíceis, qual é sua postura mais comum?
    else if (entryIdsPerguntas[i] === 'Em situações difíceis, qual é sua postura mais comum?') {
      if (resposta === "Tomo um tempo para entender profundamente antes de agir.") {
        countReflexivo++;
      } else if (resposta === "Busco resolver rapidamente e avançar.") {
        countPragmatico++;
      } else if (resposta === "Evito enfrentar diretamente e espero que resolvam por mim.") {
        countDesalinhado++;
      }
    }
    // Pergunta 14. Sobre a iniciativa no trabalho, você diria que costuma:
    else if (entryIdsPerguntas[i] === 'Sobre a iniciativa no trabalho, você diria que costuma:') {
      if (resposta === "Avaliar bem antes de tomar qualquer atitude.") {
        countReflexivo++;
      } else if (resposta === "Tomar rapidamente a frente para solucionar o problema.") {
        countPragmatico++;
      } else if (resposta === "Esperar que alguém me diga exatamente o que fazer.") {
        countDesalinhado++;
      }
    }
    // Pergunta 15. Quando enfrenta uma situação que exige mudança, você:
    else if (entryIdsPerguntas[i] === 'Quando enfrenta uma situação que exige mudança, você:') {
      if (resposta === "Gosta de entender profundamente antes de fazer qualquer mudança.") {
        countReflexivo++;
      } else if (resposta === "Age rapidamente, ajustando a rota conforme necessário.") {
        countPragmatico++;
      } else if (resposta === "Fica resistente e prefere não mudar muito.") {
        countDesalinhado++;
      }
    }
  }

  // --- LOG DE DEBUG PARA countDesalinhado ---
  // ESTA LINHA VAI ESCREVER O VALOR DE countDesalinhado NOS REGISTROS DE EXECUÇÃO DO APPS SCRIPT
  Logger.log('Valor de countDesalinhado ANTES do alerta: ' + countDesalinhado); 
  // ------------------------------------------


  // Alerta de Desalinhado - REVISÃO FINAL E MAIS EXPLÍCITA
  var alertaDesalinhado = ""; // Inicializa a variável como vazia
  if (countDesalinhado > 4) { // Verifica a condição
    alertaDesalinhado = "⚠️Alerta: Desalinhado"; // Se true, atribui o valor
  }
  // Se a condição for false, alertaDesalinhado permanece "" (vazio), como queremos.

  // Determinar o perfil predominante
  var perfilPredominante = "";
  var maxCount = Math.max(countPragmatico, countReflexivo, countDesalinhado);

  // Lógica de desempate
  var perfisComMax = [];
  if (maxCount === countPragmatico) perfisComMax.push("Pragmático");
  if (maxCount === countReflexivo) perfisComMax.push("Reflexivo");
  if (maxCount === countDesalinhado) perfisComMax.push("Desalinhado");

  if (perfisComMax.length > 1) { // Houve um empate entre 2 ou mais perfis
    perfilPredominante = "Empate";
  } else {
    perfilPredominante = perfisComMax[0]; // Apenas um perfil é predominante
  }

  // --- LOG DE DEBUG PARA alertaDesalinhado ---
  Logger.log('Valor de alertaDesalinhado: ' + alertaDesalinhado);
  // ------------------------------------------

  // Cria um array para armazenar as respostas na ordem das colunas da planilha
  var rowData = [];

  // Coluna A: Data e Hora
  rowData.push(formattedDateTime);

  // Coluna B: Nome Completo
  rowData.push(data['nome']);

  // Coluna C: CPF
  rowData.push(data['cpf']);

  // Coluna D: WHATSAPP
  rowData.push(data['whatsapp']);

  // Coluna E: E-mail
  rowData.push(data['email']);

  // Colunas F - T: Respostas das Perguntas (1 a 15)
  rowData = rowData.concat(respostasPerguntas);

  // Coluna U: Contagem de Pragmático
  rowData.push(countPragmatico);

  // Coluna V: Contagem de Reflexivo
  rowData.push(countReflexivo);

  // Coluna W: Contagem de Desalinhado
  rowData.push(countDesalinhado);

  // Coluna X: Perfil Predominante
  rowData.push(perfilPredominante);

  // Coluna Y: Alerta Desalinhado
  rowData.push(alertaDesalinhado); // Adiciona a variável na linha

  // Adiciona a nova linha com os dados na planilha
  sheet.appendRow(rowData);

  // DEBUG: Verifica se o valor do perfilPredominante está vindo corretamente
  Logger.log("Perfil Predominante: " + perfilPredominante);

  // DEBUG: Pega a linha onde o dado foi inserido
  var ultimaLinha = sheet.getLastRow();
  Logger.log("Última linha: " + ultimaLinha);

  // DEBUG: Determina status
  var status = perfilPredominante.trim() === "Desalinhado" ? "Negado" : "Aguardando proposta";
  Logger.log("Status calculado: " + status);

  // Tenta preencher o status na coluna Z
  sheet.getRange(ultimaLinha, 26).setValue(status);

  // Retorna uma resposta de sucesso para o navegador
  return ContentService.createTextOutput("Sucesso!").setMimeType(ContentService.MimeType.TEXT);
}