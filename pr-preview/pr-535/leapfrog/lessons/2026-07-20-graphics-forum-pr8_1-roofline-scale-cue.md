# Drowned Forum PR-8.1 — roofline (the villa-roof SCALE CUE) + the terracotta bake + the flat-raft cruise trap

**What we did.** Built `roofline`, the last shipped Drowned-Forum archetype (12th): a low terracotta villa gable
breaking the gold mirror, the domestic SCALE CUE that makes the 40 m civic arches read monumental (the job the
pale gulls also do). Added a new matte `terracotta` tide-ladder bake. Funded it by trimming the `drumfall` foil.
Fable pre-assess 4.4/5; the build then had to fight one failure mode the pre-assess didn't predict.

**THE SCALE CUE NEEDS A NEW MATERIAL, AND IT'S A HUE NOTE NOT AN ACCENT.** Terracotta is the one warm-clay note
among the pale travertine. The law (Fable): a HUE note, matte, desaturated toward the apricot sunset key, VALUE
kept BELOW travertine (`_FRM_TERRA` L≈0.48 vs travertine L≈0.88) so a low roof never becomes a focal rival to the
gilt heroes; the wet foot dissolves to the SHARED `_FRM_DROWN` teal so the clay drowns like every other forum
stone. `bakeTerracotta` is structurally identical to `bakeForumLadder` (one tilted waterline plane, per-vertex key,
undercut soffit) — only the dry-crown colour changes. **A new prop family often needs a sibling bake, not a new
material group; clone the ladder bake and swap the crown albedo.**

**FUND A NEW PROP BY TRIMMING A FOIL, NOT BY FATTENING THE BUDGET.** The biome was at 49 436 / 50 000; a scale-cue
prop at step 48 (38 instances) needs ~2000 band-tris. Fable's ruling: trim the fat common FOIL `drumfall` — drop
its lying mid-trail COIN 2 (24 tris, "a rectangle regardless of segment count" — the code's own comment named the
cheapest cut), re-space the fall-line to keep its 3-beat sentence (stub → coin1 → coin3, the two ROUND-FACE coins
that sell "sliced column" survive). 140→116 tris freed ~1500 band-tris. **The freed budget goes to the new prop's
INSTANCE COUNT, never to fattening its mesh** (Fable capped roofline at ~40; it landed 53, so step went 45→48 to fit).

**THE ONE THING FOR A LOW PROP ON A MIRROR: rhythm in the SILHOUETTE, not the surface.** At 15–20 % freeboard on a
specular gold mirror the outline is the entire read; face detail vanishes into the sun-path glare. So the tile
rhythm lives on the OUTLINE: a dead-straight ridge dotted with prominent ridge-cap bumps + a dead-straight eave +
hard CLOSED triangular gable ends. Straight ridge + straight eave + transverse bumps = ROOF; longitudinal curvature
= the capsized-HULL failure. Thick roof slabs (a rim face → solid, never a paper plane); the gable ends MUST be
closed (an open cut shows water through the roof = "curled paper"). A single triangle `BufferGeometry` needs a `uv`
attribute or `mergeGeometries` rejects it (all merged geoms must share the same attribute set).

**THE FAILURE THE PRE-ASSESS MISSED — the FLAT RAFT, and why only a CRUISE render catches it.** The studio sheet
(close, angled) read as a clean roof at the specced Roman-shallow 15–22° pitch. The in-context CRUISE told a
different story: from the above-behind chase camera a 21° roof presents both slopes at near-equal angles → equal
light → **a flat terracotta RAFT/plank on the water**, not a roof (the shallower cousin of the hull Fable warned
about). The fix is pitch: ~30° splits the slopes into a LIT face + a SHADOWED face → a clear ridge + peaked-roof
read from above. **The scale-cue JOB (reads as a house roof) outranks the exact authenticity degrees** — 30° still
reads domestic, not alpine. *The lesson: a top-down/above-behind flyer flattens shallow-pitched forms; verify every
low prop with an actual CRUISE render, never just the angled studio sheet — the studio's ¾ view hides the flatten.*

**A SCALE CUE NEEDS ADJACENCY.** roofline clusters at congregation FEET (`comp.floor 0` + `arrivalPark`) where the
8 m domestic ridge shares a frame with the 40 m civic mass — a lone roof in an open breath is just a wedge. One
stray as breath seasoning is fine; the ROLE lives in the clusters.

**What it unlocks.** The terracotta sibling-bake recipe; the trim-a-foil-to-fund-a-prop budget move (freed tris →
instance count); the silhouette-first low-prop rig (straight ridge + bumps + closed gable, uv-on-the-triangle);
and the hard rule that **low props get a cruise render, not just a studio sheet** (the flat-raft trap is invisible
in the ¾ studio view).

**Verify:** `node tools/envcount.mjs` (THE DROWNED FORUM 49 914 < 50 000); `node tests/gold-determinism.mjs`
byte-identical; `node tests/biomecycle.mjs` 14/0; `node tools/forumleak.mjs` (12 forum keys, roofline whitelisted);
`node tests/bulletcontrast.mjs`; `node tools/_forumstudio.mjs <tag> roofline` → peaked roof, closed gable;
`node tools/_roofcruise.mjs <tag>` → reads as a drowned villa roof, not a raft, in the gold scene.
