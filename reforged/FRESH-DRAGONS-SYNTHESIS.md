# THE FRESH FIVE — Premium Dragon Synthesis & Index (Fable design-director pass)

The synthesis plan for **5 fresh premium dragons**, each genuinely new to the roster, each maximally
distinct from the others AND from every shipped lane. This doc is the index + the master
anti-collision proof + the build order; each dragon's full contract lives in its own build sheet:

| # | Dragon | One-line identity | Build sheet |
|---|---|---|---|
| 1 | **Thunderhead Tempest** | a living thundercloud whose near-white lightning is intermittently LIVE — spectacle building | `TEMPEST-THUNDERHEAD-BUILDSHEET.md` |
| 2 | **Belladonna Stiletto** | a four-winged wasp-wyrm whose translucent sacs visibly FILL with UV-orchid venom | `VENOM-BELLADONNA-BUILDSHEET.md` |
| 3 | **Aurora Sylph** | a polar ribbon-serpent wearing a rippling pleated aurora curtain instead of wings | `AURORA-SYLPH-BUILDSHEET.md` |
| 4 | **Gravelight Revenant** | a hollow bone-dragon lit from inside by a caged grave-green ghost-fire | `WRAITH-GRAVELIGHT-BUILDSHEET.md` |
| 5 | **Crimson Tocsin** | a bronze chime-drake that pulses expanding crimson shockwave rings on the wingbeat | `RESONANCE-TOCSIN-BUILDSHEET.md` |

All five honor the mandate's hard exclusions (no fire/water/earth, no phoenix/rebirth, no
solar/sun/eclipse, no vesper/night-glass/stealth-black) and were designed against the code-truth
roster in `js/dragons.js` + the METHOD in `DRAGON-DESIGN.md` + the 9-field contract in
`PREMIUM-BUILDSHEET-RESEARCH.md` §3.

## 0. Prior art — every concept is PROVEN in a shipped game (owner requirement)

The mandate requires each concept to be validated by prior use — a dragon TYPE another game already
shipped, so we know the archetype has audience appeal before we build it. Each of the five takes a
battle-tested lane and contributes a fresh silhouette / motif / spectacle, never a copy:

| Dragon | Lane (archetype) | Proven in (shipped games) | What we add that's new |
|---|---|---|---|
| **Thunderhead Tempest** | storm / lightning dragon | MH *Kushala Daora* & *Amatsu*; Genshin *Dvalin "Stormterror"*; Pokémon *Zekrom* / *Rayquaza* | stacked strata-deck wing + intermittently-live charge |
| **Belladonna Stiletto** | poison / venom (insectoid) dragon | Pokémon *Naganadel* (luminescent wasp-venom) & *Dragalge* | UV-orchid hue + the diegetic venom fill-meter |
| **Aurora Sylph** | celestial / aurora / worn-light dragon | LoL *Aurelion Sol* (star-lit cosmic dragon); East-Asian ribbon-serpent (Genshin, P&D) | polar-aurora curtain as a no-membrane wing |
| **Gravelight Revenant** | undead / skeletal / dracolich | Skyrim *Durnehviir*; GW2 *Zhaitan*; Pokémon *Dragapult*; D&D dracolich | true negative-space hollow cage + bleaching invert |
| **Crimson Tocsin** | sound / resonance dragon | Pokémon *Kommo-o* (percussion chime-scales) | expanding shockwave rings that escape the silhouette |

So distinctiveness is two-sided: the LANE is validated by a shipped game (this section), and the
EXECUTION is proven-distinct from our own roster (the §2 anti-collision matrix). Each build sheet
carries its own "Prior art" block with the specific precedent.

---

## 1. Design thesis

**Five new VERBS, five new physics.** The shipped premium bar (Solar / Phoenix / Vesper) already
owns regalia, fire, and withholding — the three classic spectacle modes. The Fresh Five each claim
a spectacle mode the roster has never used, so distinctiveness is structural, not cosmetic:

