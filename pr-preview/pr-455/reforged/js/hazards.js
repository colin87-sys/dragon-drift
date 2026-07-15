import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { hitPlayer } from './collision.js';
import { makeGlowTexture } from './util.js';
import { burst } from './particles.js';

// Biome hazards (BIOME-DESIGN.md §5.3) — dodge-only, magenta, role-locked.
// Placement is deterministic (level.js#overlayBiomeHazards on its OWN RNG
// stream → out.hazards; never touches rings/obstacles/golds), but the burst
// TIMING and collision live here at runtime. Same individual-mesh lifecycle as
// goldEmbers.js: init (shared resources) → add (per-vent meshes) → update
// (timing loop + collision + FX) → reset.
//
// The geyser: a slim OPAQUE magenta core column (never an enclosing additive
// shell — §8 overdraw rule) + an additive base flare that sells the lethal
// footprint + rim embers while erupting. Each vent cycles on GAME TIME,
// phase-offset so the field never pulses in lockstep. Collision (a vertical
// cylinder: horizontal distance in the x/dist plane) is live only during the
// lethal burst window, and never during a boss fight (clean-arena law).

const DANGER = 0xff2b6a;         // role-locked danger magenta (Law 6)
const COLUMN_H = CONFIG.laneMaxY + 6;   // rises through the whole flyable lane

let scene = null;
let coreGeo = null;
let coreMat = null;
let flareTex = null;
const vents = [];

export function initHazards(s) {
  scene = s;
  // Slim opaque core (radius 0.9), origin at its BASE so scaling Y grows it
  // upward from the water like a real jet.
  coreGeo = new THREE.CylinderGeometry(0.55, 0.9, COLUMN_H, 7, 1, true);
  coreGeo.translate(0, COLUMN_H / 2, 0);
  coreMat = new THREE.MeshStandardMaterial({
    color: 0x2a0406, emissive: DANGER, emissiveIntensity: 2.2,
    roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide,
  });
  flareTex = makeGlowTexture('255,60,120');
}

// p = { dist, x, warn, radius, phase } from out.hazards.
export function addHazard(p) {
  if (!scene) return;
  const period = p.warn + CONFIG.hazardBurstDur + CONFIG.hazardIdle;
  const group = new THREE.Group();
  group.position.set(p.x, 0, -p.dist);

  const core = new THREE.Mesh(coreGeo, coreMat);
  core.visible = false;
  group.add(core);

  // Base flare — an additive disc lying flat on the water that marks the vent
  // (dim when idle so the player can READ the field ahead) and flares magenta
  // through the telegraph so the eruption is warned. Scaled to the lethal
  // footprint so the danger zone is honest.
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flareTex, color: DANGER, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flare.scale.set(p.radius * 2.6, p.radius * 2.6, 1);
  flare.position.y = 0.4;
  group.add(flare);

  scene.add(group);
  vents.push({
    group, core, flare, dist: p.dist, x: p.x, warn: p.warn,
    radius: p.radius, phase: p.phase, period, rimT: 0,
  });
}

export function updateHazards(dt, player, time) {
  const R = CONFIG.playerRadius;
  for (let i = vents.length - 1; i >= 0; i--) {
    const v = vents[i];
    if (v.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }

    // Where in its cycle is this vent? phase offset keeps the field out of lockstep.
    const cyc = (time + v.phase * v.period) % v.period;
    const bt = cyc - v.warn;                    // seconds since the burst began (<0 = still charging)
    const charging = cyc < v.warn;
    const erupting = bt >= 0 && bt < CONFIG.hazardBurstDur;

    // Visual column height: snaps up fast, holds, drops at the end (a jet, not a lerp).
    let up = 0;
    if (erupting) {
      up = Math.min(1, bt / 0.12, (CONFIG.hazardBurstDur - bt) / 0.18);
      up = Math.max(0, up);
    }
    v.core.visible = up > 0.01;
    if (v.core.visible) v.core.scale.set(1, up, 1);

    // Base flare: a dim always-on marker, brightening across the telegraph
    // (charge²so the tell reads late), full during the eruption.
    const charge = charging ? cyc / v.warn : 0;
    const flareOp = Math.max(0.18, erupting ? 0.9 : charge * charge * 0.85);
    v.flare.material.opacity = flareOp;
    const flareScale = v.radius * (erupting ? 3.0 : 2.6 + charge * 0.6);
    v.flare.scale.set(flareScale, flareScale, 1);

    // Rim embers riding the jet while it's up (the "children of the fire" look).
    if (erupting) {
      v.rimT -= dt;
      if (v.rimT <= 0 && v.dist - player.dist < 170) {
        v.rimT = 0.05;
        _tmp.set(v.x + (Math.random() - 0.5) * v.radius, 1 + Math.random() * COLUMN_H, -v.dist);
        burst(_tmp, DANGER, { count: 2, speed: 11, size: 0.7, life: 0.5 });
      }
    }

    // Collision: a vertical cylinder — lethal only while erupting, never during
    // a boss fight (clean-arena law, mirrors collision.js). Routes through
    // hitPlayer → zero knockback, barrel-roll i-frames clear it (dodge-only).
    if (erupting && !game.inBoss && game.state === 'playing') {
      const dx = player.position.x - v.x;
      const dz = player.dist - v.dist;
      if (dx * dx + dz * dz < (v.radius + R) * (v.radius + R)) {
        hitPlayer(player, CONFIG.hazardDamage, 'geyser', { x: 0, y: -1 });   // a geyser strikes from below
      }
    }
  }
}

function removeAt(i) {
  const v = vents[i];
  scene.remove(v.group);
  v.flare.material.dispose();
  vents.splice(i, 1);
}

// Drop every live vent — called on run reset AND on bossStart (a boss fight is a
// clean arena; a column left standing would collide the moment the fight ends).
export function resetHazards() {
  while (vents.length) removeAt(vents.length - 1);
}

const _tmp = new THREE.Vector3();
