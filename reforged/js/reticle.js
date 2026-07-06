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
let prevLocked = false;   // edge-detect the green-snap pop in a boss
let pipWrap = null;       // the V2 painted-pip row (created in initReticle)
let pipEls = [];
const tmpV = new THREE.Vector3();
export function initReticle(cam) {
  camera = cam;
  el = document.createElement('div');
  el.id = 'reticle';
  // .rsnap = the one-shot lock-on ring flash (fires on the green snap).
  el.innerHTML = '<div class="rsq"></div><div class="rsq inner"></div><div class="rsnap"></div><div class="lockpips"></div>';
  pipWrap = el.querySelector('.lockpips');
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
    if (!L.active) { el.style.opacity = 0; el.classList.remove('boss', 'locked', 'aiming', 'snap'); prevLocked = false; return; }
    el.classList.add('boss');
    el.classList.remove('gate');
    tmpV.set(L.x, L.y, L.z).project(camera);
    if (tmpV.z > 1) { el.style.opacity = 0; return; }   // organ behind the camera
    const sx = (tmpV.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
    const ashen = L.muted;
    const locked = L.aimHeld;
    const dwell = Math.max(0, Math.min(1, L.dwell || 0));
    el.classList.toggle('sealed', ashen);
    el.classList.toggle('locked', locked && !ashen);
    el.classList.toggle('aiming', !locked && !ashen && dwell > 0.03);   // building toward a lock
    el.style.setProperty('--dwell', dwell.toFixed(3));
    // Green SNAP the instant it locks: re-arm the one-shot ring-flash via a reflow.
    if (locked && !prevLocked) { el.classList.remove('snap'); void el.offsetWidth; el.classList.add('snap'); }
    else if (!locked) el.classList.remove('snap');
    prevLocked = locked;
    // The reticle "closes in" as the dwell builds (1.35 → 1.0), snaps tight + green on
    // lock, and sits wide + dim when ashen (muted). Brightness rises with progress.
    const scale = ashen ? 1.15 : (locked ? 0.82 : (1.35 - 0.35 * dwell));
    el.style.opacity = ashen ? 0.5 : (0.72 + 0.28 * dwell);
    el.style.transform = `translate(${sx}px, ${sy}px) scale(${scale})`;
    renderPips(L);
    return;
  }
  el.classList.remove('boss', 'sealed', 'aiming', 'snap');

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

// V2 LANCE pips: painted locks as a square-pip row under the reticle (squares, not
// dots — role is never hue-alone). Slots = the band cap; filled left-to-right in
// paint order; ashen while the target deflects (the ONE deflect rule freezes the
// layer); the OLDEST pip blinks its final second — decay legibility is free for
// every player at rung 0 (audit F9). Pure DOM, zero render cost.
function renderPips(hud) {
  if (!pipWrap) return;
  const cap = hud.cap || 0;
  if (pipEls.length !== cap) {
    pipWrap.innerHTML = '';
    pipEls = [];
    for (let i = 0; i < cap; i++) {
      const p = document.createElement('div');
      p.className = 'lockpip';
      pipWrap.appendChild(p);
      pipEls.push(p);
    }
  }
  for (let i = 0; i < pipEls.length; i++) {
    const filled = i < (hud.pips || 0);
    pipEls[i].classList.toggle('filled', filled);
    pipEls[i].classList.toggle('ashen', filled && hud.ashen);
    pipEls[i].classList.toggle('blink', filled && hud.blink && i === 0);
  }
}
