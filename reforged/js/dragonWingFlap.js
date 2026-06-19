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
  // ── Dragon-Surge + steering layer (all 0 in cruise/straight → cruise feel unchanged) ──
  surgeSweep: 0.55,      // backward wing sweep (rad) at full surge — swept high-speed look
  surgeFold: 0.38,       // extra upstroke fold at full surge — tighter recovery
  surgeLevel: 0.12,      // surge lowers the shoulder a touch → streamlined
  surgeSharp: 0.35,      // surge skews the beat → sharp power downstroke, slow recovery
  bankTuck: 0.5,         // INSIDE wing tuck+dip per unit steer (banks like an aircraft)
  bankOpen: 0.32,        // OUTSIDE wing open/brace per unit steer
  // ── open / air-brake layer (climb + boost-release decel) — the COUNTER to the aero tuck ──
  spreadLift: 0.16,      // shoulder raises → wings open wider to catch air (climb/brake)
  spreadOpen: 0.28,      // wings swing forward/out of the swept pose
  spreadFold: 0.30,      // un-folds the wrist → membrane opens broad
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
  // aero  = streamline/tuck/sweep driver (boost + surge + dive)
  // spread = open / air-brake driver (climb + boost-release decel) — the COUNTER to aero
  const aero = state.aero01 ?? state.surge01 ?? 0;
  const spread = state.spread01 ?? 0;
  // Beat: under aero skew the sine toward a SHARP power downstroke + slower recovery (a
  // boost pulse, not faster flapping). At aero 0 this is exactly Math.sin(phase).
  const beat = Math.sin(phase);
  const rootFlap = (aero > 0 ? Math.sign(beat) * Math.pow(Math.abs(beat), 1 - P.surgeSharp * aero) : beat)
    * flapAmp * str + 0.1;
  // Steering asymmetry: the INSIDE wing of the turn tucks + dips, the OUTSIDE wing opens
  // + braces → banks like an aircraft. DEADZONED by bankHard so it only engages on a HARD
  // bank, not on gentle steering (falls back to the linear ramp for non-night-fury callers).
  const steerMag = state.bankHard ?? Math.min(Math.abs(turnBias) / 0.28, 1);
  const tuck = steerMag * (turnBias * side > 0 ? P.bankTuck : -P.bankOpen) * (0.7 + 0.5 * aero);

  // Shoulder — main flap (+ aero sweep-back/level − spread opening + bank dip). The main flap
  // (rotation.z, −side) is mirror-symmetric; the FEATHER pitch (rotation.x) must be SYMMETRIC too
  // (NO side) so both wings pitch leading-edge up/down TOGETHER — a true mirror beat, not the old
  // anti-symmetric roll that read as the wings flapping at slightly different times.
  const sh = rig.shoulder;
  sh.rotation.z = damp(sh.rotation.z, -side * rootFlap + turnBias + side * rollFold + side * tuck * 0.5, 14, dt);
  sh.rotation.x = damp(sh.rotation.x, 0.14 + feather * 0.18 + climbBias - aero * P.surgeLevel + spread * P.spreadLift, 10, dt);
  sh.rotation.y = damp(sh.rotation.y, -side * 0.18 + turnBias * 0.8 - side * P.surgeSweep * aero + side * P.spreadOpen * spread, 9, dt);

  // Elbow — the lagged mid-arm joint that gives the whip (+ bank tuck).
  if (rig.elbow) {
    const eFlap = clamp(Math.sin(phase - P.lagElbow) * flapAmp * P.elbowAmp * str, P.elbowLimit[0], P.elbowLimit[1]);
    rig.elbow.rotation.z = damp(rig.elbow.rotation.z, -side * eFlap - side * tuck * 0.5, 12, dt);
    rig.elbow.rotation.x = damp(rig.elbow.rotation.x, -feather * 0.08, 10, dt);
  }

  // Wrist — the trailing counter-fold (folds on up-stroke). aero tightens the upstroke fold
  // (tucked recovery); spread OPENS it (wings catch air); the inside wing folds more.
  const upFold = Math.max(0, Math.sin(phase + P.lagWrist));      // >0 only on the upstroke
  const fold = clamp(Math.sin(phase + P.lagWrist) * P.foldAmp * str + upFold * P.surgeFold * aero - spread * P.spreadFold,
    P.wristLimit[0], P.wristLimit[1]);
  const w = rig.wrist;
  w.rotation.z = damp(w.rotation.z, side * fold + turnBias * 0.45 + side * tuck, 12, dt);
  w.rotation.x = damp(w.rotation.x, -0.12 + feather * 0.16, 10, dt);
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
