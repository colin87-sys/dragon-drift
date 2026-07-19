# Arena flyby rocks — premium asteroid sculpt + surface + path variance (the "not cardboard" fix)

**What we did.** Phase-1 overhead passes brought the flyby rocks CLOSE for the first time, and the owner's
(cropped) screenshots exposed that the geometry was garbage up close: a single 20-face jittered
icosahedron reads as **flat khaki-camo cardboard shards**, and two rocks shared a track ("in line"). A
Fable art-director re-plan drove a full rebuild of the debris rock — shape, surface, and path variance —
in `arenaSet.js`. (Owner confirmed the SIZE was fine — the crop exaggerated it — so framing was left
alone; this is purely look + variance.)

**Three diagnoses → three fixes.**

1. **Cardboard = 20 flat facets + convex blob.** A jittered `IcosahedronGeometry(1,0)` stays convex and
   isotropic; up close each of 20 faces is a thumb-sized flat plane. Fix: a **CPU sculpt pipeline** on a
   subdivided ico, applying the DRAGON-DESIGN frequency hierarchy — BIG (anisotropy + 4 agglomerate
   gaussian LOBES that break the OUTLINE into a contact-binary silhouette), MEDIUM (**craters** — a cosine
   cup + a raised rim; concavity is the one shape cue a convex blob can NEVER have, and it's *the* asteroid
   signature), FINE (3-octave value-noise grain). Normalised to bounding radius 1.16 so `FLYBY_R 1.45 =
   1.16 × the ≤1.18 per-instance axis cap` stays honest (the keep-out cones already assumed it).
   **Gotcha: three's `IcosahedronGeometry(r, detail)` subdivides to `20·(detail+1)²` tris, NOT `20·4^detail`.**
   detail-3 = 320 tris (not 1280). Hero rocks use **detail-6 (980 tris)** for a smooth silhouette + granular
   flat-shaded chisel; field rocks stay detail-1 (80). The Fable "subdiv-3 = 1280" estimate was wrong by
   this formula — verify tri counts empirically, don't trust the 4^n intuition.

2. **Khaki-camo = flat facets + threshold-noise "veins" unattached to relief + warm-only light.** The old
   rim washed whole flat facets tan (indigo × gold), and the molten veins were a hard `smoothstep` of 3D
   noise painting black blotches ON flats. Fix: **bake a per-vertex `aCavity`** (0 rims/crowns → 1 crater
   floors/crevices) during the sculpt, then in the material: (a) **crevice AO** `diffuse *= mix(1.05, 0.28,
   vCav)` — dark IN the cracks, a real value tier; (b) **charcoal albedo trio** via per-instance
   `instanceColor` (`0x2e2a26/0x38322c/0x453b32` — dark STONE that grades warm under the gold key, never
   khaki; white material base so instanceColor carries it); (c) **molten glow GATED to deep cavities**
   (`smoothstep(0.5,0.9,vCav)·noise·aHeat`) — coal-in-the-cracks, not a torch-decal on a flat; (d) a
   **DIRECTIONAL rim** — hot gold on the view-space blast side (`dot(normal, uStarDir)`), cool violet on the
   shadow side — so the form reads round. The reusable law: **emissive detail must live IN the geometry's
   relief (gate it by baked cavity/curvature), never as unattached surface noise — that's the LED-decal
   failure, and it's worst exactly when the object is big on screen.**

3. **"Two in line" = shared speed + centred lanes.** All flyby shared ONE speed (lockstep) and overhead
   lanes were `±9` with ~0° drift → paths collapse on one vanishing ray. Fix: the 3 overhead rocks get
   **DISJOINT-by-construction tracks** — lanes {−10,0,+10}, drift headings {−0.10,0.02,0.10}, speeds
   {0.042,0.055,0.068} (periods 24/18/15s — never lockstep), distinct size bands, staggered phases. Side
   rocks each get their own speed too. A baked **distinctness ledger** (min pairwise Δlane/Δdrift/Δspeed) is
   asserted (≥6 / ≥0.05 / ≥0.010) so "no two share a track" is test-provable, not eyeballed. **Reusable:
   guarantee separation by assigning disjoint bands, not by hoping random draws diverge.**

**Architecture — 2 InstancedMeshes, ONE material.** hero (8, detail-6) + field (22, detail-1) share the
material (one compile). Variety off ONE shared shape per mesh comes from per-instance non-uniform scale
(0.88–1.18) + tumble + instanceColor — at most 2–3 heroes on screen at once, so the shared shape never
registers. **+1 draw call, 9600 tris (was 600), zero new additive volumes** — opaque rocks stay
fairness-positive (they SUBTRACT from the bloom probes). Three PRIVATE mulberry32 streams (geoHero /
geoField / placement) so retuning placement never reshuffles the sculpt; level/gold RNG untouched.

**Verify.** `unmaskedarena` 59/60: draws 2, tris 9600 ≤ 13000, overhead ledger Δlane 10.37 / Δdrift 0.104 /
Δspeed 0.013, marginY 2 / side margin 1.6 / minX 29, split 3ovh/5side. smoke + bossboot **zero console
errors** (the premium shader compiles + runs a full boss fight clean — NaN-safe: every `pow` base
`max(0.0,…)`, noise fract-only, no bare sqrt/log/div). The lone red is the **pre-existing auroraMix schema
drift** (untouched files). **Only the real-GPU preview can judge** the actual read: does charcoal grade to
stone (not mud/khaki), do crater rims catch the gold, does the directional rim make it round, is the
silhouette believable at the near pass. If too dark, the lever is the albedo trio + the AO floor (0.28).
