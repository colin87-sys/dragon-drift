import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { registerSurfaceLayer } from './dragonSurfaceLayers.js';
import { buildTorso } from './dragonTorso.js';
import { seg } from './modelDetail.js';
import {
  wedgePanel, hexPrism, spineSegment, ventPlateRow, hexGrille,
  chevronLight, diffuserArray, thrusterPod, mechaLeg, socket,
} from './mechaKit.js';
import { shingle } from './dragonShingle.js';

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

// A BOXY, mecha cross-section: a flat top DECK, near-vertical chamfered sides and
// a flat wide BOTTOM (the diffuser face) — a Lamborghini rear trapezoid, not a
// pointed diamond. CCW around the perimeter; the torso material is DoubleSide so
// winding is robust. This single ring change is what makes the rear read boxy.
function wedgeRing(w, top, bot) {
  return [
    [-w * 0.5, top], [-w, top * 0.45], [-w, -bot * 0.5], [-w * 0.55, -bot],
    [w * 0.55, -bot], [w, -bot * 0.5], [w, top * 0.45], [w * 0.5, top],
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

// BULL_PROFILE — a COMPACT, thick, muscular body plan (the opposite of ARROW's
// long slim courier). Short z-span, deep barrel chest, a tall muscular shoulder
// hump, a pinched waist → haunch bulge (the L55 panther recipe), a short neck and
// a short tail root — a stocky fighter-jet/bull fuselage. Publishes the same
// profile fields buildTorso reads, so the attach contract is unchanged.
const BULL_PROFILE = {
  zHold: -0.3,
  tailShiftRefZ: 1.10,
  tailAnchorY: 0.34,
  tailAnchorZ: 0.80,
  stations: [
    [-2.30, 0.18, 0.14, 0.16], // short neck cap
    [-1.80, 0.46, 0.34, 0.36], // chest start
    [-1.20, 0.72, 0.56, 0.56], // deep chest
    [-0.60, 0.86, 0.66, 0.62], // shoulder/chest peak — broadest, muscular hump
    [-0.05, 0.76, 0.54, 0.58], // barrel thorax
    [ 0.42, 0.54, 0.42, 0.44], // waist pinch (still thick)
    [ 0.80, 0.62, 0.44, 0.48], // HAUNCH bulge (muscle)
    [ 1.10, 0.30, 0.28, 0.22], // short tail root
  ],
  keel: [[-1.80, 0.34], [-0.60, 0.66], [-0.05, 0.54], [0.42, 0.42], [0.80, 0.44], [1.10, 0.28]],
  wingRoot: { x: 0.64, y: 0.62, z: -0.55 }, // high on the back + forward (jet mount)
  fairing: { r: 0.36, scale: [0.92, 0.82, 1.1], pos: [0.52, 0.6, -0.5] },
  neck: {
    rBase: 0.44, rStep: 0.05, rMin: 0.2, scale: [0.84, 0.72, 1.15],
    y0: 0.36, yStep: 0.07, z0: -1.7, zStep: -0.3, wobbleAmp: 0.06, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.52 + (neckSegs - 4) * 0.08, z: -2.5 - (neckSegs - 4) * 0.3 }),
};

registerTorso('faceted', (def, model, bodyMat) =>
  buildTorso(BULL_PROFILE, def, model, bodyMat, buildFacetedTorsoGeometry));

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

// A box strut spanning two 3D points a→b (a wing frame bar). `th` = [width,height]
// of the bar cross-section. Oriented like the legacy spar math.
function frameBar(a, b, th, mat) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(len, th[1], th[0]), mat);
  bar.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  bar.rotation.z = Math.atan2(dy, dx);
  bar.rotation.y = -Math.atan2(dz, Math.hypot(dx, dy));
  return bar;
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

  // SHORT, BROAD, sharp swept DELTA (a jet wing) — span pulled in hard, chord
  // kept full, tip swept back to a hard point, steep baked-in dihedral.
  const WX = 1.5 * ws, WY = 0.72 * ws;       // wrist: close in + high (steep dihedral)
  const TX = 1.0 * ws, TZ = 0.55;            // tip: short reach, swept hard back
  const NX = 0.5 * ws, NZ = 1.35;            // trailing chevron notch

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // Inner panel: root → wrist, rising to the dihedral (side baked into x).
    const A = [side * 0.12, 0, -0.40], B = [side * WX, WY, -0.18];
    const C = [side * (WX - 0.45), WY, 0.95], D = [side * 0.12, 0, 0.72];
    pivot.add(flatTriMesh([[A, B, C], [A, C, D]], wingMat));

    // CARBON FRAME — a thick leading bar A→B (the body line) + a thin trailing rail
    // D→C, so the membrane reads as a framed mecha panel, not a bare sheet.
    pivot.add(frameBar(A, B, [0.11, 0.07], boneMat));   // leading-edge bar (thick)
    pivot.add(frameBar(D, C, [0.05, 0.04], boneMat));   // trailing rail (thin)

    // Amber light-seam strips on the inner panel (the tail-light read).
    const dx = B[0] - A[0], dy = B[1] - A[1];
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
    wingTip.add(frameBar(Bp, T, [0.09, 0.06], boneMat));   // outer leading-edge bar (the sharp tip rail)
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

  // SHORT muscular STUB (not a whip): few short segments, fast taper.
  const n = Math.min(model.tailSegments ?? 4, 6);
  let z = 0.15, r = 0.38;
  for (let i = 0; i < n; i++) {
    const segLen = 0.42;
    const segMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r, segLen, seg(4)), facet);
    segMesh.rotation.x = Math.PI / 2;   // long axis along z
    segMesh.rotation.z = Math.PI / 4;   // diamond facet orientation
    segMesh.position.set(0, 0.05, z);
    root.add(segMesh);
    segs.push(segMesh);
    z += segLen * 0.8;
    r = Math.max(r * 0.7, 0.09);
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

  // Tight, high, CENTRAL quad-exhaust cluster (the SVJ stacked-pipe read) — pulled
  // in close behind the stub and raised so it sits between the rear wing + diffuser.
  const jet = new THREE.Group();
  jet.position.set(0, 0.12, z - 0.02);
  for (const [ox, oy] of [[-0.09, 0.12], [0.09, 0.12], [-0.09, 0.0], [0.09, 0.0]]) {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.24, seg(6)), nozzleMat);
    noz.rotation.x = Math.PI / 2;
    noz.position.set(ox, oy, 0);
    jet.add(noz);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, seg(6)), coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(ox, oy, 0.1);
    jet.add(core);
  }
  root.add(jet);
  segs.push(jet);

  return { group: root, segs, accentMats };
}

registerTail('bladeJet', buildBladeJetTail);

// ── TAIL: 'svjRear' ─────────────────────────────────────────────────────────────
// The Aventador-SVJ rear, as a RIGID structural tail (segs:[] → the rig never
// coils it). A boxy transom panel carries the wraparound tail-light bar + central
// exhausts + a vertical-finned diffuser, and TWO articulating stabilizer flaps ride
// the `tailFins` hook (deploy on boost + deflect into turns + a gated up/down pitch
// flutter — see dragon.js / makePreviewTick) so the spoiler's flaps "support flight"
// like aircraft tail stabilizers.
function buildSvjRearTail(def, model, mats, anchor) {
  const { bodyMat } = mats;
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const accentMats = [];

  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const panelMat = bodyMat.clone(); panelMat.flatShading = true;   // body-gold transom panel
  const lightCol = def.apexSeam ?? 0xff3b2f;                       // tail-light red
  const lightMat = new THREE.MeshStandardMaterial({
    color: lightCol, emissive: lightCol, emissiveIntensity: 1.7, roughness: 0.3,
  });
  lightMat.userData.baseEmissive = lightCol;
  lightMat.userData.baseIntensity = 1.7;
  accentMats.push(lightMat);
  const exhaustCol = def.boostTrail ?? def.coreGlow ?? 0xff8a1f;
  const coreMat = new THREE.MeshStandardMaterial({
    color: exhaustCol, emissive: exhaustCol, emissiveIntensity: 1.8, roughness: 0.3,
  });
  coreMat.userData.baseEmissive = exhaustCol;
  coreMat.userData.baseIntensity = 1.8;
  accentMats.push(coreMat);

  const zBack = 0.25;            // the transom face sits just behind the body tail root
  const HW = 0.5;               // transom half-width
  const topY = 0.28, botY = -0.34;

  // Rear transom — a wide flat boxy back panel (the Lambo rear face).
  const transom = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, topY - botY, 0.14), panelMat);
  transom.position.set(0, (topY + botY) / 2, zBack);
  root.add(transom);

  // SVJ tail-light bar: a straight TOP frame, two Y/chevron light clusters wrapping
  // down each side, and a thin RUNNER across the middle linking them.
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(HW * 1.9, 0.05, 0.06), lightMat);
  topFrame.position.set(0, topY - 0.02, zBack + 0.08);
  root.add(topFrame);
  const runner = new THREE.Mesh(new THREE.BoxGeometry(HW * 1.95, 0.035, 0.05), lightMat);
  runner.position.set(0, (topY + botY) / 2 + 0.02, zBack + 0.08);
  root.add(runner);
  for (const s of [-1, 1]) {
    // a wrapping chevron (the Y-shaped light) per side
    for (const [oy, ang] of [[0.12, 0.5], [-0.02, -0.5]]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.05), lightMat);
      bar.position.set(s * HW * 0.62, topY - 0.16 + oy, zBack + 0.08);
      bar.rotation.z = s * ang;
      root.add(bar);
    }
  }

  // Central exhausts — twin pairs stacked high-center.
  const nozzleMat = carbon;
  for (const [ox, oy] of [[-0.09, -0.04], [0.09, -0.04]]) {
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.22, seg(6)), nozzleMat);
    noz.rotation.x = Math.PI / 2;
    noz.position.set(ox, oy, zBack + 0.1);
    root.add(noz);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.12, seg(6)), coreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(ox, oy, zBack + 0.2);
    root.add(core);
  }

  // Diffuser — vertical carbon fins along the bottom of the transom.
  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.3), carbon);
    fin.position.set(i * 0.14, botY + 0.06, zBack + 0.12);
    fin.rotation.x = 0.22;
    root.add(fin);
  }

  // Two STABILIZER FLAPS on the upper corners — flat angular winglets returned in
  // tailFins. They deploy on boost, deflect into turns (signed bankGain), and pitch
  // up/down via the gated flapFlutter (dragon.js). restRotX = slight up-angle.
  const tailFins = [];
  const flapMat = panelMat;
  for (const s of [-1, 1]) {
    const flap = new THREE.Group();
    flap.position.set(s * (HW - 0.04), topY - 0.04, zBack - 0.02);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.34), flapMat);
    blade.position.set(s * 0.26, 0, 0.02);
    flap.add(blade);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.05), lightMat);
    edge.position.set(s * 0.26, 0.015, 0.18);
    flap.add(edge);
    flap.userData.restRotX = -0.18;          // slight up-angle (elevator)
    flap.userData.restRotY = 0;
    flap.userData.restRotZ = s * 0.16;        // outward droop
    flap.userData.restScale = 1;
    flap.userData.bankGain = s * 0.5;         // deflect INTO the turn (rudder)
    flap.userData.flapFlutter = 0.22;         // gated up/down pitch amplitude
    flap.userData.phase = s * 1.6;            // L/R out of phase → aileron read
    root.add(flap);
    tailFins.push(flap);
  }

  return { group: root, segs: [], tailFins, accentMats };
}

registerTail('svjRear', buildSvjRearTail);

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

