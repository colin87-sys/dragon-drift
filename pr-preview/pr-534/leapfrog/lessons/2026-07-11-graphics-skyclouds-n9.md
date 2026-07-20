# 2026-07-11 — N9 sky clouds: the flat 60% earns its space, and the FBM opacity-ceiling trap

**Did / learned.** Gave the sky dome (≈60% of the frame, a 3-stop gradient — the flattest thing in the game) a
**domain-warped 3-octave FBM cloud band** spliced into the existing single sky draw: two-tone shadow→lit body,
sun-facing silver-lined edges, drift + world-parallax. Behind a SKY CLOUDS toggle, default OFF, gradient-
identical off. New file `js/skyClouds.js` holds the GLSL + a JS FBM port; `environment.js` only splices two
`${}` strings and writes uniforms. Both Fable gates ran; Gate-2 REVISE→fixed (engineering was clean — all 5
Gate-1 adjusts correct — but the clouds read too timid; a one-pass density/two-tone retune got there).

**Gate-1 shrank the blast radius before a line was written — three decisions worth reusing.** (1) **Probe-
invisible:** clouds are NOT ported into `skyProbe.js skyColorAt`. That port is a *low-frequency ambient
approximation* (it already omits the sun disc, stars, aurora); a drifting FBM would (a) be invisible to a
9-coefficient SH anyway and (b) *alias* through the 64-direction per-frame reprojection into low-band ambient
**pumping** — the exact flicker class the N5 gate fixed. A test asserts `skyProbe.js` contains zero cloud
references. (2) **`sky.renderOrder = 1`** is the perf offset that *pays* for the clouds: the camera-locked dome
sorts to z≈0 and was drawing **first**, shading every sky pixel then getting overdrawn by the world; drawn after
the opaque world it early-z-rejects occluded sky pixels (depthWrite already false). **A new full-screen shader
effect on the background should audit draw order first — the cheapest optimization may already be sitting in the
render list.** (3) **Uniform branch, not the shipped branchless `* amount` idiom:** 16 hash evals must not
execute on 60% of the frame for a zero result, so `if (uCloudAmount > eps)` (a *uniform* condition — coherent,
no divergence) beats the elegant-but-costly `col = mix(col, cloud, amount)`. The house identity idiom has a
cost the house doesn't usually pay; when the "off" branch is expensive, gate it, don't multiply it.

**The bug Gate-2 caught (bank this — a quiet numeric ceiling).** An N-octave value-noise FBM with gain 0.5 sums
to **at most `1 − 0.5^N`** (3 octaves → 0.875), and value noise clusters around 0.5 so it rarely even nears
that. My coverage was `smoothstep(0.48, 0.92, n)` — the **upper edge 0.92 is unreachable**, so coverage never
saturated and the clouds were a permanent ~50%-opacity **veil**, never a solid core. Worse, `lit =
clamp(n*1.35)` was ≈1 wherever coverage was meaningful, so the shadow↔lit **two-tone (the sculpting term) never
showed** — flat wash, no form. Two fixes: **normalize the FBM** (`s / Σamplitude` → consistent [0,1] regardless
of octave count, which also makes tier0↔tier1 match) and **retune the coverage window** under the real max
(`smoothstep(0.40, 0.72, n)`, so cores clear 0.72 → `shape=1`); and **drive `lit` from a second, offset noise
read** so the two tones vary across the cloud as form. **→ Systematize: before shipping any `smoothstep(a,b,fbm)`
threshold, know your FBM's actual max — a window whose upper edge exceeds `1 − gain^octaves` silently clamps the
effect to a fraction of its intended strength.** The math looked reasonable and compiled; only the *look* (and a
montage) exposed that the effect was running at half power.

**Also / smaller.** (1) **Sun-disc coherence (Gate-2 D2):** the sun disc was burning through covered clouds at
full brightness while the god-ray shafts dimmed — internally inconsistent. Fix: hoist `float cCov = 0.0;`
**above** the cloud branch, set it inside, and scale the disc term by `(1 − cCov*0.85)` in the sky fragment
(cCov=0 when off → byte-identical). This is the "disc peeks through gaps" the spec asked for, and it makes the
cloud/disc/shaft story consistent. (2) **God-ray coupling** is a damped JS `sunCloudCover` (one FBM eval at the
sun dir/frame) multiplied into shaft intensity — 0 when off → shipped shafts bit-identical; damping eases shafts
as a cloud crosses the sun instead of strobing. (3) **Parallax drift is JS-wrapped `% 1024`** — `playerDist*0.02`
raw hits fp32 on an endless run and shimmers; a one-frame lattice snap every ~51 km is invisible. (4) **Recorded
deviations / Gate-3 items:** `atan(d.z,d.x)` isn't periodic → a hard FBM seam ~90° off the flight axis (commented,
wrap it later); the "layered horizon haze" half of N9 is covered by N8 atmosphere (scoped out); `badges.mjs` is
**pre-existing** master breakage (`.shop-grid` → `.hero-select` from an earlier merge), not N9.

**→ Leapfrog.** Clouds default OFF; the **default-ON flip is a Gate-3 call** (6-biome montage + the motion
judgment the spec names — drift/parallax must not swim against flight speed). Only Sanctuary + Amber Wastes carry
clouds now; the other four biomes' `sky.cloud` channels are the next tuning pass. And the new
`getCloudSunCover()` + the FBM port are a reusable "what's the sky doing at the sun right now" hook (rain gating,
overcast-dims-ambient, lightning) for later weather work (N13).
