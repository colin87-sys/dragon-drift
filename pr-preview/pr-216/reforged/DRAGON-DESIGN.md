# DRAGON-DESIGN.md — The Starter Redesign Playbook (aesthetics first)

This is the player-dragon analog of `BOSS-DESIGN.md`: the design law, the trio
registry, the per-dragon build sheets, and the gate protocol for rebuilding the
three starter dragons (`azure`, `ember`, `jade`) in place, on their existing keys.

**PRIME DIRECTIVE — AESTHETICS FIRST.** If a form is not beautiful and
eye-appealing, it is a failure, regardless of tests passing. The shipped starters
follow older methods that produced visually inferior dragons; do NOT imitate the
shipped azure/ember/jade geometry choices. Wings are the HERO feature of every
dragon: unique architecture per starter, and beautiful without exception —
never unique at the cost of beauty.

Read alongside: `MODEL-CREATION.md` (blueprint grammar + verification loop),
`CREATURES.md`, and `BOSS-DESIGN.md` §2 (budget truths) / §7c (studio-gate
process). The boss playbook contributes PROCESS; its front-on emblem styling
does NOT transfer (see §1).

---

## §1 The canvas: rear chase camera, sunlit dorsal, mobile budget

- Dragons are seen from BEHIND at ~95% (chase camera), rear-3/4 during banks,
  plus the shop turntable and the tier-up reveal. The DORSAL side, the WING TOP
  surface, and the TRAILING EDGE are the primary canvas. The face matters in
  the turntable/inspect view and the tier-up moment.
- Unlike bosses, the sun DOES shade the dragon's dorsal surfaces — geometry
  relief (ribs, staggered planes, camber) is rewarded with real shading. Value
  hierarchy should be painted AND sculpted.
- Budget: ≤ 6,000 static tris per form on HIGH (mobile), 13,000 on ULTRA
  (`tools/tricount.mjs`). Per BOSS-DESIGN §2: tris are cheap, draws are cheap,
  OVERDRAW is the cliff — never wrap the body or wings in an enclosing
  additive/fresnel shell; membranes use surface shaders (`composeSurface`,
  `applyFresnelRim`), not stacked glow volumes.
- Target allocation per starter (guideline, not a straitjacket):
  hatchling ~2,000–2,800 · adolescent ~3,200–4,200 · apex ~4,500–5,800.
  The apex must read VISIBLY richer than the adolescent — spend the ceiling.

## §2 The aesthetic law set (every form, every dragon)

Each law is numeric where possible; the per-sheet asserts (§7) encode the
measurable ones, the gate (§8) judges the rest in pixels.

1. **Silhouette-first.** Every form must read as an appealing solid-black fill
   from the chase camera AND in side profile. One connected component (no
   floating parts in silhouette). Wings must NOT fully overlap the body
   outline — negative space between wing, neck and tail is part of the design.
2. **Line of action.** The spine follows a C or S curve with ≥1 inflection in
   the idle pose. A straight nose-to-tail axis is forbidden. Neck arcs one
   way, tail counter-arcs.
3. **Big–Medium–Small.** Mass hierarchy ~60/30/10 (body : wings+tail : head
   + accents, per silhouette area from the judging camera). Never split any
   two adjacent masses 50/50; adjacent major-mass ratios target ~1.6 (avoid
   the dead 0.9–1.1 band).
4. **Taper law.** Every neck, tail, limb, horn, whisker and wing finger tapers
   monotonically; tip radius 10–20% of base radius. No constant-radius tubes
   ("sausage" fail).
5. **Repetition with variation.** Any repeated series (ridges, spikes, wing
   fingers, fin lobes, scallops) varies size by ~×0.8 per step or follows a
   swell-then-taper curve. Equal size + equal spacing = "sawtooth" fail.
6. **Curve-vs-straight contrast.** Every silhouette region pairs a straight or
   taut edge against a curved one (straight leading spar / curved sail;
   straight horn / curved crest). Matching-radius curve pairs read dead.
7. **No tangents.** Major forms either clearly overlap or leave a clear gap —
   a wingtip grazing the tail line or a horn kissing the wing edge flattens
   the read.
