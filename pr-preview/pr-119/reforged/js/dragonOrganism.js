import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import {
  wingSpecFor, buildCurvedPatch, applyWingGradient, archLift,
} from './dragonParts.js';
import { registerWings, registerTorso } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube } from './dragonSweep.js';
import { buildTorso, bladeRing } from './dragonTorso.js';
import { sweepProfile } from './dragonSweep.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

// ── CLEAN-SHEET ORGANISM HULL ───────────────────────────────────────────────
// Increment 2a (LEAPFROG L25 FORK): a NEW creature whose body + wings (and later
// neck/head/tail) are generated TOGETHER as one continuous skinned hull, with NO
// legacy-body coupling. This SUPERSEDES dragonUnifiedHull.js (v1), which welded
// the new wing onto Obsidian's legacy arrow-loft and left a ~0.43 rest-pose gap
// (the analytic flank point ≠ the real loft vertex) that detached on the bank.
//
// THE KEY IDEA — SHARED VERTICES, NOT SAMPLING.
// v1's membrane root was placed at an ANALYTIC flank point. Here the membrane
// root-column verts are EXACT COPIES of the body loft's OWN wing-seam vertices —
// the wing literally grows out of the body surface, so there is ZERO gap by
// construction. Both the seam verts and their body originals are weighted 100%
// to the same static `bodyRoot` bone, so they stay coincident in ANY motion (the
// relationship is frozen — L25's "shared-static-frame is the actual invariant").
//
// Topology, on ONE 7-bone skeleton [bodyRoot, shL,elL,wrL, shR,elR,wrR]:
//   · opaque HULL  = body loft (→ bodyRoot) MERGED with two thin fleshy ARM
//                    frames (slim leading-edge tubes, deltoid swell at the root
//                    only) → ONE body-material draw call.
//   · membrane     = both wings' curved patches, root column = the EXACT body
//                    seam verts, inner columns smoothstep-blended out to the
//                    natural wing shape, root band → bodyRoot, outboard →
//                    shoulder/elbow/wrist. ONE translucent draw call.
//   · fingers      = slim struts radiating from the wrist through the membrane to
//                    the trailing tips (skinned to wrist/elbow) → the scalloped
//                    dragon-wing read. MERGED into the membrane mesh.

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// ── A clean SLEEK DRAKE profile, decoupled from the shipped roster ───────────
// Started from ARROW_PROFILE but defined as OUR OWN copy so this creature owns
// its body plan — it cannot drift the roster, and a future neck/tail/head can
// reshape it freely. Slightly slimmer + a touch longer than the arrow drake for
// a sleeker organism read. Reuses the shared bladeRing cross-section.
const DRAKE_PROFILE = {
  zHold: 0,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.27,
  tailAnchorZ: 1.18,
  stations: [
    [-3.05, 0.14, 0.10, 0.12], // neck cap
    [-2.45, 0.28, 0.21, 0.23], // neck base
    [-1.65, 0.50, 0.41, 0.37], // fore-shoulder
    [-0.85, 0.64, 0.53, 0.45], // shoulder peak — broadest, tallest keel
    [-0.10, 0.53, 0.44, 0.39], // thorax
    [ 0.60, 0.37, 0.32, 0.28], // waist
    [ 1.15, 0.27, 0.24, 0.19], // hips
    [ 1.70, 0.16, 0.16, 0.10], // slim tail root
  ],
  keel: [[-2.45, 0.21], [-0.85, 0.53], [-0.10, 0.44], [0.60, 0.32], [1.15, 0.24], [1.70, 0.16]],
  wingRoot: { x: 0.5, y: 0.55, z: -0.45 }, // high on the back, over the shoulder peak
  fairing: { r: 0.3, scale: [0.86, 0.78, 1.2], pos: [0.46, 0.54, -0.4] },
  neck: {
    rBase: 0.44, rStep: 0.045, rMin: 0.19, scale: [0.8, 0.66, 1.3],
    y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: -3.08 - (neckSegs - 4) * 0.34 }),
};

