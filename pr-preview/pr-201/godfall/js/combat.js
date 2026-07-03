// Player combat controller — the feel of the game lives here.
// Owns the hero's shell position, gauges, combo, dodge/warp state machines,
// melee connect tests against boss hurt zones, and every hit's juice
// (hit-stop, shake, sparks, damage numbers, haptics) via events + helpers.

import * as THREE from 'three';
import { CFG, heroMaxHp, levelDmgMult } from './config.js';
import { shell } from './shell.js';
import { hero, rebuildHero, comboClip } from './hero.js';
import { getAxes, consumeAction, clearActions } from './input.js';
import { updateVolumes, imminentThreat } from './telegraphs.js';
import {
  boss, damageBoss, hurtZonesWorld, activeWeakPointsWorld,
  currentBeacon, advanceBeacon,
} from './boss.js';
import { game } from './state.js';
import { save, persist } from './save.js';
import { WEAPONS, WEAPON_ORDER, setBonuses } from './gear.js';
import { emit } from './events.js';
import { sfx, buzz, setSlowMo } from './sfx.js';
import { hitSparks, warpBurst, witchRipple, hurtSparks, riseMotes } from './particles.js';
import { cam } from './camera.js';
import { setWitchTime, setRadialBlur } from './postfx.js';
import { damp, clamp, angleDelta, easeOutCubic, TAU } from './util.js';

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _bez = new THREE.Vector3();

export const combat = {
  // gauges
  hp: 100,
  hpMax: 100,
  warp: 3,            // float; whole segments spendable
  armiger: 0,
  armigerActive: false,
  armigerT: 0,
  combo: 0,
  comboT: 0,

  // movement
  omega: 0,
  vh: 0,
  rKnock: 0,
  rGlide: 0,

  // action state
  swing: null,        // { step, hitDone, missed, done }
  chainT: 0,          // grace window keeping the combo string alive
  dodgeT: 0,
  dodgeCd: 0,
  dodgeDir: { x: 1, y: 0 },
  postHitT: 0,
  witchT: 0,
  warpState: null,    // { mode:'out'|'back'|'beacon', t, dur, from, to, target }
  dead: false,
  controlEnabled: true,

  // equipment cache
  weaponId: 'sword',
  weaponDef: WEAPONS.sword,
  weaponTier: 1,
  bonuses: { hp: 0, armiger: 0 },

  get invulnerable() {
    return this.dodgeT > 0 || !!this.warpState || this.postHitT > 0 || !this.controlEnabled;
  },
  get warpSegs() { return Math.floor(this.warp); },
};

// Snapshot for telegraph hit-testing.
const heroState = {
  pos: hero.pos,
  radius: CFG.heroRadius,
  invulnerable: false,
  shell: { theta: 0, h: 8, r: 30, omega: 0, vh: 0 },
};
export function getHeroState() {
  heroState.pos = hero.pos;
  heroState.invulnerable = combat.invulnerable;
  heroState.shell.theta = hero.theta;
  heroState.shell.h = hero.h;
  heroState.shell.r = hero.r;
  heroState.shell.omega = combat.omega;
  heroState.shell.vh = combat.vh;
  return heroState;
}

// --- Equipment ---------------------------------------------------------------

export function applyEquipment({ keepHpFrac = false } = {}) {
  const frac = keepHpFrac && combat.hpMax > 0 ? combat.hp / combat.hpMax : 1;
  combat.weaponId = save.gear.equippedWeapon;
  combat.weaponDef = WEAPONS[combat.weaponId] || WEAPONS.sword;
  combat.weaponTier = Math.max(1, save.gear.weapons[combat.weaponId] || 1);
  combat.bonuses = setBonuses(save.gear.armorEquipped);
  combat.hpMax = heroMaxHp(save.level, combat.bonuses.hp);
  combat.hp = Math.min(combat.hpMax, Math.max(1, Math.round(combat.hpMax * frac)));
  rebuildHero({
    weapon: { id: combat.weaponId, tier: combat.weaponTier },
    armor: save.gear.armorEquipped,
    owned: WEAPON_ORDER.filter((id) => (save.gear.weapons[id] || 0) > 0),
    weaponTiers: save.gear.weapons,
  });
}

