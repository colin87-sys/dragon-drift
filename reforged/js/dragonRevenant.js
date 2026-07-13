import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// GRAVELIGHT REVENANT — "Nothing stays buried" (WRAITH-GRAVELIGHT-BUILDSHEET.md §B).
// The roster's ONLY holes-in-the-black-fill dragon: a chalk-ivory bone-lattice
// ASSEMBLY (NOT the smooth-hull organism family — that import is forbidden per §4.1).
// Ghost-fire (the Grave Heart) is seen only THROUGH bone apertures — "a lantern, not
// a lamp". Body value RISES up the ladder (BLEACHING — the mirror of Vesper's
// darkening). Zero warm hues / zero gold (the Pearl firewall).
//
// Four self-registering, default-off builders (names LOCKED per §4.3):
//   ossuaryTorso · phalanxShroudWings · revenantSkullHead · vertebraeWhipTail
// They reuse the dragonVesper.js PATTERNS (knapLoft value-bands, the −anchor tail
// chain, the outer lmirror wing wrapper, the mats factory) with FRESH geometry.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.15.
//
// BUILD STATE: I0 = STUB. All four builders are minimal chalk-ivory PLACEHOLDERS
// that satisfy the flap/attach contract (so tricount / dragonstudio / the roster
// stay green and byte-identical) — NO real bone yet. The real parts land per §4.6:
//   I1 ossuaryTorso + the Grave Heart · I2 phalanxShroudWings · I3 skull + tail ·
//   I4 the Haunting (gap-leaks / socket vents / fever override) · I5 the ladder.
// Everything here is written so I1+ flesh GEOMETRY without rewiring the contract.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.15;
// Palette anchors (chalk-ivory bone; value RISES up the ladder — apex is the PALEST).
// These are the apex (f3) reference values; the per-form BLEACH ramp lands in I5.
const BONE = 0xcfc9b8, BONE_LO = 0xb0a992;   // apex bone + one value-step darker (belly/recess band)
const RECESS = 0x464b3d;                      // umber-green far-side cavity wall (the hollow-cage depth, §4.4)
const GRAVE = 0x54f04e;                        // the grave-light green (heart / eyes / gaps — I1+)

// hex-lerp — blend two colours by t (bone value banding tracks the bleach ladder).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// The BONE material factory — mirrors the vesperMats STRUCTURE (a stage-aware factory
// returning flat-shaded mats), never its look. Exterior bone emissive is ALWAYS
// 0x000000 (§4.4: the rig ticks bodyMat.emissiveIntensity; black emissive makes that
// a no-op so "no lit exterior bone" survives). The grave-light family (heart / gaps /
// vents / wisp) is NOT built here — it lands in flareMats (never spineMats) from I1.
function revenantMats(def) {
  const bone = new THREE.MeshStandardMaterial({ color: def.body ?? BONE, emissive: 0x000000, flatShading: true, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
  bone.envMapIntensity = 0.25;
  // Belly / ventral tier — a value-step darker so banks and the keel read.
  const boneLo = new THREE.MeshStandardMaterial({ color: def.belly ?? BONE_LO, emissive: 0x000000, flatShading: true, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
  boneLo.envMapIntensity = 0.25;
  // Dorsal tier — blended a hair between the two so the vertebra ridge reads from the side.
  const boneDorsal = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? BONE, def.belly ?? BONE_LO, 0.4), emissive: 0x000000, flatShading: true, roughness: 0.8, metalness: 0.02, side: THREE.DoubleSide });
  boneDorsal.envMapIntensity = 0.25;
  // Recess — the far-side inner rib/cavity wall (umber-green) so the hollow reads DEEP
  // while the windows stay TRUE holes (§4.4 hollow-cage render). Non-emissive.
  const recess = new THREE.MeshStandardMaterial({ color: RECESS, emissive: 0x000000, flatShading: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  recess.envMapIntensity = 0.15;
  return { bone, boneLo, boneDorsal, recess };
}

// ── A minimal faceted tube loft (shared placeholder body element) ────────────
// Stations [{z, rx, ry, cy}] → one flat-shaded octagon tube. This is the STUB's
// stand-in for the real ossuary lattice; I1 replaces it with the vertebra beam +
// hollow rib cage (staves + true window voids), reusing knapLoft's per-column
// matOrFn for the recess cavity. Kept deliberately simple + solid here.
const OCTA = (() => { const p = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; p.push([Math.cos(a), Math.sin(a)]); } return p; })();
function tubeLoft(stations, mat, cap = true) {
  const N = OCTA.length;
  const P = (s, k) => [OCTA[k][0] * s.rx, s.cy + OCTA[k][1] * s.ry, s.z];
  const tris = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i], b = stations[i + 1];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([P(a, k), P(b, k1), P(b, k)], [P(a, k), P(a, k1), P(b, k1)]); }
  }
  if (cap) {
    const f = stations[0], l = stations[stations.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let k = 0; k < N; k++) { const k1 = (k + 1) % N; tris.push([fc, P(f, k1), P(f, k)], [lc, P(l, k), P(l, k1)]); }
  }
  return flatTriMesh(tris, mat);
}

