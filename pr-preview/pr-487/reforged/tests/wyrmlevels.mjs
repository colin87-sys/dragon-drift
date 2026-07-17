// WYRM level gate — the deterministic guard that the groan (the "creature" voice)
// is neither BURIED by its own formant-bandpass insertion loss (the bug that shipped
// twice) nor OVER-CORRECTED past the finale roar (the third critique's finding). It
// exercises the SAME two-path level function the synth uses (sfxLanceMath.GROAN
// coefficients), so the test can't model something the code doesn't do — the exact
// divergence that made the previous single-path gate vacuous. Pure math + a source
// tripwire, runs in node CI. Run: node tests/wyrmlevels.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { groanMakeup, effectiveGroanLevel, effectiveGroanLevelTwoPath, GROAN } from '../js/sfxLanceMath.js';

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.error('  ✗ ' + name); } };

// The strike f0 dives to ~76 Hz (base·0.7·digK·droop at k=5/damage≈0.95); the finale
// f0 ~112-168; formants 640-900. Across that WHOLE range the compensated two-path
// groan must land AUDIBLE (≥0.08 of the finale's 0.16 nominal) but NOT out-correct
// past ~0.30 (which would out-shout the finale roar and pump the master comp).
const NOMINAL = 0.16;
for (const f0 of [76, 100, 130, 168]) {
  for (const formant of [640, 770, 900]) {
    const eff = effectiveGroanLevelTwoPath(NOMINAL, f0, formant);
    check(`groan audible + not over-corrected f0=${f0} F=${formant} (eff=${eff.toFixed(3)})`,
      eff >= 0.08 && eff <= 0.30);
  }
}

// The strike voice CAP (nominal ≤0.11) must stay below the finale roar (nominal 0.16)
// in EFFECTIVE terms — the no-climax-inversion invariant.
const strikeEff = effectiveGroanLevelTwoPath(0.11, 90, 800);
const finaleEff = effectiveGroanLevelTwoPath(0.16, 126, 720);
check(`finale roar out-levels the capped strike voice (${strikeEff.toFixed(3)} < ${finaleEff.toFixed(3)})`,
  strikeEff < finaleEff);

// Makeup actually compensates: an UN-compensated single path here is buried.
const uncompensated = NOMINAL * GROAN.f1Scale * (2 / ((770 / 130) * Math.PI));   // vol·scale·harmAmp, no makeup
check(`makeup lifts the groan out of the mud (uncomp ${uncompensated.toFixed(3)} < 0.05)`, uncompensated < 0.05);
check('makeup clamped to <=14', groanMakeup(60, 6000) <= 14);
check('makeup floored at >=1', groanMakeup(900, 200) >= 1);

// SOURCE TRIPWIRE — the math test is only meaningful if the SYNTH actually applies
// the makeup. Assert sfxLance2's groan() references groanMakeup, so silently dropping
// it (the exact regression this saga is about) fails CI instead of passing green.
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../js/sfxLance2.js'), 'utf8');
check('sfxLance2 groan() applies groanMakeup (regression tripwire)', /groanMakeup\(f0,\s*F\)/.test(src));
check('sfxLance2 uses the shared GROAN coefficients', /GROAN\.f1Scale/.test(src) && /GROAN\.f2Scale/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
