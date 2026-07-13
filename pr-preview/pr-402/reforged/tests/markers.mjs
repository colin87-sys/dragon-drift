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
const { makeMarkerSurface, bakeGlowT, facetHash, bakeFacetJitterPerTri, bakeConst } = await import('../js/markerSurface.js');

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
// D1: per-facet jitter attribute wired + used in the lift; D2: hot-lift is a uniform.
check('D1 facetJ attribute + varying injected and used (centered, safe default)',
  /attribute float facetJ/.test(fake.vertexShader) && /varying float vFacetJ/.test(fake.fragmentShader) && /vFacetJ/.test(fake.fragmentShader));
check('D2 hot-lift is a tunable uniform (uHotLift), not a hardcoded white-out',
  /uniform float uHotLift/.test(fake.fragmentShader) && !!mu.uHotLift);
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

// --- D1 facet jitter: deterministic index hash (never a gameplay rng stream) ---
check('facetHash is deterministic + in [0,1]',
  facetHash(7) === facetHash(7) && facetHash(7) >= 0 && facetHash(7) < 1 && facetHash(7) !== facetHash(8));
// A3: per-tri bake gives every triangle's 3 verts ONE facet value (both tris of a quad
// share it via the per-quad id in buildWindvault; here we prove the per-tri primitive).
const tg = new THREE.BufferGeometry();
tg.setAttribute('position', new THREE.Float32BufferAttribute(new Array(18).fill(0).map((_, i) => i), 3)); // 2 tris
bakeFacetJitterPerTri(tg);
const fj = tg.getAttribute('facetJ');
check('bakeFacetJitterPerTri: each triangle\'s 3 verts share one facetJ, values in [0,1]',
  fj.count === 6 && fj.getX(0) === fj.getX(1) && fj.getX(1) === fj.getX(2)
  && fj.getX(3) === fj.getX(4) && fj.getX(4) === fj.getX(5) && fj.getX(0) !== fj.getX(3)
  && fj.getX(0) >= 0 && fj.getX(0) < 1);
