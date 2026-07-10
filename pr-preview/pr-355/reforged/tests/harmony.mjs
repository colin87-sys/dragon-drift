// Unit-checks the pure harmony helpers. Run with: node tests/harmony.mjs
import { snapToChord, chordLadder, nextGridDelay, tonicOf } from '../js/harmony.js';

let pass = 0, fail = 0;
function check(label, ok) {
  if (ok) pass++;
  else { fail++; console.error(`FAIL: ${label}`); }
}
const near = (a, b, cents = 2) => Math.abs(1200 * Math.log2(a / b)) <= cents;

const Am = [220, 261.63, 329.63]; // A3 C4 E4

// Already a chord tone (any octave) → unchanged.
check('A5 stays on Am', near(snapToChord(880, Am), 880));
check('C6 stays on Am', near(snapToChord(1046.5, Am), 1046.5));
// Non-chord tones snap to the NEAREST chord pitch class, register preserved.
check('B5 (988) → C6 (1046.5)', near(snapToChord(987.77, Am), 1046.5));
check('G#4 (415) → A4 (440)', near(snapToChord(415.3, Am), 440));
// Register preserved: a low input stays low.
const lowSnap = snapToChord(100, Am);
check(`low input stays low (${lowSnap.toFixed(1)}Hz)`, lowSnap > 80 && lowSnap < 125);
// Degenerate inputs pass through.
check('empty chord → identity', snapToChord(500, []) === 500);
check('zero freq → identity', snapToChord(0, Am) === 0);

// Ladder: consecutive steps rise monotonically through chord tones.
let prev = 0, monotone = true, allChordTones = true;
for (let s = 0; s < 8; s++) {
  const f = chordLadder(660, Am, s);
  if (f <= prev) monotone = false;
  if (!near(snapToChord(f, Am), f)) allChordTones = false;
  prev = f;
}
check('ladder rises monotonically', monotone);
check('ladder stays on chord tones', allChordTones);
check('ladder octave-wraps (step 3 ≈ 2× step 0)', near(chordLadder(660, Am, 3), chordLadder(660, Am, 0) * 2));

// Grid delay: null clock → 0 (the beat-clock fallback law).
check('null clock → 0 delay', nextGridDelay(null, 4) === 0);
const clock = { beatLen: 0.5, phase: 0.3 }; // 120bpm, 30% into the beat
// 16ths every 0.125s; 0.15s into the beat → next at 0.25 → wait 0.1
check('16th grid delay', Math.abs(nextGridDelay(clock, 4) - 0.1) < 1e-9);
// On-the-grid (within 30ms) → 0.
check('near-grid plays now', nextGridDelay({ beatLen: 0.5, phase: 0.49 }, 4) === 0);
check('exactly on grid plays now', nextGridDelay({ beatLen: 0.5, phase: 0.5 }, 4) === 0);

// T-H4 — tonicOf (PR9): the chord's root = the LOWEST tone of the arp cycle
// (tracks.js voices the root at the bottom); degenerate chords → 0 so callers
// keep their fixed pitch (the null-oracle contract).
check('tonicOf(Am voicing) = A3 (the lowest tone)', tonicOf(Am) === 220);
check('tonicOf is order-blind', tonicOf([329.63, 220, 261.63]) === 220);
check('tonicOf skips non-positive junk', tonicOf([0, -5, 330, 220]) === 220);
check('tonicOf(empty) → 0', tonicOf([]) === 0);
check('tonicOf(null) → 0', tonicOf(null) === 0);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
