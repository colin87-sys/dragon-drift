// SHARED debug wing-pose PIN — the ONE mechanism `?wingDebug` (dragon.js gameplay freeze)
// and the studio tools (dragonstudio / nfview) both use to hold a dragon's wings at a
// NAMED, REPRODUCIBLE pose. A transient flap pose cannot be captured by waiting for the
// clock to land on it (L137) — so every wing path is freezable at a fixed point.
//
// WHY it lives here, not inline in dragon.js: `?wingDebug` used to freeze ONLY the Mk II
// yoke branch, so no starter (none ride the yoke) could be pinned, and the studio — which
// builds the model directly instead of running dragon.js's update loop — had no shared
// freeze at all. Centralising the pose math means the in-game freeze and the studio
// capture snap to the SAME pose (extend the mechanism, don't fork it — STARTER-REDESIGN §6.6).
//
// Covers all four wing motion paths, in dragon.js's own priority order:
//   1. SKINNED rig      (parts.wingRigL — flapWing cascade; ember's future path)
//   2. Mk II YOKE       (model.flap + parts.wingYokeL — the 5-phase solver)
//   3. per-form ARTIC.  (model.wingParts — root/mid/tip glide-hold)
//   4. basic DIRECT     (parts.wingPivotL + wingTipL — azure/ember/jade ship on this)
// Purely additive: reads rig parts + model knobs, sets rotations. No geometry touched.

import * as THREE from 'three';
import { solveWing, phaseCenter } from './wingFlapSolver.js';
import { flapWing, formStrength } from './dragonWingFlap.js';

// ═══════════════════════════════════════════════════════════════════════════════
// THE SEAM RIG (wing-lab 90-SYNTHESIS §8.3) — a fold that is an EVENT, not a shrug.
//
// No shipped hero folds: measured span contraction is Vesper 0.838, Revenant 0.932,
// Tempest 0.986 — "SPREAD and FOLDED are the same photograph". The reason is not
// timidity, it is topology: a welded membrane cannot pleat and cannot stretch, so any
// joint driven hard enough to matter rips its own skin, and every hero quietly stops
// at the angle where the tear would show.
//
// THE LAW THAT DISSOLVES IT: **a joint may rotate about the line its weld lies on, and
// about no other.** Put the hinge axis INSIDE the seam and the shared edge is on the
// rotation axis, so it is a fixed set — the sheet cannot open at ANY angle. The wing
// publishes one fitted axis per seam (`parts.wingSeamAxes`, least-squares through the
// weld's own vertices, residual measured), and this poser is only allowed to rotate a
// joint about the axis it was given:
//
//   elbow  ← the sheet's elbow row + the sail's elbow column   (armwing sheet is cut here)
//   wrist  ← the carpal line K→W6                              (sheet ↔ handwing weld)
//   furl   ← digit III's own spar                              (bay 0's weld; the fan closes on it)
//
// The same axis carries the FLIGHT flap and the FOLD posture — one rotation, one axis,
// so a wing that cannot tear in the fold cannot tear in the beat either. Wings without
// `wingSeamAxes` never enter this path; the roster is byte-identical.
// ═══════════════════════════════════════════════════════════════════════════════

const _q = new THREE.Quaternion(), _v = new THREE.Vector3();
const axisQ = (ax, angle) => _q.setFromAxisAngle(_v.set(ax.dir[0], ax.dir[1], ax.dir[2]).normalize(), angle);
// smooth 0→1 ramp over [a,b] — the choreography's only sequencing primitive (§8.3's
// "in sequence, trailing-first, digit III folding over the stack last" is four of these).
const ramp = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };

