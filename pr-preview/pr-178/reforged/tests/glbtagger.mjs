// GLB PART-TAGGER core gate — locks the classifier + deform math the tool (tools/glbtagger.html) shares
// with the engine (dragonGlb.js). No WebGL/DOM, pure typed-arrays.
//
//   node tests/glbtagger.mjs
//
// Asserts: the WING classification is byte-identical to the flap's wmask (painted wing == flapped wing);
// the classifier is left/right SYMMETRIC on a symmetric mesh; head/tail land on the right spine ends and
// don't overlap; the deform mirrors the wingflap/slither invariants (body anchored, tail excluded, head
// anchored, oscillates); and the export string carries the engine knobs.

import {
  PART, classifyParts, partCounts, defaultGates, guessAxes, aabb,
  flapDelta, slitherOffset, applyDeform, buildExport, depthAxis,
} from '../tools/glbtaggerCore.mjs';

let pass = 0, fails = 0;
function check(cond, msg) { if (cond) { pass++; } else { fails++; console.log(`  ✗ ${msg}`); } }

// ── A synthetic "dragon" point cloud in the Thundercoil native frame: spine = Y (head +Y → tail −Y),
//    span = X (wings ±X), depth = Z. Body core near the axis, two wings wide in X in the front band, a
//    tail running down −Y, a head blob at the top. Mirrored in X so it's perfectly symmetric.
function buildCloud() {
  const pts = [];
  const add = (x, y, z) => pts.push(x, y, z);
  // body core: a column along Y, narrow in X/Z
  for (let y = -0.6; y <= 0.7; y += 0.05) { add(0.05, y, 0.0); add(-0.05, y, 0.0); add(0.0, y, 0.06); }
  // head blob at the top (+Y)
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; add(0.12 * Math.cos(a), 0.85, 0.12 * Math.sin(a)); }
  // wings: wide in X (0.3..0.95) in the FRONT band (y 0.0..0.55), mirrored
  for (let x = 0.32; x <= 0.95; x += 0.03)
    for (let y = 0.0; y <= 0.55; y += 0.06) { add(x, y, -0.1); add(-x, y, -0.1); }
  // tail: runs down −Y, also swings a little wide in X near the curl (must NOT be a wing)
  for (let y = -0.75; y <= -0.2; y += 0.04) { const x = 0.4 * (-y - 0.2); add(x, y, 0.2); add(-x, y, 0.2); }
  return new Float32Array(pts);
}

const cloud = buildCloud();
const box = aabb(cloud);

// 1) AXIS GUESS — widest is the wingspan (X), longest of the rest is the spine (Y).
const g = guessAxes(cloud);
check(g.spanAxis === 'x', `guessAxes: wingspan axis is X (got ${g.spanAxis})`);
check(g.spineAxis === 'y', `guessAxes: spine axis is Y (got ${g.spineAxis})`);
check(depthAxis('x', 'y') === 'z', `depthAxis(x,y) === z`);

// Gates: start from defaults, then pin to known-good cuts for this cloud.
const gates = { ...defaultGates(cloud), spanAxis: 'x', spineAxis: 'y', headAtMax: true,
  hingeX: 0.28, wingMinS: -0.15, headCutS: 0.75, tailCutS: -0.2 };
const ids = classifyParts(cloud, gates);
const counts = partCounts(ids);
check(counts.wing > 0 && counts.head > 0 && counts.tail > 0 && counts.body > 0,
  `all four parts populated (${JSON.stringify(counts)})`);

// 2) WING == FLAP wmask — every vertex the classifier calls WING must be exactly the verts the flap moves
//    (|x| ≥ hingeX AND y ≥ minS), and no other vertex should move under the flap.
const flapP = { hingeX: gates.hingeX, hingeZ: 0, amp: 0.55, minS: gates.wingMinS };
let mismatch = 0, movedNonWing = 0;
for (let i = 0; i < cloud.length / 3; i++) {
  const x = cloud[i * 3], y = cloud[i * 3 + 1], z = cloud[i * 3 + 2];
  const d = flapDelta(x, z, y, Math.PI / 2, flapP);          // span=x, depth=z, spine=y
  const moves = Math.abs(d.da) > 1e-9 || Math.abs(d.db) > 1e-9;
  const isWing = ids[i] === PART.WING;
  if (moves !== isWing) mismatch++;
  if (moves && !isWing) movedNonWing++;
}
check(mismatch === 0, `classifier WING set == flap-moved set (mismatch ${mismatch})`);
check(movedNonWing === 0, `nothing outside the wing class flaps (got ${movedNonWing})`);

