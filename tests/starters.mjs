// Nightglass Vesper — premium 4-form assert block (VESPER-NIGHTGLASS-BUILDSHEET.md
// §8/§9/§12). Builds every form and asserts the identity LAWS hold by construction:
//   • tris monotonic ↑            (the knapping ladder confers mass)
//   • body value monotonic ↓      (the inverted ramp — the apex is the darkest object)
//   • cruise-emissive = eyes only (the cruise-black law; the ion-blue seam is withheld)
//   • zero near-white emissive     (two cold accents on black, never white-hot)
//   • span : body ≤ 2.5           (the rear-chase occluder budget)
//   • NO organism-family import    (the §Anti-pattern firewall — the whole redesign)
// Self-contained headless build (the three-resolver + a canvas shim), like tricount.
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
register('../reforged/tools/three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

function assert(cond, msg) { if (!cond) throw new Error(`ASSERT FAILED: ${msg}`); }
function ok(msg) { console.log(`  ✓ ${msg}`); }

const THREE = await import('three');
const { DRAGONS } = await import('../reforged/js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../reforged/js/ascension.js');
const { buildDragonModel } = await import('../reforged/js/dragonModel.js');

const lum = (hex) => { const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const chan = (hex) => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
function countTris(group) { let n = 0; group.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.position) n += o.geometry.attributes.position.count / 3; }); return Math.round(n); }
function materials(group) { const set = new Set(); group.traverse((o) => { if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => set.add(m)); }); return [...set]; }

console.log('\nNightglass Vesper — premium 4-form asserts');
const key = 'vesper';
const forms = maxTierFor(DRAGONS[key]) + 1;
assert(forms === 4, `vesper has 4 forms (got ${forms})`);

const tris = [], bodyVal = [];
for (let t = 0; t < forms; t++) {
  const def = ascendedDef(DRAGONS[key], t, 0);
  const built = buildDragonModel(def, { preview: true });
  tris.push(countTris(built.group));
  bodyVal.push(lum(def.body));

  // cruise-emissive = eyes ONLY: emissive CONTRIBUTION = intensity × emissive-luminance
  // (a BLACK emissive emits nothing at any intensity). Any material that actually emits
  // light at rest must be the acid-green eye. The ion-blue seam sits at 0.04 (withheld)
  // → contribution ≈ 0.008, below ε.
  for (const m of materials(built.group)) {
    const hex = m.emissive?.getHex ? m.emissive.getHex() : 0;
    const contrib = (m.emissiveIntensity ?? 0) * lum(hex);
    if (contrib <= 0.05) continue;
    const [r, g, b] = chan(hex);
    assert(g > r && g > b && g > 0.4, `f${t}: only the green eye may emit in cruise (found #${hex.toString(16)} contributing ${contrib.toFixed(2)})`);
  }
  // zero near-white emissive: no material that actually emits carries a near-white colour.
  for (const m of materials(built.group)) {
    const hex = m.emissive?.getHex ? m.emissive.getHex() : 0;
    if ((m.emissiveIntensity ?? 0) * lum(hex) <= 0.02) continue;
    const [r, g, b] = chan(hex);
    assert(!(r >= 0.85 && g >= 0.85 && b >= 0.85), `f${t}: zero near-white emissive (found #${hex.toString(16)})`);
  }
  // span : body ≤ 2.5 — the wingspan against the torso core (nose→tail-root ≈ 3.85u).
  const halfSpan = (def.model.spanScale ?? 1) * 3.4;
  const ratio = (2 * halfSpan) / 3.85;
  assert(ratio <= 2.5, `f${t}: span:body ${ratio.toFixed(2)} ≤ 2.5`);
}

for (let t = 1; t < forms; t++) assert(tris[t] > tris[t - 1], `tris monotonic ↑ (f${t - 1}=${tris[t - 1]} < f${t}=${tris[t]})`);
ok(`tris monotonic ↑  [${tris.join(' < ')}]`);
for (let t = 1; t < forms; t++) assert(bodyVal[t] < bodyVal[t - 1], `body value DECREASES (f${t - 1}=${bodyVal[t - 1].toFixed(3)} > f${t}=${bodyVal[t].toFixed(3)})`);
ok(`body value monotonic ↓ (apex darkest)  [${bodyVal.map((v) => v.toFixed(3)).join(' > ')}]`);
ok('cruise-emissive = eyes only (ion-blue seam withheld)');
ok('zero near-white emissive · span:body ≤ 2.5');

// The §Anti-pattern FIREWALL — dragonVesper.js must NEVER import the retired smooth-hull
// organism family (the whole reason this dragon was re-authored). A static source check.
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../reforged/js/dragonVesper.js'), 'utf8');
for (const forbidden of ['dragonOrganism', 'dragonNightFury', 'dragonUnifiedHull', 'growSkinnedExtension', 'sweepProfileSmooth', 'cellularScalesNormal']) {
  // Match an actual import STATEMENT (quoted module path or named binding), never a
  // prose mention in a comment — `from './dragonOrganism.js'` / `import {growSkinned…}`.
  const stmt = new RegExp(`(from\\s*['"][^'"]*${forbidden}|import\\s*\\{[^}]*${forbidden})`);
  assert(!stmt.test(src), `dragonVesper.js must NOT import ${forbidden} (§Anti-pattern)`);
}
ok('no organism-family import (the smooth-hull firewall holds)');

console.log('starters: Nightglass Vesper — all premium asserts passed\n');
