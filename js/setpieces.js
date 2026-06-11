import * as THREE from 'three';
import { BIOMES } from './biomes.js';

// Dramatic flyable structures: gateway arches at every biome boundary and a
// mega-arch at each biome midpoint. Built per-trigger from primitives and
// culled by main.js once passed.

const PALETTES = [
  { stone: 0x86b39c, accent: 0xc08a50, glow: 0x3fd9a8 }, // sanctuary
  { stone: 0xe2bd8a, accent: 0xb56a40, glow: 0xffb347 }, // wastes
  { stone: 0x88ccee, accent: 0x9fd8f0, glow: 0x55ccff }, // frozen
];

function stoneMat(biomeIdx) {
  const p = PALETTES[biomeIdx % PALETTES.length];
  return new THREE.MeshStandardMaterial({
    color: p.stone, flatShading: true, roughness: 0.65,
    emissive: p.stone, emissiveIntensity: 0.06,
  });
}

function accentMat(biomeIdx) {
  const p = PALETTES[biomeIdx % PALETTES.length];
  return new THREE.MeshStandardMaterial({
    color: p.accent, flatShading: true, roughness: 0.45, metalness: 0.3,
    emissive: p.accent, emissiveIntensity: 0.12,
  });
}

function glowMat(biomeIdx) {
  const p = PALETTES[biomeIdx % PALETTES.length];
  return new THREE.MeshStandardMaterial({
    color: p.glow, emissive: p.glow, emissiveIntensity: 1.4,
  });
}

// Gateway: two flanking towers + a spanning lintel you fly under, with a
// glowing band that marks the threshold into the next biome.
function buildBiomeGate(dist, biomeIdx) {
  const group = new THREE.Group();
  const stone = stoneMat(biomeIdx);
  const accent = accentMat(biomeIdx);
  const glow = glowMat(biomeIdx);

  for (const sx of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 34, 8), stone);
    tower.position.set(sx * 16, 17, 0);
    group.add(tower);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), accent
    );
    cap.scale.y = 0.65;
    cap.position.set(sx * 16, 34, 0);
    group.add(cap);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.9, 8), accent);
    collar.position.set(sx * 16, 33.4, 0);
    group.add(collar);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(36, 2.6, 3.4), stone);
  beam.position.set(0, 28, 0);
  group.add(beam);
  const band = new THREE.Mesh(new THREE.BoxGeometry(36, 0.5, 3.6), glow);
  band.position.set(0, 26.5, 0);
  group.add(band);
  // Hanging pennants
  for (let i = -3; i <= 3; i++) {
    const pen = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6, 4), accent);
    pen.rotation.x = Math.PI;
    pen.position.set(i * 4.5, 25.2, 0);
    group.add(pen);
  }
  group.position.z = -dist;
  return group;
}

// Mid-biome mega-arch: a single huge span crossing the whole lane.
function buildMegaArch(dist, biomeIdx) {
  const group = new THREE.Group();
  const stone = stoneMat(biomeIdx);
  const accent = accentMat(biomeIdx);

  const torus = new THREE.Mesh(new THREE.TorusGeometry(22, 2.2, 7, 14, Math.PI), stone);
  torus.position.set(0, 2, 0);
  group.add(torus);
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.6, 10, 7), stone);
    foot.position.set(sx * 22, 3, 0);
    group.add(foot);
  }
  const key = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 3.2), accent);
  key.position.set(0, 24.4, 0);
  group.add(key);
  group.position.z = -dist;
  return group;
}

export function buildSetPiece(sp) {
  if (sp.type === 'biomeGate') return buildBiomeGate(sp.dist, sp.biomeIndex);
  if (sp.type === 'megaArch') return buildMegaArch(sp.dist, sp.biomeIndex);
  return null;
}
