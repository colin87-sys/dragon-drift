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

// CYCLE is the shipped play-order: the identity of the FIRST 6 biomes. BIOMES[6] (Aurora
// Shallows) is APPENDED but NOT yet in CYCLE — coexistence, reachable only via ?biome=6 until
// the flip. So the play order (and thus gold-determinism) is unchanged by the append.
check('CYCLE is [0,1,2,3,4,5] (identity of the first 6 biomes)',
  Array.isArray(CYCLE) && CYCLE.length === 6 && CYCLE.every((v, i) => v === i));
check('BIOMES[6] appended (Aurora Shallows) but NOT in CYCLE yet (coexistence)',
  BIOMES.length === 7 && !CYCLE.includes(6));

// biomeAt cycles through CYCLE with period CYCLE.length — reproduce CYCLE[block % N] exactly, and
// biome 6 must be UNREACHABLE via the seam (proving the append changed no play-order).
const L = CONFIG.biomeLength, N = CYCLE.length;
let iaOk = true, ibOk = true, idxOk = true, sixSeen = false;
for (let dist = 0; dist <= 24 * L; dist += 37) {
  const block = Math.max(0, Math.floor(dist / L));
  const oldIa = CYCLE[block % N], oldIb = CYCLE[(block % N + 1) % N];
  const { ia, ib, t } = biomeAt(dist);
  if (ia !== oldIa) iaOk = false;
  if (ib !== oldIb) ibOk = false;
  if (ia === 6 || ib === 6) sixSeen = true;
  const idx = biomeIndexAt(dist);
  if (idx !== (t < 0.5 ? oldIa : oldIb)) idxOk = false;
}
check('biomeAt.ia reproduces CYCLE[block % N] over 2 cycles', iaOk);
check('biomeAt.ib reproduces CYCLE[(block+1) % N]', ibOk);
check('biomeIndexAt is unchanged (picks ia/ib by the seam t)', idxOk);
check('biome 6 is UNREACHABLE via biomeAt (appended, not cycled → play order unchanged)', !sixSeen);

// The seam consumers must route through CYCLE, not `block % BIOMES.length` / `k % N`.
const biomesSrc = read('js/biomes.js'), levelSrc = read('js/level.js');
check('biomeAt indexes through CYCLE (not block % BIOMES.length)',
  /const ci = block % CYCLE\.length/.test(biomesSrc) && /CYCLE\[ci\]/.test(biomesSrc) && !/block % BIOMES\.length/.test(biomesSrc.replace(/\/\/.*$/gm, '')));
check('set-piece biome index routes through CYCLE (the seam the plan caught)',
  /CYCLE\[k % CYCLE\.length\]/.test(levelSrc) && !/biomeIndex: k % N/.test(levelSrc));

console.log(`\nbiomecycle: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
