# THE DROWNED FORUM — BUILD SHEET (Biome 0 revamp)

> **Hand this to a fresh chat.** It is self-contained: the vision, the palette, the 13-prop roster, the
> build order, the engine laws, the exact headless-capture recipes, the Fable-gate process, and the closing
> audit. Build straight from it. The repo clones fresh in a new session, so everything you need is committed.

**North star (the ONLY score that matters):** *"absolutely beautiful and jaw-dropping when a player flies
through."* AAA-premium or don't ship it. The owner outranks every gate — the whole thing has to make **them**
gasp on the live PR preview. If a prop isn't premium, it doesn't land.

**One-line soul:** *"The light still keeps its appointments"* — a dragon flying a straight gold sun-lane down
a drowned Roman axis, through ranks of arches that repeat and decay into warm fog. The jungle biome's story
was *reclamation* (garden over stone); this one is **order outlasting its makers** — Roman axial geometry the
low sun still walks, gold on the water, nothing answering.

---

## 0. READ FIRST (before any code)

1. `LEAPFROG.md` + skim `leapfrog/lessons/` (newest first) — the accumulated state of the art. **After every
   meaningful change add a NEW lesson file** `leapfrog/lessons/<YYYY-MM-DD>-graphics-forum-<slug>.md` (one file
   per lesson — never append to the ledger; that's how parallel chats avoid collisions).
2. `reforged/BIOME-DESIGN.md` (biome identity system) and `reforged/GRAPHICS-OVERHAUL.md` (the Fable
   Quality-Gate protocol + value-structure law).
3. **The Lost Lagoon v3 lessons are your direct ancestors — read them, they save you rounds:**
   - `leapfrog/lessons/2026-07-17-graphics-lagoon-v3-pr7-causeway-lane-framing.md` — the lane-framing coverage
     law, the tri-band-on-a-box "diagonal tarp" trap, the moss-gem trap, side-based rotY, the in-context laws.
   - `leapfrog/lessons/2026-07-17-graphics-lagoon-v3-pr8-rampart-far-massif.md` — the **"wall toolkit"**: the
     `(r,h,r)` flatten law, the ship-hull/serving-tray tells, the `void`/`reveal` dark-bay bakes + the
     single-sided-plane `FrontSide` winding gotcha, jungle-drape vs party-hats. **These techniques transfer
     directly to Roman walls, arches, and aqueducts.**
4. `reforged/js/environment.js` (all prop geometry + the bake system + `ARCHETYPES`), `reforged/js/biomes.js`
   (`BIOMES[0]` = this biome), `reforged/js/config.js` (lane geometry).

**Working directory:** everything runs from `/home/user/dragon-drift/reforged`. **Bash cwd resets to the repo
root every call** — prefix every command with `cd /home/user/dragon-drift/reforged && …`.

---

## 1. THE HEADLINE SHIFT

- **Total green purge.** Jade water and jungle green are GONE. New identity color = **fired-clay terracotta +
  Pompeian red** (the hue no generic sunset or ocean owns). Green survives ONLY as near-black cypress/pine
  silhouettes and verdigris on bronze statues.
- **Palette:** travertine ivory → apricot → ochre stucco → terracotta roofs, over **wine-dark deep water +
  Baiae glass-turquoise shallows**, under a Mediterranean dusk sky, all bound by warm gold-umber fog.
- **The waterline three-band** (proven position-keyed tide ladder, re-stopped) on every vertical: sun-bleached
  travertine top / narrow hard-edged algae-stain tide line / drowned cool slate-teal base.
- **The bradyseism law (NEW, universal):** nothing crosses the water level with a FLAT cut — every structure
  TILTS / SUBSIDES so the waterline crosses it at an angle. Sells "the sea crept in" on every prop for free. A
  level waterline on a prop is a bug.
- **Ruin logic (Baiae-real):** columns snap into **DRUMS** (a fallen column = a row of separated cylinders,
  some part-stacked, some rolled half-buried — never one snapped stick); walls keep **COURSES** (jagged
  stepped stacks); pediments lose a **CORNER** (asymmetric); arches survive as **PARTIAL RINGS** placed so the
  calm-water reflection completes the half-circle into a full circle.
- **Compose Lorrain:** side-framing colonnade + pine/cypress silhouettes → open gold sun-path center → city
  dissolving into gold-umber fog. Awe = scale gap (tiny dragon vs monumental arch) + silence/negative space
  (≥45% of visible water stays unbroken mirror) + domestic-order-underwater (mosaic floors read through glass
  water — the gut-punch).

---

## 2. FINAL PALETTE SPEC (hex → the bake each feeds)

**A · `bakeTideLadder` re-stop — the three-band, on every vertical masonry archetype (position-keyed):**

| Band | Hex | Note |
|---|---|---|
| BLEACHED crown | `0xEADFC8` → sun-face `0xF2C9A0` | travertine ivory; never whiter (HOLLOWGATE stays palest) |
| TIDE band (narrow, hard-edged) | `0x434F3A` | browner algae-crust (NOT leafy green) |
| DROWNED base | `0x14333B` | wet slate-teal — the cool anchor |

**B · Vertex-paint zones (primary `forumStone` material, vertexColors, warm emissive fill ~`0xD8CFAE` @0.3):**

| Use | Hex |
|---|---|
| Ochre stucco / tufa wall bodies | `0xD9A55F` |
| Terracotta pantile roofs (identity color) | `0xC4623A` |
| Pompeian-red fresco — PROTECTED recesses ONLY | `0x9E2B25` (weathered edge `0xA6473A`) |
| Mosaic read-through decal: field / pattern | `0x6E958B` / `0x3E5F58` (cyan-cast, low-contrast) |
| Stone-pine / cypress silhouettes | `0x2A3524` |

**C · Accents:** GILT `0xFFD28A` (emissive `0xFFB040` @~0.65) — recessed reveals ONLY (arch coffers,
tympanum, pharos fire-window, colossus crevices); ≤4 of 13 archetypes carry any glow. NEW material pair
`verdigrisBronze` (diffuse `0x3E8F7A` over dark `0x6E5233` recesses + gilt) — `colossus` + `nymphaeum` statues
ONLY (the one saturated green that survives the purge, on bronze alone).

**D · World (`biomes.js` BIOMES[0]):** deep water wine-dark `0x0D2B36` / shallow Baiae glass-turquoise
`0x54A090` (sunset-warmed); calm waveAmp (a bay, not a sea — the mirror is the composition's spine); sky sun
`0xFFD891`, horizon apricot `0xFFB877` → rose `0xE8907A` → zenith violet-slate `0x3A3F66`; fog gold-umber
`0xE8B27E` pushed hard into distance; ambient motes → gold dust `0xF2D9A8`; `stars: 0`.

**Anti-"orange-soup" law:** the warmth reads rich ONLY because of three cool anchors — slate-teal bases,
wine-dark deep water, violet-slate zenith. If a capture reads orange-soup, deepen those three — NEVER
desaturate the clay reds. **Re-run `bulletcontrast` after every palette change** (danger magenta `0xff2b6a`
must stay hue-safe against the new sky/fog).

---

## 3. THE PROP ROSTER — 13 archetypes

Every one: **≤150 tris**, ≤2 material groups, a `FOAM_CFG` entry, **appended at the END of `ARCHETYPES`**
(determinism), tide-ladder bake unless noted, the **bradyseism tilt** on everything that stands. Steps below
are suggested coprime primes — tune at placement.

### WAVE A — CORE 8 (ships the biome)

| # | Archetype | Role / placement | Origin | The ONE Roman silhouette tell | Key proportions | Bakes / accent |
|---|---|---|---|---|---|---|
| 1 | **`triumphgate`** — Triumphal Arch | **HERO / identity-prover.** Rare scatter off-lane in shallows + reskins the Sinking-Gates hazard. step 149 | NEW | Chunky block **wider than tall (~1.14:1)**, semicircular hole low-center, **solid attic cap-block** on top; a **coffered TUNNEL visible through it** (not a flat cut) | attic = 0.28–0.30 of H w/ inscription band ⅓ its height; pier width ≈ 0.75× span; springing at 50% H; raised keystone bump; engaged columns on pedestals; one shoulder broken | tide ladder; gilt in soffit coffers; Pompeian red in one pier niche |
| 2 | **`viamarina`** — colonnaded street-front | **NEAR-RAIL** (replaces `causeway`; fixes the "weird stone things"). High comp.floor, hugs lane edge, **rotY pinned near-lane-parallel** | NEW | **TWO parallel vertical rhythms with a shadow gap** — columns on a continuous 2–3-step stylobate + a set-back tabernae wall | columns ~2.25–2.5D metronome, some full carrying architrave fragments, some snapped to drums; tabernae openings W:H ~2:3 with heavy lintel + raised threshold; broken pantile cap; statue-bracket nubs on 1–2 shafts | tide ladder; ochre body; Pompeian-red fresco panels only in roof-sheltered bays; NO gilt |
| 3 | **`aqueduct`** — marching arches | **FAR-MASSIF** (replaces `rampart`). Horizon band, `foam:false`, yaw pinned ±20° of lane axis (diagonal = perspective, but NEVER crosses the lane). step 97 | evolve `arcade` slot, geometry NEW | **A wall of round holes on thin legs; two tiers, the top tier visibly SMALLER + MORE arches** (the single most Roman cue) | whole ≈5.6:1 long; pier ¼–⅓ of span; rise = half span; upper piers align over lower; far end decays to pier stumps (drowning told left→right) | tide ladder; ZERO glow (its light is sky through the bays) |
| 4 | **`pantheon`** — drowned dome | Mid-hero, alternating flanks. step 59 | **evolve v2 `rotunda`** (proven 4.5/5 — RETINT, don't rebuild) | pierced dome + oculus; ADD a broken hexastyle **portico stub with a snapped pediment** at its foot | pediment rake ~20°, H:W ≈ 1:8, one corner lost; a fallen column across the steps in drums | re-stop ladder (jade OUT); gilt oculus reveal; red inside the drum apse |
| 5 | **`forumfield`** — drowned grid | Mid scatter in shallows (the domestic-order gut-punch). step 37 | NEW | column stumps + plinths at **civic GRID spacing** (grid = forum; random = dock pilings) + **mosaic decal read through the water** | 3–5 stumps, 1 flared-Corinthian cap; drums lying between; grid ~3D spacing | ladder on stumps; **mosaic = a flat FOAM-decal patch riding the water surface** (reuse the foam-mesh system), cyan-cast §2B hexes |
| 6 | **`drumfall`** — fallen columns | **LOW FOIL, common** (prices the gilt — no accent, no glow). step 23 | evolve v2 `wrackstone` slot | **columns broken into DRUMS**: a row of separated cylinders, part-stacked / rolled / half-buried; ONE flared capital proud | entasis on any standing stub (top ⅚ base dia) | ladder only; NO accent, NO glow |
| 7 | **`roofline`** — sunken villa | LOW hugger + **scale cue**. step 29 | NEW | **low ribbed terracotta gable just breaking the surface** + antefixae eave-bumps | pitch 15–22°; imbrex ribs downslope; one rafter gap; hip ring w/ atrium hole on big instances | terracotta zone; ladder at the tilted waterline cut |
| 8 | **`pinisle`** — stone-pine islet | Low framing punctuation (Lorrain side-frame). step 31 | NEW | the Italian postcard: **flat-topped umbrella pine + cypress flame-taper**, near-black against gold | 2–3 FLAT overlapping parasol pads (never broccoli spheres); rubble base | pine `0x2A3524` zone; NO glow |

### WAVE B — POPULATION 3

| # | Archetype | Role | Tell / proportions | Bakes |
|---|---|---|---|---|
| 9 | **`colossus`** — bronze fragment | Rare landmark, `\|x\|`≥40. step 167 | a lone colossal **head/hand/foot at 4–5× human scale, tilted, half-sunk** — OR a standing verdigris figure on an oversized plinth | `verdigrisBronze`: teal body, dark recesses, gold-brown raised edges, gilt crevices |
| 10 | **`portico`** — temple front | Mid-hero, alternating flanks. step 43 | **low wide triangle on a deep beam on 6 columns on a podium with FRONTAL steps only** (pseudoperipteral: solid box behind the porch) | hexastyle; cols ~10D; intercol 2.25–3D; entablature ¼ col H; pediment 1:8, corner lost; gilt tympanum |
| 11 | **`pharos`** — lighthouse | Rare tall counterweight (the toll address), `\|x\|`≥60. step 139 | square tapering **LEANING** tower, **open fire-chamber crown** | lean via segment offsets; base ≥50% of H; gilt inside the fire-window only (the one distant light) |

### WAVE C — CROWN 2

| # | Archetype | Role | Tell / proportions | Bakes |
|---|---|---|---|---|
| 12 | **`arena`** — amphitheater rim | SUPER-RARE landmark, `\|x\|`≥45. step 211 | **curved wall of stacked round arches in equal rows capped by a BLANK attic band**; a broken QUARTER-ARC, top corner sheared, tiers stepping down, **flooded gold arena inside**; ellipse 1.2:1 implied; ~4m spans on ~2.7m piers (don't model order changes — invisible at cruise) | ladder; no glow; bias a `colossus` spawn nearby (the money shot) |
| 13 | **`nymphaeum`** — apse of statues (stretch) | Rare mid. step 181 | Baiae's hero: **semicircular apse half-dome ringed with pale ghost-white standing figures** + central pool | Pompeian red inside the half-dome; statues on the bronze-pair material, bleached stops |

**Purged (park behind `?props=v3`, DELETE only after the audit + owner sign-off):** `karstfang`, `figgate`,
`mangrovehold`, `prasat`, `lotusraft`, `nagawall`, `causeway`, `rampart`. **Retired v2 (delete):** `lilyraft`,
`rootbastion`.

---

## 4. IDENTITY & COMPOSITION SYSTEM

- **HAZARD** = the **Sinking Triumphal Arches** (the shipped `gate` hazard reskinned — jamb/lintel colliders
  BYTE-IDENTICAL, fiction upgraded: gilt coffered soffit at rest, magenta-keystone toll telegraph, the arch
  descends). **VERB** = thread the processional. **ANCHOR** = HOLLOWGATE (kept; the horizon central third
  stays prop-free for it — the aqueduct's far band sits low and never claims the center).
- **The processional (the signature):** serial repetition in one-point perspective — arcade bays / colonnade
  intervals / aqueduct spans receding toward the sun, each rank more broken and more drowned (repetition-
  with-decay). The Lorrain frame every ~400m: `viamarina` one flank + `pinisle` punctuation → gold sun-path
  center → `aqueduct` into fog far. ≤1 hero per flank per 300m, alternating.
- **The two rails reconceived:** NEAR = `viamarina` (intimate, painted, human-scale street — **every
  attachment has a builder's job: stylobate, column+architrave, taberna doorframe, fresco panel, cornice;
  NOTHING else** — this closes the "weird stone things" complaint by LAW). FAR = `aqueduct` (monumental,
  skeletal, sky-punched). The city and the thing that fed it, walking into the sea together.

---

## 5. BUILD ORDER (one PR each; sign-off + gates between)

| PR | Content | Rationale |
|---|---|---|
| **PR-1 ✅ DONE** | **Atmosphere substrate:** water/fog/sky/mote/foliage constants (§2D), the tide-ladder re-stop (§2A), fresco/terracotta zone paints + `verdigrisBronze` into the material kit, mosaic-decal plumbing on the foam system. **Blind test: must read as a NEW biome vs current captures before any prop lands.** | Transforms 100% of pixels; proves the palette before geometry spends on it |
| **PR-2 ✅ DONE** | **HERO: `triumphgate`** (studio → in-context gate, Fable 4.3), then reskin the Sinking-Gates hazard with it (colliders identical, skin only — opus-quadratum rebuild, Fable 4.3) | Owner's archway ask closed; identity proven; hazard payoff same breath |
| **PR-3 ✅ DONE** | **`viamarina` + `drumfall`** (near-rail + foil) — both two-stage Fable-gated: viamarina Stage-1 4.3 / Stage-2 4.3; drumfall Stage-1 4.4 / Stage-2 4.3 | Owner's "weird stone things" closed; the lane frame is what the player sees most |
| **PR-4** | **`aqueduct` + `pinisle`** (far massif + Lorrain frame) | The processional composes end-to-end — **first full money-shot capture** |
| **PR-5** | **`pantheon` retint + `forumfield` + `roofline`** | Population; the mosaic read-through + domestic-order beats |
| **PR-6** | **`colossus` + `portico` + `pharos`** | Statues, temple, the distant light |
| **PR-7** | **`arena` (+ `nymphaeum` stretch)** — built LAST, most practiced hand | The crown; the amphitheater-hush money shot |
| **PR-8** | **The purge + closing audit (§10)** — flip whitelists, park v3, delete retired kit after sign-off, final montage | The audit is a PR, not a vibe |

Coexist → prove the hero → migrate. Add a **`forumV1` seam** in `environment.js` (mirror the existing
`lagoonV3` pattern: `const forumV1 = (PROPS_...) ? [0] : []`) so the new kit spawns behind `?props=forum` (or
becomes default when you flip it) while v3 stays alive until PR-8. **If any PR's preview verdict is "doesn't
feel right," STOP and fix before migrating** (THE RULE).

---

## 6. ENGINE CONSTRAINTS & LAWS (non-negotiable)

- **100% procedural** Three.js r160, no textures/assets, no build step, 60fps on weak mobile.
- **≤150 tris per archetype** (hard cap, `envcount` enforces). Cheap-tri notes: `BoxGeometry`=12, `ConeGeometry(_,_,n)`=3n, `CylinderGeometry(_,_,_,n[,,true open-ended])`≈2n, `IcosahedronGeometry(r,0)`=20, `PlaneGeometry`=2, `CircleGeometry(r,seg)`=seg, `frustumBetween(p0,p1,r0,r1,seg)`=2·seg.
- **Color = per-vertex vertex-color BAKES**, merged before the final geometry merge (colors survive it). The
  tag system: a part carries `{mat:0, bake:'temple'|'lily'|'wood'|'void'|'reveal'|…}`; `mergeLagoonParts`
  buckets by tag and bakes each subset. **For the Forum, add/rename bakes** to the palette (§2): a re-stopped
  tide ladder, an ochre/terracotta/fresco zone bake, the `void`/`reveal` dark-opening bakes (already exist —
  reuse for tabernae + arch coffers), a mosaic read-through bake, and the `verdigrisBronze` material.
- **Props are `InstancedMesh` bands** scaled per-instance `(r, h, r)` — XZ by `r`, Y by `h`. **The `(r,h,r)`
  FLATTEN LAW:** `h/r` is often ~0.5–0.7, so object-space vertical proportions are ~halved in world — an
  object pier must be **~2× as tall as you want it to read** (see the rampart lesson; this bit us for rounds).
- **Yaw:** a prop must read at ANY random yaw UNLESS `place()` pins `rotY`. For a lane-parallel wall/street,
  pin `rotY = (side>0?Math.PI:0)+jitter` (side-based) so the DECORATED face always turns to the lane — a
  random `0/π` flip shows the blank back half the time (a real bug we hit).
- **Lane:** fatal half-width **13**; obstacle "gate veil" **±16**. Props sit off-lane; couple `place()`'s `x`
  to the measured `ρ` (from `propclearance`) so the inner edge clears. `propclearance` uses symmetric `ρ`
  (can't know rotY is pinned) — a low near-rail may hug to ~14.5; a backdrop clears ≥26.
- **Composition rhythm:** `density = floor + (1-floor)*g` (g = congregation weight, 1 at a cluster peak → 0 in
  the empty "breaths"). **`floor` = the fraction of a prop's slots that survive the breaths** = continuous
  coverage. A near-rail wants a HIGH floor (~0.30) to hug the lane through the breaths; a far massif can be
  comp-less or high-floor for a continuous horizon.
- **DETERMINISM LAW:** `gold-determinism` must stay byte-identical. **Append new archetypes at the END of
  `ARCHETYPES`**, make render-only changes, and never reorder existing bands. The `rotY` init line
  `eul.set(0, d.rotY ?? (d.rotY = rnd()*Math.PI), d.tilt)` — returning `rotY` from `place()` skips that
  `rnd()`; that only affects your new prop's own stream, which is fine.
- **Single-sided-plane gotcha:** the stone material is `FrontSide`. A `PlaneGeometry` bay (2 tris, the cheap
  way to fit many dark openings) must face the object `+x` (build with `xform ry:+Math.PI/2`) so that AFTER
  the side-based rotY it faces the lane camera — the wrong sign culls it on both sides (invisible in game).
  **Verify single-sided geometry IN-CONTEXT, not just in the studio** (the studio can't show a face turned
  away).

---

## 7. QUALITY GATES (run every PR; all must pass green)

From `/home/user/dragon-drift/reforged`:

```
node tests/gold-determinism.mjs      # byte-identical RNG — the sacred gate; append-at-end keeps it green
node tests/biomecycle.mjs            # biome cycle order intact
node tools/envcount.mjs              # ≤150 tris/arch, instance caps, FOAM_CFG present, adjacent-pair window
node tools/propclearance.mjs         # every prop's inner edge clears the fatal lane (reports measured ρ)
node tools/tricount.mjs              # roster tri budget
node tests/bulletcontrast.mjs        # danger-magenta stays legible vs the new sky/fog (re-run after palette)
```

`envcount` also prints the measured **ρ (footprint radius)** and **world top (h·yMax)** per prop — use these
to tune the `place()` x-coupling. A commit that fails determinism or the tri cap is a bug, not a trade-off.

---

## 8. TOOLING — STUDIO SHEETS (the Stage-1 FORM gate)

The studio renders ONE archetype at its true `(r,h,r)` instance scale on a flat card — fast, reliable
(static scene, no game loop). Use it for the Stage-1 silhouette/name-test/yaw gate.

- **`tools/propstudio.html`** — the studio scene. Builds any archetype by key via `buildArchetypeMesh(key)`,
  so a new archetype appears automatically. It exposes (already added this session):
  - `psRender({key, opts, inst:[r,h], ry, angle, bg, rig, fill})` — `inst:[r,h]` renders at the real instance
    scale (essential for horizontal props — a unit render reads too tall); `ry` yaws the prop so a specific
    face (e.g. the lane-face with its bays) turns toward the camera.
  - `psReframe(...)`, `psSheetInit(cols,rows,cell)`, `psTile(i,label)` for the 2×3 contact sheet.
- **`tools/_kfstudio.mjs`** (`node tools/_kfstudio.mjs <round> <key>`) and **`tools/_cwstudio.mjs`**
  (`node tools/_cwstudio.mjs <round> <key> <r> <h> [ry]`) — drivers that build a 2×3 studio sheet at
  `reforged-captures/`. `_cwstudio` is tuned for horizontal/wall props (renders at `inst=[r,h]`, wall angles:
  gallery-face / full-length / worm's-eye / down-the-length / top-plan). **Copy `_cwstudio.mjs` to a
  `_forumstudio.mjs`** and adjust the tile angles/labels per prop family (arch, aqueduct, colonnade, statue).
- Studio captures are **fast** (~a few s). Read the PNG back with the image tool to judge, then send to Fable.

**Playwright is global:** the drivers resolve it via `execFileSync('npm',['root','-g'])+'/playwright'` (or
`PLAYWRIGHT_PATH`). Chromium is pre-installed (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — never run
`playwright install`.

---

## 9. TOOLING — IN-GAME CAPTURE (the Stage-2 in-context gate + composition)  ← READ CAREFULLY

You render the **actual game** headlessly to (a) see a prop in the real biome over the water, and (b) judge
**scene COMPOSITION** in flight. Two recipes. **Boot with the debug seam so `window.__dd` (the game object) is
exposed**, force the playing state, then **disable everything that isn't the scenery** so you photograph the
props, not a boss/hazard/tutorial:

```js
// boot: ?biome=0&debug exposes window.__dd. Add &props=forum for the new kit; &hero=<key> isolates one prop.
const { page, done } = await boot({ query: '?biome=0&debug&props=forum', viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1.3, initScript: SAVE });
await page.waitForFunction(() => window.__dd && window.__dd.game, { timeout: 15000 });
// force PLAYING (skip splash/tutorial): click start / press Enter until state==='playing'
for (let i=0;i<12;i++){ const s=await page.evaluate(()=>window.__dd?.game?.state); if(s==='playing')break; await page.click('#btn-start').catch(()=>{}); await page.keyboard.press('Enter').catch(()=>{}); await page.waitForTimeout(320); }
// KILL everything that isn't scenery — bosses, hazards, dangers, damage:
await page.evaluate(() => {
  const dd = window.__dd;
  dd.noBoss && dd.noBoss(true);           // no boss encounter
  dd.clearVents && dd.clearVents();        // clear hazard vents/emitters
  window.__pin = setInterval(() => {       // pin health so nothing can kill the run mid-capture
    dd.game.health = 100;
    dd.clearVents && dd.clearVents();
  }, 24);
});
```

**RECIPE A — one prop, in context (the Stage-2 gate).** Use `tools/_kfclose.mjs` as the template
(`HERO=<key> node tools/_kfclose.mjs <tag> [camDistMul]`). It boots `&hero=<key>` (the biome shows ONLY that
prop), overrides the camera via the `dd.cameraCtl.update` seam to a **low outer-side ¾ vantage** (so the warm
sky-fill lands on the face you see and the prop doubles in the mirror), finds the nearest instance by walking
`scene.traverse` for the `InstancedMesh`, sets `player.dist` to sit beside it, and screenshots.
**⚠ Full-game `page.screenshot()` is SLOW (~30–40s each) — budget for 2–3 frames per run (~100s), not six.**
Copy `_kfclose.mjs` → `_forumclose.mjs` and keep the seams; it works for any archetype via `HERO`.

**RECIPE B — the whole biome in flight (COMPOSITION — the owner's specific ask).** Don't isolate a prop; fly
the full kit and sample the composition at several points. Use `tools/_lagoonfly.mjs` as the template (a
follow-cam flythrough):
- **Do NOT override the camera** — use the game's own follow-cam so you judge the real player view.
- **Sweep `player.dist`** across a congregation-and-breath range and screenshot at each — this is the "a few
  different shots spread over a few seconds" the owner wants, so you read the composition accurately (the
  processional, the framing, the negative space) rather than one lucky frame:

```js
const dists = [340, 470, 610, 760, 900, 1050];       // across peaks + breaths of one biome window
for (let i=0;i<dists.length;i++){
  await page.evaluate((d)=>{ window.__dd.player.dist = d; }, dists[i]);
  await page.waitForTimeout(360);                     // let the scene settle
  writeFileSync(`reforged-captures/forumfly-${tag}-${String(i).padStart(2,'0')}.png`, await page.screenshot({ animations:'disabled', timeout: 15000 }));
}
```
- **Keep the viewport moderate** (≤ ~1280×820 @ DSR 1.3, or portrait ~1000×1560 @ DSR 1.0). **A huge canvas
  stalls the headless GPU read-back** — if `page.screenshot()` hangs ~30s on "fonts loaded," the canvas is too
  big; shrink it. Always pass `{ animations:'disabled', timeout: 15000 }`.
- Clean up: `await page.evaluate(()=>clearInterval(window.__pin)); await done();`

**Sanity checks if capture misbehaves:** studio (Recipe 0) working but game (A/B) hanging → it's the
continuous-render canvas size, shrink the viewport. `MODULE_NOT_FOUND` → you're in the repo root; `cd
reforged` first. No stray chromium needed — each run spawns + closes its own.

---

## 10. THE TWO-STAGE FABLE GATE (per prop) + the process

Fable is your art director. Spawn via the Agent tool with **`model: "fable"`** (subagent_type
`general-purpose`). Give it the prop's IDENTITY brief + the palette + the ONE Roman tell + the kill-list
(§11), attach the capture PNG by absolute path, and ask for **a score /5, the single biggest failure, and the
ONE highest-leverage fix**. Bar = **4.2**.

1. **Stage-1 (form):** studio sheet (§8) → Fable gates silhouette / name-test / yaw / value. Iterate. **The
   convergence protocol:** one revise round per Fable note; if a 3rd attempt is needed, CHANGE TECHNIQUE
   (don't keep tuning a dead topology — that's a technique ceiling, not a tuning miss). Studio warmth is
   flattered/cooled by the flat bg — weight form/silhouette/identity; tell Fable the real light comes at
   Stage-2.
2. **Stage-2 (in-context):** render in the real biome over the water (§9 Recipe A) → Fable gates it AGAIN
   ≥4.2. The studio can't predict the in-context read (a featureless face reads as a "plain slab"; the moss-
   gem trap; warmth resolves in the real key) — Stage-2 is a separate, mandatory gate.
3. **Composition gate:** after each framing PR, run Recipe B, montage the frames, and have Fable assess the
   whole scene (the processional, the Lorrain frame, negative space) ≥4.2.
4. **The owner gasp gate:** surface the money-shots on the live PR preview. The owner outranks every Fable
   score — if it doesn't make them go "wow," it isn't done.

---

## 11. CHEAP-TELL KILL-LIST (enforced from turn one — each is a gate-fail, cite on sight)

The five AAA elevators applied to every prop: (1) columns break into **DRUMS**, never sticks; (2) **everything
stands on a podium/stylobate**; (3) **entasis** on every shaft (top ⅚ base dia — kills the pipe look); (4) the
**bradyseism tilt** (waterline crosses every structure at an angle); (5) capital vocabulary — flat square
**abacus** = Doric utility (aqueduct/arena/viamarina), flared **bell frustum** = fake-Corinthian prestige
(temple/arch/forum); skip Ionic scrolls (they don't survive downsampling).

Forbidden:
1. **Croquet-hoop arches** — any arch whose structure above the curve is thinner than the curve. Pier ≥¾ span
   (arch) or ≥¼ span (aqueduct); attic/entablature mass always; a visible coffered tunnel, not a flat cut.
2. **Fence-post columns** — lone even-spaced bare cylinders. Columns come in rhythms, with entasis, with a
   capital or a break, with their fallen drums beside them.
3. **Caesars-Palace white** — intact all-white marble. Polychrome + broken always; nothing plumb, no unbroken
   course, every pediment loses a corner.
4. **Generic-blocks Rome** — a prop that reads without its capital/pediment/coffer/tile/attic tell fails the
   name test.
5. **Jade hangover** — any green outside pine silhouettes + verdigris bronze.
6. **Neon-sunset drift** — sky never cools past violet-slate, never trespasses toward danger magenta.
7. **LED / moss-gem / flat-tape** — no glowing strips/bands/outlines; no smooth convex gem-moss; gilt recessed
   only, small in area, ≤4 of 13 archetypes carry any. Dark openings use the `void`/`reveal` gradient bake
   (not flat #000 tape, not mid-brown).
8. **Scale betrayal** — hero openings flyable (dragon clearance + margin); `roofline` + gulls are the
   deliberate scale anchors that make a 40m arch feel 40m.
9. **Flat-cut waterlines** — a level waterline on a prop is a bug (bradyseism rule).
10. **Glacier déjà vu** — if a blind capture could be Sunset Glacier, add terracotta + repetition, never more
    gold.

---

## 12. THE CLOSING AUDIT (PR-8 — concrete, checkable, the owner's mandate)

**(a) LEAKAGE — provably no jungle survives in Biome 0:**
1. Whitelist assertion in `envcount` (or a new `tests/forumleak.mjs`): `BIOMES[0].props` contains ONLY the 13
   new keys; the 8 v3 keys + `lilyraft`/`rootbastion` appear in NO biome whitelist.
2. Mechanical grep — must return ZERO in Biome-0 constants/bakes outside the parked `?props=v3` branch:
   jungle hexes (old jade/petal/lily/moss values) and identifiers (`lotus`, `naga`, `prasat`, `fig`, `karst`,
   `mangrove`, `causeway`, `rampart`, `lily`, `moss`).
3. Runtime proof: a headless band-dump over 2 full Biome-0 windows lists every spawned archetype key — none
   from the purge list.
4. Blind screenshot test: 6 captures across the biome (Recipe B); if any could be captioned "jungle temple,"
   FAIL.
5. Delete the parked kit + `?props=v3` ONLY after owner sign-off on 1–4.

**(b) COHERENCE / NO-SLOP — kill anything arbitrary:**
1. **Builder's-job test, per prop AND per PART** — name the Roman job of every attached element
   (stylobate / column+architrave / doorframe / fresco / cornice / antefix / keystone / coffer …). No
   nameable job → delete the part.
2. **Name test** — each silhouette (studio, black-on-gold) is nameable by fresh eyes unprompted
   ("aqueduct," "amphitheater," "lighthouse").
3. **Yaw test** — every archetype at 8 random yaws reads (or its `place()` pins rotY, documented).
4. **One-city test** — montage all 13; shared grammar audible (drums, stylobates, round arches, the three-
   band waterline, the same clay reds). Any prop that looks imported from another game dies.
5. **The compound Fable gate** — full-cycle in-context montage ≥4.2 + the three money shots staged
   (Processional / Aqueduct Crossing / Amphitheater Hush).
6. **The owner gasp gate** — the only score that matters.

---

## 13. GIT & PR CONVENTIONS

- Develop on the designated branch; commit with a clear message. **Committer must be `Claude
  <noreply@anthropic.com>`** (`git config user.email noreply@anthropic.com && git config user.name Claude`) or
  GitHub marks it Unverified. End commit messages with the `Co-Authored-By:` + `Claude-Session:` footers the
  session provides. **Never put the model identifier in any pushed artifact** (commits, PR, comments, code).
- Push with `git push -u origin <branch>` (retry with backoff on network errors). After pushing, open/keep a
  **draft PR**; mirror any PR template.
- One `leapfrog/lessons/` file per PR (the `graphics-forum-` slug).

---

**Summary:** 13 archetypes (3 evolved, 10 new), one re-stopped proven tide-ladder engine + the bradyseism law,
one validated palette with fired-clay as the identity color and three cool anchors, the shipped gate-hazard
reskinned into the triumphal arch, the near-rail rebuilt as a colonnaded street where every stone has a job,
8 PRs from atmosphere to audit, and a two-part closing audit that makes "no jungle left" and "no slop"
provable. Build it AAA, gate every prop twice, and make the owner gasp — or don't ship it.
