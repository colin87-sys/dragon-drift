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

// WEFTWITCH mendedBanner (§5j slot 11, CP2): every sampled frame is finite and the
// path terminates at station — the enterFight handoff contract every script owes.
{
  let finite = true, bad0 = '';
  for (let u = 0; u <= 1.0001; u += 0.05) {
    const fr = entranceFrame('mendedBanner', Math.min(u, 1), ctx, player);
    for (const k of ['x', 'y', 'rel', 'tuck', 'yaw', 'gx', 'gy']) {
      if (!Number.isFinite(fr[k])) { finite = false; bad0 = `u=${u} ${k}=${fr[k]}`; }
    }
  }
  if (finite) ok('mendedBanner: every sampled frame is finite');
  else bad(`mendedBanner produced a non-finite frame: ${bad0}`);
  const e2 = entranceFrame('mendedBanner', 1, ctx, player);
  if (r6(e2.x) === 0 && r6(e2.y) === 13 && r6(e2.rel) === 30) ok('mendedBanner terminates at station (0, fightHeight, settleGap)');
  else bad(`mendedBanner u=1 not at station: (${e2.x}, ${e2.y}, ${e2.rel})`);
  // She watches you through the drop: the gaze pitches DOWN early, level at settle.
  const g0 = entranceFrame('mendedBanner', 0.1, ctx, player), g1 = entranceFrame('mendedBanner', 1, ctx, player);
  if (g0.gy < -0.3 && Math.abs(g1.gy) < 0.01) ok('mendedBanner gaze: down through the drop, level at settle');
  else bad(`mendedBanner gaze wrong: gy(0.1)=${g0.gy}, gy(1)=${g1.gy}`);
}

// ONEWING theGraveItCarries (§5j slot 12, CP2): the no-warn two-shot. Every frame finite,
// terminates at station (the enterFight handoff every script owes), the gaze tracks the
// player the whole arrival (the mutual grief-lock), and the reveal lifts from below the
// flank into frame (y rises). A player offset to one side proves the gaze is real (nonzero).
{
  const P = { position: { x: 6, y: 8 }, dist: 0 };   // offset player → the gaze must point at them
  let finite = true, bad0 = '';
  for (let u = 0; u <= 1.0001; u += 0.05) {
    const fr = entranceFrame('theGraveItCarries', Math.min(u, 1), ctx, P);
    for (const k of ['x', 'y', 'rel', 'tuck', 'yaw', 'gx', 'gy']) {
      if (!Number.isFinite(fr[k])) { finite = false; bad0 = `u=${u} ${k}=${fr[k]}`; }
    }
  }
  if (finite) ok('theGraveItCarries: every sampled frame is finite');
  else bad(`theGraveItCarries produced a non-finite frame: ${bad0}`);
  const e3 = entranceFrame('theGraveItCarries', 1, ctx, P);
  if (r6(e3.x) === 0 && r6(e3.y) === 13 && r6(e3.rel) === 30) ok('theGraveItCarries terminates at station (0, fightHeight, settleGap)');
  else bad(`theGraveItCarries u=1 not at station: (${e3.x}, ${e3.y}, ${e3.rel})`);
  // The reveal LIFTS from below the flank (y at u=0 is below the frame, rises to the hold).
  const r0 = entranceFrame('theGraveItCarries', 0, ctx, P), rHold = entranceFrame('theGraveItCarries', 0.5, ctx, P);
  if (r0.y < 0 && rHold.y > r0.y) ok('theGraveItCarries reveal: rises from below the frame into the flank hold');
  else bad(`theGraveItCarries reveal wrong: y(0)=${r0.y}, y(0.5)=${rHold.y}`);
  // The mutual gaze POINTS at the player through the held silence (gx nonzero toward them).
  const gHold = entranceFrame('theGraveItCarries', 0.5, ctx, P);
  if (Math.abs(gHold.gx) > 0.05) ok('theGraveItCarries gaze: locks onto the player through the held silence');
  else bad(`theGraveItCarries gaze not tracking: gx(0.5)=${gHold.gx}`);
}

console.log(`\n${pass} entrance checks passed${fail ? `, ${fail} FAILED` : ''}.`);
if (fail) process.exit(1);