// ── TORSO: 'ossuaryTorso' ─────────────────────────────────────────────────────
// STUB (I1 builds it for real): a vertebra BEAM + a minimal keel, publishing the
// FULL attach contract (§4.3) so the wings/head/tail mount correctly and the rig
// flaps/rides without a crash. spinePoints carry the ≥2 inflections (skull-low
// stoop → rise over the pelvis → tail counter-lift) the §7 line-of-action assert
// wants. coreGlow is NULL for now (the Grave Heart on the real coreGlow hook lands
// in I1); dragonModel then builds the def.coreGlow sprite as a placeholder glow.
function buildOssuaryTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const shoulderW = model.shoulderWidthScale ?? 1;

  // Vertebra beam (level-ish long axis; deepest at the shoulder, waist tuck, pelvis
  // re-swell → the S-line the spinePoints echo). Thin — a bone beam, not a hull.
  const body = [
    { z: -1.70, rx: 0.16 * shoulderW, ry: 0.20, cy: 0.20 },   // chest prow (skull-low stoop begins)
    { z: -1.00, rx: 0.30 * shoulderW, ry: 0.34, cy: 0.13 },   // shoulder yoke (widest)
    { z: -0.15, rx: 0.22, ry: 0.26, cy: 0.17 },
    { z: 0.55, rx: 0.17, ry: 0.19, cy: 0.16 },                // waist tuck
    { z: 1.10, rx: 0.22, ry: 0.24, cy: 0.20 },                // pelvis re-swell (rise)
    { z: 1.70, rx: 0.11, ry: 0.12, cy: 0.15 },                // tail root (counter-lift down)
  ];
  group.add(tubeLoft(body, M.bone));
  // Head-low neck arcing down-forward to the skull base.
  const neck = [
    { z: -1.64, rx: 0.15, ry: 0.18, cy: 0.18 },
    { z: -2.05, rx: 0.11, ry: 0.13, cy: 0.11 },
    { z: -2.42, rx: 0.08, ry: 0.09, cy: 0.03 },
  ];
  group.add(tubeLoft(neck, M.bone, false));
  // A thin ventral keel line (belly tier) so the side profile isn't a bare rod.
  const keel = [];
  for (let i = 0; i < body.length - 1; i++) {
    const a = body[i], b = body[i + 1], w = 0.03;
    const ay = a.cy - a.ry, by = b.cy - b.ry;
    keel.push([[-w, ay, a.z], [w, by, b.z], [-w, by, b.z]], [[-w, ay, a.z], [w, ay, a.z], [w, by, b.z]]);
  }
  group.add(flatTriMesh(keel, M.boneLo));

  // Motif anchor (the Grave Heart's cage centre — real heart lands here in I1).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, TORSO_Y + 0.10, -0.55);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: skull-low stoop → rise over pelvis → tail counter-lift).
  const spinePoints = [
    new THREE.Vector3(0, 0.03, -2.42), new THREE.Vector3(0, 0.17, -1.2),
    new THREE.Vector3(0, 0.16, -0.1), new THREE.Vector3(0, 0.20, 1.1),
    new THREE.Vector3(0, 0.14, 1.7),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.34 * shoulderW) * side, y: TORSO_Y + 0.30 + (wro.y ?? 0), z: -0.55 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.00, z: -2.52 },
    tailAnchor: { y: 0.14, z: 1.66 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 0.4) / 2.4),
    halfWidthAt: (z) => 0.34 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.60, z: -0.30 },
    motifAnchor,
  };
  // coreGlow MUST be null (not a colour) or the flight tick null-derefs
  // coreGlow.userData.base every frame — the documented Solar crash. The real
  // Grave Heart mesh (transparent, on the parts.coreGlow hook) replaces this in I1.
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.bone }, coreGlow: null };
}
registerTorso('ossuaryTorso', buildOssuaryTorso);

