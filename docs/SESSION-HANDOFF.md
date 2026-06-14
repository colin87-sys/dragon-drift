# Dragon Drift — Dragon Redesign Session Handoff

A handoff for the next chat. Covers **what was built, the problems hit, and how
each was solved** — especially the dragon model, so the same mistakes aren't
repeated. Everything below is **merged to `master`** (PRs #14–#26).

---

## 1. Project & current status

- **Dragon Drift** = a Three.js, browser/mobile, third‑person **endless flyer**.
  Camera is **behind + slightly above** the dragon (rear / top‑rear). The player
  almost always sees the dragon **from the rear during gameplay** — so the
  dragon must be designed for that exact camera, never a side/front/3‑4 view.
- Plain ES modules in `js/`, Three.js in `lib/`. No build step. Served statically.
- **Status: the full dragon roadmap is done & live.** All 7 dragons redesigned
  with unique silhouettes + a shared polish system, a new Phoenix, a reworked
  shop, and a batch of readability/UX fixes. Nothing pending.

### The 7 dragons (each a deliberately distinct rear silhouette)
| key | name | silhouette identity |
|---|---|---|
| `azure` | Azure Drake (R, free) | narrow, clean **blue** courier — smallest/simplest |
| `ember` | Ember Wyrm (SR) | broad, **jagged** flame edges, **lava‑red** cinder‑wyrm |
| `jade` | Jade Serpent (SR) | **smallest wings**, long sinuous **green** serpent body |
| `obsidian` | Obsidian Shade (SSR) | swept **plasma‑cyan** night‑fury, **twin tail fins** |
| `pearl` | Pearl Seraph (SSR) | broad **smooth white** seraph + **halo** |
| `solar` | Solar Sovereign (SSSR) | swept **ember→magenta** flame wyvern (the benchmark) |
| `phoenix` | Phoenix Ascendant (SSSR, new) | broad **upswept gold** fire‑bird, fire‑fan tail |

---

## 2. How to work in this repo

### Verify loop (do this every change)
1. `node --check js/<file>.js` — syntax.
2. **Pure‑node tests** (fast): `node tests/defs.mjs`, `tests/ascension.mjs`. `defs`
   asserts every dragon has exactly 4 forms (objects) — keep that true.
3. **Browser smoke** (Playwright, global install): `node tests/smoke.mjs` boots
   the game and flies — must be "no errors during flight". `tests/shop.mjs`
   exercises the shop (builds the preview model).
4. **Render QA** (this is how you judge visuals — NOT a model viewer):
   - `node tools/tiershots.mjs` → `/tmp/tier-<key>.png` — isolated T0→T3 montage
     at a FIXED per‑dragon distance + a hero wing pose. Best for **silhouette**
     comparison.
   - `node tools/gameshots.mjs <key>` → `/tmp/game-<key>-montage.png` — **real
     chase‑cam** gameplay, 2× cropped. The real arbiter.
   - `node tools/fullshot.mjs <key> <tier> [fever]` → full‑frame (judge how much
     of the path is visible / contrast / surge).
   - `node tools/surgeshot.mjs <key> <tier>` → `?debug=fever` forces Dragon Surge.
   - `node tools/shopshot.mjs [dev]` → shop screenshot.
   - **Always `Read` the PNG and judge from the rear gameplay camera**, then tune.
   - Renders take ~30s (tier) to ~4min (gameplay montage). Run gameplay montages
     `run_in_background: true`; **don't run two chromium renders concurrently** —
     they contend and time out. `serve.mjs` uses a random port (safe to overlap
     tests, but not heavy renders).

### Git workflow (important)
- Branch: **`claude/quirky-goldberg-8n8pik`** (dev branch — never push elsewhere).
- One logical change per PR. `git add` specific files, commit, then:
  `git fetch origin && git rebase origin/master` (PRs merge fast, so rebase to
  stay clean) → `git push --force-with-lease` → **create a draft PR**.
- The user merges PRs themselves, usually within minutes; rebase onto the merge.
- Commit msg footer: the session URL line (the harness appends it). **Never** put
  the model identifier in commits/PRs/code.

### Debug URLs
- `?debug` exposes `window.__dd` (the test hook — the QA harness needs it).
- `?debug=fever` forces Dragon Surge on. `?debug=perf` = fps overlay.
- **`?dev`** = unlock everything (see §8). Combine as `?debug&dev` for tests.

---

## 3. Architecture map

| file | role |
|---|---|
| `js/dragons.js` | **Data**: the `DRAGONS` table. Per dragon: `model` proportions (= APEX reference), `wingForms[0..3]` (own wing shapes), `forms[0..3]` (per‑tier accreting params + `colors` overrides), palette, `fx`. `DRAGON_STAT_CAP`. |
| `js/dragonParts.js` | **Geometry builders**: `buildArrowTorso` (body), `WING_FORMS`/`buildWingShape`/`archWing`/`archProfile`/`wingStrut` (wings), `buildCleanTail` (tail), shapes. |
| `js/dragonModel.js` | **Assembler** `buildDragonModel(def, opts)`: builds body + decorations + head + tail + wings + core/aura, returns `{ group, parts, materials, auraSprite }`. Also `makePreviewTick` (shop preview anim). Consumed by both the in‑game rig and the shop preview. |
| `js/dragon.js` | **In‑game rig**: animates wings/tail/body, trails/particles, Surge transform, materials. The runtime. |
| `js/ascension.js` | **Evolution system**: `SIZE_RAMP`/`WING_RAMP`/`STAT_RAMP`, `ascendedDef(def, tier, radiance)` (merges forms + colors, applies ramps), Radiance prestige, costs/gates. |
| `js/ui.js` | Shop UI (dragon cards, form scrub, pips, rarity gems). |
| `js/preview.js` | Shop 3D preview turntable host (camera, blit loop). |
| `js/environment.js` / `js/biomes.js` | Sky shader (sun), lighting, biomes. |
| `js/postfx.js` | Bloom + color grade + Surge wash. |
| `js/obstacles.js` | Obstacles incl. the crystal‑wall **gate**. |
| `js/main.js` | Boot, save load, `?dev`, loop. |
| `js/save.js` | Persistence (`freezeSaves()` for dev mode). |

---

## 4. THE DRAGON MODEL — problems & solutions (read this before touching models)

The redesign went through several rounds because **the wrong lever was tried
first each time**. The lessons:

### P1 — "All 4 forms look the same"
**Root cause:** evolution was driven by *uniform scale* + a *single fixed wing
shape* + bolt‑on flags. Forms only got bigger, never *different*.
**Solution:** carry evolution on **silhouette**, not detail/scale:
- Decoupled **body vs wing growth** (`SIZE_RAMP` ≠ `WING_RAMP` in `ascension.js`)
  so wing‑to‑body proportion changes per tier.
- **Per‑form wing shape presets** (finger count, span reach, trailing scallop,
  apex flame edge).
- Per‑form **tail / spine / aura** ramps.
> Lesson: if two adjacent forms would read the same as a *black silhouette* at
> gameplay distance, the design has failed. Differentiate shape, not color.

### P2 — "Wings read as flat orange RAILS/ribbons" (the biggest one)
**Root cause:** the wings sit ~horizontal, so the rear‑top camera sees them
**edge‑on** → every form collapses to a thin strip; all membrane detail
(scallop/flame/fingers) is invisible edge‑on.
**Solution:** **bake an upward ARC into the membrane** so it presents a real
curved outline to the rear camera. Implemented as `archWing`/`archProfile` in
`dragonParts.js`. The arc is:
- **Outer‑weighted** → inner half stays low ⇒ the **centre lane stays open**,
  drama lives at the outer wing.
- A **profile** (`{bow, hump, humpAt, hook}`), not a single magnitude: the
  `hump` puts a **wrist peak** (the dragon‑wing "elbow"), the `hook` flares the
  tip. This is what makes wings read as *wings*, not panels — and what makes
  each tier's vertical silhouette distinct.
- The finger **bones** (`wingStrut`) lift to follow the arc (`endY`).
> Lesson: from the rear camera, **wing POSE/ARC reads, membrane detail does not.**
> Don't add scallops/flame hoping they'll show — bow the wing.

### P3 — "Wings still look like rails in MOTION"
**Root cause:** even with the arc, a fast wingbeat catches the wing flat at flap
extremes.
**Solution:** per‑dragon **calmer wingbeat** via `model.flapAmp` (+ `flapBias`)
read in `dragon.js` — premium gliders flap small so the arc stays readable.

### P4 — "Body is a blobby/spherical lump"
**Root cause:** round lathe torso (circular cross‑section).
**Solution:** **arrowhead loft** (`buildArrowTorso`) — a blade cross‑section with
a dorsal **keel**, strong shoulders, narrow waist/hips, slim tail root. Lofted
from station rings. Rendered DoubleSide so face winding can't cause inside‑out.
Wing roots raised onto the back so bowed wings **lift clear of the torso**.

### P5 — "Tail is a detached black SPEAR hanging below the body"
**Root cause:** the tail was a single rigid unit the rig *translated*, so it
drifted off the body and never coiled.
**Solution (in `buildCleanTail` + `dragon.js` tail loop):**
- A **chain of heavily‑overlapping segment‑groups** (each = tapered frustum +
  a dorsal **spine plate**), base radius ≈ hip width, **anchored at the hip**
  and overlapping the torso (no seam).
- **Root‑locked snake coil**: `segs[0]` is pinned to the hip; sway amplitude
  ramps to the tip (`lock = i/(n-1)`), so it coils like a snake but never
  separates. Heavy overlap hides joints.
- **Dark + gold accents**, never bright‑orange (orange = hazard color → was
  read as a floating obstacle).
> Lesson: anything attached to the body must be **root‑locked** to it, or the
> rig's per‑segment translation will detach it.

### P6 — "Mace/ball tail looks bad"
**Solution:** removed mace entirely; tail tip is per‑form `tailStyle`:
`simple → finned → blade → comet` (+ `twinfin` for Obsidian, `firefan` for
Phoenix). Elegant, connected, tapered.

### P7 — "Every dragon shares Solar's wings" (after Solar was good)
**Solution:** `def.wingForms` — each dragon defines its **own** 4 wing presets;
`wingSpecFor(def, model)` consults it first (falls back to the shared
`WING_FORMS`, then `DEFAULT_WING`). **This is how you add roster variety.**

### P8 — "Dragon got too big — can't see the path ahead"
**Solution (combination, not one lever):** trimmed `SIZE_RAMP` ~12% (apex
1.0→0.88) **and** lifted/pulled the chase cam back + aimed it higher
(`cameraController.js`) so the dragon sits low in frame. Wing **translucency**
(membrane opacity 0.82 / 0.77 boost / 0.70 surge; bones stay opaque) helps but
is **not enough alone** — translucent wings still occlude.

### P9 — "Dragon Surge is a full‑screen pink wash that hides hazards"
**Solution:** the spectacle should be **on the dragon**, not the screen:
- Trimmed the global fever `lift`/flash ~27% in `postfx.js`.
- **Transform the dragon**: spine/crest/seam/tail plates flare to a per‑dragon
  `surgeHi` (white‑gold for fire, white‑cyan for Obsidian); the violet/themed
  **core** blazes; a soft **glow swells around the wings** (NOT a ring — an
  emitting ring was tried and rejected as clutter).
- A **transformation animation** on Surge *start* (a ~0.7s ignition flourish:
  core flash → spine overshoot → wing‑glow swell → body pulse) instead of a
  hard color swap. Driven by a rising‑edge + `surgeMix`/`ignite` in `dragon.js`.

### P10 — Color progression (Solar spec, reusable pattern)
Per‑form exact palettes via `forms[t].colors` (merged onto the def in
`ascendedDef`). The "dull base → vivid ignite" jump (T0 muted, T1 restores vivid)
makes the first ascension feel earned. Apex accent goes on the **outer wing
only** (Solar = ember root → rose‑**magenta** outer; never a solid‑pink wing).
A violet/themed **core** glow (`def.coreGlow`) escalates with `spineGlow`.

---

## 5. Evolution / ascension (`ascension.js`)
- 4 forms = base + **3** `ASCENSION_TIERS` (Kindled/Radiant/Eternal). Gated by
  flown‑metres + ember cost.
- `ascendedDef(def, tier, radiance)`: clones def → merges `forms[0..t]`
  cumulatively (later overrides earlier; `colors` split out to top‑level) →
  applies `SIZE_RAMP`/`WING_RAMP`/`STAT_RAMP`. `model` base holds APEX values;
  each form dials down per stage.
- **Radiance** = optional post‑Eternal cosmetic prestige (brighter aura). It is
  NOT required progression — the shop was confusing players with "Radiance 5",
  so the card now reads **"EVOLVED ✦ MAX"** + a small optional "✦ Aura".

---

## 6. Boost FX + Surge (`dragon.js`)
- **Tail = primary boost source** (emit from the tail TIP; denser per form via
  `spineGlow`). **Wings = secondary** (wing‑tip contrails only on elite forms,
  amethyst in Surge). Never emit from the whole membrane.
- Surge: see P9.

---

## 7. Shop (`ui.js`, `preview.js`, `dragonModel.makePreviewTick`)
- Preview = the dragon **flapping in place from the rear** (NOT a turntable —
  the old spin read as janky). Camera at a chase‑cam angle, no pedestal.
- **Scrub ◀▶** on any card (owned or not) walks T0→T3; the model swaps live; the
  rarity gem updates **R→SR→SSR→SSSR per FORM** (the form is the rarity ladder).
  Flown form stays clamped to what's owned (`equippedDragon` in `main.js`).
- Bottom pips = one per form (4), rarity‑tinted. (Old "3 pip / R1‑R5" replaced.)

---

## 8. Readability / UX fixes
- **Contrast** (`environment.js` sun glow tightened/dimmed; `postfx.js` bloom
  0.32→0.24, contrast 0.16→0.24; `main.js` `toneMappingExposure = 0.92`): the
  low sun was blowing out into a white blob and washing the scene.
- **Gate** (`obstacles.js`): added a faint glowing **window pane filling the
  opening** so you can locate/aim for it from above (was crashing when high
  above the wall, couldn't see the hole). Beacon column above the gap is still
  there.
- **`?dev`** (`main.js`): unlocks all dragons (max form) + riders + styles +
  999999 embers. Calls `freezeSaves()` so it **never overwrites the real save**
  — reload without `?dev` to restore. (For the test harness, use `?debug&dev`.)
- **Style‑color dominance**: an equipped Style/flightmark keeps its trail color
  even during Surge (`hasStyle` flag in `flightmarks.js` + checks in `dragon.js`).

---

## 9. Adding or reworking a dragon (the recipe)
1. In `js/dragons.js`, give it **`wingForms: [4 specs]`** — each
   `{ tips:[[x,y]…], lead:[x,y], scallop, flame, arc:{bow,hump,humpAt,hook} }`.
   Pick a *distinct* shape: narrow vs broad span, swept‑back vs upswept (tip y),
   smooth vs flame edges, low vs high arc. Verify it differs as a silhouette.
2. **`forms[0..3]`**: set `wingForm: t`, a `tailStyle`, `spineGlow` (0→1), crest
   /veins/seams/halo/etc., and a **`colors`** object per form (dull base → vivid;
   include `coreGlow`). Put apex values in the base `model`/palette; add
   `surgeHi` (white‑hot tint) + `coreGlow` at the def level.
3. New dragons auto‑appear in the shop/unlock/ascension (everything iterates
   `DRAGONS`). Keep stats within `DRAGON_STAT_CAP` so the bars don't renormalize.
4. Add the key to `tools/tiershots.mjs`'s dragon list. Render tier + gameplay +
   surge montages and **judge from the rear camera**, then tune.
5. The shared polish (translucency, tail FX, stats, Surge) applies automatically.

---

## 10. Open items / ideas (not done)
- Live chase‑cam **gameplay montages for Azure/Ember/Jade/Pearl** were not
  rendered (verified via isolated tier montages; global polish is gameplay‑proven
  on Solar/Obsidian/Phoenix). Render if you want a final gameplay pass.
- **Riders** are still essentially color reskins — the user flagged wanting each
  to be a unique character (silhouette/gear), not done yet. (`js/riders.js`,
  `buildRider` in `dragon.js`, `buildRiderIcon` in `preview.js`.)
- Per‑biome Surge wash tint (currently global pink; slightly clashes with
  cool/gold dragons) — optional polish.
- Deeper Surge "speed lines" are currently just a chromatic‑aberration streak.

---

## 11. Conventions / gotchas
- **Judge visuals from the rear gameplay camera**, via the render tools — never
  assume from a model viewer or isolated pose.
- `defs.mjs` requires exactly **4 forms** per dragon (objects).
- Don't run two heavy chromium renders at once (timeouts).
- The rig (`dragon.js`) **overwrites** each `tailSeg`'s position/rotation every
  frame — bake shapes into geometry, don't rely on per‑seg static transforms.
- `materials.spineMats` (collected accent mats) + `parts.coreGlow` are the hooks
  the rig drives during Surge — keep returning them if you refactor.
