import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SERAPH WING — ONE procedural low-poly angel wing (SHAPE STUDY, isolated).
//
// The target (reference IMG_7394): a classic angel wing that sweeps UP-and-OUT from
// a small shoulder base. Defining features, in priority order:
//   1. An OBTUSE-ANGLE BEND (~110–130°) at the "wrist": the leading-edge bone rises
//      steeply UP from the shoulder, bends at the wrist, then the long primaries
//      sweep OUT to the side. That bend is the whole silhouette (space for six wings
//      to fan out later). NOT a straight triangle, NOT a spiky blade.
//   2. THREE layered feather rows tiling like roof shingles, each overlapping the next:
//      COVERTS (short rounded plumes packed at the shoulder), SECONDARIES (medium, the
//      mid "forearm"), PRIMARIES (long tapered blades at the tip, slightly fanned).
//   3. ROUNDED feather tips — every feather is a flat, gently-curved, rounded-tip lobe
//      (a soft teardrop), NEVER a spike.
//   4. A cupped curve with real front-to-back DEPTH: the rows stagger in Z so the
//      PROFILE reads as a layered wing, not a flat paper sliver.
//
// Built on a single shoulder PIVOT at the base so it can be rotated to any angle and
// mirror-instanced (scale.x = -1) into a six-winged seraph later. buildSeraphWing(opts)
// → { group, pivot, mat }. group holds the pivot; the pivot holds all geometry.
// ═══════════════════════════════════════════════════════════════════════════════

// ── ROUNDED-TIP FEATHER LOBE ────────────────────────────────────────────────────
// One flat feather in its own local frame: LENGTH runs along +Z, WIDTH along ±X, and
// the face is CUPPED along +Y (a gentle camber). The outline is a soft teardrop that
// widens quickly off the quill, then TAPERS to a genuinely ROUNDED tip capped by a
// semicircular arc (never a point/spike). Returned NON-INDEXED (explicit tris) so a
// whole row merges cleanly. `curl` bows the whole lobe forward (+Z→+Y) so tips lift.
function featherLobe(len, wid, cup = 0.10, curl = 0.14) {
  const tipFrac = 0.80;                 // body runs 0→tipFrac; the arc caps the rest
  const halfW = (s) => {                // half-width along the length param s∈[0,1]
    const rise = 0.34 + 0.66 * Math.min(s / 0.14, 1);        // BLUNT quill (34% root width, no needle)
    const t2 = Math.max(s - 0.14, 0) / (tipFrac - 0.14);     // 0 at shoulder → 1 at arc
    const taper = 1 - 0.42 * Math.pow(t2, 1.25);             // gentle taper, stays broad
    return wid * 0.5 * rise * taper;
  };
  // Camber: cup up along +Y (parabolic along length) + a slight forward curl of the tip.
  const camber = (z) => {
    const t = z / len;
    return cup * len * (t - t * t) + curl * len * Math.pow(t, 1.6);
  };

  // Outline as (x, z) around the lobe: right edge up → rounded tip arc → left edge down.
  const NB = 5, NA = 5;
  const right = [];
  for (let i = 0; i <= NB; i++) { const s = tipFrac * i / NB; right.push([halfW(s), s * len]); }
  const rTip = halfW(tipFrac), zc = tipFrac * len;
  const arc = [];
  for (let i = 1; i < NA; i++) { const a = Math.PI * i / NA; arc.push([rTip * Math.cos(a), zc + rTip * Math.sin(a)]); }
  const left = [];
  for (let i = NB; i >= 1; i--) { const s = tipFrac * i / NB; left.push([-halfW(s), s * len]); }
  const outline = [...right, ...arc, ...left];   // closed loop back near the quill root

  // Fan-triangulate from the quill root (0,0). Star-convex from the root → clean fan.
  const root = [0, camber(0), 0];
  const P = ([x, z]) => [x, camber(z), z];
  const tris = [];
  for (let i = 0; i < outline.length; i++) tris.push([root, P(outline[i]), P(outline[(i + 1) % outline.length])]);

  const v = [];
  for (const [a, b, c] of tris) v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  return g;
}

