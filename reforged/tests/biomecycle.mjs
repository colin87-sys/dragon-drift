// Biome CYCLE refactor (Aurora Shallows PR-0). Proves the CYCLE indirection is a byte-identical
// no-op with the shipped identity order [0..5] — biomeAt/biomeIndexAt reproduce the old
// `block % BIOMES.length` exactly across two full cycles — and guards the seam so a future CYCLE
// edit (slotting a new biome) is the ONLY thing that changes the order.
//   node tests/biomecycle.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
await import('three');
const { biomeAt, biomeIndexAt, BIOMES, CYCLE } = await import('../js/biomes.js');
const { CONFIG } = await import('../js/config.js');

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, '..', p), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

// The shipped order is the identity of the current 6 biomes → byte-identical to `block % 6`.
check('CYCLE is the shipped identity order [0,1,2,3,4,5]',
  Array.isArray(CYCLE) && CYCLE.length === BIOMES.length && CYCLE.every((v, i) => v === i));

// Across two full cycles, biomeAt.ia/ib must EXACTLY reproduce the pre-refactor formula
// (ia = block % N, ib = (ia+1) % N) — the byte-identical-no-op proof.
const L = CONFIG.biomeLength, N = BIOMES.length;
let iaOk = true, ibOk = true, idxOk = true;
for (let dist = 0; dist <= 12 * L; dist += 37) {
  const block = Math.max(0, Math.floor(dist / L));
  const oldIa = block % N, oldIb = (oldIa + 1) % N;
  const { ia, ib, t } = biomeAt(dist);
  if (ia !== oldIa) iaOk = false;
  if (ib !== oldIb) ibOk = false;
  const idx = biomeIndexAt(dist);
  if (idx !== (t < 0.5 ? oldIa : oldIb)) idxOk = false;
}
check('biomeAt.ia reproduces block % N over 2 cycles (byte-identical no-op)', iaOk);
check('biomeAt.ib reproduces (ia+1) % N over 2 cycles', ibOk);
check('biomeIndexAt is unchanged (picks ia/ib by the seam t)', idxOk);

// The seam consumers must route through CYCLE, not `block % BIOMES.length` / `k % N`.
const biomesSrc = read('js/biomes.js'), levelSrc = read('js/level.js');
check('biomeAt indexes through CYCLE (not block % BIOMES.length)',
  /const ci = block % CYCLE\.length/.test(biomesSrc) && /CYCLE\[ci\]/.test(biomesSrc) && !/block % BIOMES\.length/.test(biomesSrc.replace(/\/\/.*$/gm, '')));
check('set-piece biome index routes through CYCLE (the seam the plan caught)',
  /CYCLE\[k % CYCLE\.length\]/.test(levelSrc) && !/biomeIndex: k % N/.test(levelSrc));

console.log(`\nbiomecycle: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
