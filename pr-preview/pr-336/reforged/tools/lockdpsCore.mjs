// Pure LANCE damage-economy model — the analytic heart of the lockdps balance
// tool. It imports NOTHING: the CLI (tools/lockdps.mjs) and the band-gate test
// (tests/lockdps.mjs) each do their own headless boot and inject CONFIG, the
// boss table, and the EXPORTED lanceDmgEach kernel (js/lockLayer.js) so there is
// a single source of truth for per-lance damage. No fight loop is run: driveKill
// only ever fires Surge (never paints lances), so a natural loop reports lance=0
// — the LANCE economy is fully determined by config + the boss HP/phase model,
// which is what this computes. (As-played per-channel attribution via the
// bossHit{kind} tag would need a headless lance-persona — a future extension.)

// The HP span of each phase = (thisPhase.atFrac − nextPhase.atFrac) × hpMax.
// Mirrors currentPhaseHp() in boss.js (the input lanceDmgEach clamps against).
export function phaseSpans(def) {
  const phases = def.phases || [];
  const hpMax = def.hpMax || 0;
  return phases.map((p, i) => {
    const cur = p.atFrac ?? 1;
    const next = phases[i + 1]?.atFrac ?? 0;
    return Math.max(1, (cur - next) * hpMax);
  });
}

// The number of PAINT targets available in a given phase — mirrors boss.js
// paintableParts(): a lockPart counts when it has no phase gate OR its `phases`
// list includes this phaseIdx; the virtualLockOrgan joins any boss that has real
// lockParts (it is V1-aim-only on its own, and never phase-gated). Runtime
// destruction (lockPartDead) is dynamic and out of scope for a static model.
export function phaseTargets(def, phaseIdx) {
  const lps = def.lockParts || [];
  if (!lps.length) return 0;                       // virtual-only ⇒ no painting at all
  let n = 0;
  for (const lp of lps) if (!lp.phases || lp.phases.includes(phaseIdx)) n++;
  if (def.virtualLockOrgan) n++;
  return n;
}

// The REACHABLE pip cap for a boss IN A GIVEN PHASE — the number the volley
// economy actually uses. It is NOT just capByTier[tier]:
//   1. A boss with a virtualLockOrgan but NO `def.lockParts` is V1-AIM-ONLY — it
//      cannot be painted at all (paintableParts returns null there). No lockParts
//      ⇒ lance inert.
//   2. Each paint target holds at most `stackMax` stacks (tiers ≥3; 1 otherwise),
//      so PER PHASE a boss can only reach min(tierCap, phaseTargets × stackMax) —
//      e.g. BRINEHOLM phase 4 gates out its 3 shackles (`phases:[0,1,2]`), leaving
//      only the eye ⇒ 1×2 = 2 pips, not the tier-3 five.
export function reachableCap(def, LOCK, phaseIdx) {
  const tier = def.tier || 1;
  const tierCap = (LOCK.capByTier || {})[tier] ?? 0;
  const nLockParts = def.lockParts ? def.lockParts.length : 0;
  const paintable = tierCap > 0 && nLockParts > 0;
  const nTargets = paintable ? phaseTargets(def, phaseIdx) : 0;
  const perTarget = tier >= 3 ? (LOCK.stackMax || 1) : 1;
  const capPips = paintable ? Math.min(tierCap, nTargets * perTarget) : 0;
  return { tierCap, paintable, nTargets, capPips };
}

