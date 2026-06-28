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
// coord s > minS); they rotate about a body hinge by fth = −side·amp·sin(phase),
// swinging through a SECONDARY axis (local Z for the legacy spine-vertical mesh; local
// Y for an upright mesh, wing.swing:'y'). Everything else (body, and crucially the
// coiled TAIL / low body which also swing wide in X) is mask 0 = identity.
// Returns dx + d2 (the secondary-axis displacement, the one that must read as world up/down).
function flapDelta(x, sec, s, phase, p) {
  const wside = Math.sign(x);
  const wmask = (Math.abs(x) >= p.hingeX && s >= p.minS) ? 1 : 0;
  const fth = -wside * p.amp * Math.sin(phase) * wmask;
  const wdx = x - wside * p.hingeX;
  const wd2 = sec - p.hinge2;
  const fc = Math.cos(fth), fs = Math.sin(fth);
  const nx = wside * p.hingeX + wdx * fc + wd2 * fs;
  const n2 = p.hinge2 - wdx * fs + wd2 * fc;
  return { dx: nx - x, dz: n2 - sec };   // .dz = secondary-axis (out-of-span) displacement
}

const TIP = 0.9;       // a wingtip vert (mesh local |X| max ≈ 0.95), in the wing band
const WING_S = 0.4;    // wing-band spine coord (above minS)
const EXCL_S = -0.6;   // an excluded-band coord (tail/low body) — wide in X, but must NOT flap

// One spec, two swing planes. `p` carries the flap params (hingeX, hinge2, amp, minS);
// `sec` is the secondary-axis coord (local Z for thundercoil, local Y for pyrelord) and
// `.dz` from flapDelta is that secondary displacement — the one that must read as world up/down.
function runFlapChecks(label, p) {
  // 1) BODY ANCHORED — verts within the hinge never displace, at any phase.
  let bodyMax = 0;
  for (let x = -p.hingeX + 0.001; x < p.hingeX; x += 0.02)
    for (let ph = 0; ph < 7; ph += 0.1) {
      const d = flapDelta(x, 0.1, WING_S, ph, p);
      bodyMax = Math.max(bodyMax, Math.abs(d.dx), Math.abs(d.dz));
    }
  check(bodyMax < 1e-9, `${label}: body verts (|x|≤hingeX) never move (max ${bodyMax.toExponential(1)} ≈ 0)`);

  // 2) WING SWINGS — a wingtip vert reaches a real out-of-plane (secondary-axis) displacement.
  let tipZMax = 0;
  for (let ph = 0; ph < 7; ph += 0.05) tipZMax = Math.max(tipZMax, Math.abs(flapDelta(TIP, 0.0, WING_S, ph, p).dz));
  check(tipZMax > 0.05, `${label}: wingtip swings out of plane (max ${tipZMax.toFixed(3)})`);

  // 2b) EXCLUDED BAND — a vert wide in X but BELOW minS (the coiled tail / four legs / low
  //     body) must NEVER flap, or it warps with the wingbeat (the reported bug class).
  let exclMax = 0;
  for (let ph = 0; ph < 7; ph += 0.05) { const d = flapDelta(TIP, 0.0, EXCL_S, ph, p); exclMax = Math.max(exclMax, Math.abs(d.dx), Math.abs(d.dz)); }
  check(exclMax < 1e-9, `${label}: excluded verts (wide X, spine<minS) never flap (max ${exclMax.toExponential(1)} ≈ 0)`);

  // 3) SYMMETRIC BEAT — at any phase the two wingtips move the SAME direction (both wings
  //    rise/fall together; an antisymmetric roll would split them).
  let symmetric = true;
  for (let ph = 0.2; ph < 7; ph += 0.2) {
    const r = flapDelta(TIP, 0.0, WING_S, ph, p).dz;
    const l = flapDelta(-TIP, 0.0, WING_S, ph, p).dz;
    if (Math.abs(r) > 1e-4 && Math.sign(r) !== Math.sign(l)) symmetric = false;
  }
  check(symmetric, `${label}: both wings beat together (matched sign across phases)`);

  // 4) OSCILLATES over time — at a fixed wingtip the displacement flips sign.
  let up = false, down = false;
  for (let ph = 0; ph < 7; ph += 0.02) { const d = flapDelta(TIP, 0.0, WING_S, ph, p).dz; if (d > 0.02) up = true; if (d < -0.02) down = true; }
  check(up && down, `${label}: wingbeat oscillates over time (sign flips: up ${up} down ${down})`);

  // 5) ZERO at phase 0 and π — sin(phase)=0 ⇒ no displacement (a beat, not a held pose).
  const z0 = Math.abs(flapDelta(TIP, 0.0, WING_S, 0, p).dz);
  const zPi = Math.abs(flapDelta(TIP, 0.0, WING_S, Math.PI, p).dz);
  check(z0 < 1e-9 && zPi < 1e-9, `${label}: flat at phase 0/π (${z0.toExponential(1)} / ${zPi.toExponential(1)})`);
}

// thundercoil — legacy X–Z swing (spine-vertical mesh laid flat by rotX −π/2; wings above
// minS along native Y, tail below). hinge2 = hingeZ.
runFlapChecks('thundercoil/Z-swing', { hingeX: 0.28, hinge2: 0.0, amp: 0.55, minS: -0.15 });
// pyrelord — X–Y swing (upright mesh kept level by rotX 0; wingtip swings through local Y =
// world up/down). hinge2 = hingeY. The spine/mask coord is still native Y; wings above minS,
// the four legs + low body below it.
runFlapChecks('pyrelord/Y-swing', { hingeX: 0.3, hinge2: 0.35, amp: 0.5, minS: 0.2 });

console.log(`\nWing-flap gate — thundercoil (Z-swing) + pyrelord (Y-swing)`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
