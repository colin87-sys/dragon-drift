import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { initInput, initTouch, initMouse } from './input.js';
import { createLevelGen } from './level.js';
import { todaysDailyMod, dailyMods } from './daily.js';
import { createEnvironment, updateEnvironment, resetEnvironment } from './environment.js';
import { createDragon, updateDragon, resetDragon, rebuildDragon } from './dragon.js';
import { initReticle, updateReticle } from './reticle.js';
import { initSplash, showSplash, hideSplash, splashVisible, launchFlash, igniteSplash, splashArmed } from './splash.js';
import { player, applyDragonStats } from './player.js';
import { cameraCtl } from './cameraController.js';
import { initRings, addRing, updateRings, resetRings } from './rings.js';
import { initObstacles, addObstacle, updateObstacles, resetObstacles } from './obstacles.js';
import { initPowerups, addOrb, updatePowerups, resetPowerups } from './powerups.js';
import { initParticles, updateParticles, resetParticles, setParticleQuality } from './particles.js';
import { setDragonQuality } from './dragon.js';
import { updateCollision, resetCollision, acceptRevive, finishDeath } from './collision.js';
import { ui } from './ui.js';
import { music, sfx, setSlowMo, unlockAllTracks } from './sfx.js';
import { initPostFX, setPostSize, setPostPixelRatio, setPostTier, updatePostFX, renderPostFX, postfx, kick, clearDeath, kickState } from './postfx.js';
import { initContactShadow, updateContactShadow, resetContactShadow, setContactShadowQuality } from './contactShadow.js';
import { hitstop, juiceEvent } from './juice.js';
import { createWater, setWaterReflective, updateWater } from './water.js';
import { burst } from './particles.js';
import { buildSetPiece } from './setpieces.js';
import { BIOMES, biomeIndexAt } from './biomes.js';
import { DRAGONS } from './dragons.js';
import { RIDERS } from './riders.js';
import { dailySeed, recordDailyRun, saveData, persist, grantXp, levelEmberReward, todayUTC, gambitSunsetRefund, freezeSaves } from './save.js';
import { initEmbers, addEmberLine, updateEmbers, bankEmbers, resetEmbers } from './embers.js';
import { emit } from './events.js';
import { initMissions, settleMissions } from './missions.js';
import { setAmbientQuality } from './ambient.js';
import { initRecords, settleRecords } from './records.js';
import { initFeats, settleFeats, claimFeat } from './feats.js';
import { settleWeekly } from './weekly.js';
import { settleMilestones, settleMasteryStars } from './milestones.js';
import { grantTitle, levelTitleId, grantEarnedLevelTitles } from './titles.js';
import { selectNextUp } from './recap.js';
import { initGoldEmbers, addGoldEmber, updateGoldEmbers, resetGoldEmbers } from './goldEmbers.js';
import { initHints, updateHints } from './hints.js';
import { initPbMarker, updatePbMarker } from './pbMarker.js';
import { ascendedDef, grandfatherAscension, ascend, ascensionTier, radianceRank, ASCENSION_TIERS } from './ascension.js';
import { applyFlightmark, buyFlightmark, equipFlightmark, FLIGHTMARKS, migrateFlightmarks } from './flightmarks.js';

// --- Renderer / scene / camera ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92; // pull exposure back so highlights don't wash out
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1600);
camera.layers.enable(1); // layer 1 = sprites hidden from the water reflection
initPostFX(renderer, scene, camera);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  setPostSize(window.innerWidth, window.innerHeight);
});

// --- Seeds: every run gets a fresh course; daily + challenge runs pin one.
const urlParams = new URLSearchParams(window.location.search);
const challengeSeedParam = parseInt(urlParams.get('seed'), 10);
const challengeSeed = Number.isFinite(challengeSeedParam) && challengeSeedParam > 0
  ? challengeSeedParam : null;
if (urlParams.has('daily')) game.mode = 'daily';

function seedForRun() {
  if (game.mode === 'daily') return dailySeed();
  if (challengeSeed !== null && game.challengeScore > 0) return challengeSeed;
  return (Math.random() * 0x7fffffff) | 0;
}

const challengeParam = parseInt(urlParams.get('challenge'), 10);
if (Number.isFinite(challengeParam) && challengeParam > 0) game.challengeScore = challengeParam;

