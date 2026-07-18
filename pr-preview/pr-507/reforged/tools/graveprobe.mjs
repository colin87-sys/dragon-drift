// Gravelight two-state probe (headless, objective — no eyeballing a bloom-washed tile).
// The Revenant sibling of seamprobe: builds each form, finds the GRAVE-LIGHT family in the
// flareMats array, and replays dragon.js's flare/reset loop to report the emissive HUE +
// INTENSITY each grave mat produces in CRUISE vs SURGE. Proves, independent of biome/lighting:
//   • FIREWALL   — no grave-hued mat leaks into spineMats (those carry the warm cruise rim; a
//                  green mat there would fight the Pearl rim-lock). Grave family lives in flareMats.
//   • HUE-LOCK   — every lit grave mat's baseEmissive sits in the grave-green band (118°±20°);
//                  the wisp is the one allowed exception (black emissive → spectral by transparency).
//   • WITHHELD→IGNITE — each grave mat is a DIM ember at cruise (≤1.3) and IGNITES on Surge
//                  (surge ≥ 1.6× cruise). This is the "lantern, not a lamp" law made testable.
//   node reforged/tools/graveprobe.mjs [key]
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.localStorage) { const s = new Map(); globalThis.localStorage = { getItem: (k) => (s.has(k) ? s.get(k) : null), setItem: (k, v) => s.set(k, String(v)), removeItem: (k) => s.delete(k), clear: () => s.clear() }; }
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');

const key = process.argv[2] || 'revenant';
const GRAVE_LO = 98, GRAVE_HI = 138;   // grave-green hue band (118° ± 20°)

const hueOf = (hex) => { const hsl = {}; new THREE.Color().setHex(hex).getHSL(hsl); return hsl.h * 360; };
const isBlack = (hex) => (hex & 0xffffff) === 0;

// Replay dragon.js's flare/reset loop (js/dragon.js: the spineFlareMats loop) for one mat.
// CRUISE = the reset (else) branch: emissiveIntensity = baseIntensity. SURGE = full ignition
// (surgeMix=1, ignite=1): intensity = baseIntensity * max(0.12, 1 + (0.9 + 1.6)*sgm*wi).
function flareState(m, sgm, on) {
  const bi = m.userData.baseIntensity ?? 1;
  const wi = m.userData.flareIntensityWeight ?? m.userData.flareWeight ?? 1;
  return on ? bi * Math.max(0.12, 1 + 2.5 * sgm * wi) : bi;
}

let fail = 0;
const forms = maxTierFor(DRAGONS[key]) + 1;
console.log(`\nGravelight two-state probe — ${key}\n` + '-'.repeat(72));
for (let t = 0; t < forms; t++) {
  const def = ascendedDef(DRAGONS[key], t, 0);
  const built = buildDragonModel(def, { preview: true });
  const sgm = def.model.surgeGlowMultiplier ?? 1;
  const flare = built.materials.flareMats || [];
  const spine = built.materials.spineMats || [];

  // FIREWALL — no grave-hued emissive mat may sit in spineMats.
  const leaks = spine.filter((m) => { const be = m.userData.baseEmissive; return be != null && !isBlack(be) && hueOf(be) >= GRAVE_LO && hueOf(be) <= GRAVE_HI; });
  if (leaks.length) { console.log(`  f${t}  ✗ FIREWALL: ${leaks.length} grave-hued mat(s) leaked into spineMats`); fail++; }

  // The grave family: every flareMat carrying a grave userData tag.
  const grave = flare.filter((m) => m.userData && m.userData.baseEmissive != null);
  if (!grave.length) { console.log(`  f${t}  flareMats grave: 0`); continue; }

  let litCount = 0;
  for (const m of grave) {
    const be = m.userData.baseEmissive;
    const cruise = flareState(m, sgm, false);
    const surge = flareState(m, sgm, true);
    if (isBlack(be)) {
      // Wisp exception: black emissive → must be spectral by transparency, never a lit hue.
      const okWisp = m.transparent === true;
      if (!okWisp) { console.log(`    ✗ black-emissive grave mat is not transparent (spectral-by-transparency law)`); fail++; }
      continue;
    }
    litCount++;
    const hue = hueOf(be);
    const hueOk = hue >= GRAVE_LO && hue <= GRAVE_HI;
    const cruiseDim = cruise <= 1.3;                 // withheld dim ember at rest (not a blazing lamp)
    const ignites = surge >= cruise * 1.6;           // Surge is a real ignition over cruise
    const ok = hueOk && cruiseDim && ignites;
    if (!ok) fail++;
    const tag = m.userData.gravePulseBucket != null ? `gap${m.userData.gravePulseBucket}` : 'lantern';
    console.log(`  f${t}  ${tag.padEnd(8)} hue=${hue.toFixed(0)}° ${hueOk ? 'grave✓' : 'OFF✗'}  cruise=${cruise.toFixed(2)} ${cruiseDim ? 'dim✓' : 'HOT✗'}  surge=${surge.toFixed(2)} ${ignites ? 'ignite✓' : 'FLAT✗'}  ${ok ? 'OK' : 'FAIL'}`);
  }
  if (!litCount) { console.log(`  f${t}  ✗ no LIT grave mat (all black) — the lantern has no light`); fail++; }
}
console.log('-'.repeat(72));
console.log(fail === 0 ? 'PASS — grave family firewalled, hue-locked 118°, withheld in cruise + ignites on Surge\n' : `FAIL — ${fail} issue(s)\n`);
process.exit(fail === 0 ? 0 : 1);
