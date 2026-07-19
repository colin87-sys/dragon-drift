// N15 prop AO math gate (GRAPHICS-OVERHAUL.md). Pure math, CI-safe (THREE only):
// bases darker than tops, down-facing verts darker than up-facing, deterministic,
// all values in [1-AMT, 1].
//   node tests/propao.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const { bakeAO, PROP_AO_AMT, aoUniform, setPropAO } = await import('../js/propAO.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

// A normalized "column": tall cylinder, base at y=0, top at y=1 (like the props).
const col = new THREE.CylinderGeometry(0.4, 0.5, 1, 10).translate(0, 0.5, 0);
bakeAO(col);
const ao = col.getAttribute('aoBake');
check('aoBake attribute created (itemSize 1)', ao && ao.itemSize === 1 && ao.count === col.getAttribute('position').count);

const pos = col.getAttribute('position');
let botSum = 0, botN = 0, topSum = 0, topN = 0, minV = 1, maxV = 0;
for (let i = 0; i < pos.count; i++) {
  const y = pos.getY(i), a = ao.getX(i);
  minV = Math.min(minV, a); maxV = Math.max(maxV, a);
  if (y < 0.2) { botSum += a; botN++; }
  if (y > 0.8) { topSum += a; topN++; }
}
check(`bases darker than tops (${(botSum / botN).toFixed(3)} < ${(topSum / topN).toFixed(3)})`, botSum / botN < topSum / topN - 0.02);
check(`all AO in [${(1 - PROP_AO_AMT).toFixed(2)}, 1] (min ${minV.toFixed(3)}, max ${maxV.toFixed(3)})`, minV >= 1 - PROP_AO_AMT - 1e-6 && maxV <= 1 + 1e-6);

// Down-facing (underside) darker than up-facing: a flat disc with normals ±Y.
const down = new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2).translate(0, 0.5, 0);   // normal -Y (down)
const up = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0.5, 0);     // normal +Y (up)
bakeAO(down); bakeAO(up);
const dAvg = avg(down.getAttribute('aoBake')), uAvg = avg(up.getAttribute('aoBake'));
check(`down-facing darker than up-facing (${dAvg.toFixed(3)} < ${uAvg.toFixed(3)})`, dAvg < uAvg - 0.05);
function avg(attr) { let s = 0; for (let i = 0; i < attr.count; i++) s += attr.getX(i); return s / attr.count; }

// Determinism.
const c2 = new THREE.CylinderGeometry(0.4, 0.5, 1, 10).translate(0, 0.5, 0);
bakeAO(c2);
let same = true;
for (let i = 0; i < ao.count; i++) same = same && ao.getX(i) === c2.getAttribute('aoBake').getX(i);
check('bake is deterministic', same);

// The gate: setPropAO toggles the shared uniform (0 = shipped identity).
check('setPropAO default 0 (shipped)', aoUniform.value === 0);
setPropAO(true); check('setPropAO(true) → 1', aoUniform.value === 1);
setPropAO(false); check('setPropAO(false) → 0', aoUniform.value === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