let runSeed = seedForRun();
game.runSeed = runSeed;

// --- Build the world ---
const equippedDragon = () => {
  const key = saveData.skins.equipped;
  const def = DRAGONS[key] || DRAGONS.azure;
  const fp = saveData.cosmetics.formPref.find(e => e[0] === key);
  const tier = fp ? Math.min(fp[1], ascensionTier(key)) : ascensionTier(key);
  return applyFlightmark(ascendedDef(def, tier, radianceRank(key)));
};
const equippedRider = () => RIDERS[saveData.riders.equipped] || RIDERS.drifter;
createEnvironment(scene, runSeed);
createWater(scene, true); // real reflection by default; tiers downgrade it
createDragon(scene, equippedDragon(), equippedRider());
initContactShadow(scene);
applyDragonStats(equippedDragon());
initRings(scene);
initObstacles(scene);
initPowerups(scene);
initParticles(scene);
initEmbers(scene);
initGoldEmbers(scene);
initPbMarker(scene);

// Set-piece meshes must exist before the first spawnAhead() call below,
// since the first chunk can contain set-pieces.
const setpieceMeshes = [];

let levelGen = createLevelGen(runSeed);
// Gauntlet corridor boundaries queued from level chunks; crossing an end
// alive = a cleared gauntlet (weekly trials, feats, milestones).
const pendingGauntletStarts = [];
const pendingGauntletEnds = [];
function spawnAhead() {
  const lead = Math.max(CONFIG.spawnAhead, player.speed * CONFIG.spawnAheadTime);
  if (levelGen.generatedUntil >= player.dist + lead) return;
  const chunk = levelGen.ensure(player.dist + lead);
  chunk.rings.forEach(addRing);
  chunk.obstacles.forEach(addObstacle);
  chunk.orbs.forEach(addOrb);
  chunk.embers.forEach(addEmberLine);
  chunk.goldEmbers && chunk.goldEmbers.forEach(addGoldEmber);
  chunk.gauntletStarts && pendingGauntletStarts.push(...chunk.gauntletStarts);
  chunk.gauntletEnds && pendingGauntletEnds.push(...chunk.gauntletEnds);
  // Set-pieces
  chunk.setPieces && chunk.setPieces.forEach(sp => triggerSetPiece(sp));
}
spawnAhead();

// --- Set-pieces (dramatic environment moments) ---
function triggerSetPiece(sp) {
  const obj = buildSetPiece(sp);
  if (!obj) return;
  scene.add(obj);
  setpieceMeshes.push({ object: obj, dist: sp.dist });
}

// Debug: force Dragon Surge for visual verification
const debugFever = urlParams.get('debug') === 'fever';
if (urlParams.has('debug')) {
  window.__dd = {
    renderer, game, player, save: saveData, emit, ui, claimFeat,
    juice: { hitstop, juiceEvent },
    postfx: { setPostTier, kick, kickState, handle: postfx },
    // Test seam: skip the attract splash and land on the dashboard hub.
    toHub: () => {
      if (!splashVisible()) return;
      hideSplash();
      cameraCtl.setSplash(false);
      ui.showScreen('start');
    },
  };
}

// Perf overlay (?debug=perf): fps / draw calls / quality tier
let perfEl = null;
let perfTimer = 0;
if (urlParams.get('debug') === 'perf') {
  renderer.info.autoReset = false; // accumulate across all composer passes
  perfEl = document.createElement('div');
  perfEl.style.cssText =
    'position:fixed;left:8px;top:8px;z-index:99;font:12px monospace;color:#8aff9a;' +
    'background:rgba(0,0,0,0.55);padding:6px 9px;border-radius:6px;pointer-events:none;white-space:pre';
  document.body.appendChild(perfEl);
}

