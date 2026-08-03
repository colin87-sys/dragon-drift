import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import {
  wingSpecFor, buildCurvedPatch, applyWingGradient, archLift,
} from './dragonParts.js';
import { registerWings } from './dragonRecipe.js';
import { seg } from './modelDetail.js';
import { skinnedTube } from './dragonSweep.js';
import { composeSurface, membraneSSSPatch } from './dragonSurfaceShader.js';

// ── UNIFIED SKINNED HULL ────────────────────────────────────────────────────
// The "one organism" build (LEAPFROG L23/L24, UNIFIED_HULL_PLAN.md Increment 1).
// Generate Obsidian's body+wings as ONE continuous procedural skinned surface
// instead of separate seaming meshes: the wing grows from a FLESHY ARM (a body-
// matching-radius tube, not a wire) and the membrane root is WELDED to the body
// flank (coincident verts + IDENTICAL skin weights to a STATIC bodyRoot bone), so
// the paired body-edge and wing-root verts can NEVER separate under a bone
// rotation — the regression the L20/L21/L22 patches could not pass.
//
// Topology, per side: a shoulder→elbow→wrist bone chain mirroring the shipped
// skinned wing. Two skinned meshes share ONE 7-bone skeleton:
//   bones = [bodyRoot, shoulderL, elbowL, wristL, shoulderR, elbowR, wristR]
//   · opaque HULL  = body loft (→ bodyRoot) MERGED with two fleshy arm tubes
//                    (root→shoulder→elbow→wrist by arc length). One draw call.
//   · membrane     = both wings' curved patches, root column re-seated onto the
//                    body flank + inner columns blended, welded to bodyRoot at the
//                    root band and easing into shoulder/elbow/wrist outboard. One
//                    translucent draw call.
//
// Rig contract unchanged: wingPivot* = shoulder, wingTip* = wrist, wingRig* =
// { shoulder, elbow, wrist, side, profile }; flapWing drives the cascade.

const BONE = { BODY: 0, SH_L: 1, EL_L: 2, WR_L: 3, SH_R: 4, EL_R: 5, WR_R: 6 };
const sstep = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };

// Ensure a geometry carries the four hull attributes (position, normal, skinIndex,
// skinWeight) so mergeGeometries (which requires identical attribute SETS) never
// returns null. Body verts get bodyRoot=1; that is overwritten where a caller
// supplies real weights.
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
  // Strip any stray attributes (e.g. vertex color / uv) so every merged geometry
  // shares an IDENTICAL attribute set — the L13 null-merge guard.
  for (const k of Object.keys(geo.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'skinIndex' && k !== 'skinWeight') {
      geo.deleteAttribute(k);
    }
  }
  return geo;
}

// growSkinnedExtension — the reusable kernel the plan names. Merge a base loft
// geometry with one or more skinned EXTENSION grids/tubes into ONE skinned
// BufferGeometry with a continuous weight field (every part already carries its
// own skinIndex/skinWeight). A future neck/tail caller reuses this verbatim.
export function growSkinnedExtension(loftGeo, extensions) {
  const parts = [ensureSkinAttrs(loftGeo)];
  for (const e of extensions) parts.push(ensureSkinAttrs(e));
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('growSkinnedExtension: mergeGeometries returned null (attribute mismatch)');
  return merged;
}

