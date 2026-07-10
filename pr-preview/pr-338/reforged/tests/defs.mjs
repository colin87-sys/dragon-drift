// Pure-node validation of the data-driven def tables: ids unique, rewards in
// range, chains acyclic & monotonic, titles resolvable, rungs increasing.
import { assert, assertEq } from './shim.mjs';

const { MISSION_DEFS } = await import('../js/missions.js');
const { FEAT_DEFS } = await import('../js/feats.js');
const { TRIAL_POOL } = await import('../js/weekly.js');
const { MILESTONES, MASTERY_STARS } = await import('../js/milestones.js');
const { TITLES, titleById, levelTitleId } = await import('../js/titles.js');
const { ASCENSION_TIERS } = await import('../js/ascension.js');
const { FLIGHTMARKS } = await import('../js/flightmarks.js');
const { DRAGONS, wispTintFor, lanceRuneFor, WISP_JADE } = await import('../js/dragons.js');
const { BOSSES } = await import('../js/bossDefs.js');

let n = 0;
const ok = (msg) => { n++; console.log(`  ✓ ${msg}`); };

// --- Missions ---
const mids = MISSION_DEFS.map((d) => d.id);
assertEq(new Set(mids).size, mids.length, 'mission ids unique');
ok('mission ids unique');
for (const d of MISSION_DEFS) {
  assert(d.reward >= 80 && d.reward <= 300, `mission ${d.id} reward in [80,300]`);
  assert(d.target > 0, `mission ${d.id} target > 0`);
  if (d.requires) {
    const prev = MISSION_DEFS.find((p) => p.id === d.requires);
    assert(prev, `mission ${d.id} requires ${d.requires} exists`);
    assertEq(prev.next, d.id, `chain link ${prev.id} -> ${d.id} is bidirectional`);
    assert(prev.event === d.event && prev.scope === d.scope, `chain ${d.id} keeps event+scope`);
    assert(d.target > prev.target, `chain ${d.id} target grows`);
    assert(d.reward > prev.reward, `chain ${d.id} reward grows`);
  }
}
ok('mission chains bidirectional, monotonic, same event/scope');
// Chains acyclic + max 3 tiers
for (const d of MISSION_DEFS.filter((d) => !d.requires && d.next)) {
  let cur = d, len = 1;
  const seen = new Set([d.id]);
  while (cur.next) {
    cur = MISSION_DEFS.find((p) => p.id === cur.next);
    assert(cur, 'next def exists');
    assert(!seen.has(cur.id), 'chain acyclic');
    seen.add(cur.id);
    len++;
    assert(len <= 3, 'chains are at most 3 tiers');
  }
}
ok('chains acyclic, ≤3 tiers');
// Always ≥3 drawable defs even if every tiered quest is exhausted
const untiered = MISSION_DEFS.filter((d) => !d.next && !d.requires);
assert(untiered.length >= 3, `≥3 untiered missions remain forever (got ${untiered.length})`);
ok(`${untiered.length} untiered missions rotate forever`);

// --- Feats ---
const fids = FEAT_DEFS.map((d) => d.id);
assertEq(new Set(fids).size, fids.length, 'feat ids unique');
assertEq(FEAT_DEFS.length, 35, 'exactly 35 feats');
for (const d of FEAT_DEFS) {
  assert(d.reward >= 20 && d.reward <= 150, `feat ${d.id} reward in [20,150]`);
  assert(['skill', 'journey', 'collection'].includes(d.cat), `feat ${d.id} category valid`);
  if (d.title) assert(titleById(d.title), `feat ${d.id} title '${d.title}' exists`);
}
ok('35 feats, unique ids, rewards in [20,150], titles resolvable');

// --- Weekly trials ---
const tids = TRIAL_POOL.map((t) => t.id);
assertEq(new Set(tids).size, tids.length, 'trial ids unique');
assert(TRIAL_POOL.length >= 9, 'trial pool ≥ 9');
for (const t of TRIAL_POOL) {
  assert(t.reward >= 300 && t.reward <= 500, `trial ${t.id} reward in [300,500]`);
  assert(titleById(t.title), `trial ${t.id} title exists`);
  assert(typeof t.contrib === 'function', `trial ${t.id} has contrib()`);
  assert(['sum', 'max'].includes(t.mode), `trial ${t.id} mode valid`);
}
ok('trial pool ≥9, rewards in [300,500], titles resolvable');

// --- Milestones ---
for (const m of MILESTONES) {
  let prev = 0;
  for (const [at, reward] of m.rungs) {
    assert(at > prev, `${m.stat} rungs strictly increasing`);
    assert(reward >= 30 && reward <= 150, `${m.stat} rung reward in [30,150]`);
    prev = at;
  }
}
ok('milestone rungs strictly increasing, rewards in [30,150]');
let prevStar = 0;
for (const [at] of MASTERY_STARS) { assert(at > prevStar, 'mastery stars increasing'); prevStar = at; }
ok('mastery stars increasing');

// --- Titles ---
const tIds = TITLES.map((t) => t.id);
assertEq(new Set(tIds).size, tIds.length, 'title ids unique');
for (const t of TITLES) assert(t.name.length <= 16, `title '${t.name}' ≤ 16 chars (share card)`);
assertEq(levelTitleId(5), 'skylark', 'level 5 grants Skylark');
assertEq(levelTitleId(7), null, 'level 7 grants nothing');
ok('titles unique, ≤16 chars, level mapping correct');

