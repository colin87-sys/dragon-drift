# THUNDERHEAD TEMPEST — "The gathering storm" · Premium Build Sheet (fresh storm drake)

**v3 — THE CONSOLIDATED CONTRACT (2026-07-14).** This sheet was rebuilt as ONE coherent,
self-contained builder's contract: §1–§10 below are the ONLY sections a build chat reads. The
STORMFORK bolt-wing is the NATIVE hero (not a patch), the emissive doctrine is re-derived from the
owner's reference image (the glowing lightning garment — a deliberate, recorded revision of the old
"withheld" doctrine), and every number, path, and assert that used to live across §0–§D +
supersede banners has been reconciled INTO the contract. The full v0→v2 layered history — the
strata-deck era, the §R/§F critic passes, the original §B, the §C carryover tables, the §D wing
patch — is preserved verbatim in the **APPENDIX (design history — superseded; do not build from
here)** at the bottom. If anything in the appendix appears to disagree with §1–§10, the contract
wins, always, with no reconciliation required of the builder.

One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`). Storm/lightning lane, proven in shipped
games (MH *Kushala Daora*/*Amatsu* · Genshin *Dvalin "Stormterror"* · Pokémon *Zekrom*/*Rayquaza*),
copied from none. **Read first:** `DRAGON-DESIGN.md` (laws, wing kit §4, motion kit §5, glow §6,
harness §9) · `VESPER-NIGHTGLASS-BUILDSHEET.md` (house format) · `PREMIUM-BUILDSHEET-RESEARCH.md`
§3/§4/§6b. Numbers here are the authority; every Fable gate judges against THIS contract.

---

## §1 Identity contract + frozen identity laws

Fresh roster key `tempest` — fully additive, nothing shipped changes.
`name:'Thunderhead Tempest'` · `title:'The gathering storm'` · `rarity:'SSR'` / `maxRarity:'SSSR'` ·
`cost: 2600` (between Vesper 2200 and Pearl 3400; owner may re-slot) ·
`stats { speed 1.12, handling 1.14, drain 0.86, regen 1.16 }` (a front that keeps coming — pace +
endurance, under the 1.16/1.28 caps) · `fx.auraColor '217,222,255'` (storm-white, cold) ·
`forms[]` accretive, length 4 · `maxTierFor === 3` · `hasStyle` (Surge stays a white-violet storm,
never magenta) · `accentHue: 0xd9deff`.

**Frozen identity laws (v3):**
1. **THE STORM WEARS ITS LIGHTNING.** *(Revised 2026-07-14 — the owner's reference image wins over
   the v0–v2 "withheld" doctrine, and the revision is recorded, not smuggled.)* The cruise frame is
   a charcoal thundercloud wearing a LIVE near-white energy garment: the bolt wing-frame, the
   spine circuit, the chest/underbelly veins, the horn-crest, and the tail bolt-tuft all HUM
   visibly at idle (`humFloor` 0.30→0.90 up the ladder), breathing on a slow deterministic charge
   cycle. The pulseTimer STRIKE is the PEAK of that hum (a 2.2–4.0× luminance lift travelling
   root→tip), never an ignition-from-dark; **Dragon Surge = "the Tempest breaks"** (continuous
   blaze + ≤3 Hz fork-strobe). One line: *Solar wears its light as regalia; Vesper sheathes it;
   the Tempest wears the storm — charged, breathing, building, breaking.* The body is NEVER
   dark-and-dead — and never Solar-static: the garment always has rhythm.
2. **Charcoal, never black; near-white, never warm.** Body L 0.20–0.26 at every form (≈2× Vesper's
   L≤0.10 — the hard anti-Vesper floor, asserted); hue ~222° held; zero warm hues, zero gold.
   Accent family passes by SATURATION (≤0.12), not hue collision: near-white `0xd9deff` (sat≈0.09),
   strike core `0xf2f4ff` (the ONE true near-white, sat<0.06), silver `0x9fb0c8` (diffuse only).
3. **CHARGING is the verb.** Every ascension accumulates charge in four channels at once: TREE
   (circuit completeness `arcRun` ↑), TIME (strike duty `arcDuty` 0.06→0.18 ↑), GLOW (humFloor +
   lit coverage ↑), SOURCE (`heartScale` ↑) — plus mass and silhouette (kinks/fork/rays). Apex
   superiority is shape-completion, never scale.
4. **Everything churns.** Fork tips shiver on the blade-lag walker, bays billow ±3%, the crest
   streams, virga wisps trail — motion IS the cloud read (bespoke dial block, no photocopied flap
   block).
5. **Structure IS motif.** The Stormfork wing's skeleton is literally the Storm Circuit's f2/f3
   branches — a strike renders the wing's own construction diagram root-to-tip. The grind-hook is
   in the silhouette.
6. **Build vehicle:** NEW `js/dragonTempest.js`, billowed/faceted assembly family. Forbidden
   imports: `dragonOrganism.js`, `dragonNightFury.js`, `dragonUnifiedHull.js` (asserted in tests).

## §2 Reference-image DNA → design decisions (the owner's Stormfork concept art is ground truth)

The owner's reference: a sleek faceted low-poly dragon, dark charcoal/blue-slate body, PALER
GLOWING underbelly/chest; each wing's skeleton a bright near-white FORKED BOLT with dark charcoal
cloud-membrane webbed between the glowing branches — the lightning frame generously, beautifully
lit; a near-white energy circuit along neck/spine and chest; a glowing swept-back spiky horn-crest;
a long tail ending in a near-white lightning-flame tuft; a soft near-white aura under the belly;
cool desaturated palette against a dark stormy sky. Per the Revenant lesson
(`2026-07-13-revenant-render-in-color-and-let-the-owner-reference-win`): the picture OUTRANKS
prose — this table is the contract's ground truth.

| Reference element (owner image) | Tempest feature it grounds | Deliberately NOT taken |
|---|---|---|
| Wing skeleton = a bright forked lightning bolt, membrane webbed between GLOWING branches | THE STORMFORK (§4b): `boltArm` 3-kink arch + Y-fork frame, whose crest overlays (`arcSeam`) idle at `humFloor` — the frame reads as lit lightning in CRUISE, not only in strikes | a literal zigzag (the arch-not-zigzag law §4b holds); translucent/additive glow shells (the garment is opaque emissive geometry) |
| Dark charcoal cloud-membrane between the branches | opaque matte `boltTiers[4]` membrane — the dark cloth the bolt is sewn to; it stays diffuse in cruise (glow lives on COMPONENTS, never surfaces — DRAGON-DESIGN §6) | lit membrane in cruise (it becomes the RECEIVER only at strike peaks + Surge, capped ≤0.30) |
| Paler, GLOWING underbelly/chest | belly tier lifted one step to `0x566384` (recorded revision from v1's `0x4a5468`) + THE STERNUM-VEIN CIRCUIT (§4a): branching opaque-emissive vein strips dynamo→keel→tail-root, hum-lit | a uniformly emissive belly surface (veins are strips; the surface stays diffuse) |
| Near-white circuit along neck/spine | THE SPINE CIRCUIT (§4a): one dorsal inset seam occiput→tail-root riding `spinePoints`, hum-lit, bucket b2 | a second hue; any warm rim (spineMats trap — §5e) |
| Glowing swept-back spiky horn-crest | `stormbrowHead`'s STORMBROW CREST (§4c): 0→2→4→6 swept tent-blades, each ridge carrying a thin hum-lit `arcSeam` crest strip | lighting every blade at full intensity (dominant-decay applies to the glow too); horn SPIKES breaking the rear fill (no-tangents guard) |
| Tail ends in a near-white lightning-FLAME tuft | THE BOLT-TUFT (§4d): a faceted opaque-emissive flame terminus (~70 tris, `arcSeam` body + `arcCore` tips), `tuftScale` 0.3→1.0, whips with the last joint | sprite/billboard flame (C6: give the fire a BODY); warm flame hues |
| Soft near-white aura haloing the underside | delivered FREE by ACES bloom off the hum-lit vein strips + lifted belly tier — `auraIdle 0` stays, zero added overdraw | an aura sprite or additive shell in cruise (the overdraw cliff) |
| The lightning is a generous garment, present at idle, building | THE GARMENT DOCTRINE (§1 law 1 + §5a): humFloor 0.30→0.90, strike = peak ×2.2–4.0, Surge = the break | Solar's static always-on (the hum BREATHES + strikes punctuate — rhythm is kept); the old withheld doctrine (superseded, recorded) |
| Cool desaturated palette, charcoal + near-white/pale-blue | §1 law 2 palette verbatim: `0xd9deff / 0xf2f4ff / 0x9fb0c8 / 0x2e3543`-family ramp | any hue warmer than 90° at sat>0.2 (asserted) |
| Dark stormy sky, faint distant lightning | biome coupling — belongs to `BIOME-DESIGN.md`, not this dragon | sky FX on the dragon itself |

## §3 Art direction + the rear-chase silhouette

**North star: THE GATHERING STORM — a thunderhead that decided to hunt, already wearing its
lightning.** Billowed charcoal cloud-mass with silver-lined rims, dressed in a live near-white
storm circuit that hums at idle, flashes root→tip on strikes, and breaks open on Surge. Anchor:
charcoal slate `0x293040` (apex). Accent: storm-white `0xd9deff` (~255° at sat≈0.09), emissive-only.
Hero: **THE STORMFORK** (the bolt-frame wing). Motif: **THE STORM CIRCUIT** (the worn branching
arc-tree). Growth verb: **CHARGING**. One word: **IMMINENT.**

- **One-word rear read: BOLT.** Black-fill (rear): two jagged kinked storm-blades — each wing ONE
  opaque charcoal blade whose leading edge steps through THREE hard bolt angles on a gull-arch
  macro line, the dominant ray splitting mid-length into a **Y** (the fork crotch notching the
  outline), membrane sagging in cupped bays between a decaying ray rank; the wispy 5-wisp virga
  fringe below, the swept crest above. **The only angular-stepped outline in the game** — and in
  colour, the only silhouette whose skeleton GLOWS at idle.
- **Landmark punctuation (5):** (1) the three kink steps per leading edge (outline angles — they
  survive 250px); (2) the Y-fork notch near the tip; (3) the hum-lit frame tracing those same
  angles in colour (the garment doubles the outline read); (4) the virga fringe (irregular,
  tapering ×0.80 — never rods) + the bolt-tuft point of light at the tail tip, dead-center of the
  chase frame; (5) the crest blades — held off the wing leading edge by the no-tangents guard
  (gap ≥0.08 OR overlap ≥0.05, at glide AND bank).
- **The standing frame carries the identity** — no longer by silver rims alone: carved charcoal
  frame + silver caps + the LIVE hum garment + the crackle-churn. Judged FIRST on the standing
  (`pin(0)`, between-strikes) rear crop at every gate — it must read "a dragon wearing lightning,"
  with the strike as the crescendo, not the crutch.
- **Anti-collision (each pair ≤1 shared cell, separators as laws):** vs VESPER — L floor 0.20 vs
  L≤0.10; live-hum near-white 255°/sat.09 vs withheld ion 223° Surge-only; kinked ANGULAR-STEPPED
  blade vs smooth scallop crescent (hard angles vs pure curves). vs SOLAR (the new nearest
  emissive neighbour — both always-visible): cool 255° sat≤0.12 vs warm gold; a BREATHING,
  strike-punctuated, form-growing garment vs static worn regalia; a branching circuit skeleton vs
  ring + gem; charcoal storm vs indigo crown. Calibration veto (both tiles at I0): *"does any
  frame read as a black Vesper clone or a gold-regalia Solar?"* vs STILETTO — one kinked opaque
  blade per side vs four straight translucent veined blades. vs TOCSIN — angular-stepped kinked
  blades + wispy tapering virga vs round coin row + rigid rods; up-attitude vs low-flat. vs
  REVENANT — see the guard below. vs SYLPH — hard-angle blade vs soft luminous hood.
- **§C ANTI-RESKIN GUARD (carried at FULL strength, restated for the garment era):** the owner's
  named fear is a re-skinned Revenant. Five bans, each with its reason and its machine check:
  1. **No BONE** — no vertebra units, bead-chains, knuckle nodules, ivory anywhere; the frame's
     language is electrical ("kink station", "fork vertex"), never skeletal anatomy.
  2. **No CAGE / enclosed apertures** — Tempest's only negative space is the OPEN-ended fork-crotch
     V-notch; standing assert `holeMetric` enclosed-hole count ≈ 0 on every view/form (≤ the ~2%
     aliasing floor). The Revenant's pass-band is Tempest's FAIL-band.
  3. **No LANTERN** — the Revenant lantern = ONE interior core seen THROUGH apertures, continuously
     lighting its cage. Tempest's glow is the opposite topology: a DISTRIBUTED circuit worn ON the
     surface (a garment with ~5 limbs), no apertures, whose rhythm builds hum→strike→Surge.
     Machine check: the sternum dynamo contributes ≤15% of summed cruise emissive (the wing-frame
     ≥45%) — a single-source chest glow that out-reads the frame is the lantern creeping back.
     *(This restates — does not weaken — the old guard: what was banned was the Grave-Heart
     topology, and it stays banned; the hum being present is the OWNER'S doctrine, §1 law 1.)*
  4. **No BAT-MEMBRANE read** — opaque matte cloud membrane (never translucent skin, no tattered
     scallop hems); the skeleton's geometry is one no vertebrate limb makes (three hard ≥18°
     breaks + a mid-ray Y-fork); no arm/wrist anatomical reasoning anywhere (the fold joint is
     "the dominant kink," an electrical object). The wing-kit LAWS it keeps (dominant-plus-decay,
     cupped bays, cowl+gusset) are DRAGON-DESIGN §4 laws, not Revenant features.
  5. **No BLEACH ramp** — Tempest DARKENS up the ladder inside the L≥0.20 floor (the storm
     gathers); importing the Revenant's value direction inverts the identity.
  **Standing gate veto, every increment, judged first on the standing rear crop:** *"Does any
  Tempest frame read like a re-skinned Revenant — bone, cage, lantern, or bat-membrane — instead
  of a thundercloud wearing lightning?"* Any YES fails the gate regardless of the numeric average.

## §4 The part builders — `js/dragonTempest.js` (billowed/faceted assembly, self-registering, nullable default-off dials)

**Shared kit (top of module):** `flatTriMesh` (mechaKit.js) · `tempestMats(def, glow, stage)`
copying only the `sovereignMats`/`vesperMats` STRUCTURE (dragonVesper.js:43–80 — stage-aware;
`userData.baseEmissive/baseIntensity` on every ticked mat). Tiers: `stormShadow 0x2a2f3c` (dorsal)
/ `flank` = `def.body` (the ramp hex) / `belly 0x566384` (lifted one step from v1's `0x4a5468` —
the reference's pale underbelly; hue 222° held) / `silverRim 0x9fb0c8` (diffuse, metalness 0.06,
envMapIntensity 0.3 — glints, never glows) / `boltTiers[4]` (membrane, lerped toward lit
steel-slate `0x8a95ac` over f `[0.60,0.40,0.22,0.06]`, endpoint steps ≥0.05 L) / `arcSeam`
(emissive `0xd9deff` — THE GARMENT mat family, 3 bucket copies, idle at `humFloor`) / `arcCore`
(emissive `0xf2f4ff` — the one true near-white, strike-peak hue-lerp target only) / `heart`
(emissive `0xd9deff`, `transparent:true` for the coreGlow hook). Body law: metalness 0, roughness
0.85, envIntensity 0.18, **emissive 0x000000** on every diffuse mat (the rig ticks
`bodyMat.emissiveIntensity` 0.12→0.35 at dragon.js:1192 — black emissive keeps the cloud matte
through it; the garment lives on dedicated strips, never on surfaces). `cloverLoft(stations,
profile, matOrFn)` = the `knapLoft` PATTERN (dragonVesper.js:106–131) with a per-station `rot`
field rotating profile indices ±10–14° station-to-station (the diagonal turbulence weave — kills
rings AND strakes; knapLoft itself deliberately cannot rotate). All builders batch per-material
tri accumulation → ≤3–4 `flatTriMesh` per group (the Pearl 253-draw lesson); apex draws ≤70.

### §4a `cumulonimbusTorso` — the billowed cloud-loft + the STERNUM DYNAMO + the body circuit
*(Renamed from v1's `stormcellTorso` — reference-era name; nothing is built yet, zero code impact.)*
Publishes the full attach contract (`wingRoot(side)`, `headBase`, `tailAnchor`, `halfWidthAt`,
`bodyMidY`, `riderSocket`), `spinePoints` (≥2 inflections: neck rises INTO the storm-wall line →
chest proud → tail counter-drop → tip flick), `motifAnchor` (sternum, fixed, never re-hued), and
**`coreGlow` = the dynamo core mesh** (the dragon.js:1147–1151 opacity hook's third real user —
floor → ×1.5 boost breathe → ×(1+1.4·sgm) Surge blaze, zero new engine code).
- **Loft:** 6 stations, each a clover of 3 overlapping soft lobes (N=9 merged profile), `rot`
  +12°/−10°/+14°… per station. Shoulder:waist ≈1.55, haunch 0.8× chest. Value bands per column:
  `stormShadow` dorsal / `flank` sides / `belly` under; every lobe's UPPER edge column takes
  `silverRim` (the sun behind the cloud — diffuse, warm-sky-safe). f0 carries one lobe less per
  station (a small wad of weather).
- **THE STERNUM DYNAMO (storm-heart, ~110 tris):** 5 charcoal cowl VANES (2-face tent wedges swept
  like turbine stators, `stormShadow`) ringing a recessed faceted octa-teardrop core (~50 tris,
  fan-built, vertex-jittered by index hash `sin(i*12.9898)*43758…` — deterministic, never
  `Math.random()`; `heart` mat, `transparent:true`, `userData.base = 0.22 + 0.30·glowLevel` — the
  hum-era idle, brighter than the withheld era's 0.10). ≥0.06 clearance from every vane (no
  coplanar faces); sits BELOW the rider eye-line. The storm tick (§5d) kicks it ×(1+0.5·env01) on
  strike frames — the dynamo audibly "turns over" ~0.2 s before each bolt (the player's telegraph).
  The vane inner faces take a dedicated near-black recess mat (envMap 0) so the recess reads as
  DEPTH + lit rims, not a chest decal (C8 both-cues law).
- **THE STERNUM-VEIN CIRCUIT (new, from the reference):** 2–3 branching vein strips (shallow
  2-face `arcSeam` tents, width ≤0.02×body length, `THREE.DoubleSide`) running dynamo → belly keel
  → tail root along the ventral centerline, one short branch per side toward each wing root —
  generated FROM the loft's own sampled belly-column nodes (C14 weld law: authored from
  independent constants they'd float off the billowing loft). Bucket b1. The reference's soft
  underbelly halo = ACES bloom off these strips + the lifted belly tier; `auraIdle 0` stays.
- **THE SPINE CIRCUIT:** one dorsal inset-groove seam + tent strip, occiput → tail root, riding
  the same `spinePoints` the rig uses (weld by construction). Bucket b2. Grooved, so cruise reads
  carved-and-lit, not painted.
- **Scapular STORM COWL:** 2 billowed lobe-plates per side lapping the wing roots — the Vesper
  `buildScapularCowl` overlap trick (dragonVesper.js:540–562), STATIC in the body frame, never
  parented to the flapping pivot.

### §4b `stormforkWings` — THE HERO: the bolt-frame wing (native, not a patch)
Construction cites (reuse the PATTERNS, fresh geometry): `buildOneScallopWing`
(dragonVesper.js:365–534) · module-level profile-as-function `vesperArmY/Z` (346–356) · `ridge()`
tents (400–409) · connected `edgeBand` (470–477) · gusset (482–491) · cowl (540–562) · the −anchor
wrist fold + `lmirror` outer mirror (616–638) · seam-mat DoubleSide (77–78).
- **(a) The bolt profile — ONE module-level waypoint function** shared by geometry, tip markers,
  blade-pivot placement, and tests (the detach-gotcha law):
  ```js
  const BOLT_T = [0, 0.18, 0.40, 0.68, 1.00];      // stations; interior 3 = K1, K2 (fold), K3 (fork)
  const BOLT_Y = [0, 0.042, 0.180, 0.066, 0.048];  // ×hs — gull-arch envelope, bolt offsets baked in
  const BOLT_Z = [-0.03, -0.05, -0.02, 0.09, 0.30];// ×hs — plan ogee: bows forward inboard, steps hard aft
  function boltArm(t, hs) { /* piecewise-LINEAR through the 5 waypoints */ }
  ```
  Piecewise-LINEAR is the trick: between stations the leading edge is a straight chord; at the
  stations it breaks hard — a stepped leader, frozen. **The macro line stays an ARCH — 3 knuckles
  on an arch, NEVER a zigzag** (the anti-sawtooth discipline, asserted): exactly **3** interior
  slope breaks; each rear-projection (X-Y) direction change ∈ **[18°, 60°]** with **K2's the max**
  (dominant kink = arch apex = the fold joint) and K1 ≥20°; a **single global Y-max at K2** (a
  zigzag has multiple comparable peaks and >3 breaks); every waypoint Y within **±0.06·hs** of the
  smooth gull arch. The Z jogs deliver the stepping in TOP planform (asserted there — plan jogs
  don't project astern).
- **(b) The Y-FORK + the decaying ray rank:** `K = boltArm(0.40)` (fold joint); `F0 = boltArm(1.0)`
  (tip, pins the span). The dominant ray IS the outboard leading edge K→K3→F0. **The fork happens
  AT K3** (t 0.68 — a stepped leader branches AT a step; the third knuckle IS the fork vertex, a
  shared welded node): the branch prong leaves K3 at **+24° aft** in plan, **−8°** dip, length
  **0.62×** |K3→F0|, tip `Fb`; at f3 a 2nd-order SPUR leaves the branch at 0.55 of its length,
  +20°, 0.52× the remainder. Aft rays: 3 more from K (apex = 4 rays + prong), `lenFrac [1, 0.80,
  0.62, 0.46]`, **each successive length ≤0.86× the previous** (branch 0.62× and spur 0.52× obey
  it), fanned `spanAft 1.10`, tips drooping aft-and-down; every ray = 2 straight segments with an
  8–14° mid-break, alternating sign down the rank (bolts step, never sag).
- **(c) Thickness everywhere:** arm segments, rays, prongs are `ridge()` 4-face tents — arm width
  0.16·hs root → 0.05·hs at K3, lift 0.10 → 0.035·hs; rays width 0.075·hs·(1−0.08i), lift 0.09·hs.
  Nothing on this wing is a single quad or a paper crease.
- **(d) Membrane bays (the sawtooth killer):** between consecutive ray tips, an INWARD-cupped
  quadratic bézier trailing edge (control pulled toward K; cup 0.32×(0.75+0.14·i); deepest sag
  biased aft; bay centre dropped so rim light pools), **sampled ≥4 segments (6 at f2/f3)**,
  inter-lobe cusp depth ∈ [0.25, 0.45]× peak sag. **THE FORK-CROTCH BAY** (between the prongs):
  cup 0.5, the darkest tier, and **OPEN at the trailing edge** — a V-notch, never an enclosed
  aperture (the C-GUARD). Membrane **OPAQUE matte** `boltTiers[4]`, assigned by bay index;
  `M.wingMat` = the inboard tier (the rig's single-material wing contract; opaque, so the rig's
  opacity-fade writes are visually inert — noted, not a bug).
- **(e) THE GLOWING FRAME (the garment's main limb):** thin `arcSeam` tent overlays riding every
  ridge crest exactly — generated FROM the same sampled crest nodes the ridge geometry uses (C14:
  a bolt authored from independent constants floats off its frame; this one CANNOT detach).
  Shallow 2-face tents lifted 0.008 above the caps, `THREE.DoubleSide` (the culled-ignition no-op
  gotcha, DRAGON-DESIGN §6.5), strip width ≤0.022·hs. **Idles at `humFloor(form)`** — in cruise
  the wing reads as a lit lightning skeleton webbed with dark cloud (the reference, verbatim);
  strikes lift it to peak; Surge blazes it. Buckets: arm crest → b2; K3→tips + fork + aft-ray
  crests → b3 (§5b).
- **(f) The silver rim-cap tier:** `silverRim` cap strips tracing the same crests UNDER the arc
  overlays (root→K1→K2 brightest — the Kushala new-skin leading edge; then dominant ray, prong,
  inboard aft-ray segments) — the diffuse "silver lining" that keeps the wing sculpted when the
  hum is at its lowest (f0) and under the warm-gold backdrop stress tile.
- **(g) The connected knife-edge:** ONE thin translucent band (brightest wing value, opacity 0.62,
  DoubleSide) just inboard of the WHOLE scalloped trailing polyline — innermost bay, around every
  cusp, around the crotch V, to the tip (per-bay shards banned; dragonVesper.js:470–477 verbatim).
  **The wing's only transparency.**
- **(h) Shoulder:** root gusset (root-LE → K → hip point) anchored to ARM-side points only (the
  fold-tear law), buried under the static scapular cowl; the membrane's inboard edge sits close to
  the shoulder pivot (C12 pivot-lever law).
- **(i) Motion — shoulder-led, the broken-linkage tell dead by construction:** `wingParts 3`
  cascade pivot→mid(arm root→K1→K2)→tip(HAND at K2): `tip.position.set(K)`,
  `hand.position.set(−K)` (the −anchor law, rest pose byte-identical); LEFT = outer
  `lmirror scale.x = −1` wrapper PARENTING the pivot (never on the pivot). Dial block:
  `flapBias 0.82, flapAmp 0.8, wingParts 3, rootAmp 0.74, midAmp 0.14, tipAmp 0.08, midLag 0.45,
  tipLag 0.95, glidePow 1.9, restLift 0.06, apexMid 0.06, apexTip 0.10` — shoulder arc ownership
  77% (C5's 75–85% band), each distal strictly < proximal, block unique in the roster (Vesper
  glidePow 2.2 / Revenant rootAmp 0.72, glidePow 1.15). **THE CRACKLE-CHURN:** publish
  `wingBladePivotsL/R` — idx 1 = a pivot AT K3 owning the branch prong (+f3 spur + crotch-side
  bay skirt, boundary verts AT K3), idx 2 = a pivot at the aftmost ray's root — the rig's lag
  walker (dragon.js:852–859, zero rig surgery) phase-lags them 0.45/0.9 rad, sway 0.10/0.14 rad:
  **the fork tips shiver like a stepped leader hunting for ground**; seam breathing ≤0.012 at
  walker extremes (asserted). pulseTimer's downstroke bias means strikes tend to fire at the beat
  apex — the bolt-frame flashes as the wing slams (free drama). **Fold at K2** (the wing folds
  where the bolt breaks hardest), span ≤0.66 of glide, prong nest clearance 0.02 checked in the
  builder.
- **(j) Numbers:** apex span:body **2.5×** (roster cap) · sweep 18° · single-blade area:body
  side-area ~0.8 · ~300 tris/wing + ~40 arc-overlay tris → ~0.7k/pair at apex · ~8–9 meshes/wing ≈
  18 draws/pair. Publishes `wingPivot/Mid/TipL/R`, tip markers duplicating `boltArm` (module-level
  — the trail-detach bug impossible), `parts.wingElements` (arm + dominant-ray path), per-tip
  markers at F0/Fb.

### §4c `stormbrowHead` — the horned stormbrow + the glowing crest
*(Renamed from v1's `thunderheadManeHead`.)* A blunt RAM-PROW wedge (~14 facets via a mini profile
loft: occiput → heavy brow shelf → short muzzle — the storm leads with its forehead), pointing −Z.
**2 blunt horn-BOSSES** on the brow shelf (~8 tris each — a horned-brow read in the shop turntable,
cut before they become spikes; inside the head outline in rear fill). **THE STORMBROW CREST** (the
reference's glowing swept spiky crest): swept-back tent-blade filaments off the occiput (0→2→4→6
up the ladder, lengths ×0.82 dominant-decay, 2-face tents — never paper planes), canted ±8°
off-sagittal; tips placed by a module-level function shared with the §9 no-tangent test. **Each
blade's ridge carries a thin `arcSeam` crest strip** (hum-lit — the crest glows near-white at
idle, intensity decaying ×0.8 down the rank so the dominant blade leads), bucket b3; ONE `arcCore`
tip node on the dominant blade at f3 (~6 tris). Eyes: octahedra (the Vesper eye pattern,
dragonVesper.js:748–755), `0xcfd8ff`, ladder 36%→28%→23%→19% almond; eye mats OUT of every
surge/storm array (rig-driven via `feverEye`). Publishes `headLength`.

### §4d `virgaTail` — the rain-stem + the BOLT-TUFT
A tapering storm-stem on the Vesper **isBone 4-joint nested chain** verbatim
(dragonVesper.js:785–795: `jAnchor`/`chainAdd` −anchor compensation, `joints[0].isBone = true`,
rotation-only — position writes tear the chain). Stem = `cloverLoft` sections ×0.90 per joint
span, tip ≤0.20× base. Dials: `tailWhip: true, tailLagScale 0.12, tailUndulateX 0.30,
tailRudderScale 0.5` (low lateral coil, pronounced vertical wave — the storm rolls). **THE VIRGA
FRINGE:** 2→3→4→5 rain-streamer wisps off the last two joints (thin tapering 2-face tents, lengths
×0.80, tips ≤0.20× base, irregular spacing — never a rod comb) + **ONE connected single-layer
translucent HEM band** (opacity ~0.55) tracing the fringe's trailing polyline (the edgeBand fix —
one transparent drawable, not per-wisp shards). **THE BOLT-TUFT (the reference's lightning-flame
terminus, replacing v1's 4-tri stud):** a faceted flame of 3–5 interleaved tapering tent-tongues
(~70 tris, index-hash jittered, OPAQUE emissive — `arcSeam` body, `arcCore` on the 2 tip facets
only), `tuftScale` {0.3, 0.5, 0.75, 1.0}, hum-lit, bucket b3, binned to the last chain joint so it
whips with the tip — the point of light the chase camera tracks, dead-center by construction.
Tail stem carries the spine circuit's last segments (grooved, bucket b3). Wisps bin to the joint
whose z-span holds them (−anchor compensated).

## §5 THE STORM CIRCUIT — the garment doctrine, pulseTimer, the storm tick, the fever firewall, the overdraw census

**§5a The garment doctrine (law, with the revision recorded).** v0–v2 held "withheld — lightning
live 6–18% of frames, dark charcoal otherwise." **The owner's reference image shows the lightning
as a generous glowing garment, and the reference wins** (the Revenant lesson, applied): the
circuit — wing frames, spine, sternum veins, crest, bolt-tuft, dynamo — idles at a visible
**hum**: `intensity = humFloor(form) · (0.85 + 0.15·sin(ω_charge·t))`, humFloor
**0.30/0.50/0.70/0.90** up the ladder, ω_charge fixed ≈0.5 Hz (deterministic, pinnable — a live
wire breathing, not a lamp). **CHARGING stays the verb and the STRIKE stays the peak:** pulseTimer
windows lift the buckets to `peak(form)` = **1.2/1.6/2.0/2.4**, travelling root→tip; the
strike:idle luminance ratio is asserted ∈ **[2.2, 4.0]** — big enough to read as an event, never
an ignition-from-dark (which also SHRINKS the photosensitivity modulation depth vs the withheld
era). **Surge = "the Tempest breaks"**: continuous blaze at the caps + ≤3 Hz fork-strobe
alternating buckets 2/3. Distinctness holds by behaviour, not just hue: Solar's regalia is warm,
gold, and STATIC; Vesper's seam is dark until Surge; Tempest's garment is cool, near-white, and
ALIVE — breathing, striking, growing. What is retired with the withheld doctrine (named so nobody
re-adds it): the ≤0.06 ember floor, the "heart+eyes ≥85% of cruise emissive" assert, and C11's
"receiver light inside strike windows ONLY" clause (the hum is the garment; C11's receiver law
still governs the MEMBRANE, which stays diffuse in cruise and receives only at peaks/Surge).
- **Coverage census (the garment is generous, not unbounded):** emissive strip area as a fraction
  of visible surface — wing frames ~6% + spine/veins ~3% + crest ~1.5% + tuft ~1% + heart ~0.5% ≈
  **12% at apex** (ladder 4/7/10/12%, asserted by strip-area sum). ≤7% was the withheld era's cap;
  12% is the honest garment recount — bounded, counted, and all OPAQUE.
- **Glare discipline unchanged:** peak caps `arcSeam ≤2.4`, `arcCore ≤2.0` (strike-peak hue-lerp
  only), `heart ≤1.6`; hum ≤0.95 by construction; the ±10° corridor asserted emissive-clear at the
  PINNED strike frame; duty + window length remain the drama levers, never intensity (rim-diet
  law). **≤1 true near-white discipline held:** `arcCore` (sat<0.06) is the only near-white mat,
  absent from both surge arrays; `arcSeam 0xd9deff` is sat 0.09 — the sanctioned lane.

**§5b Topology + run buckets.** Fixed anchor: the STERNUM DYNAMO (motifAnchor, never moves, never
re-hues). The tree: dynamo → sternum veins + scapulars→K1 (**bucket b1**) → spine circuit + arm
crest K1→K2→K3 (**b2**) → K3→F0 + fork branch (+f3 spur) + aft-ray crests + crest blades + tail
stem + bolt-tuft (**b3**). 3 bucket materials → 3 draws; the storm tick offsets each bucket's
strike envelope +0.04 s so a strike TRAVELS root→tip over ~0.12 s (the Revenant 3-phase-bucket
pattern, proven on dragon.js:1008-style ticks). On the wing the "jitter" is the frame's own kinks;
the seeded zig-zag polyline generator (mulberry32 on `stormSeed`) survives for the tail stem +
crest filaments only. `arcRun` gates completeness per form (§6).

**§5c `js/pulseTimer.js` — the shared deterministic strike scheduler (LANDS with this build;
Tocsin reuses it).** Confirmed absent from `js/`; architecture precedent `bossRhythm.js` (pure,
deterministic-given-rng, CI-simulated) + the integrated-phase law (dragon.js:62 — advance by dt,
never `time·freq`). Pure module: no THREE, no DOM, no globals.
`createPulseTimer({ seed, duty, windowMin: 0.10, windowMax: 0.28, burstMin: 1, burstMax: 4,
restShape: 'storm' })` → `{ tick(dt, phaseHint01), state() → { live, env01, burstIdx, windowIdx,
t }, pin(t01), reseed(seed) }`. Schedule = BURST CLUSTERS: `burstN ∈ [burstMin,burstMax]` windows
of 0.10–0.28 s, 0.30–0.70 s intra-gaps, then a rest sized so long-run lit fraction = `duty`
exactly (rest ≥1.2 s). Downstroke bias: an about-to-open window may be DELAYED ≤0.25 s until the
flap phase crosses the downstroke apex — deterministic given the same dt/phase stream. Envelope:
env01 rises over 30 ms, holds, falls over 60 ms; within-window flicker a fixed ≤3 Hz cosine dip —
**the photosensitivity caps live IN the module** (window ≥0.10 s ≥ the 80 ms floor, rest ≥1.2 s,
≤3 Hz; no call site can strobe faster). Call-site guards: skip opening windows when the adaptive
`quality < 1` (dragon.js:89); boost multiplies duty ×2.2 by scaling rests, never window length.
**`?strikePin=<t01>`**: module-scope URLSearchParams parse exactly like `?wingDebug`
(dragon.js:22–28) → `timer.pin(t01)` freezes the schedule (0 = standing/hum frame; 0.5 =
mid-window strike peak); `tools/dragonstudio.mjs` gains a `strike` state — every gate round
pixel-comparable. Headless tests: same seed → identical schedule over 10k fixed-dt ticks; long-run
duty ±10%; window/rest/Hz floors; `pin()` idempotent.

**§5d The STORM TICK — the ONE guarded dragon.js addition (≤14 lines), the single writer.** Two
engine truths force single-writer architecture: (a) `spineMats` get the global WARM cruise rim
`0xfff0d8` (dragon.js:1183/222) — poison for a 255° family; (b) the flare loop's else-branch
RESETS every spineFlareMat's emissiveIntensity each non-surge frame (dragon.js:1174–1177), erasing
anything written earlier. So the arc mats sit in **NEITHER surge array**; one tick, keyed on
`parts.stormArcMats` existing (null for every other dragon — roster byte-identical), placed AFTER
the flare loop (jade pearl-mat precedent, dragon.js:1008–1017):
- writes the 3 bucket mats: `emissiveIntensity = hum(form)·breathe(t) +
  env01(t − 0.04·bucket)·(peak(form) − hum)`; hue-lerps `0xd9deff → 0xf2f4ff` at env>0.85 (the
  strike core, capped; the channel-clip law keeps the violet cast + the hue step a visible jump);
- kicks the dynamo (`coreGlow.userData.base` ×(1+0.5·env01) — the hook owns OPACITY, the tick only
  scales the base pre-read: one writer per channel);
- **owns Surge itself**: `player.feverActive` → continuous blaze at the caps + ≤3 Hz strobe
  alternating b2/b3 — never handed to the flare loop;
- drives the ±3% bay BILLOW (`parts.bayGroups`, fixed ω, phase-lagged) — deterministic, pinnable;
- fallback if the owner vetoes rig code: static hum + Surge-only blaze via flareMats (loses
  strikes — identity-critical, so the tick is the plan of record).

**§5e Full fever-palette override (every hostile default named with its dragon.js line).**
Defaults: `feverWing 0xff44cc` magenta (1135), `feverEye 0xff66ee` (1193), `surgeHi 0xfff8e8`
white-gold (1156), warm rim `0xfff0d8` on spineMats (1183–1186). The def block (Vesper
dragons.js:611–621 format):

| hook | value | why |
|---|---|---|
| `feverWing` | `0xd9deff`, membrane fever emissiveIntensity **≤ 0.30** | the frame IS the ignition — a black feverWing would leave a blazing skeleton on dead cloth; the membrane becomes the capped RECEIVER (frame out-reads it ~5:1), near-white lane, NEVER magenta |
| `wingEmissive` + `wingMembraneEmissive` | `0x000000` | kills the cruise/boost membrane-glow target (1130–1135) — cruise membrane stays diffuse cloud |
| `feverEye` | `0xe8ecff` | eyes blaze pale storm-white |
| `surgeHi` | `0xe8ecff` | every flared-mat lerp goes storm-white, never white-gold |
| `feverWash` | `[0.05, 0.055, 0.10]` | cold wash, under the godhead NaN/flash guards |
| `eye / apexEye` | `0xcfd8ff / 0xd9deff` | pale arc-white family |
| `apexSeam / coreGlow` (color fields) | `0xd9deff` | hue-lock ground truth |
| `trail / boostTrail` | `0x7a84b8 / 0xaab4e8` | cold trail family (surge `0xe8ecff`) |
| `fx.auraColor` | `'217,222,255'`, `auraIdle 0` | the underside halo comes from bloom off the vein strips — no sprite |
| `hideRiderGlow` | `true` | the garment owns the frame |
| `surgeMotes` | absent/false | the Surge spend is the blazing circuit, not motes |
| surge arrays | arc mats in NEITHER (single-writer tick); heart in flareMats for the hue lerp only | the warm-rim + else-reset dodge |

**§5f THE OVERDRAW CENSUS — recomputed for the always-lit garment (the biggest feasibility
shift, counted, not vibes).** The garment is **OPAQUE emissive geometry** — emissive is a shading
term on opaque triangles, NOT blending: an always-lit frame adds **ZERO transparent drawables and
zero fill cost** over the unlit version. CRUISE transparent = 1 dynamo core (coreGlow) + 1 virga
hem + 1 trail + **2 knife-edge bands (L/R meshes, one shared mat)** = **5 ≤ 6**. SURGE = + the
fever aura sprite = **6 ≤ 6 — AT the ceiling, zero slack**: `surgeMotes` stays banned, and the
NAMED FALLBACK if the p95 HUD flags is the knife-edge band dropping to opaque lit-slate (the
silver caps carry the rim read) → 4 cruise / 5 Surge. Max alpha layers along any chase ray: wing
ray = 1 (band) · tail ray = 2 (hem + trail) · heart ray = 1 — all ≤2 ✓. What always-lit ACTUALLY
costs is **BLOOM AREA**, and it is bounded: coverage ≤12% (§5a ladder, asserted) × hum ≤0.95 in
cruise; the strike lifts intensity (capped), never area. p95 honesty: worst case =
strike+boost-trail coincident — pre-degraded by the quality guard skipping new windows below
tier 1. Draws: ~18/pair wings, apex total ≤70 (creaturestress-checked).

## §6 The CHARGING ladder (4 forms — the bolt-frame matures, the garment brightens, the storm gathers)

Form names: **f0 Squall Pup · f1 Stormcell · f2 Thunderhead · f3 Tempest Unleashed.**
Drama 25/45/70/100. Every rung adds a CATEGORY (structure + light + a silhouette move).

| dial | f0 Squall Pup | f1 Stormcell | f2 Thunderhead | f3 Tempest Unleashed | assert |
|---|---|---|---|---|---|
| read | one soft cloud-bend, dim hum | first hard kinks, arm frame lights | the fork arrives, chest veins + crest light | the full garment, root-to-tip live | — |
| `kinkKnuckles` | 1 (K2 only, soft ~12°) | 2 (+K1) | 3 (+K3; breaks enter [18°,60°]) | 3 (fully hard) | exact {1,2,3,3}; band at f2/f3 |
| Y-FORK / spur | — | — | fork at K3 | fork + 2nd-order spur | {0,0,1,1}; spur f3-only |
| rays (dominant + aft) | 2 | 3 | 4 | 4 | ↑; decay ≤0.86× each |
| bay NSEG | 4 | 4 | 6 | 6 | ≥4 always |
| `arcRun` (circuit completeness) | 0.25 (dynamo + sternum veins) | 0.5 (+arm frame + spine to shoulders) | 0.75 (+to the fork + chest branches + crest) | 1.0 (every tip + spur + tuft full) | monotonic ↑ |
| `humFloor` (idle garment) | 0.30 | 0.50 | 0.70 | 0.90 | monotonic ↑; breathe ±15% fixed ω |
| glow coverage (strip-area frac) | 0.04 | 0.07 | 0.10 | 0.12 | monotonic ↑; ≤0.12 |
| `arcDuty` (strike duty) | 0.06 | 0.10 | 0.14 | 0.18 | monotonic ↑; long-run ±10% |
| strike peak / contrast vs hum | 1.2 / 4.0× | 1.6 / 3.2× | 2.0 / 2.9× | 2.4 / 2.7× | contrast ∈ [2.2,4.0] |
| burst windows / cluster | 1 | 1–2 | 2–3 | 2–4 | max ↑ |
| `heartScale` (dynamo) | 0.5 | 0.7 | 0.85 | 1.0 | monotonic ↑; ≤15% of cruise emissive |
| crest blades (lit ridges) | 0 | 2 | 4 | 6 | ↑; ×0.82 decay; tip node f3-only |
| `virgaWisps` / `tuftScale` | 2 / 0.3 | 3 / 0.5 | 4 / 0.75 | 5 / 1.0 | both ↑; wisp taper ≤0.20× |
| `wingBladePivots` /side | 0 | 1 (aft ray) | 2 (+branch prong) | 2 | {0,1,2,2} |
| `billowAmp` (bay groups) | 0 | 0.015 | 0.02 | 0.03 | monotonic ↑ |
| span : body | 1.7× | 2.0× | 2.25× | 2.5× | ↑, ±10%, apex ≤2.5 |
| eye : head | 36% round | 28% | 23% | 19% almond | monotonic ↓ |
| body hex (value ↓, hue ~222°) | `0x3a3f4a` | `0x333947` | `0x2e3543` | `0x293040` | **L ↓ AND ∈[0.20,0.26] every form** (L .259/.239/.222/.206) |
| head : body | 1:2.3 | 1:3.2 | 1:4.2 | 1:5.0 | ↓ |
| tri target | ~1.8k | ~2.7k | ~3.7k | ~4.9k | monotonic ↑, ±20%, <6000 |

Growth-verb asserts: CHARGING = `arcRun` ↑ + `arcDuty` ↑ + `humFloor` ↑ + coverage ↑ +
`kinkKnuckles` ↑ + the fork arriving + `heartScale` ↑ — charge accumulating in TREE, TIME, GLOW,
SHAPE, and SOURCE at once; the fork arrives at f2 exactly when `arcRun` reaches it (structure and
motif rung-locked). The value ramp DECREASES (the storm gathers darkness under the brightening
garment — the value scissor is the ladder's signature move) and is bracketed by the L≥0.20 floor.
Tri re-pin rationale (honest): §D's {1.8,2.6,3.6,4.7}k + ~200 apex tris of garment geometry
(veins ~50, spine ~60, crest strips ~30, bolt-tuft ~70) → {1.8, 2.7, 3.7, 4.9}k; the
silhouette-economics law still holds — the OUTLINE does the work, no padding back.

## §7 FEASIBILITY AUDIT (every element + motif + motion channel → cited path → overdraw → biggest risk → mitigation)

| # | element | engine construction path (cited) | overdraw | biggest risk | mitigation |
|---|---|---|---|---|---|
| T1 | `cumulonimbusTorso` clover loft | `cloverLoft` = knapLoft pattern (dragonVesper.js:106–131) + per-station rotation (fresh in-module helper) | 0 | rotated weave re-banding at low rot angles | rot ≥10°/station + per-column value bands; I1 colour gate on the pale backdrop |
| T2 | silver-lining rims + lifted belly | diffuse tiers, metalness 0.06 / envMapIntensity 0.3 (Vesper glassStreak "glints, never glows") | 0 | rims/belly out-reading the garment on a dark sky | envIntensity cap 0.3; belly is DIFFUSE (the halo is bloom off the veins); judged both backdrops at I1 |
| T3 | sternum dynamo | `parts.coreGlow` hook (dragon.js:1147–1151) + 5 opaque vanes + near-black recess floor (C8) | 1 (the sanctioned transparent) | the lantern creeping back (anti-reskin §3.3) | heart ≤15% of cruise emissive contribution (asserted); it is one node of a 5-limb garment, no apertures |
| T4 | sternum veins + spine circuit | opaque `arcSeam` tents welded to loft/spine sample nodes (C14) + inset grooves | 0 | strips floating off the billowing loft | generated FROM sampled nodes, never constants; groove-recessed so cruise reads carved-and-lit |
| SF1 | `boltArm` waypoint profile | `vesperArmY/Z` profile-as-function (346–356) + the waypoint-table method (C15) | 0 | **HEADLINE (a): the kinked outline collapsing to SAWTOOTH/COMB at 250px** | 3-knuckles-on-an-ARCH discipline, all machine-checked: exactly-3 breaks + single global Y-max at K2 + break band [18°,60°] + arch envelope ±0.06·hs + bays ≥4 seg, cusp ∈[0.25,0.45] + decay ≤0.86×; judged on the STANDING `pin(0)` rear crop FIRST at 2× pale |
| SF2 | ridge tents + silver caps | `ridge()` 4-face tents + caps (400–409) | 0 | caps out-glinting the garment | envMap cap 0.3; dim one notch if they out-read the hum |
| SF3 | Y-fork + decaying rays | finger-fan tips (386–393) + `lenFrac`; fork = welded node at K3 | 0 | fork reads as a 5th equal finger → comb | fork ONLY on the dominant; branch 0.62×, spur f3 0.52×; ≤0.86× decay asserted |
| SF4 | opaque membrane bays | bay bézier fan ≥4 seg, aft-biased sag (443–463) | 0 | sawtooth Vs between rays | NSEG ≥4 (6 f2+) + cusp ∈[0.25,0.45] (assert) |
| SF5 | knife-edge band | `edgeBand` ONE-strip (470–477) | +2 drawables (L/R, 1 mat) — the wing's only transparency | Surge census at ceiling 6/6 | counted (§5f); named fallback = opaque lit-slate band |
| SF6 | cowl + gusset shoulder | gusset arm-side anchors (482–491) + static cowl (540–562) | 0 | fold-tear across the K2 joint | arm-side-only anchoring; nothing spans the hand fold (C12) |
| SF7 | THE GARMENT (hum-lit frame + circuit) | Vesper seam-mat pattern (77–78) + DoubleSide (§6.5) + C14 weld + the §5d tick | 0 (opaque emissive) | **HEADLINE (b): the always-lit garment blowing the p95 / photosensitivity budget** | it adds ZERO transparency (opaque emissive, §5f) — the cost is bloom AREA, bounded by coverage ≤12% + hum ≤0.95 + peak caps; strike modulation depth SHRINKS vs withheld (contrast capped ≤4.0 from a lit base); ≤3 Hz / window ≥0.10 s / rest ≥1.2 s live IN pulseTimer; corridor emissive-clear at the pinned strike; duty/window are the levers, never intensity |
| SF8 | fork crackle-churn | `wingBladePivotsL/R` walker (dragon.js:852–859, hardcoded lag/sway) | 0 | membrane tear at the flutter boundary | boundary verts AT the pivot (C12); seam breathing ≤0.012 asserted; sway ≤0.14 rad under the shoulder beat |
| SF9 | fold at K2, span ≤0.66 | wingParts fold pose + contraction assert | 0 | prong poking through folded membrane | nest clearance 0.02 in the builder; flapstrip 5-phase + fold pin |
| SF10 | rear-read measurement | tip markers + `rearfit` black-fill (silhouetteCore.mjs:90) | offline | kinks measured in the wrong projection | Y-breaks asserted in rear X-Y; the Z ogee in TOP planform separately |
| H1 | stormbrow crest (glowing) | tent-wedge blades (Vesper CP5 ear pattern) + module-level tip fn + `arcSeam` ridge strips | 0 | crest tips tangent vs the wing leading edge; picket-fence-of-light | no-tangents assert (gap ≥0.08 OR overlap ≥0.05, glide AND bank); glow decays ×0.8 down the rank, ONE `arcCore` tip node f3 |
| H2 | eyes | Vesper octahedra (748–755) | 0 | out-shone by the crest | eye intensity rides glowLevel; crest strips capped below eye luminance at f0–f1 |
| V1 | virga tail + bolt-tuft | isBone chain (785–795) + tents + ONE hem band + fan-built tuft | 1 (hem) | tuft reads as a sprite/blob | faceted interleaved tongues, index-hash jitter, `arcCore` tips only (C6: the fire has a body) |
| M1 | `js/pulseTimer.js` | NEW pure module; bossRhythm.js architecture; integrated-phase law (dragon.js:62) | none (CPU) | headless/live schedule drift | fixed-dt tests + `pin()`; no wall-clock reads |
| M2 | the storm tick (single writer) | guarded ≤14-line block AFTER the flare loop; keyed `parts.stormArcMats` (jade precedent 1008–1017) | 0 | the else-reset (1174–1177) / warm rim (1183) clobbering the garment | arc mats in NEITHER surge array; tick after the loop; one writer per channel (heart: hook owns opacity, tick scales base) |
| M3 | fever firewall | full §5e table — every default named with its line | — | ONE missed hook = magenta/white-gold leak | §9 simulates the surge-tick values; every fever emissive ≤0.12 sat OR 255°±20 |
| M4 | photosensitivity + glare | caps IN pulseTimer + peak caps + contrast band [2.2,4.0] | — | the pinned strike blooming over the corridor | ±10° corridor emissive-coverage assert at `pin(0.5)`; no full-screen flash in cruise (feverWash Surge-only, under shipped guards) |

**Q(a) — the anti-sawtooth kink discipline: does a hand-authored kinked leading edge stay a BOLT
(3 knuckles on an arch) and never decay into a zigzag/comb? YES — because the discipline is
construction + five independent machine checks, not taste.** The arch envelope (±0.06·hs of the
smooth gull curve) guarantees the macro line reads WING before the eye finds the breaks; exactly-3
breaks + a single global Y-max at K2 makes a zigzag structurally unrepresentable; the [18°,60°]
band keeps every break visible-but-anatomical; the ray mid-breaks (8–14°, alternating) rhyme with
the hero without competing; the bays' ≥4-seg cups + ⅓ cusps kill the triangle-teeth read between
rays. All five are §9 asserts, and every gate judges the STANDING rear crop first at 2× on the
pale backdrop — if the outline needs its lightning to read, it fails before the strike frame is
even graded.

**Q(b) — does the ALWAYS-LIT garment stay inside the p95 overdraw + photosensitivity budget?
YES — because "lit" is free where it matters and bounded where it isn't.** Overdraw: the entire
garment is opaque emissive geometry — emissive is shading, not blending, so the always-lit frame
adds ZERO transparent drawables and zero fill over an unlit build; the census stays 5 cruise /
6 Surge (§5f, ceiling hit by the pre-existing band+aura, with the band's opaque fallback named),
alpha ≤2 on every ray. The true cost is BLOOM AREA: bounded by the coverage ladder (≤12% of
surface, asserted by strip-area sum) × hum ≤0.95, with peaks capped (arcSeam ≤2.4 / arcCore ≤2.0
/ heart ≤1.6) and the strike lifting intensity, never area. Photosensitivity IMPROVES over the
withheld doctrine: the old scheme flashed dark→bright (maximum modulation depth); the garment
strikes from a lit base with contrast capped ≤4.0×, and the hard caps (window ≥0.10 s, rest
≥1.2 s, ≤3 Hz modulation, Surge strobe ≤3 Hz) live INSIDE pulseTimer where no call site can
defeat them. The genuinely human residual — whether a 0.90-hum apex reads charged-and-alive or
neon-sign — rides the preview with named levers (§10).

## §8 BUILD INCREMENT PLAN (coexist → hero → ladder; one fresh harsh Fable gate per increment; COLOUR from the first geometry)

- **I0 — stub + `pulseTimer.js` + `?strikePin` + calibration.** Roster key `tempest` (fully
  additive; roster byte-identity proven by multiset `comm -3` compare of sorted tricount FORM
  rows — the naive diff lies); `js/dragonTempest.js` skeleton with 4 registered
  contract-satisfying placeholders (`coreGlow:null` crash-guard stub until I1; `horn`/`scales`
  def hexes; `lanceTint`/`lanceRune` — the SSSR invariants). LAND `pulseTimer.js` + determinism
  tests + `?strikePin` + the dragonstudio `strike` state — timed-spectacle tooling before any
  lightning exists. Gate calibration on **Vesper AND Solar** tiles with the twin veto (*"black
  Vesper clone or gold-regalia Solar?"*) + the anti-reskin veto locked into the rubric; add the
  C-GUARD `holeMetric ≈ 0` assert.
- **I1 — `cumulonimbusTorso` + the dynamo + the body circuit.** Clover loft + silver rims +
  lifted belly + cowls + the caged dynamo on coreGlow + sternum veins + spine circuit at hum.
  FIRST COLOUR GATE (never silhouette-only — the Revenant's costliest miss): the weave reads
  billowed cloud; the hum reads charged-alive on the game-lit tile (verify the charcoal L band
  under the real key, not the swatch); the dynamo reads a generator behind vanes, not a lantern;
  the belly halo blooms soft, no sprite.
- **I2 — `stormforkWings` (the HERO).** boltArm frame → fork → rays → bays → caps → glowing frame
  at hum → knife-edge → churn pivots → fold. Gate: the STANDING rear crop first (BOLT, not
  sawtooth, not venetian anything) at 250px AND the 2× pale crop; kink/fork/decay asserts green;
  wingsymprobe Δ0.000; trio frame vs Vesper + Stiletto-concept; the anti-reskin veto.
- **I3 — `stormbrowHead` + `virgaTail`.** Ram-prow + bosses + glowing crest (no-tangents green) +
  eyes; tail chain + fringe + hem + THE BOLT-TUFT. Gate: crest punctuation + tuft point-of-light
  read at chase; fringe wispy-tapered (the Tocsin separator); tail-ray alpha ≤2.
- **I4 — THE FULL GARMENT + strikes + Surge + the fever firewall.** Buckets wired, the storm
  tick, hum ladder, strike travel, boost duty ×2.2, "the Tempest breaks," the FULL §5e override
  table. Gate: the three-state ruling on PINNED frames — hum (`pin(0)`: a dragon wearing
  lightning, garment distribution ≥45% wing-frame / ≤15% heart), strike (`pin(0.5)`: root→tip
  travel + contrast ∈[2.2,4.0] + corridor clear), Surge (the break, ≤3 Hz); the overdraw recount
  (5/6); the firewall hue proof through the real tick math.
- **I5 — the CHARGING ladder + `tests/starters.mjs`.** `forms[]` accretive ×4 + the §9 block +
  tricount ladder + the full capture set (all forms; states glide/fold/bank/surge/**strike**/
  **hum**; 3 backdrops; roster neighbour frames incl. Solar). Gate: full-ladder verdict; then the
  PR preview carries §10's residuals.

Each gate is a FRESH high-effort Fable spawn judging real captures against THIS contract; FAIL →
numbered directives applied verbatim; the builder never judges its own output. The owner's
reference/screenshot outranks this sheet — deviations rebuild to the picture and log the delta.
THE RULE: a new lesson file per increment that changes the creature.

## §9 `tests/starters.mjs` SPEC — the `tempest` 4-form block (mirrors the Solar/Molten premium blocks at starters.mjs:281/:326; Molten donates the corridor-scan pattern)

Headless via `buildDragonModel` + `ascendedDef(def, t)`, t = 0..3; silhouette asserts import
`renderSilhouette` + `holeMetric` from `../tools/silhouetteCore.mjs`; pulseTimer imported directly.
- **Contract:** `maxTierFor('tempest') === 3`; forms accretive length 4; contract fields
  untouched; NaN-vertex guard (Molten pattern).
- **TRIS:** monotonic ↑, ±20% of {1.8k, 2.7k, 3.7k, 4.9k}, all <6000.
- **PROFILE SHARED:** tip-marker + `wingElements` positions equal `boltArm()` evaluations — one
  module-level function, no duplicated formula.
- **KINKS (arch-not-zigzag):** interior slope-break count of the leading edge in REAR X-Y
  projection = {1,2,3,3} exact; at f2/f3 each break ∈ [18°,60°], K1 ≥20°, K2's break the max,
  single global Y-max at K2, waypoint Ys within ±0.06·hs of the smooth arch; the Z ogee asserted
  in TOP planform.
- **FORK:** {0,0,1,1} on the dominant ray only; spur f3-only; fork vertex a shared welded node;
  ray + prong lengths each ≤0.86× the previous.
- **BAYS:** every membrane arc ≥4 seg (≥6 at f2/f3); cusp ∈ [0.25,0.45]× peak sag; the
  fork-crotch bay OPEN at the trailing edge; **C-GUARD:** `holeMetric` enclosed-hole count ≈ 0 on
  every view/form (≤ the ~2% aliasing floor).
- **NO-TANGENTS:** every crest-blade tip (module-level tip fn) vs the wing leading edge: gap
  ≥0.08 OR overlap ≥0.05, at glide AND bank poses.
- **CHARGING:** `arcRun` {0.25,0.5,0.75,1.0} · `arcDuty` {.06,.10,.14,.18} exact ·
  `humFloor` {0.30,0.50,0.70,0.90} · coverage {0.04,0.07,0.10,0.12}±0.02 ≤0.12 (strip-area sum) ·
  `heartScale`/crest-blades/`virgaWisps`/`tuftScale`/`billowAmp`/`glowLevel` monotonic ↑ ·
  span:body {1.7,2.0,2.25,2.5}±10% ↑ apex ≤2.5 · eye:head ↓ {36,28,23,19}%±3.
- **THE GARMENT (replaces the retired withheld asserts):** at `pin(0)` surge-off — every bucket
  mat's intensity within ±10% of `humFloor(form)`; garment distribution by summed
  `emissiveIntensity × luminance(emissive)`: wing-frame buckets ≥45%, dynamo ≤15% (the
  anti-lantern lock); every membrane/cap/tent/body diffuse mat emissive `0x000000` (inventory
  assert — silver caps machine-checked diffuse). At `pin(0.5)`: bucket luminance ratio vs
  `pin(0)` ∈ [2.2, 4.0] (the contrast band); corridor emissive-clear; coverage unchanged (strikes
  lift intensity, never area). **RETIRED (named so nobody re-adds):** the ≤0.06 ember floor · the
  "heart+eyes ≥85%" cruise assert · `feverWing === 0x000000` · all deck/anvil/slit-era asserts.
- **CHARCOAL LAW:** resolved `def.body` HSL-L strictly DECREASING AND ∈ [0.20,0.26] at every
  form; hue drift ≤8° around ~222°; belly `0x566384` lighter than body; zero warm diffuse (hue
  <90° or >330° at sat >0.2 → fail); zero gold-family. Assert the ramp on RENDERED medians too
  (monotonic under ACES — tonemapping compresses the ends; C6).
- **ACCENT LAW:** every emissive hue within ±20° of 255° OR sat ≤0.12; exactly ONE mat with
  emissive sat <0.06 (`arcCore`), absent from both surge arrays.
- **STRIKE DETERMINISM:** same seed → identical schedule over 10k fixed-dt ticks; long-run lit
  fraction ±10% of `arcDuty`; window ∈ [0.10,0.28] s; rest ≥1.2 s; ≤3 Hz within-window;
  `pin(t01)` reproduces the same state every call.
- **FEVER FIREWALL:** simulate the surge-tick values — all fever-state emissive hues ∈ 255°±20 OR
  sat ≤0.12, no hue in 280–340° at sat >0.2 (never magenta); `feverWing === 0xd9deff` with
  membrane fever emissiveIntensity ≤ 0.30; `feverEye`/`surgeHi === 0xe8ecff`; `trail/boostTrail`
  from the def.
- **CORRIDOR (Molten pattern, starters.mjs:326):** glide pose ±10° forward corridor contains NO
  wing/arc vertices at any form; at `pin(0.5)` no emissive-mat vertex inside it.
- **MOTION / RIG:** def dials `rootAmp > midAmp > tipAmp` AND (mid+tip)/sum ≤ 0.28; measured
  named-pivot amplitude table over N frames (± ranges, never point samples): |pivot| > |mid| >
  |tip|; `wingBladePivotsL/R` lengths {0,1,2,2}; flutter-boundary seam breathing ≤0.012 at walker
  extremes; fold contracts span ≤0.66; wingsym Δ0.000 (`tools/wingsymprobe.mjs`); tail publishes
  4 isBone-rooted joints; motif anchor drift ≤0.15 pre-scale; `spinePoints` ≥2 inflections; wisp
  tip taper ≤0.20×.
- **FIREWALL IMPORTS:** `dragonTempest.js` contains no
  `dragonOrganism|dragonNightFury|dragonUnifiedHull|growSkinnedExtension|sweepProfileSmooth`
  (import statements, not prose); `pulseTimer.js` imports NOTHING from `js/` (purity assert).

## §10 Verification harness + gate-blind residuals

Per DRAGON-DESIGN §8/§9, per increment and in full at I5:
1. Suites green: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` (FULL roster) ·
   `node tests/starters.mjs` · `node tools/creaturestress.mjs --ci` (≤70 draws).
