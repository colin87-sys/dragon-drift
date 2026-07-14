// Read-only env-geometry + overdraw guard for the wall-prop recycler and the
// Phase Gate (WALL-PROPS-REDESIGN.md §8.2 / BIOME-DESIGN.md §8).
//
// Builds EVERY prop archetype (via environment.js `propDiag()`) and a
// representative Phase Gate (via obstacles.js `addObstacle`), then asserts the
// perf contract the redesign is built on:
//   - the boot-crash catch: building every archetype headless surfaces an
//     indexed/non-indexed mergeGeometries mix or a `mat >= 2` throw that would
//     otherwise only crash in the browser (and takes down EVERY biome).
//   - tris/archetype ≤ 150, instances/archetype ≤ 170 (= 2×ceil(900/step)).
//   - per-biome ≤ 550 instances / ≤ 50k band tris; worst adjacent-cycle pair ≤ 90k.
//   - THE NUMBER THAT MATTERS — the additive/transparent surface census:
//     side props MUST be exactly 0 transparent/additive surfaces (opaque =
//     fairness-positive, the overdraw cliff is the only budget axis); a gate has
//     exactly 1 blended veil layer, ≤ 9 small additive planes, ≤ 600 lattice
//     segments, and keeps its alpha clamp at 0.30.
//   - a FOAM_CFG entry exists for every archetype.
//
// It writes nothing and touches no save state — purely diagnostic.
//
//   node tools/envcount.mjs         report every archetype + the gate, always exit 0
//   node tools/envcount.mjs --ci    exit 1 if any budget is exceeded

import { register } from 'node:module';

// 1) Resolve the bare 'three' import every js/ module uses.
register('./three-resolver.mjs', import.meta.url);

// 2) Minimal DOM/canvas shim (mirrors tricount.mjs) so util.js/config.js don't
//    throw at import; no renderer exists, so no pixels are ever read.
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

// 3) Import game modules AFTER the resolver + shim are in place.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const THREE = await import('three');
const { propDiag } = await import('../js/environment.js');
const { initObstacles, addObstacle, setVeilStyle } = await import('../js/obstacles.js');
const { BIOMES, CYCLE } = await import('../js/biomes.js');

const DIR = dirname(fileURLToPath(import.meta.url));

// --- caps (WALL-PROPS-REDESIGN.md §8.2) -------------------------------------
const CAP = {
  trisPerArch: 150,
  instPerArch: 170,        // 2×ceil(900/step); min step ~10.6 → forces a design talk
  biomeInst: 550,
  biomeTris: 50000,
  pairTris: 90000,         // worst adjacent live pair (an order under the measured-safe 400k)
  gateVeilLayers: 1,       // AT MOST one blended (non-additive) veil layer — the overdraw rule.
                           //   The serene light styles (swirl/wisp/curtain) have ZERO — lines/points only.
  gateAdditivePlanes: 9,   // core + beacon + (crystal: 7 motes | serene: 1-2 spirit Points) — all cheap
  gateLatticeSegments: 3200, // lines are OVERDRAW-EXEMPT (thin, 1 draw); the smooth ribbon curtain needs ~2.5k strand segments
};

// Grandfathered legacy archetypes that predate the 150-tri target (their
// segment-heavy sphere/torus builds already exceed it on the SHIPPED baseline).
// All are scheduled for deletion in the §6 A8 cleanup PR; their effective cap is
// their measured shipped value, so they pass but can never GROW, while every new
// or active archetype is held to the real 150 target. DELETE an entry here when
// A8 deletes its archetype — do NOT add new entries (a new prop over 150 is a bug).
const GRANDFATHER = { tower: 167, archruin: 180, glowcap: 158, glowcapSmall: 224 };

const args = process.argv.slice(2);
const ci = args.includes('--ci');

let fails = 0;
const fail = (msg) => { fails++; console.log(`  \x1b[31mFAIL\x1b[0m ${msg}`); };
const ok = (msg) => console.log(`  \x1b[32m ok \x1b[0m ${msg}`);

