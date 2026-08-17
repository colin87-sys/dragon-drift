# 91 — CRITIQUE LOG (append-only)

Kept by the Director. Never rewritten, never tidied. Verdicts are **binary and comparative** —
blind A/B against the bar at matched `wingshot` angles, never scores. An exhibited kill-list
item (`90-SYNTHESIS.md` §12) is an automatic LOSS at its gate regardless of everything else.
Gates: SILHOUETTE · STRUCTURE · MEMBRANE · FIRE · MOTION · COST. A passed gate can be re-opened.
The loop exits only when ours wins blind on every gate with no ruled-out tell and the numbers
inside budget.

---

## Round 0 — BASELINE — the current bar, judged before any build exists

**Compared against:** the thirteen in-engine sheets in `refs/` (COMPARE + per-hero planform /
poses / cycle / detail, apex forms, studio stage), read against the consolidated kill-list.
There is no "ours" yet; this round fixes what the bar IS and what beating it means.

**The bar is the Tempest.** Judged blind against Vesper and Revenant at planform, chase and
crop, I pick the Tempest at every angle except two (below). It is the only wing whose membrane
still has structure at 2.2× and on the dark backdrop, the only articulated beat (the recovery
dogleg from `tipApexSweep 0.26` is the single best motion frame on the roster), and the widest,
most ambitious shape (span/body 1.18). That is the wing our design must beat blind.

**The two angles where the Tempest already loses today:**
- **Legibility across backdrops** — to the **Revenant**. Ivory-bone-over-black-shroud survives
  pale, dark AND sky with 252 tris and exactly two values. The Tempest's charcoal banding earns
  its keep only inside ~2.2×; at the chase read its craft compresses to white accents on a dark
  blade. Contrast beats value count. That Revenant property — the bone↔membrane polarity doing
  all the work — is the property our §6 value spec is built around, and it must survive.
- **Honesty of the glow** — to the fire canon. The Tempest's bolt frame is **always on**: a
  white filament with a silver rim along every strut, plus an emissive edge mat on the knife
  strip. Judged against the fire-wing evidence this is three tells at once — glow following the
  bones as bright bars, a lit edge, and a permanently-on state with nowhere to go when the
  dragon rages. It reads as jewellery, not heat. (It is the *best-executed* jewellery on the
  roster — the recessed-core-in-penumbra craft is real — but the layout is thermally backwards.)

**The harsh read of the bar, gate by gate:**

- SILHOUETTE — Tempest wins the roster and still commits kill-list items: **no propatagium**
  (bare stub arm, the recognised amateur signature — all three heroes commit this), no carpal
  punctuation (a kink, not a hand), and the inboard shoulder is an unresolved tangle of small
  dark shards where the eye expects one mass.
- STRUCTURE — the bays read as **stacked shard plates**, not one taut skin; ~5 near-equal
  fingers with no dominant hero line; wrist at 0.24–0.40 makes the whole wing a hand.
- MEMBRANE — the field is the roster's best (4–5 banded tiers) and it is still a **decal**: the
  frame sits ON the skin, not under it; the surface answers neither the sun's direction nor the
  stroke (identical texture at every beat point); nothing transmits. The Vesper's membrane is a
  silhouette by design; the Revenant's is one flat value. **Nobody on this roster has ever
  rendered light THROUGH a wing.** That is the open flank the whole membrane gate will be won on.
- FIRE — vacant across the roster. Vesper's withheld `memGlow` underside (0.05 base, 22× surge)
  is the only shipped idea pointing the right way and it is the germ of our ventral window.
- MOTION — Tempest's beat is the bar; its **fold is a fraud**: span contraction **1.4%**
  (0.986). SPREAD and FOLDED are the same photograph. Revenant 0.932, Vesper 0.838 — no premium
  hero folds. The pose vocabulary is one pose deep.
