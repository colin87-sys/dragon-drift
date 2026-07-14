# BELLADONNA STILETTO — "Venom, patiently brewed" · Premium Build Sheet (fresh wasp-DRAGON)

**v1 — THE CONSOLIDATED BUILD-READY CONTRACT (2026-07-14).** This sheet was rebuilt as ONE
coherent, self-contained builder's contract implementing the **locked art direction**
(`BELLADONNA-ARTDIRECTION-LOCK.md`, Fable art-director ruling 2026-07-14 — where this contract
and the lock could ever be read to diverge, the LOCK wins on taste, this contract wins on
engine mechanics, and both were written to agree). §1–§10 below are the ONLY sections a build
chat reads. Every number, path, and assert that used to live across v0 §0–§12 + the §R/§F
critic passes has been reconciled INTO the contract; the full pre-lock history is preserved
verbatim in the **APPENDIX (design history — superseded; do not build from here)** at the
bottom. If anything in the appendix appears to disagree with §1–§10, the contract wins, always,
with zero reconciliation required of the builder.

One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`). Poison/venom insectoid-dragon lane,
proven in shipped games (Pokémon *Naganadel* — the luminous-venom wasp-abdomen Poison/Dragon —
and *Dragalge*; the poison-wyrm archetype through *Níðhöggr* and countless RPGs), copied from
none. **Read first:** `DRAGON-DESIGN.md` (laws, wing kit §4, motion kit §5, glow §6, harness §9)
· `BELLADONNA-ARTDIRECTION-LOCK.md` (the AD authority this contract implements) ·
`VESPER-NIGHTGLASS-BUILDSHEET.md` (house format) · `PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b.
Numbers here are the authority; every Fable gate judges against THIS contract.

---

## §1 Identity contract + frozen identity laws

Fresh roster key `stiletto` — fully additive, nothing shipped changes.
`name:'Belladonna Stiletto'` · `title:'Venom, patiently brewed'` · `rarity:'SSR'` /
`maxRarity:'SSSR'` · `cost: 2400` · `stats { speed 1.14, handling 1.18, drain 0.90,
regen 1.08 }` (the roster's dart — fast and twitchy, thirstier and slower to refill: a striker,
not a cruiser) · `fx.auraColor '217,54,255'`, `auraIdle 0` · `forms[]` accretive, length 4 ·
`maxTierFor === 3` · `hasStyle` · `accentHue: 0xd936ff`.

**One-sentence read (the AD lock, verbatim):** a lethal wasp-DRAGON in horizontal chase flight —
a draconic chitin skull-mask, a short armored neck, and one pair of tucked raptorial claws on a
gloss oil-slick violet-black dart; four gossamer veined blade-wings in a shallow X, a pinched
wasp-waist, a three-window venom gaster glowing UV-orchid, and a needle stinger trailing
dead-center at the lens.

**Frozen identity laws (v1):**
1. **THE SKELETON IS A DRAGON; THE ANATOMY KIT IS WASP** *(the lock's ruling — structural, not
   cosmetic)*. Dragon owns the FORWARD half (the parts that decide "what animal is this"): the
   draconic chitin skull-mask head, a short 2–3-plate collared neck, ONE pair of tucked
   raptorial draconic forelimbs, and the mass hierarchy. Wasp owns the AFT half (the parts that
   decide "which dragon is this"): the pinched waist, the three-window venom gaster, the needle
   stinger, the four wings, the horn-gauge antennae, and the chitin surface language. ≈60%
   dragon chassis / 40% insect kit. She is a dragon that evolved wasp anatomy — never a bug
   scaled up. No other legs, no separate horns, no bug mandible-face, ever.
2. **HORIZONTAL FLIGHT.** Body axis (nose → gaster tip) within **±8° of the flight path** in
   cruise; head level, carried slightly BELOW the proud thorax crown (the thorax is the highest
   dorsal point). The S-curve lives in the SIDE line-of-action — brow → thorax-crown rise →
   waist DIP → gaster swell → stinger under-curl presenting the needle up-toward the chase lens
   (`stingerPresent 0.4`, ≥1 inflection guaranteed) — never in pitch attitude. The reared/
   upright S-pose is REJECTED; the S-flourish is sanctioned only as a bank TRANSIENT (stinger
   rudders INTO the turn, both wing pairs sweep aft toward the ≤0.58 fold).
3. **The venom is a VESSEL, not a glow.** The translucent gaster sac windows read as containers
   whose fill level rises up the ladder — luminosity is earned by VOLUME (`sacFill` 0.05→1.00),
   never by intensity cranking. The fill line IS the diegetic power meter.
4. **FOUR TRUE WINGS** (fore + hind pairs; doublet-fusion REJECTED, settled). The hind pair
   rides the new nullable `parts.auxWingPivots` rig hook at a 0.35 beat-phase offset / 0.9×
   amplitude — the four-wing shimmer is her motion identity. If the hook is descoped, the
   dragon is descoped.
