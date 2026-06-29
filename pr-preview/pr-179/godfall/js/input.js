// Input: 4 verbs (move / attack / dodge / warp) + weapon cycle.
// Keyboard: WASD·arrows move, J·Space attack, K·Shift dodge, L·E warp, Q·1-4 cycle.
// Touch: the lower-left region is an invisible relative joystick; a fast flick
// inside it dodges in the flick direction. Action buttons (DOM, built by
// hud.js) call pressAction(). Actions are buffered ~0.2s so a press during a
// dodge or swing still lands — queued inputs are why combat feels responsive.

import { clamp } from './util.js';

export const input = {
  kx: 0, ky: 0,   // keyboard axes
  tx: 0, ty: 0,   // touch joystick axes
  usingTouch: false,
};

export function getAxes() {
  return {
    x: clamp(input.kx + input.tx, -1, 1),
    y: clamp(input.ky + input.ty, -1, 1),
  };
}

// --- Buffered actions ---------------------------------------------------

const BUFFER = 0.22; // seconds a press stays queued
const queue = { attack: 0, dodge: 0, warp: 0, cycle: 0, armiger: 0 };
const dodgeDir = { x: 0, y: 0 };
let cycleOpts = { step: 1, slot: -1 };

const now = () => performance.now() / 1000;

export function pressAction(type, opts = {}) {
  queue[type] = now() + BUFFER;
  if (type === 'dodge') {
    dodgeDir.x = opts.x ?? 0;
    dodgeDir.y = opts.y ?? 0;
  }
  if (type === 'cycle') cycleOpts = { step: opts.step ?? 1, slot: opts.slot ?? -1 };
}

// Consume a queued action if fresh. Dodge returns a direction (falls back to
// current move axes, then to "orbit right").
export function consumeAction(type) {
  if (queue[type] < now()) return null;
  queue[type] = 0;
  if (type === 'dodge') {
    let { x, y } = dodgeDir;
    if (!x && !y) ({ x, y } = getAxes());
    if (!x && !y) x = 1;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }
  if (type === 'cycle') return cycleOpts;
  return {};
}

export function clearActions() {
  queue.attack = queue.dodge = queue.warp = queue.cycle = 0;
}

// --- Keyboard -------------------------------------------------------------

const HELD = new Set();
const AXIS_KEYS = {
  KeyW: [0, 1], ArrowUp: [0, 1],
  KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

function recomputeKeyAxes() {
  let x = 0, y = 0;
  for (const code of HELD) {
    const a = AXIS_KEYS[code];
    if (a) { x += a[0]; y += a[1]; }
  }
  input.kx = clamp(x, -1, 1);
  input.ky = clamp(y, -1, 1);
}

export function initKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (AXIS_KEYS[e.code]) {
      HELD.add(e.code);
      recomputeKeyAxes();
      e.preventDefault();
      return;
    }
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyJ': case 'Space': pressAction('attack'); e.preventDefault(); break;
      case 'KeyK': case 'ShiftLeft': case 'ShiftRight': pressAction('dodge'); break;
      case 'KeyL': case 'KeyE': pressAction('warp'); break;
      case 'KeyQ': pressAction('cycle', { step: 1 }); break;
      case 'KeyF': case 'KeyR': pressAction('armiger'); break;
      default: break;
    }
    // Direct weapon slots 1-4
    const m = /^Digit([1-4])$/.exec(e.code);
    if (m) pressAction('cycle', { slot: Number(m[1]) - 1 });
  });
  window.addEventListener('keyup', (e) => {
    if (AXIS_KEYS[e.code]) {
      HELD.delete(e.code);
      recomputeKeyAxes();
    }
  });
  window.addEventListener('blur', () => {
    HELD.clear();
    recomputeKeyAxes();
  });
}

// --- Touch joystick --------------------------------------------------------

// Anywhere on the canvas that is NOT covered by a HUD button acts as the
// joystick zone. Relative: deflection measured from where the finger landed.
export function initTouch(el) {
  const SPAN = 100;        // px of drag = full deflection
  const FLICK_SPEED = 1500; // px/s = dodge flick
  const FLICK_DIST = 14;
  let id = null;
  let baseX = 0, baseY = 0;
  let lastX = 0, lastY = 0, lastT = 0;

  el.addEventListener('touchstart', (e) => {
    input.usingTouch = true;
    for (const t of e.changedTouches) {
      if (id !== null) continue;
      id = t.identifier;
      baseX = lastX = t.clientX;
      baseY = lastY = t.clientY;
      lastT = performance.now();
    }
    e.preventDefault();
  }, { passive: false });

  el.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id) continue;
      input.tx = clamp((t.clientX - baseX) / SPAN, -1, 1);
      input.ty = clamp(-(t.clientY - baseY) / SPAN, -1, 1);
      const nowMs = performance.now();
      const dtMs = Math.max(nowMs - lastT, 1);
      const vx = (t.clientX - lastX) / (dtMs / 1000);
      const vy = (t.clientY - lastY) / (dtMs / 1000);
      const speed = Math.hypot(vx, vy);
      const dist = Math.hypot(t.clientX - lastX, t.clientY - lastY);
      if (speed > FLICK_SPEED && dist > FLICK_DIST) {
        pressAction('dodge', { x: Math.sign(vx) || 0, y: -Math.sign(vy) || 0 });
        // Re-anchor so the flick doesn't pin the stick at full deflection.
        baseX = t.clientX; baseY = t.clientY;
        input.tx = input.ty = 0;
      }
      lastX = t.clientX; lastY = t.clientY; lastT = nowMs;
    }
    e.preventDefault();
  }, { passive: false });

  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id) continue;
      id = null;
      input.tx = input.ty = 0;
    }
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);

  // Desktop: clicking the canvas attacks.
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button === 0) pressAction('attack');
  });
}
