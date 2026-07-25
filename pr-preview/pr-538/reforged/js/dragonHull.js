import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import {
  wingSpecFor, buildCurvedPatch, buildWingShape, applyWingGradient, archLift,
} from './dragonParts.js';
import { registerWings, registerTorso } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube, sweepProfileSmooth } from './dragonSweep.js';
import { buildTorso } from './dragonTorso.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

// ── GENERIC UNIFIED HULL (data-driven) ───────────────────────────────────────
// This is the proven Night-Fury organism kernel (LEAPFROG L24–L39: zero-gap
// seam-copy weld, 7-bone arm rig, copy-the-boundary membrane, shared seam
// normals, tail/body-whip bone chains) FACTORED so the body SHAPE is pure DATA:
// each dragon supplies its own `def.hull = { profile, section, sectionN, knobs }`
// instead of the module-baked NIGHTFURY_PROFILE/nfSection. The generator IS the
// blueprint (L24): same oven, different recipe → distinct organisms with no code.
//
// COEXIST (the playbook): dragonNightFury.js (Toothless) + the obsidian modules
// stay BYTE-IDENTICAL on their own registered builders for rollback; this is a
// sibling that DUPLICATES the kernel so a bad new profile can never regress the
// shipped hero. Toothless migration onto this builder is a separate later step.
//
// Per-dragon knobs (def.hull.knobs, all nullable → default to the Toothless
// literals so the math is unchanged): seamHalf, chestBand, tailHandoffZ, headY,
// eyes, eyeZ, eyeColorFromDef, earHorns, earZ, earHornLen, dorsalNubs,
// dorsalZRange, dorsalRound, tailFins, tailFinZ, tailFinY. Plus def.hull.tailBulb
// (fire) — a glowing emissive sphere on the last tail bone (the Charizard read).

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// ── SUPER-ELLIPSE SECTION FACTORY ────────────────────────────────────────────
// Generalizes nfSection: a smooth super-ellipse cross-section, ordered CCW from
// the keel apex (i=0 = top, +y) so face winding points outward and the upper-flank
// seam column is deterministic (findSeam depends on this exact ordering). Params:
//   ex       fullness (>2 = rounder/fuller flanks; <2 = pinched)
//   flatTop  vertical squash of the upper half (1 = round, <1 = flat lens)
//   flatBot  vertical squash of the lower half
//   n        point count (the section resolution / seam column basis)
export function makeSuperEllipseSection({ ex = 2.15, flatTop = 1, flatBot = 1, n = 20 } = {}) {
  const shape = (c) => Math.sign(c) * Math.pow(Math.abs(c), 2 / ex);
  return function section(w, top, bot) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / 2;     // i=0 → top (+y), CCW
      const sx = shape(Math.cos(a)), sy = shape(Math.sin(a));
      pts.push([sx * w, sy * (sy >= 0 ? top * flatTop : bot * flatBot)]);
    }
    return pts;
  };
}

// ── TORSO ─────────────────────────────────────────────────────────────────────
// Body-less hull torso: builds the (legacy) neck OFF + publishes the attach
// contract (attach.loft generator + attach.bodyMatDouble) but NO body mesh —
// hullWings grows the body itself from attach.loft with sweepProfileSmooth and
// welds the membrane to it as one skin. The section + profile come from def.hull.
registerTorso('hullTorso', (def, model, bodyMat) => {
  const hull = def.hull || {};
  const baseProfile = hull.profile;
  if (!baseProfile) throw new Error("hullTorso requires def.hull.profile");
  const n = hull.sectionN ?? 20;
  // PER-FORM SECTION morph (round chubby baby → sleek adult): model.hullSection (merged
  // from forms[].hullSection) overrides the base section's ex/flatTop/flatBot.
  const section = baseProfile.ring || makeSuperEllipseSection({ ...(hull.section || {}), ...(model.hullSection || {}), n });
  // PER-FORM SPINE-ARCH (line-of-beauty S-curve ramp) + cute baby HEAD-BULGE: transform the
  // stations. cy×spineArch bends the whole spine more on the adult; headBulge fattens the
  // FRONT (head) stations so the baby reads big-domed. Both default ×1 → byte-identical unset.
  // The wing-seam zone (z≈wingRoot.z) is untouched: cy≈0 there (arch scales 0→0) and the head
  // window is far forward of it (weld preserved).
  const archK = model.spineArch ?? 1;
  const bulge = model.headBulge ?? 1;
  const headZ = hull.headBulgeZ ?? -2.85;       // stations forward of this are the "head"
  const blend = hull.headBulgeBlend ?? 0.7;
  let stations = baseProfile.stations;
  if (archK !== 1 || bulge !== 1) {
    stations = baseProfile.stations.map((st) => {
      const z = st[0]; let hw = st[1], kt = st[2], be = st[3]; const cy = st[4] ?? 0;
      if (bulge !== 1 && z < headZ + blend) {
        const u = z <= headZ ? 1 : 1 - (z - headZ) / blend;   // 1 at head → 0 at blend end
        const f = 1 + (bulge - 1) * (u * u * (3 - 2 * u));    // smoothstep falloff
        hw *= f; kt *= f; be *= f;
      }
      return [z, hw, kt, be, cy * archK];
    });
  }
  const profile = { ...baseProfile, stations,
    headBase: typeof baseProfile.headBase === 'function'
      ? baseProfile.headBase
      : () => ({ x: 0, y: 0.5, z: (baseProfile.stations?.[0]?.[0] ?? -4) + 1 }) };
  return buildTorso(profile, def, model, bodyMat,
    (p, stretch) => sweepProfileSmooth({ ...p, ring: section }, stretch),
    { bodyMesh: false, neck: false });
});

