// Headless smoke test for the SVJ animation driver: build the dragon, run updateSVJ
// across every flight state for a few seconds of frames, and assert nothing throws,
// no NaNs leak into transforms, and the VFX handles respond. Run: node mecha/smoke.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;
const { buildSVJDragon } = await import('./svjDragon.js');
const { updateSVJ } = await import('./svjAnim.js');

const { group } = buildSVJDragon();
const A = group.userData.anim;
const finite = (o) => ['x', 'y', 'z'].every((k) => Number.isFinite(o[k]));

const states = [
  { name: 'cruise', s: { speedNorm: 0.3 } },
  { name: 'bankL', s: { bank: -1, speedNorm: 0.6 } },
  { name: 'bankR', s: { bank: 1, speedNorm: 0.6 } },
  { name: 'climb', s: { pitch: 1, speedNorm: 0.6 } },
  { name: 'dive', s: { pitch: -1, speedNorm: 0.8 } },
  { name: 'boost', s: { boost: 1, speedNorm: 1 } },
  { name: 'surge', s: { surge: 1, boost: 1, speedNorm: 1 } },
  { name: 'airbrake', s: { airbrake: 1, speedNorm: 0.1 } },
];

let ok = true;
const line = (p, m) => { console.log(`  ${p ? '✓' : '✗'} ${m}`); if (!p) ok = false; };
console.log('SVJ animation driver — smoke test\n');

for (const { name, s } of states) {
  // run ~2s of frames so eased state + kicks settle, then validate the transforms
  for (let f = 0; f < 120; f++) updateSVJ(group, 1 / 60, s);
  group.updateMatrixWorld(true);
  let clean = true;
  group.traverse((o) => { if (o.isObject3D && !(finite(o.rotation) && finite(o.scale) && finite(o.position))) clean = false; });
  const emiOk = [A.materials.red, A.materials.thruster, A.materials.eye].every((m) => Number.isFinite(m.emissiveIntensity) && m.emissiveIntensity >= 0);
  const hostOk = Number.isFinite(A._bodyRoll) && Number.isFinite(A._bodyPitch) && Number.isFinite(A._vibration);
  line(clean && emiOk && hostOk, `${name}: transforms finite · emissive ok · host outputs ok`);
}

// behavioural spot-checks
for (let f = 0; f < 90; f++) updateSVJ(group, 1 / 60, { boost: 1, speedNorm: 1 });
line(A.thrusters[0].userData.flame.scale.z > 1.0, `boost extends thruster flame (z=${A.thrusters[0].userData.flame.scale.z.toFixed(2)})`);
for (let f = 0; f < 90; f++) updateSVJ(group, 1 / 60, { surge: 1, speedNorm: 1 });
line(A.vfx.aura.visible && A.vfx.aura.scale.x > 0.1, `surge reveals aura (visible=${A.vfx.aura.visible})`);
line(A.materials.red.emissive.b > A._red0.b + 0.05, `surge tints red slashes toward surge colour (b=${A.materials.red.emissive.b.toFixed(2)})`);
for (let f = 0; f < 120; f++) updateSVJ(group, 1 / 60, { speedNorm: 0.3 });
line(!A.vfx.aura.visible && A.vfx.tailTrail.scale.z < 0.05, `cruise hides surge VFX (aura ${A.vfx.aura.visible}, trail z ${A.vfx.tailTrail.scale.z.toFixed(3)})`);

console.log(`\n${ok ? 'PASS' : 'FAIL'}`);
process.exit(ok ? 0 : 1);
