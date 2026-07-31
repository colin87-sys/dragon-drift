# 2026-07-18 — SUNBREAK I1: world-suppression grade (kill the magenta wash)

**Did / learned.** Replaced Dragon Surge's full-screen MAGENTA additive screen-wash with a
screen-space WORLD-SUPPRESSION grade (§C.2): on Surge the world steps DOWN one value band so
the dragon reads as the light source (the 3D gacha cut-in), instead of the wash RAISING the
world's luminance toward the effect colour and destroying the CORE:DARK contrast. Fresh Fable
critic: **PASS 4.4/5, converged in one revise round.** The build that made it land:

1. **Subtractive-only + split-toned, not a filter.** The grade never brightens a world pixel:
   desaturate the world toward luminance, step it down (vignette-weighted), and pool the
   dragon's DARK band (`surgeDark`) in the SHADOWS *at constant luminance* while HIGHLIGHTS
   stay near-neutral. The one failure mode a passing set of numbers can still hit is the
   **uniform amber/violet FILTER** (one flat tint over the whole frame) — the guard is a
   **(1−luma)² shadow weight** so the colour STATEMENT lives in the deep darks (premium
   signature), not smeared over highlights (filter signature). First attempt used a plain
   shadows/highlights split at mix 0.6 and the violet read as green-black murk at gameplay
   distance; (1−luma)² + a stronger mix + a more-saturated `surgeDark` flipped the shadow
   channel ordering to true B>R>G eclipse-violet.
2. **A suppressed sky must still read as a SKY.** Uniformly desaturating+darkening flattened
   the sky to one sepia field (the single most filter-like region). Fix: **spare the BRIGHT
   band (luma ≳0.48)** so the horizon glow / brightest band survives and sits behind the
   subject — the sky keeps its dark-zenith → warm-horizon → dark-water gradient. "The sun
   went behind the dragon," not "someone put a filter on."
3. **Exposure dip goes through the ONE `toneMappingExposure` write, not a grade uniform**
   (§M.1-4). −0.4 EV composed into `main.js`'s single exposure line survives at tier 2 where
   the grading pass is absent (the weak-mobile read depends on it). Desat/vignette/tint go
   through the grading shader.
4. **`surgeDark` is a NEW per-dragon field with a wash-hue fallback** (§M.1-7): explicit for
   the eclipse hero; `null` derives the dark band from the dragon's `feverWash` crushed to
   L≈0.14, so the darkness always carries identity, never neutral grey. The magenta sky-shift
   + aurora curtains are warm-gated (× `_fw`/`feverWarm`) — retired for the default/eclipse
   palette, preserved for fire/Mire/heaven. Decision logged: **sky stays biome-hued during
   Surge; suppression is a screen-space grade, not a sky repaint.**
5. **Dragon leads, world follows** (§I-6): the grade envelope has a ~120ms delayed onset +
   ~0.9s ramp, so at +250ms the world is barely touched (≤0.15) while the dragon has already
   ignited. Verified as a trace (§M.1-10), not a frame sequence.

**Gotcha (capture harness — the critic caught it).** `surgemeasure.mjs` wrote fixed filenames,
so a second run (phoenix) silently CLOBBERED the first (solar) evidence — I handed the critic
two byte-identical "proof" frames and it correctly refused to certify the violet split-tone or
the warm override it never actually saw. **Any capture/measure tool that runs per-subject MUST
namespace its output files by subject** (`/tmp/measure-<key>-<beat>.png`), and the critic should
hash-check its evidence set before judging. A broken evidence set reads as a craft failure.

**→ Systematize.** The value-structure law now has a concrete screen-space recipe: **spare the
brights (subject + sky highlights), desaturate + step down the world, pool identity hue in the
(1−luma)² darks, dip exposure at the single write.** This is reusable for any "hero becomes the
light source" moment (a future ultimate, a boss unveil, a death grade) — it's hue-agnostic
(violet for the eclipse king, warm for the phoenix, both from one `surgeDark` field). The
per-subject-filename rule is a permanent capture-harness invariant. `tools/surgemeasure.mjs`
(CORE:DARK ratio, world-drop, split-tone channel ordering, no-magenta, envelope trace) is the
machine judge every later increment can rerun.

**→ Leapfrog.** The stage is set: the one dark thing left in the solar surge frame is the
un-ignited dragon itself — exactly I2's job. Because the world already receded, I2's anatomical
ignition cascade (eyes→spine→wings→rim emissive) only has to ADD light to a dark stage, not
fight a bright one, so the "brightest thing in frame" read is nearly free once the dragon lights.
I2 must ADD to the eclipse composition, never re-grade it (the critic's protect-list).
