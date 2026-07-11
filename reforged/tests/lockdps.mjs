// Band-gate for the LANCE damage economy (the lockdps model). Pure-node: it
// registers the three-resolver + a minimal DOM shim (js/lockLayer.js pulls in
// 'three'), imports the SHIPPED lanceDmgEach kernel + the live boss table, and
// asserts the balance LAWS hold and the per-boss economy sits in a sane band —
// so a lanceDmg / volleyRoiFrac / capByTier / phase change that shifts LANCE
// balance flags loudly here (and via `node tools/lockdps.mjs --ci`).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// Minimal DOM shim (lockLayer's import graph brushes canvas/util helpers).
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { CONFIG } = await import('../js/config.js');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { lanceDmgEach } = await import('../js/lockLayer.js');
const { allEconomies, invariantBreaches } = await import('../tools/lockdpsCore.mjs');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

const L = CONFIG.LOCK;
const economies = allEconomies(CONFIG, BOSSES, BOSS_ORDER, lanceDmgEach);

// --- The balance INVARIANTS (the same set --ci enforces) --------------------
const breaches = invariantBreaches(economies, L);
assertEq(breaches.length, 0, `no LANCE balance-invariant breaches (${breaches.join('; ')})`);
ok('ROI clamp + beat-inside-clamp + cap-ladder invariants hold for every boss');

// The ROI LAW, asserted directly per phase: a full-cap volley can never exceed
// volleyRoiFrac of the current phase HP — the lance is a CHIP channel by law.
for (const e of economies) {
  if (!e.lanceCapable) continue;
  for (const p of e.phases) {
    assert(p.volley <= p.roiCeil + 1e-9, `${e.id}: volley within ROI ceil`);
    // A perfect (beat) release rides ×beatMult INSIDE the clamp, so it too is
    // bounded by the phase-HP ceiling (never a phase-HP-law breach).
    assert(p.volleyBeat <= p.roiCeil + 1e-9, `${e.id}: beat volley within ROI ceil`);
    // No single volley clears more than ~11% of a phase — the chip-not-nuke read.
    assert(p.pct <= L.volleyRoiFrac + 0.01, `${e.id}: single volley ≤ ~ROI% of the phase`);
  }
}
ok('every full-cap volley (base and beat) stays ≤ volleyRoiFrac × phaseHp');

// --- Reachable cap: paint-target aware, PER PHASE, never above the tier cap --
// The reachable pip cap comes from the ACTUAL paint targets in each phase, not
// just the tier: a boss with no def.lockParts is V1-aim-only (lance inert); a
// boss with too few organs caps below its tier (organs × stackMax); and a phase
// that gates out organs caps lower than its siblings. No phase cap exceeds the
// tier cap.
for (const e of economies) {
  const tierCap = (L.capByTier || {})[e.tier] ?? 0;
  for (const p of e.phases) {
    assert(p.capPips <= tierCap, `${e.id}: phase cap ${p.capPips} ≤ tier cap ${tierCap}`);
  }
  assert(e.lanceCapable === (e.peakCap > 0), `${e.id}: lanceCapable iff any phase is paintable`);
}
// A boss with a virtualLockOrgan but NO lockParts is V1-aim-only → lance inert
// (boss.js paintableParts returns null there). ASHTALON is exactly this; the
// tier-1 Sentinels are inert via a 0 tier cap. (KARNVOW WAS this until CP2 gave
// it 5 trophy-charm lockParts — it's now lance-capable, peakCap 5. KNELLGRAVE
// likewise gained wound+bind lockParts — the endgame ladder, §5i rung 10.)
const inert = economies.filter((e) => !e.lanceCapable);
assert(inert.every((e) => e.peakCap === 0 && e.reason), 'every lance-inert boss carries a 0 cap + a reason');
const noTargets = inert.filter((e) => e.reason.includes('no paint targets')).map((e) => e.id);
assert(noTargets.includes('ashtalon') && !noTargets.includes('karnvow'),
  'ASHTALON is lance-inert for want of paint targets (V1-aim-only); KARNVOW gained trophy-charm lockParts in CP2 and is now lance-capable');
