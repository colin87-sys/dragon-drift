import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { registerTorso, registerWings, registerTail } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { sweepProfileSmooth, skinnedTube } from './dragonSweep.js';
import { applyWingGradient } from './dragonParts.js';
import {
  composeSurface, buildSurfacePatches, fresnelRimPatch, membraneSSSPatch,
} from './dragonSurfaceShader.js';

// ═══════════════════════════════════════════════════════════════════════════
// FURY HULL — a clean-sheet "one continuous welded skinned hull" Night Fury.
//
// This is a FRESH build (not the obsidian unifiedHull, not obsidian2 organism,
// not the toothless nightFury hull — none of their geometry is reused). It shares
// ONLY the generic, tested plumbing the studio sanctions: the skinned-merge kernel
// (growSkinnedExtension/ensureSkinAttrs, re-implemented locally so this file owns
// no foreign profile), the skinnedTube sweep, the longitudinal-spline loft
// (sweepProfileSmooth), the seg() detail gate, the surface-shader kit, and the
// FROZEN rig contract.
//
// EVERY silhouette is a COMPLEX CURVED SPLINE, never a primitive strung together:
//   · the body cross-section (furySection) is a CLOSED centripetal Catmull-Rom
//     through 10 morphing control points, sampled DENSE so it is a smooth curve
//     even at HIGH detail (no octagon/10-gon facets);
//   · the dorsal/belly line is the Catmull-Rom of the station table (cy channel
//     bends the spine: arched back → down-swept tail);
//   · the wing leading + scalloped trailing edges are Catmull-Rom curves (a finger
//     to every scallop, concave webs between);
//   · the twin split tail-fins are Catmull-Rom outlines.
//
// Topology — ONE shared 11-bone skeleton, three skinned draw calls:
//   bones = [BODY, SH_L,EL_L,WR_L, SH_R,EL_R,WR_R, TAIL0,TAIL1,TAIL2,TAIL3]
//   · furyHull     opaque  = body+tail loft  ⊕ two fleshy arm tubes ⊕ dorsal nubs
//   · furyMembrane translucent = both wing membranes ⊕ both tail-fins ⊕ ear-frills
//   · furyStruts   opaque  = wing finger struts ⊕ tail-fin struts
// The wing membrane root is WELDED to the body flank (exact-copy of the hull's own
// flank verts + 100% BODY weight + shared normals) so it can never gap; the tail-fin
// root is welded to the rear loft (TAIL3). Tail bones are exposed as tailSegs for
// dragon.js's rotation-only skinned whip (model.tailWhip).
// ═══════════════════════════════════════════════════════════════════════════

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6, T0: 7, T1: 8, T2: 9, T3: 10 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

// ── skinned-merge kernel (local; identical attr-set contract) ────────────────
function ensureSkinAttrs(geo, bodyIndex = BONE.BODY) {
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.position.count;
  if (!geo.attributes.skinIndex) {
    const si = new Uint16Array(n * 4);
    for (let i = 0; i < n; i++) si[i * 4] = bodyIndex;
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  }
  if (!geo.attributes.skinWeight) {
    const sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) sw[i * 4] = 1;
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }
  for (const k of Object.keys(geo.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'skinIndex' && k !== 'skinWeight') geo.deleteAttribute(k);
  }
  return geo;
}
function growSkinnedExtension(base, extensions) {
  const parts = [ensureSkinAttrs(base)];
  for (const e of extensions) if (e) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('furyHull: growSkinnedExtension merge returned null (attribute mismatch)');
  return merged;
}
// Write an explicit per-vertex skin (si[4], sw[4]) onto a geometry from a fn(i)->{si,sw}.
function writeSkin(geo, skinAt) {
  const n = geo.attributes.position.count;
  const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const s = skinAt(i);
    si[i * 4] = s.si[0]; si[i * 4 + 1] = s.si[1] || 0; si[i * 4 + 2] = s.si[2] || 0; si[i * 4 + 3] = s.si[3] || 0;
    sw[i * 4] = s.sw[0]; sw[i * 4 + 1] = s.sw[1] || 0; sw[i * 4 + 2] = s.sw[2] || 0; sw[i * 4 + 3] = s.sw[3] || 0;
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  return geo;
}

// ════════════════════════ GEOMETRY RECIPE ══════════════════════════════════

// The longitudinal STATION table. Channels [z, halfWidth, topH, bellyH, cy(spineY)].
// cy bends the spine: a back that ARCHES up to the shoulder then sweeps DOWN through
// the long tail (the Night-Fury read). Knobs scale it without rewriting the table.
const FURY_BASE = [
  // z      w     top   bot   cy(spineY)
  [-2.95, 0.30, 0.24, 0.22, 0.42],   // neck base (meets the head)
  [-1.70, 0.52, 0.46, 0.40, 0.60],   // fore-shoulder — back arching up
  [-0.85, 0.66, 0.56, 0.50, 0.74],   // shoulder — broadest + dorsal apex
  [-0.05, 0.58, 0.48, 0.46, 0.66],   // thorax — deep chest
  [ 0.70, 0.42, 0.36, 0.34, 0.50],   // waist — clear pinch, belly dips
  [ 1.55, 0.34, 0.30, 0.26, 0.40],   // haunch / hip
  [ 2.35, 0.24, 0.22, 0.17, 0.30],   // tail root
  [ 3.40, 0.15, 0.15, 0.11, 0.12],   // tail mid — sweeping down
  [ 4.40, 0.085, 0.09, 0.06, -0.05], // tail aft
  [ 5.30, 0.03, 0.035, 0.025, -0.16],// tail tip
];

