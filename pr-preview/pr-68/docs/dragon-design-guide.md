# Designing Dragons — a guide for the dragon design specialist

This is the hands-on manual for creating dragons in Dragon Drift. After the
composable-parts work, **a dragon is a recipe of parts + a palette + an evolution
ladder** — data, not code. You can build a fire-drake, a wingless river-serpent,
a griffin, or a firebird without writing a renderer. This guide teaches you how.

> The deeper architecture (how the part system is wired) lives in
> [`dragon-parts-system.md`](dragon-parts-system.md). You rarely need it — read on.

---

## 0. The one rule that governs everything

**Judge every dragon from the gameplay camera: behind and slightly above the
creature (rear / top-rear).** That is the only angle the player ever sees. A
detail that pops in a side beauty-shot but vanishes from behind is wasted; the
silhouette, the back, the wing edges and the tail are what read. Every QA tool
below renders from that camera on purpose.

---

## 0.5 PLAYABILITY-FIRST — the hard gate (read this twice)

A dragon is **invalid — no matter how cool it looks — if it hurts the player's
ability to fly the course.** The camera looks forward-and-down over the
creature, and the player threads the **head/aim point** through rings for
perfects while reading upcoming rings + obstacles in the centre of the screen.
So a creature is **rejected** if it:

- **hides the head / aim point** (you can't see where to thread a perfect),
- **stacks body mass over the head** from the chase camera,
- **blocks the central ring path / sight-line** (you crash into things you can't see),
- **occupies too much vertical screen** (height is what blocks the forward view),
- has **no believable rider seat**, or
- only reads well in **side / shop view**.

> Collision is a **fixed `playerRadius`**, independent of model size — so big
> creatures are *not* penalised with bigger hitboxes. Crashes from a large dragon
> are always a **visibility** problem. Fix them with silhouette, not collision.

### The gameplay silhouette envelope (design to this)

- **Low-profile** and **horizontally readable** — wider/longer than tall is the
  safe default.
- **Head visible at the front**, with the **aim marker** above it (every dragon
  gets a cyan-white aim crystal at the nose — `dragonModel.js` — rendered
  always-on-top so the body can never hide it; that's your perfect-threading point).
- **Body mass trails backward and slightly *down*** (below the sight-line) or
  **spreads sideways** — never up through the ring sight-line.
- **Wings / fins / tendrils** push **out to the sides or behind**, not up.
- **Big glow / particle FX** offset to the lower-left/right or trail behind —
  keep the central lane clear; the aim marker + ring path stay dominant.
- **Body over the centre lane goes translucent / additive** so you see through it
  to the head + rings.
- **Rider** seated in the **front third**, on the torso's `attach.riderSocket`
  (the rig places it there) — a believable seat, never on the tail/mid-body.

**Validate before shipping:** `node tools/readability.mjs <key>` flags envelope
violations (vertical occupancy / mass-over-head), and `tools/gameshots.mjs`
shows the real chase cam — fly it in your head: *can I see the head + the rings?*

---

## 1. The mental model

A dragon is one object in `js/dragons.js`. It has four kinds of content:

1. **`parts`** — which *body modules* it's built from (the recipe).
2. **`stats`** — how it flies (speed / handling / stamina).
3. **palette** — its colours (top-level defaults + per-form overrides).
4. **`forms`** — its 3–4 evolution stages (Hatchling → … → apex).

The builder reads the recipe, composes the named part modules, paints them with
the palette, and the evolution system swaps forms as the player levels the dragon.

---

## 2. The part palette (your menu)

A dragon picks one option per slot in `parts`. **Every slot is optional** — omit
it and you get the default (the common drake).

| slot | options | default | notes |
|---|---|---|---|
| `torso` | `arrow` · `serpent` · `avian` · `segmentedWyrm` | `arrow` | body plan: arrowhead drake · long eastern serpent · firebird egg-body · **floating crystal vertebrae** (the centipede-wyrm) |
| `wings` | `membrane` · `feather` · `sideFins` · `none` | `membrane` | bat membrane · bird feathers · **lateral astral vanes** · wingless |
| `tail`  | *(set a `tailStyle`, see below)* · `plume` · `orbitSpines` · `legacy` | `clean` | `clean` auto-dispatches ~11 styles; `plume` = flame fan; **`orbitSpines` = orbiting shard/ring relics** |
| `head`  | `horned` · `beaked` · `celestialMask` | `horned` | reptilian (horns/whiskers/tusks) · avian (hooked beak + crown) · **regal faceplate + crown/halo** |

```js
// A few example recipes:
parts: { torso: 'arrow',   wings: 'membrane' }                       // a classic drake
parts: { torso: 'serpent', wings: 'none', head: 'horned' }           // a wingless river-serpent
parts: { torso: 'avian',   wings: 'feather', tail: 'plume', head: 'beaked' } // a firebird
parts: { torso: 'arrow',   wings: 'feather', head: 'beaked' }        // a griffin
```

### Tail styles
The `clean` tail (the default whenever a form sets `model.tailStyle`) is **one
builder that draws any of these** — set `tailStyle` per form, no `parts.tail`
needed:

`simple` · `finned` · `blade` · `comet` · `twinfin` · `shard` (crystal) ·
`spade` · `splitfin` · `stealthrudder` · `apexstealth` (Obsidian's deploying
stealth tail) · `firefan`.

Use `parts: { tail: 'plume' }` only for the firebird flame-feather fan.

---

## 3. The palette (colours)

Colours are hex ints. Set sensible **top-level defaults** on the dragon, then let
each **form override** them in its `colors: {}` block (so a dull whelp can bloom
into a vivid apex). The fields the builder reads:

| field | what it paints |
|---|---|
| `body` | the main body mass |
| `belly` | jaw / underside |
| `scales` | ridges, fins, whiskers, crest |
| `horn` | horns, beak, tusks, bones |
| `wingInner` / `wingOuter` | wing membrane gradient (root → edge) |
| `wingEmissive` | wing glow |
| `eye` | eye glow · `apexEye` swaps in from form 2 |
| `apexSeam` | the premium accent — glow seams, veins, **the fresnel rim**, tail rim |
| `coreGlow` | the violet/heart core energy (set it to enable a core) |
| `surgeHi` | the colour the whole creature flares to during **Dragon Surge** |
| `trail` / `boostTrail` | the flight + boost trail colours |

**Avian dragons** (feather wings/plume) also use: `featherIn`, `featherOut`,
`featherEdge`, `featherHi`, and `aura` (the solar backlight tint). They fall back
to the `wing*` / `scales` fields if you don't set them.

**Stealth dragons** can set `wingMembraneEmissive` (a dark panel tint) so the
wing reads dark with only its `apexSeam`-coloured edges glowing.

FX: `fx: { auraColor: 'r,g,b', auraIdle: 0..0.6, sparkle: bool }` — `auraIdle`
gives a premium dragon a faint always-on halo; `auraColor` is an `'r,g,b'` string.

---

## 4. Evolution — `forms` + ascension

A dragon evolves through stages the player unlocks with mastery + embers
(`js/ascension.js`). You author them as a `forms` array.

- **Starters** (`maxRarity: 'SSR'`) get **3 forms** — Hatchling → Kindled →
  Radiant. Keep the apex *restrained* (no premium glow-seams/veins) so it reads
  clearly below the premiums.
- **Premiums** (`maxRarity: 'SSSR'`) get **4 forms** — … → Eternal (the earned,
  fully-decked apex).

**Forms accrete.** Form *t* lists only what *arrives* at that stage; booleans stay
on and numbers take the latest value, so each upgrade visibly bolts more on. Put a
`colors: {}` in each form to shift the palette as it grows.

```js
forms: [
  // Hatchling — a bare whelp: no horns, no back ridges, dull palette.
  { wingForm: 0, tailStyle: 'simple', ridgeCount: 0, spineGlow: 0, crest: 0, hornLen: 0,
    colors: { body: 0x…, wingInner: 0x…, /* … */ } },
  // Kindled — horns + ridges sprout, wings broaden, clearer colour.
  { wingForm: 1, tailStyle: 'simple', ridgeCount: 8, hornLen: 1.0,
    colors: { /* … */ } },
  // Radiant (SSR apex) — broad wings, finned tail, crest, soft spine-glow.
  { wingForm: 2, tailStyle: 'finned', ridgeCount: 10, spineGlow: 0.3, crest: 1, dorsal: true,
    colors: { /* … */ } },
]
```

### The form "size + silhouette" ramp
The system grows the body **and** the wings on separate curves so the *shape*
evolves, not just the scale (`SIZE_RAMP` / `WING_RAMP` in `ascension.js`). For a
hand-tuned progression you can instead set explicit per-form `bodyScale` /
`wingSpan` / `tailLength` (Obsidian does this). `formLevel` (0..3) is stamped
automatically and drives avian feather counts.

### Wing silhouette per form
Drake wings read by their **per-form outline**. Either reuse the shared
`wingForm: 0..3` set, or give the dragon its own `wingForms: [ …4 specs… ]` for a
distinct silhouette (each spec = `{ tips, lead, scallop, flame, arc }`; copy a
neighbour from `dragons.js` and tweak). Premium apex flags: `wingVeins`,
`wingEdgeGlow`, `wingtipFins`, `hipFins`.

---

## 5. Stats

```js
stats: { speed: 1.16, handling: 1.28, drain: 0.7, regen: 1.35 }
```

Multipliers on the flight model. `drain < 1` = better boost stamina efficiency,
`regen > 1` = faster stamina recovery. The roster cap lives in `DRAGON_STAT_CAP`
(used to normalise the shop's stat bars) — if you exceed it, bump that too.
`flapBias` / `flapAmp` on `model` tune the wingbeat (speed / size).

---

## 6. Worked example — author a new dragon

Goal: a **Storm Griffin** — an arrow-bodied raptor with feather wings and a
beaked head, SSR (3 forms). Add to `js/dragons.js`:

```js
griffin: {
  name: 'Storm Griffin', title: 'Talon of the gale',
  rarity: 'SR', maxRarity: 'SSR', cost: 1400,
  parts: { torso: 'arrow', wings: 'feather', head: 'beaked' }, // tail defaults to 'clean'
  stats: { speed: 1.08, handling: 1.12, drain: 0.92, regen: 1.06 },
  model: { scale: 1.04, wingScale: 1.1, tailSegments: 7, neckSegments: 4,
           hornLen: 0, ridgeCount: 10, flapBias: 0.95, flapAmp: 0.95 },
  forms: [
    { tailStyle: 'simple', ridgeCount: 0, spineGlow: 0, crest: 0,
      colors: { body: 0x3a4250, featherIn: 0x9fb0c8, featherOut: 0x5a6c86,
        wingEmissive: 0x8aa0c0, scales: 0x88a0b8, horn: 0xc8d0dc,
        apexSeam: 0x9fc0e0, eye: 0xbfe0ff, coreGlow: 0x9fc0e0 } },
    { tailStyle: 'finned', ridgeCount: 8, spineGlow: 0.18, crest: 1,
      colors: { /* brighter storm-blue … */ } },
    { tailStyle: 'finned', ridgeCount: 10, spineGlow: 0.3, crest: 1, dorsal: true,
      colors: { /* the SSR apex … */ } },
  ],
  fx: { auraColor: '160,200,255', auraIdle: 0.0, sparkle: false },
  // top-level palette defaults (≈ the apex):
  body: 0x33414f, belly: 0xd8e4f0, scales: 0xbfd4e8, horn: 0xd8e4f4,
  featherIn: 0xbcd4f0, featherOut: 0x6a86a8, wingInner: 0xbcd4f0, wingOuter: 0x6a86a8,
  wingEmissive: 0x9fc0e8, apexEye: 0xdff0ff, apexSeam: 0xbfe0ff, coreGlow: 0xbfe0ff,
  surgeHi: 0xeaf6ff, eye: 0xbfe0ff, trail: 0xbcd4f0, boostTrail: 0x9fc0e8,
},
```

Then **render it from the rear camera** (§8) and tune the numbers until it reads.
That's the whole loop — no renderer code, ever.

---

## 7. When the palette isn't enough — adding a new PART

If you need a body shape no torso/wing/tail/head option provides (say a
crystalline insectoid), you add a **part module**. Each lives in its own file and
self-registers; the pattern is identical for all four:

| part | file | register with | a builder returns |
|---|---|---|---|
| torso | `js/dragonTorso.js` | `registerTorso(name, fn)` | `{ group, attach, mats?, coreGlow?, spineMats? }` |
| wings | `js/dragonWings.js` | `registerWings(name, fn)` | `{ group, parts, wingMat, spineMats }` |
| tail  | `js/dragonTail.js`  | `registerTail(name, fn)`  | `{ group, segs, tailFins, accentMats }` |
| head  | `js/dragonHead.js`  | `registerHead(name, fn)`  | `{ group, spineMats }` |

Two contracts make parts compose:

- **The attach contract.** The torso publishes where everything mounts —
  `attach.wingRoot(side)`, `attach.headBase`, `attach.tailAnchor`,
  `attach.keelTopAt(z)`. The wing/head/tail builders read it, so a new torso
  re-positions every limb for free. Copy `arrow`/`serpent`/`avian` as a template.
- **Surge materials.** Any material that should ignite during Dragon Surge must
  tag `mat.userData.baseEmissive` / `baseIntensity` and be returned in the part's
  `spineMats` (or `accentMats` for tails). The rig flares everything in that list.

A radically different creature (like the firebird) can also have its torso
*return its own `bodyMat`/`eyeMat`* (via `mats`), so its whole material recipe
threads through the system. See `buildAvianTorso` for the worked reference.

### 7a. Novel MOTION — extending the rig

The parts above cover **geometry**. **Animation** still lives in one shared file,
`js/dragon.js`, which natively drives a fixed vocabulary: wing-flap, wrist-fold,
tail-coil, head-sway, bank. If your part wants motion outside that — a body that
slithers in segments, shards that orbit — you extend the rig. It's the only place
the part system doesn't fully abstract, so plan for a small, clean addition:

1. Your part returns its animated objects as a **new handle** (e.g. the segmented
   torso returns `bodySegs`; the orbit tail returns `orbiters`).
2. `dragonModel.js` threads that handle into `parts` (both the live + preview
   returns), `dragon.js` extracts it in `createDragon` + nulls it in
   `disposeDragon`, and animates it in `updateDragon` — **and** `makePreviewTick`
   (so the shop card moves too).
3. **Reuse the existing templates.** A lead-first travelling wave is the
   `tailSegs` coil with the phase-lag applied to the body; an orbit is the Void
   Oracle's `riderOrbiters` loop. Copy them.

**Worked reference: the Astral Centipede Wyrm** (`astralWyrm`) — a fully novel
body plan built entirely from new parts (`segmentedWyrm` / `sideFins` /
`orbitSpines` / `celestialMask`) plus exactly those two rig hooks (`bodySegs`
travelling wave, `tailOrbiters` orbit). It also extends the attach contract with
`segmentAnchors` + `sideFinRoots(side, i)` so the fins mount along the chain, and
**spends ~80% of the tri budget at the apex** (the density climb across the four
forms *is* the unlock reward). Read those four modules end-to-end as the template
for an ambitious creature.

---

## 8. The QA loop — render, don't guess

All tools render to `/tmp/*.png` from the gameplay camera. After any change:

```bash
# triangle budget — every dragon × form against the 6000-tri ceiling (read-only)
node tools/tricount.mjs

# isolated 4-form silhouette montage (rear cam) — see the evolution ramp
PLAYWRIGHT_PATH=$(npm root -g)/playwright node tools/tiershots.mjs <key>   # → /tmp/tier-<key>.png

# the REAL in-game chase camera, T0..T3 — how it actually reads in play
node tools/gameshots.mjs <key>                                            # → /tmp/game-<key>-montage.png

# forced Dragon Surge (does the flare read?)
node tools/surgeshot.mjs <key> <tier>                                     # → /tmp/surge-<key>-t<tier>.png

# the shop cards (turntable framing) + rider tab
node tools/shopshot.mjs dev                                               # → /tmp/shop-dragons.png
```

Sanity checks before shipping a dragon:
- `tricount` stays under budget (≈ 2–5k tris/form; ceiling 6000).
- `node tests/run-all.mjs` is green (the `defs` suite checks every dragon has the
  right form count: **3 for SSR, 4 for SSSR**).
- It reads from `gameshots` (the chase cam), not just the isolated montage.

---

## 9. Gotchas & conventions

- **`maxRarity` drives the form count.** `SSR` → 3 forms (caps at Radiant);
  `SSSR` → 4 forms (Eternal). The `defs` test enforces it. `rarity` is just the
  card frame colour.
- **Keep premium signals premium.** Glow-seams, wing veins, halos, high
  `spineGlow`, deploying tails — reserve these for SSSR. Starter apexes stay
  restrained so the hierarchy reads.
- **`archetype: 'phoenix'`** is *only* a rig flag (warm ember motes + the
  white-gold "Rebirth" Surge in `dragon.js`). It no longer selects a model — the
  firebird is a normal recipe. Don't add new `archetype` model branches; compose
  parts instead. A new dragon that wants warm motes can reuse the flag.
- **Surge colour is per-dragon:** `surgeHi` (the flare target) + `feverWing` /
  `feverEye` / `feverWash` if you want a bespoke Surge tint (Obsidian = cyan,
  Sovereign = violet, Phoenix = gold). Default is magenta.
- **The dorsal spine** auto-runs from `spineGlow > 0` on reptilian torsos; it's
  skipped on `avian`. If you build a new non-reptilian torso, gate it the same way.
- **Mastery + cost:** ascension tier costs scale with the dragon's `cost`
  (`tierCostMult`), and mastery metres gate each tier — no extra wiring needed.
- **You cannot judge motion or Surge *feel* from a still.** Render to confirm the
  shape; then fly it (`/godfall`-style local server, or a PR preview) to confirm
  the wingbeat and Surge feel right.

---

That's the system. Pick parts, paint them, ramp the forms, render from behind,
ship. Welcome aboard. 🐉
