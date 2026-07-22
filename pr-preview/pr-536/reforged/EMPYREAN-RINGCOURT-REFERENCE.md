# THE EMPYREAN — RING COURT PROP REFERENCE (uplift PR-2) · Fable-audited (REVISE-FIRST → all 8 applied)

Build spec for the two new prop families (reference FIRST, then build). Inherits every law of
`EMPYREAN-PROP-REFERENCE.md` (shadowless omni-skylight, no directional value split, bodies bone-nacre
~L74, rose hue ≥315° on lips/crowns only, S≤0.30, ≤150 tris/instance, ≤2 mat groups, vertex-colour
only) with the PR-5-lesson apex numbers (~13° cants, de-jittered top rings).

## HALO SHARD — broken ring-arc segments (the EARLY-lane identity)
Real refs: broken marble torii/arch fragments, shattered halo iconography, eroded aqueduct stumps.
- **Silhouette:** an ARC SEGMENT of a great ring, lens cross-section (4.5–6:1, soft 8–10 sides), ends
  BROKEN (2-facet fracture faces, never a saw cut). **STANDING instances: sweep ≥55°** (audit fix 2 —
  at 25–40° a standing arc is a leaning blade, i.e. a sentinel clone; the curvature must read against
  sky at 80m in `_choirstudio` fog). LYING half-buried instances: 40–70° cresting the water.
- **Rose budget (fixes 2+5): ONE fracture lip per instance, max.** Standing posts put it on the
  LOW/BURIED-end lip so the crown zone stays rose-free (≠ the rose-tipped sentinels at a glance).
  Band-level: the early band's total rose pixel load must land ≈ the mid band's (audit the tri-panel).
- **Lying-arc distinctness (fix 3):** ≥25m from any pearlshoal cluster; the visible chord reads
  markedly SLIMMER + higher-peaked (height:length ≥ 1:2.5) than the loaf's 3.5:1 — and the pair joins
  the `_empyburst` must-look-different check. Up-facing shell: run the top-plan WINDING check.
- **Bedding:** one end buried deeper; base flare 1.1–1.3×; 2–6° off-plumb; per-instance sweep/yaw/
  radius jitter. **Tri budget:** tube-lathe 8 sides × 6–8 stations + 2 fracture caps + flare ≈ ≤148 —
  verify with `tricount`, don't trust the arithmetic (audit risk note).
- **MUST-PASS:** fragment-of-a-whole / broken ends / rose on ONE lip only / bedded / curvature ≠ blade.

## THE RING GATE (late band; its OWN spec — fix 1)
Two PAIRED gate POSTS, **each its own ≤150-tri instance**, each sweep **110–140°** (two 25–70° shards
can never close a ring — the audit's structural catch), 8 sides × 12–13 stations so the long arc
doesn't chord-facet. Together they form a broken ring the lane threads:
- **Aperture: inner clear radius ≥18** so `propclearance` still reads ≥16 after lean/sweep margin.
- **Mote sightline: the ring FRAMES the Mote, never occludes it** — the gap between the two crests is
  centred on the Mote bearing and the crest tops stay BELOW the disc's elevation band; the Mote keeps
  the darkest pixel (dark budget ≤0.40 re-measured at the late tile).
- Rose: one lip on ONE post only (the other stays bare — asymmetry, not gates-of-heaven kitsch).

## SHARD SHRINE — low tiered crystalline clusters (the off-lane rest note)
Real refs: gypsum desert roses, tiered cairn shrines, calcite step clusters.
- **Silhouette:** 3–5 canted LOW blades (sentinel grammar at ~0.25× height) in a tight rosette — one
  dominant + rest stepped 0.6–0.8, each a different azimuth/lean. WIDE + LOW: height ≤ 2× width.
- **Station allocation (fix 6): ~24 tris/blade buys 3 stations — the buried SKIRT station and the
  crown-start pulled to ~y0.90 (rose = thin lip) are MANDATORY; drop the mid rings.** De-jittered top.
- **Low-prop ladder (INVERSE):** pale crest LIFT with **emissive hi ≤1.15 and crest L strictly below
  the local sky value** (fix 4 — uncapped lift = a glow tell) + shallow seat.
- **Placement (fix 8a):** "MID-FIELD" is CAMERA READ RANGE (<~80m), "LATE" is the LANE BAND — in the
  late band, shrine density falls off with distance-from-camera so no shrine parks on the fog horizon.
- Rose: one lip per cluster (the dominant blade only). **MUST-PASS:** long-low rosette / one dominant /
  no candy tips / seats into the water.

## STAGED IDENTITY + STONES OF LIGHT
- **Density weighting by lane band — deterministic via the POSITION-HASHED pattern** (fix 8b): weight
  archetype pick by `hash(tileIndex, band)` on the existing placement stream; NEVER band-conditional
  rejection on the shared RNG (shifts every downstream draw → gold-determinism fails).
  EARLY third = halo shards dominant + sparse courts; MID = stone courts dominant; LATE = shrine field
  (density-falloff above) + THE RING GATE on the Mote approach. Early/mid/late must silhouette-differ
  at a glance — **gate the early/mid/late tri-panel BEFORE the roster ships** (audit risk note).
- **Stones of light (existing monoliths):** hue ramp violet base → pearl body → rose crown (≥315°);
  per-instance tip profiles (canted / twin-facet / sheared stump); **the core-edge line (fix 7) is a
  CROWN-LIP SEGMENT only — never the full lens silhouette (the chrome-outline tell) — ≥1.5px measured
  on the tier-2 PORTRAIT render, value ≤ +12L over body, same hue family.** Keep the shipped
  crown-light→base-dip value ladder untouched.
- **Aerial haze:** `propAerial` on biome 5 — far props lighten + drift violet.

## GATE
Per prop: `_choirstudio.mjs` silhouette first (standing shard vs sentinel + lying shard vs pearlshoal
side-by-sides), then in-biome. Per PR: `_empyburst.mjs` full burst (early/mid/late tri-panel must
differ), dark budget ≤0.40 incl. the late tile, tier-2 portrait, propclearance (ring-gate ρ coupled to
`place().x`), tricount, Fable-model gate ≥4.2. Then the mid-plan independent re-score (expect
≈7.0–7.5; <7.0 = stop and re-audit).
