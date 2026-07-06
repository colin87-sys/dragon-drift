// Harmony helpers — pure functions, dependency-free (node-testable, like
// tracks.js). The live "harmony oracle" glue (what chord is sounding NOW)
// lives in sfx.js (getHarmony), which feeds these; every consumer must
// handle the null-oracle case (audio off/headless) — the same contract as
// getBeatClock.
//
// The station data already encodes its harmony: each bar's 8-note arp cycle
// IS the current chord's tones. Pitched SFX snap to those, so pickups /
// parries / fanfares land in the station's key and read as arrangement, not
// interruption (the Rez / Tetris Effect move).

// Snap `freq` to the nearest chord tone by PITCH CLASS, preserving register:
// the sound keeps its designed brightness/size, only its tuning joins the
// music. `chordFreqs` = any octave's chord tones (e.g. the bar's arp notes).
export function snapToChord(freq, chordFreqs) {
  if (!(freq > 0) || !chordFreqs || !chordFreqs.length) return freq;
  const pc = (f) => {
    const x = Math.log2(f);
    return x - Math.floor(x); // fractional octave position, 0..1
  };
  const fpc = pc(freq);
  let best = freq, bestDist = Infinity;
  for (const c of chordFreqs) {
    if (!(c > 0)) continue;
    const cpc = pc(c);
    // circular distance in octaves (0..0.5)
    let d = Math.abs(cpc - fpc);
    if (d > 0.5) d = 1 - d;
    if (d < bestDist) {
      bestDist = d;
      // move freq by the (signed, shortest-way) pitch-class difference
      let delta = cpc - fpc;
      if (delta > 0.5) delta -= 1;
      if (delta < -0.5) delta += 1;
      best = freq * Math.pow(2, delta);
    }
  }
  return best;
}

// A rising ladder of `count` chord tones starting at (or above) `baseFreq`,
// walking up the chord across octaves — the key-aware replacement for the
// fixed pentatonic streak ladders. step = which rung (0-based).
export function chordLadder(baseFreq, chordFreqs, step) {
  if (!chordFreqs || !chordFreqs.length || !(baseFreq > 0)) return baseFreq;
  // unique ascending pitch classes
  const pcs = [...new Set(chordFreqs.filter((f) => f > 0).map((f) => {
    const x = Math.log2(f);
    return Math.round((x - Math.floor(x)) * 1e4) / 1e4;
  }))].sort((a, b) => a - b);
  if (!pcs.length) return baseFreq;
  const basePc = Math.log2(baseFreq) - Math.floor(Math.log2(baseFreq));
  // find the first rung at/above the base pitch class
  let idx = pcs.findIndex((p) => p >= basePc - 1e-6);
  let octave = 0;
  if (idx < 0) { idx = 0; octave = 1; }
  idx += step;
  octave += Math.floor(idx / pcs.length);
  idx %= pcs.length;
  const targetPc = pcs[idx] + octave;
  return Math.pow(2, Math.floor(Math.log2(baseFreq)) + targetPc);
}

// Beat-grid quantization delay: seconds until the next 1/`subdiv` note given a
// beat clock ({beatLen, phase}) — or 0 (play NOW) when the clock is null.
// Never quantize input acknowledgment; only the *musical* tail of a sound.
export function nextGridDelay(clock, subdiv = 4) {
  if (!clock || !(clock.beatLen > 0)) return 0;
  const grid = clock.beatLen / subdiv;
  const into = (clock.phase * clock.beatLen) % grid;
  const wait = grid - into;
  // Under ~30 ms away counts as "on the grid" — play immediately rather than
  // stacking a barely-audible delay onto input feedback.
  return wait < 0.03 || wait >= grid - 1e-9 ? 0 : wait;
}