// --- Ascension tiers ---
assertEq(ASCENSION_TIERS.length, 3, 'exactly 3 ascension tiers (4 forms incl. base)');
let prevMetres = 0;
for (const t of ASCENSION_TIERS) {
  assert(t.cost > 0, `tier ${t.name} cost > 0`);
  assert(t.metres > prevMetres, `tier ${t.name} metres strictly increasing`);
  prevMetres = t.metres;
}
ok('3 ascension tiers, costs positive, metres increasing');

// --- Flightmarks ---
const fmIds = FLIGHTMARKS.map(m => m.id);
assertEq(new Set(fmIds).size, fmIds.length, 'flightmark ids unique');
for (const m of FLIGHTMARKS) {
  assert(m.cost >= 800, `flightmark ${m.id} cost >= 800`);
  assert(typeof m.trail === 'number', `flightmark ${m.id} has trail color`);
}
ok(`${FLIGHTMARKS.length} flightmarks, unique ids, costs ≥800`);

// --- Dragon evolution forms: starters (SSR) cap at 3, premiums (SSSR) have 4 ---
for (const [key, d] of Object.entries(DRAGONS)) {
  // Asset-backed dragons (a loaded GLB) have a single static form — no
  // procedural ascension geometry, so the form-count contract doesn't apply.
  if (d.assetBacked) {
    assert(typeof d.meshUrl === 'string', `dragon ${key} (asset-backed) has a meshUrl`);
    continue;
  }
  const want = d.maxRarity === 'SSR' ? 3 : 4;
  assert(Array.isArray(d.forms) && d.forms.length === want, `dragon ${key} has ${want} forms`);
  for (let i = 0; i < want; i++) {
    assert(d.forms[i] !== null && typeof d.forms[i] === 'object', `dragon ${key} form ${i} is an object`);
  }
}
ok(`${Object.keys(DRAGONS).length} dragons have expected form counts (3 starter / 4 premium)`);

// --- PR8 Eternal wisp cosmetic: the SSSR roster carries a personal lanceTint +
// lanceRune; every other dragon (SSR starters, asset-backed) carries neither so
// they keep the shipped jade wisp + shared rune. ---
const sssr = Object.entries(DRAGONS).filter(([, d]) => d.maxRarity === 'SSSR' && !d.assetBacked);
assertEq(sssr.length, 9, 'exactly 9 Eternal-capable (SSSR, procedural) dragons');
for (const [key, d] of sssr) {
  assert(typeof d.lanceTint === 'number' && d.lanceTint >= 0 && d.lanceTint <= 0xffffff,
    `dragon ${key} carries a valid lanceTint hex`);
  assert(typeof d.lanceRune === 'string' && d.lanceRune.length > 0,
    `dragon ${key} carries a lanceRune key`);
}
ok('9 SSSR dragons each carry lanceTint (hex) + lanceRune (key)');
const tints = sssr.map(([, d]) => d.lanceTint);
assertEq(new Set(tints).size, tints.length, 'the 9 Eternal wisp tints are all distinct');
ok('Eternal wisp tints are distinct per dragon');
for (const [key, d] of Object.entries(DRAGONS)) {
  if (d.maxRarity === 'SSSR' && !d.assetBacked) continue;
  assert(d.lanceTint === undefined && d.lanceRune === undefined,
    `non-Eternal dragon ${key} carries no lanceTint/lanceRune (keeps jade)`);
}
ok('non-Eternal dragons carry no lanceTint/lanceRune');

// Gating kernel: wispTintFor / lanceRuneFor apply the accent ONLY at formLevel>=3.
const sample = sssr[0][1];
for (const fl of [0, 1, 2]) {
  assertEq(wispTintFor(sample, fl), WISP_JADE, `wispTintFor → jade at form ${fl}`);
  assertEq(lanceRuneFor(sample, fl), null, `lanceRuneFor → null at form ${fl}`);
}
assertEq(wispTintFor(sample, 3), sample.lanceTint, 'wispTintFor → accent at Eternal (form 3)');
assertEq(lanceRuneFor(sample, 3), sample.lanceRune, 'lanceRuneFor → rune at Eternal (form 3)');
// A dragon with no lanceTint stays jade even at form 3 (defensive: SSR can't reach 3).
assertEq(wispTintFor(DRAGONS.azure, 3), WISP_JADE, 'wispTintFor → jade for a dragon with no lanceTint');
assertEq(wispTintFor(null, 3), WISP_JADE, 'wispTintFor → jade for a null def');
ok('wispTintFor/lanceRuneFor gate the accent on formLevel>=3 + a present lanceTint');

// --- Eye-weak-point decouple (A): a boss whose submerged eye seals only ITSELF ---
// (not the whole lock layer) MUST name the paintable organ it seals via `eyeOrgan`,
// and that organ MUST be a real lockPart — else paintableParts() can never drop it
// and the shackles would go dark with the eye again (the exact regression this fixes).
for (const [key, def] of Object.entries(BOSSES)) {
  if (!def.eyeWeakPoint) continue;
  assert(typeof def.eyeOrgan === 'string' && def.eyeOrgan.length > 0,
    `eyeWeakPoint boss ${key} names an eyeOrgan`);
  const parts = (def.lockParts || []).map((lp) => lp.part);
  assert(parts.includes(def.eyeOrgan),
    `${key}.eyeOrgan ('${def.eyeOrgan}') is one of its lockParts`);
}
ok('eyeWeakPoint bosses name an eyeOrgan that is a real lockPart (decouple invariant)');

console.log(`\n${n} def checks passed.`);
