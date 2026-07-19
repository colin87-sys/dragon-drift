# THE EMPYREAN — RING COURT PROP REFERENCE (uplift PR-2)

Build spec for the two new prop families (the unspecced-prop slop rule: reference FIRST, then build).
Inherits every law of `EMPYREAN-PROP-REFERENCE.md` (shadowless omni-skylight, no directional value
split, bodies bone-nacre ~L74, rose hue ≥315° on lips/crowns only, S≤0.30, ≤150 tris/instance, ≤2 mat
groups, vertex-colour only, apex-spike law: ~13° cants, de-jittered rings).

## HALO SHARD — broken ring-arch segments (the EARLY-lane identity)
Real refs: broken marble torii/arch fragments, shattered halo iconography, eroded aqueduct stumps.
- **Silhouette:** an ARC SEGMENT of a great ring — 25–70° of sweep, lens cross-section (4.5–6:1, soft
  8–10-sided edges), ends BROKEN (2-facet fracture faces, never a clean saw cut). Some stand as gate
  posts (arc opening skyward), some lie half-buried (arc cresting the water like a spine).
- **Rose only on the FRACTURE LIPS** (the break faces' rim, hue ≥315°) — never the arc body.
- **Bedding:** one end buried deeper; base flare 1.1–1.3×; 2–6° off-plumb; per-instance sweep/yaw/
  radius jitter (never two identical arcs).
- **Tri budget:** tube-lathe 8 sides × 6–8 sweep stations ≈ 96–128 tris. Value ladder: crown-light →
  base-dip (tall register) via `_bakeRamp`.
- **MUST-PASS:** reads as a FRAGMENT of something once whole / broken ends / rose on lips only /
  bedded / no apex spike.

## SHARD SHRINE — low tiered crystalline clusters (the off-lane rest note)
Real refs: gypsum desert roses, tiered cairn shrines, calcite step clusters.
- **Silhouette:** 3–5 canted LOW blades (the sentinel grammar at ~0.25× height) packed in a tight
  rosette — each a different azimuth/lean, one dominant + rest stepped 0.6–0.8. WIDE + LOW (the
  vertical counterpart of the pearlshoal): height ≤ 2× width.
- **Low-prop ladder (INVERSE):** pale crest LIFT (emissive hi>1) + shallow seat — a dark base on a low
  prop prints a "dark chip" (PR-5 lesson). Park in the MID-FIELD, never the fog horizon.
- **Tri budget:** 5 blades × ~24 tris ≈ 120. Rose on the dominant blade's cut lip ONLY (court-level
  rose budget: one lip per cluster).
- **MUST-PASS:** long-low rosette / one dominant / no candy-dipped tips / seats into the water.

## STAGED IDENTITY (the interchangeability fix) + STONES OF LIGHT
- **Density weighting by lane band (seeded, deterministic):** EARLY third = halo shards dominant +
  sparse courts; MID = the existing stone courts dominant; LATE = dense shard-shrine field + ONE full
  ring gate (two paired halo shards forming a near-complete ring the lane threads) on the Mote
  approach. Early/mid/late must silhouette-differ at a glance.
- **Stones of light (existing monoliths):** hue ramp violet base → pearl body → rose crown (≥315°),
  ≥1.5px core-edge line on the lens rim, per-instance tip profiles (canted / twin-facet / sheared
  stump). Keep the gated crown-light→base-dip value ladder untouched.
- **Aerial haze:** `propAerial` channel on biome 5 — far props lighten + drift violet (the flat-avenue
  fix; doubles as a depth cue).

## GATE
Per prop: `_choirstudio.mjs` silhouette check first (form in isolation), then in-biome colour read.
Per PR: `_empyburst.mjs` full burst (early/mid/late MUST look different), dark budget ≤0.40, tier-2
portrait, Fable-model gate ≥4.2 with exclusion masks. Then the mid-plan independent re-score
(expect ≈7.0–7.5; <7.0 = stop and re-audit).
