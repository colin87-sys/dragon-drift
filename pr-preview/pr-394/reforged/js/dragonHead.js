import * as THREE from 'three';
import { registerHead } from './dragonRecipe.js';
import { featherGeo } from './dragonParts.js';

// Head modules — the third part behind the recipe registry. A head builder takes
// (def, model, mats) and returns { group, spineMats }: a THREE.Group the rig
// sways via head.rotation, plus any Surge-flaring accent materials. mats =
// { bodyMat, hornMat, bellyMat, scalesMat, eyeMat } (shared materials the torso /
// dragonModel built; bodyMat + eyeMat may be overridden by the torso so the head
// matches the body). The head is positioned by the caller at attach.headBase.
//
//   horned — the shipped reptilian dragon head (snout + jaw + horns + cheek fins
//            + brows, with whisker / ear-frill / tusk / crest flags). Covers the
//            whole roster; hornLen 0 + earTendrils gives the hornless "frilled"
//            night-drake look without a separate module.
//   beaked — an avian head (hooked beak + a back-raked FEATHER crown, no horns),
//            for firebirds / griffins / sky-serpents — the head the Phoenix uses
//            now that it composes from a recipe. F (model.formLevel) grows the
//            crown; the crown flares on Surge.

// ── HORNED ────────────────────────────────────────────────────────────────
// Transcribed verbatim from the original inline builder — byte-identical output,
// verified by triangle-count parity. The Pearl head halo stays a body-level
// sprite in dragonModel (it mounts on the group, not the head), so it is not here.
function buildHornedHead(def, model, mats) {
  const { bodyMat, hornMat, bellyMat, scalesMat, eyeMat } = mats;
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.74, 14, 12), bodyMat);
  skull.scale.set(1.28, 0.82, 0.95);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.5, 8), bodyMat);
  snout.rotation.x = -Math.PI / 2;
  snout.scale.set(0.84, 1, 1.18);
  snout.position.set(0, -0.08, -1.05);
  head.add(skull, snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.6), bellyMat);
  jaw.position.set(0, -0.32, -0.72);
  head.add(jaw);

  for (const s of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), hornMat);
    nostril.position.set(0.13 * s, -0.1, -1.26);
    head.add(nostril);
  }

  // Whiskers (Jade/Pearl)
  if (model.whiskers) {
    for (const [sx, angle] of [[-0.18, 0.3], [0.18, -0.3], [-0.1, 0.52], [0.1, -0.52]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.005, 0.8, 4), scalesMat);
      w.rotation.set(Math.PI / 2 + 0.08, 0, angle);
      w.position.set(sx, -0.13, -1.2);
      head.add(w);
    }
  }

  // Ear tendrils (Obsidian/Toothless)
  if (model.earTendrils) {
    const tendrilMat = new THREE.MeshStandardMaterial({
      color: def.body, emissive: def.eye, emissiveIntensity: 0.4,
      roughness: 0.55, side: THREE.DoubleSide,
    });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const h = 0.42 - i * 0.08;
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.065, h, 4), tendrilMat);
        t.position.set(0.6 * s, 0.28 + i * 0.12, 0.38 + i * 0.18);
        t.rotation.x = 0.4 + i * 0.12;
        t.rotation.z = s * (0.9 + i * 0.15);
        head.add(t);
      }
    }
  }

  // Horns — skipped entirely when hornLen is 0 (the bare hatchling form, before
  // the first evolution sprouts its horns). Cheek fins stay as facial structure.
  for (const s of [-1, 1]) {
    if (model.hornLen > 0) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, model.hornLen, 6), hornMat);
      horn.position.set(0.4 * s, 0.52, 0.26);
      horn.rotation.x = 0.65;
      horn.rotation.z = s * -0.2;
      head.add(horn);
      if (model.hornPairs > 1) {
        const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.11, model.hornLen * 0.62, 6), hornMat);
        horn2.position.set(0.24 * s, 0.48, 0.52);
        horn2.rotation.x = 0.95;
        horn2.rotation.z = s * -0.34;
        head.add(horn2);
      }
    }
    const cheekFin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.68, 5), scalesMat);
    cheekFin.position.set(0.56 * s, 0.02, -0.12);
    cheekFin.rotation.z = s * -1.2;
    cheekFin.rotation.x = 0.25;
    head.add(cheekFin);
  }

  // Tusks (Solar/Bahamut)
  if (model.tusks) {
    for (const s of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.46, 5), hornMat);
      tusk.position.set(0.28 * s, -0.26, -0.84);
      tusk.rotation.x = -0.45;
      tusk.rotation.z = s * 0.2;
      head.add(tusk);
    }
  }

  // Brow ridges
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), scalesMat);
    brow.position.set(0.26 * s, 0.42, -0.1);
    brow.rotation.x = 0.9;
    head.add(brow);
  }

  // Crest spines (head)
  const crestCount = model.crest || 0;
  for (let i = 0; i < crestCount; i++) {
    const h = 0.42 + i * 0.1;
    const crestSpine = new THREE.Mesh(new THREE.ConeGeometry(0.08 - i * 0.01, h, 5), scalesMat);
    crestSpine.position.set(0, 0.86 + h / 2, 0.36 - i * 0.22);
    crestSpine.rotation.x = 0.28 + i * 0.08;
    head.add(crestSpine);
  }

  // Eyes
  const eyeR = 0.09 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 6), eyeMat);
    eye.position.set(0.29 * s, 0.2, -0.4);
    head.add(eye);
  }

  return { group: head, spineMats: [] };
}