- **Tempest owns TIME** — the first intermittent spectacle (strike windows you wait for).
- **Stiletto owns VOLUME** — the first diegetic power meter (a liquid fill line).
- **Sylph owns FLOW** — the first fluid-simulation read (a rippling worn-light curtain, no wings).
- **Revenant owns VOID** — the first negative-space silhouette (light through a body that isn't there).
- **Tocsin owns RHYTHM** — the first beat-synced spectacle that escapes the silhouette (expanding rings).

Second structural rule: **the hue budget was allocated globally before any sheet was written.** The
roster's taken emissive lanes are 24°/27° (magma/lava), 39° (gold, diffuse), 80° (acid eyes), 149°
(mint), 205° (ice), 223° (ion), 262° (violet), warm-gold, holy-white-diffuse. The five clean free
arcs — ~118°, ~176°, ~292°, ~354°, and the near-white VALUE lane — were assigned one per dragon,
with every pairwise margin ≥27° (one sanctioned hem exception, noted in §2). This is also why the
venom dragon is **UV-orchid, not chartreuse** (the mandate's default sat within ~20–25° of Vesper's
acid-green eyes — a bloom collision; the swap is flagged per the mandate's rules and gives the
roster its first magenta-family dragon).

Third rule: **every sheet pre-solves its overdraw story** (§6b p95 law): Tempest's decks are opaque
(slits, not translucency); Stiletto's venom is an opaque fill mesh behind a single-layer sac wall;
Sylph's curtain is ONE translucent sheet total; Revenant's void is free fill; Tocsin's rings are
dial-capped at 2 concurrent.

## 2. The MASTER anti-collision matrix (roster rows + the Fresh Five)

No two dragons share more than one cell in any column pair. Shipped rows first (from the mandate +
code truth), Fresh Five below the rule.

| Dragon | Palette / tone lane | Silhouette region | Motif | Growth verb | Wing architecture |
|---|---|---|---|---|---|
| Azure Drake | powder/water blue, soft (+diffuse gold tips) | compact falcon comb | ice seam (diffuse) | — | falcon blade-feather primaries |
| Ember Wyrm | bold flame orange + cream | anvil shoulders | forge collar | — | gapped ember membrane |
| Jade Serpent | vivid mint/emerald | serpentine (lateral koi) | chin pearl + mint rim | — | silk fin-fan lobes |
| Pearl Seraph | holy white + gold, satin | forward halo-knight | crown-halo | — | up-raised feather-scale cards |
| Solar Sovereign | cool indigo/violet + antique gold | top-heavy crown | ring + gem (static, worn) | coronation | faceted vault-bays + gold lances |
| Nightglass Vesper | matte blue-black L≤0.10 + acid eyes + withheld ion 223° | lateral spread | inset starlit seam (withheld) | knapping | knapped scallop crescent, knife-edge |
| Phoenix line | warm gold/crimson flame | bottom-heavy train | coal arc / heart-fire | rebirth | feather ranks (rake/M) |
| Molten Phoenix | magma orange-red-black | — | magma seams + caldera heart | — | pyre fans |
| Aurum Toro | metallic giallo gold, gloss | bull-crown mecha | thrusters/tail-lights | — | svj blade panels |
| Astral Wyrm | crystal + energy bands | serpentine (crystal) | energy bands | — | flat astral vanes |
| **Thunderhead Tempest** | **charcoal slate L0.20–0.26 + near-white 255°/sat.09** | **forward-high strata wall** | **branching arc-tree, INTERMITTENT-live** | **charging** | **3 stacked opaque strata decks, slit gaps** |
| **Belladonna Stiletto** | **gloss oil-slick violet-black + UV-orchid 292°** | **pinched-waist cruciform + rear needle** | **translucent sacs that FILL (always-on)** | **brewing** | **FOUR gossamer veined blades (2 pairs)** |
| **Aurora Sylph** | **deep polar indigo + teal 176° (+rose hem 325°, f2+)** | **serpentine PENNANT (vertical sky-swim)** | **flowing 2-stop gradient curtain** | **unfurling** | **pleated dorsal light-curtain + streamers (no membrane)** |
| **Gravelight Revenant** | **matte chalk ivory (value ↑!) + gravefire 118°** | **latticed hollow (pierced mid-body)** | **caged INTERIOR core, seen through apertures** | **hollowing** | **bone-finger fan + shroud remnants, through-gaps** |
| **Crimson Tocsin** | **dark umber-bronze + diffuse verdigris + crimson 354°** | **low pagoda mantle + gong tail** | **EXPANDING shockwave rings (kinetic)** | **tuning** | **4 rigid gong discs + hanging chime-rod fringe** |

**Watched near-cells (each held to ≤1 by a named separator, recorded here so no future chat
re-litigates):**
- *Sylph vs Jade* — both serpentine (1 cell). Separators locked structurally: indigo vs green;
  teardrop H:W ≥1.3 vs koi W>H (asserted); VERTICAL wave vs lateral (a new `bodyWaveAxis` dial);
  curtain vs fin-fans.
- *Stiletto vs Vesper* — both near-black (arguably 1 cell). Separators: violet 270° vs blue 225°
  hue family; GLOSS oil-slick vs matte; always-lit vessel vs withheld seam; four blades vs one
  crescent; cruciform-waist vs lateral spread.
- *Tempest vs Vesper* — both dark-cool. Separators as sheet LAWS: body L 0.20–0.26 (2× Vesper),
  near-white intermittent vs ion-blue Surge-only, deck stack vs crescent.
- *Revenant vs Pearl* — both light bodies. Separators: matte chalk sat ≤0.12 (asserted) vs satin
  pearl+gold; skeleton cage vs armored paladin; green interior fire vs white-gold surface light.
- *Tocsin vs Pearl/Solar/Aurum* — plate/metal family. Separators: 4 rigid disc-coins LOW+level +
  rod fringe vs 15 up-raised leaf-cards (Pearl); no lances/vaults (Solar); dark antique + crimson
  ring vs giallo gloss + tail-light seams (Aurum — the crimson/red adjacency is a flagged PR
  residual). Tocsin's KINETIC expanding ring vs Solar's STATIC worn ring — different object class.
- *Sylph rose hem 325° vs Stiletto 292° vs Tocsin 354°* — 33°/29° margins, and the hem is f2+,
  ≤15% of curtain height (sheet-sanctioned second stop).

**Failure-mode coverage:** all 13 §8 failure classes are killed by construction in every sheet
(each sheet names its kills; the novel ones: Revenant sanctions a designed through-gap band
0.30–0.42 with clean crescent edges — the anti-MITTEN inverted; Tocsin's disc taper-exemption
rides its rods/horns/tail instead; Tempest/Stiletto pin their strike/drip timers deterministically
so no capture is non-comparable).

## 2b. REAR-CHASE SILHOUETTE VARIANCE (Opus harsh-gate pass, 2026-07-13)

The owner's spine directive: ~95% of play is the dragon seen from BEHIND as a small, often-backlit
black-fill. The five were re-judged as a SET — line up their rear black-fills side by side. Verdict:
**mutually distinct after the revisions below.** One-word rear reads, deliberately spread across shape
families:

| Dragon | Rear one-word | Rear black-fill (what the outline IS) | Shape family |
|---|---|---|---|
| Thunderhead Tempest | **STACK** | forward-HIGH horizontal stripe-slab stack, tapering anvil, wispy virga fringe | horizontal stratification |
| Crimson Tocsin | **COINS** | LOW-flat row of round overlapping disc-coins, rigid straight rod comb below | round-coin row |
| Aurora Sylph | **HOOD** | thin serpent under a BROAD flared luminous crescent (hood), swept streamers | soft flared light-crescent |
| Belladonna Stiletto | **WASP** | four distinct blade-spokes in a shallow X off a solid dart-core, central needle | four-blade X + needle |
| Gravelight Revenant | **SKELETON** | draconic wing outline pierced by clean crescent through-holes; void reads | negative space |

**Closest pair (and the separation):** **Tempest ↔ Tocsin** — both are broad wings with a bottom
fringe, the one genuine near-collision in the set. Separated on THREE axes, written into both sheets
(Tempest §R2.3 / Tocsin §R2.3): (1) ATTITUDE — Tempest stacks UP forward-high (+6°/deck) vs Tocsin held
LOW and flat; (2) INNER GRAIN — horizontal STRIPE-slabs vs round CIRCLE-coins; (3) FRINGE — Tempest's
WISPY TAPERING virga vs Tocsin's RIGID STRAIGHT equal rods. No other pair is close: Sylph (soft vertical
hood), Stiletto (four-blade X + needle) and Revenant (holes) are each in a unique shape family.