5. **Gloss, never matte.** Oil-slick thin-film sheen band on the dorsal chitin (diffuse-only,
   ≤10% coverage — the anti-Vesper finish law). Never the full-body iridescence shader
   (Astral's).
6. **NEVER SEVERED (the waist floor).** `waistPinch` apex 0.34 with a hard floor of **0.22×
   thorax radius**; petiole length ≤0.10 body; the waist is painted MID-tier (never the darkest
   hex) and one dorsal strake runs continuously THROUGH the pinch. The concavity is the
   identity — the severed-body read is the veto.
7. **NEVER A MOSQUITO (the anti-SPINDLE locks).** Forewing chord ∈ **[0.24, 0.30]× wing
   length** (hind inherits via the 0.62 scale); thorax silhouette width ≥0.5× forewing chord;
   rear black-fill mass split **core (thorax+gaster+stinger+limbs) 25–40% / four blades
   50–65%**, asserted per form. Under 25% core = mosquito; over 40% = grub with fins. Both are
   vetoes. Nothing on her is a 2-tri blade — stinger, antennae, limbs, veins all carry loft/tent
   thickness.
8. **Elegant menace.** Stiletto = a slim blade; nothing bulbous-cute, nothing gore. Drips are
   beads, sacs are glass; a stiletto, not a tick.
9. **Build vehicle:** NEW `js/dragonStiletto.js`, faceted chitin-plate assembly. Forbidden
   imports: `dragonOrganism.js`, `dragonNightFury.js`, `dragonUnifiedHull.js` (asserted).

## §2 AD-LOCK DNA → design decisions (the locked ruling is ground truth)

Each locked ruling → the exact buildable feature, with the image corrections baked in. Per the
Revenant lesson, the AD's reconciliation of the four concept images outranks all v0 prose.

| Locked ruling (AD lock §) | Stiletto feature it becomes | Deliberately NOT taken |
|---|---|---|
| Dragon skeleton / wasp kit; dragon FORWARD, wasp AFT (§1) | the §4a three-mass torso gains a draconic PROW: 2–3-plate collared neck (0.08 body) + ONE raptorial forelimb pair tucked knee-up under the thorax; the aft half stays pure wasp (petiole → gaster → stinger) | a wasp scaled up; any hind legs (the gaster IS the hindquarter) |
| Horizontal posture lock, head below thorax crown, S in the dorsal spline (§1) | `spinePoints` encode the side line-of-action (thorax proud → waist dip → gaster swell → under-curl); rest-pose body axis pitched ≤8° off flight path (asserted); `stingerPresent 0.4` | the banking images' reared pose (rejected as a rest pose — its energy survives as the bank transient) |
| Draconic skull-mask head; antennae ARE the horn slot, horn-GAUGE (§2 head row, §4.5) | `stilettoMaskHead` (§4c): muzzle-wedge skull ~12–16 facets, brow ridge + mandible cheek-blades, NO separate horns; antennae base ≥0.12× head width, swept 30–40°, canted ±12°, taper ≤0.15× | the aerial pair's literal bug head + hair-thin feelers (failure-mode veto); horns + antennae together (crowds a 250px skull — the Durnehviir 4-horn lesson) |
| ONE pair of raptorial draconic forelimbs, zero hind legs (§2 limbs row, §4.5) | §4a forelimbs: lofted shoulder swell → forearm → 3-claw hand, folded knee-up, hugged to the thorax underside, ~120 tris, INSIDE the core rear-fill (they thicken the anti-SPINDLE core for free) | the aerial pair's SIX splayed thin insect legs (failure modes 2+7 and the loudest "bug" tell) |
| Exactly 3 LARGE discrete hex-cut sac windows, segs 2–4 (§2 gaster row) | §5: one hex-cut window per gaster seg 2–4, venter-centered wrapping both flanks — the hex survives as the WINDOW SHAPE; single-layer wall + opaque emissive fill behind | the aerial pair's hex-GRID glow field (the LED-strip failure at gaster scale; multiplies transparent panels) |
| Four TRUE wings, hind on the nullable aux-pivot, 0.35 phase (§4.1, SETTLED) | §4b + §7-Q(b): the `parts.auxWingPivots` hook — specced against the real rig this session (it does NOT yet exist in dragon.js; must-add, nullable, additive, roster byte-identical) | doublet-fused-as-one (REJECTED — fused pairs collapse to two fat blades = a bat; the rear four-spoke X requires independent rakes) |
| Stinger = 4–6-sided LOFT, base ≈0.5× gaster seg-4 radius (§4.4) | `stingerLanceTail` (§4d): 5-sided pyramidal loft, taper to 0.10× (sheet-sanctioned needle), 2 lancet barbs, inset channel seam | a flat 2-tri blade (failure mode 3 — the needle must survive edge-on) |
| Waist floor 0.22×, petiole ≤0.10, mid-tier paint, strake through (§4.3) | §1 law 6 + §4a petiole spec + asserts | daylight at the waist (the severed read) |
| Proportion spline: head .12 · neck .08 · thorax .30 · petiole .08 · gaster .42; stinger +0.35 (§6) | §4a station table verbatim; gaster seg radii ×[0.9, 1.0, 0.82, 0.58] of thorax radius | — |
| Anti-mosquito locks: chord [0.24,0.30], thorax ≥0.5× chord, mass split 25–40/50–65 (§4.6) | §1 law 7 + the §9 per-form rear-fill asserts (the SPINDLE is the named premium risk, §7-Q(a)) | — |
| Palette + glow closed list (§5, reaffirms sheet §9) | §5 verbatim: lacquer ramp, oil-slick grazing tints, UV-orchid family, glow ONLY in {3 sac fills, eyes, drip bead f2+, channel f3, pterostigma ×4 f3} | warm hues, green, gold; any lit field; intensity-cranked sacs |
| Surge doctrine: fill ×sgm + bead motes, wings stay DARK (§5) | §5c fever firewall: `feverWing 0x000000` kill-switch + full override table with real dragon.js line cites | magenta rig defaults; wings glowing on Surge |

## §3 Art direction + the rear-chase silhouette

**North star: BLACKLIGHT APOTHECARY — a stiletto that brews its own poison.** Lacquered
violet-black chitin with oil-slick sheen; three glass venom windows down the gaster filling with
luminous UV-orchid brew as she ascends; a needle stinger whose channel finally lights and DRIPS.
Solar is regalia, Vesper is withholding, Phoenix is warmth — **Stiletto is anticipation in a
bottle.** Anchor: violet-black `0x150b1d` (apex). Accent: UV-orchid `0xd936ff` (292°),
emissive, ≤9% surface at apex. Hero: **THE GOSSAMER DOUBLET** (four veined glass blade-wings).
Motif: **THE VENOM STILL** (the filling sacs). Growth verb: **BREWING.** One word: **POTENT.**

- **One-word rear read: WASP.** Black-fill (rear): four narrow blades reading as FOUR distinct
  spokes in a shallow X (fore pair high, hind pair 12° flatter + set one plate below → all four
  separate, never two merged), radiating from a solid armored thorax+gaster DART-CORE, the
  needle stinger hanging dead-center as a tapering exclamation point, the tucked forelimb pair
  thickening the core's chin.
- **Landmark punctuation (4):** (1) the central dart mass the four blades radiate from — NOT
  four floating filaments (thorax silhouette width ≥0.5× forewing chord, asserted); (2) the
  four-spoke X itself (the fore/hind rake split); (3) the needle stinger dead-center, under-curled
  toward the lens; (4) the horn-gauge swept antennae breaking the skull outline.
- **The anti-SPINDLE guards carry the read** (the named premium risk, judged FIRST on the 250px
  rear-chase crop at every gate): chord floor [0.24, 0.30]×length · thorax ≥0.5× chord · rear
  mass split core 25–40% / blades 50–65% · horn-gauge antennae · the limb pair inside the core.
  She must read as a DART with a dagger, never a mosquito, never a grub with fins.
- **Anti-collision (bake into every gate round):** vs VESPER (the closest roster neighbor —
  both near-black): hue family violet 270° vs blue 225°; finish wet-lacquer GLOSS vs matte
  "glints, never glows"; light doctrine always-lit filling VESSEL vs withheld Surge seam; four
  blades + concave waist vs one crescent + lateral spread. Calibration veto on the Vesper tile:
  *"is this a second Vesper?"* vs TEMPEST (nearest Fresh-Five wing family — both blade wings):
  four straight translucent veined spokes in an X + a center needle vs two kinked opaque
  angular-stepped bolts; magenta 292° vs near-white 255°/sat .09; a rising liquid VOLUME vs a
  rhythmic TIME garment. Veto: *"four spokes + needle, never two bolts."* vs SYLPH (hood
  crescent) / REVENANT (negative space) / TOCSIN (coin row): different shape families entirely
  (§2b synthesis ruling stands). Hue margins: 30° from Solar's 262°, 33° from Sylph's rose hem
  325° — the roster's only magenta-family emissive. The lock's dragon-forward head/neck/limbs
  INCREASE separation from the literal-insect lane (no new collision anywhere).

## §4 The part builders — `js/dragonStiletto.js` (faceted chitin-plate assembly, self-registering, nullable default-off dials)

**Shared kit (top of module):** `flatTriMesh` (mechaKit.js) · `stilettoMats(def, glow, stage)`
copying only the `vesperMats` STRUCTURE (dragonVesper.js:43–80 — stage-aware;
`userData.baseEmissive/baseIntensity` on every ticked mat). Tiers: `chitinDorsal` = `def.body`
(the lacquer-ramp hex, value ↓ up the ladder) / `venter 0x2f1a38` (dark plum) / `sheenViolet
0x4a2a68` + `sheenTeal 0x1e4a4e` (diffuse grazing-row tints, ≤10% coverage, roughness 0.35 band —
the "wet lacquer"; everything else roughness 0.7) / `memTiers[4]` (wing membrane, `0x2a1a38 →
0x6a5a88` root-ward, steps ≥0.05 L, translucent 0.70 single-layer) / `veinMat` + lighter
`veinCap` (opaque — the CP1 rim-catch recipe) / `sacWall` (translucent 0.72, single-layer, the
ONLY body transparency) / `fillLine 0xe86aff` + `fillBody 0x8a1eb0` (opaque emissive — the
liquid) / `bead 0xef8aff` / `channel` + `stigma` (emissive `0xd936ff` family, dark until f3;
seam mats DoubleSide per the culled-ignition gotcha, dragonVesper.js:77–78 + DRAGON-DESIGN §6.5)
/ `eyeShell` (emissive `0xd936ff`). Body law: metalness 0, **emissive 0x000000** on every
diffuse mat (the rig ticks `bodyMat.emissiveIntensity` 0.12→0.35 at dragon.js:1213 — black
emissive keeps the chitin lacquer-dark through it; venom lives on dedicated component meshes,
never on surfaces). All venom-family emissive mats go in **`materials.flareMats`, NEVER
`spineMats`** — spineMats take the global WARM cruise fresnel rim `0xfff0d8`
(dragon.js:234/1204), poison for a 292° family; flareMats join the Surge flare loop
(dragon.js:224, applied 1178–1198) but are never rim-lit. All builders batch per-material tri
accumulation → ≤3–4 `flatTriMesh` per group (the Pearl 253-draw lesson); apex draws ≤60.

### §4a `chitinWaspTorso` — the three-mass wasp aft + the draconic prow (rings dead by construction)

Publishes the full attach contract (`wingRoot(side)` fore AND `hindWingRoot(side)`, `headBase`,
`tailAnchor`, `halfWidthAt`, `bodyMidY`, `riderSocket`), `spinePoints` (the locked side
line-of-action: collar → thorax-crown rise → waist DIP → gaster swell → under-curl start; ≥1
inflection, rest body-axis pitch ≤8°), `motifAnchor` (gaster seg-2, fixed, never re-hues), and
`coreGlow: null` (the crash guard — deliberate: the venom still must NEVER breathe with
boost/Surge opacity; §3 law: volume, not intensity. The dragon.js:1159–1164 opacity hook goes
unused by design).

**Proportion spline (nose → gaster tip = 1.0, the lock §6 verbatim):** head 0.12 · neck 0.08 ·
thorax 0.30 · petiole 0.08 · gaster 0.42; the stinger needle adds ~0.35 body-length beyond.

- **THE THORAX (0.30):** an armored keel of 5 overlapping lacquer plates (shingle-style flat-tri
  facet cards with beveled rims — the Vesper `buildScapularCowl` overlap-not-weld trick,
  dragonVesper.js:540–562, run as a dorsal shingle row), shoulder cowls receiving BOTH wing-pair
  roots (fore high on the crown shoulder, hind 0.28 body aft + one plate-thickness below).
  Thorax silhouette width ≥0.5× forewing chord (the anti-SPINDLE anchor, asserted). The dorsal
  oil-slick sheen band rides the crown plates (`sheenViolet/Teal` on grazing-angle columns only,
  roughness 0.35, envIntensity 0.4).
- **THE NECK (0.08, NEW from the lock):** 2–3 overlapping chitin COLLAR plates arcing slightly
  forward-down into the level head carriage — same shingle-card construction as the thorax
  plates (the hero-echo rhyme the lock names), each lapping the next ≥0.02 (never coplanar).
- **THE RAPTORIAL FORELIMBS (NEW from the lock, ~120 tris the pair):** ONE pair, lofted — a
  shoulder swell → forearm → 3-claw hand via a 3-station mini-loft per segment (the sanctioned
  swell-then-taper bone profile; the `knapLoft` pattern, dragonVesper.js:106–131) + claw nubs
  as 2-face tents. Folded KNEE-UP and hugged to the thorax underside, STATIC in the body frame
  (no limb rig in v1 — tucked is the pose), fully inside the core rear-fill. Zero hind legs.
- **THE PETIOLE / WASP-WAIST (0.08):** a short bare constriction loft, radius `waistPinch`×
  thorax (0.50→0.34 ladder, hard floor 0.22×), painted MID-tier (never the darkest hex), with
  ONE dorsal strake (a thin tent strip) running continuously thorax→gaster THROUGH the pinch
  (law 6). Length ≤0.10 body (spline pins 0.08 ✓).
- **THE GASTER (0.42):** 2→4 telescoping armor-ring segments (swell-then-taper; seg radii
  ×[0.9, 1.0, 0.82, 0.58] of thorax radius), each segment lapping the next ≥0.02. Segments 2–4
  each carry ONE hex-cut sac WINDOW (§5) inset in the venter-flank wall. The gaster hangs
  low-center BEHIND the rider line (corridor law §5d).
- Value tiers: `chitinDorsal` on crown/dorsal columns, `venter` plum below, sheen tints on
  grazing rows; ≥0.05 luminance spread between tiers (CP4 endpoint law), judged on the
  brightest biome + the dark shop card.

### §4b `gossamerDoubletWings` — the HERO: four veined glass blade-wings (fore + hind true pairs)

Construction cites (reuse the PATTERNS, fresh geometry): `buildOneScallopWing`
(dragonVesper.js:365–534) · module-level profile-as-function `vesperArmY/Z` (346–356) ·
`ridge()` tents (400–409) · connected `edgeBand` (470–477) · the −anchor wrist fold + `lmirror`
outer mirror (616–640) · seam-mat DoubleSide (77–78).

- **(a) The blade profile — ONE module-level waypoint function** `stilettoBlade(t, len, chord)`
  shared by fore geometry, hind geometry (×0.62), tip markers, and tests (the detach-gotcha
  law): a long, narrow, high-aspect blade; leading costa a taut shallow arc; **chord ∈
  [0.24, 0.30]× wing length at every form** (the §F floor made law — hind inherits via scale).
  Forewing span 1.5→2.2× body up the ladder (apex ≤2.5 roster cap, huge margin).
- **(b) Venation — the finger law re-applied as VEINS:** an opaque raised skeleton per wing —
  the dominant leading vein (costa) as a bolder `ridge()` tent, + 4 branching veins fanning aft
  from a node at 0.38 span, `lenFrac [1, .78, .60, .44]` (dominant-plus-decay), each a `ridge()`
  tent with the lighter `veinCap` rim-catch (the CP1 recipe) — the fan reads sculpted at 250px.
  Veins enclose **5 membrane CELLS on the forewing / 3 on the hindwing**.
- **(c) Glass membrane:** single-layer translucent, opacity 0.70 (`model.wingOpacity 0.70` —
  the rig's state fade at dragon.js:1155–1157 then drops it −0.05 boost / −0.12 Surge: the apex
  wing goes gauzy under power, free drama). 4 value tiers `memTiers` stepping ≥0.05 L from
  smoke-violet `0x2a1a38` tip-ward to the lit root endpoint `0x6a5a88` (CP4); tiers are SHARED
  materials across all four wings (batching). `M.wingMat` = the root tier (the rig's
  single-material wing contract, dragon.js:1144–1157). Cells are inward-cupped ≥4-segment bays
  (sawtooth killer).
- **(d) Trailing edge:** the connected cell-hem polyline — ONE strip per wing along the whole
  trailing arc (the floating-debris gotcha; edgeBand pattern dragonVesper.js:470–477) — but
  **OPAQUE** bright-tier lacquer (the knife-edge read WITHOUT alpha; this is the overdraw
  budget's load-bearing choice, §5d). Never per-cell shards.
- **(e) Pterostigma:** the classic dark wing-spot at 0.82 span on the leading costa, one per
  wing ×4 — a 2-tri inset facet, diffuse dark until f3, then venom-lit (`stigma` mat, ≥8px at
  the 250px read, the only wing emissive ever).
- **(f) THE HIND PAIR (true wings, the lock §4.1 verbatim):** 0.62× forewing linear scale ·
  seated 0.28 body-lengths aft + one plate-thickness below · raked **12° flatter** · same
  blade/vein/cell construction (3 cells) · fore/hind planform overlap ≤20% (the
  rear-separation guard, asserted on the top silhouette) — worst-case 2 alpha layers only in
  that corridor.
- **(g) Motion — THE HUM (bespoke):** forewings ride `wingPivotL/R` on the **`wingParts 2`**
  cascade (pivot + tip; the tip joint at the 0.38-span vein node: `tip.position=K`,
  `hand.position=−K` — the −anchor law, rest pose byte-identical). Dial block: `flapBias 1.15,
  flapAmp 0.7, glidePow 1.4, rootAmp 0.7, tipAmp 0.12, tipLag 0.55, restLift 0.04` — a quick,
  shallow, stiff insect beat (the anti-Pearl; block unique vs Vesper glidePow 2.2 / Revenant
  0.85/1.6 / Tempest 0.8/1.9). Hindwings are RIGID single-segment blades on builder-internal
  `hindPivotL/R`, published as **`parts.auxWingPivots = [{ pivotL, pivotR, phase: 0.35·2π,
  ampScale: 0.9 }]`** — the poser drives them with the SAME glide-hold waveform at the offset
  (§7-Q(b) specs the hook; phase is RADIANS at the hook; "0.35" is the beat-cycle fraction,
  disambiguated here at consolidation). The 0.35-cycle offset + 0.9× amp is the four-wing
  shimmer no roster dragon has — and a free dead-symmetry killer.
- **(h) Fold:** both pairs sweep AFT along the gaster (the wasp rest posture) — measured span
  contracts to **≤0.58** of glide, the roster's deepest fold (a real silhouette transformation
  in banks; hind nests below fore, clearance 0.02 checked in the builder).
- **(i) Join + mirror:** all four roots buried under the thorax shoulder cowls (overlap, never
  weld). Canonical +X wings; LEFT side = ONE outer `lmirror scale.x=−1` wrapper per side
  parenting BOTH that side's pivots (fore + hind — the aurumToro convention, never a scale on
  a pivot itself; dragonVesper.js:616–640). Publishes `wingPivot/Tip L/R` + `hindPivotL/R` (via
  auxWingPivots) + tip markers for BOTH pairs duplicating `stilettoBlade()` (module-level — the
  trail-detach bug impossible) + `parts.wingElements`.
