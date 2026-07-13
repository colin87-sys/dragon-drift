import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { initInput, initTouch, initMouse, input } from './input.js';
import { createLevelGen } from './level.js';
import { todaysDailyMod, dailyMods } from './daily.js';
import { createEnvironment, updateEnvironment, resetEnvironment, getSkyMesh, debugArenaProps, debugSkyDim, setSkyProbeEnabled, skyProbeEnabled, setPropAO, setAtmosphereEnabled, atmosphereEnabled, setAtmosphereQuality, setSkyCloudsEnabled, skyCloudsEnabled, setSkyCloudQuality, getCloudSunCover, setArenaSetQuality, debugArenaSet, setWaterFoam, setWaterFoamQuality } from './environment.js';
import { createDragon, updateDragon, resetDragon, rebuildDragon, setDragonFxVisible, setDragonModelDetail, __trailDebug } from './dragon.js';
import { resolveDetail } from './modelDetail.js';
import { initReticle, updateReticle, setMarkRune, markRune } from './reticle.js';
import { lockHudState } from './lockLayer.js';
import { initSplash, showSplash, hideSplash, splashVisible, launchFlash, igniteSplash, splashArmed } from './splash.js';
import { player, applyDragonStats } from './player.js';
import { cameraCtl } from './cameraController.js';
import { initRings, addRing, updateRings, resetRings, setRingsVisible } from './rings.js';
import { initObstacles, addObstacle, addCanyonSegment, updateObstacles, resetObstacles, obstacleCount, spineWallPresenceAt, flowColliderBoxes } from './obstacles.js';
import { initHazards, addHazard, updateHazards, resetHazards } from './hazards.js';
import { initPowerups, addOrb, updatePowerups, resetPowerups } from './powerups.js';
import { initParticles, updateParticles, resetParticles, setParticleQuality, setParticleBackend } from './particles.js';
import { initSpeedStreaks, updateSpeedStreaks, resetSpeedStreaks } from './speedStreaks.js';
import { setDragonQuality, setDragonLook, setDragonInhale } from './dragon.js';
import { updateCollision, resetCollision, acceptRevive, finishDeath } from './collision.js';
import { ui } from './ui.js';
import { music, sfx, setSlowMo, unlockAllTracks, getAudioHealth, UNLEASH_V2, LANCE_V3, getLanceProfile, toggleLanceProfile } from './sfx.js';
import { lanceWyrm } from './sfxLance2.js';
import { initPostFX, setPostSize, setPostPixelRatio, setPostTier, updatePostFX, renderPostFX, postfx, kick, clearDeath, kickState, setupGodRays, setGodRaySun, setGodRayBoost, setDither } from './postfx.js';
import { installNeutralToneMap, setToneMap } from './toneMap.js';
import { initContactShadow, updateContactShadow, resetContactShadow, setContactShadowQuality, setContactShadowSilhouette, renderHeroShadow, heroShadowCoverage, contactShadowSilhouette, heroShadowMaskURL, heroShadowSpriteLeak } from './contactShadow.js';
import { hitstop, juiceEvent } from './juice.js';
import { createWater, setWaterReflective, updateWater, setWaterSwell, setWaterSwellQuality, setWaterDepth, debugWaterY, getArenaDropK, setWaterReflFar, getWaterSwellOn, getWaterDepthOn } from './water.js';
import { waterFoamOn } from './propFoam.js';
import { aoUniform } from './propAO.js';
import { makePerfStats, resetPerfStats, perfFrame, perfSummary } from './perfStats.js';
import { burst, rollWake, gatherPulse, particleStats } from './particles.js';
import { buildSetPiece } from './setpieces.js';
import { BIOMES, biomeIndexAt, SUN_DIR } from './biomes.js';
import { DRAGONS, wispTintFor, lanceRuneFor } from './dragons.js';
import { RIDERS } from './riders.js';
import { dailySeed, recordDailyRun, saveData, persist, grantXp, levelEmberReward, todayUTC, gambitSunsetRefund, freezeSaves } from './save.js';
import { initEmbers, addEmberLine, updateEmbers, bankEmbers, resetEmbers } from './embers.js';
import { initBoss, updateBoss, syncSkyRig, resetBoss, setBossQuality, forceBoss, debugFireAttack, debugCrackPane, debugThreadCut, debugRestitch, debugBreakFrame, debugFelledLie, debugLanceState, debugArmBeamDuel, debugBeamDuelT, debugCrush, debugCrushOn, debugRunSetpiece, debugForceFight, setBossDebugFirstAt, setBossDebugDefIdx, setBossDebugPhase, setBossDebugStage, setBossDebugCharge, setBossDebugSetpiece, setBossDebugEntrance, setBossLab, bossDebugState, debugBankLocks, debugBeamAimPart, debugLockCandidates, debugPartWorldPos, debugStrikeSurge, debugRaiseShield, debugPaintables, debugShimmerCount, debugTetherCount, debugBeatOn, debugBurns, debugReckoning, debugLoose, bossGradeTarget, bossArenaMix, bossArenaFade, updateArenaExhale, debugFell, bossDebugModelLift, bossDebugModelVoid, debugWingMinWorldY, startBossRush, setRushUnlockAll, rushUnlocked, rushRosterInfo, setLanceTint } from './boss.js';
import { debugActiveBullets, setDebugPerfectParryRel, setWispTint, getWispTint as wispTint, debugWispColors } from './bossBullets.js';
import { emit, on } from './events.js';
import { initAnalytics } from './analytics.js';
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
import { initGestureTutorial, updateGestureTutorial } from './gestureTutorial.js';
import { initPbMarker, updatePbMarker } from './pbMarker.js';
import { ascendedDef, grandfatherAscension, ascend, ascensionTier, radianceRank, ASCENSION_TIERS } from './ascension.js';
import { applyFlightmark, buyFlightmark, equipFlightmark, FLIGHTMARKS, migrateFlightmarks } from './flightmarks.js';
import { BUILD, BUILT } from './buildId.js';

// Visible build stamp — confirms which build actually loaded (vs a stale service
// worker cache). The id is the SW content hash, so it changes whenever any asset
// changes; if the number on screen matches the latest deploy, you're current.
(function showBuildStamp() {
  try {
    console.log(`[Dragon Drift] build ${BUILD} · built ${BUILT}`);
    const el = document.createElement('div');
    el.id = 'build-stamp';
    el.textContent = 'build ' + BUILD;
    el.title = 'Built ' + BUILT;
    el.style.cssText =
      'position:fixed;right:6px;bottom:5px;z-index:9999;pointer-events:none;' +
      'font:10px/1 ui-monospace,Menlo,Consolas,monospace;color:rgba(255,255,255,.5);' +
      'letter-spacing:.04em;text-shadow:0 1px 2px rgba(0,0,0,.6)';
    document.body.appendChild(el);
  } catch (e) { /* non-fatal cosmetic */ }
})();

// --- Renderer / scene / camera ---
// N3: install the Neutral tonemapper into the CustomToneMapping slot BEFORE any
// material compiles. No-op on the frame unless ?tm=neutral selects it below.
installNeutralToneMap();
// N2 (renderer contract): request the discrete/high-perf GPU where the platform
// exposes a choice — a free win for the 60fps-on-weak-mobile goal.
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92; // pull exposure back so highlights don't wash out
renderer.outputColorSpace = THREE.SRGBColorSpace; // N2: explicit (was the r160 default) — the seam every colorspace change starts from
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
// Preview convenience: ?rockrun / ?ribcage force that canyon type (level.js) AND
// drop you straight into it — skip the tutorial, auto-launch, and warp to just
// before the first forced canyon. For eyeballing the Sky Canyon on the PR preview.
const PREVIEW_CANYON = urlParams.has('rockrun') ? 'rock'
  : urlParams.has('ribcage') ? 'spine'
  : urlParams.has('flowrun') ? 'flow' : null;
let previewLaunchPending = !!PREVIEW_CANYON;
// N3 tone-map A/B (default ACES unchanged): ?tm=aces|agx|neutral. N1 dither is
// ON by default; ?dither=0 kills it for a clean before/after comparison.
// Graphics effects: apply the player's saved Settings choices; a URL flag (?tm=,
// ?dither=0, ?pfx=batch) overrides for testing. Defaults (dither on, ACES, batch
// off) reproduce the shipped look exactly.
const gfxPref = saveData.settings;
const tmMode = urlParams.get('tm') || gfxPref.toneMap;
if (tmMode) setToneMap(renderer, tmMode);
if (urlParams.get('dither') === '0' || gfxPref.dither === false) setDither(false);
// N4 instanced spark backend (150 draws → 1). Must be set before initParticles.
if (urlParams.get('pfx') === 'batch' || gfxPref.particleBatch === true) setParticleBackend('batch');
const challengeSeedParam = parseInt(urlParams.get('seed'), 10);
const challengeSeed = Number.isFinite(challengeSeedParam) && challengeSeedParam > 0
  ? challengeSeedParam : null;
if (urlParams.has('daily')) game.mode = 'daily';
// Dev seam: unlock every boss in the rush roster (?dev or ?rush=all). Also lets
// ?rush launch a gauntlet straight from the URL for playtesting on the preview.
if (urlParams.has('dev') || urlParams.get('rush') === 'all') setRushUnlockAll(true);
if (urlParams.has('rush')) game.mode = 'rush';