initInput();
initTouch(renderer.domElement);
initMouse(renderer.domElement);
initMissions();
initRecords(); // before initFeats: feats read counters records increments
initFeats();
initHints();
ui.init({
  getCard: makeShareCard,
  onRestart: restart,
  onStart: (mode) => startGame(mode),
  onEquipDragon: () => {
    rebuildDragon(equippedDragon(), equippedRider(), player);
    applyDragonStats(equippedDragon());
  },
  onEquipRider: () => rebuildDragon(equippedDragon(), equippedRider(), player),
  onAscend: (key) => {
    const def = DRAGONS[key] || DRAGONS.azure;
    if (ascend(key, def.cost)) {
      rebuildDragon(equippedDragon(), equippedRider(), player);
      applyDragonStats(equippedDragon());
      return ascensionTier(key);
    }
    return 0;
  },
  onBuyFlightmark: (id) => buyFlightmark(id),
  onEquipFlightmark: (id) => {
    if (equipFlightmark(id)) {
      rebuildDragon(equippedDragon(), equippedRider(), player);
      return true;
    }
    return false;
  },
  onQualityChange: (v) => { if (v !== null) applyQuality(v); },
  onPause: () => pauseManual(),
  onResume: () => resumeFromPause(),
  onRevive: () => {
    acceptRevive(player);
    sfx.revive();
    ui.orbFlash();
  },
  onGiveUp: () => {
    const d = game.pendingDeath || { cause: 'shard', lethal: false };
    game.pendingDeath = null;
    finishDeath(player, d.cause, d.lethal);
  },
});
initReticle(camera);
cameraCtl.init(camera, player);

// --- Boot-time return triggers ---
// A long absence earns a small tailwind gift. lastSeen always updates.
let bootHasNotice = false; // a returning-pilot notice → show the hub, not the splash
{
  const today = todayUTC();
  if (saveData.lastSeen) {
    const gapDays = Math.floor((Date.parse(today) - Date.parse(saveData.lastSeen)) / 86400000);
    if (gapDays > CONFIG.welcomeBackGapDays) {
      saveData.embers += CONFIG.welcomeBackGift;
      ui.setStartNotice(`Tailwind while you were away: +◆${CONFIG.welcomeBackGift}. The sky kept your seat.`);
      bootHasNotice = true;
    }
  }
  saveData.lastSeen = today;
  persist();
  if (gambitSunsetRefund > 0) {
    ui.setStartNotice(`An interrupted Gauntlet returned your ◆${gambitSunsetRefund} stake.`);
    bootHasNotice = true;
  }
}
// Backfill any pilot-level titles already earned (retroactive — covers levels
// reached before a title existed, or before the per-level grant ran).
grantEarnedLevelTitles(saveData.level);
// Remap any old generic trail-style purchases onto the new dragon-signature roster.
migrateFlightmarks();
grandfatherAscension(Object.keys(DRAGONS));

// Dev mode (?dev URL, or the Settings toggle saveData.settings.dev): unlock
// everything for testing — all dragons at max form, all riders + styles, full
// embers. Saves are FROZEN first so this override never overwrites real
// progress: turn it off (or reload without ?dev) to return to normal.
if (urlParams.has('dev') || saveData.settings.dev) {
  freezeSaves();
  for (const key of Object.keys(DRAGONS)) {
    if (!saveData.skins.owned.includes(key)) saveData.skins.owned.push(key);
    const e = saveData.ascension.tiers.find((t) => t[0] === key);
    if (e) e[1] = ASCENSION_TIERS.length; else saveData.ascension.tiers.push([key, ASCENSION_TIERS.length]);
  }
  for (const key of Object.keys(RIDERS)) {
    if (!saveData.riders.owned.includes(key)) saveData.riders.owned.push(key);
  }
  for (const m of FLIGHTMARKS) {
    if (!saveData.cosmetics.marksOwned.includes(m.id)) saveData.cosmetics.marksOwned.push(m.id);
  }
  unlockAllTracks();           // every premium radio station too
  saveData.embers = 999999;
  console.log('[dev] everything unlocked for this session');
}

// First impression: a brand-new pilot lands on a cinematic attract splash over
// the LIVE 3D scene — the camera frames behind the dragon looking down the real
// ring course (spawned at boot), so TAKE OFF flies the very course shown. Only a
// genuine first-timer in normal mode sees it; returning pilots, challenge/daily
// links, and welcome-back/refund notices route to the dashboard hub as before.
// startGame() clears the splash on every entry path (CTA, tap-anywhere, ENTER).
initSplash({
  onTakeOff: () => startGame('normal'),
  // First splash interaction: unlock + swell in the intro/title theme (browser
  // autoplay only permits audio inside a user gesture). The run does NOT start.
  onIgnite: () => music.startMenuTheme(),
});
const firstTimePilot = saveData.stats.runs === 0 && !bootHasNotice &&
  game.mode === 'normal' && !game.challengeScore;
