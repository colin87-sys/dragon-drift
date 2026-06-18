import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import {
  wingSpecFor, buildCurvedPatch, buildWingShape, applyWingGradient, archLift,
} from './dragonParts.js';
import { registerWings, registerTorso } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube } from './dragonSweep.js';
import { buildTorso } from './dragonTorso.js';
import { sweepProfile } from './dragonSweep.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

// ── CLEAN-SHEET ORGANISM HULL ───────────────────────────────────────────────
// Increment 2a (LEAPFROG L25 FORK) → 2a-v2 (L27, this pass): a NEW creature whose
// body + wings (and later neck/head/tail) are generated TOGETHER as one continuous
// skinned hull, with NO legacy-body coupling. This SUPERSEDES dragonUnifiedHull.js
// (v1), which welded the new wing onto Obsidian's legacy arrow-loft and left a ~0.43
// rest-pose gap that detached on the bank.
//
// THE KEY IDEA — SHARED VERTICES, NOT SAMPLING.
// The membrane root-column verts are EXACT COPIES of the body loft's OWN wing-seam
// vertices — the wing literally grows out of the body surface, so there is ZERO gap
// by construction. Both the seam verts and their body originals are weighted 100% to
// the same static `bodyRoot` bone, so they stay coincident in ANY motion (the
// relationship is frozen — L25's "shared-static-frame is the actual invariant").
//
// THIS PASS (the human's rear-cam feedback on obsidian2):
//   A. ORGANIC BODY — the body had ARROW's 8-pt bladeRing → a faceted octagonal
//      loft (robotic). Now it has its OWN smooth 16-point super-ellipse drake
//      section (round at HIGH, not faceted) + ~13 fleshy stations (tapered neck,
//      chest swell, belly, haunches, smooth tail taper) so it reads as muscle.
//   B. SLIM ARM — the deltoid swell is gone; the arm is a thin VERTICALLY-FLATTENED
//      blade spar (≈0.10 socket → 0.035 wrist, vertical axis squashed ~0.55).
//   C. FINGERS RADIATE — each finger is a strut from the WRIST out to a wing scallop
//      TIP (wingSpec.tips[i]), lying along the membrane toward the scallop points.
//   D. CONTIGUOUS SEAM — findSeam walks ONE upper-flank ring index across the
//      shoulder stations inside the wing-root z-window, front→back, no zig-zag, so
//      the WHOLE root chord (front, MIDDLE, back) maps onto a connected path of real
//      body verts and the middle no longer lifts off.
//
// Topology, on ONE 7-bone skeleton [bodyRoot, shL,elL,wrL, shR,elR,wrR]:
//   · opaque HULL  = body loft (→ bodyRoot) MERGED with two slim flattened ARM
//                    spars → ONE body-material draw call.
//   · membrane     = both wings' curved patches, root column = the EXACT body seam
//                    verts, inner columns smoothstep-blended out to the natural wing
//                    shape, root band → bodyRoot, outboard → shoulder/elbow/wrist.
//   · fingers      = slim struts from the wrist to the scallop tips (skinned to
//                    wrist/elbow) → the scalloped dragon-wing read.

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// ── ORGANIC DRAKE SECTION (A) ────────────────────────────────────────────────
// A smooth 16-point super-ellipse drake belly/keel section — its OWN section, NOT
// ARROW's 8-pt bladeRing. Ordered CCW looking toward -z (keel apex on top), so
// face winding points outward. Super-ellipse exponent >2 gives a fuller, rounder
// belly + flanks than a circle and far rounder than the octagon — the body reads
// ROUND at HIGH instead of faceted. sweepProfile resamples it as a closed
// Catmull-Rom at seg(): 22 control pts → 22-gon at HIGH (rounder), denser at ULTRA.
const SECTION_N = 22;
function drakeSection(w, top, bot) {
  const pts = [];
  const ex = 2.3;                                   // >2 = fuller belly + flanks
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  for (let i = 0; i < SECTION_N; i++) {
    const a = (i / SECTION_N) * Math.PI * 2 + Math.PI / 2; // i=0 → top (+y), CCW
    const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
    pts.push([sx * w, sy * (sy >= 0 ? top : bot)]);
  }
  return pts;
}

