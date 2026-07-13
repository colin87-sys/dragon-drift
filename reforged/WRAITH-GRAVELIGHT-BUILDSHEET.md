# GRAVELIGHT REVENANT — "Nothing stays buried" · Premium Build Sheet (fresh bone-wraith dragon)

The builder's contract for a bespoke, low-poly, premium **skeletal ghost-dragon (dracolich)** — the
bone/wraith lane (Dragapult's hollow-spectral stealth read + classic dracolich witchfire, mined for
authenticity, copied from none). One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`).

> **⚠️ THE STRUCTURAL BET — negative space is the identity.** Every roster dragon is a filled
> silhouette; the Revenant is the first whose black-fill contains DESIGNED HOLES (through-gaps in the
> ribcage, wing bays, and tail vertebrae) with a ghost-fire core burning visibly THROUGH the frame.
> Law §2.1 requires one connected outline component — holes INSIDE a connected outline satisfy it;
> this sheet asserts both (connectivity AND monotonic hole growth).

> **⚠️ NOT Pearl, NOT Phoenix, NOT Vesper.** Bone-ivory is light like Pearl: the separators are MATTE
> CHALK vs Pearl's satin pearl+gold, skeletal cage vs armored paladin, grave-green fire vs white-gold
> holy light. Tattered wings echo no one: Phoenix's train is lush feathers; Vesper's crescent is a
> whole membrane. The wing-law's ">0.35 scallop = tattered fail" is a MEMBRANE-integrity default;
> this sheet SANCTIONS designed through-gaps (crescent cutouts, not rips) with its own band — the
> PRECEDENCE RULE carries it, and beauty is held by clean swept edges.

**Prior art — the concept is PROVEN in shipped games (owner requirement):** the undead / skeletal /
dracolich dragon is one of the most battle-tested archetypes in gaming. **Skyrim** — *Durnehviir* (the
undead dragon of the Soul Cairn) and the grounded *Skeletal Dragon.* **Guild Wars 2** — *Zhaitan,* the
Elder Dragon of Death, a mass of undead dragon-flesh. **Pokémon** — *Dragapult* (Dragon/Ghost, a
spectral stealth-frame). The *dracolich* itself is a canonical D&D creature reproduced across Neverwinter,
Baldur's Gate, and many CRPGs (TV Tropes catalogs a full "Dracolich / Video Games" list). Gravelight
Revenant claims this validated lane with a fresh CONSTRUCTION (a true negative-space hollow cage) and a
BLEACHING value-invert, copied from none.

**Read first:** `DRAGON-DESIGN.md` · `VESPER-NIGHTGLASS-BUILDSHEET.md` (house format; the assembly-
not-loft construction lesson) · `PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b · the CP1 fingered-wing
lesson (the bone-finger fan IS its skeleton, literally) · the silhouette-economics lesson (this
dragon is 100% outline-spend by design — the gate's dream student).

---

## 0. Identity contract
Fresh roster key (working `revenant`) — fully additive. `name:'Gravelight Revenant'` ·
`title:'Nothing stays buried'` · `rarity:'SSR'` / `maxRarity:'SSSR'` · `cost: 2400` ·
`stats { speed 1.09, handling 1.12, drain 0.78, regen 1.24 }` (the tireless dead — near-Solar
economy, modest pace: it simply does not stop) · `fx.auraColor '84,240,78'` · `forms[]` accretive,
length 4 · `maxTierFor === 3` · `hasStyle` · `accentHue: 0x54f04e`.

**Frozen identity laws:**
- **Light through bone.** The ghost-fire core is only ever seen THROUGH apertures (rib windows, eye
  sockets, vertebra gaps). Never paint witchfire ON the bone surface — the bone stays matte chalk;
  the fire is interior. *"The Revenant is a lantern, not a lamp."*
- **BLEACHING, not darkening.** Body value RISES up the ladder (grave-soiled → bleached ivory) —
  the mirror of Vesper's unique darkening ramp; the two inverts bracket the roster.
- **Elegant undeath.** Clean bone architecture, crescent cutouts, no gore, no flesh scraps, no red.
- **Zero warm hues, zero gold, zero white-gold** (the Pearl firewall).
- **Build vehicle:** NEW `js/dragonRevenant.js`, bone-lattice ASSEMBLY (parts, not a skinned hull).
  Forbidden imports: the organism/smooth-hull family.

## 1. Art direction (north star)
**GRAVELIGHT — a dragon that kept flying after.** An articulated ivory bone-frame — vertebra beam,
rib hoops, bone-finger wings under wind-torn shroud panels — hollow where a dragon should be solid,
and lit from within by a grave-green ghost-fire heart that brightens as the bones bleach clean.
Solar wears its light as regalia; Vesper sheathes it; **the Revenant CONTAINS it** — the fire is
caged, and every ascension opens the cage wider. Anchor: aged bone `0xcfc9b8` (apex). Accent:
gravefire green `0x54f04e` (~118°), emissive, interior-only. Hero: **THE PHALANX SHROUD** (bone-
finger wings with through-gaps). Motif: **THE GRAVE HEART** (the caged core). Growth verb:
**HOLLOWING.** One word: **HAUNTED.**

## 2. Silhouette language
Primitive: **a latticed hollow** — a lean horizontal bone-frame whose mid-body is a visibly OPEN
cage; long naked-vertebra tail; wings that are mostly sky held together by fingers. Line of action:
a hunting stoop — neck arcs down-forward (skull leads low), spine rises over the pelvis, tail
counter-lifts (2 inflections, enforced in the rest pose).

**The signature outline — THE OPEN CAGE.** In side black-fill: the ribcage reads as alternating
bone/void bars with the core a bright interruption; in rear black-fill: the wing bays are through-
holes framed by finger bones. Nameable at a glance: *"the skeleton dragon."* Hole-area fraction of
the side-view body silhouette: 0 / 0.08 / 0.16 / 0.26 up the ladder (asserted, monotonic — the
HOLLOWING verb made measurable).

**Distinctiveness gate:**

| Axis | Pearl | Phoenix | Vesper | Ember | **Revenant** |
|---|---|---|---|---|---|
| Region | forward halo-knight | bottom-heavy train | lateral spread | anvil shoulders | **latticed hollow (pierced mid-body)** |
| Tone lane | holy white + gold, satin | warm gold/crimson | matte blue-black | bold flame orange | **matte chalk ivory + umber shadow** |
| Wing | up-raised feather-scale | feather ranks | full scallop crescent | ember membrane | **bone-finger fan, shroud remnants, THROUGH-GAPS** |
| Motif | crown-halo | coal arc | withheld inset seam | forge collar | **caged interior core (seen through apertures)** |
| Glow hue | white-gold | warm triad | ion 223° | lava 27° | **gravefire green 118°** |
| Growth verb | — | rebirth | knapping | — | **hollowing (holes grow) + bleaching (value ↑)** |

**Retired by this sheet:** construction lane **exposed-skeleton / negative-space body** · emissive
lane **grave-green interior fire** · verb **hollowing** · value lane **bleaching (upward ramp)**.

## 3. Motif — THE GRAVE HEART (the caged core; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor: the ribcage center** (sternum interior, never moves, never re-hues). The core is an
OPAQUE emissive faceted teardrop mesh (~60 tris) suspended inside the cage — a lantern-flame read
from big flat facets, brightest at its heart `0x9af08a`-capped (sat-held, never near-white), falling
to `0x2e8a3a` at its base. Always lit in cruise (a ghost does not switch off) at a LOW floor;
boost breathes it; **Dragon Surge = "the Haunting"**: the core blazes, the sockets vent, and 2–3
witchfire wisp cards stream between the last tail vertebrae (Surge-only additive, counted).

- **Hue lock: gravefire `0x54f04e`** (~118°). Margins: 38° from Vesper's acid eyes (80°), 31° from
  jade-mint (149°) — and on an IVORY body vs their black/green bodies, the palette-lane cell is
  clean. Socket pinpoints `0x76f068`; vent wisps `0x46c854`.
- **4-step bloom (HOLLOWING — the cage opens):** **f0** — the cage is SEALED: a grave-soiled whelp
  with a hairline glow crack down the sternum (the hint). **f1** — the first 2 rib windows open per
  side; the core is a dim coal behind bars. **f2** — 4 windows per side + the spinal gaps begin to
  leak light dorsally (the rear-chase carrier arrives); the core is a visible flame. **f3** — 6
  windows, the full open lattice; eye-socket vents light; the last 3 tail vertebrae separate into
  lit gaps; the core roars (glowLevel 1.0).
- **Rear-chase carrier (§1):** the chase camera sees the DORSAL spine-gap leak (light between
  vertebral plates) + the lit tail-vertebra gaps + the wing-bay holes flashing core-light during
  flaps — the interior fire reads from behind without ever painting the surface.
- **Anti-tacky:** the core is one opaque emissive mesh; sockets/gaps are geometry apertures; no
  additive shells in cruise; wisps are Surge-only and ≤3.

## 4. Torso — `ossuaryTorso` (bone-lattice assembly; rings + seams dead by construction)
An ASSEMBLY, not a loft: (1) the **vertebra beam** — 9 dorsal vertebrae, each a faceted knuckle
(swell at the body, taper at the disc — the sanctioned "bone profile": swell-then-taper per element,
law-4 satisfied at the chain level); (2) **rib hoops** — up to 6 curved bone staves per side
(elliptical arcs, stave width tapering tip-ward ×0.85 per rank toward the pelvis — law-5 decay),
enclosing the core with real THROUGH-gaps; f0's cage is sealed by a dark umber cartilage panel
(`0x4a4238`) that the ladder progressively removes; (3) the **sternum keel** + **pelvic blade** +
**scapular plates** that cowl both wing roots (overlap-not-weld). Bone material: matte chalk —
roughness 0.9, metalness 0, envIntensity 0.12; value tiers: sun-bleached dorsal ridge `0xdcd6c6` →
flank bone `0xcfc9b8` → shadowed underside + joint sockets umber `0x4a4238` (painted AND sculpted
— the socket recesses are geometry). Publishes attach contract + `spinePoints` + `motifAnchor`
(cage center) + `coreGlow: null` (the crash guard; the core itself is builder-owned).

## 5. Wings — the HERO: THE PHALANX SHROUD (bone-finger fan + designed through-gaps)
The CP1 fingered-bat recipe with the skin taken away — the fingers ARE the hero:
- **The arm:** humerus → radius (two faceted bone tubes with joint-knuckle swells, a real elbow
  angle change ≥20° — never one straight spar) → the carpal knuckle at `wristT 0.24` → **4 metacarpal
  fingers** radiating with the dominant-plus-decay law (`lenFrac [1, .80, .62, .46]`), each a
  tapering faceted bone (tip 0.15× base) with a small claw nub. A thumb-spur at the knuckle.
- **The SHROUD:** membrane REMNANT panels hung ONLY across the outer two bays (finger 0–1 and 1–2);
  the inner bays are OPEN SKY (the through-gap identity). Each panel's trailing edge is cut by 2
  clean swept CRESCENT cutouts (depths ×0.8, the deeper aft — designed wind-tatter, never noise),
  sampled ≥4 segments (sawtooth killer). **Sanctioned gap band: through-gap area 0.30–0.42 of the
  full-fan planform** (over the 0.35 membrane default, carried by sheet authority — the identity IS
  wind-through-bones). Panels: matte ash `0x35322c` with 3 value tiers stepping ≥0.05 L toward a
  lit hem `0x6a665c`; hem = ONE connected single-layer translucent band (0.68) along the whole
  trailing polyline (the floating-debris gotcha).
- **Camber + rim:** panels cup inward (cup 0.30); finger bones carry a lighter rim-catch cap; the
  bays pool rim light — the wing reads sculpted at 250px even though half of it is void.
- **Motion (bespoke — the SNAP):** `wingParts 3` cascade with a raptor-strike envelope: fast
  downstroke, slow rattling recovery (`flapBias 0.9, downFrac 0.38, flapAmp 0.85, glidePow 1.6`) +
  per-finger micro-lag (0.05·rank) — a dry, skeletal follow-through no roster dragon shares.
  **Fold:** the fingers close like a broken umbrella — measured span ≤0.60 of glide; the through-
  gaps VANISH when folded (the silhouette transformation: solid when tucked, pierced when spread).
- **Numbers:** apex span:body **2.4×** · single-wing SOLID area:body side-area 0.55–0.7 (the void
  is the point — the outline envelope is what reads big) · sweep 22° · dihedral 12°.
- Join hidden under the scapular plates; canonical +X wing, outer-wrapper mirror; publishes
  `wingPivot/Mid/TipL/R` + tip marker + `parts.wingElements` (the 4 fingers + arm).

## 6. Head — `revenantSkullHead`
A true draconic SKULL (~16 facets): bare crest ridge, nasal aperture notch, a 6-tooth upper row
(lengths ×0.85 falloff, taper law), and 2 back-swept antler-TINES (not horns — thin, elegant,
tapering; the only roster head with tines). **HOLLOW SOCKETS:** deep recessed dark orbits with a
small bright gravefire pinpoint each (`0x76f068`) — the brightest facial read by CONTRAST (a
pinpoint in a dark socket out-reads a big lit eye); socket diameter ladder 34% → 28% → 22% → 18% of
skull length while the pinpoint intensity RISES (the cute→fierce dial inverted through undeath: the
whelp's big dim sockets read waif, the apex's narrow blazing slits read wraith).

## 7. Tail — `vertebraeWhipTail`
A naked vertebra chain (isBone 4-joint nested chain, −anchor compensation, rotation-only): 8→12
vertebra knuckles, gaps between the last 3 opening + lighting at f3 (§3), terminus a flat bone
SPADE plate (pitched +15° toward the chase lens — the cant law). Motion: a dry pendulum sway with
skeletal micro-clicks — `tailWhip, tailLagScale 0.18, tailUndulateX 0.20, clickStep 0.08` (the
sway quantizes very slightly at joint extremes — a bone-on-bone read, bespoke).

## 8. The HOLLOWING ladder (4 forms — the cage opens, the bone bleaches)
Form names: **f0 Grave Whelp · f1 First Waking · f2 Open Cage · f3 Gravelight Revenant.**
Drama 25 / 45 / 70 / 100. Every rung adds a CATEGORY (aperture + light + a silhouette move).

| dial | f0 Grave Whelp | f1 First Waking | f2 Open Cage | f3 Gravelight Revenant |
|---|---|---|---|---|
| read | soil-dark sealed pup, sternum crack | first rib windows, coal behind bars | half-open cage, dorsal leak | the open lattice, roaring heart |
| `ribWindows` / side | 0 (sealed) | 2 | 4 | 6 |
| hole-area fraction (side view) | 0 | 0.08 | 0.16 | 0.26 |
| `coreBlaze` | 0.15 (crack only) | 0.40 | 0.70 | 1.00 |
| `socketVent` | 0 | 0 | 0.5 | 1.0 |
| tail vertebrae / lit gaps | 8 / 0 | 9 / 0 | 10 / 1 | 12 / 3 |
| wing fingers / shroud panels | 2 / 1 | 3 / 1 | 4 / 2 | 4 / 2 (+crescent cuts deepen) |
| span : body | 1.6× | 1.9× | 2.2× | 2.4× |
| socket : skull | 34% | 28% | 22% | 18% |
| body hex (value ↑ — BLEACHING) | `0x9a9284` | `0xaaa392` | `0xbdb6a4` | `0xcfc9b8` |
| tri target | ~1.7k | ~2.5k | ~3.5k | ~4.7k |

Asserts: tris ↑ · `ribWindows`/hole-fraction/`coreBlaze`/`socketVent`/lit-gaps/span ↑ · **body value
monotonic INCREASING** (its own unique assert — the mirror of Vesper's) · socket:skull ↓ · outline
stays ONE connected component at every form (holes interior only).

## 9. Palette (chalk + one interior fire)
- **Anchor (aged bone, ~40° at sat ≤0.12 — hueless chalk in practice):** ramp UP `0x9a9284 →
  0xaaa392 → 0xbdb6a4 → 0xcfc9b8`; sun-bleached ridge `0xdcd6c6`; umber shadow/socket `0x4a4238`;
  shroud ash `0x35322c` → hem `0x6a665c`.
- **Accent (emissive, INTERIOR only): gravefire `0x54f04e`**; core heart cap `0x9af08a` (sat-held);
  pinpoints `0x76f068`; wisps `0x46c854`. Coverage ≤6% of visible surface (apertures are small).
- Trail `0x2e8a3a` → boost `0x46c854` → `surgeHi 0x8af07e`. Zero warm, zero gold, zero red.
- **The Pearl firewall (assert):** body sat ≤0.12 AND no gold-family diffuse anywhere — chalk can
  never drift toward holy white-gold.

## 10. Perf / overdraw (pre-solved)
1. **Negative space is FREE fill** — the roster's cheapest big-envelope wing (void costs nothing).
   Transparent drawables ≤5 cruise (2 shroud hems + trail), ≤8 in Surge (+3 wisps).
2. **The core never glare-masks the corridor:** it sits inside the cage BELOW the rider eye-line;
   Surge blaze is capped and interior (the cage bars themselves shade it).
3. **±10° corridor** at all 5 flap phases + the folded state (fingers close INBOARD-aft, checked).
4. **Budgets:** tri ladder 1.7/2.5/3.5/4.7k; bones are cheap tubes — the spend is knuckle facets +
   the skull. Draws ≤65 apex (merged bone fields per material).
5. **Hole asserts run headless** via the silhouette hole-metric (engine need §11) — no GPU needed.

## 11. Engine plumbing (fresh names; nullable, default-off)
New module `js/dragonRevenant.js`: self-registering `ossuaryTorso` · `phalanxShroudWings` ·
`revenantSkullHead` · `vertebraeWhipTail`. New nullable dials: `ribWindows, coreBlaze, socketVent,
tailVerts, litGaps, shroudPanels, crescentDepth, boneBleach, clickStep, glowLevel, igniteStage`.
**ENGINE NEED (tooling, not runtime):** a hole-metric on `silhouetteCore.mjs` — count interior
holes + total hole-area fraction of a black fill (flood-fill from the border; anything unreached
and unfilled = hole). Lands with this slot; also retro-useful for MITTEN detection on every future
wing. Forbidden imports: organism family.

## 12. QA / gate process
- **Calibrate** on Pearl (the light-body neighbor — the veto: *"does any frame read holy instead of
  haunted?"*) and Phoenix (the other light-value apex).
- **Standing items:** hole-fraction ladder {0, .08, .16, .26}±0.03 monotonic (headless) · outline
  single-component at every form · gap-band sanction 0.30–0.42 planform (named in-test as sheet
  authority) · body value INCREASING · body sat ≤0.12 · accent 118°±20 · interior-only emissive
  (no lit mat on any exterior bone surface — inventory assert) · fold ≤0.60 · tricount <6000.
- **`tests/starters.mjs` 4-form SPEC:** `ribWindows` {0,2,4,6} · `coreBlaze` monotonic · finger
  count {2,3,4,4} + dominant-decay lengths non-equal · elbow angle ≥20° · socket:skull ↓ · taper
  (fingers ≤0.15×, tail chain ≤0.20×) · spine inflections ≥2 · motif anchor drift ≤0.15 · tri ±20%.
- Rides the PR preview (gate-blind): the SNAP beat + finger rattle feel, whether the open cage
  reads at gameplay distance or needs +0.02 hole-fraction, tone (haunted vs gruesome — owner call),
  bright-biome legibility of ivory-on-sky (the inverse of Vesper's dark-shop problem).

## Benchmark vs the roster's best
Solar is completion-by-regalia; Vesper is completion-by-edge; Phoenix is completion-by-fire. **The
Revenant wins on CONSTRUCTION NOVELTY** — the only creature in the roster (dragon OR boss-adjacent)
whose identity is negative space: it reads as impossible ("how is it flying?") at first sight, which
is precisely the screenshot trigger. It also carries the roster's most legible growth verb: the
cage-opening is visible at ANY distance because it is silhouette, not surface. Where it must match
them: the bone lattice must stay elegant (crescents + decay, never clutter), and the f3 core-roar
frame must rival Solar's ignition.

## §R — HARSH REAR-CHASE GATE REVISION (Opus critic pass, 2026-07-13)
**Verdict on the v0 sheet: PASS (with polish notes).** This is the strongest rear-chase read of the
Fresh Five: the negative-space silhouette is the most distinct thing in the set and its overdraw story
(void = free fill) is the cleanest. Score: silhouette distinctiveness 5 / interest 4 / nameability 5;
buildability 5; appeal 4.5. It passes clean — but the through-gaps must stay DESIGNED, never noisy.

### R1. Sharpened §2 rear-chase silhouette
- **One word:** **SKELETON** (or HOLLOW).
- **Black-fill (rear):** a lean bone-frame with a strong DRACONIC wing OUTLINE whose interior carries
  clean crescent through-holes (wing bays open to sky), the dorsal spine-gap leaking core-light, the
  lit tail-vertebra gaps punctuating the tail — one connected outline, holes interior only.
- **3+ centerline / landmark punctuation:** (1) the wing-bay through-holes framed by finger bones; (2)
  the dorsal spine-gap core-leak (the rear-chase carrier); (3) the lit tail-vertebra gaps; (4) the
  antler-tines breaking the skull outline.
- **Distinct from the other four because __:** it is the ONLY negative-space silhouette in the roster —
  no other dragon's black-fill contains holes. Zero collision risk with the other four.

### R2. Polish notes (not blockers)
1. **Keep crescents FEW, LARGE, CLEAN (3–4 per panel max).** Many small ragged holes read as DAMAGE /
   an unfinished model; a few clean swept crescents read as designed wind-tatter. This is the whole
   ballgame for "reads as a dragon, not noise."
2. **Verify 0.26 apex hole-fraction reads at gameplay distance** — the sheet's own gate-blind residual;
   if it reads solid at distance, bump +0.02 (already flagged §12).
3. **Outline stays ONE connected component at every form** (already asserted) — the anti-noise lock.

### R3. Buildability audit (every hero element + motif → cited path)
| element | engine construction path (reference impl) | overdraw |
|---|---|---|
| `ossuaryTorso` (vertebra beam + rib hoops) | bone-lattice assembly — Vesper `knapLoft` faceted knuckles + elliptical rib-arc tubes | opaque, 0 |
| GRAVE HEART motif (caged core) | opaque emissive faceted teardrop mesh (~60 tris), lantern read from flat facets | opaque emissive |
| PHALANX SHROUD (hero, bone-finger fan) | CP1 fingered-bat recipe (`dragonWings`) with bone tubes + remnant panels; crescent cuts in the membrane | ≤2 hem layers (single-layer 0.68) |
| `revenantSkullHead` | faceted head (`flatTriMesh`) with recessed socket geometry | opaque, 0 |
| `vertebraeWhipTail` | isBone 4-joint chain, −anchor compensation | opaque, 0 |
| hole-metric (verification) | NEW flood-fill hole counter on `silhouetteCore.mjs` (tooling, headless — retro-useful as a MITTEN detector) | none (offline) |
**Total transparent ≤5 (2 shroud hems + trail); negative space is FREE fill** — the roster's cheapest
big-envelope wing. Every element maps to a proven path.

### R4. SSSR appeal / art-direction
**Why a stranger screenshots and grinds:** "how is it flying?" — a skeleton dragon lit from within by
grave-green ghost-fire, the cage opening wider and the bone bleaching cleaner as it ascends. **Lead:
HAUNTED POWER** (elegant dracolich). Anti-gross guard: clean bone architecture + green lantern-light,
zero gore/flesh/red — eerie, never grisly (tone remains an owner call on the preview, already flagged).

## §F — FABLE GATE (round-2, 2026-07-13)
**Fable gate: PASS (round-2).** Scores: rear-silhouette 5 · buildability 5 · SSSR appeal 4.5 · sweep
clean → avg 4.9, the strongest sheet of the five. Re-judged with fresh eyes and the Opus PASS HOLDS —
the only holes-in-the-fill silhouette in the roster is unmistakable in backlit black-fill at any size,
the void-is-free-fill overdraw story is the honest opposite of every glow-stacking temptation, and
"how is it flying?" is the set's best grind trigger. One numeric floor added so R2.1's "few, large,
clean" survives the chase distance: **each rear-visible wing-bay through-hole ≥0.05 of the full-fan
planform (≈≥8px at the 250px chase read)** — many sub-8px holes alias into MITTEN-noise and hand back
the "damaged model" read R2.1 kills. Same floor applies to the lit tail-vertebra gaps (≥3px or merge
two gaps into one). Nothing else touched.

## SETTLED (do not re-litigate)
- **The fire is INTERIOR-only** — never painted on bone; the Revenant is a lantern.
- **BLEACHING (value ↑) is the ramp** — the deliberate mirror of Vesper's darkening.
- **Through-gap band 0.30–0.42 is sheet-sanctioned** over the 0.35 membrane default.
- **Gravefire 118°** — clean of Vesper's 80° eyes and Jade's 149° mint; never chartreuse-shift.
- **No gore, no flesh, no red; matte chalk, never satin pearl.**
- **f0 is SEALED** — the hatchling shows one glowing crack; the earn is the opening.

## Open owner calls (flag on the build PR)
1. **Name** — "Gravelight Revenant" (recommended); alternates Ossuary Wyrm · Palegrave.
2. **Cost/slot** — 2400 proposed.
3. **Tone rating** — a skeleton in a bright pastel-leaning game: confirm the whimsy/graveness mix
   on the preview (the sheet's answer: elegant bone + green lantern-light, zero gore).
4. **Click-step micro-quantize** — the bone-rattle motion signature; a feel call on the preview.
5. **Surge wisp count (2 vs 3)** — overdraw vs drama at the tail; preview + perf HUD.

## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh bone-wraith GRAVELIGHT REVENANT — identity
  HAUNTED (a lantern, not a lamp); hero = THE PHALANX SHROUD (bone-finger fan, designed crescent
  through-gaps 0.30–0.42 sanctioned); motif = THE GRAVE HEART (caged interior core, seen only
  through apertures; dorsal spine-leak as the rear-chase carrier); the HOLLOWING ladder (rib
  windows 0→6, hole-fraction 0→0.26, asserted headless via the new silhouette hole-metric) + the
  BLEACHING value ramp (the roster's second value-invert, mirroring Vesper). Next: stub + Pearl/
  Phoenix gate calibration, then vertebra beam → cage + core → phalanx wing → skull, per-increment
  Fable gates.
