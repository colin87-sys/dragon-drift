// Fable 75 aerial-perspective gate (GRAPHICS-OVERHAUL.md). CI-safe (no WebGL): the
// per-biome ember lever is byte-identical at 0 (the diffuse mix + emissive add both
// collapse to a no-op), it is LIVE and depth-gated when on, the near field stays the
// untouched pure-black anchor, and the biomes.js plumbing routes 0.85 into the Lumen
// Mire while every non-adjacent biome centre stays 0 (→ the other 6 biomes render
// byte-identical). The GLSL is ported here; the shader source is asserted to contain
// the exact same expression so the port can't silently drift from what compiles.
//   node tests/propaerial.mjs
import { readFileSync } from 'fs';
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const { computeEnv } = await import('../js/biomes.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

// --- GLSL builtins (JS ports) ------------------------------------------------
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const mix = (a, b, t) => a * (1 - t) + b * t;
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

// The EXACT aerial math from addPropDetail (environment.js), per RGB channel.
// diffuse: mix(diffuse, ember, _aer*0.50); emissive: emissive + ember*(_aer*0.40)
// where _aer = smoothstep(55,230,depth)^2 * uPropAerial.
function aer(depth, lever) { const s = smoothstep(55.0, 230.0, depth); return s * s * lever; }
const aerDiffuse = (d, ember, depth, lever) => mix(d, ember, aer(depth, lever) * 0.50);
const aerEmissive = (e, ember, depth, lever) => e + ember * (aer(depth, lever) * 0.40);

// --- 1. identity at lever 0 (the other 6 biomes): exact no-op at every depth -----
{
  let ok = true;
  for (const depth of [0, 40, 55, 120, 230, 400]) {
    if (!near(aerDiffuse(0.4, 0.61, depth, 0), 0.4)) ok = false;   // 0x9c5a22 red channel ≈ 0.61
    if (!near(aerEmissive(0.25, 0.61, depth, 0), 0.25)) ok = false;
  }
  check('lever 0 → diffuse mix + emissive add are an exact no-op at all depths', ok);
}

// --- 2. the near field stays the pure-black anchor even at lever 0.85 -----------
check('near props (<55m) are untouched at lever 0.85 (the black floor holds)',
  near(aerDiffuse(0.4, 0.61, 54.0, 0.85), 0.4) && near(aerEmissive(0.25, 0.61, 54.0, 0.85), 0.25));

// --- 3. the term is LIVE and monotonic with depth when on -----------------------
{
  const e120 = aerEmissive(0.05, 0.61, 120.0, 0.85);
  const e170 = aerEmissive(0.05, 0.61, 170.0, 0.85);
  const e230 = aerEmissive(0.05, 0.61, 230.0, 0.85);
  check('emissive ember lift rises with depth (120<170<230) and is non-zero far',
    e120 > 0.05 && e170 > e120 && e230 > e170);
  check('diffuse blends toward ember at far depth (≥230m)',
    aerDiffuse(0.06, 0.61, 260.0, 0.85) > 0.06);
}

// --- 4. quadratic ease (no hard band): the 120m lift is small, the 200m lift big -
{
  const lift = (depth) => aer(depth, 0.85);
  check('quadratic ease keeps the mid-window lift low (120m ≪ 200m)',
    lift(120) < 0.12 && lift(200) > 0.45);
}

// --- 5. biomes.js plumbing: 0.85 in Lumen Mire, 0 at every non-adjacent centre ---
//     block index → biome via CYCLE [0,1,2,3,4,6,5]; block 4 = Lumen Mire. Biome
//     centres (local 750) sit at t=0, far from the 150m seam crossfade.
const centre = (block) => block * 1500 + 750;
{
  const mire = computeEnv(centre(4));
  check('Lumen Mire centre → env.propAerial = 0.85', near(mire.propAerial, 0.85, 1e-4));
  const ember = new THREE.Color(0x9c5a22);   // same construction path as biomes.js C() → same colour space
  check('Lumen Mire centre → propAerialColor is the ember 0x9c5a22',
    near(mire.propAerialColor.r, ember.r, 1e-4) && near(mire.propAerialColor.g, ember.g, 1e-4) && near(mire.propAerialColor.b, ember.b, 1e-4));
  // Non-adjacent biome centres (blocks 0,1,6→biome5) must be a hard 0 → byte-identical.
  let zero = true;
  for (const block of [0, 1, 2, 6]) { if (!near(computeEnv(centre(block)).propAerial, 0)) zero = false; }
  check('non-Mire biome centres → env.propAerial = 0 (other biomes byte-identical)', zero);
}

// --- 6. the ported GLSL matches the shader SOURCE (the port can't drift) ---------
{
  const src = readFileSync(new URL('../js/environment.js', import.meta.url), 'utf8');
  check('addPropDetail declares the aerial uniforms', /uniform float uPropAerial;\s*uniform vec3 uPropAerialCol;/.test(src));
  check('shader diffuse uses smoothstep(55.0, 230.0, vFogDepth) squared × uPropAerial',
    /smoothstep\(55\.0, 230\.0, vFogDepth\)/.test(src) && /_aer \*= _aer \* uPropAerial/.test(src));
  check('shader mixes diffuse toward ember at *0.50 and adds emissive at *0.40',
    /mix\(diffuseColor\.rgb, uPropAerialCol, _aer \* 0\.50\)/.test(src) && /totalEmissiveRadiance \+= uPropAerialCol \* \(_aer \* 0\.40\)/.test(src));
}

console.log(`\npropaerial: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
