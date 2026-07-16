# graphics: Tempest STORMSEA — a storm sea is SURFACE GRAPHICS, not wave height

**What we did.** Built the STORMSEA violent-sea water pass for Tempest Reach and Fable-gated it to
**4.3/5 SHIP** (2.8 → 3.9 → 4.0 → 4.3 across four render→gate→fix rounds). Combined with the
atmosphere (also 4.3), the Tempest **substrate** (sky + sea, in motion) is passed.

**The core lesson — the owner said "the sea looks calm af," and the fix was NOT a bigger wave.**
The base water shader only displaces small ripple octaves (λ 3.7–12.6m, max amp ~0.28u) plus one
global 105m swell that's shared by every biome and switched OFF on weak phones — so `waveAmp`
literally cannot make a storm sea. And it shouldn't: from an above-the-water flight camera, a tall
swell reads as almost nothing; **violence is a SURFACE-GRAPHICS read** — one-way combed foam
streaks, near-black troughs between them, a high connected white fraction, smeared crests. That's
the storm-ocean research, and the frames vindicated it. The per-biome swell-amplitude lever stays
**banked** (revisit only if a flythrough still reads calm; then a Tempest-gated swell ~2.5–3× the
base octave, same `godrayMul` pattern).

**The build — `uStormSea` gate + `TEMPEST_WIND` constant (both reusable):**
- `uStormSea` lives in `sharedUniforms` (or it vanishes on the reflective↔cheap/swell tier rebuild
  — the standing water-uniform trap), lerped via `computeEnv` → `setWaterTint`; 0 everywhere else =
  byte-identical calm sea.
- `TEMPEST_WIND` (0.851, 0.525) is ONE exported constant — oblique to the lane so the grain reads
  diagonal, not as lane-parallel stripes. It drives the foam-streak axis and the 2nd wind-aligned
  swell (a garnish, mirrored in the `waterSurfaceHeight` JS port so the contact shadow + foam
  collars ride the true storm surface — the lockstep contract).
- The violence is carried in the FRAGMENT (trough darkening + wind-combed foam), so it reads with
  the vertex swell OFF / on tier 2 — the fragment must carry ≥70% of the read.

**The tuning journey — three tells, each caught by a Fable pixel-gate the owner never had to:**
1. **Hard `floor()` foam cells read as PACK ICE** (the one silhouette Part B bans in this biome).
   Fix: wind-ROTATE the streak domain first, then SMOOTH value-noise along the wind (no floor
   blocks), feathered cross-profile.
2. **Confetti** — the fix for #1's rectangle-ghosts (halving the fleck cell) over-corrected and
   shredded the combed lanes into directionless dashes. Root cause: each across-band had
   INDEPENDENT along-noise, so no lane was continuous. Fix: key each lane's along-pattern to its
   own **lane-id** along a continuous ~55m value-noise → one line, not a grid; a **~180m smooth
   presence field** clusters lanes into windrow FIELDS with open dark water between (the
   negative-space rhythm), and deepens the open water (the dark is half the drama).
3. **Hard-edged fleck glyphs** — distribution was fixed but the primitive still said "noise cell."
   Fix (fleck term only): elongate ~7:1 along the wind (chip→smear), widen the threshold smoothstep
   (soft edge), damp fleck contrast ~50% within ~35m of the camera (windrows are a distance read;
   directly below, streaky tone not discrete chips). Primary lanes stay full-strength.

**Readability guard (now standing law for this water):** foam luma ≤ overcast register (never >
`#dbe2e1`, no pure white); mid-field connected-white fraction in the ~15–25% band (texture, not
strobe); trough darkening eased with a HARD FLOOR `#182026` so the Thunderhead's charcoal
(`0x232836`) never melts into the sea (Law 8 — the average is the drama, the floor is the guard,
they're different numbers); danger magenta + ring/gate contrast evaluated against the BRIGHTEST
streak, not the mean water.

**Process wins (the ones the owner actually pushed on):**
- **Pre-assess BEFORE building, not just gate after.** I started tuning foam by my own eye; the
  owner stopped me — "did you pre-assess with Fable?" I hadn't. Handed it to Fable first; it caught
  the pack-ice read immediately. Every element now: Fable pre-assess/spec → build to numbers →
  Fable pixel-gate → owner judges only a passing build.
- **Don't fake a coherence assert.** The one-wind-vector law (composition #6) does NOT hold yet —
  foam uses `TEMPEST_WIND`, but cloud drift is forward-parallax and rain is point-motes with no
  angle (the velocity-streak pass is deferred). Said so plainly instead of asserting green; Fable
  accepted a SPLIT — sea ships, coherence becomes the next GATED item (foam+cloud+rain → the single
  `TEMPEST_WIND`), required green before the owner's atmosphere sign-off.
- **Trust geometry over a critic's pixels for motion** (the FLAP-DESIGN lesson): a 520ms moving
  burst can't isolate downwind drift from forward parallax, so the drift-pair freeze harness was
  waived in favor of the code fact (single wind source) — stronger than any screenshot pair.

**Headless-capture note.** Run capture works on this container's software WebGL only as
**single-boot single-screenshot OR a single-boot screenshot LOOP with the sim live** (no warp, no
`timeScale=0` freeze, no `player.dist` warp — those hang the readback). `tools/tempestshot.mjs` +
the burst loop are the reliable harness; 5–8 frames over ~3s at `timeScale 1` = the moving-capture
gate input.

**Banked (not blocking):** the gold ring-collect pickup-burst FX is enormous + warm and will blow
Tempest's ≤8% gold ration whenever it fires — a future Tempest-grading question, not a sea item.

**What it unlocks.** Tempest substrate (sky 4.3 + sea 4.3) is Fable-passed in motion → goes to the
owner with a fly-test checklist. `uStormSea` + `TEMPEST_WIND` are standing levers for any weather
biome (Tidal Reef squalls). Next: the wind-coherence gate, then props (PR-1) / obstacle skins
(PR-3) / the lightning hazard (PR-4) / the eye-breach landmark (PR-5), each with its own Fable
pre-assess + gate.
