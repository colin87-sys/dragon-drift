import * as THREE from 'three';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';
import { CONFIG } from './config.js';
import { saveData } from './save.js';

// Panzer-Dragoon-style nested-square target reticle: projects the next
// ring/window onto the screen as two counter-rotating squares. Pure DOM
// transform — zero render cost. Locks green when the player is lined up.

let el = null;
let camera = null;
const tmpV = new THREE.Vector3();
export function initReticle(cam) {
  camera = cam;
  el = document.createElement('div');
  el.id = 'reticle';
  el.innerHTML = '<div class="rsq"></div><div class="rsq inner"></div>';
  document.getElementById('hud').appendChild(el);
}

export function updateReticle(player, playing) {
  if (!el) return;
  // Reticle assist can be disabled in settings for a score bonus.
  if (!playing || !saveData.settings.reticle) { el.style.opacity = 0; return; }

  const ring = nextRingAhead(player.dist + 4);
  const gate = nextGateAhead(player.dist + 4);
  let target = null;
  if (ring && gate) target = ring.dist < gate.dist ? ring : gate;
  else target = ring || gate;
  const maxAhead = Math.max(220, player.speed * 2.6);
  if (!target || target.dist > player.dist + maxAhead) {
    el.style.opacity = 0;
    return;
  }

  const isGate = target.gapX !== undefined;
  el.classList.toggle('gate', isGate);

  const tx = isGate ? target.gapX : target.x;
  const ty = isGate ? target.gapY : target.y;
  tmpV.set(tx, ty, -target.dist).project(camera);
  if (tmpV.z > 1) { el.style.opacity = 0; return; } // behind the camera

  const sx = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
  const dz = target.dist - player.dist;
  const scale = Math.min(Math.max(120 / dz, 0.45), 2.6);
  const fade = dz > maxAhead - 40 ? (maxAhead - dz) / 40 : 1;

  // Locked = current trajectory passes inside the catch area.
  const catchR = isGate
    ? Math.min(target.gapW, target.gapH) - 0.6
    : CONFIG.ringCatchRadius;
  const locked = Math.abs(player.position.x - tx) < catchR &&
                 Math.abs(player.position.y - ty) < catchR;

  el.style.opacity = 0.85 * fade;
  el.style.transform = `translate(${sx}px, ${sy}px) scale(${scale * (locked ? 0.85 : 1)})`;
  el.classList.toggle('locked', locked);
}