// 3) SYMMETRY — the part assignment is mirror-symmetric across X (a symmetric mesh tags symmetrically).
let asym = 0;
const keyOf = (x, y, z) => `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
const partAt = new Map();
for (let i = 0; i < cloud.length / 3; i++) partAt.set(keyOf(cloud[i * 3], cloud[i * 3 + 1], cloud[i * 3 + 2]), ids[i]);
for (let i = 0; i < cloud.length / 3; i++) {
  const x = cloud[i * 3], y = cloud[i * 3 + 1], z = cloud[i * 3 + 2];
  const mir = partAt.get(keyOf(-x, y, z));
  if (mir != null && mir !== ids[i]) asym++;
}
check(asym === 0, `classification is left/right symmetric (asymmetric verts ${asym})`);

// 4) TAIL EXCLUDED FROM WINGS — the wide-in-X tail verts (y < minS) are TAIL, never WING.
let tailAsWing = 0;
for (let i = 0; i < cloud.length / 3; i++) {
  const y = cloud[i * 3 + 1];
  if (y < gates.wingMinS && Math.abs(cloud[i * 3]) >= gates.hingeX && ids[i] === PART.WING) tailAsWing++;
}
check(tailAsWing === 0, `wide tail verts below minS are not tagged WING (got ${tailAsWing})`);

// 5) DEFORM — applyDeform leaves the head anchored and oscillates a wingtip over phase.
const baseCloud = cloud.slice(), outA = new Float32Array(cloud.length), outB = new Float32Array(cloud.length);
const slP = { amp: 0.10, freq: 8.0, waveSpeed: 4.0, spineMin: box.min[1], spineMax: box.max[1] };
applyDeform(baseCloud, outA, { spanAxis: 'x', spineAxis: 'y', flap: { ...flapP, phase: 0.0 }, slither: { ...slP, phase: 0 } });
applyDeform(baseCloud, outB, { spanAxis: 'x', spineAxis: 'y', flap: { ...flapP, phase: Math.PI / 2 }, slither: { ...slP, phase: 0 } });
// head vertex (the +Y blob) barely moves (slither anchored at head, flap zero there)
let headMove = 0, tipMove = 0;
for (let i = 0; i < cloud.length / 3; i++) {
  const y = cloud[i * 3 + 1];
  const dx = outB[i * 3] - baseCloud[i * 3], dz = outB[i * 3 + 2] - baseCloud[i * 3 + 2];
  if (y > 0.8) headMove = Math.max(headMove, Math.abs(dx), Math.abs(dz));
  if (Math.abs(cloud[i * 3]) > 0.9 && y > 0.0 && y < 0.55) tipMove = Math.max(tipMove, Math.abs(dz));
}
check(headMove < 0.02, `head stays ~anchored under deform (max ${headMove.toFixed(3)})`);
check(tipMove > 0.05, `wingtip swings under flap (max |dz| ${tipMove.toFixed(3)})`);

// 6) EXPORT — the block carries the engine knobs and tidies the radian to Math.PI forms.
const txt = buildExport({ key: 'emberMonarch', gates, orient: { scale: 3.9, rotY: Math.PI, rotX: -Math.PI / 2, rotZ: 0 },
  slither: { amp: 0.1, freq: 8, speed: 4 }, flap: { hingeX: 0.28, minS: -0.15, amp: 0.55 }, bbox: box });
check(/fusedWings: true/.test(txt) && /hingeX: 0\.28/.test(txt) && /rotX: -Math\.PI\/2/.test(txt) && /rotY: Math\.PI/.test(txt),
  `export carries fusedWings + hingeX + Math.PI orientation`);

console.log(`\nGLB part-tagger core gate`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
