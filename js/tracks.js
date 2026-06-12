// Dragon Radio station data. Dependency-free so the track tables can be
// unit-checked in node (every bar must sum to exactly 8 eighth-notes).
//
// Format per track: 8 bars of [freq, duration-in-eighths] rows for melody /
// bass / high, four 8-note arp cycles (one per chord, bar % 4), optional
// 8 pad chords. All layers stay reactive: arp on boost, high on combo>=1.5,
// percussion on combo>=2/3, fever lead during Dragon Surge (see sfx.js).
//
// `cost` in embers; 0 = free. Purchased ids live in saveData.audio.ownedTracks.

// Note frequencies (Hz)
export const N = {
  D2:73.42, E2:82.41, F2:87.31, G2:98.00, A2:110.00, B2:123.47,
  C3:130.81, Cs3:138.59, D3:146.83, E3:164.81, F3:174.61, Fs3:185.00,
  G3:196.00, A3:220.00, Bb3:233.08, B3:246.94,
  C4:261.63, Cs4:277.18, D4:293.66, E4:329.63, F4:349.23, Fs4:369.99,
  G4:392.00, Gs4:415.30, A4:440.00, Bb4:466.16, B4:493.88,
  C5:523.25, Cs5:554.37, D5:587.33, Ds5:622.25, E5:659.25, F5:698.46,
  Fs5:739.99, G5:783.99, A5:880.00, Bb5:932.33, B5:987.77,
  C6:1046.50, Cs6:1108.73, D6:1174.66, E6:1318.51,
};

export function pumpBass(roots) {
  // Driving octave-pump bass: root/octave eighths under each chord
  const out = [];
  for (const root of roots) {
    for (let i = 0; i < 4; i++) out.push([root, 1], [root * 2, 1]);
  }
  return out;
}

export function slowBass(roots) {
  // Laid-back root + fifth half notes (lo-fi)
  const out = [];
  for (const root of roots) out.push([root, 4], [root * 1.5, 4]);
  return out;
}

