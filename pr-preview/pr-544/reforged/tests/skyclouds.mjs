// N9 sky-clouds gate (GRAPHICS-OVERHAUL.md). Pure logic, CI-safe (no WebGL): the
// cloud block is uniform-branched (off = zero cost + shipped gradient), the tier
// truth table is right, the god-ray coupling zeroes when off, the FBM port is
// deterministic, and — critically — the clouds are PROBE-INVISIBLE (skyProbe.js
// must not reference them; skyColorAt stays a low-frequency approximation).
//   node tests/skyclouds.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
const {
  CLOUD_HEAD, CLOUD_BODY, cloudUniforms, applySkyClouds, sunCloudCover, jFbm,
  setSkyCloudsEnabled, setSkyCloudQuality, skyCloudsEnabled, CLOUD_PARALLAX,
} = await import('../js/skyClouds.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const url = (p) => new URL(p, import.meta.url);

// --- 1. the cloud block is UNIFORM-BRANCHED (off = zero cost, not branchless *0) --
check('CLOUD_BODY is uniform-branched (if uCloudAmount > eps)', /if\s*\(\s*uCloudAmount\s*>\s*0\.0001\s*\)/.test(CLOUD_BODY));
// D2: cCov is hoisted ABOVE the branch (=0 when off) so the sun disc can occlude
// behind clouds while staying byte-identical when clouds are off.
check('CLOUD_BODY hoists cCov=0 above the branch (sun-disc coupling, identity off)', /float\s+cCov\s*=\s*0\.0;[\s\S]*if\s*\(\s*uCloudAmount/.test(CLOUD_BODY));
check('CLOUD_HEAD declares the gate + octave/warp uniforms', /uCloudAmount/.test(CLOUD_HEAD) && /uCloudOctaves/.test(CLOUD_HEAD) && /uCloudWarp/.test(CLOUD_HEAD));
check('octave count is a uniform break-loop (one program across tiers)', /if\s*\(\s*i\s*>=\s*uCloudOctaves\s*\)\s*break/.test(CLOUD_HEAD));

// --- 2. gate: default 0 (shipped); enable/disable + per-frame write ------------
check('default amount 0 (shipped gradient)', cloudUniforms.uCloudAmount.value === 0);
const env = { cloudAmount: 0.6, cloudLit: new THREE.Color(1, 1, 1), cloudShadow: new THREE.Color(0.5, 0.5, 0.6) };
setSkyCloudsEnabled(false);
applySkyClouds(env, 1000, 5);
check('disabled → amount held at 0', cloudUniforms.uCloudAmount.value === 0);
setSkyCloudsEnabled(true);
setSkyCloudQuality(0);
applySkyClouds(env, 1000, 5);
check('enabled tier0 → biome amount written', cloudUniforms.uCloudAmount.value === 0.6);
check('enabled → lit/shadow colours copied', Math.abs(cloudUniforms.uCloudLit.value.r - 1) < 1e-6);

// --- 3. tier truth table ------------------------------------------------------
setSkyCloudQuality(0);
check('tier0 → 3 octaves + warp on', cloudUniforms.uCloudOctaves.value === 3 && cloudUniforms.uCloudWarp.value === 1);
setSkyCloudQuality(1);
check('tier1 → 2 octaves + warp off', cloudUniforms.uCloudOctaves.value === 2 && cloudUniforms.uCloudWarp.value === 0);
setSkyCloudQuality(2);
applySkyClouds(env, 1000, 5);
check('tier2 → amount forced 0 (clouds off on weak mobile)', cloudUniforms.uCloudAmount.value === 0);

// --- 4. parallax drift is JS-wrapped (float32 precision on endless runs) -------
setSkyCloudQuality(0);
applySkyClouds(env, 10_000_000, 5); // ~10,000 km
check('drift wrapped into [0,1024) (no float32 shimmer)', cloudUniforms.uCloudDrift.value >= 0 && cloudUniforms.uCloudDrift.value < 1024);
// Parallax rate is GENTLE: at cruise (~50 m/s) the world-drift must advance far
// slower than the field spans in a second, else clouds race by (owner report).
// applySkyClouds + sunCloudCover both read the one CLOUD_PARALLAX constant, so
// this pins the magnitude for both. 1s of cruise ≈ 50 dist → drift ≈ 0.1.
applySkyClouds(env, 1000, 5);
check('cloud drift uses CLOUD_PARALLAX (no stray literal)', cloudUniforms.uCloudDrift.value === (1000 * CLOUD_PARALLAX) % 1024);
check('parallax dialled down to gentle rate (≤ 0.004/dist)', CLOUD_PARALLAX <= 0.004);

// --- 5. god-ray coupling: cover is 0 when off / tier2, in [0,1] when on --------
const sunDir = new THREE.Vector3(-0.22, 0.1, -1).normalize();
setSkyCloudsEnabled(false);
check('sunCloudCover 0 when clouds off', sunCloudCover(env, sunDir, 1000, 5) === 0);
setSkyCloudsEnabled(true); setSkyCloudQuality(2);
check('sunCloudCover 0 at tier2', sunCloudCover(env, sunDir, 1000, 5) === 0);
setSkyCloudQuality(0);
let cmin = 1, cmax = 0;
for (let t = 0; t < 200; t += 7) { const c = sunCloudCover(env, sunDir, t * 130, t); cmin = Math.min(cmin, c); cmax = Math.max(cmax, c); }
check(`sunCloudCover in [0,1] over time (min ${cmin.toFixed(3)}, max ${cmax.toFixed(3)})`, cmin >= 0 && cmax <= 1);

// --- 6. FBM port is deterministic + respects octave count ---------------------
check('jFbm deterministic', jFbm(3.1, 7.2, 3) === jFbm(3.1, 7.2, 3));
check('jFbm octave count changes the value (loop honoured)', jFbm(3.1, 7.2, 3) !== jFbm(3.1, 7.2, 2));
let fmin = 9, fmax = -9;
for (let i = 0; i < 400; i++) { const v = jFbm(i * 0.37, i * 0.19, 3); fmin = Math.min(fmin, v); fmax = Math.max(fmax, v); }
check(`jFbm bounded (min ${fmin.toFixed(2)}, max ${fmax.toFixed(2)})`, fmin >= 0 && fmax <= 1);

// --- 7. PROBE-EXCLUSION GUARD: skyProbe.js must not know about clouds ----------
const probeSrc = readFileSync(url('../js/skyProbe.js'), 'utf8');
check('skyProbe.js has NO cloud reference (probe-invisible)', !/cloud/i.test(probeSrc));
check('skyColorAt still present + unchanged shape (gradient + fogFar + sun glow)', /export function skyColorAt/.test(probeSrc) && /fogFarMix/.test(probeSrc) && /Math\.pow\(s, 10\.0\)/.test(probeSrc));

// --- 8. clouds ARE spliced into the sky shader (environment.js) ---------------
const envSrc = readFileSync(url('../js/environment.js'), 'utf8');
check('sky shader splices CLOUD_HEAD + CLOUD_BODY', /\$\{CLOUD_HEAD\}/.test(envSrc) && /\$\{CLOUD_BODY\}/.test(envSrc));
check('sky.renderOrder set (the perf offset)', /sky\.renderOrder\s*=\s*1/.test(envSrc));
check('sun disc is occluded by cloud coverage (D2: reads cCov, identity at 0)', /pow\(s, 900\.0\)[\s\S]*cCov/.test(envSrc));
// D1: the FBM max must clear the coverage window's upper edge (0.72) so cloud
// cores reach full `shape` (smoothstep(0.40,0.72,n)=1) instead of a translucent
// veil. (Value-noise FBM tops out ~0.87 even normalized — that's fine, it clears 0.72.)
{ let m = 0; for (let i = 0; i < 600; i++) m = Math.max(m, jFbm(i * 0.41, i * 0.23, 3)); check(`FBM cores clear the coverage window (max ${m.toFixed(3)} > 0.72)`, m > 0.72); }

setSkyCloudsEnabled(false); setSkyCloudQuality(0); // leave shipped state for later imports
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
