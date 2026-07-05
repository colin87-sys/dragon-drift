// Headless tests for the boss-fight system (the bullet-hell overlay).
// Covers: the data schema (bossDefs), the procedural creature (bossModel — tri
// budget + dissolve), the player-relative bullet pool (dodge / hit / reflect-back
// kinematics), and the full controller lifecycle driven to a kill so the rider-
// chip damage economy is proven to end the fight in bounded time. The HUMAN still
// judges feel (approach, readability, disintegration) on the PR preview.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// DOM/canvas shim so the ui/sfx/dragon dependency tree imports without a renderer.
// A permissive Proxy absorbs every 2D-context call/assignment (the particle and
// texture helpers touch a lot of canvas API); gradients return a stub.
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
const { BOSSES, BOSS_ORDER, bossDefForIndex } = await import('../js/bossDefs.js');
const { buildBoss } = await import('../js/bossModel.js');
const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { on } = await import('../js/events.js');
const { resetCollision } = await import('../js/collision.js');
const bullets = await import('../js/bossBullets.js');
const boss = await import('../js/boss.js');
const { ui } = await import('../js/ui.js');
const { input } = await import('../js/input.js');
const { initParticles } = await import('../js/particles.js');
initParticles({ add() {} });   // the disintegration spawns burst particles

// Silence the HUD callouts (no real DOM elements headless).
ui.bossBanner = () => {};
ui.damageFlash = () => {};
ui.feverStart = () => {};   // surge can now auto-trigger from grazing

// Per-band geometry budgets (BOSS-DESIGN.md §5g/§5h): the flat 6,000/34 gate is
// now keyed off def.tier — tier-1 (Sentinels) keeps the hard 6,000/34; higher
// bands rise so grandeur can be spent in geometry. lowQ contract is RATIOS of
// the band ceiling (q0.5 ≤60% band tris / ≤70% band draws).
const TIER_BUDGETS = {
  1: { tris: 6000, draws: 34 },
  2: { tris: 8000, draws: 50 },
  3: { tris: 14000, draws: 70 },
  4: { tris: 22000, draws: 90 },
  5: { tris: 30000, draws: 120 },
};
const budgetFor = (d) => TIER_BUDGETS[d.tier] || TIER_BUDGETS[1];

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const fakeScene = { add() {}, remove() {} };
const makePlayer = () => ({ position: new THREE.Vector3(0, 8, 0), velocity: new THREE.Vector2(0, 0), dist: 0, rollInvuln: 0 });

// --- 1. bossDefs schema ------------------------------------------------------
for (const key of BOSS_ORDER) {
  const d = BOSSES[key];
  assert(d && d.hpMax > 0, `${key} has positive hp`);
  // Machine-readable tier (§5b/§5g/§5h): required, 1–5, and it drives the budget.
  assert(Number.isInteger(d.tier) && d.tier >= 1 && d.tier <= 5, `${key} declares a valid tier 1–5 (got ${d.tier})`);
  // Defs-lint name budgets (§5h): NAME ≤12, epithet ≤34 (title-card legibility).
  assert((d.name || '').length <= 12, `${key} name ≤12 chars ("${d.name}")`);
  assert((d.epithet || '').length <= 34, `${key} epithet ≤34 chars ("${d.epithet}")`);
  // Phase count is band-scaled (§5g move-set richness): Sentinels/Colossi hold
  // the original 3-surge vision; Calamities+ may carry 4–5 carded phases (the
  // band contract's "4–5 cards"). One shield per phase stays the invariant —
  // phase count IS the §5h scaling knob.
  if (d.tier <= 2) assertEq(d.phases.length, 3, `${key} has 3 phases (the vision: ~3 surges to kill)`);
  else assert(d.phases.length >= 3 && d.phases.length <= 5, `${key} (tier ${d.tier}) has 3–5 phases (got ${d.phases.length})`);
  let prev = Infinity;
  for (const ph of d.phases) {
    assert(ph.atFrac <= prev, `${key} phase atFrac is descending`);
    prev = ph.atFrac;
    assert(Array.isArray(ph.attacks) && ph.attacks.length > 0, `${key} phase has attacks`);
    for (const a of ph.attacks) assert(['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream',
      'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire'].includes(a), `${key} attack '${a}' is known`);
    assert(ph.cadence[0] > 0 && ph.cadence[1] >= ph.cadence[0], `${key} cadence is a valid range`);
  }
  // Spell cards (§5f/§5h): optional (coexist rule), but if present they must
  // align 1:1 with phases, carry stable ids + a timer + an atFrac matching the
  // phase, name within the card-line budget, and EXACTLY ONE dread card, last.
  if (d.cards) {
    assertEq(d.cards.length, d.phases.length, `${key} has one card per phase`);
    const ids = new Set();
    let dread = 0, lastDread = false;
    d.cards.forEach((c, i) => {
      assert(c.id && !ids.has(c.id), `${key} card ${i} has a unique stable id ('${c.id}')`);
      ids.add(c.id);
      assert(c.name && c.name.length <= 44, `${key} card ${i} name within budget ("${c.name}")`);
      assert(c.name.includes(' — '), `${key} card ${i} follows the "<FRAGMENT> — <pattern>" grammar ("${c.name}")`);
      assert(c.timer > 0, `${key} card ${i} has a positive timer`);
      assertEq(c.atFrac, d.phases[i].atFrac, `${key} card ${i} atFrac matches its phase`);
      if (c.dread) { dread++; lastDread = (i === d.cards.length - 1); }
    });
    assertEq(dread, 1, `${key} has exactly one dread card`);
    assert(lastDread, `${key} dread card is the LAST card`);
  }
}
assertEq(bossDefForIndex(0).id, BOSS_ORDER[0], 'bossDefForIndex(0) → first boss');
assertEq(bossDefForIndex(BOSS_ORDER.length).id, BOSS_ORDER[0], 'bossDefForIndex wraps the list');
ok(`bossDefs schema valid for ${BOSS_ORDER.length} boss(es), all 3-phase`);

// --- 1c. §5h LIFETIME LADDER (the band-aware controller, lands with slot 6) --
{
  const { ladderPickDef, ladderTighten } = await import('../js/bossDefs.js');
  const kills = (map) => (id) => map[id] || 0;
  // Fresh save: the run opens at slot 1.
  assertEq(ladderPickDef(new Set(), kills({})).id, BOSS_ORDER[0], 'ladder: fresh save opens at slot 1');
  // Lifetime progress: first boss = lowest UNBEATEN slot.
  const prog = { [BOSS_ORDER[0]]: 3, [BOSS_ORDER[1]]: 1 };
  assertEq(ladderPickDef(new Set(), kills(prog)).id, BOSS_ORDER[2], 'ladder: run opens at the lowest lifetime-unbeaten slot');
  // Felled-this-run never repeats: the ladder walks UP past it.
  const felled = new Set([BOSS_ORDER[2]]);
  assertEq(ladderPickDef(felled, kills(prog), 2).id, BOSS_ORDER[3], 'ladder: a felled slot never repeats within the run');
  // Wrap past the top brings BEATEN slots back (they recur).
  const highFelled = new Set(BOSS_ORDER.slice(2));
  assertEq(ladderPickDef(highFelled, kills(prog), 2).id, BOSS_ORDER[0], 'ladder: wrapping past the top recurs the beaten low slots');
  // Full lap → the exclusion resets (an endless run out-lives the roster).
  const all = new Set(BOSS_ORDER);
  assertEq(ladderPickDef(all, kills(prog), 2).id, BOSS_ORDER[2], 'ladder: a full lap resets the exclusion');
  // Tighten: 1 for a first-time slot; shrinks with kills; floors at 0.78.
  assertEq(ladderTighten(0), 1, 'tighten: first encounter is untightened (coexist floor)');
  assert(ladderTighten(1) < 1 && ladderTighten(1) > 0.9, 'tighten: one kill bites gently');
  assert(ladderTighten(99) >= 0.78, `tighten: floors at 0.78 (got ${ladderTighten(99)})`);
  ok('lifetime ladder: entry rung, no-repeat, wrap-recur, lap-reset, tighten floor');
}

