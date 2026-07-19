# The Unmasked trailer uplift — feather banding, rachis shafts, the stage-2 nimbus (2026-07-19)

**What we did.** Track A #1 of BOSS-VISUAL-AUDIT (the highest trailer-ROI item): fixed the
three consensus findings on the Apex's stage-2 money frame without touching the owner-signed
wing SHAPE. (1) `angelWing.js` gained an opt-in **`valueBand`** bake — a root→tip vertex-color
ramp (×0.62→×1.18) along each element's dominant local axis, so every feather carries its own
gradient instead of one flat value (registry tell #12 "flat sails"); default 0 keeps the
winglab byte-identical. (2) An opt-in **`rachisMaterial`** draws a thin tapered gold quill-
shaft down the LEADING primaries only — a drawn line (tone-mapped MeshBasic, never blooms/
T7-safe) that etches the fan's structure in the dark. (3) The seraph's feather LADDER was
pulled ~15% darker and DE-BLUED (the slate tint read plastic), with `vertexColors` on so the
band multiplies in. (4) A **stage-2 nimbus** — the reserved gold corona as a faint halo ring
strictly behind every wing plane, breathing at a whisper, swelling with charge, FLARING on the
all-snap, yielding to the stage-3 halo as k3 rises. (5) Relics scaled ×1.4 in place (anchors/
count untouched — they are RECKONING lockParts).

**What we learned (the gotchas).**
- **A uniform ring is an onion ring even when it's "the halo."** The first nimbus used
  RingGeometry + flat opacity and read as a solid cream band with hard edges (registry tell
  #5), made worse by wing occlusion chopping it into arc shards. The fix is the corona's own
  idiom: 3 radial loops with vertex-color falloff (transparent → gold mid → transparent), so
  additive blending dissolves both edges and occlusion reads as light-behind-wings.
- **Drive additive vertex-color rings via `material.color` scalar, not `opacity`** — the
  corona precedent: color multiplies the falloff uniformly and doubles as the dimmer.
- **Vertex-band bakes must cover EVERY mesh in a merge bucket** — `collapseWingByMaterial`
  merges per material; one geometry without the color attribute nulls the whole merge.
- **`bossgate` on the Apex fails G1/G2/G3/G7 on MASTER too** — its per-def overrides were
  never finished for the CP2 stages, and the G7 bounding-sphere heuristic flags seven
  opacity-0-at-rest FX volumes (the L197 "bounding spheres can't tell fill area" limitation).
  Compare against a clean stash run before treating a gate FAIL as your regression.
- The karnvow-footwork boss.mjs assert is **flaky** (seeded but passes on re-run, untouched
  files) — re-run before diagnosing.

**What it unlocks.** `valueBand`/`rachisMaterial` are generic angelWing dials any future
winged boss can opt into; the 3-loop soft-ring kernel is the reusable "halo that isn't an
onion ring" pattern; the relic-readability scale-up is the template for the same fix the
audit prescribes on KARNVOW's trophies.
