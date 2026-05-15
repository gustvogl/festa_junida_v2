const FESTA_USER_KEY = 'festaJuninaUser';

const toastContainerId = 'festa-toast-container';
const responses = [
  'Santo Antônio sorriu e vai dar certo, mas mantenha a fogueira sob controle!',
  'Os anjos do céu já dançam quadrilha por você. Vá com fé!',
  'A sorte vai vir com um docinho na mão. Cuidado com o vento da noite.',
  'O destino diz: prepare-se, que hoje tem surpresa boa no arraial.',
  'O coração diz sim, mas não esqueça de ser gentil com quem te ajuda.',
  'A lua ilumina seu caminho; encontre alguém especial na barraca do beijo.'
];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(FESTA_USER_KEY));
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(FESTA_USER_KEY, JSON.stringify(user));
}

function updateTokens(delta) {
  const user = getUser();
  if (!user) {
    return null;
  }
  user.tokens = Math.max(0, (user.tokens || 0) + delta);
  saveUser(user);
  return user.tokens;
}

function toast(message, variant = 'primary', duration = 2600) {
  let container = document.getElementById(toastContainerId);
  if (!container) {
    container = document.createElement('div');
    container.id = toastContainerId;
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    container.style.alignItems = 'center';
    document.body.appendChild(container);
  }

  const item = document.createElement('div');
  item.textContent = message;
  item.style.maxWidth = 'min(90vw, 380px)';
  item.style.padding = '0.9rem 1rem';
  item.style.borderRadius = '16px';
  item.style.color = '#fff';
  item.style.fontFamily = 'sans-serif';
  item.style.fontWeight = '600';
  item.style.boxShadow = '0 12px 30px rgba(0,0,0,.18)';
  item.style.opacity = '0';
  item.style.transform = 'translateY(12px)';
  item.style.transition = 'transform 180ms ease, opacity 180ms ease';
  item.style.backgroundColor = variant === 'danger' ? '#ba1a1a' : variant === 'success' ? '#007f99' : '#7d5800';
  container.appendChild(item);

  requestAnimationFrame(() => {
    item.style.opacity = '1';
    item.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(12px)';
    setTimeout(() => item.remove(), 180);
  }, duration);
}

function redirect(path) {
  window.location.href = path;
}

function initRegistration() {
  const form = document.querySelector('main form');
  if (!form) return;

  const nicknameInput = document.getElementById('nickname');
  const realNameInput = document.getElementById('realName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const button = form.querySelector('button[type="button"]');

  if (!nicknameInput || !realNameInput || !emailInput || !passwordInput || !button) {
    return;
  }

  button.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    const realName = realNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const avatarInput = document.querySelector('input[name="avatar"]:checked');
    const avatar = avatarInput ? avatarInput.value : '1';

    if (!nickname || !realName || !email || !password) {
      toast('Preencha todos os campos para entrar na festança!', 'danger');
      return;
    }

    const user = {
      nickname,
      realName,
      email,
      password,
      avatar,
      tokens: 50,
      level: 'Caipira iniciante'
    };
    saveUser(user);
    toast('Cadastro concluído! Bem-vindo(a) ao Arraiá Digital.', 'success');
    setTimeout(() => redirect('HTML/inicio.html'), 900);
  });
}

function initLogin() {
  const form = document.querySelector('main form');
  if (!form) return;
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const user = getUser();

    if (!user) {
      toast('Não há cadastro salvo. Cadastre-se na página inicial.', 'danger');
      return;
    }

    const validLogin = username && password && (username.toLowerCase() === user.nickname.toLowerCase() || username.toLowerCase() === user.email.toLowerCase()) && password === user.password;
    if (!validLogin) {
      toast('Apelido/e-mail ou senha incorretos. Tente novamente.', 'danger');
      return;
    }

    toast('Login feito com sucesso! Entrando no Arraiá...', 'success');
    setTimeout(() => redirect('inicio.html'), 700);
  });
}

function updateUserDisplay() {
  const user = getUser();
  if (!user) return;

  const nameLabel = document.getElementById('user-name');
  if (nameLabel) {
    nameLabel.textContent = user.nickname;
  }

  const tokensLabel = document.getElementById('user-fichas');
  if (tokensLabel) {
    tokensLabel.textContent = `${user.tokens} Fichas Acumuladas`;
  }

  const levelLabel = document.getElementById('user-level');
  if (levelLabel) {
    levelLabel.textContent = `Nível: ${user.level}`;
  }

  const mobileBadge = document.getElementById('token-badge');
  if (mobileBadge) {
    mobileBadge.textContent = user.tokens;
  }
}

