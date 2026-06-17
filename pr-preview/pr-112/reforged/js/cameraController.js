import * as THREE from 'three';
import { damp } from './util.js';

// Chase camera: smooth follow, FOV widens on speed, shakes on damage/crash,
// kicks harder on boost start, tightens during fever.
let camera = null;
const smoothPos = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

const SHAKE_DURATION = 0.45;
let shakeT = 0;
let shakeMag = 0;

// Boost kick: brief forward lurch + FOV spike on boost start
let boostKickT = 0;
const BOOST_KICK_DUR = 0.35;

// Roll kick: short camera lean in the roll direction + FOV bump
let rollKickT = 0;
let rollKickDir = 0;
const ROLL_KICK_DUR = 0.5;

// Gate kick: a small forward nudge when a window is threaded
let gateKickT = 0;
const GATE_KICK_DUR = 0.22;

// Death cam: slow ease-out dolly toward the crash during the freeze frame
let deathOn = false;
let deathT = 0;
const DEATH_DUR = 0.45;

// Start-screen showcase orbit
let showcaseAngle = 0;
// Splash attract-screen framing: behind the dragon, looking down the course.
let splashT = 0;

// First-launch cinematic: a one-time fly-in that glides from a dramatic low,
// wide, far pose into the resting showcase orbit while the FOV narrows.
let introT = 0;
const INTRO_DUR = 2.8;