// SVJ rear wing — a wide, thin, fixed AEROFOIL blade raised on two uprights high
// over the hips, slightly raked, with carbon end-plates and an amber trailing-edge
// seam (joins flareMats → rim light + Surge flare). The Aventador SVJ rear read.
registerSurfaceLayer('svjWing', ({ def, attach }) => {
  const meshes = [], flareMats = [];
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.6,
    side: THREE.DoubleSide,
  });
  const seamCol = def.apexSeam ?? def.eye ?? 0xff6a1f;
  const seamMat = new THREE.MeshStandardMaterial({
    color: seamCol, emissive: seamCol, emissiveIntensity: 1.4, roughness: 0.3,
  });
  seamMat.userData.baseEmissive = seamCol;
  seamMat.userData.baseIntensity = 1.4;
  flareMats.push(seamMat);

  const zMount = 0.7;                                    // high over the hips/haunch
  const base = attach.keelTopAt ? attach.keelTopAt(zMount) : 0.6;
  const postH = 0.55;
  const deckY = base + postH;
  for (const s of [-1, 1]) {                             // two uprights
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, postH, 0.12), carbon);
    post.position.set(s * 0.42, base + postH / 2, zMount);
    post.rotation.x = 0.12;
    meshes.push(post);
  }
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.42), carbon);
  wing.position.set(0, deckY, zMount + 0.04);
  wing.rotation.x = -0.18;                               // raked, leading edge down
  meshes.push(wing);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.04, 0.05), seamMat);
  seam.position.set(0, deckY - 0.02, zMount + 0.22);
  seam.rotation.x = -0.18;
  meshes.push(seam);
  for (const s of [-1, 1]) {                             // wing end-plates
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.42), carbon);
    ep.position.set(s * 0.84, deckY, zMount + 0.04);
    ep.rotation.x = -0.18;
    meshes.push(ep);
  }
  return { meshes, flareMats };
});

// Diffuser — a row of short vertical carbon fins low at the rear underside (the
// SVJ diffuser), placed off the tail anchor.
registerSurfaceLayer('diffuser', ({ def, attach }) => {
  const meshes = [];
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.45, metalness: 0.5,
  });
  const anchor = attach.tailAnchor ?? { y: 0.3, z: 0.9 };
  const z = anchor.z + 0.12;
  const baseY = (attach.bodyMidY ?? 0.2) - 0.16;         // low, underside rear
  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.34), carbon);
    fin.position.set(i * 0.13, baseY, z);
    fin.rotation.x = 0.25;                               // rake down/back
    meshes.push(fin);
  }
  return { meshes, flareMats: [] };
});

// ═══════════════════════════════════════════════════════════════════════════════
// SVJ MECHA-DRAGON v3 — a CLEAN-ROOM rebuild authored from the render, reusing only
// engine machinery (the registry, the attach-contract SHAPE, the frozen wing rig, the
// tail contract, Surge-flare tagging, seg() LOD, flat shading) + the generic mechaKit
// parts bin. NO bull design data: the torso is NOT BULL_PROFILE/buildTorso, the wings
// are NOT the hexMembrane layout, the tail fins are re-derived — every shape is built
// fresh here. Three dominant chase-cam reads drive it: huge blade WINGS, a bulky
// twin-thruster engine-block TORSO, a long segmented armored TAIL. Built BIG (judge
// the silhouette first; shrink via model.scale later). The v1 faceted bull builders
// above stay registered for one-string rollback.
// ═══════════════════════════════════════════════════════════════════════════════

// ── TORSO: 'svjHull' — clean-room engine-block fuselage (NO bull profile, NO buildTorso)
// A bespoke hard-surface body: a chined, flat-decked armored fuselage that swells at
// the engine bay and tapers to the tail root, with bolt-on dorsal/chest/haunch plates
// and a short armored neck. The attach contract is hand-authored from THIS body's
// measurements (no profile inheritance), so wings/tail/head/layers mount to numbers
// measured off the actual hull.
const SVJ_HULL_Y = 0.2;

// A chined armored cross-section (flat top deck, hard chine shoulders, keeled belly) —
// authored fresh for the mecha read (sharper than the organic wedgeRing).
function svjRing(w, top, bot) {
  return [
    [-w * 0.58, top], [-w, top * 0.72], [-w, -bot * 0.62], [-w * 0.52, -bot],
    [ w * 0.52, -bot], [ w, -bot * 0.62], [ w, top * 0.72], [ w * 0.58, top],
  ];
}
// Fresh stations [z, halfWidth, top, bottom] (engine −z forward). Authored from the
// SIDE reference: a quadruped topline — deep brisket → rising SHOULDER hump → mid
// dip with a TUCKED-UP belly → rising rear HAUNCH → tail root. `top` = dorsal rise,
// `bottom` = ventral depth; the mid `bottom` shrinks (0.30) = the belly tuck.
const SVJ_STATIONS = [
  [-2.30, 0.16, 0.18, 0.12], // collar
  [-1.85, 0.34, 0.36, 0.26], // neck base
  [-1.30, 0.56, 0.52, 0.50], // deep chest / brisket (ventral deep)
  [-0.70, 0.74, 0.64, 0.40], // SHOULDER hump (dorsal high, belly tucking up)
  [-0.10, 0.82, 0.58, 0.30], // mid back — BELLY TUCK (ventral shallow)
  [ 0.45, 0.78, 0.60, 0.38], // rear HAUNCH rise
  [ 0.85, 0.58, 0.46, 0.32], // rear
  [ 1.15, 0.40, 0.34, 0.24], // tail root
];
// Piecewise-linear lookup over a station column (1=halfWidth, 2=top, 3=bottom).
// Takes an explicit stations array so a recipe can drive a re-massed copy.
function svjInterp(s, z, col) {
  if (z <= s[0][0]) return s[0][col];
  if (z >= s[s.length - 1][0]) return s[s.length - 1][col];
  for (let i = 0; i < s.length - 1; i++)
    if (z <= s[i + 1][0]) {
      const t = (z - s[i][0]) / (s[i + 1][0] - s[i][0]);
      return s[i][col] + (s[i + 1][col] - s[i][col]) * t;
    }
  return s[s.length - 1][col];
}
// Loft the stations through a ring → non-indexed flat-shaded hull (panel facets).
function svjLoft(stations, ring) {
  const M = 8, verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of ring(w, top, bot)) verts.push(x, y, z);
  const idx = [];
  for (let st = 0; st < stations.length - 1; st++) {
    const a0 = st * M, b0 = (st + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

function buildSvjHull(def, model, bodyMat) {
  const group = new THREE.Group();
  const gold = bodyMat.clone(); gold.flatShading = true; gold.side = THREE.DoubleSide;
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  // Optional massing knobs (default 1 ⇒ identical hull). A recipe can broaden the
  // torso + bulk the rear engine-bay (rear = z ≥ -0.15), and COMPRESS the central
  // belly vertically (`bellyFlatten` on the mid station) for a wide+low engine-bay
  // read instead of a round/pear oval.
  const txs = model.torsoWidthScale ?? 1, tys = model.torsoHeightScale ?? 1, rbs = model.rearBulkScale ?? 1;
  const bfl = model.bellyFlatten ?? 1;
  const vy = (z) => tys * ((z > -0.45 && z < 0.30) ? bfl : 1);   // squash the central belly only
  const STN = SVJ_STATIONS.map(([z, w, t, b]) => [z, w * txs * (z >= -0.15 ? rbs : 1), t * vy(z), b * vy(z)]);
  const topAt = (z) => SVJ_HULL_Y + svjInterp(STN, z, 2);
  const hwAt = (z) => svjInterp(STN, z, 1);

  // Core fuselage loft.
  const hull = new THREE.Mesh(svjLoft(STN, svjRing), gold);
  hull.position.y = SVJ_HULL_Y;
  group.add(hull);

  // Bolt-on hard-surface plates (the paneled mecha read): a raised dorsal engine
  // cover over the bay, a chest prow, two haunch plates, a belly splitter.
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 1.3), gold);
  cover.position.set(0, topAt(-0.1) + 0.03, -0.1);
  group.add(cover);
  const coverVent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.9), carbon);
  coverVent.position.set(0, topAt(-0.1) + 0.13, -0.1);
  group.add(coverVent);
  const prow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.7), gold);
  prow.position.set(0, SVJ_HULL_Y + 0.08, -1.5); prow.rotation.x = 0.14;
  group.add(prow);
  for (const s of [-1, 1]) {
    const haunch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.72), gold);
    haunch.position.set(s * hwAt(0.6) * 0.82, SVJ_HULL_Y + 0.06, 0.6); haunch.rotation.z = s * 0.2;
    group.add(haunch);
  }
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.5), carbon);
  splitter.position.set(0, SVJ_HULL_Y - svjInterp(STN, -1.0, 3) - 0.02, -1.0); splitter.rotation.x = -0.12;
  group.add(splitter);

  // Short armored neck — 3 beveled blocks bridging the collar to the head.
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const nb = new THREE.Mesh(new THREE.BoxGeometry(0.32 - t * 0.06, 0.3 - t * 0.04, 0.4), gold);
    nb.position.set(0, SVJ_HULL_Y + 0.18 + t * 0.2, -2.3 - t * 0.42); nb.rotation.x = -0.18;
    group.add(nb);
  }

  const attach = {
    wingRoot: (side) => ({ x: 0.72 * txs * side, y: SVJ_HULL_Y + 0.5, z: -0.3 }),
    headBase: { x: 0, y: SVJ_HULL_Y + 0.52, z: -2.95 },
    tailAnchor: { y: SVJ_HULL_Y + 0.12, z: 1.05 },
    keelTopAt: (z) => topAt(z),
    halfWidthAt: (z) => hwAt(z),
    bodyMidY: SVJ_HULL_Y,
    tailShift: 0,
    bodyMatDouble: gold,
  };
  return { group, attach };
}
registerTorso('svjHull', buildSvjHull);

