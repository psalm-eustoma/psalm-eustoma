// ── Server-side OG / SEO meta injection (Cloudflare Pages middleware) ──
// Runs on every request. The front-end already injects settings.seo.* via JS
// (cms.js → applySettings) for Google and human visitors, but social scrapers
// (LINE / Facebook / X) don't run JS, so they'd only see the static placeholder
// meta — notably an EMPTY og:image, which means link shares show no preview.
//
// This rewrites those meta tags in the HTML response using the same CMS values,
// so shares reflect the owner's admin settings and stay in sync automatically.
//
// SAFETY: og injection must never break page delivery. Any failure (Firestore
// unreachable, parse error, anything) returns the original response untouched.
// Non-HTML responses (assets, /api/*) are passed straight through without even
// touching Firestore.

const CMS_URL = 'https://firestore.googleapis.com/v1/projects/psalm-website-design/databases/(default)/documents/site/content?key=AIzaSyBhUQ9gGXrfaP5EQqRg_mA2bhsCmJs68Hk';

// Decode Firestore REST typed values into plain JS.
function decode(v) {
  if (v == null) return null;
  if ('stringValue'  in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('mapValue'     in v) {
    const o = {}, f = v.mapValue.fields || {};
    for (const k in f) o[k] = decode(f[k]);
    return o;
  }
  if ('arrayValue'   in v) return (v.arrayValue.values || []).map(decode);
  return null;
}

// Read settings.seo from Firestore, cached at the edge for 5 min so we don't
// fetch per request.
async function getSeo() {
  const res = await fetch(CMS_URL, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!res.ok) return null;
  const json = await res.json();
  const fields = json && json.fields;
  if (!fields || !fields.settings) return null;
  const settings = decode(fields.settings);
  return (settings && settings.seo) || null;
}

// Sets a meta tag's content attribute — but only when we have a value, so an
// empty CMS field never wipes a good static default.
class SetContent {
  constructor(value) { this.value = value; }
  element(el) { if (this.value) el.setAttribute('content', this.value); }
}

export async function onRequest(context) {
  const response = await context.next();
  try {
    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return response;

    const seo = await getSeo();
    if (!seo) return response;

    return new HTMLRewriter()
      .on('meta[name="description"]',        new SetContent(seo.description))
      .on('meta[property="og:title"]',       new SetContent(seo.title))
      .on('meta[property="og:description"]', new SetContent(seo.description))
      .on('meta[property="og:image"]',       new SetContent(seo.ogImage))
      .transform(response);
  } catch (e) {
    return response; // injection must never break the page
  }
}
