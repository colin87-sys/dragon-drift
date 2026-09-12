# Skybreak: implementation work plan

**Planning revision 1 — 12 September 2026.**

Build the slice in **skybreak/** on **codex/skybreak-prototype-plan**, based on master commit **b40246562db20ba267689124f4328574ed48451c**. The planning deliverable consists of the five Markdown files in this directory. No runtime is claimed to exist yet.

The first implementation milestone is a **20-second controllable flight lane with Cinder's blockout in the real camera**, followed by a reviewed skinned hero. A complete gray-material route and boss comes next. Finished scenery and broad progression do not come first.

## 1. Repository and runtime isolation

1. Keep the existing branch baseline and this planning commit available for comparison.
2. Implement all prototype runtime, assets, tools, and tests under skybreak/.
3. Give Skybreak its own entry page, import map, styles, package scripts, asset manifest, and save namespace.
4. Use relative paths so the project works under a repository subpath and a future preview subpath.
5. Avoid runtime imports from ../reforged/. Copy only selected small utilities or vendor files into the new project, with provenance and their existing licenses.
6. Leave the root entry page and Reforged release behavior untouched during the prototype.
7. Do not register a Skybreak service worker in the first slice. It does not need offline caching to prove the game.
8. Package a future preview from an explicit runtime allowlist. Exclude art sources, documents, tests, and reference captures.

The existing repository has a PR-preview workflow and a production Pages workflow. A PR can publish a preview and post a comment automatically; a planning branch commit alone is sufficient for this deliverable. No PR or deployment is required for the plan. Any later preview task must account for that workflow behavior and its asset packaging. [PR preview workflow](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/.github/workflows/pr-preview.yml) · [Pages workflow](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/.github/workflows/deploy-pages.yml)

### Stack decision

Start with plain JavaScript ES modules, JSDoc contracts, a small static development server, and Node's test runner for pure gameplay logic. Use the existing Three.js **r160** vendor baseline and matching GLTFLoader/SkeletonUtils copies for the first asset spike, retaining license notices. This keeps the initial rendering comparison controlled.

Do not add React, an entity-component framework, a physics engine, a backend, or a new game engine for this slice. A renderer upgrade is a separate, evidence-driven change if the asset spike identifies an actual compatibility or performance need. Recheck current documentation against the chosen version before using newer APIs.

### Planned file ownership

These are intended files, not files already implemented.

| Path under skybreak/ | Owns |
|---|---|
| index.html; styles.css | Entry, minimal screen shell, import map, accessible action controls |
| package.json | Local serve, unit test, validation, and packaging commands |
| vendor/three/ | Pinned renderer and matching loader/helper modules, license |
| src/main.js | Startup composition, lifecycle, connecting the owners below |
| src/core/clock.js | Frame timestamp, fixed-step accumulator, pause policy |
| src/core/runSpec.js; runState.js | Validated immutable rules identity and mutable run state |
| src/core/events.js; rng.js | Typed-by-contract event records; seeded RNG only if future gameplay needs it |
| src/input/actions.js; touch.js; keyboard.js | Normalized action frames and input lifecycle |
| src/flight/player.js; routeFrame.js | Player simulation and centerline local frame |
| src/flight/collision.js; rings.js | Swept contacts, ring opportunities, risk encounter resolution |
| src/flight/hazards.js; surge.js | Authored emitter behavior, brittle barriers, flight burst |
| src/rules/balance.js; rewards.js | All tuning constants and authoritative score/charge policy |
| src/content/causeway.js; stormwarden.js | Course placements, choice groups, target and attack data |
| src/boss/encounter.js; attacks.js; targeting.js | Boss state machine, geometry, acquisition, damage |
| src/render/scene.js; camera.js | Presentation scene and framing; no score or collision authority |
| src/render/cinder.js; stormwarden.js; environment.js; effects.js | Assets, animation, visual event responses |
| src/audio/director.js | Audio priorities and scheduling from simulation events |
| src/ui/hud.js; screens.js; results.js | Display state, menus, recap/hints, retry |
| src/persistence/save.js; challenge.js | Scoped settings/records and versioned challenge parsing |
| src/replay/trace.js | Tick-indexed input/event recording; later ghost support |
| assets/manifest.json; assets/models/; assets/audio/; assets/textures/ | Runtime content and version/hash references |
| art/source/; art/provenance.json | Editable original assets and any borrowed asset provenance |
| tools/viewer.html; tools/viewer.js | Hero/boss camera, pose, material, and bounds inspection |
| tools/validate-course.mjs; validate-assets.mjs; package.mjs | Reachability, asset checks, explicit runtime packaging |
| tests/ | Behavior-based simulation, contract, and lifecycle checks |

Create files only when their work item needs them. The table defines responsibility; it is not a requirement to create empty scaffolding for every future module.

## 2. What to learn from Reforged

| Existing implementation | Useful foundation | Skybreak decision |
|---|---|---|
| [player.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/player.js), [cameraController.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/cameraController.js) | Steering, banking, follow behavior | Re-derive the small movement/camera contract; carry over only useful math |
| [level.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/level.js), [canyonMath.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/canyonMath.js) | Route frames and reachability thinking | Use an authored centerline and finite placements; retain relevant geometric techniques |
| [rings.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/rings.js), [collision.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/collision.js) | Ring crossing and forgiving body interactions | Implement one consistent swept-collision and reward contract |
| [bossBullets.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/bossBullets.js), [bossKit.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/bossKit.js) | Projectile pooling and reusable presentation pieces | Extract narrow pieces if dependency review justifies them |
| [sfx.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/sfx.js), [sfxLimiter.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/sfxLimiter.js), [tracks.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/tracks.js) | Event-driven audio, limiting, music transitions | Reuse ideas or small functions after checking coupling and source provenance |
| [insts.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/insts.js), [resGovernor.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/resGovernor.js) | Instancing and adaptive rendering | Keep performance techniques; ensure quality changes never change rules |
| [main.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/main.js), [gameState.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/gameState.js) | Existing integration behavior and pitfalls | Do not transplant the central orchestration and its progression dependencies |
| [dragonModel.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/dragonModel.js), [dragonGlb.js](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/dragonGlb.js) | Existing asset experiments | Use a dedicated authored skin/clip path; retire runtime anatomical reconstruction for Cinder |

Every copied function gets its source commit/path recorded. Avoid copying a large module to reuse one helper and accidentally pulling the old state model into the new project.

## 3. Core contracts

### Run specification

Create and freeze this before simulation starts:

~~~json
{
  "specVersion": 1,
  "rulesVersion": "skybreak-0.1",
  "contentVersion": "causeway-stormwarden-0.1",
  "routeId": "shattered-causeway",
  "bossId": "stormwarden",
  "dragonId": "cinder",
  "mode": "standard",
  "assistId": "standard",
  "tickHz": 60
}
~~~

The implementation attaches a content hash to the build manifest and record identity. Any rules or authored content change that affects a run creates a new comparable-record group. Sensitivity, handedness, sound volume, reduced motion, and rendering quality remain presentation/input preferences.

Boss practice uses a distinct mode with the specified fixed entry health and charge. Assisted play uses a different assist ID. The first authored course uses no gameplay randomness; omit the RNG module until a concrete mechanic needs it. If randomness is introduced, add its seed and algorithm version to the run contract and give gameplay and cosmetic effects separate streams.

Do not read saved level, currency, first-run state, selected old dragon, or completion history after constructing the standard run. Coaching overlays may vary by prior instruction, but geometry, stats, timing, and collision may not.

### Simulation loop

1. Sample the animation-frame timestamp once.
2. Handle visibility, pause, and lost-input state before advancing.
3. Accumulate elapsed time and run 1/60-second simulation steps.
4. Read a normalized action frame for each step.
5. Advance route/player, combat state, and attacks in a documented order.
6. Resolve swept contacts and vulnerability.
7. Emit resolved events, apply rewards, and update trace/results data.
8. Render interpolated presentation state; update animation from supplied time/state.

Use at most eight catch-up steps in a display frame. If a long interruption cannot be processed safely, pause and resume explicitly rather than silently discarding gameplay time. Hidden tabs never continue combat. Active-time records exclude pauses and are casual local records; they are not claims of verified speedruns.

Do not call a clock getter that itself advances time from a renderer, audio function, or effect. Timers are tick counts. Standard comparisons across 30/60/120 Hz display schedules must yield the same gameplay result for the same tick-indexed action trace.

### Events and ordering

~~~text
InputFrame:
  tick, steerX, steerY, rollRequest, rollDirection, surgeRequest

ResolvedEvent:
  tick, sequence, runId, type, sourceId, encounterId, payload

RewardEntry:
  eventId, category, baseScore, multiplier, scoreDelta, chargeDelta

BossState:
  stateId, generation, cycleIndex, stateTick,
  heartHP, componentHP, parriesRewarded, attackIdsResolved
~~~

A component HP value cannot become negative. A component break is emitted once when HP crosses zero. Apply damage and state transition atomically so multiple hits on one tick cannot open the carapace twice.

Separate IDs for:

- Ring opportunity, shared by alternate-line instances.
- Route attack/near-miss encounter.
- Boss component identity, used for one-time scoring across the fight.
- Boss component identity plus cycle, used for repeatable charge.
- Attack instance, used for collision and defensive deduplication.

The collision owner determines whether a near miss, parry, or beam passage actually happened. UI, animation, and particles do not generate score.

### Data and resource lifetime

The asset registry owns shared geometry, textures, clips, and audio buffers. A run owns transient entities, pools, callbacks, and input state. Restart clears the latter and reuses the former.

Use explicit disposal when replacing shared assets or ending the application. Inspect image bitmap, material, render-target, and skeleton ownership so a viewer preview cannot dispose a resource still used by the run.

Use local storage key **dragon-drift.skybreak.v1**. Validate fields, cap trace storage, and recover to defaults from malformed saves without deleting Reforged data. Store settings and records separately inside the schema so record migration cannot reset accessibility preferences.

## 4. Ordered work packages

Estimates are rough working-day ranges for experienced contributors. They include implementation and focused verification, not recruiting delays or open-ended art revision. They are planning estimates, not measured productivity promises.

### M0 — Establish the toolchain and reference

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| P00 | Create isolated entry, package scripts, matching Three vendor set, asset manifest, and source-provenance file; 0.5–1 engineering day | Approved plan | A blank scene serves under /skybreak/ and a nested preview path; no runtime import reaches Reforged |
| P01 | Verify a working WebGL test device and Blender/export toolchain; export one skinned test mesh and play a clip; 0.5–1 day | P00 | A real rendered capture exists with correct scale, skin, materials, and animation; identify exact tools/versions |
| P02 | Complete the Gorgon video annotation in BOSS_REFERENCE.md; approximately 0.5 day | Accessible recordings | Full fight observed; source version and actual transition/beam timestamps recorded; differences from the guide noted |
| A00 | Evaluate the CC0 base against an original anatomical blockout; 1–2 art days | P01, art brief | Choose base adaptation or original mesh with a written effort/quality reason and viewed poses |

If the current environment still cannot render or export, establish a supported local/device workflow and report the exact blocker. Do not label placeholder screenshots as validation of the 3D pipeline.

### M1 — Prove a 20-second flight

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| P03 | Implement runSpec, runState, fixed clock, lifecycle reset, and action trace; 1–2 engineering days | P00 | Same action trace at 30/60/120 display schedules gives the same simulated distance; pause/blur clears input and attacks |
| P04 | Implement touch/keyboard steering and Roll with the specified timing; 1.5–3 days | P03 | Two touch pointers work independently; controls survive cancel/blur; no unrequested roll or steering-anchor jump |
| P05 | Build route frame and camera framing with Cinder blockout; 1–2 engineering days plus A00 | P01, P04 | Wings fit portrait, bounds are visible, curve joins do not twist, bank and control agree |
| P06 | Implement swept torso collisions and the first eight ring opportunities in a 20-second lane; 1–2 days | P05 | Fast flight cannot skip a ring/contact; ring rims are non-damaging; a visible obstacle costs exactly one health |
| G01 | Run the eight-player flight/control test; 1–2 days including one focused tuning pass | P06 | Meet DESIGN_PLAN.md flight and control thresholds or record a concrete movement redesign |

**Review artifact:** a playable lane, a 30-second real-device clip, movement/latency observations, and a short list of changes from the starting constants. This is the first useful implementation review.

### M2 — Finish Cinder while building the game loop

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| A01 | Original/adapted production mesh, retopology, UVs, materials, and LODs; 4–6 art days | A00, P05 framing | Head, chest, wings, and tail match the brief at game scale; topology and material budgets recorded |
| A02 | Skin weights and required clips; 4–6 art days | A01 | All listed extreme poses pass; no membrane inversion, shoulder collapse, or tail snap |
| P07 | Dedicated viewer and Cinder animation adapter; 1–2 engineering days plus 1–2 art days | P01, A02 | Actual gameplay camera can show every pose/state; animation duration agrees with simulation; asset failure is visible |
| G02 | Moving-hero art review; approximately 0.5 day plus changes | P07 | Owner accepts the moving character as a substantial upgrade before route art expands |
| P08 | Central reward ledger, ring chain, charge, and finite event IDs; 1–2 engineering days | P06 | Empty rolls pay zero; 32-ring fixtures total 6,900 / 10,350; recap equals ledger |
| P09 | Flight Surge, brittle gate, emitter bolts, perfect parry, and near miss; 1.5–2.5 days | P04, P08 | Every reward requires a resolved interaction; alternate safe line works with zero charge; wall/bolt rules are distinct |
| P10 | Author all six course sections and 32 ring groups from the schedule; 1–2 days | P09 | Both local choices rejoin; no double collection/miss; full route completes at both speed values |

The art and engineering tracks can proceed independently where their dependencies allow. A02 cannot be considered finished merely because a generic downloaded flap clip plays.

### M3 — Build and test the complete gray-material boss

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| P11 | Implement boss FSM, component health, transition IDs, and active timer; 1–2 engineering days | P02, P03, P08 | Correct state order; partial progress persists; repeated breaks/late callbacks cannot corrupt the fight |
| P12 | Implement aim-plane targets, dwell/hysteresis, breath pulses, Surge hit, and feedback placeholders; 1–2 days | P11 | Closed armor takes no damage; valid alignment does; normal-only and Surge damage scenarios match the spec |
| P13 | Implement bolt patterns, parry return, beam annulus, cue path, and conservative safe guides; 2–3 days | P09, P12 | Both beam answers are reachable; one beam cannot multi-hit; cue and collider match; parry rewards are bounded |
| P14 | Connect route entry, health updraft, retained charge, victory, loss, and practice reset; 1–2 days | P10, P13 | A full run and repeated boss practices work without reloading; standard and practice records remain distinct |
| G03 | Eight-player boss comprehension test and one tuning round; 1–2 days | P14 | Meet comprehension gate; ordinary breath can win; no common passive wait or unexplained damage |

**Review artifact:** the complete playable route and boss with readable basic materials, a full unassisted clear, an ordinary-dodge beam clear, and a documented novice failure. This is the point to change the boss loop if it is not fun.

### M4 — Finish the place, creature, and feedback

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| A03 | Build aqueduct/island/garden/observatory kit and place it; 3–5 art days plus 1–2 engineering days | G02, P10 | Six sections have distinct compositions; colliders and visible openings agree |
| A04 | Model, rig, and animate the Stormwarden; 3–5 art days plus 1–2 engineering days | G03 | Target anchors and all visual states match the accepted FSM; heart and beam read on a phone |
| P15 | Add pooled ring, parry, Surge, break, beam, and defeat effects; 1–2 engineering days | A03, A04 | Effects confirm state without hiding incoming decisions; reduced effects retain every essential cue |
| P16 | Produce/integrate the audio set and music transitions; 1–2 engineering days plus 2–3 audio days | G03 | Warnings dominate reward sounds; audio unlock/pause/retry work; muted play remains legible |
| P17 | Finish landing, HUD, result analysis, retry, settings, and three mastery goals; 1.5–3 engineering days | P14, P08 | Results show accurate actionable information; warm retry is under one second; input/settings work in both orientations |

No extra dragon skin, boss phase, biome, or currency is added during this milestone.

### M5 — Make repeat play reliable and reviewable

| ID | Task and concrete output | Dependencies | Done when |
|---|---|---|---|
| P18 | Implement scoped save validation and compatible local records; 1–2 engineering days | P17 | Malformed/missing saves recover; Reforged keys remain unchanged; content/rule changes separate records |
| P19 | Build challenge URL/card and strict spec parsing; 1–2 days | P18 | Fresh and veteran profiles get the same course and boss; unsupported versions are explicit; sharing requires the user's click |
| P20 | Profile loading, frame time, pools, and quality tiers on the chosen phone/desktop; 2–3 days | P15, P16, P17 | Meet budgets below; no mid-run asset stall; repeated-run resources plateau |
| P21 | Run focused simulation/integration verification and fix concrete failures; 1.5–3 days | P19, P20 | Required cases below pass or a material blocker is documented; no optional test expansion without a remaining risk |
| G04 | Twelve-player full-slice test, one revision pass, then a fresh external group when ready; 2–4 working days plus recruitment | P21 | Voluntary replay, completion, and memorability evidence recorded; stop/go decision names remaining defects |
| P22 | Produce a review package: playable candidate, real-device clips, build/rules IDs, results, and explicit runtime package; 0.5–1 day | G04 | Candidate is concrete and reviewable; release/preview route is verified before any publication |

Optional after these gates: P23 local ghost replay, estimated 2–4 engineering days. Add it only if it improves the already-working replay loop. A leaderboard service, account system, and video-encoding pipeline are separate projects.

## 5. First ten working days

This is the initial critical path for a capable implementer with a usable graphics toolchain, not a promise that final art finishes in ten days.

| Day | Work | Reviewable output |
|---|---|---|
| 1 | P00/P01: isolated static project, renderer/skin export spike | Real rendered skinned mesh; folder/import/save boundaries verified |
| 2 | P02/P03: finish footage notes, fixed-step state and trace | Correct reference ledger and deterministic timing probe |
| 3 | P04: steering, touch action buttons, reset behavior | Inputs work on the reference phone and keyboard |
| 4 | P05: curved lane, Cinder blockout, camera | Rear-flight clip with the entire intended silhouette framed |
| 5 | P06: rings, swept collider, health, reset | Playable 20-second lane with meaningful pass/fail |
| 6 | G01: observe flight/control test; retune the largest issue | Evidence-based movement constants and an explicit gate decision |
| 7 | P08: charge, scoring, deduplication; continue hero art | Accurate ledger and ring fixture totals |
| 8 | P09: Surge, brittle shortcut, first emitter/parry | Short route segment with a real resource decision |
| 9 | P10/P11: full course data and boss FSM shell | Route reaches a boss with correct state transitions |
| 10 | P12: aligned breath and first heart opening | One readable defense-to-heart cycle; list remaining boss work |

If flight fails on day six, days seven onward shift to fixing flight. Do not follow the calendar mechanically while the defining interaction fails.

## 6. Required verification

Use focused behavior tests for rules that could invalidate runs, create unfair damage, or leak state. Do not replace playtests with snapshots of implementation details.

| Area | Meaningful cases |
|---|---|
| Clock | Recorded inputs at 30/60/120 display schedules; pause/visibility resume; long-frame recovery |
| Input | Touch pointer cancellation; action button plus drag; blur while holding a key; repeated restart; no stale buffered actions |
| Movement/collision | Surge-speed ring crossing; grazing versus contact; soft bounds; one attack ID gives at most one hit |
| Reward ledger | Empty roll; normal/perfect replacement; alternate ring instances; same-tick hit and ring; repeated hazard overlap; exact recap sum |
| Course | All 32 IDs unique; choice groups valid; apertures reachable at both speeds; no trigger skipped when s crosses several placements in one step |
| Boss states | Multiple component kills on one tick; stale projectile after opening; heart kill on window boundary; partial HP persists; retry clears generation |
| Boss damage | 24 breath pulses maximum per full heart window; correct Surge suppression; bounded parry return; ordinary-only victory path |
| Beam | Inner, annulus, and outer trajectories; conservative guide clearance; moving center; one health loss maximum; central reward requires full clean passage |
| Competitive conditions | Fresh/veteran saves; standard/practice/assist separation; unsupported content hash; presentation options leave rules unchanged |
| Resources | Warm restart loop; asset-load failure; dispose/reload viewer; audio unlock/pause; no monotonic geometry/texture/audio growth |
| Browser/UI | Portrait/landscape, safe areas, pointer capture, muted mode, reduced motion, context loss/recovery message, no WebGL support message |

Geometry boundary tests use explicit tolerances and cases just inside/outside them. Deterministic trace equality is first required within the same build/runtime; cross-browser ghost accuracy requires separate verification before shipping shared ghosts.

For repeated-run resource testing, use 20 warm restarts and several complete boss cycles. Counts should return to a stable range after warm-up. A screenshot alone cannot prove absence of leaks or responsive touch input.

### Performance and loading gates

Select and record one real midrange phone, one older supported phone if available, and one integrated-GPU desktop. Record OS, browser, render scale, and build. Do not fabricate a device result from headless Node timing.

| Measure | Initial target / action |
|---|---|
| Standard-tier frame pacing | Aim for 60 fps; p95 frame time at or below 20 ms and p99 below 33.3 ms on the chosen midrange device during dense combat |
| Fallback tier | Stable 30 fps with essential cues intact; simulation remains 60 Hz |
| Cold first control | Within 5 seconds under a controlled 10 Mbps / 100 ms latency profile, once the player chooses Fly |
| Warm retry | First control within 1 second |
| First-control transfer | At most 4 MB compressed, measured over the network |
| Full runtime transfer | At most 12 MB compressed; boss preloaded before entry |
| Touch response | No additional intentional buffering beyond the next simulation/render opportunity; measure on-device and investigate visibly lagging control |
| Resource lifetime | Stable renderer/resource counts after warm-up; no growth per restart |

Budget failure should first reduce rendering cost or loading waste. It must not be “fixed” by making gameplay advance at a different rate on slow devices.

## 7. Playtest data and decisions

Log locally or in a development export:

~~~text
run_start, first_control, ring_result, damage, roll_request,
parry_result, surge_start, section_end, boss_state_change,
boss_damage, beam_result, run_end, retry_selected,
practice_selected, share_requested
~~~

Each record includes build/rules/content IDs, mode, assist, tick, and event source. No account or personal identifier is needed for the formative tests. Use participant codes with their test notes; record whether a replay was voluntary.

Compute section completion and damage locations, ring accuracy, charge overflow, Surge timing, time in each boss state, heart damage per opening, causes of failure, and retry choices. Check whether a claim shown by the result hint is supported by an actual event.

After each milestone, update a short decision log with: observed problem, evidence, changed parameter/behavior, and what the next test should resolve. These are new prototype observations, not inherited internal roadmaps.

## 8. Estimates, risks, and stop conditions

The work-package ranges sum to approximately **32–60 engineering days**, **16–26 art days**, and **2–3 dedicated audio days**, with overlap where dependencies allow. For one full-time engineer working alongside an available artist, a first tested slice is roughly a **7–12 working-week** project. A single person producing both code and polished character art may take longer. Re-estimate after the toolchain spike and flight gate.

The largest uncertainties are character production quality, the feel of aim-through-flight on touch, and real-device rendering. The route count is intentionally small so those risks can be addressed early.

| Risk | Early evidence | Response |
|---|---|---|
| Hero still looks janky | Rear/bank/roll captures fail G02 | Rework anatomy/weights/animation before environment detail |
| Auto-breath makes combat passive | Players park and wait or cannot explain targeting | Reduce aim automation or change target movement/exposure; first retain the same three actions |
| Gorgon-style layering feels slow | Long state durations and repeated “waiting” comments | Reduce defense HP/transitions, improve useful actions during protection; keep the loop test small |
| Beam is memorable for unfair damage | Players cannot see or reach a safe lane | Fix cue/geometry/framing; do not require the center trick |
| Short fixed course feels exhausted | Players understand it but do not retry | Improve optional lines, meaningful Surge decisions, and time/precision goals before adding random scenery |
| Phone performance harms input | Frame-time spikes during effects or asset entry | Lower decorative cost; preload; simplify materials and transparency |
| Scope expands into another roster/economy | New systems proposed before G04 | Keep those ideas in a later list; finish and assess this one slice |

Stop expanding content after two focused failed iterations on the same foundational gate. Change the interaction or art approach, then retest. No number of completed tasks overrides evidence that people do not want another run.

The plan is complete when the branch contains the design, boss research, art brief, and actionable work packages. The next implementation decision starts at M0/M1; it does not authorize silently merging or publishing an unfinished game.
