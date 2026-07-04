// bossRhythm.js — the §5i PHRASE MACHINE (lands with slot 5, EITHERWING).
//
// Ground truth the combat-feel research measured (BOSS-DESIGN §5i): every shipped
// boss shared ONE temporal envelope — a flat-uniform rest between strictly-serial
// attacks — so the roster differed in DENSITY, never RHYTHM. This module fixes
// that: it turns a `def.rhythm` SIGNATURE into a stateful scheduler the controller
// polls at the cadence seam for (a) the next attack id and (b) the rest that
// follows it, replacing the uniform `rand(ph.cadence)` roll so each boss owns a
// DISTINCT inter-attack-gap distribution (the `rhythmprint` CI gate asserts any
// two bosses differ by a KS-distance floor — variance as CI, not vibes).
//
// It also owns the AMBER FLOOR (§5i C.1): if no amber-carrier attack has fired in
// AMBER_FLOOR_S and the phase can serve one, the next pick is FORCED to an
// amber-carrier — so every rolling 12s window carries parry fuel (the `amberdiet`
// CI gate). The machine is PURE + deterministic given an rng, so both gates
// simulate it headlessly.
//
// COEXIST RULE: a def WITHOUT `rhythm` never reaches this module — boss.js keeps
// the legacy uniform roll. Nothing here mutates the def.

// Amber-carriers: the attack ids whose volleys carry reflectable (amber) bullets
// — the parry economy's fuel. MUST stay in sync with boss.js executeAttack, which
// marks aimed/fan/crossfire reflectable and amber-tips every 4th `stream` tick
// (§5i C.1 hotfix). The amberdiet gate asserts every phase can serve one of these.
export const AMBER_CARRIERS = new Set(['aimed', 'fan', 'crossfire', 'stream']);

// Force an amber-carrier if none has fired in this long — comfortably inside the
// 12s CI window (a long authored rest can still add ~2.5s + a telegraph after the
// forced pick, so 7 keeps the worst-case fire-to-fire gap safely under 12).
export const AMBER_FLOOR_S = 7;

// Nominal telegraph the machine folds into its own clock so the amber-floor
// accounting tracks real time (the rhythmprint distribution is over REST values
// only, so this constant never touches the fingerprint).
const TELEGRAPH_EST = 0.6;

export function hasAmberCarrier(attacks) {
  return attacks.some((a) => AMBER_CARRIERS.has(a));
}

