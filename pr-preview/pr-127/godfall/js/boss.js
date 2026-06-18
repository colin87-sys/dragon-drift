// Boss runtime: loads a data def (bosses/*.js), runs its attack scheduler,
// weak points, stagger, phase walls, the point-warp traversal beat, and
// death. Pure orchestration — the def owns its model, animation and attack
// tables; telegraphs.js owns the hitboxes; cinematics own phase spectacle.

import * as THREE from 'three';
import { shell } from './shell.js';
import { spawnVolume, clearVolumes } from './telegraphs.js';
import { emit } from './events.js';
import { sfx, buzz } from './sfx.js';
import { texSigil, texBeacon, mulberry32, randRange } from './util.js';
import { staggerBurst } from './particles.js';

let scene = null;
let sigilTex = null;
let beaconTex = null;

const _v = new THREE.Vector3();
const _out = new THREE.Vector3();

export const boss = {
  def: null,
  built: null,        // { root, nodes, animate }
  hp: 1,
  hpMax: 1,
  phase: 1,
  pendingPhase: 0,    // set when a threshold is crossed; cinematic commits it
  state: 'idle',      // idle | fighting | staggered | transition | traversal | dying | dead
  stagger: 0,
  staggerMax: 100,
  staggerIdleT: 0,
  staggeredT: 0,
  aimPoint: new THREE.Vector3(0, 10, 0),

  // scheduler
  _cooldown: 2,
  _attackT: 0,
  _attackDur: 0,
  _attack: null,
  _lastAttackId: '',
  _rng: mulberry32(1),
  _animState: { anim: '', animT: 0, staggered: false, phase: 1, hpFrac: 1, traversalK: 0, dying: 0 },

  // weak points / traversal
  weakPoints: [],
  beacons: [],
  beaconIndex: 0,
  _traversalT: 0,

  get hpFrac() { return this.hp / this.hpMax; },
  get attacking() { return !!this._attack; },
};

export function initBoss(s) {
  scene = s;
  sigilTex = texSigil();
  beaconTex = texBeacon();
}

export function loadBoss(def, quality) {
  unloadBoss();
  boss.def = def;
  boss.built = def.build(scene, quality);
  boss.hpMax = def.hp;
  boss.hp = def.hp;
  boss.phase = 1;
  boss.pendingPhase = 0;
  boss.state = 'idle';
  boss.stagger = 0;
  boss.staggerMax = def.stagger.threshold;
  boss._rng = mulberry32((Math.random() * 0x7fffffff) | 0);
  shell.setBounds(def.shell, true);
  shell.setCenter(_v.set(0, 0, 0), true);

  boss.weakPoints = def.weakPoints.map((wp) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sigilTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
      color: def.accentColor ?? 0x7fe0ff,
    }));
    sprite.visible = false;
    scene.add(sprite);
    return { def: wp, active: false, windowT: 0, sprite };
  });
  return boss.built;
}

export function unloadBoss() {
  clearVolumes();
  if (boss.built) {
    boss.built.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
    scene.remove(boss.built.root);
  }
  for (const wp of boss.weakPoints) {
    scene.remove(wp.sprite);
    wp.sprite.material.dispose();
  }
  for (const b of boss.beacons) {
    scene.remove(b.sprite);
    b.sprite.material.dispose();
  }
  boss.weakPoints = [];
  boss.beacons = [];
  boss.built = null;
  boss.def = null;
}

export function resetBossFight() {
  if (!boss.def) return;
  clearVolumes();
  clearBeacons();
  boss.hp = boss.hpMax;
  boss.phase = 1;
  boss.pendingPhase = 0;
  boss.state = 'idle';
  boss.stagger = 0;
  boss.staggeredT = 0;
  boss._cooldown = 2.2;
  boss._attack = null;
  boss._lastAttackId = '';
  boss._animState.dying = 0;
  boss._animState.traversalK = 0;
  shell.setBounds(boss.def.shell, true);
  for (const wp of boss.weakPoints) {
    wp.active = false;
    wp.windowT = 0;
    wp.sprite.visible = false;
  }
  if (boss.built && boss.built.reset) boss.built.reset();
}

