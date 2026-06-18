import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import {
  wingSpecFor, buildCurvedPatch, applyWingGradient, archLift,
} from './dragonParts.js';
import { registerWings, registerTorso, registerHead, registerTail } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube, sweepProfileSmooth } from './dragonSweep.js';
import { buildTorso } from './dragonTorso.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

// ── NIGHT FURY ("Toothless") ORGANISM HULL ──────────────────────────────────
// FORKED from dragonOrganism.js (obsidian2, LEAPFROG L26–L31), which SOLVED the
// body↔wing connection (zero-gap shared-vertex weld) but whose BODY the human
// abandoned (L32): it still reads metallic. The cause is GEOMETRY + TOPOLOGY, not
// material — so this is a FRESH body+wings on the same proven kernel, NOT a patch.
// obsidian2 + obsidian v1 stay byte-identical for rollback.
//
// THREE infra upgrades over the organism (the L32 fresh-take list):
//   1. SMOOTH BODY (no "metallic rings"). The body loft is built with
//      sweepProfileSmooth (longitudinal Catmull-Rom resample) so it is smooth ALONG
//      z, not just around — the loft banding that read as polished metal is gone.
//   2. ONE-SURFACE READ. After the (already zero-gap) position weld, the hull and
//      membrane SHARE seam normals so the lighting is continuous across the
//      opaque↔translucent material boundary (no shading break at the wing root).
//   3. FINGER TO EVERY SCALLOP. The finger struts fan from the wrist to EVERY wing
//      scallop tip (not a capped subset), so each scallop notch reads as a spar.
//
// KEEP from the organism (unchanged kernel): COPY-the-boundary weld (the membrane
// root verts ARE the body loft's own wing-seam verts → zero gap by construction;
// both weighted 100% to the static bodyRoot bone → frozen under any motion), the
// 7-bone skeleton [bodyRoot, shL,elL,wrL, shR,elR,wrR], the fleshy flattened arm
// spar, the translucent membrane, the rig contract, the matte-hide finish kit.
//
// ANATOMY NOTE: the body PROFILE + per-form wing outline (dragons.js#toothless) are
// authored to match the Toothless reference imagery (sleek matte-black Night Fury,
// big bat wings, slim body, twin tail fins). Head/neck/tail stay on the legacy
// modules in THIS increment; they become hull-grown extensions in I2/I3.

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// ── NIGHT-FURY SECTION ───────────────────────────────────────────────────────
// Its OWN smooth super-ellipse drake section (round at HIGH, not faceted). Ordered
// CCW from the keel apex (i=0 = top, +y) so face winding points outward and the
// upper-flank seam index is deterministic (used by findSeam). The longitudinal
// spline (sweepProfileSmooth) rounds it ALONG z; this rounds it AROUND.
const SECTION_N = 20;
function nfSection(w, top, bot) {
  const pts = [];
  const ex = 2.15;                                   // >2 = fuller, rounder flanks
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  for (let i = 0; i < SECTION_N; i++) {
    const a = (i / SECTION_N) * Math.PI * 2 + Math.PI / 2; // i=0 → top (+y), CCW
    const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
    pts.push([sx * w, sy * (sy >= 0 ? top : bot)]);
  }
  return pts;
}

