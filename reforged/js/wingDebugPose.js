// SHARED debug wing-pose PIN — the ONE mechanism `?wingDebug` (dragon.js gameplay freeze)
// and the studio tools (dragonstudio / nfview) both use to hold a dragon's wings at a
// NAMED, REPRODUCIBLE pose. A transient flap pose cannot be captured by waiting for the
// clock to land on it (L137) — so every wing path is freezable at a fixed point.
//
// WHY it lives here, not inline in dragon.js: `?wingDebug` used to freeze ONLY the Mk II
// yoke branch, so no starter (none ride the yoke) could be pinned, and the studio — which
// builds the model directly instead of running dragon.js's update loop — had no shared
// freeze at all. Centralising the pose math means the in-game freeze and the studio
// capture snap to the SAME pose (extend the mechanism, don't fork it — DRAGON-DESIGN §6.6).
//
// Covers all four wing motion paths, in dragon.js's own priority order:
//   1. SKINNED rig      (parts.wingRigL — flapWing cascade; ember's future path)
//   2. Mk II YOKE       (model.flap + parts.wingYokeL — the 5-phase solver)
//   3. per-form ARTIC.  (model.wingParts — root/mid/tip glide-hold)
//   4. basic DIRECT     (parts.wingPivotL + wingTipL — azure/ember/jade ship on this)
// Purely additive: reads rig parts + model knobs, sets rotations. No geometry touched.

import { solveWing, phaseCenter } from './wingFlapSolver.js';
import { flapWing, formStrength } from './dragonWingFlap.js';

// The named freeze states. Five are wing-cycle points (up-low · dome · apex-V · mid-press ·
// deep-bottom, via phaseCenter); two are POSTURE pins layered on the glide phase:
//   fold → hard tuck/furl (the §3 "fold contracts the span" read — dive + rollFold)
//   bank → hard right bank (the rear-¾ chase read — turnBias saturated)
export const WING_DEBUG_STATES = ['glide', 'recovery', 'apex', 'downstroke', 'settle', 'fold', 'bank'];
const CYCLE = new Set(['glide', 'recovery', 'apex', 'downstroke', 'settle']);

export function isWingDebugState(state) { return WING_DEBUG_STATES.includes(state); }

// Resolve a named state → the frozen scalar flight inputs the pose math reads. Pure
// (no clock / random) so two runs are pixel-identical — determinism is a deliverable (§9).
export function resolveWingDebug(state, flapCfg) {
  const cfg = flapCfg || {};
  const cycle = CYCLE.has(state) ? state : 'glide';   // fold/bank pin at the glide phase
  const phase = phaseCenter(cycle, cfg);
  const fold = state === 'fold' ? 1 : 0;
  const bankDir = state === 'bank' ? 1 : 0;
  return {
    state, isDebug: true, phase,
    turnBias: bankDir * 0.28,     // saturated hard bank (right); L is its mirror
    bank: bankDir,                // −1..1 normalised steer (right +1)
    rollFold: fold * 0.55,        // barrel-tuck fold that furls the span (§3 fold read)
    climbBias: 0,
    dive: fold,                   // dive tuck → the flap amplitude collapses to a glide
  };
}

