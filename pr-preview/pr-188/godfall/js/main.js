// GODFALL RUSH — boot, render loop, state flow, adaptive quality.
// Flow: home (live showcase) → intro cinematic → fight ⇄ pause
//   → phase-wall cinematics → finisher → results | death → instant retry.

import * as THREE from 'three';
import { CFG } from './config.js';
import { game, scoreFight } from './state.js';
import { save, persist, grantXp, addRelics, bossUnlocked, BOSS_ORDER } from './save.js';
import { initKeyboard, initTouch, pressAction } from './input.js';
import { shell } from './shell.js';
import { cam } from './camera.js';
import { initParticles, updateParticles, resetParticles, setParticleQuality } from './particles.js';
import { initPostFX, setPostSize, setPostPixelRatio, setPostTier, updatePostFX, renderPostFX, setArenaTint } from './postfx.js';
import { initTelegraphs } from './telegraphs.js';
import { initHero, hero, updateHero } from './hero.js';
import { combat, resetCombat, applyEquipment, updateCombat, getHeroState } from './combat.js';
import {
  initBoss, boss, loadBoss, resetBossFight, beginFighting,
  updateBoss, commitPhase, startTraversal,
} from './boss.js';
import { loadArena, updateArena, setArenaQuality } from './arenas.js';
import { initHud, updateHud, setFightVisible } from './hud.js';
import { ui } from './ui.js';
import { music } from './music.js';
import { sfx, setSlowMo } from './sfx.js';
import { on } from './events.js';
import {
  updateCinematics, cinematicActive, skipCinematic, cineTimeScale,
  playIntro, playPhaseWall, playFinisher, playDeath,
} from './cinematics.js';
import { LEVIATHAN } from './bosses/leviathan.js';
import { TITAN } from './bosses/titan.js';
import { RAMUH } from './bosses/ramuh.js';
import { BAHAMUT } from './bosses/bahamut.js';

const BOSSES = [LEVIATHAN, TITAN, RAMUH, BAHAMUT];
const DEFS = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

document.body.classList.add('app-loaded');

// --- Renderer / scene / camera ---------------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(CFG.fovBase, window.innerWidth / window.innerHeight, 0.1, 1500);
initPostFX(renderer, scene, camera);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setPostSize(window.innerWidth, window.innerHeight);
});

// --- Subsystems --------------------------------------------------------------------

initParticles(scene);
initTelegraphs(scene);
initBoss(scene);
initHero(scene);
initKeyboard();
initTouch(renderer.domElement);
cam.init(camera);

let arena = null;
let currentBossId = null;

initHud({
  onPause: () => pauseFight(),
});

ui.init({
  bosses: BOSSES,
  onFight: (id) => startFight(id),
  onSelectBoss: (id) => loadShowcase(id),
  onRetry: () => retryFight(),
  onNextBoss: () => {
    const idx = BOSS_ORDER.indexOf(game.bossId);
    const next = BOSS_ORDER[idx + 1];
    if (next && bossUnlocked(next)) startFight(next);
    else showHome();
  },
  onHome: () => showHome(),
  onResume: () => resumeFight(),
  onAbandon: () => showHome(),
  onEquipChanged: () => {
    if (game.state === 'paused' || game.state === 'fight') {
      applyEquipment({ keepHpFrac: true });
    }
  },
  onQualityChange: () => { /* picked up by updateQuality next frame */ },
});

// --- World loading --------------------------------------------------------------------

function loadWorld(id) {
  if (currentBossId === id) return;
  currentBossId = id;
  const def = DEFS[id];
  resetParticles();
  arena = loadArena(def.arena, scene, QUALITY_SCALARS[qualityTier]);
  setArenaTint(arena.tint);
  loadBoss(def);
  applyEquipment();
  resetCombat();
}

function loadShowcase(id) {
  loadWorld(id);
  hero.root.visible = false;
  cam.setMode('showcase');
  music.start(DEFS[id].theme, { menu: true });
}

// --- Flow ------------------------------------------------------------------------------

function showHome() {
  game.set('home');
  setFightVisible(false);
  loadShowcase(ui.selectedBoss || 'leviathan');
  ui.show('home');
}

function startFight(id) {
  loadWorld(id);
  ui.hideAll();
  game.resetFight(id);
  resetBossFight();
  resetCombat();
  hero.root.visible = true;
  save.stats.fights++;
  persist();
  setFightVisible(true);
  music.start(DEFS[id].theme);
  playIntro(DEFS[id]).then(() => {
    cam.snapTo(hero.theta, hero.h);
    game.set('fight');
    beginFighting();
  });
}

function retryFight() {
  const id = game.bossId;
  ui.hideAll();
  game.resetFight(id);
  resetBossFight();
  resetCombat();
  resetParticles();
  hero.root.visible = true;
  if (boss.built) boss.built.root.visible = true;
  save.stats.fights++;
  persist();
  setFightVisible(true);
  music.start(DEFS[id].theme);
  // No intro on retry — back into the fight in under two seconds.
  cam.setMode('shell');
  cam.snapTo(hero.theta, hero.h);
  game.set('fight');
  beginFighting();
}

