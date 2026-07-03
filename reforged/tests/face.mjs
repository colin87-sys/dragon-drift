// creatureFace gates — the living-face charisma layer (creatureFace.js) builds
// headlessly, stays inside its triangle budget, advances its state machine, and
// mounts through the hull additively (a def WITHOUT design.face is byte-identical;
// a def WITH it swaps the legacy dot-eyes for the face and returns parts.face).
//   node tests/face.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const { buildCreatureFace } = await import('../js/creatureFace.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel, makePreviewTick } = await import('../js/dragonModel.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

const countTris = (obj) => {
  let tris = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
  });
  return tris;
};

// ── standalone build ─────────────────────────────────────────────────────────
{
  const face = buildCreatureFace({ eyeX: 0.24, eyeY: 0.35, eyeZ: -2.4 }, { eye: 0x8ed5ff, horn: 0x445566 });
  assert(face.group && face.tick && face.setGaze && face.notice && face.setMood, 'face exposes the full contract');
  ok('contract: group/tick/setGaze/notice/setMood');

  const tris = countTris(face.group);
  assert(tris > 0 && tris <= 600, `face tri budget: ${tris} ≤ 600`);
  ok(`tri budget ${tris} ≤ 600`);

  // Eye whites are HDR-hot + toneMapped=false (L125 law #4).
  let hot = 0;
  face.group.traverse((o) => { if (o.isMesh && o.material.toneMapped === false && o.material.color.r > 1) hot++; });
  assert(hot >= 2, 'both eye whites are HDR-overdriven with toneMapped=false');
  ok('eye whites HDR-overdriven, toneMapped=false');

  // The state machine advances: a notice() pinches the pupils within a few ticks.
  face.notice();
  for (let i = 0; i < 30; i++) face.tick(1 / 60, i / 60);
  const pupil = face.group.getObjectByName('creatureFace') ? null : null;
  let minScale = 1;
  face.group.traverse((o) => { if (o.userData.rest) minScale = Math.min(minScale, o.scale.x); });
  assert(minScale < 0.85, `notice() constricts pupils (scale ${minScale.toFixed(2)})`);
  ok(`notice() constricts pupils (${minScale.toFixed(2)})`);

  // Gaze pursuit: feeding a hard-right target moves pupils +x over time.
  const face2 = buildCreatureFace({ eyeX: 0.24, eyeY: 0.35, eyeZ: -2.4 }, {});
  const p0 = [];
  face2.group.traverse((o) => { if (o.userData.rest) p0.push(o.position.x); });
  face2.setGaze(1, 0);
  for (let i = 0; i < 60; i++) face2.tick(1 / 60, i / 60);
  const p1 = [];
  face2.group.traverse((o) => { if (o.userData.rest) p1.push(o.position.x); });
  assert(p1.every((x, i) => x > p0[i]), 'gaze target pulls both pupils toward it');
  ok('lagged gaze pursuit moves the pupils');
}

// ── hull integration: additive-nullable ──────────────────────────────────────
{
  // WITHOUT design.face: the shipped hull starter builds with NO creatureFace node
  // and the same tri count as always (byte-identical path).
  const plain = buildDragonModel(ascendedDef(DRAGONS.fire, 2, 0), {});
  assert(!plain.group.getObjectByName('creatureFace'), 'no face node without design.face');
  assertEq(plain.parts.face, null, 'parts.face is null without design.face');
  ok('shipped hull dragon: no face, parts.face null');
  const plainTris = countTris(plain.group);

  // WITH design.face (a cloned def): the face mounts, parts.face works, and the
  // legacy dot-eyes are skipped (the face REPLACES them, not stacks on top).
  const def = JSON.parse(JSON.stringify({ ...DRAGONS.fire, design: { heroFeature: 'test', face: {} } }));
  def.hull.profile = DRAGONS.fire.hull.profile;   // JSON clone drops nothing here, but keep the live ref like ascendedDef does
  const built = buildDragonModel(ascendedDef(def, 2, 0), {});
  const node = built.group.getObjectByName('creatureFace');
  assert(node, 'face node mounts when design.face is declared');
  assert(built.parts.face && typeof built.parts.face.tick === 'function', 'parts.face exposes the handle');
  ok('design.face mounts the living face + parts.face handle');

  const faceTris = countTris(built.group);
  assert(Math.abs(faceTris - plainTris) < 900, `face swap stays near the legacy eye cost (Δ ${Math.round(faceTris - plainTris)} tris)`);
  ok(`tri delta vs legacy eyes: ${Math.round(faceTris - plainTris)}`);

  // Preview tick drives the face + previewPose without throwing.
  def.model = { ...def.model, previewPose: { headYaw: 0.26, wingFoldDelta: 0.08, tailSway: 0.12 } };
  const prev = buildDragonModel(ascendedDef(def, 2, 0), { preview: true });
  const tick = makePreviewTick(ascendedDef(def, 2, 0), prev);
  for (let i = 0; i < 20; i++) tick(i / 30);
  ok('makePreviewTick drives face + previewPose headlessly');
}

console.log(`\nface: ${n} checks passed.`);