// ── WINGS: 'svjBladeWing' — clean-room blade wings (NO hexMembrane layout) ────────
// Fresh geometry on the frozen rig: a thick armored leading-root section rides the
// pivot (the rig flaps it); a broad swept outer blade + vertical endplate rides the
// wingTip (the rig folds it). Yellow armor = outer silhouette, black vent inside, red
// taillights on the trailing edges. ~10.6u span, broad GLIDE pose (low flapAmp).
function buildSvjBladeWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? def.body, flatShading: true, side: THREE.DoubleSide,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
    emissive: def.wingEmissive ?? 0x000000, emissiveIntensity: model.wingPanelGlow ?? 0.14,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.62,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.42, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const redMat = new THREE.MeshStandardMaterial({
    color: redCol, emissive: redCol, emissiveIntensity: 1.7 * gi, roughness: 0.3,
  });
  redMat.userData.baseEmissive = redCol;
  redMat.userData.baseIntensity = 1.7 * gi;
  spineMats.push(redMat);

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // INNER armored section (rides pivot): root → wrist, dihedral baked into y, swept
    // back into +z. Fresh quad corners.
    const R0 = [side * 0.10, 0, -0.55];               // root leading
    const R1 = [side * 0.10, 0,  0.50];               // root trailing
    const W0 = [side * 1.80 * ws, 0.50, -0.30];       // wrist leading
    const W1 = [side * 1.50 * ws, 0.50,  0.60];       // wrist trailing
    pivot.add(flatTriMesh([[R0, W0, W1], [R0, W1, R1]], wingMat));
    pivot.add(frameBar(R0, W0, [0.16, 0.12], boneMat));   // thick armored leading spar
    pivot.add(frameBar(R1, W1, [0.06, 0.05], boneMat));   // thin trailing rail
    // shoulder hinge wedge block
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.5), carbonMat);
    hinge.rotation.z = side * 0.3; pivot.add(hinge);
    // black vent panel INSIDE the wing
    const vc = lerp3(R0, W0, 0.5);
    const vent = hexGrille({ w: 0.7, h: 0.42, mat: carbonMat, barMat: boneMat });
    vent.position.set(vc[0], vc[1] + 0.04, vc[2] + 0.22); vent.rotation.y = side * 0.2; vent.rotation.x = -0.16;
    pivot.add(vent);
    // red taillights along the inner trailing edge
    for (const t of [0.45, 0.78]) {
      const p = lerp3(R1, W1, t);
      const cl = chevronLight({ len: 0.4, w: 0.05, mat: redMat });
      cl.position.set(p[0], p[1] + 0.03, p[2]); cl.rotation.y = side * 0.18;
      pivot.add(cl);
    }

    // red glowing HEX CELLS scattered on the inner panel (the reference's red-hex
    // membrane nod — flat cells on the wing, not vertical spikes)
    const bil = (u, v) => lerp3(lerp3(R0, W0, u), lerp3(R1, W1, u), v);
    const hexCell = () => {
      const r = 0.07, pts = [];
      for (let k = 0; k < 6; k++) pts.push([Math.cos((k / 6) * Math.PI * 2) * r, Math.sin((k / 6) * Math.PI * 2) * r]);
      return wedgePanel(pts, redMat);
    };
    for (const [u, v] of [[0.32, 0.45], [0.46, 0.62], [0.56, 0.34], [0.66, 0.55], [0.4, 0.25]]) {
      const p = bil(u, v);
      const hx = hexCell();
      hx.position.set(p[0], p[1] + 0.03, p[2]);
      hx.rotation.x = -Math.PI / 2 + 0.25;   // lie roughly flat on the wing, facing up
      pivot.add(hx);
    }

    // OUTER blade (rides wingTip): broad swept blade + vertical endplate.
    const wingTip = new THREE.Group();
    wingTip.position.set(side * 1.80 * ws, 0.50, 0.10);
    const O0 = [0, 0, -0.32];
    const O1 = [side * -0.30, 0, 0.55];
    const T0 = [side * 2.60 * ws, 0.18, 0.45];        // tip leading (swept back + slight rise)
    const T1 = [side * 2.20 * ws, 0.18, 1.05];        // tip trailing
    wingTip.add(flatTriMesh([[O0, T0, T1], [O0, T1, O1]], wingMat));
    wingTip.add(frameBar(O0, T0, [0.12, 0.09], boneMat));   // outer leading spar
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.5), carbonMat);
    ep.position.set(side * 2.60 * ws, 0.32, 0.5); wingTip.add(ep);   // vertical endplate
    for (const t of [0.4, 0.72]) {
      const p = lerp3(O1, T1, t);
      const cl = chevronLight({ len: 0.36, w: 0.05, mat: redMat });
      cl.position.set(p[0], p[1] + 0.02, p[2]); cl.rotation.y = side * 0.22;
      wingTip.add(cl);
    }
    const marker = new THREE.Object3D();
    marker.position.set(side * 2.60 * ws, 0.18, 0.45);
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
registerWings('svjBladeWing', buildSvjBladeWing);

// ── WINGS: 'svjFanWing' — a FAN of gold blade-quills + glowing red HEX membrane ───
// Matches the side reference: each wing is a spread of separate gold blades sweeping
// up-and-back, with a dark membrane between them carrying red-emissive hexagon cells.
// On the frozen rig: the whole fan + membrane ride the pivot (flap as a unit); a tip
// extension + tipMarker ride the wingTip so the fold articulates the fan tips.
function buildSvjFanWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);

  const gold = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true, side: THREE.DoubleSide,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.45, metalness: 0.55,
  });
  const memCol = def.apexSeam ?? 0xff3b2f;
  const memMat = new THREE.MeshStandardMaterial({
    color: 0x180405, emissive: memCol, emissiveIntensity: 0.5, side: THREE.DoubleSide,
    roughness: 0.5, metalness: 0.2,
  });
  const hexMat = new THREE.MeshStandardMaterial({
    color: memCol, emissive: memCol, emissiveIntensity: 1.9 * gi, roughness: 0.3, side: THREE.DoubleSide,
  });
  hexMat.userData.baseEmissive = memCol;
  hexMat.userData.baseIntensity = 1.9 * gi;
  spineMats.push(hexMat);

  // blade fan specs: [reachX, tipY, tipZ, rootY] — sweeps up-and-back (flight spread).
  const FAN = [
    [2.9, 0.25, 0.35, 0.0],
    [3.0, 0.85, 0.65, 0.12],
    [2.7, 1.45, 1.0, 0.22],
    [2.1, 1.95, 1.35, 0.3],
    [1.3, 2.3, 1.7, 0.36],
  ];
  const hexCard = () => {
    const r = 0.09, pts = [];
    for (let k = 0; k < 6; k++) pts.push([Math.cos((k / 6) * Math.PI * 2) * r, Math.sin((k / 6) * Math.PI * 2) * r]);
    return wedgePanel(pts, hexMat);
  };

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    const hub = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.5), carbon);
    hub.rotation.z = side * 0.3; pivot.add(hub);

    // dark membrane fanning between the blade mid-points + the shoulder hub
    const rootHub = [side * 0.12, 0.1, 0.0];
    const mids = FAN.map(([rx, ty, tz]) => [side * rx * 0.5 * ws, ty * 0.5, tz * 0.5]);
    for (let i = 0; i < mids.length - 1; i++)
      pivot.add(flatTriMesh([[rootHub, mids[i], mids[i + 1]]], memMat));
    // red glowing hex cells on the membrane (two per gap, in/out)
    for (let i = 0; i < mids.length - 1; i++) {
      const c = [(rootHub[0] + mids[i][0] + mids[i + 1][0]) / 3, (rootHub[1] + mids[i][1] + mids[i + 1][1]) / 3, (rootHub[2] + mids[i][2] + mids[i + 1][2]) / 3];
      const hx = hexCard(); hx.position.set(c[0], c[1], c[2] + 0.02); hx.rotation.y = side * 0.4; pivot.add(hx);
      const hx2 = hexCard(); hx2.position.set(c[0] * 1.45, c[1] * 1.45, c[2] + 0.02); hx2.scale.setScalar(0.7); hx2.rotation.y = side * 0.4; pivot.add(hx2);
    }

    // 5 solid gold blade quills (leaf-shaped: narrow root → wide middle → point)
    FAN.forEach(([rx, ty, tz, ry]) => {
      const R = [side * 0.06, ry, 0];
      const T = [side * rx * ws, ty, tz];
      const mx = R[0] + (T[0] - R[0]) * 0.38, myv = R[1] + (T[1] - R[1]) * 0.38, mz = R[2] + (T[2] - R[2]) * 0.38;
      const p2 = [mx + side * 0.06, myv, mz + 0.30];   // back/outer edge bulge
      const p4 = [mx - side * 0.06, myv, mz - 0.18];   // front/inner edge
      pivot.add(flatTriMesh([[R, p2, T], [R, T, p4]], gold));
    });

    // wingTip at the long blade's tip → rig fold articulates the fan tips
    const wingTip = new THREE.Group();
    const a = FAN[2];
    wingTip.position.set(side * a[0] * ws, a[1], a[2]);
    const ext = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, seg(4)), gold);
    ext.rotation.x = -1.2; ext.position.set(0, 0.2, 0.1); wingTip.add(ext);
    const marker = new THREE.Object3D();
    marker.position.set(0, 0.25, 0.15); wingTip.add(marker);
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
    wingMat: gold, spineMats,
  };
}
registerWings('svjFanWing', buildSvjFanWing);

// ── HEAD: 'svjWedgeHead' — clean-room low angular wedge skull ─────────────────────
// A low, wide, aggressive car-nose skull (no round animal head): a pointed wedge
// snout, recessed RED eyes, backward-swept horn fins, a lower-jaw blade and diagonal
// brow vents. Uses the shared body material (cloned flat-shaded → gold panels).
function buildSvjWedgeHead(def, model, mats) {
  const { bodyMat } = mats;
  const head = new THREE.Group();
  const gold = bodyMat.clone(); gold.flatShading = true;
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const facetHorn = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.6,
  });
  const eyeCol = def.apexSeam ?? 0xff3b2f;     // RED eyes (match the render)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeCol, emissive: eyeCol, emissiveIntensity: 2.0, roughness: 0.3,
  });
  eyeMat.userData.baseEmissive = eyeCol; eyeMat.userData.baseIntensity = 2.0;

  // Optional head-shape knobs (default 1 ⇒ identical head): a recipe can stretch the
  // skull longer (z) and lower (y) for a sharper wedge-skull read.
  const hls = model.headLenScale ?? 1, hhs = model.headHeightScale ?? 1;

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34 * hhs, 0.9 * hls), gold);
  skull.position.set(0, 0.02, 0);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95 * hls, seg(4)), gold);
  snout.rotation.x = -Math.PI / 2; snout.rotation.z = Math.PI / 4;
  snout.scale.set(1.15, 0.5, 1); snout.position.set(0, -0.04, -0.7 * hls);
  head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6 * hls), carbon);
  jaw.position.set(0, -0.2 * hhs, -0.5 * hls);
  head.add(jaw);
  for (const s of [-1, 1]) {
    const sock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), carbon);
    sock.position.set(s * 0.28, 0.06, -0.2 * hls); sock.rotation.y = s * 0.3;
    head.add(sock);
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 * (model.eyeScale || 1)), eyeMat);
    eye.scale.set(1.7, 0.7, 1); eye.position.set(s * 0.3, 0.06, -0.27 * hls);
    head.add(eye);
  }
  // Multi-blade backswept horn CREST — grows with the form's hornLevel: 0 none/bare
  // (Hatchling baby) · 1 a single small bud · 2 a pair · 3 the full 3-blade crest +
  // crown (Eternal). cheek plates stay on all forms.
  const hl = Math.max(0.5, model.hornLen ?? 1.0);
  const hlvl = model.hornLevel ?? 3;
  for (const s of [-1, 1]) {
    for (let i = 0; i < hlvl; i++) {
      const len = hl * (0.7 + 0.32 * (1 - Math.abs(i - 1)));   // middle blade longest
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.07, len, seg(4)), gold);
      blade.position.set(s * (0.18 + i * 0.1), 0.2 + i * 0.04, 0.2 + i * 0.12);
      blade.rotation.x = 0.95 + i * 0.06;        // sweep back/up
      blade.rotation.z = s * (0.25 + i * 0.18);   // fan outward
      head.add(blade);
    }
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), carbon);
    cheek.position.set(s * 0.32, -0.05, -0.25); cheek.rotation.y = s * 0.2;
    head.add(cheek);
  }
  if (hlvl >= 2) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.08, hl * 1.15, seg(4)), gold);
    crown.position.set(0, 0.24, 0.32); crown.rotation.x = 1.05;
    head.add(crown);
  }
  const brow = ventPlateRow(3, { w: 0.4, h: 0.13, plateMat: gold, slitMat: carbon });
  brow.position.set(0, 0.2, -0.04); brow.rotation.x = -0.5;
  head.add(brow);

  // Per-form overall head size (baby = oversized, relative to the body scale).
  head.scale.setScalar(model.headScale ?? 1);
  return { group: head, spineMats: [eyeMat] };
}
registerHead('svjWedgeHead', buildSvjWedgeHead);

