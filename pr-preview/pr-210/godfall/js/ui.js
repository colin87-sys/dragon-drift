// Screens: home (boss select), arsenal (shop), settings, results, death,
// pause. DOM built once where possible, refreshed on show. The live 3D
// showcase always runs behind; screens are glass panels over it.

import { save, persist, grantXp, addRelics, bossUnlocked, BOSS_ORDER } from './save.js';
import { xpToNext, CFG } from './config.js';
import { WEAPONS, WEAPON_ORDER, ARMOR_SETS, ARMOR_SLOTS } from './gear.js';
import { sfx, setMusicVolume, setSfxVolume, toggleMusicMute, toggleSfxMute, buzz } from './sfx.js';
import { attachPreview, clearPreviews } from './preview.js';
import { game, scoreFight } from './state.js';

let root = null;
let H = {};          // handlers
let BOSSES = [];     // defs in order
let selectedBoss = 'leviathan';
let shopBack = 'home';
let settingsBack = 'home';
const el = {};

const TIPS = {
  waterBolts: 'The bolts land on the marks — move the moment they lock.',
  waterBoltsFan: 'Five locks, five bolts. Drift sideways through the gaps.',
  biteLunge: 'The bite follows the heavy horn. Dodge as the ring closes.',
  biteFeint: 'The feint bites twice. Hold your second dodge.',
  coilSweep: 'Sweeps own a whole height band — change floors or dodge through it.',
  coilSweepDouble: 'Low sweep, then high. Move opposite each one.',
  whirlpool: 'The whirlpool drowns the low band. Climb.',
  tidalWave: 'Get ABOVE the wave — warping up is fastest.',
  armSlam: 'After the fist lands, a shockwave floods the floor. Be airborne.',
  doubleSlam: 'Two fists, then the shockwave. Save a dodge for the floor.',
  boulderThrow: 'Boulders fly to the marks. Strafe between locks.',
  boulderVolley: 'A full volley — keep moving one direction, never stop.',
  quakeRow: 'The strata ripple low, then mid. Slip between rows.',
  gaiasWrath: 'One slice of sky stays calm. Find it before the mountain falls.',
  boltStrikes: 'Lightning stalks your footprints — never stand still.',
  boltBarrage: 'The storm leads its shots. Zig, then zag.',
  chainOrbs: 'The orbs are slow. Thread them, don’t outrun them.',
  staffSweep: 'The beam saws at one height. Change floors.',
  boltRing: 'Thirds of the ring fire in order. Stand in the silent third.',
  judgmentBolt: 'Judgment spares the low road. Dive.',
  bladeFan: 'Blades fan toward you — slide sideways, not back.',
  bladeStorm: 'Seven blades. Commit to one direction and keep orbiting.',
  beamSweep: 'The beam hunts your height, not your position.',
  crossArcs: 'Two bands cross. The safe pocket is diagonal to both.',
  blinkStrike: 'When the god vanishes it is already on you. Dodge on the horn.',
  megaflare: 'Two gaps in the ring of fire. Be inside one when it sings.',
};

function div(cls, parent, html = '') {
  const d = document.createElement('div');
  d.className = cls;
  if (html) d.innerHTML = html;
  parent.appendChild(d);
  return d;
}

function btn(cls, parent, html, fn) {
  const b = document.createElement('button');
  b.className = cls;
  b.innerHTML = html;
  b.addEventListener('pointerdown', (e) => e.stopPropagation());
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.uiTick();
    buzz(8);
    fn(e);
  });
  parent.appendChild(b);
  return b;
}

export const ui = {
  init(handlers) {
    H = handlers;
    BOSSES = handlers.bosses;
    root = document.createElement('div');
    root.id = 'screens';
    document.body.appendChild(root);
    buildHome();
    buildShop();
    buildSettings();
    buildResults();
    buildDeath();
    buildPause();
    return root;
  },

  get selectedBoss() { return selectedBoss; },

  show(name) {
    for (const k of ['home', 'shop', 'settings', 'results', 'death', 'pause']) {
      el[k].classList.toggle('show', k === name);
    }
    if (name !== 'shop') clearPreviews();
    if (name === 'home') refreshHome();
    if (name === 'shop') refreshShop();
    if (name === 'settings') refreshSettings();
  },

  hideAll() {
    for (const k of ['home', 'shop', 'settings', 'results', 'death', 'pause']) {
      el[k].classList.remove('show');
    }
    clearPreviews();
  },

  openShop(back) {
    shopBack = back;
    this.show('shop');
  },

  openSettings(back) {
    settingsBack = back;
    this.show('settings');
  },

  showResults: showResults,
  showDeath: showDeath,
};