// Pose EVERY wing path at the named state. `parts` carries the standard rig handles
// (wingRigL/R, wingYokeL/R, wingPivotL/R, wingMidL/R, wingTipL/R); `model` is the
// resolved def model. dragon.js passes its live rig; the studio passes model.parts —
// same contract, one poser. Returns the resolved inputs (for logging). Idempotent.
export function setFlapDebugPose(parts, model, state) {
  const r = resolveWingDebug(state, model.flap);
  const { phase, turnBias, rollFold, climbBias, bank, dive } = r;
  const feather = Math.sin(phase + Math.PI * 0.55);
  // Large dt → the frame-rate-independent damp() in flapWing / the shipped drive lands
  // ON the target in one call, so there is no settle transient to wait out.
  const DT = 1.0;

  if (parts.wingRigL) {
    // ── SKINNED path — the exact animator dragon.js drives, snapped straight to target.
    const flapAmp = 0.52 * (model.flapAmp ?? 1) * (1 - 0.7 * dive);
    const st = { phase, flapAmp, turnBias, climbBias, rollFold, feather,
      aero01: 0, spread01: 0, surge01: 0, bankHard: Math.abs(bank), strength: formStrength(model) };
    flapWing(parts.wingRigL, st, DT);
    flapWing(parts.wingRigR, st, DT);
    // EMBER furl (rig.furl): flapWing's shoulder roll alone only contracts a broad
    // fingered membrane to ~0.85 span (the wing lifts, it doesn't draw inboard). In
    // FOLD, sweep the shoulder YAW hard back along the flank + tuck the wrist so the
    // fanned hand furls against the body and the span contracts past 0.7× (§3 fold
    // clause / §7 assert). Additive + ember-only — other skinned rigs lack rig.furl.
    if (state === 'fold' && parts.wingRigL.furl) {
      for (const rig of [parts.wingRigL, parts.wingRigR]) {
        rig.shoulder.rotation.y = -rig.side * 1.15;     // yaw the whole wing back along the flank
        rig.shoulder.rotation.z = rig.side * 0.34;      // modest up-roll (not a raised V)
        if (rig.elbow) rig.elbow.rotation.y = -rig.side * 0.35;
        if (rig.wrist) rig.wrist.rotation.y = -rig.side * 0.4;
      }
    }
    return r;
  }

  if (model.flap && parts.wingYokeL) {
    // ── Mk II YOKE — a faithful port of dragon.js poseY at the frozen inputs.
    const s = solveWing(phase, model.flap);
    const poseY = (yk, pv, md, tp, ins) => {
      const inside = Math.max(0, ins), outside = Math.max(0, -ins);
      const ampE = 1 - 0.30 * ins;
      yk.rotation.set(s.yoke.twist, -0.12 - s.yoke.sweep - 0.10 * inside + turnBias * 0.5, s.yoke.elev * ampE + rollFold + 0.05 * outside);
      pv.rotation.set(0.10 + feather * 0.12 + climbBias, -0.12, s.inner.curl * ampE + 0.06 * inside);
      if (md) md.rotation.set(0.02, 0.05 * outside - s.mid.sweep, s.mid.curl * ampE + 0.10 * inside);
      if (tp) tp.rotation.set(-0.04, 0.07 + 0.18 * inside - s.tip.sweep, s.tip.curl * ampE + 0.14 * inside);
    };
    poseY(parts.wingYokeR, parts.wingPivotR, parts.wingMidR, parts.wingTipR, bank);
    poseY(parts.wingYokeL, parts.wingPivotL, parts.wingMidL, parts.wingTipL, -bank);
    return r;
  }

  if (model.wingParts) {
    // ── Mk II per-FORM articulated — a port of dragon.js poseWing (aero01/spread01 = 0).
    const m = model;
    const glidePow = m.glidePow ?? 1;
    const rootA = (m.rootAmp ?? 0.52 * (m.flapAmp ?? 1)) * (1 - 0.7 * dive);
    const midA = m.midAmp ?? 0, tipA = m.tipAmp ?? 0;
    const midLag = m.midLag ?? 0, tipLag = m.tipLag ?? 0;
    const shape = (ph) => { const s = Math.sin(ph); return Math.sign(s) * Math.pow(Math.abs(s), glidePow); };
    const rootF = shape(phase) * rootA;
    const midF = shape(phase - midLag) * midA;
    const tipF = shape(phase - tipLag) * tipA;
    const twMid = Math.cos(phase - midLag) * 0.10;
    const twTip = Math.cos(phase - tipLag) * 0.18;
    const upMid = Math.max(0, Math.sin(phase - midLag));
    const upTip = Math.max(0, Math.sin(phase - tipLag));
    const apexUp = (ph) => Math.pow(Math.max(0, -Math.sin(ph)), 0.7);
    const apexRootF = (m.apexRoot ?? 0) * apexUp(phase);
    const apexMidF = (m.apexMid ?? 0) * apexUp(phase - midLag);
    const apexTipF = (m.apexTip ?? 0) * apexUp(phase - tipLag);
    const apexPitch = m.apexPitch ?? 0;
    const restLift = m.restLift ?? 0;
    const tipSweepBase = 0.07 + 0.16 * upTip;
    const poseWing = (pv, md, tp, ins) => {
      const inside = Math.max(0, ins), outside = Math.max(0, -ins);
      const amp = 1 - 0.34 * ins;
      const baseZ = -0.10 - 0.20 * inside + 0.12 * outside;
      pv.rotation.set(0.14 + feather * 0.16 + climbBias - apexPitch * apexRootF, -0.18, -(rootF * amp) + apexRootF * amp + restLift + baseZ + rollFold);
      if (md) md.rotation.set(twMid + 0.05 * inside - apexPitch * apexMidF, upMid * 0.08 + 0.05 * outside, -(midF * amp) + apexMidF * amp + 0.10 * inside);
      if (tp) { const tF = md ? tipF : (midF + tipF), aT = md ? apexTipF : (apexMidF + apexTipF);
        tp.rotation.set(-0.05 + twTip + 0.12 * inside - apexPitch * aT, tipSweepBase + 0.22 * inside, -(tF * amp) + aT * amp + 0.16 * inside); }
    };
    poseWing(parts.wingPivotR, parts.wingMidR, parts.wingTipR, bank);
    poseWing(parts.wingPivotL, parts.wingMidL, parts.wingTipL, -bank);
    return r;
  }

  // ── basic DIRECT-PIVOT 2-bone wing (azure/ember/jade ship here) — port of the else
  // branch, direct-SET to the damp targets (no settle needed).
  const flapAmp = 0.52 * (model.flapAmp ?? 1) * (1 - 0.7 * dive);
  const rootFlap = Math.sin(phase) * flapAmp + 0.1;
  const tipLag = Math.sin(phase + 0.95);
  const pr = parts.wingPivotR, pl = parts.wingPivotL, tr = parts.wingTipR, tl = parts.wingTipL;
  if (pr) {
    pr.rotation.z = -rootFlap + turnBias + rollFold;
    pr.rotation.x = 0.14 + feather * 0.18 + climbBias;
    pr.rotation.y = -0.18 + turnBias * 0.8;
  }
  if (pl) {
    pl.rotation.z = rootFlap + turnBias - rollFold;
    // feather = fore-aft PITCH (rotation.x): SAME sign both wings under scale.x=-1 (the mirror
    // doesn't flip rotation.x's sense). Matches the live-flight fix in dragon.js.
    pl.rotation.x = 0.14 + feather * 0.18 + climbBias;
    pl.rotation.y = 0.18 + turnBias * 0.8;
  }
  if (tr) {
    tr.rotation.z = tipLag * 0.28 + turnBias * 0.45;
    tr.rotation.x = -0.12 + feather * 0.16;
  }
  if (tl) {
    // BOTH tips on the ONE tipLag clock (mirror sign) — not a separate sin(phase+1.18) that
    // folded the L tip a beat off the R (the off-beat asymmetry). Matches dragon.js.
    tl.rotation.z = -tipLag * 0.28 + turnBias * 0.45;
    tl.rotation.x = -0.12 + feather * 0.16;
  }
  poseBladePivots(parts, state);
  return r;
}