// --- 1b. §5i RHYTHM gates: `rhythmprint` (every boss owns a DISTINCT temporal
// fingerprint — the ping-pong is retired) + `amberdiet` (the AMBER FLOOR holds:
// a parry-carrier volley lands in every rolling 12s window of every phase). Both
// simulate the pure phrase machine (bossRhythm.js) headlessly — variance as CI. --
{
  const { simulatePhase, hasAmberCarrier } = await import('../js/bossRhythm.js');
  // seeded rng so the sim is deterministic in CI (no flake across runs)
  const seeded = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  // two-sample Kolmogorov–Smirnov distance between rest-gap samples
  const ks = (a, b) => {
    const A = [...a].sort((x, y) => x - y), B = [...b].sort((x, y) => x - y);
    const F = (s, x) => { let lo = 0, hi = s.length; while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] <= x) lo = m + 1; else hi = m; } return lo / s.length; };
    let d = 0; for (const x of [...A, ...B]) d = Math.max(d, Math.abs(F(A, x) - F(B, x))); return d;
  };
  const KS_FLOOR = 0.20;   // any two bosses' gap distributions differ by at least this
  const rests = {};
  for (const key of BOSS_ORDER) {
    const def = BOSSES[key];
    assert(def.rhythm && typeof def.rhythm.signature === 'string',
      `${key} declares a §5i rhythm signature (the ping-pong fix lands with slot 5)`);
    rests[key] = [];
    def.phases.forEach((ph, pi) => {
      // amberdiet: the phase must be ABLE to serve an amber volley (design), and
      // the machine's amber floor must keep the fire-to-fire gap ≤12s (behaviour).
      assert(hasAmberCarrier(ph.attacks),
        `${key} P${pi + 1}: phase can serve an amber volley (AMBER FLOOR, §5i C.1) [${ph.attacks.join(',')}]`);
      const sim = simulatePhase(def, pi, ph.attacks, 60, seeded(9001 + idxKey(key) * 131 + pi * 13));
      rests[key].push(...sim.rests);
      const fires = [0, ...sim.amberFires, sim.endT];
      let maxGap = 0; for (let i = 1; i < fires.length; i++) maxGap = Math.max(maxGap, fires[i] - fires[i - 1]);
      assert(maxGap <= 12, `${key} P${pi + 1}: an amber volley every ≤12s (maxGap ${maxGap.toFixed(1)}s — amberdiet)`);
    });
    ok(`${key} amberdiet: every phase serves amber within 12s (${def.rhythm.signature})`);
  }
  // rhythmprint: pairwise-distinct aggregate distributions (KS floor).
  let minKS = 1, minPair = '';
  for (let i = 0; i < BOSS_ORDER.length; i++) {
    for (let j = i + 1; j < BOSS_ORDER.length; j++) {
      const a = BOSS_ORDER[i], b = BOSS_ORDER[j];
      const d = ks(rests[a], rests[b]);
      if (d < minKS) { minKS = d; minPair = `${a}/${b}`; }
      assert(d >= KS_FLOOR,
        `rhythmprint: ${a} (${BOSSES[a].rhythm.signature}) vs ${b} (${BOSSES[b].rhythm.signature}) gap distributions differ (KS ${d.toFixed(2)} ≥ ${KS_FLOOR})`);
    }
  }
  ok(`rhythmprint: ${BOSS_ORDER.length} bosses have distinct rhythm fingerprints (min KS ${minKS.toFixed(2)} @ ${minPair})`);
}
function idxKey(k) { return BOSS_ORDER.indexOf(k); }

// --- 2. bossModel: tri budget + dissolve (every boss in the roster) ---------
for (const key of BOSS_ORDER) {
  const model = buildBoss(BOSSES[key], 1);
  let tris = 0;
  model.group.traverse((o) => { if (o.geometry) { const g = o.geometry; tris += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3; } });
  tris = Math.round(tris);
  const bud = budgetFor(BOSSES[key]);
  assert(tris > 0 && tris < bud.tris, `${key} model tris ${tris} within the tier-${BOSSES[key].tier} budget (<${bud.tris})`);
  assert(model.muzzle && model.orbiters.length >= 2, `${key} model exposes a muzzle node + orbiters`);
  // Dissolve fully fades every material's opacity toward zero.
  model.setDissolve(1);
  let maxOp = 0;
  model.group.traverse((o) => { if (o.material) maxOp = Math.max(maxOp, o.material.opacity); });
  assert(maxOp < 0.02, `${key} setDissolve(1) drives all materials transparent (max opacity ${maxOp.toFixed(3)})`);
  model.setDissolve(0);
  let restored = 0;
  model.group.traverse((o) => { if (o.material) restored = Math.max(restored, o.material.opacity); });
  assert(restored > 0.5, `${key} setDissolve(0) restores opacity`);
  // tick() animates the orbiters and never throws.
  const o0 = model.orbiters[0].position.clone();
  model.tick(0.2, 1.0);
  assert(model.orbiters[0].position.distanceTo(o0) > 0, `${key} model.tick advances the orbiters`);
  model.dispose();
  ok(`${key} model: ${tris} tris, dissolve + tick verified`);
}

// --- 2b. archetype system: quality scaling, userData tag, draw-call budget,
// telegraph silhouette change, and the legacy-fallback coexist path (CP4) ---
// Guards the specific failure modes bossKit.js/bossIdol.js/bossMandala.js
// introduced: a def that forgets `archetype` silently rendering the OLD
// crystal-core boss, a telegraph that only changes colour (not shape), and a
// draw-call regression that quietly bloats past the mobile budget.
// Same counting convention as section 2 above (`if (o.geometry)`, not
// isMesh-gated) so the numbers this section prints are directly comparable.
function countTris(root) {
  let tris = 0;
  root.traverse((o) => { if (o.geometry) { const g = o.geometry; tris += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3; } });
  return Math.round(tris);
}
// Effectively-visible drawables: a mesh/line/instanced-mesh only counts if IT
// and every ancestor up to the root is visible — three.js's traverse() walks
// hidden subtrees too, so a naive isMesh count would over-count the shield
// bubble (hidden at rest) and the shatter shards (hidden until a burst).
function countVisibleDraws(root) {
  let draws = 0;
  (function walk(o, parentVisible) {
    const vis = parentVisible && o.visible;
    if (!vis) return;
    if (o.isMesh || o.isLineSegments || o.isInstancedMesh) draws++;
    for (const c of o.children) walk(c, vis);
  })(root, true);
  return draws;
}
function findAllByName(root, name) {
  const out = [];
  root.traverse((o) => { if (o.name === name) out.push(o); });
  return out;
}

// Measured @q1 (HP bar forced visible): voidmaw 17 draws (13 body + 4 HP
// bar), stormrend 22 draws (18 body + 4 HP bar) — the mandala's 8 iris
// petals are individual pivot meshes, not one InstancedMesh (bossMandala.js's
// header comment: a deliberate CP3 tradeoff for simpler dissolve/tracking,
// and the CP0 stress test found draws this small are noise on the slope, not
// the cliff). The on-device follow-up sealed it: a real phone held ~58fps at
// 415 draw calls (and instancing actually JANKED — 36.8fps with p95 spikes
// from the per-frame instanceMatrix upload), so draw count at boss scale is
// simply not the budget axis; additive-shell OVERDRAW is (32fps cliff on the
// same phone). 34 still gates runaway part explosions without taxing
// deliberate design (the design pass added gilt/tip/storm-arc draws; the
// shareability pass added the living-eye rig — pupils, storm lids, vein
// lines, brow pivots — worth every one of its ~4 extra draws per boss).
// Draw budget is now per-band (TIER_BUDGETS): tier-1 Sentinels keep the hard 34
// (measured @q1, HP bar forced visible: voidmaw 17, stormrend 22 — the mandala's
// 8 iris petals are individual pivot meshes, not one InstancedMesh, a deliberate
// tradeoff; a real phone held ~58fps at 415 draws and instancing JANKED, so draw
// count at boss scale isn't the budget axis — additive-shell OVERDRAW is). Higher
// bands rise so a richer Colossus/Calamity can spend draws on organs, not shells.
for (const key of BOSS_ORDER) {
  const def = BOSSES[key];
  const bud = budgetFor(def);
  const q1 = buildBoss(def, 1);
  const q05 = buildBoss(def, 0.5);
  const tris1 = countTris(q1.group);
  const tris05 = countTris(q05.group);
  assert(tris05 > 0 && tris05 < tris1 && tris1 < bud.tris,
    `${key} quality scaling: tris(q0.5)=${tris05} < tris(q1)=${tris1} < ${bud.tris} (tier ${def.tier})`);
  // lowQ contract as a RATIO of the band ceiling (§5h): q0.5 ≤60% band tris.
  assert(tris05 <= bud.tris * 0.60, `${key} lowQ tris ${tris05} ≤ 60% of the tier-${def.tier} ceiling (${Math.round(bud.tris * 0.6)})`);
  assertEq(q1.group.userData.archetype, def.archetype,
    `${key} model.group.userData.archetype matches the def ('${def.archetype}') — guards silent legacy fallback`);

  q1.setHealthBarVisible(true);   // hidden during fly-in by default; force it on for the gate
  const draws = countVisibleDraws(q1.group);
  assert(draws > 0 && draws <= bud.draws, `${key} visible draw calls ${draws} within the tier-${def.tier} ≤${bud.draws} gate`);

  q1.dispose(); q05.dispose();
  ok(`${key} archetype checks: tris ${tris05}→${tris1}, archetype '${def.archetype}', ${draws} visible draws (tier ${def.tier})`);
}