// ── BEAKED ────────────────────────────────────────────────────────────────
// The firebird/avian head (the Phoenix's, folded out of its bespoke builder): a
// compact skull, a hooked two-part beak, forward eyes, and a back-raked FEATHER
// crown that grows with the form (F) and flares on Surge. No snout/horns/whiskers.
// Skull + eyes use the threaded body/eye materials so they match the body and
// rig-pulse with it; the beak/crown use the dragon's horn + apex-seam accents.
function buildBeakedHead(def, model, mats) {
  const { bodyMat, eyeMat } = mats;
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCrest = def.horn ?? def.scales;
  const armMat = new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.5, roughness: 0.32, metalness: 0.45,
  });
  const crestMat = new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.8 + F * 0.6, roughness: 0.3, metalness: 0.4,
    side: THREE.DoubleSide,
  });
  crestMat.userData.baseEmissive = cSeam;
  crestMat.userData.baseIntensity = 0.8 + F * 0.6;

  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 10), bodyMat);
  skull.scale.set(0.92, 0.98, 1.06);
  head.add(skull);
  const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.52, 6), armMat);
  upperBeak.rotation.x = -Math.PI / 2; upperBeak.scale.set(0.92, 1, 0.66);
  upperBeak.position.set(0, 0.02, -0.46);
  head.add(upperBeak);
  const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 6), armMat);
  lowerBeak.rotation.x = -Math.PI / 2; lowerBeak.scale.set(0.8, 1, 0.6);
  lowerBeak.position.set(0, -0.12, -0.38);
  head.add(lowerBeak);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat);
    eye.position.set(0.17 * s, 0.07, -0.16);
    head.add(eye);
  }
  // Crown plume: a fan of back-swept crest feathers rising off the head.
  const crownN = 3 + F;
  for (let i = 0; i < crownN; i++) {
    const t = crownN > 1 ? (i / (crownN - 1)) * 2 - 1 : 0; // -1..1
    const h = (0.5 + F * 0.16) - Math.abs(t) * 0.16;
    const cf = new THREE.Mesh(featherGeo(h, 0.13), crestMat);
    cf.position.set(t * 0.16, 0.3, 0.06);
    cf.rotation.x = -1.0;           // rake back
    cf.rotation.z = -t * 0.5;       // fan
    head.add(cf);
  }

  return { group: head, spineMats: [crestMat] };
}

registerHead('horned', buildHornedHead);
registerHead('beaked', buildBeakedHead);
