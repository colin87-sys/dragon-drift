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

// The post-filter, post-makeup peak a groan at `nominalVol` actually delivers.
// With makeup ≈ nπ/2 and harmonic amplitude ≈ 2/(nπ), the two nearly cancel, so
// this returns ≈ nominalVol (until the makeup clamp bites at large n).
export function effectiveGroanLevel(nominalVol, fundamental, formant) {
  const n = Math.max(1, formant / Math.max(1, fundamental));
  const harmAmp = 2 / (n * Math.PI);
  return nominalVol * groanMakeup(fundamental, formant) * harmAmp;
}
