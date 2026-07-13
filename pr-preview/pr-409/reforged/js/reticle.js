import * as THREE from 'three';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';
import { CONFIG } from './config.js';
import { saveData } from './save.js';
import { game } from './gameState.js';
import { lockHudState } from './lockLayer.js';
import { on } from './events.js';
import { lensClarity } from './lensFlag.js';
import { incomingThreat } from './bossBullets.js';
import { bossCharge01 } from './boss.js';

// Panzer-Dragoon-style nested-square target reticle: projects the next
// ring/window onto the screen as two counter-rotating squares. Pure DOM
// transform — zero render cost. Locks green when the player is lined up.

// The Hunter's-Brand sigils. The SHARED rune (a diamond + cross) is what every
// dragon burns; an ETERNAL dragon (formLevel>=3) swaps in its personal
// `lanceRune` key (PR8 cosmetic — see setMarkRune). Each is a 24×24 stroke path.
const SHARED_RUNE = 'M12 2 L20 12 L12 22 L4 12 Z M12 6 V18 M7.5 12 H16.5';
const RUNES = {
  nightEye:      'M3 12 Q12 5 21 12 Q12 19 3 12 Z M12 8 V16',            // Night Fury slit-eye
  nightGlass:    'M12 2 L17 11 L13 22 L11 22 L7 11 Z M12 5 V20 M8 10 L12 12 M16 10 L12 12 M8 15 L12 17 M16 15 L12 17', // Nightglass Vesper — a knapped flint shard + flake scars
  nightFang:     'M5 5 L12 20 L19 5 M8 5 L8 9 M16 5 L16 9',              // twin fangs
  plasmaBolt:    'M13 3 L6 13 L11 13 L9 21 L18 9 L13 9 Z',               // plasma bolt
  seraphWing:    'M12 4 A5 5 0 1 1 11.9 4 M4 15 L12 10 L20 15',          // halo + wing sweep
  solarCrown:    'M12 3 V6 M4 12 H7 M17 12 H20 M6 6 L8 8 M18 6 L16 8 M8 16 A4 4 0 1 0 16 16', // sun
  phoenixFlame:  'M12 3 C8 9 10 13 12 21 C14 13 16 9 12 3 Z M12 21 C10 17 11 15 12 12',       // flame
  astralStar:    'M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z',                    // 4-point star
  bullHorns:     'M5 6 Q4 14 12 15 Q20 14 19 6 M12 15 V20',             // horns
  bullHornsRing: 'M6 7 Q5 13 12 14 Q19 13 18 7 M12 14 V19 M9 19 H15',   // horns + base bar
};
// The rune currently painted on every mark (shared until an Eternal dragon
// pushes its own via setMarkRune). Exposed for the __dd test seam.
let markRunePath = SHARED_RUNE;
// Swap the brand sigil on every pooled mark. `key` is a RUNES key (or a raw path
// beginning with 'M'); null / unknown → the shared wyrm rune. Called from main.js
// on dragon build/equip. Idempotent + safe before initReticle (updates markEls
// when they exist; the stored path seeds any later re-render).
export function setMarkRune(key) {
  const path = (key && (key[0] === 'M' ? key : RUNES[key])) || SHARED_RUNE;
  markRunePath = path;
  for (const m of markEls) {
    const p = m.querySelector('.rune path');
    if (p) p.setAttribute('d', path);
  }
}
export function markRune() { return markRunePath; }   // test seam