// Telegraph-silhouette gate: setCharge(1) + tick must move a SHAPE (a pivot
// rotation), not just recolour a material — the design law both archetypes
// are built on. jawPivot/irisPetal names are set by the builders specifically
// so this gate (and any future tool) can find them without hardcoding indices.
{
  const idol = buildBoss(BOSSES.voidmaw, 1);
  const jaw = findAllByName(idol.group, 'jawPivot')[0];
  assert(jaw, 'voidmaw exposes a named jawPivot for the telegraph gate');
  idol.tick(0.05, 0.5);   // settle the idle pose before snapshotting
  const preJawX = jaw.rotation.x;
  idol.setCharge(1);
  idol.tick(0.1, 1.0);
  assert(jaw.rotation.x < -0.3,
    `voidmaw jaw pivot hinges open on charge (rotation.x ${jaw.rotation.x.toFixed(3)}, was ${preJawX.toFixed(3)})`);
  idol.dispose();
  ok('voidmaw telegraph: setCharge(1) hinges the jaw pivot open (silhouette change)');
}
{
  const mandala = buildBoss(BOSSES.stormrend, 1);
  const petals = findAllByName(mandala.group, 'irisPetal');
  assert(petals.length >= 2, 'stormrend exposes named irisPetal meshes for the telegraph gate');
  mandala.tick(0.05, 0.5);   // settle the idle pose before snapshotting
  const preAngles = petals.map((p) => p.rotation.y);
  mandala.setCharge(1);
  mandala.tick(0.1, 1.0);
  const changed = petals.some((p, i) => Math.abs(p.rotation.y - preAngles[i]) > 0.01);
  assert(changed, 'stormrend iris petal angles change on charge (silhouette change)');
  mandala.dispose();
  ok('stormrend telegraph: setCharge(1) flares the iris petals open (silhouette change)');
}
{
  const colossus = buildBoss(BOSSES.craghold, 1);
  const fingers = findAllByName(colossus.group, 'fingerPivot');
  assert(fingers.length >= 6, `craghold exposes ≥6 named fingerPivots for the telegraph gate (${fingers.length})`);
  for (const side of ['handPivotL', 'handPivotR']) {
    assert(findAllByName(colossus.group, side).length === 1, `craghold exposes exactly one ${side}`);
  }
  // Settle the idle pose, snapshot, then charge: the default (no attack-tell)
  // wind-up is the CLENCH — hands rise and the digit slabs curl hard. The gate
  // asserts the SHAPE moved (≥4 digits by >0.25 rad), not a colour.
  for (let i = 0; i < 40; i++) colossus.tick(0.05, i * 0.05);
  const preCurl = fingers.map((f) => f.rotation.x);
  colossus.setCharge(1);
  for (let i = 0; i < 20; i++) colossus.tick(0.05, 2 + i * 0.05);
  const moved = fingers.filter((f, i) => Math.abs(f.rotation.x - preCurl[i]) > 0.25).length;
  assert(moved >= 4, `craghold clench: ${moved} fingerPivots moved >0.25 rad on charge (need ≥4 — silhouette change)`);
  colossus.dispose();
  ok('craghold telegraph: setCharge(1) clenches the gesture hands (silhouette change)');
}
{
  const hunter = buildBoss(BOSSES.ashtalon, 1);
  for (const side of ['wingPivotL', 'wingPivotR']) {
    assert(findAllByName(hunter.group, side).length === 1, `ashtalon exposes exactly one ${side}`);
  }
  const blades = findAllByName(hunter.group, 'bladePivot');
  assert(blades.length >= 12, `ashtalon exposes ≥12 named bladePivots for the telegraph gate (${blades.length})`);
  const shoulders = ['wingPivotL', 'wingPivotR'].map((s) => findAllByName(hunter.group, s)[0]);
  // Settle the idle beat, snapshot, then charge: the default (no attack-tell)
  // wind-up is the MANTLE — both wings raise up-forward + the fan narrows. The
  // gate asserts the SHAPE moved (shoulders rotate AND blades re-fan), not colour.
  for (let i = 0; i < 40; i++) hunter.tick(0.05, i * 0.05);
  const preShoulder = shoulders.map((s) => s.rotation.z);
  const preFan = blades.map((b) => b.rotation.z);
  hunter.setCharge(1);
  for (let i = 0; i < 30; i++) hunter.tick(0.05, 2 + i * 0.05);
  const shoulderMoved = shoulders.filter((s, i) => Math.abs(s.rotation.z - preShoulder[i]) > 0.1).length;
  const fanMoved = blades.filter((b, i) => Math.abs(b.rotation.z - preFan[i]) > 0.05).length;
  assert(shoulderMoved === 2, `ashtalon mantle: both wing shoulders rotated on charge (${shoulderMoved}/2)`);
  assert(fanMoved >= 8, `ashtalon mantle: ${fanMoved} blade pivots re-fanned on charge (need ≥8 — silhouette change)`);
  hunter.dispose();
  ok('ashtalon telegraph: setCharge(1) mantles the scythe-wings (silhouette change)');
}

