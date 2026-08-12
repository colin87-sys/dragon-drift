// Headless tests for the DRIFT momentum currency (js/drift.js; DRIFT-BUILD-PLAN.md).
// Proves: the flag gate (off = inert, factor 1, shipped perfect radius), the feed table,
// the §4a governors (F2 pays nothing in Surge; F1/F2 per-encounter caps; encounter reset),
// severity-not-wipe dents (overdrive miss vs open-sky miss), the bleed + its boss pause,
// the speed governor (DRIFT contributes nothing above 130), the §2 overdrive slip target,
// M2's in-boss D clamp, the gauntlet clean-run window, and the runStart reset.
// The HUMAN judges feel (?drift=1 on the PR preview); this proves the math.
import { assert, assertEq } from './shim.mjs';

globalThis.localStorage = globalThis.localStorage
  || { getItem: () => null, setItem() {}, removeItem() {} };

const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { emit } = await import('../js/events.js');
const {
  initDrift, updateDrift, resetDrift, driftValue, driftEnabled,
  driftSpeedFactor, driftOverdriveSlip, driftGrazeMult, driftPerfectRadius,
} = await import('../js/drift.js');

const C = CONFIG.DRIFT;
const approx = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const player = { speed: 47, canyonSlip: 1, driftFactor: 1 };
const openSky = () => { game.inBoss = false; game.inCanyon = false; game.canyonRun = null; game.feverActive = false; game.state = 'playing'; };

// --- flag OFF: fully inert ---------------------------------------------------
initDrift();
openSky();
assert(!driftEnabled(), 'flag defaults off');
emit('ring', { perfect: true });
assertEq(driftValue(), 0, 'no feed while disabled');
assertEq(driftSpeedFactor(player), 1, 'factor 1 while disabled');
assertEq(driftOverdriveSlip(), null, 'no overdrive override while disabled');
assertEq(driftGrazeMult(), 1, 'no surge-charge boost while disabled');
assertEq(driftPerfectRadius(), CONFIG.ringCenterRadius, 'shipped perfect radius while disabled');

// --- flag ON: feeds ----------------------------------------------------------
CONFIG.DRIFT.enabled = true;
resetDrift();
emit('ring', {});               assert(approx(driftValue(), C.feed.ring), 'plain ring feed');
emit('ring', { perfect: true }); assert(approx(driftValue(), C.feed.ring + C.feed.ringPerfect), 'perfect ring feed');
emit('gate'); emit('orb'); emit('nearMiss'); emit('roll'); emit('goldEmber');
const fed = C.feed.ring + C.feed.ringPerfect + C.feed.gate + C.feed.orb + C.feed.nearMiss + C.feed.roll + C.feed.goldEmber;
assert(approx(driftValue(), fed), 'feed table sums');
for (let i = 0; i < 100; i++) emit('ring', { perfect: true });
assertEq(driftValue(), 1, 'meter caps at 1');

// --- dents: severity, never a scripted zero ---------------------------------
emit('ringMiss');
assert(approx(driftValue(), 1 - C.dent.ringMiss), 'open-sky miss = small dent');
game.inCanyon = true; game.canyonRun = 'flow';
emit('ringMiss');
assert(approx(driftValue(), 1 - C.dent.ringMiss - C.dent.ringMissOverdrive), 'overdrive miss = big chunk (§2 severity)');
assert(driftValue() > 0, 'never zeroed by an event');
emit('flowChain');
assert(approx(driftValue(), 1 - C.dent.ringMiss - C.dent.ringMissOverdrive + C.feed.flowChain), 'chain feeds in canyon');

// --- expression: factor / overdrive / governor -------------------------------
resetDrift(); for (let i = 0; i < 100; i++) emit('ring', {});   // D = 1 (in-canyon feeds fine)
assertEq(driftSpeedFactor(player), 1, 'factor is 1 inside a canyon (overdrive owns it)');
assert(approx(driftOverdriveSlip(), 1 + C.capCanyon), 'overdrive slip target hits the hot ceiling');
openSky();
assert(approx(driftSpeedFactor(player), 1 + C.capBase), 'open-sky factor at full meter');
player.speed = 125;
assert(approx(driftSpeedFactor(player), C.governorSpeed / 125), 'governor: DRIFT adds nothing above 130');
player.speed = 47;
game.inBoss = true;
assertEq(driftSpeedFactor(player), 1, 'factor is 1 in a boss (speed locked)');