2. Studio: `node tools/dragonstudio.mjs tempest` — all 4 forms; states glide/fold/bank/surge +
   **`strike` (pinned 0.5)** + **`hum` (pinned 0)**; fixed angles (rear chase / side / rear-¾ /
   top planform); three backdrops — PALE is the kink/outline judge, warm-gold is the cold-glint
   stress tile (do the silver caps + garment stay cold?), dark-sky is the bloom/halo judge.
3. Black fills: `tools/silhouette.mjs tempest rear|rearfit|top [form]` (+ `--wings-only`) — kink
   counts + fork notch + C-GUARD numbers ride every gate round.
4. Motion: `tools/flapstrip.mjs` 5-phase corridor (±10° empty at ALL phases + folded);
   `tools/wingsymprobe.mjs` Δ0.000; the named-pivot amplitude table; frozen-extreme clock check
   (top ~12:00–12:30, bottom ~5:00, never 6:00).
5. Three-state proof: matched PINNED triple — hum / strike / Surge on one dark sky (the seamprobe
   pattern through the real storm-tick math).
6. In-game: `tools/gameshots.mjs` (`?cleanshot&strikePin=…`) — chase idle, mid-bank, tier-up;
   integration judgment only.

**Named gate-blind residuals (the human judges on the PR preview — the gate cannot):**
- **Hum brightness feel:** does the 0.90 apex hum read as a charged living garment or a neon
  sign? Levers: humFloor down ONE step (0.90→0.80) before touching coverage; never dim the strike.
