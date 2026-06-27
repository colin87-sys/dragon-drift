// FLEX MEASURE — quantify the flexed-upstroke: drive the REAL monarch wing bone-chain
// through the beat and measure the wrist fold ANGLE + span shortening, vs the biomechanics
// research (hand-wing flex 30-50 deg, span -20..40%, area -30..50%).
//   node tools/flexmeasure.mjs [curlAmp ...]   (defaults: sweep a few values incl. the live 0.85)
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => s.has(k) ? s.get(k) : null, setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const def = ascendedDef(DRAGONS.flameMonarch, 3, 0);
const m = def.model;
const flapDF = m.downFrac;                      // 0.58 for monarch
const glidePow = m.glidePow ?? 1;
const flapWarp = (flapDF == null) ? (p) => p : (p) => {
  const t = (((p % TAU) + TAU) % TAU) / TAU;
  const u = t < flapDF ? (t / flapDF) * 0.5 : 0.5 + ((t - flapDF) / (1 - flapDF)) * 0.5;
  return u * TAU;
};
const shape = (ph) => { const s = Math.sin(flapWarp(ph)); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(flapWarp(ph))), 0.7);

// Drive the chain EXACTLY as dragon.js driveChain (bank=0 → ins=0, debug neutralised: cBias/rFold=0).
function poseChain(chain, ph0, curlAmp) {
  const segAmp = (m.segAmp ?? 0.2), segApex = m.segApex ?? 0.12, chLag = m.tipLag ?? 1.6;
  const ampTaper = m.ampTaper ?? 1, apexPitch = m.apexPitch ?? 0, restLift = m.restLift ?? 0;
  const N = chain.length, moving = N - 1, amp = 1, inside = 0;
  const rowR = (m.rowDeg ?? 0) * DEG * Math.sin(flapWarp(ph0));
  const featR = Math.sin(ph0 + Math.PI * 0.55);
  const baseZ = -0.10;
  chain[0].parent.rotation.set(0.14 + featR * 0.16, -0.18 + rowR, restLift + baseZ);
  for (let i = 1; i < N; i++) {
    const f = moving > 1 ? (i - 1) / (moving - 1) : 0;
    const lag = chLag * f;
    const ampI = segAmp * Math.pow(ampTaper, i - 1);
    const fold = shape(ph0 - lag) * ampI, apx = apexUp(ph0 - lag) * segApex;
    const curl = curlAmp * Math.max(0, -Math.cos(flapWarp(ph0 - lag))) * f * f;
    chain[i].rotation.set(
      Math.cos(flapWarp(ph0 - lag)) * 0.06 * f - apexPitch * apx,
      rowR * 0.5 * f,
      -(fold * amp) + apx * amp + curl + 0.10 * inside * f);
  }
}

// World positions of every bone in the chain (after FK).
function bonePts(chain) {
  chain[0].parent.updateWorldMatrix(true, true);
  return chain.map((b) => b.getWorldPosition(new THREE.Vector3()));
}
// wrist fold angle = angle between inner-arm dir (bone1->wrist) and hand-wing dir (wrist->tip).
// boneFracs [0,0.16,0.34,0.55,0.80]: bone0 static root, bone3=wrist(0.55, ~"medial wrist"), bone4=tip.
function wristAngle(pts) {
  const wrist = 3, tip = pts.length - 1, base = 1;
  const arm = pts[wrist].clone().sub(pts[base]).normalize();
  const hand = pts[tip].clone().sub(pts[wrist]).normalize();
  return Math.acos(Math.max(-1, Math.min(1, arm.dot(hand)))) / DEG;   // deg; 0 = colinear/extended
}
const rootTip = (pts) => pts[pts.length - 1].clone().sub(pts[1]).length();   // structural span (fold-sensitive)
const horizReach = (pts) => Math.abs(pts[pts.length - 1].x - pts[1].x);      // x silhouette reach (lateral wingspan)
// crude planform area: sum of |segment_x · segment_chord| isn't available from bones alone, so
// approximate the wing as the chain polyline and take the lateral-extent × mean-depth box per
// segment projected to the ground (xz) plane — captures how folding pulls area in.
const planform = (pts) => {
  let a = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const dx = Math.abs(pts[i + 1].x - pts[i].x);     // lateral run of this segment
    const len = pts[i + 1].clone().sub(pts[i]).length();
    a += dx * len;                                     // wider+longer-when-flat → shrinks as it folds up/in
  }
  return a;
};

const curlList = process.argv.slice(2).map(Number).filter((x) => !Number.isNaN(x));
const sweep = curlList.length ? curlList : [0.5, 0.85, 1.2, 1.6, 2.0];

// Build ONCE; we re-pose the same chain per curlAmp + per phase.
const { parts } = buildDragonModel(def);
const chain = parts.wingChainR;
if (!chain) { console.log('no wingChainR'); process.exit(1); }

console.log(`\nFlame Monarch flexed-upstroke MEASUREMENT  (downFrac ${flapDF}, ampTaper ${m.ampTaper}, tipLag ${m.tipLag})`);
console.log('Research target: wrist flex 30-50 deg | span -20..40% | area -30..50%\n');
console.log('curlAmp'.padStart(8) + 'wristFlex'.padStart(11) + 'latSpan-'.padStart(10) + 'area-'.padStart(8) + 'structSpan-'.padStart(12) + 'foldWrist'.padStart(11));
console.log('-'.repeat(60));
const SAMPLES = 240;
for (const curlAmp of sweep) {
  // most-extended pose = max lateral reach (the power-stroke silhouette); most-folded = min lateral reach.
  let maxLat = -1, minLat = 1e9, extPts = null, foldPts = null;
  for (let s = 0; s < SAMPLES; s++) {
    const ph0 = (s / SAMPLES) * TAU;
    poseChain(chain, ph0, curlAmp);
    const pts = bonePts(chain);
    const lat = horizReach(pts);
    if (lat > maxLat) { maxLat = lat; extPts = pts; }
    if (lat < minLat) { minLat = lat; foldPts = pts; }
  }
  const extW = wristAngle(extPts), foldW = wristAngle(foldPts);
  const flex = foldW - extW;
  const latShort = (1 - horizReach(foldPts) / horizReach(extPts)) * 100;
  const areaShort = (1 - planform(foldPts) / planform(extPts)) * 100;
  const structShort = (1 - rootTip(foldPts) / rootTip(extPts)) * 100;
  const mark = (curlAmp === (m.curlAmp)) ? '  <- LIVE' : '';
  console.log(
    String(curlAmp).padStart(8) +
    (flex.toFixed(1) + 'd').padStart(11) +
    (latShort.toFixed(0) + '%').padStart(10) +
    (areaShort.toFixed(0) + '%').padStart(8) +
    (structShort.toFixed(0) + '%').padStart(12) +
    (foldW.toFixed(0) + 'd').padStart(11) + mark);
}
console.log('-'.repeat(60));
console.log('wristFlex = (fold - extended) angle inner-arm vs hand-wing at the wrist bone (span 0.55)');
console.log('latSpan- = lateral (x) wingspan shortening | area- = planform area shortening | structSpan- = root->tip distance shortening');
console.log('compared between the most-extended and most-folded poses across the beat\n');
