# FORNAX — "The banked furnace" · Premium Build Sheet (fire wyvern)

The builder's contract for a bespoke, low-poly, premium **western fire wyvern** — two hind
legs, wings-as-arms, a furnace inside a char-armoured hull. Authored fresh; its own dragon,
its own surface language, never Smaug/Drogon/Rathalos.

**Read first:** [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md) (kits + failure modes),
[`AAA-PIPELINE.md`](./AAA-PIPELINE.md) (value-structure law, cheap-tell registry, convergence),
[`FLAP-DESIGN.md`](./FLAP-DESIGN.md) (before touching flap dials).
**Companion reference: [`DRAGON-ANATOMY-REFERENCE.md`](./DRAGON-ANATOMY-REFERENCE.md)** — all
`(ref §N)` citations below point THERE; this sheet never restates its tables. **Numbers here
are the authority; the Fable gate (§12) judges against this sheet.** Every dial is written
`value (ref §N range, ×K exaggeration)`; where the reference gives no consensus figure the
sheet locks a RANGE and says so.

> **⚠ REFERENCE-FORCED REVISIONS (do not resurrect the drafts):** the earlier locked
> direction specced a **hooked spade tail** (not period, the #1 de-kitsch target — ref §1),
> **tucked hind legs** (raptors don't tuck; tucked is invisible from the chase cam — ref §3),
> and an implied deep **keel blade** (flight muscle is 20–25% of mass, keel SHALLOW — ref §2).
> All three are superseded below (§2, §7, §8). The rear-chase sentence was rewritten.

---

## 0. Identity contract

Fresh roster key **`fornax`** — coexist-style, nothing shipped changes. Fields:
`name:'Fornax'` · `title:'The banked furnace'` · `rarity:'SSR'` / `maxRarity:'SSSR'` ·
`cost` owner call · `stats` (speed 1.14 / handling 0.96 / drain 0.9 / regen 1.1 — a heavy
flyer, placeholder, owner tunes) · `fx.auraColor '255,112,16'` (furnace amber `#ff7010`) ·
`forms[]` accretive, length 4 · `hasStyle` · new module `js/dragonFornax.js`, builders
default-off, hero opt-in only.

**Frozen identity laws:**
1. **The furnace is INSIDE.** Glow only ever LEAKS where the armour parts (plate seams,
   throat keel, membrane underside). No surface-painted flame, no torch, no lit faces.
2. **FOUR limbs, never six** (ref §1 — the one hard wyvern law). No forelimb geometry, no
   shoulder-hinged wing separate from the arm, at any rung, ever. The wing IS the arm.
3. **Cockatrice guard** (ref §1): no bird-scaled feet, no comb/wattle, no beak. Feet are
   plated reptilian, three-toed.
4. **R ≥ G ≥ B strictly, everywhere, in every fire pixel** (ref §7). B > G anywhere =
   plasma = defect. Never author a white core — the tonemapper clips it (ref §7).
5. **Wing TOPS never emissive.** The underside owns the backlight; the dorsal silhouette
   survives its own spectacle (locked direction, confirmed by ref §7 painters' law).
6. **Cruise = eyes + a banked-coal hint only**, contribution-capped; near-zero base
   emissive, high surge multiplier, full fever palette overridden (house §6).
7. **Char is never flat black**: albedo 0.02–0.045 linear, cool-neutral tint (ref §7) —
   the WARMTH is emitted (leak light + warm key), never painted into the diffuse.
8. **One blue exists**: a diffuse temper-oxide iridescence band (straw→purple→blue,
   ref §7) on horn tips + plate rims. Non-emissive, close-range only, ≤1% of surface.

## 1. Art direction (north star)

**BANKED — a furnace wearing its own slag.** Real banked coals are dark on top and alive
underneath; the fire is not ON the creature, it is IN it, and the armour exists BECAUSE of
it — heat-shield plates, char-dark outer faces, ember-rimmed only at the overlaps. Solar
wears spectacle as a crown, Vesper withholds cold light; **Fornax withholds HEAT** — cruise
is a charred silhouette with two eyes and a coal-hint, and THE STOKE (§3) is the furnace
remembering itself. Hue lane: furnace amber-orange, blackbody-anchored `#ff3800→#ff8912→#ffb46b`
(1000–3000K, ref §7) — never yellow-white paint, never red-pink, never vert (the pestilence
tincture, ref §1). Gules/gold is the sourced fire-wyvern tincture family (ref §1); ours is
gules driven to char. Hero: **THE UNDERLIT CRESCENT** (a LOW WIDE four-digit crescent —
taut flat bays, dark above, furnace-lit beneath; planform + bay language set apart from
Vesper's tall deep-cupped fan by committed numbers, §2/§5 — and pose-gated: it is a
bank/transition payoff, not a constant, §5). Motif: **THE STOKE** (the seam network
igniting tail-ward).
Growth verb: **STOKING** — the whelp is a cold coal; each ascension feeds the furnace.
One word: **BANKED.**

Stylization axes (locked): taper contrast **×3 over reference** on every limb/horn/digit;
curve-vs-straight alternation on every profile; large struck facets; **four value tiers with
endpoints spread ≥0.05 luminance** (house §3.2); **dominant + decay on every rank** — no
equal-pitch rank anywhere (ref §6: equal ranks have NO natural precedent).

**Rear-chase sentence (re-rewritten — audit B4; supersedes the spade/tuck draft AND the
chipped-brow/countable-finger draft):**
*"A charred anvil slung between two vast low crescents, each read by its scalloped
three-bay trailing edge, twin swept horns rising into clean sky, hind legs splayed
bat-wide into the wing–tail gap, and a long ridge-crested tail rolling end-on to a blunt
ember firebrand."*
(The chipped brow is ~2–3px from the chase cam — it lives in the §11 turntable-only list,
not in this sentence. At gameplay scale the whole dragon spans ~180px: digits are NOT
countable; the wing's rear-chase claim is the scalloped 3-bay trailing-edge silhouette.)

## 2. Silhouette language + distinctiveness gate

Primitive: **a low wide crescent-pair around a dominant anvil, punctuated above by a
backswept horn rank and behind by a ridge-crested tail.** Mass census **4, one dominant**
(ref §8: 3–5, mode 4): ① the anvil torso (DOMINANT), ② the wing-crescent pair,
③ the horned head, ④ the ridge tail. Legs are tertiary (~30% of their parent mass, ref §8).
Primary split 70/30 torso-forward vs aft (never 50/50, ref §8). Colour 60-30-10
(ref §8): 60 char, 30 ash/scorch midtone, 10 ember accent — accent in exactly TWO contiguous
places (throat-keel seam + wing underside), ≤10% of area.

**Kit-coherence test (ref §9):** every landmark rhymes with the FORGE — plates are heat
shields, seams are where slag parted, the tail tip is a firebrand, horns carry temper-oxide
like worked steel. If a part could be swapped onto another dragon unnoticed, it fails.

**Distinctiveness gate (vs the shipped roster — REWRITTEN FROM THE CODE, audit B1; the
earlier table was written from build-sheet titles and misdescribed Vesper):**

| Axis | Solar | Phoenix line | Vesper (per `dragonVesper.js` / `dragons.js`) | Tempest | Azure/Ember starters | **Fornax** |
|---|---|---|---|---|---|---|
| Region | top crown | bottom train | fingered bat wing + Surge-only ion UNDERGLOW (dropped underside copy, `dragonVesper.js:458-464`) | storm-premium FX | compact combs | **body-wide interior SEAM network; the underglow MECHANISM is shared with Vesper — Fornax's claim is the amber lane + the seams, not the trick** |
| Limb plan | 6 (dragon) | 6 | wings + two TUCKED hind legs, NO forelimb builder (`dragonVesper.js:274-278`) — already a de facto wyvern silhouette | 6 | 6 | **4 by identity law, with ABDUCTED (not tucked) legs — the roster's only abducted-leg flyer** |
| Wing | vault-bays + lances | feather ranks | FIVE-finger bat fan from a carpal knuckle, dominant finger 0, propatagium, thumb claw, root gusset, cowl plates; tall arch (`archRise 0.4`) + DEEP cups (`wingCup 0.35`), `wristT 0.21` (`dragonVesper.js:358-374,413`; `dragons.js:601-603,613`) | storm membrane | feather blades | **4-digit fan on a LOW WIDE crescent: `archRise 0.12`, TAUT FLAT bays (sag ≤0.10 bay-chord vs Vesper's 0.35 cups), `wristT 0.30` — planform + bay language, not mechanism (§5)** |
| Surface | gold regalia | plumage | knapped glass | storm polish | — | **lava-lake char plates, T-junction seams** |
| Motif | ring + gem | coal arc rim/tip | starlit seam (cold) | arc crown | — | **THE STOKE — interior seam ignition, tail-ward** |
| Glow lane | violet 262° | warm triad rim/tip | ion blue 223° | storm | pale ice | **blackbody amber ~25°, interior-leak, withheld** |
| Darkness lane | — | — | COLD unlit black | — | — | **warm-keyed CHAR (cool albedo, emitted warmth)** |
| Growth verb | coronation | rebirth | knapping | — | — | **STOKING** |

**What is actually unique (audit-corrected):** the fingered fan, dominant leading digit,
dark-top/lit-belly, propatagium, thumb claw and cowl plates ALL ship today on Vesper —
"Fornax's 4-digit fan" is Vesper's wing minus one finger unless differentiated on a real
axis, and "the roster's only true wyvern" overstated (Vesper already reads as a wyvern
silhouette). So the wing differentiates on PLANFORM + BAY LANGUAGE with committed numbers
(table row above, dials in §5), and the identity leans on what IS unique: the four-limb
plan with ABDUCTED legs filling the chase-cam wedge, the char-plate T-junction surface,
THE STOKE, and the amber interior-leak lane.

**Anti-collision notes:** Phoenix owns feathers + the rebirth train — Fornax has zero
feathers and its warmth comes from BENEATH armour, not from rim/tip plumage; the Ember
starter is a warm hue on a starter budget — the gate (§12) calibrates on an Ember tile and
must place Fornax cleanly apart (interior-leak vs surface warm). Vesper owns cold unlit
black — Fornax's char is warm-KEYED and seam-veined; never grade Fornax toward blue-black.
The Surge underglow mechanism is SHARED (Vesper shipped it first); the §12 Vesper tile
must split on hue lane + planform, and never claim the mechanism as Fornax's.

## 3. THE STOKE (signature FX — the quality bar for the whole creature)

On Surge the furnace ignites **tail-ward down the seam network over ~0.8s** (per-segment
emissive ramp, CPU-driven, headless-testable). ⚠ Mechanism citation corrected by audit:
Vesper's `seamRun` is a geometry-EXTENT ladder dial (`dragons.js:617,642-663`) — how much
circuit EXISTS per form — not an ignition mechanism. The travelling ignition is the house
**casLevel cascade stagger** (`dragon.js:1959-1980`) plus the Tempest **`stormTimer`
deterministic-clock pattern** (`dragon.js:1997-2045`) for the front's timing; `seamRun`'s
role here is only the §10 extent ladder. The run terminates in the tail firebrand; the
wing membranes backlight from BENEATH; wing tops stay dark (law 5).

- **Emitter law (ref §7):** author the seam/underside emitter at **2000K `#ff8912`**, high
  intensity, and let ACES clip the core — never paint white. Peak ramps toward
  `#ffb46b` (3000K) at the throat keel only. `surgeHi` warm-amber; strict R≥G≥B.
- **Bloom (REVISED — audited against `postfx.js`):** the renderer has ONE full-screen
  threshold `UnrealBloomPass` (`postfx.js:382-384` — strength 0.32→0.24, fixed radius
  0.25, threshold 1.0): no per-object bloom, no authorable halo radius. During Surge the
  house no-cream law DROPS strength to ~0.09 and raises the threshold +0.85
  (`postfx.js:583-589`) so only the hottest cores bloom; at detail tier 2 the composer is
  OFF entirely (`postfx.js:453-457`) — **zero bloom on the weak-mobile floor.** The
  ref §7 halo:emitter ≈ 6:1 is therefore a **tier-0 studio/turntable ASPIRATION, not a
  shipped guarantee.** The GUARANTEED halo carrier is GEOMETRY: emissive seam skirts +
  a dropped underglow membrane copy (the Vesper `memGlow` pattern,
  `dragonVesper.js:458-464`) authored in the skirt hue, so the amber gradient survives
  with no bloom at all. **Tier-2 read, specced:** seam cores clip toward white through
  ACES (confirmed, `main.js:107`), the geometric skirts carry the amber, nothing spills
  past the silhouette — THE STOKE reads as hot cracks in char, not a glow; that is the
  accepted floor. Bloom B ≤ 0.5·G; any fringe B ≤ 0.15·G (ref §7) — verified per the
  §11 tolerance-and-capture-mode probe, tiers 0–1 only.
- **Seam cross-section:** core:rim:field = **1 : 0.6 : 0.03** (ref §7, ≈30:1), 90% of
  falloff inside 3 crack-widths; multiply seam emissive by **`dot(N_seam,V)^2.5`**
  (ref §7 exponent 2–3) so lips flare view-dependently for free.
- **Frame economics (ref §7):** brightest area **1–3% of the frame**; lit region 20–35%;
  saturation peaks 1–2 value steps BELOW the brightest pixel — the throat core clips, the
  seam skirts carry the colour.
- **Shimmer:** vertex-wobble on already-drawn geometry + animated emissive ONLY (ref §7 —
  grab-pass refraction disqualified on mobile). Heat-ripple = a subtle wobble on the
  membrane underside during Surge.
- **Embers (RE-BUDGETED — the mobile ceiling is GLOBAL):** the 150–300 mobile particle
  ceiling covers ALL systems at once — trails, biome FX, surge motes — not this creature.
  At Surge the frame already carries those, so Fornax gets a per-creature allotment:
  **32 cruising (ref §7 24–40) → burst 90 on ignition (the floor of ref §7's 90–140,
  deliberately) → per-creature hard cap 120.** A Surge-time worst-case-biome census
  assert (§11) proves creature + trails + biome FX + motes stays under the global
  ceiling. Sparse, chunky, warm; seeded erratic clusters, never a metronome (AAA tell #8).
- **Cruise state:** base emissive ≈ 0.04 (imperceptible), `surgeGlowMultiplier` high
  (Vesper-class ~20); the "banked-coal hint" is the seam floor at threshold, flickering
  on a seeded cluster rhythm. Fever palette fully overridden (`feverWing 0x000000` — tops
  stay silhouette; `feverEye`, `feverWash`, `surgeHi` all warm-amber). ⚠ `feverWash` is
  REQUIRED in the def, not optional: `setFeverTint` is per-dragon (`postfx.js:165-167`)
  and a def without a warm tint renders the 1-frame `surgeStart` flash in the default
  magenta — a law-4 violation. Author warm, e.g. `feverWash: [0.10, 0.05, 0.02]`
  (R≥G≥B). Eyes out of the surge arrays.

## 4. Torso — `slagAnvilTorso` (the dominant mass)

- **Proportion — the sanctioned cheat (ref §2):** honest span:torso is 13–15:1 (a 70cm
  torso — unrideable); lock **span:torso 5.5:1** (ref §2 sanctioned band 5.0–6.5, ×~2.5
  inflation of the torso, span kept honest). Engine sanity: span:total-body ≈ 2.3
  (house norm ≤2.5).
- **Keel SHALLOW (revision):** flight muscle is 20–25% of body mass, not 40% (ref §2) —
  the depth reads as pectoral muscle WRAPPING the ribcage; **no protruding blade**. The
  "banked-ember keel" survives only as the throat-keel SEAM (§3), not as a fin.
- **Root masses (the #1 machine-tell killer, ref §9):** humerus root visually outmasses
  femur root at **1.4×** diameter (ref §2 directional only — "must outmass, escalating
  with size"; unsourced precision, defensible range 1.25–1.6). Both limb roots are
  lofted swells that break the OUTLINE — never melted/blobby (ref §9 tell #1),
  "impossible to pose" fails the gate.
- **Balance:** CoM **0.20 torso lengths forward of hip** (ref §2 0.17–0.26); the heavy
  tail (§8) is what earns the perched upright stance in the shop turntable.
- **Neck:** loft implies **8–9 vertebral stations** in a "slightly sinuous" shallow S
  (ref §2 — a deep 14-joint bird S is the wrongness tell).
- **Surface — lava-lake plate topology (ref §7):** few long curving seams bounding LARGE
  smooth char plates; **≥60% T-junctions, ≤15% 120° Y-junctions** (120° hexagons read as
  dead rock). **Three seam generations** at widths **6–10w / 2–3w / 1w** (ref §7);
  spacing ≈ 10× plate thickness. **Gen-3 hairlines gate on `activeDetailKey()==='ultra'`
  (`modelDetail.js`) — COMMITTED, audit B5.** Said plainly: this is a DEVICE gate, not a
  context gate — the engine has no shop-vs-gameplay build split (the same built model
  renders in both), so ultra devices see gen-3 in gameplay too and low/high devices never
  see it anywhere, shop included. Gen-3 tris are budgeted inside the ultra segment
  multiplier, on top of the §10 base targets. Overlap > weld on every plate joint
  (house §3.4).
- **Values:** 4 tiers — char shadow `≈0.03` albedo (law 7) → scorch mid → ash-lit facet →
  ember rim — endpoints spread ≥0.05 luminance, judged on the brightest biome (house §3.2).
- Publishes the full attach contract + `spinePoints` + seam `motifAnchor` chain.

## 5. Wings — the HERO: THE UNDERLIT CRESCENT (bat fan, wing-as-arm)

**Topology decision (ref §4): bat fan over pterosaur spar** — four digits give 3 interior
bays + 3 knuckles; a single spar degenerates to the paper-dart read. **Honesty note
(audit B4):** at gameplay distance the whole dragon spans ~180px and individual digits
are NOT countable (Vesper's shipped five read only as a jagged dark trailing edge) — the
feature that survives gameplay distance is the **scalloped 3-bay trailing-edge
silhouette**; digit/knuckle countability is a turntable-scale read, marked in §11. All
modern wyvern precedent agrees (ref §1 — Weta rebuilt Smaug onto two limbs so the wings
could ACT).

- **Digits:** 4, **dominant leading digit D1 = 1.6× the others** (ref §4 band 1.5–1.8);
  D2–D4 decay at **×0.66 per rank** (adopting ref §6's 0.62–0.70 decay constant as the
  house decay), fanning aft with contracting spacing. Fat in-plane wedges, never needles
  (house §2.4).
- **Planform differentiation vs Vesper (audit B1 — COMMITTED numbers, the real axis):**
  the fingered-fan MECHANISM already ships on Vesper, so Fornax differentiates on
  planform + bay language. **LOW WIDE crescent** against Vesper's tall scallop: carpal
  arch **`archRise 0.12`** (Vesper ships 0.4), **`wristT 0.30`** (top of the house
  0.2–0.3 band; Vesper ships 0.21 — longer arm, more distal knuckle), and **TAUT FLAT
  bays**: trailing-edge bay sag **≤0.10 of bay chord** (Vesper cups at 0.35) — shallow,
  near-straight scallop arcs that read as membrane under TENSION, not drape. Side by
  side: Vesper is a tall deep-cupped hand, Fornax a low taut sail.
- **⚠ THE NOTCH FLOOR (audit round 2 — the taut bay must not become the PLANE WING).**
  Taut bays differentiate us from Vesper but put the rear-chase sentence at risk: at the
  measured ~180 px chase span a ≤0.10-chord notch is only **3–4 px**, and a trailing edge
  that shallow collapses to a straight-edged delta — the kill-on-sight plane wing
  (`DRAGON-DESIGN.md` §2.1), which would gut the very silhouette claim the sentence rests
  on. **The notch depth therefore comes from BONE PROJECTION, not membrane drape:** each
  digit tip projects **≥0.15 of bay chord beyond the between-tip membrane line**. The
  membrane stays taut (our identity); the SILHOUETTE stays scalloped (the read). Asserted
  in §11 — this is a floor, not a target, and it outranks the taut-bay number if they ever
  conflict.
- **Stiffened leading edge (NEW, ref §4):** both real lineages actively stiffen it — the
  leading edge gets a **forward sheet** (propatagium analog) ahead of the arm, ~**9% of
  wing area**; armwing ~**52%**, handwing ~**39%** (ref §4 — equal-width bays ARE the
  plane wing). Leading edge is RIGID; **only the trailing edge flutters** (ref §5 — a
  rippling leading edge is a fabrication tell; enforce in the wobble mask).
- **Planform:** aspect ratio **7.5** (ref §4 target 7–9; <6 reads flapper, ~15 sailplane).
  Wing loading in the 30–80 N/m² band (ref §4) — informs how heavy the flap reads (§9).
- **Camber:** drives off airspeed — **0.14 chord slow ↔ 0.06 chord fast** (fast end
  corrected into the ref §4.4/§5.5 cruise band of 0.06–0.10c; the 0.14 slow end is a
  declared high-lift exaggeration ABOVE the cruise band, launch/flare only), deepest sag
  at **40% chord** (ref §5). One dial (`camberMix`) lerped by speed; membrane arcs ≥4
  segments, cup toward the knuckle (house §4.3).
- **Wing-as-arm articulation:** house `wingParts` cascade + medial wrist (`wristT`
  **0.30**, committed in the planform bullet) + rigid-hand wrist fold + −anchor + outer-wrapper mirror (house §5, non-
  negotiables). Thumb-claw at the carpal knuckle — the wyvern's HAND read, and the walk
  pose (wing-knuckle gait) in the turntable. Shoulder: scapular slag-cowl plates in the
  torso's seam language, static in the body frame.
- **THE STOKE surface (REVISED — audit B3, the DoubleSide trap):** three.js emissive is
  NOT per-face-side — a DoubleSide emissive membrane lights BOTH faces and breaks law 5.
  So, explicitly: **the underside glow is a SEPARATE dropped sub-mesh** (the bay copied
  ~0.05 below the membrane — the Vesper `memGlow` pattern, `dragonVesper.js:458-464`) in
  a **bespoke material OUTSIDE the shared `wingMat`**, dark in cruise, driven only by
  THE STOKE. **The top membrane registers `wingMembraneEmissive: 0x000000`** (alongside
  `feverWing 0x000000`): the shared rig drives `wingMat` UNCONDITIONALLY
  (`dragon.js:1970-1990` — +0.7 emissiveIntensity while boosting, plus backlit and
  casLevel surge terms), so the boost-glow term is neutralized by making the emissive
  COLOUR black — intensity then multiplies black and the tops stay dark on every boost,
  not just during Surge. Tops stay in the char value ladder with bay-depth value banding
  (AAA tell #12 — a turntable-scale detail, marked in §11). Bone digits read as recessed
  tapered filaments in channels with dim skirts (AAA tell #1), never flat bright tape.
- **Pose-gating honesty (audit — stated plainly; the sheet's biggest honesty gap):** from
  the shipped behind-and-above chase cam the camera sees wing TOPS, which are dark by
  law 5. The hero underlight shows at BANK, at flap transitions, and partly inside the
  held high-V; during the 3.0–4.5s level glide hold it is largely OCCLUDED — and Surge
  bloom is suppressed by the no-cream law (§3), so no bloom spill rescues it past the
  silhouette. What carries the frame through the hold: the dorsal char value ladder +
  struck facets, the backswept horn rank in clean sky, the ridge crest rolling end-on,
  the banked-coal seam flicker, and the drifting embers. The hero is a bank/transition
  payoff, not a constant — the §12 gate judges it in those poses, not in the hold.

## 6. Head + horns — `brandSkull`

- **Skull:** **0.13 of total length** (ref §6 0.12–0.15); width:height **1.1** (ref §6
  recommended 1.0–1.2 — taller than any croc, so it never reads crocodilian-flat).
- **Dorsal profile is the read** (ref §6 — rear-chase foreshortening keeps only the dorsal
  line): convex nasal keel → brow dip → **rising occiput** folded into an S. Judge the
  head on this line in flapstrip, not on the lateral profile.
- **Eyes:** orbit **0.20 × skull length** (ref §6 — and NOT larger; negative allometry
  means a big skull earns a relatively smaller eye). Centre at **x 0.67, y 0.78** of
  skull (ref §6 x 0.62–0.72, y 0.70–0.85), converging **3 head-lengths ahead** (ref §6
  2–4) in the **50° binocular band** (ref §6 45–60°). **The glare is the BONE** (ref §6):
  brow-prong wedges over the orbit carry the menace; the emissive eye itself stays small.
  Ember-amber eyes — the always-on accent. ⚠ House habit is giant Vesper eyes; this
  creature's read is armoured, not cute — the brow does the work. Eye placement detail is
  turntable/tier-card; from the chase cam only the brow-prong silhouette reads — marked.
- **Horn rank (dominant + decay, ref §6):** ONE dominant backswept occipital blade PAIR at
  **135° sweep** (ref §6 120–150°) — the "twin swept horns" of the sentence, a bilateral
  pair, not an equal rank — followed by **2–3 midline followers at ×0.66 decay**
  (ref §6 0.62–0.70) with contracting spacing down the nape. Followers sit on the
  centerline (no mirror-asymmetry hazard). The occiput is the only region in clean sky
  from the chase cam (ref §6) — this rank IS the head's play-distance read.
- **Named asymmetry — THE CHIPPED BROW:** the starboard dominant horn tip is struck short
  (~0.85× port) with a bright char-fresh facet — the ±1 deliberate asymmetry every sourced
  display structure shows (ref §6, Styracosaurus), done as a named marking (the house's
  only sanctioned asymmetry, §5.5). Zero-tri identity, echoes Vesper's port-fin mark.
  **Scale honesty (audit B4): a 0.85× tip on one horn is ~2–3px at gameplay scale —
  INVISIBLE from the chase cam.** Turntable/tier-card-only, marked in §11; removed from
  the §1 rear-chase sentence; judged in the shop turntable, never on the PR preview
  (residual 5 updated to match).
- **Temper-oxide band (law 8):** straw→purple→blue gradient (ref §7 230–297°C oxide
  sequence) painted diffuse on the dominant horn pair's outer third. The ONE blue.
  Close-range only — marked turntable.
- **Gape rig:** jaw joint opens to **100°** (ref §6 sabre-tooth band 90–110°; crocs max
  32° — a croc gape reads weak) for the Surge breath moment. **Turntable + Surge camera
  only — the chase cam never sees the mouth; marked.** Throat pouch distends by the
  mandibular rami bowing OUTWARD (ref §6 — not skin alone), skin thin + translucent =
  the anatomically-correct home of the withheld charge glow. Mostly rear-chase-blind;
  it peeks in banks and the Surge pitch-up — marked as a bonus read, not a load-bearing one.

## 7. Hind legs — `emberHaunch` (REVISED: abducted, not tucked)

- **Pose decision (ref §3):** raptors do NOT tuck — and a tucked leg is invisible from
  behind-and-above anyway. Lock **bat-style ABDUCTED**: the only pose that puts leg
  geometry in the wedge between wing and tail where the chase cam actually looks.
  Dials: **hip abduct 45° (ref §3 35–55°) · knee 82° (ref §3 70–95°) · ankle 115°
  (ref §3 100–130°)**, with **±7° oscillation phase-lagged 105° behind the wingbeat**
  (ref §3 ±5–10°, lag 90–120°) — secondary motion through the glide hold (§9).
- **Form:** plated reptilian, three-toed, char-plate greaves in the torso seam language —
  NEVER bird-scaled (law 3, the cockatrice misread is the easiest accident, ref §1).
  Period bird-leg canon (ref §1) is deliberately overruled by the misread risk + the
  camera; record it, don't re-litigate.
- **Mass:** femur root < humerus root (§4, ref §2); haunch is a lofted swell breaking the
  outline (house §3.1), knee raised + inboard so the fold reads folded, not landing-gear
  (house §2.7).
- Ember-leak: ONE short gen-2 seam per haunch plate overlap — inside the 10% accent
  budget's throat-keel contiguity? No — legs stay DARK (accent lives in only two places,
  §2); haunch seams are carved shadow grooves, unlit until Surge.
- **Gusset clearance (audit):** the house root gusset sweeps aft to the hip — the same
  wedge the abducted thighs now occupy. Fornax's gusset aft hem terminates at **0.65 of
  the shoulder→hip run** (never reaching the thigh), and `flapstrip` gains an
  interpenetration check at max abduction + full downstroke + full wing fold.

## 8. Tail — `firebrandTail` (REVISED: no spade)

- **Terminus decision (ref §1):** the spade is out — not period (Fox-Davies: Tudor tails
  end in a smooth blunt point; the barb is a recent addition) and the #1 de-kitsch target.
  The de-kitsch survey's move is RE-MOTIVATION: Fornax's terminus is **THE FIREBRAND** —
  a blunt char-capped coal tip, the anatomical end of the seam network, where THE STOKE
  terminates and vents (~the last 0.9× of the tip carries the gen-1 seam, house §2.6
  seating law). Silhouette duty moves to the **dorsal ridge** (the Drogon/Skyrim idiom,
  ref §1): a dominant + ×0.66-decay crest rank running hip→tip to its terminus
  (house §3.6 — rows run to their anatomical end).
- **Mass (ref §2):** tail length is a free variable (no consistent natural relationship —
  say so; locked at **2.6× torso length** for frame composition, a choice not a fact);
  the **fattest segments sit just aft of the hip** (ref §2), tapering ×3 (§1 axes).
  Radius FLOOR raised for the judged projection (AAA tell #11 — rear-chase foreshortens;
  world-space girth ≠ silhouette girth).
- **Rig:** house 4-joint `isBone` chain, bespoke dials — vertical undulation up-biased
  (the axis the chase cam reads end-on), rudder trimmed for compounding locals
  (house §5.1). The rolling ridge crest catching light IS the end-on read.
- **Structural third leg (ref §1):** in the shop turntable and perch idle the tail props
  the body — the period wyvern tripod, and what the heavy tail (§4 CoM) earns.
  Turntable-only behaviour; marked.

## 9. Motion signature — THE HEAVY BELLOWS

Motion is identity (house §2.13); no dial block copied from any shipped dragon.

- **Cadence (ref §5):** **2–4 beat bursts, then a 3.0–4.5s glide hold** (hard floor 1.5s,
  ceiling 6s), seeded jitter **±25%**, bursts loaded onto launch/climb/turn. Real
  flap-gliders hold 5.9–10.5s (ref §5) — the game floor compresses it ×~0.6 for read.
  Maps natively onto the house `glidePow` poser: high `glidePow` (apex ~2.2 family),
  bespoke values authored per FLAP-DESIGN, never byte-copied.
- **Stroke:** deep + slow — bat amplitude band 90–150° (ref §5); Fornax sits at the heavy
  end (wing loading upper-mid of the 30–80 N/m² band, ref §4): fewer, heavier beats,
  "commands the air."
- **Stillness kills the read, not the absence of a beat (ref §5):** secondary motion runs
  THROUGH every hold — trailing-edge flutter (trailing only, §5), camber breathing with
  airspeed, leg oscillation at 105° lag (§7), tail undulation, 32 drifting embers, the
  banked-coal seam flicker. The hold is alive, never frozen.
- **Wrist fold + apex sweep:** per FLAP-DESIGN (the depth-projection trap) — verify the
  fold in geometry numbers, not critic pixels.
- **Erratic, never metronome** (AAA tell #8): flap-burst clusters and coal-flicker share
  the seeded-cluster rhythm module; photosensitivity caps live in the module.

## 10. The STOKING ladder (4 forms — each rung feeds the furnace)

Form names: **f0 Cold Coal · f1 Kindled · f2 Stoked · f3 Fornax, the Banked Furnace.**
Every rung a CRUISE-visible earn (house §7); apex built first, ladder by subtraction.

| dial | f0 Cold Coal | f1 Kindled | f2 Stoked | f3 Fornax |
|---|---|---|---|---|
| read | ash-grey coal-whelp, 2 stub digits | first true fan + first seam | the hunter: 4 digits, ridge crest, abducted legs | the finished furnace: full network + firebrand |
| wing digits (D1 dominant) | 2 | 3 | 4 | 4 + propatagium sheet |
| seam generations | 0 (grooves only) | 1 | 2 | 3 (gen-3 ultra-device-gated, §4) |
| occipital rank | dominant pair only | +1 follower | +2 | +3 followers + chipped-brow + oxide band |
| tail | blunt nub | ridge begins | full ridge rank | ridge + FIREBRAND tip |
| STOKE run | eye flare only | to mid-spine | full spine, 0.8s | full circuit + wing underside + firebrand vent |
| embers (cruise/burst) | 0/0 | 12/40 | 24/70 | 32/90 (per-creature cap 120 — global-ceiling re-budget, §3) |
| span:torso | 4.6 | 5.0 | 5.3 | 5.5 |
| glide hold | 1.5s, frantic | 2.2s | 3.0s | 3.0–4.5s heavy bellows |
| tri target | ~1.7k | ~2.6k | ~3.7k | ~4.8k |

Asserts: tris ↑ · digits 2<3<4 · seam gens 0<1<2<3 · followers 0<1<2<3 · embers ↑ ·
span:torso ↑ · glide hold ↑ · no inverted light signal (whelp never out-glows apex).

⚠ **The `seam gens 0<1<2<3` assert must build at ULTRA detail** (audit round 2). Gen-3 is
gated on `activeDetailKey()==='ultra'` (§5/B5), so on low/high the f3 form builds only 2
generations and a naive ladder assert fails on exactly the devices most players use. Pin
the assert's build to ultra, or assert AUTHORED gens rather than built ones — but say which
in the test, because a silently-detail-dependent assert is a flaky test, not a law.

## 11. Tests spec + feasibility audit

**House harness (all standard gates apply):** tricount <6000/form monotonic · blueprint ·
smoke · `wingsymprobe` Δ0.000 · `seamprobe` (cruise dark / surge amber through real surge
math) · `flapstrip` + named-pivot amplitude table · `tiershots` · `gameshots`/`surgeshot` ·
a `fornax` block in `tests/starters.mjs`.

**Bespoke asserts:**
- **⚠ NOTCH FLOOR (audit round 2, blocks I1 sign-off):** each digit tip projects **≥0.15 of
  bay chord beyond the between-tip membrane line** (§5). This is the geometry guard against
  the taut bays collapsing into the plane wing at chase distance — assert it on the built
  mesh, not on the dial, since drape and projection are different numbers.
- **⚠ WRIST-FOLD LEGIBILITY at `wristT 0.30`:** 0.30 sits at the TOP of the house 0.2–0.3
  band, and the medial wrist exists precisely to make the fold read — pulling the wrist
  INBOARD is what creates it (ref §4.4). Our differentiation pushes the opposite way, so
  `flapstrip` must explicitly confirm the fold still reads at 0.30 before the number locks.
  If it doesn't, the wrist moves inboard and the planform differentiation is carried by
  `archRise` alone — the fold outranks the differentiator.
- **Channel-order probe:** every fire-region pixel R≥G≥B; bloom B ≤ 0.5·G (law 4) —
  a pixel-cross-section check per AAA §4, worst case = warmest sky. **Flakiness guard
  (audit):** chromatic aberration's per-channel offsets (`postfx.js:57-61`), the ±0.5 LSB
  dither (`postfx.js:106-107`) and the grading lift all legitimately perturb per-pixel
  channel order, so the probe (a) captures in a **CA-off + dither-off capture mode** (a
  capture-harness flag, capture-only — never ships), and (b) asserts with a **±2/255
  per-channel tolerance**. The strict inequality is a law on AUTHORED colour; the probe
  verifies it post-grade within tolerance.
- **Seam-topology count** (design-time): T-junction fraction ≥0.60, 120° Y ≤0.15 (§4).
- **Cruise-emissive by contribution:** eyes + coal-hint only; coal-hint contribution
  capped ≤ eye contribution (law 6).
- **Wobble mask:** trailing-edge-only flutter (leading edge amplitude ≡ 0) (§5).
- **Ember cap:** ≤120 hard per-creature, ≤40 cruise (§3 re-budget) — PLUS a Surge-time
  worst-case-biome census assert: creature embers + trails + biome FX + surge motes ≤
  the global 150–300 mobile ceiling.
- **Limb-plan firewall:** no forelimb builder, no import of any 6-limb arm module —
  a static import-statement check (law 2; match statements, not prose).
- **Monotonic ladder asserts** (§10 list).

**Feasibility audit:**
- Overdraw: no additive shells, no enclosing glow mesh (house §1); underside backlight is
  a dropped emissive sub-mesh copy in its own material (§5 — the Vesper `memGlow`
  pattern; NOT emissive on the shared membrane, which would light both faces): one extra
  thin tri layer per bay, counted in the §10 tri budget; one radial-gradient
  `DataTexture` sprite family for ember/halo (AAA tell #5 — never CanvasTexture, never
  solid glow meshes). Transparent/additive drawables recounted honestly, ≤8 at apex.
- Particles: per-creature cap 120 (§3 re-budget) leaves headroom under the GLOBAL
  150–300 mobile ceiling for trails + biome FX + surge motes — amber until the §11
  Surge-census assert passes on the worst-case biome; green only then.
- Shimmer: vertex wobble + animated emissive = zero extra overdraw (ref §7) — green.
- Gape + throat: one jaw joint + one translucent material — cheap; Surge-only visibility.
- Camber breathing: one lerp on existing membrane verts — cheap.
- Risk flagged: THE STOKE sweep touches many materials — drive it per-segment on the
  casLevel cascade / Tempest `stormTimer` deterministic-clock pattern
  (`dragon.js:1959-1980, 1997-2045`), not per-pixel shader work. (Vesper's `seamRun` is
  the extent LADDER dial only — §3 correction.)

**Marked turntable-only features (the auditor checks these against the engine):** gen-3
hairline seams (ultra-DEVICE-gated per §4, not context-gated — listed here because
low/high devices never see them) · temper-oxide band · eye placement detail (chase cam
gets only brow silhouette) · gape/breath + throat distension (Surge camera + shop) ·
tail-prop tripod stance (shop idle) · **bay-depth value banding** (§5) · **the thumb
claw** (§5) · **digit/knuckle countability** (the gameplay read is the 3-bay scallop
silhouette, §5) · **THE CHIPPED BROW** (§6 — ~2–3px from the chase cam). Everything ELSE
in this sheet must survive the rear-chase frame.

## 12. The gate + named residuals

- **Three-judge split (AAA §3):** machine numbers first (the §11 probes), then a fresh
  harsh Fable critic at **≥4.2, no axis ≤2, binary vetoes**, judging in-game rear-chase
  captures against worst-case backgrounds (warmest sky for the amber, bright water for
  rims) + clean studio frames. One revise round per phase; a third attempt means the
  technique is wrong, not the numbers.
- **Calibration tiles:** Phoenix (warm-lane collision — Fornax must read interior-leak,
  not rim/tip plumage), Ember starter (warm starter), Vesper (dark-lane split: warm char
  vs cold glass). Standing veto: *"does any part read as a shipped dragon — or as
  Smaug/Drogon/Rathalos?"* (kit-coherence, §2).
- **Cheap-tell registry sweep** (AAA §2) run as a checklist on captures before every
  critic spawn; §2 failure modes named aloud at every render.
- **Dark-identity kicker:** if apex char luminance <0.05, the house kicker rig applies in
  capture harnesses (house §6.7) — warm-hued floor bounce, never grey the char.
- **Named residuals (human-only, ride the PR preview, each a one-line dial):**
  1. Glide-hold LENGTH feel (3.0–4.5s) — fatigue vs majesty.
  2. Banked-coal flicker rate — cozy vs nagging; photosensitivity comfort on THE STOKE.
  3. Ember density per biome (32 cruise may read busy in the caldera biome).
  4. Char legibility vs the darkest biome sky — kicker tuning.
  5. Chipped-brow read — charming or "broken model"? (delete = one flag). **Judged in
     the shop turntable, not the PR preview — it is invisible from the chase cam (§6).**
- **THE RULE:** every checkpoint that changes the creature owes a NEW lesson file in
  `leapfrog/lessons/` (one file per lesson, no L### numbers).

## SETTLED (do not re-litigate)

- **NO SPADE TAIL** — firebrand terminus + dorsal-ridge silhouette carry (ref §1). Any
  "add the barb back" pass reopens the kitsch the reference pass closed.
- **ABDUCTED legs, plated-reptilian feet** — never tucked, never trailing, never
  bird-scaled (ref §3 camera logic + ref §1 cockatrice guard overrule period canon).
- **Torso inflated / span honest, 5.5:1** — the sanctioned cheat (ref §2); the honest
  13–15:1 wyvern is unrideable and the deep keel blade is anatomy fiction.
- **Bat fan, 4 digits, dominant D1** — not the pterosaur spar (ref §4).
- **R≥G≥B everywhere; no painted white; blue only as diffuse temper-oxide** (ref §7).
- **Wing tops never emissive** — the silhouette survives THE STOKE.
- **Eyes at 0.20 orbit; the glare is the brow bone** (ref §6) — do not inflate the eyes
  to house-Vesper scale.

## Open owner calls (flag on the build PR)

1. **Name** — "Fornax" (recommended); alternates: Brandvane · Slagmourn · Cindervar.
2. **Cost + roster slot.**
3. **Glide-hold band ends** (residual 1) and coal-flicker rate (residual 2).
4. **The chipped brow** — keep or delete (residual 5).
5. **Boost pre-taste** — a partial half-second stoke on boost between Surges; default OFF
   (dilutes the withholding).

---

## CHANGELOG

- **v0 (art-direction lock, post-reference synthesis).** Direction BANKED confirmed;
  three reference-forced reversals applied (spade → firebrand + dorsal ridge; tucked →
  abducted; keel blade → shallow muscle wrap + 5.5:1 sanctioned-cheat torso); rear-chase
  sentence rewritten. All dials cited against `DRAGON-ANATOMY-REFERENCE.md`; unsourced
  precision declared as ranges (humerus:femur 1.25–1.6; tail length a free variable
  locked by composition). Next: I0 stub + capture seams, then `slagAnvilTorso` behind
  default-off dials, per AAA-PIPELINE increments.
- **v1 (independent technical-art audit round — REVISE 3.4/5 applied verbatim).** See
  §13 AUDIT LOG.

---

## 13. AUDIT LOG

**Round 1 — independent technical-art audit, 2026-07-25. Verdict: REVISE, 3.4/5, five
blocking defects. House protocol followed: ranked fixes applied verbatim, no argument;
same auditor re-confirms.**

The five blockers, one line each, and what changed:

- **B1 — Hero wing already ships on Vesper; §2 table written from titles, not code.**
  §2 table rewritten from `dragonVesper.js` / `dragons.js` (five-finger fan, propatagium,
  thumb claw, underglow copy, cowl plates, no-forelimb de facto wyvern silhouette all
  Vesper's); "only true wyvern" claim dropped; wing re-differentiated on committed
  planform + bay numbers (§5: `archRise 0.12`, `wristT 0.30`, bay sag ≤0.10 vs Vesper's
  0.4/0.21/0.35); identity re-leaned on the four-limb abducted plan, char plates,
  THE STOKE, and the amber interior-leak lane.
- **B2 — 6:1 halo unachievable (single threshold bloom, no-cream Surge drop, tier-2
  composer off).** §3 bloom bullet rewritten against `postfx.js`; 6:1 restated as a
  tier-0 studio/turntable aspiration; geometry (seam skirts + dropped `memGlow`-pattern
  underglow copy) made the guaranteed carrier; tier-2 no-bloom read specced (hot cracks
  in char, no spill).
- **B3 — DoubleSide emissive lights both faces; shared `wingMat` boost term glows the
  tops.** §5 gains an explicit paragraph: underside glow is a separate dropped sub-mesh
  in a bespoke material outside `wingMat`; top membrane registers
  `wingMembraneEmissive: 0x000000`; the unconditional boost/backlit/casLevel drive
  (`dragon.js:1970-1990`) is neutralized by the black emissive colour. §11 feasibility
  bullet corrected to match.
- **B4 — Dishonest rear-chase claims (countable digits; chipped brow at ~2-3px).**
  Rear-chase sentence rewritten around the scalloped 3-bay trailing-edge silhouette;
  digit countability and the chipped brow moved to the §11 turntable-only list; §5
  topology claim restated; residual 5 rerouted to the shop turntable.
- **B5 — "Budget gen-3 in the shop" but no shop/game build split exists.** Committed:
  gen-3 hairlines gate on `activeDetailKey()==='ultra'` (`modelDetail.js`), stated
  plainly as device-scoped, not context-scoped; budgeted inside the ultra multiplier;
  §10 ladder cell relabelled.

Non-blocking fixes in the same pass: camber fast end 0.04c→0.06c (into the cited
ref §4.4/§5.5 band, slow end declared an exaggeration); `seamRun` re-cited as an
extent-ladder dial with ignition moved to the casLevel cascade / Tempest `stormTimer`
pattern (§3, §11); R≥G≥B probe given a ±2/255 tolerance + CA/dither-off capture mode
(§11); the hero's pose-gating admitted plainly with what carries the glide hold (§5);
gusset aft hem stopped at 0.65 of the shoulder→hip run + flapstrip interpenetration
check (§7); embers re-budgeted against the GLOBAL mobile particle ceiling (32 cruise /
90 burst / 120 per-creature cap + Surge census assert — §3, §10, §11); `feverWash`
made a required warm def field for the per-dragon `setFeverTint` path (§3); §11
turntable-only list completed (bay banding, thumb claw, digit countability, chipped
brow).

Cost of the round: no direction change — BANKED, the STOKE, the firebrand tail, the
abducted legs and the 4-digit fan all survived; what changed is honesty (pose-gating,
gameplay-scale reads), engine truth (bloom, LOD, shared-rig emissive), and one real
differentiation axis for the wing.

---

**Round 2 — same auditor, re-confirmation. Verdict: PASS, 4.4/5.**

All five blockers **CLEARED and verified against source**, not against the director's
account of itself — the auditor independently re-checked `dragon.js:520`
(`setFeverTint(def.feverWash || null)` — so a def without a warm `feverWash` really does
flash magenta on `surgeStart`), the `wingMembraneEmissive ?? wingEmissive` fallback at
`dragon.js:1979`, and every bloom constant quoted in the revised §3. All eight
non-blocking fixes confirmed present.

**Both refusals upheld.** Keeping 4 digits: the round-1 ask was differentiation on a real
axis, not fewer digits — and digit count is invisible at chase distance anyway, so dropping
to 3 "would have chased a number instead of a read." Keeping the STOKE timing, firebrand,
abducted legs and the SETTLED items: none were defects in round 1. The auditor's summary of
a correct revise round — *"direction survived, claims were fixed."*

**One NEW defect, introduced by the B1 fix** (which is the argument for re-checking rather
than trusting a fix list): the taut bays that differentiate us from Vesper put the rear-chase
sentence at risk of the PLANE WING, because a ≤0.10-chord notch is 3–4 px at the measured
~180 px chase span. Fixed here by THE NOTCH FLOOR (§5) — notch depth comes from bone
projection, ≥0.15 bay chord beyond the membrane line — with a §11 assert. Two nits fixed with
it: the `seam gens` ladder assert must build at ultra (gen-3 is device-gated, so the naive
assert is flaky on most devices), and `flapstrip` must confirm the wrist fold still reads at
`wristT 0.30` before that number locks — **the fold outranks the differentiator**.

**Turntable-only list confirmed honest and complete.** No remaining feature claims a
rear-chase read it cannot deliver. Standing residual for I1: the distinctiveness veto is
decided in the shop turntable, where the shared kit vocabulary (thumb claw + propatagium +
cowl plates) is fully visible — §12's Vesper side-by-side tile is the control for exactly
that.

---

**I1 GATE — char-plate anvil. Round 1: 3.6/5 REVISE → Round 2: 4.3/5 PASS (same critic, resumed).**

Round 1 found two defects the 15/15 machine probe could not see, plus one false claim:
- **The silhouette was severed at the throat** — hull chest-prow cap at z −1.45, neck aft station
  at −1.50, uncapped: a 0.05u slit through the chest. A geometry probe measures what is THERE;
  absence is not a value it can read. Fixed by burying the neck root at −1.38, plus a permanent
  join assert.
- **The seam network was ventral** — `for (k = 2; k <= 7)` walks chine→flank→BELLY→flank→chine,
  under a comment promising a dorsal arc. The whole seam identity, and I4's STOKE path, sat on the
  surface the chase camera never sees. Now walks `[2,1,0,9,8,7]`.
- **`M.rim` was defined and never applied** — the four-tier ladder was three. Now traces the deck
  edge as a caught rim over a dark face (confirmed round 2 as conservative, NOT the LED tell).

Also corrected: the probe reported shoulder:hip 2.23× because the wing stub's arm bone fell in the
sampling band; hull-only truth is **1.28×**. Measurements now filter on `userData.fornaxPart`.

**The blue-black question — resolved as a NON-issue by measurement, not by agreement.** Fornax char
is B−R **+2** (neutral); Vesper's hide is *painted* B−R **+13**. Fornax's rendered blue is entirely
sky bounce (mean B−R +0.9…+2.9 at game angles; sunlit facets go warm +6; the blue vanishes under
the gold sky). **Do not warm the albedo** — it would leave the sourced charcoal band and drift into
the Ember surface-warm lane. If cruise ever feels too cold the levers are scene key/fill or I4's
amber, never the diffuse.

**ATTACH CONTRACT IS NOW FROZEN.** I3's `brandSkull` and `firebrandTail` mount through it.

Watch items carried to I2/I3: rim rails and dorsal arcs cross at six points at identical proudness
(no z-fight in four static views — re-check in motion); seam width may need one step at real chase
distance (**widen, never brighten**); `brandSkull` must be sized against the real neck terminus
(0.32) rather than I0's box (0.24).