if (firstTimePilot) {
  cameraCtl.setSplash(true);
  showSplash();
} else {
  ui.showScreen('start');
}

// First-ever launch: a one-time cinematic fly-in to the soaring dragon, then the
// hero menu materialises (CSS .hero-intro). Marked seen immediately so it plays
// exactly once. Skips on reduced-motion, dev unlocks, and shared-challenge boots.
let introPlaying = false;
if (!saveData.flags.seenIntro && game.state === 'ready' && game.mode === 'normal' && !game.challengeScore) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) { cameraCtl.playIntro(); introPlaying = true; }
  saveData.flags.seenIntro = true;
  persist();
}

// First impression: the Skybound title theme plays on the menu. The audio graph
// builds now (silent in the suspended context); the player's first gesture
// resumes the context (sfx.js unlockAudio) and the theme becomes audible — and a
// one-shot gesture listener re-kicks it for browsers that block context creation
// until a gesture. Takeoff swaps it to the chosen station (endMenuTheme).
music.startMenuTheme();
{
  const kick = () => { music.startMenuTheme(); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); window.removeEventListener('touchstart', kick); };
  window.addEventListener('pointerdown', kick, { passive: true });
  window.addEventListener('keydown', kick, { passive: true });
  window.addEventListener('touchstart', kick, { passive: true });
}

let gameoverTapArmed = 0; // taps restart only after a short grace period
window.addEventListener('pointerdown', (e) => {
  // Buttons, cards and sliders handle their own clicks — don't treat them
  // as "tap to fly" / "tap to resume"
  if (e.target.closest && e.target.closest('button, .skin-card, .daily-card, .seg-btn, .pause-menu, .share-menu, .title-row, input')) return;
  if (game.state === 'paused') {
    // Browsing the shop/settings from pause: outside taps go back to the
    // pause overlay instead of resuming mid-shop.
    if (ui.inPauseSubscreen()) ui.showPauseOverlay();
    else resumeFromPause();
  }
  // Tap-to-fly only from the start screen itself — while browsing the
  // shop/settings, blank taps mean "back" (handled by the screen itself).
  else if (game.state === 'ready' && !ui.inSubscreen()) {
    // A tap during the intro fast-forwards to the resting menu — it must NOT
    // also launch a run (no accidental take-off on the very first frame).
    if (introPlaying) { cameraCtl.skipIntro(); introPlaying = false; }
    else startGame();
  }
  // Crash screen: tapping any blank spot starts a new flight. Armed only
  // after a grace period so a frantic last-second tap can't skip the screen.
  else if (game.state === 'gameover' && game.deathFreezeTimer <= 0 &&
           performance.now() > gameoverTapArmed && !ui.inSubscreen()) {
    restart();
  }
});

// Share card: re-renders the scene at crash moment (with death particles visible)
// and stamps stats over it.
function makeShareCard() {
  renderPostFX();
  const src = renderer.domElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);

  const s = c.width / 1280;
  const top = c.height * 0.28;
  g.fillStyle = 'rgba(8, 14, 30, 0.6)';
  g.fillRect(0, top, c.width, 195 * s);
  g.textAlign = 'center';

  g.fillStyle = '#aaddff';
  g.font = `700 ${24 * s}px sans-serif`;
  g.fillText('DRAGON DRIFT', c.width / 2, top + 36 * s);

  g.fillStyle = '#ffd86a';
  g.font = `700 ${66 * s}px sans-serif`;
  g.fillText(`${Math.floor(game.score).toLocaleString()} PTS`, c.width / 2, top + 108 * s);

  g.fillStyle = '#9fd8f0';
  g.font = `${18 * s}px sans-serif`;
  g.fillText(
    `${Math.floor(game.distance)} m  ·  ${game.ringsCollected} rings  ·  ${game.maxCombo.toFixed(2)}x combo  ·  ${game.nearMisses} near misses`,
    c.width / 2, top + 142 * s
  );

  g.fillStyle = '#ffa06a';
  g.font = `${15 * s}px sans-serif`;
  g.fillText(`Course ${game.runSeed.toString(36).toUpperCase()}  ·  Can you beat my run?`, c.width / 2, top + 172 * s);

  return c;
}

