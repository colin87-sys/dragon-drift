# FEASIBILITY AUDIT — THE UNMASKED per-stage ARENA/DIMENSION TRANSFORMATION plan

**Audits:** `docs/unmasked-arena-transformation-plan.md` (+ its lesson
`leapfrog/lessons/2026-07-11-unmasked-arena-transformation-plan.md`)
**Verified against:** master @ fee8d07 (2026-07-11) — every seam below re-read from live
code this session; contrast numbers re-derived with `tests/bulletcontrast.mjs`'s own
`lum()` (run, not eyeballed).
**Verdict up front:** the plan's core discovery is REAL and load-bearing —
`computeEnv(dist)` has exactly one consumer (`environment.js:497`) and the `env` scratch
fans out to sky uniforms / scene fog / sun+hemi / `setWaterTint` / `updateAmbient` every
frame (`environment.js:497-537`), so a post-`computeEnv` value-space override is a sound,
reparent-free injection point. The transition clock claim is also verified sound. **But
the plan is wrong in two places that matter:** (1) the *world* is bigger than `env` — the
near-field prop bands bypass it entirely and will march glowing biome architecture
through "the void"; (2) the heaven's luminance ceiling (L≈0.88) is derived only against
the overridable BAND and misses that UNMASKED's own def fires **amber** (fixed role
colour, no override lever) in stage 3 — at L≈0.88 the amber parry shot and its cyan
return fail the shipped contrast gate against BOTH heaven backgrounds. That is a
fairness break baked into the authored palette, and it re-opens owner decision O2.

---

## F1 (SHIP-DANGER #1, silent) — The near-field props bypass `env`: the void will have glowing Astral monoliths in it

**The plan's claim (§3 Arena 1.3):** "The world is swallowed… props/horizon dissolve
into void within a few hundred metres — the arena becomes a pocket. (Clean-arena law
already stops new spawns in-fight; the fog eats what remains.)" And §3's design rule:
"stages 2/3 look IDENTICAL regardless of source biome."

**The code:** both statements are false for the prop bands.

- The clean-arena law gates **level spawns only** — rings/obstacles/hazards/set-pieces
  (`main.js:194` `if (game.inBoss) return;` inside `spawnAhead`). The environment prop
  bands are not spawns: `updateEnvironment` recycles them every frame off `playerDist`
  (`environment.js:494` `recycleBand`), boss or no boss.
- Prop materials are **static per-biome, with strong emissive** that no light or env
  value touches: starlit crystal `emissiveIntensity 1.1`, biolume caps `1.0`, magma seams
  `0.9` (`environment.js:76-91`). They read biome env exactly nowhere.
- The void's fog (`near 45 / far 240`) does not eat them. Props place at lateral
  `|x| ≈ 13.5-28` (`environment.js` `place()` fns) and stream past within ~20-80m of the
  camera; linear fog at 60m is `(60-45)/195 ≈ 8%`. Emissive is unaffected by the dimmed
  sun/hemi at any distance.

**Failure scenario:** anchor fight in Astral → S1→S2 crack → THE HOLLOW BEHIND THE SKY
arrives with fully-lit slate monoliths and glowing arcshards marching through it at 60fps.
It reads as "Astral, dimmer" — the exact failure R2 exists to prevent — and a fight
started in Sanctuary shows *different* architecture in the "same" dimension, breaking the
plan's source-independence claim. **Every headless test in §5 stays green** (organs,
env-diff, draws, contrast); the arenashots montage can miss it because prop placement is
RNG — a chosen frame can be prop-free. This ships silently.

**Minimal fix (value-space, no reparent):** an `environment.js` seam that gates the prop
bands off while arena mix > threshold — `band.mesh.visible = false` is the already-shipped
kill-switch idiom (`environment.js:440-443` `updateBandVisibility`), restored
unconditionally in both teardowns. ~15 lines + one T2 assert (`bands all invisible at
mix≥0.99; visible next frame after resetBoss`). Recycling keeps running so restore is
free; no RNG stream touched (visibility only) — determinism holds. Decide the heaven's
props separately (hidden, or kept as light-swallowed silhouettes — owner call, see O6).

