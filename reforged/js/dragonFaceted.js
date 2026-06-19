import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { registerSurfaceLayer } from './dragonSurfaceLayers.js';
import { buildTorso, ARROW_PROFILE } from './dragonTorso.js';
import { seg } from './modelDetail.js';

// FACETED — a hard-edged, low-poly "automotive" part family. The angular
// counterpart to the smooth-organic hull catalog (unifiedHull / organism /
// nightFury), which exist to MELT parts into one seamless skin. This family does
// the opposite: it keeps each part a discrete, flat-shaded, chiseled solid so the
// silhouette reads as origami creases and panel facets — the language of a
// supercar, not a dolphin. Built first for the hero "Aurum Toro" (a Lamborghini-
// Aventador-as-dragon), but every builder/layer here is registered + generic, so
// any future "vehicular / mechanical / insectoid" creature can compose from it.
//
// Faceting technique (LEAPFROG: hard edges = geometry, not a shader): low segment
// counts + FLAT shading. The torso loft is rebuilt NON-INDEXED so every triangle
// owns its 3 vertices → computeVertexNormals() yields per-FACE normals → crisp
// panels. The head/tail/layers use flat-shaded primitives. Every segment count is
// wrapped in seg() so the LOD tier still scales it.
//
// All four builders honor the same contracts the smooth parts do (the torso ATTACH
// contract; the FROZEN wing rig handles { wingPivotL/R, wingTipL/R, tipMarkerL/R };
// the tail { group, segs }), so they compose with the existing parts and the rig
// drives them with zero changes.

// ── TORSO: 'faceted' ─────────────────────────────────────────────────────────
// The shipped arrow body plan, but lofted through a CHISELED cross-section and
// emitted as flat-shaded facets. We reuse buildTorso (so the full attach contract,
// neck chain and wing fairings come for free) and only swap the geometry function.

// A hard, angular cross-section: a flat top deck, sharp upper chines, a wide
// mid-line and a beveled belly — the wedge of a low supercar. CCW toward -z so
// face winding points outward (matches dragonTorso's bladeRing convention).
function wedgeRing(w, top, bot) {
  return [
    [0, top], [-w * 0.58, top * 0.5], [-w, top * 0.04], [-w * 0.74, -bot * 0.55],
    [0, -bot], [w * 0.74, -bot * 0.55], [w, top * 0.04], [w * 0.58, top * 0.5],
  ];
}

// Loft the profile stations with the wedge ring, then toNonIndexed() so each face
// shades flat (the panel-crease read). Mirrors dragonTorso.buildTorsoGeometry's
// index weave (M=8 ring, quad per station gap) exactly — just sharper + faceted.
function buildFacetedTorsoGeometry(profile, stretch = 1) {
  const { stations, zHold } = profile;
  const M = 8;
  const zAt = (z) => (z > zHold ? zHold + (z - zHold) * stretch : z);
  const verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of wedgeRing(w, top, bot)) verts.push(x, y, zAt(z));
  const idx = [];
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  const flat = g.toNonIndexed();   // unique verts per face → per-face (flat) normals
  flat.computeVertexNormals();
  return flat;
}

registerTorso('faceted', (def, model, bodyMat) =>
  buildTorso(ARROW_PROFILE, def, model, bodyMat, buildFacetedTorsoGeometry));