// ── TAIL: 'svjArmorTail' — clean-room long armored coiling tail ───────────────────
// ~9 chunky hex spine segments (black core + yellow armor shell), thick base
// tapering LATE, smooth coil (non-empty segs → the rig coils it). Big sharp yellow
// stabilizer blades near the tip (tailFins: deploy on boost + flutter, riding a rear
// segment so they also follow the coil), small blade fins on the rear segments, red
// taillight slits, and a spear tip. Fin tuning re-derived (not copied from svjRear).
function buildSvjArmorTail(def, model, mats, anchor) {
  const { bodyMat } = mats;
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const gold = bodyMat.clone(); gold.flatShading = true;
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const redMat = new THREE.MeshStandardMaterial({
    color: redCol, emissive: redCol, emissiveIntensity: 1.7, roughness: 0.3,
  });
  redMat.userData.baseEmissive = redCol; redMat.userData.baseIntensity = 1.7;
  const accentMats = [redMat];
  const segs = [], tailFins = [];

  const n = Math.min(model.tailSegments ?? 9, 12);
  let z = 0.12, r = 0.34;
  const taper = 0.87, segLen = 0.46;
  let rearSeg = null;
  for (let i = 0; i < n; i++) {
    const rTop = Math.max(r * taper, 0.07);
    const ss = spineSegment({ rTop, rBot: r, len: segLen, coreMat: carbon, armorMat: gold });
    ss.group.position.set(0, 0, z);
    root.add(ss.group);
    segs.push(ss.group);
    // red taillight slit on mid segments (rear-facing read)
    if (i >= 2 && i <= 5) {
      const slit = chevronLight({ len: r * 1.3, w: 0.045, mat: redMat });
      slit.position.set(0, r * 0.5, segLen * 0.3);
      ss.group.add(slit);
    }
    // small blade fins on the rear segments (static, ride the seg)
    if (i >= n - 3) {
      for (const s of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.2), gold);
        fin.position.set(s * (r + 0.18), r * 0.4, 0);
        fin.rotation.z = s * 0.3;
        ss.group.add(fin);
      }
    }
    if (i === n - 2) rearSeg = ss.group;   // mount big stabilizers here (near the tip)
    z += segLen * 0.82;
    r = Math.max(r * taper, 0.07);
  }

  // BIG sharp yellow stabilizer blades (tailFins) near the tip — children of a rear
  // segment so they ride the coil, AND in tailFins so the rig deploys/flutters them.
  const host = rearSeg ?? root;
  for (const s of [-1, 1]) {
    const flap = new THREE.Group();
    flap.position.set(s * 0.12, 0.14, 0);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.36), gold);
    blade.position.set(s * 0.38, 0, 0);
    flap.add(blade);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.05), redMat);
    edge.position.set(s * 0.38, 0.02, 0.18);
    flap.add(edge);
    flap.userData.restRotX = -0.14;          // re-derived tuning (sharper deploy)
    flap.userData.restRotY = 0;
    flap.userData.restRotZ = s * 0.22;
    flap.userData.restScale = 1;
    flap.userData.bankGain = s * 0.55;
    flap.userData.flapFlutter = 0.24;
    flap.userData.phase = s * 1.5;
    host.add(flap);
    tailFins.push(flap);
  }

  // spear tip on the final segment (rides the tip of the coil)
  const tip = segs[segs.length - 1];
  const spear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, seg(4)), gold);
  spear.rotation.x = Math.PI / 2;   // point +z (back)
  spear.position.set(0, 0, segLen * 0.5 + 0.2);
  tip.add(spear);

  return { group: root, segs, tailFins, accentMats };
}
registerTail('svjArmorTail', buildSvjArmorTail);

// ── SURFACE LAYERS (v2) ──────────────────────────────────────────────────────────

// engineBay — rear-engine detail riding the body: black engine-core overlays + top
// vent slashes on the back deck, and triangular side intakes with hex grilles on the
// flanks. Clamped to the body via the attach contract (keelTopAt/halfWidthAt/bodyMidY).
registerSurfaceLayer('engineBay', ({ def, attach }) => {
  const meshes = [], flareMats = [];
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.42, metalness: 0.6,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.55,
  });
  const my = attach.bodyMidY ?? 0.2;
  for (const z of [0.1, 0.5]) {
    const top = attach.keelTopAt ? attach.keelTopAt(z) : 0.6;
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.4), carbon);
    core.position.set(0, top - 0.04, z);
    meshes.push(core);
    const vents = ventPlateRow(3, { w: 0.44, h: 0.16, plateMat: carbon, slitMat: boneMat });
    vents.position.set(0, top + 0.04, z);
    vents.rotation.x = -Math.PI / 2 + 0.2;
    meshes.push(vents);
  }
  for (const s of [-1, 1]) {
    for (const z of [-0.2, 0.5]) {
      const hw = attach.halfWidthAt ? attach.halfWidthAt(z) : 0.7;
      const intake = wedgePanel([[-0.24, -0.16], [0.28, -0.04], [0.1, 0.2]], carbon);
      intake.position.set(s * hw, my + 0.04, z);
      intake.rotation.y = s * Math.PI / 2;
      meshes.push(intake);
      const grille = hexGrille({ w: 0.28, h: 0.18, mat: carbon, barMat: boneMat });
      grille.position.set(s * hw * 1.02, my + 0.04, z);
      grille.rotation.y = s * Math.PI / 2;
      meshes.push(grille);
    }
  }
  return { meshes, flareMats };
});

// ventSlashes — yellow vent-slash plates on each flank/shoulder (medium-priority
// greeble), riding the body half-width.
registerSurfaceLayer('ventSlashes', ({ def, attach }) => {
  const meshes = [];
  const gold = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const my = attach.bodyMidY ?? 0.2;
  for (const s of [-1, 1]) {
    for (const z of [-0.5, 0.3]) {
      const hw = attach.halfWidthAt ? attach.halfWidthAt(z) : 0.7;
      const row = ventPlateRow(3, { w: 0.4, h: 0.26, plateMat: gold, slitMat: carbon });
      row.position.set(s * hw, my + 0.14, z);
      row.rotation.y = s * 0.6;
      meshes.push(row);
    }
  }
  return { meshes, flareMats: [] };
});

// twinThrusters — the prominent rear read: two big red-cored thruster pods facing the
// chase cam (+z), mounted on the rear of the engine block. Cores → flareMats (Surge).
registerSurfaceLayer('twinThrusters', ({ def, model, attach }) => {
  const meshes = [], flareMats = [];
  // Per-FORM thruster level (Mk II): 0 none (Hatchling) · 1 dim vent-core (Kindled) ·
  // 2 adult pod w/ hot core (Radiant) · 3 full layered pod + frame + fire-emitter (Eternal).
  const tlvl = model.thrusterLevel ?? 3;
  if (tlvl <= 0) return { meshes, flareMats };
  const lsz = tlvl >= 3 ? 1 : tlvl === 2 ? 0.82 : 0.6;
  // The layered SVJ read (frame / hot core / hotspot / fire-emitter) is opt-in via
  // def.thruster.frame (Mk II only) — aurumToro has none → plain pods, byte-identical.
  const layered = !!(def.thruster && def.thruster.frame);
  const showFrame = layered && tlvl >= 3, showHot = layered && tlvl >= 2, showEmit = layered && tlvl >= 3;
  const housingMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.62,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  // Optional thruster knobs (default ⇒ today's pods): a recipe can make the twin
  // thrusters bigger/brighter and re-space them to dominate the rear engine read.
  const t = def.thruster ?? {};
  const rOuter = (t.rOuter ?? 0.27) * lsz, rCore = (t.rCore ?? 0.17) * lsz, depth = (t.depth ?? 0.26) * lsz;
  const spread = t.spread ?? 0.42, zoff = t.z ?? 0.34, intensity = (t.intensity ?? 2.0) * (tlvl >= 3 ? 1 : 0.7);
  // The pod's inner disc = the saturated-RED turbine ring. (Layered SVJ read for Mk II
  // overlays a brighter ORANGE core + warm-WHITE hotspot below — the real UnrealBloom
  // pass blooms the high emissive, so the cores out-glow the dimmer wing chevrons.)
  const ringCol = t.ringColor ?? def.boostTrail ?? def.coreGlow ?? def.apexSeam ?? 0xff3b2f;
  const coreMat = new THREE.MeshStandardMaterial({
    color: ringCol, emissive: ringCol, emissiveIntensity: intensity, roughness: 0.3,
  });
  coreMat.userData.baseEmissive = ringCol; coreMat.userData.baseIntensity = intensity;
  flareMats.push(coreMat);
  // Mount on the NARROW rear corners (just behind the haunch, where the body necks
  // down to the tail) so the pods protrude clear of the bulk and flank the tail root
  // — the first thing the chase cam sees, not buried inside the engine block.
  const anchor = attach.tailAnchor ?? { y: 0.3, z: 0.8 };
  const my = (attach.bodyMidY ?? 0.2) + 0.04;
  const z = anchor.z + zoff;
  for (const s of [-1, 1]) {
    const { group } = thrusterPod({ rOuter, rCore, depth, housingMat, frameMat, coreMat });
    group.position.set(s * spread, my, z);
    meshes.push(group);
    // Layered SVJ read scales with the form: armor frame (Eternal), bright orange hot
    // core + warm-white hotspot (Radiant+), and the fire-trail emitter (Eternal).
    const mouthZ = z + depth * 0.26;
    if (showFrame) {
      const r = rOuter;
      const frame = flatTriMesh([
        [[-r * 1.35, -r * 1.35, 0], [r * 1.35, -r * 1.35, 0], [r * 1.5, 0, 0]],
        [[r * 1.5, 0, 0], [r * 1.35, r * 1.35, 0], [0, r * 1.55, 0]],
        [[0, r * 1.55, 0], [-r * 1.35, r * 1.35, 0], [-r * 1.5, 0, 0]],
        [[-r * 1.5, 0, 0], [-r * 1.35, -r * 1.35, 0], [0, -r * 1.6, 0]],
      ], frameMat);
      frame.position.set(s * spread, my, z - depth * 0.34);
      meshes.push(frame);
    }
    if (showHot) {
      // bright orange hot core (the brightest red-orange element on the dragon)
      const coreCol = t.coreColor ?? def.coreGlow ?? 0xff7a1a;
      const coreInt = (t.coreIntensity ?? 4.2) * (tlvl >= 3 ? 1 : 0.82);
      const coreGlowMat = new THREE.MeshStandardMaterial({ color: coreCol, emissive: coreCol, emissiveIntensity: coreInt, roughness: 0.25 });
      coreGlowMat.userData.baseEmissive = coreCol; coreGlowMat.userData.baseIntensity = coreInt;
      flareMats.push(coreGlowMat);
      const rcg = (t.rCoreGlow ?? 0.17 * 0.64) * lsz;
      const cg = new THREE.Mesh(new THREE.CylinderGeometry(rcg, rcg, depth * 0.32, seg(12)), coreGlowMat);
      cg.rotation.x = Math.PI / 2; cg.position.set(s * spread, my, mouthZ);
      meshes.push(cg);
      const hotCol = t.hotColor ?? def.surgeHi ?? 0xfff0b8;
      const hotInt = t.hotIntensity ?? 3.6;
      const hotMat = new THREE.MeshStandardMaterial({ color: hotCol, emissive: hotCol, emissiveIntensity: hotInt, roughness: 0.2 });
      const rh = rcg * 0.46;
      const hs = new THREE.Mesh(new THREE.CylinderGeometry(rh, rh, depth * 0.22, seg(8)), hotMat);
      hs.rotation.x = Math.PI / 2; hs.position.set(s * spread, my, mouthZ + depth * 0.05);
      meshes.push(hs);
    }
    if (showEmit) {
      // Emitter marker at the pod mouth — the dragon VFX loop spawns a jet fire trail
      // from these during Surge on the Eternal form. Invisible; tagged for collection.
      const emit = new THREE.Object3D();
      emit.position.set(s * spread, my, mouthZ + depth * 0.1);
      emit.userData.svjThrusterEmitter = true;
      meshes.push(emit);
    }
  }
  return { meshes, flareMats };
});

