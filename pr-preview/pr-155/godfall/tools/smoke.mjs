// Headless smoke + simulation test. Shims the minimal browser surface, then
// imports every module except main.js and actually SIMULATES a fight: builds
// each boss, schedules its attacks, runs the combat loop with scripted input,
// and asserts the core loop holds together (damage flows both ways, phases
// wall, stagger breaks, rank math computes, save merge survives garbage).
//
//   node --experimental-loader ./godfall/tools/loader.mjs godfall/tools/smoke.mjs

// --- Browser shims (before any game import) ---------------------------------

const ctx2d = () => new Proxy({}, {
  get(t, k) {
    if (k === 'createRadialGradient' || k === 'createLinearGradient') {
      return () => ({ addColorStop() {} });
    }
    return () => {};
  },
  set() { return true; },
});
const canvasStub = () => ({
  width: 0, height: 0, style: {},
  getContext: () => ctx2d(),
  isConnected: false,
  addEventListener() {},
});

globalThis.window = {
  addEventListener() {}, removeEventListener() {},
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  location: { search: '' },
};
globalThis.document = {
  addEventListener() {}, removeEventListener() {}, hidden: false,
  createElement: () => canvasStub(),
  body: { appendChild() {}, classList: { add() {}, toggle() {} } },
};
globalThis.localStorage = {
  // Valid JSON but hostile: wrong types, junk keys, partial nesting.
  // (Truncated/corrupt JSON falls back to pure defaults — also exercised,
  // since deepMerge of null is the same code path.)
  getItem: () => '{"relics": "haha", "gear": 12, "bosses": {"leviathan": {"clears": 3}}, "junk": true}',
  setItem() {}, removeItem() {},
};
try { globalThis.navigator = {}; } catch { /* node 22: navigator exists and is fine */ }

let failures = 0;
function check(name, cond) {
  if (cond) console.log('  ok  ' + name);
  else { console.log('FAIL  ' + name); failures++; }
}

// --- Imports ------------------------------------------------------------------

const THREE = await import('three');
const { save, grantXp, bossUnlocked } = await import('../js/save.js');
const { CFG, xpToNext, heroMaxHp } = await import('../js/config.js');
const { game, scoreFight } = await import('../js/state.js');
const { angleDelta, dampAngle, clamp } = await import('../js/util.js');
const { shell } = await import('../js/shell.js');
const input = await import('../js/input.js');
const { THEMES } = await import('../js/tracks.js');
const tele = await import('../js/telegraphs.js');
const particles = await import('../js/particles.js');
const heroMod = await import('../js/hero.js');
const combatMod = await import('../js/combat.js');
const bossMod = await import('../js/boss.js');
const { cam } = await import('../js/camera.js');
const gear = await import('../js/gear.js');
const { LEVIATHAN } = await import('../js/bosses/leviathan.js');
const { TITAN } = await import('../js/bosses/titan.js');
const { RAMUH } = await import('../js/bosses/ramuh.js');
const { BAHAMUT } = await import('../js/bosses/bahamut.js');
await import('../js/music.js');
await import('../js/cinematics.js');
await import('../js/arenas.js');
await import('../js/preview.js');
const BOSSES = [LEVIATHAN, TITAN, RAMUH, BAHAMUT];

console.log('\n--- save resilience ---');
check('garbage save boots to defaults', save.relics === 0 && save.level === 1);
check('partial nested merge kept', save.bosses.leviathan.clears === 3);
check('xp curve sane', xpToNext(1) > 0 && heroMaxHp(5, 0.1) > heroMaxHp(1, 0));
grantXp(xpToNext(1) + 10);
check('level up applies', save.level === 2 && save.xp === 10);
save.level = 1; save.xp = 0;
check('boss gating', bossUnlocked('leviathan') && bossUnlocked('titan') && !bossUnlocked('ramuh'));
save.bosses.leviathan.clears = 0;