- **Strike-on-hum drama:** at contrast 2.7× (apex), does the strike still land as an EVENT? Lever:
  widen the strike window toward 0.28 s (duty-preserving) before raising peak caps.
- **The standing-frame kink read at speed:** BOLT vs "damaged wing" in motion at 250px — levers:
  sharpen K2 toward 55°, deepen the crotch notch; never add a 4th kink.
- **Fork flutter feel:** stepped-leader shiver vs nervous wobble (walker lag is hardcoded; the
  ≤3-line nullable dial follow-up stays flagged).
- **Surge census at 6/6:** zero slack — if p95 flags, the knife-edge band drops to opaque
  lit-slate (named fallback).
- **Photosensitivity in real play** (owner call): caps are in the module; whether 0.18 duty over
  a 10-minute run feels aggressive is a human ruling.
- **Grey-sky legibility:** the hum garment now CARRIES the charcoal body on the dust-haze biome
  (the inverse of the v2 worry) — confirm it doesn't over-carry (the body must still read as mass,
  not a wireframe).
- Storm SFX tie-in (default OFF) · the billow ±3% (alive vs breathing-balloon; fallback: cut).

## SETTLED (v3 — do not re-litigate)
- **THE GARMENT IS PRESENT (2026-07-14, owner reference):** the circuit hums in cruise
  (humFloor 0.30→0.90, breathing), strikes are PEAKS (contrast 2.2–4.0×), Surge is the break.
  This deliberately supersedes v0–v2's "withheld / intermittent-only" doctrine — recorded, with
  the reference image as the authority. Never dark-and-dead; never Solar-static.
- CHARCOAL L 0.20–0.26, never Vesper-black; near-white passes by SATURATION cap (≤0.12), never
  hue collision; `arcCore` is the ONLY sat<0.06 emissive.
- The membrane and all body surfaces are OPAQUE and diffuse in cruise; the garment is opaque
  emissive COMPONENT geometry; the wing's only transparency is the knife-edge band.
- THE STORMFORK is the native hero: 3 kinks on an arch (never a zigzag), Y-fork at K3, decay
  ≤0.86×, fold at K2 ≤0.66.
- The §C anti-reskin guard at full strength (bone/cage/lantern-topology/bat-membrane/bleach), with
  the ≤15%-heart + `holeMetric ≈ 0` machine locks.
- `pulseTimer.js` lands here, pure + deterministic, photosensitivity caps in-module; the storm
  tick is the single writer; arc mats live in neither surge array.

## Open owner calls (flag on the build PR)
1. **Name** — "Thunderhead Tempest" (recommended); alternates Squallmarch · Stratovyr.
2. **Cost/slot** — 2600 proposed.
3. **Hum ceiling + strike cadence** — humFloor 0.90 apex + duty 0.18 + ≤3 Hz proposed; owner may
   cap harder (photosensitivity policy shared with Tocsin).
4. **Storm SFX tie-in** — distant-thunder rumble on f3 strikes (cross-discipline; default OFF).
5. **How bright is too bright** — the garment vs the canyon dust-haze; rides the PR preview.

---

## APPENDIX — design history (superseded; DO NOT build from here)

Everything below is the frozen v0→v2 stratigraphy: the original concept (§0–§12), the strata-deck
era and its §R/§F critic passes, the v1 §B build sheet, the §C Revenant-carryover triage, and the
§D Stormfork patch — kept verbatim because its research, critic verdicts, and engine finds are
real history, but **every load-bearing number now lives in the v3 contract above**, which wins
wherever the two disagree. Section numbers below (§0–§D) are internal to this appendix.

### [ARCHIVED v0–v2 SHEET BEGINS — superseded by the v3 contract above]

The builder's contract for a bespoke, low-poly, premium **living-thundercloud drake** — the storm/tempest
lane (Kushala Daora's wind-tyrant presence + Amatsu's storm-mass + Kirin's bio-electric arc language,
mined for authenticity, copied from none). One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`).

> **⚠️ HARD DIRECTIVE — this is NOT a second Vesper.** Both are dark, cool premiums; the sheet holds
> three hard separators by construction: (1) **CHARCOAL, never black** — body L ≈ 0.20–0.26, roughly 2×
> Vesper's L ≤ 0.10; (2) the lightning is **near-white, BRANCHING, and INTERMITTENTLY LIVE in cruise**
> (a flicker duty cycle), the opposite of Vesper's withheld single-hue Surge-only seam; (3) the wing is a
> **stacked strata deck** (three cloud-bank slabs per side), nothing like the single scallop crescent.
> Vesper's "zero near-white emissive" is a VESPER law, not a roster law — the near-white strike IS
> Tempest's identity, and near-white was an unowned emissive lane (Pearl's white is diffuse body).

> **⚠ 2026-07-14 — WING SUPERSEDED (owner decision):** the strata-deck wing was REJECTED on
> aesthetics; from a 5-alternative menu the owner chose **§D — THE STORMFORK ("BOLTFRAME")**, rear
> read **BOLT** — the wing whose skeleton IS a frozen branching lightning bolt. Separator (3) above
> now reads: *the wing is a kinked bolt-frame, the only angular-stepped outline in the game —
> nothing like the single scallop crescent.* §5 / §R / §F / §B.3b and the wing rows of
> §B.4/§B.5/§B.6/§B.8 remain below as HISTORY; where anything conflicts with §D, **§D wins.**
> Everything non-wing (charcoal body, Storm Circuit + dynamo + pulseTimer, CHARGING, head, tail,
> palette/stats/cost, §C carryover + anti-reskin guard) survives verbatim.

**Prior art — the concept is PROVEN in shipped games (owner requirement):** the storm/lightning dragon
is a battle-tested archetype, not a novelty. **Monster Hunter** — *Kushala Daora* (the steel-plated wind
tempest, "Wings of Steel," wraps itself in a gale barrier) and *Amatsu* (the storm elder dragon).
**Genshin Impact** — *Dvalin / "Stormterror,"* the Anemo storm dragon and its first-act boss.
**Pokémon** — *Zekrom* (the electric Dragon legendary) and *Rayquaza* (the sky/ozone dragon).
Thunderhead Tempest occupies this validated lane with a fresh SILHOUETTE (stacked strata decks) and a
fresh SPECTACLE (intermittently-live charge), copied from none.

**Read first:** `DRAGON-DESIGN.md` (laws, wing kit, failure classes), `VESPER-NIGHTGLASS-BUILDSHEET.md`
(the proven premium sheet + faceted-assembly pattern), `PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b
(9 required fields · premium inversion of law 12 · the overdraw p95 budget), and the banked wing recipe
in `leapfrog/lessons/2026-07-12-vesper-cp1-fingered-batwing-rework.md` (knuckled leading edge, dominant-
plus-decay fingers, inward-cupped bays ≥4 seg, value-tier endpoints). Numbers here are the authority;
the Fable gate judges against this sheet.

---

## 0. Identity contract
Fresh roster key (working `tempest`) — fully additive, nothing shipped changes.
`name:'Thunderhead Tempest'` · `title:'The gathering storm'` · `rarity:'SSR'` / `maxRarity:'SSSR'` ·
`cost: 2600` (owner may re-slot) · `stats { speed 1.12, handling 1.14, drain 0.86, regen 1.16 }`
(a front that keeps coming — pace + endurance, under the 1.16/1.28 caps) ·
`fx.auraColor '217,222,255'` (storm-white, cold) · `forms[]` accretive, length 4 · `maxTierFor === 3` ·
`hasStyle` (Surge stays a WHITE-VIOLET storm, never magenta) · `accentHue: 0xd9deff`.

**Frozen identity laws:**
- **The storm is alive, not lit.** Cruise read = churning charcoal mass with silver-lined rims; the
  lightning FLICKERS (short strike windows), it never holds. *"Vesper withholds; Tempest threatens."*
- **Charcoal, never black; near-white, never warm.** Body L 0.20–0.26 held; zero warm hues anywhere.
- **Everything churns.** Strata decks phase-lag, the mane streams, virga wisps trail — motion IS the
  cloud read (dial-driven, bespoke, no photocopied flap block).
- **Build vehicle:** NEW `js/dragonTempest.js`, faceted/billowed assembly family. Forbidden imports:
  `dragonOrganism.js`, `dragonNightFury.js`, `dragonUnifiedHull.js` (the retired smooth-hull family).

## 1. Art direction (north star)
**THE GATHERING STORM — a thunderhead that decided to hunt.** A cumulonimbus given a predator's line:
billowed charcoal cloud-masses with bright "silver lining" rims, and a branching near-white storm
circuit that arcs across the wing decks in short, live strikes — more often, longer, brighter as it
ascends. Solar wears spectacle as a crown, Vesper withholds it; **Tempest is spectacle BUILDING** — you
watch the charge accumulate. Anchor: charcoal slate `0x232836` (apex). Accent: storm-white
`0xd9deff` (~255° at sat ≈ 0.09 — reads WHITE with a cold violet cast), emissive-only. Hero: **THE
STRATA STORM-FRONT** (the triple-deck wing). Motif: **THE STORM CIRCUIT** (the branching intermittent
arc-tree). Growth verb: **CHARGING**. One word: **IMMINENT.**

## 2. Silhouette language
Primitive: **a forward-high storm wall on a lean chassis** — the wing decks stack UP and slightly
FORWARD over the shoulders (the shelf-cloud roll), the body a lean horizontal mass beneath, the tail
trailing rain. Line of action: neck rises INTO the wall (chest proud, head slightly low under the
overhang — a storm front leads with its shelf), tail counter-drops then flicks up at the terminus.

**The signature outline — THE STRATA STACK.** In rear black-fill: each wing is THREE distinct
cloud-bank slabs with clear daylight slits between decks (gap ≥ 0.12× deck chord at the root, opening
outboard) — a silhouette with horizontal STRATIFICATION no roster dragon has. Nameable at a glance:
*"the triple-deck storm wing."* Centerline punctuation: the nimbus mane spikes (top) and the 5-wisp
virga fringe (bottom).

**Distinctiveness gate (no >1 shared cell in any column pair):**

| Axis | Solar | Vesper | Pearl | Azure | Phoenix | **Tempest** |
|---|---|---|---|---|---|---|
| Region | top-heavy head crown | lateral spread | forward halo-knight | compact falcon comb | bottom-heavy train | **forward-HIGH strata wall (shoulder mass)** |
| Tone lane | indigo + antique gold | matte blue-BLACK L≤0.10 | holy white diffuse | powder blue | warm gold/crimson | **CHARCOAL slate L 0.20–0.26** |
| Wing | vault-bays + lances | single scallop crescent | up-raised feather-scale | falcon primaries | feather ranks | **3 stacked strata decks, slit gaps** |
| Motif | ring + gem | withheld inset seam (Surge-only) | crown-halo | diffuse ice seam | coal arc | **branching arc-tree, INTERMITTENTLY LIVE in cruise** |
| Glow hue | violet 262° | ion 223° withheld + green eyes | white-gold | pale ice (mostly diffuse) | warm triad | **near-white 255°/sat 0.09 (the unowned value lane)** |
| Growth verb | coronation | knapping | — | — | rebirth | **charging** |

**Retired by this sheet (housekeeping):** silhouette region **stacked-strata / multi-deck wing** · tone
lane **charcoal storm-grey** · emissive lane **near-white intermittent** · verb **charging**.

## 3. Motif — THE STORM CIRCUIT (branching arc-tree; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor: the STORM HEART** — a recessed emissive node at the sternum where the wing-arm roots
meet (never moves, never re-hues). From it the circuit BRANCHES: heart → scapular arms → along each
deck's underside seam → (apex) out the deck fingers + down the tail stem. All arcs are **inset opaque
emissive seams and thin ridge filaments** (the Vesper §3 anti-tacky kit: geometry-carried light, no
additive shells, no sprites, every element ≥8px at chase).

- **Hue lock: storm-white `0xd9deff`** (near-white, cold violet cast; strike core `0xf2f4ff`, capped —
  ACES blooms it clean). **Anti-collision:** the only near-white EMISSIVE identity in the roster
  (Pearl's white is diffuse body + blue seams; Vesper bans near-white for itself). Dim ember floor
  between strikes: `0x8a92c8` at intensity ≤ 0.18 so the carved circuit reads as geometry, not glow.
- **INTERMITTENTLY LIVE (the load-bearing difference from Vesper):** a deterministic CPU strike timer
  (headless-testable, seeded) opens strike windows of 0.10–0.28 s. **Cruise duty ≈ arcDuty per form
  (0.06→0.18)**, biased to fire on the downstroke apex; boost raises duty ×2.2; **Dragon Surge = the
  Tempest Unleashed** (continuous blaze + fork-strobe ≤ 3 Hz — see the photosensitivity cap, §10.6).
- **4-step bloom (`arcRun`, mesh + light gated per form):** **f0** — the heart node only, a dim pulse
  (duty 0.06, no branches). **f1** — circuit carved heart→shoulders, first live strikes cross the
  scapulars. **f2** — circuit reaches each deck's mid-seam + the first FORK per branch; strikes now
  visibly BRANCH. **f3** — the full fractal tree: deck fingers, tail stem, second-order forks, mane
  filament tips (charge-hair) — and the strike travels root→tip over ~0.12 s (per-segment ramp, the
  Vesper seam-run pattern at 6× speed).
- **Rear-chase carrier:** the circuit lives ON the wing decks + tail stem — dead-center of the chase
  frame by construction (§1 primacy).

## 4. Torso — `stormcellTorso` (billowed lobe assembly; rings dead by construction)
A **billowed cloud-loft**: 6 stations, each station a clover of 3 overlapping soft lobes (N=9 merged
profile) whose lobe seams are ROTATED ±10–14° station-to-station, so the visible grain is a diagonal
turbulence weave — never lateral rings, never a smooth hull. Chest deepest at the wing-arm root
(shoulder:waist ≈ 1.55), lean waist, haunch swell 0.8× chest. Value tiers: dorsal storm-shadow
`0x2a2f3c` → flank `0x323744` → **silver-lining rim band** on every lobe's upper edge (diffuse
`0x9fb0c8` + fresnel rim, non-emissive — "the sun behind the cloud", the L140 warm-sky-safe glint).
Belly rain-slate `0x4a5468` (banks read). Matte: metalness 0, roughness 0.85, envIntensity 0.18.
Publishes the full attach contract + `spinePoints` + `motifAnchor` (sternum) + `coreGlow: null`.

## 5. Wings — the HERO: THE STRATA STORM-FRONT (triple-deck slab stack)