export function cycleWeapon(opts = {}) {
  const owned = WEAPON_ORDER.filter((id) => (save.gear.weapons[id] || 0) > 0);
  if (owned.length < 2 && opts.slot === undefined) return false;
  let nextId = null;
  if (opts.slot !== undefined && opts.slot >= 0) {
    nextId = WEAPON_ORDER[opts.slot];
    if (!nextId || (save.gear.weapons[nextId] || 0) <= 0) { sfx.uiDeny(); return false; }
  } else {
    const i = owned.indexOf(combat.weaponId);
    nextId = owned[(i + (opts.step || 1) + owned.length) % owned.length];
  }
  if (!nextId || nextId === combat.weaponId) return false;
  save.gear.equippedWeapon = nextId;
  persist();
  applyEquipment({ keepHpFrac: true });
  hero.pulseArmigerRing(1.2);
  sfx.weaponCycle();
  emit('weaponChanged', { id: nextId });
  return true;
}

// --- Fight lifecycle -----------------------------------------------------------

export function resetCombat() {
  applyEquipment();
  combat.hp = combat.hpMax;
  combat.warp = CFG.warpSegments;
  combat.armiger = 0;
  combat.armigerActive = false;
  combat.armigerT = 0;
  combat.combo = 0;
  combat.comboT = 0;
  combat.omega = 0;
  combat.vh = 0;
  combat.rKnock = 0;
  combat.rGlide = 0;
  combat.swing = null;
  combat.dodgeT = 0;
  combat.dodgeCd = 0;
  combat.postHitT = 0;
  combat.witchT = 0;
  combat.warpState = null;
  combat.dead = false;
  combat.controlEnabled = true;
  hero.setArmiger(false);
  hero.setWarpStretch(0);
  hero.trailOn = false;
  hero.stopClip();
  setWitchTime(false);
  setRadialBlur(0);
  clearActions();

  // Start low-mid, where the boss's body meets the shell — melee opens the
  // fight, warps reach the rest.
  hero.theta = 0;
  hero.h = shell.hMin + (shell.hMax - shell.hMin) * 0.3;
  hero.r = shell.radius;
  placeHero();
  cam.snapTo(hero.theta, hero.h);
}

function placeHero() {
  shell.worldPos(hero.theta, hero.h, hero.r, _v);
  hero.root.position.copy(_v);
  hero.pos.copy(_v);
  hero.root.lookAt(boss.aimPoint);
}

// --- Damage out ------------------------------------------------------------------

function attackPower() {
  const base = combat.weaponDef.tiers[combat.weaponTier - 1].power;
  let m = levelDmgMult(save.level);
  m *= 1 + Math.min(combat.combo, CFG.comboCap) * CFG.comboMultPer;
  if (combat.armigerActive) m *= CFG.armigerDmg;
  return base * m;
}

function gainArmiger(n) {
  if (combat.armigerActive) return;
  combat.armiger = clamp(combat.armiger + n * (1 + combat.bonuses.armiger), 0, CFG.armigerMax);
  if (combat.armiger >= CFG.armigerMax) emit('armigerReady');
}

function addCombo() {
  combat.combo++;
  combat.comboT = CFG.comboDecay;
  game.maxCombo = Math.max(game.maxCombo, combat.combo);
  if (combat.combo > 0 && combat.combo % 10 === 0) gainArmiger(CFG.armigerPerCombo10);
  emit('combo', { n: combat.combo });
}