export function beginFighting() {
  boss.state = 'fighting';
  boss._cooldown = 1.4;
}

// --- Node helpers ---------------------------------------------------------

export function nodeWorld(name, out) {
  const n = boss.built && boss.built.nodes[name];
  if (!n) return out.set(0, 10, 0);
  return n.getWorldPosition(out);
}

export function hurtZonesWorld() {
  const list = [];
  if (!boss.def) return list;
  for (const z of boss.def.hurtZones) {
    nodeWorld(z.node, _out);
    list.push({ pos: _out.clone(), r: z.r, node: z.node });
  }
  // Dynamic zones: builds may expose every body segment (serpent coils...)
  // so melee always has flesh nearby, not just the few named nodes.
  if (boss.built && boss.built.zones) {
    for (const z of boss.built.zones) {
      z.obj.getWorldPosition(_out);
      list.push({ pos: _out.clone(), r: z.r, node: z.node || 'body' });
    }
  }
  return list;
}

export function activeWeakPointsWorld() {
  const list = [];
  for (const wp of boss.weakPoints) {
    if (!wp.active) continue;
    nodeWorld(wp.def.node, _out);
    list.push({ pos: _out.clone(), r: wp.def.r, wp });
  }
  return list;
}

// --- Damage ------------------------------------------------------------------

// Returns { killed, staggerBroke, phaseWall } — caller (combat) feeds juice.
export function damageBoss(amount, { weakMult = 1, staggerGain = 0 } = {}) {
  if (!boss.def || boss.state === 'dying' || boss.state === 'dead') {
    return { killed: false, staggerBroke: false, phaseWall: 0 };
  }
  const staggeredMult = boss.state === 'staggered' ? boss.def.stagger.dmgMult : 1;
  const dealt = amount * weakMult * staggeredMult;
  boss.hp = Math.max(0, boss.hp - dealt);
  emit('bossDamaged', { amount: dealt });

  let staggerBroke = false;
  if (boss.state !== 'staggered' && staggerGain > 0) {
    boss.stagger = Math.min(boss.staggerMax, boss.stagger + staggerGain);
    boss.staggerIdleT = 0;
    if (boss.stagger >= boss.staggerMax) {
      staggerBroke = true;
      startStagger();
    }
  }

  let phaseWall = 0;
  if (boss.hp <= 0) {
    boss.state = 'dying';
    cancelAttack();
    clearVolumes();
    emit('bossDying');
  } else if (!boss.pendingPhase && boss.state !== 'dying') {
    const th = boss.def.phaseThresholds; // e.g. [0.65, 0.3]
    if (boss.phase === 1 && boss.hpFrac <= th[0]) phaseWall = 2;
    else if (boss.phase === 2 && boss.hpFrac <= th[1]) phaseWall = 3;
    if (phaseWall) {
      boss.pendingPhase = phaseWall;
      boss.state = 'transition';
      cancelAttack();
      clearVolumes();
      endStagger(true);
      emit('bossPhaseWall', { phase: phaseWall });
    }
  }
  return { killed: boss.hp <= 0, staggerBroke, phaseWall, dealt };
}

// Cinematic finished → the new phase actually starts.
export function commitPhase() {
  if (!boss.pendingPhase) return;
  boss.phase = boss.pendingPhase;
  boss.pendingPhase = 0;
  const phaseDef = boss.def.phases[boss.phase - 1];
  if (phaseDef.shell) shell.setBounds(phaseDef.shell);
  boss.state = 'fighting';
  boss._cooldown = 1.2;
  emit('bossPhase', { phase: boss.phase });
}

function startStagger() {
  boss.state = 'staggered';
  boss.staggeredT = boss.def.stagger.duration;
  cancelAttack();
  clearVolumes();
  sfx.staggerBreak();
  buzz([30, 40, 90]);
  nodeWorld(boss.def.shell.aimNode, _out);
  staggerBurst(_out);
  emit('bossStaggered');
}

function endStagger(silent = false) {
  if (boss.state === 'staggered') {
    boss.state = 'fighting';
    if (!silent) {
      sfx.staggerRecover();
      sfx.roar(boss.def.id);
      emit('bossStaggerEnd');
    }
  }
  boss.stagger = 0;
}

