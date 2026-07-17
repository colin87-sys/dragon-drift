# WALL-PROPS-REDESIGN.md — side-wall props + the Phase Gate ("crystal wall")

**Audience: any session about to touch a side-wall prop archetype (`js/environment.js
ARCHETYPES`) or the Phase Gate veil (`js/obstacles.js buildGate` layer 3). Read THIS
first.** This is the build-ready synthesis of the two Fable art-director visions
(side props + Phase Gate), the codebase research, and the game-reference brief —
written so an implementer can open §4/§5 and start the Frozen PR without re-deriving
anything.

- **The two targets** (owner's words: "still basic while the rest went premium"):
  1. **Side-wall props** — the per-biome decorative lane geometry (biomes 0–5; biome 6
     Aurora was already rebuilt to the bar and is the in-repo proof of method).
  2. **The "crystal wall" = the PHASE GATE** — specifically **layer 3, the veil
     membrane** (four flat box panels) and the **phase-through moment**. NOT the Frozen
     spires (those are a §4 target), and NOT the aperture frame (layer 2 is solved —
     the Skyforged `buildGateFrame`).
- **This doc IS the fleshing-out of `BIOME-DESIGN.md` §7 increment 7** ("Migrate the
  visual kit biome-by-biome") — it obeys the §3 Biome Laws, follows §7's increment
  style, and every PR here passes the **Fable Quality-Gate** protocol in
  `GRAPHICS-OVERHAUL.md` (Gate 1 pre-build, Gate 2 pre-merge, score ≥ 8 to ship).
- Per THE RULE: each shipped increment adds a **new lesson file** in
  `leapfrog/lessons/` and ticks its row in the §6 table.
- Line numbers cited were verified 2026-07-14; if they drift, search the identifier.

---

## §1 The diagnosis (why these two read basic)

Verified in code:

- **Frozen Reach's "crystal wall" props are one cone each.** `crystal` and
  `crystalSmall` are literally a single `THREE.ConeGeometry(1,1,5)`
  (`environment.js:250-266`) — the most basic objects in the game, and the owner's
  most-hated. Astral's `arcshard` is also one cone (`:327-332`); Wastes' `obelisk` is
  two parts (`:229-236`). Sanctuary/Wastes still share `column`/`slab`/`dome`
  (`biomes:[0,1]`) — near-duplicate skylines held together by the `instanceColor`
  tint fix.
- **The Phase Gate veil is four flat `BoxGeometry(w,h,1.2)` panels**
  (`obstacles.js:363-372`) under a single smooth fresnel (`makeVeilMat`, `:60-96`):
  one gradient, no facet structure, no depth, no per-biome material story, and no
  premium payoff for the game's signature roll-phase move. Meanwhile layer 2 (the
  aperture frame) got the Skyforged forged-glass treatment (`buildGateFrame`, `:202`)
  — the wall now reads cheaper than its own window frame.
- **The bar is already in the repo.** Aurora's `floe`/`iceFang`/`berg`/`skerry`/`ridge`
  (`environment.js:339-407`, ~112/102/72/40/52 tris) prove the method: cluster-with-a-
  story silhouettes, three shape families + a bare foil + a distant massif, coprime
  steps, geometric de-lamping. The Skyforged frame proves the same for the gate. The
  poverty everywhere else is **geometry, not palette** — with two exceptions (§4)
  where the palette is also wrong (Frozen toy-blue, Sanctuary minty-bright).

---

## §2 The design laws (the contract every PR here signs)

These extend — never contradict — `BIOME-DESIGN.md` §3. Cross-references in brackets.

### The six side-prop working laws

1. **Cheap is geometry, not palette.** Every archetype is a CLUSTER WITH A STORY
   (5–8 parts, 40–130 tris — free at our scale [BIOME-DESIGN §2 budget truth]).
   No single cones, no bare boxes at the waterline.
2. **Character lives in the plan outline, silhouette, and top-edge steps.** The
   nonuniform `(r,h,r)` instance scale shears internal rotations flat — build leans
   and curves by OFFSETTING STACKED SEGMENTS, never by rotating. Small `rz` on
   sub-parts for jaggedness is fine; no load-bearing character on a rotation.
3. **Rotation-robust or wrong.** `rotY` is re-randomized on every recycle
   (`environment.js:665`) — spread features radially in x AND z.
4. **Three shape families + a bare FOIL + (usually) a distant MASSIF.** The foil
   never glows — it earns the glow for everything else. [Serves BIOME-DESIGN Law 2
   screenshot-readability and Law 3 exclusive-silhouette.]
5. **De-lamp everything.** Emissive lives IN the relief — flush inlays, sunken
   throats, buried slivers, glow through gaps. Small emissive area; scarcity = luxury.
   Never a glowing volume hovering off a surface (the LED-strip poverty tell).
6. **Two material groups hard cap** (`mergeParts` throws on `mat >= 2`). Primary =
   mass; accent = spent like money. The "third color" comes free from the prop-detail
   weathering noise + baked AO + `instanceColor` + fog.

Plus the standing mechanics: normalization (base y=0, top≈1, footprint ±0.6), a
`FOAM_CFG` entry per archetype (`foam:false` for distant/weightless), and
`.toNonIndexed()` wherever an ico meets a box/cone (§3).

### The three iron rules for the Phase Gate

A. **Legibility is sacred.** The veil stays MOST transparent head-on (fresnel), alpha
   hard-capped ≤ 0.30 (the clamp at `obstacles.js:86` survives every change), the
   aperture stays the clearest "fly here" cue, hierarchy frame > veil > beacon >
   motes. Any premium term that fights the affordance is wrong. [BIOME-DESIGN Law 6
   adjacent: the route read always wins.]
B. **Never a stacked transparent/additive shell.** Overdraw is THE cliff
   [BIOME-DESIGN §2/§8]; the veil is the most overdraw-sensitive surface in the game.
   Richness comes from the shader on the SAME projected surface, from geometry
   (facets add zero fill), or from opaque `LineSegments` (cliff-exempt).
C. **Presentation-only, tier-degradable, determinism-safe.** Never touch a placement
   field (`o.gapX/gapY/gapW/gapH`) or `level.js`; `tests/gold-determinism.mjs` stays
   byte-identical [BIOME-DESIGN Law 7]; every enrichment sits behind one flag in
   `main.js applyQuality` with the lowest tier falling back to today's flat fresnel
   [Law 10]; coexistence flag = byte-identical when off [Law 9].

### Cross-biome coherence (one world, six dialects)

- **One formal grammar:** irregular-polygon cylinders, offset-stacked segments for
  leans/curves, kinked frustum+tip for spikes, detail-0 icosahedra for rubble.
- **Universal fracture story** — each biome conjugates "the world is old" in its own
  physics: Sanctuary collapse · Wastes burial · Frozen breakage · Caldera shearing ·
  Mire drooping · Astral levitation.
- **Glow has a fixed ADDRESS per biome:** Sanctuary through apertures · Wastes NONE ·
  Frozen in clefts · Caldera low in cracks/throats · Mire high under brims · Astral
  inside the wound. Twin pairs oppose on this axis too [extends BIOME-DESIGN Law 4].
- **Waterline honest:** foam collars on standing props; `foam:false` on distant
  massifs and hovering masses.
- **The dragon pops in all six** [BIOME-DESIGN Law 8]: no accent in the
  danger-magenta band or near hero hues; the brightest prop element stays below
  gameplay brightness. Every palette touch re-runs `tests/bulletcontrast.mjs`.

---

## §3 The engine substrate (build against this — a checklist)

Every builder verifies their recipe against each line before writing code.

**Prop recycler (`js/environment.js`):**
- [ ] `ARCHETYPES[key] = {step, biomes:[i], matIndex, build(), place()}` (`:185`);
      one `InstancedMesh` per archetype; `WALL_WINDOW = 900` (`:75`).
- [ ] `mergeParts(parts, biomeIdx)` (`:170`) merges to **at most 2 material groups**;
      a part with `mat >= 2` throws at build time. Materials come from
      `makeMats()` `primary[i]`/`accent[i]` (`:129-155`) — retints for biomes 0–5
      edit those indices in place; genuinely new material slots append at 7+.
- [ ] **Nonuniform instance scale `(r,h,r)`** (`writeMatrix`, `:630`) shears internal
      tilts flat → laws 2/3 above. Character = silhouette + offset stacking.
- [ ] **`rotY` re-randomizes on recycle** (`recycleBand`, `:665`) and on reseed
      (`:688`) — radial robustness is mandatory.
- [ ] **Indexed/non-indexed mixes throw in `mergeGeometries`** — `.toNonIndexed()`
      the odd part (see `berg`, `:378`). A build() throw takes down
      `createEnvironment` for EVERY biome — a boot-time crash, caught only by a
      headless boot (envcount builds every archetype — §7).
- [ ] **Overdraw is the only perf cliff.** Opaque props are fairness-POSITIVE (they
      subtract from bloom area). Draws/tris effectively free at our scale;
      `LineSegments` cliff-exempt. Never add a large additive shell to a prop.
- [ ] **The band visible-gate** (`updateBandVisibility`, `:651`): `WALL_WINDOW`
      (900) < `biomeLength` (1500) → at most 2 biomes in-window → per-frame prop cost
      collapses to the live biomes' archetypes. **Exclusive silhouettes are ~free**;
      retired archetypes parked at zero scale cost ~nothing until the cleanup PR
      deletes them.
- [ ] **`instanceColor` MULTIPLIES base color** (`BIOME_TINTS`, `:611`): entries are
      ratios; biome-0 = identity white. Only archetypes with `biomes.length > 1`
      allocate it (`:641`) — pruning the shared trio to one biome each removes the
      need entirely (note this in the cleanup PR).
- [ ] **Props are render-only** — no RNG stream, no fixture, ZERO determinism
      concern. New archetypes are pure-additive. (The Phase Gate is the opposite:
      it lives in `obstacles.js` next to fixtured placement data — iron rule C.)
- [ ] The **prop-detail shader already gives weathering + AO**: value-noise ×
      `aoBake`, floored at 0.62 (`addPropDetail`, `:95-126`; the AO-floor fix at
      `:113-119` — bone/ice undersides inherit it). Emissive also gets noise
      (`:120-121`). Don't rebuild what's free.
- [ ] **`FOAM_CFG`** (`:415`): add an entry per new archetype ({r} round, {rx,rz}
      elliptical for thin footprints, `false` for massifs).
- [ ] Whitelists live in `biomes.js` `props:[...]` per biome (`:56,76,96,124,140,157`)
      — but note the ACTIVE gate is the archetype's own `biomes:[i]` array in
      `environment.js` (the `biomes.js props` field is descriptive today; keep both
      in sync in every PR so neither goes stale).

**Phase Gate (`js/obstacles.js`):**
- [ ] `PHASE_SKINS` (`:46-54`): `{veil, edge, core, mote, rise}` × 7 biomes.
- [ ] `makeVeilMat(color, edge)` (`:60-96`): the fresnel ShaderMaterial —
      `pow(1-dot(N,V),3)`, sine band shimmer, **alpha clamp 0.30 at `:86`**,
      NormalBlending, `depthWrite:false`, FrontSide. `veilMats[bi]` are **shared per
      biome** (`:164`) — the impulse seam (§5) needs per-gate materials.
- [ ] `buildGate(o)` (`:343-462`): layer 1 rim bars (`:383-386`), layer 2 Skyforged
      frame (`:392`, `buildGateFrame :202`, `gateFrameMats :187`) + corner brackets
      (`:399-410`), **layer 3 veil panels (`:363-372`) — THE target**, layer 4
      per-instance core/beacon/motes (`:414-458`, `userData.perInstance = true` so
      `removeAt` disposes them — the established per-gate-material pattern).
- [ ] **r160 gotcha:** never `.clone()` a ShaderMaterial here (Material.copy
      JSON-kills uniform refs — the `gateFrameMats` comment at `:178-181`). "Per-gate
      clone" means a **fresh factory call** with shared `{value}` ref objects for
      global uniforms (the `markerTime` pattern, `:36`) so one write/frame still
      drives all instances and the identical source shares one compiled program.
- [ ] Veil `uTime` is driven at `:914` (`for (const m of veilMats) ...`) — per-gate
      materials must ride a shared time ref instead, or be registered for update.
- [ ] Phase/crash seams (`js/collision.js`): perfect = `rollInvuln >=
      CONFIG.phasePerfectWindow` (`:277`); `phaseBurst(player.position, perfect)`
      (`:294` — the existing tiered shards/shockwaves, `particles.js:333`);
      `juiceEvent('phasePerfect')` (`:296`, config at `config.js:573`); the crash
      path enters near `:326`. The impulse hooks in HERE, render-side only.
- [ ] Tier switch: `main.js applyQuality` — every enrichment behind one flag there.

---

## §4 Per-biome side-prop build sheets (biomes 0–5)

Format per biome: identity line → signature/opposition → archetype table → palette &
materials → glow address → premium moment → whitelist changes. Steps are coprime-ish
across each biome (the anti-tiling lever, doubled by the L/R mirror). Tri counts are
targets, not caps — stay in the 40–130 band. All recipes obey §2/§3.

### 4.0 SANCTUARY (biome 0) — "A cathedral the sea half-won, at the hour the light forgives it."

**Signature:** broken masonry verticals WITH HOLES — pierced silhouettes; negative
space is the identity. **Opposes Wastes** (Law 4 axis): vertical/wet/built-then-broken
vs horizontal/dry/never-built.

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `campanile` | tall hero | 43 | ~110 | drowned bell tower: 3 offset-stacked drums (irregular 7-gon cylinders, each shifted off-axis) + a broken gap-toothed crown ring + a half-slipped bronze dome + one recessed lancet window | bronze dome + window reveal (mat 1) |
| `archfall` | mid hero | 71 | ~90 | double-arch nave fragment: one intact pointed arch (two legs + torus-arc) + a springer stub + a fallen voussoir at the base — the APERTURE is the point | thin capstone (mat 1) |
| `colonnade` | mid cluster | 27 | ~85 | 3 graduated column stumps in an arc + one architrave lintel bridging two + a fallen drum lying in front | lintel edge (mat 1) |
| `reliquary` | low FOIL | 13 | ~45 | rafted stone plinths (2 offset low cylinders) + one tilted slab — **NO glow, no accent** | none |
| `basilica` | distant massif | 89 | ~70 | half-sunk dome + broken nave ridge + a campanile stub; `foam:false`, place `x: side*(26+r*0.5+rnd()*14)`, big r / small h — retires old `dome` | dome sliver (mat 1) |

**Palette/materials:** wet grey-teal / verdigris / dusk gold / teal-indigo fog.
Retint `makeMats().primary[0]` **0x86b39c → ~0x5e8577** (darker + wetter), lower its
emissive (`0x0e2018 @0.25` → ~half). Accent[0] bronze `0xc08a50` stays. This is a
**LOW-GLOW biome** — the light is the SKY seen through apertures + the warm sun rim
on broken tops. Add `fogFarColor` → teal-indigo (suggest ~0x152242; tune on preview).

**Glow address:** through apertures — never on faces.

**Premium moment — THE ROSE GAP:** the archfall aperture frames the gold horizon band
inside dark stone at some yaws. Screenshot bait; costs nothing.

**Whitelist changes:** biome 0 becomes
`['campanile','archfall','colonnade','reliquary','basilica']`. `tower`, `archruin`,
`column`, `slab`, `dome` leave biome 0 (stay registered/parked until the §6 cleanup
PR). Masonry custody transfers to Wastes' `swallowed` (the desert eating this
civilization — the one sanctioned cross-biome rhyme).