**The one structural rescue (no concept swap):** the harsh gate ruled Aurora Sylph's v0 curtain a
near-VETO — a purely dorsal-vertical sheet is EDGE-ON from dead astern and collapses to a line (the #1
"flat plane/kite" failure mode). It was NOT swapped; the concept (Aurelion-Sol worn-light lane) is
intact and the sheet re-architects the curtain into a FLARED DORSAL HOOD (pleats cant outboard
±10°→±35°, hood width ≥1.1× body girth) + promoted span-carrier streamers, so the rear read is now a
broad luminous crescent while staying ONE translucent layer. See Sylph §R2. All five otherwise keep
their proven-in-shipped-games lanes (§0) — no lane changes.

## 3. One-paragraph summaries

**1 · THUNDERHEAD TEMPEST — "The gathering storm" (SSR→SSSR, 2600).** A living thundercloud drake:
billowed charcoal cloud-masses (L 0.20–0.26 — charcoal, never Vesper-black) with diffuse
silver-lining rims, whose hero wing is the roster's only STACKED silhouette — three opaque strata
decks per side (dominant-bottom ×0.8 decay, true slit gaps, per-deck 0.12 phase-lag churn). The
motif is the STORM CIRCUIT: a branching near-white (`0xd9deff`, the unowned near-white emissive
lane) arc-tree anchored at a sternum storm-heart, INTERMITTENTLY LIVE in cruise on a deterministic
strike timer (duty 0.06→0.18 up the CHARGING ladder) — the deliberate midpoint between Solar's
always-on and Vesper's withheld. Span 1.7→2.6×, tris 1.9/2.8/3.9/5.2k, fold ≤0.66. It beats its
nearest neighbor (Vesper) by being spectacle-BUILDING where Vesper is spectacle-withheld: rhythm
and threat instead of restraint.

