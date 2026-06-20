// The orbital combat shell: an invisible cylinder around the boss. The hero
// lives in (theta, h, r); everything that matters in combat is authored in
// these coordinates, so telegraphs and hitboxes agree by construction.

import * as THREE from 'three';
import { damp } from './util.js';

export const shell = {
  center: new THREE.Vector3(0, 0, 0),
  radius: 30,
  hMin: 3,
  hMax: 24,

  // Targets — boss defs / phase mutations set these; current values damp over.
  _tRadius: 30,
  _tHMin: 3,
  _tHMax: 24,
  _tCenter: new THREE.Vector3(0, 0, 0),

  setBounds({ radius, hMin, hMax }, immediate = false) {
    if (radius !== undefined) this._tRadius = radius;
    if (hMin !== undefined) this._tHMin = hMin;
    if (hMax !== undefined) this._tHMax = hMax;
    if (immediate) {
      this.radius = this._tRadius;
      this.hMin = this._tHMin;
      this.hMax = this._tHMax;
    }
  },

  setCenter(v, immediate = false) {
    this._tCenter.copy(v);
    if (immediate) this.center.copy(v);
  },

  update(dt) {
    this.radius = damp(this.radius, this._tRadius, 2.2, dt);
    this.hMin = damp(this.hMin, this._tHMin, 2.2, dt);
    this.hMax = damp(this.hMax, this._tHMax, 2.2, dt);
    this.center.x = damp(this.center.x, this._tCenter.x, 2.2, dt);
    this.center.y = damp(this.center.y, this._tCenter.y, 2.2, dt);
    this.center.z = damp(this.center.z, this._tCenter.z, 2.2, dt);
  },

  worldPos(theta, h, r, out) {
    return out.set(
      this.center.x + Math.sin(theta) * r,
      h,
      this.center.z + Math.cos(theta) * r
    );
  },

  // Radial unit vector pointing away from the boss.
  outward(theta, out) {
    return out.set(Math.sin(theta), 0, Math.cos(theta));
  },

  // +theta orbit direction.
  tangent(theta, out) {
    return out.set(Math.cos(theta), 0, -Math.sin(theta));
  },

  // Shell coords of an arbitrary world point (for projecting boss nodes).
  thetaOf(worldPos) {
    return Math.atan2(worldPos.x - this.center.x, worldPos.z - this.center.z);
  },
};
