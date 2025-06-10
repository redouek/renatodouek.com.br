# Site de Mentorias – Renato Douek

Este repositório contém os arquivos do site `renatodouek.com.br/mentorias`, estruturado para suportar o fluxo completo de onboarding, login, dashboard e administração dos mentorados da plataforma.

---

## 📁 Estrutura de Pastas

```
assets/
└── imagens/
    ├── rd_pb_logo.png
    └── whatsapp.png

mentorias/
├── dashboard/
│   ├── index.html           # Dashboard principal
│   ├── script.js            # Lógica de exibição por perfil
│   ├── style.css            # Estilos principais
│   ├── admin.html           # Conteúdo exclusivo para admins
│   └── admin.js             # JS auxiliar para lógica administrativa
├── login/
│   ├── index.html           # Tela de login
│   ├── login-script.js      # Lógica de validação e autenticação
│   └── login-style.css      # Estilo do formulário de login
└── onboarding/
    ├── index.html           # Formulário principal (perfil)
    ├── sucesso.html         # Página de sucesso
    ├── form-script.js       # Lógica de validação e envio
    └── form-style.css       # Estilo do formulário

index.html                   # Landing page inicial (opcional)
```

---

## 🔐 Fluxo de Acesso

1. Usuários não autenticados que acessam `/dashboard/` são redirecionados para `/login/`.
2. Após o login:
   - Perfis `Mentorado` veem menu padrão com seções como Visão Geral, Sessões, Anotações, etc.
   - Perfis `Admin` e `Colaborador` acessam menus adicionais (e.g. "Candidatos").
3. As permissões são controladas via `localStorage.usuarioLogado.perfil`.

---

## 🔍 Recursos em uso

- `Google Apps Script`: Processamento do formulário e controle de autenticação.
- `Google Sheets`: Base de dados dos candidatos e mentorados.
- `icons8.com`: Ícones de interface.
- `Dropbox` e `Google Drive`: Possibilidades futuras para armazenar fotos de perfil.
- `Cloudflare Pages + GitHub`: Publicação do site (suporte a `index.html` por pasta).

---

## 🚧 TODOs

- Implementar aba "Candidatos" dentro da dashboard com filtros e botões de ação.
- Configurar o upload de fotos no `profile-pic`.
- Refatorar os scripts `script.js`, `admin.js` e `login-script.js` para maior reutilização.

---

## 🤝 Contribuições

Este projeto é mantido por Renato Douek com estrutura e automações feitas sob medida. Para colaborações ou dúvidas, entrar em contato diretamente.