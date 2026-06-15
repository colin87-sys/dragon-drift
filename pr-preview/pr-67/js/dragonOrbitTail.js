import * as THREE from 'three';
import { registerTail } from './dragonRecipe.js';
import { makeGlowTexture } from './util.js';

// ORBIT SPINES — a celestial tail finish: floating spine shards + partial ring
// fragments that orbit slowly behind the wyrm like a tiny planetary system, NOT
// a reptile spade or scorpion stinger. `orbitShardCount` + `orbitRingCount` grow
// per form.
//
// It returns `orbiters` (the rig spins these — same descriptor shape as the Void
// Oracle's shards: { mesh, ang, speed, radius, baseRadius, flat, baseY, spin }),
// an empty `segs` (no coil), and `accentMats` so the shards/rings flare on Surge.

function buildOrbitTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z); // root the orbit system behind the body
  const orbiters = [];
  const accentMats = [];

  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCore = def.coreGlow ?? def.wingEmissive;
  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);

  const shardMat = new THREE.MeshStandardMaterial({
    color: def.body, emissive: cCore, emissiveIntensity: (0.7 + F * 0.5) * giM,
    roughness: 0.28, metalness: 0.55, flatShading: true,
  });
  shardMat.userData.baseEmissive = cCore;
  shardMat.userData.baseIntensity = (0.7 + F * 0.5) * giM;
  accentMats.push(shardMat);
  const ringMat = new THREE.MeshStandardMaterial({
    color: cSeam, emissive: cSeam, emissiveIntensity: (0.85 + F * 0.45) * giM,
    roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide,
  });
  ringMat.userData.baseEmissive = cSeam;
  ringMat.userData.baseIntensity = (0.85 + F * 0.45) * giM;
  accentMats.push(ringMat);

  const len = model.tailLength ?? 1;
  const baseR = (model.orbitRadius ?? 0.42) * 2.4;   // on-screen orbit radius
  const baseSpeed = model.orbitSpeed ?? 0.35;

  // Orbiting shards — sharp faceted slivers spread around the tail axis at a
  // couple of radii, each on its own slow orbit.
  const shardN = Math.max(1, model.orbitShardCount ?? 1);
  for (let i = 0; i < shardN; i++) {
    const ring = i % 2;                    // alternate two orbit shells
    const radius = baseR * (0.7 + ring * 0.5) * len;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), shardMat);
    const sl = 0.26 + (shardN > 1 ? (1 - i / shardN) * 0.16 : 0);
    shard.scale.set(sl * 0.72, sl * 0.72, sl * 2.7);   // elongated faceted sliver
    // A bright core nested in each shard so the relic field reads as living light.
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), ringMat);
    gem.scale.set(sl * 0.3, sl * 0.3, sl * 1.3);
    shard.add(gem);
    group.add(shard);
    orbiters.push({
      mesh: shard,
      ang: (i / shardN) * Math.PI * 2,
      speed: baseSpeed * (ring ? -0.8 : 1) * (0.8 + Math.random() * 0.4),
      radius, baseRadius: radius, flat: 0.55, baseY: 0, spin: true,
    });
  }

  // Partial ring fragments — thin torus arcs, tilted and slowly turning, that
  // flare wider on Surge. Grow per form.
  const ringN = model.orbitRingCount ?? 0;
  for (let i = 0; i < ringN; i++) {
    const rr = baseR * (1.0 + i * 0.45) * len;
    const arc = Math.PI * (0.9 + i * 0.25);   // a partial ring (not closed)
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(rr, 0.045 + 0.012 * giM, 6, 26, arc), ringMat);
    torus.rotation.x = 1.2 + i * 0.4;          // tilt out of the flat plane
    torus.rotation.y = i * 0.7;
    group.add(torus);
    orbiters.push({
      mesh: torus, ang: i * 1.3, speed: baseSpeed * (i % 2 ? 0.5 : -0.4),
      radius: 0, baseRadius: 0, flat: 1, baseY: 0, spin: true, isRing: true,
    });
  }

  // A faint core glow so the orbit system reads as a luminous relic even when the
  // shards are small + far from the camera.
  const coreRgb = `${(cCore >> 16) & 255},${(cCore >> 8) & 255},${cCore & 255}`;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(coreRgb), transparent: true, opacity: 0.22 + F * 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.setScalar(baseR * 1.4 * len);
  glow.layers.set(1);
  group.add(glow);

  return { group, segs: [], tailFins: null, accentMats, orbiters };
}

registerTail('orbitSpines', buildOrbitTail);
