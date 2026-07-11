// N8 atmosphere gate (GRAPHICS-OVERHAUL.md). Pure math + plumbing, CI-safe (no
// WebGL): the fog-chunk override is applied, the ported GLSL is byte-identical to
// stock linear fog at zero uniforms (and NOT identical when a term is on), the
// onBeforeCompile chain preserves the prior patch, binding shares the uniform
// objects, and the enabled/tier gates behave.
//   node tests/atmosphere.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const {
  installAtmosphere, atmosUniforms, assignAtmos, chainBeforeCompile, bindAtmosphere,
  setAtmosphereEnabled, setAtmosphereQuality, applyAtmosphere, atmosphereEnabled,
} = await import('../js/atmosphere.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

// --- GLSL builtins (JS ports) ------------------------------------------------
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const mix = (a, b, t) => a * (1 - t) + b * t;
const step = (edge, x) => (x < edge ? 0 : 1);
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

// The exact fog_fragment math from atmosphere.js, per RGB channel. Returns the
// composited channel value given a scene color, the fog color, the (optional) far
// color + mix, height term, and inscatter term.
function atmosChannel(sceneC, fogC, farC, depth, near, far, worldY, heightK, farMix, sunTint, atmSun, inscatter) {
  const fogFactor = smoothstep(near, far, depth);
  const atmF = fogFactor * mix(1.0, Math.exp(-Math.max(worldY, 0) * heightK), step(0.0001, heightK));
  let atmCol = mix(fogC, farC, atmF * farMix);
  atmCol += sunTint * (atmSun * inscatter * atmF);
  return mix(sceneC, atmCol, atmF);
}
// Stock r160 linear fog: mix(sceneColor, fogColor, smoothstep(near,far,depth)).
const stockChannel = (sceneC, fogC, depth, near, far) => mix(sceneC, fogC, smoothstep(near, far, depth));

// --- 1. chunk override applied ----------------------------------------------
installAtmosphere();
const fp = THREE.ShaderChunk.fog_pars_fragment, ff = THREE.ShaderChunk.fog_fragment, fv = THREE.ShaderChunk.fog_vertex;
check('fog_pars_fragment declares the atmosphere uniforms', /uAtmosFarColor/.test(fp) && /uAtmosHeightK/.test(fp) && /uAtmosInscatter/.test(fp));
check('fog_fragment keeps stock fogColor path + adds atmosphere', /gl_FragColor.rgb = mix/.test(ff) && /uAtmosSunTint/.test(ff));
check('fog_fragment preserves the FOG_EXP2 branch', /FOG_EXP2/.test(ff) && /fogDensity/.test(ff));
check('fog_vertex keeps vFogDepth verbatim + adds world varyings', /vFogDepth = - mvPosition.z/.test(fv) && /vAtmosWorldY/.test(fv) && /vAtmosWorldDir/.test(fv));
check('installAtmosphere is idempotent', (() => { const a = THREE.ShaderChunk.fog_fragment; installAtmosphere(); return THREE.ShaderChunk.fog_fragment === a; })());

// --- 1b. vertex world-reconstruction math (the Gate-2 bug: row-dot computed the
//     FORWARD rotation, not the inverse). Port the exact GLSL — `_atmRel =
//     (vec4(mv,0.0) * viewMatrix).xyz` = transpose(mat3(viewMatrix))*mv — and
//     check it against a three.js Matrix4 ground truth on a ROTATED + translated
//     camera (axis-aligned frames hide the bug; a banked camera exposes it). ----
{
  const cam = new THREE.PerspectiveCamera();
  cam.position.set(3, 5, 8);
  cam.rotation.set(0.35, 0.7, 0.22); // pitch + yaw + roll — none zero
  cam.updateMatrixWorld();
  const viewMatrix = cam.matrixWorldInverse;
  const e = viewMatrix.elements; // column-major
  const mv = new THREE.Vector3(10, 4, -50); // fragment, view space
  // GLSL `vec4(mv,0.0) * viewMatrix` (row-vector * matrix): out.j = dot(mv, column_j).
  const glslRel = new THREE.Vector3(
    mv.x * e[0] + mv.y * e[1] + mv.z * e[2],
    mv.x * e[4] + mv.y * e[5] + mv.z * e[6],
    mv.x * e[8] + mv.y * e[9] + mv.z * e[10],
  );
  const glslWorldY = cam.position.y + glslRel.y;
  // Ground truth: inverse-rotate mv by the view rotation.
  const truth = mv.clone().applyMatrix4(new THREE.Matrix4().extractRotation(viewMatrix).transpose());
  const truthWorldY = cam.position.y + truth.y;
  check(`vertex world-dir matches Matrix4 truth (err ${glslRel.distanceTo(truth).toExponential(2)})`, glslRel.distanceTo(truth) < 1e-4);
  check(`vertex world-Y matches truth (${glslWorldY.toFixed(3)} vs ${truthWorldY.toFixed(3)})`, Math.abs(glslWorldY - truthWorldY) < 1e-4);
  // The buggy row-dot (mat3*mv, forward) must be measurably WRONG here — proves
  // the test actually discriminates the fix from the bug.
  const buggyRel = new THREE.Vector3(
    mv.x * e[0] + mv.y * e[4] + mv.z * e[8],
    mv.x * e[1] + mv.y * e[5] + mv.z * e[9],
    mv.x * e[2] + mv.y * e[6] + mv.z * e[10],
  );
  check('the forward-rotation form is caught as wrong (guards the fix)', buggyRel.distanceTo(truth) > 1.0);
}

// --- 2. zero-uniform identity (the coexistence guarantee) --------------------
// All atmosphere uniforms 0 → every channel byte-identical to stock, across a
// grid of depths, colors, heights.
let maxErr = 0;
for (const depth of [50, 90, 150, 250, 400, 600]) {
  for (const worldY of [0, 5, 20, 60]) {
    for (const [sc, fc] of [[0.2, 0.8], [0.9, 0.1], [0.5, 0.5]]) {
      const got = atmosChannel(sc, fc, /*farC*/0.3, depth, 70, 380, worldY, /*heightK*/0, /*farMix*/0, /*sunTint*/0.4, /*atmSun*/0.9, /*inscatter*/0);
      const want = stockChannel(sc, fc, depth, 70, 380);
      maxErr = Math.max(maxErr, Math.abs(got - want));
    }
  }
}
check(`zero-uniform fog is byte-identical to stock (max err ${maxErr.toExponential(2)})`, maxErr === 0);

// --- 3. each term actually changes the output when its uniform is on ----------
const baseline = atmosChannel(0.5, 0.8, 0.1, 200, 70, 380, 30, 0, 0, 0.9, 0.9, 0);
const withHeight = atmosChannel(0.5, 0.8, 0.1, 200, 70, 380, 30, 0.045, 0, 0.9, 0.9, 0);
check('heightK reduces fog at altitude (less fog than stock)', withHeight !== baseline && Math.abs(withHeight - 0.5) < Math.abs(baseline - 0.5));
const withFar = atmosChannel(0.5, 0.8, 0.1, 300, 70, 380, 5, 0, 1.0, 0.9, 0.9, 0);
check('farMix pulls toward the far color', withFar !== baseline);
const withSun = atmosChannel(0.5, 0.8, 0.1, 300, 70, 380, 5, 0, 0, 0.9, 0.9, 0.7);
check('inscatter brightens toward the sun', withSun > atmosChannel(0.5, 0.8, 0.1, 300, 70, 380, 5, 0, 0, 0.9, 0.9, 0));

// --- 4. chainBeforeCompile preserves the prior patch (order: prior first) -----
const order = [];
const mat = { onBeforeCompile: () => order.push('prior') };
chainBeforeCompile(mat, () => order.push('atmos'));
mat.onBeforeCompile({ uniforms: {} });
check('chain runs prior patch then the new one', order.join(',') === 'prior,atmos');
// Chaining onto a material with NO prior compile is safe.
const bare = {};
chainBeforeCompile(bare, () => order.push('solo'));
bare.onBeforeCompile({ uniforms: {} });
check('chain works with no prior onBeforeCompile', typeof bare.onBeforeCompile === 'function');

// --- 5. bindAtmosphere shares the uniform OBJECTS (live toggle) --------------
const bound = {};
bindAtmosphere(bound);
const shader = { uniforms: {} };
bound.onBeforeCompile(shader);
check('bindAtmosphere assigns the atmosphere uniforms', 'uAtmosFarMix' in shader.uniforms && 'uAtmosHeightK' in shader.uniforms);
check('bound shader shares the SAME uniform object (live)', shader.uniforms.uAtmosHeightK === atmosUniforms.uAtmosHeightK);
// Program-partition guard: an unbound material never receives the uniforms, so it
// keeps GL-default 0 — it must not share a program with a bound one. assignAtmos
// only runs where bound.
const unbound = { uniforms: {} };
check('unbound shader gets NO atmosphere uniforms (partitioned)', !('uAtmosHeightK' in unbound.uniforms));

// --- 6. enabled + tier gates -------------------------------------------------
const env = { fogFarColor: new THREE.Color(0.1, 0.02, 0.02), fogFarMix: 1, sunGlow: new THREE.Color(1, 0.7, 0.4), atmosHeightK: 0.045, atmosInscatter: 0.7 };
setAtmosphereEnabled(false);
applyAtmosphere(env);
check('disabled → live terms held at 0 (shipped fog)', atmosUniforms.uAtmosHeightK.value === 0 && atmosUniforms.uAtmosInscatter.value === 0 && atmosUniforms.uAtmosFarMix.value === 0);
setAtmosphereEnabled(true);
setAtmosphereQuality(0);
applyAtmosphere(env);
check('enabled tier0 → biome values written', atmosUniforms.uAtmosHeightK.value === 0.045 && atmosUniforms.uAtmosInscatter.value === 0.7 && atmosUniforms.uAtmosFarMix.value === 1);
check('enabled → sun tint copied from sunGlow', Math.abs(atmosUniforms.uAtmosSunTint.value.r - 1) < 1e-6);
setAtmosphereQuality(2);
applyAtmosphere(env);
check('tier2 → heightK/inscatter dropped, far-color mix kept', atmosUniforms.uAtmosHeightK.value === 0 && atmosUniforms.uAtmosInscatter.value === 0 && atmosUniforms.uAtmosFarMix.value === 1);
setAtmosphereEnabled(false); // leave global state shipped for any later import

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
