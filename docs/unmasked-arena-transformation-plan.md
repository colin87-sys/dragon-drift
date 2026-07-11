# THE UNMASKED — Per-Stage ARENA / DIMENSION TRANSFORMATION Plan

**Status:** DESIGN PLAN, pre-feasibility-audit. No code has changed.
**Owner want (verbatim):** *"After the transformation from stage 1 to stage 2, it ALSO
transforms the STAGE/arena — we get teleported to another dimension/biome (DARKER).
Then stage 3 is more LIT and HOLY."*
**Canon:** BOSS-DESIGN.md §5c APEX ("it owns the game"), Tier-5 contract + Tier-3
"world-scale beats: the arena itself reacts". This is the WORLD reacting around the
shipped stage machine — an ENVIRONMENT feature, not a boss-model feature.
**Verified against:** master @ 2026-07-11 — `boss.js` (~5,770 lines; all line numbers
below re-verified this session), `bossUnmasked.js`, `bossDefs.js:1715`,
`environment.js`, `biomes.js`, `postfx.js`, `godrays.js` (via postfx seam),
`ambient.js`, `tests/unmaskedorgans.mjs`, `tests/bulletcontrast.mjs`.
**Composes with (does not overlap):** `docs/unmasked-finale-completion-plan.md` +
its audit (§7 below). That plan is ATTACKS/entrance/landmark; this plan is the
ENVIRONMENT axis. They share only the def and the stage seam.

---

## 0. Executive summary

One new render-only module (`js/bossArena.js`) holds three authored ARENA STATES and
a blend function; `environment.js` gains ONE call that lerps the per-frame `env`
scratch (the `computeEnv` output — verified single consumer, `environment.js:497`)
toward the active arena state; `boss.js` drives the blend off the SAME stage-beat
clock that already choreographs the crack/unveiling (`beginStageBeat`,
`stageBeatT/stageBeatDur`, `boss.js:1083-1091, 2318-2328`). Stage 1 = mix 0 =
byte-identical ordinary sky. The S1→S2 crack pulls the world through a white-violet
FLOOD into **THE HOLLOW BEHIND THE SKY** (a starlit void — sun gone, fog swallowed
in, black-glass water, motes drifting UP). The S2→S3 unveiling blooms it into
**THE UNVEILED HEAVEN** (luminous gold-cream haze, god-ray shafts, bright sea).

**The one inviolable constraint is satisfied BY CONSTRUCTION: nothing in this plan
touches the scene graph.** No `skyReplace`, no reparent, no camera lock, no new
meshes in v1. The boss rig stays on `group`; every change is uniform/scalar values
flowing through seams that already exist (`env` fields → sky-dome uniforms, scene
fog, sun/hemi lights, `setWaterTint`, `updateAmbient`, and later a postfx grade
bias). The lance organs and THE RECKONING cannot die because the paths that killed
EMBERTIDE's face-organs (`scene.add(model.rig)`, `boss.js:1703`) are never entered —
and §5 specifies the live-fight test that PROVES it per arena state anyway, because
the embertide lesson's double trap (headless paths that never reparent green a dead
lance) applies to any "trust me" claim in this territory.

Three def-gated PRs: **PR-A** the void (S1→S2, the hero increment) → **PR-B** the
heaven (S2→S3 + the bullet-band swap) → **PR-C** polish (grade bias, flood tuning,
death exhale). Each independently shippable, each byte-identical for every other
boss and for UNMASKED stage 1.

---

## 1. THE CONSTRAINT, verified and designed around (read this first, critic)