- **(j) Numbers:** apex fore span:body 2.2× · chord 0.27× length nominal · ~180 tris/forewing +
  ~110/hindwing → ~0.6k/quad at apex · membrane meshes 4 (one per wing, tier-grouped).

### §4c `stilettoMaskHead` — the draconic chitin skull-mask + horn-gauge antennae

A draconic MUZZLE-WEDGE skull (~12–16 big facets via a mini profile loft: occiput → brow ridge →
cheek → muzzle wedge; the `knapLoft` pattern + Vesper head recipe, dragonVesper.js:689), read as
a smooth chitin HELM-MASK — **no separate horns** (the lock: antennae ARE the horn slot).
- **Brow ridge + mandible cheek-blades:** 2 small cheek-blade facet tents (curve-vs-straight
  against the almond eye-shells) — the "draconic skull" read from the banking pair, built as the
  sheet's helm-mask.
- **HORN-GAUGE ANTENNAE (the lock §4.5 verbatim):** 1 pair, base thickness **≥0.12× head
  width** (asserted — thin feelers are a veto), swept back 30–40°, canted ±12° so they read
  from behind, 2-segment `ridge()` tents tapering to ≤0.15× base (taper law), `antennaeLen`
  ladder 0.4→1.0. They do the horn job in the rear-fill skull punctuation.
- **Eyes:** huge wraparound almond eye-shells with a faceted compound-cut bevel rim, octahedron
  cores (the Vesper eye pattern, dragonVesper.js:748–755), venom-lit `0xd936ff` — the brightest
  facial points; ladder 38% round-shell → 30% → 24% → **20% slant**;
  `eyeMat.emissiveIntensity = 0.7 + 1.7·glowLevel` (the Vesper intensity-ramp lesson — light
  grows as the eye narrows). Eye mats stay OUT of all surge arrays (Vesper law); the rig drives
  fever color via `feverEye` (dragon.js:1214).
- Publishes `headLength` + the head sits level, BELOW the thorax crown (§1 law 2).

### §4d `stingerLanceTail` — the STILETTO (thick needle loft + venom bead)