**2 · BELLADONNA STILETTO — "Venom, patiently brewed" (SSR→SSSR, 2400).** An insectoid wasp-wyrm in
gloss oil-slick violet-black chitin: armored thorax, the roster's only concave silhouette break (a
wasp waist tightening 0.50→0.34), a four-segment gaster with translucent sac windows, and a needle
stinger presented dead-center at the chase lens. Hero: the GOSSAMER DOUBLET — the roster's first
FOUR wings (fore + hind pairs, hind at 0.62× and 0.35 beat-phase offset via a new nullable
aux-pivot rig hook), veined glass blades with insect cells and a pterostigma. Motif: the VENOM
STILL — sacs that visibly FILL with UV-orchid (`0xd936ff`, 292° — deliberately swapped off the
mandate's chartreuse, which collided with Vesper's 80° acid eyes) from 0.05→1.0 up the BREWING
ladder, plus a drip bead from f2. Span 1.5→2.2×, tris 1.5/2.2/3.2/4.4k, the roster's deepest fold
(≤0.58). It beats Vesper on hue freshness (first magenta-family) and beats everything on
storytelling density: the fill line is a diegetic power meter.

**3 · AURORA SYLPH — "The sky, unfurled" (SSR→SSSR, 2800).** A polar ribbon-serpent — the roster's
longest creature (apex body ≥1.4× Jade's) on a deep-indigo hide with a teardrop H>W cross-section
and a VERTICAL travelling wave (both structural anti-Jade locks, asserted). Its "wings" are the
roster's only no-membrane architecture: one continuous pleated aurora CURTAIN (7 swell-taper
pleats, single translucent layer, emissive-in-fragment) rippling along the spine on a CPU wave,
plus 1→3 opaque streamer pairs that carry the fold contraction (≤0.62). Motif: the POLAR CROWN —
the occiput-anchored two-stop gradient (polar teal `0x38e8dc` 176°, the one clean teal gap; a
sheet-sanctioned rose hem `0xf868c8` arriving f2+) that UNFURLS 0.25→1.0 of the spine. Zero body
emissive — the light is worn, not embodied. Span 1.6× (Jade-clause sanctioned), tris
1.8/2.7/3.8/5.0k. It beats Jade and Astral on every structural axis and beats the whole roster on
grace: the only dragon whose hero read is fluid motion.

