// Byte-parity gate for the parametric shape-from-data layer (dragonBodyProfile.js +
// dragonWingForms.js). The whole coexist contract is: a generator called with its
// DEFAULT knobs must reproduce the shipped fixture (ARROW_PROFILE / WING_FORMS)
// exactly, so 'parametricArrow' is geometrically identical to 'arrow' and the roster
// never moves. This asserts that numerically AND by a built-geometry checksum.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { strict as assert } from 'node:assert';

// Minimal DOM/canvas shim so util.js texture helpers don't throw (no renderer).
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { makeArrowProfile } = await import('../js/dragonBodyProfile.js');
const { ARROW_PROFILE } = await import('../js/dragonTorso.js');
const { makeWingForm, WING_FORM_KNOBS } = await import('../js/dragonWingForms.js');
const { WING_FORMS } = await import('../js/dragonParts.js');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { validateCreatureBlueprint } = await import('../js/validateCreatureBlueprint.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// --- 1. body profile: default knobs == ARROW_PROFILE (numerics) --------------
{
  const p = makeArrowProfile();
  const strip = (o) => { const c = { ...o }; delete c.headBase; delete c.ring; return c; };
  assert.deepStrictEqual(strip(p), strip(ARROW_PROFILE), 'profile numerics deep-equal ARROW_PROFILE');
  // headBase is a function — sample it across the neckSegments the roster uses.
  for (const ns of [4, 5, 6, 7]) {
    assert.deepStrictEqual(p.headBase(ns), ARROW_PROFILE.headBase(ns), `headBase(${ns}) matches`);
  }
  ok('makeArrowProfile() reproduces ARROW_PROFILE (stations/keel/mounts/headBase)');
}

// --- 2. derived mounts at default == legacy constants ------------------------
{
  const p = makeArrowProfile();
  assert.deepStrictEqual(p.wingRoot, { x: 0.5, y: 0.55, z: -0.25 }, 'wingRoot derived == legacy');
  assert.deepStrictEqual(p.fairing.pos, [0.46, 0.54, -0.4], 'fairing.pos derived == legacy');
  assert.strictEqual(p.tailAnchorY, 0.28, 'tailAnchorY');
  assert.strictEqual(p.tailAnchorZ, 1.15, 'tailAnchorZ');
  assert.strictEqual(p.tailShiftRefZ, 1.70, 'tailShiftRefZ == last station z');
  ok('derived attach points reproduce the legacy constants exactly');
}

// --- 3. mounts TRACK the shape (wider shoulders push the wing root out/up) ----
{
  const wide = makeArrowProfile({ shoulderWidth: 1.4, keelHeightCurve: 1.3 });
  assert(wide.wingRoot.x > 0.5 + 1e-6, 'wider shoulders → wingRoot.x moves outward');
  assert(wide.wingRoot.y > 0.55 + 1e-6, 'taller keel → wingRoot.y rises');
  assert(Math.abs(wide.fairing.pos[0] - (wide.wingRoot.x - 0.04)) < 1e-9, 'fairing tracks wingRoot');
  // additive nudge layers on top of the derived base
  const nudged = makeArrowProfile({ attach: { wingRoot: { x: 0.1 } } });
  assert(Math.abs(nudged.wingRoot.x - 0.6) < 1e-9, 'attach.wingRoot.x nudge is additive (+0.1)');
  ok('mounts derive from the shape and accept additive nudges');
}

// --- 4. own stations (Mode B): object form normalises to the native tuple -----
{
  const stations = [
    { z: -3.0, halfWidth: 0.2, keelTop: 0.1, belly: 0.12 },
    { z: -1.0, halfWidth: 0.7, keelTop: 0.6, belly: 0.5 },
    { z: 1.5, halfWidth: 0.15, keelTop: 0.15, belly: 0.1 },
  ];
  const p = makeArrowProfile({ stations });
  assert.deepStrictEqual(p.stations[1], [-1.0, 0.7, 0.6, 0.5], 'object station normalises to [z,w,top,bot]');
  assert.strictEqual(p.stations.length, 3, 'own station count honoured');
  assert.strictEqual(p.tailShiftRefZ, 1.5, 'tailShiftRefZ tracks own last station');
  ok('Mode B own profileStations accepted (object + array forms)');
}

// --- 5. wing forms: default knobs == WING_FORMS[0..3] ------------------------
{
  for (let f = 0; f <= 3; f++) {
    assert.deepStrictEqual(makeWingForm(WING_FORM_KNOBS[f]), WING_FORMS[f], `makeWingForm(WING_FORM_KNOBS[${f}]) == WING_FORMS[${f}]`);
  }
  ok('makeWingForm reproduces all four WING_FORMS tip arrays exactly');
}

// --- 6. GEOMETRY byte-parity: 'arrow' vs 'parametricArrow' default ------------
// Build a real roster dragon both ways and checksum every mesh's positions. Solar
// is the canonical arrow-bodied hero; only the torso recipe differs.
function geomSig(group) {
  let count = 0, sum = 0;
  group.traverse((o) => {
    if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
      const pos = o.geometry.attributes.position;
      count += pos.count;
      for (let i = 0; i < pos.array.length; i++) sum += pos.array[i];
    }
  });
  return { count, sum: Math.round(sum * 1e4) / 1e4 };
}
{
  for (let tier = 0; tier <= maxTierFor('solar'); tier++) {
    const base = ascendedDef(DRAGONS.solar, tier, 0);
    const a = buildDragonModel({ ...base, parts: { ...(base.parts || {}), torso: 'arrow' } }, { detail: 'high' });
    const p = buildDragonModel({ ...base, parts: { ...(base.parts || {}), torso: 'parametricArrow' } }, { detail: 'high' });
    const sa = geomSig(a.group), sp = geomSig(p.group);
    assert.deepStrictEqual(sp, sa, `solar tier ${tier}: parametricArrow geometry == arrow (${JSON.stringify(sa)})`);
  }
  ok('parametricArrow builds byte-identical geometry to arrow (solar, all forms)');
}