// §8.3 the fold, as five staged angles on four joints. Signs and magnitudes are the
// measured landing spot (`wing-lab/tools/wingfold.mjs` sweeps them); the choreography is
// the spec's, in the spec's order:
//   1 elbow flexes → the wrist pulls INBOARD (span SHORTENS before it thins)
//   2 wrist folds the hand back under the forearm
//   3 the trailing fan furls onto digit III, bays sliding into overlap — FIRST in time,
//     so digit III (which is the wrist frame itself) folds over the stack LAST
//   4 the shoulder sweeps the packet aft along the flank and rolls it DOWN, so the tip
//     lands at/behind the hip near the knee line and the membrane drapes over the skirt
export const FOLD = {
  // ── I4.1 — THE STAGGERED FURL (§8.3 step 3; kill #69) ──────────────────────
  // R6: "the fan closes as a DOOR, not a fan — every scallop leaves the outline in the
  // same instant." It did, because one `wingFurl` node carried all three bays on one
  // hinge, and a rigid rotation foreshortens a rigid shape uniformly. The fix is inside
  // the axis law, not against it: THREE lobes, each turning about its OWN spar's weld
  // line (§5.4), on three windows that barely overlap — so at almost every f exactly one
  // lobe is moving and the outline sheds ONE scallop at a time, trailing-first, with
  // digit III (which IS the wrist frame) coming over the stack last.
  //   lobe 2  digit VI + bay V–VI   about digit V's spar    — first
  //   lobe 1  digit V  + bay IV–V   about digit IV's spar   — second
  //   lobe 0  digit IV + bay III–IV about digit III's spar  — third (the real `wingFurl` joint)
  //   wrist   digit III + the whole stack                   — last
  // The three angles sum to the R6 total (−1.90 rad), so the closed packet is the same
  // depth it measured at; only the ORDER changed.
  lobeAngle: [-1.90, -1.35, -1.45],
  lobeWin: [[0.34, 0.58], [0.22, 0.46], [0.10, 0.34]],
  elbowAngle: 1.25, elbowWin: [0.30, 0.75],
  // …and the wrist starts at 0.14, not 0.00. With three lobes tucking early, a wrist that
  // begins on frame 1 thins the planform before the span has moved — §8.3 step 1's
  // forbidden order, measured at f = 0.15 (chord −2.4% against span −0.2%). Starting it
  // where the first lobe finishes restores span-before-chord across the whole loaded arc.
  wristAngle: -1.95, wristWin: [0.14, 0.55],
  // SHOULDER: yaw FORWARD, roll down, pitch neutral. The aft yaw was −0.05 (a rounding
  // error pretending to be a choreography note) and it drove the sheet's inboard belly
  // straight through the skirt's widest station — 1.1–1.4% of folded membrane vertices
  // inboard of the body-frame skirt at f ≥ 0.5, §5.1's zero-interpenetration obligation
  // broken at three of five arc points. Swinging the HUMERUS forward while the elbow and
  // wrist fold the packet back is also the bat's own answer (the folded wing lies along
  // the ribcage, not across the hip), and it takes the count to zero at EVERY arc point
  // without moving the tip off the hip: the fold's aft travel was always the elbow's.
  sweepY: 0.30, rollZ: -0.20, pitchX: 0.00, sweepWin: [0.10, 1.00],
  // KNOWN-BAD (kill #67): the R6 build — one shared window, one shared hinge. Driving the
  // three lobes off THIS makes the fan close as a door again, so the scallop-order probe
  // can be shown firing on the very defect it was written for.
  doorWin: [[0.10, 0.50], [0.10, 0.50], [0.10, 0.50]],
};

// ── I4.1 — THE FOUR ACTING SILHOUETTES (§8.3, "reachable from the same array with
// zero new mechanics"). Each is the SAME four numbers the fold uses — the three lobe
// furls, the wrist, the elbow and the shoulder triple — pinned at a different point of
// the same space. Nothing here is a new joint, a new axis or a new triangle.
//
//   tuck     the travelling posture: the packet drawn in hard and low against the flank
//   drape    the cape: elbow half-open, fan shut, the sheet hanging down the flank
//   display  the threat: everything extended and the fan opened PAST rest (positive furl)
//   mantle   the raptor's mantle: shoulders forward and down, hands low and turned in,
//            the wing tented over the ground — GROUND CONTACT THROUGH THE CARPAL CLUSTER
//            only, which is why the wrist stays high enough to keep the hem clear (§8.3).
export const ACTING = {
  tuck:    { fold: 1.00, lobe: [1.00, 1.00, 1.00], wrist: 1.00, elbow: 1.15, sweepY: 0.46, rollZ: -0.34, pitchX: 0.06 },
  drape:   { fold: 0.66, lobe: [0.85, 1.00, 1.00], wrist: 0.72, elbow: 0.45, sweepY: 0.16, rollZ: -0.62, pitchX: 0.04 },
  display: { fold: 0.00, lobe: [-0.50, -0.55, -0.60], wrist: -0.16, elbow: -0.42, sweepY: 0.10, rollZ: 0.06, pitchX: -0.18 },
  mantle:  { fold: 0.34, lobe: [0.22, 0.30, 0.38], wrist: 0.30, elbow: 0.62, sweepY: 0.30, rollZ: -0.34, pitchX: 0.24 },
};
// ORDER, and the one place it departs from §8.3's prose. The spec sequences elbow → wrist →
// fingers; MEASURED on this article the elbow must come THIRD, because the fold pose starts
// from a raised wing (the shipped `rollFold` tuck) and the elbow's fold direction flattens
// the arm before it folds it — leading with the elbow re-EXTENDS the projected span by 8%
// at f≈0.3 before it contracts, which is the "thins before it shortens" read §8.3 step 1
// exists to forbid, arriving through the door the spec left open. Sequenced as it stands
// the span falls 1.00 → 0.89 → 0.61 → 0.47 monotonically (rebound 0.009). What the spec
// actually asks for — trailing fingers first, digit III over the stack last, span short
// before the planform thins — all hold; only the elbow's slot in the queue moved.

