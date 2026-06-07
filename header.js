const isMobile = () => window.innerWidth <= 768;

const menuTrigger = document.getElementById('menuTrigger');
const megaMenu    = document.getElementById('megaMenu');
const drawer      = document.getElementById('drawer');
const drawerClose = document.getElementById('drawerClose');
const backdrop    = document.getElementById('backdrop');
const searchTrig  = document.getElementById('searchTrigger');
const searchBar   = document.getElementById('searchBar');
const megaClose   = document.getElementById('megaClose');

function closeAll() {
  megaMenu.classList.remove('is-open');
  drawer.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  menuTrigger.classList.remove('is-active');
  document.body.classList.remove('mega-open');
  document.body.style.overflow = '';
  closeAllAccountDropdowns();
}

menuTrigger.addEventListener('click', () => {
  if (isMobile()) {
    const open = drawer.classList.toggle('is-open');
    backdrop.classList.toggle('is-open', open);
    menuTrigger.classList.toggle('is-active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  } else {
    const open = megaMenu.classList.toggle('is-open');
    menuTrigger.classList.toggle('is-active', open);
    document.body.classList.toggle('mega-open', open);
  }
});

drawerClose.addEventListener('click', closeAll);
backdrop.addEventListener('click', closeAll);
megaClose.addEventListener('click', closeAll);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAll();
  }
});

// Account dropdown — suporta múltiplas instâncias (header + mega-menu)
// Cada .account-wrapper tem seu próprio trigger (.icon-btn) e dropdown internos
const accountWrappers = Array.from(document.querySelectorAll('.account-wrapper'));

function closeAllAccountDropdowns() {
  accountWrappers.forEach(wrapper => {
    if (wrapper.classList.contains('is-open')) {
      wrapper.classList.remove('is-open');
      const trig = wrapper.querySelector('.icon-btn');
      if (trig) trig.setAttribute('aria-expanded', 'false');
    }
  });
}

accountWrappers.forEach(wrapper => {
  const trig = wrapper.querySelector('.icon-btn');
  if (!trig) return;
  trig.addEventListener('click', (e) => {
    // Desktop: hover gerencia o estado; click é inerte pra evitar conflito (toggle fechando o que o hover acabou de abrir)
    if (window.innerWidth > 768) return;
    e.stopPropagation();
    const wasOpen = wrapper.classList.contains('is-open');
    closeAllAccountDropdowns();   // fecha qualquer outro aberto antes de abrir esse
    if (!wasOpen) {
      wrapper.classList.add('is-open');
      trig.setAttribute('aria-expanded', 'true');
    }
  });

  // Hover desktop: abre ao entrar no wrapper, fecha ao sair (anti-flicker via pseudo ::after)
  wrapper.addEventListener('mouseenter', () => {
    if (window.innerWidth <= 768) return;
    if (wrapper.classList.contains('is-open')) return;   // já aberto, nada a fazer
    closeAllAccountDropdowns();                          // garante apenas um aberto por vez
    wrapper.classList.add('is-open');
    trig.setAttribute('aria-expanded', 'true');
  });
  wrapper.addEventListener('mouseleave', () => {
    if (window.innerWidth <= 768) return;
    wrapper.classList.remove('is-open');
    trig.setAttribute('aria-expanded', 'false');
  });
});

// Clique fora fecha qualquer dropdown aberto
document.addEventListener('click', (e) => {
  const isInsideAnyWrapper = accountWrappers.some(w => w.contains(e.target));
  if (!isInsideAnyWrapper) closeAllAccountDropdowns();
});

// Tooltip do + Unique — primeiro acesso (auto, com X) + hover (sempre)
const uniqueTooltip = document.getElementById('uniqueTooltip');
if (uniqueTooltip) {
  const tooltipClose = uniqueTooltip.querySelector('.menu-trigger-tooltip__close');
  const triggerWrap = uniqueTooltip.closest('.menu-trigger-wrap');
  const STORAGE_KEY = 'uniqueTooltipFirstVisitShown';
  const isDesktop = () => window.innerWidth > 768;
  let pinTimeout = null;

  function dismissPinned() {
    uniqueTooltip.classList.remove('is-pinned');
    if (pinTimeout) { clearTimeout(pinTimeout); pinTimeout = null; }
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* localStorage indisponível */ }
  }

  // Mostrar automaticamente no primeiro acesso (apenas desktop)
  if (isDesktop()) {
    let alreadyShown = false;
    try { alreadyShown = !!localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!alreadyShown) {
      // pequeno delay pra evitar pop imediato no carregamento
      setTimeout(() => {
        uniqueTooltip.classList.add('is-pinned');
        pinTimeout = setTimeout(dismissPinned, 15000);
      }, 600);
    }
  }

  // X fecha o modo first-visit e marca como já visto
  if (tooltipClose) {
    tooltipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissPinned();
    });
  }

  // Hover ativa a tooltip sempre (mesmo após primeiro acesso)
  if (triggerWrap) {
    triggerWrap.addEventListener('mouseenter', () => {
      if (isDesktop()) uniqueTooltip.classList.add('is-hover');
    });
    triggerWrap.addEventListener('mouseleave', () => {
      uniqueTooltip.classList.remove('is-hover');
    });
  }
}

