// Read-only LANCE damage-economy checker — the "lockdps" balance table.
//
// For every boss (in BOSS_ORDER) it prints the wyrmfire-lance damage economy:
// per phase the ROI-clamped full-cap volley damage, that volley as a share of
// the phase's HP, and how many pure-lance volleys would clear the phase — plus a
// per-boss lance-only TTK estimate. It reuses the SHIPPED lanceDmgEach kernel
// (js/lockLayer.js) and the live boss HP/phase model (js/bossDefs.js), so the
// table always reflects current tuning. It writes nothing and runs no fight loop
// — purely diagnostic, safe to run anytime.
//
//   node tools/lockdps.mjs         report every boss's LANCE economy, exit 0
//   node tools/lockdps.mjs --ci    exit 1 if a balance INVARIANT is broken
//                                  (ROI clamp, beat-inside-clamp, cap ladder)
//
// NOTE: the TTK column is a LABELLED ESTIMATE from a paint→cap→loose cadence
// model (see lockdpsCore.volleyCadence), not a measured kill time; the volley
// damage / %-phase / volleys-to-clear columns are exact (config × HP model).

import { register } from 'node:module';

// 1) Resolve the bare 'three' import that js/lockLayer.js pulls in.
register('./three-resolver.mjs', import.meta.url);

// 2) Minimal DOM/localStorage shim (bossDefs/lockLayer don't render, but their
//    import graph brushes canvas/util helpers — the tricount.mjs stub shape).
const ctx2d = {
  createRadialGradient: () => ({ addColorStop() {} }),
  createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {},
  beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {},
  set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {},
  set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {},
};
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = {
  hidden: false,
  addEventListener() {}, removeEventListener() {},
  createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }),
};
if (!globalThis.localStorage) {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

// 3) Game modules AFTER the resolver + shim (dynamic so the graph isn't hoisted).
const { CONFIG } = await import('../js/config.js');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { lanceDmgEach } = await import('../js/lockLayer.js');
const { allEconomies, invariantBreaches } = await import('./lockdpsCore.mjs');

const args = process.argv.slice(2);
const ci = args.includes('--ci');

const economies = allEconomies(CONFIG, BOSSES, BOSS_ORDER, lanceDmgEach);
const L = CONFIG.LOCK;

// --- table -----------------------------------------------------------------
const padR = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const f1 = (x) => x.toFixed(1);

console.log(`LANCE damage economy — lanceDmg ${L.lanceDmg}, volleyRoiFrac ${L.volleyRoiFrac}, beatMult ${L.beatMult}, cap ${JSON.stringify(L.capByTier)}`);
console.log('');
console.log(padR('Boss', 12) + padL('T', 2) + padL('HP', 6) + padL('cap', 5) + '  ' +
  padR('Ph', 3) + padL('phHP', 7) + padL('volley', 8) + padL('%ph', 6) + padL('n/clr', 7) + '  clamp');
console.log('-'.repeat(72));
for (const e of economies) {
  if (!e.lanceCapable) {
    console.log(padR(e.name, 12) + padL(e.tier, 2) + padL(e.hpMax, 6) + padL(0, 5) + '   — lance disabled (tier-1 Sentinel)');
    continue;
  }
  e.phases.forEach((p, i) => {
    const head = i === 0
      ? padR(e.name, 12) + padL(e.tier, 2) + padL(e.hpMax, 6) + padL(e.capPips, 5)
      : padR('', 12) + padL('', 2) + padL('', 6) + padL('', 5);
    console.log(head + '  ' + padR(i + 1, 3) + padL(f1(p.phaseHp), 7) + padL(f1(p.volley), 8) +
      padL((p.pct * 100).toFixed(0) + '%', 6) + padL(isFinite(p.toClear) ? p.toClear : '∞', 7) +
      '  ' + (p.clamped ? 'ROI' : 'raw'));
  });
  console.log(padR('', 30) + `→ pure-lance: ${e.totalVolleys} volleys · ~${f1(e.lanceTtk)}s @ ${f1(e.cadence)}s/volley (est.)`);
}

// --- invariant gate --------------------------------------------------------
const breaches = invariantBreaches(economies, L);
console.log('-'.repeat(72));
if (breaches.length) {
  console.log(`INVARIANT BREACHES (${breaches.length}):`);
  for (const b of breaches) console.log('  ✗ ' + b);
  if (ci) process.exitCode = 1;
} else {
  const capable = economies.filter((e) => e.lanceCapable).length;
  console.log(`${economies.length} bosses (${capable} lance-capable) · ROI + beat-in-clamp + cap-ladder invariants OK`);
}
