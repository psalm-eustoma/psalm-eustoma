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
  menu.style.setProperty('--mega-cols', cats.length);

  const navEl = document.querySelector('nav');
  let closeTimer, megaDelayTimer;
  const openMega = () => {
    if (!navEl?.classList.contains('nav-light')) return; // only in white nav state
    clearTimeout(closeTimer);
    clearTimeout(megaDelayTimer);
    megaDelayTimer = setTimeout(() => {
      menu.classList.add('is-open');
      dim.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }, 300);
  };
  const closeMega = () => {
    clearTimeout(megaDelayTimer);
    closeTimer = setTimeout(() => {
      menu.classList.remove('is-open');
      dim.classList.remove('is-open');
      document.body.style.overflow = '';
    }, 250);
  };
  const navLinksEl = document.querySelector('.nav-links');
  // SERVICES → open mega
  servicesNavLinks.forEach(l => l.addEventListener('mouseenter', openMega));
  // Other nav links → close mega
  const allLinks = [...(navLinksEl?.querySelectorAll('a') || [])];
  allLinks.filter(a => !servicesNavLinks.includes(a))
    .forEach(a => a.addEventListener('mouseenter', () => {
      clearTimeout(megaDelayTimer);
      menu.classList.remove('is-open');
      dim.classList.remove('is-open');
    }));
  navLinksEl?.addEventListener('mouseleave', closeMega);
  // Keep open while inside mega menu
  menu.addEventListener('mouseenter', () => { clearTimeout(closeTimer); clearTimeout(megaDelayTimer); menu.classList.add('is-open'); dim.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
  menu.addEventListener('mouseleave', closeMega);
  dim.addEventListener('click', () => {
    clearTimeout(closeTimer);
    clearTimeout(megaDelayTimer);
    menu.classList.remove('is-open');
    dim.classList.remove('is-open');
    document.body.style.overflow = '';
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
  window.__refreshSafeBottom && window.__refreshSafeBottom();
  window.__refreshSafeTop && window.__refreshSafeTop();
}

function closeMenu(skipUnlock = false) {
  hamburger.classList.remove('is-open');
  mobileMenu.classList.remove('is-open');
  if (!skipUnlock) unlockScroll();
  window.__refreshSafeBottom && window.__refreshSafeBottom();
  window.__refreshSafeTop && window.__refreshSafeTop();
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

// Scroll-triggered white nav
(function () {
  const nav  = document.querySelector('nav');
  if (!nav || nav.classList.contains('nav-light')) return;
  const indexHero = document.querySelector('.hero-left');
  const innerHero = document.querySelector('.services-hero, .about-hero');
  if (indexHero) {
    // Index: wait until full hero scrolls off
    const update = () => nav.classList.toggle('nav-light', indexHero.closest('#banner, section, .hero-wrap, body')?.getBoundingClientRect().bottom <= 0 || indexHero.getBoundingClientRect().bottom <= 0);
    window.addEventListener('scroll', update, { passive: true });
    update();
  } else if (innerHero) {
    // Services / About: turn white immediately on any scroll
    const update = () => nav.classList.toggle('nav-light', window.scrollY > 10);
    window.addEventListener('scroll', update, { passive: true });
    update();
  }
})();

// Bottom safe-area filler colour: follow whatever content sits at the very
// bottom edge of the screen, so the home-indicator strip matches it
// (black at the footer / menu, white over white content). See body::after.
(function () {
  const root = document.body;
  const pick = () => {
    const x = Math.floor(window.innerWidth / 2);
    const y = window.innerHeight - 1; // just inside the bottom edge
    let el = document.elementFromPoint(x, y);
    let color = '';
    for (let hops = 0; el && hops < 8; hops++, el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') { color = bg; break; }
    }
    if (!color) color = getComputedStyle(root).backgroundColor;
    root.style.setProperty('--safe-bottom-color', color);
  };
  // pick() does elementFromPoint + getComputedStyle (forced reflow), so run it
  // only after scrolling settles — never per scroll frame (was causing jank).
  let dbTimer;
  const onScrollSettle = () => { clearTimeout(dbTimer); dbTimer = setTimeout(pick, 90); };
  window.__refreshSafeBottom = pick; // immediate (menu open/close)
  window.addEventListener('scroll', onScrollSettle, { passive: true });
  window.addEventListener('resize', onScrollSettle);
  window.addEventListener('load', pick);
  if (window.dataReady && typeof window.dataReady.then === 'function') window.dataReady.then(pick);
  pick();
})();

// Top safe-area filler colour: white only in the light-nav state with the
// menu closed; black otherwise (hero / menu) — so the status bar matches
// the header. See body::before. (iOS only; env=0 elsewhere → no effect.)
(function () {
  const nav = document.querySelector('nav');
  const menu = document.getElementById('mobileMenu');
  const update = () => {
    const navLight = nav && nav.classList.contains('nav-light');
    const menuOpen = menu && menu.classList.contains('is-open');
    document.body.style.setProperty('--safe-top-color', (navLight && !menuOpen) ? '#ffffff' : '#000000');
  };
  window.__refreshSafeTop = update;
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  if (window.dataReady && typeof window.dataReady.then === 'function') window.dataReady.then(update);
  update();
})();

// (Mobile media strips use native horizontal scroll — see .media-cards CSS.)
