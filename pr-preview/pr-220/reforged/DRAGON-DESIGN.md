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

**PRECEDENCE RULE.** Where a §5d build sheet gives a number, the SHEET is the
sanctioned authority and overrides the shared bands in §2–§4. The shared laws
define the default; the sheets carry the per-dragon exceptions, each with its
one-line rationale. Tests (§7) and the gate (§8) judge against the sheet.

Read alongside: `MODEL-CREATION.md` (blueprint grammar + verification loop),
`CREATURES.md`, and `BOSS-DESIGN.md` §2 (budget truths) / §7c (studio-gate
process). The boss playbook contributes PROCESS; its front-on emblem styling
does NOT transfer (see §1).

---

## §1 The canvas: rear chase camera, sunlit dorsal, mobile budget

- Dragons are seen from BEHIND at ~95% (chase camera), rear-3/4 during banks,
  plus the shop turntable and the tier-up reveal. The DORSAL side, the WING TOP
  surface, and the TRAILING EDGE are the primary canvas. The face matters in
  the turntable/inspect view and the tier-up moment. Anything whose beauty
  lives only under the jaw or belly is invisible in play — motifs need a
  rear-visible carrier (see jade, §5d).
- Unlike bosses, the sun DOES shade the dragon's dorsal surfaces — geometry
  relief (ribs, staggered planes, camber) is rewarded with real shading. Value
  hierarchy should be painted AND sculpted.
- Budget: ≤ 6,000 static tris per form on HIGH (mobile), 13,000 on ULTRA
  (`tools/tricount.mjs`). Per BOSS-DESIGN §2: tris are cheap, draws are cheap,
  OVERDRAW is the cliff — never wrap the body or wings in an enclosing
  additive/fresnel shell, and cap alpha-blended overlap at ≤2 layers per pixel
  on any large screen-space element (this constrains jade's lobes, §5d).
  Membranes use surface shaders (`composeSurface`, `applyFresnelRim`), not
  stacked glow volumes.
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
3. **Mass hierarchy (per view).** From the SIDE profile: body 55–65% of
   silhouette area, wings+tail 25–35%, head+accents ~10%. From the REAR-chase
   glide: wings 50–65%, body 25–40%, head+accents ≤10% (jade exception,
   sheet-sanctioned: wings+fins 30–50%, body 40–60% — the serpent IS the
   silhouette). Never split any two
   adjacent masses 50/50; adjacent major-mass ratios target ~1.6 (avoid the
   dead 0.9–1.1 band).
4. **Taper law.** Every neck, tail, limb, horn, whisker and wing element tapers
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
   all three forms; ≤3 base diffuse tones + 1 emissive accent per form.
   VALUE may ramp across forms (lighter hatchling → deeper apex) while the
   HUE holds. Accents live on EDGES, RAYS and TIPS (the 10%), never on broad
   masses. Identity hue may be carried in emissive; diffuse stays controlled
   so nothing reads toy-colored. Registered accents (machine-readable — also
   set `def.accentHue` so tests and the gate share ground truth):
   | line | accent hex | hue | carrier |
   |---|---|---|---|
   | azure | `0xd9b36a` gold | ~39° | DIFFUSE tip-paint ONLY — zero accent emissive on wings |
   | ember | `0xff8b2a` lava | ~27° | EMISSIVE ONLY on a near-black body — zero warm accent diffuse |
   | jade  | `0xeafff4` cool pearl | ~149° | rim gradient + pearl glow — iridescent-cold, never warm |
   Azure and ember are 12° apart in hue; the carrier rule (diffuse-only vs
   emissive-only) is what separates them — §7 asserts it.
10. **Life over symmetry.** Perfect L/R pose symmetry in idle reads dead —
    the flap rig's phase/lag already breaks it; keep it. NO scar law for
    player dragons: distinctness comes from design, never from damage.
11. **Painted + sculpted depth.** 2–3 value tiers on the wings and body
    (leading/upper brightest → root/under darkest) AND real relief (ribs,
    staggered planes, camber). One flat material on a large surface =
    "flat sticker" fail.
12. **Rarity ceiling.** Starters never use `glowSeams`, `wingVeins`, halos,
    `auraIdle > 0` or `sparkle`; `spineGlow` ≤ 0.32; at MOST one emissive
    bloom point per dragon, and if present it is the motif (azure's motif is
    deliberately diffuse-only — its bloom allowance goes unused; the eyes
    stay the brightest facial points, not a bloom). Premiums keep the fx drama — starters
    win on FORM. This supersedes the shipped "smallest, narrowest wings so
    premiums feel rare" comment on azure (update that comment when the build
    lands): starters may have beautiful, majestic wings; what they may not
    have is premium GLOW.

## §3 The WING LAW (the hero feature)

### Universal clauses (all three architectures)
- **Swell-then-taper progression.** Elements (blades/rays/lobes) fan from a
  leading-edge arm or root arc — never sunburst from one point; lengths swell
  then taper across the fan (~0.8–0.85 scale per element after the longest);
  every element tapers to a point (law 4).
- **Leading-edge visual weight.** The leading edge carries clear thickness /
  structure against a visibly thinner trailing side.
- **Camber.** Every wing surface is curved (billow/cup), never a flat quad —
  rim light must catch it.
