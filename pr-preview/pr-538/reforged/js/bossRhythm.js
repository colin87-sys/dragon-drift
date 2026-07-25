// bossRhythm.js — the §5i PHRASE MACHINE (lands with slot 5, EITHERWING).
//
// Ground truth the combat-feel research measured (BOSS-DESIGN §5i): every shipped
// boss shared ONE temporal envelope — a flat-uniform rest between strictly-serial
// attacks — so the roster differed in DENSITY, never RHYTHM. This module fixes it:
// it walks a boss's authored `def.rhythm` PHRASE (the canonical schema staged by
// #211) and, at the controller's cadence seam, returns one shot at a time —
// (the next attack id) + (the rest that follows it) — replacing the uniform
// `rand(ph.cadence)` roll. Each boss then owns a DISTINCT inter-attack-gap
// distribution (the `rhythmprint` CI gate asserts any two differ by a KS floor —
// variance as CI, not vibes).
//
// A phrase is an ordered list of MEASURES the machine walks and repeats:
//   { kind: 'sustain', attack, beats, gap }   `beats` shots, `gap` between them
//   { kind: 'burst',   attack, count, gap }   `count` shots, a tight `gap`
// `gap` is a scalar or a [lo,hi] uniform range. After the phrase's final shot the
// machine rests `restLo..restHi` by `restDist`:
//   'uniform'  → rand(restLo, restHi)
//   'bimodal'  → restLo OR restHi (a coin) — quick gaps + one long breath
//   'decaying' → restHi→restLo ramp over DECAY_STEPS repeats, then reset (a
//                crescendo / a tightening toward each slam)
// `ticket:{bpm,quantize}` snaps the fire to the live music beat via getBeatClock()
// (fairness subsidy) when a beat clock is passed in; inert (null) headless.
//
// It also owns the AMBER FLOOR (§5i C.1): if no amber-carrier volley has fired in
// AMBER_FLOOR_S and the phase's `attacks` can serve one, the next shot is SWAPPED
// to an amber-carrier — so every rolling 12s window carries parry fuel (the
// `amberdiet` CI gate). The machine is PURE + deterministic given an rng, so both
// gates simulate it headlessly.
//
// COEXIST RULE: a def WITHOUT `rhythm` never reaches this module — boss.js keeps
// the legacy uniform roll. Nothing here mutates the def.

// Amber-carriers: the attack ids whose volleys carry reflectable (amber) bullets
// — the parry economy's fuel. MUST stay in sync with boss.js executeAttack, which
// marks aimed/fan/crossfire reflectable and amber-tips every 4th `stream` tick
// (§5i C.1 hotfix). The amberdiet gate asserts every phase can serve one of these.
export const AMBER_CARRIERS = new Set(['aimed', 'fan', 'crossfire', 'stream']);

// Force an amber-carrier if none has fired in this long — comfortably inside the
// 12s CI window (a long authored rest can still add ~3s + a telegraph after the
// forced pick, so 7 keeps the worst-case fire-to-fire gap safely under 12).
export const AMBER_FLOOR_S = 7;

// Nominal telegraph the machine folds into its own clock so the amber-floor
// accounting tracks real time (the rhythmprint distribution is over REST values
// only, so this constant never touches the fingerprint).
const TELEGRAPH_EST = 0.6;

// A 'decaying' phrase rest ramps over this many repeats, then resets (the sawtooth
// crescendo). 4 gives a readable sparse→dense→cut arc within one card.
const DECAY_STEPS = 4;

export function hasAmberCarrier(attacks) {
  return attacks.some((a) => AMBER_CARRIERS.has(a));
}

const shotsOf = (m) => (m.kind === 'burst' ? (m.count ?? 1) : (m.beats ?? 1));
const gapOf = (m, rng) => (Array.isArray(m.gap) ? m.gap[0] + rng() * (m.gap[1] - m.gap[0]) : (m.gap ?? 0.5));