let el = null;
let camera = null;
let prevLocked = false;   // edge-detect the green-snap pop in a boss
let yieldAmt = 0;         // LENS: eased 0→1 "aim chrome recedes" amount (glow only, never the lock read)
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
  // LENS visibility overhaul: the four "danger-at-the-gaze" telegraph chevrons (intervention
  // 3b) always live in the DOM (cheap, hidden until a wind-up) — the .lens2 skin (hollow
  // corner brackets, intervention 2) and .threat visibility are toggled per-frame from the
  // Bullet Clarity setting, so the toggle takes effect live without a rebuild.
  const chevs = document.createElement('div');
  chevs.className = 'rchevs';
  chevs.innerHTML = '<i></i><i></i><i></i><i></i>';   // up / right / down / left, flaring outward
  el.appendChild(chevs);
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
    // when the deflect rule freezes it. The shared rune by default; an Eternal
    // dragon swaps in its personal sigil via setMarkRune (PR8 cosmetic).
    m.innerHTML = '<div class="fill"></div>' +
      '<svg class="rune" viewBox="0 0 24 24"><path d="' + markRunePath + '"/></svg>';
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
  // PR6 — ASSIST vs STATE: the reticle-off score bonus prices away the AIM
  // ASSIST (the lead squares + dwell fill + pip row), never the game STATE:
  // painted-organ brand MARKS render whenever a fight is live, reticle or not
  // (before this, reticle-off went completely dark while the lock layer kept
  // running — and a mid-fight toggle froze stale marks on screen).
  if (!playing || !wantReticle) {
    el.style.opacity = 0;
    el.classList.remove('boss', 'threat', 'threat-hot', 'lens2'); yieldAmt = 0;
    if (playing && game.inBoss) renderMarks(lockHudState());
    else if (markEls.length && markEls[0].classList.contains('show')) {
      for (const m of markEls) m.classList.remove('show');
    }
    return;
  }

  // THE LANCE layer — the reticle's SECOND job. In a boss there are no rings/gates;
  // instead it wakes on the aim-line organ: it snaps to the focal (so you see WHERE
  // to fly), goes GREEN when a line holds (dwell complete), and shows the ashen
  // "sealed" skin when the target is muted (slot 13) or no organ is up. Pure DOM.
  if (game.inBoss) {
    const L = lockHudState();
    // Bullet Clarity (LENS): the hollow-bracket skin + telegraph/yield cues, toggled live.
    const clarity = lensClarity();
    el.classList.toggle('lens2', clarity);
    if (!L.active) {
      el.style.opacity = 0; el.classList.remove('boss', 'locked', 'aiming', 'snap'); prevLocked = false;
      el.classList.remove('threat', 'threat-hot'); yieldAmt = 0;
      renderMarks(L);   // brand marks are STATE — they track even when no organ leads
      return;
    }
    el.classList.add('boss');
    el.classList.remove('gate');
    tmpV.set(L.x, L.y, L.z).project(camera);
    if (tmpV.z > 1) { el.style.opacity = 0; el.classList.remove('threat', 'threat-hot'); return; }   // organ behind the camera
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
    if (clarity) updateLensCues();
    else { el.classList.remove('threat', 'threat-hot'); yieldAmt = 0; }
    renderPips(L);
    renderMarks(L);
    return;
  }
  el.classList.remove('boss', 'sealed', 'aiming', 'snap');
  // LENS: a boss killed mid-wind-up flips game.inBoss without passing the !L.active
  // cleanup, so clear the threat cues + skin here too or stale chevrons ride the ring reticle.
  el.classList.remove('threat', 'threat-hot', 'lens2'); yieldAmt = 0;
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

// LENS cues (interventions 3a + 3b), boss branch only, ?lens=2. 3a — THREAT YIELD:
// ease the aim chrome's GLOW down while a boss bullet is closing into the player's
// lane, so the reticle politely steps back and the threat is the loudest thing at the
// point of gaze. The lock border and dwell fill are NEVER touched (dimming those would
// read as "lock lost"); only the bloom recedes, eased ~0.25s so it never flickers.
// 3b — TELEGRAPH: drive the four danger chevrons straight off the live boss wind-up so
// "incoming" lands where the eyes already are, blinking in the final instant. Pure
// DOM/CSS-var writes (--yield, --threat) — zero render cost, and inert when the flag is off.
function updateLensCues() {
  const ry = CONFIG.LOCK.reticleYield;
  const th = incomingThreat();
  const want = (ry.tti > 0 && th.minTti < ry.tti) ? 1 : 0;
  yieldAmt += (want - yieldAmt) * 0.16;   // frame-paced ease (~0.25s in/out); visual only
  if (yieldAmt < 0.001) yieldAmt = 0;
  el.style.setProperty('--yield', yieldAmt.toFixed(3));
  const charge = bossCharge01();
  el.style.setProperty('--threat', charge.toFixed(3));
  el.classList.toggle('threat', charge > 0.02);
  el.classList.toggle('threat-hot', charge > 0.82);   // final-instant blink
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
  // PR2 saturation split: marks live under #hud (not #reticle), so the .lens2 skin can't
  // cascade to them — carry it per-mark from the Bullet Clarity setting so their BORDER
  // desaturates to mint-white chrome (the fill + rune stay jade energy).
  const clarity = lensClarity();
  for (let i = 0; i < markEls.length; i++) {
    const m = markEls[i];
    const lk = locks[i];
    if (!lk) { m.classList.remove('show'); continue; }
    _mv.set(lk.x, lk.y, lk.z).project(camera);
    if (_mv.z > 1) { m.classList.remove('show'); continue; }
    const sx = (_mv.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_mv.y * 0.5 + 0.5) * window.innerHeight;
    m.classList.add('show');
    m.classList.toggle('lens2', clarity);
    m.classList.toggle('kindle', lk.life > 0.94);   // the fresh brand's kindle flash
    m.classList.toggle('ashen', !!hud.ashen);
    m.classList.toggle('blink', !!lk.blink);
    m.classList.toggle('stacked', (lk.stacks || 1) > 1);
    m.classList.toggle('ghost', !!lk.ghost);   // §5i.C rung 12: the granted spectral echo pip renders pale/dashed
    m.style.setProperty('--life', Math.max(0, Math.min(1, lk.life)).toFixed(3));
    // Position via CSS vars so the kindle animation (which owns transform for
    // 0.35s) composes with the screen placement instead of fighting it.
    m.style.setProperty('--mx', sx.toFixed(1) + 'px');
    m.style.setProperty('--my', sy.toFixed(1) + 'px');
  }
}
