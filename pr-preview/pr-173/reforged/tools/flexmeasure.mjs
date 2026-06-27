// FLEX MEASURE — quantify the flexed-upstroke against the biomechanics research.
// Drives the REAL monarch wing bone-chain through the beat with the WRIST-FLEXION model
// (inverted-V / M-shape: arm extends up+back to a wrist peak, hand-wing folds DOWN/back).
// Reports wrist flex angle, span draw-in, and whether the wrist is the peak (the Λ shape).
//   node tools/flexmeasure.mjs                 → sweep wristFlex at the live wristFrac
//   node tools/flexmeasure.mjs grid            → sweep (wristFrac × wristFlex)
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
const flapDF = m.downFrac, glidePow = m.glidePow ?? 1;
const flapWarp = (flapDF == null) ? (p) => p : (p) => {
  const t = (((p % TAU) + TAU) % TAU) / TAU;
  const u = t < flapDF ? (t / flapDF) * 0.5 : 0.5 + ((t - flapDF) / (1 - flapDF)) * 0.5;
  return u * TAU;
};
const shape = (ph) => { const s = Math.sin(flapWarp(ph)); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(flapWarp(ph))), 0.7);
const sstep = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

// === THE WRIST-FLEXION DRIVE (mirror of the new driveChain in dragon.js / dragonModel.js) ===
function poseChain(chain, ph0, P) {
  const segAmp = (m.segAmp ?? 0.2), segApex = m.segApex ?? 0.12, chLag = m.tipLag ?? 1.6;
  const ampTaper = m.ampTaper ?? 1, apexPitch = m.apexPitch ?? 0, restLift = m.restLift ?? 0;
  const N = chain.length, moving = N - 1, amp = 1, inside = 0;
  const rowR = (m.rowDeg ?? 0) * DEG * Math.sin(flapWarp(ph0));
  const featR = Math.sin(ph0 + Math.PI * 0.55);
  chain[0].parent.rotation.set(0.14 + featR * 0.16, -0.18 + rowR, restLift - 0.10);
  for (let i = 1; i < N; i++) {
    const f = moving > 1 ? (i - 1) / (moving - 1) : 0;
    const lag = chLag * f;
    const ampI = segAmp * Math.pow(ampTaper, i - 1);
    const fold = shape(ph0 - lag) * ampI, apx = apexUp(ph0 - lag) * segApex;
    const upEnv = Math.max(0, -Math.cos(flapWarp(ph0 - lag)));   // the flex envelope (peaks through the recovery)
    const handMask = f <= P.wristFrac ? 0 : sstep((f - P.wristFrac) / (1 - P.wristFrac));
    const wristFold = -P.wristFlex * upEnv * handMask;           // hand-wing folds DOWN/back from the wrist
    const sweepBack = (P.armSweepBack ?? 0) * DEG * upEnv * (0.4 + 0.6 * f);
    chain[i].rotation.set(
      Math.cos(flapWarp(ph0 - lag)) * 0.06 * f - apexPitch * apx,
      rowR * 0.5 * f - sweepBack,
      -(fold * amp) + apx * amp * (1 - 0.7 * handMask) + wristFold + 0.10 * inside * f);
  }
}
function bonePts(chain) { chain[0].parent.updateWorldMatrix(true, true); return chain.map((b) => b.getWorldPosition(new THREE.Vector3())); }
function wristAngle(pts) {
  const wrist = 3, tip = pts.length - 1, base = 1;
  const arm = pts[wrist].clone().sub(pts[base]).normalize();
  const hand = pts[tip].clone().sub(pts[wrist]).normalize();
  return Math.acos(Math.max(-1, Math.min(1, arm.dot(hand)))) / DEG;
}
const rootTip = (pts) => pts[pts.length - 1].clone().sub(pts[1]).length();

const { parts } = buildDragonModel(def);
const chain = parts.wingChainR;
if (!chain) { console.log('no wingChainR — chain not exported'); process.exit(1); }
const SAMPLES = 240;