// Dense smooth cross-section: a CLOSED centripetal Catmull-Rom through 10 morphing
// control points, sampled to SECTION_SAMPLES points so the ring is a genuine curve
// (no facets) at HIGH. Knobs reshape it: bellyRound (fuller belly), backCrest
// (catlike dorsal ridge), flankFlatten (flatter cheeks). w/top/bot morph along z.
const SECTION_SAMPLES = 20;
function furySection(w, top, bot, k = {}) {
  const round = k.bellyRound ?? 1;
  const crest = k.backCrest ?? 1;
  const flat = k.flankFlatten ?? 0;
  const fw = 0.55 + flat * 0.30;     // flatten pushes mid-flank wider, upper-flank in
  const up = 0.78 - flat * 0.18;
  const ctrl = [
    [0,            top * 1.02 * crest],          // P0 back ridge (dorsal crest)
    [-w * up,      top * 0.78],                  // P1 upper-left flank
    [-w * 1.00,    top * 0.10],                  // P2 widest left flank
    [-w * 0.82,   -bot * 0.45],                  // P3 lower-left flank
    [-w * 0.42 * round, -bot * 0.95 * round],    // P4 left belly
    [0,           -bot * 1.04 * round],          // P5 belly keel
    [ w * 0.42 * round, -bot * 0.95 * round],    // P6 right belly
    [ w * 0.82,   -bot * 0.45],                  // P7 lower-right flank
    [ w * 1.00,    top * 0.10],                  // P8 widest right flank
    [ w * up,      top * 0.78],                  // P9 upper-right flank
  ];
  // fw nudges P1/P9 outward when flattening (cat cheeks) — applied after base build.
  ctrl[1][0] = -w * fw; ctrl[9][0] = w * fw;
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal');
  const m = Math.max(12, seg(SECTION_SAMPLES));
  const out = [];
  for (let i = 0; i < m; i++) { const p = curve.getPoint(i / m); out.push([p.x, p.y]); }
  return out;
}

// Build the body+tail loft PROFILE for sweepProfileSmooth, scaled by the model knobs.
function furyProfile(model) {
  const A = model.furySpineArch ?? 1;
  const D = model.furyTailDrop ?? 0;
  const L = model.furyTailLength ?? 1;
  const sk = { bellyRound: model.furyBellyRound, backCrest: model.furyBackCrest, flankFlatten: model.furyFlankFlatten };
  const stations = FURY_BASE.map(([z, w, top, bot, cy], i) => {
    const tail = z > 1.7;
    const zz = tail ? 1.7 + (z - 1.7) * L : z;       // lengthen only the tail boom
    const yy = cy * (cy > 0 ? A : 1) - (tail ? D * (z - 1.7) * 0.5 : 0);  // arch up / droop down
    return [zz, w, top, bot, yy, 0];
  });
  return {
    stations, zHold: 1.7, longSamples: 24,
    ring: (w, top, bot) => furySection(w, top, bot, sk),
  };
}

// Analytic spine height at z (linear over the base stations) — for bone placement.
function spineYAt(stations, z) {
  if (z <= stations[0][0]) return stations[0][4];
  for (let i = 0; i < stations.length - 1; i++) {
    if (z <= stations[i + 1][0]) {
      const t = (z - stations[i][0]) / (stations[i + 1][0] - stations[i][0]);
      return lerp(stations[i][4], stations[i + 1][4], t);
    }
  }
  return stations[stations.length - 1][4];
}
function halfWidthAt(stations, z) {
  if (z <= stations[0][0]) return stations[0][1];
  for (let i = 0; i < stations.length - 1; i++) {
    if (z <= stations[i + 1][0]) {
      const t = (z - stations[i][0]) / (stations[i + 1][0] - stations[i][0]);
      return lerp(stations[i][1], stations[i + 1][1], t);
    }
  }
  return stations[stations.length - 1][1];
}

