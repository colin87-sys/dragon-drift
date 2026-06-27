// FLAP-CYCLE ANALYZER — clean two-channel wingbeat, tuned against the research.
// Channel 1 (power): a front-loaded cosine elevation swing — the EXTENDED wing presses below
//   horizontal on the (time-warped, slower) downstroke. Channel 2 (recovery): one SUBTLE flex,
//   a smooth half-sine over the upstroke on the hand-wing only, + a single fore-aft sweep that
//   reaches forward on the downstroke and back on the upstroke. Nothing else.
// Reports the cycle so you can see: power depth (tip below shoulder on the downstroke), the
// subtle recovery flex (wrist slightly above tip), span draw-in, and a tip-height sparkline
// (smoothness). Drive here MIRRORS driveChain in dragon.js / dragonModel.js exactly.
//   node tools/flexmeasure.mjs            → cycle report at the live params
//   node tools/flexmeasure.mjs grid       → sweep beatAmp × flexAmp
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
const flapDF = m.downFrac;
const flapWarp = (flapDF == null) ? (p) => p : (p) => {
  const t = (((p % TAU) + TAU) % TAU) / TAU;
  const u = t < flapDF ? (t / flapDF) * 0.5 : 0.5 + ((t - flapDF) / (1 - flapDF)) * 0.5;
  return u * TAU;
};
const ss = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

// === SHOULDER-DRIVEN DRIVE (mirror of driveChain, ins=0) ===
// The SHOULDER (pivot) carries the big motion: an elevation swing AND a fore-aft protraction/
// retraction (forward+down on the downstroke, up+BACK on the upstroke — the recovery sweep). The
// bones add only a small lagged ripple + the subtle wrist flex. This gives 3D depth (rowing), not
// a flat lateral paddle.
function poseChain(chain, ph0, P) {
  const N = chain.length, moving = N - 1, amp = 1;
  const w0 = flapWarp(ph0);
  const c0 = Math.cos(w0);
  const sElev = P.beatAmp * (c0 >= 0 ? c0 * P.upScale : c0 * P.downScale);   // shoulder elevation
  const sSweep = P.shoulderSweep * DEG * Math.sin(w0);                       // fwd downstroke / back upstroke
  const pv = chain[0].parent;
  pv.rotation.set(0.14, -0.18 + sSweep, P.restDihedral + sElev * amp);
  for (let i = 1; i < N; i++) {
    const f = moving > 1 ? (i - 1) / (moving - 1) : 0;
    const w = flapWarp(ph0 - P.chLag * f);
    const ripple = P.rippleAmp * Math.pow(P.taper, i - 1) * Math.cos(w);     // small lagged secondary ripple
    const up = Math.max(0, -Math.sin(w));                                    // recovery window
    const hand = f > 0.95 ? 0 : Math.max(0, 1 - Math.abs(f - P.wristFrac) / (P.handWidth ?? 0.45));
    const flex = -P.flexAmp * up * hand;                                     // subtle wrist flex on upstroke
    const sweep = P.tipSweep * DEG * Math.sin(w) * f;                        // distal fore-aft (figure-8 loop)
    chain[i].rotation.set(0, sweep, ripple * amp + flex);
  }
}
function bonePts(chain) { chain[0].parent.updateWorldMatrix(true, true); return chain.map((b) => b.getWorldPosition(new THREE.Vector3())); }
const rootTip = (pts) => pts[pts.length - 1].clone().sub(pts[1]).length();
// BEND = deviation from a straight wing (rotation-invariant): angle between the inner-arm segment
// and the hand-wing segment. 0 = perfectly extended; large = folded. Isolates flex from wing angle.
function bend(pts) {
  const wrist = 3, tip = pts.length - 1, base = 1;
  const arm = pts[wrist].clone().sub(pts[base]).normalize();
  const hand = pts[tip].clone().sub(pts[wrist]).normalize();
  return Math.acos(Math.max(-1, Math.min(1, arm.dot(hand)))) / DEG;
}

const { parts } = buildDragonModel(def);
const chain = parts.wingChainR;
if (!chain) { console.log('no wingChainR'); process.exit(1); }
const TIP = chain.length - 1, WRIST = 3, SH = 1;
const SAMPLES = 96;

function analyze(P) {
  const tipY = [], tipZ = [];
  let maxBend = -1, foldPts = null, topPts = null, botPts = null, topY = -1e9, botY = 1e9, maxZ = -1e9, minZ = 1e9;
  for (let s = 0; s < SAMPLES; s++) {
    const ph0 = (s / SAMPLES) * TAU;
    poseChain(chain, ph0, P);
    const pts = bonePts(chain);
    tipY.push(pts[TIP].y); tipZ.push(pts[TIP].z);
    const bd = bend(pts);
    if (bd > maxBend) { maxBend = bd; foldPts = pts.map(p => p.clone()); }       // most-flexed = recovery
    if (pts[TIP].y > topY) { topY = pts[TIP].y; topPts = pts.map(p => p.clone()); }
    if (pts[TIP].y < botY) { botY = pts[TIP].y; botPts = pts.map(p => p.clone()); }
    if (pts[TIP].z > maxZ) maxZ = pts[TIP].z;
    if (pts[TIP].z < minZ) minZ = pts[TIP].z;
  }
  return { tipY, tipZ, topPts, botPts, foldPts, maxBend, foreAft: maxZ - minZ };
}
function spark(arr) {
  const lo = Math.min(...arr), hi = Math.max(...arr), bars = '▁▂▃▄▅▆▇█';
  return arr.filter((_, i) => i % 3 === 0).map(v => bars[Math.min(7, Math.round((v - lo) / (hi - lo + 1e-9) * 7))]).join('');
}

const arg = process.argv[2];
const BASE = { beatAmp: m.beatAmp ?? 0.7, taper: m.ampTaper ?? 0.7, chLag: m.tipLag ?? 1.0,
  restDihedral: m.restLift ?? 0.06, flexAmp: m.flexAmp ?? 0.5, wristFrac: m.wristFrac ?? 0.67,
  shoulderSweep: m.shoulderSweep ?? 35, rippleAmp: m.rippleAmp ?? 0.12, tipSweep: m.tipSweep ?? 10,
  upScale: m.upScale ?? 0.7, downScale: m.downScale ?? 1.3 };
if (arg && arg.trim().startsWith('{')) Object.assign(BASE, JSON.parse(arg));

const r = analyze(BASE);
console.log(`\nFlame Monarch SHOULDER-DRIVEN cycle  —`, JSON.stringify(BASE), '\n');
console.log('tip HEIGHT   (elevation): ' + spark(r.tipY) + '   range', (Math.max(...r.tipY) - Math.min(...r.tipY)).toFixed(2));
console.log('tip FORE-AFT (depth):     ' + spark(r.tipZ) + '   range', r.foreAft.toFixed(2), '  <- shoulder rowing; ~0 = flat lateral paddle\n');
const root = r.botPts[0].y;
console.log('POWER (downstroke):   tip below body', (root - r.botPts[TIP].y).toFixed(2) + ',', 'bend', bend(r.botPts).toFixed(0) + 'd (extended)', '  tip z', r.botPts[TIP].z.toFixed(2));
console.log('TOP   (apex):         tip above body', (r.topPts[TIP].y - root).toFixed(2) + ',', 'bend', bend(r.topPts).toFixed(0) + 'd');
console.log('RECOVERY (flexed):    bend', r.maxBend.toFixed(0) + 'd (the wrist M — subtle)', '  tip z', r.foldPts[TIP].z.toFixed(2), '(vs downstroke z above — should differ = wing drawn back)\n');
