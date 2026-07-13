import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { input, getAxes } from './input.js';
import { damp, clamp } from './util.js';
import { saveData } from './save.js';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';

// Glide Assist (beginner auto-fly): compute the steering axes that intercept
// the next ring (else gate) before the player reaches its plane. Returns the
// same [-1,1] axis pair manual steering uses, so it feeds the identical damping
// path and motion stays smooth. Levels off when nothing is ahead.
function assistAxes(player) {
  const ring = nextRingAhead(player.dist + 4);
  const gate = nextGateAhead(player.dist + 4);
  const target = ring && gate ? (ring.dist < gate.dist ? ring : gate) : (ring || gate);
  if (!target) return { x: 0, y: 0 };
  const tx = target.gapX !== undefined ? target.gapX : target.x;
  const ty = target.gapY !== undefined ? target.gapY : target.y;
  const time = Math.max((target.dist - player.dist) / Math.max(player.speed, 1), 0.0001);
  const bonus = player.boosting ? CONFIG.boostSteeringBonus : 1;
  return {
    x: clamp((tx - player.position.x) / time / (S.lateralSpeed * bonus), -1, 1),
    y: clamp((ty - player.position.y) / time / (S.verticalSpeed * bonus), -1, 1),
  };
}

// Time-based speed ramp: game gets faster as the run progresses.
function speedRamp(t) {
  if (t <= CONFIG.speedRampStart) return 1;
  if (t >= CONFIG.speedRampEnd) return CONFIG.speedRampMax;
  const k = (t - CONFIG.speedRampStart) / (CONFIG.speedRampEnd - CONFIG.speedRampStart);
  return 1 + (CONFIG.speedRampMax - 1) * k;
}

// Effective flight stats: CONFIG baseline scaled by the equipped dragon.
// Handling scales >= speed across the roster (see dragons.js) so faster
// dragons are strictly easier to steer onto the generated reward line.
const S = {
  baseSpeed: CONFIG.baseSpeed,
  boostSpeed: CONFIG.boostSpeed,
  orbSpeed: CONFIG.orbSpeed,
  lateralSpeed: CONFIG.lateralSpeed,
  verticalSpeed: CONFIG.verticalSpeed,
  drainMult: 1,
  regenMult: 1,
};

export function applyDragonStats(def) {
  const st = (def && def.stats) || { speed: 1, handling: 1, drain: 1, regen: 1 };
  S.baseSpeed = CONFIG.baseSpeed * st.speed;
  S.boostSpeed = CONFIG.boostSpeed * st.speed;
  S.orbSpeed = CONFIG.orbSpeed * st.speed;
  S.lateralSpeed = CONFIG.lateralSpeed * st.handling;
  S.verticalSpeed = CONFIG.verticalSpeed * st.handling;
  S.drainMult = st.drain;
  S.regenMult = st.regen;
}

