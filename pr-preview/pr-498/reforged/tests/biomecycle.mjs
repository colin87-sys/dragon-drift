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

// PR-4 THE FLIP: Aurora Shallows (6) is slotted between Lumen Mire (4) and Astral Shallows (5) —
// CYCLE = [0,1,2,3,4,6,5], now 7 long. The shipped PREFIX (blocks 0-4 → biomes 0-4) is preserved;
// the order changes from block 5 on (was Astral, now Aurora → Astral). gold-determinism is untouched
// because course gen is biome-blind (a separate test proves the fixtures still match).
check('CYCLE is [0,1,2,3,4,6,5] (Aurora slotted between Mire and Astral)',
  Array.isArray(CYCLE) && CYCLE.length === 7 && [0, 1, 2, 3, 4, 6, 5].every((v, i) => CYCLE[i] === v));
check('BIOMES[6] (Aurora Shallows) is now IN the cycle', BIOMES.length === 8 && CYCLE.includes(6));
// Tempest Reach (BIOMES[7]) is APPENDED but NOT yet cycled — the coexistence contract: reachable
// only via ?biome=7 until its CYCLE flip lands (coordinated with the Lost Lagoon arc). Adding it must
// not change the shipped world, so CYCLE must still exclude 7 and stay length 7.
check('BIOMES[7] (Tempest Reach) is appended but NOT yet in the cycle',
  BIOMES.length === 8 && BIOMES[7].name === 'TEMPEST REACH' && !CYCLE.includes(7) && CYCLE.length === 7);
check('the shipped prefix survives: blocks 0-4 are still biomes 0,1,2,3,4', [0, 1, 2, 3, 4].every((b, i) => CYCLE[i] === b));
check('Aurora sits between Mire(4) and Astral(5): ...,4,6,5', CYCLE[4] === 4 && CYCLE[5] === 6 && CYCLE[6] === 5);

// biomeAt cycles through CYCLE with period CYCLE.length — reproduce CYCLE[block % N] exactly, and
// biome 6 must now BE reachable via the seam (at block ≡ 5 mod 7).
const L = CONFIG.biomeLength, N = CYCLE.length;
let iaOk = true, ibOk = true, idxOk = true, sixAtRightBlock = true, sixSeen = false;
for (let dist = 0; dist <= 24 * L; dist += 37) {
  const block = Math.max(0, Math.floor(dist / L));
  const oldIa = CYCLE[block % N], oldIb = CYCLE[(block % N + 1) % N];
  const { ia, ib, t } = biomeAt(dist);
  if (ia !== oldIa) iaOk = false;
  if (ib !== oldIb) ibOk = false;
  if (ia === 6) { sixSeen = true; if (block % N !== 5) sixAtRightBlock = false; }
  const idx = biomeIndexAt(dist);
  if (idx !== (t < 0.5 ? oldIa : oldIb)) idxOk = false;
}
check('biomeAt.ia reproduces CYCLE[block % N] over the cycles', iaOk);
check('biomeAt.ib reproduces CYCLE[(block+1) % N]', ibOk);
check('biomeIndexAt is unchanged (picks ia/ib by the seam t)', idxOk);
check('biome 6 IS reachable via biomeAt (the flip took effect)', sixSeen);
check('biome 6 appears exactly at block ≡ 5 (mod 7)', sixAtRightBlock);

// The seam consumers must route through CYCLE, not `block % BIOMES.length` / `k % N`.
const biomesSrc = read('js/biomes.js'), levelSrc = read('js/level.js');
check('biomeAt indexes through CYCLE (not block % BIOMES.length)',
  /const ci = block % CYCLE\.length/.test(biomesSrc) && /CYCLE\[ci\]/.test(biomesSrc) && !/block % BIOMES\.length/.test(biomesSrc.replace(/\/\/.*$/gm, '')));
check('set-piece biome index routes through CYCLE (the seam the plan caught)',
  /CYCLE\[k % CYCLE\.length\]/.test(levelSrc) && !/biomeIndex: k % N/.test(levelSrc));

console.log(`\nbiomecycle: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
