// ── Public read-only CMS loader via Firestore REST API ──
// Front-end pages only READ one document (site/content). They don't need the
// full Firebase SDK (auth/writes/listeners) — a single fetch is far lighter to
// download and parse on every page. The admin panel still uses firebase-init.js
// + the SDK because it authenticates and writes.
//
// Exposes the same interface cms.js expects:
//   window.firebaseLoadData() → fetch the single content doc (or null)
//   window.dataReady          → Promise resolved when initial load is done
//   window._resolveDataReady()

const PROJECT_ID = 'psalm-website-design';
const API_KEY    = 'AIzaSyBhUQ9gGXrfaP5EQqRg_mA2bhsCmJs68Hk';
const DOC_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/site/content?key=${API_KEY}`;

// Firestore REST returns typed values ({stringValue}, {mapValue}, …).
// Decode them back into plain JS objects.
function _decodeValue(v) {
  if (v == null) return null;
  if ('stringValue'    in v) return v.stringValue;
  if ('integerValue'   in v) return Number(v.integerValue);
  if ('doubleValue'    in v) return v.doubleValue;
  if ('booleanValue'   in v) return v.booleanValue;
  if ('nullValue'      in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue'       in v) return _decodeFields(v.mapValue.fields || {});
  if ('arrayValue'     in v) return (v.arrayValue.values || []).map(_decodeValue);
  return null;
}
function _decodeFields(fields) {
  const obj = {};
  for (const k in fields) obj[k] = _decodeValue(fields[k]);
  return obj;
}

window.firebaseLoadData = async function () {
  const res = await fetch(DOC_URL);
  if (!res.ok) return null;            // 404 = doc missing → caller falls back to cache/defaults
  const json = await res.json();
  if (!json || !json.fields) return null;
  return _decodeFields(json.fields);
};

// Readiness promise (mirrors firebase-init.js). Pages await this before
// running any init that reads cms data.
let _dataReadyResolve;
window.dataReady = new Promise(r => { _dataReadyResolve = r; });
window._resolveDataReady = () => _dataReadyResolve();
