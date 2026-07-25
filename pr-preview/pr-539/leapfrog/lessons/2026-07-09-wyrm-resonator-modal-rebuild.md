# 2026-07-09 — The Wyrm lance profile, and why a harsh critique moved it from noise-excited biquads to decaying-oscillator modal synthesis

**Did / learned.** The owner wasn't sure the whole lance combat loop was heading the right
way ("satisfying but not annoying, and it plays constantly"), so we spawned a **fresh,
context-free** audio director to assess the loop for what it is and design a ground-up
alternative to live **beside** the classic sounds behind a toggle. Its verdict: the reward
hierarchy was inverted (melodic candy on the constant events, generic noise-percussion on the
payoff), "weight" was parked in sub-bass a phone can't play, and every past fix ADDED layers.
Its direction — **"quiet hands, loud world; the boss is the instrument"**: the player's inputs
whisper, and the reward is the boss's own resonant body ringing and breaking. Owner picked that
pole, scoped to the impact+finale first, and asked for **harsh critique at checkpoints**.

First build used a persistent per-boss **biquad resonator** (3 high-Q bandpasses excited by
noise bursts). A harsh critique then proved, on paper, that it could not deliver the thesis:

1. **Bandpass insertion loss makes a narrowband resonator ~30 dB too quiet.** Broadband noise
   through a Q≈16 filter passes only a ~15 Hz slice: output RMS ≈ input·√(BW/Nyquist) ≈ 0.018×.
   Chained through excite×mode-gain×drive×out it landed near **-45 dBFS** — inaudible under the
   music, and *quieter than its own contact tick*. The feature was silent and the smoke test
   (which only asserted "no console errors") passed green over it.
2. **Q sets T60, not audible ring.** τ_amp = Q/(πf) ≈ 21 ms at 240 Hz/Q16 → the ring is ~-25 dB
   by the 60 ms stagger. The "hits accumulate into one body" mechanism was physically false as
   tuned — each hit was a discrete damped boing, i.e. a muted tom. A drum.
3. **Inharmonic decaying partials ARE struck metal.** Inharmonicity is the *bell/gong* signature;
   the comment claiming "inharmonic = flesh, not a bell" had the physics backwards. A creature
   needs heavy damping + **breath/formant structure + an in-event pitch glide + growl roughness**.
4. **A sustained sidechain "hole" is clobbered by the music's own kick sidechain.** `duckHold`
   wrote a flat hold on `pumpGain`, but every kick's `pumpDuck` does `cancelScheduledValues` — so
   the hole collapsed to per-beat flutter within one beat. Three writers on one node broke the
   repo's one-writer law.

**The rebuild** followed the critique's own preferred fix: **decaying-oscillator modal synthesis**
instead of noise-excited biquads. `K.tone` already IS an exponential decay, so each mode is a
struck partial with **direct level control** (no insertion-loss guessing) and a **free ring time**
(dur >> stagger ⇒ real overlap/accumulation). The body loosens across the roll (partials dig down
≥ a semitone/hit — beating the sub-JND 31-cent drift — ring longer, and swell with accumulated
damage); a **formant groan** (saw → low-Q formant bandpass + downward glide, growl AM on the
finale) is the phone-audible "creature voice" that emerges as damage accrues; the finale caves the
body in and lands one in-key resolution note. The duck was fixed by **time-multiplexing** the
single writer: `duckHold` sets `lanceDuckUntil`, and `pumpDuck` skips kicks inside that window.

**→ Systematize.** (1) **A narrowband resonator has huge insertion loss — never trust `vol` on a
noise-through-bandpass; measure, or use direct oscillators.** (2) **Q is T60, not audible ring;**
if you need overlap/accumulation, author the decay (oscillator dur / a damage bus), don't hope a
biquad's Q gives it. (3) **Inharmonic ringing partials = struck metal; "creature" = formant +
in-event glide + growl + damping**, not just inharmonic ratios. (4) **One sidechain node = one
writer**; to share it, time-multiplex (a `holdUntil` fence) or add a serial gain — never let two
schedulers `cancelScheduledValues` the same param. (5) **A "no console errors" smoke test is blind
to a silent feature** — gate on dispatch count at minimum, RMS ideally; a green test over an
inaudible headline feature is worse than no test. (6) Decaying-oscillator modal synthesis also
*deleted* a class of bugs the persistent graph had (leak on death, teardown-click, switch-teardown
asymmetry) — sometimes the level fix and the correctness fix are the same architecture change.

**→ Leapfrog.** Parallel `sfxLance2.js` engine, toggled by `?lancesfx=wyrm` + a Shift+L runtime
A/B hotkey (persisted); classic path byte-identical (harness 0 mismatches). `wyrmsmoke` now proves
12/12 dispatches through the real graph; `lock` 100/100, `audioboot` green. **Still open** and the
reason this is a checkpoint not a conclusion: levels are now *audible and explicit* but only ear-
judgeable on device (esp. the groan's own bandpass loss, and phone-speaker survival); a real RMS
gate (wyrm-vs-classic band energy) is the outstanding test debt the critique named. Owner judges
the A/B on the preview; the resonator "creature vs gong" read is the bet still being tested.
