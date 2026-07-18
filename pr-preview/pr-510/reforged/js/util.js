import * as THREE from 'three';

// The currency glyph (the "ember"): the classic ◆ diamond, made premium with a
// faceted gold gradient + shadow in CSS (.ember-ico). Shared by every wallet.
export const EMBER_ICON = '◆';

// Deterministic PRNG so the course layout is stable between runs.
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Framerate-independent exponential smoothing.
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// U13 — universal number tweening: the recap ledger's count-up made shared.
// Rolls el.textContent from → to over ~0.4s with a cubic ease-out; collapses to
// an instant set under prefers-reduced-motion (and for no-op changes). fmt owns
// the presentation (defaults to the locale-grouped wallet style). Stops silently
// if the element leaves the DOM mid-tween (screen re-render).
export function tweenNum(el, from, to, { dur = 420, fmt = (n) => Math.round(n).toLocaleString('en-US'), onDone } = {}) {
  if (!el) return;
  from = Number(from) || 0;
  to = Number(to) || 0;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (from === to || reduced) { el.textContent = fmt(to); onDone && onDone(); return; }
  const t0 = performance.now();
  const step = (now) => {
    if (!el.isConnected) return;
    const k = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
    else onDone && onDone();   // fires on the count-up's landing frame (reward-card sigil bloom)
  };
  requestAnimationFrame(step);
}

// Combo intensity tier (drives HUD styling and tier-up jingles).
export function comboTier(c) {
  return c >= 5 ? 4 : c >= 3.5 ? 3 : c >= 2.5 ? 2 : c >= 1.5 ? 1 : 0;
}

// Soft radial glow sprite texture, generated at runtime (no asset files).
export function makeGlowTexture(rgb = '160,220,255', coreRgb = '255,255,255') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${coreRgb},1)`);   // core stop (default white; warm-cream for fire trails so additive stacking can't sum to white)
  grad.addColorStop(0.3, `rgba(${rgb},0.8)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Tight hero-aura falloff (Fable 75): a dead outer 40% of the quad so the 9×9
// shadow-mask footprint (contactShadow.js) stays intact while the VISIBLE glow
// shrinks to ~5.5u. The shipped makeGlowTexture holds 0.8 alpha out to r=0.3 then
// ramps to 0 — that broad shoulder IS the onion-ring disc; this curve is core-hot
// and dead by r=0.6, so there is no visible circular edge. 128px canvas — a 64px
// gradient bands visibly on a 9-unit additive disc. (Own function — makeGlowTexture
// has 30+ callers: trails, motes, powerups; none of them want this falloff.)
export function makeAuraTexture(rgb = '160,220,255') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.00, 'rgba(255,255,255,0.65)');
  grad.addColorStop(0.08, `rgba(${rgb},0.50)`);
  grad.addColorStop(0.30, `rgba(${rgb},0.12)`);
  grad.addColorStop(0.60, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Tight speed-trail falloff (Fable 79): core-hot with NO held shoulder — the shipped
// makeGlowTexture holds 0.8 alpha out to r=0.3, and a frozen puff-stack (timeScale 0)
// reads as balloons piled under the hero in stills. Dead by r=0.7, ~¼ the glow energy
// (opacity-compensated at the call sites so the in-motion ribbon keeps its centreline
// luminance). Keeps the two-stop (rgb, coreRgb) contract so fire dragons keep their warm
// cream core (additive stacks must never sum to white). Own function — makeGlowTexture's
// 30+ callers keep their broad glow.
export function makeTrailTexture(rgb = '160,220,255', coreRgb = '255,255,255') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.00, `rgba(${coreRgb},1)`);
  grad.addColorStop(0.18, `rgba(${rgb},0.55)`);
  grad.addColorStop(0.45, `rgba(${rgb},0.12)`);
  grad.addColorStop(0.70, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Circle-outline shockwave texture (white; tint via material color).
export function makeRingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.shadowColor = 'rgba(255,255,255,0.9)';
  g.shadowBlur = 10;
  g.lineWidth = 7;
  g.beginPath();
  g.arc(64, 64, 50, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

// Rectangle-outline shockwave texture (matches the gate window shape).
export function makeRectTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.shadowColor = 'rgba(255,255,255,0.9)';
  g.shadowBlur = 10;
  g.lineWidth = 7;
  g.strokeRect(20, 26, 88, 76);
  return new THREE.CanvasTexture(c);
}
