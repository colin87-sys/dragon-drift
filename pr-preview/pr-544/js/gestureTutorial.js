// Paused gesture tutorial — run 1 only. The four input GESTURES (steer, boost,
// roll, phase) are taught as guided, frozen beats: the run pauses, an animated
// finger (touch) or key prompt (desktop) shows the move, and play resumes the
// instant the player performs it (learn-by-doing). Sequential ordering plus a
// prior-step gate guarantees steer → boost → roll → phase, so the second-finger
// boost is always taught before the second-finger flick it builds on.
//
// A true pause (game.state='paused', pauseReason='tutorial') freezes the sim,
// but touch + keyboard input keep updating, so we can detect the exact gesture;
// a roll/phase flick buffered while paused fires on the first frame after resume
// (player.update consumes input.rollRequest). All other mechanics are taught as
// non-pausing live callouts in hints.js.

import { on } from './events.js';
import { saveData, persist } from './save.js';
import { game } from './gameState.js';
import { getAxes, input } from './input.js';
import { ui } from './ui.js';

const isTouch = () =>
  (globalThis.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  'ontouchstart' in globalThis;

// hints.js BIT values, kept in sync: completing a beat marks the equivalent text
// hint as seen so it never double-teaches.
const HINT_BIT = { steer: 1, boost: 2, phase: 64, roll: 128 };

let cb = { onPause: () => {}, onResume: () => {} };
let idx = 0;              // next step to teach
let paused = null;        // the step currently frozen (or null)
let baseline = null;      // input snapshot at pause, so an already-held gesture doesn't auto-satisfy
let phasePending = false; // a Surge wall fired surgeWallSlowMo; the phase beat may pause

function active() {
  return game.mode === 'normal' && saveData.stats.runs === 0;
}

const STEPS = [
  {
    id: 'steer', gesture: 'steer',
    trigger: () => game.time > 1.2,
    text: () => isTouch() ? 'Drag to steer' : 'Press A / D (or ← / →) to steer',
  },
  {
    id: 'boost', gesture: 'boost',
    trigger: (p) => p.dist > 150,
    text: () => isTouch() ? 'Hold a SECOND finger to BOOST' : 'Hold SPACE to BOOST',
    detect: () => input.boost === true,
  },
  {
    id: 'roll', gesture: 'roll',
    trigger: (p) => p.dist > 225,
    text: () => isTouch()
      ? 'Swipe a second finger SIDEWAYS to BARREL ROLL — dodges damage'
      : 'Double-tap A / D (or hold Shift) to BARREL ROLL — dodges damage',
    detect: () => input.rollRequest !== 0,
  },
  {
    id: 'phase', gesture: 'roll', // same flick, on a Surge wall
    trigger: () => phasePending,
    text: () => isTouch()
      ? 'SURGE! Flick a second finger to PHASE through the wall'
      : 'SURGE! Double-tap A / D to PHASE through the wall',
    detect: () => input.rollRequest !== 0,
  },
];

// True while the paused tutorial owns steer/boost/roll/phase teaching — hints.js
// keeps the text versions of those silent on the first flight.
export function gestureTutorialActive() {
  return active();
}

export function initGestureTutorial(callbacks) {
  cb = { onPause: () => {}, onResume: () => {}, ...callbacks };
  on('runStart', () => { idx = 0; paused = null; baseline = null; phasePending = false; });
  // The Surge wall is event-driven: collision.js emits this when a gate is met
  // while the Surge is lit and phase hasn't been taught. Only arm phase once the
  // roll has been taught (idx === 3), so the flick is always learned first.
  on('surgeWallSlowMo', () => {
    if (active() && idx === 3 && !saveData.flags.phaseTaught) phasePending = true;
  });
}

function snapshot() {
  const a = getAxes();
  return { ax: a.x, ay: a.y, boost: input.boost };
}

function markSeen(step) {
  if (step.id === 'steer') saveData.flags.hintsSeen |= HINT_BIT.steer;
  else if (step.id === 'boost') saveData.flags.hintsSeen |= HINT_BIT.boost;
  else if (step.id === 'roll') { saveData.flags.hintsSeen |= HINT_BIT.roll; saveData.flags.seenFirstRoll = true; }
  else if (step.id === 'phase') { saveData.flags.hintsSeen |= HINT_BIT.phase; saveData.flags.phaseTaught = true; }
  persist();
}

export function updateGestureTutorial(player) {
  if (!active()) return;

  // Frozen: wait for the gesture, then resume into live play.
  if (paused) {
    if (game.state !== 'paused' || game.pauseReason !== 'tutorial') { paused = null; return; }
    let done;
    if (paused.gesture === 'steer') {
      const a = getAxes();
      done = (a.x !== 0 || a.y !== 0) && (a.x !== baseline.ax || a.y !== baseline.ay);
    } else {
      done = paused.detect();
    }
    if (done) {
      const step = paused;
      paused = null;
      phasePending = false;
      ui.hideGesture();
      markSeen(step);
      idx++;
      cb.onResume(); // the buffered roll/phase flick fires on the first frame back
    }
    return;
  }

  // Playing: pause for the next step once its trigger is met.
  if (game.state !== 'playing' || idx >= STEPS.length) return;
  const step = STEPS[idx];
  if (!step.trigger(player)) return;
  paused = step;
  baseline = snapshot();
  cb.onPause();
  ui.showGesture({ gesture: step.gesture, touch: isTouch(), text: step.text() });
}
