import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { kick, kickDeath } from './postfx.js';

// Impact-frame juice: the single entry point that turns a gameplay event
// into spectacle, sized by the CONFIG.JUICE budget. Enforcement lives HERE
// (cooldown + max-merge) so the habituation budget stays one deliberate,
// auditable decision instead of being scattered across callers.
//
// Hitstop = a real-time near-freeze (dt × hitstopScale in main.js's tick),
// distinct from the lethal-save slow-mo which owns game.timeScale.
// Precedence contract (tested):
//   1. slow-mo wins — no hitstop starts while slowMoTimer > 0 (and main.js
//      kills an in-flight one the frame slow-mo triggers);
//   2. pause clears it (main.js pause paths);
//   3. refused outside 'playing' (covers gameover, dying/revive, ready);
//   4. ≥ hitstopCooldownMs between freezes, overlapping requests merge to
//      the max remaining (never sum).

let lastHitstopAt = -Infinity;

export function hitstop(ms) {
  if (ms <= 0) return;
  if (game.state !== 'playing') return;
  if (game.slowMoTimer > 0) return;
  const now = performance.now();
  if (now - lastHitstopAt < CONFIG.JUICE.hitstopCooldownMs) return;
  lastHitstopAt = now;
  game.hitstopTimer = Math.max(game.hitstopTimer, ms / 1000);
}

// I4 RELEASE hitstop (§M.1-1): the ritual's punctuation BYPASSES the two guards that would
// swallow it — slow-mo precedence (the conductor owns timeScale; any stale slowMoTimer is
// zeroed here) and the 180ms cooldown (the release beat is authored, not machine-gun spam).
// ONLY the surge conductor calls this; every other caller keeps the guarded hitstop() above.
export function hitstopForce(sec) {
  if (sec <= 0 || game.state !== 'playing') return;
  game.slowMoTimer = 0;
  game.slowMoScale = null;
  lastHitstopAt = performance.now();
  game.hitstopTimer = Math.max(game.hitstopTimer, sec);
}

// Fire everything the budget allots to a named event.
export function juiceEvent(name) {
  const ev = CONFIG.JUICE.events[name];
  if (!ev) return;
  if (ev.hitstop) hitstop(ev.hitstop);
  if (ev.kick === 'death') kickDeath();
  else if (ev.kick) kick(ev.kick);
}
