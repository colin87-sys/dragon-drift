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
// PR4b ribbon lints: THIN is the overdraw law (a thin strip is near-line/exempt;
// bloom carries the glow); the wobble must stay small next to the landing radius.
assert(L.ribbonHalfWMax <= 0.34, `ribbon half-width ${L.ribbonHalfWMax} ≤ 0.34 (thin-line overdraw law)`);
assert(L.ribbonRings <= 24, `ribbonRings ${L.ribbonRings} ≤ 24 (buffer-upload budget)`);
assert(L.wobbleAmp < B.bossHitRadius / 4, `wobbleAmp ${L.wobbleAmp} < bossHitRadius/4 (landing margin)`);
assertEq(L.lanceFanDeg.length, 6, 'fan table covers the max volley (cap 6 at tier 4+)');
assert(L.paintCooldown >= 0.3 && L.paintCooldown <= 0.6, `paintCooldown ${L.paintCooldown} within TUNE range [0.3, 0.6]`);
ok('T-W4 config lints: homing window, ribbon thinness/rings, wobble margin, fan table, paint cooldown');

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

// --- T-W6 — light-ribbon lifecycle (PR4b: the silhouette system) ---------------
// Each wisp tows a ribbon: active while flying (head tracks the slot), then the
// afterimage DRAINS tail-first over ribbonFade and frees the pool slot.
{
  for (let i = 0; i < 3; i++) spawnWisp(i, (i - 1) * 6, 13, 28.5);
  let rb = bullets.debugWispRibbons();
  assertEq(rb.active, 3, 'three fresh wisps claim three ribbons');
  for (let f = 0; f < 10; f++) bullets.updateBossBullets(DT, player);
  rb = bullets.debugWispRibbons();
  const ws = bullets.debugActiveBullets().filter((b) => b.owner === 'lance');
  assert(rb.ribbons.filter((r) => r.active).every((r) => r.n >= 10),
    'ribbons accumulate one sample per frame');
  for (const r of rb.ribbons.filter((r) => r.active)) {
    const near = ws.some((w) => (w.x - r.hx) ** 2 + (w.y - r.hy) ** 2 < 0.01);
    assert(near, `a ribbon head rides its wisp (head ${r.hx.toFixed(2)},${r.hy.toFixed(2)})`);
  }
  for (let f = 0; f < 40; f++) bullets.updateBossBullets(DT, player);   // through arrival
  rb = bullets.debugWispRibbons();
  assertEq(rb.active, 0, 'after arrival no ribbon is still active');
  assert(rb.draining >= 1 || rb.ribbons.every((r) => r.n === 0),
    'arrived ribbons drain as afterimages (or already finished)');
  const drainFrames = Math.ceil(L.ribbonFade / DT) + 3;
  for (let f = 0; f < drainFrames; f++) bullets.updateBossBullets(DT, player);
  rb = bullets.debugWispRibbons();
  assertEq(rb.active + rb.draining, 0, 'afterimages fully drain and free the pool');
  ok('T-W6 ribbon lifecycle: claim → track → afterimage drain → pool freed');
  bullets.resetBossBullets();
}

// --- T-W7 — impact drum-roll: staggered presentation + lockStrike arpeggio ----
// Damage lands same-frame (the LAW, proven by T-W2); the impact FX + strike
// notes stagger at impactStaggerMs so N landings read as a roll, not one boom.
{
  const strikes = [];   // { k, frame }
  let frameNow = 0;
  on('lockStrike', (e) => strikes.push({ k: e.k, frame: frameNow }));
  for (let i = 0; i < 3; i++) spawnWisp(i, 0, 13, 28.5);   // same target → same arrival frame
  for (frameNow = 1; frameNow <= 90 && strikes.length < 3; frameNow++) {
    bullets.updateBossBullets(DT, player);
  }
  assertEq(strikes.length, 3, 'three landings emit three lockStrike notes');
  assertEq(strikes.map((s) => s.k).join(','), '0,1,2', 'strike ks ascend 0,1,2 (the arpeggio order)');
  assert(strikes[2].frame - strikes[0].frame >= 2,
    `the roll spans ≥2 frames (k0 @${strikes[0].frame}, k2 @${strikes[2].frame} — staggered, not one boom)`);
  ok('T-W7 impact drum-roll: 3 staggered strikes, ascending ks');
  bullets.resetBossBullets();
}

