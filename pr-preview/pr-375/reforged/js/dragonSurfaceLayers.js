import * as THREE from 'three';
import { seg } from './modelDetail.js';

// Declarative dorsal/flank DECORATION layers.
//
// These were nine imperative `if (model.flag) { … }` blocks inlined in
// dragonModel.js (the "Lego residue" of the old god-builder). Each is now a
// registered layer builder, mirroring the part registry (dragonRecipe.js) and
// the shingle run pattern. A creature can declare `parts.surfaceLayers` directly
// (ordered list of { type } specs), OR — for the entire shipped roster — the
// layers are INFERRED from the legacy model.* flags by resolveSurfaceLayers, so
// the output is BYTE-IDENTICAL (same materials, geometry, order, flare tagging).
//
// A builder takes ONE context object and returns { meshes, flareMats }:
//   meshes    — Object3D[] to add to the dragon group
//   flareMats — materials that should join spineMats (rim light + Surge flare;
//               these carry userData.baseEmissive/baseIntensity)
// The context carries the shared materials/anchors the old inline code closed
// over: { def, model, attach, recipe, gi, giM, scalesMat }.

const LAYER_BUILDERS = {};
export function registerSurfaceLayer(name, fn) { LAYER_BUILDERS[name] = fn; }
export function getSurfaceLayer(name) { return LAYER_BUILDERS[name] || null; }
export function hasSurfaceLayer(name) { return !!LAYER_BUILDERS[name]; }
export function listSurfaceLayers() { return Object.keys(LAYER_BUILDERS); }

// Glowing dorsal spine — a row of cones along the keel crest; reads as a bright
// stripe from directly behind. Ramps with the forms (spineGlow 0→1).
registerSurfaceLayer('spineGlowLine', ({ def, model, attach, gi }) => {
  const meshes = [], flareMats = [];
  const g = model.spineGlow;
  const spineCol = def.apexSeam || def.eye;
  const spineMat = new THREE.MeshStandardMaterial({
    color: spineCol, emissive: spineCol,
    emissiveIntensity: (0.7 + g * 2.0) * gi, roughness: 0.3, metalness: 0.3,
  });
  spineMat.userData.baseEmissive = spineCol;
  spineMat.userData.baseIntensity = (0.7 + g * 2.0) * gi;
  flareMats.push(spineMat);
  const segN = 11;
  for (let i = 0; i < segN; i++) {
    const t = i / (segN - 1);
    const z = -1.7 + t * 3.4;                 // shoulders → tail root
    const top = attach.keelTopAt(z);          // crest of the keel (incl. torso y)
    const h = 0.16 + g * 0.22;
    const node = new THREE.Mesh(new THREE.ConeGeometry(0.04 + g * 0.045, h, seg(4)), spineMat);
    node.rotation.x = -Math.PI / 2;
    node.position.set(0, top + h / 2 - 0.04, z);
    meshes.push(node);
  }
  return { meshes, flareMats };
});

// SCUTE SEAM (Azure apex) — ONE continuous flat-faceted ridge of opaque-emissive ice
// riding the keel crest from the shoulder yoke to the tail root: the "spine of light"
// that owns the dead-centre of the rear-chase frame. Replaces the 11-cone spineGlowLine
// (which read as a sub-8px near-white "vertebrae zipper"). A raised triangular rail whose
// two TOP facets face the behind-and-above cam (§2 cant). Emissive is a HIGHER-SAT cyan so
// it blooms back UP to ice on screen instead of washing to white (§3b sat≥0.75 / near-white budget).
registerSurfaceLayer('scuteSeam', ({ def, model, attach, gi }) => {
  const meshes = [], flareMats = [];
  const g = model.spineGlow ?? 0.2;
  // DEEP diffuse + a VIVID saturated emissive so the lit line reads as CONFIDENT CYAN dead-astern
  // (a light diffuse washed the seam to pale specular at sat~0.25; the low-R saturated emissive blooms
  // cyan, never white, under ACES+UnrealBloom — fixes the near-white/washout the checkpoint gate flagged).
  const seamEmis = def.seamEmissive ?? 0x1ea6e8;   // R30 — stays blue-cyan even bloomed
  const mat = new THREE.MeshStandardMaterial({
    color: def.seamDiffuse ?? 0x0b3550, emissive: seamEmis,
    emissiveIntensity: (1.7 + g * 1.1) * gi, roughness: 0.3, metalness: 0.15, flatShading: true,
  });
  mat.userData.baseEmissive = seamEmis;
  mat.userData.baseIntensity = (1.7 + g * 1.1) * gi;
  flareMats.push(mat);
  const z0 = -1.8, z1 = 1.6, N = 16, w = 0.06, h = 0.14;
  const verts = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const z = z0 + t * (z1 - z0);
    const top = attach.keelTopAt(z);
    const fadeIn = Math.sin(Math.min(1, t * 4) * Math.PI / 2);   // fade in at the FRONT only
    const rearBias = 0.7 + 0.5 * t;                              // TALLER toward the rear (nearest the chase cam)
    const ww = w * (0.5 + 0.5 * fadeIn), hh = h * fadeIn * rearBias;
    verts.push(-ww, top, z, 0, top + hh, z, ww, top, z);    // baseL · apex · baseR
  }
  for (let i = 0; i < N; i++) {
    const a = i * 3, b = (i + 1) * 3;
    idx.push(a, a + 1, b + 1, a, b + 1, b);                  // left top facet
    idx.push(a + 1, a + 2, b + 2, a + 1, b + 2, b + 1);      // right top facet
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  meshes.push(new THREE.Mesh(geo, mat));
  return { meshes, flareMats };
});