// Lay a run of feather lobes along a placement callback and MERGE to one mesh (one
// draw call). `dir(t)` is the length direction (local +Z maps onto it); `face(t)` the
// cup normal (local +Y). Each lobe is transformed IN PLACE (bake), never per-mesh, so
// the merge collapses the row. Returns the merged geometry (position-only, non-indexed).
function featherRow({ count, at, dir, face, lengthAt, widthAt, cup = 0.10, curl = 0.14 }) {
  const geos = [];
  const N = new THREE.Vector3(), T = new THREE.Vector3(), X = new THREE.Vector3();
  const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const g = featherLobe(lengthAt(t), widthAt(t), cup, curl);
    T.copy(dir(t)).normalize();                 // local +Z → length direction
    N.copy(face(t)).normalize();
    N.addScaledVector(T, -N.dot(T)).normalize(); // re-orthogonalise the cup normal
    X.crossVectors(N, T).normalize();            // local +X → width (right-handed)
    mat4.makeBasis(X, N, T); q.setFromRotationMatrix(mat4);
    g.applyQuaternion(q);
    const p = at(t); g.translate(p.x, p.y, p.z);
    geos.push(g);
  }
  const merged = mergeGeometries(geos);
  if (!merged) throw new Error('featherRow: mergeGeometries returned null');
  return merged;
}

