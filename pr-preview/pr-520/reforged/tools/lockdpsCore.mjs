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
// ── MULTI-FORM (def.formLifebars): each phase is its OWN full hpMax bar (the form
// refills to full at each transition — boss.js currentPhaseHp() returns hpMax, :4557),
// NOT an atFrac slice of one shared bar. So every span IS hpMax. Without this the model
// under-states the finale's form HP ([96,72,72] vs [240,240,240]), corrupting its ROI
// ceiling AND the not-a-phase-deleter TTK — the exact clamp-never-bites property the
// APEX leans on. THE UNMASKED is the only formLifebars boss, so every other row is
// byte-identical (§rung14 CP1).
export function phaseSpans(def) {
  const phases = def.phases || [];
  const hpMax = def.hpMax || 0;
  if (def.formLifebars) return phases.map(() => Math.max(1, hpMax));
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

// The realistic wall-clock to bank ONE pip under fire (dwell + cross-organ cooldown +
// the dodging tax between paints) — the calibrated per-pip cost the not-a-phase-deleter
// model prices on-tell spam against. NOT LOCK.dwellTime (that frictionless ideal wrongly
// condemns even the shipped game — §8C).
// ⚠ HONESTY (§CP2 SHOULD-FIX-4): this bounds CALIBRATED-HUMAN cadence, NOT the runtime
// mechanical floor. The engine has no per-release cooldown, so a TAS-limit player banking
// at ~0.4-0.57 s/pip (+ free parry-snaps) and loosing one burnFloor set per toll can
// exceed the modeled DPS (~2.3× at the limit), crossing the tightest margins. A HARD
// runtime bound would need a burn ICD / per-release cooldown — an owner-level LAW change,
// deliberately NOT snuck in here. This invariant certifies the MODEL is fair; the runtime
// is fair for human play, gated by the toll cadence + the 0.24s window.
export const REALISTIC_PER_PIP = 1.35;

// SCAR-BURN fraction for a boss (§4b): the per-slot burn frac if the boss is at/above
// minTier and carries a fracBySlot entry, else 0 (tiers 1-3 + un-keyed bosses = no burn).
export function scarFrac(def, LOCK) {
  const sb = LOCK.scarBurn;
  if (!sb || (def.tier || 1) < (sb.minTier ?? Infinity)) return 0;
  return sb.fracBySlot?.[def.id] ?? 0;
}

// Per-boss LANCE economy, computed PER PHASE (a phase-gated lockPart changes the
// reachable cap between phases). Each phase carries its own capPips + ROI-clamped
// per-lance/full-volley damage (base + beat), the SCAR-BURN a perfect on-tell full
// release adds, whether the clamp bites, the volley as a fraction of the phase, and
// pure-lance volleys-to-clear + the not-a-phase-deleter TTK vs the card timer.
export function bossEconomy(def, LOCK, lanceDmgEach) {
  const tier = def.tier || 1;
  const tierCap = (LOCK.capByTier || {})[tier] ?? 0;
  const nLockParts = def.lockParts ? def.lockParts.length : 0;
  const lanceCapable = tierCap > 0 && nLockParts > 0;
  const roiFrac = LOCK.volleyRoiFrac;
  const beatMult = LOCK.beatMult;
  const burnFrac = scarFrac(def, LOCK);
  const burnFloor = LOCK.scarBurn?.burnFloor ?? Infinity;
    // §5i.C rung 12 SPECTRAL ECHO (ONEWING): granted GHOST pips (def.echoPips) are added ON TOP of
    // the dwell cap — they cost NO dwell time (a frame paint grants them free) but strike at echoMult
    // (config). So the economy prices EFFECTIVE pips for damage (dwell + echoMult × ghost) while the
    // deleter DPS charges TIME for real dwell pips only. echoPips 0 ⇒ every line collapses to the
    // pre-echo arithmetic (byte-identical for every other boss).
  const echoPips = def.echoPips || 0;
  const echoMult = LOCK.scarBurn?.echoDmgMult ?? 0.5;
  const spans = phaseSpans(def);
  const phases = spans.map((phaseHp, i) => {
    const dwellCap = lanceCapable ? reachableCap(def, LOCK, i).capPips : 0;
    const nTargets = lanceCapable ? phaseTargets(def, i) : 0;
    const gCap = dwellCap > 0 ? Math.max(0, Math.min(echoPips, tierCap - dwellCap)) : 0;  // ghosts that fit under the tier cap
    const capPips = dwellCap + gCap;                    // TOTAL pips banked (dwell + ghost) — fills the cap
    const effPips = dwellCap + echoMult * gCap;         // EFFECTIVE damage pips (ghosts at half)
    const each = lanceDmgEach(effPips, phaseHp, 1);
    const eachBeat = lanceDmgEach(effPips, phaseHp, beatMult);
    const volley = effPips * each;
    const volleyBeat = effPips * eachBeat;
    const roiCeil = roiFrac * phaseHp;
    const clamped = capPips > 0 && volley >= roiCeil - 1e-9;
    const pct = phaseHp > 0 ? volley / phaseHp : 0;
    const toClear = volley > 0 ? Math.ceil(phaseHp / volley) : Infinity;
    // SCAR-BURN: a PERFECT on-tell full-cap release burns `burnFrac × volleyBeat` extra over dur
    // (the burn scales the already-ROI-clamped beat volley; a ghost never earns it — floor on the
    // REAL dwell pips). totalRelease is the full earned yield of one perfect full release.
    const burn = dwellCap >= burnFloor ? burnFrac * volleyBeat : 0;
    const totalRelease = volleyBeat + burn;
    // NOT-A-PHASE-DELETER (§8C): the exploit-optimal SUSTAINED on-tell DPS — max over REAL release
    // sizes k of (effVolley(k)+burn(k)) / (k · REALISTIC_PER_PIP). Ghosts (g, free) ride along at
    // half but cost no time, so they RAISE the DPS beyond their pip count — the term the model must
    // see or the deleter gate passes vacuously (the SCAR-BURN dead-invariant trap).
    let worstDps = 0;
    for (let k = 1; k <= dwellCap; k++) {
      const g = gCap > 0 ? Math.min(gCap, k) : 0;     // ~1 free ghost per fresh frame organ painted
      const effK = k + echoMult * g;
      const vB = effK * lanceDmgEach(effK, phaseHp, beatMult);
      const bn = k >= burnFloor ? burnFrac * vB : 0;
      const dps = (vB + bn) / (k * REALISTIC_PER_PIP);
      if (dps > worstDps) worstDps = dps;
    }
    const cardTimer = def.cards?.[i]?.timer ?? null;   // NB the def field is `cards`, not `titleCards` (§CP2 BLOCKER-1: a typo here made the whole not-a-phase-deleter invariant dead code)
    const deleterTtk = worstDps > 0 ? phaseHp / worstDps : Infinity;
    const phaseDeletable = cardTimer != null && capPips > 0 && deleterTtk < cardTimer;
    return { phaseHp, nTargets, capPips, each, volley, volleyBeat, roiCeil, clamped, pct, toClear,
             burnFrac, burn, totalRelease, cardTimer, worstDps, deleterTtk, phaseDeletable };
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
    tierCap, peakCap, capVaries, lanceCapable, reason, burnFrac,
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
      // SCAR-BURN §4b: the burn is bounded at burnFrac × the (clamped) beat volley, and
      // the TOTAL earned release (volley + burn) stays ≤ (1 + burnFrac) × the ROI ceiling —
      // the burn escalates the earned yield without breaching the phase-HP law.
      if (p.burn > p.burnFrac * p.volleyBeat + eps) {
        out.push(`${e.id} phase ${i + 1}: burn ${p.burn.toFixed(2)} > burnFrac×volleyBeat ${(p.burnFrac * p.volleyBeat).toFixed(2)}`);
      }
      if (p.capPips > 0 && p.totalRelease > (1 + p.burnFrac) * p.roiCeil + eps) {
        out.push(`${e.id} phase ${i + 1}: total release ${p.totalRelease.toFixed(2)} > (1+frac)×ROI ceil ${((1 + p.burnFrac) * p.roiCeil).toFixed(2)}`);
      }
      // NOT-A-PHASE-DELETER §8C: the lance alone must never clear a phase faster than its
      // card timer (the exploit-optimal on-tell spam TTK ≥ the timer).
      if (p.phaseDeletable) {
        out.push(`${e.id} phase ${i + 1}: PHASE-DELETER — lance TTK ${p.deleterTtk.toFixed(1)}s < card timer ${p.cardTimer}s`);
      }
    });
    // Frac law: no burn fraction exceeds 1.0, and burn is 0 below minTier.
    const minTier = LOCK.scarBurn?.minTier ?? Infinity;
    if (e.burnFrac > 1 + eps) out.push(`${e.id}: burnFrac ${e.burnFrac} > 1.0`);
    if (e.tier < minTier && e.burnFrac > 0) out.push(`${e.id}: tier ${e.tier} < minTier ${minTier} but burnFrac ${e.burnFrac} > 0`);
  }
  return out;
}
