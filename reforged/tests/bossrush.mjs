// Headless test for Boss Rush (the gauntlet mode). Drives a rush end to end —
// unlocked roster → bosses back-to-back with breathers → 'rushClear' — asserting
// every unlocked boss is fought once and the run ends as a WIN in bounded time.
// The controller logic runs for real (THREE objects); the HUMAN judges feel on
// the preview (menu entry, breather pacing, the win recap).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert, assertEq } from './shim.mjs';

// Same DOM/canvas/localStorage shim as boss.mjs so the ui/sfx tree imports clean.
const grad = () => ({ addColorStop() {} });
const ctx2d = new Proxy({}, { get(_, p) { return (p === 'createRadialGradient' || p === 'createLinearGradient' || p === 'createPattern') ? grad : () => {}; }, set() { return true; } });
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, body: { appendChild() {}, classList: { add() {} }, dataset: {} }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, getContext: () => ctx2d, appendChild() {}, setAttribute() {}, addEventListener() {} }) };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { BOSS_ORDER } = await import('../js/bossDefs.js');
const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { on } = await import('../js/events.js');
const { saveData } = await import('../js/save.js');
const boss = await import('../js/boss.js');
const { ui } = await import('../js/ui.js');
const { input } = await import('../js/input.js');
const { initParticles } = await import('../js/particles.js');
initParticles({ add() {} });
ui.bossNote = () => {}; ui.bossWarning = () => {}; ui.feverStart = () => {}; ui.staminaBoss = () => {};
ui.damageFlash = () => {}; ui.surgeReady = () => {}; ui.surgeLost = () => {}; ui.bossNoteClear = () => {};

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const fakeScene = { add() {}, remove() {} };
const player = { position: new THREE.Vector3(0, 8, 0), velocity: new THREE.Vector2(0, 0), dist: 0, rollInvuln: 0 };

// --- 1. roster gating: locked with no kills, unlocks per beaten boss ----------
saveData.bossRush = { beaten: [], cleared: 0, bestClearMs: 0 };
boss.setRushUnlockAll(false);
assert(boss.rushRoster().length === 0, 'no bosses beaten → empty rush roster (mode locked)');
assert(!boss.rushUnlocked(), 'rush is locked until the first boss is beaten');
saveData.bossRush.beaten = [BOSS_ORDER[0]];
assertEq(boss.rushRoster().length, 1, 'beating one boss puts exactly it in the roster');
boss.setRushUnlockAll(true);
assertEq(boss.rushRoster().length, BOSS_ORDER.length, 'dev unlock exposes every boss');
// P2 fix: the in-app Settings dev toggle must unlock the PANEL chips too, not just
// the rail — rushRosterInfo().unlocked has to use the same predicate as rushRoster.
boss.setRushUnlockAll(false);
saveData.bossRush.beaten = [];
saveData.settings = { ...(saveData.settings || {}), dev: true };
assert(boss.rushRosterInfo().bosses.every((b) => b.unlocked), 'Settings dev toggle unlocks every panel chip (not ???)');
saveData.settings.dev = false;
boss.setRushUnlockAll(true);
ok(`roster gating: locked→1→all (${BOSS_ORDER.length} bosses); settings-dev unlocks chips`);

// --- 2. drive a full rush to a WIN -------------------------------------------
game.reset();
game.state = 'playing';
game.mode = 'rush';
game.health = 1e9;              // immortal player → we test the gauntlet flow, not survival
boss.initBoss(fakeScene);
boss.setRushUnlockAll(true);
boss.startBossRush(player);
assert(boss.inBossRush(), 'startBossRush arms the gauntlet driver');

let defeated = 0, rushClear = null, fights = new Set();
on('bossDefeated', (e) => { defeated++; if (e && e.id) fights.add(e.id); });
on('rushStart', () => {});
on('bossStart', (e) => { if (e && e.id) fights.add(e.id); });
on('rushClear', (e) => { rushClear = e; });

