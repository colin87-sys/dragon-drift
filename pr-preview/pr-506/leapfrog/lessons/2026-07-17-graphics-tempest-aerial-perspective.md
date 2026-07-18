# Aerial perspective for Tempest: migrate the Fable-75 prop-haze lever, cool the veil hue one step

**Context:** Deferred backlog item — the Tempest storm-carved props read FLAT (Fable pre-assess scored the
current prop-depth 2/5). The dual-fog pales the far SKY into the rain-veil, but the dark-slate props
(`0x4b545c`) don't participate: the mid-field arch spires (~100–260m, the money composition) sit at the SAME
near-black value as the 30m foreground, and because Tempest is the one biome whose far field goes LIGHTER,
prop-vs-sky contrast GROWS with distance — the inverse of nature. Textbook "sticker" flatness.

## The fix — no new system, migrate the proven one (coexist→prove→migrate)

The `propAerial` lever (Fable 75) already exists in `environment.js` (`addPropDetail`): distant props fade
toward `uPropAerialCol` over `smoothstep(55,230, vFogDepth)²`, in DIFFUSE (`mix …×0.50`) and EMISSIVE
(`+= …×0.40` — the term that actually shows, since these props are near-black diffuse under a dim storm sun).
`uPropAerial = 0` ⇒ byte-identical; the **Mire** proved it at `0.85` warm-ember. Migrating to Tempest is a
**two-value data change** in the biome block — no shader edits:

```js
propAerial: 0.55, propAerialColor: C(0x98948d),
```

### The two rulings that matter (Fable pre-assess)
1. **Strength 0.55, NOT the Mire's 0.85** — a LUMINANCE argument, not taste. The emissive add is `_aer×0.40×
   haze`, and Tempest's haze is ~2.3× the luminance of the Mire's dark ember `0x9c5a22`. Equal strength would
   over-lift and dissolve the silhouettes. At 0.55 the far-depth lift is ~0.22× haze emissive + 27.5% diffuse
   mix, while the quadratic ease holds the 90–200m drama zone at only 0.05–0.25 effective — silhouettes stay
   silhouettes, they just breathe air.
2. **Haze hue `0x98948d` = the veil cooled ONE step, not cool-grey and not full veil.** The crux: aerial haze
   is AIR (scattered skylight), not surface KEY light — so the storm's "no warm field light" theology firewall
   (which bans a warm sun on surfaces) does NOT apply; the haze inherits the veil's already-legal warmth
   (`fogFarColor 0xb3ac9c` was deliberately warmed to agree with the gold slot). A cool-grey haze would read as
   clear-day blue atmosphere and fight the warm veil (a new two-tone seam). Full-veil verbatim would fuse the
   props into the sky. So: veil mixed 25% toward the near-fog indigo `0x494c60` → `0x98948d` (one value step
   below the veil, warm-leaning neutral, chroma below the gold sockets so the rationed burn is untouched).
3. **Ramp 55→230 unchanged** — the 55m floor coincides with fog-near 55 (near hero props byte-untouched); the
   flat band is 80–260m which the ramp covers; beyond 230 the scene fog (→360) takes the handoff.

## Verification gotcha — pin the SEED for a prop-depth A/B, and even then the camera drifts

A headless before/after needs matched framing. **Two boots roll different level seeds** → totally different
prop layouts at the same warp distance (the confusing "same dist, different scene" tell). Fix: `?seed=<n>` on
both. But note the seed pins the LEVEL, not the boot's camera clock — heading/time-of-bob still drift between
boots, so a pixel-diff stays noisy (ROI luma jitters ±0.1 on the veil ratio). The mid-prop lift measured a
consistent but small +0.03–0.05 ratio; the effect is real and correct-direction but **on the conservative
side by design**. Judge it at device exposure (0.5× darken) and let the owner's device close it (the
authoritative gate) — headless renders ~1 stop bright and the framing jitter defeats a tight numeric gate.
Revision, if the owner wants a stronger read, is **scalar-only within 0.45–0.65** (hue + ramp are settled).

## Reusable
- **A depth-cue A/B needs a fixed `?seed`.** "Same distance, completely different scene" = unpinned RNG, not a
  bug. Even then, expect camera-clock drift; trust the device-exposure eye + owner over a noisy ROI stat.
- **Aerial haze is AIR, not key light** — it can legitimately carry the sky/veil's colour even inside a biome
  whose surface-light theology bans that hue. Tune the haze to the veil, cooled one value step so props recede
  INTO it without fusing, and keep its chroma under the biome's one rationed accent.
- The whole initiative was a 2-line data change on a lever proven in another biome. Building SYSTEMS (not
  one-offs) means the third biome that needs depth is a data edit, not a shader.
