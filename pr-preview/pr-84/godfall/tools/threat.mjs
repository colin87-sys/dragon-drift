const ctx2d = () => new Proxy({}, { get(t,k){ if(k==='createRadialGradient'||k==='createLinearGradient') return ()=>({addColorStop(){}}); return ()=>{};}, set(){return true;} });
const canvasStub = () => ({ width:0, height:0, style:{}, getContext:()=>ctx2d(), isConnected:false, addEventListener(){} });
globalThis.window = { addEventListener(){}, removeEventListener(){}, innerWidth:1280, innerHeight:720, devicePixelRatio:1, location:{search:''} };
globalThis.document = { addEventListener(){}, removeEventListener(){}, hidden:false, createElement:()=>canvasStub(), body:{appendChild(){}, classList:{add(){},toggle(){}}} };
globalThis.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };

const THREE = await import('three');
const { shell } = await import('../js/shell.js');
const input = await import('../js/input.js');
const particles = await import('../js/particles.js');
const tele = await import('../js/telegraphs.js');
const heroMod = await import('../js/hero.js');
const combatMod = await import('../js/combat.js');
const bossMod = await import('../js/boss.js');
const { cam } = await import('../js/camera.js');
const { game } = await import('../js/state.js');
const { LEVIATHAN } = await import('../js/bosses/leviathan.js');

const scene = new THREE.Scene();
particles.initParticles(scene);
tele.initTelegraphs(scene);
bossMod.initBoss(scene);
heroMod.initHero(scene);
cam.init(new THREE.PerspectiveCamera(70, 16/9, 0.1, 1000));

async function run(label, opts) {
  bossMod.loadBoss(LEVIATHAN);
  combatMod.applyEquipment();
  game.resetFight('leviathan');
  bossMod.resetBossFight();
  combatMod.resetCombat();
  bossMod.beginFighting();
  const combat = combatMod.combat, boss = bossMod.boss;
  let time = 0; const dt = 1/60; let deaths = 0;
  input.input.kx = opts.strafe; input.input.ky = 0;
  for (let i = 0; i < 60 * 120 && boss.hp > 0; i++) {
    time += dt; game.time += dt;
    shell.update(dt);
    if (opts.attack && i % 20 === 0) input.pressAction('attack');
    if (opts.dodge && i % opts.dodge === 0) input.pressAction('dodge');
    if (opts.warp && i % opts.warp === 0) input.pressAction('warp');
    if (opts.vertical && i % 75 === 0) input.input.ky = -input.input.ky || (i % 150 ? 0.7 : -0.7);
    combatMod.updateCombat(dt, dt, time);
    if (combat.dead) { deaths++; combat.dead = false; combat.hp = combat.hpMax; combat.controlEnabled = true; }
    bossMod.updateBoss(dt, time, combatMod.getHeroState());
    heroMod.updateHero(dt, time);
    cam.update(dt, heroMod.hero, boss.aimPoint);
    particles.updateParticles(dt);
  }
  console.log(`${label.padEnd(34)} bossHP ${String(Math.round(boss.hp)).padStart(4)}/4800  heroDeaths ${deaths}  hitsTaken ${game.hitsTaken}  dmgTaken ${Math.round(game.damageTaken)}  phase ${boss.phase}`);
}

await run('AFK (no input at all)', { strafe: 0 });
await run('pure strafe, no defense', { strafe: 0.65, attack: true });
await run('strafe + vertical, no defense', { strafe: 0.65, attack: true, vertical: true });
await run('strafe + dodge sometimes', { strafe: 0.65, attack: true, dodge: 130 });
await run('full bot (dodge+warp)', { strafe: 0.65, attack: true, dodge: 130, warp: 90 });
