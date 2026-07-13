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
// Palette anchors — BRIGHT COOL CHALK-IVORY bone (Fable gate: bone was reading dim/khaki;
// bleached bone must be the dominant bright mass). Value RISES up the ladder (apex palest).
const BONE = 0xe6e7e0, BONE_LO = 0xc7cac3;   // bright COOL ivory (no khaki drift) + one value-step darker
const RECESS = 0x3d4a3a;                      // umber-green far-side cavity wall (the hollow-cage depth, §4.4)
const GRAVE = 0x6bff5e;                        // the grave-light green (heart / eyes / gaps) — brighter for bloom

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
  // Bone reads BRIGHT bleached ivory: high albedo, low roughness sheen, a faint self-lit
  // floor so it never sinks to grey in shadow (exterior emissive stays a hair above black —
  // the rig's emissiveIntensity tick is a near-no-op, so "no lit exterior bone" still holds).
  const bone = new THREE.MeshStandardMaterial({ color: def.body ?? BONE, emissive: 0x000000, flatShading: true, roughness: 0.72, metalness: 0, side: THREE.DoubleSide });
  bone.envMapIntensity = 0.55;
  // Belly / ventral tier — a value-step darker so banks and the keel read.
  const boneLo = new THREE.MeshStandardMaterial({ color: def.belly ?? BONE_LO, emissive: 0x000000, flatShading: true, roughness: 0.74, metalness: 0, side: THREE.DoubleSide });
  boneLo.envMapIntensity = 0.5;
  // Dorsal tier — blended a hair between the two so the vertebra ridge reads from the side.
  const boneDorsal = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? BONE, def.belly ?? BONE_LO, 0.35), emissive: 0x000000, flatShading: true, roughness: 0.66, metalness: 0.02, side: THREE.DoubleSide });
  boneDorsal.envMapIntensity = 0.55;
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

// The dorsal spine line cyAt(z) — piecewise-linear over the body control points
// (skull-low stoop → rise over the pelvis → tail counter-lift, the ≥2 inflections).
// The dorsal spine line. The neck RISES in an S-curve to a raised skull (the reference
// soaring pose), dips at the shoulder, swells over the pelvis, counter-lifts at the tail.
const SPINE = [[-2.62, 0.40], [-2.20, 0.30], [-1.72, 0.16], [-1.10, 0.11], [-0.15, 0.17], [0.55, 0.16], [1.10, 0.22], [1.70, 0.15]];
function cyAt(z) {
  if (z <= SPINE[0][0]) return SPINE[0][1];
  if (z >= SPINE[SPINE.length - 1][0]) return SPINE[SPINE.length - 1][1];
  for (let i = 0; i < SPINE.length - 1; i++) { const [az, ay] = SPINE[i], [bz, by] = SPINE[i + 1]; if (z >= az && z <= bz) return ay + (by - ay) * (z - az) / (bz - az); }
  return 0.15;
}

// vertebraUnit — the SHARED repeating skeletal element (§4.3): a hexagonal centrum
// mini-loft + a neural-spine TENT + 2 transverse-process nubs, ~18 tris. It APPENDS
// into per-tier accumulators (boneT / dorsalT) so the whole beam collapses to ≤3
// meshes, never one draw per vertebra (the Pearl 253-draw lesson).
const VHEX = [[1, 0.28], [0.5, 1], [-0.5, 1], [-1, 0.28], [-0.5, -1], [0.5, -1]];
function vertebraUnit(z, cy, s, boneT, dorsalT) {
  const hw = 0.10 * s, hh = 0.085 * s, hl = 0.085 * s;
  const ring = (zz) => VHEX.map(([ux, uy]) => [ux * hw, cy + uy * hh, zz]);
  const r0 = ring(z - hl), r1 = ring(z + hl);
  for (let k = 0; k < 6; k++) { const k1 = (k + 1) % 6; boneT.push([r0[k], r1[k1], r1[k]], [r0[k], r0[k1], r1[k1]]); }   // centrum: 12
  const ny = cy + hh;                                                         // neural-spine TENT (dorsal, raked slightly aft): 4
  const bL = [-0.05 * s, ny, z - 0.02 * s], bR = [0.05 * s, ny, z - 0.02 * s], bB = [0, ny, z + 0.06 * s], ap = [0, ny + 0.17 * s, z + 0.04 * s];
  dorsalT.push([bL, bR, ap], [bR, bB, ap], [bB, bL, ap], [bL, bB, bR]);
  for (const sd of [1, -1]) {                                                 // transverse nubs: 2
    boneT.push([[sd * hw, cy, z - 0.03 * s], [sd * (hw + 0.07 * s), cy + 0.01 * s, z], [sd * hw, cy, z + 0.03 * s]]);
  }
}

