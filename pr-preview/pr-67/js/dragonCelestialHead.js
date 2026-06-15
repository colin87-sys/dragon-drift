import * as THREE from 'three';
import { registerHead } from './dragonRecipe.js';

// CELESTIAL MASK — a sacred regal faceplate, NOT a horned dragon head or a beak.
// A narrow smooth mask with glowing eye slits and a crown/halo that grows with
// `maskTier` / `crown` per form (faceplate → brow → full crown → emperor halo).
// Calm and ancient, never snarling. Uses the threaded body + eye materials so it
// matches the wyrm's shell; the crown/halo accents flare on Surge (spineMats).

function buildCelestialMask(def, model, mats) {
  const { bodyMat, eyeMat } = mats;
  const head = new THREE.Group();
  const spineMats = [];
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cEye = def.eye ?? cSeam;
  const tier = model.maskTier ?? Math.round((model.crown ?? 0) * 3);
  const crown = model.crown ?? tier / 3;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);

  const crownMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? def.scales ?? cSeam, emissive: cSeam,
    emissiveIntensity: (0.7 + tier * 0.4) * giM, roughness: 0.28, metalness: 0.6,
    flatShading: true, side: THREE.DoubleSide,
  });
  crownMat.userData.baseEmissive = cSeam;
  crownMat.userData.baseIntensity = (0.7 + tier * 0.4) * giM;
  spineMats.push(crownMat);
  const slitMat = new THREE.MeshStandardMaterial({
    color: 0x111522, emissive: cEye, emissiveIntensity: 2.4 + tier * 0.7,
  });
  slitMat.userData.baseEmissive = cEye;
  slitMat.userData.baseIntensity = 2.4 + tier * 0.7;
  spineMats.push(slitMat);

  // Cranium — a faceted celestial shell tying the mask to the lead body plate.
  const skull = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 1), bodyMat);
  skull.scale.set(0.74, 0.84, 1.02);
  skull.position.set(0, 0.04, 0.1);
  head.add(skull);

  // Faceplate — a narrow regal mask tapering to a calm point at the front (-z),
  // flat-shaded as carved celestial stone, with a raised central ridge + cheek
  // facets so it reads as an emperor's visor, not a plain cone.
  const face = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 6), bodyMat);
  face.rotation.x = -Math.PI / 2;
  face.scale.set(0.78, 1, 0.5);
  face.position.set(0, -0.02, -0.62);
  head.add(face);
  const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.1, 4), crownMat);
  ridge.rotation.x = -Math.PI / 2; ridge.scale.set(1, 1, 0.4);
  ridge.position.set(0, 0.16, -0.6);
  head.add(ridge);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), bodyMat);
    cheek.scale.set(0.5, 0.9, 0.34);
    cheek.position.set(0.27 * s, -0.04, -0.34);
    cheek.rotation.z = s * 0.3;
    head.add(cheek);
  }

  // Eye slits — two thin glowing bars, angled calmly inward-down, each set with a
  // bright eye-jewel behind so the gaze reads as a star from the rear camera.
  for (const s of [-1, 1]) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.05), slitMat);
    slit.position.set(0.2 * s, 0.06, -0.5);
    slit.rotation.z = s * 0.32;
    slit.rotation.y = s * 0.18;
    head.add(slit);
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 + tier * 0.012, 0), slitMat);
    jewel.position.set(0.21 * s, 0.07, -0.46);
    head.add(jewel);
  }

  // Crown — a fan of raked celestial points rising off the brow, growing with the
  // form. Tier 0 has none (a bare faceplate); the emperor tier fans wide.
  const crownN = Math.round(crown * 6);          // 0 → 6 points
  for (let i = 0; i < crownN; i++) {
    const t = crownN > 1 ? (i / (crownN - 1)) * 2 - 1 : 0; // -1..1
    const h = (0.5 + crown * 0.5) - Math.abs(t) * 0.18;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, 4), crownMat);
    spire.scale.z = 0.45;
    spire.position.set(t * 0.34, 0.36 + h / 2 - Math.abs(t) * 0.08, 0.18);
    spire.rotation.x = -0.5 + Math.abs(t) * 0.2; // rake back, fan out
    spire.rotation.z = -t * 0.45;
    head.add(spire);
  }

  // Side brow projections (tier 1+) — short swept horns framing the mask.
  if (tier >= 1) {
    for (const s of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5 + tier * 0.12, 4), crownMat);
      horn.scale.z = 0.5;
      horn.position.set(0.34 * s, 0.18, 0.12);
      horn.rotation.z = s * 1.0;
      horn.rotation.x = -0.3;
      head.add(horn);
    }
  }

  // Halo — a thin partial ring behind the head (tier 2+), a second fragment at
  // the emperor tier. A celestial crown of light, open at the bottom.
  for (let r = 0; r < Math.max(0, tier - 1); r++) {
    const rr = 0.62 + r * 0.18;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(rr, 0.03, 8, 40, Math.PI * 1.3), crownMat);
    halo.position.set(0, 0.5, 0.28);
    halo.rotation.x = 0.3;
    halo.rotation.z = Math.PI - 0.65 - r * 0.1;  // open at the bottom
    head.add(halo);
  }

  return { group: head, spineMats };
}

registerHead('celestialMask', buildCelestialMask);