// Per-blade lag pivots (AZURE's blade-feather comb, parts.wingBladePivotsL/R). The base
// wing pivot above swings the whole comb; this nests the individual blades relative to it.
// In the FOLD the blades cancel their rest rake (lag.y = −restY) so they stack PARALLEL and
// furl tightly with the wrist; in glide/bank they settle to a small even rest splay. A rig
// without blade pivots (ember/jade direct wings) skips this untouched.
export function poseBladePivots(parts, state) {
  if (!parts.wingBladePivotsL && !parts.wingBladePivotsR) return;
  // AZURE-specific comb tuck (the generic direct-pivot fold is too gentle for a wide blade
  // comb — it only furled the span to ~0.86). In FOLD: furl the WRIST hard up+back so the
  // outer spar tucks UNDER the packet (no naked spar crossing the back, gate r4 dir 5), and
  // rake every blade into a PARALLEL stack swept back past the hip. glide/bank keep the
  // small rest splay + the shared poser's wrist.
  if (state === 'fold') {
    // Swing the WHOLE arm back along the flank (~78°) so the blade ROOTS draw inboard and the
    // span contracts — a bird folds at the shoulder, not by raking free blades. The comb then
    // lies back as one flat swept dart packet (dir 5), no up-spray, no crossed spars.
    for (const [pv, s] of [[parts.wingPivotR, 1], [parts.wingPivotL, -1]]) {
      // Swing back AND roll the comb DOWN onto the flank (gate r5 dir 8): the round-4 fold
      // left the packet standing up → two up-sprayed spear fans in a V from behind. A hard
      // negative roll lays the dart packet flat along the torso so the folded silhouette
      // sits LOW (height above the spine ≤0.5× body depth), not a raised V.
      if (pv) pv.rotation.set(0.16, s * 1.66, s * -0.5);
    }
    for (const [tip, s] of [[parts.wingTipR, 1], [parts.wingTipL, -1]]) {
      if (tip) tip.rotation.set(0, 0, s * -0.12);            // wrist follows the arm down, tucked
    }
  }
  for (const arr of [parts.wingBladePivotsR, parts.wingBladePivotsL]) {
    if (!arr) continue;
    const n = Math.max(1, arr.length - 1);
    for (const b of arr) {
      const t = b.pivot; if (!t) continue;
      const fr = b.idx / n;
      if (state === 'fold') {
        // Cancel rest rake + dihedral so the blades stack PARALLEL and flat along the
        // swept arm (a slight droop keeps them hugging the body, not fanning).
        t.rotation.set(0, -(b.restY ?? 0) + b.side * 0.04 * fr, -(b.restZ ?? 0) - b.side * 0.06);
      } else {
        t.rotation.set(0, 0, b.side * (0.02 + 0.05 * fr));
      }
    }
  }
}