**4 · GRAVELIGHT REVENANT — "Nothing stays buried" (SSR→SSSR, 2400).** A skeletal ghost-dragon and
the roster's first negative-space silhouette: a matte-chalk bone assembly (vertebra beam, rib
hoops, scapular cowls) whose mid-body is an OPEN CAGE with a grave-green (`0x54f04e`, 118°)
ghost-fire lantern burning visibly through it — the fire is interior-only, never painted on bone.
Hero: the PHALANX SHROUD — bone-finger wings (dominant-plus-decay fingers with joint knuckles)
carrying wind-torn shroud panels only across the outer bays, designed crescent through-gaps
(sanctioned band 0.30–0.42 of planform) making it the only wing that is mostly sky. The HOLLOWING
ladder opens the cage (rib windows 0→6, hole-fraction 0→0.26, asserted headless via a new
silhouette hole-metric) while the bone BLEACHES (body value monotonic UP — the mirror of Vesper's
darkening; the two inverts now bracket the roster). Span 1.6→2.4×, tris 1.7/2.5/3.5/4.7k, fold
≤0.60 (the holes vanish when folded — a real transformation). It beats Pearl/Phoenix on construction
novelty: "how is it flying?" is the screenshot trigger.

**5 · CRIMSON TOCSIN — "Struck, it answers" (SSR→SSSR, 3000).** A heavy bronze chime-drake: a
bell-barrel body under three pagoda plate-mantles (dark umber-bronze + diffuse verdigris rims —
the anti-Aurum antique), wings of four cupped GONG DISCS (dominant-disc ×0.8 decay, staggered
coins, never a fused shield) trailing hanging chime-ROD fringes (straight taut rods vs round discs
— the curve-vs-straight law embodied), a tail ending in a canted tail-gong. Motif: the RESONANT
ANNULUS — expanding crimson (`0xff3348`, 354°, rose-side of red, 30° clear of every flame dragon)
shockwave rings born at the sternum strike-gong ON the downstroke beat (≤2 concurrent, pooled,
deterministic pulse clock), the only roster spectacle that escapes the silhouette — which is also
how a chest anchor satisfies rear-chase primacy. TUNING ladder: mantles/discs/ringStage/rods
monotonic; span 1.5→2.0×, tris 2.0/2.9/4.0/5.4k. It beats Solar's static ring by being kinetic and
beats everything on game-feel: the one dragon you can hear with your eyes.

## 4. Recommended BUILD ORDER (strict queue, one merged PR before the next branch cuts)

**Tempest → Revenant → Stiletto → Tocsin → Sylph.**

