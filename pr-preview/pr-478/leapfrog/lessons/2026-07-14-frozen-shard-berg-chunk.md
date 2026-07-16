# Frozen shard reskin — the Calved Berg Chunk (and: ladders on a TUMBLING body)

**What we did.** Reskinned the Frozen `shard` from a plain octahedron to a CALVED BERG
CHUNK: 3 jittered, interpenetrating icosahedra at a 1 : 0.6 : 0.44 hierarchy + 2 seam
micro-shards, reading as a tumbling iceberg fragment. Fable-gated **4.3/5 (ship)**. 68 tris.
Completes the Frozen hazard trio (bar / pillar / shard). Reuses the whole kit.

**THE headline lesson: a world-up value ladder FLICKERS on a spinning body.** `bakeIceLadder`
paints frost on up-faces / teal on down-faces from the world +Y — a *lighting story* that's
correct for the STATIC bar & pillar (sun logic). But the shard `rotation.x/y` spins, so the
baked colours tumble with it: half the time the "sunlit frost" points at the floor. It reads
as random patchwork flicker, not lighting. **Fix: reframe the ladder from lighting to
MATERIAL HISTORY, which is orientation-invariant** — dot each face normal against a fixed
per-chunk *weathering axis* instead of world-up:
- FROST = weathered outer rind, MID-ICE = fresh fracture plane, TEAL = deep seam/crush zone.

Implementation: `bakeIceLadder(geo, {ax,ay,az, frostT, tealT})` — one generalization, with
the axis + thresholds DEFAULTING to world-up / shipped values so the bar & pillar calls stay
byte-identical. Bake each chunk with its OWN axis BEFORE merging (the `color` attribute
survives `mergeGeometries`). The ladder is now proven across a static beam, a static tower,
and a tumbling body — a genuinely reusable kit for the next biome's hazards.

**Dynamic variant: split the material, don't swap the body.** The old dynamic shard swapped
the entire mesh to `mats.mover` (solid coral) — the variant players stare at most became a
pink lump with zero ice. Fix: **identical geometry**, a new `mats.moverIce` = the vertex-
coloured ice material with a coral `emissive` that pulses in `updateObstacles`. The ice
ladder reads at the pulse trough (clearly ice), coral dominates at the peak (clearly "this
one moves") — you get both. Two trivial costs: the pulse loop must also write
`moverIce.emissiveIntensity` (a shared-material pulse only pulses materials you write to),
and DON'T enable `vertexColors` on the existing `mats.mover` (other geometry using it has no
color attribute). Same silhouette across variants = "same hazard, it's hot" stays legible.

**Making fused icosahedra read as ICE, not asteroid or fused-dice.**
- **Cluster, not d20s:** strong size hierarchy (1 : 0.6 : 0.44 — never equal), deep asymmetric
  burial, secondary chunks poking CLEAR of the dominant one (first pass over-buried them → it
  read as one die with a nub), placement ~130° apart (never 180° = a mitosis dumbbell), and
  ±16% coherent vertex jitter. **Jitter coherently** — hash each unique local position so the
  5 non-indexed face-copies of an icosahedron vertex move together; independent per-vertex
  jitter tears the mesh into gaps.
- **Ice, not rock:** the saturated frost/mid/teal palette IS the signal — a vivid deep-TEAL
  belly is the closer (rock is desaturated warm-gray, never teal), plus at least one vivid
  flat MID-ICE fracture face. Fable checkpoint nudge, banked kit-wide: make `_FROST` chalk-
  BLUE not chalk-gray (dropped R 0.87→0.82) so the rind reads as ice, not concrete.
- **No silhouette pumping:** keep the bounding box ~equidimensional (≤~1.25:1) and the
  dominant chunk centred on the collider, or the perceived size oscillates as it spins and
  reads as a hitbox glitch.
- **Skip the crevasse glow at this scale** — a socket/sliver/brow assembly on a small tumbling
  body is unresolvable and a bare glow line is the LED failure. The ladder + jittered facets
  carry it.

**Fairness for a sphere collider.** The collider is a sphere `r*0.70`; the visible ice must
CONTAIN it. An icosahedron's inradius is `0.7946 × circumradius`, so the dominant chunk at
0.98r survives jitter to ~0.762r ≥ 0.70r from every direction — measured on the actual
jittered geometry (`shardColliderSupport()`) and asserted in `tests/hazardskin.mjs`. The
secondary chunks only add mass outside, so containment holds regardless of them.

**Frozen hazard kit — DONE.** bar (calved shelf-beam 4.4), pillar (serac spur 4.3), shard
(berg chunk 4.3), all on one system: `hazardMesh` (skin-or-byte-identical-fallback) +
`bakeIceLadder` (world-up for static, axis for tumbling) + `mats.frost*`/`moverIce` + the
numeric fairness+budget test. Next biome's hazards inherit all of it.