// --- 7. grammar/validator accepts good knobs, flags bad ones -----------------
{
  const good = validateCreatureBlueprint({
    name: 'pq', parts: { torso: 'parametricArrow', wings: 'skinnedMembrane' },
    model: { bodyKnobs: { shoulderWidth: 1.3, waistPinch: 0.8, sectionPoints: 14 },
             tailKnobs: { forkSpread: 0.6, forkLength: 1.8 } },
    profileStations: [[-3, 0.2, 0.1, 0.12], [-1, 0.7, 0.6, 0.5], [1.5, 0.15, 0.15, 0.1]],
    wingFormKnobs: [{ span: 1.1, fingerCount: 4 }, { span: 1.2 }, { span: 1.3 }, { span: 1.4 }],
  }, 'pq');
  assert(good.ok, `valid parametric blueprint passes: ${JSON.stringify(good.errors)}`);

  const bad = validateCreatureBlueprint({
    name: 'bq', parts: { torso: 'parametricArrow' },
    profileStations: [[/* no z */]],          // malformed station
    wingFormKnobs: 'nope',                      // wrong type
  }, 'bq');
  assert(!bad.ok && bad.errors.length >= 2, `malformed parametric blueprint is flagged: ${JSON.stringify(bad)}`);

  const warn = validateCreatureBlueprint({
    name: 'wq', parts: { torso: 'parametricArrow' },
    model: { bodyKnobs: { shoulderWidth: 9 } },  // way out of range → warning, not error
  }, 'wq');
  assert(warn.ok && warn.warnings.length >= 1, 'out-of-range knob warns (not blocks)');
  ok('grammar + validator: accepts good knobs, errors on malformed, warns on out-of-range');
}

console.log(`\nparametric: ${n} checks passed.`);
