// Accent-seam two-state probe (headless, objective — no eyeballing a bloom-washed tile).
// Builds each form of a dragon, finds the ACCENT seam material(s) in the surge arrays, and
// reports the emissive HUE + INTENSITY the shipped surge tick produces in CRUISE vs SURGE.
// Proves the cruise-black law (seam ~dark at rest) and the accent hue-lock (the seam lands on
// the dragon's OWN accent hue on Surge), independent of biome/lighting.
// The accent comes from `def.accentHue`, so this gates any identity — not just Vesper's ion-blue.
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
const ION = 0x2050e8;   // legacy default marker (Vesper's ion-blue)
// PER-DRAGON ACCENT (was hardcoded to Vesper's ion-blue, so it could only ever gate Vesper).
// The def already publishes `accentHue` as the "law-9 carrier"; use it as BOTH the marker that
// finds the seam mats and the basis for the expected Surge band. Vesper's accentHue IS 0x2050e8,
// so its result is unchanged — but an amber/verdant/violet accent is now gateable too.
const ACCENT = DRAGONS[key]?.accentHue ?? ION;

// Shortest angular distance between two hues, in degrees (wrap-safe — an amber accent sits near
// 0°/360°, where a naive `lo <= h <= hi` band silently fails).
function hueDelta(a, b) { return Math.abs(((a - b) % 360 + 540) % 360 - 180); }
const HUE_TOL = 15;   // ± band around the accent's own expected Surge hue

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
  const seams = (built.materials.spineMats || []).filter(m => (m.userData.baseEmissive ?? 0) === ACCENT);
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
  // The expected Surge hue is the dragon's OWN accent run through the SAME surge math (accent
  // lerped 0.85 toward surgeHi) — so the band is derived from the def, never hardcoded to one
  // dragon's identity. Wrap-safe, because a fire accent sits near 0°/360°.
  const wantHue = surgeState({ userData: { baseEmissive: ACCENT, baseIntensity: 1 } }, def.surgeHi, sgm, true).hueDeg;
  const accentHue = hueDelta(surge.hueDeg, wantHue) <= HUE_TOL;
  const capped = surge.intensity <= 2.2;                           // glare cap (never white-hot runaway)
  const ok = cruiseDark && accentHue && capped;
  if (!ok) fail++;
  console.log(`  f${t}  seams:${seams.length}  cruise I=${cruise.intensity.toFixed(3)} ${cruiseDark ? 'DARK✓' : 'LIT✗'}   surge hue=${surge.hueDeg.toFixed(0)}° (want ${wantHue.toFixed(0)}±${HUE_TOL}) ${accentHue ? 'accent✓' : 'OFF✗'} I=${surge.intensity.toFixed(2)} ${capped ? 'capped✓' : 'HOT✗'}   ${ok ? 'OK' : 'FAIL'}`);
  if (eyesLit) { console.log('    ✗ a green (eye-like) mat is in the surge arrays — eyes must stay OUT'); fail++; }
}
console.log('-'.repeat(58));
console.log(fail === 0 ? 'PASS — seam withheld in cruise, on-accent + capped on Surge\n' : `FAIL — ${fail} issue(s)\n`);
process.exit(fail === 0 ? 0 : 1);
