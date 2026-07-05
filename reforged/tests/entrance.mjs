// tests/entrance.mjs — §5j entrance-engine regression gate.
//
// The generalization of updateFlythrough into ENTRANCE_SCRIPTS must NOT change
// ASHTALON's shipped overtake by a single float. This pins the `overtake` script's
// per-frame output to a golden trace captured from the pre-refactor formulas
// (tests/fixtures/ashtalon-entrance.golden.json). If a future edit to the shared
// path/tuck/yaw/gaze math drifts ASHTALON, this fails loudly.
import { readFileSync } from 'node:fs';
import { entranceFrame } from '../js/entranceScripts.js';

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log('  ✓', m); };
const bad = (m) => { fail++; console.log('  ✗', m); };

const golden = JSON.parse(readFileSync(new URL('./fixtures/ashtalon-entrance.golden.json', import.meta.url)));

// Same fixed reference the golden generator used: default cineAnchor (0, 8), side +1,
// CONFIG.BOSS fightHeight 13 / settleGap 30, and a stationary player at (0, 8).
const ctx = { AX: 0, AY: 8, S: 1, B: { fightHeight: 13, settleGap: 30 } };
const player = { position: { x: 0, y: 8 }, dist: 0 };
const r6 = (n) => Math.round(n * 1e6) / 1e6;

let maxErr = 0, worst = '';
for (const { u, f } of golden) {
  const fr = entranceFrame('overtake', u, ctx, player);
  const got = [r6(fr.x), r6(fr.y), r6(fr.rel), r6(fr.tuck), r6(fr.yaw), r6(fr.gx), r6(fr.gy), fr.slow];
  for (let i = 0; i < f.length; i++) {
    const e = Math.abs(got[i] - f[i]);
    if (e > maxErr) { maxErr = e; worst = `u=${u} field=${['x','y','rel','tuck','yaw','gx','gy','slow'][i]} golden=${f[i]} got=${got[i]}`; }
  }
}
if (maxErr === 0) ok(`ASHTALON overtake replays BYTE-IDENTICAL across ${golden.length} keyframes (max err 0)`);
else bad(`ASHTALON overtake DRIFTED: max err ${maxErr} at ${worst}`);

// Sanity: the path terminates at station (0, fightHeight, settleGap) at u=1 — the
// enterFight handoff point every script must reach.
const end = entranceFrame('overtake', 1, ctx, player);
if (r6(end.x) === 0 && r6(end.y) === 13 && r6(end.rel) === 30) ok('overtake terminates at station (0, fightHeight, settleGap)');
else bad(`overtake u=1 not at station: (${end.x}, ${end.y}, ${end.rel})`);

console.log(`\n${pass} entrance checks passed${fail ? `, ${fail} FAILED` : ''}.`);
if (fail) process.exit(1);
