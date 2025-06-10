
// Validação de CPF, Aplicação Máscará CPF e Validação de email //
function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g,'');
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
// Aplicação de mascara no CPF
function aplicarMascaraCPF(valor) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

const cpfInput = document.getElementById('cpf');
const emailInput = document.getElementById('email');
const cpfErro = document.getElementById('cpf-error');
const emailErro = document.getElementById('email-error');

cpfInput.addEventListener('input', function () {
  this.value = aplicarMascaraCPF(this.value);
});

// Mostra o erro se sair dos campos CPF e EMAIL sem preencher corretamente
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


document.querySelector('form').addEventListener('submit', function (e) {
  const cpfValido = validarCPF(cpfInput.value);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);


  if (!cpfValido || !emailValido) {
    if (!cpfValido) cpfErro.style.display = 'block';
    if (!emailValido) emailErro.style.display = 'block';
    e.preventDefault();
  }
});
// Validação Whatsapp //
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

const telefoneInput = document.getElementById('whatsapp');
const telefoneErro = document.getElementById('whatsapp-error');

telefoneInput.addEventListener('input', function () {
  this.value = aplicarMascaraTelefone(this.value);
});

telefoneInput.addEventListener('blur', function () {
  const valor = this.value.trim();
  telefoneErro.style.display = (valor && !validarTelefone(valor)) ? 'block' : 'none';
});
// Botao proximo inativo até ter os campos preenchidos//
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
  }
}
// Embaralhamento das perguntas a cada loading //
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('perguntas-container');
    const perguntas = Array.from(container.children);

    // Embaralha usando Fisher-Yates
    for (let i = perguntas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perguntas[i], perguntas[j]] = [perguntas[j], perguntas[i]];
    }

    // Reanexa na nova ordem
    perguntas.forEach(p => container.appendChild(p));
  });

// Botão de próximo e de envio //
  function goToStep(step) {
    document.querySelectorAll('.form-step').forEach(el => el.style.display = 'none');
    document.getElementById(`step-${step}`).style.display = 'block';
  }

  function enviarSucesso() {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerText = "Enviando...";
      submitButton.style.opacity = "0.6";
      submitButton.style.cursor = "not-allowed";
    }

    // Este timeout é para dar um tempo para o formulário ser enviado antes de redirecionar.
    // O envio real acontece via POST para o Apps Script.
    setTimeout(() => {
      window.location.href = "https://renatodouek.com.br/mentorias/onboarding/sucesso.html";
    }, 1500); // Aumentei um pouco o tempo para garantir que o script receba.

    // Retorne true para permitir o envio do formulário.
    return true;
  }



