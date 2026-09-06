# THE EMPYREAN PR-2 — THE NACRE WATER (sun #2 killed, luster not gloss)

**What we did.** Landed PR-2 (EMPYREAN-BIBLE.md §4b) — the biome's one novel shader system,
all behind a **default-0 `nacreMix` gate** (byte-identical off; the uniform lives in
`water.js` `sharedUniforms` so it survives the reflective↔cheap/swell tier rebuild — the named
trap). Mother-of-pearl, not a mirror.

- **Killed sun #2** — the water's `pow(dot(Ns,H),240)` sun-glitter LANE **and** the cheap
  analytic-tier sparkle flakes, both `× (1 - uNacreMix)`. The glitter is a mirror-sharp
  directional glint keyed on `sunDir` (a sun by any other name); the sparkle flakes are the
  plastic-pearlescent tell. Both gone on the nacre water. The capture confirms: no glint lane at
  the sun azimuth, any view angle.
- **Replaced with luster** — TWO cheap **view-driven** fragment terms (NO sun direction → no
  source): (1) a broad fresnel-weighted **SATIN sheen** (a wide soft grazing lift, the anti-glitter
  lobe), and (2) a constrained thin-film **IRIDESCENCE band** whose gamut is rose↔lilac↔periwinkle
  ONLY — the two mixes literally can't reach green or gold — firing on crest faces at grazing
  angles, receding in troughs. Banded + angular + soft; not an oil-slick, not car-paint.
- **Wired the xMix** (`BIOMES[5].nacre` → `env.nacreMix` lerp → `setWaterTint(nacreMix)`), and
  the horizon-dissolve (sky-horizon `0xcdd3f5` + `fogFarColor 0xe6e1f6` + the water far-fog)
  converges so the far water melts into the opal sky with no hard horizon line.

**Gotchas / lessons.**

1. **Pastel iridescence on CALM water starves itself.** First pass gated the band on a crest mask
   (`smoothstep(h)`) × a tight grazing weight (`pow(1-NdotV, 2.2)`) — but `waveAmp 0.4` has almost
   no crest and the tight grazing only fires at the far horizon, so the band was invisible near
   camera. Fix: **broaden the grazing (pow 1.7) so the mid-field fires, and give the crest mask a
   BASE FLOOR** (`mix(0.34, 1.0, crest)`) so the whole surface carries a low luster with crests
   reading stronger — plus a higher band frequency + strength. Same "subtle-by-design vs.
   invisible" line the nebula blooms walk: on a pale field, presence comes from HUE + band
   structure at a raised weight, never from value or a saturation past the pastel cap.
2. **New env fields must be decided against the arena schema.** `unmaskedarena.mjs` has a
   completeness audit asserting `ARENA_ENV_KEYS === computeEnv(0) keys`. Adding `nacreMix`/`empyMix`
   to the env without a decision leaves them in the "missing" list — but that list already carries
   **22 prior graphics-stream gates** (`auroraMix`, `godrayMul`, `deckBias`, `breachMix`…) that the
   arena intentionally does NOT lerp, so it's a soft/pre-existing audit, not a new regression. The
   BEHAVIOUR that matters (the arena owning the sky during a boss) is handled explicitly:
   `applyArenaSkin` now **silences `empyMix`/`nacreMix` as the arena floods** (THE UNMASKED is the
   Empyrean's anchor → its arena starts in biome 5; without this the bloom + nacre draw OVER the
   void/heaven). Byte-identical off-arena (mix 0 returns early).
3. **The probe must mirror EVERY sky-shader sun kill, not just the new terms.** PR-1 killed the
   sky disc + glow via `(1-uEmpyMix)`, but `skyProbe.skyColorAt` still added the base
   `sunGlow·pow(s,10)` lobe — so `?ibl` re-introduced a directional sun into the sourceless void.
   The 4th-touch mirror has to carry the SUBTRACTIONS too, not only the additions (Codex caught it).

**The reusable pattern.** A novel per-biome WATER system = a new `uNacreMix`-style gate in
`sharedUniforms` (survives the tier rebuild) + view-driven fragment terms gated on it + the xMix
wiring (`BIOMES[]` field, `computeEnv` lerp, `setWaterTint` consumer). Kill any `sunDir`-keyed term
`× (1 - gate)`; add only view/fresnel-driven luster so nothing implies a source.

**What it unlocks.** The Empyrean's substrate is complete (sky PR-1 + water PR-2). Next: PR-3 (the
Mote + the Breach), PR-4 (the `sentinel` hero + composition engine, built to
`EMPYREAN-PROP-REFERENCE.md`), PR-5 (roster + `inkShoal`), PR-6 (gravity-wells).

**Verify.** gold-determinism (byte-identical), skyprobe (byte-identical), biomecycle,
bulletcontrast, water, surfaceshader all green; unmaskedarena's behavioural assertions all pass
(the 1 ✗ is the pre-existing soft schema audit). Captures `?biome=5&debug` (nacre on): sun-azimuth
scanned clean, satin + iridescence read, horizon dissolves. Merged master (build-stamp conflicts
re-stamped). Owner judges on the PR preview.
