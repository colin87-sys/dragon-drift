# PHOENIX — "The Dawnfire Empress" · Premium Build Sheet (Firebird of Rebirth)

The builder's contract for rebuilding `phoenix` (SSSR) into a bespoke premium apex firebird — the
deliberate **opposite of Solar** on every axis, majestic in her own fiery way. Authored FRESH: no
existing `feather`/`plume`/`avian`/`beaked` builder geometry is reused, and NOTHING of Solar's look
(no M, no eclipse ring, no membrane, no violet, no horizontal wyrm-king). Reuses only invisible
plumbing: the recipe registry, the attach contract, `flatTriMesh`, the stage-aware material-factory
*structure*, the `igniteStage` dial pattern, and the failure-class test harness.

**Read first:** [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md) (the playbook — esp. §0.5
distinctiveness gate, §2 rear-chase primacy, §3 spectacle triad, §3b the anti-tacky lighting
doctrine). Worked reference implementation: [`SOLAR-ECLIPSE-BUILDSHEET.md`](./SOLAR-ECLIPSE-BUILDSHEET.md)
+ `js/dragonSovereign.js`. Numbers here are the authority; the Fable gate (§QA) judges against this sheet.

Sourced from: the owner's 4 phoenix reference images (the spread-display + streaming flame-plume +
molten-gold-on-black + fire-feathers) + the Fable design synthesis + the method's fixed constraints.
**Owner-confirmed direction: TRAIN-HERO** (the hero mass is the streaming lower-rear quill-train; the
wings are supporting slender scythes — the clean inversion of Solar's top-heavy crown).

**COEXISTENCE — build as a NEW character block, do NOT replace the shipped `phoenix` (owner directive).**
The premium rebuild is authored as a **new roster def key** so both dragons exist side-by-side and can be
COMPARED in-game before the owner decides to replace or retire the original. This is the method's
"coexist → prove on a hero → migrate" principle applied at the roster level.
- **New key: `phoenixEmpress`** (working name — owner may rename). It is a fresh entry in `DRAGONS`
  (`js/dragons.js`), NOT an edit to the existing `phoenix` def. The shipped `phoenix` (avian/feather/
  plume/beaked firebird) stays **byte-identical and fully playable** throughout.
- **Mirror the shipped phoenix so the comparison is fair:** `name:'Phoenix Ascendant'` → display name
  the owner's call (e.g. keep, or "Phoenix — Dawnfire"), `rarity/maxRarity SSSR`, `cost:6000`,
  `stats {speed 1.14, handling 1.27, drain 0.70, regen 1.35}`, `archetype:'phoenix'` (the RIG flag for
  warm ember-motes / Rebirth Surge in `dragon.js`, not a model path), `maxTierFor===3`, `hasStyle:true`.
- **`title: 'The Dawnfire Empress'`** (owner-confirmed — adopt the identity name as the shipped title).
- `parts` points to the four NEW builders (§3); `forms[]` uses the §4 palette. The shipped ivory apex
  body `0xeee2c6` is NOT carried over — this block never uses it (it is the toy-bright trap).
- **Migration (later, owner-gated):** once compared and blessed, either repoint `key:'phoenix'` at the
  new builders/palette and delete `phoenixEmpress`, or retire the old `phoenix` and promote this key.
  Until then, NOTHING about the shipped dragon changes. New builders stay default-off; only
  `phoenixEmpress.parts` opts in, so the rest of the roster is byte-identical.
- Coexistence surfaces the new dragon in the shop/roster as its own entry (that IS the comparison
  surface). If the owner prefers a hidden dev-only compare instead, gate it behind a flag — owner call.

---

## SETTLED — do NOT re-litigate (read this before building)

These were decided by the owner or ruled by the Fable design/compliance audits. They are CLOSED — build
to them; do not reopen or "improve" them. (Full reasoning is where cited.)

**Owner decisions:** TRAIN-HERO signature (not wing-spread) · `title: 'The Dawnfire Empress'` ·
dark-garnet dorsal + small pale-gold f3 belly nod (§4) · animated `trainSpread` fold/fan APPROVED (§7.2)
· build as a COEXISTING new `phoenixEmpress` block, shipped `phoenix` untouched (§ coexistence).

**Audit rulings (kept-as-justified — these are NOT Solar-leakage; do not strip or re-argue them):**
- **`primaryGaps`** (splayed spread-primaries) — native raptor anatomy from the refs; kept, renamed off
  Solar's `pinionSlots` (§3b). Do not rename back or remove.
- **`trainLift`** — a sanctioned tail-lift appendage dial for the ascending read; kept (§3d). Not the
  ladder currency (count/sector are). Do not call it a "banner rise."
- **ONE near-white (Dawn Coal)** — a deliberate rebirth beat, not a quota; kept, f3-only (§4/§7).
- **Empress persona** — the fenghuang IS the empress icon; it's the referent's royalty, not Solar-gravity
  (§1). Kept. Her ladder is a REBIRTH, not a coronation (§5).
- **Dark-bodied tone** — a principled fire-identity choice (a light body is the orange-blob trap), owner
  ref is molten-on-black; kept, with an explicit TONE check in the QA veto (§4/QA-1.4).

If you think any of these is wrong, RAISE IT with the owner — do not silently change it.

---

## 1. IDENTITY

**She is the fire that rises where the king's darkness reigns.** Solar is a horizontal eclipse
dragon-KING — cold violet light withheld inside armored black, a cathedral of membrane vaults crowned
ABOVE his head. Phoenix is the Dawnfire EMPRESS — a compact, burning-hearted firebird whose glory
streams BEHIND and BELOW her: a fanned train of ember-eyed quills trailing toward the chase camera
like a comet made of feathers. Solar wears his spectacle as a **crown above** (spires, ring); Phoenix
wears hers as a **train behind** (an empress's robe, not a king's crown). His arc is dark-then-ignited;
hers is **ash-then-reborn** — a charcoal ash-chick that re-kindles rung by rung until the apex burns
with three colours of fire on a body that stays dark as a coal.

One word: **REBIRTH** — worn as a train, not a crown. She is a SHE; the bearing is regal, not martial.
(Her royalty is the REFERENT's, not Solar-gravity: the phoenix/fenghuang is itself the empress icon —
the imperial firebird — so an empress persona is native to the source, and her growth VERB, re-kindling
from ash, is nothing like Solar's forged coronation. "King + empress" is a coincidence of two royal
referents, not a repeated monarch beat.)

## 2. THE SIGNATURE SILHOUETTE — "THE PYRE-TRAIN" (comet-of-quills)

**The one geometric idea:** Phoenix's silhouette mass lives in the LOWER-REAR of the frame. Long,
slender, continuously up-raked scythe wings sit thin on top; beneath and behind them, a wide fanned
**TRAIN** of flame-quills spreads from the tail root in a downward-and-outward sector (≤ 150°, hard-capped
< 180°), each quill tipped with a faceted **coal-eye** gem. In pure rear black-fill she reads as a
**shuttlecock-comet / a lyrebird's display**: two thin high crescents (the wings) over a broad radiating
spray (the train). Instantly nameable: *"the one with the burning peacock train."*

**Why it is unmistakably Phoenix and not Solar (or anyone):**
- **Compositional inversion.** Solar's rear frame is TOP-heavy (spires + ring above the head, tail an
  afterthought); Phoenix's is BOTTOM-heavy (train below, wings thin above). Two silhouettes whose mass
  lives in opposite halves of the frame cannot be confused.
