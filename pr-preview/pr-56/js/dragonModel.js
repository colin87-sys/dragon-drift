import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import {
  DEFAULT_WING, wingSpecFor, buildWingShape, buildFeatherWingShape,
  archWing, archLift, wingStrut, applyWingGradient,
  buildCleanTail, edgedFin,
} from './dragonParts.js';
import { resolveRecipe, getTorsoBuilder } from './dragonRecipe.js';
import './dragonTorso.js'; // self-registers the 'arrow' / 'serpent' torso profiles
import { buildPhoenixModel } from './phoenixModel.js';

// Unified procedural dragon mesh builder.
// Both the in-game rig (dragon.js) and the shop turntable (preview.js)
// consume this single function so they always show the same creature.
//
// The heavy redesigned geometry (arrowhead torso, elbow-profile wings, single
// clean tail) lives in dragonParts.js; this file assembles those, layers the
// per-dragon decoration flags, and exposes the animation hookpoints.
//
// Returns { group, parts, materials, auraSprite } where:
//   parts.wingPivotL/R, wingTipL/R, tipMarkerL/R — wing animation hookpoints
//   parts.head, parts.tailSegs                   — head/tail animation
//   materials.bodyMat, .wingMat, .eyeMat         — runtime-animated materials
//   auraSprite                                    — fever/idle aura

