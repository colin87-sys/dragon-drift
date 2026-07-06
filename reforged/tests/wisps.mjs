// WYRMFIRE WISPS (PR4a) — headless proofs for the lance-volley flight rework.
// The wisps FAN OUT on authored bearings (Panzer-Dragoon lock-on style), arc for
// homeDelay, then home; vrel is untouched so the arrival FRAME is identical to
// the pre-wisp straight lance — that invariance IS the boss.mjs kill-time
// coexist proof, and T-W2 enforces it directly. Node harness (boss.mjs prologue):
// the real bossBullets module stepped at fixed dt — no rAF, no clock pollution (L177).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// DOM/canvas shim (the particle/texture helpers touch a lot of canvas API).
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
const { on } = await import('../js/events.js');
const bullets = await import('../js/bossBullets.js');
const { initParticles } = await import('../js/particles.js');
const lock = await import('../js/lockLayer.js');
initParticles({ add() {} });   // wisp trails/impacts spawn pooled sprites
bullets.initBossBullets({ add() {} });
bullets.setBossBulletQuality(1);

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const L = CONFIG.LOCK, B = CONFIG.BOSS;
const DT = 1 / 60;
const player = { position: new THREE.Vector3(0, 8, 0), dist: 0, rollInvuln: 0 };

// Spawn one wisp with fireLanceAt's EXACT recipe (boss.js) — slot i of an n-volley
// at target (tx, ty, targetRel). Kept in lockstep with the live spawner by T-W1's
// integration half (tests/lock.mjs reads the REAL strikeSurge spawns).
function spawnWisp(i, tx, ty, targetRel) {
  const a = L.lanceFanDeg[i % L.lanceFanDeg.length] * (Math.PI / 180);
  return bullets.spawnBossBullet({
    owner: 'lance', x: player.position.x - 0.6, y: player.position.y + 0.4, rel: 1.5,
    vx: Math.cos(a) * L.lanceFanSpeed, vy: Math.sin(a) * L.lanceFanSpeed, vrel: B.bossSpeed,
    targetRel, tx, ty,
    color: 0x50ffaa, coreColor: 0xeafff6, dmg: 2, r: 0.5, life: 4, part: 'organ' + i,
    homeDelay: L.lanceHomeDelay,
    curl: (i % 2 ? -1 : 1) * L.lanceCurlRate,
  });
}

// --- T-W4 — config gate lints (the honest arithmetic; fail = the TUNE drifted) --
const flight = (B.settleGap - 1.5) / B.bossSpeed;
assert(L.lanceHomeDelay + 0.3 <= flight,
  `homing-window law: homeDelay ${L.lanceHomeDelay} + 0.3s homing ≤ flight ${flight.toFixed(3)}s`);
assert(6 * L.lanceTrailHz * L.lanceTrailLife <= 60,
  `trail budget law: 6 wisps × ${L.lanceTrailHz}Hz × ${L.lanceTrailLife}s = ${6 * L.lanceTrailHz * L.lanceTrailLife} ≤ 60 concurrent sprites (cap 150 keeps headroom)`);
assertEq(L.lanceFanDeg.length, 6, 'fan table covers the max volley (cap 6 at tier 4+)');
assert(L.paintCooldown >= 0.3 && L.paintCooldown <= 0.6, `paintCooldown ${L.paintCooldown} within TUNE range [0.3, 0.6]`);
ok('T-W4 config lints: homing window, trail budget, fan table size, paint cooldown range');

// --- T-W2 — convergence + arrival-frame invariance (the coexist proof) --------
// Worst-case volley: 6 wisps incl. slot 5 (215° — launched AWAY from the boss),
// far lateral organs (±8). EVERY wisp must land inside bossHitRadius, and land on
// the same frame a straight lance would (rel is driven by vrel alone).
{
  const targets = [[-8, 13], [8, 13], [0, 13], [-8, 13], [8, 13], [0, 13]];
  const targetRel = 28.5;
  const hits = [];
  let collecting = true;
  on('bossDamage', (e) => { if (collecting && e.kind === 'lance') hits.push(e); });
  for (let i = 0; i < 6; i++) spawnWisp(i, targets[i][0], targets[i][1], targetRel);
  const expectFrame = Math.ceil((targetRel - 1.5) / (B.bossSpeed * DT) - 1e-9);
  let frame = 0, landedAt = -1;
  while (frame < 120 && hits.length < 6) {
    frame++;
    bullets.updateBossBullets(DT, player);
    if (hits.length === 6 && landedAt < 0) landedAt = frame;
  }
  assertEq(hits.length, 6, 'all 6 fan wisps land (incl. the 215° away-facing slot)');
  assertEq(landedAt, expectFrame,
    `wisps land on the straight-lance arrival frame (${expectFrame} — vrel invariance, kill-time coexist)`);
  for (const h of hits) {
    const t = targets.find(([x, y]) => (h.x - x) ** 2 + (h.y - y) ** 2 < B.bossHitRadius ** 2);
    assert(t, `wisp landed within bossHitRadius of its brand (hit at ${h.x.toFixed(2)},${h.y.toFixed(2)})`);
  }
  collecting = false;
  ok(`T-W2 6/6 worst-case wisps converge and land on frame ${expectFrame} (arrival-frame law)`);
  bullets.resetBossBullets();
}