8. **Detail hierarchy.** Detail clusters (dense at head, wing roots and
   joints; sparse on large masses). Uniform noise everywhere = fail.
9. **Palette discipline.** Per line: ONE anchor hue + ONE accent, held across
   all three forms; ≤3 base diffuse tones + 1 emissive accent. Accents live on
   EDGES, RAYS and TIPS (the 10%), never on broad masses. Identity hue may be
   carried in emissive; diffuse stays controlled so nothing reads toy-colored.
10. **Life over symmetry.** Perfect L/R pose symmetry in idle reads dead —
    the flap rig's phase/lag already breaks it; keep it. NO scar law for
    player dragons: distinctness comes from design, never from damage.
11. **Painted + sculpted depth.** 2–3 value tiers on the wings and body
    (leading/upper brightest → root/under darkest) AND real relief (ribs,
    staggered planes, camber). One flat material on a large surface =
    "flat sticker" fail.

## §3 The WING LAW (the hero feature)

Architecture per starter differs (see registry §5) but ALL wings obey:

- **Fingers, not mittens.** 4–5 finger rays (plus the leading arm), with REAL
  gaps/notches visible in silhouette at fight distance — separated elements
  or deep V-notches, never shallow dips in a continuous sheet. The shipped
  `membrane` wing with `flame:false` is the canonical mitten — banned as-is.
- **Finger progression.** Rays fan from a leading-edge arm (never sunburst
  from one point); lengths swell then taper across the fan (~0.8–0.85 scale
  per digit after the longest); every ray tapers to a point.
- **Leading edge thick, trailing edge thin.** A beveled spar with real volume
  plus a propatagium fillet at the elbow (no sharp V); spar : membrane
  thickness reads ≥10:1.
- **Trailing-edge scallop** sag 0.15–0.25 of the inter-finger span
  (0 = cheap flat; >0.35 = tattered, only if the identity demands it).
- **Majesty ratios (apex form).** Wingspan 2.5–3.5× body length; single-wing
  area ≈ 0.8–1.2× the body's side-profile area. "Backpack wings" = fail.
  Sweep 15–35° back; dihedral 10–25° up in glide.
- **Camber.** The membrane/sail is a curved surface, never a flat quad —
  `wingBillow` or per-builder camber so rim light catches it.
- **Rim beauty.** Fresnel rim / backlit emissive on the membrane with darker
  strut rays reading through it; gradient toward the tips (existing
  `applyFresnelRim` + vertex-color gradient path). Ribs/edges are geometry,
  not additive line decals.
- **Two-tone membrane.** Dorsal vs ventral tones differ (`wingInner` /
  `wingOuter` already exist — USE the contrast; the shipped starters barely do).
- **The fold must change the silhouette.** Banks/dives visibly contract the
  span (flap rig fold), not merely rotate panels in place.

## §4 The growth arc: hatchling → adolescent → apex

Starters cap at Radiant → exactly THREE visible forms (`forms[0..2]`,
tier 0/1/2). Form 3 entries stay for grammar compatibility but are
unreachable on starters.

**The bloom rule (Bulbasaur law).** Each line carries ONE motif whose anchor
position and base hue NEVER move across forms; only its scale, detail and
count grow (≈0.3 → 0.6 → 1.0 of final glory). The hatchling must visibly hint
at the apex. "Motif drift" (moved/re-hued motif) and "same-dragon-bigger" (a
ladder that only scales) are both fails.

**Monotonic dials.** Every proportion below moves one direction only across
the three forms:

| Dial | Hatchling (0) | Adolescent (1) | Apex (2) |
|---|---|---|---|
| Head : body length | ~1:2.2 | ~1:3.5 | ~1:5.5–1:7 |
| Eye fraction of head side-area | 16–22%, round, low-set | ~10–12% | 5–8%, almond, higher |
| Snout projection | near-flat | short | pronounced |
| Neck | fused/stub (`neckSegments` low) | taper appears | long, defined S |
| Wing finger stubbiness | short, rounded tips ok | lengthening | full taper law |
| Wingspan : body length | ~1.4–1.7× (big-for-body, stub-fingered) | ~2.0–2.3× | 2.5–3.5× |
| Spine gesture | curled, chest-down | straightening | proud upright S |
| Pointiness (horns/spikes/claws) | ~0, all-convex forms | few, soft | many, mixed curvature |
| Palette | lighter value, softer saturation | mid | value down, saturation up, luminous tips |

