# Detonation speed-lines → eruption tongues + radial dust (the same envelope law, a third time)

**What we did.** Owner, after the rocks/embers/water landed premium: "the straight speed lines in the
background now detract." The radial STREAK FAN was the last vector-art element in the frame. A Fable pass
rebuilt it — and the fix is the ember/headless-filament law applied a THIRD time, plus a cheap grain trick.

**Diagnosis — four "mechanical" tells.** (1) The curvature was real but *invisible*: `bendAmp = 0.42·
swirlField(a0)`, and the field's typical magnitude ~0.25–0.35 → a *typical* bend of only ~6–8° across 300–500u
= a straight line with a slight shear. The cap was fine; the FLOOR was the problem. (2) The fan was
metronomic: 48 near-evenly-spaced spokes — even spacing IS the definition of a mechanical starburst, made
legible once the corona/dust beside it read premium. (3) The envelope was a HEAD-ANCHORED taper (width peaks
at the core, constant-ish brightness past the eclipse decaying to a point) — the exact "monotone envelope =
discrete object" failure the ember lesson wrote down, and every streak ignited at the *same* radius = a clean
ring of ray-starts. (4) It was the last layer not speaking the dust language.

**The fix — two coupled moves, both building ON the recent wins:**

**B1 — promote the corona's dust grain into radial STREAMLINES (the real replacement for "speed lines").**
The §P1b grain samples noise at `(cos,sin)·tangential + (0, t·radial − advect)`. It was `tangential 26 /
radial 44` → grains SHORT along the radius = fine speckle. **Swap to `tangential 38 / radial 17`** → cells
elongate ~2:1 *along* the radius = thousands of fine, soft, streaming micro speed-lines made of the blast's
OWN pixels. Two constants, zero fill/draws. This takes over the "energy jets outward" job from the geometric
fan — which frees the fan to become sparse and sculptural.

**B2 — rebuild the fan as ~36 clustered eruption TONGUES.**
- **Clustering kills the metronome:** launch in 12 JETS of 2–4 filaments (jet centres random, ±0.06 rad
  in-jet spread, ×0.7–1.3 length variance) instead of an even lattice. Irregular clumping = organic.
- **Curvature FLOOR (not cap):** `sf = sign(swirlField) · max(0.35, |swirlField|)` → every off-axis tongue
  now carries a *visible* ≥0.15 rad arc; sign kept so it still braids with the shared field; cap 0.42
  unchanged. `bendFreq 1.2→1.7` so the arc completes more of its sweep (still single-inflection).
- **MID-PEAK envelope over the VISIBLE span** (the headless law, applied to the fan): reparametrize on
  `tv = clamp((r − ECL_R1)/(len − ECL_R1), 0, 1)`. Width `1.2 + 4.8·pow(sin(π·tv), 0.8)` (thin at both ends,
  swell ~6 mid). Brightness `pow(tv,0.5)·pow(1−tv,1.2)·2.4` (**0 at the ignite radius AND at the tip**). Each
  tongue now erupts thin from behind the silhouette, swells, and dies — a flame tongue, not a ray — and the
  ring of identical ray-starts vanishes because *nothing is bright at the ignite radius*.
- **Tip fray + shared grain in the shader:** the baked env handles tip/ignite darkness, so the shader drops
  the old head `decay` and instead `fray = smoothstep(0.12, 0.4, n + (1−t)·0.8)` (tip dissolves into the
  field) × the same radial grain — tongues melt into the dust instead of tapering to a geometric point.

**The meta-lesson — a monotone-at-one-end brightness/width envelope is the universal "this is a discrete
object" tell, and the fix is always a MID-PEAK spindle over the VISIBLE span.** We hit it on the embers (bright
head → firefly), and here on the fan (bright core-taper → ray). Any additive element that should read as
*substance / flame / gas* rather than *a thing* must peak in its middle and reach zero at BOTH visible ends —
and be parametrized over the span the viewer actually sees (past the eclipse), not the geometric 0→1. Corollary:
when one layer still looks mechanical next to premium neighbours, first check if it shares their *motion
language* (here: promote the shared dust grain to carry the radial job, so the fan can stop trying to).

**Fill/safety.** 36 mid-peaked tongues (dark at ignite AND tip) vs 48 constant-past-ignite ribbons → net fan
fill ≤ 1.0×; grain is an ALU-constant swap; additive-volume count stays 2. NaN-safe (every pow base clamped;
`sign(sw||1)` guards sw=0; new shader terms are clamped smoothsteps/vnoise). `?oldfan` build-time A/B (geometry
+ streak-shader both branch on it); `?nograin` still isolates the dust half.

**Verify.** smoke + bossboot zero-error (both shader variants compile); `unmaskedarena` — dead-loop check
(two frames ≥1s apart differ in the streak band) and the four luminance probes must stay green (fewer + mid-peak
streaks → sky p95 flat-to-down, the safe direction). auroraMix red pre-existing. **Owner judges on the real
GPU:** does the fan now read as eruption/flame rather than speed-lines, the curvature/clumping in motion, and
whether the radial dust reads as the "speed" energy. Dials: curvature floor 0.35, tongue peak width 6.0, jet
count 12.
