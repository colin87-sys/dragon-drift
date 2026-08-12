# Detonation embers — the bright END-CAP is the "firefly" tell; fold substance INTO the volume

**Supersedes the conclusion of** `2026-07-14-ember-coherence-share-the-fields-sign-not-just-amplitude.md`.
That lesson's coherence fix was correct *as far as it went* (the path should braid with the streaks) but it
kept the architecture that actually failed. Owner after the coherence build: "Still looks fake and doesn't
match. Can we try a different approach altogether." He was right — a third *tuning* was the wrong move.

**The root defect — a monotone head→tail envelope IS a discrete object.** Three fixes (curve them; re-cohere
them; this) all confronted the same invariant: the comet ribbon's brightness AND width both peaked at ONE end
(the head). `trailFade = 1 - 0.55·segT`, `wid = size·(1 - 0.7·segT)`, plus a young-hot white boost, additive +
`toneMapped=false` → every trail terminated in a bright, wide, near-white blob that **bloom inflated into a
ball**. The eye segments "brightest point + trail" into "a thing moving in a direction" — a firefly. Coherent
motion made 1152 fireflies swim together; it could not make them stop being fireflies. **The lesson: when a
particle reads as a discrete object instead of substance, the tell is usually a per-element MAXIMUM at an end
(a bright/wide cap). No amount of curve/colour/brightness tuning removes an object read that the ENVELOPE
shape creates. Change the envelope, or delete the element.**

**The two-part replacement (the "different approach"):**

**Part A — fold the particulate INTO the volume that already exists.** The corona quad already covers the
blast's whole area and already has a domain-warp/cells turbulence idiom. Add ONE high-frequency octave there —
circle-embedded (seam-free) and radially advected outward so the dust *streaks with* the blast — multiplied
into the existing brightness (`b *= mix(1.0, 0.62 + 1.35·dust², uGrain·smoothstep(0.10,0.45,t))`, mean ≈
preserved by the cells idiom, rising with radius so the core stays clean). **The grain literally IS the blast's
own pixels, so it cannot read as a separate object** — this is the structural win. Cost: one `vnoise` call in
one branch. Zero new fill, zero new draws, no new additive volume (the ≤2-large-additive-volume cliff is never
approached — the killer for the "volumetric dust sheet" alternative).

**Part B — the remaining sparse elements are HEADLESS.** Keep a thin outer whisper the corona can't reach
(embers range to r 520 vs corona 340), but rebuilt so **no vertex is ever a maximum at an end**:
- Brightness a MID-PEAK spindle: `trailFade = 4·segT·(1-segT)` → **0 at both ends**, bright in the middle.
  Nothing terminates bright; there is no cap to bloom into a ball.
- Width tapers to sub-bloom at both ends: `wid = size·(0.35 + 0.65·sin(π·segT))`, and `size` max 0.85u
  (was 3.4) — below the bloom kernel at 420m, so bloom physically cannot inflate a ball where there is no wide
  bright cap.
- Delete the hot-white boost (it made the near-white head); the filament stays on the shared radius ramp.
- Far dimmer (compensator 0.6→0.35), fewer (1152→192), longer (`trailDt` up) — a whisper of grain, not a
  swarm. Kept the coherent path (signed shared field, single anchored arc) — that part was never the problem.

**Fill/perf: strongly negative (safe on a fill-bound frame).** Ember fill ≈ 192/1152 × ~0.4 width ≈ **~7% of
the old**; grain is ALU-only. Additive volume count stays 2. Tier: grain `1/0.6/0` and filaments `192/128/64`.

**The reusable law — for "particulate that should read as substance, not objects": (1) put most of it INTO
the volume it belongs to (a shader-grain octave on the existing additive layer — same pixels can't detach), and
(2) give any discrete remainder a mid-peak envelope with sub-bloom-kernel width so nothing terminates bright.**
The failure mode to recognise on sight is the bright end-cap; bloom + additive turn any such cap into a ball,
and a ball with a tail is a firefly no matter how you move or colour it.

**Verify.** smoke + bossboot zero-error (both new shader strings compile — the NaN gate; grain uses the proven
`vnoise`, filament terms are clamped `pow`/`sin`, existing `inversesqrt(max(1e-6,…))`/`max(1e-4,…)` survive).
`unmaskedarena` `emberN 1152→192` (updated in the same PR); the dimmer filaments + softer gate + mean-preserving
grain push the luminance probes DOWN (safe under the ≤0.55 cap). `?noembers` (filaments off), `?nograin` (grain
off) are the A/B seams — the twice-rejected comet variants were DELETED (carrying rejected variants is debt).
Owner judges the "reads as substance now" on the real GPU (headless SwiftShader is blind to bloom-ball + motion);
the taste dials are the grain cell-gain 1.35 and the filament compensator 0.35.
