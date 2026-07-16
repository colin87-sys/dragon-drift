import * as THREE from 'three';
import { on } from './events.js';
import { BOSSES } from './bossDefs.js';
import { bossWorldPos, bossCharge01 } from './boss.js';
import { lockHudState } from './lockLayer.js';

// EMBERSIGHT H5 — THE MEWS PLATE (HUD-REDESIGN.md §B.9): the DOM boss health bar,
// the ONE HP authority. It subscribes to the EXISTING emit('bossHit',{hp,hpMax,frac})
// seam (boss.js) plus bossStart/bossReveal/bossEnd/bossFormRefill — no new WebGL bar.
//
// The bar: 1px hairline housing, a 5px magenta-warm fill (transform:scaleX — rule d,
// never width) with a drain-lag GOLD chunk behind it (500ms delay, ~400ms drain),
// phase notches inherited from def.phases[].atFrac, a nameplate whose type ramp
// mirrors the protected title card (name --fs-title Russo caps + epithet --fs-micro),
// and a housing that ETCHES in stroke-by-stroke (the hud-sew grammar) synced to the
// title card. formLifebars refill = a deliberate left→right re-forge shimmer (reads
// "new bar", never healing). Off-screen threat chevrons (pool of 4) ride the screen
// edge at the boss's projected bearing, alpha off bossCharge01(). The DLZ column is
// STRICTLY behind ?dlz=1 (a cut-first luxury), off by default.
//
// LANCE RULING (owner): the lance lock-pips + rune brand-marks stay AT THE RETICLE /
// point of aim (reticle.js) — the plate carries HP + phases only, never a duplicate
// lock read. The DLZ strip is the sole, flag-gated exception.

// ?dlz=1 → the small lock-summary strip renders (off otherwise; never without the flag).
const DLZ_ON = (() => {
  try { return /[?&]dlz=1(?:&|$)/.test(window.location.search); } catch { return false; }
})();

let camera = null;
let plate = null, titleEl = null, epithetEl = null, fillEl = null, drainEl = null,
    notchesEl = null, dlzEl = null;
let chevs = [];

let curFrac = 1;         // target hp fraction (from bossHit)
let drainVal = 1;        // eased drain-lag chunk (gold), lags curFrac
let drainHitAt = -Infinity;  // when the drain lag was ARMED (first hit of a burst)
let lastEaseAt = 0;      // updateBossBar clock — time-based ease, never per-frame
let active = false;      // a fight body is on screen (plate shown)
const _wp = new THREE.Vector3();

const CHEV_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L21 20 H3 Z"/></svg>';

export function initBossBar(cam) {
  camera = cam;
  const hud = document.getElementById('hud');
  if (!hud) return;
  plate = document.createElement('div');
  plate.className = 'mews-plate' + (DLZ_ON ? ' dlz' : '');
  plate.id = 'mews-plate';
  // The etched housing outline is a rounded-rect perimeter path (pathLength 100,
  // non-scaling stroke so the 1px hairline survives the preserveAspectRatio stretch).
  plate.innerHTML =
    '<div class="mp-name"><span class="mp-title" id="mp-title"></span>' +
      '<span class="mp-epithet" id="mp-epithet"></span></div>' +
    '<div class="mp-bar">' +
      '<i class="mp-drain" id="mp-drain"></i>' +
      '<i class="mp-fill" id="mp-fill"></i>' +
      '<div class="mp-notches" id="mp-notches"></div>' +
      '<div class="mp-dlz" id="mp-dlz"></div>' +
      '<svg class="mp-etch" viewBox="0 0 100 7" preserveAspectRatio="none">' +
        '<path pathLength="100" vector-effect="non-scaling-stroke" ' +
        'd="M2 0.6 H98 A1.6 1.6 0 0 1 99.4 2 V5 A1.6 1.6 0 0 1 98 6.4 H2 ' +
        'A1.6 1.6 0 0 1 0.6 5 V2 A1.6 1.6 0 0 1 2 0.6 Z"/>' +
      '</svg>' +
    '</div>';
  hud.appendChild(plate);
  titleEl = plate.querySelector('#mp-title');
  epithetEl = plate.querySelector('#mp-epithet');
  fillEl = plate.querySelector('#mp-fill');
  drainEl = plate.querySelector('#mp-drain');
  notchesEl = plate.querySelector('#mp-notches');
  dlzEl = plate.querySelector('#mp-dlz');

  // Off-screen threat chevron pool (§B.9): translate3d + rotate, transform-only.
  chevs = [];
  for (let i = 0; i < 4; i++) {
    const c = document.createElement('div');
    c.className = 'mp-chev';
    c.innerHTML = CHEV_SVG;
    hud.appendChild(c);
    chevs.push(c);
  }

  on('bossStart', (p) => prep(p && p.id));
  on('bossReveal', (p) => reveal(p && p.id));
  on('bossHit', (p) => onHit(p));
  on('bossFormRefill', (p) => onFormRefill(p));
  on('bossEnd', () => retire());
  on('bossFelledRevive', (p) => { if (p) { setFrac(p.frac ?? curFrac, true); } });
  on('runStart', () => retire());
}

