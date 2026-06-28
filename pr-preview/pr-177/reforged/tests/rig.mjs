// SKINNED RIG GATE — the asset-backed dragon's procedural skeleton (dragonGlbRig.js) is
// built + skinned in the browser (no WebGL in CI), so as with slither/wingflap we lock the
// PURE part: computeRigSkin (vertex → bone weights). Asserts the invariants a correct skin
// must satisfy so a bad region/threshold change can't silently ship a torn or unbound mesh.
//
//   node tests/rig.mjs
//
// Invariants: every vertex's weights sum to 1; ≤4 influences; no negative weights; each
// landmark vertex binds to the RIGHT bone (wingtip→wrist, wing root→chest blend, tail
// tip→tailB, belly/legs→root, head→chest); left/right wings bind to their own chain.

import { computeRigSkin, B } from '../js/dragonGlbRig.js';

let pass = 0, fails = 0;
const check = (cond, msg) => { if (cond) pass++; else { fails++; console.log(`  ✗ ${msg}`); } };

// A spread of landmark verts in NATIVE space (measured regions, tools/glbsegment.mjs).
const V = {
  wingTipR:  [0.93, 0.80, -0.20],   // far right membrane  → wrR
  wingMidR:  [0.62, 0.55, -0.15],   // mid right wing      → elR
  wingRootR: [0.33, 0.30, -0.08],   // inboard right wing  → shR + chest seam
  wingTipL:  [-0.93, 0.80, -0.20],  // far left membrane   → wrL
  tailTip:   [0.04, -0.62, -0.52],  // tail end            → tailB
  tailBase:  [0.02, -0.40, -0.33],  // tail base           → tailA (+root seam)
  head:      [0.00, 0.15, 0.60],    // snout/skull         → chest
  belly:     [0.00, -0.50, 0.20],   // low belly           → root
  footFL:    [0.25, -0.85, 0.40],   // a foot              → root
};
const names = Object.keys(V);
const flat = new Float32Array(names.length * 3);
names.forEach((k, i) => { flat[i * 3] = V[k][0]; flat[i * 3 + 1] = V[k][1]; flat[i * 3 + 2] = V[k][2]; });
const { skinIndex, skinWeight } = computeRigSkin(flat);

const wAt = (i) => [0, 1, 2, 3].map((k) => [skinIndex[i * 4 + k], skinWeight[i * 4 + k]]);
const wOf = (i, bone) => wAt(i).reduce((s, [b, w]) => s + (b === bone ? w : 0), 0);
const top = (i) => wAt(i).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1])[0];

// 1) PARTITION OF UNITY — weights sum to 1, none negative, ≤4 influences (every vertex).
let sumOk = true, negOk = true, cntOk = true;
for (let i = 0; i < names.length; i++) {
  let s = 0, c = 0;
  for (let k = 0; k < 4; k++) { const w = skinWeight[i * 4 + k]; s += w; if (w < 0) negOk = false; if (w > 0) c++; }
  if (Math.abs(s - 1) > 1e-4) sumOk = false;
  if (c > 4) cntOk = false;
}
check(sumOk, 'every vertex weights sum to 1');
check(negOk, 'no negative weights');
check(cntOk, '≤4 influences per vertex');

// 2) WING — the whole membrane binds to ONE shoulder bone (single-pivot rigid flap); the
//    left/right wings bind to their OWN shoulder and never cross over.
check(top(names.indexOf('wingTipR'))[0] === B.SHR, 'right wingtip binds to right shoulder (single pivot)');
check(top(names.indexOf('wingMidR'))[0] === B.SHR, 'right wing mid binds to right shoulder');
check(top(names.indexOf('wingTipL'))[0] === B.SHL, 'left wingtip binds to left shoulder');
check(wOf(names.indexOf('wingTipR'), B.SHL) === 0, 'right wing never bleeds onto the LEFT shoulder');
// 3) WING ROOT bleeds a little into the chest (so the root doesn't hard-tear off the body).
check(wOf(names.indexOf('wingRootR'), B.CHEST) > 0.05, 'inboard wing root blends into chest');

// 4) TAIL CHAIN — tip→tailB, base mixes tailA (+ a little root at the very base).
check(top(names.indexOf('tailTip'))[0] === B.TAILB, 'tail tip binds to tailB');
check(wOf(names.indexOf('tailBase'), B.TAILA) > 0.2, 'tail base bound to tailA');

// 5) BODY — head rides the chest (heave); belly + foot are root.
check(top(names.indexOf('head'))[0] === B.CHEST, 'head rides the chest bone');
check(top(names.indexOf('belly'))[0] === B.ROOT, 'belly binds to root');
check(top(names.indexOf('footFL'))[0] === B.ROOT, 'foot binds to root');

console.log(`\nSkinned-rig gate — computeRigSkin (10 bones: chest+3·2 wings+2 tail)`);
console.log(`${pass} checks passed, ${fails} failed.`);
if (fails > 0) process.exitCode = 1;
