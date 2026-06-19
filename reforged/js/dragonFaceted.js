import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { registerSurfaceLayer } from './dragonSurfaceLayers.js';
import { buildTorso } from './dragonTorso.js';
import { seg } from './modelDetail.js';
import {
  wedgePanel, hexPrism, spineSegment, ventPlateRow, hexGrille,
  chevronLight, diffuserArray, thrusterPod, mechaLeg, socket,
} from './mechaKit.js';

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
// SVJ MECHA-DRAGON v2 — the rebuilt Aurum Toro, composed from mechaKit modules.
// Three dominant chase-cam shapes drive every choice: (1) huge angular blade WINGS,
// (2) a bulky rear-engine TORSO with twin red thrusters, (3) a long segmented
// armored TAIL with big stabilizer blades + a spear tip. Coexists with the v1
// faceted builders above (kept registered for one-string rollback).
//
// REAR-VIEW PRIORITY: the camera chases from behind, so red taillight chevrons,
// vent slashes, hex grilles and tail armor + thrusters (all rear-facing) get real
// attention — they fill the screen — while forward/under greeble stays cheap.
// Built BIG on purpose (judge the silhouette first; shrink via model.scale later).
// ═══════════════════════════════════════════════════════════════════════════════

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
  fairing: { r: 0.4, scale: [0.94, 0.84, 1.12], pos: [0.58, 0.64, -0.48] },
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
registerSurfaceLayer('twinThrusters', ({ def, attach }) => {
  const meshes = [], flareMats = [];
  const housingMat = new THREE.MeshStandardMaterial({
    color: def.belly ?? def.horn ?? 0x0e0e12, flatShading: true, roughness: 0.4, metalness: 0.62,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0xf2c20e, flatShading: true,
    roughness: def.bodyRoughness ?? 0.24, metalness: def.bodyMetalness ?? 0.55,
  });
  const coreCol = def.boostTrail ?? def.coreGlow ?? def.apexSeam ?? 0xff3b2f;
  const coreMat = new THREE.MeshStandardMaterial({
    color: coreCol, emissive: coreCol, emissiveIntensity: 2.0, roughness: 0.3,
  });
  coreMat.userData.baseEmissive = coreCol; coreMat.userData.baseIntensity = 2.0;
  flareMats.push(coreMat);
  const anchor = attach.tailAnchor ?? { y: 0.3, z: 0.8 };
  const my = (attach.bodyMidY ?? 0.2) + 0.08;
  const z = anchor.z - 0.05;
  for (const s of [-1, 1]) {
    const { group } = thrusterPod({ rOuter: 0.2, rCore: 0.12, depth: 0.22, housingMat, frameMat, coreMat });
    group.position.set(s * 0.36, my, z);
    meshes.push(group);
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