---

## F2 (SHIP-DANGER #2, blocks PR-B as designed) — The heaven's L≈0.88 ceiling breaks the FIXED role colours; the plan's bullet analysis only checked the overridable BAND

**The plan's claim (§3 Arena 2):** horizon `0xf2e0b8` (L≈0.88) is "deliberately BELOW
white" so bullets stay readable; the only failure named is band-light, fixed by
`bullets:{light:0xff9ec4}`.

**What the plan never checked:** the gate loops SIX colours per background
(`tests/bulletcontrast.mjs:75-82`), and two of them have **no override lever by design**:
`reflect-amber 0xffc23c` and `reflected-cyan 0x66ddff` are fixed role colours ("the
player learns amber = parryable once, globally" — `bulletcontrast.mjs:57-63`). And THE
UNMASKED **fires amber in every stage**: `bossDefs.js:1791` ("amberdiet: every phase
carries an amber carrier") — stage 3's list carries `'fan'`, and aimed/fan precision
shots are `REFLECT_COLOR` (`boss.js:1093`, applied at spawn `boss.js:4613`). In Surge,
*every* bullet is parryable (`bossBullets.js:680`) so cyan returns exist in S3 too.

**Verified numbers (the gate's own `lum()`, run this session):**

| colour | L | vs heaven fog 0xf0e2c4 (L=.889) | vs heaven horizon 0xf2e0b8 (L=.882) |
|---|---|---|---|
| reflect-amber | .774 | direct .116 < .15 **FAIL** | direct .108 < .15 **FAIL** |
| reflected-cyan | .777 | direct .112 **FAIL** | direct .105 **FAIL** |
| band-light (default) | .830 | .059 **FAIL** (plan: correct) | .052 **FAIL** (plan: correct) |
| band-light override 0xff9ec4 | .711 | .178 PASS (plan: correct) | .171 PASS |
| danger 0xff2b6a | .363 | .526 PASS | .519 PASS |

The layered outline+core read is **dead above bg L 0.75** (`CORE_L − bgL ≥ 0.25`
requires bg ≤ 0.75, `bulletcontrast.mjs:36`), so at 0.88 everything must clear DIRECT —
which amber/cyan cannot. Unlike the shipped AMBER WASTES exception (horizon-only; the
fog, L≈0.72, still carried the layered read — `bulletcontrast.mjs:55-67`), the heaven
fails amber on **both** fog and horizon: an amber shot the player is invited to roll into
would be low-contrast against everything behind it. That is a fairness break, not a
style miss — R3's own words.

The plan's T3 ("the same loop, two more biomes") would hard-fail on this, so it is
caught-at-build rather than shipped — but the *design number is wrong now*: the true
gate-compatible luminance ceiling for the heaven is **~L 0.75** (where the layered read
revives for the un-overridable colours), not 0.88. At 0.75, note the default band-light
(0.830) also passes via layered (outline .72 ✓ / core .25 ✓ boundary) — the entire §3
S3 palette + override table needs re-derivation, and **O2 must be re-framed** ("luminous
gold-cream capped at L≈0.75; brighter than that costs the parry mechanic its read").
Alternative (rejected here): KNOWN_EXCEPTIONS entries for the heaven — unjustifiable
because both backgrounds fail (the Wastes precedent had a passing fog side).

**Minimal fix:** re-author heaven fog/horizon at L ≤ ~0.75 before PR-B; put amber+cyan
explicitly in T3's scope statement; re-run the montage judgment on the darker ceiling
("holy" must come from shafts/gold-rain/fog-into-light, which is §3's own ≥4-channel
law anyway).

---

## F3 (thesis check) — The single-consumer claim: TRUE at the seam, but "one lerp retints the whole world" overstates; enumeration of every bypass

**Verified true:** `computeEnv` is called exactly once in `js/`
(`environment.js:497`; grep-confirmed — every other hit is docs). The fan-out at
`environment.js:499-537` covers: sky-dome uniforms (top/mid/horizon/sunGlow/fogFar/
starMix), `scene.fog` color/near/far, sun + hemi color/intensity, `setWaterTint`
(deep/shallow/sun/horizon/zenith/waveAmp/fogFarColor — the water sun-streak dies
automatically when `env.sunGlow→black`), and `updateAmbient` (mote color/fall/sway/size/
opacity, fauna color/scale/flap, whaleMix `ambient.js:165`, flybyMix `ambient.js:208`).
The injection point is sound and even forward-compatible: the graphics roadmap's planned
`updateSkyProbe(env)` / `atmos` / `sky.cloud` consumers (`GRAPHICS-OVERHAUL.md:227-233,
311, 325`) all sit downstream of the same scratch, so they inherit the override for free.

**Bypasses the plan missed (beyond F1's props):**

1. **The bird flock has no env gate** (`ambient.js:185-203`): seven wings circle the
   course whenever quality > 0.4 — in the void and the heaven. Fix is free and
   value-space (`env.faunaScale → 0` collapses them, `ambient.js:199`), but the plan's
   arena states never list the fauna fields at all.
2. **God-ray intensity is not a dial** — it is recomputed and overwritten every frame in
   `main.js:1423-1430` as `Math.min(sunFacing,1) * 0.6`. The heaven's "shafts return,
   swollen — dial the existing pass" needs a NEW seam (a boost multiplier read in
   main.js or a `setGodRayBoost` export), i.e. a `main.js` edit the plan's file
   inventory does not carry — and main.js god-ray code is graphics-branch territory too
   (F11). Small, but "zero new plumbing" is false here.
3. **`feverMix` is an independent sky channel** composed inside the shader *after* the
   env colors (`environment.js:315-334`): a Dragon Surge mid-void repaints the horizon
   band magenta and lights aurora curtains over the starfield; motes lerp toward
   `feverColor` (`ambient.js:128`). Worse, **endEncounter grants `feverActive = true` as
   the kill reward** (`boss.js`, "Carry Dragon Surge OUT of the fight"), so the PR-C
   death exhale plays under a magenta surge wash by construction. The plan composes two
   sky-writers (biome, arena) and there are three. Needs a stated policy (accept the
   surge tint as the player's own light; or damp feverMix's sky term with arena mix —
   one uniform, value-space).
4. **Schema exhaustiveness (silent, future-facing):** an arena state that omits an env
   field silently inherits the live biome's value at mix 1 — e.g. omit `faunaColor` and
   the heaven's flock is Astral-koi-blue; omit every future field the graphics stream
   adds to `computeEnv` (clouds, atmos) and the void keeps biome clouds. Minimal fix: a
   completeness assert — arena states must enumerate every key of the `env` object
   (`biomes.js:173-187`) or declare explicit inherits; the T2(a) zero-diff test only
   proves mix **0**, never mix 1.
5. Cosmetic, note-only: `contactShadow.js:19` uses the static `SUN_DIR` (a blob shadow
   cast by no sun in the void); `su.sunDir` static (irrelevant once sunGlow is black);
   `game.embertideSky`/`skyDim` is a parallel dome channel — provably disjoint per the
   plan's own `skyFadeK===0` assert, good.

**Honest resize:** the feature is `bossArena.js` + the env override + prop-band gate +
fauna fields + god-ray boost seam + fever policy ≈ 1.3-1.5× the plan's stated surface
and one extra touched file (main.js). Not the 5× blow-up that would kill it — the thesis
survives; the marketing sentence doesn't.

---

## F4 — `kick()` cannot be called as the plan writes it (small, but it's the plan's "zero new plumbing" exhibit)

`kick(name)` takes a **preset name** and looks it up in `KICK_PRESETS`
(`postfx.js:164-175`); the plan's `kick({flashFrames:1, bloom, lift})` (§4) is not a
signature that exists. The flood needs a new preset entry (~3 lines in `postfx.js` —
a file the plan promises to touch only for the flag + bias). Caps to know when
authoring: `KICK_MAX.bloom 0.36 / lift 0.6` (`postfx.js:138`), tier 1 halves impulses
(`_kickScale 0.5`), tier 2 no-ops the kick entirely (`postfx.js:165`) — the flood read
on weak mobile is carried by the palette lerp alone, which the plan (correctly) also
relies on. Fix: name the preset (`arenaFlood`), state the tier-2 degradation in the PR.

## F5 — T5's "draw-call delta 0" fails by the plan's own design

Suppressing the whale (`whaleMix→0`) hides a 5-mesh group (`ambient.js:100-123`), and
the flyby hides its instanced mesh — pinned S1-in-Astral vs S2 **decreases** draw calls.
An exact `delta === 0` assert fails on the plan's intended behaviour. Assert
**no NEW draws** (`delta ≤ 0`) and additive-surface count unchanged. (The zero-new-draw
claim itself verified honest: starfield/fog/lights/water/motes are uniform or attribute
writes on existing meshes; god-rays are the existing tier-0 pass; the flood is the
existing kick channel.)

## F6 — Pinned-S3 from-arena pop (the dev/test path T1 itself rides)

`setBossDebugStage(3)` sets `debugPhaseJump = 2`, applied at enterFight
(`boss.js:5510-5515`, `:2076`); during warn/approach `phaseIdx` is still 0 → arena 0
(ordinary sky, correct). At fight start the intro beat begins (`boss.js:2096-2100`) and
the plan's blend rule ("from-arena = phaseIdx−1's") makes the world **snap
ordinary→VOID in one frame** (the void was never on screen) before blending to the
heaven. Fix: intro beats (`stageBeatSkippable === true`) blend from **arena 0**, not
`phaseIdx−1`. Related: a *live* `bossSetStage(n)` re-pin swaps the model rig but not
`phaseIdx` (`:5515` model-side only) — arena and rig can disagree on that dev path;
tests pin pre-spawn (`tests/unmaskedorgans.mjs:34`), so T1 is unaffected, but say so in
the test comment.

## F7 — PR-B ships the exact pop the plan calls "worse than persistence"

Pre-PR-C there is no death exhale, so killing the third form hard-resets the arena in
`endEncounter` → **heaven→ordinary snap under the FELLED card** — the same pop class
§8 PR-A's interim rule exists to avoid at the unveil. Minimal fix: a fixed-rate mix→0
ease on the natural-kill path ships in **PR-B** (PR-C keeps the *authored* exhale);
`resetBoss` keeps the hard snap (the `:5417` template).

## F8 — The no-scene-graph string-assert as specified trips on legitimate palette math

`grep -c "scene.add\|\.add(\|parent"` (§1.1): `\.add(` matches `THREE.Color.add()` /
vector math that a palette/blend module legitimately uses. Narrow the assert to
scene-graph shapes: `scene\.add|\.rig\b|\.parent\s*=|new THREE\.(Mesh|Group|Points|
InstancedMesh|Sprite)`. The live asserts (`model.rig.parent !== scene`,
`skyFadeK === 0`) are the real guard and are correctly designed.

## F9 — Grade coexistence: VERIFIED FINE (the plan is right)

`_bossMix` terms are additive (`postfx.js:341-347`: `sat −0.10·mix`, `vig +0.05·mix`,
bloom `−0.05·mix`) and decay unconditionally (`:309-318`); a second additive arena term
composes without a winner/loser. Stacked worst case (void bias −0.12 + shielded −0.10)
lands sat ≈ 0.96 at tier 0 — legal. Tier ≥2 loses the ENTIRE grading pass
(`postfx.js:276-279`), not just the new term — the plan's Law-10 framing is honest, and
the void/heaven read survives because it lives scene-side (env values), which is
precisely why the env injection was the right layer. No change needed.

## F10 — Transition sync + band swap: VERIFIED SOUND (two nits)

- Same-frame lockstep confirmed: `beginStageBeat` (`boss.js:3805`) and
  `model.setPhase(phaseIdx)` (`:3824`) both fire inside `breakShield`;
  `stageBeatDur ≡ model.stageTransitionDur ≡ TRANS_DUR 2.0`
  (`boss.js:1088`, `bossUnmasked.js:793,1018`). Skip path zeroes the beat and cuts the
  model the same frame (`boss.js:2310-2313` → `setDebugStage` sets `transKind = null`,
  `bossUnmasked.js:796-800`) — the stateless blend snaps correctly by construction, as
  claimed. Nits: (1) clamp `t` — `stageBeatT` keeps counting through the 0.7s reveal
  hold (`boss.js:2328`), so `t = stageBeatT/stageBeatDur` exceeds 1; (2) the model's
  `transT` advances **linearly** (`bossUnmasked.js:882`) with easing inside the
  setters, while the plan eases `easeInOut` — endpoints align, mid-curve drifts a few
  percent; pick one curve and say so.
- Band swap: bullets take their colour at spawn from `activeBand`
  (`boss.js:4326-4581`); no in-flight recolor exists — reveal-time re-resolve is safe as
  claimed. Fire IS held through the window (`attackTimer ≥ d + 0.7`, `pending` wiped,
  `boss.js:1091, 3800`). One correction: the **rider's chip shots keep firing through
  the beat** (`boss.js:2777-2784` — `riderTimer` is never held by `beginStageBeat`);
  they are fixed cyan player-side bullets (`fireRiderShot`, `boss.js:4620`), not band
  bullets, so the swap-timing claim stands — but "no NEW bullets spawn during the swap
  window" is false as a sentence; scope it to boss volleys.

## F11 — Graphics-branch coordination: real, manageable, one addition

`GRAPHICS-OVERHAUL.md:96-99`: the long-lived branch owns `environment.js`/`postfx.js`;
master↔branch syncs happen at phase boundaries only. The plan's single-seam discipline +
Gate-1/Gate-2 obligation (§5) matches the protocol. Add two things: (a) the god-ray
boost seam (F3.2) touches **main.js's** god-ray feed — also graphics territory; name it
in the PR flag; (b) the F3.4 schema-completeness assert is the actual collision
insurance — when the graphics stream adds env fields, the arena states fail loudly
instead of leaking biome clouds into the void a phase later.

## F12 — Teardown / coexist / determinism: mostly verified, one template hole

Both teardown templates exist as cited (`boss.js:1873` endEncounter, `:5417` resetBoss).
Note the template the plan copies has a hole: **resetBoss never clears
`game.embertideSky`** (it relies on the next `updateBoss` frame, which only runs while
playing). The arena's flags (`game.bossVoidSky`, mix state) must be cleared explicitly
in BOTH paths — the plan's T2(d) asserts exactly this, so implement to the assert, not
the template. Determinism: verified no RNG anywhere in the proposed feature (motes are
an existing deterministic-enough pool; prop-band hiding touches no `rnd` stream); S1
byte-identity is achievable with an early-return at mix 0. Coexist: `skyReplace` vs
`arenaStates` def-gating is genuinely disjoint (`boss.js:1703` guard is `def.skyReplace`;
unmasked is `approachFrom:'ahead'`, `bossDefs.js:1755-1760` confirms no skyReplace).
Naming nit: `bossArena.js` collides with the shipped `game.bossArenaHW/HY` arena-geometry
clamps (`gameState.js:51`) — pick `bossDimension.js`/`arenaState.js` to keep greps clean.

---

## Component verdicts

| Component | Verdict |
|---|---|
| `env` override injection (environment.js one call) | **BUILDABLE AS WRITTEN** — thesis verified at the seam |
| Void arena (PR-A) | **BUILDABLE WITH NAMED FIXES** — prop-band gate (F1), fauna fields + bird kill (F3.1), flood preset (F4), intro-beat from-arena (F6) |
| Heaven arena (PR-B) | **UNDER-SCOPED — palette re-derivation required** (F2): the 0.88 ceiling contradicts the shipped gate + the def's own amberdiet; ceiling ≤ ~0.75 or an owner-signed exception policy; band table re-derived after |
| Transition clock / skip-snap | **BUILDABLE AS WRITTEN** (clamp t; one curve) |
| Reveal-time band swap | **BUILDABLE AS WRITTEN** (scope the "no bullets" sentence to boss volleys) |
| Grade bias (PR-C) | **BUILDABLE AS WRITTEN** (F9 verified) |
| Organ-safety proof (T1) | **BUILDABLE AS WRITTEN** — right design, drives the live path; fix the string-assert pattern (F8) |
| Perf / draws (T5) | **BUILDABLE WITH FIX** — assert delta ≤ 0 (F5); zero-NEW-draw claim itself verified honest |
| Death exhale | move a minimal ease into **PR-B** (F7); authored version stays PR-C |
| God-ray swell | **BUILDABLE WITH THE NAMED SEAM** — needs a new boost export/flag consumed in main.js:1423-1430; not "dial the existing pass" |
| Fever/Surge composition | **BLOCKED-ON-DECISION (small)** — three sky-writers exist; pick a policy (F3.3) |

## Corrected build sequence

1. **Pre-build (before Gate-1):** re-derive the heaven palette at ceiling L ≤ ~0.75 and
   re-run the six-colour gate on both arenas (10-minute script, done in this audit's
   style); re-frame O2 with the real number; decide O6 (props) and the fever policy.
2. **Gate-1 Fable design check** on the corrected palettes + the prop-gate approach.
3. **PR-A — THE HOLLOW:** as planned **plus** the prop-band gate, fauna-field authoring
   (birds/whale/flyby all zeroed), the `arenaFlood` kick preset, intro-beat from-arena-0
   rule, schema-completeness assert, T5 as delta ≤ 0. Stage 3 holds the void (unchanged).
4. **PR-B — THE HEAVEN:** re-derived palette + band mechanism as planned **plus** the
   god-ray boost seam (flagged to the graphics stream) **plus** the minimal natural-kill
   ease-out (F7). T3 covers all six colours × both arenas explicitly.
5. **PR-C — POLISH:** grade biases, authored death exhale (now must compose with the
   post-kill surge grant — F3.3), flood tuning, Fable-gate deltas. Unchanged otherwise.

## Must-fix before build (short)

1. Heaven ceiling re-derivation vs amber/cyan (F2) — the palette in §3 is not shippable.
2. Prop-band gate designed into PR-A (F1) — without it the void read fails silently.
3. Arena states enumerate ALL env fields incl. fauna + completeness assert (F3.1/F3.4).
4. God-ray swell seam named as a main.js touch (F3.2) and flagged to the graphics branch.
5. T5 → delta ≤ 0; string-assert pattern narrowed (F5/F8).

## Owner decisions that genuinely block starting

- **O2 (re-framed):** heaven brightness — the gate-compatible ceiling is ~L 0.75, not
  0.88; above it the parry read is forfeit. Accept 0.75 (holy carried by
  shafts/rain/fog-into-light), or sign an explicit fairness exception.
- **O6 (new):** the void's architecture — hide the prop bands (empty pocket, recommended)
  vs keep them as fog-dimmed silhouettes (needs a per-prop dim that doesn't exist).
- **Fever policy (new, small):** does Dragon Surge repaint the other dimension (player's
  own light wins) or does the arena damp the surge sky-tint? Also decides what the death
  exhale looks like, since the kill grants Surge (`endEncounter` sets `feverActive=true`).
- O1 / O3 / O4 / O5 stand as written in the plan.

*Everything else in the plan checked out against the code cited: `boss.js:1703`
reparent path never entered; `syncSkyRig` guard `def.skyReplace` (`boss.js:3611`);
`postfx.js:379` suppression precedent; `resolveBand`/`activeBand` (`boss.js:1109-1118,
1653, 1881`); `bossUnmasked.js:793-885` stage machine; `main.js:351` `bossSetStage`;
Astral's certified `dark:0xa84167` (`biomes.js:150`) passes both void backgrounds
(direct .29-.32); L156 honored (no camera writes anywhere in the design).*
