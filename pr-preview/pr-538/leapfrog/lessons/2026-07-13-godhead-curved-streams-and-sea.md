# GODHEAD DETONATION — curved streams (one braid field) + the sea answers the blast

**What we did.** The owner loved the roiling core + emergent cross but two mechanical elements still
fought it: the **radial streak fan read as straight rays** and the **ember trails read as straight
dashes**. Both are now CURVED, and the sea now visibly reacts to the explosion. All in `arenaSet.js`
(+ a value-space `arenaSkin.js` touch), **0 new draws**, richness is geometry/ALU inside the existing
detonation + ember draws.

**I1a — curved streak spines (the fix a fragment shader can't do).** The streaks were straight tapered
radial quads; the shader's lateral FBM wander only moved the bright vein ±4u inside a ~400u ray — you
**cannot curve a shape whose bounding geometry is a straight spoke**. So the spine itself now bends at
build time: `a(t) = a0 + bendAmp·(sin(bendFreq·t + bendPh) − sin(bendPh))` (anchored to `a0` at the
core, arcs outward), `SEG 5→11` for smoothness. `bendAmp` is driven by the **shared swirl field** so
streaks arc the same way the embers braiding through them do.
- **The cross-axes are EXEMPTED** (`bendAmp ×= 1 − 0.85·|cos(2·a0)|^6`, ≈0 on the axes). Result: the
  only straight lines left in the frame are the four sacred axes of the emergent cross → **straightness
  becomes the glyph instead of noise**, and it protects the "pretty much perfect" core read. This turned
  the owner's complaint into a hierarchy win.
- **Fairness re-baked PER VERTEX from the curved position** — the binary per-streak down-suppression
  (`down ? 0.4 : 1.0`) became a continuous `0.4 + 0.6·ss((sin(aᵥ)+0.4)/0.6)` at each curved vertex, so
  an arc that dips downward dims continuously (strictly more correct). Drift capped ≤0.42 rad so no upper
  streak can arc into the corridor band. Corridor p90 held (0.28–0.36 vs 0.75 gate).

**I1b — ember comet-trails (a curved path needs ≥2 segments to READ curved).** Each ember was ONE quad
stretched along its *instantaneous* velocity tangent = a straight chord, and `vGlow ∝ (1−life)` made
them brightest when young, exactly when the path is most radial → straight darts. Now each ember is a
**3-segment ribbon (18 verts)** whose vertices sample the SAME analytic path at successively earlier
life (`life = life0 − seg·trailDt`, head/outer → tail/inner), so the ribbon **follows the curve**.
Rebalanced so the curve is visible while bright: decel `1.7→1.3` (dwell at mid-radii), swirl amp
`0.14–0.48 → 0.30–0.80`. The old `stretch` seed was repurposed as per-ember `trailDt`. Fairness is
per-sample (each trail vertex gates itself by its own `rr`/`θ`), the spawn fade is keyed to the HEAD
life (`smoothstep(0,0.05,life0)`) so a just-born trail collapses to its head instead of stretching to a
stale wrap position, and a `×0.9` compensator guards the mid-radius-dwell density against sky p50.

**The headline lesson — a straight-vs-curved read is decided by GEOMETRY, not the fragment shader.**
No fragment trick curves a straight quad, and no single stretched billboard reads curved no matter how
curved the underlying path is. **The bones have to bend: bend the spine (streaks), or sample the path
at ≥2 points and connect them (embers).** And per the cohesion law, both must bend on the SAME field
(hoisted `swirlField` to module scope, its own private stream, built before both consumers) or they're
two substances again.

**I2 — the sea answers the blast (value-space, 0 draws/shaders).** A sky-filling holy explosion that
barely lit the ocean read as an ordinary sun-glint. In `HEAVEN_HEX`: `sunGlow 0xffdf9a→0xffcf82`
(hotter molten gold → a blast-lit reflection column; a more-saturated gold is LOWER luminance, so it's
**sky-fairness-positive**), `waterShallow 0x453a5e→0x6a4850` (the LIT wave faces warm to a rose-gold
ember), `waveAmp 0.08→0.12` (a hair more churn). **`waterDeep` stayed dark** — the broad sea is the
fairness-safe rest; only the reflection column ignites. The deliberate "haze-deck, not a gold mirror"
decision is preserved; the blast relights the column without flooding the lower frame. Corridor p90
0.284→0.361, sky p50 0.447→0.495 — both moved as intended, both well under gate.

**Bonus (I4) — ember depth.** A per-ember `zoff = (fract(seed·91.7)−0.5)·180u` gives near/far parallax
layering in the one plane that had none — folded into the ember shader touch, colour still radius-keyed
(no z-tint — one-substance law).

**Verify.** `unmaskedarena` 57/57, all four fairness gates under ceiling, loop-alive 89.9%, tier-2
graceful-degrade centre luma 0.30, 0 console errors (NaN law: every new `pow`/`sin` base clamped,
`inversesqrt(max(1e-6,…))` per-sample, `life` floored at 1e-4). Software renderer confirms the STRUCTURE
(streaks now visibly arc); the curve/braid/sea MOTION is the owner's real-GPU judgment. Drawcount
unchanged; tri +6k across two existing draws (vertex ALU, screen fill unchanged — the overdraw cliff is
untouched).

**Reusable.** (1) To curve a procedural streak, bend the SPINE at build time on a shared coherent field,
and exempt the axes you want to stay straight so straightness reads as intent. (2) To make a motion
trail read curved, draw it as a multi-segment ribbon sampling the analytic path at offset times, not a
single velocity-stretched billboard. (3) To make an environment "answer" an event cheaply, warm the
SPECULAR/lit channel (the reflection column) toward the event's palette while leaving the broad diffuse
field dark — you get the drama without the fairness cost.
