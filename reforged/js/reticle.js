import * as THREE from 'three';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';
import { CONFIG } from './config.js';
import { saveData } from './save.js';
import { game } from './gameState.js';
import { lockHudState } from './lockLayer.js';
import { on } from './events.js';

// Panzer-Dragoon-style nested-square target reticle: projects the next
// ring/window onto the screen as two counter-rotating squares. Pure DOM
// transform — zero render cost. Locks green when the player is lined up.

let el = null;
let camera = null;
let prevLocked = false;   // edge-detect the green-snap pop in a boss
let pipWrap = null;       // the V2 painted-pip row (created in initReticle)
let pipEls = [];
let markEls = [];          // in-world painted-organ markers (pooled, ≤6)
const tmpV = new THREE.Vector3();
export function initReticle(cam) {
  camera = cam;
  el = document.createElement('div');
  el.id = 'reticle';
  // .rsnap = the one-shot lock-on ring flash (fires on the green snap).
  el.innerHTML = '<div class="rsq"></div><div class="rsq inner"></div><div class="rsnap"></div><div class="lockpips"></div>';
  pipWrap = el.querySelector('.lockpips');
  // Painted-organ marker pool: a painted organ carries its OWN pinned square with a
  // draining fill (how long the lock holds) — the reticle is the PAINTER, these are
  // the PAINTED (one reticle can't carry three locks' worth of state). Pure DOM.
  const hud = document.getElementById('hud');
  markEls = [];
  for (let i = 0; i < 6; i++) {
    const m = document.createElement('div');
    m.className = 'lockmark';
    // The wyrm-rune sigil (Hunter's Brand): the brand your rider burns onto the
    // organ — kindles jade-white on paint, banks as the fill drains, ashes grey
    // when the deflect rule freezes it. One shared rune for now; the per-dragon
    // sigil is the planned Eternal-ascension cosmetic hook.
    m.innerHTML = '<div class="fill"></div>' +
      '<svg class="rune" viewBox="0 0 24 24"><path d="M12 2 L20 12 L12 22 L4 12 Z M12 6 V18 M7.5 12 H16.5"/></svg>';
    hud.appendChild(m);
    markEls.push(m);
  }
  // The exhale flash: a DELIBERATE loose flares the pip row once — the cap auto-volley,
  // the PR3 manual tap-loose, and the Surge fork all earn it (the decay fizzle doesn't).
  on('lockVolley', (p) => {
    if (!pipWrap || !p || (p.source !== 'cap' && p.source !== 'tap' && p.source !== 'fork')) return;
    pipWrap.classList.remove('volley');
    void pipWrap.offsetWidth;
    pipWrap.classList.add('volley');
  });
  // PR3 SEALED loose: a tap onto a deflected boss can't take — the kept pips SHAKE once
  // (sealed honesty: no green celebration, the brands stay banked for the break).
  on('lockSealed', () => {
    if (!pipWrap) return;
    pipWrap.classList.remove('sealshake');
    void pipWrap.offsetWidth;
    pipWrap.classList.add('sealshake');
  });
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
    // Sealed = muted (slot 13) OR the deflect rule (shield/scatter/closed eye/
    // survival card): the WHOLE lock layer is paused, and the lead reticle must
    // say so — a green 'locked' on a shielded boss promises a mark that won't take.
    const ashen = L.muted || L.ashen;
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
    renderMarks(L);
    return;
  }
  el.classList.remove('boss', 'sealed', 'aiming', 'snap');
  if (markEls.length && markEls[0].classList.contains('show')) for (const m of markEls) m.classList.remove('show');

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
  // The INHALE: while the cap fuse draws, the pip row swells + brightens — the
  // 1s between "set complete" and the exhale is a readable breath, not a timer.
  pipWrap.style.setProperty('--fuse', (hud.fuse01 || 0).toFixed(3));
  pipWrap.classList.toggle('inhale', (hud.fuse01 || 0) > 0);
  const locks = hud.locks || [];
  for (let i = 0; i < pipEls.length; i++) {
    const filled = i < (hud.pips || 0);
    pipEls[i].classList.toggle('filled', filled);
    pipEls[i].classList.toggle('ashen', filled && hud.ashen);
    pipEls[i].classList.toggle('blink', filled && hud.blink && i === 0);
    // Each pip drains with its lock's remaining life, mirroring the organ marker.
    if (filled && locks.length) {
      const lk = locks[Math.min(i, locks.length - 1)];
      pipEls[i].style.setProperty('--life', Math.max(0, Math.min(1, lk.life)).toFixed(3));
    }
  }
}

// Project each painted lock's live world anchor to the screen: a pinned square whose
// inner fill DRAINS with the lock's remaining life (--life 1 → fresh, 0 → expired),
// ashen while the deflect rule freezes the layer, blinking its final second.
const _mv = new THREE.Vector3();
function renderMarks(hud) {
  const locks = hud.locks || [];
  for (let i = 0; i < markEls.length; i++) {
    const m = markEls[i];
    const lk = locks[i];
    if (!lk) { m.classList.remove('show'); continue; }
    _mv.set(lk.x, lk.y, lk.z).project(camera);
    if (_mv.z > 1) { m.classList.remove('show'); continue; }
    const sx = (_mv.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_mv.y * 0.5 + 0.5) * window.innerHeight;
    m.classList.add('show');
    m.classList.toggle('kindle', lk.life > 0.94);   // the fresh brand's kindle flash
    m.classList.toggle('ashen', !!hud.ashen);
    m.classList.toggle('blink', !!lk.blink);
    m.classList.toggle('stacked', (lk.stacks || 1) > 1);
    m.style.setProperty('--life', Math.max(0, Math.min(1, lk.life)).toFixed(3));
    // Position via CSS vars so the kindle animation (which owns transform for
    // 0.35s) composes with the screen placement instead of fighting it.
    m.style.setProperty('--mx', sx.toFixed(1) + 'px');
    m.style.setProperty('--my', sy.toFixed(1) + 'px');
  }
}