// Dorsal ENERGY LINE — a row of cyan chevrons marching head→tail along the keel
// crest (the Night-drake signature). Reads as a bright "<<<" stripe.
registerSurfaceLayer('dorsalChevrons', ({ def, model, attach, giM }) => {
  const meshes = [], flareMats = [];
  const n = model.dorsalGlowCount;
  const chevCol = def.dorsalHi ?? def.apexSeam ?? def.eye;
  const chevInt = (0.6 + (model.spineGlow || 0) * 0.6) * giM;
  const chevMat = new THREE.MeshStandardMaterial({
    color: chevCol, emissive: chevCol, emissiveIntensity: chevInt,
    roughness: 0.3, metalness: 0.35,
  });
  chevMat.userData.baseEmissive = chevCol;
  chevMat.userData.baseIntensity = chevInt;
  flareMats.push(chevMat);
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
    meshes.push(chev);
  }
  return { meshes, flareMats };
});

// Heroic back-crest — a crown of swept, raked-back blades rising off the
// shoulders. The apex's "crown-like, rear-visible" silhouette.
registerSurfaceLayer('backCrest', ({ def }) => {
  const meshes = [], flareMats = [];
  const crestMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: def.apexSeam || def.wingEmissive,
    emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.5,
    side: THREE.DoubleSide,
  });
  crestMat.userData.baseEmissive = def.apexSeam || def.wingEmissive;
  crestMat.userData.baseIntensity = 0.85;
  flareMats.push(crestMat);
  for (let i = 0; i < 5; i++) {
    const t = (i - 2) / 2;
    const h = 0.95 - Math.abs(t) * 0.32;
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, seg(4)), crestMat);
    blade.scale.set(1, 1, 0.38);
    blade.position.set(t * 0.5, 1.0 + h / 2 - Math.abs(t) * 0.14, -0.5);
    blade.rotation.x = -0.62;
    blade.rotation.z = -t * 0.55;
    meshes.push(blade);
  }
  return { meshes, flareMats };
});

// Scale ridge (legacy back detailing kept for the rest of the roster).
registerSurfaceLayer('scaleRidge', ({ model, attach, scalesMat }) => {
  const meshes = [];
  const ridgeCount = model.ridgeCount;
  const ridgeStep = Math.min(0.43, 5.2 / ridgeCount);
  // ridgeStyle (additive, default 'cone' = byte-identical roster): 'scute' swaps the pointed
  // back-raked cone — which reads as a DEBUG ARROW marching up the planform (gate r7 dir 11) —
  // for a low rounded leaf-scute that tapers ×0.8 toward the tail and hugs the dorsal line.
  const scute = model.ridgeStyle === 'scute';
  // ridgeColor (additive): tint the scutes to the dorsal value so they read as one sleek back
  // mass, not bright pale beads on a dark body (gate r8 dir 9 — keep within 1.15× of the body).
  const scuteMat = model.ridgeColor != null
    ? new THREE.MeshStandardMaterial({ color: model.ridgeColor, roughness: 0.62, metalness: 0.05 })
    : scalesMat;
  for (let i = 0; i < ridgeCount; i++) {
    const baseR = 0.09 + Math.max(0, 5 - Math.abs(i - 4)) * 0.016;
    let ridge;
    if (scute) {
      const r = baseR * Math.pow(0.8, i * 4 / Math.max(1, ridgeCount));   // size falloff toward the tail
      ridge = new THREE.Mesh(new THREE.SphereGeometry(r, seg(6), seg(4)), scuteMat);
      ridge.scale.set(0.7, 0.5, 1.4);      // low + short + a touch elongated along the spine → a leaf scute, not an arrow
    } else {
      ridge = new THREE.Mesh(new THREE.ConeGeometry(baseR, 0.34, seg(5)), scalesMat);
      ridge.rotation.x = -Math.PI / 2;
    }
    // ridgeSeat (additive, default 0.06 = byte-identical roster): a lower/negative seat
    // EMBEDS the ridge base into the back so it reads as a fused low ridge, not a detached
    // quad floating above the dorsal line (gate r5 dir 2b — the "debris at the wing root").
    ridge.position.set(0, attach.keelTopAt(-2.55 + i * ridgeStep) + (model.ridgeSeat ?? 0.06), -2.55 + i * ridgeStep);
    meshes.push(ridge);
  }
  return { meshes, flareMats: [] };
});

