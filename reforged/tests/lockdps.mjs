// Band-gate for the LANCE damage economy (the lockdps model). Pure-node: it
// registers the three-resolver + a minimal DOM shim (js/lockLayer.js pulls in
// 'three'), imports the SHIPPED lanceDmgEach kernel + the live boss table, and
// asserts the balance LAWS hold and the per-boss economy sits in a sane band —
// so a lanceDmg / volleyRoiFrac / capByTier / phase change that shifts LANCE
// balance flags loudly here (and via `node tools/lockdps.mjs --ci`).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// Minimal DOM shim (lockLayer's import graph brushes canvas/util helpers).
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ getContext: () => ctx2d }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { CONFIG } = await import('../js/config.js');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { lanceDmgEach } = await import('../js/lockLayer.js');
const { allEconomies, invariantBreaches } = await import('../tools/lockdpsCore.mjs');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

const L = CONFIG.LOCK;
const economies = allEconomies(CONFIG, BOSSES, BOSS_ORDER, lanceDmgEach);

// --- The balance INVARIANTS (the same set --ci enforces) --------------------
const breaches = invariantBreaches(economies, L);
assertEq(breaches.length, 0, `no LANCE balance-invariant breaches (${breaches.join('; ')})`);
ok('ROI clamp + beat-inside-clamp + cap-ladder invariants hold for every boss');

// The ROI LAW, asserted directly per phase: a full-cap volley can never exceed
// volleyRoiFrac of the current phase HP — the lance is a CHIP channel by law.
for (const e of economies) {
  if (!e.lanceCapable) continue;
  for (const p of e.phases) {
    assert(p.volley <= p.roiCeil + 1e-9, `${e.id}: volley within ROI ceil`);
    // A perfect (beat) release rides ×beatMult INSIDE the clamp, so it too is
    // bounded by the phase-HP ceiling (never a phase-HP-law breach).
    assert(p.volleyBeat <= p.roiCeil + 1e-9, `${e.id}: beat volley within ROI ceil`);
    // No single volley clears more than ~11% of a phase — the chip-not-nuke read.
    assert(p.pct <= L.volleyRoiFrac + 0.01, `${e.id}: single volley ≤ ~ROI% of the phase`);
  }
}
ok('every full-cap volley (base and beat) stays ≤ volleyRoiFrac × phaseHp');

// --- Cap ladder wiring ------------------------------------------------------
for (const e of economies) {
  assertEq(e.capPips, (L.capByTier || {})[e.tier] ?? 0, `${e.id}: capPips matches capByTier[tier]`);
}
const disabled = economies.filter((e) => !e.lanceCapable);
assert(disabled.every((e) => e.tier === 1 && e.capPips === 0), 'lance-disabled bosses are exactly the tier-1 Sentinels');
ok(`cap ladder wired; ${disabled.length} tier-1 bosses are lance-disabled (cap 0)`);

// --- Per-boss economy sits in a sane band -----------------------------------
// Pure-lance volleys-to-clear: not trivializing (a boss can't fall to a handful
// of volleys) and not absurd (the ROI clamp keeps it bounded). Guards a tuning
// change that would make the lance a primary nuke or make it pointless.
for (const e of economies) {
  if (!e.lanceCapable) continue;
  assert(e.totalVolleys >= 20 && e.totalVolleys <= 90,
    `${e.id}: pure-lance clear takes ${e.totalVolleys} volleys (sane band 20–90)`);
  assert(e.lanceTtk > 30 && e.lanceTtk < 600,
    `${e.id}: pure-lance TTK estimate ${e.lanceTtk.toFixed(0)}s in band (30–600)`);
}
ok('per-boss pure-lance clear volleys + TTK estimate sit in the sane band');

// --- Roster coverage --------------------------------------------------------
assertEq(economies.length, BOSS_ORDER.length, 'one economy row per boss in BOSS_ORDER');
assert(economies.filter((e) => e.lanceCapable).length >= 6, 'at least 6 lance-capable bosses (tiers ≥2)');
ok(`${economies.length} bosses modelled, ${economies.filter((e) => e.lanceCapable).length} lance-capable`);

console.log(`\n${n} lockdps checks passed.`);