### 4.1 AMBER WASTES (biome 1) — "Stone the wind has been sanding since before anyone was here to name it."

**Signature:** horizontal stratified TABLES + leaning half-buried keels — flat tops,
strata steps, no right angle, no aperture. **The NO-GLOW POLE of the game**: premium
from form + strata + shadow only. Opposes Sanctuary (vertical/wet/broken).

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `keelback` | tall hero | 31 | ~100 | leaning monolith: 4 offset-stacked drums tracing the lean + flared sand-ramp base + a wind-undercut NARROW bottom drum + a fallen capstone; strata = top-edge steps | dark sienna sediment band, INSET (mat 1) |
| `mesa` | mid hero | 23 | ~90 | flat-topped table: 3 shrinking offset cylinders + an overhanging summit slab + talus icosahedra at the base | none/minimal |
| `swallowed` | mid (lore) | 67 | ~70 | dune mound (squashed ico) + a protruding broken masonry drum + a dome sliver — Sanctuary's civilization, eaten | masonry drum (mat 1, dull) |
| `panshard` | low FOIL | 14 | ~40 | sun-cracked clay pans: 2 low offset pans + one raised curled edge — **NO accent** | none |
| `tablelands` | distant massif | 97 | ~55 | ruler-flat table mountain, one long slab-topped mass; `foam:false`, far off-lane | none |