> **SUPERSEDED by §D (owner decision 2026-07-14).** The strata-deck was rejected; the hero wing is
> THE STORMFORK (§D.2 `stormforkWings`). Kept as history.
Each wing = **3 stacked cloud-bank DECKS** (bottom deck dominant, then ×0.80, ×0.64 above — law-5
decay), each deck built on the banked CP1 bat-wing recipe re-authored as weather:
- **Per deck:** a knuckled leading edge (gull arch in Y, ogee in Z — never a straight bar), **4 rolling
  cloud-finger ridges** radiating from the deck's carpal (dominant + `lenFrac [1, .80, .62, .46]`),
  **inward-cupped bays sampled ≥4 segments** (the sawtooth killer), and 4 membrane value tiers lerped
  toward lit steel-slate `0x8a95ac` over f `[0.60,0.40,0.22,0.06]` (the CP4 endpoint law — tiers must
  step ≥0.05 luminance, not compress into one grey).
- **Deck stacking (ANTI-LOUVRE — see §R2):** vertical gap ≥ 0.12× chord at root opening to 0.22 at
  tip; upper decks set BACK 0.10× chord per level AND each deck ×0.80 shorter than the one below, so
  the stack reads as a TAPERING ANVIL CONE (stepped thunderhead narrowing upward), never three
  parallel slats. The bottom deck leads (shelf-cloud roll-forward); the outline is triangular-stepped.
  The inter-deck slits are the planform signature — assert true through-gaps in top silhouette AND
  assert monotonic deck-chord decay (no two decks within 10% chord — the venetian-blind killer).
- **Deck undersides carry the circuit seams** (§3) — light pools INSIDE the stack during strikes: the
  storm's interior flicker, the single best "living cloud" frame.
- **Opaque decks.** No translucency anywhere on the wing (3 stacked alpha layers would blow the ≤2
  overdraw law by construction — so the decks are opaque matte with fresnel silver rims; the see-through
  reads come from the slit GAPS, which cost zero fill).
- **Join hidden, never welded:** deck roots buried in the torso flank under a scapular STORM COWL
  (2 billowed lobe-plates per side, the Vesper cowl trick re-clothed).
- **Churn (motion IS identity):** decks ride the `wingParts 3` cascade with a BESPOKE per-deck phase
  lag (deck 2 lags 0.12, deck 3 lags 0.24 behind deck 1) + a slow independent billow scalar (±3%
  scale breathing, CPU) — the stack visibly CHURNS in cruise. Dials: `flapBias 0.82, flapAmp 0.8,
  glidePow 1.9, deckLag 0.12, billowAmp 0.03` — no roster dragon shares this block.
- **Numbers:** apex span:body **2.6×** · apex single-wing area:body side-area **1.0×** · sweep 18° back
  · dihedral 14° (bottom deck; +6° per deck above) · fold contracts measured span to **≤ 0.66** (decks
  nest as they sweep aft — the stack collapses into one storm bank, a real silhouette change).
- Canonical +X wing; `scale.x = -1` OUTER wrapper mirror (parent of the pivot — rotate-then-flip);
  publishes `wingPivot/Mid/TipL/R` + tip marker duplicating the deck-1 vertical profile.

## 6. Head — `thunderheadManeHead`
A blunt RAM-PROW wedge (~14 facets, heavy brow shelf, short muzzle — the storm leads with its
forehead), **no horns**; instead the **NIMBUS MANE**: swept-back cloud-spike filaments off the occiput
(0→2→4→6 up the ladder, lengths ×0.82, canted ±8° off-sagittal so they read from behind). At f3 the
mane tips carry the finest circuit filaments (charge-hair — static risen to the tips). Eyes: pale
arc-white `0xcfd8ff` (the brightest facial point), ladder 36% round → 28% → 23% → **19% almond**.

## 7. Tail — `virgaTail`
A tapering storm-stem (isBone 4-joint nested chain, −anchor rest-pose compensation, rotation-only
drive) ending in the **VIRGA FRINGE**: 2→3→4→5 rain-streamer wisps (thin tapering blades, lengths
×0.80, tips fading via a single-layer translucent hem band) + an arc terminus stud that joins the
circuit at f3. Tail motion: `tailWhip` with a LOW lateral coil + a pronounced vertical shudder on
strike frames (`tailLagScale 0.12, tailUndulateX 0.30, strikeShudder 0.05`) — the storm rolls.

## 8. The CHARGING ladder (4 forms — each rung accumulates charge + weather mass)
Form names: **f0 Squall Pup · f1 Stormcell · f2 Thunderhead · f3 Tempest Unleashed.**
Drama 25 / 45 / 70 / 100. Every rung adds a CATEGORY (mass + light + a silhouette move).

| dial | f0 Squall Pup | f1 Stormcell | f2 Thunderhead | f3 Tempest Unleashed |
|---|---|---|---|---|
| read | one soft cloud-bank, dim heart | second deck, first live strikes | third deck, forking arcs | the full storm wall + fractal tree |
| `strataDecks` / wing | 1 | 2 | 3 | 3 (+ finger detail + billow) |
| `arcRun` (carved circuit) | heart node | 0.5 (to shoulders) | 0.75 (deck mid-seams + forks) | 1.0 (fingers + tail + 2nd-order forks) |
| `arcDuty` (cruise strike duty) | 0.06 | 0.10 | 0.14 | 0.18 |
| `maneSpikes` | 0 | 2 | 4 | 6 |
| `virgaWisps` | 2 | 3 | 4 | 5 |
| span : body | 1.7× | 2.0× | 2.3× | 2.6× |
| eye : head | 36% round | 28% | 23% | 19% almond |
| body hex (value ↓, hue held) | `0x3a3f4a` | `0x323744` | `0x2a303d` | `0x232836` |
| head : body | 1:2.3 | 1:3.2 | 1:4.2 | 1:5.0 |
| tri target | ~1.9k | ~2.8k | ~3.9k | ~5.2k |

Asserts: tris monotonic ↑ · `strataDecks`/`arcRun`/`arcDuty`/`maneSpikes`/`virgaWisps` monotonic ↑ ·
body value monotonic ↓ · span:body monotonic ↑ · eye:head monotonic ↓. Apex superiority is
SHAPE-COMPLETION (only f3 has the full wall + full tree), never scale alone.

## 9. Palette (two-tone cold discipline)
- **Anchor (charcoal slate, hue ~222° desat, L 0.20–0.26):** ramp `0x3a3f4a → 0x323744 → 0x2a303d →
  0x232836`. Belly `0x4a5468`. Silver-lining DIFFUSE rims `0x9fb0c8`. Deck tier endpoint `0x8a95ac`.
- **Accent (emissive-only): storm-white `0xd9deff`**, strike core `0xf2f4ff` (strike frames only),
  ember floor `0x8a92c8` ≤0.18. Coverage ≤7% of surface even at full strike.
- Trail `0x7a84b8` → boost `0xaab4e8` → `surgeHi 0xe8ecff`. Eyes `0xcfd8ff`.
- **Zero warm hues. Zero gold. Body never drops below L 0.20** (the charcoal-not-black law — assert).

## 10. Perf / overdraw / rear-chase visibility (pre-solved)
1. **Opaque decks, slit gaps** — the stack costs geometry, not fill; transparent drawables ≤6 at apex
   (virga hem bands + trail + surge motes). No additive shells; the circuit is opaque emissive.
2. **±10° forward corridor empty at ALL flap phases** — verify with 5-phase `flapstrip`; decks stack
   ABOVE-outboard, nothing crosses center; the forward-high wall stays above the rider eye-line only
   at its outboard 2/3 (assert dome clearance over the centerline).
3. **Strike glare cap:** strike-frame emissive capped so the bloom never masks the corridor; duty +
   window length are the drama levers, not intensity (rim-diet law).
4. **p95 fill honesty:** strikes are worst-case-coincident with boost trails — budget the strike frame
   at tier-1 degraded quality; the strike timer must skip windows when the adaptive tier drops below 1.
5. **Budgets:** tri ladder 1.9/2.8/3.9/5.2k (monotonic, <6000). Draw calls: static merged deck meshes,
   one material per deck tier — target ≤70 draws at apex.
6. **Photosensitivity cap (standing):** fork-strobe ≤3 Hz, strike windows ≥80 ms, no full-screen flash
   in cruise (Surge screen wash `feverWash [0.05,0.055,0.10]` stays under the godhead-hotfix NaN/flash
   guards). Owner call §Open-3.

## 11. Engine plumbing (fresh names; nullable, default-off)
New module `js/dragonTempest.js`: self-registering `stormcellTorso` · `strataStormWings` ·
`thunderheadManeHead` · `virgaTail` (registry pattern, hero-only opt-in → roster byte-identical).
New nullable dials: `strataDecks, deckLag, billowAmp, arcRun, arcDuty, maneSpikes, virgaWisps,
strikeShudder, glowLevel, igniteStage`. **New shared utility (lands here, reused by Tocsin):**
`js/pulseTimer.js` — a deterministic seeded CPU pulse/strike scheduler (headless-testable; drives
`arcDuty` here, ring pulses on Tocsin). `tempestMats(def, glow, stage)` copies the `sovereignMats`
STRUCTURE only. Forbidden imports: the organism/smooth-hull family (assert in tests).

