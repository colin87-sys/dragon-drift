# DRAGON-DESIGN.md — the premium creature playbook

**Audience: the next session designing or building a dragon.** This file is the distilled
output of the arc that took Nightglass Vesper from an owner **1.5/5** ("a plane with
trailing-edge bumps… stiff and basic… no player would grind for this") to a shipped 4.5
premium — plus what Solar, the Phoenix line, and Jade banked before it. It teaches the
METHOD and the reusable kits, not one creature: the next dragon might be a serpent, a
raptor, a mech-drake, a leviathan — every law here is shape-agnostic. Read THIS instead of
spelunking the ledger; the short reading list at the bottom is the only set of lessons that
matter for dragon work.

Companion docs: [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md) (coexist keys,
ladder plumbing, the failure-class gauntlet in detail), [`STARTER-REDESIGN.md`](./STARTER-REDESIGN.md)
(the azure/ember/jade trio's sheets + the verbatim gate prompt),
[`BOSS-DESIGN.md`](./BOSS-DESIGN.md) §2 (the measured budget truths dragons share).

---

## 1. The fixed context every dragon designs against

- **Rear-chase primacy.** The camera rides behind and above; the DORSAL surface, the wing
  TOP, the TRAILING EDGE, and the TAIL seen END-ON are ~95% of play. The face is ~0% of the
  play frame — it matters in the shop turntable, the tier-up reveal, and hero shots. Design
  the rear first; judge the money feature in the money angle (Vesper's giant eyes read as
  lit nostrils until they moved HIGH on the brow and converged toward the lens).
- **Two viewing distances, two budgets.** At gameplay distance the dragon is SMALL and often
  BACKLIT: only the silhouette, the span, and the lit accents read. In the shop/tier card it
  fills the frame: surface craft reads. Split every design decision across these two reads
  (§3, the silhouette-economics law).
- **The sun DOES shade a dragon's dorsal surfaces** (unlike a boss's front face) — facet
  relief, overlap shadow, and camber are rewarded with real shading. Sculpt AND paint the
  value hierarchy.
- **Engine**: 100% procedural, vanilla Three.js r160, flat-shaded low-poly, 60fps on weak
  mobile. Tris are effectively free (≤6,000/form on HIGH is the test ceiling and nothing
  ships near it); draws are cheap; **overdraw is the cliff** — never wrap a body or wing in
  an enclosing additive/fresnel shell (BOSS-DESIGN §2).
- **Architecture**: a dragon = part-builders registered in a module
  (`registerTorso/Wings/Head/Tail` from `dragonRecipe.js` — see `dragonVesper.js` for a
  complete premium example), a def in `dragons.js` (palette + `model` dials + a `forms[]`
  ladder that overrides dials per rung), and the SHARED rig in `dragon.js` that poses wings
  and walks tails every frame. You author geometry + dials; the rig owns time. **Never
  animate what the rig owns** — publish joints and let its nullable loops drive them (§5).

## 2. The failure modes — KILL ON SIGHT

Name these out loud at every render. Each one has shipped at least once and been rejected.

| # | Failure | The tell | The fix |
|---|---|---|---|
| 1 | **The plane / delta-kite wing** | Straight leading edge + straight trailing edge + sine bumps. Reads as a paper dart. Convex "scallop lobes" whose valleys never cut inward are still this failure. | The fingered wing kit (§4): knuckled arched leading edge, radiating bones, membrane cupping INWARD. |
| 2 | **The stick / rod limb** | A cylinder or thin box doing the job of an arm, neck, or tail root. | Loft it with a real profile (shoulder swell, haunch mass, taper); give it nubs/plates in the creature's surface language. |
| 3 | **The paper-thin flat blade** | A single-quad fin/horn/feather, edge-on invisible, plank-flat face-on. | Multi-tri WEDGE: a tent-ridge with a top face and side faces (a raised skeletal ray), or a two-layer top-vane/belly-skin airfoil. Thickness kills the plank; deep camber just digs a dark pocket — keep camber shallow. |
| 4 | **The picket-fence fan** | N equal spikes/fingers/feathers at equal pitch. Reads as a comb, or bright, as a firework. | A DOMINANT + decaying rank (Vesper `lenFrac [1,.82,.66,.50,.36]`; Solar's carpal lance ~2.6× its rank pikes, decay `0.62^i`). Fat elements with an in-plane width axis, never needles. |
| 5 | **The bolted-on wing** | Membrane meets hull at a naked line; the wing looks glued to a tube. | A real SHOULDER the wing grows from: scapular cowl plates lapping the root (overlap > weld — no seam to fail), plus a root gusset sweeping aft to the hip (§4). |
| 6 | **The severed appendage** | Daylight between a tail stem and its fans, a jewel floating off a spike tip, a trail emitting from empty air. | Build a connective WEB first and hang the parts off it (shared vertices into the stem). Seat tip jewels at ~0.9× blade length. FX markers ride the moving part (§5.6). |
| 7 | **The landing-gear leg** | A tucked limb hanging straight down. | Raise the knee and hug the limb to the hull (knee up + inboard) so it reads folded, not deployed. |
| 8 | **The flat-black (or flat-anything) poverty** | One value where the bar has four. "Lacks richness" is usually literally this. | Value TIERS with endpoints spread wide enough to read (§3.2). |
| 9 | **The LED-strip / rider-halo glow** | A painted emissive stripe along a surface, or one round bloom blob. The owner rejected the strip twice. | Glow as COMPONENTS lighting up — discrete nubs, plates, rims, the membrane underside (§6). `hideRiderGlow: true` if the rider bloom fights the creature. |
| 10 | **The 1-bone plank / rigid tail** | The wing hinges only at the root; the tail swings as one unit. "Stiff" is a rig-DOF problem, never a geometry problem. | The motion kit (§5): publish real joint chains + a wrist fold. |
| 11 | **The stacked-rings loft** | A smooth elliptical loft beading into ring bands under flat shading. | A fixed-polygon loft (`knapLoft` + a shared chined profile): every facet column becomes a longitudinal strake, painted in per-column value bands. |
| 12 | **The sawtooth membrane** | A concave curve sampled at 2 segments polylines into scissor-cut V teeth. | Sample every membrane arc at ≥4 segments; keep inter-lobe cusps ~⅓ of peak depth. |
| 13 | **The photocopied motion** | Tail/flap dials byte-identical to another dragon's. Motion IS identity. | Author a bespoke signature (Vesper: deeper/slower undulate than the roster's flame-whips). A copied dial block is a real defect at the gate. |

## 3. DEPTH, THICKNESS, RICHNESS — where they actually come from

1. **Thickness is geometry, not texture.** Every blade-like element is a wedge (§2.3).
   A filled wing can still be a flat plank from the SIDE — give it a top surface and a
   separate belly skin. A body is a lofted volume with named masses (shoulder swell, haunch)
   — and a mass you modeled in cross-section is worthless unless it breaks the OUTLINE
   (add the explicit dorsal bump; see law 6).
2. **Value tiers: ≥3–4 that READ, and check the ENDPOINTS before adding steps.** "Lacks
   richness" is usually one value where the bar dragons have four. But N tiers lerped toward
   a target too close to the base compress into one grey (Vesper's four tiers spanned 0.02
   luminance = invisible; re-aiming the lerp at a lit steel-slate spread them 0.05→0.14 and
   all four read — a ONE-LINE fix). Judge tiers on the brightest biome the dragon flies in,
   not a dark thumbnail.
3. **Richness = number of ORGANIZED detail systems, not triangle count.** Solar reads twice
   as rich as a same-budget dragon because it has ~7 organized ranks (panel ranks, battens,
   spire rank, tail spikes, corona, mantle, gem string). Budget ~5–7 repeating-unit systems
   (a `shingleRow`-style helper: one authored unit laid along different paths). N repeated
   feathers at a fixed pitch read as crafted plumage; the same N tris scattered read as
   noise — the gate scores a noise veto.
4. **Knapped / overlapping plate fields** give close-range richness on any hull: struck
   flake-plates lapping diagonally in the creature's facet language. Overlap > weld
   everywhere — an overlapped joint has no seam to fail.
5. **Layered surfaces**: bone → covert row → membrane (or strut → vane → skin). A wing with
   a skeletal layer riding proud of the sheet reads organic from every angle; relief only on
   the dorsal face still leaves a cold ventral plank (give the belly its own warm skin, and
   a low emissive floor if metalness can crush it to black).
6. **THE COUNTER-LESSON — silhouette economics.** At gameplay distance the dragon is small
   and backlit: surface plates and coverts are INVISIBLE there. Spend the play-distance
   budget on the OUTLINE — crest/crown, legs, tail volume, span, wing shape — and spend
   surface richness on the close/shop read. A matte-black drake shipped at ~1,060 apex tris
   against Solar's ~3,300 and reads premium BECAUSE the silhouette does the work. Tri budget
   is cheap; **legibility is the constraint**. Corollaries: a repeating row must run to its
   anatomical terminus (a spine ridge that stops mid-back reads unfinished); every landmark
   should rhyme with the hero feature (Vesper's tail fans are its wing recipe in miniature)
   so the creature reads as ONE design.

## 4. The WING kit

The reference implementation is `buildScallopCrescentWings` / `buildOneScallopWing`
(`dragonVesper.js`) — the fingered membrane wing that killed the plane read. The recipe
generalizes to any membrane wing; §4b covers the non-membrane families.

1. **Knuckled leading edge, never a straight bar.** Two curves compose it: a gull ARCH in Y
   (rise to a carpal apex ~t 0.35–0.45, ease to the tip — Solar's `wingArchY`) and an OGEE
   in Z (bow forward mid-span, sweep hard aft to the tip — `vesperArmZ`). State the profile
   as a module-level FUNCTION shared by geometry, tip markers, and tests (§5.6).
2. **Radiating finger-BONES from the carpal knuckle** — raised tent-ridge wedges, not
   creases (a 0.014u "crease" is invisible). Finger 0 is the longest and IS the wingtip;
   the rest fan aft, shorter, drooping aft-and-down (never up-curl), with a dominant and
   real length variance (§2.4). A thin lighter rim-catch cap along each spine makes it read
   as a skeletal ray.
3. **Membrane cups INWARD between finger tips** — concave bézier arcs with the control
   pulled toward the knuckle (cup ≈ 0.35), **sampled at ≥4 segments** (the single
   highest-value fix in the whole rework; 2 segments = sawtooth). Bias the deepest sag
   slightly aft; drop each bay a hair so rim light pools.
4. **A MEDIAL wrist** (`wristT` ≈ 0.2–0.3): short arm, long-fingered hand — the bat
   proportion, and the natural fold joint (§5.3). **Span is pinned by the tip vertex**
   (`F0 = LE(1)`), so pulling the wrist inboard GROWS the finger fan without shrinking the
   wing. General rule: when the owner says "keep the envelope, change the proportion," find
   what pins the envelope and move everything else freely.
5. **Value tiers across the membrane** (§3.2): 3–4 materials graduating inboard-lit →
   outboard-near-black (or the reverse for a bright dragon), all inside the identity lane.
6. **A connected knife-edge**: ONE thin translucent strip tracing the whole scalloped
   trailing polyline — per-bay shards read as floating debris.
7. **Anti-plank extras**: a root gusset sweeping aft to the hip (buried under the cowl — the
   wing grows from the body, §2.5), a thumb claw at the knuckle, a covert row layering the
   upper surface. Subdivide + darken any big flat inboard triangle or the plane whispers
   back at the root.
8. **The shoulder**: scapular cowl plates in the torso's surface language, STATIC in the
   body frame (never parented to the flapping pivot) so they cover the membrane root through
   the whole flap.

### 4b. Non-membrane wings

The kit's LAWS (arched profile-as-function, dominant + decay, thickness, tiers, connected
edge, real shoulder) transfer; the surface swaps:
- **Feathered ranks** (Solar, the Phoenix line): shingled kite-feathers at ~55% overlap so
  only a shadow LINE shows between them (a 4-tier value gap between vane and root reads as
  teeth — keep ~2 tiers). Emarginated "fingers" must be fat, in-plane, aft-swept.
  Choose the profile family deliberately: interior-peak arch = an M silhouette (Solar);
  monotonic terminal peak = a rising rake (Phoenix Reforged) — the function IS the identity.
- **Fan / lobe wings** (Jade): mirrored lobe pairs beating on shared phase via
  `wingLobePivots` — see the jade branch of the rig.
- Whatever the surface, the rear-chase read comes first: "reads as the intended shape, not a
  kite, from behind" is a round-1 check, not a polish item.

## 5. The MOTION kit — what "excellent wing + tail motion" actually is

"Stiff" always means too few animated joints. The cure is never re-sculpting — it is
publishing hinges the shared rig already knows how to drive, built so the REST pose stays
byte-identical.

> **Tuning the WING-FLAP specifically?** This section covers publishing the hinges; the full
> flap-tuning method — the dial vocabulary, the design laws (the glide-hold plank, deep lag,
> and the depth-projection trap), the reference dial sets, and the gate — lives in its own
> playbook: **[`FLAP-DESIGN.md`](./FLAP-DESIGN.md)**. Read it before turning flap knobs.

1. **The tail: a 4-joint NESTED `isBone` chain** (`splitFanTail` → `segs: joints`). Build
   nested Groups down the stem, each child offset by the inter-joint vector; set
   `joints[0].isBone = true` (rotation-only — position writes tear a connected loft); bin
   every stem/nub/fan mesh to the joint whose z-span contains it, position-compensated by
   the −anchor (law 5). The rig's solver (`dragon.js` ~929) then walks it with THREE
   superimposed motions:
   - a **travelling lateral coil** — `sin(time·4.0 − i·0.6)`, amplitude growing tip-ward via
     `lock=(i+1)/nTail`, scaled by `tailLagScale` (0.12 ≈ neutral; author a bespoke value);
   - a **phase-lagged VERTICAL undulation** (`tailUndulateX`) — THE axis the rear-chase
     camera reads, since it sees the tail end-on. Verify it as a ± range over frames, never
     a point sample (a DC bias reads as a static droop, not motion), keep the per-joint
     phase lag in the coil's family (too much spread cancels the cumulative wave), and
     up-bias it so the most-down phase sits at/above rest — then corridor safety holds by
     construction;
   - a **banking rudder** trimmed by `tailRudderScale` — **per-joint locals COMPOUND on a
     chain** (world tip ≈ Σ locals ≈ 2.5× base on 4 joints); an untrimmed rudder turns a
     graceful arc into a J-hook. Whenever you multiply joint count, re-budget every
     per-joint gain against the new cumulative.
2. **The wing: a real hinge cascade on the `wingParts` glide-hold poser** (`dragon.js`
   ~735). Three nested Groups — `pivot` (shoulder) → `mid` (forearm) → `tip` (the HAND) —
   driven with per-segment amplitude + lag dials (`rootAmp/midAmp/tipAmp`,
   `midLag/tipLag`) and a `glidePow`-shaped waveform (`sign(sin)·|sin|^glidePow`) that HOLDS
   the broad glide pose and pulses through it: high glidePow = rare heavy beats ("commands
   the air"), low = frantic whelp flapping. Kill the raw sine metronome. Optional apex dials
   (`apexMid/apexTip/apexPitch/restLift`) lift the stroke into a held high-V.
3. **The wrist fold: the hand moves as ONE rigid unit.** A membrane is a continuous sheet —
   split it across N independently rotating segments and it tears. Split at the natural
   crease instead: the builder returns `{ arm, hand, K }` — arm (bone + gusset + thumb)
   parents to `mid`; hand (EVERY finger + the WHOLE connected membrane + knife-edge) parents
   to `tip`, positioned at the carpal `K`. Any geometry that spans a joint must keep all its
   vertices on ONE side of that joint (or on the pivot itself) — the root gusset tore until
   it was re-anchored to arm-side points only.
4. **⚠ NON-NEGOTIABLE #1 — the −anchor trick.** Every reparent under a joint offsets the
   child by the joint's position: `tip.position.set(K)`, `hand.position.set(−K)` (chains:
   compensate by the cumulative offset). The assembled REST pose stays byte-identical —
   tests, tricount, and the shipped look are untouched while the joint gains articulation.
   This is how you add motion to a shipped-looking creature with zero visual regression.
5. **⚠ NON-NEGOTIABLE #2 — the mirror convention.** The shared posers write IDENTICAL L/R
   rotations. Build BOTH wings canonical (+X) and mirror the LEFT with an **outer**
   `scale.x = −1` wrapper that PARENTS the pivot (rotate-then-flip). `pivot.scale.x = −1` ON
   the pivot (flip-then-rotate) desyncs rotation.y/.z — wings beat in opposite directions
   (`wingsymprobe` Δ0.000 → ~3.0). Two corollaries: (a) a mirror transform and a per-side
   sign convention BOTH flip — use exactly one (a mirrored wing feeding a rig loop takes
   `side: 1` on both, or the flip doubles); (b) a body-frame piece built in a
   `for (side of [1,−1])` loop handed `side<0 ? matA : matB` is an accidental L/R value
   asymmetry — same material both sides; the only sanctioned asymmetry is a deliberate,
   named marking.
6. **FX handles ride the moving part.** The tip marker / `wingElements` tip must (a)
   duplicate the SAME profile function as the geometry (hoist it — two copies of a formula
   is the trail-detach bug) and (b) parent to the FOLDING group (`hand`), or trails emit
   from where the wingtip used to be.
7. **Prove motion with numbers + a strip, never a still.** Green headless tests do not prove
   motion: Vesper shipped a 1-bone plank with every probe green because the rig was rotating
   an EMPTY group (def lacked `wingParts`, so the fallback poser wrote `pivot`+`tip` and
   never `mid` — where all the geometry sat). Name your pivots, sample their rotations over
   N frames headlessly (the per-joint amplitude table proves the wave travels: e.g. seg0
   ±0.036 → seg3 ±0.124 rad), and run `flapstrip` for the 5-phase pose read. A hinge and the
   geometry it should move living in different objects is THE motion bug family — check for
   it in both directions (joints with no geometry / geometry with no joints).
8. **Ladder the motion** (§7): whelp `wingParts:1, glidePow 0.9` (frantic) → apex
   `wingParts:3, tipAmp 0.55+, glidePow 2.2` (deep wrist fold, held glide). The maturing
   BEAT is a grind-visible upgrade.

## 6. GLOW and accents — components, never strips

1. **Withheld-in-cruise is the premium move.** The signature accent is DARK in cruise —
   only the eyes glow at rest — and ignites at the signature moment (Surge). The shipped
   surge tick is MULTIPLICATIVE: `emissiveIntensity = baseIntensity · (1 + surgeMix·0.9·sgm)`
   over `materials.spineMats`, lerping toward `surgeHi`. So: `baseIntensity ≈ 0.04`
   (imperceptible) + a high `model.surgeGlowMultiplier` (Vesper: 22) → a capped blaze only
   on Surge. Eyes are driven separately — keep them OUT of the surge arrays.
2. **Override the WHOLE fever palette.** The rig's Surge defaults are MAGENTA
   (`feverWing ?? 0xff44cc`, `feverEye ?? 0xff66ee`) — any non-pink identity renders
   hot-pink until every hook is overridden: `feverWing` (0x000000 = wings stay silhouette),
   `feverEye`, `feverWash`, `surgeHi`. Note `sgm` also multiplies the wing glow target —
   a black feverWing is the kill switch. Set `wingEmissive` explicitly (an absent field
   reaches `setHex(undefined)` and works by luck). Dense lit fields (feather ranks) go in
   `materials.flareMats` — flared on Surge but exempt from the rim that would wash them.
3. **Glow reads as COMPONENTS lighting up, never a painted stripe or a halo blob.** Put the
   emissive on discrete geometry the creature already owns: crowning cores on dorsal/tail
   nubs, plate rims, fin rims, the membrane UNDERSIDE (a backlit wing). The owner rejected
   the same accent twice as an "LED strip" until it became the components igniting. On a
   dark creature, kill the rider's round Surge bloom (`hideRiderGlow: true`) — the creature
   owns the frame with its own accents.
4. **Rim/tip, never face** (the coal-not-torch law): when lighting a repeated element, the
   bright part is the RIM or TIP over a dark face — a lit face reads tacky; a glowing tip on
   a dark blade reads jeweled. Saturated emissive baked into opaque facets (sat ≥0.75)
   blooms in-colour under ACES; ≤1 tiny near-white element, kept out of the surge arrays.
   Pick separated hues by how they BLOOM, not by hex distance (crimson and rose bloom to the
   same pink).
5. **Emissive geometry gotchas**: a one-sided strip winding away from the camera is
   back-face culled — the ignition looks like a no-op (thin emissive strips:
   `side: THREE.DoubleSide`). Prove any bloom-washed motif with a PROBE
   (`seamprobe`-style: read the material's actual hue/intensity through the surge math) and
   judge cruise/surge as a MATCHED dark-sky pair, never against a warm biome capture.
6. **"Only X glows" asserts weigh CONTRIBUTION** — `emissiveIntensity × luminance(emissive)`
   — because intensity defaults to 1.0 and a black emissive contributes zero at any
   intensity.
7. **The dark-identity note.** A matte-black dragon returns ~nothing from a standard rim —
   unphotographable on a dark card. Never grey the body (if "darkest object" is an identity
   law, keep it); instead gate a kicker rig on `luminance(def.body) < 0.05` in the capture
   harnesses: boosted cool rim + a second wing-edge kicker + a faint brand-hued floor
   bounce, warm key unchanged, bright dragons byte-identical. Outline it, never grey it.

## 7. The TIER LADDER — every rung earns in CRUISE

Players grind forms; a form that only differs during Surge confers nothing for 95% of play.

1. **Each rung is a CRUISE-visible upgrade**: segment/finger count, regalia meshes, crest,
   span, plate density, motion depth. Gate each regalia MESH to a rung (absent on the whelp
   — not merely dimmed), so ascending confers hardware + light + silhouette, a coronation
   arc, never "same dragon at four sizes."
2. **Encode the growth VERB as monotonic asserts.** Whatever the redesign makes the earn —
   knapping + folding + a maturing beat, ignition stages, arch rise — assert it rung-over-rung
   in the dragon's own `tests/starters.mjs` block (e.g. fingers `2<3<4<5`, `tipAmp
   0<0.3<0.46<0.55`, `glidePow 0.9<1.2<1.7<2.2`, tris monotonic ↑) so a future edit can't
   silently flatten the ladder.
3. **Signals grow UP the ladder, never invert**: body/eye/light reads must rank correctly —
   a whelp must never out-read the apex (big whelp eyes are fine; a brighter whelp is not).
   An inverted identity (apex = darkest) is legal but must itself be asserted monotonic.
4. Build the APEX first and gate it to PASS; the ladder is subtraction from the apex, not
   addition toward it (PREMIUM-DRAGON-METHOD).

## 8. The PROCESS that actually worked

1. **Coexist → hero → migrate.** New builders self-register DEFAULT-OFF in a fresh module;
   a new roster key opts in; everything shipped stays byte-identical (prove it). Prove the
   design on the HERO form, then ladder. Never break the shipped roster. (A cheap A/B —
   a second key spreading the def with richness dials off — is a legitimate deliverable
   when the owner wants to compare live.)
2. **The Fable loop is MANDATORY: design-director, then a HARSH CRITIC gate at every
   checkpoint.** Self-judging is banned by owner mandate. Spawn a high-effort Fable design
   director to produce the plan/sheet; after each checkpoint spawn (and then RESUME — the
   r1→r2 comparison is sharper than a fresh spawn) a harsh critic judging REAL renders with
   a numeric bar (avg ≥4.0, no axis ≤2, binary vetoes). Budget one rework per checkpoint;
   a first-try pass means the bar is too soft. The critic repeatedly caught what green tests
   and self-review missed: the 1-bone plank, the mirror desync, per-side material
   asymmetries, the eyes failing in the face-front angle. Point it at "diagnose why this
   reads simple and prescribe a costed plan," not just "score this."
3. **Benchmark against the ROSTER'S BEST and the owner's references, NOT just the spec.**
   A sheet's own doctrine can be the failure — Vesper's build sheet literally specced the
   plane wing, and a sheet-compliant build earned a 1.5/5. When the owner rejects a
   compliant build, the sheet is the bug: run a fresh design pass that REVISES the sheet.
   A synthesis gate that benchmarks the whole roster also catches "leaner than its peers."
4. **Verify before claiming** (§9), and the human judges motion/feel on the PR preview —
   the gate is structurally blind to motion, biome interaction, and dark-shop legibility;
   ship those as named residuals riding the preview.
5. **THE RULE applies per checkpoint**: every checkpoint that changed the creature owes a
   NEW lesson file in `leapfrog/lessons/` — a synthesis reviewer treats a missing one as a
   process defect.

## 9. The VERIFICATION HARNESS (run from `reforged/`, always `cd` first)

Verify by FAILURE CLASS — each tool catches what the others are blind to:

| Class | Tool | Gate |
|---|---|---|
| Budget | `node tools/tricount.mjs` | every form <6000, monotonic up the ladder |
| Integrity | `tests/blueprint.mjs` (via `node tests/run-all.mjs`) | parts resolve, no NaN vertices (a NaN passes every geometry test and only shows as an empty render — the guard lives in starters) |
| Runtime | `tests/smoke.mjs` headless flight | the dragon actually renders in flight (two invisible-dragon crashes only ever surfaced here) |
| Symmetry | `node tools/wingsymprobe.mjs <key>` | Δ0.000 bilateral across all 5 flap poses — catches mirror-convention bugs |
| Accent law | `node tools/seamprobe.mjs` | cruise ≈ dark / surge = the identity hue, through the real surge math |
| Motion | `node tools/flapstrip.mjs <key>` + a named-pivot amplitude capture | the 5-phase chase-cam read + proof the wave travels (±ranges per joint, not point samples) |
| Ladder / shop | `node tools/tiershots.mjs <key>` | all forms, rung-over-rung earn visible; dark-identity kicker applies here |
| Gameplay read | `node tools/gameshots.mjs` / `surgeshot.mjs` | the real rear-chase frame + the Surge money shot |
| Identity laws | the dragon's block in `tests/starters.mjs` | tris↑, value-ramp monotonic, cruise-emissive = eyes-only by contribution, motion-ladder monotonic, and a no-forbidden-import FIREWALL (a static source check guarding the redesign premise; match import STATEMENTS, not prose — a comment naming the banned module will bait a loose regex) |

Hero/review captures: append `?norider` to hide the rider + its bloom. `dragonstudio.mjs`
has a `surge` state for matched cruise/surge pairs on one sky. Two standing rules: **eyeball
a render after every geometry change** (green tests lie about pixels), and bring the critic
BOTH the strip and the numbers.

---

## North star

A premium dragon is a creature you'd grind for at BOTH distances: at gameplay range it is a
living silhouette — an outline you could name in one sentence, a held glide that breaks into
heavy wingbeats, a tail that travels a visible wave past the camera — and in the shop it is
a crafted object: organized ranks, four values that read, a wing that grows out of a real
shoulder, an accent that stays dark until the moment it owns the frame. The engine's
constraint is legibility, never triangles; the process's constraint is honesty — a harsh
critic at every checkpoint, benchmarked against the best thing already shipped, verified by
failure class before any claim. Kill the plane wing, the stick limb, the plank hinge, and
the LED strip on sight, and build the METHOD's way from turn one: profile-as-function,
dominant-plus-decay, −anchor joints, outer-wrapper mirrors, withheld light.

## The pre-ship checklist

- [ ] Silhouette: rear-chase outline nameable in one sentence; masses break the OUTLINE, not just the cross-section; detail rows reach their termini; landmarks rhyme with the hero feature.
- [ ] §2 sweep: zero failure modes present — say each name at the render.
- [ ] Wing: arched knuckled leading edge (a function), dominant + decaying fingers/feathers, inward-cupped membrane ≥4 seg, connected knife-edge, cowl + gusset shoulder, thickness on every blade.
- [ ] Values: ≥3–4 tiers that READ (endpoints checked), judged on the brightest biome + the shop card; dark identity has its kicker rig.
- [ ] Motion: real joint chain(s) published (`isBone` tail, `wingParts` cascade + wrist fold); −anchor rest pose byte-identical; outer-wrapper mirror; bespoke dials; amplitude table + `flapstrip` prove it; FX markers ride the folding part.
- [ ] Glow: cruise = eyes only (by contribution); accent withheld (base ≈0, high `surgeGlowMultiplier`); full fever palette overridden; glow is components, not strips; DoubleSide on thin emissive.
- [ ] Ladder: every rung a cruise-visible earn; growth verb asserted monotonic; no inverted signals.
- [ ] Harness: tricount · blueprint · smoke · wingsymprobe Δ0.000 · seamprobe · flapstrip · tiershots · gameshots/surgeshot · starters block (incl. firewall) all green; roster byte-identical.
- [ ] Process: Fable director plan; harsh critic PASS at every checkpoint (resumed, ≥4.0); benchmarked vs Solar/Phoenix + owner references; residuals named for the PR preview; a lesson file per checkpoint.

## Ledger reading list (the only lessons that matter here)

- `2026-07-12-vesper-cp1-fingered-batwing-rework.md` — the plane-wing autopsy + the wing kit.
- `2026-07-12-vesper-cp2-body-tail-richness.md` — welded terminals, silhouette bumps, termini, hero-echo.
- `2026-07-12-vesper-cp3-motion-wing-fold-tail-chain.md` — the plank bug, wrist fold, −anchor, mirror convention.
- `2026-07-12-vesper-cp4-value-tiers-holistic-ship.md` — lerp endpoints, growth-verb asserts, the roster-benchmark gate.
- `2026-07-12-vesper-directive3-silhouette-economics.md` — outline vs surface budgets, tip-pinned span, the dark-card kicker.
- `2026-07-11-vesper-i4-starlit-seam.md` + `i5` — withheld emissive math, fever overrides, contribution-weighted asserts, the firewall.
- `2026-07-11-fluid-tail-chain-and-wing-blade-flutter.md` — the tail-chain physics: compounding locals, phase-lag families, up-bias-by-construction.
- `2026-07-10-premium-richness-organized-ranks.md` — organized ranks, `shingleRow`, the NaN guard.
- `2026-07-09-premium-dragon-method.md` + `2026-07-09-solar-cathedral-arch-spectacle.md` — apex-first, profile-as-function, withheld regalia.
- `2026-07-09-phoenix-empress-coal-not-torch-build.md` — rim/tip value structure, hues by bloom.