**Palette/materials:** bleached bone-amber / burnt-sienna strata / white-gold sky /
violet-blue shadow. Primary[1] `0xe2bd8a` is right — keep. **Accent[1] 0xb56a40 →
~0x8a5a38, emissive → ~0** (darker, duller — sediment, not trim). "Glow" = noon sun:
`sunI 2.0` stays highest in the cycle for hard thin top-rims; hemisphere gives the
only cool. Add `fogFarColor` → bleached white **~0xf6e4c8** so masses DISSOLVE into
mirage (the inverse of the night biomes' sink-to-black).

**Glow address:** NONE. The whole game's emissive discipline is priced off this biome.

**Premium moment — THE FALLEN TWIN:** the keelback's lean + its full collapsed twin
sinking in the same sand skirt; one long conjoined noon shadow.

**Whitelist changes:** biome 1 becomes
`['keelback','mesa','swallowed','panshard','tablelands']`. **Prune `column`/`slab`/
`dome` from biome 1** — this kills the shared-prop/verdigris duplicate by removal
(and with `obelisk` retired, no multi-biome archetypes remain → `BIOME_TINTS`
becomes vestigial; remove it in the cleanup PR).

### 4.2 FROZEN REACH (biome 2) — "The ribs of something enormous, not quite done being buried."

**THE PROVING HERO — build first (§6).** The crystal-spire wall, executed properly.

**Signature:** clustered blades + vertebral stacks; the props ARE a half-buried
skeleton, bone-white — the MARROWCOIL foreshadow made literal (`BIOME-DESIGN §4`:
spires read as half-buried ribs). **Opposes Astral** (Law 4): hard/near/dense/rooted
vs soft/vast/sparse/floating.

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `ribspire` | tall hero | 17 | ~115 | replaces `crystal`: one dominant KINKED blade (frustum + off-axis tip) + 2 graduated children on a shared base pan + a snapped stub with its fallen tip lying beside it; ONE cyan sliver buried in the cleft between blades; h 16–40, capped under the fog line | buried sliver (mat 1) |
| `vertebrae` | mid hero, EXCLUSIVE | 29 | ~95 | a spine: 6 stacked lens-discs (squashed cylinders) with pinched waists, centers OFFSET to trace a bowed curve — the offset-curve survives the `(r,h,r)` shear | none |
| `penitentes` | mid-low cluster | 11 | ~85 | a bed of 7 small kinked blades on a shared pan, graduated heights, ONE core-lit | one lit core (mat 1) |
| `serac` | low FOIL | 13 | ~50 | tented pressure-ridge plates (2 leaning slabs meeting at a serrated top edge) — **NO glow**, deep glacial blue-grey via the primary going dark at low AO | none |
| `glacierfront` | distant massif | 83 | ~65 | a bergschrund cliff — long low mass + calved steps — whose base sits at the fog-band altitude so it FLOATS on the fog line; `foam:false` | none |

**Palette/materials — the critical retint:** bone-ivory / glacial blue-grey / cold
cyan / warm peach sun-rim. **Retint `primary[2]` from toy-blue `0x6fb7e8` →
bone ~0xd8d2c2**, near-zero emissive (kill `0x123a55 @0.25`), KEEP the low roughness
(0.32) for facet glints. Accent[2] cyan `0x9fd8f0` stays but is **RATIONED to exactly
3 slivers per screen-ish** — all in clefts, never on faces. The luxury duel: warm
peach sun-rim vs cyan shadow on white geometry. The AO floor (`environment.js:113-119`)
already protects bone undersides.

**Glow address:** in clefts only.

**Premium moment — THE WITHHELD COLD:** warm-rimmed bone from most angles; a cyan
core flashes through a ribspire cleft for half a second as you pass. A rare doubled
`vertebrae` (two spines mirrored across the lane) = a ribcage gate.

**Whitelist changes:** biome 2 becomes
`['ribspire','vertebrae','penitentes','serac','glacierfront']`. **DELETE `crystal` +
`crystalSmall`** (cleanup PR). Re-run `bulletcontrast` — this is a big palette touch.

### 4.3 EMBERFALL CALDERA (biome 3) — "Black organ-pipes over a fire the stone is barely holding shut."

**The hero biome** (anchor + hazard shipped). **Signature:** packed hexagonal columnar
clusters with stepped crowns — Giant's Causeway at cathedral scale, vertical thrust.
**Opposes Mire** (Law 4): vertical/hot/rising with glow LOW vs lateral/cool/hanging
with glow HIGH.

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `colonnata` | tall hero | 19 | ~120 | replaces `basalt`: 5–6 PACKED hex prisms (6-gon cylinders, tight shared footprint), tops breaking at different heights = a stepped hex crown; one SHEARED column lies against the flank; a magma plate sits FLUSH in a low seam | flush magma plate (mat 1) |
| `riftfang` | tall-mid | 37 | ~90 | a basalt spire SPLIT vertically: 2 half-masses with a narrow gap between, a thin magma blade standing INSIDE the gap — visible only near alignment | interior blade (mat 1) |
| `fumarole` | mid-low | 23 | ~80 | replaces `vent`: stacked crusted rings (3 offset squat cylinders) + a SUNKEN THROAT — the glow disc sits BELOW the rim, seen only from above/near; rhymes with the geyser hazard's shape, never magenta; place `|x| ≥ 13.5` (off the lethal vent lane) | throat disc (mat 1) |
| `clinker` | low FOIL | 11 | ~45 | matte-black aa-lava: 2–3 half-sunk detail-0 icosahedra — **NO glow**; `.toNonIndexed()` discipline biome-wide (icos everywhere) | none |
| `riftwall` | distant massif | 73 | ~60 | serrated caldera-rim wall with ONE thin ember hairline seam high on its face — the single allowed distant emissive; `foam:false` | hairline seam (mat 1) |

**Palette/materials:** charcoal basalt / ember orange / blood-red fog / near-black
far. **KEEP the materials** — `primary[3] 0x352629` + inner heat and
`accent[3] 0xff5a20 @0.9` are already the strongest legacy set; the poverty was pure
geometry. Discipline: accent area < 5% of any silhouette; the rising embers + the
ASHTALON ember-wake carry motion-glow so the props themselves stay dark.
`fogFarColor 0x1c0a08` already shipped (BIOME-DESIGN inc 2).

**Glow address:** low — in cracks and throats, never at tips.

**Premium moment — THE SECRET FIRE:** riftfang's vertical gap sweeps through
alignment on parallax as you fly; the interior magma blade strobes once. Kinetic,
zero overdraw, pure geometry.

**Whitelist changes:** biome 3 becomes
`['colonnata','riftfang','fumarole','clinker','riftwall']`; `basalt`/`vent` retire
(cleanup PR). Note `hazards.js` geysers spawn from level data, not from the `vent`
archetype — retiring the prop does not touch the hazard (verify D anyway).

### 4.4 LUMEN MIRE (biome 4) — "A night garden holding its lanterns out over the water."

**Signature:** overhanging shelf-canopies on thin stems + arched weepers trailing
drops — everything reaches sideways or hangs. **Opposes Caldera:** lateral/cool/
hanging, glow HIGH under the canopy. (This is BIOME-DESIGN §4's "Mire canopy pass".)

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `canopytitan` | tall hero | 31 | ~110 | a pagoda of asymmetric shelf caps (3 squashed half-spheres/discs at staggered azimuths + radii) on a bowed dark stem (offset-stacked segments); a thin accent GILL-RING recessed UNDER each cap rim, facing DOWN | under-cap gill rings (mat 1) |
| `bracketspire` | mid | 17 | ~85 | a dead trunk-spire with half-disc bracket fungi at staggered azimuths/heights (radially spread — rotation-robust); only 2 of ~5 brackets rim-lit | 2 bracket rims (mat 1) |
| `weeper` | mid, HANGING EXCLUSIVE | 41 | ~80 | a stem bowed fully over — the offset candy-cane curve (segments offset progressively past vertical) — with 3 hanging seed-pod drops under the hook; the one shape in the game that DROOPS | seed pods (mat 1) |
| `hummock` | low FOIL | 12 | ~45 | dark peat icosahedra + 2 bare reed cones — **NO glow** | none |
| `canopyline` | distant massif | 79 | ~60 | a lumpy far treeline of overlapping cap-domes, ONE faint gill hairline; `foam:false` | one hairline (mat 1) |

**Palette/materials:** near-black moss / deep teal water / biolume cyan-teal /
star-blue sky. `primary[4] 0x1d4438` hue is right but **drop its emissive**
(`0x0a3328 @0.4` → ~0) — the mass goes BLACK. `accent[4] 0x4dffd0 @~1.0` = the
lantern — keep intensity, discipline is placement AREA (thin rings + pods only).
**NO magenta, NO second hue.** The fog `0x123a3a` is the bloom medium — keep pods
and rings small; let the fog halo them.

**Glow address:** high, under brims, facing down.

**Premium moment — THE LANTERN AND ITS DOUBLE:** the downward gill-rings + their
water reflection close into full ellipses of teal light in blackness. Light-lanes:
titans cluster (place() biases toward group distances) so under-glow chains along the
safe line — the Ori lineage from BIOME-DESIGN §4.

**Whitelist changes:** biome 4 becomes
`['canopytitan','bracketspire','weeper','hummock','canopyline']`; `glowcap`/
`glowcapSmall`/`spirevine` retire (cleanup PR).

### 4.5 ASTRAL SHALLOWS (biome 5) — "Stones that forgot which way down was."

**The finale — built LAST, with the most practiced hand.** **Signature:** thin stelae
broken by clean horizontal gaps; masses HOVERING above their stumps; slim shard
constellations. Identity = weightlessness + negative space. **Opposes Frozen:**
soft/vast/void vs hard/near/dense. The one exclusive trick: **the FLOATING BREAK** —
things fall UP, slowly, stopped mid-frame.

| Archetype | Role | Step | ~Tris | Build recipe | Accent |
|---|---|---|---|---|---|
| `calved` | tall hero | 47 | ~90 | replaces `monolith`: a thin stele whose top third HOVERS above a clean fracture gap, the upper mass laterally offset; starlit seams flush on the two FACING fracture faces inside the gap; keeps its foam collar — the stump is rooted | fracture faces (mat 1) |
| `constellation` | mid | 29 | ~85 | replaces `arcshard`: 5 slim blades spread radially (x AND z), 3 rooted + 2 DETACHED hovering above their own stubs; exactly ONE lit | one blade (mat 1) |
| `voidring` | mid hero, EXCLUSIVE | 61 | ~70 | a broken standing annulus — a two-thirds torus arc, base pinched to touch the water; a portal glyph rhyming with THE UNMASKED; `foam:false` | inner rim sliver (mat 1) |
| `slatereef` | low FOIL | 19 | ~45 | tilted offset slate plates fanned low — **NO glow**, dark indigo | none |
| — | **NO MASSIF, ON PURPOSE** | — | — | emptiness is Astral's massif: the starfield, sky-whale, and future lidded sun own the horizon. Do not "complete" the set. | — |

**Palette/materials:** deep indigo-violet slate / starlit periwinkle / violet fog /
star-white points. `primary[5] 0x3a3a6a` + `accent[5] 0x9fb8ff` are the right hues —
**sink the primary emissive** (`0x16164a @0.4` → ~0.1) so the slate goes DARK between
GLINTS (flat-shaded facets catching the pale sun read as glints, not glow). Smallest
emissive area of any night biome — the budget is spent on the starfield. Fog
`0x241a4a` swallows the bases; the floating gaps read against the water's star
reflections.

**Glow address:** inside the wound (the fracture gap) only.

**Premium moment — THE CALVED CROWN:** a black tower against the starfield, split by
a hovering void hairline with two faint lit fracture faces — a stone held
mid-ascension.

**Placement:** steps LONG (sparse = identity); x-offsets wider than every other biome
(`x: side*(26+…)`); let whole screens be void.

**Whitelist changes:** biome 5 becomes
`['calved','constellation','voidring','slatereef']`; `monolith`/`arcshard` retire
(cleanup PR).

---

## §5 The Phase Gate ("crystal wall") build sheet

### 5.1 The core concept (the name + the fiction)

**The Phase Gate is a standing wave in the skin of the world — air crystallized under
its own tension, frozen mid-shimmer into a lattice of light, held open around one
clear eye.** Not built, not grown — it PRECIPITATED (frost on a pane; a shockwave
frozen into a Mach diamond). The membrane is the world holding its breath; the window
is where the tension already gave way — the wall PARTED around it, its edges
stretched thin and trembling. This motivates the mechanic: a normal dragon shatters
against crystallized air, but during a Surge the dragon is briefly made of the same
light — a timed roll ENTERS PHASE and passes through as part of the wall. Phasing ≠
smashing a window; it's becoming the wall's substance (why it costs Surge, why
perfect > minor). Layer name: **the Phase Veil** inside **the Phase Gate**.

### 5.2 The veil — a membrane, not a slab

All richness lands on the SAME projected transparent surface plus one opaque line
layer. Zero new fill. Four techniques:

**A · Facet the panels (geometry — the biggest win, near-free).** Replace the four
flat `BoxGeometry` panels (`buildGate` `panel()`, `obstacles.js:363-372`) with
faceted crystalline planes: a coarse jittered triangulated lattice (~dozens of facets
per panel, ~40–60 tris each, ≈200 tris/gate), **non-indexed**, per-facet perturbed
normals — the Skyforged frame's own `facetHash`/`facetJ` + `computeVertexNormals()`
move (`buildGateFrame`, `:233-242`). The same fresnel now varies per facet → the
membrane breaks into hundreds of individually lit crystal cells instead of one smooth
gradient. **Same silhouette, same alpha cap, ZERO extra fill.** Head-on the facets
still mostly face you → low fresnel → legibility untouched; the richness lives at
grazing facets where the eye isn't reading route.

**B · Make the fresnel do more (shader terms in `makeVeilMat`, same surface):**
- **Per-facet crystal GLINTS** — a sharpened specular term (the frame's glint recipe)
  keyed off the per-facet normal: hard white sparkles that drift as you bank; ties
  veil to frame.
- **Edge CHROMATIC SPLIT** — evaluate the fresnel at 3 slightly different powers for
  R/G/B, offset a hair → a faint spectral fringe at the grazing silhouette only,
  never near the head-on center.
- **Interior PARALLAX depth** — offset a secondary lattice pattern sampled from
  `vPos` by a view-derived vector: a deeper second lattice appears BEHIND the surface
  facets and slides against them. One surface, two apparent depths — "seeing INTO
  crystallized air." A texcoord trick, never a second mesh.
- **MENISCUS toward the aperture** — bias alpha + edge-brightness UP approaching the
  gap boundary (cheap: the gap rect `o.gap*` is known — pass as uniforms). The
  membrane looks stretched thin and luminous at the opening ("about to tear"),
  REINFORCING the affordance. Stays under the 0.30 clamp.

**C · The LATTICE (opaque `LineSegments` — cliff-exempt; "crystalline" made
literal).** A network of emissive veins tracing the facet seams, radiating and
bending AROUND the aperture — concentric/tangent to the rounded-rect frame near the
gap (grain around a knot), relaxing to the general lattice away from it; denser +
brighter near the opening (tension), sparser + dimmer toward the outer silhouette
(calm). Opaque emissive lines bloom in postfx at NO fill cost — and they carry most
of the per-biome character (§5.4).

Net: **one transparent surface, unchanged in area + alpha, plus opaque lines.**
Nothing is spent on the overdraw cliff.

### 5.3 The window / aperture (the frame is done — relationship only)

The membrane PARTS AROUND the aperture, not perforated by it:
- Lattice veins near the gap run concentric + tangent to the Skyforged frame's
  rounded rect; the opening reads as where the wall's tension resolves — a held-open
  eye.
- The meniscus rings the opening: the brightest/thinnest/most active membrane in the
  ~1u band hugging the aperture — a surface-tension lip JUST OUTSIDE the frame's hot
  inner lip. Two concentric cues, one message; **the frame wins** (opaque emissive
  @1.8 vs meniscus capped 0.30).
- **The EYE STAYS EMPTY** — pure negative space between player and route. All premium
  happens in the RING around the void (iris/stargate). Negative-space-is-subject —
  the same law as the side props.

### 5.4 Per-biome membrane character — one grammar, seven crystallizations

Constant GRAMMAR (faceted crystalline veil + emissive lattice parting around a clear
eye); only the MEDIUM changes. Colors come from the existing `PHASE_SKINS`
(`obstacles.js:46-54`); the new expression is carried by lattice pattern
(LineSegments density/geometry), facet character, and parallax interior — all
per-biome data on the same shader.

| Biome | The medium, crystallized | Lattice | Facets/parallax |
|---|---|---|---|
| 0 Sanctuary | drowned ROSE-WINDOW (leaded stained glass) | radial rose-window tracery around the eye, verdigris-teal cames | dusk-gold bleed; motes settle |
| 1 Wastes | heat-shimmer SAND-GLASS (fulgurite) | sparse organic branching (lightning-fused sand), half-formed | mirage-shimmer parallax; amber near-clear facets — the brightest/most transparent veil (matches the no-glow palette) |
| 2 Frozen | **literal ICE LATTICE (hoarfrost) — the skin hero** | dense hexagonal-dendritic frost-fern, creeping INWARD, thickest at the meniscus | cold blue-white; sharp glassy facets + hard glints; motes settle like snow. The gate at its most "crystal wall" — earns the name |
| 3 Caldera | cracked-obsidian MAGMA PANE | cracked-magma web glowing ember-orange in the fractures (the colonnata grammar: fire in the cracks) | near-opaque-dark facets catching a hot rim; the lattice is the star, the veil the dark foil; sparks rise hard |
| 4 Mire | living SPORE-WEB | organic mycelial net (not angular), teal-green, softly pulsing — the weeper's growth logic | parallax drifts like suspended spores; the softest, breathing veil |
| 5 Astral | STARFIELD CAUGHT IN GLASS (finale showpiece) | thin gold-white constellation-lines bending around the eye; least dense | the parallax interior holds a literal starfield sliding behind the facets; motes hover; phasing = passing into deep space |
| 6 Aurora | frozen AURORA-CURTAIN | vertical curtain-fold draping veins echoing the aurora sky, frost-teal | parallax ripples like a slow aurora sheet behind the facets; motes settle |

### 5.5 The phase-through moment (the premium payoff)

**Phase and crash are OPPOSITES OF THE SAME SURFACE** — both a brief per-gate shader
impulse (transient `uPhase`/`uCrash` 1→0 over ~0.4s). A brief per-instance impulse is
affordable; a persistent shell is forbidden.

**The seam:** `veilMats[bi]` is shared per biome (`obstacles.js:164`) — a global
uniform would ripple EVERY gate on screen. The crossed gate must carry its own
impulse → **a per-gate veil material via a fresh `makeVeilMat(...)` factory call in
`buildGate`** (never `.clone()` — the r160 uniform-ref kill, §3), marked
`userData.perInstance = true` (the layer-4 core/beacon/mote precedent, `:418` — so
`removeAt` disposes it), with shared `{value}` refs for `uTime` and the global
uniforms (the `markerTime` pattern, `:36`) so identical source = one compiled
program and one write/frame. Isolates the impulse; adds no draw.

**PHASE (success) — iris ripple + resonance flash:**
1. `uPhase` drives a radial wave of fresnel + parallax distortion outward from the
   crossing point (pass the hit position as a uniform at trigger time), lattice lines
   bowing with the wavefront; the center CLARIFIES — alpha dips toward 0 along the
   wave. The wall becomes transparent TO YOU; it OPENS, it doesn't break.
2. The lattice flashes to white; the existing `phaseBurst` shards fire
   (`particles.js:333` — already tiered: twin shockwave rings + elongated shards for
   perfect, modest puff for minor).
3. **Perfect vs minor becomes VISIBLE** (config already pays it out —
   `collision.js:277-296`, `config.js:98-100,573`): perfect = symmetric full
   concentric iris-open + meniscus blooming all around + twin shockwaves + the
   magenta `phasePerfect` kick; minor = an asymmetric ragged ripple biased to the
   crossing point + the smaller puff. Same uniform, different amplitude/symmetry.

**CRASH (failure) — slam-solid, the inverse:** the membrane does NOT part — it
SEIZES. `uCrash` spikes fresnel to full + alpha momentarily toward opaque at the
impact point; the lattice snaps to a harsh over-bright flare; then the standard death
handoff (`collision.js` crash path, ~`:326`). Phase = the wall rippling OPEN (cool
transparent wave); crash = the wall slamming SHUT (opacity spike, hard flare).
Learned in one death + one Surge. The crash alpha spike is a single transient beat
with no route left to read → legibility-safe (the one sanctioned >0.30 transient).

**Cost:** no persistent shell ever; ripple + slam are uniform impulses on the one
veil already drawn; shards are the pre-existing tiered `phaseBurst`; the lattice
flare is opaque LineSegments. Peak cost = a fraction of a second on ONE gate.

### 5.6 Touched vs untouched + guards

- **Touched:** `obstacles.js` — `makeVeilMat` (all §5.2B terms + `uPhase`/`uCrash` +
  gap-rect uniforms), `buildGate` layer 3 (panels → faceted lattice geometry +
  LineSegments veins + per-gate veil material), `PHASE_SKINS` (add per-skin lattice/
  facet/parallax params), the `uTime` drive at `:914` (per-gate refs).
  `collision.js` — trigger the impulse at the phase (`:294-296`) and crash (`:326`)
  seams. `main.js applyQuality` — the tier off-switch. `config.js`/`particles.js` —
  read-only reuse.
- **Untouched:** `buildGateFrame` + `gateFrameMats` (layer 2 — solved), layer 1 rim
  bars + corner brackets, layer 4 core/beacon/motes (exists; do not proliferate),
  `level.js` and every placement field (iron rule C), collider logic.
- **Guards:** alpha clamp 0.30 survives every term (except the single crash
  transient); head-on transparency preserved (facet normals average toward +z);
  hierarchy frame > veil > beacon > motes re-checked at Gate 2 from `tools/
  gateshot.mjs` renders; one transparent surface per gate asserted by `envcount`
  (§7); lowest tier = today's flat fresnel with lattice/parallax/impulse disabled
  behind ONE flag; `gold-determinism.mjs` byte-identical on every gate PR.

---

## §6 The rollout — PR-sized increments

Two tracks. **Track A (props)** follows the art director's priority: **Frozen first**
(owner's most-hated AND the best proving ground: max delta per hour — one cone → an
ossuary; lowest method risk — Aurora's ice cousin; banks the MARROWCOIL foreshadow;
defines the Frozen⟂Astral axis first), then Caldera → Wastes → Sanctuary → Mire →
Astral last (the finale deserves the most practiced hand; the floating-gap is the
novel move). **Track B (Phase Gate)** is its own track in `obstacles.js` — it starts
after A1 merges (the Frozen taste bar is set and shared) and interleaves with A2+;
its hero skin is Frozen's hoarfrost (the literal crystal wall).

**Coexistence mechanics (all Track A PRs):** new archetypes register pure-additive
(inert until whitelisted — a registered-but-unlisted band parks every instance and
the visible-gate kills its draw, so both sets coexist ~free); the PR's visible change
is the whitelist flip (`ARCHETYPES[*].biomes` + the `biomes.js props` mirror), with a
`?props=v1` debug fallback (the `?skyforged=0` pattern) for A/B on the preview.
Retired archetypes are DELETED only in A8 after owner sign-off. Track B coexists
behind a `?veil2=0`-style flag + the applyQuality tier switch — byte-identical when
off.

Each increment = **one PR + one ledger lesson + Fable Gate 1 (pre-build) and Gate 2
(pre-merge, score ≥ 8)** per GRAPHICS-OVERHAUL. Verification legend (BIOME-DESIGN §7
extended): **D** = `tests/gold-determinism.mjs` byte-identical · **C** =
`tests/bulletcontrast.mjs` · **T** = `tools/tricount.mjs --ci` (dragons untouched —
trivially green) · **E** = `tools/envcount.mjs --ci` (NEW, built in A0) · **H** =
human on the PR preview · **A** = full headless suite (`tests/run-all.mjs`).

| # | Increment | Files | Coexistence guarantee | Verify |
|---|---|---|---|---|
| A0 | **`tools/envcount.mjs`** — the env-geometry/overdraw guard BIOME-DESIGN §8 specs, needed before any prop PR: mirror `tricount.mjs`'s headless harness (DOM shims + `three-resolver.mjs`); build EVERY archetype (catches the indexed/non-indexed boot crash headless), assert per-biome (a) instance counts, (b) tris per archetype (≤150 cap), (c) count additive `depthWrite:false` surfaces — the number that matters — incl. ≤1 transparent veil surface per gate; `--ci` exits 1 on overage. Baseline the shipped numbers. | `tools/envcount.mjs` (new) | tool-only; zero game code | A, E (self), D |
| A1 | **FROZEN REACH — the proving hero.** 5 archetypes (`ribspire`, `vertebrae`, `penitentes`, `serac`, `glacierfront`) + FOAM_CFG entries; retint `primary[2]` → `0xd8d2c2` (near-zero emissive, keep roughness 0.32); whitelist flip; `crystal`/`crystalSmall` parked | `environment.js`, `biomes.js` | old archetypes registered + parked; `?props=v1` fallback; palette change is the PR's point (C gates it) | C, T, E, A, H (tiershot vs Astral — the twin axis; MARROWCOIL rib read; cyan ration) |
| A2 | **EMBERFALL CALDERA.** `colonnata`, `riftfang`, `fumarole` (`|x|≥13.5`), `clinker`, `riftwall`; materials KEPT; `basalt`/`vent` parked | `environment.js`, `biomes.js` | same pattern; hazards.js untouched (geysers are level-data, not the `vent` prop) | D, T, E, A, H (riftfang parallax strobe; tiershot vs Mire) |
| B1 | **Phase Veil enrichment (generic).** Faceted panels (§5.2A) + shader terms (§5.2B) + LineSegments lattice (§5.2C) + meniscus; hero skin = Frozen hoarfrost; flag + `applyQuality` tier off-switch (lowest tier = shipped flat fresnel) | `obstacles.js`, `main.js` | `?veil2=0` → byte-identical shipped gate; presentation-only (no placement fields) | **D (critical)**, C, T, E (1 transparent surface/gate), A, H (`tools/gateshot.mjs` before/after; head-on route read; hierarchy) |
| A3 | **AMBER WASTES.** `keelback`, `mesa`, `swallowed`, `panshard`, `tablelands`; accent[1] → `0x8a5a38` @~0 emissive; `fogFarColor: C(0xf6e4c8)`; **prune `column`/`slab`/`dome` from biome 1** | `environment.js`, `biomes.js` | shared trio stays live in biome 0 until A4; fogFarColor rides the shipped `?? fog.color` fallback | C (fog touch!), T, E, A, H (mirage dissolve; the no-glow pole; tiershot vs Sanctuary) |
| B2 | **The phase-through moment.** Per-gate veil material (fresh factory call + shared time refs, `perInstance` disposal); `uPhase`/`uCrash` impulses triggered from `collision.js` phase/crash seams; perfect-vs-minor amplitude/symmetry; reuse `phaseBurst` tiers; impulse amplitude scales with quality | `obstacles.js`, `collision.js`, `main.js` | impulse uniforms rest at 0 → static frame identical to B1; flag-off = shipped | **D**, A, H (perfect iris-open vs minor ragged ripple vs crash slam — the feel-tier must READ) |
| A4 | **SUNKEN SANCTUARY.** `campanile`, `archfall`, `colonnade`, `reliquary`, `basilica`; primary[0] → `~0x5e8577` (lower emissive); `fogFarColor` teal-indigo (~`0x152242`, tune); drop `tower`/`archruin`/`column`/`slab`/`dome` from biome 0 | `environment.js`, `biomes.js` | after this no archetype is multi-biome (BIOME_TINTS vestigial — note for A8) | C, T, E, A, H (THE ROSE GAP; masonry custody → `swallowed`; tiershot vs Wastes) |
| A5 | **LUMEN MIRE.** `canopytitan`, `bracketspire`, `weeper` (the matured offset-curve), `hummock`, `canopyline`; primary[4] emissive → ~0 (mass goes black) | `environment.js`, `biomes.js` | same pattern | C, T, E, A, H (lantern + reflection ellipses; light-lane chains; tiershot vs Caldera) |
| B3 | **Seven crystallizations.** Per-biome lattice pattern/facet character/parallax interior data on `PHASE_SKINS` (rose-window / fulgurite / hoarfrost / obsidian-web / spore-web / starfield-glass / aurora-curtain) | `obstacles.js` | per-skin data over the B1 shader; flag-off unchanged | D, C, A, H (gateshot montage ×7; each medium reads AS its biome) |
| A6 | **ASTRAL SHALLOWS (finale).** `calved`, `constellation`, `voidring`, `slatereef`; NO massif; primary[5] emissive sunk; wider x-offsets, long steps | `environment.js`, `biomes.js` | same pattern | C, T, E, A, H (THE CALVED CROWN; floating breaks vs star-reflections; tiershot vs Frozen) |
| A7 | **Cross-biome coherence pass.** One flight through the full cycle; fix seam pops, glow-address violations, silhouette confusions found on preview; side-by-side `tiershots` per twin pair | tuning only | value tweaks only | C, E, A, H (the full-cycle montage — Gate 3 phase review per GRAPHICS-OVERHAUL) |
| A8 | **Cleanup.** DELETE retired archetypes (`crystal`, `crystalSmall`, `basalt`, `vent`, `obelisk`, `column`, `slab`, `dome`, `tower`, `archruin`, `glowcap`, `glowcapSmall`, `spirevine`, `monolith`, `arcshard`) + their FOAM_CFG entries + the `?props=v1` fallback + vestigial `BIOME_TINTS`; owner sign-off required first | `environment.js`, `biomes.js` | pure deletion of parked, unlisted geometry | D, T, E, A, H (boot montage — nothing regressed) |

Sequencing: A0 → A1 → (A2 ∥ B1) → A3 → B2 → A4 → A5 → B3 → A6 → A7 → A8. B-track
never blocks A-track (different files). If any increment's preview verdict is
"doesn't feel right", STOP THE TRAIN and fix before migrating the pattern — THE
RULE's whole point. The B1/B2/B3 gates are the most Fable-scrutinized PRs of the arc
(the veil is the game's most legibility- and overdraw-sensitive surface).

---

## §7 Verification & guardrails

Run from `reforged/` on every increment; specifics per PR in the §6 table.

1. **`node tests/gold-determinism.mjs`** — byte-identical, ALWAYS. Non-negotiable on
   every Phase-Gate PR (they live in `obstacles.js` beside fixtured placement data)
   and on A2 (Caldera has the hazard block). Prop-only PRs are structurally safe
   (render-only) but run it anyway — it's free.
2. **`node tests/bulletcontrast.mjs`** — on EVERY palette/fog/emissive touch: A1
   (Frozen retint), A3 (fogFarColor + accent), A4 (retint + fog), A5/A6 (emissive
   sinks), B1/B3 (veil color terms). The danger magenta must win in all biomes.
3. **`node tools/tricount.mjs --ci`** — dragons untouched; trivially green, run it.
4. **`node tools/envcount.mjs --ci`** (from A0) — per-biome instance counts, per-
   archetype tri caps, additive/transparent surface counts (the overdraw guard),
   builds every archetype (the boot-crash catch for indexed/non-indexed mixes).
5. **Full headless suite** — `node tests/run-all.mjs`.
6. **Screenshot artifacts for the Fable gates:** `tools/bandshot.mjs` (prop bands),
   `tools/gateshot.mjs` (Phase Gate before/after), `tools/tiershots.mjs`
   (side-by-side per twin pair: Frozen⟂Astral, Sanctuary⟂Wastes, Caldera⟂Mire),
   `tools/gameshots.mjs` (full-cycle montage at A7/Gate 3).
7. **The human on the PR preview** — every visual/feel claim (no WebGL in CI; never
   claim a visual result — stage it). Post what to fly: the biome, the seam, the
   twin-pair comparison, and for B2 the three moments (perfect phase, minor phase,
   crash) during a Surge.
8. **Standing guardrails:** `mergeParts` ≤2 mats; no per-frame `instanceMatrix`
   animation; no new large additive volumes (the ~2-on-screen cap belongs to boss
   kit); new veil uniforms rest at 0 = shipped frame (the zero-default identity the
   Gate 2 checklist demands); accent hues stay out of the danger-magenta band.

## §8 PERFORMANCE — the 60fps contract (desktop AND weak mobile)

**Self-contained: a builder reads only this section for the perf contract.** Every
number below is either MEASURED (cited to `BOSS-DESIGN.md §2` / a ledger lesson) or
COMPUTED from this plan's §4 tables against the shipped recycler math — estimates are
marked "verify on-device". Verdict up front: **the plan is sound as written.** The 29
side-prop archetypes are perf-free by construction; the entire real risk concentrates
in ONE place — the Phase-Veil's enriched fragment shader on a near-fullscreen
transparent surface — and that risk is bounded, tier-degradable, and gated below.

### 8.0 The budget model, restated for this redesign (measured, not inherited)

The repo's measured truth (`BOSS-DESIGN §2`, desktop sweep + real-phone verification):

| Axis | Measured verdict | What it means HERE |
|---|---|---|
| Draw calls | ~415 animated draws ≈ 58fps on a real phone — **not a budget axis** | 5 archetype meshes + 5 foam meshes per biome × 2 live biomes ≈ **20 visible draws** for the whole prop system. Irrelevant. |
| Triangles | 400k tris ≈ 59fps on-device — **effectively free** | The worst 2-biome window below is ~72k tris — **~18% of a load that already held ~59fps**. Irrelevant. |
| Instancing | per-frame `instanceMatrix` upload JANKED a phone (36.8fps vs 58) | The recycler only writes matrices on **recycle/reseed** (`recycleBand`/`reseedBand`, `needsUpdate` only when `changed`) — already compliant. Never add a per-frame matrix write. |
| **Overdraw** | **THE cliff**: 2 large stacked additive/fresnel shells = **+50% frame time** at 720p (scales with resolution); fresnel worst case **32fps** on-device. LineSegments exempt. | The veil is the single most overdraw-sensitive surface in the game. Iron rule B (one transparent surface, ever) is a HARD perf law, not a style preference. |

**Why the 29 new archetypes are essentially free:**
1. **Opaque + depth-written.** They occlude sky/water/bloom behind them —
   fairness-POSITIVE (they *subtract* fill from the additive background).
2. **The visible-gate collapses global cost to local cost.** `WALL_WINDOW` (900) <
   `biomeLength` (1500) → at most **2 biomes live**; `updateBandVisibility` sets
   `mesh.visible = false` on every other band → 0 draws, regardless of how many
   archetypes are registered. Coexistence (29 new + 15 parked legacy) costs ~nothing.
3. **Recycle-only matrix writes** (see table above).
4. **≤2 material groups per archetype** (`mergeParts` throws otherwise) → shared
   programs, no compile churn.

**Where the real risk is:** the Phase-Veil (§8.3). A near-fullscreen transparent
fresnel surface is exactly the measured cliff's shape; the enrichment must add ALU
and geometry to the SAME projected surface and never a second layer of fill.

### 8.1 Per-target frame budgets (the two failure modes are different)

**MOBILE (the 60fps floor, 16.6ms) — fill-rate/overdraw bound.** Proven by the
on-device A/B (lesson `2026-07-13-perf-fill-vs-cpu-ondevice-ab`): halving draw calls
moved fps 0; pixel count is the lever. Side props are safe here (opaque, one depth
layer); the veil is the danger (one full-coverage blended layer whose fragment cost
we are about to triple).

**DESKTOP incl. 120Hz/ProMotion (8.3ms) — throughput + hitch bound.** Per lesson
`2026-07-13-godhead-perf-120hz-tier-and-mirror-diet` (+ the median-signal follow-up):
120Hz panels expose costs 60Hz hides, VRR makes fps demand-shaped, and the tier
controller decides on `medFps` (windowed median) with a `capFps>70` capable floor.
What must hold at 8.3ms is the **steady cruise state**; a 1–2s gate-approach
transient that steps ProMotion 120→80Hz is acceptable, a 60Hz miss is not. Also:
compile-on-first-render is a hitch generator — both veil programs must be **built at
init and warm-compiled** (`renderer.compile` against the live composer RT, the
`bossStart` warm-compile idiom) so the first gate never stalls.

Per-subsystem GPU budget for everything this plan adds (against 16.6ms mobile /
8.3ms 120Hz):

| Subsystem | Steady (cruise) | Transient (gate approach, ≤2s) | Basis |
|---|---|---|---|
| Side props, worst 2-biome window | ≤ 1.0ms | — | ~72k tris vs measured 400k≈59fps; verify via `stress.html` tris axis |
| Phase-Veil, enriched, small coverage | ≤ 0.3ms | — | coverage-proportional; shipped veil already holds 60 |
| Phase-Veil, enriched, near-fullscreen | — | ≤ 2.0ms mobile / ≤ 1.0ms @120Hz | ESTIMATE — the §8.5 on-device gate is mandatory |
| LineSegments lattice (≤600 seg/gate) | ≤ 0.2ms | — | cliff-exempt (measured) |
| uPhase/uCrash impulse + phaseBurst | — | ≤ 0.5ms for ≤0.5s, ONE gate | uniform-only + existing pooled particles (§8.3b) |
| **Total new steady** | **≤ 1.5ms** | | leaves the shipped frame untouched |

### 8.2 Side-prop guardrails — the `envcount.mjs` caps (A0 builds this FIRST — confirmed absent from `tools/`, and confirmed the right first increment)

Computed load of the §4 roster as specced (`perSide = ceil(900/step)`, ×2 sides;
instances × target tris):

| Biome | Instances | Band tris | Heaviest archetype |
|---|---|---|---|
| 0 Sanctuary | 298 | ~20.6k | reliquary 140 inst (step 13) |
| 1 Wastes | 318 | ~21.5k | panshard 130 inst (step 14) |
| 2 Frozen | **496** | **~40.6k** | penitentes 164 inst (step 11) |
| 3 Caldera | 416 | ~31.4k | clinker 164 inst (step 11) |
| 4 Mire | 384 | ~27.3k | hummock 150 inst (step 12) |
| 5 Astral | 230 | ~15.5k | slatereef 96 inst (step 19) |

Worst adjacent live pair = **Frozen+Caldera ≈ 912 instances / ~72k tris** — trivially
safe (§8.0). The §4 tri targets (40–130) are confirmed harmless with wide margin.

**`tools/envcount.mjs` spec (refining A0 + BIOME-DESIGN §8):** mirror `tricount.mjs`'s
headless harness (DOM shims + `three-resolver.mjs`); import `environment.js`
ARCHETYPES and `obstacles.js`; **build every archetype** (catches the
indexed/non-indexed `mergeGeometries` boot crash and the `mergeParts` ≥2-mat throw
headless). Assertions, `--ci` exits 1 on any overage with a per-row table (baseline
the shipped numbers in the A0 PR):

1. **Tris per archetype ≤ 150** (targets are 40–130; the cap leaves tuning room).
2. **Instances per archetype = 2×ceil(900/step), and ≤ 170 absolute** (min step 11 →
   164; a step below ~10.6 breaks the cap → forces a design conversation).
3. **Per-biome: total instances ≤ 550, total band tris ≤ 50k**; worst
   adjacent-pair window ≤ **90k** (headroom over the computed 72k, an order of
   magnitude under the measured-safe 400k).
4. **THE NUMBER THAT MATTERS — additive/transparent surface census.** For every prop
   material: `transparent`, `depthWrite:false`, or `AdditiveBlending` ⇒ **FAIL for
   side props (must be exactly 0)**. For a fixture-built gate (`buildGate` with a
   representative `o`): exactly **1** transparent `NormalBlending` veil surface;
   additive `depthWrite:false` planes ≤ 9 (core + beacon + 7 motes — all small and
   opacity-0 at rest, the shipped layer-4 set; do not proliferate); lattice
   `LineSegments` ≤ **600 segments/gate**; alpha clamp 0.30 present in the veil
   fragment source (string-assert the clamp survives).
5. `FOAM_CFG` entry exists for every registered archetype (missing entry = the foam
   sibling draws garbage).

**Deliberately NOT tiered/capped: prop density.** Tris and draws are not the axis;
adding a density knob is complexity without a measured cost. Foam already dies at
tier 2 via the existing `setWaterFoamQuality` wiring — no new prop tier hooks.

### 8.3 The Phase-Veil budget — the critical one

**The invariant: fill stays exactly ONE blended layer of at most ~full-screen
coverage — the same fill the shipped flat veil already pays.** Everything §5 adds
must be (a) geometry on the same sheet, (b) ALU in the same fragment, or (c) opaque
lines. Audit of each §5 technique:

- **Faceting (§5.2A) — verified: tris, not fill.** The shipped panels are `FrontSide`
  boxes → back faces culled → one layer today. The faceted replacement holds the
  claim ONLY under two conditions the builder must keep: (1) **one non-self-
  overlapping front-facing sheet per panel region** — no coplanar duplicate layers,
  no z-overlapping shards (any overlap IS a second blended layer = the cliff); (2)
  total projected panel area unchanged. ~200–1k non-indexed tris/gate: free (§8.0).
- **Shader terms (§5.2B) — ALU on a large-coverage transparent surface IS a
  fill-class cost on mobile** (fragment work scales with pixels shaded, same as
  blending). Guardrail: the enriched fragment stays **≤ ~3× the shipped veil's ALU**
  (shipped: 1 fresnel pow + 1 sine + mixes). Chromatic split = 3 fresnel evaluations,
  parallax = 1 extra pattern sample, glints + meniscus = a few ops each — the §5.2B
  set as written fits ~2.5–3×. Being <1 extra shipped-veil-equivalent layer, it sits
  BELOW the measured 2-shell cliff (+50% frame) — but this is the one genuine
  estimate in this plan: **verify on-device via `stress.html` before B1 merges**
  (§8.5). Cheapest-first cut order if it misses: chromatic split → parallax → glints
  (meniscus is a few ops and is an affordance — cut last).
- **Lattice (§5.2C) — cliff-exempt (measured), but capped**: ≤ **600 segments/gate**
  (envcount-asserted), tier-1 halves via `drawRange`, tier-2 `visible=false`.
  Densest skin (Frozen hoarfrost) is B1's hero — B3's other six skins must stay at
  or under whatever density B1 shipped and tested.
- **THE ABSOLUTE RULE — no second stacked transparent/additive shell, EVER.** Not
  for depth (that's the parallax trick), not for the impulse (that's a uniform), not
  for a skin. envcount assertion 4 is the tripwire; the measured penalty is +50%
  frame time / 32fps.
- **Per-gate materials (B2):** fresh `makeVeilMat` factory calls with identical GLSL
  → one compiled program (r160 program cache); shared `{value}` time ref → one
  uniform write/frame. Typically 1–2 gates in draw range → material count is trivial.
  Build the flat AND enriched programs at init and warm-compile both (§8.1) — a
  first-gate compile stall is the known mid-gameplay hitch generator.

**Worst cases to test on-device (the §8.5 URLs):** (1) head-on final approach —
maximum coverage (~full screen for the last ~0.5s), fresnel low but every fragment
shaded + blended; (2) grazing/banked approach — high fresnel + chromatic + glint
paths all hot. Test BOTH; they stress different terms.

### 8.3b The uPhase/uCrash impulse + phaseBurst — affordable, confirmed

- The impulse is **two uniforms animated ~0.4s on ONE gate's already-drawn surface**
  — zero new fill, zero new draws, zero steady-state cost (uniforms rest at 0 =
  shipped frame, the §7 zero-default identity).
- `phaseBurst` reuse (`particles.js:333`) is the **existing pooled, already-tiered**
  shard/shockwave system — adds nothing new to the budget.
- The crash alpha spike (alpha → ~opaque at the impact point for one transient beat):
  **safe** — blend cost is independent of the alpha VALUE (the pixels were already
  being shaded and blended); it's one gate, a fraction of a second, with no route
  left to read. Flag it in the B2 PR description as the sanctioned >0.30 transient.
- Do NOT add impulse-driven geometry (no ripple ring mesh, no flash quad) — the
  wavefront lives in the fragment shader and the existing burst particles.

### 8.4 Tier degradation — the exact wiring (`main.js applyQuality`)

New export `setVeilQuality(tier)` from `obstacles.js`, called in `applyQuality`
after `setArenaSetQuality(tier)`. Both veil materials (flat + enriched) are built at
init; a tier flip is a **material-pointer swap + visibility flips + uniform writes —
never a compile, never an RT realloc** (flips already carry `skipQualityFrames = 2`;
don't add to their cost).

| | Tier 0 (full) | Tier 1 (reduced) | Tier 2 (low — composer off) |
|---|---|---|---|
| Veil surface | enriched: facets + glints + chromatic + parallax + meniscus | enriched MINUS chromatic + parallax (the two big per-pixel terms) via uniform/define | **flat shipped `makeVeilMat` fresnel** — the §2 iron-rule-C fallback |
| Lattice | full (≤600 seg) | half density (`drawRange`) | `visible = false` |
| uPhase/uCrash impulse | amplitude 1.0 | amplitude ~0.7 | amplitude 0 (crash reads via the existing death FX; phase via `phaseBurst`, which `setParticleQuality` already scales) |
| Facet geometry | shared (geometry is free — never tier geometry) | shared | shared (flat material on faceted mesh ≈ shipped look) |
| Side props | unchanged | unchanged | unchanged (opaque = free; no knob, §8.2) |
| Foam collars | on (existing `setWaterFoamQuality`) | on | off (existing wiring) |
| Gate motes/core/beacon | existing layer-4 behavior, untouched | untouched | untouched |

**What survives at tier 2:** the exact shipped gate (flat fresnel, frame, brackets,
core/beacon/motes) on the new facet silhouette — i.e. today's proven-60fps frame.
**Named off-switches:** every full-screen or transparent add has exactly one —
`setVeilQuality` (tier), `?veil2=0` (coexistence flag: byte-identical shipped path,
the `?skyforged=0` pattern), `?props=v1` (prop-roster A/B — a whitelist flip, no perf
dimension since both rosters are opaque + visible-gated). Tier 2 fallback and
`?veil2=0` share the flat-fresnel code path — one implementation, two entries.

### 8.5 Measurement & CI protocol

**Headless, every increment (all from `reforged/`):**
1. `node tools/envcount.mjs --ci` — the §8.2 caps + surface census (from A0).
2. `node tools/tricount.mjs --ci` — dragons untouched, trivially green, run it.
3. `node tools/stress.mjs` — **B1 only**: add two axes to `stress.html` first:
   `mat=veil2` (the enriched veil ShaderMaterial, next to the existing `energyShell`)
   and `veilCover=0|1` (one full-screen-coverage veil2 quad at the camera). Headless
   numbers are rAF-throttled — read **relative curve shapes/inflections only**
   (the tool's own banner says so); the enriched-vs-shipped veil curve should track
   ≤ ~the one-shell energyShell row, never approach the 2-shell inflection.

**Real-device gates (mandatory — real-GPU fill is unmeasurable headless/SwiftShader):**
- **B1 (first faceted veil) — HARD GATE, no merge without it.** Owner opens
  `tools/stress.html` worst-case URLs on the reference phone (post them in the PR):
  `?mat=veil2&veilCover=1&tier=0` plus the in-game A/B — fly 3 gate approaches
  (head-on AND banked/grazing, §8.3) with `?veil2=1` vs `?veil2=0`, HUD open.
- **B2 — on-device spot check**: perfect phase, minor phase, crash during a Surge;
  watch for an impulse-frame spike (there should be none — uniforms only).
- **B3 — inherits B1's gate** unless any skin's lattice density or shader terms
  exceed what B1 shipped (hoarfrost is the densest and is B1's hero, so normally
  nothing new to test); if exceeded, re-run the B1 protocol on that skin.
- **Desktop-120Hz check (B1 + B2):** on a ProMotion/120Hz panel, confirm tier stays
  latched (no 0↔1 oscillation through gate approaches — the `max fps` HUD readout is
  the refresh-rate tell) and `medFps` holds through the approach transient.
- **Fill-vs-CPU A/B if B1 regresses** (lesson `2026-07-13-perf-fill-vs-cpu`):
  `?pr=1` is the decisive single-axis discriminator — if fps scales ~1/pr² it's fill
  → cut §8.3's terms in the stated order; if it barely moves it's CPU → suspect
  per-gate material count / uniform writes. Include a refutation control (`?veil2=0`
  same run) and bracket with a repeated baseline — thermal drift on a phone is worth
  ±10fps.

**Go/no-go criterion (B1/B2):** on the reference phone at tier 0, **median fps ≥ 55
and no new p95 spike** on the worst-case stress rows AND across the 3-approach
in-game A/B (`?veil2=1` within ~2fps median of `?veil2=0`); on the 120Hz desktop,
tier stays 0 with no oscillation. Miss ⇒ demote terms (chromatic → parallax →
glints) until it passes; the tier-1 recipe becoming the tier-0 recipe is an
acceptable outcome, a second transparent layer is never one.

### 8.6 Per-increment perf risk table (where to spend perf attention)

| # | Increment | Risk | The specific check |
|---|---|---|---|
| A0 | envcount tool | NONE (tool-only) | self-test + baseline the shipped numbers |
| A1 | Frozen props | LOW | envcount (496 inst / ~40.6k tris — the heaviest biome, sets the high-water mark); zero transparent surfaces |
| A2 | Caldera props | LOW | envcount (Frozen+Caldera = the worst adjacent window, ~72k ≤ 90k cap) |
| B1 | Faceted veil + shader + lattice | **HIGH** | **real-phone stress.html gate (§8.5) + 120Hz check + envcount surface census (1 transparent surface, ≤600 seg)** |
| A3 | Wastes props | LOW | envcount |
| B2 | Phase/crash impulse | **MED** | envcount (no new surfaces); on-device spot check of the 3 moments; warm-compile both programs; D critical |
| A4 | Sanctuary props | LOW | envcount |
| A5 | Mire props | LOW | envcount |
| B3 | Seven skins | MED | envcount lattice cap per skin; inherits B1's gate unless a skin exceeds B1's tested density/terms |
| A6 | Astral props | LOW | envcount (lightest biome, ~15.5k) |
| A7 | Coherence pass | LOW | envcount + C (value tweaks only — no geometry/surface changes allowed in this PR) |
| A8 | Cleanup/deletion | LOW (perf-POSITIVE) | envcount re-baseline (instances drop by the parked legacy roster); boot montage |

The pattern: **every A-track PR is envcount-green-and-done; all real perf attention
concentrates on B1** (and its B2/B3 riders). If B1 passes its on-device gate, this
entire redesign is perf-neutral-or-better at every tier on every target.

---

## §9 Open questions / owner decisions

1. **Build order confirmation** — Frozen-first is the art director's ranking (and
   targets the owner's most-hated prop); Caldera-first would follow BIOME-DESIGN's
   hero-biome convention instead. Default: **Frozen first** unless the owner objects.
2. **Does the Phase Gate concept land?** "A standing wave in the skin of the world /
   phasing = becoming the wall's substance" + the name **Phase Veil**. Cheap to
   rename; the geometry/shader work is concept-agnostic.
3. **Scope greenlight for B2** — the phase/crash impulse touches `collision.js`
   (trigger-only, render-side). Confirm the owner wants the crash slam-solid beat
   (one transient >0.30 alpha frame at death) — it's the one legibility-law
   exception in this plan.
4. **A8 deletion sign-off** — retiring 15 legacy archetypes is irreversible in
   spirit (recoverable in git). Owner flies the full cycle at A7 first.
5. **Astral's missing massif** — deliberate (emptiness is the massif). Confirm the
   owner agrees the finale skyline stays prop-empty for the starfield/sky-whale/
   future lidded sun.
6. **Suggested-not-visioned hexes** — Sanctuary's `fogFarColor` (~`0x152242`) and
   exact emissive floor values are preview-tunable; everything else is from the
   visions verbatim.