- COST — no contest anywhere: 450 / 252 / 744 tris against a 6,000 ceiling. Budget is not and
  has never been the constraint; legibility is.

**What must not be lost when we beat it:**
1. The Tempest's recovery dogleg and deep-lag beat (`tipLag 2.1`-class, `tipApexSweep`) — the
   only wing that survives its own upstroke.
2. Its per-bay value banding under the game light — but executed **under** Revenant-grade
   bone↔membrane contrast, not instead of it.
3. Its span ambition (span/body ≥ 1.1) and its draw-call discipline (whole wing in a handful of
   batched meshes).
4. The Revenant's every-backdrop legibility and its flare-forward-then-hook leading edge.
5. The Vesper's ogee leading-edge function, its knife-edge economy, and the withheld-underside
   glow idea.

**Kill order, if I could strike the bar today:** first the always-on bolt frame (a glow with
nowhere to go is the deepest identity error for a fire lineage); second the confetti coverts
(unorganised white flecks — the cheapest tell to fix and the most damaging at the chase read);
third the 0.986 fold — because "SPREAD = FOLDED" is the roster quietly admitting its wings are
propellers, and the fold is the largest unclaimed win in the game.

**Ruled-out tells present in the bar (for the record, by kill-list number):** #14 (no
propatagium — all three), #17-adjacent (bare kink wrist — all three), #30 (confetti — Tempest),
#32 (sun-agnostic membrane — all three), #33/#41/#45/#47 (lit edge, bone-bars, always-on —
Tempest's frame), #52 (dead fold — all three), #64 (face-only craft — Vesper).

**Sent to builder (I1):** build `90-SYNTHESIS.md` §3–§5 + §9 only — skeleton, landmarks,
planform, flat-tiered bays, hem, carpal cluster, propatagium, cowl/fairing. No shader work, no
fire, no fold yet. Deliver the four `wingshot` sheets plus a pure-black silhouette strip at the
five cycle poses. The blind will be: our outline against the Tempest's at planform, glide,
recovery, apex, fold-precursor — five frames, labels stripped. I will be looking first at the
wrist (does t=0.50 read as an ARM with a hand, or as a short wing?), the propatagium bulge, and
whether the leading-edge polyline carries five knuckles at chase distance.

---

## Round 1 — I1 (forgewing) — SILHOUETTE and STRUCTURE

**Compared against:** `wing-tempest-apex-*` at matched angles (torso/head/tail are the
Tempest's recipe cloned — every difference IS the wing). Sheets: forgewing planform (now with
two pure-black tiles), poses, cycle, detail (now with two BACKLIT tiles), and the head-to-head
COMPARE. Coordinator-verified numbers: 3,987 tris Eternal (wing pair 1,754 / 36 draws; Tempest
2,921), `wingsymprobe` Δ0.000 all five states, landmark dump Δ0.0000 against §3 (elbow 151.0°,
propatagium 0.200 c, inboard bay 2.70×, AR 8.82), span/body **1.02** at `hs 5.5`, fold ratio
**0.976**, root-corner peel **0.77 u** over the cycle.

### Round 1 — SILHOUETTE — **LOSS**

Verdict: the wing's own outline beats the bar — the planform silhouette is an animal where the
Tempest's is a machine (knuckled LE with shrinking gaps, three concave bays off a dominant
finger, tip hook, a real forward sheet, the root running down the flank; at glide and settle it
presents more wing than the Tempest's two blades, and the carpal claw-cluster gives the chase
view a mid-span punctuation no roster wing has) — **and the tile as delivered cannot win a
blind.** There is a hard-edged black **rectangle** in the `SILHOUETTE wing` tile: a
machine-straight quadrilateral with square corners hanging at the root. Cross-referencing the
lit sheets, it is the same element that reads as a tall glossy **blue door-panel** between root
and body in poses/detail, and the same corner the builder measured peeling **0.77 u** across
the cycle — one defect, three symptoms. A judge with the labels stripped asks "what is that
box?" and picks the Tempest. Kill **#65** and **#66** (added to the list this round) are
exhibited. Second cause: at matched world scale ours is **1.02 span/body against the bar's
1.18** — visibly narrower than the wing it must beat. Two causes, both cheap; the gate stays
shut until both are gone.