// ── TORSO: 'ossuaryTorso' (I1 — REAL) ─────────────────────────────────────────
// A chalk-ivory BONE LATTICE: a vertebra beam (neck + dorsal files of vertebraUnit)
// + a HOLLOW RIB CAGE — arc staves bridging the dorsal beam to a ventral keel, with
// TRUE through-window voids between them (geometry ABSENCE, so the SKELETON reads as
// holes-in-the-black-fill from the side). The far-side ribs are painted the umber-
// green recess so the cavity reads DEEP while the holes stay true holes (§4.4). f0
// seals every window with an INSET cartilage panel (never coplanar). Caged at the
// centre: THE GRAVE HEART on the real transparent coreGlow hook — seen only THROUGH
// the windows ("a lantern, not a lamp"). Exterior bone emissive is 0x000000 so the
// rig's bodyMat emissive tick is a no-op (no lit exterior bone). The attach contract
// is byte-identical to the I0 stub, so the wings/head/tail mount unchanged (wingsym Δ0).
function buildOssuaryTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const shoulderW = model.shoulderWidthScale ?? 1;
  const boneT = [], dorsalT = [], recessT = [], keelT = [];   // per-tier accumulators → ≤4 meshes total

  // ── VERTEBRA BEAM — neck file + dorsal file of shared vertebra units.
  const neckVerts = Math.round(model.neckVerts ?? 5);
  const dorsalVerts = Math.round(model.dorsalVerts ?? 9);
  const placeUnits = (z0, z1, n, s0, s1) => { for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1), z = z0 + (z1 - z0) * t; vertebraUnit(z, cyAt(z), s0 + (s1 - s0) * t, boneT, dorsalT); } };
  placeUnits(-2.62, -1.16, neckVerts, 0.70, 1.0);   // LONG S-curved neck of shrinking vertebrae rising to the skull
  placeUnits(-1.06, 1.58, dorsalVerts, 1.0, 0.74);  // dorsal → tail root (taper aft)

  // ── HOLLOW RIB CAGE — NRIB arc staves bridging the dorsal beam to a ventral keel
  // across the chest; the z-gaps between staves are the through-WINDOWS. `ribWindows`
  // (0..6) opens gaps CENTRE-OUT (the heart shows through the middle first); the rest
  // are sealed with an inset cartilage panel (f0 → all sealed).
  const zF = -1.22, zB = 0.88, NGAP = 8, NRIB = NGAP + 1;
  const ribWindows = Math.max(0, Math.min(NGAP, Math.round((model.ribWindows ?? NGAP) * NGAP / 6)));
  const bell = (z) => Math.max(0, 1 - Math.pow((z + 0.20) / 1.18, 2));
  const cageDepth = (z) => 0.34 + 0.52 * bell(z);   // DEEP flared barrel — the ribcage IS the torso mass centre
  const halfW = (z) => 0.24 + 0.60 * bell(z);       // WIDE flare — ribs sweep far outboard (barrel blossom)
  const topY = (z) => cyAt(z) + 0.05;
  const botY = (z) => cyAt(z) - cageDepth(z);
  const bez = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
  const bez3 = (a, c1, c2, b, t) => { const m = 1 - t; return [0, 1, 2].map((j) => m * m * m * a[j] + 3 * m * m * t * c1[j] + 3 * m * t * t * c2[j] + t * t * t * b[j]); };
  const ribZ = (i) => zF + (zB - zF) * i / (NRIB - 1);
  // One rib = a thin ribbon following a ROUNDED cubic arc: dorsal → far outboard (belly of
  // the barrel) → keel. Two control points round the sweep so the cage reads as a barrel
  // basket, not a shallow half-pipe.
  const buildRib = (z, side, mat, tgt) => {
    const hw = halfW(z), dep = cageDepth(z), cy = cyAt(z);
    const P0 = [0, topY(z), z];
    const C1 = [side * hw * 1.05, cy + 0.02, z + 0.03];                 // spring out wide near the top (shoulder of the barrel)
    const C2 = [side * hw * 1.15, cy - dep * 0.75, z + 0.06];           // stay wide low (belly of the barrel) before tucking to the keel
    const P1 = [side * 0.05, botY(z), z + 0.02];
    const NS = 6, w = 0.030;
    let prev = null;
    for (let k = 0; k <= NS; k++) {
      const p = bez3(P0, C1, C2, P1, k / NS);
      const back = [p[0], p[1], p[2] - w], front = [p[0], p[1], p[2] + w];
      if (prev) tgt.push([prev.back, front, prev.front], [prev.back, back, front]);
      prev = { back, front };
    }
  };
  // Gap-open order: centre gaps first (indices sorted by distance from the middle gap).
  const gapOrder = Array.from({ length: NGAP }, (_, g) => g).sort((a, b) => Math.abs(a - (NGAP - 1) / 2) - Math.abs(b - (NGAP - 1) / 2));
  const openGap = new Set(gapOrder.slice(0, ribWindows));
  for (let i = 0; i < NRIB; i++) {
    const z = ribZ(i);
    buildRib(z, 1, M.bone, boneT);       // near (right) rib — bone
    buildRib(z, -1, M.recess, recessT);  // far (left) rib — umber-green so the cavity reads deep through the near windows
  }
  // SEAL the closed gaps with an inset cartilage panel — a full-cover quad spanning the
  // gap (rib→rib, rail→keel) at a small +x inset so it's NOT coplanar with the rib plane
  // (§4.3) yet fully OCCLUDES the window in projection (a sealed rung reads solid, no ring
  // of leaked background). Open gaps are pure ABSENCE → the enclosed through-window.
  for (let g = 0; g < NGAP; g++) {
    if (openGap.has(g)) continue;
    const za = ribZ(g), zb = ribZ(g + 1);
    for (const side of [1, -1]) {
      const inx = side * 0.09;
      const TL = [inx, topY(za), za], TR = [inx, topY(zb), zb], BR = [inx, botY(zb) + 0.01, zb], BL = [inx, botY(za) + 0.01, za];
      recessT.push([TL, TR, BR], [TL, BR, BL]);
    }
  }
  // ── DORSAL RAIL — a CONTINUOUS bone strip along the top of the cage that bounds every
  // window from ABOVE (the discrete vertebra centra leave gaps the flood-fill would leak
  // through, so the windows would not read as enclosed holes without this rail). Runs the
  // full cage z-span just under the neural spines.
  { let prev = null; const w = 0.045;
    for (let i = 0; i <= 20; i++) { const z = zF - 0.05 + (zB - zF + 0.1) * i / 20, y = topY(z);
      const L = [-w, y, z], R = [w, y, z], U = [0, y + 0.05, z];
      if (prev) { boneT.push([prev.L, R, L], [prev.L, prev.R, R], [prev.R, U, R], [prev.R, prev.U, U]); }
      prev = { L, R, U }; } }
  // ── VENTRAL KEEL / STERNUM — a continuous rail closing the bottom of every window
  // (so the gaps are ENCLOSED, not open to the belly). Belly tier.
  { let prev = null; const w = 0.05;
    for (let i = 0; i <= 20; i++) { const z = zF - 0.05 + (zB - zF + 0.1) * i / 20, y = botY(z) + 0.01;
      const L = [-w, y, z], R = [w, y, z], D = [0, y - 0.05, z];
      if (prev) { keelT.push([prev.L, R, L], [prev.L, prev.R, R], [prev.R, D, R], [prev.R, prev.D, D]); }
      prev = { L, R, D }; } }

  // ── PELVIS — a small bone mass at the haunch (z≈1.1) so the aft profile reads a hip.
  for (const side of [1, -1]) {
    const hx = side * 0.14, hz = 1.08, hy = cyAt(hz);
    boneT.push(
      [[hx - side * 0.06, hy + 0.10, hz - 0.16], [hx + side * 0.12, hy + 0.02, hz], [hx + side * 0.04, hy - 0.10, hz + 0.20]],
      [[hx - side * 0.06, hy + 0.10, hz - 0.16], [hx + side * 0.04, hy - 0.10, hz + 0.20], [hx - side * 0.04, hy - 0.02, hz + 0.14]],
    );
  }
  // ── HIND LEGS — tucked skeletal raptor legs (femur → shin → 3-talon foot) hanging
  // below the rear cage, like the reference. A bone TENT ridge per bone; talons splay.
  const legRidge = (a, b, w) => { const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L; const aL = [a[0] + nx * w, a[1], a[2] + nz * w], aR = [a[0] - nx * w, a[1], a[2] - nz * w], aU = [a[0], a[1] + w, a[2]]; boneT.push([aL, b, aU], [aU, b, aR], [aR, b, aL]); };
  for (const side of [1, -1]) {
    const hip = [side * 0.16, cyAt(1.05) - 0.10, 1.02];
    const knee = [side * 0.30, cyAt(1.05) - 0.34, 1.16];   // femur out + down
    const ankle = [side * 0.24, cyAt(1.05) - 0.60, 1.05];  // shin down, swept slightly fwd (tucked)
    legRidge(hip, knee, 0.045);
    legRidge(knee, ankle, 0.035);
    for (const tz of [-0.10, 0.0, 0.12]) {                 // 3 talons splaying off the foot
      const toe = [ankle[0] + side * 0.03, ankle[1] - 0.10, ankle[2] + tz];
      legRidge(ankle, toe, 0.02);
    }
  }
  // ── SCAPULAR COWLS — overlapping bone flakes lapping over each wing root (z≈-0.55)
  // so the wing emerges from under a shoulder blade, not bolted to a rib (overlap > weld).
  for (const side of [1, -1]) {
    const rx = 0.34 * shoulderW * side, ry = TORSO_Y + 0.30, rz = -0.55;
    const P = (dx, dy, dz) => [rx + side * dx, ry + dy, rz + dz];
    boneT.push(
      [P(-0.22, 0.14, -0.22), P(0.16, 0.10, -0.10), P(-0.02, -0.02, 0.26)],
      [P(-0.22, 0.14, -0.22), P(-0.02, -0.02, 0.26), P(-0.20, 0.02, 0.16)],
      [P(0.04, 0.10, -0.16), P(0.30, 0.00, 0.02), P(0.06, -0.06, 0.28)],
    );
  }

  group.add(flatTriMesh(boneT, M.bone));
  group.add(flatTriMesh(dorsalT, M.boneDorsal));
  group.add(flatTriMesh(recessT, M.recess));
  group.add(flatTriMesh(keelT, M.boneLo));

  // ── THE GRAVE HEART — an emissive grave-green teardrop caged at the cage centre,
  // on the REAL transparent coreGlow hook (dragon.js:1147 ticks material.opacity:
  // floor → boost-breathe → Surge blaze). REQUIRES transparent:true + userData.base.
  // FrontSide + depthWrite off keeps it ~single-layer along any ray (§4.4 overdraw);
  // sized well inside the ribs (≥0.08 clearance) so it never z-fights a stave. Seen
  // only THROUGH the windows — a lantern, not a lamp.
  const coreBlaze = model.coreBlaze ?? 1;
  const hz = -0.18, hy = cyAt(hz) - cageDepth(hz) * 0.42;
  const heartR = 0.20 + 0.11 * coreBlaze;   // BIG glow to fill the deep flared cage (lantern, not sticker)
  const heartMat = new THREE.MeshBasicMaterial({ color: GRAVE, transparent: true, opacity: 0.45 + 0.5 * coreBlaze, depthWrite: false, side: THREE.FrontSide });
  const heart = new THREE.Mesh(new THREE.OctahedronGeometry(heartR, 1), heartMat);
  heart.scale.set(1, 1.5, 0.85);            // teardrop (taller than wide)
  heart.position.set(0, hy, hz);
  heart.userData.base = 0.45 + 0.5 * coreBlaze;   // the coreGlow tick scales THIS
  heart.renderOrder = 2;
  group.add(heart);
  // A TIGHT grave-green glow shell hugging the heart so the ghost-fire reads as CONTAINED
  // green light through the rib gaps — NOT a big white additive bloom (Fable: the white halo
  // drifted "holy"). A darker teal-green core colour so additive blending stays GREEN, not
  // washing to white on the pale/gold backdrops; small radius so it never forms an opaque cloud.
  const haloMat = new THREE.MeshBasicMaterial({ color: 0x2e8a3a, transparent: true, opacity: (0.10 + 0.12 * coreBlaze), depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide });
  const halo = new THREE.Mesh(new THREE.OctahedronGeometry(heartR * 1.35, 1), haloMat);
  halo.scale.set(1, 1.4, 0.9); halo.position.set(0, hy, hz); halo.renderOrder = 1;
  group.add(halo);

  // Motif anchor = the cage centre (the Grave Heart seats here).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, hy, hz);
  group.add(motifAnchor);

  // Line-of-action (≥2 inflections: raised skull → shoulder dip → rise over pelvis → tail).
  const spinePoints = [
    new THREE.Vector3(0, 0.40, -2.62), new THREE.Vector3(0, 0.16, -1.5),
    new THREE.Vector3(0, 0.15, -0.3), new THREE.Vector3(0, 0.22, 1.1),
    new THREE.Vector3(0, 0.14, 1.7),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.34 * shoulderW) * side, y: TORSO_Y + 0.30 + (wro.y ?? 0), z: -0.55 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.34, z: -2.68 },   // raised skull on the S-curved neck
    tailAnchor: { y: 0.14, z: 1.66 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 0.4) / 2.4),
    halfWidthAt: (z) => 0.34 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.60, z: -0.30 },
    motifAnchor,
  };
  // coreGlow = THE GRAVE HEART mesh (the real Solar hook — NOT null like the I0 stub).
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.bone }, coreGlow: heart };
}
registerTorso('ossuaryTorso', buildOssuaryTorso);