// --- Game flow ---
function startGame(mode = 'normal') {
  if (game.state !== 'ready') return;
  // Premium launch: a quick gold flash burst + whoosh + camera punch masks the
  // cut from the attract/menu framing into gameplay. No delay — the run starts
  // underneath the flash, so it reads as accelerating into flight, not a load.
  launchFlash();
  sfx.launch();
  cameraCtl.boostKick();
  // Leave the attract splash on any takeoff path (CTA, tap-anywhere, ENTER).
  hideSplash();
  cameraCtl.setSplash(false);
  const modeChanged = mode !== game.mode;
  game.mode = mode;
  if (modeChanged || mode === 'daily') {
    // Mode decides the seed — rebuild the course before takeoff.
    restart();
  } else {
    game.state = 'playing';
    ui.hideScreen();
    emit('runStart');
  }
  music.endMenuTheme(); // swap the title theme back to the chosen gameplay station
  music.start();
}

let boostWasActive = false;
let discardNextDelta = false;
let currentBiome = 0;

function restart() {
  game.reset();
  // Daily Challenge modifier (deterministic per UTC day) → run-level multipliers.
  game.dailyMod = game.mode === 'daily' ? todaysDailyMod() : null;
  game.mods = dailyMods(game.dailyMod);
  player.reset();
  resetDragon(player);
  resetRings();
  resetObstacles();
  resetPowerups();
  resetParticles();
  resetCollision();
  resetEmbers();
  resetGoldEmbers();
  resetContactShadow();
  runSeed = seedForRun();
  game.runSeed = runSeed;
  resetEnvironment(runSeed);
  clearDeath(true); // instant color restore (cameraCtl.init below resets the death cam)
  pendingGauntletStarts.length = 0;
  pendingGauntletEnds.length = 0;
  // Cull old set-pieces
  for (const sp of setpieceMeshes) scene.remove(sp.object);
  setpieceMeshes.length = 0;
  levelGen = createLevelGen(runSeed);
  spawnAhead();
  cameraCtl.init(camera, player);
  ui.hideScreen();
  game.state = 'playing';
  boostWasActive = false;
  currentBiome = 0;
  emit('runStart');
}

// Run-end settle pipeline — the ORDER IS A CONTRACT:
// bests first (lifetime stats feed milestones), bank before mission totals
// display, daily before weekly (the daily-count trial reads firstToday),
// XP/levels before feats, feats LAST (they see everything else's writes).
function settleRun() {
  game.recordBests();                                  // 1 stats + mastery metres
  const newRecords = settleRecords();                  // 2 personal records
  const emberTotal = bankEmbers();                     // 3 haul (rider ×, first-flight ×)
  const missionSettle = settleMissions();              // 4 quests pay, chains unlock
  game.missionResults = missionSettle.completed;
  const dailyResult = game.mode === 'daily' ? recordDailyRun(game.score) : null; // 5
  const weeklyResults = settleWeekly(game, {           // 6
    dailyFirstToday: !!(dailyResult && dailyResult.firstToday),
  });
  const missionXp = game.missionResults.reduce((a, r) => a + Math.round(r.reward / 2), 0);
  game.xpGained = Math.floor(game.score / 150) + game.ringsCollected * 2 + missionXp;
  game.levelUps = grantXp(game.xpGained);              // 7 levels pay embers inside
  let levelEmbers = 0;
  for (let i = 0; i < game.levelUps; i++) {
    const lv = saveData.level - game.levelUps + 1 + i;
    levelEmbers += levelEmberReward(lv);
    const titleId = levelTitleId(lv);
    if (titleId) grantTitle(titleId);
  }
  const milestoneResults = settleMilestones();         // 8 lifetime rungs
  const masteryResults = settleMasteryStars((key) => (DRAGONS[key] || { name: key }).name);
  const featResults = settleFeats();                   // 9 feats see everything
  const goldValue = Math.round(game.goldEmbersRun * CONFIG.goldEmberValue * game.mods.gold);
  game.runSummary = {                                  // 10 the recap reads this
    newRecords,
    missionResults: game.missionResults,
    questUnlocks: missionSettle.unlocked,
    weeklyResults,
    milestoneResults: [
      ...milestoneResults,
      ...masteryResults.map((m) => ({ at: '', unit: '', label: `${m.dragonName} mastery ★${m.star}`, reward: m.reward })),
    ],
    featResults,
    levelUps: game.levelUps,
    levelEmbers,
    xpGained: game.xpGained,
    dailyResult,
    emberBreakdown: {
      base: game.embersRun - goldValue,
      gold: goldValue,
      rider: game.emberBonusEarned,
      firstFlight: game.firstFlightBonus,
      ascend: game.ascendBonusEarned,
      total: emberTotal,
    },
    nextUp: selectNextUp(),
  };
  persist();
  if (game.missionResults.length) setTimeout(() => sfx.missionComplete(), 700);
  if (game.levelUps > 0) setTimeout(() => sfx.levelUp(), 1200);
  if (featResults.length) setTimeout(() => sfx.featUnlock(), 1700);
  clearDeath(); // recap fades back to full color (fast decay)
  ui.showScreen('gameover');
  // Blank-tap restart arms only after the ledger reveal settles.
  gameoverTapArmed = performance.now() + 700 + ui.recapRevealMs;
}