// ── A clean SLEEK DRAKE profile, decoupled from the shipped roster ───────────
// OUR OWN body plan — it owns its section + stations, cannot drift the roster, and
// a future neck/tail/head can reshape it freely. ~13 stations (NOT ARROW's 8) shape
// a creature silhouette with no longitudinal facets: a tapered neck → fore-shoulder
// → a chest/shoulder SWELL (broadest+tallest, clustered for a dense wing-root seam)
// → thorax → belly → haunches → a smooth taper into the slim tail root.
const DRAKE_PROFILE = {
  zHold: 0,
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.27,
  tailAnchorZ: 1.18,
  ring: drakeSection,
  stations: [
    [-3.05, 0.12, 0.09, 0.10], // neck cap (meets the neck chain)
    [-2.55, 0.22, 0.17, 0.18], // neck base — slimmer
    [-1.95, 0.34, 0.27, 0.26], // lower neck → shoulder lead-in
    [-1.45, 0.44, 0.37, 0.33], // fore-shoulder (wing-root chord front)
    [-1.05, 0.50, 0.43, 0.38], // shoulder rise
    [-0.65, 0.53, 0.45, 0.40], // shoulder/chest peak — sleeker (was 0.64)
    [-0.30, 0.51, 0.43, 0.39], // chest (wing-root centre)
     [0.05, 0.44, 0.37, 0.35], // thorax
     [0.45, 0.35, 0.30, 0.29], // WAIST pinch — a clear narrowing
     [0.85, 0.29, 0.25, 0.24], // mid-body
     [1.20, 0.23, 0.20, 0.17], // haunches
     [1.50, 0.18, 0.17, 0.13], // hip taper
     [1.70, 0.14, 0.14, 0.09], // slim tail root
  ],
  keel: [[-2.55, 0.17], [-0.65, 0.45], [-0.30, 0.43], [0.05, 0.37], [0.45, 0.30], [0.85, 0.25], [1.20, 0.20], [1.70, 0.14]],
  wingRoot: { x: 0.46, y: 0.49, z: -0.45 }, // on the back over the (now slimmer) shoulder; lowered to track the reshape
  fairing: { r: 0.3, scale: [0.86, 0.78, 1.2], pos: [0.46, 0.54, -0.4] },
  neck: {
    rBase: 0.44, rStep: 0.045, rMin: 0.19, scale: [0.8, 0.66, 1.3],
    y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: -3.08 - (neckSegs - 4) * 0.34 }),
};

// CINDERVALE HULL PROFILE — a fresh whole-hull body for the fire starter, built
// for organismWings' shared-vertex body↔wing weld. It is NOT the Night-Fury
// drake profile and NOT the legacy arrow body: the chest is a short forward
// crucible, the shoulders are high and wide, the waist pinches hard, and the
// afterbody runs into a long rudder-tail boom. The membrane still uses the same
// anatomical idea (root → wrist → fingers), but it grows from this hull's seam.
const CINDER_HULL_PROFILE = {
  zHold: -0.35,
  tailShiftRefZ: 2.05,
  tailAnchorY: 0.23,
  tailAnchorZ: 1.42,
  ring: drakeSection,
  stations: [
    [-3.18, 0.12, 0.08, 0.10],
    [-2.55, 0.23, 0.17, 0.18],
    [-1.78, 0.48, 0.42, 0.34],
    [-1.18, 0.74, 0.66, 0.48],
    [-0.62, 0.68, 0.58, 0.44],
    [ 0.02, 0.40, 0.34, 0.30],
    [ 0.70, 0.32, 0.27, 0.23],
    [ 1.35, 0.29, 0.24, 0.19],
    [ 2.05, 0.18, 0.16, 0.11],
  ],
  keel: [[-2.55, 0.17], [-1.18, 0.66], [-0.62, 0.58], [0.02, 0.34], [0.70, 0.27], [1.35, 0.24], [2.05, 0.16]],
  wingRoot: { x: 0.56, y: 0.66, z: -0.62 },
  fairing: { r: 0.34, scale: [1.0, 0.82, 1.34], pos: [0.54, 0.64, -0.7] },
  neck: {
    rBase: 0.42, rStep: 0.04, rMin: 0.19, scale: [0.82, 0.70, 1.18],
    y0: 0.32, yStep: 0.078, z0: -2.1, zStep: -0.34, wobbleAmp: 0.06, wobbleFreq: 0.9,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.54 + (neckSegs - 4) * 0.085, z: -3.12 - (neckSegs - 4) * 0.33 }),
};