### Round 1 — STRUCTURE — **WIN**

Verdict: ours, and it is not close. Blind at planform and the 2.2×/4× crops: a two-regime arm
(near-parallel inboard, whip outboard) with ash-dusted bone tops, an elbow that exists, a wrist
that is a **hand** (forward-opposed claw cluster — Drogon's read, nobody else on the roster has
it), a propatagium sail at 0.200 c where the Tempest has a bare stub, metacarpals opening the
fan at the knuckles, bays that are ONE continuous skin where the Tempest stacks shard plates,
and an inboard bay at 2.70× carrying the membrane far down the body. The landmark dump matches
§3 to Δ0.0000. Held WIN with three logged constraints: (1) the elbow is a drawn kink, not a
driven joint — `mid` is parked on the pivot, and §8.3's fold stage 1 is elbow flexion, so this
is a debt I4 cannot pay late; (2) the root skirt that produced the rectangle is a structure
error in anchoring, fixed under this round's instruction; (3) 36 draws for the pair is over the
≤~10-per-wing discipline — consolidate accumulators before the I4 cost gate.

**Biggest remaining gap:** the root. The inboard-aft membrane corner — rectangle, blue card,
and 0.77 u peel are one thing. Nothing else on this article loses a blind; this does, at every
angle that shows the root.

**Ruled-out tells present:** #65, #66 (the card — added this round, per the live-list rule);
#52 as literally written (fold 0.976 — SPREAD and FOLDED are the same photograph; owned by I4
by scope ruling, logged so it cannot quietly survive); #30 in miniature (ONE pale covert chip
floating near the wrist — an orphan flake is confetti of size one); #63 was exhibited at the
spec's own `hs 4.2` (0.79) and pre-empted by the builder — see ruling.

**RULING — the span deviation: ACCEPTED, and §3 amended.** The builder is right and my spec
was wrong: `4.2` was a dial number carried as if it were a measurement, and on this body it
fails the spec's own kill #63. §3 now specifies the **measured outcome** — glide span/body
**1.10–1.20**, asserted in the landmark dump, `hs` free (uniform scale; expect ≈ 5.9–6.1) —
so the spec can no longer contradict itself. But 5.5 → **1.02** is not accepted as done: it
clears the kill floor and still loses the width read blind against the bar's 1.18. Round 0
named span ambition as must-not-lose; it stays lost until the wing measures ≥ 1.10.

**Constraints logged for later increments (not failed today):** the broad **blue rim-light
sheen** across the ventral hand at apex (one wing black, the other a blue LED panel — the
worst-looking frame in the cycle; I2's gate will fail on it as kills #21/#33-family; the
`envMapIntensity ≤ 0.06` clamp is granted now as a one-number de-noise, and if the sheen
survives I2's albedo+env+transmission fix, my roughness 0.38 is the DIRECTED value that yields,
range to 0.50); value banding reads ~2 tiers at 2.2× against §5.5's four — I2 must *measure*
0.05 → 0.15 luma under the game light, not eyeball it; the BACKLIT tiles exist now and are
dead black, which is correct for I1 and is exactly the flank I2's transmission patch attacks.

**Sent back to builder (I1.1 — SILHOUETTE re-judge only; STRUCTURE holds unless the rescale
breaks it):**
1. **The root.** Inboard membrane edge terminates near the pivot (the short-lever law). Flank
   coverage from there to the hip line becomes a **body-frame skirt** (part of the
   cowl/fairing system, static in the body frame) that the wing membrane overlaps by ≥ 0.15
   chord — overlap, never weld, never a shared silhouette edge. No free membrane edge anywhere
   may be straight with square corners: every free hem is a designed curve carrying the hem
   cord. **Assert:** root-corner drift ≤ 0.05 u across all five states, and zero quadrilateral
   artifacts in the pure-black tiles.