// A boss capped BELOW its tier by too few organs is modelled (THRUMSWARM: 1
// organ × stackMax ⇒ 2, not the tier-3 five).
const thrum = economies.find((e) => e.id === 'thrumswarm');
assert(thrum && thrum.lanceCapable && thrum.peakCap < thrum.tierCap,
  'THRUMSWARM is lance-capable but capped below its tier by its single organ');
// A PHASE-GATED lockPart lowers the reachable cap for that phase (Codex P2):
// BRINEHOLM gates its 3 shackles to phases [0,1,2], so its final phase drops to
// the eye alone (2 pips) while earlier phases reach 5. The per-phase model must
// reflect this — a boss-level cap would over-report the last phase.
const brine = economies.find((e) => e.id === 'brineholm');
assert(brine && brine.capVaries, 'BRINEHOLM cap varies by phase (phase-gated shackles)');
assert(brine.phases[0].capPips === 5 && brine.phases[brine.phases.length - 1].capPips === 2,
  `BRINEHOLM final phase caps at the eye alone (2), not the tier 5 (got ${brine.phases.map((p) => p.capPips).join('/')})`);
ok(`reachable cap is per-phase paint-target aware (${inert.length} inert; THRUMSWARM ${thrum.peakCap}/${thrum.tierCap}; BRINEHOLM ${brine.phases.map((p) => p.capPips).join('/')})`);

// --- Per-boss economy sits in a sane band -----------------------------------
// Pure-lance volleys-to-clear: not trivializing (a boss can't fall to a handful
// of volleys) and not absurd. The low-cap outlier (THRUMSWARM) legitimately runs
// long, so the ceiling is generous; the point is to catch a tuning change that
// makes the lance a primary nuke or utterly pointless.
for (const e of economies) {
  if (!e.lanceCapable) continue;
  assert(e.totalVolleys >= 20 && e.totalVolleys <= 130,
    `${e.id}: pure-lance clear takes ${e.totalVolleys} volleys (sane band 20–130)`);
  assert(e.lanceTtk > 30 && e.lanceTtk < 600,
    `${e.id}: pure-lance TTK estimate ${e.lanceTtk.toFixed(0)}s in band (30–600)`);
}
ok('per-boss pure-lance clear volleys + TTK estimate sit in the sane band');

// --- SCAR-BURN (§4b) --------------------------------------------------------
// The burn bound / total-release ceiling / not-a-phase-deleter / frac laws are all
// enforced via invariantBreaches above; these assert the burn is actually WIRED (a
// regression that drops the scarBurn config or its minTier gate is caught here).
const knell = economies.find((e) => e.id === 'knellgrave');
assert(knell && knell.burnFrac === 0.25, `KNELLGRAVE SCAR-BURN frac is exactly 0.25 (got ${knell?.burnFrac}) — a silent drift is caught here`);
assert(knell.phases.some((p) => p.burn > 0), 'KNELLGRAVE phases actually earn a burn on a full on-tell release');
// The not-a-phase-deleter check must NOT pass vacuously: card timers must actually
// resolve (§CP2 BLOCKER-1 — a `titleCards` typo silently nulled every timer, so the
// check below never evaluated a real number).
assert(knell.phases.every((p) => p.cardTimer != null),
  `KNELLGRAVE card timers resolve for the not-a-phase-deleter check (got ${knell.phases.map((p) => p.cardTimer).join('/')})`);
assert(knell.phases.every((p) => !p.phaseDeletable),
  `KNELLGRAVE is never a phase-deleter (TTKs ${knell.phases.map((p) => p.deleterTtk.toFixed(0)).join('/')} vs timers ${knell.phases.map((p) => p.cardTimer).join('/')})`);
// WEFTWITCH (§5i rung 11) — lance-capable, burn-wired, never a phase-deleter (her P5 is
// the thinnest endgame margin ~1.08 — a named GO gate; the invariant certifies ≥1.0).
const weft = economies.find((e) => e.id === 'weftwitch');
assert(weft && weft.lanceCapable && weft.burnFrac === 0.30, `WEFTWITCH is lance-capable + burn-wired at exactly 0.30 (frac ${weft?.burnFrac})`);
assert(weft.phases.some((p) => p.burn > 0), 'WEFTWITCH phases actually earn a burn on a full on-beat release');
assert(weft.phases.every((p) => p.cardTimer != null && !p.phaseDeletable),
  `WEFTWITCH is never a phase-deleter (TTKs ${weft.phases.map((p) => p.deleterTtk.toFixed(0)).join('/')} vs timers ${weft.phases.map((p) => p.cardTimer).join('/')})`);
