// Impact FX: one pooled set of additive flare sprites (tinted per spawn) plus
// pooled halo-ring shockwave sprites and pooled 3D blast rings (oriented torus
// meshes for ground/air shockwaves with real perspective).

import * as THREE from 'three';
import { texFlare, texHalo } from './util.js';

const POOL = 360;
const HALO_POOL = 10;
const RING_POOL = 6;
const VISIBLE_CAP = 170;

let scene = null;
let quality = 1;
const sprites = [];
const halos = [];
const rings = [];
let cursor = 0;
let visible = 0;

const tmpV = new THREE.Vector3();

export function setParticleQuality(q) { quality = q; }

export function initParticles(s) {
  scene = s;
  const flareTex = texFlare('200,230,255');
  for (let i = 0; i < POOL; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flareTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.visible = false;
    sp.userData = {
      life: 0, decay: 1, size: 1, vel: new THREE.Vector3(),
      grav: 0, drag: 0, stretch: 1, shrink: false,
    };
    scene.add(sp);
    sprites.push(sp);
  }
  const haloTex = texHalo();
  for (let i = 0; i < HALO_POOL; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.visible = false;
    sp.userData = { life: 0, decay: 1, grow: 14 };
    scene.add(sp);
    halos.push(sp);
  }
  for (let i = 0; i < RING_POOL; i++) {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.05, 6, 40),
      new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    m.visible = false;
    m.userData = { life: 0, decay: 1, grow: 20 };
    scene.add(m);
    rings.push(m);
  }
}

function acquire() {
  if (visible >= VISIBLE_CAP * quality) return null;
  for (let n = 0; n < POOL; n++) {
    const sp = sprites[cursor];
    cursor = (cursor + 1) % POOL;
    if (!sp.visible) {
      sp.visible = true;
      visible++;
      return sp;
    }
  }
  return null;
}

function spawn(pos, color, o) {
  const sp = acquire();
  if (!sp) return null;
  sp.position.copy(pos);
  sp.material.color.setHex(color);
  sp.material.rotation = 0;
  const u = sp.userData;
  u.life = 1;
  u.decay = 1 / (o.life || 0.6);
  u.size = (o.size || 0.8) * (0.7 + Math.random() * 0.6);
  u.grav = o.grav ?? 6;
  u.drag = o.drag ?? 2.2;
  u.stretch = o.stretch ?? 1;
  u.shrink = o.shrink ?? false;
  const sp2 = o.spread ?? 1;
  const a = Math.random() * Math.PI * 2;
  const b = (Math.random() - 0.5) * Math.PI * sp2;
  const v = (o.speed || 9) * (0.45 + Math.random() * 0.65);
  u.vel.set(Math.cos(a) * Math.cos(b) * v, Math.sin(b) * v, Math.sin(a) * Math.cos(b) * v);
  if (o.dir) u.vel.addScaledVector(o.dir, o.dirSpeed ?? (o.speed || 9));
  return sp;
}

// --- Recipes -------------------------------------------------------------

// Melee connect: directional spray of hot sparks + a couple of streaks.
export function hitSparks(pos, color, dir, weight = 0.4) {
  const n = Math.round((7 + weight * 12) * quality) || 1;
  for (let i = 0; i < n; i++) {
    spawn(pos, i % 3 === 0 ? 0xffffff : color, {
      speed: 9 + weight * 10, size: 0.5 + weight * 0.4, life: 0.35 + Math.random() * 0.25,
      dir, dirSpeed: 5 + weight * 7, grav: 9, drag: 2.4, stretch: 2.6,
    });
  }
}

// Warp-strike impact: white core flash + colored petals + halo.
export function warpBurst(pos, color) {
  spawn(pos, 0xffffff, { speed: 0.5, size: 4.2, life: 0.18, grav: 0, drag: 0, shrink: true });
  const n = Math.round(16 * quality) || 1;
  for (let i = 0; i < n; i++) {
    spawn(pos, color, { speed: 16, size: 0.7, life: 0.5, grav: 4, drag: 2, stretch: 3 });
  }
  halo(pos, color, { grow: 16, life: 0.45 });
}

// Perfect dodge: cold ripple — thin white streaks + halo, no gravity.
export function witchRipple(pos) {
  const n = Math.round(10 * quality) || 1;
  for (let i = 0; i < n; i++) {
    spawn(pos, 0xbfe9ff, { speed: 12, size: 0.45, life: 0.4, grav: 0, drag: 1.2, stretch: 3.4 });
  }
  halo(pos, 0xbfe9ff, { grow: 10, life: 0.35 });
}

// Boss stagger break: big gold eruption.
export function staggerBurst(pos) {
  const n = Math.round(30 * quality) || 1;
  for (let i = 0; i < n; i++) {
    spawn(pos, i % 2 ? 0xffd87a : 0xfff3c8, {
      speed: 18, size: 1.0, life: 0.8, grav: 7, drag: 1.8, stretch: 2,
    });
  }
  halo(pos, 0xffd87a, { grow: 26, life: 0.6 });
  blastRing(pos, 0xffe9a8, { grow: 30, life: 0.7 });
}

