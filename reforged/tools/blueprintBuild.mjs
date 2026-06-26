// blueprintBuild — the "prompt → blueprint → validate → build" round-trip, headless.
//
// Takes a creatureGrammar-shaped JSON blueprint (a file arg, or stdin), VALIDATES it
// against the grammar, BUILDS it through the same shared mesh builder the game uses,
// and reports per-form triangle counts + any errors/warnings. This is the closed
// authoring loop the ledger named (L48): an AI (or human) emits a blueprint, this
// proves it builds in-budget and is grammar-clean BEFORE it ever touches dragons.js.
// Pair it with tools/silhouette*.mjs to compare the built shape against a concept.
//
//   node tools/blueprintBuild.mjs creature.json        # build + validate a file
//   echo '{...}' | node tools/blueprintBuild.mjs        # ...or from stdin
//   node tools/blueprintBuild.mjs creature.json --json  # machine-readable result
//
// It writes nothing and touches no save state — purely diagnostic. Exit 1 if the
// blueprint fails validation or any form exceeds the per-form budget.

import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('./three-resolver.mjs', import.meta.url);

// Minimal DOM/canvas shim (same as tricount) so util.js texture helpers don't throw.
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { validateCreatureBlueprint } = await import('../js/validateCreatureBlueprint.js');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const fileArg = args.find((a) => !a.startsWith('--'));
const BUDGET = 6000;
const FORM_NAMES = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];

function readInput() {
  if (fileArg) return readFileSync(fileArg, 'utf8');
  return readFileSync(0, 'utf8'); // stdin
}

function countTris(obj) {
  let tris = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      if (g.index) tris += g.index.count / 3;
      else if (g.attributes && g.attributes.position) tris += g.attributes.position.count / 3;
    }
  });
  return Math.round(tris);
}
function dispose(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const m = o.material;
    if (Array.isArray(m)) m.forEach((x) => x && x.dispose && x.dispose());
    else if (m && m.dispose) m.dispose();
  });
}

let raw;
try { raw = JSON.parse(readInput()); }
catch (e) { console.error(`Could not parse blueprint JSON: ${e.message}`); process.exit(1); }

// Accept either a bare def or { key: def }.
const def = raw && raw.parts || raw && raw.model || raw && raw.forms ? raw : Object.values(raw)[0];
const name = def.name || fileArg || 'creature';

const v = validateCreatureBlueprint(def, name);

// maxTierFor reads the live roster by key; an off-roster blueprint uses its own
// maxRarity (SSSR → 4 forms, else 3) — mirror ascension's rule directly.
const tiers = (def.maxRarity === 'SSSR') ? 3 : 2;
const forms = [];
let over = 0, buildErr = null;
if (v.ok) {
  for (let tier = 0; tier <= tiers; tier++) {
    try {
      const ad = ascendedDef(def, tier, 0);
      const { group } = buildDragonModel(ad, { detail: 'high' });
      const tris = countTris(group);
      dispose(group);
      if (tris > BUDGET) over++;
      forms.push({ tier, name: FORM_NAMES[tier] || `F${tier}`, tris, ok: tris <= BUDGET });
    } catch (e) { buildErr = `tier ${tier}: ${e.message}`; break; }
  }
}

const result = { name, ok: v.ok && !buildErr && over === 0, errors: v.errors, warnings: v.warnings, buildErr, forms };

if (asJson) { console.log(JSON.stringify(result, null, 2)); }
else {
  console.log(`\nblueprintBuild — ${name}\n`);
  v.errors.forEach((e) => console.log(`  ✗ ERROR  ${e}`));
  v.warnings.forEach((w) => console.log(`  ! warn   ${w}`));
  if (buildErr) console.log(`  ✗ BUILD  ${buildErr}`);
  for (const f of forms) console.log(`  ${f.ok ? '✓' : '✗'} ${String(f.name).padEnd(10)} ${String(f.tris).padStart(6)} tris${f.ok ? '' : `  OVER ${BUDGET}`}`);
  console.log(`\n${result.ok ? 'OK — builds clean + in budget' : 'FAILED — see above'}\n`);
}
process.exit(result.ok ? 0 : 1);