// ── WINGS: 'phalanxShroudWings' (the HERO) ────────────────────────────────────
// STUB (I2 builds it for real): a bare bone ARM + a small fan of finger-BONE tents
// carrying one thin translucent shroud membrane, wired into the SAME 3-segment
// hinge (pivot/mid/tip) + outer-lmirror rig the real wing will use — so I2 swaps
// GEOMETRY without touching the flap contract. No through-windows / crescents yet.
function buildOnePhalanxWing(M, dials, wingMat) {
  const arm = new THREE.Group();
  const hand = new THREE.Group();
  const hs = dials.halfSpan, wristT = dials.wristT ?? 0.24;
  const fingers = Math.max(2, Math.round(dials.fingers));
  // Leading edge: a shallow gull arch to the carpal, then ease to the tip.
  const armY = (t) => hs * (0.05 * t + 0.22 * (t <= wristT ? Math.sin((t / wristT) * Math.PI / 2) : 1 - (t - wristT) * 0.12));
  const armZ = (t) => -0.08 + 0.40 * hs * Math.pow(t, 1.1) - 0.12 * hs * Math.sin(Math.PI * t);
  const LE = (t) => [t * hs, armY(t), armZ(t)];
  const K = LE(wristT), F0 = LE(1);
  // Arm bone (humerus+forearm) as a low tent ridge along the inboard LE.
  const ridge = (tgt, a, b, w, lift, mat) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * w, a[1], a[2] + pz * w], aR = [a[0] - px * w, a[1], a[2] - pz * w];
    const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.35, b[2]];
    tgt.add(flatTriMesh([[aL, b, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, b]], mat));
  };
  ridge(arm, LE(0), K, 0.09 * hs, 0.06 * hs, M.boneDorsal);   // humerus→carpal
  // Finger bones fan aft from the carpal (dominant + decay), each a bone tent.
  const lenFrac = [1, 0.80, 0.62, 0.46];
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const tips = [F0];
  for (let i = 1; i < fingers; i++) {
    const phi = phi0 + 1.0 * (i / (fingers - 1)), r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - 0.08 * r, K[2] + Math.sin(phi) * r]);
  }
  for (const tp of tips) ridge(hand, K, tp, 0.05 * hs, 0.06 * hs, M.boneDorsal);
  // ONE thin shroud membrane spanning arm-root → carpal → last finger tip (placeholder
  // sheet; I2 cuts the crescents + opens the inner-bay through-gaps). Transparent so the
  // rig's wingMat.opacity drive works (the Solar opaque-wall bug — transparent from day one).
  const root = LE(0), last = tips[tips.length - 1];
  hand.add(flatTriMesh([[root, K, last], [root, last, [last[0] * 0.5 + root[0] * 0.5, root[1] - 0.05 * hs, last[2] * 0.5 + root[2] * 0.5]]], wingMat));
  return { arm, hand, K, tip: F0 };
}

function buildPhalanxShroudWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const fingers = Math.max(2, Math.round(model.fingers ?? model.scallopLobes ?? 4));
  const halfSpan = (model.spanScale ?? 1) * 2.4;
  const wristT = model.wristT ?? 0.24;
  const dials = { fingers, halfSpan, wristT };

  // The rig's single-material wing contract (dragonModel/dragon.js drive ONE wingMat's
  // opacity/emissive). A single translucent hem tier; emissive black (the wing owns the
  // frame by silhouette — light is the heart THROUGH the bays, never painted on).
  const wo = def.wingOuter ?? BONE;
  const wingMat = new THREE.MeshStandardMaterial({ color: lerpHex(wo, BONE, 0.3), emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.82 });
  wingMat.envMapIntensity = 0.2;

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);   // build CANONICAL right; left is an outer lmirror wrapper
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K } = buildOnePhalanxWing(M, dials, wingMat);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);      // wrist fold axis = the carpal knuckle
    hand.position.set(-K[0], -K[1], -K[2]);  // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // Tip marker — the wingtip (longest finger tip), tracked through the wrist fold (FX emit point).
    const tipY = ((model.spanScale ?? 1) * 2.4) * (0.05 + 0.22 * (1 - (1 - wristT) * 0.12));
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, tipY, -0.08 + 0.40 * halfSpan);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + 0.3], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [], wingMat, parts: { ...pivots, wingElements } };
}
registerWings('phalanxShroudWings', buildPhalanxShroudWings);

