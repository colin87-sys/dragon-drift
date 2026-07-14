# 2026-07-13 — Flow-tube PR-4a: the Sky Gate (making a flow gate read as a distinct place)

**Why.** Owner flew the flow run (carve + momentum shipped) and said *"the rings all read
like rings, so not sure if certain ones do different things."* Diagnosis (Fable design pass,
verified in code): the flow gate was built from the **reward-ring + Phase-Gate vocabulary**
and so could not read as new — a torus of `ringRadius+1.6` concentric on the green reward
ring (a ring on a ring), 4 corner brackets copied verbatim from the Phase Gate's viewfinder
cue, on the shared biome-tinted `edgeMats[bi]` material, static. Same shape, same details,
same material, same non-motion → "just a ring."

**Did — the Sky Gate.** A new visual grammar with three legs: a **fixed signature palette**,
a **non-ring silhouette**, and **motion synced to the mode's heartbeat**.
- **Silhouette:** twin light-POSTS flanking the ring (`gapX ± 7.5`, clamped inside the lane)
  + a chevron ROOF pointing DOWN at the ring ("fly here") + a counter-rotating dashed HALO
  around the reward ring + an apex GEM. Reads as a *gateway you pass through* (~15×14m),
  not a pickup — and the posts read edge-on from any approach angle (a torus nearly vanishes
  edge-on, which is why the old gate died off-axis). The green reward ring survives untouched
  as the bullseye nested inside: one two-tone object (cyan gate = the place, green = the catch).
- **Signature palette:** new SHARED `flowEdgeMat` (0x59d8ff cyan) + `flowCoreMat` (0xd6f4ff
  ice-white), FIXED in every biome (never `edgeMats[bi]`) — recognizability was the whole
  complaint, so the gate must NOT wear the biome's gate color. Unifies with the already-cyan
  ribbon orbs → "flow = cyan light." Opaque emissive (`makeEdgeMat`) → blooms, overdraw-free.
- **Heartbeat:** the shared flow materials' `emissiveIntensity` scales with `slipMix` (the
  normalized chain slipstream) in `updateObstacles` — **the whole run's light brightens as
  your chain climbs.** One shared-material write/frame carries both the identity AND the PR-3
  momentum feedback. `slipMix` is now passed into `updateObstacles` (it was already computed
  in main.js for the speed FX).
- **Perf:** 9 unmerged meshes/gate → ~4 (posts+chevron merged via `mergeGeometries`, gem,
  halo). Per-gate cosmetic jitter uses the seeded per-segment `rng`, never `Math.random()`.
- Entry burst recolored slip-cyan for flow (rock/spine keep the bone puff).

**Gotchas.**
- **A shared material makes the whole run pulse as one.** That's the *goal* here (the run
  breathes with the chain), but it means you can't vary a single gate's brightness without a
  per-instance material — fine, the collective breath IS the identity.
- **Dropped the mouth beacon for now.** The `spireFades` fade path (built for opaque
  sea-stacks: opacity 0.35 near → 1.0 far) makes an ADDITIVE plane far too bright in-your-face
  near the player. A beacon needs its own fade (bright-capped far → 0 near); not worth a
  bespoke path for PR-4a — the posts/chevron/gem carry the far-field read. Add later if the
  preview wants more horizon telegraph.
- Determinism-free by construction: all render-side in `obstacles.js` from segment fields;
  `e.boxes` stays EMPTY (`flowColliderBoxes()===0` holds), `gold-determinism` byte-identical.

**Leapfrog.** PR-4a ships ALONE so the owner judges "does a flow gate read as a different
kind of place at a glance?" on `?flowrun`. If yes → PR-4b (the carve-LINE as the hero:
a thin additive `LineSegments` stroke through the sky, exempt from the overdraw cliff), PR-4c
(apex pylons + graze + mote sleeve), PR-4d (the persistent `FLOW ×N.N` meter, cloning the
boss graze-HUD widget). The standing pattern: **to make a set-piece read as NEW, change the
vocabulary on all three axes — palette + silhouette + motion — not just one.**
