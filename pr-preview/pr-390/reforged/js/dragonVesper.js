import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// NIGHTGLASS VESPER — "Knapped from the dark" (VESPER-NIGHTGLASS-BUILDSHEET.md).
// A FRESH premium matte-black night drake authored as deliberate FLAT FACETS
// (worked night-glass) — the OPPOSITE architecture to the retired obsidian/toothless
// family (§Anti-pattern). It NEVER imports dragonOrganism.js / dragonNightFury.js /
// dragonUnifiedHull.js or any smooth-hull / skinned-extension helper. Four
// self-registering, default-off builders: knappedTorso · scallopCrescentWings ·
// vesperCatHead · splitFanTail — the Sovereign faceted-assembly STRUCTURE (mats
// factory + attach contract), never its gold-regalia look.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.15.
// Cruise-black LAW: the ONLY emissive at rest is the acid-green eyes; the ion-blue
// Starlit Seam is withheld entirely until the Night Surge (wired from I4).
//
// BUILD STATE: I1 = knappedTorso (the chine) is authored for real; the other three
// parts are dark faceted PLACEHOLDERS that satisfy the flap/attach contract and are
// fleshed out in I2 (wings) / I3 (head + tail).
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.15;
// Palette anchors (matte blue-black; L ≤ 0.10 — the unlit tone lane). The per-form
// darkening ramp lands in I5; these are the apex reference values.
const NIGHT = 0x070a11, SLATE = 0x141b28, MOONGREY = 0xc9d4e2;
const EYE_GREEN = 0x96d62a;

// hex-lerp — blend two colours by t (used to derive the dorsal facet tier from the
// per-form body/belly hexes so the value banding tracks the darkening ladder).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// The KNAPPED-GLASS material factory — copies only the sovereignMats STRUCTURE
// (a stage-aware factory returning flat-shaded mats + surge-tick userData), never
// the look. `stage` is reserved for the ignition ladder (the ion-blue seam, wired
// in I4); at I1 nothing but the body + glass-streak is present.
function vesperMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));
  // Body: MATTE blue-black, zero emissive (the apex is the darkest object in the
  // game — void-black is the identity, not a bug). DoubleSide guards the open-ended
  // neck loft tube. metalness 0 / roughness 0.8 / low envMap = the matte law.
  // FLANK tier — the darkest band (the chine panels); this IS the apex-darkest body.
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? NIGHT, emissive: 0x000000, flatShading: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
  bodyFlat.envMapIntensity = 0.2;
  // Belly / ventral tier one value-step lighter slate so banks read.
  const belly = new THREE.MeshStandardMaterial({ color: def.belly ?? SLATE, emissive: 0x000000, flatShading: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
  belly.envMapIntensity = 0.2;
  // DORSAL FACET tier — a hair lighter than the flanks (blended body→belly), top-lit
  // so the longitudinal strakes read explicitly from the side; still deep blue-black
  // (L ≤ 0.10). This is the value SEPARATION that makes the knapping read as PRESENT
  // design, not merely the absence of rings (Fable I1 gate, issue 1).
  const dorsalFacet = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? NIGHT, def.belly ?? SLATE, 0.42), emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0.02, side: THREE.DoubleSide });
  dorsalFacet.envMapIntensity = 0.2;
  // Dorsal GLASS-STREAK: a THIN spine ridge-line (not a panel) — non-emissive, it
  // catches an intermittent moon-grey glint at grazing angles ("glints, never glows").
  // Dimmed vs the first pass so it never becomes the brightest surface on a dark sky
  // (Fable I1 gate, issue 2): rougher (0.6) + lower envIntensity (0.15).
  const glassStreak = new THREE.MeshStandardMaterial({ color: SLATE, emissive: 0x000000, flatShading: true, roughness: 0.6, metalness: 0.03 });
  glassStreak.envMapIntensity = 0.15;
  // Diffuse (NON-emissive) moon-grey speckle for the wing constellations (I2).
  const speckle = new THREE.MeshStandardMaterial({ color: MOONGREY, emissive: 0x000000, flatShading: true, roughness: 0.55, metalness: 0.05 });
  speckle.envMapIntensity = 0.22;
  return { bodyFlat, belly, dorsalFacet, glassStreak, speckle, stage: st };
}

