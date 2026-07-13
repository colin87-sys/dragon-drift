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

## §B — v1 BUILD-READY BUILD SHEET (research-grounded, build-first; Fable design-director + feasibility audit, 2026-07-13)

**Status: BUILD-READY.** The owner chose the Revenant as FIRST of the Fresh Five to build. This section
turns the PASSED concept (v0 + §R + §F — all SETTLED rulings survive verbatim) into the builder's
working contract, grounded in the shipped-undead-dragon research DNA (D&D dracolich · Skyrim Durnehviir ·
Pokémon Dragapult) and audited line-by-line against the REAL engine (every construction path below cites
a shipped implementation, mostly `js/dragonVesper.js` + the `js/dragon.js` rig hooks read from code this
session). Where a v0 number had NO rig hook, §B.6 records the honest substitution — nothing here is
aspirational.

**§B refinements of v0 (none touch the SETTLED list):**
1. Builder names LOCKED to §11's: `ossuaryTorso · phalanxShroudWings · revenantSkullHead ·
   vertebraeWhipTail` (module `js/dragonRevenant.js`).
2. The Grave Heart is published through the rig's REAL `parts.coreGlow` hook (dragon.js:1147–1151 drives
   `material.opacity`: floor → ×1.5 boost breathe → ×(1+1.4·sgm) Surge blaze + flicker) — which requires
   the heart mat `transparent:true`. §B.4 amends v0 §3's "opaque" to: **the heart is the ONE sanctioned
   transparent mesh in the cage** (single layer along any ray; it IS the lantern flame). Overdraw
   recounted honestly in §B.4c.
3. The grave-light family (gap-leak discs, socket vents, wisp) goes in **`materials.flareMats`, NOT
   `spineMats`** — dragon.js:82–83/222/1185: spineMats get the global WARM cruise fresnel rim
   (`0xfff0d8`), which would pollute the 118° family; flareMats are Surge-flared but never rim-lit.
   A real engine-truth catch — this is the Pearl-firewall's plumbing enforcement.
4. Recess/socket shadow tier shifts umber → **umber-GREEN `0x464b3d`** (Durnehviir's grey-green rot,
   recesses only, never lit faces; sat ≈0.11 stays under the ≤0.12 body cap).
5. NEW anatomy from the DNA: articulated NECK vertebrae (the dracolich "every vertebra defined" law now
   covers neck AND tail), neural-spine blades per vertebra (Durnehviir's ridge), the travelling
   bone-seam gap-pulse (the "glow that dances across the bones", §B.4b), and the **spectral wisp
   tail-tip** (Dragapult's translucent taper, §B.3d).
6. v0 dials with no rig hook get substitutions: `downFrac` → `glidePow`+`tipLag` (§B.6 row W6);
   per-finger micro-lag → CUT from v1 (row W7); `clickStep` → default-off deferred (row T4).
7. Surge wisp-card default = **2** (not 3): 3 cards + the fever aura sprite would breach the ≤8 Surge
   transparent budget (§B.4c). Owner call #5 keeps the 3rd card behind perf-HUD proof.

### §B.1 Reference DNA → design decisions

| Research detail (source) | Revenant element it grounds | Deliberately NOT taken |
|---|---|---|
| "Every vertebra in the serpentine neck and long tail individually defined" (dracolich) | `vertebraUnit()` — ONE shared low-poly repeating element (§B.3a) used by neck (3→5), dorsal beam (9), tail (8→12); counts ladder monotonic | — |
| "Ribcage hollowed out, the empty cavity where a heart once beat" (dracolich) | the OPEN CAGE + Grave Heart (settled); §B.6-Q(a) proves the render path | flies/drool/decay particles |
| "Necromantic glow that DANCES ACROSS THE BONES" (dracolich) | the **gap-pulse**: a deterministic CPU phase travelling tail→head over the vertebral gap-leak discs (§B.4b) — interior light in the GAPS, so the lantern law holds | glow painted ON bone faces (violates the settled lantern law) |
| "Eyes = pinpricks of chilling light floating in shadowy sockets" (dracolich) | pinpoint octahedra recessed ~0.6× socket depth INSIDE the orbit geometry (parallax float, §B.3c) | big lit eyeballs |
| "Tattered membranes stretched taut over sharp bony fingers; only rotted scraps remain" (dracolich) | the PHALANX SHROUD (settled): panels on outer 2 bays only, crescent cuts | "patchwork of dried flesh strips" — NO gore/flesh (settled); the remnants are SHROUD cloth, ash-toned |
| Neck→tail massive neural SPIKES (Durnehviir) | neural-spine blade on every `vertebraUnit` — the dorsal ridge the chase cam reads; heights swell-then-taper (law 5) | — |
| Grey-green undead complexion (Durnehviir) | umber-GREEN `0x464b3d` recess/socket/underside tier — rot lives in SHADOW only | grey-green on lit bone faces (bone stays chalk; BLEACHING is settled) |
| Four horns (Durnehviir) | — | NOT taken: 2 antler-tines stay (settled §6); 4 horns crowd the skull outline at 250px |
| Lean stealth-frame, short body + long flat tail (Dragapult) | validates the hunting-stoop line of action + the long naked-vertebra tail (settled) | the stealth-bomber head literalism (ours is a draconic skull) |
| Tail turns TRANSLUCENT/ethereal toward the tip (Dragapult) | the **spectral wisp tip** (§B.3d): one single-layer translucent taper aft of the spade; cruise NON-emissive (spectral by transparency), Surge-flared | per-vertex alpha fade (needs a shader patch; the taper+translucency substitute is free) |
| Death-fire on defeat (Durnehviir) | folded into "the Haunting" Surge (settled) | a death/defeat state (players don't die as the dragon) |

### §B.2 Finalized art direction + silhouette (locks §R1/§F)

- **One-word rear read: SKELETON.** Black-fill (rear): a lean bone-frame with a strong draconic wing
  OUTLINE whose interior carries clean crescent through-holes; the dorsal vertebra ridge saw-lines the
  top edge; ONE connected outline component, holes interior only, every rear-visible wing-bay hole
  ≥0.05 planform (≈≥8px at the 250px chase read — the §F floor).
- **Landmark punctuation (4):** (1) wing-bay through-holes framed by finger bones; (2) the dorsal
  spine-gap leak (grave-light between vertebral plates — the rear-chase carrier, now ANIMATED by the
  gap-pulse); (3) the lit tail-vertebra gaps + wisp tip trailing toward the lens; (4) the antler-tines
  breaking the skull outline.
- **Anti-collision confirmed:** vs Pearl — matte chalk sat ≤0.12 vs satin pearl+gold; skeleton cage vs
  paladin armor; green interior fire vs white-gold surface light (calibration veto: *"does any frame
  read holy instead of haunted?"*). vs Phoenix — bone-finger fan vs feather ranks; 118° vs warm triad.
  vs Vesper — value-invert MIRROR (bleach ↑ vs darken ↓), ivory vs L≤0.10 black, 118° vs 80° eyes
  (38° margin) / 223° seam. vs Jade — 118° vs 149° mint (31°). The ONLY holes-in-the-fill silhouette
  in the roster (§F: zero collision risk).

### §B.3 The part builders — `js/dragonRevenant.js` (bone-lattice assembly, self-registering, nullable default-off dials, forbidden imports: the organism/smooth-hull family)

**Shared kit (top of module):** `flatTriMesh` (mechaKit.js) · a `revenantMats(def, glow, stage)` factory
copying only the `vesperMats` STRUCTURE (dragonVesper.js:43–80 — stage-aware, `userData.baseEmissive/
baseIntensity` on every ticked mat): tiers `boneRidge 0xdcd6c6` (sun-bleached dorsal) / `boneFlank` =
`def.body` (the BLEACH ramp hex) / `recess 0x464b3d` (umber-green, sculpted AND painted) / `shroudAsh
0x35322c → hem 0x6a665c` / `graveCore` (emissive `0x54f04e`, heart-cap `0x9af08a`) / `gapLeak` /
`pinpoint 0x76f068` / `vent 0x46c854`. Bone material law: roughness 0.9, metalness 0, envIntensity
0.12, **emissive 0x000000** (the rig ticks `bodyMat.emissiveIntensity` to 0.12 cruise / 0.35 Surge at
dragon.js:1193 — black emissive makes that a no-op, which is how "no lit exterior bone" survives the
rig). A `boneTube(stations, profile)` helper = `knapLoft` (dragonVesper.js:106–131) with a 4–5-point
bone profile and the **per-column matOrFn** painting inward-facing columns `recess` — see §B.6-Q(a).

**§B.3a `ossuaryTorso`** — vertebra beam + hollow cage. Publishes the full attach contract
(`wingRoot(side)`, `headBase`, `tailAnchor`, `keelTopAt`, `halfWidthAt`, `bodyMidY`, `riderSocket`),
`spinePoints` (≥2 inflections: skull-low stoop → rise over pelvis → tail counter-lift), `motifAnchor`
(cage center, fixed), and **`coreGlow` = the Grave Heart mesh** (the Solar hook's second real user —
NOT Vesper's `coreGlow:null` guard; the guard comment stays to explain why this one is non-null).
- `vertebraUnit(z, s, opts)` (~26 tris): centrum = a 2-station 6-column mini-loft (swell-then-taper —
  the sanctioned bone profile, law-4 at chain level); neural-spine blade = a 4-tri thick tent
  (Durnehviir ridge; NO paper planes — every blade is a 2-face tent like Vesper's CP5 ear wedges);
  2 transverse nubs. **9 dorsal units** z −1.2→+1.4, scale ×0.94 per step aft, disc gap 0.05–0.08
  (the gaps host the gap-leak discs from f2). **Neck: 3→5 units** arcing DOWN-forward (skull leads
  low), scale ×0.90 toward the skull. All unit tris are ACCUMULATED into shared per-material arrays
  and emitted as ≤3 `flatTriMesh` (one per tier) — never 26 meshes (the Pearl 253-draw lesson;
  apex draws ≤65).
- **Rib hoops:** per side ≤6 elliptical arc staves (5 stations sampled along the arc, 4-sided
  cross-section, width ×0.85 tipward — law-5 decay), spanning vertebra beam → sternum keel with
  ≥0.02 interpenetration at both ends (overlap-not-weld; facet interpenetration is invisible
  flat-shaded, and coplanarity — the z-fight source — is banned). The BETWEEN-stave voids are the
  rib windows: TRUE through-holes (no interior liner — the side-view hole-fraction assert requires
  flood-fill-reachable sky). `ribWindows` dial gates staves 6→windows; **f0's seal** = one umber-green
  cartilage panel per side, inset 0.01 INSIDE the stave plane (never coplanar), removed by the ladder.
- Sternum keel (flat blade below, ~10 tris) + pelvic blade (~12) + **scapular plates** — 2 knapped
  flake-plates per side lapping the wing roots, verbatim the Vesper `buildScapularCowl` overlap trick
  (dragonVesper.js:540–562), static in the body frame.
- **THE GRAVE HEART** (~60 tris): a faceted teardrop (fan-built via flatTriMesh — big flat facets =
  the lantern-flame read), heart-cap `0x9af08a` upper facets falling to `0x2e8a3a` at the base,
  suspended at the cage center with **≥0.08 clearance from every stave** (no z-fight possible),
  BELOW the rider eye-line (§10.2). Material `transparent:true`, `userData.base = 0.30+0.55·coreBlaze`
  → the dragon.js:1147 tick delivers §3's exact contract (low floor / boost breathe / Surge blaze)
  with ZERO new engine code. The same mat carries `userData.baseEmissive/baseIntensity` in
  **flareMats** so Surge also hue-shifts it toward `surgeHi 0x8af07e` (two orthogonal channels:
  opacity=breath, emissive=blaze).
- Value tiers: `boneRidge` on dorsal/spine columns, `boneFlank` on stave outer faces, `recess` on
  stave INNER columns + joint sockets + underside (painted and sculpted).

**§B.3b `phalanxShroudWings`** — the HERO. Construction = the Vesper fingered-bat recipe with the skin
mostly removed (cited: `buildOneScallopWing` dragonVesper.js:365–534, `vesperArmY/Z` leading-edge
profile 346–356, the `ridge()` bone-tent helper 400–409, the −anchor wrist fold + `lmirror` outer
mirror 624–640 — reuse the PATTERNS, fresh geometry):
- **Arm:** humerus → radius as two `ridge()` bone tubes with knuckle swells; elbow angle ≥20°
  (asserted — never one straight spar); carpal knuckle at `wristT 0.24` (more medial than Vesper's
  0.21-tuned arm — short arm, long skeletal hand). Thumb-spur at the knuckle (Vesper thumbClaw
  pattern).
- **4 metacarpal fingers** fan from K with `lenFrac [1, .80, .62, .46]` (dominant-plus-decay), each a
  2-segment bowed `ridge()` tapering to 0.15× base with a 2-tri claw nub; finger bones take
  `boneRidge` with the lighter rim-catch cap (the `capMat` slot) so the fan reads sculpted at 250px.
- **The SHROUD:** membrane panels ONLY across bays 0–1 and 1–2 (outer two); **inner bays get NO
  geometry at all** — through-gap by omission, literally free fill. Each panel = the Vesper bay-fan
  (quad-bézier trailing arc, ≥4 segments — sawtooth killer) but the trailing polyline is composed of
  **2 clean swept CRESCENT bites** (depths ×0.8, deeper aft; `crescentDepth` dial scales them).
  Panels opaque, 3 value tiers stepping ≥0.05 L (`0x35322c → 0x4a463e → hem-adjacent`), cup 0.30
  (ctrl-point drop — rim light pools in the bays).
- **Hem:** ONE connected single-layer translucent band (opacity 0.68) along the whole trailing
  polyline — verbatim the Vesper edgeBand fix for the floating-debris gotcha (dragonVesper.js:470–477).
  1 transparent drawable per wing.
- **Sanctioned gap band:** through-gap area 0.30–0.42 of full-fan planform at apex (sheet authority
  over the 0.35 membrane default, settled); per-hole px-floor per §F. Measured headless on the `top`
  planform silhouette with `--wings-only` + the new hole-metric (§B.8).
- **Motion:** `wingParts 3` — pivot/mid/tip with `userData.wingRole`, the hand carrying fingers+
  panels+hem as one rigid sheet, `tip.position=K` / `hand.position=−K` (the −anchor byte-identical
  rest pose), LEFT = outer `lmirror scale.x=−1` wrapper (the aurumToro convention — never
  `pivot.scale.x=−1`). SNAP envelope via REAL dials only: `glidePow 1.6` (pow-shaped cycle = fast
  strike through, long recovery hold), `tipLag 1.2`, `flapAmp 0.85`, `flapBias 0.9`, `rootAmp 0.6 /
  midAmp 0.3 / tipAmp 0.6`. (v0's `downFrac` has no rig hook — substituted, §B.6 W6.) **Fold:**
  fingers close inboard-aft like a broken umbrella; measured span ≤0.60 of glide; the through-gaps
  VANISH folded (panels overlap the closed fan) — the silhouette transformation, asserted via the
  fold pose contraction check.
- **Numbers:** apex span:body 2.4× (≤2.5 assert) · single-wing SOLID area:body side-area 0.55–0.7 ·
  sweep 22° · dihedral 12°. Publishes `wingPivot/Mid/TipL/R` + tip marker (duplicating the
  leading-edge profile formula — the detach gotcha) + `parts.wingElements` (arm + 4 fingers,
  `{root, tip, length}`).

**§B.3c `revenantSkullHead`** — a true draconic SKULL, ~16 big facets via a mini bone-profile loft
(occiput → brow → cheek → nasal notch → muzzle; the notch = a pinched station pair). 6-tooth upper row
(flat 2-tri blades, ×0.85 falloff), 2 back-swept antler-TINES (2-segment tapered tents, tip ≤0.15×).
**Sockets:** the orbit is RECESSED GEOMETRY — an inset facet ring painted `recess 0x464b3d`; the
pinpoint is a small octahedron (the Vesper eye pattern, dragonVesper.js:748–755) emissive `0x76f068`
seated ~0.6 socket-depth INSIDE (parallax float — the dracolich pinprick). Socket:skull ladder
34→28→22→18% while `eyeMat.emissiveIntensity = 0.6 + 1.8·glowLevel` RISES (the Vesper intensity-ramp
lesson — light growing is the grind reward; waif → wraith). Pinpoint mats stay OUT of all surge
arrays (Vesper law); `feverEye 0x9af08a` overrides the rig's magenta default (dragon.js:1194).
**Socket vents:** one small emissive cone behind each orbit (8 tris, opaque, `vent` mat in flareMats,
base ≈0.02·socketVent — withheld; Surge blazes them per §3). Publishes `motifAnchor` + `headLength`.

**§B.3d `vertebraeWhipTail`** — 8→12 `vertebraUnit`s (scale ×0.92 per step) on the Vesper **isBone
4-joint nested chain** verbatim (dragonVesper.js:786–795: `jAnchor`/`chainAdd` −anchor compensation,
`joints[0].isBone = true`, rotation-only — position writes tear the chain). `tailWhip: true,
tailLagScale 0.18, tailUndulateX 0.20, tailRudderScale ~0.5` (the compounding-turn trim). Gaps between
the last 3 units open at f2/f3 and host gap-leak discs (below). Terminus: the bone SPADE plate pitched
+15° toward the chase lens (cant law), then **the SPECTRAL WISP TIP** — one single-layer translucent
tapered ribbon (~12 tris, 3 segments narrowing to a needle) trailing aft of the spade, length
`wispLen`·tail (0→0.55 up the ladder). Cruise material: NON-emissive pale grave-grey `0x8fae94`
diffuse, `transparent:true, opacity 0.42` — spectral by TRANSPARENCY + taper alone, so the
cruise-emissive inventory stays clean; the mat sits in flareMats and IGNITES gravefire on Surge.
Binned to the last chain joint (it whips with the tip).

### §B.4 THE GRAVE HEART — motif plumbing, the dorsal carrier, the Haunting, the fever firewall

**§B.4a Aperture reveal + 4-step HOLLOWING bloom** — as v0 §3 (settled): f0 sealed + sternum glow
crack (the crack = one thin recessed emissive sliver in the seal panel's groove, `gapLeak` mat at
base 0.15) · f1 two rib windows/side, dim coal · f2 four windows + the dorsal gap-leak arrives ·
f3 six windows, sockets vent, 3 lit tail gaps, core roars.

**§B.4b The dorsal carrier — gap-leak discs + the travelling gap-pulse.** Between vertebra discs, a
small emissive OCTAGONAL plug (~10 tris) inset ~40% inside the gap, diameter ≈0.6× centrum — from
outside you see a lit sliver BETWEEN bone plates; the emissive face is recessed interior geometry, so
the lantern law holds ("light through bone", never on it). All plugs share ONE `gapLeak` material →
1 draw. **The dance (dracolich DNA):** a deterministic CPU phase walks brightness tail→head across
the plugs. The rig ticks materials, not per-plug phases, so plugs are grouped into **3 phase-bucket
materials** (fore/mid/aft; 3 draws total) and a ≤8-line guarded per-dragon tick in dragon.js
(precedent: the jade pearl-mat tick, dragon.js:1007–1014) cycles their `emissiveIntensity` at
`0.25·coreBlaze·(0.7+0.3·sin(ωt−k·bucket))`, ω fixed (deterministic, headless-tickable, pinnable for
captures). Fallback if the owner vetoes rig code: static swell pattern (fore<mid<aft), the boost/Surge
tick still animates them globally.

**§B.4c Full fever-palette override + overdraw budget.** The rig defaults are hostile: `feverWing
0xff44cc` magenta (dragon.js:1135), `feverEye 0xff66ee` magenta (1194), `surgeHi 0xfff8e8` white-gold
(1156), warm rim `0xfff0d8` on spineMats (1185). Every hook, explicit on the def:

| hook | value | why |
|---|---|---|
| `feverWing` | `0x000000` | shroud stays a dark silhouette on Surge (Vesper precedent, dragons.js:610) — the light is INTERIOR |
| `wingMembraneEmissive` | `0x000000` | kills the cruise/boost wing-glow target (dragon.js:1131) on the ash panels |
| `feverEye` | `0x9af08a` | socket pinpoints blaze sat-held green, never magenta |
| `surgeHi` | `0x8af07e` | flare loop lerps the grave family toward this, never white-gold |
| `feverWash` | `[0.02, 0.05, 0.02]` | faint green screen wash (format per Vesper/Solar arrays) |
| `eye / apexEye` | `0x76f068` | pinpoints |
| `apexSeam / coreGlow` (color fields) | `0x54f04e` | hue-lock ground truth |
| `trail / boostTrail` | `0x2e8a3a / 0x46c854` | (field names verified in dragons.js) |
| `fx.auraColor` | `'84,240,78'`, `auraIdle 0` | no idle halo — the lantern is interior |
| surge arrays | grave family in **flareMats** (never spineMats) | dodges the warm cruise rim (§B refinement 3) |

**Overdraw census (counted, not vibes):** CRUISE transparent drawables = 2 shroud hems + 1 Grave Heart
+ 1 wisp tip + 1 trail = **5 ≤ 5** (zero slack — if the p95 HUD complains, the heart goes opaque and
forfeits the boost-breathe, dropping to 4). SURGE = those 5 + 2 witchfire wisp cards + the fever aura
sprite = **8 ≤ 8** (this is why the wisp-card default is 2). Max alpha layers along any chase ray:
wing hem+trail = 2; cage ray = heart alone = 1; tail ray = wisp+trail = 2 — all ≤2 ✔. Everything else
in the dragon is OPAQUE (bones, panels, core-family plugs/vents are opaque emissive). Negative space
remains the roster's cheapest big-envelope wing.

### §B.5 The HOLLOWING ladder (4 forms; supersedes nothing — extends v0 §8 with the new DNA dials)

f0 Grave Whelp · f1 First Waking · f2 Open Cage · f3 Gravelight Revenant. Drama 25/45/70/100.

| dial | f0 | f1 | f2 | f3 | assert |
|---|---|---|---|---|---|
| `ribWindows` / side | 0 (sealed) | 2 | 4 | 6 | exact {0,2,4,6} |
| hole-fraction (side black-fill) | 0 | 0.08 | 0.16 | 0.26 | ±0.03, monotonic ↑, each hole ≥px-floor |
| wing through-gap (planform) | 0.18 | 0.26 | 0.34 | 0.38 | monotonic ↑; f3 in 0.30–0.42; bays ≥0.05 planform each |
| `coreBlaze` | 0.15 (crack) | 0.40 | 0.70 | 1.00 | monotonic ↑ |
| `socketVent` | 0 | 0 | 0.5 | 1.0 | monotonic ↑ |
| vertebrae neck / dorsal / tail | 3 / 9 / 8 | 4 / 9 / 9 | 4 / 9 / 10 | 5 / 9 / 12 | total 20→22→23→26 ↑ |
| lit tail gaps / `gapPulse` | 0 / off | 0 / off | 1 / on | 3 / on | ↑; gap slivers ≥3px or merged |
| wing fingers / shroud panels | 2 / 1 | 3 / 1 | 4 / 2 | 4 / 2 | {2,3,4,4}; lengths non-equal |
| `crescentDepth` | 0 | 0.5 | 0.8 | 1.0 | monotonic ↑ |
| `wispLen` (×tail) | 0 | 0 | 0.30 | 0.55 | monotonic ↑ |
| span : body | 1.6× | 1.9× | 2.2× | 2.4× | ↑, apex ≤2.5 |
| socket : skull | 34% | 28% | 22% | 18% | monotonic ↓ (pinpoint intensity ↑) |
| body hex (`boneBleach` — value ↑) | `0x9a9284` | `0xaaa392` | `0xbdb6a4` | `0xcfc9b8` | **value monotonic INCREASING** (the roster's second invert; mirror of Vesper's ↓) |
| `glowLevel` | 0.25 | 0.5 | 0.75 | 1.0 | ↑ |
| tri target | ~1.7k | ~2.5k | ~3.5k | ~4.7k | monotonic ↑, ±20%, <6000 |

Growth-verb asserts: HOLLOWING = hole-fraction ↑ + ribWindows ↑ + litGaps ↑ + throughGap ↑;
BLEACHING = body value ↑. Every rung adds a CATEGORY (aperture + light + a silhouette move), never
scale alone. Note the bone-anatomy tri spend is front-loaded (the fingered wing is mostly sky, ~380
tris/pair at apex) — the apex ceiling is spent on knuckle facets, the tooth row, socket depth, and
vertebra chamfers, not glow.

### §B.6 FEASIBILITY AUDIT (every element → cited engine path → overdraw → biggest risk → mitigation)

| # | element | engine construction path (cited) | overdraw | biggest build risk | mitigation / substitution |
|---|---|---|---|---|---|
| T1 | `vertebraUnit` beam (neck+dorsal+tail) | mini swell-taper lofts + tent blades via `flatTriMesh` (mechaKit) — the Vesper nub-row pattern (dragonVesper.js:212–232) scaled up | 0 (opaque) | SAWTOOTH — 26 near-equal repeats | ×0.9–0.94 scale steps + neural-spine heights swell-then-taper; batched into ≤3 draws |
| T2 | rib-hoop staves + TRUE windows | arc-sampled 4-column `knapLoft` tubes; per-column mat paints inner faces `recess` | 0 | windows alias <8px → "damaged model" | px-floor assert on per-hole min-dimension (§B.8); stave count caps at 6 (few, large, clean) |
| T3 | f0 cartilage seal | opaque panel inset 0.01 off the stave plane | 0 | z-fight with staves | never coplanar by construction; inset asserted in the builder |
| T4 | tail chain motion (+`clickStep`) | isBone 4-joint −anchor chain, verbatim dragonVesper.js:786–795 | 0 | `clickStep` quantize has NO rig hook | **SUBSTITUTION: deferred, default-off** — a ≤5-line guarded snap in the tail-whip walk only if the owner asks (call #4); v1 ships the plain chain |
| H1 | skull + recessed sockets + pinpoints | mini bone loft + inset orbit ring; octahedron pinpoints = Vesper eye (748–755) with the intensity-ramp lesson | 0 | pinpoint <2px at chase | pinpoint ≥3px floor + intensity carries the read (contrast law) |
| H2 | antler tines / tooth row | 2-seg tapered tents / 2-tri blades ×0.85 | 0 | tangent vs wing leading edge | rest-pose tine sweep checked against the ±10° corridor + no-tangent law in captures |
| W1 | bone-finger fan (arm+4 fingers) | `ridge()` bone tents + `lenFrac` fan + −anchor wrist fold (dragonVesper.js:365–534) | 0 | reads as Vesper's wing re-skinned | fingers EXPOSED (no full membrane), 4 not 5, crescent-cut remnants — silhouette family differs; trio black-fill frame at the gate |
| W2 | shroud panels + crescent cuts | Vesper bay-fan bézier arcs ≥4 seg; 2 crescent bites, ×0.8 depth | 0 | crescents read as damage noise | R2.1: few/large/clean, 2 per panel max; `crescentDepth` dial gate-tunable |
| W3 | connected hem band | Vesper edgeBand (470–477), single layer 0.68 | 1/wing | floating-debris read if per-bay | one connected polyline strip — the fix is already the construction |
| W4 | through-gap band 0.30–0.42 | holes by OMISSION (no inner-bay geometry) | 0 (free fill) | band drifts out of 0.30–0.42 | headless planform hole-metric assert (§B.8) — tunable by panel chord, not rebuild |
| W5 | fold ≤0.60 + gap-vanish | wingParts 3 pose; fold contraction assert (starters.mjs pattern) | 0 | folded fingers crossing the corridor | fingers close INBOARD-AFT; flapstrip 5-phase + fold pin check (§10.3) |
| W6 | the SNAP (fast down, rattling recovery) | `glidePow 1.6` + `tipLag 1.2` + `flapAmp/flapBias` — all real dials (dragons.js vesper block precedent) | 0 | v0's `downFrac 0.38` DOES NOT EXIST in the rig | **SUBSTITUTION: glidePow+tipLag deliver the asymmetric envelope**; a nullable `downFrac` easing on the wingParts poser is a flagged optional engine need, NOT required for v1 |
| W7 | per-finger micro-lag (0.05·rank) | none — the poser drives pivot/mid/tip only | — | no hook; sub-pivots would be rig surgery | **SUBSTITUTION: CUT from v1.** The wrist-fold lag + tipLag carry the skeletal follow-through; per-finger pivots wait for the Stiletto aux-pivot tranche if ever |
| M1 | Grave Heart (floor/breathe/blaze) | `parts.coreGlow` hook — dragon.js:1147–1151 ticks opacity exactly per §3; flareMats carries the Surge hue-shift | 1 (the sanctioned cage transparent) | transparent mat = +1 cruise drawable (budget hits 5/5) | counted §B.4c; fallback = opaque heart (drop breathe) if p95 HUD objects |
| M2 | gap-leak discs + gap-pulse | opaque emissive plugs in 3 phase-bucket mats + a ≤8-line guarded tick (jade-mat precedent, dragon.js:1007) | 0 | touching dragon.js | nullable + guarded on parts-exist; deterministic ω; fallback = static swell (zero rig code) |
| M3 | socket vents (Surge) | opaque emissive cones, withheld base in flareMats | 0 | glare near the face on Surge | intensity cap + they face aft-down; corridor check at Surge in the studio surge state |
| M4 | spectral wisp tip | single-layer translucent taper, cruise non-emissive, Surge-flared via flareMats | 1 | cruise-emissive purity + overdraw | non-emissive in cruise BY MATERIAL (transparency does the ghost work); counted (5/5, ray ≤2) — **answers Q(b)** |
| M5 | Surge wisp cards (2) | additive cards, Surge-only, pooled | 2 Surge-only | budget breach at 3 cards + aura | default 2 (8/8 exact); 3rd card behind perf-HUD proof (owner call #5) |
| M6 | fever firewall | full override table §B.4c — every default named with its dragon.js line | — | ONE missed hook = magenta/white-gold leak | the §B.8 test asserts fever-state emissive hues ∈ 118°±20 by simulating the surge tick values |
| V1 | hole-metric (tooling) | flood-fill on the 0/255 coverage buffer `renderSilhouette` already returns (silhouetteCore.mjs) — border-fill; unreached 0-px = holes; component-label for count/area/min-dim | offline | resolution aliasing at 560×440 | render 2× via the existing `--w/--h` levers; floors defined in subject-relative px (§B.8) |
| V2 | BLEACH ramp + Pearl firewall | per-form `body` hex via `forms[]` accretion (standard); material-inventory scan asserts sat ≤0.12 + zero gold-family diffuse | — | ACES/tonemap drift toward cream at bloom | heart cap `0x9af08a` sat-held; calibration tile against Pearl is the standing veto |

**Q(a) — does a hollow cage with a glowing interior core render correctly + cheaply in flat-shaded
low-poly? YES, by construction.** The entire cage is OPAQUE: bone staves are solid tubes, the windows
are geometry ABSENCE (nothing to sort, nothing to blend), the heart is one transparent mesh with
≥0.08 clearance from every stave — so occlusion is plain z-buffer on opaque meshes, z-fighting is
impossible (no coplanar surfaces; joins interpenetrate ≥0.02), and the alpha count along a chase ray
through the cage is exactly 1 (the heart) ≤2. The real risk is READ, not rendering: sky visible
through BOTH flanks can flatten the "cavity" illusion — solved without an interior liner (which would
erase the asserted silhouette holes) by painting the staves' INNER-facing loft columns the umber-green
`recess` tier via `knapLoft`'s per-column matOrFn (dragonVesper.js:109 — shipped mechanism): the
far-side ribs seen through a near window present dark rot-shadowed faces, giving cavity depth while
the holes stay true holes.

**Q(b) — does the spectral tail-tip stay inside the p95 overdraw budget? YES.** It is ONE single-layer
translucent mesh (~12 tris) at the tail tip: +1 cruise transparent drawable (census 5/5, §B.4c), max
2 alpha layers on the tail ray (wisp+trail), and its screen coverage at chase distance is ~1–3% —
against the evidence baseline (Phoenix ships 56 transparent drawables; the fill cliff is measured on
BIG screen-space additive stacks, PREMIUM-BUILDSHEET-RESEARCH §6c) this is noise. The p95 guard
stands: if the `?debug=perf` worst-frame gauge moves, the wisp is the first thing to shorten, the
heart-to-opaque fallback is second.

### §B.7 BUILD INCREMENT PLAN (coexist → hero → ladder; the Vesper I1–I5 cadence, one harsh Fable gate per increment)

- **I0 — stub + tooling + calibration.** Roster key `revenant` (fully additive; roster byte-identical),
  `js/dragonRevenant.js` skeleton with 4 registered placeholder builders satisfying the attach/flap
  contract; LAND THE HOLE-METRIC (`holeMetric()` export in silhouetteCore.mjs + `--holes` on
  silhouette.mjs — retro-useful as the roster's MITTEN detector). Gate calibration on Pearl + Phoenix
  tiles with the standing veto (*"holy instead of haunted?"*) — expected behavior proven before any
  bone is built.
- **I1 — `ossuaryTorso` + THE GRAVE HEART.** Vertebra beam + neck units + rib cage + f0 seal + keel/
  pelvis/scapulars + the heart on the coreGlow hook. Gate: cage reads as DESIGNED bone at 250px (not
  damage), heart reads lantern-not-lamp, no holy read on the pale backdrop.
- **I2 — `phalanxShroudWings`.** Bones → panels → crescents → hem → fold. Gate: gap band 0.30–0.42 +
  per-hole px-floor headless, fold ≤0.60 transformation on the pinned fold state, wingsymprobe Δ0.000,
  trio black-fill vs Vesper's wing family.
- **I3 — `revenantSkullHead` + `vertebraeWhipTail`.** Skull/sockets/pinpoints/tines/teeth; tail chain
  + spade + wisp tip. Gate: socket waif→wraith ladder in the face crops; tail-ray alpha count; tine
  no-tangent.
- **I4 — the HAUNTING.** Gap-leak discs + gap-pulse tick (or static fallback) + socket vents + Surge
  wisp cards + the FULL fever-override table. Gate: a seamprobe-style two-state proof (cruise lantern
  floor vs Surge blaze — tools/seamprobe.mjs precedent) + Surge corridor glare check + the 8/8
  overdraw recount.
- **I5 — the HOLLOWING ladder.** `forms[]` (accretive, length 4) + the starters.mjs block (§B.8) +
  tricount ladder + full §8-protocol capture set (all forms, all states, 3 backdrops) + the roster
  trio/neighbor frames. Gate: full-ladder verdict; then the PR preview carries the §B.9 residuals to
  the human.

Each gate is a FRESH high-effort Fable spawn judging captures against THIS sheet (precedence rule);
FAIL → numbered directives applied verbatim; the builder never judges its own output.

### §B.8 `tests/starters.mjs` SPEC — the `revenant` 4-form block (mirrors the Solar/Molten premium blocks at starters.mjs:281/:326 — code-truth note: those two are the in-repo premium precedent; the Vesper-sheet changelog's claimed block is not present in tests/)

Headless via `buildDragonModel` + `ascendedDef(def, t)` for t = 0..3; silhouette asserts import
`renderSilhouette` + the new `holeMetric` from `../tools/silhouetteCore.mjs`, rendered 2× (subject
≈500px) so the px-floors are alias-safe; floors below are stated at the normalized 250px chase read.
- `maxTierFor('revenant') === 3`; forms accretive length 4; contract fields untouched.
- **Tris:** monotonic ↑ across 4 forms, each within ±20% of {1.7k, 2.5k, 3.5k, 4.7k}, all <6000
  (`tricount --ci` stays the hard gate).
- **HOLLOWING:** side-view hole-fraction per form ∈ {0, .08, .16, .26}±0.03 AND strictly ↑ from f1;
  hole COUNT ↑; outline = exactly ONE connected fill component at every form; every hole min-dimension
  ≥8px (rib/bay) or ≥3px (tail slivers, else merged) at the 250px normalization; planform
  (`top`, wings-only) through-gap fraction ↑ and f3 ∈ [0.30, 0.42], each bay hole ≥0.05 planform.
- **BLEACHING:** resolved `def.body` luminance strictly INCREASING across forms (the roster's second
  value-invert assert — the mirror of Vesper's decreasing one); hue of the ramp held (Δhue ≤8°).
- **Pearl firewall:** every diffuse material sat ≤0.12 on the body-bone family; ZERO gold-family
  diffuse (hue 35–50° ∧ sat >0.2 → fail) anywhere; zero warm emissive (hue <90° or >330° at
  intensity >ε → fail).
- **Lantern law (cruise-emissive inventory, by contribution):** with the surge state OFF, summed
  emissive luminance = the grave-light family + pinpoints only; the HEART ≥70% of total, pinpoints +
  gap plugs + crack ≤30%, every OTHER material ≤ε — and an inventory assert that no `boneRidge/
  boneFlank/recess/shroud` mat has emissive ≠ 0x000000 (no lit exterior bone, machine-checked).
- **Fever firewall:** simulate the surge-tick values — all fever-state emissive hues (feverWing off at
  0x000000 excepted) ∈ 118°±20; `surgeHi/feverEye/trail/boostTrail` hues asserted from the def.
- **Ladder dials:** `ribWindows` {0,2,4,6} exact · `coreBlaze/socketVent/litGaps/crescentDepth/
  wispLen/glowLevel` monotonic ↑ · vertebra totals {20,22,23,26} ↑ · socket:skull ↓ {34,28,22,18}%±3.
- **Wing law:** finger count {2,3,4,4}; `parts.wingElements` lengths non-equal with dominant decay
  (each ≤0.86× the previous); elbow angle ≥20°; finger tip taper ≤0.15× base; tail-chain tip ≤0.20×
  (≥0.08 floor); span:body per-form band ±10%, ↑, apex ≤2.5.
- **Rig contract:** `wingPivot/Mid/TipL/R` exist; fold pose contracts measured span ≤0.60 of glide;
  wingsym Δ0.000 (`tools/wingsymprobe.mjs`); tail publishes 4 isBone-rooted joints; motif anchor
  drift ≤0.15 in pre-scale local space; motif bloom radius ↑.
- **Line of action:** `spinePoints` ≥2 inflections at every form (the hunting stoop).
- **Firewall imports:** `dragonRevenant.js` source contains no `dragonOrganism|dragonNightFury|
  dragonUnifiedHull|growSkinnedExtension|sweepProfileSmooth` (the Vesper no-organism assert pattern).

### §B.9 Verification harness checklist + gate-blind residuals

Per DRAGON-DESIGN §8 (the harness) + §9 (session law), run per increment and in full at I5:
1. Suites green: `node tests/blueprint.mjs` · `node tools/tricount.mjs --ci` (FULL roster, not just
   `revenant`) · `node tests/starters.mjs` · `node tools/creaturestress.mjs --ci` (co-resident draws).
2. Studio: `node tools/dragonstudio.mjs revenant` — all 4 forms (maxTierFor-clamped), states
   glide/fold/bank/surge via `setFlapDebugPose`, fixed angles (rear chase / side / rear-¾ / top
   planform), DETERMINISTIC phase (+ the gap-pulse ω pinned), three backdrops — the PALE backdrop is
   the primary silhouette judge AND the ivory-on-bright-sky risk frame; the warm-gold backdrop is the
   Pearl-firewall stress frame (L140).
3. Black fills: `tools/silhouette.mjs revenant side|rear|top [form] --holes` (+ `--wings-only` for the
   gap band) — the hole-metric numbers ride every gate round.
4. Motion strips: `tools/flapstrip.mjs` 5-phase corridor check (±10° empty at ALL phases + folded);
   `tools/wingsymprobe.mjs` Δ0.000; the two-state cruise/surge pair (seamprobe pattern) proving the
   lantern floor vs the Haunting.
5. In-game: `tools/gameshots.mjs` (`?cleanshot`) — chase idle, mid-bank, tier-up reveal ONLY;
   integration judgment (biome-sky legibility), never aesthetics.
6. Gate calibration verdicts recorded on the PR (I0); fresh Fable gate per round; verdicts quoted
   verbatim; MARROWCOIL consolidation after ~4 churn rounds.

**Named gate-blind residuals (the human judges these on the PR preview — the gate cannot):**
- The SNAP beat: does glidePow 1.6 + tipLag 1.2 read as the dry raptor-strike + skeletal rattle, or
  does it need the optional `downFrac` poser easing (§B.6 W6)?
- Open-cage legibility at gameplay distance — if the apex reads solid, bump hole-fraction +0.02 (§12).
- TONE — haunted vs gruesome (owner call #3); the whimsy check in a pastel-leaning game.
- Ivory-on-bright-sky presence (the inverse of Vesper's dark-shop problem).
- The gap-pulse dance: speed ω and whether it reads necromantic or blinky (fallback: static swell).
- The wisp tip in MOTION (length/ghostliness while the tail whips) + Surge wisp count 2 vs 3 on the
  perf HUD (owner call #5, default 2 per the §B.4c budget).
- `clickStep` bone-rattle quantize (owner call #4 — deferred, default-off).

## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh bone-wraith GRAVELIGHT REVENANT — identity
  HAUNTED (a lantern, not a lamp); hero = THE PHALANX SHROUD (bone-finger fan, designed crescent
  through-gaps 0.30–0.42 sanctioned); motif = THE GRAVE HEART (caged interior core, seen only
  through apertures; dorsal spine-leak as the rear-chase carrier); the HOLLOWING ladder (rib
  windows 0→6, hole-fraction 0→0.26, asserted headless via the new silhouette hole-metric) + the
  BLEACHING value ramp (the roster's second value-invert, mirroring Vesper). Next: stub + Pearl/
  Phoenix gate calibration, then vertebra beam → cage + core → phalanx wing → skull, per-increment
  Fable gates.
- **v1 (§B — BUILD-READY sheet; Fable design-director + feasibility audit, 2026-07-13).** The owner
  chose the Revenant FIRST of the Fresh Five. §B grounds the anatomy in the shipped-undead research
  DNA (dracolich per-vertebra articulation + dancing bone-seam glow → the `vertebraUnit` +
  gap-pulse; Durnehviir neural spines + grey-green rot → per-vertebra blades + the umber-green
  `0x464b3d` recess tier; Dragapult ethereal tail → the single-layer spectral wisp tip) and audits
  every element to a CITED engine path (mostly `dragonVesper.js` patterns + the real `dragon.js`
  hooks: the coreGlow opacity tick, the flareMats-not-spineMats warm-rim dodge, the full
  fever-override table against the magenta/white-gold defaults). Honest substitutions recorded:
  `downFrac` and per-finger micro-lag have NO rig hook (glidePow+tipLag carry the SNAP; finger lag
  cut), `clickStep` deferred default-off, Surge wisps default 2 (the 8/8 overdraw census). Overdraw
  counted: cruise 5/5 transparent (2 hems + heart + wisp + trail), ≤2 alpha layers on any chase ray.
  Increment plan I0–I5 (stub+hole-metric+calibration → torso+heart → phalanx wing → skull+tail →
  Haunting → ladder), each behind a fresh Fable gate. Next: cut the build branch and run I0.
