// pulseTimer.js — the SHARED deterministic strike/pulse scheduler (TEMPEST §B.4b).
//
// A pure, seeded CPU clock that opens INTERMITTENT strike WINDOWS in BURST CLUSTERS
// and rests between them — the temporal spine of the Thunderhead Tempest's Storm
// Circuit ("Vesper withholds; Tempest THREATENS": the lightning flickers in cruise,
// it never holds). Confirmed absent from the codebase this session; the architecture
// copies bossRhythm.js (a PURE, deterministic-given-rng phrase machine that CI gates
// simulate headlessly) and the integrated-phase law (dragon.js: advance by dt, never
// `time·freq`). Tocsin reuses this module for its ring pulses — so it lands HERE, at
// Tempest I0, before any lightning geometry exists.
//
// DESIGN LAWS (all machine-tested in tests/pulsetimer.mjs):
//  • Pure module — no THREE, no DOM, no globals, and NO Date.now / Math.random / argless
//    `new Date()` (they would break determinism + the harness resume). Time only ever
//    enters through `tick(dt)`; randomness only through a seeded mulberry32.
//  • BURST CLUSTERS, not a metronome: a burst is `burstN∈[burstMin,burstMax]` strike
//    windows (each 0.10–0.28 s) separated by 0.30–0.70 s intra-gaps, then a REST sized so
//    the long-run LIT FRACTION equals `duty` exactly. A storm flickers in bursts, then
//    breathes — never a strobe.
//  • Photosensitivity caps live IN the module, not at the call site (§10.6 / SF7): window
//    floor 0.10 s ≥ the 80 ms cap floor; rest floor 1.2 s; within-window flicker is a
//    fixed ≤3 Hz cosine dip. No call site can strobe faster than the cap.
//  • Deterministic + PINNABLE: `pin(t01)` freezes the schedule at a named point for
//    pixel-comparable gate captures (0 = the standing/rest frame, 0.5 = a mid-window
//    strike peak) — the MARROWCOIL determinism law extended to timed spectacle. Wired to
//    `?strikePin=<t01>` in dragon.js and a `strike` state in dragonstudio.

// mulberry32 — a tiny deterministic PRNG (same seed → same stream). Integer seed in,
// a `() → [0,1)` generator out. No global state, no Math.random.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The within-window intensity envelope: rise 0→1 over `RISE` s, hold, fall over `FALL` s
// (no hard square wave — a bolt swells and decays), with a fixed ≤3 Hz cosine flicker dip
// ("the storm is alive, not lit"). Pure function of (seconds-into-window, window length).
const RISE = 0.030, FALL = 0.060;   // 30 ms up, 60 ms down (§B.4b)
const FLICKER_HZ = 3;               // the photosensitivity ceiling, baked as the modulation rate
const FLICKER_DEPTH = 0.16;         // shallow — a live shimmer, never a strobe

function envelope(tIn, W) {
  if (tIn <= 0 || tIn >= W) return 0;
  let base;
  if (tIn < RISE) base = tIn / RISE;
  else if (tIn > W - FALL) base = Math.max(0, (W - tIn) / FALL);
  else base = 1;
  // ≤3 Hz cosine dip; peak (base=1, cos=1) stays exactly 1 so the strike core still hits its cap.
  const dip = FLICKER_DEPTH * (0.5 - 0.5 * Math.cos(2 * Math.PI * FLICKER_HZ * tIn));
  return base * (1 - dip);
}

