// ===============================================================
// Funções de Validação e Máscara
// ===============================================================

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

function aplicarMascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

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
// Seleção de Elementos e Event Listeners de UI
// ===============================================================

const cpfInput = document.getElementById('cpf');
const emailInput = document.getElementById('email');
const whatsappInput = document.getElementById('whatsapp'); 
const cpfErro = document.getElementById('cpf-error');
const emailErro = document.getElementById('email-error');
const whatsappErro = document.getElementById('whatsapp-error'); 
const nomeInput = document.getElementById('nome'); 

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

whatsappInput.addEventListener('input', function () {
    this.value = aplicarMascaraTelefone(this.value);
});

whatsappInput.addEventListener('blur', function () {
    const valor = this.value.trim();
    whatsappErro.style.display = (valor && !validarTelefone(valor)) ? 'block' : 'none';
});

// ===============================================================
// Navegação entre Etapas
// ===============================================================

function goToStep(step) {
    document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
    document.getElementById(`step-${step}`).style.display = 'block';
}

// ===============================================================
// Validação da Etapa 1 e Botão Próximo
// ===============================================================

function validarCamposEtapa1() {
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
// Embaralhamento das Perguntas
// ===============================================================

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('perguntas-container');
    if (container) { 
        const perguntas = Array.from(container.children);

        for (let i = perguntas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [perguntas[i], perguntas[j]] = [perguntas[j], perguntas[i]];
        }

        perguntas.forEach(p => container.appendChild(p));
    }
});

// ===============================================================
// Gerenciamento da Submissão do Formulário com Fetch
// ===============================================================

document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault(); // IMPEDE o envio padrão do formulário, faremos via JavaScript

    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // --- REPETIÇÃO DA VALIDAÇÃO (mantida por segurança) ---
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
        goToStep(1);
        return;
    }

    const perguntasContainer = document.getElementById('perguntas-container');
    let todasPerguntasRespondidas = true;
    const nomesDasPerguntas = new Set();

    perguntasContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
        nomesDasPerguntas.add(radio.name);
    });

    nomesDasPerguntas.forEach(perguntaName => {
        const radiosDaPergunta = perguntasContainer.querySelectorAll(`input[name="${perguntaName}"]:checked`);
        if (radiosDaPergunta.length === 0) {
            todasPerguntasRespondidas = false;
        }
    });

    if (!todasPerguntasRespondidas) {
        alert("Por favor, responda a todas as perguntas do questionário na segunda etapa.");
        goToStep(2);
        return;
    }
    // --- FIM DA VALIDAÇÃO ---

    const formData = new FormData(form);

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Enviando...";
        submitButton.style.opacity = "0.6";
        submitButton.style.cursor = "not-allowed";
    }

    // *** PONTO CRÍTICO DE AJUSTE ***
    // Garanta que a URL do Web App é a string correta
    const webAppUrl = "https://script.google.com/macros/s/AKfycbxac_E54M7LJJm9M5VgUI1SgSiJJxx_YbI_9SlSukJKn1daKXFvBBNTlCAaV0Nv1Ocu-g/exec"; // Cole a URL exata aqui!

    try {
        const response = await fetch(webAppUrl, { // USE webAppUrl AQUI
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro no servidor (Status: ${response.status}): ${errorText}`);
        }

        const data = await response.text();

        console.log("Resposta do Apps Script:", data);

        window.location.href = "https://renatodouek.com.br/mentorias/onboarding/sucesso.html";

    } catch (error) {
        console.error("Erro ao enviar formulário:", error);
        alert("Ocorreu um erro ao enviar o formulário. Por favor, tente novamente. Detalhe: " + error.message);

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText = "Enviar respostas";
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "pointer";
        }
    }
});
