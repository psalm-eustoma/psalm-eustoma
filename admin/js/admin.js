// ── Auth ─────────────────────────────────────────────────
// Login page handles its own state. Every other admin page waits for Firebase
// to restore the session, then redirects if no user is signed in.
function checkAuth() {
  const page = location.pathname.split('/').pop();
  if (page === 'index.html' || page === '') return Promise.resolve();
  return new Promise(resolve => {
    const unsub = firebase.auth().onAuthStateChanged(user => {
      unsub();
      if (!user) location.href = 'index.html';
      else resolve();
    });
  });
}

async function logout() {
  try { await firebase.auth().signOut(); } catch {}
  location.href = 'index.html';
}

// ── Multilingual field helpers ────────────────────────────
const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'zh', label: 'ZH' }
];

// Generate stacked EN/FR/ZH input HTML for a translatable field.
// opts: { placeholder, textarea, rows, maxlength }
function mlFieldHTML(id, value, opts) {
  const ph     = (opts && opts.placeholder) || '';
  const isTA   = !!(opts && opts.textarea);
  const rows   = (opts && opts.rows) || 2;
  const maxLen = (opts && opts.maxlength) || null;
  const val    = (value && typeof value === 'object') ? value : { en: value || '', fr: '', zh: '' };
  return `<div class="ml-field">${LANGS.map(({ code, label }) => {
    const v = val[code] || '';
    const maxAttr  = maxLen ? ` maxlength="${maxLen}"` : '';
    const curId    = `${id}-cur-${code}`;
    const onInput  = maxLen
      ? ` oninput="var c=document.getElementById('${curId}');c.textContent=this.value.length;c.parentElement.classList.toggle('near-limit',this.value.length>=${maxLen})"`
      : '';
    const el = isTA
      ? `<textarea class="ml-input" id="${id}-${code}" rows="${rows}" placeholder="${ph}"${maxAttr}${onInput}>${v}</textarea>`
      : `<input class="ml-input" type="text" id="${id}-${code}" value="${v.replace(/"/g, '&quot;')}" placeholder="${ph}"${maxAttr}${onInput}>`;
    const counter = maxLen ? `<div class="ml-counter"><span id="${curId}">${v.length}</span> / ${maxLen}</div>` : '';
    const inner   = maxLen ? `<div class="ml-input-wrap">${el}${counter}</div>` : el;
    return `<div class="ml-row" id="${id}-row-${code}"><span class="ml-lang">${label}</span>${inner}</div>`;
  }).join('')}</div>`;
}

// Read back all three lang values from a rendered ml-field.
function getML(id) {
  const out = {};
  LANGS.forEach(({ code }) => {
    const el = document.getElementById(`${id}-${code}`);
    out[code] = el ? el.value.trim() : '';
  });
  return out;
}

// Validate: if some (but not all) langs are filled → highlight empty rows, return false.
// If required=true, also reject all-empty. Otherwise all-empty is OK.
// Returns the { en, fr, zh } object if valid, false if not.
function validateML(id, required) {
  const vals  = getML(id);
  const filled = LANGS.filter(({ code }) => vals[code]);
  const allFilled  = filled.length === LANGS.length;
  const noneFilled = filled.length === 0;

  // Clear previous warnings
  LANGS.forEach(({ code }) => {
    const row = document.getElementById(`${id}-row-${code}`);
    if (row) row.classList.remove('warn');
  });

  if (allFilled) return vals;
  if (noneFilled && !required) return vals; // intentionally empty

  // Partial fill — or all-empty when required
  LANGS.forEach(({ code }) => {
    if (!vals[code]) {
      const row = document.getElementById(`${id}-row-${code}`);
      if (row) row.classList.add('warn');
    }
  });
  return false;
}

// Admin display helper: always show EN (or first available).
function getL10n(field) {
  if (!field || typeof field !== 'object') return field || '';
  return field.en || field.fr || field.zh || '';
}

// ── Data store ────────────────────────────────────────────
const DB_KEY = 'psalm_cms';
const DATA_VERSION = '3';

function ml(en) { return { en: en || '', fr: '', zh: '' }; }

function migrateLang(val) {
  if (!val && val !== 0) return ml('');
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  return ml(String(val));
}

function migrateToV3(stored) {
  if (stored.home) {
    const h = stored.home;
    if (h.banner) h.banner.tagline = migrateLang(h.banner.tagline);
    if (h.quote) {
      h.quote.eyebrow = migrateLang(h.quote.eyebrow);
      h.quote.main    = migrateLang(h.quote.main);
      h.quote.note    = migrateLang(h.quote.note);
    }
    if (h.photography) {
      h.photography.description = migrateLang(h.photography.description);
      if (h.photography.cards)
        h.photography.cards = h.photography.cards.map(c => ({ ...c, label: migrateLang(c.label) }));
    }
    if (h.videoSocial) {
      h.videoSocial.description = migrateLang(h.videoSocial.description);
      if (h.videoSocial.cards)
        h.videoSocial.cards = h.videoSocial.cards.map(c => ({ ...c, label: migrateLang(c.label) }));
    }
  }
  if (stored.categories)
    stored.categories = stored.categories.map(cat => ({
      ...cat, name: migrateLang(cat.name), subtitle: migrateLang(cat.subtitle)
    }));
  if (stored.projects)
    stored.projects = stored.projects.map(proj => ({
      ...proj,
      title:       migrateLang(proj.title),
      description: migrateLang(proj.description),
      quote:       migrateLang(proj.quote),
      quoteAuthor: migrateLang(proj.quoteAuthor)
    }));
  if (stored.about) {
    const a = stored.about;
    a.eyebrow         = migrateLang(a.eyebrow);
    a.headline        = migrateLang(a.headline);
    a.invitationQuote = migrateLang(a.invitationQuote);
    a.invitationNote  = migrateLang(a.invitationNote);
  }
  return stored;
}

const DEFAULT_DATA = {
  home: {
    banner: {
      videoUrl:    'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-2160x3840_4aa2118e-f8f3-4d66-b952-3e4be6a82e9e.webm',
      heroImageUrl:'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp',
      tagline: ml('Where light moves gently, and moments take form with quiet emotion.')
    },
    quote: {
      eyebrow: ml('Light begins in silence.'),
      main:    ml('In quiet spaces, light takes shape and guides emotion— letting moments form gently and memories linger softly.'),
      note:    ml('Every image is a balance of presence and intention.')
    },
    photography: {
      description: ml('Observing the quiet rhythm of the city, the work captures passing light, reflections, and the calm pulse of everyday Paris.'),
      cards: [
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp', label: ml('WEDDING') },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_d3ba133f-b234-4ce8-8e4a-a7a9b9a561aa_middle.webp', label: ml('WEDDING') },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1799_v-fms_webp_faede2bf-42ca-4266-b027-02931fe9a013_middle.webp', label: ml('WEDDING') }
      ]
    },
    videoSocial: {
      description: ml('Honest and unposed, each wedding is seen as it unfolds — gestures, laughter, and emotions preserved with quiet sincerity.'),
      cards: [
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-2160x3840_d7ac7592-37dc-4260-b2b4-9471985c7b00.mp4', label: ml('WEDDING'), isVideo: true },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_217d8cd1-8269-481c-bf3e-6e547bba37b5_middle.webp', label: ml('WEDDING'), isVideo: false },
        { mediaUrl: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp', label: ml('WEDDING'), isVideo: false }
      ]
    }
  },
  categories: [
    { id: 'cat-a', name: ml('Paris Lifestyle & Travel'), subtitle: ml('Creating images that feel natural and sincere.'), order: 1, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_v-frms_webp_217d8cd1-8269-481c-bf3e-6e547bba37b5_small.webp', heroImage: '' },
    { id: 'cat-b', name: ml('Commercial'),              subtitle: ml(''),                                              order: 2, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_34de9d2a-9324-472c-aa33-96cfd2eacd2f.webp',                                                                                           heroImage: '' },
    { id: 'cat-c', name: ml('Wedding & Elopement'),     subtitle: ml(''),                                              order: 3, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-4480x6720_575b2663-e34f-419c-a99b-129ed4c86376.webp',                                                                                              heroImage: '' },
    { id: 'cat-d', name: ml('Travel Stories'),          subtitle: ml(''),                                              order: 4, image: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1799_v-fms_webp_faede2bf-42ca-4266-b027-02931fe9a013_small.webp',                                                                              heroImage: '' }
  ],
  projects: [
    {
      id: 'proj-1',
      categoryId: 'cat-a',
      title:       ml('Lumière Douce'),
      tags: ['LE MARAIS', 'PHOTOGRAPHY', 'VIDEO'],
      description: ml('Captured in the early evening light of Le Marais, Lumière Douce explores how quiet gestures and reflections reveal the rhythm of the city. The series blends still and moving imagery, documenting moments that feel both ordinary and cinematic — a study of calm energy within everyday Paris.'),
      quote:       ml('Psalm Eustoma has a way of noticing the quiet things— our photos feel like us'),
      quoteAuthor: ml('Clémence & Adrien, Paris'),
      images: [
        'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_4206514c-9074-4f7c-b611-3af1243aaf90.webp',
        'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1920_798293a5-c73a-4c78-9763-f47f9f46f3de.webp',
        'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_34de9d2a-9324-472c-aa33-96cfd2eacd2f.webp',
        'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1914_512664c1-b6c2-45ad-a88b-945b120e6ace.webp'
      ],
      order: 1
    }
  ],
  about: {
    heroImage: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1440x1800_cf117adb-99b3-4521-8765-a697b35f4a13.webp',
    eyebrow:         ml('French photographer based in Paris.'),
    headline:        ml('Psalm Eustoma focuses on guided portraits and poetic documentation — blending design sensibility with sincerity.'),
    portrait: 'https://storage.googleapis.com/studio-design-asset-files/projects/VGOK7AykOn/s-1080x1080_fcb36d04-8e5f-4165-9938-7a59f2c4c5bf.webp',
    invitationQuote: ml('Every collaboration begins with quiet trust and mutual curiosity. The stories we create are shaped by light, patience, and sincerity.'),
    invitationNote:  ml('Every story begins with trust.')
  },
  settings: {
    bookingUrl: '',
    socialLinks: [{ name: 'INSTAGRAM', url: '' }, { name: 'RED BOOK', url: '' }],
    seo: { title: '', description: '', ogImage: '' }
  }
};

// ── In-memory cache (filled by loadDataFromCloud, kept fresh on every save) ──
let _cache = null;

function _normalize(stored) {
  let needsSave = false;
  if (stored.version !== DATA_VERSION) {
    stored = migrateToV3(stored);
    stored.version = DATA_VERSION;
    needsSave = true;
  }
  Object.keys(DEFAULT_DATA).forEach(key => {
    if (!(key in stored)) { stored[key] = DEFAULT_DATA[key]; needsSave = true; }
  });
  // Migrate legacy instagram/redBook fields to socialLinks array
  if (stored.settings && !stored.settings.socialLinks) {
    const links = [];
    if (stored.settings.instagram) links.push({ name: 'INSTAGRAM', url: stored.settings.instagram });
    if (stored.settings.redBook)   links.push({ name: 'RED BOOK',  url: stored.settings.redBook });
    if (!links.length) links.push({ name: 'INSTAGRAM', url: '' }, { name: 'RED BOOK', url: '' });
    stored.settings.socialLinks = links;
    delete stored.settings.instagram;
    delete stored.settings.redBook;
    needsSave = true;
  }
  return { data: stored, needsSave };
}

// One-time fetch on page load. Falls back to localStorage migration if cloud is empty.
async function loadDataFromCloud() {
  let cloud = await window.firebaseLoadData();
  if (!cloud) {
    // First time: seed from localStorage if present, else from DEFAULT_DATA
    const localRaw = localStorage.getItem(DB_KEY);
    cloud = localRaw ? JSON.parse(localRaw) : { ...DEFAULT_DATA, version: DATA_VERSION };
    await window.firebaseSaveData(cloud);
  }
  const { data, needsSave } = _normalize(cloud);
  if (needsSave) await window.firebaseSaveData(data);
  _cache = data;
  // Mirror to localStorage for offline read & emergency recovery
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function getData() {
  if (_cache) return _cache;
  // Fallback if a page reads data before cloud load finishes (shouldn't happen if pages await dataReady)
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : { ...DEFAULT_DATA, version: DATA_VERSION };
}

function saveData(data) {
  _cache = data;
  localStorage.setItem(DB_KEY, JSON.stringify(data));
  // Fire-and-forget: UI stays responsive; toast already shows on caller side.
  window.firebaseSaveData(data).catch(err => {
    console.error('[firestore save failed]', err);
    alert('儲存到雲端失敗，請檢查網路後重試。\n' + (err.message || ''));
  });
}

// ── Categories ────────────────────────────────────────────
function getCategories() { return getData().categories.sort((a, b) => a.order - b.order); }

function saveCategory(cat) {
  const data = getData();
  const idx = data.categories.findIndex(c => c.id === cat.id);
  if (idx >= 0) data.categories[idx] = cat; else data.categories.push(cat);
  saveData(data);
}

function deleteCategory(id) {
  const data = getData();
  data.categories = data.categories.filter(c => c.id !== id);
  data.projects   = data.projects.filter(p => p.categoryId !== id);
  saveData(data);
}

function reorderItems(collection, ids) {
  ids.forEach((id, i) => {
    const item = collection.find(x => x.id === id);
    if (item) item.order = i + 1;
  });
}

function reorderCategories(ids) {
  const data = getData();
  reorderItems(data.categories, ids);
  saveData(data);
}

function getCategoryName(id) {
  const cat = getData().categories.find(c => c.id === id);
  if (!cat) return '—';
  return getL10n(cat.name) || '—';
}

// ── Projects ──────────────────────────────────────────────
function getProjects(categoryId) {
  const projects = getData().projects;
  const filtered = categoryId ? projects.filter(p => p.categoryId === categoryId) : projects;
  return filtered.sort((a, b) => a.order - b.order);
}

function getProject(id) { return getData().projects.find(p => p.id === id) || null; }

function saveProject(proj) {
  const data = getData();
  const idx = data.projects.findIndex(p => p.id === proj.id);
  if (idx >= 0) data.projects[idx] = proj; else data.projects.push(proj);
  saveData(data);
}

function deleteProject(id) {
  const data = getData();
  data.projects = data.projects.filter(p => p.id !== id);
  saveData(data);
}

function reorderProjects(ids) {
  const data = getData();
  reorderItems(data.projects, ids);
  saveData(data);
}

// ── Home ──────────────────────────────────────────────────
function getHome()       { return getData().home; }
function saveHome(home)  { const d = getData(); d.home = home; saveData(d); }

// ── About ─────────────────────────────────────────────────
function getAbout()      { return getData().about || DEFAULT_DATA.about; }
function saveAbout(about){ const d = getData(); d.about = about; saveData(d); }

// ── Settings ──────────────────────────────────────────────
function getSettings()         { return getData().settings; }
function saveSettings(settings){ const d = getData(); d.settings = settings; saveData(d); }

// ── Unsaved changes guard ─────────────────────────────────
let _dirty = false;
// 儲存按鈕狀態：有未存變更 → 加 .is-dirty（醒目綠）；無 → 灰底
function _updateSaveBtn() {
  const btn = document.getElementById('saveBtn');
  if (btn) btn.classList.toggle('is-dirty', _dirty);
}
function markDirty() { _dirty = true; _updateSaveBtn(); }
function markClean() { _dirty = false; _updateSaveBtn(); }
function initDirtyGuard() {
  // Browser close / refresh — keep native dialog (truly leaving the site)
  window.addEventListener('beforeunload', e => {
    if (!_dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  // Internal link clicks — intercept with a friendly Chinese confirm
  document.addEventListener('click', e => {
    if (!_dirty) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    // Only handle relative links (internal admin pages); skip external / anchor-only
    if (!href || href.startsWith('http') || href.startsWith('#') || a.target === '_blank') return;
    e.preventDefault();
    if (window.confirm('有未儲存的變更，確定要離開此頁面？')) {
      markClean(); // prevent beforeunload from firing on the programmatic navigation
      location.href = a.href;
    }
  }, true); // capture phase so it fires before any other click handlers
}

// ── Save toast ────────────────────────────────────────────
function showSaveToast(msg) {
  markClean(); // 存檔成功 → 按鈕轉灰（涵蓋 home/about/categories/settings）
  let toast = document.getElementById('_saveToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_saveToast';
    toast.className = 'save-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg || '✓ 已儲存';
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
}

// 儲存按鈕初始為灰；主內容區任何輸入/變更 → 標記 dirty（讓按鈕轉醒目色）。
// 通用寫法，涵蓋未個別接線 markDirty 的頁面（settings / categories）。
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('saveBtn')) return;
  _updateSaveBtn();
  const main = document.querySelector('main.main');
  if (main) {
    main.addEventListener('input', markDirty);
    main.addEventListener('change', markDirty);
  }
});

// ── Cloudinary upload ─────────────────────────────────────
const CLOUDINARY_CLOUD  = 'dlaqvwooi';
const CLOUDINARY_PRESET = 'psalm-upload';

const MAX_IMAGE_MB     = 8;
const MAX_VIDEO_MB     = 50;
const MAX_VIDEO_SECONDS = 15;
const IMAGE_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
const VIDEO_EXT  = ['mp4', 'webm', 'mov'];
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

// 讀影片長度（上傳前先擋，不浪費流量）
function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(v.src); reject(new Error('讀取影片資訊失敗')); };
    v.src = URL.createObjectURL(file);
  });
}

async function uploadToCloudinary(file, opts = {}) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const isVideo = file.type.startsWith('video') || VIDEO_EXT.includes(ext);

  // 首頁 hero 影片只收 mp4：webm 在 iPhone 只能用軟體解碼，會卡頓。
  if (opts.mp4Only && isVideo) {
    const isMp4 = ext === 'mp4' || file.type === 'video/mp4';
    if (!isMp4) throw new Error('首頁 Banner 影片請用 mp4 格式（確保 iPhone 播放順暢）');
  }

  // 格式（副檔名或 MIME 任一相符即可，否則擋下給白話提示）
  const okExt  = (isVideo ? VIDEO_EXT  : IMAGE_EXT ).includes(ext);
  const okMime = (isVideo ? VIDEO_MIME : IMAGE_MIME).includes(file.type);
  if (!okExt && !okMime) {
    throw new Error(isVideo
      ? '影片格式不支援，請用 mp4 / webm / mov'
      : '圖片格式不支援，請用 jpg / png / webp（iPhone 的 HEIC 請先轉成 jpg）');
  }

  // 大小
  const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`檔案太大，${isVideo ? '影片' : '圖片'}上限為 ${maxMB} MB（目前 ${(file.size / 1024 / 1024).toFixed(1)} MB）`);
  }

  // 影片長度（預設 15 秒；作品內頁放寬到 20 秒，由呼叫端傳 opts.maxSeconds）
  if (isVideo) {
    const maxSec = opts.maxSeconds || MAX_VIDEO_SECONDS;
    let dur = null;
    try { dur = await getVideoDuration(file); } catch (e) {}
    if (dur != null && dur > maxSec + 0.5) {
      throw new Error(`影片太長，上限為 ${maxSec} 秒（目前 ${dur.toFixed(1)} 秒）`);
    }
  }

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${isVideo ? 'video' : 'image'}/upload`,
    { method: 'POST', body: fd }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'upload failed');
  return json.secure_url;
}

