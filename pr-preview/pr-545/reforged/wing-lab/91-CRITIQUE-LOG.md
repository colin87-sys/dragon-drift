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
