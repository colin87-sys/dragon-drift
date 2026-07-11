# OBSIDIAN SHADE — "The Starless Crescent" · Premium Build Sheet (Night Fury / Toothless-class)

The builder's contract for **reintroducing** the retired `obsidian` ("Obsidian Shade") as a bespoke,
low-poly, premium apex **night drake** — the deliberate opposite of Solar (crowned cathedral) and
Phoenix (fiery train): a seamless, unlit, ambush-predator crescent. **Amplify the frozen Night-Fury
identity, do NOT redesign it away.** The former bones (soft-stealth head, one-skin organism hull, split
tail, matte-black cruise read) are the standard — this sheet HONES them into an apex.

> **Repo-state note (important):** `obsidian` AND its clean-sheet vehicle `obsidian2` were RETIRED from the
> roster in the merged PR **#338 ("Retire 10 dragons + molten-phoenix groundwork")** — only orphaned
> comments remain in `js/dragons.js`. The one-skin BUILDERS survive (`organismTorso`/`organismWings` in
> `js/dragonOrganism.js`, `draconic` head, `sweptTail`). So this sheet is a **REINTRODUCTION as a fresh
> premium** authored on the surviving architecture — the same "authored fresh + coexist" pattern Solar and
> Phoenix used — NOT an in-place elevation of a live def. See §0 and §9.

