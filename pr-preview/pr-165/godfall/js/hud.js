// Fight HUD: boss bar with phase notches + stagger sub-bar, hero vitals,
// warp diamonds, the Armiger crest, combo counter, world-projected damage
// numbers, banners, letterbox, boss title card, touch controls and the
// contextual first-fight tutorial toasts. All DOM — crisp at any resolution.

import * as THREE from 'three';
import { CFG } from './config.js';
import { game } from './state.js';
import { combat } from './combat.js';
import { boss } from './boss.js';
import { save, persist } from './save.js';
import { on } from './events.js';
import { input, pressAction, getAxes } from './input.js';
import { WEAPONS } from './gear.js';
import { damp, clamp } from './util.js';

let root = null;
const el = {};
let handlers = {};

const dmgPool = [];
const DMG_POOL = 18;
const _v = new THREE.Vector3();

let bossHpLag = 1;
let bannerTimer = 0;
let hurtFlashT = 0;

function div(cls, parent, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  if (html) d.innerHTML = html;
  (parent || root).appendChild(d);
  return d;
}

export function initHud(h) {
  handlers = h || {};
  root = document.createElement('div');
  root.id = 'hud';
  document.body.appendChild(root);

  // --- Boss bar (top center) ---
  el.bossWrap = div('boss-wrap', root);
  el.bossName = div('boss-name', el.bossWrap, 'LEVIATHAN');
  const bbar = div('boss-bar', el.bossWrap);
  el.bossLag = div('boss-fill lag', bbar);
  el.bossFill = div('boss-fill main', bbar);
  div('boss-notch', bbar).style.left = '65%';
  div('boss-notch', bbar).style.left = '30%';
  const sbar = div('stagger-bar', el.bossWrap);
  el.staggerFill = div('stagger-fill', sbar);

  // --- Hero vitals (bottom left) ---
  el.vitals = div('vitals', root);
  const lvWrap = div('hp-row', el.vitals);
  el.level = div('hero-level', lvWrap, '1');
  const hpw = div('hp-bar', lvWrap);
  el.hpFill = div('hp-fill', hpw);
  el.warpRow = div('warp-row', el.vitals);
  el.warpPips = [];
  for (let i = 0; i < CFG.warpSegments; i++) {
    el.warpPips.push(div('warp-pip', el.warpRow));
  }
  // Armiger crest: tappable when full.
  el.armiger = div('armiger-crest', el.vitals,
    '<svg viewBox="0 0 100 100"><circle class="arm-track" cx="50" cy="50" r="42"/>' +
    '<circle class="arm-arc" cx="50" cy="50" r="42"/></svg><span class="arm-label">ARMIGER</span>');
  el.armArc = el.armiger.querySelector('.arm-arc');
  el.armiger.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressAction('armiger');
  });

  // --- Combo (right) ---
  el.combo = div('combo', root, '<span class="combo-n">0</span><span class="combo-tag">HITS</span>');
  el.comboN = el.combo.querySelector('.combo-n');

  // --- Weapon chip ---
  el.weapon = div('weapon-chip', root, '');
  el.weapon.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressAction('cycle', { step: 1 });
  });

  // --- Banners / titles / toasts ---
  el.banner = div('banner', root);
  el.bossTitle = div('boss-title', root,
    '<div class="bt-rule"></div><div class="bt-name"></div><div class="bt-sub"></div><div class="bt-rule"></div>');
  el.toast = div('tutorial-toast', root);
  el.chase = div('chase-prompt', root, 'CHASE — WARP!');

  // --- Letterbox + hurt vignette ---
  el.letterTop = div('letterbox top', root);
  el.letterBot = div('letterbox bottom', root);
  el.hurt = div('hurt-vignette', root);

  // --- Pause button ---
  el.pause = div('pause-btn', root, '<span></span><span></span>');
  el.pause.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (handlers.onPause) handlers.onPause();
  });

  // --- Touch buttons (shown when touch is used) ---
  el.touch = div('touch-cluster', root);
  const mkBtn = (cls, label) => {
    const b = div('touch-btn ' + cls, el.touch, `<span>${label}</span>`);
    return b;
  };
  const atk = mkBtn('atk', 'ATTACK');
  const dod = mkBtn('dod', 'DODGE');
  const wrp = mkBtn('wrp', 'WARP');
  // Attack press = attack; hold ≥260ms = warp.
  let holdTimer = 0;
  let holdFired = false;
  atk.addEventListener('touchstart', (e) => {
    e.preventDefault();
    holdFired = false;
    holdTimer = setTimeout(() => { holdFired = true; pressAction('warp'); }, 260);
  }, { passive: false });
  atk.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(holdTimer);
    if (!holdFired) pressAction('attack');
  }, { passive: false });
  for (const [btn, action] of [[dod, 'dodge'], [wrp, 'warp']]) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      pressAction(action);
    }, { passive: false });
  }

  // --- Damage numbers pool ---
  for (let i = 0; i < DMG_POOL; i++) {
    const d = div('dmg-num', root);
    dmgPool.push({ el: d, life: 0, world: new THREE.Vector3(), vy: 0 });
  }

  wireEvents();
  setFightVisible(false);
  return root;
}