// MARROWCOIL (slot 4) — the telegraph gate + the §5d/§7b per-sheet geometry
// asserts the build sheet declares: ribcage thread clearance, vertebra pitch >
// width (separate bones, not a sausage), and the coil-sweep lateral amplitude.
{
  const coil = buildBoss(BOSSES.marrowcoil, 1);
  // Telegraph: setCharge(1) hinges the jaw open (silhouette change, like voidmaw).
  const jaw = findAllByName(coil.group, 'jawPivot')[0];
  assert(jaw, 'marrowcoil exposes a named jawPivot for the telegraph gate');
  for (let i = 0; i < 30; i++) coil.tick(0.05, i * 0.05);   // settle the coil + idle
  const preJaw = jaw.rotation.x;
  coil.setCharge(1);
  for (let i = 0; i < 20; i++) coil.tick(0.05, 2 + i * 0.05);
  assert(jaw.rotation.x < -0.3, `marrowcoil jaw hinges open on charge (rotation.x ${jaw.rotation.x.toFixed(3)}, was ${preJaw.toFixed(3)})`);
  coil.setCharge(0);

  // Named per-rib root pivots (5 pairs, L/R) — the dread telegraph hinges these.
  const ribs = [];
  coil.group.traverse((o) => { if (/^ribPivot[LR][0-4]$/.test(o.name)) ribs.push(o); });
  assert(ribs.length === 10, `marrowcoil exposes 10 named ribPivotL/R0-4 for the ribcage (${ribs.length})`);

  // §7b assert 1 — RIBCAGE THREAD CLEARANCE ≥ 4.5 units at the tightest hoop, at
  // closed REST (setSetpiece 0). Measure the aperture from the actual arc
  // geometry: the inner clearance = 2× the min in-plane radius of the rib arcs
  // (the tube's inner surface). Only the long ARC meshes count (>30 verts) — not
  // the small dark rib-root knuckles that sit dorsal/ventral off the aperture.
  for (let i = 0; i < 5; i++) coil.tick(0.05, i * 0.05);   // rest pose, no setpiece
  let tightest = Infinity;
  for (let ring = 0; ring < 5; ring++) {
    const pair = ribs.filter((r) => r.name.endsWith(String(ring)));
    // Ring centre (host-vertebra space): roots sit at ±cos(84°)·R with the ring
    // centre 0.97R below the crown — recover R from the root spread, then the
    // centre, then measure the min in-plane radial distance of every rib vertex.
    const [a, b] = pair;
    const Rr = Math.abs(a.position.x - b.position.x) / (2 * Math.cos(Math.PI * 84 / 180));
    const cy = a.position.y - Math.sin(Math.PI * 84 / 180) * Rr;
    let minR = Infinity;
    for (const rp of pair) {
      rp.traverse((o) => {
        if (!o.geometry || !o.geometry.attributes.position) return;
        const p = o.geometry.attributes.position;
        if (p.count < 30) return;
        for (let v = 0; v < p.count; v++) {
          const wx = p.getX(v) + rp.position.x, wy = p.getY(v) + rp.position.y;
          const r = Math.hypot(wx, wy - cy);
          if (r < minR) minR = r;
        }
      });
    }
    tightest = Math.min(tightest, 2 * minR);
  }
  assert(tightest >= 4.5, `marrowcoil ribcage thread clearance ${tightest.toFixed(2)} ≥ 4.5 at the tightest closed-rest hoop`);

  // §7b assert 3 — the DREAD telegraph: setSetpiece (Closing Ribs) constricts the
  // hoops (an aperture SHAPE change, not colour). closingRibs mode = default.
  const preRot = ribs.map((r) => r.rotation.z);
  coil.setSetpiece(1.0, { id: 'closingRibs' });
  for (let i = 0; i < 30; i++) coil.tick(0.05, 3 + i * 0.05);
  const constricted = ribs.filter((r, i) => Math.abs(r.rotation.z - preRot[i]) > 0.44).length;
  assert(constricted >= 6, `marrowcoil Closing Ribs hinges the pairs inward (${constricted}/10 pivots rotated >=25° — the aperture visibly closes)`);
  coil.setSetpiece(0, { id: 'closingRibs' });

  // §7b assert 2 — VERTEBRA PITCH > WIDTH per adjacent pair: the 16 segments must
  // read as separate bones with visible gaps (the anti-SAUSAGE law). Pitch =
  // centre spacing along the chain; width = each bone's extent along the chain
  // axis (its geometry y-size — meshes orient local y to the curve tangent).
  // Spacing is size-proportional (big neck bones take more arc than tail tips),
  // so the law is per-PAIR: every pitch must exceed the larger neighbour's width.
  for (let i = 0; i < 10; i++) coil.tick(0.05, i * 0.05);   // rest
  const verts = findAllByName(coil.group, 'vertebra');
  assert(verts.length === 16, `marrowcoil exposes 16 named vertebrae (${verts.length})`);
  const centres = verts.map((m) => m.parent.position.clone());
  const widths = verts.map((m) => { m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; return bb.max.y - bb.min.y; });
  let minRatio = Infinity;
  for (let i = 1; i < verts.length; i++) {
    const pitch = centres[i].distanceTo(centres[i - 1]);
    const w = Math.max(widths[i], widths[i - 1]);
    minRatio = Math.min(minRatio, pitch / w);
  }
  // ≥0.78: the chain is deliberately WELDED (design-gate r6: bone faces ~0.1
  // apart, separation carried by the dark seam discs, zero sky gaps) — bones lap
  // INTO the seam disc at hard bends where chord pitch under-runs arc length.
  // Below ~0.78 a bone is genuinely swallowed (the sausage failure).
  assert(minRatio >= 0.45, `marrowcoil vertebra pitch/width ${minRatio.toFixed(2)} >= 0.45 for every pair (design-gate r9: bones OVERLAP ~20% into the seam rings — a welded column, not floating segments)`);

  // §7b assert 4 — COIL SWEEP amplitude ≥ 3 units laterally in one period. Tick
  // over one coil period (~5.5s) and measure a mid vertebra's lateral (local x)
  // travel — the traveling-sine coil must move the chain, not sit static.
  // Sample a NECK vertebra: the sweep amplitude is noded at the ribcage (the
  // fly-through tunnel must stay coherent) and carried by the neck + tail coils.
  const midNode = verts[3].parent;
  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < 130; i++) { coil.tick(0.05, 100 + i * 0.05); minX = Math.min(minX, midNode.position.x); maxX = Math.max(maxX, midNode.position.x); }
  const sweep = maxX - minX;
  assert(sweep >= 3, `marrowcoil coil sweep moves the chain ${sweep.toFixed(2)} units laterally in one period (≥3)`);

  coil.dispose();
  ok(`marrowcoil geometry: clearance ${tightest.toFixed(1)}, pitch/width ${minRatio.toFixed(2)}, coil sweep ${sweep.toFixed(1)}, jaw+ribs telegraph`);
}

