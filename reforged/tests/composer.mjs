// Unit-checks the composition engine (form walking + section resolution +
// validation). Run with: node tests/composer.mjs
import { resolveForm, sectionAt, formBarLength, validateForm } from '../js/composer.js';

let pass = 0, fail = 0;
function check(label, ok) {
  if (ok) pass++;
  else { fail++; console.error(`FAIL: ${label}`); }
}

// Legacy station (no form) → implicit single base section, forever.
const legacy = { id: 'legacy' };
check('legacy: resolveForm null', resolveForm(legacy) === null);
check('legacy: formBarLength 0', formBarLength(legacy) === 0);
const s0 = sectionAt(legacy, 0), s9 = sectionAt(legacy, 9);
check('legacy: base section every pass', s0.bars === 8 && s0.mute.size === 0 && s0.energy === 1);
check('legacy: identical across passes', s9.key === s0.key && s9.energy === s0.energy);
check('legacy: validates clean', validateForm(legacy).length === 0);

// A real form: intro → build → drop → breakdown.
const song = {
  id: 'song',
  sections: {
    A:    {},                                            // base
    bld:  { bars: 4, mute: ['high'], energy: 0.6, riser: true },
    drop: { energy: 1.0, crash: true },
    brk:  { bars: 4, mute: ['perc', 'perc2', 'bass'], energy: 0.25 },
  },
  form: ['A', 'bld', 'drop', 'brk'],
};
check('song: resolveForm has 4 steps', resolveForm(song).length === 4);
check('song: bar length = 8+4+8+4 = 24', formBarLength(song) === 24);

const A = sectionAt(song, 0), bld = sectionAt(song, 1), drop = sectionAt(song, 2), brk = sectionAt(song, 3);
check('song: A is base (8 bars, full)', A.key === 'A' && A.bars === 8 && A.energy === 1 && A.mute.size === 0);
check('song: build is 4 bars, mutes high, has riser', bld.bars === 4 && bld.mute.has('high') && bld.riser);
check('song: drop is full energy + crash', drop.energy === 1 && drop.crash);
check('song: breakdown mutes bass+perc, low energy', brk.bars === 4 && brk.mute.has('bass') && brk.mute.has('perc') && brk.energy === 0.25);
// Form wraps.
check('song: form wraps (pass 4 == pass 0)', sectionAt(song, 4).key === A.key);
check('song: form wraps (pass 5 == build)', sectionAt(song, 5).key === 'bld');
// Negative/large passes are safe.
check('song: negative pass wraps safely', ['A', 'bld', 'drop', 'brk'].includes(sectionAt(song, -1).key));
check('song: validates clean', validateForm(song).length === 0);

// bars clamp: >8 capped, <1 floored.
const clamp = { id: 'clamp', sections: { A: {}, big: { bars: 99, energy: 0.5 } }, form: ['A', 'big'] };
check('clamp: bars capped at 8', sectionAt(clamp, 1).bars === 8);

// Validation catches structural mistakes.
check('missing section flagged', validateForm({ id: 'x', sections: { A: {} }, form: ['A', 'ghost'] })
  .some((p) => p.includes("missing section 'ghost'")));
check('unknown field flagged', validateForm({ id: 'x', sections: { A: {}, B: { enrgy: 0.5 } }, form: ['A', 'B'] })
  .some((p) => p.includes('unknown field')));
check('out-of-range energy flagged', validateForm({ id: 'x', sections: { A: {}, B: { energy: 2 } }, form: ['A', 'B'] })
  .some((p) => p.includes('energy')));
check('form-without-sections flagged', validateForm({ id: 'x', form: ['A'] })
  .some((p) => p.includes('form without sections')));
check('no-dynamic-range flagged', validateForm({ id: 'x', sections: { A: {}, B: { energy: 1 } }, form: ['A', 'B'] })
  .some((p) => p.includes('no dynamic range')));
check('dynamic form passes', validateForm(song).length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
