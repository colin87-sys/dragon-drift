// Pure level math for the Wyrm groan — isolated in its own module (no browser
// globals) SO IT CAN BE UNIT-TESTED IN NODE. The whole wyrm saga's recurring bug
// was uncompensated bandpass insertion loss making a layer inaudible; this makes
// the compensation an explicit, tested function instead of a `vol` that lies.
//
// A low saw (fundamental f0) driven through a bandpass at a MID formant only passes
// the saw harmonic(s) near the formant. Harmonic n ≈ formant/f0 has amplitude
// ~2/(nπ) of the unit saw — so an un-compensated groan is ~1/n of its nominal `vol`
// (n≈5–9 → ~15–20 dB down). `groanMakeup` restores it; `effectiveGroanLevel`
// predicts what actually reaches the bus so a test can assert it isn't buried.

export function groanMakeup(fundamental, formant) {
  const n = Math.max(1, formant / Math.max(1, fundamental));
  return Math.min(14, Math.max(1, n * Math.PI / 2));   // clamp: never a runaway boost
}

// The groan's two-formant mix, as ACTUAL COEFFICIENTS shared by the synth and the
// test (so the gate can never model something the code doesn't do — the exact bug
// the last critique caught: a single-path test over a two-path code understated the
// real level by 1.5× and its floor check was vacuous). Two summed paths ≈ vol·(s1+s2).
export const GROAN = { f1Scale: 0.75, f2Scale: 0.28, f2Ratio: 1.6, f1GlideFrac: 0.85, f2GlideMul: 1.08 };

// The post-filter, post-makeup peak a groan at `nominalVol` actually delivers.
// With makeup ≈ nπ/2 and harmonic amplitude ≈ 2/(nπ), the two nearly cancel, so
// this returns ≈ nominalVol (until the makeup clamp bites at large n).
export function effectiveGroanLevel(nominalVol, fundamental, formant) {
  const n = Math.max(1, formant / Math.max(1, fundamental));
  const harmAmp = 2 / (n * Math.PI);
  return nominalVol * groanMakeup(fundamental, formant) * harmAmp;
}

// What the SUMMED two-formant groan actually delivers to the bus — the level the
// synth (sfxLance2 `groan`) and the gate (tests/wyrmlevels) must BOTH use.
export function effectiveGroanLevelTwoPath(nominalVol, fundamental, formant) {
  return effectiveGroanLevel(nominalVol * GROAN.f1Scale, fundamental, formant)
    + effectiveGroanLevel(nominalVol * GROAN.f2Scale, fundamental, formant * GROAN.f2Ratio);
}