window.addEventListener('keydown', (e) => {
  // Don't hijack keys while a slider/input is focused (pause-menu volumes)
  if (e.target && e.target.tagName === 'INPUT') return;
  // Celebration overlay owns input while visible — Enter/Space dismiss it
  // instead of launching a run underneath.
  if (ui.dismissCelebrate()) return;
  // Dragon Radio: N cycles stations, [ / ] step back / forward
  if (e.code === 'KeyN' || e.code === 'BracketRight' || e.code === 'BracketLeft') {
    const name = music.nextTrack(e.code === 'BracketLeft' ? -1 : 1);
    sfx.radio();
    ui.radioPopup(name);
    return;
  }
  // Esc toggles pause
  if (e.code === 'Escape') {
    if (game.state === 'playing') pauseManual();
    else if (game.state === 'paused') {
      if (ui.inPauseSubscreen()) ui.showPauseOverlay();
      else resumeFromPause();
    }
    return;
  }
  if (game.state === 'paused') {
    if (!ui.inPauseSubscreen()) resumeFromPause();
  }
  else if (game.state === 'ready'    && (e.code === 'Enter' || e.code === 'Space')) {
    // On the attract splash, the first keypress ignites (wakes audio + reveals
    // TAKE OFF) rather than launching — matches the first-tap behaviour.
    if (splashVisible() && !splashArmed()) igniteSplash();
    else if (introPlaying) { cameraCtl.skipIntro(); introPlaying = false; }
    else startGame();
  }
  else if (game.state === 'gameover' && e.code === 'KeyR') restart();
});

function pauseForBackground() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  game.pauseReason = 'background';
  game.hitstopTimer = 0;
  boostWasActive = false;
  music.pauseForBackground();
  updateReticle(player, false);
  ui.showPauseOverlay();
}

// Manual pause: Esc key or the HUD pause button.
function pauseManual() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  game.pauseReason = 'manual';
  game.hitstopTimer = 0;
  boostWasActive = false;
  updateReticle(player, false);
  ui.showPauseOverlay();
}

function resumeFromPause() {
  if (game.state !== 'paused') return;
  discardNextDelta = true;
  game.pauseReason = '';
  game.state = 'playing';
  ui.hideScreen();
  music.start();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseForBackground();
});
window.addEventListener('pagehide', pauseForBackground);
window.addEventListener('blur', pauseForBackground);

// --- Main loop ---
const clock = new THREE.Clock();
let sprayTimer = 0;
const sprayPos = new THREE.Vector3();
// Screenshot capture: delayed slightly after death to catch burst particles
let screenshotPending = false;
let screenshotTimer = 0;

// --- Adaptive quality: protect the 60fps floor on weaker devices ---
// Rolling-average FPS drives a quality scalar that thins particle/trail
// spawn rates, and at the lowest tier also drops the render resolution.
// Degrades BEFORE 60 is breached (<55 / <42) and restores with hysteresis.
let fpsAvg = 60;
let qualityTier = 0;        // 0 = full, 1 = reduced, 2 = low
let qualityTimer = 0;       // time spent above the restore threshold
let warmup = 2;             // ignore first seconds (shader-compile jank)
const QUALITY_SCALARS = [1, 0.6, 0.35];
const PIXEL_RATIOS = [
  Math.min(window.devicePixelRatio, 2),
  Math.min(window.devicePixelRatio, 1.5),
  1,
];
document.body.dataset.qtier = qualityTier; // boot default (applyQuality only runs on change)

