// Validates every track in TRACKS against structural rules.
// Run with: node tests/tracks.mjs
import { TRACKS, N } from '../js/tracks.js';
import { validateForm } from '../js/composer.js';

let pass = 0;
let fail = 0;

function check(label, ok) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${label}`);
  }
}

const FREQ_MIN = N.D2;
const FREQ_MAX = N.E6;

function sumDurations(arr) {
  return arr.reduce((s, pair) => s + pair[1], 0);
}

function freqOk(freq) {
  return freq === 0 || (freq >= FREQ_MIN && freq <= FREQ_MAX + 0.01);
}

for (const t of TRACKS) {
  const pfx = `[${t.id}]`;

  // Voices present
  check(`${pfx} voices.melody`, !!t.voices?.melody);
  check(`${pfx} voices.bass`,   !!t.voices?.bass);
  check(`${pfx} voices.high`,   !!t.voices?.high);
  check(`${pfx} voices.arp`,    !!t.voices?.arp);
  check(`${pfx} voices.lead`,   !!t.voices?.lead);

  // Drums present
  check(`${pfx} drums`, !!t.drums);

  // melody: 8 bars × 8 eighths = 64 total
  check(`${pfx} melody total eighths = 64`, sumDurations(t.melody) === 64);
  // Check per-bar: split melody into bars by counting 8 eighths at a time
  let bar = 0, barSum = 0;
  for (const [freq, dur] of t.melody) {
    check(`${pfx} melody freq in range (${freq})`, freqOk(freq));
    barSum += dur;
    if (barSum === 8) { bar++; barSum = 0; }
    else if (barSum > 8) { check(`${pfx} melody bar ${bar + 1} overflow`, false); barSum = 0; bar++; }
  }
  check(`${pfx} melody has exactly 8 bars`, bar === 8);

  // high: 8 bars × 8 eighths = 64 total
  check(`${pfx} high total eighths = 64`, sumDurations(t.high) === 64);
  bar = 0; barSum = 0;
  for (const [freq, dur] of t.high) {
    check(`${pfx} high freq in range (${freq})`, freqOk(freq));
    barSum += dur;
    if (barSum === 8) { bar++; barSum = 0; }
    else if (barSum > 8) { check(`${pfx} high bar ${bar + 1} overflow`, false); barSum = 0; bar++; }
  }
  check(`${pfx} high has exactly 8 bars`, bar === 8);

  // bass: 8 bars × 8 eighths = 64 total
  check(`${pfx} bass total eighths = 64`, sumDurations(t.bass) === 64);

  // arps: 4 cycles × 8 notes each = 32 entries
  check(`${pfx} arps length = 4`, t.arps.length === 4);
  for (let i = 0; i < t.arps.length; i++) {
    check(`${pfx} arps[${i}] length = 8`, t.arps[i].length === 8);
  }

  // chords: null or length-8 array
  if (t.chords !== null) {
    check(`${pfx} chords length = 8`, t.chords.length === 8);
  }

  // groove grids (optional): 16 sixteenth-step chars of x / g / . per voice
  if (t.groove?.grid) {
    for (const [voice, spec] of Object.entries(t.groove.grid)) {
      check(`${pfx} groove.${voice} is a 16-step x/g/. grid`,
        typeof spec === 'string' && spec.length === 16 && /^[x.g]+$/.test(spec));
    }
    check(`${pfx} groove keeps a pulse (kick or snare)`, !!(t.groove.grid.kick || t.groove.grid.snare));
    if (t.groove.hatVel) {
      check(`${pfx} groove.hatVel values in (0,1]`,
        t.groove.hatVel.every((v) => v > 0 && v <= 1));
    }
  }

  // trimDb (baked by tools/loudshots.mjs): sane range
  if (t.mix?.trimDb != null) {
    check(`${pfx} trimDb sane (${t.mix.trimDb})`, t.mix.trimDb > -14 && t.mix.trimDb < 6);
  }

  // Song form/sections (optional): structural validity + dynamic range.
  const formProblems = validateForm(t);
  for (const p of formProblems) check(p, false);
  check(`${pfx} form/sections valid`, formProblems.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
