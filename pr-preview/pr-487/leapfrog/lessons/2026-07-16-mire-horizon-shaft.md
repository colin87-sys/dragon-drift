# Mire: a faked volumetric horizon shaft — light that TRAVELS, not light that is placed

**What we did.** Fable's doc-73 §3.3: *"one faked shaft/glow column off the horizon would buy more premium
than any prop — light as a character."* Added a single sourceless warm glow-column off the Mire's ember
horizon, as ONE additive term in the sky-dome fragment (Fable-spec 90). Per-biome default-0 → every other
biome + all skins byte-identical.

**Mechanism: a sky-dome painted column, NOT a god-ray fan.** The two candidates:
- The screen-space god-ray pass (godrays.js) radiates from `uSunUv` — it is **sun-anchored by
  construction**; any visible fan re-draws the point source the Mire's "no sun / metabolic light" theology
  forbids.
- A term painted into the sky fragment is **sourceless by construction, world-locked, and placeable
  off-axis** — so it's the theology-safe choice. ~6 ALU in an existing shader, no new pass.

**The term (in the sky fragment, after the sun-glow add, before the surge-aurora bands):**
```glsl
if (uShaft > 0.001) {
  float _shAz = atan(sunDir.z, sunDir.x) + 0.62;    // OFF-center (~35.5° off the corridor axis)
  float _shDA = atan(sin(atan(d.z,d.x)-_shAz), cos(atan(d.z,d.x)-_shAz)) + 0.025*sin(time*0.07); // sway, never scroll
  float _shW = exp(-(_shDA*_shDA)/0.0256);          // gaussian column σ0.16 rad — no hard edge anywhere
  float _shV = smoothstep(0.42,0.02,h)*smoothstep(-0.02,0.03,d.y); // rooted at the waterline, dead by h=0.42
  col += vec3(1.0,0.66,0.36) * (_shW * _shV * (0.90+0.10*sin(time*0.13)) * 0.12 * uShaft);
}
```

**The theology is baked into the MATH, not a comment:**
- **Off-center** (`+0.62 rad`, screen-left third): a shaft on the vanishing point reads as a sun regardless
  of shape. Off-axis is non-negotiable.
- **Brightest at the ROOT, monotonic decay upward** (`smoothstep(0.42, 0.02, h)`): the Mire has no sun, so
  the light wells up FROM the bog — a floating bright core would be a sun. skyprobe's top-third luma law
  holds for free because the column is dead by h=0.42 (never climbs into the dark canopy sky).
- **Gaussian, no hard edge** (σ 0.16 rad, ~18° FWHM): the EYE-BREACH's `pow(s, 900)` tight world is exactly
  what we're NOT doing — a locatable edge = a source.
- **Breathes, never scrolls**: `0.90 + 0.10·sin(time·0.13)` intensity (~48 s) + `0.025·sin(time·0.07)`
  azimuth sway (~90 s). A marching shaft reads as a searchlight (a moving source = a breach); it leans, it
  never travels. The two periods are non-integer-ratio so the motion never phase-locks to metronome.

**Free wins from superposition (no interaction code):** motes + lanterns render OVER the sky dome, so
mid-field motes crossing the column read as *lit by it* automatically — that IS the "light the motes drift
in" effect. And the water samples the sky, so a faint warm reflection appears under the shaft for free — do
NOT add a bespoke reflection term (a doubled-intensity one would over-read).

**Determinism / motion clock.** The shaft moves off the shader's existing `time` uniform — NOT `Date.now`
/ `Math.random` (unavailable in this render path and determinism-hostile). Render-only, no spawn/RNG touch →
gold-determinism untouched.

**Verify.** appshell (sky shader compiles, no console errors), biomecycle 12/12, skyprobe 5/5 (top-third
luma law intact — the shaft stays in the ember band). In-Mire tier-0 cleanshot capture shows a warm glow
pocket off the LEFT horizon, brighter than the surrounding band, no disc — "the bog glows harder over there."

**What it unlocks.** A reusable per-biome `horizonShaft` sky channel — any biome can raise a sourceless
horizon glow-column by setting one value; the whole "light as a character" painterly lever with zero blast
radius on the other biomes.
