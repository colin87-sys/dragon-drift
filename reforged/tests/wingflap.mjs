// WING-FLAP GATE — the asset-backed fused winged serpent flaps its wings with a GPU
// vertex deform (dragonGlb.js attachBodyDeform, the `flap` branch), so it can't be
// rendered headlessly (no WebGL in CI). As with slither.mjs we lock the MATH: this
// mirrors the exact GLSL injected into the body material and asserts the flap
// invariants numerically.
//
//   node tests/wingflap.mjs
//
// If the GLSL in dragonGlb.js changes, update flapDelta() here to match — they are one
// spec in two languages. Asserts: BODY verts (|x|≤hingeX) never move; WING verts swing;
// the beat is SYMMETRIC (both wings rise together through local Z); it OSCILLATES over
// time; and at phase 0/π there is zero displacement (a true beat, not a static dihedral).

let pass = 0, fails = 0;
function check(cond, msg) { if (cond) { pass++; } else { fails++; console.log(`  ✗ ${msg}`); } }

// --- mirror of the flap GLSL in dragonGlb.js attachBodyDeform() (local mesh axes) ---
// Wing verts are wide in X (|localX| > hingeX) AND in the front/shoulder band (spine
// coord s > minS); they rotate about a fore-aft hinge (local Y, at localX=±hingeX) by
// fth = −side·amp·sin(phase), swinging through local X/Z. Everything else (body, and
// crucially the coiled TAIL which also swings wide in X) is mask 0 = identity.
function flapDelta(x, z, s, phase, p) {
  const wside = Math.sign(x);
  const wmask = (Math.abs(x) >= p.hingeX && s >= p.minS) ? 1 : 0;
  const fth = -wside * p.amp * Math.sin(phase) * wmask;
  const wdx = x - wside * p.hingeX;
  const wdz = z - p.hingeZ;
  const fc = Math.cos(fth), fs = Math.sin(fth);
  const ndx = (wside * p.hingeX + wdx * fc + wdz * fs) - x;
  const ndz = (p.hingeZ - wdx * fs + wdz * fc) - z;
  const tilt = p.tilt || 0;   // rotates the beat plane toward the spine axis (dy); 0 = shipped beat
  return { dx: ndx, dz: ndz * Math.cos(tilt), dy: ndz * Math.sin(tilt) };
}

// thundercoil's shipped flap params (def.glb.wing). Spine coord s = native Y (head +Y →
// tail −Y); wings sit above minS, the tail below it.
const P = { hingeX: 0.28, hingeZ: 0.0, amp: 0.55, minS: -0.15 };
const TIP = 0.9;       // a wingtip vert (mesh local |X| max ≈ 0.95), in the wing band
const WING_S = 0.4;    // wing-band spine coord
const TAIL_S = -0.6;   // tail spine coord (wide in X, but must NOT flap)

// 1) BODY ANCHORED — verts within the hinge never displace, at any phase.
let bodyMax = 0;
for (let x = -P.hingeX + 0.001; x < P.hingeX; x += 0.02)
  for (let ph = 0; ph < 7; ph += 0.1) {
    const d = flapDelta(x, 0.1, WING_S, ph, P);
    bodyMax = Math.max(bodyMax, Math.abs(d.dx), Math.abs(d.dz));
  }
check(bodyMax < 1e-9, `body verts (|x|≤hingeX) never move (max ${bodyMax.toExponential(1)} ≈ 0)`);

// 2) WING SWINGS — a wingtip vert reaches a real out-of-plane (local Z) displacement.
let tipZMax = 0;
for (let ph = 0; ph < 7; ph += 0.05) tipZMax = Math.max(tipZMax, Math.abs(flapDelta(TIP, 0.0, WING_S, ph, P).dz));
check(tipZMax > 0.05, `wingtip swings out of plane (max |dz| ${tipZMax.toFixed(3)})`);

// 2b) TAIL EXCLUDED — a vert wide in X but BELOW the wing band (the coiled tail) must
//     NEVER flap, or it warps with the wingbeat (the reported bug).
let tailMax = 0;
for (let ph = 0; ph < 7; ph += 0.05) { const d = flapDelta(TIP, 0.0, TAIL_S, ph, P); tailMax = Math.max(tailMax, Math.abs(d.dx), Math.abs(d.dz)); }
check(tailMax < 1e-9, `tail verts (wide X, spine<minS) never flap (max ${tailMax.toExponential(1)} ≈ 0)`);

// 3) SYMMETRIC BEAT — at any phase the two wingtips move the SAME direction in local Z
//    (both wings rise/fall together; an antisymmetric roll would split them).
let symmetric = true;
for (let ph = 0.2; ph < 7; ph += 0.2) {
  const r = flapDelta(TIP, 0.0, WING_S, ph, P).dz;
  const l = flapDelta(-TIP, 0.0, WING_S, ph, P).dz;
  if (Math.abs(r) > 1e-4 && Math.sign(r) !== Math.sign(l)) symmetric = false;
}
check(symmetric, `both wings beat together (matched dz sign across phases)`);

// 4) OSCILLATES over time — at a fixed wingtip the local-Z displacement flips sign.
let up = false, down = false;
for (let ph = 0; ph < 7; ph += 0.02) { const d = flapDelta(TIP, 0.0, WING_S, ph, P).dz; if (d > 0.02) up = true; if (d < -0.02) down = true; }
check(up && down, `wingbeat oscillates over time (sign flips: up ${up} down ${down})`);

// 5) ZERO at phase 0 and π — sin(phase)=0 ⇒ no displacement (a beat, not a held pose).
const z0 = Math.abs(flapDelta(TIP, 0.0, WING_S, 0, P).dz);
const zPi = Math.abs(flapDelta(TIP, 0.0, WING_S, Math.PI, P).dz);
check(z0 < 1e-9 && zPi < 1e-9, `flat at phase 0/π (|dz| ${z0.toExponential(1)} / ${zPi.toExponential(1)})`);

// 6) FLAP TILT (uFlapTilt) — additive knob; tilt 0 is BYTE-IDENTICAL to the shipped beat (no spine-axis
//    displacement), and tilt 90° routes the entire depth swing into the spine axis (dy) with dz → 0.
const flat = flapDelta(TIP, 0.0, WING_S, Math.PI / 2, P);             // P has no tilt → tilt 0
check(Math.abs(flat.dy) < 1e-12, `tilt 0 leaves the shipped beat unchanged (no spine motion, dy ${flat.dy.toExponential(1)})`);
const tilted = flapDelta(TIP, 0.0, WING_S, Math.PI / 2, { ...P, tilt: Math.PI / 2 });
check(Math.abs(tilted.dz) < 1e-9 && Math.abs(tilted.dy) > 0.05,
  `tilt 90° routes the swing into the spine axis (dz ${tilted.dz.toExponential(1)} → 0, dy ${tilted.dy.toFixed(3)})`);

console.log(`\nWing-flap gate — thundercoil (hingeX ${P.hingeX}, amp ${P.amp})`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