// svjShoulderNacelles — angular YELLOW shoulder engine pods + black recessed intakes
// at each wing root, so the wings read as plugged into an SVJ engine bay rather than
// stuck to a thin spine. Reads attach.wingRoot(side). Rear-/shop-facing identity.
registerSurfaceLayer('svjShoulderNacelles', ({ def, model, attach }) => {
  const meshes = [];
  // Per-FORM: 0 absent (Hatchling) · 1 light · 2 full · 3 strongest (Eternal).
  const nlvl = model.nacelleLevel ?? 3;
  if (nlvl <= 0) return { meshes, flareMats: [] };
  const nsz = nlvl >= 3 ? 1 : nlvl === 2 ? 0.85 : 0.62;
  const gold = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  for (const s of [-1, 1]) {
    const wr = attach.wingRoot ? attach.wingRoot(s) : { x: s * 0.85, y: 0.7, z: -0.3 };
    // angular yellow pod just inboard/below the wing root
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.34 * nsz, 0.30 * nsz, 0.62 * nsz), gold);
    pod.position.set(wr.x - s * 0.05, wr.y - 0.13, wr.z - 0.06);
    pod.rotation.y = s * 0.14; pod.rotation.z = s * -0.12;
    meshes.push(pod);
    // black recessed underside intake
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.18 * nsz, 0.10, 0.46 * nsz), carbon);
    intake.position.set(wr.x, wr.y - 0.25, wr.z - 0.02);
    intake.rotation.y = s * 0.14;
    meshes.push(intake);
  }
  return { meshes, flareMats: [] };
});

// svjSpineArmorCaps — a row of low YELLOW wedge armor plates with black base gaps along
// the keel crest (attach.keelTopAt) for a segmented mechanical "vertebrae" rhythm — the
// SVJ read the thin spike line lacked. (Mk II uses this INSTEAD of svjDorsalSpine.)
registerSurfaceLayer('svjSpineArmorCaps', ({ def, model, attach, giM }) => {
  const meshes = [], flareMats = [];
  // Per-FORM: 0 bare spine (Hatchling) · 1 sparse caps · 2 more · 3 full + red seams (Eternal).
  const slvl = model.spineCapLevel ?? 3;
  if (slvl <= 0) return { meshes, flareMats };
  const gold = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.22, metalness: def.bodyMetalness ?? 0.6,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const intensity = 1.2 * Math.min(giM ?? 1, 1.3);
  const red = new THREE.MeshStandardMaterial({ color: redCol, emissive: redCol, emissiveIntensity: intensity, roughness: 0.3 });
  red.userData.baseEmissive = redCol; red.userData.baseIntensity = intensity;
  flareMats.push(red);
  const n = slvl >= 3 ? 11 : slvl === 2 ? 9 : 6, z0 = -1.8, z1 = 1.0;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const z = z0 + (z1 - z0) * t;
    const top = attach.keelTopAt ? attach.keelTopAt(z) : 0.6;
    const w = 0.16 - 0.06 * t;                          // taper toward the tail
    const base = new THREE.Mesh(new THREE.BoxGeometry(w * 1.3, 0.04, 0.10), carbon);
    base.position.set(0, top + 0.01, z); meshes.push(base);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.20), gold);
    cap.position.set(0, top + 0.055, z); cap.rotation.x = -0.12; meshes.push(cap);
    if (slvl >= 3 && i % 2 === 1) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.02, 0.04), red);
      seam.position.set(0, top + 0.085, z + 0.06); meshes.push(seam);
    }
  }
  return { meshes, flareMats };
});

// rearDiffuser — COMPACT 5-fin diffuser tucked low UNDER the thruster block (subtle).
registerSurfaceLayer('rearDiffuser', ({ def, attach }) => {
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.45, metalness: 0.5,
  });
  const anchor = attach.tailAnchor ?? { y: 0.3, z: 0.8 };
  const arr = diffuserArray(5, { centerH: 0.34, sideH: 0.2, mat: carbon, rake: 0.32, spacing: 0.14, depth: 0.3 });
  arr.position.set(0, (attach.bodyMidY ?? 0.2) - 0.3, anchor.z + 0.05);
  return { meshes: [arr], flareMats: [] };
});

// mechaLegs — two SMALL folded claw legs tucked under the belly (static, no rig touch)
// so they don't clutter the chase silhouette.
registerSurfaceLayer('mechaLegs', ({ def, attach }) => {
  const meshes = [];
  const pistonMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.62,
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.28, metalness: def.bodyMetalness ?? 0.5,
  });
  const clawMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.6,
  });
  const my = attach.bodyMidY ?? 0.2;
  for (const s of [-1, 1]) {
    const { group } = mechaLeg({ side: s, pistonMat, bladeMat, clawMat });
    const hw = attach.halfWidthAt ? attach.halfWidthAt(0.1) : 0.7;
    group.position.set(s * hw * 0.8, my - 0.12, 0.2);
    group.rotation.x = -0.7;          // tuck up/back under the belly
    group.rotation.z = s * 0.2;
    group.scale.setScalar(0.85);
    meshes.push(group);
  }
  return { meshes, flareMats: [] };
});

// ── SURFACE LAYERS (v3 side-profile match) ───────────────────────────────────────

// svjScaleArmor — the carbon-hex underbody + gold armor plates from the reference.
// Two merged shingle() runs (one draw call each): black cupped CARBON scales over the
// lower flanks/belly, and larger GOLD plate scutes over the shoulders/back. Rides the
// body via attach.halfWidthAt/keelTopAt/bodyMidY. Carries the bulk of the tri budget.
registerSurfaceLayer('svjScaleArmor', ({ def, attach }) => {
  const meshes = [];
  const my = attach.bodyMidY ?? 0.2;
  const hwAt = attach.halfWidthAt ? attach.halfWidthAt : () => 0.7;
  const topAt = attach.keelTopAt ? attach.keelTopAt : () => 0.6;
  const z0 = -1.6, z1 = 0.95;
  const zAt = (t) => z0 + (z1 - z0) * t;
  const carbonMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? 0x0e0e12, roughness: 0.5, metalness: 0.5,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.6,
  });
  // CARBON hex scales — 4 bands (2 per side: belly-low + mid-flank).
  const carbon = shingle({
    count: 92, rows: 4, material: carbonMat, cup: 0.3, tilt: 0.5,
    cardRows: 2, cardCols: 2, length: 0.3, width: 0.26,
    at: (t, row) => {
      const z = zAt(t); const side = row < 2 ? -1 : 1; const band = row % 2;
      return { x: side * hwAt(z) * (0.55 + band * 0.42), y: my - 0.16 + band * 0.22, z };
    },
    normalAt: (t, row) => {
      const side = row < 2 ? -1 : 1; const band = row % 2;
      return new THREE.Vector3(side * (0.5 + band * 0.45), band === 0 ? -0.5 : 0.12, 0);
    },
    tangentAt: () => new THREE.Vector3(0, 0, 1),
  });
  meshes.push(carbon.mesh);
  // GOLD armor plates — 2 bands (1 per side) over the shoulders/back.
  const goldPlates = shingle({
    count: 16, rows: 2, material: goldMat, cup: 0.18, tilt: 0.34,
    cardRows: 1, cardCols: 2, length: 0.42, width: 0.36,
    at: (t, row) => {
      const z = zAt(t * 0.85 - 0.05); const side = row === 0 ? -1 : 1;
      return { x: side * hwAt(z) * 0.7, y: my + (topAt(z) - my) * 0.7, z };
    },
    normalAt: (t, row) => new THREE.Vector3((row === 0 ? -1 : 1) * 0.7, 0.6, 0),
    tangentAt: () => new THREE.Vector3(0, 0, 1),
  });
  meshes.push(goldPlates.mesh);
  return { meshes, flareMats: [] };
});

// svjDorsalSpine — a continuous row of raked-back GOLD spikes head→tail along the
// keel crest (attach.keelTopAt), tallest mid-back, with red-emissive base seams.
registerSurfaceLayer('svjDorsalSpine', ({ def, attach, giM }) => {
  const meshes = [], flareMats = [];
  const gold = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.22, metalness: def.bodyMetalness ?? 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const intensity = 1.3 * Math.min(giM ?? 1, 1.3);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: redCol, emissive: redCol, emissiveIntensity: intensity, roughness: 0.3,
  });
  edgeMat.userData.baseEmissive = redCol; edgeMat.userData.baseIntensity = intensity;
  flareMats.push(edgeMat);
  const n = 20, z0 = -2.0, z1 = 1.0;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const z = z0 + (z1 - z0) * t;
    const top = attach.keelTopAt ? attach.keelTopAt(z) : 0.6;
    const h = 0.16 + 0.18 * Math.sin(t * Math.PI);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, h, seg(4)), gold);
    spike.rotation.x = -1.2;
    spike.position.set(0, top + h * 0.4, z);
    meshes.push(spike);
    if (i % 2 === 0) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), edgeMat);
      seam.position.set(0, top + 0.01, z);
      meshes.push(seam);
    }
  }
  return { meshes, flareMats };
});

// svjQuadLegs — FOUR armored legs (front pair + bigger rear haunches), tucked under
// the body for flight. Reuses mechaLeg() with extra thigh/knee armor plates. Static.
registerSurfaceLayer('svjQuadLegs', ({ def, attach }) => {
  const meshes = [];
  const piston = new THREE.MeshStandardMaterial({ color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.62 });
  const blade = new THREE.MeshStandardMaterial({ color: def.body ?? 0xf2c20e, flatShading: true, roughness: def.bodyRoughness ?? 0.26, metalness: def.bodyMetalness ?? 0.55 });
  const claw = new THREE.MeshStandardMaterial({ color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.6 });
  const my = attach.bodyMidY ?? 0.2;
  const mkLeg = (s, z, scale, splay) => {
    const { group } = mechaLeg({ side: s, pistonMat: piston, bladeMat: blade, clawMat: claw });
    const hw = attach.halfWidthAt ? attach.halfWidthAt(z) : 0.7;
    group.position.set(s * hw * 0.96, my - 0.18, z);
    group.rotation.x = -0.3; group.rotation.z = s * splay;   // hangs down-and-back (visible, not buried)
    group.scale.setScalar(scale);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), blade);
    thigh.position.set(0, -0.13, 0); group.add(thigh);
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.17), blade);
    knee.position.set(0, -0.32, 0.02); group.add(knee);
    return group;
  };
  for (const s of [-1, 1]) meshes.push(mkLeg(s, -0.75, 1.35, 0.2));   // front pair
  for (const s of [-1, 1]) meshes.push(mkLeg(s, 0.5, 1.7, 0.3));      // rear haunches (bigger)
  return { meshes, flareMats: [] };
});

// ════════════════════════════════════════════════════════════════════════════
// SVJ MECHA-DRAGON v2 (RESKIN) — restored verbatim from git 7c8ebf5 for the
// side-by-side comparison entry (aurumToroV2 / "Aurum Toro Mk I"). This is the
// FIRST SVJ pass: bull-derived body/wings (svjEngineBay/bladeWing/svjDragonHead)
// + the new long segmented armored tail (segmentedAeroTail). The v2 surface
// layers it uses (engineBay/ventSlashes/twinThrusters/rearDiffuser/mechaLegs) are
// already registered above.
// SVJ_ENGINE_PROFILE — BULL_PROFILE widened into a rear-ENGINE BLOCK: broad chest, a
// thick NON-pinched waist and a fat haunch so the body reads as a powerful engine
// bay, not an organic ribcage. Same fields buildTorso reads (attach contract + neck
// chain come free); lofted through the boxy wedgeRing (faceted geometry).
const SVJ_ENGINE_PROFILE = {
  zHold: -0.3,
  tailShiftRefZ: 1.10,
  tailAnchorY: 0.32,
  tailAnchorZ: 0.82,
  stations: [
    [-2.30, 0.22, 0.16, 0.18], // short neck cap
    [-1.80, 0.54, 0.40, 0.42], // chest start
    [-1.20, 0.82, 0.60, 0.62], // deep chest
    [-0.60, 0.95, 0.70, 0.66], // shoulder/chest peak — broadest
    [-0.05, 0.92, 0.62, 0.64], // barrel thorax (stays thick)
    [ 0.42, 0.82, 0.54, 0.58], // waist — NOT pinched (engine mass)
    [ 0.80, 0.88, 0.58, 0.62], // HAUNCH / engine-bay bulge (rear-wide)
    [ 1.10, 0.46, 0.38, 0.30], // bulky tail root
  ],
  keel: [[-1.80, 0.40], [-0.60, 0.70], [-0.05, 0.62], [0.42, 0.54], [0.80, 0.58], [1.10, 0.38]],
  wingRoot: { x: 0.72, y: 0.66, z: -0.5 },
  // Tiny fairing — the smooth sphere blows out to white and clashes with the faceted
  // skin, and the scissorHinge carbon blocks + wing hinges already fill the shoulder.
  // Shrunk so it tucks under the wing root instead of reading as a bulbous gold ball.
  fairing: { r: 0.14, scale: [0.9, 0.8, 1.1], pos: [0.6, 0.6, -0.46] },
  neck: {
    rBase: 0.46, rStep: 0.055, rMin: 0.22, scale: [0.86, 0.74, 1.12],
    y0: 0.38, yStep: 0.075, z0: -1.7, zStep: -0.32, wobbleAmp: 0.05, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.54 + (neckSegs - 4) * 0.08, z: -2.5 - (neckSegs - 4) * 0.3 }),
};
registerTorso('svjEngineBay', (def, model, bodyMat) =>
  buildTorso(SVJ_ENGINE_PROFILE, def, model, bodyMat, buildFacetedTorsoGeometry));

