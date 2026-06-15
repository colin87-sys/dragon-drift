import * as THREE from 'three';
import { registerHead } from './dragonRecipe.js';

// Head modules — the third part behind the recipe registry. A head builder takes
// (def, model, mats) and returns a THREE.Group the rig sways via head.rotation,
// where mats = { bodyMat, hornMat, bellyMat, scalesMat, eyeMat } (the shared
// materials dragonModel already built). The head is positioned by the caller at
// the torso's attach.headBase, so a head sits correctly on any body plan.
//
//   horned — the shipped reptilian dragon head (snout + jaw + horns + cheek fins
//            + brows, with whisker / ear-frill / tusk / crest flags). Covers the
//            whole roster; hornLen 0 + earTendrils gives the hornless "frilled"
//            night-drake look without a separate module.
//   beaked — an avian head (curved beak, no snout/horns/whiskers), for firebirds
//            / griffins / sky-serpents. The variety lever; also the head the
//            Phoenix will use once it folds into a recipe.

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

  return head;
}

// ── BEAKED ────────────────────────────────────────────────────────────────
// A clean avian head: a compact skull, a hooked two-part beak (no snout/jaw box),
// forward eyes, and a raked-back crest. No horns/whiskers/tusks (those reptilian
// flags are ignored). Self-contained — for griffins, sky-serpents and firebirds.
// Same group conventions as the horned head so the rig sways it identically.
function buildBeakedHead(def, model, mats) {
  const { bodyMat, hornMat, scalesMat, eyeMat } = mats;
  const head = new THREE.Group();

  // Rounder, shorter skull than the drake muzzle.
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.66, 14, 12), bodyMat);
  skull.scale.set(1.0, 1.0, 1.12);
  skull.position.set(0, 0.02, -0.18);
  head.add(skull);

  // Hooked beak: a broad upper mandible curving to a point + a shorter lower one,
  // built from the horn material so it reads as keratin, not flesh.
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.15, 7), hornMat);
  upper.rotation.x = -Math.PI / 2;
  upper.scale.set(0.9, 1, 0.62);          // flatten top-to-bottom into a beak
  upper.position.set(0, 0.0, -1.02);
  head.add(upper);
  const lower = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.72, 7), hornMat);
  lower.rotation.x = -Math.PI / 2;
  lower.scale.set(0.82, 1, 0.55);
  lower.position.set(0, -0.2, -0.86);
  head.add(lower);
  // Cere / nostril ridge where the beak meets the skull.
  for (const s of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), hornMat);
    nostril.position.set(0.1 * s, 0.06, -0.62);
    head.add(nostril);
  }

  // Large forward-set raptor eyes (eyeScale-aware like the horned head).
  const eyeR = 0.11 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 9, 7), eyeMat);
    eye.position.set(0.3 * s, 0.16, -0.42);
    head.add(eye);
  }

  // Swept-back crest of head feathers/spines (a few more than the drake crest so
  // the avian read carries from behind). Sizes with model.crest, min 2.
  const crestN = Math.max(2, model.crest || 0);
  for (let i = 0; i < crestN; i++) {
    const t = crestN > 1 ? (i / (crestN - 1)) * 2 - 1 : 0; // -1..1 across the fan
    const h = 0.62 - Math.abs(t) * 0.18;
    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.06, h, 4), scalesMat);
    feather.scale.set(1, 1, 0.4);
    feather.position.set(t * 0.22, 0.66 + h / 2 - Math.abs(t) * 0.06, 0.12);
    feather.rotation.x = 0.7;            // rake back over the crown
    feather.rotation.z = -t * 0.4;       // fan outward
    head.add(feather);
  }

  return head;
}

registerHead('horned', buildHornedHead);
registerHead('beaked', buildBeakedHead);