- **Not an M / not an arch.** The wings are single continuous raked crescents whose high points are the
  far OUTBOARD tips — no interior carpal peaks, no valley-enthroned head, no vertical spires. The
  skyline is a shallow rising V of thin blades, deliberately quiet, because the train is the hero. (The
  wing's vertical profile is the mathematically OPPOSITE curve family to Solar's two-segment arch: his
  peaks are interior, hers are terminal.)
- **Not a ring.** The train is a **sector fan of DISCRETE quills with mandatory negative space** (gap ≥
  1 quill-width between quills; sector < 180°; both asserted in tests). It anchors at the TAIL, not
  behind the head — so it also cannot be mistaken for Pearl's head-anchored halo sprite.
- **Rear-chase native.** The tail trails TOWARD the lens — the cam's biggest untapped surface. Every
  quill vane is canted to FACE the camera (pitched ~20–30° up off horizontal, alternating small ±8° L/R
  cant for balance — the Solar CP2 tail lesson applied from round 1, never edge-on).

**Owning the dark sky — the ≥3 coloured light structures** (three warm hues, spatially separated so she
never smears into one orange blob; this is the IMG_6529 target — molten body + lit edges + ember motes
on black):
1. **The EMBER ARC (amber-gold `~0xd98a12`):** the coal-eye gems at the quill tips form a glowing arc of
   discrete points across the lower frame — a constellation of coals, the rear-view signature. The CENTER
   quill's coal is the apex's single tiny near-white element (the **Dawn Coal**, `0xffe9c4`).
