// Design-law gate (docs/DRAGON-DESIGN-SYSTEM.md §4) — enforces the measurable design
// checks on every dragon that declares a `design:` block, and tests the GATE ITSELF
// with fixtures: a known-good profile must PASS every data law (the laws are
// satisfiable) and known-broken variants must FAIL their law (the gate catches real
// violations, not just vibes). The shipped roster is grandfathered — reported by
// tools/designcheck.mjs, never failed here.
//   node tests/designgate.mjs
import { assert, assertEq } from './shim.mjs';
import {
  designKeys, checkAll, THRESHOLDS,
  tailTaper, headRatio, massBins, spineLaw, wingLaw, paletteDeltas,
  negativeSpace, silhouetteDistance,
} from '../tools/designcheckCore.mjs';

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// ── fixture: a profile authored to the §6 proportion tables ─────────────────────
// Small-head (majestic mode), deep chest, pinched hip, 10:1 tail taper, S-curve cy.
const GOOD_PROFILE = {
  stations: [
    [-3.00, 0.06, 0.05, 0.05, 0.02],
    [-2.60, 0.16, 0.13, 0.14, 0.05],
    [-2.20, 0.20, 0.17, 0.18, 0.08],   // skull base (headBackZ)
    [-1.80, 0.28, 0.25, 0.30, 0.11],
    [-1.40, 0.42, 0.38, 0.50, 0.13],
    [-0.90, 0.55, 0.46, 0.62, 0.12],   // chest peak
    [-0.40, 0.52, 0.44, 0.58, 0.08],
    [0.20, 0.40, 0.36, 0.44, 0.02],
    [0.50, 0.30, 0.29, 0.33, -0.04],
    [0.90, 0.33, 0.28, 0.34, -0.10],   // haunch
    [1.30, 0.26, 0.24, 0.26, -0.15],
    [1.50, 0.20, 0.20, 0.20, -0.19],   // tail base
    [2.20, 0.13, 0.13, 0.12, -0.26],
    [2.90, 0.08, 0.08, 0.07, -0.28],
    [3.50, 0.04, 0.04, 0.04, -0.20],
    [4.00, 0.02, 0.02, 0.02, -0.05],   // tip
  ],
};
const ANCHORS = { headBackZ: -2.2, chestZ: [-1.4, 0.2], hipZ: [0.5, 1.3], tailBaseZ: 1.5 };
const GOOD_WING = {
  tips: [[4.2, 0.4], [3.4, -0.7], [2.4, -1.15], [1.4, -1.2], [0.8, -1.0]],
  lead: [2.9, 0.6],
};
const GOOD_PALETTE = { dominant: '#20304a', secondary: '#7fb2d9', accent: '#ffe27a' };

// ── the laws are SATISFIABLE: the good fixture passes every data check ──────────
{
  const taper = tailTaper(GOOD_PROFILE, ANCHORS.tailBaseZ);
  assert(taper >= THRESHOLDS.A1.tailTaper, `A1 satisfiable: taper ${taper.toFixed(1)} ≥ ${THRESHOLDS.A1.tailTaper}`);
  ok(`A1 good fixture passes (taper ${taper.toFixed(1)}:1)`);

  const hr = headRatio(GOOD_PROFILE, ANCHORS.headBackZ);
  assert(hr <= THRESHOLDS.A2.smallHead, `A2 satisfiable: head ratio ${hr.toFixed(3)} ≤ ${THRESHOLDS.A2.smallHead}`);
  ok(`A2 good fixture passes small-head mode (${hr.toFixed(3)})`);

  const m = massBins(GOOD_PROFILE, ANCHORS);
  assert(m.chest > m.hip && m.hip > m.head, 'S3 mass ordering chest > hip > head');
  assert(m.chest / m.hip >= THRESHOLDS.D1.chestHip, `D1 satisfiable: chest:hip ${(m.chest / m.hip).toFixed(2)}`);
  assert(m.chest / m.hip >= THRESHOLDS.S3.adjRatio && m.hip / m.head >= THRESHOLDS.S3.adjRatio, 'S3 adjacent ratios ≥ 1.3');
  ok(`S3/D1 good fixture passes (chest ${m.chest.toFixed(3)} · hip ${m.hip.toFixed(3)} · head ${m.head.toFixed(3)})`);

  const s = spineLaw(GOOD_PROFILE);
  assert(s.maxKinkDeg <= THRESHOLDS.D3.maxKinkDeg, `D3 continuity: max kink ${s.maxKinkDeg.toFixed(1)}°`);
  assert(s.inflections >= THRESHOLDS.D3.minInflections, `D3 inflections ${s.inflections} ≥ 1`);
  assert(s.bendDeg >= THRESHOLDS.D3.bendMin && s.bendDeg <= THRESHOLDS.D3.bendMax, `D3 bend ${s.bendDeg.toFixed(1)}° in 30–60`);
  ok(`D3 good fixture passes (bend ${s.bendDeg.toFixed(1)}° · ${s.inflections} inflections)`);

  const w = wingLaw(GOOD_WING);
  assert(w.fingers >= THRESHOLDS.D2.fingersMin && w.chordRatio >= THRESHOLDS.D2.chordMin && w.concave,
    `D2 wing data: fingers ${w.fingers} · chord ${w.chordRatio.toFixed(2)} · concave ${w.concave}`);
  ok(`D2 good wing passes (fingers ${w.fingers} · chord ${w.chordRatio.toFixed(2)} · concave)`);

  const p = paletteDeltas(GOOD_PALETTE);
  assert(p.dDomSec >= THRESHOLDS.C2.dLmin && p.dSecAcc >= THRESHOLDS.C2.dLmin,
    `C2 palette: ΔL ${p.dDomSec.toFixed(1)} / ${p.dSecAcc.toFixed(1)}`);
  ok(`C2 good palette passes (ΔL ${p.dDomSec.toFixed(1)} / ${p.dSecAcc.toFixed(1)})`);
}

