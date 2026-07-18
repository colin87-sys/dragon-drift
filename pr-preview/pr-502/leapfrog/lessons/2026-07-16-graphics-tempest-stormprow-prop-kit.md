# Tempest Reach PR-1 — the stormprow prop + the 4th value-ladder (wind-scour)

**What we did.** Landed HERO #1 of the Tempest Reach (biome 7) storm-carved prop kit:
`stormprow`, a sheared layered-wedge sea stack, plus the reusable kit plumbing that the
rest of the roster (stackgrave/tafonihold/stormstack/arcuswall/rainshaft) will ride.

**The kit plumbing (clone-of-Caldera, all render-only so determinism is untouched):**
- `mats.tempestStone` — a white-base `vertexColors` MeshStandardMaterial run through
  `addPropDetail(mat, true)` so the baked vColor folds into EMISSIVE (survives backlight
  against the pale storm horizon). Cool dark emissive floor `0x1a2228@0.30`, roughness 0.34
  (wet sheen), ENTIRELY BARE (no accent/gold). storm-teal `#2fd8e8` BANNED.
- `bakeTempestLadder(geo)` — the 4th ladder. Unlike Caldera's world-DOWN key, this keys each
  triangle's geometric normal against the **wind's own scour axis** `(0.8·windX, 0.5, 0.8·windZ)`
  (imported `TEMPEST_WIND` from biomes.js, normalized once). Stops: SCOUR `#8e9aa0` at high dot
  (wind-bitten faces) / DAMP `#4b545c` body / SOAKED `#232b31` at the low-y waterline belly.
  Zero triangle cost.
- `mergeTempestParts(parts)` — 2-group merge (mat 0 → tempestStone, mat 1 → accent[7]); forces
  non-indexed, bakes the ladder then `bakeAO`. stormprow uses only mat 0; the 2nd group is kept
  wired for the next family.

**The prop.** 6 offset-stacked box strata + 4 ledge/crest detail slabs = **120 tris**, ONE
material group, opaque. The lean is carried **entirely by lateral OFFSET** in build() — never
internal rotation (the (r,h,r) instance scale shears internal tilts flat). Windward edge steps IN
up the stack (the stepped dip-slope); leeward edge steps OUT + up (the down-wind overhang crest);
stratum 0 is narrow + recessed (the waterline UNDERCUT). All three storm-tells read.

**Gotchas that bit / were avoided.**
- **rotY randomizes in writeMatrix if place() omits it** (`d.rotY ?? (d.rotY = rnd()*π)`). A
  wind-keyed scour ladder is meaningless under random yaw — so stormprow **pins `rotY: 0`** so the
  local scour axis stays world-wind-aligned AND the diagonal reads broadside to the down-lane cam.
  ρ is measured as full radial extent regardless, so pinning costs nothing on clearance.
- **"lean AWAY from lane" = `tilt: side * -0.05`** (the sungate idiom): a positive Rz tips the top
  toward −x, so away-on-the-right needs the negative. Always numeric (missing tilt → NaN quat →
  invisible prop).
- place() draws a **constant 3 rnd()s** (r first, then x-jitter, then h); x couples to the measured
  ρ (≈0.515) → `x = side*(26 + 0.52·r + rnd()·5)`, inner edge **24.5** (mid-field hero, ≥14.5).

**Registration.** `tempestNew/tempestOld` A/B consts (the ONLY spawn gate is the archetype's
`biomes: tempestNew`); `FOAM_CFG.stormprow = {rx:0.55, rz:0.40}` (elliptical, wraps the wedge);
`SCOPE_BIOME += 7` in propclearance.mjs (now CI-enforced); `BIOMES[7].props=['stormprow']` (doc-only,
not consumed by runtime).

**Gates (all green).** propclearance --ci (inner 24.5, exit 0), gold-determinism (byte-identical),
biomecycle (12/0), envcount (opaque, FOAM present, budgets green), biome-7 boot (0 errors),
propfoam/proprun/propao all pass.

**What it unlocks.** The next 5 storm props drop in as `{mat:0} parts → mergeTempestParts()` with
zero new material work; the wind-scour ladder is the biome's carved read for the whole kit.
