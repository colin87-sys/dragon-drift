# Dragon Drift

A browser-based endless 3D dragon-flight game built with [Three.js](https://threejs.org/) (vendored locally — no build step, no dependencies to install). Runs on desktop and mobile.

Fly low over a sunlit sea through the ruins of three drowned civilisations — golden-hour water, reflective waves, verdigris towers and sandstone domes (a love letter to *Panzer Dragoon*). Build ring combos, thread crystal windows, barrel-roll through danger, gather embers, level up your pilot, and unlock dragon skins. The course never ends — it only gets meaner.

## Run it

ES modules require an HTTP server (opening `index.html` via `file://` won't work):

```bash
cd angry-dragons
python3 -m http.server 8002
# then open http://localhost:8002
```

Any static server works (`npx serve`, GitHub Pages, etc.).

## Controls

| Input | Action |
| --- | --- |
| W/A/S/D or arrows | Steer |
| Hold Space | Boost (drains stamina; rings/windows/orbs refill it) |
| Double-tap ← / → (or Shift+direction) | **Barrel roll** — brief i-frames, style bonus |
| N or [ / ] | Cycle Dragon Radio stations |
| Esc | Pause menu (resume, music/sound volume + mutes) |
| Enter / tap | Start · R / FLY AGAIN to restart |

**Mobile:** drag anywhere to steer (relative joystick), hold a second finger to boost, **flick fast sideways to barrel roll**, pause button top-right.

## The loop

- **Rings & windows** build a combo (max ×5). Chain enough in a row to trigger **DRAGON SURGE** — double score, halved stamina drain, sky on fire.
- **Embers** (amber trails along the racing line) are the meta currency: spend them in the **Shop** on dragon skins and revive tokens.
- **Missions** (3 active) award embers; **pilot XP** levels you up after every run.
- **Near-misses** pay; barrel-rolling *through* a hazard cluster still awards them.
- When a hit would kill you, time dilates for a heartbeat — your last chance to dodge. If you die holding a **revive token**, you can burn it to keep flying.
- **Daily challenge**: one fixed course per UTC day, with a streak counter. Normal runs get a fresh random course every flight; challenge links (`?challenge=SCORE&seed=S`) race the exact same course.
- **Dragon Radio**: four procedural stations (Skyborne / Ancient Tides / Ember Rush / Moonlit Drift) — all layers still react to boosts, combos and Surge.

## Biomes

The course cycles ~1500 m biomes with crossfading sky/fog/water and gateway arches at every border: **Sunken Sanctuary** (verdigris ruins, teal water), **Amber Wastes** (desert ruins, bronze haze), **Frozen Reach** (crystal canyon, glassy melt-water).

## Tech notes

- **Rendering**: EffectComposer pipeline (bloom → ACES tone map → vibrance/vignette/chromatic-aberration grading), planar-reflection water (real mirror pass on tier 0, analytic fake on lower tiers), instanced prop bands recycled around the player.
- **Adaptive quality**: 3 tiers driven by FPS with hysteresis (pixel ratio, bloom, reflection, particle counts, birds). Override in Settings. `?debug=perf` shows fps/draw-calls/tier.
- **Audio**: 100% procedural Web Audio — no audio files. Data-driven track table, per-biome key shifts at loop boundaries, master compressor.
- **Persistence**: one versioned localStorage blob (`dragonDriftSave`) with corruption-safe deep-merge loading and legacy-key migration.

## Code layout

```
index.html              HTML shell + import map
css/style.css           All UI styling (HUD, screens, shop, pause menu)
js/main.js              Setup, game flow, quality tiers, main loop
js/config.js            All tuning constants
js/gameState.js         Run state (score/combo/health/fever/slow-mo)
js/save.js              Versioned save blob, XP, daily seed/streak
js/input.js             Keyboard + touch + roll gestures
js/player.js            Flight model, boost, stamina, barrel roll
js/dragon.js            Procedural dragon + rider, wing gradients, trails
js/dragonPalettes.js    Skin color tables (shop)
js/cameraController.js  Chase cam, kicks, shake, showcase orbit
js/level.js             Endless seeded generator + ember arcs + set-piece events
js/biomes.js            Biome palettes + distance lookup/lerp
js/environment.js       Sky shader, lights, instanced ruin archetypes
js/ambient.js           Leaves/motes/snow particles + bird flock
js/setpieces.js         Biome gateway arches, mega-arches
js/water.js             Wave shader (reflective + cheap variants)
js/postfx.js            Composer pipeline + grading shader
js/rings.js             Rings, combo, fever trigger
js/obstacles.js         Pillars/shards/bars/gates + colliders
js/powerups.js          Speed orbs
js/embers.js            Currency pickups (instanced, pooled)
js/collision.js         Hit tests, near-miss, slow-mo trigger, revive
js/events.js            Tiny pub/sub for gameplay events
js/missions.js          Mission defs, slots, rewards
js/reticle.js           Nested-square target reticle (DOM)
js/ui.js                HUD, screens, shop, settings, pause menu
js/sfx.js               Web Audio engine: Dragon Radio + all SFX
js/util.js              Seeded RNG, smoothing, glow textures
lib/                    three.module.js + vendored r160 addons
```

Tuning lives almost entirely in `js/config.js` — speeds, damage, stamina rates, difficulty ramp, biome lengths, roll parameters.
