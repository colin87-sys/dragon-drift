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
function spawnWisp(i, tx, ty, targetRel, volley = null) {
  const a = L.lanceFanDeg[i % L.lanceFanDeg.length] * (Math.PI / 180);
  return bullets.spawnBossBullet({
    owner: 'lance', x: player.position.x - 0.6, y: player.position.y + 0.4, rel: 1.5,
    vx: Math.cos(a) * L.lanceFanSpeed, vy: Math.sin(a) * L.lanceFanSpeed, vrel: B.bossSpeed,
    targetRel, tx, ty,
    color: 0x50ffaa, coreColor: 0xeafff6, dmg: 2, r: 0.5, life: 4, part: 'organ' + i,
    homeDelay: L.lanceHomeDelay,
    curl: (i % 2 ? -1 : 1) * L.lanceCurlRate,
    // PR9 presentation tags (finale detect) — null = the legacy untagged spawn,
    // which the older tests use on purpose (partial/untagged = shipped behavior).
    ...(volley ? { volleyN: volley.n, volleyFull: volley.full, volleyFirst: i === 0 } : {}),
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
assert(L.paintCooldown >= 0.15 && L.paintCooldown <= 0.6, `paintCooldown ${L.paintCooldown} within TUNE range [0.15, 0.6]`);
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
  // PR6 type-guard: a NUMERIC tag (hollowgate pane amber) can never become a
  // phantom pip — callers bridge indices to node names first.
  lock.updateLockLayer(0.06, p0, mkCtx());
  assert(lock.paintFromParry(3) === false && lock.lockCount() === 2,
    'numeric snap tag is refused (no phantom pip)');
  // PR6 dropLockPart: a destroyed destructible organ sheds its brand silently.
  assert(lock.dropLockPart('A') === true && lock.lockCount() === 1, 'dropLockPart removes the dead organ\'s pip');
  assert(lock.dropLockPart('Z') === false, 'dropLockPart on an unbranded organ is a no-op');
  ok('T-V4b paintFromParry: C3 venting paint, refresh, cap, sealed-refusal, numeric guard, corpse-drop');
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

// --- T-E2 — BEAT-ALIGNED INHALE (PR-B/C1 revised + the PR9.1 skill LAW) --------
// The beat-lock now lives in the FUSE: a ctx `beatFuseDur` sets the inhale length
// (it ends on the beat), then the cap auto-release fires IMMEDIATELY + a small
// void (D = releaseGapMs) — no dead post-fuse hold (which read as lag). So a
// SHORTER aligned fuse fires SOONER than the plain capFuse, and the drop delay is
// just the void. A ctx WITHOUT the field (headless / music off / v1) → plain
// capFuse, delay 0, byte-verbatim. A MANUAL tap is NEVER delayed (the tap is the
// player's timing); an on-beat PERFECT tap earns the impact-roll grid-snap.
{
  const ORGANS = { A: { x: 0, y: 0, z: 0 }, B: { x: 10, y: 0, z: 0 } };
  const model = { partWorldPos: (p, out) => { const o = ORGANS[p]; if (!o) return null; out.x = o.x; out.y = o.y; out.z = o.z; return out; } };
  const DTL = 0.06;
  const gap = CONFIG.LOCK.releaseGapMs / 1000;
  const run = (grid, viaTap) => {
    lock.initLockLayer();
    const launches = [], volleys = [], launchEvts = [];
    let frame = 0, fireFrame = -1;
    on('lockVolley', (p) => { if (p && p.count === 2 && fireFrame < 0) fireFrame = frame; volleys.push(p); });
    on('lockLaunch', (p) => launchEvts.push({ ...p, frame }));
    const mkCtx = () => ({
      fightRunning: true, model, candidates: ['A', 'B'], muted: false, emittersLive: true,
      exposureWindow: false, damageBoss() {}, flashPart() {}, tier: 2, cap: 2,
      deflected: false, phaseHp: 100, paintUnlocked: true, paintables: ['A', 'B'],
      amberVenting: () => false,
      fireLance: (part, dmg, i, nn, full, snap) => launches.push({ frame, i, full, snap }),
      ...grid,
    });
    const step = (px, frames) => { const p = { position: { x: px, y: 0 } };
      for (let f = 0; f < frames; f++) { frame++; lock.updateLockLayer(DTL, p, mkCtx()); } };
    step(0, 20); step(10, 20);                    // paint A then B (cap 2)
    if (viaTap) { lock.requestLoose(); step(10, 20); }
    else step(10, 50);                            // the cap fuse auto-releases
    return { launches: launches.slice(0, 2), launchEvt: launchEvts[0],
      volley: volleys.find((v) => v && v.count === 2), fireFrame };
  };
  // A short aligned fuse (0.5s) fires SOONER than the plain 1.0s capFuse — the
  // beat-lock stretched the inhale, not a dead wait after it (the lag fix).
  const aligned = run({ beatFuseDur: 0.5 }, false);
  const plain = run({}, false);                       // no field = plain capFuse, verbatim
  assert(Math.abs(aligned.volley.delay - gap) < 1e-9, 'aligned cap: delay = the VOID (releaseGapMs), not a long hold');
  assertEq(plain.volley.delay, 0, 'no beatFuseDur (headless) → delay 0, byte-verbatim');
  assert(aligned.fireFrame < plain.fireFrame,
    `the 0.5s aligned fuse fires SOONER than the plain 1.0s fuse (${aligned.fireFrame} < ${plain.fireFrame}) — no dead post-fuse hold`);
  assert(aligned.volley.full === true && plain.volley.full === true, 'cap-2 with 2 pips is a FULL volley');
  assert(aligned.launchEvt && aligned.launchEvt.full === true && aligned.launchEvt.count === 2,
    'lockLaunch fires with {count, full}');
  assert(aligned.launches[0].snap === true, 'a cap auto-release is snap-eligible (the game timed it)');
  // PR9.1 skill LAW: a MANUAL tap is NEVER delayed. Use a long fuse so the cap
  // can't auto-fire before the tap is injected.
  const tap = run({ beatFuseDur: 2.0 }, true);
  assertEq(tap.volley.delay, 0, 'manual tap: delay 0 ALWAYS — the tap is the player\'s timing');
  assert(tap.launches[0].snap === false, 'an off-beat manual volley never snaps the impact roll');
  assert(tap.launches[0].full === true, 'fireLance threads full through the queue');
  const perfectTap = run({ beatFuseDur: 2.0, beatOn: true }, true);
  assertEq(perfectTap.volley.delay, 0, 'a perfect tap is still never delayed');
  assert(perfectTap.volley.perfect === true && perfectTap.launches[0].snap === true,
    'a PERFECT tap earns the on-grid impact roll (the reward, not a freebie)');
  ok('T-E2 beat-aligned inhale: aligned fuse fires sooner (no lag), taps instant, snap earned by perfect');
}

// --- T-W7b — impact-roll FALLBACK: no beat clock → the shipped 40ms stagger ----
// Headless has no music, so the accelerando path must be dormant: the queue's
// scheduled offsets are EXACTLY k × impactStaggerMs (T-W7 proved order/spread;
// this pins the arithmetic so the musical path can never leak into CI).
{
  for (let i = 0; i < 3; i++) spawnWisp(i, 0, 13, 28.5, { n: 3, full: false });
  // Slot 0 (t=0) fires inside the SAME update that queues it — snapshot the
  // survivors (k1, k2) on the arrival frame and pin their scheduled offsets.
  let queued = null;
  for (let f = 0; f < 90 && !queued; f++) {
    bullets.updateBossBullets(DT, player);
    const q = bullets.debugWispRibbons().impactQueue;
    if (q.length) queued = q;
  }
  assert(queued && queued.length === 2 && queued[0].k === 1 && queued[1].k === 2,
    'arrival frame: k0 fired immediately, k1/k2 queued');
  for (const q of queued) {
    const want = q.k * (L.impactStaggerMs / 1000) - DT;   // one decrement on the arrival frame
    assert(Math.abs(q.t - want) < 1e-9,
      `no-clock slot ${q.k} scheduled at k×impactStaggerMs (${q.t.toFixed(4)} vs ${want.toFixed(4)})`);
  }
  ok('T-W7b no beat clock → impact roll is the shipped 40ms stagger, verbatim');
  bullets.resetBossBullets();
}

// --- T-W7c — the RESERVED FINALE tag (PR9/C2): full volleys only, last only ----
// A FULL volley's last arrival carries finale:true on its lockStrike (and owns
// the one ring INSTEAD of k0 — asserted via the queue tags); a partial volley
// never tags a finale, and untagged legacy spawns (T-W2/W7) never did.
{
  const strikes = [];
  on('lockStrike', (e) => strikes.push(e));
  const runVolley = (count, full) => {
    strikes.length = 0;
    for (let i = 0; i < count; i++) spawnWisp(i, (i % 3 - 1) * 6, 13, 28.5, { n: count, full });
    for (let f = 0; f < 120 && strikes.length < count; f++) bullets.updateBossBullets(DT, player);
    bullets.resetBossBullets();
    return strikes.slice();
  };
  const fullRun = runVolley(6, true);
  assertEq(fullRun.length, 6, 'full-6: six strikes landed');
  assertEq(fullRun.filter((s) => s.finale).length, 1, 'full-6: exactly ONE finale');
  assert(fullRun[fullRun.length - 1].finale === true, 'the finale is the LAST strike');
  assert(fullRun.every((s) => s.n === 6 && s.full === true), 'strikes carry {n, full} for the sfx phrase');
  const partial = runVolley(3, false);
  assertEq(partial.filter((s) => s.finale).length, 0, 'partial-3: no finale, no cadence');
  ok('T-W7c finale tag: full-6 → one finale (last); partial → none');
}

// --- T-W8 — THE LUNGE invariance sweep (PR-C) ----------------------------------
// The lunge profile (emerge slow → accelerate) must land every wisp on the
// IDENTICAL frame constant speed would (the L186 arrival-frame law), for any
// profile that averages 1, any target depth, any frame rate — and rel must
// climb monotonically (the controller never reverses).
{
  const saved = L.lungeProfile;
  assert(Array.isArray(saved) && Math.abs((saved[0] + saved[1]) / 2 - 1) < 1e-9,
    `lungeProfile LAW: (p0+p1)/2 === 1 (got [${saved}])`);
  let hits = 0, collecting = false;
  on('bossDamage', (e) => { if (collecting && e.kind === 'lance') hits++; });
  const arrivalFrame = (prof, targetRel, dt, ty = 13) => {
    L.lungeProfile = prof;
    bullets.resetBossBullets();
    spawnWisp(2, 0, ty, targetRel);   // slot 2 = a mild bearing
    collecting = true; hits = 0;
    let frame = 0, prevRel = -Infinity;
    while (frame < 400 && hits < 1) {
      frame++;
      bullets.updateBossBullets(dt, player);
      const w = bullets.debugActiveBullets().find((b) => b.owner === 'lance');
      if (w) {
        assert(w.rel >= prevRel - 1e-9, `rel climbs monotonically (${w.rel} after ${prevRel})`);
        prevRel = w.rel;
      }
    }
    collecting = false;
    bullets.resetBossBullets();
    return frame;
  };
  for (const targetRel of [20, 28.5, 34]) {
    for (const dt of [1 / 60, 1 / 50, 1 / 144]) {
      const ref = arrivalFrame(null, targetRel, dt);            // constant speed
      for (const prof of [saved, [0.7, 1.3]]) {
        const got = arrivalFrame(prof, targetRel, dt);
        assertEq(got, ref,
          `lunge [${prof}] @ rel ${targetRel}, dt 1/${Math.round(1 / dt)} lands on the constant-speed frame (${ref})`);
      }
    }
  }
  // The Codex cell: the nearest-organ clamp (targetRel 4 → a 2.5m flight,
  // SHORTER than one 20fps frame) — constant speed arrives on frame 1; the
  // profile must too (this is exactly where the set-vrel-for-next-step form
  // was one frame late). Target y sits by the spawn so the landing test hits.
  {
    const ref = arrivalFrame(null, 4, 1 / 20, 9);
    const got = arrivalFrame(saved, 4, 1 / 20, 9);
    assertEq(got, ref, `sub-frame flight (rel 4 @ 20fps) arrives with constant speed (frame ${ref})`);
    assertEq(ref, 1, 'the sub-frame flight really is a frame-1 arrival (the cell is honest)');
  }
  L.lungeProfile = saved;
  ok('T-W8 lunge invariance: 3 depths × 3 dts × 2 profiles + the sub-frame cell == constant-speed arrival');
}

console.log(`\n${n} wisp checks passed.`);
