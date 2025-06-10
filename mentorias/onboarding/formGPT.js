function enviarSucesso() {
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerText = "Enviando...";
    submitButton.style.opacity = "0.6";
    submitButton.style.cursor = "not-allowed";
  }

  // Dá tempo de processar antes de redirecionar
  setTimeout(() => {
    window.location.href = "https://renatodouek.com.br/mentorias/sucesso/";
  }, 1500);

  return true;
}
