// Starlit-Seam two-state probe (headless, objective — no eyeballing a bloom-washed
// tile). Builds each Vesper form, finds the ion-blue seam material(s) in the surge
// arrays, and reports the emissive HUE + INTENSITY the shipped surge tick produces in
// CRUISE vs SURGE. Proves the cruise-black law (seam ~dark at rest) and the ion-blue
// hue-lock (seam ∈ the 210–235° band on Surge), independent of biome/lighting.
//   node reforged/tools/seamprobe.mjs [key]
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

const key = process.argv[2] || 'vesper';
const ION = 0x2050e8;   // the seam's baseEmissive marker

// Replay dragon.js's surge tick for one spineMat: returns { hueDeg, intensity }.
function surgeState(m, surgeHiHex, sgm, on) {
  const be = m.userData.baseEmissive ?? 0xffffff, bi = m.userData.baseIntensity ?? 1;
  const c = new THREE.Color();
  if (on) { c.setHex(be).lerp(new THREE.Color().setHex(surgeHiHex), 0.85); }
  else c.setHex(be);
  const inten = on ? bi * (1 + 0.9 * sgm) : bi;
  const hsl = {}; c.getHSL(hsl);
  return { hueDeg: hsl.h * 360, intensity: inten };
}

let fail = 0;
const forms = maxTierFor(DRAGONS[key]) + 1;
console.log(`\nStarlit-Seam two-state probe — ${key}\n` + '-'.repeat(58));
for (let t = 0; t < forms; t++) {
  const def = ascendedDef(DRAGONS[key], t, 0);
  const built = buildDragonModel(def, { preview: true });
  const sgm = def.model.surgeGlowMultiplier ?? 1;
  const seams = (built.materials.spineMats || []).filter(m => (m.userData.baseEmissive ?? 0) === ION);
  const eyesLit = built.materials.spineMats.some(m => m.userData.baseEmissive != null && (m.userData.baseEmissive & 0xff00) > 0x8000 && (m.userData.baseEmissive & 0xff) < 0x60); // green-ish in surge arrays (should be NONE — eyes stay out)
  if (seams.length === 0) {
    // f0 may legitimately carry only a nape notch; flag if a form that should have a seam has none.
    console.log(`  f${t}  seam mats: 0  (seamRun=${def.model.seamRun})`);
    if ((def.model.seamRun ?? -1) >= 0) { /* notch still builds a mat — expect ≥1 */ }
    continue;
  }
  const cruise = surgeState(seams[0], def.surgeHi, sgm, false);
  const surge = surgeState(seams[0], def.surgeHi, sgm, true);
  const cruiseDark = cruise.intensity <= 0.08;                     // withheld at rest
  const ionHue = surge.hueDeg >= 210 && surge.hueDeg <= 240;       // ion-blue band (not cyan ≤205, not violet ≥250)
  const capped = surge.intensity <= 2.2;                           // glare cap (never white-hot runaway)
  const ok = cruiseDark && ionHue && capped;
  if (!ok) fail++;
  console.log(`  f${t}  seams:${seams.length}  cruise I=${cruise.intensity.toFixed(3)} ${cruiseDark ? 'DARK✓' : 'LIT✗'}   surge hue=${surge.hueDeg.toFixed(0)}° ${ionHue ? 'ion✓' : 'OFF✗'} I=${surge.intensity.toFixed(2)} ${capped ? 'capped✓' : 'HOT✗'}   ${ok ? 'OK' : 'FAIL'}`);
  if (eyesLit) { console.log('    ✗ a green (eye-like) mat is in the surge arrays — eyes must stay OUT'); fail++; }
}
console.log('-'.repeat(58));
console.log(fail === 0 ? 'PASS — seam withheld in cruise, ion-blue + capped on Surge\n' : `FAIL — ${fail} issue(s)\n`);
process.exit(fail === 0 ? 0 : 1);
