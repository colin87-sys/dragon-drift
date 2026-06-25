import * as THREE from 'three';
import { registerTorso, registerWings, registerHead } from './dragonRecipe.js';
import { makeGlowTexture } from './util.js';
import { hexRgb } from './dragonParts.js';
import { applyFresnelRim } from './surface.js';
import { seg } from './modelDetail.js';
import { buildAnatomicalWing, mirrorWing } from './dragonWingAnatomy.js';

// ===========================================================================
// THUNDERCOIL AMPITHERE — a LEGLESS storm-serpent (brand-new part FAMILY).
// ===========================================================================
// An amphithere: a long coiling winged serpent, NOT a western dragon. Like the
// Phoenix/Flame-Monarch technique it ships its OWN builders, sharing nothing with
// the kit. The body is the engine's segmented `bodySegs` chain — a lead-first
// travelling wave the rig undulates like a ribbon (and bends into banks with a
// trailing tail), which IS the "custom animation for a legless creature".
//
//   ampithereTorso  long serpent: thick chest/wing-root → thin forked tail. A
//                   backward lightning CREST (skull→neck) fading to low dorsal
//                   nodes, a forked conductor tail tip, storm-grey/silver hide,
//                   electric-blue accents. Returns bodySegs (the rig slithers it).
//   ampithereWing   large, SHARP triangular bat membrane, 4 struts, 3-segment
//                   articulated (wingParts), mounted on the chest (front third).
//   ampithereHead   broad boxy WEDGE, flat crown, strong jaw, electric mouth.
//   (tail = 'none' — the forked tip is the last body segment, so it undulates.)
//
// Electric accents register in spineMats → flare toward def.surgeHi (electric
// white-blue) on Surge + brighten on boost (def.boostSpine). The storm-current /
// wing-strut arcs / shock-ring (def.stormFx) are driven in dragon.js.

const rgbArr = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const lerp = (a, b, t) => a + (b - a) * t;

function tagFlare(mat, emissive, intensity, into, stormZ) {
  mat.userData.baseEmissive = emissive;
  mat.userData.baseIntensity = intensity;
  if (stormZ != null) mat.userData.stormZ = stormZ;   // 0 = head → 1 = tail (boost current)
  if (into) into.push(mat);
  return mat;
}

function bar(a, b, th, mat) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.BoxGeometry(th, th, len), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b);
  return m;
}

// A unit sphere with a baked top→belly vertex gradient (storm back / silver belly).
function vcUnitSphere(ws, hs, top, belly) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  const p = g.attributes.position;
  const col = [];
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + 1) * 0.5;            // 0 = belly, 1 = back
    const w = t * t * (3 - 2 * t);
    col.push(lerp(belly[0], top[0], w), lerp(belly[1], top[1], w), lerp(belly[2], top[2], w));
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// A short backward-raked electric spike (crest node), flat blade in the YZ plane.
function spikeGeo(h, w) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, -w, 0, 0, w, 0, h, w * 1.6,   // base front, base back, raked-back apex
  ], 3));
  g.setIndex([0, 1, 2]);
  g.computeVertexNormals();
  return g;
}

