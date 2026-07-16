# 2026-07-11 — N10c foam collars: sibling instancing in lockstep, and "believe the montage on intensity"

**Did / learned.** With the sea now swelling (N10a) + reading as having depth (N10b), the props still looked
*pasted on*. N10c rings each prop's waterline with broken, pulsing foam so towers/crystals/ruins **weld into the
moving sea**. Behind a SHORE FOAM toggle, default OFF, byte-identical off. Gate-2 SHIP (no correctness defects);
the one real miss was aesthetic — the first foam was too faint to read, caught by the montage, not the code.

**The core pattern (bank this): a per-element decal that must track a recycling instanced system is a SIBLING
InstancedMesh written at the SAME INDEX in the same write call — not a separate pool.** The spec said "one
InstancedMesh of ~48 decals." Reality: ~1,050 prop instances across 15 independently-recycling archetype bands.
A fixed 48-slot pool would need per-frame nearest-K assignment across all 15 bands — exactly the bookkeeping that
causes drift bugs. Instead give each band a sibling foam mesh with the **same instance count**, and write the
foam matrix inside the prop's `writeMatrix(band, i, d)` at index `i`, passing the prop's already-computed `active`
flag. Then **recycling, biome parking, the arena gate, and `needsUpdate` all come for free** — the foam has *no
independent state*; it is a pure function of `band.data[i]`, so it can never desync. Parked foam uses the exact
prop parking pose (`y −50`, scale 1e-4). The only new bookkeeping is one extra `needsUpdate` at each of the three
write sites and one line in `updateBandVisibility`. **→ Systematize: when adding a decoration that shadows an
existing instanced/recycled system, derive it in the same loop at the same index — never build a parallel
lifecycle.**

**Ride shared motion in the SHADER from the ONE exported constant.** The foam sits at the waterline and must heave
with the swell or it detaches. Don't sample a JS height per-instance per-frame (writeMatrix only runs on recycle →
you'd need a whole new per-frame CPU loop + matrix re-uploads). Instead the foam **vertex shader** displaces by the
*same* `SWELL` constant the water surface uses (`import { SWELL } from './water.js'`, template-interpolated), gated
by `uFoamSwell = getWaterSwellOn()` mirroring the water's `uSwellAmp`. Per-vertex sampling keeps even big rings
conformal; the residual grid-vs-analytic sag (~0.004m tier0) stays under the 0.05 anti-z-fight lift, so the collar
can't dip under the surface. **One exported constant driving two shaders = zero drift**; the test greps both
sources for the `${SWELL.*}` interpolation to prove it. (Fragility noted in-code: keep every SWELL value fractional
— an integral one emits a GLSL int/float type error.)

**The decal-render checklist (reused every time):** layer 1 (skips the god-ray occlusion mask AND the water
Reflector pass — both render layer 0 only; a coplanar black decal or its invisible reflection is pure waste);
alpha-blend not additive (additive blows out on the sun-streak lane and double-counts the water's own crest foam);
`depthWrite:false` + a tiny constant lift + transparent-pass ordering (opaque water/props write depth first, decal
blends after) kills z-fighting; `tonemapping_fragment`/`colorspace_fragment` tail so the tier2 direct-to-screen
path grades once (same as the water). And **hide, don't just park, the opt-out cases** — an always-parked sibling
still issues a degenerate draw call; `&& band.def.foam !== false` reclaims it.

**The miss, and the lesson: the code gate can't score intensity — the montage does.** Gate-2 verified every
correctness axis (identity-off, parking lockstep, swell parity, layer exclusions, the tilt-pierce math exact) and
scored the *code* 8/10, but explicitly made **visual sign-off a merge condition** and flagged the FOAM_CFG radii +
alpha as "aesthetic guesses only the montage can validate." It was right: the first foam (alpha 0.6, single-scale
break, faded by fog) barely read at the 15–25m prop distances. The fix was pure tuning — near-opaque churn (0.95),
a wider band, a two-scale broken edge (coarse + fine cells so it tears like real churn) — plus a **closer montage
vantage** (center chase framing makes a ~2m ring tiny; move the camera to a side prop-row and look down its
waterline). **→ Systematize: for any effect whose payoff is a look (not a behaviour), the intensity/coverage
numbers are placeholders until a representative-vantage montage confirms them — and "representative" means framed
where the effect actually lives, not the default hero shot.** Same family as N10b (depth invisible at glancing
angles → pitch into the water) and N9 (the FBM opacity ceiling).

**Tilt pierce (small but exact).** A tilted prop crosses the waterline off its origin. Because compose applies
scale (axis-aligned) before rotation, the prop's world axis is exactly `q·(0,1,0)`; it crosses y=0 at
`t = 0.5/cos(tilt)` along the axis, so the collar offset is `q·(0, 0.5/cos(tilt), 0)` — take xz, keep the ring
flat (rotY only). Independent of height, well-conditioned to the ~0.34 rad max tilt.

**→ Leapfrog.** The water trilogy is complete: swell (geometry) + depth (body colour) + foam (weld). The
sibling-instanced-decal pattern generalizes to any "decorate every instance of a recycled system" need (moss at
prop bases, embers around vents, snow caps), and `getWaterSurfaceHeight`/`SWELL` + `getWaterSwellOn` are the
reusable hooks for anything that must sit on the moving sea. Next water work is N10d (reflection blur / half-rate)
+ the N11 reflection-cost pass.
