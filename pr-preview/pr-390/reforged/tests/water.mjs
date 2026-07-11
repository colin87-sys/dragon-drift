// N10a water-swell gate (GRAPHICS-OVERHAUL.md). Pure logic + geometry, CI-safe
// (no WebGL): the vertex GLSL and the JS port share ONE swell constant, the surface
// height matches it, the displacement stays under the gameplay budget, and toggling
// off restores the exact shipped flat quad. `waterSurfaceHeight` is what the contact
// shadow rides, so it must equal the drawn height.
//   node tests/water.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const { createWater, setWaterReflective, setWaterSwell, setWaterSwellQuality, updateWater, waterSurfaceHeight, setWaterDepth, setWaterTint, SWELL } = await import('../js/water.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

const added = [];
const scene = { add: (o) => added.push(o), remove: (o) => { const i = added.indexOf(o); if (i >= 0) added.splice(i, 1); } };
const water = () => added[added.length - 1];
const vtxCount = () => water().geometry.getAttribute('position').count;

// --- 1. default OFF = the shipped flat quad (1×1 plane, 4 verts, uSwellAmp 0) ---
createWater(scene, false);
check('default swell OFF → flat 1×1 quad (4 verts)', vtxCount() === 4);
check('default swell OFF → uSwellAmp 0 (shipped identity)', water().material.uniforms.uSwellAmp.value === 0);
check('waterSurfaceHeight 0 when off (contact shadow stays at shipped y)', waterSurfaceHeight(12, -34) === 0);

// --- 2. swell ON → subdivided grid + displacement live ------------------------
setWaterSwell(true);
setWaterSwellQuality(0);
check('swell ON tier0 → subdivided grid (97*161 verts)', vtxCount() === 97 * 161);
check('swell ON → uSwellAmp 1', water().material.uniforms.uSwellAmp.value === 1);
setWaterSwellQuality(1);
check('swell ON tier1 → coarser grid (49*81 verts)', vtxCount() === 49 * 81);
setWaterSwellQuality(2);
check('swell ON tier2 → flat quad (swell off on weak mobile)', vtxCount() === 4);
setWaterSwellQuality(0);

// --- 3. JS port ↔ GLSL parity via the shared SWELL constant -------------------
// The JS port equals the SWELL formula, and the vertex GLSL is GENERATED from the
// same constant (not a hardcoded copy that could drift).
updateWater(0, 0, 3.5, null); // sets time uniform = 3.5
const u = water().material.uniforms;
const expect = (x, z) => u.waveAmp.value * SWELL.amp * Math.sin((x * SWELL.dirx + z * SWELL.dirz) * SWELL.freq + 3.5 * SWELL.speed);
let perr = 0;
for (const [x, z] of [[0, 0], [50, -120], [-200, 400], [17.3, -8.1]]) perr = Math.max(perr, Math.abs(waterSurfaceHeight(x, z) - expect(x, z)));
check(`JS port matches the SWELL formula (err ${perr.toExponential(2)})`, perr < 1e-9);
const src = readFileSync(new URL('../js/water.js', import.meta.url), 'utf8');
check('vertex GLSL _swellH is generated from the SWELL constant (no drift copy)', /_swellH[\s\S]*\$\{SWELL\.amp\}[\s\S]*\$\{SWELL\.dirx\}[\s\S]*\$\{SWELL\.freq\}/.test(src));

// --- 4. displacement budget: max crest < 1.0 at waveAmp=1 (clears laneMinY 2.5) --
u.waveAmp.value = 1.0;
let maxH = 0;
for (let x = -260; x <= 260; x += 13) for (let z = -850; z <= 850; z += 41) maxH = Math.max(maxH, Math.abs(waterSurfaceHeight(x, z)));
check(`max swell displacement < 1.0m at waveAmp=1 (${maxH.toFixed(3)}m)`, maxH < 1.0);
check('swell scales with biome waveAmp (glassy biomes stay calm)', (u.waveAmp.value = 0.3, Math.abs(waterSurfaceHeight(50, -120)) <= 0.3 * SWELL.amp + 1e-9));

// --- 5. toggling OFF restores the flat quad exactly ---------------------------
u.waveAmp.value = 1.0;
setWaterSwell(false);
check('toggle OFF → back to flat 1×1 quad', vtxCount() === 4);
check('toggle OFF → uSwellAmp 0 + height 0 (shipped)', water().material.uniforms.uSwellAmp.value === 0 && waterSurfaceHeight(50, -120) === 0);

// --- 6. reflective variant builds with the swell (Reflector constructs headless) --
setWaterSwell(true); setWaterSwellQuality(0);
try {
  setWaterReflective(true);
  check('reflective water builds subdivided (Reflector + swell)', vtxCount() === 97 * 161);
} catch (e) {
  console.log(`  (reflective build skipped headless: ${String(e).split('\n')[0]})`);
}
setWaterSwell(false);

// --- 7. N10b water depth (Beer–Lambert) --------------------------------------
const um = () => water().material.uniforms;
check('depth default OFF → uAbsorbOn 0 (shipped height mix)', um().uAbsorbOn.value === 0);
setWaterDepth(true);
check('setWaterDepth(true) → uAbsorbOn 1 (live flip, no rebuild)', um().uAbsorbOn.value === 1);
setWaterReflective(false); // rebuild to cheap
check('uAbsorbOn survives a rebuild (in sharedUniforms)', water().material.uniforms.uAbsorbOn.value === 1);
setWaterReflective(true);
check('uAbsorbOn survives the reflective rebuild too', water().material.uniforms.uAbsorbOn.value === 1);
setWaterDepth(false);
check('setWaterDepth(false) → uAbsorbOn 0', um().uAbsorbOn.value === 0);

// The t-domain identity gate is in the source (mix(tH, trans, uAbsorbOn)).
check('base uses the t-domain gate mix(tH, trans, uAbsorbOn)', /mix\(deepColor,\s*shallowColor,\s*mix\(tH,\s*trans,\s*uAbsorbOn\)\)/.test(src));
check('trans is exp(-uAbsorbK / max(V.y, 0.05)) (slant Beer–Lambert)', /exp\(-uAbsorbK\s*\/\s*max\(V\.y,\s*0\.05\)\)/.test(src));

// trans is monotonic: look-down (V.y=1) is BRIGHTER (higher transmittance) than
// glancing (V.y=0.05). Port the GLSL.
const K = um().uAbsorbK.value;
const transAt = (vy) => Math.exp(-K / Math.max(vy, 0.05));
check(`look-down brighter than glancing (${transAt(1).toFixed(3)} > ${transAt(0.05).toFixed(3)})`, transAt(1) > transAt(0.05) + 0.05);

// Per-biome derivation: murkier (darker-deep) biome absorbs faster. Emberfall
// (near-black deep vs bright shallow) > Frozen Reach (glassy).
const C = (hex) => new THREE.Color(hex);
setWaterTint({ deep: C(0x2a0a08), shallow: C(0xc84818) }); const kEmber = um().uAbsorbK.value; // Emberfall
setWaterTint({ deep: C(0x122a4a), shallow: C(0x3a6a9a) }); const kFrozen = um().uAbsorbK.value; // Frozen Reach
check(`Emberfall absorbs faster than Frozen Reach (K ${kEmber.toFixed(2)} > ${kFrozen.toFixed(2)})`, kEmber > kFrozen);
check('derived K stays in [0.35, 0.85]', kEmber >= 0.35 - 1e-9 && kEmber <= 0.85 + 1e-9 && kFrozen >= 0.35 - 1e-9 && kFrozen <= 0.85 + 1e-9);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
