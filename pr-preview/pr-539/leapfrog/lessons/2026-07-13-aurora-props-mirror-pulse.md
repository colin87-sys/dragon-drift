# 2026-07-13 — Aurora PR-3: the biome's own LOW ice props + mirror + ground-glow pulse

**Why.** BIOMES[6] existed but borrowed the flow-run's generic props. To make the WORLD match the sky,
the biome needs its own props — and the design law is **the sky owns the frame**, so they must be LOW and
FLAT (the deliberate OPPOSITE of Frozen Reach's tall ice spires), seen mostly as dark silhouettes + their
reflections in the mirror sea.

**Did.** Two new archetypes `floe` (flat tabular ice pan, h 1.3–2.5 / r 5–11 WIDE) + `iceFang` (low shard
cluster, height CAPPED 2.2–4.6 world vs crystal's 18–50), the 7th `makeMats()` primary/accent (dark
sea-ice silhouette + a low-emissive aurora-caught edge — scenery, not a lamp), FOAM_CFG collars, a hemi
ground-glow **pulse** (the world faintly answers the curtain), and a tier2 water **aurora sheen** (the
cheap analytic reflection had no mirror → weak devices lost the money shot).

**Reusable patterns banked.**
- **Encode the biome's design law as NUMBERS, not adjectives.** "Low and flat" is enforceable: `iceFang`
  height 2.2–4.6 vs `crystal` 18–50, `floe` r 5–11 (wide) vs h 1.3–2.5 (flat). The Fable spec even named
  the verify shot — a biome-6 frame beside a Frozen frame, "no Frozen-at-night read" — as a numeric check
  (tallest prop ≤ ~5u). A law you can grep/measure survives future edits; "make it low" doesn't.
- **The waterline is in NORMALIZED space and MOVES with `h`.** A tempting "waterline apron" accent at
  normalized y≈0.1 submerges at small `h` (props sink 0.5u, so the real waterline is 0.5/h ≈ 0.2–0.38).
  The right waterline cue is the FOAM COLLAR (world-space) + a deck-edge sliver placed high enough
  (y 0.58) to clear the water at min `h` — that sliver is what doubles in the reflection.
- **Append new archetypes at the TAIL of the registry.** `makeBand` consumes the env rnd stream in key
  order, so appending keeps every existing biome's initial prop jitter byte-identical (mid-run recycle
  interleaving still reshuffles visual jitter — legal, visual-only; the env stream is separate from course
  gen so gold-determinism is untouched regardless).
- **A premium mirror is RESTRAINT, not a boosted reflection.** Fable's water audit was mostly "don't
  touch it": keep waveAmp 0.2 (the residual ±0.02 UV shimmer IS the "still water" tell — a dead-flat
  mirror reads fake and kills the moon-glint lane), keep the fresnel grade (boosting down-angle reflection
  is exactly the muddy-puddle look), keep the half-rate mirror (a ~0-parallax time-driven curtain doesn't
  need 60Hz). The ONE real gap was tier2's analytic path having no aurora at all — a 1-line green
  horizonward sheen (`uAuroraGlow`, 0 elsewhere) fixes the weakest devices for free.
- **Pulse the ground light in COLOR space, never intensity.** `hemi.intensity` is OWNED by the sky-probe
  toggle (0.8 shipped / 0.28 fill) — a per-frame intensity write would fight it. A HemisphereLight's
  output scales with color luminance anyway, so `hemi.color.lerp(green, mix*breath)` IS the intensity
  pulse, and it composes with the probe. Keep it a WHISPER (±4–6% quiet) with a rose creep only during
  eruptions; the ground answering the sky is the "wow" payoff, gated `mix>0.001` → byte-identical elsewhere.
- **New shared-material uniforms MUST live in `sharedUniforms`** or they vanish on the water's
  reflective↔cheap rebuild (the documented water.js gotcha) — `uAuroraGlow` went there, not on the raw
  material.

**Leapfrog.** Aurora Shallows is now a complete, self-contained biome — its own dark sky, curtain, mirror
sea, LOW ice props, and a world that glows faintly under the aurora — all flyable via `?biome=6`, still
byte-identical to the shipped world (not in CYCLE). The last step is **PR-4: THE FLIP**
(`CYCLE=[0,1,2,3,4,6,5]`, between Mire and Astral) so it enters normal play — plus the deferred
conditional entries the PR-2 map flagged are now DONE (primary[6]/accent[6] landed here). Plan:
`reforged/AURORA-SHALLOWS-PLAN.md`.
