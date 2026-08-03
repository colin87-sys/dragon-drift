# 2026-07-09 — A pitched pluck reads as DRUMS; destructiveness = broadband + nonlinear + debris + mass

**Did / learned.** After the lance-v3 loop landed, the owner's remaining note was precise:
the wisp IMPACT (each homing missile landing on a boss organ, `brandStrike`) "has a
percussive sound but no impact — no destructiveness — it sounds like someone playing the
drums." Diagnosed psychoacoustically: the shipped v3 per-hit was a clean harmonic pluck
(triangle climbing the live chord) + a smooth band-limited "tick" (a filtered `noiseWhoosh`)
+ a short sine sub-knock. Every layer was **periodic or smoothly band-limited**, with **zero
nonlinear energy** and **no aftermath** — which is *exactly* the signature of a tuned drum:
harmonic + smooth-decay + filtered ⇒ the ear's only category is "instrument." Melodic pluck
climbing a scale literally IS a drum fill.

The fix was **additive, not a rewrite** (the owner liked the musical resolution): a new
`gritBurst` helper — `noiseWhoosh` with a `makeDriveCurve` WaveShaper inserted before the
gain, so the saturator turns filtered *swish* into broadband *crunch* (intermodulation
products = the "material failing" bite a biquad-filtered noise can never have). `brandStrike`'s
v3 body rebuilt as: (1) a saturated CRUNCH front (center falling + level rising with k),
(2) an inlined saw→waveshaper GRIT body pitched by octave-folding the chord note (destructive
AND in key), (3) a longer/deeper THUD for mass, (4) a parity-alternating debris/scorch TAIL
(one micro-event per hit — falling shard on even k, ember sizzle on odd — so six hits build a
stochastic debris cloud, not white mush), while (5) the chord PLUCK drops to a background TINT
(0.05→0.035). It survives on **spectral spacing** (nothing else harmonic in 600–1600 Hz), not
loudness — so the melody reads without dominating. The roll CRESCENDOS (heavier/crunchier as
k rises), which both fights the machine-gun-flatness and hands off UP into `brandFinale`; the
finale got ONE matching `gritBurst` so the loud-but-all-clean climax doesn't read as *less*
violent than the now-crunchy strikes (timbre inversion).

**→ Systematize.** (1) **"Sounds like drums" ≈ too harmonic + too clean + no aftermath.** To
make a hit read as *destruction* not *percussion*, add the three things a drum lacks:
BROADBAND energy, NONLINEAR/saturated harmonics (a waveshaper, not a filter), and a stochastic
DEBRIS TAIL — plus MASS (a longer/deeper sub than a kick-drum blip). (2) **Segregate melody
from impact by SPECTRUM, not level** — keep the pitched layer in a band nothing else occupies
and it stays legible even when quiet under a louder impact. (3) **A crescendo across a repeated
roll is an anti-machine-gun device** — flat repetition reads as a machine gun / drum fill; an
escalating one reads as a collapse. (4) **Per-voice waveshapers only** (never a shared shaper
on the SFX bus — simultaneous hits would intermodulate the whole mix to fuzz), and drive them
with **discrete literal amounts** because `makeDriveCurve` caches by `amount.toFixed(2)` — a
continuous/computed drive would blow the cache. (5) Inline the saw+shaper in the caller rather
than adding a `drive` param to the shared `tone()` — keeps the byte-identical `?lance=v2` path
untouched by construction.

**→ Leapfrog.** All new work is under `if (LANCE_V3)`; the `?lance=v2` arm's call-stream is
byte-identical (re-verified 0 mismatches on the extraction harness — including the `88*v`
1-ULP finale line kept verbatim). Determinism holds (variety from k/detSeq/literals + the
seeded noise buffer; no `Math.random`). New tunables `strikeCrunchVol`/`strikeGritDrive`/
`strikeDebrisVol` in the LOCK block. Verified headless: `lock` 100/100, `boss` 110/110,
`audioboot` green (`loudshots` is music-station-only; `lockdps` KARNVOW/ASHTALON is a
pre-existing unrelated failure). Loudness/limiter is the ear-judged risk on the preview — the
crescendo + fast exp decays keep RMS/crest transient, and `strikeCrunchVol` is the pull-back
lever if a 6-hit roll pumps. Owner judges destructiveness vs melody-legibility on the PR preview.
