// DESIGNCHECK — the measurable design-law gate (docs/DRAGON-DESIGN-SYSTEM.md §4).
// Prints every check as VALUE vs THRESHOLD (honesty protocol §1.3: a claim is a
// number, never a bare verdict). Enforces ONLY on dragons declaring a `design:`
// block; the shipped roster is grandfathered and reported informationally.
//
//   node tools/designcheck.mjs               # design-gated table + grandfathered info
//   node tools/designcheck.mjs <key>         # one dragon, verbose
//   node tools/designcheck.mjs --ci          # exit 1 on any FAIL among design: dragons
//
// Beauty is NOT checked here — it can't be. These gates prove proportions,
// silhouette structure and palette structure; the human judges beauty on the
// committed renders and the PR preview (doc §2).

import { DRAGONS, designKeys, hullKeys, checkAll } from './designcheckCore.mjs';

const args = process.argv.slice(2);
const ci = args.includes('--ci');
const keyArg = args.find((a) => !a.startsWith('--'));

const padR = (s, n) => String(s).padEnd(n);
const mark = (r) => (r.skipped ? 'skip' : r.ok ? 'OK' : 'FAIL');

function printDragon(key, enforce) {
  const d = DRAGONS[key];
  console.log(`\n${d.name || key} (${key})${enforce ? '' : ' — grandfathered, informational only'}`);
  console.log('-'.repeat(78));
  for (const r of checkAll(key)) {
    console.log(`  ${padR(r.id, 4)} ${padR(mark(r), 5)} ${padR(String(r.value), 34)} vs ${padR(String(r.threshold), 24)} ${r.detail || ''}`);
  }
}

if (keyArg) {
  if (!DRAGONS[keyArg]) { console.error(`unknown dragon: ${keyArg}`); process.exit(1); }
  printDragon(keyArg, Boolean(DRAGONS[keyArg].design));
} else {
  const gated = designKeys();
  console.log(`Dragon Drift — design-law gate (${gated.length} design-gated dragon${gated.length === 1 ? '' : 's'})`);
  if (!gated.length) console.log('\nNo dragons declare a design: block yet — nothing is enforced.');
  for (const key of gated) printDragon(key, true);

  // Grandfathered baseline: the shipped hull dragons, measured but never failed.
  // This table is the evidence row for why the design system exists.
  const legacy = hullKeys().filter((k) => !DRAGONS[k].design);
  if (legacy.length) {
    console.log('\n════ Grandfathered baseline (shipped roster — informational, never enforced) ════');
    for (const key of legacy) printDragon(key, false);
  }
}

if (ci) {
  let fails = 0;
  for (const key of designKeys()) for (const r of checkAll(key)) if (!r.skipped && !r.ok) fails++;
  if (fails > 0) { console.error(`\n${fails} design-gate failure(s) among design-gated dragons.`); process.exitCode = 1; }
  else console.log('\ndesign gate: all design-gated dragons pass.');
}
