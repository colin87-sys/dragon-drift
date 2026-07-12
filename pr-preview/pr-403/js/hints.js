import { on, emit } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';
import { getAxes, input } from './input.js';
import { ui } from './ui.js';
import { gestureTutorialActive } from './gestureTutorial.js';

// Contextual first-flight hints: one line at a time in a dedicated element
// (never the gameplay popups), each shown once ever, none after the second
// run. Teaches by timing, not by wall of text.

const BIT = {
  steer: 1, boost: 2, perfect: 4, gauntlet: 8, glide: 16, surge: 32, phase: 64, roll: 128,
  // Live (non-pausing) callouts for the remaining mechanics.
  orb: 256, gate: 512, ember: 1024, gold: 2048, nearMiss: 4096,
};

const isTouch = () =>
  (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in globalThis;

let active = 0;      // currently shown bit (0 = none)
let hideAt = 0;      // game.time to auto-hide
let boostedThisRun = false;
let rollsAtShow = 0; // game.rolls when the roll-dodge hint was shown (dismiss on first roll after)
let sentFirstInput = false; // funnel one-shots (analytics dedups across the install too)
let sentFirstBoost = false;

function seen(bit) { return (saveData.flags.hintsSeen & bit) !== 0; }
function eligible() { return saveData.stats.runs < 2; }

function show(bit, text, holdFor) {
  saveData.flags.hintsSeen |= bit;
  persist();
  active = bit;
  hideAt = game.time + holdFor;
  ui.showHint(text);
}

function hide() {
  if (!active) return;
  active = 0;
  ui.hideHint();
}

export function initHints() {
  on('runStart', () => { boostedThisRun = false; hide(); });
  on('ring', (p) => {
    if (!eligible() || active || seen(BIT.perfect)) return;
    if (!(p && p.perfect)) {
      show(BIT.perfect, 'Fly through the CENTER of a ring for a PERFECT', 3.5);
    }
  });
  on('gauntletStart', () => {
    if (!eligible() || active || seen(BIT.gauntlet)) return;
    show(BIT.gauntlet, 'FOLLOW THE EMBERS through the corridor', 3.5);
  });
  // Surge teaches the phase move (not run-gated — Surge may first happen later).
  // Soft intro at Surge start plants the idea before the high-pressure wall.
  on('surge', () => {
    if (active || seen(BIT.surge)) return;
    show(BIT.surge, isTouch()
      ? 'SURGE! You can smash through walls — flick to roll'
      : 'SURGE! You can smash through walls — double-tap A/D to roll', 4);
  });
  // Imminent first Surge wall: urgent coaching during the slow-mo dilation. The
  // phase itself is no-fail the first time (collision.js demos it), so this is a
  // prompt, not a death threat. Overrides any active hint; gated by phaseTaught.
  on('surgeWallSlowMo', () => {
    if (gestureTutorialActive() || saveData.flags.phaseTaught) return; // run-1 pause owns phase
    show(BIT.phase, isTouch() ? 'FLICK to PHASE through!' : 'Double-tap A/D to PHASE!', 3);
  });

  // Live (non-pausing) callouts for the remaining mechanics — one line, once
  // ever, only while learning (runs < 2), shown when each first occurs.
  on('orb', () => {
    if (!eligible() || active || seen(BIT.orb)) return;
    show(BIT.orb, 'Speed orb — grab it for a burst of speed', 3.2);
  });
  on('gate', () => {
    if (!eligible() || active || seen(BIT.gate)) return;
    show(BIT.gate, 'Thread the window — it pays like a ring', 3.2);
  });
  on('ember', (p) => {
    if (p && p.gold) return; // golden embers get their own callout below
    if (!eligible() || active || seen(BIT.ember)) return;
    show(BIT.ember, 'Collect embers — they unlock new dragons & more', 3.2);
  });
  on('goldEmber', () => {
    if (!eligible() || active || seen(BIT.gold)) return;
    show(BIT.gold, 'Golden ember! Worth far more — chase the comets', 3.5);
  });
  on('nearMiss', () => {
    if (!eligible() || active || seen(BIT.nearMiss)) return;
    show(BIT.nearMiss, 'Near miss! Shave past obstacles for bonus points', 3.2);
  });
}

export function updateHints(dt, player) {
  if (game.state !== 'playing') return;
  if (player.boosting) boostedThisRun = true;

  // Funnel one-shots: first steering input and first boost (analytics.js).
  const axes = getAxes();
  if (!sentFirstInput && (axes.x !== 0 || axes.y !== 0)) { sentFirstInput = true; emit('firstInput'); }
  if (!sentFirstBoost && player.boosting) { sentFirstBoost = true; emit('firstBoost'); }

  if (active) {
    const rolled = active === BIT.roll && game.rolls > rollsAtShow;
    const dismissed =
      (active === BIT.steer && (axes.x !== 0 || axes.y !== 0)) ||
      (active === BIT.boost && player.boosting) ||
      rolled;
    if (rolled) { saveData.flags.seenFirstRoll = true; persist(); }
    if (dismissed || game.time >= hideAt) hide();
    return;
  }

  // Glide Assist teaches its own gesture once ever, for assist users on any run
  // (beginners may take more than two flights to graduate).
  if (saveData.settings.glideAssist && !seen(BIT.glide) && game.time > 1.2) {
    show(BIT.glide, isTouch() ? 'It auto-flies — SWIPE toward the next ring'
                              : 'It auto-flies — steer toward the next ring', 5);
    return;
  }

  // Barrel roll as a defensive dodge — taught once ever, when the first real
  // obstacle is bearing down (run 1's authored pillar sits at ~395m). Kept out
  // of the runs<2 gate so a cautious pilot still learns the i-frames later. The
  // Surge phase hint stays as the second teaching context (both contexts).
  if (!gestureTutorialActive() && !saveData.flags.seenFirstRoll && !seen(BIT.roll) &&
      game.time > 2 && player.dist > 360) {
    rollsAtShow = game.rolls;
    show(BIT.roll, isTouch()
      ? 'Swipe a second finger to BARREL ROLL — dodges damage'
      : 'Double-tap a direction (or Shift) to BARREL ROLL — dodges damage', 6);
    return;
  }

  if (!eligible()) return;
  // On the first flight the paused gesture tutorial teaches steer/boost — keep
  // their text versions silent so the lesson isn't doubled.
  if (gestureTutorialActive()) return;

  const mouse = saveData.settings.mouseSteer;
  if (!seen(BIT.steer) && game.time > 1.2) {
    show(BIT.steer, isTouch() ? 'DRAG anywhere to steer'
      : (mouse ? 'Steer: WASD / ARROWS — or hold LEFT-CLICK' : 'Steer with WASD or ARROWS'), 5);
  } else if (!seen(BIT.boost) && game.time > 8 && !boostedThisRun && !input.boost) {
    show(BIT.boost, isTouch() ? 'HOLD a second finger to BOOST'
      : (mouse ? 'HOLD SPACE or RIGHT-CLICK to boost' : 'HOLD SPACE to boost'), 5);
  }
}
