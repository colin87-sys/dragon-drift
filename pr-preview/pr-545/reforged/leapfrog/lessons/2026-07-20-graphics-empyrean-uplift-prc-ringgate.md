# EMPYREAN uplift PR-C — RING GATE FINALE + FLANKS + SEAM (1 round) · and the biomeLength ambush

**What shipped:** THE RING GATE (a broken pearl ring the lane flies through — two ~116° posts, 144
tris, aperture ~0.9·r≥18 flight-clean, rose on one horn, phase-locked via `gateEvent` to ONE ~120m
window at t≈0.88); `farShard` distant flank silhouettes (the arch kit re-instanced far off-lane —
propAerial does the whisper-contrast fade for free); the horizon SEAM (a thin rose-ward hue band at
the water-sky line). Gate: **4.3 PASS, first round** — "the disc reads as the target through the
aperture; nested rings read as ceremonial colonnade theatre."

**THE AMBUSH: `CONFIG.biomeLength` is 1500, not ~3600.** Every capture distance was chosen assuming
the larger figure — so the "late" shot (dist 3200 → local 200) had been sampling the EARLY band for
the entire uplift, and no frame had ever contained the ring-gate window. All the staging gates judged
real differences (congregation phases), but the LABELS lied. **Anything keyed to biome-local progress
(laneBand, gateEvent, capture distances) must derive from CONFIG.biomeLength, never a remembered
number** — and a capture rig that claims to sample a band should print the band (`local`, `t`) next to
the filename so a mismatch is visible in the log, not discovered by archaeology.

**One-per-cycle events are trivial in the comp branch:** `gateEvent` = park unless
`|local − 0.88·L| ≤ 60` — a pure dist function, no RNG, no state; with step 127 the window admits
~1 slot per side, and the resulting 2–3 nested rings read as approach theatre (the critic's call —
an "exactly one" spec can be worth relaxing when the overshoot composes better than the spec).

**Whisper-polish backlog (sub-threshold, logged):** late-band left-limb crossing at similar depth;
cruise right flank could take one more far silhouette; seam saturation a touch above hue-only in the
gate frame; plus PR-B's stump-cap feather + mid-range dapple.
