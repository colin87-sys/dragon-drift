// Headless gates for the GENOME → universal-generator path (the redesign POC,
// CREATURE-SYSTEM-REDESIGN.md). Proves the three claims that the shipped recipe
// system can't make:
//
//   1. ONE generator builds a creature from pure DATA (no per-creature builder).
//   2. TOPOLOGY IS DATA — a totally different appendage list (6 legs, no wings,
//      a different body) builds with ZERO new code.
//   3. DETAIL IS A SEPARATE AXIS — the SAME genome builds denser at 'ultra' than
//      'high' ("ultra mode" is a dial, not a re-author), with body shape preserved.
//   4. MIRROR is exact — a mirrored limb is the x-negation of its source.
//
//   node tests/genome.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

const { buildFromGenome } = await import('../js/buildFromGenome.js');
const { normalizeGenome, SAMPLE_WYVERN } = await import('../js/creatureGenome.js');
const { setActiveDetail } = await import('../js/modelDetail.js');

// ── 1. one generator builds the sample wyvern from data ──────────────────────
setActiveDetail('high');
const wy = buildFromGenome(SAMPLE_WYVERN);
assert(wy.meshes.body, 'wyvern: body mesh built');
assert(wy.meshes.body.geometry.attributes.position.count > 100, 'wyvern: body has real geometry');
assert(wy.stats.vertices > 200, 'wyvern: whole creature has real geometry');

// ── 2. topology-as-data: counts come straight from the appendage list ────────
// SAMPLE_WYVERN: 2 membranes (wingL + mirrored wingR), 2 legs, 2 horn-pairs (=4
// horns), a 12-segment ridge. The generator never hard-codes "two wings".
assertEq(wy.stats.byKind.membrane, 2, 'wyvern: two membrane wings from the list');
assertEq(wy.stats.byKind.leg, 2, 'wyvern: two legs from the list');
assertEq(wy.stats.byKind.horn, 4, 'wyvern: 2 horn pairs → 4 horns');
assertEq(wy.stats.byKind.ridge, 12, 'wyvern: 12 dorsal ridge segments');

// A SECOND creature with a completely different topology — six legs, NO wings, a
// stubbier spine — built by the SAME function with no new builder, no new dial,
// no schema change. This is the unlock the recipe system structurally can't do.
const HEXAPOD = {
  name: 'Ref-Hexapod',
  spine: [
    { id: 'head', p: [0, 0.3, -1.0], w: 0.20, h: 0.22, sq: 0.4 },
    { id: 'thorax', p: [0, 0.3, -0.2], w: 0.50, h: 0.40, sq: 0.5 },
    { id: 'abdomen', p: [0, 0.28, 0.6], w: 0.44, h: 0.46, sq: 0.5 },
    { id: 'tail', p: [0, 0.2, 1.2], w: 0.10, h: 0.12, sq: 0.4 },
  ],
  limbs: [
    { id: 'l1L', from: 'thorax', chain: [[0.3, 0, -0.2], [0.6, -0.5, -0.2]], r: [0.07, 0.03] },
    { id: 'l1R', mirror: 'l1L' },
    { id: 'l2L', from: 'thorax', chain: [[0.3, 0, 0.1], [0.6, -0.5, 0.1]], r: [0.07, 0.03] },
    { id: 'l2R', mirror: 'l2L' },
    { id: 'l3L', from: 'abdomen', chain: [[0.3, 0, 0.5], [0.6, -0.5, 0.5]], r: [0.07, 0.03] },
    { id: 'l3R', mirror: 'l3L' },
  ],
  appendages: [
    { on: 'l1L', kind: 'leg' }, { on: 'l1R', kind: 'leg' },
    { on: 'l2L', kind: 'leg' }, { on: 'l2R', kind: 'leg' },
    { on: 'l3L', kind: 'leg' }, { on: 'l3R', kind: 'leg' },
  ],
  palette: { body: '#3A5F3A' },
};
const hex = buildFromGenome(HEXAPOD);
assertEq(hex.stats.byKind.leg, 6, 'hexapod: six legs, zero new code');
assertEq(hex.stats.byKind.membrane, undefined, 'hexapod: no wings — topology is the list');

// ── 3. detail is a separate axis: ultra > high, same genome ──────────────────
setActiveDetail('ultra');
const wyUltra = buildFromGenome(SAMPLE_WYVERN);
setActiveDetail('high'); // restore
assert(wyUltra.stats.vertices > wy.stats.vertices,
  `ultra denser than high (${wyUltra.stats.vertices} > ${wy.stats.vertices})`);

// shape is preserved across tiers: body bounding box matches within a small eps
// (more triangles, SAME silhouette — the resolution-independence claim).
function bbox(mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox;
}
const bHigh = bbox(wy.meshes.body), bUltra = bbox(wyUltra.meshes.body);
const dx = Math.abs(bHigh.max.x - bUltra.max.x) + Math.abs(bHigh.min.x - bUltra.min.x);
assert(dx < 0.05, `body silhouette preserved high↔ultra (Δx=${dx.toFixed(4)})`);

// ── 4. mirror is exact ───────────────────────────────────────────────────────
const norm = normalizeGenome(SAMPLE_WYVERN);
const wingL = norm.limbs.find((l) => l.id === 'wingL');
const wingR = norm.limbs.find((l) => l.id === 'wingR');
assert(wingR, 'mirror: wingR materialised from mirror:wingL');
for (let i = 0; i < wingL.chain.length; i++) {
  assertEq(wingR.chain[i][0], -wingL.chain[i][0], `mirror: wingR[${i}].x = -wingL[${i}].x`);
  assertEq(wingR.chain[i][1], wingL.chain[i][1], `mirror: wingR[${i}].y unchanged`);
}

console.log('genome POC: all gates passed —',
  `wyvern v=${wy.stats.vertices} (ultra ${wyUltra.stats.vertices}), hexapod legs=${hex.stats.byKind.leg}`);