// ── WINGS: 'hexMembrane' ───────────────────────────────────────────────────────
// Sharp, swept, flat-shaded wings that hinge UP from the shoulder like scissor
// doors (the dihedral is baked into the geometry so it survives the rig's flap
// writes). An inner panel (root→wrist) rides the pivot; a pointed, chevron-notched
// outer panel rides the wingTip so the rig's wrist-fold articulates it. A carbon
// leading-edge spar + amber light-seam strips read as the car's body line + tail-
// lights. Honors the frozen rig contract verbatim.
function flatTriMesh(triList, mat) {
  const verts = [];
  for (const [a, b, c] of triList) verts.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function buildHexMembraneWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);

  // The membrane the rig animates (emissive / opacity). Glossy giallo clearcoat.
  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? def.body, flatShading: true, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.94,
    roughness: def.bodyRoughness ?? 0.3, metalness: def.bodyMetalness ?? 0.5,
    emissive: def.wingEmissive ?? def.apexSeam ?? 0x000000,
    emissiveIntensity: model.wingPanelGlow ?? 0.26,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.6,
  });
  const seamCol = def.apexSeam ?? def.wingEmissive ?? 0xff6a1f;
  const seamMat = new THREE.MeshStandardMaterial({
    color: seamCol, emissive: seamCol, emissiveIntensity: 1.6 * gi, roughness: 0.3,
  });
  seamMat.userData.baseEmissive = seamCol;
  seamMat.userData.baseIntensity = 1.6 * gi;
  spineMats.push(seamMat);

  const WX = 2.7 * ws, WY = 0.62 * ws;       // wrist offset: out + UP = scissor dihedral
  const TX = 2.0 * ws, TZ = 0.1;             // sharp tip (beyond the wrist)
  const NX = 0.95 * ws, NZ = 1.25;           // trailing chevron notch

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // Inner panel: root → wrist, rising to the dihedral (side baked into x).
    const A = [side * 0.12, 0, -0.40], B = [side * WX, WY, -0.18];
    const C = [side * (WX - 0.45), WY, 0.95], D = [side * 0.12, 0, 0.72];
    pivot.add(flatTriMesh([[A, B, C], [A, C, D]], wingMat));

    // Carbon leading-edge spar along A→B (the body line).
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2];
    const len = Math.hypot(dx, dy, dz);
    const spar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.1), boneMat);
    spar.position.set((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2);
    spar.rotation.z = Math.atan2(dy, dx);
    spar.rotation.y = -Math.atan2(dz, Math.hypot(dx, dy));
    pivot.add(spar);

    // Amber light-seam strips on the inner panel (the tail-light read).
    for (const t of [0.34, 0.62]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.0), seamMat);
      seam.position.set(A[0] + dx * t, A[1] + dy * t + 0.03, 0.2);
      seam.rotation.y = side * 0.18;
      pivot.add(seam);
    }

    // wingTip (wrist) — the rig folds this; the outer panel rides it.
    const wingTip = new THREE.Group();
    wingTip.position.set(side * WX, WY, 0);
    const Bp = [0, 0, -0.18], T = [side * TX, 0.16, TZ];
    const N = [side * NX, 0.05, NZ], Cp = [side * -0.45, 0, 0.95];
    wingTip.add(flatTriMesh([[Bp, T, N], [Bp, N, Cp]], wingMat));
    const marker = new THREE.Object3D();
    marker.position.set(side * TX, 0.16, TZ);
    wingTip.add(marker);
    pivot.add(wingTip);

    group.add(pivot);
    return { pivot, wingTip, marker };
  }

  const R = buildSide(1), L = buildSide(-1);
  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
    },
    wingMat, spineMats,
  };
}

registerWings('hexMembrane', buildHexMembraneWings);

// ── HEAD: 'bullCrown' ──────────────────────────────────────────────────────────
// A chiseled wedge skull with FORWARD-swept bull horns (the raging-bull emblem)
// and xenon-blue faceted eyes. Uses the shared materials (cloned flat-shaded so the
// gold reads as panels); the carbon jaw uses the belly material.
function buildBullCrownHead(def, model, mats) {
  const { bodyMat, hornMat, bellyMat, eyeMat } = mats;
  const head = new THREE.Group();
  const facetBody = bodyMat.clone(); facetBody.flatShading = true;
  const facetHorn = hornMat.clone();
  facetHorn.flatShading = true; facetHorn.color = new THREE.Color(def.horn ?? 0x0e0e12);
  facetHorn.metalness = 0.6; facetHorn.roughness = 0.35;

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 1.05), facetBody);
  skull.rotation.x = 0.05;
  head.add(skull);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.3, seg(4)), facetBody);
  snout.rotation.x = -Math.PI / 2; snout.rotation.z = Math.PI / 4;
  snout.scale.set(0.9, 1, 1.15);
  snout.position.set(0, -0.08, -0.98);
  head.add(snout);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.66), bellyMat);
  jaw.position.set(0, -0.34, -0.7);
  head.add(jaw);

  const hl = Math.max(0.25, (model.hornLen ?? 1));
  for (const s of [-1, 1]) {
    // Primary bull horn — long, swept FORWARD and splayed out.
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, hl, seg(4)), facetHorn);
    horn.position.set(0.42 * s, 0.46, 0.18);
    horn.rotation.x = -0.95;          // forward sweep
    horn.rotation.z = s * -0.55;      // outward splay
    head.add(horn);
    if ((model.hornPairs ?? 1) > 1) {
      const h2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, hl * 0.5, seg(4)), facetHorn);
      h2.position.set(0.24 * s, 0.5, -0.06);
      h2.rotation.x = -0.4; h2.rotation.z = s * -0.3;
      head.add(h2);
    }
  }

  // Xenon-blue eyes (angular octahedra).
  const eyeR = 0.1 * (model.eyeScale || 1);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(eyeR), eyeMat);
    eye.scale.set(1.5, 0.8, 1);
    eye.position.set(0.3 * s, 0.12, -0.44);
    head.add(eye);
  }

  return { group: head, spineMats: [] };
}

registerHead('bullCrown', buildBullCrownHead);