// Per-boss LANCE economy, computed PER PHASE (a phase-gated lockPart changes the
// reachable cap between phases). Each phase carries its own capPips + ROI-clamped
// per-lance/full-volley damage (base + beat), whether the clamp bites, the volley
// as a fraction of the phase, and pure-lance volleys-to-clear.
export function bossEconomy(def, LOCK, lanceDmgEach) {
  const tier = def.tier || 1;
  const tierCap = (LOCK.capByTier || {})[tier] ?? 0;
  const nLockParts = def.lockParts ? def.lockParts.length : 0;
  const lanceCapable = tierCap > 0 && nLockParts > 0;
  const roiFrac = LOCK.volleyRoiFrac;
  const beatMult = LOCK.beatMult;
  const spans = phaseSpans(def);
  const phases = spans.map((phaseHp, i) => {
    const capPips = lanceCapable ? reachableCap(def, LOCK, i).capPips : 0;
    const nTargets = lanceCapable ? phaseTargets(def, i) : 0;
    const each = lanceDmgEach(capPips, phaseHp, 1);
    const eachBeat = lanceDmgEach(capPips, phaseHp, beatMult);
    const volley = capPips * each;
    const volleyBeat = capPips * eachBeat;
    const roiCeil = roiFrac * phaseHp;
    const clamped = capPips > 0 && volley >= roiCeil - 1e-9;
    const pct = phaseHp > 0 ? volley / phaseHp : 0;
    const toClear = volley > 0 ? Math.ceil(phaseHp / volley) : Infinity;
    return { phaseHp, nTargets, capPips, each, volley, volleyBeat, roiCeil, clamped, pct, toClear };
  });
  const totalHp = spans.reduce((a, b) => a + b, 0);
  const clearable = phases.filter((p) => isFinite(p.toClear));
  const totalVolleys = clearable.reduce((a, p) => a + p.toClear, 0);
  const peakCap = phases.reduce((m, p) => Math.max(m, p.capPips), 0);
  const capVaries = new Set(phases.filter((p) => p.capPips > 0).map((p) => p.capPips)).size > 1;
  const reason = lanceCapable ? null
    : (tierCap === 0 ? 'tier cap 0 (Sentinel)' : 'no paint targets (V1 aim only)');
  return {
    id: def.id, name: def.name, tier, hpMax: def.hpMax || 0,
    tierCap, peakCap, capVaries, lanceCapable, reason,
    phases, totalHp, totalVolleys,
    allPhasesClearable: clearable.length === phases.length,
  };
}

// Cadence ESTIMATE (a labelled convenience, NOT a law): the wall-clock to bank a
// full cap then auto-release. perPaint = dwellTime (aim-dwell to paint an organ)
// + paintCooldown (the cross-organ embargo); + capFuse before the auto-loose.
export function volleyCadence(capPips, LOCK) {
  if (!capPips) return 0;
  const perPaint = (LOCK.dwellTime || 0) + (LOCK.paintCooldown || 0);
  return capPips * perPaint + (LOCK.capFuse || 0);
}

// The whole roster in BOSS_ORDER, each row carrying its economy + a pure-lance
// TTK estimate summed across phases at each phase's own cadence (Infinity for a
// lance-inert boss).
export function allEconomies(CONFIG, BOSSES, BOSS_ORDER, lanceDmgEach) {
  const LOCK = CONFIG.LOCK;
  return BOSS_ORDER.map((key) => {
    const def = BOSSES[key];
    const e = bossEconomy(def, LOCK, lanceDmgEach);
    e.lanceTtk = e.lanceCapable
      ? e.phases.reduce((a, p) => a + (isFinite(p.toClear) ? p.toClear * volleyCadence(p.capPips, LOCK) : 0), 0)
      : Infinity;
    return e;
  });
}

// The invariants a --ci run (and the band-gate test) enforce. Returns a list of
// human-readable breaches; empty = healthy.
//   1. ROI LAW: every base volley ≤ volleyRoiFrac × phaseHp (the release clamp).
//   2. BEAT LAW: the ×beatMult volley ALSO stays ≤ the ROI ceiling (beatMult is
//      applied INSIDE the clamp — a perfect release never breaches the phase-HP
//      law). This is the one that would catch a regression moving beatMult out.
//   3. CAP LADDER: the reachable per-phase capPips never EXCEEDS the tier cap (it
//      may be lower when a phase has too few paint targets to reach it).
export function invariantBreaches(economies, LOCK) {
  const out = [];
  const eps = 1e-9;
  for (const e of economies) {
    const tierCap = (LOCK.capByTier || {})[e.tier] ?? 0;
    e.phases.forEach((p, i) => {
      if (p.capPips > tierCap) out.push(`${e.id} phase ${i + 1}: capPips ${p.capPips} > tier cap ${tierCap}`);
      if (p.capPips > 0 && p.volley > p.roiCeil + eps) {
        out.push(`${e.id} phase ${i + 1}: volley ${p.volley.toFixed(2)} > ROI ceil ${p.roiCeil.toFixed(2)}`);
      }
      if (p.capPips > 0 && p.volleyBeat > p.roiCeil + eps) {
        out.push(`${e.id} phase ${i + 1}: BEAT volley ${p.volleyBeat.toFixed(2)} breaches ROI ceil ${p.roiCeil.toFixed(2)}`);
      }
    });
  }
  return out;
}
