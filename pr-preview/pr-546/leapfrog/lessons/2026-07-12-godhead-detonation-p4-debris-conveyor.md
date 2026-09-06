# THE GODHEAD DETONATION — P4: the debris conveyor (radial-outward, time-driven, fairness-positive dark)

**What we did.** Added the DEBRIS field to `arenaSet.js` — one `InstancedMesh` of 30 lumpy dark rocks
(28 + 2 hero chunks, D3b) riding the blast: each chunk is born deep on the axis (small screen radius =
near frame centre), flies OUTWARD (radius 34→106) + FORWARD (z −560→−70) along a ray, scales in at
birth, fades at recycle, and loops forever (owner §1.2 perpetual conveyor). Near-black indigo
`0x14102a`, flat-shaded `MeshStandardMaterial` (NOT additive), a private `mulberry32(0x0d3b71f)` seed,
layer 1, tier-2 hidden with the set, +1 draw. Local tumble only (translation is radial; nothing orbits).

**The reconciliation — the owner's "radial-outward conveyor" vs the anchor law vs the |x| ≥ 25 gate.**
Three constraints looked contradictory: §1.2 wants debris "born at the centre, flying outward"; the
anchor law says stable-room-anchored side elements ride the player (jank); the fairness rule bans any
chunk from the focal/corridor column (`|x| ≥ 25`). Resolution: **depth carries "born at centre."** A
chunk deep on the axis (z −560) at a modest off-axis radius reads as NEAR the frame centre (far things
converge to centre); as it flies forward (z→−70) its screen radius grows to the frame edge — so
"born centre → flies outward" is a DEPTH+RADIUS sweep, not a literal origin spawn. That keeps every
chunk at `|x| = |cos(ang)|·r ≥ cos(0.6)·34 = 28 ≥ 25` for the whole life (the vertical column stays
clear — layout-asserted via a baked `debrisMinX`). And it's **TIME-driven, not player-driven**, so the
conveyor never freezes when the player hovers (the owner's "two frames 1s apart must differ" law) — the
stable-room anchor is CORRECT here because the debris belongs to the fight, not the world (the anchor-law
jank was STATIC furniture pretending to be world-fixed; a moving blast-conveyor legitimately rides the fight).

**Dark opaque geometry on LAYER 1 is safe — the composer's single RenderPass shares depth.** The layer-1
convention was established for ADDITIVE depth-agnostic sprites, so putting an OPAQUE `MeshStandardMaterial`
there looked risky (would it draw over the boss/water?). It doesn't: `postfx.js` composites with one
`RenderPass(scene, camera)` and the camera has layer 1 enabled, so layer-0 and layer-1 render in the SAME
pass against a SHARED depth buffer — the debris is occluded by the boss and the haze-deck correctly, while
staying out of the god-ray occlusion mask (won't punch ray holes) and the water mirror. **Layer 1 ≠
overlay; it's a cull mask on one shared-depth pass.**

**Fairness-positive by material.** Dark opaque debris SUBTRACTS luminance from the probe bands (it
occludes the bright blast behind it), so the field is a net negative on p50/p95 — the opposite of a
fairness cost. It also honours boss law §8 (small satellites stay dark — bright emissive on small
flat-shaded orbiters reads as pale glitchy debris; these are near-black and read as rock).

**The budget note (recorded, not resolved).** The boss budget lesson warns per-frame `instanceMatrix`
uploads janked a real phone. 30 instances is a tiny upload (~2KB/frame) vs that lesson's heavy case, and
draws are not a budget axis, so InstancedMesh (+1 draw) is the right call at this count — but if a future
pass grows the field past ~64 animated chunks, re-measure on a phone (separate meshes were faster there).

**Verify.** `unmaskedarena` 55 (was 54 + debris visible/layout/hidden-off-arena): debris `min|x| 28.1`,
vis true in heaven / false at mix 0 / void / after teardown; corridor p90 0.393 / p50 0.129, sky p95
0.866 / p50 0.447 (debris is dark → no upward pressure; the drift is live-fight noise). `tricount` 0-over
(env geometry, ~600 tris). `boss`/`unmaskedorgans` untouched by P4 (arenaSet.js + test only). Owner
preview: dark rock chunks scattered left/right of the blast, riding outward, corridor column clean.

**What it unlocks.** Four of the five carriers ship (palette, blast, ignited boss, debris). Only P5 (the
wingtip wisps) remains — the last additive accretion on the same window×fade spine, with the sky p95
headroom (0.866/0.90) as the budget to respect.
