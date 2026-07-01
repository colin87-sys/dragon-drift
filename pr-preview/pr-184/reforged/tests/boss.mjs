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
    for (const a of ph.attacks) assert(['aimed', 'fan', 'spiral', 'tunnel', 'spiralStream'].includes(a), `${key} attack '${a}' is known`);
    assert(ph.cadence[0] > 0 && ph.cadence[1] >= ph.cadence[0], `${key} cadence is a valid range`);
  }
}
assertEq(bossDefForIndex(0).id, BOSS_ORDER[0], 'bossDefForIndex(0) → first boss');
assertEq(bossDefForIndex(BOSS_ORDER.length).id, BOSS_ORDER[0], 'bossDefForIndex wraps the list');
ok(`bossDefs schema valid for ${BOSS_ORDER.length} boss(es), all 3-phase`);

// --- 2. bossModel: tri budget + dissolve ------------------------------------
const model = buildBoss(BOSSES.voidmaw, 1);
let tris = 0;
model.group.traverse((o) => { if (o.geometry) { const g = o.geometry; tris += (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3; } });
tris = Math.round(tris);
assert(tris > 0 && tris < 6000, `boss model tris ${tris} within the per-form budget (<6000)`);
assert(model.muzzle && model.orbiters.length >= 2, 'boss model exposes a muzzle node + orbiting shards');
// Dissolve fully fades every material's opacity toward zero.
model.setDissolve(1);
let maxOp = 0;
model.group.traverse((o) => { if (o.material) maxOp = Math.max(maxOp, o.material.opacity); });
assert(maxOp < 0.02, `setDissolve(1) drives all materials transparent (max opacity ${maxOp.toFixed(3)})`);
model.setDissolve(0);
let restored = 0;
model.group.traverse((o) => { if (o.material) restored = Math.max(restored, o.material.opacity); });
assert(restored > 0.5, 'setDissolve(0) restores opacity');
// tick() animates the orbiters and never throws.
const o0 = model.orbiters[0].position.clone();
model.tick(0.2, 1.0);
assert(model.orbiters[0].position.distanceTo(o0) > 0, 'model.tick advances the orbiters');
ok(`boss model: ${tris} tris, dissolve + tick verified`);

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

// Sustained grazing fills the meter and auto-fires Dragon Surge.
game.reset(); game.state = 'playing'; game.inBoss = true; game.health = 100; game.feverActive = false;
let grazeCount = 0;
while (!game.feverActive && grazeCount < 400) { runBoss({ x: 2.2, vx: 0 }); grazeCount++; }
assert(game.feverActive, 'sustained grazing auto-fires Dragon Surge');
ok(`graze charges surge (hit/miss excluded, hit cancels); ${grazeCount} grazes → Surge`);

// --- 4. full controller lifecycle, driven to a kill -------------------------
game.inBoss = false;
game.reset();
game.state = 'playing';
game.health = 1e9;            // immortal player → we are testing the boss economy
boss.initBoss(fakeScene);
const player = makePlayer();
boss.forceBoss(player);
assert(game.inBoss === true, 'forceBoss enters the encounter (game.inBoss set)');
assert(boss.bossActive(), 'controller reports an active encounter');

let t = 0, killed = false, sawFight = false, defeatedRun0 = game.bossesDefeatedRun;
on('bossDefeated', () => { killed = true; });
// Run until the encounter has fully torn down (death → dissolve → teardown), capped.
for (let i = 0; i < 60 * 100 && !(killed && !game.inBoss); i++) {
  const dt = 1 / 60;
  t += dt;
  player.dist += CONFIG.BOSS.cruiseSpeed * dt;             // mimic forward flight
  boss.updateBoss(dt, player, t);
  const st = boss.bossDebugState();
  if (st.phase === 'fight') sawFight = true;
}
assert(sawFight, 'controller passed warn → approach → fight');
assert(killed, 'rider auto-chip alone kills the boss within 90s (the MVP damage economy)');
assertEq(game.inBoss, false, 'after death the overlay tears down (game.inBoss cleared)');
assertEq(game.bossesDefeatedRun, defeatedRun0 + 1, 'a defeated boss is counted on the run');
assert(bullets.bossBulletCount() === 0, 'all bullets are cleared on teardown');
ok(`controller lifecycle: warn→approach→fight→death→teardown, boss slain at ~${t.toFixed(1)}s`);

console.log(`\n${n} boss checks passed.`);
