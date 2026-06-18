// Small shared helpers for procedural boss bodies. Bosses are primitives +
// emissive accents like everything else — scale and silhouette do the awe.

import * as THREE from 'three';

export function bMat(color, { rough = 0.6, metal = 0.1, emissive = 0x000000, glow = 0.35, flat = true } = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal,
    emissive, emissiveIntensity: glow, flatShading: flat,
  });
}

export function bPart(parent, geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}

// A ring of spikes/plates around an axis (crowns, fin rows, shoulder guards).
export function spikeRing(parent, { count = 8, radius = 2, size = 0.8, len = 2, y = 0, tilt = 0.6, mat }) {
  const g = new THREE.Group();
  g.position.y = y;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(size, len, 4), mat);
    spike.position.set(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    spike.rotation.set(tilt * Math.cos(a), a, -tilt * Math.sin(a));
    g.add(spike);
  }
  parent.add(g);
  return g;
}

// Chain of sphere segments along a parametric path fn(t)->Vector3 with
// per-segment radius. Returns the segment meshes (callers animate offsets).
const _p = new THREE.Vector3();
export function segmentChain(parent, { count, path, radius, mat, squashY = 0.92 }) {
  const segs = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    path(t, _p);
    const r = typeof radius === 'function' ? radius(t) : radius;
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    m.position.copy(_p);
    m.scale.y = squashY;
    m.userData.baseT = t;
    m.userData.basePos = _p.clone();
    m.userData.baseR = r;
    parent.add(m);
    segs.push(m);
  }
  return segs;
}

// Webbed fin: a flattened cone fan.
export function fin(parent, { len = 3, width = 1.4, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 }) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(width, len, 5), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.z = 0.22;
  parent.add(m);
  return m;
}