## 12. QA / gate process
- **Calibrate** the Fable gate on Vesper + Solar tiles first (standing veto: *"does any frame read
  as a black Vesper clone or a lit-seam Solar?"*). Judge Tempest's cruise on the PALE backdrop first
  (charcoal on near-dark hides the strata slits).
- **Two-state ruling (record it):** cruise must read as a LIVING CLOUD with strikes ~1-in-7 seconds
  (deterministic timer pinned for capture via `?wingDebug`-style seed flag — engine need: a
  `?strikePin=<phase>` passthrough); the "≥3 light structures" tile is a pinned STRIKE frame.
- **Standing items:** flapstrip 5-phase corridor · deck-slit true-gap assert (top silhouette) ·
  tricount monotonic <6000 · body L ∈ [0.20,0.26] assert · accent within ±20° of `0xd9deff` OR
  sat ≤0.12 (near-white passes by saturation, not hue) · no-organism-import firewall.
- **`tests/starters.mjs` 4-form SPEC:** per-form span band {1.7,2.0,2.3,2.6}±10% · deck count
  {1,2,3,3} exact · `arcRun`/`arcDuty` monotonic (the CHARGING assert) · strike timer determinism
  (same seed → same window schedule) · fold ratio ≤0.66 · taper (virga wisps tip ≤0.20× base) ·
  spine inflection ≥1 · motif anchor drift ≤0.15 pre-scale units · tri bands ±20%.

## Benchmark vs the roster's best
Vesper wins by withholding; Solar by regalia; Phoenix by warmth. **Tempest wins on TIME** — it is the
only dragon whose spectacle has RHYTHM (strike windows you wait for), the only stacked-silhouette wing,
and the only living-weather surface (deck churn + billow). Where it must match them: deck surface
richness ≥4 readable value tiers (CP4 law) and a f3 strike frame that out-dramas Solar's ignition.

## §R — HARSH REAR-CHASE GATE REVISION (Opus critic pass, 2026-07-13)

> **Wing content SUPERSEDED by §D (2026-07-14):** the STACK rear read, the anti-louvre/anvil
> mandates, and R3's deck rows are history. R2.2 (the standing frame must carry its own cool) and
> R2.3's attitude/fringe Tocsin separators SURVIVE, re-based on the Stormfork in §D.1.
**Verdict on the v0 sheet: REVISE.** Two real risks: (a) three horizontal decks = a VENETIAN-BLIND /
plank-stack read from behind, and (b) the strike is intermittent (6–18% duty), so the STANDING
(non-strike) frame — which is 82–94% of play — must already be cool without the lightning. Score at
v0: silhouette distinctiveness 4 / interest 3 (louvre risk) / nameability 4; buildability 5; appeal 3.5
(great strike frame, at-risk grey cruise frame).

### R1. Sharpened §2 rear-chase silhouette
- **One word:** **STACK** (storm-stack).
- **Black-fill (rear):** a broad, forward-HIGH storm wall — three horizontal cloud-bank slabs per side
  narrowing UPWARD into a stepped anvil cone, daylight slits between decks, a wispy tapering rain-fringe
  (virga) hanging below, mane spikes breaking the head crown.
- **3+ centerline / landmark punctuation:** (1) the two inter-deck daylight slits (the stratification
  read); (2) the anvil-taper step (each deck shorter — a triangular stepped outline); (3) the 5-wisp
  virga fringe (irregular, fading — NOT rigid rods); (4) the nimbus mane spikes above the shoulders.
- **Distinct from the other four because __:** it is the only HORIZONTALLY-STRATIFIED wing (stacked
  stripe-slabs). Its nearest set-neighbour is Tocsin (also a broad wing with a bottom fringe) — see R2
  for the enforced separator.

### R2. Mandated fixes
1. **Anti-louvre (binds §5):** decks ×0.80 chord decay + set-back → a tapering ANVIL CONE, never
   parallel slats. Assert monotonic deck-chord decay (no two decks within 10% chord).
2. **Standing-frame appeal:** the non-strike cruise frame carries cool via the diffuse SILVER-LINING
   rims `0x9fb0c8` (fresnel, non-emissive) on every lobe's upper edge + the anvil-taper stack — the
   read must be a menacing storm-wall even with zero lightning. The strike is a bonus, not the crutch.
3. **Tempest ≠ Tocsin separator (SET-LEVEL, enforced):** Tempest is a TALL forward-HIGH stack of
   horizontal STRIPE-SLABS (up-attitude, +6° dihedral per deck) with a WISPY TAPERING virga fringe;
   Tocsin is a LOW-flat row of ROUND COINS with RIGID STRAIGHT equal rods. Attitude (up vs flat),
   inner grain (stripes vs circles), fringe (wispy-tapered vs rigid-straight) — three separators.

### R3. Buildability audit (every hero element + motif → cited path)
| element | engine construction path (reference impl) | overdraw |
|---|---|---|
| `stormcellTorso` (billowed lobes) | faceted loft — Vesper `knapLoft` shared-profile loft, clover-of-3 lobes per station | opaque, 0 |
| STRATA decks ×3 (hero) | CP1 fingered bat-wing recipe (`dragonWings` membrane / Vesper `scallopCrescentWings`), OPAQUE matte + fresnel silver rim | opaque, 0 (slit gaps cost 0 fill) |
| STORM CIRCUIT motif (inset seams) | Vesper `seam` emissive material + surge-tick userData; geometry-carried light, no additive shell | opaque emissive, ~7% coverage |
| strike timer | NEW `js/pulseTimer.js` seeded CPU scheduler (also feeds Tocsin) | none (CPU) |
| nimbus mane | spike/horn taper filaments | opaque, 0 |
| virga fringe | tapering blades + single-layer translucent hem band | ≤5 transparent (1 layer) |
**Total transparent ≤6.** Every element maps to a proven path; opaque decks + slit gaps is the honest
overdraw story (3 alpha layers would have blown the ≤2 law — avoided by construction).

### R4. SSSR appeal / art-direction
**Why a stranger screenshots and grinds:** a thunderhead that decided to hunt — the STRIKE frame
(fractal near-white lightning branching across a stacked storm-wall) is the grind trigger; the standing
frame is a menacing silver-lined anvil. **Lead: IMMINENT POWER** — you watch the charge build. Anti-
clinical guard: churn + silver-lining rims keep it a living cloud, never a grey CAD blob.

## §F — FABLE GATE (round-2, 2026-07-13)

> **SUPERSEDED by §D (2026-07-14):** the rear span-decay anvil law and the slit residual die with
> the decks. Two pieces SURVIVE: the no-tangents guard (§F.2 — now mane tips vs ONE leading edge
> per side, §D.1) and the pale-backdrop 2× standing-crop protocol (§F.3 — now §D's sawtooth judge).
**Verdict: PASS — after the axis fix below.** Scores: rear-silhouette 4.5 (post-fix) · buildability 5 ·
SSSR appeal 4 · 13-failure-mode sweep clean → avg 4.6, no axis ≤2, no veto. One word: **STACK** (holds).
The Opus §R was right about the louvre risk but wrote the fix on the wrong AXIS:

1. **CHORD decay is invisible from dead astern — the anvil must taper in SPAN.** R2.1 mandates ×0.80
   *chord* decay + 0.10-chord *set-back*: both are fore-aft moves; the rear black-fill (95% of play)
   projects neither. Three decks of equal SPAN with fancy chord decay still read as parallel slats
   from behind — the louvre survives the "fix." Mandate + assert (supersedes R2.1's assert, which
   stays for the TOP planform only): **rear-projected deck span decays monotonically ×0.80±0.05 per
   level up** (deck-2 rear extent ≤0.85× deck-1's, deck-3 ≤0.85× deck-2's, measured from
   `parts.wingElements` tips in rear projection). THIS is the stepped anvil cone the camera sees.
2. **No-tangents guard (new — §2.7):** the nimbus mane spikes rise exactly where the forward-high
   deck stack leans — in rear fill a spike tip grazing a deck-2/3 leading edge flattens both reads.
   Enforce clear gap ≥0.08 units OR clear overlap ≥0.05 between every mane-spike tip and any deck
   silhouette edge, at glide AND the pinned bank pose.
3. **Rear slit readability residual:** the inter-deck slits are the stratification signature, and at
   the ~250px chase read a 0.12-chord gap projects to ~3–5px. Judge the rear crop on the PALE backdrop
   at 2× before CP1 sign-off; if the slits close, widen the ROOT gap (min 0.16× chord), never the tip.

Everything else in §R holds: opaque decks (honest overdraw), silver-lining diffuse rims carrying the
82–94% no-strike frame, the three Tocsin separators. The strike frame remains the set's best single
screenshot.

## SETTLED (do not re-litigate)

> **2026-07-14:** items 1–2 stand unchanged. Items 3–4 are wing-scoped: the OPACITY law transfers
> to the Stormfork membrane (§D.2c); the deck geometry itself is superseded by §D.

- CHARCOAL L 0.20–0.26, never Vesper-black; near-white accent by SATURATION cap, not hue collision.
- The arc is INTERMITTENT in cruise — never always-on (Solar's lane), never Surge-only (Vesper's lane).
- Decks are OPAQUE; the see-through read comes from slit gaps, not translucency.
- 3 decks at apex, dominant-bottom ×0.8 decay; deck lag is the churn signature.

## Open owner calls (flag on the build PR)
1. **Name** — "Thunderhead Tempest" (recommended); alternates Squallmarch · Stratovyr.
2. **Cost/slot** — 2600 proposed (between Vesper 2200 and Pearl 3400).
3. **Strike accessibility** — cruise duty 0.18 + ≤3 Hz strobe proposed; owner may cap harder.
4. **Storm SFX tie-in** — a distant-thunder rumble on f3 strikes (cross-discipline; default OFF).
5. **How grey is too grey** — charcoal vs the canyon's dust haze; rides the PR preview.

## §B — v1 BUILD-READY BUILD SHEET (research-grounded, build-order #2; Fable design-director + feasibility audit, 2026-07-13)

**Status: BUILD-READY.** The owner chose the Tempest SECOND of the Fresh Five (after the Revenant).
This section turns the PASSED concept (v0 + §R + §F — every SETTLED ruling survives verbatim: the
rear-projected SPAN decay ×0.80±0.05 anvil cone, the no-tangents guard, charcoal-never-black,
opaque decks, the intermittent Storm Circuit) into the builder's working contract, grounded in the
shipped-storm-dragon research DNA (Genshin *Dvalin/Stormterror* · Pokémon *Zekrom* · MH *Kushala
Daora*) and audited line-by-line against the REAL engine — every construction path cites a shipped
implementation (`js/dragonVesper.js` patterns, the `js/dragon.js` rig hooks re-verified from code
this session at their current line numbers, and the `js/dragonRevenant.js` §B findings this build
inherits). Where a v0 number had NO rig hook — or contradicted itself — §B.6 records the honest
substitution/correction. Nothing here is aspirational. **This build LANDS the shared
`js/pulseTimer.js`** (confirmed absent from `js/` this session; nearest precedents cited in §B.4b).

**§B refinements + corrections of v0 (none touch the SETTLED list):**
1. Builder names LOCKED to v0 §11's: `stormcellTorso · strataStormWings · thunderheadManeHead ·
   virgaTail` (module `js/dragonTempest.js`) — the Revenant "lock to §11" precedent.
2. **THE CHURN HAS A REAL RIG HOOK — v0's `deckLag` dial does not.** The rig's nullable
   per-blade lag walker (`parts.wingBladePivotsL/R`, dragon.js:852–859) drives published blade
   pivots with a lag that deepens outward (`sin(phase − 0.5 − fr·0.9)`, sway 0.05→0.14 rad, plus a
   static per-index splay `side·(0.02+0.10·fr)` that DELIVERS the +6°/deck dihedral stagger for
   free). Decks 1–3 publish as blade pivots → phase-lagged deck churn with ZERO rig surgery. The
   envelope is hardcoded, not dial-driven: `deckLag` is CUT from v1 (§B.6 W5).
3. **The STORM-HEART rides `parts.coreGlow`** (dragon.js:1147–1151 drives `material.opacity`:
   floor → ×1.5 boost breathe → ×(1+1.4·sgm) Surge blaze + flicker) — which requires
   `transparent:true`. Same amendment as the Revenant: the heart is the ONE sanctioned transparent
   mesh in the body (§B.4d census). The hook's third real user (Solar, Revenant, now Tempest).
4. **The arc mats are SINGLE-WRITER: out of `spineMats` AND `flareMats`.** Two engine truths force
   it: (a) spineMats get the global WARM cruise rim `0xfff0d8` (dragon.js:1183/222) — poison for a
   255° near-white family; (b) the flare loop's else-branch RESETS every spineFlareMat's
   emissiveIntensity to base EVERY non-surge frame (dragon.js:1174–1177), which would erase any
   strike written earlier in the frame. So the Storm Circuit is owned end-to-end by ONE guarded
   storm tick (§B.4c, jade pearl-mat precedent dragon.js:1008–1017) that handles cruise strikes,
   boost duty ×2.2, AND the Surge blaze itself.
5. **v0's body ramp broke v0's own law.** Apex `0x232836` is HSL-L 0.175 — under the L≥0.20
   charcoal floor the sheet asserts. Re-pinned ramp (hue ~222° held, monotonic ↓, ALL in
   [0.20,0.26]): `0x3a3f4a → 0x333947 → 0x2e3543 → 0x293040` (L .259/.239/.222/.206).
6. **v0's strike cadence contradicted its own duty ladder.** "~1 strike in 7 s" with 0.10–0.28 s
   windows is duty ≈0.03, not 0.06→0.18. v1 keeps the LADDER (duty is the asserted number) and
   restates cadence as BURST CLUSTERS — a storm flickers in bursts, then rests (§B.4b). Both
   numbers become testable because the schedule is deterministic.
7. **Apex span re-pinned 2.6× → 2.5×** (roster span:body ≤~2.5 assert; Revenant §B.8 precedent
   apex ≤2.5). The stack's envelope is carried by HEIGHT (three decks) — it never needed the extra
   0.1 span. Ladder {1.7, 2.0, 2.25, 2.5}.
8. v0 dials with no rig hook get substitutions: `deckLag` → the wingBladePivots walker (ref. 2);
   `billowAmp` → lands inside the guarded storm tick (§B.4c); `strikeShudder` (tail shudder on
   strike frames) → CUT from v1 — the tail walk (dragon.js:929–962) is a closed damped writer and
   a second writer would fight it every frame; the virga hem + churn carry the storm-roll read.
9. NEW anatomy from the DNA: the deck trailing edges gain a diffuse RIM-CATCH tier (Dvalin's
   glowing wing-scale rims, done as silver diffuse — the lightning stays withheld); the storm-heart
   becomes a CAGED DYNAMO (Zekrom's turbine, §B.3a); the brow shelf gains two blunt horn-BOSSES
   (Dvalin's horn-base read without rear-silhouette spikes — the mane keeps the crown); the
   dominant mane spike gets a lit TIP NODE at f3 (Zekrom's glowing mane tip); the deck leading
   edges take the brightest silver tier (Kushala's "new skin glows white before turning grey").

### §B.1 Reference DNA → design decisions

| Research detail (source) | Tempest element it grounds | Deliberately NOT taken |
|---|---|---|
| SIX wings — THREE per side — on a shipped storm dragon (Dvalin/Stormterror) | the STRATA STORM-FRONT is a *triple wing*, not a gimmick: each deck reads as one wing of a stacked triplet; the I2 gate judges "three wings stacked", never "three slats" | six independent flapping wings (no rig hook; the decks share one wingParts cascade + the blade-lag churn) |
| Wing-scales that EMIT an aqua glow along the wing (Dvalin) | the deck trailing-edge RIM-CATCH tier — but DIFFUSE silver `0x9fb0c8` + fresnel, never emissive (the standing frame stays withheld; the lightning owns emission) | the aqua hue (Azure/Jade collision) and any always-on wing emissive (Solar's lane) |
| Blue-flame eyes (Dvalin) | eyes pale arc-white `0xcfd8ff`, the brightest facial point (v0 §6 held) | literal flame FX at the eyes |
| Goat-like horns, blue→black gradient (Dvalin) | 2 blunt horn-BOSSES on the brow shelf (~8 tris each) — the horned-brow read in the shop turntable | true horn SPIKES (they'd fight the mane no-tangents guard in rear fill) + the gradient (per-vertex color, no flat-shaded path) |
| Feathered bird-like tail (Dvalin) | — | NOT taken: feathers are the Phoenix lane; the virga rain-fringe is the identity |
| Electric TURBINE TAIL that ignites in "Overdrive mode" when emotions surge (Zekrom) | the STORM-HEART as a CAGED DYNAMO (§B.3a): an emissive core inside 5 charcoal cowl vanes — a generator, not a blob; "Overdrive" = the strike windows + the CHARGING ladder (heart base intensity tracks `arcDuty`) | the turbine AS the tail (the tail is virga rain; the dynamo lives at the sternum where the motif anchor is settled) |
| Mane ending in a glowing tip (Zekrom) | the dominant nimbus-mane spike carries a small lit tip node at f3 (counted inside the ≤7% accent coverage; the charge-hair filaments already settled in v0 §3) | lighting every spike (picket-fence-of-light; one dominant tip only) |
| Near-white/blue lightning + black armor body (Zekrom) | validates the settled near-white 255°/sat≈0.09 lane on charcoal — no change needed | the theropod body + armor plates (Tempest is billowed cloud, not chitin) |
| Metallic SILVER plating; "new skin glows pure white before becoming metallic grey" (Kushala Daora) | the SILVER-LINING rims: diffuse `0x9fb0c8`, metalness 0.06, envMapIntensity ≤0.3 (the Vesper glassStreak "glints, never glows" precedent); deck LEADING edges take the brightest tier (new-skin), trailing tiers age toward slate | full chrome (matte law: body metalness 0, roughness 0.85 — Tempest is matte cloud, not steel) |
| Wraps itself in a churning WIND BARRIER (Kushala) | the CHURN as identity: per-deck phase lag via the wingBladePivots walker + the ±3% billow breathing (§B.4c) — the cloud visibly boils in cruise | a literal wind-shell mesh (an enclosing additive shell is the overdraw cliff, banned) |
| Quadruped, shoulder-mounted wings (Kushala) | the scapular STORM COWL burying the deck roots (v0 §5 held — the stack grows from a real shoulder) | four walking legs (flight-only rig) |

### §B.2 Finalized art direction + silhouette (locks §R1/§F)

- **One-word rear read: STACK.** Black-fill (rear): a broad, forward-HIGH storm wall — three
  horizontal cloud-bank slabs per side whose REAR-PROJECTED SPANS step down ×0.80±0.05 per level
  (the §F anvil cone — the taper the chase camera actually sees), true daylight slits between
  decks, a wispy tapering 5-wisp virga fringe below, mane spikes breaking the crown. Decks are
  OPAQUE; the see-through is geometry absence.
- **Landmark punctuation (4):** (1) the two inter-deck daylight slits (root gap ≥0.16× chord if
  the 2× pale-backdrop crop shows them closing — §F residual); (2) the stepped anvil taper
  (span-decay, silhouette-visible); (3) the virga fringe (irregular, tapering ×0.80, never rods);
  (4) the nimbus mane spikes — held OFF the deck edges by the no-tangents guard (gap ≥0.08 or
  overlap ≥0.05, glide AND bank).
- **The standing frame carries its own cool (82–94% of play has NO lightning):** silver-lined rims
  on every lobe/deck edge + the anvil taper + the churn = a menacing living storm-wall with zero
  emission. The strike is the bonus, never the crutch (§R2.2 held as law).
- **Anti-collision confirmed:** vs VESPER — L floor 0.20 vs L≤0.10 (the ramp direction is shared
  ↓, but the FLOOR is the law: assert body L≥0.20 at every form; the retired Vesper lanes are
  black + knapping + withheld-Surge-only, none of which Tempest touches); near-white INTERMITTENT
  255°/sat.09 vs ion 223° Surge-only; stacked decks vs single crescent. Calibration veto stands:
  *"does any frame read as a black Vesper clone or a lit-seam Solar?"* vs SOLAR — intermittent vs
  always-on regalia; zero gold. vs AZURE — charcoal storm vs powder blue; emissive strikes vs
  diffuse ice. vs TOCSIN (set-neighbor) — up-attitude stripe-slabs + wispy tapered fringe vs
  flat round coins + rigid rods (three §R2.3 separators, load-bearing axes per §F re-ranked:
  slit-stripes, attitude, fringe character).

### §B.3 The part builders — `js/dragonTempest.js` (billowed/faceted assembly, self-registering, nullable default-off dials; forbidden imports: `dragonOrganism|dragonNightFury|dragonUnifiedHull` — asserted)

**Shared kit (top of module):** `flatTriMesh` (mechaKit.js) · a `tempestMats(def, glow, stage)`
factory copying only the `sovereignMats`/`vesperMats` STRUCTURE (dragonVesper.js:43–80 —
stage-aware; `userData.baseEmissive/baseIntensity` on every ticked mat): tiers `stormShadow
0x2a2f3c` (dorsal) / `flank` = `def.body` (the ramp hex) / `belly 0x4a5468` / `silverRim 0x9fb0c8`
(diffuse, metalness 0.06, envMapIntensity 0.3 — the glint tier) / `deckTiers[4]` (lerped toward
lit steel-slate `0x8a95ac` over f `[0.60,0.40,0.22,0.06]`, endpoint steps ≥0.05 L — the CP4 law) /
`arcSeam` (emissive `0xd9deff`, base ≤0.06) / `arcCore` (emissive `0xf2f4ff` — THE one true
near-white, strike-peak only) / `heart` (emissive `0xd9deff`, `transparent:true` for the coreGlow
hook). Body law: metalness 0, roughness 0.85, envIntensity 0.18, **emissive 0x000000** (the rig
ticks `bodyMat.emissiveIntensity` 0.12→0.35 at dragon.js:1192 — black emissive keeps the cloud
matte through it). A `cloverLoft(stations, profile, matOrFn)` helper = the `knapLoft` PATTERN
(dragonVesper.js:106–131) re-authored with a per-station `rot` field that rotates the profile
indices ±10–14° station-to-station — the diagonal turbulence weave that kills both rings AND
straight strakes (a fresh ~25-line variant in-module; knapLoft itself deliberately cannot rotate,
that's what makes strakes).

**§B.3a `stormcellTorso`** — the billowed cloud-loft + the CAGED DYNAMO. Publishes the full attach
contract (`wingRoot(side)`, `headBase`, `tailAnchor`, `halfWidthAt`, `bodyMidY`, `riderSocket`),
`spinePoints` (≥2 inflections: neck rises INTO the wall → chest proud → tail counter-drop → tip
flick), `motifAnchor` (sternum, fixed), and **`coreGlow` = the storm-heart core mesh** (refinement
3).
- **Loft:** 6 stations, each a clover of 3 overlapping soft lobes (N=9 merged profile), `rot`
  stepping +12°/−10°/+14°… per station via `cloverLoft`. Shoulder:waist ≈1.55, haunch 0.8× chest.
  Value bands per column: `stormShadow` dorsal / `flank` sides / `belly` under; every lobe's UPPER
  edge column takes `silverRim` (the sun behind the cloud — the standing-frame cool, warm-sky-safe
  because it is diffuse).
- **THE STORM-HEART (caged dynamo, ~110 tris):** 5 charcoal cowl VANES (each a 2-face tent wedge,
  swept like turbine stators, `stormShadow` mat) ringing a recessed faceted core (~50 tris, fan-
  built octa-teardrop, `heart` mat, `transparent:true`, `userData.base = 0.10 + 0.24·glowLevel`) —
  seen between the vanes, ≥0.06 clearance from each (no coplanar faces, no z-fight). Sits at the
  sternum BELOW the rider eye-line. The dragon.js:1147 tick delivers floor/breathe/blaze with zero
  new engine code; the storm tick (§B.4c) additionally kicks its emissiveIntensity on strike
  frames (the heart "turns over" before each bolt — the Zekrom Overdrive beat, and the player's
  0.2 s pre-strike telegraph).
- **Scapular STORM COWL:** 2 billowed lobe-plates per side lapping the deck roots — verbatim the
  Vesper `buildScapularCowl` overlap trick (dragonVesper.js:640–641 usage: STATIC in the body
  frame, never parented to the flapping pivot).
- f0 carries one soft lobe less per station (the squall pup is a small wad of weather, not a wall).

> **SUPERSEDED by §D.2 `stormforkWings` (owner decision 2026-07-14).** History only — including
> the dial block below, whose broken-linkage inversion (§C.1 C5: `tipAmp .42 > midAmp .28`) is
> FIXED in §D.4.

**§B.3b `strataStormWings`** — the HERO. Construction = the CP1 fingered-bat recipe per deck
(cited: `buildOneScallopWing` dragonVesper.js:365–534; leading-edge profile-as-function
`vesperArmY/Z` pattern; the outer `lmirror` mirror + −anchor wrist fold dragonVesper.js:616–638 —
reuse the PATTERNS, fresh geometry):
- **Per deck — a real WEDGE VOLUME, no paper planes:** each deck is a two-surface slab — a
  billowed TOP vane + a flatter BELLY skin welded at the leading/trailing polylines (the §2.3
  airfoil法), thickness 0.08× chord at the root tapering to a knife at the trailing edge. Leading
  edge = a knuckled profile FUNCTION (gull arch in Y, ogee in Z), stated module-level and shared
  by geometry + tip markers + tests (the detach gotcha). 4 rolling cloud-finger RIDGES radiate
  from the deck carpal (dominant + `lenFrac [1,.80,.62,.46]`, tent-ridge wedges); bays cup inward,
  sampled ≥4 segments (sawtooth killer). Tiers: LEADING edge `silverRim` (Kushala new-skin), then
  `deckTiers` stepping aft toward `0x8a95ac` at the fingers. Trailing edge carries the Dvalin
  RIM-CATCH: the last tier band, diffuse only. ~170 tris/deck.
- **THE ANVIL CONE (the §F law, built then asserted):** per-deck dials `deckSpanDecay 0.80`
  (deck-2 halfSpan = 0.80× deck-1, deck-3 = 0.64×), chord decay ×0.80 + set-back 0.10× chord (the
  §R2.1 TOP-planform assert stays), dihedral baked 14°/20°/26°, vertical ROOT gap ≥0.12× chord
  opening to 0.22 at tip (root floor 0.16 if the §F 2× crop shows the slits closing). Each deck's
  arch-apex t shifts inboard ×0.9 per level so the three leading edges are never parallel curves.
  Rear-projected span decay lands at ×0.775/×0.765 after the dihedral cosines — inside the
  ×0.80±0.05 band by construction (§B.8 asserts it from the deck tip markers in rear projection).
- **Deck undersides carry the circuit seams** (§B.4a): inset grooves in the belly skin, `arcSeam`
  on the recessed faces — light pools INSIDE the stack during strikes.
- **Assembly + motion:** canonical +X; ONE `wingParts 3` cascade per side — pivot(shoulder) →
  mid(forearm) → tip(HAND at the carpal `K`; `tip.position=K`, hand `−K` — the −anchor rest pose).
  Deck-1 (dominant, bottom) parents to the hand as the primary sheet; decks 2–3 parent to the hand
  UNDER their own small pivot Groups published as `wingBladePivotsL/R` entries `{pivot, idx: 1|2,
  side}` → the rig's per-blade walker (dragon.js:852–859) phase-lags them 0.45/0.9 rad behind the
  beat with sway 0.10/0.14 rad + the static splay that stacks the dihedral — THE CHURN, zero rig
  code (refinement 2). LEFT = outer `lmirror scale.x=−1` wrapper (never on the pivot). Real dials
  only: `flapBias 0.82, flapAmp 0.8, wingParts 3, rootAmp 0.66, midAmp 0.28, tipAmp 0.42, midLag
  0.5, tipLag 1.1, glidePow 1.9, restLift 0.06, apexMid 0.08, apexTip 0.16` — a heavy weather-
  front beat; no roster dragon shares the block (Vesper glidePow 2.2/tipAmp 0.65; Revenant
  rootAmp 0.72/glidePow 1.15 — §2.13 clean).
- **Fold:** decks nest as they sweep aft (upper decks rotate down-and-back onto deck-1); measured
  span ≤0.66 of glide — the stack collapses into ONE storm bank (silhouette transformation,
  asserted on the fold pose).
- **Numbers:** apex span:body **2.5×** (refinement 7) · single-deck-1 area:body side-area ~0.8,
  stack total ~1.0 · sweep 18° · fold ≤0.66. Publishes `wingPivot/Mid/TipL/R`, per-deck tip
  markers riding the hand (FX/trail emit + the span-decay assert points), `parts.wingElements`
  (deck-1 arm + fingers) and `parts.deckElements` (per-deck `{root, tip, span}` ×3 ×2 sides).
- **Batching:** deck tris ACCUMULATE per material within each deck group → ≤3–4 `flatTriMesh` per
  deck; ~10 meshes/wing, ~20 wing draws total (the Pearl 253-draw lesson; apex target ≤70).

**§B.3c `thunderheadManeHead`** — the blunt RAM-PROW wedge (~14 facets via a mini bone-profile
loft: occiput → heavy brow shelf → short muzzle, the storm leads with its forehead), pointing −Z.
**2 blunt horn-BOSSES** on the brow shelf (~8 tris each — Dvalin's horn-base, cut before they
become spikes; they stay inside the head outline in rear fill so the no-tangents guard never sees
them). **THE NIMBUS MANE:** swept-back cloud-spike filaments off the occiput (0→2→4→6, lengths
×0.82 dominant-decay, 2-face tent wedges — never paper planes), canted ±8° off-sagittal; tips
placed by a module-level function shared with the §B.8 no-tangent test. At f3: charge-hair — the
finest `arcSeam` filaments up the two dominant spikes + ONE lit tip node on the dominant spike
(Zekrom; ~6 tris, `arcSeam` mat, counted in coverage). Eyes: octahedra (the Vesper eye pattern),
`0xcfd8ff`, ladder 36%→28%→23%→19% almond; eye mats OUT of every surge/storm array (rig-driven at
dragon.js:1193 via `feverEye`). Publishes `headLength`.

**§B.3d `virgaTail`** — a tapering storm-stem on the Vesper **isBone 4-joint nested chain**
verbatim (dragonVesper.js:785–795: `jAnchor`/`chainAdd` −anchor compensation, `joints[0].isBone =
true`, rotation-only). Stem = `cloverLoft` sections ×0.90 per joint span, tip ≤0.20× base. Dials:
`tailWhip: true, tailLagScale 0.12, tailUndulateX 0.30, tailRudderScale 0.5` (low lateral coil,
pronounced vertical wave — the storm rolls; `strikeShudder` CUT, refinement 8). **THE VIRGA
FRINGE:** 2→3→4→5 rain-streamer wisps hung from the last two joints — thin tapering BLADES (2-face
tents, lengths ×0.80, tips ≤0.20× base), irregular spacing (never a rod comb), plus **ONE connected
single-layer translucent HEM band** (opacity ~0.55) tracing the whole fringe's trailing polyline
(the Vesper edgeBand fix — one transparent drawable, not per-wisp shards). Arc terminus stud at f3
(~4 tris, `arcSeam`) joins the circuit. Wisps bin to the joint whose z-span holds them
(−anchor compensated) so the fringe whips with the tip.

### §B.4 THE STORM CIRCUIT — arc geometry, `pulseTimer.js`, the storm tick, the fever firewall, the overdraw census

> **Wing rows SUPERSEDED by §D.3 (2026-07-14):** the arc branch paths no longer ride deck
> undersides — the Stormfork's bolt-frame CRESTS are the circuit's f2/f3 branches (the wing
> skeleton IS the circuit); §B.4d's `feverWing 0x000000` row is REVISED to `0xd9deff` capped
> (§D.3); the overdraw census is recounted (cruise 5 / Surge 6, §D.3). `pulseTimer.js`, the
> single-writer storm tick, the bucket architecture, and every cap survive verbatim.

**§B.4a The arc-tree geometry (opaque emissive, no additive shells).** The circuit = inset seams +
thin ridge filaments in the Vesper §3 anti-tacky kit, all OPAQUE `arcSeam`/`arcCore` mats:
- **Branch paths are deterministic polylines** from a seeded zig-zag generator (module-level,
  mulberry32 on `stormSeed` — same seed → same tree, headless-testable): heart → scapular arms →
  each deck's underside mid-seam → (f2+) one FORK per branch → (f3) deck fingers + tail stem +
  second-order forks + charge-hair. Segments ~0.06–0.14 long with ±12° jitter — reads as
  lightning, builds as ~10–16 thin strips per branch.
- **Each strip is a shallow TENT (2 faces) or a recessed groove face** — thickness kills the plank
  and gives the strike a lit ridge; **`side: THREE.DoubleSide` on every thin emissive strip** (the
  back-face-culled no-op ignition gotcha, DRAGON-DESIGN §6.5). Coverage ≤7% of surface at full f3
  strike (counted in §B.8).
- **Run buckets:** arc strips group into **3 materials by tree depth** (heart+scapular / deck
  mid-seams / fingers+tail+forks) → 3 draws; the storm tick offsets each bucket's envelope by
  +0.04 s so a strike TRAVELS root→tip over ~0.12 s (the Revenant 3-phase-bucket gap-pulse
  pattern, proven on dragon.js:1008-style ticks — v0 §3's ~0.12 s seam-run, delivered with 3 mats
  instead of per-segment ramps).
- **The ember floor:** between strikes the seams idle at `0x8a92c8`-equivalent ≤0.06 intensity —
  carved geometry that reads as tracery up close, ≤15% of cruise emissive contribution (§B.8).

**§B.4b `js/pulseTimer.js` — the NEW shared deterministic strike/pulse scheduler (lands here,
reused by Tocsin's rings).** Confirmed absent from the codebase (no `pulse*/prng` scheduler module
exists); design precedents: `bossRhythm.js` (a PURE, deterministic-given-rng phrase machine that
both CI gates simulate headlessly — the architecture to copy) and the integrated-phase law
(dragon.js:62 — advance by dt, never `time·freq`).
- **Pure module. No THREE, no DOM, no globals.** `createPulseTimer({ seed, duty, windowMin: 0.10,
  windowMax: 0.28, burstMin: 1, burstMax: 4, restShape: 'storm' })` → `{ tick(dt, phaseHint01),
  state() → { live, env01, burstIdx, windowIdx, t }, pin(t01), reseed(seed) }`.
- **The schedule is BURST CLUSTERS** (refinement 6): a burst = `burstN ∈ [burstMin,burstMax]`
  windows of 0.10–0.28 s separated by 0.30–0.70 s intra-gaps, then a REST sized so the long-run
  lit fraction equals `duty` exactly: `rest = (litSum − duty·(burstSpan + litSum))/duty` clamped
  ≥1.2 s. f3 example: 3 windows ≈0.55 s lit over a ≈1.2 s burst + ≈1.9 s rest → duty 0.18, and the
  storm reads as flicker-bursts with breathing room, not a metronome.
- **Downstroke bias:** `tick(dt, phaseHint01)` may DELAY an about-to-open window ≤0.25 s until the
  flap phase next crosses the downstroke apex — deterministic given the same dt/phase stream
  (headless tests drive fixed dt; the studio is clock-free by its own header law).
- **Envelope:** `env01` rises 0→1 over 30 ms, holds, falls over 60 ms (no hard square wave);
  within-window flicker is a fixed ≤3 Hz cosine dip (the photosensitivity cap is IN the module,
  not at the call site). Window floor 0.10 s ≥ the 80 ms cap floor by construction.
- **Quality + accessibility guards at the call site:** the storm tick skips opening new windows
  when the adaptive `quality < 1` (the dragon.js:89 quality factor — a REAL hook) — v0 §10.4
  delivered. Boost multiplies duty ×2.2 by scaling rests, never window length.
- **`?strikePin=<t01>` (the engine need v0 §12 named):** module-scope URLSearchParams parse in
  dragon.js exactly like `?wingDebug` (dragon.js:22–28) → `timer.pin(t01)` freezes the schedule at
  a named point (0.5 = mid-window strike peak; 0 = standing frame). `tools/dragonstudio.mjs` gains
  a `strike` state (alongside its `surge` state) that pins mid-window — gate rounds become
  pixel-comparable, the MARROWCOIL determinism law extended to timed spectacle.
- **Headless tests:** same seed → identical window schedule over 10k fixed-dt ticks; long-run duty
  within ±10% of the dial; min window 0.10 s; min rest 1.2 s; ≤3 Hz within-window modulation.

**§B.4c The STORM TICK (the one guarded dragon.js addition, ≤14 lines).** Keyed on
`parts.stormArcMats` existing (null for every other dragon — roster byte-identical), placed AFTER
the spineFlareMats loop (refinement 4, the reset-loop dodge), jade pearl-mat precedent
(dragon.js:1008–1017):
- ticks the pulseTimer with dt + flap phase; writes the 3 arc-bucket mats:
  `emissiveIntensity = floor + env01(t − 0.04·bucket) · peak(form)`, hue lerped `0xd9deff →
  0xf2f4ff` at env>0.85 (the strike core, capped);
- kicks the heart (`coreGlow.userData.base` ×(1+0.5·env01) — the pre-strike turbine turn-over);
- **owns Surge itself:** `player.feverActive` → continuous blaze at capped intensity + ≤3 Hz
  fork-strobe alternating buckets 2/3 ("the Tempest breaks") — never handed to the flare loop;
- **the BILLOW lives here too** (±3% scale breathing on `parts.deckGroups` at fixed ω, deck-3
  phase-lagged −0.6) — refinement 8's `billowAmp` substitute; deterministic, pinnable;
- fallback if the owner vetoes rig code: static ember tracery + Surge-only blaze via flareMats
  (loses cruise strikes — flagged as identity-critical, so the tick is the plan of record).

**§B.4d Full fever-palette override + the overdraw census.** The rig defaults are hostile:
`feverWing 0xff44cc` magenta (dragon.js:1135), `feverEye 0xff66ee` (1193), `surgeHi 0xfff8e8`
white-gold (1156), warm rim `0xfff0d8` → `surgeHi` lerp on spineMats (1183–1186). Every hook,
explicit on the def (the Vesper block dragons.js:611–621 is the format precedent):

| hook | value | why |
|---|---|---|
| `feverWing` | `0x000000` | decks stay charcoal silhouette on Surge — the circuit owns the light (Vesper precedent) |
| `wingEmissive` + `wingMembraneEmissive` | `0x000000` | explicit black — kills the cruise/boost wing-glow target (dragon.js:1130–1135) and the `setHex(undefined)` luck |
| `feverEye` | `0xe8ecff` | eyes blaze pale storm-white, never magenta |
| `surgeHi` | `0xe8ecff` | the rim lerp (1185) + any flared mat lerps toward storm-white, never white-gold |
| `feverWash` | `[0.05, 0.055, 0.10]` | v0 §10.6's cold wash, under the godhead NaN/flash guards |
| `eye / apexEye` | `0xcfd8ff / 0xd9deff` | pale arc-white family |
| `apexSeam / coreGlow` (color fields) | `0xd9deff` | hue-lock ground truth |
| `trail / boostTrail` | `0x7a84b8 / 0xaab4e8` | v0 §9 |
| `fx.auraColor` | `'217,222,255'`, `auraIdle 0` | NO idle halo — the standing frame is diffuse-only by law |
| `hideRiderGlow` | `true` | the strike owns the frame; no round rider bloom |
| `surgeMotes` | absent/false | budget: the Surge spend is the continuous circuit, not motes |
| surge arrays | arc mats in NEITHER array (single-writer storm tick); heart in flareMats for the hue lerp only | refinement 4 |

**Overdraw census (counted, not vibes):** CRUISE transparent drawables = 1 storm-heart core
(coreGlow) + 1 virga hem + 1 trail = **3 ≤ 6** (v0's budget met with slack). SURGE = those 3 + the
fever aura sprite = **4**. Max alpha layers along any chase ray: tail ray hem+trail = 2; heart ray
= 1 — all ≤2 ✔. EVERYTHING else is opaque: decks (slit gaps cost zero fill), arc strips (opaque
emissive), mane, cowls, vanes. The strike frame's p95 honesty (v0 §10.4): worst case =
strike+boost-trail coincident — the quality guard skips new windows below tier 1, and peak
emissive is capped (`arcSeam` ≤2.4, heart ≤1.6, `arcCore` strike core ≤2.0) so the centerline
bloom never masks the ±10° corridor (asserted at the pinned strike frame, §B.8).

### §B.5 The CHARGING ladder (4 forms; extends v0 §8 with the v1 corrections + DNA dials)

> **Wing rows SUPERSEDED by §D.5 (2026-07-14):** `strataDecks`, the rear span-decay row, and the
> tri targets are history — kink/fork/ray rows replace them; tris re-pinned {1.8, 2.6, 3.6, 4.7}k
> with rationale. All non-wing rows (arcDuty, heartScale, mane, virga, body hex, eyes…) HOLD.

f0 Squall Pup · f1 Stormcell · f2 Thunderhead · f3 Tempest Unleashed. Drama 25/45/70/100.

| dial | f0 | f1 | f2 | f3 | assert |
|---|---|---|---|---|---|
| `strataDecks` / wing | 1 | 2 | 3 | 3 | exact {1,2,3,3} |
| rear-projected deck span decay | — | ×0.80±0.05 | ×0.80±0.05 per level | ×0.80±0.05 per level | the §F anvil law, from deck tip markers, rear projection |
| `arcRun` (carved circuit) | heart node | 0.5 (shoulders) | 0.75 (deck mid-seams + first forks) | 1.0 (fingers + tail + 2nd-order + charge-hair) | monotonic ↑ |
| `arcDuty` (cruise lit fraction) | 0.06 | 0.10 | 0.14 | 0.18 | monotonic ↑; long-run measured ±10% |
| burst windows / cluster | 1 | 1–2 | 2–3 | 2–4 | max ↑ |
| `heartScale` (dynamo) | 0.5 | 0.7 | 0.85 | 1.0 | monotonic ↑ |
| `maneSpikes` | 0 | 2 | 4 | 6 | monotonic ↑; lit tip node f3-only |
| `virgaWisps` | 2 | 3 | 4 | 5 | monotonic ↑; tip taper ≤0.20× |
| `billowAmp` | 0 | 0.015 | 0.02 | 0.03 | monotonic ↑ |
| span : body | 1.7× | 2.0× | 2.25× | 2.5× | ↑, ±10%, apex ≤2.5 (refinement 7) |
| eye : head | 36% round | 28% | 23% | 19% almond | monotonic ↓ |
| body hex (value ↓, hue ~222° held) | `0x3a3f4a` | `0x333947` | `0x2e3543` | `0x293040` | **L monotonic ↓ AND ∈[0.20,0.26] every form** (refinement 5; L .259/.239/.222/.206) |
| head : body | 1:2.3 | 1:3.2 | 1:4.2 | 1:5.0 | ↓ |
| `glowLevel` | 0.25 | 0.5 | 0.75 | 1.0 | ↑ |
| tri target | ~1.9k | ~2.8k | ~3.9k | ~5.2k | monotonic ↑, ±20%, <6000 |

Growth-verb asserts: CHARGING = `arcDuty` ↑ + `arcRun` ↑ + `strataDecks` ↑ + `heartScale` ↑ (the
charge accumulates in TIME, TREE, MASS, and SOURCE). **The value ramp is a pick, not an invert:**
body value DECREASES (the storm gathers darkness) — legal because the invert pair
(Vesper ↓ to black / Revenant ↑ to ivory) is bracketed by FLOORS, and Tempest's law is the floor:
L≥0.20 at every rung, asserted alongside the monotonic ↓. Apex superiority is SHAPE-COMPLETION
(only f3 has the full wall + full tree + the lit mane tip), never scale.

### §B.6 FEASIBILITY AUDIT (every element → cited engine path → overdraw → biggest risk → mitigation)

> **Rows W1–W7 SUPERSEDED by §D.6's SF rows (2026-07-14).** W5's blade-walker substitution
> survives re-purposed as the fork crackle-churn (SF8); W6's billow moves to the membrane bay
> groups. T/H/M/V rows and the Q(b) circuit ruling HOLD; Q(a)'s deck ruling is history.

| # | element | engine construction path (cited) | overdraw | biggest build risk | mitigation / substitution |
|---|---|---|---|---|---|
| T1 | `stormcellTorso` clover loft | `cloverLoft` = knapLoft pattern (dragonVesper.js:106–131) + per-station profile rotation (fresh in-module helper — knapLoft cannot rotate, by design) | 0 (opaque) | the rotated weave re-introduces lateral banding at low rot angles | rot ≥10° per station + per-column value bands; I1 gate tile on the pale backdrop |
| T2 | silver-lining rims | diffuse `0x9fb0c8`, metalness 0.06 / envMapIntensity 0.3 — the Vesper glassStreak "glints, never glows" tier (dragonVesper.js:64–65) | 0 | rims become the brightest surface on a dark sky (the Vesper I1 gate failure) | envIntensity capped 0.3, judged on BOTH backdrops at I1; dim one notch if they out-read the eyes |
| T3 | storm-heart caged dynamo | `parts.coreGlow` hook (dragon.js:1147–1151 opacity tick) + 5 opaque stator vanes; Revenant Grave Heart precedent | 1 (the sanctioned transparent) | transparent mat = +1 cruise drawable | counted (3/6 census, slack); fallback = opaque core, forfeits the breathe |
| W1 | deck slab (top vane + belly skin wedge) | CP1 wing recipe per deck (buildOneScallopWing dragonVesper.js:365–534) + the §2.3 two-layer airfoil | 0 | paper-plane decks if the belly skin gets cut for tris | thickness 0.08×chord is a builder constant, not a dial; tri budget holds (~170/deck, ~1.1k/wing-pair at apex) |
| W2 | THE ANVIL CONE (rear span decay) | `deckSpanDecay 0.80` + dihedral 14/20/26° baked; measured from per-deck tip markers in rear projection | 0 | **the §F louvre risk: equal-span decks read as blinds** | asserted ×0.80±0.05 REAR-projected (§B.8) + non-parallel leading-edge functions + the top-planform chord assert (§R2.1) — three independent anti-blind locks |
| W3 | slit gaps | geometry ABSENCE between decks (root ≥0.12–0.16× chord → 0.22 at tip) | 0 (free fill) | slits alias closed at the 250px chase read (~3–5px) | §F residual: judge the 2× pale-backdrop crop at I2; widen the ROOT floor to 0.16, never the tip |
| W4 | deck batching / draw count | per-material tri accumulation per deck group (the Pearl 253-draw lesson; Revenant ≤3-mesh batching precedent) | 0 | 3 decks × tiers × 2 sides balloons draws | ≤3–4 meshes/deck → ~20 wing draws; apex total ≤70 asserted via creaturestress |
| W5 | THE CHURN (per-deck phase lag) | **`parts.wingBladePivotsL/R` walker, dragon.js:852–859** — additive, nullable, lag deepens outward, damped 12 | 0 | v0's `deckLag` dial DOES NOT EXIST; the walker's envelope is HARDCODED (lag 0.45 rad/idx, sway ≤0.14 rad, splay ≤0.12 rad) | **SUBSTITUTION: ride the walker verbatim** — its numbers land inside the sheet's intent; `deckLag` CUT from v1; if the preview wants a different lag, a nullable dial on the walker is a ≤3-line flagged follow-up |
| W6 | the BILLOW (±3% breathing) | inside the guarded storm tick on `parts.deckGroups` (jade pearl tick precedent dragon.js:1008–1017) | 0 | touching dragon.js | nullable + parts-guarded + deterministic ω; fallback = cut (static decks still churn via W5) |
| W7 | fold ≤0.66 + deck nesting | wingParts fold pose (`setFlapDebugPose 'fold'`); contraction assert (starters pattern) | 0 | upper decks poking through deck-1 when nested | nest clearance 0.02 at the fold pose, checked in the builder; flapstrip 5-phase + fold pin |
| H1 | ram-prow head + horn bosses + mane | mini profile loft + tent-wedge spikes (Vesper CP5 ear pattern); module-level tip function shared with tests | 0 | mane tip tangent vs deck-2/3 edges (the §F guard) | no-tangents assert: gap ≥0.08 OR overlap ≥0.05 at glide AND bank (§B.8) — the tip function makes it computable headless |
| M1 | arc-tree strips (branching bolt) | opaque emissive tents/grooves, Vesper seam-mat pattern (dragonVesper.js:77–78) + seeded polyline generator; **DoubleSide** per §6.5 | 0 | tacky "LED vein" read across the decks | arcs live on UNDERSIDES + grooves (light pools in the slits); coverage ≤7%; ember floor ≤0.06 so cruise reads carved, not lit |
| M2 | strike travel root→tip | 3 run-bucket materials + per-bucket env offset 0.04 s (Revenant gap-pulse bucket precedent) | 0 | per-segment ramps would need per-mat arrays | 3 buckets ≈ the 0.12 s travel at chase distance; per-segment CUT (invisible at 250px) |
| M3 | `js/pulseTimer.js` | NEW pure module; architecture = bossRhythm.js (pure, deterministic-given-rng, CI-simulated); integrated-phase law dragon.js:62 | none (CPU) | drift between headless and live schedules | fixed-dt tests + the pin flag; no wall-clock reads inside the module, dt-integration only |
| M4 | the storm tick | guarded ≤14-line dragon.js block AFTER the flare loop; keyed on `parts.stormArcMats` | 0 | the flare loop's else-reset (1174–1177) or the warm rim (1183) clobbering/tinting arcs | **arc mats in NEITHER surge array; tick placed after the loop; single writer** (refinement 4) — the trap is dodged by architecture, not luck |
| M5 | Surge ("the Tempest breaks") | the storm tick's feverActive branch: continuous blaze + ≤3 Hz bucket-alternating strobe; heart blaze via the coreGlow tick's own fever math | 0 new | double-driving the heart (tick + coreGlow hook both write) | the hook owns OPACITY, the storm tick only scales `userData.base` pre-read — one writer per channel |
| M6 | fever firewall | full override table §B.4d — every default named with its dragon.js line | — | ONE missed hook = magenta/white-gold leak | §B.8 simulates the surge-tick values and asserts every fever-state emissive is ≤0.12 sat OR within 255°±20 |
| M7 | photosensitivity + glare | window ≥0.10 s, rest ≥1.2 s, ≤3 Hz modulation IN pulseTimer; peak caps arcSeam ≤2.4 / arcCore ≤2.0 / heart ≤1.6; no full-screen flash (feverWash only) | — | the pinned strike frame blooming over the corridor | ±10° corridor emissive-coverage assert at the pinned strike (§B.8) + duty/window as the drama levers, never intensity (rim-diet law) |
| V1 | rear span-decay measurement | pure math on the published deck tip markers (world matrices, rest pose) — no new tooling; cross-check via the existing `rearfit` silhouette view (silhouetteCore.mjs:90) | offline | pose contamination (bladePivot splay shifting tips) | measured at the un-posed rest build (the −anchor law keeps rest byte-identical); the ±0.05 band absorbs the dihedral cosines |
| V2 | `?strikePin` + studio `strike` state | the `?wingDebug` module-scope parse pattern (dragon.js:22–28) + dragonstudio's existing clock-free state machine (its header names non-determinism a test failure) | — | forgetting the pin makes every gate round non-comparable (the MARROWCOIL failure) | lands in I0 WITH pulseTimer, before any lightning exists to capture |

**Q(a) — do THREE stacked opaque decks per side read as a badass anvil-cone wing (not venetian
blinds) in rear-chase black-fill AND hold 60fps? YES — with the §F fix built in, and the fps part
is the easy half.** Perf: the stack is pure opaque geometry (~1.1k tris/wing-pair at apex, zero
transparent, zero fill cost — the slits are absence), batched to ~20 wing draws against a ≤70 apex
budget on an engine whose measured cliff is big screen-space additive stacks, not meshes
(PREMIUM-BUILDSHEET-RESEARCH §6c; Phoenix ships 56 TRANSPARENT drawables — Tempest ships 3). The
READ is the real risk, and it is triple-locked: (1) rear-projected span decay ×0.80±0.05 asserted
from the deck tip markers — the anvil taper the camera actually sees (§F's axis correction, now a
test, not prose); (2) the three leading edges are DIFFERENT functions (arch apex walks inboard
×0.9/level) so no two deck outlines are parallel curves even before the taper; (3) the churn — the
blade-lag walker keeps the decks at visibly different angles most frames (a venetian blind is
parallel AND static; the stack is neither). Residual honestly held for the preview: whether the
slits survive 250px on the grey-sky biome (§B.9).

**Q(b) — is a deterministic, intermittently-strobing near-white lightning circuit buildable,
60fps-safe, and NOT a photosensitivity/glare hazard? YES — buildable entirely from cited parts,
and safe BY SCHEDULE CONSTRUCTION.** Buildable: opaque emissive strips (Vesper seam mats) in 3
bucket materials, driven by a pure seeded scheduler (bossRhythm.js architecture precedent) through
one guarded storm tick (jade pearl-mat precedent) — no shaders, no sprites, no additive shells,
3 extra draws, zero transparent drawables. 60fps: material `emissiveIntensity` writes on 3 mats
per frame are noise; worst-case strike+boost coincidence is pre-degraded by the quality guard
(dragon.js:89) skipping new windows below tier 1. Safety: the hazard numbers live INSIDE
pulseTimer (window ≥0.10 s, rest ≥1.2 s, within-window modulation ≤3 Hz, Surge strobe ≤3 Hz) so no
call site can strobe faster than the cap; brightness is capped per-mat (arcCore ≤2.0 — the ≤1
true-near-white element, sat<0.06, strike-peak only) with the ±10° corridor asserted
emissive-clear at the PINNED strike frame; there is no full-screen flash in cruise by construction
(the only screen-space term is the Surge `feverWash [0.05,0.055,0.10]`, under the shipped guards).
DoubleSide on every thin strip kills the culled-ignition no-op. The residual that is genuinely a
human call — whether ~1.2 s-rest burst clusters FEEL threatening or twitchy — rides the preview
(§B.9), with `?strikePin` making every gate round comparable.

### §B.7 BUILD INCREMENT PLAN (coexist → hero → ladder; the Vesper/Revenant I0–I5 cadence, one harsh Fable gate per increment)

- **I0 — stub + `pulseTimer.js` + `?strikePin` + calibration.** Roster key `tempest` (fully
  additive; roster byte-identical), `js/dragonTempest.js` skeleton with 4 registered
  contract-satisfying placeholders (the dragonRevenant.js I0 pattern, shipped precedent); LAND
  `js/pulseTimer.js` + its headless determinism tests + the `?strikePin` passthrough + the
  dragonstudio `strike` state — the timed-spectacle tooling exists before any lightning does.
  Gate calibration on Vesper + Solar tiles with the standing veto (*"is any frame a black Vesper
  clone or a lit-seam Solar?"*), judged on the PALE backdrop first.
- **I1 — `stormcellTorso` + the STORM-HEART.** Clover loft + silver rims + cowls + the caged
  dynamo on the coreGlow hook. Gate: the weave reads as billowed cloud (not rings, not a CAD
  blob), rims glint without out-reading the eyes, the heart reads as a dynamo behind vanes.
- **I2 — `strataStormWings` (the HERO).** Decks → anvil taper → slits → fingers → churn pivots →
  fold nesting. Gate: the rear black-fill anvil vs the venetian-blind veto at 250px AND the 2×
  pale crop; span-decay assert green; wingsymprobe Δ0.000; trio frame vs Vesper/Tocsin-concept.
- **I3 — `thunderheadManeHead` + `virgaTail`.** Ram-prow + bosses + mane (no-tangent assert
  green) + eyes; tail chain + virga fringe + hem. Gate: mane punctuation reads at chase; fringe
  reads wispy-tapered (the Tocsin separator); tail-ray alpha ≤2.
- **I4 — THE STORM CIRCUIT + strikes + Surge + the fever firewall.** Arc tree (3 buckets) + the
  storm tick + boost duty + "the Tempest breaks" + the FULL override table. Gate: the two-state
  ruling on PINNED frames (standing frame cool with zero lightning / strike frame ≥3 light
  structures), the seamprobe-style hue proof through the tick math, corridor glare at the pinned
  strike, the overdraw recount (3 cruise / 4 Surge).
- **I5 — the CHARGING ladder + `tests/starters.mjs`.** `forms[]` accretive ×4 + the §B.8 block +
  tricount ladder + the full §8-protocol capture set (all forms, states glide/fold/bank/surge/
  strike, 3 backdrops) + roster neighbor frames. Gate: full-ladder verdict; then the PR preview
  carries the §B.9 residuals.

Each gate is a FRESH high-effort Fable spawn judging real captures against THIS sheet; FAIL →
numbered directives applied verbatim; the builder never judges its own output. THE RULE: a new
lesson file per increment that changes the creature.

### §B.8 `tests/starters.mjs` SPEC — the `tempest` 4-form block (mirrors the Solar/Molten premium blocks at starters.mjs:281/:326 — the in-repo premium precedent; the Molten block additionally donates the corridor-scan pattern reused below)

> **Deck/anvil/slit asserts SUPERSEDED by §D.7 (2026-07-14)** — deck count, rear span-decay,
> top-planform chord decay, slit-open, and `feverWing === 0x000000` are retired/revised there.
> Every non-wing assert (charcoal law, accent law, strike determinism, corridor, firewall…) HOLDS.

Headless via `buildDragonModel` + `ascendedDef(def, t)` for t = 0..3; silhouette asserts import
`renderSilhouette` (+ `holeMetric` where useful — it landed with the Revenant I0) from
`../tools/silhouetteCore.mjs`; pulseTimer imported directly (pure module).
- `maxTierFor('tempest') === 3`; forms accretive length 4; contract fields untouched; NaN-vertex
  guard (the Molten pattern).
- **Tris:** monotonic ↑, each within ±20% of {1.9k, 2.8k, 3.9k, 5.2k}, all <6000.
- **THE ANVIL (the §F law):** `parts.deckElements` per side length {1,2,3,3} exact; for each
  adjacent deck pair at f2/f3, rear-projected span ratio ∈ [0.75, 0.85] (tip-marker world |x| at
  the un-posed rest build); TOP-planform chord decay monotonic with no two decks within 10% chord
  (the §R2.1 assert, kept for the planform); true through-slits: the `rearfit` black-fill between
  deck bands shows background rows at f2/f3 (slit-open assert).
- **NO-TANGENTS:** every mane-spike tip (module-level tip function) vs every deck silhouette edge:
  clear gap ≥0.08 OR overlap ≥0.05, evaluated at `setFlapDebugPose` glide AND bank.
- **CHARGING:** `arcDuty` {.06,.10,.14,.18} exact + `arcRun`/`strataDecks`/`heartScale`/
  `maneSpikes`/`virgaWisps`/`billowAmp`/`glowLevel` monotonic ↑; span:body {1.7,2.0,2.25,2.5}±10%
  ↑, apex ≤2.5; eye:head ↓ {36,28,23,19}%±3.
- **CHARCOAL LAW:** resolved `def.body` HSL-L strictly DECREASING across forms AND ∈ [0.20,0.26]
  at every form (the floor IS the anti-Vesper separator); hue drift ≤8° around ~222°; belly
  lighter than body; zero warm diffuse anywhere (hue <90° or >330° at sat >0.2 → fail); zero
  gold-family.
- **ACCENT LAW:** every emissive hue within ±20° of 255° OR sat ≤0.12 (near-white passes by
  saturation — the sheet's sanctioned lane); **exactly ONE mat with emissive sat <0.06**
  (`arcCore`), and it is absent from both surge arrays.
- **CRUISE-EMISSIVE (by contribution, NOT mid-strike):** with the timer pinned to a rest
  (`pin(0)`) and surge off, summed `emissiveIntensity × luminance(emissive)` = storm-heart + eyes
  ≥85% of total; the arc ember floor ≤15% and every arc mat ≤0.06 intensity; every body/deck/rim
  mat emissive = 0x000000 (inventory assert — the silver rims are machine-checked diffuse).
- **STRIKE DETERMINISM (pulseTimer unit block):** same seed → identical schedule over 10k fixed-dt
  ticks; long-run lit fraction within ±10% of `arcDuty` per form; window ∈ [0.10,0.28] s; rest
  ≥1.2 s; within-window modulation ≤3 Hz; `pin(t01)` reproduces the same state on every call.
- **FEVER FIREWALL:** simulate the surge-tick values (the Revenant §B.8 pattern) — all fever-state
  emissive hues ∈ 255°±20 OR sat ≤0.12; `surgeHi/feverEye/feverWing/trail/boostTrail` asserted
  from the def; `feverWing === 0x000000`.
- **CORRIDOR (adapted from the Molten block, starters.mjs:326):** in the glide pose, the ±10°
  forward corridor { |x| band, y band at rider eye-line } contains NO deck or arc vertices at any
  form; at the pinned strike frame, no emissive-mat vertex inside the corridor (the glare-cap
  companion).
- **Rig contract:** `wingPivot/Mid/TipL/R` published; `wingBladePivotsL/R` lengths {0,1,2,2} across
  forms (decks 2–3 only); fold pose contracts measured span ≤0.66 of glide; wingsym Δ0.000
  (`tools/wingsymprobe.mjs`); tail publishes 4 isBone-rooted joints; motif anchor drift ≤0.15
  pre-scale; `spinePoints` ≥2 inflections at every form; virga wisp tip taper ≤0.20× base.
- **Firewall imports:** `dragonTempest.js` source contains no
  `dragonOrganism|dragonNightFury|dragonUnifiedHull|growSkinnedExtension|sweepProfileSmooth`
  (match import statements, not prose); `pulseTimer.js` imports NOTHING from `js/` (purity assert).

### §B.9 Verification harness checklist + gate-blind residuals

Per DRAGON-DESIGN §8/§9, run per increment and in full at I5:
1. Suites green: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` (FULL roster) ·
   `node tests/starters.mjs` · `node tools/creaturestress.mjs --ci` (the ≤70-draw check).
2. Studio: `node tools/dragonstudio.mjs tempest` — all 4 forms, states glide/fold/bank/surge **+
   `strike` (pinned mid-window)**, fixed angles (rear chase / side / rear-¾ / top planform), three
   backdrops — the PALE backdrop is the primary slit/anvil judge; the warm-gold backdrop is the
   silver-rim stress frame (does the diffuse rim glint stay cold?).
3. Black fills: `tools/silhouette.mjs tempest rear|rearfit|top [form]` (+ `--wings-only` for the
   slit/planform judgments) — the span-decay + slit numbers ride every gate round.
4. Motion: `tools/flapstrip.mjs` 5-phase corridor (±10° empty at ALL phases + folded — the
   forward-HIGH wall clears the centerline dome by construction, verified anyway);
   `tools/wingsymprobe.mjs` Δ0.000 (the blade pivots are per-side published with `side` — the
   mirror-double-flip corollary checked); a named-pivot amplitude table proving the deck lag wave
   travels (deck-1/2/3 ± ranges over N frames, never point samples).
5. Two-state proof: matched PINNED pair — standing frame (`pin(0)`) vs strike frame (`pin(0.5)`)
   on one dark sky (the seamprobe pattern through the real storm-tick math).
6. In-game: `tools/gameshots.mjs` (`?cleanshot&strikePin=0.5`) — chase idle, mid-bank, tier-up;
   integration judgment only.

**Named gate-blind residuals (the human judges these on the PR preview — the gate cannot):**
- **The strike FEEL:** do 1.2–4 s-rest burst clusters read as gathering menace or as twitchy
  neon? (The duty ladder is asserted; the CADENCE character is a feel call. Fallback dials:
  burstMax ↓, rest floor ↑ — duty preserved by longer windows.)
- **Anvil-vs-blinds at gameplay distance** — the §F slit residual: if the slits close at 250px on
  live frames, widen the root gap to 0.16× chord (never the tip).
- **Grey-on-grey-sky legibility** — charcoal + silver rims against the dust-haze biome (owner call
  §Open-5); the dark-identity kicker rig is NOT gated on (luminance 0.20 > the 0.05 gate) — if the
  card reads flat, the rim-diet is the lever, not a body lift.
- **Photosensitivity cadence in real play** (owner call §Open-3): the caps are in the module;
  whether 0.18 duty at f3 FEELS aggressive over a 10-minute run is a human ruling.
- **The churn**: does the blade-walker's hardcoded lag (0.45 rad/deck) read as boiling cloud or
  as wobble? (Flagged ≤3-line nullable dial follow-up if it needs tuning.)
- **The billow** ±3% — alive vs breathing-balloon (fallback: cut, churn carries it).
- Storm SFX tie-in (owner call §Open-4, default OFF).

## §C — BUILD-EXPERIENCE CARRYOVER from the Revenant build (Fable-vetted, anti-reskin; 2026-07-14)

**What this section is.** The Gravelight Revenant (build order #1) banked 15 build-time lessons.
A harsh Fable triage vetted every one against a single test: *does it describe how the ENGINE,
METHOD, CAMERA, MOTION, or MATERIAL-under-light behaves — true whether the subject is bone or
cloud — or does it describe a REVENANT FEATURE (bone, cage, enclosed holes, lantern-core,
phalanx bat-membrane)?* Features do NOT transfer; importing one produces the owner's named
failure: a re-skinned Revenant. Verdicts: **6 TRANSFER · 7 PARTIAL · 2 REJECT.** §B stays the
build contract; §C adds carryover rules to its increments. Where a §C rule and §B disagree, §C
flags it explicitly (one place: the C5 wingbeat catch).

### §C.1 Triage table (all 15 Revenant lessons)

| # | Revenant lesson (2026-07-13-revenant-…) | Verdict | Why | Tempest translation (rewritten, not copied) |
|---|---|---|---|---|
| C1 | `i0-stub-and-the-hole-metric` | **TRANSFER** (tool carved out) | The coexist-in-4-moves pattern, the builder contract, and the byte-identity proof are engine facts. The holeMetric TOOL is Revenant's gauge, not ours. | I0 runs the identical contract: 4 self-registering builders (module imports ONLY three+dragonRecipe+mechaKit); torso publishes `group/attach/spinePoints/spineMats/mats` + **`coreGlow:null`** (the crash-safe stub — a colour number null-derefs every frame); head/wings return `spineMats:[]` never `undefined`; the def OWES `horn`+`scales` hexes (storm-tone, unused mats) or every build spews 2 warnings; `lanceTint`+`lanceRune` mandatory (SSSR roster invariant throws); LEFT wing = outer `lmirror` wrapper (never scale the pivot) → wingsymprobe Δ0.000. **Prove byte-identity by multiset `comm -3` compare of sorted tricount FORM rows** — the naive diff lies (stderr interleave + unlabeled continuation rows). Attribute pre-existing red suites on clean master before gating; gate only on the prescribed four. **Tempest's I0 gauge is NOT hole-fraction** — it is the rear-projected deck-span decay + slit-open assert + pulseTimer determinism (§B.7 I0, already specced). holeMetric's ONE Tempest use is INVERTED: see C-GUARD assert (enclosed-hole count ≈ 0). |
| C2 | `render-in-color-and-fable-gate-from-the-start` | **TRANSFER** | Black-fill proves STRUCTURE, never LOOK; trusting it alone cost the Revenant two increments and a 2.2/5 gate. | `tools/dragonstudio.mjs tempest` colour captures + a FRESH harsh Fable gate at EVERY increment from the first real geometry (I1) — Chromium+Playwright are pre-installed and headless-capable. §B's silhouette asserts (span decay, slit-open, corridor) are structure pre-checks, never the gate. Process: pre-assess (Fable validates the approach + hands back numeric targets) → build → gate on real pixels. |
| C3 | `render-in-color-and-let-the-owner-reference-win` | **PARTIAL** | Both process halves are universal; the anatomy list (medial wrist, vertebra tail, skull, ivory) is Revenant bone. | (a) Never claim colour renders are impossible headless — check first. (b) When the owner posts a reference image or gameplay screenshot, it OUTRANKS this sheet's prose: rebuild to the picture, log the deviation in the changelog, don't defend the digest. REJECT the entire anatomy list — none of it describes a cloud. |
| C4 | `the-money-camera-dictates-proportion` | **TRANSFER** | Pure camera law: a creature tuned at turntable angles still fails if the ONE shipped angle reads wrong. | Grade and tune every proportion at the rear-chase tile FIRST. The identity mass — the STRATA STACK — must own the centre of the rear silhouette at the shoulder line; the mane and virga fringe stay secondary by area; if the charcoal decks lose the frame, the levers are AREA and VALUE (the silver-rim tier), not new geometry. Let the Fable critic localise misses to a camera and hand back numeric deltas ("+X% deck-1 span", "one value step on rims"); apply verbatim, re-render the money tile, re-gate. |
| C5 | `wingbeat-distal-amplitude-must-be-less-than-the-shoulder` | **TRANSFER** | A motion law of the SHARED wingParts rig Tempest rides — substrate-irrelevant. | Shoulder owns 75–85% of the swept arc; forearm+wrist ≤ ~25%, EACH strictly < the shoulder, same rotational direction (never counter-bend), lagged so the decks trail. **CONCRETE CATCH: §B.3b's dial block (`rootAmp .66, midAmp .28, tipAmp .42`) trips this law — tip > mid, and mid+tip = 0.70 > root.** Re-tune at I2 to shoulder-led ownership before the first motion gate; verify headless at the frozen extremes (`silhouette.mjs tempest rearfit --pose=recovery|downstroke` — clock target: top ~12:00–12:30, bottom ~5:00, never 6:00). The deck-2/3 blade-walker sway (0.10–0.14 rad hardcoded) is safely under the shoulder beat — assert it stays there if the follow-up lag dial ever lands. |
| C6 | `give-the-fire-a-body-and-the-bone-mass` | **TRANSFER** | "A billboard is a sticker; a flat ribbon end-on is a wire; a ramp is a claim about rendered pixels" — camera + material facts. | **No billboard, sprite, or flat-ribbon lightning, ever**: every arc strip is a tent/groove with cross-section (§B.4a's law — this lesson is WHY), DoubleSide per §6.5. The dynamo core is a vertex-jittered faceted MESH (jitter = index hash `sin(i*12.9898)*43758…`, never `Math.random()` — determinism), not a sprite. Anything the chase cam sees END-ON needs cross-section there: deck trailing edges, mane spikes, virga wisps are wedges/tents, never single quads. Assert the charcoal ramp on RENDERED medians (monotonic ↓ under ACES), not source hexes — tonemapping compresses the ends. And attribute colour casts to LIGHT before touching albedo (a cool studio fill is not a material bug). |
| C7 | `a-dark-shroud-must-stay-dark-under-the-game-light` | **PARTIAL** | Value-under-the-real-key + distance-dependent highlight facets are universal; the fenestra dark floor is cage/skull anatomy. | The charcoal law (L 0.20–0.26) is a claim about GAME-LIT pixels: lit facets of `0x293040` can lift to mid-grey under the key — verify the band on the game-lit tile, hold roughness 0.85 so lit facets stay inside it. AREA and VALUE are separate levers: the silver rims may sharpen edges but must not lift the wing ZONE's measured value read. Small bright facets are a distance bet: judge rim-catches + horn bosses at the ~250px chase read on both backdrops; if they stack into clutter (the shard-salad tell), cut them — clean ridges only. REJECT the fenestra-floor half. |
| C8 | `a-carved-orbit-is-a-dark-floor-plus-a-lit-rim` | **PARTIAL** | Relief = dark floor + lit rim, and "one flat triangle flat-shades to one value = sticker" are lighting laws; orbits/sockets are skull features. | The DYNAMO recess needs BOTH cues: a genuinely dark interior behind the vanes (dedicated near-black recess mat, envMap 0) AND lit vane edges (silver tier) — depth alone reads as a painted chest decal. Every panel-like element (cowl lobes, virga wisps) carries ≥2 facets with a real out-of-plane crease. Simplify the CONVERGENCE zone: where neck + mane + cowl + deck roots meet, one clean cowl plate per side beats overlapping flakes (detail the open areas instead). **BAN: no eye sockets, orbit pockets, or skull fenestrae anywhere on the ram-prow.** |
| C9 | `i2-a-rear-chase-hole-must-face-the-cam-not-just-exist` | **TRANSFER** | Literally Tempest's #1 risk stated as a law: a gap in a plane is invisible to a camera looking along that plane. | The inter-deck slits must be OPEN IN REAR PROJECTION at the poses the game HOLDS: assert background rows between deck bands in `rearfit` black-fill at glide AND bank AND apex (one transient edge-on pose is fine; edge-on at cruise is a fail). If a slit closes, the fix is ATTITUDE — dihedral stagger (14/20/26°), set-back — plus the root-gap floor 0.16× chord (§F residual); never just "cut a bigger gap." Both anti-clone claims are NUMBERS: not-venetian-blinds = span-decay ×0.80±0.05 + slit px ≥ floor; not-a-Revenant = enclosed-hole count ≈ 0 (C-GUARD). |
| C10 | `i1-an-enclosed-hole-needs-a-continuous-frame` | **REJECT (Revenant-specific)** | Tempest's slits are OPEN-ENDED gaps by design (they open outboard, 0.12→0.22× chord). Importing a "continuous frame" would close them into enclosed framed windows — a rib cage in the wing, the exact reskin failure. | No translation. The one echo, already carried by C1/C9: know what your metric measures — open bays correctly read ZERO enclosed holes, and for Tempest zero is the PASS, not the miss. |
| C11 | `a-lantern-is-lit-bone-not-a-bright-core` | **PARTIAL** | "Light the receiver, not the source", the channel-clip desaturation law, and metric hygiene generalize; lit-bone + the fenestrated skull do not — and running the receiver-lighting CONTINUOUSLY rebuilds the Revenant's lantern. | On STRIKE frames the light must LAND on receivers — deck undersides + vane inner faces (the §B.4a pools) — so the strike reads as the storm lit from within, never as bright lines floating on charcoal. **But only inside strike windows**: a continuously-glowing caged core with lit surroundings IS the Grave-Heart lantern (banned; between windows the ember floor stays ≤0.06 and the frame is diffuse-only). Channel-clip law: keep dominant-channel × intensity under clip on seams + ember so the cold violet cast survives and the `0xd9deff → 0xf2f4ff` strike step stays a visible jump (an over-driven emissive desaturates and the ladder collapses). And when a gate metric measures the wrong thing (two changes move it the wrong way), note the artifact and move on — don't grind an unwinnable number. |
| C12 | `a-wing-membrane-anchors-at-the-pivot-not-the-body-and-not-the-hip` | **PARTIAL** | The pivot-lever law is universal rig physics (a vertex at the rotation centre barely translates); the patagium anatomy is bat-wing. | Any geometry bridging body↔flapping wing satisfies "moves with the wing" AND "stays glued to the body" only NEAR THE JOINT: deck-1's inboard root edge sits close to the shoulder pivot (short lever → no gap opens under the static cowl through the beat; the cowl itself stays body-frame, §B.3a). And nothing spans the hand fold: no element owned by both the hand group and the body/arm — the fold-tear gotcha applies verbatim to deck nesting at the ≤0.66 fold. REJECT the propatagium/brachial membrane anatomy wholesale. |
| C13 | `a-body-membrane-belongs-on-the-body-not-the-flap-arm` | **REJECT (superseded + Revenant-specific)** | Its central fix (body-FIXED membrane) was corrected by the pivot lesson (C12 — "body-fixed reads detached"); the unique remainder is bat anatomy (medial wrist, patagium drape). | No translation. Its surviving echo — grade ARTICULATED poses (fold/bank/flap extremes), not the neutral glide, because flap bugs hide in stills — already lives in C12's verify note and §B.9's flapstrip/fold mandates. |
| C14 | `weld-the-membrane-to-spar-samples-and-cup-it-ventrally` | **PARTIAL** | Shared-sample welding is a universal anti-detach method; the membrane loft + ventral glide cup are bat-wing construction. | Generate the arc-tree polylines FROM the decks' own sampled seam/ridge nodes (the module-level profile functions, sampled AFTER any shaping is baked) so the bolts ride the surface exactly through churn + ±3% billow — a bolt authored from independent constants floats off a breathing deck, and "the lightning detached" is the foreseeable I4 bug. Same for the virga hem: trace the wisps' ACTUAL trailing nodes. REJECT the chiropatagium loft and the ventral membrane cup (the decks already own their inward bay-cup spec; do not add glide-surface camber logic to cloud slabs). |
| C15 | `the-wing-leading-edge-flares-forward-then-hooks-back` | **PARTIAL** | Waypoint-table authoring + the curvature-axis diagnostic are method; the "‹" forward-flare profile is the Revenant reference's bat arm. | Author each deck's leading edge as an interpolated WAYPOINT table (module-level, shared by geometry, tip markers, and tests) — the clean way to give three decks genuinely different direction-changing profiles (§B.3b's non-parallel-curves lock) instead of fighting a formula. When a curve reads wrong, check WHICH AXIS the curvature is in (Y gull arch vs Z ogee) before touching lengths; never fix a direction bug with a length change. **BAN the Revenant waypoint numbers, the "‹" kink, and all wrist-fraction reasoning — a cloud deck has no arm/wrist anatomy to imitate.** |

### §C.2 Carryover build rules → §B increments

- **I0** (+C1, C2): identical coexist contract + the `coreGlow:null` stub + `horn`/`scales` def
  hexes + `lanceTint`/`lanceRune`; **prove roster byte-identity by multiset comm-compare of
  tricount FORM rows**; attribute pre-existing red suites on clean master, gate on the prescribed
  four only. Land the slit/span-decay measurement as I0 tooling (Tempest's counterpart of the
  Revenant's hole metric — §B.7 already specs it with pulseTimer + `?strikePin`); add the C-GUARD
  enclosed-hole ≈ 0 assert. Lock the Fable rubric now, including the §C.3 anti-reskin veto.
- **I1** (+C6, C7, C8, C2): first real geometry ⇒ first COLOUR gate (never silhouette-only).
  Verify the charcoal L band on the game-lit tile, not the swatch. The dynamo = near-black recess
  floor + lit vane rims (both cues) — and it idles dark (ember ≤0.06); no continuous lantern.
  Heart core = hash-jittered faceted mesh, never a sprite.
- **I2** (+C5, C9, C12, C15, C4): re-tune the §B.3b amplitude block to shoulder-led arc ownership
  (the C5 catch: tip .42 > mid .28 as written); slit-open assert IN REAR PROJECTION across
  glide/bank/apex, attitude before gap-size; deck-1 root anchored near the pivot, nothing spans
  the hand fold; leading edges as waypoint tables; grade the stack at the rear-chase money tile
  and let the critic hand back numeric proportion deltas.
- **I3** (+C8, C7, C6): no skull pockets/orbits — the ram-prow stays a solid billowed wedge;
  mane spikes + virga wisps are tents/wedges with ≥2 facets (never single quads); simplify the
  neck/mane/cowl/deck-root convergence zone; judge horn bosses + rims at the 250px read.
- **I4** (+C6, C11, C14, C1): bolts are tents/grooves with cross-section, DoubleSide, welded to
  deck sample nodes (no floating lightning over a billowing deck); strike light lands on the
  receivers (deck undersides, vane faces) inside windows ONLY; channel-clip caps preserve the
  violet cast and the seam→core step; ember floor stays carved-not-lit.
- **I5** (+C6, C4, C11): assert the ramp on RENDERED medians (monotonic under ACES); final
  money-camera proportion pass (the stack owns the rear silhouette centre); if a gate metric
  proves unwinnable (measuring the wrong thing), document and move on — don't trade money-camera
  work for a comparison-render number.
- **Every increment** (+C2, C3): colour captures + a fresh harsh Fable gate; pre-assess → build →
  gate; the owner's reference/screenshot outranks this sheet.

### §C.3 ANTI-RESKIN GUARD — Revenant features the Tempest builder must NOT import

The owner's stated fear is a re-skinned Revenant. These five are FEATURES, not lessons; each
one-line reason is why importing it betrays the cloud-and-lightning identity:

1. **Bone units / vertebra chains / skeletal segmentation** (`vertebraUnit`, bead-chain tails,
   discrete centra) — Tempest is condensed vapor; ANY bone read makes it a skeleton in a cloud
   costume. The virga tail is rain-wisps off a billowed stem, never a chain of segments.
2. **The hollow cage + enclosed through-windows + the hole-fraction ladder** — Tempest's
   see-through is OPEN-ENDED slit gaps between opaque decks; enclosed framed apertures anywhere
   (wing, torso, head) read as ribcage/fenestra. **Standing assert: `holeMetric` enclosed-hole
   count ≈ 0 on every Tempest view/form (≤ the Pearl aliasing floor ~2%)** — the Revenant's
   pass-band is Tempest's FAIL-band.
3. **The lantern-core** (an always-lit caged glow that continuously lights its surrounding
   structure) — the dynamo is INTERMITTENT by identity ("Vesper withholds; Tempest threatens"):
   between strike windows the frame is diffuse-only + ember ≤0.06. A continuous chest lantern is
   a recolored Grave Heart and erases the CHARGING verb (rhythm IS the spectacle).
4. **The phalanx bat-membrane wing** (medial wrist, finger-bone fan, propatagium/plagiopatagium/
   chiropatagium, the "‹" leading-edge kink, ventral membrane cupping, tattered scallop hems) —
   the hero is THREE OPAQUE STRATA DECKS; any membrane/patagium geometry or bat-arm proportion
   reasoning turns the storm-front into a bat with grey skin.
5. **The chalk-ivory BLEACH ramp + "brightest coolest mass in frame" material law** — Tempest
   DARKENS up the ladder (the storm gathers) inside the L≥0.20 floor; importing the Revenant's
   value direction or bone-bright material logic inverts the identity and collides with Pearl's
   lane.

**STANDING GATE VETO (add to every increment's Fable gate, alongside the Vesper/Solar veto):**
*"Does any Tempest frame read like a re-skinned Revenant — bone, cage, lantern, or bat-membrane —
instead of a thundercloud?"* Any YES is an automatic FAIL regardless of the numeric average.

## §D — HERO WING = THE STORMFORK (owner-chosen 2026-07-14; SUPERSEDES the strata-deck: §5, §R, §F, §B.3b, and the wing rows of §B.4/§B.5/§B.6/§B.8)

**SUPERSEDES banner.** The owner REJECTED the triple-stacked strata-deck on aesthetics and chose
**THE STORMFORK ("BOLTFRAME")** from the 5-alternative menu: the wing whose skeleton IS a frozen
branching lightning bolt. Superseded-as-history (each carries a pointer): **§5** (strata concept) ·
**§R** (STACK read + anti-louvre; R2.2 standing-frame law + R2.3 attitude/fringe separators
survive) · **§F** (span-decay anvil; the no-tangents guard + 2×-pale-crop protocol survive) ·
**§B.3b** (`strataStormWings` + its C5-flagged dial block) · **§B.4** wing rows (deck-underside
seam paths; `feverWing 0x000000`) · **§B.5** deck/span-decay/tri rows · **§B.6** W1–W7 · **§B.8**
deck/anvil/slit asserts. SETTLED items 3–4 are re-scoped (opacity law transfers; deck geometry
dies). Everything else — charcoal L 0.20–0.26, the Storm Circuit + sternum dynamo + `pulseTimer`
(duty 0.06→0.18), CHARGING, stormbrow head, virga tail, palette (`0xd9deff` / `0xf2f4ff` /
`0x9fb0c8` / the `0x2e3543`-family ramp), stats/cost 2600 SSR→SSSR, and the **§C carryover +
ANTI-RESKIN GUARD at full, unweakened strength** — survives verbatim. Where §D and any earlier
section disagree, §D wins.

**The identity win, in one line:** the Storm Circuit's arc-tree seams ride the bolt-ridge crests
exactly — the circuit is NOT painted on the wing; the wing's skeleton IS the circuit's f2/f3
branches. Structure and motif are one object, and every strike renders the wing's own construction
diagram root-to-tip. The grind-hook is IN the silhouette.

### §D.1 The rear read — BOLT

- **One word: BOLT.**
- **Black-fill (rear):** two jagged, kinked storm-blades — each wing ONE opaque charcoal blade
  whose leading edge steps through THREE hard bolt angles on a gull-arch macro line, whose
  dominant ray splits mid-length into a **Y** (a stepped-leader fork notching the outline), with
  membrane sagging in cupped bays between a decaying ray rank; the wispy 5-wisp virga fringe
  below, nimbus mane spikes above. **The only angular-stepped outline in the game.**
- **Landmark punctuation (4):** (1) the three kink steps in each leading edge — hard direction
  breaks that survive 250px because they are OUTLINE angles, not interior detail; (2) the Y-fork
  notch near the tip (the fork crotch cuts a V into the planform); (3) the virga fringe
  (irregular, tapering ×0.80 — never rods); (4) the mane spikes — the §F no-tangents guard runs
  unchanged, now against ONE leading edge per side (gap ≥0.08 OR overlap ≥0.05, glide AND bank).
- **Anti-collision:** VESPER = a SMOOTH scallop crescent — pure curves, zero hard angles (and
  L≤0.10 black vs charcoal ≥0.20; ion Surge-only vs intermittent near-white). STILETTO = FOUR
  straight translucent veined blades in a shallow X — count, gloss, translucency, straightness
  all differ. SOLAR = straight GOLD lances — regalia, gold, straight. TOCSIN = round COINS +
  rigid rods. REVENANT = through-HOLES. SYLPH = a soft luminous HOOD. Nothing else STEPS. The
  Tempest↔Tocsin near-pair separation gets STRONGER than the deck era's: (1) angular-stepped
  kinked blades vs round coin row — pure outline geometry, no pixel floor needed (the old
  slit-stripe axis needed one); (2) up-attitude (+14° dihedral, forward-high) vs LOW-flat;
  (3) wispy tapering virga vs rigid straight rods.
- **§C ANTI-RESKIN CLEARANCE (guard unweakened; all five bans held and re-verified):**
  **no BONE** — the bolt-frame is billowed charcoal tent-ridges with silver rim-caps: weather-
  toned, no ivory, no vertebra units, no knuckle nodules, and the frame's language is electrical
  ("kink station", "fork vertex"), never skeletal anatomy. **no CAGE** — `holeMetric` enclosed-
  hole count ≈ 0 stands; the fork crotch bay is OPEN at the trailing edge (asserted §D.7) — a
  V-notch, never a framed aperture. **no LANTERN** — the frame idles carved-dark (ember ≤0.06,
  diffuse-only between windows); the dynamo stays intermittent. **no BAT-MEMBRANE read** — the
  membrane is OPAQUE matte cloud (never translucent skin, no tattered scallop hems), and the
  skeleton's geometry is one no vertebrate limb makes: three hard ≥20° breaks plus a mid-ray
  Y-FORK (no bat finger forks; no arm/wrist anatomical reasoning anywhere in the recipe — the
  fold joint is "the dominant kink," an electrical object). The wing kit LAWS it keeps
  (dominant-plus-decay, cupped bays, cowl+gusset) are DRAGON-DESIGN §4 laws, not Revenant
  features. The standing gate veto rides every increment unchanged, judged FIRST on the standing
  (no-strike) rear crop.

### §D.2 `stormforkWings` — the builder (replaces `strataStormWings` in `js/dragonTempest.js`)

Construction cites (reuse the PATTERNS, fresh geometry): `buildOneScallopWing`
(dragonVesper.js:365–534) · the module-level profile functions `vesperArmY/Z` (346–356) · the
`ridge()` bone-tent helper (400–409) · the connected `edgeBand` (470–477) · the gusset (482–491) ·
the cowl (540–562) · the −anchor wrist fold + `lmirror` outer mirror (616–638) · the seam-mat
DoubleSide pattern (77–78). Shared kit + `tempestMats` from §B.3 unchanged; `deckTiers[4]` renames
to `boltTiers[4]` (same lerp).

**(a) The bolt profile — a module-level WAYPOINT function shared by geometry, tip markers,
blade-pivot placement, and tests (the detach-gotcha law + the C15 waypoint-table method):**

```js
// module-level — the ONE source of truth for the leading edge
const BOLT_T = [0, 0.18, 0.40, 0.68, 1.00];      // stations; interior 3 = K1, K2 (fold), K3 (fork)
const BOLT_Y = [0, 0.042, 0.180, 0.066, 0.048];  // ×hs — gull-arch envelope with bolt offsets baked in
const BOLT_Z = [-0.03, -0.05, -0.02, 0.09, 0.30];// ×hs — the ogee in plan: bows forward inboard, steps hard aft
function boltArm(t, hs) { /* piecewise-LINEAR interp through the 5 waypoints */ }
```

PIECEWISE-LINEAR is the whole trick: between stations the leading edge is a STRAIGHT chord; AT
the stations it breaks hard — a stepped leader, frozen. **The macro line stays an ARCH — the
kinks are the signature, NEVER a full zigzag** — enforced by construction + measured asserts:
exactly **3** interior slope breaks (never more); each in-plane direction change (rear X-Y
projection — the axes the chase camera sees) ∈ **[18°, 60°]**, with **K2's break the MAX** (the
dominant kink = the arch apex = the fold joint) and K1 ≥20° (the elbow-analog: a real bolt angle,
not a soft bow); a **single global Y-max, at K2** (one apex — a zigzag has multiple comparable
peaks and >3 breaks; this has one and exactly 3); every waypoint Y within **±0.06·hs** of the
smooth gull arch (rise 0.18·hs to t 0.40, −0.14 ease after — the vesperArmY family) so the arch
envelope always dominates the deviations. The Z jogs deliver the same stepping in TOP planform
(asserted there — plan jogs don't project astern, §D.6 SF10).

**(b) The Y-FORK + the decaying ray rank (dominant-plus-decay, no comb, no picket fence):**
- `K = boltArm(0.40)` — the fold joint. `F0 = boltArm(1.0)` — the tip, which PINS the span.
- The dominant ray IS the outboard leading edge K→K3→F0 (finger-0-continues-the-LE, the Vesper
  law) — 2 straight segments breaking at K3. **The fork happens AT K3** (t 0.68 ≈ mid-length of
  the hand — a stepped leader branches AT a step; the third kink-knuckle IS the fork vertex, a
  shared welded node, never a floating branch): the BRANCH prong leaves K3 at **+24° aft** in
  plan, **−8°** dip, length **0.62×** |K3→F0|, tip `Fb`. At f3 a 2nd-order SPUR leaves the branch
  at 0.55 of its length, +20°, length 0.52× the branch remainder — the fractal tick.
- Aft rays: 3 more from K (apex = 4 rays total + the branch prong), `lenFrac [1, 0.80, 0.62,
  0.46]` of r0 — **each successive length ≤0.86× the previous** (asserted; the branch 0.62× and
  spur 0.52× obey it too), fanned with `spanAft 1.10` (tighter than Vesper's 1.22 — a storm-BLADE,
  not a broad bat fan), tips drooping aft-and-down. Every ray = **2 straight segments with a small
  mid-break (8–14°, alternating sign down the rank)** — the micro-echo of the macro kinks; bolts
  step, they never sag (landmarks rhyme with the hero, and the Vesper sag-bow is deliberately NOT
  copied — §C.15 ban on imported bat-arm curvature honored).
- **Thickness on every ridge — tent wedges, no paper planes:** all arm segments, rays, and prongs
  are `ridge()` 4-face tents (dragonVesper.js:400–409): arm width 0.16·hs at the root tapering to
  0.05·hs at K3, lift 0.10·hs → 0.035·hs; rays width 0.075·hs·(1−0.08i), lift 0.09·hs. Nothing on
  this wing is a single quad or a 0.014u "crease".

**(c) Membrane bays — the sawtooth killer:** between consecutive ray tips the trailing edge is an
INWARD-cupped quadratic bézier (control pulled toward K, cup 0.32 ×(0.75+0.14·i) per-bay
variance, deepest sag biased aft, bay centre dropped so rim light pools) — **sampled ≥4 segments
(6 at f2/f3)**, inter-lobe cusp depth ≈ **⅓ of peak sag** (asserted ∈ [0.25, 0.45]). **THE
FORK-CROTCH BAY** (between the two prongs): a deeper cup (0.5), the darkest tier, and **OPEN at
the trailing edge** — a V-notch in the outline, never an enclosed aperture. The membrane is
**OPAQUE matte** (the settled opacity law survives the decks): `boltTiers[4]` lerped toward lit
steel-slate `0x8a95ac` over f `[0.60, 0.40, 0.22, 0.06]` (endpoint steps ≥0.05 L — the CP4 law),
assigned by bay index. `M.wingMat` = the inboard tier (the rig's single-material wing contract;
opaque, so the rig's opacity-fade writes are visually inert by construction — noted, not a bug).

**(d) The silver rim-cap tier — the standing frame's carrier:** thin brighter cap strips
(`silverRim 0x9fb0c8`, diffuse, metalness 0.06, envMapIntensity 0.3 — glints, never glows)
tracing EVERY kinked ridge crest: the arm root→K1→K2 (brightest — the Kushala new-skin leading
edge), the dominant ray K2→K3→F0, the branch prong, and the inboard segment of each aft ray.
Between strikes the CARVED charcoal frame + silver caps + the ≤0.06 ember tracery ARE the wing's
cool — the strike is the bonus, never the crutch (§R2.2 held as law).

**(e) The connected knife-edge:** ONE thin translucent band (edge-mat family: brightest wing
value, opacity 0.62, DoubleSide) just inboard of the WHOLE scalloped trailing polyline — from the
innermost bay, around every cusp, around the fork-crotch V, to the tip (per-bay shards banned —
dragonVesper.js:470–477 verbatim pattern). **The only transparency on the wing.**

**(f) The shoulder — cowl + gusset:** root gusset (root-LE → K → hip point) anchored to ARM-side
points only, never a ray tip — the fold-tear law (482–491) — buried under the scapular STORM COWL
(§B.3a's 2 billowed lobe-plates, STATIC in the body frame). The membrane's inboard edge sits
close to the shoulder pivot (C12's pivot-lever law inherits).

**(g) Value tiers that read (≥3, judged on the pale backdrop):** (1) silverRim caps — brightest;
(2) `boltTiers[3]` outboard lit-slate membrane; (3) `boltTiers[0]` inboard charcoal membrane;
(4) `stormShadow` tent sides + the crotch-bay dark — four diffuse steps ≥0.05 L apart, plus the
ember tracery (emissive ≤0.06) as a carved 5th. **Tri estimate ~300/wing → ~0.6k/pair at apex**
(the strata stack was ~1.1k — see §D.5 for the honest re-pin).

### §D.3 Circuit-as-skeleton plumbing (the arc-tree ON the crests; fever; overdraw recount)

- **The arc-tree = thin opaque-emissive TENT overlays riding the ridge crests exactly**, generated
  FROM the same sampled crest nodes the ridge geometry uses (the module-level `boltArm` + ray
  functions, sampled after shaping — the C14 weld law: a bolt authored from independent constants
  floats off its frame; this one CANNOT detach because it shares the skeleton's own nodes).
  Shallow 2-face tents lifted 0.008 above the silver caps, **`side: THREE.DoubleSide`** on every
  strip (the culled-ignition no-op gotcha, DRAGON-DESIGN §6.5). `arcSeam` (`0xd9deff`) with the
  `arcCore` (`0xf2f4ff`) hue-lerp at strike peak — both mats unchanged from §B.3.
- **Withheld in cruise:** `arcSeam` base ≤0.06 (the ember floor) — the standing frame reads
  CARVED, not lit (C11's anti-lantern law: between windows the frame is diffuse-only). The high
  strike/surge multiplier is delivered by the SINGLE-WRITER storm tick (§B.4c verbatim):
  `emissiveIntensity = floor + env01(t − 0.04·bucket) · peak(form)`.
- **Buckets re-pathed (supersedes §B.4a's deck-underside paths):** b1 = heart + scapulars → K1 ·
  b2 = K1→K2→K3 (the arm crest) · b3 = K3→F0 + the fork branch (+ f3 spur) + the aft-ray crests +
  tail stem + charge-hair. A strike ignites the skeleton **ROOT-TO-TIP over ~0.12 s** — the
  dragon flies on two lightning bolts, and `arcRun`'s f2/f3 growth is literally the wing's own
  frame joining the circuit (f2 = carved to the fork; f3 = every tip live). The seeded zig-zag
  polyline generator survives for the TAIL stem + charge-hair only — on the wing, the "jitter" is
  the frame's own kinks (stormSeed determinism unchanged).
- **FEVER — the wing frame IS the ignition (revises two §B.4d rows):** the membrane becomes the
  RECEIVER (C11: light the receiver, inside windows/Surge only). **`feverWing: 0xd9deff`** (was
  `0x000000` — a black feverWing here would leave the blazing frame reading as lit wire floating
  on dead cloth; the Vesper black-kill-switch precedent was correct for a wing the light was NOT
  part of, and wrong for this one). The rig's fever path lerps `wingMat`'s emissive toward it with
  `sgm`; **CAP the membrane's contribution: wingMat fever emissiveIntensity ≤ 0.30** — the frame
  must out-read the membrane ~5:1 (the frame is the bolt; the membrane is cloud catching it).
  `wingEmissive`/`wingMembraneEmissive` stay `0x000000` (cruise/boost membrane dark). Every other
  §B.4d row HOLDS: `feverEye`/`surgeHi 0xe8ecff`, cold `feverWash`, `hideRiderGlow`, arc mats in
  NEITHER surge array (single-writer), heart in flareMats for the hue lerp only.
- **≤1 near-white discipline held:** `arcCore` (sat <0.06, strike-peak only, cap ≤2.0) remains
  the ONLY true-near-white emissive; `feverWing 0xd9deff` is sat 0.09 — inside the sanctioned
  255° lane, not a second near-white. Glare caps unchanged (arcSeam ≤2.4, heart ≤1.6); channel-
  clip law (C11) keeps the violet cast + the `0xd9deff → 0xf2f4ff` strike step a visible jump.
- **Overdraw census (recounted honestly):** CRUISE transparent drawables = 1 storm-heart core +
  1 virga hem + 1 trail + **2 knife-edge bands (L/R meshes, one shared material)** = **5 ≤ 6**.
  SURGE = + the fever aura sprite = **6 ≤ 6 — AT the ceiling, zero slack**: `surgeMotes` stays
  absent (already law), and the named fallback if p95 flags is the band dropping to opaque
  lit-slate (the silver caps carry the rim read). Added-transparent-beyond-the-band = **0** — the
  arc overlays are opaque emissive, the membrane opaque, the tents opaque. Max alpha layers along
  any chase ray: wing ray = 1 (band) · tail ray = 2 (hem + trail) · heart ray = 1 — all ≤2 ✓.
  Draws: ~8–9 meshes/wing ≈ 18/pair (under the strata's ~20); apex total ≤70 holds.

### §D.4 Motion (shoulder-led — the §C.5 broken-linkage tell is dead)

- **`wingParts 3` cascade:** pivot (shoulder) → mid (the arm, root→K1→K2) → tip (the HAND at K2):
  `tip.position.set(K)`, `hand.position.set(−K)` — the −anchor law, rest pose byte-identical.
  LEFT = outer `lmirror scale.x = −1` wrapper PARENTING the pivot (never on the pivot;
  dragonVesper.js:616–638 verbatim). **The fold joint is the dominant kink** — the wing folds
  where the bolt breaks hardest (identity rhyme); fold contracts measured span **≤ 0.66**
  (asserted), branch-prong nest clearance 0.02 checked in the builder at the fold pose.
- **THE CRACKLE-CHURN — the fork rides the blade walker:** publish `wingBladePivotsL/R` entries
  (the rig's lag walker, dragon.js:852–859 — zero rig surgery): **idx 1 = a pivot AT K3 owning
  the branch prong** (+ f3 spur + the crotch-side bay skirt whose inboard vertices sit AT K3 —
  C12's pivot-lever law: shared-boundary displacement → 0); **idx 2 = a pivot at the aftmost
  ray's root** owning that ray + the aft half of its bay, boundary vertices at the pivot. The
  walker phase-lags them 0.45/0.9 rad behind the beat with sway 0.10/0.14 rad — **the fork tips
  SHIVER like a stepped leader hunting for ground.** Seam breathing at the shared bay edges
  ≤0.012 units at the walker's hardcoded extremes (asserted) — no membrane tear by construction.
- **The dial block, FIXED shoulder-led (kills the flagged inversion `tipAmp .42 > midAmp .28`):**
  `flapBias 0.82, flapAmp 0.8, wingParts 3, rootAmp 0.74, midAmp 0.14, tipAmp 0.08, midLag 0.45,
  tipLag 0.95, glidePow 1.9, restLift 0.06, apexMid 0.06, apexTip 0.10`. Shoulder arc ownership
  0.74/0.96 = **77%** (inside C5's 75–85% band); mid+tip = 22.9% ≤ ~25%; **each distal strictly <
  proximal** (0.74 > 0.14 > 0.08), same rotational direction, segments trailing via the lags.
  `glidePow 1.9` = the heavy weather-front beat held; block unique in the roster (Vesper 2.2 /
  Revenant rootAmp 0.72 glidePow 1.15 — §2.13 clean). Verify at the frozen extremes (clock law:
  top ~12:00–12:30, bottom ~5:00, never 6:00) + the named-pivot amplitude table (§D.7).
- **Beat character:** the `glidePow`-shaped waveform holds the broad glide and pulses heavy beats
  through it; pulseTimer's downstroke bias means strikes tend to fire at the beat apex — **the
  bolt-frame flashes as the wing slams** (free drama, zero new code).
- **FX handles ride the folding part:** tip markers duplicate the SAME `boltArm` function
  (module-level — the trail-detach bug is impossible), parent to the HAND; `parts.wingElements` =
  the arm + dominant-ray path; per-tip markers at F0/Fb feed trails + the §D.7 asserts.

### §D.5 The 4-form CHARGING ladder — wing dials (replaces §B.5's deck rows; all non-wing rows hold)

| dial | f0 Squall Pup | f1 Stormcell | f2 Thunderhead | f3 Tempest Unleashed | assert |
|---|---|---|---|---|---|
| `kinkKnuckles` | 1 (K2 only, soft ~12°) | 2 (+K1) | 3 (+K3; breaks enter [18°,60°]) | 3 (fully hard) | exact {1,2,3,3}; band at f2/f3 |
| Y-FORK (dominant ray) | — | — | **fork arrives** (at K3) | fork + 2nd-order spur | {0,0,1,1}; spur f3-only |
| rays (dominant + aft) | 2 | 3 | 4 | 4 | monotonic ↑; decay ≤0.86× each |
| bay NSEG | 4 | 4 | 6 | 6 | ≥4 always |
| silver-cap crest coverage | 0.35 (leading arm) | 0.55 (+dominant ray) | 0.80 (+ray roots, branch) | 1.0 (full frame + spur) | monotonic ↑ |
| membrane tiers | 2 | 3 | 4 | 4 | steps ≥0.05 L from f2 |
| strike-live completeness (`arcRun`) | heart node (0) | root→K2 (0.5) | root→fork (0.75) | root→every tip (1.0) | monotonic ↑ (numbers unchanged from §B.5) |
| `wingBladePivots` /side | 0 | 1 (aft ray) | 2 (+branch prong) | 2 | {0,1,2,2} |
| span : body | 1.7× | 2.0× | 2.25× | 2.5× | ↑, ±10%, apex ≤2.5 (refinement 7 honored) |
| `billowAmp` (bay groups) | 0 | 0.015 | 0.02 | 0.03 | monotonic ↑ (moved off deckGroups) |
| tri target | **~1.8k** | **~2.6k** | **~3.6k** | **~4.7k** | monotonic ↑, ±20%, <6000 |

**Tri re-pin rationale (honest, not aspirational):** the Stormfork sheds the ×3 deck duplication
(~1.1k/wing-pair → ~0.6k at apex). The silhouette-economics law says do NOT pad the budget back —
the OUTLINE (kinks + fork) does the work; NSEG 6 and the f3 spur are already inside the count.
Growth verb still **CHARGING**: `arcDuty` ↑ + strike-completeness ↑ + `kinkKnuckles` ↑ + the fork
arriving + `heartScale` ↑ — **the bolt-frame maturing**: the pup is one soft bend of cloud; the
apex is a full three-kink, Y-forked stepped-leader skeleton that goes live root-to-tip. The fork
arrives at f2 exactly when the circuit's first fork carves (`arcRun` 0.75) — structure and motif
rung-locked. Apex superiority = shape-completion, never scale.

### §D.6 Feasibility audit (SF rows replace §B.6's W1–W7; T/H/M/V rows hold)

| # | element | engine construction path (cited) | overdraw | biggest risk | mitigation |
|---|---|---|---|---|---|
| SF1 | `boltArm` waypoint profile (module-level, shared) | `vesperArmY/Z` profile-as-function precedent (dragonVesper.js:346–356) + the C15 waypoint-table method | 0 | **HEADLINE (a): the kinked outline collapsing to SAWTOOTH/COMB at 250px** | "3 knuckles on an ARCH, never a zigzag" — exactly-3 + single-global-max + break band [18°,60°] + arch envelope ±0.06·hs (all asserted); bays ≥4 seg, cusp ⅓; dominant-fork decay ≤0.86×; judged on the **STANDING (`pin(0)`, no-strike) rear crop FIRST** at 2× on the pale backdrop — the wing must be a badass carved storm-blade with ZERO lightning before any strike frame is graded |
| SF2 | ridge tents + silver rim-caps | `ridge()` 4-face tent + cap (400–409) | 0 | caps out-glint on a dark sky (the Vesper I1 failure) | envMapIntensity capped 0.3; judged both backdrops; dim one notch if they out-read the eyes (T2 inherited) |
| SF3 | Y-fork + decaying ray rank | finger-fan tips pattern (386–393) + `lenFrac`; fork = shared welded node at K3 | 0 | the fork reads as a 5th equal finger → comb | fork ONLY on the dominant; branch 0.62×, spur f3-only 0.52×; every successive length ≤0.86× prev (assert) |
| SF4 | opaque membrane bays | bay bézier fan, ≥4 seg, aft-biased sag (443–463) | 0 (opaque) | sawtooth Vs between rays | NSEG ≥4 (6 at f2/f3) + cusp ∈[0.25,0.45]× peak (assert) |
| SF5 | connected knife-edge band | `edgeBand` ONE-strip pattern (470–477) | **+2 drawables (L/R, 1 mat) — the wing's only transparency** | Surge census at ceiling 6/6 | counted honestly (§D.3); fallback = opaque lit-slate band (silver caps carry the rim); `surgeMotes` stays banned |
| SF6 | cowl + gusset shoulder | gusset arm-side anchors (482–491) + static body-frame cowl (540–562) | 0 | fold-tear if any vertex crosses the K2 joint | arm-side-only anchoring verbatim; nothing spans the hand fold (C12) |
| SF7 | circuit crest overlays | Vesper seam-mat pattern (77–78) + DoubleSide §6.5 + C14 weld-to-sample-nodes | 0 (opaque emissive) | **HEADLINE (b): frame ignition = photosensitivity / glare hazard** — root-to-tip live is more lit length than the old deck seams | the caps live IN pulseTimer (window ≥0.10 s, rest ≥1.2 s, ≤3 Hz — no call site can strobe faster); peak caps arcSeam ≤2.4 / arcCore ≤2.0 / heart ≤1.6; strip width ≤0.022·hs → coverage ~5–6%, asserted ≤7% by area sum; ±10° corridor emissive-clear at the PINNED strike; DoubleSide kills half-ignited flicker asymmetry; duty/window are the drama levers, NEVER intensity (rim-diet law) |
| SF8 | fork crackle-churn | `wingBladePivotsL/R` walker (dragon.js:852–859, hardcoded lag/sway) | 0 | membrane tear at the flutter boundary | C12 pivot-lever anchoring (boundary verts AT the pivot); seam breathing ≤0.012 at walker extremes (assert); sway ≤0.14 rad stays under the shoulder beat |
| SF9 | fold at K2, span ≤0.66 | wingParts fold pose + contraction assert (starters pattern) | 0 | the branch prong poking through the folded membrane | nest clearance 0.02 at the fold pose checked in the builder; flapstrip 5-phase + fold pin |
| SF10 | rear-read measurement | pure math on published tip markers + `rearfit` black-fill (silhouetteCore.mjs:90) | offline | kink breaks measured in the wrong projection (plan Z jogs don't project astern) | Y-breaks asserted in the rear X-Y projection (the camera's axes); the Z ogee asserted in TOP planform separately |

**Q(a′) — does the single kinked blade read premium WITHOUT the lightning (82–94% of play)?
YES — with the sawtooth discipline airtight.** The standing frame carries four independent
systems: (1) the only angular-stepped OUTLINE in the game (outline beats interior detail at
250px — this is a stronger 250px bet than the deck slits, which needed a 3–5px gap to survive);
(2) the silver rim-caps tracing the full frame — the "silver lining", diffuse, warm-sky-safe;
(3) four membrane tiers + carved ember tracery (≥0.05 L steps, ≤0.06 emissive); (4) the
crackle-churn + billow motion. Every gate judges the standing crop FIRST (SF1). **Q(b) from §B.6
holds unchanged** — the circuit is the same cited tech on a better carrier.

### §D.7 `tests/starters.mjs` — wing asserts (replace §B.8's deck/anvil/slit asserts; every non-wing §B.8 assert holds)

- **PROFILE SHARED:** tip-marker + `wingElements` positions equal `boltArm()` evaluations — one
  module-level function, no duplicated formula (the detach gotcha, machine-checked).
- **KINKS (arch-not-zigzag, computable):** interior slope-break count of the leading-edge
  polyline in REAR X-Y projection = **{1,2,3,3} exact** across forms; at f2/f3 each break ∈
  [18°, 60°], **K1 ≥20°** (the elbow-analog), **K2's break the max**, **single global Y-max at
  K2**, waypoint Ys within ±0.06·hs of the smooth arch.
- **FORK:** present f2+ on the dominant ray only ({0,0,1,1}); spur f3-only; fork vertex is a
  shared node (weld); ray + prong lengths **each ≤0.86× the previous** (dominant+decay).
- **BAYS:** every membrane arc sampled **≥4 seg** (≥6 at f2/f3); cusp depth ∈ [0.25,0.45]× peak
  sag; the fork-crotch bay OPEN at the trailing edge; `holeMetric` enclosed-hole count ≈ 0 on
  every view/form (the C-GUARD, kept).
- **MOTION (anti-broken-linkage):** def dials `rootAmp > midAmp > tipAmp` AND (mid+tip)/(sum) ≤
  0.28; measured named-pivot amplitude table over N frames: |pivot| > |mid| > |tip| as ± RANGES
  (never point samples); `wingBladePivotsL/R` lengths {0,1,2,2}; flutter-boundary seam breathing
  ≤0.012 at walker extremes; fold pose contracts span ≤0.66; **wingsym Δ0.000**
  (`tools/wingsymprobe.mjs`).
- **SPAN:** span:body {1.7, 2.0, 2.25, 2.5} ±10% monotonic ↑, apex ≤2.5.
- **CRUISE-EMISSIVE (by contribution, timer pinned `pin(0)`, surge off):** storm-heart + eyes
  ≥85% of summed `emissiveIntensity × luminance(emissive)`; every wing-frame arc mat ≤0.06;
  every membrane/cap/tent mat emissive `0x000000` (inventory assert — the silver caps are
  machine-checked diffuse). **EXCEPT mid-strike** (`pin(0.5)`): exempt by design — assert instead
  corridor-clear + the peak caps + coverage ≤7% of wing surface by strip-area sum.
- **NEAR-WHITE:** exactly ONE mat with emissive sat <0.06 (`arcCore`), absent from both surge
  arrays.
- **FEVER (revises §B.8):** simulate the surge-tick values — all fever-state emissive hues ∈
  255°±20 OR sat ≤0.12, **never magenta** (no hue in 280–340° at sat >0.2 anywhere in fever
  state); **`feverWing === 0xd9deff`** (near-white lane — REPLACES the retired
  `feverWing === 0x000000` assert) with membrane fever emissiveIntensity ≤ 0.30;
  `feverEye`/`surgeHi 0xe8ecff` asserted from the def.
- **TRIS:** {1.8k, 2.6k, 3.6k, 4.7k} ±20%, monotonic ↑, all <6000.
- **RETIRED (named so nobody re-adds them):** deck count {1,2,3,3} · rear span-decay ×0.80±0.05 ·
  top-planform chord decay · slit-open · deck-nest clearance · `feverWing === 0x000000`.

### §D.8 Gate-blind residuals for the PR preview (wing-specific; §B.9's non-wing residuals stand)

- **The standing-frame kink read at speed:** the asserts prove the angles exist; whether the
  stepped outline reads BOLT (not "damaged wing") in motion at 250px is the human's call. Levers
  if it misses: sharpen K2 toward 55°, deepen the crotch notch — never add a 4th kink.
- **The fork flutter feel:** leader-hunting shiver vs nervous wobble (the walker's lag is
  hardcoded; the ≤3-line nullable dial follow-up stays flagged from W5).
- **Strike-on-frame drama vs glare** in real play (owner call §Open-3 unchanged): the caps are
  in the module; whether a root-to-tip frame ignition FEELS like flying on lightning or like a
  neon sign rides the preview.
- **Surge census at 6/6:** zero slack — if p95 flags, the knife-edge band drops to opaque
  lit-slate (named fallback, SF5).


## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh storm drake THUNDERHEAD TEMPEST — identity IMMINENT
  (the gathering storm); hero = THE STRATA STORM-FRONT (triple-deck slab stack, opaque, slit gaps);
  motif = THE STORM CIRCUIT (branching near-white arc-tree, intermittently live, deterministic timer);
  the CHARGING ladder. Three hard separators from Vesper baked as laws. Next: `tempest` stub + gate
  calibration, then torso → decks → circuit behind nullable dials, per-increment Fable gates.
- **v1 (§B — BUILD-READY sheet; Fable design-director + feasibility audit, 2026-07-13).** The owner
  chose Tempest SECOND of the Fresh Five (after the Revenant). §B grounds the anatomy in the
  shipped-storm research DNA (Dvalin's three-per-side wing stack + glowing wing-scale rims → the
  triple-wing read + the diffuse rim-catch tier; Zekrom's Overdrive turbine + lit mane tip → the
  caged-dynamo storm-heart + the f3 mane tip node; Kushala's silver plating + churning wind →
  the glint-tier rims + the churn/billow) and audits every element to a CITED engine path. The big
  engine finds: v0's `deckLag` dial has NO rig hook but `parts.wingBladePivots` (dragon.js:852–859)
  IS the churn hook (per-deck lag + the +6°/deck splay, zero rig surgery); the arc mats must be
  SINGLE-WRITER outside both surge arrays (the flare loop's else-reset + the warm spineMats rim
  would clobber/tint them); the storm-heart rides `parts.coreGlow` (transparent, the hook's third
  user). Honest corrections: v0's apex body hex broke its own L≥0.20 floor (ramp re-pinned
  `0x3a3f4a→0x333947→0x2e3543→0x293040`); v0's "1-in-7s" cadence contradicted the duty ladder
  (burst-cluster schedule keeps the asserted duty); apex span 2.6→2.5 (roster cap); `strikeShudder`
  CUT (the tail walk is a closed writer). **LANDS `js/pulseTimer.js`** — pure seeded deterministic
  burst-cluster scheduler (bossRhythm.js architecture precedent), photosensitivity caps in-module,
  `pin()` + `?strikePin` + a dragonstudio `strike` state for pixel-comparable gates (Tocsin reuses
  it). Overdraw counted: cruise 3 transparent (heart+hem+trail), Surge 4, ≤2 alpha layers any ray;
  wings ~20 draws, apex ≤70. Increment plan I0–I5 (stub+pulseTimer+calibration → torso+heart →
  strata decks → head+tail → circuit+Surge+firewall → ladder), each behind a fresh Fable gate.
  Next: cut the build branch and run I0.
- **v1.1 (§C — Revenant build-experience carryover; Fable harsh triage, 2026-07-14).** The
  sibling Revenant build banked 15 lessons; a Fable critic triaged every one for what genuinely
  transfers to a structurally-different dragon: **6 TRANSFER · 7 PARTIAL · 2 REJECT** (§C.1),
  with each keeper rewritten as a Tempest directive and cross-referenced into the §B increments
  (§C.2). Headline transfers: render-in-COLOUR + Fable-gate from increment one (the Revenant's
  costliest miss); the rear-chase slit-must-FACE-the-cam law (attitude before gap-size);
  give-the-lightning-a-BODY (no billboard/ribbon bolts); the byte-identity multiset proof; and a
  concrete catch — §B.3b's wing dials (`tipAmp .42 > midAmp .28`, mid+tip > root) trip the
  Revenant's broken-linkage motion law and must be re-tuned at I2. Rejected as reskin-bait: the
  enclosed-hole continuous-frame law (would close the slits into a ribcage) and the superseded
  body-membrane lesson. NEW §C.3 ANTI-RESKIN GUARD: five banned Revenant features (bone units /
  cage + enclosed holes / lantern-core / phalanx bat-membrane / ivory bleach ramp), a standing
  `holeMetric ≈ 0` anti-cage assert (the Revenant's pass-band is Tempest's fail-band), and a
  standing gate veto: *"does any Tempest frame read like a re-skinned Revenant instead of a
  thundercloud?"* §B untouched; §C is additive.
- **v2 (§D — HERO WING = THE STORMFORK; owner decision + Fable design-director + feasibility
  audit, 2026-07-14).** The owner REJECTED the triple-stacked strata-deck on aesthetics and chose
  the STORMFORK ("BOLTFRAME") from a 5-alternative menu: the wing whose skeleton IS a frozen
  branching lightning bolt — rear read **STACK → BOLT**, the only angular-stepped outline in the
  game. §D supersedes §5/§R/§F/§B.3b and the wing rows of §B.4/§B.5/§B.6/§B.8 (all kept as history
  with pointers). The build: a module-level piecewise-LINEAR `boltArm` waypoint profile (3
  kink-knuckles on a gull arch — exactly 3, breaks ∈[18°,60°], single global max, arch envelope
  ±0.06·hs: the arch-not-zigzag law made computable), the Y-fork AT K3 (the third kink IS the fork
  vertex; branch 0.62×, f3 spur), dominant+decay rays ≤0.86× each, inward-cupped bays ≥4 seg with
  ⅓ cusps, `ridge()` tent thickness everywhere, silver rim-caps carrying the standing frame, ONE
  connected knife-edge band (the wing's only transparency). THE IDENTITY WIN: the Storm Circuit's
  arc-tree rides the bolt-ridge crests welded to the frame's own sample nodes — the wing skeleton
  IS the circuit's f2/f3 branches; strikes ignite it root-to-tip over ~0.12 s via the unchanged
  3-bucket storm tick. Fixes banked: the §C.5-flagged broken-linkage dial block re-tuned
  shoulder-led (rootAmp .74 > midAmp .14 > tipAmp .08 — 77% shoulder ownership); `feverWing`
  0x000000 → 0xd9deff capped ≤0.30 (the frame is the ignition — the membrane becomes the Surge
  receiver); fork tips published as `wingBladePivots` (the crackle-churn, C12-anchored, zero rig
  surgery). Honest recounts: overdraw cruise 5 / Surge 6 (≤6, at ceiling — fallback named); tris
  re-pinned {1.8, 2.6, 3.9→3.6, 5.2→4.7}k (the ×3 deck duplication sheds ~0.5k at apex;
  silhouette-economics says don't pad it back). Anti-reskin guard cleared at full strength (no
  bone/cage/lantern/bat-membrane read; holeMetric ≈0 stands; crotch bay open-ended). Headline
  risks + mitigations: (a) sawtooth/comb collapse at 250px — 3-knuckles-on-an-arch discipline,
  judged on the STANDING no-strike rear crop first; (b) frame-ignition glare — pulseTimer
  in-module caps + coverage ≤7% asserted + corridor-clear at the pinned strike. Synthesis doc
  updated (matrix cell → "boltframe: kinked opaque membrane, forked lightning-skeleton"; rear
  read BOLT). Next: I2 builds `stormforkWings` against §D.
- **v3 (THE CONSOLIDATED CONTRACT + the owner-reference glow; Fable design-director,
  2026-07-14).** Structural: the sheet had decayed into a supersede-palimpsest (§B patched by §C,
  partially replaced by §D, with superseded fragments scattered through §5/§R/§F/§B.3b–§B.8) — a
  builder had to reconcile four strata before writing a line. Rewritten as ONE self-contained
  contract (§1–§10 at the top, Revenant-§B structure: identity laws → reference-DNA table → art
  direction/silhouette → four fully-specced builders with cited engine paths → circuit plumbing +
  overdraw census → CHARGING ladder → feasibility audit with the two hardest questions → I0–I5 →
  starters spec → residuals), with the STORMFORK as the NATIVE hero and all v0–v2 material demoted
  to a clearly-marked history appendix. Zero "read X but ignore Y." Identity: the emissive
  doctrine is REVISED in the owner's favour — the reference image shows the lightning as a
  generous glowing garment, so "withheld (duty 6–18%, dark otherwise)" becomes **"generously lit,
  building"**: the circuit (bolt wing-frames + spine + sternum/underbelly veins + glowing crest +
  tail bolt-tuft + dynamo) idles at a breathing hum (humFloor 0.30→0.90 up the ladder, ω fixed),
  pulseTimer strikes are the PEAK (contrast capped 2.2–4.0× — no more ignition-from-dark, which
  also shrinks photosensitivity modulation depth), Surge stays "the Tempest breaks." CHARGING
  survives intact (arcRun/arcDuty/humFloor/coverage/heartScale all monotonic). New reference-era
  anatomy: lifted belly `0x566384`, sternum-vein circuit, spine circuit, glowing stormbrow crest
  strips, the faceted BOLT-TUFT tail terminus (~70 tris, arcCore tips); builder renames
  `stormcellTorso→cumulonimbusTorso`, `thunderheadManeHead→stormbrowHead` (nothing built yet).
  Honest recounts: the garment is OPAQUE emissive (zero added transparency) — census cruise 5/6,
  Surge 6/6 at ceiling with the knife-edge→opaque fallback named; coverage ladder 4/7/10/12% ≤12%
  asserted by strip-area sum; tris re-pinned {1.8, 2.7, 3.7, 4.9}k (+~200 apex garment tris).
  Retired asserts named so nobody re-adds them (≤0.06 ember floor · "heart+eyes ≥85%" ·
  `feverWing 0x000000` · all deck-era asserts); new locks: garment distribution (wing-frame ≥45%,
  heart ≤15% — the anti-lantern machine check), hum ±10% of humFloor at `pin(0)`, contrast band
  at `pin(0.5)`, Solar added to gate calibration (the new nearest emissive neighbour). Anti-reskin
  guard restated at full strength for the garment era. Synthesis doc updated (Tempest owns TIME,
  re-based on rhythm-of-a-live-garment; Tempest↔Solar watched cell added). Next: cut the build
  branch and run I0 against §1–§10 ONLY.