// ── TORSO — ampithereTorso ───────────────────────────────────────────────────
function buildAmpithereTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];
  const stormCurrentMats = [];   // crest/node/fork mats, z-tagged for the boost current

  const F = model.formLevel ?? 0;
  const glow = model.spineGlow ?? (F / 3);
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);
  const cBody = def.body, cBelly = def.belly ?? 0xc8d2e0;
  const cElec = def.coreGlow ?? def.wingEmissive ?? 0x6ad0ff;

  // Storm-grey hide, silver belly (vertex gradient), electric-blue fresnel rim.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: def.bodyRoughness ?? 0.5, metalness: def.bodyMetalness ?? 0.28,
    emissive: cBody, emissiveIntensity: 0.06, side: THREE.DoubleSide,
  });
  applyFresnelRim(bodyMat, def.apexSeam || cElec);
  const unitBody = vcUnitSphere(seg(9), seg(7), rgbArr(cBody), rgbArr(cBelly));

  const crestInt = (0.8 + glow * 1.0) * giM;
  const crestMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cElec, emissive: cElec, emissiveIntensity: crestInt, roughness: 0.4, metalness: 0.2,
    side: THREE.DoubleSide,
  }), cElec, crestInt, spineMats);
  const forkInt = (1.0 + glow * 1.1) * giM;
  const forkMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cElec, emissive: cElec, emissiveIntensity: forkInt, roughness: 0.35, metalness: 0.15,
  }), cElec, forkInt, spineMats, 1.0);

  // Serpent cross-sections: a chest BULGE near the front third, then a smooth taper
  // to a thin tail (procedural so segmentCount can grow per form).
  const N = Math.max(7, model.segmentCount ?? 13);
  const bodyScale = model.bodyScale ?? 1;
  const leadR = 0.5 * bodyScale;
  const chestT = 0.14;
  const radiusAt = (t) => {
    if (t <= chestT) return leadR * lerp(0.66, 1.0, t / chestT);          // neck → chest bulge
    const k = (t - chestT) / (1 - chestT);
    return leadR * lerp(1.0, 0.14, Math.pow(k, 0.9));                     // chest → fine tail
  };
  // Gentle vertical S so it isn't a straight rope (the rig adds the live slither).
  const yAt = (t) => 0.55 + Math.sin(t * Math.PI) * 0.07 - t * 0.12;
  const OVAL = [1.08, 0.92];   // a touch wider than tall (reads low + powerful, §0.5)

  const radii = [], zs = [];
  for (let i = 0; i < N; i++) radii.push(radiusAt(i / (N - 1)));
  let z = 0;
  for (let i = 0; i < N; i++) { zs.push(z); const rN = radii[i + 1] ?? radii[i] * 0.85; z += (radii[i] + rN) * 0.5 * 0.9; }
  const zMid = zs[Math.floor(N / 2)];
  const Z = (i) => zs[i] - zMid;

  const bodySegs = [];
  const anchors = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const r = radii[i];
    const segY = yAt(t);
    const zz = Z(i);
    const sg = new THREE.Group();
    sg.position.set(0, segY, zz);
    sg.userData.baseY = segY;
    const body = new THREE.Mesh(unitBody, bodyMat);
    body.scale.set(r * OVAL[0], r * OVAL[1], r * 1.14);
    sg.add(body);

    // CREST → DORSAL NODES: tall backward spikes on the first quarter (skull→neck),
    // shrinking into low dorsal nodes down the body. Electric; z-tagged for the
    // head→tail boost current.
    if (i >= 1 && i < N - 1) {
      const crestPhase = Math.max(0, 1 - t / 0.32);          // 1 at neck → 0 by ~1/3 down
      const h = lerp(0.10, 0.34, crestPhase) * (0.7 + 0.3 * glow);
      const sp = new THREE.Mesh(spikeGeo(h, r * 0.5), crestMat);
      sp.position.set(0, segY + r * OVAL[1] * 0.85, zz);
      sp.userData.stormZ = t;                                 // (mat is shared; node carries z)
      sg.add(sp);
    }
    group.add(sg);
    bodySegs.push(sg);
    anchors.push({ y: segY, z: zz, r });
  }

  // FORKED CONDUCTOR TAIL TIP — two splayed electric prongs on the last segment, so
  // it rides the undulation like a living lightning rod.
  const tail = bodySegs[N - 1];
  const tR = radii[N - 1];
  for (const s of [-1, 1]) {
    const prong = new THREE.Mesh(new THREE.ConeGeometry(tR * 0.5, tR * 4.2, seg(5)), forkMat);
    prong.position.set(s * tR * 1.2, 0, tR * 2.0);
    prong.rotation.x = Math.PI / 2;       // point along +z (aft)
    prong.rotation.z = s * 0.34;          // splay into a fork
    tail.add(prong);
  }

  // Electric heart-core at the chest (pulses on boost / blazes on Surge).
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.4 + glow * 0.5;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cElec)), transparent: true, opacity: 0.18 + lvl * 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(leadR * 3.6);
    coreGlow.position.set(0, anchors[1].y, anchors[1].z);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  const sampleR = (zq) => {
    // nearest-segment radius for the flank contract
    let best = anchors[0];
    for (const a of anchors) if (Math.abs(a.z - zq) < Math.abs(best.z - zq)) best = a;
    return best.r;
  };

  // ── STORM FX (driven in dragon.js, gated by def.stormFx — boost/Surge only) ──
  // A current BEAD that runs the crest head→tail on boost, ARCS that crackle between
  // the wing roots + the tail fork on Surge, and a SHOCK RING that snaps out behind
  // the serpent on the Surge ignition. Built dark/invisible; the rig drives opacity.
  const elecRgb = hexRgb(cElec);
  const bead = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(elecRgb), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  bead.scale.setScalar(0.5); bead.layers.set(1); bead.visible = false;
  bead.userData.path = anchors.map((a) => new THREE.Vector3(0, a.y + a.r * 0.9, a.z));
  group.add(bead);

  const forkPos = new THREE.Vector3(0, anchors[N - 1].y, Z(N - 1) + radii[N - 1] * 2.2);
  const wRoot = (s) => new THREE.Vector3(0.28 * s * leadR * 2, anchors[1].y + radii[1] * 0.3, anchors[1].z);
  const crestPos = new THREE.Vector3(0, anchors[1].y + radii[1], Z(1));
  const arcPairs = [[wRoot(-1), forkPos], [wRoot(1), forkPos], [crestPos, wRoot(-1)], [crestPos, wRoot(1)]];
  const arcMat = new THREE.LineBasicMaterial({
    color: cElec, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const stormArcs = [];
  for (const [a, b] of arcPairs) {
    const pts = 7;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(pts * 3).fill(0), 3));
    const line = new THREE.Line(geo, arcMat);
    line.layers.set(1); line.visible = false;
    line.userData = { a, b };
    group.add(line);
    stormArcs.push(line);
  }

  const ringMat = new THREE.MeshBasicMaterial({
    color: cElec, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  });
  const shockRing = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.0, seg(24)), ringMat);
  shockRing.position.set(0, anchors[Math.floor(N / 2)].y, Z(N - 1) + radii[N - 1] * 3);
  shockRing.visible = false;
  group.add(shockRing);

  const storm = { bead, arcs: stormArcs, ring: shockRing };

  const attach = {
    headBase: { x: 0, y: anchors[0].y, z: Z(0) - radii[0] * 1.1 },
    headMount: bodySegs[0],                       // the head rides the lead segment
    wingRoot: (side) => ({ x: 0.28 * side * leadR * 2, y: anchors[1].y + radii[1] * 0.3, z: anchors[1].z }),
    tailAnchor: { y: anchors[N - 1].y, z: Z(N - 1) },
    keelTopAt: (zq) => yAt(0.5) + sampleR(zq) * 0.9,
    halfWidthAt: (zq) => sampleR(zq),
    bodyMidY: 0.52,
    tailShift: 0,
  };
  return { group, attach, mats: { bodyMat }, coreGlow, spineMats, bodySegs, stormCurrentMats, storm };
}
registerTorso('ampithereTorso', buildAmpithereTorso);

