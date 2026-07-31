# 2026-07-13 — Skyforged PR-4: the Phase Gate aperture frame (biome-skinned forged glass)

**Why.** The optional last piece of N17: extend the "Skyforged glass" language to the normal-course
**Phase Gate** — a gameplay-significant *fatal* hazard. Gate 1 pinned the scope to **Option B**:
upgrade ONLY the brightest layer (the aperture ring), leave the veil / outer rim / corner brackets /
beacon / motes byte-untouched. The "reads like UI furniture" critique that killed the old markers
lands specifically on the flat rectangular aperture bars; everything else already passes.

**Did.** Replaced the four flat aperture bars with ONE faceted forged-glass frame — a closed
rounded-rectangle sweep of a chisel cross-section, a hot inner LIP on the collider boundary, per
biome — behind the same `?skyforged=0` A/B. Six per-biome materials from `PHASE_SKINS`.

**Reusable patterns banked.**
- **Extending a shared marker material to a BIOME-SKINNED element:** build N per-biome factory
  instances (`gateFrameMats` parallel to `edgeMats`), **never cloned** (the r160 `Material.copy`
  JSON-kills-uniforms trap), palettes derived from the existing skin data. All N + the three markers
  share ONE program (`customProgramCacheKey`) — zero new variants. This is PR-3's "family via VALUE
  grammar, not hue" generalized: biome hues coexist because the family is the near-black body + the
  dark→mid→hot ramp + fresnel + facetJ + glint.
- **The pale-core wash (the bug the first montage caught):** apex must be a **BRIGHTENED EDGE**
  (biome hue lerped ~50% toward white), NOT `skin.core`. Several biome cores are near-white (Caldera
  peach, Frozen white); feeding that to the hot lip + glint washed the whole frame white and killed
  biome identity. Keeping the hot terms **hue-tinted** + dialing lip/glint back (0.9/0.5 → 0.6/0.35)
  lets the biome-hued MID carry the read. Verified in-engine: `uMid = <biome edge>`, `uApex = <light
  biome hue, not white>`.
- **A hazard's premium upgrade must PROTECT the danger read.** Menace is preserved *structurally*:
  the lane-spanning translucent veil (the "wall of energy"), the outer rim, and the corner brackets
  stay untouched, so the gate remains a 32m barrier you *thread*, not a free collectible you *chase*.
  Use an **angular chisel** cross-section (not gem-round), and **restraint on lip/glint IS the menace
  lever** — heavy sparkle reads "treasure". A collectible and a hazard must stay unconfusable.
- **The hot lip must land EXACTLY on the collider gap boundary** (visual opening ≤ gap, never >): a
  frame that *looks* passable but kills is the one unforgivable regression. Offset the sweep centreline
  OUTWARD by the in-plane inward radius so the lip (glowT=1) returns precisely to the boundary; the
  hot rim then IS the safe-route outline — the affordance gets stronger, not weaker.
- **Separate driver:** a new shared `gateFlowRef` ← `speedNorm`, NEVER `markerFlow` (the flow-run
  slip) — the per-role-driver rule from PR-1, in reverse.
- **Disposal:** `removeAt` disposes ALL per-gate geometry via `traverse` + only `perInstance`
  materials → the shared biome frame mats survive, the per-gate frame *geometry* is freed. Do NOT mark
  the shared mats `perInstance`.
- **Render-only:** the frame derives from `o.gap*` only + `facetHash(index)` — colliders/gameplay read
  the entry fields, never the mesh. `gold-determinism` byte-identical; 4 aperture draws → 1.

**Gotcha (the real one).** The forced `?canyon=flow` / normal-run harness **cannot cleanly isolate a
specific-biome Phase Gate** in a montage — setpiece gateways, reward rings, and reticle frames overlap
it, and hiding "small siblings" still leaves large setpieces. Judging the frame from pixels was
intractable; the reliable check was to **dump the frame mesh's material uniforms in-engine**
(`uMid`/`uApex`/`transparent`/attrs) and confirm correctness there. **Build a proper "marker showroom"
scene** (one clean marker/gate against a plain backdrop, per biome) — deferred since PR-2 Gate-2 and
now clearly the next tooling investment; every gate has paid the clutter tax.

**Leapfrog.** All FOUR Skyforged surfaces — Windvault gate, Star Shard orb, Jade Annulus ring, and the
Phase Gate aperture frame — now ride ONE shared `markerSurface` spine and ONE shader program, each
`?skyforged=0`-gated (byte-identical off) and determinism byte-identical. **The N17 marker-language
work is complete.** The standing follow-up is the showroom scene (for cleaner future look-judging) and
the owner's live-preview sign-off on motion (glint sparkle, gate flow-front, hazard-vs-reward read).
Verify: `tests/markers.mjs` 60/60 (incl. a live-WebGL Phase-Gate-frame check), `gold-determinism`
byte-identical, `canyonframe`/`canyonboot` green.