// ONEWING (§5i rung 12) — lance-capable via the INVERTED SPECTRAL ECHO: dwell-paint the fused frame
// (2 organs × stackMax 2 = 4), each first mark grants a half-damage GHOST pip on the eye (echoPips 2)
// → the cap fills to 6, but the ghosts strike at echoDmgMult so the effective volley is < 6 pips. The
// echo term must be SEEN by the deleter model (free ghosts raise DPS) or the gate passes vacuously.
const onew = economies.find((e) => e.id === 'onewing');
assert(onew && onew.lanceCapable && onew.burnFrac === 0.30, `ONEWING is lance-capable + burn-wired at exactly 0.30 (frac ${onew?.burnFrac})`);
assert(onew.peakCap === 6, `ONEWING fills the tier-4 cap to 6 (4 dwell + 2 ghost) — peakCap ${onew?.peakCap}`);
// §CP2-D6: echoPips (the model's ghost count) and echoMax (the runtime ghost cap on the eye) are
// hand-synced duplicates — a drift makes the deleter gate UNDER-model the exploit (the dead-invariant
// trap). Assert they stay equal so the economy the gate certifies is the one the game actually runs.
assert(BOSSES.onewing.echoPips === BOSSES.onewing.echoMax,
  `ONEWING echoPips (model ${BOSSES.onewing.echoPips}) === echoMax (runtime ${BOSSES.onewing.echoMax}) — a drift under-models the exploit`);
assert(onew.phases.some((p) => p.burn > 0), 'ONEWING phases actually earn a burn on a full on-tell release (real pips)');
assert(onew.phases.every((p) => p.cardTimer != null && !p.phaseDeletable),
  `ONEWING is never a phase-deleter incl. the free-ghost DPS (TTKs ${onew.phases.map((p) => p.deleterTtk.toFixed(0)).join('/')} vs timers ${onew.phases.map((p) => p.cardTimer).join('/')})`);
// EMBERTIDE (§5i rung 13) — lance-capable via STATION-SPACE proxies, but NO burn: its escalation is
// the fork-is-a-weapon (forked pips extend the beam duel — a Surge mechanic that adds duel TIME, not
// damage, so it's invisible to this model). Confirm the fork-extend dial is wired and the burn stays 0.
const embr = economies.find((e) => e.id === 'embertide');
assert(embr && embr.lanceCapable && embr.burnFrac === 0, `EMBERTIDE is lance-capable but earns NO burn (frac ${embr?.burnFrac}) — the fork-extend is its escalation`);
assert(embr.peakCap === 6, `EMBERTIDE reaches the tier-4 cap 6 (3 proxies + crest V1 × stackMax) — peakCap ${embr?.peakCap}`);
assert(BOSSES.embertide.beamDuelExtendPerPip > 0, `EMBERTIDE's fork-extend dial is wired (+${BOSSES.embertide.beamDuelExtendPerPip}s/pip)`);
assert(embr.phases.every((p) => p.cardTimer != null && !p.phaseDeletable),
  `EMBERTIDE is never a phase-deleter (TTKs ${embr.phases.map((p) => p.deleterTtk.toFixed(0)).join('/')} vs timers ${embr.phases.map((p) => p.cardTimer).join('/')})`);
