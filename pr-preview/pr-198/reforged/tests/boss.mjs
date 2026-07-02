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

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const fakeScene = { add() {}, remove() {} };
const makePlayer = () => ({ position: new THREE.Vector3(0, 8, 0), velocity: new THREE.Vector2(0, 0), dist: 0, rollInvuln: 0 });

// --- 1. bossDefs schema ------------------------------------------------------
for (const key of BOSS_ORDER) {
  const d = BOSSES[key];
  assert(d && d.hpMax > 0, `${key} has positive hp`);
  assertEq(d.phases.length, 3, `${key} has 3 phases (the vision: ~3 surges to kill)`);
  let prev = Infinity;
  for (const ph of d.phases) {
    assert(ph.atFrac <= prev, `${key} phase atFrac is descending`);
    prev = ph.atFrac;
    assert(Array.isArray(ph.attacks) && ph.attacks.length > 0, `${key} phase has attacks`);
    for (const a of ph.attacks) assert(['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream',
      'curtain', 'movingGap', 'iris', 'stream', 'secondWave', 'crossfire'].includes(a), `${key} attack '${a}' is known`);
    assert(ph.cadence[0] > 0 && ph.cadence[1] >= ph.cadence[0], `${key} cadence is a valid range`);
  }
}
assertEq(bossDefForIndex(0).id, BOSS_ORDER[0], 'bossDefForIndex(0) → first boss');
assertEq(bossDefForIndex(BOSS_ORDER.length).id, BOSS_ORDER[0], 'bossDefForIndex wraps the list');
ok(`bossDefs schema valid for ${BOSS_ORDER.length} boss(es), all 3-phase`);

// --- 2. bossModel: tri budget + dissolve (every boss in the roster) ---------
for (const key of BOSS_ORDER) {
  const model = buildBoss(BOSSES[key], 1);
  let tris = 0;
  model.group.traverse((o) => { if (o.geometry) { const g = o.geometry; tris += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3; } });
  tris = Math.round(tris);
  assert(tris > 0 && tris < 6000, `${key} model tris ${tris} within the per-form budget (<6000)`);
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
const DRAW_BUDGET = 34;
for (const key of BOSS_ORDER) {
  const def = BOSSES[key];
  const q1 = buildBoss(def, 1);
  const q05 = buildBoss(def, 0.5);
  const tris1 = countTris(q1.group);
  const tris05 = countTris(q05.group);
  assert(tris05 > 0 && tris05 < tris1 && tris1 < 6000,
    `${key} quality scaling: tris(q0.5)=${tris05} < tris(q1)=${tris1} < 6000`);
  assertEq(q1.group.userData.archetype, def.archetype,
    `${key} model.group.userData.archetype matches the def ('${def.archetype}') — guards silent legacy fallback`);

  q1.setHealthBarVisible(true);   // hidden during fly-in by default; force it on for the gate
  const draws = countVisibleDraws(q1.group);
  assert(draws > 0 && draws <= DRAW_BUDGET, `${key} visible draw calls ${draws} within the ≤${DRAW_BUDGET} gate`);

  q1.dispose(); q05.dispose();
  ok(`${key} archetype checks: tris ${tris05}→${tris1}, archetype '${def.archetype}', ${draws} visible draws`);
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
on('bossDefeated', () => { killsSeen++; });
on('surge', () => { surgesSeen++; });

// Drive one full encounter of BOSS_ORDER[idx] like a skilled player: when the
// phase-floor shield rises, top the meter and tap Surge (the only way past);
// decrement the fever timer (main.js's job in-game) so surges can re-arm.
function driveKill(idx) {
  game.inBoss = false;
  game.reset();
  game.state = 'playing';
  game.health = 1e9;          // immortal player → we are testing the boss economy
  const player = makePlayer();
  boss.forceBoss(player, idx);
  const kills0 = killsSeen, surges0 = surgesSeen;
  let t = 0, sawFight = false, sawShield = false, sawNarrow = false;
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
    if (game.bossArenaHW != null) sawNarrow = true;
    boss.updateBoss(dt, player, t);
  }
  return { t, sawFight, sawShield, sawNarrow,
    killed: killsSeen > kills0, surges: surgesSeen - surges0 };
}

for (let idx = 0; idx < BOSS_ORDER.length; idx++) {
  const key = BOSS_ORDER[idx];
  const r = driveKill(idx);
  assert(r.sawFight, `${key}: controller passed warn → approach → fight`);
  assert(r.sawShield, `${key}: raised a shield at a phase floor (only Surge bursts it)`);
  assert(r.surges >= 3, `${key}: ~3 Surge unleashes to burst the shields and kill (got ${r.surges})`);
  assert(r.killed, `${key}: shield-gated boss dies after the phases are burst`);
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
  ok(`${key} lifecycle: warn→approach→fight→death→teardown, slain at ~${r.t.toFixed(1)}s`);
}

console.log(`\n${n} boss checks passed.`);
