import * as THREE from 'three';
import { seg } from './modelDetail.js';

// ===========================================================================
// WING ANATOMY — shared GEOMETRY math for an anatomically-correct dragon wing.
// ===========================================================================
// No materials or "look" are baked in — each creature passes its own ratios,
// curvature, scallop and materials, so silhouettes stay distinct. This module only
// encodes the SKELETON that makes a wing read as a real dragon/bat wing, from
// research (Chiroptera anatomy + dragon-art references):
//
//   • SHORT arm, LONG hand. Humerus short/robust, forearm longer, but the DIGITS
//     (metacarpals+phalanges) are the MOST elongated bones — the hand-wing is the
//     majority of the span, so the WRIST sits MEDIAL (close to the body), not far out.
//   • The fingers FAN from the wrist and are CURVED (each digit bows), never straight.
//   • Digit II + base of III make a CONVEX leading-edge frame; the posterior (more
//     lateral) digits curve MORE. The outermost finger frames the wing edge.
//   • The membrane SCALLOPS (curves inward toward the wrist) between fingertips.
//
// Built on the 3-joint rig the engine already drives (shoulder→elbow→wrist) so the
// fold happens at the elbow + (mostly) the wrist, where the long hand-wing swings.
// Returns the RIGHT-side master `pivot` with roles tagged (pivot/mid/tip/marker) plus
// direct refs; the caller mirror-clones it (scale.x=-1) for the left.

// Sample a quadratic bezier p0→(ctrl)→p1 into n Vector3 points (n>=2).
function bezier(p0, ctrl, p1, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const u = 1 - t;
    out.push(new THREE.Vector3(
      u * u * p0.x + 2 * u * t * ctrl.x + t * t * p1.x,
      u * u * p0.y + 2 * u * t * ctrl.y + t * t * p1.y,
      u * u * p0.z + 2 * u * t * ctrl.z + t * t * p1.z));
  }
  return out;
}

