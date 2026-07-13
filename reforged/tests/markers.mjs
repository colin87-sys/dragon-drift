// Skyforged marker system (GRAPHICS-OVERHAUL.md N17) — PR-1 Windvault.
// Part A (CI-safe, no WebGL): the shared markerSurface.js factory + bakeGlowT +
// source-string asserts that the obstacles.js flowgate branch is wired correctly
// (flag branches BOTH builder and motion, keystone bakes glowT, walls-free).
// Part B (WebGL, local): boots a forced flow run and proves the Windvault mesh
// actually built (a live geometry carrying the glowT attribute) and is walls-free.
//   node tests/markers.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const THREE = await import('three');
const { makeMarkerSurface, bakeGlowT } = await import('../js/markerSurface.js');

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, '..', p), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

// --- A1: the factory returns a reusable, one-program material ---
const flowRef = { value: 0 }, timeRef = { value: 0 };
const mat = makeMarkerSurface({ flowRef, timeRef });
check('customProgramCacheKey is the shared "markerSurface" (one program for all roles)',
  typeof mat.customProgramCacheKey === 'function' && mat.customProgramCacheKey() === 'markerSurface');
check('opaque emissive (blooms, no overdraw cliff) — not transparent',
  mat.transparent !== true && mat.isMeshStandardMaterial === true);
const mu = mat.userData.markerUniforms;
check('palette is UNIFORMS not string-baked (uRoot/uMid/uApex present)',
  !!(mu && mu.uRoot && mu.uMid && mu.uApex));
check('drivers are the SHARED value objects passed in (per-role flowRef, global timeRef)',
  mu.uFlow === flowRef && mu.uTime === timeRef);

// --- A2/A4: onBeforeCompile injects glowT + the emissive splice, uniforms bound ---
const fake = {
  uniforms: {},
  vertexShader: '#include <common>\nvoid main(){\n#include <begin_vertex>\n}',
  fragmentShader: '#include <common>\nvoid main(){\n  vec3 totalEmissiveRadiance = emissive;\n#include <emissivemap_fragment>\n}',
};
mat.onBeforeCompile(fake);
check('vertex declares the glowT attribute + varying',
  /attribute float glowT/.test(fake.vertexShader) && /varying float vGlowT/.test(fake.vertexShader) && /vGlowT = glowT/.test(fake.vertexShader));
check('fragment declares the ramp uniforms + varying',
  /uniform vec3 uRoot/.test(fake.fragmentShader) && /varying float vGlowT/.test(fake.fragmentShader));
check('fragment OWNS the emissive (3-stop ramp + fresnel + flow front → totalEmissiveRadiance)',
  /totalEmissiveRadiance = emis/.test(fake.fragmentShader) && /uFlow/.test(fake.fragmentShader));
check('onBeforeCompile binds the shared driver objects into shader.uniforms',
  fake.uniforms.uFlow === flowRef && fake.uniforms.uTime === timeRef);
// glowT is an ABSTRACT ramp — the GLSL must not assume world-up / position.y
check('glowT stays abstract (no world-Y / "up" assumption baked into the GLSL)',
  !/position\.y/.test(fake.fragmentShader) && !/worldPos/.test(fake.fragmentShader));

// --- bakeGlowT: attribute present, right count, values from fn, in range ---
const g = new THREE.BoxGeometry(1, 2, 1); // has a position attribute
bakeGlowT(g, (x, y) => (y + 1) / 2);       // map y∈[-1,1] → [0,1]
const gt = g.getAttribute('glowT');
check('bakeGlowT adds a glowT attribute of matching count, itemSize 1',
  !!gt && gt.itemSize === 1 && gt.count === g.getAttribute('position').count);
let inRange = true, sawLo = false, sawHi = false;
for (let i = 0; i < gt.count; i++) { const v = gt.getX(i); if (v < 0 || v > 1) inRange = false; if (v < 0.01) sawLo = true; if (v > 0.99) sawHi = true; }
check('baked glowT values in [0,1] and span the full ramp (root→apex present)', inRange && sawLo && sawHi);

// --- Source asserts on the obstacles.js wiring (A1/A5 + walls-free invariant) ---
const obs = read('js/obstacles.js');
check('A/B kill-switch present (?skyforged=0 → old Sky Gate)', /skyforged/.test(obs) && /const SKYFORGED =/.test(obs));
check('the FLAG branches BOTH the builder (buildWindvault) and keeps the Sky Gate fallback',
  /if \(SKYFORGED\)[\s\S]*buildWindvault[\s\S]*else[\s\S]*flowEdgeMat/.test(obs));
check('updateObstacles motion path is flag-branched (markerFlow/markerTime vs the old pulse)',
  /if \(SKYFORGED\)[\s\S]*markerTime\.value = time[\s\S]*markerFlow\.value[\s\S]*else if \(flowEdgeMat\)/.test(obs));
check('keystone bakes glowT=1 so mergeGeometries sees a matching attribute set (never null)',
  /bakeGlowT\(key, \(\) => 1\.0\)/.test(obs) && /mergeGeometries\(geoms, false\)/.test(obs));
check('flat facets: non-indexed tube + computeVertexNormals (per-face normals for glints)',
  /computeVertexNormals\(\)/.test(obs));
check('marker material NOT bindAtmosphere\'d (deliberate — signature emissive, not fog-tinted)',
  !/bindAtmosphere\(markerMat\)/.test(obs));
check('flowgate branch adds NO collider boxes (walls-free: e.boxes untouched)',
  !/o\.kind === 'flowgate'[\s\S]*e\.boxes\.push/.test(obs));

// ============================ Part B: WebGL boot ============================
// Skip gracefully if playwright/browser isn't available (Part A already gates CI).
let boot;
try { ({ boot } = await import('./browser.mjs')); } catch { boot = null; }
if (boot) {
  const flow = await boot({
    query: '?debug&canyon=flow',
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
  });
  await flow.page.click('#btn-start');
  await flow.page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
  await flow.page.evaluate(() => { window.__dd.player.dist = 300; });
  await flow.page.waitForFunction(() => window.__dd.game.canyonRun === 'flow', { timeout: 15000 });
  await flow.page.waitForTimeout(800); // let a few gates build
  // Traverse the live scene for a Windvault mesh: a geometry carrying the baked
  // glowT ramp attribute (the Sky-Gate fallback has no such attribute).
  const win = await flow.page.evaluate(() => {
    let found = false, lo = 1, hi = 0, count = 0;
    window.__dd.scene.traverse((o) => {
      const a = o.geometry && o.geometry.attributes && o.geometry.attributes.glowT;
      if (!a) return;
      found = true; count++;
      for (let i = 0; i < a.count; i++) { const v = a.getX(i); if (v < lo) lo = v; if (v > hi) hi = v; }
    });
    return { found, lo, hi, count };
  });
  check('Windvault built in WebGL (a live mesh carries the baked glowT ramp)', win.found);
  check('the arch ramp spans feet→crown (glowT reaches both ~0 and ~1)', win.lo <= 0.05 && win.hi >= 0.95);
  check('flow run stays walls-free with the Windvault (zero collider boxes)',
    await flow.page.evaluate(() => window.__dd.flowColliderBoxes() === 0));
  check('zero console errors building/flying the Windvault', flow.errors.length === 0) ||
    console.error(flow.errors.join('\n'));
  await flow.done();
} else {
  console.log('  (Part B skipped — playwright unavailable; Part A covered the CI-safe checks)');
}

console.log(`\nmarkers: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
