import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// Unified procedural dragon mesh builder.
// Both the in-game rig (dragon.js) and the shop turntable (preview.js)
// consume this single function so they always show the same creature.
//
// Returns { group, parts, materials, auraSprite } where:
//   parts.wingPivotL/R, wingTipL/R, tipMarkerL/R — wing animation hookpoints
//   parts.head, parts.tailSegs                   — head/tail animation
//   materials.bodyMat, .wingMat, .eyeMat         — runtime-animated materials
//   auraSprite                                    — fever/idle aura

// --- Wing geometry helpers ---

function buildWingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.5, 2.2, 1.0, 3.0, 0.7);
  s.lineTo(4.8, 0.2);
  s.lineTo(5.2, -0.5);
  s.bezierCurveTo(4.0, -1.0, 2.4, -1.4, 1.2, -1.2);
  s.lineTo(0, -0.4);
  return s;
}

function buildFeatherWingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.5, 2.2, 1.0, 3.0, 0.7);
  s.lineTo(4.8, 0.2);
  s.lineTo(4.6, -0.25); s.lineTo(4.2, -0.05);
  s.lineTo(3.8, -0.55); s.lineTo(3.3, -0.2);
  s.lineTo(2.8, -0.8);  s.lineTo(2.2, -0.4);
  s.lineTo(1.6, -1.05); s.lineTo(1.2, -0.75);
  s.bezierCurveTo(0.8, -0.6, 0.4, -0.45, 0, -0.4);
  return s;
}

