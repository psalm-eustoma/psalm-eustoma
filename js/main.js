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
  let ticking = false;
  const pick = () => {
    ticking = false;
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
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } };
  window.__refreshSafeBottom = onScroll; // called on menu open/close
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // re-pick after late/async layout (cms render, menu open/close)
  window.addEventListener('load', onScroll);
  if (window.dataReady && typeof window.dataReady.then === 'function') window.dataReady.then(onScroll);
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

// Mobile media strips (PHOTOGRAPHY / VIDEO·SOCIAL): axis-lock touch so a
// vertical swipe scrolls the page (the strip never drifts horizontally and
// there's no nested-scroller hand-off stutter) and a horizontal swipe scrolls
// the strip via scrollLeft. CSS sets these strips to touch-action: pan-y.
// Snaps to the nearest card when a horizontal drag ends.
(function () {
  if (!('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return;
  const strips = document.querySelectorAll('.media-cards');
  if (!strips.length) return;
  strips.forEach(strip => {
    let sx = 0, sy = 0, sScroll = 0, axis = null, active = false;
    strip.addEventListener('touchstart', e => {
      if (strip.scrollWidth <= strip.clientWidth + 2) { active = false; return; } // not a scroller (desktop grid)
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; sScroll = strip.scrollLeft; axis = null; active = true;
    }, { passive: true });
    strip.addEventListener('touchmove', e => {
      if (!active) return;
      const t = e.touches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (axis === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        // 偏向直向：要橫向明顯大於直向（1.5x）才當橫滑捲圖片，否則交給頁面直向捲動
        axis = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'x' : 'y';
      }
      if (axis === 'x') strip.scrollLeft = sScroll - dx; // horizontal → JS-driven; vertical → leave to the page
    }, { passive: true });
    const release = () => {
      if (axis === 'x') {
        const card = strip.querySelector('.media-card');
        if (card) {
          const step = card.getBoundingClientRect().width + 16; // card width + gap
          strip.scrollTo({ left: Math.round(strip.scrollLeft / step) * step, behavior: 'smooth' });
        }
      }
      active = false; axis = null;
    };
    strip.addEventListener('touchend', release, { passive: true });
    strip.addEventListener('touchcancel', release, { passive: true });
  });
})();

// Pause autoplay carousel videos while the page is scrolling — iOS stutters
// when it has to re-composite a playing <video> every frame during a scroll.
// Resume shortly after scrolling stops. (You don't notice the pause while
// scrolling past it; the stutter goes away.)
(function () {
  const getVids = () => document.querySelectorAll('.media-cards video');
  let t, scrolling = false;
  window.addEventListener('scroll', () => {
    if (!scrolling) {
      scrolling = true;
      getVids().forEach(v => { if (!v.paused) { v.dataset.wasPlaying = '1'; v.pause(); } });
    }
    clearTimeout(t);
    t = setTimeout(() => {
      scrolling = false;
      getVids().forEach(v => { if (v.dataset.wasPlaying) { delete v.dataset.wasPlaying; v.play().catch(() => {}); } });
    }, 250);
  }, { passive: true });
})();
