// Measure the SVJ dragon's wing proportions against the head-to-tail master scale.
// Run: node mecha/measure.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;
const THREE = await import('three');
const { buildSVJDragon } = await import('./svjDragon.js');

const { group } = buildSVJDragon(); group.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(group), sz = box.getSize(new THREE.Vector3());
const HT = sz.z, U = HT / 100;                       // 1 spec unit (head-to-tail = 100)
const spec = (m) => (m / U).toFixed(1);

// find each wing's tip = its highest world-space vertex
const wing = group.children.find((c) => c.userData.side === 1);
const root = wing.position.clone();
let tip = null, best = -Infinity;
const v = new THREE.Vector3();
wing.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  const p = o.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (v.y > best) { best = v.y; tip = v.clone(); } }
});
const len = tip.distanceTo(root);

const row = (label, val, lo, hi) => {
  const n = +val, ok = n >= lo && n <= hi;
  console.log(`  ${ok ? '✓' : '·'} ${label.padEnd(34)} ${val.padStart(6)}   target ${lo}–${hi}`);
};
console.log(`head-to-tail = ${HT.toFixed(2)} model  (=100 spec; 1 spec = ${U.toFixed(4)} model)\n`);
row('each wing root→tip length', spec(len), 50, 58);
row('projected rear width (tip↔tip)', spec(tip.x * 2), 85, 95);
row('wing height above back (y-0.5)', spec(tip.y - 0.5), 45, 60);
row('true span (3D tip↔tip)', spec(tip.x * 2), 110, 125);   // symmetric tips → 3D dist = 2·|x|
console.log(`\n  wingtip world (model): x=${tip.x.toFixed(2)} y=${tip.y.toFixed(2)} z=${tip.z.toFixed(2)}`);
