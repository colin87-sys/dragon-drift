# THE LOST LAGOON — Biome Bible

**Fable-authored build sheet (Stage-1 art direction).** Consolidated biome **0** (absorbs and
retires biome 1, Amber Wastes). The premium overhaul of the old Sunken Sanctuary + Amber Wastes
into one biome. Read [`BIOME-OVERHAUL-PLAYBOOK.md`](./BIOME-OVERHAUL-PLAYBOOK.md) Part B
(anti-replication) first — this bible obeys it. Working name **THE LOST LAGOON** (owner names it;
nothing downstream keys on the string — fallbacks: keep "Sunken Sanctuary", or "Halcyon Sanctuary").

**Owner vision:** *"A lost, hidden, watery paradise of ruins against the sunset."* Awe from prop
design AND scene COMPOSITION. National Geographic × Ghost of Tsushima × Breath of the Wild.
Everything AAA/premium. Distinct from Frozen AND Caldera (ship-blocking, equal to determinism/60fps).

**Identity triple (merged):** Identity — "A lost lagoon-sanctuary at golden hour: drowned holy ruins
the garden has reclaimed, every window still facing the sun." Hazard — THE SINKING GATES (the
canonical descending arch-gates, premium-realized). Verb — thread-the-arch (kept). Anchor —
**HOLLOWGATE** (kept; its horizon-arch landmark slot stays RESERVED — this biome builds no competing
horizon arch). Lore-tenant — KNELLGRAVE (the bell; this kit gives it physical artifacts). Amber
Wastes is *absorbed, not deleted*: its bleached-bone becomes the ABOVE-TIDE ladder stop, and its
"brightest breather" role passes to the golden hour. KARNVOW roams the cycle (anchor-less by design).

---

## 1. THEOLOGY SENTENCE

> **"Everything here has been claimed twice — first by the water, then by the garden — and the
> light claims nothing: it only passes THROUGH, window by window, down to the water."**

| Biome | Subject | Light source | Verb |
|---|---|---|---|
| Frozen | luminous ice | cool light lives IN the mass; warm only FROM the sun | lives-in / stillness |
| Caldera | black crust over living fire | fire from BELOW, through wounds | rises |
| **LOST LAGOON** | drowned masonry reclaimed by water + garden | the low sun PASSES THROUGH apertures; nothing emits, nothing burns | passes-through / reclaims |

Corollaries every element answers to:
- **Stone is a record, not a light.** Masonry never glows as a body; its richness is HISTORY (the
  tide painted three bands on every mass — §3). "Lit from within" = drifted to Frozen → kill it.
- **Every ruin is an aperture.** The signature form-move is the THROUGH-HOLE: oculi, arch openings,
  empty windows, belfries. The brightest thing in a silhouette is the sky seen through it. (The repo's
  god-rays are occlusion-masked — aperture geometry carves real light shafts at zero cost.)
- **The garden is the only living color.** Green exists ONLY here in the cycle (Mire's biolume is
  night-teal, not vegetation). Life = olive-gold backlit foliage, jade tide-moss, lily rafts.
- **The only fabricated light is the gold the water couldn't take** — ancient GILT surviving in
  recesses; never a strip, never a lamp.
- **Ruin discipline replaces geology discipline:** no INTACT read. Nothing plumb/symmetric, no
  unbroken course; every cornice slumped, every opening chipped. "Built, then broken, then loved by
  plants."

## 2. EMOTION + THE MONEY SHOTS (composition is half the grade)

**Target emotion: SANCTUARY-HUSH AWE — "I found a secret place, and it's at peace."** (Frozen = lonely
reverence; Caldera = standing inside something alive and indifferent; Lagoon = *arrival somewhere that
was waiting for you*.) Serene, warm, alive, monumental only in punctuation.

**Compositional grammar — NESTED THRESHOLDS.** The eye always reaches the light THROUGH something:
sun → nearest aperture framing it → gilt reveal → jade tide-seam → reflection → the next opening.
Frames within frames, receding toward the sun. Every money shot contains ≥1 opening that re-frames
the sunset; a frame with no threshold gets negative space, not more props.

