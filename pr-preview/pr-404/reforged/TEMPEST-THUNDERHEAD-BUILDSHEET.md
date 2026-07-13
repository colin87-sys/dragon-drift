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

## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh storm drake THUNDERHEAD TEMPEST — identity IMMINENT
  (the gathering storm); hero = THE STRATA STORM-FRONT (triple-deck slab stack, opaque, slit gaps);
  motif = THE STORM CIRCUIT (branching near-white arc-tree, intermittently live, deterministic timer);
  the CHARGING ladder. Three hard separators from Vesper baked as laws. Next: `tempest` stub + gate
  calibration, then torso → decks → circuit behind nullable dials, per-increment Fable gates.
