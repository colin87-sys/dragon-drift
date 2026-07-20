# Tempest premium rain — a 5-layer device-safe storm-rain system + the veil-profile gate trick

**What we did.** Took Tempest Reach's rain from "working-but-simple" (flat 2.4/5) to a premium
5-layer storm-rain system that cleared Fable's 4.2 gate at **4.3/5 in one revise round**. Every
layer uses primitives that clip cleanly on real GPUs (the billboarded-quad rain blanked real
devices — see the earlier black-screen lesson), so nothing here can reintroduce that failure.

## The system (all device-safe — LineSegments + Points + terms in shaders that already render)

- **F — Far veil:** soft rain-veil curtains authored as a term in the **sky-dome fragment shader**
  (2-octave 1D value-noise on azimuth, scrolled along the wind, gapped into discrete shafts, thinned
  toward the breach azimuth per comp-law 6, pinned to `fogFarColor`). New uniforms `uRainVeil/
  uRainVeilScroll/uRainVeilFlash`, all 0 = byte-identical. **This was ~half the score** — distant
  weather hanging between the planes is what says "inside a storm."
- **G — Gust clock:** `rainGustAt(t)` in rain.js — ONE erratic pure-function-of-time envelope
  (long calms, short bursts, uneven rests; no sine, no `Math.random`) **shared** by the veil, the
  streaks, the mist and the sea splash-rings. Sharing one clock is what makes the storm read as one
  system. The gust SHEETS along the wind (each streak's response phased by its wind-projected
  position over ~40m) so a front sweeps through instead of the field pulsing in unison.
- **N — Near body:** GL lines are 1px at every distance, so the ONLY way to read "thick/close" is
  parallel lines — the closest 72 streaks get a bright core + two dim flanking lines (core→dim-flank
  →bg = 3 value zones). Radius-tiered into 3 depth planes; per-streak angle jitter kills the comb.
- **V — Value flip:** streaks coloured by elevation — pale over the dark deck (light/dark), DARK
  slate over the pale horizon slot (dark/light — the painter's rule), pale-dim over the sea; a warm
  backlit LEAK in the sun quadrant. Recomputed on recycle only (near-free). Dark-on-pale needs more
  alpha than pale-on-dark to survive a 1px line (per-class alpha multiplier).
- **P — Mist:** suspended-spray `THREE.Points` with a runtime radial-falloff `DataTexture` sprite
  (no asset, kills the square-point tell), clamped BELOW the horizon (spray above the horizon reads
  as a starfield — a cheap tell).
- **X — Flash reveal:** `setRainFlash()` + `uRainVeilFlash` wired but inert (0) until the lightning
  hazard drives them — a bolt will make the whole rain volume exist for ~250ms.

## Reusable gate trick — the DETRENDED AZIMUTH-LUMINANCE PROFILE

Gating a **low-amplitude shader layer** (a 4–8% veil) through lossy downscaled software-GL captures
is unreliable by eye — the first build tuned three layers *below the capture noise floor* and
looked "done" while being invisible. What made round 2 decisive: capture the layer in **isolation**
(a temp `?veilonly` flag that hid the streaks/mist but kept the veil), then **measure the azimuth
luminance profile with the vertical gradient detrended** — the local standard deviation across
azimuth is the curtain contrast, separated from the sky's vertical gradient. That turned "I think I
see curtains" into "sd 3.4–4.3% of band luminance, in-spec." Use this to gate any subtle shader
band (veils, sheens, dithers, god-ray haze) instead of trusting the eye through a lossy capture.

## Process notes (worked)

- **Spec-first, one revise round.** Fable specced the 5 layers with numbers; the build applied them;
  round 1 (3.4) was purely "tuned below the noise floor"; round 2 applied Fable's exact numeric
  deltas and hit 4.3. The AAA-PIPELINE claim — a spec-first build lands each gate in ~one round —
  held here.
- **Suppress gameplay VFX in gate captures.** `?cleanshot` hides course rings, but golden-ember
  pickup bursts still contaminate mid-frame; they're exempt but they cost the critic a clean read.
  Worth a capture path that suppresses pickups for FX gating.
- **Real-device is still the gate of record** for the temporal reads a still can't show: the
  gust-front sweep, the splash-ring/gust coupling, and the final awe call. Fable ships the still-gate;
  the owner ships the motion.
