// Creature GPU-load census — dragons AND bosses, ONE counting convention, plus
// the worst-case CO-RESIDENT frame (the dragon and the boss render TOGETHER in a
// boss fight, so the real GPU worst case is their SUM, not either alone).
//
//   node tools/creaturestress.mjs           full census, always exit 0
//   node tools/creaturestress.mjs --ci       exit 1 on a budget breach
//   node tools/creaturestress.mjs --forms    every dragon FORM (not just apex)
//
// WHY THIS EXISTS (LEAPFROG L223/L124):
//   • tricount.mjs counts dragon TRIANGLES only — no draw calls, no overdraw, and
//     with a naive counter that ignores visibility + Points/Lines/InstancedMesh.
//   • tests/boss.mjs already gates bosses on tris + VISIBLE draws per tier band,
//     with the correct counter. This tool reuses THAT counter for BOTH families so
//     dragon and boss numbers are directly comparable, and adds the co-resident sum.
//   • The premium dragon redesign ADDS meshes + transparent layers to pearl/
//     obsidian/solar. Draws already peak on a dragon (pearl 253 > any boss); the
//     axis to WATCH as glow-seams/veins/halos/auras get added is OVERDRAW.
//
// The on-device verdict is already banked (L124/L125, and the tests/boss.mjs §2b
// comment): a real phone held ~58fps at 415 draw calls, hardware instancing JANKED
// (per-frame instanceMatrix upload), and the additive-shell OVERDRAW is the 32fps
// cliff. So headless draw/tri counts are a REGRESSION gate + a design-budget slope;
// absolute fps still comes from a human opening stress.html on a phone via the PR
// preview (headless rAF is throttled ~8x — L105). This tool prints those numbers,
// not fps.

import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);

// DOM/canvas shim (mirrors tests/boss.mjs — the dragon+boss import trees touch a
// lot of canvas/texture API; a permissive Proxy absorbs it, no renderer exists).
const grad = () => ({ addColorStop() {} });
const ctx2d = new Proxy({}, {
  get(_, p) { return (p === 'createRadialGradient' || p === 'createLinearGradient' || p === 'createPattern') ? grad : () => {}; },
  set() { return true; },
});
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, body: { appendChild() {}, classList: { add() {} }, dataset: {} }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, getContext: () => ctx2d, appendChild() {}, setAttribute() {}, addEventListener() {} }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef, maxTierFor } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { buildBoss } = await import('../js/bossModel.js');

const args = process.argv.slice(2);
const ci = args.includes('--ci');
const allForms = args.includes('--forms');

// Boss per-tier ceilings — kept in sync with tests/boss.mjs TIER_BUDGETS.
const TIER_BUDGETS = {
  1: { tris: 6000, draws: 34 }, 2: { tris: 8000, draws: 50 }, 3: { tris: 14000, draws: 70 },
  4: { tris: 22000, draws: 90 }, 5: { tris: 30000, draws: 120 },
};
const DRAGON_TRI_BUDGET = 6000;          // matches tricount.mjs HIGH ceiling
// On-device-proven safe co-resident draw mark (L124: ~58fps @ 415 draws on a real
// phone). A regression gate, not a design target — well above today's peak.
const CORESIDENT_DRAW_CEIL = 415;

// --- counting (the tests/boss.mjs convention, shared for both families) --------
function countTris(root) {
  let t = 0;
  root.traverse((o) => { if (o.geometry) { const g = o.geometry; t += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3; } });
  return Math.round(t);
}
// A drawable counts only if it AND every ancestor is visible (traverse() walks
// hidden subtrees). Points/Lines/InstancedMesh each = one real GPU draw.
function countVisibleDraws(root) {
  let d = 0;
  (function walk(o, pv) { const v = pv && o.visible; if (!v) return; if (o.isMesh || o.isLineSegments || o.isInstancedMesh || o.isPoints) d++; for (const c of o.children) walk(c, v); })(root, true);
  return d;
}
// Overdraw proxy: transparent / additive-blended drawables (the real fps cliff at
// creature scale — L124). Headless can't measure layers-per-pixel; the count is
// the tractable proxy the redesign watches as premium fx get added.
function countOverdraw(root) {
  let n = 0;
  root.traverse((o) => {
    if (!(o.isMesh || o.isPoints)) return;
    if (!o.visible) return;
    const m = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    if (m.some((x) => x && (x.transparent || x.blending === THREE.AdditiveBlending))) n++;
  });
  return n;
}
function dispose(o) { o.traverse((n) => { if (n.geometry) n.geometry.dispose(); const m = n.material; if (Array.isArray(m)) m.forEach((x) => x && x.dispose && x.dispose()); else if (m && m.dispose) m.dispose(); }); }

const PREMIUM = new Set(['pearl', 'obsidian', 'solar']);
const FORM_NAMES = ['Hatchling', 'Kindled', 'Radiant', 'Eternal'];
let breaches = 0;
const note = (b) => { if (b) breaches++; return b ? ' !!' : ''; };

