// Phase-0 graphics foundation checks (GRAPHICS-OVERHAUL.md N1/N2/N3).
// Functional test of the tonemapper install/select, plus source-string asserts
// that the dither + renderer-contract wiring is present. CI-safe: no WebGL
// context needed (toneMap.js only edits a ShaderChunk string; the rest is grep).
//   node tests/graphicsfoundation.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// three (and anything importing it) must load AFTER register() — dynamic import.
const THREE = await import('three');
const { installNeutralToneMap, setToneMap, TONEMAP_MODES } = await import('../js/toneMap.js');

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, '..', p), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

// --- N3: Neutral tonemapper installs into the CustomToneMapping slot ---
const stub = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
check('N3: CustomToneMapping stub present before install', THREE.ShaderChunk.tonemapping_pars_fragment.includes(stub));
installNeutralToneMap();
const chunk = THREE.ShaderChunk.tonemapping_pars_fragment;
check('N3: Neutral spliced in (startCompression present)', chunk.includes('startCompression'));
check('N3: stub replaced (no passthrough Custom body)', !chunk.includes(stub));
check('N3: still valid GLSL shape (CustomToneMapping defined)', chunk.includes('vec3 CustomToneMapping( vec3 color )'));
installNeutralToneMap(); // idempotent — re-read the live chunk and assert it didn't double-splice
const chunk2 = THREE.ShaderChunk.tonemapping_pars_fragment;
check('N3: install is idempotent (Neutral spliced exactly once)', (chunk2.match(/startCompression/g) || []).length === 4);

// --- N3: setToneMap selects mode + exposure, rejects garbage ---
check('N3: modes list is aces/agx/neutral', TONEMAP_MODES.join(',') === 'aces,agx,neutral');
const rAces = {}; check('N3: setToneMap(aces)', setToneMap(rAces, 'aces') && rAces.toneMapping === THREE.ACESFilmicToneMapping && rAces.toneMappingExposure === 0.92);
const rAgx = {}; check('N3: setToneMap(agx)', setToneMap(rAgx, 'agx') && rAgx.toneMapping === THREE.AgXToneMapping);
const rNeu = {}; check('N3: setToneMap(neutral)', setToneMap(rNeu, 'neutral') && rNeu.toneMapping === THREE.CustomToneMapping);
check('N3: setToneMap(NONSENSE) rejected', setToneMap({}, 'sepia') === false);
check('N3: setToneMap case-insensitive', setToneMap({}, 'ACES') === true);

// --- N1: grading-pass dither wiring ---
const post = read('js/postfx.js');
check('N1: uDither uniform declared', /uDither:\s*\{\s*value:\s*1\.0\s*\}/.test(post));
check('N1: uDither uniform in fragment', post.includes('uniform float uDither;'));
check('N1: interleaved-gradient-noise dither term', post.includes('52.9829189') && /col\s*\+=\s*\(ign\s*-\s*0\.5\)\s*\*\s*\(1\.0\s*\/\s*255\.0\)\s*\*\s*uDither/.test(post));
check('N1: setDither export', /export function setDither/.test(post));

// --- N2: renderer contract wiring in main.js ---
const main = read('js/main.js');
check('N2: powerPreference high-performance', main.includes("powerPreference: 'high-performance'"));
check('N2: explicit outputColorSpace = SRGB', main.includes('renderer.outputColorSpace = THREE.SRGBColorSpace'));
check('N3: installNeutralToneMap() called before renderer', main.indexOf('installNeutralToneMap()') > 0 && main.indexOf('installNeutralToneMap()') < main.indexOf('new THREE.WebGLRenderer'));
check('N3: ?tm= wired', /urlParams\.get\('tm'\)/.test(main) && main.includes('setToneMap(renderer'));
check('N1: ?dither=0 wired', /urlParams\.get\('dither'\)\s*===\s*'0'/.test(main) && main.includes('setDither(false)'));

// --- N3: the composed path (OutputPass) must actually apply CustomToneMapping,
// or ?tm=neutral is silently untonemapped on tier0/1. Patch the vendored pass. ---
const outPass = read('lib/postprocessing/OutputPass.js');
const outShader = read('lib/shaders/OutputShader.js');
check('N3: OutputPass imports CustomToneMapping', /CustomToneMapping,/.test(outPass));
check('N3: OutputPass sets CUSTOM_TONE_MAPPING define', outPass.includes('this._toneMapping === CustomToneMapping') && outPass.includes("this.material.defines.CUSTOM_TONE_MAPPING = ''"));
check('N3: OutputShader has CUSTOM_TONE_MAPPING branch', outShader.includes('#elif defined( CUSTOM_TONE_MAPPING )') && /gl_FragColor\.rgb = CustomToneMapping\( gl_FragColor\.rgb \)/.test(outShader));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