function dealHit(zone, weakWp, isWarp) {
  let dmg = isWarp ? combat.weaponDef.tiers[combat.weaponTier - 1].power * CFG.warpDmgMult * levelDmgMult(save.level) : attackPower();
  if (combat.armigerActive && isWarp) dmg *= CFG.armigerDmg;
  let weakMult = 1;
  let staggerGain = isWarp ? 10 : 4;
  if (weakWp) {
    weakMult = weakWp.def.dmgMult;
    staggerGain = weakWp.def.staggerGain * (isWarp ? 1 : 0.4);
    game.weakHits++;
    save.stats.weakHits++;
    gainArmiger(CFG.armigerWeakHit);
  }
  staggerGain *= combat.weaponDef.staggerMult;

  const res = damageBoss(dmg, { weakMult, staggerGain });
  addCombo();

  // --- juice ---
  const pos = zone.pos;
  const weight = isWarp ? 1 : combat.weaponId === 'greatsword' ? 0.9 : 0.4;
  _dir.copy(pos).sub(hero.pos).normalize();
  if (isWarp) warpBurst(pos, combat.weaponDef.color);
  else hitSparks(pos, combat.weaponDef.color, _dir, weight);
  emit('damageNumber', { pos: pos.clone(), amount: Math.round(res.dealt), weak: !!weakWp, warp: isWarp });
  emit('hitStop', { dur: isWarp ? CFG.hitStopWarp : weight > 0.6 ? CFG.hitStopHeavy : CFG.hitStopLight });
  cam.shake(isWarp ? 0.4 : weight > 0.6 ? CFG.shakeLight * 1.6 : CFG.shakeLight);
  buzz(isWarp ? 35 : 15);
  const hitFn = {
    sword: sfx.hitSword, spear: sfx.hitSpear,
    greatsword: sfx.hitGreatsword, daggers: sfx.hitDaggers,
  }[combat.weaponId];
  if (hitFn) hitFn();
  sfx.bossHurt(weight);

  if (res.staggerBroke) {
    game.staggersCaused++;
    emit('banner', { text: 'BREAK', gold: true });
    cam.shake(CFG.shakeHeavy);
    emit('hitStop', { dur: 0.12 });
  }
  return res;
}

// Weak point on the same node as a melee-struck zone (sigil hit by a swing).
function weakOnZone(zone) {
  for (const w of activeWeakPointsWorld()) {
    if (w.pos.distanceTo(zone.pos) < w.r + zone.r) return w.wp;
  }
  return null;
}

// --- Damage in -------------------------------------------------------------------

function takeHit(hit) {
  if (combat.dead) return;
  combat.hp = Math.max(0, combat.hp - hit.dmg);
  combat.postHitT = 0.75;
  combat.combo = 0;
  combat.comboT = 0;
  game.hitsTaken++;
  game.damageTaken += hit.dmg;
  game.lastHitBy = hit.source || '';
  combat.rKnock += hit.knockback ?? 8;
  combat.swing = null;
  hero.trailOn = false;
  hero.play('hitReact');
  _dir.copy(hero.pos).sub(boss.aimPoint).normalize();
  hurtSparks(hero.pos, _dir);
  cam.shake(hit.weight === 'spectacle' ? CFG.shakeSpectacle : hit.weight === 'heavy' ? CFG.shakeHeavy : CFG.shakeLight + 0.12);
  sfx.heroHurt();
  buzz(hit.weight === 'light' ? 25 : 60);
  emit('heroHurt', { hp: combat.hp, hpMax: combat.hpMax, dmg: hit.dmg });

  if (combat.hp <= 0) {
    combat.dead = true;
    combat.controlEnabled = false;
    hero.trailOn = false;
    setWitchTime(false);
    sfx.heroDown();
    emit('heroDied', { by: game.lastHitBy });
  }
}

// --- Dodge / witch time -------------------------------------------------------------