// A brand-new pilot's very first normal run is authored (scripted opening +
// pinned seed) so the first ~90s is intentional, repeatable and QA-able.
const isFirstFlight = () => game.mode === 'normal' && saveData.stats.runs === 0 && !PREVIEW_CANYON;

function seedForRun() {
  if (game.mode === 'daily') return dailySeed();
  if (challengeSeed !== null && game.challengeScore > 0) return challengeSeed;
  if (isFirstFlight()) return CONFIG.seed; // pinned so run 1 is identical every time
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
// PR8 Eternal wisp cosmetic: push the equipped dragon's personal wisp accent +
// brand rune into the lock layer (jade + shared rune unless it's an Eternal-form
// SSSR dragon). Display-only — see wispTintFor/setWispTint (damage is a separate
// arg, so this never touches behaviour). Re-run at boot + on every equip/ascend.
function applyWispCosmetic() {
  const ed = equippedDragon();
  const fl = ed?.model?.formLevel ?? 0;
  const tint = wispTintFor(ed, fl);
  setWispTint(tint);
  setLanceTint(tint);
  setMarkRune(lanceRuneFor(ed, fl));
}
createEnvironment(scene, runSeed);
// N5 sky-IBL: apply the saved toggle (the probe exists now); ?ibl forces it on.
if (urlParams.has('ibl') || gfxPref.skyIbl === true) setSkyProbeEnabled(true);
setupGodRays(scene, camera, getSkyMesh()); // occlusion-masked god-rays (tier 0 + 1)
createWater(scene, 0); // N11: boot at tier0 (768² full-rate mirror); applyQuality retiers
createDragon(scene, equippedDragon(), equippedRider());
initContactShadow(scene);
// N6 hero shadow: apply the saved toggle (the RT exists now); ?shadow forces on.
if (urlParams.has('shadow') || gfxPref.heroShadow === true) setContactShadowSilhouette(true);
// N15 prop AO: apply the saved toggle; ?ao forces on.
if (urlParams.has('ao') || gfxPref.propAO === true) setPropAO(true);
// N8 atmosphere: apply the saved toggle; ?atmos forces on.
if (urlParams.has('atmos') || gfxPref.atmosphere === true) setAtmosphereEnabled(true);
// N9 sky clouds: apply the saved toggle; ?clouds forces on.
if (urlParams.has('clouds') || gfxPref.skyClouds === true) setSkyCloudsEnabled(true);
// N10a water swell: apply the saved toggle; ?swell forces on. Runs after createWater,
// so it rebuilds the (already-built) mesh subdivided; it precedes applyQuality, which
// then sets the LOD tier. geomTier defaults 0, so ?swell boots subdivided at tier0.
if (urlParams.has('swell') || gfxPref.waterSwell === true) setWaterSwell(true);
// N10b water depth: apply the saved toggle; ?depth forces on (live uniform, no rebuild).
if (urlParams.has('depth') || gfxPref.waterDepth === true) setWaterDepth(true);
// N10c foam collars: apply the saved toggle; ?foam forces on (visibility flip).
if (urlParams.has('foam') || gfxPref.waterFoam === true) setWaterFoam(true);
// N11 reflection far-plane clamp: on by default (visually identical — the trimmed
// frustum is entirely past the fog wall); ?reflfar=0 kills it for the perf/visual A/B.
if (urlParams.get('reflfar') === '0') setWaterReflFar(false);
applyDragonStats(equippedDragon());
initRings(scene);
initObstacles(scene);
initHazards(scene);
initPowerups(scene);
initParticles(scene);
initSpeedStreaks(scene);
initEmbers(scene);
initGoldEmbers(scene);
initBoss(scene);
initPbMarker(scene);
applyWispCosmetic();   // seed the equipped dragon's wisp accent + brand rune (PR8)

// Set-piece meshes must exist before the first spawnAhead() call below,
// since the first chunk can contain set-pieces.
const setpieceMeshes = [];

let levelGen = createLevelGen(runSeed, { scripted: isFirstFlight() });
// Gauntlet corridor boundaries queued from level chunks; crossing an end
// alive = a cleared gauntlet (weekly trials, feats, milestones).
const pendingGauntletStarts = [];
const pendingGauntletEnds = [];
// Sky Canyon boundaries: crossing a start widens the chase cam for the run;
// crossing an end restores it.
const pendingCanyonStarts = [];
const pendingCanyonEnds = [];
let canyonStartDist = 0;   // dist of the active run's start marker → drives the eased
                           // rock-lane widen boundary (game.canyonLaneHW)
let bossGraceUntil = 0; // post-boss grace band end-distance (rings/collectibles only)
let rushOnlyBoss = null; // when set, the next rush fights just this ONE boss (roster pick)
function spawnAhead() {
  const lead = Math.max(CONFIG.spawnAhead, player.speed * CONFIG.spawnAheadTime);
  if (levelGen.generatedUntil >= player.dist + lead) return;
  const chunk = levelGen.ensure(player.dist + lead);
  // Boss fight = a CLEAN ARENA: the encounter is the whole show, so no rings,
  // embers, orbs, hazards or set-pieces are laid for the duration. Generation
  // still advances above (the course stays byte-identical for the seed); we just
  // spawn nothing. (Existing collectibles are cleared on 'bossStart' below.)
  if (game.inBoss) return;
  chunk.rings.forEach(addRing);
  // Post-boss grace band: lay the safe/reward content (rings above + orbs/embers/
  // gold below) but SKIP every hazard and structural set-piece until the player has
  // eased back in, so the run doesn't slam back with a wall of obstacles.
  if (player.dist < bossGraceUntil) {
    chunk.orbs.forEach(addOrb);
    chunk.embers.forEach(addEmberLine);
    chunk.goldEmbers && chunk.goldEmbers.forEach(addGoldEmber);
    return;
  }
  // Any base obstacle (gate, pillar, shard, bar) whose dist lands inside a canyon run
  // is skipped — an obstacle on the ring line inside the carved slot / rib tube is an
  // undodgeable spike. Generator output is untouched (determinism-safe); we just don't
  // spawn the flagged ones here.
  const canyonSuppress = chunk.canyonObstacleSuppress && chunk.canyonObstacleSuppress.length
    ? new Set(chunk.canyonObstacleSuppress) : null;
  chunk.obstacles.forEach((o) => {
    if (canyonSuppress && canyonSuppress.has(o.dist)) return;
    addObstacle(o);
  });
  chunk.orbs.forEach(addOrb);
  chunk.embers.forEach(addEmberLine);
  chunk.goldEmbers && chunk.goldEmbers.forEach(addGoldEmber);
  chunk.gauntletStarts && pendingGauntletStarts.push(...chunk.gauntletStarts);
  chunk.gauntletEnds && pendingGauntletEnds.push(...chunk.gauntletEnds);
  chunk.canyonSegments && chunk.canyonSegments.forEach(addCanyonSegment);
  chunk.canyonStarts && pendingCanyonStarts.push(...chunk.canyonStarts);
  chunk.canyonEnds && pendingCanyonEnds.push(...chunk.canyonEnds);
  // Biome hazards spawn ONLY here — below both the inBoss return (clean arena)
  // and the grace-band return above (§5.3): generation stays game-state-pure;
  // suppression is purely a consumption-side concern.
  chunk.hazards && chunk.hazards.forEach(addHazard);
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

// Playtest: ?boss (optionally ?boss=<metres>) pulls the first boss encounter in
// to just after takeoff, so a touch device with no keyboard can reach a fight
// without the debug B key. Default ~180m ≈ a few seconds of flight.
if (urlParams.has('boss')) {
  const d = parseInt(urlParams.get('boss'), 10);
  setBossDebugFirstAt(Number.isFinite(d) && d > 0 ? d : 180);
}
// ?bossIdx=K forces every encounter to BOSS_ORDER[K] (e.g. ?boss&bossIdx=1 =
// Stormrend right after takeoff) so the preview can judge a specific boss.
if (urlParams.has('bossIdx')) {
  const k = parseInt(urlParams.get('bossIdx'), 10);
  if (Number.isFinite(k) && k >= 0) setBossDebugDefIdx(k);
}
// ?bossPhase=N (1-based) opens every encounter fast-forwarded to phase N so a
// late-phase beat is judgeable in seconds (e.g. ?boss&bossIdx=8&bossPhase=3 =
// KARNVOW's fight opening INTO Voidmaw's Verdict).
if (urlParams.has('bossPhase')) {
  setBossDebugPhase(parseInt(urlParams.get('bossPhase'), 10));
}
// ?bossStage=N (1-based) pins the visible STAGE sub-rig of a multi-stage boss (THE UNMASKED:
// 1 eclipse-eye / 2 seraph / 3 unveiling) so a stage is playtestable in a live fight without
// the CP2 dissolve-swap (e.g. ?boss&bossIdx=13&bossStage=2 = fight into the seraph).
if (urlParams.has('bossStage')) {
  setBossDebugStage(parseInt(urlParams.get('bossStage'), 10));
}
// Playtest: ?parry widens the PERFECT-parry window so the V4 snap-brand is
// testable without frame-tight timing. Bare ?parry = the whole reflect window
// (EVERY parry is perfect); ?parry=<rel> sets the perfect rel in world-units
// (shipped LAW is 1.8 ≈ 64ms at bullet speed 28). URL-only, never persisted.
if (urlParams.has('parry')) {
  const v = parseFloat(urlParams.get('parry'));
  setDebugPerfectParryRel(Number.isFinite(v) && v > 0 ? v : CONFIG.BOSS.reflectWindow);
}

// Playtest: ?lab[=bossKey] — THE LANCE LAB, a pacifist practice range for the
// unleash phrase. The boss (default hollowgate: 5 static spread panes) spawns
// shortly after takeoff, never attacks, never takes damage (paint → unleash →
// repaint forever), and the pip cap is forced to 6 so the FULL-cap cadence is
// testable. Painting is pre-unlocked so a cold save can brand from fight one.
// URL-only, never persisted beyond the lockUnlocked flag any lockParts fight
// would set anyway.
if (urlParams.has('lab')) {
  setBossLab(urlParams.get('lab') || '');
  saveData.flags.lockUnlocked = true;
}

// Debug: force Dragon Surge for visual verification
const debugFever = urlParams.get('debug') === 'fever';
if (urlParams.has('debug')) {
  window.__dd = {
    renderer, scene, camera, game, player, save: saveData, emit, on, ui, cameraCtl, claimFeat, obstacleCount, flowColliderBoxes, trailDebug: __trailDebug,
    input,   // capture tools poke input.surgeTap to skip a scripted entrance headless (rAF-throttled flythroughs stall waits otherwise)
    juice: { hitstop, juiceEvent },
    // Audio overhaul debug: v2 flag, worklet-limiter state, underrun beacons.
    audioHealth: () => getAudioHealth(),
    postfx: { setPostTier, kick, kickState, handle: postfx },
    // N4 ParticleBatch seams: fire a burst at a fixed world point in view, and read
    // the backend/visible count + live draw-call total (for the pfx A/B tool + test).
    pfx: {
      stats: particleStats,
      burst: (n = 60) => burst(camera.localToWorld(new THREE.Vector3(0, 0, -30)), 0xffe0a0, { count: n, speed: 12, size: 1.0, life: 1.2 }),
      drawCalls: () => renderer.info.render.calls,
    },
    // N6 hero-shadow seams: silhouette on/off + the RT coverage (proves the pass ran).
    shadow: { on: contactShadowSilhouette, coverage: () => heroShadowCoverage(renderer), maskURL: () => heroShadowMaskURL(renderer), spriteLeak: heroShadowSpriteLeak },
    // Drop straight into a boss fight (also bound to the B key under ?debug).
    spawnBoss: () => { if (game.state === 'playing') forceBoss(player); },
    // Push the boss schedule out of the way (or restore it) so a stretch of
    // course — e.g. the Caldera geyser field — can be flown WITHOUT a boss
    // clearing the hazards. Persists across restarts (debugFirstAt is honoured
    // on reset); pass false to hand the normal schedule back.
    noBoss: (on = true) => setBossDebugFirstAt(on ? Infinity : CONFIG.BOSS.firstAt),
    bossState: () => bossDebugState(),
    // Capture hook: fire one live volley (default 'aimed') to catch body-origin emit + grow-in.
    bossFireNow: (id) => debugFireAttack(id, player),
    // Capture hook: arm a setpiece live (e.g. 'ribThread') to watch the whole moving beat + its bullets.
    bossRunSetpiece: (id) => debugRunSetpiece(id),
    // Capture hook: snap to fight (skip the slow-to-skip entrance headless).
    bossForceFight: () => debugForceFight(player),
    // PR3 lock-fork test seams (headless-deterministic): bank pips, read the aimed-beam
    // part pick against a flight line, fire the Surge climax synchronously.
    bossBankLocks: (n) => debugBankLocks(n),
    // SCAR-BURN seams: the resonant window, live burn state, and a manual loose.
    bossBeatOn: () => debugBeatOn(),
    bossBurns: () => debugBurns(),
    bossLoose: () => debugLoose(),
    bossBeamAimPart: (px, py) => debugBeamAimPart(px, py),
    bossLockCandidates: () => debugLockCandidates(),
    bossPartWorldPos: (part) => debugPartWorldPos(part),
    bossStrikeSurge: () => debugStrikeSurge(),
    bossRaiseShield: () => debugRaiseShield(),
    // PR6 seams: liveness-filtered paintables, shimmer count, runtime def pick.
    bossPaintables: () => debugPaintables(),
    bossShimmerCount: () => debugShimmerCount(),
    bossTetherCount: () => debugTetherCount(),
    // PR8 Eternal-wisp seams: live ribbon/head material colours + the brand rune,
    // and a re-push of the cosmetic after a test swaps the equipped dragon in save.
    wispColors: () => debugWispColors(),
    wispTint: () => wispTint(),
    markRune: () => markRune(),
    refreshWispCosmetic: () => applyWispCosmetic(),
    bossSetDefIdx: (k) => setBossDebugDefIdx(k),
    // PR4a wisp seams: live bullet kinematics (fan-divergence asserts).
    bossBullets: () => debugActiveBullets(),
    // Capture hook: pin/release the charge (mantle) pose for still crops.
    bossPinCharge: (lvl) => setBossDebugCharge(lvl),
    // Capture hook: pin/release a setpiece pose (e.g. the stooping dive) for stills.
    bossPinSetpiece: (pin) => setBossDebugSetpiece(pin),
    bossPinEntrance: (u) => setBossDebugEntrance(u),
    // Capture hook: crack a destructible sub-part live (HOLLOWGATE pane N).
    bossCrackPane: (i) => debugCrackPane(i),
    bossThreadCut: () => debugThreadCut(player),
    bossRestitch: () => debugRestitch(),
    bossBreakFrame: () => debugBreakFrame(player),   // §5i.C rung 12: force the ghost-frame break (honest sacrifice)
    bossFelledLie: () => debugFelledLie(player),      // §5i.C rung 12: force the fake death (paint seal)
    bossLanceState: () => debugLanceState(),          // §5i.C rung 12: pips / ghosts / deflected / candidates / paintables
    bossArmBeamDuel: (t) => debugArmBeamDuel(t),      // §5i.C rung 13: arm the beam duel (fork-extend test)
    bossBeamDuelT: () => debugBeamDuelT(),            // §5i.C rung 13: read the duel window remaining
    bossCrush: (on) => debugCrush(on),                // §CP2-D1: force/clear the sky-crush (high-organ seal test)
    bossCrushOn: () => debugCrushOn(),                // §CP2-D1: read the crush state
    bossSetPhase: (n) => setBossDebugPhase(n),        // §CP2-D2: fast-forward to a phase (P5 survival-seal test); call before bossForceFight
    bossSetStage: (n) => setBossDebugStage(n),        // rung 14: pin/re-pin the visible STAGE sub-rig of THE UNMASKED (live organ-comfort test)
    bossReckoning: () => debugReckoning(),            // rung 14: THE RECKONING relic-collection + burn-unlock state (unmaskedreckoning.mjs)
    bossArenaState: () => ({                           // arena PR-A/B: the arena state (unmaskedarena.mjs + the organ×arena conjunction)
      mix: bossArenaMix(),                             // 0 → 1 (void, the crack) → 2 (heaven, the unveiling)
      kind: (m => m <= 0 ? 'none' : m <= 1 ? 'void' : 'heaven')(bossArenaMix()),
      fade: bossArenaFade(),                           // 1 in-fight · <1 during the natural-kill exhale
      voidSky: !!game.bossVoidSky,                     // god-ray suppression flag (void window: 0.5..1.6)
      heavenRays: game.bossHeavenRays || 0,            // the heaven god-ray swell signal (0..1)
      propBandsHidden: debugArenaProps(),              // F1: the biome prop bands are dark while the arena owns the sky
      skyDim: debugSkyDim(),                           // proves the EMBERTIDE sky-replace channel stayed 0 (disjointness)
      bandDark: bossDebugState()?.bandDark,            // the active dark bullet band (the certified lift at the reveal)
      lift: bossDebugModelLift(),                      // PR-B: the S3 focal-lift state ({k, sclera}) — byte-identity off-heaven
      voidLift: bossDebugModelVoid(),                  // PR-V2: the void rim-light state ({k, rim, rimEm, glow, glowVis}) — byte-identity off-void
      arenaSet: debugArenaSet(),                       // PR-K: the FIRSTBORN SKY set ({built, visible, k, mode, tierHidden}) — hidden off-heaven
      water: { y: debugWaterY(), dropK: getArenaDropK() },   // PR-K: the haze-deck drop (y −30 in the settled heaven, 0 byte-identical off it)
    }),
    bossWingMinY: () => debugWingMinWorldY(),           // ARENA P0: exact wingtip min-world-Y (the S3 haze-deck clearance measure, PR-K)
    bossFell: () => debugFell(),                       // PR-B: force the natural-kill teardown (the only way to exercise the exhale headless)
    forceGameOver: () => { game.state = 'gameover'; },  // PR-B test seam: park the loop in 'gameover' (updateBoss stops) to prove the exhale still decays there (the CP2/Codex blocker: the finale kill jumps straight to gameover)
    bossReset: () => resetBoss(),                      // rung 14: the HARD teardown (game-over / new-run path) — proves the reckoning latch doesn't leak the burn across runs
    // Test seam: skip the attract splash and land on the dashboard hub.
    toHub: () => {
      if (!splashVisible()) return;
      hideSplash();
      cameraCtl.setSplash(false);
      ui.showScreen('start');
    },
  };
  // B = force a boss encounter for hands-on testing.
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyB' && game.state === 'playing') forceBoss(player);
  });
}

