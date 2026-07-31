# Obstacle Studio — a workbench for in-lane hazards (bar/pillar/shard)

**What we did.** Added `buildObstacleMesh(type, bi, opts)` (inert studio export) to
`obstacles.js` plus `tools/obstaclestudio.{html,mjs}` — the propstudio/veilstudio pattern
applied to the three in-lane hazards. Renders ONE hazard in isolation at its REAL collider
scale, per biome, across ¾/head-on/side angles, with an optional collision-envelope ghost
(`opts.hitbox`). Foundation for the Frozen hazard reskins (owner: "random horizontal logs …
need to be redesigned to suit the frozen").

**Why a studio first (not just edit the shapes).** The hazards are the one place where a
prettier mesh can silently make the game *unfair*: the mesh is what the player reads, but
`collision.js` checks a hidden primitive envelope. Reskin the mesh smaller than the envelope
in any spot → "looks passable but kills". Reskin it and forget the collider is unchanged →
the mesh and hitbox drift apart. The studio renders both together so a reskin is provable,
not vibed.

**The invariant, encoded as a ghost.** `obstacleColliderGhost` draws the *hazard-intrinsic*
term of each `collision.js` check (player radius R added at runtime, shown as 0):
- `bar` → box, **full lane in x** (no x term in the collider — `|dz|<r`, `|y-cy|<r*0.75`),
  so a skinned bar MUST be continuous across ±16 or it reads passable where it kills.
- `pillar` → vertical cylinder `r*0.65` from floor to `h`.
- `shard` → sphere `r*0.70`.
The reskin rule: **visible silhouette stays OUTSIDE the ghost everywhere, and the collider
stays byte-identical.** Verified visually in the sheet (ghost nests inside the mesh).

**Gotchas banked for PR-3 (the reskins).**
1. `bar` has NO x-term — the log is a full-lane barrier. Any reskin must span ±16 with no
   visual gap, or it becomes an invisible-kill.
2. The skinned `bar` must DROP its `rotation.x += dt*0.5` spin (a sheared-ice shelf can't
   barrel-roll). Kill it in `updateObstacles` for skinned bars only.
3. `removeAt` disposes geometry per-object — shared skin geometries must be EXEMPT (tag
   `geometry.userData.shared=true`) or the second cull frees a geometry the next instance
   still uses.
4. The dynamic shard's warning read is the shared `mats.mover` hot-coral pulse — a reskin
   must keep that material on the dynamic variant.

**Zero shipped-pixel change.** `buildObstacleMesh` and its helpers are never imported by the
running game (studio-only). `addObstacle` untouched. gold-determinism byte-identical (5/5),
envcount green.

**What it unlocks.** PR-3 can now build `OBSTACLE_SKINS[bi]` behind a Fable pre-assess →
build → checkpoint loop, rendering before/after from the same sheet, with the fairness
invariant checkable at a glance.