function wireEvents() {
  on('damageNumber', ({ pos, amount, weak, warp }) => {
    let slot = dmgPool.find((s) => s.life <= 0);
    if (!slot) slot = dmgPool[0];
    slot.life = 0.9;
    slot.world.copy(pos);
    slot.vy = 0;
    slot.el.textContent = amount;
    slot.el.className = 'dmg-num show' + (weak ? ' weak' : '') + (warp ? ' warp' : '');
  });

  on('banner', ({ text, heavy, gold }) => {
    el.banner.textContent = text;
    el.banner.className = 'banner show' + (heavy ? ' heavy' : '') + (gold ? ' gold' : '');
    bannerTimer = 2.1;
  });

  on('bossTitle', ({ name, title, show }) => {
    if (show) {
      el.bossTitle.querySelector('.bt-name').textContent = name;
      el.bossTitle.querySelector('.bt-sub').textContent = title;
      el.bossTitle.classList.add('show');
    } else {
      el.bossTitle.classList.remove('show');
    }
  });

  on('letterbox', ({ on: isOn }) => {
    root.classList.toggle('cine', isOn);
  });

  on('heroHurt', () => { hurtFlashT = 0.5; });

  on('weaponChanged', () => refreshWeaponChip());

  on('traversalStart', () => el.chase.classList.add('show'));
  on('traversalEnd', () => el.chase.classList.remove('show'));

  on('armigerReady', () => {
    el.armiger.classList.add('ready');
    showToast('armiger', 'ARMIGER READY — F · or tap the crest');
  });
  on('armigerOn', () => {
    el.armiger.classList.remove('ready');
    clearToast('armiger');
    if (!save.flags.tutArmiger) { save.flags.tutArmiger = true; persist(); }
  });

  // Tutorial completion hooks
  on('dodged', () => {
    if (!save.flags.tutDodge) { save.flags.tutDodge = true; persist(); }
    clearToast('dodge');
  });
  on('bossAttack', () => {
    if (!save.flags.tutDodge) showToast('dodge', 'DODGE through the glow — SHIFT · K · swipe');
  });
}

// --- Tutorial toasts -----------------------------------------------------------

let toastId = '';
let moveAccum = 0;

function showToast(id, text) {
  if (toastId === id) return;
  toastId = id;
  el.toast.textContent = text;
  el.toast.classList.add('show');
}

function clearToast(id) {
  if (toastId !== id) return;
  toastId = '';
  el.toast.classList.remove('show');
}

// --- Per-frame -------------------------------------------------------------------

export function setFightVisible(v) {
  root.classList.toggle('in-fight', v);
  if (v) {
    el.bossName.textContent = boss.def ? boss.def.name : '';
    bossHpLag = 1;
    refreshWeaponChip();
    el.level.textContent = save.level;
  }
}

function refreshWeaponChip() {
  const def = WEAPONS[combat.weaponId];
  if (!def) return;
  const tier = combat.weaponTier;
  el.weapon.innerHTML =
    `<span class="wc-name">${def.label}</span><span class="wc-pips">${'◆'.repeat(tier)}${'◇'.repeat(3 - tier)}</span>`;
    el.weapon.style.setProperty('--wc-color', '#' + def.color.toString(16).padStart(6, '0'));
}

