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
