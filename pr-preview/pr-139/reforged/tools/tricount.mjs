// Read-only triangle-budget checker for the dragon roster.
//
// Builds every dragon x every reachable form (Hatchling..apex) through the SAME
// shared mesh builder the game and shop preview use (buildDragonModel +
// ascendedDef) and sums static triangle counts per model, printing a table
// against a per-form budget. It writes nothing and touches no save state —
// purely diagnostic, safe to run anytime.
//
//   node tools/tricount.mjs              report every dragon/form, always exit 0
//   node tools/tricount.mjs --max=9000   override the per-form budget
//   node tools/tricount.mjs --ci         exit 1 if any form exceeds the budget
//
// NOTE: this counts BUILD-TIME mesh geometry only — NOT the runtime sprite pools
// (speed/boost trails, ember/wing motes, death-burst shards) that live in
// dragon.js and are created per-session, not by the builder.

import { register } from 'node:module';

// 1) Resolve the bare 'three' import that every js/ module uses.
register('./three-resolver.mjs', import.meta.url);

// 2) Minimal DOM/canvas shim so util.js texture helpers (canvas + 2D context)
//    don't throw during construction. No renderer exists, so no pixels are ever
//    read — empty stubs covering the full 2D surface util.js touches suffice.
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {},
  beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {},
  set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = {
  hidden: false,
  addEventListener() {},
  removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
};
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

// 3) Import the game modules AFTER the resolver + shim are in place (dynamic, so
//    the static graph isn't hoisted and evaluated before registration).
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

// --- options ---------------------------------------------------------------
const args = process.argv.slice(2);
const ci = args.includes('--ci');
const maxArg = args.find((a) => a.startsWith('--max='));
// --detail=low|high|ultra picks the geometry LOD the build runs at (default HIGH
// = today's exact geometry, the no-regression baseline). LOW/ULTRA verify the
// detail tier's floor + ceiling: HIGH must equal the historical counts, LOW must
// undercut it, and ULTRA must densify but stay inside its (larger) ceiling.
const detailArg = args.find((a) => a.startsWith('--detail='));
const detail = detailArg ? detailArg.slice(9) : 'high';
// HIGH keeps the shipped 6000 mobile ceiling; ULTRA is an idle-GPU-only level so
// it gets a larger default ceiling (more tris on high-end is the whole point).
const defaultBudget = detail === 'ultra' ? 13000 : 6000;
const BUDGET = maxArg ? Number(maxArg.slice(6)) : defaultBudget;

// --- counting --------------------------------------------------------------
function countTris(obj) {
  let tris = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      if (g.index) tris += g.index.count / 3;
      else if (g.attributes && g.attributes.position) tris += g.attributes.position.count / 3;
    }
  });
  return tris;
}
function dispose(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach((x) => x && x.dispose && x.dispose());
    else if (m && m.dispose) m.dispose();
  });
}

const FORM_NAMES = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
const rows = [];
let rosterTotal = 0;
let over = 0;

for (const key of Object.keys(DRAGONS)) {
  const maxTier = maxTierFor(key);
  for (let tier = 0; tier <= maxTier; tier++) {
    const def = ascendedDef(DRAGONS[key], tier, 0);
    const { group } = buildDragonModel(def, { detail });
    const tris = Math.round(countTris(group));
    dispose(group);
    rosterTotal += tris;
    const ok = tris <= BUDGET;
    if (!ok) over++;
    rows.push({ key, name: FORM_NAMES[tier] || `F${tier}`, tris, ok });
  }
}

// --- report ----------------------------------------------------------------
const padR = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
console.log(`\nDragon Drift — model triangle budget (detail: ${detail.toUpperCase()} · per-form ceiling: ${BUDGET})\n`);
console.log(padR('Dragon', 12) + padR('Form', 11) + padL('Tris', 8) + '  Status');
console.log('-'.repeat(41));
let lastKey = null;
for (const r of rows) {
  const keyCol = r.key === lastKey ? '' : r.key;
  lastKey = r.key;
  console.log(padR(keyCol, 12) + padR(r.name, 11) + padL(r.tris, 8) + '  ' + (r.ok ? 'OK' : 'OVER'));
}
console.log('-'.repeat(41));
console.log(`${rows.length} models · roster total ${rosterTotal} tris · ${over} over budget\n`);

if (ci && over > 0) process.exitCode = 1;
