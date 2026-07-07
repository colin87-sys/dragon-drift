// Pure LANCE damage-economy model — the analytic heart of the lockdps balance
// tool. It imports NOTHING: the CLI (tools/lockdps.mjs) and the band-gate test
// (tests/lockdps.mjs) each do their own headless boot, then inject CONFIG, the
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

// Per-boss LANCE economy. capPips = the tier's pip cap (0 ⇒ lance disabled, the
// tier-1 Sentinels). For each phase: the ROI-clamped per-lance and full-volley
// damage (base + beat), whether the ROI clamp bites, the volley as a fraction of
// the phase, and pure-lance volleys-to-clear.
export function bossEconomy(def, LOCK, lanceDmgEach) {
  const tier = def.tier || 1;
  const capPips = (LOCK.capByTier || {})[tier] ?? 0;
  const roiFrac = LOCK.volleyRoiFrac;
  const beatMult = LOCK.beatMult;
  const spans = phaseSpans(def);
  const phases = spans.map((phaseHp) => {
    const each = lanceDmgEach(capPips, phaseHp, 1);
    const eachBeat = lanceDmgEach(capPips, phaseHp, beatMult);
    const volley = capPips * each;
    const volleyBeat = capPips * eachBeat;
    const roiCeil = roiFrac * phaseHp;
    // The volley is ROI-CLAMPED when the raw damage (capPips × lanceDmg) would
    // exceed the phase-HP ceiling — i.e. the lance is capped by the boss's HP,
    // not by lanceDmg. Otherwise it is raw/lanceDmg-limited.
    const clamped = capPips > 0 && volley >= roiCeil - 1e-9;
    const pct = phaseHp > 0 ? volley / phaseHp : 0;
    const toClear = volley > 0 ? Math.ceil(phaseHp / volley) : Infinity;
    return { phaseHp, each, volley, volleyBeat, roiCeil, clamped, pct, toClear };
  });
  const totalHp = spans.reduce((a, b) => a + b, 0);
  const totalVolleys = phases.reduce((a, p) => a + (isFinite(p.toClear) ? p.toClear : 0), 0);
  return {
    id: def.id, name: def.name, tier, hpMax: def.hpMax || 0,
    capPips, lanceCapable: capPips > 0, phases, totalHp, totalVolleys,
  };
}

// Cadence ESTIMATE (a labelled convenience, NOT a law): the wall-clock to bank a
// full cap then auto-release. perPaint = dwellTime (aim-dwell to paint an organ)
// + paintCooldown (the cross-organ embargo); + capFuse before the auto-loose.
// Focus (held) halves the dwell — reported separately by the caller if wanted.
export function volleyCadence(capPips, LOCK) {
  if (!capPips) return 0;
  const perPaint = (LOCK.dwellTime || 0) + (LOCK.paintCooldown || 0);
  return capPips * perPaint + (LOCK.capFuse || 0);
}

// The whole roster in BOSS_ORDER, each row carrying its economy + the cadence-
// derived pure-lance TTK estimate (Infinity for a lance-disabled tier-1).
export function allEconomies(CONFIG, BOSSES, BOSS_ORDER, lanceDmgEach) {
  const LOCK = CONFIG.LOCK;
  return BOSS_ORDER.map((key) => {
    const def = BOSSES[key];
    const e = bossEconomy(def, LOCK, lanceDmgEach);
    e.cadence = volleyCadence(e.capPips, LOCK);
    e.lanceTtk = e.lanceCapable && isFinite(e.totalVolleys) ? e.totalVolleys * e.cadence : Infinity;
    return e;
  });
}

// The invariants a --ci run (and the band-gate test) enforce. Returns a list of
// human-readable breaches; empty = healthy.
//   1. ROI LAW: every base volley ≤ volleyRoiFrac × phaseHp (the release clamp).
//   2. BEAT LAW: the ×beatMult volley ALSO stays ≤ the ROI ceiling (beatMult is
//      applied INSIDE the clamp — a perfect release never breaches the phase-HP
//      law). This is the one that would catch a regression moving beatMult out.
//   3. CAP LADDER: capPips === capByTier[tier] for every boss.
export function invariantBreaches(economies, LOCK) {
  const out = [];
  const eps = 1e-9;
  for (const e of economies) {
    const wantCap = (LOCK.capByTier || {})[e.tier] ?? 0;
    if (e.capPips !== wantCap) out.push(`${e.id}: capPips ${e.capPips} ≠ capByTier[${e.tier}] ${wantCap}`);
    e.phases.forEach((p, i) => {
      if (e.capPips > 0 && p.volley > p.roiCeil + eps) {
        out.push(`${e.id} phase ${i + 1}: volley ${p.volley.toFixed(2)} > ROI ceil ${p.roiCeil.toFixed(2)}`);
      }
      if (e.capPips > 0 && p.volleyBeat > p.roiCeil + eps) {
        out.push(`${e.id} phase ${i + 1}: BEAT volley ${p.volleyBeat.toFixed(2)} breaches ROI ceil ${p.roiCeil.toFixed(2)}`);
      }
    });
  }
  return out;
}