let t = 0;
// Frame budget: ~80s/boss + breathers. Raised 260→320s when CRAGHOLD (boss 3)
// joined; raised 320→440s when MARROWCOIL (boss 4) joined; raised 440→640s when
// EITHERWING (boss 5, the Colossi PEAK) joined — hp 330 + the figure-eight
// moving-station runs ~120s solo, so the 5-boss gauntlet clears well past the old cap.
// Raised 640→800s when THRUMSWARM (boss 7) joined; 800→980s when BRINEHOLM (boss 8,
// a Calamity — hp 410, the slowest TIDAL-DRONE cadence) joined the tail (8 bosses now).
for (let i = 0; i < 60 * 980 && !rushClear; i++) {
  const dt = 1 / 60;
  t += dt;
  player.dist += CONFIG.BOSS.cruiseSpeed * dt;     // forward flight crosses the boss/breather marks
  if (game.feverActive) { game.feverTimer -= dt; if (game.feverTimer <= 0) game.feverActive = false; }
  const st = boss.bossDebugState();
  if (st.shielded) { game.consecutiveRings = game.feverThreshold; input.surgeTap = true; }  // unleash to break shields
  boss.updateBoss(dt, player, t);
}
assert(rushClear !== null, 'the rush ends by emitting rushClear');
assert(!rushClear.solo, 'a full-gauntlet clear is NOT flagged solo (earns the gauntlet rewards)');
assertEq(rushClear.count, BOSS_ORDER.length, `rushClear reports all ${BOSS_ORDER.length} bosses cleared`);
assertEq(defeated, BOSS_ORDER.length, `every unlocked boss was defeated exactly once (${defeated})`);
assertEq(fights.size, BOSS_ORDER.length, 'each distinct boss appeared in the gauntlet');
assert(!game.inBoss, 'the overlay is torn down when the rush ends');
ok(`full gauntlet: ${BOSS_ORDER.length} bosses back-to-back → rushClear at ~${t.toFixed(0)}s`);

// --- 3. pick a SINGLE boss (roster panel "fight one solo") -------------------
game.reset();
game.state = 'playing';
game.mode = 'rush';
game.health = 1e9;
player.dist = 0; player.position.set(0, 8, 0);
const only = BOSS_ORDER[BOSS_ORDER.length - 1];   // the LAST boss → proves it's not just index 0
let d2 = 0, rc2 = null; const f2 = new Set();
on('bossDefeated', (e) => { d2++; if (e && e.id) f2.add(e.id); });
on('bossStart', (e) => { if (e && e.id) f2.add(e.id); });
on('rushClear', (e) => { rc2 = e; });
boss.startBossRush(player, only);
let t2 = 0;
for (let i = 0; i < 60 * 180 && !rc2; i++) {
  const dt = 1 / 60; t2 += dt;
  player.dist += CONFIG.BOSS.cruiseSpeed * dt;
  if (game.feverActive) { game.feverTimer -= dt; if (game.feverTimer <= 0) game.feverActive = false; }
  const st = boss.bossDebugState();
  if (st.shielded) { game.consecutiveRings = game.feverThreshold; input.surgeTap = true; }
  boss.updateBoss(dt, player, t2);
}
assert(rc2 !== null, 'single-boss pick ends by emitting rushClear');
assertEq(rc2.count, 1, 'a single-boss pick clears exactly 1 boss');
assertEq(d2, 1, 'exactly one boss defeated on a single pick');
assert(f2.size === 1 && f2.has(only), `only the picked boss (${only}) was fought`);
// P1 fix: a solo pick from a MULTI-boss roster is flagged solo (so main.js withholds
// the gauntlet-clear rewards) and names the boss for the win recap.
assert(rc2.solo === true, 'a single pick from a multi-boss roster is flagged solo');
assert(typeof rc2.name === 'string' && rc2.name.length > 0, 'the solo clear names the boss (recap)');
ok(`single-boss pick: fought only ${only} → rushClear solo, count 1`);

console.log(`\n${n} boss-rush checks passed.`);