function pauseFight() {
  if (game.state !== 'fight') return;
  game.set('paused');
  ui.show('pause');
}

function resumeFight() {
  if (game.state !== 'paused') return;
  discardNextDelta = true;
  ui.hideAll();
  game.set('fight');
}

// Phase walls → cinematic → commit (+ optional traversal chase).
on('bossPhaseWall', ({ phase }) => {
  const def = DEFS[game.bossId];
  game.phaseReached = phase;
  playPhaseWall(def, phase).then(() => {
    commitPhase();
    game.set('fight');
    if (def.traversal && def.traversal.atPhase === phase) {
      startTraversal(getHeroState());
    }
  });
});

// Victory → finisher → results.
on('bossDying', () => {
  game.victory = true;
  const def = DEFS[game.bossId];
  setSlowMo(false);
  playFinisher(def).then(() => {
    settleVictory(def);
  });
});

function settleVictory(def) {
  const score = scoreFight();
  const idx = BOSS_ORDER.indexOf(def.id);
  const slot = save.bosses[def.id];
  let relics = Math.round(CFG.victoryBase[idx] * CFG.rankMult[score.rank]);
  const medals = [];
  if (!slot.medals.clear) {
    slot.medals.clear = true;
    relics += CFG.firstClearBonus;
    medals.push('FIRST CLEAR');
  }
  if (score.time <= 240 && !slot.medals.swift) {
    slot.medals.swift = true;
    relics += CFG.medalBonus;
    medals.push('SUB 4:00');
  }
  if (score.rank === 'S' && !slot.medals.sRank) {
    slot.medals.sRank = true;
    relics += CFG.medalBonus;
    medals.push('S RANK');
  }
  slot.clears++;
  slot.bestTime = slot.bestTime ? Math.min(slot.bestTime, score.time) : score.time;
  const RANKS = ['C', 'B', 'A', 'S'];
  if (RANKS.indexOf(score.rank) > RANKS.indexOf(slot.bestRank || 'C') || !slot.bestRank) {
    slot.bestRank = score.rank;
  }
  slot.bestScore = Math.max(slot.bestScore, score.total);
  save.stats.victories++;
  const xp = CFG.xpVictoryBase + CFG.xpVictoryPerBoss * idx;
  const levelUps = grantXp(xp);
  addRelics(relics);
  persist();
  game.set('results');
  const next = BOSS_ORDER[idx + 1];
  ui.showResults({
    score,
    payout: { relics, xp },
    defName: def.name,
    medals,
    levelUps,
    nextBossId: next && bossUnlocked(next) ? next : null,
  });
}

// Death → brief cinematic → death screen with a tip.
on('heroDied', ({ by }) => {
  save.stats.deaths++;
  playDeath().then(() => {
    const relics = CFG.defeatPerPhase * game.phaseReached;
    const xp = CFG.xpDefeatBase + CFG.xpDefeatPerPhase * game.phaseReached;
    grantXp(xp);
    addRelics(relics);
    persist();
    game.set('dead');
    ui.showDeath({ phase: game.phaseReached, by, payout: { relics, xp } });
  });
});

// Hit-stop requests from combat.
let hitStopT = 0;
on('hitStop', ({ dur }) => { hitStopT = Math.max(hitStopT, dur); });

// --- Global input: pause, skip, restart -----------------------------------------------

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (game.state === 'fight') pauseFight();
    else if (game.state === 'paused') resumeFight();
    else if (cinematicActive()) skipCinematic();
  }
  if (e.code === 'Enter') {
    if (game.state === 'home') startFight(ui.selectedBoss);
    else if (game.state === 'dead') retryFight();
  }
});
window.addEventListener('pointerdown', (e) => {
  if (cinematicActive() && !e.target.closest('button')) skipCinematic();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.state === 'fight') pauseFight();
    music.pauseForBackground();
  }
});
window.addEventListener('blur', () => {
  if (game.state === 'fight') pauseFight();
});

// First gesture also kicks the menu score (AudioContext unlock).
const kickMenuMusic = () => {
  if (game.state === 'home') music.start(DEFS[ui.selectedBoss || 'leviathan'].theme, { menu: true });
  window.removeEventListener('pointerup', kickMenuMusic);
  window.removeEventListener('keydown', kickMenuMusic);
};
window.addEventListener('pointerup', kickMenuMusic);
window.addEventListener('keydown', kickMenuMusic);

// --- Adaptive quality (FPS-driven tiers with hysteresis) -------------------------------

const QUALITY_SCALARS = CFG.qualityScalars;
const PIXEL_RATIOS = [
  Math.min(window.devicePixelRatio, 2),
  Math.min(window.devicePixelRatio, 1.5),
  1,
];
let fpsAvg = 60;
let qualityTier = 0;
let qualityTimer = 0;
let warmup = 2.5;

