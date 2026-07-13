// Aurora Shallows sky-splice gate (BIOME plan §1). Pure logic, CI-safe (no WebGL): the
// curtain block is uniform-branched (off = zero cost + byte-identical shipped sky), the
// authenticity invariants are present in the shader (bottom-anchored border, physics ramp,
// seam-free noise), the JS driver's tier table + phase-wrap are right, the biome channel is
// 0 in every shipped biome, and — critically — the curtain is PROBE-INVISIBLE.
//   node tests/aurora.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
const {
  AURORA_HEAD, AURORA_BODY, auroraUniforms, applyAurora,
  setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled,
} = await import('../js/auroraSky.js');
const { computeEnv, BIOMES } = await import('../js/biomes.js');
const { CONFIG } = await import('../js/config.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const url = (p) => new URL(p, import.meta.url);

// --- 1. the curtain block is UNIFORM-BRANCHED (off = zero cost, not branchless *0) --
check('AURORA_BODY is uniform-branched (if uAuroraMix > eps)', /if\s*\(\s*uAuroraMix\s*>\s*0\.0001\s*\)/.test(AURORA_BODY));
check('aurLum hoisted =0 above the branch (star-attenuation coupling, identity off)', /float\s+aurLum\s*=\s*0\.0;[\s\S]*if\s*\(\s*uAuroraMix/.test(AURORA_BODY));
check('AURORA_HEAD declares the gate + curtain uniforms', /uAuroraMix/.test(AURORA_HEAD) && /uAurPhase/.test(AURORA_HEAD) && /uAurLayers/.test(AURORA_HEAD) && /uAurGreen/.test(AURORA_HEAD));
check('AURORA_HEAD carries SELF-CONTAINED noise (no shared symbol collision)', /float\s+_aHash/.test(AURORA_HEAD) && /float\s+_aNoise/.test(AURORA_HEAD));

// --- 2. the authenticity invariants (the ONE thing: bottom-anchored curtains) -----
check('SEAM-FREE: noise on normalize(d.xz), not an atan azimuth', /normalize\(\s*d\.xz/.test(AURORA_BODY) && !/atan/.test(AURORA_BODY));
check('SHARP LOWER BORDER: a smoothstep bottom cut keyed on elevation h0', /below\s*=\s*smoothstep\(\s*h0/.test(AURORA_BODY));
check('exp fade UP from the border (nothing symmetric)', /tall\s*=\s*exp\(\s*-max\(\s*hy\s*-\s*h0/.test(AURORA_BODY));
check('PHYSICS RAMP: green OWNS the border (not inverted), crimson only when active', /mix\(\s*uAurFringe\s*,\s*uAurGreen\s*,\s*smoothstep\(\s*h0/.test(AURORA_BODY) && /uAurRed[\s\S]*uAurAct/.test(AURORA_BODY));
check('BORDER HOT-LINE: a thin exp spike glued to the border, ×(1+..hot)', /hot\s*=\s*exp\([\s\S]*I\s*\*=\s*1\.0\s*\+\s*[\d.]+\s*\*\s*hot/.test(AURORA_BODY));
check('curtain kept UNDER the bloom threshold (× 0.7 ceiling, hot-line only crosses)', /uAuroraMix\s*\*\s*0\.7/.test(AURORA_BODY));
check('drapery FOLDS: broad swell + a SECOND octave (no ruler-straight single swell)', /fold\s*=\s*_aNoise/.test(AURORA_BODY) && /fold\s*\+=\s*[\d.]+\s*\*\s*\(_aNoise/.test(AURORA_BODY));
check('NARROW sheet (a ribbon, not a wash) + height SHEAR for 3D drape', /exp\(\s*-u\s*\*\s*u\s*\*\s*6\.0\s*\)/.test(AURORA_BODY) && /u\s*\+=\s*\(hy\s*-\s*h0\)/.test(AURORA_BODY));

// --- 3. gate: default 0 (shipped); enable/disable/force + per-frame write ---------
check('default mix 0 (byte-identical shipped sky)', auroraUniforms.uAuroraMix.value === 0);
const env = { auroraMix: 0.7 };
setAuroraForced(false);
setAuroraEnabled(false);
applyAurora(env, 1000, 5);
check('disabled → mix held at 0', auroraUniforms.uAuroraMix.value === 0);
setAuroraEnabled(true);
applyAurora(env, 1000, 5);
check('enabled → biome auroraMix written', Math.abs(auroraUniforms.uAuroraMix.value - 0.7) < 1e-6);
check('default night-wash 0 (real gameplay never darkens the sky)', auroraUniforms.uAurNight.value === 0);
setAuroraForced(true);
applyAurora({ auroraMix: 0 }, 1000, 5);
check('forced (?aurora=1) → mix 1 even with no biome channel', auroraUniforms.uAuroraMix.value === 1);
check('forced preview → night wash 1 (aurora needs a dark sky)', auroraUniforms.uAurNight.value === 1);
setAuroraForced(false);
applyAurora({ auroraMix: 0.7 }, 1000, 5); // a real biome declaring aurora: curtain on, but NO night wash
check('real biome aurora → curtain on, night wash 0 (biome supplies its own dark palette)',
  Math.abs(auroraUniforms.uAuroraMix.value - 0.7) < 1e-6 && auroraUniforms.uAurNight.value === 0);
applyAurora({ auroraMix: 0 }, 1000, 5);
check('un-forced + no biome channel → back to 0 (shipped)', auroraUniforms.uAuroraMix.value === 0);

// --- 4. tier truth table (weaker tiers thin the curtain, never delete it) ---------
setAuroraQuality(0);
check('tier0 → 2 curtain layers + rays on', auroraUniforms.uAurLayers.value === 2 && auroraUniforms.uAurRay.value === 1);
setAuroraQuality(1);
check('tier1 → 1 layer, rays still on', auroraUniforms.uAurLayers.value === 1 && auroraUniforms.uAurRay.value === 1);
setAuroraQuality(2);
check('tier2 → 1 layer, rays off (a smooth quiet arc — still authentic)', auroraUniforms.uAurLayers.value === 1 && auroraUniforms.uAurRay.value === 0);
setAuroraQuality(0);

// --- 5. phases are JS-WRAPPED (float32 precision on endless runs — uCloudDrift lesson)
setAuroraForced(true);
applyAurora({ auroraMix: 0 }, 10_000_000, 5); // ~forever
check('uAurPhase wrapped into [0,4096) (no float32 shimmer)', auroraUniforms.uAurPhase.value >= 0 && auroraUniforms.uAurPhase.value < 4096);
check('uAurBreath stays in [0,1] (two incommensurate sines)', auroraUniforms.uAurBreath.value >= 0 && auroraUniforms.uAurBreath.value <= 1);
check('uAurAct stays in [0,1] (slow form envelope)', auroraUniforms.uAurAct.value >= 0 && auroraUniforms.uAurAct.value <= 1);
setAuroraForced(false);
applyAurora({ auroraMix: 0 }, 5, 5); // leave shipped state

// --- 6. the biome channel is 0 in EVERY shipped biome (optional-channel = identity) --
let maxMix = 0;
const L = CONFIG.biomeLength;
for (let dist = 0; dist <= 8 * L; dist += L / 4) maxMix = Math.max(maxMix, computeEnv(dist).auroraMix);
check(`no shipped biome declares aurora → env.auroraMix 0 everywhere (max ${maxMix})`, maxMix === 0);
check('no BIOMES entry carries an `aurora` field yet (channel dormant)', BIOMES.every((b) => !b.aurora));

// --- 7. spliced into the sky shader (environment.js) with the right couplings ------
const envSrc = readFileSync(url('../js/environment.js'), 'utf8');
check('sky shader splices AURORA_HEAD + AURORA_BODY', /\$\{AURORA_HEAD\}/.test(envSrc) && /\$\{AURORA_BODY\}/.test(envSrc));
check('AURORA_BODY spliced BEFORE the clouds (10km clouds occlude the 100km curtain)',
  envSrc.indexOf('${AURORA_BODY}') < envSrc.indexOf('${CLOUD_BODY}'));
check('stars dimmed behind the curtain (reads aurLum, identity at 0)', /star\s*\*=\s*1\.0\s*-\s*0\.65\s*\*\s*clamp\(\s*aurLum/.test(envSrc));
check('surge night-veil suppressed under the real aurora (× (1 - uAuroraMix))', /aurora\s*\*\s*smoothstep\(0\.2,\s*0\.6,\s*h\)\s*\*\s*starMix\s*\*\s*0\.12\s*\*\s*\(1\.0\s*-\s*uAuroraMix\)/.test(envSrc));
check('tier banding dither gated to the curtain (× uAuroraMix)', /1\.0\s*\/\s*255\.0\)\s*\*\s*uAuroraMix/.test(envSrc));
check('applyAurora driven per-frame near applySkyClouds', /applyAurora\(env,\s*playerDist,\s*time\)/.test(envSrc));
check('auroraUniforms spread into the skyMat uniforms', /\.\.\.auroraUniforms/.test(envSrc));
// The preview night wash: darken the dome + kill the sun + light the stars, all gated by uAurNight
// (0 in real play → byte-identical). Never over the real biome, which supplies its own night palette.
check('preview darkens the dome before the curtain (× uAurNight)', /col\s*=\s*mix\(\s*col\s*,\s*vec3\([^)]*\)\s*,\s*uAurNight\s*\)/.test(envSrc));
check('preview kills the sun (× (1 - uAurNight))', /sunGlow[\s\S]{0,120}\*\s*\(1\.0\s*-\s*uAurNight\)/.test(envSrc));
check('preview lights the stars (max(starMix, uAurNight..))', /star\s*\*\s*max\(\s*starMix\s*,\s*uAurNight/.test(envSrc));

// --- 8. wired into main.js (the ?aurora=1 hero read + tier switch) -----------------
const mainSrc = readFileSync(url('../js/main.js'), 'utf8');
check('main.js reads ?aurora=1 → setAuroraForced(true)', /getParam?|aurora['"]\)\s*===\s*['"]1['"]/.test(mainSrc) && /setAuroraForced\(true\)/.test(mainSrc));
check('main.js drives setAuroraQuality in applyQuality', /setAuroraQuality\(tier\)/.test(mainSrc));
check('main.js gates god-ray shafts off in the aurora preview (no white fan on the night sky)', /auroraForced\(\)\s*\?\s*0\s*:\s*_camFwd\.dot/.test(mainSrc));

// --- 9. PROBE-EXCLUSION GUARD: skyProbe.js must not know about the aurora ----------
const probeSrc = readFileSync(url('../js/skyProbe.js'), 'utf8');
// The probe deliberately excludes the high-frequency curtain — the only mention of "aurora"
// in skyProbe.js is the comment DOCUMENTING that exclusion; there must be NO aurora uniform
// or code path (that would alias the curtain into SH wobble).
check('skyProbe.js has NO aurora uniform/code (probe-invisible; only the exclusion note)',
  !/uAur/.test(probeSrc) && !/auroraUniforms|applyAurora|AURORA_/.test(probeSrc));

// --- 10. biomes.js carries the channel (default 0, lerped like starMix) ------------
const biomesSrc = readFileSync(url('../js/biomes.js'), 'utf8');
check('computeEnv lerps env.auroraMix from a.aurora/b.aurora (optional channel)', /env\.auroraMix\s*=\s*lerp\(\s*a\.aurora\s*\|\|\s*0\s*,\s*b\.aurora\s*\|\|\s*0/.test(biomesSrc));

setAuroraEnabled(true); setAuroraForced(false); setAuroraQuality(0); // leave shipped state for later imports
console.log(`\naurora: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