// ── WINGS: 'bladeWing' — the dominant chase-cam feature ──────────────────────────
// Huge angular blade wings on the frozen rig. Yellow armor = the outer silhouette; a
// black hex/vent panel sits INSIDE the wing; red chevron taillights run the trailing
// edge (rear-facing, so they read in the chase view). Built big (~10.6u span) in a
// broad GLIDE pose (a low flapAmp keeps it wide, not a deep beat). Honors the frozen
// rig contract verbatim (inner panel on wingPivot, outer blade on wingTip).
function buildBladeWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);

  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? def.body, flatShading: true, side: THREE.DoubleSide,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
    emissive: def.wingEmissive ?? 0x000000, emissiveIntensity: model.wingPanelGlow ?? 0.16,
  });
  const boneMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.62,
  });
  const carbonMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.42, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? def.wingEmissive ?? 0xff3b2f;
  const redMat = new THREE.MeshStandardMaterial({
    color: redCol, emissive: redCol, emissiveIntensity: 1.7 * gi, roughness: 0.3,
  });
  redMat.userData.baseEmissive = redCol;
  redMat.userData.baseIntensity = 1.7 * gi;
  spineMats.push(redMat);

  // Reaches (engine-local × wingScale). Inner wrist out+up (dihedral), outer blade
  // sweeps back hard (toward +z = tail). Per-side reach ≈ IX+OX → 2× ≈ huge/cropped.
  const IX = 1.95 * ws, IY = 0.5;             // wrist x out, y up (dihedral)
  const OX = 2.7 * ws, OY = 0.16;             // outer tip extra x + slight rise
  const ISW = 0.34, OSW = 1.05;               // sweep-back
  const rootC = 1.05, midC = 0.82, tipC = 0.32;

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    // shoulder hinge block (carbon) at the root
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.42), carbonMat);
    hinge.rotation.z = side * 0.32;
    pivot.add(hinge);

    // INNER PANEL (yellow armor) root→wrist; dihedral baked into y.
    const A = [side * 0.16, 0, -rootC * 0.5];                 // root leading
    const D = [side * 0.16, 0,  rootC * 0.5];                 // root trailing
    const B = [side * IX, IY, -midC * 0.5 + ISW];             // wrist leading
    const C = [side * (IX - 0.34), IY, midC * 0.5 + ISW];     // wrist trailing
    pivot.add(flatTriMesh([[A, B, C], [A, C, D]], wingMat));
    pivot.add(frameBar(A, B, [0.17, 0.1], boneMat));          // carbon leading boom (body line)
    pivot.add(frameBar(D, C, [0.06, 0.05], boneMat));         // thin trailing rail

    // BLACK HEX/VENT PANEL inside the wing (not on the silhouette)
    const vent = hexGrille({ w: 0.74, h: 0.5, mat: carbonMat, barMat: boneMat });
    vent.position.set(side * IX * 0.52, IY * 0.5 + 0.02, ISW * 0.4 + 0.12);
    vent.rotation.y = side * 0.22; vent.rotation.x = -0.18;
    pivot.add(vent);
    // 3 diagonal vent slashes on the inner armor (rear-facing greeble)
    const slashes = ventPlateRow(3, { w: 0.5, h: 0.32, plateMat: wingMat, slitMat: carbonMat });
    slashes.position.set(side * IX * 0.46, IY * 0.5 + 0.08, -0.08);
    slashes.rotation.y = side * 0.32;
    pivot.add(slashes);

    // RED chevron taillights along the inner trailing rail (D→C)
    for (const t of [0.5, 0.78]) {
      const cl = chevronLight({ len: 0.42, w: 0.05, mat: redMat });
      cl.position.set(D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t + 0.03, D[2] + (C[2] - D[2]) * t);
      cl.rotation.y = side * 0.2;
      pivot.add(cl);
    }

    // wingTip (wrist) — the rig folds this; the outer blade rides it.
    const wingTip = new THREE.Group();
    wingTip.position.set(side * IX, IY, ISW);
    const Bp = [0, 0, -midC * 0.5];
    const Cp = [side * -0.34, 0, midC * 0.5];
    const T  = [side * OX, OY, -tipC * 0.5 + OSW];           // outer tip leading
    const Tt = [side * (OX - 0.55), OY, tipC * 0.5 + OSW];   // outer tip trailing
    wingTip.add(flatTriMesh([[Bp, T, Tt], [Bp, Tt, Cp]], wingMat));
    wingTip.add(frameBar(Bp, T, [0.13, 0.08], boneMat));     // outer leading bar (sharp rail)
    // trailing flap blade (thin, behind the trailing edge)
    const flapTip = [side * (OX - 0.78), OY - 0.04, midC * 0.5 + OSW + 0.24];
    wingTip.add(flatTriMesh([[Cp, Tt, flapTip]], wingMat));
    // wingtip endplate (vertical fin)
    const ep = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.48), carbonMat);
    ep.position.set(side * OX, OY + 0.1, -tipC * 0.5 + OSW);
    wingTip.add(ep);
    // RED chevron taillights along the outer trailing edge (Cp→Tt)
    for (const t of [0.45, 0.72]) {
      const cl = chevronLight({ len: 0.38, w: 0.05, mat: redMat });
      cl.position.set(Cp[0] + (Tt[0] - Cp[0]) * t, Cp[1] + (Tt[1] - Cp[1]) * t + 0.02, Cp[2] + (Tt[2] - Cp[2]) * t);
      cl.rotation.y = side * 0.25;
      wingTip.add(cl);
    }
    const marker = new THREE.Object3D();
    marker.position.set(side * OX, OY, -tipC * 0.5 + OSW);
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
registerWings('bladeWing', buildBladeWing);

// ── HEAD: 'svjDragonHead' — low angular wedge skull ──────────────────────────────
// A low, wide, aggressive car-nose skull (no round animal head): a pointed wedge
// snout, recessed RED eyes, backward-swept horn fins, a lower-jaw blade and diagonal
// brow vents. Uses the shared body material (cloned flat-shaded → gold panels).
function buildSvjDragonHead(def, model, mats) {
  const { bodyMat } = mats;
  const head = new THREE.Group();
  const gold = bodyMat.clone(); gold.flatShading = true;
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const facetHorn = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.35, metalness: 0.6,
  });
  const eyeCol = def.apexSeam ?? 0xff3b2f;     // RED eyes (match the render)
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeCol, emissive: eyeCol, emissiveIntensity: 2.0, roughness: 0.3,
  });
  eyeMat.userData.baseEmissive = eyeCol; eyeMat.userData.baseIntensity = 2.0;

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.9), gold);
  skull.position.set(0, 0.02, 0);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.95, seg(4)), gold);
  snout.rotation.x = -Math.PI / 2; snout.rotation.z = Math.PI / 4;
  snout.scale.set(1.15, 0.5, 1); snout.position.set(0, -0.04, -0.7);
  head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), carbon);
  jaw.position.set(0, -0.2, -0.5);
  head.add(jaw);
  for (const s of [-1, 1]) {
    const sock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), carbon);
    sock.position.set(s * 0.28, 0.06, -0.2); sock.rotation.y = s * 0.3;
    head.add(sock);
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 * (model.eyeScale || 1)), eyeMat);
    eye.scale.set(1.7, 0.7, 1); eye.position.set(s * 0.3, 0.06, -0.27);
    head.add(eye);
  }
  const hl = Math.max(0.4, model.hornLen ?? 0.9);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, hl, seg(4)), facetHorn);
    horn.position.set(s * 0.3, 0.18, 0.28);
    horn.rotation.x = 0.85;           // sweep back (+z) and up
    horn.rotation.z = s * 0.4;        // outward splay
    head.add(horn);
  }
  const brow = ventPlateRow(3, { w: 0.4, h: 0.13, plateMat: gold, slitMat: carbon });
  brow.position.set(0, 0.2, -0.04); brow.rotation.x = -0.5;
  head.add(brow);

  return { group: head, spineMats: [eyeMat] };
}
registerHead('svjDragonHead', buildSvjDragonHead);

// ── TAIL: 'segmentedAeroTail' — long armored coiling tail ─────────────────────────
// ~9 chunky hex spine segments (black core + yellow armor shell), thick base
// tapering LATE, smooth coil (non-empty segs → the rig coils it). Big sharp yellow
// stabilizer blades near the tip (tailFins: deploy on boost + flutter, riding a rear
// segment so they also follow the coil), small blade fins on the rear segments, red
// taillight slits, and a spear tip.
function buildSegmentedAeroTail(def, model, mats, anchor) {
  const { bodyMat } = mats;
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const gold = bodyMat.clone(); gold.flatShading = true;
  const carbon = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const redMat = new THREE.MeshStandardMaterial({
    color: redCol, emissive: redCol, emissiveIntensity: 1.7, roughness: 0.3,
  });
  redMat.userData.baseEmissive = redCol; redMat.userData.baseIntensity = 1.7;
  const accentMats = [redMat];
  const segs = [], tailFins = [];

  const n = Math.min(model.tailSegments ?? 9, 12);
  let z = 0.12, r = 0.34;
  const taper = 0.87, segLen = 0.46;
  let rearSeg = null;
  for (let i = 0; i < n; i++) {
    const rTop = Math.max(r * taper, 0.07);
    const ss = spineSegment({ rTop, rBot: r, len: segLen, coreMat: carbon, armorMat: gold });
    ss.group.position.set(0, 0, z);
    root.add(ss.group);
    segs.push(ss.group);
    // red taillight slit on mid segments (rear-facing read)
    if (i >= 2 && i <= 5) {
      const slit = chevronLight({ len: r * 1.3, w: 0.045, mat: redMat });
      slit.position.set(0, r * 0.5, segLen * 0.3);
      ss.group.add(slit);
    }
    // small blade fins on the rear segments (static, ride the seg)
    if (i >= n - 3) {
      for (const s of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.2), gold);
        fin.position.set(s * (r + 0.18), r * 0.4, 0);
        fin.rotation.z = s * 0.3;
        ss.group.add(fin);
      }
    }
    if (i === n - 2) rearSeg = ss.group;   // mount big stabilizers here (near the tip)
    z += segLen * 0.82;
    r = Math.max(r * taper, 0.07);
  }

  // BIG sharp yellow stabilizer blades (tailFins) near the tip — children of a rear
  // segment so they ride the coil, AND in tailFins so the rig deploys/flutters them.
  const host = rearSeg ?? root;
  for (const s of [-1, 1]) {
    const flap = new THREE.Group();
    flap.position.set(s * 0.12, 0.14, 0);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.06, 0.36), gold);
    blade.position.set(s * 0.38, 0, 0);
    flap.add(blade);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.05), redMat);
    edge.position.set(s * 0.38, 0.02, 0.18);
    flap.add(edge);
    flap.userData.restRotX = -0.16;
    flap.userData.restRotY = 0;
    flap.userData.restRotZ = s * 0.2;
    flap.userData.restScale = 1;
    flap.userData.bankGain = s * 0.5;
    flap.userData.flapFlutter = 0.2;
    flap.userData.phase = s * 1.6;
    host.add(flap);
    tailFins.push(flap);
  }

  // spear tip on the final segment (rides the tip of the coil)
  const tip = segs[segs.length - 1];
  const spear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, seg(4)), gold);
  spear.rotation.x = Math.PI / 2;   // point +z (back)
  spear.position.set(0, 0, segLen * 0.5 + 0.2);
  tip.add(spear);

  return { group: root, segs, tailFins, accentMats };
}
registerTail('segmentedAeroTail', buildSegmentedAeroTail);

