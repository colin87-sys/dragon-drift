import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { makeGlowTexture } from './util.js';
import { burst } from './particles.js';
import { emit } from './events.js';
import { juiceEvent } from './juice.js';

// Golden Embers: rare seeded comet pickups worth a fistful of ordinary
// embers. Placement comes from level.js's independent gold RNG stream
// (deterministic per seed — both racers on a challenge link see the same
// goldens). Same individual-mesh pattern as speed orbs.

let scene = null;
let geo = null;
let glowTex = null;
let coreMat = null;
const golds = [];

// THE EMPYREAN uplift PR-1 — per-biome pickup tint. Canary gold is the loudest warmth violation on the
// pearl field (independent audit), so in biome 5 the comet shifts to a vivid ROSE-GOLD (hue ≥315°):
// still loud enough to read as treasure, but on the biome's accent hue. 0 everywhere else → the shared
// material stays exactly the shipped gold (lerp at 0 = identity).
const _GOLD = { color: new THREE.Color(0xffd040), emissive: new THREE.Color(0xffa010) };
const _ROSE = { color: new THREE.Color(0xffb8cf), emissive: new THREE.Color(0xf04f8e) };
let _tint = 0;
export function setGoldEmberTint(mix) {
  _tint = mix || 0;
  if (!coreMat) return;
  coreMat.color.copy(_GOLD.color).lerp(_ROSE.color, _tint);
  coreMat.emissive.copy(_GOLD.emissive).lerp(_ROSE.emissive, _tint);
}

export function initGoldEmbers(s) {
  scene = s;
  geo = new THREE.OctahedronGeometry(0.55, 0);
  glowTex = makeGlowTexture('255,200,80');
  coreMat = new THREE.MeshStandardMaterial({
    color: 0xffd040, emissive: 0xffa010, emissiveIntensity: 2.6,
    roughness: 0.15, metalness: 0.55,
  });
}

export function addGoldEmber(p) {
  const mesh = new THREE.Mesh(geo, coreMat);
  mesh.position.set(p.x, p.y, -p.dist);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.set(5.6, 5.6, 1);
  mesh.add(glow);
  scene.add(mesh);
  golds.push({ mesh, glow, dist: p.dist, x: p.x, y: p.y, collected: false, flash: 0, spark: 0 });
}

export function updateGoldEmbers(dt, player, time) {
  for (let i = golds.length - 1; i >= 0; i--) {
    const o = golds[i];
    if (o.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }
    if (!o.collected) {
      o.mesh.position.y = o.y + Math.sin(time * 2.4 + o.dist) * 0.6;
      o.mesh.rotation.y = time * 2.2;
      const pulse = 5.0 + Math.sin(time * 5 + o.dist) * 1.4;
      o.glow.scale.set(pulse, pulse, 1);
      // Lazy spark trail so it reads as treasure from far away
      o.spark -= dt;
      if (o.spark <= 0 && o.dist - player.dist < 160) {
        o.spark = 0.22;
        burst(o.mesh.position, _tint > 0.5 ? 0xf6a0c4 : 0xffd870, { count: 1, speed: 2.5, size: 0.5, life: 0.6 });
      }

      const dx = player.position.x - o.x;
      const dy = player.position.y - o.mesh.position.y;
      const dz = player.dist - o.dist;
      if (dx * dx + dy * dy + dz * dz < 2.6 * 2.6) {
        o.collected = true;
        o.flash = 1;
        const goldVal = Math.round(CONFIG.goldEmberValue * game.mods.gold); // Daily "Gold Rush" pays more
        game.embersRun += goldVal;
        game.goldEmbersRun++;
        ui.goldEmberPopup(goldVal);
        ui.perfectFlash();
        juiceEvent('goldenEmber'); // the treasure moment: hitstop + warm bloom
        sfx.goldEmber();
        burst(o.mesh.position, _tint > 0.5 ? 0xffb8cf : 0xffd040, { count: 26, speed: 15, size: 1.2 });
        emit('goldEmber');
        emit('ember', { n: goldVal, gold: true });
      }
    } else if (o.flash > 0) {
      o.flash -= dt * 3;
      const k = Math.max(o.flash, 0);
      const s = 5.0 + (1 - k) * 16;
      o.glow.scale.set(s, s, 1);
      o.glow.material.opacity = k;
      o.mesh.scale.setScalar(Math.max(k, 0.001));
      if (k <= 0) o.mesh.visible = false;
    }
  }
}

function removeAt(i) {
  const o = golds[i];
  scene.remove(o.mesh);
  o.glow.material.dispose();
  golds.splice(i, 1);
}

export function resetGoldEmbers() {
  while (golds.length) removeAt(golds.length - 1);
}