// createPulseTimer — the factory. Options (all optional except seed/duty):
//   seed        integer PRNG seed (same seed → identical window schedule)
//   duty        target long-run LIT fraction (arcDuty per form: 0.06→0.18)
//   windowMin/Max   strike-window length bounds  (default 0.10 / 0.28 s)
//   burstMin/Max    windows per burst cluster    (default 1 / 4)
//   gapMin/Max      intra-burst dark gaps        (default 0.30 / 0.70 s)
//   restFloor       minimum inter-burst rest     (default 1.2 s — the §10.6 cap)
//   downstrokeApex  flap phase (0..1) strikes bias toward (default 0.5)
//   biasBudget      max seconds a window open may be delayed to catch the apex (default 0.25)
export function createPulseTimer(opts = {}) {
  const duty = opts.duty ?? 0.10;
  const windowMin = opts.windowMin ?? 0.10;
  const windowMax = opts.windowMax ?? 0.28;
  const burstMin = opts.burstMin ?? 1;
  const burstMax = opts.burstMax ?? 4;
  const gapMin = opts.gapMin ?? 0.30;
  const gapMax = opts.gapMax ?? 0.70;
  const restFloor = opts.restFloor ?? 1.2;
  const downstrokeApex = opts.downstrokeApex ?? 0.5;
  const biasBudget = opts.biasBudget ?? 0.25;

  let rng;
  let phase;          // 'window' | 'gap' | 'rest'
  let tInPhase;       // seconds elapsed in the current phase
  let plan;           // current burst plan: { windows:[], gaps:[], rest }
  let windowIdx;      // which window of the current burst
  let burstIdx;       // how many bursts have started (monotonic)
  let tGlobal;        // total elapsed seconds
  let delayAccum;     // seconds a pending window has been held for the downstroke bias
  let pinned;         // null, or a t01 the schedule is frozen at

  // Build the next burst cluster. `rest` is solved so the exact cycle duty == duty:
  //   duty = litSum / (litSum + gapSum + rest)  ⇒  rest = litSum/duty − litSum − gapSum
  // clamped to the ≥restFloor photosensitivity floor (the clamp only bites at short bursts /
  // high duty, and the long-run test tolerates ±10%).
  function planBurst() {
    const n = burstMin + Math.floor(rng() * (burstMax - burstMin + 1));
    const windows = [];
    for (let i = 0; i < n; i++) windows.push(windowMin + rng() * (windowMax - windowMin));
    const gaps = [];
    for (let i = 0; i < n - 1; i++) gaps.push(gapMin + rng() * (gapMax - gapMin));
    const litSum = windows.reduce((s, w) => s + w, 0);
    const gapSum = gaps.reduce((s, g) => s + g, 0);
    const rest = Math.max(restFloor, litSum / duty - litSum - gapSum);
    return { windows, gaps, rest };
  }

  function reseed(seed) {
    rng = mulberry32((seed ?? opts.seed ?? 1) | 0);
    phase = 'rest';
    tInPhase = 0;
    plan = planBurst();
    windowIdx = 0;
    burstIdx = 0;
    tGlobal = 0;
    delayAccum = 0;
    pinned = null;
  }
  reseed(opts.seed);

  // Whether the flap phase is near the downstroke apex (within ±0.15 of the cycle) — the
  // window opens on the beat so "the bolt-frame flashes as the wing slams" (§D.4). Only
  // consulted when the caller passes a phaseHint; headless tests pass none → no bias, so
  // the schedule stays a pure function of dt.
  function nearApex(phaseHint01) {
    let d = Math.abs(phaseHint01 - downstrokeApex);
    d = Math.min(d, 1 - d);   // wrap on the [0,1) cycle
    return d <= 0.15;
  }

  // tick — advance the clock by `dt` seconds. `phaseHint01` (optional) is the live flap
  // phase for the downstroke bias; omit it (headless) for a pure dt-driven schedule.
  function tick(dt, phaseHint01) {
    if (pinned !== null) return;   // a pinned timer is frozen — ticks are inert
    tGlobal += dt;
    tInPhase += dt;
    // Resolve as many phase boundaries as this dt crossed (robust to large dt).
    let guard = 0;
    while (guard++ < 1000) {
      if (phase === 'window') {
        const W = plan.windows[windowIdx];
        if (tInPhase < W) break;
        tInPhase -= W;
        // window done → intra-gap, or the inter-burst rest after the last window
        if (windowIdx < plan.windows.length - 1) { phase = 'gap'; }
        else { phase = 'rest'; }
      } else if (phase === 'gap') {
        const G = plan.gaps[windowIdx];
        if (tInPhase < G) break;
        tInPhase -= G;
        windowIdx++;
        phase = 'window';
        delayAccum = 0;
      } else { // 'rest'
        if (tInPhase < plan.rest) break;
        tInPhase -= plan.rest;
        plan = planBurst();
        windowIdx = 0;
        burstIdx++;
        phase = 'window';
        delayAccum = 0;
      }
    }
    // Downstroke bias: hold an about-to-open window in the dark until the flap phase next
    // crosses the apex, up to biasBudget seconds. Deterministic given the dt/phase stream.
    if (phase === 'window' && tInPhase < 1e-6 && typeof phaseHint01 === 'number') {
      if (delayAccum < biasBudget && !nearApex(phaseHint01)) {
        delayAccum += dt;
        phase = 'hold';   // transient: emit dark until the apex or the budget runs out
      }
    }
    if (phase === 'hold') {
      if (delayAccum >= biasBudget || (typeof phaseHint01 === 'number' && nearApex(phaseHint01))) {
        phase = 'window';
        tInPhase = 0;
      } else {
        delayAccum += dt;
      }
    }
  }

  // state — the current read. `live` = inside a strike window; `env01` = the 0→1 intensity
  // the storm tick multiplies its peak by. A pinned timer returns a pure function of t01.
  function state() {
    if (pinned !== null) {
      const t01 = pinned;
      return {
        live: t01 > 0,
        env01: t01 <= 0 ? 0 : Math.sin(Math.PI * Math.min(1, t01)),
        burstIdx, windowIdx, t: tGlobal, pinned: t01,
      };
    }
    const live = phase === 'window';
    const env01 = live ? envelope(tInPhase, plan.windows[windowIdx]) : 0;
    return { live, env01, burstIdx, windowIdx, t: tGlobal, pinned: null };
  }

  // pin — freeze the schedule at a named phase for pixel-comparable captures. 0 = the
  // standing (no-strike) frame; 0.5 = a mid-window strike peak. pin(null) releases it.
  function pin(t01) { pinned = (t01 === null || t01 === undefined) ? null : +t01; }

  return { tick, state, pin, reseed };
}