function tryDodge() {
  if (combat.dodgeCd > 0 || combat.warpState) return;
  const dir = consumeAction('dodge');
  if (!dir) return;
  combat.dodgeT = CFG.dodgeDuration;
  combat.dodgeCd = CFG.dodgeCooldown * combat.weaponDef.dodgeCdMult;
  combat.dodgeDir = dir;
  combat.swing = null;
  hero.trailOn = false;
  hero.stopClip();
  hero.startDodgeSpin(dir.x >= 0 ? 1 : -1);
  sfx.dodge();
  emit('dodged');

  // Perfect dodge: something was about to connect.
  const eta = imminentThreat(getHeroState(), CFG.perfectWindow);
  if (eta < CFG.perfectWindow) {
    combat.witchT = CFG.witchTime;
    game.perfectDodges++;
    save.stats.perfectDodges++;
    combat.warp = Math.min(CFG.warpSegments, combat.warp + CFG.warpPerfectRefund);
    gainArmiger(CFG.armigerPerfectDodge);
    witchRipple(hero.pos);
    sfx.perfectDodge();
    setWitchTime(true);
    setSlowMo(true);
    buzz([10, 30, 10]);
    emit('perfectDodge');
    emit('witchTime', { dur: CFG.witchTime });
  }
}

// --- Warp strike ----------------------------------------------------------------------

