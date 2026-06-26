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

  // ── ONE-PIECE WELDED MEMBRANE ────────────────────────────────────────────────────
  // The membrane + bones are built in a SINGLE frame and parented to `pivot`, so the
  // whole sheet is one rigid welded surface that can NEVER open a seam. (Splitting the
  // membrane across the elbow/wrist groups — which the rig folds & sweeps independently —
  // is what pulled the shared edges apart and showed gaps in any folded pose; a shared
  // seam only stays shut at TRUE flat rest.) `wingMid`/`wingTip` are kept as EMPTY rig
  // handles at the elbow/wrist so the engine's pose code + FX refs still resolve; the
  // bones articulate with the membrane as one unit, flapping from the shoulder + apex
  // lift. Articulating the membrane itself (skinned bend) is the next leapfrog (see L101).
  // Single pivot-local 3D mapper, flat in XZ: +span → +X, +chord (+y leading) → −Z.
  const P = (p) => new THREE.Vector3(p[0] * ws, 0, -p[1] * ws);

  // Trailing edge runs straight from the body (rootBack) to the inner fingertip; wristTrail
  // is the point on that line at the wrist's span — the internal join between the arm
  // membrane and the hand-wing fan (both in the SAME frame, so it is a true weld).
  const innerTip = fingers[nF - 1].tip;
  const trailAt = (sx) => { const t = (sx - A.rootBack[0]) / (innerTip[0] - A.rootBack[0]); return [sx, A.rootBack[1] + (innerTip[1] - A.rootBack[1]) * t]; };
  const wristTrail = trailAt(A.wrist[0]);

  const pivot = new THREE.Group();
  pivot.userData.wingRole = 'pivot';

  // ARM membrane: one fan from rootFront covering rootFront→elbow→wrist (leading) and
  // wrist→wristTrail→rootBack (trailing) — the whole inner wing up to the wrist line.
  pivot.add(fanPanel([P(A.rootFront), P(A.elbow), P(A.wrist), P(wristTrail), P(A.rootBack)], mem));
  // arm bones (humerus + forearm) + joint nodes, same frame.
  pivot.add(curvedBone(P(A.rootFront), P(A.elbow), 0.12, ws, strut, (A.strutR ?? 0.04) * 1.5));   // humerus (short)
  pivot.add(curvedBone(P(A.elbow), P(A.wrist), 0.16, ws, strut, (A.strutR ?? 0.04) * 1.3));        // forearm
  const elbowNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 * ws, 0), jointMat);
  elbowNode.position.copy(P(A.elbow));
  pivot.add(elbowNode);
  const wristNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.08 * ws, 0), jointMat);
  wristNode.position.copy(P(A.wrist));
  pivot.add(wristNode);

  // Empty rig handles at the elbow & wrist (the engine pose code rotates these; with no
  // geometry on them the membrane stays one welded sheet — articulation is shoulder-led).
  const wingMid = new THREE.Group();
  wingMid.position.copy(P(A.elbow));
  wingMid.userData.wingRole = 'mid';
  pivot.add(wingMid);
  const wingTip = new THREE.Group();
  wingTip.position.copy(P(A.wrist).sub(P(A.elbow)));   // local to wingMid → world = P(wrist)
  wingTip.userData.wingRole = 'tip';
  wingMid.add(wingTip);

  // ── HAND-WING (built on `pivot`, pivot-local): long curved fanning fingers + scalloped
  // membrane. Welds to the arm membrane along the shared wrist→wristTrail edge. ──
  const wristV = P(A.wrist);
  const tip = (f) => P(f.tip);
  // The membrane WEB ends slightly short of each fingertip so the bone pokes out as a
  // protruding POINT/claw (the iconic dragon-wing silhouette). Leading finger reaches
  // its tip (it IS the frame); inner fingers protrude most.
  const claw = A.claw ?? 0.16;
  const webTip = (f, i) => {
    const t = tip(f);
    const frac = i === 0 ? 1 : 1 - claw;                     // leading frame reaches tip
    return wristV.clone().lerp(t, frac);
  };
  // Membrane outline (wrist-local), fanned from the wrist:
  //   leading: wrist → leading-finger tip along the CONVEX, stiff leading frame.
  //   trailing: smooth catenary SCALLOPS sagging toward the wrist between the web
  //             tips, so each fingertip reads as a point over an even sag.
  //   inner: last web tip → back to the wrist.
  // LEADING frame (digit 0). With A.hook the tip curls BACK into a TALON (a sickle:
  // a stylized "line of action" + hooked wingtip — the caricature signature). The
  // membrane leading edge and the strut share the same curve so they read as one bone.
  const hook = A.hook ?? 0;
  const lfTip = tip(fingers[0]);
  let leadPts, leadStrut, wingtipV;
  {
    const a = wristV;
    const conv = a.clone().lerp(lfTip, 0.45).add(leadingPerp(a, lfTip).multiplyScalar(fingers[0].bow * ws));
    if (hook > 0) {
      const hookTip = lfTip.clone().add(new THREE.Vector3(0.18 * hook * ws, 0, 0.6 * hook * ws));   // out + swept BACK
      const ctrl2 = lfTip.clone().add(new THREE.Vector3(0, 0, -0.22 * hook * ws));                  // hold forward, then reverse to the talon
      const curve = new THREE.CubicBezierCurve3(a, conv, ctrl2, hookTip);
      leadPts = curve.getPoints(Math.max(8, sampN * 2));
      leadStrut = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, seg(14)), (A.strutR ?? 0.035) * ws, seg(4), false), strut);
      wingtipV = hookTip;
    } else {
      leadPts = bezier(a, conv, lfTip, sampN);
      leadStrut = curvedBone(a, lfTip, fingers[0].bow, ws, strut, A.strutR ?? 0.035);
      wingtipV = lfTip;
    }
  }

  // Membrane outline (wrist-local), fanned from the wrist: the leading frame, then
  // smooth catenary scallops from the wingtip through the inner web tips, deep enough
  // that each fingertip reads as a point.
  const outline = [wristV, ...leadPts.slice(1)];
  const scStarts = [wingtipV, ...fingers.slice(1).map((f, i) => webTip(f, i + 1))];
  for (let i = 0; i < scStarts.length - 1; i++) {
    const a = scStarts[i], b = scStarts[i + 1];
    // Scallop depth proportional to the GAP between these two fingertips (NOT the
    // distance to the wrist — that made the long outer fingers sag into huge open
    // notches that read as holes). Sag perpendicular to the a→b chord, toward the wrist.
    const mid = a.clone().lerp(b, 0.5);
    const perp = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize();
    if (perp.dot(wristV.clone().sub(mid)) < 0) perp.negate();
    const ctrl = mid.add(perp.multiplyScalar(A.scallop * a.distanceTo(b)));
    outline.push(...bezier(a, ctrl, b, sampN).slice(1));
  }
  // close via the shared wrist→wristTrail edge so the hand-wing welds to the arm membrane
  // along the full wrist line (same frame → a true weld, gap-free in every pose).
  outline.push(P(wristTrail));
  pivot.add(fanPanel(outline, mem));

  // Finger struts to the FULL tips (inner ones protrude past the web as points); the
  // leading strut is the hooked talon built above.
  pivot.add(leadStrut);
  for (let i = 1; i < nF; i++) pivot.add(curvedBone(wristV, tip(fingers[i]), fingers[i].bow, ws, strut, A.strutR ?? 0.035));

  const marker = new THREE.Object3D();
  marker.position.copy(wingtipV);
  marker.userData.wingRole = 'marker';
  pivot.add(marker);

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