2. **PINION FIRE (crimson-rose `~0xe0173a`):** each wing's large primaries carry a vertex-baked
   dark-root → crimson-tip emissive gradient on the trailing edge — two thin curved lines of red fire
   tracing the wing crescents, brightest in the outer 20%.
3. **THE COMET CREST (rose `~0xe83a6a`):** back-swept crest quills streaming off the crown, each with a
   small coal tip — a rear-readable upper echo of the train (Phoenix's own answer to the "the face is
   away from the cam" problem Solar solved with a napeStar — she solves it with her own motif).
4. (side/inspect only, forms 2+) **the HEART-FIRE GORGET** — a saturated gold breast-keel seam; not
   counted on for the rear read.

No dead-black center void: a thin molten **keel-seam** (ember-orange, dim, stage-gated) runs the dorsal
line between crest and train so the body stays anchored between light structures 1 and 3.

## 3. THE FOUR APEX BUILDERS

New file `js/dragonPhoenixEmpress.js`, self-registering, DEFAULT-OFF; only `phoenixEmpress.parts` opts in (the
roster stays byte-identical until then). New material factory `empressMats(def, glow, stage)` copies only
the `sovereignMats` *structure* (per-stage emissive ladders, `userData.baseEmissive/baseIntensity`) — its
materials, hues, counts and slots are authored fresh.

### 3a. TORSO — `pyreHeartTorso`
The anti-wyrm: a **compact avian fuselage**, not a long draconic keel. Deep bird-breast keel (mass
forward and LOW, a falcon's chest), short proud swan-curve neck (2–3 segments, head carried slightly
high — the empress bearing). Body long axis stays LEVEL in flight (verticality comes from wing rake +
train lift, NEVER a reared body — the §0 level-body law). Torso ≈ 35% of the silhouette
so the train can be ~40%. Regalia: the **heart-fire gorget** — a 3-facet gold emissive seam-chevron
molded into the breast keel (the dark-opaque-body + thin-saturated-rim TECHNIQUE spent on a GORGET, not
a ring), withheld until form 2. Dorsal molten keel-seam (thin ember emissive groove, stage-gated). Flank
= few large ash-charcoal facets; belly one tier warmer (deep umber, NOT cream). **Short digitigrade
raptor LEGS + faceted talons** tucked under the breast (copper accent) — the grip that reads on a
firebird and the owner of the "talons" the §4 palette references (~250–350 tris). Publishes the full
attach contract (`wingRootL/R`, `headBase`, `tailAnchor`, `halfWidthAt`, `bodyMidY`, `riderSocket`),
`parts.spinePoints`, the gorget `motifAnchor`, and **`coreGlow` as a mesh or `null` — never a colour
number** (the known crash class). ~600–800 tris at apex (incl. legs/talons).

### 3b. WINGS — `scythePinionWings` (feathered, NEW construction)
**The falcata crescent:** high-aspect wings — long span, narrow chord (the opposite of Solar's broad
vault-bays). Per wing:
- **One dark covert sheet** (inner third): a single `flatTriMesh` fan of 6–8 large facets, ash-maroon
  diffuse, ZERO emissive — the dark root that makes the fire read.
- **5–7 large blade PRIMARIES** (outer two-thirds at apex): each a discrete 4–6-tri quad-blade,
  z-staggered/shingled, separating toward the tip with true negative-space **`primaryGaps`** (gap ≥
  0.15× span between the outer three). These are raptor anatomy straight from the owner's fire-feather
  references — the splayed spread-primaries of a real bird wing, NATIVE here (Solar's membrane vault had
  no feathers; this is not that graft). Each carries the vertex-baked dark-root → crimson-tip gradient
  (emissive only in the outer 40% of each blade, zero at the root — the fire lives on the tips).
- **Vertical profile = a single continuous RISING RAKE** (`sweepRake` + `tipRise` dials, vertex-baked so
  it survives the flap animator): sweep back 40–45°, tips ending HIGH and AFT, a slight inward curl at
  the last primary (flame-lick tips). No gull arch, no carpal peak, no spires — max height at the far
  tip, monotonic from root.
- Apex span : body ≈ 3.2× (majesty from SPAN, since chord is slender).
- **Rig contract:** publishes `wingPivotL/R`, `wingMidL/R`, `wingTipL/R`, tip `marker`,
  `parts.wingElements` — and the FX marker + tip **duplicate the rake profile formula** (documented
  gotcha: change the profile in both places or the wingtip trails detach).
- Motion: "the ember rises" — quicker, lighter bird wingbeat than Solar's slow cathedral bow, with long
  soaring holds where the pinion slots read. ~500–600 tris/pair at apex.

### 3c. HEAD — `cometCrestHead`
Small sleek falcon-swan head (the face is 0% of play — spend nothing beyond a clean beak wedge + almond
eye). Short raptor beak in burnished copper; NO horns, NO brow gem (a forward gem is wasted — Solar
proved it). Regalia = the **COMET CREST**: 1→3→5 back-swept streaming crest quills (per form), each a
2–3-tri blade with a small coal-eye tip — reads from the REAR as a streaming pennant above the body,
unifying with the train motif. Eyes amber-gold, laddering 34% round (chick) → 16% almond (empress).
Publishes the crest `motifAnchor`, `headLength`. ~150–200 tris at apex.

### 3d. TAIL — `pyreTrainTail` (registers a `pyreTrain` tail style) — **THE HERO**
- Short structural tail root (2–3 segments) → the **TRAIN**: 2/4/6/**9** quills per form, fanned in a
  downward-aft sector (apex spread ~140–150°, hard < 180°). Each quill = a thin copper shaft (~4 tris) +
  a teardrop vane (`flatTriMesh`, 4–6 tris, dark ash-maroon diffuse with a crimson→amber emissive edge
  gradient) + a **coal-eye** at the tip: a TEARDROP/coal-facet cut (~6–8 tris, amber-gold emissive on a
  dark bezel — NOT Solar's octahedron gem; a different cut so even the gem construction reads distinct)
  — the dark-body-bright-rim technique spent on a GEM-CLUSTER ARC, not a ring.
- Quill lengths swell-then-taper across the fan (center longest ≈ 1.1× body, ×0.85/step outward) so the
  fan has a shaped outline, not a flat broom.
- **Camera-facing law:** vanes pitch 20–30° up toward the chase lens, alternating ±8° L/R cant down the
  fan (balanced, per the Solar CP2 fix — must still PASS `wingsymprobe` as a mirrored pair).
- **`trainLift` dial:** the whole fan's rest pitch rises per form (drooping ember-tail at f0 → proud
  lifted display at f3) — a tail-lift appendage dial (method §0 sanctions "tail lift" for vertical drama
  on a level body), giving the ASCENDING read of a lyrebird/peacock raising its display. It is seasoning,
  not the ladder's currency — the quill COUNT (2/4/6/9) + SECTOR (90/120/150°) carry the conferral.
- Center quill carries the near-white **Dawn Coal** at f3 only. Coal-eye mats + the Dawn Coal stay OUT
  of `spineMats`/`accentMats` (surge-tick discipline — they hold their hue); the vane edge-gradient mats
  go IN (they flare on Rebirth Surge). ~110 tris (f0 stub) → ~450 tris (apex fan).

**Tri targets (±20%, monotonic, hard 6000/FORM ceiling; part-sum reconciles: torso 0.6–0.8k + wings
0.5–0.6k + head 0.15–0.2k + tail 0.45k ≈ 1.7–2.05k at apex):** f0 ~1.0k · f1 ~1.4k · f2 ~1.7k · f3 ~2.0k.

## 4. THE PREMIUM-FIRE LIGHTING SOLUTION (the anti-orange-blob doctrine — "a coal, not a torch")

The trap for a fire dragon is "everything orange, everything bright." The solve: the body is the dark
COAL; the fire lives only on edges, tips and gems — and it is THREE separated warm hues, not one.

**Tone note (deliberate, not inherited):** Phoenix is the SECOND dark-bodied premium after Solar — that
adjacency is chosen on the merits, not defaulted. A fire dragon on a light body IS the orange-blob trap;
the coal must be dark for the fire to read, and the owner's own reference is molten-gold-ON-BLACK
(IMG_6529). This correctly applies the method §3b VALUE-CONTRAST law (matte L ≤ 0.22 body + saturated
sat ≥ 0.75 accents), and the method assigns the LIGHT-bodied lane to the NEXT dragon (§7). Her warm
three-hue palette + everything-else must carry the difference from Solar's cold violet — enforced by the
tone check in the QA veto (QA-1.4).

- **Base diffuse (large surfaces, always dark, L ≤ 0.22):** warm ash-charcoal → deep GARNET ramp per
  form: `0x1a0f0d → 0x241012 → 0x2c1014 → 0x331016` (the ramp goes charcoal → garnet, REDDER never
  lighter — the DORSAL masses stay dark so the emissive carries the fire). Belly one tier warmer umber
  `0x3a2114`. This separates her from Ember Wyrm's bold-orange body and from the retired ivory apex.
- **Apex-body owner call — RESOLVED (owner yes):** the dorsal masses stay dark-garnet at every form
  (doctrine, anti-washout), BUT the APEX (f3) belly gets a small **pale-gold nod** to the retired
  "white-gold divine" firebird — belly-only, downward-facing, `~0xe8c58a`, so it warms the underside a
  believer catches on a bank without ever lightening the dorsal read the chase cam sees. Lower forms keep
  the umber belly; only f3 gains the pale-gold underlight.
- **Accent diffuse (forged tier, never emissive):** burnished copper / rose-gold `0x8a4a22` — beak,
  talons, quill shafts, crest shafts, gorget bezel; catches sun edge-highlights.
- **Emissive (opaque, vertex-baked, sat ≥ 0.75, value ≤ 0.9 — blooms in-colour under ACES + UnrealBloom):**
  three hue stations ~25–35° apart so the structures stay distinct — crimson-rose `0xe0173a` (pinion
  fire), ember-orange `0xd9541a` (keel-seam + vane mid), amber-gold `0xd98a12` (coal-eyes, gorget), rose
  `0xe83a6a` (crest + feather-edge kiss at f2+). All dark-root → bright-tip GRADIENTS — no flat emissive
  sheets anywhere.
- **ONE near-white — a deliberate beat, not a quota** (method §3b: the cap is a ceiling, zero is fine;
  zero WAS considered): the nine-coal arc wants a single BRIGHTEST point, and "the first light of dawn
  appears only at the apex" IS the rebirth stated in light — so the Dawn Coal `0xffe9c4` earns its place.
  Tiny, f3 only, out of all surge arrays.
- **No additive shells / no gem sprites.** Surge (`Rebirth`) flares the vane-edge + pinion mats toward
  `feverWing 0xffe6a8` (kept warm-gold, sat/value-safe) — never white-hot, never magenta.
- Per-form `glowLevel` 0.25/0.5/0.75/1.0 multiplies all emissive (adaptive-tier friendly). She must read
  UNLIT — the silhouette (train fan + scythe wings) does that job.

## 5. THE REBIRTH LADDER (each rung confers a withheld MESH category)

("Coronation ladder" is the method's generic term; hers is a REBIRTH — the verb is re-kindling, not
crowning, per method §3a's persona note.)

| dial | f0 **Ash Hatchling** | f1 **Kindled Fledgling** | f2 **Pyre Dancer** | f3 **Dawnfire Empress** |
|---|---|---|---|---|
| read | charcoal ash-chick: round, dim, a promise | first quills catch — the fire takes | the display ignites — she performs | the full pyre-train empress, reborn |
| `igniteStage` | 0 | 1 | 2 | 3 |
| `trainQuills` / `trainFan` / `trainLift` | 2-nub STUB (hints the train, unlit, drooped) | 4, ~90°, low | 6, ~120°, mid | 9, ~150°, proud |
| `coalBloom` (coal-eyes) | none (mesh withheld) | first coals, dim amber | brighter, all tips | blazing arc + Dawn Coal (f3-only mesh) |
| `primaryGaps` / primaries | 4 rounded, NO gaps, low rake | 5, first 2 gaps, rake grows | 6, 3 gaps | 7, full gaps, full rake + tip curl |
| pinion fire | none | crimson tips only (outer 15%) | outer 40% gradient | full gradient + rose edge kiss |
| `crestQuills` | 0 (bare crown) | 1 | 3 | 5, coal-tipped |
| `gorget` (heart-fire) | — | — | conferred (mesh appears, gold) | blazing |
| `keelSeam` | faint ember stitch | lit low | lit | molten |
| body diffuse / `glowLevel` | `0x1a0f0d` / 0.25 | `0x241012` / 0.5 | `0x2c1014` / 0.75 | `0x331016` / 1.0 |
| `eyeShape` | 34% round | 26% | 20% | 16% almond |
| tri target | ~1.0k | ~1.4k | ~1.7k | ~2.0k |

Every rung adds a CATEGORY, never just scale: f1 = hardware (quills, slots, crest) + first light; f2 = a
new regalia MESH (gorget) + a new HUE (rose); f3 = the full fan + the one near-white + max rake/lift. The
hatchling is a genuine ash-chick (no FAN — only a 2-nub stub that hints it — no coals, no crest, no
gorget; the `starters.mjs` assert checks the stub, not zero), so Eternal actually CONFERS
the empress's train. All dials monotonic.

## 6. OPPOSITE-OF-SOLAR + ROSTER DISTINCTIVENESS (the §0.5 gate)

**RETIRED by this sheet (the next dragon must avoid — per method §0.5 housekeeping):** silhouette region
= **BOTTOM-heavy** (mass in the lower-rear); profile-function family = **terminal-peak monotonic rake**;
tone = **dark-bodied** (garnet). Solar already retired TOP-heavy + interior-peak arch + dark-bodied
(eclipse). So the next premium's un-taken lanes include lateral/enveloping/forward mass regions,
flat/stepped/cupped/multi-lobed function families, and — notably — a **LIGHT-bodied tone** (§3b).

| Axis | SOLAR (off-limits) | PHOENIX (this sheet) | vs warm roster |
|---|---|---|---|
| Silhouette family | M / cathedral arch, TOP-heavy crown-above | Shuttlecock-comet: thin rising crescents over a LOWER-rear quill fan (train-behind) | Ember: generic wyvern V; Cinderwing: solid flame-cone tail; Pearl: halo-knight — none own the lower frame |
| Wing architecture | Broad membrane vault-bays + carpal lances | Slender high-aspect feathered scythe blades, terminal-peak rake, splayed `primaryGaps` | Ember/Cinderwing: membrane/hull; Pearl: smooth white angel wings (hers are dark, gapped, raked) |
| Regalia motif | Eclipse ring + brow star-gem (violet) | Coal-eye gem ARC on the train + comet crest + heart-fire gorget — a constellation, never an annulus | Pearl's halo is a head-anchored soft disk; the coal arc is tail-anchored discrete gems |
| Palette + glow | Eclipse-black + cold violet emissive | Ash-garnet DARK body + three warm emissives (crimson / ember / amber-gold), one tiny near-white | Ember Wyrm is bright-orange-BODIED; Phoenix is dark-bodied, fire on edges only |
| Growth beat | Withheld dark king → ignited crown | Rebirth: ash-chick → the train is conferred quill-by-quill, coals kindle | Unique verb: "re-kindling," not forging (ember) or burning (fire) |
| Body posture / sex | Long horizontal wyrm-KING, whip tail; HE | Compact avian breast-keel, short swan neck, level body; ascent from rake + lift; SHE | Cinderwing a hull raptor; aurumToro a mecha bull — no overlap |

## 7. RISKS / OPEN OWNER-CALLS

1. **Does the hero mass FILL the rear frame? (firewall §3.5 #4 — NOT the retired "wings ~70%" idea.)**
   The train is the hero and OWNS the lower-rear frame by design; the wings are deliberately slender.
   If a capture reads empty, FIRST grow the train's frame-share (count/sector/lift); a +30% covert-sheet
   chord (keeping the rake family) is only the second-line fallback. Decide AFTER the first rear-chase
   capture, not before. Do not walk the design back toward a wing-hero layout.
2. **`trainSpread` animated fan — APPROVED (owner yes), a planned feature.** The train FOLDS in
   (quills draw together, sector narrows) on a dive/boost and FANS OUT (full sector, lift up) in a
   glide and on Rebirth Surge — a living display, her signature motion beat. Implement as a rig
   behaviour driving the per-quill rest angles from a `trainSpread` 0→1 value (like the wing flap
   drives pinion fold); vertex-baked rest fan stays the floor, the animation opens/closes above it.
   Constraint: cap total train length ≈ 1.1× body and lift ≤ 35° (fanned) so it never clips the near
   plane or occludes rings/obstacles at chase distance. The idle/bank sway + the fold/fan feel are
   MOTION the Fable gate is blind to — human judges on the live preview.
3. **Apex-body brightness — RESOLVED (owner yes):** dark-garnet dorsal at every form + a small pale-gold
   f3 BELLY nod only (§4). Not an open question anymore; recorded here for provenance.
4. **Coal-eyes reading as eyes/targets.** Nine glowing gems could momentarily read as creature eyes or
   pickups at distance; verify at 250px in dragonstudio; mitigation = smaller gems + stronger vane
   gradients.
5. **Pearl anti-collision watch.** Pearl is also feathered with a banner tail; the standing Fable
   distinctiveness veto must get a PEARL tile alongside the Solar tile (and Ember + Cinderwing
   black-fills) every round.
6. **Title — RESOLVED (owner yes):** `title: 'The Dawnfire Empress'`.
7. **Coexistence key name.** `phoenixEmpress` is a working key — owner may rename before/at build. It
   ships as its own roster/shop entry (the comparison surface) until the migration call.

## QA — the gate (per PREMIUM-DRAGON-METHOD §3.5–5)

### QA-0. FIREWALL PRE-SCORE + ROUND-0 SELF-AUDIT (do this BEFORE the first high-effort Fable round)

The point of this sheet is to skip Solar's 7-round climb: the apex build must clear the
[method §3.5 firewall](./PREMIUM-DRAGON-METHOD.md) at round 0 so Fable VERIFIES (2–3 rounds) instead of
DISCOVERING. Before spending a Fable round, render one apex capture (rear-chase + sil-rear + glide-dark)
and self-audit HARD against these — fix every violation first:

| Firewall invariant | Phoenix pass-condition (target: no P0, every §5 axis ≥ 3.5 at round-0) |
|---|---|
| Confident MASS, not spider-thin spars | Mass lives in the **train fan + the dark covert sheet + broad teardrop quill-vanes + the primary blades** — NOT thin sticks. The quills are filled teardrops with real width; the covert is a solid dark fan. (Slender WINGS are intentional — but they are filled scythe blades, never wireframe spars.) |
| Dominant element + scale hierarchy | The **train is the clear hero**; quills swell-then-taper (center ≈1.1× body, ×0.85/step); wings + crest read as supporting ranks. No picket fence of equal quills. |
| Specific silhouette, reads at rear-chase, not a thin kite | The **shuttlecock/comet** read (thin rising crescents over a broad lower-rear quill fan) — verify in sil-rear at 250px; it must be nameable, not a spindly delta. |
| Something fills the rear frame | The train fan owns the lower frame + the comet crest reads above + the keel-seam anchors the dorsal line — no empty rear, no dead-black center. |
| Clean deliberate edges | Quill vanes + feather blades have DESIGNED teardrop/scythe outlines — no ragged/torn trailing edges. |
| Opaque emissive, saturated bloom-safe, ≤1 near-white | The §4 "coal not a torch" palette (dark garnet body, fire on edges/tips/gems in 3 separated warm hues, Dawn Coal the only near-white). No additive shells, no toy-orange sheets. |
| No muddy/noisy surface | Large confident ash-garnet fields; detail from FACETS + emissive edge-gradients, not busy texture (explicitly NOT the retired leopard-spot skin). |
| Spectacle triad present | Withheld-regalia rebirth ladder (§5) + earned light (§4) + the pyre-train signature (§2) are all in THIS sheet, not deferred to a CP2. |

Per-axis round-0 TARGETS (aim to hand Fable a ~3.5+ build): rear-chase dark-sky read ≥3.5 · ladder-rankability ≥3.5 · silhouette-strength ≥3.5 · premium-not-tacky glow ≥3.5 · apex signature ≥3.5 · distinctiveness veto CLEAR (not Solar/Pearl/Ember/Cinderwing). Reusable KIT to adapt (not re-derive, §6): `empressMats` from the `sovereignMats` structure · the `igniteStage` gating pattern · the opaque dark-body+rim technique (spent on the gorget/coal-eyes, never a ring) · `flatTriMesh` · the `wingsymprobe`/`smoke` probes · the premium's-own `starters.mjs` block.

### QA-1. The gate

1. **Side-by-side baseline:** because the new `phoenixEmpress` COEXISTS with the shipped `phoenix`, the
   comparison is direct — render both through `dragonstudio` (and view both in-game). Run the Fable gate
   on the shipped `phoenix` first as the baseline (expected FAIL — the lightly-composed firebird), then
   grade `phoenixEmpress` against the same rubric. The delta IS the owner's compare-before-migrate evidence.
2. **Verify by failure-class (on the NEW key `phoenixEmpress`, not shipped `phoenix`):**
   `node tools/tricount.mjs --ci` (whole roster, per-form ceiling — also proves the rest stayed
   byte-identical under coexistence) · `tests/blueprint.mjs` · `tests/smoke.mjs` (the coreGlow-mesh-or-null
   + wing-pivot crash classes) · `node tools/wingsymprobe.mjs phoenixEmpress` (the MIRRORED WINGS must
   PASS — note: wingsymprobe only inspects the wing rig, NOT the tail, so the tail-quill cant balance is
   asserted separately in `starters.mjs`, see below) · `node tools/dragonstudio.mjs phoenixEmpress r0`
   (renders the full sheet set: sil-rear + glide-dark + rear-chase + 4-tile ladder).
3. **`tests/starters.mjs` phoenixEmpress-own block** (premiums reach Eternal — can't ride the
   form-2-capped loop): tris monotonic; `trainQuills`/`coalBloom`/`crestQuills`/`igniteStage` monotonic
   (`trainQuills` starts at the 2-nub STUB, not 0); **fan sector < 180°** and **quill gap ≥ 1
   quill-width** (the not-a-ring asserts); **tail-quill cant balance: Σ signed cant ≈ 0 across the fan
   per form** (wingsymprobe can't see the tail, so balance is enforced here); vane diffuse L ≤ 0.22;
   accent hue in the warm band; Dawn Coal absent below f3; gorget absent below f2.
4. **ONE combined Fable brief** (sculpt + spectacle + rear-chase) with the standing DISTINCTIVENESS veto
   — hand the grader Solar + Pearl + Ember + Cinderwing tiles: *"does any part — or the overall dark-sky
   TONE-read — feel like Solar in warm? does any part read like another shipped dragon? → FAIL."* (The
   tone check is explicit because Phoenix is the 2nd dark-bodied premium; her warmth + everything-else
   must carry the difference — judge on the glide-dark tiles side-by-side.) Weight the rubric to the
   rear-chase tile; PASS = avg ≥ 4.0, no axis ≤ 2, vetoes clear. Iterate round by round.
5. **Human judges MOTION/feel on the live PR preview** (train sway, wingbeat, Rebirth Surge, ember-mote
   wake) and any net-new element — the gate is blind to it.

## Engine plumbing (invisible, named fresh)

New file `js/dragonPhoenixEmpress.js` registering `pyreHeartTorso` · `scythePinionWings` ·
`cometCrestHead` · `pyreTrainTail` (all default-off). New `empressMats(def, glow, stage)` copying only
the `sovereignMats` STRUCTURE. New dials via `forms[]` accretion only: `trainQuills`, `trainFan`,
`trainLift`, `coalBloom`, `dawnCoal`, `crestQuills`, `gorget`, `primaryGaps`, `sweepRake`, `tipRise`,
`keelSeam`, `eyeShape`, `glowLevel`, `igniteStage`. **Do NOT touch the `archetype:'phoenix'` legacy
inference in `js/dragonRecipe.js` (~line 67)** — the shipped `phoenix` still relies on it during
coexistence. The new `phoenixEmpress` block sets explicit `parts` (which win over any inference) AND
keeps `archetype:'phoenix'` only as the RIG flag (ember-motes / Rebirth Surge); verify the explicit
parts are not shadowed by the inference for the new key. Roster stays byte-identical until
`phoenixEmpress.parts` opts in; the shipped `phoenix` is never edited until the migration call.

---

## CHANGELOG

- **2026-07-09 — sheet authored.** Fable-synthesized from the owner's 4 reference images + the premium
  method. Owner-confirmed TRAIN-HERO direction.
- **2026-07-09 — owner decisions folded in:** (1) build as a NEW coexisting roster block
  `phoenixEmpress` — do NOT replace the shipped `phoenix`; compare in-game, migrate/retire later
  (owner directive); (2) `title: 'The Dawnfire Empress'`; (3) apex-body = dark-garnet dorsal + a small
  pale-gold f3 belly nod; (4) the animated `trainSpread` fold/fan motion beat = APPROVED.
- **2026-07-09 — pre-scored to save iteration:** added QA-0 (the method §3.5 FIREWALL pre-score +
  round-0 self-audit, with Phoenix pass-conditions + per-axis round-0 targets + the reusable-kit
  inventory) so the apex build clears the known failure modes BEFORE the first high-effort Fable round.
- **2026-07-09 — Fable compliance audit fixes (vs the updated method):** fixed the opt-in key
  (`phoenix.parts` → `phoenixEmpress.parts`) and all QA commands to target the NEW key not the shipped
  one; `tricount phoenix` → `tricount --ci`; reconciled the apex tri budget (added legs/talons to the
  torso, f3 ~2.3k → ~2.0k so part-sum matches); fixed the f0 "no train" vs "2 nubs" contradiction (a
  2-nub STUB, asserted as stub-not-zero); renamed `pinionSlots` → `primaryGaps` and grounded it in
  raptor anatomy; scrubbed the "banner rise" phrase; reframed the near-white as a deliberate beat (not a
  quota); retitled §5 "REBIRTH LADDER"; grounded the empress persona in the fenghuang referent;
  acknowledged the dark-tone adjacency + added a TONE check to the veto; moved the tail-quill balance to
  a `starters.mjs` assert (wingsymprobe can't see the tail); teardrop-cut coal-eyes (not Solar's
  octahedron). Design core unchanged — all fixes surgical. Still the build contract; not implemented.
