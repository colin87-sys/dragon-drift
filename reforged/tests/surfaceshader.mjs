// Headless test of the composable SurfaceShader system (dragonSurfaceShader.js).
// Verifies patches compose into ONE onBeforeCompile + ONE merged program-cache
// key, splice at the documented include seams, and that the blueprint name→patch
// mapping + the single-rim backward-compat path behave. No renderer needed — we
// drive composeSurface with a fake shader object and assert the spliced source.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url); // bare 'three' → vendored lib
import { assert, assertEq } from './shim.mjs';

const {
  composeSurface, fresnelRimPatch, iridescencePatch, cellularScalesPatch,
  membraneSSSPatch, buildSurfacePatches, cellularScalesNormalPatch,
} = await import('../js/dragonSurfaceShader.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

const fakeShader = () => ({
  uniforms: {},
  vertexShader: 'void main(){\n#include <common>\n#include <begin_vertex>\n}',
  fragmentShader: 'void main(){\n#include <common>\n#include <emissivemap_fragment>\n}',
});

// --- stacked compose --------------------------------------------------------
const mat = { needsUpdate: false };
composeSurface(mat, [fresnelRimPatch(0xff8800), cellularScalesPatch(), iridescencePatch()]);
assertEq(typeof mat.onBeforeCompile, 'function', 'compose sets onBeforeCompile');
assertEq(mat.customProgramCacheKey(), 'surf:rim+scales+irid', 'merged cache key reflects patch stack');
assert(mat.needsUpdate === true, 'compose flags needsUpdate');
ok('three patches compose into one program + merged cache key');

const sh = fakeShader();
mat.onBeforeCompile(sh);
assert('uRimColor' in sh.uniforms && 'uScaleSize' in sh.uniforms && 'uIridStrength' in sh.uniforms,
  'uniforms from every patch are registered');
ok('all stacked patch uniforms registered on the shader');
assert(sh.vertexShader.includes('vSurfPos') && sh.vertexShader.includes('#include <begin_vertex>'),
  'cellular vertex varying spliced, begin_vertex preserved');
assert(sh.fragmentShader.includes('_scCell') && sh.fragmentShader.includes('totalEmissiveRadiance')
  && sh.fragmentShader.includes('#include <emissivemap_fragment>'),
  'fragment helpers + emissive contributions spliced, seam preserved');
ok('vertex + fragment patches splice after the include seams (append, not replace)');

// --- single-rim backward compat ---------------------------------------------
const mat2 = {};
composeSurface(mat2, [fresnelRimPatch(0x123456)]);
assertEq(mat2.customProgramCacheKey(), 'surf:rim', 'rim-only cache key');
const sh2 = fakeShader();
mat2.onBeforeCompile(sh2);
assert(sh2.fragmentShader.includes('uRimColor') && sh2.fragmentShader.includes('uRimPower'),
  'rim math present in fragment');
ok('rim-only compose reproduces the fresnel rim');

// --- blueprint name → patch mapping -----------------------------------------
const patches = buildSurfacePatches(['cellularScales', 'iridescence', 'subsurface'],
  { scales: 0x88ccff, apexSeam: 0x00ffff, wingEmissive: 0xff66cc });
assertEq(patches.length, 3, 'three named patches built');
assertEq(patches.map((p) => p.key).join(','), 'scales,irid,sss', 'names map to patch keys');
ok('buildSurfacePatches maps blueprint shader names to patches');

// membrane SSS exists and keys correctly
assertEq(membraneSSSPatch().key, 'sss', 'membraneSSS patch key');
ok('membrane subsurface patch available');

// --- v2 normal-detail scales (cellularScalesNormal) -------------------------
const matN = { needsUpdate: false };
composeSurface(matN, [cellularScalesNormalPatch({ amp: 0.3 })]);
assertEq(matN.customProgramCacheKey(), 'surf:scalesN', 'normal-scales cache key (distinct from v1 scales)');
const shN = fakeShader();
matN.onBeforeCompile(shN);
assert('uScaleNrmAmp' in shN.uniforms && 'uScaleSize' in shN.uniforms, 'normal-scales registers amplitude + size uniforms');
assert(shN.vertexShader.includes('vSurfPos'), 'normal-scales emits the object-space varying');
assert(shN.fragmentShader.includes('_scPerturbNormal') && shN.fragmentShader.includes('dFdx'),
  'normal-scales splices the derivative-bump helper');
assert(/\bnormal\s*=/.test(shN.fragmentShader), 'normal-scales PERTURBS the lighting normal (assigns normal)');
ok('cellularScalesNormal composes + perturbs the normal at the shared seam');

// blueprint name maps + amplitude is tier-gated (scales with the active detail mul)
const pN = buildSurfacePatches(['cellularScalesNormal'], { scales: 0x223044 });
assert(pN.length === 1 && pN[0].key === 'scalesN', "name 'cellularScalesNormal' → scalesN patch");
assert(pN[0].uniforms.uScaleNrmAmp > 0, 'tier-gated amplitude positive at HIGH');
ok('buildSurfacePatches maps cellularScalesNormal (tier-gated amplitude)');

// --- safety: empty compose is a no-op ---------------------------------------
const mat3 = { needsUpdate: false };
composeSurface(mat3, []);
assert(!mat3.onBeforeCompile, 'empty patch list does not touch the material');
ok('empty patch list is a safe no-op');

console.log(`\n${n} surfaceshader checks passed.`);