// Build the full dragon mesh from a resolved def (post-ascendedDef).
export function buildDragonModel(def, opts = {}) {
  // Legendary firebird archetype has an entirely separate model (avian body,
  // feather wings, flame-plume tail) but returns the same animation handles.
  if (def.archetype === 'phoenix') return buildPhoenixModel(def, opts);

  const model = def.model;
  const group = new THREE.Group();
  // Emissive multiplier (Radiant = 1.0; the apex can exceed 1) shared by every
  // glowing accent so a form's whole light signature ramps from one constant.
  // giM clamps the per-element emissive so high gi reads as MORE cyan glow
  // (chevrons/edges/particles), not a white-blown bloom under the ACES tone-map.
  const gi = model.glowIntensity ?? 1;
  const giM = Math.min(gi, 1.3);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.38, metalness: 0.12,
    emissive: def.body, emissiveIntensity: 0.12,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: 0x6b3400, emissiveIntensity: 0.22, roughness: 0.24,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.82, // translucent membrane — see rings through it
    // wingPanelGlow keeps the membrane mostly DARK on dragons that carry their
    // brightness on the edges (the cyan-rimmed apex) instead of the whole panel.
    // wingMembraneEmissive retints the PANEL glow (default = wingEmissive); the
    // stealth apex sets it to a dark navy so cyan stays on the edges, not the fill.
    emissive: def.wingMembraneEmissive ?? def.wingEmissive, emissiveIntensity: model.wingPanelGlow ?? 0.28,
  });
  const scalesMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: 0x0b79aa, emissiveIntensity: 0.42,
    roughness: 0.28, metalness: 0.22,
  });
  const bellyMat = new THREE.MeshStandardMaterial({ color: def.belly, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: def.eye, emissiveIntensity: 2.2,
  });

  // --- Body foundation: composable torso ---------------------------------
  // The body plan (torso loft + wing-root fairings + neck chain) comes from the
  // recipe's TORSO module (dragonTorso.js). That module also publishes the
  // ATTACH contract — where the wings, head and tail mount, and the keel crest
  // for the spine — so a different skeleton (e.g. the long 'serpent' profile)
  // drops in without changing any of the wing / head / tail / spine code below.
  const recipe = resolveRecipe(def);
  const { group: torsoGroup, attach } = getTorsoBuilder(recipe.torso)(def, model, bodyMat);
  group.add(torsoGroup);

  // Accent materials (spine plates, crest, glow seams, tail plates) that flare
  // toward white-gold during Dragon Surge — collected for the rig to drive.
  const spineMats = [];

  // Glowing dorsal spine — runs along the crest of the keel so it reads as a
  // bright stripe from directly behind. Ramps with the forms (spineGlow 0→1).
  // Dragons that author a dorsalGlowCount get the CHEVRON line below instead.
  if (model.spineGlow > 0 && !model.dorsalGlowCount) {
    const g = model.spineGlow;
    const spineCol = def.apexSeam || def.eye;
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineCol, emissive: spineCol,
      emissiveIntensity: (0.7 + g * 2.0) * gi, roughness: 0.3, metalness: 0.3,
    });
    spineMat.userData.baseEmissive = spineCol;
    spineMat.userData.baseIntensity = (0.7 + g * 2.0) * gi;
    spineMats.push(spineMat);
    const segN = 11;
    for (let i = 0; i < segN; i++) {
      const t = i / (segN - 1);
      const z = -1.7 + t * 3.4;                 // shoulders → tail root
      const top = attach.keelTopAt(z);          // crest of the keel (incl. torso y)
      const h = 0.16 + g * 0.22;
      const node = new THREE.Mesh(new THREE.ConeGeometry(0.04 + g * 0.045, h, 4), spineMat);
      node.rotation.x = -Math.PI / 2;
      node.position.set(0, top + h / 2 - 0.04, z);
      group.add(node);
    }
  }

  // Dorsal ENERGY LINE — a row of cyan chevrons marching head→tail along the keel
  // crest (the Night-drake signature). Reads as a bright "<<<" stripe straight
  // down the back from the top-rear camera; count + brightness ramp per form
  // (dorsalGlowCount / glowIntensity) so the apex is unmistakably more charged.
  if (model.dorsalGlowCount > 0) {
    const n = model.dorsalGlowCount;
    const chevCol = def.dorsalHi ?? def.apexSeam ?? def.eye;
    const chevInt = (0.6 + (model.spineGlow || 0) * 0.6) * giM;
    const chevMat = new THREE.MeshStandardMaterial({
      color: chevCol, emissive: chevCol, emissiveIntensity: chevInt,
      roughness: 0.3, metalness: 0.35,
    });
    chevMat.userData.baseEmissive = chevCol;
    chevMat.userData.baseIntensity = chevInt;
    spineMats.push(chevMat);
    const barLen = 0.17 + giM * 0.06;
    const barW = 0.03 + giM * 0.008;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const z = -1.75 + t * 3.55;               // shoulders → tail root
      const top = attach.keelTopAt(z);
      const wide = 0.10 + (1 - Math.abs(t - 0.45) * 1.4) * 0.05; // fuller across the mid-back
      const chev = new THREE.Group();
      for (const sx of [-1, 1]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barW, barLen * 1.5), chevMat);
        bar.position.set(sx * wide, 0, barLen * 0.36);
        bar.rotation.y = sx * 0.72;             // angle the two bars into a forward "^"
        chev.add(bar);
      }
      chev.position.set(0, top + 0.05, z);
      group.add(chev);
    }
  }

  // Heroic back-crest — a crown of swept, raked-back blades rising off the
  // shoulders. The apex's "crown-like, rear-visible" silhouette.
  if (model.backCrest) {
    const crestMat = new THREE.MeshStandardMaterial({
      color: def.horn, emissive: def.apexSeam || def.wingEmissive,
      emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.5,
      side: THREE.DoubleSide,
    });
    crestMat.userData.baseEmissive = def.apexSeam || def.wingEmissive;
    crestMat.userData.baseIntensity = 0.85;
    spineMats.push(crestMat);
    for (let i = 0; i < 5; i++) {
      const t = (i - 2) / 2;
      const h = 0.95 - Math.abs(t) * 0.32;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, 4), crestMat);
      blade.scale.set(1, 1, 0.38);
      blade.position.set(t * 0.5, 1.0 + h / 2 - Math.abs(t) * 0.14, -0.5);
      blade.rotation.x = -0.62;
      blade.rotation.z = -t * 0.55;
      group.add(blade);
    }
  }

  // Scale ridge (legacy back detailing kept for the rest of the roster)
  const ridgeCount = model.ridgeCount;
  const ridgeStep = Math.min(0.43, 5.2 / ridgeCount);
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(0.09 + Math.max(0, 5 - Math.abs(i - 4)) * 0.016, 0.34, 5), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, attach.keelTopAt(-2.55 + i * ridgeStep) + 0.06, -2.55 + i * ridgeStep);
    group.add(ridge);
  }

  // Dorsal sail fin
  if (model.dorsal) {
    for (let i = 0; i < 5; i++) {
      const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
      const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, 4), scalesMat);
      df.rotation.x = -Math.PI / 2;
      const z = -1.6 + i * 0.8;
      df.position.set(0, attach.keelTopAt(z) + h / 2, z);
      group.add(df);
    }
  }

  // Back spines (Toothless/Charizard — hidden rows that deploy)
  if (model.backSpines) {
    const spineMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.scales, emissiveIntensity: 0.35,
      roughness: 0.2, metalness: 0.3,
    });
    for (let i = 0; i < 7; i++) {
      const h = 0.22 + Math.sin((i / 6) * Math.PI) * 0.32;
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, 4), spineMat);
      spine.rotation.x = -Math.PI / 2;
      spine.rotation.z = (i % 2 === 0 ? 0.12 : -0.12);
      const z = -0.8 + i * 0.55;
      spine.position.set((i % 2 === 0 ? 0.08 : -0.08), attach.keelTopAt(z) + h / 2, z);
      group.add(spine);
    }
  }

  // Armor plates (Bahamut/Charizard — angular shoulder/flank overlays)
  if (model.armorPlates) {
    const plateMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: 0x0b79aa, emissiveIntensity: 0.38,
      roughness: 0.2, metalness: 0.55,
    });
    for (const [zp, sx, ry, rz] of [
      [-1.2, 0.72, 0.3, -0.28], [-1.2, -0.72, -0.3, 0.28],
      [-0.5, 0.62, 0.44, -0.32], [-0.5, -0.62, -0.44, 0.32],
      [0.1, 0.5, 0.55, -0.38], [0.1, -0.5, -0.55, 0.38],
    ]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.14), plateMat);
      plate.position.set(sx, 0.46, zp);
      plate.rotation.set(0, ry, rz);
      group.add(plate);
    }
  }

  // Glow seams (under-scale emissive veins — Bahamut/Toothless at apex)
  if (model.glowSeams) {
    const seamColor = def.apexSeam || def.eye;
    const seamMat = new THREE.MeshStandardMaterial({
      color: seamColor, emissive: seamColor, emissiveIntensity: 1.8 * giM, roughness: 0.3,
    });
    seamMat.userData.baseEmissive = seamColor;
    seamMat.userData.baseIntensity = 1.8 * giM;
    spineMats.push(seamMat);
    for (const xo of [-0.26, 0.26]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 3.4), seamMat);
      seam.position.set(xo, 0.5, -0.7);
      group.add(seam);
    }
  }

  // Blade fins (Pearl — sharp blade-like lateral fins)
  if (model.bladeFins) {
    const bladeMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.eye, emissiveIntensity: 0.5,
      roughness: 0.15, metalness: 0.6, side: THREE.DoubleSide,
    });
    for (const [sx, zp, ang] of [
      [0.62, -1.0, -0.55], [-0.62, -1.0, 0.55],
      [0.5, -0.2, -0.65], [-0.5, -0.2, 0.65],
    ]) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.9, 4), bladeMat);
      blade.position.set(sx, 0.35, zp);
      blade.rotation.z = ang;
      blade.rotation.x = -0.15;
      group.add(blade);
    }
  }

  // Head group
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

  // Pearl's luminous aura: a soft opalescent glow, NOT a hard torus ring (the
  // old ring read like a collar / UI artefact). Elegant and pristine.
  if (model.halo) {
    const haloRgb = `${(def.eye >> 16) & 255},${(def.eye >> 8) & 255},${def.eye & 255}`;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(haloRgb), transparent: true, opacity: 0.34,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(3.4, 4.0, 1);
    glow.position.set(0, 0.7, 0.05);
    glow.layers.set(1);
    group.add(glow);
  }

  // Eyes
  const eyeR = 0.09 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 6), eyeMat);
    eye.position.set(0.29 * s, 0.2, -0.4);
    head.add(eye);
  }

  // Head sits at the torso's published head anchor (varies per body plan); the
  // neck chain bridging the torso's neck cap to the head is built inside the
  // torso module (it's part of the body-plan identity — long on a serpent).
  const hb = attach.headBase;
  head.position.set(hb.x, hb.y, hb.z);
  group.add(head);

  // --- Tail --------------------------------------------------------------
  // Redesigned dragons (model.tailStyle) get the single clean tail; the rest of
  // the roster keeps the legacy segmented tail (fan / mace / simple).
  const tailSegs = [];
  let tailFins = null;
  if (model.tailStyle) {
    // Tail root anchored at hipRear and overlapping the body (base radius ≈ hip
    // width) so it flows out of the torso seamlessly — never a detached spear.
    const { group: tailGroup, segs, accentMats, tailFins: tf } = buildCleanTail(def, model, bodyMat);
    if (accentMats) for (const m of accentMats) spineMats.push(m);
    tailFins = tf;
    tailGroup.position.set(0, attach.tailAnchor.y, attach.tailAnchor.z);
    group.add(tailGroup);
    for (const s of segs) tailSegs.push(s);
  } else {
    let radius = 0.4;
    let zTail = 1.7;
    const nTail = Math.min(model.tailSegments, 9);
    const taper = nTail > 7 ? 0.74 : 0.78;
    for (let i = 0; i < nTail; i++) {
      const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, 0.95, 7), bodyMat);
      seg.rotation.x = Math.PI / 2;
      seg.position.set(0, 0.1, zTail);
      group.add(seg);
      tailSegs.push(seg);
      zTail += 0.58;
      radius = Math.max(radius * taper, 0.08);
    }
    const bladeMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.wingEmissive, emissiveIntensity: 0.7,
      roughness: 0.25, metalness: 0.5, side: THREE.DoubleSide,
    });
    if (model.maceTail) {
      const mace = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 7), bladeMat);
      mace.position.set(0, 0.1, zTail);
      group.add(mace);
      tailSegs.push(mace);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 4), bladeMat);
        spike.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24 + 0.1, zTail);
        spike.rotation.z = Math.sin(a) * Math.PI / 2;
        spike.rotation.x = Math.cos(a) * Math.PI / 2;
        group.add(spike);
      }
    } else if (model.tailTip === 'fan') {
      for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.48;
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.74, 5), scalesMat);
        fin.rotation.set(Math.PI / 2, 0, angle);
        fin.position.set(Math.sin(angle) * 0.14, Math.cos(angle) * 0.14 + 0.1, zTail);
        group.add(fin);
        tailSegs.push(fin);
      }
    } else {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 5), scalesMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, 0.1, zTail);
      group.add(tip);
      tailSegs.push(tip);
    }
  }

  // --- Wings -------------------------------------------------------------
  // One membrane per side, bowed along its per-form elbow profile so each tier
  // reads as a distinct wing from directly behind. The pivot flaps; the wingTip
  // group carries the contrail marker.
  const ws = model.wingScale;
  const featherShape = model.wingShape === 'feather';
  const wingSpec = featherShape ? DEFAULT_WING : wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.wingEmissive, emissiveIntensity: 0.35,
    roughness: 0.3, metalness: 0.5,
  });
  const veinMat = model.wingVeins ? new THREE.MeshStandardMaterial({
    color: def.apexSeam || def.wingEmissive,
    emissive: def.apexSeam || def.wingEmissive, emissiveIntensity: 1.7 * giM,
    roughness: 0.3, metalness: 0.4,
  }) : null;
  // Brighter, thicker leading-edge ARM bone so the wing reads as bone + membrane
  // (an organic limb) instead of a flat triangular plane.
  const armMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.apexSeam || def.wingEmissive,
    emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.55,
  });

  // Premium edge accents (apex forms only): a bright cyan RIM material + a dark
  // fin membrane, shared by the wingtip winglets, the wing trailing-edge glow and
  // the hip fins. Built lazily so only the forms that ask for them pay the cost;
  // the rim flares on Surge via spineMats.
  const wantsEdge = model.wingtipFins || model.wingEdgeGlow || model.hipFins;
  const finMembraneMat = wantsEdge ? new THREE.MeshStandardMaterial({
    color: def.wingInner || def.body, emissive: def.body, emissiveIntensity: 0.16,
    roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide, transparent: true, opacity: 0.94,
  }) : null;
  // Clamp the rim emissive so the cyan edge never blooms to white at high gi.
  const finEdgeInt = 0.7 + giM * 0.35;
  const finEdgeMat = wantsEdge ? new THREE.MeshStandardMaterial({
    color: def.wingEmissive, emissive: def.wingEmissive,
    emissiveIntensity: finEdgeInt, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
  }) : null;
  if (finEdgeMat) {
    finEdgeMat.userData.baseEmissive = def.wingEmissive;
    finEdgeMat.userData.baseIntensity = finEdgeInt;
    spineMats.push(finEdgeMat);
  }

  // Split the membrane at the WRIST into an inner panel (root→wrist, on the flap
  // pivot) and an outer panel (wrist→tip, on the wingTip group). The wingTip
  // already carries a lagged wrist-wave in the flap animation (dragon.js /
  // makePreviewTick) that previously moved nothing; handing it the outer membrane
  // makes the wing FOLD at the wrist for a fluid two-segment beat instead of a
  // rigid single hinge. Both panels reuse the SAME shape (verts outside the panel
  // collapse onto a shared seam, with a small overlap to hide the joint) and the
  // outer panel is re-origined to the seam, so at rest every vertex lands exactly
  // where the old single membrane did — the silhouette is unchanged, the motion
  // gains a wrist break.
  const wristXGeo = 3.3 * ws;
  const seamOv = 0.22 * ws;
  const wristLift = archLift(wristXGeo, maxX, arc, ws);
  function membranePanel(clipMin, clipMax, originX, originY) {
    const g2 = new THREE.ShapeGeometry(featherShape ? buildFeatherWingShape() : buildWingShape(wingSpec), 14);
    g2.rotateX(-Math.PI / 2);
    // 3rd factor = wing CHORD (front-to-back depth); wingChord deepens the apex
    // wing without widening its span (span rides ws). Default 1 = unchanged.
    g2.scale(1.34 * ws, 1.28 * ws, model.wingChord ?? 1);
    applyWingGradient(g2, def, 0, 1);
    archWing(g2, arc, ws); // bow with the elbow profile (∝ ws)
    const pos = g2.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (x < clipMin) pos.setX(i, clipMin);
      else if (x > clipMax) pos.setX(i, clipMax);
    }
    pos.needsUpdate = true;
    if (originX || originY) g2.translate(-originX, -originY, 0);
    return g2;
  }

  function buildWingSide(side) {
    const pivot = new THREE.Group();
    // Root reported by the torso's attach contract, so the wings mount correctly
    // on any body plan (high on the back for the arrow drake, further forward and
    // lower on the long serpent) without this code knowing which body it's on.
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // Shoulder joint — a small mass anchoring the wing to the body.
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 9, 7), armMat);
    shoulder.scale.set(1.1, 0.9, 1.2);
    pivot.add(shoulder);

    // Inner membrane panel (root→wrist) rides the flap pivot.
    const innerMem = new THREE.Mesh(membranePanel(-Infinity, wristXGeo + seamOv, 0, 0), wingMat);
    innerMem.scale.x = side;
    pivot.add(innerMem);

    // Forearm bone: root → wrist (the inner leading edge), stays on the pivot.
    pivot.add(wingStrut(wristXGeo * side, 0, 0.1, 0.04, armMat, wristLift));

    // wingTip pivots AT the wrist seam (x + arch-lift) so the outer panel folds
    // cleanly; its membrane is re-origined to the seam to sit exactly where the
    // old single membrane did at rest.
    const wingTip = new THREE.Group();
    wingTip.position.set(wristXGeo * side, wristLift, 0);
    const outerMem = new THREE.Mesh(membranePanel(wristXGeo - seamOv, Infinity, wristXGeo, wristLift), wingMat);
    outerMem.scale.x = side;
    wingTip.add(outerMem);

    // Finger / outer-arm bones (wrist → tips) ride wingTip so they FOLD WITH the
    // outer membrane — the bright leading edge breaks at the wrist instead of
    // staying rigid while the membrane folds away from it. (i=0 is the bright
    // "hand" continuing the forearm; the rest are slimmer finger struts.)
    for (let i = 0; i < wingSpec.tips.length; i++) {
      const [px, py] = wingSpec.tips[i];
      const z = -py * 1.0;
      const tipLift = archLift(px * 1.34 * ws * side, maxX, arc, ws);
      const lead = i === 0;
      const bx = px * 1.34 * ws * side - wristXGeo * side; // bone origin = the wrist
      const by = tipLift - wristLift;
      wingTip.add(wingStrut(bx, z, lead ? 0.1 : 0.04, lead ? 0.02 : 0.012,
        lead ? armMat : boneMat, by));
      if (veinMat && !lead) {
        const vein = wingStrut(bx, z, 0.028, 0.006, veinMat, by);
        vein.position.y += 0.05;
        wingTip.add(vein);
      }
    }

    const marker = new THREE.Object3D();
    marker.position.set(wingSpec.tips[0][0] * 1.34 * ws * side - wristXGeo * side,
      archLift(maxX, maxX, arc, ws) - wristLift, -wingSpec.tips[0][1]);
    wingTip.add(marker);

    // Premium cyan TRAILING-EDGE rim (apex): trace tip[i]→tip[i+1] with thin
    // emissive ribs so the wing reads as a dark membrane with a glowing outline
    // (never a solid glowing panel). Rides wingTip so it folds at the wrist too.
    if (model.wingEdgeGlow && finEdgeMat) {
      for (let i = 0; i < wingSpec.tips.length - 1; i++) {
        const [ax, ay] = wingSpec.tips[i];
        const [bx, by] = wingSpec.tips[i + 1];
        const a = new THREE.Vector3(ax * 1.34 * ws * side - wristXGeo * side,
          archLift(ax * 1.34 * ws * side, maxX, arc, ws) - wristLift, -ay);
        const b = new THREE.Vector3(bx * 1.34 * ws * side - wristXGeo * side,
          archLift(bx * 1.34 * ws * side, maxX, arc, ws) - wristLift, -by);
        const dir = b.clone().sub(a);
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, dir.length(), 5), finEdgeMat);
        rib.position.copy(a).add(b).multiplyScalar(0.5);
        rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        wingTip.add(rib);
      }
    }

    // Wingtip winglet (apex): a small swept fin at the very tip — dark membrane,
    // cyan rim, smooth bat-like — adding a distinctive outer-edge silhouette.
    if (model.wingtipFins && finEdgeMat) {
      const winglet = edgedFin(0.16, 0.5, finMembraneMat, finEdgeMat, 1.2);
      winglet.position.copy(marker.position);
      winglet.rotation.x = Math.PI / 2 + 0.35;     // lay back along the trailing direction
      winglet.rotation.z = side * 0.55;
      winglet.scale.setScalar(0.5 + ws * 0.45);
      wingTip.add(winglet);
    }

    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  }

  const R = buildWingSide(1);
  const L = buildWingSide(-1);
  const wingPivotR = R.pivot, wingTipR = R.wingTip, tipMarkerR = R.marker;
  const wingPivotL = L.pivot, wingTipL = L.wingTip, tipMarkerL = L.marker;

  // Secondary small wing pair (Obsidian T4/Toothless — near tail base)
  let wingPivot2L = null;
  let wingPivot2R = null;
  if (model.secondWingPair) {
    const ws2 = ws * 0.48;
    const miniGeo = new THREE.ShapeGeometry(buildWingShape(DEFAULT_WING));
    miniGeo.rotateX(-Math.PI / 2);
    miniGeo.scale(ws2, ws2, 1);
    applyWingGradient(miniGeo, def, 0.3, 0.9);
    const miniMat = wingMat.clone();

    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.4, 0.3, 1.2);
      const w = new THREE.Mesh(miniGeo, miniMat);
      w.scale.x = s;
      pivot.add(w);
      group.add(pivot);
      if (s === 1) wingPivot2R = pivot;
      else wingPivot2L = pivot;
    }
  }

  // Hip / side fins (apex): a small swept fin at each hip — subtle, dark with a
  // cyan rim — filling the gap between the wings and the twin tail stabilizers so
  // the whole rear silhouette flows together.
  if (model.hipFins && finEdgeMat) {
    for (const s of [-1, 1]) {
      const hip = edgedFin(0.13, 0.42, finMembraneMat, finEdgeMat, 1.2);
      hip.position.set(s * 0.34, 0.24, 0.95);
      hip.rotation.x = Math.PI / 2 + 0.2;        // lay back, sweeping toward the tail
      hip.rotation.z = s * 0.7;                  // splay outward and down
      hip.rotation.y = s * 0.2;
      group.add(hip);
    }
  }

  // Solar aura card (apex only): a tall narrow backlight behind the body — a
  // corona, not a ring that competes with the collectible rings.
  if (model.auraHalo) {
    const haloRgb = def.apexSeam
      ? `${(def.apexSeam >> 16) & 255},${(def.apexSeam >> 8) & 255},${def.apexSeam & 255}`
      : def.fx.auraColor;
    const auraCard = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(haloRgb), transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    auraCard.scale.set(4.0, 6.2, 1);
    auraCard.position.set(0, 0.9, 0.25);
    group.add(auraCard);
  }

  // Violet core energy — a soft amethyst glow nestled between the shoulders that
  // reads as the dragon's power source. Faint on the hatchling, stronger each
  // form (escalates with spineGlow). Controlled size/opacity so it never blooms
  // over the body silhouette. Tagged so the rig can pulse it during Surge.
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.45 + (model.spineGlow || 0) * 0.55;
    const coreRgb = `${(def.coreGlow >> 16) & 255},${(def.coreGlow >> 8) & 255},${def.coreGlow & 255}`;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(coreRgb), transparent: true, opacity: 0.18 + lvl * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.85 + lvl * 0.7);
    coreGlow.position.set(0, 0.5, -0.35); // between the shoulders, on the back
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // Aura sprite (fever glow + idle premium aura)
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx.auraColor), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale);

  // Shop preview: a clean flying showcase (no turntable / no pedestal). Downscale
  // so the widest apex wings fit the small card, and float a soft rarity-tinted
  // corona behind the dragon instead of a spinning rune disc.
  if (opts.preview) {
    const RARITY_GLOW = { R: 0x6affa0, SR: 0x4ac0ff, SSR: 0xc060ff, SSSR: 0xffd040 };
    // A dragon's own signature corona (previewAccent) wins over the rarity tint so
    // its card/showcase stays on-brand (Obsidian cyan, not rarity gold/purple).
    const glowHex = def.previewAccent ?? (RARITY_GLOW[def.rarity] ?? RARITY_GLOW.R);
    const glowRgb = `${(glowHex >> 16) & 255},${(glowHex >> 8) & 255},${glowHex & 255}`;
    const wrapper = new THREE.Group();
    wrapper.add(group);

    const corona = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(glowRgb), transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    corona.scale.set(5.5, 5.5, 1);
    corona.position.set(0, 0.25, -0.6);
    wrapper.add(corona);

    return {
      group: wrapper,
      parts: { head, tailSegs, tailFins, wingPivotL, wingPivotR, wingTipL, wingTipR, wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR, coreGlow },
      materials: { bodyMat, wingMat, eyeMat, spineMats },
      auraSprite,
    };
  }

  return {
    group,
    parts: {
      head, tailSegs, tailFins,
      wingPivotL, wingPivotR,
      wingTipL, wingTipR,
      wingPivot2L, wingPivot2R,
      tipMarkerL, tipMarkerR,
      coreGlow,
    },
    materials: { bodyMat, wingMat, eyeMat, spineMats },
    auraSprite,
  };
}

