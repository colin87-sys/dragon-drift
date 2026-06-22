// Standalone verification for the SVJ mecha dragon kit. Asserts every brief
// module family is present (named roles), checks the chase-cam priority modules,
// and keeps the assembly in a sane mobile tri budget. Run: node mecha/check.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
globalThis.window = globalThis;
const { buildSVJDragon } = await import('./svjDragon.js');

const { group } = buildSVJDragon();
const roles = new Map(); let tris = 0;
group.traverse((o) => {
  if (!o.isMesh || !o.geometry) return;
  const g = o.geometry; tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  const r = o.userData.role || '?'; roles.set(r, (roles.get(r) || 0) + 1);
});
tris = Math.round(tris);

// the module families the brief requires, by their tagged role
const required = [
  'spineCore', 'topArmor', 'seamLight',          // 1 spine segment
  'headShell', 'eye', 'hornFin', 'jawBlade',     // 2 wedge head
  'torsoCore', 'torsoArmor', 'sideIntake',       // 3 engine bay
  'ventPlate', 'ventSlit',                       // 4 angled vent plate
  'chevron',                                     // 5 chevron taillight
  'wingMount', 'shoulderHinge', 'jointCore', 'wingInnerStruct', 'wingStrut',     // 6a blade-wing root
  'outerWingBlade', 'secondaryBlade', 'tertiaryBlade', 'energyChannel',          // 6b layered blades + glow
  'thrusterHousing', 'thrusterCore', 'thrusterFlame',  // 7 twin thruster pod
  'diffuserFin',                                 // 8 diffuser
  'tailBladeFin', 'tailSpear',                   // 9 segmented tail
  'clawFoot', 'heelFin',                         // 10 mecha leg
  'hexGrille',                                   // carbon insert
];
const BUDGET = 9000;

let ok = true;
const line = (p, m) => { console.log(`  ${p ? '✓' : '✗'} ${m}`); if (!p) ok = false; };
console.log('SVJ Mecha Dragon — modular kit check\n');
for (const r of required) line(roles.has(r), `module "${r}"${roles.has(r) ? ` ×${roles.get(r)}` : ' MISSING'}`);
line((roles.get('thrusterCore') || 0) === 2, `exactly 2 thruster cores (twin) — got ${roles.get('thrusterCore') || 0}`);
line((roles.get('shoulderHinge') || 0) === 2, `2 mirrored wing systems — got ${roles.get('shoulderHinge') || 0}`);
line(tris <= BUDGET, `${tris} tris within mobile budget (<= ${BUDGET})`);

console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${roles.size} distinct module roles, ${tris} tris`);
process.exit(ok ? 0 : 1);