// --- T-V4 — lock-snap parry seam (PR4): reflectBossBullets returns the source
// parts of PERFECTLY parried ambers only (the owner-ruled perfect-only trigger).
{
  const spawnAmber = (rel, part) => bullets.spawnBossBullet({
    owner: 'boss', x: player.position.x, y: player.position.y, rel,
    vx: 0, vy: 0, vrel: -10, reflectable: true, dmg: 4, r: 0.6, life: 4, part,
  });
  const perfectRel = CONFIG.BOSS.perfectParryRel;
  spawnAmber(perfectRel * 0.5, 'ribPivotL1');            // inside the perfect window
  spawnAmber(perfectRel * 0.5, 'ribPivotL1');            // duplicate part → deduped
  spawnAmber(CONFIG.BOSS.reflectWindow * 0.9, 'ribPivotR1');   // parried, NOT perfect
  spawnAmber(perfectRel * 0.5, null);                    // perfect but untagged → skipped
  const r = bullets.reflectBossBullets(player, CONFIG.BOSS.reflectWindow, B.settleGap, 0, 13);
  assertEq(r.total, 4, 'all four ambers parried');
  assertEq(r.perfect, 3, 'three inside the perfect window');
  assertEq(r.snapParts.join(','), 'ribPivotL1', 'snapParts = PERFECT + tagged + deduped only');
  ok('T-V4 reflect seam: perfect-only, tagged-only, deduped snap parts');
  bullets.resetBossBullets();
}

// --- T-V4b — paintFromParry state machine (headless, the runLock-equivalent) --
{
  lock.initLockLayer();
  const paints = [];
  on('lockPaint', (p) => { if (p && p.snap) paints.push(p); });
  const ORGANS = { A: { x: 0, y: 0, z: 0 }, B: { x: 3, y: 0, z: 0 } };
  const model = { partWorldPos: (p, out) => { const o = ORGANS[p]; if (!o) return null; out.x = o.x; out.y = o.y; out.z = o.z; return out; } };
  const mkCtx = (over = {}) => ({
    fightRunning: true, model, candidates: ['A', 'B'], muted: false,
    emittersLive: true, exposureWindow: false, damageBoss() {}, flashPart() {},
    tier: 2, cap: 2, deflected: false, phaseHp: 100, paintUnlocked: true,
    paintables: ['A', 'B'], amberVenting: (p) => p === 'A',   // A VENTS the whole time
    fireLance() {}, ...over,
  });
  const p0 = { position: { x: 50, y: 50 } };   // parked far away — no dwell interference
  lock.updateLockLayer(0.06, p0, mkCtx());     // one frame arms S.cap/fightRunning
  // The C3 proof: the VENTING organ (dwell-exempt) snap-paints.
  assert(lock.paintFromParry('A') === true && lock.lockCount() === 1, 'snap paints the VENTING organ (C3)');
  assert(paints.length === 1 && paints[0].snap === true, 'snap paint emits lockPaint{snap:true}');
  // Snap onto an existing pip refreshes its decay instead.
  for (let f = 0; f < 20; f++) lock.updateLockLayer(0.06, p0, mkCtx());   // age the pip 1.2s
  assert(lock.paintFromParry('A') === true, 'snap onto an existing pip returns true (refresh)');
  lock.updateLockLayer(0.06, p0, mkCtx());
  const life = lock.lockHudState().locks[0].life;
  assert(life > 0.95, `refresh reset the pip's decay (life ${life.toFixed(3)})`);
  // Cap-full snap is refused; deflected snap is refused.
  assert(lock.paintFromParry('B') === true && lock.lockCount() === 2, 'second organ snaps to cap');
  assert(lock.paintFromParry('C') === false, 'cap-full snap of a NEW organ is refused');
  lock.updateLockLayer(0.06, p0, mkCtx({ deflected: true }));
  assert(lock.paintFromParry('B') === false, 'sealed boss refuses the snap (sealed honesty)');
  ok('T-V4b paintFromParry: C3 venting paint, refresh, cap, sealed-refusal');
}