export const player = {
  position: new THREE.Vector3(0, 8, 0),
  velocity: new THREE.Vector2(0, 0),
  speed: CONFIG.baseSpeed,
  dist: 0,
  prevDist: 0,
  boosting: false,
  wasBoosting: false,  // for boost-start detection
  orbTimer: 0,
  regenDelay: 0,
  feverActive: false,  // mirror from game for dragon.js access
  roll: null,          // { t, dur, dir } while a barrel roll is active
  rollCooldown: 0,
  rollInvuln: 0,
  rollJustStarted: false, // one-frame flag for SFX/camera in main.js

  get speedActive() {
    return this.speed > S.baseSpeed + 8;
  },

  reset() {
    this.position.set(0, 8, 0);
    this.velocity.set(0, 0);
    this.speed = CONFIG.baseSpeed;
    this.dist = 0;
    this.prevDist = 0;
    this.boosting = false;
    this.wasBoosting = false;
    this.orbTimer = 0;
    this.regenDelay = 0;
    this.feverActive = false;
    this.roll = null;
    this.rollCooldown = 0;
    this.rollInvuln = 0;
    this.rollJustStarted = false;
  },

  // Barrel roll: lateral dodge with brief i-frames. Near-misses still award
  // during the roll, so rolling through a cluster showers bonuses.
  tryRoll(dir) {
    if (this.roll || this.rollCooldown > 0) return false;
    this.roll = { t: 0, dur: CONFIG.rollDuration, dir };
    this.rollCooldown = CONFIG.rollCooldown;
    this.rollInvuln = CONFIG.rollInvuln;
    this.velocity.x = Math.max(-CONFIG.rollImpulse, Math.min(CONFIG.rollImpulse,
      this.velocity.x + dir * CONFIG.rollImpulse));
    this.rollJustStarted = true;
    return true;
  },

  update(dt) {
    this.prevDist = this.dist;
    this.wasBoosting = this.boosting;
    this.boosting = input.boost && (game.stamina > 0 || this.orbTimer > 0);

    // Barrel roll request (set by input.js, consumed once)
    if (input.rollRequest) {
      this.tryRoll(input.rollRequest);
      input.rollRequest = 0;
    }
    if (this.roll) {
      this.roll.t += dt;
      if (this.roll.t >= this.roll.dur) this.roll = null;
    }
    this.rollCooldown = Math.max(0, this.rollCooldown - dt);
    this.rollInvuln = Math.max(0, this.rollInvuln - dt);

    const manual = getAxes();
    let axes = manual;
    if (saveData.settings.glideAssist) {
      // Forgiving blend: auto-steer flies the line; manual input bends it.
      const a = assistAxes(this);
      axes = { x: clamp(a.x + manual.x, -1, 1), y: clamp(a.y + manual.y, -1, 1) };
    }
    const steeringBonus = this.boosting ? CONFIG.boostSteeringBonus : 1;
    this.velocity.x = damp(this.velocity.x, axes.x * S.lateralSpeed * steeringBonus, CONFIG.moveAccel, dt);
    this.velocity.y = damp(this.velocity.y, axes.y * S.verticalSpeed * steeringBonus, CONFIG.moveAccel, dt);
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (this.position.y > CONFIG.laneMaxY) {
      this.position.y = CONFIG.laneMaxY;
      this.velocity.y = Math.min(this.velocity.y, 0);
    }

    if (this.boosting) {
      // Boost is a resource: it drains while held. An orb surge is free boost;
      // Dragon Surge eases the burn (feverStaminaDrainMult); ring / window / orb
      // refills extend it, but rings alone never fully pay for the drain.
      if (this.orbTimer <= 0) {
        const drain = CONFIG.staminaDrain * S.drainMult * (game.feverActive ? CONFIG.feverStaminaDrainMult : 1);
        game.stamina = Math.max(0, game.stamina - drain * dt);
      }
      this.regenDelay = CONFIG.staminaRegenDelay;
    } else {
      this.regenDelay -= dt;
      if (this.regenDelay <= 0) {
        game.stamina = Math.min(CONFIG.staminaMax, game.stamina + CONFIG.staminaRegen * S.regenMult * dt);
      }
    }

    if (this.orbTimer > 0) this.orbTimer -= dt;

    const ramp = speedRamp(game.time);
    let targetSpeed = S.baseSpeed * ramp;
    if (this.boosting)     targetSpeed = S.boostSpeed * ramp;
    if (this.orbTimer > 0) targetSpeed = Math.max(targetSpeed, S.orbSpeed * ramp);
    targetSpeed *= game.mods.speed; // Daily "High Winds" tailwind
    this.speed = damp(this.speed, targetSpeed, CONFIG.speedEase, dt);

    // Track max speed for stats
    if (this.speed > game.maxSpeed) game.maxSpeed = this.speed;

    this.dist += this.speed * dt;
    this.position.z = -this.dist;
    this.feverActive = game.feverActive;
  },
};
