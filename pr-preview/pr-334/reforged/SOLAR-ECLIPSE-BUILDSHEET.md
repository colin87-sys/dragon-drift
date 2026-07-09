# SOLAR SOVEREIGN — "The Eclipse Dragon-King" · Premium Build Sheet (Bahamut)

The builder's contract for redesigning `solar` (SSSR) into a bespoke, low-poly,
premium apex dragon. Themed on **Bahamut** (the Dragon King), on the human-chosen
**ECLIPSE** (cool/arcane) identity. Authored fresh — NO existing dragon/builder
geometry is reused or imitated (the shipped parts are the below-standard look this
redesign exists to escape). Reuses only invisible engine plumbing (registry,
attach contract, LOD scaler, surface-shader compose). Numbers here are the
authority; the Fable gate (§ QA) judges against this sheet.

Sourced from: the Bahamut research + the Fable design synthesis + the low-poly
FEASIBILITY hardening pass (the revised, consolidated counts below — fewer, larger,
confidently faceted forms; density at 250px, not tri budget, was the risk).

---

## 0. Frozen contract (do NOT change)
`key:'solar'` · `name:'Solar Sovereign'` · `rarity/maxRarity: SSSR` · `cost:5000` ·
`stats` (speed 1.16 / handling 1.28 / drain 0.7 / regen 1.35) · `fx.auraColor '122,92,255'` ·
`forms[]` accretive, length 4 · `maxTierFor('solar')===3` (tiers 0–3; a 5th tile = PHANTOM FORM).
Approved changes: `fx.auraIdle 0.0 → a single low-alpha idle wisp` (inside the ≤8-drawable budget);
`parts.surface` keeps `cellularScales`, drops `iridescence` (matte "arcane light in darkness").
`title` optionally → "King of Dragons" (human's call; default keep).

## 1. Art direction (frozen north star)
**A crowned midnight flyer under a cathedral of crimson vaults.** A powerful HORIZONTAL
winged dragon (flies level like every other chase-cam dragon — the regal rear-view arch
comes from WING DIHEDRAL, never an upright body). Anchor hue midnight-indigo `0x080b14`;
one arcane accent blue-violet `0xb784ff`, emissive-only on the 10% (seams/tips/gem).
Hero: the **LANCE-VAULT WINGS**. Motif: the **ECLIPSE SIGIL** (brow star-gem + rear corona
mantle). One word: **KING** — worn as a crown on a level body.

## 2. Silhouette language
Primitive: **cathedral arch over a level keel (⋀ atop —).** Body long axis horizontal;
line of action = a gentle HORIZONTAL S in profile (neck arcs up-forward, tail counter-arcs
down-back, ≥1 inflection). Unmistakable outline motifs: (1) the pike rank breaking the wing's
upper leading edge (double-deck read); (2) twin lance-horns clearing the skull line; (3) the
open scepter crescent at the tail tip. Rear black-fill must be instantly tellable from phoenix
(warm feathers), pearl (white halo-knight), obsidian (matte stealth delta). (astralWyrm is being
deleted — no longer a collision constraint.)

## 3. Motif — the ECLIPSE SIGIL (fixed anchor + hue, bloom 0.25→0.5→0.75→1.0)
- **Face half — the STAR-GEM** (anchor: forehead centerline, base hue violet `0xb784ff`): an
  abstract faceted octahedron gem in a low-facet gold hex bezel. It **never opens into an eye** —
  it INTENSIFIES: dim gem + thin rim (0.25) → brighter, first facets (0.5) → deep glow, bezel
  grows (0.75) → blazing multi-facet gem, full hex bezel (1.0).
- **Rear carrier — the CORONA MANTLE** (anchor: dorsal yoke between the wing roots; the chase-cam
  motif): ONE solid faceted gold crescent shield with molded violet emissive seam-grooves
  ("star over a milky nebula"). Blooms by GROWING width/height + gaining 2→3→4→5 seam-valleys
  (single mesh, never N separate plates), emissive 0.25→1.0. A dorsal crescent — never a ring
  behind the head (no pearl-halo collision).
- Both share the violet hue + anchor invariance (drift ≤0.15 pre-scale units); only scale/count/
  emissive grow. Assert: monotonic bloom volume.
- **CP2 SUPERSEDES the "never a ring" note (Eternal only):** the apex now ALSO wears an
  **ECLIPSE CORONA RING** — an OPAQUE 12-facet flat-shaded annulus (outer R≈1.05, inner R≈0.80,
  prism depth ≈0.06, tilted ~12° forward) standing vertical behind the shoulders at the dorsal
  motif anchor. A dark matte moon-disk body (`coronaDark 0x0d0a18`) wearing a THIN saturated
  bicolour rim (alternating `coronaRimV 0x6a2cf6` / `coronaRimA 0xd4680f`, gold inner bevels) —
  eclipse-BY-CONSTRUCTION, not a smoky additive halo, so it does NOT collide with pearl's soft
  halo sprite. FRAMED by the twin carpal spires with the crowned head enthroned in the valley.
  Withheld until f3 (`coronaRing` dial 0/0/0/1); rim mats stay OUT of `spineMats`.

## 4. Torso — `regnalKeelTorso` (NEW, self-registering, default-off)
Horizontal king-body: deep royal keel chest (mass forward, long axis LEVEL), lofted ellipse
ring-set. Side profile body 55–60% of silhouette; chest:mid-belly depth ≈ 1.6; shoulder yoke the
widest station tapering monotonically to the tail root (tip ≤0.18× base). Neck 5→6 segments, proud
forward arc; apex neck ≈ 0.55× body length. Regalia = ONE bold dorsal **keel-ridge**: ~5 large
overlapping chevron cuirass-shields down the spine (×0.82/step), recessed violet emissive seams
between them. Broad smooth midnight flank scale-fields (detail sparse on masses; `cellularScales`
shader carries micro-read). Belly `0x1a1830` two-tone. Publishes: attach contract (`wingRootL/R`,
`headBase`, `tailAnchor`, `halfWidthAt`, `keelTopAt`, `bodyMidY`, `riderSocket`), `parts.spinePoints`,
the corona `motifAnchor`. Body-value ramp (hue held ~indigo): `0x0d1018→0x0c1322→0x0a1020→0x080b14`.

## 5. Wings — the HERO: `lanceVaultWings` (NEW). The LANCE-VAULT architecture.
Two decks, one wing:
- **Deck 1 — lance arm + pike rank:** a heavy gold-armored faceted leading spar (spar:membrane
  thickness ≥10:1) swept back 26–30°. Gold **pikes** rake up-forward ~35° off the arm — swell then
  taper (longest ≈0.30–0.32× span, ×0.82/step; each pike tip ≤0.15× base). Opaque gold, violet
  emissive tip-fade. **3/side at apex** (1→2→2→3 across forms).
- **Deck 2 — crimson vaults:** swept membrane fingers (tapering tubes + raised ribs) carrying deep-
  cambered vault-bay panels (cupped; rim light pools). Trailing scallop 0.24–0.32; true V-gaps
  ≥0.18× span at the outer two fingers; z-stagger ≥0.12. **5 fingers/side at apex** (3→4→4→5).
- **Wingtip:** one long gold tip-spike per wing (hard terminal point vs the soft scallops).
Numbers: apex span:body **3.0–3.4×**; sweep 26–30°; **dihedral 16–22° up (the source of the rear
arch — body stays level)**; apex single-wing area : body side-area 1.0–1.3×. Colour (emissive-on-
opaque): membrane dark burnt-crimson `0x9c2233→0x5a160e` (diffuse L≤0.22; ventral one tier darker,
two-tone); violet **starlight veins** = vertex-color emissive tracing the finger lines, brightest
within 15% of each finger, zero mid-panel; gold arm+pikes brightest value tier, vault crowns mid,
roots/under darkest (3 tiers). Motion character "the sky bows": slow massive downstroke + long glide
hold; pikes lead, vault trailing edges lag ~120ms; fold = cathedral close (span ≤0.65× glide); L/R
phase lag. Publishes `wingPivotL/R`, `parts.wingElements` (fingers + pikes), fold pivots.

## 6. Head — `eclipseCrownHead` (NEW)
Long regal wedge skull (flat royal brow → tapered muzzle; no mask/beak). Horns: two long narrow
near-straight **lance-horns** (apex len 1.7, gold-ringed base, tip ≤0.12× base) + 2 bold back-swept
crown-horns at apex (a crown readable in black fill; the fine coronet is DROPPED — folded into
horns). Small paired **tusks** at forms 2–3 (inspect-view charm, up-curved ivory-gold, never crossing
the horn line). **Star-gem** motif on the brow (§3 — GEM, never opens). Eyes: gold `0xe0bc78→0xf4e2a8`,
brightest facial points bar the apex gem; ladder 36% round low-set → 28% → 20% → 15% almond high-set
(never past ~45% = GOOGLY). Publishes the star-gem `motifAnchor`, `headLength`.

## 7. Tail — `scepterWhipTail` (NEW `scepter` tail style)
Long whip (5→9 segments, tip ≤0.15× base, counter-arcs the neck). Dorsal decoration = **3–4 bold
dorsal fins** that swell-then-taper (NOT a fine chevron march). Apex finial: the **scepter crescent**
— two gold prongs opening ~35° with clear negative space (inner gap ≥40% of crescent width so it
reads open), cradling a small violet emissive **captive star** (octahedron; the star-over-nebula icon
carried, zero comet wake). Per-form: bare whip+nub (0) → dorsal fins appear (1) → prongs bud + first
star glint (2) → full open crescent + captive star (3). Replaces the shipped `tailStyle:'comet'`.

## 8. Four-form growth ladder (revised, feasibility-hardened)
| dial | 0 Hatchling | 1 Kindled | 2 Radiant | 3 Eternal |
|---|---|---|---|---|
| body | horizontal, level (all forms) | | | |
| read | round princeling, big head, gem-scute | squire-drake, neck+horns, first pikes | crowned king-apparent, tusks, corona seams lit | Eternal Dragon-King, full arch, blazing gem, scepter |
| head:body | 1:2.2 | 1:3.2 | 1:4.4 | 1:5.4 |
| eye | 36% round | 28% keen | 20% high | 15% almond |
| span:body | 1.5× | 2.2× | 2.7× | 3.0–3.4× |
| wing dihedral | 10° | 14° | 18° | 16–22° |
| vault fingers/side | 3 | 4 | 4 | 5 |
| pikes/side | 1 | 2 | 2 | 3 |
| keel-ridge shields (ONE rank) | 2 | 3 | 4 | 5 |
| corona mantle (ONE crescent) | 2 valleys | 3 valleys | 4 valleys, seams lit | 5 valleys, blazing |
| crown-horns (incl. 2 lances) | 2 | 2 | 3 | 4 |
| star-gem bloom | 0.25 | 0.5 | 0.75 | 1.0 |
| tail dorsal fins | 1 nub | 2 | 3 | 3–4 |
| tusks | — | — | inspect | inspect |
| body value / glowLevel | `0x0d1018`/0.25 | `0x0c1322`/0.5 | `0x0a1020`/0.75 | `0x080b14`/1.0 |
| tri target | ~1.8k | ~2.4k | ~2.9k | ~3.3k |
All dials monotonic; forms differ in proportion + feature-count + dihedral + regalia, never scale
alone (anti SAME-DRAGON-BIGGER). Hatchling hints the apex (level princeling, pike nub, dim gem,
crescent nub) — never rears up, never GOOGLY.

## 9. Palette (law 9; shipped Bahamut-aligned hexes kept)
Anchor: midnight-indigo (`0x080b14` apex, per-form ramp §4). Accent: `def.accentHue = 0xb784ff`
(blue-violet), EMISSIVE-ONLY on the 10% — plate seams, wing veins, pike tips, star-gem, corona seams,
captive star, `coreGlow`/`apexSeam 0xb784ff`, trail `0xb47cf0`. Diffuse tones (≤3+1 emissive/form):
indigo body, antique-gold regalia `0xd4a84f` (scales/horn ramp `0x9a7c4a→0xddc070`), dark crimson
membrane `0x9c2233→0x5a160e` (L≤0.22). Eyes warm gold (the ONE warm note). Eclipse Surge cool arcane:
`feverWing 0x8a5cf0`, `surgeHi 0x9a86ff`, `feverEye 0xc8a8ff` (never white-hot/magenta). No violet
diffuse on broad masses (anti TOY-COLOR).

## 10. Perf / overdraw (the hard constraint)
Drama = OPAQUE faceted sculpt (keel-ridge, corona crescent, pikes, horns, tusks, scepter, vault ribs).
ALL glow = emissive baked into opaque meshes (vertex-color gradients + surface-shader fragment
emissive) — NO fresnel shell, NO additive sheets, NO sprites for the gem. Transparent/additive
drawables: apex ≤8 (idle wisp + trail + surge motes), forms 0–2 ≤4; hard ceiling 12; alpha overlap ≤2
layers/px. A per-form `glowLevel` (0.25/0.5/0.75/1.0) multiplies all emissive so the adaptive tier
degrades it — and it must still read as a king UNLIT at tier-1. Tri targets §8 (±20%, hard 6000
ceiling). Flat-shaded faceting is THE aesthetic (forged-armor gleam = the platinum-paladin icon),
not a compromise: give every gold form 1–2 deliberate bevel facets to catch a sun edge-highlight;
never fake smoothness. NO sub-8px repeated detail (the law that killed the 7-plate corona / 5-spike
coronet / chevron march).

## 11. Engine plumbing (invisible; named fresh)
New self-registering builders in a new file (default-off; roster byte-identical until `solar.parts`
opts in; coexists with the old solar geometry during dev, then replaces it):
`regnalKeelTorso` · `lanceVaultWings` · `eclipseCrownHead` · `scepterWhipTail` (registers `scepter`
tail style). Per-form changes ride `forms[]` model-knob accretion ONLY (no per-form builder swaps).
New dials (grammar, `forms:true` where per-form): `vaultFingers` (3–5), `pikeCount` (1–3), `dihedral`,
`spanScale`, `veinGlow`, `keelShields`, `coronaValleys`, `crownHorns`, `starGemBloom` (intensity/bezel
only — asserted: no lid/iris geometry), `crescentBloom`, `tailFins`, `eyeShape` (round↔almond),
`glowLevel`. LOD-wrapped via `seg()`; glow via the surface-shader compose path. Publish assert handles:
`parts.spinePoints`, `parts.wingElements`, both `motifAnchor`s. Companion artifacts: this sheet, a
registry anti-collision row (solar vs phoenix/pearl/obsidian), a 4-form `tests/starters.mjs` SPEC
(span+dihedral+finger/pike counts, gap ≥0.18× span, taper ≤0.20 floor 0.08, motif anchor drift ≤0.15
+ monotonic bloom, spine inflection ≥1, tri budgets, accent hue ±20° of `0xb784ff`, membrane L≤0.22,
transparent-drawable ≤ target, star-gem = gem/no-lid at every form, maxTier clamp).

## 12. QA / gate process (required)
0. **CALIBRATION:** run the full capture set + verbatim gate prompt on SHIPPED solar first — expected
   FAIL (the redesign's premise). If a fresh gate PASSES shipped solar, the pipeline is broken — fix
   before building. Record the verdict.
1. Suites green (blueprint / tricount --ci / starters / flapcheck / creaturestress --ci) — whole roster.
2. **Studio captures** per reachable form (0–3, clamped to maxTier=3 — a 5th tile is auto re-capture):
   dragonstudio glide/fold/bank (pinned pose) + turntable face; angles rear-chase/side/rear-¾/top
   planform; three backdrops (near-dark / pale=primary silhouette / warm gold=mandatory for the gold);
   black fills incl. top + wings-only; headshot 4-angle (star-gem crop 4×); the 4-tile form ladder.
3. **Fresh Fable gate agent per round** (judges pixels only). PASS bar: no scored axis ≤2 AND average
   ≥4.0 across silhouette appeal / line of action / taper-shape contrast / wing majesty / wing-surface
   detail / hierarchy / color-rim beauty / life. FAIL → numbered directives applied verbatim → re-
   capture → fresh gate. ~4 churn rounds → consolidate into one frozen work order.
   **Anti-drift check every round (required):** hand the gate a shipped-solar tile + phoenix/pearl/
   obsidian black fills; it must answer "does ANY part read like the retired parts / a tired stock
   dragon?" and "instantly tellable from all three at every tier?" and "is the body HORIZONTAL (not
   reared) in every side profile?" — any failure = FAIL regardless of scores.
4. **CP1** = apex (form 3) body+wings+head+tail → gate PASS → STOP for human. **CP2** = all 4 forms +
   ladder + face crops + roster black-fill frame → fresh gate PASS → STOP for human. In-game pass
   (chase idle / mid-bank / tier-up) = integration only; motion/feel judged live by the human on the
   PR preview. Merge verdict is human.

## CHANGELOG

- **CP1 (merged, PR #323):** apex rebuilt fresh in `dragonSovereign.js` — `regnalKeelTorso` ·
  `lanceVaultWings` · `eclipseCrownHead` · `scepterWhipTail`. Passed the static sculpt gate.
- **CP2 — SPECTACLE PASS (rear-chase-first).** Owner: apex "lacks the spectacle of an end-game
  dragon." Two Fable critiques → this pass.
  - **THE WOW MOVE — "Cathedral Arch + Twin Carpal Lances."** The wing top-line was a LINEAR ramp
    (rear read = spiked delta-KITE / V). Replaced with a two-segment GULL arch (`archRise` dial,
    `wingArchY()`, vertex-baked so it survives the flap animator) climbing to a CARPAL APEX at
    t≈0.35, plus one dominant **carpal lance** per wing (`carpalLance` dial, ~2.6× the rank pikes,
    white-hot spar tip at f3) — twin spires that break the skyline ABOVE the crown and FRAME the
    eclipse-corona ring, the head enthroned in the valley → the silhouette reads **M, not V**. Pike
    rank DEMOTED outboard (0.62^i decay = a scale hierarchy). Longer raked tip finger, **pinion
    slots** (`pinionSlots` — drop the outer bays' trailing tris = see-through spread-primaries),
    banner tail (`tailRise` steepens the tip lift), crown verticality (steeper lance rake + a
    central occipital spike = 3-peak skyline). FX marker + `wingElements` tip moved to `wingArchY`.
  - **THE IGNITION RAMP + withheld regalia (the ladder currency).** `sovereignMats(def,glow,stage)`
    — stage-indexed emissive ladders in saturated bloom-safe hues (sat≥0.75, value≤0.9) baked into
    OPAQUE facets: keel/mantle violet seams, wing vein circuit, brow gem, nape-star, membrane
    trailing-ember gradient, f3 white-hot spar tips. Regalia WITHHELD at the whelp and conferred
    rung by rung (`igniteStage` 0/1/2/3; gem `starGemBloom` 0→1; mantle `coronaValleys` gated;
    `napeStar` from Radiant; `coronaRing`/`sparTipHeat` Eternal-only). The Hatchling is a bare
    princeling (linear glide, no gem/mantle/corona) so Eternal actually CONFERS something.
  - **The rearward NAPE-STAR** (net-new, Fable's call): the brow gem faces away from the chase cam,
    so the king wears a second violet jewel on the mantle crest that the rear view reads.
  - Verified: tricount 967/1302/1611/2010 (all 4 forms, <6000) · wingsymprobe PASS · starters +20
    solar coronation-ladder asserts + blueprint + smoke green · dragonstudio r-cp2 rear silhouette
    reads M · Fable spectacle re-grade.
