# Fire-carving the boss — diagnose why the EXISTING fire fails before adding a competing one

**What we did.** Composition item #1: make the final-boss seraph read as *carved* by the detonation behind
it (the eclipse motif), not a flat shape in front of a glow. The boss ALREADY had a fire system (`igniteK`:
a leading-edge ember + an aura mandorla + wisps) with a load-bearing law — **"WREATHED, NOT WASHED"** (don't
brighten the large feather materials or you kill the dark silhouette). A naive fresnel rim would either wash
the fan or (on flat feather cards) read as glitter. A Fable art-director pass diagnosed why the *existing*
fire doesn't carve, and the fix strengthens it correctly.

**The diagnosis — three concrete, measurable reasons the current fire isn't a carve:**
1. **The backlight can't reach the silhouette.** The mandorla disc is radius-capped (`IG_R = DISC_R·1.65`, a
   hard fill-rate law) at ~7.8 rig-units, but the wing fan's outer contour is at r ≈ 12–14. The wreath dies at
   the *elbows*; the entire outer half of every wing — the actual silhouette — is backed by nothing.
2. **The glow profile is backwards for a backlight.** `pow(1−vR, 1.4)` is hottest at the CENTRE — exactly
   where the opaque body occludes it (additive, depthWrite:false, drawn after the depth-writing wings). What
   survives occlusion is the disc's dimmest zone. Brightness lands deep in the interior, not on the edge.
3. **The edge ember can't be hottened.** It paints whole feather blades, so pushing it bright washes the fan
   (the law). It's below the bloom threshold → reads as brown paint.

**The headline lesson — "carved" is a SPATIAL claim, and a heavily-designed element usually already has the
machinery; find why it's mis-*placed*, don't bolt on a rival.** Perceptually, "light carving a shape" =
(a) the brightest pixels lie in a THIN band hugging the outline, (b) a STEEP drop inward (dark within a hair
inside the edge), (c) continuity along the contour. The shipped system delivered the inverse (bright interior,
broad dim tint). The fix wasn't "add a rim" — it was move the existing energy to the edge and add a
tip-anchored HDR ember. Before adding a system, measure where the current one's brightness actually lands.

**The reusable technique — a MERGED-geometry local coordinate grades flat cards where fresnel can't.** Fresnel
(`pow(1−|dot(n,v)|,k)`) fails on flat feather cards billboarding at the camera (their normals face you → no
rim; only 0.05u side-walls graze → glitter). But `collapseWingByMaterial` bakes each feather's group transform
into the merged `position` attribute, so **`length(position.xy)` is a scale-, mirror-, and animation-invariant
"distance out the fan"** — identical across all 8 wings. `smoothstep(EDGE_R0, EDGE_R1, length(position.xy))`
(then squared for a steep inner drop) lights ONLY the distal fingertips → hot edge, dark interior, by
construction. Position-based grading in a baked-local frame is the flat-card answer to a silhouette rim.

**Two more wins that fell out:**
- **HDR gain (1.9) × igniteK** makes the tips cross the bloom threshold as the boss ignites → the fan visibly
  **catches fire tip-first**, emergent choreography for free (no keyframing).
- **Re-profile, don't regrow.** B2 kept the mandorla's capped radius but swapped the core-glow for a gaussian
  RIDGE at vR≈0.74 (`exp(−rd²)`) that burns through the inter-feather GAPS and flanks the crown — a backlight
  where the soft core couldn't reach — with a `hemi` down-arc weighting (0.55 lower / 1.0 upper) so the parry
  corridor is spared. Total additive energy stays ~level (tighter band, `IGNITE_GLOW_MAX 0.46→0.58`); the
  ≤2-additive-volume inventory is untouched (re-profile inside the existing disc, no new draw).

**WREATHED-NOT-WASHED preserved:** both terms are ADDITIVE and gated to the edge/tips (or the gap-ridge); the
feather DIFFUSE is never recoloured. `igniteK 0 ⇒ byte-identical` (the added radiance is exactly `vec3(0)`;
uniform zeroed in the guarded-restore branch alongside the mandorla opacity — same three-branch discipline).
`?oldrim` reverts both; `voidK` path untouched + mutually exclusive. Route the rim patch through
`chainBeforeCompile` (wrap-never-overwrite), never a terminal `onBeforeCompile`.

**Verify.** smoke + bossboot zero-error (both new shaders compile — the `#include <emissivemap_fragment>` /
`<begin_vertex>` / `<common>` anchors exist in r160 standard material). `unmaskedarena`: `edge > 0.9` in the
settled heaven, `edge === 0` at the S2 pin + void.

**Fairness reality — the sky-p50 cost is REAL and the BLOOMED TIPS dominate it, not the ridge.** The Fable
estimate ("+≤0.01") was badly wrong: the first build blew sky p50 0.47→0.60 (cap 0.55). The mechanism the
estimate missed: **the wing fan IS most of the "sky band," so a bright edge on the wings is a bright edge in
the probed region, and BLOOM spreads each HDR tip into a wide halo that lifts many sky pixels toward the
median.** Tightening/dimming the mandorla ridge moved it only −0.017 (the ridge is a minority of pixels);
the tips were ~0.11 of the +0.13. The levers that actually worked: **`EDGE_R0` up (6.4 — only the outermost
fingers kindle, fewer bloomed tips) + `EDGE_GAIN` down (1.9→1.15, just over the 1.0 bloom threshold so the
line still blooms but the halo is minimal)**, ridge coeff 0.85→0.65, and `IGNITE_GLOW_MAX` kept at the shipped
0.46 (the ridge's tight SHAPE carries the carve, not extra energy). The general law: **a bloomed fire-edge on
a subject that fills the frame trades directly against a "keep the background dark" median cap — budget the
bloom halo, not just the source pixels, and expect the source count × bloom-radius to be the real cost.**
`EDGE_GAIN` is the owner's on-device "hotter" dial, with the sky-brightening tradeoff made explicit to him. **Owner judges on real GPU:** whether the tip-line reads
as burning backlit edges or a "coloring-book outline," whether bloom FUSES the 5 hot fingers per wing into one
continuous fire-line or leaves dashes (dial: `EDGE_R0` 5.2→4.6 for longer lit spans; `EDGE_GAIN` 1.9→1.4 for a
below-bloom smoulder), and whether the gap-ridge steals the star-eye focal (dial: the ridge `0.74` seat).