// `?cleanshot` — CAPTURE mode for the studio/gate pipeline (§6.10): strip everything that is
// not the dragon so an in-game frame is judgeable — the whole HUD DOM (score chrome, the target
// reticle, onboarding hints, the gesture tutorial + banners all live under #hud), plus the course
// rings and the dragon's own flight-trail scribbles (forced hidden in the loop below). `?wingDebug`
// passes straight through (dragon.js reads it directly), so a clean frame can also pin the wing
// pose. INERT when absent: no cleanshot param → the game is byte-for-byte unchanged.
const cleanShot = urlParams.has('cleanshot');
if (cleanShot) {
  const s = document.createElement('style');
  // Hide every in-game overlay under #hud (stat chrome, reticle, hints, gesture tutorial,
  // banners, vignette/flashes) — but SPARE #screen, the menu container #hud also holds (the
  // TAKE OFF button lives there, so hiding all of #hud would make the run un-startable).
  s.textContent = '#hud > :not(#screen){display:none!important}';
  document.head.appendChild(s);
}

// Performance HUD: an on-screen fps / frame-time / draw-count readout, plus a per-RUN
// WORST-FRAME tracker (min fps + the draws/tris at that frame + p95 frame time) and a
// live list of the active experimental graphics toggles — so a single screenshot
// captures the framerate AND the config that produced it. Enabled by the PERFORMANCE
// HUD Settings toggle OR ?debug=perf; DEFAULT OFF → perfEl stays null → the whole
// per-frame block is skipped and renderer.info.autoReset stays at the three.js
// default, so the shipped frame is byte-identical with zero added cost.
let perfEl = null;
let perfTimer = 0;
const perfStats = makePerfStats(600);
// The gfx line reads each toggle's RUNTIME authority (module getter / uniform), not
// saveData — so it's correct even when a toggle was forced via a ?flag URL param.
const PERF_GFX = [
  ['IBL',  skyProbeEnabled],
  ['SHDW', contactShadowSilhouette],
  ['AO',   () => aoUniform.value > 0],
  ['ATMO', atmosphereEnabled],
  ['CLD',  skyCloudsEnabled],
  ['SWL',  getWaterSwellOn],
  ['DPTH', getWaterDepthOn],
  ['FOAM', waterFoamOn],
];
function setPerfHud(on) {
  if (on && !perfEl) {
    renderer.info.autoReset = false; // accumulate draw counts across all composer passes
    perfEl = document.createElement('div');
    perfEl.className = 'perf-hud';    // test hook
    // Left edge, below the hearts/pause stack (top-left HUD ≈90px in portrait); clear
    // of the top-centre distance + top-right score. pointer-events:none = never eats input.
    perfEl.style.cssText =
      'position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 112px);z-index:99;' +
      'font:12px monospace;color:#8aff9a;background:rgba(0,0,0,0.55);padding:6px 9px;' +
      'border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(perfEl);
    resetPerfStats(perfStats);
    perfTimer = 0;
  } else if (!on && perfEl) {
    perfEl.remove();
    perfEl = null;
    renderer.info.reset();           // flush accumulation
    renderer.info.autoReset = true;  // restore the three.js default for every other reader
  }
}
on('runStart', () => resetPerfStats(perfStats)); // worst/best-frame is per-RUN (O(1) field zeroing, no render effect)
// Boot: either path shows the HUD; default (neither) leaves it off → identity.
if (urlParams.get('debug') === 'perf' || gfxPref.perfHud === true) setPerfHud(true);

