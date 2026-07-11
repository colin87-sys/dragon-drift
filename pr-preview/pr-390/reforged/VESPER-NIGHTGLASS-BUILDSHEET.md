# NIGHTGLASS VESPER — "Knapped from the dark" · Premium Build Sheet (fresh night drake)

The builder's contract for a bespoke, low-poly, premium **matte-black night drake** — inspired by the
owner's Night-Fury reference imagery (the sleek bat-wing predator, the scalloped trailing edge, the
plasma-tail signature) but authored **fresh** and distinct: its own dragon, its own surface language,
never "Toothless."

> **⚠️ HARD DIRECTIVE (owner) — do NOT repeat the retired path.** Every previous night-drake attempt
> (`obsidian` → `unifiedHull` weld → `obsidian2` organism one-skin → `toothless` L32/L33) was **retired in
> #338 as undesirable.** They all chased a SMOOTH ORGANIC SKIN (a lofted, station-swept hull) to mimic the
> movie creature — and in this flat-shaded low-poly engine that failed two ways every time: (1) the
> segmented loft read as **"metallic rings"** (stacked beads, not a creature); (2) the opaque-hull ↔
> translucent-membrane boundary was a **normals/material SEAM** no positional weld could hide. Six material
> passes couldn't fix it because it was never a material problem. **This sheet takes the OPPOSITE
> architecture on purpose (see §Anti-pattern + §1).**