// ═══════════════════════════════════════════════════════════════════════════════
// SVJ MECHA-DRAGON Mk II — a NEW selectable dragon: the current SVJ body with a
// brand-new WING and TAIL built to the player's detailed hard-surface spec. Axis:
// head/forward = −Z, tail/rear = +Z, right = +X, up = +Y (matches the engine).
// ═══════════════════════════════════════════════════════════════════════════════

// ── WINGS: 'svjJetWing' — layered SVJ jet-blade wing (player spec, 7 modules) ─────
// A clean swept-back supercar/jet aero blade (NOT a membrane/fan): yellow outer
// silhouette, black recessed vent panel + hex grille inside, 3 red chevron taillights
// near the trailing edge, 4 small overlapping trailing flaps, a sharp wingtip endplate
// + one secondary top blade. Sweeps back toward +Z. Honors the FROZEN rig: the hinge +
// inner blade ride the pivot (flap); the outer blade + endplate ride the wingTip
// (lagged fold) → "shoulder rotates first, outer blade follows with delay".
function buildSvjJetWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const gi = Math.min(giM ?? 1, 1.3);
  const D2R = Math.PI / 180;

  const yellow = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true, side: THREE.DoubleSide,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  const black = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.45, metalness: 0.55,
  });
  const grey = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x141418, flatShading: true, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6,
  });
  const redCol = def.apexSeam ?? 0xff3b2f;
  // Wing chevrons stay deliberately dimmer than the rear thruster cores so the twin
  // thrusters read as the brightest red-orange elements from the chase cam. DoubleSide so
  // the LEFT wing (a scale.x=-1 mirror clone of the right) never renders inside-out.
  const red = new THREE.MeshStandardMaterial({ color: redCol, emissive: redCol, emissiveIntensity: 1.8 * gi, roughness: 0.3, side: THREE.DoubleSide });
  red.userData.baseEmissive = redCol; red.userData.baseIntensity = 1.8 * gi;
  spineMats.push(red);

  const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
  const mul = (a, s) => ({ x: a.x * s, y: a.y * s, z: a.z * s });
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
  const norm = (a) => { const m = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / m, y: a.y / m, z: a.z / m }; };
  const arr = (p) => [p.x, p.y, p.z];
  const offN = (p, d) => ({ x: p.x, y: p.y + d, z: p.z });   // surface offset ≈ +Y (layer separation)

  const L = 4.35 * ws;
  const sweep = 24 * D2R, dih = 6 * D2R;
  const yOff = 0.020, bOff = 0.008, rOff = 0.016;

  function buildSide(side) {
    const pivot = new THREE.Group();
    const wr = attach.wingRoot(side);
    pivot.position.set(wr.x, wr.y, wr.z);

    const spanDir = norm({ x: side * Math.cos(sweep) * Math.cos(dih), y: Math.sin(dih), z: Math.sin(sweep) * Math.cos(dih) });
    const fwd = { x: 0, y: 0, z: -1 }, rear = { x: 0, y: 0, z: 1 };
    // Eternal/Radiant (3-segment) span REDISTRIBUTION: shorten the total wingspan ~20%
    // but NOT evenly — keep the root + middle mass strong and shorten the OUTER third the
    // most, so the wing reads broad/segmented/god-tier instead of a long straight rod.
    // Per-segment length scales root 0.90 · mid 0.82 · outer 0.68 (old joints 0.36/0.73)
    // remap into new joints 0.324/0.627/0.811. Plain aurumToro (no wingParts) is untouched.
    const remap3 = model.wingParts === 3;
    const stationT = (t) => !remap3 ? t
      : t <= 0.36 ? t * 0.90
      : t <= 0.73 ? 0.324 + (t - 0.36) * 0.819
      :             0.627 + (t - 0.73) * 0.681;
    const stationPoint = (t) => mul(spanDir, L * stationT(t));
    const xsec = (t, chord) => { const c = stationPoint(t); return { c, leading: add(c, mul(fwd, chord * 0.38)), trailing: add(c, mul(rear, chord * 0.62)) }; };
    // Origin-aware builders: each mesh lives in its OWN segment group (inner=pivot,
    // mid=wingMid, tip=wingTip) expressed relative to that group's origin `o`, so a
    // child rotation pivots cleanly at the joint instead of around the mesh centre.
    const O = (p, o) => ({ x: p.x - o.x, y: p.y - o.y, z: p.z - o.z });
    const quadG = (grp, o, a, b, c, d, mat, off) => grp.add(flatTriMesh([
      [arr(offN(O(a, o), off)), arr(offN(O(b, o), off)), arr(offN(O(c, o), off))],
      [arr(offN(O(a, o), off)), arr(offN(O(c, o), off)), arr(offN(O(d, o), off))],
    ], mat));
    const panelG = (grp, o, sLo, sHi, mat) => {
      const bl = (s) => lerp(s.leading, s.c, 0.18), tr = (s) => lerp(s.trailing, s.c, 0.18);
      const oo = bOff + yOff;
      grp.add(flatTriMesh([
        [arr(offN(O(bl(sLo), o), oo)), arr(offN(O(bl(sHi), o), oo)), arr(offN(O(tr(sHi), o), oo))],
        [arr(offN(O(bl(sLo), o), oo)), arr(offN(O(tr(sHi), o), oo)), arr(offN(O(tr(sLo), o), oo))],
      ], mat));
    };
    const chevronG = (grp, o, t, chord) => {
      const s = xsec(t, chord);
      const ctr = lerp(s.c, s.trailing, 0.48);
      for (const [dx, dz, ang, ln] of [[0, 0, -28, 0.30], [side * 0.08, 0.06, 22, 0.26]]) {
        const bar = chevronLight({ len: ln, w: 0.032, mat: red });
        const p = O({ x: ctr.x + dx, y: ctr.y + rOff + yOff, z: ctr.z + dz }, o);
        bar.position.set(p.x, p.y, p.z); bar.rotation.y = side * ang * D2R;
        grp.add(bar);
      }
    };
    const flapG = (grp, o, t0) => {
      const t1 = Math.min(t0 + 0.14, 0.98);
      const cAt = (t) => 1.08 + (0.26 - 1.08) * t;
      const s0 = xsec(t0, cAt(t0)), s1 = xsec(t1, cAt(t1));
      const iA = add(s0.trailing, { x: 0, y: -0.025, z: 0.02 }), iB = add(s1.trailing, { x: 0, y: -0.025, z: 0.02 });
      const oA = add(iA, { x: 0, y: -0.015, z: 0.22 }), oB = add(iB, { x: 0, y: -0.015, z: 0.17 });
      grp.add(flatTriMesh([[arr(O(iA, o)), arr(O(iB, o)), arr(O(oB, o))], [arr(O(iA, o)), arr(O(oB, o)), arr(O(oA, o))]], yellow));
      const g = (p) => ({ x: p.x, y: p.y - 0.02, z: p.z });
      grp.add(flatTriMesh([[arr(O(g(iA), o)), arr(O(g(iB), o)), arr(O(g(oB), o))], [arr(O(g(iA), o)), arr(O(g(oB), o)), arr(O(g(oA), o))]], black));
    };
    // hinge cover at a child group's local origin (the joint): a yellow overlap plate
    // that reaches back over the seam (so the small anti-clip gap never shows mid-flap).
    const hingeCover = (grp, len) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, len), yellow);
      plate.position.set(side * 0.03, yOff + 0.03, -0.06); grp.add(plate);
    };

    // station breaks — full wing chords root 1.08 → 0.72 → 0.42 → tip 0.26.
    const S0 = xsec(0.00, 1.08), Sa = xsec(0.20, 0.88), S1 = xsec(0.36, 0.72);
    const Sb = xsec(0.55, 0.56), S2 = xsec(0.73, 0.42), S3 = xsec(1.00, 0.26);
    const ZERO = { x: 0, y: 0, z: 0 };
    const parts = model.wingParts ?? 3;   // per-form wing segment count: 1 / 2 / 3

    // shoulder hinge (all forms)
    const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.40, 0.50), grey);
    hinge.position.set(side * 0.06, 0, 0.02); hinge.rotation.z = side * 0.18; pivot.add(hinge);

    if (parts >= 3) {
      // ══ 3-SEGMENT wing (Radiant / Eternal): pivot → wingMid → wingTip ══════════════
      const midO = stationPoint(0.36), tipO = stationPoint(0.73);
      const wingMid = new THREE.Group();
      wingMid.position.set(midO.x, midO.y + 0.025, midO.z);
      const wingTip = new THREE.Group();
      wingTip.position.set(tipO.x - midO.x, (tipO.y - midO.y) + 0.018, tipO.z - midO.z);
      wingMid.add(wingTip); pivot.add(wingMid);
      // PART A — inner powered blade (pivot, 0–0.36)
      pivot.add(frameBar(arr(offN(S0.leading, yOff)), arr(offN(S1.leading, yOff)), [0.20, 0.17], yellow));
      quadG(pivot, ZERO, S0.leading, Sa.leading, Sa.trailing, S0.trailing, yellow, yOff);
      quadG(pivot, ZERO, Sa.leading, S1.leading, S1.trailing, Sa.trailing, yellow, yOff);
      panelG(pivot, ZERO, xsec(0.12, 0.74), xsec(0.32, 0.66), black);
      chevronG(pivot, ZERO, 0.26, 0.78);
      flapG(pivot, ZERO, 0.20);
      // PART B — mid / outer aero blade (wingMid, 0.36–0.73)
      hingeCover(wingMid, 0.22);
      wingMid.add(frameBar(arr(offN(O(S1.leading, midO), yOff)), arr(offN(O(S2.leading, midO), yOff)), [0.15, 0.12], yellow));
      quadG(wingMid, midO, S1.leading, Sb.leading, Sb.trailing, S1.trailing, yellow, yOff);
      quadG(wingMid, midO, Sb.leading, S2.leading, S2.trailing, Sb.trailing, yellow, yOff);
      panelG(wingMid, midO, xsec(0.40, 0.66), xsec(0.70, 0.46), black);
      {
        const hg = hexGrille({ w: 0.7, h: 0.42, mat: black, barMat: grey });
        const c = O(xsec(0.55, 0.56).c, midO); hg.position.set(c.x, c.y + bOff + yOff + 0.004, c.z); wingMid.add(hg);
      }
      chevronG(wingMid, midO, 0.48, 0.56);
      chevronG(wingMid, midO, 0.62, 0.48);
      flapG(wingMid, midO, 0.42);
      flapG(wingMid, midO, 0.58);
      {
        const T0 = xsec(0.40, 0.44), T1 = xsec(0.72, 0.22);
        const up = (p, dy, dz) => O({ x: p.x, y: p.y + dy, z: p.z + dz }, midO);
        wingMid.add(flatTriMesh([
          [arr(up(T0.leading, 0.16, -0.06)), arr(up(T1.leading, 0.16, -0.06)), arr(up(T1.trailing, 0.16, -0.02))],
          [arr(up(T0.leading, 0.16, -0.06)), arr(up(T1.trailing, 0.16, -0.02)), arr(up(T0.trailing, 0.16, -0.02))],
        ], yellow));
      }
      // PART C — tip / aero control surface (wingTip, 0.73–~0.96). The outer third is
      // SHORTER (0.96 vs the old 1.0 ≈ −15%) and swept BACKWARD (+z) so it reads as a sharp
      // finishing blade rather than a long straight rod; a wider hinge cover makes the joint
      // to the mid blade clearer. Keeps the black/red blade identity (chevron taillight).
      hingeCover(wingTip, 0.20);
      const swB = { x: 0, y: 0, z: 0.12 };              // rearward sweep of the outer edge
      const S3raw = xsec(1.00, 0.24);                   // span shortening is handled by stationT; sharper chord
      const S3t = { c: add(S3raw.c, swB), leading: add(S3raw.leading, swB), trailing: add(S3raw.trailing, swB) };
      quadG(wingTip, tipO, S2.leading, S3t.leading, S3t.trailing, S2.trailing, yellow, yOff);
      chevronG(wingTip, tipO, 0.84, 0.30);
      const tc = O(S3t.c, tipO);
      wingTip.add(flatTriMesh([
        [[tc.x, tc.y - 0.06, tc.z - 0.09], [tc.x + side * 0.44, tc.y + 0.02, tc.z + 0.05], [tc.x + side * 0.38, tc.y + 0.30, tc.z + 0.20]],
        [[tc.x, tc.y - 0.06, tc.z - 0.09], [tc.x + side * 0.38, tc.y + 0.30, tc.z + 0.20], [tc.x + side * 0.02, tc.y + 0.18, tc.z + 0.07]],
      ], yellow));
      const marker = new THREE.Object3D(); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);
      group.add(pivot);
      return { pivot, wingMid, wingTip, marker };
    }

    if (parts === 2) {
      // ══ 2-SEGMENT wing (Kindled): pivot (inner+mid merged, 0–0.62) → wingTip (0.62–1.0) ══
      const Sj = xsec(0.62, 0.50), tipO = stationPoint(0.62);
      const wingTip = new THREE.Group();
      wingTip.position.set(tipO.x, tipO.y + 0.02, tipO.z);
      pivot.add(wingTip);
      pivot.add(frameBar(arr(offN(S0.leading, yOff)), arr(offN(Sj.leading, yOff)), [0.18, 0.14], yellow));
      quadG(pivot, ZERO, S0.leading, S1.leading, S1.trailing, S0.trailing, yellow, yOff);
      quadG(pivot, ZERO, S1.leading, Sj.leading, Sj.trailing, S1.trailing, yellow, yOff);
      panelG(pivot, ZERO, xsec(0.16, 0.66), xsec(0.55, 0.54), black);
      chevronG(pivot, ZERO, 0.40, 0.62);
      flapG(pivot, ZERO, 0.30);
      hingeCover(wingTip, 0.18);
      quadG(wingTip, tipO, Sj.leading, S3.leading, S3.trailing, Sj.trailing, yellow, yOff);
      const tc = O(S3.c, tipO);
      wingTip.add(flatTriMesh([
        [[tc.x, tc.y - 0.05, tc.z - 0.07], [tc.x + side * 0.38, tc.y + 0.02, tc.z + 0.03], [tc.x + side * 0.32, tc.y + 0.24, tc.z + 0.15]],
        [[tc.x, tc.y - 0.05, tc.z - 0.07], [tc.x + side * 0.32, tc.y + 0.24, tc.z + 0.15], [tc.x + side * 0.02, tc.y + 0.15, tc.z + 0.05]],
      ], yellow));
      const marker = new THREE.Object3D(); marker.position.set(tc.x, tc.y, tc.z); wingTip.add(marker);
      group.add(pivot);
      return { pivot, wingMid: null, wingTip, marker };
    }

    // ══ 1-SEGMENT wing (Hatchling): a small simple paddle/mini-blade on pivot only ══════
    const Sm = xsec(0.50, 0.62), St = xsec(1.00, 0.34);
    pivot.add(frameBar(arr(offN(S0.leading, yOff)), arr(offN(St.leading, yOff)), [0.15, 0.11], yellow));
    quadG(pivot, ZERO, S0.leading, Sm.leading, Sm.trailing, S0.trailing, yellow, yOff);
    quadG(pivot, ZERO, Sm.leading, St.leading, St.trailing, Sm.trailing, yellow, yOff);
    panelG(pivot, ZERO, xsec(0.22, 0.50), xsec(0.72, 0.42), black);
    chevronG(pivot, ZERO, 0.55, 0.48);
    const tc1 = St.c;
    const marker = new THREE.Object3D(); marker.position.set(tc1.x, tc1.y, tc1.z); pivot.add(marker);
    group.add(pivot);
    return { pivot, wingMid: null, wingTip: null, marker };
  }

  // RIGHT wing is the authored master; the LEFT is an exact MIRROR CLONE of it (deep
  // clone under a scale.x = -1 wrapper) so the two wings can never differ. The animation
  // drives the right rig and the left simply COPIES the right's pose (the mirror wrapper
  // flips it), guaranteeing a perfectly symmetric beat.
  const R = buildSide(1);
  R.pivot.userData.wingRole = 'pivot';
  if (R.wingMid) R.wingMid.userData.wingRole = 'mid';
  if (R.wingTip) R.wingTip.userData.wingRole = 'tip';
  if (R.marker) R.marker.userData.wingRole = 'marker';
  const lpivot = R.pivot.clone(true);                 // userData (roles) is deep-copied
  const lmirror = new THREE.Group(); lmirror.scale.x = -1;
  lmirror.add(lpivot); group.add(lmirror);
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };
  const Lf = { pivot: lpivot, wingMid: byRole(lpivot, 'mid'), wingTip: byRole(lpivot, 'tip'), marker: byRole(lpivot, 'marker') };
  return {
    group,
    parts: {
      wingPivotL: Lf.pivot, wingPivotR: R.pivot,
      wingMidL: Lf.wingMid, wingMidR: R.wingMid,
      wingTipL: Lf.wingTip, wingTipR: R.wingTip,
      tipMarkerL: Lf.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null, wingRigL: null, wingRigR: null,
    },
    wingMat: yellow, spineMats,
  };
}
registerWings('svjJetWing', buildSvjJetWing);