// Dorsal sail fin.
registerSurfaceLayer('dorsalSail', ({ attach, scalesMat }) => {
  const meshes = [];
  for (let i = 0; i < 5; i++) {
    const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
    const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, seg(4)), scalesMat);
    df.rotation.x = -Math.PI / 2;
    const z = -1.6 + i * 0.8;
    df.position.set(0, attach.keelTopAt(z) + h / 2, z);
    meshes.push(df);
  }
  return { meshes, flareMats: [] };
});

// Back spines (Toothless/Charizard — hidden rows that deploy).
registerSurfaceLayer('backSpines', ({ def, attach }) => {
  const meshes = [];
  const spineMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: def.scales, emissiveIntensity: 0.35,
    roughness: 0.2, metalness: 0.3,
  });
  for (let i = 0; i < 7; i++) {
    const h = 0.22 + Math.sin((i / 6) * Math.PI) * 0.32;
    const spine = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, seg(4)), spineMat);
    spine.rotation.x = -Math.PI / 2;
    spine.rotation.z = (i % 2 === 0 ? 0.12 : -0.12);
    const z = -0.8 + i * 0.55;
    spine.position.set((i % 2 === 0 ? 0.08 : -0.08), attach.keelTopAt(z) + h / 2, z);
    meshes.push(spine);
  }
  return { meshes, flareMats: [] };
});

// Armor plates (Bahamut/Charizard — angular shoulder/flank overlays).
registerSurfaceLayer('armorPlates', ({ def }) => {
  const meshes = [];
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
    meshes.push(plate);
  }
  return { meshes, flareMats: [] };
});

// Glow seams (under-scale emissive veins — Bahamut/Toothless at apex).
registerSurfaceLayer('glowSeams', ({ def, giM }) => {
  const meshes = [], flareMats = [];
  const seamColor = def.apexSeam || def.eye;
  const seamMat = new THREE.MeshStandardMaterial({
    color: seamColor, emissive: seamColor, emissiveIntensity: 1.8 * giM, roughness: 0.3,
  });
  seamMat.userData.baseEmissive = seamColor;
  seamMat.userData.baseIntensity = 1.8 * giM;
  flareMats.push(seamMat);
  for (const xo of [-0.26, 0.26]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 3.4), seamMat);
    seam.position.set(xo, 0.5, -0.7);
    meshes.push(seam);
  }
  return { meshes, flareMats };
});

// Blade fins (Pearl — sharp blade-like lateral fins).
registerSurfaceLayer('bladeFins', ({ def }) => {
  const meshes = [];
  const bladeMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: def.eye, emissiveIntensity: 0.5,
    roughness: 0.15, metalness: 0.6, side: THREE.DoubleSide,
  });
  for (const [sx, zp, ang] of [
    [0.62, -1.0, -0.55], [-0.62, -1.0, 0.55],
    [0.5, -0.2, -0.65], [-0.5, -0.2, 0.65],
  ]) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.9, seg(4)), bladeMat);
    blade.position.set(sx, 0.35, zp);
    blade.rotation.z = ang;
    blade.rotation.x = -0.15;
    meshes.push(blade);
  }
  return { meshes, flareMats: [] };
});

// Resolve the ORDERED decoration layer list for a creature. An explicit
// `def.parts.surfaceLayers` wins (a string or { type, … } spec, or an array of
// them); otherwise the layers are inferred from the legacy model.* flags in the
// EXACT order + conditions the old inline blocks used, so the roster is
// byte-identical. (The shingle runs are a sibling declarative system handled in
// dragonModel.js via def.parts.shingle.)
export function resolveSurfaceLayers(def, recipe, attach) {
  if (def.parts && def.parts.surfaceLayers) {
    return [].concat(def.parts.surfaceLayers)
      .map((s) => (typeof s === 'string' ? { type: s } : s));
  }
  const model = def.model || {};
  const list = [];
  if (model.scuteSeam) list.push({ type: 'scuteSeam' });   // the continuous seam REPLACES the cone zipper
  if (recipe.torso !== 'avian' && !attach.segmentAnchors && model.spineGlow > 0 && !model.dorsalGlowCount && !model.scuteSeam) list.push({ type: 'spineGlowLine' });
  if (model.dorsalGlowCount > 0) list.push({ type: 'dorsalChevrons' });
  if (model.backCrest) list.push({ type: 'backCrest' });
  if (model.ridgeCount > 0) list.push({ type: 'scaleRidge' });
  if (model.dorsal) list.push({ type: 'dorsalSail' });
  if (model.backSpines) list.push({ type: 'backSpines' });
  if (model.armorPlates) list.push({ type: 'armorPlates' });
  if (model.glowSeams) list.push({ type: 'glowSeams' });
  if (model.bladeFins) list.push({ type: 'bladeFins' });
  return list;
}
