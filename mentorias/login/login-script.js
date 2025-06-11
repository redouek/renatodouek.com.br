// Arquivo: login-script.js

// Função de máscara de CPF (copiada do form-script.js, se você a tiver no login)
function aplicarMascaraCPF(valor) {
    return valor
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// ===============================================================
// Event Listeners de UI
// ===============================================================

const cpfInput = document.getElementById('cpf');
const senhaInput = document.getElementById('senha');
const togglePasswordButton = document.getElementById('toggle-password');
const mensagemDiv = document.getElementById('mensagem');
const loginForm = document.getElementById('loginForm');

// Máscara de CPF
cpfInput.addEventListener('input', function () {
    this.value = aplicarMascaraCPF(this.value);
});

// Funcionalidade de mostrar/ocultar senha
togglePasswordButton.addEventListener('click', function() {
  const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
  senhaInput.setAttribute('type', type);

  const iconSpan = this.querySelector('.mdi');
  if (type === 'password') {
    iconSpan.classList.remove('mdi-eye-off-outline');
    iconSpan.classList.add('mdi-eye-outline');
    this.innerHTML = '<span class="mdi mdi-eye-outline"></span> Mostrar senha';
  } else {
    iconSpan.classList.remove('mdi-eye-outline');
    iconSpan.classList.add('mdi-eye-off-outline');
    this.innerHTML = '<span class="mdi mdi-eye-off-outline"></span> Ocultar senha';
  }
});


// ===============================================================
// Gerenciamento da Submissão do Formulário com Fetch
// ===============================================================

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  // Limpa mensagens anteriores e esconde a div
  mensagemDiv.textContent = '';
  mensagemDiv.classList.remove('success-message', 'error-message', 'message-visible'); // Garante que todas as classes de estado são removidas

  const cpfValue = cpfInput.value.trim();
  const senhaValue = senhaInput.value.trim();

  if (cpfValue === "" || senhaValue === "") {
    mensagemDiv.textContent = "Por favor, preencha o CPF e a senha.";
    mensagemDiv.classList.add('error-message', 'message-visible'); // Adiciona a classe de erro E a de visibilidade
    return;
  }

  const formData = new FormData();
  formData.append('action', 'login'); // Adiciona o campo 'action' explicitamente
  formData.append('cpf', cpfValue);
  formData.append('senha', senhaValue);

  const webAppUrl = "https://script.google.com/macros/s/AKfycbxac_E54M7LJJm9M5VgUI1SgSiJJxx_YbI_9SlSukJKn1daKXFvBBNTlCAaV0Nv1Ocu-g/exec"; // A URL do seu Web App

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json(); // Espera uma resposta JSON do Apps Script

    if (result.status === "success") {
      mensagemDiv.textContent = result.message + " Bem-vindo, " + result.user + "!";
      mensagemDiv.classList.add('success-message', 'message-visible'); // Adiciona a classe de sucesso E a de visibilidade
      // Redirecione o usuário ou mostre a área restrita
      // Ex: window.location.href = "/dashboard.html";
      console.log("Login successful:", result);
    } else {
      mensagemDiv.textContent = "Erro: " + result.message;
      mensagemDiv.classList.add('error-message', 'message-visible'); // Adiciona a classe de erro E a de visibilidade
      console.error("Login failed:", result.message);
    }
  } catch (error) {
    mensagemDiv.textContent = "Ocorreu um erro na comunicação com o servidor.";
    mensagemDiv.classList.add('error-message', 'message-visible'); // Adiciona a classe de erro E a de visibilidade
    console.error("Erro ao enviar requisição de login:", error);
  }
});
