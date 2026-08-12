# THE UNVEILED HEAVEN — holy architecture (H1 colonnade + H2 rose-window): gated GEOMETRY on the value-space arena spine

**What we did.** The owner played the S3 heaven and called it "plain and boring… there should be
stuff in the background and sides." Shipped the geometry answer in a new module
`reforged/js/arenaSet.js` (the H0 gilded cloudscape was the value-space half): **H1** — a
rhythmic colonnade of 24 gilded light-pillars lining both lane sides (ONE `InstancedMesh`,
strictly even 22m z-meter, jitter only in x/height off a **private** `mulberry32(0x5e7a9c1)`
stream, `|x|` 19–28 so they can never enter the ±13 kill wall or the corridor probe), and **H2**
— one vast rose-window / great-halo mandala (3 concentric soft ring bands + 8 broad spoke lobes,
R 120 @ 260m) parked behind the seraph on the horizon axis, breathing (scale ±2%, brightness
swell), never spinning (§3 stillness). Both use the seraph's own additive vocabulary (vertex-colour
falloff to BLACK on every edge, `MeshBasicMaterial` additive, `toneMapped=false`,
`depthWrite=false`, `fog=false`) — no textures, no hard rims (a hard rim = a Voidmaw portal).
2 draw calls, ~1.5k tris (24 × 16-tri cards + 3 × 384-tri ring bands).

**The stable-room anchor beats band-recycling for arena furniture.** The fight is a stable room —
the boss holds `settleGap` ahead while the world scrolls. The set therefore FOLLOWS the player
(`group.position.z = -playerDist` each frame, one write), exactly like the boss anchor and unlike
the recycled biome prop bands: no recycle loop, no per-instance churn, no reseed path. For
geometry that only exists inside a fight, the boss-anchor idiom is ~15 lines where the band idiom
is ~100, and it can't drift over biome seams because it never consults them.

**Gating = the arenaPropsGate recipe, inverted.** Everything derives per-frame from the STATELESS
`bossArenaMix()`/`bossArenaFade()` already threaded into `updateEnvironment`: engage
`k = smoothstep(1.45→1.85, mix) × fade` — so the set exists ONLY in the heaven window (the void
keeps its austere emptiness — deliberate: the S2 emptiness is the inhale that makes S3 land), the
natural-kill exhale dissolves it with the sky, and any teardown self-heals within one frame with
ZERO per-frame writes at mix 0 (one hide-write on the falling edge, then early-return).
Tier-degrade: `setArenaSetQuality` (wired in `applyQuality`) hides the whole set at tier 2 —
the palette + god-ray swell carry the heaven on weak mobile (the god-ray precedent). Debug seam
`debugArenaSet()` rides `bossArenaState().arenaSet`; 6 new asserts in `tests/unmaskedarena.mjs`
(hidden at mix 0 / hidden in the VOID / engaged in the heaven / hidden after exhale + teardown).

**Gotcha 1 — big additive scenery must live on LAYER 1 or it punches holes in the god-rays.** The
god-ray occlusion pass paints every layer-0 object BLACK with `scene.overrideMaterial` — a vast
additive ring would have become a vast ray-blocking silhouette across the whole sky exactly when
the heaven's swell is at max. `mesh.layers.set(1)` (the established trail/sprite convention) keeps
it out of the mask AND out of the water mirror for free.

**Gotcha 2 — the boss is the scale ruler, not the disc.** Sized "to frame the boss disc" (R 4.7),
the first rose-window (R 62) vanished entirely behind the seraph's ~±22u wing cards; at R 150 it
left the frame and read as haze. The read landed at R 120: crest clearly inside the top of frame,
side arcs beyond the wingtips. Size arena landmarks against the boss's SILHOUETTE ENVELOPE on
screen (wing span at fight rel), never against its core geometry.

**Gotcha 3 — chase the fairness probe's TAIL, not your own pixels.** The sky-band gate
(p95 ≤ 0.90) read 0.899 and neither tempering the H0 clouds (0.30→0.24) nor dimming the set moved
it. An 8-sample A/B with the set's gains ZEROED settled it: max p95 0.901 without the set vs 0.899
with it — the tail is the fight's own god-ray swell + bullet cores + cloud highlights, noise band
±0.01, and the set's true contribution is ~+0.005 mean / ~0 at max (its crest rides ABOVE the
probe band by design; a vertical fade dims the ring's lower half where it would stack on the
sun-glow). **Before spending identity (dimming authored art) to appease a screenshot-percentile
gate, A/B the gate with your feature zeroed on the same build — single-sample luminance gates on a
live fight are noisy, and you may be tuning against bullets.** Shipped: corridor p90 0.695–0.704,
sky p95 0.891–0.899 across runs (gate 0.75 / 0.90), clouds settled at 0.27.

**Verify.** `unmaskedarena` 41 (×2 runs) · `boss` 126 · `bulletcontrast` · `unmaskedorgans` ·
`skyclouds` 24 · `smoke` — all green; tier-2 heaven probed headless (set stays hidden); mix-0
control screenshot proves the world is untouched off-arena.

**What it unlocks.** The heaven now has its full court — H0 cloudscape (value), H1 colonnade + H2
great halo (geometry) — and `arenaSet.js` is the proven slot for any FUTURE arena furniture (the
void's deferred "Blanks" can ride the same build-once/stateless-gate/layer-1/private-seed spine
with a mix<1 window). Remaining heaven polish is owner-eye iteration on gains/placement, not
architecture.
