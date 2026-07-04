// Lock-on shell camera. Sits behind/above the hero on a smoothed copy of the
// hero's shell coords and always frames hero (lower third) + boss (center).
// Modes: 'shell' (fight) · 'showcase' (menus, slow orbit) · 'cine'
// (cinematics drive it directly; on release it BLENDS back to the shell
// transform so handback never pops).

import * as THREE from 'three';
import { CFG } from './config.js';
import { shell } from './shell.js';
import { damp, dampAngle, clamp } from './util.js';
import { save } from './save.js';

const pos = new THREE.Vector3();
const look = new THREE.Vector3();
const tmp = new THREE.Vector3();
const cinePos = new THREE.Vector3();
const cineLook = new THREE.Vector3();

export const cam = {
  camera: null,
  mode: 'showcase',
  thetaCam: 0,
  hCam: 8,
  fov: CFG.fovBase,
  fovTarget: CFG.fovBase,
  blendBack: 0,       // 1 → 0 after leaving cine mode
  showcaseAngle: 0,

  _shakeT: 0,
  _shakeMag: 0,
  _kickT: 0,
  _kickMag: 0,

  init(camera) {
    this.camera = camera;
  },

  setMode(mode) {
    if (this.mode === 'cine' && mode === 'shell') {
      this.blendBack = 1;
      cinePos.copy(this.camera.position);
      cineLook.copy(look);
    }
    this.mode = mode;
  },

  // Cinematics write the camera directly through this.
  setCine(p, l, fov) {
    cinePos.copy(p);
    cineLook.copy(l);
    if (fov) this.fov = fov;
    if (this.mode === 'cine') {
      this.camera.position.copy(p);
      this.camera.lookAt(l);
      look.copy(l);
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
  },

  shake(mag = 0.4) {
    if (!save.settings.screenShake) mag *= 0.25;
    this._shakeT = 0.4;
    this._shakeMag = Math.max(this._shakeMag, mag);
  },

  // Quick push toward the boss (warp launches, big hits).
  kick(mag = 1) {
    this._kickT = 0.32;
    this._kickMag = mag;
  },

  snapTo(theta, h) {
    this.thetaCam = theta;
    this.hCam = h;
  },

  update(rawDt, hero, bossAim) {
    const camera = this.camera;
    if (!camera) return;

    if (this.mode === 'cine') {
      // setCine already placed us; just keep fov fresh.
      camera.fov = damp(camera.fov, this.fov, 8, rawDt);
      camera.updateProjectionMatrix();
      return;
    }

    if (this.mode === 'showcase') {
      this.showcaseAngle += rawDt * 0.16;
      const r = shell.radius + 14;
      const h = (shell.hMin + shell.hMax) * 0.55 + Math.sin(this.showcaseAngle * 0.5) * 3;
      shell.worldPos(this.showcaseAngle, h, r, pos);
      camera.position.lerp(pos, 1 - Math.exp(-3 * rawDt));
      tmp.copy(shell.center);
      tmp.y = (shell.hMin + shell.hMax) * 0.5;
      camera.lookAt(tmp);
      look.copy(tmp);
      camera.fov = damp(camera.fov, 62, 3, rawDt);
      camera.updateProjectionMatrix();
      return;
    }

    // --- shell mode ---
    this.thetaCam = dampAngle(this.thetaCam, hero.theta, CFG.camThetaDamp, rawDt);
    this.hCam = damp(this.hCam, hero.h, CFG.camHeightDamp, rawDt);

    let back = CFG.camBack;
    if (this._kickT > 0) {
      this._kickT -= rawDt;
      back -= Math.sin(clamp(this._kickT / 0.32, 0, 1) * Math.PI) * 2.2 * this._kickMag;
    }

    shell.worldPos(this.thetaCam, clamp(this.hCam, shell.hMin - 1, shell.hMax + 2) + CFG.camUp, hero.r + back, pos);
    look.copy(hero.pos).lerp(bossAim, CFG.camLookBlend);
    look.y += 1.1;

    if (this.blendBack > 0) {
      this.blendBack = Math.max(0, this.blendBack - rawDt * 1.8);
      const b = this.blendBack * this.blendBack;
      pos.lerp(cinePos, b);
      look.lerp(cineLook, b);
    }

    if (this._shakeT > 0) {
      this._shakeT -= rawDt;
      const k = Math.max(this._shakeT / 0.4, 0) * this._shakeMag;
      pos.x += (Math.random() * 2 - 1) * k;
      pos.y += (Math.random() * 2 - 1) * k * 0.8;
      pos.z += (Math.random() * 2 - 1) * k * 0.5;
      if (this._shakeT <= 0) this._shakeMag = 0;
    }

    camera.position.copy(pos);
    camera.lookAt(look);

    camera.fov = damp(camera.fov, this.fovTarget, 5, rawDt);
    camera.updateProjectionMatrix();
  },
};