// Shared hidden file input — reused by all upload buttons.
let _uploadTarget = null;
const _uploadFileInput = (() => {
  const el = document.createElement('input');
  el.type = 'file';
  el.style.display = 'none';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
  el.addEventListener('change', async () => {
    const file = el.files[0];
    if (!file || !_uploadTarget) return;
    const { inputEl, btnEl, opts } = _uploadTarget;
    btnEl.disabled = true;
    btnEl.textContent = '…';
    try {
      const url = await uploadToCloudinary(file, opts || {});
      inputEl.value = url;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (err) {
      alert('上傳失敗：' + (err.message || '請再試一次'));
    } finally {
      btnEl.disabled = false;
      btnEl.textContent = '↑ 上傳';
      el.value = '';
      _uploadTarget = null;
    }
  });
  return el;
})();

function triggerImgUpload(inputEl, btnEl, accept, opts) {
  _uploadTarget = { inputEl, btnEl, opts: opts || {} };
  _uploadFileInput.accept = accept || 'image/*';
  _uploadFileInput.click();
}

// ── 上傳須知：自動插到側欄底部（登出之上，一處維護、全後台生效）──
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.sidebar-footer');
  if (!footer || document.querySelector('.upload-notice')) return;
  const notice = document.createElement('div');
  notice.className = 'upload-notice';
  notice.innerHTML =
    '<strong>上傳須知</strong>' +
    '<ul>' +
      `<li>圖片：jpg / png / webp，≤ ${MAX_IMAGE_MB} MB</li>` +
      `<li>影片：mp4 / webm / mov，≤ ${MAX_VIDEO_MB} MB、≤ ${MAX_VIDEO_SECONDS} 秒</li>` +
      '<li>iPhone HEIC 請先轉 jpg</li>' +
    '</ul>';
  footer.insertAdjacentElement('beforebegin', notice);
});