function buildUnifiedHull(def, model, attach, giM) {
  // The hull grows the body surface ITSELF from the loft recipe, so it REQUIRES a
  // body-less hull torso (attach.loft). Fail loud + actionable if paired with any
  // other torso (e.g. a stray recipe), rather than reading undefined deep in the math.
  if (!attach.loft || !attach.bodyMatDouble) {
    throw new Error("unifiedHull wings require a body-less hull torso (parts.torso:'unifiedHullTorso' — it publishes attach.loft + attach.bodyMatDouble)");
  }
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale;
  const wingSpec = wingSpecFor(def, model);
  const arc = wingSpec.arc;
  const maxX = Math.abs(wingSpec.tips[0][0] * 1.34 * ws);
  const worldMaxX = (wingSpec.tips[0][0] || 5.7) * 1.34 * ws;

  // Datums mirrored from buildMembraneWings so the bones land identically.
  const wristXGeo = 3.3 * ws;
  const elbowXGeo = wristXGeo * 0.52;
  const foldBand = 0.7 * ws;
  const rootBand = elbowXGeo * 0.55;
  const SEG_U = seg(24), SEG_V = seg(6);
  const elbowLift = archLift(elbowXGeo, maxX, arc, ws);
  const wristLift = archLift(wristXGeo, maxX, arc, ws);

  // ── materials ──────────────────────────────────────────────────────────
  // Translucent membrane material, built identically to buildMembraneWings.
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.82,
    emissive: def.wingMembraneEmissive ?? def.wingEmissive,
    emissiveIntensity: model.wingPanelGlow ?? 0.28,
  });
  if (model.wingSSS) {
    composeSurface(wingMat, [membraneSSSPatch({ color: def.wingMembraneSSS ?? 0x2a3a52, strength: 0.22, power: 1.5 })]);
  }
  // The opaque hull wears the torso's DoubleSide body material (fresnel rim +
  // cellular scales + iridescence) so the body region reads identically.
  const hullMat = attach.bodyMatDouble;

  // ── bones ───────────────────────────────────────────────────────────────
  const bodyRoot = new THREE.Bone();                 // static — holds every body vert
  const bones = [bodyRoot, null, null, null, null, null, null];

  // Per side: shoulder bone at the wing root, elbow + wrist as the geometric
  // children (mirroring the skinned wing). The shoulder is wingPivot, the wrist is
  // wingTip; flapWing rotates them in a lagged cascade.
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

  // ── flank sampler (analytic, resolution-free) ────────────────────────────
  // The body loft sits at y = TORSO_Y. A flank point at body-z is x = ±halfWidth,
  // y interpolated between the keel top and the belly by chord param v∈[0,1] (0 =
  // top/leading, 1 = belly/trailing) — so the membrane root rides the round flank.
  const loft = attach.loft;
  const TY = loft.TORSO_Y;
  const halfWidthAt = (z) => loft.halfWidthFor(z);
  const keelTopAt = (z) => loft.keelTopFor(z);          // half-height above mid
  // belly half-depth at z, from the profile's [z, w, top, bot] stations.
  const bellyAt = (z) => {
    const s = loft.profile.stations;
    const lerp = (i, t) => s[i][3] + (s[i + 1][3] - s[i][3]) * t;
    if (z <= s[0][0]) return s[0][3];
    if (z >= s[s.length - 1][0]) return s[s.length - 1][3];
    for (let i = 0; i < s.length - 1; i++) {
      if (z <= s[i + 1][0]) return lerp(i, (z - s[i][0]) / (s[i + 1][0] - s[i][0]));
    }
    return s[s.length - 1][3];
  };
  // The flank point (group space) at body-z and chord param v∈[0,1].
  function flankPoint(side, z, v) {
    const x = side * halfWidthAt(z) * 0.985;            // a hair inside the silhouette
    const top = TY + keelTopAt(z);
    const bot = TY - bellyAt(z);
    const y = top + (bot - top) * v;                    // v: 0 top → 1 belly
    return new THREE.Vector3(x, y, z);
  }

  // ── span skin (membrane outboard gradient) ───────────────────────────────
  // Two active bones (a→b blended by t) for a span position ax (= |x - shoulderX|
  // along the arm), routed to THIS side's shoulder/elbow/wrist. Padded to 4 wide.
  function spanSkin(side, ax) {
    const e = elbowXGeo, w = wristXGeo, b = foldBand;
    let aBone, bBone, t = 0;
    if (ax < rootBand) { aBone = BONE.BODY; bBone = SH(side); t = sstep(ax / rootBand); }       // body → shoulder
    else if (ax <= e - b) { aBone = SH(side); bBone = SH(side); }                                 // shoulder
    else if (ax < e + b) { aBone = SH(side); bBone = EL(side); t = sstep((ax - (e - b)) / (2 * b)); }
    else if (ax <= w - b) { aBone = EL(side); bBone = EL(side); }                                 // elbow
    else if (ax < w + b) { aBone = EL(side); bBone = WR(side); t = sstep((ax - (w - b)) / (2 * b)); }
    else { aBone = WR(side); bBone = WR(side); }                                                  // wrist
    return { si: [aBone, bBone, 0, 0], sw: [1 - t, t, 0, 0] };
  }

  // ── fleshy arm tube ──────────────────────────────────────────────────────
  // A skinnedTube from the shoulder out to the wrist, radius tapering from ~the
  // body flank half-width at the shoulder down toward ~0.12 at the wrist — a real
  // limb of body-matching radius (NOT the 0.11→0.02 wire). It rides the same
  // shoulder→elbow→wrist bones (root ring mostly bodyRoot so it emerges from the
  // body). Returned in GROUP space (centreline absolute).
  function buildFleshyArm(arm) {
    const { wr, side } = arm;
    const shoulderHW = Math.max(halfWidthAt(wr.z), 0.42);   // body flank radius at the shoulder
    const r0 = shoulderHW * 0.92;
    const r1 = 0.12 * (model.wingRootScale ?? 1) * 0.9 + 0.04;   // a touch chunkier with a thick root
    const N = 7;
    const centre = [], radii = [], skin = [];
    // Shoulder/elbow/wrist sample points in GROUP space (the bone rest positions).
    const pSh = new THREE.Vector3(wr.x, wr.y, wr.z);
    const pEl = new THREE.Vector3(wr.x + elbowXGeo * side, wr.y + elbowLift, wr.z);
    const pWr = new THREE.Vector3(wr.x + wristXGeo * side, wr.y + wristLift, wr.z);
    for (let s = 0; s < N; s++) {
      const t = s / (N - 1);
      // Walk shoulder→elbow→wrist along the two segments (so the arm bends at the
      // elbow exactly like the bone chain).
      let p;
      if (t <= 0.5) p = pSh.clone().lerp(pEl, t / 0.5);
      else p = pEl.clone().lerp(pWr, (t - 0.5) / 0.5);
      centre.push(p);
      radii.push(r0 + (r1 - r0) * sstep(t));
      const ax = t * wristXGeo;                          // arc → span position
      skin.push(spanSkin(side, ax));
    }
    const tube = skinnedTube(centre, radii, seg(8), (s) => skin[s], hullMat);
    return tube.geometry;                                // merge into the opaque hull
  }

  // ── opaque hull = body loft (translated to group space) + both fleshy arms ──
  const loftGeo = loft.makeGeo();
  loftGeo.translate(0, TY, 0);                           // the body mesh sits at y=TORSO_Y
  // every loft vert → bodyRoot=1 (handled by ensureSkinAttrs default).
  const hullGeo = growSkinnedExtension(loftGeo, [buildFleshyArm(armR), buildFleshyArm(armL)]);
  hullGeo.computeVertexNormals();
  const hullMesh = new THREE.SkinnedMesh(hullGeo, hullMat);
  hullMesh.frustumCulled = false;
  hullMesh.name = 'unifiedHull';

  // ── translucent membrane (per side, re-seated + welded) ──────────────────
  const kBlend = Math.max(1, Math.round(SEG_U * 0.12));
  // The z-window the root chord spans on the body flank, centred on wingRoot.z,
  // width ≈ the wing's rootChord (the SAME datum the membrane uses), so the seam
  // is driven from the wing's own blueprint, not guessed.
  function buildMembraneSide(arm) {
    const { wr, side } = arm;
    const g = buildCurvedPatch(wingSpec, {
      scaleX: 1.34 * ws, scaleZ: model.wingChord ?? 1, arc, k: ws,
      billow: model.wingBillow ?? 0.12, segU: SEG_U, segV: SEG_V,
      spanStart: 0, spanEnd: worldMaxX,
    });
    applyWingGradient(g, def, 0, 1);
    const pos = g.attributes.position;
    // Patch is built in wing-local space (root at x=0); translate to the shoulder
    // so its verts live in GROUP space, then mirror for the left.
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i) * side + wr.x;
      pos.setX(i, x);
      pos.setY(i, pos.getY(i) + wr.y);
      pos.setZ(i, pos.getZ(i) + wr.z);
    }
    // Reverse winding for the left so normals stay outward (x was mirrored).
    if (side < 0) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) {
        const b = idx.getX(i + 1), c = idx.getX(i + 2);
        idx.setX(i + 1, c); idx.setX(i + 2, b);
      }
    }

    const rootChord = wingSpec.rootChord ?? 0.28;
    const zHalf = rootChord * 1.34 * ws * 0.5 + 0.04;    // half the z-window on the flank
    const zFront = wr.z - zHalf, zBack = wr.z + zHalf;

    // Re-seat the root column (i=0) onto the body flank and blend inner columns
    // i=1..kBlend from the flank to the natural patch position with a smoothstep —
    // the membrane EMERGES tangentially from the body.
    const si = new Uint16Array(pos.count * 4);
    const sw = new Float32Array(pos.count * 4);
    for (let i = 0; i <= SEG_U; i++) {
      // span position of this column relative to the shoulder (for skinning)
      const ax = (i / SEG_U) * worldMaxX;
      const blend = i <= kBlend ? sstep(i / kBlend) : 1;  // 0 at root → 1 at kBlend
      for (let j = 0; j <= SEG_V; j++) {
        const k = i * (SEG_V + 1) + j;
        const v = SEG_V > 0 ? j / SEG_V : 0;
        // analytic flank point for this chord param
        const fp = flankPoint(side, zFront + (zBack - zFront) * v, v);
        if (blend < 1) {
          pos.setX(k, fp.x + (pos.getX(k) - fp.x) * blend);
          pos.setY(k, fp.y + (pos.getY(k) - fp.y) * blend);
          pos.setZ(k, fp.z + (pos.getZ(k) - fp.z) * blend);
        }
        // junctionSkin: root band (re-seated + blend columns) → bodyRoot (welded to
        // the static body); outboard → the span gradient. The seam column (i=0) is
        // 100% bodyRoot AND lies on the body flank, so it is coincident with the
        // static loft surface and stays coincident under any bone rotation.
        let s;
        if (i <= kBlend) {
          // ease from pure bodyRoot at the seam to the span weight at kBlend
          const span = spanSkin(side, ax);
          const toBody = 1 - sstep(i / kBlend);           // 1 at seam → 0 at kBlend
          // mix: weight toward bodyRoot near the seam
          const wBody = toBody + (1 - toBody) * span.sw[0] * (span.si[0] === BONE.BODY ? 1 : 0);
          s = { si: [BONE.BODY, span.si[1], 0, 0], sw: [wBody, 1 - wBody, 0, 0] };
          if (span.si[1] === BONE.BODY) s = { si: [BONE.BODY, SH(side), 0, 0], sw: [1, 0, 0, 0] };
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

  const memR = buildMembraneSide(armR);
  const memL = buildMembraneSide(armL);
  // Merge L+R membrane (same material, keep vertex colors) into ONE skinned mesh.
  const memGeo = mergeGeometries([memR, memL], false);
  if (!memGeo) throw new Error('buildUnifiedHull: membrane mergeGeometries returned null');
  const memMesh = new THREE.SkinnedMesh(memGeo, wingMat);
  memMesh.frustumCulled = false;
  memMesh.name = 'unifiedMembrane';

  // ── tip markers (trail spawn) — children of the wrist bones ───────────────
  const mkMarker = (arm) => {
    const m = new THREE.Object3D();
    m.position.set(
      wingSpec.tips[0][0] * 1.34 * ws * arm.side - wristXGeo * arm.side,
      archLift(maxX, maxX, arc, ws) - wristLift, -wingSpec.tips[0][1]);
    arm.wrist.add(m);
    return m;
  };
  const tipMarkerR = mkMarker(armR);
  const tipMarkerL = mkMarker(armL);

  // ── assemble + bind (L2 local-space order) ───────────────────────────────
  // All bones + both meshes are children of the group at a common origin → update
  // world → bind both meshes to the shared skeleton → placement is the group.scale
  // the orchestrator applies (attached bind mode self-corrects, L21).
  group.add(bodyRoot);
  group.add(armL.shoulder);
  group.add(armR.shoulder);
  group.add(hullMesh);
  group.add(memMesh);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  hullMesh.bind(skeleton);
  memMesh.bind(skeleton);

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

registerWings('unifiedHull', (def, model, attach, giM) => buildUnifiedHull(def, model, attach, giM));

export { buildUnifiedHull };