export function makeRhythm(def) {
  const R = def.rhythm;

  // Live clock (seconds) + the last time an amber-carrier fired, for the floor.
  let clock = 0;
  let lastAmberFire = 0;

  // Phrase cursor (reset at each phase seam) + the decaying-rest ramp position.
  let measureIdx = 0;
  let shotIdx = 0;
  let decayStep = 0;

  function phraseRest(ph, rng) {
    const lo = ph.restLo ?? 1.4, hi = ph.restHi ?? 2.0;
    if (ph.restDist === 'bimodal') return rng() < 0.5 ? lo : hi;
    if (ph.restDist === 'decaying') {
      const t = decayStep / Math.max(1, DECAY_STEPS - 1);
      decayStep = (decayStep + 1) % DECAY_STEPS;
      return hi - (hi - lo) * t;
    }
    return lo + rng() * (hi - lo);   // 'uniform' (default)
  }

  // Swap a non-amber shot for an amber-carrier when the parry fuel is about to run
  // dry and the phase can serve one (§5i C.1 fairness subsidy).
  function amberSwap(id, attacks, rng) {
    if (AMBER_CARRIERS.has(id)) return id;
    if ((clock - lastAmberFire) < AMBER_FLOOR_S) return id;
    const ambers = attacks.filter((a) => AMBER_CARRIERS.has(a));
    return ambers.length ? ambers[(rng() * ambers.length) | 0] : id;
  }

  function tick(id, rest) {
    const fireAt = clock + TELEGRAPH_EST;
    if (AMBER_CARRIERS.has(id)) lastAmberFire = fireAt;
    clock = fireAt + rest;
  }

  // Optional beat-lock: nudge the rest so the NEXT shot lands on the music grid
  // (§5i "rhythm is a fairness subsidy"). Only when a live beatClock is supplied
  // and the def declares a ticket — inert headless, so tests stay deterministic.
  function quantize(rest, beatClock) {
    if (!beatClock || !R.ticket) return rest;
    const div = R.ticket.quantize === '1/8' ? beatClock.beatLen / 2 : beatClock.beatLen;
    if (!(div > 0)) return rest;
    const landAt = TELEGRAPH_EST + rest;               // when the next shot would fire
    const snapped = Math.round(landAt / div) * div;    // nearest grid line
    // Never let quantization collapse a rest below a safe floor or overshoot wildly.
    return Math.max(0.28, snapped - TELEGRAPH_EST);
  }

  // nextStep: the single controller/gate entry point. Emits one shot — returns
  // { id, rest } and advances the machine's clock. `rest` is applied by the caller
  // AFTER the shot fires; `id` is telegraphed now. `beatClock` (optional) is a live
  // getBeatClock() reading for ticket quantization.
  function nextStep(phaseIdx, attacks, rng = Math.random, beatClock = null) {
    const ph = R.phases[phaseIdx];
    if (!ph || !ph.phrase || !ph.phrase.length) {
      // Malformed / missing phrase → a safe uniform fallback (never silently 0).
      const id0 = amberSwap(attacks[(rng() * attacks.length) | 0], attacks, rng);
      const rest0 = 1.8;
      tick(id0, rest0);
      return { id: id0, rest: rest0 };
    }
    const phrase = ph.phrase;
    const measure = phrase[measureIdx % phrase.length];
    // Advance the cursor past this shot; detect the phrase boundary.
    shotIdx++;
    let phraseEnd = false;
    if (shotIdx >= shotsOf(measure)) {
      shotIdx = 0;
      measureIdx++;
      if (measureIdx >= phrase.length) { measureIdx = 0; phraseEnd = true; }
    }
    let rest = phraseEnd ? phraseRest(ph, rng) : gapOf(measure, rng);
    rest = quantize(rest, beatClock);
    const id = amberSwap(measure.attack, attacks, rng);
    tick(id, rest);
    return { id, rest };
  }

  // reset: restart the phrase cursor at a phase seam (the crescendo re-ramps per
  // card, the cluster restarts clean). The amber-floor clock stays continuous.
  function reset() { measureIdx = 0; shotIdx = 0; decayStep = 0; }

  return { nextStep, reset, signature: R.signature, clockNow: () => clock };
}

// simulatePhase: headless driver for the rhythmprint / amberdiet gates. Runs the
// machine for `seconds` of one phase and returns the rest samples + the amber
// fire times (clock seconds). Deterministic given `rng`; no beat clock (headless).
export function simulatePhase(def, phaseIdx, attacks, seconds, rng = Math.random) {
  const rh = makeRhythm(def);
  const rests = [];
  const amberFires = [];
  let t = 0;
  while (t < seconds) {
    const step = rh.nextStep(phaseIdx, attacks, rng);
    if (AMBER_CARRIERS.has(step.id)) amberFires.push(t + TELEGRAPH_EST);
    rests.push(step.rest);
    t += TELEGRAPH_EST + step.rest;
  }
  return { rests, amberFires, endT: t };
}