**What kills the lance:** EMBERTIDE's `skyReplace` path reparents the rig —
`boss.js:1703` `scene.add(model.rig)` — so `partWorldPos = group.getObjectByName(name)`
returns null **with the null cached forever**, and the studio/headless path never
reparents, so a naive test greens on a dead lance
(`leapfrog/lessons/2026-07-11-embertide-sky-proxy-and-fork-weapon.md`). UNMASKED's
shipped organs (`crackSeamL/R`, `wingEye0..5`, `relicHorn/Blade/Link/Spool/Shard`,
`wingRootL/R` — PR #372) all live on `group`; the def is explicitly
`approachFrom: 'ahead'`, NOT skyReplace (`bossDefs.js` unmasked, the lockParts
comment says so in as many words).

**How this plan cannot trip it:**
1. **Zero scene-graph writes.** The entire feature is value-space: `env` scratch
   fields, sky-dome uniforms, `scene.fog` numbers, light intensities/colors, water
   tint uniforms, ambient-mote dials, one godray-suppression boolean, and (PR-C) a
   postfx bias term. `grep -c "scene.add\|\.add(\|parent" js/bossArena.js` must be 0
   — write that as a literal string-assert in the new test, in the repo's
   constructor-arg-assert style (`N2` precedent).
2. **No camera coupling.** The sky dome is already camera-following
   (`sky.position.copy(camera.position)`, `environment.js:493`); we ride it. The
   boss stays `placeGroup`-driven. `syncSkyRig` (`boss.js:3609`) stays inert for
   unmasked (guard is `def.skyReplace` — untouched).
3. **The proof test drives the LIVE-FIGHT path** (§5, T1): per arena state, fresh
   boot → `bossSetDefIdx(13)` → `bossSetStage(n)` → `spawnBoss()` →
   `bossForceFight()` (the exact `tests/unmaskedorgans.mjs:34-38` recipe), then
   asserts **(a)** the arena is LIVE (scene fog.near shifted to the authored value /
   a new `__dd.bossArenaState()` seam reports mix ≥ 0.99) **and (b)**
   `debugPartWorldPos('wingEye0')` (stage 2) / `'crackSeamL'` (stage 1) /
   `'wingRootL'` (stage 3) resolve non-null AND in-lane (|x| ≤ 10.4, y ≤ 22 across
   sway — the shipped comfort band). The conjunction is the point: an arena that
   only engages in a code path the organs test never exercises is the exact
   false-green the embertide lesson documents.

---

## 2. Ground truth — the seams this rides (all verified this session)

| Seam | Where | Why it matters here |
|---|---|---|
| Stage machine | `bossUnmasked.js:793-885` — `TRANS_DUR 2.0`, `transKind` 'crack'/'unveil', `transT` eased in `tickBody`, `setStage` hard-cut, `allSnap` | the boss-side clock the arena must match |
| Stage beat (boss.js mirror) | `beginStageBeat` `:1087-1091`; ticked `:2318-2328`; `STAGE_REVEAL_HOLD 0.7`; started in the phase-advance block `:3805` in the same frame as `model.setPhase(phaseIdx)` `:3824` | `stageBeatT/stageBeatDur` IS `transT` re-expressed (same start frame, same dt, same duration) — the arena reads THIS, never reaches into the model |
| Fire held through transition | `beginStageBeat` sets `attackTimer ≥ d + STAGE_REVEAL_HOLD`; `pending.length = 0` at the burst `:3800-3801` | no NEW bullets spawn during the 2.7s swap window (see §4 band-swap timing; bullets already in flight at the burst may persist ~1-2s) |
| Dev stage-jump | `debugStagePin` `:52`, spawn transition-in `:2092-2100` (skippable), `__dd.bossSetStage` (main.js:351) | the test pin + the skip/snap path the arena must honor |
| `env` scratch + single consumer | `biomes.js:172-215` `computeEnv` → `environment.js:497` (the ONLY caller in `js/`) | one injection point for the override — no fan-out risk |
| Sky dome uniforms | `environment.js:281-351` — `topColor/midColor/horizonColor/sunGlow/starMix/dimMix/fogFarColor/fogFarMix`, `fog:false`, `depthWrite:false`, branchless xMix gates | every sky change is a uniform write on the EXISTING draw — zero overdraw delta; survives all postfx tiers |
| Fog / lights / water / motes fan-out | `updateEnvironment` `:492-538` — fog color/near/far, sun/hemi, `setWaterTint`, `updateAmbient(…env…)` | the whole world already re-reads `env` every frame; overriding `env` transforms all of it at once |
| World-dim grade | `bossGradeTarget()` `:1613-1616` → `postfx.js:341-347` additive `_bossMix` terms | the composition partner for the PR-C grade bias (additive-bias idiom, never uniform overwrite) |
| God-ray suppression precedent | `game.embertideSky` → `postfx.js:379` | the void has no sun → same suppression, new flag |
| Sky-replacement teardown discipline | `:1873` (endEncounter), `:5416` (resetBoss) reset `skyFadeK`/`setSkyFade(0)` | the template: the arena reset lands in BOTH teardowns (the rung-14 double-teardown law) |
| Per-biome bullet band | `resolveBand` `:1110-1118`, resolved once at start `:1653`; Astral already ships `bullets:{dark:0xa84167}` (`biomes.js`) | the mechanism the per-ARENA band override extends |
| Ambient landmark gates | `env.whaleMix/flybyMix/starMix` (`ambient.js:165,208`) | the void must zero the sky-whale (a whale in the void kills the read) — already env-gated, free |

**Stale-doc note (trust code):** the completion plan's INC-1/2 have partially shipped
(`grazeMedley`/`grazeFormNow()`/figureEight/gapThread all live in the def + boss.js;
its audit's "tree moved" headline). This plan was written against the LIVE code above,
not either doc.

---

## 3. The three arena states (authored values — attack these, critic)

Design rule: the override lerps FROM the live biome `env` TOWARD authored ABSOLUTE
values. So stage 1 is whatever sky the encounter landed in (anchor = Astral, but
ladder/rush/boss-select can land anywhere), and stages 2/3 look IDENTICAL regardless
of source biome — which is precisely what "another dimension" means. A biome seam
crossed mid-fight (the player still advances `dist`) is invisible under mix≈1.

### ARENA 0 — stage 1: the sky it was fought in (mix = 0, byte-identical)
No override. The eclipse-eye is framed against the ordinary biome sky; the crack is
the first time the world reacts. Zero-default identity is the coexistence proof.

### ARENA 1 — stage 2: THE HOLLOW BEHIND THE SKY (darker — the void dimension)
What makes it read as *another dimension*, not "dimmer" (each is a distinct sensory
channel, not a brightness change):
1. **The sun is GONE** — `sunGlow → 0x000000`, god-rays suppressed (new
   `game.bossVoidSky` next to the `embertideSky` check, `postfx.js:379`). A skyscape
   with no light source is the single strongest "not our sky" signal.
2. **The stars come out — everywhere.** `starMix → 1` (the existing hashed starfield
   + its faint aurora veil, free). Distinct from Astral because Astral keeps its sun,
   violet horizon band and sky-whale; here `whaleMix/flybyMix → 0`.
3. **The world is swallowed.** `fog.near 85→~45`, `fog.far →~240`, fog color
   `0x0a0514`: props/horizon dissolve into void within a few hundred metres — the
   arena becomes a pocket. (Clean-arena law already stops new spawns in-fight;
   the fog eats what remains.)
4. **The floor turns to black glass.** water `deep 0x030208 / shallow 0x140a26`,
   `waveAmp 0.15` — a still dark mirror under the starfield.
5. **The dust falls UP.** ambient motes `color 0xcfc2ee`, `fall −0.45` (the Caldera
   negative-fall precedent, `biomes.js` `fall:-2.2`), `sway 0.4` — wrong-gravity
   particulate is a cheap, legible dimension cue.
- Sky: `top 0x050208 / mid 0x0d0618 / horizon 0x1a0b2e` (a bruise-violet horizon
  band, NOT pure black — see silhouette note), `fogFarColor 0x120a24, fogFarMix 1`.
- Lights: `sunI ~0.55`, sun color `0x9a8fd8`; hemi `sky 0x241a3a / ground 0x05030a`.
- Grade (PR-C): `sat −0.12, vig +0.06` additive bias.
- **Boss legibility (dark seraph on dark void):** the near-black wings are carried
  by their LIT EDGES (§3b law 3 — gold rails, 14 tracking eyes, white great-eye,
  halo) plus the bruise horizon band sitting at wing height behind the silhouette.
  This is the state's #1 read risk (§9 R4). Fallback if the Fable gate flags it: a
  single dim backlight disc strictly BEHIND the silhouette plane (the §2-sanctioned
  shape — non-enclosing, one small additive surface), NOT a rim shell.
- **Bullet band:** the default dark band `0x8f0a3c` fails the contrast gate against
  the void horizon (L≈0.065: direct margin 0.10 < 0.15; layered outline margin
  ~0.035 < 0.25). **Arena 1 declares `bullets:{ dark: 0xa84167 }` — Astral's
  already-certified lifted dark** (`biomes.js` slot 5). Reuse, not invention.

### ARENA 2 — stage 3: THE UNVEILED HEAVEN (holy — luminous, not white-out)
What makes it read as HOLY rather than merely brighter:
1. **Distance dissolves into LIGHT, not darkness** — fog color `0xf0e2c4` at
   `near ~70 / far ~380`: the inversion of every biome's fog logic, and of Arena 1.
2. **The shafts return, swollen** — god-rays re-enabled with an intensity swell
   (dial the existing pass, tier-gated exactly as today; tier1/2 keep the sky/fog
   read without shafts — Law 10 degradation, stated not hidden).
3. **Gold light-rain** — motes `color 0xffe9b8, fall +0.5, sway 0.25` (slow
   descending grace-notes; the deliberate opposite of the void's up-drift).
4. **A bright glassy sea** — water `deep 0x6a86b8 / shallow 0xcfd8ee`,
   `waveAmp 0.5`; the existing sun-streak does the rest.
- Sky: `top 0x8fa8d8 / mid 0xe8d9b8 / horizon 0xf2e0b8`, `sunGlow 0xfff6dc`.
- Lights: `sunI ~1.9`, warm-white; hemi `sky 0xd8e2f0 / ground 0x8a7a58`.
- Grade (PR-C): `sat +0.04, vig −0.04`, small warm lift.
- **The luminance ceiling (the anti-washout law):** the authored horizon `0xf2e0b8`
  is L≈0.88 — deliberately BELOW white so (a) the boss's white-hot focal eye and the
  bullets' white cores remain the brightest things in frame (§3 law 2), and (b) the
  dark seraph reads as a sanctioned VALUE INVERSION (the HOLLOWGATE/pale-over-dark
  table, flipped — dark boss over light sky, the strongest silhouette in the fight).
  If the owner wants "more heavenly", push god-ray intensity and mote density, never
  the sky luminance past ~0.88.
- **Bullet band (the S3 hard requirement):** the default LIGHT band `0xffc6dc`
  (L≈0.83) fails against the L≈0.88 horizon (direct 0.05 < 0.15; layered core margin
  0.12 < 0.25). **Arena 2 declares `bullets:{ light: 0xff9ec4 }`** (L≈0.71 → direct
  margin ≈0.17 ✓). Exact values are the critic's to re-derive with
  `tests/bulletcontrast.mjs`'s own `lum()`; the gate extension (§5 T3) is the
  authority, not this table.

Both arena palettes + band overrides are EXPORTED DATA from `bossArena.js` so the
contrast gate and the shots tool consume the same source of truth as the renderer.

---

## 4. The transition — riding the existing clock, reading as a TELEPORT

**Clock (no new timers):** the arena blend is a pure per-frame function of boss.js
state — `(phaseIdx, stageBeatT, stageBeatDur)`:
- `stageBeatT < 0` (no beat running): mix = 1 at the current stage's arena. Stage 1
  ⇒ arena 0 ⇒ zero override.
- Beat running (`stageBeatT ∈ [0, dur]`): blend arena(phaseIdx−1's… — concretely,
  from-arena = the previous stage's, to-arena = the current `phaseIdx`'s) with
  `t = easeInOut(stageBeatT / stageBeatDur)`.
Because `beginStageBeat` and `model.setPhase` fire in the same frame
(`boss.js:3805/:3824`) with the same duration (`model.stageTransitionDur ≡
TRANS_DUR`), the world and the boss morph in lockstep by construction — no reach
into `transT`, no second clock to drift. The skip path (dev stage-pick tap,
`:2306-2313`) zeroes the beat → the function snaps to mix 1 the same frame the model
snaps (`setStage` is a cut) — snap-correctness falls out of being stateless.

**The "pulled into another dimension" texture — a PIECEWISE FLOOD, not a crossfade:**
a straight lerp between two skies reads as weather. Instead each transition routes
through an authored mid palette on the same clock:
- **S1→S2 THE CRACK:** `t 0→0.45` — the live sky lerps to a FLOOD palette
  (white-violet `~0xe8dcff` sky bands, fog.near crashing toward ~25, sunGlow
  swelling): the light behind the mask pours out and overexposes the world. One
  postfx `kick({flashFrames:1, bloom, lift})` at beat start (the existing kick
  channel, `postfx.js:136-161` — zero new plumbing) + the camera shake already fired
  at the shield burst. `t 0.45→1` — the flood decays into the void: the brightness
  drains, the stars are simply *there*, the fog stays close. The player never sees
  sky A become sky B; they see the world overexpose and then be somewhere else. That
  is the teleport.
- **S2→S3 THE UNVEILING:** same machinery through a GOLD flood (`~0xfff0c8`) — light
  blooms outward from the boss as the mantle opens, and recedes into the luminous
  heaven. God-rays re-enable at `t ≈ 0.6` so the shafts "switch on" as the veil
  passes.
- **The composed frame:** arena arrival (`t = 1`) is exactly the all-eyes reveal +
  `STAGE_REVEAL_HOLD` (0.7s, fire still held) — the shipped screenshot beat now lands
  IN the new world, with the existing reveal camera punch. **No camera takeover** —
  L156 is binding (owner rejected takeovers twice); everything above is what the
  world does from the fixed viewport.
- **Band-swap timing:** `activeBand` re-resolves at the REVEAL (`t = 1`), not at the
  shield burst — new-spawn-only coloring means in-flight stragglers from before the
  burst die out during the 2.7s held-fire window, and the first bullets of the new
  stage are born already in the new band. (Straggler bullets crossing the flood for
  ≤~1.5s in the old band: accepted transient; the flood itself is bright enough that
  the outline read carries them.)
- **Death exhale (PR-C, owner-decision O4):** on the final kill, hold the heaven
  through the slow-mo + FELLED card (the screenshot), then ease mix → 0 over ~2.5s
  during the dissolve — the sky it stole is given back. Game-over/hard teardown:
  hard snap in `resetBoss` (no ramp — the `:5416` precedent).

---

## 5. Verification (headless first; the human judges feel)

- **T1 — organ-liveness × arena (extends `tests/unmaskedorgans.mjs`):** the §1.3
  conjunction test, per stage in its OWN fresh forceFight boot (the rung-14 harness
  lesson — an idle fight kills the player at ~55s). Plus the string-assert that
  `bossArena.js` contains no scene-graph calls, and a live assert
  `model.rig.parent !== scene` (the positive-shape version of the embertide trap
  test) + `skyFadeK === 0` (`setSkyFade` never engaged — UNMASKED and the EMBERTIDE
  machinery must be provably disjoint).
- **T2 — new `tests/unmaskedarena.mjs`:** (a) zero-default identity — pin stage 1,
  diff EVERY `env` field against a no-boss `computeEnv(dist)` (byte-identical);
  (b) coexist — run an EMBERTIDE and a VOIDMAW forced fight, assert
  `bossArenaState().mix === 0` throughout (def-gated to unmasked);
  (c) sync/snap — advance a phase, assert mix reaches ≥0.99 within
  `TRANS_DUR + ε` and snaps on the skip tap; (d) BOTH teardowns — `resetBoss`
  mid-stage-2 and a full `endEncounter`, next frame env identical to baseline +
  `game.bossVoidSky === false`; (e) godray flag toggles with stage 2 and restores.
- **T3 — extend `tests/bulletcontrast.mjs`:** import the exported arena palettes +
  arena band overrides; run the existing per-background gate against the void and
  heaven horizon/fog values (pure data — the same loop, two more "biomes"). This is
  the merge-blocking legibility gate for §3's authored hexes.
- **T4 — determinism:** `tests/gold-determinism.mjs` green trivially (no `level.js`,
  no RNG anywhere in the feature; the blend is a pure function of fight state).
- **T5 — perf:** assert draw-call delta 0 between pinned S1 and S2 (the feature is
  uniform-writes only; `renderer.info.render.calls` via the `?debug=perf` seam or a
  headless probe). Additive-surface count unchanged (no new meshes in v1).
- **Shots for the gates:** new `tools/arenashots.mjs` (the tiershots/tonemapshots
  harness pattern): one montage — 3 stages pinned × {mid-transition frame at t≈0.5}
  × 2 source biomes (Astral + Sanctuary, proving source-independence of S2/S3).
  This montage is the Fable Quality-Gate artifact and the owner's judgment surface.
- **The human/Fable judge:** the flood MOTION (does it read as being pulled through,
  or as a fade), the void's "another place" read, the heaven's "holy vs washed out"
  read, boss + bullet legibility in all three — on the PR preview. Never claim these
  from headless.

**Fable Quality-Gate obligation:** this is a graphics-heavy feature —
per `GRAPHICS-OVERHAUL.md` it runs a Gate-1 pre-build design check and a Gate-2
pre-merge review (montage + diff + checklist) even though it ships on the boss
stream, not the graphics branch. Branch coordination: the touches to
`environment.js` (one call), `postfx.js` (one flag + later one bias term) are in
files the graphics branch owns heavily — keep the diffs to the named single seams,
and flag the PRs to the graphics stream for its phase-start rebase.

---

## 6. Reuse over invention (exact inventory)

| Need | Reused system (exact) | New? |
|---|---|---|
| Sky recolor / stars / far-field | sky-dome uniforms + `starMix`/`fogFarMix` xMix gates (`environment.js:285-351`) | no |
| World swallow / light haze | `scene.fog` + `fogFarColor` dual-fog (§5.2 BIOME-DESIGN, shipped inc-2) | no |
| Lighting shift | `sun`/`hemi` writes in `updateEnvironment:508-511` | no |
| Water states | `setWaterTint` (all values already plumbed, incl. fogFarColor) | no |
| Mote choreography | `updateAmbient(env)` — `ambColor/fall/sway/opacity`, Caldera's negative-fall precedent | no |
| Landmark suppression | `whaleMix/flybyMix` env gates | no |
| Transition flash | postfx `kick()` channel (`postfx.js:148-161`) | no |
| No-sun shaft suppression | the `game.embertideSky` disable at `postfx.js:379` | new FLAG, same one-liner |
| Grade bias (PR-C) | the `_bossMix` additive-bias idiom (`postfx.js:341-347`) | new TERM, same idiom |
| Per-arena bullet band | `resolveBand` biome-override shape (`boss.js:1110`) | new re-resolve call at reveal |
| Stage-synced clock | `stageBeatT/stageBeatDur` (`boss.js:1083`) | no |
| Teardown discipline | the `:1873`/`:5416` skyFade reset template | same pattern, arena reset |
| **Genuinely new** | `js/bossArena.js` (~250 lines: 2 arena palettes + 2 flood palettes + blend math + state), `def.arenaStates` flag, `__dd.bossArenaState()` seam, `tools/arenashots.mjs`, tests | yes — all new-file (the conflict-isolation law) |

Honest scope (the rung-14 "no new empties → whole authoring pass" precedent): this
is NOT "swap the sky." It is a **sky + fog + lighting + water + motes + grade + band
authoring pass across two full arena states plus two transition curves** — the
plumbing is genuinely thin (one env override), but the VALUES are an art pass that
will take owner/Fable iteration rounds, and the plan budgets for that (PR-C exists
for exactly this).

## 7. Composition with the finale-completion plan (`docs/unmasked-finale-completion-plan.md`)

Distinct axis (environment vs attacks/entrance); shared surfaces, called out:
- **The def:** both plans edit the `unmasked` def block — textual merge conflicts
  only; land whichever PR is ready, rebase the other.
- **The stage seam:** both attach to the phase-advance block (`:3790-3830`). This
  plan adds ~5 lines (arena drive is elsewhere, per-frame); their INC-4 re-veil
  cycle (`setVeil(k)`) must NOT re-trigger arena transitions — the arena keys off
  `phaseIdx` + `stageBeatT`, and the re-veil uses neither, so it composes clean; the
  T2 test adds a re-veil-cycle assertion once INC-4 exists.
- **INC-4 surge-chase (their FEEL cliff) happens IN the heaven:** its legibility
  judgment must be made against Arena 2, not the ordinary sky — sequence this plan's
  PR-B BEFORE their INC-4 owner playtest, or the choreography gets judged twice.
- **INC-5/6 second-sun landmark + entrance:** out-of-fight and stage-1 respectively
  — arena mix is 0 in both windows by construction. The *Don't Move* stillness is
  deliberately in the ORDINARY sky (the world reacting is the crack's payoff, not
  the entrance's).
- **Their audit's F-findings** (relic destruction, lockdps) do not touch this plan
  (no attack/cadence/relic changes here).

## 8. Increments — each one PR, def-gated, GO-gated

### PR-A — THE HOLLOW (foundation + S1→S2) — the hero increment
`bossArena.js` (arena 0/1 + crack flood + blend), the `environment.js` override
call, boss.js drive + BOTH teardown resets + `game.bossVoidSky`, the postfx
suppression one-liner, `def.arenaStates` gate, debug seam, T1/T2/T4/T5 +
bulletcontrast for arena 1, `arenashots` (2 states). **Interim rule (honest):**
stage 3 HOLDS the void (mix stays 1) until PR-B — a void→ordinary pop at the unveil
would be worse than the void persisting. **GO gate:** all headless green +
Fable Gate-2 on the montage; owner judges the crack flood + the void read on
preview.

### PR-B — THE HEAVEN (S2→S3) 
Arena 2 + unveil gold flood + god-ray swell + the reveal-time band re-resolve
(both arenas' band overrides land here as one mechanism) + bulletcontrast for
arena 2 + montage regen. **GO gate:** T3 green (the S3 light-band fix proven),
Fable Gate-2; owner judges holy-vs-washout + bullet read; then their INC-4
playtest can proceed against the real arena.

### PR-C — POLISH (the feel pass)
Grade biases (the additive term), flood curve tuning from owner notes, death
exhale (O4), mote choreography refinement, any Fable-gate deltas (e.g. the
backlight-disc fallback if the S2 silhouette flagged). **GO gate:** owner FEEL
sign-off — this PR is the budgeted iteration space.

Order by risk: the void is the harder read (darker arenas are where "another
dimension vs dimmer" lives or dies) and the crack is the owner's named beat —
prove it first on the smallest surface.

## 9. Risks, ranked by ship-danger

| # | Risk | Failure mode | Mitigation | Gate |
|---|---|---|---|---|
| R1 | **Reparent/lance-death trap** | any future "just camera-lock the void dome" drift silently kills organs + RECKONING (the embertide failure, exactly) | zero scene-graph ops by design; T1 conjunction test drives the live-fight path per arena; string-assert on bossArena.js; `rig.parent !== scene` + `skyFadeK===0` asserts | headless (T1) |
| R2 | **"Darker/holy" reads as "dimmer/brighter"** | the owner's beat lands as a lighting tweak, not a teleport | each arena built from ≥4 non-brightness channels (sun-gone/stars/fog-swallow/up-drift; light-fog/shafts/gold-rain/bright-sea); the flood masks the swap; arenashots montage | **HARD owner/Fable gate** |
| R3 | **S3 bullet legibility** | danger magenta washes out on the luminous sky — a fairness break, not a style miss | luminance ceiling 0.88; arena band override (light→0xff9ec4); T3 is merge-blocking; reveal-time band swap in the bullet-free window | headless (T3) + owner |
| R4 | **S2 boss silhouette (dark-on-dark)** | the seraph vanishes into its own void | bruise horizon band at wing height; lit-edge carry (14 eyes + gold rails + white focal); sanctioned backlight-disc fallback (behind silhouette plane, non-enclosing) | Fable gate on montage + owner |
| R5 | **Overdraw / weak-mobile budget** | new sky/fog/light volume tips the §2 cliff | v1 adds ZERO draws and zero additive surfaces (uniform writes on existing meshes); god-rays are the existing tiered pass; T5 asserts draw delta 0 | headless (T5) + device pass with PR-B |
| R6 | **Grade fights `bossGradeTarget`** | the world-dim and the arena bias overwrite each other or double-dim tier-0 | additive-bias idiom only (never uniform writes); bias values authored ON TOP of the standing −0.10 sat boss dim; tier-2 loses grade by design (Law 10 — sky/fog/light carry the read there, stated in the PR) | headless kick-state test + owner |
| R7 | **Transition sync/skip drift** | world morphs on a different clock than the boss; a skip strands a half-void | stateless blend from `(phaseIdx, stageBeatT)` — same frame, same duration as the model's clock; snap-by-construction; T2(c) | headless (T2) |
| R8 | **Teardown leak** | game-over in stage 2 leaks the void into the recap/next run (the rung-14 latch lesson) | reset in BOTH `endEncounter` and `resetBoss` (the `:1873`/`:5416` template); T2(d) | headless (T2) |
| R9 | **EMBERTIDE coexist collision** | the two sky-owning systems both engage in some path (rush embertide→unmasked back-to-back) | def-gated disjoint (`skyReplace` vs `arenaStates`); T2(b) + a rush-sequence boot assert | headless (T2) |
| R10 | **Completion-plan collision** | INC-4's re-veil retriggers arena transitions; def merge conflicts | arena keys off `phaseIdx`/`stageBeatT` only (§7); sequence PR-B before their INC-4 playtest | headless + sequencing |

## 10. Owner decisions (surface BEFORE build)

- **O1 — The void's identity:** starlit violet HOLLOW (recommended — maximally
  distinct from every biome via sun-gone + up-drift) vs a pure-black abyss vs a
  blood/ember dark. Decides Arena 1's palette block.
- **O2 — The heaven's ceiling:** luminous gold-cream capped at L≈0.88 (recommended
  — keeps the focal eye + bullet cores supreme) vs a nearer-white-out (would force
  much deeper bullet overrides and dulls the boss's white focal).
- **O3 — Transition texture:** piecewise FLOOD through white/gold (recommended —
  the teleport read) vs hard cut at t=0.5 vs plain crossfade. Cheap to A/B in PR-A.
- **O4 — The death exhale:** heaven held through kill card, then eased back
  (recommended) vs held until run-resume vs instant restore.
- **O5 — The void floor:** black-glass mirror water (recommended — the star mirror
  is a screenshot) vs fog-swallowed to nothing (`fog.near` under the waterline).

## 11. Recommended build sequence

**Gate-1 Fable design check → PR-A (void + crack, hero) → owner verdict on the
crack flood → PR-B (heaven + unveil + band gates) → owner verdict / unblocks
completion-plan INC-4 judging → PR-C (grade + exhale + feel deltas) → Gate-2 per PR
throughout; lesson file per merge (THE RULE).**

Nothing in this plan blocks, or is blocked by, the completion plan's INC-3/5/6/7;
the only ordering constraint is PR-B before their INC-4 owner playtest.
