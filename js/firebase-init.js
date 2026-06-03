// ── Firebase init (v8 compat, loaded via CDN before this script) ──
// Exposes two helpers + a global readiness Promise:
//   window.firebaseLoadData()       → fetch the single content doc
//   window.firebaseSaveData(data)   → overwrite the single content doc
//   window.dataReady                → Promise that resolves when initial load is done

firebase.initializeApp({
  apiKey:            'AIzaSyBhUQ9gGXrfaP5EQqRg_mA2bhsCmJs68Hk',
  authDomain:        'psalm-website-design.firebaseapp.com',
  projectId:         'psalm-website-design',
  storageBucket:     'psalm-website-design.firebasestorage.app',
  messagingSenderId: '235444479220',
  appId:             '1:235444479220:web:6257488f0b36b00736eaa1'
});

const _docRef = firebase.firestore().collection('site').doc('content');

window.firebaseLoadData = async function () {
  const snap = await _docRef.get();
  return snap.exists ? snap.data() : null;
};

window.firebaseSaveData = async function (data) {
  await _docRef.set(data);
};

// Pages await window.dataReady before running any init that reads cms data.
let _dataReadyResolve;
window.dataReady = new Promise(r => { _dataReadyResolve = r; });
window._resolveDataReady = () => _dataReadyResolve();
