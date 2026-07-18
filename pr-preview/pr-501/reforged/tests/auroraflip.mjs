// Aurora Shallows PR-4 THE FLIP — boss suppression + foreshadow muting. The aurora is a protected
// DREAM RUN: no boss encounter may start inside it, NOR in the block before it (a fight travels 2-5
// blocks while the player is speed-locked, so a boss one block early is guaranteed to still be raging
// when the curtain rises). `snapBossDist` is module-private, so we replicate its exact math against the
// PUBLIC biomeIndexAt/BIOMES and assert the invariant across three cycles, then source-regex the two
// boss.js guards that no unit test can reach (the trigger + the toll mute).
//   node tests/auroraflip.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
await import('three');
const { biomeIndexAt, BIOMES, CYCLE } = await import('../js/biomes.js');
const { CONFIG } = await import('../js/config.js');

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(DIR, '..', p), 'utf8');
let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };

const L = CONFIG.biomeLength, OFFSET = 900;   // BOSS_BIOME_OFFSET in boss.js
const isAur = (d) => !!BIOMES[biomeIndexAt(d)]?.aurora;
// The un-guarded snap (pre-PR-4), and the guarded snap (with the lookahead-2 while-loop).
const rawSnap = (minDist) => { let d = Math.floor((minDist - OFFSET) / L + 1) * L + OFFSET; if (d < minDist) d += L; return d; };
const snap = (minDist) => { let d = rawSnap(minDist); while (isAur(d) || isAur(d + L)) d += L; return d; };

// Sanity: the flip actually put an aurora block in the cycle, so the guard has something to skip.
check('an aurora block exists in the cycle (else this test is vacuous)',
  CYCLE.some((bi) => BIOMES[bi]?.aurora));

// INVARIANT sweep over 3 full cycles: every scheduled encounter lands clear of the dream + its lead-in.
let inAurora = 0, oneBefore = 0, backward = 0, maxPushBlocks = 0;
for (let minDist = 0; minDist <= 3 * CYCLE.length * L; minDist += 53) {
  const d = snap(minDist);
  if (isAur(d)) inAurora++;                       // never IN the dream
  if (isAur(d + L)) oneBefore++;                  // never the block BEFORE the dream (fights travel forward)
  if (d < rawSnap(minDist)) backward++;           // the guard only ever pushes forward
  maxPushBlocks = Math.max(maxPushBlocks, Math.round((d - rawSnap(minDist)) / L));
}
check('NO encounter snaps inside the aurora block', inAurora === 0);
check('NO encounter snaps into the block before the aurora (lookahead 2)', oneBefore === 0);
check('the guard only pushes encounters FORWARD (never earlier)', backward === 0);
check(`worst-case push is ≤ 2 blocks (measured ${maxPushBlocks})`, maxPushBlocks <= 2);

// The suppression must key on the `aurora` FIELD (survives CYCLE edits / a double-aurora block),
// not a hardcoded index 6, and cover both scheduling paths (both route through snapBossDist).
const bossSrc = read('js/boss.js');
check('isAuroraBlock keys on the aurora field, not index 6',
  /isAuroraBlock\(d\)\s*\{\s*return\s*!!BIOMES\[biomeIndexAt\(d\)\]\?\.aurora/.test(bossSrc));
check('snapBossDist has the lookahead-2 while-loop guard',
  /while\s*\(isAuroraBlock\(d\)\s*\|\|\s*isAuroraBlock\(d\s*\+\s*L\)\)\s*d\s*\+=\s*L/.test(bossSrc));
// The trigger guard closes the canyon-deferral hole (a deferred encounter fires at an arbitrary
// unsnapped distance the moment a canyon ends — it must still refuse to start inside the dream).
check('the encounter TRIGGER also refuses to start inside the aurora (canyon-deferral hole)',
  /player\.dist\s*>=\s*nextBossDist[\s\S]{0,80}!isAuroraBlock\(player\.dist\)/.test(bossSrc));
// The audio foreshadow tolls are MUTED (but marked consumed) while the player is in the dream — a
// funeral bell mid-aurora breaks the spell; the silent horizon seed is kept.
check('foreshadow tolls are muted (marked, not rung) inside the aurora',
  /foreshadowFired\.push\(th\);[\s\S]{0,500}if\s*\(!isAuroraBlock\(player\.dist\)\)\s*bellToll/.test(bossSrc));

console.log(`\nauroraflip: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
