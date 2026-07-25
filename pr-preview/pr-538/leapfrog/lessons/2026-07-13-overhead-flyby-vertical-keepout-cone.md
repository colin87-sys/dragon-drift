# Arena flyby rocks — overhead passes via a VERTICAL keep-out cone (the mobile fix), Phase 1

**What we did.** Owner: the flyby rocks "look basic" AND only whoosh past the SIDES — so on a portrait phone
you barely see them. He wants rocks from ABOVE too, passing close, never a collision. A Fable art-composition
agent assessed the system and produced a phased plan; this is **Phase 1 (motion only, current geometry)** so the
owner can judge the dive/sweep FEEL on the real GPU before we invest in premium asteroid geometry (Phase 2+).

**The composition diagnosis (why side-only fails on mobile).** The side keep-out cone rides rocks at
`x = side·max(26, 11.7 + R·s + 1.15·d)` — always ≥ atan(1.15) ≈ **49° off the camera axis**. A portrait
phone's *horizontal* half-FOV is only ~18° (aspect ≈ 0.46 × tan(36°)). So the side flybys are not "hard to
see" on mobile — they are **geometrically excluded from the frame**. The fix is not a tweak to the side cone;
it's a new family on the axis mobile actually has room in.

**The key insight — vertical FOV has NO aspect term.** In three.js `camera.fov` is the VERTICAL fov; horizontal
is derived by `·aspect`. So the *vertical* angular budget is identical in portrait and landscape (half-vfov
36–47°). That's exactly why OVERHEAD passes are the right mobile fix: rocks crossing the top sky band read on
every aspect. The horizontal cone's `1.15` slope encodes `C·tan(fov/2)·aspect`; the vertical cone's slope must
NOT carry aspect — it's a fraction of `tan(vfov/2)` chosen to pin the rock to the top band.

**The vertical keep-out cone (the no-collision guarantee).** Mirror the horizontal cone, rotated 90°:
- **Placement:** `y_centre = CAM_Y_MAX + OVH_Y_BASE + R·s + OVH_Y_SLOPE·d` where `CAM_Y_MAX = 27`
  (laneMaxY 22 + chase 4.6 + shake headroom — the vertical analog of "11.7 = max camera-x"), `d` = camera-relative
  depth. Lifting the centre by exactly `R·s` (the bounding radius) makes the rock BOTTOM size-independent:
  `y_bottom = CAM_Y_MAX + OVH_Y_BASE + OVH_Y_SLOPE·d` (the `R·s` cancels). Bigger rocks sit higher so their
  bottoms align — one honest floor for the invariant.
- **Constraint (must clear):** `floor = max(OVH_Y_ABS 30, CAM_Y_MAX + OVH_YC_BASE 4 + OVH_YC_SLOPE 0.22·d)`.
  The abs clause (30 = laneMaxY 22 + 8) means the dragon can NEVER touch one regardless of camera; the screen
  clause pins the rock to ≥ ~12° elevation above the worst-case camera at every depth → top sky band only.
- **Invariant:** `marginY = min over the path of (y_bottom − floor)`, baked at build, asserted **≥ 0** — exactly
  like the horizontal `debrisFlybyMargin`. Placement slope 0.26 > constraint 0.22 and base 6 > 4 ⇒ margin is
  minimized at `d=0` and **ships at 2.0**, growing with depth. The two worst cases (rock low / camera high)
  can't co-occur — the same one-sided logic that makes the horizontal cone sound.
- The rock DESCENDS (y≈124 birth → ≈43 beside camera) while its screen elevation RISES: it dives toward you,
  sweeps up through the top band, exits over the top while still big/fast, recycles offscreen behind the camera.
  Lateral band `x0 ∈ ±9` sits inside the portrait centre column at every depth.

**Reusable law — for a "flies close but never collides" pass, make the keep-out a CONE that WIDENS with
proximity, and pick the AXIS by the viewport's angular budget.** A near object spreads on screen, so a flat
`|coord| ≥ const` (fine far away) fails up close — the exclusion must grow with camera-depth. Bake a
`min-over-path margin ≥ 0` so it's test-provable, not eyeballed. And when the target is mobile, put the pass on
the axis mobile has room in: vertical (aspect-free) for portrait, not horizontal.

**Verify.** `unmaskedarena`: `marginY 2 ≥ 0`, split `3ovh/5side`; horizontal `margin 1.6 ≥ 0` still holds with
the tightened `R` (1.3→1.45, the honest bounding radius; size capped 5→8.5 so the horizontal `d=0` margin stays
positive). smoke + bossboot zero-error. The lone red check is the **pre-existing auroraMix schema drift** (a prior
aurora merge; files this change never touches). `?noovh` reverts all 8 to side for an A/B. **Owner judges on the
real-GPU preview:** whoosh feel (speed × angular growth), cadence (one overhead ≈ every 7s), the descent-then-sweep
path. Only then do we build Phase 2 (premium asteroid geometry) + Phase 3 (surface). No new draws/geometry/additive
in Phase 1 — placement math only.