// ── NIGHT-FURY BODY PLAN ─────────────────────────────────────────────────────
// A sleek Toothless silhouette: tapered neck → fore-shoulder → a modest chest/
// shoulder swell (the broadest point, clustered for a dense wing-root seam) → a
// clear waist pinch → slim haunches → a smooth taper into the slim tail root.
// `longSamples` drives the longitudinal resample (smooth, no rings). The roster is
// untouched — this profile owns its own section + stations.
const NIGHTFURY_PROFILE = {
  zHold: 0,
  longSamples: 54,                                  // smooth lengthwise (no facets), nose-to-tail
  tailShiftRefZ: 1.70,
  tailAnchorY: 0.27,
  tailAnchorZ: 1.18,
  ring: nfSection,
  // ONE continuous loft NOSE-TO-TAIL (the L1/L32 ideal): the head (blunt snout →
  // cranium), neck, body, and tail are all stations of the SAME surface — zero seams
  // by construction (no welded tubes). Near-zero end stations close the nose + tail
  // tip. The wing welds onto the shoulder stations (z≈-0.45); eyes/ear-flaps/tail-fins
  // are the only add-ons. Stations authored to the Toothless reference (verify on the
  // chase-cam preview): big-cheeked rounded head, slim neck pinch, chest swell, waist,
  // long slim tail.
  // station = [z, halfWidth, keelTop, belly, cy] — cy is the CENTRELINE lift (5th
  // channel, default 0): the head rides UP on a curved neck and the tail droops, so
  // the side silhouette reads as a posed dragon, not a flat horizontal plank.
  stations: [
    // ── HEAD: blunt snout → wide cranium (big cheeks, no horns), lifted ──
    [-5.02, 0.030, 0.030, 0.030,  0.30], // nose cap (near-point, blunt)
    [-4.86, 0.120, 0.100, 0.120,  0.33], // snout / muzzle (rounded blunt)
    [-4.62, 0.195, 0.165, 0.180,  0.35], // upper jaw
    [-4.34, 0.300, 0.278, 0.250,  0.37], // cranium — widest head
    [-4.06, 0.300, 0.286, 0.250,  0.35], // cranium back / cheeks
    [-3.74, 0.200, 0.185, 0.175,  0.28], // skull base
    [-3.42, 0.150, 0.135, 0.130,  0.18], // head→neck
    // ── NECK: a slim pinch curving down to the shoulder ──
    [-3.05, 0.115, 0.095, 0.105,  0.09], // neck (slimmest)
    [-2.55, 0.200, 0.160, 0.170,  0.03], // neck base
    [-1.95, 0.320, 0.260, 0.250,  0.00], // lower neck → shoulder lead-in
    // ── BODY: shoulder/chest swell → waist → haunch (level) ──
    [-1.45, 0.420, 0.360, 0.320,  0.00], // fore-shoulder (wing-root chord front)
    [-1.05, 0.480, 0.420, 0.370,  0.00], // shoulder rise
    [-0.65, 0.510, 0.440, 0.390,  0.00], // shoulder/chest peak — sleek
    [-0.30, 0.490, 0.420, 0.380,  0.00], // chest (wing-root centre)
     [0.05, 0.420, 0.360, 0.340,  0.00], // thorax
     [0.45, 0.330, 0.290, 0.280, -0.01], // WAIST pinch
     [0.85, 0.270, 0.240, 0.230, -0.03], // mid-body
     [1.20, 0.250, 0.230, 0.195, -0.05], // haunches (powerful)
     [1.50, 0.225, 0.212, 0.178, -0.08], // tail base — THICK + muscular
    // ── TAIL: THICK + powerful, SHORTER (was long/thin) → fin zone at the END → point ──
     [1.85, 0.195, 0.186, 0.156, -0.11],
     [2.25, 0.165, 0.158, 0.132, -0.15],
     [2.70, 0.132, 0.127, 0.106, -0.18],
     [3.15, 0.098, 0.095, 0.080, -0.20], // tail-fin attach zone (near the end now)
     [3.60, 0.058, 0.058, 0.050, -0.21],
     [3.95, 0.014, 0.014, 0.014, -0.20], // tail tip (near-point) — tail ends here
  ],
  keel: [[-4.34, 0.278], [-3.74, 0.185], [-3.05, 0.095], [-0.65, 0.44], [-0.30, 0.42], [0.05, 0.36], [0.45, 0.29], [0.85, 0.24], [1.20, 0.19], [1.70, 0.13], [3.50, 0.056]],
  wingRoot: { x: 0.45, y: 0.48, z: -0.45 }, // high on the back over the shoulder
  fairing: { r: 0.3, scale: [0.86, 0.78, 1.2], pos: [0.46, 0.54, -0.4] },
  neck: {
    rBase: 0.42, rStep: 0.045, rMin: 0.18, scale: [0.8, 0.66, 1.3],
    y0: 0.3, yStep: 0.085, z0: -2.0, zStep: -0.36, wobbleAmp: 0.1, wobbleFreq: 0.8,
  },
  headBase: (neckSegs) => ({ x: 0, y: 0.5 + (neckSegs - 4) * 0.09, z: -3.08 - (neckSegs - 4) * 0.34 }),
};

// nightFuryTorso — the body-less peer for the smooth hull. Builds the (legacy, this
// increment) neck + publishes the full attach contract (attach.loft generator +
// attach.bodyMatDouble) but NO body mesh: nightFuryWings grows the body itself from
// attach.loft (with sweepProfileSmooth) and welds the membrane to it as one skin.
registerTorso('nightFuryTorso', (def, model, bodyMat) =>
  buildTorso(NIGHTFURY_PROFILE, def, model, bodyMat,
    (profile, stretch) => sweepProfileSmooth({ ...profile, ring: profile.ring || nfSection }, stretch),
    { bodyMesh: false, neck: false }));

