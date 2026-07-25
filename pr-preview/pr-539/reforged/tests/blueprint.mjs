// Headless gates for the BLUEPRINT LAYER (LEAPFROG L47 Phase 3).
//
// (1) Every shipped creature is a VALID blueprint against the creature grammar
//     (no structural errors — bad builder/shader/layer names, wrong types).
// (2) The validator catches authoring mistakes with actionable messages
//     (negative tests: bad wings builder, bad shader, bad layer, bad shingle,
//     non-number, out-of-range warning).
// (3) resolveSurfaceLayers infers the legacy decoration layers in the EXACT
//     order + under the SAME conditions the old inline blocks used (the
//     byte-identical guarantee for the imperative→declarative refactor), and the
//     explicit parts.surfaceLayers path round-trips.
//   node tests/blueprint.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

// Importing dragonModel.js self-registers every part module (torso/wings/head/
// tail) + the surface-layer registry, so the live builder lookups in the
// validator resolve. MUST precede any validation.
await import('../js/dragonModel.js');
const { DRAGONS } = await import('../js/dragons.js');
const { validateCreatureBlueprint, validateRoster } = await import('../js/validateCreatureBlueprint.js');
const { resolveSurfaceLayers } = await import('../js/dragonSurfaceLayers.js');
const { knobByPath } = await import('../js/creatureGrammar.js');
const { TAIL_STYLES } = await import('../js/dragonTail.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// --- 1. the whole shipped roster is a valid blueprint -----------------------
const roster = validateRoster(DRAGONS);
let warnCount = 0;
for (const [key, r] of Object.entries(roster.results)) {
  if (r.errors.length) console.error(`  ✗ ${key}:\n    ${r.errors.join('\n    ')}`);
  warnCount += r.warnings.length;
}
assert(roster.ok, 'every shipped dragon validates against the creature grammar (no errors)');
ok(`roster validates (${Object.keys(roster.results).length} creatures, ${warnCount} advisory warnings)`);

// --- 2. the validator catches real authoring mistakes (negative tests) ------
const base = DRAGONS.azure;                 // a simple, legacy-inferred dragon
const clone = (over) => ({ ...base, name: 'TEST', ...over });

const badWings = validateCreatureBlueprint(clone({ parts: { wings: 'nightFuryWngs' } }));
assert(!badWings.ok && badWings.errors.some((e) => e.includes('nightFuryWngs')), 'a misspelled wings builder is an error');
assert(badWings.errors.some((e) => e.includes('did you mean')), 'the builder error suggests a valid name');

const badShader = validateCreatureBlueprint(clone({ parts: { surface: { shader: ['iridesence'] } } }));
assert(!badShader.ok && badShader.errors.some((e) => e.includes('iridesence')), 'an unknown surface shader is an error');

const badLayer = validateCreatureBlueprint(clone({ parts: { surfaceLayers: ['backCrset'] } }));
assert(!badLayer.ok && badLayer.errors.some((e) => e.includes('backCrset')), 'an unknown surface layer is an error');

const badShingle = validateCreatureBlueprint(clone({ parts: { shingle: [{ count: [0, 0, 0, 0, 0] }] } }));
assert(!badShingle.ok && badShingle.errors.some((e) => e.includes('count')), 'a 5-entry shingle count (max 4 forms) is an error');

const badType = validateCreatureBlueprint({ ...base, name: 'TEST', model: { ...base.model, scale: 'big' } });
assert(!badType.ok && badType.errors.some((e) => e.includes('scale')), 'a non-number scale is an error');

const outOfRange = validateCreatureBlueprint({ ...base, name: 'TEST', model: { ...base.model, scale: 99 } });
assert(outOfRange.ok, 'an out-of-range number does NOT block (roster ground-truth)');
assert(outOfRange.warnings.some((w) => w.includes('maximum')), 'an out-of-range number warns');
ok('validator flags bad builders/shaders/layers/shingle/types as errors, ranges as warnings');

// --- 3. surfaceLayers inference is byte-identical to the legacy flag order ---
const stubAttach = {};                       // no segmentAnchors, no flank contract
const recipe = { torso: 'arrow' };
const types = (def) => resolveSurfaceLayers(def, recipe, stubAttach).map((l) => l.type);

// spineGlow alone → the spine line.
assertEq(JSON.stringify(types({ model: { spineGlow: 0.4 } })), JSON.stringify(['spineGlowLine']), 'spineGlow>0 → spineGlowLine');
// dorsalGlowCount SUPPRESSES the spine line and adds chevrons (legacy condition).
assertEq(JSON.stringify(types({ model: { spineGlow: 0.4, dorsalGlowCount: 8 } })), JSON.stringify(['dorsalChevrons']), 'dorsalGlowCount suppresses the spine line, adds chevrons');
// avian torso skips the keel spine line.
assertEq(types({ model: { spineGlow: 0.4 } }, ).length, 1, 'arrow torso keeps the spine line');
assertEq(resolveSurfaceLayers({ model: { spineGlow: 0.4 } }, { torso: 'avian' }, stubAttach).length, 0, 'avian torso has no keel spine line');
// the full flag set resolves in the fixed order.
const full = types({ model: { spineGlow: 0.4, backCrest: true, ridgeCount: 10, dorsal: true, backSpines: true, armorPlates: true, glowSeams: true, bladeFins: true } });
assertEq(JSON.stringify(full), JSON.stringify(['spineGlowLine', 'backCrest', 'scaleRidge', 'dorsalSail', 'backSpines', 'armorPlates', 'glowSeams', 'bladeFins']), 'full flag set resolves in the legacy order');
// ridgeCount 0/undefined adds no scale ridge (matches the old empty loop).
assertEq(types({ model: { ridgeCount: 0 } }).length, 0, 'ridgeCount 0 → no scale ridge');
assertEq(types({ model: {} }).length, 0, 'no flags → no layers');
// explicit declaration wins and round-trips (string OR { type }).
assertEq(JSON.stringify(types({ parts: { surfaceLayers: ['backCrest', { type: 'glowSeams' }] }, model: { ridgeCount: 99 } })), JSON.stringify(['backCrest', 'glowSeams']), 'explicit parts.surfaceLayers wins over inference');
ok('resolveSurfaceLayers reproduces the legacy decoration order/conditions + the explicit path');

// --- 4. grammar freebies (slot 0): tailStyle enum + forms:true dials ----------
// The new forms:true flags declare per-form range-checking for the dials the §5d sheets vary.
for (const p of ['model.tailStyle', 'model.headScale', 'model.eyeScale', 'model.wingScale',
  'model.wingChordScale', 'model.wingBillow', 'model.wingArmLeadChord']) {
  assert(knobByPath(p) && knobByPath(p).forms === true, `${p} is flagged forms:true in the grammar`);
}
assertEq(knobByPath('model.tailStyle').kind, 'enum', 'model.tailStyle is an enum knob');

// tailStyle enum accepts every buildable style (incl. the roster's 'nightfury', NOT in the doc's
// starter subset) and rejects a typo with a suggestion — on model AND per-form.
const goodTail = validateCreatureBlueprint(clone({ model: { ...base.model, tailStyle: 'finned' } }));
assert(goodTail.ok, "tailStyle 'finned' validates");
const goodTailNF = validateCreatureBlueprint(clone({ model: { ...base.model, tailStyle: 'nightfury' } }));
assert(goodTailNF.ok, "tailStyle 'nightfury' (roster value beyond the doc's 6) validates");
assert(TAIL_STYLES.length >= 12 && TAIL_STYLES.includes('nightfury'), 'TAIL_STYLES exposes the full buildable set');
const badTail = validateCreatureBlueprint(clone({ model: { ...base.model, tailStyle: 'finnd' } }));
assert(!badTail.ok && badTail.errors.some((e) => e.includes('finnd') && e.includes('did you mean')),
  'a misspelled tailStyle is an error with a suggestion');
const badTailForm = validateCreatureBlueprint(clone({ forms: [{ tailStyle: 'simple' }, { tailStyle: 'zzz' }] }));
assert(!badTailForm.ok && badTailForm.errors.some((e) => e.includes('forms[1].tailStyle')),
  'a bad per-form tailStyle is caught with the form index');

// forms:true adds per-form RANGE checking (advisory, like the model-level number check).
const bigHeadForm = validateCreatureBlueprint(clone({ forms: [{ headScale: 99 }] }));
assert(bigHeadForm.ok, 'an out-of-range per-form headScale does NOT block');
assert(bigHeadForm.warnings.some((w) => w.includes('forms[0].headScale') && w.includes('maximum')),
  'an out-of-range per-form headScale warns');
const badWingForm = validateCreatureBlueprint(clone({ forms: [{ wingScale: 'wide' }] }));
assert(!badWingForm.ok && badWingForm.errors.some((e) => e.includes('forms[0].wingScale')),
  'a non-number per-form wingScale is an error');
ok('tailStyle enum + forms:true dials validate on model and per-form (slot 0 grammar freebies)');

console.log(`\n${n} checks passed.`);
