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

// === CLEAN DRIVE (mirror of driveChain, ins=0) ===
function poseChain(chain, ph0, P) {
  const N = chain.length, moving = N - 1, amp = 1;
  const pv = chain[0].parent;
  pv.rotation.set(0.14, -0.18, P.restDihedral);                 // static placement only
  for (let i = 1; i < N; i++) {
    const f = moving > 1 ? (i - 1) / (moving - 1) : 0;
    const w = flapWarp(ph0 - P.chLag * f);
    // POWER swing, front-loaded + DOWN-biased: the down half presses deeper than the up half lifts.
    const c = Math.cos(w);                                               // +1 top → −1 bottom
    const swing = c >= 0 ? c * P.upScale : c * P.downScale;
    const elev = P.beatAmp * Math.pow(P.taper, i - 1) * swing;
    const up = Math.max(0, -Math.sin(w));                                // recovery window (smooth bump)
    // hand mask peaks at the WRIST BONE (rotating it folds the hand/tip); a tip-bone rotation moves
    // nothing (no children), so the mask is ~0 at f=1. Triangular bump centred on wristFrac.
    const hand = f > 0.95 ? 0 : Math.max(0, 1 - Math.abs(f - P.wristFrac) / (P.handWidth ?? 0.45));
    const flex = -P.flexAmp * up * hand;                                 // subtle hand fold DOWN on upstroke
    const sweep = P.sweepDeg * DEG * Math.sin(w) * f;                    // fwd downstroke / back upstroke
    chain[i].rotation.set(0, sweep, elev * amp + flex);
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
  const tipY = [];
  let maxRT = -1, minRT = 1e9, maxBend = -1, foldPts = null, topPts = null, botPts = null, topY = -1e9, botY = 1e9;
  for (let s = 0; s < SAMPLES; s++) {
    const ph0 = (s / SAMPLES) * TAU;
    poseChain(chain, ph0, P);
    const pts = bonePts(chain);
    tipY.push(pts[TIP].y);
    const rt = rootTip(pts), bd = bend(pts);
    if (rt > maxRT) maxRT = rt;
    if (rt < minRT) minRT = rt;
    if (bd > maxBend) { maxBend = bd; foldPts = pts.map(p => p.clone()); }       // most-flexed = recovery
    if (pts[TIP].y > topY) { topY = pts[TIP].y; topPts = pts.map(p => p.clone()); }
    if (pts[TIP].y < botY) { botY = pts[TIP].y; botPts = pts.map(p => p.clone()); }
  }
  return { tipY, topPts, botPts, foldPts, maxBend, spanShort: (1 - minRT / maxRT) * 100 };
}
function spark(arr) {
  const lo = Math.min(...arr), hi = Math.max(...arr), bars = '▁▂▃▄▅▆▇█';
  return arr.filter((_, i) => i % 3 === 0).map(v => bars[Math.min(7, Math.round((v - lo) / (hi - lo + 1e-9) * 7))]).join('');
}

const arg = process.argv[2];
const BASE = { beatAmp: m.beatAmp ?? 0.34, taper: m.ampTaper ?? 0.78, chLag: m.tipLag ?? 1.0,
  restDihedral: m.restLift ?? 0.06, flexAmp: m.flexAmp ?? 0.5, wristFrac: m.wristFrac ?? 0.5, sweepDeg: m.sweepDeg ?? 14,
  upScale: m.upScale ?? 0.7, downScale: m.downScale ?? 1.3 };
// allow inline overrides: node flexmeasure.mjs '{"chLag":0.6,"flexAmp":0.35}'
if (arg && arg.trim().startsWith('{')) Object.assign(BASE, JSON.parse(arg));

if (arg === 'grid') {
  console.log(`\nGRID: beatAmp × flexAmp (taper ${BASE.taper}, chLag ${BASE.chLag}, wristFrac ${BASE.wristFrac})\n`);
  console.log('beatAmp'.padStart(8) + 'flexAmp'.padStart(8) + 'powerDepth'.padStart(11) + 'topLift'.padStart(9) + 'M-drop'.padStart(8) + 'span-'.padStart(7));
  console.log('-'.repeat(51));
  for (const beatAmp of [0.24, 0.30, 0.36]) {
    for (const flexAmp of [0.3, 0.5, 0.8]) {
      const r = analyze({ ...BASE, beatAmp, flexAmp });
      const root = r.botPts[0].y;
      const powerDepth = root - r.botPts[TIP].y;    // tip below body root at downstroke bottom (>0 = press)
      const topLift = r.topPts[TIP].y - root;
      console.log(String(beatAmp).padStart(8) + String(flexAmp).padStart(8) +
        powerDepth.toFixed(2).padStart(11) + topLift.toFixed(2).padStart(9) +
        (r.maxBend.toFixed(0) + 'd').padStart(8) + (r.spanShort.toFixed(0) + '%').padStart(7));
    }
  }
  console.log('-'.repeat(51));
  console.log('powerDepth = tip below body root at downstroke bottom (bigger = stronger press)');
  console.log('topLift = tip above root at top | bend = max flex angle on the upstroke (the M; subtle ≈ 20-30°)\n');
} else {
  const r = analyze(BASE);
  console.log(`\nFlame Monarch CLEAN cycle  —`, JSON.stringify(BASE), '\n');
  console.log('tip height over the cycle (top→down→bottom→up→top):');
  console.log('  ' + spark(r.tipY) + '   (smooth = no janky jumps)\n');
  const root = r.botPts[0].y;
  console.log('POWER (downstroke bottom):  tip below body by', (root - r.botPts[TIP].y).toFixed(2), '  bend =', bend(r.botPts).toFixed(0) + 'd', '(≈0 = EXTENDED power stroke)');
  console.log('TOP   (apex):               tip above body by', (r.topPts[TIP].y - root).toFixed(2), '  bend =', bend(r.topPts).toFixed(0) + 'd', '(≈0 = re-extended)');
  console.log('RECOVERY (most flexed):     bend =', r.maxBend.toFixed(0) + 'd', '(the M / flex — keep subtle, ~20-30°)   span draw-in', r.spanShort.toFixed(0) + '%\n');
}