// organismTorso — the body-less peer for the clean-sheet hull. Builds the neck +
// publishes the full attach contract (incl. attach.loft, the body-loft GENERATOR, +
// attach.bodyMatDouble), but adds NO body mesh + NO fairings: organismWings grows
// the body surface itself from attach.loft and welds the membrane to it as one
// continuous skin. Uses sweepProfile so the body rounds on ULTRA (passes the OWN
// drakeSection as the ring). Registered as a wings-slot peer.
registerTorso('organismTorso', (def, model, bodyMat) =>
  buildTorso(DRAKE_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfile({ ...profile, ring: profile.ring || drakeSection }, stretch),
    { bodyMesh: false }));
registerTorso('cinderHullTorso', (def, model, bodyMat) =>
  buildTorso(CINDER_HULL_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfile({ ...profile, ring: profile.ring || drakeSection }, stretch),
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
// field (each part already carries its own skinIndex/skinWeight). A future neck/
// tail/head caller reuses it verbatim.
function growSkinnedExtension(loftGeo, extensions) {
  const parts = [ensureSkinAttrs(loftGeo)];
  for (const e of extensions) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('growSkinnedExtension: mergeGeometries returned null (attribute mismatch)');
  return merged;
}

// ── CONTIGUOUS seam-copy weld (D — the SHARED-VERTEX mechanism) ───────────────
// Identify the body loft's WING-SEAM vertices as a CONTIGUOUS arc of ONE upper-flank
// ring index, walked across the SHOULDER stations whose z lies in the wing-root
// chord window — front→back along z, NO duplicates, NO zig-zag (the v1 weave sorted
// two rings by z, which fanned the root edge in y and over-wide in z, lifting the
// middle off the body). sweepProfile lays the loft as `station*m + ringPos`, so a
// seam vertex's index is fully determined by (station, ringPos).
//
// drakeSection is ordered CCW from the keel apex (i=0 = top): walking up toward the
// apex, the UPPER-RIGHT flank is the high indices (≈N-3 = N*13/16), the UPPER-LEFT
// flank the low indices (≈N*3/16). At HIGH m===SECTION_N so the control ring index
// IS the stored column; at LOW/ULTRA the ring is resampled (closed Catmull-Rom:
// control c → column round(c/N * m)) — map onto the nearest resampled column so the
// chain still lands on actual loft verts.
//
// The chain is the EXACT loft verts (index + group-space position), ordered front→
// back; the membrane root column copies entries VERBATIM, so each root vert IS a
// body loft vert (zero gap by construction) and both are weighted to the same static
// bodyRoot bone (frozen relationship under any motion).
function findSeam(loftGeo, profile, side, m) {
  // upper-flank ring index for this side (just below the keel — where a wing roots).
  const ctrlFlank = side > 0 ? Math.round(SECTION_N * 13 / 16) : Math.round(SECTION_N * 3 / 16);
  // For HIGH m===SECTION_N, so the control index IS the column. Else map control →
  // nearest resampled column (closed loop).
  const colFor = (ctrl) => (m === SECTION_N ? ctrl : (((Math.round((ctrl / SECTION_N) * m) % m) + m) % m));
  const col = colFor(ctrlFlank);
  const pos = loftGeo.attributes.position;

  // wing-root chord window centred on wingRoot.z, half-width ≈ the rootChord so the
  // chain spans (and only spans) the actual root chord — the middle no longer reaches
  // into far-off z. Find the stations whose z falls in [zLo, zHi], plus the immediate
  // neighbours so the chain fully covers the chord end-to-end.
  const wr = profile.wingRoot;
  const half = 0.62;                                  // ≈ widest rootChord (Eternal 0.85·0.5) + margin
  const zLo = wr.z - half, zHi = wr.z + half;
  const stations = profile.stations;
  // station indices whose z is inside the window, in profile order (already front→back).
  let first = -1, last = -1;
  for (let s = 0; s < stations.length; s++) {
    if (stations[s][0] >= zLo && stations[s][0] <= zHi) { if (first < 0) first = s; last = s; }
  }
  // widen by one station each side so the chord is fully bracketed (covers the very
  // front + back of the membrane root chord, never short of it).
  if (first > 0) first--;
  if (last < stations.length - 1) last++;

  // loftGeo is passed ALREADY translated to y=TORSO_Y, so read verts verbatim (group
  // space) — no extra offset (the v1 double-offset bug, impossible here).
  const chain = [];
  for (let s = first; s <= last; s++) {
    const idx = s * m + col;
    chain.push({ idx, p: new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)) });
  }
  // chain is already front→back (stations ordered by z) — a clean contiguous arc.
  return { chain, col, first, last };
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
  // Finger struts read as SUBTLE DARK STRUCTURE (L31): a near-black matte material
  // just above the body tone (no horn-tan, no glow, no metallic sheen) so the spars
  // disappear into the sleek matte-black wing instead of reading as a lit/metallic
  // skeleton. emissive ~0, metalness 0, high roughness.
  const fingerCol = def.body ?? 0x0a0f1c;
  const fingerMat = new THREE.MeshStandardMaterial({
    color: fingerCol, emissive: fingerCol, emissiveIntensity: 0.04,
    roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide,
  });

  // ── build the body loft + record the wing-seam verts (the shared-vert source) ─
  // Computed BEFORE the bones so the arm can ROOT ON the membrane seam line (B3).
  const loft = attach.loft;
  const TY = loft.TORSO_Y;
  const profile = loft.profile;
  const loftGeo = loft.makeGeo();
  loftGeo.translate(0, TY, 0);                          // body sits at y=TORSO_Y
  const m = seg(SECTION_N);                              // loft ring resolution
  const seamR = findSeam(loftGeo, profile, 1, m);
  const seamL = findSeam(loftGeo, profile, -1, m);

  // B3 — ARM + MEMBRANE FROM ONE LINE: the membrane roots ON the seam chain (the
  // upper-flank loft verts at the wing-root chord). Root the arm's first ring on the
  // SAME line by anchoring the shoulder bone's y/z to the seam chain CENTROID, so the
  // arm spar and the membrane grow from one seam, not from two different heights.
  // (x stays profile.wingRoot.x so the arm still emerges from the flank, not the
  // keel.) The zero-gap membrane↔body weld is unaffected — it copies the same verts.
  function seamCentroid(seam) {
    const c = new THREE.Vector3();
    for (const e of seam.chain) c.add(e.p);
    return c.multiplyScalar(1 / seam.chain.length);
  }
  const seamMidR = seamCentroid(seamR);
  const seamMidL = seamCentroid(seamL);
  const armRoot = (side) => {
    const wr = attach.wingRoot(side);
    const mid = side < 0 ? seamMidL : seamMidR;
    return { x: wr.x, y: mid.y, z: mid.z };             // y/z onto the seam line
  };

  // ── bones ───────────────────────────────────────────────────────────────
  const bodyRoot = new THREE.Bone();                    // static — holds every body vert
  const bones = [bodyRoot, null, null, null, null, null, null];
  function buildArmBones(side) {
    const wr = armRoot(side);
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

  // The membrane root chord copies the body seam chain VERBATIM. v∈[0,1] runs front→
  // back along the wing root chord; map it onto a chain entry and return that EXACT
  // loft vertex (position + index). No interpolation — each returned point IS a real
  // loft vert, so a membrane root vert set to it is coincident (zero gap) and, welded
  // to the same static bodyRoot, frozen relative to it under any motion.
  function seamPointAt(seam, v) {
    const chain = seam.chain;
    const k = Math.round(v * (chain.length - 1));
    const e = chain[Math.min(Math.max(k, 0), chain.length - 1)];
    return { p: e.p.clone(), idx: e.idx };
  }

  // ── SLIM, VERTICALLY-FLATTENED ARM SPAR (B), merged into the OPAQUE hull ───
  // A thin wing-bone blade shoulder→elbow→wrist — NOT a fat deltoid tube. A tiny
  // fuse-to-body bump at the very root ring so it merges into the hull, tapering to
  // a narrow wrist. The cross-section is FLATTENED vertically (the tube's up-axis
  // squashed ~0.55) so it reads as a blade-like spar (thinner top-to-bottom than
  // front-to-back), not a round tube. Root ring → bodyRoot; outboard → span gradient.
  const ARM_VFLAT = 0.55;                               // squash the vertical axis
  function buildArmFrame(arm) {
    const { wr, side } = arm;
    const r0 = 0.10 * (model.wingRootScale ?? 1);        // slim socket (no deltoid swell)
    const rWrist = 0.035;
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
      // a tiny fuse-to-body bump ONLY at the root ring (s=0), else a slim spar.
      const taper = r0 + (rWrist - r0) * sstep(t);
      const bump = s === 0 ? r0 * 0.28 : 0;
      radii.push(taper + bump);
      const ax = t * wristXGeo;
      skin.push(spanSkin(side, ax));
    }
    // root ring weighted fully to bodyRoot so the arm emerges FROM the body.
    skin[0] = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
    const tube = skinnedTube(centre, radii, seg(7), (s) => skin[s], hullMat);
    // FLATTEN the spar vertically: squash the y extent about each ring's centreline.
    // skinnedTube lays rings as centre + (side·cos + up·sin)·r; for this near-planar
    // arm `up` ≈ +y, so scaling y toward the centreline thins it top-to-bottom.
    const g = tube.geometry;
    const gp = g.attributes.position;
    for (let s = 0; s < N; s++) {
      const cy = centre[s].y;
      for (let j = 0; j < seg(7); j++) {
        const k = s * seg(7) + j;
        gp.setY(k, cy + (gp.getY(k) - cy) * ARM_VFLAT);
      }
    }
    gp.needsUpdate = true;
    g.computeVertexNormals();
    return g;
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

  // ── FINGER struts — slim tubes from the WRIST out to the wing SCALLOP TIPS (C) ─
  // The human's spec: the finger struts must RADIATE from the wrist to the wing's
  // scallop TIPS (the pointy trailing-edge points that define the wing outline), in
  // line with the long axis of the body — not run as constant chord ROWS. Each
  // finger is a strut from the wrist datum out to a wingSpec.tips[i] target, sampled
  // along that line and lifted just above the membrane surface, weighted to wrist/
  // elbow so it articulates. They align with the membrane's scallop notches.
  function buildFingers(arm) {
    const { wr, side } = arm;
    // B3 (L31): LESS lift — the spars ride closer to the membrane, not floating over
    // it, so they read as wing FINGERS embedded in the web, not a hovering frame.
    const lift = 0.018 * ws;
    // wrist datum in group space (where the fingers fan from).
    const wristP = new THREE.Vector3(wr.x + wristXGeo * side, wr.y + wristLift, wr.z);
    // map a wing-shape point [sx, sy] (buildWingShape space) → group space, matching
    // the membrane's transform: world x = sx·scaleX·side + wr.x, world z = -sy·scaleZ
    // + wr.z, world y = arc lift at that span (+ wr.y).
    const scaleX = 1.34 * ws, scaleZ = model.wingChord ?? 1;
    const tipToGroup = (sx, sy) => {
      const wx = sx * scaleX;                               // wing-local span (world units)
      const liftY = archLift(wx, worldMaxX, arc, ws);
      return new THREE.Vector3(wx * side + wr.x, liftY + wr.y, -sy * scaleZ + wr.z);
    };
    const tips = wingSpec.tips;                             // [ [x span, y chord], ... ]
    const geos = [];
    const finger = (tip) => {
      const target = tipToGroup(tip[0], tip[1]);
      const stations = seg(6);
      const centre = [], radii = [], skin = [];
      for (let s = 0; s < stations; s++) {
        const t = s / (stations - 1);
        const p = wristP.clone().lerp(target, t);
        // lift the strut just above the membrane (toward +y) so it rides the surface.
        p.y += lift * Math.sin(Math.PI * Math.min(t, 0.85));
        centre.push(p);
        // B3 (L31): THICKER at the wrist base, tapering to a FINE point at the scallop
        // tip (cubic falloff so most of the spar stays slim but the root reads solid),
        // so each finger reads as a wing spar fanning from the wrist to a scallop point.
        radii.push(0.050 + (0.0035 - 0.050) * (t * t * (3 - 2 * t)));
        // articulate by span position along the arm.
        const ax = Math.abs(p.x - wr.x);
        skin.push(spanSkin(side, ax));
      }
      const tube = skinnedTube(centre, radii, seg(4), (s) => skin[s], fingerMat);
      return tube.geometry;
    };
    // 3-4 fingers radiating to the trailing scallop tips. tips[0] is the far leading
    // tip (the wing's outer point); the scallop tips are tips[1..] (the pointy
    // trailing-edge points). Take up to the inner tips so each finger lines up with a
    // scallop notch. Always include the outer leading tip for the long leading finger.
    const targets = [tips[0]];
    for (let i = 1; i < tips.length && targets.length < 4; i++) targets.push(tips[i]);
    for (const t of targets) geos.push(finger(t));
    return geos;
  }

  const memR = buildMembraneSide(armR, seamR);
  const memL = buildMembraneSide(armL, seamL);
  const fingersR = buildFingers(armR);
  const fingersL = buildFingers(armL);
  // merge L+R membrane into ONE translucent skinned mesh (membrane material). The
  // fingers wear an opaque bone material, so they CANNOT share the translucent
  // membrane mesh (one mesh = one material); they build a SEPARATE opaque finger mesh
  // on the SAME skeleton (one extra draw call) so the scalloped strut read stays crisp.
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
registerWings('cinderHullWings', (def, model, attach, giM) => buildOrganism(def, model, attach, giM));

export { buildOrganism, DRAKE_PROFILE, CINDER_HULL_PROFILE, drakeSection };