function initCorreio() {
  const recipient = document.getElementById('recipient');
  const message = document.getElementById('message');
  const sendButton = document.querySelector('main form button[type="button"]');
  const noteList = document.getElementById('message-list');
  const countButton = document.getElementById('note-count-button');

  if (!recipient || !message || !sendButton || !noteList) return;

  function updateNoteCount(delta = 1) {
    if (!countButton) return;
    const current = parseInt(countButton.textContent.match(/\d+/)?.[0] || '0', 10);
    countButton.textContent = `Ver Todos (${current + delta})`;
  }

  sendButton.addEventListener('click', () => {
    const to = recipient.value.trim();
    const text = message.value.trim();
    const style = document.querySelector('input[name="message_style"]:checked')?.value || 'direct';
    if (!to || !text) {
      toast('Escreva um destinatário e uma mensagem antes de enviar.', 'danger');
      return;
    }

    const sender = getUser();
    const from = style === 'anonymous' ? 'Anônimo' : sender ? `De: ${sender.nickname}` : 'De: Um caipira simpático';
    const messageText = style === 'mimo' ? `${text} (veio com um mimo doce!)` : text;

    const card = document.createElement('div');
    card.className = 'bg-surface border-2 border-outline-variant p-3 transform -rotate-2 shadow-sm hover:rotate-0 transition-transform cursor-pointer';
    card.innerHTML = `<p class="font-body-md text-on-surface line-clamp-2">"${messageText}"</p><span class="text-xs text-primary font-bold mt-2 block">${from}</span>`;
    noteList.prepend(card);

    recipient.value = '';
    message.value = '';
    toast('Seu recadinho foi enviado para o quadrilhão!', 'success');
    updateNoteCount();
  });
}

function initComida() {
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const payNowButton = document.getElementById('pay-now');

  const cards = Array.from(document.querySelectorAll('main article'));
  let cart = [];

  function refreshCart() {
    if (!cartCount || !cartTotal) return;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartCount.textContent = String(cart.length);
    cartTotal.innerHTML = `${total}`;
    const tokenIcon = document.createElement('span');
    tokenIcon.className = 'material-symbols-outlined text-sm ml-1';
    tokenIcon.textContent = 'token';
    cartTotal.appendChild(tokenIcon);
  }

  cards.forEach((card) => {
    const button = card.querySelector('button');
    const priceBadge = card.querySelector('.absolute.top-2.right-2');
    if (!button || !priceBadge) return;
    const priceText = priceBadge.textContent.replace(/[^0-9]/g, '');
    const price = parseInt(priceText, 10) || 0;

    button.addEventListener('click', () => {
      const currentUser = getUser();
      if (currentUser && currentUser.tokens < price) {
        toast('Você não tem fichas suficientes para comprar esse item.', 'danger');
        return;
      }
      cart.push({ price, title: card.querySelector('h3')?.textContent?.trim() || 'Item' });
      toast(`Adicionado ao carrinho: ${card.querySelector('h3')?.textContent?.trim() || 'item'}.`, 'success');
      refreshCart();
    });
  });

  if (payNowButton) {
    payNowButton.addEventListener('click', () => {
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      if (total === 0) {
        toast('Seu carrinho ainda está vazio.', 'danger');
        return;
      }
      const currentUser = getUser();
      if (!currentUser) {
        toast('Faça login para pagar e usar suas fichas.', 'danger');
        return;
      }
      if (currentUser.tokens < total) {
        toast('Você ainda não tem fichas suficientes para pagar esse pedido.', 'danger');
        return;
      }
      updateTokens(-total);
      cart = [];
      refreshCart();
      updateUserDisplay();
      toast('Pedido confirmado! Boas comidas no Arraiá.', 'success');
    });
  }

  refreshCart();
}

function parseCostFromText(text) {
  const number = text.match(/(\d+)/);
  return number ? parseInt(number[0], 10) : 0;
}