// --- DRAGONS -----------------------------------------------------------------
const dragonRows = [];
for (const key of Object.keys(DRAGONS)) {
  if (DRAGONS[key].meshUrl) continue;   // asset-backed GLB — see tests/glb.mjs
  const maxT = maxTierFor(key);
  const tiers = allForms ? [...Array(maxT + 1).keys()] : [maxT];
  for (const t of tiers) {
    const def = ascendedDef(DRAGONS[key], t, 0);
    try {
      const { group } = buildDragonModel(def, { detail: 'high' });
      dragonRows.push({ key, form: FORM_NAMES[t] || `F${t}`, apex: t === maxT, rarity: DRAGONS[key].rarity, tris: countTris(group), draws: countVisibleDraws(group), over: countOverdraw(group) });
      dispose(group);
    } catch (e) { dragonRows.push({ key, form: FORM_NAMES[t], err: e.message }); }
  }
}

// --- BOSSES (q1, HP bar forced visible — the tests/boss.mjs gate convention) --
const bossRows = [];
for (const key of BOSS_ORDER) {
  const def = BOSSES[key];
  try {
    const m = buildBoss(def, 1);
    if (m.setHealthBarVisible) m.setHealthBarVisible(true);
    const bud = TIER_BUDGETS[def.tier] || TIER_BUDGETS[1];
    bossRows.push({ key, tier: def.tier, tris: countTris(m.group), draws: countVisibleDraws(m.group), over: countOverdraw(m.group), budTris: bud.tris, budDraws: bud.draws });
    if (m.dispose) m.dispose(); else dispose(m.group);
  } catch (e) { bossRows.push({ key, err: e.message }); }
}

// --- report ------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

console.log(`\nDragon Drift — CREATURE GPU census (dragons + bosses; counter = tests/boss.mjs convention)\n`);
console.log(pad('DRAGON', 14) + pad('form', 11) + padL('rarity', 8) + padL('tris', 8) + padL('draws', 7) + padL('overdraw', 10));
dragonRows.sort((a, b) => (b.apex - a.apex) || (b.draws || 0) - (a.draws || 0));
for (const d of dragonRows) {
  if (d.err) { console.log(pad(d.key, 14) + pad(d.form, 11) + '  ERR: ' + d.err); continue; }
  const triBreach = note(d.tris > DRAGON_TRI_BUDGET);
  console.log(pad(d.key, 14) + pad(d.form, 11) + padL(d.rarity, 8) + padL(d.tris, 8) + triBreach + padL(d.draws, 7) + padL(d.over, 10) + (PREMIUM.has(d.key) ? '  *PREMIUM*' : ''));
}

console.log(`\n` + pad('BOSS', 14) + padL('tier', 5) + padL('tris', 8) + padL('/bud', 8) + padL('draws', 7) + padL('/bud', 6) + padL('overdraw', 10));
bossRows.sort((a, b) => (b.tris || 0) - (a.tris || 0));
for (const b of bossRows) {
  if (b.err) { console.log(pad(b.key, 14) + '  ERR: ' + b.err); continue; }
  const triBreach = note(b.tris > b.budTris);
  const drawBreach = note(b.draws > b.budDraws);
  console.log(pad(b.key, 14) + padL(b.tier, 5) + padL(b.tris, 8) + triBreach + padL(b.budTris, 8) + padL(b.draws, 7) + drawBreach + padL(b.budDraws, 6) + padL(b.over, 10));
}

// --- worst-case CO-RESIDENT frame (dragon apex + boss, rendered together) -----
const dApex = dragonRows.filter((d) => d.apex && !d.err);
const bOK = bossRows.filter((b) => !b.err);
const hd = [...dApex].sort((a, b) => b.draws - a.draws)[0];
const hdTri = [...dApex].sort((a, b) => b.tris - a.tris)[0];
const hdOver = [...dApex].sort((a, b) => b.over - a.over)[0];
const hb = [...bOK].sort((a, b) => b.draws - a.draws)[0];
const hbTri = [...bOK].sort((a, b) => b.tris - a.tris)[0];
const hbOver = [...bOK].sort((a, b) => b.over - a.over)[0];
const peakDraws = hd.draws + hb.draws;
const peakTris = hdTri.tris + hbTri.tris;
const peakOver = hdOver.over + hbOver.over;

console.log(`\nWORST-CASE CO-RESIDENT FRAME (a dragon and a boss on screen at once):`);
console.log(`  peak draws    : ${hd.key}(${hd.draws}) + ${hb.key}(${hb.draws}) = ${peakDraws}  [on-device-safe ≤ ${CORESIDENT_DRAW_CEIL}]${note(peakDraws > CORESIDENT_DRAW_CEIL)}`);
console.log(`  peak tris     : ${hdTri.key}(${hdTri.tris}) + ${hbTri.key}(${hbTri.tris}) = ${peakTris}`);
console.log(`  peak overdraw : ${hdOver.key}(${hdOver.over}) + ${hbOver.key}(${hbOver.over}) = ${peakOver} transparent/additive drawables  <-- the fps cliff axis (L124)`);
console.log(`\n  NOTE: overdraw (layers-per-pixel) is the real cliff; the count above is a proxy. For absolute`);
console.log(`  fps, open tools/stress.html on a real phone via the PR preview (headless rAF is throttled ~8x).`);

if (ci) {
  if (breaches > 0) { console.log(`\n✗ creaturestress --ci: ${breaches} budget breach(es)`); process.exit(1); }
  console.log(`\n✓ creaturestress --ci: all creatures within budget; co-resident peak ${peakDraws} draws ≤ ${CORESIDENT_DRAW_CEIL}`);
}
