# PHOENIX EVERFLAME — BUILD SHEET v1 (from the owner's fire-body references, 2026-07-10)

**Identity:** *She is not a thing that burns — she IS a flame that flies.* A bright **fire-body**
phoenix: the creature is luminous from head to tail, feathered in tongues of living fire, streaming
flame off wind-blown wings. This is the exact INVERSION of the Molten Phoenix (which is dark cooled
crust with fire hidden in the seams). Here **fire is the body**, and dark lives only on the thin rims.

> This sheet was authored from four owner reference images (bright flame-feather phoenixes — a gold
> symmetric fire-bird on black, a white-hot streaming-winged phoenix, a saturated-red banner phoenix,
> and a bronze painterly phoenix with fire-ribbon tail) and was book-ended by two high-effort Fable
> audits: a PRE-build design assessment (which produced §1–§8 below) and a POST-build fidelity +
> no-leak audit. Build BRIGHT-FIRST.

---

## ⬛ COPY-PASTE THIS PROMPT INTO A FRESH CHAT TO BUILD HER

```
Build the Phoenix Everflame — a premium Eternal-tier BRIGHT fire-body dragon for Dragon Drift.

First read, in order, all under the repo:
  1. CLAUDE.md, then LEAPFROG.md + skim leapfrog/lessons/ (newest first).
  2. reforged/PREMIUM-DRAGON-METHOD.md — the SSSR playbook (process, the failure-mode FIREWALL,
     the spectacle triad, the high-effort Fable-gate discipline).
  3. reforged/PHOENIX-EVERFLAME-BUILDSHEET.md — THIS is your audited source of truth. Follow it.
  4. reforged/PHOENIX-MOLTEN-BUILDSHEET.md — read ONLY for the engine laws to carry forward (THE
     VISIBILITY LAW §4, the framecap gates, the rig contracts). Its LOOK (dark caldera crust,
     obsidian mask, pyre-fan) is the thing you must INVERT and never leak.
  5. reforged/js/dragonPhoenixMolten.js + dragonSovereign.js — the nearest-neighbor builders. COPY
     the CODE PLUMBING (the stage-aware material-factory STRUCTURE, loftRings/flatTriMesh helpers,
     the exported wing-profile pattern, the rig/attach contracts, the test probes). Author every
     LOOK fresh — reusing any shape/palette/motif from them is a leak.

Context you need up front:
  • MOLTEN vs EVERFLAME. The Molten Phoenix is DARK (crust body, fire in the cracks, a cool obsidian
    head). Everflame is its INVERSE: a LIGHT body — the FLARE system, "light field, dark on the
    rims" (§1). If you feel the dark-crust caldera creeping back in, stop and say so.
  • FIRE IS THE BODY, built from OPAQUE flat-shaded facets + SATURATED bloom-safe emissive — NEVER
    additive/transparent washout shells (that is the "tacky" look). Feathers read as FLAME by SHAPE
    + heat gradient (S-tapered tongues, root-hot/tip-cool, gaps between them), not by translucency.
  • THE VISIBILITY LAW is non-negotiable: rear-chase cam looks forward-down; the course lives in
    center + lower-center; the dragon must be COMPACT and must NOT park mass in the lower-center
    corridor { y<spine, z>hip } (corridor max|x|≤0.6, footprint≤1.3). Bright is LESS fatal than dark
    (an effect, not a hole) but bright ≠ license for SIZE. The streaming fire lives in the WINGS
    raked AFT-AND-UP (toward the empty upper corners), and the tail is sparse LUMINOUS points — never
    an opaque sheet in the playfield. Judge in the REAL chase cam (tools/framecap.mjs), not the
    studio void (that meta-lesson killed four prior rebuilds).
  • NO LEAK. Author fresh: do NOT reconstruct the Molten Phoenix's crust-shards / obsidian mask /
    pyre-fan wings / molten-heart caldera / ember-whip tail; the retired coal empress's pyre-train /
    scythe wings / comet crest; the shipped Phoenix Ascendant's solid feather wing / flame-plume /
    beaked head (do NOT ship "the shipped phoenix but oranger"); Solar's eclipse ring / cathedral-M /
    lance-vault; or Seraph/Pearl's crown-halo / feather-scales / comet tail. §8 is the leak map.

Process (follow the method + this sheet):
  1. Coexist → prove on the apex → migrate. Build as a NEW roster key `phoenixEverflame` alongside
    the shipped roster; NEVER break the shipped dragons. Start from latest master, new branch.
  2. Build the APEX (f3 "The Everflame") FIRST and gate it to PASS, then subtract down the ladder (§5).
  3. Spawn a high-effort Fable design director to sequence the build from this sheet.
  4. At each checkpoint (CP1 flare body → CP2 flare-cascade wings → CP3 tail/head/ladder/polish),
    spawn a HARSH high-effort Fable critic to judge from multiple views + lighting (dark sky / pale
    sky / gold sky / the REAL chase cam via framecap), including a Surge/Flashover framecap. Hand it
    comparison tiles and the standing vetoes in §7. Don't bug the owner until it's genuinely good.
  5. Verify by failure-class before claiming: node tools/tricount.mjs --ci · node tests/starters.mjs
    (add the premium's own ladder block + the corridor asserts + a NaN-vertex guard) · node
    tests/blueprint.mjs · node tests/smoke.mjs · node tools/wingsymprobe.mjs phoenixEverflame ·
    node tools/dragonstudio.mjs phoenixEverflame r0 · node tools/framecap.mjs phoenixEverflame
    Add a lesson file per meaningful change (leapfrog/lessons/<date>-<slug>.md). Update defs.mjs
    (SSSR count +1, unique lanceTint/lanceRune) + re-stamp the SW precache (tools/stamp-sw.mjs).
    Roster def: mirror the phoenixMolten def SCAFFOLD (rarity/maxRarity SSSR, cost 6000, stats
    {speed 1.14, handling 1.27, drain 0.70, regen 1.35}, hasStyle:true, archetype:'phoenix' as a RIG
    flag ONLY — it supplies the warm ember-mote WAKE + Rebirth fire-trails the references show;
    explicit `parts` override the recipe), with its OWN accentHue/feverWing/feverWash in the F1–F2
    goldfire band.
  6. The human judges MOTION/FEEL on the PR preview. Surface the ONE load-bearing decision (§B: the
    swept-cascade WING as hero over a symmetric frontal spread) before freezing anything downstream.

Ship a draft PR with a flyable preview link.
```

