// SLITHER WAVE GATE — the asset-backed serpent's body motion (dragonGlb.js attachSlither)
// is a GPU vertex displacement, so it can't be rendered headlessly (no WebGL in CI). Instead
// we lock the MATH: this mirrors the exact GLSL injected into the body material and asserts the
// traveling-wave invariants numerically, the same way flapcheck.mjs guards the wing beat.
//
//   node tests/slither.mjs
//
// If the GLSL in dragonGlb.js changes, update offsetX() here to match — they are one spec in
// two languages. Asserts: head is ANCHORED (no displacement), the tail reaches full amplitude
// and never exceeds it, the wave OSCILLATES (not a static bend), and the crest TRAVELS head→tail
// over time (a real slither, not a standing wiggle).

let pass = 0, fails = 0;
function check(cond, msg) { if (cond) { pass++; } else { fails++; console.log(`  ✗ ${msg}`); } }

// --- mirror of the GLSL in dragonGlb.js attachSlither() (local mesh axes: +Z head, -Z tail) ---
//   spineT = clamp((spineMax - z) / (spineMax - spineMin), 0, 1)   // 0 head -> 1 tail
//   dx     = amp * spineT * sin(freq*z + waveSpeed*t)
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
function spineT(z, p) { return clamp((p.spineMax - z) / Math.max(1e-4, p.spineMax - p.spineMin), 0, 1); }
function offsetX(z, t, p) { return p.amp * spineT(z, p) * Math.sin(p.freq * z + p.waveSpeed * t); }

// thundercoil's shipped params + its measured spine extent (glb local Z bbox).
const P = { amp: 0.14, freq: 6.5, waveSpeed: 4.0, spineMin: -0.956, spineMax: 0.955 };

// 1) HEAD ANCHORED — spineT==0 at the head, so it never displaces (the head leads, doesn't wag).
let headMax = 0;
for (let t = 0; t < 4; t += 0.05) headMax = Math.max(headMax, Math.abs(offsetX(P.spineMax, t, P)));
check(headMax < 1e-6, `head is anchored (max |dx| ${headMax.toExponential(1)} ≈ 0)`);

// 2) AMPLITUDE BOUNDED + REACHED at the tail — |dx| ≤ amp everywhere, and the tail hits ±amp.
let globalMax = 0, tailMax = 0;
for (let z = P.spineMin; z <= P.spineMax; z += 0.02)
  for (let t = 0; t < 4; t += 0.05) {
    const d = Math.abs(offsetX(z, t, P));
    globalMax = Math.max(globalMax, d);
    if (Math.abs(z - P.spineMin) < 0.03) tailMax = Math.max(tailMax, d);
  }
check(globalMax <= P.amp + 1e-6, `displacement bounded by amp (max ${globalMax.toFixed(3)} ≤ ${P.amp})`);
check(tailMax > 0.95 * P.amp, `tail reaches full amplitude (got ${tailMax.toFixed(3)} of ${P.amp})`);

// 3) OSCILLATES over time — at a fixed mid-body point the sign flips (it's animated, not a frozen bend).
const zMid = -0.4;
let sawPos = false, sawNeg = false;
for (let t = 0; t < 4; t += 0.02) { const d = offsetX(zMid, t, P); if (d > 0.02) sawPos = true; if (d < -0.02) sawNeg = true; }
check(sawPos && sawNeg, `mid-body oscillates over time (sign flips: +${sawPos} -${sawNeg})`);

// 4) CREST TRAVELS head→tail — a point of constant phase satisfies freq*z + waveSpeed*t = const,
//    so z_crest = const - (waveSpeed/freq)*t moves toward -z (the tail) as t grows. Track the
//    argmax of dx along the spine across small time steps; it should march in the -z direction.
function crestZ(t) {
  let best = -2, bz = 0;
  for (let z = P.spineMin; z <= P.spineMax; z += 0.005) { const d = offsetX(z, t, P); if (d > best) { best = d; bz = z; } }
  return bz;
}
let monotone = true, prev = crestZ(0.0);
for (let t = 0.02; t <= 0.30; t += 0.02) { const cz = crestZ(t); if (cz > prev + 1e-6) monotone = false; prev = cz; }
check(monotone, `crest travels head→tail over time (argmax marches toward -z)`);

console.log(`\nSlither wave gate — thundercoil (amp ${P.amp}, freq ${P.freq}, waveSpeed ${P.waveSpeed})`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
