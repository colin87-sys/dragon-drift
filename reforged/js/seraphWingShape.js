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
function featherLobe(len, wid, cup = 0.10, curl = 0.14, taper = 0.42, wpeak = 0.16, bow = 0, rootW = 0.34) {
  // `taper` (0 → broad blunt lobe; ~0.8 → thin feather tapering to a soft point). `wpeak` is the
  // length-fraction where the blade is WIDEST — small (~0.16) = broad-near-root scallop; ~0.40 =
  // a leaf/sabre feather that swells then tapers. `bow` curves the whole blade sideways along its
  // length (a droop when the −X side points down). The tip is always a rounded arc, never a needle.
  const tipFrac = 0.80 + 0.14 * Math.min(taper, 1);
  const halfW = (s) => {                // half-width along the length param s∈[0,1]
    let w;
    if (s <= wpeak) w = rootW + (1 - rootW) * Math.pow(s / wpeak, 0.7);      // swell to full width at wpeak
    else w = 1 - taper * Math.pow((s - wpeak) / (1 - wpeak), 1.15);          // taper toward the tip
    return wid * 0.5 * Math.max(w, 0.03);
  };
  // Camber: cup up along +Y (parabolic along length) + a slight forward curl of the tip.
  const camber = (z) => {
    const t = z / len;
    return cup * len * (t - t * t) + curl * len * Math.pow(t, 1.6);
  };
  const xbow = (z) => bow * len * Math.pow(z / len, 1.9);   // sideways droop, arcing toward the tip

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
  const P = ([x, z]) => [x + xbow(z), camber(z), z];
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
function featherRow({ count, at, dir, face, lengthAt, widthAt, cup = 0.10, curl = 0.14, taperAt, wpeakAt, bowAt, rootWAt }) {
  const geos = [];
  const N = new THREE.Vector3(), T = new THREE.Vector3(), X = new THREE.Vector3();
  const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0;
    const g = featherLobe(lengthAt(t), widthAt(t), cup, curl, taperAt ? taperAt(t) : 0.42,
      wpeakAt ? wpeakAt(t) : 0.16, bowAt ? bowAt(t) : 0, rootWAt ? rootWAt(t) : 0.34);
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

  // ── THE ASYMMETRIC LIVING WING (plane: X = out, Y = up, Z = depth) ──────────────
  // NOT a symmetric feathered boomerang. Structure:
  //   • LEADING EDGE (top) = ONE clean smooth unbroken curve (the wing bone) — a solid
  //     membrane whose top edge is a quadratic bézier flowing THROUGH the bend (a curve,
  //     not a hard elbow). NO scallops on top.
  //   • Feather SCALLOPS live ONLY on the trailing (bottom) edge.
  //   • TAPER: a broad covert/secondary mass at the shoulder narrowing toward the wrist.
  //   • PRIMARIES are the star: thin LONG distinct feathers at the outer third, rooted at
  //     the wrist, FANNING like splayed fingers across ~42°, in GRADUATED UNEQUAL lengths
  //     (peak at the 2nd–3rd, stepping shorter toward each end), each drooping, with a small
  //     deterministic ± jitter on length/angle so no two match — a staggered fan, not teeth.
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z).multiplyScalar(span);
  const D2R = Math.PI / 180;
  const rotXY = (v, deg) => {   // rotate an in-plane vector by `deg` (CCW), keep z
    const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
    return new THREE.Vector3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  };
  const degOf = (v) => Math.atan2(v.y, v.x) / D2R;

  // SPINE — the smooth leading-edge curve (quadratic bézier). It rises steeply off the
  // shoulder and CURVES through the bend to the wrist (one continuous curve → the obtuse
  // bend without a hard elbow). Everything hangs off the TRAILING side of this curve.
  const S = V(0.00, 0.00);      // shoulder / base (pivot origin)
  const Cc = V(0.30, 1.30);     // bézier control — a SHORT steep rise, smooth bend
  const Wp = V(1.32, 2.02);     // WRIST — kept CLOSE so the arm is short (~⅓) and the long
                                // primaries dominate (~⅔), matching the reference proportion
  const spineP = (t) => {
    const u = 1 - t;
    return new THREE.Vector3(u * u * S.x + 2 * u * t * Cc.x + t * t * Wp.x,
      u * u * S.y + 2 * u * t * Cc.y + t * t * Wp.y, 0);
  };
  const spineTan = (t) => new THREE.Vector3(
    2 * (1 - t) * (Cc.x - S.x) + 2 * t * (Wp.x - Cc.x),
    2 * (1 - t) * (Cc.y - S.y) + 2 * t * (Wp.y - Cc.y), 0).normalize();
  // trailing normal (tangent rotated −90°) — points off the bottom/back of the curve.
  const trailN = (t) => { const g = spineTan(t); return new THREE.Vector3(g.y, -g.x, 0).normalize(); };

  const group = new THREE.Group();
  const pivot = new THREE.Group();      // the shoulder pivot — everything hangs off this
  group.add(pivot);

  const faceZ = () => new THREE.Vector3(0.0, 0.30, 1).normalize();

  // Depth layers (back → front): membrane, primaries, secondaries, coverts. Kept SHALLOW so
  // the wing reads as a PLANE (a thin scalloped sheet), not a fat tube/corn-cob — the leading
  // edge then stays one clean curve and scallops stay on the trailing edge from every angle.
  const zMem = -0.04 * span, zPrim = 0.03 * span, zSec = 0.11 * span, zCov = 0.20 * span;

  // MEMBRANE — the solid body under the clean leading edge. Top edge = spine (smooth); bottom
  // edge = spine + trailN·bodyDepth, BROAD at the shoulder tapering toward the wrist. Built as
  // a non-indexed triangle strip so it merges with the feather rows. Its clean top IS the
  // leading edge; the feathers below carry all the scallops.
  // Broad at the shoulder, tapering to thin at the wrist — but RAMPED UP from a small value at
  // t=0 so the shoulder rounds off (leading + trailing edges nearly meet) instead of a blunt cut.
  // A compact shoulder wedge that THINS FAST to almost nothing at the wrist, so the arm is a
  // minor triangular base and the long primaries carry the wing (not a uniform thick tube).
  const maxD = 0.95 * span;
  const bodyDepth = (t) => maxD * (t < 0.14 ? (0.10 + 0.90 * t / 0.14) : (1 - 0.97 * (t - 0.14) / 0.86));
  const membrane = (() => {
    const N = 16, v = [];
    const top = (i) => spineP(i / (N - 1)).setZ(zMem);
    const bot = (i) => { const t = i / (N - 1); return spineP(t).addScaledVector(trailN(t), bodyDepth(t)).setZ(zMem); };
    for (let i = 0; i < N - 1; i++) {
      const a = top(i), b = bot(i), c = top(i + 1), d = bot(i + 1);
      v.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      v.push(c.x, c.y, c.z, b.x, b.y, b.z, d.x, d.y, d.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  })();

  // TRAILING row: lobes rooted along the spine (t0→t1) at a fraction `rootF` of the local body
  // depth, hanging off the trailing side (trailN rotated `rake`° toward the tangent → a gentle
  // backward sweep), length grading len0→len1. These make the scalloped BOTTOM edge only.
  const trailRow = ({ count, t0, t1, rootF, rake0, rake1, len0, len1, w0, w1, z, cup, curl, face }) => featherRow({
    count,
    at: (t) => { const u = t0 + (t1 - t0) * t; return spineP(u).addScaledVector(trailN(u), rootF * bodyDepth(u)).setZ(z); },
    dir: (t) => { const u = t0 + (t1 - t0) * t; return rotXY(trailN(u), rake0 + (rake1 - rake0) * t); },
    face: face || faceZ,
    lengthAt: (t) => len0 + (len1 - len0) * t,
    widthAt: (t) => w0 + (w1 - w0) * t,
    cup, curl,
  });

  // SECONDARIES — the broad shoulder mass tapering to the wrist. Rooted mid-depth so their
  // tips form the main scalloped bottom edge; BROAD near the shoulder, shortening toward the
  // wrist (the taper). Rake sweeps a touch backward toward the tip.
  // SECONDARIES — the short shoulder mass. Longer near the wrist so they blend up into the
  // primaries (a continuous broad→thin envelope, no abrupt handle→tuft step).
  // Concentrated at the SHOULDER and thinning fast toward the wrist so the arm base is small.
  const secondaries = trailRow({
    count: 11, t0: 0.05, t1: 0.92, rootF: 0.34, rake0: 22, rake1: 54,
    len0: 1.05 * span, len1: 0.42 * span, w0: 0.52 * span, w1: 0.40 * span,
    z: zSec, cup: 0.13, curl: 0.13,
  });

  // COVERTS — shorter plumes shingled over the secondary roots on the shoulder half (the
  // packed broad covert mass). Front layer; tips add the upper-trailing scallop texture (never
  // above the spine → the top stays clean).
  const coverts = trailRow({
    count: 8, t0: 0.06, t1: 0.50, rootF: 0.22, rake0: 14, rake1: 32,
    len0: 0.60 * span, len1: 0.60 * span, w0: 0.48 * span, w1: 0.40 * span,
    z: zCov, cup: 0.15, curl: 0.11,
  });

  // PRIMARIES — THE STAR. `NP` thin LONG feathers rooted at the wrist, fanning like splayed
  // fingers. The TOP one continues the leading-edge tangent (so the smooth top flows into it);
  // the fan sweeps DOWN across ~42°. Lengths are GRADUATED + UNEQUAL with the peak at the 2nd–
  // 3rd feather, stepping shorter toward each end, plus a small deterministic ± jitter on both
  // length and angle so no two match. Each droops (face tilted down → the tip curls down/forward).
  // Rooted with a tiny outward march so they overlap like a fanned deck. FRONT-ish, z-stepped.
  const NP = 5;
  const idx = (t) => Math.round(t * (NP - 1));
  const jA = [1.3, -2.0, 1.6, -2.4, 1.1, -1.4, 0.6];         // per-feather angle jitter → no parallel twins
  // The primaries DOMINATE (long slim leaves). Top feather nearly the longest (like the reference),
  // a subtle peak at #2, then a real falloff toward the trailing end — graduated, not equal teeth.
  // PEAK clearly at #2 (index 1), top feather a touch shorter, then a real falloff.
  const pLen = [0.90, 1.00, 0.88, 0.74, 0.60, 0.50];
  const pWid = [0.94, 1.04, 0.88, 1.00, 0.82, 0.88];         // vary widths → no two identical
  const topDeg = degOf(spineTan(1));                         // leading-edge direction at the wrist
  // A TIGHT layered fan (~19°) sweeping up-and-out — a stacked deck of LONG feathers overlapping
  // like cards, the top one continuing the arm's leading-edge curve; roots cluster at the wrist.
  const fanTop = topDeg + 2, fanBot = topDeg - 17;
  const pMax = 5.15 * span;                                  // LONG → the primaries are the star (~⅔)
  // Roots CLUSTER tightly and sink INTO the wrist so the lower primaries layer out of the covert
  // mass instead of poking from behind as separate sticks.
  const pRoot0 = Wp.clone().addScaledVector(spineTan(1), -0.30 * span).addScaledVector(trailN(1), 0.12 * span);
  const primaries = featherRow({
    count: NP,
    at: (t) => { const i = idx(t); return pRoot0.clone().addScaledVector(spineTan(1), 0.035 * span * i).setZ(zPrim - 0.02 * span * i); },
    dir: (t) => { const i = idx(t), f = NP > 1 ? i / (NP - 1) : 0; return dirOfDeg(fanTop + (fanBot - fanTop) * f + jA[i]); },
    face: () => new THREE.Vector3(0.0, 0.05, 1).normalize(),
    lengthAt: (t) => pMax * pLen[idx(t)],
    widthAt: (t) => 0.54 * span * pWid[idx(t)],   // slim leaf-blades (wider because they're long)
    taperAt: (t) => 0.70 + 0.12 * (NP > 1 ? idx(t) / (NP - 1) : 0),  // taper → fine soft points
    wpeakAt: () => 0.44,                            // WIDEST ~44% out → swell-then-taper leaf
    rootWAt: () => 0.18,                            // narrow at the quill → the swell reads
    bowAt: (t) => -(0.34 + 0.22 * (NP > 1 ? idx(t) / (NP - 1) : 0)),  // strong downward ARC on EVERY blade
    cup: 0.05, curl: 0.14,
  });
  function dirOfDeg(deg) { return new THREE.Vector3(Math.cos(deg * D2R), Math.sin(deg * D2R), 0); }

  const merged = mergeGeometries([membrane, secondaries, coverts, primaries]);
  if (!merged) throw new Error('buildSeraphWing: final merge returned null');
  merged.computeVertexNormals();
  const mesh = new THREE.Mesh(merged, mat);
  pivot.add(mesh);

  return { group, pivot, mat, mesh };
}