2. **The span.** Uniform-rescale to measured glide span/body **1.10–1.20** (expect
   `hs ≈ 5.9–6.1 · spanScale`). Re-run tricount, the landmark dump (fractions must be
   untouched), `wingsymprobe`.
3. **The elbow.** Move `mid` to t = 0.28 NOW via the −anchor pattern (`mid.position = +E`,
   children −E; rest pose byte-identical) and publish it at amplitude 0 — zero visual change
   today, and I4's fold gets its first joint without a rebuild.
4. **The chip.** Delete the orphan covert flake, or build the full §9 rank (8–10, decaying,
   terminating at the wrist cluster). No flake stands alone.
5. Touch no other material or dial. Re-render the five sheets + COMPARE.

---
## Round 2 — I1.1 (forgewing) — SILHOUETTE re-judge; STRUCTURE re-checked after the rescale

**Compared against:** `wing-COMPARE-forgewing-tempest.png` (matched PLANFORM / REAR CHASE /
WING crop — same body, same stage, the only variable is the wing), the regenerated forgewing
planform (two pure-black tiles) / poses / cycle / detail sheets, and the five
`quadprobe-forgewing-*.png` overlays. Coordinator-verified independently of the builder:
span/body **1.172** at glide (bar 1.18; amended §3 band 1.10–1.20), root-corner drift
**0.000 u** — the inboard-aft corner sits ON the pivot, the one point a rotation about the
pivot cannot move — skirt overlap **0.193 c** (≥ 0.15 required), **0 right-angle corners**
across all five probe angles, landmark table Δ0.0000 after the uniform rescale (elbow 151.0°,
propatagium 0.200 c, humerus 4.26:1), `mid` published at t = 0.28 at amplitude 0.

### Round 2 — SILHOUETTE — **WIN**

Verdict: ours, at every tile of the blind. Planform: the forgewing is an animal — knuckled "‹"
leading edge with shrinking outboard gaps, a dominant finger, concave scallops, the tip hook, a
real forward sail, membrane running down the flank into one coherent root mass — where the
Tempest is a jewelled kite frame on a stub arm. Rear chase: at glide ours presents actual wing
between arm and flank where the bar presents two wired blades. Wing crop: the carpal
claw-cluster reads as a HAND at chase distance; nothing on the roster has it. The rectangle is
dead: the pure-black tiles show a designed trailing curve flowing into the skirt with no square
corner anywhere, and the probe — now control-checked — agrees at all five angles. The span
deficit is closed: 1.172 against 1.18 reads as a peer in width, and the broader chord makes the
planform read larger than the bar's. For the record so no future judge trips on it: the two
detached black triangles in the SILHOUETTE-wing-ONLY tile are the body-frame skirt and the far
wing, visually orphaned because `wingOnly` hides the body that connects them — a probe-view
artifact, not floating geometry; the whole-dragon black tile shows everything attached.

### Round 2 — STRUCTURE — **WIN (held under re-check)**

The rescale was uniform and the landmark dump is Δ0.0000 against §3; the pixels agree —
two-regime arm, fan opening at the knuckles, propatagium bulge at 0.200 c, elbow at 151°, the
covert rank now a real shingled rank of 9 terminating at the carpal cluster. The `mid` −anchor
lands the elbow joint I demanded with a byte-identical rest pose — I4's fold has its first
joint without a rebuild. Round 1 constraint (3) stands open: 36 draws/pair against the
≤ ~10-per-wing discipline, due at the I4 cost gate.