// Shared tick for the shop preview — NOT a turntable. The dragon faces away and
// FLAPS exactly like it does in flight (banking, bobbing, coiling its tail), so
// scrubbing forms reads like a real "what you'll fly" preview instead of a janky
// spinning model.
export function makePreviewTick(def, result) {
  const { group, parts, auraSprite } = result;
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R, wingTipL, wingTipR } = parts;
  const flapBias = def.model.flapBias || 1;
  const flapAmp = def.model.flapAmp ?? 1;
  return (t) => {
    // Float + gentle bank/pitch — the in-flight read, no spin.
    group.position.y = 0.15 + Math.sin(t * 1.5) * 0.09;
    group.rotation.y = 0;
    group.rotation.z = Math.sin(t * 0.7) * 0.13;        // lazy bank left/right
    group.rotation.x = -0.05 + Math.sin(t * 1.5 + 1) * 0.03;
    // Wingbeat — same shape as the live rig (root flap + feather pitch).
    const phase = t * 6.2 * flapBias;
    const flap = Math.sin(phase) * 0.52 * flapAmp + 0.12;
    const feather = Math.sin(phase + Math.PI * 0.55) * 0.16;
    wingPivotR.rotation.z = -flap;
    wingPivotL.rotation.z = flap;
    wingPivotR.rotation.x = 0.12 + feather;
    wingPivotL.rotation.x = 0.12 - feather;
    if (wingPivot2L) { wingPivot2L.rotation.z = flap * 0.65; wingPivot2R.rotation.z = -flap * 0.65; }
    // Wrist fold — the outer membrane lags the root flap so the wing breaks at
    // the wrist (matches the in-game rig; needs the split outer panel to be felt).
    if (wingTipR) {
      const tipLag = Math.sin(phase + 0.95) * 0.34;
      wingTipR.rotation.z = tipLag;
      wingTipL.rotation.z = -Math.sin(phase + 1.18) * 0.34;
      wingTipR.rotation.x = -0.06 + feather;
      wingTipL.rotation.x = -0.06 - feather;
    }
    // Root-locked snake coil (x + y) so the tail stays attached and alive.
    const nT = tailSegs.length;
    for (let i = 0; i < nT; i++) {
      const lock = nT > 1 ? i / (nT - 1) : 0;
      const l2 = lock * lock;
      const tp = t * 3.6 - i * 0.6;
      tailSegs[i].position.x = Math.sin(tp) * 0.3 * l2;
      tailSegs[i].position.y = Math.cos(tp * 0.8) * 0.16 * l2;
      tailSegs[i].rotation.z = -Math.sin(tp) * 0.16 * l2;
    }
    head.rotation.y = Math.sin(t * 0.9) * 0.1;
    if (auraSprite) {
      auraSprite.material.opacity = def.fx.auraIdle > 0
        ? 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12
        : 0;
    }
  };
}
