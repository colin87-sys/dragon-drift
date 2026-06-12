import * as THREE from 'three';
import { CONFIG } from './config.js';
import { on } from './events.js';
import { game } from './gameState.js';
import { saveData } from './save.js';
import { ui } from './ui.js';
import { sfx } from './sfx.js';
import { makeGlowTexture } from './util.js';

// Personal-best beacon: a pair of shimmering gold light pillars standing at
// your best distance. Passing it is a small celebration + ember bonus — the
// "almost beat it" tension made physical on every run. Embers, not score:
// score bonuses tied to per-player PBs would skew challenge-link races.

let group = null;
let markerDist = 0;
let passed = true;  // true = inert (no marker this run)
let fade = 0;

export function initPbMarker(scene) {
  group = new THREE.Group();
  const tex = makeGlowTexture('255,215,120');
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, color: 0xffd870, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      s.position.set(side * 10.5, 3 + i * 4.6, 0);
      s.scale.set(3.2 - i * 0.4, 5.5, 1);
      group.add(s);
    }
  }
  group.visible = false;
  group.traverse((o) => o.layers && o.layers.set(1)); // skip water reflection
  scene.add(group);
  // Self-arming on every run (the first takeoff doesn't go through
  // restart(), so a plain reset call from there would miss it).
  on('runStart', resetPbMarker);
}

// Stand the beacon at the saved best distance for the new run.
function resetPbMarker() {
  markerDist = Math.floor(saveData.best.dist);
  passed = !(markerDist > 400 && game.mode !== 'gambit');
  fade = 0;
  group.visible = false;
}

export function updatePbMarker(dt, player, time) {
  if (passed && fade <= 0) { group.visible = false; return; }
  group.visible = true;
  group.position.z = -markerDist;

  if (!passed) {
    // Idle shimmer while it waits ahead
    const pulse = 0.7 + Math.sin(time * 2.2) * 0.15;
    for (const s of group.children) s.material.opacity = pulse;
    if (player.dist > markerDist) {
      passed = true;
      fade = 1;
      game.embersRun += CONFIG.pbMarkerBonus;
      ui.pbMarkerPopup(CONFIG.pbMarkerBonus);
      ui.perfectFlash();
      sfx.record();
    }
  } else {
    fade -= dt * 0.8;
    const k = Math.max(fade, 0);
    for (const s of group.children) s.material.opacity = k;
    if (k <= 0) group.visible = false;
  }
}