// ── seam finder (smooth-loft aware) — identical to the Night-Fury kernel, but the
// section count `SECTION_N` comes from the profile (def.hull.sectionN) so any
// section resolution welds correctly. Walks ONE upper-flank ring column across the
// resampled rings whose z lies in the wing-root chord window (front→back, no zig).
function findSeam(loftGeo, profile, side, SECTION_N, seamHalf, seamDorsal = 0.8125) {
  const lr = loftGeo.userData.loftRings;
  if (!lr) throw new Error('hullWings require a sweepProfileSmooth loft (userData.loftRings)');
  const m = lr.section;
  // seamDorsal = how high up the body the wing attaches (fraction of the section, top=1).
  // 0.8125 (=13/16) is mid-upper flank; higher → the wing sits more DORSAL (toward the spine).
  const ctrlFlank = side > 0 ? Math.round(SECTION_N * seamDorsal) : Math.round(SECTION_N * (1 - seamDorsal));
  const col = (m === SECTION_N) ? ctrlFlank : (((Math.round((ctrlFlank / SECTION_N) * m) % m) + m) % m);
  const pos = loftGeo.attributes.position;
  const wr = profile.wingRoot;
  const half = seamHalf;
  const zLo = wr.z - half, zHi = wr.z + half;
  let first = -1, last = -1;
  for (let r = 0; r < lr.count; r++) {
    if (lr.ringZ[r] >= zLo && lr.ringZ[r] <= zHi) { if (first < 0) first = r; last = r; }
  }
  if (first > 0) first--;
  if (last < lr.count - 1) last++;
  const chain = [];
  for (let r = first; r <= last; r++) {
    const idx = r * m + col;
    chain.push({ idx, p: new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)) });
  }
  return { chain, col, first, last };
}

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

function growSkinnedExtension(loftGeo, extensions) {
  const parts = [ensureSkinAttrs(loftGeo)];
  for (const e of extensions) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('growSkinnedExtension: mergeGeometries returned null (attribute mismatch)');
  return merged;
}

