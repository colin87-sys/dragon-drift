# Caldera hazard skins: basalt answers to the three colliders (SKIN_BUILDERS[3])

**What we did.** Built the Emberfall Caldera in-lane hazard skins — the collapsed-colonnade
BEAM, the spatter-chimney COLUMN, the breadcrust-bomb SHARD — registered at
`SKIN_BUILDERS[3]` behind the `hazardMesh` seam. Colliders byte-identical (the skin is
Caldera fiction only; gold-determinism proves it). Coverage numerically gap-free; all
three ≤150 tris.

## Reusable lessons

1. **The world-DOWN ember ladder is WRONG for a horizontal hazard.** The props' inverted
   ladder (down-faces glow) works because props stand upright — the belly is a small
   waterline sliver. A horizontal BEAM's whole underside faces down, so a world-DOWN belly
   floods it solid orange (an LED-bar read). Fix: bake the beam body with a DARK stop set
   (no ember belly — down/vertical = basalt, up = ash crust) so it reads as dark fallen
   columns, and let the recessed magma JOINT-cracks carry the only fire. Vertical hazards
   (the pillar) keep the ember belly happily (few down-faces → a dark body with a lit
   overhang), which is why the spatter chimney nailed the ratio on the first pass.
2. **A single-axis weathering ladder glows a whole hemisphere, not a network.** For the
   tumbling bomb, a low `frostT` put the ember stop on ~half the faces → an all-glowing
   ember rock. The fixed weathering axis can only give a DIRECTIONAL read (one molten
   fracture side vs the dark rind), not a crack network — so push `frostT` HIGH (~0.7) so
   only a small hot patch glows and the crust stays dark. A "lava bomb with one exposed
   molten side" is the honest read a single-material spinning body can carry; a fracture
   *network* would need the flowlobe trick (magma core through crust gaps = two materials),
   which the single-`{geo}` shard contract doesn't allow.
3. **Reuse the shipped `bakeIceLadder` with EXPLICIT Caldera stops — never fork it, never
   omit stops.** `bakeCalLadder` is a thin wrapper: `bakeIceLadder(geo, {ax,ay,az,frostT,
   tealT, stops})` with Caldera's own stop hues + a world-DOWN axis. Omitting `stops`
   silently returns Frozen blue ice (the named Part B trap); passing them at every call
   keeps the mechanical grep clean while reusing the proven baker.
4. **The `hazardMesh` shard branch hardcoded Frozen materials — the named seam trap.** It
   applied `mats.frostIce`/`mats.moverIce` to EVERY skinned shard, so a Caldera bomb would
   ship in blue ice. Route per-biome (`bi===3 → calBasalt/calBombHot`). Every new biome's
   shard skin must extend this seam.
5. **Author collider coverage numerically, per skin, and mind the oblate squash.** Each
   biome authors its OWN coverage exports (`calderaBarCoverage`/`calderaPillarCoverage`/
   `calderaBombSupport`) mirroring Frozen's, added to `tests/hazardskin.mjs`. The bomb's
   oblate y-squash (for the wider-than-tall dodge telegraph) dropped chunk A's inradius
   below the r·0.70 collider sphere (0.505 < 0.70 → "looks passable but kills") — enlarge
   the dominant chunk until its inradius clears the collider AFTER the non-uniform scale.
6. **Budget: hex columns are expensive.** A hex cylinder is 4n=24 tris; 5 across the lane
   blew the 150 budget. 4 fat columns (R≥1.42 so each hex cross-section contains the
   collider box) span the lane and fit. Coverage reduces to an x-continuity check plus a
   per-column inradius margin (the box corner-radius including the column's own offset must
   be < the hex inscribed circle).

## What it unlocks

The three hazard collider questions now have a proven per-biome answer path (skin builders +
coverage exports + the shard-material seam extension), so the next biome's hazards reuse it.
Remaining Caldera hazard work: the geyser PRESENTATION pass (burst-column + telegraph FX,
unifying the vent sites with the fumarole family) — the shipped geyser mechanics are
identity-locked and untouched.
