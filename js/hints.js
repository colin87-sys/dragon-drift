import { on } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';
import { getAxes, input } from './input.js';
import { ui } from './ui.js';

// Contextual first-flight hints: one line at a time in a dedicated element
// (never the gameplay popups), each shown once ever, none after the second
// run. Teaches by timing, not by wall of text.

const BIT = { steer: 1, boost: 2, perfect: 4, gauntlet: 8 };

const isTouch = () =>
  (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in globalThis;

let active = 0;      // currently shown bit (0 = none)
let hideAt = 0;      // game.time to auto-hide
let boostedThisRun = false;

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
}

export function updateHints(dt, player) {
  if (game.state !== 'playing') return;
  if (player.boosting) boostedThisRun = true;

  if (active) {
    const axes = getAxes();
    const dismissed =
      (active === BIT.steer && (axes.x !== 0 || axes.y !== 0)) ||
      (active === BIT.boost && player.boosting);
    if (dismissed || game.time >= hideAt) hide();
    return;
  }
  if (!eligible()) return;

  if (!seen(BIT.steer) && game.time > 1.2) {
    show(BIT.steer, isTouch() ? 'DRAG anywhere to steer' : 'Steer with WASD or ARROWS', 5);
  } else if (!seen(BIT.boost) && game.time > 8 && !boostedThisRun && !input.boost) {
    show(BIT.boost, isTouch() ? 'HOLD a second finger to BOOST' : 'HOLD SPACE to boost', 5);
  }
}
