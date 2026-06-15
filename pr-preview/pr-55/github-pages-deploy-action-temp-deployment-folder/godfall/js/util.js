import * as THREE from 'three';

// --- Math ---------------------------------------------------------------

export const TAU = Math.PI * 2;

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Framerate-independent exponential approach.
export function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

// Signed shortest angular difference a→b in (-π, π].
export function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}

// Damp an angle along the shortest arc.
export function dampAngle(current, target, lambda, dt) {
  return current + angleDelta(current, target) * (1 - Math.exp(-lambda * dt));
}

export function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
export function easeInCubic(t)  { return t * t * t; }
export function easeInOut(t)    { return t * t * (3 - 2 * t); }
// Sharp anticipation→snap curve for attack contact frames.
export function easeSnap(t)     { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

export function randRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

// Deterministic PRNG (per-fight attack sequencing stays replayable).
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Runtime canvas textures (no asset files anywhere) -------------------

// Soft radial flare with a hot core — the base spark/glow sprite.
export function texFlare(rgb = '190,225,255') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.22, `rgba(${rgb},0.95)`);
  grad.addColorStop(0.55, `rgba(${rgb},0.35)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Thin halo ring for shockwaves.
export function texHalo() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.shadowColor = 'rgba(255,255,255,0.85)';
  g.shadowBlur = 12;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(64, 64, 52, 0, TAU);
  g.stroke();
  return new THREE.CanvasTexture(c);
}

// Weak-point sigil: rotated diamond inside a circle, runic notches.
export function texSigil() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.shadowColor = 'rgba(255,255,255,0.9)';
  g.shadowBlur = 9;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(64, 64, 46, 0, TAU);
  g.stroke();
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(64, 26); g.lineTo(98, 64); g.lineTo(64, 102); g.lineTo(30, 64);
  g.closePath();
  g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    g.beginPath();
    g.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50);
    g.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// Point-warp beacon: chevron arrow inside a halo (traversal chase markers).
export function texBeacon() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.95)';
  g.shadowColor = 'rgba(255,255,255,0.9)';
  g.shadowBlur = 10;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(64, 64, 48, 0, TAU);
  g.stroke();
  g.lineWidth = 7;
  g.lineJoin = 'round';
  for (const dy of [-10, 14]) {
    g.beginPath();
    g.moveTo(40, 70 + dy); g.lineTo(64, 46 + dy); g.lineTo(88, 70 + dy);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}
