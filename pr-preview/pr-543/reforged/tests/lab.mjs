// THE LANCE LAB (?lab) — headless proofs for the pacifist practice range.
// Coexist FIRST (lab off → a normal fight fires), because setBossLab is a
// one-way, page-lifetime switch (URL-scoped in the real game). Then the lab:
// forced hollowgate, ZERO boss-owned bullets, hp frozen through damage, no
// shield ever, cap forced to 6. Node harness (boss.mjs prologue).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

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
const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { emit } = await import('../js/events.js');
const bullets = await import('../js/bossBullets.js');
const boss = await import('../js/boss.js');
const { lockHudState } = await import('../js/lockLayer.js');
const { ui } = await import('../js/ui.js');
const { initParticles } = await import('../js/particles.js');
initParticles({ add() {} });
ui.bossBanner = () => {};
ui.damageFlash = () => {};

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const fakeScene = { add() {}, remove() {} };
const makePlayer = () => ({ position: new THREE.Vector3(0, 8, 0), velocity: new THREE.Vector2(0, 0), dist: 0, rollInvuln: 0 });
const bossOwned = () => bullets.debugActiveBullets().filter((b) => b.owner === 'boss').length;

boss.initBoss(fakeScene);

// --- T-LAB0 — coexist: WITHOUT the lab, a normal fight fires ------------------
{
  game.inBoss = false; game.reset(); game.state = 'playing'; game.health = 1e9;
  const player = makePlayer();
  boss.forceBoss(player, 0);   // voidmaw
  let fired = false, t = 0;
  for (let i = 0; i < 60 * 40 && !fired; i++) {
    const dt = 1 / 60; t += dt;
    player.dist += CONFIG.BOSS.cruiseSpeed * dt;
    boss.updateBoss(dt, player, t);
    if (bossOwned() > 0) fired = true;
  }
  assert(fired, 'lab OFF: a normal encounter fires boss bullets (the gates are inert)');
  ok('T-LAB0 coexist: without ?lab the fight is untouched');
  boss.resetBoss();
  bullets.resetBossBullets();
}

// --- T-LAB1 — the pacifist range ----------------------------------------------
{
  boss.setBossLab('');   // default target + firstAt pulled in + pacifist gates on
  game.inBoss = false; game.reset(); game.state = 'playing'; game.health = 1e9;
  const player = makePlayer();
  let t = 0, sawFight = false, sawShield = false, fired = 0, capSeen = 0, hpAtFight = -1;
  // Ride the REAL distance trigger (firstAt 180) through warn → entrance → fight,
  // then hold the fight for ~20 simulated seconds while poking it with damage.
  for (let i = 0; i < 60 * 90; i++) {
    const dt = 1 / 60; t += dt;
    player.dist += CONFIG.BOSS.cruiseSpeed * dt;
    boss.updateBoss(dt, player, t);
    const st = boss.bossDebugState();
    if (st.phase === 'fight') {
      if (!sawFight) {
        sawFight = true;
        assertEq(st.id, 'hollowgate', 'the lab defaulted to HOLLOWGATE');
        hpAtFight = st.hp;
      }
      if (st.shielded) sawShield = true;
      fired = Math.max(fired, bossOwned());
      capSeen = Math.max(capSeen, lockHudState().cap);
      // Hammer it the whole fight — a live boss would shield/crack/die under this.
      emit('bossDamage', { amount: 500, kind: 'lance', x: st.poseX, y: st.poseY });
      if (sawFight && t > 60) break;   // ~20+ fight-seconds is plenty
    }
  }
  const st = boss.bossDebugState();
  assert(sawFight, 'the lab boss arrived via the real distance trigger and entered the fight');
  assertEq(fired, 0, 'ZERO boss-owned bullets across the whole fight (pacifist)');
  assertEq(st.hp, hpAtFight, `hp frozen through ~heavy damage (still ${st.hp})`);
  assert(!sawShield && !st.shielded, 'no shield floor ever rises (painting stays live forever)');
  assertEq(capSeen, 6, 'the lab forces the pip cap to 6 (the FULL-cap phrase is testable)');
  assert(st.phase === 'fight' && st.active, 'the range never ends on its own (no death, no timeout)');
  const panes = boss.debugPaintables();
  assert(panes && panes.length >= 5, `hollowgate offers ${panes && panes.length} paintable organs (≥5)`);
  ok('T-LAB1 pacifist range: hollowgate, zero fire, hp frozen, no shield, cap 6, 5 organs');
}

console.log(`\n${n} lab checks passed.`);
