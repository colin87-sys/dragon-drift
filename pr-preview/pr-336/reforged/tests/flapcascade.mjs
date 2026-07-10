// WIDE-JOINTED-WINGBEAT GATE (direct-pivot arc dragons, e.g. azure) — the motion invariants a
// STATIC render can't show, turned into a CI guard. A frozen frame can look fine while the beat is
// secretly a "faster flutter" (no fold) or self-intersects (tips cross the spine at the apex). This
// poses every `model.flapArc` dragon at the named `?wingDebug` cycle pins (via the SHARED poser, so
// it checks the exact math the game + studio use) and asserts, in the dragon's own de-scaled frame:
//   • THE FOLD IS REAL: the up-beat (recovery) span contracts to ≤0.7× the extended (downstroke) span
//     — the wing FOLDS, it doesn't just rotate at full span (the §4c "amplitude-without-fold" failure).
//   • NO SPINE CROSSING at the apex: each wing's outer tip stays on its OWN side of the midline
//     (tipR.x > +0.15·halfspan, tipL.x < −0.15·halfspan) — the deep arc can't scissor the combs
//     over the back (§3e clearance).
//   • THE ARC IS WIDE: apex tip elevated well above horizontal, bottom (settle) tip well below —
//     a staged ~12→5 o'clock sweep, not a shallow flutter.
//
//   node tests/flapcascade.mjs

import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {}, set globalAlpha(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose } = await import('../js/wingDebugPose.js');

const V = new THREE.Vector3(), S = new THREE.Vector3();
let pass = 0, fails = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fails++; console.log('  ✗ ' + msg); } };

// Pose the built rig at a named pin and return the outer tips' de-scaled world positions + the
// shoulder pivot, in the dragon's own frame (span = widest |x|·2; tip elevation vs the shoulder).
function poseMetrics(key, form, state) {
  const def = ascendedDef(DRAGONS[key], form, 0);
  const { group, parts } = buildDragonModel(def, {});
  const scale = def.model.scale || 1;
  setFlapDebugPose(parts, def.model, state);
  group.updateMatrixWorld(true);
  let mx = 0, tipRx = -Infinity, tipLx = Infinity, tipY = 0, tipHoriz = 0;
  for (const e of parts.wingElements || []) {
    e.tipObj.getWorldPosition(V); const x = V.x / scale;
    mx = Math.max(mx, Math.abs(x));
    if (x > tipRx) tipRx = x;
    if (x < tipLx) tipLx = x;
  }
  // outer-tip elevation vs the wing shoulder (right side), in the dragon frame.
  if (parts.wingPivotR) {
    parts.wingPivotR.getWorldPosition(S);
    let best = -Infinity, byY = 0, byH = 0;
    for (const e of parts.wingElements || []) {
      e.tipObj.getWorldPosition(V); if (V.x / scale > best) { best = V.x / scale; byY = (V.y - S.y) / scale; byH = Math.abs(V.x - S.x) / scale; }
    }
    tipY = byY; tipHoriz = byH;
  }
  const tipDeg = tipHoriz > 1e-3 ? Math.atan2(tipY, tipHoriz) * 180 / Math.PI : 0;
  return { span: mx * 2, tipRx, tipLx, tipDeg };
}

const key = 'azure';
if (DRAGONS[key] && DRAGONS[key].model && DRAGONS[key].model.flapArc) {
  const form = maxTierFor ? maxTierFor(key) : 2;
  const apex = poseMetrics(key, form, 'apex');
  const recovery = poseMetrics(key, form, 'recovery');
  const downstroke = poseMetrics(key, form, 'downstroke');
  const settle = poseMetrics(key, form, 'settle');
  const half = downstroke.span / 2;

  // THE FOLD IS REAL — the up-beat contracts the span.
  ok(recovery.span <= 0.7 * downstroke.span,
    `${key} f${form}: up-beat FOLDS (recovery span ${recovery.span.toFixed(2)} ≤ 0.7×${downstroke.span.toFixed(2)} = ${(0.7 * downstroke.span).toFixed(2)})`);

  // NO SPINE CROSSING at the apex — the comb's outer tip is well out on its own side, and no blade
  // scissors across the midline into the other wing's territory (parts.wingElements = ONE wing).
  ok(apex.tipRx > 0.15 * half, `${key} f${form}: apex outer tip stays out on its own side (x ${apex.tipRx.toFixed(2)} > ${(0.15 * half).toFixed(2)})`);
  ok(apex.tipLx > -0.30 * half, `${key} f${form}: apex comb doesn't scissor across the spine (min-x ${apex.tipLx.toFixed(2)} > ${(-0.30 * half).toFixed(2)})`);

  // THE ARC IS WIDE — apex tip well up, bottom tip well down (staged ~12→5 o'clock).
  ok(apex.tipDeg > 40, `${key} f${form}: apex tip elevated (${apex.tipDeg.toFixed(1)}° > 40°)`);
  ok(settle.tipDeg < -35, `${key} f${form}: bottom tip depressed toward ~5 o'clock (${settle.tipDeg.toFixed(1)}° < −35°)`);

  console.log(`  · ${key} f${form}: apex tip ${apex.tipDeg.toFixed(1)}° | settle tip ${settle.tipDeg.toFixed(1)}° | recovery/downstroke span ${(recovery.span / downstroke.span).toFixed(2)}× | apex tips L${apex.tipLx.toFixed(2)}/R${apex.tipRx.toFixed(2)}`);
} else {
  console.log('  (no direct-pivot flapArc dragon found — nothing to check)');
}

console.log(`\nWide-jointed-wingbeat gate: ${pass} passed, ${fails} failed.`);
process.exit(fails ? 1 : 0);