// Legacy parts OFF for the phased Night-Fury build (Increment 1, human directive):
// the neck/head/tail must GROW from the hull (copy the boundary ring → extension),
// so the hull is built first and they arrive in I2/I3. Until then the Night Fury
// renders body+wings ONLY — no bolted draconic head / lilypad tail ever shown.
// Empty builders return the exact shapes dragonModel.js consumes (head: group +
// spineMats; tail: group + length-guarded segs/tailFins). Generic + reusable.
registerHead('none', () => ({ group: new THREE.Group(), spineMats: [] }));
registerTail('none', () => ({ group: new THREE.Group(), segs: [], tailFins: [] }));

// Ensure a geometry carries the four hull attributes so mergeGeometries (which needs
// identical attribute SETS) never returns null (the L13 null-merge guard).
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

// Merge a base loft with skinned extension grids/tubes into ONE skinned geometry
// with a continuous weight field (each part carries its own skinIndex/skinWeight).
function growSkinnedExtension(loftGeo, extensions) {
  const parts = [ensureSkinAttrs(loftGeo)];
  for (const e of extensions) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('growSkinnedExtension: mergeGeometries returned null (attribute mismatch)');
  return merged;
}

// ── CONTIGUOUS seam-copy weld, SMOOTH-LOFT aware ──────────────────────────────
// Identify the body loft's WING-SEAM vertices as a CONTIGUOUS arc of ONE upper-flank
// ring index, walked across the resampled RINGS whose z lies in the wing-root chord
// window — front→back, no zig-zag. UNLIKE the organism (which walked the original
// STATIONS), the smooth loft has `longCount` resampled rings, so we walk
// loftGeo.userData.loftRings (the resampled ring zs + the section count). The denser
// rings give a smoother, finer root edge for free. sweepProfileSmooth lays the loft
// as `ring*section + ringPos`, so a seam vertex's index is fully determined.
function findSeam(loftGeo, profile, side) {
  const lr = loftGeo.userData.loftRings;
  if (!lr) throw new Error('nightFuryWings require a sweepProfileSmooth loft (userData.loftRings)');
  const m = lr.section;
  // upper-flank ring index for this side (just below the keel apex). nfSection is CCW
  // from the apex (i=0 = top): upper-right flank = high indices (≈N*13/16), upper-left
  // = low indices (≈N*3/16). At HIGH m===SECTION_N (the control index IS the column);
  // at LOW/ULTRA the ring is resampled → map onto the nearest resampled column.
  const ctrlFlank = side > 0 ? Math.round(SECTION_N * 13 / 16) : Math.round(SECTION_N * 3 / 16);
  const col = (m === SECTION_N) ? ctrlFlank : (((Math.round((ctrlFlank / SECTION_N) * m) % m) + m) % m);
  const pos = loftGeo.attributes.position;

  // wing-root chord window centred on wingRoot.z (half-width ≈ the widest rootChord).
  const wr = profile.wingRoot;
  const half = 0.62;
  const zLo = wr.z - half, zHi = wr.z + half;
  let first = -1, last = -1;
  for (let r = 0; r < lr.count; r++) {
    if (lr.ringZ[r] >= zLo && lr.ringZ[r] <= zHi) { if (first < 0) first = r; last = r; }
  }
  // widen by one ring each side so the chord is fully bracketed.
  if (first > 0) first--;
  if (last < lr.count - 1) last++;

  // loftGeo is passed ALREADY translated to y=TORSO_Y, so read verts verbatim.
  const chain = [];
  for (let r = first; r <= last; r++) {
    const idx = r * m + col;
    chain.push({ idx, p: new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)) });
  }
  return { chain, col, first, last };
}

