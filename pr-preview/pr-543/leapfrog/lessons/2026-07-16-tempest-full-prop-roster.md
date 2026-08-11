# Completing a prop roster: 5 families, cheap pooled-light sockets, and knowing when a family is a shader

**Context:** Owner on device: *"Are there gonna be any more side props and hazards or is this it? Cause
this looks really repetitive and janky."* Dead right — only ONE of the Tempest bible's six side-prop
families (`stormprow`, the leaning wedge) had shipped, so the entire wall was one shape repeated with zero
warmth. Owner chose "full roster now." Built the remaining families to Fable's gate (R1 3.5 → R2 4.0 → R3
**4.2 SHIP**), one deferred.

## What shipped (5-family roster)
- **stormprow** (existing) — the leaning wedge wall + its fog-faded far back-rank.
- **tafonihold** — THE GLOW CARRIER: rounded tafoni boulder with a low band of gold sockets.
- **stormstack** — THE TALL HERO: wave-cut sea-stack, pinched notch, mushroom cap, notch sockets.
- **stackgrave** — THE LOW REST: leaning broken stumps on a wave-cut platform (bare, negative space).
- **rainshaft** — THE BACKDROP VEIL: far pale virga columns.
- **arcuswall** — DEFERRED to the sky shader (see below).

## The laws

**1. "Repetitive" is a ROSTER problem, not a per-prop problem.** No amount of polish on one family fixes a
one-shape wall. A biome reads as designed only when it has *sentence structure*: tall punctuation
(stormstack) + a warm mid-band (tafonihold) + low rests (stackgrave) + a foil (stormprow). Fable's phrase:
"the biome finally has sentence structure." Build the family SET, not the hero.

**2. Gold sockets = POOLED LIGHT, and pooled light is THREE layers.** First pass (a gold sphere sitting
proud on the surface) read as "lemon slices decaled on boulders." The value-structure fix is
dark-surround → hot-core → **bloom**, and all three must be present:
   - dark surround: recess the pool into a scoop; `bakeAO` shades the concavity for free.
   - hot core: the emissive pool (accent[7] `#ffd870`), set BACK inside the scoop, not proud.
   - **bloom (the layer everyone forgets):** a `bakeSocketSpill` pass that bleeds `#ffd870` into the
     surrounding rock vertices with radial falloff — warm light spilling onto the rim. **Zero triangles**
     (it's just vertex-colour lerp after the ladder bake), and it's what flips "wax seal" → "pooled light."

**3. Watch the gameplay-language collision.** The tri-diet turned the socket pools into sharp gold
octahedra — the *exact silhouette + colour of the collectible pickup gems*. "Gold diamond = collect me"
studded on the death wall. Fix: squash the pool into a flat wide lozenge (sunk in the scoop) — reads as
pooled liquid AND breaks the point-up-diamond silhouette. Props live in the same visual sentence as
gameplay icons; a scenery shape that matches a pickup shape is a bug even when it's "just decoration."

**4. TRIANGLE BUDGET IS A HARD GATE — design to it from turn one.** `envcount --ci` enforces ≤150 tris/prop
AND ≤50 000 band-tris/biome (band = allocated instances × tris; `perSide = ceil(WALL_WINDOW/step)`, so
small steps = many instances). My first pass blew both wildly (a `TorusGeometry(4,9)` socket rim = ~72
tris; five of them = a 684-tri boulder; biome total 168k). The diet:
   - **Sockets:** torus rim → a 5-sided OPEN cone scoop (5 tris) + an octahedron pool (8 tris) = ~13 tris,
     down from ~120. `bakeAO` gives the dark rim the torus was faking.
   - **Cylinders:** drop radialSegments to 5–6 (a 5-seg solid cylinder ≈ 20 tris vs 36 at 9-seg), and
     MERGE bands (one tapered shaft, not three stacked rings).
   - **Band total:** raise `step` on the dense/cheap families (stackgrave 13→32, stormprowFar 29→36) — the
     congregation `comp` parking hides the density loss, and allocated-instance count is what the guard
     counts. Keep the fairness-wall family (stormprow) dense; thin the accents.

**5. Some "props" are SHADERS. Know when to defer.** `arcuswall` (a shelf-cloud massif) fought the engine
on every axis: no per-prop elevation → a floating-`overhead`-prop hack → a dark backlit BLOCKY ceiling; a
scaled cylinder "gold lip" → a flat yellow CAUTION-TAPE plank; hard-faceted silhouette → "floating obsidian
slabs," not billow. It was also the worst tri offender. The bible had *already* hedged ("if the prop trick
fails, demote to a sky-shader streak"). A soft billow + curling gold lip is a job for the dome fragment
shader, not instanced geometry. **Deferring a family that fights the medium beats shipping jank** — and
Fable endorsed it. (Filed on the GRAPHICS-OVERHAUL backlog.)

## Reusable kit
- `addGoldSocket(parts, centers, x, y, z, s)` + `bakeSocketSpill(geo, centers)` — the pooled-light socket
  (cone scoop + lozenge pool + zero-tri warm spill). Any biome with a "glowing hollow" address can reuse it.
- The `overhead: { unitY, minWorldY }` archetype flag makes propclearance exempt a prop that floats above
  the lane (crown ≥ minWorldY, nothing below unitY → rhoLane 0). Useful for any sky/canopy element — but
  see law 5 before using it for a *cloud*.
- Determinism: all new families appended AFTER the last ARCHETYPES key → shared `rnd` shifts nothing →
  `gold-determinism` byte-identical. Verified.

## Verify harness (all green)
`propclearance --ci` (all families inner ≥ 14.5), `envcount --ci` (≤150/prop, band 49.4k < 50k),
`gold-determinism`, `insts`, `propao`, `propfoam`, `proprun`, `biomecycle`, `water`, `skyprobe`, `stormtick`.

## Fast-follows (non-blocking, logged by Fable)
- Waterline shows a dithered/checkerboard patch near some prop bases (foam-collar hash vs water) — verify
  it's the intended wet-contact/foam and not z-fighting.
- stormstack shafts are straight/uniform-width; a receding rank drifts toward "ruined colonnade" — wants
  more per-instance width variance (partly addressed by widening the `r` range).
- arcuswall gold-lip billow → the sky shader.