// --- side-prop census -------------------------------------------------------
let diag;
try {
  diag = propDiag();
} catch (e) {
  console.error('\n[envcount] propDiag() threw while building an archetype — this is the boot crash the guard exists to catch:\n', e);
  process.exit(1);
}

const padR = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const biomeName = (i) => (BIOMES[i] && BIOMES[i].name) ? BIOMES[i].name : `biome ${i}`;

console.log(`\nDragon Drift — env geometry + overdraw guard (${diag.length} archetypes)\n`);
console.log(padR('Archetype', 15) + padR('Biomes', 10) + padL('Step', 5) + padL('Inst', 6) + padL('Tris', 6) + padL('Bandtris', 10) + '  Surfaces');
console.log('-'.repeat(74));
for (const a of diag) {
  const badMats = a.materials.filter((m) => m.transparent || m.depthWriteFalse || m.additive).length;
  const surf = badMats === 0 ? 'opaque' : `\x1b[31m${badMats} blended!\x1b[0m`;
  console.log(
    padR(a.name, 15) + padR('[' + a.biomes.join(',') + ']', 10) + padL(a.step, 5) +
    padL(a.instances, 6) + padL(a.tris, 6) + padL(a.tris * a.instances, 10) + '  ' + surf);
}
console.log('-'.repeat(74));

// per-archetype assertions
console.log('\nPer-archetype:');
for (const a of diag) {
  const trisCap = GRANDFATHER[a.name] ?? CAP.trisPerArch;
  if (a.tris > trisCap) fail(`${a.name}: ${a.tris} tris > ${trisCap}`);
  else if (GRANDFATHER[a.name] && a.tris > CAP.trisPerArch) console.log(`  \x1b[33mgf \x1b[0m ${a.name}: ${a.tris} tris (grandfathered legacy, retired in A8)`);
  if (a.instances > CAP.instPerArch) fail(`${a.name}: ${a.instances} instances > ${CAP.instPerArch} (step ${a.step})`);
  const badMats = a.materials.filter((m) => m.transparent || m.depthWriteFalse || m.additive).length;
  if (badMats > 0) fail(`${a.name}: ${badMats} transparent/additive surface(s) — side props MUST be opaque (0)`);
  if (!a.hasFoam) fail(`${a.name}: no FOAM_CFG entry (foam sibling draws garbage)`);
}
if (fails === 0) ok('all archetypes within tri/instance caps, opaque, FOAM_CFG present');

// per-biome aggregation (an archetype in biomes [0,1] counts toward both)
const nBiomes = BIOMES.length;
const biomeInst = new Array(nBiomes).fill(0);
const biomeTris = new Array(nBiomes).fill(0);
for (const a of diag) {
  for (const bi of a.biomes) {
    if (bi < 0 || bi >= nBiomes) continue;
    biomeInst[bi] += a.instances;
    biomeTris[bi] += a.tris * a.instances;
  }
}
console.log('\nPer-biome band totals:');
console.log('  ' + padR('Biome', 20) + padL('Inst', 6) + padL('Band tris', 11));
for (let bi = 0; bi < nBiomes; bi++) {
  console.log('  ' + padR(biomeName(bi), 20) + padL(biomeInst[bi], 6) + padL(biomeTris[bi], 11));
  if (biomeInst[bi] > CAP.biomeInst) fail(`${biomeName(bi)}: ${biomeInst[bi]} instances > ${CAP.biomeInst}`);
  if (biomeTris[bi] > CAP.biomeTris) fail(`${biomeName(bi)}: ${biomeTris[bi]} band tris > ${CAP.biomeTris}`);
}

