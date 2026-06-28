// WING-RIG core gate — locks the span-wise segmentation + joint/axis math the editor (glbtagger.html)
// shares. Pure typed-arrays, no DOM. The Three FK preview is judged by eye in the tool; this asserts the
// data: bones tile the wing span without gaps/overlap, only wing verts get bound, joints sit on the span,
// the flap axis follows the tilt, and the whip is lagged + tip-biased.

import {
  evenJointSpans, boneIndex, assignBones, boneCounts, jointChain, flapAxis, boneAngles,
} from '../tools/wingRigCore.mjs';

let pass = 0, fails = 0;
function check(cond, msg) { if (cond) { pass++; } else { fails++; console.log(`  ✗ ${msg}`); } }

const WING = 1;

// 1) EVEN JOINT SPANS — bones+1 ascending boundaries from hingeX to tip.
const js = evenJointSpans(0.2, 1.0, 4);
check(js.length === 5, `4 bones ⇒ 5 joint boundaries (got ${js.length})`);
check(js[0] === 0.2 && js[4] === 1.0, `chain spans hingeX→tip (${js[0]}…${js[4]})`);
check(js.every((v, i) => i === 0 || v > js[i - 1]), `boundaries strictly ascending`);

// 2) BONE INDEX — each span band maps to the right bone; clamps at both ends.
check(boneIndex(0.1, js) === 0, `inboard of hinge ⇒ bone 0`);
check(boneIndex(0.25, js) === 0 && boneIndex(0.45, js) === 1 && boneIndex(0.95, js) === 3, `bands map in order`);
check(boneIndex(2.0, js) === 3, `outboard of tip ⇒ last bone`);

// 3) ASSIGN — only wing verts get a bone; the wing tiles all bones with no -1 left inside the wing.
//    Synthetic: a wing strip along +X (span) from 0.2→1.0 at y=0,z=0, plus body verts near the axis.
const pts = [], parts = [];
for (let x = 0.2; x <= 1.0; x += 0.02) { pts.push(x, 0, 0); parts.push(WING); pts.push(-x, 0, 0); parts.push(WING); }
for (let z = -0.5; z <= 0.5; z += 0.05) { pts.push(0.05, 0, z); parts.push(0); }   // body (not wing)
const P = new Float32Array(pts), PA = new Uint8Array(parts);
const ids = assignBones(P, PA, WING, 'x', js);
let wrongBody = 0, wingUnassigned = 0;
for (let i = 0; i < PA.length; i++) {
  if (PA[i] !== WING && ids[i] !== -1) wrongBody++;
  if (PA[i] === WING && ids[i] < 0) wingUnassigned++;
}
check(wrongBody === 0, `non-wing verts never get a bone (got ${wrongBody})`);
check(wingUnassigned === 0, `every wing vert gets a bone (unassigned ${wingUnassigned})`);
const counts = boneCounts(ids, 4);
check(counts.perBone.every((c) => c > 0), `all 4 bones receive verts (${counts.perBone.join(',')})`);
// symmetry: +X and −X wing verts at the same |span| share a bone index
check(ids[0] === ids[1], `mirrored wing verts share a bone (L/R symmetric)`);

// 4) JOINT CHAIN — joints sit on the span axis at the shoulder's depth/height; side mirrors across span.
const jc = jointChain(js, 'x', [0.2, 0.1, -0.05], 1);
check(jc.length === 5 && Math.abs(jc[4][0] - 1.0) < 1e-9, `tip joint at span=tip on +X (${jc[4][0]})`);
check(jc[2][1] === 0.1 && jc[2][2] === -0.05, `joints keep the shoulder's y,z (chain runs along span)`);
const jcL = jointChain(js, 'x', [0.2, 0.1, -0.05], -1);
check(jcL[4][0] === -1.0, `side=−1 mirrors the chain across the span axis`);

// 5) FLAP AXIS — tilt 0 ⇒ spine axis; tilt ±90° ⇒ depth axis (matches the shader beat-plane tilt).
const a0 = flapAxis('z', 'y', 0);          // spine=z, depth=y
check(Math.abs(a0[2] - 1) < 1e-9 && Math.abs(a0[1]) < 1e-9, `tilt 0 ⇒ rotate about spine (z)`);
const a90 = flapAxis('z', 'y', Math.PI / 2);
check(Math.abs(a90[1] - 1) < 1e-9 && Math.abs(a90[2]) < 1e-6, `tilt 90° ⇒ rotate about depth (y)`);

// 6) WHIP — bone angles are phase-LAGGED (tip trails shoulder) and tip-BIASED (tip swings wider).
const ang = boneAngles(0.0, 4, { amp: 0.6, lag: 0.5, tipBias: 0.6 });
check(ang.length === 4, `one angle per bone`);
// at phase 0: shoulder sin(0)=0; tip sin(-1.5)<0 — the tip is already moving while the shoulder is at rest
check(Math.abs(ang[0]) < 1e-9 && Math.abs(ang[3]) > 0.1, `tip leads/trails the shoulder (lag): root ${ang[0].toFixed(2)}, tip ${ang[3].toFixed(2)}`);
// peak swing of the tip exceeds the shoulder (tip bias) — compare amplitudes over a cycle
let rootMax = 0, tipMax = 0;
for (let ph = 0; ph < 7; ph += 0.05) { const a = boneAngles(ph, 4, { amp: 0.6, lag: 0.5, tipBias: 0.6 }); rootMax = Math.max(rootMax, Math.abs(a[0])); tipMax = Math.max(tipMax, Math.abs(a[3])); }
check(tipMax > rootMax * 1.3, `tip swings wider than the root (tipBias): tip ${tipMax.toFixed(2)} > root ${rootMax.toFixed(2)}`);

console.log(`\nWing-rig core gate`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
