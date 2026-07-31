// tests/pitchslew.mjs — VERTICAL POSE regression guard (the "lunge/spasm on up↔down" fix).
//
// Replicates the flight pitch + dive/climb-posture controller math from dragon.js (updateDragon) and
// proves the fix: driving the poses from a SLOW-engage/fast-release smoothed vy (vyPose) and the
// pitch coupling from vySmooth kills the rapid-reversal spasm WHILE leaving committed dives and soft
// input untouched. OLD (raw vy for both) is computed alongside as the contrast / bug-detector.
//   node tests/pitchslew.mjs
const dt = 1 / 60, VERT = 18, MOVEACCEL = 6;
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const ss = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// mode 'old' = poses & pitch on raw vy (pre-fix); 'new' = poses on vyPose, pitch on vySmooth (fix).
function sim(mode, axisAt, frames) {
  let vy = 0, vyPose = 0, vySmooth = 0, gx = 0, prevGx = null;
  let peakRate = 0, minP = Infinity, maxP = -Infinity, poseMax = 0;
  const pitch = [], dive = [];
  for (let f = 0; f < frames; f++) {
    vy = damp(vy, axisAt(f) * VERT, MOVEACCEL, dt);            // player.velocity.y (already 1st-order smoothed)
    vySmooth = damp(vySmooth, vy, 5, dt);
    vyPose = damp(vyPose, vy, Math.abs(vy) > Math.abs(vyPose) ? 3 : 7, dt);
    const poseVy = mode === 'new' ? vyPose : vy;
    const d = ss(9, 16, -poseVy), c = ss(8, 16, poseVy);
    const posturePitch = c * 0.42 - d * 0.5;
    const pitchVy = mode === 'new' ? vySmooth : vy;
    gx = damp(gx, pitchVy * 0.022 + posturePitch, 9, dt);
    if (prevGx !== null) peakRate = Math.max(peakRate, Math.abs(gx - prevGx) / dt);
    prevGx = gx; pitch.push(gx); dive.push(d);
    poseMax = Math.max(poseMax, d + c); minP = Math.min(minP, gx); maxP = Math.max(maxP, gx);
  }
  return { peakRate, p2p: maxP - minP, poseMax, pitch, dive };
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

// 1. RAPID REVERSAL (mash): full up/down flip every 0.35s (21 frames) for 4s.
const flip = (f) => (Math.floor(f / 21) % 2 === 0 ? 1 : -1);
const rOld = sim('old', flip, 240), rNew = sim('new', flip, 240);
console.log(`rapid mash — OLD peakRate ${rOld.peakRate.toFixed(2)} rad/s, p2p ${rOld.p2p.toFixed(2)}, poseMax ${rOld.poseMax.toFixed(2)}`);
console.log(`rapid mash — NEW peakRate ${rNew.peakRate.toFixed(2)} rad/s, p2p ${rNew.p2p.toFixed(2)}, poseMax ${rNew.poseMax.toFixed(2)}`);
ok(rOld.p2p > 0.8 && rOld.poseMax > 0.9, `bug detector: OLD build DOES spasm (pitch swing ${rOld.p2p.toFixed(2)} rad + poses fully flip, poseMax ${rOld.poseMax.toFixed(2)})`);
ok(rNew.peakRate < 2.5, `FIX: rapid mash peak pitch rate ${rNew.peakRate.toFixed(2)} < 2.5 rad/s`);
ok(rNew.p2p < 0.35, `FIX: rapid mash pitch swing ${rNew.p2p.toFixed(2)} < 0.35 rad (was ${rOld.p2p.toFixed(2)})`);
ok(rNew.poseMax < 0.1, `FIX: poses never engage on a mash (peak dive+climb ${rNew.poseMax.toFixed(3)} < 0.1)`);

// 2. SUSTAINED DIVE: hold full down 2.5s — the cinematic pose must still fully commit + match steady state.
const dOld = sim('old', () => -1, 150), dNew = sim('new', () => -1, 150);
ok(dNew.dive[72] > 0.95, `committed dive still commits (diveAmount ${dNew.dive[72].toFixed(2)} > 0.95 by t=1.2s)`);
const relPitch = Math.abs(dNew.pitch[149] - dOld.pitch[149]) / Math.abs(dOld.pitch[149] || 1);
ok(relPitch < 0.05, `sustained-dive steady pitch preserved (Δ ${(relPitch * 100).toFixed(1)}% < 5% vs old)`);

// 3. SOFT vertical: gentle slow bob — must be essentially untouched by the fix (soft "follows well").
const soft = (f) => Math.sin(f * 0.035) * 0.28;
const sOld = sim('old', soft, 220), sNew = sim('new', soft, 220);
let maxDelta = 0; for (let i = 0; i < sOld.pitch.length; i++) maxDelta = Math.max(maxDelta, Math.abs(sNew.pitch[i] - sOld.pitch[i]));
ok(sNew.poseMax < 0.02, `soft vertical never triggers a pose (peak dive+climb ${sNew.poseMax.toFixed(3)} < 0.02)`);
// the only soft-input change is Lever B's gentle pitch-smoothing lag — must stay tiny (≪ the 0.99rad spasm it prevents).
ok(maxDelta < 0.04, `soft vertical pitch essentially unchanged (max Δ ${maxDelta.toFixed(3)} rad < 0.04)`);

console.log(`\nPitch-slew (vertical pose): ${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
