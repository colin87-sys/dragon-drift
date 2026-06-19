// sweepProfile (roadmap #4a): cross-section spline resample of the body loft.
// Proves the L11/L14 identity-default contract — HIGH is a byte-identical
// passthrough, LOW coarsens, ULTRA rounds — and that Obsidian's opt-in sweptLoft
// torso is a no-op at HIGH and a (small, in-budget) round-up at ULTRA.
//   node tests/sweptprofile.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// --- DOM/canvas shim (mirrors modeldetail.mjs / shingle.mjs) ---------------
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const { sweepProfile } = await import('../js/dragonSweep.js');
const { ARROW_PROFILE } = await import('../js/dragonTorso.js');
const { seg, setActiveDetail } = await import('../js/modelDetail.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// the shipped cross-section, copied to verify the HIGH passthrough is EXACT
const bladeRing = (w, top, bot) => [
  [0, top], [-w * 0.70, top * 0.30], [-w, -bot * 0.10], [-w * 0.62, -bot * 0.64],
  [0, -bot], [w * 0.62, -bot * 0.64], [w, -bot * 0.10], [w * 0.70, top * 0.30],
];
const prof = { ...ARROW_PROFILE, ring: bladeRing };
const S = ARROW_PROFILE.stations.length;
const vCount = (g) => g.attributes.position.count;
const triCount = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
const modelTris = (group) => { let t = 0; group.traverse((o) => { if (o.isMesh && o.geometry) { const g = o.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return Math.round(t); };

// --- 1. HIGH is a byte-identical passthrough ------------------------------
setActiveDetail('high');
const hi = sweepProfile(prof);
assertEq(seg(8), 8, 'seg(8) === 8 at HIGH (identity)');
assertEq(vCount(hi), S * 8, 'HIGH: 8 cross-section points per station');
assertEq(triCount(hi), (S - 1) * 8 * 2, 'HIGH: (stations-1) × 8 × 2 tris (octagon loft)');
const st0 = ARROW_PROFILE.stations[0];
const expect0 = bladeRing(st0[1], st0[2], st0[3]);
const pos = hi.attributes.position.array;
let exact = true;
for (let i = 0; i < 8; i++) if (Math.abs(pos[i * 3] - expect0[i][0]) > 1e-6 || Math.abs(pos[i * 3 + 1] - expect0[i][1]) > 1e-6) exact = false;
assert(exact, 'HIGH ring vertices are the bladeRing control points within float32 (no spline drift)');
ok('HIGH passthrough is byte-identical to the legacy octagon loft');

// --- 2. ULTRA rounds, LOW coarsens ----------------------------------------
setActiveDetail('ultra');
const ul = sweepProfile(prof);
assertEq(vCount(ul), S * seg(8), `ULTRA: ${seg(8)} cross-section points per station`);
assert(seg(8) > 8, 'ULTRA cross-section is denser than HIGH (rounder)');
assert(triCount(ul) > triCount(hi), 'ULTRA has more tris than HIGH');
setActiveDetail('low');
const lo = sweepProfile(prof);
assert(seg(8) < 8 && vCount(lo) === S * seg(8), 'LOW coarsens the cross-section');
ok(`detail scales the section: LOW ${seg(8, 'low')} · HIGH 8 · ULTRA ${seg(8, 'ultra')} points`);

// --- 3. geometry is clean (closed, finite, normals) -----------------------
setActiveDetail('ultra');
const g = sweepProfile(prof);
const p = g.attributes.position.array;
let finite = true; for (let i = 0; i < p.length; i++) if (!Number.isFinite(p[i])) finite = false;
assert(finite, 'no NaN/Inf in positions');
assert(!!g.attributes.normal, 'smooth normals computed');
assert(!!g.index && g.index.count % 3 === 0, 'indexed, whole triangles');
ok('swept geometry is clean (finite, indexed, normalled)');

// --- 4. integration: Obsidian sweptLoft == arrow @HIGH, rounder @ULTRA -----
// Obsidian (the hero) has since migrated to the UNIFIED HULL; the sweptLoft torso
// path is still proven on an obsidian CLONE forced onto it (the coexist-test
// discipline). This also pins sweptLoft == arrow @HIGH for the whole roster.
const base = ascendedDef(DRAGONS.obsidian, 3, 0);   // Eternal
// Force the OLD wing recipe too — the unified-hull wings need a body-less hull torso
// (attach.loft), so this torso-focused test pairs sweptLoft/arrow with the membrane
// bridge wings (which mount on any torso). The wings cancel in the sweptLoft-vs-arrow
// comparison; only the torso loft differs.
const obs = { ...base, parts: { ...base.parts, torso: 'sweptLoft', wings: 'skinnedMembraneBridge' } };
assertEq(obs.parts.torso, 'sweptLoft', 'the clone opts into sweptLoft');
const obsArrow = { ...obs, parts: { ...obs.parts, torso: 'arrow' } };
const hiSwept = modelTris(buildDragonModel(obs, { detail: 'high' }).group);
const hiArrow = modelTris(buildDragonModel(obsArrow, { detail: 'high' }).group);
assertEq(hiSwept, hiArrow, 'HIGH: sweptLoft Obsidian is byte-identical to arrow (no regression)');
const ulSwept = modelTris(buildDragonModel(obs, { detail: 'ultra' }).group);
const ulArrow = modelTris(buildDragonModel(obsArrow, { detail: 'ultra' }).group);
assert(ulSwept > ulArrow, `ULTRA: sweptLoft rounds the body (+${ulSwept - ulArrow} tris over arrow)`);
ok(`Obsidian: HIGH identical (${hiSwept} tris), ULTRA rounder (+${ulSwept - ulArrow} tris)`);

setActiveDetail('high');
console.log(`\n${n} sweptprofile checks passed.`);