// ── Video helpers ─────────────────────────────────────────
function isVideoUrl(url) {
  if (!url) return false;
  return url.includes('/video/upload/') || /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

function cloudinaryVideoThumb(url) {
  return url
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace(/\.(mp4|webm|mov|avi)(\?.*)?$/i, '.jpg');
}

// ── Image preview ─────────────────────────────────────────
function showImgPreview(inputEl, url) {
  if (inputEl.closest('.img-item')) return; // project image list uses img-thumb
  const row = inputEl.closest('.img-row');
  if (!row) return;
  let thumb = row.nextElementSibling;
  if (!thumb || !thumb.classList.contains('img-inline-thumb')) {
    thumb = document.createElement('img');
    thumb.className = 'img-inline-thumb';
    row.insertAdjacentElement('afterend', thumb);
  }
  if (url && url.startsWith('http')) {
    thumb.src = url;
    thumb.style.display = 'block';
  } else {
    thumb.src = '';
    thumb.style.display = 'none';
  }
}

function refreshImgPreviews(container) {
  (container || document).querySelectorAll('.img-row input[type="url"]').forEach(input => {
    showImgPreview(input, input.value.trim());
  });
}

document.addEventListener('input', e => {
  if (e.target.matches('.img-row input[type="url"]')) {
    showImgPreview(e.target, e.target.value.trim());
  }
});

// ── Drag-to-reorder for table rows (projects / categories) ──
// Rows must be `<tr draggable="true" data-id="...">`.
// onReorder receives the new id order array after a successful drop.
function enableRowDrag(tbodyEl, onReorder) {
  let dragSrcId = null;

  tbodyEl.addEventListener('dragstart', e => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    dragSrcId = tr.dataset.id;
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => tr.classList.add('dragging'));
  });

  tbodyEl.addEventListener('dragend', () => {
    tbodyEl.querySelectorAll('tr').forEach(r => r.classList.remove('dragging', 'drag-over'));
    dragSrcId = null;
  });

  tbodyEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const tr = e.target.closest('tr[data-id]');
    tbodyEl.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over'));
    if (tr && tr.dataset.id !== dragSrcId) tr.classList.add('drag-over');
  });

  tbodyEl.addEventListener('drop', e => {
    e.preventDefault();
    const tr = e.target.closest('tr[data-id]');
    tbodyEl.querySelectorAll('tr').forEach(r => r.classList.remove('drag-over', 'dragging'));
    if (!tr || !dragSrcId || tr.dataset.id === dragSrcId) return;

    const rows  = [...tbodyEl.querySelectorAll('tr[data-id]')];
    const srcTr = rows.find(r => r.dataset.id === dragSrcId);
    const srcIdx = rows.indexOf(srcTr);
    const tgtIdx = rows.indexOf(tr);
    if (srcIdx === -1 || tgtIdx === -1) return;

    if (srcIdx < tgtIdx) tbodyEl.insertBefore(srcTr, tr.nextSibling);
    else                 tbodyEl.insertBefore(srcTr, tr);

    onReorder([...tbodyEl.querySelectorAll('tr[data-id]')].map(r => r.dataset.id));
  });
}

// ── Utils ─────────────────────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function setActiveNav() {
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === page);
  });
}

function confirmDelete(msg) { return window.confirm(msg || '確定要刪除嗎？此操作無法復原。'); }

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  setActiveNav();
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Login page doesn't read CMS data — skip the cloud fetch.
  const page = location.pathname.split('/').pop();
  if (page === 'index.html' || page === '') {
    window._resolveDataReady && window._resolveDataReady();
    return;
  }

  try {
    await loadDataFromCloud();
  } catch (err) {
    console.error('[firestore load failed]', err);
    alert('無法連接到雲端資料庫，請檢查網路後重新整理。\n' + (err.message || ''));
    return;
  }
  window._resolveDataReady && window._resolveDataReady();
});