**Biggest remaining gap:** the surface. The membrane answers neither the sun's direction (both
BACKLIT tiles are dead black — correct for I1, and exactly the flank I2 attacks; nobody on this
roster has ever rendered light THROUGH a wing) nor its own value spec at distance (~2 tiers
legible at 2.2× against §5.5's four; the inboard panel's blue env-sheen is the single worst
value on the article — it reads LED panel, not skin). Everything now hangs on I2.

**Ruled-out tells present:** none at either gate judged. Logged, not failed here: #52 (fold
0.977 — I4's debt, held open so it cannot quietly survive); the blue sheen (kills #21/#33
family — I2's gate fails on it if it survives the albedo+env+transmission fix); covert lap
reads slightly serrated at 4× (watch item — it is a rank with a terminus, not confetti; value
fix inside I2).

**RULING — the armwing/skirt area split: ACCEPTED; §5.1 amended.** 38.5% wing-side armwing +
13.9% body-frame skirt + 43%-class handwing preserves §5.1's VISUAL shares (52.4% total armwing
read against the spec's ~50). What changed is ownership — and that ownership is what kill #65
demands; the alternative is the Revenant peel this lab already reproduced at 0.77 u. The
builder's objection ("I4's fold will uncover flank rather than folding it") is dissolved, not
deferred: the skirt IS the flank's permanent cover, and §8.3 step 4 already lands the folded
wing OVER the flank as a cloak. I4's obligations are now explicit in §5.1: folded wing drapes
over the skirt, overlap ≥ 0.15 c held in the folded pose, zero interpenetration, no bald flank
at any point of the fold arc. Consequence in our favour: the moving wing is now majority
handwing (~53% of wing-side area), which is what makes ≤ 0.55× reachable via elbow + wrist +
furl exactly as choreographed.

**RULING — the probe: the negative control becomes law.** The quad probe's first run passed
everything for four wrong reasons; a probe that passes for the wrong reason is worse than no
probe — it launders a defect into a green number. Added as §11 probe law and kill **#67**: no
probe verdict counts until the probe has fired on a known-bad and cleared a known-good (the
aurumToro-fires / tempest-revenant-vesper-clears pair is the pattern). The builder's
straightness-not-angle finding (scallop cusps close at ~88° too) is part of the record. The
builder should write the leapfrog lesson file; the law lives here.

**Decision: proceed to I2 (MEMBRANE). No I1.2.** Both I1 gates now stand WON; they remain
re-openable — a membrane that muddies the black tiles re-opens SILHOUETTE.

**Sent to builder (I2 — MEMBRANE, §11 scope; gate = blind vs the Tempest detail sheets at
2.2× pale / 2.2× dark / chase-sky PLUS the two backlit tiles, which are the centrepiece):**
1. Build §6 in full: `aMemThick` authored per §6.1; the §6.2 transmission patch on `wingMat`
   (σ ratio locked (1.00, 2.68, 5.41)·σ0, σ0 tuned so nominal thickness transmits ≈ 0.15
   luminance); the Fresnel demoted to the hashed hem fringe only (§6.3, duty ≤ 0.60); cord
   field + vein doublets on the §6.4 carriers with their territories — zero inboard, ramping
   outboard, orientation rotating perpendicular-to-arm → parallel-to-finger; doublets
   asymmetric-forked (24°/52°, taper 0.794), vein wider and darker, artery NON-emissive until I3.
2. Kill the blue sheen: albedo `#241a16`-class + roughness 0.38 + envMapIntensity ≤ 0.06 +
   transmission authored TOGETHER, then MEASURE the §5.5 tiers at 0.05 → 0.15 luma under the
   game light on the sky backdrop at the money cam — numbers in the delivery, not eyeballs.
   If the sheen survives that combination, roughness may rise to 0.50 (directed yield, granted
   R1). The blue door-panel read must be gone from every cycle tile.
3. Wrinkle statics at the cruise state (8–14 spanwise striations per bay, `fwidth()`-faded);
   the slack-scalar binding stays I4.