// ── the gate CATCHES violations: broken fixtures fail their law ─────────────────
{
  // A1 — a sausage: fat tail tip, taper collapses.
  const sausage = { stations: GOOD_PROFILE.stations.map((s) => s.slice()) };
  sausage.stations[sausage.stations.length - 1][1] = 0.10;
  assert(tailTaper(sausage, ANCHORS.tailBaseZ) < THRESHOLDS.A1.tailTaper, 'A1 catches the sausage tail');
  ok('A1 fails a sausage-tapered tail');

  // A2 — the mushy middle: head neither big nor small.
  const hr = headRatio(GOOD_PROFILE, -1.8);   // head length 1.2 of 7.0 ≈ 0.171
  assert(hr > THRESHOLDS.A2.smallHead && hr < THRESHOLDS.A2.bigHead, 'A2 catches the middle band');
  ok(`A2 fails the mushy-middle head (${hr.toFixed(3)})`);

  // D1 — hip heavier than chest.
  const hippy = { stations: GOOD_PROFILE.stations.map((s) => s.slice()) };
  for (const s of hippy.stations) if (s[0] >= 0.5 && s[0] <= 1.3) { s[1] *= 3; s[2] *= 2; s[3] *= 2; }
  const mm = massBins(hippy, ANCHORS);
  assert(!(mm.chest >= mm.hip && mm.chest / mm.hip >= THRESHOLDS.D1.chestHip), 'D1 catches a hip-heavy body');
  ok('D1 fails a hip-heavy body');

  // D3 — a flat spine: no bend, no inflection.
  const flat = { stations: GOOD_PROFILE.stations.map((s) => [s[0], s[1], s[2], s[3], 0]) };
  const fs = spineLaw(flat);
  assert(fs.bendDeg < THRESHOLDS.D3.bendMin && fs.inflections < THRESHOLDS.D3.minInflections, 'D3 catches a flat spine');
  ok('D3 fails a flat (no line-of-action) spine');

  // D2 — a convex (bulging) trailing edge.
  const convex = wingLaw({ tips: [[4.2, 0.4], [2.5, 0.3], [0.8, -1.0]], lead: [2.9, 0.6] });
  assert(!convex.concave, 'D2 catches a convex trailing edge');
  ok('D2 fails a convex trailing edge');

  // C2 — a mud palette: three near-identical greys.
  const mud = paletteDeltas({ dominant: '#777777', secondary: '#7f7f7f', accent: '#878787' });
  assert(mud.dDomSec < THRESHOLDS.C2.dLmin && mud.dSecAcc < THRESHOLDS.C2.dLmin, 'C2 catches a mud palette');
  ok('C2 fails a value-flat mud palette');
}

// ── raster checks smoke on a real shipped dragon (grandfathered — values only) ──
{
  const fill = negativeSpace('fire');
  assert(fill != null && fill > 0 && fill <= 1.2, `S2 raster returns a sane fill value (${fill.toFixed(3)})`);
  ok(`S2 raster smoke on fire (fill ${fill.toFixed(3)})`);

  const d = silhouetteDistance('fire', 'water');
  assert(d > 0 && d <= 1, `S1 raster distance sane (${d.toFixed(3)})`);
  ok(`S1 raster smoke fire↔water (XOR/union ${d.toFixed(3)})`);
}

// ── ENFORCEMENT: every design-gated dragon must pass every non-skipped check ────
{
  const gated = designKeys();
  let fails = 0;
  for (const key of gated) {
    for (const r of checkAll(key)) {
      if (r.skipped) continue;
      if (!r.ok) { fails++; console.error(`  ✗ ${key} ${r.id}: ${r.value} vs ${r.threshold} — ${r.detail}`); }
    }
  }
  assertEq(fails, 0, `all ${gated.length} design-gated dragon(s) pass every design law`);
  ok(`design gate enforced on ${gated.length} design-gated dragon(s), 0 failures`);
}

console.log(`\ndesigngate: ${n} checks passed.`);