The gaster (§4a) carries the mass; the tail slot builds the needle. A **4–6-sided pyramidal
LOFT** (5-sided nominal; the knapLoft pattern with a 5-point profile — NEVER a flat 2-tri
blade): base radius **≈0.5× gaster seg-4 radius** (the lock's thickness law), tapering to 0.10×
base (the sharpest taper in the roster, sheet-sanctioned below the 10–20% default — it is
literally a needle); **2 short lancet BARBS** (×0.8 pair, 2-face tents) breaking the mid-length;
the inset venom CHANNEL seam running base→tip (recessed groove + a thin `channel` emissive
strip, DoubleSide, dark until f3). Terminal: **THE DRIP BEAD** — a small faceted octahedron at
the tip (`bead` mat, opaque emissive), driven by the deterministic swell-and-cull cycle (§5b)
from f2.
- **Motion:** the gaster+stinger ride the Vesper **isBone 3-joint nested chain** verbatim
  (dragonVesper.js:780–795: `jAnchor`/`chainAdd` −anchor compensation, `joints[0].isBone =
  true`, rotation-only — position writes tear the chain). `tailWhip: true, tailLagScale 0.10,
  tailUndulateX 0.22, tailRudderScale ~0.5, stingerPresent 0.4` — cruise = the slow menacing
  UNDER-CURL presenting the needle up-toward the chase lens (the locked line-of-action's last
  inflection); banks = the stinger swings INTO the turn (rudder with intent). A coiled spring,
  not a flame-whip. The bead + channel bin to the last chain joint (they whip with the tip).

## §5 THE VENOM STILL — motif plumbing, the drip tick, the fever firewall, the overdraw census

**§5a The three windows + the fill (the diegetic meter).** Fixed anchor: gaster seg-2 window
(`motifAnchor`, never moves, never re-hues). **Exactly 3 sac windows** — one per gaster segment
2/3/4, each cut as ONE large faceted HEX aperture (the hex is the window SHAPE, never a
grid/array texture), centered on the venter and wrapping up both flanks so it reads from
behind-and-above (the chase camera) and from either side (banks). Construction per window:
- **The WALL:** a single-layer translucent hex panel (`sacWall`, opacity 0.72), inset 0.01
  INSIDE the segment's armor rim (never coplanar). All 3 walls share one material and one
  static parent (the gaster) → merged into **ONE `flatTriMesh` = one transparent drawable**.
  Never stacked, no backface second layer.
- **The FILL:** an OPAQUE emissive flat-topped mesh inside each window, height = `sacFill` ×
  window height — **{0.05, 0.30, 0.60, 1.00} exact** up the BREWING ladder (baked per form;
  forms are accretive rebuilds, zero runtime cost). The top surface ring takes `fillLine
  0xe86aff` (the brightest pixels on the gaster at every rung) falling to `fillBody 0x8a1eb0`
  at depth — a real liquid from two facet tiers of gradient. All 3 fills merge into ONE opaque
  emissive drawable pair (fillLine + fillBody mats). f0's 0.05 dreg-glimmer at the sac floor
  hints the apex.
- Both fill mats sit in `flareMats` with `userData.baseEmissive/baseIntensity`: the Surge flare
  loop then delivers the lock's exact contract with ZERO new glow code — cruise = the
  else-branch resets to base each frame (dragon.js:1194–1198, the fill level just glows);
  Surge = `baseIntensity × (1 + (surgeMix·0.9 + ignite·1.6) · sgm · wi)` (dragon.js:1192 —
  the "fill emissive ×surgeGlowMultiplier" ruling, verbatim engine math).

**§5b The drip tick — the ONE guarded dragon.js addition (≤10 lines) + the Surge motes.**
Precedent: the jade pearl tick + the Revenant gap-pulse (dragon.js:1019/1165–1173 — guarded
per-dragon blocks writing `userData.baseIntensity` BEFORE the flare loop; empty/null for every
other dragon → roster byte-identical). Keyed on `parts.dripBead` (null otherwise): a
deterministic **2.2 s CPU cycle** (integrated phase, dragon.js:62 law — advance by dt, never
wall-clock): the bead scales 0→1 over ~1.8 s (the swell), `baseIntensity` brightens with it,
then CULLS (scale 0, restart). No falling particle in cruise — the swell IS the read.
`?dripPin=<t01>` pins the cycle for pixel-comparable gate captures (the `?wingDebug`
URLSearchParams pattern, dragon.js:22–28). Gated `dripStage ≥1` (f2+). **Surge ("Venom
Overdrive") motes:** the same tick, when `player.feverActive`, streams bead-clone sprites from
the tip — **default 1 mote** (pooled, ≤2) — see the census (§5d) for why the lock's "2" ships
as 1 + a perf-HUD-gated second (recorded engineering delta, flagged for AD/owner sign-off).

**§5c Full fever-palette override (every hostile default named with its dragon.js line).**
Defaults: `feverWing 0xff44cc` magenta (1147), `feverEye 0xff66ee` (1214), `surgeHi 0xfff8e8`
white-gold (1177) + the rim lerp (1206), warm cruise rim `0xfff0d8` on spineMats (234/1204).
The def block (Vesper format):

| hook | value | why |
|---|---|---|
| `feverWing` | `0x000000` | **the kill-switch (the lock §5): wings stay DARK on Surge** — the spectacle is the still, never the wings (Vesper cool-surge precedent) |
| `wingEmissive` / `wingMembraneEmissive` | `0x000000` | kills the cruise/boost membrane-glow target (dragon.js:1142–1147) — glass stays glass |
| `feverEye` | `0xe86aff` | eyes blaze fill-line orchid, never rig magenta; eye mats out of all surge arrays |
| `surgeHi` | `0xef8aff` | every flared venom mat lerps toward the drip-hi, never white-gold (1188 + rim 1206) |
| `feverWash` | `[0.07, 0.02, 0.10]` | blacklight wash (proposed; owner call #4) |
| `eye / apexEye` | `0xd936ff` | hue-lock ground truth |
| `apexSeam / coreGlow` (color fields) | `0xd936ff` | ditto |
| `trail / boostTrail` | `0x7a2494 / 0xb43ae8` | violet trail family |
| `fx.auraColor` | `'217,54,255'`, `auraIdle 0` | no idle halo — the still is the light |
| `hideRiderGlow` | `true` | the gaster owns the rear frame |
| surge arrays | venom family in **flareMats only** (never spineMats) | the warm-rim dodge (§4 kit law); `coreGlow: null` by design (§4a) |

**≤1 near-white discipline:** nothing on Stiletto is near-white; `fillLine 0xe86aff` (sat .56)
is the brightest mat — the discipline holds by construction. **Cruise-emissive closed list:**
{3 sac fills, eyes} until f2 adds {bead}, f3 adds {channel, stigma ×4}. Nothing else emits, ever
(inventory assert).

**§5d THE OVERDRAW CENSUS (counted, not vibes — the four-wing budget honestly reconciled).**
The house convention counts transparent MESHES and per-ray ALPHA LAYERS (fill cost = layers ×
area; draw calls are a separate ≤60 assert).
- **CRUISE apex = 6 ≤ 6:** 4 wing membranes (one single-layer mesh per wing) + 1 merged
  sac-wall mesh (all 3 windows, one mat, single-layer) + 1 trail. This is the ceiling with
  ZERO slack, and it is only reachable because (a) the trailing knife-edges are OPAQUE by
  design (§4b-d — the Tempest fallback made native), (b) the 3 sac walls merge to one drawable,
  (c) the fills are opaque (the liquid costs zero fill — the cleverest buildability story of
  the five, §F). v0's "≤8 inventory" is superseded by this stricter count.
- **SURGE = 8 ≤ 8:** the 6 + the fever aura sprite + **1 venom mote**. This is why the lock's
  "2 bead motes" ships as 1 with the 2nd gated behind perf-HUD proof (the Revenant wisp-count
  precedent; recorded delta, owner call #5).
- **Max alpha layers along any chase ray ≤2 ✓:** gaster ray = 1 sac wall (the fill behind it is
  opaque); wing ray = 1 membrane, or 2 ONLY in the fore/hind ≤20% overlap corridor (asserted);
  tail ray = trail alone; no ray crosses two sac walls (windows sit on different segments of a
  convex hull).
- **NAMED FALLBACK if the p95 HUD flags cruise:** the hind membranes drop to OPAQUE
  smoke-violet glass-tint (4 transparent cruise) — four TRUE wings survive untouched in
  geometry and motion (the SETTLED list is not violated; only hind alpha is spent).
- Nothing spins; the drip is a scale pulse; budgets: tri ladder **1.6 / 2.4 / 3.4 / 4.6k**
  (re-pinned honestly from v0's 1.5/2.2/3.2/4.4k: the lock's new anatomy costs ~200 apex tris —
  forelimbs ~120, neck collars ~50, stinger loft + barbs ~30; still the slimmest of the Fresh
  Five — a stiletto, not a warship); draws ≤60 apex.

## §6 The BREWING ladder (4 forms — the still fills, the waist tightens, the dart sharpens)

Form names: **f0 Glass Larva · f1 First Ferment · f2 Half-Brew · f3 Belladonna.**
Drama 25/45/70/100. Every rung adds a CATEGORY (anatomy + light + a silhouette move).

| dial | f0 Glass Larva | f1 First Ferment | f2 Half-Brew | f3 Belladonna | assert |
|---|---|---|---|---|---|
| read | round pup, empty sacs, 2 stub forewings | waist pinches, hindwings bud, fill line appears | 4 true wings, the drip begins | brimming still + lit channel + pterostigma | — |
| `sacFill` | 0.05 | 0.30 | 0.60 | 1.00 | **exact, monotonic ↑ (the BREWING assert)** |
| gaster segments / sac windows | 2 / 1 | 3 / 2 | 4 / 3 | 4 / 3 (deeper swell-taper) | segs {2,3,4,4}; windows {1,2,3,3} |
| `waistPinch` (waist:thorax) | 0.50 | 0.42 | 0.38 | 0.34 | **monotonic ↓ (unique), ≥0.22 floor every form** |
| `hindwingScale` | 0 | 0.45 | 0.62 | 0.62 (+stigma) | {0,.45,.62,.62}; auxWingPivots from f1 |
| forewing vein cells | 3 | 4 | 5 | 5 (+lit stigma) | ↑ |
| forewing chord (× length) | 0.28 | 0.27 | 0.26 | 0.26 | **∈[0.24,0.30] every form** |
| rear-fill mass split (core %) | 40 | 34 | 30 | 28 | **∈[25,40] every form; blades ∈[50,65]** |
| `dripStage` | 0 | 0 | 1 (bead) | 2 (bead + lit channel) | ↑ |
| `antennaeLen` | 0.4 | 0.6 | 0.8 | 1.0 | ↑; base ≥0.12× head width every form |
| neck collar plates / forelimbs | 2 / stubs | 2 / folded pair | 3 / full pair | 3 / full (claw nubs sharpen) | ↑ |
| span : body (forewing) | 1.5× | 1.8× | 2.0× | 2.2× | ↑, ±10%, ≤2.5 |
| fold contraction | ≤0.62 | ≤0.60 | ≤0.58 | ≤0.58 | apex ≤0.58 |
| eye : head | 38% | 30% | 24% | 20% | ↓ |
| body hex (value ↓) | `0x241430` | `0x1f1129` | `0x1a0e23` | `0x150b1d` | monotonic ↓; tier spread ≥0.05 L |
| tri target | ~1.6k | ~2.4k | ~3.4k | ~4.6k | monotonic ↑, ±20%, <6000 |

Growth-verb asserts: BREWING = `sacFill` ↑ exact + `waistPinch` ↓ (the waist TIGHTENS as she
matures — its own unique monotonic) + gasterSegs/windows ↑ + `dripStage` ↑ + span ↑ + body
value ↓ + eye:head ↓. Every rung is cruise-visible: the fill LINE is readable at every rung
(f0's dreg-glimmer → f3's brimming), and the silhouette moves (waist, hind pair, chord tighten)
read at 250px.

## §7 FEASIBILITY AUDIT (every element + motif + motion channel → cited path → overdraw → biggest risk → mitigation)

| # | element | engine construction path (cited) | overdraw | biggest risk | mitigation |
|---|---|---|---|---|---|
| T1 | `chitinWaspTorso` thorax/petiole/gaster | shingle plate cards (Vesper cowl overlap trick, dragonVesper.js:540–562) + knapLoft-pattern waist/gaster stations (106–131) | 0 | the waist reading SEVERED at 250px | floor 0.22× + petiole ≤0.10 + mid-tier paint + the through-strake (law 6), all asserted |
| T2 | neck collar (NEW, lock) | same shingle-card pattern, 2–3 plates, ≥0.02 lap | 0 | reading as a segmented bug prothorax | plates rhyme with thorax shingles; arc carries the head BELOW the crown (posture assert) |
| T3 | raptorial forelimbs (NEW, lock) | 3-station mini-lofts per segment (knapLoft pattern) + tent claws | 0 | stick-limb read (failure modes 2+7) | lofted swell-then-taper, knee-up tuck inside the core fill; ~120 tris; static |
| T4 | oil-slick sheen | diffuse 2-tone grazing-row tints ≤10% (Vesper glassStreak "glints, never glows" precedent) | 0 | drifting into Astral's full-body iridescence | diffuse-only, banded, coverage-asserted |
| W1 | `stilettoBlade` profile + chord floor | `vesperArmY/Z` profile-as-function (346–356) | 0 | **HEADLINE (a): the SPINDLE** — see Q(a) | chord ∈[0.24,0.30] + thorax ≥0.5× chord + mass split, all machine-checked per form |
| W2 | vein skeleton + cells | `ridge()` tents + caps (400–409) + bay fans ≥4 seg (443–463 pattern) | 0 | veins reading as a flat print | tent lift + `veinCap` rim-catch (CP1); cells cupped |
| W3 | 4 glass membranes | single-layer 0.70, 4 shared tier mats; `M.wingMat` contract (dragon.js:1144–1157) | 4 meshes (the budget's biggest line) | census ceiling | opaque hems + merged sac walls buy the slack (§5d); named hind-opaque fallback |
| W4 | hind pair + THE HUM | **NEW `parts.auxWingPivots` hook — see Q(b)** (precedents: wingBladePivots walker dragon.js:62–63/207–208/862–871; wingPivot2 secondary pair 56–57/198/881–889) | 0 | the hook (rig surgery) | nullable/additive, ≤12 guarded lines inside the wingParts branch; roster byte-identity proven at I0; owner pre-approved scope (synthesis call #2) |
| W5 | fore/hind separation | seat 0.28 aft + 1 plate below + 12° flatter | ≤2 layers in the ≤20% corridor | two merged blades = a bat from astern | overlap ≤20% asserted on top planform; four-spoke X judged at every gate |
| W6 | fold ≤0.58 aft-sweep | wingParts fold pose + contraction assert | 0 | hind poking through folded fore | nest clearance 0.02 in the builder; flapstrip 5-phase + fold pin |
| H1 | `stilettoMaskHead` skull-mask | mini profile loft (Vesper head, 689) + tent cheek-blades | 0 | bug-head relapse | no mandible-face by construction; brow + muzzle wedge; Vesper-tile veto |
| H2 | horn-gauge antennae | 2-seg `ridge()` tents | 0 | thin-feeler veto / crowding the 250px skull | base ≥0.12× head width asserted; they ARE the horn slot (no horns to crowd) |
| H3 | eye shells | octahedra (748–755) + bevel-rim facets | 0 | out-glowing the sacs | intensity rides glowLevel; sacs stay the brightest gaster pixels (fillLine assert) |
| S1 | `stingerLanceTail` needle loft | knapLoft 5-point profile, isBone 3-joint chain (780–795) | 0 | paper-blade read edge-on | 4–6-sided loft law + base 0.5× seg-4 radius, both asserted |
| S2 | drip bead + Surge motes | guarded drip tick (jade/Revenant tick precedents, dragon.js:1019/1165–1173) + `?dripPin` | motes Surge-only (1) | census 8/8 at Surge | mote default 1, 2nd behind perf HUD (recorded delta) |
| M1 | VENOM STILL fills | opaque emissive fill meshes + flareMats base/reset loop (1178–1198) | **0 — the liquid costs zero fill** | intensity creep masking the volume read | fills baked per form; no coreGlow breathing (null by design); Surge scales via sgm only |
| M2 | sac walls ×3 | merged single-layer hex panels, inset 0.01 | 1 mesh | hex-GRID relapse; stacked walls | exactly-3-windows assert + single-mesh construction; walls never coplanar with armor |
| M3 | fever firewall | full §5c table, every default cited (1147/1177/1206/1214/234) | — | one missed hook = magenta/white-gold leak | §9 simulates fever values; `feverWing 0x000000` asserted verbatim |
| M4 | corridor | ±10° forward corridor (Molten scan pattern) | — | stinger tip / hind tips crossing the lens | corridor empty at all 5 flap phases + full fold + `pin` states; gaster hangs BELOW the rider line |

**Q(a) — do four narrow wings + a needle avoid the SPINDLE/mosquito read at 250px rear-chase?
YES — because the guards are construction + independent machine checks, not taste.** The chord
floor ([0.24, 0.30]× length) makes each blade a BLADE — §F's catch that the old thorax≥0.5×chord
RATIO could collapse both terms together is closed by bounding chord below. The thorax width
≥0.5× chord lock then binds to a real blade. The rear-fill mass split (core 25–40% / blades
50–65%, measured per form on the `rearfit` black-fill via silhouetteCore) is the direct
anti-mosquito assert — under 25% core is a VETO, and the lock's new anatomy actively feeds the
core: the tucked forelimb pair and the collar plates add core-fill mass with zero silhouette
noise. The horn-gauge antennae (≥0.12× head width) keep the last thin elements above the
aliasing floor. And every gate round judges the 250px rear-chase crop FIRST — if she reads
mosquito there, nothing else is graded. She stays a dart with a dagger.

**Q(b) — is the `auxWingPivots` four-wing rig buildable at 60fps, and what is the hook's real
status? MUST-ADD (confirmed absent) — and cheaply, with two shipped precedents proving the
pattern.** Grepped this session: `auxWingPivots` appears NOWHERE in `js/dragon.js` — v0 §11 was
right that it is the one real rig extension. Two engine truths make it low-risk:
1. **The rig already runs a secondary wing pair** — `wingPivot2L/R` (dragon.js:56–57, picked up
   at 198, posed at 881–889: the Obsidian T4 shadow-flap + Night-Fury stabilizers). It proves a
   second pair through the poser is shipped practice — but it is UNUSABLE for the hum: it beats
   IN-PHASE at a fixed 0.6× on the direct-pivot `rootFlap` sinusoid (line 681), z-axis-only,
   damp-followed — no phase offset (kills the 0.35 shimmer), and a DIFFERENT waveform from the
   wingParts glide-hold shape the forewings ride (the pairs would visibly disagree). It stays
   untouched.
2. **The rig already ticks builder-published nullable pivot arrays** — the `wingBladePivotsL/R`
   lag walker (declared 62–63, picked up 207–208, walked 862–871): the exact
   guarded-null-array pattern the hook copies.
**The spec (≤12 guarded lines, additive):** (i) pick up `auxWingPivots =
result.parts.auxWingPivots || null` beside wingBladePivots (207–208) and reset it with the
other pivots (~439); (ii) at the END of the `wingParts` branch (747–800), after
`poseWing(L/R)`, a guarded loop reusing the branch's own locals so the hind pair rides the SAME
`shape()` glide-hold waveform: for each entry, `f = shape(phase − a.phase) · rootA ·
(a.ampScale ?? 1)`, then write pivotR/pivotL `rotation.z = −(f·amp) + restLift + baseZ +
rollFold` (mirror sign via the lmirror wrapper, NOT a per-side sign — one flip only, the mirror
corollary) and share the existing feather/climb `rotation.x` term. Banking reuses `poseWing`'s
inside/outside `amp`/`baseZ` values — the hind pair banks with the fore pair, offset in beat
only. (iii) `phase` is radians (Stiletto publishes 0.35·2π ≈ 2.20); entries carry
`{pivotL, pivotR, phase, ampScale}`. **Null for every shipped dragon → zero writes → roster
byte-identical**, proven at I0 by the tricount FORM-row multiset compare + `wingsymprobe`
Δ0.000 re-run on two shipped wingParts dragons. Cost: 2 rigid hind blades = 2 rotation writes
per frame — nothing at 60fps on weak mobile. The hook lands at I0 WITH its no-op proof, before
any Stiletto geometry depends on it (and per synthesis owner-call #2, its scope is flagged for
approval on the I0 PR).

## §8 BUILD INCREMENT PLAN (coexist → hero → ladder; one fresh harsh Fable gate per increment; COLOUR from the first geometry)

- **I0 — stub + THE AUX-PIVOT HOOK + calibration.** Roster key `stiletto` (fully additive;
  roster byte-identity proven by the tricount FORM-row multiset compare — the naive diff lies);
  `js/dragonStiletto.js` skeleton with 4 registered contract-satisfying placeholders
  (`coreGlow:null`; `horn`/`scales` def hexes; SSSR invariants). **LAND `parts.auxWingPivots`
  in dragon.js per §7-Q(b)** + the null-hook no-op tests + `wingsymprobe` re-baseline on 2
  shipped dragons + `?dripPin` scaffolding — rig surgery lands FIRST, tiny and proven, flagged
  on the PR for the owner (synthesis call #2). Gate calibration on **Vesper** (*"is this a
  second Vesper?"*) + **Jade** (premium-restraint bar) + the Tempest concept tile (*"four
  spokes + needle, never two bolts"*), with the anti-SPINDLE veto locked into the rubric.
- **I1 — `chitinWaspTorso` + THE VENOM STILL.** Thorax shingles + collar neck + forelimbs +
  petiole + gaster + the 3 hex windows + fills at `sacFill` + sheen band. FIRST COLOUR GATE
  (never silhouette-only — the Revenant lesson): the fill LINE reads as a liquid surface on the
  game-lit tile + the dark shop card; the waist reads coupled, not severed; the forelimbs read
  draconic, not insect; judged at 250px rear-chase FIRST.
- **I2 — `gossamerDoubletWings`, FORE pair (the hero's dominant half).** Blade + costa + vein
  fan + cells + opaque hem + pterostigma (dark) + wingParts 2 motion + fold. Gate: chord floor
  green; the 250px rear crop with TWO wings must already read dart-not-mosquito (mass split
  measured); wingsymprobe Δ0.000.
- **I3 — THE HIND PAIR + THE HUM.** Hind blades on `auxWingPivots` (0.35·2π, 0.9×), seat/rake/
  below offsets, overlap ≤20%, fold nesting, tip markers both pairs. Gate: the FOUR-SPOKE X at
  250px (all four separate, never two); the hum reads as a shimmer, not a stutter (preview
  residual); wingsym Δ0.000 across BOTH pairs; the anti-SPINDLE mass split re-measured with all
  four blades.
- **I4 — `stilettoMaskHead` + `stingerLanceTail` + the light plumbing.** Skull-mask + antennae
  + eyes; needle loft + barbs + channel + bead + the drip tick + the FULL §5c fever firewall +
  Surge motes. Gate: the skull reads DRAGON at 250px (antennae punctuation); the needle
  survives edge-on; drip determinism pinned; the fever-state proof through the real flare-loop
  math (no magenta, no white-gold, wings dark).
- **I5 — the BREWING ladder + `tests/starters.mjs`.** `forms[]` accretive ×4 + the §9 block +
  tri ladder + the full capture set (all forms; states glide/fold/bank/surge/**drip** (pinned);
  angles rear-chase/side/rear-¾/top; 3 backdrops — DARK-SHOP is the fill-line judge, bright
  biome is the lacquer-tier judge). Gate: full-ladder verdict; then the PR preview carries
  §10's residuals.

Each gate is a FRESH high-effort Fable spawn judging real captures against THIS contract; FAIL →
numbered directives applied verbatim; the builder never judges its own output. The AD lock +
the owner's screenshots outrank this sheet — deviations rebuild to the picture and log the
delta. THE RULE: a new lesson file per increment that changes the creature.

## §9 `tests/starters.mjs` SPEC — the `stiletto` 4-form block (mirrors the Solar/Molten premium blocks; Molten donates the corridor scan)

Headless via `buildDragonModel` + `ascendedDef(def, t)`, t = 0..3; silhouette asserts import
`renderSilhouette` (+ the hole/area metrics) from `../tools/silhouetteCore.mjs`.
- **Contract:** `maxTierFor('stiletto') === 3`; forms accretive length 4; contract fields
  untouched; NaN-vertex guard.
- **TRIS:** monotonic ↑, ±20% of {1.6k, 2.4k, 3.4k, 4.6k}, all <6000.
- **PROFILE SHARED:** tip markers (both pairs) + `wingElements` equal `stilettoBlade()`
  evaluations — one module-level function, no duplicated formula.
- **BREWING:** `sacFill` {0.05, 0.30, 0.60, 1.00} **exact** · `waistPinch` {0.50, 0.42, 0.38,
  0.34} monotonic ↓ AND ≥0.22 every form · gaster segs {2,3,4,4} · sac windows {1,2,3,3},
  exactly 3 at apex, each a single hex panel (vertex-count check) · `dripStage` {0,0,1,2} ·
  `hindwingScale` {0,.45,.62,.62} · `antennaeLen` {.4,.6,.8,1.0} · span:body
  {1.5,1.8,2.0,2.2}±10% ↑, ≤2.5 · eye:head ↓ {38,30,24,20}%±3 · body value monotonic ↓, tier
  spread ≥0.05 L.
- **ANTI-SPINDLE (the Q(a) locks):** forewing chord ∈[0.24,0.30]× length every form (hind via
  0.62±0.03 scale) · thorax silhouette width ≥0.5× forewing chord · rear-fill mass split on the
  `rearfit` black-fill: core ∈[25,40]% / blades ∈[50,65]% per form.
- **POSTURE (the lock):** rest body-axis (nose→gaster-tip through `spinePoints`) pitch ≤8° off
  the flight axis · head-top BELOW thorax-crown Y · side line-of-action ≥1 inflection ·
  `stingerPresent` under-curl present (tip above the chain's low point).
- **DRAGON-NOT-BUG:** exactly 1 forelimb pair, 0 hind limbs (part census) · antennae base
  ≥0.12× head width, taper ≤0.15×, exactly 1 pair, 0 horn parts · neck collar plates ∈{2,3} ·
  petiole length ≤0.10 body · waist strake present through the pinch (mesh continuity across
  the petiole z-band).
- **STINGER:** loft cross-section ≥4 sides · base radius ∈[0.4,0.6]× gaster seg-4 radius ·
  taper 0.10×±0.03 (sheet-sanctioned, named in-test) · 2 barbs · tail publishes 3 isBone-rooted
  joints.
- **WINGS / RIG:** fore/hind planform overlap ≤20% (top silhouette boolean) · fold contraction
  ≤{0.62,0.60,0.58,0.58} · `parts.auxWingPivots` null at f0, length 1 with `phase≈0.35·2π` /
  `ampScale 0.9` at f1+ · **wingsym Δ0.000 across BOTH pairs** (`tools/wingsymprobe.mjs`, aux
  pivots included via both pairs' tip markers) · vein `lenFrac` non-equal dominant-decay ·
  membrane single-layer (no stacked backfaces) · motif anchor drift ≤0.15 · hook no-op proof:
  a shipped wingParts dragon's pose stream is byte-identical with the hook code present.
- **LIGHT / OVERDRAW:** transparent-mesh census cruise ≤6 exact-list {4 membranes, merged
  sacWall, trail} · sac walls ONE mesh · fills opaque · cruise-emissive closed list {fills,
  eyes} (+bead f2+, +channel/stigma f3) — inventory assert · accent hues ±20° of 292°, zero
  warm/green/gold · `feverWing === 0x000000` verbatim · fever sim: all fever emissives in the
  292°±20 family, wings dark, `surgeHi 0xef8aff` · drip determinism: same seed/dt stream →
  identical 2.2 s cycle over 10k ticks; `?dripPin` idempotent.
- **CORRIDOR (Molten pattern):** glide-pose ±10° forward corridor contains NO wing/stinger/
  antenna vertices at any form, all 5 flap phases + full fold.
- **FIREWALL IMPORTS:** `dragonStiletto.js` contains no
  `dragonOrganism|dragonNightFury|dragonUnifiedHull|growSkinnedExtension|sweepProfileSmooth`
  (import statements, not prose).

## §10 Verification harness + gate-blind residuals

Per DRAGON-DESIGN §8/§9, per increment and in full at I5:
1. Suites green: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` (FULL roster) ·
   `node tests/starters.mjs` · `node tools/creaturestress.mjs --ci` (≤60 draws).
2. Studio: `node tools/dragonstudio.mjs stiletto` — all 4 forms; states glide/fold/bank/surge +
   **drip (pinned)**; fixed angles (rear chase / side / rear-¾ / top planform); three backdrops —
   DARK-SHOP judges the fill line, bright biome judges the lacquer tiers, warm-gold stresses
   the cool venom family.
3. Black fills: `tools/silhouette.mjs stiletto rear|rearfit|side|top [form]` (+ `--wings-only`)
   — the four-spoke count, the waist concavity, and the mass-split numbers ride every gate
   round.
4. Motion: `tools/flapstrip.mjs` 5-phase corridor (±10° empty at ALL phases + folded);
   `tools/wingsymprobe.mjs` Δ0.000 both pairs; the named-pivot amplitude table (fore vs hind
   offset visible in the phase column).
5. In-game: `tools/gameshots.mjs` (`?cleanshot&dripPin=…`) — chase idle, mid-bank, tier-up.

**Named gate-blind residuals (the human judges on the PR preview — the gate cannot):**
- **The HUM rate:** 0.35-cycle offset at 0.9× amp — shimmer vs stutter at speed; lever: phase
  0.30–0.40 band, never touch the amp first (owner call #5, held from v0).
- **Drip timing feel:** the 2.2 s swell — anticipation vs metronome; lever: cycle 2.0–2.6 s.
- **Tone:** venom drip + needle — elegant menace vs creepy (owner call #3); the beads-not-gore
  law is the sheet's answer, the ruling is the owner's.
- **Dark-shop legibility:** fill line + eye shells + sheen rims carry the card (CP4 L2) —
  confirm on the real shop bg.
- **The waist at speed:** does the pinch read as identity or anomaly in motion at 250px?
  Lever: waistPinch apex 0.34→0.36 inside the band; never below the 0.22 floor logic.
- **Surge mote count (1 vs the lock's 2):** the recorded census delta — perf-HUD proof unlocks
  the 2nd (owner call #5b).
- **Gloss sheen band under the brightest biome:** wet-lacquer vs plastic; lever: envIntensity
  0.4→0.3, coverage stays ≤10%.

## SETTLED (v1 — do not re-litigate; the AD lock reaffirmed all of these)
- **UV-orchid 292° `0xd936ff`, never chartreuse, never green of any kind** (the Vesper
  80°-eye collision).
- **Four TRUE wings** — doublet-fusion REJECTED; the hind pair rides the nullable
  `auxWingPivots` hook; if the hook is descoped the dragon is descoped.
- **Sacs = single-layer translucent WALL + opaque emissive FILL mesh** — never a glowing
  volume, never stacked walls, never a hex-grid of panels; **exactly 3 discrete hex-cut
  windows**.
- **Gloss oil-slick dorsal band** — diffuse-only, ≤10%, the anti-Vesper finish.
- **The drip is a swell-and-cull bead** — no falling particles in cruise.
- **NEW (the lock, 2026-07-14): the dragon-skeleton/wasp-kit law · the horizontal-flight law
  (±8°) · one raptorial forelimb pair, zero hind legs · the draconic skull-mask with horn-gauge
  antennae (no separate horns) · waist floor 0.22× · the stinger loft thickness law · the
  proportion spline (§4a).**

## Open owner calls (flag on the build PR)
1. **Name** — "Belladonna Stiletto" (recommended); alternates Duskneedle · Vitriol Sylphid.
2. **Cost/slot** — 2400 proposed.
3. **Tone check** — venom drip + needle: elegant-menace vs creepy, on the preview.
4. **Surge name** — "Venom Overdrive" vs "Full Bloom"; wash `[0.07,0.02,0.10]` proposed.
5. **Hindwing hum** — (a) the 0.35 phase feel rides the preview; (b) Surge motes 1 vs 2 (the
   census delta, §5d — perf-HUD proof unlocks the 2nd).
6. **The aux-pivot hook scope** — approve on the I0 PR (nullable/additive, byte-identity
   proven; synthesis shared-call #2).

## CHANGELOG
- **v0 (Fable design-director synthesis, 2026-07-13).** Fresh wasp-wyrm concept: POTENT /
  GOSSAMER DOUBLET / VENOM STILL / BREWING; UV-orchid 292°. §R Opus rear-chase pass (REVISE →
  dart-not-bug locks) + §F Fable round-2 (PASS 4.4; chord floor + mass split added). All in the
  appendix.
- **v1 — CONSOLIDATED BUILD-READY (2026-07-14, this contract).** Implements the ART-DIRECTION
  LOCK (`BELLADONNA-ARTDIRECTION-LOCK.md`): dragon-skeleton/wasp-kit (draconic skull-mask +
  collared neck + one raptorial forelimb pair, zero hind legs), horizontal-flight lock, exactly
  3 hex windows, stinger loft law, waist floor 0.22×, the proportion spline, horn-gauge
  antennae. Engine-audited against real code this session: `auxWingPivots` confirmed ABSENT
  from dragon.js and specced as a ≤12-line nullable addition (Q(b), with the wingPivot2 +
  wingBladePivots precedents); venom family routed to flareMats (the spineMats warm-rim trap);
  `coreGlow: null` by design (volume-not-intensity); census reconciled to 6/6 cruise + 8/8
  Surge (opaque hems, merged sac walls, mote default 1 — the one recorded delta from the
  lock's "2 motes", flagged); tris re-pinned {1.6, 2.4, 3.4, 4.6}k for the lock's new anatomy.
  v0 §0–§12 + §R + §F demoted to the appendix.

---

## APPENDIX — design history (superseded; DO NOT build from here)

Everything below is the frozen pre-consolidation stratigraphy: the original v0 concept
(§0–§12), the Opus §R rear-chase revision, and the Fable §F round-2 pass — kept verbatim
because their research, critic verdicts, and rulings are real history, but **every load-bearing
number now lives in the v1 contract above**, which wins wherever the two disagree. The
2026-07-14 ART-DIRECTION LOCK (`BELLADONNA-ARTDIRECTION-LOCK.md`) reconciled this material
with the four concept images; the contract above implements that lock. Section numbers below
are internal to this appendix.

### [ARCHIVED v0 SHEET BEGINS — superseded by the v1 contract above]

The builder's contract for a bespoke, low-poly, premium **insectoid venom wyrm** — the poison/toxic
lane (Naganadel's luminous-venom wasp-abdomen anatomy, mined for authenticity, copied from nothing).
One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`).

> **⚠️ HUE DIRECTIVE — the toxin is UV-ORCHID, not chartreuse.** The mandate's default "toxic
> chartreuse" sits ~75–90°, inside ±20–25° of Vesper's acid-green eyes (80°) — a bloom collision on the
> roster's own terms. This sheet moves the venom to **UV-orchid `0xd936ff` (~292°)**: blacklight toxin,
> authentically Naganadel (its adhesive venom glows pink-violet), 30° clear of Solar's 262° violet, and
> it hands the roster its first magenta-family dragon. Do not drift it green.

> **⚠️ NOT a second Vesper.** Both are near-black; three hard separators by construction: (1) hue
> family — **violet-black chitin (~270°)** vs Vesper's blue-black (~225°); (2) finish — **wet-lacquer
> OIL-SLICK GLOSS** (thin-film sheen streaks) vs Vesper's matte "glints, never glows"; (3) light —
> the venom sacs are **always lit in cruise** (a filling vessel) vs Vesper's withheld Surge circuit.

**Prior art — the concept is PROVEN in shipped games (owner requirement):** the poison/venom dragon —
and specifically the INSECTOID venom-wyrm — is an established archetype. **Pokémon** — *Naganadel*
(Poison/Dragon, an Ultra Beast with a swollen wasp-abdomen full of luminescent adhesive venom fired from
a stinger — the direct silhouette+motif precedent) and *Dragalge* (Poison/Dragon, the toxic sea-dragon).
The venomous serpent-dragon also runs through Norse *Níðhöggr* and countless RPG "poison wyrms."
Belladonna Stiletto claims this validated lane with a fresh HUE (UV-orchid, not the genre-default green)
and a fresh SPECTACLE (the diegetic venom fill-meter), copied from none.

**Read first:** `DRAGON-DESIGN.md` · `VESPER-NIGHTGLASS-BUILDSHEET.md` (house format + faceted
assembly + cowl-overlap join) · `PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b · the CP1 fingered-wing
lesson (dominant-plus-decay applies to VEINS here) · the CP4 value-endpoint lesson (a dark chitin
dragon must spread its tiers ≥0.05 luminance) · the silhouette-economics lesson (a dark dragon spends
tris on OUTLINE — this dragon's outline budget is the waist, the four wings, and the stinger).

## 0. Identity contract
Fresh roster key (working `stiletto`) — fully additive. `name:'Belladonna Stiletto'` ·
`title:'Venom, patiently brewed'` · `rarity:'SSR'` / `maxRarity:'SSSR'` · `cost: 2400` ·
`stats { speed 1.14, handling 1.18, drain 0.90, regen 1.08 }` (the roster's dart — fast and twitchy,
thirstier and slower to refill: a striker, not a cruiser) · `fx.auraColor '217,54,255'` ·
`forms[]` accretive, length 4 · `maxTierFor === 3` · `hasStyle` · `accentHue: 0xd936ff`.

**Frozen identity laws:**
- **The venom is a VESSEL, not a glow.** The translucent gaster sacs read as containers whose fill
  level rises up the ladder — luminosity is earned by VOLUME, never by intensity cranking.
- **Insect, not bat.** Four wings (fore + hind pairs), venation cells, pterostigma, pinched waist,
  telescoping gaster — the only insectoid construction in the roster.
- **Gloss, never matte.** Oil-slick thin-film sheen on the dorsal chitin (the anti-Vesper finish law).
- **Elegant menace.** Stiletto = a slim blade; nothing bulbous-cute, nothing gore. Drips are beads.
- **Build vehicle:** NEW `js/dragonStiletto.js`, faceted chitin-plate assembly. Forbidden imports:
  the organism/smooth-hull family.

## 1. Art direction (north star)
**BLACKLIGHT APOTHECARY — a stiletto that brews its own poison.** Lacquered violet-black chitin with
oil-slick sheen; translucent amber-glass venom sacs down the gaster, filling with luminous UV-orchid
brew as she ascends; a needle stinger with a lit venom channel that finally DRIPS. Solar is regalia,
Vesper is withholding, Phoenix is warmth — **Stiletto is anticipation in a bottle**: the fill line IS
the power meter. Anchor: violet-black `0x150b1d` (apex). Accent: UV-orchid `0xd936ff`, emissive, lives
only in the sacs/channel/eyes/pterostigma (≤9% surface). Hero: **THE GOSSAMER DOUBLET** (two pairs of
veined glass-blade wings). Motif: **THE VENOM STILL** (the filling sacs). Growth verb: **BREWING.**
One word: **POTENT.**

## 2. Silhouette language
Primitive: **a pinched-waist cruciform** — armored thorax, a wasp-waist constriction (the roster's only
concave body break), a swelling four-segment gaster closing in a needle stinger; two wing pairs make an
X in top planform. Line of action: thorax proud, waist dips, gaster arcs DOWN-then-UP to present the
stinger at the chase lens (the scorpion-adjacent-but-wasp curl; ≥1 inflection guaranteed).

**The signature outline — THE WAIST + THE NEEDLE.** In rear black-fill: the four narrow wings read as
a shallow X; the gaster + stinger hang dead-center as a tapering exclamation point. Side black-fill:
the waist pinch (waist radius ≤ 0.35× thorax radius — asserted) is instantly nameable: *"the wasp
dragon."* No other roster silhouette has a concave mid-body.

**Distinctiveness gate:**

| Axis | Vesper | Solar | Jade | Phoenix | **Stiletto** |
|---|---|---|---|---|---|
| Region | lateral spread | top-heavy crown | serpentine | bottom-heavy feather train | **pinched-waist cruciform + rear needle** |
| Tone lane | matte blue-black | indigo + gold | vivid green | warm gold | **GLOSS violet-black oil-slick** |
| Wing | single scallop crescent | vault-bays + lances | silk fin lobes | feather ranks | **FOUR gossamer veined blades (2 pairs)** |
| Motif | withheld inset seam | ring + gem | chin pearl + rim | coal arc | **translucent sacs that FILL (always-on)** |
| Glow hue | ion 223° + green eyes | violet 262° | mint 149° | warm triad | **UV-orchid 292°** |
| Growth verb | knapping | coronation | — | rebirth | **brewing** |

**Retired by this sheet:** silhouette lane **insectoid / pinched waist / four wings** · construction
lane **translucent-vessel motif** · emissive lane **magenta-family** · verb **brewing**.

## 3. Motif — THE VENOM STILL (filling sacs; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor: the gaster flank + venter sac windows** (segments 2–4) — translucent chitin panels over
an interior VENOM VOLUME rendered as opaque emissive fill geometry (a flat-topped emissive mesh inside
each sac whose height = fill fraction; the sac WALL is the only translucent layer — single-layer 0.72,
never stacked). The fill SURFACE line is vertex-lit brightest (`0xe86aff`), the depth falls to
`0x8a1eb0` — a real liquid read from two tris of gradient.

- **Hue lock: UV-orchid `0xd936ff`** (~292°, sat 0.86). Fill-line hi `0xe86aff`; deep brew `0x8a1eb0`;
  drip bead `0xef8aff`. **Anti-collision:** 30° from Solar's 262°, 33° from Aurora Sylph's rose hem
  (325°, hem-only), a hue family no shipped dragon owns.
- **4-step bloom (`sacFill`, the BREWING ladder):** **f0** — empty glass: sacs present but dark
  (fill 0.05, a dreg-glimmer at the sac floor — the hatchling hints the apex). **f1** — fill 0.30,
  the fill line appears. **f2** — fill 0.60 + the first DRIP: a bead swells at the stinger tip on a
  2.2 s CPU cycle (deterministic, headless-testable), brightens, and is culled (no falling particle
  in cruise — the swell IS the read). **f3** — fill 1.0 brimming + the stinger CHANNEL seam lights
  (venom in transit) + the pterostigma (wing-spot) ignites on all four wings — the only wing emissive,
  ≥8px, one per wing.
- **Rear-chase carrier:** the gaster + stinger ARE the chase-frame centerpiece (the tail slot) — the
  best-placed motif in the roster; the sacs also read in every bank. §1 primacy satisfied by anatomy.
- **Anti-tacky:** no additive shells; the sac wall is the only transparency; drip is geometry; Surge
  ("Venom Overdrive") multiplies the fill emissive ×surgeGlowMultiplier and streams 2 bead motes —
  wings stay dark (`feverWing 0x000000`-equivalent override, the Vesper cool-surge pattern).

## 4. Torso — `chitinWaspTorso` (three-mass insect assembly; rings dead by construction)
Not a loft — a **plate ASSEMBLY**: (1) the THORAX: an armored keel of 5 overlapping lacquer plates
(shingle-style, each a big flat-tri facet card with a beveled rim), shoulder cowls receiving both wing
pairs; (2) the WAIST (petiole): a short bare constriction, radius ≤0.35× thorax — the silhouette key;
(3) the GASTER: 2→4 telescoping segments (swell-then-taper: seg radii ×[0.9, 1.0, 0.82, 0.58]), each
segment an armor ring with the flank/venter sac WINDOWS inset (the §3 anchor). Dorsal oil-slick sheen:
a thin-film streak band (roughness 0.35, envIntensity 0.4, + a subtle 2-tone iridescent vertex tint
violet→teal on grazing rows — DIFFUSE, ≤10% of surface, the "wet lacquer" read; never the
`iridescence` full-body shader, which is Astral's). Everything else roughness 0.7. Publishes attach
contract + `spinePoints` + `motifAnchor` (gaster seg-2) + `coreGlow: null`.

## 5. Wings — the HERO: THE GOSSAMER DOUBLET (two pairs, veined glass blades)
**FOREWING** (dominant): a long, narrow, high-aspect blade — span 2.2× body at apex, chord ≤0.30×
its own length (the anti-bat read); **HINDWING**: the echo pair, 0.62× forewing linear scale, seated
0.28 body-lengths aft + one plate-thickness below, raked 12° flatter.
- **Venation = the finger law re-applied:** each wing carries an opaque raised VEIN skeleton — a
  dominant leading vein (costa) + 4 branching veins fanning aft from a node at 0.38 span (`lenFrac
  [1, .78, .60, .44]`), enclosing 5 membrane CELLS on the forewing / 3 on the hindwing. Veins are
  tent-ridge geometry with a lighter rim-catch cap (the CP1 recipe); cells are inward-cupped ≥4-segment
  bays (sawtooth killer). Trailing edge: the connected cell-hem polyline — ONE strip, never per-cell
  shards (the floating-debris gotcha).
- **Glass membrane:** single-layer translucent, opacity 0.70, cool smoke-violet `0x2a1a38` diffuse
  with 4 value tiers stepping ≥0.05 luminance toward the lit endpoint `0x6a5a88` at the root (CP4
  endpoint law). **Overlap discipline:** hindwing offset is tuned so fore/hind planform overlap ≤20%
  — worst-case 2 alpha layers, the law's ceiling, only in that corridor (assert).
- **Pterostigma:** the classic dark wing-spot at 0.82 span on the leading edge — a free anatomical
  detail anchor; diffuse dark until f3, then venom-lit (§3).
- **Motion (bespoke — the HUM):** forewings ride `wingPivotL/R` on the wingParts cascade; hindwings
  ride builder-internal `hindPivotL/R` driven at a **0.35 phase offset** with 0.9× amplitude — the
  four-wing shimmer no roster dragon has (and a free dead-symmetry killer). `flapBias 1.15,
  flapAmp 0.7, glidePow 1.4` — a quick shallow insect beat, the anti-Pearl. **Fold:** both pairs
  sweep AFT along the gaster (the wasp rest posture) — measured span contracts to **≤0.58** of glide,
  the roster's deepest fold (a real silhouette transformation in banks).
- **Join:** wing roots buried under the thorax shoulder cowls (overlap, never weld).
- Canonical +X wings, outer-wrapper `scale.x=-1` mirror; publishes `wingPivot/Mid/TipL/R` (fore) +
  `hindPivotL/R` + tip markers duplicating each pair's profile formula.

## 6. Head — `stilettoMaskHead`
A smooth chitin HELM-MASK wedge (~12 facets): no horns; two swept ANTENNAE (taper law, tip ≤0.15×
base; 1 pair, length grows 0.4→1.0 up the ladder, canted ±12° so they read from behind); huge
wraparound almond eye-shells with a faceted compound-cut bevel rim, venom-lit `0xd936ff` (the
brightest facial points), ladder 38% round-shell → 30% → 24% → **20% slant**. Mandible hint: two
small cheek-blade facets (curve-vs-straight against the round eye-shells).

## 7. Tail — `stingerLanceTail`
The gaster (torso §4) carries the mass; the tail slot builds the **STILETTO**: a long smooth lance
needle (taper to 0.10× base — the sharpest taper in the roster, sheet-sanctioned below the 10–20%
default band: it is literally a needle), 2 short lancet barbs at the base (×0.8 pair), and the inset
venom CHANNEL seam (lit f3). The gaster+stinger ride an isBone 3-joint nested chain (−anchor
compensation, rotation-only): cruise = a slow menacing under-curl; banks = the stinger PRESENTS
toward the turn (rudder with intent); `tailWhip, tailLagScale 0.10, tailUndulateX 0.22,
stingerPresent 0.4` — a coiled-spring signature, not a flame-whip copy.

## 8. The BREWING ladder (4 forms — the still fills)
Form names: **f0 Glass Larva · f1 First Ferment · f2 Half-Brew · f3 Belladonna.**
Drama 25 / 45 / 70 / 100. Every rung adds a CATEGORY (anatomy + light + a silhouette move).

| dial | f0 Glass Larva | f1 First Ferment | f2 Half-Brew | f3 Belladonna |
|---|---|---|---|---|
| read | round pup, empty sacs, 2 stub wings | waist pinches, hindwings bud, fill line | 4 true wings, drip begins | brimming still + lit channel + pterostigma |
| `sacFill` | 0.05 | 0.30 | 0.60 | 1.00 |
| gaster segments | 2 | 3 | 4 | 4 (deeper swell-taper) |
| `waistPinch` (waist:thorax) | 0.50 | 0.42 | 0.38 | 0.34 |
| `hindwingScale` | 0 | 0.45 | 0.62 | 0.62 (+pterostigma) |
| forewing vein cells | 3 | 4 | 5 | 5 (+lit stigma) |
| `dripStage` | 0 | 0 | 1 (bead) | 2 (bead + lit channel) |
| antennae length | 0.4 | 0.6 | 0.8 | 1.0 |
| span : body (forewing) | 1.5× | 1.8× | 2.0× | 2.2× |
| eye : head | 38% | 30% | 24% | 20% |
| body hex (value ↓) | `0x241430` | `0x1f1129` | `0x1a0e23` | `0x150b1d` |
| tri target | ~1.5k | ~2.2k | ~3.2k | ~4.4k |

Asserts: tris ↑ · `sacFill`/gasterSegs/`hindwingScale`/`dripStage`/span ↑ · `waistPinch` ↓ (its own
unique monotonic — the waist TIGHTENS as she matures) · body value ↓ · eye:head ↓.

## 9. Palette (lacquer + one blacklight accent)
- **Anchor (violet-black chitin, ~270°, L 0.08–0.13):** ramp `0x241430 → 0x1f1129 → 0x1a0e23 →
  0x150b1d`. Belly/venter plates dark plum `0x2f1a38`. Oil-slick sheen tints (diffuse, grazing rows
  only): violet `0x4a2a68` / teal glint `0x1e4a4e` (≤10% coverage).
- **Accent (emissive): UV-orchid `0xd936ff`** — sacs, fill line `0xe86aff`, deep brew `0x8a1eb0`,
  drip `0xef8aff`, channel, pterostigma (f3), eyes. ≤9% surface at apex.
- Trail `0x7a2494` → boost `0xb43ae8` → `surgeHi 0xef8aff`. **Zero warm hues, zero green, zero gold.**
- **Dark-shop legibility (silhouette-economics law):** the fill line + eye shells + oil-slick rims are
  the shop-card read; verify on the brightest biome AND the shop card before judging tiers (CP4 L2).

## 10. Perf / overdraw (pre-solved)
1. **Transparent inventory at apex ≤8 drawables:** 4 wing membranes (single-layer) + 3 sac wall
   panels (single-layer) + trail. Fore/hind overlap corridor ≤20% planform (≤2 layers, assert).
   Sac INTERIORS are opaque emissive — the liquid costs zero fill.
2. **±10° forward corridor:** narrow blades sweep outboard/aft; the gaster hangs low-center BEHIND
   the rider line — verify stinger tip clearance at all 5 flap phases + full fold.
3. **Nothing spins; drip is a scale pulse,** not a particle in cruise (2 motes Surge-only).
4. **Budgets:** tri ladder 1.5/2.2/3.2/4.4k (slimmest of the Fresh Five — a stiletto, not a warship);
   draws ≤60 apex (merged plate fields, one mat per group).

## 11. Engine plumbing (fresh names; nullable, default-off)
New module `js/dragonStiletto.js`: self-registering `chitinWaspTorso` · `gossamerDoubletWings` ·
`stilettoMaskHead` · `stingerLanceTail`. New nullable dials: `sacFill, dripStage, gasterSegs,
waistPinch, hindwingScale, hindPhase, venCells, stigmaLit, antennaeLen, stingerPresent, sheenBand,
glowLevel, igniteStage`. **ENGINE NEED (the one real rig extension):** the poser must tick
builder-published EXTRA pivot arrays (`parts.auxWingPivots = [{pivotL, pivotR, phase, ampScale}]`)
so the hindwings ride the same flap solve at an offset — a nullable, additive hook on the wingParts
path (no shipped dragon publishes it → roster byte-identical). Forbidden imports: organism family.

## 12. QA / gate process
- **Calibrate** on Vesper (must NOT read as its sibling — the gloss/hue/always-lit separators) and on
  Jade (the other "one bloom, restrained" creature — Stiletto must read PREMIUM against it).
- **Standing items:** waist-pinch band assert (≤0.35 apex) · fore/hind overlap ≤20% (top silhouette
  boolean) · fold ≤0.58 · stinger taper sanction (0.10, sheet-authority note in the test) ·
  sac-wall single-layer (no stacked back-faces) · accent ±20° of 292° · cruise-emissive inventory =
  {sacs, eyes} only until f3 adds {channel, stigma} · no-organism-import firewall · tricount <6000.
- **`tests/starters.mjs` 4-form SPEC:** span bands {1.5,1.8,2.0,2.2}±10% · `sacFill` monotonic
  {0.05,0.30,0.60,1.00} exact (the BREWING assert) · `waistPinch` monotonic DECREASING (its unique
  assert) · gaster segs {2,3,4,4} · hindwing existence from f1 + `parts.auxWingPivots` present ·
  drip-cycle determinism (seeded) · motif anchor drift ≤0.15 · tri bands ±20%.
- Rides the PR preview (gate-blind): the four-wing shimmer rate, the drip timing feel, dark-shop
  legibility, stinger menace vs cuteness tone.

## Benchmark vs the roster's best
Solar is regalia, Phoenix is fire, Vesper is a blade of dark glass. **Stiletto wins on STORYTELLING
DENSITY** — the only dragon whose power level is literally VISIBLE as a liquid volume (the fill line
is a diegetic progress bar), the only four-winged silhouette, the deepest fold in the roster, and the
freshest hue lane (first magenta-family). Where it must match them: the four-wing glass must hit ≥4
readable membrane tiers and the apex drip moment must be as screenshot-worthy as Solar's ignition.

## §R — HARSH REAR-CHASE GATE REVISION (Opus critic pass, 2026-07-13)
**Verdict on the v0 sheet: REVISE.** Real risk: four narrow high-aspect blades (chord ≤0.30× length) +
a thin needle can read SPINDLY from behind — a fragile mosquito, not a badass dragon — and the hind pair
can merge behind the fore pair from dead astern (a busy blob). Score at v0: silhouette distinctiveness 4
/ interest 4 / nameability 4; buildability 4 (aux-pivot is a real but scoped rig extension); appeal 4
(freshest hue lane). REVISE to lock the rear read to a DART, not a bug.

### R1. Sharpened §2 rear-chase silhouette
- **One word:** **WASP** (or NEEDLE).
- **Black-fill (rear):** four narrow blades reading as FOUR distinct spokes in a shallow X (fore pair
  high, hind pair 12° flatter + set below → all four separate, never two merged), radiating from a
  solid armored THORAX+GASTER core, with the needle stinger hanging dead-center as a tapering
  exclamation point.
- **3+ centerline / landmark punctuation:** (1) the central thorax+gaster mass (the dart body that
  anchors the blades — NOT four floating filaments); (2) the four-spoke X (fore/hind rake split); (3)
  the needle stinger dead-center; (4) the swept antennae breaking the head outline.
- **Distinct from the other four because __:** it is the only FOUR-WING + central-needle read — a dart /
  shuriken, unmistakable from Tempest's stripe-stack, Tocsin's coin-row, Sylph's hood, Revenant's void.

### R2. Mandated fixes
1. **Anchor the four blades to a solid core.** The rear black-fill must show a clear central
   thorax+gaster MASS the four blades radiate from; assert the thorax silhouette width ≥ 0.5× the
   forewing chord so it never reads as disconnected filaments (the anti-mosquito lock).
2. **Four distinct spokes, never two.** Hind pair raked 12° flatter + seated 0.28 body-lengths aft and
   one plate-thickness below → in the rear fill, all four blades separate. Assert fore/hind planform
   overlap ≤20% (already in §5) doubles as the rear-separation guard.
3. **Elegant menace, not fragile.** Blades are BLADES (taut leading costa, raised veins) — the read is
   an assassin's stiletto, not an insect's wing.

### R3. Buildability audit (every hero element + motif → cited path)
| element | engine construction path (reference impl) | overdraw |
|---|---|---|
| `chitinWaspTorso` (thorax/waist/gaster) | shingle plate assembly (`shingleRow`/Obsidian-Sovereign shingle cards) + loft waist/gaster stations | opaque, 0 |
| GOSSAMER DOUBLET (4 wings, hero) | `bladeWing`/membrane blades + raised tent-ridge veins (CP1 finger recipe); single-layer 0.70 | 4 membranes; fore/hind overlap ≤20% (≤2 layers) |
| aux hind pair | **NEW `parts.auxWingPivots` nullable rig hook — the ONE real engine extension** (poser ticks published extra pivots at a phase offset; roster byte-identical without it) | none |
| VENOM STILL motif (filling sacs) | translucent sac wall (single-layer 0.72) over an inner OPAQUE emissive fill mesh, height = `sacFill` | 1 transparent layer/sac (≤3) |
| `stingerLanceTail` | isBone chain needle, taper 0.10× (sanctioned) | opaque, 0 |
| oil-slick sheen | diffuse 2-tone grazing-row tint (≤10%), NOT the full-body iridescence shader | opaque |
**Total transparent ≤8** (4 membranes + 3 sac walls + trail). The aux-pivot hook is the only novel
plumbing and it is nullable/additive — flag it for owner approval before slot 3 branches (already in §11).

### R4. SSSR appeal / art-direction
**Why a stranger screenshots and grinds:** the roster's first magenta dragon — blacklight UV-orchid
venom visibly FILLING the glass sacs (a diegetic power meter) behind an oil-slick violet-black dart, the
four-wing shimmer no other dragon has. **Lead: ELEGANT MENACE** (a patient assassin). Anti-gross guard:
drips are beads, sacs are glass, nothing bulbous or gore — a stiletto, not a tick.

## §F — FABLE GATE (round-2, 2026-07-13)
**Verdict: PASS (round-2) — with two bounds tightened.** Scores: rear-silhouette 4 · buildability 4.5
(aux-pivot hook is real but scoped + flagged; all other paths cited and verified in code) · SSSR appeal 4
· sweep clean → avg 4.4, no axis ≤2, no veto. One word: **WASP** (holds). The §R direction was right;
its anti-mosquito lock leaks:

1. **R2.1's thorax ≥0.5× forewing-chord lock is a RATIO with no floor — both terms can collapse
   together.** Chord is only bounded ABOVE (≤0.30× length); a builder at chord 0.18 passes R2.1 with a
   0.09-wide thorax and ships the exact spindly mosquito R2 exists to kill. Add the floor: **forewing
   chord ∈ [0.24, 0.30]× wing length** (hindwing inherits via the 0.62 scale). Now the 0.5× lock binds
   to a real blade, and "blades are BLADES" has a number.
2. **The dart-not-bug read gets the §2.3 mass-hierarchy assert, applied to the REAR fill:** central
   core (thorax+gaster+stinger) 25–40% of the rear black-fill area, four blades 50–65% — the standard
   rear-chase band, now asserted per-form from the rear silhouette. If the core drops under 25% it's a
   mosquito; over 40% it's a grub with fins. Both are vetoes.

Confirmed against fresh eyes: the four-spoke X + center needle is the set's most nameable rear fill
after Revenant; UV-orchid 292° is the freshest hue in the roster; the sac = translucent wall + opaque
emissive fill mesh is the single cleverest buildability story of the five (the liquid costs zero fill).