- **Money shot 1 — THE SUN THROUGH THE OCULUS (arrival).** ~200m of empty mirror (seam-relative
  arrival park, reuse Caldera §3.2 seamDelta), only lily rafts + low wrack near the seam. Then the
  hero `rotunda` rises off-flank at ~250m: a colossal broken dome whose oculus faces down-lane — for
  a few seconds the sun disc rides INSIDE the opening, god-ray shafts through the drum windows, the
  whole form doubled in the mirror, an egret pair crossing low.
- **Money shot 2 — THE PILGRIM REACH (cruise signature).** Center: the specular gold lane to the sun
  (the flight lane = the light lane). One flank: the `arcade` massif receding into fog, each arch
  holding a coin of gold sky. Other flank, far: one leaning `campanile` counterweight. Foreground:
  lily rafts cutting the gold into green ellipses; petals crossing on the wind; ankle-deep mist. The
  central third of the horizon stays EMPTY (sun + HOLLOWGATE's stage).
- **Money shot 3 — THE GARDEN HUSH (negative space).** 150–250m of near-nothing: open mirror,
  drifting petals, 2–3 lily rafts, and ONE half-drowned `sentinel` head catching rim-light, staring
  down-lane. A single far bell toll (KNELLGRAVE). The silence that makes the rotunda colossal.

**Numeric composition targets at cruise (judge on captures pinned to `?biome=0`):** ≥45% of visible
water = unbroken mirror; ≤1 hero-class mass per flank within 300m, alternating flanks, 150–250m
rhythm; horizon central third prop-free; no two consecutive heroes on one flank; every capture's
brightest non-sky value sits INSIDE an aperture or on the water — never on a prop face.

## 3. MATERIAL IDENTITY

**Value-ladder axis — THE TIDE LADDER (position-keyed, not normal-keyed).** Keyed off HEIGHT ABOVE
THE WATERLINE — material history painted by the tide, banded horizontally like a shoreline stain:
1. **BLEACHED** (above the old tide): sun-bleached bone-amber `0xe6d3a8` (Amber Wastes absorbed here;
   crowns catch the golden hour — warm ivory-amber, never pure ivory: HOLLOWGATE stays the palest).
2. **LIVING** (the tide band): saturated jade-verdigris `0x35896a` — the HERO stop, a bright life-seam
   at the waterline, doubled by its reflection (the signature pixel: warm stone / jade ring / dark
   below / mirrored).
3. **DROWNED** (below): deep slate-teal `0x163a40` — what the water keeps.

Engineering: a small sibling of `bakeIceLadder` — `bakeTideLadder(geo, {waterY, bandH, stops})`,
per-face by centroid height in unit space (~20 lines, same vertex-color output + `withLadderEmissive`
fold). Yaw-invariant, scale-tolerant. NEVER call `bakeIceLadder` without explicit `stops` in this kit
(prefer not calling it). Fold into a NEW `lagoonStone` material (`vertexColors:true`, emissive
warm-neutral `0xd8cfae` @ ~0.35) — never clone `frostIce`. Foliage = baked vertex color on the SAME
material (olive-gold sunlit `0x8fa84a` / shadow `0x2f5a38` — backlit golden-hour foliage is olive-gold,
not grass-green, and keeps distance from Mire's mint-teal).

**Accent + glow ADDRESS — GILT IN THE APERTURES.** One accent material: ancient temple gold
`0xffd28a`, emissive `0xffb040` @ ~0.65. ONE address: the inner reveals of through-openings (arch
intrados, window jambs, the bell's mouth, an oculus rim) — always recessed by the opening's own depth,
reading as sunset caught inside a hole. Never an outer face, never a band, never the tide line. Gilt
on ≤3 of 7 archetypes; foil + commons carry none. **Fairness rule:** through-apertures are for SIDE
PROPS only; in-lane hazard skins use shallow BLIND gilt niches (a see-through hole inside a lethal
collider is "looks passable but kills").

**Water:** deep `0x07262e`, shallow `0x2b7a70` (jade lagoon), **waveAmp 0.42** (calmed from 1.0 so
ruins double in the mirror — deliberately NOT Frozen's 0.22 dead-calm; a lagoon breathes). Hot-gold
sun kept for the glitter lane.

**Fog:** near = dusk warm-teal `0x214a52` (near 70, far 400); `fogFarColor` = rose-apricot `0xffb877`
(one step rosier/softer than Frozen's `0xffa268` — humid, not molten). **Height fog `heightK ≈ 0.03`**
— evening mist pooling on the water; dive = into the hush, climb = clear gold.

**Light:** low sun dead ahead (shipped `SUN_DIR`), but the STORY is transmission. sun `0xffb060` @1.55;
hemiSky `0x86b4d0`; **hemiGround `0x1e4438`** — undersides pick up JADE LAGOON BOUNCE (inverse of
Caldera's ember bounce, unlike Frozen's rose fog-sea). Sky top `0x0d1f3c` / mid `0x235058` / horizon
`0xffb060` / sun `0xffd080`; keep dusk cumulus (lit `0xffe4b8` / shadow `0x1e2c46`); stars 0.15.
Re-run `bulletcontrast.mjs` on every palette move (biome 0 ships `bullets:{dark:0xaf4f73}`); danger
stays role-locked magenta `0xff2b6a` (gilt gold is hue-distant, never competes).

## 4. PROP ROSTER — seven unrelated outline families

Constraints: ≤150 tris, ≤2 material groups (`lagoonStone` + `gilt`), parts interpenetrate ≥25%,
offset-stacked + rotY-robust, explicit `tilt` always returned, prime pairwise-coprime steps, FOAM_CFG
row each, inner edge ≥14.5 (draw r first, couple x to measured ρ; `propclearance` widened to biome 0),
`props:` mirror in `BIOMES[0]` updated, legacy `tower/column/archruin/slab/dome`+`obelisk` park behind
`?props=v1`. Reference: drowned/reclaimed architecture + lagoon ecology (Ta Prohm strangler figs,
flooded Mahabalipuram, Venice campanili, reservoir steeples, Nan Madol, Victoria-amazonica lilies,
mangrove islets). Projected band ~270 inst / ~29k tris (adjacent-pair w/ Frozen ~58k < 90k).

1. **`rotunda` — THE HERO (build first).** Broken hemispherical dome on a pierced drum (the roster's
   only curved crown; w~30–48, h~14–20). One dome flank collapsed (break faces sky → asymmetric),
   2–3 arched drum windows + the oculus as REAL through-holes; a fig-root rib + one olive canopy pad.
   Glow: gilt inside the oculus reveal only. ~150 tris. Step 59. Clearance HERO (r~18–28, floor ~18+).
   Distinctness: a pierced dome — no shipped biome owns a curve. Role: arrival chord + sun-in-oculus.
2. **`arcade` — THE MASSIF (backdrop).** Long low wall PUNCHED by a rank of arches (only
   repeated-negative-space family; 5–8:1 wide, w~110–160, h~16–24; 2–3 spans collapsed to stumps).
   Glow: none — its light is the sky through its arches. ~140 tris. Step 97, `foam:false`, backdrop x.
   Distinctness: riftwall/glacierwall are SOLID banded walls; the arcade is defined by holes.
   Role: nested-threshold × perspective; its low flat run underlines the reserved horizon band.
3. **`rootbastion` — THE MID MASS.** Slumped masonry chunk gripped by 2–3 arching root ribs + one
   broad wind-sheared canopy pad (parasol, not broccoli: 2 flat overlapping pads flagged down-lane).
   ~1.5–2:1 wide. Glow: none; accent is LIFE (olive canopy + jade tide band). ~140 tris. Step 43.
   Clearance MID (floor ~15.5). Distinctness: organic-over-masonry composite exists nowhere else.
4. **`lilyraft` — THE LOW REST / COMMONS.** Flat discs with upturned rims rafted in clusters + reed
   spears (~8:1 wide, h≤1.2). ~60 tris. Step 19 (~96/band). Clearance LOW hugger (floor 14.5, top
   ≤1.5). Distinctness: living green discs — no ice floe is a lily; also the scale cue (2m pad beside
   a 40m dome). Role: foreground rhythm — green ellipses cutting the gold reflection lane.
5. **`wrackstone` — THE BARE FOIL.** Orderly-broken rubble: recognizably DRESSED stones (boxes +
   short cylinders) slumped, one capital proud (~1.5–2:1). Glow: NONE (non-negotiable — the silence
   that makes gilt earned). ~120 tris. Step 31. Distinctness: rectilinear masonry vs Caldera's
   `clinker` angular geologic jumble. Role: the rest note.
6. **`campanile` — THE RARE TALL PUNCTUATION.** Square tapering LEANING tower with an OPEN BELFRY
   (through-arches) crown + collapsed cloister skirt (base ≥50% of height — Matterhorn law). h~26–38.
   Glow: gilt inside the belfry reveals (the biome's one distant light — a lantern-window at dusk).
   ~130 tris. Step 149, **|x|≥60**, lean by segment offsets (never internal tilt), lean away/tilt≤1/h.
   Distinctness: aperture-crowned tower vs Frozen's ice horn / Caldera's skirted monolith (crown = a
   HOLE). Role: far counterweight; KNELLGRAVE's artifact (the toll has an address).
7. **`sentinel` — THE SUPER-RARE LANDMARK.** Half-drowned guardian statue HEAD (variant: a hand)
   rising from the mirror, features worn to suggestion (flat planes; eroded so it reads as stone, not
   creature). w~10–16, h~8–14. Glow: none (rim-light + reflection). ~140 tris. Step 211, |x|≥40.
   Distinctness: figurative masonry exists in no other biome. **Gated hardest** — if it reads as a
   creature/toy at Stage-2, fallback to the HAND variant only, or drop to 6 archetypes.

## 5. HAZARDS

### 5a. Three in-lane skins — `SKIN_BUILDERS[0]` (colliders byte-identical; fiction only)

Zero Frozen (calved bar / serac spur / berg shard) and zero Caldera (colonnade / spatter chimney /
breadcrust bomb) vocabulary. All: unit-space, own coverage exports + `hazardskin.mjs` entries,
silhouette contains the collider everywhere, magenta telegraph, `bakeTideLadder`, BLIND niches only.

1. **BAR → THE DROWNED FOOTBRIDGE.** A collapsed stone footbridge between two broken stub piers: a
   sagging segmented deck of dressed slabs (mixed lengths, zig-zag height junctions = silhouette
   events ABOVE the collider band, never a gap in the mass), jade tide stain at its waterline shadow,
   one slab kicked proud. Glow: shallow gilt COFFERS in the UNDERSIDE soffit (visible on the dive-under
   — the dodge view is the reward view). No spin.
2. **PILLAR → THE DROWNED PIER.** A slumped temple pier: 3–4 offset-stacked square courses (each a
   different ry), fig-root ribs on one face, a broken capital crown (tilt by offset), wrack skirt at
   the foot (own uniform (r,r,r) child). Tide band; ONE shallow blind gilt niche in the top course
   (lintel brow above). Distinctness: coursed rectilinear masonry vs blobby chimney vs faceted spur.
3. **SHARD → THE SEVERED BELL.** A verdigris temple bell torn from its tower, tumbling: bell body +
   crown loop + snapped yoke beam, ≤1.25:1 bounds. Ladder on a FIXED per-chunk weathering axis (the
   Caldera-shard lesson): patina rind / bright-bronze scrape / dark mouth — gilt LIP recessed just
   inside the mouth (blind by depth). **Dynamic variant: split the MATERIAL** — the mouth/lip pulses
   toward magenta: "same bell — it's tolling." ⚠ `hazardMesh` shard branch: add `bi===0 →
   lagoonBronze / bellTollHot` or the bell ships in Frozen ice.

### 5b. Native biome-hazard — THE SINKING GATES (`hazard:{ type:'gate' }`)

The canonical "descending arch-gates / thread-the-arch," realized. Free-standing drowned arch frames
astride the lane at timed sites (every [160,300]m, the proven `overlayBiomeHazards` pattern: own
XOR'd mulberry32 stream, own output array, consumption below the inBoss/grace returns, cursor reset in
`resume()`, gold-determinism byte-identical). Loop (game-time, phase-offset per site): RISEN (safe —
opening high, gilt reveal lit) → WARN 1.4s (a muffled TOLL + keystone blooms magenta-cored, readable
≥90m) → DESCENT ~2.0s (the arch sinks smoothly; jambs + lintel are the lethal collider sweeping down;
safe move = thread the opening or clear laterally) → SUBMERGED (ripples) → rise. Dodge-only, zero
knockback, suppressed in-boss + grace, off tight ring lines. Colliders: two vertical jamb + one
horizontal lintel, all on one y(t). Glow: gilt inner reveal at rest; telegraph/descent role-locked
magenta. It rehearses HOLLOWGATE (a door that moves, threaded on a rhythm) as the geyser rehearses
ASHTALON, sharing zero vocabulary with geyser (rising column) or icicle-fall (a THRESHOLD that moves,
not a projectile). **Fallback** if moving-collider fairness proves ugly: the gate doesn't sink — WARN
ends in a brief intrados stone-shed within the frame footprint (static colliders, timed lethality).
Build the descent first; it's the premium version.

## 6. ATMOSPHERE / AMBIENT

- **Sky:** shipped dusk-teal→gold kept + refined (§3 hexes); clouds kept. No new sky miracle — the
  aperture god-rays are this biome's miracle (free). Restraint budgets attention for props + water.
- **Water:** the jade mirror, waveAmp 0.42; the specular lane is the composition's spine (≥45% open).
  FOAM_CFG collars tuned to a pale TIDE RING, not surf; `arcade` far instances `foam:false`.
- **Fog:** warm-teal near → rose-apricot far; heightK 0.03 evening mist.
- **Particles — PETAL WIND** (the Tsushima signature): blossom-gold petals `0xffcf9a`, fall 0.5, sway
  3.0 (strongest lateral drift in the cycle), size 0.32, opacity 0.7. Nothing rises (Caldera), nothing
  hangs still (Frozen) — everything DRIFTS ACROSS.
- **Fauna — EGRETS:** flock {color `0xf6ead8`, scale 1.25, flap 0.55}: slow white waders skimming the
  mirror down-lane; retool the biome-0 `faunaFlyby` gull into an egret PAIR (the NatGeo frame;
  HOLLOWGATE's pale "children" over dark water).
- **Audio (later, flagged):** choir pad stays; lagoon bed = water-lap + evensong insects + rare
  KNELLGRAVE toll, ~-18 LUFS under the radio.

## 7. ANTI-REPLICATION SELF-AUDIT (checklist run)

- ☑ Silhouette: pierced dome / arch-punched arcade / fig-clasped bastion / lily discs / dressed-stone
  rubble / aperture-crowned tower / worn colossal head — none maps to Frozen's or Caldera's families.
  Danger-adjacencies killed: no stepped-shelf archetype (ghats rejected; lily rafts take LOW REST);
  `wrackstone` rectilinear vs `clinker` angular; no paired lane-framing gate prop (arch lives off-lane
  / band-edge / as a telegraphed HAZARD).
- ☑ Glow address: gilt inside apertures (through-holes on props, blind niches on hazards) — third
  address, the one BIOME-DESIGN reserved for Sanctuary.
- ☑ Ladder axis: position-keyed tide history (bleached / jade band / drowned) — the only horizontal
  BAND ladder, only one whose middle stop is the saturated hero. Light comes from THROUGH.
- ☑ Hazard vocabulary: footbridge / pier / bell / sinking gates — zero shared words; things SINK,
  TOLL, and are THREADED (nothing calves/erupts/scours).
- ☑ Theology side-by-side: §1 — different subject/source/verb.
- ☑ Blind screenshot: jade-green life + banded warm masonry + apertures over gold mirror vs Frozen
  blue-white vs Caldera black-over-red vs Aurora night. Named residual risk: three biomes stage a low
  gold sun — kill: Lagoon is the ONLY green/vegetated biome; far fog rose-apricot (humid) vs molten
  gold; jade water vs blue vs blood-red; holed silhouettes. If a capture could pass for Frozen's
  horizon, **deepen the jade, never the gold.**
- ☑ Mechanical grep: every ladder bake is `bakeTideLadder` w/ explicit stops; zero
  `_FROST/_MIDICE/_BELLY/_WALL_LADDER/mats.frostIce/mats.moverIce/glacierWallMat/crevasseCore` or
  hexes `0xbfdce6/0x3fc8e8/0x357088/0xcfe4f0/0xd8f6ff`; `hazardMesh` shard branch gets `bi===0`
  route; `instanceColor` biome-0 rows stay identity white `0xffffff`.
- ☑ Forward distinctness (Tidal Reef, biome 8): the Lagoon is SHELTERED/warm/architectural; the Reef
  will be open/breathing/wild. Sinking Gates are masonry, not water.

## 8. PRE-ASSESSMENT + BUILD ORDER

**Risks (ranked):** 1. Sunset déjà vu — carry the frame with the midground (jade water, tide bands,
apertures, green life); if PR-1 atmosphere alone doesn't read as a NEW biome blind vs bctx-0/bctx-2,
push the jade before props. 2. Vegetation at ≤150 flat tris = broccoli — canopies are 2–3 broad
wind-sheared overlapping pads (olive-gold), never spheres; gate `rootbastion` canopy specifically.
3. `sentinel` reading toy/creature — gated hardest, fallbacks named. 4. Moving-collider fairness on
the Sinking Gates — telegraph ≥90m, phase-offset, reachability audited; fallback named. 5.
Perf/determinism — everything opaque, god-rays are the existing pass, petals/egrets the existing
systems, hazards the proven overlay; the consolidation is render-only. 6. The consolidation flip
(`CYCLE` drops index 1 → `[0,2,3,4,6,5]`; BIOMES[1] stays appended, archetypes park) loses the
cycle's designated brightest sky — verify HUD skyLuma/keyShift + music arc; Sanctuary→Frozen become
adjacent (two sunsets, owner judges the seam); `bulletcontrast` re-runs; do the flip LAST after the
owner signs the hero.

**Build order (coexist → prove on the hero → migrate), one PR each:**
- **PR-1 — Atmosphere + materials substrate:** water/fog/sky/hemiGround retune, petals, egrets,
  `bakeTideLadder` + `lagoonStone`/`gilt` materials. Transforms 100% of pixels; blind-test vs old.
- **PR-2 — THE HERO `rotunda` + composition system** (arrival park, alternating flanks, density
  rhythm, horizon easement) behind `?props=v1`. Proves the three riskiest ideas at once (tide ladder
  on a colossal mass, aperture theology + god-rays + sun-through-window, mirror doubling). Studio
  contact sheet floor 4.2/5, then re-scored in-context + the FRAME per §2 targets.
- **PR-3 — the roster:** lilyraft + wrackstone → rootbastion → arcade → campanile → sentinel.
  envcount + propclearance (widened) + NaN place() scan per PR.
- **PR-4 — in-lane skins** trio + `hazardMesh` bi===0 seam + coverage exports + hazardskin entries;
  scored in the sun corridor (worst light).
- **PR-5 — the Sinking Gates** hazard (level.js overlay + hazards.js runtime + resume() cursor).
- **PR-6 — the consolidation flip + cohesion pass** (retire Wastes from CYCLE, park legacy archetypes,
  final montage, Gate-2 on the compound).
Every PR: full headless suite, gold-determinism byte-identical, bulletcontrast, SW re-stamp before
fly-test, biome-pinned preview (`?biome=0&debug`) with a what-to-look-at list, one ledger lesson.
Fable pre-assesses + checkpoints each element at the 4.2/5 floor in the shipping light; the owner
outranks every gate.