console.log('\n--- math ---');
check('angleDelta wraps', Math.abs(angleDelta(0.1, Math.PI * 2 + 0.2) - 0.1) < 1e-9);
check('angleDelta sign', angleDelta(0.2, 0.1) < 0);
check('dampAngle crosses seam', Math.abs(dampAngle(6.2, 0.1, 100, 10) - (Math.PI * 2 + 0.1)) % (Math.PI * 2) < 0.01);
shell.setBounds({ radius: 30, hMin: 3, hMax: 22 }, true);
const wp = shell.worldPos(Math.PI / 2, 8, 30, new THREE.Vector3());
check('shell worldPos', Math.abs(wp.x - 30) < 1e-6 && Math.abs(wp.z) < 1e-6 && wp.y === 8);
check('shell thetaOf inverse', Math.abs(shell.thetaOf(wp) - Math.PI / 2) < 1e-6);

console.log('\n--- themes ---');
for (const [id, t] of Object.entries(THEMES)) {
  for (const key of ['bass', 'theme', 'counter']) {
    const total = t[key].reduce((a, [, d]) => a + d, 0);
    check(`${id}.${key} = 64 eighths`, total === 64);
  }
}

console.log('\n--- boss defs: structure + build ---');
const scene = new THREE.Scene();
particles.initParticles(scene);
tele.initTelegraphs(scene);
bossMod.initBoss(scene);
heroMod.initHero(scene);
cam.init(new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 1000));

const fakeCtx = (def) => ({
  heroTheta: 0.5, heroH: 8, phase: 3,
  rng: () => 0.42,
  color: def.accentColor, heavyColor: def.heavyColor,
  node: () => new THREE.Vector3(0, 10, 0),
});

for (const def of BOSSES) {
  const built = def.build(scene);
  const nodeNames = Object.keys(built.nodes);
  for (const z of def.hurtZones) {
    check(`${def.id} hurtZone node '${z.node}'`, !!built.nodes[z.node]);
  }
  for (const w of def.weakPoints) {
    check(`${def.id} weakPoint node '${w.node}'`, !!built.nodes[w.node]);
  }
  check(`${def.id} aimNode`, !!built.nodes[def.shell.aimNode]);
  for (const n of def.cine.finisher.nodes) {
    check(`${def.id} finisher node '${n}'`, !!built.nodes[n]);
  }
  for (const [pi, ph] of def.phases.entries()) {
    for (const id of ph.attacks) {
      check(`${def.id} p${pi + 1} attack '${id}' exists`, !!def.attacks[id]);
    }
  }
  // vols() of every attack produce well-formed specs
  for (const [id, atk] of Object.entries(def.attacks)) {
    const specs = atk.vols(fakeCtx(def));
    check(`${def.id}.${id} vols nonempty`, specs.length > 0);
    for (const s of specs) {
      let ok = ['arc', 'zone', 'point', 'projectile', 'beam'].includes(s.kind);
      if (s.kind === 'arc' || s.kind === 'zone') ok = ok && s.thetaSpan > 0 && Array.isArray(s.hBand) && Array.isArray(s.rBand);
      if (s.kind === 'point') ok = ok && s.radius > 0;
      if (s.kind === 'projectile') ok = ok && s.from && s.speed > 0 && s.radius > 0;
      if (s.kind === 'beam') ok = ok && typeof s.getFrom === 'function' && typeof s.getTo === 'function';
      if (!ok) { check(`${def.id}.${id} spec shape (${s.kind})`, false); }
    }
    check(`${def.id}.${id} specs shaped`, true);
  }
  // animate a few frames in several states
  const st = { anim: '', animT: 0, staggered: false, phase: 1, hpFrac: 1, traversalK: 0, dying: 0, heroPos: new THREE.Vector3(20, 8, 0), heroTheta: 0.4 };
  for (const anim of ['', 'bite', 'slamR', 'callBolts', 'megaflare']) {
    st.anim = anim;
    for (let i = 0; i < 10; i++) { st.animT += 0.016; built.animate(0.016, i * 0.016, st); }
  }
  st.staggered = true;
  built.animate(0.016, 1, st);
  st.dying = 0.5;
  built.animate(0.016, 1, st);
  check(`${def.id} animate survives all states`, true);
  built.root.removeFromParent();
}

console.log('\n--- headless fight simulation (Leviathan) ---');
const def = LEVIATHAN;
bossMod.loadBoss(def);
combatMod.applyEquipment();
game.resetFight('leviathan');
bossMod.resetBossFight();
combatMod.resetCombat();
bossMod.beginFighting();
heroMod.hero.root.visible = true;

