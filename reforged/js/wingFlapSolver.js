// ═══════════════════════════════════════════════════════════════════════════════
// SHARED WING-FLAP SOLVER — the reusable base for YOKE-equipped dragons (Bull, Seraph,
// and future forms). PURE MATH (no scene objects), so BOTH the gameplay animator
// (dragon.js) and the shop-preview poser (dragonModel.js) call the same solver and stay
// in sync. Structural chain it serves: torso → root YOKE → inner → mid → outer (tip).
//
// A structured 5-PHASE cycle with a real APEX HOLD is what makes a flap read as a power
// cycle instead of a hinge: glide-hold → recovery/upstroke → APEX HOLD (held high V) →
// power downstroke (dips below glide) → settle. ONE shared master phase drives L+R (sign
// mirror, never a whole-wing L/R lag); the only delay is WITHIN a wing (yoke leads → inner
// → mid → tip). Config is `model.flap` (target degrees + ratios + lags).
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180, TAU = Math.PI * 2;
const smooth = (x) => { const t = x < 0 ? 0 : x > 1 ? 1 : x; return t * t * (3 - 2 * t); };

// CONTINUOUS up-down BEAT, range [−downDepth .. 1]. No glide/horizontal hold — the wing sweeps
// THROUGH horizontal at full speed and dwells ONLY at the apex (the held V) + a brief bottom
// turnaround. One smoothstep UP (bottom→apex) crosses horizontal near its middle where velocity is
// ~max; one smoothstep DOWN (apex→bottom). That is what removes the "pause at horizontal on the
// way up" (a glide-hold plateau froze it there). `ph` = the (lagged) phase in radians.
export function flapEnv(ph, c) {
  const t = (((ph % TAU) + TAU) % TAU) / TAU;                 // 0..1 within the cycle
  const r = c.recovery ?? 0.34, a = c.apexHold ?? 0.10, p = c.power ?? 0.42;
  const dd = c.downDepth ?? 1.0;
  const b1 = r, b2 = r + a, b3 = r + a + p;                   // upstroke · apex hold · downstroke · bottom
  if (t < b1) return -dd + (1 + dd) * smooth(t / r);          // UPSTROKE: bottom → apex (fast through horizontal)
  if (t < b2) return 1;                                       // APEX HOLD (held V)
  if (t < b3) return 1 - (1 + dd) * smooth((t - b2) / p);     // DOWNSTROKE: apex → bottom (heavy)
  return -dd;                                                 // brief BOTTOM hold (the ~45° deep press reads)
}

// SHAPE channel — segment CURL 0..1, SEPARATE from the elevation above. 0 at the bottom
// (segments straight/pressed), smoothstep up to 1 at the apex (curled into the rounded V),
// straighten back to 0 on the downstroke, 0 at the bottom. Read per-segment as `curlEnv(phase −
// lag)` with inner→mid→tip lag: that lag makes the upstroke a DOME (inner curled, tip still low)
// and the apex a rounded V (tip caught up). `ph` = the (lagged) phase in radians.
export function curlEnv(ph, c) {
  const t = (((ph % TAU) + TAU) % TAU) / TAU;
  const r = c.recovery ?? 0.34, a = c.apexHold ?? 0.10, p = c.power ?? 0.42;
  const b1 = r, b2 = r + a, b3 = r + a + p;
  if (t < b1) return smooth(t / r);                           // upstroke: straight → curled (dome via lag)
  if (t < b2) return 1;                                       // apex: full rounded-V curl
  if (t < b3) return 1 - smooth((t - b2) / p);                // downstroke: STRAIGHTEN → 0 (load-bearing)
  return 0;                                                   // bottom: straight
}

// Phase (radians) at the CENTRE of a named cycle point — for the `?wingDebug=<name>` freeze
// mode, so gameplay can hold the dragon at exactly glide/recovery/apex/downstroke/settle.
export function phaseCenter(name, c) {
  const r = c.recovery ?? 0.34, a = c.apexHold ?? 0.10, p = c.power ?? 0.42;
  const b2 = r + a, b3 = r + a + p, bot = Math.max(0, 1 - b3);
  const t = { glide: r * 0.35, recovery: r * 0.62, apex: r + a / 2,
    downstroke: b2 + p * 0.6, settle: b3 + bot / 2 }[name];   // up-low · dome · held-V · press · deep-bottom
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
  // ROWING fore-aft sweep on the whole wing: +back when elevated, −forward when pressing down.
  const row = ((cfg.rowBackDeg ?? 0) * up - (cfg.rowFwdDeg ?? 0) * dn) * D2R;
  const tipTrail = (cfg.tipTrailDeg ?? 0) * D2R * (1 - cT);    // tip droops when NOT curled (extended)
  return {
    yoke:  { elev: (cfg.yokeElevDeg ?? 0) * D2R * eY, sweep: row, twist: tw * up, env: eY },
    inner: { curl: (cu.inner ?? 0) * D2R * cI - loadBow, env: cI },
    mid:   { curl: (cu.mid   ?? 0) * D2R * cM - loadBow, sweep: (sw.mid ?? 0) * D2R * cM, env: cM },
    tip:   { curl: (cu.tip   ?? 0) * D2R * cT - loadBow - tipTrail, sweep: (sw.tip ?? 0) * D2R * cT, env: cT },
  };
}