function pickWarpTarget() {
  const camera = cam.camera;
  const weaks = activeWeakPointsWorld();
  let best = null;
  let bestScore = -Infinity;
  const candidates = weaks.length ? weaks : hurtZonesWorld().map((z) => ({ ...z, wp: null }));
  for (const c of candidates) {
    let score = -c.pos.distanceTo(hero.pos);
    if (camera) {
      _dir.copy(c.pos).sub(camera.position).normalize();
      camera.getWorldDirection(_w);
      score += _dir.dot(_w) * 22; // favor what the player is looking at
    }
    if (c.wp) score += 30;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best;
}

function tryWarp() {
  if (consumeAction('warp') === null) return;
  if (combat.warpState) return;

  // Traversal chase: warps are free hops onto the next beacon.
  const beacon = currentBeacon();
  if (beacon) {
    shell.worldPos(beacon.theta, beacon.h, shell.radius, _v);
    startWarp({ mode: 'beacon', to: _v.clone(), beacon });
    return;
  }
  if (boss.state === 'dying' || boss.state === 'transition') return;
  if (combat.warpSegs < 1) { sfx.warpDeny(); emit('warpDenied'); return; }
  const target = pickWarpTarget();
  if (!target) { sfx.warpDeny(); return; }
  combat.warp -= 1;
  game.warpStrikes++;
  startWarp({ mode: 'out', to: target.pos.clone(), target });
}

function startWarp(opts) {
  combat.swing = null;
  hero.trailOn = false;
  combat.warpState = {
    t: 0,
    dur: opts.mode === 'beacon' ? 0.26 : CFG.warpOutTime,
    from: hero.pos.clone(),
    ...opts,
  };
  hero.play('warpPose');
  sfx.warpRiser();
  setRadialBlur(0.85);
  cam.kick(1.2);
}

function updateWarp(rawDt) {
  const ws = combat.warpState;
  if (!ws) return;
  ws.t += rawDt;
  const k = clamp(ws.t / ws.dur, 0, 1);
  const e = easeOutCubic(k);
  hero.setWarpStretch(ws.mode === 'back' ? 1 - k : Math.sin(k * Math.PI));

  // Quadratic bezier with a sideways bow so the streak reads.
  _bez.copy(ws.from).lerp(ws.to, 0.5);
  if (ws.mode !== 'back') {
    _dir.copy(ws.to).sub(ws.from).normalize();
    _w.set(-_dir.z, 0.35, _dir.x).multiplyScalar(4);
    _bez.add(_w);
  }
  _v.copy(ws.from).lerp(_bez, e).lerp(_w.copy(_bez).lerp(ws.to, e), e);
  hero.root.position.copy(_v);
  hero.pos.copy(_v);
  hero.root.lookAt(ws.mode === 'back' ? boss.aimPoint : ws.to);

  if (k >= 1) {
    if (ws.mode === 'out') {
      // Impact!
      const zone = { pos: ws.to, r: ws.target.r };
      dealHit(zone, ws.target.wp || null, true);
      sfx.warpImpact();
      cam.shake(0.5);
      // Return leg
      shell.worldPos(hero.theta, hero.h, shell.radius, _v);
      combat.warpState = { mode: 'back', t: 0, dur: CFG.warpBackTime, from: hero.pos.clone(), to: _v.clone() };
    } else if (ws.mode === 'beacon') {
      hero.theta = ws.beacon.theta;
      hero.h = ws.beacon.h;
      hero.r = shell.radius;
      placeHero();
      advanceBeacon();
      combat.warpState = null;
      hero.setWarpStretch(0);
      setRadialBlur(0);
    } else {
      combat.warpState = null;
      hero.setWarpStretch(0);
      sfx.warpReturn();
      setRadialBlur(0);
    }
  }
}

// --- Melee ----------------------------------------------------------------------------

function tryAttack() {
  if (combat.warpState || combat.dodgeT > 0) return;
  if (hero.inClip && hero.clip.hit) {
    // Combo-cancel window: the next swing may start once this one is 62% done.
    if (hero.clipT / hero.clipDur < 0.62) return;
  }
  if (consumeAction('attack') === null) return;
  const chained = combat.swing && combat.chainT > 0;
  const step = chained ? combat.swing.step + 1 : 0;
  const speed = combat.weaponDef.speed * (combat.armigerActive ? CFG.armigerSpeed : 1);
  const clip = comboClip(combat.weaponId, step);
  hero.play(clip, 1 / speed);
  combat.swing = { step: step % combat.weaponDef.comboLen, hitDone: false, missed: true };
  combat.chainT = 0;
}

function updateMelee() {
  if (!combat.swing || !hero.inClip) {
    if (combat.swing && !hero.inClip && !combat.swing.done) {
      // Swing finished; whiff feedback if nothing was hit. The combo chain
      // stays alive briefly so a follow-up press continues the string.
      if (combat.swing.missed) sfx.whiff();
      combat.swing.done = true;
      combat.chainT = 0.9;
    }
    hero.trailOn = false;
    return;
  }
  const win = hero.hitWindow();
  hero.trailOn = !!(win && win.active);
  if (!win || !win.active || combat.swing.hitDone) return;

  // Find the nearest hurt zone in reach. No facing gate: the hero is
  // hard-locked onto the boss, swings read as wide arcs, and punishing
  // "wrong shoulder" positioning on a lock-on rail only feels like whiffing.
  const reach = combat.weaponDef.reach;
  let bestZone = null;
  let bestDist = Infinity;
  for (const z of hurtZonesWorld()) {
    const d = z.pos.distanceTo(hero.pos) - z.r;
    if (d > reach + CFG.attackGlide) continue;
    if (d < bestDist) { bestDist = d; bestZone = z; }
  }
  if (!bestZone) return;

  if (bestDist <= reach) {
    combat.swing.hitDone = true;
    combat.swing.missed = false;
    dealHit(bestZone, weakOnZone(bestZone), false);
  } else {
    // Attack glide: magnet in so the blow can land this swing.
    combat.rGlide = Math.min(CFG.attackGlide, bestDist - reach + 0.4);
  }
}

// --- Armiger ----------------------------------------------------------------------------

function tryArmiger() {
  if (consumeAction('armiger') === null) return;
  if (combat.armigerActive || combat.armiger < CFG.armigerMax) { if (combat.armiger < CFG.armigerMax) sfx.uiDeny(); return; }
  combat.armigerActive = true;
  combat.armigerT = CFG.armigerDuration;
  combat.armiger = CFG.armigerMax;
  hero.setArmiger(true);
  riseMotes(hero.pos, 0x9fdcff, 22);
  sfx.armigerOn();
  buzz([20, 30, 20, 30, 60]);
  cam.shake(0.3);
  emit('armigerOn');
  emit('banner', { text: 'ARMIGER', gold: true });
}

function updateArmiger(simDt) {
  if (!combat.armigerActive) return;
  combat.armigerT -= simDt;
  combat.armiger = CFG.armigerMax * clamp(combat.armigerT / CFG.armigerDuration, 0, 1);
  if (combat.armigerT <= 0) {
    combat.armigerActive = false;
    combat.armiger = 0;
    hero.setArmiger(false);
    emit('armigerOff');
  }
}

// --- Main update ---------------------------------------------------------------------------

export function updateCombat(simDt, rawDt, time) {
  if (combat.dead) return;

  // Timers
  combat.dodgeCd = Math.max(0, combat.dodgeCd - simDt);
  combat.postHitT = Math.max(0, combat.postHitT - simDt);
  combat.chainT = Math.max(0, combat.chainT - simDt);
  if (combat.dodgeT > 0) combat.dodgeT = Math.max(0, combat.dodgeT - simDt);
  if (combat.witchT > 0) {
    combat.witchT = Math.max(0, combat.witchT - rawDt);
    if (combat.witchT <= 0) { setWitchTime(false); setSlowMo(false); }
  }
  if (combat.comboT > 0) {
    combat.comboT -= simDt;
    if (combat.comboT <= 0 && combat.combo > 0) {
      combat.combo = 0;
      emit('comboEnd');
    }
  }
  // Warp regen
  const regen = (1 / CFG.warpRegen) * combat.weaponDef.warpRegenMult * (combat.armigerActive ? 4 : 1);
  combat.warp = Math.min(CFG.warpSegments, combat.warp + regen * simDt);
  updateArmiger(simDt);

  if (!combat.controlEnabled) return;

  // Inputs
  tryDodge();
  tryWarp();
  tryArmiger();
  const cyc = consumeAction('cycle');
  if (cyc) cycleWeapon(cyc);
  tryAttack();

  // Movement (skip while warping — warp owns position)
  if (!combat.warpState) {
    const axes = getAxes();
    const speedMult = combat.armigerActive ? 1.12 : 1;
    let targetOmega = (axes.x * CFG.moveSpeed * speedMult) / Math.max(hero.r, 6);
    let targetVh = axes.y * CFG.vertSpeed * speedMult;
    if (combat.dodgeT > 0) {
      const k = combat.dodgeT / CFG.dodgeDuration;
      targetOmega += (combat.dodgeDir.x * CFG.dodgeImpulse * k) / Math.max(hero.r, 6);
      targetVh += combat.dodgeDir.y * CFG.dodgeImpulse * 0.62 * k;
    }
    combat.omega = damp(combat.omega, targetOmega, CFG.moveDamp, simDt);
    combat.vh = damp(combat.vh, targetVh, CFG.moveDamp, simDt);
    hero.theta = (hero.theta + combat.omega * simDt) % TAU;
    hero.h += combat.vh * simDt;

    // Soft band clamp
    if (hero.h < shell.hMin) {
      hero.h = damp(hero.h, shell.hMin, 14, simDt);
      combat.vh = Math.max(0, combat.vh);
    } else if (hero.h > shell.hMax) {
      hero.h = damp(hero.h, shell.hMax, 14, simDt);
      combat.vh = Math.min(0, combat.vh);
    }

    // Radius: breathe + knockback spring + attack glide
    combat.rKnock = damp(combat.rKnock, 0, CFG.knockbackDamp, simDt);
    combat.rGlide = damp(combat.rGlide, 0, CFG.attackGlideSpeed * 0.45, simDt);
    const breathe = Math.sin(time * CFG.radiusBreatheFreq) * CFG.radiusBreathe;
    hero.r = shell.radius + breathe + combat.rKnock - combat.rGlide;

    placeHero();
    hero.setBank(clamp(-combat.omega * hero.r * 0.02, -0.5, 0.5));
  } else {
    updateWarp(rawDt);
  }

  // Melee connect tests
  updateMelee();

  // Incoming volumes
  const hits = updateVolumes(simDt, time, getHeroState());
  for (const h of hits) takeHit(h);
}