// ── WINGS — ampithereWing ──────────────────────────────────────
// Anatomically-built bat wing (dragonWingAnatomy.js) in a SHARP, geometric storm
// style: a short arm + medial wrist, then 4 long curved fingers fanning to a CRISP,
// shallow-scallop edge (sharper than the Monarch). Electric joints + struts. The
// left is a scale.x=-1 mirror clone of the right master.
function buildAmpithereWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const F = model.formLevel ?? 0;
  const cElec = def.wingEmissive ?? def.coreGlow ?? 0x6ad0ff;

  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? 0x1a2230, roughness: 0.55, metalness: 0.18, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.9,
    emissive: def.wingMembraneEmissive ?? cElec, emissiveIntensity: model.wingPanelGlow ?? 0.1,
  });
  const strutInt = 0.6 + giM * 0.4 + F * 0.12;
  const strutMat = tagFlare(new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x2a3340, emissive: cElec, emissiveIntensity: strutInt,
    roughness: 0.35, metalness: 0.5,
  }), cElec, strutInt, spineMats);
  const jointInt = (0.9 + F * 0.3) * Math.min(model.glowIntensity ?? 1, 1.3);
  const jointMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cElec, emissive: cElec, emissiveIntensity: jointInt, roughness: 0.3, metalness: 0.2,
  }), cElec, jointInt, spineMats);

  // SHARP storm wing: short arm, medial wrist, 4 long curved fingers, SHALLOW crisp
  // scallops (geometric), the outer finger framing a hard leading edge.
  // SHORT humerus, medial wrist (~25% span). 4 fingers; the LEADING finger is the long
  // sharp convex frame (most curved) and each finger straightens toward the trailing
  // edge, the innermost ≈ straight. Sharper/geometric: shallow scallops, pointier claws.
  const anatomy = {
    rootFront: [0, 0.36], rootBack: [0, -0.64],
    elbow: [0.6, 0.40], wrist: [1.45, 0.56],
    fingers: [
      { tip: [5.9, 0.85], bow: 0.70 },   // long sharp leading frame — most curved
      { tip: [5.1, -0.35], bow: 0.38 },
      { tip: [3.95, -1.30], bow: 0.16 },
      { tip: [2.6, -1.85], bow: 0.04 },  // innermost/trailing — straight
    ],
    scallop: 0.26, strutR: 0.04, claw: 0.2,
  };
  const Rp = buildAnatomicalWing({ ws, membraneMat: wingMat, strutMat, jointMat, anatomy }).pivot;
  Rp.position.set(...Object.values(attach.wingRoot(1)));
  group.add(Rp);
  const L = mirrorWing(Rp);
  L.pivot.position.set(...Object.values(attach.wingRoot(1)));
  group.add(L.wrap);
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };

  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: Rp,
      wingMidL: L.wingMid, wingMidR: byRole(Rp, 'mid'),
      wingTipL: L.wingTip, wingTipR: byRole(Rp, 'tip'),
      tipMarkerL: L.marker, tipMarkerR: byRole(Rp, 'marker'),
      wingPivot2L: null, wingPivot2R: null,
    },
    wingMat,
    spineMats,
  };
}
registerWings('ampithereWing', buildAmpithereWing);