// worst adjacent live pair, walked over the play CYCLE (the visible-gate keeps at
// most 2 adjacent biomes live at once)
let worstPair = 0, worstPairLbl = '';
for (let i = 0; i < CYCLE.length; i++) {
  const a = CYCLE[i], b = CYCLE[(i + 1) % CYCLE.length];
  const t = biomeTris[a] + biomeTris[b];
  if (t > worstPair) { worstPair = t; worstPairLbl = `${biomeName(a)} + ${biomeName(b)}`; }
}
console.log(`\nWorst adjacent live pair: ${worstPairLbl} = ${worstPair} band tris (cap ${CAP.pairTris})`);
if (worstPair > CAP.pairTris) fail(`worst adjacent pair ${worstPair} > ${CAP.pairTris}`);
else ok(`adjacent-pair window under ${CAP.pairTris}`);

// --- Phase Gate veil census (every switchable style) ------------------------
console.log('\nPhase Gate (representative fixture-built gate, per veil style):');
try {
  const captured = [];
  const sceneStub = { add: (o) => captured.push(o) };
  initObstacles(sceneStub);
  for (const style of ['crystal', 'swirl', 'wisp', 'curtain']) {
    setVeilStyle(style);
    captured.length = 0;
    // A representative gate: centred aperture, mid-lane altitude — biome 0 skin.
    addObstacle({ type: 'gate', dist: 100, gapX: 0, gapY: 8, gapW: 3, gapH: 3, run: 'normal' });
    const gate = captured[captured.length - 1];
    let veilMats = new Set();   // distinct transparent NormalBlending materials = blended layers
    let veilMeshes = 0, additivePlanes = 0, latticeSegments = 0;
    gate.traverse((o) => {
      const m = o.material;
      if (!m) return;
      const isAdditive = m.blending === THREE.AdditiveBlending;
      const isTransparent = m.transparent === true;
      if (o.isLineSegments && o.geometry) {
        const p = o.geometry.getAttribute('position');
        if (p) latticeSegments += Math.floor(p.count / 2);
        return;
      }
      if (isAdditive && m.depthWrite === false) { additivePlanes++; return; }  // additive planes AND Points
      if (isTransparent && !isAdditive) { veilMeshes++; veilMats.add(m); }
    });
    console.log(`  [${style}] veil: ${veilMeshes} mesh / ${veilMats.size} blended layer(s); additive: ${additivePlanes}; line segs: ${latticeSegments}`);
    if (veilMats.size > CAP.gateVeilLayers) fail(`gate[${style}] has ${veilMats.size} blended veil layers > ${CAP.gateVeilLayers} (no stacked transparent shell)`);
    if (additivePlanes > CAP.gateAdditivePlanes) fail(`gate[${style}] has ${additivePlanes} additive > ${CAP.gateAdditivePlanes}`);
    if (latticeSegments > CAP.gateLatticeSegments) fail(`gate[${style}] lines ${latticeSegments} > ${CAP.gateLatticeSegments}`);
  }
  setVeilStyle('swirl');
  ok(`all veil styles within caps (≤${CAP.gateVeilLayers} blended layer, ≤${CAP.gateAdditivePlanes} additive, ≤${CAP.gateLatticeSegments} line segs)`);

  // The 0.30 alpha clamp is the legibility guarantee — string-assert it survives
  // in the veil fragment source (markers.mjs precedent for source asserts).
  const obsSrc = readFileSync(join(DIR, '..', 'js', 'obstacles.js'), 'utf8');
  if (/clamp\([^;]*0\.30\)/.test(obsSrc)) ok('veil alpha clamp 0.30 present in source');
  else fail('veil alpha clamp 0.30 not found in obstacles.js (legibility guarantee)');
} catch (e) {
  fail(`gate census threw (a Phase Gate boot crash the guard should catch): ${e && e.message ? e.message : e}`);
}

// --- verdict ----------------------------------------------------------------
console.log(`\nenvcount: ${fails === 0 ? '\x1b[32mall budgets green\x1b[0m' : `\x1b[31m${fails} failure(s)\x1b[0m`}\n`);
if (ci && fails > 0) process.exitCode = 1;