// EITHERWING (slot 5) — the telegraph gate + the §5d/§7b per-sheet geometry asserts
// the build sheet declares: twin-value asymmetry (the eyeless twin measurably
// darker), ribbon pivot LAG > 0 (the tails FLOW, not stick), eye-thread length > 0
// at every orbit phase, and a handoff that moves the eye ≥ the twin separation.
{
  const tw = buildBoss(BOSSES.eitherwing, 1);

  // Named anatomy the telegraph/design gates + the studio locate by name.
  assert(findAllByName(tw.group, 'eitherTwinA').length === 1 && findAllByName(tw.group, 'eitherTwinB').length === 1,
    'eitherwing exposes both named twins (eitherTwinA/B)');
  assert(!!tw.group.getObjectByName('eyeRig'), 'eitherwing exposes the named eyeRig (the shared eye)');
  assert(!!tw.group.getObjectByName('eyeThread'), 'eitherwing exposes the named eyeThread (the beaded strand)');
  assert(!!tw.group.getObjectByName('eitherScar'), 'eitherwing exposes the ONE asymmetric scar (the snapped ribbon)');
  const ribbons = findAllByName(tw.group, 'ribbonPivot');
  assert(ribbons.length >= 12, `eitherwing exposes ≥12 named ribbonPivots for the flowing tails (${ribbons.length})`);

  // TELEGRAPH (§3.5): setCharge flares the ribbons + fins and glides the eye — the
  // SILHOUETTE must change, not just colour. Assert the ribbon pivots re-fan.
  for (let i = 0; i < 12; i++) tw.tick(0.05, i * 0.05);   // settle idle
  const preRib = ribbons.map((r) => r.rotation.z);
  tw.setCharge(1); tw.setAttackTell('crossfire');
  for (let i = 0; i < 16; i++) tw.tick(0.05, 1 + i * 0.05);
  const ribMoved = ribbons.filter((r, i) => Math.abs(r.rotation.z - preRib[i]) > 0.03).length;
  assert(ribMoved >= 6, `eitherwing telegraph: ${ribMoved} ribbon pivots flared on charge (need ≥6 — silhouette change)`);
  tw.setCharge(0);

  // §7b assert 1 — TWIN VALUE: the eyeless twin is measurably darker. Pin the eye to
  // twin A (A holds) → twin B is the seeker and must read a value step darker.
  tw.setDebugHandoff(0);
  for (let i = 0; i < 24; i++) tw.tick(0.05, 20 + i * 0.05);
  const lum = tw.twinBodyLum();
  assert(lum.A - lum.B > 0.03,
    `eitherwing twin value: the eyeless (seeker) twin is measurably darker (holder ${lum.A.toFixed(3)} vs seeker ${lum.B.toFixed(3)})`);

  // §7b assert 2 — RIBBON LAG > 0: the tails must FLOW, not move as a rigid slab. A
  // travelling wave with per-segment ease means, at any instant, the segments sit at
  // DIFFERENT sway angles (spread > 0) — and they actively animate over time.
  tw.setDebugHandoff(null);
  let sA = ribbons.map((r) => r.rotation.z);
  const spreadA = Math.max(...sA) - Math.min(...sA);
  for (let i = 0; i < 20; i++) tw.tick(0.05, 30 + i * 0.05);
  let sB = ribbons.map((r) => r.rotation.z);
  const moved = ribbons.filter((r, i) => Math.abs(sB[i] - sA[i]) > 0.005).length;
  assert(spreadA > 0.02, `eitherwing ribbon lag: the segments sit at different sway angles (spread ${spreadA.toFixed(3)} — a flowing chain, not a rigid slab)`);
  assert(moved >= 6, `eitherwing ribbon lag: ${moved} ribbon pivots animate over time (the tails flow)`);

  // §7b assert 3 — EYE-THREAD LENGTH > 0 at EVERY orbit phase: the twins never
  // collide (the figure-eight node is depth-offset), so the eye always has a thread.
  let minThread = Infinity, minSep = Infinity;
  for (let i = 0; i < 200; i++) { tw.tick(0.05, 40 + i * 0.05); minThread = Math.min(minThread, tw.threadLength()); minSep = Math.min(minSep, tw.twinSeparation()); }
  assert(minThread > 0.5 && minSep > 0.5,
    `eitherwing eye-thread length ${minThread.toFixed(2)} and twin separation ${minSep.toFixed(2)} stay > 0 at every orbit phase`);

  // §7b assert 4 — HANDOFF TRAVEL: the eye physically DETACHES and crosses the full
  // thread from one socket to the other (not a nudge). The darts face the ember with
  // their noses inward, so the eye seats on the inward SOCKETS — its journey is the
  // socket-to-socket THREAD span (the meaningful separation the eye crosses), which
  // it must traverse in full, and it must be a real glide (> 1.5 units).
  tw.setDebugHandoff(0); for (let i = 0; i < 14; i++) tw.tick(0.05, 80 + i * 0.05);
  const eye0 = tw.eyeWorldLocalPos().clone();
  tw.setDebugHandoff(1); for (let i = 0; i < 14; i++) tw.tick(0.05, 80.7 + i * 0.05);
  const eye1 = tw.eyeWorldLocalPos().clone();
  const threadAt = tw.threadLength();
  const travel = eye0.distanceTo(eye1);
  assert(travel >= threadAt * 0.7 && travel > 1.5,
    `eitherwing handoff: the eye travels ${travel.toFixed(2)} across the full thread span ${threadAt.toFixed(2)} (it detaches and glides, not a nudge)`);

  tw.dispose();
  ok(`eitherwing geometry: twin ΔL ${(lum.A - lum.B).toFixed(2)}, ribbon spread ${spreadA.toFixed(2)}, thread≥${minThread.toFixed(1)}, handoff ${travel.toFixed(1)}/thread ${threadAt.toFixed(1)}, ${ribMoved} ribbons telegraph`);
}

// HOLLOWGATE (slot 6) — the telegraph gate + the §5d/§7b per-sheet geometry
// asserts (the ruined-arch Calamity opener: fly-through gap ≥9, portcullis
// telegraph on a named pivot, the 8-pane expression rig, the discrete pupil).
{
  const hg = buildBoss(BOSSES.hollowgate, 1);

  // Named anatomy the telegraph/design gates + the studio locate by name.
  const pivot = hg.group.getObjectByName('portcullisPivot');
  assert(!!pivot, 'hollowgate exposes a named portcullisPivot for the telegraph gate');
  assert(!!hg.group.getObjectByName('roseHub'), 'hollowgate exposes the named roseHub (the focal + def.muzzle organ)');
  assert(!!hg.group.getObjectByName('scarShard'), 'hollowgate exposes the ONE asymmetric scar (the orphan voussoir shard)');
  for (let i = 0; i < 8; i++) assert(!!hg.group.getObjectByName(`rosePane${i}`), `hollowgate exposes named rosePane${i}`);

  // §5d sheet law — the FLY-THROUGH GAP: ≥9 world units wide (the rail flies
  // through the arch every pass; L141 — the pass must genuinely enclose the rail).
  const gapW = hg.archGapWidth();
  assert(gapW >= 9, `hollowgate arch gap ${gapW.toFixed(1)} ≥ 9 world units (the fly-through law)`);
  const span = hg.archGapSpan();
  assert(span.hi - span.lo >= 12, `hollowgate arch gap vertical span ${(span.hi - span.lo).toFixed(1)} ≥ 12 (clears the rail height band)`);

  // TELEGRAPH (§3.5, the named-pivot gate): setCharge(1) DESCENDS the portcullis
  // into the gap — a shape change in the void, not a colour change.
  hg.tick(0.016, 0.5);
  const y0 = pivot.position.y;
  hg.setCharge(1);
  hg.setAttackTell('curtain');
  for (let i = 0; i < 90; i++) hg.tick(0.016, 1 + i * 0.016);
  const dropped = y0 - pivot.position.y;
  assert(dropped > 3, `hollowgate telegraph: setCharge(1) drops the portcullis ${dropped.toFixed(2)} local units into the gap (silhouette change)`);
  hg.setCharge(0); hg.setAttackTell(null);

  // EXPRESSION RIG (§4b): the lit PUPIL pane migrates toward the gaze — and it
  // TICKS in discrete wedge-steps (≤1 wedge per tick interval; continuous
  // tracking is slot 14's exclusive claim).
  for (let i = 0; i < 240; i++) { hg.setGaze(-1, 0); hg.tick(0.016, 4 + i * 0.016); }
  const leftPane = hg.pupilPane();
  const stepLog = new Set([leftPane]);
  for (let i = 0; i < 240; i++) { hg.setGaze(1, 0); hg.tick(0.016, 9 + i * 0.016); stepLog.add(hg.pupilPane()); }
  const rightPane = hg.pupilPane();
  assert(leftPane !== rightPane, `hollowgate pupil migrates with gaze (pane ${leftPane} → ${rightPane})`);
  assert(stepLog.size >= 3, `hollowgate pupil moved through ${stepLog.size} discrete wedge-steps (ticking, not teleporting)`);
  const glowNow = hg.paneIntensities();
  assert(glowNow[rightPane] > Math.min(...glowNow) + 0.3,
    `hollowgate pupil pane ${rightPane} is the brightest wedge (ei ${glowNow[rightPane].toFixed(2)})`);

  // §5j UPROOT ignition: setEntrance is the rise clock — the rose window ignites
  // progressively as the arch clears the water (dark at u≈0/dormant, most of the
  // ring lit by u≈0.85 / risen).
  hg.setEntrance(0.02);
  for (let i = 0; i < 30; i++) hg.tick(0.016, 20 + i * 0.016);
  const litEarly = hg.paneIntensities().filter((v) => v > 0.2).length;
  hg.setEntrance(0.85);
  for (let i = 0; i < 90; i++) hg.tick(0.016, 21 + i * 0.016);
  const litLate = hg.paneIntensities().filter((v) => v > 0.2).length;
  assert(litEarly <= 1 && litLate >= 5,
    `hollowgate uproot ignition: ${litEarly} pane(s) lit at u=0.02 (dormant) → ${litLate} lit at u=0.85 (risen)`);
  hg.setEntrance(null);

  // §5f DESTRUCTIBLE PANES (the CAVE-law hero): crackPane deletes the pane from
  // the composite — visual (mesh hidden, glow dead) AND pattern (livePanes drops
  // it, so firePaneRadial never emits its arm again). paneHitTest routes a
  // boss-local landing point to the nearest LIVE pane.
  assertEq(hg.livePanes().length, 8, 'hollowgate starts with all 8 panes live');
  const sc6 = BOSSES.hollowgate.scale;
  const [rdx, rdy] = hg.paneRadialDir(2);
  const hitIdx = hg.paneHitTest(rdx * 1.2 * sc6, (4.85 + rdy * 1.2) * sc6);
  assertEq(hitIdx, 2, `hollowgate paneHitTest routes a hit on pane 2's glass to pane 2 (got ${hitIdx})`);
  assert(hg.crackPane(2), 'hollowgate crackPane(2) cracks a live pane');
  assert(!hg.crackPane(2), 'hollowgate crackPane(2) is idempotent (already cracked)');
  assertEq(hg.livePanes().length, 7, 'hollowgate cracked pane leaves 7 live');
  assert(!hg.paneAlive(2), 'hollowgate pane 2 no longer alive');
  assert(!hg.group.getObjectByName('rosePane2').visible, 'hollowgate cracked pane mesh is hidden (a hole in the window)');
  hg.tick(0.016, 30);
  assert(hg.paneIntensities()[2] === 0, 'hollowgate cracked pane stays dark through the expression rig');
  const reroute = hg.paneHitTest(rdx * 1.2 * sc6, (4.85 + rdy * 1.2) * sc6);
  assert(reroute !== 2, `hollowgate paneHitTest never routes to a cracked pane (got ${reroute})`);

  hg.dispose();
  ok(`hollowgate geometry: gap ${gapW.toFixed(1)}w, portcullis drop ${dropped.toFixed(1)}, pupil ${leftPane}→${rightPane} in ${stepLog.size} steps, ignition ${litEarly}→${litLate}, pane-break ✓`);
}