function applyQuality(tier) {
  qualityTier = tier;
  document.body.dataset.qtier = tier; // CSS gates (speedlines, motes) read this
  setParticleQuality(QUALITY_SCALARS[tier]);
  setDragonQuality(QUALITY_SCALARS[tier]);
  setContactShadowQuality(QUALITY_SCALARS[tier]);
  renderer.setPixelRatio(PIXEL_RATIOS[tier]);
  setPostTier(tier);
  setPostPixelRatio(PIXEL_RATIOS[tier]);
  setWaterReflective(tier === 0);
  setAmbientQuality(QUALITY_SCALARS[tier]);
}

function updateQuality(dt) {
  // Manual quality override from settings pins the tier.
  const override = saveData.settings.qualityOverride;
  if (override !== null && override !== undefined) {
    if (qualityTier !== override) applyQuality(override);
    return;
  }
  if (warmup > 0) { warmup -= dt; return; }
  fpsAvg += ((1 / Math.max(dt, 1e-4)) - fpsAvg) * Math.min(dt * 2, 1);
  const degradeAt = [55, 42, 0][qualityTier];
  const restoreAt = [Infinity, 63, 50][qualityTier];
  if (fpsAvg < degradeAt) {
    applyQuality(qualityTier + 1);
    qualityTimer = 0;
  } else if (fpsAvg > restoreAt) {
    qualityTimer += dt;
    if (qualityTimer > 3) {
      applyQuality(qualityTier - 1);
      qualityTimer = 0;
    }
  } else {
    qualityTimer = 0;
  }
}