// --- M2 clamp ----------------------------------------------------------------
assert(approx(driftGrazeMult(), 1 + C.boss.grazeChargeBoost * C.boss.grazeChargeDClamp),
  'surge-charge boost clamps at the in-boss D ceiling');

// --- boss feeds + §4a governors ---------------------------------------------
resetDrift(); game.inBoss = true; game.feverActive = false;
emit('bossStart', {});
game.feverActive = true;
emit('bossReflect', {}); emit('bossRiposte', {});
assertEq(driftValue(), 0, 'F2 pays NOTHING for Surge reflects (§4a governor)');
game.feverActive = false;
emit('bossReflect', {});
assert(approx(driftValue(), C.boss.parry), 'amber parry pays');
for (let i = 0; i < 50; i++) emit('bossRiposte', {});
assert(driftValue() <= C.boss.parryCap + C.boss.riposte + 1e-9, 'per-encounter parry cap holds');
const afterParry = driftValue();
for (let i = 0; i < 500; i++) emit('bossGraze');
assert(driftValue() - afterParry <= C.boss.grazeCap + C.boss.graze + 1e-9, 'per-encounter graze cap holds');
emit('bossCard', { captured: false }); const preCard = driftValue();
assertEq(driftValue(), preCard, 'uncaptured card pays nothing');
emit('bossCard', { captured: true });
assert(approx(driftValue(), preCard + C.boss.card), 'captured card pays');
emit('slipGraze'); emit('orbitLap');
assert(approx(driftValue(), preCard + C.boss.card + 2 * C.boss.mechanic), 'mechanic feeds pay');
emit('damage', {});
assert(approx(driftValue(), preCard + C.boss.card + 2 * C.boss.mechanic - C.dent.bossHit), 'boss hit = the small dent');
const preDefeat = driftValue();
emit('bossDefeated', {});
assert(approx(driftValue(), Math.min(1, preDefeat + C.boss.defeat)), 'defeat pours the bonus');
emit('bossStart', {});   // caps reset per encounter
game.feverActive = false;
const preReset = driftValue();
emit('bossReflect', {});
assert(approx(driftValue(), Math.min(1, preReset + C.boss.parry)), 'encounter caps reset on bossStart');

// --- bleed: runs in open sky, pauses in a boss -------------------------------
resetDrift(); openSky();
for (let i = 0; i < 10; i++) emit('ring', {});
const preBleed = driftValue();
updateDrift(1.0, player);
assert(approx(driftValue(), preBleed - C.bleedPerSec), 'open-sky bleed');
game.inBoss = true;
const inBoss = driftValue();
updateDrift(5.0, player);
assertEq(driftValue(), inBoss, 'bleed pauses in a boss');

// --- perfect-radius ease (§3.3) ---------------------------------------------
openSky();
updateDrift(0, { speed: 47, canyonSlip: 1.3, driftFactor: 1 });
assert(approx(driftPerfectRadius(), CONFIG.ringCenterRadius * (1 + C.perfectEase * 0.3)),
  'perfect radius half-compensates with the co-scaled factor');
updateDrift(0, { speed: 47, canyonSlip: 1, driftFactor: 1 });
assertEq(driftPerfectRadius(), CONFIG.ringCenterRadius, 'base radius at factor 1');

// --- gauntlet clean-run window ----------------------------------------------
resetDrift(); openSky();
emit('gauntletStart'); emit('gauntletCleared');
assert(approx(driftValue(), C.gauntletClean), 'clean gauntlet pays the capstone');
for (let i = 0; i < 10; i++) emit('ring', {});   // headroom so the dent doesn't hit the floor
const preDirty = driftValue();
emit('gauntletStart'); emit('damage', {}); emit('gauntletCleared');
assert(approx(driftValue(), preDirty - C.dent.damage),
  'damaged gauntlet pays no capstone (dent only)');

// --- run reset ---------------------------------------------------------------
emit('runStart');
assertEq(driftValue(), 0, 'runStart resets the meter');

CONFIG.DRIFT.enabled = false;
console.log('drift.mjs: all assertions passed');