// Legacy coexist gate: a def WITHOUT `archetype` must still fall through to
// the legacy construct (bossModel.js's buildBoss dispatcher) — the coexist
// rule the whole archetype system is built on, guarding against a future def
// silently losing its archetype and shipping the wrong boss unnoticed.
{
  const legacyDef = { ...BOSSES.voidmaw, archetype: undefined };
  let legacyModel, legacyErr = null;
  try { legacyModel = buildBoss(legacyDef, 1); } catch (e) { legacyErr = e; }
  assert(!legacyErr, `legacy fallback construct builds without throwing (${legacyErr?.message})`);
  assert(legacyModel.group.userData.archetype == null, 'legacy fallback construct carries no archetype userData tag');
  const legacyTris = countTris(legacyModel.group);
  assert(legacyTris > 0, `legacy fallback construct tris ${legacyTris} > 0`);
  legacyModel.setDissolve(1);
  let maxOp = 0;
  legacyModel.group.traverse((o) => { if (o.material) maxOp = Math.max(maxOp, o.material.opacity); });
  assert(maxOp < 0.02, `legacy fallback setDissolve(1) drives all materials transparent (max opacity ${maxOp.toFixed(3)})`);
  legacyModel.dispose();
  ok(`legacy coexist: def without archetype still builds the legacy construct (${legacyTris} tris), dissolve works, no throw`);
}

// --- 3. bullet pool: player-relative dodge / hit / reflect ------------------
bullets.initBossBullets(fakeScene);
game.state = 'playing';
game.inBoss = true;

// A bullet aimed dead-on closes from rel=20 to the player plane and deals damage.
function runBoss(opts, frames = 200) {
  resetCollision();
  bullets.resetBossBullets();
  bullets.spawnBossBullet(Object.assign({ owner: 'boss', x: 0, y: 8, rel: 20, vx: 0, vy: 0, vrel: -40, dmg: 18, r: CONFIG.BOSS.bulletRadius, life: 6 }, opts));
  const p = makePlayer();
  if (opts.rollInvuln) p.rollInvuln = opts.rollInvuln;
  const before = game.health;
  for (let i = 0; i < frames && bullets.bossBulletCount() > 0; i++) bullets.updateBossBullets(1 / 60, p);
  return before - game.health;
}
game.health = 100;
assert(runBoss({}) === 18, 'a dead-on boss bullet hits the player for its damage');
game.health = 100;
assert(runBoss({ x: 9, vx: 0 }) === 0, 'a bullet offset across the lane is dodged (misses)');
game.health = 100;
assert(runBoss({ rollInvuln: 0.5 }) === 0, 'barrel-roll i-frames negate a dead-on bullet (the dodge)');
ok('boss bullets: hit on contact, miss when offset, negated during a roll');

// Rider/reflected bullets fly the other way and damage the BOSS via an event.
let bossDmg = 0;
on('bossDamage', (e) => { bossDmg += e.amount; });
bullets.resetBossBullets();
bullets.spawnBossBullet({ owner: 'rider', x: 0.5, y: 8, rel: 1.5, vx: 0, vy: 0, vrel: CONFIG.BOSS.bossSpeed, targetRel: 20, tx: 0, ty: 8, dmg: 5, r: 0.45, life: 4 });
{
  const p = makePlayer();
  for (let i = 0; i < 200 && bullets.bossBulletCount() > 0; i++) bullets.updateBossBullets(1 / 60, p);
}
assert(bossDmg === 5, 'a rider shot reaches the boss and emits bossDamage');
bullets.resetBossBullets();
ok('boss-ward (rider/reflected) bullets deal boss damage on arrival');

// --- 3b. graze → surge charge (Increment 1: the spine) ----------------------
// The graze band is (hitR, grazeR] ≈ (1.29, 3.19]. Skimming a bullet inside it
// deals 0 damage but charges the surge meter; a dead-on pass hits; a wide pass
// does neither. Sustained grazing auto-fires Dragon Surge at the usual threshold.
game.state = 'playing'; game.inBoss = true;
game.health = 100; game.grazesRun = 0; game.grazeCharge = 0; game.consecutiveRings = 0; game.feverActive = false;
const grazeDmg = runBoss({ x: 2.2, vx: 0 });   // inside the graze band, outside the hit radius
assert(grazeDmg === 0, 'a grazed bullet deals no damage');
assert(game.grazesRun === 1, 'the graze is counted');
assert(game.grazeCharge > 0 || game.consecutiveRings > 0, 'a graze charges the surge meter');

game.health = 100; game.grazesRun = 0;
runBoss({ x: 0, vx: 0 });
assert(game.grazesRun === 0, 'a dead-on HIT is not a graze');
game.health = 100; game.grazesRun = 0;
runBoss({ x: 9, vx: 0 });
assert(game.grazesRun === 0, 'a wide miss is neither hit nor graze');

// A bullet hit wipes the graze-charged surge (risk/reward), even at combo 1.
game.reset(); game.state = 'playing'; game.inBoss = true; game.combo = 1;
game.consecutiveRings = 4; game.grazeCharge = 0.5; game.health = 100;
runBoss({ x: 0, vx: 0 });   // dead-on hit
assert(game.consecutiveRings === 0 && game.grazeCharge === 0, 'a bullet hit cancels the graze streak (combo-1 safe)');

// Sustained grazing FILLS the meter — but in a boss Surge is MANUAL (unleashed
// with Space / a 2nd-finger tap), so it must NOT auto-fire from grazing.
game.reset(); game.state = 'playing'; game.inBoss = true; game.health = 100; game.consecutiveRings = 0;
let grazeCount = 0;
while (game.consecutiveRings < game.feverThreshold && grazeCount < 400) { runBoss({ x: 2.2, vx: 0 }); grazeCount++; }
assert(game.consecutiveRings >= game.feverThreshold, 'sustained grazing fills the surge meter');
assert(!game.feverActive, 'Surge does NOT auto-fire in a boss (manual unleash)');
ok(`graze fills the meter (${grazeCount} grazes); no auto-surge in a boss`);

