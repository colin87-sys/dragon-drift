# Rock-run integration polish: the 5 owner flags, and why the pre-assess AUDIT saved the build

**What we did.** The shipped Frozen Calved Canyon rock run drew 5 owner flags on fly-test
("the whole rock run is pretty ugly … detracts from the side props"). A Fable pre-assess
+ per-fix + holistic checkpoint loop took it to **4.3/5, shipped**. The five, and the reusable
lessons each left:

## 0. The pre-assess AUDIT overturned the brief — read the LIVE code path, not the assumed one
The brief (and my own hypotheses) blamed the "floating log" on the overhead **cone-stalactite
arches** in `stackRun`. The Fable audit checked `CONFIG.canyonRockV2` and found it's `true` →
the live path is `stackRunV2()`, which builds **NO overhead arches at all**. Those cones are
dead code behind a rollback flag. The real "floating log" was the **`overunder` ceiling lump**
(a flat-tinted smooth icosahedron). **Had I built to the brief I'd have polished code that never
runs.** THE LESSON: before diagnosing a visual bug, confirm which branch actually renders it —
grep the feature flag (`canyonRockV2: true` at config.js), trace the dispatch, verify against a
real in-game frame. A plausible root cause in a dead branch is worse than no diagnosis.

## 1. Transparent depth-sort: `depthWrite=true` WHILE fully opaque is a free occlusion fix
Every canyon mass is `transparent:true, depthWrite:false` from birth so it can near-fade. But a
**fully-solid (opacity 1) far** mass then sorts by centroid in the transparent pass and paints
OVER a nearer one ("rocks appear over pillars"). The fix that changes nothing visually: **an
opacity-1 mesh renders identically with depthWrite on or off**, so flip `depthWrite = opacity >=
0.999` in the fade loop — occlusion restored, the shipped near-fade see-through byte-identical.
Do NOT toggle `material.transparent` at runtime (forces a shader recompile → hitch on weak
mobile); `depthWrite` is render state, free to flip. `renderOrder` was rejected: a global
depth-based renderOrder makes canyon masses order against the rings/mist too (breaks their
occlusion). depthWrite alone is sufficient because the depth test rejects far-behind fragments
regardless of draw order.

## 2. Post-and-lintel GATEWAY beats a floating slab — but it must be CARRIED from every angle
Rebuilt the overunder lump as a calved-ice **gateway**. The two-round checkpoint (3.8 → 4.3)
banked the recipe:
- **The ends must SEAT, not vanish behind a berg.** v1's beam ended before the piers → a "row
  of floating teeth." Fix: wide pillars (hw 2.8) rising ABOVE the beam top, beam span extended
  so its end blocks **embed ~2–3u INTO the pillar mass**. "Behind a berg" reads as coincidence;
  "into a pillar" reads as structure. This was ~90% of the score gap.
- **One block-row is a plank edge-on.** A second z-row (front+back, jittered) keeps mass at the
  oblique duck-under angle (the moment of maximum scrutiny).
- **Crown = a few FAT caps, not a comb of teeth.** Low-amplitude stacked-ice bump, center cap
  tallest, breaks the top silhouette at cruise without reading as battlements.
- Bottom pinned flat (a lintel, not a curved arch) — a pointed arch reads gothic/hand-built,
  wrong for calved ice; the flat-bottom + crowned-top is the calved read.

## 3. When the collider is FROZEN, ring "clearance" = "visible ice ≤ collider face toward the ring"
The overunder collider grazes the reward ring by ~0.08u (a pre-existing frozen-gameplay fact —
ring outer edge gy+3.98 vs collider bottom gy+3.9). You **cannot** give the ring a full 1.5u
visible halo without either moving the collider (contract-breaking) or leaving invisible-but-
solid collider below the ice (unfair). The achievable, satisfiable contract: **pin the visible
face to the collider face and jag AWAY from the ring** (beam bottom up-only, floor ridge
top-down-only), so visible ice never overshoots the collider toward the ring. The old lump
jag-inflated ~0.8u THROUGH the ring; pinned, it's 0.00u past the collider. `ringClearance()`
(tests/hazardskin.mjs) measures the REAL merged geometry, sampling only the ring's x/z footprint
so the sea-rooted pillars (legitimately full-height, far out in x) don't false-fail.

## 4. Detail LOD is a REVEAL, not a constant — sub-pixel emissive shimmers at the horizon
The "glitchy lines on the columns" were the crevasse-socket glow slivers: a sub-pixel emissive
stripe with no AA coverage strobes at 200–400m. Fix: the socket rides its OWN `socketFades` curve
(the OPPOSITE of the wall's solid-far curve) — **opacity 0 beyond ~150m, resolving IN as you
close**, and the opaque backing is hidden with it. Wider (1.1) + prouder (0.18) slivers so at the
range they ARE visible they have real pixel coverage. No collider → hiding it far is fair. General
law: any fine self-lit detail (cracks, filigree, LED accents) should LOD to nothing past its
legibility range — a crack that resolves out of clean ice is more premium than one that strobes
at the horizon (same withheld-glow law the dragons use).

## 5. A run needs a MOUTH — the channel can't move, so frame it with collider-free dressing
"Entering a rock run is ugly" is compositional: walls snap in with no announcement, and the
first-slice wall ends face the player as sawn butts. The channel itself **cannot** be reshaped
(li/ri/heights carry the ramp-safety fatal-wall contract). Fix = additive dressing OUTSIDE the
fatal lane, keyed off `o.runIdx === 0` (entry) / `o.runTotal-1` (exit): oversized **headland
capes** angled ~10° toward the player (SHEAR-free tilt is fine here — dressing, no collider, so
walking the top out of plane is intended, unlike an in-lane wall), a **calving-block field**
stepping back over the ~80m approach (the biome side-prop language literally breaking off into
the canyon — the handoff the owner was missing), and a **threshold mist veil**. One merged mesh,
no colliders (canyonflow's walls-free assert still passes).

## The process win
`overunderMassParts()` is a **shared module builder** feeding BOTH the live path (`iceArch`) and
the headless `ringClearance()` audit — the audit measures the exact shipped mesh, can't drift.
Same pattern as `wallColliderCoverage`. Restated: **build the fairness/clearance audit on the
same code the game runs, never a parallel restatement of constants.**

## What's banked / what's next
- Reusable: the depthWrite-when-opaque occlusion fix; the seat-the-ends gateway recipe; the
  collider-frozen clearance contract + real-geometry audit; the detail-LOD-as-reveal law; the
  collider-free run-mouth kit keyed off runIdx.
- Non-blocking future polish (Fable, holistic gate): **facet the gateway's interior faces** — the
  beam soffit + pillar inner faces read "box corridor" at the duck-under second (arch-d344 ~3.9
  vs the dead-ahead 4.5). Run the wall's calving-facet displacement on any face whose normal
  points into the flight lane, chamfer the arch↔beam intersection ~1–2m, and fresnel-brighten the
  translucent ice panes so they read as ice sheet, not window glass. That pass takes the run from
  "belongs next to the side props" to "is one of them."