export const cameraCtl = {
  splash: false,

  // Toggle the cinematic splash framing (behind the dragon, rings ahead).
  setSplash(on) {
    this.splash = on;
    splashT = 0;
  },

  init(cam, player) {
    camera = cam;
    smoothPos.set(player.position.x, player.position.y + 3.2, player.position.z + 11);
    camera.position.copy(smoothPos);
    camera.lookAt(player.position.x, player.position.y, player.position.z - 16);
    deathOn = false;
    deathT = 0;
    gateKickT = 0;
  },

  shake(mag = 0.6) {
    shakeT = SHAKE_DURATION;
    shakeMag = mag;
  },

  boostKick() {
    boostKickT = BOOST_KICK_DUR;
  },

  rollKick(dir) {
    rollKickT = ROLL_KICK_DUR;
    rollKickDir = dir;
  },

  gateKick() {
    gateKickT = GATE_KICK_DUR;
  },

  // Engaged by finishDeath(); reset free via init() on restart. The
  // revive-accept path never calls finishDeath, so a saved run never dollies.
  deathCam() {
    deathOn = true;
    deathT = 0;
  },

  // First-launch cinematic. skipIntro() lands it instantly (tap-to-skip).
  playIntro() { introT = INTRO_DUR; },
  skipIntro() { introT = 0; },
  get introPlaying() { return introT > 0; },

  update(dt, player, showcase = false, shopMode = false) {
    // Splash attract screen: a LOCKED hero composition behind + above the dragon,
    // looking down the ring course. The framing is essentially still — only an
    // extremely subtle, loop-safe "breath" remains (the world carries the life:
    // dragon idle, water, drifting embers). All sine-driven, so it loops forever
    // with no drift, snap, or reset no matter how long the screen idles.
    if (this.splash) {
      splashT += dt;
      const sx = Math.sin(splashT * 0.80) * 0.07;        // ~8s lateral micro-sway (sub-pixel)
      const sy = Math.sin(splashT * 0.62 + 1.0) * 0.05;  // ~10s vertical float
      const zb = Math.sin(splashT * 0.50) * 0.10;        // tiny in/out breath
      camera.position.set(
        player.position.x + sx,
        player.position.y + 4.0 + sy,
        player.position.z + 14 + zb
      );
      smoothPos.copy(camera.position);
      camera.lookAt(player.position.x + sx * 0.25, player.position.y + 0.6, player.position.z - 30);
      // Breathing zoom: ~±1% FOV around 66°, gently eased so it never reads as
      // a push-in. damp() also smooths the entry from the prior framing.
      const fovTarget = 66 + Math.sin(splashT * 0.70) * 0.7;
      camera.fov = damp(camera.fov, fovTarget, 3, dt);
      camera.updateProjectionMatrix();
      return;
    }
    // Start-screen showcase: slow orbit around the live dragon. The SHOP is STATIC
    // (shopMode) — a fixed hero framing, no orbit, so the dragon sits composed in the
    // real environment with the horizon behind it.
    if (showcase) {
      if (!shopMode) showcaseAngle += dt * 0.3;
      const ang = shopMode ? 0.32 : showcaseAngle;   // fixed gentle 3/4 for the shop
      const r = shopMode ? 12.5 : 10.5;
      const ox = player.position.x + Math.sin(ang) * r;
      const oy = player.position.y + (shopMode ? 2.1 : 2.6) + (shopMode ? 0 : Math.sin(showcaseAngle * 0.6) * 1.2);
      const oz = player.position.z + Math.cos(ang) * r;
      let fovTarget = shopMode ? 55 : 58;
      if (introT > 0 && !shopMode) {
        // Glide in from a low/wide/far pose; the offset decays to nothing as the
        // orbit takes over. damp() keeps it buttery and frame-rate independent.
        introT = Math.max(0, introT - dt);
        const k = introT / INTRO_DUR;     // 1 → 0
        const e = k * k;                  // ease-out emphasis on the settle
        smoothPos.x = damp(smoothPos.x, ox + Math.sin(showcaseAngle + 1.4) * e * 7, 3.2, dt);
        smoothPos.y = damp(smoothPos.y, oy - e * 3.0,  3.2, dt);
        smoothPos.z = damp(smoothPos.z, oz + e * 10.0, 3.2, dt);
        camera.position.copy(smoothPos);
        fovTarget = 58 + e * 16;          // start wide (cinematic), narrow to 58
      } else {
        camera.position.set(ox, oy, oz);
        smoothPos.copy(camera.position);
      }
      // Shop: look a touch BELOW the dragon so it rides higher in the frame, clear of
      // the stats/EQUIP panel that overlays the lower third.
      camera.lookAt(player.position.x, player.position.y + (shopMode ? -0.9 : 0.5), player.position.z);
      if (Math.abs(camera.fov - fovTarget) > 0.05) {
        camera.fov = damp(camera.fov, fovTarget, 2.5, dt);
        camera.updateProjectionMatrix();
      }
      return;
    }
    const speedNorm = Math.min(Math.max((player.speed - 35) / 55, 0), 1);
    // A touch further back + higher than before so the (now larger) dragon sits
    // lower in frame and more of the path ahead stays visible.
    const targetBack = player.feverActive ? 7.2 : player.boosting ? 8.8 : 12.3;
    const targetHeight = player.feverActive ? 2.5 : player.boosting ? 3.0 : 3.6;
    const dx = player.position.x * 0.9;
    smoothPos.x = damp(smoothPos.x, dx,                    4.5, dt);
    smoothPos.y = damp(smoothPos.y, player.position.y + targetHeight, player.boosting ? 6.5 : 4.5, dt);
    smoothPos.z = damp(smoothPos.z, player.position.z + targetBack,  player.boosting ? 12 : 8,   dt);
    camera.position.copy(smoothPos);

    // Boost kick: camera pulls back slightly then snaps forward
    if (boostKickT > 0) {
      boostKickT -= dt;
      const k = (boostKickT / BOOST_KICK_DUR);
      // Push back on start, then settle — gives "punch" feel
      camera.position.z -= Math.sin(k * Math.PI) * 1.4;
      camera.position.y -= Math.sin(k * Math.PI) * 0.25;
    }

    // Gate kick: boost kick's little sibling — threading should *tug*
    if (gateKickT > 0) {
      gateKickT -= dt;
      const k = gateKickT / GATE_KICK_DUR;
      camera.position.z -= Math.sin(k * Math.PI) * 0.5;
    }

    // Death cam: dolly 2m toward the crash + slight sink, holds through the
    // freeze and recap (camera is otherwise static there).
    if (deathOn) {
      deathT = Math.min(deathT + dt, DEATH_DUR);
      const k = 1 - Math.pow(1 - deathT / DEATH_DUR, 3);
      camera.position.z -= k * 2.0;
      camera.position.y -= k * 0.35;
    }

    if (shakeT > 0) {
      shakeT -= dt;
      const k = Math.max(shakeT / SHAKE_DURATION, 0) * shakeMag;
      camera.position.x += (Math.random() * 2 - 1) * k;
      camera.position.y += (Math.random() * 2 - 1) * k;
    }

    // Aim a little higher (toward the path) so the dragon drops lower in frame.
    lookTarget.set(player.position.x, player.position.y + 1.0 + speedNorm * 0.25, player.position.z - 16);
    camera.lookAt(lookTarget);

    // Roll lean: applied after lookAt (which resets orientation each frame).
    if (rollKickT > 0) {
      rollKickT -= dt;
      const k = Math.max(rollKickT / ROLL_KICK_DUR, 0);
      camera.rotateZ(rollKickDir * 0.16 * Math.sin(k * Math.PI));
    }

    // FOV: base 72, boost → 90, fever → 94 (wider = more intense)
    let targetFov = 72;
    if (player.speedActive) targetFov = 82;
    if (player.boosting) targetFov = 86;
    if (player.feverActive) targetFov = 90;
    if (rollKickT > 0) targetFov += 4;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = damp(camera.fov, targetFov, player.boosting ? 5 : 3, dt);
      camera.updateProjectionMatrix();
    }
  },
};
