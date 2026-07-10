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
// Tiers 1-3 (and un-keyed bosses) carry NO burn — the mid-game is byte-identical.
assert(economies.filter((e) => e.tier < CONFIG.LOCK.scarBurn.minTier).every((e) => e.burnFrac === 0),
  'no boss below scarBurn.minTier earns a burn (tiers 1-3 unchanged)');
ok(`SCAR-BURN wired on KNELLGRAVE (${knell.burnFrac}) + WEFTWITCH (${weft.burnFrac}), never phase-deleters, tiers 1-3 burn-free`);

// --- Roster coverage --------------------------------------------------------
assertEq(economies.length, BOSS_ORDER.length, 'one economy row per boss in BOSS_ORDER');
assert(economies.filter((e) => e.lanceCapable).length >= 4, 'at least 4 truly lance-capable bosses (have paint targets)');
ok(`${economies.length} bosses modelled, ${economies.filter((e) => e.lanceCapable).length} lance-capable`);

console.log(`\n${n} lockdps checks passed.`);