// bossStart (approach): build the nameplate + phase notches, hidden. The etch-in
// waits for the reveal beat so it lands ON the title card, not during the approach.
function prep(id) {
  if (!plate) return;
  const def = id && BOSSES[id];
  if (!def) return;
  titleEl.textContent = def.name || '';
  epithetEl.textContent = def.epithet || '';
  // Magenta-warm role hue, but tint the plate accent toward the boss's own accent so
  // the nameplate reads as HERS (role stays magenta; this only warms the glow).
  buildNotches(def.phases || []);
  curFrac = 1; drainVal = 1; drainHitAt = -Infinity;
  fillEl.style.transform = 'scaleX(1)';
  drainEl.style.transform = 'scaleX(1)';
  plate.classList.remove('show', 'etch', 'reforge');
  active = false;
}

function buildNotches(phases) {
  notchesEl.innerHTML = '';
  for (const p of phases) {
    if (!(p.atFrac > 0.001 && p.atFrac < 0.999)) continue;   // full-hp isn't a divider
    const n = document.createElement('i');
    n.style.left = (p.atFrac * 100).toFixed(2) + '%';
    notchesEl.appendChild(n);
  }
}

// bossReveal (fight start, synced to the title card): show + etch the housing in.
function reveal(id) {
  if (!plate) return;
  if (id && BOSSES[id] && titleEl.textContent !== (BOSSES[id].name || '')) prep(id);
  active = true;
  plate.classList.add('show');
  plate.classList.remove('etch');
  void plate.offsetWidth;      // restart the one-shot draw-on
  plate.classList.add('etch');
}

function onHit(p) {
  if (!p || !plate) return;
  if (!active) { active = true; plate.classList.add('show'); }
  setFrac(typeof p.frac === 'number' ? p.frac : (p.hpMax ? p.hp / p.hpMax : curFrac), false);
}

// A multi-form boss's bar refills to full for the next form — a DELIBERATE re-forge
// shimmer (reads "new bar", never healing), never the drain-lag path.
function onFormRefill() {
  if (!plate) return;
  curFrac = 1; drainVal = 1; drainHitAt = -Infinity;
  fillEl.style.transform = 'scaleX(1)';
  drainEl.style.transform = 'scaleX(1)';
  plate.classList.remove('reforge');
  void plate.offsetWidth;
  plate.classList.add('reforge');
}

function setFrac(frac, snapDrain) {
  frac = Math.max(0, Math.min(1, frac));
  // Damage arms the drain lag — but only when the drain chunk is SETTLED. Re-arming
  // on every tick meant sustained lance DPS (hits < 500ms apart) froze the chunk at
  // the burst's START fraction forever: a giant stale gold slab that read as a
  // rendering glitch (owner screenshot, VOIDMAW). Armed once per burst, the chunk
  // waits 500ms then chases the live fill continuously — "recently lost health".
  if (frac < curFrac - 0.0001 && drainVal <= curFrac + 0.002) drainHitAt = performance.now();
  curFrac = frac;
  fillEl.style.transform = 'scaleX(' + frac.toFixed(4) + ')';
  if (snapDrain || frac > drainVal) { drainVal = frac; drainEl.style.transform = 'scaleX(' + frac.toFixed(4) + ')'; }
}