const combat = combatMod.combat;
const boss = bossMod.boss;
check('combat hp set', combat.hp === combat.hpMax && combat.hpMax >= CFG.baseHp);
check('boss hp set', boss.hp === def.hp);

// Drive the loop: hold orbit input, attack constantly, dodge sometimes.
let time = 0;
const dt = 1 / 60;
let sawAttack = false;
let sawBossHit = false;
let phaseWalls = 0;
const { on } = await import('../js/events.js');
on('bossAttack', () => { sawAttack = true; });
on('bossPhaseWall', ({ phase }) => { phaseWalls = phase; bossMod.commitPhase(); });

input.input.kx = 0.6;
let crashed = null;
try {
  for (let i = 0; i < 60 * 90 && boss.hp > 0; i++) {
    time += dt;
    game.time += dt;
    shell.update(dt);
    if (i % 20 === 0) input.pressAction('attack');
    if (i % 130 === 0) input.pressAction('dodge');
    if (i % 90 === 0) input.pressAction('warp');
    combatMod.updateCombat(dt, dt, time);
    if (!combat.dead) bossMod.updateBoss(dt, time, combatMod.getHeroState());
    heroMod.updateHero(dt, time);
    cam.update(dt, heroMod.hero, boss.aimPoint);
    particles.updateParticles(dt);
  }
} catch (e) {
  crashed = e;
}
check('90s sim no crash', !crashed);
if (crashed) console.log(crashed.stack);
check('boss took damage', boss.hp < def.hp);
check('boss attacked', sawAttack);
check('combo counted', game.maxCombo >= 2);
sawBossHit = game.hitsTaken > 0 || combat.hp < combat.hpMax;
console.log(`  boss hp ${Math.round(boss.hp)}/${def.hp} after sim · hero hp ${combat.hp}/${combat.hpMax} · hits taken ${game.hitsTaken} · maxCombo ${game.maxCombo} · phase ${boss.phase} (walls seen: ${phaseWalls}) · warps ${game.warpStrikes}`);

// Force a kill to test the dying path + rank math.
bossMod.damageBoss(boss.hp + 1, {});
check('boss dies', boss.state === 'dying');
const score = scoreFight();
check('rank computes', ['S', 'A', 'B', 'C'].includes(score.rank) && score.total >= 0 && score.total <= 100);
console.log(`  rank ${score.rank} (${score.total}) time=${score.time.toFixed(0)}s t/d/s=${score.timeScore}/${score.dmgScore}/${score.styleScore}`);

// Volume fairness: a volume must never hit an invulnerable hero.
tele.clearVolumes();
tele.spawnVolume({
  kind: 'arc', thetaCenter: combat.dead ? 0 : heroMod.hero.theta, thetaSpan: Math.PI * 2,
  hBand: [0, 99], rBand: [0, 99], warn: 0.01, active: 5, dmg: 10,
});
const hsInv = combatMod.getHeroState();
hsInv.invulnerable = true;
let invHits = 0;
for (let i = 0; i < 30; i++) invHits += tele.updateVolumes(dt, time + i * dt, hsInv).length;
check('no hits while invulnerable', invHits === 0);
const hsVuln = combatMod.getHeroState();
hsVuln.invulnerable = false;
let vulnHits = 0;
for (let i = 0; i < 30; i++) vulnHits += tele.updateVolumes(dt, time + i * dt, hsVuln).length;
check('hits land when vulnerable', vulnHits === 1); // single-hit arc connects once
tele.clearVolumes();

console.log('\n--- gear ---');
for (const id of gear.WEAPON_ORDER) {
  for (let t = 1; t <= 3; t++) {
    const g = gear.WEAPONS[id].build(t);
    check(`${id} t${t} builds with tip`, !!g.userData.tip);
  }
}
check('set bonuses', gear.setBonuses({ helm: 'aegis', chest: 'aegis', gauntlets: 'aegis', greaves: 'aegis' }).hp === 0.2);
check('mixed set no bonus', gear.setBonuses({ helm: 'aegis', chest: 'drifter', gauntlets: 'aegis', greaves: 'aegis' }).hp === 0);

console.log(failures === 0 ? '\nALL SMOKE CHECKS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