function buildNightFury(def, model, attach) {
  if (!attach.loft || !attach.bodyMatDouble) {
    throw new Error("nightFuryWings require a body-less night-fury torso (parts.torso:'nightFuryTorso' — it publishes attach.loft + attach.bodyMatDouble)");
  }
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale;
  const wingSpec = wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;

  // arm datums (mirror the shipped skinned wing so the bones land sensibly)
  const wristXGeo = (model.wingWristSpan ?? 3.3) * ws;
  const elbowXGeo = wristXGeo * 0.52;
  const foldBand = 0.7 * ws;
  const rootBand = elbowXGeo * 0.55;
  const SEG_U = seg(24), SEG_V = seg(6);
  const elbowLift = archLift(elbowXGeo, maxX, arc, ws);
  const wristLift = archLift(wristXGeo, maxX, arc, ws);
  // LEADING-EDGE SWEEP: in a real bat wing the arm runs along the FRONT of the wing
  // (shoulder at the body → wrist out at the leading edge near the tip), and the
  // fingers fan BACK from that wrist across the chord to the scalloped trailing edge.
  // The shoulder stays on the body seam; the elbow + wrist sweep FORWARD (−z) by
  // wingArmLeadChord (chord units) so the spar + finger-convergence ride the outer
  // front edge, not the middle of the membrane. Default 0 → the old mid-chord arm.
  const armLeadZ = -(model.wingArmLeadChord ?? 0) * (model.wingChord ?? 1);

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
  const hullMat = attach.bodyMatDouble;                 // body fresnel + cellular relief
  const fingerCol = def.body ?? 0x0a0f1c;
  const fingerMat = new THREE.MeshStandardMaterial({
    color: fingerCol, emissive: fingerCol, emissiveIntensity: 0.04,
    roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide,
  });
  // Night-Fury acid-GREEN eyes (the one bright accent on the matte-black hide).
  const eyeCol = def.eye ?? 0x96d62a;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeCol, emissive: eyeCol, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.0,
  });

  // ── build the body loft + record the wing-seam verts (the shared-vert source) ─
  const loft = attach.loft;
  const TY = loft.TORSO_Y;
  const profile = loft.profile;
  const loftGeo = loft.makeGeo();
  loftGeo.translate(0, TY, 0);                          // body sits at y=TORSO_Y
  const seamR = findSeam(loftGeo, profile, 1);
  const seamL = findSeam(loftGeo, profile, -1);

  // ARM + MEMBRANE FROM ONE LINE: root the arm's shoulder bone on the seam-chain
  // centroid (y/z) so the arm spar and the membrane grow from one seam line.
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
    return { x: wr.x, y: mid.y, z: mid.z };
  };

  // ── bones ───────────────────────────────────────────────────────────────
  const bodyRoot = new THREE.Bone();                    // static — holds every body vert
  const bones = [bodyRoot, null, null, null, null, null, null];
  function buildArmBones(side) {
    const wr = armRoot(side);
    const shoulder = new THREE.Bone();
    shoulder.position.set(wr.x, wr.y, wr.z);            // stays on the body seam
    const elbow = new THREE.Bone();
    elbow.position.set(elbowXGeo * side, elbowLift, armLeadZ * 0.5);   // sweep half-forward
    const wrist = new THREE.Bone();
    wrist.position.set((wristXGeo - elbowXGeo) * side, wristLift - elbowLift, armLeadZ * 0.5);
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

  // The membrane root chord copies the body seam chain VERBATIM (zero gap).
  function seamPointAt(seam, v) {
    const chain = seam.chain;
    const k = Math.round(v * (chain.length - 1));
    const e = chain[Math.min(Math.max(k, 0), chain.length - 1)];
    return { p: e.p.clone(), idx: e.idx };
  }

  // ── SLIM, VERTICALLY-FLATTENED ARM SPAR, merged into the OPAQUE hull ───────
  const ARM_VFLAT = 0.55;
  function buildArmFrame(arm) {
    const { wr, side } = arm;
    const r0 = 0.10 * (model.wingRootScale ?? 1);
    const rWrist = 0.035;
    const N = 7;
    const pSh = new THREE.Vector3(wr.x, wr.y, wr.z);
    const pEl = new THREE.Vector3(wr.x + elbowXGeo * side, wr.y + elbowLift, wr.z + armLeadZ * 0.5);
    const pWr = new THREE.Vector3(wr.x + wristXGeo * side, wr.y + wristLift, wr.z + armLeadZ);
    const centre = [], radii = [], skin = [];
    for (let s = 0; s < N; s++) {
      const t = s / (N - 1);
      let p;
      if (t <= 0.5) p = pSh.clone().lerp(pEl, t / 0.5);
      else p = pEl.clone().lerp(pWr, (t - 0.5) / 0.5);
      centre.push(p);
      const taper = r0 + (rWrist - r0) * sstep(t);
      const bump = s === 0 ? r0 * 0.28 : 0;
      radii.push(taper + bump);
      const ax = t * wristXGeo;
      skin.push(spanSkin(side, ax));
    }
    skin[0] = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
    const tube = skinnedTube(centre, radii, seg(7), (s) => skin[s], hullMat);
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
  hullMesh.name = 'nightFuryHull';

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
      const blend = i <= kBlend ? sstep(i / kBlend) : 1;
      for (let j = 0; j <= SEG_V; j++) {
        const k = i * (SEG_V + 1) + j;
        const v = SEG_V > 0 ? j / SEG_V : 0;
        const seamPt = seamPointAt(seam, v);
        if (i === 0) {
          pos.setX(k, seamPt.p.x); pos.setY(k, seamPt.p.y); pos.setZ(k, seamPt.p.z);
        } else if (blend < 1) {
          pos.setX(k, seamPt.p.x + (pos.getX(k) - seamPt.p.x) * blend);
          pos.setY(k, seamPt.p.y + (pos.getY(k) - seamPt.p.y) * blend);
          pos.setZ(k, seamPt.p.z + (pos.getZ(k) - seamPt.p.z) * blend);
        }
        let s;
        if (i === 0) {
          s = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
        } else if (i <= kBlend) {
          const span = spanSkin(side, ax);
          const toBody = 1 - sstep(i / kBlend);
          if (span.si[0] === BONE.BODY) {
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

  // ── FINGER struts — slim tubes from the WRIST out to EVERY wing SCALLOP TIP ─
  // The Night-Fury upgrade (L32 #4): a finger to EVERY scallop tip, not a capped
  // subset — so every scallop notch reads as a wing spar.
  function buildFingers(arm) {
    const { wr, side } = arm;
    // BULGE: a fatter base + a higher arch lift so the struts read as raised ridges
    // from the top view (the chase-cam markup), not flat ribs sunk in the membrane.
    const lift = (model.wingFingerBulge ?? 0.018) * ws;
    const r0 = model.wingFingerRadius ?? 0.050;
    // The fingers converge at the WRIST, swept FORWARD to the leading edge (armLeadZ).
    const wristP = new THREE.Vector3(wr.x + wristXGeo * side, wr.y + wristLift, wr.z + armLeadZ);
    const scaleX = 1.34 * ws, scaleZ = model.wingChord ?? 1;
    const tipToGroup = (sx, sy) => {
      const wx = sx * scaleX;
      const liftY = archLift(wx, worldMaxX, arc, ws);
      return new THREE.Vector3(wx * side + wr.x, liftY + wr.y, -sy * scaleZ + wr.z);
    };
    const tips = wingSpec.tips;
    const geos = [];
    // FAN CURVE: the topmost spoke (tips[0], along the outer/leading edge) is STRAIGHT;
    // each spoke further down the fan bows MORE — a gentle chordwise (z) bow whose
    // amount scales with the finger's fan index (the yellow markup). bowK in [0,1].
    const finger = (tip, fanT) => {
      const target = tipToGroup(tip[0], tip[1]);
      const stations = seg(6);
      // chord-direction sign: tips fan toward the trailing edge (−chord → +z here).
      const bowMag = (model.wingFingerCurve ?? 0.0) * fanT;     // 0 for the top spoke
      const centre = [], radii = [], skin = [];
      for (let s = 0; s < stations; s++) {
        const t = s / (stations - 1);
        const p = wristP.clone().lerp(target, t);
        p.y += lift * Math.sin(Math.PI * Math.min(t, 0.85));
        // bow OUT (toward +z / trailing) at mid-span, zero at both ends.
        p.z += bowMag * Math.sin(Math.PI * t) * scaleZ;
        centre.push(p);
        radii.push(r0 + (0.0035 - r0) * (t * t * (3 - 2 * t)));
        const ax = Math.abs(p.x - wr.x);
        skin.push(spanSkin(side, ax));
      }
      const tube = skinnedTube(centre, radii, seg(4), (s) => skin[s], fingerMat);
      return tube.geometry;
    };
    // EVERY tip: tips[0] is the far leading point (straight), tips[1..] the scallop
    // tips fanning back; fanT ramps 0→1 across the fan so lower spokes curve more.
    for (let i = 0; i < tips.length; i++) {
      const fanT = tips.length > 1 ? i / (tips.length - 1) : 0;
      geos.push(finger(tips[i], fanT));
    }
    return geos;
  }

  const memR = buildMembraneSide(armR, seamR);
  const memL = buildMembraneSide(armL, seamL);
  const memRCount = memR.attributes.position.count;
  const fingersR = buildFingers(armR);
  const fingersL = buildFingers(armL);
  const memGeo = mergeGeometries([ensureSkinAttrs(memR), ensureSkinAttrs(memL)], false);
  if (!memGeo) throw new Error('buildNightFury: membrane mergeGeometries returned null');
  memGeo.computeVertexNormals();

  // ── ONE-SURFACE READ: share seam normals across the hull↔membrane boundary ──
  // The position weld is already zero-gap (root verts ARE body verts). Now average
  // the normal at each shared seam vert and write it into BOTH the hull seam vert
  // and the membrane root vert(s) that copy it, so lighting is continuous across the
  // opaque↔translucent boundary (no shading crease at the wing root). The hull loft
  // verts keep their original indices (loft is FIRST in the hull merge); the membrane
  // root column is i=0 → local index j, offset by memRCount for the left side.
  function shareSeamNormals() {
    const hn = hullGeo.attributes.normal, mn = memGeo.attributes.normal;
    const groups = new Map();                 // hull vert idx → [membrane vert idx, ...]
    const add = (hullIdx, memIdx) => {
      if (!groups.has(hullIdx)) groups.set(hullIdx, []);
      groups.get(hullIdx).push(memIdx);
    };
    for (let j = 0; j <= SEG_V; j++) {
      const v = SEG_V > 0 ? j / SEG_V : 0;
      add(seamPointAt(seamR, v).idx, j);                  // memR root column
      add(seamPointAt(seamL, v).idx, memRCount + j);      // memL root column
    }
    const acc = new THREE.Vector3(), tmp = new THREE.Vector3();
    for (const [hullIdx, mems] of groups) {
      acc.set(hn.getX(hullIdx), hn.getY(hullIdx), hn.getZ(hullIdx));
      for (const mi of mems) acc.add(tmp.set(mn.getX(mi), mn.getY(mi), mn.getZ(mi)));
      if (acc.lengthSq() < 1e-12) continue;
      acc.normalize();
      hn.setXYZ(hullIdx, acc.x, acc.y, acc.z);
      for (const mi of mems) mn.setXYZ(mi, acc.x, acc.y, acc.z);
    }
    hn.needsUpdate = true; mn.needsUpdate = true;
  }
  shareSeamNormals();

  const memMesh = new THREE.SkinnedMesh(memGeo, wingMat);
  memMesh.frustumCulled = false;
  memMesh.name = 'nightFuryMembrane';

  const fingerGeo = mergeGeometries([...fingersR, ...fingersL].map((g) => ensureSkinAttrs(g)), false);
  let fingerMesh = null;
  if (fingerGeo) {
    fingerGeo.computeVertexNormals();
    fingerMesh = new THREE.SkinnedMesh(fingerGeo, fingerMat);
    fingerMesh.frustumCulled = false;
    fingerMesh.name = 'nightFuryFingers';
  }

  // ── HEAD + TAIL features (static add-ons on the continuous hull) ───────────
  // The head/neck/tail VOLUME is the loft itself (one surface). These are the
  // distinguishing Night-Fury features the loft can't express: inset acid-green eyes,
  // the two large back-swept ear-HORNS + subtle dorsal nub-horns, the stabilizer
  // mini-wings, and the twin bat-membrane tail fins. All authored to the Toothless
  // reference; positions tuned on the chase-cam preview.
  const features = [];
  const tailFins = [];
  let miniL = null, miniR = null;
  // The head rides UP the curved neck (cy≈+0.36 at the cranium) and the tail droops
  // (cy≈-0.20 at the fin zone); the feature y-positions track those centreline lifts.
  const HEAD_Y = TY + 0.36, TAILFIN_Y = TY - 0.18;
  // EYES — large almond acid-green eyes INSET into the cheek (recessed so only the
  // front of the ball reads, nestled in the rounded cranium, not a floating sphere).
  {
    const eyeGeo = new THREE.SphereGeometry(0.115, seg(10), seg(8));
    for (const side of [1, -1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      // sat back on the wide cranium/cheek station (−4.32) + pulled inboard so the
      // ball sinks into the hide; only the forward cap shows (the "inside the head" read).
      eye.position.set(side * 0.185, HEAD_Y + 0.04, -4.32);
      eye.scale.set(0.78, 1.16, 0.66);            // shallow (sunk) + tall → almond socket
      eye.rotation.y = side * 0.42;               // face forward-outward
      eye.rotation.z = side * -0.22;
      features.push(eye);
    }
  }
  // EAR-HORNS — the two LARGE back-swept head horns (the "ears"). The cone BASE is
  // baked to the origin (translate +len/2) so the WIDE end connects to the head and
  // the NARROW apex projects up + back (the correct taper — not wide-at-tip).
  {
    const hornLen = model.earHornLen ?? 0.82;
    const earGeo = new THREE.ConeGeometry(0.13, hornLen, seg(7), 1, false);
    earGeo.translate(0, hornLen / 2, 0);          // base at origin → wide end at the head
    for (const side of [1, -1]) {
      const ear = new THREE.Mesh(earGeo, hullMat);
      ear.scale.set(1.0, 1.0, 0.7);               // only mildly flattened → horn, not blade
      ear.position.set(side * 0.15, HEAD_Y + 0.20, -3.92);
      ear.rotation.x = -1.30;                      // sweep up + BACK (apex toward +z, raised)
      ear.rotation.z = side * 0.30;               // splay outward
      features.push(ear);
    }
  }
  // DORSAL RIDGE — a row of small nubs running the WHOLE spine from the head crown to
  // the tail, sampled directly off the loft's apex line (so they sit exactly on the
  // back). Wide base at the skin, narrow tip up. Subtle; a touch taller over the back.
  {
    const lr = loftGeo.userData.loftRings;
    const m0 = lr.section;
    const lp = loftGeo.attributes.position;
    let prevZ = -Infinity;
    for (let r = 0; r < lr.count; r++) {
      const z = lr.ringZ[r];
      if (z < -4.05 || z > 3.55) continue;        // head crown → tail (skip snout + very tip)
      if (z - prevZ < 0.28) continue;             // space them out evenly
      prevZ = z;
      const apex = r * m0 + 0;                     // column 0 = top keel apex
      const ax = lp.getX(apex), ay = lp.getY(apex), az = lp.getZ(apex);
      const mid = Math.max(0, 1 - Math.abs(z + 0.3) / 3.2);  // tallest over the back
      const h = 0.05 + 0.06 * mid;
      const nub = new THREE.Mesh(new THREE.ConeGeometry(0.034 + 0.012 * mid, h, seg(5), 1, false), hullMat);
      nub.geometry.translate(0, h / 2, 0);        // base on the skin, tip up
      nub.position.set(ax, ay, az);
      nub.rotation.x = -0.4;                       // lean back along the spine
      features.push(nub);
    }
  }

  // ── MINI-WINGS (stabilizer sails) — a small membrane pair just AFT of the main
  // wing root, flaring then tapering to widen the body so it reads less long-and-thin.
  // They DON'T flap (driven as stabilizers in dragon.js); the wingMat membrane billows
  // like a sail. Mounted on the nullable wingPivot2L/R rig handles.
  const miniSpec = {
    tips: [[1.70, 0.34], [1.28, -0.40], [0.78, -0.66], [0.30, -0.58]],
    lead: [1.05, 0.36], scallop: 0.12, rootChord: 0.26, flame: false,
    arc: { bow: 0.36, hump: 0.0, humpAt: 0.6, hook: 0.10 },
  };
  function buildMiniWing(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.40, TY + 0.24, 0.42);    // flank, behind the main wing root
    const mws = ws * (model.miniWingScale ?? 0.62);
    const g = buildCurvedPatch(miniSpec, {
      scaleX: 1.34 * mws, scaleZ: (model.wingChord ?? 1) * 0.70, arc: miniSpec.arc, k: mws,
      billow: model.miniWingBillow ?? 0.30, segU: seg(10), segV: seg(4),
      spanStart: 0, spanEnd: miniSpec.tips[0][0] * 1.34 * mws,
    });
    applyWingGradient(g, def, 0.25, 0.85);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * side);   // mirror span
    if (side < 0) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) { const b = idx.getX(i + 1), c = idx.getX(i + 2); idx.setX(i + 1, c); idx.setX(i + 2, b); }
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, wingMat);
    m.frustumCulled = false;
    pivot.add(m);
    // rest pose: splay down-outward + swept back like a trailing sail.
    pivot.rotation.set(-0.12, side * 0.80, side * -0.50);
    pivot.userData.rz = side * -0.50; pivot.userData.ry = side * 0.80; pivot.userData.rx = -0.12;
    pivot.frustumCulled = false;
    group.add(pivot);
    return pivot;
  }
  if (model.miniWingStabilizer) { miniR = buildMiniWing(1); miniL = buildMiniWing(-1); }

  // ── TWIN BAT-MEMBRANE TAIL FINS — the iconic pair near the tail tip: a small
  // billowed wing membrane + finger-like spar projections (the wing kernel in
  // miniature), fanning out + back. Mounted on pivots → dragon.js deploys them and
  // CURVES them into a bank (the rudder). userData.bankGain = curve INTO the turn.
  const finSpec = {
    tips: [[1.05, 0.36], [0.78, -0.30], [0.46, -0.54], [0.16, -0.44]],
    lead: [0.64, 0.30], scallop: 0.10, rootChord: 0.20, flame: false,
    arc: { bow: 0.30, hump: 0.0, humpAt: 0.6, hook: 0.06 },
  };
  function buildTailFin(side) {
    const pivot = new THREE.Group();
    // sit at the fin-attach zone so the membrane fans BACK to the tail tip (≈3.95) —
    // the fin ENDS in line with the end of the tail (was starting too early at 3.30).
    pivot.position.set(side * 0.03, TAILFIN_Y, 3.18);
    const fws = ws * (model.tailFinScale ?? 0.92);
    const sZ = (model.wingChord ?? 1) * 0.58;
    const span = finSpec.tips[0][0] * 1.34 * fws;
    const g = buildCurvedPatch(finSpec, {
      scaleX: 1.34 * fws, scaleZ: sZ, arc: finSpec.arc, k: fws,
      billow: model.tailFinBillow ?? 0.26, segU: seg(8), segV: seg(3),
      spanStart: 0, spanEnd: span,
    });
    applyWingGradient(g, def, 0.30, 0.85);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * side);
    if (side < 0) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) { const b = idx.getX(i + 1), c = idx.getX(i + 2); idx.setX(i + 1, c); idx.setX(i + 2, b); }
    }
    g.computeVertexNormals();
    pivot.add(new THREE.Mesh(g, wingMat));
    // finger-like spar projections, fanning from the fin root to every tip (subtle
    // bulge from the top — same idea as the wing fingers, scaled down).
    const tipTo = (sx, sy) => {
      const wx = sx * 1.34 * fws;
      return new THREE.Vector3(wx * side, archLift(wx, span, finSpec.arc, fws), -sy * sZ);
    };
    for (const tip of finSpec.tips) {
      const target = tipTo(tip[0], tip[1]);
      const st = seg(4), centre = [], radii = [];
      for (let s = 0; s < st; s++) {
        const t = s / (st - 1);
        const p = new THREE.Vector3(0, 0, 0).lerp(target, t);
        p.y += 0.035 * Math.sin(Math.PI * Math.min(t, 0.85));   // top bulge (raised ridges)
        centre.push(p);
        radii.push(0.044 + (0.005 - 0.044) * (t * t * (3 - 2 * t)));
      }
      const tube = skinnedTube(centre, radii, seg(3), () => ({ si: [0, 0, 0, 0], sw: [1, 0, 0, 0] }), fingerMat);
      pivot.add(new THREE.Mesh(tube.geometry, fingerMat));
    }
    // rest pose: fan outward (open backward) with the outer edge raised (a flat-ish V).
    pivot.rotation.set(-0.15, side * -0.52, side * 0.42);
    pivot.userData.restRotZ = side * 0.42;
    pivot.userData.restRotY = side * -0.52;
    pivot.userData.restRotX = -0.15;
    pivot.userData.restScale = 1;
    pivot.userData.bankGain = side * 0.7;       // curve INTO the turn (rudder)
    pivot.frustumCulled = false;
    group.add(pivot);
    tailFins.push(pivot);
    return pivot;
  }
  buildTailFin(1);
  buildTailFin(-1);

  for (const f of features) { f.frustumCulled = false; group.add(f); }

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
      wingPivot2L: miniL, wingPivot2R: miniR,
      tailFins,
      wingRigL: { shoulder: armL.shoulder, elbow: armL.elbow, wrist: armL.wrist, side: -1, profile: model.flapProfile || null },
      wingRigR: { shoulder: armR.shoulder, elbow: armR.elbow, wrist: armR.wrist, side: 1, profile: model.flapProfile || null },
    },
    wingMat,
    spineMats,
  };
}

registerWings('nightFuryWings', (def, model, attach) => buildNightFury(def, model, attach));

export { buildNightFury, NIGHTFURY_PROFILE, nfSection };