// ── WINGS: 'phalanxShroudWings' (the HERO) ────────────────────────────────────
// A skeletal-dragon BAT WING to the concept-art reference (owner-directed, overrides
// the digest's open-bay read): a SHORT arm (humerus + radius, MEDIAL wrist) → LONG
// metacarpal FINGER bones fanning out → a FILLED dark shroud MEMBRANE spanning the
// whole wing. The membrane is a continuous sheet: propatagium along the humerus
// (starts at the SHOULDER, not the wrist) + chiropatagium between the fingers +
// plagiopatagium sweeping inboard-aft to the BODY (the wing connects INTO the spine,
// not floating at the wrist). Trailing edge cut into shallow tattered notches. The
// SKELETON identity is carried by the ribcage + tail; the wings are the shroud.
function buildOnePhalanxWing(M, dials, wingMat) {
  const arm = new THREE.Group();
  const hand = new THREE.Group();
  const hs = dials.halfSpan, wristT = dials.wristT ?? 0.16;   // MEDIAL wrist → SHORT arm + LONG fingers (owner note)
  const N = Math.max(2, Math.round(dials.fingers));
  const cD = dials.crescentDepth ?? 1;
  const sweep = dials.sweep ?? 0.46, dih = dials.dihedral ?? 0.10;   // LOW rake → the span reads HORIZONTAL from the rear-chase (not two vertical spikes)
  // Arch peaks at the carpal then DECAYS hard so the wingtip stays LEVEL (was spiking up into
  // a vertical delta from behind); the tip sits just above the shoulder line, not overhead.
  const armY = (t) => hs * (dih * t + 0.15 * (t <= wristT ? Math.sin((t / wristT) * Math.PI / 2) : Math.max(0.12, 1 - (t - wristT) * 0.72)));
  const armZ = (t) => hs * (0.08 + sweep * Math.pow(t, 1.06) - 0.10 * Math.sin(Math.PI * t));
  const LE = (t) => [t * hs, armY(t), armZ(t)];
  const K = LE(wristT), F0 = LE(1);
  const bez = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
  const ridge = (tgt, a, b, wB, wT, lift, capT) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
    const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
    const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.4, b[2]];
    tgt.push([aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]);
    if (capT) capT.push([aT, bT, [a[0] + px * wB * 0.3, a[1] + lift, a[2] + pz * wB * 0.3]]);
  };

  // ── ARM — a SHORT humerus + radius with an elbow bend. Medial wrist keeps the arm a
  // stub; the fingers carry the span.
  const boneT = [], capT = [];
  const E = LE(wristT * 0.5); E[1] -= 0.04 * hs; E[2] += 0.05 * hs;
  ridge(boneT, LE(0), E, 0.075 * hs, 0.05 * hs, 0.06 * hs);          // humerus
  ridge(boneT, E, K, 0.05 * hs, 0.04 * hs, 0.05 * hs, capT);         // radius → wrist (rim-catch)
  arm.add(flatTriMesh(boneT, M.bone));                               // bright ivory arm bones
  if (capT.length) arm.add(flatTriMesh(capT, M.bone));

  // ── FINGERS — LONG metacarpals fanning from the carpal K (finger 0 = wingtip, the rest
  // sweep aft + shorter). Bowed 2-segment bone tents; inner two carry a rim-catch cap.
  const lenFrac = [1, 0.84, 0.68, 0.54];
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const tips = [F0];
  for (let i = 1; i < N; i++) {
    const phi = phi0 + 1.32 * (i / (N - 1)), r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - 0.05 * r, K[2] + Math.sin(phi) * r]);
  }
  const fingerT = [], fingerCapT = [];
  for (let i = 0; i < tips.length; i++) {
    const tp = tips[i], wB = 0.045 * hs * (1 - 0.05 * i), wM = wB * 0.5;
    const L = Math.hypot(tp[0] - K[0], tp[1] - K[1], tp[2] - K[2]), sag = 0.09 * L;
    const Bm = [(K[0] + tp[0]) / 2, (K[1] + tp[1]) / 2 - sag, (K[2] + tp[2]) / 2 + sag * 0.4];
    ridge(fingerT, K, Bm, wB * 1.25, wM, 0.14 * hs, i < 4 ? fingerCapT : null);   // PROUD, THICK ivory finger bones stand well over the shroud so bone webbing reads from BEHIND
    ridge(fingerT, Bm, tp, wM, 0.008, 0.10 * hs);
  }
  hand.add(flatTriMesh(fingerT, M.bone));         // bright ivory bones (not the dorsal tier) so they read against the dark shroud
  if (fingerCapT.length) hand.add(flatTriMesh(fingerCapT, M.bone));

  // ── CHIROPATAGIUM — the FILLED shroud membrane between the fingers (a fan from K to a
  // shallow-cupped trailing arc per bay; the cups are tattered notches, not open holes).
  // Lives on the HAND so it folds as one rigid sheet at the wrist.
  const NSEG = 4, memT = [];
  for (let i = 0; i < tips.length - 1; i++) {
    const Fa = tips[i], Fb = tips[i + 1];
    const mid = [(Fa[0] + Fb[0]) / 2, (Fa[1] + Fb[1]) / 2, (Fa[2] + Fb[2]) / 2];
    const cup = 0.18 + 0.24 * cD;   // DEEPER tattered trailing notches (visible from the rear-chase, not just top-down)
    const ctrl = [mid[0] + (K[0] - mid[0]) * cup, mid[1] + (K[1] - mid[1]) * cup - 0.02, mid[2] + (K[2] - mid[2]) * cup];
    const arc = []; for (let s = 0; s <= NSEG; s++) arc.push(bez(Fa, ctrl, Fb, s / NSEG));
    const C = [(K[0] + mid[0]) / 2, (K[1] + mid[1]) / 2 - 0.03, (K[2] + mid[2]) / 2];
    memT.push([C, K, arc[0]], [C, arc[NSEG], K]);
    for (let s = 0; s < NSEG; s++) memT.push([C, arc[s], arc[s + 1]]);
  }
  hand.add(flatTriMesh(memT, wingMat));

  // ── PROPATAGIUM — the leading-edge web over the SHORT arm (shoulder→elbow→wrist), so
  // the membrane starts at the HUMERUS, not the wrist. Arm-side → folds with the arm.
  arm.add(flatTriMesh([[LE(0), E, K], [LE(0), K, [K[0] * 0.6 + LE(0)[0] * 0.4, K[1] - 0.03 * hs, K[2] + 0.10 * hs]]], wingMat));
  // ── PLAGIOPATAGIUM / ROOT GUSSET — the inboard membrane sweeps AFT + INBOARD + DOWN to
  // a BODY anchor (G, toward the hip/spine), so the wing joins the body instead of
  // floating at the wrist (owner note). Anchored to ARM-side points only (root LE, wrist
  // K, aft corner, body G) so it never tears when the hand folds at the wrist.
  const r0p = LE(0);
  const G = [r0p[0] - 0.12 * hs, r0p[1] - 0.14 * hs, r0p[2] + 0.85 * hs];   // reaches to the body/hip WITHOUT slabbing over the ivory ribcage
  const Aaft = [K[0] * 0.5 + r0p[0] * 0.5, K[1] - 0.10 * hs, K[2] + 0.40 * hs];
  arm.add(flatTriMesh([[r0p, K, Aaft], [r0p, Aaft, G]], wingMat));
  return { arm, hand, K, tip: F0 };
}

function buildPhalanxShroudWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const fingers = Math.max(2, Math.round(model.fingers ?? 4));
  const halfSpan = (model.spanScale ?? 1) * 2.6;
  const wristT = model.wristT ?? 0.16;
  const dials = { fingers, halfSpan, wristT, crescentDepth: model.crescentDepth ?? 1, sweep: model.wingSweep ?? 0.46, dihedral: model.wingDihedral ?? 0.10 };

  // The shroud MEMBRANE — a DARK desaturated slate-green tattered skin (the reference's
  // shadowy bat shroud), translucent so light reads through it and the rig can drive its
  // opacity. Emissive black (the wing never glows — the light is the caged heart). This
  // is the rig's single wingMat contract (dragon.js drives .opacity/.emissive on it).
  const wingMat = new THREE.MeshStandardMaterial({ color: def.wingMembrane ?? 0x3a4038, emissive: 0x000000, flatShading: true, roughness: 0.88, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  wingMat.envMapIntensity = 0.18;

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const rootC = attach.wingRoot(1);   // build CANONICAL right; left is an outer lmirror wrapper
    const pivot = new THREE.Group(); pivot.position.set(rootC.x, rootC.y, rootC.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K, tip: wtip } = buildOnePhalanxWing(M, dials, wingMat);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);      // wrist fold axis = the carpal knuckle
    hand.position.set(-K[0], -K[1], -K[2]);  // −anchor → assembled REST pose byte-identical
    tip.add(hand);
    if (side === -1) { const lmirror = new THREE.Group(); lmirror.scale.x = -1; lmirror.add(pivot); group.add(lmirror); }
    else group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // Tip marker — the actual wingtip (finger 0 tip, LE(1)), tracked through the wrist fold (FX emit point).
    const marker = new THREE.Object3D();
    marker.position.set(wtip[0], wtip[1], wtip[2]);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip; pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * wtip[0], root.y + wtip[1], root.z + wtip[2]], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [], wingMat, parts: { ...pivots, wingElements } };
}
registerWings('phalanxShroudWings', buildPhalanxShroudWings);

