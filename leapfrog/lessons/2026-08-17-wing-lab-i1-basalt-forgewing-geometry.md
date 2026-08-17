# 2026-08-17 — Wing lab I1: a spec's derived NUMBERS can contradict its own LAWS; the law wins

**Did / learned.** Built increment I1 of `wing-lab/90-SYNTHESIS.md` — the geometry of one
western fire-dragon wing — as a new bespoke builder `basaltForgeWings`
(`reforged/js/dragonForgewing.js`, ~600 lines) behind a new roster key `forgewing` that
reuses the **Thunderhead Tempest's torso/head/tail recipe unchanged** (the `vesperLean`
spread-clone pattern), so the only variable versus the premium bar is the wing. 1,754 tris
for the pair (target 3,000), `wingsymprobe` Δ0.000, landmark table Δ0.0000 against §3.

Five things the build taught, in the order they cost time:

1. **A spec number derived from a repo reading can contradict the spec's own law.** §3 says
   `hs = spanScale · 4.2` and justifies it as "shipped-premium size (span/body ≥ 1.1)". Both
   clauses cannot hold: the shipped heroes' `halfSpan` dial is *not* their true semi-span —
   the Tempest's struts fan **outboard** of its `halfSpan 4.1` and its tip really lands at
   5.33 from the midline. Our tip is pinned at `t = 1.0 · hs`, so `hs` *is* the semi-span, and
   4.2 measured **span/body 0.79** — an automatic loss on §12 kill #63. The law (and the
   56%-size lesson behind it) outranks the number: `hs = 5.5` measured 1.02, and landed the
   §5.1 area shares (6 / 49 / 45 vs spec 7 / 50 / 43) and AR 8.8 at the same time.
2. **The −anchor makes a mis-parented part *invisible at rest*.** The armwing's trailing hem
   was pushed into the `hand` accumulator instead of `arm`. Because `tip.position = +K` and
   `hand.position = −K` make the assembled rest pose byte-identical, it looked perfect in
   every static check and then ripped a black streak across the frame the moment the wrist
   rotated. The −anchor is a superpower for adding joints without visual regression and a
   trap for exactly the same reason: **it hides parenting bugs from stills.**
3. **A "scallop depth" that is a lerp toward the knuckle is not a depth.** §5.4 asks for a TE
   scallop of 0.22–0.30 **of bay width**. Implemented as the shipped Tempest move
   (`p += (K − p) · 0.28`) that is ~67% of bay width on a fan this long, and it strands every
   fingertip as bare bone past the hem (§12 kill #16). Fractions-of-a-distance-to-a-point and
   fractions-of-a-local-feature are different quantities; the spec meant the second.
4. **Deciding a per-face material from a thresholded normal paints a sawtooth.** Ash dusting
   assigned per ring by `normal.y > 0.34` flickers on and off as the bone curves, because the
   flanking faces sit near the threshold — a regular tan zigzag down every spar, which is
   FLAT-TAPE BONES wearing a different hat. Decide the face→material map **once** off the
   mid-station, hold it constant down the tube, and break it along the length with a
   deterministic low-frequency gate so it reads as dust, not tape.
5. **Body-frame geometry must be sized in body units, off the attach contract.** The cowl,
   root fairing and flank ridge were first written in `hs`. Moving one span dial walked them
   straight off the flank. Re-derived from `attach.halfWidthAt / keelTopAt / tailAnchor`, they
   re-seat themselves — and would re-seat on a different torso too.

**→ Systematize.** The reusable output is `reforged/wing-lab/tools/wingdump.mjs`: a ~4 s,
no-WebGL **pure-math gate** that prints the spec's own vocabulary — the §3 landmark table in
span fractions measured from the body midline (`t = worldX / hs`), the elbow's included angle,
the §4 two-regime taper, §5.1 area shares + aspect ratio + bay-width ratio, the finger
long–short–long rhythm, the tri/draw split, span/body, and a new **ROOT PEEL** metric (how far
the inboard-aft membrane corner travels over the cycle, priced as a % of body length). Each
line prints its §12 kill-list verdict beside the number. Every one of the five bugs above
either was caught by it or is now catchable by it, and it makes "geometry numbers beat critic
pixels" an actual command rather than a slogan. Two harness additions generalise the same way:
`wlRender({ light: 'back' })` (the sun on the far side of the subject — mandatory for I2's
membrane gate, since transmission only fires with the sun behind) and
`wlRender({ silhouette: true })` (a `MeshBasicMaterial` scene override, so a silhouette gate
cannot be flattered by the stage). Both default OFF, so every existing sheet is unchanged.
Also generalised: an exclusivity test keyed on a **hand-maintained name list** breaks the
moment a variant legitimately reuses a body — `tests/stormtick.mjs`'s single-writer firewall
now exempts on `parts.torso === 'cumulonimbusTorso'` instead of `key === 'tempest'`.

**→ Leapfrog.** The lab now has a wing whose *anatomy is a checkable table*, so I2/I3/I4 argue
about surface, light and motion instead of re-litigating proportion: the seams they need are
already cut (per-bay lobes with a hidden 9% overlap for the furl, per-finger spar samples, a
hem edge-loop, a graded root band, a static body-frame cowl the membrane laps over). The
bigger unlock is the pattern itself — **a lab dragon is a body-clone plus one swapped part**,
which turns any subsystem (head, tail, torso) into a blind A/B against the shipped bar for the
cost of a spread-clone in `dragons.js`. And the wingdump idea generalises past wings: any
spec written in ratios deserves a tool that prints those ratios back out of the built mesh.
