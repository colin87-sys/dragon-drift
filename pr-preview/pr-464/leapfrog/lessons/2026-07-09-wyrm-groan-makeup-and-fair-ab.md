# 2026-07-09 — Making the Wyrm A/B a FAIR test: tested makeup-gain, a submix void, cross-fight damage, and a lean release

**Did / learned.** A second harsh critique of the merged Wyrm profile found the modal-synthesis
architecture was right but the MIX inverted the thesis by the same mechanism a third time:

1. **The formant groan — the whole "creature not gong" layer — repeated the insertion-loss bug,
   ~18–20 dB down.** A low saw (f0 ≈ 120 Hz) through a mid formant bandpass (≈ 750 Hz) only passes
   harmonic n ≈ formant/f0 ≈ 6, whose amplitude is ~2/(nπ) ≈ 0.1 of the saw. So the groan's `vol`
   lied by ~1/n and the voice was buried under the modal partials → the body read as gamelan. Fix:
   **make the compensation an explicit, TESTED function.** `sfxLanceMath.js` (a pure, browser-free
   module) exports `groanMakeup(f0, formant) ≈ nπ/2` and `effectiveGroanLevel(...)`; the groan
   multiplies each formant path by its makeup, and `tests/wyrmlevels.mjs` (node, deterministic)
   asserts the effective level stays ≥ 0.05 across the body's whole f0×formant range — deleting the
   makeup drops it to ~0.019 and the test FAILS. The bug that shipped twice now can't ship again.
2. **The finale was SMALLER than the classic finale it A/Bs against, and its "40ms void" didn't
   exist** (fire-and-forget voices, no handle to choke the ringing strike tails). Fix: a **private
   submix gain** (`WOUT`) that every wyrm voice routes through (via a new byte-identical `dest`
   option on `tone`/`noiseWhoosh`/`gritBurst`); the finale dips WOUT to ~0 for 40 ms (the void is
   now real — it chokes the tails) and the finale is beefed past classic (mid body-slam in the
   comp-friendly 200–800 Hz band, a **staggered** sub so stacked lows don't take the master
   compressor hostage, debris + crackle tail scaled by n).
3. **The A/B was rigged against its own thesis:** under wyrm the RELEASE was still the loud classic
   launch, so "quiet hands, loud world" was judged with loud hands. Fix: fork `brandLoose` too — a
   lean dry SNAP under wyrm — so the boss's body is the loud element.
4. **The "damage" reset every volley (the creature healed between rolls).** Fix: a per-fight
   `damage` accumulator (reset in `setBoss`), driving a slow sag + mode-detune + groan-swell across
   the whole fight — which delivers the fiction AND doubles as the anti-repetition engine (volley 12
   ≠ volley 1). Modes now detune APART with damage (loosening), not a parallel gliss (pitch-bend).
5. Correctness: the roll-duck is sized to the real presentation span (`rollMaxS`), not the damage-
   stagger constant; the finale always ducks (not only on full); a deeper `lanceHoldAmt` (0.32 >
   the per-hit 0.18) so the hole out-dips the groove's own kick pump; per-fight state reset for
   history-independence (so the level gate can't go flaky).

**→ Systematize.** (1) **When a bug is "a layer is inaudible because of filter insertion loss,"
the fix is a TESTED makeup function, not a bigger `vol`** — put the level math in a browser-free
module and unit-test the effective level in node; a `vol` parameter that lies is how the same bug
ships three times. (2) **A "no console errors" or "it dispatched" smoke test is blind to the actual
failure mode (silence);** the guard that matters computes the level. (3) **An A/B only tests the
thesis if BOTH arms are mixed to the thesis** — leaving the competing arm's loud element in place
guarantees the new idea loses for the wrong reason. (4) **A private submix gives you the three
things fire-and-forget voices can't: a real silence void (choke the tail), a single makeup/safety
point, and per-profile level control** — and the `dest`-option pattern adds it byte-identically.
(5) **Persistent STATE (a damage scalar) beats persistent NODES** for "the world changes as it takes
damage": the fiction lives across the fight with zero leak surface.

**→ Leapfrog.** Fresh change on a fresh branch (the prior Wyrm PR #335 already merged). Classic path
byte-identical (harness 0 mismatches, incl. the new `dest` option); `wyrmlevels` 12/12 (the new
deterministic audibility gate), `wyrmsmoke` 12/12 dispatch + 0 errors, `lock` 100/100, `audioboot`
green. Still the owner's ear call on the preview (Shift+L) — but now it's a *fair* hearing: audible
creature voice, a finale that exceeds classic's, and quiet hands.