Existing machinery: `ascension.js` `SIZE_RAMP`/`WING_RAMP` handle global
scale; the PROPORTION shifts ride per-form dials (`headScale`, `eyeScale`,
`neckSegments`, `tailSegments`, wing dials — all `forms:true` capable or
per-form via `forms[]` accretion). Where a needed dial is missing (e.g.
spine-curl / posture, snout length on the chosen head builder), that is an
ENGINE NEED on the sheet — extend the grammar, never hack around it.

**Charisma carriers.** Pupil/eye treatment is the cute↔fierce master dial:
hatchling = large round low-set eye (guard: oversized reads "googly" — gate
judges it), apex = narrowed, brighter, higher-set. Eyes are the brightest
facial point in every form.

## §5 The trio registry (anti-collision — locked before any build)

No two starters may share more than one cell in any column pair. Wing
architecture is the headline differentiator. Keys, rarity, cost, stats and
elemental hue families are CONTRACT (saves + shop) — do not change them.

| Axis | AZURE — "Skylark Drake" | EMBER — "Cinder Wyrm" | JADE — "River Serpent" |
|---|---|---|---|
| Key / rarity / cost | `azure` / R / 0 | `ember` / SR / 600 | `jade` / SR / 1200 |
| Fantasy | swift sky courier — falcon energy | forge-born bruiser — magma energy | river-wind dancer — koi/eastern energy |
| Body plan | compact avian glider: short body, deep keel chest, long swept wings | stocky broad wyrm: heavy shoulders, thick neck, short powerful tail | long sinuous serpent: body IS the silhouette, small elegant fins |
| Silhouette primitive | △ swept arrow/dart | □ anvil/block masses | ○ flowing S-ribbon |
| Wing architecture (HERO) | **swept blade-feather comb**: high-aspect falcon wing — leading arm + 5 separated tapering feather-blades, z-staggered, painted value tiers (`feather`/`nightFuryWings` lineage, NOT plain `membrane`) | **broad-chord ember membrane**: bat-wing — thick beveled spar, 4 gapped finger rays with raised ribs, deep scallops, ember-lit rays through a dark membrane (`nightFuryWings`/`skinnedMembrane` lineage + new ray treatment) | **silk fin sails**: NOT a bat wing — 3–4 overlapping translucent koi-fin lobes per side, long flowing trailing streamers, rim-lit gradient (`seraphWing`/`sideFins`/`plume` lineage) |
| Motif (fixed anchor, blooms 0.3→0.6→1.0) | **brow crest**: single feather-nub → swept crest fan of blades (head, gold-tipped) | **tail ember**: dull coal glow at tail tip → blazing tail brazier with spike corona (Charmander law, done our way: geometry grows too, not just glow) | **chin pearl**: tiny pale bead under the jaw → luminous river-pearl cradled by whiskers |
| Palette (anchor + accent, all forms) | sky-blue anchor `~0x8ed5ff` family + GOLD accent on blade tips/crest | deep cinder anchor (near-black warm body) + LAVA accent `~0xff8b2a` in emissive rays/tail | jade anchor `~0x79e2b7` family + PEARL/white-gold accent on fin rims/pearl |
| Eye character | bright, alert, round→keen | small, hot, deep-set | calm, long, painterly |
| Stats/fx (unchanged) | 1.0 across; aura `142,213,255` | speed 1.04, handling 1.06, drain 0.95, regen 1.05; aura `255,139,42` | speed 1.07, handling 1.11, drain 0.9, regen 1.1; aura `121,226,183` |

Distinctness self-test: black-fill thumbnails of the three apexes must be
instantly tellable apart by body plan alone; the three wing silhouettes must
be tellable apart with the bodies hidden.

## §5d Build sheets

A sheet is the builder's contract. Extend, never rebuild: reuse registered
part builders and the flap rig (`dragonWingFlap.js`/`wingFlapSolver.js`);
new builders self-register and touch nothing shipped. Colors below are
starting hexes — the gate may direct tuning.

