document.addEventListener("DOMContentLoaded", () => {
  // Recupera o usuário do localStorage
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  // Exibe pagina de acesso restrito se não estiver autenticado
if (!usuario) {
document.body.innerHTML = `
  <div style="min-height: 100vh; background-color: #333333; display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;">
    <div style="background-color: #1a1a1a; padding: 3rem 2rem; border-radius: 12px; max-width: 600px; width: 90%; text-align: center; box-shadow: 0 0 16px rgba(0,0,0,0.6);">
      <img src="https://renatodouek.com.br/assets/imagens/rd_pb_logo.png" alt="Logo Renato Douek" style="width: 140px; margin-bottom: 2rem;" />
      <h1 style="color: #FFCE00; font-size: 1.8rem; margin-bottom: 1rem;">Acesso restrito!</h1>
      <h2 style="color: #FFFFFF; font-size: 1rem; line-height: 1.4; margin-bottom: 2.5rem;">
        Página de acesso exclusivo para mentorados do Renato Douek.
      </h2>
      <div style="display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
        <a href="https://renatodouek.com.br" style="flex: 1; text-align: center; padding: 0.75rem 1.5rem; border-radius: 32px; border: 2px solid #FFCE00; color: #FFCE00; text-decoration: none; font-weight: 500; transition: 0.3s;">
          Ainda não sou mentorado
        </a>
        <a href="/mentorias/login/" style="flex: 1; text-align: center; padding: 0.75rem 1.5rem; border-radius: 32px; background-color: #FFCE00; color: #000; text-decoration: none; font-weight: 500; transition: 0.3s;">
          Login
        </a>
      </div>
    </div>
  </div>
`;

    return;
  }

  // Preenche o nome do usuário
  const nomeEl = document.getElementById("userName");
  if (nomeEl) nomeEl.textContent = usuario.nome || "Mentorado";

  // Gera iniciais do nome para o avatar
  const avatarEl = document.getElementById("profileAvatar");
  if (avatarEl && usuario.nome) {
    const partes = usuario.nome.trim().split(" ");
    const iniciais = partes.length >= 2
      ? partes[0][0] + partes[partes.length - 1][0]
      : partes[0][0];
    avatarEl.textContent = iniciais.toUpperCase();
  }

  // Lógica de logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      window.location.href = "/mentorias/login/";
    });
  }

  // ======== MENU LATERAL COM HOVER DESLIZANTE =========

  const menu = document.querySelector(".sidebar-menu");
  const buttons = document.querySelectorAll(".icon-btn");

  // Cria a caixa animada amarela
  const hoverBox = document.createElement("div");
  hoverBox.classList.add("hover-box");
  menu.appendChild(hoverBox);

  // Função que move a hoverBox até o botão clicado
  const moveHoverBox = (button) => {
    const topPos = button.offsetTop;
    hoverBox.style.top = `${topPos}px`;
  };

  // Inicia na posição do botão com a classe "active"
  const initialBtn = document.querySelector(".icon-btn.active") || buttons[0];
  moveHoverBox(initialBtn);

  // A cada clique em um botão, move a hoverBox
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove classe active de todos
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Move a animação para o novo botão
      moveHoverBox(btn);

      // Exibe a seção correspondente (caso aplicável)
      const section = btn.dataset.section;
      const sections = document.querySelectorAll(".content-section");
      sections.forEach((s) => {
        s.style.display = s.id === `section-${section}` ? "block" : "none";
      });
    });
  });
});