// ── TAIL: 'bladeJet' ───────────────────────────────────────────────────────────
// A faceted tapering blade tail ending in a QUAD-EXHAUST nozzle cluster whose cores
// glow (amber/red, flaring on Surge). The chain segments + the jet cluster are all
// returned as `segs` so the rig coils them as one tail — the exhaust tracks the tip.
function buildBladeJetTail(def, model, mats, anchor) {
  const { bodyMat } = mats;
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const facet = bodyMat.clone(); facet.flatShading = true;
  const segs = [];

  const n = Math.min(model.tailSegments ?? 7, 9);
  let z = 0.2, r = 0.34;
  for (let i = 0; i < n; i++) {
    const segLen = 0.7;
    const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, segLen, seg(4)), facet);
    segMesh.rotation.x = Math.PI / 2;   // long axis along z
    segMesh.rotation.z = Math.PI / 4;   // diamond facet orientation
    segMesh.position.set(0, 0.05, z);
    root.add(segMesh);
    segs.push(segMesh);
    z += segLen * 0.82;
    r = Math.max(r * 0.82, 0.1);
  }

  // Quad-exhaust jet cluster — its own group so it rides the tip of the coil.
  const accentMats = [];
  const exhaustCol = def.boostTrail ?? def.coreGlow ?? def.apexSeam ?? 0xff6a1f;
  const coreMat = new THREE.MeshStandardMaterial({
    color: exhaustCol, emissive: exhaustCol, emissiveIntensity: 1.8, roughness: 0.3,
  });
  coreMat.userData.baseEmissive = exhaustCol;
  coreMat.userData.baseIntensity = 1.8;
  accentMats.push(coreMat);
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.6,
  });

  const jet = new THREE.Group();
  jet.position.set(0, 0.05, z + 0.05);
  for (const [ox, oy] of [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.06], [0.12, -0.06]]) {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, seg(6)), nozzleMat);
    noz.rotation.x = Math.PI / 2;
    noz.position.set(ox, oy, 0);
    jet.add(noz);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, seg(6)), coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(ox, oy, 0.12);
    jet.add(core);
  }
  root.add(jet);
  segs.push(jet);

  return { group: root, segs, accentMats };
}

registerTail('bladeJet', buildBladeJetTail);

// ── SURFACE LAYERS — reusable angular "aero" decoration ─────────────────────────
// Declarative layers (ctx → { meshes, flareMats }), reusable by any hard-surface
// creature. Carbon = the dragon's belly/horn colour; amber light seams = apexSeam.

// Scissor-door hinge blocks at the wing roots — the angular shoulder pivots that
// sell the upward wing pose, each with an amber light seam.
registerSurfaceLayer('scissorHinge', ({ def, attach }) => {
  const meshes = [], flareMats = [];
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.6,
  });
  const seamCol = def.apexSeam ?? def.eye ?? 0xff6a1f;
  const seamMat = new THREE.MeshStandardMaterial({
    color: seamCol, emissive: seamCol, emissiveIntensity: 1.4, roughness: 0.3,
  });
  seamMat.userData.baseEmissive = seamCol;
  seamMat.userData.baseIntensity = 1.4;
  flareMats.push(seamMat);
  for (const s of [-1, 1]) {
    const wr = attach.wingRoot ? attach.wingRoot(s) : { x: 0.5 * s, y: 0.55, z: -0.25 };
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.52), carbon);
    block.position.set(wr.x, wr.y, wr.z);
    block.rotation.z = s * 0.4;
    meshes.push(block);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.42), seamMat);
    seam.position.set(wr.x + s * 0.16, wr.y + 0.07, wr.z);
    seam.rotation.z = s * 0.4;
    meshes.push(seam);
  }
  return { meshes, flareMats };
});

// Splitter jaw — a wide thin carbon under-chin spoiler + canard end-plates (the
// front splitter). Positioned under the neck/front of the body.
registerSurfaceLayer('splitterJaw', ({ def }) => {
  const meshes = [];
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.55,
    side: THREE.DoubleSide,
  });
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.5), carbon);
  splitter.position.set(0, -0.04, -2.65);
  splitter.rotation.x = -0.12;
  meshes.push(splitter);
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.5), carbon);
    plate.position.set(s * 0.72, 0.05, -2.65);
    meshes.push(plate);
  }
  return { meshes, flareMats: [] };
});

// Aero vents — angular flank louvers riding the body's half-width (the side-intake
// read). A faint amber glow ties them to the tail-light palette.
registerSurfaceLayer('aeroVents', ({ def, attach }) => {
  const meshes = [];
  const seamCol = def.apexSeam ?? def.eye ?? 0xff6a1f;
  const ventMat = new THREE.MeshStandardMaterial({
    color: def.scales ?? def.horn ?? 0x0e0e12, emissive: seamCol, emissiveIntensity: 0.5,
    flatShading: true, roughness: 0.4, metalness: 0.5,
  });
  for (const s of [-1, 1]) {
    for (const z of [-0.5, 0.1, 0.7]) {
      const hw = attach.halfWidthAt ? attach.halfWidthAt(z) : 0.5;
      const my = attach.bodyMidY ?? 0.2;
      const louver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), ventMat);
      louver.position.set(s * hw * 1.02, my + 0.1, z);
      louver.rotation.y = s * 0.5;
      louver.rotation.x = 0.3;
      meshes.push(louver);
    }
  }
  return { meshes, flareMats: [] };
});