// ── HEAD: 'revenantSkullHead' ─────────────────────────────────────────────────
// STUB (I3 builds it for real): a blunt bone skull wedge + two recessed pinpoint
// eyes. I3 adds the true draconic skull facets, the 6-tooth row, the back-swept
// antler-tines, the socket:skull ladder + the floating octahedron pinpoint that
// blazes brighter up the ladder. Uses the shared eyeMat (def.eye drives its colour).
function buildRevenantSkullHead(def, model, mats) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Blunt bone wedge pointing −Z (broad brow → short muzzle).
  const skull = [
    { z: 0.30, rx: 0.20 * hs, ry: 0.22 * hs, cy: 0.02 },   // occiput
    { z: -0.04, rx: 0.24 * hs, ry: 0.23 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.40, rx: 0.16 * hs, ry: 0.15 * hs, cy: -0.02 }, // cheek
    { z: -0.74, rx: 0.08 * hs, ry: 0.08 * hs, cy: -0.06 }, // muzzle
    { z: -0.92, rx: 0.04 * hs, ry: 0.04 * hs, cy: -0.07 }, // tip
  ];
  group.add(tubeLoft(skull, M.bone));
  const headLength = 1.24 * hs;

  // Recessed pinpoint eyes (green — def.eye). Seated back on the brow, converged
  // forward. Intensity rises with glowLevel (waif→wraith, the grind reward).
  eyeMat.emissiveIntensity = 0.7 + 1.6 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs, 0), eyeMat);
    eye.position.set(side * 0.14 * hs, 0.05 * hs, -0.12 * hs);   // recessed into the orbit
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.14 * hs, 0.10 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('revenantSkullHead', buildRevenantSkullHead);

// ── TAIL: 'vertebraeWhipTail' ─────────────────────────────────────────────────
// STUB (I3 builds it for real): a 4-joint −anchor isBone chain of vertebra segments
// closing in a spade — the SAME nested-chain pattern as Vesper's splitFanTail so the
// rig's travelling-wave tailWhip has real joints to walk. I3 adds the lit tail-vertebra
// gaps + the spectral wisp tip (single-layer translucent taper, wispLen up the ladder).
function buildVertebraeWhipTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const a = anchor ?? { y: 0.14, z: 1.66 };
  const T = (model.tailLength ?? 1) * 2.6 * (model.tailStretch ?? 1);
  const nSeg = Math.round(model.tailSegments ?? 8);
  const rAt = (t) => 0.11 * Math.pow(1 - t * 0.92, 0.7) + 0.008;
  const curveY = (t) => -0.05 * T * Math.sin(Math.PI * t * 0.9);
  const stem = [];
  for (let i = 0; i <= nSeg; i++) { const t = i / nSeg; stem.push({ z: a.z + t * T, rx: rAt(t), ry: rAt(t), cy: a.y + curveY(t) }); }

  // 4-joint NESTED isBone chain (verbatim Vesper splitFan pattern): every piece is
  // position-compensated by −anchor so the assembled REST pose is byte-identical.
  const nChain = 4;
  const jIdx = (j) => Math.min(nSeg, Math.round(j * nSeg / nChain));
  const jAnchor = (j) => { const s = stem[jIdx(j)]; return { x: 0, y: s.cy, z: s.z }; };
  const joints = [];
  { let parent = group, prev = { x: 0, y: 0, z: 0 };
    for (let j = 0; j < nChain; j++) { const an = jAnchor(j); const sg = new THREE.Group(); sg.name = 'revenantTailPivot' + j; sg.position.set(an.x - prev.x, an.y - prev.y, an.z - prev.z); parent.add(sg); joints.push(sg); parent = sg; prev = an; } }
  joints[0].isBone = true;   // drive by ROTATION only (position writes tear a connected loft)
  const jointOf = (z) => { for (let j = nChain - 1; j >= 0; j--) if (z >= jAnchor(j).z - 1e-6) return j; return 0; };
  const chainAdd = (z, mesh) => { const j = jointOf(z), an = jAnchor(j); mesh.position.set(-an.x, -an.y, -an.z); joints[j].add(mesh); return mesh; };
  for (let j = 0; j < nChain; j++) { const i0 = jIdx(j), i1 = jIdx(j + 1); if (i1 > i0) chainAdd(stem[i0].z, tubeLoft(stem.slice(i0, i1 + 1), M.bone, false)); }

  // Spade nub closing the stem (the wisp tip lands here in I3).
  const tip = stem[nSeg], tx = 0, ty = tip.cy, tz = tip.z;
  chainAdd(tz, flatTriMesh([
    [[tx, ty + 0.05, tz], [tx - 0.09, ty, tz + 0.12], [tx + 0.09, ty, tz + 0.12]],
    [[tx - 0.09, ty, tz + 0.12], [tx, ty - 0.03, tz + 0.28], [tx + 0.09, ty, tz + 0.12]],
  ], M.boneLo));

  return { group, segs: joints, accentMats: [] };
}
registerTail('vertebraeWhipTail', buildVertebraeWhipTail);
