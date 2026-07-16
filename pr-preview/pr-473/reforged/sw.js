// Dragon Drift (reforged) service worker — atomic, content-versioned precache.
//
// Why this shape:
//   - VERSION + ASSETS below are STAMPED by tools/stamp-sw.mjs from a hash of
//     every asset's contents. Any code change -> new VERSION -> sw.js bytes
//     change -> the browser detects an SW update and reinstalls. No manual bump.
//   - install precaches the WHOLE asset set into a version-named cache via
//     addAll(), which is atomic: if any file fails (flaky network), install
//     rejects and the previous, complete version keeps serving. A half-fetched
//     mixed-version module graph can never reach the page.
//   - fetch is cache-first within the current version (one consistent set),
//     so offline/flaky loads always replay a single coherent build.
//   - activate deletes every other dd-reforged-* cache, so stale versions
//     can't linger and get mixed in.
const VERSION = '46a3c5eb53ed';                          // STAMP:VERSION
const ASSETS = [
  './',
  './css/style.css',
  './index.html',
  './js/ambient.js',
  './js/analytics.js',
  './js/angelWing.js',
  './js/arenaSet.js',
  './js/arenaSkin.js',
  './js/ascension.js',
  './js/atmosphere.js',
  './js/auroraSky.js',
  './js/biomeBoss.js',
  './js/biomes.js',
  './js/boss.js',
  './js/bossAshtalon.js',
  './js/bossBar.js',
  './js/bossBrineholm.js',
  './js/bossBullets.js',
  './js/bossColossus.js',
  './js/bossDefs.js',
  './js/bossEitherwing.js',
  './js/bossEmbertide.js',
  './js/bossHollowgate.js',
  './js/bossIdol.js',
  './js/bossKarnvow.js',
  './js/bossKit.js',
  './js/bossKnellgrave.js',
  './js/bossMandala.js',
  './js/bossMarrowcoil.js',
  './js/bossModel.js',
  './js/bossOnewing.js',
  './js/bossRhythm.js',
  './js/bossThrumswarm.js',
  './js/bossUnmasked.js',
  './js/bossWeftwitch.js',
  './js/buildId.js',
  './js/cameraController.js',
  './js/canyonMath.js',
  './js/collision.js',
  './js/composer.js',
  './js/config.js',
  './js/contactShadow.js',
  './js/creatureGrammar.js',
  './js/daily.js',
  './js/dragon.js',
  './js/dragonAzure.js',
  './js/dragonCelestialHead.js',
  './js/dragonCollapse.js',
  './js/dragonCometWake.js',
  './js/dragonCrystalSerpent.js',
  './js/dragonDraconicHead.js',
  './js/dragonFaceted.js',
  './js/dragonGlb.js',
  './js/dragonGlbRig.js',
  './js/dragonHead.js',
  './js/dragonHull.js',
  './js/dragonHullProfiles.js',
  './js/dragonKoiSerpent.js',
  './js/dragonModel.js',
  './js/dragonNightFury.js',
  './js/dragonOrganism.js',
  './js/dragonParts.js',
  './js/dragonPhoenixMolten.js',
  './js/dragonPhoenixReforged.js',
  './js/dragonRecipe.js',
  './js/dragonRevenant.js',
  './js/dragonSeraph.js',
  './js/dragonSeraphBody.js',
  './js/dragonShingle.js',
  './js/dragonSideFins.js',
  './js/dragonSovereign.js',
  './js/dragonSurfaceLayers.js',
  './js/dragonSurfaceShader.js',
  './js/dragonSweep.js',
  './js/dragonTail.js',
  './js/dragonTempest.js',
  './js/dragonTorso.js',
  './js/dragonUnifiedHull.js',
  './js/dragonVesper.js',
  './js/dragonWingFlap.js',
  './js/dragonWings.js',
  './js/dragons.js',
  './js/embers.js',
  './js/entranceScripts.js',
  './js/environment.js',
  './js/events.js',
  './js/feats.js',
  './js/firstFlight.js',
  './js/flightmarks.js',
  './js/gameState.js',
  './js/gestureTutorial.js',
  './js/godrays.js',
  './js/goldEmbers.js',
  './js/harmony.js',
  './js/hazards.js',
  './js/hints.js',
  './js/hudState.js',
  './js/icons.js',
  './js/input.js',
  './js/insts.js',
  './js/juice.js',
  './js/lensFlag.js',
  './js/level.js',
  './js/lockLayer.js',
  './js/main.js',
  './js/markerSurface.js',
  './js/mechaKit.js',
  './js/milestones.js',
  './js/missions.js',
  './js/modelDetail.js',
  './js/obstacles.js',
  './js/particles.js',
  './js/pbMarker.js',
  './js/perfStats.js',
  './js/pilotScreen.js',
  './js/player.js',
  './js/postfx.js',
  './js/powerups.js',
  './js/preview.js',
  './js/propAO.js',
  './js/propFoam.js',
  './js/pulseTimer.js',
  './js/rain.js',
  './js/recap.js',
  './js/records.js',
  './js/resGovernor.js',
  './js/reticle.js',
  './js/riderParts.js',
  './js/riders.js',
  './js/rimLight.js',
  './js/rings.js',
  './js/save.js',
  './js/setpieces.js',
  './js/sfx.js',
  './js/sfxLance2.js',
  './js/sfxLanceMath.js',
  './js/sfxLimiter.js',
  './js/sfxLoudness.js',
  './js/sfxRender.js',
  './js/showcaseBackdrop.js',
  './js/skyClouds.js',
  './js/skyProbe.js',
  './js/speedStreaks.js',
  './js/splash.js',
  './js/stormArcs.js',
  './js/surface.js',
  './js/titles.js',
  './js/toneMap.js',
  './js/tracks.js',
  './js/trailPreview.js',
  './js/ui.js',
  './js/uiSound.js',
  './js/util.js',
  './js/validateCreatureBlueprint.js',
  './js/water.js',
  './js/weekly.js',
  './js/wingDebugPose.js',
  './js/wingFlapSolver.js',
  './lib/fonts/rajdhani-latin-500.ttf',
  './lib/fonts/rajdhani-latin-700.ttf',
  './lib/fonts/russo-one-latin-400.woff2',
  './lib/loaders/GLTFLoader.js',
  './lib/objects/Reflector.js',
  './lib/postprocessing/EffectComposer.js',
  './lib/postprocessing/MaskPass.js',
  './lib/postprocessing/OutputPass.js',
  './lib/postprocessing/Pass.js',
  './lib/postprocessing/RenderPass.js',
  './lib/postprocessing/ShaderPass.js',
  './lib/postprocessing/UnrealBloomPass.js',
  './lib/shaders/CopyShader.js',
  './lib/shaders/LuminosityHighPassShader.js',
  './lib/shaders/OutputShader.js',
  './lib/three.module.js',
  './lib/utils/BufferGeometryUtils.js',
  './lib/utils/SkeletonUtils.js',
  './manifest.json',
];                                              // STAMP:ASSETS_END
const CACHE = 'dd-reforged-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);   // atomic: all-or-nothing
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE && key.startsWith('dd-reforged-')) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreSearch: url.pathname.endsWith('/') });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    } catch {
      if (url.pathname.endsWith('/')) {
        const idx = await cache.match('./');
        if (idx) return idx;
      }
      throw new Error('offline and uncached: ' + url.pathname);
    }
  })());
});
