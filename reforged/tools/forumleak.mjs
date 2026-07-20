// PR-8 LEAKAGE AUDIT (DROWNED-FORUM-BUILD-SHEET §12a) — provably no jungle survives the default flip.
// Headless import with an EMPTY location.search → the DEFAULT prop branch, which after the PR-8 flip is the
// Drowned Forum kit. Asserts: (1) biome-0's whitelist = ONLY the 13 Drowned Forum keys; (2) no retired
// jungle/greco key is whitelisted into ANY biome by default. Run: node tools/forumleak.mjs
import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {},
  set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.removeEventListener) globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, createElement: () => ({ width: 0, height: 0, getContext: () => ctx2d }) };
if (!globalThis.location) globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
if (!globalThis.navigator) globalThis.navigator = { userAgent: 'node' };

const { propDiag } = await import('../js/environment.js');

// The SHIPPED Drowned Forum roster (11). `forumfield` (mosaic-grid gut-punch) + `roofline` (villa-gable scale
// anchor) were the deferred PR-END low-seasoning props — never built; they remain a recommended follow-up.
const FORUM = ['triumphgate','viamarina','viamarinaM','aqueduct','pantheon','drumfall','pinisle','basilica','colossus','pharos','arena'];
const PURGED = ['karstfang','figgate','mangrovehold','prasat','lotusraft','nagawall','causeway','rampart','lilyraft','rootbastion','arcade','rotunda','wrackstone'];

const diag = propDiag();
const inB0 = diag.filter((d) => d.biomes.includes(0)).map((d) => d.name).sort();
let fail = 0;

const extra = inB0.filter((k) => !FORUM.includes(k));
const missing = FORUM.filter((k) => !inB0.includes(k));
if (extra.length) { console.log('\x1b[31mFAIL\x1b[0m biome-0 default has non-forum keys:', extra.join(', ')); fail++; }
else console.log(`\x1b[32m ok \x1b[0m biome-0 default whitelist = the ${FORUM.length} shipped forum keys only (${inB0.length})`);
if (missing.length) { console.log('\x1b[31mFAIL\x1b[0m biome-0 missing forum keys:', missing.join(', ')); fail++; }

const leaked = diag.filter((d) => PURGED.includes(d.name) && d.biomes.length > 0);
if (leaked.length) { console.log('\x1b[31mFAIL\x1b[0m retired keys still whitelisted:', leaked.map((d) => `${d.name}->${JSON.stringify(d.biomes)}`).join(', ')); fail++; }
else console.log('\x1b[32m ok \x1b[0m no retired jungle/greco key whitelisted into any biome (default)');

console.log(fail ? `\x1b[31mforumleak: ${fail} failure(s)\x1b[0m` : '\x1b[32mforumleak: all green\x1b[0m');
process.exit(fail ? 1 : 0);
