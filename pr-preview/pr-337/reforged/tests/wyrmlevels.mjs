// WYRM level gate — the deterministic guard the harsh critique demanded: the groan
// (the "creature" voice) must NOT be buried by its own formant-bandpass insertion
// loss (the bug that shipped twice). Pure math, no browser, so it runs in node CI.
// Run: node tests/wyrmlevels.mjs
import { groanMakeup, effectiveGroanLevel } from '../js/sfxLanceMath.js';

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.error('  ✗ ' + name); } };

// The wyrm body sits at fundamental ~112-168 Hz (base 160-240 × 0.7); the groan
// formant at 640-900 Hz. Across that whole range the compensated groan must land
// in an AUDIBLE band comparable to a modal partial (partials are ~0.045-0.09).
const NOMINAL = 0.16;   // the finale groan's nominal vol
for (const f0 of [112, 140, 168]) {
  for (const formant of [640, 770, 900]) {
    const eff = effectiveGroanLevel(NOMINAL, f0, formant);
    // "Not buried": at least a third of nominal actually reaches the bus, i.e. the
    // makeup cancels most of the ~1/n harmonic loss (an uncompensated groan here
    // would be ~0.02-0.03, well under this floor → this test would FAIL, as intended).
    check(`groan audible f0=${f0} formant=${formant} (eff=${eff.toFixed(3)})`, eff >= 0.05);
  }
}

// The makeup must actually compensate: without it, effective level is 1/makeup of
// the compensated one — assert the compensated level is materially higher (the
// regression guard: deleting the makeup drops the level below the floor above).
const f0 = 140, formant = 770;
const withMakeup = effectiveGroanLevel(NOMINAL, f0, formant);
const withoutMakeup = withMakeup / groanMakeup(f0, formant);
check(`makeup lifts the groan out of the mud (${withoutMakeup.toFixed(3)} → ${withMakeup.toFixed(3)})`,
  withMakeup >= withoutMakeup * 4 && withoutMakeup < 0.05);

// Makeup is clamped (never a runaway boost that would clip the master).
check('makeup clamped to <=14', groanMakeup(60, 6000) <= 14);
check('makeup floored at >=1', groanMakeup(900, 200) >= 1);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