const kc = bakeConst(new THREE.BoxGeometry(1, 1, 1), 'facetJ', 0.5).getAttribute('facetJ');
check('bakeConst fills the attribute (keystone merge-parity: matching set → no null merge)',
  !!kc && kc.count > 0 && kc.getX(0) === 0.5);

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
check('D1: Windvault bakes facetJ per-QUAD (both tris share it) + keystone bakes a constant facetJ',
  /facetHash\(i \* K \+ k\)/.test(obs) && /bakeConst\(key, 'facetJ'/.test(obs));

// --- Star Shard orb (powerups.js): premium shard, no additive sprite, coexist ---
const pw = read('js/powerups.js');
check('orb A/B kill-switch present (?skyforged=0 → old sphere+sprite)', /const SKYFORGED =/.test(pw));
check('the makeGlowTexture import is KEPT (the fallback orb still needs it)', /import \{ makeGlowTexture \}/.test(pw));
check('Skyforged orb is the Star Shard on markerSurface, with NO additive Sprite',
  /buildStarShard/.test(pw) && /makeMarkerSurface\(/.test(pw)
  && /if \(SKYFORGED\)[\s\S]*new THREE\.Mesh\(shardGeo, shardMat\)[\s\S]*else[\s\S]*new THREE\.Sprite/.test(pw));
check('shard geometry bakes glowT (aft→tip) + facetJ, flat-faceted',
  /bakeGlowT\(g,/.test(pw) && /bakeFacetJitterPerTri\(g\)/.test(pw) && /computeVertexNormals\(\)/.test(pw));
check('orb has its OWN per-role flowRef driver (not the gate\'s markerFlow), written each frame',
  /orbFlow\.value =/.test(pw) && /flowRef: orbFlow/.test(pw));
check('collect flash is a capped scale-POP for the opaque shard (o.glow only in fallback)',
  /o\.mesh\.scale\.setScalar\(0\.2 \+ k \* 1\.4\)/.test(pw) && /if \(o\.glow\)/.test(pw));
check('idle: shard spins (head-on motion), sprite pulse only in fallback',
  /o\.mesh\.rotation\.z \+= dt/.test(pw));

// --- Glint (owner-approved 8.5→9 lever): shared factory, uniform-gated, default OFF ---
check('glint term present (tight specular per FLAT facet against a fixed view-space key)',
  /pow\(clamp\(dot\(normalize\(normal\), uGlintDir\)/.test(fake.fragmentShader) && /\* uGlint/.test(fake.fragmentShader));
check('glint defaults OFF in the factory (uGlint 0 → term exactly 0 → identity until opt-in)',
  makeMarkerSurface({}).userData.markerUniforms.uGlint.value === 0);
check('lip-glow defaults OFF (uLipGlow 0 → the always-hot rim term is 0 → gate/orb identity)',
  makeMarkerSurface({}).userData.markerUniforms.uLipGlow.value === 0 && /uLipGlow/.test(fake.fragmentShader));
// A1: per-instance factory calls yield DISTINCT live uniform objects (never material.clone()).
const rA = makeMarkerSurface({ midColor: 0x3dff8f, glint: 1.0 }), rB = makeMarkerSurface({ midColor: 0x3dff8f, glint: 1.0 });
check('two factory instances → DISTINCT live uApex Color objects (the r160 clone trap avoided)',
  rA.userData.markerUniforms.uApex !== rB.userData.markerUniforms.uApex
  && rA.userData.markerUniforms.uApex.value.isColor && rB.userData.markerUniforms.uApex.value.isColor);

// --- Jade Annulus (rings.js): gem annulus, per-instance material, wart fixed, coexist ---
const rj = read('js/rings.js');
check('ring A/B kill-switch present (?skyforged=0 → old torus)', /const SKYFORGED =/.test(rj));
check('Jade Annulus is a hand-rolled sweep with glowT (outer→inner) + per-quad facetJ, flat-faceted',
  /buildJadeAnnulus/.test(rj) && /facetHash\(p \* N \+ s\)/.test(rj) && /computeVertexNormals\(\)/.test(rj));
check('per-INSTANCE material via a fresh factory call (A1: never material.clone())',
  /makeMarkerSurface\(\{[\s\S]*flowRef: ringFlow/.test(rj) && !/\.clone\(\)/.test(rj));
check('the transparent:true-from-spawn WART is fixed (transparent lives ONLY in the fallback torus)',
  (rj.match(/transparent: true/g) || []).length === 1 && /new THREE\.MeshStandardMaterial\([\s\S]*transparent: true/.test(rj));
check('keeps the GREEN catch identity (jade palette, not cyan)', /JADE_MID = 0x3dff8f/.test(rj));
check('collect flash is a capped scale-POP for the opaque gem (A2; fallback keeps opacity-fade)',
  /\(1 - k\) \* 0\.35/.test(rj) && /r\.mesh\.material\.opacity = k/.test(rj));
check('z-ROLL is the motion + a capped precession garnish (A3: ≤0.08 rad, aperture-safe)',
  /rotation\.z \+= dt \* 0\.9/.test(rj) && /rotation\.x = Math\.sin[\s\S]*\* 0\.08/.test(rj));
check('fever/combo routed through the shared ringFlow hot path (A6: no per-ring emissiveIntensity double-drive)',
  /ringFlow\.value = game\.feverActive/.test(rj));

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
    let found = false, lo = 1, hi = 0, count = 0, hasFacetJ = false;
    window.__dd.scene.traverse((o) => {
      const at = o.geometry && o.geometry.attributes, a = at && at.glowT;
      if (!a || a.count < 100) return; // the ARCH is a large mesh; small glowT meshes are Star Shards
      found = true; count++; if (at.facetJ) hasFacetJ = true;
      for (let i = 0; i < a.count; i++) { const v = a.getX(i); if (v < lo) lo = v; if (v > hi) hi = v; }
    });
    return { found, lo, hi, count, hasFacetJ };
  });
  check('Windvault built in WebGL (a live mesh carries the baked glowT ramp)', win.found);
  check('the arch ramp spans feet→crown (glowT reaches both ~0 and ~1)', win.lo <= 0.05 && win.hi >= 0.95);
  check('Windvault carries the D1 facetJ attribute in WebGL', win.hasFacetJ);
  // Star Shard orbs: the flow ribbon spawns them — a live orb mesh must carry glowT + facetJ
  // and have NO Sprite child (the additive glow sprite is deleted in Skyforged mode).
  const shard = await flow.page.evaluate(() => {
    let found = false, noSprite = true, facetOk = false;
    window.__dd.scene.traverse((o) => {
      const a = o.geometry && o.geometry.attributes;
      // a shard = glowT + facetJ but NOT the big arch (the arch is a rockGap group child);
      // orbs are top-level small meshes. Distinguish by vertex count (< 60) + facetJ present.
      if (a && a.glowT && a.facetJ && a.position.count < 60) {
        found = true;
        let lo = 1, hi = 0; for (let i = 0; i < a.facetJ.count; i++) { const v = a.facetJ.getX(i); if (v < lo) lo = v; if (v > hi) hi = v; }
        facetOk = lo >= 0 && hi <= 1;
        if (o.children.some((c) => c.isSprite)) noSprite = false;
      }
    });
    return { found, noSprite, facetOk };
  });
  check('Star Shard orbs built in WebGL (small glowT+facetJ meshes present)', shard.found);
  check('the additive glow sprite is GONE in Skyforged mode (no Sprite child on the shard)', shard.noSprite);
  // Jade Annulus rings: a live ring carries glowT+facetJ, an OPAQUE per-instance markerSurface
  // whose uMid is GREEN (jade, not cyan) with the glint enabled — and is NOT transparent-from-spawn.
  const jade = await flow.page.evaluate(() => {
    let found = false, opaque = true, glintOn = false;
    window.__dd.scene.traverse((o) => {
      const at = o.geometry && o.geometry.attributes, u = o.material && o.material.userData && o.material.userData.markerUniforms;
      if (!at || !at.glowT || !at.facetJ || !u) return;
      const m = u.uMid.value; // ring = green (g high, b low); arch/orb = cyan (b high)
      if (m.g > 0.9 && m.b < 0.7) { found = true; if (o.material.transparent) opaque = false; if (u.uGlint.value > 0) glintOn = true; }
    });
    return { found, opaque, glintOn };
  });
  check('Jade Annulus rings built in WebGL (green glowT+facetJ gem with the glint on)', jade.found && jade.glintOn);
  check('the ring is OPAQUE from spawn (transparent:true wart fixed)', jade.opaque);
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