// --- Home -----------------------------------------------------------------------

function buildHome() {
  const s = div('screen home', root);
  el.home = s;
  div('logo', s, '<span class="logo-god">GODFALL</span><span class="logo-rush">RUSH</span><div class="logo-sub">TRIALS OF THE GODS</div>');
  el.bossRow = div('boss-row', s);
  const meta = div('home-meta', s);
  el.homeLevel = div('chip', meta);
  el.homeRelics = div('chip relics', meta);
  el.homeXp = div('xp-rail', meta, '<div class="xp-fill"></div>');
  const row = div('home-actions', s);
  el.fightBtn = btn('big-btn fight', row, 'FIGHT', () => H.onFight(selectedBoss));
  btn('big-btn', row, 'ARSENAL', () => ui.openShop('home'));
  btn('big-btn ghost', row, 'SETTINGS', () => ui.openSettings('home'));
  div('hint-keys', s, 'WASD move · J attack · K dodge · L warp · Q weapon · F armiger');
}

function refreshHome() {
  el.homeLevel.textContent = 'LV ' + save.level;
  el.homeRelics.textContent = '⬡ ' + save.relics;
  el.homeXp.querySelector('.xp-fill').style.width =
    Math.min(100, (save.xp / xpToNext(save.level)) * 100) + '%';

  el.bossRow.innerHTML = '';
  for (const def of BOSSES) {
    const unlocked = bossUnlocked(def.id);
    const slot = save.bosses[def.id];
    const card = div('boss-card' + (unlocked ? '' : ' locked') + (def.id === selectedBoss ? ' selected' : ''), el.bossRow);
    card.style.setProperty('--accent', '#' + def.accentColor.toString(16).padStart(6, '0'));
    const medals = `
      <div class="medals">
        <span class="medal ${slot.medals.clear ? 'got' : ''}" title="First clear">✦</span>
        <span class="medal ${slot.medals.swift ? 'got' : ''}" title="Sub 4:00">⏱</span>
        <span class="medal ${slot.medals.sRank ? 'got' : ''}" title="S rank">S</span>
      </div>`;
    const best = slot.bestRank
      ? `<div class="bc-best">BEST ${slot.bestRank} · ${fmtTime(slot.bestTime)}</div>`
      : '<div class="bc-best">UNTESTED</div>';
    const prev = BOSS_ORDER[BOSS_ORDER.indexOf(def.id) - 1];
    card.innerHTML = unlocked
      ? `<div class="bc-name">${def.name}</div><div class="bc-title">${def.title}</div>${best}${medals}`
      : `<div class="bc-name">${def.name}</div><div class="bc-title">SEALED</div><div class="bc-best">Defeat ${prev ? prev.toUpperCase() : ''}</div>`;
    if (unlocked) {
      card.addEventListener('click', () => {
        if (selectedBoss !== def.id) {
          selectedBoss = def.id;
          sfx.uiMove();
          refreshHome();
          if (H.onSelectBoss) H.onSelectBoss(def.id);
        } else {
          H.onFight(def.id);
        }
      });
    }
  }
  el.fightBtn.textContent = 'FIGHT ' + (BOSSES.find((b) => b.id === selectedBoss)?.name || '');
}

