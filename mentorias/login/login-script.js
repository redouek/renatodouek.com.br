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

// Arquivo: login-script.js

// ... (todo o seu código existente, funções de máscara, event listeners de UI) ...

// Seleção de elementos adicionais necessários para o botão de login
const botaoLogin = document.getElementById('botaoLogin'); // Certifique-se de que seu HTML tem id="botaoLogin" para o botão de submit

// ===============================================================
// Gerenciamento da Submissão do Formulário com Fetch
// ===============================================================

loginForm.addEventListener('submit', async function(event) {
  event.preventDefault(); // Impede o envio padrão do formulário

  // Limpa mensagens anteriores e esconde a div
  mensagemDiv.textContent = '';
  mensagemDiv.classList.remove('success-message', 'error-message', 'message-visible');

  // Desabilita o botão e muda o texto
  if (botaoLogin) {
    botaoLogin.disabled = true;
    botaoLogin.textContent = "Validando dados...";
    botaoLogin.style.opacity = "0.6";
    botaoLogin.style.cursor = "not-allowed";
  }

  const cpfValue = cpfInput.value.trim();
  const senhaValue = senhaInput.value.trim();

  if (cpfValue === "" || senhaValue === "") {
    mensagemDiv.textContent = "Por favor, preencha o CPF e a senha.";
    mensagemDiv.classList.add('error-message', 'message-visible');
    // Restaura o botão em caso de erro na validação do cliente
    if (botaoLogin) {
      botaoLogin.disabled = false;
      botaoLogin.textContent = "Entrar";
      botaoLogin.style.opacity = "1";
      botaoLogin.style.cursor = "pointer";
    }
    return;
  }

  const formData = new FormData();
  formData.append('action', 'login');
  formData.append('cpf', cpfValue);
  formData.append('senha', senhaValue);

  const webAppUrl = "https://script.google.com/macros/s/AKfycbxac_E54M7LJJm9M5VgUI1SgSiJJxx_YbI_9SlSukJKn1daKXFvBBNTlCAaV0Nv1Ocu-g/exec"; // A URL do seu Web App

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === "success") {
      // NÃO HÁ MENSAGEM DE SUCESSO AQUI, APENAS REDIRECIONA
      console.log("Login successful, redirecting to dashboard:", result);

      const userData = {
        cpf: cpfValue.replace(/\D/g, ''),
        nome: result.user
      };
      localStorage.setItem('usuarioLogado', JSON.stringify(userData));

      // Redirecionar imediatamente sem setTimeout
      window.location.href = "https://renatodouek.com.br/mentorias/dashboard/";
      
    } else {
      mensagemDiv.textContent = "Erro: " + result.message;
      mensagemDiv.classList.add('error-message', 'message-visible');
      console.error("Login failed:", result.message);

      // Restaura o botão em caso de erro do servidor
      if (botaoLogin) {
        botaoLogin.disabled = false;
        botaoLogin.textContent = "Entrar";
        botaoLogin.style.opacity = "1";
        botaoLogin.style.cursor = "pointer";
      }
    }
  } catch (error) {
    mensagemDiv.textContent = "Ocorreu um erro na comunicação com o servidor.";
    mensagemDiv.classList.add('error-message', 'message-visible');
    console.error("Erro ao enviar requisição de login:", error);

    // Restaura o botão em caso de erro de rede/comunicação
    if (botaoLogin) {
      botaoLogin.disabled = false;
      botaoLogin.textContent = "Entrar";
      botaoLogin.style.opacity = "1";
      botaoLogin.style.cursor = "pointer";
    }
  }
});
