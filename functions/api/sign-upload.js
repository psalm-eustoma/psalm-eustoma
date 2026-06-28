// ── Cloudinary signed-upload signer (Cloudflare Pages Function) ──
// Route: POST /api/sign-upload
//
// Why: the admin used to upload straight to Cloudinary with an *unsigned*
// preset whose name is visible in admin.js — anyone who reads that file could
// dump files into the owner's Cloudinary account. This endpoint instead issues
// a short-lived signature, but only after confirming the caller is actually
// signed into the admin (a valid Firebase ID token). Once the `psalm-upload`
// preset is switched to "Signed" mode in the Cloudinary dashboard, anonymous
// uploads stop working entirely.
//
// Secrets (set in Cloudflare Pages → Settings → Environment variables):
//   CLOUDINARY_API_KEY     — the account's API key
//   CLOUDINARY_API_SECRET  — the account's API secret (NEVER ships to the browser)
//
// The Cloudinary cloud name, upload preset and Firebase API key are all public
// (already in the front-end), so they stay as constants here.

const CLOUDINARY_CLOUD = 'dlaqvwooi';
const UPLOAD_PRESET    = 'psalm-upload';
const FIREBASE_API_KEY = 'AIzaSyBhUQ9gGXrfaP5EQqRg_mA2bhsCmJs68Hk'; // public (Firebase web key)

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

// SHA-1 hex of a string, via WebCrypto (available in the Functions runtime).
async function sha1Hex(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Confirm the bearer token is a valid Firebase ID token for this project by
// asking Google's Identity Toolkit to look it up. Offloads JWT crypto to Google
// (no key parsing here) — uploads are rare, so the extra round-trip is fine.
// Returns true for any signed-in admin account (the Firebase project has no
// public sign-up, so "is authenticated" == "is an admin").
async function isLoggedInAdmin(idToken) {
  if (!idToken) return false;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.users) && data.users.length > 0;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey    = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  // Not configured yet → tell the client so it can fall back to the old flow
  // (keeps uploads working during setup). 503 = "not ready", not "forbidden".
  if (!apiKey || !apiSecret) {
    return json({ error: 'signing not configured' }, 503);
  }

  const auth = request.headers.get('Authorization') || '';
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!(await isLoggedInAdmin(idToken))) {
    return json({ error: 'not authorised' }, 401);
  }

  // Sign exactly the params the browser will send (besides file / api_key).
  // Cloudinary wants them sorted alphabetically, joined as k=v&k=v, with the
  // api_secret appended before hashing.
  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `timestamp=${timestamp}&upload_preset=${UPLOAD_PRESET}`;
  const signature = await sha1Hex(toSign + apiSecret);

  return json({
    cloudName:    CLOUDINARY_CLOUD,
    apiKey,
    timestamp,
    signature,
    uploadPreset: UPLOAD_PRESET
  });
}