// organismTorso — the body-less peer (like unifiedHullTorso) for the clean-sheet
// hull. Builds the neck + publishes the full attach contract (incl. attach.loft,
// the body-loft GENERATOR, + attach.bodyMatDouble), but adds NO body mesh + NO
// fairings: organismWings grows the body surface itself from attach.loft and welds
// the membrane to it as one continuous skin. Uses sweepProfile so the body rounds
// on ULTRA (byte-identical at HIGH). Registered as a wings-slot peer.
registerTorso('organismTorso', (def, model, bodyMat) =>
  buildTorso(DRAKE_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfile({ ...profile, ring: profile.ring || bladeRing }, stretch),
    { bodyMesh: false }));

// Ensure a geometry carries the four hull attributes (position, normal, skinIndex,
// skinWeight) so mergeGeometries (which requires identical attribute SETS) never
// returns null (the L13 null-merge guard). Body verts default to bodyRoot=1.
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

// growSkinnedExtension — merge a base loft geometry with one or more skinned
// extension grids/tubes into ONE skinned BufferGeometry with a continuous weight
// field (each part already carries its own skinIndex/skinWeight). Carried over
// from v1; a future neck/tail/head caller reuses it verbatim.
function growSkinnedExtension(loftGeo, extensions) {
  const parts = [ensureSkinAttrs(loftGeo)];
  for (const e of extensions) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('growSkinnedExtension: mergeGeometries returned null (attribute mismatch)');
  return merged;
}

// ── seam-copy weld helper (the SHARED-VERTEX mechanism) ──────────────────────
// Identify the body loft's WING-SEAM vertices: a contiguous arc of the UPPER-FLANK
// ring positions across the SHOULDER stations, on one side, and return them as an
// ORDERED CHAIN running front→back along the wing root chord. sweepProfile lays the
// loft as `station*m + ringPos`, so a seam vertex's index is fully determined by
// (station, ringPos). bladeRing is ordered CCW: ring 0 = keel apex (top), 2/6 =
// widest left/right, 4 = belly, 7/1 = upper-right/upper-left shoulders. The wing
// roots on the UPPER flank — ring 7 (upper-right) for the right, ring 1 (upper-left)
// for the left — across the fore-shoulder→thorax stations.
//
// The chain is the EXACT loft verts (index + group-space position); the membrane's
// root column copies entries of this chain VERBATIM, so each root vert IS a body
// loft vert (zero gap by construction) and both are weighted to the same static
// bodyRoot bone (frozen relationship under any motion). Resolution-independent: at
// any detail the chain is whatever the loft emits, and the membrane snaps onto it.
function findSeam(loftGeo, profile, side, m) {
  // upper-flank ring for this side (just below the keel — where a wing roots).
  const upperRing = side > 0 ? 7 : 1;       // ring 7 = upper-right, ring 1 = upper-left
  const wideRing = side > 0 ? 6 : 2;        // ring 6/2 = widest (a touch lower)
  // wing-bearing stations: fore-shoulder (idx 2) → thorax (idx 4).
  const stA = 2, stB = 4;
  const pos = loftGeo.attributes.position;
  // For HIGH m===8 (the control count), so the ring index IS the stored column. For
  // LOW/ULTRA the ring is resampled (closed Catmull-Rom: control c → column
  // round(c/8 * m)); map onto the nearest resampled column so the chain still lands
  // on actual loft verts.
  const colFor = (ctrlRing) => (m === 8 ? ctrlRing : ((Math.round((ctrlRing / 8) * m) % m) + m) % m);
  // loftGeo is passed ALREADY translated to y=TORSO_Y, so read its verts verbatim
  // (group space) — no extra offset, or the seam copy floats off the body (the v1
  // double-offset bug, made impossible here by copying the real translated vert).
  const vertAt = (s, ring) => {
    const idx = s * m + colFor(ring);
    return { idx, p: new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)) };
  };
  // The chain: a contiguous arc of EXACT loft verts. We weave the upper + wide rings
  // across the stations so the chord direction (front→back along z) is densely
  // sampled by REAL verts. Order by z (front first), interleaving the two rings.
  const chain = [];
  for (let s = stA; s <= stB; s++) { chain.push(vertAt(s, upperRing)); chain.push(vertAt(s, wideRing)); }
  // sort front→back by z (the root chord runs front→back); stable on equal z.
  chain.sort((a, b) => a.p.z - b.p.z);
  return { chain, upperRing, wideRing, stA, stB };
}

