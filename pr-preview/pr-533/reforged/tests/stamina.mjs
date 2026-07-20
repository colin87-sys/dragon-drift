// Phase 1 — Stamina rebalance. Two layers:
//  (A) config-level DESIGN INVARIANTS — tuning guards. Change the numbers in
//      config.js freely, but if one of these trips you've broken a design rule
//      (made boost permanent again, made perfect rings worthless, made Surge
//      free, etc.). This is what lets you tune by feel without regressing.
//  (B) one end-to-end behaviour check: holding boost actually drains the bar
//      (this would FAIL on the old "chain rings → boost forever" tuning).
import { boot, check } from './browser.mjs';
import { assert } from './shim.mjs';

const { CONFIG: C } = await import('../js/config.js');

// ---- (A) Design invariants ------------------------------------------------
let n = 0;
const inv = (msg, cond) => { assert(cond, msg); n++; console.log(`  ✓ ${msg}`); };

for (const k of ['staminaMax', 'staminaDrain', 'staminaRegen', 'staminaRegenDelay',
  'ringStamina', 'perfectRingStaminaBonus', 'gateStamina', 'orbStamina', 'feverStaminaDrainMult']) {
  assert(typeof C[k] === 'number' && C[k] >= 0, `config.${k} is a non-negative number`);
}
console.log('  ✓ all stamina constants present & non-negative');
n++;

// Boost is not a permanent hold: a full bar burns out in a few seconds of pure
// holding (no refills). Punchy, not endless.
const holdSeconds = C.staminaMax / C.staminaDrain;
inv(`a full boost bar lasts ~${holdSeconds.toFixed(1)}s of pure holding (≤6s)`, holdSeconds <= 6);

// Normal rings only PARTLY pay: even at a brisk ~1.5 rings/sec, normal-ring
// refill can't out-pace the drain, so rings alone never sustain boost.
const RINGS_PER_SEC = 1.5;
inv(`normal rings (${C.ringStamina}×${RINGS_PER_SEC}/s) cannot out-pace drain (${C.staminaDrain}/s)`,
  C.ringStamina * RINGS_PER_SEC < C.staminaDrain);

// Perfect rings are meaningfully better, but a perfect-per-second is still less
// than the drain outside Surge — an extender, not a free hold.
inv('perfect rings refund a bonus on top of a normal ring', C.perfectRingStaminaBonus > 0);
inv('even one perfect ring/sec is less than the drain (boost stays a resource)',
  C.ringStamina + C.perfectRingStaminaBonus < C.staminaDrain);

// Speed orbs are the real boost-extender: worth several rings, a big top-up —
// but not a free full bar.
inv(`a speed orb (${C.orbStamina}) is worth ≥3 normal rings`, C.orbStamina >= C.ringStamina * 3);
inv('a speed orb tops up but does not refill the whole bar', C.orbStamina < C.staminaMax);

// Dragon Surge eases the burn but never makes it free.
inv(`Surge drain ×${C.feverStaminaDrainMult} eases (<1) but still burns (>0)`,
  C.feverStaminaDrainMult > 0 && C.feverStaminaDrainMult < 1);

// An empty bar recovers in a reasonable time (a dry spell isn't a death sentence).
const refillSeconds = C.staminaMax / C.staminaRegen;
inv(`empty→full regen ≈ ${refillSeconds.toFixed(1)}s when not boosting (≤12s)`, refillSeconds <= 12);

console.log(`\n  ${n} stamina invariant checks passed.`);

// ---- (B) End-to-end: holding boost drains the bar -------------------------
{
  const { page, errors, done } = await boot();
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__dd.game.state === 'playing');
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.__dd.game.stamina);
  await page.keyboard.down('Space');           // hold boost
  // Drain is per-FRAME; headless software-GL caps dt, so total drain over a fixed
  // wall-clock window is frame-rate-dependent (a fixed-magnitude-over-fixed-time
  // assertion flakes on slow SwiftShader). POLL until the bar has clearly dropped
  // instead — the invariant is "boost is net-negative (drains faster than rings
  // refill)", so any run reaches a clear drop given enough real time.
  // Under headless auto-fly the dragon also collects rings, so the bar settles at
  // an EQUILIBRIUM (drain vs refill) a few points below full rather than emptying —
  // the exact plateau depends on frame rate. The invariant the pure-logic checks
  // above already prove the RATES for; this only confirms boost is WIRED net-negative,
  // i.e. the bar clearly drops from full (the OLD "boost forever" tuning kept it pinned).
  // Hold to the equilibrium TROUGH and track the deepest drain seen — the bar
  // oscillates (drain, ring refill, drain), so the min is the stable signal; a
  // single end-sample can land on a refill peak.
  let trough = before;
  for (let i = 0; i < 28; i++) {                 // ~7s of real time, enough to reach the trough at any frame rate
    await page.waitForTimeout(250);
    const s = await page.evaluate(() => window.__dd.game.stamina);
    if (s < trough) trough = s;
  }
  await page.keyboard.up('Space');
  check(`holding boost drains the bar off full (${before.toFixed(0)} → trough ${trough.toFixed(0)})`, trough < before - 3);
  check('no console errors while boosting', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