// ════════════════════════ TORSO (body-less) ════════════════════════════════
// Publishes the attach contract + the loft recipe; builds NO body mesh (the hull
// wings builder grows the body itself). Head mounts at attach.headBase.
function buildFuryTorso(def, model, bodyMat) {
  const group = new THREE.Group();
  const profile = furyProfile(model);
  const stations = profile.stations;
  const TORSO_Y = 0;

  // The DoubleSide body material with the surface-shader relief (matte hide).
  const torsoMat = new THREE.MeshStandardMaterial({
    color: def.body ?? 0x10131c,
    roughness: def.bodyRoughness ?? 0.86, metalness: def.bodyMetalness ?? 0.0,
    envMapIntensity: def.bodyEnvIntensity ?? 0.2, side: THREE.DoubleSide,
  });
  const patches = buildSurfacePatches((def.parts && def.parts.surface && def.parts.surface.shader) || [], def);
  if ((def.rimBodyMul ?? 1) > 0) patches.push(fresnelRimPatch(def.dorsalHi ?? def.scales ?? 0x39507a, { intensity: 0.3 * (def.rimBodyMul ?? 1) }));
  composeSurface(torsoMat, patches);

  const headZ = stations[0][0];
  const attach = {
    wingRoot: (side) => ({
      x: 0, // x is applied per-side in the builder
      y: spineYAt(stations, model.furyWingRootZ ?? -0.85) + (model.wingRootOffset?.y ?? 0) + 0.06,
      z: (model.furyWingRootZ ?? -0.85) + (model.wingRootOffset?.z ?? 0),
      side,
    }),
    headBase: { x: 0, y: spineYAt(stations, headZ) + 0.04, z: headZ - 0.15 },
    tailAnchor: { y: spineYAt(stations, 2.0), z: 2.0 },
    halfWidthAt: (z) => halfWidthAt(stations, z),
    bodyMidY: TORSO_Y,
    bodyMatDouble: torsoMat,
    riderSocket: model.riderSocket ?? { x: 0, y: spineYAt(stations, -0.4) + 0.4, z: -0.4 },
    loft: {
      makeGeo: () => sweepProfileSmooth(profile),
      profile, stretch: 1, TORSO_Y,
      stations,
      spineYAt: (z) => spineYAt(stations, z),
      halfWidthFor: (z) => halfWidthAt(stations, z),
    },
  };
  return { group, attach, spineMats: [] };
}

