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

// 5-phase elevation envelope over ONE cycle, range [−downDepth .. 1]:
//   glide-hold (gentle V = glideLevel) → recovery (→1) → APEX HOLD (=1, the held V) →
//   power downstroke (→ −downDepth, drives below flat) → settle (→ glideLevel).
// `ph` = the (lagged) phase in radians.
export function flapEnv(ph, c) {
  const t = (((ph % TAU) + TAU) % TAU) / TAU;                 // 0..1 within the cycle
  const g = c.glide ?? 0.24, r = c.recovery ?? 0.24, a = c.apexHold ?? 0.14, p = c.power ?? 0.24;
  const gl = c.glideLevel ?? 0.18, dd = c.downDepth ?? 0.35;
  const b1 = g, b2 = g + r, b3 = g + r + a, b4 = g + r + a + p;
  if (t < b1) return gl;                                       // glide hold
  if (t < b2) return gl + (1 - gl) * smooth((t - b1) / r);     // recovery / upstroke
  if (t < b3) return 1;                                        // APEX HOLD (held V)
  if (t < b4) return 1 + (-dd - 1) * smooth((t - b3) / p);     // power downstroke
  return -dd + (gl + dd) * smooth((t - b4) / Math.max(1e-4, 1 - b4));   // settle → glide
}

// Per-STAGE pose (radians) from the cycle, with intra-wing lag yoke→inner→mid→tip. Fold
// adds extra up-curl to mid/tip on the upstroke; sweep/twist scale with the upstroke. The
// caller maps elev→flap axis, sweep→sweep axis, twist→twist axis and adds its own banking.
export function solveWing(phase, cfg) {
  const lag = cfg.lag || {}, el = cfg.elevDeg || {}, sw = cfg.sweepDeg || {}, fo = cfg.foldDeg || {};
  const li = lag.inner ?? 0.06, lm = li + (lag.mid ?? 0.06), lt = lm + (lag.tip ?? 0.08);
  const E = (frac) => flapEnv(phase - TAU * frac, cfg);
  const eY = E(0), eI = E(li), eM = E(lm), eT = E(lt);
  const up = (e) => (e > 0 ? e : 0);                           // upstroke-only gate (fold/sweep)
  const tw = (cfg.twistDeg ?? 0) * D2R;
  return {
    yoke:  { elev: (el.yoke  ?? 0) * D2R * eY,  sweep: (sw.yoke ?? 0) * D2R * up(eY), twist: tw * eY,  env: eY },
    inner: { elev: ((el.inner ?? 0) * eI + (fo.inner ?? 0) * up(eI)) * D2R, env: eI },
    mid:   { elev: ((el.mid   ?? 0) * eM + (fo.mid   ?? 0) * up(eM)) * D2R, sweep: (sw.mid ?? 0) * D2R * up(eM), env: eM },
    tip:   { elev: ((el.tip   ?? 0) * eT + (fo.tip   ?? 0) * up(eT)) * D2R, sweep: (sw.tip ?? 0) * D2R * up(eT), env: eT },
  };
}