function fmtTime(t) {
  if (!t) return '—';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Shop -----------------------------------------------------------------------

function buildShop() {
  const s = div('screen shop', root);
  el.shop = s;
  const head = div('panel-head', s);
  btn('back-btn', head, '‹ BACK', () => ui.show(shopBack));
  div('panel-title', head, 'ARSENAL');
  el.shopRelics = div('chip relics', head);
  const tabs = div('tabs', s);
  el.tabWeapons = btn('tab on', tabs, 'WEAPONS', () => setShopTab('weapons'));
  el.tabArmor = btn('tab', tabs, 'ARMOR', () => setShopTab('armor'));
  el.shopGrid = div('card-grid', s);
  el.shopTab = 'weapons';
}

function setShopTab(t) {
  el.shopTab = t;
  el.tabWeapons.classList.toggle('on', t === 'weapons');
  el.tabArmor.classList.toggle('on', t === 'armor');
  refreshShop();
}

function refreshShop() {
  el.shopRelics.textContent = '⬡ ' + save.relics;
  clearPreviews();
  el.shopGrid.innerHTML = '';
  if (el.shopTab === 'weapons') buildWeaponCards();
  else buildArmorCards();
}

function buildWeaponCards() {
  for (const id of WEAPON_ORDER) {
    const def = WEAPONS[id];
    const owned = save.gear.weapons[id] || 0;
    const equipped = save.gear.equippedWeapon === id;
    const card = div('card', el.shopGrid);
    card.style.setProperty('--accent', '#' + def.color.toString(16).padStart(6, '0'));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 160;
    canvas.className = 'card-canvas';
    card.appendChild(canvas);
    attachPreview(canvas, { weapon: id, tier: Math.max(owned, 1) });

    const tier = Math.max(owned, 1);
    const tDef = def.tiers[tier - 1];
    div('card-name', card, owned ? tDef.name : def.label);
    div('card-desc', card, def.desc);
    const stats = div('card-stats', card);
    statBar(stats, 'PWR', tDef.power / 30);
    statBar(stats, 'SPD', def.speed / 1.6);
    statBar(stats, 'STG', def.staggerMult / 1.8);
    div('card-pips', card, '◆'.repeat(owned) + '◇'.repeat(Math.max(0, 3 - owned)));

    if (!owned) {
      buyBtn(card, `UNLOCK · ⬡${def.unlockPrice}`, def.unlockPrice, () => {
        save.gear.weapons[id] = 1;
        save.gear.equippedWeapon = id;
      });
    } else {
      if (owned < 3) {
        const price = def.tiers[owned].price;
        buyBtn(card, `FORGE ${def.tiers[owned].name} · ⬡${price}`, price, () => {
          save.gear.weapons[id] = owned + 1;
        });
      }
      if (equipped) div('equipped-tag', card, 'EQUIPPED');
      else btn('card-btn', card, 'EQUIP', () => {
        save.gear.equippedWeapon = id;
        persist();
        sfx.uiEquip();
        H.onEquipChanged();
        refreshShop();
      });
    }
  }
}

function buildArmorCards() {
  for (const setId of ['drifter', 'bulwark', 'aegis']) {
    const set = ARMOR_SETS[setId];
    const card = div('card armor', el.shopGrid);
    card.style.setProperty('--accent', '#' + set.palette.glow.toString(16).padStart(6, '0'));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 160;
    canvas.className = 'card-canvas';
    card.appendChild(canvas);
    attachPreview(canvas, { armorSet: setId });
    div('card-name', card, set.name);
    div('card-desc', card, set.desc);

    const slots = div('slot-row', card);
    let ownedCount = 0;
    for (const slot of ARMOR_SLOTS) {
      const key = `${setId}:${slot}`;
      const owned = save.gear.armorOwned.includes(key);
      const equipped = save.gear.armorEquipped[slot] === setId;
      if (owned) ownedCount++;
      const sb = btn('slot-btn' + (equipped ? ' on' : owned ? ' owned' : ''), slots,
        slotLabel(slot) + (owned ? '' : `<small>⬡${set.piecePrice}</small>`), () => {
          if (!owned) {
            if (save.relics < set.piecePrice) { sfx.uiDeny(); return; }
            addRelics(-set.piecePrice);
            save.gear.armorOwned.push(key);
            sfx.uiBuy();
            buzz(20);
          }
          save.gear.armorEquipped[slot] = setId;
          persist();
          sfx.uiEquip();
          H.onEquipChanged();
          refreshShop();
        });
      sb.title = slot;
    }
    if (ownedCount === 4) {
      btn('card-btn', card, 'EQUIP FULL SET', () => {
        for (const slot of ARMOR_SLOTS) save.gear.armorEquipped[slot] = setId;
        persist();
        sfx.uiEquip();
        H.onEquipChanged();
        refreshShop();
      });
    }
    const allOn = ARMOR_SLOTS.every((sl) => save.gear.armorEquipped[sl] === setId);
    if (allOn && set.setBonus) div('equipped-tag', card, 'SET BONUS · ' + set.setBonus.label);
  }
}

function slotLabel(slot) {
  return { helm: 'HELM', chest: 'CHEST', gauntlets: 'ARMS', greaves: 'LEGS' }[slot];
}

function statBar(parent, label, frac) {
  const row = div('stat-row', parent);
  div('stat-label', row, label);
  const bar = div('stat-bar', row);
  div('stat-fill', bar).style.width = Math.min(100, frac * 100) + '%';
}

function buyBtn(card, label, price, apply) {
  const afford = save.relics >= price;
  const b = btn('card-btn buy' + (afford ? '' : ' poor'), card, label, () => {
    if (save.relics < price) { sfx.uiDeny(); return; }
    addRelics(-price);
    apply();
    persist();
    sfx.uiBuy();
    buzz(25);
    H.onEquipChanged();
    refreshShop();
  });
  return b;
}

// --- Settings --------------------------------------------------------------------

function buildSettings() {
  const s = div('screen settings', root);
  el.settings = s;
  const head = div('panel-head', s);
  btn('back-btn', head, '‹ BACK', () => ui.show(settingsBack));
  div('panel-title', head, 'SETTINGS');
  const body = div('settings-body', s);

  const audio = div('set-group', body, '<h3>AUDIO</h3>');
  el.musicMute = btn('set-btn', audio, '', () => { toggleMusicMute(); refreshSettings(); });
  el.musicVol = slider(audio, (v) => setMusicVolume(v));
  el.sfxMute = btn('set-btn', audio, '', () => { toggleSfxMute(); refreshSettings(); });
  el.sfxVol = slider(audio, (v) => setSfxVolume(v));

  const gfx = div('set-group', body, '<h3>GRAPHICS</h3>');
  const qrow = div('seg-row', gfx);
  el.qualityBtns = [];
  [['AUTO', null], ['HIGH', 0], ['MED', 1], ['LOW', 2]].forEach(([label, v]) => {
    el.qualityBtns.push(btn('seg-btn', qrow, label, () => {
      save.settings.qualityOverride = v;
      persist();
      H.onQualityChange(v);
      refreshSettings();
    }));
  });
  el.shakeBtn = btn('set-btn', gfx, '', () => {
    save.settings.screenShake = !save.settings.screenShake;
    persist();
    refreshSettings();
  });

  const feel = div('set-group', body, '<h3>FEEL</h3>');
  el.hapticsBtn = btn('set-btn', feel, '', () => {
    save.settings.haptics = !save.settings.haptics;
    persist();
    buzz(20);
    refreshSettings();
  });

  const danger = div('set-group', body, '<h3>DATA</h3>');
  let armed = false;
  el.resetBtn = btn('set-btn danger', danger, 'RESET ALL PROGRESS', () => {
    if (!armed) {
      armed = true;
      el.resetBtn.textContent = 'TAP AGAIN TO ERASE EVERYTHING';
      setTimeout(() => { armed = false; el.resetBtn.textContent = 'RESET ALL PROGRESS'; }, 2500);
      return;
    }
    try { localStorage.removeItem('godfallSave'); } catch { /* fine */ }
    location.reload();
  });
}

function slider(parent, onInput) {
  const wrap = div('slider-wrap', parent);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0; input.max = 100; input.value = 100;
  input.addEventListener('input', () => onInput(input.value / 100));
  wrap.appendChild(input);
  return input;
}

function refreshSettings() {
  el.musicMute.textContent = 'MUSIC · ' + (save.audio.musicMuted ? 'OFF' : 'ON');
  el.sfxMute.textContent = 'SFX · ' + (save.audio.sfxMuted ? 'OFF' : 'ON');
  el.musicVol.value = save.audio.musicVol * 100;
  el.sfxVol.value = save.audio.sfxVol * 100;
  const q = save.settings.qualityOverride;
  el.qualityBtns.forEach((b, i) => {
    const v = [null, 0, 1, 2][i];
    b.classList.toggle('on', v === q);
  });
  el.shakeBtn.textContent = 'SCREEN SHAKE · ' + (save.settings.screenShake ? 'ON' : 'OFF');
  el.hapticsBtn.textContent = 'HAPTICS · ' + (save.settings.haptics ? 'ON' : 'OFF');
}

// --- Results -------------------------------------------------------------------------

function buildResults() {
  const s = div('screen results', root);
  el.results = s;
  div('res-godfall', s, 'GODFALL');
  el.resBossName = div('res-boss', s);
  el.rankWrap = div('rank-wrap', s, '<div class="rank-letter">S</div>');
  el.rankLetter = el.rankWrap.querySelector('.rank-letter');
  el.resRows = div('res-rows', s);
  el.resPayout = div('res-payout', s);
  el.resMedals = div('res-medals', s);
  const row = div('home-actions', s);
  el.resRetry = btn('big-btn', row, 'REMATCH', () => H.onRetry());
  el.resNext = btn('big-btn fight', row, 'NEXT GOD', () => H.onNextBoss());
  btn('big-btn ghost', row, 'HOME', () => H.onHome());
}

function showResults({ score, payout, defName, medals, levelUps, nextBossId }) {
  ui.show('results');
  el.resBossName.textContent = defName + ' FALLS';
  el.rankWrap.className = 'rank-wrap r-' + score.rank;
  el.rankLetter.textContent = score.rank;
  el.rankLetter.classList.remove('slam');
  el.resRows.innerHTML = '';
  el.resPayout.innerHTML = '';
  el.resMedals.innerHTML = '';
  el.resNext.style.display = nextBossId ? '' : 'none';

  const rows = [
    ['TIME', fmtTime(score.time), score.timeScore],
    ['DAMAGE', game.hitsTaken + ' hits taken', score.dmgScore],
    ['STYLE', `${game.perfectDodges} perfect · ${game.weakHits} weak · ${game.maxCombo} combo`, score.styleScore],
  ];
  rows.forEach(([label, detail, val], i) => {
    setTimeout(() => {
      const r = div('res-row', el.resRows);
      r.innerHTML = `<span class="rr-label">${label}</span><span class="rr-detail">${detail}</span><span class="rr-val">${val}</span>`;
      sfx.countTick(i);
    }, 250 + i * 280);
  });
  setTimeout(() => {
    el.rankLetter.classList.add('slam');
    sfx.rankSlam(score.rank);
    buzz([20, 30, 50]);
  }, 1250);
  setTimeout(() => {
    el.resPayout.innerHTML =
      `<span class="chip relics">+⬡ ${payout.relics}</span><span class="chip">+${payout.xp} XP</span>` +
      (levelUps > 0 ? `<span class="chip gold">LEVEL UP! LV ${save.level}</span>` : '');
    if (levelUps > 0) sfx.levelUp();
  }, 1650);
  if (medals.length) {
    setTimeout(() => {
      el.resMedals.innerHTML = medals.map((m) => `<span class="chip gold">✦ ${m}</span>`).join('');
      sfx.medal();
    }, 2050);
  }
}

// --- Death ----------------------------------------------------------------------------

function buildDeath() {
  const s = div('screen death', root);
  el.death = s;
  div('death-word', s, 'FELLED');
  el.deathPhase = div('death-phase', s);
  el.deathTip = div('death-tip', s);
  el.deathPay = div('res-payout', s);
  const row = div('home-actions', s);
  btn('big-btn fight', row, 'RETRY', () => H.onRetry());
  btn('big-btn ghost', row, 'HOME', () => H.onHome());
}

function showDeath({ phase, by, payout }) {
  ui.show('death');
  el.deathPhase.textContent = 'PHASE ' + phase;
  el.deathTip.textContent = TIPS[by] || 'Watch the glow — every blow is told before it lands.';
  el.deathPay.innerHTML = `<span class="chip relics">+⬡ ${payout.relics}</span><span class="chip">+${payout.xp} XP</span>`;
}

// --- Pause ----------------------------------------------------------------------------

function buildPause() {
  const s = div('screen pause', root);
  el.pause = s;
  div('pause-title', s, 'PAUSED');
  const col = div('pause-col', s);
  btn('big-btn fight', col, 'RESUME', () => H.onResume());
  btn('big-btn', col, 'ARSENAL', () => ui.openShop('pause'));
  btn('big-btn', col, 'SETTINGS', () => ui.openSettings('pause'));
  btn('big-btn ghost', col, 'ABANDON TRIAL', () => H.onAbandon());
}
