    const senhaInput = document.getElementById("senha");
    const toggleBtn = document.getElementById("toggle-password");
    const icon = toggleBtn.querySelector("span");

    toggleBtn.addEventListener("click", function () {
      const isHidden = senhaInput.type === "password";
      senhaInput.type = isHidden ? "text" : "password";
      icon.className = isHidden ? "mdi mdi-eye-off-outline" : "mdi mdi-eye-outline";
      toggleBtn.innerHTML = `<span class="${icon.className}"></span> ${isHidden ? "Ocultar senha" : "Mostrar senha"}`;
    });
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
      return resto === parseInt(cpf.charAt(10));
    }

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
      event.preventDefault();

      const cpf = document.getElementById("cpf").value.trim();
      const senha = document.getElementById("senha").value.trim();
      const erro = document.getElementById("mensagem");
      const botao = document.getElementById("botaoLogin");

      erro.style.display = "none";

      if (!validarCPF(cpf)) {
        erro.textContent = "CPF inválido. Verifique o número digitado.";
        erro.style.display = "block";
        return;
      }

      botao.disabled = true;
      botao.innerText = "Verificando...";

      try {
        const formData = new URLSearchParams();
        formData.append("acao", "login");
        formData.append("cpf", cpf);
        formData.append("senha", senha);

        const response = await fetch("https://script.google.com/macros/s/AKfycbxac_E54M7LJJm9M5VgUI1SgSiJJxx_YbI_9SlSukJKn1daKXFvBBNTlCAaV0Nv1Ocu-g/exec", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData
        });

        const data = await response.json();

        if (data.status === "ok") {
          localStorage.setItem("usuarioLogado", JSON.stringify(data));
          window.location.href = "/mentorias/dashboard/";
        } else {
          erro.textContent = data.mensagem || "Senha incorreta.";
          erro.style.display = "block";
        }
      } catch (err) {
        erro.textContent = "Erro ao verificar login. Tente novamente.";
        erro.style.display = "block";
        console.error(err);
      } finally {
        botao.disabled = false;
        botao.innerText = "Entrar";
      }
    });