function buildOrganism(def, model, attach, giM) {
  // The clean-sheet hull GROWS the body surface from the loft recipe, so it REQUIRES
  // the body-less organism torso (attach.loft + attach.bodyMatDouble). Fail loud +
  // actionable if paired with any other torso (the L25 loud-validate discipline).
  if (!attach.loft || !attach.bodyMatDouble) {
    throw new Error("organismWings require a body-less organism torso (parts.torso:'organismTorso' — it publishes attach.loft + attach.bodyMatDouble)");
  }
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale;
  const wingSpec = wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;

  // arm datums (mirror the shipped skinned wing so the bones land sensibly)
  const wristXGeo = 3.3 * ws;
  const elbowXGeo = wristXGeo * 0.52;
  const foldBand = 0.7 * ws;
  const rootBand = elbowXGeo * 0.55;
  const SEG_U = seg(24), SEG_V = seg(6);
  const elbowLift = archLift(elbowXGeo, maxX, arc, ws);
  const wristLift = archLift(wristXGeo, maxX, arc, ws);

  // ── materials ──────────────────────────────────────────────────────────
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.82,
    emissive: def.wingMembraneEmissive ?? def.wingEmissive,
    emissiveIntensity: model.wingPanelGlow ?? 0.28,
  });
  if (model.wingSSS) {
    composeSurface(wingMat, [membraneSSSPatch({ color: def.wingMembraneSSS ?? 0x2a3a52, strength: 0.22, power: 1.5 })]);
  }
  const hullMat = attach.bodyMatDouble;                 // body fresnel + cellular + iridescence
  // Finger struts wear a darker bone/horn material so they read as scalloped wing
  // fingers, not a glowing skeleton.
  const fingerMat = new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x3a5a78, emissive: def.wingEmissive ?? 0x0d1219,
    emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide,
  });

  // ── bones ───────────────────────────────────────────────────────────────
  const bodyRoot = new THREE.Bone();                    // static — holds every body vert
  const bones = [bodyRoot, null, null, null, null, null, null];
  function buildArmBones(side) {
    const wr = attach.wingRoot(side);
    const shoulder = new THREE.Bone();
    shoulder.position.set(wr.x, wr.y, wr.z);
    const elbow = new THREE.Bone();
    elbow.position.set(elbowXGeo * side, elbowLift, 0);
    const wrist = new THREE.Bone();
    wrist.position.set((wristXGeo - elbowXGeo) * side, wristLift - elbowLift, 0);
    shoulder.add(elbow); elbow.add(wrist);
    return { wr, shoulder, elbow, wrist, side };
  }
  const armR = buildArmBones(1);
  const armL = buildArmBones(-1);
  bones[BONE.SH_L] = armL.shoulder; bones[BONE.EL_L] = armL.elbow; bones[BONE.WR_L] = armL.wrist;
  bones[BONE.SH_R] = armR.shoulder; bones[BONE.EL_R] = armR.elbow; bones[BONE.WR_R] = armR.wrist;
  const SH = (side) => side < 0 ? BONE.SH_L : BONE.SH_R;
  const EL = (side) => side < 0 ? BONE.EL_L : BONE.EL_R;
  const WR = (side) => side < 0 ? BONE.WR_L : BONE.WR_R;

  // ── span skin (membrane / arm outboard gradient) ──────────────────────────
  function spanSkin(side, ax) {
    const e = elbowXGeo, w = wristXGeo, b = foldBand;
    let aBone, bBone, t = 0;
    if (ax < rootBand) { aBone = BONE.BODY; bBone = SH(side); t = sstep(ax / rootBand); }
    else if (ax <= e - b) { aBone = SH(side); bBone = SH(side); }
    else if (ax < e + b) { aBone = SH(side); bBone = EL(side); t = sstep((ax - (e - b)) / (2 * b)); }
    else if (ax <= w - b) { aBone = EL(side); bBone = EL(side); }
    else if (ax < w + b) { aBone = EL(side); bBone = WR(side); t = sstep((ax - (w - b)) / (2 * b)); }
    else { aBone = WR(side); bBone = WR(side); }
    return { si: [aBone, bBone, 0, 0], sw: [1 - t, t, 0, 0] };
  }

  // ── build the body loft + record the wing-seam verts (the shared-vert source) ─
  const loft = attach.loft;
  const TY = loft.TORSO_Y;
  const profile = loft.profile;
  const loftGeo = loft.makeGeo();
  loftGeo.translate(0, TY, 0);                          // body sits at y=TORSO_Y
  const m = seg(8);                                      // loft ring resolution
  const seamR = findSeam(loftGeo, profile, 1, m);
  const seamL = findSeam(loftGeo, profile, -1, m);

  // The membrane root chord copies the body seam chain VERBATIM. v∈[0,1] runs
  // front→back along the wing root chord; map it onto a chain entry and return that
  // EXACT loft vertex (position + index). No interpolation — each returned point IS
  // a real loft vert, so a membrane root vert set to it is coincident (zero gap) and,
  // welded to the same static bodyRoot, frozen relative to it under any motion.
  function seamPointAt(seam, v) {
    const chain = seam.chain;
    const k = Math.round(v * (chain.length - 1));
    const e = chain[Math.min(Math.max(k, 0), chain.length - 1)];
    return { p: e.p.clone(), idx: e.idx };
  }

  // ── thin fleshy ARM FRAME (leading edge), merged into the OPAQUE hull ──────
  // A SLIM leading-edge tube shoulder→elbow→wrist (NOT a fat manta tube): a tiny
  // deltoid swell at the very root ring so it fuses to the body, tapering to a
  // narrow wrist. Its root ring sits on the body seam (weighted bodyRoot); outboard
  // → shoulder/elbow/wrist via spanSkin.
  function buildArmFrame(arm) {
    const { wr, side } = arm;
    const r0 = 0.14 * (model.wingRootScale ?? 1);        // deltoid swell at the socket
    const rWrist = 0.05;
    const N = 7;
    const pSh = new THREE.Vector3(wr.x, wr.y, wr.z);
    const pEl = new THREE.Vector3(wr.x + elbowXGeo * side, wr.y + elbowLift, wr.z);
    const pWr = new THREE.Vector3(wr.x + wristXGeo * side, wr.y + wristLift, wr.z);
    const centre = [], radii = [], skin = [];
    for (let s = 0; s < N; s++) {
      const t = s / (N - 1);
      let p;
      if (t <= 0.5) p = pSh.clone().lerp(pEl, t / 0.5);
      else p = pEl.clone().lerp(pWr, (t - 0.5) / 0.5);
      centre.push(p);
      // a tiny deltoid swell ONLY at the root ring (s=0), else a slim leading edge.
      const taper = r0 + (rWrist - r0) * sstep(t);
      const swell = s === 0 ? r0 * 0.55 : 0;
      radii.push(taper + swell);
      const ax = t * wristXGeo;
      skin.push(spanSkin(side, ax));
    }
    // root ring weighted fully to bodyRoot so the arm emerges FROM the body.
    skin[0] = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
    const tube = skinnedTube(centre, radii, seg(7), (s) => skin[s], hullMat);
    return tube.geometry;
  }

  const hullGeo = growSkinnedExtension(loftGeo, [buildArmFrame(armR), buildArmFrame(armL)]);
  hullGeo.computeVertexNormals();
  const hullMesh = new THREE.SkinnedMesh(hullGeo, hullMat);
  hullMesh.frustumCulled = false;
  hullMesh.name = 'organismHull';

  // ── translucent membrane (per side, root column = EXACT body seam verts) ───
  const kBlend = Math.max(1, Math.round(SEG_U * 0.14));
  function buildMembraneSide(arm, seam) {
    const { wr, side } = arm;
    const g = buildCurvedPatch(wingSpec, {
      scaleX: 1.34 * ws, scaleZ: model.wingChord ?? 1, arc, k: ws,
      billow: model.wingBillow ?? 0.12, segU: SEG_U, segV: SEG_V,
      spanStart: 0, spanEnd: worldMaxX,
    });
    applyWingGradient(g, def, 0, 1);
    const pos = g.attributes.position;
    // patch is built in wing-local space (root at x=0) → translate to the shoulder
    // (group space), mirror x for the left, fix winding so normals stay outward.
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) * side + wr.x);
      pos.setY(i, pos.getY(i) + wr.y);
      pos.setZ(i, pos.getZ(i) + wr.z);
    }
    if (side < 0) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1), c = idx.getX(i + 2);
        idx.setX(i + 1, c); idx.setX(i + 2, b);
      }
    }

    const si = new Uint16Array(pos.count * 4);
    const sw = new Float32Array(pos.count * 4);
    for (let i = 0; i <= SEG_U; i++) {
      const ax = (i / SEG_U) * worldMaxX;
      const blend = i <= kBlend ? sstep(i / kBlend) : 1;     // 0 at root → 1 at kBlend
      for (let j = 0; j <= SEG_V; j++) {
        const k = i * (SEG_V + 1) + j;
        const v = SEG_V > 0 ? j / SEG_V : 0;
        // THE SHARED-VERTEX WELD: the exact body seam point for this chord param.
        const seamPt = seamPointAt(seam, v);
        if (i === 0) {
          // root column = EXACT copy of the body seam vertex → ZERO gap.
          pos.setX(k, seamPt.p.x); pos.setY(k, seamPt.p.y); pos.setZ(k, seamPt.p.z);
        } else if (blend < 1) {
          // inner columns smoothstep-blend from the seam toward the natural shape.
          pos.setX(k, seamPt.p.x + (pos.getX(k) - seamPt.p.x) * blend);
          pos.setY(k, seamPt.p.y + (pos.getY(k) - seamPt.p.y) * blend);
          pos.setZ(k, seamPt.p.z + (pos.getZ(k) - seamPt.p.z) * blend);
        }
        // junctionSkin: root column + thin root band → bodyRoot (welded to the
        // static body, identical weight to the body originals → frozen relationship);
        // outboard → the span gradient.
        let s;
        if (i === 0) {
          s = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
        } else if (i <= kBlend) {
          const span = spanSkin(side, ax);
          const toBody = 1 - sstep(i / kBlend);              // 1 at seam → 0 at kBlend
          if (span.si[0] === BONE.BODY) {
            // already a body→shoulder blend; bias it more toward bodyRoot near the seam
            const wB = toBody + (1 - toBody) * span.sw[0];
            s = { si: [BONE.BODY, span.si[1], 0, 0], sw: [wB, 1 - wB, 0, 0] };
          } else {
            const wB = toBody;
            s = { si: [BONE.BODY, span.si[0], 0, 0], sw: [wB, 1 - wB, 0, 0] };
          }
        } else {
          s = spanSkin(side, ax);
        }
        si[k * 4] = s.si[0]; si[k * 4 + 1] = s.si[1];
        si[k * 4 + 2] = s.si[2]; si[k * 4 + 3] = s.si[3];
        sw[k * 4] = s.sw[0]; sw[k * 4 + 1] = s.sw[1];
        sw[k * 4 + 2] = s.sw[2]; sw[k * 4 + 3] = s.sw[3];
      }
    }
    pos.needsUpdate = true;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    g.computeVertexNormals();
    return g;
  }

  // ── FINGER struts — slim tubes from the wrist through the membrane to the tips ─
  // Sample the membrane surface (the buildSkinnedRibs pattern), lift along the
  // normal, weight to wrist/elbow so they articulate. They give the scalloped
  // dragon-wing read. Merged into the membrane mesh (so they share its skeleton).
  function buildFingers(memGeo, side) {
    const pos = memGeo.attributes.position, nrm = memGeo.attributes.normal;
    const lift = 0.03 * ws;
    const sample = (i, j) => {
      const k = i * (SEG_V + 1) + j;
      const n = new THREE.Vector3(nrm.getX(k), nrm.getY(k), nrm.getZ(k)).normalize();
      const p = new THREE.Vector3(pos.getX(k), pos.getY(k), pos.getZ(k)).addScaledVector(n, lift);
      // articulate to wrist/elbow by span position along the arm.
      const ax = Math.abs(p.x - attach.wingRoot(side).x);
      return { p, n, sk: spanSkin(side, ax) };
    };
    // a finger = a downsampled centreline from a wrist-side column out to the tip.
    const wristCol = Math.max(1, Math.round(SEG_U * (wristXGeo / worldMaxX)));
    const geos = [];
    const finger = (jRow, i0) => {
      const stations = seg(6);
      const centre = [], radii = [], skin = [];
      for (let s = 0; s < stations; s++) {
        const i = Math.round(i0 + (SEG_U - i0) * s / (stations - 1));
        const smp = sample(i, jRow);
        centre.push(smp.p);
        radii.push(0.028 + (0.008 - 0.028) * (s / (stations - 1)));   // ≈0.02 average, taper to tip
        skin.push(smp.sk);
      }
      const tube = skinnedTube(centre, radii, seg(4), (s) => skin[s], fingerMat);
      return tube.geometry;
    };
    // 3-4 fingers radiating to the trailing tips (interior chord rows).
    const rows = SEG_V >= 4 ? [Math.round(SEG_V * 0.34), Math.round(SEG_V * 0.62), Math.round(SEG_V * 0.86)] : [Math.round(SEG_V * 0.5)];
    for (const j of rows) geos.push(finger(j, wristCol));
    return geos;
  }

  const memR = buildMembraneSide(armR, seamR);
  const memL = buildMembraneSide(armL, seamL);
  const fingersR = buildFingers(memR, 1);
  const fingersL = buildFingers(memL, -1);
  // merge L+R membrane + all fingers into ONE skinned mesh (membrane material).
  // Fingers wear fingerMat, but a single mesh has ONE material — so the fingers
  // ride the membrane geometry's vertex colours; to keep the scalloped strut read
  // crisp we DON'T merge fingers into the translucent membrane. Instead we build a
  // SEPARATE opaque finger mesh on the same skeleton (one extra draw call).
  const memGeo = mergeGeometries([ensureSkinAttrs(memR), ensureSkinAttrs(memL)], false);
  if (!memGeo) throw new Error('buildOrganism: membrane mergeGeometries returned null');
  memGeo.computeVertexNormals();
  const memMesh = new THREE.SkinnedMesh(memGeo, wingMat);
  memMesh.frustumCulled = false;
  memMesh.name = 'organismMembrane';

  const fingerGeo = mergeGeometries([...fingersR, ...fingersL].map((g) => ensureSkinAttrs(g)), false);
  let fingerMesh = null;
  if (fingerGeo) {
    fingerGeo.computeVertexNormals();
    fingerMesh = new THREE.SkinnedMesh(fingerGeo, fingerMat);
    fingerMesh.frustumCulled = false;
    fingerMesh.name = 'organismFingers';
  }

  // ── tip markers (trail spawn) — children of the wrist bones ───────────────
  const mkMarker = (arm) => {
    const mk = new THREE.Object3D();
    mk.position.set(
      wingSpec.tips[0][0] * 1.34 * ws * arm.side - wristXGeo * arm.side,
      archLift(maxX, maxX, arc, ws) - wristLift, -wingSpec.tips[0][1]);
    arm.wrist.add(mk);
    return mk;
  };
  const tipMarkerR = mkMarker(armR);
  const tipMarkerL = mkMarker(armL);

  // ── assemble + bind (L2 local-space order) ───────────────────────────────
  group.add(bodyRoot);
  group.add(armL.shoulder);
  group.add(armR.shoulder);
  group.add(hullMesh);
  group.add(memMesh);
  if (fingerMesh) group.add(fingerMesh);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  hullMesh.bind(skeleton);
  memMesh.bind(skeleton);
  if (fingerMesh) fingerMesh.bind(skeleton);

  return {
    group,
    parts: {
      wingPivotL: armL.shoulder, wingPivotR: armR.shoulder,
      wingTipL: armL.wrist, wingTipR: armR.wrist,
      tipMarkerL, tipMarkerR,
      wingPivot2L: null, wingPivot2R: null,
      wingRigL: { shoulder: armL.shoulder, elbow: armL.elbow, wrist: armL.wrist, side: -1, profile: model.flapProfile || null },
      wingRigR: { shoulder: armR.shoulder, elbow: armR.elbow, wrist: armR.wrist, side: 1, profile: model.flapProfile || null },
    },
    wingMat,
    spineMats,
  };
}

registerWings('organismWings', (def, model, attach, giM) => buildOrganism(def, model, attach, giM));

export { buildOrganism, DRAKE_PROFILE };