// Apply the seam rig to one wing. `zMid`/`zTip` are the flap angles the shared poser
// already computed (they arrive on rotation.z and are MOVED onto the seam axis — a ≤27°
// change of axis, invisible in the beat, and the difference between a joint that can fold
// and one that can only tilt). `fold` is the posture scalar, 0 in flight.
// The per-lobe furl WEIGHTS at fold f — one ramp per lobe, published so the probes can
// read the same array the rig is driven from instead of inferring it from pixels.
export function furlWeights(fold, win) {
  const f = Math.max(0, Math.min(1, fold));
  const W = win || FOLD.lobeWin;
  return [ramp(f, W[0][0], W[0][1]), ramp(f, W[1][0], W[1][1]), ramp(f, W[2][0], W[2][1])];
}

function seamPose(parts, ax, side, fold, act, win) {
  const S = side === 1 ? 'R' : 'L';
  const pv = parts['wingPivot' + S], md = parts['wingMid' + S];
  const tp = parts['wingTip' + S], fu = parts['wingFurl' + S];
  const f = Math.max(0, Math.min(1, fold));
  const wElb = act ? act.elbow : ramp(f, FOLD.elbowWin[0], FOLD.elbowWin[1]);
  const wWri = act ? act.wrist : ramp(f, FOLD.wristWin[0], FOLD.wristWin[1]);
  const wSwp = act ? 1 : ramp(f, FOLD.sweepWin[0], FOLD.sweepWin[1]);
  const wLob = act ? act.lobe : furlWeights(f, win);
  if (md) {
    const z = md.rotation.z; md.rotation.z = 0;                    // the flap leaves the z axis…
    md.quaternion.multiply(axisQ(ax.elbow, z + FOLD.elbowAngle * wElb));   // …and lands on the seam
  }
  if (tp) {
    const z = tp.rotation.z; tp.rotation.z = 0;
    tp.quaternion.multiply(axisQ(ax.wrist, z + FOLD.wristAngle * wWri));
  }
  // lobe 0 is the real joint; lobes 1–2 are the deformer, driven once for both wings in
  // `poseWingSeams` (the geometry is per-side but the angles are not — §8.1's one-axis-set law).
  if (fu) fu.quaternion.copy(axisQ(ax.lobes && ax.lobes[0] ? ax.lobes[0] : ax.fan, FOLD.lobeAngle[0] * wLob[0]));
  if (pv && (f > 0 || act)) {
    // The shoulder has no seam to honour — the sheet's inboard cusp sits ON the pivot, so
    // every shoulder DOF is free (that is what I1.1's root fix bought). It is the joint
    // that puts the packet on the flank.
    pv.rotation.x += (act ? act.pitchX : FOLD.pitchX) * wSwp;
    pv.rotation.y += (act ? act.sweepY : FOLD.sweepY) * wSwp;
    pv.rotation.z += (act ? act.rollZ : FOLD.rollZ) * wSwp;
  }
  return wLob;
}