function tick() {
  requestAnimationFrame(tick);
  // rawDt drives FPS metering and UI; simDt (scaled by near-death slow-mo)
  // drives every world/gameplay update.
  let rawDt = Math.min(clock.getDelta(), 0.05);
  if (discardNextDelta) {
    discardNextDelta = false;
    rawDt = 0;
  }
  updateQuality(rawDt);

  // Slow-mo bookkeeping runs in REAL time so 0.6s of dilation is 0.6s felt.
  if (game.slowMoTimer > 0) {
    game.slowMoTimer -= rawDt;
    game.timeScale = 0.35;
    game.hitstopTimer = 0; // slow-mo wins: kill any in-flight impact freeze
    if (game.slowMoTimer <= 0) setSlowMo(false);
  } else if (game.timeScale < 1) {
    game.timeScale = Math.min(1, game.timeScale + rawDt * 3);
  }
  let dt = rawDt * (game.state === 'playing' ? game.timeScale : 1);
  // Impact-frame hitstop (juice.js): real-time countdown, near-freeze while
  // active, instant restore — no ramp, distinct from slow-mo's channel.
  if (game.state === 'playing' && game.hitstopTimer > 0) {
    game.hitstopTimer -= rawDt;
    dt *= CONFIG.JUICE.hitstopScale;
  }

  if (game.state === 'playing') {
    game.time += dt;

    // Debug: hold Dragon Surge on (visual verification only)
    if (debugFever) {
      game.feverActive = true;
      game.feverTimer = CONFIG.feverDuration;
    }
    player.update(dt);
    game.distance = player.dist;
    game.score += player.speed * dt * CONFIG.distanceScore * game.scoreMult;
    spawnAhead();

    updateCollision(dt, player);
    updateRings(dt, player, clock.getElapsedTime());
    updatePowerups(dt, player, clock.getElapsedTime());
    updateEmbers(dt, player, clock.getElapsedTime());
    updateGoldEmbers(dt, player, clock.getElapsedTime());
    updatePbMarker(dt, player, clock.getElapsedTime());
    updateHints(dt, player);
    music.update(game, player);
    ui.update(player);

    // Gauntlet boundaries: starts cue the onboarding hint, ends crossed
    // alive count as cleared corridors.
    while (pendingGauntletStarts.length && player.dist >= pendingGauntletStarts[0]) {
      pendingGauntletStarts.shift();
      emit('gauntletStart', { dist: player.dist });
    }
    while (pendingGauntletEnds.length && player.dist >= pendingGauntletEnds[0]) {
      pendingGauntletEnds.shift();
      game.gauntletsClearedRun++;
      emit('gauntletCleared', { dist: player.dist });
    }

    // Boost start: camera kick + whoosh SFX
    if (player.boosting && !boostWasActive) {
      cameraCtl.boostKick();
      sfx.boostStart();
    }
    boostWasActive = player.boosting;

    // Barrel roll start: camera lean, whoosh, style bonus
    if (player.rollJustStarted) {
      player.rollJustStarted = false;
      cameraCtl.rollKick(player.roll ? player.roll.dir : 1);
      sfx.roll();
      const bonus = Math.round(CONFIG.rollBonus * game.combo * game.scoreMult);
      game.score += bonus;
      game.rolls = (game.rolls || 0) + 1;
      ui.rollPopup(bonus);
      emit('roll');
    }

    // Mission distance progress (cheap: 3 active slots max)
    emit('distance', { m: player.dist });

    // Distance milestones
    const ms = Math.floor(player.dist / CONFIG.milestoneStep);
    if (ms > game.milestone) {
      game.milestone = ms;
      ui.milestonePopup(ms * CONFIG.milestoneStep);
      sfx.milestone();
    }

    // Biome threshold announcement + music key shift (lands at loop boundary)
    const bi = biomeIndexAt(player.dist);
    if (bi !== currentBiome) {
      currentBiome = bi;
      music.setKeyShift(BIOMES[bi].keyShift);
      if (player.dist > 100) {
        ui.biomePopup(BIOMES[bi].name);
        sfx.milestone();
      }
    }

    // Live new-record celebration the moment the run passes the old best
    if (!game.recordBeaten && game.highScore > 0 && game.score > game.highScore) {
      game.recordBeaten = true;
      ui.recordPopup();
      sfx.record();
    }

    // Fever timer
    if (game.feverActive) {
      game.feverTimer -= dt;
      if (game.feverTimer <= 0) {
        game.feverActive = false;
        game.feverTimer = 0;
      }
    }

  } else if (game.state === 'gameover') {
    // Death freeze: hold the crash frame briefly, then settle + recap
    if (game.deathFreezeTimer > 0) {
      game.deathFreezeTimer -= dt;
      if (game.deathFreezeTimer <= 0) {
        settleRun();
      }
    }
  }

  if (game.state !== 'paused') {
    // Cull old set-pieces
    for (let i = setpieceMeshes.length - 1; i >= 0; i--) {
      if (setpieceMeshes[i].dist < player.dist - CONFIG.cullBehind - 200) {
        scene.remove(setpieceMeshes[i].object);
        setpieceMeshes.splice(i, 1);
      }
    }

    const t = clock.getElapsedTime();
    updateDragon(dt, player, t);
    updateParticles(dt, camera);
    const obstacleSpeedNorm = (player.speed - CONFIG.baseSpeed) / (CONFIG.orbSpeed - CONFIG.baseSpeed);
    updateObstacles(dt, t, player.dist, obstacleSpeedNorm);
    cameraCtl.update(dt, player, game.state === 'ready');
    if (introPlaying && !cameraCtl.introPlaying) introPlaying = false;
    updateReticle(player, game.state === 'playing');
    updateEnvironment(dt, camera, t, player.dist, game.feverActive, player.speed);
    updateWater(dt, player.dist, t, scene.fog);
    updateContactShadow(dt, player);

    // Skimming the water kicks up spray (throttled, gameplay only).
    if (game.state === 'playing' && player.position.y < 3.6) {
      sprayTimer -= dt;
      if (sprayTimer <= 0) {
        sprayTimer = 0.06;
        sprayPos.set(
          player.position.x + (Math.random() - 0.5) * 1.6,
          0.6,
          player.position.z + 1.5
        );
        burst(sprayPos, 0xcfeeff, { count: 3, speed: 7, size: 0.55, life: 0.5 });
      }
    }
  }

  const speedNorm = (player.speed - CONFIG.baseSpeed) / (CONFIG.orbSpeed - CONFIG.baseSpeed);
  updatePostFX(dt, speedNorm, game.feverActive, rawDt);
  renderPostFX();

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

tick();

// Boot complete: cross-fade the loading screen out, the canvas in (CSS-driven).
document.body.classList.add('app-loaded');
