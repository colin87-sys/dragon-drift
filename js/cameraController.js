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

export const cameraCtl = {
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

  update(dt, player, showcase = false) {
    // Start-screen showcase: slow orbit around the live dragon.
    if (showcase) {
      showcaseAngle += dt * 0.3;
      const r = 10.5;
      camera.position.set(
        player.position.x + Math.sin(showcaseAngle) * r,
        player.position.y + 2.6 + Math.sin(showcaseAngle * 0.6) * 1.2,
        player.position.z + Math.cos(showcaseAngle) * r
      );
      smoothPos.copy(camera.position);
      camera.lookAt(player.position.x, player.position.y + 0.5, player.position.z);
      if (Math.abs(camera.fov - 58) > 0.1) {
        camera.fov = damp(camera.fov, 58, 2.5, dt);
        camera.updateProjectionMatrix();
      }
      return;
    }
    const speedNorm = Math.min(Math.max((player.speed - 35) / 55, 0), 1);
    const targetBack = player.feverActive ? 6.8 : player.boosting ? 8.2 : 11.5;
    const targetHeight = player.feverActive ? 2.25 : player.boosting ? 2.65 : 3.2;
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

    lookTarget.set(player.position.x, player.position.y + 0.65 + speedNorm * 0.25, player.position.z - 16);
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