### AZURE — "Skylark Drake" (slot A) — branch `claude/azure-rebuild`
- **Torso** `avian` (or `sweptLoft` if avian fights the keel): deep keel
  chest, short coupled body, the arrow read. Body `0x1c3048` family kept.
- **Wings (hero)**: new builder `bladeFeatherWings` (lineage: `feather` +
  ASHTALON comb lessons). Leading arm spar (beveled, `horn`-toned) sweeping
  ~25–30° back; 5 feather-blades per wing, roots marching along the arm,
  lengths swelling mid-fan then tapering (longest ≈ span×0.55), each blade a
  cambered plane with a raised central rib, z-stagger ≥0.12, visible gaps
  ≥0.15× blade width. Value tiers: leading blades lightest sky, root coverts
  darkest. Gold `0xd9b36a` ONLY on blade tips + crest.
- **Head** `draconic` with round large eye at form 0 per §4 table; brow-crest
  motif anchor above the eyes.
- **Tail** `clean`→`finned`; forked banner at apex (kite/swallow energy, echoes
  the wing blades).
- **Forms**: 0 = round-chested fluffball glider, stub blade-nubs (comb already
  separated — even stubs have gaps), crest nub; 1 = blades lengthen, crest
  3-blade fan; 2 = full high-aspect span (2.8–3.2× body), crest fan, forked
  banner tail, gold tips alight (spineGlow ≤0.3 — restraint IS the read).
- Tri targets: ~2.4k / ~3.8k / ~5.2k. Engine needs: blade-comb wing builder;
  per-form crest scale.

### EMBER — "Cinder Wyrm" (slot B) — branch `claude/ember-rebuild`
- **Torso** `arrow` (broadened via `shoulderWidthScale` ~1.4) or `hullTorso`:
  anvil shoulders, thick short neck. Near-black warm body `0x1c0d08` family;
  lava lives in EMISSIVE only (no toy-orange diffuse).
- **Wings (hero)**: new/extended `emberMembraneWings` (lineage:
  `skinnedMembrane` + gapped-finger surgery). Thick beveled leading spar +
  propatagium fillet; 4 finger rays as REAL geometry tubes (taper to points,
  ~0.82 per-digit scale) with raised ribs; membrane panels BETWEEN rays with
  deep scallops 0.22–0.3 and true V-gaps at the outer two rays; dark membrane
  `0x2a1208` dorsal / `0x180a06` ventral with ember gradient toward the rays
  (`glowSeams` vein path — rays glow, panels stay dark). Broad chord: span
  ~2.5× body but area at the top of the band.
- **Head** `horned`, heavy brow, 2 horn pairs at apex; deep-set small hot eyes.
- **Tail**: short, thick, ends in the MOTIF — ember tip: coal nub (form 0,
  emissive 0.25) → cracked ember knob (1) → blazing brazier tip with a spike
  corona (2), emissive `0xff8b2a→0xffb347` gradient, the single brightest
  point on the dragon.
- **Forms**: 0 = round pot-bellied cinder pup, stub wings (still gapped
  fingers), coal tail-nub; 1 = shoulders square up, rays lengthen, horns bud;
  2 = anvil apex, backSpines, full broad wings, brazier tail.
- Tri targets: ~2.6k / ~4.0k / ~5.6k. Engine needs: gapped-finger membrane;
  tail-tip motif socket (per-form emissive + geometry swap).

### JADE — "River Serpent" (slot C) — branch `claude/jade-rebuild`
- **Torso** `serpent` (or `crystalSerpent` spine logic for the coil): the BODY
  is the hero silhouette — long S line of action enforced in idle
  (`neckSegments` 7→9, `tailSegments` 10→13 across forms). Jade body
  `0x123026` family, belly `0xe8ffd0` kept.
- **Wings (hero)**: new builder `silkFinWings` (lineage: `seraphWing` chord
  logic + `sideFins` + `plume`). NOT a bat wing: 3–4 overlapping translucent
  fin LOBES per side (koi/veiltail), each lobe an independently cambered,
  rim-lit petal with a darker leading ray, lobe sizes ×0.8 progression,
  trailing streamers off the rear lobe; fresnel rim + tip gradient toward
  pearl-white. Span stays modest (~2.2–2.5× at apex — the SERPENT reads as
  reach) but area/beauty carries the majesty; fold = lobes furl like a fan.
