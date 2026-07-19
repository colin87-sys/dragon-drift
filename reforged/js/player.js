import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { input, getAxes } from './input.js';
import { damp, clamp } from './util.js';
import { saveData } from './save.js';
import { nextRingAhead } from './rings.js';
import { nextGateAhead } from './obstacles.js';
import { driftSpeedFactor, driftOverdriveSlip } from './drift.js';

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
  // The returned axis is later multiplied by steer = bonus·canyonSlip (see update()), so
  // the assist must divide by canyonSlip too — otherwise inside the spine slipstream the
  // auto-fly velocity is scaled up by the slip factor and oversteers (visible wobble at
  // 1.40). Co-scaling here keeps the intercept exact relative to the faster world.
  // DRIFT is a second factor in the same chain, so it divides here for the same reason.
  const slip = (player.canyonSlip || 1) * (player.driftFactor || 1);
  return {
    x: clamp((tx - player.position.x) / time / (S.lateralSpeed * bonus * slip), -1, 1),
    y: clamp((ty - player.position.y) / time / (S.verticalSpeed * bonus * slip), -1, 1),
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
  canyonSlip: 1,       // spine slipstream factor (E5)
  tunnelFxMix: 0,      // slip × local rib-wall presence — drives the speed FX (feel-v4)
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
  lastRollDir: 0,      // §ENG-A-R: the ±1 dir of the roll that granted the current i-frames (outlives `roll`, which nulls at rollDuration < rollInvuln) — read at the reflect seam to bias the swat's target side
  rollJustStarted: false, // one-frame flag for SFX/camera in main.js

  get speedActive() {
    return this.speed > S.baseSpeed + 8;
  },

  reset() {
    this.position.set(0, 8, 0);
    this.velocity.set(0, 0);
    this.speed = CONFIG.baseSpeed;
    this.canyonSlip = 1;   // spine slipstream factor (E5), damped in update()
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
    this.lastRollDir = 0;
    this.rollJustStarted = false;
  },

  // Barrel roll: lateral dodge with brief i-frames. Near-misses still award
  // during the roll, so rolling through a cluster showers bonuses.
  tryRoll(dir) {
    if (this.roll || this.rollCooldown > 0) return false;
    this.roll = { t: 0, dur: CONFIG.rollDuration, dir };
    this.rollCooldown = CONFIG.rollCooldown;
    this.rollInvuln = CONFIG.rollInvuln;
    this.lastRollDir = dir;   // §ENG-A-R: persists past `roll` being nulled, for the reflect-target side bias
    this.velocity.x = Math.max(-CONFIG.rollImpulse, Math.min(CONFIG.rollImpulse,
      this.velocity.x + dir * CONFIG.rollImpulse));
    this.rollJustStarted = true;
    return true;
  },

  update(dt) {
    this.prevDist = this.dist;
    this.wasBoosting = this.boosting;
    // Boss fight = on-rails dodging: boost is suspended (the "stop boosting,
    // focus on dodging" beat) and the 2nd finger is freed up for the surge tap.
    this.boosting = !game.inBoss && input.boost && (game.stamina > 0 || this.orbTimer > 0);

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
    // Spine slipstream (E5): inside the SPINE speed tunnel the world rushes ~12% faster,
    // and steering CO-SCALES by the same factor — so every reachability ratio (and the
    // whole canyonflow fairness audit) stays exactly valid; the inputs feel identical
    // relative to the faster world. Damped smoothly at the seams; 1 outside spine / in boss.
    // Slipstream target: spine = a fixed dial; FLOW = chain-driven (1 → 1.40 as the carve
    // chain climbs → the world rushes faster the longer you hold the line, and eases DOWN
    // when the chain drops). Both co-scale (steer × canyonSlip below, targetSpeed × it, and
    // assistAxes ÷ it) so the mode stays fair by construction.
    let slipTarget = 1;
    if (game.inCanyon && !game.inBoss) {
      if (game.canyonRun === 'spine') slipTarget = CONFIG.canyonSpineSlip;
      else if (game.canyonRun === 'flow') {
        // §2 middle path: with DRIFT on, the flow canyon is the OVERDRIVE zone —
        // the ONE meter drives the slip target (ceiling capCanyon ≈ the old 1.30);
        // never stacked with the base drift factor (which is 1 inside canyons).
        const od = driftOverdriveSlip();
        slipTarget = od !== null ? od
          : 1 + CONFIG.FLOW.slipPerChain * Math.min(game.flowChain, CONFIG.FLOW.chainCap);
      }
    }
    this.canyonSlip = damp(this.canyonSlip, slipTarget, CONFIG.canyonSlipEase, dt);
    // DRIFT (flag-gated, else 1): the always-on momentum factor — a SECOND factor in
    // this exact co-scale chain (steer ×, targetSpeed ×, assist ÷), so reachability
    // ratios hold by construction. Governed: contributes nothing above 130 m/s.
    this.driftFactor = driftSpeedFactor(this);
    const steer = steeringBonus * this.canyonSlip * this.driftFactor;
    this.velocity.x = damp(this.velocity.x, axes.x * S.lateralSpeed * steer, CONFIG.moveAccel, dt);
    this.velocity.y = damp(this.velocity.y, axes.y * S.verticalSpeed * steer, CONFIG.moveAccel, dt);
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    if (this.position.y > CONFIG.laneMaxY) {
      this.position.y = CONFIG.laneMaxY;
      this.velocity.y = Math.min(this.velocity.y, 0);
    }
    // Boss arena constriction: the storm walls physically push you inward — a
    // firm clamp (like laneMaxY above), never damage, so there are no cheap
    // wall deaths inside a showpiece phase.
    if (game.inBoss && game.bossArenaHW) {
      const hw = game.bossArenaHW - 0.6;
      if (this.position.x > hw) { this.position.x = hw; this.velocity.x = Math.min(this.velocity.x, 0); }
      else if (this.position.x < -hw) { this.position.x = -hw; this.velocity.x = Math.max(this.velocity.x, 0); }
    }
    // Boss VERTICAL squeeze (CP2-A, def.skyCrush — EMBERTIDE "the sky crushes the
    // lane"): the descending ceiling of light clamps the sky the same firm, damage-
    // free way. Only the CEILING — the floor is never raised (skimming stays open).
    if (game.inBoss && game.bossArenaHY != null && this.position.y > game.bossArenaHY - 0.6) {
      this.position.y = game.bossArenaHY - 0.6;
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
    targetSpeed *= this.canyonSlip; // spine slipstream (E5) — co-scaled with steering above
    targetSpeed *= this.driftFactor; // DRIFT (flag-gated; 1 in canyons/bosses) — co-scaled too
    // On-rails during the boss: hold a steady cruise so the boss (which matches
    // it and "flies backward") stays framed and bullet timing is predictable.
    if (game.inBoss) targetSpeed = CONFIG.BOSS.cruiseSpeed;
    this.speed = damp(this.speed, targetSpeed, CONFIG.speedEase, dt);

    // Track max speed for stats
    if (this.speed > game.maxSpeed) game.maxSpeed = this.speed;

    this.dist += this.speed * dt;
    this.position.z = -this.dist;
    this.feverActive = game.feverActive;
    // SUNBREAK I2: mirror the REMAINING fever time so dragon.js can drive the pre-expiry
    // ignition DECAY off it (§M.1-5 — the body dims in step with the HUD gauge, never ahead).
    this.feverTimer = game.feverTimer;
    this.feverDuration = CONFIG.feverDuration;
    this.surgeUltimate = game.surgeUltimatePhase || null;   // I3: the boss ultimate's live phase (ducks the ambient cascade)
    this.surgeApexPin = game.surgeApexPin || 0;             // I4: APEX pose-pin weight (the flap steers to the high-V silhouette)
    this.surgeGatherK = game.surgeGatherK || 0;             // I4 fix 3: the ritual's charge climbs the BODY (rim/wing lift in dragon.js)
  },
};