const innerC = new THREE.Color();
const outerC = new THREE.Color();
function applyWingGradient(geo, palette, tStart = 0, tEnd = 1) {
  innerC.setHex(palette.wingInner);
  outerC.setHex(palette.wingOuter);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const spanX = Math.max(bb.max.x - bb.min.x, 1e-5);
  for (let i = 0; i < pos.count; i++) {
    const kx = Math.abs(pos.getX(i) - (Math.abs(bb.min.x) > Math.abs(bb.max.x) ? bb.max.x : bb.min.x)) / spanX;
    const t = tStart + (tEnd - tStart) * kx;
    c.lerpColors(innerC, outerC, Math.min(t, 1));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// Build the full dragon mesh from a resolved def (post-ascendedDef).
// opts.detail: 'full' (game) | 'preview' (shop — same mesh, can tune later)
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

  // Body core
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.9, 8, 14), bodyMat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.72, 0.62, 1);
  group.add(body);

  const bodyProfile = [
    [-1.75, 0.82, 0.68, 1.0], [-1.22, 1.02, 0.8, 1.08],
    [-0.68, 0.86, 0.66, 1.0], [-0.12, 0.66, 0.52, 0.9],
    [0.44, 0.48, 0.42, 0.78],  [0.95, 0.35, 0.34, 0.66],
  ];
  for (let i = 0; i < bodyProfile.length; i++) {
    const [zPos, sx, sy, sz] = bodyProfile[i];
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 9), i < 2 ? bodyMat : bellyMat);
    seg.scale.set(sx, sy, sz);
    seg.position.set(Math.sin(i * 0.72) * 0.08, 0.03 + Math.cos(i * 0.6) * 0.05, zPos);
    group.add(seg);
  }

  const chest = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), bodyMat);
  chest.scale.set(1.16, 0.82, 0.98);
  chest.position.set(0, 0.16, -1.55);
  group.add(chest);
  const waist = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), bellyMat);
  waist.scale.set(0.78, 0.64, 1.25);
  waist.position.set(0, -0.05, 0.75);
  group.add(waist);

  // Scale ridge
  const ridgeCount = model.ridgeCount;
  const ridgeStep = Math.min(0.43, 5.2 / ridgeCount);
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(0.11 + Math.max(0, 5 - Math.abs(i - 4)) * 0.018, 0.44, 5), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, 0.88 - Math.max(0, i - 5) * 0.03, -2.55 + i * ridgeStep);
    group.add(ridge);
  }
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.48 - i * 0.045, 5), scalesMat);
      fin.position.set(sx * (0.42 - i * 0.03), 0.34 - i * 0.035, -1.55 + i * 0.44);
      fin.rotation.z = sx * -1.05;
      fin.rotation.x = -0.35;
      group.add(fin);
    }
  }

  // Dorsal sail fin
  if (model.dorsal) {
    for (let i = 0; i < 5; i++) {
      const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
      const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, 4), scalesMat);
      df.rotation.x = -Math.PI / 2;
      df.position.set(0, 1.02 + h / 2, -1.6 + i * 0.8);
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
      spine.position.set((i % 2 === 0 ? 0.1 : -0.1), 0.96 + h / 2, -0.8 + i * 0.55);
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
    for (const xo of [-0.28, 0.28]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 3.8), seamMat);
      seam.position.set(xo, 0.62, -0.85);
      group.add(seam);
    }
    const chestSeam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.032, 0.032), seamMat);
    chestSeam.position.set(0, 0.62, -1.55);
    group.add(chestSeam);
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
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.76, 14, 12), bodyMat);
  skull.scale.set(1.32, 0.84, 0.95);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.55, 8), bodyMat);
  snout.rotation.x = -Math.PI / 2;
  snout.scale.set(0.86, 1, 1.18);
  snout.position.set(0, -0.08, -1.08);
  head.add(skull, snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.62), bellyMat);
  jaw.position.set(0, -0.34, -0.74);
  head.add(jaw);

  // Nostrils
  for (const s of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), hornMat);
    nostril.position.set(0.14 * s, -0.1, -1.3);
    head.add(nostril);
  }

  // Whiskers (Jade/Pearl — flowing facial tendrils)
  if (model.whiskers) {
    for (const [sx, angle] of [[-0.18, 0.3], [0.18, -0.3], [-0.1, 0.52], [0.1, -0.52]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.005, 0.8, 4), scalesMat);
      w.rotation.set(Math.PI / 2 + 0.08, 0, angle);
      w.position.set(sx, -0.13, -1.22);
      head.add(w);
    }
  }

  // Ear tendrils (Obsidian/Toothless — wide frilled ear-flaps)
  if (model.earTendrils) {
    const tendrilMat = new THREE.MeshStandardMaterial({
      color: def.body, emissive: def.eye, emissiveIntensity: 0.4,
      roughness: 0.55, side: THREE.DoubleSide,
    });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const h = 0.42 - i * 0.08;
        const t = new THREE.Mesh(new THREE.ConeGeometry(0.065, h, 4), tendrilMat);
        t.position.set(0.62 * s, 0.28 + i * 0.12, 0.38 + i * 0.18);
        t.rotation.x = 0.4 + i * 0.12;
        t.rotation.z = s * (0.9 + i * 0.15);
        head.add(t);
      }
    }
  }

  // Horns
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, model.hornLen, 6), hornMat);
    horn.position.set(0.42 * s, 0.54, 0.28);
    horn.rotation.x = 0.65;
    horn.rotation.z = s * -0.2;
    head.add(horn);
    if (model.hornPairs > 1) {
      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.11, model.hornLen * 0.62, 6), hornMat);
      horn2.position.set(0.26 * s, 0.5, 0.55);
      horn2.rotation.x = 0.95;
      horn2.rotation.z = s * -0.34;
      head.add(horn2);
    }
    const cheekFin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.72, 5), scalesMat);
    cheekFin.position.set(0.58 * s, 0.02, -0.12);
    cheekFin.rotation.z = s * -1.2;
    cheekFin.rotation.x = 0.25;
    head.add(cheekFin);
  }

  // Tusks (Solar/Bahamut — small tusk protrusions from jaw)
  if (model.tusks) {
    for (const s of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.48, 5), hornMat);
      tusk.position.set(0.3 * s, -0.28, -0.86);
      tusk.rotation.x = -0.45;
      tusk.rotation.z = s * 0.2;
      head.add(tusk);
    }
  }

  // Brow ridges
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 5), scalesMat);
    brow.position.set(0.28 * s, 0.44, -0.1);
    brow.rotation.x = 0.9;
    head.add(brow);
  }

  // Crest spines
  const crestCount = model.crest || 0;
  for (let i = 0; i < crestCount; i++) {
    const h = 0.42 + i * 0.1;
    const crestSpine = new THREE.Mesh(new THREE.ConeGeometry(0.08 - i * 0.01, h, 5), scalesMat);
    crestSpine.position.set(0, 0.88 + h / 2, 0.38 - i * 0.22);
    crestSpine.rotation.x = 0.28 + i * 0.08;
    head.add(crestSpine);
  }

  // Halo (Pearl/Seraph — luminous ring above head)
  if (model.halo) {
    const haloMat = new THREE.MeshStandardMaterial({
      color: def.eye, emissive: def.eye, emissiveIntensity: 2.4,
      roughness: 0.2, metalness: 0.5, transparent: true, opacity: 0.9,
    });
    const haloGeo = new THREE.TorusGeometry(0.52, 0.04, 8, 24);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 1.32, 0);
    haloMesh.rotation.x = 0.18;
    head.add(haloMesh);
  }

  // Eyes (per-dragon color, apex palette override applied via ascendedDef)
  const eyeR = 0.09 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 6), eyeMat);
    eye.position.set(0.3 * s, 0.22, -0.42);
    head.add(eye);
  }

  const neckSegs = model.neckSegments;
  head.position.set(0, 0.5 + (neckSegs - 4) * 0.09, -3.08 - (neckSegs - 4) * 0.34);
  group.add(head);

  // Neck
  for (let i = 0; i < neckSegs; i++) {
    const neck = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.52 - i * 0.05, 0.22), 9, 7), bodyMat);
    neck.scale.set(0.82, 0.62, 1.35);
    neck.position.set(Math.sin(i * 0.8) * 0.1, 0.28 + i * 0.09, -1.95 - i * 0.36);
    group.add(neck);
  }

  // Tail
  const tailSegs = [];
  let radius = 0.58;
  let zTail = 2.4;
  for (let i = 0; i < model.tailSegments; i++) {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.2, 7), bodyMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, 0, zTail);
    group.add(seg);
    tailSegs.push(seg);
    zTail += 0.9;
    radius = Math.max(radius * 0.78, 0.05);
  }

  // Mace tail tip (Solar/Ember apex — spiky club end)
  if (model.maceTail) {
    const maceMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.wingEmissive, emissiveIntensity: 0.6,
      roughness: 0.2, metalness: 0.55,
    });
    const mace = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 7), maceMat);
    mace.position.set(0, 0, zTail);
    group.add(mace);
    tailSegs.push(mace);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 4), maceMat);
      spike.position.set(Math.cos(a) * 0.24 + 0, Math.sin(a) * 0.24, zTail);
      spike.rotation.z = Math.sin(a) * Math.PI / 2;
      spike.rotation.x = Math.cos(a) * Math.PI / 2;
      group.add(spike);
    }
    zTail += 0.3;
  } else if (model.tailTip === 'fan') {
    for (let i = 0; i < 3; i++) {
      const angle = (i - 1) * 0.48;
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.74, 5), scalesMat);
      fin.rotation.set(Math.PI / 2, 0, angle);
      fin.position.set(Math.sin(angle) * 0.14, Math.cos(angle) * 0.14, zTail);
      group.add(fin);
      tailSegs.push(fin);
    }
  } else {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 5), scalesMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0, zTail);
    group.add(tip);
    tailSegs.push(tip);
  }

  // Wings — primary pair
  const ws = model.wingScale;
  const wingBuilder = model.wingShape === 'feather' ? buildFeatherWingShape : buildWingShape;
  const wingGeo = new THREE.ShapeGeometry(wingBuilder());
  wingGeo.rotateX(-Math.PI / 2);
  wingGeo.scale(1.34 * ws, 1.28 * ws, 1);
  applyWingGradient(wingGeo, def, 0, 0.78);
  const tipGeoR = new THREE.ShapeGeometry(wingBuilder());
  const tipGeoL = new THREE.ShapeGeometry(wingBuilder());
  applyWingGradient(tipGeoR, def, 0.72, 1);
  applyWingGradient(tipGeoL, def, 0.72, 1);
  const wingBoneGeo = new THREE.BoxGeometry(3.7 * ws, 0.055, 0.055);

  const wingPivotR = new THREE.Group();
  wingPivotR.position.set(0.55, 0.4, -0.2);
  const wRRoot = new THREE.Mesh(wingGeo, wingMat);
  for (const [bz, rot] of [[-0.12, -0.18], [0.18, 0.02], [0.48, 0.2]]) {
    const bone = new THREE.Mesh(wingBoneGeo, hornMat);
    bone.position.set(2.0 * ws, 0.03, bz); bone.rotation.y = rot;
    wingPivotR.add(bone);
  }
  const wingTipR = new THREE.Group();
  wingTipR.position.set(3.5 * ws, 0, 0);
  const wRTip = new THREE.Mesh(tipGeoR, wingMat);
  wRTip.scale.set(0.42 * ws, 0.42 * ws, 1);
  wingTipR.add(wRTip);
  const tipMarkerR = new THREE.Object3D();
  tipMarkerR.position.set(2.0 * ws, 0, -0.2);
  wingTipR.add(tipMarkerR);
  wingPivotR.add(wRRoot, wingTipR);
  group.add(wingPivotR);

  const wingPivotL = new THREE.Group();
  wingPivotL.position.set(-0.55, 0.4, -0.2);
  const wLRoot = new THREE.Mesh(wingGeo, wingMat);
  wLRoot.scale.x = -1;
  for (const [bz, rot] of [[-0.12, 0.18], [0.18, -0.02], [0.48, -0.2]]) {
    const bone = new THREE.Mesh(wingBoneGeo, hornMat);
    bone.position.set(-2.0 * ws, 0.03, bz); bone.rotation.y = rot;
    wingPivotL.add(bone);
  }
  const wingTipL = new THREE.Group();
  wingTipL.position.set(-3.5 * ws, 0, 0);
  const wLTip = new THREE.Mesh(tipGeoL, wingMat);
  wLTip.scale.set(-0.42 * ws, 0.42 * ws, 1);
  wingTipL.add(wLTip);
  const tipMarkerL = new THREE.Object3D();
  tipMarkerL.position.set(-2.0 * ws, 0, -0.2);
  wingTipL.add(tipMarkerL);
  wingPivotL.add(wLRoot, wingTipL);
  group.add(wingPivotL);

  // Secondary small wing pair (Obsidian T4/Toothless — near tail base)
  let wingPivot2L = null;
  let wingPivot2R = null;
  if (model.secondWingPair) {
    const ws2 = ws * 0.48;
    const miniGeo = new THREE.ShapeGeometry(buildWingShape());
    miniGeo.rotateX(-Math.PI / 2);
    miniGeo.scale(ws2, ws2, 1);
    applyWingGradient(miniGeo, def, 0.3, 0.9);
    const miniMat = wingMat.clone();

    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 0.45, 0.25, 1.2);
      const w = new THREE.Mesh(miniGeo, miniMat);
      w.scale.x = s;
      pivot.add(w);
      group.add(pivot);
      if (s === 1) wingPivot2R = pivot;
      else wingPivot2L = pivot;
    }
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
// Accepts the full result from buildDragonModel so group is captured directly.
export function makePreviewTick(def, result) {
  const { group, parts, auraSprite } = result;
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R } = parts;
  return (t) => {
    group.rotation.y = t * 0.65;
    // Gentle hover bob
    group.position.y = 0.1 + Math.sin(t * 1.4) * 0.06;
    // Wing flap
    const flap = Math.sin(t * 4.2 * (def.model.flapBias || 1)) * 0.5;
    wingPivotR.rotation.z = -(flap - 0.15);
    wingPivotL.rotation.z =   flap - 0.15;
    if (wingPivot2L) wingPivot2L.rotation.z = flap * 0.7;
    if (wingPivot2R) wingPivot2R.rotation.z = -(flap * 0.7);
    // Tail wave
    for (let i = 0; i < tailSegs.length; i++) {
      tailSegs[i].position.x = Math.sin(t * 2.4 - i * 0.6) * 0.07 * (i + 1);
    }
    // Head look-around
    head.rotation.y = Math.sin(t * 0.9) * 0.18;
    // Aura breathe
    if (auraSprite) {
      auraSprite.material.opacity = def.fx.auraIdle > 0
        ? 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12
        : 0;
    }
  };
}
