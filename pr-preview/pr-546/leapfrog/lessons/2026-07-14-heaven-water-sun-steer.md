# Heaven water — steer the specular sun to the blast, not the biome sun

**What we did.** Owner on the arena preview: the gold light reflecting in the sea "looks weird — the light
isn't on the left, it should be coming from the main cross region further to the right." Correct read: the
heaven's "sea answers the blast" gold column was sitting LEFT of the centered detonation.

**Root cause — a derived light direction that a special encounter forgot to override.** The heaven arena
already re-tints the water's `sunColor` warm (via `setWaterTint`) so the specular reads gold. But the specular
*position* is driven by a SEPARATE uniform, `sunDir`, which was set ONCE at build from the biome
`SUN_DIR = (-0.22, 0.1, -1)` — a sun that points LEFT and low. The detonation, by contrast, sits world-centered
(x 0) and high (crest y≈100, STAR_DIST 420 → ~13° elevation). So the column keyed off the biome sun's azimuth,
not the blast's. Colour was overridden; DIRECTION was not.

**The lesson — when a special encounter replaces the scene's light, override every DERIVED product of that
light, not just the obvious one.** The heaven swaps the light source (biome sun → central detonation). We'd
updated `sunColor` (the colour of the glint) but not `sunDir` (its position), because they're different
uniforms feeding the same highlight. Any analytic specular / god-ray origin / lens-flare anchor / rim-light
direction that reads a scene-sun value must be re-pointed too, or you get a hotspot in the colour of the new
light at the position of the old one — which is exactly what "the reflection is on the wrong side" is.

**The fix.** In `updateWater`, lerp `sunDir` from the biome `SUN_DIR` toward a heaven target
`HEAVEN_SUN_DIR = normalize(0, 0.2, -1)` (centered azimuth, blast elevation) by
`heavenSunK = clamp(arenaMix − 1) × clamp(arenaFade)` — 0 off-heaven (so `sunDir === SUN_DIR`, byte-identical,
no biome regression), ramping to fully-centered across the heaven unveiling (mix 1→2), and released on
teardown via the fade. One `.copy().lerp().normalize()` per frame; no new uniform, no mirror change (this is
the ANALYTIC specular `H = normalize(sunDir + V)`, not the Reflector), no geometry.

**Verify.** smoke + bossboot zero-error; off-heaven byte-identical by construction (weight 0). `unmaskedarena`
untouched (no placement/probe change — this only moves an analytic highlight's azimuth). Owner judges the
column alignment on the real GPU; if it wants to sit slightly right-of-centre (the player flies left-of-centre,
so the world-centered blast reads right), nudge `HEAVEN_SUN_DIR.x` positive — a one-number dial. Elevation 0.2
points at the blast crest; lower it toward the biome 0.1 if the column should run further down toward the camera.
