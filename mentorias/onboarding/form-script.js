// ===============================================================
// Funções de Validação e Máscara (Mantidas do seu código original)
// ===============================================================

// Validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto >= 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto >= 10) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
}

// Aplicação de máscara no CPF
function aplicarMascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Validação e Máscara de Telefone/WhatsApp
function aplicarMascaraTelefone(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

function validarTelefone(telefone) {
    const regex = /^\(\d{2}\) \d{5}-\d{4}$/;
    return regex.test(telefone);
}

// ===============================================================
// Seleção de Elementos e Event Listeners de UI (Mantidos)
// ===============================================================

const cpfInput = document.getElementById('cpf');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp'); // Adicionado
const cpfErro = document.getElementById('cpf-error');
const emailErro = document.getElementById('email-error');
const whatsappErro = document.getElementById('whatsapp-error'); // Adicionado

cpfInput.addEventListener('input', function () {
    this.value = aplicarMascaraCPF(this.value);
});

cpfInput.addEventListener('blur', function () {
    const valor = this.value.trim();
    const valido = validarCPF(valor);
    cpfErro.style.display = (valor && !valido) ? 'block' : 'none';
});

emailInput.addEventListener('blur', function () {
    const valor = this.value.trim();
    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    emailErro.style.display = (valor && !valido) ? 'block' : 'none';
});

whatsappInput.addEventListener('input', function () { // Adicionado
    this.value = aplicarMascaraTelefone(this.value);
});

whatsappInput.addEventListener('blur', function () { // Adicionado
    const valor = this.value.trim();
    whatsappErro.style.display = (valor && !validarTelefone(valor)) ? 'block' : 'none';
});

// ===============================================================
// Navegação entre Etapas (Mantida)
// ===============================================================

function goToStep(step) {
    document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
    document.getElementById(`step-${step}`).style.display = 'block';
}

// ===============================================================
// Validação da Etapa 1 e Botão Próximo (Mantida)
// ===============================================================

function validarCamposEtapa1() {
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf');
    const emailInput = document.getElementById('email');
    const whatsappInput = document.getElementById('whatsapp');

    const nomeValido = nomeInput.value.trim() !== "";
    const cpfValido = validarCPF(cpfInput.value);
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    const telefoneValido = validarTelefone(whatsappInput.value);

    document.getElementById('nome-error').style.display = nomeValido ? 'none' : 'block';
    document.getElementById('cpf-error').style.display = cpfValido ? 'none' : 'block';
    document.getElementById('email-error').style.display = emailValido ? 'none' : 'block';
    document.getElementById('whatsapp-error').style.display = telefoneValido ? 'none' : 'block';

    if (nomeValido && cpfValido && emailValido && telefoneValido) {
        goToStep(2);
    } else {
        alert("Por favor, preencha todos os campos obrigatórios corretamente na Etapa 1.");
    }
}

// ===============================================================
// Embaralhamento das Perguntas (Mantida)
// ===============================================================

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('perguntas-container');
    if (container) { // Garante que o container existe
        const perguntas = Array.from(container.children);

        // Embaralha usando Fisher-Yates
        for (let i = perguntas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [perguntas[i], perguntas[j]] = [perguntas[j], perguntas[i]];
        }

        // Reanexa na nova ordem
        perguntas.forEach(p => container.appendChild(p));
    }
});

// ===============================================================
// NOVO: Gerenciamento da Submissão do Formulário com Fetch
// ===============================================================

document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault(); // <-- MUITO IMPORTANTE: Impede o envio padrão do formulário

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Re-validar a Etapa 1 antes de tentar enviar (para garantir que nada foi alterado)
    const nomeInput = document.getElementById('nome');
    const cpfInput = document.getElementById('cpf');
    const emailInput = document.getElementById('email');
    const whatsappInput = document.getElementById('whatsapp');

    const nomeValido = nomeInput.value.trim() !== "";
    const cpfValido = validarCPF(cpfInput.value);
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    const telefoneValido = validarTelefone(whatsappInput.value);

    if (!nomeValido || !cpfValido || !emailValido || !telefoneValido) {
        alert("Por favor, preencha todos os campos obrigatórios da primeira etapa.");
        goToStep(1); // Volta para a primeira etapa para correção
        return; // Impede o envio
    }

    // Validar se todas as perguntas de rádio foram respondidas na Etapa 2
    const perguntasContainer = document.getElementById('perguntas-container');
    let todasPerguntasRespondidas = true;
    const nomesDasPerguntas = new Set(); // Armazena os nomes dos grupos de rádio (ex: "Ao se deparar...")

    // Coleta todos os nomes das perguntas (do atributo 'name' dos rádios)
    perguntasContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
        nomesDasPerguntas.add(radio.name);
    });

    // Para cada nome de pergunta, verifica se pelo menos um rádio foi selecionado
    nomesDasPerguntas.forEach(perguntaNome => {
        const radiosDaPergunta = perguntasContainer.querySelectorAll(`input[name="${perguntaNome}"]:checked`);
        if (radiosDaPergunta.length === 0) {
            todasPerguntasRespondidas = false;
            // Opcional: Você pode adicionar feedback visual aqui, por exemplo,
            // rolar para a pergunta não respondida ou destacar.
            // console.log(`Pergunta não respondida: ${perguntaNome}`);
        }
    });

    if (!todasPerguntasRespondidas) {
        alert("Por favor, responda a todas as perguntas do questionário na segunda etapa.");
        goToStep(2); // Volta para a segunda etapa para correção
        return; // Impede o envio
    }

    // Se todas as validações passarem, prepara os dados e envia
    const formData = new FormData(form); // Coleta todos os dados do formulário

    // Desabilita o botão de envio e muda o texto
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Enviando...";
        submitButton.style.opacity = "0.6";
        submitButton.style.cursor = "not-allowed";
    }

    // Realiza a requisição Fetch para o Google Apps Script
    fetch(form.action, {
        method: 'POST',
        body: formData // Envia os dados do formulário
    })
    .then(response => {
        // Verifica se a resposta HTTP foi bem-sucedida (status 2xx)
        if (!response.ok) {
            // Se não for sucesso, lê a mensagem de erro e a lança
            return response.text().then(text => {
                throw new Error("Erro no servidor: " + text);
            });
        }
        return response.text(); // Lê a resposta do Apps Script como texto
    })
    .then(data => {
        // Esta parte será executada se o envio for bem-sucedido
        console.log("Resposta do Apps Script:", data); // Verifique esta mensagem no console do navegador

        // Exibe uma mensagem de sucesso e redireciona
        alert("Formulário enviado com sucesso! Redirecionando...");
        window.location.href = "https://renatodouek.com.br/mentorias/onboarding/sucesso.html"; // Redireciona para sua página de sucesso
    })
    .catch(error => {
        // Esta parte será executada se houver um erro (de rede ou do Apps Script)
        console.error("Erro ao enviar formulário:", error); // Verifique esta mensagem no console do navegador
        alert("Ocorreu um erro ao enviar o formulário. Por favor, tente novamente. Detalhe: " + error.message);

        // Reabilita o botão de envio em caso de erro
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = "Enviar respostas";
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "pointer";
        }
    });
});
