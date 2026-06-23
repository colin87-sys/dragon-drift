// GODFALL RUSH — battle themes. Four original pieces, one per god, written
// for the synth orchestra in sfx.js (strings/brass/choir/celesta/taiko).
//
// Format (all sequences in eighth-notes; every bar sums to exactly 8):
//   bpm     — tempo
//   bass    — 8 bars of [freq, eighths]  (staccato low strings; always on)
//   theme   — 8 bars of [freq, eighths]  (lead; strings, doubled by brass in phase 3)
//   counter — 8 bars of [freq, eighths]  (countermelody; enters phase 2)
//   pad     — 8 chords (one per bar), each an array of freqs (choir)
//   arp     — 4 cycles × 8 freqs (celesta; phase 3 + Armiger)
//   drums   — percussion pattern name per phase: { p1, p2, p3 }
//   root    — tonic freq for stingers/fanfare
//
// Dependency-free on purpose: `node tools` can lint that bars sum to 8.

// Equal-tempered note table, octaves 0-6, with flat aliases.
const NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
export const N = {};
for (let oct = 0; oct <= 6; oct++) {
  for (let i = 0; i < 12; i++) {
    const midi = (oct + 1) * 12 + i;
    N[NAMES[i] + oct] = 440 * Math.pow(2, (midi - 69) / 12);
  }
}
for (let oct = 0; oct <= 6; oct++) {
  N['Db' + oct] = N['Cs' + oct];
  N['Eb' + oct] = N['Ds' + oct];
  N['Gb' + oct] = N['Fs' + oct];
  N['Ab' + oct] = N['Gs' + oct];
  N['Bb' + oct] = N['As' + oct];
}

const R = 0; // rest

