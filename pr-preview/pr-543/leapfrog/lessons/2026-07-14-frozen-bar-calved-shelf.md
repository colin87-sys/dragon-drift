# Frozen bar reskin — the Calved Shelf-Beam + the reusable ice VALUE LADDER

**What we did.** Reskinned the Frozen in-lane `bar` hazard from a smooth cyan cylinder
("random horizontal log" the owner hated) to a CALVED SHELF-BEAM: 5 sheared,
interpenetrating flat-shaded ice sections spanning ±17 (overshooting the ±16 lane),
stepped top AND belly, recessed crevasse glow at the fracture seams, clustered icicle
teeth. Fable-gated 3.9 → **4.4/5 (ship)** across two checkpoints. ~148 tris.

**The reusable win — a normal-driven VALUE LADDER (`bakeIceLadder`).** The 3.9→4.4 jump
was almost entirely one move: bake per-face vertex colours onto the merged, non-indexed,
flat-shaded geometry from each triangle's GEOMETRIC normal —
- `ny > 0.35` → near-white frost `[0.87,0.93,0.99]` (upward faces),
- `ny < -0.30` → deep teal `[0.13,0.32,0.40]` (belly/shadow),
- else → mid ice `[0.36,0.60,0.75]` (verticals, hue nudged OFF the sky so the silhouette
  always separates).

One flat blue band → carved, lit ice at **zero triangle cost**. This is now the Frozen
material baseline: `mats.frostIce` (vertexColors, white base so the bake reads as
authored). **Every future Frozen prop/hazard should inherit this ladder** instead of a
single-colour body material. The pillar and shard reskins carry it straight over.

**Killing the LED-strip failure (grounded seams).** An emissive sliver on a surface reads
as a stuck-on strip. The fix that passed: glow sits just PROUD of the face (so it isn't
occluded) but inside a dark near-black-teal recess SOCKET (a `mats.frostShadow` plane
behind it) and under a proud brow lip → "crack with light inside", not a decal. Short +
segmented + seam-anchored + dimmed for bloom headroom. `mats.frostGlow` breathes ~0.5Hz in
`updateObstacles` (shared, one write/frame) — the "live hazard" cue that replaces the bar
spin we deleted (a calved shelf can't barrel-roll).

**The fairness invariant, proven not eyeballed.** The bar collider (`collision.js`) has NO
x-term — it's a full-lane wall (`|dz|<r`, `|y-cy|<r*0.75`). A visible gap anywhere in the
mesh = "looks passable but kills" (the owner's "randomly die" complaint). So:
- authored the sections in DATA (`BAR_BOXES`), each cross-section individually containing
  the collider box (half-height ≥ 0.64 + |cy-shift| + roll-margin);
- exported `barColliderCoverage(r)` — samples the collider outline across the full lane at
  every spawn radius and asserts every point sits inside some section;
- `tests/hazardskin.mjs` runs it at r∈{0.7,0.85,1.0,1.1} + a ≤150-tri budget check + a
  fallback-unchanged check. Gap-free at every radius; the studio ghost tile confirms it
  visually. Coverage failed the FIRST build (belly-shifted + rolled boxes left the top-back
  corner exposed) — the numeric check caught it before any render. **Bank this: shifts +
  rolls eat collider margin; verify coverage numerically, don't trust the eye.**

**Engineering gotchas banked (from the studio lesson, now proven live).**
- `mergeGeometries` can't mix indexed (Box) + non-indexed (Tetrahedron) → normalize with
  `.toNonIndexed()` first, or it returns `null`.
- Shared skin geos tagged `userData.shared=true`; `removeAt` skips disposing them (else the
  next instance renders an emptied buffer).
- Skinned bars set `e.skinned` so `updateObstacles` skips the spin.
- Icicle teeth are visual-only but capped at 0.7 below the collider bottom — a long opaque
  tooth in the under-gap reads as a collision bug, not a near-miss.

**Systems, not one-offs.** `addObstacle` and the studio both route through one `hazardMesh()`
(skin when present, byte-identical primitive fallback otherwise), so what Fable grades is
what ships and non-Frozen biomes are provably unchanged (gold-determinism byte-identical).

**What it unlocks.** Pillar (SERAC SPUR) and shard (BERG CHUNK) reskins reuse `bakeIceLadder`,
`mats.frost*`, the socket-glow idiom, and the same coverage/budget test — the Frozen hazard
kit is now a system, not three bespoke meshes.
