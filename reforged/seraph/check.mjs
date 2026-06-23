// Standalone verification for the Radiant Paladin build — no browser, no old
// chassis system. Asserts the creature assembles, every brief-critical module
// family is present, the emissive holy modules exist, and it stays in a sane
// mobile tri budget. Run: node seraph/check.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;
const { buildRadiantPaladin } = await import('./radiantPaladin.js');

const { group } = buildRadiantPaladin();
const roles = new Map();
let tris = 0;
group.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  const g = o.geometry; tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  const r = o.userData.role || '?'; roles.set(r, (roles.get(r) || 0) + 1);
});
tris = Math.round(tris);

// chase-cam priority modules from the brief that MUST be present to read
const required = ['membrane', 'goldRim', 'pearlPlate', 'seam', 'halo', 'haloGem',
  'comet', 'bladeCore', 'vertebra', 'tailGlow', 'spineCap', 'gorget', 'shoulderGem', 'eye'];
const BUDGET = 8000;

let ok = true;
const line = (pass, msg) => { console.log(`  ${pass ? '✓' : '✗'} ${msg}`); if (!pass) ok = false; };
console.log('Radiant Paladin — standalone build check\n');
for (const r of required) line(roles.has(r), `module "${r}" present${roles.has(r) ? ` ×${roles.get(r)}` : ''}`);
line(tris <= BUDGET, `${tris} tris within mobile budget (<= ${BUDGET})`);
const emissive = (roles.get('seam') || 0) + (roles.get('halo') || 0) + (roles.get('comet') || 0) + (roles.get('tailGlow') || 0);
line(emissive >= 8, `${emissive} holy/glow emissive modules`);

console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${roles.size} distinct module roles, ${tris} tris`);
process.exit(ok ? 0 : 1);