// --- Attacks --------------------------------------------------------------------

function cancelAttack() {
  boss._attack = null;
  boss._animState.anim = '';
}

function pickAttack() {
  const phaseDef = boss.def.phases[boss.phase - 1];
  const pool = phaseDef.attacks.filter((id) => id !== boss._lastAttackId || phaseDef.attacks.length === 1);
  let total = 0;
  for (const id of pool) total += boss.def.attacks[id].weight || 1;
  let roll = boss._rng() * total;
  for (const id of pool) {
    roll -= boss.def.attacks[id].weight || 1;
    if (roll <= 0) return id;
  }
  return pool[pool.length - 1];
}

function startAttack(id, heroState) {
  const atk = boss.def.attacks[id];
  const ctx = {
    heroTheta: heroState.shell.theta,
    heroH: heroState.shell.h,
    phase: boss.phase,
    rng: boss._rng,
    color: boss.def.accentColor ?? 0xff8040,
    heavyColor: boss.def.heavyColor ?? 0xff5030,
    node: (name) => nodeWorld(name, new THREE.Vector3()),
  };
  const specs = atk.vols(ctx) || [];
  let latest = 0;
  for (const spec of specs) {
    spec.id = id;
    spawnVolume(spec);
    // Projectiles run `active` until they expire in flight (~1.4s max) —
    // never let that placeholder stretch the boss's attack duration.
    const activeDur = spec.kind === 'projectile' ? 1.4 : (spec.active || 0);
    latest = Math.max(latest, (spec.delay || 0) + (spec.warn || 0) + activeDur);
  }
  boss._attack = atk;
  boss._attackT = 0;
  boss._attackDur = latest + (atk.recovery || 0.8);
  boss._lastAttackId = id;
  boss._animState.anim = atk.anim || '';
  boss._animState.animT = 0;
  if (atk.banner) emit('banner', { text: atk.banner, heavy: true });
  if (atk.spectacle) {
    emit('spectacle', { id });
    sfx.warnSpectacle();
  }
  if (atk.fx) emit('arenaFx', { fx: atk.fx, attack: id });
  // Weak-point exposure rides on the attack (e.g. the maw after a bite).
  if (atk.exposes) {
    const wp = boss.weakPoints.find((w) => w.def.id === atk.exposes);
    if (wp) {
      wp.pendingOpenAt = latest;      // opens when the strike lands
      wp.pendingDur = wp.def.dur || 3;
    }
  }
  emit('bossAttack', { id });
}

// --- Traversal (point-warp chase) -------------------------------------------------

function clearBeacons() {
  for (const b of boss.beacons) {
    scene.remove(b.sprite);
    b.sprite.material.dispose();
  }
  boss.beacons = [];
  boss.beaconIndex = 0;
}

export function startTraversal(heroState) {
  const tv = boss.def.traversal;
  if (!tv) return false;
  boss.state = 'traversal';
  boss._traversalT = tv.timeout || 10;
  cancelAttack();
  clearVolumes();
  const n = tv.beacons || 5;
  const startTheta = heroState.shell.theta;
  const dir = boss._rng() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const theta = startTheta + dir * (i + 1) * ((tv.spreadTheta || 3.6) / n);
    const h = randRange(boss._rng, shell.hMin + 2, shell.hMax - 2);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: beaconTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
      color: boss.def.accentColor ?? 0x7fe0ff,
    }));
    scene.add(sprite);
    boss.beacons.push({ theta, h, sprite });
  }
  boss.beaconIndex = 0;
  emit('traversalStart');
  sfx.roar(boss.def.id);
  return true;
}

export function currentBeacon() {
  return boss.state === 'traversal' ? boss.beacons[boss.beaconIndex] || null : null;
}

// Hero warped into the current beacon.
export function advanceBeacon() {
  if (boss.state !== 'traversal') return false;
  sfx.beaconHop(boss.beaconIndex);
  buzz(12);
  boss.beaconIndex++;
  emit('traversalBeacon', { index: boss.beaconIndex, total: boss.beacons.length });
  if (boss.beaconIndex >= boss.beacons.length) endTraversal(true);
  return true;
}

