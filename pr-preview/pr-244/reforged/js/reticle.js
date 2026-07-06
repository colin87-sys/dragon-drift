import * as THREE from 'three';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';
import { CONFIG } from './config.js';
import { saveData } from './save.js';
import { game } from './gameState.js';
import { lockHudState } from './lockLayer.js';

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
  // Reticle assist can be disabled in settings for a score bonus, but Glide
  // Assist forces it on — it's the directional cue beginners aim their swipe at.
  const wantReticle = saveData.settings.reticle || saveData.settings.glideAssist;
  if (!playing || !wantReticle) { el.style.opacity = 0; el.classList.remove('boss'); return; }

  // THE LANCE layer — the reticle's SECOND job. In a boss there are no rings/gates;
  // instead it wakes on the aim-line organ: it snaps to the focal (so you see WHERE
  // to fly), goes GREEN when a line holds (dwell complete), and shows the ashen
  // "sealed" skin when the target is muted (slot 13) or no organ is up. Pure DOM.
  if (game.inBoss) {
    const L = lockHudState();
    if (!L.active) { el.style.opacity = 0; el.classList.remove('boss', 'locked'); return; }
    el.classList.add('boss');
    el.classList.remove('gate');
    tmpV.set(L.x, L.y, L.z).project(camera);
    if (tmpV.z > 1) { el.style.opacity = 0; return; }   // organ behind the camera
    const sx = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
    const ashen = L.muted;
    const locked = L.aimHeld;
    el.classList.toggle('sealed', ashen);
    el.classList.toggle('locked', locked && !ashen);
    el.style.opacity = ashen ? 0.5 : 0.9;
    el.style.transform = `translate(${sx}px, ${sy}px) scale(${locked ? 0.85 : 1})`;
    return;
  }
  el.classList.remove('boss', 'sealed');

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