1. **Thunderhead Tempest** — closest to proven patterns (Vesper's assembly + inset-seam kit; the
   CP1 fingered-slab recipe per deck), so the first slot is the safest; it LANDS the shared engine
   tranche the queue needs: `js/pulseTimer.js` (the deterministic seeded pulse/strike scheduler)
   + the pinned-capture flag for timed spectacle (`?strikePin`-style passthrough).
2. **Gravelight Revenant** — the biggest structural bet (negative space) goes second, while the
   queue still has slack to absorb a redesign round; it lands the silhouette HOLE-METRIC on
   `silhouetteCore.mjs` (retro-useful as a MITTEN detector for every future wing). No rig changes
   needed — pure builder + tooling.
3. **Belladonna Stiletto** — carries the one true RIG extension (the nullable `parts.auxWingPivots`
   hook for the hind pair); mid-queue is the right slot for engine surgery: two premium builds of
   recent experience behind it, two ahead to amortize the hook.
4. **Crimson Tocsin** — reuses Tempest's pulseTimer for the ring clock and the by-then-mature
   plate/merge patterns; its heavy tri budget (5.4k apex) benefits from the perf HUD evidence the
   first three slots accumulate.
5. **Aurora Sylph** — last on purpose: the riskiest fill-rate story (the big translucent curtain)
   ships after the queue has fresh p95 data from four launches; it needs the `bodyWaveAxis` dial
   (touches the shared bodyWave ticker Jade rides — do it with maximum accumulated care); and
   shop cadence spaces the three cool-toned premiums (Tempest #1, Sylph #5) apart.

Shop-cadence bonus: the queue alternates spectacle modes (time → void → volume → rhythm → flow)
and palette temperature (grey-white → ivory-green → violet-magenta → bronze-crimson → indigo-teal)
so consecutive launches never feel adjacent.

## 5. Shared open owner calls (per-dragon calls live on each sheet)

1. **Keys + costs** — working keys `tempest / stiletto / sylph / revenant / tocsin`; proposed costs
   2600 / 2400 / 2800 / 2400 / 3000 (all SSR→SSSR, between Vesper 2200 and Pearl 3400). Owner may
   re-slot; keys are contract once shipped.
2. **The aux-pivot rig hook** (Stiletto's four wings) — the one shared-rig extension in the plan;
   approve scope before slot 3 branches (it is nullable/additive; roster byte-identical without it).
3. **Photosensitivity ceiling** (Tempest strikes ≤3 Hz, Tocsin ring cadence) — a policy call once,
   applied to both timed-spectacle dragons.
4. **Tone check** — Revenant (skeleton) and Stiletto (venom drip) push the roster's tone envelope;
   both sheets hold "elegant, never gore" laws, but the call is the owner's on the first PR preview.
5. **Cool-shelf crowding** — Tempest/Sylph join Vesper/Azure/Solar on the cool shelf; the build
   order spaces them, but the shop-row layout is an owner call at Sylph's launch.
6. **Audio tie-ins** (Tocsin chime, Tempest thunder) — cross-discipline, default OFF in v0 sheets.

## 6. Verification contract (uniform across the five)

Every sheet ships with: a 4-form `tests/starters.mjs` SPEC (per-form bands ±10–20%, monotonic tris
< 6000, the bespoke growth-verb assert — arcDuty ↑ / sacFill ↑ + waistPinch ↓ / curtainRun ↑ /
hole-fraction ↑ + value ↑ / ringStage ↑), deterministic seeded timers for every timed element (so
gate rounds are pixel-comparable), the no-organism-import firewall, accent-hue ±20° checks (with
named sanctioned exceptions: Tempest's near-white passes by sat ≤0.12; Sylph's rose hem is
coverage-capped), fold-contraction asserts (0.58–0.66 per sheet), and the standing Fable-gate
protocol with per-dragon calibration tiles named in each §12. The human judges motion/feel and
tone on the PR preview — every sheet lists its gate-blind residuals.