function initJogos() {
  const buttons = Array.from(document.querySelectorAll('main button'));
  buttons.forEach((button) => {
    const text = button.textContent.toLowerCase();
    if (!text.includes('jogar') && !text.includes('tentar a sorte')) {
      return;
    }
    button.addEventListener('click', () => {
      const currentUser = getUser();
      const cost = parseCostFromText(text) || parseCostFromText(button.parentElement?.querySelector('p')?.textContent || '0');
      if (currentUser && currentUser.tokens < cost) {
        toast('Você precisa de mais fichas para jogar aqui.', 'danger');
        return;
      }
      const win = Math.random() > 0.45;
      const change = win ? Math.max(2, cost * 2) - cost : -cost;
      if (currentUser) {
        updateTokens(change);
      }
      const result = win ? `Você ganhou ${Math.max(2, cost * 2)} fichas!` : 'Que pena! Não ganhou dessa vez.';
      toast(`Jogo realizado. ${result}`, win ? 'success' : 'danger');
      updateUserDisplay();
    });
  });
}

function initVidente() {
  const questionInput = document.getElementById('pergunta');
  const ballButton = Array.from(document.querySelectorAll('main button')).find((btn) => btn.textContent.toLowerCase().includes('revelar') || btn.textContent.toLowerCase().includes('consultar'));
  const responseCard = document.querySelector('main > div.mt-12') || document.querySelector('.mt-12');
  const responseText = responseCard ? responseCard.querySelector('p.font-headline-lg') : null;

  if (!questionInput || !ballButton || !responseText) return;

  const answer = () => {
    const question = questionInput.value.trim();
    if (!question) {
      toast('Pergunte algo antes de consultar a vidente.', 'danger');
      return;
    }
    const index = Math.floor(Math.random() * responses.length);
    responseText.textContent = `"${responses[index]}"`;
    toast('A vidente leu suas energias.', 'success');
  };

  ballButton.addEventListener('click', answer);
}

function initPrisao() {
  const input = document.querySelector('main input[type="text"]');
  const buttons = Array.from(document.querySelectorAll('main button'));
  if (!input || buttons.length === 0) return;

  buttons.forEach((button) => {
    const text = button.textContent.toLowerCase();
    if (text.includes('pagar fiança')) {
      button.addEventListener('click', () => {
        const user = getUser();
        if (!user) {
          toast('Faça login para pagar a fiança.', 'danger');
          return;
        }
        if (user.tokens < 1) {
          toast('Você precisa de pelo menos 1 ficha para pagar a fiança.', 'danger');
          return;
        }
        updateTokens(-1);
        updateUserDisplay();
        toast('Fiança paga! Agora você está livre do xadrez.', 'success');
      });
    }
    if (text.includes('responder quiz')) {
      button.addEventListener('click', () => {
        const answer = input.value.trim().toLowerCase();
        if (!answer) {
          toast('Responda a pergunta do quiz antes de tentar a sorte.', 'danger');
          return;
        }
        const success = ['quadrilha', 'fogos', 'fogueira', 'são joão'].some((item) => answer.includes(item));
        if (success) {
          if (getUser()) {
            updateTokens(2);
            updateUserDisplay();
          }
          toast('Acertou! Sua fiança foi reduzida e ganhou 2 fichas.', 'success');
          return;
        }
        toast('Errado! A polícia do Arraiá ficou de olho em você.', 'danger');
      });
    }
  });
}

function initShows() {
  const stageFrame = document.querySelector('.aspect-video, .group.relative');
  if (stageFrame) {
    stageFrame.addEventListener('click', () => {
      toast('Assistindo ao show virtual! Aproveite a música do Arraiá.', 'success');
    });
  }
  const notifyButtons = Array.from(document.querySelectorAll('button')).filter((button) => button.textContent.toLowerCase().includes('notifications') || button.textContent.toLowerCase().includes('notificação'));
  notifyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      toast('Notificação de show ativada!', 'success');
    });
  });
}

