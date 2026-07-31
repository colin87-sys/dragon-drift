// N18 creature shading gate (GRAPHICS-OVERHAUL.md). Pure plumbing + source
// assertions, CI-safe (no WebGL): the belly-AO / cavity terms splice correctly,
// the shared uniform is threaded BY REFERENCE (so one Settings switch drives
// every compiled material), the gated clone re-applies patches r160 would have
// dropped, and everything is exact identity while the gate is 0.
//   node tests/creatureao.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');

const {
  composeSurface, cloneComposed, fresnelRimPatch, bellyAOPatch,
  cellularScalesNormalPatch, buildSurfacePatches, SURFACE_PATCH_NAMES,
  creatureShadingUniform, setCreatureShading, creatureShadingEnabled,
} = await import('../js/dragonSurfaceShader.js');

let pass = 0, fail = 0;
const check = (label, ok) => {
  if (ok) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ FAIL: ${label}`); }
};

const fakeShader = () => ({
  uniforms: {},
  vertexShader: 'void main(){\n#include <common>\n#include <begin_vertex>\n}',
  fragmentShader: 'void main(){\n#include <common>\n#include <emissivemap_fragment>\n}',
});

// --- 1. the gate starts OFF -------------------------------------------------
setCreatureShading(false);
check('gate defaults to 0 (shipped look)', creatureShadingUniform.value === 0 && !creatureShadingEnabled());

// --- 2. bellyAO splices object-space normal, not view-space -----------------
const m1 = new THREE.MeshStandardMaterial();
composeSurface(m1, [bellyAOPatch()]);
const s1 = fakeShader();
m1.onBeforeCompile(s1);
check('bellyAO reads objectNormal in the vertex stage (skinning-stable)',
  s1.vertexShader.includes('vObjNrm = objectNormal;'));
check('bellyAO does NOT use vViewPosition (would swim with the camera)',
  !s1.fragmentShader.includes('vViewPosition'));
check('bellyAO multiplies diffuseColor (subtractive), not totalEmissiveRadiance',
  s1.fragmentShader.includes('diffuseColor.rgb *=') && !/_baAO[^;]*totalEmissiveRadiance/.test(s1.fragmentShader));
check('bellyAO cache key registered', m1.customProgramCacheKey() === 'surf:bao');

// --- 3. the shared uniform is threaded BY REFERENCE -------------------------
// This is the whole live-toggle contract: if composeSurface re-wrapped it in a
// fresh { value } the Settings switch would silently do nothing on the GPU.
check('uCreatureAO is the SAME object as the module uniform (by reference)',
  s1.uniforms.uCreatureAO === creatureShadingUniform);
const m2 = new THREE.MeshStandardMaterial();
composeSurface(m2, [bellyAOPatch()]);
const s2 = fakeShader();
m2.onBeforeCompile(s2);
check('two materials share ONE uniform object (one switch drives both)',
  s2.uniforms.uCreatureAO === s1.uniforms.uCreatureAO);
setCreatureShading(true);
check('flipping the switch is visible through both shaders', s1.uniforms.uCreatureAO.value === 1 && s2.uniforms.uCreatureAO.value === 1);
setCreatureShading(false);

// --- 4. per-patch uniforms are still COPIES (not shared) --------------------
// Two dragons must be able to carry different belly depths.
const mA = new THREE.MeshStandardMaterial(); composeSurface(mA, [bellyAOPatch({ amount: 0.2 })]);
const mB = new THREE.MeshStandardMaterial(); composeSurface(mB, [bellyAOPatch({ amount: 0.5 })]);
const sA = fakeShader(), sB = fakeShader();
mA.onBeforeCompile(sA); mB.onBeforeCompile(sB);
check('per-patch uniforms stay per-material (0.2 vs 0.5 belly depth)',
  sA.uniforms.uBellyAOAmt.value === 0.2 && sB.uniforms.uBellyAOAmt.value === 0.5
  && sA.uniforms.uBellyAOAmt !== sB.uniforms.uBellyAOAmt);

// --- 5. the scales CAVITY term ---------------------------------------------
const m3 = new THREE.MeshStandardMaterial();
composeSurface(m3, [cellularScalesNormalPatch()]);
const s3 = fakeShader();
m3.onBeforeCompile(s3);
check('cavity darkens diffuse from the same height field the relief uses',
  s3.fragmentShader.includes('uScaleCavity * (1.0 - _scH)'));
check('cavity is gated by the shared uniform', s3.uniforms.uCreatureAO === creatureShadingUniform);
check('scales relief (normal perturbation) still present',
  s3.fragmentShader.includes('_scPerturbNormal'));

// --- 6. THE CLONE FIX -------------------------------------------------------
// Prove the r160 trap is real, then prove cloneComposed closes it.
const src = new THREE.MeshStandardMaterial();
composeSurface(src, [fresnelRimPatch(0xff8800)]);
const naive = src.clone();
const sn = fakeShader();
naive.onBeforeCompile(sn);
check('r160 trap confirmed: plain .clone() DROPS the patches (rim lost)',
  !sn.fragmentShader.includes('uRimColor'));

const fixed = cloneComposed(src);
const sf = fakeShader();
fixed.onBeforeCompile(sf);
check('cloneComposed restores the rim onto the clone', sf.fragmentShader.includes('uRimColor'));
check('restored clone is GATED (own cache key, no collision with the source)',
  fixed.customProgramCacheKey() === 'surf:rim+gated' && src.customProgramCacheKey() === 'surf:rim');
check('gate uniform threaded by reference into the clone', sf.uniforms.uSurfGate === creatureShadingUniform);

// --- 7. IDENTITY: at gate 0 the restored clone is a no-op ------------------
// The four mutable values are snapshotted and mix()'d back. mix(a,b,0) is
// a*(1-0) + b*0 == a exactly, so the gated clone renders as the plain clone.
for (const v of ['totalEmissiveRadiance', 'roughnessFactor', 'normal', 'diffuseColor.rgb']) {
  check(`gate restores ${v} via mix(snapshot, patched, uSurfGate)`,
    sf.fragmentShader.includes(`mix(_sg`) && sf.fragmentShader.includes(v));
}
const snapCount = (sf.fragmentShader.match(/mix\(_sg/g) || []).length;
check(`all four mutable values are gated (found ${snapCount})`, snapCount === 4);

// --- 8. cloneComposed on an UNPATCHED material is a plain clone ------------
const plain = new THREE.MeshStandardMaterial({ color: 0x123456 });
const plainClone = cloneComposed(plain);
check('un-composed material clones plainly (no phantom program)',
  !Object.prototype.hasOwnProperty.call(plainClone, 'onBeforeCompile')
  && plainClone.color.getHex() === 0x123456);

// --- 9. blueprint registry --------------------------------------------------
check("'bellyAO' is a declarable blueprint name", SURFACE_PATCH_NAMES.includes('bellyAO'));
const built = buildSurfacePatches(['bellyAO'], { bellyAO: 0.4 });
check('blueprint name maps to the patch with per-dragon depth',
  built.length === 1 && built[0].key === 'bao' && built[0].uniforms.uBellyAOAmt === 0.4);
check('unknown names are still ignored', buildSurfacePatches(['nope'], {}).length === 0);

// --- 10. Azure (the hero) actually opts in ---------------------------------
const { DRAGONS } = await import('../js/dragons.js');
check('Azure Drake declares bellyAO',
  (DRAGONS.azure.parts.surface?.shader || []).includes('bellyAO'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
