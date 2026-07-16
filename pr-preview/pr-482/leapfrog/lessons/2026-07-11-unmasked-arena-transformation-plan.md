# Planned: THE UNMASKED per-stage arena/dimension transformation (environment, not rig)

**What we did.** Designed the owner's finale beat — the ARENA transforms with the boss's stages
(S1 ordinary sky → S1→S2 crack pulls the world into a darker void dimension → S2→S3 unveiling opens
a luminous holy space) — as `docs/unmasked-arena-transformation-plan.md`. Plan only, no code.

**The load-bearing discovery: the whole world already re-reads ONE object every frame.**
`computeEnv(dist)` has exactly one consumer (`environment.js:497`), and `updateEnvironment` fans the
`env` scratch out to sky uniforms, scene fog, sun/hemi, `setWaterTint`, and `updateAmbient`. So a
boss-driven ARENA STATE is a post-`computeEnv` value-space override (lerp env toward authored
absolutes, mix 0 = byte-identical) — sky, fog, lights, water, and motes all transform through
seams that already exist, with **zero scene-graph writes and zero new draws**. This is the
non-reparenting answer to "a boss owns the sky": EMBERTIDE reparents its rig (`boss.js:1703`) and
that kills `partWorldPos` organs; the arena override touches no parenting at all, so the shipped
lance/RECKONING survive by construction — and the plan still demands the live-fight conjunction
test (arena live AND organs resolve) because the embertide lesson proved headless paths can green
a dead lance.

**The clock was already built.** `stageBeatT/stageBeatDur` (boss.js) starts the same frame as
`model.setPhase` with the same `TRANS_DUR` — a stateless blend from `(phaseIdx, stageBeatT)` is
in lockstep with the boss morph and snap-correct on the skip path with no new timer.

**Reusable patterns.** (1) "Teleport" ≠ crossfade: route the transition through an authored FLOOD
mid-palette (overexpose → drain into the new world) on the same clock — a lerp between two skies
reads as weather. (2) "Darker/holier" ≠ dimmer/brighter: build each arena from ≥4 non-brightness
channels (sun-gone + starfield + fog-swallow + up-drifting motes; light-fog + god-ray swell +
gold rain + bright sea). (3) Arena states need per-ARENA bullet-band overrides exactly like
biomes do — the default dark band fails on the void horizon (reuse Astral's certified
`dark:0xa84167`) and the default light band fails on the holy sky (deepen to ~`0xff9ec4`, cap the
holy horizon at L≈0.88 so white cores + the focal eye stay supreme); the fire-held transition
window is the natural bullet-free band-swap seam.

**Gotcha for the builder.** The arena reset must land in BOTH teardowns (`endEncounter` AND
`resetBoss` — the `:1873`/`:5416` skyFade template), and stage-3 in PR-A deliberately HOLDS the
void until PR-B ships the heaven (a void→ordinary pop at the unveil is worse than persistence).

**What it unlocks.** The §5c APEX "the world reacts" beat and the Tier-5 world-scale contract on
the finale, plus a general def-gated arena-state system any future boss (or biome event) can
claim — authored dimensions as data, not subsystems.