// --- 3b². §5i.B continuous-graze detector (RIDE-THE-BEAM-EDGE, slot 6) -------
// The ticking sibling of the crossing check: beamContact reports live riding —
// a bullet AHEAD whose lateral offset is inside the graze annulus. Annulus law:
// a dead-centre (hit-radius) bullet is NOT contact; far offsets aren't either.
{
  bullets.resetBossBullets();
  const p = makePlayer();
  const annulus = CONFIG.BOSS.bulletRadius + CONFIG.playerRadius * (CONFIG.BOSS.bulletHitScale + CONFIG.BOSS.grazeScale) / 2;
  bullets.spawnBossBullet({ owner: 'boss', x: p.position.x + annulus, y: p.position.y, rel: 3, vrel: -28, dmg: 5, r: CONFIG.BOSS.bulletRadius, life: 3 });
  assert(bullets.beamContact(p, 7), 'beamContact: an annulus-offset bullet ahead reads as riding the edge');
  bullets.resetBossBullets();
  bullets.spawnBossBullet({ owner: 'boss', x: p.position.x, y: p.position.y, rel: 3, vrel: -28, dmg: 5, r: CONFIG.BOSS.bulletRadius, life: 3 });
  assert(!bullets.beamContact(p, 7), 'beamContact: a dead-centre bullet is NOT contact (annulus, not radius)');
  bullets.resetBossBullets();
  bullets.spawnBossBullet({ owner: 'boss', x: p.position.x + 12, y: p.position.y, rel: 3, vrel: -28, dmg: 5, r: CONFIG.BOSS.bulletRadius, life: 3 });
  assert(!bullets.beamContact(p, 7), 'beamContact: a far bullet is not contact');
  bullets.spawnBossBullet({ owner: 'boss', x: p.position.x + annulus, y: p.position.y, rel: 15, vrel: -28, dmg: 5, r: CONFIG.BOSS.bulletRadius, life: 3 });
  assert(!bullets.beamContact(p, 7), 'beamContact: depth-window bound holds (rel 15 > 7 is not riding)');
  bullets.resetBossBullets();
  ok('beamEdge detector: annulus + depth-window law holds (continuous graze, §5i.B)');
}

// --- 3c. reflect (Increment 2): a roll swats reflectable bullets back --------
bullets.resetBossBullets();
// A reflectable (amber) bullet just ahead of the player, near their x/y.
bullets.spawnBossBullet({ owner: 'boss', x: 0.5, y: 8, rel: 2, vx: 0, vy: 0, vrel: -28, reflectable: true, dmg: 18, r: CONFIG.BOSS.bulletRadius, color: 0xffc23c, life: 6 });
const rRef = bullets.reflectBossBullets(makePlayer(), CONFIG.BOSS.reflectWindow, CONFIG.BOSS.settleGap, 0, CONFIG.BOSS.fightHeight);
assert(rRef.total === 1, 'a barrel roll reflects a nearby reflectable bullet');
// It now flies back and damages the boss for ×reflectDamageMult.
let reflDmg = 0;
on('bossDamage', (e) => { if (e.kind === 'player') reflDmg += e.amount; });
{
  const p = makePlayer();
  for (let i = 0; i < 300 && bullets.bossBulletCount() > 0; i++) bullets.updateBossBullets(1 / 60, p);
}
assert(reflDmg === 18 * CONFIG.BOSS.reflectDamageMult, `reflected bullet deals ×${CONFIG.BOSS.reflectDamageMult} to the boss (got ${reflDmg})`);
// A bullet swatted right on top of you (rel ≤ perfectParryRel) is a PERFECT parry.
bullets.resetBossBullets();
bullets.spawnBossBullet({ owner: 'boss', x: 0.3, y: 8, rel: 1.0, vx: 0, vy: 0, vrel: -28, reflectable: true, dmg: 18, r: CONFIG.BOSS.bulletRadius, color: 0xffc23c, life: 6 });
const rPerfect = bullets.reflectBossBullets(makePlayer(), CONFIG.BOSS.reflectWindow, CONFIG.BOSS.settleGap, 0, CONFIG.BOSS.fightHeight);
assert(rPerfect.total === 1 && rPerfect.perfect === 1, 'a bullet swatted on top of you is a perfect parry');
// A non-reflectable bullet in the same spot cannot be swatted (until Surge, inc.3).
bullets.resetBossBullets();
bullets.spawnBossBullet({ owner: 'boss', x: 0.5, y: 8, rel: 2, vx: 0, vy: 0, vrel: -28, reflectable: false, dmg: 18, r: CONFIG.BOSS.bulletRadius, color: 0xff3010, life: 6 });
assert(bullets.reflectBossBullets(makePlayer(), CONFIG.BOSS.reflectWindow, CONFIG.BOSS.settleGap, 0, CONFIG.BOSS.fightHeight).total === 0, 'a non-reflectable bullet cannot be reflected');
// …but the Surge hyper (all=true) swats even a non-reflectable bullet.
assert(bullets.reflectBossBullets(makePlayer(), CONFIG.BOSS.reflectWindow, CONFIG.BOSS.settleGap, 0, CONFIG.BOSS.fightHeight, true).total === 1, 'Surge (all=true) reflects any bullet');
bullets.resetBossBullets();
ok('reflect: roll swats amber bullets back for bonus damage; plain bullets immune (until Surge)');

// --- 3d. Surge hyper (Increment 3): all-reflect + bullet-time + double rider --
// The all-reflect core is proven above (all=true). Here assert the two tuning
// knobs the controller applies while feverActive are sane (slower bullets,
// faster rider); the real-engine path is exercised in tests/bossboot.mjs.
assert(CONFIG.BOSS.surgeRiderMult > 0 && CONFIG.BOSS.surgeRiderMult < 1, 'Surge shortens the rider interval (<1)');
ok('Surge hyper knobs: faster rider + all-bullets-reflectable + shield-burst');

// --- 3e. pattern emission budget + designed safe gaps ------------------------
// spawnBossBullet silently DROPS past visibleCap (floor 60 on the lowest tier),
// which would punch RANDOM holes in a wall — unfair noise, not difficulty. So:
// every attack fits the low-tier ceiling (no ~1.2s closing window ever holds
// more than ~55 bullets), and every 2D fill leaves a threadable designed lane.
const ALL_ATTACKS = ['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream',
  'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire'];
const TRAVEL = CONFIG.BOSS.settleGap / (CONFIG.BOSS.bulletSpeed * 0.8);   // slowest closing ≈ 1.34s
const laneSafe = (v, half = 2.2) => {
  for (let g = -11; g <= 11; g += 0.25) {
    if (v.every((b) => Math.abs(b.x - g) >= half)) return true;
  }
  return false;
};
for (const q of [1, 0.7]) {
  for (const id of ALL_ATTACKS) {
    bullets.resetBossBullets();
    const volleys = boss.debugEmitAttack(id, makePlayer(), q);
    const total = volleys.reduce((s, v) => s + v.bullets.length, 0);
    assert(total > 0, `${id} @q${q} emits bullets`);
    // Worst concurrent load: all volleys whose stream offset falls inside one
    // travel window are alive together.
    let worst = 0;
    for (const v of volleys) {
      const load = volleys.filter((w) => w.t >= v.t - TRAVEL && w.t <= v.t)
        .reduce((s, w) => s + w.bullets.length, 0);
      worst = Math.max(worst, load);
    }
    if (q < 1) assert(worst <= 55, `${id} @q${q} concurrent load ${worst} fits the low-tier cap (≤55)`);
    else assert(worst <= 160, `${id} @q1 concurrent load ${worst} leaves pool headroom (≤160)`);
  }
}
// The 2D fills must leave their designed safe lane (≥2.2 half-width somewhere).
{
  bullets.resetBossBullets();
  const wall = boss.debugEmitAttack('curtain', makePlayer(), 1);
  assert(laneSafe(wall[0].bullets), 'curtain leaves a threadable safe lane');
  bullets.resetBossBullets();
  const rows = boss.debugEmitAttack('movingGap', makePlayer(), 1);
  for (const r of rows) {
    if (!r.bullets.length) continue;   // the instant volley is empty (all streamed)
    assert(laneSafe(r.bullets), `movingGap row @t${r.t.toFixed(2)} leaves a sliding safe lane`);
  }
}
bullets.resetBossBullets();
ok(`pattern budget: ${ALL_ATTACKS.length} attacks fit the low-tier bullet cap; fills keep designed lanes`);

// --- 4. full controller lifecycle, driven to a kill (EVERY boss) -------------
boss.initBoss(fakeScene);
let killsSeen = 0, surgesSeen = 0;
const cardsResolved = [];   // ids resolved (capture/survived) across the current kill
on('bossDefeated', () => { killsSeen++; });
on('surge', () => { surgesSeen++; });
on('bossCard', (e) => { cardsResolved.push(e.id); });

