# Dragon Drift

A browser-based endless 3D dragon-flight game built with [Three.js](https://threejs.org/) (vendored locally — no build step, no dependencies to install). Runs on desktop and mobile.

> **Also in this repo: [GODFALL RUSH](godfall/)** — a completely separate boss-rush action RPG. Orbit god-sized summons on an invisible combat shell, dodge telegraphed attacks, warp-strike weak points, break their stagger, and execute them in a slow-mo finisher. Four gods (Leviathan, Titan, Ramuh, Bahamut), four weapon classes with forgeable tiers, armor sets that change your hero's look, S/A/B/C ranks, medals, and a fully procedural orchestral score. Shares nothing with Dragon Drift but the vendored Three.js engine. Play it at `/godfall/` (e.g. `http://localhost:8002/godfall/`). Desktop: WASD move · J attack · K dodge · L warp · Q weapon · F Armiger. Mobile: drag to fly, on-screen buttons, hold ATTACK to warp. Dev checks: `node --experimental-loader ./godfall/tools/loader.mjs godfall/tools/smoke.mjs`.

Fly low over a sunlit sea through six drowned worlds — golden-hour ruins, amber wastes, frozen crystal, a molten caldera, a bioluminescent mire and a star-flooded night sea (a love letter to *Panzer Dragoon*). Build ring chains, thread crystal windows, barrel-roll through danger, gather embers, level up your pilot, and unlock real dragon upgrades. The course never ends — it only gets meaner.

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
| Esc | Pause hub (run strip + AUDIO / ASSISTS / QUESTS tabs, radio skip, shop) |
| Enter / tap | Start · R / FLY AGAIN / tap any blank spot to restart |

**Mobile:** drag anywhere to steer (relative joystick), hold a second finger to boost, **swipe the second finger sideways to barrel roll** (a fast flick of the steering finger also works — the joystick re-anchors so you never lose control). Finger roles are sticky: a boost finger never becomes the steering finger. Pause button top-right. In the shop, tapping any blank spot goes back; on the crash screen it starts a new flight.

## The loop

- **Rings & windows** build a combo (max ×5) and a visible **CHAIN** counter. Chain enough in a row to trigger **DRAGON SURGE** — double score, halved stamina drain, sky on fire.
- **Perfect rings** (dead-center) detonate a gold starburst and climb a chime ladder with every consecutive perfect — the streak resets if you clip an edge.
- **Embers** (amber trails along the racing line) are the meta currency: spend them in the **Shop** on dragons, riders, radio stations and revive tokens.
- **Dragons are real upgrades**: six dragons with distinct models, trails and flight stats (speed / handling / stamina), each shown as a **live 3D turntable** on its shop card. The 5000-ember **Solar Sovereign** is the apex — fastest, most agile, best-looking, permanent golden aura. Handling always scales ahead of speed, so faster dragons are *easier* to steer onto the line.
- **Riders are earners**: four pilots with signature looks (gilded banner, storm visor, void gem) and an **ember bonus on every run payout** — +3% (Lancer), +7% (Storm Caller), +12% (Void Oracle).
- **Quests** (3 active) pay embers and are always in view — on the start screen and in the pause hub's QUESTS tab; **pilot XP** levels you up after every run.
- **Gauntlets**: every ~1 km the course funnels into a hand-built corridor — a spanning log, a spike wall and one generous open door, three or four stations in a row. Follow the embers.
- The reward rhythm breathes: tight ring **bursts**, normal flow, and open **straights** to boost flat-out.
- **Near-misses** pay; barrel-rolling *through* a hazard cluster still awards them.
- When a hit would kill you, time dilates for a heartbeat — your last chance to dodge. If you die holding a **revive token**, you can burn it to keep flying.
- **Assist toggles**: turn off the target reticle (+10% score) and/or last-chance slow-mo (+15% score) in Settings or the pause hub — flying raw pays more, and the HUD shows the active bonus.
- **Daily challenge**: one fixed course per UTC day, with a streak counter. Normal runs get a fresh random course every flight; challenge links (`?challenge=SCORE&seed=S`) race the exact same course.
- **Dragon Radio**: seventeen procedural stations — four free (Skyborne / Ancient Tides / Ember Rush / Moonlit Drift) and thirteen premium unlocks at a flat ◆800, spanning idol dance-pop, EDM-trap, uplifting trance, big-room, hardstyle, synthwave, future bass, liquid D&B, French house and tropical house. All layers react to boosts, combos and Surge; skip tracks from the pause hub or with N / [ ].

## Worlds

The course cycles six ~1500 m biomes with crossfading sky/fog/water, per-biome props, air particles and fauna, and gateway arches at every border:

| World | Look | Air | Fauna |
| --- | --- | --- | --- |
| **Sunken Sanctuary** | verdigris ruins, golden-hour teal water | drifting leaves | gulls |
| **Amber Wastes** | drowned desert ruins, bronze haze | dust motes | desert hawks |
| **Frozen Reach** | crystal canyon, glassy melt-water | snowfall | white terns |
| **Emberfall Caldera** | black basalt spires over a magma sea | **rising embers** | ash-wyverns |
| **Lumen Mire** | colossal glowcap mushrooms, night marsh | drifting spores | glow moths |
| **Astral Shallows** | starfield, aurora, crystal monoliths | star motes | pale petrels + a **sky whale** |

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
js/dragon.js            Procedural dragon + rider builder, trails, rebuild on equip
js/dragons.js           Dragon roster: stats, model proportions, FX (shop)
js/riders.js            Rider roster: outfits, accessories, ember bonuses (shop)
js/preview.js           Live 3D turntable previews on shop cards
js/cameraController.js  Chase cam, kicks, shake, showcase orbit
js/level.js             Endless seeded generator: rhythm, gauntlets, set-pieces
js/biomes.js            Six world palettes + distance lookup/lerp
js/environment.js       Sky shader (stars/aurora), lights, instanced prop archetypes
js/ambient.js           Per-world air particles, biome fauna flock, sky whale
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
js/ui.js                HUD, screens, tabbed shop, settings, pause hub
js/sfx.js               Web Audio engine: Dragon Radio player + all SFX
js/tracks.js            Radio station data (17 tracks, 13 premium)
js/util.js              Seeded RNG, smoothing, glow textures
lib/                    three.module.js + vendored r160 addons
```

Tuning lives almost entirely in `js/config.js` — speeds, damage, stamina rates, difficulty ramp, biome lengths, roll parameters.