- **Head** `draconic` slim variant; whiskers from form 1 (taper law applies);
  calm long eyes. MOTIF under the jaw: pearl bead → held pearl → luminous
  river-pearl cradled by whisker curls (soft `0xeafff4` glow, the line's
  brightest point).
- **Tail**: `plume`/finned — flowing veil fin at apex echoing the wing lobes.
- **Forms**: 0 = chubby short river-pup, big eyes, tiny fin-buds (already
  lobed), pearl bead; 1 = body lengthens, lobes unfurl, whiskers bud;
  2 = full S-ribbon glory, 4 lobes + streamers, veil tail, pearl radiant.
- Tri targets: ~2.3k / ~3.9k / ~5.4k. Engine needs: fin-lobe wing builder;
  pearl motif socket; per-form body-length dials (exists: neck/tailSegments).

## §6 Engine needs (shared, land with the first slot that hits them)

1. **Wing builders** per §5d (blade comb / gapped membrane / silk fin) —
   self-registered, riding the existing flap solver contract
   (`wingPivotL/R`, `wingRigL/R`).
2. **Per-form proportion dials** confirmed `forms:true` end-to-end:
   `headScale`, `eyeScale` (grammar has them; verify `forms[]` accretion
   reaches the head builder), plus a **posture/spine-curl dial** for the
   hatchling curl if the torso builders lack one.
3. **Motif socket pattern**: a named anchor (`motifAnchor`) each build
   publishes, so per-form motif geometry swaps in one place and asserts can
   check anchor invariance.
4. **Eye rig**: per-form eye size/shape/emissive already partially exist —
   confirm round→almond shape control on the chosen head builders; extend
   `dragonHead`/`dragonDraconicHead` if needed.

## §7 Per-sheet geometry asserts (`tests/starters.mjs`, new)

Headless, built via `buildDragonModel` + `ascendedDef` per form. Shared
asserts for all three starters, all reachable forms:
- Head:body length ratio inside the §4 band for that form; monotonic across forms.
- Eye scale monotonic decreasing (relative to head) across forms.
- Wingspan:body ratio inside the sheet's band per form; monotonic increasing.
- Wing element count ≥4 separated elements (blades/rays/lobes) with measured
  gaps > 0 in the planform; element lengths non-equal (progression present).
- Every tapered chain (tail, neck, fingers/lobes): tip section ≤25% of base.
- Spine line of action: idle pose has ≥1 inflection (sample spine nodes).
- Motif anchor world-position drift ≤0.15 units across forms; motif bounding
  volume monotonic increasing.
- Tri budget per form within sheet targets ±20% and under the 6,000 ceiling
  (`tricount` remains the hard gate).
- Palette: ≤3 base diffuse hues + 1 emissive accent per form (hue-bucket the
  materials); accent hue within ±20° of the line's registered accent.

## §8 The gate protocol (aesthetics gate — the reason this rebuild exists)

Process is the boss playbook's, restyled for dragons:
1. Suites green first: `node tests/blueprint.mjs`, `node tools/tricount.mjs
   --ci`, `node tests/flapcheck.mjs`, `node tests/starters.mjs`.
2. **Studio first**: `node tools/tiershots.mjs <key>` (all forms, fixed
   framing) + side/rear-3/4 crops per form. Auto-framing hides scale
   failures — include at least one TRUE-SCALE pair (two forms rendered at
   their real relative sizes in one frame).
3. Spawn a FRESH gate agent (model `fable`) per round with the verbatim GATE
   PROMPT below + capture paths + tri counts (+ prior directives for rounds
   ≥2). The builder NEVER judges its own output. Quote verdicts verbatim.
   FAIL → apply the numbered directives exactly, re-capture, fresh gate.
   After ~4 rounds of churn: consolidate all directives into one frozen
   numbered work order before iterating further (MARROWCOIL law).
4. In-game captures second (chase camera, banks, tier-up) judge INTEGRATION.
5. Human judges motion/feel on the PR preview. Merge verdict is human.