**Read first:** [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md) (the playbook — §0.5 distinctiveness
gate, §2 rear-chase primacy, §3 spectacle triad, §3b anti-tacky lighting, the density-at-250px law,
coexist→prove→migrate). Worked references: [`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md)
+ `js/dragonSovereign.js`, [`PHOENIX-MOLTEN-BUILDSHEET.md`](./PHOENIX-MOLTEN-BUILDSHEET.md). The
rear-chase VISIBILITY doctrine that this sheet pre-solves lives in `leapfrog/lessons/2026-07-10-*`
(ghost-vs-reshape, decouple-from-flap, audit-the-real-blocker, rotating-landmark-is-radial-only).

Sourced from: the retired `obsidian`/`obsidian2` defs (the identity to restore) + the owner's L31 rulings
(matte finish, span, no-shingle, whole-creature relief) + the Fable design synthesis. **Numbers here are
the authority; the Fable gate (§12) judges against this sheet.**

---

## 0. Identity contract (restore these — the retired def's frozen fields)
Reintroduce as a fresh roster key (working name `obsidianShade`; the shipped-legacy `obsidian` key was
retired in #338 — do NOT resurrect the old geometry, author fresh per §9). Restore the retired def's
identity fields verbatim: `name:'Obsidian Shade'` · `title:'Night given wings'` · `rarity:'SSR'` /
`maxRarity:'SSSR'` · `cost:2200` · `stats` (speed 1.1 / handling 1.16 / drain 0.84 / regen 1.18) ·
`fx.auraColor '50,110,140'` (cold) · `forms[]` accretive, length 4 · `maxTierFor===3` (tiers 0–3) ·
`hasStyle` · `lanceTint 0x9bff3a` + `lanceRune 'nightEye'` (acid-lime wisp, f3+) ·
`headArchetype:'softStealth'` · acid-green cat eyes · nightfury split tail · LEVEL body.

**Frozen identity laws (the north star, non-negotiable):**
- **Pure black in cruise.** No glowing seams, no lit panels, no cruise emissive except the eyes. Plasma
  is HELD BACK entirely for the Night Surge. *"Obsidian glints, never glows."*
- **Seamless.** One continuous skin (body+wings), zero joints in the outline. Smoothness is the signature.
- **Stealth, never regal.** No horns, no spikes, no rings, no crown, no ornament. Sleek, cat-like, fast.
- **Zero near-white, zero warm hues.** Two cold hues on black (acid-green eye + withheld plasma cyan).

**Build vehicle (see §9):** author FRESH on the surviving one-skin organism builders
(`organismTorso`/`organismWings`), as a new roster key — `obsidian`/`obsidian2` were retired in #338, so
there is no live def to elevate; the architecture they proved is what we rebuild on.

## 1. Art direction (frozen north star)
**NIGHT — worn as the skin itself.** Solar wears his spectacle as a crown ABOVE; Phoenix as a train
BEHIND; Obsidian wears his as the SKIN — the whole body IS the motif. In cruise that skin is the night:
matte blue-black glass, a **starless hole in the sky**, catching only cold moon-grey glints off a dorsal
glass streak. On the Night Surge the same skin reveals it was a plasma CIRCUIT all along — a fuse burning
nose-to-tail. Persona: an intelligent, cat-like AMBUSH PREDATOR. Growth verb: **HONING** (a blade ground
sharper/quieter/blacker — the apex is *more perfect*, not more decorated). Anchor hue blue-black
`0x080a10` (apex); one cold accent plasma-cyan `0x1fb6e0`, emissive-only, Surge-only, on ≤8% of surface.
Hero: **THE MANTLE** (the one-skin crescent). Motif: **THE FUSE** (the plasma night-circuit). One word:
**NIGHT** — worn as skin, not as regalia.

## 2. Silhouette language
Primitive: **a crescent over a level keel (∩ atop —), tips DOWN.** Body long axis horizontal; line of
action = one long UNBROKEN S in profile (short proud neck flows into the shoulder dome, dome into the long
tapering tail — no inflection breaks, no notches). All vertical drama from appendage dials (dome height,
tip droop, tail-fin splay), never an upright body.

**The signature outline — THE WANING CRESCENT.** In pure rear black-fill Obsidian reads as a crescent moon
flying: one wide smooth arc whose highest point is the shoulder dome at DEAD CENTER, falling monotonically
outboard into drooped, claw-curled sickle tips. Exactly three punctuation marks on the centerline: the
twin ear-fin points (top-center), and the twin splayed tail fan-fins (bottom-center). Nameable at a glance:
*"the black crescent."* A crescent is a NIGHT icon — referent and silhouette agree.

**Distinctiveness gate (§0.5) — why the rear black-fill cannot be confused:**

| Axis | Solar | Phoenix | Pearl | **Obsidian (this sheet)** |
|---|---|---|---|---|
| Silhouette region | TOP-heavy (crown above head) | BOTTOM-heavy (train below) | forward haloed knight | **LATERAL / midline-band** — one continuous horizontal plane fills the frame's middle (flying-wing/manta read) |
| Profile function | interior-peak arch (**M**: two peaks, center VALLEY) | terminal-peak rake (tips UP) | — | **center-peak monotonic DROOP** (one central dome, tips DOWN) — the mathematical INVERSE of both |
| Joint grammar | articulated (neck notch, wing-root step, spires) | articulated (crest, blades, quill fan) | haloed knight | **ZERO joints** — one continuous curve, "the one with no corners" |
| Wing architecture | membrane vault-bays + carpal lances | feather scythe blades | — | **one-skin blended mantle** — scalloped lobes, drooped anhedral sickle tips |
| Motif form | ring + brow gem | coal arc + gorget | white halo | **carved CIRCUIT (the Fuse)** — a channel, not a ring/gem/quill |
| Palette + glow | indigo + violet, 1 near-white | ash-garnet + 3 warm, 1 near-white | white-gold | **blue-black + 1 cold plasma, ZERO near-white** |
| Growth verb | Coronation (forged) | Rebirth (re-kindled) | — | **Honing (ground sharper)** |

**Retired by this sheet (housekeeping for the next dragon):** silhouette region **lateral/midline-band** ·
profile family **center-peak monotonic droop** · tone lane **unlit black / zero cruise-glow** · joint
grammar **seamless one-skin**.

## 3. Motif — THE FUSE (the Night-Surge plasma circuit; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor:** the dorsal centerline — occiput → spine → tail stem → splitting into the twin fan-fins.
The motif is a **carved recessed channel**. In cruise it exists as GEOMETRY ONLY — a shadow groove read in
the satin sheen (SCULPTURE, not light: the "no glowing seams in cruise" law holds because the seam is
CARVED, never lit). On the Night Surge the channel floor IGNITES: opaque vertex-baked emissive in ONE hue,
a fuse burning nose-to-tail.

- **Hue lock: plasma cyan `0x1fb6e0`** (sat ≈0.86, val ≈0.88 — bloom-safe in its own color). Eyes stay
  acid-green `0x96d62a→0xb6e85a` (the one always-on accent). Surge peak `surgeHi 0x5ad0f5` (saturated —
  never desaturated `0x9fd8ff`, never white-hot, never magenta). Anti-collision: cold cyan sits ~90° from
  Solar's violet, opposite Phoenix's warm triad, distinct from Pearl's white-gold.
- **The cascade (ignition order):** (1) **throat charge** (Toothless pre-shot gullet glow — front/inspect
  only, spend ~nothing on it for the chase cam), (2) **spine channel** (THE rear-chase carrier), (3) **tail
  split + twin fin-rim trailing edges** (rear-most beacon, faces canted to camera), (4) **wing veins**
  (thin lightning-fork grooves branching off the spine into the membrane, 1→3 per wing).
- **4-step bloom** (`fuseRun` 0.25/0.5/0.75/1.0 — the MESH and the LIGHT are both gated):
  - **f0** — a carved nape NOTCH only (the fuse's socket, no run). Surge = eyes flare + faint throat. The
    whelp physically LACKS the circuit.
  - **f1** — channel carved occiput→mid-spine (40% run). Surge lights it dim.
  - **f2** — full spine→tail-stem run + first vein branch/wing. Surge plays the **fuse-run**: ignition
    sweeps head→tail over ~0.8s (a CPU-animated per-segment emissive ramp — headless-testable), then holds.
  - **f3** — the complete circuit: spine + tail split + both fin rims + 3 veins/wing + throat. Surge
    cascades spine→tail→fins→veins — the full "living lightning" reveal that the black skin was a machine
    of night all along.
- **Anti-tacky compliance (§3b):** all emissive baked into OPAQUE channel-floor facets (value-contrast on
  a CIRCUIT — a NEW regalia form, never a ring/gem/quill). Channels 8–10px wide at 250px chase (density
  law); small count (1 spine + 2 fin rims + ≤3 veins/wing). No additive shells, no sprites. **Zero
  near-white anywhere** (Obsidian is the premium of total hue discipline). Surge-tick: channel/vein/fin-rim
  mats go IN the surge arrays (flare to `surgeHi`); eye mats stay OUT (green never lerps toward cyan).

## 4. Torso — elevate `organismTorso` (keep the builder; add dials)
The one-skin loft STAYS. Add: `hullDome` (dome height per form — the crescent's central peak, cresting
just FORWARD of the rider socket), the carved fuse channel (geometry, `fuseRun`-gated), and the **dorsal
glass streak** — a narrow centerline strip with lower roughness (~0.55 vs the 0.82 matte field) so
moon-grey sky glints track the spine in cruise (NON-emissive; this is the "no dead-black void" answer that
never breaks cruise-black). Matte-finish laws (L31, SETTLED): metalness 0, roughness 0.82, envIntensity
~0.18–0.25, `cellularScalesNormal` whole-creature relief, `scaleTail:true`, **NO shingle plates** (they
read as bolt-ons — do not bring them back). Publishes the full attach contract + `parts.spinePoints` + the
fuse `motifAnchor` (nape) + `coreGlow` as mesh-or-null.

## 5. Wings — the HERO: THE MANTLE (the one-skin crescent)
The dominant landmark is **the unified skin as a single sculpted object** — shoulder dome + blended wings +
drooped sickle tips, one seam-free black shape owning the frame's midline band. The hero is not a part
bolted on; it is the REFUSAL to have parts. Apex geometry:

- **The blend:** wing-membrane root verts ARE the body flank verts (the `organismWings` construction, kept)
  — zero root discontinuity; the top-line from occiput to wingtip is one C² curve.
- **Span : body** ladder **1.6 / 1.9 / 2.2 / 2.45×** (SETTLED by the L31 owner call "wingspan ~2–2.5× body"
  — do NOT re-inflate; Obsidian's majesty is SLEEKNESS, not span).
- **Vertical profile — the NEW function (replaces the current `arc{bow, hump 0.52@0.60, hook}`, an
  interior-hump curve that sits in Solar's retired family):** `y(t)` = dome at t=0, monotonic fall;
  `tipDroop` kicks in over the outer third (anhedral ~18–25° equiv), terminating in a **`clawCurl`** — a
  short downward sickle hook at the very tip (a cat's paw curled mid-pounce). VERTEX-BAKED so it survives
  the flap animator; the FX tip marker + `wingElements` MUST duplicate the formula (documented gotcha).
- **Trailing edge:** 4→6 SOFT rounded scallop lobes/wing across the ladder (the Night-Fury finger-webs) —
  designed, wide (≥8px at chase), never sawtooth. Ventral membrane one value-tier lighter slate so banks
  read.
- **Apex-only conferral:** the **sickle tips** (`clawCurl` 0/0/0.15/0.35) + full droop — the crescent
  literally COMPLETES only at Eternal. Below f3 the outline is a flatter, blunter arc; Eternal is the first
  form whose black-fill IS the waning moon.
- **Motion — "the pounce":** cat-quick low-amplitude beat (keep `flapBias 1.08` / `flapAmp 0.82`) with long
  dead-silent glide holds. On boost the mantle FOLDS into a dart (span ~0.6×, the Night-Fury dive-tuck) —
  the stealth dragon's spectacle move is DISAPPEARING into a blade. On Surge the mantle snaps fully spread
  as the circuit fires.

## 6. Head — keep `draconic` / softStealth, sharpen the ladder
Rounded stealth wedge, short blunt snout, **NO horns ever**. Eyes are the face's entire budget: huge
acid-green cat eyes, ladder **38% round kitten → 30% → 24% → 20% almond** at apex (deliberately the
roster's LARGEST apex eye — cat, not raptor; Solar ends at 15%). Ear-fins: swept-back pairs, `earFinPairs`
**1→2→2→3** (the apex wears the full Toothless three-pair swept fan — escalation that stays sleek). The
ear-fins are the top-center silhouette punctuation; cant their faces ~±10° off-sagittal so they read from
the rear (the tail-fin-cant lesson applied to the head).

## 7. Tail — keep `sweptTail` + `nightfury` style, elevate the assembly
Slim continuous stem (the `scaleTail` relief carries it), ladder: spade nub (f0) → twin finlets (f1) →
layered fins + central rudder (f2) → the full apex stealth assembly: two large splayed anhedral
stabilizers + micro support fins + a tall rudder on a stretched stem (f3 — largely as currently authored;
it is good, keep). Elevation: (a) fin faces pitch ~+15° toward the chase lens (the CP2 cant law — splayed
near-horizontal fins already read from above-behind; lock it in spec); (b) trailing rims carry the carved
fuse channel (lit on Surge only); (c) `tailFinSpread` ladder 0/0/1.0/1.2 kept monotonic.

## 8. The HONING ladder (4 forms — each rung confers withheld MESH + a sharper shape)
Form names: **f0 Night Kit · f1 Dusk Stalker · f2 Midnight Hunter · f3 Obsidian Shade (the Night itself).**
Drama targets 25 / 45 / 70 / 100.

| dial | f0 Night Kit | f1 Dusk Stalker | f2 Midnight Hunter | f3 Eternal |
|---|---|---|---|---|
| read | round black kitten-dart; huge eyes, blunt crescent stub | the stalk begins; first droop, channel to mid-spine | the hunter; full channel, first veins, rudder tail | the perfected ambush; seamless waning-moon, full circuit |
| `igniteStage` | 0 | 1 | 2 | 3 |
| span : body | 1.6× | 1.9× | 2.2× | 2.45× |
| `hullDome` | 0.4 | 0.6 | 0.8 | 1.0 |
| `tipDroop` / `clawCurl` | 0 / 0 | 0.35 / 0 | 0.7 / 0.15 | 1.0 / 0.35 |
| scallop lobes / wing | 4 | 5 | 5 | 6 |
| `fuseRun` (carved mesh) | nape notch only | 0.4 run | 1.0 run + tail stem | full circuit + fin rims |
| `veinBranch` / wing | 0 | 0 | 1 | 3 |
| `earFinPairs` | 1 | 2 | 2 | 3 |
| tail | spade nub | twin finlets | fins + rudder | full stealth assembly, `bodyStretch` 1.18 |
| eye | 38% round | 30% | 24% | 20% almond |
| body hex (DARKENS) | `0x10141f` | `0x0d111a` | `0x0b0e16` | `0x080a10` |
| `glowLevel` (Surge-side only) | 0.25 | 0.5 | 0.75 | 1.0 |
| tri target | ~1.9k | ~2.9k | ~4.1k | ~5.3k |

Every rung adds a CATEGORY: f1 = shape (droop) + carved hardware (channel, 2nd ear pair); f2 = new mesh
class (veins, rudder tail) + the fuse-run animation; f3 = sickle tips + full circuit + fin rims + stretch +
3rd ear pair. The apex is obviously superior by SHAPE-COMPLETION (only Eternal is the crescent) and by the
Surge cascade reach — never by scale alone. **The inverted value ramp:** every other dragon BRIGHTENS up
the ladder; Obsidian's body gets BLACKER (the apex is the darkest object in the game) while its withheld
circuit gets longer — the honing stated in tone. Asserts: tris monotonic; `fuseRun`/`veinBranch`/`tipDroop`
/`clawCurl`/`earFinPairs` monotonic ↑; **body value monotonic DECREASING** (its own unique assert).

## 9. Palette
- **Anchor (matte blue-black glass), per-form ramp:** `0x10141f → 0x0d111a → 0x0b0e16 → 0x080a10` (hue held
  cold blue-black; L ≤ 0.10 — deliberately below the usual 0.22 dark-body band: this IS the unlit tone
  lane). Belly slate `0x131a26` (one tier lighter so banks read); membrane ventral one tier lighter than
  dorsal.
- **Non-emissive sheen (the cruise light):** dorsal glass-streak roughness ~0.55, envIntensity 0.22 —
  moon-grey glints, never a glow. *Obsidian glints, never glows.*
- **Accent 1 (always on, tiny):** acid-green eyes `0x96d62a → 0xb6e85a` — the ONLY cruise emissive, <1%.
- **Accent 2 (Surge-only):** plasma cyan `0x1fb6e0`, `feverWing 0x38c4ee`, `feverEye 0xb0f0ff` (kept),
  `surgeHi 0x5ad0f5`, trail `0x2a5a78` → boost `0x4a90c0` (kept). Emissive-only, ≤8% surface (channel
  floors + vein grooves + fin rims + throat).
- **Zero near-white. Zero warm hues.** Two cold hues on black, one withheld — total discipline is the read.

## 10. Perf / overdraw / rear-chase visibility (baked in from round 1 — the Solar trap, PRE-solved)
Obsidian is a BIG DARK occluder whose hero mass fills the exact midline band where the horizon/obstacle
corridor lives. Apply the CP3.1–3.3 triage as PRE-conditions, not post-fixes:

1. **Ghost membranes, never the body (ghost-vs-reshape doctrine).** The one-skin hull needs a **solid-core
   mask**: inboard of ~0.35 span the skin is BODY (fully opaque — never ghosted; a translucent torso reads
   broken); outboard of 0.35 the skin is MEMBRANE and honors the wing-fade contract — `transparent:true,
   opacity 0.82–0.85`, and **single-layer** (the unified hull must NOT stack coincident dorsal+ventral
   shells in the sightline, or 0.82² ≈ 0.67 kills the fade — the CP3.2 back-face lesson; check at build).
2. **The dome stays under the look-line.** Spec: dome apex ≤ rider eye-line; with the post-CP3.1 camera
   (height 4.6 / look-y 0.5) the crescent peak sits BELOW the horizon band by construction. Assert a
   `domeClearance` check in the studio capture.
3. **The ±10° forward corridor stays empty of solid geometry AT EVERY FLAP PHASE.** Obsidian has no
   spires/rings by identity (its natural advantage), but the drooped sickle tips ride the wing pivot —
   verify with the 5-phase `flapstrip` (apex + recovery are the money frames a single shot misses, CP3.3).
   Droop points DOWN-and-outboard, so upstroke lifts tips up-and-in: if any phase crosses the corridor, the
   fix is RESHAPE (more droop / outboard bias), never ghosting a silhouette element. `spireStabilize`-style
   flap-decoupling is on the shelf if needed (opposite L/R signs; wingsymprobe Δ0.000 is the guard).
4. **Nothing spins.** No rotating landmark anywhere — the entire angular-fix failure class is avoided by
   construction.
5. **Surge glare audit.** The fuse is a bright cyan line up the center during Surge: CAP channel emissive
   intensity so the bloom halo never glare-masks the corridor (the rim-diet lesson — a bright emitter's
   levers are width and intensity, not alpha). Channel width 8–10px at chase; `feverWash` stays current.
6. **Budgets.** Tri ladder ~1.9k / 2.9k / 4.1k / 5.3k (monotonic, <6000/form; Obsidian stays the roster's
   heaviest AND THAT IS THE POINT — its budget buys CONTINUITY: the seamless skin needs loft segments where
   Solar bought regalia hardware). Transparent/additive drawables ≤8 at apex (ghosted membrane zones +
   trail + surge motes — recount honestly per the Solar ledger note). No sub-8px repeated detail: ≤6
   scallop lobes, ≤3 veins, tail micro-fins sized to clear 8px or merged.

## 11. Engine plumbing (invisible; fresh names)
Extend `js/dragonOrganism.js` (or a sibling `dragonNightShade.js` for the fuse + mats, so `organism` stays
generic). New NULLABLE dials, all default-off/null so every other `organism`/`sweptTail`/`draconic`
consumer stays byte-identical: `hullDome, tipDroop, clawCurl, scallopLobes, fuseRun, veinBranch, finRim,
earFinPairs, throatCharge, igniteStage, glowLevel`. `shadeMats(def, glow, stage)` copies only the
`sovereignMats` STRUCTURE (stage-aware factory + surge-tick wiring), never the look. Per-form changes ride
`forms[]` accretion only. Reuses invisible plumbing: recipe registry, attach contract, LOD scaler,
surface-shader compose, the `igniteStage` dial pattern, the surge/`spineMats` tick, the flap rig.

## 12. QA / gate process (required)
- **Calibrate the gate on the retired `obsidian` v1 def (recover from the #338 commit) first** (expected
  FAIL on the spectacle/ladder axes — proves the rubric bites before the new build starts).
- **Round-0 self-audit vs the §3.5 firewall:** mass = the filled one-skin mantle; dominant element = the
  mantle, with the tail assembly + ear fans as graded ranks; edges = designed soft scallops.
- **Fable veto tiles:** Solar + Phoenix + Pearl + azure black-fills, with the explicit tone question *"is
  this a third glowing dark dragon, or THE UNLIT one?"*
- **The two-state dark-sky ruling (record explicitly so no fresh chat "fixes" cruise-black by adding
  glow):** the "own the dark sky / ≥3 coloured light structures" gate is judged on a CRUISE + SURGE tile
  PAIR. Cruise must HOLD (crisp starless-hole silhouette, glass-streak glints, no shapeless void — the test
  is "does it read and hold," NOT "is it lit"). The ≥3-structures requirement is met on the SURGE tile
  (spine fuse / fin rims / wing veins = three separated cyan structures) plus the green eyes.
- **Standing gate items:** `flapstrip` 5-phase corridor check · `domeClearance` · `wingsymprobe` Δ0.000 ·
  tricount monotonic <6000 · a cruise-emissive assert (no mat except eyes has intensity > ε at rest) · a
  body-value-monotonic-DECREASING assert · a zero-near-white assert · span:body ≤ 2.5.
- **Tests:** a new-key `tests/starters.mjs` block mirroring the premium 4-form assert pattern.

## SETTLED (do not re-litigate)
- **REINTRODUCE FRESH as a new roster key** (working `obsidianShade`) on the surviving one-skin organism
  builders (`organismTorso`/`organismWings`) — `obsidian` + `obsidian2` were retired in #338, so there is
  no live def to elevate and no legacy geometry to resurrect. Author fresh (the Solar/Phoenix pattern);
  coexist → prove on the chase cam → owner-gated roster placement. Nothing currently shipped changes.
- **L31 rulings:** matte finish (metal 0, rough 0.82, env ~0.2), span:body ≈ 2–2.5×, whole-creature scale
  relief, NO shingle plates, `scaleTail`.
- **"No glowing seams" is a CRUISE law; the Night Surge is its DESIGNED exception** — the identity says
  plasma is held back FOR the Surge, so on Surge the whole circuit shows.
- **Zero near-white** is a deliberate identity choice (the cap is a ceiling; zero is fine), not an omission.
- **Body value DECREASES up the ladder** (the apex is the darkest object in the game).

## Open owner calls (flag on the build PR)
1. **Boost fuse pre-taste** — a single dim fuse-flicker (≤30% intensity, ~0.4s decay) on boost so players
   glimpse the withheld system between Surges. **Default OFF** if it dilutes the withholding.
2. **Roster placement + key name** — the new key's final name (working `obsidianShade`) and whether it takes
   a fresh roster slot or a retired one, at introduction time.
3. **The dive-fold boost tuck** — motion; the human judges feel on the live preview.
4. **How dark is too dark** — the black hull vs a bright canyon biome; rides the PR preview.

---

## CHANGELOG
- **v0 (design synthesis → sheet).** Authored from the Fable synthesis: identity "NIGHT worn as the skin"
  / "The Starless Crescent"; hero = the one-skin MANTLE (center-peak monotonic-droop crescent, the inverse
  of Solar's M); motif = THE FUSE (carved plasma circuit, cruise-geometry-only → Surge cascade); the HONING
  ladder (withheld-mesh conferral + the inverted, darkening value ramp); zero near-white; rear-chase
  visibility pre-solved (solid-core mask, dome clearance, flapstrip corridor, no spinners). Build vehicle:
  REINTRODUCE fresh as a new roster key on the surviving organism builders (`obsidian`/`obsidian2` retired
  in #338). Next: introduce the new-key stub + calibrate the Fable gate on the veto tiles, then build the
  torso/wing profile + fuse geometry increment-by-increment behind the nullable dials.