// ── The chined heptagon cross-section (unit points, CCW viewed +x-right/+y-up) ──
// The LATERAL apexes (k0 / k4) are pushed fully outboard → a hard CHINE knife-line
// running nose-to-tail; the dorsal ridge (k2) carries the glass-streak + (later)
// the seam. Because the SAME 7 profile indices connect station-to-station, every
// column of facets forms a LONGITUDINAL strip — the light-grain runs along z, so
// the flat-shaded facets read as designed knapping, never as lateral rings.
const CHINE_PROFILE = [
  [1.00, 0.05],   // k0 RIGHT chine apex (widest — the knife-line)
  [0.60, 0.72],   // k1 upper-right shoulder
  [0.00, 1.00],   // k2 dorsal ridge (top centre)
  [-0.60, 0.72],  // k3 upper-left shoulder
  [-1.00, 0.05],  // k4 LEFT chine apex
  [-0.52, -0.86], // k5 lower-left belly
  [0.52, -0.86],  // k6 lower-right belly
];

// Faceted loft over a fixed polygon PROFILE: stations [{z, rx, ry, cy, cx?}] →
// one flat-shaded chined tube. Unlike an elliptical loft (which samples a smooth
// ring per z and reads as stacked beads), the shared profile indices weld the
// facets into longitudinal chines. Winds OUTWARD to match end-caps (no hollow read).
// `matOrFn` may be a single material OR a colMat(k) function returning the material
// for the longitudinal column between profile[k] and profile[k+1] — that per-column
// path is how the torso paints dorsal/flank/belly VALUE BANDS (the strakes read
// from the side); tris are grouped per material → one draw call per band.
function knapLoft(stations, profile, matOrFn, cap = true) {
  const N = profile.length;
  const P = (s, k) => [(s.cx ?? 0) + profile[k][0] * s.rx, s.cy + profile[k][1] * s.ry, s.z];
  const colMat = typeof matOrFn === 'function' ? matOrFn : () => matOrFn;
  const byMat = new Map();
  const push = (mat, ...tris) => { let a = byMat.get(mat); if (!a) byMat.set(mat, a = []); for (const t of tris) a.push(t); };
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      const A0 = P(a, k), A1 = P(a, k1), B0 = P(b, k), B1 = P(b, k1);
      push(colMat(k), [A0, B1, B0], [A0, A1, B1]);
    }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [(f.cx ?? 0), f.cy, f.z], lc = [(l.cx ?? 0), l.cy, l.z];
    for (let k = 0; k < N; k++) {
      const k1 = (k + 1) % N;
      push(colMat(k), [fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]);
    }
  }
  const g = new THREE.Group();
  for (const [mat, tris] of byMat) g.add(flatTriMesh(tris, mat));
  return g;
}