// Header compacto ao rolar — só promo-bar e action-bar saem, main-header fica compacto sticky
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const SCROLL_THRESHOLD = 80;   // px — passa de quase toda a promo-bar antes de ativar
  let scrollRAF = null;
  function syncScrolledState() {
    const shouldBe = window.scrollY > SCROLL_THRESHOLD;
    const isOn = siteHeader.classList.contains('is-scrolled');
    if (shouldBe !== isOn) {
      siteHeader.classList.toggle('is-scrolled', shouldBe);
      document.body.classList.toggle('is-header-stuck', shouldBe);
    }
  }
  window.addEventListener('scroll', () => {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(() => {
      syncScrolledState();
      scrollRAF = null;
    });
  }, { passive: true });
  syncScrolledState();   // estado inicial (cobre o caso de page reload com scroll preservado)
}

// Search toggle
searchTrig.addEventListener('click', () => {
  const open = searchBar.classList.toggle('is-open');
  if (open) setTimeout(() => searchBar.querySelector('input').focus(), 350);
});

// Drawer accordions (excluindo links externos e o trigger do Unique)
document.querySelectorAll('.drawer-cat:not(.drawer-cat--link):not(.drawer-cat--unique) .drawer-cat__header').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.classList.toggle('is-open');
  });
});

// Drawer: item "+ Unique" — fecha o drawer e abre o overlay full-screen do mega-menu
const drawerUniqueTrigger = document.getElementById('drawerUniqueTrigger');
if (drawerUniqueTrigger) {
  drawerUniqueTrigger.addEventListener('click', () => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    menuTrigger.classList.remove('is-active');
    megaMenu.classList.add('is-open');
    document.body.classList.add('mega-open');
  });
}

// Reset state ao mudar tamanho da janela.
// IMPORTANTE: só reagimos quando a LARGURA muda (rotação de tela ou
// redimensionamento real no desktop). No mobile, rolar a página esconde/mostra
// a barra de URL do navegador, o que dispara 'resize' alterando só a ALTURA —
// se chamássemos closeAll() aí, o mega-menu fecharia sozinho ao rolar. Por isso
// ignoramos mudanças que afetam apenas a altura.
let lastViewportWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastViewportWidth) {
    lastViewportWidth = window.innerWidth;
    closeAll();
  }
});

// Nav dropdowns: hover funciona via CSS no desktop. No mobile, clicar no link
// abre/fecha accordion (e impede a navegação no primeiro clique).
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  const link = item.querySelector('.nav-link');
  link.addEventListener('click', (e) => {
    if (isMobile()) {
      e.preventDefault();
      const wasOpen = item.classList.contains('is-open');
      navItems.forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    }
  });
});

// Fechar nav-items abertos ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-item')) {
    navItems.forEach(i => i.classList.remove('is-open'));
  }
});
/* Carrosséis (promo-bar e action-rotativo) — função genérica reusável */
function initCarousel(barId, prevId, nextId, slideSelector) {
  const slides = document.querySelectorAll(slideSelector);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  const bar = document.getElementById(barId);
  if (!slides.length || !prev || !next || !bar) return;

  let current = 0;
  let timer = null;
  const INTERVAL = 4500;

  function show(idx) {
    slides[current].classList.remove('is-active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('is-active');
  }

  function start() {
    stop();
    timer = setInterval(() => show(current + 1), INTERVAL);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  prev.addEventListener('click', () => { show(current - 1); start(); });
  next.addEventListener('click', () => { show(current + 1); start(); });
  bar.addEventListener('mouseenter', stop);
  bar.addEventListener('mouseleave', start);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    start();
  }
}
initCarousel('promoBar', 'promoPrev', 'promoNext', '.promo-bar__slide');
initCarousel('actionRotativo', 'actionPrev', 'actionNext', '.action-rotativo__slide');

/* Integracao CheckoutWC + WooCommerce fragments
   1. Click no icone do carrinho abre a Side Cart do CheckoutWC.
   2. O contador atualiza via wc_fragment_refresh (fragment do snippet PHP).
   3. Esconde o badge quando count = 0. */
(function() {
  const cartLink = document.querySelector('.uc-cart-link');
  if (cartLink) {
    cartLink.addEventListener('click', function(e) {
      if (window.jQuery && window.jQuery.fn) {
        e.preventDefault();
        window.jQuery(document.body).trigger('cfw_open_side_cart');
      }
    });
  }

  function syncCartBadge() {
    const badge = document.querySelector('.uc-cart-count');
    if (!badge) return;
    const n = parseInt(badge.textContent.trim(), 10) || 0;
    badge.style.display = n > 0 ? '' : 'none';
  }
  syncCartBadge();

  if (window.jQuery) {
    window.jQuery(document.body).on(
      'wc_fragments_refreshed wc_fragments_loaded added_to_cart removed_from_cart',
      syncCartBadge
    );
  }
})();
