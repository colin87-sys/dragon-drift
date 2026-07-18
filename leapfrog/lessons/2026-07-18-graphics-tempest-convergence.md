# Tempest Reach — PR-C convergence: the best frame became the average

**What we did.** Closed the Tempest composition correction: ran the 6-frame in-flight sweep (congregation +
breath windows) that the whole 3-PR plan targets, montaged it, and gated the composition. The pass
condition had teeth — *the biome's best frame must become its AVERAGE* — and it holds: every congregation
window now shows a scarpwall MASS on one flank, the tall punctuation parked to the counter-flank, and the
storm eye-breach framed up the center (the authored Lorrain frame), and the massif frames ALTERNATE banks
(d495 L, d665 R, d835 L). The breaths thinned to composed rest (violent sea + gold sun-lane + surf ribbon +
breach). Numeric closing audit on record: massif face L≈0.06, scarp crest L≈0.53, storm-breach L≈0.67–0.71
= the frame max in every window (the sun-lane on the water is the bright LEADING LINE to it, not a rival).
Atmosphere diff = zero (only the doc-only `props` line moved in biomes.js). No new code — captures + gate.

## The reusable techniques

**1. THE HEADLESS FOLLOW-CAM SWEEP is `?seed` + a single `player.dist` set per boot.** The composition gate
needs the game's OWN follow-cam (never an overridden camera) sampling one layout's windows. In this
container the RAF loop is throttled so the dragon won't cruise, and a camera override / repeated warp /
setInterval pin HANGS the software-WebGL readback. The working recipe (`_tempsweep.mjs`): boot minimal,
pin the seed, set `player.dist = D` ONCE (no override, no interval), wait ~0.9s, screenshot, exit. Vary D
across the massif peaks + troughs (here 300/495/580/665/780/835) to sweep one layout's congregations and
breaths. `_montage.mjs` stitches the labelled strip for the Fable spawn. This is the ONLY way the biome's
in-flight composition can be gated at all under the stall caveat.

**2. THE THREE-PR ORDER is load-bearing: skeleton → density → gate.** You cannot pool density around a mass
that doesn't exist, and you cannot judge the composition until both are in. PR-A built the MASS and proved
it in isolation + one money-shot; PR-B moved density to it (two comp floors + one counter-flank line); PR-C
is the only place the WHOLE thing is judged as a moving composition. Each PR had its own gate; the plan's
"best-frame-becomes-average" pass condition is a PR-C-only measurement across the sweep, not a per-prop
score. Trying to judge composition at PR-A (in isolation) would have mis-scored the massif's SIZE — the
scale-hierarchy law: relative scale is only judgeable with everything spawning, on the follow-cam.

**3. GATE THE FOCAL WITH NUMBERS, not eyeballs.** "The breach is the value extreme" is a lumprobe claim:
probe the breach rect AND the brightest non-sky rects (props, the sun-lane) and assert breach ≥ all. Here
the sun-lane water reads bright (~0.55, glint max 0.94) but it's a LEADING LINE converging on the breach —
a rival by luminance, not by role. The eye rests on the breach because it's the brightest SKY slot with
nothing in its band and the leading lines point at it; a bright leading line is composition-positive, not a
focal rival. Judge the focal by role + the value MAX, and don't "fix" a leading line.

## What it unlocks / the standing backlog

The mid-ground MASS register is filled and the biome composes on every congregation window — the "premium
sky over an unfinished stage" is now a premium sky over a staged sea. Standing items handed to the owner
(NOT changed, gameplay-owned §5.3): the flat yellow pickup quads sit in the breach's value band (warm-rim
or desaturate them); the black gate hazard beam can bar the focal slot (the Forum gate-in-the-play-aspect
treatment). And Fable's one cosmetic massif nit (the bright saddle edge reading crisp) is a later bevel.
The `_tempsweep` single-dist recipe + the hogback cross-section primitive both carry forward to any future
Tempest / coastal-wall work.
