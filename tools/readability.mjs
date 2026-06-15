// Read-only PLAYABILITY checker for the dragon roster.
//
// The chase camera looks forward-and-down over the creature, so VERTICAL body
// mass is what blocks the view + the head/aim point. This projects each apex
// dragon's mesh silhouette through the REAL chase camera (cameraController.js)
// and measures two screen-space numbers from §0.5 of the design guide:
//   VOcc  — vertical screen occupancy: how much of the frame height the body
//           fills (too much = you can't see the course).
//   AboveH — how far body mass rises ABOVE the head/aim point in the frame
//           (positive = mass stacked over the head, hiding your aim).
//
//   node tools/readability.mjs            report every dragon's apex form
//   node tools/readability.mjs <key>      just one dragon (all forms)
//   node tools/readability.mjs --ci       exit 1 if any apex form FAILs
//
// FAIL if central VOcc > 58% OR AboveH > 8% (central mass over the aim point);
// WARN at the Solar/Phoenix ceiling (>43% / >4.5%). Counts MESHES only (sprites excluded).

import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);

const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {},
  beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {},
  set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = {
  hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
};
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear(),
  };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

const args = process.argv.slice(2);
const ci = args.includes('--ci');
const only = args.find((a) => !a.startsWith('--'));

// The real cruise chase camera (cameraController.js): behind + above, looking
// forward + slightly up. The dragon is rendered at the player origin.
const cam = new THREE.PerspectiveCamera(60, 1100 / 720, 0.1, 200);
cam.position.set(0, 3.6, 12.3);
cam.lookAt(0, 1.0, -16);
cam.updateMatrixWorld(true);
cam.updateProjectionMatrix();

const _v = new THREE.Vector3();
function project(x, y, z) { return _v.set(x, y, z).project(cam); } // → NDC (-1..1)

function measure(group) {
  group.updateMatrixWorld(true);
  let topNdc = -Infinity, botNdc = Infinity, headNdc = -Infinity;
  let headZ = Infinity, headWorld = null;
  // First find the head/aim point = the frontmost (min z) mesh vertex region.
  group.traverse((o) => {
    if (o.isMesh && o.geometry) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox;
      for (const cz of [bb.min, bb.max]) {
        _v.copy(cz).applyMatrix4(o.matrixWorld);
        if (_v.z < headZ) { headZ = _v.z; headWorld = _v.clone(); }
      }
    }
  });
  if (headWorld) headNdc = project(headWorld.x, headWorld.y, headWorld.z).y;
  // Then the vertical screen span ONLY in the CENTRAL AIMING COLUMN — the band of
  // the frame around your aim point where rings + the path appear. Mass out at the
  // sides (wings spreading wide) is fine even if it's tall; mass stacked in the
  // centre is what blocks the view. (|NDC.x| < 0.30 ≈ the middle ~30% of the frame.)
  const BAND = 0.30;
  group.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const bb = o.geometry.boundingBox;
      for (let i = 0; i < 8; i++) {
        const c = new THREE.Vector3(
          i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z)
          .applyMatrix4(o.matrixWorld);
        const n = project(c.x, c.y, c.z);
        if (Math.abs(n.x) > BAND) continue;   // off to the side → not in the sight-line
        if (n.y > topNdc) topNdc = n.y;
        if (n.y < botNdc) botNdc = n.y;
      }
    }
  });
  const vOcc = (topNdc - botNdc) / 2;     // central-column span / frame height
  const aboveH = (topNdc - headNdc) / 2;  // central mass rising above the aim point
  return { vOcc, aboveH };
}
function dispose(obj) {
  obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m && m.dispose) m.dispose(); });
}

const FORM_NAMES = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
// Calibrated to how the roster actually FEELS: measuring only the CENTRAL column,
// the comfortable dragons sit clear; Solar/Phoenix nudge into WARN ("takes a bit
// of skill"); the real fail signal is AboveH — central mass stacked OVER the aim
// point (the wyrm at 12% vs everyone else ≤5%), which is what hides your head.
const verdict = (vOcc, aboveH) =>
  (vOcc > 0.58 || aboveH > 0.08) ? 'FAIL' : (vOcc > 0.43 || aboveH > 0.045) ? 'WARN' : 'OK  ';
const keys = only ? [only] : Object.keys(DRAGONS);
const padR = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log('\nDragon Drift — chase-camera playability (silhouette envelope §0.5)\n');
console.log(padR('Dragon', 12) + padR('Form', 10) + padL('VOcc', 7) + padL('AboveH', 8) + '  Verdict');
console.log('-'.repeat(46));
let fails = 0, lastKey = null;
for (const key of keys) {
  if (!DRAGONS[key]) { console.log(`unknown dragon: ${key}`); continue; }
  const maxTier = maxTierFor(key);
  const tiers = only ? [...Array(maxTier + 1).keys()] : [maxTier];
  for (const tier of tiers) {
    const { group } = buildDragonModel(ascendedDef(DRAGONS[key], tier, 0), {});
    const { vOcc, aboveH } = measure(group);
    dispose(group);
    const v = verdict(vOcc, aboveH);
    if (v === 'FAIL' && tier === maxTier) fails++;
    const keyCol = key === lastKey ? '' : key; lastKey = key;
    console.log(padR(keyCol, 12) + padR(FORM_NAMES[tier] || `F${tier}`, 10)
      + padL((vOcc * 100).toFixed(0) + '%', 7) + padL((aboveH * 100).toFixed(0) + '%', 8)
      + '  ' + v + (v === 'FAIL' ? ' ← crowds the frame / sits over the head' : ''));
  }
}
console.log('-'.repeat(46));
console.log(`${fails} apex form(s) FAIL the silhouette envelope (FAIL > 58% central VOcc or > 8% AboveH · WARN = the Solar/Phoenix ceiling).\n`);
if (ci && fails > 0) process.exitCode = 1;