function applyQuality(tier) {
  qualityTier = tier;
  setParticleQuality(QUALITY_SCALARS[tier]);
  setArenaQuality(QUALITY_SCALARS[tier]);
  renderer.setPixelRatio(PIXEL_RATIOS[tier]);
  setPostTier(tier);
  setPostPixelRatio(PIXEL_RATIOS[tier]);
}

function updateQuality(rawDt) {
  const override = save.settings.qualityOverride;
  if (override !== null && override !== undefined) {
    if (qualityTier !== override) applyQuality(override);
    return;
  }
  if (warmup > 0) { warmup -= rawDt; return; }
  fpsAvg += ((1 / Math.max(rawDt, 1e-4)) - fpsAvg) * Math.min(rawDt * 2, 1);
  const degradeAt = CFG.degradeAt[qualityTier];
  const restoreAt = CFG.restoreAt[qualityTier];
  if (fpsAvg < degradeAt) {
    applyQuality(qualityTier + 1);
    qualityTimer = 0;
  } else if (fpsAvg > restoreAt) {
    qualityTimer += rawDt;
    if (qualityTimer > 3) {
      applyQuality(qualityTier - 1);
      qualityTimer = 0;
    }
  } else {
    qualityTimer = 0;
  }
}

// Perf overlay: ?debug=perf
const urlParams = new URLSearchParams(window.location.search);
const qParam = parseInt(urlParams.get('q'), 10);
if (Number.isFinite(qParam)) { save.settings.qualityOverride = qParam; }
let perfEl = null;
let perfTimer = 0;
if (urlParams.get('debug') === 'perf') {
  renderer.info.autoReset = false;
  perfEl = document.createElement('div');
  perfEl.style.cssText =
    'position:fixed;left:8px;top:8px;z-index:99;font:12px monospace;color:#8aff9a;' +
    'background:rgba(0,0,0,0.55);padding:6px 9px;border-radius:6px;pointer-events:none;white-space:pre';
  document.body.appendChild(perfEl);
}

// --- Main loop ---------------------------------------------------------------------------

const clock = new THREE.Clock();
let discardNextDelta = false;

function arenaIntensity() {
  if (boss.state === 'dying' || boss.state === 'dead') return 1;
  return [0, 0.2, 0.55, 0.9][boss.phase] || 0.2;
}

function tick() {
  requestAnimationFrame(tick);
  let rawDt = Math.min(clock.getDelta(), 0.05);
  if (discardNextDelta) { discardNextDelta = false; rawDt = 0; }
  const time = clock.getElapsedTime();
  updateQuality(rawDt);

  // Layered time scale: cinematics < witch-time < hit-stop (min wins).
  hitStopT = Math.max(0, hitStopT - rawDt);
  let scale = cineTimeScale;
  if (combat.witchT > 0) scale = Math.min(scale, CFG.witchScale);
  if (hitStopT > 0) scale = Math.min(scale, CFG.hitStopScale);
  const simDt = rawDt * scale;

  const st = game.state;

  if (st === 'fight') {
    game.time += simDt;
    shell.update(simDt);
    updateCombat(simDt, rawDt, time);
    if (!combat.dead) updateBoss(simDt, time, getHeroState());
    updateHero(simDt, time);
    cam.update(rawDt, hero, boss.aimPoint);
    music.update({
      phase: boss.phase,
      armiger: combat.armigerActive,
      stagger: boss.state === 'staggered',
      dead: combat.dead,
    });
  } else if (st === 'cinematic') {
    updateCinematics(rawDt);
    shell.update(simDt);
    updateBoss(simDt, time, getHeroState());
    updateHero(simDt, time);
    cam.update(rawDt, hero, boss.aimPoint);
  } else if (st === 'home' || st === 'results' || st === 'dead') {
    shell.update(rawDt);
    if (boss.built && boss.built.root.visible) {
      updateBoss(rawDt * 0.5, time, getHeroState());
    }
    cam.update(rawDt, hero, boss.aimPoint);
  }
  // paused: render only — the world holds its breath.

  if (st !== 'paused') {
    updateParticles(Math.max(simDt, rawDt * 0.25));
    updateArena(rawDt, time, camera, arenaIntensity());
  }

  updatePostFX(rawDt);
  renderPostFX();
  updateHud(rawDt, camera);

  if (perfEl) {
    perfTimer -= rawDt;
    if (perfTimer <= 0) {
      perfTimer = 0.5;
      perfEl.textContent =
        `fps   ${fpsAvg.toFixed(0)}\n` +
        `calls ${renderer.info.render.calls}\n` +
        `tris  ${(renderer.info.render.triangles / 1000).toFixed(0)}k\n` +
        `tier  ${qualityTier}`;
    }
    renderer.info.reset();
  }
}

// --- Boot ------------------------------------------------------------------------------

showHome();
tick();