// ── THE WING ────────────────────────────────────────────────────────────────────
export function buildSeraphWing(opts = {}) {
  const {
    color = 0x16181f,        // near-black feather body (eyes/tint come later)
    span = 1.0,              // overall scale knob
  } = opts;

  const mat = new THREE.MeshStandardMaterial({
    color, flatShading: true, side: THREE.DoubleSide, roughness: 0.62, metalness: 0.06,
    emissive: 0x05070c, emissiveIntensity: 0.6,   // faint self-floor so near-black still shows form
  });

  // ── THE ARMATURE (in the wing plane: X = out, Y = up, Z = depth) ────────────────
  // ANATOMY, not a stick+fan. A single LEADING-EDGE BONE runs shoulder → wrist → hand-end
  // with an OBTUSE bend at the wrist (steep forearm ~72°, then the hand kicks up-and-out →
  // ~130° interior angle). Feathers are rooted ALONG this bone and RAKE off its trailing
  // side, so the whole wing fills as one continuous crescent (no isolated arm, no gap). The
  // RAKE angle (feather-vs-bone) is wide at the base (short coverts/secondaries trail out to
  // the side) and narrows toward the tip (long primaries rake back nearly parallel to the
  // bone → the swept-up-and-out read). Longer toward the tip → the tip is the primary blades.
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z).multiplyScalar(span);
  const D2R = Math.PI / 180;
  const rotXY = (v, deg) => {   // rotate an in-plane vector by `deg` (CCW), keep z
    const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
    return new THREE.Vector3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  };

  const dirOf = (deg) => new THREE.Vector3(Math.cos(deg * D2R), Math.sin(deg * D2R), 0);

  // TWO PARTS with a SHARP WRIST KNUCKLE. The FOREARM is a NEAR-VERTICAL bone S→W (~84°);
  // secondaries + coverts rake off it. At the wrist the PRIMARIES fire off as a clean FAN
  // (top blade ~48° → bottom ~18°) — the angular jump from the near-vertical forearm to the
  // primary fan IS the obtuse knuckle (~125–130° interior), not a smooth banana arc. The
  // primary fan clusters at the wrist so their leading edges align into ONE clean top contour
  // while their tips splay apart with real daylight between them.
  const S = V(0.00, 0.00);      // shoulder / base (pivot origin)
  const W = V(0.26, 2.32);      // WRIST — near-vertical forearm (≈ 84°); fan origin
  const foreDir = W.clone().sub(S).normalize();
  const foreLen = W.distanceTo(S);
  const foreP = (u) => S.clone().lerp(W, u);

  const group = new THREE.Group();
  const pivot = new THREE.Group();      // the shoulder pivot — everything hangs off this
  group.add(pivot);

  // Cup normal — the face tilts toward +Z (front) so flat-shading + the profile read the
  // layered depth. All rows share it; a small per-row Z OFFSET staggers them into a shell.
  const faceZ = () => new THREE.Vector3(0.0, 0.30, 1).normalize();

  // FOREARM row: lobes rooted along S→W (u0→u1), raking off the forearm by rake0→rake1°.
  const foreRow = ({ count, u0, u1, rake0, rake1, len0, len1, w0, w1, z, cup, curl }) => featherRow({
    count,
    at: (t) => foreP(u0 + (u1 - u0) * t).setZ(z),
    dir: (t) => rotXY(foreDir, -(rake0 + (rake1 - rake0) * t)),
    face: faceZ,
    lengthAt: (t) => len0 + (len1 - len0) * t,
    widthAt: (t) => w0 + (w1 - w0) * t,
    cup, curl,
  });
  // FAN row: lobes radiating from `origin`, sweeping deg0→deg1, rooted progressively along
  // `march` (t=0 outermost/longest → t=1 innermost), at depth `z`.
  const fanRow = ({ count, origin, march, deg0, deg1, len0, len1, w0, w1, z, cup, curl }) => featherRow({
    count,
    at: (t) => origin.clone().add(march.clone().multiplyScalar(1 - t)).setZ(z),
    dir: (t) => dirOf(deg0 + (deg1 - deg0) * t),
    face: faceZ,
    lengthAt: (t) => len0 + (len1 - len0) * t,
    widthAt: (t) => w0 + (w1 - w0) * t,
    cup, curl,
  });

  // Depth layers stagger in Z with a WIDE spread (primaries back → secondaries → coverts
  // front) so the angled profile reads as a deep, cupped, overlapping shell — not a sliver.
  const zPrim = 0.0, zSec = 0.34 * span, zLobe = 0.18 * span, zCov = 0.66 * span;

  // SECONDARIES — TIER 2. Rooted up the near-vertical forearm (u 0.06→1.0), raking from WIDE
  // at the base (88°) to 52° at the wrist. Ends clearly SHORT (max 1.55) so the trailing edge
  // STEPS in from the secondary-lobe/primary tiers.
  const secondaries = foreRow({
    count: 11, u0: 0.06, u1: 1.0, rake0: 88, rake1: 52,
    len0: 0.95 * span, len1: 1.55 * span, w0: 0.56 * span, w1: 0.64 * span,
    z: zSec, cup: 0.17, curl: 0.16,
  });

  // SECONDARY LOBES — TIER 2b, 4 BROAD rounded fingers OVERHANGING the primary roots — the
  // legible MIDDLE tier, its tips ending at a radius clearly between the secondaries and the
  // primaries (the middle step). Bases overlap the primaries; sits just in front of them.
  const secLobes = fanRow({
    count: 4, origin: W.clone().add(V(-0.02, -0.08)), march: dirOf(28).multiplyScalar(0.6 * span),
    deg0: 30, deg1: 8, len0: 2.15 * span, len1: 1.75 * span, w0: 0.66 * span, w1: 0.60 * span,
    z: zLobe, cup: 0.14, curl: 0.15,
  });

  // PRIMARIES — TIER 3. 5 BROAD tapered blades fanning from the wrist (33°→7°, sweeping OUT-
  // board so the bend reads obtuse). Wide + heavily overlapping at the BASE (no fork/V there);
  // strongly LENGTH-staggered so their ROUNDED TIPS step apart into 5 distinct feather ends
  // with only narrow wedges near the tips. The topmost (t=0) longest = clean leading edge. BACK.
  const primaries = fanRow({
    count: 5, origin: W.clone().add(V(0.02, 0.03)), march: dirOf(30).multiplyScalar(0.62 * span),
    deg0: 35, deg1: 6, len0: 3.18 * span, len1: 2.34 * span, w0: 0.78 * span, w1: 0.70 * span,
    z: zPrim, cup: 0.11, curl: 0.17,
  });

  // COVERTS — TIER 1. SHORT rounded plumes shingled up the lower forearm (u 0.0→0.5), an
  // ordered band whose tips end at the SMALLEST radius (the innermost step). FRONT layer.
  const coverts = foreRow({
    count: 9, u0: 0.0, u1: 0.50, rake0: 82, rake1: 60,
    len0: 0.55 * span, len1: 0.82 * span, w0: 0.52 * span, w1: 0.56 * span,
    z: zCov, cup: 0.20, curl: 0.10,
  });

  // ARM SPAR — a thin smooth lobe along the forearm: one clean steep leading line. Sits at
  // the COVERT depth (so it merges into that band rather than floating behind as a detached
  // sliver in profile) and stops short of the wrist so it never poked past the coverts.
  const arm = featherRow({
    count: 1, at: () => S.clone().setZ(zCov - 0.02 * span), dir: () => foreDir,
    face: faceZ, lengthAt: () => foreLen * 0.90, widthAt: () => 0.40 * span,
    cup: 0.10, curl: 0.06,
  });

  const merged = mergeGeometries([arm, secondaries, secLobes, primaries, coverts]);
  if (!merged) throw new Error('buildSeraphWing: final merge returned null');
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, mat);
  pivot.add(mesh);

  return { group, pivot, mat, mesh };
}
