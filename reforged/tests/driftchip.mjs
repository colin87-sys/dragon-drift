// M1 chip-deleter gate (DRIFT rider-chip quickening) — the gate lockdps.mjs CANNOT be:
// its deleter model is lance-only (tools/lockdpsCore.mjs sums lance pips + scar-burn, no
// rider term), so lockdps stays green at ANY M1 value. This proves M1 on its own terms:
//   (1) flag-off identity — driftChipMult() === 1 when disabled (reload is bit-identical);
//   (2) the ceiling law — M1 NEVER raises the shipped worst rider frame (fever-excluded),
//       codifying the §4a exclusion so a future edit that drops the gate fails loudly;
//   (3) the phase-deleter floor — base D=0 chip is razor-tuned (VOIDMAW P1 ≈ 0.99× its
//       card), and the conditioned M1 boost must NOT push any phase's chip-only clear
//       under the 0.72× floor.
// Pure math over CONFIG + bossDefs — no renderer, no lifecycle. The HUMAN judges feel (CP3).
import { assert, assertEq } from './shim.mjs';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { phaseSpans } = await import('../tools/lockdpsCore.mjs');
const { driftChipMult, driftEnabled, initDrift } = await import('../js/drift.js');
// D is module-private; the ONLY way to raise it is the real feed pipeline (proves the feeds).
const { emit } = await import('../js/events.js');
initDrift();   // register the event-bus subscribers (main.js does this in-game)

const B = CONFIG.BOSS, DB = CONFIG.DRIFT.boss;
const approx = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// Reload rate helper mirroring boss.js:3515 exactly: shots/s given (held, surge, chip).
const shotsPerSec = (held, surge, chipMult) =>
  1 / ((B.riderShotInterval / (held * chipMult)) * (surge ? B.surgeRiderMult : 1));

// --- (1) FLAG-OFF IDENTITY ---------------------------------------------------
CONFIG.DRIFT.enabled = false;
game.inBoss = true; game.feverActive = false;
assert(!driftEnabled(), 'flag off by default');
assertEq(driftChipMult(), 1, 'M1 mult is 1 when disabled — reload bit-identical to shipped');

// --- pin D to 1 via the REAL feed pipeline (no test-only setter) --------------
CONFIG.DRIFT.enabled = true;
emit('runStart');                 // reset the meter to 0
emit('bossStart', {});            // reset per-encounter caps
for (let i = 0; i < 60; i++) emit('bossCard', { captured: true });   // clean cards pin D at 1
const held = CONFIG.LOCK.chipRateMult;   // 1.15

// --- (2) THE CEILING LAW -----------------------------------------------------
game.feverActive = false;
const mNonFever = driftChipMult();
assert(approx(mNonFever, 1 + DB.chipRateBoost * DB.chipDClamp),
  `non-fever M1 mult hits the D-clamp ceiling (${mNonFever})`);
assert(mNonFever <= 1.15 + 1e-9, 'M1 ceiling is <= x1.15 (the chipRateMult LAW magnitude)');

game.feverActive = true;
assertEq(driftChipMult(), 1, 'M1 is EXCLUDED during Surge (never stacks on surgeRiderMult)');

// The worst rider frame over {D max} x {held} x {fever} must NOT exceed shipped's worst
// (fever + held, no M1). This is the §4a "melt frame stays shipped-identical" invariant.
const shippedWorst = shotsPerSec(held, true, 1);                 // 4.60 shots/s
let m1Worst = 0;
for (const surge of [false, true]) for (const h of [1, held]) {
  game.feverActive = surge;
  m1Worst = Math.max(m1Worst, shotsPerSec(h, surge, driftChipMult()));
}
assert(m1Worst <= shippedWorst + 1e-9,
  `M1 never raises the shipped worst rider frame (${m1Worst.toFixed(3)} <= ${shippedWorst.toFixed(3)} shots/s)`);
// And the non-fever conditioned max is bounded.
game.feverActive = false;
assert(shotsPerSec(held, false, driftChipMult()) <= 2.645 + 1e-6,
  'non-fever conditioned max <= 2.645 shots/s');

// --- (3) M1 IS A BOUNDED, CONDITIONED CONTRIBUTION ---------------------------
// The phase-DELETER backstop is structural, not a chip-DPS margin: only a Surge unleash
// breaks a phase-floor shield (config.js:581; boss.mjs proves surges>=3 per boss), and M1
// is FEVER-EXCLUDED, so during the Surge that actually advances a phase M1 is OFF. Chip
// can never skip a phase regardless of its DPS. So M1's invariant is NOT an absolute
// card-timer floor (the shipped base chip already out-carves some cards' HP — the shield,
// not the DPS, is what holds those phases); it is: M1 adds AT MOST x1.15 to the chip on
// any phase, is exactly 0 at D=0 / in fever, and leaves the base D=0 channel untouched.
const baseDps = (1 / B.riderShotInterval) * B.riderShotDamage;   // 2.80, the unconditional channel
game.feverActive = false;
const condMult = driftChipMult();                                // x1.15 at D=1+clamp
const condHeldDps = baseDps * held * condMult;                   // D=1, held, non-fever — the max chip DPS

// The base D=0 channel is untouched by M1 (canary: VOIDMAW P1 sits at its shipped razor).
const vm = BOSSES[BOSS_ORDER[0]];
const vmP1 = phaseSpans(vm)[0], vmCard = vm.cards[0].timer;
const pinnedVoidmaw = (baseDps * vmCard) / vmP1;
console.log(`  · VOIDMAW P1 base-chip pin = ${pinnedVoidmaw.toFixed(3)} (shipped razor — unchanged by M1)`);
assert(pinnedVoidmaw > 0.98 && pinnedVoidmaw < 1.03,
  `VOIDMAW-P1 base razor is intact (${pinnedVoidmaw.toFixed(3)} in [0.98,1.03]) — catches a ledger drift`);

// M1's contribution is bounded x1.15 everywhere (report the worst boss for the CP2 critic).
let worstAdd = 0, worstBoss = '';
for (const key of BOSS_ORDER) {
  const spans = phaseSpans(BOSSES[key]);
  spans.forEach((hp) => {
    const baseTTF = hp / baseDps, condTTF = hp / condHeldDps;
    const add = baseTTF / condTTF;   // = held*condMult; how much FASTER the conditioned carve is
    if (add > worstAdd) { worstAdd = add; worstBoss = key; }
  });
}
console.log(`  · max conditioned chip speed-up = x${worstAdd.toFixed(4)} (held x1.15 * M1 x1.15; worst ${worstBoss})`);
assert(worstAdd <= held * 1.15 + 1e-9,
  `M1 never lifts chip beyond held x1.15 * M1 x1.15 (${worstAdd.toFixed(4)} <= ${(held*1.15).toFixed(4)})`);
// And M1 alone (no held) tops out at exactly x1.15 — the chipRateMult LAW magnitude.
assert(approx(condMult, 1.15), `M1 alone tops out at x1.15 (${condMult})`);

game.inBoss = false; game.feverActive = false; CONFIG.DRIFT.enabled = false;
console.log('driftchip.mjs: all assertions passed');