// ── HEAD — ampithereHead ─────────────────────────────────────────────────────
// A broad, boxy WEDGE skull: flat crown, strong jaw, electric mouth seam, and the
// first backward crest spikes behind the skull. Rides the lead body segment.
function buildAmpithereHead(def, model, mats) {
  const group = new THREE.Group();
  const spineMats = [];
  const F = model.formLevel ?? 0;
  const cElec = def.coreGlow ?? def.wingEmissive ?? 0x6ad0ff;

  const skullMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.5, metalness: 0.3, flatShading: true,
  });
  const mouthInt = 0.9 + 0.4 * F;
  const mouthMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cElec, emissive: cElec, emissiveIntensity: mouthInt, roughness: 0.4,
  }), cElec, mouthInt, spineMats, 0.0);

  // Broad flat-topped cranium + a strong boxy lower jaw, muzzle squared off forward.
  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.20, 0.46), skullMat);
  cranium.position.set(0, 0.05, -0.34);
  group.add(cranium);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.26), skullMat);
  snout.position.set(0, 0.0, -0.66);
  group.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.5), skullMat);
  jaw.position.set(0, -0.12, -0.46);
  group.add(jaw);
  // Electric mouth seam (between cranium and jaw).
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.42), mouthMat);
  mouth.position.set(0, -0.06, -0.5);
  group.add(mouth);

  // Eyes — small electric pips on the brow.
  const eyeMat = mats.eyeMat || new THREE.MeshStandardMaterial({ color: 0x081018, emissive: def.eye, emissiveIntensity: 2.2 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), eyeMat);
    eye.position.set(s * 0.17, 0.07, -0.52);
    group.add(eye);
  }

  // The first CREST spikes behind the skull (continue onto the neck in the torso).
  const crestMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cElec, emissive: cElec, emissiveIntensity: 0.7 + 0.3 * F, roughness: 0.4, metalness: 0.2,
    side: THREE.DoubleSide,
  }), cElec, 0.7 + 0.3 * F, spineMats, 0.0);
  for (let i = 0; i < 2; i++) {
    const h = 0.2 - i * 0.04;
    const g = new THREE.BufferGeometry();
    const z = -0.16 + i * 0.12;
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0.14, z - 0.05, 0, 0.14, z + 0.05, 0, 0.14 + h, z + 0.1,
    ], 3));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    group.add(new THREE.Mesh(g, crestMat));
  }

  return { group, spineMats };
}
registerHead('ampithereHead', buildAmpithereHead);
