// Reusable flap ANIMATOR for skinned wings (the "living fan" motion system).
//
// Drives a shoulder → elbow → wrist bone cascade with PHASE-LAGGED motion and
// ANATOMICAL ANGLE LIMITS, so the wing beats like a living arm — the shoulder
// leads, the elbow follows, the wrist trails — instead of one uniform hinge. It
// is data-driven by a per-creature `profile`, so any wing tunes its character by
// declaring `model.flapProfile` in its blueprint; no bespoke animation code per
// creature. dragon.js calls flapWing() for each skinned wing with the flight
// state it already computes (it keeps its direct pivot/tip drive for non-skinned
// wings), so this is purely additive — the rig contract is untouched.
//
// The shoulder + wrist formulas reproduce the existing hand-tuned wingbeat (so a
// migrated wing keeps its feel); the ELBOW is the new joint that adds the lagged
// mid-arm whip. Limits clamp the elbow/wrist so the wing can never fold into an
// impossible self-intersecting pose.

const DEFAULTS = {
  lagElbow: 0.20,        // phase lag (radians) shoulder → elbow
  lagWrist: 0.95,        // phase lag shoulder → wrist (the wrist trails most)
  elbowAmp: 0.28,        // elbow swing relative to the flap
  foldAmp: 0.28,         // wrist counter-fold amplitude
  elbowLimit: [-0.55, 0.85],
  wristLimit: [-0.7, 0.7],
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Frame-rate independent critically-damped approach (matches dragon.js `damp`).
const damp = (cur, tgt, lambda, dt) => cur + (tgt - cur) * (1 - Math.exp(-lambda * dt));

// rig:   { shoulder, elbow, wrist, side, profile }   (side: +1 right, -1 left)
// state: { phase, flapAmp, turnBias, climbBias, rollFold, feather, strength }
//   strength (default 1) scales the BEAT — its swing + whip + fold — so a young
//   form (Hatchling) flaps weaker than a grown one (Eternal). Resting droop stays.
export function flapWing(rig, state, dt) {
  if (!rig || !rig.shoulder) return;
  const P = { ...DEFAULTS, ...(rig.profile || {}) };
  const side = rig.side;
  const { phase, flapAmp, turnBias, climbBias, rollFold, feather } = state;
  const str = state.strength ?? 1;
  const rootFlap = Math.sin(phase) * flapAmp * str + 0.1;

  // Shoulder — the main flap (reproduces the existing wingbeat).
  const sh = rig.shoulder;
  sh.rotation.z = damp(sh.rotation.z, -side * rootFlap + turnBias + side * rollFold, 14, dt);
  sh.rotation.x = damp(sh.rotation.x, 0.14 + side * feather * 0.18 + climbBias, 10, dt);
  sh.rotation.y = damp(sh.rotation.y, -side * 0.18 + turnBias * 0.8, 9, dt);

  // Elbow — the new lagged mid-arm joint that gives the whip (continues the flap).
  if (rig.elbow) {
    const eFlap = clamp(Math.sin(phase - P.lagElbow) * flapAmp * P.elbowAmp * str, P.elbowLimit[0], P.elbowLimit[1]);
    rig.elbow.rotation.z = damp(rig.elbow.rotation.z, -side * eFlap, 12, dt);
    rig.elbow.rotation.x = damp(rig.elbow.rotation.x, -side * feather * 0.08, 10, dt);
  }

  // Wrist — the trailing counter-fold (folds on up-stroke, extends on down-stroke).
  const fold = clamp(Math.sin(phase + P.lagWrist) * P.foldAmp * str, P.wristLimit[0], P.wristLimit[1]);
  const w = rig.wrist;
  w.rotation.z = damp(w.rotation.z, side * fold + turnBias * 0.45, 12, dt);
  w.rotation.x = damp(w.rotation.x, -0.12 + side * feather * 0.16, 10, dt);
}

// Per-form wingbeat character from the stamped form index (0..3). The gap is
// deliberately WIDE so growth is unmistakable: a Hatchling beats fast but feeble
// (≈0.42 strength, ≈1.18× speed — a frantic baby), an Eternal beats slow but
// powerful (full strength + whip, ≈1.0× speed — a titan moving real air). Shared
// by the live rig + the shop preview.
function formK(model) {
  return Math.min(model?.formLevel ?? 3, 3) / 3;        // 0 (hatchling) → 1 (eternal)
}
export function formStrength(model) {
  return 0.42 + 0.58 * formK(model);                    // beat amplitude + whip + fold
}
export function formSpeed(model) {
  return 1.18 - 0.18 * formK(model);                    // young beats quicker, elder slower
}
