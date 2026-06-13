import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import {
  buildArrowTorso, keelTopAt,
  DEFAULT_WING, wingSpecFor, buildWingShape, buildFeatherWingShape,
  archWing, archLift, wingStrut, applyWingGradient,
  buildCleanTail,
} from './dragonParts.js';

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
  const model = def.model;
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.38, metalness: 0.12,
    emissive: def.body, emissiveIntensity: 0.12,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: 0x6b3400, emissiveIntensity: 0.22, roughness: 0.24,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: 0.94,
    emissive: def.wingEmissive, emissiveIntensity: 0.28,
  });
  const scalesMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: 0x0b79aa, emissiveIntensity: 0.42,
    roughness: 0.28, metalness: 0.22,
  });
  const bellyMat = new THREE.MeshStandardMaterial({ color: def.belly, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: def.eye, emissiveIntensity: 2.2,
  });

  // --- Body foundation: aerodynamic arrowhead ----------------------------
  // A lofted blade torso (keel + strong shoulders + narrow hips) replaces the
  // round lathe so the body reads as a sleek predator, not a lump. DoubleSide
  // keeps the closed loft robust regardless of face winding.
  const torsoMat = bodyMat.clone();
  torsoMat.side = THREE.DoubleSide;
  const torso = new THREE.Mesh(buildArrowTorso(), torsoMat);
  torso.position.y = 0.2;
  group.add(torso);

  // Small smooth fairings where the wings attach, so they never look bolted on.
  for (const s of [-1, 1]) {
    const root = new THREE.Mesh(new THREE.SphereGeometry(0.3, 9, 7), bodyMat);
    root.scale.set(0.86, 0.78, 1.2);
    root.position.set(s * 0.46, 0.54, -0.4);
    group.add(root);
  }

  // Glowing dorsal spine — runs along the crest of the keel so it reads as a
  // bright stripe from directly behind. Ramps with the forms (spineGlow 0→1).
  if (model.spineGlow > 0) {
    const g = model.spineGlow;
    const spineCol = def.apexSeam || def.eye;
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineCol, emissive: spineCol,
      emissiveIntensity: 0.7 + g * 2.0, roughness: 0.3, metalness: 0.3,
    });
    const segN = 11;
    for (let i = 0; i < segN; i++) {
      const t = i / (segN - 1);
      const z = -1.7 + t * 3.4;                 // shoulders → tail root
      const top = 0.2 + keelTopAt(z);           // crest of the keel (torso y=0.2)
      const h = 0.16 + g * 0.22;
      const node = new THREE.Mesh(new THREE.ConeGeometry(0.04 + g * 0.045, h, 4), spineMat);
      node.rotation.x = -Math.PI / 2;
      node.position.set(0, top + h / 2 - 0.04, z);
      group.add(node);
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
    ridge.position.set(0, 0.2 + keelTopAt(-2.55 + i * ridgeStep) + 0.06, -2.55 + i * ridgeStep);
    group.add(ridge);
  }

  // Dorsal sail fin
  if (model.dorsal) {
    for (let i = 0; i < 5; i++) {
      const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
      const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, 4), scalesMat);
      df.rotation.x = -Math.PI / 2;
      const z = -1.6 + i * 0.8;
      df.position.set(0, 0.2 + keelTopAt(z) + h / 2, z);
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
      spine.position.set((i % 2 === 0 ? 0.08 : -0.08), 0.2 + keelTopAt(z) + h / 2, z);
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
      color: seamColor, emissive: seamColor, emissiveIntensity: 1.8, roughness: 0.3,
    });
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

  // Horns
  for (const s of [-1, 1]) {
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

  // Halo (Pearl/Seraph)
  if (model.halo) {
    const haloMat = new THREE.MeshStandardMaterial({
      color: def.eye, emissive: def.eye, emissiveIntensity: 2.4,
      roughness: 0.2, metalness: 0.5, transparent: true, opacity: 0.9,
    });
    const haloMesh = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 8, 24), haloMat);
    haloMesh.position.set(0, 1.32, 0);
    haloMesh.rotation.x = 0.18;
    head.add(haloMesh);
  }

  // Eyes
  const eyeR = 0.09 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 6), eyeMat);
    eye.position.set(0.29 * s, 0.2, -0.4);
    head.add(eye);
  }

  const neckSegs = model.neckSegments;
  head.position.set(0, 0.5 + (neckSegs - 4) * 0.09, -3.08 - (neckSegs - 4) * 0.34);
  group.add(head);

  // Neck — slim chain bridging the arrowhead's neck cap to the head.
  for (let i = 0; i < neckSegs; i++) {
    const neck = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.46 - i * 0.045, 0.2), 9, 7), bodyMat);
    neck.scale.set(0.8, 0.66, 1.3);
    neck.position.set(Math.sin(i * 0.8) * 0.1, 0.3 + i * 0.085, -2.0 - i * 0.36);
    group.add(neck);
  }

  // --- Tail --------------------------------------------------------------
  // Redesigned dragons (model.tailStyle) get the single clean tail; the rest of
  // the roster keeps the legacy segmented tail (fan / mace / simple).
  const tailSegs = [];
  if (model.tailStyle) {
    const { group: tailGroup, segs } = buildCleanTail(def, model, bodyMat);
    tailGroup.position.set(0, 0, 1.7); // continue from the slim tail root
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
  const wingSpec = featherShape ? DEFAULT_WING : wingSpecFor(model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.wingEmissive, emissiveIntensity: 0.35,
    roughness: 0.3, metalness: 0.5,
  });
  const veinMat = model.wingVeins ? new THREE.MeshStandardMaterial({
    color: def.apexSeam || def.wingEmissive,
    emissive: def.apexSeam || def.wingEmissive, emissiveIntensity: 1.7,
    roughness: 0.3, metalness: 0.4,
  }) : null;

  function buildWingSide(side) {
    const pivot = new THREE.Group();
    // Roots high on the back so the bowed wings lift clear of the torso.
    pivot.position.set(0.5 * side, 0.55, -0.25);

    const geo = new THREE.ShapeGeometry(featherShape ? buildFeatherWingShape() : buildWingShape(wingSpec), 14);
    geo.rotateX(-Math.PI / 2);
    geo.scale(1.34 * ws, 1.28 * ws, 1);
    applyWingGradient(geo, def, 0, 1);
    archWing(geo, arc, ws); // bow with the elbow profile (∝ ws)
    const membrane = new THREE.Mesh(geo, wingMat);
    membrane.scale.x = side;
    pivot.add(membrane);

    for (let i = 0; i < wingSpec.tips.length; i++) {
      const [px, py] = wingSpec.tips[i];
      const x = px * 1.34 * ws * side;
      const z = -py * 1.0;
      const lift = archLift(x, maxX, arc, ws);
      pivot.add(wingStrut(x, z, i === 0 ? 0.07 : 0.045, 0.012, boneMat, lift));
      if (veinMat) {
        const vein = wingStrut(x, z, i === 0 ? 0.042 : 0.028, 0.006, veinMat, lift);
        vein.position.y += 0.05;
        pivot.add(vein);
      }
    }

    const wingTip = new THREE.Group();
    wingTip.position.set(3.3 * ws * side, 0, 0);
    const marker = new THREE.Object3D();
    marker.position.set(wingSpec.tips[0][0] * 1.34 * ws * side - 3.3 * ws * side,
      archLift(maxX, maxX, arc, ws), -wingSpec.tips[0][1]);
    wingTip.add(marker);
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

  // Aura sprite (fever glow + idle premium aura)
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx.auraColor), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale);

  // Preview pedestal: rarity-tinted disc + spinning rune ring.
  if (opts.preview) {
    const RARITY_GLOW = { R: 0x4aff88, SR: 0x4ac0ff, SSR: 0xc060ff, SSSR: 0xffd040 };
    const glowHex = RARITY_GLOW[def.rarity] ?? RARITY_GLOW.R;
    const glowRgb = `${(glowHex >> 16) & 255},${(glowHex >> 8) & 255},${glowHex & 255}`;
    const wrapper = new THREE.Group();
    wrapper.add(group);

    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x0a0e1a, emissive: glowHex, emissiveIntensity: 0.5,
      roughness: 0.35, metalness: 0.75,
    });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.09, 32), pedMat);
    ped.position.y = -1.95;
    wrapper.add(ped);

    const runeMat = new THREE.MeshStandardMaterial({
      color: glowHex, emissive: glowHex, emissiveIntensity: 2.5, roughness: 0.15,
    });
    const nRunes = def.rarity === 'SSSR' ? 12 : def.rarity === 'SSR' ? 10 : 8;
    for (let i = 0; i < nRunes; i++) {
      const ang = (i / nRunes) * Math.PI * 2;
      const rune = new THREE.Mesh(new THREE.SphereGeometry(0.065, 5, 4), runeMat);
      rune.position.set(Math.cos(ang) * 1.15, -1.88, Math.sin(ang) * 1.15);
      wrapper.add(rune);
    }

    const groundGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(glowRgb), transparent: true, opacity: 0.48,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    groundGlow.scale.set(6.5, 3.5, 1);
    groundGlow.position.y = -2.1;
    wrapper.add(groundGlow);

    return {
      group: wrapper,
      parts: { head, tailSegs, wingPivotL, wingPivotR, wingTipL, wingTipR, wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR },
      materials: { bodyMat, wingMat, eyeMat },
      auraSprite,
    };
  }

  return {
    group,
    parts: {
      head, tailSegs,
      wingPivotL, wingPivotR,
      wingTipL, wingTipR,
      wingPivot2L, wingPivot2R,
      tipMarkerL, tipMarkerR,
    },
    materials: { bodyMat, wingMat, eyeMat },
    auraSprite,
  };
}

// Shared tick function for preview turntables — called by preview.js.
export function makePreviewTick(def, result) {
  const { group, parts, auraSprite } = result;
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R } = parts;
  return (t) => {
    group.rotation.y = t * 0.65;
    group.position.y = 0.1 + Math.sin(t * 1.4) * 0.06;
    const flap = Math.sin(t * 4.2 * (def.model.flapBias || 1)) * 0.5 * (def.model.flapAmp ?? 1);
    wingPivotR.rotation.z = -(flap - 0.15);
    wingPivotL.rotation.z =   flap - 0.15;
    if (wingPivot2L) wingPivot2L.rotation.z = flap * 0.7;
    if (wingPivot2R) wingPivot2R.rotation.z = -(flap * 0.7);
    for (let i = 0; i < tailSegs.length; i++) {
      tailSegs[i].position.x = Math.sin(t * 2.4 - i * 0.6) * 0.06 * (i + 1);
    }
    head.rotation.y = Math.sin(t * 0.9) * 0.18;
    if (auraSprite) {
      auraSprite.material.opacity = def.fx.auraIdle > 0
        ? 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12
        : 0;
    }
  };
}
