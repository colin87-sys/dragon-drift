# Dragon Drift

A browser-based endless 3D dragon-flight game built with [Three.js](https://threejs.org/) (vendored locally — no build step, no dependencies to install). Runs on desktop and mobile.

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
- **Embers** (amber trails along the racing line) are the meta currency: spend them in the **Shop** on dragons, riders, radio stations and revive tokens. Rare **Golden Embers** (◆25 comets, seeded per course with dry-spell protection) spice every kilometre, and your **first flight each UTC day banks ×1.5**.
- **The Ember Gambit**: crash with a worthwhile haul and the recap offers the **Phoenix Gauntlet** — one ~600 m corridor of back-to-back gauntlet stations, no revives, one touch and it burns. Cross the arch and the haul doubles. Quest pay, XP and streaks are banked *before* the wager — only the haul ever rides, and a mid-corridor refresh refunds the stake.
- **Run Recap**: every crash ends in a designed moment — **NEW BEST** record chips (chain, perfect streak, rings-in-a-run, clean flight, combo), a score count-up, an animated earnings ledger (quests, weeklies, milestones, feats, level pay, streak bonus), and exactly one **NEXT UP** goal so you always leave knowing what's a couple of runs away.
- **Dragons are real upgrades**: six dragons with distinct models, trails and flight stats, each a **live 3D turntable** on its shop card, each logging **mastery stars** (10/30/75 km flown → ember payouts). The 5000-ember **Solar Sovereign** is the apex. **Riders are earners**: +3% / +7% / +12% embers on every payout.
- **Quests chain**: six families run in tiers I→III — finishing one slides the next tier into the slot ("NEW QUEST UNLOCKED"); six more quests rotate forever. **Weekly Trials** draw 3 big objectives per ISO week (UTC) paying 350–500◆ plus an **exclusive title** each; completing any trial banks a **Phoenix Feather** that bridges one missed daily-streak day.
- **Feats**: 24 one-time achievements across skill / journey / collection, paying embers, several granting equippable **titles** («Goldwing», «Ghost», «Mythwing»…). Your title rides the start screen and every share text. The **PILOT** screen holds the feat wall, the flight log (lifetime stats + personal records + dragon mastery) and the title wardrobe.
- **Flight Milestones**: lifetime rungs (rings, km, perfects, near-misses, windows, gauntlets, goldens) auto-pay at run end — the next rung is rarely more than a couple of runs out. **Pilot levels pay embers** (and a title every 5 levels).
- **Gauntlets**: every ~1 km the course funnels into a hand-built corridor — follow the embers through the open door. A shimmering **gold beacon stands at your best distance**; passing it pays +◆10 and the record falls in-world.
- The reward rhythm breathes: tight ring **bursts**, normal flow, and open **straights** to boost flat-out.
- **Near-misses** pay; barrel-rolling *through* a hazard cluster still awards them. When a hit would kill you, time dilates for a heartbeat. Revive tokens grant one second wind per run (never inside a gambit).
- **Assist toggles**: turn off the target reticle (+10% score) and/or last-chance slow-mo (+15% score) — flying raw pays more, and the HUD shows the active bonus.
- **Daily challenge**: one fixed course per UTC day; the streak **pays embers** (30 + 10×streak, capped at 7) on the first completion each day. Challenge links (`?challenge=SCORE&seed=S`) race the exact same course — with a live **race bar** under your score, a "CHALLENGE BEATEN" moment mid-run, and a riposte share text when you win ("Your move.").
- **First-flight coaching**: four one-time contextual hints (steer → boost → perfect centers → follow the embers) that never outlive your second run. Come back after 5+ days away and a small **tailwind gift** is waiting — streaks warm you back in, they never scold.
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
- **Persistence**: one versioned localStorage blob (`dragonDriftSave`, v2) with corruption-safe deep-merge loading and legacy-key migration.
- **Tests**: `node tests/run-all.mjs` — 11 suites (boot smoke, v1→v2 save migration, recap pipeline, full gambit lifecycle incl. reload-refund, feats idempotency, weekly seeding incl. year boundaries, golden-ember RNG isolation against a pre-update course fixture, race bar, def-table integrity, economy bands, return triggers). Browser suites use the globally installed Playwright.

## Code layout

```
index.html              HTML shell + import map
css/style.css           All UI styling (HUD, screens, shop, pause menu)
js/main.js              Setup, game flow, settle pipeline, main loop
js/config.js            All tuning constants
js/gameState.js         Run state (score/combo/health/fever/slow-mo)
js/save.js              Versioned save blob (v2), XP/levels, daily streak
js/input.js             Keyboard + touch + roll gestures
js/player.js            Flight model, boost, stamina, barrel roll
js/dragon.js            Procedural dragon + rider builder, trails, rebuild on equip
js/dragons.js           Dragon roster: stats, model proportions, FX (shop)
js/riders.js            Rider roster: outfits, accessories, ember bonuses (shop)
js/preview.js           Live 3D turntable previews on shop cards
js/recap.js             Run Recap v2: count-up, ledger, NEXT UP, gambit panel
js/records.js           Personal records: live tracking + run-end settle
js/feats.js             24 achievements (live + settle), event-driven
js/titles.js            Equippable title registry (feats/weeklies/levels)
js/weekly.js            Weekly Trials: ISO-week seeded 3-of-9 draw, feather
js/milestones.js        Lifetime milestone ladder + dragon mastery stars
js/pilotScreen.js       PILOT screen: feat wall, flight log, title wardrobe
js/gambit.js            Ember Gambit: escrow, corridor seed, refund-on-boot
js/goldEmbers.js        Golden ember pickups (independent seeded RNG)
js/pbMarker.js          Personal-best beacon in the world
js/hints.js             First-flight contextual hints (one at a time)
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