// --- T-F1 — V5 FOCUS halves the effective dwell (PR5) --------------------------
{
  const ORGANS = { A: { x: 0, y: 0, z: 0 } };
  const model = { partWorldPos: (p, out) => { const o = ORGANS[p]; if (!o) return null; out.x = o.x; out.y = o.y; out.z = o.z; return out; } };
  // paintUnlocked false → a pure V1 aim test (a completed dwell would otherwise
  // PAINT and paint-hop-release the aim the same frame it locks).
  const mkCtx = (focus) => ({
    fightRunning: true, model, candidates: ['A'], muted: false, emittersLive: true,
    exposureWindow: false, damageBoss() {}, flashPart() {}, tier: 2, cap: 3,
    deflected: false, phaseHp: 100, paintUnlocked: false, paintables: ['A'],
    amberVenting: () => false, fireLance() {}, focusHeld: focus,
  });
  const pl = { position: { x: 0, y: 0 } };
  const run = (focus, frames) => {
    lock.initLockLayer();
    for (let f = 0; f < frames; f++) lock.updateLockLayer(0.03, pl, mkCtx(focus));
    return { held: lock.lockAimHeld(), dwell: lock.lockHudState().dwell };
  };
  const focused = run(true, 6);     // 0.18s ≥ dwellTime×0.5 (0.175) → held
  const unfocused = run(false, 6);  // 0.18s < 0.35 → not held
  assert(focused.held === true, 'FOCUS: 0.18s dwell locks (threshold halved)');
  assert(unfocused.held === false, 'no focus: 0.18s is still short of 0.35');
  assert(focused.dwell >= 0.999, `HUD honesty: the fill completes exactly when the focused lock does (${focused.dwell.toFixed(3)})`);
  assert(unfocused.dwell < 0.6, 'HUD honesty: unfocused fill shows the full climb');
  assert(L.focusArmMs > 260, `hysteresis LAW: focusArmMs ${L.focusArmMs} > the 260ms tap ceiling`);
  ok('T-F1 focus halves the dwell threshold; HUD fill matches; arm-gap LAW holds');
}

// --- T-E1 — perfect release: a MANUAL loose on the beat (PR5) ------------------
{
  const ORGANS = { A: { x: 0, y: 0, z: 0 }, B: { x: 10, y: 0, z: 0 } };
  const model = { partWorldPos: (p, out) => { const o = ORGANS[p]; if (!o) return null; out.x = o.x; out.y = o.y; out.z = o.z; return out; } };
  const run = (beatOn, phaseHp, viaTap) => {
    lock.initLockLayer();
    const lances = [], volleys = [];
    on('lockVolley', (p) => volleys.push(p));
    const mkCtx = () => ({
      fightRunning: true, model, candidates: ['A', 'B'], muted: false, emittersLive: true,
      exposureWindow: false, damageBoss() {}, flashPart() {}, tier: 2, cap: 2,
      deflected: false, phaseHp, paintUnlocked: true, paintables: ['A', 'B'],
      amberVenting: () => false, fireLance: (part, dmg) => lances.push(dmg), beatOn,
    });
    const step = (px, frames) => { const p = { position: { x: px, y: 0 } };
      for (let f = 0; f < frames; f++) lock.updateLockLayer(0.06, p, mkCtx()); };
    step(0, 20); step(10, 20);            // paint A then B (cap 2 → fuse arms)
    if (viaTap) { lock.requestLoose(); step(10, 4); }
    else step(10, 25);                    // let the CAP fuse auto-release instead
    return { lances, volley: volleys.find((v) => v && v.count === 2) };
  };
  const onBeatTap = run(true, 100, true);
  assert(onBeatTap.volley && onBeatTap.volley.perfect === true && onBeatTap.volley.source === 'tap',
    'a manual loose on the beat is a PERFECT release');
  assert(Math.abs(onBeatTap.lances[0] - L.lanceDmg * L.beatMult) < 1e-9,
    `beat volley dmg ${onBeatTap.lances[0]} = lanceDmg × beatMult`);
  const offBeatTap = run(false, 100, true);
  assert(offBeatTap.volley && !offBeatTap.volley.perfect && Math.abs(offBeatTap.lances[0] - L.lanceDmg) < 1e-9,
    'off-beat manual loose is the plain volley');
  const onBeatCap = run(true, 100, false);
  assert(onBeatCap.volley && onBeatCap.volley.source === 'cap' && !onBeatCap.volley.perfect,
    'an AUTO (cap-fuse) release never claims the beat — perfect is the PLAYER\'s timing');
  const clamped = run(true, 30, true);
  assert(Math.abs(clamped.lances[0] - (L.volleyRoiFrac * 30) / 2) < 1e-6,
    `the ROI clamp is ABSOLUTE: on-beat at 30hp phase still lands ${clamped.lances[0]} (≤ 10% law)`);
  ok('T-E1 beat release: tap-only, ×beatMult inside the ROI clamp, auto releases exempt');
}

console.log(`\n${n} wisp checks passed.`);