export function updateHud(rawDt, camera) {
  if (!root.classList.contains('in-fight')) return;

  // Boss bar: instant fill + lagging white ghost.
  const frac = boss.hpMax > 0 ? boss.hp / boss.hpMax : 0;
  bossHpLag = Math.max(frac, damp(bossHpLag, frac, 3, rawDt));
  el.bossFill.style.width = (frac * 100).toFixed(2) + '%';
  el.bossLag.style.width = (bossHpLag * 100).toFixed(2) + '%';
  const sFrac = boss.state === 'staggered'
    ? boss.staggeredT / boss.def.stagger.duration
    : boss.stagger / boss.staggerMax;
  el.staggerFill.style.width = (clamp(sFrac, 0, 1) * 100).toFixed(2) + '%';
  el.staggerFill.classList.toggle('broken', boss.state === 'staggered');

  // Hero vitals
  el.hpFill.style.width = ((combat.hp / combat.hpMax) * 100).toFixed(2) + '%';
  el.hpFill.classList.toggle('low', combat.hp / combat.hpMax < 0.3);
  for (let i = 0; i < el.warpPips.length; i++) {
    const p = el.warpPips[i];
    const have = combat.warp >= i + 1;
    const partial = !have && combat.warp > i;
    p.className = 'warp-pip' + (have ? ' full' : partial ? ' charging' : '');
  }
  const armFrac = combat.armigerActive
    ? combat.armigerT / CFG.armigerDuration
    : combat.armiger / CFG.armigerMax;
  const C = 2 * Math.PI * 42;
  el.armArc.style.strokeDasharray = `${C}`;
  el.armArc.style.strokeDashoffset = `${C * (1 - clamp(armFrac, 0, 1))}`;
  el.armiger.classList.toggle('active', combat.armigerActive);

  // Combo
  if (combat.combo > 1) {
    el.combo.classList.add('show');
    el.comboN.textContent = combat.combo;
    const tier = combat.combo >= 30 ? 3 : combat.combo >= 15 ? 2 : combat.combo >= 6 ? 1 : 0;
    el.combo.dataset.tier = tier;
  } else {
    el.combo.classList.remove('show');
  }

  // Banner decay
  if (bannerTimer > 0) {
    bannerTimer -= rawDt;
    if (bannerTimer <= 0) el.banner.classList.remove('show');
  }

  // Hurt vignette
  if (hurtFlashT > 0) {
    hurtFlashT -= rawDt;
    el.hurt.style.opacity = Math.max(0, hurtFlashT / 0.5) * 0.85;
  } else {
    el.hurt.style.opacity = 0;
  }

  // Damage numbers: project world → screen.
  const w = window.innerWidth, h = window.innerHeight;
  for (const s of dmgPool) {
    if (s.life <= 0) continue;
    s.life -= rawDt;
    if (s.life <= 0) { s.el.className = 'dmg-num'; continue; }
    s.vy += rawDt * 36;
    _v.copy(s.world);
    _v.project(camera);
    if (_v.z > 1) { s.el.style.opacity = 0; continue; }
    const x = (_v.x * 0.5 + 0.5) * w;
    const y = (-_v.y * 0.5 + 0.5) * h - s.vy;
    s.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    s.el.style.opacity = Math.min(1, s.life / 0.3);
  }

  // Touch cluster appears once touch is in use.
  el.touch.classList.toggle('show', input.usingTouch);
  el.pause.classList.add('show');

  // Move tutorial: clears after a second of real steering.
  if (!save.flags.tutMove) {
    showToast('move', 'ORBIT THE GOD — WASD · ARROWS · drag');
    const a = getAxes();
    if (Math.abs(a.x) + Math.abs(a.y) > 0.3) {
      moveAccum += rawDt;
      if (moveAccum > 1.2) {
        save.flags.tutMove = true;
        persist();
        clearToast('move');
      }
    }
  } else if (!save.flags.tutWarp && combat.warpSegs >= CFG.warpSegments && game.time > 10) {
    showToast('warp', 'WARP-STRIKE the sigils — E · L · hold ATTACK');
    if (game.warpStrikes > 0) {
      save.flags.tutWarp = true;
      persist();
      clearToast('warp');
    }
  }
}
