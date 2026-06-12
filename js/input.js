import { clamp } from './util.js';

// Input state. Keyboard (WASD/arrows + Space) and touch (drag to steer,
// second finger held = boost). Game-flow keys/taps are handled in main.js.
export const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  boost: false,
  tx: 0, // touch-drag analog axes, -1..1
  ty: 0,
  rollRequest: 0, // -1 / +1: barrel roll request, consumed by player.update
};

// Combined analog steering axes used by the flight model.
export function getAxes() {
  return {
    x: clamp((input.right ? 1 : 0) - (input.left ? 1 : 0) + input.tx, -1, 1),
    y: clamp((input.up ? 1 : 0) - (input.down ? 1 : 0) + input.ty, -1, 1),
  };
}

const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'boost',
};

export function initInput() {
  // Barrel roll: double-tap left/right (within DOUBLE_TAP s) or Shift+direction.
  const DOUBLE_TAP = 0.28;
  const lastTap = { left: -Infinity, right: -Infinity };

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (action) {
      // e.repeat guard: key auto-repeat must not count as a double-tap.
      if (!e.repeat && (action === 'left' || action === 'right')) {
        const now = performance.now() / 1000;
        const dir = action === 'right' ? 1 : -1;
        if (e.shiftKey || now - lastTap[action] < DOUBLE_TAP) {
          input.rollRequest = dir;
        }
        lastTap[action] = now;
      }
      input[action] = true;
      e.preventDefault(); // stop arrows/space scrolling the page
    } else if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !e.repeat) {
      // Shift while already steering also rolls.
      if (input.left) input.rollRequest = -1;
      else if (input.right) input.rollRequest = 1;
    }
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) input[action] = false;
  });
}

// Touch controls on the game canvas (not the HUD, so menu buttons still work):
// the first finger is a relative joystick — drag from wherever it landed and
// the dragon steers by the offset. Any additional finger held down = boost.
// Barrel roll on touch, two ways:
//   1. swipe a SECOND finger horizontally (boost finger doubles as the roll
//      trigger — steering thumb never has to leave its anchor), or
//   2. flick the steering finger fast sideways; the joystick re-anchors at
//      the finger's new position so steering control is never lost.
// Finger roles are sticky: a boost finger never silently becomes the steering
// finger. If the steering finger lifts, steering returns to neutral and the
// next NEW touch becomes the steering finger.
export function initTouch(el) {
  const SPAN = 110;          // px of drag for full deflection
  const FLICK_SPEED = 1700;  // px/s horizontal flick on the steer finger = roll
  const SWIPE_SPEED = 250;   // px/s a second finger must sustain to count as swiping
  const SWIPE_DIST = 48;     // px of sustained same-direction travel = roll
  let steerId = null;
  let baseX = 0;
  let baseY = 0;
  let lastX = 0;
  let lastT = 0;
  // Non-steer touches tracked for swipe-to-roll: id -> {lx, ly, lt, acc, dir, rolled}
  const extras = new Map();

  const countBoost = () => { input.boost = extras.size > 0; };

  el.addEventListener(
    'touchstart',
    (e) => {
      for (const t of e.changedTouches) {
        if (steerId === null) {
          steerId = t.identifier;
          baseX = t.clientX;
          baseY = t.clientY;
          lastX = t.clientX;
          lastT = performance.now();
        } else {
          extras.set(t.identifier, {
            lx: t.clientX, ly: t.clientY, lt: performance.now(),
            acc: 0, dir: 0, rolled: false,
          });
        }
      }
      countBoost();
      e.preventDefault(); // no scrolling/zooming over the game
    },
    { passive: false }
  );

  el.addEventListener(
    'touchmove',
    (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === steerId) {
          input.tx = clamp((t.clientX - baseX) / SPAN, -1, 1);
          input.ty = clamp(-(t.clientY - baseY) / SPAN, -1, 1); // drag up = fly up
          // Fast horizontal flick = barrel roll; re-anchor the joystick at the
          // finger so the flick doesn't leave steering pinned at full deflection.
          // dt floors at 1ms — browsers can coalesce several moves into one
          // timestamp, and those bursts ARE fast motion. The 10px travel gate
          // keeps micro-jitter from registering as a flick.
          const now = performance.now();
          const dtMs = Math.max(now - lastT, 1);
          const vx = (t.clientX - lastX) / (dtMs / 1000);
          if (Math.abs(vx) > FLICK_SPEED && Math.abs(t.clientX - lastX) > 10) {
            input.rollRequest = Math.sign(vx);
            baseX = t.clientX;
            baseY = t.clientY;
            input.tx = 0;
            input.ty = 0;
          }
          lastX = t.clientX;
          lastT = now;
        } else {
          // Second-finger swipe = barrel roll in the swipe direction.
          // Velocity-accumulation: the finger may rest (boosting) for any
          // length of time first — a sustained fast horizontal sweep rolls,
          // slow drift or vertical movement never does.
          const rec = extras.get(t.identifier);
          if (rec) {
            const now = performance.now();
            const dx = t.clientX - rec.lx;
            const dy = t.clientY - rec.ly;
            // dt floors at 1ms so same-timestamp coalesced moves still count
            // toward the swipe instead of being silently dropped.
            const dtMs = Math.max(now - rec.lt, 1);
            const speed = Math.abs(dx) / (dtMs / 1000);
            const dir = Math.sign(dx);
            if (speed > SWIPE_SPEED && dir !== 0 && Math.abs(dx) > Math.abs(dy)) {
              if (dir !== rec.dir) { rec.dir = dir; rec.acc = 0; }
              rec.acc += dx;
              if (!rec.rolled && Math.abs(rec.acc) > SWIPE_DIST) {
                rec.rolled = true;
                input.rollRequest = dir;
              }
            } else {
              // Finger slowed/changed axis: reset so a later swipe can roll again.
              rec.acc = 0;
              rec.dir = 0;
              rec.rolled = false;
            }
            rec.lx = t.clientX;
            rec.ly = t.clientY;
            rec.lt = now;
          }
        }
      }
      e.preventDefault();
    },
    { passive: false }
  );

  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === steerId) {
        // Steering finger lifted: neutral steering until a new finger lands.
        // Held boost fingers keep boosting — roles never swap mid-flight.
        steerId = null;
        input.tx = 0;
        input.ty = 0;
      } else {
        extras.delete(t.identifier);
      }
    }
    countBoost();
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}
