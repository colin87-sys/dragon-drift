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

// A CAMBERED fan: same star-shaped polygon as fanPanel (apex `pts[0]` → boundary), but
// subdivided into concentric RINGS so interior vertices exist, then each interior ring
// is SAGGED below the apex→edge chord (a smooth chordwise billow). This is what lifts a
// membrane out of "flat moth wing" into a taut, stretched, slightly-concave sail — the
// premium read on the Seraph/Sovereign wings. `sag` = max dip (world units); the dip is
// 0 at the apex and the boundary, peaks mid-span (sin), so the bones stay crisp and only
// the free membrane bellies. A faint per-vertex emissive lift (vertexColors) is NOT done
// here (kept to the material) so this works with any membrane material.
function billowedFan(pts, mat, rings, sag) {
  const apex = pts[0], boundary = pts.slice(1), m = boundary.length;
  const R = Math.max(2, rings);
  const pos = [apex.x, apex.y, apex.z];
  const idxOf = (r, j) => (r === 0 ? 0 : 1 + (r - 1) * m + j);
  for (let r = 1; r <= R; r++) {
    const fr = r / R, crown = Math.sin(Math.PI * fr) * sag;   // crown the middle UP, pin the edges
    for (let j = 0; j < m; j++) {
      const b = boundary[j];
      // +Y = CONVEX from the dorsal (top) view — the wing's upper surface domes up like a
      // real aerofoil, not a dished sag; 0 at the apex + boundary so the bones stay crisp.
      pos.push(apex.x + (b.x - apex.x) * fr, apex.y + (b.y - apex.y) * fr + crown, apex.z + (b.z - apex.z) * fr);
    }
  }
  const idx = [];
  for (let j = 0; j < m - 1; j++) idx.push(0, idxOf(1, j), idxOf(1, j + 1));   // apex → first ring
  for (let r = 1; r < R; r++) for (let j = 0; j < m - 1; j++) {
    const a = idxOf(r, j), b = idxOf(r, j + 1), c = idxOf(r + 1, j), d = idxOf(r + 1, j + 1);
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// A bright TRAILING-EDGE RIM: a thin tube run along an ordered list of edge points (the
// scalloped trailing edge). A crisp emissive line on the silhouette edge is the cheap
// premium accent the Sovereign's cyan rim and the Seraph's gold rim both use.
function edgeRim(edgePts, mat, rad, ws) {
  if (edgePts.length < 2) return null;
  const curve = new THREE.CatmullRomCurve3(edgePts, false, 'catmullrom', 0.5);
  const geo = new THREE.TubeGeometry(curve, Math.max(12, seg(20)), rad * ws, seg(4), false);
  return new THREE.Mesh(geo, mat);
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

// A TAPERED tube swept along a 3D curve: radius lerps r0→r1 so a bone can be thick at
// the root and taper to a sharp tip (TubeGeometry is constant-radius). Used for the
// dominant leading-edge spar (thick→sharp wingtip).
function taperedTube(curve, r0, r1, mat, lenSegs, radial) {
  const N = lenSegs, R = radial;
  const pts = curve.getPoints(N);
  const fr = curve.computeFrenetFrames(N, false);
  const pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const r = r0 + (r1 - r0) * (i / N);
    const c = pts[i], n = fr.normals[i], b = fr.binormals[i];
    for (let j = 0; j <= R; j++) {
      const a = (j / R) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
      pos.push(c.x + r * (dx * n.x + dy * b.x), c.y + r * (dx * n.y + dy * b.y), c.z + r * (dx * n.z + dy * b.z));
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < R; j++) {
    const p = i * (R + 1) + j, q = p + R + 1;
    idx.push(p, q, p + 1, q, q + 1, p + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// A membrane filled as a RADIAL FAN from an interior HUB point (near the wrist) out to
// the boundary loop. Each bay between two fingers becomes a taut triangular sail panel
// stretched from the hub to the scalloped trailing edge — reads as a membrane under
// TENSION between bones, not a flat hanging panel. `P` maps 2D (span,chord) → 3D with
// the wing's dihedral/twist baked in, so the sheet is a subtly curved aerofoil.
function membraneFan(hub2D, boundary2D, P, mat) {
  const pos = [], idx = [];
  const hub = P(hub2D); pos.push(hub.x, hub.y, hub.z);
  for (const p of boundary2D) { const v = P(p); pos.push(v.x, v.y, v.z); }
  const m = boundary2D.length;
  for (let i = 0; i < m; i++) idx.push(0, 1 + i, 1 + ((i + 1) % m));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// Sample a quadratic bezier a→(ctrl)→b into 2D [x,y] points (k=1..n), pushing onto out.
function pushQuad2D(out, a, ctrl, b, n) {
  for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1]]); }
}
// A scallop control point: perpendicular sag off the a→b chord, toward `toward`, by
// `depth`×|a−b| — the smooth inward dip of the membrane edge between two fingertips.
function sagCtrl(a, b, toward, depth) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  let px = -(b[1] - a[1]), py = b[0] - a[0]; const pl = Math.hypot(px, py) || 1; px /= pl; py /= pl;
  if (px * (toward[0] - mx) + py * (toward[1] - my) < 0) { px = -px; py = -py; }
  const d = depth * Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [mx + px * d, my + py * d];
}

// ── GLIDER WING (opt-in via anatomy.glider) ─────────────────────────────────────────
// A redesigned dragon/wyvern wing with a true bone HIERARCHY and an aerofoil read:
//   • Wing root grows from a shoulder SOCKET mass (not a flat side point).
//   • A single DOMINANT leading-edge spar sweeps shoulder → elbow → wrist → swept tip
//     (thick→sharp taper, brightest glow). The wrist sits at the OUTER third, so the
//     silhouette has a clear elbow + wrist BEND, not a circular umbrella.
//   • From the wrist, a few FINGER struts fan back/down into the membrane — thinner and
//     DIMMER than the spar (glow hierarchy), varied in length/angle (not an even fan).
//   • The membrane is a radial fan from a hub near the wrist → taut stretched bays with
//     scalloped trailing edges; a SMALL angled inner triangle at the body, not a curtain.
//   • Dihedral + washout twist (tips higher than root, trailing edge lower) so it never
//     reads as flat cardboard. Built in ONE frame on `pivot` → still seam-free in any pose.
function buildGliderWing(opts) {
  const ws = opts.ws ?? 1;
  const mem = opts.membraneMat;
  const leadMat = opts.leadMat || opts.strutMat;
  const fingerMat = opts.fingerMat || opts.strutMat;
  const jointMat = opts.jointMat || leadMat;
  const socketMat = opts.socketMat || jointMat;
  const A = opts.anatomy;
  const fingers = A.fingers, nF = fingers.length;
  const f0 = fingers[0].tip;                                  // leading finger tip = the wingtip
  const maxSpan = Math.max(A.wrist[0], ...fingers.map((f) => f.tip[0]));
  const DIH = (A.dihedral ?? 0.16) * maxSpan * ws;            // tip lift above the root
  const TWIST = (A.twist ?? 0.12) * ws;                       // leading up / trailing down (washout)
  const depthY = (x, y) => DIH * Math.pow(Math.min(1, Math.max(0, x) / maxSpan), 1.15) + TWIST * y;
  const P = (p) => new THREE.Vector3(p[0] * ws, depthY(p[0], p[1]), -p[1] * ws);

  const pivot = new THREE.Group();
  pivot.userData.wingRole = 'pivot';

  // ── membrane boundary (2D span,chord), CCW: leading edge → trailing scallops → inner ──
  const boundary = [];
  const leadCurve = new THREE.CatmullRomCurve3([A.rootFront, A.elbow, A.wrist, f0].map((p) => new THREE.Vector3(p[0], p[1], 0)), false, 'catmullrom', 0.5);
  for (const v of leadCurve.getPoints(seg(11))) boundary.push([v.x, v.y]);
  const claw = A.claw ?? 0.08;
  // web tips sit slightly short of the bone tip (except the leading frame) so the strut
  // pokes out as a claw point; the membrane scallops run between these web tips.
  const webTip = (f, i) => (i === 0 ? f.tip : [A.wrist[0] + (f.tip[0] - A.wrist[0]) * (1 - claw), A.wrist[1] + (f.tip[1] - A.wrist[1]) * (1 - claw)]);
  const tips = fingers.map(webTip);
  for (let i = 0; i < nF - 1; i++) pushQuad2D(boundary, tips[i], sagCtrl(tips[i], tips[i + 1], A.wrist, A.scallop ?? 0.3), tips[i + 1], seg(5));
  // inner trailing edge: innermost finger → short rootBack, gently concave (stretched, not a curtain)
  pushQuad2D(boundary, tips[nF - 1], sagCtrl(tips[nF - 1], A.rootBack, A.wrist, A.innerSag ?? 0.12), A.rootBack, seg(6));
  // (the loop auto-closes rootBack → rootFront — the short body attachment edge)
  const hub = A.hub ?? [A.wrist[0] * 0.72, A.wrist[1] * 0.2];
  pivot.add(membraneFan(hub, boundary, P, mem));

  // ── bones ──
  // DOMINANT leading spar: thick→sharp tapered tube along shoulder→elbow→wrist→tip.
  const spar = new THREE.CatmullRomCurve3([A.rootFront, A.elbow, A.wrist, f0].map((p) => P(p)), false, 'catmullrom', 0.5);
  pivot.add(taperedTube(spar, (A.leadR ?? 0.07) * ws, (A.leadR ?? 0.07) * ws * 0.3, leadMat, Math.max(10, seg(18)), seg(5)));
  // finger struts (dim, thin, varied) from the wrist to each trailing tip.
  for (let i = 1; i < nF; i++) pivot.add(curvedBone(P(A.wrist), P(fingers[i].tip), fingers[i].bow ?? 0.25, ws, fingerMat, A.fingerR ?? 0.032));
  // joints — wrist is the brightest/biggest (the visual bend), elbow secondary.
  const eN = new THREE.Mesh(new THREE.OctahedronGeometry(0.065 * ws, 0), jointMat); eN.position.copy(P(A.elbow)); pivot.add(eN);
  const wN = new THREE.Mesh(new THREE.OctahedronGeometry(0.10 * ws, 0), jointMat); wN.position.copy(P(A.wrist)); pivot.add(wN);
  // shoulder SOCKET mass at the root so the wing grows from the back, not a flat point.
  if (A.socket !== false) {
    const s = new THREE.Mesh(new THREE.SphereGeometry((A.socketR ?? 0.17) * ws, seg(8), seg(6)), socketMat);
    s.scale.set(1.15, 0.8, 1.0);
    s.position.copy(P([(A.rootFront[0] + A.rootBack[0]) / 2 + 0.04, (A.rootFront[1] + A.rootBack[1]) / 2]));
    pivot.add(s);
  }

  // empty rig handles (engine pose code + FX role lookups) — geometry stays one welded sheet.
  const wingMid = new THREE.Group(); wingMid.position.copy(P(A.elbow)); wingMid.userData.wingRole = 'mid'; pivot.add(wingMid);
  const wingTip = new THREE.Group(); wingTip.position.copy(P(A.wrist).sub(P(A.elbow))); wingTip.userData.wingRole = 'tip'; wingMid.add(wingTip);
  const marker = new THREE.Object3D(); marker.position.copy(P(f0)); marker.userData.wingRole = 'marker'; pivot.add(marker);
  return { pivot, wingMid, wingTip, marker };
}

export function buildAnatomicalWing(opts) {
  if (opts.anatomy && opts.anatomy.glider) return buildGliderWing(opts);
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
  // Single pivot-local 3D mapper: +span → +X, +chord (+y leading) → −Z. Optional
  // DIHEDRAL (tips raised above the root) + washout TWIST (leading up / trailing down)
  // lift the sheet out of the flat plane so it reads like a stretched aerofoil, not a
  // kite. Both default to 0 → dead-flat (Thundercoil's wing is byte-identical).
  const maxSpanL = Math.max(A.wrist[0], ...fingers.map((f) => f.tip[0]));
  const DIHl = (A.dihedral ?? 0) * maxSpanL * ws, TWl = (A.twist ?? 0) * ws;
  const depthY = (x, y) => DIHl * Math.pow(Math.min(1, Math.max(0, x) / maxSpanL), 1.15) + TWl * y;
  const P = (p) => new THREE.Vector3(p[0] * ws, depthY(p[0], p[1]), -p[1] * ws);
  // Glow HIERARCHY (optional): the leading frame + arm spar read brightest/thickest,
  // the inner finger struts dimmer/thinner. Fall back to the single strut material.
  const leadM = opts.leadMat || strut, fingerM = opts.fingerMat || strut;

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
  // billow it lightly (cambered, not flat) when the creature opts in.
  const billow = (A.billow ?? 0) * ws;
  const armPts = [P(A.rootFront), P(A.elbow), P(A.wrist), P(wristTrail), P(A.rootBack)];
  pivot.add(billow > 0 ? billowedFan(armPts, mem, seg(3), billow * 0.6) : fanPanel(armPts, mem));
  // arm bones (humerus + forearm) + joint nodes, same frame.
  pivot.add(curvedBone(P(A.rootFront), P(A.elbow), 0.12, ws, leadM, (A.strutR ?? 0.04) * 1.5));   // humerus (short)
  pivot.add(curvedBone(P(A.elbow), P(A.wrist), 0.16, ws, leadM, (A.strutR ?? 0.04) * 1.3));        // forearm
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
      leadStrut = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, seg(14)), (A.strutR ?? 0.035) * ws, seg(4), false), leadM);
      wingtipV = hookTip;
    } else {
      leadPts = bezier(a, conv, lfTip, sampN);
      leadStrut = curvedBone(a, lfTip, fingers[0].bow, ws, leadM, A.strutR ?? 0.035);
      wingtipV = lfTip;
    }
  }

  // Membrane outline (wrist-local), fanned from the wrist: the leading frame, then
  // smooth catenary scallops from the wingtip through the inner web tips, deep enough
  // that each fingertip reads as a point.
  const outline = [wristV, ...leadPts.slice(1)];
  const trailPts = [wingtipV.clone()];                       // for the bright trailing-edge rim
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
    const seg2 = bezier(a, ctrl, b, sampN).slice(1);
    outline.push(...seg2);
    trailPts.push(...seg2);
  }
  // close via the shared wrist→wristTrail edge so the hand-wing welds to the arm membrane
  // along the full wrist line (same frame → a true weld, gap-free in every pose).
  outline.push(P(wristTrail));
  // CAMBERED (billowed) membrane when opted in — a taut, slightly-concave sail instead of
  // a flat sheet; the single biggest "not a flat moth wing" win.
  pivot.add(billow > 0 ? billowedFan(outline, mem, seg(4), billow) : fanPanel(outline, mem));
  // bright molten TRAILING-EDGE RIM along the scallops (premium silhouette accent).
  if (opts.rimMat) { const rim = edgeRim(trailPts, opts.rimMat, A.rimR ?? 0.022, ws); if (rim) pivot.add(rim); }

  pivot.add(leadStrut);
  if (A.taperedClaws) {
    // Finger struts as real BONES — THICK at the wrist, TAPERING to a bony CLAW point
    // that ends just SLIGHTLY past where the two membrane scallops join (the web tip),
    // NOT a long straight rod to the full anatomical fingertip. (Opt-in: the default
    // path below is unchanged so other creatures sharing this builder are byte-identical.)
    const clawLen = (A.clawLen ?? 0.09) * ws;
    const r0 = (A.strutR ?? 0.035) * (A.fingerRMul ?? 1) * 1.35;
    for (let i = 1; i < nF; i++) {
      const f = fingers[i];
      const wtP = webTip(f, i);                        // the scallop-join point (web ends here)
      const dir = tip(f).clone().sub(wristV);
      if (dir.lengthSq() > 1e-9) dir.normalize();
      const clawEnd = wtP.clone().addScaledVector(dir, clawLen);   // bony point just past the join
      const ctrl = wristV.clone().lerp(clawEnd, 0.5).add(leadingPerp(wristV, clawEnd).multiplyScalar(f.bow * ws));
      const curve = new THREE.QuadraticBezierCurve3(wristV, ctrl, clawEnd);
      pivot.add(taperedTube(curve, r0, 0.004 * ws, fingerM, Math.max(5, seg(9)), seg(4)));
    }
  } else {
    // Default: finger struts to the FULL tips (inner ones protrude past the web as points).
    for (let i = 1; i < nF; i++) pivot.add(curvedBone(wristV, tip(fingers[i]), fingers[i].bow, ws, fingerM, (A.strutR ?? 0.035) * (A.fingerRMul ?? 1)));
  }

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