4. Blind pass criteria: the backlit↔front-lit polarity flip visible on the COMPARE (backlit the
   membrane out-glows the bone; front-lit it is the darkest element on the dragon); deepest cup
   = darkest backlit tier; over-bone sheet a razor-edged black silhouette; no continuous bright
   rim anywhere; no glowing veins — dark doublets subtracted from the glow.
5. The covert lap: value-soften the lit edge so the rank reads shingled, not serrated, at 4×.
   No geometry rebuild, no flap-dial changes.
6. Deliver: five sheets + COMPARE regenerated, tier-luma measurements, `tricount --ci`,
   `wingsymprobe` Δ0.000, and the probe suite including its own negative control per #67.

---
## Round 3 — I2 (forgewing) — MEMBRANE; SILHOUETTE + STRUCTURE re-checked

**Compared against:** `wing-tempest-apex-detail.png` tile-for-tile (2.2× pale / 4× pale /
2.2× dark / chase-sky) against the regenerated forgewing detail sheet **plus its two BACKLIT
tiles — for which the bar has no entry at all**; the COMPARE sheet; the cycle strip (the R2
"worst frame" check); the planform black tiles and poses (re-checks). Coordinator-verified
independently: polarity **0.435 front-lit → 11.48 backlit**, transmission gain **×1.63**
(0.0528 → 0.0861 — an opaque sheet can only get darker; this cannot be faked); §5.5 tiers as
authored **0.0876 / 0.0752 / 0.0415 / 0.0240** (3.65×), luminance quartiles 0.021/0.036/0.056/
0.098 (4.73×); worst 16 px tile **B−R = 0.0000** across all seven wing states and six gate
tiles (was 0.111); Eternal **4,613** tris, pair **2,292** in **26 draws** (down from 36);
`wingsymprobe` Δ0.000; landmark dump Δ0.0000; root drift 0.000 u; quad probe 0 corners; **all
four negative controls fire** per kill #67. Final material values: albedo `#4b3418`, roughness
0.38 (my directed yield to 0.50 went unspent), envMapIntensity 0.05, σ0 = 1.0, ambient 0.10.

### Round 3 — MEMBRANE — **WIN**

Verdict: ours, at every tile, and the margin embarrasses the bar.

- **2.2× pale:** theirs is navy card-stock shards under white tape; ours is a skinned animal —
  the inboard bay reads as ONE continuous cupped sheet with a warm rim gradient falling into a
  dark sag, the outboard bays carry spanwise combed grain. The R2 blue door-panel is dead:
  the same panel is now the best passage on the wing.
- **4× pale:** the bar has NO membrane craft at 4× — plate faces and filament channels; ours
  shows the cord grain, a shingled covert rank with a terminus, the propatagium sail, the
  carpal cluster. One defect on ours, named below (the saw). Ours regardless.
- **2.2× dark:** theirs vanishes except the frame; ours keeps its form through the warm
  hem-and-rim gradients — the membrane survives dark-on-dark as a FORM, not a hole.
- **chase sky:** ours reads as a dark animal whose membrane is the darkest element on it
  (0.435 measured); theirs reads as wire plus sparks. Ours.
