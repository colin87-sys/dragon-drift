# A radial fan must radiate in the CAMERA-FACING plane, not roll around the trail axis

**Context.** The Dawnfire Empress's hero is a bottom-heavy "pyre-train" — a fan of
flame-quill rays meant to spread wide across the lower frame in the rear-chase view
(behind + above, 100% of play). The owner called the first two versions "too basic /
too simple," and a high-effort Fable gate stalled at 3.92 → 4.00 (below the 4.3
Eternal bar) with the same complaint each round: **the fan reads as a narrow
downward tassel / golden chandelier, not a wide monumental burst.**

**The bug (geometry, not styling).** Each quill was built as a blade pointing mostly
AFT (`shaftDir ≈ (0,-0.32,1)` — dominant +Z) and then "spread" by
`quill.rotation.z = phi` (a roll around the trailing axis). Rolling a mostly-aft
vector around Z barely changes its lateral component: at `phi=81°` the lateral spread
is only `0.32·sin(81°) ≈ 0.32` against an aft component of `1.0`. So a nominal
**162° sector collapsed to a ~65° visual cone** — all the rays pointed backward and
clustered. Widening `trainFan`, broadening vanes, and softening the length taper (all
tried) did nothing, because the rays were spreading in the wrong plane the camera
never sees edge-on.

**The fix.** Build each ray as a flat vane lying in the **frontal (XY) plane** —
length running DOWN (local −Y), width in X, face toward +Z (the rear cam) — then
`rotation.z = phi` rotates the down-pointing ray into the frontal plane. At `phi=0`
the ray points straight down; at `phi=81°` it points nearly horizontal. Now the
sector actually subtends ~162° across the lower frame — a real sunrise-burst with
radiating negative space between rays, outer rays splayed past the torso, and (for
the first time) an open spiked shape in the pure black-fill silhouette. The overall
aft-rake / camera-facing tilt comes from the parent `fanG.rotation.x` (one tilt for
the whole fan), not from each ray's own direction. Fable jumped 4.00 → **4.67 PASS**
on that single change.

**Reusable rule.** For any radial spray whose spread must READ from a fixed camera
(peacock fan, sunburst, crown of rays, halo of spikes): orient the elements in the
plane that faces the camera and fan them within it. Do NOT point them along the view
axis and roll — rolling a view-aligned vector spreads it in depth, which the camera
compresses to nothing. Diagnose "my fan won't widen no matter the angle" by checking
which plane the elements actually live in.

**Corollaries this pass also confirmed (Solar → Phoenix epicness transfer):**
- **Everything premium was 2–4× too small.** The single biggest lever from "nice" to
  "epic" was SCALE on the hero set-piece + real precious-metal MASS (gold jewelry:
  clasp, pectoral, tiara, gem collets, spar), not more small detail. Detail was never
  the problem; monumentality was.
- **Jewels must be SET, sized ≥8px, and never float.** Gems at a ray's 0.9× length
  read as confetti; the same gems seated IN a solid gold band read as a crown. Fable
  flagged "floating pink diamonds" twice — orphaned accent gems (here, ruff tips) are
  an automatic drag; delete or embed them.
- **Lit render ≠ silhouette.** A recessed under-rank opens negative space in the lit
  view (dark gaps between gold rays) yet fills it in black-fill (it projects into the
  gaps). If the silhouette must read open too, thin/telescope the depth layer, not
  just the front rank.
- **Update the assert when the doctrine changes.** The shaped-lyre fan is deliberately
  NON-monotonic (center peak + shoulder swell); the old "center-longest, monotone
  taper" starter assert had to be replaced with a "fan outline is SHAPED, not a flat
  broom" variation check. A stale assert defending the old shape will block the new one.

**What it unlocks.** A frontal-plane radial-fan primitive for any future
camera-facing spray (biome hazards, other premiums' display features), and the
confirmed recipe for pushing a "fine" premium to "epic": scale the hero, add metal
mass, set the jewels — gate it hard on the rear-chase read.