// --- T-W1 (unit half) — fan divergence at launch ------------------------------
// The 6 authored bearings must be mutually ≥30° apart at launch and carry
// lanceFanSpeed exactly (the visible Panzer-Dragoon fan).
{
  for (let i = 0; i < 6; i++) spawnWisp(i, 0, 13, 28.5);
  const ws = bullets.debugActiveBullets().filter((b) => b.owner === 'lance');
  assertEq(ws.length, 6, 'six wisps active at launch');
  for (const w of ws) {
    const sp = Math.hypot(w.vx, w.vy);
    assert(Math.abs(sp - L.lanceFanSpeed) < 1e-6, `launch speed ${sp.toFixed(2)} = lanceFanSpeed`);
  }
  const cos30 = Math.cos(30 * Math.PI / 180);
  for (let a = 0; a < ws.length; a++) {
    for (let b = a + 1; b < ws.length; b++) {
      const dot = (ws[a].vx * ws[b].vx + ws[a].vy * ws[b].vy) / (L.lanceFanSpeed * L.lanceFanSpeed);
      assert(dot < cos30 + 1e-9, `bearings ${a}/${b} diverge ≥30° (dot ${dot.toFixed(3)})`);
    }
  }
  ok('T-W1 launch fan: 6 bearings mutually ≥30° apart at lanceFanSpeed');
  bullets.resetBossBullets();
}

// --- T-W5 — determinism: the same volley twice is byte-identical --------------
{
  const snap = () => {
    for (let i = 0; i < 3; i++) spawnWisp(i, (i - 1) * 6, 13, 28.5);
    for (let f = 0; f < 20; f++) bullets.updateBossBullets(DT, player);   // through fan + engage
    const s = bullets.debugActiveBullets().filter((b) => b.owner === 'lance')
      .map((b) => [b.x, b.y, b.vx, b.vy, b.rel]);
    bullets.resetBossBullets();
    return JSON.stringify(s);
  };
  assertEq(snap(), snap(), 'same 3-pip volley twice → identical kinematics (no RNG in gameplay fields)');
  ok('T-W5 wisp flight is deterministic (authored table + slot parity, zero RNG)');
}

// --- T-W3 — volley (i, n) threading through the lock layer --------------------
// The staggered auto/manual volley must hand each launch its fan slot: i = launch
// order, n = pips — the same authored-bearing contract the Surge fork uses.
{
  lock.initLockLayer();
  const rec = [];
  const ORGANS = { A: { x: 0, y: 0, z: 0 }, B: { x: 10, y: 0, z: 0 } };
  const model = { partWorldPos: (p, out) => { const o = ORGANS[p]; if (!o) return null; out.x = o.x; out.y = o.y; out.z = o.z; return out; } };
  const mkCtx = (px) => ({
    fightRunning: true, model, candidates: ['A', 'B'], muted: false,
    emittersLive: true, exposureWindow: false, damageBoss() {}, flashPart() {},
    tier: 2, cap: 2, deflected: false, phaseHp: 100, paintUnlocked: true,
    paintables: ['A', 'B'], amberVenting: () => false,
    fireLance: (part, dmg, i, n) => rec.push([part, i, n]),
  });
  const run = (px, secs) => {
    const p = { position: { x: px, y: 0 } };
    for (let f = 0; f < Math.round(secs / 0.06); f++) lock.updateLockLayer(0.06, p, mkCtx(px));
  };
  run(0, 1.2);   // paint A
  run(10, 1.2);  // paint B (cap 2) — past the paintCooldown by construction
  run(10, 1.6);  // cap fuse (1.0s) completes → volley queues + staggered launches fire
  assertEq(rec.length, 2, 'cap-2 volley fired 2 lances');
  assertEq(rec[0][1], 0, 'first launch carries fan slot i=0');
  assertEq(rec[1][1], 1, 'second launch carries fan slot i=1');
  assert(rec[0][2] === 2 && rec[1][2] === 2, 'both launches carry n=2 (the volley size)');
  ok('T-W3 lanceQ threads (i, n) to every launch — auto/manual volleys fan like the fork');
}

console.log(`\n${n} wisp checks passed.`);
