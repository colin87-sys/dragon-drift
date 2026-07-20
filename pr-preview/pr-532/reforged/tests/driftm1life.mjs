// M1 kill-time A/B on the LIVE lifecycle (Fable pre-assessment assertion 4). Drives a
// representative trio to a real kill under three arms and proves M1 shortens the fight a
// BOUNDED amount WITHOUT skipping phases: surges stay >=3 and every card resolves in the
// full-DRIFT arm (the shield-gate holds because M1 is fever-excluded). Reuses boss.mjs's
// shim + driver pattern; the immortal-player harness isolates the boss economy.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';

const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.window = globalThis;
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
// Every element lookup returns a stub (not null) so ui.js's cached els — incl. the damage
// vignette an immortal-player bullet hit touches — never throw.
const stubEl = () => ({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, getContext: () => ctx2d, appendChild() {}, removeChild() {}, setAttribute() {}, removeAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelector: () => stubEl(), querySelectorAll: () => [], remove() {}, textContent: '', innerHTML: '' });
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {}, body: stubEl(), getElementById: () => stubEl(), querySelector: () => stubEl(), querySelectorAll: () => [], createElement: () => stubEl() };
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear() };
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };

const THREE = await import('three');
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');
const { CONFIG } = await import('../js/config.js');
const { game } = await import('../js/gameState.js');
const { on, emit } = await import('../js/events.js');
await import('../js/collision.js');
const bullets = await import('../js/bossBullets.js');
const boss = await import('../js/boss.js');
const { ui } = await import('../js/ui.js');
ui.bossBanner = () => {}; ui.damageFlash = () => {}; ui.feverStart = () => {};
ui.parryPopup = () => {}; ui.gatePopup = () => {}; ui.orbFlash = () => {};
const { input } = await import('../js/input.js');
const { initParticles } = await import('../js/particles.js');
const { initDrift, driftValue } = await import('../js/drift.js');
initDrift();
const fakeScene = { add() {}, remove() {} };
initParticles({ add() {} });
bullets.initBossBullets(fakeScene);
boss.initBoss(fakeScene);

let surgesSeen = 0, killsSeen = 0;
on('surge', () => { surgesSeen++; });
on('bossDefeated', () => { killsSeen++; });
const cardsResolved = [];
on('bossCard', (p) => { if (p && p.id) cardsResolved.push(p.id); });

const makePlayer = () => ({ position: new THREE.Vector3(0, 8, 0), velocity: new THREE.Vector2(0, 0), dist: 0, rollInvuln: 0 });

// drive one kill; pinD=true keeps DRIFT pinned high every frame (a flawless pilot) via
// the REAL feed pipeline — a captured card each frame; bleed is paused in-boss so it holds.
function driveKill(idx, pinD) {
  game.inBoss = false; game.reset(); game.state = 'playing'; game.health = 1e9;
  const player = makePlayer();
  boss.forceBoss(player, idx);
  const surges0 = surgesSeen, kills0 = killsSeen; cardsResolved.length = 0;
  let t = 0, sawShield = false;
  for (let i = 0; i < 60 * 340 && !(killsSeen > kills0 && !game.inBoss); i++) {
    const dt = 1 / 60; t += dt;
    player.dist += CONFIG.BOSS.cruiseSpeed * dt;
    if (pinD) emit('bossCard', { id: '__pin', captured: true });   // pin D→1 through the feeds
    if (game.feverActive) { game.feverTimer -= dt; if (game.feverTimer <= 0) game.feverActive = false; }
    const st = boss.bossDebugState();
    if (st.shielded) { sawShield = true; game.consecutiveRings = game.feverThreshold; input.surgeTap = true; }
    boss.updateBoss(dt, player, t);
  }
  return { t, sawShield, surges: surgesSeen - surges0, killed: killsSeen > kills0,
    cards: cardsResolved.filter((id) => id !== '__pin'), dPinned: driftValue() };
}

// A representative trio: the slot-1 tier-2 opener, a mid tier-3, and the multi-form apex.
const trio = ['voidmaw', BOSS_ORDER.find((k) => BOSSES[k].tier === 3) || BOSS_ORDER[5], 'unmasked']
  .filter((k) => BOSS_ORDER.includes(k));

for (const key of trio) {
  const idx = BOSS_ORDER.indexOf(key);

  CONFIG.DRIFT.enabled = false;
  const off = driveKill(idx, false);
  assert(off.killed, `${key}: kills with DRIFT off`);

  CONFIG.DRIFT.enabled = true;
  const on = driveKill(idx, true);
  assert(on.dPinned > 0.9, `${key}: D pinned high through the fight (${on.dPinned.toFixed(2)})`);
  assert(on.killed, `${key}: still kills with DRIFT on + pinned`);
  assert(on.sawShield, `${key}: still raises phase-floor shields`);
  assert(on.surges >= 3, `${key}: still needs >=3 Surges — M1 can't chip past a phase (got ${on.surges})`);
  if (BOSSES[key].cards) {
    const want = BOSSES[key].cards.map((c) => c.id);
    assert(want.every((id) => on.cards.includes(id)),
      `${key}: every card still resolves with M1 hot (${on.cards.length}/${want.length})`);
  }
  const ratio = on.t / off.t;
  console.log(`  · ${key}: killTime on/off = ${ratio.toFixed(3)}  (off ${off.t.toFixed(1)}s → on ${on.t.toFixed(1)}s, surges ${on.surges})`);
  // BAND: M1 shortens the fight (<=1.00 within sim noise) but never guts it (>=0.80).
  assert(ratio <= 1.02, `${key}: M1 does not LENGTHEN the fight (${ratio.toFixed(3)})`);
  assert(ratio >= 0.80, `${key}: M1 does not gut the fight (${ratio.toFixed(3)} >= 0.80)`);
}

CONFIG.DRIFT.enabled = false;
console.log('driftm1life.mjs: all assertions passed');