- **BACKLIT (both tiles):** no contest possible — the shipped bar cannot produce this frame
  (kill #32 IS the shipped state). Ours delivers the whole §2.3 inversion: ember-amber field,
  bones as razor-edged black cut-outs (no halo — the dragon stays huge), cord striations as
  dark subtractions inside the glow, dark hem, deepest cup darkest, no pink, no chrome rim,
  fringe broken not continuous. The single best surface frame this lab has produced, and the
  first time in this repo light has gone THROUGH a wing.

Nobody looking at the two sheets blind picks the Tempest's membrane. **MEMBRANE: WON.**
Re-openable — a fire pass that lifts the field, adds a rim, or muddies the black tiles
re-opens it.

### SILHOUETTE — re-check **HELD**. STRUCTURE — re-check **HELD**.

The black tiles are unchanged in kind: knuckled "‹" LE, scalloped TE, claw-cluster bump, tip
hook, skirt curve flowing into the body, zero rectangles (probe 0 corners, controls firing).
The +538 tris of relief cords and hem loop added silhouette detail (fine TE teeth) without
muddying the outline. Landmark dump Δ0.0000 — proportions untouched; the covert rank, sail,
and two-regime arm all still read at 4×. Cycle strip: both wings read the same warm dark
material family in every tile — the one-black-one-blue apex frame is gone, B−R 0.0000.

**Biggest remaining gap:** the wing is a superb corpse. Its only light is borrowed — the sun
doing transmission's work — and the identity ("a bellows, not a lantern") is unprovable until
the ventral forge window, the artery members, and the state machine exist. Everything else on
this article is polish; the missing organ is FIRE.

**Ruled-out tells present:** **none exhibited at this gate as scoped.** Held-open debts, so
they cannot quietly survive: **#52** (fold 0.977 — SPREAD and FOLDED are still the same
photograph; I4). **#29's binding half** — the wrinkle field is static by construction; statics
were I2's scope by my own instruction, and the slack-scalar binding is I4's. Teeth added now:
I4's MOTION gate FAILS unless wrinkle amplitude visibly differs between bottom-of-downstroke
and top-of-upstroke tiles of the same strip. Watch items: T3 = 0.0240 sits near the
dark-backdrop mud floor — verify FORM survives in the darkest biome tile at I3; covert lap
serration (R2 watch) is improved but the new cord teeth inherit the problem, next item.

**The two eyes-on questions, answered:**

**(a) The backlit L/R brightness split (one wing crimson, one bright orange): the physics
stands, the capture is at fault, and the assertion that separates those two claims is now
mandatory.** Geometry is Δ0.000 and the formula is view-dependent by design — d_eff grows as
|N·V| falls, so the two wings diverge whenever the camera leaves the mirror plane; in a bank
that anti-phase flare is an AUTHORED FEATURE (§2.6.4, F1 B3). But a symmetric article under a
mirror-plane camera with the sun exactly anti-camera MUST render symmetric — any residual L/R
difference in that configuration is a real bug, not physics. Harness order: re-shoot the
BACKLIT planform with the camera exactly on the mirror plane and the sun exactly on the
camera axis, and assert L/R membrane mean luma within 10%; add the INDEX row documenting the
view-dependence as designed. If asymmetry survives the mirror-plane shot, MEMBRANE re-opens.

**(b) The cord-end saw at 4×: real, and it is the picket-fence law wearing a new costume.**
Near-identical triangles at even pitch read as a machine edge on an article whose entire case
is that it is an animal. Fix folded into I3 delivery (no re-gate): deterministic per-tooth
pitch and height jitter (±25%-class), amplitude decaying toward the tip, occasional dropped
tooth — seeded like the hem-fringe hash, asymmetric L/R by seed. The silhouette tiles must
not lose the fine-scallop read.