// ── TAIL: 'svjAeroTridentTail' — segmented armored tail + aero-trident tip (spec) ─
// A 9-segment armored tail (thick base, tapering late; coils via `segs`) ending in an
// AERO-TRIDENT tip: a central dark spear (longest/narrowest) flanked by two shorter,
// broader swept Lamborghini-style side stabilizer fins (yellow armor + black inset +
// red taillight slash), flared outward (±X) and back (+Z). A hypercar diffuser/aero
// stabilizer system as a dragon tail tip — not a fantasy trident / shark fin / fork.
function buildSvjAeroTridentTail(def, model, mats, anchor) {
  const { bodyMat } = mats;
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const gold = bodyMat.clone(); gold.flatShading = true;
  const carbon = new THREE.MeshStandardMaterial({ color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.42, metalness: 0.6 });
  const redCol = def.apexSeam ?? 0xff3b2f;
  const red = new THREE.MeshStandardMaterial({ color: redCol, emissive: redCol, emissiveIntensity: 1.7, roughness: 0.3 });
  red.userData.baseEmissive = redCol; red.userData.baseIntensity = 1.7;
  const accentMats = [red];
  const segs = [], tailFins = [];
  const D2R = Math.PI / 180;

  // [length, width, height] per segment — width→radius. The first half is thickened
  // (segs 0–4 ×≈1.22→1.06) so the proximal tail reads MUSCULAR/armored near the chase
  // cam, tapering late into the spear; segs 5–8 keep the original taper.
  const SEG = [[0.58, 0.79, 0.54], [0.60, 0.71, 0.47], [0.62, 0.62, 0.41], [0.60, 0.53, 0.35],
    [0.58, 0.44, 0.30], [0.55, 0.34, 0.24], [0.50, 0.28, 0.20], [0.44, 0.22, 0.16], [0.36, 0.17, 0.12]];
  const n = Math.min(model.tailSegments ?? 9, SEG.length);
  let z = 0.1, last = null;
  for (let i = 0; i < n; i++) {
    const [len, w] = SEG[i];
    const r = w * 0.5, rTop = SEG[Math.min(i + 1, n - 1)][1] * 0.5;
    const ss = spineSegment({ rTop, rBot: r, len, coreMat: carbon, armorMat: gold });
    ss.group.position.set(0, 0, z);
    root.add(ss.group); segs.push(ss.group); last = ss.group;
    if (i >= 2 && i <= 5) { const slit = chevronLight({ len: r * 1.2, w: 0.04, mat: red }); slit.position.set(0, r * 0.5, len * 0.3); ss.group.add(slit); }
    if (i >= 6) for (const s of [-1, 1]) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), gold); fin.position.set(s * (r + 0.1), r * 0.3, 0); fin.rotation.z = s * 0.3; ss.group.add(fin); }
    // yellow dorsal armor cap on each segment (the spine "vertebrae" rhythm continued
    // down the tail; rides the seg so it coils).
    const scap = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.08, r * 0.95), 0.05, len * 0.52), gold);
    scap.position.set(0, r + 0.02, 0); scap.rotation.x = -0.1;
    ss.group.add(scap);
    z += len * 0.82;
  }

  // tapered blade (a 6-face wedge box extending +Z)
  const blade = (length, baseW, tipW, height, mat) => {
    const a = baseW * 0.5, b = tipW * 0.5, h = height * 0.5;
    const v = [[-a, -h, 0], [a, -h, 0], [a, h, 0], [-a, h, 0], [-b, -h * 0.3, length], [b, -h * 0.3, length], [b, h * 0.3, length], [-b, h * 0.3, length]];
    const idx = [[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]];
    return flatTriMesh(idx.map((t) => t.map((k) => v[k])), mat);
  };

  // ── aero-trident tip (rigid, rides the last segment's coil) ──
  const tip = new THREE.Group();
  tip.position.set(0, 0, SEG[n - 1][0] * 0.5);
  last.add(tip);
  // central dark spear (long, sharp point) + thin gold cap edge — the spear is the
  // ALWAYS-present tip; the side prongs grow with the form's tailTip level:
  // 0 simple spear (Hatchling) · 1 fork (bare prongs) · 2 light trident (+inset) ·
  // 3 full aero-trident (+black inset + red slash) (Eternal).
  const ttip = model.tailTip ?? 3;
  const spear = blade(0.58, 0.17, 0.035, 0.12, carbon); spear.position.set(0, 0, 0.18); tip.add(spear);
  const cap = blade(0.56, 0.11, 0.028, 0.08, gold); cap.position.set(0, 0.01, 0.2); tip.add(cap);
  if (ttip >= 1) for (const sign of [-1, 1]) {
    const bg = new THREE.Group();
    bg.position.set(sign * 0.12, 0.02, 0.10);
    const bsz = ttip >= 3 ? 1 : ttip === 2 ? 0.85 : 0.7;
    const b = blade(0.48 * bsz, 0.14 * bsz, 0.035, 0.26 * bsz, gold);
    b.rotation.set(-4 * D2R, sign * 32 * D2R, sign * -8 * D2R);   // up-tilt, flare out, slight bank
    bg.add(b);
    if (ttip >= 2) { const inset = blade(0.30 * bsz, 0.08, 0.022, 0.07, carbon); inset.position.set(sign * 0.005, 0.02, 0.12); inset.rotation.copy(b.rotation); bg.add(inset); }
    if (ttip >= 3) { const slash = chevronLight({ len: 0.26, w: 0.025, mat: red }); slash.position.set(sign * 0.012, 0.04, 0.13); slash.rotation.copy(b.rotation); bg.add(slash); }
    tip.add(bg);
  }

  return { group: root, segs, tailFins, accentMats };
}
registerTail('svjAeroTridentTail', buildSvjAeroTridentTail);
