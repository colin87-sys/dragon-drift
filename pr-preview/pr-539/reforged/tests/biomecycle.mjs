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

// THE FLIPS: Aurora Shallows (6) slotted between Mire (4) and Astral (5), then Tempest Reach (7)
// slotted between Aurora (6) and Astral (5) → CYCLE = [0,1,2,3,4,6,7,5], now 8 long. The shipped PREFIX
// (blocks 0-4 → biomes 0-4) is preserved; the order changes from block 5 on. gold-determinism is
// untouched because course gen is biome-blind (a separate test proves the fixtures still match).
check('CYCLE is [0,1,2,3,4,6,7,5] (Aurora then Tempest slotted before Astral)',
  Array.isArray(CYCLE) && CYCLE.length === 8 && [0, 1, 2, 3, 4, 6, 7, 5].every((v, i) => CYCLE[i] === v));
check('BIOMES[6] (Aurora Shallows) is IN the cycle', BIOMES.length === 8 && CYCLE.includes(6));
// Tempest Reach (BIOMES[7]) — THE TEMPEST FLIP landed: now cycled between Aurora and Astral (the
// climactic AURORA → TEMPEST → ASTRAL three-beat; tri-budget-forced off the Mire neighbour).
check('BIOMES[7] (Tempest Reach) is now IN the cycle',
  BIOMES.length === 8 && BIOMES[7].name === 'TEMPEST REACH' && CYCLE.includes(7) && CYCLE.length === 8);
check('the shipped prefix survives: blocks 0-4 are still biomes 0,1,2,3,4', [0, 1, 2, 3, 4].every((b, i) => CYCLE[i] === b));
check('Aurora → Tempest → Astral tail: ...,4,6,7,5', CYCLE[4] === 4 && CYCLE[5] === 6 && CYCLE[6] === 7 && CYCLE[7] === 5);

// biomeAt cycles through CYCLE with period CYCLE.length — reproduce CYCLE[block % N] exactly, and
// biomes 6 + 7 must now BE reachable via the seam (biome 6 at block ≡ 5, biome 7 at block ≡ 6, mod 8).
const L = CONFIG.biomeLength, N = CYCLE.length;
let iaOk = true, ibOk = true, idxOk = true, sixAtRightBlock = true, sixSeen = false, sevenAtRightBlock = true, sevenSeen = false;
for (let dist = 0; dist <= 24 * L; dist += 37) {
  const block = Math.max(0, Math.floor(dist / L));
  const oldIa = CYCLE[block % N], oldIb = CYCLE[(block % N + 1) % N];
  const { ia, ib, t } = biomeAt(dist);
  if (ia !== oldIa) iaOk = false;
  if (ib !== oldIb) ibOk = false;
  if (ia === 6) { sixSeen = true; if (block % N !== 5) sixAtRightBlock = false; }
  if (ia === 7) { sevenSeen = true; if (block % N !== 6) sevenAtRightBlock = false; }
  const idx = biomeIndexAt(dist);
  if (idx !== (t < 0.5 ? oldIa : oldIb)) idxOk = false;
}
check('biomeAt.ia reproduces CYCLE[block % N] over the cycles', iaOk);
check('biomeAt.ib reproduces CYCLE[(block+1) % N]', ibOk);
check('biomeIndexAt is unchanged (picks ia/ib by the seam t)', idxOk);
check('biome 6 IS reachable via biomeAt (the flip took effect)', sixSeen);
check('biome 6 appears exactly at block ≡ 5 (mod 8)', sixAtRightBlock);
check('biome 7 (Tempest) IS reachable via biomeAt (the Tempest flip took effect)', sevenSeen);
check('biome 7 appears exactly at block ≡ 6 (mod 8)', sevenAtRightBlock);

// The seam consumers must route through CYCLE, not `block % BIOMES.length` / `k % N`.
const biomesSrc = read('js/biomes.js'), levelSrc = read('js/level.js');
check('biomeAt indexes through CYCLE (not block % BIOMES.length)',
  /const ci = block % CYCLE\.length/.test(biomesSrc) && /CYCLE\[ci\]/.test(biomesSrc) && !/block % BIOMES\.length/.test(biomesSrc.replace(/\/\/.*$/gm, '')));
check('set-piece biome index routes through CYCLE (the seam the plan caught)',
  /CYCLE\[k % CYCLE\.length\]/.test(levelSrc) && !/biomeIndex: k % N/.test(levelSrc));

console.log(`\nbiomecycle: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