function buildHull(def, model, attach) {
  if (!attach.loft || !attach.bodyMatDouble) {
    throw new Error("hullWings require a body-less hull torso (parts.torso:'hullTorso' — it publishes attach.loft + attach.bodyMatDouble)");
  }
  const hk = (def.hull && def.hull.knobs) || {};
  const SECTION_N = (def.hull && def.hull.sectionN) ?? 20;
  const seamHalf = hk.seamHalf ?? 0.62;
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale;
  const wingSpec = wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;

  const wristXGeo = (model.wingWristSpan ?? (wingSpec.tips[wingSpec.tips.length - 1][0] * 1.34))
    * ws * (model.wingWristMedial ?? 1);
  const elbowXGeo = wristXGeo * 0.52;
  const foldBand = 0.7 * ws;
  const rootBand = elbowXGeo * 0.55;
  const SEG_U = seg(24), SEG_V = seg(6);
  const elbowLift = archLift(elbowXGeo, maxX, arc, ws);
  const wristLift = archLift(wristXGeo, maxX, arc, ws);
  const armLeadZ = -(model.wingArmLeadChord ?? 0) * (model.wingChord ?? 1);

  const _lePts = buildWingShape(wingSpec).getPoints(48);
  let _leMaxI = 0;
  for (let i = 1; i < _lePts.length; i++) if (_lePts[i].x > _lePts[_leMaxI].x) _leMaxI = i;
  const _lead = _lePts.slice(0, _leMaxI + 1);
  const yAtLead = (x) => {
    if (x <= _lead[0].x) return _lead[0].y;
    for (let i = 1; i < _lead.length; i++) {
      if (x <= _lead[i].x) {
        const t = (x - _lead[i - 1].x) / Math.max(_lead[i].x - _lead[i - 1].x, 1e-6);
        return _lead[i - 1].y + (_lead[i].y - _lead[i - 1].y) * t;
      }
    }
    return _lead[_lead.length - 1].y;
  };
  const leadEdgePt = (wr, side, x) => new THREE.Vector3(
    x * side + wr.x,
    archLift(x, worldMaxX, arc, ws) + wr.y,
    -yAtLead(x / (1.34 * ws)) * (model.wingChord ?? 1) + wr.z,
  );

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
  const hullMat = attach.bodyMatDouble;
  const fingerCol = def.body ?? 0x0a0f1c;
  const fingerMat = new THREE.MeshStandardMaterial({
    color: fingerCol, emissive: fingerCol, emissiveIntensity: 0.04,
    roughness: 0.85, metalness: 0.0, side: THREE.DoubleSide,
  });
  const eyeCol = def.eye ?? 0x96d62a;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeCol, emissive: eyeCol, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.0,
  });

  // ── body loft + wing-seam verts ───────────────────────────────────────────
  const loft = attach.loft;
  const TY = loft.TORSO_Y;
  const profile = loft.profile;
  const loftGeo = loft.makeGeo();
  loftGeo.translate(0, TY, 0);
  const seamDorsal = hk.seamDorsal ?? 0.8125;
  const seamR = findSeam(loftGeo, profile, 1, SECTION_N, seamHalf, seamDorsal);
  const seamL = findSeam(loftGeo, profile, -1, SECTION_N, seamHalf, seamDorsal);

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
  const bodyRoot = new THREE.Bone();
  const bones = [bodyRoot, null, null, null, null, null, null];
  function buildArmBones(side) {
    const wr = armRoot(side);
    const shoulder = new THREE.Bone();
    shoulder.position.set(wr.x, wr.y, wr.z);
    const elbow = new THREE.Bone();
    elbow.position.set(elbowXGeo * side, elbowLift, armLeadZ * 0.5);
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

  // ── tail/body-whip bone chains ─────────────────────────────────────────────
  const chAt = (z, ci) => {
    const st = profile.stations;
    if (z <= st[0][0]) return st[0][ci] ?? 0;
    for (let i = 0; i < st.length - 1; i++) {
      if (z >= st[i][0] && z <= st[i + 1][0]) {
        const t = (z - st[i][0]) / (st[i + 1][0] - st[i][0]);
        return (st[i][ci] ?? 0) + ((st[i + 1][ci] ?? 0) - (st[i][ci] ?? 0)) * t;
      }
    }
    return st[st.length - 1][ci] ?? 0;
  };
  const growChain = (zs, rootBone, rootPrev) => {
    const arr = [];
    let parent = rootBone, prev = rootPrev.clone();
    for (const z of zs) {
      const wpos = new THREE.Vector3(0, TY + chAt(z, 4), z);
      const bone = new THREE.Bone();
      bone.position.copy(wpos.clone().sub(prev));
      bone.userData.whipZ = z;
      parent.add(bone);
      const idx = bones.length; bones.push(bone);
      arr.push({ bone, z, idx });
      parent = bone; prev = wpos;
    }
    return { arr, parent, prev };
  };

  const bodyWhip = !!model.bodyWhip;
  const FWD_Z = bodyWhip ? (model.spineFwdZ ?? [-1.90, -3.80]) : [];
  const fwd = growChain(FWD_Z, bodyRoot, new THREE.Vector3(0, 0, 0));
  const HIP_Z = bodyWhip ? (model.spineHipZ ?? 1.10) : null;
  let hipEntry = null, aftParent = bodyRoot, aftPrev = new THREE.Vector3(0, 0, 0);
  if (HIP_Z != null) {
    const wpos = new THREE.Vector3(0, TY + chAt(HIP_Z, 4), HIP_Z);
    const bone = new THREE.Bone();
    bone.position.copy(wpos.clone().sub(aftPrev));
    bone.userData.whipZ = HIP_Z;
    bodyRoot.add(bone);
    hipEntry = { bone, z: HIP_Z, idx: bones.length }; bones.push(bone);
    aftParent = bone; aftPrev = wpos;
  }
  const TAIL_BONE_Z = model.tailWhip ? (model.tailBoneZ ?? [1.70, 2.30, 2.90, 3.45]) : [];
  const tail = growChain(TAIL_BONE_Z, aftParent, aftPrev);
  const tailBones = tail.arr.map((e) => e.bone);

  let spineSegs = null;
  if (bodyWhip) {
    spineSegs = [];
    const fwdRole = ['neck', 'head'];
    const fwdGain = [0.12, 0.08];
    fwd.arr.forEach((e, k) => {
      e.bone.userData.role = fwdRole[k] ?? 'neck';
      e.bone.userData.whip = { gain: fwdGain[k] ?? 0.07, phase: -1.0 - k * 0.5 };
      spineSegs.push(e.bone);
    });
    if (hipEntry) {
      hipEntry.bone.userData.role = 'hip';
      hipEntry.bone.userData.whip = { gain: 0.14, phase: Math.PI - 0.4 };
      spineSegs.push(hipEntry.bone);
    }
  }

  // ── reweight loft off the static chest onto the spine + tail chains ────────
  const chestBand = hk.chestBand ?? [-1.35, 0.90];
  const ctrl = [];
  if (bodyWhip) {
    ctrl.push({ z: FWD_Z[1], b: fwd.arr[1].idx });
    ctrl.push({ z: FWD_Z[0], b: fwd.arr[0].idx });
    ctrl.push({ z: chestBand[0], b: BONE.BODY });
    ctrl.push({ z: chestBand[1], b: BONE.BODY });
    if (hipEntry) ctrl.push({ z: HIP_Z, b: hipEntry.idx });
  } else if (TAIL_BONE_Z.length) {
    ctrl.push({ z: hk.tailHandoffZ ?? 1.45, b: BONE.BODY });
  }
  tail.arr.forEach((e) => ctrl.push({ z: e.z, b: e.idx }));
  if (ctrl.length) {
    const pos = loftGeo.attributes.position, n = pos.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const z = pos.getZ(i);
      let a = ctrl[0].b, b = ctrl[0].b, t = 0;
      if (z >= ctrl[ctrl.length - 1].z) { a = b = ctrl[ctrl.length - 1].b; }
      else if (z > ctrl[0].z) {
        for (let j = 0; j < ctrl.length - 1; j++) {
          if (z >= ctrl[j].z && z <= ctrl[j + 1].z) { a = ctrl[j].b; b = ctrl[j + 1].b; t = sstep((z - ctrl[j].z) / (ctrl[j + 1].z - ctrl[j].z)); break; }
        }
      }
      if (a === b) { si[i * 4] = a; sw[i * 4] = 1; }
      else { si[i * 4] = a; si[i * 4 + 1] = b; sw[i * 4] = 1 - t; sw[i * 4 + 1] = t; }
    }
    loftGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
    loftGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  }

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

  function seamPointAt(seam, v) {
    const chain = seam.chain;
    const k = Math.round(v * (chain.length - 1));
    const e = chain[Math.min(Math.max(k, 0), chain.length - 1)];
    return { p: e.p.clone(), idx: e.idx };
  }

  // ── leading-edge frame spar (root→tip), merged into the opaque hull ────────
  const ARM_VFLAT = 0.6;
  function buildArmFrame(arm) {
    const { wr, side } = arm;
    const rArm = (model.wingArmRadius ?? 0.115) * (model.wingRootScale ?? 1);
    const rWrist = model.wingForearmRadius ?? 0.085;
    const rTip = model.wingFrameTipRadius ?? 0.013;
    const N = seg(18);
    const centre = [], radii = [], skin = [];
    for (let s = 0; s < N; s++) {
      const t = s / (N - 1);
      const ax = t * worldMaxX;
      centre.push(leadEdgePt(wr, side, ax));
      const r = ax <= wristXGeo
        ? rArm + (rWrist - rArm) * sstep(ax / wristXGeo)
        : rWrist + (rTip - rWrist) * sstep((ax - wristXGeo) / (worldMaxX - wristXGeo));
      const bump = s === 0 ? rArm * 0.28 : 0;
      radii.push(r + bump);
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

  function buildThumbKnob(arm) {
    const { wr, side } = arm;
    const wristP = leadEdgePt(wr, side, wristXGeo);
    const tip = wristP.clone().add(new THREE.Vector3(0.22 * side, 0.03 * ws, -0.26));
    const st = seg(5), rad = seg(5), centre = [], radii = [], skin = [];
    const wb = WR(side);
    for (let s = 0; s < st; s++) {
      const t = s / (st - 1);
      centre.push(wristP.clone().lerp(tip, t));
      radii.push(0.078 * (1 - 0.93 * t));
      skin.push({ si: [wb, 0, 0, 0], sw: [1, 0, 0, 0] });
    }
    const g = skinnedTube(centre, radii, rad, (s) => skin[s], fingerMat).geometry;
    const gp = g.attributes.position;
    for (let s = 0; s < st; s++) {
      const cy = centre[s].y;
      for (let j = 0; j < rad; j++) { const k = s * rad + j; gp.setY(k, cy + (gp.getY(k) - cy) * 0.5); }
    }
    gp.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }

  function buildFingers(arm) {
    const { wr, side } = arm;
    const lift = (model.wingFingerBulge ?? 0.018) * ws;
    const r0 = model.wingFingerRadius ?? 0.050;
    const wristP = leadEdgePt(wr, side, wristXGeo);
    const scaleX = 1.34 * ws, scaleZ = model.wingChord ?? 1;
    const tipToGroup = (sx, sy) => {
      const wx = sx * scaleX;
      const liftY = archLift(wx, worldMaxX, arc, ws);
      return new THREE.Vector3(wx * side + wr.x, liftY + wr.y, -sy * scaleZ + wr.z);
    };
    const tips = wingSpec.tips;
    const finger = (tip, fanT, frame) => {
      const target = tipToGroup(tip[0], tip[1]);
      const stations = seg(6);
      const bowMag = (model.wingFingerCurve ?? 0.0) * fanT;
      const rBase = frame ? (model.wingFrameRadius ?? 0.085) : r0;
      const topLift = frame ? lift * (model.wingFrameLift ?? 0.0) : lift;
      const centre = [], radii = [], skin = [];
      for (let s = 0; s < stations; s++) {
        const t = s / (stations - 1);
        const p = wristP.clone().lerp(target, t);
        p.y += topLift * Math.sin(Math.PI * Math.min(t, 0.92));
        p.z += bowMag * Math.sin(Math.PI * t) * scaleZ;
        p.x += (model.wingFingerSplay ?? 0) * fanT * Math.sin(Math.PI * t) * scaleX * side;
        centre.push(p);
        radii.push(rBase + (0.0035 - rBase) * (t * t * (3 - 2 * t)));
        const ax = Math.abs(p.x - wr.x);
        skin.push(spanSkin(side, ax));
      }
      const tube = skinnedTube(centre, radii, seg(4), (s) => skin[s], fingerMat);
      return tube.geometry;
    };
    const struts = [];
    for (let i = 1; i < tips.length; i++) {
      const fanT = tips.length > 1 ? i / (tips.length - 1) : 0;
      struts.push(finger(tips[i], fanT, false));
    }
    return struts;
  }

  const fingersR = buildFingers(armR);
  const fingersL = buildFingers(armL);
  const hullGeo = growSkinnedExtension(loftGeo, [
    buildArmFrame(armR), buildArmFrame(armL),
    buildThumbKnob(armR), buildThumbKnob(armL),
  ]);
  hullGeo.computeVertexNormals();
  const hullMesh = new THREE.SkinnedMesh(hullGeo, hullMat);
  hullMesh.frustumCulled = false;
  hullMesh.name = 'hullBody';

  // ── translucent membrane (root column = exact body seam verts) ─────────────
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

  const memR = buildMembraneSide(armR, seamR);
  const memL = buildMembraneSide(armL, seamL);
  const memRCount = memR.attributes.position.count;
  const memGeo = mergeGeometries([ensureSkinAttrs(memR), ensureSkinAttrs(memL)], false);
  if (!memGeo) throw new Error('buildHull: membrane mergeGeometries returned null');
  memGeo.computeVertexNormals();

  function shareSeamNormals() {
    const hn = hullGeo.attributes.normal, mn = memGeo.attributes.normal;
    const groups = new Map();
    const add = (hullIdx, memIdx) => {
      if (!groups.has(hullIdx)) groups.set(hullIdx, []);
      groups.get(hullIdx).push(memIdx);
    };
    for (let j = 0; j <= SEG_V; j++) {
      const v = SEG_V > 0 ? j / SEG_V : 0;
      add(seamPointAt(seamR, v).idx, j);
      add(seamPointAt(seamL, v).idx, memRCount + j);
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
  memMesh.name = 'hullMembrane';

  const fingerGeo = mergeGeometries([...fingersR, ...fingersL].map((g) => ensureSkinAttrs(g)), false);
  let fingerMesh = null;
  if (fingerGeo) {
    fingerGeo.computeVertexNormals();
    fingerMesh = new THREE.SkinnedMesh(fingerGeo, fingerMat);
    fingerMesh.frustumCulled = false;
    fingerMesh.name = 'hullFingers';
  }

  // ── head/tail FEATURES (gated per dragon via def.hull.knobs) ───────────────
  const features = [];
  const tailFins = [];
  let miniL = null, miniR = null;
  const HEAD_Y = TY + (hk.headY ?? 0.30), TAILFIN_Y = TY + (hk.tailFinY ?? -0.18);

  if (model.hullEyes ?? hk.eyes ?? true) {
    // eyeScale grows the eye (cute baby reads bigger-eyed); eyeYOffset drops it lower-set
    // (Kindchenschema). A pupil sphere gives a readable eye in the shop/¾ view (the chase
    // cam barely sees the face, so this is a front-view bonus, not the cuteness driver).
    const es = model.eyeScale ?? 1;
    const eyeGeo = new THREE.SphereGeometry(0.115 * es, seg(10), seg(8));
    const eyeZ = hk.eyeZ ?? -3.52;
    const eyeY = HEAD_Y - 0.05 + (model.eyeYOffset ?? 0);
    const eyeX = (hk.eyeX ?? 0.275);
    const pupilOn = model.eyePupil ?? hk.pupil;
    const pupilMat = pupilOn ? new THREE.MeshStandardMaterial({ color: def.eyePupil ?? 0x0a0a0a, roughness: 0.35, metalness: 0.0 }) : null;
    for (const side of [1, -1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * eyeX, eyeY, eyeZ);
      eye.scale.set(0.74, 1.12, 0.70);
      eye.rotation.y = side * 0.55;
      eye.rotation.z = side * -0.12;
      features.push(eye);
      if (pupilMat) {
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.052 * es, seg(8), seg(6)), pupilMat);
        // sit on the FRONT outer face of the almond eye (forward −z, outward ±x).
        pupil.position.set(side * (eyeX + 0.05 * es), eyeY, eyeZ - 0.075 * es);
        features.push(pupil);
      }
    }
  }
  if (model.hullEarHorns ?? hk.earHorns) {
    const hornLen = model.earHornLen ?? hk.earHornLen ?? 0.44;
    const earGeo = new THREE.ConeGeometry(0.16, hornLen, seg(7), 1, false);
    earGeo.translate(0, hornLen / 2, 0);
    const earZ = hk.earZ ?? -3.16;
    for (const side of [1, -1]) {
      const ear = new THREE.Mesh(earGeo, hullMat);
      ear.scale.set(1.0, 1.05, 0.78);
      ear.position.set(side * 0.17, HEAD_Y + 0.16, earZ);
      ear.rotation.x = 0.85;
      ear.rotation.z = side * -0.28;
      features.push(ear);
    }
  }
  if (model.hullDorsalNubs ?? hk.dorsalNubs) {
    const lr = loftGeo.userData.loftRings;
    const m0 = lr.section;
    const lp = loftGeo.attributes.position;
    const zr = hk.dorsalZRange ?? [-4.05, 3.55];
    const round = hk.dorsalRound ?? 0;     // 0 = pointed nub (toothless), 1 = rounded bump (water)
    let prevZ = -Infinity;
    for (let r = 0; r < lr.count; r++) {
      const z = lr.ringZ[r];
      if (z < zr[0] || z > zr[1]) continue;
      if (z - prevZ < 0.28) continue;
      prevZ = z;
      const apex = r * m0 + 0;
      const ax = lp.getX(apex), ay = lp.getY(apex), az = lp.getZ(apex);
      const mid = Math.max(0, 1 - Math.abs(z + 0.3) / 3.2);
      const h = (0.05 + 0.06 * mid) * (1 - 0.45 * round);
      const rBase = 0.034 + 0.012 * mid + 0.05 * round;     // rounder = wider, lower
      const nubGeo = round > 0.5
        ? new THREE.SphereGeometry(rBase, seg(6), seg(5), 0, Math.PI * 2, 0, Math.PI / 2)
        : new THREE.ConeGeometry(rBase, h, seg(5), 1, false);
      if (round <= 0.5) nubGeo.translate(0, h / 2, 0);
      const nub = new THREE.Mesh(nubGeo, hullMat);
      nub.position.set(ax, ay, az);
      if (round <= 0.5) nub.rotation.x = -0.4;
      features.push(nub);
    }
  }

  // ── MINI-WINGS (stabilizer sails) — gated by model.miniWingStabilizer ──────
  const miniSpec = {
    tips: [[1.70, 0.34], [1.28, -0.40], [0.78, -0.66], [0.30, -0.58]],
    lead: [1.05, 0.36], scallop: 0.12, rootChord: 0.26, flame: false,
    arc: { bow: 0.36, hump: 0.0, humpAt: 0.6, hook: 0.10 },
  };
  function buildMiniWing(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.40, TY + 0.24, 0.42);
    const mws = ws * (model.miniWingScale ?? 0.62);
    const g = buildCurvedPatch(miniSpec, {
      scaleX: 1.34 * mws, scaleZ: (model.wingChord ?? 1) * 0.70, arc: miniSpec.arc, k: mws,
      billow: model.miniWingBillow ?? 0.30, segU: seg(10), segV: seg(4),
      spanStart: 0, spanEnd: miniSpec.tips[0][0] * 1.34 * mws,
    });
    applyWingGradient(g, def, 0.25, 0.85);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * side);
    if (side < 0) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) { const b = idx.getX(i + 1), c = idx.getX(i + 2); idx.setX(i + 1, c); idx.setX(i + 2, b); }
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, wingMat);
    m.frustumCulled = false;
    pivot.add(m);
    pivot.rotation.set(-0.12, side * 0.80, side * -0.50);
    pivot.userData.rz = side * -0.50; pivot.userData.ry = side * 0.80; pivot.userData.rx = -0.12;
    pivot.frustumCulled = false;
    group.add(pivot);
    return pivot;
  }
  if (model.miniWingStabilizer) { miniR = buildMiniWing(1); miniL = buildMiniWing(-1); }

  // ── TWIN BAT-MEMBRANE TAIL FINS — gated by def.hull.knobs.tailFins ─────────
  const finSpec = {
    tips: [[1.06, 0.18], [0.82, -0.48], [0.50, -0.82], [0.18, -0.82]],
    lead: [0.68, 0.26], scallop: 0.38, rootChord: 0.24, flame: false,
    arc: { bow: 0.05, hump: 0.0, humpAt: 0.6, hook: 0.0 },
  };
  function buildTailFin(side) {
    const pivot = new THREE.Group();
    const finZ = hk.tailFinZ ?? 3.55;
    const finBaseW = new THREE.Vector3(side * 0.03, TAILFIN_Y, finZ);
    if (tailBones.length) {
      const zL = TAIL_BONE_Z[TAIL_BONE_Z.length - 1];
      pivot.position.copy(finBaseW.clone().sub(new THREE.Vector3(0, TY + chAt(zL, 4), zL)));
    } else {
      pivot.position.copy(finBaseW);
    }
    const fws = ws * (model.tailFinScale ?? 0.69);
    const sZ = (model.wingChord ?? 1) * 0.58;
    const span = finSpec.tips[0][0] * 1.34 * fws;
    const g = buildCurvedPatch(finSpec, {
      scaleX: 1.34 * fws, scaleZ: sZ, arc: finSpec.arc, k: fws,
      billow: model.tailFinBillow ?? 0.04, segU: seg(8), segV: seg(3),
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
        p.y += 0.035 * Math.sin(Math.PI * Math.min(t, 0.85));
        centre.push(p);
        radii.push(0.044 + (0.005 - 0.044) * (t * t * (3 - 2 * t)));
      }
      const tube = skinnedTube(centre, radii, seg(3), () => ({ si: [0, 0, 0, 0], sw: [1, 0, 0, 0] }), fingerMat);
      pivot.add(new THREE.Mesh(tube.geometry, fingerMat));
    }
    pivot.rotation.set(0, side * -0.52, 0);
    pivot.userData.restRotZ = 0;
    pivot.userData.restRotY = side * -0.52;
    pivot.userData.restRotX = 0;
    pivot.userData.restScale = 1;
    pivot.userData.bankGain = side * 0.3;
    pivot.frustumCulled = false;
    (tailBones.length ? tailBones[tailBones.length - 1] : group).add(pivot);
    tailFins.push(pivot);
    return pivot;
  }
  if (model.hullTailFins ?? hk.tailFins) { buildTailFin(1); buildTailFin(-1); }

  // ── TAIL FLAME (fire) — a real layered TEARDROP flame (not an egg): nested cones
  // tapering to a POINT, pointing up + raked back, with a hotter inner lick. Rides the
  // last tail bone on the up-kicked tail tip so the flame licks upward (Charizard read). ──
  if (def.hull && def.hull.tailBulb) {
    const tb = def.hull.tailBulb;
    const glow = model.tailBulbGlow ?? 1;
    const scl = (tb.r ?? 0.18) * (model.tailBulbScale ?? 1) / 0.18;   // overall flame scale
    const outerCol = tb.color ?? def.wingEmissive ?? 0xff6a1e;
    const innerCol = tb.innerColor ?? 0xffd24a;                       // hotter core
    const flameMat = (col, gMul) => {
      const m = new THREE.MeshStandardMaterial({ color: col, emissive: col,
        emissiveIntensity: (tb.emissiveIntensity ?? 1.2) * glow * gMul, roughness: 0.5, metalness: 0.0,
        transparent: true, opacity: 0.96 });
      spineMats.push(m); return m;
    };
    // a teardrop = a cone (apex up) with the base tucked into the tail; lean back to trail.
    const flame = new THREE.Group();
    const mkLick = (r, h, yBase, lean, mat) => {
      const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg(8), 1, false), mat);
      c.geometry.translate(0, h / 2, 0);          // base at origin → apex up
      c.position.set(0, yBase, 0);
      c.rotation.x = lean;                          // rake BACK (+x rot tips the apex toward +z/back)
      c.frustumCulled = false;
      return c;
    };
    flame.add(mkLick(0.20 * scl, 0.62 * scl, 0, 0.5, flameMat(outerCol, 1.0)));     // outer flame
    flame.add(mkLick(0.115 * scl, 0.46 * scl, 0.05 * scl, 0.5, flameMat(innerCol, 1.5))); // inner lick (hotter)
    const flameZ = tb.z ?? (TAIL_BONE_Z.length ? TAIL_BONE_Z[TAIL_BONE_Z.length - 1] + 0.12 : 3.6);
    const baseW = new THREE.Vector3(0, TY + chAt(flameZ, 4) + (tb.yLift ?? 0.02), flameZ);
    if (tailBones.length) {
      const zL = TAIL_BONE_Z[TAIL_BONE_Z.length - 1];
      flame.position.copy(baseW.clone().sub(new THREE.Vector3(0, TY + chAt(zL, 4), zL)));
      tailBones[tailBones.length - 1].add(flame);
    } else {
      flame.position.copy(baseW);
      group.add(flame);
    }
  }

  // ── TAIL FLUKE (water) — a flat HORIZONTAL tail fin pair at the whip tip (the
  // manta/cetacean read). Two flattened lobes laid in the horizontal plane, riding
  // the last tail bone so they sway with the whip. Body-matte (hullMat). ──
  if (def.hull && def.hull.tailFluke) {
    const tfk = def.hull.tailFluke;
    const flukeZ = tfk.z ?? (TAIL_BONE_Z.length ? TAIL_BONE_Z[TAIL_BONE_Z.length - 1] : 3.6);
    const fs = tfk.scale ?? 1;
    const baseW = new THREE.Vector3(0, TY + chAt(flukeZ, 4) + (tfk.yLift ?? 0), flukeZ);
    const host = tailBones.length ? tailBones[tailBones.length - 1] : group;
    const local = tailBones.length
      ? baseW.clone().sub(new THREE.Vector3(0, TY + chAt(TAIL_BONE_Z[TAIL_BONE_Z.length - 1], 4), TAIL_BONE_Z[TAIL_BONE_Z.length - 1]))
      : baseW;
    for (const side of [1, -1]) {
      const lobe = new THREE.Mesh(new THREE.ConeGeometry(0.11 * fs, 0.52 * fs, seg(4), 1, false), hullMat);
      lobe.geometry.translate(0, 0.26 * fs, 0);   // base at origin → tip outward
      lobe.scale.set(1.7, 1.0, 0.42);             // widen + flatten → a thin fluke lobe
      lobe.position.copy(local);
      lobe.rotation.z = side * Math.PI * 0.46;    // lay HORIZONTAL, splayed out
      lobe.rotation.x = -0.18;
      lobe.frustumCulled = false;
      host.add(lobe);
    }
  }

  for (const f of features) { f.frustumCulled = false; group.add(f); }

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
      tailFins, tailSegs: tailBones, spineSegs,
      wingRigL: { shoulder: armL.shoulder, elbow: armL.elbow, wrist: armL.wrist, side: -1, profile: model.flapProfile || null },
      wingRigR: { shoulder: armR.shoulder, elbow: armR.elbow, wrist: armR.wrist, side: 1, profile: model.flapProfile || null },
    },
    wingMat,
    spineMats,
  };
}

registerWings('hullWings', (def, model, attach) => buildHull(def, model, attach));

export { buildHull };
export * from './dragonHullProfiles.js';
