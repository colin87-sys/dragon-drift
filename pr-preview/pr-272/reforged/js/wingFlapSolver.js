// ═══════════════════════════════════════════════════════════════════════════════
// SHARED WING-FLAP SOLVER — the reusable base for YOKE-equipped dragons (Bull, Seraph,
// and future forms). PURE MATH (no scene objects), so BOTH the gameplay animator
// (dragon.js) and the shop-preview poser (dragonModel.js) call the same solver and stay
// in sync. Structural chain it serves: torso → root YOKE → inner → mid → outer (tip).
//
// A SMOOTH CONTINUOUS beat (a time-warped cosine, NO holds) is what makes the flap read NATURAL
// instead of robotic: it eases through the apex + bottom like a pendulum and sweeps through
// horizontal at max speed, never freezing mid-stroke. The downstroke is heavier/slower than the
// upstroke (`downFrac`). ONE shared master phase drives L+R (sign mirror, never a whole-wing L/R
// lag); the only delay is WITHIN a wing (yoke leads → inner → mid → tip) for the dome + follow-
// through. Config is `model.flap` (target degrees + downFrac + lags).
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const smooth = (x) => { const t = x < 0 ? 0 : x > 1 ? 1 : x; return t * t * (3 - 2 * t); };

// SMOOTH CONTINUOUS BEAT — a time-warped cosine, range [−downDepth .. 1]. NO holds anywhere: the
// wing eases through the apex + bottom like a pendulum (zero velocity only at those true extremes,
// where it naturally reverses) and sweeps THROUGH horizontal at MAX velocity — so it reads natural,
// not robotic, and never pauses mid-stroke. `downFrac` makes the DOWNstroke take more of the cycle
// (slower/heavier power stroke) than the quicker upstroke. Apex at warped u=0, bottom at u=0.5.
// `ph` = the (lagged) phase in radians.
function warp(t, df) { return t < df ? (t / df) * 0.5 : 0.5 + ((t - df) / (1 - df)) * 0.5; }
export function flapEnv(ph, c) {
  const t = (((ph % TAU) + TAU) % TAU) / TAU;                 // 0..1 within the cycle
  const dd = c.downDepth ?? 1.0;
  const u = warp(t, c.downFrac ?? 0.55);
  return (1 - dd) / 2 + (1 + dd) / 2 * Math.cos(TAU * u);     // +1 apex (u=0) → −dd bottom (u=0.5), smooth
}

// SHAPE channel — segment CURL 0..1, SEPARATE from elevation. Smoothly 1 at the apex (curled into
// the rounded V) → 0 at the bottom (straight/pressed). Read per-segment as `curlEnv(phase − lag)`
// with inner→mid→tip lag: the lag makes the upstroke a DOME (inner curled, tip still low) and the
// apex a rounded V (tip caught up). No holds → continuous shape change. `ph` = the lagged phase.
export function curlEnv(ph, c) {
  const t = (((ph % TAU) + TAU) % TAU) / TAU;
  const u = warp(t, c.downFrac ?? 0.55);
  return (1 + Math.cos(TAU * u)) / 2;                         // 1 at apex (u=0) → 0 at bottom (u=0.5)
}

// Phase (radians) at a representative point of each named cycle stage — for the `?wingDebug=<name>`
// freeze mode + harness renders. Apex at t≈0, bottom at t=downFrac.
export function phaseCenter(name, c) {
  const df = c.downFrac ?? 0.55;
  const t = { glide: df + (1 - df) * 0.30, recovery: df + (1 - df) * 0.55, apex: 0.02,
    downstroke: df * 0.5, settle: df }[name];                 // up-low · dome · apex-V · mid-press · deep-bottom
  return (t == null ? 0 : t) * Math.PI * 2;
}

// Per-STAGE pose (radians) from the TWO channels:
//   • YOKE carries whole-wing ELEVATION (flapEnv, −downDepth..1): up at apex, DOWN/pressing on
//     the power stroke — plus the fore-aft ROWING sweep (reach FORWARD on the downstroke, back
//     at the apex) that reads as a power cycle, not a hinge.
//   • inner/mid/tip carry CURL (curlEnv, 0..1, lagged): the SHAPE — dome on the upstroke (tip
//     lags flat), rounded V at apex, STRAIGHT on the downstroke. + a small aft trail + tip
//     droop at extension (membrane flex). loadBow gives a subtle downward camber under load.
// The caller maps yoke.elev/inner.curl/mid.curl/tip.curl → flap axis (rotation.z), sweep → the
// sweep axis (rotation.y), twist → rotation.x, and adds its own banking bias.
export function solveWing(phase, cfg) {
  const lag = cfg.lag || {}, cu = cfg.curlDeg || {}, sw = cfg.sweepDeg || {};
  const li = lag.inner ?? 0.05, lm = li + (lag.mid ?? 0.06), lt = lm + (lag.tip ?? 0.10);
  const eY = flapEnv(phase, cfg);                              // whole-wing elevation
  const cI = curlEnv(phase - TAU * li, cfg);
  const cM = curlEnv(phase - TAU * lm, cfg);
  const cT = curlEnv(phase - TAU * lt, cfg);
  const up = eY > 0 ? eY : 0, dn = eY < 0 ? -eY : 0;           // elevated / pressing amounts
  const tw = (cfg.twistDeg ?? 0) * D2R, loadBow = (cfg.loadBowDeg ?? 0) * D2R * dn;
  // ROWING fore-aft sweep: smooth + LINEAR in elevation (back when up, forward when pressing down),
  // so it has NO kink at horizontal (a kink there reads as a hitch). Clamped so the deep press saturates.
  const eClamp = eY > 1 ? 1 : eY < -1 ? -1 : eY;
  const row = (cfg.rowDeg ?? 0) * D2R * eClamp;
  const tipTrail = (cfg.tipTrailDeg ?? 0) * D2R * (1 - cT);    // tip droops when NOT curled (extended)
  return {
    yoke:  { elev: (cfg.yokeElevDeg ?? 0) * D2R * eY, sweep: row, twist: tw * up, env: eY },
    inner: { curl: (cu.inner ?? 0) * D2R * cI - loadBow, env: cI },
    mid:   { curl: (cu.mid   ?? 0) * D2R * cM - loadBow, sweep: (sw.mid ?? 0) * D2R * cM, env: cM },
    tip:   { curl: (cu.tip   ?? 0) * D2R * cT - loadBow - tipTrail, sweep: (sw.tip ?? 0) * D2R * cT, env: cT },
  };
}