---

## §B THE ONE LOAD-BEARING DECISION (surface to the owner before freezing)
**HERO = the SWEPT FLAME-CASCADE WING** — streaming fire lives in the WINGS, raked aft-and-up (as if
her own speed blows her fire back toward the camera's upper corners); the tail is DEMOTED to sparse
twin spark-ribbons. This is the choice everything else hangs on. It beats the two alternatives on
every axis: a hero streaming-fire TAIL is cornered three ways (the Visibility Law forbids lower-centre
mass, the retired coal empress already spent the bottom-heavy "pyre-train" region, and the Molten
Phoenix already owns an ember-whip tail); a hero white-hot HEART-CORE is a direct leak of the molten
caldera. The wing-spread is the largest rear-chase surface, is where all four references put their
spectacle, can be built genuinely fresh (tongues + gaps ≠ pyre-fan shingles ≠ solid feathers ≠
Seraph scales), and its aft-up rake gets MORE visible in the chase cam while CLEARING the corridor.
*What the owner is deciding: streaming swept-cascade wings (refs 1+4 energy) over a symmetric frontal
bonfire-spread (refs 2+3 pose). Ref 2 still governs material/value regardless.*

## SETTLED — do NOT re-litigate (distinctiveness housekeeping)
- **Silhouette REGIONS already spent by the roster:** top-heavy (Solar), bottom-heavy (Phoenix /
  retired Empress), broad-lateral-fan (Molten). **Everflame claims: upper-lateral-TRAILING mass.**
- **Profile-FUNCTION families spent:** interior-peak (Solar), terminal-peak (retired Empress),
  saturating-plateau/scalloped (Molten). **Everflame claims: CONCAVE-CUPPED** (tongue tips rise late
  and stream back).
- **The value structure is INVERTED from Molten:** CALDERA = dark field, light in the seams. FLARE =
  **light field, dark on the rims.** This is the load-bearing aesthetic call and it is settled.

---

## §1 AESTHETIC — the FLARE SYSTEM ("light field, dark on the rims")
Fire IS the body; dark is only a thin rim that crisps the silhouette. Reuse the 5-tier STRUCTURE
(every material is exactly ONE tier; heat falls off core→extremity; **shade by HUE not value** so it
survives ACES + bloom) but re-weight it BRIGHT — a luminous body, minimal dark. Premium light =
emissive baked into OPAQUE flat-shaded facets in saturated bloom-safe hues; **NO additive shells.**

**THE FLARE LADDER** (hexes are a starting point; every emissive except F0 holds sat≥0.85, val≤0.90 →
blooms in-hue):

| Tier | Name | matte / emissive | lives where | area @ apex |
|---|---|---|---|---|
| **F0 WHITEGOLD** | the ONE near-white | — / `0xffe9c4` | the chest **keel-star** + the eyes ONLY (rare, hierarchical). OUT of `spineMats`/`accentMats` (surge-clip rule). | ≤2% |
| **F1 GOLDFIRE** | the body glow | `0x8a5c12` / `0xe69b1f` | the BODY FIELD (torso, nape, head, wing roots, the inboard flame-blanket), the furnace keel | ~35% |
| **F2 FLAME** | mid heat | `0x6e2a0e` / `0xd9541a` | mid-wing tongues, dorsal licks, fore ribbon-sparks | ~25% |
| **F3 CRIMSON** | the cool sheath | `0x571712` / `0xb32613` | outer tongues + tongue tips, aft ribbon-sparks, the shadow-side belly | ~22% |
| **F4 GARNET** | the dark rim | `0x421210` / matte, NON-emissive | thin facet RIMS everywhere, beak tip, talons, extreme tongue-fray tips | ~12–16% |

**Two values per facet, INVERTED:** every flat-shaded facet gets a saturated emissive FIELD + a thin
matte GARNET rim at its boundary (Molten got two values from light-in-groove/dark-on-ridge; Everflame
gets it from light-on-face/dark-on-edge — same craft law, opposite polarity). This is what keeps a
bright body reading as **faceted jewel-fire, not an orange smear.**

**Heat gradient = HUE STEPS across facets** (F1 body → F2 mid-wing → F3 tips), never a value ramp or a
texture. The silhouette-crispness job that crust did for Molten is done here by (a) the F4 garnet rims
on perimeter facets and (b) the F3 crimson outer tier (the flame's cool sheath).

**Dual-sky contract:** on a DARK sky she is the gold-on-black reference verbatim (3 hue-separable
light structures — F0 keel-star / F1 body+blanket / F2–F3 cascades+ribbons — never one orange smear);
on a PALE/GOLD sky the crimson+garnet perimeter anchors her so the bright body does NOT dissolve.

**Bloom discipline (bright body):** body-field emissive intensity ~0.55–0.65 at glide (leaves Surge
headroom); F0 confined to two tiny points; embers/sparks are tiny OPAQUE emissive facets (the
transparent-drawable budget is untouched). The **framecap gate is the ration-setter** (measurement-
derived, not inherited): ring + nearest obstacle legible within ~1.5 dragon-widths, WITH Surge on.

**SURGE = "FLASHOVER":** every tier promotes one rung (F2→F1, F1→F0-adjacent), ribbons lengthen ~40%,
tip frays double (the tier promotion rides the existing `spineMats` surge lerp; the ribbon-lengthen /
fray-double is a `surgeStretch` transform on the ribbon/fray groups driven from the flight tick's
surge value — if no clean hook exists, ship tier-promotion-only and note it for the owner; the
framecap gate is unchanged either way) — the white-hot reference IS this transient state. Gate:
framecap course-legibility during Flashover; nothing else (whiteheart-style bloom is permitted).

**The drifting EMBER FIELD (reference-fidelity item):** refs 1/2/3 all shed sparks into the air around
her. That ambient wake is the engine's phoenix-archetype rig motes — delivered by setting
`archetype: 'phoenix'` on the def as a RIG FLAG (warm ember-mote wake + Rebirth fire-trails), NOT a
model path (explicit `parts` override the recipe). The *attached* sparks (tip frays, ribbon facets)
are geometry; the *drifting* embers are that rig wake — both must be present so she visibly "sheds fire."

**Feathers read as FLAME, not plumage:** an S-tapered tongue outline (no rachis/barb anatomy),
root-hot/tip-cool hue steps, gaps between tongues, frayed micro-shard tips. A solid gold feather with
a bright rim reads "divine plumage" (the shipped Phoenix); a tapering tongue that COOLS AND FRAYS
reads fire.

---

## §2 WINGS — `flareCascadeWings` (the HERO; ~360–420 tris/wing at apex)
A cascade of discrete flame TONGUES raked aft-and-up — the streaming fire of refs 1/4, realized as
the wing itself. Canonical +X build, left = `scale.x=-1` mirror; publish `wingPivotL/R`,
`wingMidL/R`, `wingTipL/R`, tip `marker`, `wingElements`; the vertical-profile formula EXPORTED ONCE
and shared by the geometry AND the FX marker / `wingElements` tip (the molten crash-class lesson —
change the profile in one place or the trails detach).
- **Plan:** rootChord ~1.4, halfSpan ~3.0 (COMPACT — brightness is not license for size).
- **Inboard 0→0.55 span — the FLAME-BLANKET:** a single lofted sheet of 2–3 large fused-tongue facet
  bands, F1 goldfire field with garnet rims. The confident MASS (firewall #1): a filled surface,
  real chord, visually continuous with the glowing torso — the fire and the fuel are ONE body.
  (Fills ≥55% of span. NOT a membrane with shingled ranks — that is molten's pyre-fan.)
- **Outboard 0.55→1.0 — the CASCADE:** 6–7 discrete flame tongues raked aft-and-up, air gaps that
  widen outboard (gap ≥8px at the 250px chase distance). Each tongue = an elongated S-taper lick,
  ~12–16 tris, creased down its centre for two facet values, hue-stepped F2→F3 along its length, tip
  ending in 2–3 tiny garnet/crimson fray shards.
- **Vertical profile (the CONCAVE-CUPPED signature):** the leading arm is low + nearly level to
  mid-span, then the tongue tips trace a late steep rise that flattens as they stream back — e.g.
  `y(t) = hs·0.62·(1 − cos(π·min((t−0.45)/0.55, 1)))^0.7`. No straight line longer than one station.
- **Scale hierarchy WITHOUT a leading pinion:** tongue lengths grade ~2.2:1, with the DOMINANT tongue
  at the **inboard-trailing** position (the streamer that pours off the wing's trailing edge). Molten's
  dominant was the terminal (outermost) pinion ×1.7 — inverting the dominant's POSITION is a structural
  differentiator, not a re-skin.
- **Heat direction (a bonus distinctiveness tell):** the wing cools root→tip (fire attached to the
  body-fuel) — Molten's pyre-fan got HOTTER toward the pinion. Opposite gradient = opposite creature.
- **Silhouette veto for the gate:** "is this a bird WING or a fire CASCADE?" — it must answer *fire*.
  Cannot be mistaken for: the pyre-fan (no membrane + no 3 shingled ranks + no dark crust leading
  rim — the leading arm is F1 gold with a garnet edge), the shipped feather wing (gaps + tapering
  licks vs a solid sheet), or Seraph (no scale-lapped feathers, no white).

---

## §3 BODY / HEAD / TAIL

### §3a Body — `everflameTorso` (~450 tris)
Publishes the FULL attach contract (`wingRootL/R`, `headBase`, `tailAnchor`, `halfWidthAt`,
`bodyMidY`, `riderSocket`, `spinePoints`, `motifAnchor`) and `coreGlow` as a mesh-or-`null` (never a
color number — the invisible-dragon crash class). A compact keeled teardrop, LEVEL long axis, lofted
from FEWER LARGER facets — F1 goldfire fields, garnet rims on every facet boundary, F3 crimson on the
shadow-side belly.
- **THE FURNACE KEEL** (the core-glow signature, non-leaking): one continuous throat→chest→belly-keel
  STRIP of F1 grading to a single F0 **keel-star** facet-cluster at the chest — a *line of white heat
  inside the flame*, explicitly NOT a caldera pool behind crust (no crust exists on this creature).
  This is the `motifAnchor`. The keel-star must read as the white TERMINUS of the keel strip (an
  elongated facet-cluster continuous with it), never a detached chest disk/pool — hand the CP1 critic
  a molten-heart tile as a veto comparison.
- **Dorsal licks:** a row of 5 small flame licks nape→hip, alternately canted L/R toward the camera
  — the rear-chase "no dark back" guarantee AND the visible ignition-ramp hardware (gated per rung).

### §3b Head — `blazeCrestHead` (~120 tris)
A small compact wedge skull, **luminous** F1 goldfire field (a direct inversion of molten's cool
obsidian mask), a short **garnet matte beak tip** as the one dark anchor, F0 eyes. Crest = **3
backswept flame licks** off the crown (F1→F2) that continue the dorsal light line so the rear-chase
view reads the head as the bright ORIGIN of the spine glow. The face is ~0% of the play view — the
crest licks ARE the head's rear-chase job. (Not a beaked solid head, not an obsidian mask, not a
crown-halo/eclipse-crown — swept streamers, never a ring/gem.)

### §3c Tail — `sparkRibbonTail` (support; ~90–120 tris)
TWIN ribbons, splayed left/right to |x|≈0.7–0.9 and LIFTED to ride at/above spine height (they occupy
the upper-outer frame, echoing ref 4's streamers — NEVER the lower-centre). Each ribbon = **8–12
discrete OPAQUE emissive spark facets** (tetra/diamond, ≤0.08 body-lengths each), spacing ≥1.5× spark
length, hue fading F2→F3→garnet aft, slight alternating cant so faces catch the chase cam. **Sparse
luminous points, never a sheet** — at chase distance a trail of embers peeling off her. (Distinct from
the ember-whip's single thin whip, the plume's solid fan, the pyre-train's bottom fan, Seraph's single
centred comet.)

---

## §4 VISIBILITY (law in force — exact commitments)
1. **Hard corridor rule for every wing/tail vertex: if `z > hip` then `y ≥ spine`.** The cascade rakes
   aft-UP; the ribbons lift to spine height immediately off the tailAnchor and splay to |x|≈0.7–0.9
   (outside the |x|≤0.6 corridor AND above it). Corridor asserts (max|x|≤0.6, footprint≤1.3) inherited
   verbatim into `tests/starters.mjs`.
2. **The streaming energy points AWAY from the playfield** — aft-up means the fire pours toward the
   frame's UPPER corners (empty sky) while the luminous body sits compact at frame centre as an
   effect, not a hole. The reference motion survives because it was translated into RAKE, not length.
3. **Brightness is metered, not sized:** halfSpan 3.0 (compact), body-field intensity capped ~0.6 at
   glide, and the BINDING assert is the framecap gate (ring + nearest obstacle legible within 1.5
   dragon-widths, WITH Flashover active). For a bright body the failure to watch is BLOOM-HALO growth,
   not geometry — framecap is the tool that sees it (never the studio void).
4. **The tail can never become a sheet** — sparse-points is structural (discrete facets, mandated
   spacing), not a tuning value; there is no membrane to accidentally grow.

---

## §5 LADDER — "THE FIRE CATCHES" (kindling → wildfire; each rung confers hardware + light + signature)
`ascendedDef` merges `def.forms[t]` cumulatively; tris + every dial MONOTONIC; the premium gets its
OWN assert block in `tests/starters.mjs` (no form wears the full crown early — the f0 bird visibly
LACKS the cascade).

| Form | Name | confers | igniteStage / glow | ~tris |
|---|---|---|---|---|
| **f0 First Spark** | a garnet-bodied fledgling; flame-blanket-only stub wings, NO tongues/ribbons/crest; only the furnace-keel line lit (F2) — one thread of fire in a dark bird. *f0's tell is the ONE continuous ventral keel LINE — never a crack network (molten f0's tell) and never a plain charcoal bird (the shipped f0); give the garnet body a faint warm smolder gradient so the sil-rear f0 tile is not mistakable for either neighbour's base form (add both f0 tiles to the CP3 comparison set).* | 0 / 0.25 | ~1.0k |
| **f1 Kindled** | HARDWARE: 4 cascade tongues + 3 dorsal licks. LIGHT: body field ignites to F2 flame-orange, keel to F1 | 1 / 0.5 | ~1.5k |
| **f2 Roaring Blaze** | HARDWARE: 6 tongues with gaps, crest licks, first (short) ribbon pair. LIGHT: body field turns F1 goldfire — she becomes the gold-on-black reference. SIGNATURE: the cascade rise arrives (cascadeRise 0→0.7) | 2 / 0.75 | ~2.1k |
| **f3 The Everflame** (Eternal) | HARDWARE: full 7-tongue cascade + tip frays + full twin ribbons + 5 dorsal licks. LIGHT: F0 keel-star + eyes ignite; Flashover surge unlocked. SIGNATURE: full concave-cupped sweep | 3 / 1.0 | ~2.8k |

Dials (all monotonic, each arriving on a rung): `tongueCount`, `cascadeRise`, `gapWidth`,
`frayEmbers`, `ribbonLen`, `keelHeat`, `lickCount`, `crestLicks`, `igniteStage`, `glowLevel`. Material
factory: copy the `sovereignMats(def, glow, stage)` STRUCTURE as `everflameMats` — new hues, new slots.

---

## §6 BUILD PLAN (checkpoints, each behind a harsh Fable critic + a real framecap)
- **CP1 — FLARE BODY + HEAD:** `everflameMats` (5 tiers, BRIGHT-FIRST, light-field/dark-rim);
  `everflameTorso` (luminous keeled body + furnace keel + keel-star + dorsal licks) + `blazeCrestHead`
  (luminous blaze-crest). Wings ride along as a placeholder. Gate: dual-sky shows 3 hue-separable
  structures + framecap course-legible + the §B owner-call.
- **CP2 — FLARE-CASCADE WINGS:** `flareCascadeWings` + the shared exported profile. Gate: the
  "wing or cascade?" veto across all four views + the not-molten/not-shipped/not-Seraph silhouette
  veto + framecap. This is the hero — spend the most gate rounds here.
- **CP3 — TAIL / LADDER / POLISH:** `sparkRibbonTail`, the f0→f3 ladder, starters asserts (premium
  block + corridor + NaN guard), full gauntlet + the holistic Fable ship gate + owner motion checkpoint.

---

## §7 HARSH-CRITIC CHECKLIST (each CP: rear-chase / side / top / silhouette × dark/pale/gold × real framecap + Flashover framecap)
**WASHOUT:** 3 fire tiers hue-separable on dark (not one orange smear)? pale/gold silhouette doesn't
DISSOLVE (crimson+garnet perimeter anchors her)? two values/facet read (garnet rims visible at chase
distance)? framecap: ring+obstacle legible within 1.5 dragon-widths, WITH Flashover on?
**FIRE-BODY:** reads as living FLAME (luminous body + flame-tongue wings + streaming) not a gold
BLOB? heat hottest at the keel-star, cooling outboard? feathers read as FLAME (S-taper + gaps +
cool/fray) not solid plumage? f0 reads a garnet fledgling with one thread of keel-fire (not a spent
cinder, not the full blaze)?
**WING (CP2):** a FIRE CASCADE not a bird wing? inboard ≥55% a filled flame-blanket (real mass, not a
firework of thin sparks)? tongues grade 2.2:1 with the inboard-trailing streamer dominant (not a
picket fence)? gaps ≥8px? no straight line > one station? cools root→tip?
**VISIBILITY:** corridor asserts green? every {z>hip} vertex has y≥spine? lower-centre clear? tail is
sparse HIGH LATERAL points, never a lower-centre sheet?
**SURGE (Flashover):** every tier promotes one rung + ribbons lengthen + frays double; gate is only
framecap course-legibility.
**REGRESSION:** tricount monotonic <6000 · blueprint · smoke · wingsymprobe · flight ticks · 60fps.

**Standing Fable VETOES (hand the grader comparison tiles):** (1) any tile mistakable for Molten's
pyre-fan / obsidian-mask / caldera-heart, the shipped Phoenix's feather-wing / plume / beaked head,
Solar's ring / cathedral-M / lance-vault, or Seraph's halo / feather-scales / comet; (2) the
one-orange-smear washout veto; (3) corridor intrusion in the framecap. Calibrate the brief on the
shipped `phoenix` FIRST — it should FAIL "flame-not-plumage."

## FIREWALL — pre-conditions the FIRST build must satisfy (round-0 self-audit before any Fable round; target every axis ≥3.5)
1. **Mass:** inboard flame-blanket fills ≥55% of span as a real surface; tongue root chord ≥0.18·halfSpan
   (no wireframe-of-licks — the bright-design trap is "a firework of thin sparks").
2. **Hierarchy:** tongue grade 2.2:1, inboard-trailing streamer dominant; ribbons < tongues < blanket.
3. **Specific silhouette:** the sil-rear tile reads a nameable "bird of wind-blown fire" (up-swept
   V-cascade + twin high ribbons), concave-cupped — not a generic delta, not molten's flat fan.
4. **Fills the rear frame:** ≥3 hue-separable light structures (F0 keel-star / F1 body+blanket /
   F2–F3 cascades+ribbons), no dead centre — the bright-body failure to audit is the ONE-SMEAR, not a
   dark hole.
5. **Clean edges:** every tongue tip a designed S-taper + deliberate fray shards; gaps ≥8px; no
   accidental raggedness.
6. **Value contrast, INVERTED:** garnet rims visible at chase distance (2 values/facet); pale-sky
   silhouette anchored by the crimson/garnet perimeter; exactly ONE near-white register (keel-star +
   eyes), kept OUT of the surge-lerped mat arrays.
7. **No mud:** ≤2 values per facet, large hue fields, zero noisy texture.
8. **Triad present in the sheet:** withheld hardware per rung, the igniteStage ramp, the swept-cascade
   signature — no deferred CP2 spectacle campaign.
9. **Bright-specific:** framecap-with-Flashover legibility as the standing washout gate; ZERO new
   additive/transparent drawables (all sparks opaque emissive); wingsymprobe PASS; smoke clean.

---

## §8 NO-LEAK MAP — how Everflame reads distinct from every neighbour (the §0.5 axes)
| Axis | vs MOLTEN Phoenix | vs shipped PHOENIX Ascendant | vs SOLAR Sovereign | vs SERAPH / Pearl |
|---|---|---|---|---|
| **Silhouette / region** | swept aft-up V-cascade (upper-lateral-trailing), body luminous — vs broad flat pyre-fan, body crusted | streaming wind-blown flame — vs static avian spread + plume | concave-cupped, no top-centre mass — vs interior-peak cathedral-M | twin high lateral ribbons — vs single centred comet / halo |
| **Wing construction** | discrete flame tongues + air gaps, NO membrane/shingled ranks/leading pinion — vs cambered membrane + 3 shingled ranks + dominant leading pinion | tongues + gaps — vs a continuous TRANSLUCENT feather web (ShapeGeometry, opacity 0.82); Everflame is 100% opaque | no vault-bays / carpal lances | no feather-scales |
| **Signature / regalia** | furnace-keel LINE + twin spark-ribbons — vs caldera heart-pool + obsidian mask | cascade + ribbons — vs flame-plume + "Rebirth" | no ring/corona | no crown-halo |
| **Palette / glow** | light-field / dark-rim (INVERTED); goldfire body `0xe69b1f` — vs crust field `0x261210` | amber-gold→crimson streaming FIRE — vs WHITE-gold divine plumage | fire ladder — vs violet/gold | fire — vs pearl/white |
| **Growth beat** | "the fire CATCHES" (kindling→wildfire, fuel vanishing into flame) — vs "the crust CRACKS" | vs "rebirth surge" | vs "wings learn the arch" | vs Pearl's reveal |
| **Heat direction** | wing cools root→tip (fire on the body-fuel) — vs molten's wing getting HOTTER to the pinion | — | — | — |

---

## §9 CARRIED CRAFT LESSONS (design-agnostic — the accumulated laws that make the build cheap + correct)
These are the RELEVANT, shape-agnostic craft/engineering/process laws from the ledger — none of them
dictates a shape, a palette, or a motif; they are containers + guardrails that apply to ANY premium.
Follow them and the build lands ~3.5+ before the first Fable round.

**Material / value craft (apply to the FLARE palette, not a specific look):**
- **VALUE-GAP LAW.** The BODY-FIELD emissive ceiling must sit at least one tier BELOW the ACCENT
  ceiling, or ACES + bloom flatten every hue into one smear. (Here: body field ~0.55–0.65, keel-star +
  outer tips hotter.) The recurring "premium reads as flat bright paint" failure is almost always a
  missing value gap, not a wrong hue.
- **TWO VALUES PER FACET.** Give every flat-shaded facet a second value — a lit field + a dark rim, or
  a raised ridge + a shadowed groove. Which polarity is the design's call; the relief itself is the law
  (it survives flat-shading + bloom where a single value reads as a blob).
- **BRIGHT-FIRST, RATION DOWN FROM CAPTURES.** Pitch intensities/areas hot, then dual-sky + framecap and
  lower ONLY where a real capture washes out. Area/intensity ceilings are measurement-derived, never
  inherited from another dragon's numbers.
- **ORGANIZED RANKS, NOT TRI COUNT.** Perceived craftsmanship = the number of ORGANIZED detail systems
  (a rank of N repeated units at a fixed pitch), not triangle count. N units in a rank read as crafted;
  the same N tris scattered read as noise (the gate scores a NOISE veto).

**Geometry crash-classes (each has bitten before; each is invisible to tricount/asserts):**
- **PLAIN-ARRAY TRIS.** Tri-list helpers index `a[0]/a[1]/a[2]` — pass PLAIN ARRAYS, never a `Vector3`
  (whose `[0]` is `undefined` → every vertex NaN). NaN is invisible to tricount, geometry asserts, and
  the flight tick, and it even fools a comparison-based symmetry probe (`NaN > worst` is false) — ONLY
  the render shows it (an empty/blown frame). Always eyeball a render after any geometry change, and
  keep a hard NaN-vertex guard in the starters asserts.
- **coreGlow IS A MESH OR `null`, never a colour number** — the orchestrator builds the real back-glow
  sprite only when this is falsy; a number makes it skip that and crash on `.userData.base` every frame
  (an invisible dragon).
- **ONE EXPORTED PROFILE FOR GEOMETRY + FX.** Any curve used by BOTH the vane geometry AND the wingtip
  FX marker / `wingElements` tip must be a SINGLE exported function — change it in one place or the
  trails + aero-shear detach from the moved tip.
- **PUBLISH THE FULL ATTACH CONTRACT** (`wingRootL/R`, `headBase`, `tailAnchor`, `halfWidthAt`,
  `bodyMidY`, `riderSocket`, `spinePoints`, `motifAnchor`) or the orchestrator null-derefs at build.

**Silhouette / connectedness (why the black-fill test is the harshest gate):**
- **ROOT-IN-FILL INVARIANT.** Every discrete blade/feather/spark must ROOT INSIDE the filled surface
  (clamp its root parameter to the fill boundary) and extend outward — never root on a bare edge/spar,
  or it floats as a detached island in the black-fill silhouette (the "loose-slat / biplane" read). The
  plane / Seraph / spray-of-wires vetoes all reduce to two measurable properties: CONNECTEDNESS (no
  detached islands) and EDGE-CHARACTER (straight = plane, smooth = vault, serrated-from-fill = alive).
- **RANK-VALUE-STEP.** Each layered/shingled rank must sit a value/tier off the surface beneath it, or
  it vanishes (same-tier-on-same-tier is invisible at chase distance).

**Process (the meta-laws that save the most rounds):**
- **JUDGE IN THE REAL CHASE CAM, never the studio void.** The studio looks AT the model (a turntable);
  the game looks PAST it at the course. A beautiful turntable render is necessary, not sufficient — this
  meta-lesson killed four prior rebuilds. `framecap.mjs` (full frame + course, incl. Surge) is the
  binding visibility gate.
- **VERIFY BY FAILURE-CLASS.** tricount (budget) · blueprint (integrity) · smoke (per-frame crash →
  invisible dragon) · wingsymprobe (mirror symmetry) · dragonstudio + framecap (aesthetics). Each
  catches a class the others are blind to; a green budget says nothing about whether it renders in flight.
- **THE CHECKPOINT GATE IS THE PROCESS.** Budget ONE rework per checkpoint; a first-try Fable pass is a
  red flag that the bar was too soft. The harsh critic naming the exact fix, then a small surgical
  change, is the loop working.
- **A REGRESSION ASSERT CAN ENFORCE THE FAILURE IT WAS WRITTEN TO PREVENT — re-read guardrails when the
  design intent INVERTS.** ⚠ Everflame INVERTS Molten's value structure: carry the design-agnostic
  asserts (the corridor law, tris/dials monotonic, the NaN guard, the attach contract) but do NOT
  inherit any molten assert that encoded a DARK body (e.g. a "wing diffuse value ≤ X" ceiling) — a
  bright body must be re-scoped, not policed by the dark design's numbers.
- **WHEN YOU RETIRE/REPLACE A DESIGN, GREP THE TEST DIR FOR DANGLING REFERENCES** to the removed key
  (a stale `DRAGONS.<retiredKey>` throws `JSON.parse(undefined)` and reds the suite).

---

*Author's note for the implementation chat: §1–§9 are the audited design. Build the contract
(apex-first, round-0 self-audit, verify-by-class, high-effort Fable gate at each checkpoint, owner
motion checkpoint); don't redesign it. Closed calls (the FLARE inversion, the swept-cascade hero, the
no-leak map) stay closed unless you raise a real objection to the owner.*