// ════════════════════════ WINGS / HULL builder ═════════════════════════════
function buildFuryHull(def, model, attach, giM) {
  if (!attach.loft || !attach.bodyMatDouble) {
    throw new Error("furyHull wings require parts.torso:'furyHullTorso' (publishes attach.loft + attach.bodyMatDouble)");
  }
  const group = new THREE.Group();
  const spineMats = [];
  const loft = attach.loft;
  const stations = loft.stations;
  const hullMat = attach.bodyMatDouble;

  // ── body+tail loft geometry + its per-vertex skin (BODY → tail-bone chain) ──
  const loftGeo = loft.makeGeo();
  const lr = loftGeo.userData.loftRings;           // { count, section, ringZ }
  const SECT = lr.section, RINGS = lr.count, ringZ = lr.ringZ;

  // Tail-bone z anchors (rest positions along the spine) + a BODY anchor up front.
  // A vertex's weight is a smooth 2-bone blend between the anchors bracketing its z.
  const tailZ = [2.2, 3.2, 4.2, 5.2];
  const anchors = [{ b: BONE.BODY, z: 1.0 }, { b: BONE.T0, z: tailZ[0] }, { b: BONE.T1, z: tailZ[1] }, { b: BONE.T2, z: tailZ[2] }, { b: BONE.T3, z: tailZ[3] }];
  function loftSkinAtZ(z) {
    if (z <= anchors[0].z) return { si: [BONE.BODY, 0, 0, 0], sw: [1, 0, 0, 0] };
    for (let i = 0; i < anchors.length - 1; i++) {
      if (z <= anchors[i + 1].z) {
        const t = sstep((z - anchors[i].z) / (anchors[i + 1].z - anchors[i].z));
        return { si: [anchors[i].b, anchors[i + 1].b, 0, 0], sw: [1 - t, t, 0, 0] };
      }
    }
    return { si: [BONE.T3, 0, 0, 0], sw: [1, 0, 0, 0] };
  }
  writeSkin(loftGeo, (i) => loftSkinAtZ(ringZ[Math.floor(i / SECT)]));

  // ── bones ────────────────────────────────────────────────────────────────
  const bodyRoot = new THREE.Bone();
  const bones = new Array(11).fill(null);
  bones[BONE.BODY] = bodyRoot;

  const ws = model.wingScale ?? 1;
  const span = (model.furyWingSpan ?? 4.4) * ws;            // wingtip x-reach
  // The WRIST sits at ~1/3 of the span (the hand/knuckle); the long finger struts +
  // the leading frame fan out from there to the wingtip (the bat-wing anatomy). With
  // the wrist inboard, the outer ~2/3 of the wing folds at the wrist (weighted to WR).
  const elbowFrac = 0.15, wristFrac = model.furyWristFrac ?? 0.32;
  const archV = model.furyWingArch ?? 0.6;
  function buildArm(side) {
    const wr = attach.wingRoot(side);
    const rootX = side * loft.halfWidthFor(wr.z) * 0.96;
    const shoulder = new THREE.Bone();
    shoulder.position.set(rootX, wr.y, wr.z);
    const elbow = new THREE.Bone();
    elbow.position.set(side * span * elbowFrac, archV * 0.4, -0.1);
    const wrist = new THREE.Bone();
    wrist.position.set(side * span * (wristFrac - elbowFrac), archV * 0.3, -0.05);
    shoulder.add(elbow); elbow.add(wrist);
    return { wr, rootX, shoulder, elbow, wrist, side };
  }
  const armR = buildArm(1), armL = buildArm(-1);
  bones[BONE.SH_L] = armL.shoulder; bones[BONE.EL_L] = armL.elbow; bones[BONE.WR_L] = armL.wrist;
  bones[BONE.SH_R] = armR.shoulder; bones[BONE.EL_R] = armR.elbow; bones[BONE.WR_R] = armR.wrist;
  const SH = (s) => s < 0 ? BONE.SH_L : BONE.SH_R;
  const EL = (s) => s < 0 ? BONE.EL_L : BONE.EL_R;
  const WR = (s) => s < 0 ? BONE.WR_L : BONE.WR_R;

  // Tail-bone chain (BODY → T0 → T1 → T2 → T3), each at the spine centreline.
  const t0 = new THREE.Bone(); t0.position.set(0, loft.spineYAt(tailZ[0]), tailZ[0]);
  const t1 = new THREE.Bone(); t1.position.set(0, loft.spineYAt(tailZ[1]) - loft.spineYAt(tailZ[0]), tailZ[1] - tailZ[0]);
  const t2 = new THREE.Bone(); t2.position.set(0, loft.spineYAt(tailZ[2]) - loft.spineYAt(tailZ[1]), tailZ[2] - tailZ[1]);
  const t3 = new THREE.Bone(); t3.position.set(0, loft.spineYAt(tailZ[3]) - loft.spineYAt(tailZ[2]), tailZ[3] - tailZ[2]);
  t0.add(t1); t1.add(t2); t2.add(t3);
  bones[BONE.T0] = t0; bones[BONE.T1] = t1; bones[BONE.T2] = t2; bones[BONE.T3] = t3;

  // ── span skin (membrane/arm outboard gradient over BODY→SH→EL→WR) ──────────
  const elbowX = span * elbowFrac, wristX = span * wristFrac, foldB = 0.55 * ws, rootB = elbowX * 0.45;
  function spanSkin(side, ax) {
    let a, b, t = 0;
    if (ax < rootB) { a = BONE.BODY; b = SH(side); t = sstep(ax / rootB); }
    else if (ax <= elbowX - foldB) { a = SH(side); b = SH(side); }
    else if (ax < elbowX + foldB) { a = SH(side); b = EL(side); t = sstep((ax - (elbowX - foldB)) / (2 * foldB)); }
    else if (ax <= wristX - foldB) { a = EL(side); b = EL(side); }
    else if (ax < wristX + foldB) { a = EL(side); b = WR(side); t = sstep((ax - (wristX - foldB)) / (2 * foldB)); }
    else { a = WR(side); b = WR(side); }
    return { si: [a, b, 0, 0], sw: [1 - t, t, 0, 0] };
  }

  // ── opaque hull = loft ⊕ dorsal nubs (the arm is the leading-edge FRAME built
  //    per-wing below, laid ON the membrane edge so it can never gap — into struts) ─
  const nubGeos = buildDorsalNubs(model, loft, hullMat, loftSkinAtZ);
  const hullGeo = growSkinnedExtension(loftGeo, [...nubGeos]);
  hullGeo.computeVertexNormals();
  const hullNrm = hullGeo.attributes.normal, hullPos = hullGeo.attributes.position;
  const hullSI = hullGeo.attributes.skinIndex, hullSW = hullGeo.attributes.skinWeight;
  // A weld-root vert copies its paired hull vert's EXACT position, normal AND skin
  // weights, so the pair shares one bone field and can never separate under motion.
  const hullSkinAt = (h) => ({ si: [hullSI.getX(h), hullSI.getY(h), hullSI.getZ(h), hullSI.getW(h)], sw: [hullSW.getX(h), hullSW.getY(h), hullSW.getZ(h), hullSW.getW(h)] });
  const hullMesh = new THREE.SkinnedMesh(hullGeo, hullMat);
  hullMesh.frustumCulled = false; hullMesh.name = 'furyHull';

  // ── translucent wing membrane + tail-fins + ear-frills ─────────────────────
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.furyWingOpacity ?? model.wingOpacity ?? 0.92,
    emissive: def.wingMembraneEmissive ?? def.wingEmissive ?? 0x10161f,
    emissiveIntensity: model.wingPanelGlow ?? 0.12,
  });
  if (model.wingSSS) composeSurface(wingMat, [membraneSSSPatch({ color: def.wingMembraneEmissive ?? 0x223044, strength: 0.2, power: 1.5 })]);

  const strutMat = hullMat;
  const strutGeos = [];

  const wingR = buildWing(armR, +1);
  const wingL = buildWing(armL, -1);
  const finR = buildTailFin(+1);
  const finL = buildTailFin(-1);
  const earR = buildEarFrill(+1);
  const earL = buildEarFrill(-1);
  const memGeo = mergeGeometries([wingR.mem, wingL.mem, finR.mem, finL.mem, earR, earL].filter(Boolean), false);
  if (!memGeo) throw new Error('furyHull: membrane merge returned null');
  const memMesh = new THREE.SkinnedMesh(memGeo, wingMat);
  memMesh.frustumCulled = false; memMesh.name = 'furyMembrane';

  const strutsGeo = strutGeos.length ? growSkinnedExtension(strutGeos[0], strutGeos.slice(1)) : null;
  let strutsMesh = null;
  if (strutsGeo) {
    strutsGeo.computeVertexNormals();
    strutsMesh = new THREE.SkinnedMesh(strutsGeo, strutMat);
    strutsMesh.frustumCulled = false; strutsMesh.name = 'furyStruts';
  }

  // ── WING: membrane grid welded to the body flank (exact-copy zero-gap) ──────
  function buildWing(arm, side) {
    const { wr, rootX } = arm;
    const fingers = Math.max(3, Math.round(model.furyWingFingers ?? 4));
    const scallop = model.furyScallopDepth ?? 0.55;
    const rootChord = model.furyWingRootChord ?? 0.62;
    const zF = wr.z - rootChord, zB = wr.z + rootChord;

    // 1. gather the hull's own flank verts on this side within the z-window → exact
    //    weld points (the membrane root column copies these, so the gap is zero).
    const rootHull = [];
    const vtmp = new THREE.Vector3();
    for (let r = 0; r < RINGS; r++) {
      const z = ringZ[r];
      if (z < zF || z > zB) continue;
      let bestK = 0, bestX = -Infinity;
      for (let k = 0; k < SECT; k++) {
        const idx = r * SECT + k;
        const x = hullPos.getX(idx);
        const yk = hullPos.getY(idx);
        // outermost on this side and near mid-height (the flank, not the keel/belly)
        const score = side * x - Math.abs(yk - wr.y) * 0.6;
        if (score > bestX) { bestX = score; bestK = idx; }
      }
      rootHull.push(bestK);
    }
    rootHull.sort((a, b) => hullPos.getZ(a) - hullPos.getZ(b));
    const V = rootHull.length - 1;
    if (V < 2) throw new Error('furyHull: wing root window too thin (raise furyWingRootChord)');

    // 2. LEADING edge (the arm continuing to the wingtip) + a CLEAN SCALLOPED trailing
    //    edge. The trailing edge is a chain of CUSPS — one sharp point per finger — with
    //    a concave web dipping forward between each pair (a parabola), so every scallop
    //    comes to a clean point exactly where its finger strut ends (no wavy mush).
    const tipFrontZ = wr.z + (model.furyWingSweep ?? 0.5);     // wingtip (front), modest aft sweep
    const chordReach = model.furyWingChord ?? 2.2;             // how far the trailing fingers bulge aft
    const leadCtrl = [
      new THREE.Vector3(0, 0, zF),
      new THREE.Vector3(0.32, 0, zF - 0.35),                   // bow forward
      new THREE.Vector3(0.70, 0, lerp(zF, tipFrontZ, 0.7) - 0.25),
      new THREE.Vector3(1.0, 0, tipFrontZ),
    ];
    const leadCurve = new THREE.CatmullRomCurve3(leadCtrl, false, 'centripetal');
    const LEz = (u) => leadCurve.getPoint(Math.min(u, 1)).z;
    // CUSPS along the trailing edge, body root (u=0) → wingtip (u=1). The interior
    // cusps are the finger tips; the trailing reach bulges aft mid-wing and converges
    // to the wingtip. uInner = just outboard of the wrist so the fingers fan from it.
    const uInner = wristFrac + 0.05;
    const aftAt = (u) => lerp(zB, tipFrontZ, u) + chordReach * Math.sin(Math.PI * u) * (1 - 0.12 * u);
    const cusps = [{ u: 0, aft: zB }];
    for (let f = 0; f < fingers; f++) {
      const u = lerp(uInner, 1, fingers > 1 ? f / (fingers - 1) : 1);
      cusps.push({ u, aft: f === fingers - 1 ? tipFrontZ : aftAt(u) });   // last = wingtip point
    }
    // piecewise trailing-edge z(u): linear between cusp aft values, MINUS a parabolic
    // forward dip (the scallop web). At a cusp the dip is 0 → a sharp point.
    function TEz(u) {
      u = Math.min(Math.max(u, 0), 1);
      for (let i = 0; i < cusps.length - 1; i++) {
        const a = cusps[i], b = cusps[i + 1];
        if (u >= a.u && u <= b.u) {
          const t = (u - a.u) / Math.max(b.u - a.u, 1e-6);
          const base = lerp(a.aft, b.aft, t);
          const chord = base - LEz(u);
          return base - scallop * chord * 0.34 * (4 * t * (1 - t));   // moderate concave web, 0 at the cusps
        }
      }
      return cusps[cusps.length - 1].aft;
    }

    // 3. build the grid. COLUMNS land exactly on the cusps (so the points stay sharp):
    //    each cusp interval is subdivided into K steps. u=0 column = EXACT hull verts;
    //    the membrane emerges from the flank into a thin arched sheet over the first ~18%.
    const K = Math.max(2, seg(3));
    const uCols = [0];
    for (let i = 0; i < cusps.length - 1; i++) for (let s = 1; s <= K; s++) uCols.push(lerp(cusps[i].u, cusps[i + 1].u, s / K));
    const NCOL = uCols.length - 1;
    const kBlend = Math.max(1, Math.round(NCOL * 0.12));
    const arch = model.furyWingArch ?? 0.6, hump = model.furyWingHump ?? 0.3;
    const billow = model.furyWingBillow ?? 0.18;
    const rootY0 = hullPos.getY(rootHull[0]), rootYV = hullPos.getY(rootHull[V]);
    const planeY = wr.y;                                       // the wing-sheet attach height
    function memXYZ(u, c) {
      const liftU = arch * u + hump * Math.exp(-Math.pow((u - 0.5) / 0.30, 2)) * u;
      const z = LEz(u) + (TEz(u) - LEz(u)) * c;
      const chordW = Math.abs(TEz(u) - LEz(u));
      const yFlat = planeY + liftU + billow * Math.sin(Math.PI * c) * chordW;
      const yRoot = lerp(rootY0, rootYV, c);
      return [rootX + side * span * u, lerp(yRoot, yFlat, sstep(Math.min(u / 0.18, 1))), z];
    }
    const verts = [], idx = [], skin = [];
    for (let i = 0; i <= NCOL; i++) {
      const u = uCols[i];
      for (let v = 0; v <= V; v++) {
        const c = V > 0 ? v / V : 0;
        if (i === 0) {
          const h = rootHull[v];
          verts.push(hullPos.getX(h), hullPos.getY(h), hullPos.getZ(h));   // exact copy → zero gap
        } else {
          const p = memXYZ(u, c);
          verts.push(p[0], p[1], p[2]);
        }
        const ax = u * wristX;
        let s;
        if (i === 0) s = hullSkinAt(rootHull[v]);
        else if (i <= kBlend) {
          const sp = spanSkin(side, ax);
          const toBody = 1 - sstep(i / kBlend);
          if (sp.si[0] === BONE.BODY) s = { si: [BONE.BODY, sp.si[1], 0, 0], sw: [toBody + (1 - toBody) * sp.sw[0], (1 - toBody) * sp.sw[1], 0, 0] };
          else s = { si: [BONE.BODY, sp.si[0], 0, 0], sw: [toBody, 1 - toBody, 0, 0] };
        } else s = spanSkin(side, ax);
        skin.push(s);
      }
    }
    for (let i = 0; i < NCOL; i++) for (let v = 0; v < V; v++) {
      const a = i * (V + 1) + v, b = a + 1, c = a + (V + 1), d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    applyWingGradient(g, def, 0, 1);
    writeSkin(g, (i) => skin[i]);
    const gN = g.attributes.normal;
    for (let v = 0; v <= V; v++) {
      const h = rootHull[v];
      gN.setXYZ(v, hullNrm.getX(h), hullNrm.getY(h), hullNrm.getZ(h));   // shared seam normals (no crease)
    }
    gN.needsUpdate = true;

    // LEADING-EDGE FRAME (the arm): ONE continuously-tapering tube laid EXACTLY on the
    // membrane leading edge (memXYZ(u,0)) for the whole span — thickest at the shoulder,
    // thinning through the wrist, then continuing as the outer finger tapering to a fine
    // point at the wingtip. Shares the membrane's v=0 points → it can never gap.
    {
      const rArm = (model.furyArmRadius ?? 0.13) * (model.wingRootScale ?? 1);
      const rWrist = model.furyForearmRadius ?? 0.05;
      const rTip = model.furyFrameTipRadius ?? 0.011;
      const N = seg(20), pts = [], radii = [], sk = [];
      for (let s = 0; s < N; s++) {
        const u = s / (N - 1);
        const p = memXYZ(u, 0);
        pts.push(new THREE.Vector3(p[0], p[1], p[2]));
        radii.push(u <= wristFrac
          ? rArm + (rWrist - rArm) * sstep(u / wristFrac)                          // shoulder → wrist
          : rWrist + (rTip - rWrist) * sstep((u - wristFrac) / (1 - wristFrac)));   // wrist → wingtip point
        sk.push(spanSkin(side, u * wristX));
      }
      sk[0] = hullSkinAt(rootHull[0]);
      const frame = skinnedTube(pts, radii, seg(7), (s) => sk[s], strutMat).geometry;
      const fp = frame.attributes.position, rings = seg(7);
      for (let s = 0; s < N; s++) { const cy = pts[s].y; for (let j = 0; j < rings; j++) { const k = s * rings + j; fp.setY(k, cy + (fp.getY(k) - cy) * 0.6); } }
      fp.needsUpdate = true; frame.computeVertexNormals();
      strutGeos.push(frame);
    }

    // FINGER struts: one per INTERIOR cusp, fanning from the WRIST to that exact scallop
    // point. Thickest at the wrist (matching the forearm) → tapering to a fine point at
    // the cusp, so each scallop reads as a clean spar (the user's "clean" note).
    const wristPt = memXYZ(wristFrac, 0.12);                                  // the knuckle on the leading edge
    for (let f = 1; f < cusps.length - 1; f++) {                              // skip body root (0) + wingtip (handled by frame)
      const cu = cusps[f].u;
      const N = seg(6), pts = [], radii = [], sk = [];
      for (let j = 0; j < N; j++) {
        const t = j / (N - 1);
        const u = lerp(wristFrac, cu, t);
        const c = lerp(0.12, 1, Math.pow(t, 1.1));                            // wrist (near leading) → cusp (trailing)
        const p = memXYZ(u, c);
        pts.push(new THREE.Vector3(p[0], p[1] + 0.016, p[2]));               // ride just proud of the sheet
        radii.push(lerp(model.furyForearmRadius ?? 0.05, 0.006, sstep(t)));   // thick at wrist → fine point
        sk.push(spanSkin(side, u * wristX));
      }
      pts[0].set(wristPt[0], wristPt[1] + 0.016, wristPt[2]);                 // all fingers share the wrist knuckle
      strutGeos.push(skinnedTube(pts, radii, seg(4), (s) => sk[s], strutMat).geometry);
    }
    return { mem: g };
  }

  // ── TAIL-FIN: a BROAD leaf blade welded to the rear loft, splayed aft + out ──
  // The two fins fan from the narrow tail tip into wide rounded flukes (the Night-
  // Fury read). The root edge copies the tail's own verts (zero-gap weld); the blade
  // then flares along a fin axis with a leaf-bulge width.
  function buildTailFin(side) {
    const finLen = model.furyTailFinSpan ?? 1.2;
    const finWid = model.furyTailFinWidth ?? 0.55;
    const splay = model.furyTailFinSplay ?? 0.6;
    const zWF = 4.1, zWB = 5.25;
    const rootHull = [];
    for (let r = 0; r < RINGS; r++) {
      const z = ringZ[r];
      if (z < zWF || z > zWB) continue;
      let bestK = 0, bestX = -Infinity;
      for (let k = 0; k < SECT; k++) { const idx = r * SECT + k; const sc = side * hullPos.getX(idx); if (sc > bestX) { bestX = sc; bestK = idx; } }
      rootHull.push(bestK);
    }
    rootHull.sort((a, b) => hullPos.getZ(a) - hullPos.getZ(b));
    const V = rootHull.length - 1;
    if (V < 1) return { mem: null };
    const rootMid = new THREE.Vector3();
    const rv = (h) => new THREE.Vector3(hullPos.getX(h), hullPos.getY(h), hullPos.getZ(h));
    for (const h of rootHull) rootMid.add(rv(h));
    rootMid.multiplyScalar(1 / rootHull.length);
    // fin axis: out to the side + aft + a touch down; width perpendicular in the
    // near-horizontal plane → the classic splayed twin flukes.
    const axis = new THREE.Vector3(side * Math.sin(splay), -0.12, Math.cos(splay)).normalize();
    const Wdir = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize();
    const tip = rootMid.clone().addScaledVector(axis, finLen);
    const toes = Math.max(2, Math.round(model.furyTailFinToes ?? 3));
    const finScallop = model.furyTailFinScallop ?? 0.34;
    // a point on the fin blade at span u∈[0,1] (root→tip) and chord c∈[0,1]; the outer
    // silhouette is SCALLOPED — deep notches between `toes` toe-tips, like the wing webs.
    const finPoint = (u, c) => {
      const notch = 1 - finScallop * (0.5 - 0.5 * Math.cos(2 * Math.PI * toes * u));   // dips between toes
      const width = finWid * Math.sin(Math.PI * Math.pow(u, 0.62)) * notch;            // leaf bulge × scallop
      return rootMid.clone().lerp(tip, u).addScaledVector(Wdir, width * (c - 0.5) * 2);
    };
    const SEG_U = seg(12);
    const verts = [], idx = [], skin = [];
    for (let i = 0; i <= SEG_U; i++) {
      const u = i / SEG_U;
      for (let v = 0; v <= V; v++) {
        const c = V > 0 ? v / V : 0;
        if (i === 0) { const h = rootHull[v]; verts.push(hullPos.getX(h), hullPos.getY(h), hullPos.getZ(h)); }
        else {
          const p = rv(rootHull[v]).lerp(finPoint(u, c), sstep(Math.min(u / 0.22, 1)));   // blend off the welded root
          verts.push(p.x, p.y, p.z);
        }
        skin.push(i === 0 ? hullSkinAt(rootHull[v]) : { si: [BONE.T3, 0, 0, 0], sw: [1, 0, 0, 0] });
      }
    }
    for (let i = 0; i < SEG_U; i++) for (let v = 0; v < V; v++) {
      const a = i * (V + 1) + v, b = a + 1, c = a + (V + 1), d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    applyWingGradient(g, def, 0.3, 1);
    writeSkin(g, (i) => skin[i]);
    const gN = g.attributes.normal;
    for (let v = 0; v <= V; v++) { const h = rootHull[v]; gN.setXYZ(v, hullNrm.getX(h), hullNrm.getY(h), hullNrm.getZ(h)); }
    gN.needsUpdate = true;

    // toe struts: very thin tubes from the fin root out to each scalloped toe-tip (the
    // notch peaks), one per toe — the subtle finger-spar read the user asked for.
    for (let j = 0; j < toes; j++) {
      const uPeak = (2 * j + 1) / (2 * toes);            // scallop peak along the span
      const N = seg(4), pts = [], radii = [];
      for (let s = 0; s < N; s++) {
        const t = s / (N - 1);
        const p = finPoint(uPeak * t, 0.92);             // root → toe tip on the trailing side
        pts.push(new THREE.Vector3(p.x, p.y + 0.012, p.z));
        radii.push(lerp(0.022, 0.008, t));
      }
      strutGeos.push(skinnedTube(pts, radii, seg(3), () => ({ si: [BONE.T3, 0, 0, 0], sw: [1, 0, 0, 0] }), strutMat).geometry);
    }
    return { mem: g };
  }

  // ── EAR-FRILL: a small swept curved fan near the head, welded to the fore-body
  function buildEarFrill(side) {
    const sp = model.furyEarFrillSpan ?? 0.0;
    if (sp <= 0) return null;
    const base = attach.headBase;
    const SEG_U = seg(6), V = 3;
    const verts = [], idx = [], skin = [];
    const root = new THREE.Vector3(side * 0.12, base.y + 0.18, base.z + 0.25);
    const tip = new THREE.Vector3(side * (0.12 + sp), base.y + 0.42, base.z + 0.55);
    for (let i = 0; i <= SEG_U; i++) {
      const u = i / SEG_U;
      for (let v = 0; v <= V; v++) {
        const c = v / V;
        const w = (1 - u) * 0.18;
        verts.push(lerp(root.x, tip.x, u) + side * c * w, lerp(root.y, tip.y, u), lerp(root.z, tip.z, u) + (c - 0.5) * 0.2 * (1 - u));
        skin.push({ si: [BONE.BODY, 0, 0, 0], sw: [1, 0, 0, 0] });
      }
    }
    for (let i = 0; i < SEG_U; i++) for (let v = 0; v < V; v++) {
      const a = i * (V + 1) + v, b = a + 1, c = a + (V + 1), d = c + 1;
      if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    applyWingGradient(g, def, 0.4, 1);
    writeSkin(g, (i) => skin[i]);
    return g;
  }

  // ── tip markers (trail spawn) — children of the wrist bones ────────────────
  const mkMarker = (arm) => { const m = new THREE.Object3D(); m.position.set(arm.side * span * (1 - wristFrac), archV, 0.2); arm.wrist.add(m); return m; };
  const tipMarkerR = mkMarker(armR), tipMarkerL = mkMarker(armL);

  // ── assemble + bind (L2 local-space order) ─────────────────────────────────
  group.add(bodyRoot);
  group.add(armL.shoulder); group.add(armR.shoulder);
  group.add(t0);
  group.add(hullMesh); group.add(memMesh);
  if (strutsMesh) group.add(strutsMesh);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  hullMesh.bind(skeleton); memMesh.bind(skeleton);
  if (strutsMesh) strutsMesh.bind(skeleton);

  return {
    group,
    parts: {
      wingPivotL: armL.shoulder, wingPivotR: armR.shoulder,
      wingTipL: armL.wrist, wingTipR: armR.wrist,
      wingPivot2L: null, wingPivot2R: null,
      tipMarkerL, tipMarkerR,
      tailSegs: [t0, t1, t2, t3], spineSegs: null, tailFins: null,
      wingRigL: { shoulder: armL.shoulder, elbow: armL.elbow, wrist: armL.wrist, side: -1, profile: model.flapProfile || null },
      wingRigR: { shoulder: armR.shoulder, elbow: armR.elbow, wrist: armR.wrist, side: 1, profile: model.flapProfile || null },
    },
    wingMat, spineMats,
  };
}

// Dorsal nubs: a row of small BACK-SWEPT pointed knobs running the spine from the
// mid-back down the tail (the reference's little dorsal spines). Each is a curved,
// rearward-leaning spike — a wide base on the skin tapering to a fine tip — that
// rides the loft's own apex line, taller over the back and finer/spikier on the tail.
function buildDorsalNubs(model, loft, mat, loftSkinAtZ) {
  const count = Math.max(0, Math.round(model.furyDorsalNubCount ?? 0));
  if (!count) return [];
  const h = model.furyDorsalNubHeight ?? 0.09;
  const topHAt = (z) => { const s = loft.stations; if (z <= s[0][0]) return s[0][2]; for (let j = 0; j < s.length - 1; j++) if (z <= s[j + 1][0]) return lerp(s[j][2], s[j + 1][2], (z - s[j][0]) / (s[j + 1][0] - s[j][0])); return s[s.length - 1][2]; };
  const geos = [];
  for (let i = 0; i < count; i++) {
    const z = lerp(-1.2, 3.5, i / Math.max(1, count - 1));
    const back = Math.max(0, 1 - Math.abs(z + 0.2) / 3.2);   // tallest over the back
    const hz = h * (0.55 + 0.45 * back);                     // back knobs taller, tail spikes shorter
    const baseY = loft.spineYAt(z) + topHAt(z);              // on the dorsal apex line
    // a rearward-leaning spike: base on the skin → tip up AND back (+z), curved.
    const c0 = new THREE.Vector3(0, baseY - 0.01, z - 0.05);
    const c1 = new THREE.Vector3(0, baseY + hz * 0.7, z + 0.03);
    const c2 = new THREE.Vector3(0, baseY + hz, z + 0.12);    // tip swept back
    const curve = new THREE.CatmullRomCurve3([c0, c1, c2], false, 'centripetal');
    const pts = curve.getPoints(seg(5));
    const r0 = 0.05 * (0.7 + 0.3 * back);                    // wide base
    const radii = pts.map((_, j) => lerp(r0, 0.004, Math.pow(j / (pts.length - 1), 0.8)));  // taper to a fine point
    const sk = loftSkinAtZ(z);
    geos.push(skinnedTube(pts, radii, seg(4), () => sk, mat).geometry);
  }
  return geos;
}

// ════════════════════════ registration ═════════════════════════════════════
registerTorso('furyHullTorso', (def, model, bodyMat) => buildFuryTorso(def, model, bodyMat));
registerWings('furyHull', (def, model, attach, giM) => buildFuryHull(def, model, attach, giM));
registerTail('furyHullTail', () => ({ group: new THREE.Group(), segs: [], tailFins: null, accentMats: null }));

export { buildFuryHull, buildFuryTorso, furySection, furyProfile, FURY_BASE };
