# A transformation is a beat map, not an ease

**Date:** 2026-07-11
**Touches:** `reforged/js/bossUnmasked.js`, `reforged/js/boss.js`, `reforged/tests/boss.mjs`
**Boss:** 14 THE UNMASKED (the Apex) — the S1→S2 crack + the S2→S3 unveiling.

## What we did

The owner reviewed boss 14 and couldn't tell there was a transformation at all: "I
thought S1→S2 the eye cracks and the 2nd-stage boss comes out, but I don't see any of
that." Two high-effort Fable assessments confirmed it and scored the transitions **2/10**
(crack) and **3/10** (unveiling). Both were technically wired to the live phase machine —
they just played as a **single 2.0s crossfade** (`setStageMorph`/`setStage3` were each one
eased driver where every visual channel ramped in lockstep over the same window). Nothing
read as an *event*.

We re-authored both as **beat maps**: per-kind durations (crack 6.0s, unveil 4.8s) and a
sequence of named beats — S1→S2 = STILLING → FIRST CRACK → PROPAGATION → STRAIN → SHATTER →
BUD → UNFURL → ALL-EYES-OPEN; S2→S3 = GATHER → CLOSE → THROW → IGNITE → SETTLE → held stare.

## What we learned (the gotchas)

1. **The crack was authored brightest exactly where it was hidden.** The shipped crack
   seams sat at `z 0.06` — *behind* the giant HDR-white eye that covers 77% of the disc —
   and their vertex brightness was `1 − r/DISC_R`, i.e. hot at the center (occluded) and
   dark at the rim (the only exposed band). It was invisible by construction. The fix that
   mattered was the **hero sclera-fissure**: a DARK opaque strip drawn *in front of* the eye
   (`z 1.45`, ahead of the eye's ~1.3 front face). **Rendering physics the old build
   ignored: additive light is invisible on an HDR-white surface** — over the sclera the
   crack must be dark-on-white; only over the black disc does a gold *additive* underglow
   read. Two co-located strips (dark core + gold glow) give both for ~2 draws.

2. **Occlusion reveal beats a crossfade — but don't overlap the rigs.** The old morph faded
   stage-1 out while stage-2 grew *through* it. Cleaner: hold the mask whole, SHATTER it
   (collapse to nothing inside a one-frame white backlight flash + flung opaque shards), and
   reveal the seraph *behind* the dying light. The two rigs barely co-exist now — which
   meant updating the tests that asserted "mid-morph both rigs live" to sample the beats.

3. **A "mantle" that's a static offset is not a transformation.** S3's wings opened via
   `flareZ * stage3K * 0.24` — a ~14° settle, *less* character than the charge tell players
   see every attack. Replaced with an animated THROW (`mantleK`: overshoot to 1.30, settle
   to a span **wider than S2 ever stood**, `MANTLE_MAX 0.34`). The apex's final form must
   change the SILHOUETTE at 30m, per the Tier-2 law that binds all higher tiers.

4. **Reversal reads louder than escalation.** S3's identity is *watching* (20 eyes). The
   unveiling lands because it begins by doing the unthinkable — it **stops watching you**
   (every pupil converges inward), the great eye **closes**, and only *then* the wings throw
   and the core splits. Contrast (a "before") is what makes the "after" a moment.

5. **Keep the driver a pure function of `k`, always.** The studio `morph` dial scrubs
   `setStageMorph`/`setStage3` to arbitrary values, and `setDebugStage`/the tap-skip jump to
   endpoints. Every new visual (crack opacity, backlight, shard fling, wing fold, eye
   visibility) is derived from `k` alone → scrubbing stays coherent and `k∈{0,1}` stays the
   shipped poses byte-for-byte. The only stateful bits (the reveal all-snap latch) reset from
   any `k` and from `setDebugStage`.

6. **Determinism: new geometry takes a PRIVATE seed.** The shatter shards use their own
   `mulberry32(0x51a2d0f)`; the fissure/backlight are authored (no RNG). The main `rnd`
   stream is untouched, so the seeded seraph (pupil biases, the scar) is byte-identical — the
   same `crnd`-isolation lesson the crack seams already carried (bossUnmasked.js ~146).

7. **The seam is the reusable part.** The harness now reads `model.stageTransitionSpec(n)`
   → `{ dur, revealAt, throwAt?, hold, beats }` and fires camera shake / slow-mo / sfx off a
   **beat table** while the model owns the pure-`k` visual morph. The reveal punch lands at
   `revealAt` (the eye-snap), not the morph's end; the slow-mo dilates the *ignition*, not
   the aftermath. Also fixed two latent bugs found on the way: the reveal card announced the
   generic boss name (it now reads `def.cards[phaseIdx].name`), and the capture/card timer
   ran during the fire-free cinematic (now frozen on `stageBeatT < 0`).

## The reusable pattern

**Any multi-stage transformation:** don't ease — phrase it. (a) Give the model a
`stageTransitionSpec` with a per-kind duration + a harness beat table; (b) author the visual
as a pure function of the morph clock over named beat edges (anticipation → event →
overshoot → settle → hold); (c) land the reveal punch + slow-mo ON the event, not at the
end; (d) new geometry on a private RNG seed; (e) sequence additive volumes (never stack them
— e.g. kill the corona before the backlight flash) to stay under the §2 overdraw cap. The
stillness thesis holds: the camera never hijacks — the violence is all geometry and light.

## What it unlocks

The pattern (spec + beat table + pure-`k` morph) is roster-wide and default-off, so any
future multi-stage boss gets phrased transitions for free. The owner judges the actual feel
on the PR preview (mid-fight and via the dev stage-pin intro path) — headless proves it
runs, never that it *feels* right.