// THE ONE ENTRY POINT — called from `wingDebugPose` (studio/freeze) and from `dragon.js`
// (live flight) with the same arguments, in lockstep. Returns false for every wing that
// does not publish seam axes, which is every wing but this one.
export function poseWingSeams(parts, model, fold, phase, act, win) {
  const ax = parts && parts.wingSeamAxes;
  if (!ax) return false;
  const wLob = seamPose(parts, ax, 1, fold, act, win);
  seamPose(parts, ax, -1, fold, act, win);
  // …and the two outer lobes, from the SAME weights the joint took. One call for both
  // wings: the geometry is per-side, the angles are not (a per-side sign here would
  // double-flip exactly like a per-side rig sign does under the scale.x = −1 wrapper).
  if (parts.wingFurlLobes) parts.wingFurlLobes(FOLD.lobeAngle[1] * wLob[1], FOLD.lobeAngle[2] * wLob[2]);
  // §8.2 — the surface's own state, driven from the SAME phase the rig is driven from,
  // so the membrane can never drift out of step with the beat that tensions it.
  if (parts.wingSurface) parts.wingSurface(phase, fold);
  return true;
}

// The named freeze states. Five are wing-cycle points (up-low · dome · apex-V · mid-press ·
// deep-bottom, via phaseCenter); two are POSTURE pins layered on the glide phase:
//   fold → hard tuck/furl (the §3 "fold contracts the span" read — dive + rollFold)
//   bank → hard right bank (the rear-¾ chase read — turnBias saturated)
//   tuck / drape / display / mantle → the four ACTING silhouettes (§8.3), same array
export const WING_DEBUG_STATES = ['glide', 'recovery', 'apex', 'downstroke', 'settle', 'fold', 'bank',
  'tuck', 'drape', 'display', 'mantle'];
const CYCLE = new Set(['glide', 'recovery', 'apex', 'downstroke', 'settle']);

export function isWingDebugState(state) { return WING_DEBUG_STATES.includes(state); }

// Resolve a named state → the frozen scalar flight inputs the pose math reads. Pure
// (no clock / random) so two runs are pixel-identical — determinism is a deliverable (§9).
export function resolveWingDebug(state, flapCfg) {
  const cfg = flapCfg || {};
  const cycle = CYCLE.has(state) ? state : 'glide';   // fold/bank/acting pin at the glide phase
  const phase = phaseCenter(cycle, cfg);
  const act = ACTING[state] || null;
  const fold = state === 'fold' ? 1 : (act ? act.fold : 0);
  const bankDir = state === 'bank' ? 1 : 0;
  return {
    state, isDebug: true, phase, acting: act,
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
// `foldAmt` (optional) overrides the fold posture scalar for the SEAM RIG only, so the
// probes can walk the whole fold ARC instead of only its two endpoints — §8.3's "no bald
// flank at ANY point of the fold arc" is not checkable from two stills. Omitted, the named
// state decides (fold → 1, everything else → 0) and the call is byte-identical.
export function setFlapDebugPose(parts, model, state, foldAmt, win) {
  const r = resolveWingDebug(state, model.flap);
  const { phase, turnBias, climbBias, bank } = r;
  // an explicit arc sample overrides the acting pin, so `wingfold` can still walk f
  const act = (foldAmt == null) ? r.acting : null;
  const dive = foldAmt == null ? r.dive : Math.max(0, Math.min(1, foldAmt));
  // …and the shipped barrel-roll tuck rides the SAME scalar, so an arc sample is a real
  // intermediate pose rather than the endpoint pose with one term already saturated (that
  // discontinuity is what made the first arc read "span rebounds mid-fold").
  const rollFold = foldAmt == null ? r.rollFold : 0.55 * dive;
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
    const apexTipSweepF = (m.tipApexSweep ?? 0) * apexUp(phase);   // in-plane wrist sweep at the top (dragon.js parity)
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
        tp.rotation.set(-0.05 + twTip + 0.12 * inside - apexPitch * aT, tipSweepBase + 0.22 * inside + apexTipSweepF, -(tF * amp) + aT * amp + 0.16 * inside); }
    };
    poseWing(parts.wingPivotR, parts.wingMidR, parts.wingTipR, bank);
    poseWing(parts.wingPivotL, parts.wingMidL, parts.wingTipL, -bank);
    // …then the SEAM RIG re-aims the distal flap onto each joint's own weld axis and lays
    // the fold posture on top (no-op for every wing without `wingSeamAxes`). Must run AFTER
    // poseWing, which is what writes the flap angles it consumes.
    poseWingSeams(parts, model, dive, phase, act, win);
    // FOLD (debug/studio): a wingParts blade-comb (azure) folds at the SHOULDER — swing the whole
    // comb hard back along the flank + roll it DOWN so the span contracts past 0.7× (§7 fold assert)
    // and the folded silhouette sits low (not a raised V). The per-blade lag groups cancel their rest
    // rake so the primaries stack parallel. Written wrapper-CONSISTENT (identical L/R — the outer
    // scale.x=-1 mirror flips the L side; NEVER the per-side-sign poseBladePivots path, which would
    // double-flip and desync). Gated to a blade-comb rig → other wingParts dragons are untouched.
    if (dive > 0 && model.combShoulderFold && (parts.wingBladePivotsR || parts.wingBladePivotsL)) {
      for (const pv of [parts.wingPivotR, parts.wingPivotL]) if (pv) pv.rotation.set(0.16, 1.32, -0.46);
      for (const md of [parts.wingMidR, parts.wingMidL]) if (md) md.rotation.set(0, 0.30, 0);
      for (const tp of [parts.wingTipR, parts.wingTipL]) if (tp) tp.rotation.set(0, 0.18, -0.10);
      for (const arr of [parts.wingBladePivotsR, parts.wingBladePivotsL]) {
        if (!arr) continue;
        for (const b of arr) { const t = b.pivot; if (t) t.rotation.set(0, -(b.restY ?? 0), -(b.restZ ?? 0)); }
      }
    }
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
  // CP3.3 spire counter (Solar) — parity with dragon.js so studio/flapstrip captures show the STABILISED
  // spire, not the fully-swept one (else the acceptance strip is a false negative). Opposite L/R signs.
  const spireStab = model.spireStabilize ?? 0;
  if (parts.carpalSpireR) parts.carpalSpireR.rotation.z =  spireStab * Math.sin(phase) * flapAmp;
  if (parts.carpalSpireL) parts.carpalSpireL.rotation.z = -spireStab * Math.sin(phase) * flapAmp;
  poseBladePivots(parts, state);
  poseLobePivots(parts, state);
  return r;
}