// For a parameter set, scan the beat: most-extended (max root->tip) vs most-folded (min root->tip).
function evalParams(P) {
  let maxRT = -1, minRT = 1e9, extPts = null, foldPts = null;
  for (let s = 0; s < SAMPLES; s++) {
    const ph0 = (s / SAMPLES) * TAU;
    poseChain(chain, ph0, P);
    const pts = bonePts(chain);
    const rt = rootTip(pts);
    if (rt > maxRT) { maxRT = rt; extPts = pts; }
    if (rt < minRT) { minRT = rt; foldPts = pts; }
  }
  const flex = wristAngle(foldPts) - wristAngle(extPts);
  const spanShort = (1 - minRT / maxRT) * 100;
  // inverted-V check at the folded pose: is the wrist the highest point? (y: base, wrist=bone3, tip)
  const base = foldPts[1].y, wrist = foldPts[3].y, tip = foldPts[foldPts.length - 1].y;
  const isLambda = wrist > base && wrist > tip;
  const drop = wrist - tip;   // how far the hand-wing drops below the wrist peak (world units)
  return { flex, spanShort, isLambda, base, wrist, tip, drop };
}

const arg = process.argv[2];
if (arg === 'grid') {
  console.log(`\nWRIST-FLEXION grid sweep (armSweepBack ${m.armSweepBack ?? 0} deg). Target: flex 30-50 deg, span -20..40%, wrist=peak (Λ)\n`);
  console.log('wristFrac'.padStart(10) + 'wristFlex'.padStart(10) + 'flex'.padStart(8) + 'span-'.padStart(8) + 'Λ?'.padStart(5) + '  wrist>tip drop');
  console.log('-'.repeat(58));
  for (const wristFrac of [0.25, 0.34, 0.45]) {
    for (const wristFlex of [0.8, 1.2, 1.6, 2.0, 2.6]) {
      const r = evalParams({ wristFrac, wristFlex, armSweepBack: m.armSweepBack ?? 25 });
      console.log(String(wristFrac).padStart(10) + String(wristFlex).padStart(10) +
        (r.flex.toFixed(0) + 'd').padStart(8) + (r.spanShort.toFixed(0) + '%').padStart(8) +
        (r.isLambda ? 'yes' : 'NO').padStart(5) + '   ' + r.drop.toFixed(2));
    }
  }
  console.log('-'.repeat(58));
} else {
  const wristFrac = m.wristFrac ?? 0.34, armSweepBack = m.armSweepBack ?? 25;
  console.log(`\nWRIST-FLEXION sweep (wristFrac ${wristFrac}, armSweepBack ${armSweepBack} deg). Target: flex 30-50 deg, span -20..40%, wrist=peak (Λ)\n`);
  console.log('wristFlex'.padStart(10) + 'flex'.padStart(8) + 'span-'.padStart(8) + 'Λ?'.padStart(5) + '  wristY  tipY  drop');
  console.log('-'.repeat(52));
  for (const wristFlex of [0.85, 1.2, 1.6, 2.0, 2.6, 3.2]) {
    const r = evalParams({ wristFrac, wristFlex, armSweepBack });
    const mark = (wristFlex === (m.wristFlex ?? m.curlAmp)) ? '  <- LIVE' : '';
    console.log(String(wristFlex).padStart(10) + (r.flex.toFixed(0) + 'd').padStart(8) +
      (r.spanShort.toFixed(0) + '%').padStart(8) + (r.isLambda ? 'yes' : 'NO').padStart(5) +
      '  ' + r.wrist.toFixed(2) + '  ' + r.tip.toFixed(2) + '  ' + r.drop.toFixed(2) + mark);
  }
  console.log('-'.repeat(52));
  console.log('flex = hand-wing angle change (extended→folded); span- = root→tip draw-in; Λ = wrist is the peak (inverted V)\n');
}
