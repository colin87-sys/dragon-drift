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
  D2:73.42, E2:82.41, F2:87.31, G2:98.00, A2:110.00, Bb2:116.54, B2:123.47,
  C3:130.81, Cs3:138.59, D3:146.83, Ds3:155.56, E3:164.81, F3:174.61, Fs3:185.00,
  G3:196.00, Gs3:207.65, A3:220.00, Bb3:233.08, B3:246.94,
  C4:261.63, Cs4:277.18, D4:293.66, Ds4:311.13, E4:329.63, F4:349.23, Fs4:369.99,
  G4:392.00, Gs4:415.30, A4:440.00, Bb4:466.16, B4:493.88,
  C5:523.25, Cs5:554.37, D5:587.33, Ds5:622.25, E5:659.25, F5:698.46,
  Fs5:739.99, G5:783.99, Gs5:830.61, A5:880.00, Bb5:932.33, B5:987.77,
  C6:1046.50, Cs6:1108.73, D6:1174.66, Ds6:1244.51, E6:1318.51,
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

export function offBass(roots) {
  // Hardstyle off-beat bass: silence ON the beat (where the kick punches),
  // bass stab OFF the beat — the gallop that drives the genre.
  const out = [];
  for (const root of roots) {
    for (let i = 0; i < 4; i++) out.push([0, 1], [root, 1]);
  }
  return out;
}

export function funkBass(roots) {
  // Syncopated disco-house bass: root jabs, octave pops, ghost rests.
  const out = [];
  for (const root of roots) {
    out.push([root, 1], [0, 1], [root, 1], [root * 2, 1], [0, 1], [root * 1.5, 1], [root, 1], [root * 2, 1]);
  }
  return out;
}

// Per-station "remaster" mix presets. Each scales how the shared engine voices a
// station: `reverb` (space), `pump` (sidechain depth), `width` (stereo spread),
// `drive` (bass saturation), `bright` (filter openness). 1.0 = the neutral global
// default, so omitting a field leaves that dimension at the engine's baseline.
// Genres share a preset; one-offs spread + override, e.g. { ...MIX.trance, bright: 1.25 }.
export const MIX = {
  anthem:    { reverb: 1.0,  pump: 1.0,  width: 1.05, drive: 1.0,  bright: 1.05 }, // chiptune-pop
  epic:      { reverb: 1.6,  pump: 0.9,  width: 1.2,  drive: 1.0,  bright: 0.9  }, // orchestral, lush+warm (slow/cinematic)
  epicdrive: { reverb: 1.3,  pump: 1.05, width: 1.2,  drive: 1.1,  bright: 1.0  }, // driving battle-epic, keeps kick punch
  trance:    { reverb: 1.5,  pump: 1.1,  width: 1.3,  drive: 1.05, bright: 1.2  }, // wide, bright, euphoric
  bigroom:   { reverb: 1.15, pump: 1.2,  width: 1.1,  drive: 1.15, bright: 1.15 }, // punchy, some space
  hardstyle: { reverb: 0.8,  pump: 1.2,  width: 1.0,  drive: 1.3,  bright: 1.1  }, // dry, hard, gritty
  dnb:       { reverb: 0.6,  pump: 1.1,  width: 1.1,  drive: 1.25, bright: 1.1  }, // bone-dry, punchy
  liquid:    { reverb: 1.1,  pump: 1.0,  width: 1.2,  drive: 1.0,  bright: 1.05 }, // rolling, airier D&B
  synthwave: { reverb: 1.25, pump: 1.0,  width: 1.25, drive: 1.05, bright: 1.1  }, // neon, wide
  lofi:      { reverb: 0.7,  pump: 0.8,  width: 0.85, drive: 0.9,  bright: 0.8  }, // warm, narrow, dry
  house:     { reverb: 0.95, pump: 1.1,  width: 1.1,  drive: 1.05, bright: 1.05 }, // groove punch
  tropical:  { reverb: 1.2,  pump: 0.95, width: 1.15, drive: 0.95, bright: 0.95 }, // sunny, soft
  futurebass:{ reverb: 1.45, pump: 0.9,  width: 1.3,  drive: 0.95, bright: 0.9  }, // lush, wide, soft
  idol:      { reverb: 1.1,  pump: 1.1,  width: 1.15, drive: 1.0,  bright: 1.1  }, // clean, bright, wide
  world:     { reverb: 1.05, pump: 0.85, width: 1.1,  drive: 0.95, bright: 0.95 }, // organic
  celtic:    { reverb: 0.9,  pump: 0.7,  width: 1.05, drive: 0.9,  bright: 1.0  }, // acoustic-ish, low pump
  rock:      { reverb: 0.85, pump: 1.15, width: 1.05, drive: 1.25, bright: 1.15 }, // dry, punchy anthem
};