- **Rim beauty.** Fresnel rim / backlit emissive with darker structure reading
  through it; gradient toward the tips (`applyFresnelRim` + vertex-color
  gradient). Ribs/edges are geometry, not additive line decals.
- **Two-tone surfaces.** Dorsal vs ventral tones differ (`wingInner`/
  `wingOuter` exist — USE the contrast; the shipped starters barely do).
- **The fold must change the silhouette.** Banks/dives visibly contract the
  span, not merely rotate panels in place (§7 asserts measured contraction).
- **Painted value tiers.** 2–3 tiers across the wing per law 11.

### Per-architecture clauses (the sheet's numbers govern — §7 reads these)
| | AZURE — blade-feather comb | EMBER — rays + membrane | JADE — silk fin lobes |
|---|---|---|---|
| Elements | 5 separated feather-blades + leading arm | 4 finger rays + membrane panels | 3 lobes (forms 0–1) → 4 lobes (apex) |
| Separation metric | true gaps ≥0.15× blade width, z-stagger ≥0.12 | deep scallops 0.22–0.30 + true V-gaps ≥0.15× span at the outer two rays | overlap permitted; tip NOTCHES separate the outer 40% of each lobe, notch depth ≥0.3× lobe length |
| Spar/membrane | n/a (blades ARE the structure); blade-tip rake 15–25° back | beveled spar + propatagium fillet; spar:membrane thickness ≥10:1 | darker leading ray per lobe; lobes tilted ≥40° above horizontal (tall koi fans, NOT flat vanes) |
| Scallop | n/a | 0.22–0.30 (sheet-sanctioned above the 0.15–0.25 default) | n/a |
| Apex span : body | 2.8–3.2× | 2.5–2.9× (broad chord ≥1.3× toothless's carries the area) | 2.2–2.5× — sanctioned: the SERPENT reads as reach; the fins carry the beauty |
| Apex single-wing area : body side-area | 0.8–1.1× | 0.9–1.2× | 0.35–0.55× |
| Sweep / dihedral (glide) | 25–30° back / 12–20° up | 15–25° back / 10–18° up | lobes raked 30–45° back / fan tilt ≥40° |
| Motion path (declared — §7 asserts the rig parts exist) | direct `wingPivotL/R` drive + per-blade lag pivots (ASHTALON covert pattern) | skinned `wingRigL/R` shoulder→elbow→wrist + `flapWing` (nightFury pattern) | direct `wingPivotL/R` + per-lobe furl pivots (fan-fold) |

Default bands for anything a sheet doesn't override: 4–5 elements, scallop
0.15–0.25 (>0.35 = tattered), apex span 2.5–3.5×, sweep 15–35°, dihedral
10–25°. "Backpack wings" (undersized for the sheet's band) = fail.
NOTE: `tests/flapcheck.mjs` gates only `model.flap` (yoke-solver) dragons —
none of the three starters ride that path, so flapcheck is NOT evidence the
starter wings move well; the §7 fold-contraction assert and the gate's motion
judgment are.

## §4 The growth arc: hatchling → adolescent → apex

Starters cap at Radiant → exactly THREE visible forms (`forms[0..2]`, tier
0/1/2). `forms[]` stays length 3 — do NOT add a `forms[3]`. (`wingForms[3]`
entries may remain for grammar compatibility.)

**The bloom rule (Bulbasaur law).** Each line carries ONE motif whose anchor
position and base hue NEVER move across forms; only its scale, detail and
count grow (≈0.3 → 0.6 → 1.0 of final glory). The hatchling must visibly hint
at the apex. "Motif drift" (moved/re-hued motif) and "same-dragon-bigger" (a
ladder that only scales) are both fails.

**Monotonic dials.** Every proportion moves one direction only across the
three forms. Shared bands below; the per-line bands in parentheses are the
sheet values §7 asserts against:

| Dial | Hatchling (0) | Adolescent (1) | Apex (2) |
|---|---|---|---|
| Head : body length | 1:2.0–1:2.6 (jade 1:2.8–1:3.2) | 1:3.0–1:4.2 (jade 1:4.5–1:5.5) | azure 1:4.8–1:6.0 · ember 1:4.5–1:5.5 · jade 1:7.5–1:9.5 |
| Eye diameter : head length | 33–40%, round, low-set | 22–28% | 14–18%, almond, higher |
| Snout projection | near-flat | short | pronounced |
| Neck | fused/stub (`neckSegments` low) | taper appears | long, defined S |
| Wingspan : body length | 1.4–1.7× (jade 0.9–1.2×) | 2.0–2.3× (jade 1.8–2.1×) | per §3 table |
| Spine gesture | curled, chest-down | straightening | proud upright S |
| Pointiness (horns/spikes/claws) | ~0, all-convex forms | few, soft | many, mixed curvature |
| Palette | lighter value, softer saturation (hue holds — law 9) | mid | value down, saturation up, luminous tips |

**Machinery (what exists, with the real numbers).** `ascension.js` applies
`forms[0..tier]` cumulatively onto `d.model` — model KNOBS only, never
`parts.*` (see §5d global rule). The shared `SIZE_RAMP`/`WING_RAMP` contribute
only 0.86→0.97 relative wing growth (~1/7th of the §3 arc); the rest of the
span ladder rides per-form `wingScale` in `forms[]` and per-form planform
params in the new wing builders — or an explicit per-form
`bodyScale`/`wingSpan` curve, which `ascendedDef` already honors over the
shared ramps (the Obsidian mechanism, `ascension.js:143–148`). Per-form values
work for ANY `model.*` knob via `forms[]` accretion, but only knobs flagged
`forms:true` in `creatureGrammar.js` are range-checked per form — flagging
`headScale`/`eyeScale`/`wingScale` (+ the wing-shape dials the sheets vary) is
an engine need (§6). The genuinely missing dial is POSTURE/spine-curl (no
torso builder has one — §6); head machinery largely exists on `draconic`
(`headScale`, `snoutScale`, `snoutType`, `headArchetype` presets,
`browIntensity`, `whiskerFins` via `OVERRIDE_KEYS`,
`dragonDraconicHead.js:293–297`) — the real head gap is round-vs-almond eye
SHAPE (the draconic eye zone is fixed almond).

**Charisma carriers.** Pupil/eye treatment is the cute↔fierce master dial:
hatchling = large round low-set eye (33–40% of head length; past ~45% reads
"googly" — gate judges it), apex = narrowed, brighter, higher-set. Eyes are
the brightest facial point in every form.

## §5 The trio registry (anti-collision — locked before any build)

No two starters may share more than one cell in any column pair. Wing
architecture is the headline differentiator. Keys, display names, rarity,
cost, stats and elemental hue families are CONTRACT (saves + shop) — do not
change them.

| Axis | AZURE — "Azure Drake" | EMBER — "Ember Wyrm" | JADE — "Jade Serpent" |
|---|---|---|---|
| Key / rarity / cost | `azure` / R / 0 | `ember` / SR / 600 | `jade` / SR / 1200 |
| Fantasy | swift sky courier — falcon energy | forge-born bruiser — anvil-and-coal energy | river-wind dancer — koi/eastern energy |
| Body plan | compact avian glider: short body, deep keel chest, long swept wings | stocky broad wyrm: heavy squared shoulders, thick neck, short powerful tail | long sinuous serpent: body IS the silhouette, tall elegant fin fans |
| Silhouette primitive | △ swept arrow/dart | □ anvil/block masses | ○ flowing S-ribbon |
| Wing architecture (HERO) | **swept blade-feather comb** (§3 col 1): stiff falcon PRIMARIES, straight taut leading edges (`feather` lineage + ASHTALON comb lessons — CONSTRUCTION only: separation/z-stagger/value-tiers/taper. Do NOT copy its scythe SHAPE language: no hooked crescents, no villain silhouette — azure's blades are straight-edged falcon feathers, a hero read) | **broad-chord ember membrane** (§3 col 2): gapped finger rays through dark membrane (`skinnedMembrane`/`nightFuryWings` lineage) | **silk fin sails** (§3 col 3): tall overlapping koi-fin lobes + trailing streamers (`seraphWing` chord logic + `sideFins`; `plume` TAIL builder is streamer INSPIRATION only) |
| Motif (fixed anchor, blooms 0.3→0.6→1.0) | **brow crest** (head, gold-tipped): single feather-nub → 3-blade swept crest fan | **forge collar** (nape/wing-root yoke — rear-visible): two dull coals between the wing roots → glowing collar arc → blazing yoke with 6-spike corona | **chin pearl** (jaw) + lockstep rear carrier: pearl bead → held pearl → luminous river-pearl cradled by whiskers, with a pearl rim gradient on the rear lobe tips + tail-veil edge blooming in step |
| Accent (law 9 table) | gold `0xd9b36a`, diffuse tips only | lava `0xff8b2a`, emissive only | cool pearl `0xeafff4`, rim/pearl |
| Eye character | bright, alert, round→keen | small, hot, deep-set | calm, long, painterly |
| Stats/fx (unchanged) | 1.0 across; aura `142,213,255` | speed 1.04, handling 1.06, drain 0.95, regen 1.05; aura `255,139,42` | speed 1.07, handling 1.11, drain 0.9, regen 1.1; aura `121,226,183` |

**Roster anti-collision (beyond the trio).** Each apex black-fill must also be
instantly tellable from its nearest ROSTER neighbors — azure vs `phoenix` +
`pearl`; ember vs `toothless`/`obsidian` + `fire`; jade vs `astralWyrm` +
`thundercoil` + `water`. Locked differentiators:
- azure vs phoenix: stiff cool-toned falcon primaries with straight leading
  edges (phoenix = soft layered warm feathers); crest ≤3 blades (phoenix =
  flame crown); forked banner tail (phoenix = plume ribbons); ZERO warm glow
  on feathers — gold stays diffuse tip-paint.
- ember vs `fire` (Cinderwing owns the tail-bulb motif and the Cinder- name
  root): ember's motif is the FORGE COLLAR at the yoke — no tail glow at all;
  ember's tail ends in a dark iron tip.
- ember vs toothless: true V-gaps ≥0.15× span at the outer two rays
  (toothless is a continuous scalloped web, no through-gaps); chord ≥1.3×
  toothless's.
- jade vs astralWyrm: fin lobes tilted ≥40° above horizontal (tall koi fans
  vs astral's near-horizontal vanes); trailing streamers ≥0.6× body length;
  whisker+pearl head (astral = mask).

**Distinctness self-test (ALL tiers).** Black-fill thumbnails of the trio at
EVERY tier (0/1/2) must be tellable apart by body plan AND by wing silhouette
alone. Guaranteed tier-0 silhouette keys: azure = forked tail-tip hint +
crest nub breaking the head outline; ember = squared shoulder line
(shoulder width ≥1.25× azure's at tier 0) + the two collar coals; jade =
body length ≥1.35× the other two hatchlings + ≥2 visible fin-bud lobes.

## §5d Build sheets

A sheet is the builder's contract. Extend, never rebuild: reuse registered
part builders and the flap/pivot rigs; new builders self-register and touch
nothing shipped. Colors below are starting hexes — the gate may direct tuning.

**GLOBAL RULE — builders never swap per form.** `ascendedDef` merges `forms[]`
into `d.model` only, never `d.parts`. Every per-form change must be a model
knob the (single, fixed) builder reads — the `formLevel`/`tailStyle` pattern.
Any sheet line that reads "builderA→builderB across forms" is a doc bug: STOP
and report (§9).

**CP1 authoring semantics (all slots).** Author the base def as the shared
skeleton with apex dials carried in `forms[2]`; `forms[0]`/`forms[1]` may be
minimal stubs at CP1 but must still BUILD CLEAN (`tricount --ci` runs all
forms). At CP1, `tests/starters.mjs` may scope the per-form band/monotonicity
asserts to form 2 (build-clean only for forms 0–1); full 0–2 coverage is
mandatory from CP2. Render CP1 captures via `ascendedDef(def, 2)`. By CP2,
base+`forms[0]` must resolve to the hatchling per the §4 table.

**BUILD ORDER — strict queue: azure → ember → jade.** Each slot's branch is
cut from master AFTER the previous slot's PR merges (slot A branches from the
merge of this design doc), so shared engine work (wing builders, dials, the
studio tool, `tests/starters.mjs`) accretes instead of forking. Engine needs
land with the first slot that hits them.

### AZURE — "Azure Drake" (slot A) — branch `claude/azure-rebuild`
- **Torso** `avian` (or `sweptLoft` if avian fights the keel): deep keel
  chest, short coupled body, the arrow read. Body `0x1c3048` family kept.
- **Wings (hero)**: new builder `bladeFeatherWings` per §3 col 1. Leading arm
  spar (beveled, `horn`-toned) sweeping 25–30° back; 5 feather-blades per
  wing, roots marching along the arm, lengths swelling mid-fan then tapering
  (longest ≈ span×0.55), each blade a cambered plane with a raised central
  rib, z-stagger ≥0.12, gaps ≥0.15× blade width, straight taut leading edges
  (falcon, not phoenix-soft). Value tiers: leading blades lightest sky, root
  coverts darkest. Gold `0xd9b36a` as DIFFUSE tip-paint only on blade tips +
  crest (zero accent emissive on wings — law 9 carrier). Motion: direct
  `wingPivotL/R` + per-blade lag pivots.
- **Head** `draconic` (softStealth-adjacent archetype tuned alert/keen —
  `headScale`/`snoutScale`/`browIntensity` exist via `OVERRIDE_KEYS`); brow
  crest motif anchor above the eyes. Round-eye hatchling shape needs the §6
  eye-shape dial.
- **Tail** builder `clean`, per-form `tailStyle: 'simple' → 'simple' →
  'finned'` (the shipped pattern, `dragons.js` forms); apex reads as a forked
  banner (kite/swallow energy — echoes the blades). Tier-0 fork HINT (the
  tier-0 silhouette key) via a NEW opt-in knob (e.g. `model.tailTipFork`,
  default off) on the clean builder's simple style — shipped `simple`
  geometry untouched (§9) — or by using the existing `twinfin` style at
  form 0. Builder picks one and states it in the PR.
- **Forms**: 0 = round-chested fluffball glider (head:body 1:2.0–2.4, curled
  posture), stub blade-comb (even stubs keep gaps), crest nub, forked tail
  hint; 1 = blades lengthen, crest 3-blade fan begins, span 2.0–2.3×;
  2 = full high-aspect span 2.8–3.2×, crest fan complete, forked banner tail,
  gold tips at their richest (still diffuse; `spineGlow` ≤0.3 — restraint IS
  the read).
- Tri targets: ~2.4k / ~3.8k / ~5.2k. Engine needs hit here: blade-comb wing
  builder; posture dial; eye-shape dial; `tailStyle` in grammar;
  `forms:true` flags; assert-metadata handles; `tools/dragonstudio.mjs`;
  `tests/starters.mjs` (§6/§7/§8).

### EMBER — "Ember Wyrm" (slot B) — branch `claude/ember-rebuild`
- **Torso** `arrow` broadened (`shoulderWidthScale` ~1.4) or `hullTorso`:
  anvil shoulders (the tier-0 silhouette key: shoulder width ≥1.25× azure's
  hatchling), thick short neck. Body VALUE ramps per form with the hue anchor
  constant (law 9): form 0 `0x4f3527` → form 1 `0x2f1a10` → apex `0x1c0d08`.
  Top diffuse tier: warm ash-scute `0x5a4038` on shoulder tops, spine ridge
  and leading spar — the sunlit dorsal needs a real tier to shade (law 11).
- **Wings (hero)**: new/extended `emberMembraneWings` per §3 col 2. Thick
  beveled leading spar + propatagium fillet; 4 finger rays as REAL tapering
  tube geometry (~0.82 per-digit scale) with raised ribs; membrane panels
  with scallops 0.22–0.30 and true V-gaps ≥0.15× span at the outer two rays;
  membrane `0x2a1208` dorsal / `0x180a06` ventral. Ember gradient toward the
  rays as per-vertex EMISSIVE on the ray tubes only (panels stay dark),
  intensity ≤1.2 (`fire.tailBulb` level) — glowSeams is premium-only (law
  12), do not use it. Broad chord: span 2.5–2.9× with area at the top of the
  band. Motion: skinned `wingRigL/R` + `flapWing` (nightFury pattern).
- **Head** `draconic` with `headArchetype: 'feralPredator'` (heavy brow via
  `browIntensity`, small deep-set hot eyes; `horned` is OUT — it ignores
  `headScale` and has no snout dial); 2 horn pairs at apex.
- **Tail**: short, thick, DARK IRON TIP — no tail glow (that is `fire`'s
  signature; roster law §5). Tail builder `clean`, `tailStyle` simple →
  simple → blade.
- **MOTIF — forge collar** at the nape/wing-root yoke (rear-visible every
  frame of play): form 0 = two dull coals between the wing roots (emissive
  ~0.35 — with the warm belly underglow this keeps the hatchling from
  reading as a charcoal lump); form 1 = glowing collar arc; form 2 = blazing
  yoke with a 6-spike corona — the single brightest point on the dragon
  (law 12: its ONE bloom).
- **Forms**: 0 = round pot-bellied forge pup (value-lightest body, squared
  shoulders, coal pair, stub gapped wings); 1 = shoulders square up further,
  rays lengthen, horns bud, collar arc; 2 = anvil apex, `backSpines`, full
  broad wings, blazing collar.
- Tri targets: ~2.6k / ~4.0k / ~5.6k. Engine needs hit here: gapped-finger
  membrane builder; motif socket (per-form geometry+emissive swap at a named
  anchor).

### JADE — "Jade Serpent" (slot C) — branch `claude/jade-rebuild`
- **Torso** `serpent` (or `crystalSerpent` spine logic for the coil): the
  BODY is the hero silhouette — long S line of action enforced in idle
  (`neckSegments` 7→9, `tailSegments` 10→13 across forms; hatchling body
  length ≥1.35× the other two hatchlings — the tier-0 key). Jade body
  `0x123026` family, belly `0xe8ffd0` kept.
- **Wings (hero)**: new builder `silkFinWings` per §3 col 3. NOT a bat wing:
  3 lobes (forms 0–1) → 4 lobes (apex) per side, tall koi fans tilted ≥40°
  above horizontal, each lobe an independently cambered petal with a darker
  leading ray, ×0.8 size progression, tip notches separating the outer 40%
  (depth ≥0.3× lobe length); trailing streamers off the rear lobe ≥0.6× body
  length at apex. OVERDRAW LAW: only the rear-most lobe + streamers are truly
  translucent; forward lobes are OPAQUE with vertex-color tip gradients +
  `applyFresnelRim` faking the silk; alpha overlap ≤2 layers per pixel,
  overlap regions ≤30% of lobe area. Span 0.9–1.2× → 1.8–2.1× → 2.2–2.5×
  (sheet-sanctioned; the serpent reads as reach, the fins carry the beauty).
  Motion: direct `wingPivotL/R` + per-lobe furl pivots (fan-fold).
- **Head** `draconic` slim variant (`snoutType`/`headScale` per form);
  whiskers (`whiskerFins`) from form 1, taper law applies; calm long eyes.
- **MOTIF — chin pearl + rear carrier**: pearl bead → held pearl → luminous
  river-pearl cradled by whisker curls (soft `0xeafff4`, the line's ONE
  bloom), judged in the turntable face crop. Because the jaw is invisible
  from the chase camera (§1), a LOCKSTEP carrier blooms with it: pearl-hued
  rim gradient on the rear lobe tips + tail-veil edge at 0.3→0.6→1.0 — this
  is what the rear-chase gate judges.
- **Tail**: builder `clean`, `tailStyle` simple → simple → finned, with the
  apex fin read as a flowing veil echoing the wing lobes (streamer geometry
  from the wing builder's kit; `plume` remains a tail-builder REFERENCE for
  streamer shaping, not a per-form swap target).
- **Forms**: 0 = chubby LONG river-pup (head:body 1:2.8–3.2 — less extreme
  than its siblings so the serpent hint survives), big calm eyes, 3 fin-bud
  lobes BUILT (≥2 visible in silhouette — the tier-0 key; matches the §3
  3/3/4 count and the §7 assert), pearl bead; 1 = body lengthens, lobes unfurl, whiskers
  bud; 2 = full S-ribbon glory, 4 lobes + streamers, veil tail, pearl + rim
  carrier radiant.
- Tri targets: ~2.3k / ~3.9k / ~5.4k. Engine needs hit here: fin-lobe wing
  builder + overdraw spot-check; pearl motif socket + lockstep rim carrier.

## §6 Engine needs (land with the FIRST slot that hits them — see build order)

1. **Wing builders** per §5d (blade comb / gapped membrane / silk fin),
   self-registered, each declaring its §3 motion path and publishing the
   standard rig parts (`wingPivotL/R`; `wingRigL/R` where skinned).
2. **Grammar extensions**: `model.tailStyle` (enum
   simple/finned/blade/comet/twinfin/shard, `forms:true`); `forms:true` flags
   on `headScale`, `eyeScale`, `wingScale` and the wing-shape dials the
   sheets vary per form (accretion already APPLIES them — this adds per-form
   range-checking); a **posture/spine-curl dial** (the one genuinely missing
   proportion dial — no torso builder has one); an **eye-shape dial**
   (round↔almond — the draconic eye zone is hardcoded almond; `headScale`
   reaches `draconic` but NOT `horned`).
3. **Motif socket pattern**: a named `motifAnchor` each build publishes;
   per-form motif geometry swaps in one place; §7 checks anchor invariance.
4. **Assert-metadata contract** (extends the anchor pattern): every
   new/extended builder publishes measurement handles — `parts.spinePoints`
   (world-space spine polyline from the torso builder) and
   `parts.wingElements = [{root, tip, length}]` per blade/ray/lobe. Eye/head
   asserts read RESOLVED DEF dials (`ascendedDef(def,t).model.*`), never mesh
   spelunking.
5. **`tools/dragonstudio.mjs`** (§8): tiershots + bossstudio precedent —
   deterministic contact sheets. Also: clamp tier montages to
   `maxTierFor(key)` (today `tiershots.html` renders and frames by an
   unreachable T3 for starters — the gate must never judge a phantom form).
   Effectiveness requirements, from running the current tools on the shipped
   starters (r1 audit): (a) **fill-the-frame detail crops** — in today's
   tiershots the dragon is a ~15%-height sliver in a mostly-empty tile; wing
   gaps, value tiers and scallops are unjudgeable. Keep the fixed-distance
   ladder frame for the SIZE ramp, but add per-part crops (whole-dragon,
   wing close-up, head) where the subject fills ≥60% of the crop, and judge
   emissive/edge detail at a 4× crop (bossgate law). (b) **Backdrop contrast
   is mandatory** — navy-on-near-black hid azure's silhouette edges in both
   tiershots and headshot; every state renders on all three §8 backdrops,
   and the pale backdrop is the primary silhouette-judgment frame.
   (c) **Deterministic wing phase** via the §6.6 pin — tiershots' idle pose
   is whatever the clock gives it. (d) headshot's REAR tile currently
   clips inside the neck geometry — reposition or drop that angle.
6. **Flap debug pin for the starter motion paths.** A `?wingDebug=<phase>`
   FREEZE mode already exists (`dragon.js` ~line 600, used by
   `tools/flapstrip.mjs`) but it lives inside the Mk II YOKE branch — it only
   freezes `model.flap` dragons, and NO starter rides that path (§3 motion
   rows). EXTEND `?wingDebug` (plus a fold/bank pin) to the direct-pivot and
   skinned-rig paths rather than inventing a parallel mechanism — transient
   poses cannot be captured by waiting (L137 law).
7. **`tests/starters.mjs`** (§7) + `def.accentHue` on the three starters.
8. **`--wings-only` flag** on `tools/silhouette.mjs`/`silhouetteCore.mjs`
   (it has `--no-wings`; CP3 needs the inverse) — slot C.
9. **Silhouette resolution for gap asserts**: at the default 560×440 the
   rear-view dragon spans ~250px, so a 5-blade comb's gaps are 3–5px —
   aliasing territory. Add a `--w/--h` (or fixed 2×) render size and/or a
   tight auto-crop so the subject fills the frame before any pixel-level
   gap judgment; the `top` planform view at default size is already
   adequate (verified).
10. **`?cleanshot` capture flag** (in-game): gameshots frames currently have
   the tutorial banner, the green target ring and trail scribbles OVERLAPPING
   the dragon, and the wing phase differs per tile (non-comparable). A debug
   flag that hides HUD/hints/rings/trails + the §6.6 wing pin (pass
   `wingDebug` through gameshots) makes in-game frames judgeable; clamp its
   tier loop per §8 step 4.

## §7 Per-sheet geometry asserts (`tests/starters.mjs`, new)

Headless, built via `buildDragonModel` + `ascendedDef` per reachable form
(0–2). Asserts read the SHEET bands (§3 per-architecture table + §5d), not
the §4 defaults, via a small per-dragon spec table in the test:
- Head:body length inside the sheet band per form; monotonic across forms.
- Eye diameter : head length inside the §4 band per form (from resolved
  `eyeScale`/`headScale` dials); monotonic decreasing.
- Wingspan:body inside the sheet band per form; monotonic increasing.
- Wing elements: count per the sheet (azure 5 · ember 4 · jade 3/3/4), from
  `parts.wingElements`; lengths non-equal (progression present); separation
  per the sheet's metric (azure/ember: planform gaps > 0; jade: tip-notch
  depth ≥0.3× lobe length over the outer 40%).
- Declared rig parts exist (`wingPivotL/R`; `wingRigL/R` where the sheet says
  skinned); driving the fold contracts measured span (ratio ≤0.7 of glide).
- Taper: every tapered chain (tail, neck, elements from `wingElements`):
  tip ≤0.20× base, with a ≥0.08 floor (deliberate assert slack: the suite
  only catches sausages and degenerate needles — the gate judges the law-4
  10–20% band in pixels).
- Line of action: `parts.spinePoints` polyline has ≥1 inflection in idle.
- Motif anchor: positions compared in PRE-SCALE local space (divide out the
  form's resolved `d.model.scale` before comparing) — drift ≤0.15 units;
  motif bounding volume monotonic increasing.
- Tri budget per form within sheet targets ±20% and under the 6,000 ceiling
  (`tricount` remains the hard gate).
- Palette: ≤3 base diffuse hues + ≤1 emissive accent per form (azure's
  accent is diffuse-only — zero is correct for it); accent hue within ±20°
  of `def.accentHue`; carrier rule (azure: no accent-hued emissive on wings;
  ember: no warm accent diffuse; jade: accent cool, ~149°±20°).

## §8 The gate protocol (aesthetics gate — the reason this rebuild exists)

Process is the boss playbook's, restyled for dragons:

0. **CALIBRATION (once per slot, before CP1 round 1).** Run the identical
   capture set + verbatim GATE PROMPT on the SHIPPED starter for that key.
   Expected verdict: FAIL citing §8 failure classes (MITTEN / FLAT STICKER /
   SAME-DRAGON-BIGGER). If the gate PASSES the shipped dragon, the captures
   or the gate agent are broken — fix the pipeline before building. Record
   the calibration verdict in the PR. (L136/L137: the calibration is the
   gate's credibility.)
1. Suites green first: `node tests/blueprint.mjs`, `node tools/tricount.mjs
   --ci`, `node tests/starters.mjs` (and `node tests/flapcheck.mjs` for the
   roster's `model.flap` dragons — it does not cover starters, §3 note).
2. **Studio first** — `node tools/dragonstudio.mjs <key>` (§6.5): per
   reachable form (0–2, clamped via `maxTierFor`), named states
   glide/fold/bank via `setFlapDebugPose` + turntable-face; fixed angles per
   state (rear chase, side profile, rear-3/4, top-down planform);
   DETERMINISTIC animation phase (fixed time seed) so round K and K+1 are
   pixel-comparable; three backdrops — near-dark `0x14121a`, pale `0xcfd6e4`,
   warm sunset-gold `0xd9a24a` (L140: gold/pearl accents must be judged
   against a warm sky too); fixed output paths
   `reforged-captures/dragon-<key>-f<form>-<state>-<angle>-rK.png`.
   Black fills via `tools/silhouette.mjs`; face crops via `tools/headshot.mjs`.
   The tier montage IS the true-scale form-ladder frame (framed once, by the
   apex form).

   **Existing tool inventory — USE these, do not rebuild them** (several have
   capabilities their usage comments undersell):
   - `tools/silhouette.mjs <key> <view> [form]` — headless black fills, ~100ms,
     no browser. Views: rear/side/front/climb AND (undocumented, verified
     working) `top` — the wing PLANFORM fill — and `threeq` (rear-¾-above,
     the bank read). Flags: `--pose=glide|recovery|apex|downstroke|settle`
     (frozen wing-cycle poses, works headlessly on non-yoke dragons too) and
     `--no-wings` (body-only fill). `--wings-only` is the one missing flag
     (§6.8).
   - `tools/silhouette-overlay.mjs <concept.png> <key> [view]` — built-vs-
     concept overlap %, for tuning a wing planform against a reference sketch.
   - `tools/flapstrip.mjs [key] [tier]` — the 5-phase wing-motion strip from
     the REAL chase cam via `?wingDebug` (yoke dragons today; §6.6 extends it
     to the starter paths).
   - `tools/nfview.mjs [key] [tier]` — lit multi-yaw stills (front/¾/side/
     ¾-rear/rear) on a neutral stage — the general angle viewer dragonstudio
     wraps.
   - `tools/headshot.mjs [key] [tier]` — 4-angle head montage (azure/ember/
     jade are already in its default list).
   - `tools/tiershots.mjs`, `tools/gameshots.mjs`, `tools/inspectshot.mjs` —
     tier montage / in-game chase crops / shop-showcase phone frames (clamp
     caveats per §6.5 and step 4).
3. Spawn a FRESH gate agent (model `fable`) per round with the verbatim GATE
   PROMPT below + capture paths + tri counts (+ prior directives for rounds
   ≥2). The builder NEVER judges its own output. Quote verdicts verbatim.
   FAIL → apply the numbered directives exactly, re-capture as round K+1,
   fresh gate. After ~4 rounds of churn: consolidate all directives into one
   frozen numbered work order before iterating further (MARROWCOIL law).
4. In-game captures second — `node tools/gameshots.mjs` (or the `?debug`
   URL flow): ONLY the three named frames are handed to the gate — chase
   idle, mid-bank, tier-up reveal. Tier MONTAGES come exclusively from the
   clamped dragonstudio tool: gameshots' hardcoded tier loop `[0,1,2,3]`
   composites a mislabeled phantom-T3 tile for starters — either clamp its
   loop to `maxTierFor(key)` (slot A engine need if used for montages) or
   never hand its montage to the gate. Bank/fold AESTHETICS are judged on
   the pinned studio states; the in-game pass judges INTEGRATION only
   (readability against biome skies, presence at gameplay distance) — the
   BOSS-DESIGN §7c studio-vs-integration split.
5. Human judges motion/feel on the PR preview. Merge verdict is human.

Checkpoints per slot: **CP1** = apex form body+wings first built (per the
§5d authoring semantics), captures: rear chase, side profile, rear-3/4 bank
(pinned), wing planform. **CP2** = all three forms + ascension ladder —
those per form, plus the true-scale form-ladder montage, turntable face crop
per form, black-fill silhouette triptych of this dragon's three forms, AND a
trio black-fill frame: this slot's new build alongside the LATEST merged
versions of the other two starters (shipped versions for slot A) plus its
nearest roster neighbors (§5 list). **CP3 (slot C only)** = after jade's CP2
passes: true-scale trio frame + black-fill triptych of all three NEW apexes
(bodies-visible and wings-only variants) + the tier-0 and tier-1 trio rows —
a fresh gate agent gives the trio verdict before the arc closes.
STOP for the user's go after each checkpoint PASS.

### Failure classes (the gate's vocabulary)
MITTEN (filled web, no gaps) · BACKPACK WINGS (under the sheet's span band) ·
SAUSAGE (no taper) · SUNBURST (rays from a point, no arm march) · SAWTOOTH
(equal repeats) · FLAT STICKER (one material, no tiers/relief) · TANGENT ·
GOOGLY (hatchling eyes past ~45% of head length) · SAME-DRAGON-BIGGER (forms
only scale) · MOTIF DRIFT (anchor/hue moves) · TOY-COLOR (saturated diffuse
on broad masses) · DEAD SYMMETRY (matching-curve pairs, static identical
wings) · STRAIGHT SPINE (no line of action) · PHANTOM FORM (judging or
shipping an unreachable tier).

=========================== GATE PROMPT (verbatim) ===========================
You are the independent AESTHETICS GATE for Dragon Drift's starter-dragon
rebuild, spawned with fresh eyes. Trust nothing you were told beyond this
prompt: read the capture PNGs at the provided paths yourself, and read
reforged/DRAGON-DESIGN.md §2 (aesthetic laws), §3 (wing law — the universal
clauses plus THIS dragon's architecture column), §4 (growth arc), the §5
registry row and §5d build sheet for THIS dragon, §8 step 2's capture-set
definition (states, angles, backdrops, per reachable form — so you can tell
when a required capture is missing), and §8's failure classes.
PRECEDENCE: where the §5d sheet or the §3 per-architecture column gives a
number, it overrides the shared §3/§4 defaults — judge against the sheet.
If any capture is ambiguous, non-deterministic between rounds, or missing a
required state/angle, your verdict is a demanded re-capture, not a judgment.

PRIME DIRECTIVE: aesthetics first. This gate exists because the previous
starters passed every functional test and still looked inferior. A dragon
that is merely correct FAILS. Ask of every frame: is this beautiful? Would a
stranger screenshot it unprompted? Does the wing read as the hero feature?

Judge HARSHLY against: the registry silhouette one-liner for this dragon;
the wing law for THIS architecture (element separation per its metric, taper
progression, leading-edge weight, camber + rim light, value tiers, span band
per its sheet); the growth arc (form 0 genuinely CUTE per the §4 dial table
without going googly; forms must differ in PROPORTION and FEATURES, not just
scale; the motif anchored and blooming — and rear-visible per §1, via the
sheet's carrier where one is specified); the aesthetic laws (S-curve line of
action, per-view mass hierarchy, taper law, no tangents, no sawtooth,
palette discipline with the law-9 accent carrier for this line, rarity
ceiling per law 12); and distinctness when trio/roster frames are provided
(black fills tellable apart at EVERY provided tier by body plan AND wing
silhouette; no collision with the named roster neighbors). Score silhouette
appeal, line of action, taper/shape contrast, wing majesty (per this
sheet's bands), wing-surface detail (membrane, fin or blade per this
dragon's architecture), hierarchy, color/rim beauty, and life 0–5 each: any
axis ≤2 is an automatic FAIL; average <4.0 is a FAIL for a rebuild whose
entire purpose is beauty. Builder self-reports run generous — assume flaws
exist and hunt for them in the pixels, especially: gaps that closed at
distance, trailing edges that went straight, accents bleeding onto broad
masses, hatchlings that read as shrunken adults, and anything judged on an
unreachable tier (starters cap at form 2 — a fourth tile is a PHANTOM FORM;
demand a re-capture).

Return exactly one of:
- "PASS — proceed" (optionally with polish notes), or
- "FAIL" + NUMBERED surgical directives (specific parts, numbers, hexes —
  the builder applies them verbatim).
Your entire final message is the verdict. Do not soften it.
==============================================================================

## §9 Ground rules for builder sessions (session-history law)

- STRICT BUILD ORDER azure → ember → jade; each slot's branch cut from
  master after the previous slot merges (§5d). Keep keys/display names/
  `rarity`/`cost`/`stats`/`fx.auraColor` untouched; `forms[]` stays accretive
  and length 3; never break a non-starter dragon (run the full `tricount` +
  `blueprint` roster gates, not just your key).
- Every command in the FOREGROUND. No `git stash` / `checkout --` / `reset`.
  Commit small, push often.
- If this doc conflicts with the code (stale line refs, missing seam,
  impossible instruction like a per-form builder swap), STOP that step and
  report the conflict — never improvise schema changes.
- Extend, never rebuild: new part builders self-register; shipped builders
  and other dragons' geometry are read-only.
- You never judge your own visual output. Only the gate agent's verdict
  counts. Append a LEAPFROG lesson after every meaningful change.
