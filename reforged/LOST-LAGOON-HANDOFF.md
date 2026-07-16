# LOST LAGOON — GROUND-UP REDESIGN HANDOFF ("Jungle Drowned Temple")

> **Read this whole file first, then the docs it points to.** This is the authoritative brief for redesigning
> Biome 0's prop vocabulary. The composition/lighting FRAMEWORK is built and shippable; the PROP FORMS failed
> a legibility test and are being replaced. Your job: build a NEW, premium, unmistakably-tropical prop roster
> on top of the existing framework, gated by Fable at a hard 4.2/5.

---

## 0. Before you write any code
Read, in order: `CLAUDE.md` + `LEAPFROG.md` (THE RULE — one lesson file per change), then
`reforged/BIOME-DESIGN.md`, `reforged/AAA-PIPELINE.md` (the premium light+polish+convergence playbook),
`reforged/DRAGON-DESIGN.md` (the shape-agnostic "make it read RICH not a stick" method — it applies to props),
and the recent lessons `leapfrog/lessons/2026-07-16-graphics-*.md` (composite bake, world-aspect-under-scale,
composition-engine-unwired, in-context-closeup-camera-seam, prop-hazard-silhouette-firewall).
Branch: **`claude/caldera-biome-overhaul-1hybmf`** (PR #466).

## 1. Why this redesign exists (the failure to not repeat)
The old Lost Lagoon lineup — a drowned Greco-Roman **rotunda**, a colonnade **arcade**, tumbled **wrackstone**,
a fig-on-masonry **rootbastion**, **lilyraft** pads — was gated by Fable through composition (2.0→**4.3**) and
value (→3.9). Then the owner looked at the props and said: *"how are these lost-lagoon props? I don't see how
it makes sense… they look janky and generic."* **Root cause: the forms were too ABSTRACT to read as any place
(a pale mound reads as a rock, not a temple), and there was almost no living tropical nature — it was "five
kinds of gray ruin."** The theme lived in the design docs, never on the geometry. Do not repeat this: **every
prop must READ AS ITS CONCEPT at cruise distance, and the biome must show its living nature, not just ruins.**

## 2. The locked identity: JUNGLE DROWNED TEMPLE
SE-Asian tropical lagoon at **golden hour**: **Ha Long Bay / El Nido limestone karst** + **Angkor Wat / Ta
Prohm jungle-swallowed temple ruins**. Reference DNA: **NatGeo × Ghost of Tsushima × BotW**. It is a LOST
HIDDEN WATERY PARADISE — a drowned temple-civilization being reclaimed by a living jungle-lagoon: serene, warm,
alive. **Both halves must be legible: LIVING NATURE (karst, mangrove, water plants) AND a DROWNED CIVILIZATION
(a legible temple culture, not abstract rubble).**

### Non-negotiable requirements
- **AAA / premium or it's a fail.** Legible silhouettes at distance + up close; real value structure; no lumps.
- **UNIQUE vs every other biome.** Others own: Emberfall Caldera (black basalt + magma), Sunset Glacier
  (luminous blue/bleached ICE), Aurora Shallows / Lumen Mire (bioluminescent night, biolume caps, starlit
  crystal, aurora), a desert Wastes (obelisks/columns). **The Lagoon's turf is WARM GOLDEN-HOUR TROPICAL:
  green jungle + honey limestone + jade tidewater + gilt sunset.** Never drift toward another biome's palette.
- **Do fresh research** on the identity (karst, mangrove root systems, Angkor/Ta Prohm silhouettes, tropical
  golden-hour water) before building — Fable's synthesized plan (§7) is the start, not the ceiling.

## 3. What is DONE and must be KEPT (the framework — do not rip out)
These are committed and green; the new props plug into them:
- **The composition engine is now wired for the Lagoon** (`writeMatrix`, `bi === 0` branch, ~env.js:1944) with
  `lagoonComp()` (~env.js:1823): a raised-cosine breath↔congregation rhythm (squared for WIDE open-water
  breaths, 3 island-groups/biome) + arrival-park beat + `oneSide` backdrop gate + `sizeClass` island hierarchy.
  **This was the single biggest fix — it turned a "hoarder field" into composed archipelagos with open water.**
- **Legacy migration done:** old generic ruins (tower/column/archruin/slab/dome) retired from biome 0 via the
  `lagoonOld` constant (env.js:437-438). New props go on `lagoonNew` (`[0]`).
- **Value pass:** the tide-ladder bake (`bakeTideLadder`, ~env.js:312) gained a vertical value gradient
  (bright sunlit crown → dark wet base); `bakeLilyFoliage` (~env.js:334) keys foliage off face normal.
- **Capture tools** (all headless, `reforged-captures/`): `tools/_lagoon.mjs` (distance sweep, health-pinned so
  a clip can't game-over the frame), `tools/_lagoonclose.mjs` (UP-CLOSE in the real biome via the
  **cameraCtl.update seam** — NOT a renderer.render override, which renders black; see the lesson),
  `tools/_lagooncomp.mjs` (natural real-time flythrough, the dragon flying by — the view that ultimately
  matters). Run capture sweeps SEQUENTIALLY (4 parallel Chromium boots time out on the weak runner).

## 4. What is being REPLACED
The 5 lagoon archetype **build() geometries** (rotunda/lilyraft/wrackstone/rootbastion/arcade, env.js ~1077-1360)
and their identities. Keep the SPAWN SCAFFOLD pattern (each archetype's `step`/`comp`/`arrivalPark`/`oneSide`/
`sizeClass`/`place`/FOAM_CFG), just point it at the new forms. `biomes.js` BIOMES[0].props is a vestigial doc
mirror — update it. Coexist → prove a hero → migrate; never break the shipped roster mid-flight.

## 5. Technical constraints (hard)
- 100% procedural, vanilla Three.js r160, no assets, 60fps on weak mobile.
- **≤150 triangles per archetype** (enforced by `tools/envcount.mjs`; grandfathering is legacy-only — a new prop
  over 150 is a bug). ConeGeometry costs 3×segments tris. Price every primitive.
- Props place off-lane both sides with an **anisotropic (r,h,r)** instance scale + random Y rotation. **A
  feature's UNIT aspect is NOT its world aspect** — design proportion-critical openings at world aspect and
  divide back (see the world-aspect lesson). Must read from any yaw. Stand PLUMB (`tilt:0`) if tide-laddered
  (the jade waterline is a level water stain — an instance tilt makes it physically impossible).
- **Coloring = per-face VERTEX-COLOR bakes on merged flat-shaded geometry** (no textures). 2 material slots per
  prop: `matIndex 0` stone (takes the bakes) + `mat 1` **gilt** (warm emissive gold — withheld interior glow
  only, sparingly). The composite per-part bake TAG system holds two bakes in one draw group (`bake:'lily'|'root'`
  merge-then-bake). You may add bake stops/hues but stay inside this system.
- **Determinism (RNG-order discipline):** placement consumes a shared `rnd` stream per-archetype in key order —
  **append new archetypes at the END** of `ARCHETYPES`; a mid-table insert shifts every later archetype and
  breaks `tests/gold-determinism.mjs`. The composition park/scale is PURE (no rnd) and applied AFTER the rotY
  init, so it's determinism-safe. Run `tests/gold-determinism.mjs` (5 checks), `tests/biomecycle.mjs` (11),
  `tools/envcount.mjs`, `tools/propclearance.mjs` after changes.
- `?hero=<a,b,c>` debug seam pins a comma-list of archetypes in biome 0 (default-off, determinism-unsafe) for
  isolating a prop or a hero+mid+commons trio in the capture tools.

## 6. The gate process (how "done" is decided)
- **Fable (art director) at a hard 4.2/5 floor.** Spawn via the Agent tool with `model: "fable"`. Pre-assess
  each prop BEFORE building (silhouette + firewall check), then checkpoint HARSHLY after each build round; a
  prop ships only at ≥4.2. Give Fable the up-close AND the natural-flythrough frames (the shipping view).
- **Silhouette firewall:** scenery must never rhyme with a HAZARD skin. The Lagoon hazard is the Sinking Gates
  (arches/pillars rising+sinking) — no free-standing lone arch or clean vertical pillar in the scenery.
- **Three judges:** machine numbers (envcount/determinism/clearance) · harsh Fable ≥4.2 · owner feel on the PR
  preview (motion/legibility). The owner's "does it read as the concept" is the final gate — that is what failed
  last time.

---

## 7. FABLE'S SYNTHESIZED PLAN (creative direction + roster + build order)

> Synthesized by Fable (art director), 2026-07-16, with live reference research. This supersedes
> `LOST-LAGOON-BIBLE.md` §4 (prop roster) and amends §3 (palette); the bible's theology/composition/hazard/
> atmosphere survive. Extend it with your own research — it's the floor, not the ceiling.

### 7.0 Why v2 failed → the law it mints
Five masonry variations on one abstract theme collapse into "gray-green lumps" at gameplay distance because
nothing was a NAMEABLE THING. **THE NAME TEST (the kit's governing law): a passing player must name each prop
in one word — mountain / temple / tree / flower / serpent.** Every archetype below is built from the most
instantly-nameable silhouette its reference offers. The engine substrate (bakes, 2-material contract,
`mergeLagoonParts`, `lagoonComp`, PR-1 atmosphere) is retained wholesale — we replace the vocabulary, not the grammar.

### 7.1 Research moodboard — six defining motifs
- **M1 Undercut karst tower (Ha Long Bay / El Nido):** isolated limestone towers with a wave-cut **marine notch**
  at the tide line → a **top-heavy, mushroom profile WIDER above than at the waterline foot**, green scrub crown.
  The notch hands us a dark core + a jade waterline event *for free.*
- **M2 Lotus-bud temple tower (Angkor Wat prasat):** **redented, ogival** stepped tiers tapering to a lotus-bud
  point — the planet's most recognizable "lost temple," made of stacked shrinking boxes + frusta.
- **M3 The Bayon face (colossus solved for random yaw):** four serene closed-eyed faces, **one per cardinal
  direction** → reads from every yaw (the Khmer already solved our random-rotation constraint).
- **M4 Strangler fig on the gate (Ta Prohm):** roots "coil more like reptiles than plants," gripping/splitting
  masonry — the most photographed lost-jungle-temple image; our composite dark-root/pale-stone bake was built for it.
- **M5 Naga balustrade:** a stone serpent-body run terminating in a **fanned 7-head cobra hood** — a horizontal
  counter-form owned by no other biome; a water-serpent god belongs half-drowned.
- **M6 Jade water, mangrove arcs, long golden hour:** El Nido pale-jade→emerald water; red-mangrove trunks
  **suspended above the water on arcing stilt-root tripods**; Ghost-of-Tsushima's held-long, region-graded golden
  hour with wind always moving something.

### 7.2 Palette + material identity (mapped to the bake system) — the cycle's only WARM-AND-GREEN biome
Honey stone + THREE living greens + jade tidewater + gilt sunset. Move stone OFF the old cold bone-bleach (that's
Glacier/Hollowgate turf) toward **honey**. Two stone families via the existing per-part bake TAG (add `bake:'temple'`
— one material, one draw call, two geologies):

| Ladder stop | KARST limestone (default) | TEMPLE sandstone (`bake:'temple'`) |
|---|---|---|
| Crown (above tide, ×1.10 gradient) | honey `0xE8C98F` | amber `0xD9AE7C` |
| Tide band | jade algae `0x35896A` (keep) | moss verdigris `0x4E9468` |
| Drowned | slate-teal `0x163A40` (keep) | laterite `0x3A3226` |

Greens: amend `bakeLilyFoliage` to **3 stops** — sunlit olive-gold `0x9FAE4A` / **new mid fern `0x55803E`** / shadow
jungle `0x27452C`; lotus pads keep a cooler `0x4E8A5A`. Water shallow → jade-turquoise `0x2F8578` (green-biased
always; deepen the jade never the gold). Gilt UNCHANGED (`0xFFD28A`/emissive `0xFFB040`, aperture-reveal only, ≤3
of 6 props). Re-run `bulletcontrast.mjs` on every palette move; danger stays magenta.

### 7.3 The roster — six nameable silhouettes
Global contracts: ≤150 tris; ≤2 material groups via `mergeLagoonParts`; parts interpenetrate ≥25%; `tilt:0` on every
laddered mass (PLUMB-TIDE); pairwise-coprime prime `step`s; FOAM_CFG row each; inner clearance ≥14.5; **every
proportion-critical feature designed at WORLD aspect under `(r,h,r)` and divided back**; yaw-robustness argued per
prop. Nature:civilization ≈ 3.5:2.5 (deliberately nature-forward).

1. **`karstfang` — MID mass (nature) — BUILD FIRST.** A Ha Long fenglin tower: top-heavy honey limestone, wave-cut
   notch at the waterline, broken twin summit under a jungle cap. Three-signal silhouette (wider-above-notch / dark
   undercut / green crown) = "tropical sea-rock" at 300 m; lathed profile is yaw-invariant. `step 41`,
   `arrivalPark`, `sizeClass` (1.4× breaks the horizon inside congregations), `comp:{floor:0.12,sMin:0.88,sMax:1.18}`.
   No gilt. ~110 tris (6-seg stacked-frusta lathe, 5 stations, edge loop AT band height, 2 offset summit frusta,
   2 wind-flagged canopy pads). This prop dominates instance count — **if karst doesn't land, the identity is wrong,
   stop the train.**
2. **`prasat` — HERO (civilization).** Drowned temple-mountain summit: two redented stepped tiers → ogival lotus-bud
   tower carrying **four Bayon faces (one per side → yaw-proof)** + one gilt doorway. `step 167`, `arrivalPark`,
   `comp:{floor:0,sMin:1.0,sMax:1.16}`, r~16–26, h~26–40 → **breaks the horizon** (the mandated landmark). ~150 tris
   (redenting = 2 interpenetrating offset boxes/tier; 3 shrinking frusta + bud; faces = 4 shallow eroded-plane masks
   recessed, value-carved not material; gilt door reveal). **Gated hardest** — face fallbacks pre-named (eyes-closed
   shallower relief → blind gilt-niche door). World-aspect the faces (1:1.2 tall) and doorway.
3. **`figgate` — FEATURE MID (nature ∩ civ).** The Ta Prohm money-shot: a thick-walled temple gateway chunk,
   doorway open to sky, a strangler fig seated on the lintel with dark roots cascading down both jambs to the water,
   parasol canopy above. Firewall vs the Sinking-Gates hazard: THICK/rectangular/canopy-crowned/root-draped/off-lane
   (the hazard is a bare free-standing arch). `step 61`, `arrivalPark`, `comp:{floor:0.08,sMin:0.9,sMax:1.1}`. Gilt =
   recessed doorway-soffit reveal (sky burns through at the right yaw = free god-ray). ~140 tris; roots obey the GRIP
   law; gate needs a top-cap course.
4. **`mangrovehold` — LOW COMMONS #1 (nature).** A red-mangrove islet: trunk **suspended above the water on a
   crinoline of arcing stilt roots**, broad sheared canopy. The airgap (a tree on legs over its reflection) says
   "tropical lagoon" and nothing else; it's the scale cue. `step 29`, `sizeClass`, `comp:{floor:0.15,sMin:0.8,
   sMax:1.05}`, h~4–7 (never crowds the horizon). Tide ring dashes across the thin legs = a jade anklet. ~120 tris.
   **Spider-kill:** legs arc DOWN-AND-OUT, taper, flare at the foot; canopy mass must outweigh leg mass; world-radius
   floor on legs for the chase cam.
5. **`lotusraft` — LOW REST #2 (nature) — evolve the ONE v2 survivor.** Keep shipped `lilyraft` (4.3/5) + add 3–5
   standing lotus buds/blooms (warm blush `0xF2C7A6` via `bake:'bloom'`, air/water rhyme, NOT magenta-adjacent) and
   seed-pod spears — the vertical accent + second hue it lacked. `step 19`, low `comp.floor`, pad-clip fix rides
   along. ≤75 tris.
6. **`nagawall` — BACKDROP (civilization).** A colossal half-drowned naga: serpent body as a rhythmic run of 5–7
   masonry coil-humps ending in a **fanned 7-head cobra hood** against the sunset, the far end a broken stump.
   Round humps + Khmer fan = "giant serpent" in one read; the kit's only long horizontal. Firewall vs the drowned-
   footbridge hazard: no deck/piers/straight spans; round humps only; far-x. `step 101`, `oneSide`, `comp:{floor:0}`,
   `|x|≥60`, low h~10–16 (underlines, never walls; central third stays clear). No gilt (hood eye-sockets a withheld
   Stage-2 option only). ~130 tris. Fallback if it reads "sea monster": straight rail-on-coils causeway + one hood.

Roles: HERO `prasat` · MID `karstfang`+`figgate` · COMMONS `mangrovehold`+`lotusraft` · BACKDROP `nagawall`.
Steps 167/41/61/29/19/101 (pairwise coprime). **Append all six at the END of `ARCHETYPES`** (RNG-order law).

### 7.4 Build order (coexist → prove a hero → migrate) + gates
Register the six as a `lagoonV3` list beside the current kit (a `?props=v3`-style seam); v2 stays default until the
migration PR. **The two never-again checks from the hoarder-house lesson: the `bi===0` comp branch must consume the
new archetypes' knobs, and every v2 archetype must route through the parked (`lagoonOld`-style) list — verify in the
WIDE gameplay follow-cam, not the studio.**
- **PR-0 Palette substrate:** `bake:'temple'` + 3-stop foliage + `bake:'bloom'` + water/crown nudges; A/B capture; `bulletcontrast` green.
- **PR-1 `karstfang`** (identity prover — if it fails, the identity is wrong). **PR-2 `prasat`** (hero). **PR-3 `figgate`+`mangrovehold`**. **PR-4 `lotusraft` evolve + `nagawall`**. **PR-5 MIGRATION** (flip default to v3, park v2, re-tune `lagoonComp`, montage, owner sign-off).
- Every PR: full headless suite, `gold-determinism` byte-identical (props are render-only — keep it so), `bulletcontrast`, `envcount`, propclearance + NaN `place()` scan, biome-pinned preview + what-to-look-at list, **one ledger lesson file**.

**Per-prop gate (Fable ≥4.2, judged on in-context captures at the real `(r,h,r)`):**
1. **THE NAME TEST** — one word at cruise distance; miss = auto-fail regardless of craft.
2. **VALUE STRUCTURE** — ≥3 organized zones (sunlit crown / dark core-or-notch / jade waterline) + the mirror double; numeric luminance-Δ target set at pre-assess.
3. **DISTINCTNESS** — silhouette-diff vs the five in-set, vs Glacier/Caldera/Aurora, vs all hazard skins + the Sinking Gates (mandatory for `figgate` & `nagawall`).
4. **YAW ROBUSTNESS** — 4 yaws incl. worst case; no yaw collapses the name test.
5. **MACHINE** — ≤150 tris, ≤2 groups, world-aspect numbers recorded, `tilt:0` where laddered.
One revise round per prop; a third attempt means change technique, not parameters. **The owner outranks every gate.**

### 7.5 Cheap-tell kill-list (checklist before any critic spawn)
1. Karst = traffic cone → the marine notch is mandatory + top-heavy (shoulder r > foot r), dark undercut, broken twin summit.
2. Karst = ice horn → green crown + honey ladder + undercut; no facet sparkle; no ice hexes in lagoon code.
3. Canopy = broccoli/table → parasol law: 2–3 offset elliptical sheared pads, Δh≥0.10, one draped into stone, ~10% apex rise, wind-flagged.
4. Mangrove = spider → legs arc down-and-out, taper, flare at foot, uneven azimuths; crown mass > leg mass; world-radius floor on legs.
5. Temple = wedding cake / stairs-to-nowhere → tiers REDENTED + one collapsed quadrant; ogival crown not a box stack; a doorway gives it a "why."
6. Faces = toys → eroded flat planes, eyes closed, serene, 4-way symmetric, no material change; fallbacks pre-named.
7. Naga = sea monster/coaster → humps are masonry (identical-family radii, strict rhythm, laddered, plumb); hood is a geometric fan, no eyes by default.
8. Scenery rhymes with a hazard → silhouette firewall: no free-standing bare arch anywhere; silhouette-diff vs all hazard skins at pre-assess.
9. Gray lumps (the original sin) → no prop ships below 3 value zones; no stone face achromatic; saturation floor asserted on capture cross-sections.
10. Gilt drift → LED/lamp → gilt only inside recessed aperture reveals, ≤3 props, never a band/tide-line/outer face.
11. Unit-space lie → every hole/notch/face/opening designed at WORLD aspect under `(r,h,r)`, numbers in the build sheet, judged in-context.
12. Palette drift → deepen the jade never the gold; never blue water; never bone-white crowns; never night-biolume greens.

**Definition of done for the whole redesign:** a blind gameplay-distance capture where a stranger says *"flooded
jungle temple ruins in Asia somewhere — beautiful,"* with ≥1 nameable NATURE form + ≥1 nameable CIVILIZATION form in
frame, ≥45% open gold mirror, and no lump anywhere.

_Key sources: Speleogenesis & UNESCO (Ha Long karst/marine-notch), Facts&Details / Paths Unwritten / Wikipedia
(Angkor Wat prasat), Smarthistory / Wikipedia (Bayon faces), Wikipedia / Atlas Obscura (Ta Prohm figs), NCpedia /
Smithsonian NMAA (naga balustrade), Smithsonian Ocean / USGS (mangrove stilt roots), journeyera / swallowsnotes
(El Nido jade water), PlayStation Blog / Sucker Punch SIGGRAPH 2021 (Ghost of Tsushima golden-hour grading)._

---

## 8. Capture & verification harness — the two-stage gate

The game renders **headlessly**. `tests/browser.mjs` exports `boot({query, viewport, deviceScaleFactor, initScript})`
— it launches the game in headless Chromium and returns a Playwright `page` you screenshot. Every `tools/*.mjs`
capture script uses it. Chromium is pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — **never run
`playwright install`**. Bash cwd resets to the repo root between calls, so every command must start
`cd /home/user/dragon-drift/reforged`. Boot with `?biome=0&debug` to expose the `window.__dd` debug object —
everything below hangs off it.

### 8.1 The process law: STUDIO first, then IN-GAME — in that order, always
**Stage 1 — STUDIO (form gate).** Build the prop and render it in an isolated fit-to-bbox studio: neutral framing,
multiple yaws, no water/atmosphere, seconds per iteration. Harnesses exist — `tools/propstudio.mjs` /
`tools/propstudio.html` (generic) and `tools/lagoonstudio.mjs` (lagoon-specific); copy the pattern, don't rewrite it.
Get Fable to **≥4.2/5 on FORM here first**: silhouette, THE NAME TEST, value structure, yaw-robustness — i.e. gates
1 / 2(partial) / 4 of §7.4. Never burn expensive in-context renders on a broken silhouette. **Hard caveat:** the
studio shows unit proportions, not the real `(r,h,r)` world anisotropy, and not the golden-hour palette — a studio
pass is *necessary, not sufficient*.

**Stage 2 — IN-GAME (the real gate).** Only after Stage 1 passes, render the prop in the real biome: water, fog,
reflection, golden light, real `(r,h,r)` instance scale, the mirror double, cruise distance, and the natural dragon
flythrough. Get Fable to **≥4.2/5 AGAIN in-context** — this covers §7.4's palette, mirror/value-in-light,
distinctness-at-cruise, and world-aspect machine numbers. This is the frame the owner judges. **A prop is done only
when BOTH stages pass.** One revise round per stage per §7.4; a third attempt means change technique.

### 8.2 Screenshot-at-a-position mechanics (all via `window.__dd` under `?debug`)
- **Jump, don't fly:** `dd.player.dist = <meters>` teleports the camera to the spawn distance. Props sit off-lane at
  deterministic distances — sweep `dist` to find one, or boot `?hero=<archetype>` to pin ONLY that archetype in biome
  0 (`?hero=a,b,c` stages a hero+mid+commons scale trio). Read a real active instance out of the InstancedMesh
  matrices to aim at it.
- **Hold still:** `dd.game.timeScale = 0` — but it auto-ramps back to 1, so re-set it, or set `dd.player.speed = 0`
  to stop forward motion.
- **Disable deaths** — a teleport can drop the dragon into a gate/hazard and a game-over overlay ("CLIPPED THE
  CRYSTAL WINDOW") ruins the frame. Pin every frame in the page:
  ```js
  setInterval(() => { dd.game.health = 100; dd.clearVents(); }, 24);
  ```
  plus `dd.noBoss(true)` so no boss clears the scenery. Side effect: with the pin interval live, the script's
  `done()`/teardown may hang — the frames are already on disk, just read them.
- **THE CAMERA SEAM (the one non-obvious trap — cost a full debugging session):** to frame a prop from an arbitrary
  pose in the real biome, override **`dd.cameraCtl.update`** (runs at the TOP of each frame), **not**
  `dd.renderer.render`. The sky dome follows the camera, and the god-ray sun projection + water reflection are
  computed from the camera position BEFORE the frame draws — a `renderer.render` override moves the camera too late
  and the frame renders BLACK. Working implementation: `tools/_lagoonclose.mjs`; lesson:
  `leapfrog/lessons/2026-07-16-graphics-in-context-closeup-camera-seam.md`.

### 8.3 Existing tools — copy, don't rewrite
| Tool | What it gives you |
|---|---|
| `tools/propstudio.mjs` / `.html` | Stage-1 generic fit-to-bbox studio, multi-yaw |
| `tools/lagoonstudio.mjs` | Stage-1 lagoon-specific studio |
| `tools/_lagoon.mjs` | Stage-2 distance sweep, health-pinned |
| `tools/_lagoonclose.mjs` | Stage-2 up-close arbitrary pose via the cameraCtl seam |
| `tools/_lagooncomp.mjs` | Stage-2 natural real-time flythrough (the owner's frame) |

**Run capture sweeps SEQUENTIALLY** — 4 parallel headless Chromium boots time out the screenshot on the weak runner.

---

## 9. Suggested first moves for the new session
1. Read §0 docs + skim the failed props' `build()` to learn the primitive/bake vocabulary.
2. Confirm/extend Fable's plan (§7) with your own reference research; lock the palette + roster.
3. Build the vertical NATURAL landmark first (the karst spire, per plan) — it's the highest-leverage change and
   proves the horizon-breaking silhouette + the new palette. Fable-gate it.
4. Then the drowned-temple HERO, then mid/commons/backdrop — coexisting with the current roster, migrating each
   in as it passes 4.2, so the biome never breaks.
5. Add a lesson file per meaningful change (THE RULE). Keep determinism/envcount green every commit.