function createHamburgerMenu() {
  if (document.getElementById('festa-hamburger-menu')) return;

  const menuOverlay = document.createElement('div');
  menuOverlay.id = 'festa-hamburger-menu';
  menuOverlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);';
  menuOverlay.innerHTML = `
    <div id="festa-hamburger-backdrop" style="position:absolute;inset:0;cursor:pointer;"></div>
    <div style="position:relative;width:min(92vw,340px);max-width:340px;height:100%;background:#fff;color:#28180b;padding:1.5rem 1.5rem 2rem;overflow-y:auto;box-shadow:12px 0 32px rgba(0,0,0,0.3);">
      <button id="festa-hamburger-close" aria-label="Fechar menu" style="position:absolute;top:1rem;right:1rem;border:none;background:transparent;color:#28180b;font-size:1.6rem;font-weight:700;cursor:pointer;">×</button>
      <h2 style="margin:0 0 1rem;font-size:1.25rem;font-weight:700;">Menu do Arraiá</h2>
      <nav style="display:flex;flex-direction:column;gap:1rem;font-size:1rem;line-height:1.5;">
        <a href="inicio.html" style="color:#28180b;text-decoration:none;font-weight:700;">Início</a>
        <a href="perfil.html" style="color:#28180b;text-decoration:none;font-weight:700;">Meu Perfil</a>
        <a href="comida.html" style="color:#28180b;text-decoration:none;font-weight:700;">Comida</a>
        <a href="correio.html" style="color:#28180b;text-decoration:none;font-weight:700;">Correio</a>
        <a href="jogos.html" style="color:#28180b;text-decoration:none;font-weight:700;">Barracas</a>
        <a href="shows.html" style="color:#28180b;text-decoration:none;font-weight:700;">Shows</a>
        <a href="vidente.html" style="color:#28180b;text-decoration:none;font-weight:700;">Vidente</a>
        <a href="prisao.html" style="color:#28180b;text-decoration:none;font-weight:700;">Prisão</a>
      </nav>
    </div>
  `;

  document.body.appendChild(menuOverlay);

  const closeMenu = () => {
    const menu = document.getElementById('festa-hamburger-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  };

  menuOverlay.querySelector('#festa-hamburger-backdrop')?.addEventListener('click', closeMenu);
  menuOverlay.querySelector('#festa-hamburger-close')?.addEventListener('click', closeMenu);
  menuOverlay.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });
}

function openHamburgerMenu() {
  const menu = document.getElementById('festa-hamburger-menu');
  if (!menu) {
    createHamburgerMenu();
  }
  const overlay = document.getElementById('festa-hamburger-menu');
  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function initHamburgerMenu() {
  createHamburgerMenu();
  const buttons = Array.from(document.querySelectorAll('button[aria-label="Menu"]'));
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openHamburgerMenu();
    });
  });
}

function initPageNavigation() {
  const navButtons = Array.from(document.querySelectorAll('nav button'));
  navButtons.forEach((button) => {
    const text = button.textContent.toLowerCase();
    if (text.includes('início')) {
      button.addEventListener('click', () => redirect('inicio.html'));
    }
    if (text.includes('barracas')) {
      button.addEventListener('click', () => redirect('jogos.html'));
    }
    if (text.includes('correio')) {
      button.addEventListener('click', () => redirect('correio.html'));
    }
    if (text.includes('perfil')) {
      button.addEventListener('click', () => redirect('login.html'));
    }
  });
}

function initCommon() {
  createHamburgerMenu();
  updateUserDisplay();
  initPageNavigation();
  initHamburgerMenu();
}

function initPerfil() {
  const user = getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  document.getElementById('profile-name').textContent = user.name || 'Não informado';
  document.getElementById('profile-email').textContent = user.email || 'Não informado';
  document.getElementById('profile-tokens').textContent = user.tokens || 0;

  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      // Para edição simples, tornar os campos editáveis
      const nameEl = document.getElementById('profile-name');
      const emailEl = document.getElementById('profile-email');
      if (nameEl.contentEditable !== 'true') {
        nameEl.contentEditable = 'true';
        emailEl.contentEditable = 'true';
        editBtn.textContent = 'Salvar';
        nameEl.focus();
      } else {
        // Salvar
        user.name = nameEl.textContent.trim();
        user.email = emailEl.textContent.trim();
        saveUser(user);
        nameEl.contentEditable = 'false';
        emailEl.contentEditable = 'false';
        editBtn.textContent = 'Editar Perfil';
        toast('Perfil atualizado!', 'success');
      }
    });
  }
}

function initCurrentPage() {
  const path = window.location.pathname.split('/').pop();
  initCommon();
  if (path === 'index.html' || path === '') {
    initRegistration();
  }
  if (path === 'login.html') {
    initLogin();
  }
  if (path === 'inicio.html') {
    updateUserDisplay();
  }
  if (path === 'correio.html') {
    initCorreio();
  }
  if (path === 'comida.html') {
    initComida();
  }
  if (path === 'jogos.html') {
    initJogos();
  }
  if (path === 'vidente.html') {
    initVidente();
  }
  if (path === 'prisao.html') {
    initPrisao();
  }
  if (path === 'shows.html') {
    initShows();
  }
  if (path === 'perfil.html') {
    initPerfil();
  }
}

document.addEventListener('DOMContentLoaded', initCurrentPage);
