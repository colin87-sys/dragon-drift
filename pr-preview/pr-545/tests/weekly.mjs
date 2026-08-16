// Weekly trial seeding: deterministic draw, correct ISO week keys including
// year boundaries, distinct trials.
import { assert, assertEq } from './shim.mjs';

const { isoWeekKeyUTC, drawWeekly } = await import('../js/weekly.js');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

// Known ISO week facts
assertEq(isoWeekKeyUTC(new Date('2026-06-12T10:00:00Z')), '2026-W24', 'Jun 12 2026 is W24');
assertEq(isoWeekKeyUTC(new Date('2026-01-01T00:00:00Z')), '2026-W01', 'Jan 1 2026 is W01 (Thursday)');
assertEq(isoWeekKeyUTC(new Date('2024-12-30T00:00:00Z')), '2025-W01', 'Dec 30 2024 belongs to 2025-W01');
assertEq(isoWeekKeyUTC(new Date('2027-01-01T00:00:00Z')), '2026-W53', 'Jan 1 2027 belongs to 2026-W53');
assertEq(isoWeekKeyUTC(new Date('2026-06-07T23:59:59Z')), '2026-W23', 'Sunday stays in the old week');
assertEq(isoWeekKeyUTC(new Date('2026-06-08T00:00:00Z')), '2026-W24', 'Monday 00:00 UTC flips the week');
ok('ISO week keys correct across year boundaries and week flips');

// Deterministic, distinct draws
const a = drawWeekly('2026-W24');
const b = drawWeekly('2026-W24');
assertEq(JSON.stringify(a), JSON.stringify(b), 'same key → same draw');
assertEq(a.length, 3, 'draws exactly 3');
assertEq(new Set(a).size, 3, 'draws are distinct');
ok(`draw deterministic & distinct (${a.join(', ')})`);

// Different weeks differ at least sometimes (check 8 consecutive weeks)
const draws = new Set();
for (let w = 20; w < 28; w++) draws.add(drawWeekly(`2026-W${w}`).join(','));
assert(draws.size >= 4, `rotation varies across weeks (${draws.size}/8 unique)`);
ok(`rotation varies across weeks (${draws.size}/8 unique draws)`);

console.log(`\n${n} weekly checks passed.`);