// ── TORSO: 'knappedTorso' ─────────────────────────────────────────────────────
// A CHINED stealth-hull: a level, leaning panther body — deep chest at the
// shoulder, waist tuck, haunch re-swell — with the hard lateral chine running its
// whole length. The ring-failure is dead BY CONSTRUCTION: the dominant edges are
// longitudinal, not lateral. A head-low neck arcs slightly down-forward.
function buildKnappedTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const chine = model.chine ?? 1;            // 0 = neutral heptagon, 1 = full outboard chine
  const shoulderW = model.shoulderWidthScale ?? 1;

  // Blend the chine apexes outboard by `chine` (default-off → 0 leaves a rounded
  // heptagon; the vesper def sets 1). Keeps the module honest as a nullable dial.
  const profile = CHINE_PROFILE.map(([ux, uy], i) =>
    (i === 0 || i === 4) ? [ux * (0.72 + 0.28 * chine), uy] : [ux, uy]);

  // Body stations (level long axis; widest at the shoulder yoke where the chine is
  // most pronounced; leanest at the waist tuck).
  const body = [
    { z: -1.75, rx: 0.24 * shoulderW, ry: 0.32, cy: 0.17 },  // chest prow
    { z: -1.05, rx: 0.54 * shoulderW, ry: 0.56, cy: 0.13 },  // deep shoulder/chest (widest)
    { z: -0.15, rx: 0.44, ry: 0.44, cy: 0.18 },
    { z: 0.55, rx: 0.32, ry: 0.33, cy: 0.18 },               // WAIST tuck (leanest)
    { z: 1.15, rx: 0.38, ry: 0.35, cy: 0.15 },               // HAUNCH re-swell
    { z: 1.75, rx: 0.20, ry: 0.20, cy: 0.13 },
    { z: 2.10, rx: 0.11, ry: 0.11, cy: 0.12 },               // tail root
  ];
  // Longitudinal VALUE BANDS (colMat by column): dorsal-ridge columns (k1,k2) get
  // the lighter dorsalFacet tier; belly columns (k4,k5,k6) the slate belly tier; the
  // upper-flank chine panels (k0,k3) stay the darkest flank body. From the side this
  // paints continuous nose-to-tail strakes — designed knapping the eye can read, and
  // it makes the longitudinal grain dominate any faint transverse station edge.
  const bandMat = (k) => (k === 1 || k === 2) ? M.dorsalFacet : (k >= 4) ? M.belly : M.bodyFlat;
  group.add(knapLoft(body, profile, bandMat));

  // Head-low neck: arcs slightly DOWN-forward to the head (not a proud up-neck).
  const neck = [
    { z: -1.68, rx: 0.32, ry: 0.38, cy: 0.15 },
    { z: -2.08, rx: 0.25, ry: 0.29, cy: 0.10 },
    { z: -2.45, rx: 0.19, ry: 0.22, cy: 0.04 },
    { z: -2.78, rx: 0.14, ry: 0.16, cy: -0.02 },
  ];
  group.add(knapLoft(neck, profile, bandMat, false));

  // Dorsal GLASS-STREAK — a THIN ridge-line riding the dorsal ridge (k2 line) the
  // FULL length of the hull (nose→tail root), lifted just proud. Non-emissive; the
  // cruise glint is the whole cruise-read ("glints, never glows"). Gated by the dial.
  if ((model.glassStreak ?? 0) > 0) {
    const rail = body.map(s => [0, s.cy + s.ry + 0.018, s.z]);
    const hw = 0.03;
    const strip = [];
    for (let i = 0; i < rail.length - 1; i++) {
      const A = rail[i], B = rail[i + 1];
      const AL = [A[0] - hw, A[1], A[2]], AR = [A[0] + hw, A[1], A[2]];
      const BL = [B[0] - hw, B[1], B[2]], BR = [B[0] + hw, B[1], B[2]];
      strip.push([AL, BR, BL], [AL, AR, BR]);
    }
    group.add(flatTriMesh(strip, M.glassStreak));
  }

  // Nape motif-anchor (the Starlit Seam seats here; wired in I4). Publishing it now
  // is a documented crash-guard (parts read attach.motifAnchor).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y + 0.34, -1.68);
  group.add(motifAnchor);

  // Line-of-action: a LOW, unbroken profile — head low → level body → gentle tail.
  const spinePoints = [
    new THREE.Vector3(0, 0.02, -2.78), new THREE.Vector3(0, 0.13, -1.6),
    new THREE.Vector3(0, 0.17, -0.4), new THREE.Vector3(0, 0.17, 0.7),
    new THREE.Vector3(0, 0.13, 1.9), new THREE.Vector3(0, 0.14, 2.5),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.50 * shoulderW) * side, y: TORSO_Y + 0.34 + (wro.y ?? 0), z: -0.50 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.02, z: -2.88 },
    tailAnchor: { y: 0.13, z: 2.08 },
    keelTopAt: (z) => TORSO_Y + 0.44 * Math.max(0, 1 - Math.abs(z + 0.4) / 2.6),
    halfWidthAt: (z) => 0.58 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.62, z: -0.25 },
    motifAnchor,
  };
  // coreGlow MUST be null (not a colour number) or the flight tick null-derefs
  // coreGlow.userData.base every frame — the documented Solar crash.
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.bodyFlat }, coreGlow: null };
}
registerTorso('knappedTorso', buildKnappedTorso);

