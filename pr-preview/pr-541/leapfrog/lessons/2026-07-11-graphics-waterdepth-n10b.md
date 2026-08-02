# 2026-07-11 — N10b water depth: gate in the mix-FACTOR domain, and derive params from lerped colours

**Did / learned.** The water body colour mixed deep→shallow by **wave height** — a flat tint with no sense of
depth. N10b mixes it by the **view-ray slant path to a virtual bottom** (fake Beer–Lambert): look straight down →
short path → bright shallows; glancing → long path → dark deeps. The sea reads as having *volume*. Fragment-only,
~6 ALU, behind a WATER DEPTH toggle, default OFF, byte-identical off. Gate-2 SHIP 8/10, no code defects — a clean
one because it's small and the two reusable patterns below made identity + per-biome tuning fall out for free.

**Pattern 1 (bank this): gate an optional shader effect in the MIX-FACTOR domain, not by blending two results.**
Both the shipped and the new look are `mix(deepColor, shallowColor, t)` — they only differ in `t`. The shipped
`t` is `tH = clamp(0.5 + h*1.4,0,1)*0.55`; the new one is `trans = exp(-uAbsorbK / max(V.y,0.05))`. So gate the
**factor**: `base = mix(deepColor, shallowColor, mix(tH, trans, uAbsorbOn))`. `mix(tH, trans, 0.0)` is exactly
`tH` in GLSL (finite operands), so OFF is byte-identical **for free** — and it's *one scalar mix* instead of two
`vec3` mads (blending `heightBase` and `absorbBase` would cost 3× the ALU and still need the same gate). The
naive "compute both full results, then blend" is almost always the wrong shape: **find the smallest scalar the
two variants diverge at and gate there.** (Same family as N15's `mix(1.0, vAO, uAO)` and N8's `*inscatter`.)

**Pattern 2: derive per-biome parameters from the already-lerped colours — no new authoring, free seam
smoothness.** N10b needs a per-biome extinction `uAbsorbK`. Instead of adding a `water.absorb` channel to all six
biomes + a `computeEnv` lerp (the N8 `atmos:{}` / N9 `sky.cloud:{}` route), derive it in `setWaterTint` from the
`env.waterDeep/waterShallow` that already arrive **lerped** every frame:
`K = 0.35 + 0.5·clamp(1 − lum(deep)/max(lum(shallow),0.02), 0, 1)` (Rec.709; murkier-deep = absorbs faster).
Because the inputs are already biome-seam-interpolated, K crossfades smoothly at seams with **zero** extra lerp
code, zero new fields, and it self-tunes (Emberfall's near-black deeps → murky; Frozen Reach's glassy pair → clear).
**→ Systematize: when a new parameter is a function of values the frame already computes, compute it there — an
explicit authored channel is only worth it when a biome needs to override the derivation.** (Left as a documented
future escape hatch, mirroring how `atmos:{}` stayed optional.)

**The math, and why it's safe.** `trans = exp(-uAbsorbK/max(V.y,0.05))` is monotonic in V.y (`d/dV.y > 0`), so
look-down is always brighter than glancing — physically the Beer–Lambert slant path `depth/cos(θ)`. `V.y > 0`
always here (camera rides ~4–6m above a surface ≤0.8m, and the Reflector never draws the water into its own
mirror), so `max(V.y,0.05)` is purely the glancing clamp (caps the slant at 20× depth); K is clamped ≥0 so the
exponent is finite-negative and `trans ∈ (~4e-8, 1]` — no NaN can pollute even the `*0` off path. Ordering: the
body colour is absorbed **before** `col = mix(base, refl, fresnel)`, so only the water body darkens, never the
reflection — and at the horizon fresnel→1 + fog→1 mask the darkened base, so there's no over-darkening; the
effect lives in the mid/steep-angle band near the player, which is exactly where the chase cam looks. It's a
subtle, tasteful effect by construction — don't expect a dramatic glancing-angle A/B.

**Uniform survival (the recurring water gotcha).** `uAbsorbK` + `uAbsorbOn` MUST live in `sharedUniforms` or they
detach on the reflective↔cheap / swell rebuild (`rebuildWater` only carries `sharedUniforms` keys, and the
Reflector clones a second time). `setWaterDepth` is a **live uniform flip** (no `rebuildWater()` — unlike swell,
which changes geometry) — writes `uAbsorbOn` on the current material; `spawnWater` re-asserts it after every
rebuild; `updateWater` rewrites it per frame. Triple redundancy across the three rebuild seams.

**Also / recorded.** The montage's far-biome cell kept capturing the title menu — root cause finally fixed:
**warp the distance AND freeze (`timeScale=0`) in the SAME tick**, so the input-less dragon never auto-flies into
an obstacle and dies to the menu; the biome/fog/water are distance-driven, so they snap to the warp target on the
next few frozen frames anyway. That fix generalizes to every warp-based shot tool. (Gate-2 also re-flagged the
not-frame-locked A/B — a standing shot-harness delta, not a code issue.) Non-blocking: `badges.mjs` is a
pre-existing shop-badge browser flake, unrelated to a default-off water fragment.

**→ Leapfrog.** The two patterns (mix-factor gating; derive-from-lerped-colours) are the reusable spine for every
remaining small shader toggle (N10c foam intensity, N12 grade split-tone, N14 shading AA). And N10 now has swell
(geometry) + depth (body colour) — N10c (foam collars welding props to the moving waterline via
`waterSurfaceHeight`) and the reflection-cost work (N11) are the last water rungs.