// ============================ DRAGON RADIO ============================
export const TRACKS = [
  { // 0 — the original anthem, refined
    id: 'skyborne',
    mix: { ...MIX.anthem, trimDb: -5.0 },
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
    mix: { ...MIX.epic, trimDb: -5.7 },
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
    mix: { ...MIX.synthwave, trimDb: -5.3 },
    name: 'Ember Rush',
    desc: 'Pumping synthwave neon',
    cost: 0,
    bpm: 128,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.13, stack: 'detune', inst: 'supersaw' },
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
    mix: { ...MIX.lofi, trimDb: -4.5 },
    name: 'Moonlit Drift',
    desc: 'Mellow lo-fi glide',
    cost: 0,
    bpm: 85,
    swing: 0.18,
    voices: {
      melody: { osc: 'triangle', vol: 0.16, inst: 'fmEP' },   // FM Rhodes — the lofi keys
      bass:   { osc: 'sine', vol: 0.24 },
      high:   { osc: 'sine', vol: 0.1, inst: 'pluck' },       // Karplus guitar sparkle
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
  // All premium stations cost the same — pick by taste, not by price tag.
  { // 4 — festival big-room anthem: fat detuned hook over a four-chord pump
    id: 'neon',
    mix: { ...MIX.bigroom, trimDb: -6.7 },
    name: 'Neon Apex',
    desc: 'Festival anthem — fat detuned hook',
    cost: 800,
    bpm: 138,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune', inst: 'supersaw' },
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
    mix: { ...MIX.dnb, trimDb: -8.3 },
    name: 'Stormchaser',
    desc: 'Breakneck D&B chase',
    cost: 800,
    bpm: 172,
    voices: {
      melody: { osc: 'square', vol: 0.14, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'triangle', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.2, snare: 1.15, hat: 1.1, heavy: true },
    // Groove hero (dnb): two-step break — kick on 1 + the and-of-3, backbeat
    // snares with ghost notes, shuffled hats. NOT four-on-the-floor.
    groove: {
      grid: {
        kick:  'x.........x.....',
        snare: '....x..g....x..g',
        hat:   'x.gxx.g.x.gxx.g.',
      },
      hatVel: [1, 0.6, 0.85, 0.6],
    },
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
  { // 6 — golden hardstyle hymn in D major: insistent fanfare motif, big
    // leaps, off-beat drive — rebuilt for catchiness.
    id: 'solarc',
    mix: { ...MIX.hardstyle, trimDb: -4.7 },
    name: 'Solar Cathedral',
    desc: 'Euphoric golden hardstyle hymn',
    cost: 800,
    bpm: 130,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.15, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.1 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.2, snare: 0.95, hat: 0.85, heavy: true },
    pad: true,
    melody: [
      [N.D5,1],[N.D5,1],[N.Fs5,1],[N.A5,1],[N.D6,2],[N.A5,1],[N.Fs5,1],
      [N.Cs6,1],[N.B5,1],[N.A5,1],[N.B5,1],[N.Cs6,2],[N.E5,2],
      [N.D6,1],[N.Cs6,1],[N.B5,1],[N.Cs6,1],[N.D6,2],[N.Fs5,2],
      [N.G5,1],[N.A5,1],[N.B5,2],[N.A5,2],[N.D5,2],
      [N.D6,2],[N.A5,1],[N.Fs5,1],[N.D5,2],[N.Fs5,2],
      [N.E6,2],[N.Cs6,1],[N.A5,1],[N.E5,2],[N.A5,2],
      [N.D6,2],[N.B5,1],[N.Fs5,1],[N.B5,2],[N.D6,2],
      [N.B5,2],[N.A5,1],[N.G5,1],[N.Fs5,2],[N.A5,2],
    ],
    bass: offBass([N.D3, N.A2, N.B2, N.G2, N.D3, N.A2, N.B2, N.G2]),
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

  // ============ THE COLLECTION (style studies of iconic sounds) ============
  { // 7 — K-pop dance-pop study: chant verse, octave-jump chorus, disco pump
    id: 'seoul',
    mix: { ...MIX.idol, trimDb: -5.2 },
    name: 'Neon Seoul',
    desc: 'Idol dance-pop — chant verse, big chorus',
    cost: 800,
    bpm: 125,
    voices: {
      melody: { osc: 'square', vol: 0.15, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.16 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'square', vol: 0.09 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.1, snare: 1.05, hat: 0.95, heavy: true },
    pad: true,
    melody: [
      [N.E5,1],[N.E5,1],[0,1],[N.G5,1],[0,1],[N.A5,1],[0,1],[N.G5,1],
      [N.E5,1],[N.D5,1],[N.C5,2],[0,1],[N.D5,1],[N.E5,2],
      [N.F5,1],[N.F5,1],[0,1],[N.A5,1],[0,1],[N.C6,1],[0,1],[N.A5,1],
      [N.G5,1],[N.E5,1],[N.D5,2],[N.E5,4],
      [N.E5,2],[N.G5,2],[N.A5,2],[N.G5,2],
      [N.E5,2],[N.G5,2],[N.A5,2],[N.G5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.B5,2],
      [N.A5,2],[N.G5,2],[N.E5,2],[N.A4,2],
    ],
    bass: pumpBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.C6,2],[N.A5,2],[N.G5,2],[N.E5,2],
      [N.C6,2],[N.A5,2],[N.G5,2],[N.E5,2],
      [N.C6,2],[N.A5,2],[N.G5,2],[N.E5,2],
      [N.A5,4],[N.E5,4],
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
  { // 8 — girl-crush EDM-trap study: minor-key menace, sub-808, harmonic-
    // minor sting on the B chord
    id: 'crown',
    mix: { ...MIX.bigroom, reverb: 1.2, trimDb: -6.6 },
    name: 'Velvet Crown',
    desc: 'Girl-crush EDM-trap — sub-808 menace',
    cost: 800,
    bpm: 142,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sine', vol: 0.28 },
      high:   { osc: 'square', vol: 0.08 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.25, snare: 1.15, hat: 1.0, heavy: true },
    pad: true,
    melody: [
      [N.E5,2],[0,1],[N.G5,1],[N.Fs5,1],[N.E5,1],[N.B4,2],
      [0,1],[N.E5,1],[N.G5,1],[N.B5,2],[N.A5,1],[N.G5,1],[N.Fs5,1],
      [N.A5,2],[0,1],[N.C6,1],[N.B5,1],[N.A5,1],[N.E5,2],
      [N.Fs5,1],[N.G5,1],[N.Fs5,1],[N.Ds5,1],[N.B4,4],
      [N.E5,2],[N.G5,2],[N.B5,2],[N.A5,2],
      [N.E5,2],[N.G5,2],[N.B5,2],[N.A5,2],
      [N.E5,2],[N.G5,2],[N.Ds6,2],[N.B5,2],
      [N.A5,2],[N.G5,2],[N.E5,2],[N.B4,2],
    ],
    bass: slowBass([N.E2, N.C3, N.A2, N.B2, N.E2, N.C3, N.A2, N.B2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.B4,2],[N.E5,2],[N.G5,2],[N.B5,2],
      [N.C5,2],[N.E5,2],[N.A5,2],[N.E5,2],
      [N.A4,2],[N.C5,2],[N.E5,2],[N.C5,2],
      [N.B4,2],[N.Ds5,2],[N.Fs5,2],[N.B5,2],
    ],
    arps: [
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.B3, N.Ds4, N.Fs4, N.B4, N.Ds5, N.B4, N.Fs4, N.Ds4],
    ],
    chords: [
      [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4], [N.A3, N.C4, N.E4], [N.B3, N.Ds4, N.Fs4],
      [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4], [N.A3, N.C4, N.E4], [N.B3, N.Ds4, N.Fs4],
    ],
  },
  { // 9 — uplifting trance study: long rising phrases, supersaw shimmer
    id: 'stratos',
    mix: { ...MIX.trance, trimDb: -6.3 },
    name: 'Stratosphere',
    desc: 'Uplifting trance — endless climb',
    cost: 800,
    bpm: 138,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.13, inst: 'supersaw' },  // wide trance lead
      bass:   { osc: 'sawtooth', vol: 0.16 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'sawtooth', vol: 0.11 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.1, snare: 0.95, hat: 1.0, heavy: true },
    pad: true,
    melody: [
      [N.A4,1],[N.C5,1],[N.E5,2],[N.D5,1],[N.E5,1],[N.A5,2],
      [N.G5,1],[N.F5,1],[N.E5,1],[N.D5,1],[N.C5,2],[N.F5,2],
      [N.E5,1],[N.G5,1],[N.C6,2],[N.B5,1],[N.G5,1],[N.E5,2],
      [N.D5,1],[N.G5,1],[N.B5,2],[N.A5,1],[N.G5,1],[N.D5,2],
      [N.A5,2],[N.C6,2],[N.E6,2],[N.C6,2],
      [N.A5,2],[N.C6,2],[N.E6,2],[N.C6,2],
      [N.A5,2],[N.C6,2],[N.E6,4],
      [N.D6,2],[N.C6,2],[N.A5,2],[N.G4,2],
    ],
    bass: pumpBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,2],[N.C6,2],[N.A5,2],[N.E5,2],
      [N.F5,2],[N.C6,2],[N.A5,2],[N.F5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.G5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
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
  { // 10 — big-room festival study: three-note stadium hook, maximum kick
    id: 'titan',
    mix: { ...MIX.bigroom, trimDb: -6.7 },
    name: 'Titan Drop',
    desc: 'Big-room festival — stadium hook',
    cost: 800,
    bpm: 128,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.15, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'square', vol: 0.08 },
      arp:    { osc: 'sawtooth', vol: 0.11 },
      lead:   { osc: 'square', vol: 0.1 },
    },
    drums: { kick: 1.3, snare: 1.1, hat: 0.85, heavy: true },
    pad: true,
    melody: [
      [N.A4,1],[N.A4,1],[0,1],[N.A4,1],[N.A5,2],[N.G5,2],
      [N.F5,1],[N.F5,1],[0,1],[N.F5,1],[N.A5,2],[N.C6,2],
      [N.G5,1],[N.G5,1],[0,1],[N.B5,1],[N.D6,2],[N.B5,2],
      [N.C6,1],[N.B5,1],[N.A5,2],[N.E5,2],[N.A4,2],
      [N.A5,2],[N.A5,2],[N.C6,2],[N.B5,2],
      [N.A5,2],[N.A5,2],[N.C6,2],[N.B5,2],
      [N.A5,2],[N.A5,2],[N.C6,2],[N.B5,2],
      [N.E6,2],[N.D6,2],[N.C6,2],[N.A5,2],
    ],
    bass: pumpBass([N.A2, N.F2, N.G2, N.A2, N.A2, N.F2, N.G2, N.A2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.A5,2],[N.E5,2],[N.C6,2],[N.E5,2],
      [N.A5,2],[N.F5,2],[N.C6,2],[N.F5,2],
      [N.B5,2],[N.G5,2],[N.D6,2],[N.G5,2],
      [N.C6,2],[N.A5,2],[N.E6,2],[N.A5,2],
    ],
    arps: [
      [N.A3, N.E4, N.A4, N.C5, N.E5, N.C5, N.A4, N.E4],
      [N.F3, N.C4, N.F4, N.A4, N.C5, N.A4, N.F4, N.C4],
      [N.G3, N.D4, N.G4, N.B4, N.D5, N.B4, N.G4, N.D4],
      [N.A3, N.E4, N.A4, N.C5, N.E5, N.C5, N.A4, N.E4],
    ],
    chords: [
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4],
      [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4],
    ],
  },
  { // 11 — hardstyle study: off-beat gallop bass, insistent euphoric motif
    id: 'hardlight',
    mix: { ...MIX.hardstyle, trimDb: -6.1 },
    name: 'Hardlight',
    desc: 'Hardstyle — off-beat gallop, euphoric hook',
    cost: 800,
    bpm: 150,
    voices: {
      melody: { osc: 'square', vol: 0.15, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.2 },
      high:   { osc: 'triangle', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.12 },
    },
    drums: { kick: 1.35, snare: 1.0, hat: 1.0, heavy: true },
    pad: false,
    melody: [
      [N.E5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.B5,2],[N.A5,1],[N.G5,1],
      [N.A5,1],[N.G5,1],[N.E5,1],[N.G5,1],[N.C6,2],[N.B5,1],[N.A5,1],
      [N.B5,1],[N.A5,1],[N.G5,1],[N.A5,1],[N.B5,2],[N.D6,2],
      [N.A5,1],[N.B5,1],[N.A5,1],[N.Fs5,1],[N.D5,2],[N.Fs5,2],
      [N.E5,2],[N.G5,2],[N.A5,2],[N.B5,2],
      [N.E5,2],[N.G5,2],[N.A5,2],[N.B5,2],
      [N.E5,2],[N.G5,2],[N.A5,2],[N.B5,2],
      [N.D6,4],[N.B5,2],[N.G5,2],
    ],
    bass: offBass([N.E2, N.C3, N.G2, N.D3, N.E2, N.C3, N.G2, N.D3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.B4,2],[N.E5,2],[N.G5,2],[N.B5,2],
      [N.C5,2],[N.E5,2],[N.G5,2],[N.C6,2],
      [N.B4,2],[N.D5,2],[N.G5,2],[N.B5,2],
      [N.A4,2],[N.D5,2],[N.Fs5,2],[N.A5,2],
    ],
    arps: [
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
    ],
    chords: null,
  },
  { // 12 — synthwave retro-pop study: night-drive arp, chrome and neon
    id: 'chrome',
    mix: { ...MIX.synthwave, trimDb: -5.6 },
    name: 'Midnight Chrome',
    desc: 'Synthwave night-drive — retro arp',
    cost: 800,
    bpm: 122,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.13, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.16 },
      high:   { osc: 'square', vol: 0.08 },
      arp:    { osc: 'sawtooth', vol: 0.12 },
      lead:   { osc: 'square', vol: 0.1 },
    },
    drums: { kick: 1.05, snare: 1.0, hat: 0.9, heavy: true },
    pad: true,
    melody: [
      [N.D5,1],[N.F5,1],[N.A5,2],[N.G5,1],[N.F5,1],[N.E5,2],
      [N.D5,1],[N.F5,1],[N.Bb5,2],[N.A5,1],[N.F5,1],[N.D5,2],
      [N.C5,1],[N.F5,1],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.G5,1],[N.E5,1],[N.C5,2],[N.D5,2],[N.E5,2],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.F5,2],[N.A5,1],[N.Bb5,1],[N.A5,1],[N.G5,1],
      [N.Bb5,4],[N.A5,2],[N.D5,2],
    ],
    bass: pumpBass([N.D3, N.Bb2, N.F2, N.C3, N.D3, N.Bb2, N.F2, N.C3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.D5,2],[N.A5,2],[N.F5,2],[N.A5,2],
      [N.D5,2],[N.Bb5,2],[N.F5,2],[N.Bb5,2],
      [N.C5,2],[N.A5,2],[N.F5,2],[N.A5,2],
      [N.C5,2],[N.G5,2],[N.E5,2],[N.G5,2],
    ],
    arps: [
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
      [N.Bb3, N.D4, N.F4, N.Bb4, N.D5, N.Bb4, N.F4, N.D4],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
    ],
    chords: [
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4],
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4],
    ],
  },
  { // 13 — future bass: "lift-and-sigh" identity — rising-6th leap hook, halftime chop,
    //   call-response gaps. Only leap-first hook in the catalogue. Cmaj7 palette.
    id: 'bloom',
    mix: { ...MIX.futurebass, trimDb: -6.2 },
    name: 'Aurora Bloom',
    desc: 'Future bass — lift-and-sigh, rising-sixth hook',
    cost: 800,
    bpm: 100,
    swing: 0.14,
    voices: {
      melody: { osc: 'triangle', vol: 0.18, stack: 'octave', inst: 'supersaw' },
      bass:   { osc: 'sine', vol: 0.26 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'sawtooth', vol: 0.09 },
    },
    drums: { kick: 0.7, snare: 0.6, hat: 0.55, heavy: false },
    pad: true,
    // Verse bars 1-4: rising-6th lift (C→A), sigh back down stepwise; rest punctuation
    // Chorus bars 5-8: halftime chop — 2-beat holds with rests between
    melody: [
      [N.E5,2],[N.G5,2],[N.C6,3],[0,1],
      [N.A5,2],[N.G5,2],[N.E5,3],[0,1],
      [N.F5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.G5,2],[N.D5,2],[N.G5,3],[0,1],
      [N.C6,3],[N.B5,1],[N.G5,2],[N.E5,2],
      [N.A5,3],[N.G5,1],[N.E5,2],[N.C5,2],
      [N.F5,2],[N.A5,2],[N.D6,3],[0,1],
      [N.B5,2],[N.A5,2],[N.G5,2],[N.D5,2],
    ],
    bass: slowBass([N.C3, N.A2, N.F2, N.G2, N.C3, N.A2, N.F2, N.G2]),
    // High voice answers in the gaps (call-and-response, not parallel doubling)
    high: [
      [0,4],[N.G5,2],[0,2],
      [0,4],[N.E5,2],[0,2],
      [0,8],
      [0,4],[N.D5,2],[0,2],
      [N.E5,2],[0,2],[N.C5,2],[0,2],
      [N.C5,2],[0,2],[N.A4,2],[0,2],
      [0,4],[N.A5,2],[0,2],
      [0,2],[N.G5,2],[0,2],[N.D5,2],
    ],
    arps: [
      [N.C4, N.E4, N.G4, N.B4, N.E5, N.B4, N.G4, N.E4],
      [N.A3, N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4],
      [N.F3, N.A3, N.C4, N.E4, N.A4, N.E4, N.C4, N.A3],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
    ],
    chords: [
      [N.C4, N.E4, N.G4, N.B4], [N.A3, N.C4, N.E4, N.G4], [N.F3, N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4, N.F4],
      [N.C4, N.E4, N.G4, N.B4], [N.A3, N.C4, N.E4, N.G4], [N.F3, N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4, N.F4],
    ],
  },
  { // 14 — liquid drum&bass study: rolling jazz sevenths, airborne top line
    id: 'slips',
    mix: { ...MIX.liquid, trimDb: -7.8 },
    name: 'Slipstream',
    desc: 'Liquid D&B — rolling, airborne',
    cost: 800,
    bpm: 174,
    swing: 0.08,
    voices: {
      melody: { osc: 'triangle', vol: 0.16, inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.09 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.15, snare: 1.2, hat: 1.15, heavy: true },
    // Groove hero (liquid dnb): rolling break — displaced second kick, clean
    // backbeats, a 16th hat wash with a velocity wave.
    groove: {
      grid: {
        kick:  'x.....x...x.....',
        snare: '....x.......x...',
        hat:   'xxxxxxxxxxxxxxxx',
      },
      hatVel: [1, 0.45, 0.7, 0.45],
    },
    pad: false,
    melody: [
      [N.E5,1],[N.G5,1],[N.A5,2],[N.G5,1],[N.E5,1],[N.C5,2],
      [N.D5,1],[N.F5,1],[N.A5,2],[N.C6,1],[N.A5,1],[N.F5,2],
      [N.G5,1],[N.B5,1],[N.D6,2],[N.B5,1],[N.G5,1],[N.D5,2],
      [N.E5,1],[N.G5,1],[N.B5,1],[N.C6,1],[N.G5,2],[N.E5,2],
      [N.A5,2],[N.C6,2],[N.B5,2],[N.A5,2],
      [N.A5,2],[N.C6,2],[N.B5,2],[N.A5,2],
      [N.A5,2],[N.C6,2],[N.B5,2],[N.A5,2],
      [N.D6,4],[N.A5,2],[N.E5,2],
    ],
    bass: pumpBass([N.A2, N.D3, N.G2, N.C3, N.A2, N.D3, N.G2, N.C3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.C5,2],[N.E5,2],[N.A5,2],[N.E5,2],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.F5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.G5,2],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4],
      [N.D4, N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.F4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.C4, N.E4, N.G4, N.B4, N.E5, N.B4, N.G4, N.E4],
    ],
    chords: null,
  },
  { // 15 — French/disco house study: filtered funk, staccato hook, ghost rests
    id: 'goldrush',
    mix: { ...MIX.house, trimDb: -4.7 },
    name: 'Gold Rush Groove',
    desc: 'French house — filtered disco funk',
    cost: 800,
    bpm: 124,
    swing: 0.12,
    voices: {
      melody: { osc: 'square', vol: 0.12, inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'triangle', vol: 0.1 },
      arp:    { osc: 'sawtooth', vol: 0.09 },
      lead:   { osc: 'square', vol: 0.1 },
    },
    drums: { kick: 1.1, snare: 0.95, hat: 1.05, heavy: true },
    pad: true,
    melody: [
      [N.C5,1],[0,1],[N.E5,1],[0,1],[N.G5,1],[N.E5,1],[0,1],[N.A4,1],
      [N.D5,1],[0,1],[N.F5,1],[0,1],[N.A5,1],[N.F5,1],[0,1],[N.D5,1],
      [N.B4,1],[0,1],[N.D5,1],[N.G5,1],[0,1],[N.F5,1],[N.D5,1],[N.B4,1],
      [N.C5,1],[N.E5,1],[N.G5,2],[N.E5,1],[N.C5,1],[N.G4,2],
      [N.A5,2],[N.G5,2],[N.E5,2],[N.G5,2],
      [N.A5,2],[N.G5,2],[N.E5,2],[N.G5,2],
      [N.A5,2],[N.G5,2],[N.E5,1],[N.F5,1],[N.G5,1],[N.A5,1],
      [N.C6,2],[N.A5,2],[N.F5,4],
    ],
    bass: funkBass([N.A2, N.D3, N.G2, N.C3, N.A2, N.D3, N.G2, N.C3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,2],[N.C5,2],[N.A4,2],[N.C5,2],
      [N.F5,2],[N.D5,2],[N.A4,2],[N.D5,2],
      [N.G5,2],[N.D5,2],[N.B4,2],[N.D5,2],
      [N.G5,2],[N.E5,2],[N.C5,2],[N.E5,2],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.C4],
      [N.D4, N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.F4],
      [N.G3, N.B3, N.D4, N.F4, N.B4, N.F4, N.D4, N.B3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
    ],
    chords: [
      [N.A3, N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4, N.C5], [N.G3, N.B3, N.D4, N.F4], [N.C4, N.E4, N.G4],
      [N.A3, N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4, N.C5], [N.G3, N.B3, N.D4, N.F4], [N.C4, N.E4, N.G4],
    ],
  },
  { // 16 — tropical house study: steel-pan bounce, easy major-key sway
    id: 'lagoon',
    mix: { ...MIX.tropical, trimDb: -4.1 },
    name: 'Crystal Lagoon',
    desc: 'Tropical house — steel-pan bounce',
    cost: 800,
    bpm: 104,
    swing: 0.12,
    voices: {
      melody: { osc: 'triangle', vol: 0.19, stack: 'octave', inst: 'pluck' },
      bass:   { osc: 'sine', vol: 0.24 },
      high:   { osc: 'sine', vol: 0.1 },
      arp:    { osc: 'triangle', vol: 0.09 },
      lead:   { osc: 'triangle', vol: 0.1 },
    },
    drums: { kick: 0.9, snare: 0.7, hat: 0.8, heavy: false },
    pad: true,
    melody: [
      [N.D5,1],[N.G5,1],[N.B5,2],[N.A5,1],[N.G5,1],[N.D5,2],
      [N.E5,1],[N.G5,1],[N.B5,2],[N.G5,1],[N.E5,1],[N.B4,2],
      [N.C5,1],[N.E5,1],[N.G5,2],[N.E5,2],[N.C5,2],
      [N.D5,1],[N.Fs5,1],[N.A5,2],[N.Fs5,1],[N.D5,1],[N.A4,2],
      [N.B5,2],[N.D6,2],[N.B5,2],[N.G5,2],
      [N.B5,2],[N.D6,2],[N.B5,2],[N.G5,2],
      [N.B5,2],[N.D6,2],[N.B5,1],[N.C6,1],[N.D6,2],
      [N.E6,4],[N.D6,2],[N.B5,2],
    ],
    bass: pumpBass([N.G2, N.E2, N.C3, N.D3, N.G2, N.E2, N.C3, N.D3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.B4,2],[N.D5,2],[N.G5,2],[N.D5,2],
      [N.B4,2],[N.E5,2],[N.G5,2],[N.E5,2],
      [N.C5,2],[N.E5,2],[N.G5,2],[N.E5,2],
      [N.A4,2],[N.D5,2],[N.Fs5,2],[N.D5,2],
    ],
    arps: [
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
    ],
    chords: [
      [N.G3, N.B3, N.D4], [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4], [N.D4, N.Fs4, N.A4],
      [N.G3, N.B3, N.D4], [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4], [N.D4, N.Fs4, N.A4],
    ],
  },
  { // 17 — Japanese touge drift: D-major racing hook, detuned saws
    id: 'driftking',
    mix: { ...MIX.synthwave, trimDb: -6.8 },
    name: 'Drift King',
    desc: 'Touge racing — detuned saw hook',
    cost: 800,
    bpm: 140,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.2, snare: 1.05, hat: 1.0, heavy: true },
    pad: true,
    melody: [
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.G5,2],
      [N.Fs5,2],[N.D5,2],[N.A4,2],[N.D5,2],
      [N.G5,2],[N.A5,2],[N.B5,2],[N.A5,2],
      [N.Fs5,2],[N.E5,2],[N.D5,4],
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.Fs5,2],[N.A5,1],[N.B5,1],[N.A5,1],[N.G5,1],
      [N.B5,4],[N.A5,2],[N.D5,2],
    ],
    bass: pumpBass([N.D3, N.B2, N.G2, N.A2, N.D3, N.B2, N.G2, N.A2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.Fs5,2],[N.A5,2],[N.D6,2],[N.A5,2],
      [N.Fs5,2],[N.D5,2],[N.A4,2],[N.D5,2],
      [N.G5,2],[N.B5,2],[N.D6,2],[N.B5,2],
      [N.A5,2],[N.E5,2],[N.A4,2],[N.E5,2],
    ],
    arps: [
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.B3, N.D4, N.Fs4, N.B4, N.D5, N.B4, N.Fs4, N.D4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
    ],
    chords: [
      [N.D4, N.Fs4, N.A4], [N.B3, N.D4, N.Fs4], [N.G3, N.B3, N.D4], [N.A3, N.Cs4, N.E4],
      [N.D4, N.Fs4, N.A4], [N.B3, N.D4, N.Fs4], [N.G3, N.B3, N.D4], [N.A3, N.Cs4, N.E4],
    ],
  },
  { // 18 — Epic march: 3+3+2 hemiola hook, G-mixolydian (bVII = F♮ chord),
    //   112 bpm (statelier than Drift King's 140), horn-call rising fourths.
    //   Only hemiola track in the catalogue; high voice echoes 1 bar behind.
    id: 'banner',
    mix: { ...MIX.epicdrive, trimDb: -6.1 },
    name: 'Banner',
    desc: 'Epic march — 3+3+2 hemiola, G-mixolydian horn call',
    cost: 800,
    bpm: 112,
    voices: {
      melody: { osc: 'square', vol: 0.15, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.3, snare: 1.15, hat: 0.9, heavy: true },
    pad: true,
    // Verse: rising-fourth march call (G→C→F—the bVII gives mixolydian color)
    // Chorus: 3+3+2 hemiola — note groups [3,3,2] cut across the 8-eighth bar
    melody: [
      [N.G5,2],[N.G5,1],[N.A5,1],[N.B5,2],[N.D6,2],
      [N.C6,4],[N.B5,2],[N.A5,2],
      [N.G5,2],[N.A5,1],[N.B5,1],[N.C6,2],[N.D6,2],
      [N.D6,2],[N.C6,2],[N.B5,2],[N.A5,2],
      [N.D6,2],[N.B5,2],[N.G5,2],[N.B5,2],
      [N.C6,2],[N.A5,2],[N.F5,2],[N.A5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.E6,2],
      [N.D6,4],[N.A5,2],[N.G5,2],
    ],
    bass: pumpBass([N.G2, N.F2, N.C3, N.D3, N.G2, N.F2, N.C3, N.D3]),
    // High voice: silent bars 1-2, answers in gaps bars 3-4, echoes canon bars 5-8
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.G5,2],[N.D6,2],[N.B5,2],[N.D6,2],
      [N.A5,2],[N.C6,2],[N.F5,2],[N.C6,2],
      [N.G5,2],[N.C6,2],[N.E5,2],[N.G5,2],
      [N.D6,2],[N.B5,2],[N.G5,2],[N.D5,2],
    ],
    arps: [
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
    ],
    chords: [
      [N.G3, N.B3, N.D4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4],
      [N.G3, N.B3, N.D4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.D4, N.F4, N.A4],
    ],
  },
  { // 19 — Celtic reel: only drone-bass track. A-dorian (F♯ color), bagpipe pedal,
    //   continuous-eighth reel runs, jig-lilt [2,1,1,2,1,1] chorus cell.
    //   Bodhrán-style hat-forward drum mix. 128 bpm (reel tempo).
    id: 'pipers',
    mix: { ...MIX.celtic, trimDb: -4.7 },
    name: 'The Pipers',
    desc: 'Celtic reel — drone bass, A-dorian jig-lilt',
    cost: 800,
    bpm: 128,
    voices: {
      melody: { osc: 'triangle', vol: 0.18, inst: 'pluck' },   // plucked harp/strings
      bass:   { osc: 'sine', vol: 0.24 },
      high:   { osc: 'triangle', vol: 0.1 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'sawtooth', vol: 0.09 },
    },
    drums: { kick: 0.6, snare: 0.5, hat: 1.2, heavy: false },
    pad: false,
    // Continuous-eighth reel runs with A-dorian color (F♯ in bar 2/4)
    melody: [
      [N.A5,1],[N.E5,1],[N.A5,1],[N.B5,1],[N.C6,1],[N.B5,1],[N.A5,1],[N.E5,1],
      [N.A5,1],[N.E5,1],[N.A5,1],[N.G5,1],[N.Fs5,1],[N.G5,1],[N.E5,1],[N.D5,1],
      [N.E5,1],[N.Fs5,1],[N.G5,1],[N.A5,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],
      [N.D5,1],[N.E5,1],[N.Fs5,1],[N.D5,1],[N.E5,2],[N.A4,2],
      [N.A5,2],[N.B5,1],[N.C6,1],[N.B5,2],[N.A5,2],
      [N.E5,2],[N.Fs5,1],[N.G5,1],[N.A5,2],[N.E5,2],
      [N.A5,2],[N.G5,1],[N.Fs5,1],[N.E5,2],[N.D5,2],
      [N.E5,1],[N.Fs5,1],[N.A5,2],[N.B5,2],[N.A5,2],
    ],
    // Drone bass: static root A on every bar — the bagpipe pedal
    bass: (function droneBass() {
      const out = [];
      for (let i = 0; i < 8; i++) out.push([N.A2, 4], [N.A2, 4]);
      return out;
    })(),
    // High voice jig-lilt in chorus (bars 5-8): [2,1,1,2,1,1] cell
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.A5,2],[N.C6,2],[N.E5,2],[N.A5,2],
      [N.G5,2],[N.E5,2],[N.A5,2],[N.E5,2],
      [N.A5,2],[N.Fs5,2],[N.E5,2],[N.D5,2],
      [N.E5,2],[N.A5,2],[N.B5,2],[N.E5,2],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.E3, N.A3, N.C4, N.E4, N.A4, N.E4, N.C4, N.A3],
    ],
    chords: null,
  },
  { // 20 — Chinese-inspired EDM: D-minor pentatonic, red-lantern energy
    id: 'vermilion',
    mix: { ...MIX.bigroom, trimDb: -6.5 },
    name: 'Vermilion',
    desc: 'Chinese EDM — red-lantern pentatonic drive',
    cost: 800,
    bpm: 130,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'square', vol: 0.1 },
    },
    drums: { kick: 1.2, snare: 1.0, hat: 0.95, heavy: true },
    pad: true,
    melody: [
      [N.D5,2],[N.F5,2],[N.A5,2],[N.C6,2],
      [N.A5,2],[N.G5,2],[N.F5,2],[N.D5,2],
      [N.G5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.F5,2],[N.D5,2],[N.A4,4],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.G5,2],
      [N.D5,2],[N.F5,2],[N.A5,1],[N.C6,1],[N.A5,1],[N.G5,1],
      [N.C6,4],[N.A5,2],[N.D5,2],
    ],
    bass: pumpBass([N.D3, N.A2, N.C3, N.G2, N.D3, N.A2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.A4,2],[N.D5,2],[N.F5,2],[N.A5,2],
      [N.A4,2],[N.C5,2],[N.E5,2],[N.A5,2],
      [N.C5,2],[N.G5,2],[N.C6,2],[N.G5,2],
      [N.D5,2],[N.F5,2],[N.A5,2],[N.D6,2],
    ],
    arps: [
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
    ],
    chords: [
      [N.D4, N.F4, N.A4], [N.A3, N.C4, N.E4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
      [N.D4, N.F4, N.A4], [N.A3, N.C4, N.E4], [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4],
    ],
  },
  { // 21 — Disco-pop revival: A-major glitter, ABBA-energy hook
    id: 'mirrorball',
    mix: { ...MIX.house, trimDb: -5.0 },
    name: 'Mirrorball',
    desc: 'Disco-pop revival — glitter and joy',
    cost: 800,
    bpm: 115,
    voices: {
      melody: { osc: 'triangle', vol: 0.18, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.16 },
      high:   { osc: 'sine', vol: 0.1 },
      arp:    { osc: 'triangle', vol: 0.09 },
      lead:   { osc: 'triangle', vol: 0.1 },
    },
    drums: { kick: 0.95, snare: 0.9, hat: 1.0, heavy: false },
    pad: true,
    melody: [
      [N.A4,2],[N.Cs5,2],[N.E5,2],[N.A5,2],
      [N.Cs5,2],[N.A4,2],[N.E4,2],[N.A4,2],
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.D5,2],
      [N.E5,2],[N.Cs5,2],[N.A4,4],
      [N.A5,2],[N.Cs6,2],[N.E5,2],[N.Cs6,2],
      [N.A5,2],[N.Cs6,2],[N.E5,2],[N.Cs6,2],
      [N.A5,2],[N.Cs6,2],[N.E5,1],[N.Fs5,1],[N.A5,1],[N.B5,1],
      [N.D6,4],[N.Cs6,2],[N.A5,2],
    ],
    bass: pumpBass([N.A2, N.Fs3, N.D3, N.E3, N.A2, N.Fs3, N.D3, N.E3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.Cs5,2],[N.E5,2],[N.A5,2],[N.E5,2],
      [N.Fs5,2],[N.A5,2],[N.Cs6,2],[N.A5,2],
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.Fs5,2],
      [N.E5,2],[N.A5,2],[N.Cs6,2],[N.E6,2],
    ],
    arps: [
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
      [N.Fs3, N.A3, N.Cs4, N.Fs4, N.A4, N.Fs4, N.Cs4, N.A3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.E4, N.A4, N.Cs5, N.E5, N.A5, N.E5, N.Cs5, N.A4],
    ],
    chords: [
      [N.A3, N.Cs4, N.E4], [N.Fs3, N.A3, N.Cs4], [N.D4, N.Fs4, N.A4], [N.E4, N.Gs4, N.B4],
      [N.A3, N.Cs4, N.E4], [N.Fs3, N.A3, N.Cs4], [N.D4, N.Fs4, N.A4], [N.E4, N.Gs4, N.B4],
    ],
  },

  // ============ WORLD FLAVOURS ============
  { // 22 — Afrobeats study: syncopated bounce, call-response, conga flavour
    id: 'afrofire',
    mix: { ...MIX.world, trimDb: -4.0 },
    name: 'Afro Fire',
    desc: 'Afrobeats — syncopated bounce, call-response',
    cost: 800,
    bpm: 104,
    voices: {
      melody: { osc: 'triangle', vol: 0.17, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.2 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'triangle', vol: 0.1 },
    },
    drums: { kick: 1.0, snare: 0.9, hat: 1.1, heavy: false, shaker: 0.8, conga: 0.7 },
    pad: false,
    melody: [
      [N.E5,1],[0,1],[N.A5,1],[N.G5,1],[N.E5,2],[N.C5,1],[0,1],
      [N.D5,1],[N.E5,1],[N.C5,2],[0,1],[N.A4,1],[N.C5,2],
      [N.E5,1],[0,1],[N.G5,1],[N.A5,1],[N.C6,2],[N.A5,1],[N.G5,1],
      [N.E5,1],[N.D5,1],[N.C5,2],[N.E5,2],[0,2],
      [N.A5,1],[0,1],[N.C6,1],[N.B5,1],[N.A5,2],[N.G5,2],
      [N.E5,1],[N.G5,1],[N.A5,2],[0,1],[N.G5,1],[N.E5,2],
      [N.A5,1],[0,1],[N.C6,1],[N.A5,1],[N.G5,2],[N.E5,1],[N.D5,1],
      [N.E5,2],[N.C5,2],[N.A4,2],[N.E5,2],
    ],
    bass: funkBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.C6,2],[N.A5,2],[N.E5,2],[N.A5,2],
      [N.A5,2],[N.F5,2],[N.C5,2],[N.F5,2],
      [N.G5,2],[N.E5,2],[N.C5,2],[N.E5,2],
      [N.D5,2],[N.A5,2],[N.E5,2],[N.A5,2],
    ],
    arps: [
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
    ],
    chords: null,
  },
  { // 23 — Amapiano study: jazzy 7ths, deep log-drum groove, D-major soul
    id: 'mpiano',
    mix: { ...MIX.world, trimDb: -5.9 },
    name: 'Mpiano High',
    desc: 'Amapiano — jazzy 7ths, log-drum groove',
    cost: 800,
    bpm: 112,
    swing: 0.16,
    voices: {
      melody: { osc: 'triangle', vol: 0.17, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sine', vol: 0.27 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'sawtooth', vol: 0.1 },
    },
    drums: { kick: 1.1, snare: 0.8, hat: 1.3, heavy: false, logDrum: 0.9, shaker: 0.6 },
    // Groove hero (amapiano): the log drum leads — kick reduced to a bar
    // anchor, sparse late snares, OFFBEAT hats (never four-on-the-floor).
    groove: {
      grid: {
        kick:  'x...............',
        snare: '....x.......x..g',
        hat:   '..x...x...x...x.',
      },
      hatVel: [1, 0.7],
    },
    pad: true,
    melody: [
      [N.Fs5,2],[N.A5,1],[N.G5,1],[N.Fs5,2],[N.D5,2],
      [N.E5,2],[N.G5,1],[N.Fs5,1],[N.D5,2],[N.B4,2],
      [N.G5,2],[N.B5,1],[N.A5,1],[N.G5,2],[N.E5,2],
      [N.E5,2],[N.Cs5,2],[N.A4,2],[N.E5,2],
      [N.A5,2],[N.B5,1],[N.D6,1],[N.A5,2],[N.Fs5,2],
      [N.B5,2],[N.A5,1],[N.Fs5,1],[N.D5,2],[N.Fs5,2],
      [N.G5,2],[N.A5,1],[N.B5,1],[N.D6,2],[N.B5,2],
      [N.A5,2],[N.Fs5,2],[N.D5,2],[N.A4,2],
    ],
    bass: slowBass([N.D3, N.B2, N.G2, N.A2, N.D3, N.B2, N.G2, N.A2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.Fs5,2],[N.A5,2],[N.D6,2],[N.A5,2],
      [N.E5,2],[N.A5,2],[N.Cs6,2],[N.A5,2],
      [N.G5,2],[N.B5,2],[N.D6,2],[N.B5,2],
      [N.A5,2],[N.D6,2],[N.E6,2],[N.D6,2],
    ],
    arps: [
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.B3, N.D4, N.Fs4, N.B4, N.D5, N.B4, N.Fs4, N.D4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
    ],
    chords: [
      [N.D4, N.Fs4, N.A4, N.C5], [N.B3, N.D4, N.Fs4, N.A4], [N.G3, N.B3, N.D4, N.Fs4], [N.A3, N.Cs4, N.E4, N.G4],
      [N.D4, N.Fs4, N.A4, N.C5], [N.B3, N.D4, N.Fs4, N.A4], [N.G3, N.B3, N.D4, N.Fs4], [N.A3, N.Cs4, N.E4, N.G4],
    ],
  },
  { // 24 — Pop-dance study: bright A-major hook, four-on-floor, radio candy
    id: 'popstar',
    mix: { ...MIX.idol, trimDb: -5.4 },
    name: 'Popstar',
    desc: 'Pop-dance — bright hook, four-on-floor',
    cost: 800,
    bpm: 120,
    voices: {
      melody: { osc: 'square', vol: 0.14, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'square', vol: 0.09 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.0, snare: 1.0, hat: 0.9, heavy: true },
    pad: true,
    melody: [
      [N.A5,2],[N.Cs6,2],[N.E6,2],[N.Cs6,2],
      [N.Fs5,2],[N.A5,2],[N.Cs6,2],[N.Fs5,2],
      [N.D6,2],[N.A5,2],[N.Fs5,2],[N.D5,2],
      [N.E6,2],[N.B5,2],[N.Fs5,2],[N.B5,2],
      [N.Cs6,2],[N.A5,1],[N.Cs6,1],[N.E6,2],[N.A5,2],
      [N.A5,2],[N.Fs5,2],[N.Cs6,2],[N.A5,2],
      [N.D6,2],[N.A5,2],[N.Fs5,2],[N.A5,2],
      [N.B5,2],[N.E6,2],[N.B5,2],[N.Fs5,2],
    ],
    bass: pumpBass([N.A2, N.Fs3, N.D3, N.E3, N.A2, N.Fs3, N.D3, N.E3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.Cs5,2],[N.E5,2],[N.A5,2],[N.E5,2],
      [N.A4,2],[N.Cs5,2],[N.Fs5,2],[N.Cs5,2],
      [N.D5,2],[N.Fs5,2],[N.A5,2],[N.Fs5,2],
      [N.B4,2],[N.E5,2],[N.A5,2],[N.E5,2],
    ],
    arps: [
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
      [N.Fs3, N.A3, N.Cs4, N.Fs4, N.A4, N.Fs4, N.Cs4, N.A3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.E4, N.A4, N.Cs5, N.E5, N.A5, N.E5, N.Cs5, N.A4],
    ],
    chords: [
      [N.A3, N.Cs4, N.E4], [N.Fs3, N.A3, N.Cs4], [N.D4, N.Fs4, N.A4], [N.E4, N.Gs4, N.B4],
      [N.A3, N.Cs4, N.E4], [N.Fs3, N.A3, N.Cs4], [N.D4, N.Fs4, N.A4], [N.E4, N.Gs4, N.B4],
    ],
  },

  // ============ EPIC / SOARING ============
  { // 25 — Soaring dragon-flight theme (HTTYD "Test Drive" DNA): bright major with
    //   Lydian #4 lift, octave-leap "lift-off" hook, rising sequences, pedal pump.
    //   I–V–vi–IV (C–G–Am–F).
    id: 'skyward',
    mix: { ...MIX.epicdrive, trimDb: -5.0 },
    name: 'Skyward',
    desc: 'Soaring dragon-flight theme — Lydian lift',
    cost: 800,
    bpm: 132,
    voices: {
      melody: { osc: 'triangle', vol: 0.2, stack: 'octave' },
      bass:   { osc: 'triangle', vol: 0.22 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.09 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.0, snare: 0.9, hat: 0.85, heavy: true },
    pad: true,
    melody: [
      [N.G4,2],[N.C5,2],[N.E5,2],[N.G5,2],
      [N.A5,3],[N.G5,1],[N.Fs5,2],[N.E5,2],
      [N.C5,2],[N.E5,2],[N.A5,3],[N.G5,1],
      [N.F5,2],[N.E5,2],[N.D5,3],[0,1],
      [N.C5,1],[N.E5,1],[N.G5,2],[N.C6,4],
      [N.B5,2],[N.A5,2],[N.G5,2],[N.D5,2],
      [N.E5,2],[N.A5,2],[N.C6,3],[N.B5,1],
      [N.A5,2],[N.G5,2],[N.F5,2],[N.E5,2],
    ],
    bass: pumpBass([N.C3, N.G2, N.A2, N.F2, N.C3, N.G2, N.A2, N.F2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.G5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
      [N.E5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.C5,2],[N.F5,2],[N.A5,2],[N.F5,2],
    ],
    arps: [
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
    ],
    chords: [
      [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4],
      [N.C4, N.E4, N.G4], [N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4],
    ],
  },
  { // 26 — Apocalyptic battle-choir (FFXV "Apocalypsis Aquarius" DNA): D harmonic-
    //   minor, descending ANDALUSIAN cadence i–bVII–bVI–V (Dm–C–Bb–A) with the C♯
    //   leading-tone bite, octave-stacked "choir" leaps, relentless pounding kit.
    id: 'requiem',
    mix: { ...MIX.epicdrive, trimDb: -7.6 },
    name: 'Eclipse Requiem',
    desc: 'Apocalyptic battle-choir — Andalusian epic',
    cost: 800,
    bpm: 144,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.17, stack: 'octave' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'square', vol: 0.1 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.12 },
    },
    drums: { kick: 1.4, snare: 1.25, hat: 1.0, heavy: true, punch: 1.2 },
    pad: true,
    melody: [
      [N.D5,2],[N.A5,2],[N.F5,2],[N.D5,2],
      [N.C5,2],[N.G5,2],[N.E5,2],[N.C5,2],
      [N.Bb4,2],[N.F5,2],[N.D5,2],[N.Bb4,2],
      [N.A4,2],[N.Cs5,2],[N.E5,2],[N.A5,2],
      [N.D6,4],[N.C6,2],[N.A5,2],
      [N.C6,4],[N.Bb5,2],[N.G5,2],
      [N.Bb5,2],[N.A5,2],[N.G5,2],[N.F5,2],
      [N.A5,2],[N.G5,1],[N.F5,1],[N.E5,2],[N.Cs5,2],
    ],
    bass: pumpBass([N.D3, N.C3, N.Bb2, N.A2, N.D3, N.C3, N.Bb2, N.A2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.A5,2],[N.D6,2],[N.A5,2],[N.F5,2],
      [N.G5,2],[N.C6,2],[N.G5,2],[N.E5,2],
      [N.F5,2],[N.Bb5,2],[N.D6,2],[N.Bb5,2],
      [N.E5,2],[N.A5,2],[N.Cs6,2],[N.A5,2],
    ],
    arps: [
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.Bb3, N.D4, N.F4, N.Bb4, N.D5, N.Bb4, N.F4, N.D4],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
    ],
    chords: [
      [N.D4, N.F4, N.A4], [N.C4, N.E4, N.G4], [N.Bb3, N.D4, N.F4], [N.A3, N.Cs4, N.E4],
      [N.D4, N.F4, N.A4], [N.C4, N.E4, N.G4], [N.Bb3, N.D4, N.F4], [N.A3, N.Cs4, N.E4],
    ],
  },
  { // 27 — Uplifting euphoric trance: A-minor i–VI–III–VII (Am–F–C–G), long anthemic
    //   supersaw lead over a rolling off-beat bass. The classic festival lift.
    id: 'hypernova',
    mix: { ...MIX.trance, trimDb: -4.7 },
    name: 'Hypernova',
    desc: 'Uplifting trance — euphoric supersaw',
    cost: 800,
    bpm: 138,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.14, stack: 'detune', inst: 'supersaw' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.11 },
    },
    drums: { kick: 1.15, snare: 0.9, hat: 1.15, heavy: true },
    pad: true,
    melody: [
      [N.E5,2],[N.A5,4],[N.G5,2],
      [N.F5,2],[N.C6,4],[N.A5,2],
      [N.E5,2],[N.G5,4],[N.E5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.D6,2],
      [N.C6,4],[N.B5,2],[N.A5,2],
      [N.A5,4],[N.G5,2],[N.F5,2],
      [N.G5,4],[N.E5,2],[N.G5,2],
      [N.D5,2],[N.E5,2],[N.G5,2],[N.B5,2],
    ],
    bass: offBass([N.A2, N.F2, N.C3, N.G2, N.A2, N.F2, N.C3, N.G2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.E5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.C5,2],[N.F5,2],[N.A5,2],[N.F5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.G5,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
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
  { // 28 — Anthem rock: G-major I–V–vi–IV (G–D–Em–C), big singalong hook, driving
    //   power-chord saws, no pad — raw stadium energy.
    id: 'overdrive',
    mix: { ...MIX.rock, trimDb: -7.7 },
    name: 'Overdrive',
    desc: 'Anthem rock — power-chord drive',
    cost: 800,
    bpm: 150,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.15, stack: 'detune' },
      bass:   { osc: 'sawtooth', vol: 0.18 },
      high:   { osc: 'square', vol: 0.09 },
      arp:    { osc: 'sawtooth', vol: 0.1 },
      lead:   { osc: 'sawtooth', vol: 0.12 },
    },
    drums: { kick: 1.2, snare: 1.15, hat: 1.0, heavy: true, punch: 1.1 },
    pad: false,
    melody: [
      [N.D5,2],[N.G5,2],[N.B5,1],[N.A5,1],[N.G5,2],
      [N.Fs5,2],[N.A5,2],[N.D6,2],[N.A5,2],
      [N.B5,2],[N.A5,2],[N.G5,2],[N.E5,2],
      [N.C5,2],[N.E5,2],[N.G5,3],[0,1],
      [N.G5,2],[N.D6,4],[N.B5,2],
      [N.A5,2],[N.Fs5,2],[N.D5,2],[N.Fs5,2],
      [N.E5,2],[N.B5,2],[N.G5,2],[N.B5,2],
      [N.C6,2],[N.B5,2],[N.A5,2],[N.G5,2],
    ],
    bass: pumpBass([N.G2, N.D3, N.E3, N.C3, N.G2, N.D3, N.E3, N.C3]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.G5,2],
      [N.Fs5,2],[N.A5,2],[N.D6,2],[N.A5,2],
      [N.E5,2],[N.G5,2],[N.B5,2],[N.G5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.E6,2],
    ],
    arps: [
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.D4, N.Fs4, N.A4, N.D5, N.Fs5, N.D5, N.A4, N.Fs4],
      [N.E3, N.G3, N.B3, N.E4, N.G4, N.E4, N.B3, N.G3],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
    ],
    chords: [
      [N.G3, N.B3, N.D4], [N.D4, N.Fs4, N.A4], [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4],
      [N.G3, N.B3, N.D4], [N.D4, N.Fs4, N.A4], [N.E3, N.G3, N.B3], [N.C4, N.E4, N.G4],
    ],
  },
  { // 29 — K-pop "Royal Road" (王道進行): IVmaj7–V7–iii7–vi (Fmaj7–G7–Em7–Am),
    //   the emotional-uplifting J/K-pop chorus engine, bright syncopated vocal hook.
    id: 'idol',
    mix: { ...MIX.idol, trimDb: -5.4 },
    name: 'Starlight Idol',
    desc: 'K-pop — royal-road emotional hook',
    cost: 800,
    bpm: 122,
    voices: {
      melody: { osc: 'square', vol: 0.15, stack: 'octave', inst: 'fmEP' },
      bass:   { osc: 'sawtooth', vol: 0.17 },
      high:   { osc: 'sine', vol: 0.11 },
      arp:    { osc: 'square', vol: 0.09 },
      lead:   { osc: 'square', vol: 0.11 },
    },
    drums: { kick: 1.0, snare: 1.0, hat: 0.95, heavy: true },
    pad: true,
    melody: [
      [N.A5,1],[N.G5,1],[N.F5,2],[N.A5,1],[N.C6,1],[N.A5,2],
      [N.B5,1],[N.A5,1],[N.G5,2],[N.D5,1],[N.G5,1],[N.B5,2],
      [N.E5,1],[N.G5,1],[N.B5,2],[N.G5,1],[N.E5,1],[N.D5,2],
      [N.C6,2],[N.B5,1],[N.A5,1],[N.E5,2],[N.A5,2],
      [N.F5,1],[N.A5,1],[N.C6,2],[N.C6,1],[N.B5,1],[N.A5,2],
      [N.G5,1],[N.B5,1],[N.D6,2],[N.D6,1],[N.C6,1],[N.B5,2],
      [N.E5,1],[N.G5,1],[N.B5,2],[N.A5,1],[N.G5,1],[N.E5,2],
      [N.A5,2],[N.G5,1],[N.E5,1],[N.C5,2],[N.E5,2],
    ],
    bass: pumpBass([N.F2, N.G2, N.E3, N.A2, N.F2, N.G2, N.E3, N.A2]),
    high: [
      [0,8],[0,8],[0,8],[0,8],
      [N.C5,2],[N.F5,2],[N.A5,2],[N.C6,2],
      [N.D5,2],[N.G5,2],[N.B5,2],[N.D6,2],
      [N.B4,2],[N.E5,2],[N.G5,2],[N.B5,2],
      [N.C5,2],[N.E5,2],[N.A5,2],[N.E5,2],
    ],
    arps: [
      [N.F3, N.A3, N.C4, N.E4, N.A4, N.E4, N.C4, N.A3],
      [N.G3, N.B3, N.D4, N.F4, N.B4, N.F4, N.D4, N.B3],
      [N.E3, N.G3, N.B3, N.D4, N.G4, N.D4, N.B3, N.G3],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
    ],
    chords: [
      [N.F3, N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4, N.F4], [N.E3, N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4, N.G4],
      [N.F3, N.A3, N.C4, N.E4], [N.G3, N.B3, N.D4, N.F4], [N.E3, N.G3, N.B3, N.D4], [N.A3, N.C4, N.E4, N.G4],
    ],
  },
  { // 30 — FFXVI "Find the Flame" homage: driving F-minor Eikon-battle anthem.
    // The original melody is copyright-locked everywhere, so this is an ORIGINAL
    // chiptune line over the song's confirmed harmony: F minor, ~168 BPM, the
    // canonical epic loop i–♭VI–♭VII–V (Fm–Db–Eb–C) with the harmonic-minor
    // raised-7th leading tone (E natural over the C dominant).
    id: 'findflame',
    mix: { ...MIX.epicdrive, trimDb: -9.2 },
    name: 'Find the Flame',
    desc: 'Eikonic battle anthem · con fuoco',
    cost: 1800,
    bpm: 168,
    voices: {
      melody: { osc: 'square',   vol: 0.16 },
      bass:   { osc: 'sawtooth', vol: 0.22 },
      high:   { osc: 'triangle', vol: 0.12 },
      arp:    { osc: 'sawtooth', vol: 0.10 },
      lead:   { osc: 'square',   vol: 0.12 },
    },
    drums: { kick: 1, snare: 1, hat: 1, heavy: true },
    pad: true,
    melody: [
      [N.C5,1],[N.F5,1],[N.Gs5,2],[N.G5,1],[N.F5,1],[N.Ds5,2],
      [N.Cs5,1],[N.F5,1],[N.Gs5,2],[N.F5,1],[N.Cs5,1],[N.F5,2],
      [N.Ds5,1],[N.G5,1],[N.Bb5,2],[N.G5,1],[N.Ds5,1],[N.G5,2],
      [N.C5,1],[N.E5,1],[N.G5,2],[N.E5,1],[N.C5,1],[N.G5,2],
      [N.F5,2],[N.Gs5,2],[N.C6,2],[N.Gs5,2],
      [N.Cs6,2],[N.Bb5,1],[N.Gs5,1],[N.F5,2],[N.Gs5,2],
      [N.Ds6,2],[N.C6,1],[N.Bb5,1],[N.G5,2],[N.Bb5,2],
      [N.C6,1],[N.Bb5,1],[N.Gs5,1],[N.G5,1],[N.E5,2],[N.F5,2],
    ],
    bass: pumpBass([N.F3, N.Cs3, N.Ds3, N.C3, N.F3, N.Cs3, N.Ds3, N.C3]),
    high: [
      [0,8],[0,8],
      [N.Bb5,2],[N.G5,2],[N.Bb5,2],[N.Ds6,2],
      [N.C6,2],[N.G5,2],[N.E5,2],[N.G5,2],
      [N.C6,2],[N.Gs5,2],[N.F5,2],[N.Gs5,2],
      [N.Cs6,2],[N.Gs5,2],[N.F5,2],[N.Gs5,2],
      [N.Ds6,2],[N.Bb5,2],[N.G5,2],[N.Bb5,2],
      [N.C6,2],[N.G5,2],[N.E5,2],[N.C6,2],
    ],
    arps: [
      [N.F3, N.Gs3, N.C4, N.F4, N.Gs4, N.F4, N.C4, N.Gs3],
      [N.Cs4, N.F4, N.Gs4, N.Cs5, N.F5, N.Cs5, N.Gs4, N.F4],
      [N.Ds4, N.G4, N.Bb4, N.Ds5, N.G5, N.Ds5, N.Bb4, N.G4],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
    ],
    chords: [
      [N.F3, N.Gs3, N.C4, N.F4], [N.Cs4, N.F4, N.Gs4, N.Cs5], [N.Ds4, N.G4, N.Bb4, N.Ds5], [N.C4, N.E4, N.G4, N.C5],
      [N.F3, N.Gs3, N.C4, N.F4], [N.Cs4, N.F4, N.Gs4, N.Cs5], [N.Ds4, N.G4, N.Bb4, N.Ds5], [N.C4, N.E4, N.G4, N.C5],
    ],
  },
  { // 31 — TITLE / MENU theme. Bright, inviting, anthemic: the catchy first
    // impression on the start screen. C major, the timeless I–V–vi–IV (C–G–Am–F)
    // anthem progression under a soaring hook, with cascading broken-chord arps
    // for that classic FF-Prelude shimmer. Auto-plays on the menu (sfx.js).
    id: 'skybound',
    mix: { ...MIX.anthem, trimDb: -3.7 },
    name: 'Skybound',
    desc: 'Soaring title theme',
    cost: 0,
    bpm: 128,
    voices: {
      melody: { osc: 'triangle', vol: 0.17 },
      bass:   { osc: 'triangle', vol: 0.20 },
      high:   { osc: 'triangle', vol: 0.11 },
      arp:    { osc: 'sawtooth', vol: 0.08 },
      lead:   { osc: 'triangle', vol: 0.11 },
    },
    drums: { kick: 1, snare: 1, hat: 1 },
    pad: true,
    melody: [
      [N.G4,1],[N.C5,1],[N.E5,2],[N.G5,2],[N.E5,2],
      [N.D5,1],[N.G5,1],[N.B5,2],[N.G5,2],[N.D5,2],
      [N.C5,1],[N.E5,1],[N.A5,2],[N.E5,2],[N.C5,2],
      [N.C5,1],[N.F5,1],[N.A5,2],[N.G5,2],[N.F5,2],
      [N.E5,2],[N.G5,2],[N.C6,2],[N.G5,2],
      [N.D6,2],[N.B5,1],[N.G5,1],[N.D5,2],[N.G5,2],
      [N.C6,2],[N.A5,1],[N.E5,1],[N.A5,2],[N.C6,2],
      [N.A5,1],[N.G5,1],[N.F5,1],[N.E5,1],[N.D5,2],[N.C5,2],
    ],
    bass: pumpBass([N.C3, N.G2, N.A2, N.F2, N.C3, N.G2, N.A2, N.F2]),
    high: [
      [0,8],[0,8],
      [N.E5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.F5,2],[N.A5,2],[N.C6,2],[N.A5,2],
      [N.G5,2],[N.C6,2],[N.G5,2],[N.C6,2],
      [N.B5,2],[N.D6,2],[N.B5,2],[N.G5,2],
      [N.C6,2],[N.A5,2],[N.E5,2],[N.A5,2],
      [N.A5,2],[N.F5,2],[N.A5,2],[N.C6,2],
    ],
    arps: [
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.G3, N.B3, N.D4, N.G4, N.B4, N.G4, N.D4, N.B3],
      [N.A3, N.C4, N.E4, N.A4, N.C5, N.A4, N.E4, N.C4],
      [N.F3, N.A3, N.C4, N.F4, N.A4, N.F4, N.C4, N.A3],
    ],
    chords: [
      [N.C4, N.E4, N.G4, N.C5], [N.G3, N.B3, N.D4, N.G4], [N.A3, N.C4, N.E4, N.A4], [N.F3, N.A3, N.C4, N.F4],
      [N.C4, N.E4, N.G4, N.C5], [N.G3, N.B3, N.D4, N.G4], [N.A3, N.C4, N.E4, N.A4], [N.F3, N.A3, N.C4, N.F4],
    ],
  },
  { // 32 — "First Flight": a film-score flight anthem in homage to the HTTYD
    //   Flying Theme ("Test Drive"/"Romantic Flight" DNA). ORIGINAL melody — not a
    //   transcription — that traces the theme's signature gesture: a leap up into a
    //   sustained high note, a graceful descending arc, then a rising sequence that
    //   re-launches HIGHER. D major, broad cinematic tempo, I–V–vi–IV (D–A–Bm–G)
    //   with a plagal "soar" lift. Warm octave-stacked horn/strings lead, sine
    //   sub, harp-like triangle arps, soft kit (no EDM pump) and a high counter-
    //   line that answers the melody. The lyrical, orchestral entry in the radio.
    id: 'firstflight',
    mix: { ...MIX.epic, trimDb: -6.9 },
    name: 'First Flight',
    desc: 'Cinematic flight anthem — soaring film-score',
    cost: 0,
    bpm: 96,
    voices: {
      melody: { osc: 'triangle', vol: 0.2, stack: 'octave' },
      bass:   { osc: 'sine', vol: 0.26 },
      high:   { osc: 'sine', vol: 0.12 },
      arp:    { osc: 'triangle', vol: 0.08 },
      lead:   { osc: 'sawtooth', vol: 0.1 },
    },
    drums: { kick: 0.7, snare: 0.55, hat: 0.5, heavy: false },
    pad: true,
    // Verse (1-4): the soar opens — leap A→D→Fs→A, ease down, lift to B5, breathe.
    // Chorus (5-8): the grand catchy bit — big leap to a sustained D6, descending
    //   arc, then the rising-sequence re-launch and a resolving fall back to the top.
    melody: [
      [N.A4,1],[N.D5,1],[N.Fs5,2],[N.A5,2],[N.Fs5,1],[N.E5,1],
      [N.Fs5,2],[N.E5,2],[N.D5,2],[N.E5,2],
      [N.Fs5,2],[N.A5,2],[N.B5,3],[N.A5,1],
      [N.G5,2],[N.Fs5,2],[N.E5,3],[0,1],
      [N.Fs5,1],[N.A5,1],[N.D6,4],[N.Cs6,2],
      [N.B5,2],[N.A5,2],[N.Fs5,2],[N.E5,2],
      [N.D5,1],[N.Fs5,1],[N.A5,2],[N.B5,4],
      [N.A5,2],[N.G5,2],[N.Fs5,2],[N.E5,2],
    ],
    bass: slowBass([N.D3, N.A2, N.B2, N.G2, N.D3, N.A2, N.B2, N.G2]),
    // High counter-line: silent at the open, swells in under the verse lift (3-4),
    // then soars in parallel-thirds-ish answer through the chorus.
    high: [
      [0,8],[0,8],
      [N.Fs5,4],[N.A5,4],
      [N.G5,4],[N.B5,4],
      [N.A5,2],[N.D6,2],[N.Fs5,2],[N.A5,2],
      [N.Cs6,2],[N.A5,2],[N.E5,2],[N.A5,2],
      [N.D6,2],[N.B5,2],[N.Fs5,2],[N.B5,2],
      [N.B5,2],[N.G5,2],[N.D5,2],[N.G5,2],
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
  { // 33 — "Pyre Ascendant": an ORIGINAL tragic-Phoenix flight anthem. Shares only
    //   the EMOTIONAL category of a sacred firebird ascension — no melody, motif or
    //   arrangement is quoted from any existing work. D natural minor with a C#
    //   harmonic-minor leading tone for the firebird/destiny pull home to D. Loop:
    //   Dm–Bb–C–A. A slow, heroic horn melody (rise→burn→fall→rebirth) rides over a
    //   fast wing-beat string ostinato + taiko. Engine layers carry the adaptive
    //   intensity (bass/melody/pad always; high ostinato on combo; fever lead on Surge).
    id: 'pyre',
    mix: { ...MIX.epicdrive, trimDb: -8.5 },
    name: 'Pyre Ascendant',
    desc: 'Tragic phoenix ascension — sacred fire',
    cost: 0,
    bpm: 160,
    voices: {
      melody: { osc: 'triangle', vol: 0.19, stack: 'octave' }, // french-horn-ish, grand + tragic
      bass:   { osc: 'sawtooth', vol: 0.20 },                  // low strings, dark and ancient
      high:   { osc: 'sawtooth', vol: 0.12, stack: 'detune' }, // high-string wing-beat ostinato
      arp:    { osc: 'triangle', vol: 0.08 },                  // harp-like flight figure
      lead:   { osc: 'sawtooth', vol: 0.12 },                  // brass fever lead (Surge)
    },
    drums: { kick: 1.1, snare: 0.85, hat: 0.6, heavy: true, punch: 1.1 },
    pad: true,
    // Phoenix motif — rise / burn / fall / rebirth; slow + heroic across the loop.
    melody: [
      [N.D4,2],[N.F4,2],[N.A4,2],[N.C5,2],   // rise
      [N.Bb4,2],[N.A4,2],[N.G4,2],[N.F4,2],  // burn — stepwise fall
      [N.E4,2],[N.F4,2],[N.G4,2],[N.A4,2],   // re-ascend
      [N.Cs5,2],[N.A4,2],[N.D5,4],           // C# leading tone → rebirth, held
      [N.A4,2],[N.D5,2],[N.F5,2],[N.E5,2],   // response, airborne
      [N.D5,2],[N.C5,2],[N.Bb4,2],[N.A4,2],  // tragic descent
      [N.G4,2],[N.Bb4,2],[N.D5,2],[N.F5,2],  // fire answering fire
      [N.E5,2],[N.Cs5,2],[N.D5,4],           // resolve home, held
    ],
    bass: pumpBass([N.D3, N.Bb2, N.C3, N.A2, N.D3, N.Bb2, N.C3, N.A2]),
    // Fast wing-beat ostinato (sounds in at combo — intensity 2+).
    high: [
      [N.D5,1],[N.A4,1],[N.D5,1],[N.F5,1],[N.A4,1],[N.F5,1],[N.D5,1],[N.A4,1],
      [N.Bb4,1],[N.F4,1],[N.Bb4,1],[N.D5,1],[N.F5,1],[N.D5,1],[N.Bb4,1],[N.F4,1],
      [N.C5,1],[N.G4,1],[N.C5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.C5,1],[N.G4,1],
      [N.A4,1],[N.E4,1],[N.A4,1],[N.Cs5,1],[N.E5,1],[N.Cs5,1],[N.A4,1],[N.E4,1],
      [N.D5,1],[N.A4,1],[N.D5,1],[N.F5,1],[N.A4,1],[N.F5,1],[N.D5,1],[N.A4,1],
      [N.Bb4,1],[N.F4,1],[N.Bb4,1],[N.D5,1],[N.F5,1],[N.D5,1],[N.Bb4,1],[N.F4,1],
      [N.C5,1],[N.G4,1],[N.C5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.C5,1],[N.G4,1],
      [N.A4,1],[N.E4,1],[N.A4,1],[N.Cs5,1],[N.E5,1],[N.Cs5,1],[N.A4,1],[N.E4,1],
    ],
    arps: [
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
      [N.Bb3, N.D4, N.F4, N.Bb4, N.D5, N.Bb4, N.F4, N.D4],
      [N.C4, N.E4, N.G4, N.C5, N.E5, N.C5, N.G4, N.E4],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
    ],
    chords: [
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.C4, N.E4, N.G4], [N.A3, N.Cs4, N.E4],
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.C4, N.E4, N.G4], [N.A3, N.Cs4, N.E4],
    ],
  },
  { // 34 — "Cinder Requiem": the second, fiercer take on the same Phoenix emotion —
    //   a driving battle-ascent. ORIGINAL throughout. D minor, climb-progression
    //   Dm–Bb–Gm–A (the minor subdominant Gm darkens it) with the C# leading tone.
    //   Brassier saws, octave-leap melody, a galloping high ostinato — built for the
    //   combo/Surge layers to roar. 160 BPM.
    id: 'cinder',
    mix: { ...MIX.epicdrive, trimDb: -8.4 },
    name: 'Cinder Requiem',
    desc: 'Phoenix battle-ascent — fire answering fire',
    cost: 0,
    bpm: 160,
    voices: {
      melody: { osc: 'sawtooth', vol: 0.16, stack: 'detune' }, // heroic brass
      bass:   { osc: 'sawtooth', vol: 0.20 },
      high:   { osc: 'sawtooth', vol: 0.12, stack: 'detune' },
      arp:    { osc: 'sawtooth', vol: 0.10 },
      lead:   { osc: 'sawtooth', vol: 0.12 },
    },
    drums: { kick: 1.25, snare: 1.0, hat: 0.85, heavy: true, punch: 1.2 },
    pad: true,
    melody: [
      [N.D5,2],[N.A4,1],[N.D5,1],[N.F5,2],[N.E5,2],  // octave-leap call
      [N.D5,2],[N.Bb4,2],[N.F4,2],[N.Bb4,2],         // fall
      [N.G4,2],[N.D5,2],[N.Bb4,2],[N.G4,2],          // Gm darkening
      [N.A4,2],[N.E5,2],[N.Cs5,2],[N.A4,2],          // C# tension
      [N.F5,2],[N.E5,1],[N.D5,1],[N.A4,2],[N.D5,2],  // soaring response
      [N.Bb4,2],[N.D5,2],[N.F5,3],[N.D5,1],          // burn
      [N.G5,2],[N.F5,2],[N.D5,2],[N.Bb4,2],          // octave climax
      [N.A4,2],[N.Cs5,2],[N.D5,4],                   // resolve home
    ],
    bass: pumpBass([N.D3, N.Bb2, N.G2, N.A2, N.D3, N.Bb2, N.G2, N.A2]),
    high: [
      [N.D5,1],[N.F5,1],[N.A5,1],[N.F5,1],[N.D5,1],[N.F5,1],[N.A5,1],[N.F5,1],
      [N.D5,1],[N.F5,1],[N.Bb5,1],[N.F5,1],[N.D5,1],[N.F5,1],[N.Bb5,1],[N.F5,1],
      [N.D5,1],[N.G5,1],[N.Bb5,1],[N.G5,1],[N.D5,1],[N.G5,1],[N.Bb5,1],[N.G5,1],
      [N.Cs5,1],[N.E5,1],[N.A5,1],[N.E5,1],[N.Cs5,1],[N.E5,1],[N.A5,1],[N.E5,1],
      [N.D5,1],[N.F5,1],[N.A5,1],[N.F5,1],[N.D5,1],[N.F5,1],[N.A5,1],[N.F5,1],
      [N.D5,1],[N.F5,1],[N.Bb5,1],[N.F5,1],[N.D5,1],[N.F5,1],[N.Bb5,1],[N.F5,1],
      [N.D5,1],[N.G5,1],[N.Bb5,1],[N.G5,1],[N.D5,1],[N.G5,1],[N.Bb5,1],[N.G5,1],
      [N.Cs5,1],[N.E5,1],[N.A5,1],[N.E5,1],[N.Cs5,1],[N.E5,1],[N.A5,1],[N.E5,1],
    ],
    arps: [
      [N.D4, N.F4, N.A4, N.D5, N.F5, N.D5, N.A4, N.F4],
      [N.Bb3, N.D4, N.F4, N.Bb4, N.D5, N.Bb4, N.F4, N.D4],
      [N.G3, N.Bb3, N.D4, N.G4, N.Bb4, N.G4, N.D4, N.Bb3],
      [N.A3, N.Cs4, N.E4, N.A4, N.Cs5, N.A4, N.E4, N.Cs4],
    ],
    chords: [
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.G3, N.Bb3, N.D4], [N.A3, N.Cs4, N.E4],
      [N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.G3, N.Bb3, N.D4], [N.A3, N.Cs4, N.E4],
    ],
  },
];
