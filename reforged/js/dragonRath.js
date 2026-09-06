import * as THREE from 'three';
import {
  getTorsoBuilder, getWingsBuilder, getHeadBuilder, getTailBuilder,
  registerTorso, registerWings, registerHead, registerTail,
} from './dragonRecipe.js';

// Rath is deliberately assembled as an animal rather than a collection of glow
// props. These wrappers retain the battle-tested flight rig contracts while
// adding a bespoke, readable silhouette and physically plausible surface breaks.
const arrow = getTorsoBuilder('arrow');
const membrane = getWingsBuilder('membrane');
const draconic = getHeadBuilder('draconic');
const cleanTail = getTailBuilder('clean');

function material(color, roughness = 0.66, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
}

function boneBetween(a, b, radius, mat, radial = 7) {
  const d = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius, d.length(), radial), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
}

function claw(pos, rot, scale, mat) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.42, 6), mat);
  c.position.copy(pos); c.rotation.set(rot[0], rot[1], rot[2]); c.scale.setScalar(scale);
  return c;
}

registerTorso('rathHunterTorso', (def, model, bodyMat) => {
  const out = arrow(def, model, bodyMat);
  const g = out.group;
  const iron = material(def.scales, 0.5, 0.12);
  const bone = material(def.horn, 0.78, 0);
  const hide = material(def.body, 0.72, 0);
  const belly = material(def.belly, 0.84, 0);

  // Overlapping, offset dorsal scutes catch light without looking like beads.
  const count = Math.max(8, model.rathScutes ?? 18);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1), z = -1.72 + t * 3.45;
    const h = 0.10 + Math.sin(t * Math.PI) * 0.17;
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.10 + h * 0.14, h, 5), i % 4 ? iron : bone);
    s.position.set((i % 2 ? 1 : -1) * 0.025, out.attach.keelTopAt(z) + h * 0.38, z);
    s.rotation.x = -Math.PI / 2 - 0.24; s.rotation.z = (i % 2 ? 0.06 : -0.06);
    g.add(s);
  }

  // Muscular digitigrade hind legs: thigh -> hock -> long foot -> black talons.
  // Their low, wide stance makes Rath read as a dangerous terrestrial predator
  // during the shop turntable while remaining tucked in the chase view.
  for (const side of [-1, 1]) {
    const hip = new THREE.Vector3(side * 0.48, 0.12, 0.72);
    const knee = new THREE.Vector3(side * 0.86, -0.38, 0.90);
    const hock = new THREE.Vector3(side * 0.70, -0.92, 1.10);
    const foot = new THREE.Vector3(side * 0.78, -1.02, 0.48);
    g.add(boneBetween(hip, knee, 0.20, hide, 8));
    g.add(boneBetween(knee, hock, 0.14, belly, 7));
    g.add(boneBetween(hock, foot, 0.10, belly, 7));
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), belly);
    palm.scale.set(1.25, 0.55, 1.45); palm.position.copy(foot); g.add(palm);
    for (let d = -1; d <= 1; d++) {
      g.add(claw(new THREE.Vector3(foot.x + side * d * 0.09, foot.y - 0.02, foot.z - 0.18 - Math.abs(d) * 0.02),
        [-Math.PI / 2 - 0.38, 0, side * d * 0.12], 0.9, bone));
    }
  }

  return out;
});

registerWings('rathWarWings', (def, model, attach, giM) => {
  const out = membrane(def, model, attach, giM);
  const ink = material(0x351611, 0.8, 0);
  const horn = material(def.horn, 0.7, 0);
  // Layered root plates and wrist claws add thickness at the load-bearing joint.
  for (const side of [-1, 1]) {
    const root = attach.wingRoot(side);
    for (let i = 0; i < 4; i++) {
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.16 - i * 0.018, 0.65, 5), ink);
      plate.position.set(root.x + side * (0.18 + i * 0.18), root.y + 0.05, root.z + 0.12 + i * 0.08);
      plate.rotation.z = side * (-Math.PI / 2 + 0.16); plate.rotation.x = -0.16;
      out.group.add(plate);
    }
    const wrist = side === 1 ? out.parts.wingMidR : out.parts.wingMidL;
    if (wrist) {
      const spur = claw(new THREE.Vector3(side * 0.15, 0.08, -0.02), [-0.25, 0, side * -1.18], 1.35, horn);
      wrist.add(spur);
    }
  }
  return out;
});

registerHead('rathCrownHead', (def, model, mats) => {
  const out = draconic(def, model, mats);
  const g = out.group;
  const crown = material(def.scales, 0.52, 0.08);
  const horn = material(def.horn, 0.82, 0);
  // Rath's unmistakable crown: a low central blade, swept brow horns and cheek
  // guards framing the eyes rather than obscuring the face.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const h = 0.55 + i * 0.14;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.105, h, 5), i === 2 ? horn : crown);
      blade.position.set(side * (0.30 + i * 0.12), 0.48 + i * 0.08, 0.04 + i * 0.13);
      blade.rotation.set(-0.78 - i * 0.08, 0, side * (0.34 + i * 0.10)); g.add(blade);
    }
    const cheek = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.68, 5), crown);
    cheek.position.set(side * 0.46, -0.03, -0.36); cheek.rotation.set(-0.18, 0, side * -1.12); g.add(cheek);
  }
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.55, 5), crown);
  nose.position.set(0, 0.38, -0.78); nose.rotation.x = -1.16; g.add(nose);
  return out;
});

registerTail('rathMaceTail', (def, model, mats, anchor) => {
  const out = cleanTail(def, model, mats, anchor);
  const g = out.group;
  const maceMat = material(def.scales, 0.48, 0.16);
  const horn = material(def.horn, 0.78, 0);
  const mace = new THREE.Group(); mace.position.set(0, 0.02, (model.tailLength ?? 1) * 4.65);
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.30, 0), maceMat); core.scale.z = 1.25; mace.add(core);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.48, 5), horn);
    spike.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0);
    spike.rotation.z = -a + Math.PI / 2; mace.add(spike);
  }
  g.add(mace);
  return out;
});