function endTraversal(complete) {
  clearBeacons();
  boss.state = 'fighting';
  boss._cooldown = 1.6;
  boss._animState.traversalK = 0;
  emit('traversalEnd', { complete });
  sfx.roar(boss.def.id);
}

// --- Update ----------------------------------------------------------------------

export function updateBoss(dt, time, heroState) {
  if (!boss.def || !boss.built) return;

  const st = boss._animState;
  st.phase = boss.phase;
  st.hpFrac = boss.hpFrac;
  st.staggered = boss.state === 'staggered';
  st.animT += dt;
  st.heroPos = heroState.pos;
  st.heroTheta = heroState.shell.theta;

  // Aim point follows the def's aim node.
  nodeWorld(boss.def.shell.aimNode, boss.aimPoint);

  if (boss.state === 'fighting') {
    if (boss._attack) {
      boss._attackT += dt;
      if (boss._attackT >= boss._attackDur) cancelAttack();
    } else {
      boss._cooldown -= dt;
      if (boss._cooldown <= 0) {
        const phaseDef = boss.def.phases[boss.phase - 1];
        startAttack(pickAttack(), heroState);
        boss._cooldown = randRange(boss._rng, phaseDef.cooldown[0], phaseDef.cooldown[1]);
      }
    }
    // Stagger decay when untouched.
    boss.staggerIdleT += dt;
    if (boss.staggerIdleT > boss.def.stagger.decayDelay && boss.stagger > 0) {
      boss.stagger = Math.max(0, boss.stagger - boss.def.stagger.decayRate * dt);
    }
  } else if (boss.state === 'staggered') {
    boss.staggeredT -= dt;
    if (boss.staggeredT <= 0) endStagger();
  } else if (boss.state === 'traversal') {
    boss._traversalT -= dt;
    st.traversalK = Math.min(1, st.traversalK + dt * 2);
    if (boss._traversalT <= 0) endTraversal(false);
    // Beacon visuals
    boss.beacons.forEach((b, i) => {
      const sp = b.sprite;
      if (i < boss.beaconIndex) { sp.visible = false; return; }
      shell.worldPos(b.theta, b.h, shell.radius, _v);
      sp.visible = true;
      sp.position.copy(_v);
      const isNext = i === boss.beaconIndex;
      const s = isNext ? 3.4 + Math.sin(time * 6) * 0.5 : 2.0;
      sp.scale.set(s, s, 1);
      sp.material.opacity = isNext ? 0.95 : 0.35;
    });
  } else if (boss.state === 'dying') {
    st.dying = Math.min(1, st.dying + dt * 0.5);
  }

  // Weak point windows + sprites
  for (const wp of boss.weakPoints) {
    const d = wp.def;
    if (wp.pendingOpenAt !== undefined) {
      wp.pendingOpenAt -= dt;
      if (wp.pendingOpenAt <= 0) {
        wp.active = true;
        wp.windowT = wp.pendingDur;
        wp.pendingOpenAt = undefined;
      }
    }
    let active;
    if (boss.state === 'staggered') {
      active = true; // everything opens during the collapse
    } else if (wp.windowT > 0) {
      wp.windowT -= dt;
      active = true;
    } else {
      active = !!d.always && (!d.phaseMin || boss.phase >= d.phaseMin);
    }
    wp.active = active && boss.state !== 'dying' && boss.state !== 'traversal';
    const sp = wp.sprite;
    if (wp.active) {
      nodeWorld(d.node, _v);
      // Push the sigil toward the shell so it never hides inside the body.
      _out.copy(_v).sub(shell.center);
      _out.y = 0;
      const len = _out.length() || 1;
      _v.addScaledVector(_out.divideScalar(len), d.r * 0.7);
      sp.visible = true;
      sp.position.copy(_v);
      const pulse = 1 + Math.sin(time * 5 + d.r) * 0.12;
      const s = d.r * 2.6 * pulse;
      sp.scale.set(s, s, 1);
      sp.material.opacity = boss.state === 'staggered' ? 0.95 : 0.7;
      sp.material.rotation += dt * 0.8;
    } else {
      sp.visible = false;
    }
  }

  boss.built.animate(dt, time, st);
}