export const THEMES = {
  // ======================================================================
  // LEVIATHAN — "Hymn of the Drowning Tide"   D minor · 92 BPM
  // Slow surging swells; the theme rises and crashes like the sea.
  // Progression: Dm Dm Bb C / Dm Bb Gm A
  // ======================================================================
  leviathan: {
    id: 'leviathan',
    title: 'Hymn of the Drowning Tide',
    bpm: 92,
    root: N.D3,
    drums: { p1: 'rite', p2: 'war', p3: 'storm' },
    bass: [
      [N.D2, 2], [N.D2, 1], [N.D3, 1], [N.D2, 2], [N.A2, 2],
      [N.D2, 2], [N.D2, 1], [N.D3, 1], [N.C3, 2], [N.A2, 2],
      [N.Bb1, 2], [N.Bb1, 1], [N.Bb2, 1], [N.Bb1, 2], [N.F2, 2],
      [N.C2, 2], [N.C2, 1], [N.C3, 1], [N.C2, 2], [N.G2, 2],
      [N.D2, 2], [N.D2, 1], [N.D3, 1], [N.D2, 2], [N.A2, 2],
      [N.Bb1, 2], [N.Bb1, 1], [N.Bb2, 1], [N.Bb1, 2], [N.F2, 2],
      [N.G2, 2], [N.G2, 1], [N.G3, 1], [N.G2, 2], [N.D3, 2],
      [N.A2, 2], [N.A2, 1], [N.E3, 1], [N.A2, 2], [N.Cs3, 2],
    ],
    theme: [
      [N.D4, 2], [N.F4, 1], [N.G4, 1], [N.A4, 3], [N.G4, 1],
      [N.F4, 2], [N.A4, 2], [N.D5, 4],
      [N.D5, 2], [N.C5, 1], [N.Bb4, 1], [N.F4, 4],
      [N.G4, 2], [N.E4, 2], [N.C5, 3], [N.B4, 1],
      [N.A4, 2], [N.D5, 1], [N.E5, 1], [N.F5, 3], [N.E5, 1],
      [N.D5, 2], [N.Bb4, 2], [N.F5, 4],
      [N.G4, 1], [N.A4, 1], [N.Bb4, 2], [N.D5, 4],
      [N.Cs5, 2], [N.E5, 2], [N.A4, 4],
    ],
    counter: [
      [R, 4], [N.D5, 2], [N.C5, 2],
      [N.A4, 4], [N.F4, 2], [N.A4, 2],
      [N.Bb4, 4], [N.D5, 2], [N.F5, 2],
      [N.E5, 4], [N.G4, 2], [N.C5, 2],
      [R, 4], [N.A5, 2], [N.G5, 2],
      [N.F5, 4], [N.D5, 2], [N.Bb4, 2],
      [N.D5, 4], [N.Bb4, 2], [N.G4, 2],
      [N.E5, 4], [N.Cs5, 2], [N.A4, 2],
    ],
    pad: [
      [N.D3, N.F3, N.A3], [N.D3, N.F3, N.A3],
      [N.Bb2, N.D3, N.F3], [N.C3, N.E3, N.G3],
      [N.D3, N.F3, N.A3], [N.Bb2, N.D3, N.F3],
      [N.G2, N.Bb2, N.D3], [N.A2, N.Cs3, N.E3],
    ],
    arp: [
      [N.D5, N.F5, N.A5, N.D6, N.A5, N.F5, N.D5, N.A4],
      [N.Bb4, N.D5, N.F5, N.Bb5, N.F5, N.D5, N.Bb4, N.F5],
      [N.C5, N.E5, N.G5, N.C6, N.G5, N.E5, N.C5, N.G5],
      [N.A4, N.Cs5, N.E5, N.A5, N.E5, N.Cs5, N.A4, N.E5],
    ],
  },

  // ======================================================================
  // TITAN — "The Weight of Stone"   C minor · 106 BPM
  // Marcato stomp; low brass hammers, phrygian shadow on the turn.
  // Progression: Cm Cm Ab Bb / Cm Ab Fm G
  // ======================================================================
  titan: {
    id: 'titan',
    title: 'The Weight of Stone',
    bpm: 106,
    root: N.C3,
    drums: { p1: 'war', p2: 'war2', p3: 'storm' },
    bass: [
      [N.C2, 1], [N.C2, 1], [R, 1], [N.C2, 1], [N.Eb2, 2], [N.Db2, 2],
      [N.C2, 1], [N.C2, 1], [R, 1], [N.C2, 1], [N.G2, 2], [N.Eb2, 2],
      [N.Ab1, 1], [N.Ab1, 1], [R, 1], [N.Ab1, 1], [N.Ab2, 2], [N.Eb2, 2],
      [N.Bb1, 1], [N.Bb1, 1], [R, 1], [N.Bb1, 1], [N.Bb2, 2], [N.F2, 2],
      [N.C2, 1], [N.C2, 1], [R, 1], [N.C2, 1], [N.Eb2, 2], [N.Db2, 2],
      [N.Ab1, 1], [N.Ab1, 1], [R, 1], [N.Ab1, 1], [N.Ab2, 2], [N.Eb2, 2],
      [N.F2, 1], [N.F2, 1], [R, 1], [N.F2, 1], [N.C3, 2], [N.Ab2, 2],
      [N.G2, 1], [N.G2, 1], [N.G2, 1], [N.G2, 1], [N.B2, 2], [N.D3, 2],
    ],
    theme: [
      [N.C3, 3], [N.Eb3, 1], [N.D3, 2], [N.C3, 2],
      [N.G3, 3], [N.F3, 1], [N.Eb3, 2], [N.C3, 2],
      [N.Ab3, 3], [N.C4, 1], [N.Bb3, 2], [N.Ab3, 2],
      [N.Bb3, 2], [N.F3, 2], [N.D3, 4],
      [N.C4, 3], [N.Bb3, 1], [N.Ab3, 2], [N.G3, 2],
      [N.Ab3, 2], [N.Eb3, 2], [N.C3, 4],
      [N.F3, 2], [N.Ab3, 2], [N.C4, 3], [N.Ab3, 1],
      [N.G3, 2], [N.B3, 2], [N.D4, 4],
    ],
    counter: [
      [R, 8],
      [N.C5, 2], [N.G4, 2], [N.Eb4, 4],
      [N.Eb5, 2], [N.C5, 2], [N.Ab4, 4],
      [N.D5, 2], [N.Bb4, 2], [N.F4, 4],
      [N.Eb5, 2], [N.C5, 2], [N.G4, 4],
      [N.C5, 2], [N.Ab4, 2], [N.Eb4, 4],
      [N.C5, 2], [N.Ab4, 2], [N.F4, 4],
      [N.D5, 2], [N.B4, 2], [N.G4, 4],
    ],
    pad: [
      [N.C3, N.Eb3, N.G3], [N.C3, N.Eb3, N.G3],
      [N.Ab2, N.C3, N.Eb3], [N.Bb2, N.D3, N.F3],
      [N.C3, N.Eb3, N.G3], [N.Ab2, N.C3, N.Eb3],
      [N.F2, N.Ab2, N.C3], [N.G2, N.B2, N.D3],
    ],
    arp: [
      [N.C4, N.Eb4, N.G4, N.C5, N.G4, N.Eb4, N.C4, N.G3],
      [N.Ab3, N.C4, N.Eb4, N.Ab4, N.Eb4, N.C4, N.Ab3, N.Eb4],
      [N.Bb3, N.D4, N.F4, N.Bb4, N.F4, N.D4, N.Bb3, N.F4],
      [N.G3, N.B3, N.D4, N.G4, N.D4, N.B3, N.G3, N.D4],
    ],
  },

  // ======================================================================
  // RAMUH — "Sentence of the Sky"   E minor · 138 BPM
  // Staccato gallop, descending lightning runs, harmonic-minor bite.
  // Progression: Em Em C D / Em C Am B
  // ======================================================================
  ramuh: {
    id: 'ramuh',
    title: 'Sentence of the Sky',
    bpm: 138,
    root: N.E3,
    drums: { p1: 'war', p2: 'storm', p3: 'storm2' },
    bass: [
      [R, 1], [N.E2, 1], [R, 1], [N.E2, 1], [R, 1], [N.E2, 1], [N.E2, 1], [N.E3, 1],
      [R, 1], [N.E2, 1], [R, 1], [N.E2, 1], [R, 1], [N.D2, 1], [N.D2, 1], [N.D3, 1],
      [R, 1], [N.C2, 1], [R, 1], [N.C2, 1], [R, 1], [N.C2, 1], [N.C2, 1], [N.C3, 1],
      [R, 1], [N.D2, 1], [R, 1], [N.D2, 1], [R, 1], [N.D2, 1], [N.D2, 1], [N.D3, 1],
      [R, 1], [N.E2, 1], [R, 1], [N.E2, 1], [R, 1], [N.E2, 1], [N.E2, 1], [N.E3, 1],
      [R, 1], [N.C2, 1], [R, 1], [N.C2, 1], [R, 1], [N.C2, 1], [N.C2, 1], [N.C3, 1],
      [R, 1], [N.A1, 1], [R, 1], [N.A1, 1], [R, 1], [N.A1, 1], [N.A1, 1], [N.A2, 1],
      [R, 1], [N.B1, 1], [R, 1], [N.B1, 1], [N.B1, 1], [N.Ds2, 1], [N.Fs2, 1], [N.B2, 1],
    ],
    theme: [
      [N.E5, 1], [N.D5, 1], [N.B4, 1], [N.G4, 1], [N.B4, 2], [N.E4, 2],
      [N.G4, 1], [N.A4, 1], [N.B4, 2], [N.E5, 4],
      [N.C5, 1], [N.B4, 1], [N.G4, 1], [N.E4, 1], [N.G4, 2], [N.C5, 2],
      [N.D5, 1], [N.C5, 1], [N.A4, 1], [N.Fs4, 1], [N.A4, 2], [N.D5, 2],
      [N.E5, 1], [N.D5, 1], [N.B4, 1], [N.G4, 1], [N.B4, 2], [N.E5, 2],
      [N.G5, 1], [N.E5, 1], [N.C5, 1], [N.G4, 1], [N.C5, 2], [N.E5, 2],
      [N.A4, 1], [N.B4, 1], [N.C5, 2], [N.E5, 2], [N.C5, 2],
      [N.B4, 2], [N.Ds5, 2], [N.Fs5, 2], [N.B4, 2],
    ],
    counter: [
      [N.B4, 4], [N.G4, 4],
      [N.E5, 4], [N.B4, 4],
      [N.G4, 4], [N.E5, 4],
      [N.Fs4, 4], [N.D5, 4],
      [N.B4, 4], [N.G5, 4],
      [N.E5, 4], [N.G4, 4],
      [N.E4, 4], [N.A4, 4],
      [N.Fs5, 4], [N.B4, 4],
    ],
    pad: [
      [N.E3, N.G3, N.B3], [N.E3, N.G3, N.B3],
      [N.C3, N.E3, N.G3], [N.D3, N.Fs3, N.A3],
      [N.E3, N.G3, N.B3], [N.C3, N.E3, N.G3],
      [N.A2, N.C3, N.E3], [N.B2, N.Ds3, N.Fs3],
    ],
    arp: [
      [N.E5, N.B4, N.G4, N.B4, N.E5, N.G5, N.E5, N.B4],
      [N.C5, N.G4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4],
      [N.A4, N.E4, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4],
      [N.B4, N.Fs4, N.Ds4, N.Fs4, N.B4, N.Ds5, N.B4, N.Fs4],
    ],
  },

  // ======================================================================
  // BAHAMUT — "Apocalypse Choir"   A minor · 148 BPM
  // The finale: soaring line over relentless drive, full choir beneath.
  // Progression: Am Am F G / Am F Dm E
  // ======================================================================
  bahamut: {
    id: 'bahamut',
    title: 'Apocalypse Choir',
    bpm: 148,
    root: N.A2,
    drums: { p1: 'war2', p2: 'storm', p3: 'storm2' },
    bass: [
      [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1],
      [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1], [N.G1, 1], [N.G2, 1], [N.G1, 1], [N.G2, 1],
      [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1],
      [N.G1, 1], [N.G2, 1], [N.G1, 1], [N.G2, 1], [N.G1, 1], [N.G2, 1], [N.B1, 1], [N.D2, 1],
      [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1], [N.A1, 1], [N.A2, 1],
      [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1], [N.F1, 1], [N.F2, 1],
      [N.D2, 1], [N.D3, 1], [N.D2, 1], [N.D3, 1], [N.D2, 1], [N.D3, 1], [N.D2, 1], [N.D3, 1],
      [N.E2, 1], [N.E3, 1], [N.E2, 1], [N.E3, 1], [N.E2, 1], [N.Gs2, 1], [N.B2, 1], [N.E3, 1],
    ],
    theme: [
      [N.A4, 2], [N.C5, 2], [N.E5, 3], [N.D5, 1],
      [N.C5, 2], [N.B4, 2], [N.A4, 4],
      [N.F4, 2], [N.A4, 2], [N.C5, 3], [N.B4, 1],
      [N.B4, 2], [N.G4, 2], [N.D5, 4],
      [N.E5, 2], [N.C5, 2], [N.A5, 3], [N.G5, 1],
      [N.F5, 2], [N.C5, 2], [N.A4, 4],
      [N.D5, 2], [N.F5, 2], [N.A5, 2], [N.F5, 2],
      [N.E5, 2], [N.Gs4, 2], [N.B4, 2], [N.E5, 2],
    ],
    counter: [
      [R, 4], [N.E4, 2], [N.G4, 2],
      [N.A4, 4], [N.E4, 4],
      [N.C4, 2], [N.F4, 2], [N.A4, 4],
      [N.G4, 2], [N.B4, 2], [N.D5, 4],
      [N.C5, 4], [N.E5, 4],
      [N.C5, 2], [N.A4, 2], [N.F4, 4],
      [N.F5, 4], [N.D5, 4],
      [N.E5, 2], [N.B4, 2], [N.Gs4, 4],
    ],
    pad: [
      [N.A2, N.C3, N.E3], [N.A2, N.C3, N.E3],
      [N.F2, N.A2, N.C3], [N.G2, N.B2, N.D3],
      [N.A2, N.C3, N.E3], [N.F2, N.A2, N.C3],
      [N.D3, N.F3, N.A3], [N.E3, N.Gs3, N.B3],
    ],
    arp: [
      [N.A4, N.C5, N.E5, N.A5, N.E5, N.C5, N.A4, N.E5],
      [N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.F4, N.C5],
      [N.D4, N.F4, N.A4, N.D5, N.A4, N.F4, N.D4, N.A4],
      [N.E4, N.Gs4, N.B4, N.E5, N.B4, N.Gs4, N.E4, N.B4],
    ],
  },
};
