// ── CMS data reader (frontend, read-only) ────────────────
// Reads from the same localStorage key as the admin panel.

const CMS_KEY = 'psalm_cms';

const CMS_DEFAULT = {
  home: {
    banner: {
      videoUrl: 'videos/hero-banner.mp4',
      heroImageUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp',
      tagline: { en: 'Where light moves gently, and moments take form with quiet emotion.', fr: '', zh: '' }
    },
    quote: {
      eyebrow: { en: 'Light begins in silence.', fr: '', zh: '' },
      main:    { en: 'In quiet spaces, light takes shape and guides emotion— letting moments form gently and memories linger softly.', fr: '', zh: '' },
      note:    { en: 'Every image is a balance of presence and intention.', fr: '', zh: '' }
    },
    photography: {
      description: { en: 'Observing the quiet rhythm of the city, the work captures passing light, reflections, and the calm pulse of everyday Paris.', fr: '', zh: '' },
      cards: [
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp', label: { en: 'WEDDING', fr: '', zh: '' } },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_d3ba133f-b234-4ce8-8e4a-a7a9b9a561aa_middle.webp', label: { en: 'WEDDING', fr: '', zh: '' } },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1799_v-fms_webp_faede2bf-42ca-4266-b027-02931fe9a013_middle.webp', label: { en: 'WEDDING', fr: '', zh: '' } }
      ]
    },
    videoSocial: {
      description: { en: 'Honest and unposed, each wedding is seen as it unfolds — gestures, laughter, and emotions preserved with quiet sincerity.', fr: '', zh: '' },
      cards: [
        { mediaUrl: 'videos/carousel-1.mp4', label: { en: 'WEDDING', fr: '', zh: '' }, isVideo: true },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_217d8cd1-8269-481c-bf3e-6e547bba37b5_middle.webp', label: { en: 'WEDDING', fr: '', zh: '' }, isVideo: false },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp', label: { en: 'WEDDING', fr: '', zh: '' }, isVideo: false }
      ]
    },
    cta: {
      image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x960_c02696d8-2b6b-420f-84f2-b3b8090eb757.webp'
    }
  },
  categories: [
    { id: 'cat-a', name: { en: 'Paris Lifestyle & Travel', fr: '', zh: '' }, order: 1, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_217d8cd1-8269-481c-bf3e-6e547bba37b5_small.webp' },
    { id: 'cat-b', name: { en: 'Commercial', fr: '', zh: '' },              order: 2, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_34de9d2a-9324-472c-aa33-96cfd2eacd2f.webp' },
    { id: 'cat-c', name: { en: 'Wedding & Elopement', fr: '', zh: '' },     order: 3, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp' },
    { id: 'cat-d', name: { en: 'Travel Stories', fr: '', zh: '' },          order: 4, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1799_v-fms_webp_faede2bf-42ca-4266-b027-02931fe9a013_small.webp' }
  ],
  about: {
    heroImage: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_cf117adb-99b3-4521-8765-a697b35f4a13.webp',
    eyebrow:         { en: 'French photographer based in Paris.', fr: '', zh: '' },
    headline:        { en: 'Psalm Eustoma focuses on guided portraits and poetic documentation — blending design sensibility with sincerity.', fr: '', zh: '' },
    portrait: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1080x1080_fcb36d04-8e5f-4165-9938-7a59f2c4c5bf.webp',
    invitationQuote: { en: 'Every collaboration begins with quiet trust and mutual curiosity. The stories we create are shaped by light, patience, and sincerity.', fr: '', zh: '' },
    invitationNote:  { en: 'Every story begins with trust.', fr: '', zh: '' },
    ctaImage: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x960_c2457df0-009a-402f-86e7-5046e65ff44f.webp'
  }
};

// ── Language ──────────────────────────────────────────────
function getActiveLang() {
  return localStorage.getItem('psalm_lang') || 'en';
}

function setActiveLang(lang) {
  localStorage.setItem('psalm_lang', lang);
}

// Set <html lang="..."> ASAP so CSS can swap fonts before render
try { document.documentElement.lang = getActiveLang(); } catch {}

function getL10n(field) {
  if (!field || typeof field !== 'object') return field || '';
  const lang = getActiveLang();
  return field[lang] || field.en || '';
}

// ── Responsive images (Cloudinary transformations) ───────
// Inject w_<width> after /upload/. Falls through unchanged for non-Cloudinary URLs.
function cmsImgFit(url, width) {
  if (!url || !url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return url || '';
  return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
}
function cmsImgSrcset(url, widths) {
  if (!url || !url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return '';
  return widths.map(w => `${cmsImgFit(url, w)} ${w}w`).join(', ');
}
// Right-size Cloudinary video delivery: cap width at 1080 (c_limit = shrink
// only, never upscale) + q_auto. So a 4K upload is delivered at ~1080p, cutting
// delivery bandwidth ~3–4× without the owner needing to do anything. Keeps the
// original container (an .mp4 stays h264 → hardware-decoded on iOS, no webm).
// Non-Cloudinary URLs (e.g. the template demo clips) pass through unchanged.
function cmsVidFit(url) {
  if (!url || !url.includes('res.cloudinary.com/') || !url.includes('/video/upload/')) return url || '';
  return url.replace('/video/upload/', '/video/upload/q_auto,w_1080,c_limit/');
}
// The template ships two heavy demo clips (a 4K hero webm and a 4K carousel
// mp4) whose URLs are still stored in Firestore. They software-decode / are
// huge on mobile. Until the owner replaces them from the admin, redirect those
// specific assets to bundled, self-hosted 1080p mp4s (hardware-decoded, free
// on Cloudflare). Any other URL — including the owner's own uploads — is left
// untouched.
function cmsVideoSrc(url) {
  if (!url) return '';
  if (/s-2160x3840_4aa2118e[^/]*\.webm/i.test(url)) return 'videos/hero-banner.mp4';
  if (/s-2160x3840_d7ac7592[^/]*\.mp4/i.test(url))  return 'videos/carousel-1.mp4';
  return cmsVidFit(url);
}

// ── Data access ───────────────────────────────────────────
// Cache, filled once from Firestore on page load. All synchronous getters read from here.
let _cmsCache = null;

function _normalizeCms(stored) {
  Object.keys(CMS_DEFAULT).forEach(k => {
    if (!(k in stored)) stored[k] = CMS_DEFAULT[k];
  });
  if (stored.categories) {
    stored.categories = stored.categories.map(cat => {
      if (cat.image !== undefined) return cat;
      const def = CMS_DEFAULT.categories.find(c => c.id === cat.id);
      return def && def.image ? { ...cat, image: def.image } : cat;
    });
  }
  if (stored.home && stored.home.photography && Array.isArray(stored.home.photography.cards)) {
    const defCards = CMS_DEFAULT.home.photography.cards;
    stored.home.photography.cards = stored.home.photography.cards.map((c, i) =>
      c.mediaUrl ? c : { ...c, mediaUrl: defCards[i] ? defCards[i].mediaUrl : '' }
    );
  }
  if (stored.home && stored.home.videoSocial && Array.isArray(stored.home.videoSocial.cards)) {
    const defCards = CMS_DEFAULT.home.videoSocial.cards;
    stored.home.videoSocial.cards = stored.home.videoSocial.cards.map((c, i) =>
      c.mediaUrl ? c : { ...c, ...defCards[i] }
    );
  }
  if (stored.home && stored.home.banner && !stored.home.banner.heroImageUrl) {
    stored.home.banner.heroImageUrl = CMS_DEFAULT.home.banner.heroImageUrl;
  }
  if (!stored.about) stored.about = CMS_DEFAULT.about;
  return stored;
}

async function _loadCmsFromCloud() {
  try {
    const cloud = await window.firebaseLoadData();
    if (cloud) {
      _cmsCache = _normalizeCms(cloud);
      // Mirror to localStorage so a flaky network on next visit still shows something
      try { localStorage.setItem(CMS_KEY, JSON.stringify(_cmsCache)); } catch {}
      return;
    }
  } catch (e) {
    console.warn('[cms] cloud fetch failed, falling back to local cache', e);
  }
  // Cloud unreachable or empty → fall back to localStorage, then defaults
  try {
    const raw = localStorage.getItem(CMS_KEY);
    _cmsCache = raw ? _normalizeCms(JSON.parse(raw)) : CMS_DEFAULT;
  } catch {
    _cmsCache = CMS_DEFAULT;
  }
}

// Synchronously load CMS data from the localStorage cache (no network).
// Returns true if a cache existed, false if we fell back to defaults.
function _loadCmsFromCache() {
  try {
    const raw = localStorage.getItem(CMS_KEY);
    if (raw) { _cmsCache = _normalizeCms(JSON.parse(raw)); return true; }
  } catch {}
  _cmsCache = CMS_DEFAULT;
  return false;
}

// Fetch the latest from cloud and mirror it to localStorage so the *next*
// page load renders fresh. Does not re-render the current page (keeps the
// instant cache render flicker-free); content is at most one navigation stale.
async function _refreshCmsFromCloud() {
  try {
    const cloud = await window.firebaseLoadData();
    if (cloud) {
      _cmsCache = _normalizeCms(cloud);
      try { localStorage.setItem(CMS_KEY, JSON.stringify(_cmsCache)); } catch {}
    }
  } catch (e) {
    console.warn('[cms] cloud refresh failed, keeping cached data', e);
  }
}

function getCmsData() {
  return _cmsCache || CMS_DEFAULT;
}

// ── Render helpers ────────────────────────────────────────
// A home card can link to a project, a category, or any custom URL (set in the
// admin). Returns the href, or '' when the card isn't linked.
function cmsCardHref(card) {
  const t = card && card.linkType, v = card && card.linkValue;
  if (!t || t === 'none' || !v) return '';
  if (t === 'project')  return `project.html?id=${encodeURIComponent(v)}`;
  if (t === 'category') return `services.html?cat=${encodeURIComponent(v)}`;
  if (t === 'url')      return v;
  return '';
}
// Opening tag for a card: an <a> when linked (custom URLs open in a new tab),
// otherwise a plain <div>. `extra` is any extra attributes (e.g. inline style).
function _cardOpen(card, extra) {
  const href = cmsCardHref(card);
  if (!href) return { open: `<div class="media-card"${extra}>`, close: '</div>' };
  const ext = card.linkType === 'url' ? ' target="_blank" rel="noopener"' : '';
  return { open: `<a class="media-card"${extra} href="${href}"${ext}>`, close: '</a>' };
}

function renderImgCards(cards) {
  return cards.map(card => {
    const url = cmsImgFit(card.mediaUrl, 800);
    const bg = url ? ` style="--card-bg:url('${url}')"` : '';
    const { open, close } = _cardOpen(card, bg);
    return `${open}<span class="card-label">${getL10n(card.label) || ''}</span>${close}`;
  }).join('');
}

function renderMixedCards(cards) {
  return cards.map(card => {
    if (card.isVideo && card.mediaUrl) {
      const src = cmsVideoSrc(card.mediaUrl);
      const type = /\.webm(\?|$)/i.test(src) ? 'video/webm' : 'video/mp4';
      const { open, close } = _cardOpen(card, ' style="background:#111;"');
      return `${open}
        <video autoplay muted loop playsinline>
          <source src="${src}" type="${type}">
        </video>
        <span class="card-label">${getL10n(card.label) || ''}</span>
      ${close}`;
    }
    const url = cmsImgFit(card.mediaUrl, 800);
    const bg = url ? ` style="--card-bg:url('${url}')"` : '';
    const { open, close } = _cardOpen(card, bg);
    return `${open}<span class="card-label">${getL10n(card.label) || ''}</span>${close}`;
  }).join('');
}

function renderArchive(cats) {
  const delays = ['', ' delay-1', ' delay-2', ' delay-3'];
  return cats.map((cat, i) => {
    const letter  = String.fromCharCode(97 + i);
    const previewUrl = cmsImgFit(cat.image, 400);
    const preview = previewUrl ? ` style="background-image:url('${previewUrl}')"` : '';
    return `<a class="archive-item fade-up${delays[i] || ''}" href="services.html?cat=${cat.id}">
      <div class="archive-left">
        <span class="archive-letter">${letter}</span>
        <span class="archive-name">${getL10n(cat.name)}</span>
      </div>
      <div class="archive-more"><span>more</span><span>*</span></div>
      <div class="archive-preview"${preview}></div>
    </a>`;
  }).join('');
}

// ── Project helpers ───────────────────────────────────────
function getCmsProject(id) {
  const d = getCmsData();
  return (d.projects || []).find(p => p.id === id) || null;
}

function getCmsAllProjects() {
  const d = getCmsData();
  return (d.projects || []).slice().sort((a, b) => a.order - b.order);
}

function getCmsCategoryName(id) {
  const d = getCmsData();
  const cat = (d.categories || CMS_DEFAULT.categories).find(c => c.id === id);
  return cat ? getL10n(cat.name) : '';
}

function getCmsAbout() {
  const d = getCmsData();
  return d.about || CMS_DEFAULT.about;
}

// ── Init: runs once cloud data is loaded ──
function initCms() {
  const d    = getCmsData();
  const h    = d.home || CMS_DEFAULT.home;
  const cats = (d.categories || CMS_DEFAULT.categories).slice().sort((a, b) => a.order - b.order);

  // Banner — video
  const videoEl = document.querySelector('#banner video');
  if (videoEl && h.banner.videoUrl) {
    const finalUrl = cmsVideoSrc(h.banner.videoUrl);
    const src = videoEl.querySelector('source');
    if (src) {
      src.src = finalUrl;
      src.type = /\.webm(\?|$)/i.test(finalUrl) ? 'video/webm' : 'video/mp4';
      videoEl.load();
    }
  }
  // Banner — hero image
  const heroImg = document.querySelector('.hero-right-image');
  if (heroImg && h.banner.heroImageUrl) {
    heroImg.style.setProperty('--hero-img', `url('${cmsImgFit(h.banner.heroImageUrl, 1200)}')`);
  }
  // Banner — tagline
  const tagline = document.querySelector('.hero-tagline');
  if (tagline) tagline.textContent = getL10n(h.banner.tagline);

  // CTA background
  const ctaSection = document.getElementById('cta');
  if (ctaSection && h.cta && h.cta.image) {
    ctaSection.style.setProperty('--cta-img', `url('${cmsImgFit(h.cta.image, 1600)}')`);
  }

  // Quote
  const setTxt = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
  setTxt('.quote-eyebrow', getL10n(h.quote.eyebrow));
  setTxt('.quote-main',    getL10n(h.quote.main));
  setTxt('.quote-note',    getL10n(h.quote.note));

  // Photography
  const photoDesc = document.querySelector('#category-photography .media-title-area p');
  if (photoDesc) photoDesc.textContent = getL10n(h.photography.description);
  const photoCards = document.querySelector('#category-photography .media-cards');
  if (photoCards) {
    photoCards.innerHTML = renderImgCards(h.photography.cards);
    photoCards.classList.add('fade-up');
  }

  // Video / Social
  const videoDesc = document.querySelector('#category-photography-1 .media-title-area p');
  if (videoDesc) videoDesc.textContent = getL10n(h.videoSocial.description);
  const videoCards = document.querySelector('#category-photography-1 .media-cards');
  if (videoCards) {
    videoCards.innerHTML = renderMixedCards(h.videoSocial.cards);
    videoCards.classList.add('fade-up');
  }

  // Archive
  const archive = document.getElementById('archive');
  if (archive) archive.innerHTML = renderArchive(cats);
}

// ── Mobile menu: dynamic category links ──────────────────
function initMobileMenuCats() {
  const container = document.getElementById('mobileMenuCats');
  if (!container) return;
  const d = getCmsData();
  const cats = (d.categories || CMS_DEFAULT.categories).slice().sort((a, b) => a.order - b.order);
  container.innerHTML = cats.map(cat =>
    `<a href="services.html?cat=${cat.id}" class="mobile-menu-link">${getL10n(cat.name)}</a>`
  ).join('');
}

// ── Apply settings (booking URL, social links) ────────────
// Runs independently so a CMS data error above can't block it.
function applySettings() {
  try {
    const s = (getCmsData().settings) || {};

    if (s.bookingUrl) {
      document.querySelectorAll('.cta-btn, .services-hero-btn, .mobile-menu-btn, .contact-link').forEach(el => {
        el.href = s.bookingUrl;
        el.target = '_blank';
        el.rel = 'noopener';
      });
      document.querySelectorAll('.project-booking-btn').forEach(el => {
        el.href = 'javascript:void(0)';
        el.removeAttribute('target');
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.Calendly) Calendly.initPopupWidget({ url: s.bookingUrl });
          else window.open(s.bookingUrl, '_blank');
        });
      });
    }

    // Support new socialLinks format and legacy instagram/redBook fields
    let socialLinks = s.socialLinks;
    if (!socialLinks) {
      socialLinks = [];
      if (s.instagram) socialLinks.push({ name: 'INSTAGRAM', url: s.instagram });
      if (s.redBook)   socialLinks.push({ name: 'RED BOOK',  url: s.redBook });
    }
    if (socialLinks.length) {
      const active = socialLinks.filter(l => l.url);
      document.querySelectorAll('.footer-social').forEach(container => {
        container.querySelectorAll('a').forEach(a => a.remove());
        active.forEach((link, i) => {
          const a = document.createElement('a');
          a.href = link.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = link.name + (i < active.length - 1 ? ',' : '');
          container.appendChild(a);
        });
      });
    }

    // ── SEO meta tags ──
    // For Google (JS-rendering crawlers) and human visitors. Social platforms
    // like LINE / FB don't run JS — they read the static fallback values from HTML head.
    if (s.seo) {
      const setMeta = (key, value, isProperty) => {
        if (!value) return;
        const attr = isProperty ? 'property' : 'name';
        let m = document.querySelector(`meta[${attr}="${key}"]`);
        if (!m) {
          m = document.createElement('meta');
          m.setAttribute(attr, key);
          document.head.appendChild(m);
        }
        m.setAttribute('content', value);
      };
      // Per-page <title> is left to each HTML / inline script — only og:title is overridden.
      setMeta('description',     s.seo.description);
      setMeta('og:title',        s.seo.title,       true);
      setMeta('og:description',  s.seo.description, true);
      setMeta('og:image',        s.seo.ogImage,     true);
      setMeta('twitter:title',       s.seo.title);
      setMeta('twitter:description', s.seo.description);
      setMeta('twitter:image',       s.seo.ogImage);
    }
  } catch (e) {}
}

// ── Boot ──────────────────────────────────────────────────
// Pages may have inline scripts that read CMS data; they all `await window.dataReady`.
// Cache-first: if a localStorage cache exists, render instantly (no network wait)
// and refresh from cloud in the background. Only the very first visit (no cache
// yet) waits for the cloud so new visitors never see placeholder defaults.
(async () => {
  const hasCache = _loadCmsFromCache();

  if (!hasCache) {
    await _loadCmsFromCloud();
  }

  initCms();
  initMobileMenuCats();
  applySettings();
  if (window._resolveDataReady) window._resolveDataReady();

  if (hasCache) _refreshCmsFromCloud(); // update cache for the next navigation
})();
