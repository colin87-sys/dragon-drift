// N10c prop-foam gate (GRAPHICS-OVERHAUL.md). Pure instancing + gate logic, CI-safe
// (no WebGL): foam parks in lockstep with its prop, the swell term is generated from
// the shared SWELL constant (no drift copy), the tilt pierce-offset shifts the ring,
// and the toggle/tier/prop-visibility gate behaves. Default OFF → mesh hidden.
//   node tests/propfoam.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const { makeFoamMesh, writeFoamMatrix, foamVisible, updateFoam, foamUniforms, setWaterFoam, setWaterFoamQuality } = await import('../js/propFoam.js');
const { SWELL } = await import('../js/water.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const decomp = (mesh, i) => { const m = new THREE.Matrix4(); mesh.getMatrixAt(i, m); m.decompose(_p, _q, _s); };

// --- 1. mesh: hidden by default, layer 1, right instance count -----------------
const mesh = makeFoamMesh(8);
check('foam mesh hidden by default (identity-off)', mesh.visible === false);
check('foam mesh on layer 1 (skips god-ray mask + reflector)', mesh.layers.mask === (1 << 1));
check('foam mesh instance count matches', mesh.count === 8);

// --- 2. active foam sits at the waterline, sized to d.r * foam.r ---------------
const d = { x: 20, dist: 150, r: 3, rotY: 0.4, tilt: 0 };
writeFoamMatrix(mesh, 0, d, { r: 0.7 }, true);
decomp(mesh, 0);
check(`active foam at waterline y≈0 (${_p.y.toFixed(3)})`, Math.abs(_p.y) < 1e-6);
check(`active foam at prop xz (x ${_p.x.toFixed(1)}, z ${_p.z.toFixed(1)})`, Math.abs(_p.x - 20) < 1e-6 && Math.abs(_p.z + 150) < 1e-6);
check(`active foam radius = d.r * foam.r (${_s.x.toFixed(3)} == ${(3 * 0.7).toFixed(3)})`, Math.abs(_s.x - 3 * 0.7) < 1e-6 && Math.abs(_s.z - 3 * 0.7) < 1e-6);

// --- 3. parking lockstep: !active OR opt-out (foam:false) → buried + zero-scale --
writeFoamMatrix(mesh, 1, d, { r: 0.7 }, false); // prop parked (wrong biome)
decomp(mesh, 1);
check(`parked (inactive) foam buried at y≈-50 (${_p.y.toFixed(1)})`, _p.y < -49 && _s.x < 1e-3);
writeFoamMatrix(mesh, 2, d, false, true); // archetype opts out (archruin/slab)
decomp(mesh, 2);
check('opt-out (foam:false) foam parked even when active', _p.y < -49 && _s.x < 1e-3);

// --- 4. tilt shifts the waterline pierce point in xz --------------------------
const dt = { x: 20, dist: 150, r: 3, rotY: 0, tilt: 0.3 };
writeFoamMatrix(mesh, 3, dt, { r: 0.7 }, true);
decomp(mesh, 3);
check(`tilt offsets the ring from the prop origin (dx ${(_p.x - 20).toFixed(3)})`, Math.abs(_p.x - 20) > 0.05);

// --- 5. the swell term is GENERATED from the shared SWELL constant (no drift) --
const src = readFileSync(new URL('../js/propFoam.js', import.meta.url), 'utf8');
check('foam vertex swell uses ${SWELL.*} interpolation (shared constant)', /\$\{SWELL\.amp\}[\s\S]*\$\{SWELL\.dirx\}[\s\S]*\$\{SWELL\.freq\}/.test(src));
check('SWELL import present (parity source)', /import\s*\{\s*SWELL\s*\}\s*from\s*'\.\/water\.js'/.test(src));

// --- 6. the on/off/tier gate ---------------------------------------------------
setWaterFoam(false);
check('foam off → not visible even when props are', foamVisible(true) === false);
setWaterFoam(true); setWaterFoamQuality(0);
check('foam on + tier0 + props visible → visible', foamVisible(true) === true);
check('foam on but props hidden → not visible', foamVisible(false) === false);
setWaterFoamQuality(2);
check('tier2 → foam off (roadmap: tier0/1 only)', foamVisible(true) === false);
setWaterFoamQuality(0);

// --- 7. updateFoam drives the uniforms (swell ride + fog) ----------------------
updateFoam(3.5, 0.8, true, 60, 340);
check('updateFoam writes time/waveAmp/uFoamSwell/fog', foamUniforms.time.value === 3.5 && foamUniforms.waveAmp.value === 0.8 && foamUniforms.uFoamSwell.value === 1 && foamUniforms.fogFar.value === 340);
updateFoam(3.5, 0.8, false, 60, 340);
check('swell off → uFoamSwell 0 (flat collars, matches waterSurfaceHeight=0)', foamUniforms.uFoamSwell.value === 0);

setWaterFoam(false); // leave shipped
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