// Hero hurt: red flecks knocked outward.
export function hurtSparks(pos, dir) {
  const n = Math.round(8 * quality) || 1;
  for (let i = 0; i < n; i++) {
    spawn(pos, i % 2 ? 0xff5a4d : 0xffb09a, {
      speed: 8, size: 0.6, life: 0.4, dir, dirSpeed: 7, grav: 8, drag: 2,
    });
  }
}

// Ambient gauge moment (armiger on, level up...): rising motes.
export function riseMotes(pos, color, count = 14) {
  const n = Math.round(count * quality) || 1;
  for (let i = 0; i < n; i++) {
    tmpV.copy(pos);
    tmpV.x += (Math.random() - 0.5) * 1.6;
    tmpV.z += (Math.random() - 0.5) * 1.6;
    spawn(tmpV, color, { speed: 1.5, size: 0.5, life: 0.9, grav: -6, drag: 0.8 });
  }
}

// Continuous dissolve stream for the boss death (call per-frame).
export function dissolveStream(pos, color, intensity = 1) {
  const n = Math.max(1, Math.round(3 * intensity * quality));
  for (let i = 0; i < n; i++) {
    tmpV.set(
      pos.x + (Math.random() - 0.5) * 6,
      pos.y + (Math.random() - 0.5) * 5,
      pos.z + (Math.random() - 0.5) * 6
    );
    spawn(tmpV, i % 3 === 0 ? 0xffffff : color, {
      speed: 2, size: 0.9, life: 1.4, grav: -11, drag: 0.6,
    });
  }
}

// Blade trail dab: one stretch sprite along the tip's motion (call per frame
// while a swing is active — cheap, reads as a light ribbon).
export function trailDab(pos, color, vel) {
  const sp = spawn(pos, color, {
    speed: 0.2, size: 0.55, life: 0.22, grav: 0, drag: 0, stretch: 2.8,
  });
  if (sp && vel) sp.userData.vel.copy(vel).multiplyScalar(0.12);
}

export function halo(pos, color, { grow = 14, life = 0.5 } = {}) {
  for (const sp of halos) {
    if (sp.visible) continue;
    sp.visible = true;
    sp.position.copy(pos);
    sp.material.color.setHex(color);
    sp.material.opacity = 0.9;
    sp.scale.setScalar(1);
    sp.userData.life = 1;
    sp.userData.decay = 1 / life;
    sp.userData.grow = grow;
    return;
  }
}

// 3D shockwave ring; normal defaults to +Y (ground blast).
const RING_Z = new THREE.Vector3(0, 0, 1);
export function blastRing(pos, color, { grow = 22, life = 0.6, normal } = {}) {
  for (const m of rings) {
    if (m.visible) continue;
    m.visible = true;
    m.position.copy(pos);
    m.material.color.setHex(color);
    m.material.opacity = 0.95;
    m.scale.setScalar(0.6);
    if (normal) m.quaternion.setFromUnitVectors(RING_Z, tmpV.copy(normal).normalize());
    else m.quaternion.setFromUnitVectors(RING_Z, tmpV.set(0, 1, 0));
    m.userData.life = 1;
    m.userData.decay = 1 / life;
    m.userData.grow = grow;
    return;
  }
}

export function updateParticles(dt) {
  for (const sp of sprites) {
    if (!sp.visible) continue;
    const u = sp.userData;
    u.life -= dt * u.decay;
    if (u.life <= 0) {
      sp.visible = false;
      sp.material.opacity = 0;
      visible--;
      continue;
    }
    sp.position.addScaledVector(u.vel, dt);
    if (u.drag) u.vel.multiplyScalar(Math.max(0, 1 - u.drag * dt));
    u.vel.y -= u.grav * dt;
    sp.material.opacity = Math.min(1, u.life * 1.2) * 0.95;
    const s = u.shrink
      ? u.size * u.life
      : u.size * (0.65 + (1 - u.life) * 1.1);
    if (u.stretch > 1) {
      sp.material.rotation = Math.atan2(u.vel.y, u.vel.x);
      sp.scale.set(s * u.stretch, s * 0.5, 1);
    } else {
      sp.scale.set(s, s, 1);
    }
  }
  for (const sp of halos) {
    if (!sp.visible) continue;
    const u = sp.userData;
    u.life -= dt * u.decay;
    if (u.life <= 0) { sp.visible = false; sp.material.opacity = 0; continue; }
    const k = 1 - u.life;
    sp.scale.setScalar(1 + k * u.grow);
    sp.material.opacity = u.life * 0.85;
  }
  for (const m of rings) {
    if (!m.visible) continue;
    const u = m.userData;
    u.life -= dt * u.decay;
    if (u.life <= 0) { m.visible = false; m.material.opacity = 0; continue; }
    const k = 1 - u.life;
    m.scale.setScalar(0.6 + k * u.grow);
    m.material.opacity = u.life * 0.9;
  }
}

export function resetParticles() {
  for (const sp of [...sprites, ...halos]) {
    sp.visible = false;
    sp.material.opacity = 0;
  }
  for (const m of rings) {
    m.visible = false;
    m.material.opacity = 0;
  }
  visible = 0;
}