Checkpoints per slot: **CP1** = apex form body+wings first built (before
form-ladder work) — crops: rear chase, side profile, rear-3/4 bank, wing
planform. **CP2** = all three forms + ascension ladder — those plus the
true-scale trio frame, turntable face crop per form, and the black-fill
silhouette triptych. STOP for the user's go after each checkpoint PASS.

### Failure classes (the gate's vocabulary)
MITTEN (filled web, no gaps) · BACKPACK WINGS (undersized) · SAUSAGE (no
taper) · SUNBURST (rays from a point, no arm march) · SAWTOOTH (equal
repeats) · FLAT STICKER (one material, no tiers/relief) · TANGENT ·
GOOGLY (hatchling eyes over the cute line into cheap) · SAME-DRAGON-BIGGER
(forms only scale) · MOTIF DRIFT (anchor/hue moves) · TOY-COLOR (saturated
diffuse on broad masses) · DEAD SYMMETRY (matching-curve pairs, static
identical wings) · STRAIGHT SPINE (no line of action).

=========================== GATE PROMPT (verbatim) ===========================
You are the independent AESTHETICS GATE for Dragon Drift's starter-dragon
rebuild, spawned with fresh eyes. Trust nothing you were told beyond this
prompt: read the capture PNGs at the provided paths yourself, and read
reforged/DRAGON-DESIGN.md §2 (aesthetic laws), §3 (wing law), §4 (growth
arc), the §5 registry row and §5d build sheet for THIS dragon, and §8's
failure classes. If any capture is ambiguous or auto-framed where a
true-scale frame was required, your verdict is a demanded re-capture, not a
judgment.

PRIME DIRECTIVE: aesthetics first. This gate exists because the previous
starters passed every functional test and still looked inferior. A dragon
that is merely correct FAILS. Ask of every frame: is this beautiful? Would a
stranger screenshot it unprompted? Does the wing read as the hero feature?

Judge HARSHLY against: the registry silhouette one-liner for this dragon;
the wing law (fingers-not-mitten, gaps visible at distance, thick spar/thin
membrane, scallop 0.15–0.25, swell-then-taper progression, camber + rim
light, value tiers); the growth arc (form 0 genuinely CUTE per the §4 dial
table without going googly; forms must differ in PROPORTION and FEATURES,
not just scale; the motif anchored and blooming); the aesthetic laws
(S-curve line of action, 60/30/10 hierarchy, taper law, no tangents, no
sawtooth, palette discipline with accents on edges/tips only); and the trio
test when trio frames are provided (three black fills must be instantly
distinct by body plan AND by wing silhouette alone). Score silhouette
appeal, line of action, taper/shape contrast, wing majesty, membrane/fin
detail, hierarchy, color/rim beauty, and life 0–5 each: any axis ≤2 is an
automatic FAIL; average <4.0 is a FAIL for a starter rebuild whose entire
purpose is beauty. Builder self-reports run generous — assume flaws exist
and hunt for them in the pixels, especially: gaps that closed at distance,
trailing edges that went straight, accents bleeding onto broad masses,
hatchlings that read as shrunken adults.

Return exactly one of:
- "PASS — proceed" (optionally with polish notes), or
- "FAIL" + NUMBERED surgical directives (specific parts, numbers, hexes —
  the builder applies them verbatim).
Your entire final message is the verdict. Do not soften it.
==============================================================================

## §9 Ground rules for builder sessions (session-history law)

- Develop each slot on its own branch off `claude/dragon-design-opus-fable-8xanvb`;
  keep keys/`rarity`/`cost`/`stats`/`fx.auraColor` untouched; `forms[]` stays
  accretive; never break a non-starter dragon (run the full `tricount` +
  `blueprint` roster gates, not just your key).
- Every command in the FOREGROUND. No `git stash` / `checkout --` / `reset`.
  Commit small, push often.
- If this doc conflicts with the code, STOP that step and report — never
  improvise schema changes.
- Extend, never rebuild: new part builders self-register; shipped builders
  and other dragons' geometry are read-only.
- Append a LEAPFROG lesson after every meaningful change.