// THE UNMASKED (§5i rung 14, the APEX finale) — lance-capable across THREE STAGES, each its OWN full
// 240-HP form bar (formLifebars). The phaseSpans fix (each form = full hpMax, not an atFrac slice) is
// load-bearing: without it the model reads [96,72,72], mis-prices the ROI ceiling AND falsely fires
// the not-a-phase-deleter gate on stage 3 (TTK 33.8 < timer 34). With it, all three forms hit the
// tier-5 cap of 6, the clamp never bites (beat volley 15 < ROI ceil 24), and the burn (RECKONING-
// gated at runtime, priced in ALL phases here — strictly conservative) never deletes a phase.
const unm = economies.find((e) => e.id === 'unmasked');
assert(unm && unm.lanceCapable && unm.burnFrac === 0.20, `THE UNMASKED is lance-capable + burn-wired at exactly 0.20 (frac ${unm?.burnFrac}) — the §8D ~1/3 finale`);
assert(unm.tier === 5 && BOSSES.unmasked.formLifebars === true, `THE UNMASKED is the tier-5 formLifebars APEX (tier ${unm.tier}, formLifebars ${BOSSES.unmasked.formLifebars})`);
// formLifebars ⇒ every phase is a full hpMax bar (the phaseSpans fix mirrors boss.js currentPhaseHp).
assert(unm.phases.every((p) => p.phaseHp === BOSSES.unmasked.hpMax),
  `each UNMASKED form is a full ${BOSSES.unmasked.hpMax}-HP bar, not an atFrac slice (got ${unm.phases.map((p) => p.phaseHp).join('/')}) — the formLifebars phaseSpans fix`);
// Every stage reaches the tier-5 cap of 6 (S1 crackL/R+virtual ×2; S2 six eyes + five relics + virtual;
// S3 wingRootL/R+virtual ×2) — the REACHABILITY law (feasibility §7) holds in ALL THREE forms.
assert(unm.peakCap === 6 && unm.phases.every((p) => p.capPips === 6),
  `THE UNMASKED reaches the tier-5 cap 6 in ALL three forms (caps ${unm.phases.map((p) => p.capPips).join('/')})`);
// The clamp NEVER bites at the finale (the §4d clamp-free crescendo): the beat volley stays under the
// ROI ceiling in every form, so the lance is purely skill-limited, not clamp-limited.
assert(unm.phases.every((p) => p.volleyBeat < p.roiCeil - 1e-9),
  `THE UNMASKED clamp never bites — beat volley < ROI ceil in every form (${unm.phases.map((p) => `${p.volleyBeat.toFixed(0)}<${p.roiCeil.toFixed(0)}`).join(', ')})`);
assert(unm.phases.some((p) => p.burn > 0), 'THE UNMASKED forms earn a burn on a full on-tell release (RECKONING unlocks it at runtime)');
// The not-a-phase-deleter margins are comfortable in every form (~4.2/3.6/3.2× the card timer) — the
// finale's ~1/3 share is spectacle + absolute size, never a dominating clear.
assert(unm.phases.every((p) => p.cardTimer != null && !p.phaseDeletable),
  `THE UNMASKED is never a phase-deleter (TTKs ${unm.phases.map((p) => p.deleterTtk.toFixed(0)).join('/')} vs timers ${unm.phases.map((p) => p.cardTimer).join('/')})`);
const unmMargins = unm.phases.map((p) => p.deleterTtk / p.cardTimer);
assert(unmMargins.every((m) => m > 3.0), `THE UNMASKED deleter margins stay > 3× (${unmMargins.map((m) => m.toFixed(2)).join('/')}) — the CP1-verified 4.15/3.60/3.18`);
// Tiers 1-3 (and un-keyed bosses) carry NO burn — the mid-game is byte-identical.
assert(economies.filter((e) => e.tier < CONFIG.LOCK.scarBurn.minTier).every((e) => e.burnFrac === 0),
  'no boss below scarBurn.minTier earns a burn (tiers 1-3 unchanged)');
ok(`SCAR-BURN wired on KNELLGRAVE (${knell.burnFrac}) + WEFTWITCH (${weft.burnFrac}) + ONEWING (${onew.burnFrac}) + THE UNMASKED (${unm.burnFrac}, RECKONING-gated), never phase-deleters, tiers 1-3 burn-free`);

// --- Roster coverage --------------------------------------------------------
assertEq(economies.length, BOSS_ORDER.length, 'one economy row per boss in BOSS_ORDER');
assert(economies.filter((e) => e.lanceCapable).length >= 4, 'at least 4 truly lance-capable bosses (have paint targets)');
ok(`${economies.length} bosses modelled, ${economies.filter((e) => e.lanceCapable).length} lance-capable`);

console.log(`\n${n} lockdps checks passed.`);