// ── WINGS: 'scallopCrescentWings' (I1 PLACEHOLDER) ────────────────────────────
// A dark, semi-transparent faceted sail per side — modest span so the I1 chase
// shot judges the TORSO chine, not the wings. Publishes the full flap-rig contract
// (pivot→mid→tip + tip marker). Replaced by the real 4-lobe scallop crescent +
// scapular-cowl join + translucent knife-edge in I2. transparent:true from day one
// (the Solar opaque-wall visibility bug — the game drives wingMat.opacity).
function buildOnePlaceholderWing(M, halfSpan) {
  const wg = new THREE.Group();
  const rootChord = 1.4, tipChord = 0.4;
  const L = (t) => [t * halfSpan, t * halfSpan * 0.12, -0.05 + t * halfSpan * 0.28];
  const cAt = (t) => rootChord * (1 - t) + tipChord * t;
  const stations = 4;
  const st = [];
  for (let f = 0; f <= stations; f++) { const t = f / stations, l = L(t), c = cAt(t); st.push({ l, tip: [l[0], l[1] - 0.05 * c, l[2] + c] }); }
  const tris = [];
  for (let f = 0; f < stations; f++) {
    const A = st[f], B = st[f + 1];
    tris.push([A.l, B.l, B.tip], [A.l, B.tip, A.tip]);
  }
  wg.add(flatTriMesh(tris, M.wingMat));
  return wg;
}
function buildScallopCrescentWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const halfSpan = (model.spanScale ?? 1) * 2.6;
  // Translucent night-glass membrane — transparent from day one so the game's
  // wing-fade (dragon.js drives wingMat.opacity) actually works.
  M.wingMat = new THREE.MeshStandardMaterial({ color: def.wingOuter ?? NIGHT, emissive: 0x000000, flatShading: true, roughness: 0.78, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.82 });
  M.wingMat.envMapIntensity = 0.2;

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    mid.add(buildOnePlaceholderWing(M, halfSpan));
    if (side === -1) pivot.scale.x = -1;   // left = mirror → the animator's mirrored poses read symmetric
    group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, halfSpan * 0.12, -0.05 + halfSpan * 0.28);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + halfSpan * 0.12, root.z + halfSpan * 0.28], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [], wingMat: M.wingMat, parts: { ...pivots, wingElements } };
}
registerWings('scallopCrescentWings', buildScallopCrescentWings);

// ── HEAD: 'vesperCatHead' (I1 PLACEHOLDER) ────────────────────────────────────
// A blunt dark faceted cat-wedge + the acid-green cat eyes (the ONE always-on
// accent — the single deliberate carry-over from the retired identity). The full
// ear-fin nubs + almond eye ladder land in I3.
function buildVesperCatHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Blunt cat-wedge: short muzzle, broad brow, pointing −Z.
  const skull = [
    { z: 0.34, rx: 0.26 * hs, ry: 0.28 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.32 * hs, ry: 0.30 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.40, rx: 0.24 * hs, ry: 0.22 * hs, cy: -0.02 }, // cheek
    { z: -0.74, rx: 0.13 * hs, ry: 0.13 * hs, cy: -0.06 }, // short muzzle
    { z: -0.94, rx: 0.06 * hs, ry: 0.06 * hs, cy: -0.08 }, // muzzle tip
  ];
  group.add(knapLoft(skull, CHINE_PROFILE, M.bodyFlat));
  const headLength = 1.3 * hs;

  // Big acid-green cat eyes — the largest eye on the roster (ladder lands in I3).
  const es = model.eyeScale ?? 1;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.12 * hs * es, 0), eyeMat);
    eye.position.set(side * 0.22 * hs, 0.06 * hs, -0.26 * hs);
    eye.scale.set(1.5, 0.85, 1);
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.18 * hs, 0.30 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('vesperCatHead', buildVesperCatHead);

// ── TAIL: 'splitFanTail' (I1 PLACEHOLDER) ─────────────────────────────────────
// A long thin CHINED stem tapering to a nub. The twin split fan-fins + port-fin
// white-constellation nod (NO red prosthetic) land in I3.
function buildSplitFanTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const a = anchor ?? { y: 0.13, z: 2.08 };
  const T = (model.tailLength ?? 1) * 2.8;
  const nSeg = 7;
  const rAt = (t) => 0.13 * Math.pow(1 - t * 0.94, 0.7) + 0.01;
  const curveY = (t) => -0.06 * T * Math.sin(Math.PI * t * 0.9);
  const stem = [];
  for (let i = 0; i <= nSeg; i++) { const t = i / nSeg; stem.push({ z: a.z + t * T, rx: rAt(t), ry: rAt(t), cy: a.y + curveY(t) }); }
  group.add(knapLoft(stem, CHINE_PROFILE, M.bodyFlat, false));
  return { group, segs: [], accentMats: [] };
}
registerTail('splitFanTail', buildSplitFanTail);
