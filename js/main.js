// Skip nav fade-in when navigating between projects
if (sessionStorage.getItem('skipNavFade')) {
  sessionStorage.removeItem('skipNavFade');
  const nav = document.querySelector('nav');
  if (nav) nav.classList.add('visible');
}

// Scroll-triggered entrance animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

const observeFadeEls = () =>
  document.querySelectorAll('.fade-up, .fade-down, .text-appear').forEach(el => observer.observe(el));

// Mega menu: SERVICES hover → category grid
function initMegaMenu() {
  const links = document.querySelectorAll('a[href="services.html"]');
  const servicesNavLinks = [...links].filter(a => a.closest('.nav-links'));
  if (!servicesNavLinks.length) return;
  if (typeof getCmsData !== 'function') return;
  const cats = (getCmsData().categories || []).slice().sort((a, b) => a.order - b.order);
  if (!cats.length) return;

  const dim = document.createElement('div');
  dim.className = 'page-dim';
  document.body.appendChild(dim);

  const menu = document.createElement('div');
  menu.className = 'mega-menu';
  menu.innerHTML = `<div class="mega-menu-grid">${cats.map(cat => {
    const imgUrl = typeof cmsImgFit === 'function' ? cmsImgFit(cat.image, 500) : cat.image;
    const bg = imgUrl ? `style="background-image:url('${imgUrl}')"` : '';
    return `<a class="mega-menu-item" href="services.html?cat=${cat.id}">
      <div class="mega-menu-item-img" ${bg}></div>
      <div class="mega-menu-item-label">${getL10n(cat.name)}</div>
    </a>`;
  }).join('')}</div>`;
  document.body.appendChild(menu);

  const navEl = document.querySelector('nav');
  let closeTimer;
  const open = (withMega) => {
    clearTimeout(closeTimer);
    navEl?.classList.add('is-mega-open');
    if (withMega) {
      menu.classList.add('is-open');
      dim.classList.add('is-open');
    }
  };
  const close = () => {
    closeTimer = setTimeout(() => {
      navEl?.classList.remove('is-mega-open');
      menu.classList.remove('is-open');
      dim.classList.remove('is-open');
    }, 250);
  };
  // Hover the nav-links cluster (SERVICES / ABOUT / CONTACT / EN) → white bg
  const navLinksEl = document.querySelector('.nav-links');
  navLinksEl?.addEventListener('mouseenter', () => open(false));
  navLinksEl?.addEventListener('mouseleave', close);
  // SERVICES specifically → also open mega menu
  servicesNavLinks.forEach(l => l.addEventListener('mouseenter', () => open(true)));
  // Keep open while inside mega menu
  menu.addEventListener('mouseenter', () => open(true));
  menu.addEventListener('mouseleave', close);
  dim.addEventListener('click', () => {
    clearTimeout(closeTimer);
    navEl?.classList.remove('is-mega-open');
    menu.classList.remove('is-open');
    dim.classList.remove('is-open');
  });
}

if (window.dataReady && typeof window.dataReady.then === 'function') {
  window.dataReady.then(() => { observeFadeEls(); initMegaMenu(); });
} else {
  observeFadeEls();
  initMegaMenu();
}

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openMenu() {
  hamburger.classList.add('is-open');
  mobileMenu.classList.add('is-open');
  lockScroll();
}

function closeMenu(skipUnlock = false) {
  hamburger.classList.remove('is-open');
  mobileMenu.classList.remove('is-open');
  if (!skipUnlock) unlockScroll();
}

hamburger.addEventListener('click', () => {
  mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
});

document.getElementById('mobileMenuClose')?.addEventListener('click', () => closeMenu());

// Language modal
const langOverlay = document.getElementById('langOverlay');
let _scrollY = 0;

function lockScroll() {
  _scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${_scrollY}px`;
  document.body.style.width = '100%';
}

function unlockScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, _scrollY);
  html.style.scrollBehavior = prev;
}

function openLang() {
  closeMenu(true);
  lockScroll();
  langOverlay.classList.add('is-open');
}

function closeLang() {
  langOverlay.classList.remove('is-open');
  unlockScroll();
}

document.getElementById('langBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  openLang();
});

document.getElementById('langBtnMobile')?.addEventListener('click', (e) => {
  e.preventDefault();
  openLang();
});

langOverlay.addEventListener('click', (e) => {
  if (e.target === langOverlay) closeLang();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLang();
});

// Language switching
(function () {
  const langCodes  = ['en', 'fr', 'zh'];
  const langLabels = { en: 'EN', fr: 'FR', zh: '中文' };
  const active     = getActiveLang();

  // Show current lang on nav button
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = langLabels[active] || 'EN';

  // Mark active option + wire click
  document.querySelectorAll('.lang-option').forEach((btn, i) => {
    if (langCodes[i] === active) btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      setActiveLang(langCodes[i]);
      location.reload();
    });
  });
})();

// Protect images: disable right-click and drag
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('img, video, .project-photo, .services-card-photo')) {
    e.preventDefault();
  }
});
document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
    e.preventDefault();
  }
});

// Scroll-triggered white nav (index / services / about pages)
(function () {
  const nav  = document.querySelector('nav');
  const hero = document.querySelector('.hero-left, .services-hero, .about-hero');
  if (!nav || !hero || nav.classList.contains('nav-light')) return;
  const update = () => nav.classList.toggle('nav-light', hero.getBoundingClientRect().bottom <= 0);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
