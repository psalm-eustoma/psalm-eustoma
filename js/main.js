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

// Footer reveal: observe element BEFORE footer as sentinel (footer is clip-path 0 so won't trigger directly)
const observeFooter = () => {
  document.querySelectorAll('footer').forEach(footer => {
    const sentinel = footer.previousElementSibling;
    if (!sentinel) {
      footer.classList.add('is-revealed');
      return;
    }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        footer.classList.add('is-revealed');
        obs.unobserve(sentinel);
      }
    }, { rootMargin: '0px 0px -30% 0px' });
    obs.observe(sentinel);
  });
};

if (window.dataReady && typeof window.dataReady.then === 'function') {
  window.dataReady.then(() => { observeFadeEls(); observeFooter(); });
} else {
  observeFadeEls();
  observeFooter();
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