function retire() {
  if (!plate) return;
  active = false;
  plate.classList.remove('show', 'etch', 'reforge');
  for (const c of chevs) c.style.opacity = 0;
}

// Called per-frame from the main loop (after updateReticle). Eases the drain-lag
// chunk and drives the off-screen threat chevrons. No-ops when no fight is live.
export function updateBossBar() {
  if (!plate || !active) { lastEaseAt = 0; return; }
  const now = performance.now();
  const dt = lastEaseAt ? Math.min(0.1, (now - lastEaseAt) / 1000) : 0.016;
  lastEaseAt = now;
  // Drain-lag gold chunk: waits ~500ms after the (first) hit, then eases toward
  // curFrac. Time-based ease (~8/s ≈ the old 0.14/frame at 60fps) so the chunk
  // never lags extra on a slow frame rate.
  if (drainVal > curFrac + 0.001) {
    if (now - drainHitAt > 500) {
      drainVal += (curFrac - drainVal) * (1 - Math.exp(-8 * dt));
      if (drainVal - curFrac < 0.002) drainVal = curFrac;
      drainEl.style.transform = 'scaleX(' + drainVal.toFixed(4) + ')';
    }
  }
  if (DLZ_ON) updateDlz();
  updateChevrons();
}

// The DLZ strip (§B.9, ?dlz=1 ONLY): banked pips / cap as cells, ashen while sealed.
let dlzCap = -1;
function updateDlz() {
  const L = lockHudState();
  const cap = L.cap || 0;
  if (cap !== dlzCap) {
    dlzCap = cap;
    dlzEl.innerHTML = '';
    for (let i = 0; i < cap; i++) dlzEl.appendChild(document.createElement('i'));
  }
  const pips = L.pips || 0;
  const cells = dlzEl.children;
  for (let i = 0; i < cells.length; i++) {
    cells[i].classList.toggle('f', i < pips);
    cells[i].classList.toggle('ashen', i < pips && !!L.ashen);
  }
}

// Off-screen threat chevrons: project the boss; when she's outside the frustum a
// stroked chevron rides the screen edge at her bearing, alpha off bossCharge01().
function updateChevrons() {
  if (!camera || !bossWorldPos(_wp)) { for (const c of chevs) c.style.opacity = 0; return; }
  _wp.project(camera);
  const behind = _wp.z > 1;
  const off = behind || _wp.x < -1 || _wp.x > 1 || _wp.y < -1 || _wp.y > 1;
  const chev = chevs[0];
  if (!off) { chev.style.opacity = 0; return; }
  // Bearing from screen centre to the (clamped) projected point; behind-camera
  // flips the sign so the arrow points back toward her, not away.
  let nx = _wp.x, ny = _wp.y;
  if (behind) { nx = -nx; ny = -ny; }
  const ang = Math.atan2(ny, nx);   // NDC angle (y up)
  const W = window.innerWidth, H = window.innerHeight;
  const mx = 22, my = 22;           // inset from the edge
  // Intersect the bearing ray with the padded viewport rectangle.
  const hx = W / 2 - mx, hy = H / 2 - my;
  const dx = Math.cos(ang), dy = -Math.sin(ang);   // screen y is down
  const tx = dx !== 0 ? hx / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? hy / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  const sx = W / 2 + dx * t, sy = H / 2 + dy * t;
  const charge = bossCharge01();
  chev.style.opacity = (0.35 + 0.6 * charge).toFixed(3);
  // Point the triangle outward (its default apex points up = -90°).
  chev.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) rotate(' +
    (Math.atan2(dy, dx) * 180 / Math.PI + 90).toFixed(1) + 'deg)';
  for (let i = 1; i < chevs.length; i++) chevs[i].style.opacity = 0;
}