**RULING 1 — the tier floor yields; §5.5 amended.** The 0.05→0.15 luma window was the Vesper
`MEMBLUE` calibration carried into a spec for a warmer, darker wing — an instrument mistaken
for a law, exactly the R1 span error in value clothing. The laws that bind are: tier spread
≥ 3× lightest→darkest at the money cam on sky (measured 3.65× authored / 4.73× quartile —
passes); the membrane darkest element front-lit (0.435 — passes, kill #21); the polarity flip
(×1.63 gain — passes); ≥ 3 bands countable at 2.2×, all four at 4×. T2/T3 below 0.05 are
ACCEPTED — that darkness is precisely what buys the 11.48 backlit inversion. Builder-caught,
Director-owned, spec amended in place.

**RULING 2 — ~45 ALU: accepted provisionally; the budget line was an estimate, and the frame
is the law.** My ≈20 covered the transmission term alone; the delivered surface carries
transmission + wrinkle statics + a third compose seam. The binding number was always 60 fps
on weak mobile — measured at the I4 COST gate (framecap/perfprobe), not estimated. Cut order
if I4 misses, in this sequence and no other: (1) spherical-Gaussian `exp2` swap for the `pow`
(A2's documented free downgrade), (2) fold the wrinkle modulation into the cord DataTexture's
channel (the fetch is already paid), (3) LOD-drop vein orders 3–4 with distance. **And the
misdiagnosis is mine to own:** instruction #2 named albedo+env+transmission as the sheen's
cause; the builder's roughness sweep proved it was entirely specular and the F0 0.020 /
F90 0.06 remap killed it — the third seam is legitimate spend because it removed a
gate-blocking defect my instruction could not. Pattern now twice established (R1 span, R3
sheen): when an instruction names a cause and the builder isolates a different one, the
finding wins and the spec amends. Builder writes the lesson file; the law lives here.

**RULING 3 — a 133 px tier is a tier if it does its job at the distance where its job lives.**
T0's job is the taut seam against the spar — the attachment highlight that de-planes the bay.
At 4× it must read as a BAND (it does — a warm strip hugging each spar); at 2.2× it may
compress to the seam line (it does; the shipped premium precedent is the Vesper, where ~3 of
4 tiers read at 2.2×). Countability criterion amended into §5.5 per Ruling 1. NOT granted:
lifting T0's value to widen it — that erodes the darkest-element margin. If the builder wants
more T0 territory the lever is the billow-depth threshold, and it is optional.

**Decision: PROCEED TO I3 (FIRE). No I2.1.** Nothing gate-blocking remains: the two visual
flaws are a capture artifact with a falsifiable harness assertion and a 4×-only regularity
with a seeded fix, both asserted in I3's delivery.

**Sent to builder (I3 — FIRE, §7 scope; gate = blind vs the fire canon and the bar at the
same six tiles PLUS fire-state tiles):**
1. Build §7 in full: zone A forge window (proximal VENTRAL pane, border an abrupt skip,
   never feathered); zone B artery members of the EXISTING dark doublets ignite (the vein
   member stays dark — one geometry, both channels, per §2.4); zones terminate before t=0.60;
   the four states (cold ~1% / cruise 3–6% / power ≤12% / ignition ≤15% for ≤0.8 s, clipped
   white ≤1% always), hard borders in every state, recruitment root-first tip-last.
2. Wire the state mats to the shipped contract: window + arteries in `flareMats`, bones stay
   `spineMats`, membrane stays `wingMat`. Emissive hue law §7.1: R ≥ G ≥ B strictly, deep-
   orange authored core, ACES clips — never author white. The B−R = 0.0000 guard stays as a
   MEMBRANE-pixels assertion (temper blues live on the skeleton only, low-value, non-emissive).
3. The three incommensurate rhythms (artery 0.4–0.6 Hz damping-to-steady under load; flap;
   window flicker 2–3 Hz). Nothing locks to flap time.
4. Ash + temper per §7.3/§7.4 (up-facing/windward/concave ash; temper rings on bone around
   hot seams; L≠R by seed). Embers per §7.5 (rods 10–13:1, thin-edge spawn, +25% early flare).
5. Measure, wingtiers-pattern with negative controls per #67: emissive fraction of one wing's
   projected area per state (must land in the §7.1 bands), clipped-white fraction ≤1%,
   B−R on membrane, and the polarity numbers re-run to prove MEMBRANE did not regress.
6. Deliver: the six detail tiles + fire-state row (cruise / power / ignition at the chase cam
   + one ventral/bank tile showing the window) + cycle + COMPARE, the harness fixes from (a),
   the saw fix from (b), and the two lesson files (specular finding; probe law already
   assigned R2).

