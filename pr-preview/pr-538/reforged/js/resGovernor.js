// resGovernor.js — adaptive-resolution decision logic, promoted out of main.js so the
// escalation math is unit-testable without WebGL (the perfStats.js pattern). No imports,
// no globals: main.js holds one governor object, feeds it the median frame-rate signal
// each frame, and applies the resulting pixel-scale step (the RT realloc) when the index
// moves. The decision is pure; the realloc lives in the caller.
//
// WHY resolution FIRST, features LAST. The on-device verdict for this game is that the
// frame is GPU FILL-bound, not draw/CPU-bound (halving draws never moved fps; `?pr=1`
// hit 60 with every effect intact — see leapfrog perf lessons). So the cheapest thing to
// spend under load is *pixels*, and the most expensive is the *look the owner signed off
// on* (the composer stack, clouds, atmosphere, the detonation). The shipped quality
// controller only had the second lever — dropping a whole tier turns features OFF. This
// governor inserts a finer, near-invisible step BELOW that: trim pixel-scale to hold the
// frame budget, and only fall through to a tier drop once resolution is fully spent.
//
// Resolution is stepped on a small LADDER (not continuously): every change reallocates the
// composer/bloom/god-ray render targets, and doing that per-frame is the self-exciting
// stall the tier controller already learned to avoid. Discrete steps + hysteresis + dwell
// keep reallocs rare.

export const RES_DWELL = 0.7;          // s of sustained median-slow before trimming a step (cheap, reversible → fast)
export const RES_RESTORE_DWELL = 1.6;  // s of sustained headroom before giving a pixel-step back (conservative)
export const RES_RESTORE_AT = 59;      // median fps above which resolution is restored — a wide deadband vs the
                                       // 55 degrade line so a VRR panel reading ~57–60 can't hunt.

// Default ladder: pixel-scale multipliers applied ON TOP of the tier's base pixelRatio.
// Fill cost ≈ scale²: [1.0, .86, .73, .59, .45] → ≈ [1.0, .74, .53, .35, .20] of full.
// FLOOR = 0.45 (was 0.72). On-device Tempest-boss probes (VOIDMAW, 3× Retina) proved the frame
// is DPR/fill-bound: `?pr=1` (effective ~0.9) held TIER 0 with every feature at avg 58, while the
// shipped 0.72 floor could only trim tier-0 to 2.0×0.72 = 1.44 effective — still too heavy, so the
// controller bailed to a FEATURE-tier drop instead. Deepening the floor to 0.45 lets the governor
// trim tier-0 to ~0.9 effective and HOLD full features (confirmed: `?dynresmin=0.45` → tier 0,
// avg 57, p95 20ms, vs the 0.72 baseline's tier 1, avg 51, p95 27ms). Spend pixels, keep the look:
// on a stylized phone frame the bloom + grading dither hide the density loss. Idle/light scenes
// never trim this deep (the governor only steps down under sustained load), so crisp stays crisp.
export const RES_STEPS = buildResSteps(0.45, 5);

// Build a ladder from full (1.0) down to `min` in `n` even steps. `?dynresmin=<n>` lets the
// owner push the floor deeper (more fill headroom) or shallower (crisper) from device data.
export function buildResSteps(min = 0.72, n = 5) {
  min = Math.max(0.4, Math.min(1.0, min));
  const steps = [];
  for (let i = 0; i < n; i++) steps.push(+(1.0 - (1.0 - min) * (i / (n - 1))).toFixed(3));
  return steps;
}

export function makeResGov(steps = RES_STEPS) {
  return { steps, idx: 0, degTimer: 0, resTimer: 0 };
}

// Snap back to full resolution and clear the timers. Called on every tier flip so each
// tier is (re)evaluated at full res and the governor re-trims within it — no double-dip
// between the tier's own resolution drop and the governor's.
export function resGovReset(g) { g.idx = 0; g.degTimer = 0; g.resTimer = 0; }

// One decision. Pure given its inputs; mutates only the governor's own timers/idx.
//   medFps    — windowed MEDIAN fps (never an instantaneous/EMA reading — hitches must not move it)
//   tier      — current quality tier (0 = full features)
//   degradeAt — the tier's own "genuinely slow" fps line (55 at tier0); reused so the governor
//               shares the tier controller's VRR-safe threshold and always acts BEFORE it (shorter dwell)
//   dt        — frame delta (s)
//   canRestore— caller gate (e.g. not mid-boss / mid-flow-carve) so a pixel-restore never lands in a tense beat
// Returns { idx, changed, owned }:
//   changed — the ladder index moved → the caller must realloc to steps[idx]
//   owned   — the governor is handling this frame; the caller should SKIP its tier degrade/restore.
//             True only while the governor still has resolution headroom to give (idx < last) or is
//             restoring at tier0. At the floor it returns owned:false so the tier controller takes over.
export function resGovStep(g, { medFps, tier, degradeAt, dt, canRestore }) {
  const lastIdx = g.steps.length - 1;
  // DEGRADE — trim a pixel-step while the median is below the slow line AND we still have steps.
  if (medFps < degradeAt && g.idx < lastIdx) {
    g.degTimer += dt; g.resTimer = 0;
    if (g.degTimer > RES_DWELL) { g.idx++; g.degTimer = 0; return { idx: g.idx, changed: true, owned: true }; }
    return { idx: g.idx, changed: false, owned: true };   // dwelling — still owns the frame (block the tier drop)
  }
  // RESTORE — give a pixel-step back only with features fully up (tier0) and clear, sustained headroom.
  if (g.idx > 0 && tier === 0 && canRestore && medFps > RES_RESTORE_AT) {
    g.resTimer += dt; g.degTimer = 0;
    if (g.resTimer > RES_RESTORE_DWELL) { g.idx--; g.resTimer = 0; return { idx: g.idx, changed: true, owned: true }; }
    return { idx: g.idx, changed: false, owned: true };
  }
  g.degTimer = 0; g.resTimer = 0;
  return { idx: g.idx, changed: false, owned: false };     // idle / at floor → the tier controller owns it
}