// callResponse lane split: the twins alternate an aimed-TEMPO phrase (lane B) with
// a lane-DENIAL wall phrase (lane A); the eye handoff is the baton between them.
const LANE_DENIAL = new Set(['movingGap', 'secondWave', 'curtain', 'iris', 'tunnel']);
const LANE_TEMPO = new Set(['aimed', 'crossfire', 'stream', 'fan', 'spiral', 'spiralStream']);

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function makeRhythm(def) {
  const R = def.rhythm;
  const sig = R.signature;
  const phaseKnobs = R.phases || [];

  // Live clock (seconds) + the last time an amber-carrier fired, for the floor.
  let clock = 0;
  let lastAmberFire = 0;

  // Per-signature phrase counters.
  let cresPos = 0;      // crescendo ramp index
  let burstLeft = 0;    // ambush / burstSustain: quick shots remaining in the cluster
  let callTurn = 0;     // callResponse: which twin is "up" (0/1)

  function knob(phaseIdx) { return phaseKnobs[phaseIdx] || {}; }

  // The rest AFTER the attack picked this step (the rhythmprint fingerprint).
  function restFor(phaseIdx, rng) {
    const k = knob(phaseIdx);
    const tighten = k.tighten ?? 1;   // per-phase escalation scalar (keeps the signature SHAPE)
    let rest;
    if (sig === 'metronome') {
      // Fixed pulse — the teacher; tension is consistency. Tiny humanize jitter
      // keeps the variance near-delta so KS separates it from every spread.
      const pulse = k.pulse ?? 1.9;
      rest = pulse + (rng() - 0.5) * 0.06;
    } else if (sig === 'crescendo') {
      // One ramp per card: sparse → dense, then a hard reset (§5i STORMREND).
      const hi = k.hi ?? 2.4, lo = k.lo ?? 1.05, steps = k.steps ?? 5;
      const t = cresPos / Math.max(1, steps - 1);
      rest = hi - (hi - lo) * t;
      cresPos = (cresPos + 1) % steps;
    } else if (sig === 'ambushRest') {
      // Long circling silence, then a sforzando cluster (§5i ASHTALON): the rest
      // IS the dread. Bimodal, short-heavy.
      const long = k.rest ?? 3.1, gap = k.gap ?? 0.5, burst = k.burst ?? 3;
      if (burstLeft > 0) { rest = gap; burstLeft--; }
      else { rest = long; burstLeft = burst - 1; }
    } else if (sig === 'burstSustain') {
      // Alternate a sustained stream's trailing rest with a discrete wall burst
      // (§5i MARROWCOIL): coil sweep continuous vs rib slams discrete. Even bimodal.
      const sustainRest = k.sustainRest ?? 2.3, wallGap = k.wallGap ?? 0.72, wallBurst = k.wallBurst ?? 2;
      if (burstLeft > 0) { rest = wallGap; burstLeft--; }
      else { rest = sustainRest; burstLeft = wallBurst - 1; }
    } else if (sig === 'callResponse') {
      // Twins alternate A-B phrases; the eye handoff is the baton (§5i EITHERWING).
      // A longer HANDOFF rest (the baton crossing) then the other twin's quick
      // RESPONSE. Tight bimodal — the phrases never overlap (except the dread card,
      // which the controller drives separately).
      const response = k.response ?? 0.62, handoff = k.handoff ?? 1.55;
      rest = (callTurn === 0) ? handoff : response;
    } else {
      rest = 1.8;   // unknown signature → sane default (never silently zero)
    }
    return Math.max(0.28, rest * tighten);
  }

  function pickAttack(phaseIdx, attacks, rng) {
    const ambers = attacks.filter((a) => AMBER_CARRIERS.has(a));
    // AMBER FLOOR: if the parry fuel is about to run dry and this phase can serve
    // it, force an amber-carrier this step (§5i C.1).
    if (ambers.length && (clock - lastAmberFire) >= AMBER_FLOOR_S) {
      return ambers[(rng() * ambers.length) | 0];
    }
    if (sig === 'callResponse') {
      // Alternate lane-DENIAL (twin A) and aimed-TEMPO (twin B) sets; the handoff
      // rest sits BEFORE the lane switch (the baton passes, then the other fires).
      const pool = (callTurn === 0)
        ? attacks.filter((a) => LANE_TEMPO.has(a))
        : attacks.filter((a) => LANE_DENIAL.has(a));
      const use = pool.length ? pool : attacks;
      return use[(rng() * use.length) | 0];
    }
    return attacks[(rng() * attacks.length) | 0];
  }

  // nextStep: the single controller/gate entry point. Returns { id, rest } and
  // advances the machine's clock so the amber floor tracks real time. The `rest`
  // is applied by the caller AFTER the attack fires; `id` is telegraphed now.
  function nextStep(phaseIdx, attacks, rng = Math.random) {
    const id = pickAttack(phaseIdx, attacks, rng);
    const rest = restFor(phaseIdx, rng);
    // The attack fires after its telegraph; account the amber fire at that time.
    const fireAt = clock + TELEGRAPH_EST;
    if (AMBER_CARRIERS.has(id)) lastAmberFire = fireAt;
    if (sig === 'callResponse') callTurn ^= 1;   // the baton crosses each phrase
    clock = fireAt + rest;
    return { id, rest };
  }

  // reset: restart the phrase state (called on phase transitions so crescendo
  // re-ramps per card and the ambush cluster restarts clean). Keeps the clock so
  // the amber floor stays continuous across the transition.
  function reset() { cresPos = 0; burstLeft = 0; callTurn = 0; }

  return { nextStep, reset, signature: sig, clockNow: () => clock };
}

// simulatePhase: headless driver for the rhythmprint / amberdiet gates. Runs the
// machine for `seconds` of one phase and returns the rest samples + the amber
// fire times (clock seconds). Deterministic given `rng`.
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