// Drive one full encounter of BOSS_ORDER[idx] like a skilled player: when the
// phase-floor shield rises, top the meter and tap Surge (the only way past);
// decrement the fever timer (main.js's job in-game) so surges can re-arm.
function driveKill(idx) {
  game.inBoss = false;
  game.reset();
  game.state = 'playing';
  game.health = 1e9;          // immortal player → we are testing the boss economy
  const player = makePlayer();
  input.surgeTap = false;   // no stale tap leaking from a prior boss into the uproot loom's tap-to-skip
  boss.forceBoss(player, idx);
  const kills0 = killsSeen, surges0 = surgesSeen;
  cardsResolved.length = 0;
  let t = 0, sawFight = false, sawShield = false, sawNarrow = false;
  let sawSetpiece = false, setpieceMaxX = 0, setpieceMaxY = 0, setpieceMinRel = 99, chargedDuringSetpiece = false;
  // §5j UPROOT entrance: the boss holds a FIXED world spot during 'loom' (rel
  // closes only as player.dist grows; pose stays low/sunk), then RISES in 'uproot'.
  let sawLoom = false, sawUproot = false, loomRelFirst = null, loomRelLast = null;
  let loomYMax = 0, uprootYMin = 99, uprootYMax = -99;
  for (let i = 0; i < 60 * 200 && !(killsSeen > kills0 && !game.inBoss); i++) {
    const dt = 1 / 60;
    t += dt;
    player.dist += CONFIG.BOSS.cruiseSpeed * dt;             // mimic forward flight
    if (game.feverActive) { game.feverTimer -= dt; if (game.feverTimer <= 0) game.feverActive = false; }
    const st = boss.bossDebugState();
    if (st.phase === 'fight') sawFight = true;
    if (st.shielded) {
      sawShield = true;
      game.consecutiveRings = game.feverThreshold;   // grazed enough to charge
      input.surgeTap = true;                          // unleash (Space / tap)
    }
    if (st.setpiece) {
      // The def-gated station-leave beat: record the pose excursion (the boss
      // must actually LEAVE station) and that no telegraph runs during it.
      sawSetpiece = true;
      setpieceMaxX = Math.max(setpieceMaxX, Math.abs(st.poseX));
      setpieceMaxY = Math.max(setpieceMaxY, st.poseY);
      setpieceMinRel = Math.min(setpieceMinRel, st.poseRel);
      if (st.charging) chargedDuringSetpiece = true;
    }
    if (st.phase === 'loom') {
      sawLoom = true;
      if (loomRelFirst == null) loomRelFirst = st.poseRel;
      loomRelLast = st.poseRel;
      loomYMax = Math.max(loomYMax, st.poseY);
    }
    if (st.phase === 'uproot') { sawUproot = true; uprootYMin = Math.min(uprootYMin, st.poseY); uprootYMax = Math.max(uprootYMax, st.poseY); }
    if (game.bossArenaHW != null) sawNarrow = true;
    boss.updateBoss(dt, player, t);
  }
  return { t, sawFight, sawShield, sawNarrow,
    sawLoom, sawUproot, loomRelFirst, loomRelLast, loomYMax, uprootYMin, uprootYMax,
    sawSetpiece, setpieceMaxX, setpieceMaxY, setpieceMinRel, chargedDuringSetpiece,
    killed: killsSeen > kills0, surges: surgesSeen - surges0,
    cardsResolved: [...cardsResolved] };
}

for (let idx = 0; idx < BOSS_ORDER.length; idx++) {
  const key = BOSS_ORDER[idx];
  const r = driveKill(idx);
  assert(r.sawFight, `${key}: controller passed warn → approach → fight`);
  // §5j UPROOT entrance (def-gated): the boss LOOMS at a fixed world spot (rel
  // closes as you fly — dist-driven, pose held low/sunk) then RISES on arrival.
  // Coexist: a def without uprootEntrance never enters loom/uproot.
  if (BOSSES[key].uprootEntrance) {
    assert(r.sawLoom && r.sawUproot, `${key}: entrance passed warn → loom → uproot → fight`);
    assert(r.loomRelLast < r.loomRelFirst - 20, `${key}: the loom is dist-driven (rel closed ${r.loomRelFirst?.toFixed(0)}→${r.loomRelLast?.toFixed(0)} as the rail advanced)`);
    assert(r.loomYMax <= (BOSSES[key].sunkY ?? 2) + 0.5, `${key}: it holds the sunk pose through the loom (max y ${r.loomYMax.toFixed(1)})`);
    assert(r.uprootYMax >= CONFIG.BOSS.fightHeight - 0.5 && r.uprootYMax - r.uprootYMin > 6,
      `${key}: the uproot RISES out of the water (pose.y ${r.uprootYMin.toFixed(1)}→${r.uprootYMax.toFixed(1)})`);
  } else {
    assert(!r.sawLoom && !r.sawUproot, `${key}: no uproot entrance → never enters loom/uproot (coexist)`);
  }
  assert(r.sawShield, `${key}: raised a shield at a phase floor (only Surge bursts it)`);
  assert(r.surges >= 3, `${key}: ~3 Surge unleashes to burst the shields and kill (got ${r.surges})`);
  assert(r.killed, `${key}: shield-gated boss dies after the phases are burst`);
  // Spell cards (§5f): a def with cards resolves EACH one across the full kill
  // (one per phase, ending at that phase's shield-break / the final death).
  if (BOSSES[key].cards) {
    const want = BOSSES[key].cards.map((c) => c.id);
    assert(want.every((id) => r.cardsResolved.includes(id)),
      `${key}: every spell card resolved across the kill (${r.cardsResolved.length}/${want.length}: ${r.cardsResolved.join(', ')})`);
  }
  assertEq(game.inBoss, false, `${key}: after death the overlay tears down (game.inBoss cleared)`);
  assertEq(game.bossesDefeatedRun, 1, `${key}: the defeated boss is counted on the run`);
  assert(bullets.bossBulletCount() === 0, `${key}: all bullets are cleared on teardown`);
  // Constriction contract: a def with constrictPhase narrows the arena during
  // the fight and ALWAYS restores it on teardown.
  if (BOSSES[key].constrictPhase != null) {
    assert(r.sawNarrow, `${key}: the arena narrowed at the constriction phase`);
  } else {
    assert(!r.sawNarrow, `${key}: no constriction → the arena never narrowed`);
  }
  assertEq(game.bossArenaHW, null, `${key}: arena width restored after the fight`);
  // Setpiece contract (the fenced controller seam): a def WITH a setpiece plays it
  // at its phase — a real station-leave excursion — and a def WITHOUT one NEVER
  // sees it (the byte-unchanged fence for the shipped bosses). Supports the legacy
  // single `setpiece` and the per-phase `setpieces` array. A QUIET setpiece holds
  // fire (capture window); a MOVING setpiece (§5e moving-station) fires WHILE it
  // travels, so the quiet-window rule is waived and firing is instead required.
  const setpieces = BOSSES[key].setpieces || (BOSSES[key].setpiece ? [BOSSES[key].setpiece] : []);
  if (setpieces.length) {
    assert(r.sawSetpiece, `${key}: the def's setpiece played`);
    // "Left station" on ANY excursion axis: lateral (|x|), vertical (y), or DEPTH
    // (rel through/near the camera — the fly-through axis; L141: HOLLOWGATE's
    // archPass and EITHERWING's figure-eight cross the player at rel < 0).
    assert(r.setpieceMaxX > 9 || r.setpieceMaxY > CONFIG.BOSS.fightHeight + 3 || r.setpieceMinRel < 4,
      `${key}: setpiece left station (max |x| ${r.setpieceMaxX.toFixed(1)}, max y ${r.setpieceMaxY.toFixed(1)}, min rel ${r.setpieceMinRel.toFixed(1)})`);
    if (setpieces.some((s) => s.moving)) {
      assert(r.chargedDuringSetpiece, `${key}: a moving-station setpiece keeps firing while it travels (§5e)`);
    } else {
      assert(!r.chargedDuringSetpiece, `${key}: no attack telegraph during the setpiece (quiet capture window)`);
    }
  } else {
    assert(!r.sawSetpiece, `${key}: no setpiece def → the fight never leaves station`);
  }
  ok(`${key} lifecycle: warn→approach→fight→death→teardown, slain at ~${r.t.toFixed(1)}s`);
}

console.log(`\n${n} boss checks passed.`);