// Per-lobe FURL pivots (JADE's silk-fin fan, parts.wingLobePivotsL/R). The base wing
// pivot swings the whole fan; this collapses the individual koi lobes together like a
// folding FAN. In FOLD: swing the whole fan hard back along the flank (the roots draw
// inboard so the span contracts past 0.7×) AND cancel each lobe's rest rake so they
// stack together (the fan closes); glide/bank keep the tall spread fan. A rig without
// lobe pivots (azure/ember) skips this untouched.
export function poseLobePivots(parts, state) {
  if (!parts.wingLobePivotsL && !parts.wingLobePivotsR) return;
  if (state === 'fold') {
    // Swing the WHOLE fan back along the flank (~80°) so the lobe roots draw inboard and
    // the span contracts — a folding fan closes toward its pivot. Roll it down onto the
    // flank so the folded silhouette sits low (not a raised V).
    for (const [pv, s] of [[parts.wingPivotR, 1], [parts.wingPivotL, -1]]) {
      if (pv) pv.rotation.set(0.12, s * 1.92, s * -0.42);
    }
    for (const [tip, s] of [[parts.wingTipR, 1], [parts.wingTipL, -1]]) {
      if (tip) tip.rotation.set(0, s * 0.25, s * -0.1);   // the rear-lobe carrier tucks in with the fan
    }
  }
  for (const arr of [parts.wingLobePivotsR, parts.wingLobePivotsL]) {
    if (!arr) continue;
    const n = Math.max(1, arr.length - 1);
    for (const b of arr) {
      const t = b.pivot; if (!t) continue;
      const fr = b.idx / n;
      if (state === 'fold') {
        // cancel rest rake AND yaw each lobe hard inboard so the fan shuts across the
        // flank and the tips draw toward the midline (span contracts past 0.7×).
        t.rotation.set(0, -(b.restY ?? 0) - b.side * (0.55 + 0.25 * fr), -(b.restZ ?? 0) * 0.5);
      } else {
        t.rotation.set(0, 0, 0);
      }
    }
  }
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