**Read first:** [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md) (§0.5 distinctiveness gate, §2
rear-chase primacy, §3 spectacle triad, §3b anti-tacky lighting, density-at-250px law, coexist→prove→
migrate). Worked reference implementation — **the proven pattern this sheet builds on:**
[`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md) + `js/dragonSovereign.js` (faceted assembly,
`flatTriMesh`, opaque-emissive, fairing overlap). Rear-chase VISIBILITY doctrine: `leapfrog/lessons/
2026-07-10-*` (ghost-vs-reshape, decouple-from-flap, audit-the-real-blocker). **Numbers here are the
authority; the Fable gate (§12) judges against this sheet.**

Sourced from: the owner's 4 Night-Fury reference images + the failure autopsy (LEAPFROG L23–L32, #338) +
the Fable design synthesis. Supersedes the earlier `OBSIDIAN-SHADE-BUILDSHEET.md` draft, whose
organism-architecture recommendation was the failed path (now corrected here).

---

## §Anti-pattern — the retired path (record it; do NOT rebuild it)
- **DO NOT** import or extend `dragonOrganism.js`, `dragonNightFury.js`, `dragonUnifiedHull.js`, or any
  "one continuous smooth skin" / `growSkinnedExtension` / `sweepProfileSmooth` / `cellularScalesNormal`
  construction. That IS the failed family.
- **DO NOT** attempt photoreal smooth-organic geometry. Smoothness-around + faceting-along-z = the
  "metallic rings" band. The engine renders flat facets; author to that, don't fight it.
- **DO NOT** weld a translucent membrane to an opaque body. That join is the seam. Overlap and hide it.

## 0. Identity contract
Introduce as a **fresh roster key** (working `vesper`) — a brand-new premium, coexist-style (nothing shipped
changes). May inherit a retired premium's slot at placement time (owner call). Fields:
`name:'Nightglass Vesper'` · `title:'Knapped from the dark'` · `rarity:'SSR'` / `maxRarity:'SSSR'` ·
`cost:2200` (owner may re-slot) · `stats` (speed 1.1 / handling 1.16 / drain 0.84 / regen 1.18) ·
`fx.auraColor '40,72,150'` (deep ion-blue, cold) · `forms[]` accretive, length 4 · `maxTierFor===3` ·
`hasStyle` · LEVEL body · acid-green cat eyes · **no horns, no crown, no ornament.**

**Frozen identity laws:**
- **Pure black in cruise.** No glowing seams, no lit panels; the ONLY cruise emissive is the eyes. Plasma
  is held back entirely for the Night Surge. *"Vesper glints, never glows."*
- **Knapped, not smooth.** Authored as deliberate flat facets (worked night-glass), never a smooth hull.
- **Stealth, never regal.** Sleek, cat-like, fast; drama from appendage dials on a level body.
- **Zero near-white emissive, zero warm hues.** Two cold accents on black (acid-green eye + withheld ion
  blue), one of them withheld.
- **Build vehicle:** a NEW `dragonVesper.js` on the faceted-assembly family (the Sovereign pattern) — NOT
  the organism family (§Anti-pattern).

## 1. Art direction (north star)
**KNAPPED — night given an edge.** Real obsidian is not smooth; it is *worked* — struck into conchoidal
facets, hard bright edges, blade scallops. The reference appeal ("sleek matte bat-wing predator with a
plasma signature") needs a sleek SILHOUETTE and a matte VALUE read — NOT smooth skin. So Vesper is a
creature **knapped from night-glass:** large, confident, deliberate flat facets that glint moon-grey and
whose plasma stays sheathed until the Surge. Solar wears spectacle as a crown; Phoenix as a train; Vesper
IS spectacle withheld — a blade of dark glass. Anchor hue blue-black `0x070a11` (apex); one cold accent
ion-blue `0x2050e8`, emissive-only, Surge-only, ≤8% of surface. Hero: **THE SCALLOP CRESCENT** (the
knapped bat-wing). Motif: **THE STARLIT SEAM** (the withheld plasma circuit). Growth verb: **KNAPPING** —
the whelp is a rough pebble of night-glass; each ascension strikes new facets/lobes/edges off the blank;
the apex is the finished blade. One word: **KNAPPED.**

## 2. Silhouette language
Primitive: **a level chined dart wearing a wide lateral double-crescent; a long thin tail closing in a
split fan.** Body long axis horizontal; line of action a low, unbroken profile — head-low posture (ref 1)
via neck facets arcing slightly DOWN-forward, level body axis, all vertical drama from appendage dials.

**The signature outline — THE SCALLOP CRESCENT.** In rear black-fill Vesper reads as a **double-crescent
of big rounded scallop lobes** spanning the frame laterally: each wing's trailing edge falls outboard in
4 oversized lobes (fewer, larger — never a sawtooth), the leading arm a clean knapped arc above. Nameable
at a glance: *"the scalloped black wing."* Three centerline punctuation marks: the ear-fin nubs
(top-center) and the twin split fan-fins (bottom-center).

**Distinctiveness gate (§0.5):**

| Axis | Solar | Phoenix | Pearl | Azure | retired toothless/obsidian | **Vesper** |
|---|---|---|---|---|---|---|
| Region | top-heavy crown | bottom-heavy train | forward halo-knight | compact falcon comb | (midline, smooth) | **lateral spread** |
| Profile fn | interior-peak **M** | terminal-peak rake | — | blade comb | smooth droop | **multi-lobed SCALLOPED** |
| Construction | facet + gold regalia | facet + fan train | light-bodied | feather blades | **smooth one-skin (FAILED)** | **KNAPPED facet assembly** |
| Wing | vault-bays + lances | pyre fans | — | falcon primaries | blended membrane | **scallop crescent, translucent knife-edge, ZERO hardware** |
| Motif | ring + gem | coal arc | halo | ice seam (diffuse) | none achieved | **inset STARLIT SEAM (Surge-only)** |
| Glow | violet 262° | warm triad | white-gold | pale ice 205° | — | **ion blue 223° (withheld) + green eyes** |
| Growth verb | coronation | rebirth | — | — | — | **knapping** |

**Retired by this sheet (housekeeping):** silhouette region **lateral/symmetric-spread** · profile family
**multi-lobed/scalloped** · tone lane **unlit black / zero cruise-glow** · construction lane **knapped
facet night-drake**.

## 3. Motif — THE STARLIT SEAM (the withheld plasma circuit; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor:** the dorsal centerline — occiput → spine → tail stem → forking into both fan-fin rims —
where knapped panels meet. It is an INSET SEAM: in cruise, pure geometry (a recessed shadow groove between
facets; the cruise-black law holds because the seam is CARVED, not lit). On boost/Surge the seam floor
ignites: opaque vertex-baked emissive in ONE hue.

- **Hue lock: ion blue `0x2050e8`** (~223°, sat ≈0.86, val ≈0.91 — blooms in its own colour under ACES).
  Surge peak `surgeHi 0x4d86ff` (saturated — never white-hot, never cyan-pale). **Anti-collision (live
  roster checked):** deep electric blue, cleanly apart from Azure's pale ice-cyan (~205°, near-white,
  mostly diffuse), Solar's blue-violet (~262°), the jade mint (~149°), Phoenix's warm triad, Pearl's
  white-gold. Deliberately abandons the earlier draft's cyan `0x1fb6e0`, which crowded Azure's lane.
- **Eyes:** acid-green `0x96d62a → 0xb6e85a` — the ONE always-on accent (the eye was never a failure mode;
  the single deliberate carry-over from the retired identity).
- **4-step bloom (`seamRun`, MESH and LIGHT gated per form):** **f0** — a single knapped nape NOTCH, no run
  (Surge = eye flare only). **f1** — seam carved to mid-spine, lit dim on Surge. **f2** — full spine + tail
  stem; Surge plays the **seam-run**: ignition sweeps head→tail over ~0.8s (per-segment emissive ramp,
  CPU-driven, headless-testable), then holds. **f3** — the full circuit: spine + tail fork + both fin rims
  + one short **wing-root spark line** per wing (a single inset streak UNDER the scapular cowl — never
  veins across the membrane; the wing stays black so the scallop silhouette owns the frame).
- **Anti-tacky/density (§3b):** all emissive baked into opaque recessed facets; seam 8–10px at chase;
  small count (1 spine + 2 fin rims + 2 root sparks); no additive shells, no sprites; Surge intensity
  CAPPED so the centerline bloom never glare-masks the corridor (rim-diet law: width + intensity, not
  alpha). Seam/fin-rim mats go IN the surge arrays; eye mats stay OUT. **Zero near-white anywhere.**

## 4. Torso — `knappedTorso` (chined stealth-hull; the ring-failure dead by construction)
A CHINED stealth-hull loft: **5–6 stations, N=7 cross-section, with a hard lateral CHINE** (a knife-line
running nose-to-tail, like a stealth fuselage or a panther's sheen line). The dominant visible edges run
LONGITUDINALLY, so the light grain reads as *designed knapping*, never as lateral rings. (Solar's
`regnalKeelTorso` — 8 stations, seg(9) — is the shipped proof a low-station faceted loft reads as a
creature.) Chest deepest at the shoulder, waist tuck, lean haunch — a panther's lean, not a keel. A narrow
dorsal **glass-streak facet strip** (roughness ~0.5 vs body 0.8, envIntensity ~0.22) gives the moon-grey
cruise glint — *glints, never glows* (non-emissive). Publishes the full attach contract + `spinePoints` +
the seam `motifAnchor` (nape) + `coreGlow:null` (the documented crash guards). Matte laws: metalness 0,
roughness 0.8, envIntensity ~0.2. NO shingle plates, NO `cellularScalesNormal` (facets carry the detail;
micro-relief is sub-8px noise at chase).

## 5. Wings — the HERO: THE SCALLOP CRESCENT (the seam-failure dead by construction)
The dominant landmark, straight from the reference money-read: each wing a broad faceted sail whose
**trailing edge is 4 oversized rounded scallop lobes**, each lobe a fan of 4–5 big flat tris around a
cupped centre (the Sovereign vault-bay construction re-authored: soft CONVEX lobes, matte night-glass, and
**NO gold spars / pikes / lances** — zero hardware). Rear-chase silhouette = the double-crescent of
scallops spanning the frame.

- **Wing↔body join — HIDDEN, never welded:** the membrane root chord is buried inside the body silhouette;
  a **scapular cowl** (2 large overlapping knapped flake-plates per side, Solar's fairing/pauldron trick
  restyled) laps over the root from above/behind. Separate meshes, generous overlap, join invisible from
  every chase angle. Overlap > weld: ~20 tris, zero topology risk, no seam to fail.
- **Translucent knife-edge:** the outer/trailing ~22% of each lobe is a SEPARATE thin band,
  `transparent:true, opacity 0.72`, **single-layer** (never stacked back-faces — the CP3.2 0.82² lesson),
  so light shows through the rim exactly where the refs show it. Inboard membrane opaque-transparent at the
  standard **0.82 wing-fade contract** (set `transparent:true` from day one — the Solar opaque-wall bug).
  This IS the visibility answer for a big dark occluder: the edges the player must see past ARE the
  see-through part.
- **White speckle = CONSTELLATIONS (firewall-safe):** 6–8 diffuse (NON-emissive) moon-grey `0xc9d4e2`
  facet flecks per wing, clustered in one deliberate constellation band near the leading arm, each ≥8px at
  chase. Diffuse paint → never touches the near-white emissive cap.
- **Finger ridges as facet CREASES**, not tubes: lobe boundaries carry a raised crease line of body-hued
  facets (the "finger-webbed" read) — geometry shadow, not glow.
- **`glideRake` (pose, not silhouette):** lifts the leading arm into the high vertical fan (ref 2) during
  glide-hold/idle, levels out in flap. Motion — the human judges it on the PR preview (the gate is blind).
- Canonical +X wing, `scale.x=-1` mirror; publishes `wingPivot/Mid/TipL/R` + tip `marker`; the tip marker
  duplicates the wing's vertical-profile formula incl. `glideRake` (the documented detach gotcha).

## 6. Head — `vesperCatHead`
A blunt faceted CAT-WEDGE (~12 big facets), short muzzle, **NO horns.** Eyes are the face's whole budget:
the roster's LARGEST apex eye, ladder 38% round kitten → 30% → 24% → **20% almond**, acid-green
`0x96d62a → 0xb6e85a`. Ear-fin nubs: swept facet pairs **1→2→2→3** up the ladder, faces canted ~±10°
off-sagittal so they read from behind (the top-center silhouette punctuation).

## 7. Tail — `splitFanTail`
A long thin CHINED stem (6→8 facet segments, `bodyStretch` 1.15 at apex) closing in **twin split fan-fins**
— each fin 3 knapped petals, faces pitched ~+15° toward the chase lens (the cant law), rims carrying the
seam (Surge-only). `tailFinSpread` ladder 0/0/1.0/1.2, monotonic.
- **The red prosthetic fin: NO.** It is the single most literal Toothless identifier (a story prosthetic,
  not dragon anatomy) and a warm red breaks the two-cold-hues discipline. **The signature nod instead:**
  the PORT fin alone carries a white-speckle constellation — an *asymmetry of marking* honoring the "one
  fin is different" read without copying the prosthetic. Fresh, legally clean, zero tris.

## 8. The KNAPPING ladder (4 forms — each rung strikes new facets/edges off the blank)
Form names: **f0 Glass Pebble · f1 Struck Flake · f2 Edged Hunter · f3 Nightglass Vesper.** Drama targets
25 / 45 / 70 / 100.

| dial | f0 Glass Pebble | f1 Struck Flake | f2 Edged Hunter | f3 Eternal |
|---|---|---|---|---|
| read | rounded pebble-kit, huge eyes, 2 blunt lobes | first true scallops, chine appears | the hunter: 4 lobes, split tail arrives | the finished blade: full crescent + circuit |
| scallop lobes / wing | 2 | 3 | 4 | 4 (larger + finger creases + translucent edge band) |
| `seamRun` (carved mesh) | nape notch | 0.4 | 1.0 + tail stem | full circuit + fin rims + root sparks |
| constellations | 0 | 0 | 1 / wing | 2 / wing + port-fin mark |
| ear-fin pairs | 1 | 2 | 2 | 3 |
| tail | spade nub | twin nubs | split fan (small) | full splayed fan + rudder facet, `bodyStretch` 1.15 |
| `glideRake` (pose) | 0 | 0 | 0.5 | 1.0 |
| span : body | 1.6× | 1.9× | 2.2× | 2.45× |
| eye | 38% round | 30% | 24% | 20% almond |
| body hex (DARKENS) | `0x111522` | `0x0d111b` | `0x0a0e17` | `0x070a11` |
| `glowLevel` (Surge-side only) | 0.25 | 0.5 | 0.75 | 1.0 |
| tri target | ~1.6k | ~2.4k | ~3.4k | ~4.6k |

Every rung adds a CATEGORY (hardware + light + a silhouette move): f1 = the chine + first scallops; f2 =
the split tail + the seam-run animation + first constellation; f3 = the full 4-lobe crescent with
translucent edges + the complete circuit + port-fin mark + 3rd ear pair. Apex is obviously superior by
SHAPE-COMPLETION (only Eternal is the finished blade), never by scale alone. **The inverted value ramp:**
every other dragon brightens up the ladder; Vesper's body gets BLACKER (the apex is the darkest object in
the game) while its withheld circuit grows. Asserts: tris monotonic ↑; `seamRun`/scallop/`glideRake`/
ear-pairs monotonic ↑; **body value monotonic DECREASING** (its own unique assert).

## 9. Palette (total discipline — two cold accents on black, one withheld)
- **Anchor (matte blue-black), per-form ramp:** `0x111522 → 0x0d111b → 0x0a0e17 → 0x070a11` (hue held cold
  blue-black; L ≤ 0.10 — the unlit tone lane). Belly + ventral membrane one value-tier lighter slate
  `0x141b28` so banks read.
- **Cruise sheen (non-emissive):** dorsal glass-streak roughness ~0.5, envIntensity 0.22 — moon-grey
  glints. Diffuse speckle `0xc9d4e2`.
- **Accent 1 (always on, tiny):** acid-green eyes `0x96d62a → 0xb6e85a` — the only cruise emissive, <1%.
- **Accent 2 (Surge-only):** ion blue `0x2050e8`, `surgeHi 0x4d86ff`, trail `0x24427a` → boost `0x3d63c8`.
  Emissive-only, ≤8% surface (seam + fin rims + root sparks).
- **Zero near-white emissive. Zero warm hues.**

## 10. Perf / overdraw / rear-chase visibility (CP3 pre-solved)
Big dark occluder in the lateral band → apply the CP3.1–3.3 triage as PRE-conditions:
1. **Translucent scallop edges + 0.82 wing-fade inboard** (`transparent:true` from day one) — the edges the
   player must see past are literally the see-through part; single-layer only (no stacked back-faces).
2. **No dome above the rider eye-line** — head-low posture keeps the mass under the horizon band; assert a
   clearance check in the studio capture.
3. **±10° forward corridor empty at ALL flap phases** — verify with the 5-phase `flapstrip` (apex +
   recovery are the money frames a single shot misses). Scallops sweep outboard; nothing crosses center. If
   any phase intrudes, RESHAPE (never ghost a silhouette element); `spireStabilize`-style flap-decouple is
   on the shelf (opposite L/R signs; wingsymprobe Δ0.000 is the guard).
4. **Nothing spins** — the angular-fix failure class avoided by construction.
5. **Surge glare cap** — the ion-blue seam is a bright centerline during Surge; cap emissive so the bloom
   halo never glare-masks the corridor.
6. **Budgets:** tri ladder ~1.6k/2.4k/3.4k/4.6k (monotonic, <6000/form). Transparent/additive drawables ≤8
   at apex (translucent edge bands + trail + surge motes — recount honestly). No repeated detail <8px (4
   lobes, ≤8 speckles/wing, 3 petals/fin). One material per group; static `flatTriMesh` → few draw calls,
   weak-mobile safe.

## 11. Engine plumbing (invisible; fresh names; NEVER the organism family)
New module `js/dragonVesper.js` with self-registering builders `knappedTorso` · `scallopCrescentWings` ·
`vesperCatHead` · `splitFanTail` (the `dragonRecipe.js` registry pattern, default-off, hero-only opt-in →
roster byte-identical). `vesperMats(def, glow, stage)` copies only the `sovereignMats` STRUCTURE
(stage-aware factory + surge-tick wiring), never the look. New NULLABLE dials, all default-off/null:
`chine, glassStreak, scallopLobes, cowlPlates, glideRake, seamRun, constellations, earFinPairs,
splitFan, tailStretch, igniteStage, glowLevel`. **Explicitly forbidden imports:** `dragonOrganism.js`,
`dragonNightFury.js`, `dragonUnifiedHull.js` and any smooth-hull/skinned-extension helper (§Anti-pattern).
Reuses invisible plumbing only: recipe registry, attach contract, LOD scaler, surface-shader compose, the
`igniteStage` dial pattern, the surge/`spineMats` tick, the flap rig.

## 12. QA / gate process (required)
- **Calibrate the gate first** on (a) a recovered retired-`obsidian`/`toothless` tile from the #338 commit
  (MUST fail — proves the rubric catches the smooth-hull look) and (b) Solar/Phoenix/Pearl/Azure comparison
  tiles. Standing veto: *"does any part read like a shipped dragon — or like the retired smooth Toothless?"*
- **Round-0 self-audit vs the §3.5 firewall:** mass = the knapped hull + double-crescent wing; dominant
  element = the scallop crescent, with the split-fan tail + ear fans as graded ranks; edges = designed
  knapped facets + soft scallop lobes (NOT smooth, NOT sawtooth).
- **The two-state dark-sky ruling (record so no fresh chat "fixes" cruise-black with glow):** the "own the
  dark sky / ≥3 coloured light structures" gate is judged on a CRUISE + SURGE tile PAIR. Cruise must HOLD
  (crisp scalloped silhouette + chine/glass-streak glints; the test is "does it read and hold," NOT "is it
  lit"). The ≥3 structures land on the SURGE tile (spine seam / fin rims / root sparks) + the green eyes.
- **Standing gate items:** `flapstrip` 5-phase corridor check · dome clearance · `wingsymprobe` Δ0.000 ·
  tricount monotonic <6000 · cruise-emissive assert (no mat except eyes has intensity > ε at rest) ·
  body-value-monotonic-DECREASING assert · zero-near-white-emissive assert · span:body ≤ 2.5 · a
  no-organism-import assert (fails the build if `dragonVesper.js` imports the forbidden modules).
- **Tests:** a `vesper`-own `tests/starters.mjs` block mirroring the premium 4-form assert pattern.

## SETTLED (do not re-litigate)
- **KNAPPED FACET ASSEMBLY on a new `dragonVesper.js` (the Sovereign pattern)** — never the organism/
  unifiedHull/nightFury family (§Anti-pattern). This is the whole point of the redesign.
- **The scallop-crescent WING is the hero** (the reference money-read), not the tail.
- **No red prosthetic fin** (too-literal Toothless + breaks the palette); the nod is the port-fin white
  constellation asymmetry.
- **Acid-green eyes** carry over (never a failure mode); everything else of the surface is fresh.
- **"No glowing seams" is a CRUISE law; the Night Surge is its DESIGNED exception.**
- **Zero near-white emissive**, **zero warm hues**, **body value DECREASES up the ladder** (apex = darkest).
- **Ion blue `0x2050e8`** for the plasma (NOT the earlier draft's cyan, which crowded Azure).

## Open owner calls (flag on the build PR)
1. **Name** — "Nightglass Vesper" (recommended); alternates Sablewing Nocturne · Duskflint.
2. **Roster placement + key** — fresh slot vs a retired premium's slot; final cost.
3. **`glideRake` tall-fan glide pose** — motion; human judges on the PR preview.
4. **Boost pre-taste** — a dim seam-flicker (≤30%, ~0.4s) on boost between Surges. Default OFF if it
   dilutes the withholding.
5. **How dark is too dark** — black hull vs a bright canyon biome; rides the PR preview.

---

## CHANGELOG
- **v0 (Fable synthesis → sheet, from the Night-Fury refs + the failure autopsy).** Fresh night drake
  **NIGHTGLASS VESPER** — identity KNAPPED (night given an edge); hero = THE SCALLOP CRESCENT (the knapped
  bat-wing, translucent knife-edge); motif = THE STARLIT SEAM (inset plasma circuit, cruise-geometry-only →
  ion-blue Surge cascade); the KNAPPING ladder (facet/lobe conferral + the inverted darkening ramp); zero
  near-white; rear-chase visibility pre-solved. **Architecture: a NEW faceted-assembly `dragonVesper.js`,
  explicitly NOT the retired organism/one-skin family** — the ring + seam failures dead by construction
  (chined longitudinal grain; scapular-cowl overlap join). Supersedes the earlier `OBSIDIAN-SHADE-
  BUILDSHEET.md` (whose organism recommendation was the failed path). Next: introduce the `vesper` stub +
  calibrate the Fable gate on the recovered retired tile, then build torso chine → scallop wing → seam
  increment-by-increment behind the nullable dials.
- **v1 (BUILT — `dragonVesper.js` + `vesper` roster key, PR #390).** All five increments shipped behind
  nullable, default-off dials; the rest of the roster is byte-identical. Per-increment high-effort Fable
  harsh-critic gates: **I1 knappedTorso 4.5** · **I2 scallopCrescentWings 4.4** · **I3 vesperCatHead +
  splitFanTail 4.3** · **I4 the Starlit Seam 4.4**. The ring failure died by construction (a fixed-profile
  chined loft → longitudinal strakes + value bands); the seam failure died by construction (a static
  scapular cowl of knapped flake-plates over a buried wing root). The Starlit Seam is withheld by a
  near-zero cruise base + a high `surgeGlowMultiplier` (only the multiplicative surge tick blazes it);
  `feverWing:0x000000` keeps the wings a dark silhouette on Surge (the rig defaults to magenta — every
  fever hook was overridden cool). Tooling added: `reforged/tools/seamprobe.mjs` (objective two-state hue
  proof) + a `surge` state in dragonstudio (matched dark-sky cruise/surge pairs) + a `tests/starters.mjs`
  premium assert block (tris monotonic ↑ · body value ↓ · cruise-emissive = eyes only · zero near-white ·
  span:body ≤ 2.5 · the no-organism-import firewall). **Owner calls resolved:** fresh roster slot `vesper`
  (cost 2200) · boost pre-taste OFF (seam fully withheld to the Surge) · name **Nightglass Vesper**.
  Rides the PR preview (the gate is blind to motion): the `glideRake` glide-hold fan pose + how the black
  hull reads against a bright canyon biome.
