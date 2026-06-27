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

// ── TRACED WING (opt-in via anatomy.leadingCurve) ────────────────────────────────────
// The leading edge follows an EXPLICIT polyline TRACED from a reference planform (a true
// convex arc — root → forward peak → wingtip), not a single bezier `bow`, so the
// silhouette matches the art exactly. The struts still fan from a medial wrist (our
// researched anatomy); the trailing edge scallops between the fingertips. Convex billow +
// molten rim as the other paths. One welded frame on `pivot` (seam-free in any pose).
function buildTracedWing(opts) {
  const ws = opts.ws ?? 1, mem = opts.membraneMat;
  const leadM = opts.leadMat || opts.strutMat, fingerM = opts.fingerMat || opts.strutMat;
  const jointMat = opts.jointMat || leadM, rimMat = opts.rimMat;
  const A = opts.anatomy, lc = A.leadingCurve, fingers = A.fingers, wrist2 = A.wrist;
  const tipSpan = lc[lc.length - 1][0];
  const maxSpan = Math.max(tipSpan, ...fingers.map((f) => f.tip[0]));
  const DIH = (A.dihedral ?? 0) * maxSpan * ws, TW = (A.twist ?? 0) * ws;
  const depthY = (x, y) => DIH * Math.pow(Math.min(1, Math.max(0, x) / maxSpan), 1.15) + TW * y;
  const P = (p) => new THREE.Vector3(p[0] * ws, depthY(p[0], p[1]), -p[1] * ws);
  const pivot = new THREE.Group(); pivot.userData.wingRole = 'pivot';
  const claw = A.claw ?? 0.1;

  // ── body-CONFORM (root-cause gap fix) ────────────────────────────────────────
  // A flat membrane sheet hung off ONE pivot can't follow a rounded, tapering body:
  // its inner-trailing corner (rootBack) is defined in the flat wing plane, so when
  // the body surface drops/narrows under it that corner FLOATS, opening the V-notch
  // gap. We snap ONLY the corners that genuinely hover OVER the body (within the body
  // half-width AND outside its cross-section) down onto the skin — the visible scallops
  // sit far out beside the body (|dx|≫rx) and pass through untouched, so the traced
  // silhouette is unchanged. Pivot-local = model space minus wingRoot (pivot is only
  // translated, never rotated); the body is symmetric so the right master conforms
  // against +x and the mirror inherits it.
  const wr = opts.wingRoot, ringAt = opts.attach && opts.attach.ringAt;
  // Gate by the AUTHORED span coordinate (p[0]), NOT a world-distance test: span is
  // wingScale-independent, so the same root edge conforms at every form/tier (a |dx|<rx
  // test silently fails once wingScale pushes the root past the body half-width). Only the
  // buried root vertices (span ≤ rootSpan) attach to the flank; the first real scallop is
  // at span 0.4, so the visible silhouette is never touched.
  const rootSpan = A.rootConformSpan ?? 0.25;
  const conformP = (p) => {
    const local = P(p);
    if (!ringAt || !wr || p[0] > rootSpan) return local;                   // not the root edge → keep as traced
    const wx = local.x + wr.x, wy = local.y + wr.y, wz = local.z + wr.z;   // model space
    const r = ringAt(wz); if (!r || !r.rx || !r.ry) return local;
    const dx = wx, dy = wy - r.cy;                                          // body centred at x=0
    const e = (dx * dx) / (r.rx * r.rx) + (dy * dy) / (r.ry * r.ry);        // <1 inside flank, >1 outside
    if (e <= 1) return local;                                              // already on/inside the skin → body covers it
    const k = (1 / Math.sqrt(e)) * 0.95;                                    // radial snap onto the skin, tucked just inside
    return new THREE.Vector3(dx * k - wr.x, r.cy + dy * k - wr.y, local.z); // back to pivot-local (z = chord, unchanged)
  };

  // leading edge: smooth CatmullRom through the traced points (rootFront → wingtip).
  const leadCurve = new THREE.CatmullRomCurve3(lc.map((p) => P(p)), false, 'catmullrom', 0.5);
  const leadPts = leadCurve.getPoints(seg(16));
  const wristV = P(wrist2);
  const webTip = (f) => wristV.clone().lerp(P(f.tip), 1 - claw);
  // membrane OUTLINE: leading curve (root→tip), then the trailing edge back to the root.
  const outline = [...leadPts], trailPts = [];
  const hub2D = A.hub ?? [wrist2[0] * 0.9, (wrist2[1] + A.rootBack[1]) * 0.5];
  const billow = (A.billow ?? 0) * ws;

  // ── N-BONE SKINNED CHAIN for a TRAVELLING RIPPLE (not a root hinge) ──────────────
  // The membrane + spar + struts are SKINNED to a CHAIN of bones strung down the span, so
  // when the animator drives the chain as a phase-LAGGED cascade the bend travels outward
  // like a real wing — each bone trails the one inboard of it (a ripple), instead of the
  // whole wing swinging rigidly from one shoulder hinge. ONE seamless skin (split panels
  // would re-open the L114 seam): each vertex blends between its two bracketing bones by
  // SPAN (smoothstep). Bone 0 is STATIC — it holds the body-conformed root/seam so the
  // attachment never lifts off the flank while the rest ripples. Only the traced wing skins.
  const skinned = !!(A.trailingCurve && wr);
  let chain = null, skel = null;
  let skinByX = (g, mt) => new THREE.Mesh(g, mt);
  let wristBoneLocal = new THREE.Vector3();
  if (skinned) {
    const sstep = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
    const fr = A.boneFracs ?? [0, 0.16, 0.34, 0.55, 0.80];               // span fractions of maxSpan
    const spans = fr.map((f) => f * maxSpan);
    chain = [];
    for (let i = 0; i < spans.length; i++) {
      const b = new THREE.Bone();
      b.position.set((spans[i] - (i ? spans[i - 1] : 0)) * ws, depthY(spans[i], 0) - (i ? depthY(spans[i - 1], 0) : 0), 0);
      (i ? chain[i - 1] : pivot).add(b);
      chain.push(b);
    }
    const last = chain.length - 1, midIdx = Math.max(1, Math.round(last / 2));
    chain[midIdx].userData.wingRole = 'mid'; chain[last].userData.wingRole = 'tip';
    wristBoneLocal.set(spans[last] * ws, depthY(spans[last], 0), 0);     // tip bone in pivot-local (for the marker)
    // span (local x / ws) → bracketing bone pair [a, b, wA, wB], smoothstep between bone spans.
    const spanSkin = (ax) => {
      if (ax <= spans[0]) return [0, 0, 1, 0];
      for (let i = 0; i < last; i++) if (ax <= spans[i + 1]) { const t = sstep((ax - spans[i]) / (spans[i + 1] - spans[i])); return [i, i + 1, 1 - t, t]; }
      return [last, last, 1, 0];
    };
    skel = new THREE.Skeleton(chain);
    skinByX = (g, mt) => {
      const p = g.attributes.position, n = p.count;
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) { const s = spanSkin(p.getX(k) / ws); si[k * 4] = s[0]; si[k * 4 + 1] = s[1]; sw[k * 4] = s[2]; sw[k * 4 + 1] = s[3]; }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      const m = new THREE.SkinnedMesh(g, mt); m.frustumCulled = false; m.bind(skel); return m;
    };
  }
  if (A.trailingCurve) {
    // ── ONE LOFTED MEMBRANE (single continuous surface) ──────────────────────────
    // The wing is built as a single sheet LOFTED between the trailing and leading edges,
    // span station by span station (both traced curves share the same span samples, so the
    // rows stay chordwise). There is NO hub and NO separate root panel, so the surface has
    // no fan creases and no welded-on "second part" — it is one skin from the body to the
    // wingtip. The INNERMOST rows are conformed onto the body flank (conformP, root-gated),
    // so the membrane GROWS from the body — connected from the start, the silhouette
    // (leading + trailing) byte-identical to the trace.
    const tc2d = A.trailingCurve, rows = lc.length;
    const S = 2, M = Math.max(3, seg(5));                       // span subdiv (smoothing) · chord subdiv
    const lead = lc.map((p) => conformP(p));                    // leading edge (root buried/conformed)
    const trail = tc2d.map((p) => conformP(p));                 // trailing edge (root snapped onto the flank)
    for (let i = tc2d.length - 1; i >= 0; i--) trailPts.push(trail[i]);   // molten rim along the trailing edge
    const pos = [], idx = [], grid = [], totalRows = (rows - 1) * S + 1;
    for (let ri = 0; ri < totalRows; ri++) {
      const f = ri / S, i0 = Math.min(rows - 1, Math.floor(f)), i1 = Math.min(rows - 1, i0 + 1), ft = f - i0;
      const a = trail[i0].clone().lerp(trail[i1], ft);         // trailing point at this span
      const b = lead[i0].clone().lerp(lead[i1], ft);           // leading point at this span
      const span = lc[i0][0] + (lc[i1][0] - lc[i0][0]) * ft;
      const gain = Math.min(1, Math.max(0, (span + 0.45) / 1.4));   // dome ~0 at the buried root → full mid-wing
      const row = [];
      for (let j = 0; j <= M; j++) {
        const t = j / M, v = a.clone().lerp(b, t);
        v.y += Math.sin(Math.PI * t) * billow * gain;          // CONVEX dome (+Y), pinned at both edges + root
        pos.push(v.x, v.y, v.z); row.push(pos.length / 3 - 1);
      }
      grid.push(row);
    }
    for (let ri = 0; ri < totalRows - 1; ri++) for (let j = 0; j < M; j++) {
      const a = grid[ri][j], b = grid[ri][j + 1], c = grid[ri + 1][j], d = grid[ri + 1][j + 1];
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    pivot.add(skinByX(g, mem));
  } else {
    const scStarts = [leadPts[leadPts.length - 1], ...fingers.map(webTip), P(A.rootBack)];
    for (let i = 0; i < scStarts.length - 1; i++) {
      const a = scStarts[i], b = scStarts[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      const perp = new THREE.Vector3(-(b.z - a.z), 0, b.x - a.x).normalize();
      if (perp.dot(P(hub2D).clone().sub(mid)) < 0) perp.negate();
      const ctrl = mid.add(perp.multiplyScalar((A.scallop ?? 0.25) * a.distanceTo(b)));
      const sgs = bezier(a, ctrl, b, seg(5)).slice(1);
      outline.push(...sgs);
      if (i < scStarts.length - 2) trailPts.push(a, ...sgs);
    }
    const fanPts = [P(hub2D), ...outline];
    pivot.add(billow > 0 ? billowedFan(fanPts, mem, seg(4), billow) : fanPanel(fanPts, mem));
  }
  // rim, spar + struts are all SKINNED by span too (skinByX) so the bones, edge and skin
  // bend together as one wing; for non-traced wings skinByX is a passthrough Mesh.
  if (rimMat) { const rim = edgeRim(trailPts, rimMat, A.rimR ?? 0.022, ws); if (rim) pivot.add(skinByX(rim.geometry, rimMat)); }

  // bones: a DOMINANT tapered leading spar along the traced curve + finger struts (claws).
  const spar = taperedTube(leadCurve, (A.leadR ?? 0.07) * ws, (A.leadR ?? 0.07) * ws * 0.28, leadM, Math.max(12, seg(18)), seg(5));
  pivot.add(skinByX(spar.geometry, spar.material));
  for (const f of fingers) {
    const t = P(f.tip), dir = t.clone().sub(wristV);
    if (dir.lengthSq() > 1e-9) dir.normalize();
    const clawEnd = webTip(f).addScaledVector(dir, (A.clawLen ?? 0.09) * ws);
    const ctrl = wristV.clone().lerp(clawEnd, 0.5).add(leadingPerp(wristV, clawEnd).multiplyScalar((f.bow ?? 0.2) * ws));
    // bow the strut UP (+Y) so it follows the CONVEX membrane dome instead of cutting flat
    // across it; matched to the membrane billow so bone + skin curve together.
    ctrl.y += (A.strutCrown ?? (A.billow ?? 0) * 1.25) * ws;
    const curve = new THREE.QuadraticBezierCurve3(wristV, ctrl, clawEnd);
    const strut = taperedTube(curve, (A.strutR ?? 0.04) * (A.fingerRMul ?? 1) * 1.35 * ws, 0.004 * ws, fingerM, Math.max(5, seg(9)), seg(4));
    pivot.add(skinByX(strut.geometry, strut.material));
  }
  const wristNode = new THREE.Mesh(new THREE.OctahedronGeometry(0.085 * ws, 0), jointMat);
  wristNode.position.copy(wristV); (skinned ? chain[0] : pivot).add(wristNode);   // rides the static root bone

  // rig handles: for the skinned wing the CHAIN bones are the handles (mid + tip tagged) so the
  // animator drives the whole cascade; otherwise empty Group handles as before.
  let wingMid, wingTip;
  if (skinned) {
    wingMid = chain.find((b) => b.userData.wingRole === 'mid');
    wingTip = chain.find((b) => b.userData.wingRole === 'tip');
  } else {
    wingMid = new THREE.Group(); wingMid.position.copy(wristV); wingMid.userData.wingRole = 'mid'; pivot.add(wingMid);
    wingTip = new THREE.Group(); wingTip.position.copy(P(lc[Math.floor(lc.length * 0.6)]).sub(wristV)); wingTip.userData.wingRole = 'tip'; wingMid.add(wingTip);
  }
  const marker = new THREE.Object3D(); marker.userData.wingRole = 'marker';
  if (skinned) { marker.position.copy(leadPts[leadPts.length - 1]).sub(wristBoneLocal); wingTip.add(marker); }   // rides the wingtip
  else { marker.position.copy(leadPts[leadPts.length - 1]); pivot.add(marker); }
  return { pivot, wingMid, wingTip, marker, chain };
}

export function buildAnatomicalWing(opts) {
  if (opts.anatomy && opts.anatomy.leadingCurve) return buildTracedWing(opts);
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