// ── HEAD: 'revenantSkullHead' ─────────────────────────────────────────────────
// A true draconic SKULL (Fable gate: the head was a featureless cone): an elongated
// cranium + a HINGED lower jaw with a mouth gap + a row of teeth + recessed eye
// SOCKETS holding a green pinpoint + a pair of back-swept horns ATTACHED at the
// occiput (not floating). Points −Z. Uses the shared eyeMat (def.eye drives colour).
function buildRevenantSkullHead(def, model, mats) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;
  const S = (v) => v * hs;

  // ── CRANIUM — an elongated draconic upper skull (occiput → long muzzle), a hair
  // boxy so it reads bone, not a smooth snake head.
  const cranium = [
    { z: S(0.42), rx: S(0.19), ry: S(0.23), cy: S(0.06) },   // occiput (tall, back)
    { z: S(0.16), rx: S(0.22), ry: S(0.21), cy: S(0.05) },   // brow (widest)
    { z: S(-0.14), rx: S(0.16), ry: S(0.15), cy: S(0.02) },  // over the eye socket
    { z: S(-0.52), rx: S(0.12), ry: S(0.11), cy: S(-0.02) }, // muzzle
    { z: S(-0.92), rx: S(0.07), ry: S(0.07), cy: S(-0.04) }, // nasal
    { z: S(-1.12), rx: S(0.035), ry: S(0.04), cy: S(-0.05) },// nose tip
  ];
  group.add(tubeLoft(cranium, M.bone));
  const headLength = 1.5 * hs;

  // ── LOWER JAW — a slimmer wedge slung BELOW the cranium with a clear mouth GAP
  // between them; slightly agape (the reference's fanged maw).
  const jaw = [
    { z: S(0.24), rx: S(0.13), ry: S(0.06), cy: S(-0.17) },
    { z: S(-0.16), rx: S(0.11), ry: S(0.055), cy: S(-0.19) },
    { z: S(-0.56), rx: S(0.08), ry: S(0.05), cy: S(-0.19) },
    { z: S(-0.95), rx: S(0.045), ry: S(0.04), cy: S(-0.17) },
  ];
  group.add(tubeLoft(jaw, M.boneLo));

  // ── TEETH — DISCRETE solid pyramid fangs (not a wireframe net): a clean row along the
  // upper jaw pointing DOWN and the lower jaw pointing UP, interlocking across the mouth gap.
  const teethT = [];
  const tooth = (x, yBase, z, dir, sz) => {
    const b0 = [x - sz * 0.5, yBase, z - sz * 0.5], b1 = [x + sz * 0.5, yBase, z - sz * 0.5], b2 = [x + sz * 0.5, yBase, z + sz * 0.5], b3 = [x - sz * 0.5, yBase, z + sz * 0.5];
    const ap = [x, yBase + dir * sz * 2.6, z];
    teethT.push([b0, b1, ap], [b1, b2, ap], [b2, b3, ap], [b3, b0, ap]);
  };
  const nT = 5;
  for (let i = 0; i < nT; i++) {
    const t = i / (nT - 1), z = S(-0.08 - 0.70 * t), w = S(0.085 - 0.05 * t), sz = S(0.036 - 0.013 * t);
    for (const side of [1, -1]) {
      tooth(side * w, S(-0.055), z, -1, sz);          // upper fang (points down)
      tooth(side * w * 0.9, S(-0.135), z, 1, sz * 0.85);   // lower fang (points up)
    }
  }
  group.add(flatTriMesh(teethT, M.bone));

  // ── EYE SOCKETS + pinpoint — a recessed dark orbit with a floating green octahedron
  // seated deep inside (the socket reads as a hole; the pinpoint blazes with glowLevel).
  const socketT = [];
  eyeMat.emissiveIntensity = 0.8 + 1.8 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const ex = side * S(0.15), ey = S(0.04), ez = S(-0.14);
    // a shallow recessed socket ring (dark recess tier) so the eye sits in a hole
    socketT.push(
      [[ex - S(0.09), ey + S(0.07), ez], [ex + S(0.09), ey + S(0.07), ez], [ex, ey - S(0.02), ez - S(0.06)]],
      [[ex - S(0.09), ey + S(0.07), ez], [ex, ey - S(0.02), ez - S(0.06)], [ex - S(0.06), ey - S(0.05), ez]],
      [[ex + S(0.09), ey + S(0.07), ez], [ex + S(0.06), ey - S(0.05), ez], [ex, ey - S(0.02), ez - S(0.06)]],
    );
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(S(0.055), 0), eyeMat);
    eye.position.set(ex, ey, ez - S(0.03));   // seated DEEP in the socket
    group.add(eye);
  }
  group.add(flatTriMesh(socketT, M.recess));

  // ── HORNS — a pair sweeping back + up + out from the occiput, ATTACHED at the base
  // (a 3-segment tapered tent so they curve). Length grows with the ladder (hornLen).
  const hornLen = model.hornLen ?? 1;
  const hornT = [];
  for (const side of [1, -1]) {
    const base = [side * S(0.13), S(0.16), S(0.34)];
    const mid = [side * S(0.24), S(0.34), S(0.60) * hornLen];
    const tip = [side * S(0.30), S(0.40), S(0.92) * hornLen];
    const horn = (a, b, w) => {
      const dz = b[2] - a[2], dx = b[0] - a[0], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
      const aL = [a[0] + nx * w, a[1], a[2] + nz * w], aR = [a[0] - nx * w, a[1], a[2] - nz * w], aU = [a[0], a[1] + w, a[2]];
      hornT.push([aL, b, aU], [aU, b, aR], [aR, b, aL]);
    };
    horn(base, mid, S(0.05)); horn(mid, tip, S(0.03));
  }
  group.add(flatTriMesh(hornT, M.bone));

  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, S(0.14), S(0.10)); group.add(motifAnchor);
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
  const T = (model.tailLength ?? 1) * 3.1 * (model.tailStretch ?? 1);   // longer skeletal tail (reference)
  const nSeg = Math.round(model.tailSegments ?? 10);
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
  joints[0].isBone = true;   // drive by ROTATION only
  const jointOf = (z) => { for (let j = nChain - 1; j >= 0; j--) if (z >= jAnchor(j).z - 1e-6) return j; return 0; };

  // SKELETAL vertebra chain — a file of SHRINKING vertebra units along the stem (the SAME
  // vertebraUnit as the spine), binned per joint. NO smooth tube: the tail is BONE, and the
  // spacing leaves visible GAPS between vertebrae (the "lit tail-vertebra gaps" rear read).
  const boneByJoint = Array.from({ length: nChain }, () => []);
  const dorsalByJoint = Array.from({ length: nChain }, () => []);
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg, s = stem[i], sc = 1.18 - 0.72 * t;   // BIGGER vertebrae, closely spaced → a bone chain, not a dotted line
    if (sc <= 0.06) continue;
    const j = jointOf(s.z);
    vertebraUnit(s.z, s.cy, sc, boneByJoint[j], dorsalByJoint[j]);
  }
  for (let j = 0; j < nChain; j++) {
    const an = jAnchor(j);
    if (boneByJoint[j].length) { const m = flatTriMesh(boneByJoint[j], M.bone); m.position.set(-an.x, -an.y, -an.z); joints[j].add(m); }
    if (dorsalByJoint[j].length) { const m = flatTriMesh(dorsalByJoint[j], M.boneDorsal); m.position.set(-an.x, -an.y, -an.z); joints[j].add(m); }
  }
  // A fine skeletal POINT closes the tail (a last tapering caudal vertebra → a spike), NOT a
  // fleshy spade. The spectral wisp tip (translucent taper) lands here in I4.
  const tip = stem[nSeg], jt = jointOf(tip.z), ant = jAnchor(jt);
  const tp = flatTriMesh([
    [[-0.03, tip.cy + 0.03, tip.z], [0.03, tip.cy + 0.03, tip.z], [0, tip.cy, tip.z + 0.24]],
    [[0.03, tip.cy + 0.03, tip.z], [0, tip.cy - 0.03, tip.z], [0, tip.cy, tip.z + 0.24]],
    [[0, tip.cy - 0.03, tip.z], [-0.03, tip.cy + 0.03, tip.z], [0, tip.cy, tip.z + 0.24]],
  ], M.boneLo);
  tp.position.set(-ant.x, -ant.y, -ant.z); joints[jt].add(tp);

  return { group, segs: joints, accentMats: [] };
}
registerTail('vertebraeWhipTail', buildVertebraeWhipTail);
