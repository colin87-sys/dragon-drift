# THUNDERHEAD TEMPEST — "The gathering storm" · Premium Build Sheet (fresh storm drake)

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