initInput();
initTouch(renderer.domElement);
initMouse(renderer.domElement);
initMissions();
initRecords(); // before initFeats: feats read counters records increments
initFeats();
initHints();
initAnalytics();
// First-ever Dragon Surge: the signature peak. A non-blocking flourish names the
// moment mid-flight (the run never pauses); the run-1 recap explains it (recap.js).
on('firstSurge', () => ui.surgeFlourish());
// A boss encounter clears the field for a clean arena (the boss wipes hazards
// itself; here we clear the collectibles so only the fight is on screen).
on('bossStart', () => { resetRings(); resetEmbers(); resetPowerups(); resetGoldEmbers(); resetHazards(); ui.staminaBoss(true); });
let lastFlowMilestone = 0;   // flow-chain HUD milestone latch (reset whenever the chain zeroes)
// A boss never STARTS inside a canyon (boss.js gates on !game.inCanyon), but a canyon
// start marker generated within the spawn-ahead lead can be CROSSED mid-fight — and the
// fight's clearAhead wipes that run's geometry, and its end marker (generated mid-fight)
// is dropped. Flush the pending markers + canyon state on bossStart so a scheduled canyon
// can't half-arm across a fight: no inCanyon/canyonRun stuck after the boss, no soft/eased
// rock wall live in a danmaku fight tuned to the fatal ±13 wall, no one-frame fatal snap
// when the stuck state finally clears while the player is >13.
on('bossStart', () => {
  pendingCanyonStarts.length = 0;
  pendingCanyonEnds.length = 0;
  canyonStartDist = 0;
  if (game.inCanyon) { game.inCanyon = false; sfx.slipstreamStop(); cameraCtl.setCanyon(false); }
  game.canyonRun = null;
  game.canyonLaneHW = null;
  game.canyonRockSoft = false;
  game.flowChain = 0;
  lastFlowMilestone = 0;
});
// FLOW carve chain: a low-noise multiplier pop at every 5th step (and gold at the cap).
// The slipstream SPEED is the real feedback; this just names the climbing multiplier. The
// milestone latch resets on a drop (and on every run-end/boss flush) so re-climbing re-pops.
on('flowChain', ({ chain, mult }) => {
  // Latch on the CAPPED chain so pops stop at the cap (one gold "MAX" pop, not a spam of
  // identical ×3.0 pops that stomp the ring-score popup for the rest of the run).
  const m = Math.floor(Math.min(chain, CONFIG.FLOW.chainCap) / 5);
  if (chain > 0 && m > lastFlowMilestone) {
    lastFlowMilestone = m;
    ui.flowChainPop(`FLOW ×${mult.toFixed(1)}`, chain >= CONFIG.FLOW.chainCap ? 'gold' : 'green');
  }
});
on('flowChainDrop', ({ chain }) => { lastFlowMilestone = Math.floor(chain / 5); });
// KNELLGRAVE's toll-as-world-event (§5d slot 10): the frame FLINCHES on every toll —
// a bloom breath + vignette squeeze (postfx kick preset). Def-gated at the emitter
// (only a def.musicDies boss emits 'bossToll'), so every other fight is untouched.
on('bossToll', () => kick('bossToll'));
// THE LANCE V1 juice: a crisp chime the instant the aim-line locks onto a boss
// organ (paired with the reticle's green snap), and a soft tick on each crack-tick
// the held line chips in a lull — so "you're doing the right thing" is audible.
on('aimLock', (p) => sfx.lockOn?.(!!(p && p.relock)));
// HUNTER'S BRAND sound phrase: set (per paint, rising) → inhale (cap fuse) →
// exhale (cap volley) / fizzle (a lone brand ashing off on decay).
on('lockPaint', (p) => sfx.brandSet?.((p && p.count) || 1));
on('lockCap', (p) => sfx.brandCap?.((p && p.count) || 0, (p && p.fuseDur) || 0));
// A DELIBERATE loose sounds the full exhale — the cap auto-volley, the PR3 manual
// tap-loose, and the Surge fork are all the player's earned release (brandLoose); only
// a lone brand ashing off on decay is the lesser fizzle. PR4b RELEASE PUNCTUATION:
// the deliberate loose also lands a 45ms hitstop + postfx kick (the authored beat —
// release ONLY, never the impacts amid dense bullets) and a jade muzzle flash off
// the dragon's launch shoulder, so the moment reads even in peripheral vision.
const _muzzleV = new THREE.Vector3();
// PR-C: gather-pulse throttle + a cached reduced-motion read (the camera pinch
// is motion; the pose/glow/sparks still carry the inhale for those users).
let gatherT = 0;
const REDUCE_MOTION = !!(globalThis.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
// PR9: lockVolley = the COMMIT (audio schedules against the beat-hold `delay`);
// lockLaunch = the frame the first wisp actually leaves (the eye's release —
// the muzzle flash + juice anchor THERE, after any beat-hold, so sight and
// sound land together on the song's grid).
on('lockVolley', (p) => {
  if (p && (p.source === 'cap' || p.source === 'tap' || p.source === 'fork')) {
    const d = p.delay || 0;
    const wyrm = getLanceProfile() === 'wyrm';
    sfx.brandRiserRelease?.(d, CONFIG.LOCK.releaseGapMs / 1000);   // rise STOPS → the void (inhale is classic under both)
    // The LOOSE sound forks by profile: wyrm plays a lean dry snap ("quiet hands"),
    // classic plays the full launch. The music-bus volleyDuck fires under both.
    (wyrm ? lanceWyrm : sfx).brandLoose?.(p.count, d, !!p.full);
    sfx.volleyDuck?.(d);   // PR7: dip the music ~200ms so the exhale owns the moment
  } else {
    sfx.brandRiserCancel?.();   // decay fizzle: no drop, no void — just let the riser go
    sfx.brandFizzle?.();
  }
});
on('lockLaunch', (p) => {
  if (!p || p.source === 'decay') return;
  juiceEvent('wispVolley');
  _muzzleV.set(player.position.x - 0.6, player.position.y + 0.4, -player.dist);
  burst(_muzzleV, wispTint(), { count: 10, speed: 12, size: 0.8, life: 0.35 });   // accent (jade default, PR8)
  burst(_muzzleV, 0xeafff6, { count: 4, speed: 18, size: 0.5, life: 0.25 });      // white anchor stays white
});
// PR4b: each wisp landing plays a note of the impact ARPEGGIO (k = position in
// the drum-roll window) — N locks land as an ascending riff, not one boom.
// PR9: the tagged FINALE lands the reserved close (tonic + cadence) instead.
// PR-B: the reserved CLIMAX (a FULL volley's last hit) gets the PHYSICAL punch so
// it reads as impact, not just sound — a 90ms hitstop (the game freezes on the
// hit), a jade DOM screen-flash, and a camera lurch. The camera punch is motion,
// so it's gated on reduced-motion; the hitstop + flash-gate live in juice/ui.
on('lockStrike', (p) => {
  // A/B profile dispatch: 'wyrm' routes the IMPACT + FINALE to the boss-body
  // resonator engine (sfxLance2); everything else (juice, flash, camera) is
  // profile-agnostic. 'classic' is the shipped path, byte-identical.
  const eng = getLanceProfile() === 'wyrm' ? lanceWyrm : sfx;
  if (p && p.finale) {
    eng.brandFinale?.(p.n || 0, !!p.full);
    if (p.full) {
      juiceEvent('wispFinale');   // 90ms hitstop + the jade postfx kick
      ui.lanceFlash?.();          // jade screen-flash (reduced-motion gated inside)
      if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
        cameraCtl.punchKick?.();  // the camera lurch — motion, so reduce-motion skips it
      }
    }
  } else eng.brandStrike?.((p && p.k) || 0, (p && p.n) || 1, !!(p && p.full));
});
// Wyrm profile: seed the boss-body resonator on each fight (both profiles call
// setBoss so a mid-fight flip to wyrm lazy-starts the right body) and tear it
// down when the fight ends.
on('bossStart', (p) => lanceWyrm.setBoss(p && p.id));
on('bossEnd', () => lanceWyrm.bossVoiceEnd());
// A/B HOTKEY (Shift+L): flip the lance sound profile mid-fight — the only way to
// judge "satisfying vs annoying" is to switch inside the same volley cadence
// without losing fight state (a URL reload can't). Self-contained toast so it has
// no coupling to the HUD internals. Toggling away from wyrm tears its resonator
// down so a stale body never rings under the classic path.
let _lanceToastEl = null;
function _lanceToast(msg) {
  if (!_lanceToastEl) {
    _lanceToastEl = document.createElement('div');
    _lanceToastEl.style.cssText =
      'position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:120;' +
      'font:600 15px system-ui,sans-serif;color:#eafff6;background:rgba(8,20,16,0.82);' +
      'padding:8px 16px;border-radius:8px;pointer-events:none;transition:opacity .3s;letter-spacing:.02em';
    document.body.appendChild(_lanceToastEl);
  }
  _lanceToastEl.textContent = msg;
  _lanceToastEl.style.opacity = '1';
  clearTimeout(_lanceToastEl._t);
  _lanceToastEl._t = setTimeout(() => { if (_lanceToastEl) _lanceToastEl.style.opacity = '0'; }, 1400);
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyL' && e.shiftKey && !e.repeat) {
    if (getLanceProfile() === 'wyrm') lanceWyrm.bossVoiceEnd();   // stand the resonator down before leaving wyrm
    const p = toggleLanceProfile();
    _lanceToast('Lance SFX: ' + (p === 'wyrm' ? 'WYRM (boss-body)' : 'CLASSIC'));
  }
});
// PR3: loosing onto a SEALED boss can't take — a soft muffled thunk names the miss;
// the pips are kept (the lock layer never wastes them), the reticle row shakes once.
// PR9: a live riser stands down on any non-release exit (the watchdog self-fade
// covers the event-less exits — death/transition mid-fuse).
// (PR-C: the chord-voice flush that lived here died with the chord machinery —
// the finale is a one-shot detonation now, nothing sustains to strand.)
on('lockSealed', () => { sfx.brandRiserCancel?.(); sfx.brandSeal?.(); });
on('lockLost', () => sfx.brandRiserCancel?.());
on('bossEnd', () => sfx.brandRiserCancel?.());
on('lockTick', () => sfx.lockTick?.());
// Boss over → resume the course FRESH from here (the arena stretch was suppressed;
// without this the world is blank until the player catches up to the old cursor).
// A grace band after it spawns rings/collectibles ONLY (no hazards) so the player
// eases back into the run instead of a wall of obstacles the instant it dies.
on('bossEnd', () => {
  levelGen.resume(player.dist);
  // Rush = no obstacle course ever (rings/orbs only); a normal run gets a short
  // hazard-free grace band before the course eases back in.
  bossGraceUntil = game.mode === 'rush' ? Number.MAX_SAFE_INTEGER : player.dist + CONFIG.BOSS.postGrace;
  ui.staminaBoss(false);   // fade the stamina bar back in (same animation, reversed)
  // Guaranteed speed-boost pickups in the grace band: the player carries Dragon
  // Surge out of the kill, and these keep speed + stamina topped up as the course
  // eases back in (so the momentum from the fight doesn't just fizzle).
  addOrb({ x: 0, y: player.position.y, dist: player.dist + 22 });
  addOrb({ x: 0, y: player.position.y, dist: player.dist + 42 });
  spawnAhead();
});
// Boss Rush WON — every unlocked boss felled. End the run cleanly as a VICTORY
// (no crash): bank the clear, then enter the game-over freeze so the normal recap
// pipeline (settleRun) pays out the haul. The recap reads game.rushCleared.
on('rushClear', (e) => {
  if (game.mode !== 'rush' || game.state !== 'playing') return;
  const solo = !!(e && e.solo);
  game.rushCleared = true;
  game.rushSolo = solo;                     // recap copy: solo → the boss name, full → RUSH CLEAR
  game.rushBossName = (e && e.name) || '';
  // GAUNTLET-CLEAR rewards (lifetime count, best time, the clear feat) are for the
  // WHOLE roster only — a solo/practice pick must not overwrite the gauntlet best
  // or award the clear. Both still end the run on a win recap.
  if (!solo) {
    if (!saveData.bossRush) saveData.bossRush = { beaten: [], cleared: 0, bestClearMs: 0 };
    saveData.bossRush.cleared = (saveData.bossRush.cleared || 0) + 1;
    const ms = Math.round(game.time * 1000);
    if (!saveData.bossRush.bestClearMs || ms < saveData.bossRush.bestClearMs) saveData.bossRush.bestClearMs = ms;
    persist();
    emit('rushCleared', { count: e && e.count });   // feats hook (gauntlet only)
  }
  sfx.bossDefeat?.();
  cameraCtl.shake?.(1.4);
  game.state = 'gameover';
  game.deathCause = 'rushclear';
  game.deathFreezeTimer = CONFIG.deathFreezeDuration;
});
ui.init({
  getCard: makeShareCard,
  onRestart: restart,
  onStart: (mode) => startGame(mode),
  rushUnlocked: () => rushUnlocked(),   // gate the BOSS RUSH rail entry (beaten a boss / dev)
  rushInfo: () => rushRosterInfo(),     // roster + best time for the pre-launch panel
  onStartRush: (only, stage) => {
    rushOnlyBoss = only || null;
    // Dev stage-jump (rush picker, ?dev): pin which STAGE sub-rig a multi-stage boss shows,
    // so THE UNMASKED's stage 2 (seraph) / 3 (unveiling) are playtestable in a live fight.
    // stage 1 (or unset) → the boss's default. Set fresh per launch so no stale pin leaks.
    setBossDebugStage(stage || 1);
    startGame('rush');
  },  // pick one boss (or all), optionally pinned to a stage
  onEquipDragon: () => {
    rebuildDragon(equippedDragon(), equippedRider(), player);
    applyDragonStats(equippedDragon());
    applyWispCosmetic();   // PR8: re-push the new dragon's wisp accent + rune
  },
  // Shop browse: show the inspected dragon (at its form/tier) in the live menu scene.
  // ONLY rebuilds the dragon mesh — never the run's obstacles — so walls are untouched.
  // Does NOT persist the equip; leaving the shop restores the equipped dragon.
  onPreviewDragon: (def) => rebuildDragon(def, equippedRider(), player),
  onRestoreMenuDragon: () => rebuildDragon(equippedDragon(), equippedRider(), player),
  onEquipRider: () => rebuildDragon(equippedDragon(), equippedRider(), player),
  onAscend: (key) => {
    const def = DRAGONS[key] || DRAGONS.azure;
    if (ascend(key, def.cost)) {
      rebuildDragon(equippedDragon(), equippedRider(), player);
      applyDragonStats(equippedDragon());
      applyWispCosmetic();   // PR8: ascending TO Eternal unlocks the personal wisp
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
  // Graphics-effects toggles from Settings. Tone-map + dither apply live (three
  // recompiles on toneMapping change); particle-batch needs a re-init so Settings
  // reloads for that one (like DEV mode).
  onGraphicsChange: (kind, value) => {
    if (kind === 'toneMap') setToneMap(renderer, value);
    else if (kind === 'dither') setDither(value);
    else if (kind === 'skyIbl') setSkyProbeEnabled(value);
    else if (kind === 'heroShadow') setContactShadowSilhouette(value);
    else if (kind === 'propAO') setPropAO(value);
    else if (kind === 'atmosphere') setAtmosphereEnabled(value);
    else if (kind === 'skyClouds') setSkyCloudsEnabled(value);
    else if (kind === 'waterSwell') setWaterSwell(value);
    else if (kind === 'waterDepth') setWaterDepth(value);
    else if (kind === 'waterFoam') setWaterFoam(value);
    else if (kind === 'perfHud') setPerfHud(value); // on-screen fps/frame-time readout (no render effect)
  },
  // MODEL DETAIL (geometry LOD) changed in Settings. The player is in a menu, so
  // rebuild the dragon at the new level immediately (no 4s gate) for instant
  // feedback; AUTO drift between runs is handled by updateModelDetail's gate.
  onModelDetailChange: () => applyModelDetail(true),
  onPause: () => pauseManual(),
  onResume: () => resumeFromPause(),
  onQuitToMenu: () => restart({ toMenu: true }),   // pause → back to the start-screen rail
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
  // NOTE: while a subscreen (shop/settings/…) is open — even one opened FROM pause —
  // this global handler must NOT fire: the subscreen owns its taps (rail, cards, its
  // own backdrop-to-go-back). Without the !inSubscreen guard, a tap on the shop's
  // dragon rail (opened from pause) was swapping back to the pause overlay before the
  // rail's pointerup ran (the gameover path already had this guard, which is why only
  // the pause path was broken).
  if (game.state === 'paused' && !ui.inSubscreen()) {
    // Tutorial pause: only performing the taught gesture resumes — a blank tap
    // must not skip the lesson (gestureTutorial.js handles the resume).
    if (game.pauseReason === 'tutorial') return;
    resumeFromPause();
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
    emit('restartTapped');
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
  if (modeChanged || mode === 'daily' || mode === 'rush') {
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
let fxEnv = 0;   // smoothed speed-tunnel FX envelope (fast attack, slow release) — feel-v5

function restart(opts = {}) {
  // toMenu: reset the world but land on the START SCREEN (attract scene + rail)
  // instead of launching a run — the "Exit to Menu" path from the pause overlay,
  // which is the ONLY way back to the rail (and BOSS RUSH) mid-session.
  const toMenu = !!opts.toMenu;
  if (toMenu) game.mode = 'normal';   // leaving a run returns to the normal menu context
  game.reset();
  // Daily Challenge modifier (deterministic per UTC day) → run-level multipliers.
  game.dailyMod = game.mode === 'daily' ? todaysDailyMod() : null;
  game.mods = dailyMods(game.dailyMod);
  player.reset();
  resetDragon(player);
  resetRings();
  resetObstacles();
  resetSpeedStreaks();
  fxEnv = 0;
  sfx.slipstreamStop();
  resetHazards();
  resetPowerups();
  resetParticles();
  resetCollision();
  resetEmbers();
  resetGoldEmbers();
  resetBoss();
  resetContactShadow();
  runSeed = seedForRun();
  game.runSeed = runSeed;
  resetEnvironment(runSeed);
  clearDeath(true); // instant color restore (cameraCtl.init below resets the death cam)
  pendingGauntletStarts.length = 0;
  pendingGauntletEnds.length = 0;
  pendingCanyonStarts.length = 0;
  pendingCanyonEnds.length = 0;
  canyonStartDist = 0;
  lastFlowMilestone = 0;
  bossGraceUntil = 0;
  // Cull old set-pieces
  for (const sp of setpieceMeshes) scene.remove(sp.object);
  setpieceMeshes.length = 0;
  levelGen = createLevelGen(runSeed, { scripted: isFirstFlight() });
  // Boss Rush: the whole run is bosses + ring breathers, NO obstacle course — so
  // pin the grace band open (spawnAhead lays rings/orbs only while dist < it) and
  // arm the gauntlet driver, which schedules the first boss a short warm-up ahead.
  if (game.mode === 'rush') {
    bossGraceUntil = Number.MAX_SAFE_INTEGER;
    startBossRush(player, rushOnlyBoss);   // rushOnlyBoss = a single-boss pick, or null for all
    // Do NOT consume the solo pick here: FLY AGAIN (a plain restart) after dying in
    // a single-boss fight must RE-FIGHT that boss, not silently fall back to the
    // full gauntlet from Voidmaw. Every menu launch (onStartRush) sets rushOnlyBoss
    // fresh (a boss id for solo, null for all), and Exit-to-Menu flips mode→normal,
    // so the pick only persists across retries of the same run — exactly the intent.
  }
  spawnAhead();
  cameraCtl.init(camera, player);
  boostWasActive = false;
  currentBiome = 0;
  if (toMenu) {
    // Back to the main menu: the attract framing + the start-screen rail, so a
    // player mid-run can reach SHOP / DAILY / BOSS RUSH (the rail lives only here).
    game.state = 'ready';
    game.pauseReason = '';
    discardNextDelta = true;      // swallow the pause-gap dt spike on the first menu frame
    cameraCtl.setSplash(false);
    music.startMenuTheme?.();
    ui.showScreen('start');
  } else {
    ui.hideScreen();
    game.state = 'playing';
    emit('runStart');
  }
}

// Run-end settle pipeline — the ORDER IS A CONTRACT:
// bests first (lifetime stats feed milestones), bank before mission totals
// display, daily before weekly (the daily-count trial reads firstToday),
// XP/levels before feats, feats LAST (they see everything else's writes).
function settleRun() {
  resetBoss();                                         // tear down any boss left mid-fight
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
  // Run-1 recap names the signature peak once (peak-end). recordBests() has
  // already bumped stats.runs, so the just-finished first run reads as runs===1.
  const firstSurgeExplain =
    saveData.stats.runs === 1 && game.surgesRun > 0 && !saveData.flags.celebratedFirstSurge;
  if (firstSurgeExplain) saveData.flags.celebratedFirstSurge = true;
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
    firstSurgeExplain,
  };
  emit('runSettled', { runs: saveData.stats.runs, score: Math.floor(game.score), dist: Math.floor(game.distance) });
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
  // During a tutorial pause, the gesture tutorial owns input — keys reach
  // input.js for gesture detection, but the pause/resume/radio shortcuts here
  // must not fire (the taught gesture is what resumes play).
  if (game.pauseReason === 'tutorial') return;
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

// Tutorial freeze: like a manual pause but with its own reason, no pause menu,
// and music left running (the run is only briefly held to teach one gesture).
function pauseForTutorial() {
  if (game.state !== 'playing') return;
  game.state = 'paused';
  game.pauseReason = 'tutorial';
  game.hitstopTimer = 0;
  boostWasActive = false;
}
function resumeFromTutorial() {
  if (game.state !== 'paused') return;
  discardNextDelta = true; // zero the first post-pause frame so there's no dt jump
  game.pauseReason = '';
  game.state = 'playing';
}
initGestureTutorial({ onPause: pauseForTutorial, onResume: resumeFromTutorial });

// Background/foreground handling. pauseForBackground() only shows the pause overlay
// during an active run, so the audio suspend (music.pauseForBackground) MUST be called
// directly too — otherwise backgrounding from the menu/shop leaves the music scheduler
// running while the browser throttles it, garbling the track (esp. mobile Safari). On
// return, resume audio unless a run is sitting paused behind its overlay (the Resume
// tap restarts that one, and the tap gesture re-unlocks iOS audio).
function onBackground() { pauseForBackground(); music.pauseForBackground(); }
// ALWAYS resume audio on return — even if a run is sitting paused behind its overlay.
// resumeFromBackground() only ARMS the intent + resumes the context; it never rebuilds the
// scheduler unless the context is genuinely running (so no iOS garble). Skipping it while
// paused left resumeMusicPending un-armed, so the later Resume tap could never restart music.
function onForeground() { music.resumeFromBackground(); }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) onBackground(); else onForeground();
});
window.addEventListener('pagehide', onBackground);
window.addEventListener('pageshow', onForeground);
window.addEventListener('blur', onBackground);
window.addEventListener('focus', onForeground);

// --- Main loop ---
const clock = new THREE.Clock();
let sprayTimer = 0;
const sprayPos = new THREE.Vector3();
const _sunProj = new THREE.Vector3();   // sun world dir → screen NDC (god-rays)
const _camFwd = new THREE.Vector3();      // camera forward, for the sun-facing gate
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
  setBossQuality(QUALITY_SCALARS[tier]);
  setContactShadowQuality(QUALITY_SCALARS[tier]);
  renderer.setPixelRatio(PIXEL_RATIOS[tier]);
  setPostTier(tier);
  setPostPixelRatio(PIXEL_RATIOS[tier]);
  setWaterReflective(tier); // N11: tier0 768² full-rate · tier1 384² half-rate · tier2 cheap quad
  setWaterSwellQuality(tier); // N10a: tier0 96×160 / tier1 48×80 / tier2 flat (swell off)
  setWaterFoamQuality(tier); // N10c: foam at tier0/1, off at tier2
  setAmbientQuality(QUALITY_SCALARS[tier]);
  setAtmosphereQuality(tier); // N8: tier2 drops heightK/inscatter (keeps far-color mix)
  setSkyCloudQuality(tier); // N9: tier0 full / tier1 fewer octaves+no warp / tier2 off
  setArenaSetQuality(tier); // ARENA PR-H1/H2: tier2 drops the heaven's holy architecture (palette + rays carry it)
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

// --- Model detail (geometry LOD): more triangles on idle high-end GPUs ---
// The render TIER measures whether the device can sustain 60fps; this maps it to
// how many triangles the dragon mesh is worth (tier0→ULTRA, tier1→HIGH, tier2→LOW)
// — or a manual MODEL DETAIL override pins it. Changing level means REBUILDING the
// mesh, which we only ever do off the active chase camera and after the new level
// has held for ~4s, so a transient FPS dip can't thrash a costly rebuild and a
// rebuild never hitches a live run. HIGH == today's geometry (no regression).
let liveModelDetail = 'high';   // the level currently built into the live dragon
let modelDetailTimer = 0;
function applyModelDetail(force) {
  const want = resolveDetail(saveData.settings.modelDetail, qualityTier);
  if (want === liveModelDetail) return false;
  // The seatbelt (L10): a rebuild swaps the whole mesh, so never under the active
  // camera. `force` (a manual Settings change, always from a menu) skips the gate.
  if (!force && game.state === 'playing') return false;
  liveModelDetail = want;
  setDragonModelDetail(want);
  rebuildDragon(equippedDragon(), equippedRider(), player);
  return true;
}
function updateModelDetail(dt) {
  const want = resolveDetail(saveData.settings.modelDetail, qualityTier);
  if (want === liveModelDetail || game.state === 'playing') { modelDetailTimer = 0; return; }
  modelDetailTimer += dt;
  if (modelDetailTimer >= 4) { applyModelDetail(false); modelDetailTimer = 0; }
}

function tick() {
  requestAnimationFrame(tick);
  // Preview auto-launch (?rockrun / ?ribcage): once the menu is ready, take off and
  // warp to just before the first forced canyon so the link lands you right in it.
  if (previewLaunchPending && game.state === 'ready') {
    previewLaunchPending = false;
    setBossDebugFirstAt(Infinity); // no boss interrupts while eyeballing the canyon (persists across restarts)
    startGame('normal');
    if (game.state === 'playing') player.dist = 250; // canyon is forced at ~340 → a short lead-in
  }
  // rawDt drives FPS metering and UI; simDt (scaled by near-death slow-mo)
  // drives every world/gameplay update.
  let rawDt = Math.min(clock.getDelta(), 0.05);
  if (discardNextDelta) {
    discardNextDelta = false;
    rawDt = 0;
  }
  updateQuality(rawDt);
  // The speed-tunnel wind only lives during active play (death/pause/menu silence it;
  // start/exit are handled on the canyon crossings). Idempotent when already stopped.
  if (game.state !== 'playing') sfx.slipstreamStop();
  updateModelDetail(rawDt);

  // Shop hero shot: hide the loose gameplay FX — collectible rings + the dragon's own
  // flight trail — for a clean static dragon. (Obstacles are NOT touched — the game
  // manages their visibility, and they're the course "walls" we must keep.)
  // IMPORTANT: only HIDE the dragon FX (at the shop). Do NOT force them visible every
  // frame during play — the trail/ember emitters allocate sprites via
  // find(s => !s.visible), so marking every sprite visible=true each frame starves
  // that allocator (no free sprite → nothing emits), which silently killed the
  // boost / speed / ember trails. The emitters re-show their own sprites on emit, so
  // leaving the shop needs no force-show.
  const hideShopFx = ui.atShop() && game.state !== 'playing';
  setRingsVisible(!hideShopFx && !cleanShot);   // cleanshot: no course rings in a capture frame
  if (hideShopFx || cleanShot) setDragonFxVisible(false);   // …and no trail scribbles over the dragon

  // Slow-mo bookkeeping runs in REAL time so 0.6s of dilation is 0.6s felt.
  if (game.slowMoTimer > 0) {
    game.slowMoTimer -= rawDt;
    game.timeScale = game.slowMoScale ?? 0.35;   // caller may deepen it (boss cinematic)
    game.hitstopTimer = 0; // slow-mo wins: kill any in-flight impact freeze
    if (game.slowMoTimer <= 0) { setSlowMo(false); game.slowMoScale = null; }
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
    updateBoss(dt, player, clock.getElapsedTime(), camera);
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

    // Sky Canyon boundaries: widen the chase cam through the run so the twisty
    // gaps read clearly, then restore. Counted so nested canyons stay balanced.
    while (pendingCanyonStarts.length && player.dist >= pendingCanyonStarts[0].dist) {
      const st = pendingCanyonStarts.shift();
      game.canyonRun = st.run;  // 'spine' | 'rock' → spine-only slipstream
      canyonStartDist = st.dist; // ease-in anchor for the rock-lane widen
      game.inCanyon = true;
      cameraCtl.setCanyon(true);
      if (game.canyonRun === 'spine' || game.canyonRun === 'flow') sfx.slipstreamStart(); // speed-tunnel / flow-carve wind
      // Entry beat: a soft wind/mist puff + a small shake as you cross the threshold
      // ("you're entering something ancient"). Subtle — within the juice budget.
      cameraCtl.shake(0.5);
      // Flow flashes its slip-cyan signature at the threshold; rock/spine keep the bone puff.
      burst(player.position, game.canyonRun === 'flow' ? 0x59d8ff : 0xcdd9ec, { count: 14, speed: 9, size: 1.1 });
    }
    while (pendingCanyonEnds.length && player.dist >= pendingCanyonEnds[0]) {
      pendingCanyonEnds.shift();
      game.inCanyon = false;
      game.canyonRun = null;
      game.flowChain = 0;   // the carve chain lives only within a flow run (best is kept)
      lastFlowMilestone = 0;
      sfx.slipstreamStop();
      cameraCtl.setCanyon(false);
      // Exit burst: a puff of bone dust as you break out into open sky (release).
      burst(player.position, 0xe7dcc0, { count: 18, speed: 14, size: 1.0 });
    }

    // Rock-run lane WIDEN: ease the effective fatal wall 13→canyonRockLaneHalfWidth→13
    // over the run's ±40m entry/exit bands (the boundary markers sit exactly ±40m from
    // the first/last ring, and the rock geometry's wide halves are pinned strictly inside
    // that window — canyonMath rockSlicePlan — so the eased wall is ALWAYS ≥ the built
    // channel). Distance-based → speed-independent + deterministic. Guards: rock runs
    // only (spine keeps its own tube), NOT during a boss (a fight is tuned to the fatal
    // ±13 wall), only when the v2 carved-slot geometry is built (v1 rollback assumes ±13),
    // and only when the dial actually widens. canyonRockSoft flags the WHOLE rock run as
    // clamp+chip (never fatal), independent of the nullable eased width.
    if (game.inCanyon && game.canyonRun === 'rock' && !game.inBoss &&
        CONFIG.canyonRockV2 && CONFIG.canyonRockLaneHalfWidth > CONFIG.laneHalfWidth) {
      const sm = (u) => { const c = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };
      const kIn = sm((player.dist - canyonStartDist) / 40);
      const kOut = pendingCanyonEnds.length ? sm((pendingCanyonEnds[0] - player.dist) / 40) : 1;
      const eff = CONFIG.laneHalfWidth +
        (CONFIG.canyonRockLaneHalfWidth - CONFIG.laneHalfWidth) * Math.min(kIn, kOut);
      game.canyonLaneHW = eff > CONFIG.laneHalfWidth + 0.01 ? eff : null;
      game.canyonRockSoft = true;
    } else {
      game.canyonLaneHW = null;
      game.canyonRockSoft = false;
    }

    // Boost start: camera kick + whoosh SFX
    if (player.boosting && !boostWasActive) {
      cameraCtl.boostKick();
      sfx.boostStart();
    }
    boostWasActive = player.boosting;

    // Barrel roll start: camera lean, whoosh, style bonus + a hard burst of air
    if (player.rollJustStarted) {
      player.rollJustStarted = false;
      const dir = player.roll ? player.roll.dir : 1;
      cameraCtl.rollKick(dir);
      sfx.roll();
      rollWake(player.position, dir, 12);   // initial turbulence puff
      const bonus = Math.round(CONFIG.rollBonus * game.combo * game.scoreMult);
      game.score += bonus;
      game.rolls = (game.rolls || 0) + 1;
      ui.rollPopup(bonus);
      emit('roll');
    }
    // Turbulent air trails for the length of the roll — a continuous vapor wake torn
    // off the wings (power being generated), not just a one-frame puff.
    if (player.roll) rollWake(player.position, player.roll.dir, 4);

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
        // In a boss the surge is graze-charged, so empty the meter when it ends —
        // the next Surge must be re-earned by grazing (no permanent hyper).
        if (game.inBoss) { game.consecutiveRings = 0; game.grazeCharge = 0; }
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

  // Run-1 gesture tutorial: checks step triggers while playing and gesture
  // completion while frozen (self-gates; first flight only).
  updateGestureTutorial(player);

  // The SHOP is a clean menu showcase over WHATEVER state we came from (ready, paused
  // mid-run, or game-over): render + animate the live scene even while 'paused', so the
  // dragon flaps in the astral biome instead of a frozen, cluttered run frame.
  if (game.state !== 'paused') {
    // Cull old set-pieces
    for (let i = setpieceMeshes.length - 1; i >= 0; i--) {
      if (setpieceMeshes[i].dist < player.dist - CONFIG.cullBehind - 200) {
        scene.remove(setpieceMeshes[i].object);
        setpieceMeshes.splice(i, 1);
      }
    }

    const t = clock.getElapsedTime();
    // ASHTALON overtake: turn the dragon+rider to face the hunter as it sweeps past
    // (a clamped glance around the close pass — never a full backward flip).
    const ov = cameraCtl.overtakeState;
    if (ov) {
      const dx = ov.bx - player.position.x, dz = ov.bz - player.position.z;
      // A script may drive its own look-window (EITHERWING's two-beat reveal needs the
      // head-turn open across BOTH reveals); ASHTALON leaves lookWin undefined and keeps
      // its single-glance ramp, so its golden trace is untouched.
      const win = ov.lookWin !== undefined
        ? ov.lookWin
        : Math.max(0, Math.min(1, (ov.k - 0.20) / 0.12, (0.86 - ov.k) / 0.12));  // ramp in/out around the pass
      const yaw = Math.max(-0.7, Math.min(0.7, Math.atan2(-dx, -dz)));                     // face the boss, clamped
      setDragonLook(win > 0 ? yaw * win : null);
    } else setDragonLook(null);
    // PR-C THE VISIBLE INHALE: feed the lance cap-fuse progress into the dragon
    // rig BEFORE updateDragon (torso arch + wing mantle + jade glow), pulse the
    // gather sparks into the launch shoulder (the exact point the exhale muzzle
    // burst fires from), and pinch the camera. lockHudState is read here and
    // reused below for the dwell hum. Off (0) outside a fight / when sealed /
    // in v1 — the rig's inhale channel is byte-inert at 0.
    const lh = (game.inBoss && game.state === 'playing') ? lockHudState() : null;
    const fuse01 = UNLEASH_V2 && lh && lh.active && !lh.ashen ? (lh.fuse01 || 0) : 0;
    setDragonInhale(fuse01);
    cameraCtl.setInhale?.(REDUCE_MOTION ? 0 : fuse01);
    if (fuse01 > 0) {
      gatherT -= dt;
      if (gatherT <= 0) {
        gatherT = 1 / (CONFIG.LOCK.gatherRateHz ?? 8);
        _muzzleV.set(player.position.x - 0.6, player.position.y + 0.4, -player.dist);
        gatherPulse(_muzzleV, wispTint(), (CONFIG.LOCK.gatherCountBase ?? 2) * Math.max(1, lh.pips || 0) / 2, fuse01);
      }
    }
    updateDragon(dt, player, t);
    updateParticles(dt, camera);
    // Normalize the slip envelope by the ACTIVE run's max slip (flow ramps to a different
    // ceiling than spine) so the speed FX read 0..1 in both.
    const slipRef = game.canyonRun === 'flow'
      ? CONFIG.FLOW.slipPerChain * CONFIG.FLOW.chainCap
      : CONFIG.canyonSpineSlip - 1;
    // Clamp to 1: the frame a capped flow run ends, slipRef flips to spine's smaller
    // denominator while canyonSlip is still decaying from 1.40 → slipMix would overshoot >1
    // and flash the speed streaks past their designed max in the exit air.
    const slipMix = Math.min(1, Math.max(0, player.canyonSlip - 1) / Math.max(1e-6, slipRef));
    // The "walls whipping past" FX (streaks, CSS lines, aberration, rib-flutter) fade
    // out in a genuinely rib-free bridged gap so a long break stops screaming SPEED at
    // empty air — but the slip itself (physics), FOV and the wind loop stay on the raw
    // slipMix, since you ARE still moving faster there. presence=1 inside any rib band.
    // Keep sampling presence while the envelope is still decaying so the FX ease DOWN
    // after slip hits zero (leaving the tunnel) instead of snapping off at the last band.
    const wallPresence = (slipMix > 0.01 || fxEnv > 0.01) ? spineWallPresenceAt(player.dist) : 0;
    const fxMix = slipMix * wallPresence;
    // Smoothed envelope: fast attack (~0.3s), slow release (~0.9s) → the whole speed-FX
    // family ramps up as you accelerate and fades gracefully leaving the tunnel, never 1/0.
    fxEnv += (fxMix - fxEnv) * (1 - Math.exp(-(fxMix > fxEnv ? 6 : 1.8) * dt));
    player.tunnelFxMix = fxEnv;               // streaks/postfx/ui.js all read this envelope
    updateSpeedStreaks(player, fxEnv);
    if (slipMix > 0.01) sfx.slipstreamUpdate(slipMix, player.speed / 6, wallPresence); // wind on slip, flutter on presence
    const obstacleSpeedNorm = (player.speed - CONFIG.baseSpeed) / (CONFIG.orbSpeed - CONFIG.baseSpeed);
    updateObstacles(dt, t, player.dist, obstacleSpeedNorm, slipMix);
    updateHazards(dt, player, t);
    const atShop = ui.atShop();   // shop open → static hero framing (no orbit)
    cameraCtl.update(dt, player, game.state === 'ready' || atShop, atShop);
    syncSkyRig(camera);   // EMBERTIDE-as-sky: re-centre the dome on the camera AFTER it settles (no seam)
    if (introPlaying && !cameraCtl.introPlaying) introPlaying = false;
    updateReticle(player, game.state === 'playing');
    // LANCE dwell hum (PR7): drive the acquisition-progress whisper from HERE,
    // not reticle.js — the reticle early-returns when disabled, and this cue's
    // whole job is the no-reticle acquire loop. Silences on lock (aimHeld → the
    // chime), on sealed/muted, and on any non-fight/paused frame (0 stops it).
    // v3: a warm re-grab (lh.relock — the organ a held line just let go of) drives
    // the hum to 0, so weaving away and back is a SILENT re-acquire — the reticle
    // fill is the only progress channel there (owner: the re-firing hum was grating).
    const humOn = lh && lh.active && !lh.aimHeld && !lh.ashen && !lh.muted && !(LANCE_V3 && lh.relock);
    sfx.dwellHum?.(humOn ? lh.dwell : 0);   // (lh read above, pre-updateDragon)
    updateArenaExhale(dt);   // ARENA (PR-B): decay the natural-kill exhale in ALL states — the finale/rush kill jumps straight to 'gameover' where updateBoss is dead, so the fade must run here or the sky strands
    updateEnvironment(dt, camera, t, player.dist, game.feverActive, player.speed, bossGradeTarget(), bossArenaMix(), bossArenaFade());
    updateWater(dt, player.dist, t, scene.fog, bossArenaMix(), bossArenaFade());   // ARENA (PR-K): the FIRSTBORN SKY haze-deck drop rides the same stateless window (threaded here — water.js must not import boss.js)
    updateContactShadow(dt, player);

    // God-rays: project the sun to screen space and gate intensity by how
    // front-facing it is (postfx disables the pass + mask render when it's ~0).
    camera.updateMatrixWorld();
    camera.getWorldDirection(_camFwd);
    const sunFacing = _camFwd.dot(SUN_DIR);
    if (sunFacing > 0.05) {
      _sunProj.copy(SUN_DIR).add(camera.position).project(camera);
      // N9: ease the shafts down as clouds drift across the sun (damped in env;
      // getCloudSunCover() is 0 when clouds are off → shipped intensity).
      const cloudGate = 1 - 0.75 * getCloudSunCover();
      setGodRaySun(_sunProj.x * 0.5 + 0.5, _sunProj.y * 0.5 + 0.5,
        Math.min(sunFacing, 1) * 0.6 * cloudGate);
    } else {
      setGodRaySun(0.5, 0.8, 0);
    }
    setGodRayBoost(game.bossHeavenRays || 0);   // ARENA (PR-B): THE UNVEILED HEAVEN swells the shafts (hard-capped; the fairness probe is the authority)

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
  updatePostFX(dt, speedNorm, game.feverActive, rawDt, bossGradeTarget(),
    player.tunnelFxMix || 0); // spine slipstream 0→1, faded out in rib-free bridged gaps
  renderHeroShadow(renderer); // N6: render the dragon silhouette to its RT before the main pass (no-op unless enabled)
  renderPostFX();

  if (perfEl) {
    // rawDt is clamped to 0.05 (a 20fps floor) so a backgrounded/stalled frame can't
    // poison the min; rawDt==0 while paused (perfFrame ignores ms<=0).
    if (rawDt > 0) perfFrame(perfStats, rawDt * 1000, renderer.info.render.calls, renderer.info.render.triangles);
    perfTimer -= rawDt;
    if (perfTimer <= 0) {
      perfTimer = 0.5;
      const s = perfSummary(perfStats);
      const gfx = PERF_GFX.filter(([, f]) => f()).map(([n]) => n).join(' ') || '—';
      const tone = renderer.toneMapping === THREE.AgXToneMapping ? 'soft'
                 : renderer.toneMapping === THREE.CustomToneMapping ? 'vivid' : 'aces';
      perfEl.textContent =
        `fps   ${fpsAvg.toFixed(0)}  avg ${s.avgFps.toFixed(0)}\n` +
        `min   ${s.minFps === Infinity ? '—' : s.minFps.toFixed(0)}fps @${s.worstCalls}c/${(s.worstTris / 1000).toFixed(0)}k\n` +
        `max   ${s.maxFps ? s.maxFps.toFixed(0) : '—'}fps   p95 ${s.p95Ms.toFixed(1)}ms\n` +
        `calls ${renderer.info.render.calls}  tris ${(renderer.info.render.triangles / 1000).toFixed(0)}k  tier ${qualityTier}\n` +
        `gfx   ${gfx} · ${tone}`;
    }
    renderer.info.reset();
  }
}

tick();

// Boot complete: cross-fade the loading screen out, the canvas in (CSS-driven).
document.body.classList.add('app-loaded');

// Flag installed-PWA (standalone) so the DRAGONS shop can use a roomier layout
// when run as an app, but stay compact enough to fit a browser viewport (URL bar
// eats height) without forcing a page-scroll. Android: display-mode media query;
// iOS Safari: navigator.standalone.
document.documentElement.classList.toggle('standalone',
  !!(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone));