// ============================ DRAGON RADIO ============================
export const TRACKS = [
  { // 0 — the original anthem, refined
    id: 'skyborne',
    name: 'Skyborne',
    desc: 'Soaring chiptune-pop anthem',
    cost: 0,
    bpm: 160,
    voices: {
      melody: { osc: 'square', vol: 0.16 },
      bass:   { osc: 'triangle', vol: 0.22 },
      high:   { osc: 'triangle', vol: 0.13 },
      arp:    { osc: 'sawtooth', vol: 0.09 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1, snare: 1, hat: 1, heavy: true },
    pad: false,
    melody: [
      [N.E5,1],[0,1],[N.G5,1],[0,1],[N.C6,2],[N.G5,2],
      [N.A5,1],[N.G5,1],[0,1],[N.E5,1],[N.D5,2],[0,2],
      [N.C5,1],[0,1],[N.E5,1],[0,1],[N.A5,2],[N.G5,1],[N.E5,1],
      [N.F5,1],[N.G5,1],[N.A5,2],[N.G5,2],[N.E5,1],[N.D5,1],
      [N.G5,1],[0,1],[N.E5,1],[N.G5,1],[N.C6,2],[N.D6,2],
      [N.E6,1],[N.D6,1],[N.C6,2],[N.B5,2],[N.G5,2],
      [N.A5,1],[0,1],[N.C6,1],[0,1],[N.E6,2],[N.D6,1],[N.C6,1],
      [N.A5,1],[N.G5,1],[N.F5,1],[N.G5,1],[N.A5,2],[N.B5,2],
    ],
    bass: pumpBass([N.C3, N.G2, N.A2, N.F2, N.C3, N.G2, N.A2, N.F2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.G5,2],[N.E5,2],[N.G5,2],[N.C6,2],
      [N.B5,2],[N.G5,2],[N.D5,2],[N.G5,2],
      [N.A5,2],[N.E5,2],[N.C6,2],[N.E6,2],
      [N.C6,2],[N.A5,2],[N.F5,2],[N.G5,2],
    ],
    arps: [
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.B3, N.D4, N.G4, N.B4, N.D5, N.B4, N.G4, N.D4],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.A3, N.C4, N.F4, N.A4, N.C5, N.A4, N.F4, N.C4],
    ],
    chords: null,
  },
  { // 1 — Panzer-Dragoon-flavoured modal epic: bells over slow pads
    id: 'tides',
    name: 'Ancient Tides',
    desc: 'Modal bells over deep pads',
    cost: 0,
    bpm: 105,
    voices: {
      melody: { osc: 'triangle', vol: 0.2, stack: 'octave' },
      bass:   { osc: 'sine', vol: 0.26 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'sawtooth', vol: 0.09 },
    },
    drums: { kick: 0.8, snare: 0.6, hat: 0.5, heavy: false },
    pad: true,
    melody: [
      [N.A4,2],[N.C5,1],[N.D5,1],[N.E5,3],[N.D5,1],
      [N.G4,2],[N.B4,1],[N.D5,1],[N.B4,2],[0,2],
      [N.F4,2],[N.A4,1],[N.C5,1],[N.D5,3],[N.C5,1],
      [N.E5,2],[N.D5,1],[N.B4,1],[N.A4,4],
      [N.A4,1],[N.E5,2],[N.D5,1],[N.E5,2],[N.G5,2],
      [N.D5,1],[N.G5,2],[N.F5,1],[N.D5,2],[N.B4,2],
      [N.A4,1],[N.C5,1],[N.D5,1],[N.E5,1],[N.A5,2],[N.G5,1],[N.E5,1],
      [N.D5,2],[N.C5,1],[N.B4,1],[N.A4,4],
    ],
    bass: pumpBass([N.A2, N.G2, N.F2, N.E2, N.A2, N.G2, N.F2, N.E2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,4],[N.C5,4],
      [N.D5,4],[N.B4,4],
      [N.C5,4],[N.A4,4],
      [N.B4,4],[N.E5,4],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
    ],
    chords: [
      [N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4], [N.F3, N.A3, N.C4], [N.E3, N.G3, N.B3],
      [N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4], [N.F3, N.A3, N.C4], [N.E3, N.G3, N.B3],
    ],
  },
  { // 2 — driving synthwave: pumping saw bass, neon hook
    id: 'rush',
    name: 'Ember Rush',
    desc: 'Pumping synthwave neon',
    cost: 0,
    bpm: 128,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.13, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.15 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'square', vol: 0.1 },
    },
    drums: { kick: 1.1, snare: 1, hat: 0.8, heavy: true },
    pad: true,
    melody: [
      [N.A4,1],[N.A4,1],[0,1],[N.C5,1],[0,1],[N.E5,1],[N.D5,1],[N.C5,1],
      [N.F4,1],[N.F4,1],[0,1],[N.A4,1],[0,1],[N.C5,2],[N.A4,1],
      [N.E4,1],[N.E4,1],[0,1],[N.G4,1],[0,1],[N.C5,1],[N.B4,1],[N.G4,1],
      [N.G4,1],[N.A4,1],[N.B4,2],[N.D5,2],[N.B4,2],
      [N.A4,1],[N.C5,1],[N.E5,2],[0,1],[N.E5,1],[N.G5,2],
      [N.F5,1],[N.E5,1],[N.C5,2],[N.A4,2],[N.F4,2],
      [N.E5,1],[N.E5,1],[0,1],[N.D5,1],[0,1],[N.C5,1],[N.B4,1],[N.C5,1],
      [N.D5,2],[N.B4,2],[N.G4,2],[N.B4,2],
    ],
    bass: pumpBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.C6,2],[N.A5,2],[N.E5,2],[N.A5,2],
      [N.A5,2],[N.F5,2],[N.C5,2],[N.F5,2],
      [N.G5,2],[N.E5,2],[N.C5,2],[N.E5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
    ],
    arps: [
      [N.A3, N.E4, N.A4, N.C5, N.E5, N.C5, N.A4, N.E4],
      [N.F3, N.C4, N.F4, N.A4, N.C5, N.A4, N.F4, N.C4],
      [N.C4, N.G4, N.C5, N.E5, N.G5, N.E5, N.C5, N.G4],
      [N.G3, N.D4, N.G4, N.B4, N.D5, N.B4, N.G4, N.D4],
    ],
    chords: [
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
    ],
  },
  { // 3 — mellow lo-fi glide: jazzy 7ths, soft drums
    id: 'drift',
    name: 'Moonlit Drift',
    desc: 'Mellow lo-fi glide',
    cost: 0,
    bpm: 85,
    voices: {
      melody: { osc: 'triangle', vol: 0.16 },
      bass:   { osc: 'sine', vol: 0.24 },
      high:   { osc: 'sine', vol: 0.1 },
      arp:    { osc: 'triangle', vol: 0.06 },
      lead:   { osc: 'triangle', vol: 0.09 },
    },
    drums: { kick: 0.6, snare: 0.45, hat: 0.4, heavy: false },
    pad: true,
    melody: [
      [0,1],[N.E5,1],[N.D5,1],[N.B4,1],[N.G4,2],[0,2],
      [0,1],[N.C5,1],[N.E5,1],[N.G5,1],[N.E5,2],[N.C5,2],
      [0,1],[N.D5,1],[N.F5,1],[N.A5,1],[N.F5,2],[N.D5,2],
      [N.B4,2],[N.D5,1],[N.F5,1],[N.G5,4],
      [0,1],[N.G5,1],[N.E5,1],[N.C5,1],[N.A4,2],[0,2],
      [0,1],[N.A4,1],[N.C5,1],[N.E5,1],[N.G5,2],[N.E5,2],
      [N.F5,2],[N.E5,1],[N.D5,1],[N.C5,2],[N.A4,2],
      [N.B4,1],[N.D5,1],[N.G4,4],[0,2],
    ],
    bass: slowBass([N.C3, N.A2, N.D3, N.G2, N.C3, N.A2, N.D3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.B4,4],[N.E5,4],
      [N.G4,4],[N.C5,4],
      [N.A4,4],[N.D5,4],
      [N.B4,4],[N.F5,4],
    ],
    arps: [
      [N.C4, N.E4, N.G4, N.B4, N.E5, N.B4, N.G4, N.E4],
      [N.A3, N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4],
      [N.D4, N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.F4],
      [N.G3, N.B3, N.D4, N.F4, N.B4, N.F4, N.D4, N.B3],
    ],
    chords: [
      [N.C4, N.E4, N.G4, N.B4], [N.A3, N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4, N.C5], [N.G3, N.B3, N.D4, N.F4],
      [N.C4, N.E4, N.G4, N.B4], [N.A3, N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4, N.C5], [N.G3, N.B3, N.D4, N.F4],
    ],
  },

  // ======================= PREMIUM STATIONS (shop) =======================
  { // 4 — festival big-room anthem: fat detuned hook over a four-chord pump
    id: 'neon',
    name: 'Neon Apex',
    desc: 'Festival anthem — fat detuned hook',
    cost: 800,
    bpm: 138,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.11 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.15, snare: 1.05, hat: 0.9, heavy: true },
    pad: true,
    melody: [
      [N.A4,2],[N.C5,1],[N.E5,1],[N.A5,2],[N.G5,1],[N.E5,1],
      [N.F5,2],[N.E5,1],[N.C5,1],[N.D5,2],[N.C5,1],[N.A4,1],
      [N.C5,2],[N.E5,1],[N.G5,1],[N.C6,2],[N.B5,1],[N.G5,1],
      [N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,4],
      [N.A5,2],[N.C6,1],[N.E6,1],[N.D6,2],[N.C6,2],
      [N.B5,1],[N.C6,1],[N.A5,2],[N.G5,2],[N.E5,2],
      [N.F5,1],[N.G5,1],[N.A5,2],[N.C6,2],[N.B5,1],[N.G5,1],
      [N.A5,2],[N.E5,1],[N.C5,1],[N.A4,4],
    ],
    bass: pumpBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,2],[N.C5,2],[N.A4,2],[N.C5,2],
      [N.F5,2],[N.C5,2],[N.A4,2],[N.C5,2],
      [N.G5,2],[N.E5,2],[N.C5,2],[N.E5,2],
      [N.D5,2],[N.B4,2],[N.G4,2],[N.B4,2],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
    ],
    chords: [
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
    ],
  },
  { // 5 — breakneck drum&bass chase in E minor: urgent stabs, soaring lift
    id: 'storm',
    name: 'Stormchaser',
    desc: 'Breakneck D&B chase',
    cost: 1000,
    bpm: 172,
    voices: {
      melody: { osc: 'square', vol: 0.14, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'triangle', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.2, snare: 1.15, hat: 1.1, heavy: true },
    pad: false,
    melody: [
      [N.E5,2],[N.G5,1],[N.Fs5,1],[N.E5,2],[N.B4,2],
      [N.C5,2],[N.E5,1],[N.D5,1],[N.C5,2],[N.G4,2],
      [N.B4,2],[N.D5,1],[N.C5,1],[N.B4,2],[N.G4,2],
      [N.A4,1],[N.B4,1],[N.D5,2],[N.Fs5,2],[N.A5,2],
      [N.E5,1],[N.E5,1],[N.G5,2],[N.B5,2],[N.A5,1],[N.G5,1],
      [N.A5,2],[N.G5,1],[N.E5,1],[N.C5,2],[N.E5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.A5,1],[N.G5,1],
      [N.Fs5,1],[N.G5,1],[N.A5,2],[N.Fs5,2],[N.D5,2],
    ],
    bass: pumpBass([N.E2, N.C3, N.G2, N.D3, N.E2, N.C3, N.G2, N.D3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.B4,2],[N.E5,2],[N.G5,2],[N.E5,2],
      [N.C5,2],[N.G4,2],[N.E5,2],[N.C5,2],
      [N.D5,2],[N.B4,2],[N.G5,2],[N.D5,2],
      [N.A4,2],[N.D5,2],[N.Fs5,2],[N.D5,2],
    ],
    arps: [
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
    ],
    chords: null,
  },
  { // 6 — radiant uplifting trance in D major: cathedral bells, golden lift
    id: 'solarc',
    name: 'Solar Cathedral',
    desc: 'Radiant uplifting trance',
    cost: 1400,
    bpm: 126,
    voices: {
      melody: { osc: 'triangle', vol: 0.19, stack: 'octave' },
      bass:   { osc: 'sawtooth', vol: 0.15 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.1 },
    },
    drums: { kick: 1.0, snare: 0.85, hat: 0.75, heavy: true },
    pad: true,
    melody: [
      [N.D5,2],[N.Fs5,1],[N.A5,1],[N.D6,2],[N.A5,2],
      [N.Cs6,2],[N.B5,1],[N.A5,1],[N.E5,2],[N.A5,2],
      [N.B5,2],[N.A5,1],[N.Fs5,1],[N.D5,2],[N.Fs5,2],
      [N.G5,1],[N.A5,1],[N.B5,2],[N.A5,2],[N.D5,2],
      [N.A5,1],[N.D6,1],[N.E6,2],[N.D6,2],[N.A5,2],
      [N.Cs6,1],[N.E6,1],[N.Cs6,2],[N.B5,2],[N.A5,2],
      [N.B5,2],[N.D6,2],[N.Cs6,1],[N.B5,1],[N.Fs5,2],
      [N.G5,1],[N.B5,1],[N.A5,2],[N.G5,1],[N.Fs5,1],[N.D5,2],
    ],
    bass: pumpBass([N.D3, N.A2, N.B2, N.G2, N.D3, N.A2, N.B2, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.Fs5,2],[N.A5,2],[N.D6,2],[N.A5,2],
      [N.E5,2],[N.A5,2],[N.Cs6,2],[N.A5,2],
      [N.Fs5,2],[N.B5,2],[N.D6,2],[N.B5,2],
      [N.G5,2],[N.B5,2],[N.D6,2],[N.B5,2],
    ],
    arps: [
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
      [N.B3, N.D4, N.Fs4, N.B4, N.D5, N.B4, N.Fs4, N.D4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
    ],
    chords: [
      [N.D4, N.Fs4, N.A4], [N.A3, N.Cs4, N.E4], [N.B3, N.D4, N.Fs4], [N.G3, N.B3, N.D4],
      [N.D4, N.Fs4, N.A4], [N.A3, N.Cs4, N.E4], [N.B3, N.D4, N.Fs4], [N.G3, N.B3, N.D4],
    ],
  },
];