// A filled membrane panel: triangle-fan from pts[0] (the outline must be star-shaped
// from that vertex — true for our wrist-fan + arm panels).
function fanPanel(pts, mat) {
  const pos = [];
  for (const v of pts) pos.push(v.x, v.y, v.z);
  const idx = [];
  for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// In-plane normal of a→b, flipped to always point toward the LEADING edge (−Z), so
// fingers/leading frame bow CONVEXLY (the classic dragon-wing sweep) regardless of
// each finger's fan angle.
function leadingPerp(a, b) {
  const dir = b.clone().sub(a);
  const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
  if (perp.z > 0) perp.negate();
  return perp;
}

// A CURVED bone (tube) along a bezier from a→b, bowed toward the leading edge by
// `bow`. radius set by `rad`.
function curvedBone(a, b, bow, ws, mat, rad) {
  const ctrl = a.clone().lerp(b, 0.5).add(leadingPerp(a, b).multiplyScalar(bow * ws));
  const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
  const geo = new THREE.TubeGeometry(curve, Math.max(4, seg(8)), (rad ?? 0.03) * ws, seg(4), false);
  return new THREE.Mesh(geo, mat);
}

export function buildAnatomicalWing(opts) {
  const ws = opts.ws ?? 1;
  const mem = opts.membraneMat;
  const strut = opts.strutMat;
  const jointMat = opts.jointMat || strut;
  const A = opts.anatomy;
  // anatomy (2D wing coords: x = span outward, y = chord; +y = leading/forward):
  //   rootFront, rootBack, elbow, wrist  — the SHORT arm (wrist medial ≈ 0.33–0.4 span)
  //   fingers: [{ tip:[x,y], bow }]      — long fingers, leading→trailing; bow curves them
  //   scallop                            — membrane dip between fingertips (0..1)
  //   strutR                             — finger-strut tube radius
  const sampN = seg(7);
  const fingers = A.fingers;
  const nF = fingers.length;
  // joint-local 3D mapper (origin subtracted), flat in XZ: +span → +X, +chord → −Z.
  const at = (p, o) => new THREE.Vector3((p[0] - o[0]) * ws, 0, -(p[1] - o[1]) * ws);

  // ── pivot (SHOULDER): humerus spar + a small propatagium sliver. Folds the wing. ──
  const pivot = new THREE.Group();
  pivot.userData.wingRole = 'pivot';
  pivot.add(fanPanel([at(A.rootFront, [0, 0]), at(A.elbow, [0, 0]), at([A.elbow[0], A.elbow[1] - 0.35], [0, 0]), at(A.rootBack, [0, 0])], mem));
  pivot.add(curvedBone(at(A.rootFront, [0, 0]), at(A.elbow, [0, 0]), 0.12, ws, strut, (A.strutR ?? 0.04) * 1.5));   // humerus (short)

  // ── wingMid (ELBOW): forearm spar + the inner membrane (plagiopatagium) to the body. ──
  const wingMid = new THREE.Group();
  wingMid.position.copy(at(A.elbow, [0, 0]));
  wingMid.userData.wingRole = 'mid';
  pivot.add(wingMid);
  wingMid.add(fanPanel([
    at(A.elbow, A.elbow), at(A.wrist, A.elbow),
    at(fingers[nF - 1].tip, A.elbow), at(A.rootBack, A.elbow), at([A.elbow[0] * 0.4, A.rootBack[1] + 0.2], A.elbow),
  ], mem));
  wingMid.add(curvedBone(at(A.elbow, A.elbow), at(A.wrist, A.elbow), 0.16, ws, strut, (A.strutR ?? 0.04) * 1.3));   // forearm
  const elbowNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 * ws, 0), jointMat);
  elbowNode.position.copy(at(A.elbow, A.elbow));
  wingMid.add(elbowNode);

  // ── wingTip (WRIST): the HAND-WING — long curved fanning fingers + scalloped membrane.
  // This is the big panel and the big fold (the hand-wing dominates the span). ──
  const wingTip = new THREE.Group();
  wingTip.position.copy(at(A.wrist, A.elbow));
  wingTip.userData.wingRole = 'tip';
  wingMid.add(wingTip);
  const wristNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.08 * ws, 0), jointMat);
  wingTip.add(wristNode);   // at wrist origin

  const wristV = at(A.wrist, A.wrist);                       // = (0,0,0)
  const tip = (f) => at(f.tip, A.wrist);
  // Membrane outline (wrist-local), fan from the wrist:
  //   leading: wrist → digit-0 tip along the CONVEX leading frame (curved)
  //   trailing: scalloped curves between consecutive fingertips (deeper/curvier outboard)
  //   inner: last fingertip → back to the wrist
  const outline = [wristV];
  // leading frame (digit 0 / II): a convex bow toward the leading edge.
  {
    const a = wristV, b = tip(fingers[0]);
    const ctrl = a.clone().lerp(b, 0.5).add(leadingPerp(a, b).multiplyScalar(fingers[0].bow * ws));
    outline.push(...bezier(a, ctrl, b, sampN).slice(1));
  }
  // scalloped trailing edge between fingertips (curve dips toward the wrist; more
  // lateral pair → deeper, curvier scallop).
  for (let i = 0; i < nF - 1; i++) {
    const a = tip(fingers[i]), b = tip(fingers[i + 1]);
    const mid = a.clone().lerp(b, 0.5);
    const lateral = 1 - i / Math.max(1, nF - 1);            // 1 outboard → 0 inboard
    const ctrl = mid.lerp(wristV, A.scallop * (0.5 + 0.6 * lateral));
    outline.push(...bezier(a, ctrl, b, sampN).slice(1));
  }
  // close back to the wrist (the inner trailing edge of the hand-wing).
  wingTip.add(fanPanel(outline, mem));

  // Curved finger struts (the spars). Digit 0 = the convex LEADING frame; posterior
  // digits bow more. The last finger frames the trailing/outer edge.
  for (const f of fingers) wingTip.add(curvedBone(wristV, tip(f), f.bow, ws, strut, A.strutR ?? 0.035));

  const marker = new THREE.Object3D();
  marker.position.copy(tip(fingers[0]));
  marker.userData.wingRole = 'marker';
  wingTip.add(marker);

  return { pivot, wingMid, wingTip, marker };
}

// Mirror a built RIGHT master into a LEFT clone under a scale.x=-1 wrapper, and pull
// the role-tagged joints back out (the rig drives both with the identical pose).
export function mirrorWing(masterPivot) {
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };
  const wrap = new THREE.Group(); wrap.scale.x = -1;
  const clone = masterPivot.clone(true);
  wrap.add(clone);
  return { wrap, pivot: clone, wingMid: byRole(clone, 'mid'), wingTip: byRole(clone, 'tip'), marker: byRole(clone, 'marker') };
}
