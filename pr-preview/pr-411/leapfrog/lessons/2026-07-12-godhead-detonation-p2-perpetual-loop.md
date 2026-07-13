# THE GODHEAD DETONATION — P2: the perpetual blast (one additive ShaderMaterial, eclipse-baked, loop-proven)

**What we did.** Evolved the Godhead Star (`arenaSet.js`) into THE GODHEAD DETONATION — a full-frame
PERPETUAL radial blast, now the owner-locked default `STAR_MODE`. ONE merged additive `ShaderMaterial`
draw carrying four sub-forms via a per-vertex `aType`:
- **core + widened corona** (R 240→280) + **4 diffraction spikes** — the static star glyph (aType 0,
  brightness baked in vertex colour, `b=1` in-shader).
- **64 radial STREAK filaments** (aType 1) jetting core→frame-edge, energy SCROLLING outward on a
  seamless loop (`flow = sin(t·6π − uTime·uFlow + phase)`), tip-decay × soft-edge fade in-shader.
- **3 vast SHOCK RINGS** (aType 2, R 180/300/430) whose wavefront travels outward + recycles
  (`sin(t·2π − uTime·uRing)`), soft-banded to black on both edges.
- Colour core→rim (owner D1a): molten gold `[1,.85,.54]` → gold-rose `[.85,.54,.39]` (the nebula key)
  → S2 void-violet `[.5,.4,.7]`. The pre-apotheosis `supernova`/`spiral` modes are kept as A/B seams (D7a).

**The headline pattern — BAKE the fairness geometry into vertex colour, ANIMATE only the envelope.**
The two hard containment rules (the eclipse corollary + down-hemisphere suppression) are computed at
BUILD time from ACTUAL radius/angle and multiplied into the vertex colour, so the shader never needs
world position or per-fragment branching for fairness:
- **Eclipse (the firstborn lesson's headline gotcha):** the seraph subtends ±27°; at the star's 420m
  depth that is r≈210u. Each streak vertex bakes `smoothstep(150, 210, r)` — BLACK until it clears the
  silhouette, then ignites — so light lives in the visible annulus AROUND the dark figure by
  construction, per-streak-correct even though streak lengths vary 300–620u (a normalized-`t` gate
  would ignite short streaks INSIDE the figure).
- **Down-suppression:** streaks with `sin(a) < −0.15` get 0.5× length + 0.4× gain; ring lower-half
  vertices get `0.4 + 0.6·smoothstep(−0.4,0.2,sin a)` — baked, zero per-fragment cost. The blast
  blazes up-and-out and dies before the corridor band.

The shader is then just `vCol · envelope(uv, uTime) · uGain` — `uGain` is the engage dimmer (the
corona idiom, moved from `MeshBasicMaterial.color.setScalar` to a uniform); `uTime` is the loop.
Additive with `gl_FragColor.a = 1` and rgb→0 at every edge (soft everywhere, no hard rim — the
Voidmaw-portal law) exactly like the shipped vertex-colour-to-black `MeshBasicMaterial` corona.

**The gotcha — a screenshot "did it move?" gate can't tell the LOOP from the bullets.** The handover
wanted "two captures ≥1s apart must differ in the streak band." A naive whole-frame moved-fraction
would pass even with a DEAD loop, because bullets + wing idle move pixels too. Two fixes made it a
real proof: (a) probe the UPPER streak band (y 15–35%) where the radial rays dominate and player
bullets are sparse (they converge lower toward the ship); (b) add a deterministic driver assert —
`debugArenaSet().detUTime` must ADVANCE between two polls (the perpetual driver is running). Shipped:
uTime 34.98→37.63 over 1.2s, band moved **95.5%** (gate >30%). A frozen loop drops the band far below
30% and pins uTime — either catches it.

**Verify.** `unmaskedarena` 50 (was 48 + the two loop asserts; mode-lock re-authored `supernova`→
`detonation`): corridor p90 0.372 / **p50 0.126**, sky p95 0.830 / p50 0.413 — all under gate WITH the
full blast on (the eclipse-baked dark annulus + down-suppression are the fairness dividend). `boss`
126 · `unmaskedorgans` · `skyclouds` 26 · `water` 24 · `bulletcontrast` all green (no rig/water/cloud
touch). `tricount` 0-over (env geometry isn't a model; the blast is ~1.4k tris, one draw, under the
~2.6k budget). Owner preview: two frames captured 1.3s apart — a dark seraph ON FIRE at the heart of a
gold→violet radial detonation, corridor dark, continuous outward flow (not a strobe).

**What it unlocks.** The apotheosis's roiling power is on screen and provably looping at zero fairness
cost. P3 (`setArenaIgnite` — the gold-rim + violet-undertone seraph) drops onto this blast; the
`aType`-tagged single-draw ShaderMaterial + baked-fairness pattern is the reusable template for P4's
debris-lit-vs-additive split and P5's wisps (same merged-additive, vertex-faded-to-black spine).
