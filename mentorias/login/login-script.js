// Arquivo: login-script.js (Coleta de DebugInfo)

// Função de máscara de CPF
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

const botaoLogin = document.getElementById('botaoLogin'); 

// ===============================================================
// Gerenciamento da Submissão do Formulário com Fetch
// ===============================================================

loginForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    mensagemDiv.textContent = '';
    mensagemDiv.classList.remove('success-message', 'error-message', 'message-visible');

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
        if (botaoLogin) {
            botaoLogin.disabled = false;
            botaoLogin.textContent = "Entrar";
            botaoLogin.style.opacity = "1";
            botaoLogin.style.cursor = "pointer";
        }
        return;
    }

    const formData = new FormData();
    formData.append('action', 'login'); // Ação que estamos enviando
    formData.append('cpf', cpfValue);
    formData.append('senha', senhaValue);

    // MUDANÇA: Atualize este URL para o do seu NOVO Web App
    const webAppUrl = "https://script.google.com/macros/s/AKfycbwxweNQUDALWE7Ai7-u73WbUFKsjtH-RlqQQJGGYcBo372PClCIN3MMrNzDcoogfCpq/exec"; 

    try {
        const response = await fetch(webAppUrl, {
            method: 'POST',
            body: formData
        });

        const responseText = await response.text();
        console.log("Resposta bruta do servidor (Main.gs):", responseText);

        const result = JSON.parse(responseText); // Tenta parsear o texto como JSON

        if (result.status === "success") {
            console.log("Login successful, redirecting to dashboard:", result);

            const userData = {
                cpf: cpfValue.replace(/\D/g, ''),
                nome: result.user
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(userData));

            window.location.href = "https://renatodouek.com.br/mentorias/dashboard/";
            
        } else {
            mensagemDiv.textContent = "Erro: " + result.message;
            mensagemDiv.classList.add('error-message', 'message-visible');
            console.error("Login failed (resultado completo do servidor):", result);
            // MUDANÇA: Se a resposta de erro incluir debugInfo, logue-o separadamente
            if (result.debugInfo) {
                console.warn("Informações de depuração do servidor:", result.debugInfo);
            }

            if (botaoLogin) {
                botaoLogin.disabled = false;
                botaoLogin.textContent = "Entrar";
                botaoLogin.style.opacity = "1";
                botaoLogin.style.cursor = "pointer";
            }
        }
    } catch (error) {
        mensagemDiv.textContent = "Ocorreu um erro na comunicação com o servidor ou na interpretação da resposta.";
        mensagemDiv.classList.add('error-message', 'message-visible');
        console.error("Erro ao enviar requisição de login ou parsear resposta:", error);

        if (botaoLogin) {
            botaoLogin.disabled = false;
            botaoLogin.textContent = "Entrar";
            botaoLogin.style.opacity = "1";
            botaoLogin.style.cursor = "pointer";
        }
    }
});
