# Overhead boulders — birth them as a DISTANT speck, re-roll every pass (kill pop-in + repetition)

**What we did.** Owner on the overhead flyby rocks: "(a) they appear out of nowhere — they should come like
the side ones, appear really small and come closer; (b) repetitive / not variable enough; (c) they come
together quite closely — a lot more randomness." Three real defects, all fixed without touching the
no-collision invariant.

**(a) Pop-in — the birth was a MATERIALISE, and it happened ON-SCREEN.** The asymmetry with the side rocks is
geometric. A side rock is born at world x ≈ ±372 (≈50° off-axis) — *off every frame* — so its scale-in happens
off-screen and it enters already flying: a real approach. An overhead rock was born at the same z (−300) but
its cone pins it to y ≈ 123 = ~17° elevation, **inside the ~36° vertical half-FOV, and it can never leave the
frame vertically**. So the 5% scale-in was a rock growing from nothing at a fixed visible spot in mid-sky — the
"out of nowhere." **The lesson: a fade/scale-in only reads as an APPROACH if it happens where the object isn't
yet visible.** The side rocks hide their birth in AZIMUTH (off the frame edge); an overhead rock has no
off-frame azimuth to hide in (the keep-out cone keeps it on-screen), so it must hide its birth in DEPTH.
Fix: `OVH_Z_FAR −820` (vs side's −300) → a size-7 rock at ~860m subtends ~1.3°, a speck; and the codebase's
own atmospheric-haze term (`smoothstep(110,470,dist)`) is saturated there, so the newborn rock is *haze-matched
into the detonation gas* too — invisible twice over, condensing out of the gas as it nears. An eased depth map
`g(p) = 1.61p − 0.61p²` (g'(0)=1.61 fast-while-a-speck, g'(1)=0.39) tripled the path length WITHOUT changing
the near-pass whoosh speed (angular velocity while far is tiny anyway). marginY is preserved by construction:
it's minimized at dc=0 (independent of how deep the path starts), so it still ships at 2.0.

**(b)+(c) Repetition & bunching — 3 rocks replaying IDENTICAL tracks.** Fixed lanes {−10,0,10}, fixed phases
{0,.33,.67}, fixed size bands, each rock looping its exact track every 24/18/15s → memorised in two cycles, and
the near-commensurate periods let their phases re-align into occasional same-instant arrivals on lanes 10u
apart. Fix: **per-cycle deterministic re-randomisation.** Each time a rock wraps (`cyc = floor(time·spd +
phase)` changes), re-roll its lane/drift/size/tumble/silhouette from a STREAM-FREE hash (`_jh(cyc·13+1,
k·7+n, 5)` — a pure function of the cycle + rock index, so it's replay-deterministic and touches no
mulberry32 stream, unlike a reseed). The boundary jump is invisible because the rock is faded out at p→0/1.
Speeds stay fixed per rock (changing spd mid-flight breaks phase continuity) but spread to
**{0.037, 0.054, 0.071}** — deliberately INCOMMENSURATE (periods 27/18.5/14.1s) so arrivals never lock into a
repeating beat. **The lesson: for "the same N things" repetition, per-cycle re-roll beats a bigger pool** — a
larger baked pool costs idle instance slots and still eventually repeats; a per-cycle hash never repeats, needs
no extra instances, and stays deterministic.

**The invariant discipline — when params re-roll, the safety ledger must go ANALYTIC.** The distinctness ledger
(min pairwise Δlane/Δdrift/Δspeed, asserted in `unmaskedarena`) could no longer be *measured* from static
params. Instead bake the worst-case FLOOR at build: centre-gap minus twice the per-pass jitter half-width
(lanes 12−5=7≥6, drifts 0.12−0.06=0.06≥0.05, speeds 0.017≥0.010) — floors that hold at EVERY cycle by
construction, not by sampling one. Same for marginY: size is re-rolled per pass, but the y-placement is
size-independent (the `FLYBY_R·size` lift cancels), lane/drift are x-only, speed doesn't enter y — so the
collision margin is provably untouchable by all the new randomness. **When you add per-cycle variance to a
system with a proven safety bound, re-derive the bound as an analytic worst-case over the jitter range, not a
measurement of the current draw.**

**Verify.** smoke + bossboot zero-error; `unmaskedarena`: marginY 2 ≥ 0 (eased deep path re-sampled), ledger
Δlane 7 / Δdrift 0.06 / Δspeed 0.017 (analytic), split 3ovh/5side, tris 9600, minX ≥ 25 — all green. `?oldovh`
restores the pre-fix overhead for A/B. auroraMix red is pre-existing. Owner judges the speck→condense birth
feel + the per-pass variety on the real GPU. Side rocks + the 22-rock conveyor untouched.
