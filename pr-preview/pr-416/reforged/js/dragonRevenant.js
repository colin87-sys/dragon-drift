import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';
import { makeGlowTexture } from './util.js';   // the engine's soft radial glow (ringless) — reused for the caged flame

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
const BONE = 0xe3e5ea, BONE_LO = 0xccced4;   // bright cool-NEUTRAL bleached ivory (B a hair over R — reads chalk, never warm tan, never steel-blue; firewall-safe)
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
  // envMapIntensity kept LOW: a high sky-reflection was tinting the bone steel-blue (Fable). Bone
  // is matte bleached chalk — brightness comes from albedo + key light, not a mirror of the sky.
  // envMap kept VERY low so ALL bone reads the SAME warm chalk-ivory (art-director: skull/wings
  // were rendering cool blue-grey vs the tail's warm tan — a high sky-reflection on up-facing
  // facets; killing it unifies the ramp). A faint self-lit floor keeps bone off pure-grey in shadow.
  const bone = new THREE.MeshStandardMaterial({ color: def.body ?? BONE, emissive: 0x000000, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  bone.envMapIntensity = 0.0;
  // Belly / ventral tier — a value-step darker so banks and the keel read.
  const boneLo = new THREE.MeshStandardMaterial({ color: def.belly ?? BONE_LO, emissive: 0x000000, flatShading: true, roughness: 0.86, metalness: 0, side: THREE.DoubleSide });
  boneLo.envMapIntensity = 0.0;
  // Dorsal tier — blended a hair between the two so the vertebra ridge reads from the side.
  const boneDorsal = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? BONE, def.belly ?? BONE_LO, 0.35), emissive: 0x000000, flatShading: true, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide });
  boneDorsal.envMapIntensity = 0.0;
  // Recess — the far-side inner rib/cavity wall (umber-green) so the hollow reads DEEP
  // while the windows stay TRUE holes (§4.4 hollow-cage render). Non-emissive.
  const recess = new THREE.MeshStandardMaterial({ color: RECESS, emissive: 0x000000, flatShading: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  recess.envMapIntensity = 0.15;
  // Flame-lit bone — the INNER-facing rib faces, ivory washed toward the grave-green with a
  // faint green self-glow, so the ribs read as BONE LIT BY THE CAGED FLAME (art-director: the
  // reference's fusing trick — ribs + flame become one object). Cheap on flat-shaded geometry.
  const boneLit = new THREE.MeshStandardMaterial({ color: lerpHex(def.body ?? BONE, 0x39b06a, 0.45), emissive: 0x1a5230, emissiveIntensity: 0.75, flatShading: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });   // INNER rib faces: bone washed toward grave-green + a self-glow → the cage reads lit-from-within (Fable "lantern"), the fire and the ribs fusing into one object
  boneLit.envMapIntensity = 0.0;
  return { bone, boneLo, boneDorsal, recess, boneLit };
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
  const boneT = [], dorsalT = [], recessT = [], keelT = [], ribLitT = [];   // per-tier accumulators → ≤5 meshes

  // ── VERTEBRA BEAM — neck file + dorsal file of shared vertebra units.
  const neckVerts = Math.round(model.neckVerts ?? 5);
  const dorsalVerts = Math.round(model.dorsalVerts ?? 9);
  const placeUnits = (z0, z1, n, s0, s1) => { for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1), z = z0 + (z1 - z0) * t; vertebraUnit(z, cyAt(z), s0 + (s1 - s0) * t, boneT, dorsalT); } };
  placeUnits(-2.62, -1.16, neckVerts, 0.70, 1.0);   // LONG S-curved neck of shrinking vertebrae rising to the skull
  placeUnits(-1.06, 1.58, dorsalVerts, 1.0, 0.74);  // dorsal → tail root (taper aft)

  // ── RIB CAGE — a BONE BLOSSOM (art-director + Fable, replacing the wire birdcage): free-
  // ended flat bone BLADES springing from the dorsal vertebrae, sweeping out + down then
  // CURLING back toward the caged flame. NO closed hoops, NO horizontal rails (those were the
  // "wireframe" tell). Flat blade cross-section (wide in z / tangential, thin radially),
  // FAT at the root + tapering to a chamfered tip, faceted per segment so each catches its
  // own flat-shaded value like real bone. Petal-splay (front short · mid longest+widest · back
  // short). The gaps between blades ARE the lantern windows; the flame-facing inner ends are
  // painted flame-lit green (bone lit BY the fire — the reference's fusing trick).
  const bell = (z) => Math.max(0, 1 - Math.pow((z + 0.20) / 1.22, 2));
  const cageDepth = (z) => 0.42 + 0.68 * bell(z);
  const halfW = (z) => 0.34 + 0.82 * bell(z);
  const bez3 = (a, c1, c2, b, t) => { const m = 1 - t; return [0, 1, 2].map((j) => m * m * m * a[j] + 3 * m * m * t * c1[j] + 3 * m * t * t * c2[j] + t * t * t * b[j]); };
  const NRIBPAIR = 7;
  const ribLenF = [0.74, 0.90, 1.0, 1.02, 0.96, 0.84, 0.68];   // petal-splay (widest at the mid pairs)
  const openFrac = 0.60 + 0.40 * Math.max(0, Math.min(1, (model.ribWindows ?? 6) / 6));   // ladder: f0 tighter cage → f3 full blossom
  const cz0 = -1.16, cz1 = 0.92;
  // Extrude a rib centreline as a chunky 4-sided DIAMOND BEAM so each rib reads as CARVED
  // BONE MASS from every angle — the old flat ribbon showed only its thin edge at rear-chase
  // and read as bent WIRE (Fable). The 4 faces catch 4 flat-shaded values → a lit top vs a
  // shaded underside (the chamfer that says "bone", not "wire"). Cross-section = z-axis ×
  // in-plane-normal, so the beam has real width in the rear-chase view plane.
  const ribBeam = (pts, wFn) => {
    let prev = null;
    for (let k = 0; k < pts.length; k++) {
      const p = pts[k], q = pts[Math.min(k + 1, pts.length - 1)], r = pts[Math.max(k - 1, 0)];
      let dx = q[0] - r[0], dy = q[1] - r[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;   // x-y tangent
      const nx = -dy, ny = dx, w = wFn(k / (pts.length - 1));   // in-plane normal (radial-ish → visible from behind)
      const ring = {
        n: [p[0] + nx * w, p[1] + ny * w, p[2]], s: [p[0] - nx * w, p[1] - ny * w, p[2]],   // n = OUTWARD, s = INWARD (toward the heart)
        u: [p[0], p[1], p[2] + w], d: [p[0], p[1], p[2] - w],   // fore/aft flanks
      };
      if (prev) {
        const quad = (a, b, out) => { out.push([prev[a], ring[b], ring[a]], [prev[a], prev[b], ring[b]]); };
        quad('n', 'u', boneT); quad('d', 'n', boneT);          // OUTWARD faces → plain bone
        quad('u', 's', ribLitT); quad('s', 'd', ribLitT);      // INWARD faces (touch the 's'/heart-side vertex) → green flame-lit bone (Fable: "faint green tint on the inner rib faces so the cage reads lit-from-within"). Only the inner faces → self-occluded from behind, so no concentric-ring tell.
      }
      prev = ring;
    }
  };
  for (let i = 0; i < NRIBPAIR; i++) {
    const t = i / (NRIBPAIR - 1), z = cz0 + (cz1 - cz0) * t;
    const cy = cyAt(z), dep = cageDepth(z) * ribLenF[i] * openFrac, hw = halfW(z) * ribLenF[i];
    for (const side of [1, -1]) {
      const P0 = [side * 0.05, cy + 0.16, z];                 // root at the vertebra (top)
      const C1 = [side * hw * 1.18, cy + 0.02, z + 0.02];     // spring wide
      const C2 = [side * hw * 1.02, cy - dep * 0.95, z + 0.03]; // belly (low, widest)
      const P1 = [side * hw * 0.54, cy - dep * 0.86, z + 0.02];   // free tip curls down but STAYS lateral → a wide ventral GAP so the ribs never close into a reticle octagon from behind; the grave-green spills out the open belly (Fable: closed rings framed the heart like a target)
      const NS = 5, pts = [];
      for (let k = 0; k <= NS; k++) pts.push(bez3(P0, C1, C2, P1, k / NS));
      ribBeam(pts, (u) => 0.075 * (1 - 0.5 * u));   // THICK carved bone at the root, tapering to a rounded tip (was a flat 2-tri ribbon — Fable: "wire brackets")
    }
  }
  // ── STERNUM — a short ventral keel the FRONT rib tips converge on (the chest reads as a
  // closed structure at the prow, not floating hoops). Belly tier.
  { let prev = null;
    for (let i = 0; i <= 8; i++) { const z = cz0 + 0.12 + 0.55 * (i / 8), y = cyAt(z) - cageDepth(z) * 0.82 * openFrac + 0.02, w = 0.055;
      const L = [-w, y, z], R = [w, y, z], D = [0, y - 0.06, z];
      if (prev) keelT.push([prev.L, R, L], [prev.L, prev.R, R], [prev.R, D, R], [prev.R, prev.D, D]);
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
  // ── SCAPULAR BLADE — ONE clean shoulder-blade plate per side over each wing root (z≈-0.55)
  // so the wing emerges from under a shoulder mass. A SINGLE quad, not 3 overlapping flakes —
  // the old flakes crisscrossed the neck+root into a shard jumble at rear-chase (Fable: the one
  // region of the money view that couldn't be parsed).
  for (const side of [1, -1]) {
    const rx = 0.34 * shoulderW * side, ry = TORSO_Y + 0.30, rz = -0.55;
    const P = (dx, dy, dz) => [rx + side * dx, ry + dy, rz + dz];
    boneT.push(
      [P(-0.20, 0.14, -0.20), P(0.24, 0.07, -0.05), P(0.08, -0.05, 0.28)],
      [P(-0.20, 0.14, -0.20), P(0.08, -0.05, 0.28), P(-0.18, 0.00, 0.20)],
    );
  }

  group.add(flatTriMesh(boneT, M.bone));
  group.add(flatTriMesh(dorsalT, M.boneDorsal));
  if (recessT.length) group.add(flatTriMesh(recessT, M.recess));
  group.add(flatTriMesh(keelT, M.boneLo));
  if (ribLitT.length) group.add(flatTriMesh(ribLitT, M.boneLit));   // flame-lit inner rib ends

  // ── THE GRAVE HEART — an emissive grave-green teardrop caged at the cage centre,
  // on the REAL transparent coreGlow hook (dragon.js:1147 ticks material.opacity:
  // floor → boost-breathe → Surge blaze). REQUIRES transparent:true + userData.base.
  // FrontSide + depthWrite off keeps it ~single-layer along any ray (§4.4 overdraw);
  // sized well inside the ribs (≥0.08 clearance) so it never z-fights a stave. Seen
  // only THROUGH the windows — a lantern, not a lamp.
  const coreBlaze = model.coreBlaze ?? 1;
  const hz = -0.18, hy = cyAt(hz) - cageDepth(hz) * 0.22;   // seated HIGH between the rib roots, on the spine centre-line (Fable: the flat card floated right of the spine)
  const heartR = 0.24 + 0.13 * coreBlaze;
  // THE GRAVE-FIRE — a small IRREGULAR EMBER MESH (not a flat billboard card) glowing behind a
  // WIDER anisotropic additive bloom:
  //   • EMBER — a vertex-jittered icosa lump with a SATURATED grave-green emissive (G≫R,B so it
  //     can never read white/holy). A real 3-D lump has no straight card-edge and no axial base
  //     ring, so it kills BOTH prior failures: the "flat mint rectangle sticker" and the
  //     "concentric octagon reticle." It's the ticked coreGlow hook (transparent → the rig
  //     breathes its opacity on boost/Surge). Emissive brightness carries at gameplay distance.
  //   • BLOOM — a wide additive halo, scaled ANISOTROPICALLY along the ribcage barrel (taller
  //     than wide, not a perfect disc) in a low-R/B green so the doubled centre stays green. It
  //     spills light out through the ventral gap + rib windows → "light through bone," not a disc.
  const bloomTex = makeGlowTexture('16,84,34', '40,168,66');    // low R/B → additive-safe green spill, centre holds green (never white — Fable warned brightening to white)
  const emberGeo = new THREE.IcosahedronGeometry(heartR * 0.92, 0);   // bigger ember → the green reads at the rear-chase money cam (Fable: was a 34px glint, not a lantern)
  { const pa = emberGeo.attributes.position; for (let vi = 0; vi < pa.count; vi++) {   // jitter → an irregular ember, no card-edge (deterministic: hashed by index, no Math.random)
      const h = Math.sin((vi + 1) * 12.9898) * 43758.5453; const j = (h - Math.floor(h) - 0.5) * 0.34 * heartR;
      const h2 = Math.sin((vi + 1) * 78.233) * 12543.187; const j2 = (h2 - Math.floor(h2) - 0.5) * 0.34 * heartR;
      pa.setXYZ(vi, pa.getX(vi) + j, pa.getY(vi) * 1.35 + j2, pa.getZ(vi) + j); }   // stretched vertically → a flame lump
    pa.needsUpdate = true; emberGeo.computeVertexNormals(); }
  const emberMat = new THREE.MeshBasicMaterial({ color: 0x4ec870, transparent: true, opacity: 0.78 + 0.20 * coreBlaze, depthWrite: false, blending: THREE.NormalBlending });   // saturated grave-green, unlit → a solid green ember (G−R = 122, can't read white)
  const heartHook = new THREE.Mesh(emberGeo, emberMat);
  heartHook.position.set(0, hy, hz);
  heartHook.userData.base = 0.78 + 0.20 * coreBlaze;   // the coreGlow tick scales THIS opacity
  const heartBloom = new THREE.Sprite(new THREE.SpriteMaterial({ map: bloomTex, color: 0xffffff, transparent: true, opacity: 0.30 + 0.18 * coreBlaze, blending: THREE.AdditiveBlending, depthWrite: false }));
  heartBloom.scale.set(heartR * (3.3 + 0.9 * coreBlaze), heartR * (4.5 + 1.2 * coreBlaze), 1);   // WIDE + taller than wide → green spills across multiple rib gaps, not a round disc (Fable: cross ≥3 gaps)
  heartBloom.position.set(0, hy, hz);
  heartBloom.renderOrder = 0;
  group.add(heartBloom);
  heartHook.renderOrder = 1;
  group.add(heartHook);

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
    wingRoot: (side) => ({ x: (0.50 * shoulderW) * side, y: TORSO_Y + 0.34 + (wro.y ?? 0), z: -0.55 + (wro.z ?? 0) }),   // roots OUTBOARD on the upper cage → a bare-spine gap so the two membranes never meet at centre
    headBase: { x: 0, y: 0.34, z: -2.68 },   // raised skull on the S-curved neck
    tailAnchor: { y: 0.14, z: 1.66 },
    keelTopAt: (z) => TORSO_Y + 0.30 * Math.max(0, 1 - Math.abs(z + 0.4) / 2.4),
    halfWidthAt: (z) => 0.34 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 3.0),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.60, z: -0.30 },
    motifAnchor,
  };
  // coreGlow = THE GRAVE HEART mesh (the real Solar hook — NOT null like the I0 stub).
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.bone }, coreGlow: heartHook };
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
  const hs = dials.halfSpan, wristT = dials.wristT ?? 0.12;   // MEDIAL wrist → SHORT arm stub; finger 0 carries the wing (owner: bring the arm back to short)
  const N = Math.max(2, Math.round(dials.fingers));
  const cD = dials.crescentDepth ?? 1;
  const bez = (a, c, b, t) => { const m = 1 - t; return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1], m * m * a[2] + 2 * m * t * c[2] + t * t * b[2]]; };
  const ridge = (tgt, a, b, wB, wT, lift, capT) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
    const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
    const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.4, b[2]];
    tgt.push([aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]);
    if (capT) capT.push([aT, bT, [a[0] + px * wB * 0.3, a[1] + lift, a[2] + pz * wB * 0.3]]);
  };

  // ── ARM — a SHORT 2-bone stub (owner: bring the arm back to short). The wrist K sits medial
  // with just a slight forward-up set to seat it; the FINGERS carry the whole wing. Δz<0 = fwd.
  const K = [wristT * hs, 0.06 * hs, -0.04 * hs];
  const root = [0, 0, 0], E = [wristT * 0.5 * hs, 0.03 * hs, -0.02 * hs];
  const boneT = [], capT = [];
  ridge(boneT, root, E, 0.075 * hs, 0.06 * hs, 0.06 * hs);           // humerus stub
  ridge(boneT, E, K, 0.06 * hs, 0.045 * hs, 0.05 * hs, capT);        // radius → wrist
  arm.add(flatTriMesh(boneT, M.bone));
  if (capT.length) arm.add(flatTriMesh(capT, M.bone));

  // ── FINGERS — long metacarpals fanning AFT off the medial wrist. Finger 0 = the leading edge
  // and carries the reference "‹" kink (forward at the knuckle → back to a TALL tip). The fan
  // rakes aft (az 25→88°) with a non-linear length falloff, and the tips DROOP progressively
  // (elev +15° leading → −20° trailing) — a VENTRAL dome that cups air to glide, not the old
  // dorsal up-flick (owner: the camber was inverted). Each finger is sampled along its curved
  // spar so the membrane can weld to the bone. Rows = [azimuth° aft, elevation° (up+), length×].
  const FAN = [[25, 1.00], [42, 0.92], [60, 0.74], [76, 0.55], [88, 0.40]];   // [azimuth° aft off K, length× of finger 0]
  const DROOP = [0.12, 0.16, 0.20, 0.24, 0.28];   // tip drop BELOW the wrist line, × finger length — EVERY tip droops (ventral dome that cups air; the trailing fingers droop most). NO dorsal lift (owner/critic: the wing was cupping UP in a raised V).
  const D2R = Math.PI / 180, NS = 4, L0 = 0.92 * hs;   // finger-0 length (long — the arm gave up its share)
  const spars = [], fingerT = [];
  for (let i = 0; i < N; i++) {
    const rowF = i / Math.max(1, N - 1) * (FAN.length - 1);
    const ri = Math.min(FAN.length - 2, Math.floor(rowF)), f = rowF - ri;
    const az = (FAN[ri][0] + (FAN[ri + 1][0] - FAN[ri][0]) * f) * D2R;
    const L = L0 * (FAN[ri][1] + (FAN[ri + 1][1] - FAN[ri][1]) * f);
    const dr = (DROOP[Math.min(N - 1, Math.max(0, Math.round(rowF)))]) * L;   // droop below the wrist plane
    const tip = [K[0] + Math.cos(az) * L, K[1] - dr, K[2] + Math.sin(az) * L];   // XZ from azimuth; Y DROOPS below the wrist → ventral cup
    // knuckle at ~58% to the tip: forward-outboard bow in XZ = concave-AFT plan curve (convex
    // leading edge). Finger 0 throws its knuckle STRONGLY forward (−Z) for the "‹" kink. Y stays
    // on the straight chord (no dorsal flip); the spanwise droop above gives the dome.
    const cdx = tip[0] - K[0], cdz = tip[2] - K[2], clen = Math.hypot(cdx, cdz) || 1;
    const kn = 0.58, bow = (i === 0 ? 0.30 : 0.18) * clen;
    const pfx = cdz / clen, pfz = -cdx / clen;
    const Bm = [K[0] + cdx * kn + pfx * bow, K[1] + (tip[1] - K[1]) * kn, K[2] + cdz * kn + pfz * bow];
    const s = []; for (let k = 0; k <= NS; k++) s.push(bez(K, Bm, tip, k / NS));   // curved-spar samples (welded nodes)
    spars.push(s);
    const w = 0.05 * hs * (1 - 0.06 * i);
    for (let k = 0; k < NS; k++) ridge(fingerT, s[k], s[k + 1], w * (1 - k / NS * 0.55) + 0.004, w * (1 - (k + 1) / NS * 0.55) + 0.004, 0.05 * hs * (1 - k / NS));
  }
  hand.add(flatTriMesh(fingerT, M.bone));

  // ── CHIROPATAGIUM — the skin is LOFTED onto the finger spar samples, so every membrane edge IS
  // a bone node: it is WELDED to the frame and cannot float off (owner: the old tip-referencing
  // fan detached from the bones). Each bay = strips between finger i's samples and finger i+1's,
  // split by a MID line that SAGS below the spar plane (−Y), deeper toward the trailing edge — a
  // VENTRAL billow that cups air. The free trailing edge is pulled toward K (scallop).
  const memT = [];
  const bayScallop = [0.34, 0.28, 0.23, 0.17];
  for (let i = 0; i < N - 1; i++) {
    const fa = spars[i], fb = spars[i + 1];
    const chord = Math.hypot(fb[NS][0] - fa[NS][0], fb[NS][1] - fa[NS][1], fb[NS][2] - fa[NS][2]) || 1;
    const billow = (0.14 + 0.08 * cD) * chord;                          // ventral sag depth
    const scal = bayScallop[Math.min(i, bayScallop.length - 1)] * (0.6 + 0.4 * cD) * (0.9 + 0.2 * ((i * 0.618) % 1));
    const mid = [];
    for (let k = 0; k <= NS; k++) {
      const saf = k / NS;                                              // 0 at the wrist (welded), 1 at the free edge
      const m = [(fa[k][0] + fb[k][0]) / 2, (fa[k][1] + fb[k][1]) / 2, (fa[k][2] + fb[k][2]) / 2];
      m[1] -= billow * (0.3 + 0.7 * saf);                              // cup DOWN, deepest aft
      if (k > 0) { m[0] += (K[0] - m[0]) * scal * saf; m[1] += (K[1] - m[1]) * scal * saf * 0.4; m[2] += (K[2] - m[2]) * scal * saf; }   // scallop the free edge toward the wrist
      mid.push(m);
    }
    for (let k = 0; k < NS; k++) {
      memT.push([fa[k], fa[k + 1], mid[k + 1]], [fa[k], mid[k + 1], mid[k]]);   // leading half of the bay
      memT.push([mid[k], mid[k + 1], fb[k + 1]], [mid[k], fb[k + 1], fb[k]]);   // trailing half
    }
  }
  hand.add(flatTriMesh(memT, wingMat));

  // ── PROPATAGIUM — the leading-edge web over the SHORT arm stub (shoulder→elbow→wrist) welding
  // the skin to the arm; it meets the chiropatagium at K, so the membrane is unbroken across the
  // wrist. Arm-side → folds with the arm.
  arm.add(flatTriMesh([[root, E, K], [root, K, [K[0] * 0.6, K[1] - 0.03 * hs, K[2] + 0.10 * hs]]], wingMat));
  // ── PLAGIOPATAGIUM / BRACHIAL membrane — the wing is ONE CONTINUOUS sheet, not a finger-fan
  // with a bare arm. This panel fills the ARMPIT under the arm and sweeps INBOARD + DOWN to a
  // body anchor B at the upper ribcage BESIDE THE SHOULDER JOINT (owner: the membrane must
  // connect to the ribcage-near-shoulder, and the long arm bones must carry membrane too — it
  // read as "tiny wings + skinny bare arms"). B sits close to the wing ROOT/pivot — NOT the far
  // hip like the old anchor, whose long aft lever swung a shard every downstroke — so it rotates
  // WITH the wing and stays glued to the shoulder. Arm-side + root points only (B, LE0, E, K) →
  // it never tears when the hand folds at the wrist. Together with the propatagium (over the arm)
  // and the chiropatagium (between the fingers), the membrane is unbroken from body to fingertip.
  const B = [-0.34, -0.39, 0.10];   // upper ribcage beside the shoulder joint (local; world ≈ inboard + down of the root)
  const Btr = [-0.10, -0.30, 0.55];   // a trailing point so the inboard hem drapes aft, not a straight cut
  arm.add(flatTriMesh([[B, root, E], [B, E, K], [B, K, Btr]], wingMat));   // armpit + brachial sheet: body → root → wrist → aft hem
  return { arm, hand, K, tip: spars[0][NS] };   // wingtip = finger-0 tip (the leading spar)
}

function buildPhalanxShroudWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = revenantMats(def);
  const fingers = Math.max(2, Math.round(model.fingers ?? 4));
  const halfSpan = (model.spanScale ?? 1) * 4.1;   // BROAD majestic span (owner: wings read tiny/fairy — push toward Phoenix Ascendant's span:length)
  const wristT = model.wristT ?? 0.40;   // Fable anatomy spec: arm = ~40% of the leading edge
  const dials = { fingers, halfSpan, wristT, crescentDepth: model.crescentDepth ?? 1, sweep: model.wingSweep ?? 0.36, dihedral: model.wingDihedral ?? 0.10 };

  // The shroud MEMBRANE — a dark CHARCOAL slate-green tattered skin, lifted one value step
  // off near-black (Fable) so the ivory finger-bones + rib barrel WIN the silhouette (bone
  // ~60/40 over shroud). Translucent so light reads through it and the rig drives its opacity.
  // Emissive black (the wing never glows — the light is the caged heart).
  const wingMat = new THREE.MeshStandardMaterial({ color: def.wingMembrane ?? 0x1d1f23, emissive: 0x000000, flatShading: true, roughness: 1.0, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });   // DEEP neutral charcoal — dark enough that even the lit rear/under facets stay a DARK SHROUD at rear-chase (Fable: membrane inverted to 52% pale in the money view; the law is "dark shroud"). Fully rough → no sky sheen; the pale ivory finger-bones win the wing read by value contrast.
  wingMat.envMapIntensity = 0.05;

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
  eyeMat.emissiveIntensity = 0.6 + 0.45 * (model.glowLevel ?? 1);   // kept LOW so the low-R grave-green emissive never clips its G channel to a cream/white bloom (Fable: the eye was the most holy-leaning element — a cream diamond)
  // A recessed dark POCKET = a rim ring at the skull surface + a floor point sunk INWARD
  // (|x|→0, +z) so it reads as a true hollow void in profile, not a painted-on facet. The
  // skull needs ≥2 such voids per side or it reads as a solid fleshed wedge (Fable).
  const rimT = [];
  const pocket = (cx, cy, cz, rx, ry, side) => {
    const floor = [cx - side * rx * 2.2, cy - ry * 0.15, cz + rx * 2.4];   // sunk DEEP into the cranium → the floor falls into shadow (Fable: pockets read as flat cracks; a void needs a recessed dark floor)
    const rim = [
      [cx - side * rx, cy + ry, cz - rx * 0.3], [cx + side * rx * 0.5, cy + ry * 0.9, cz - rx * 0.6],
      [cx + side * rx, cy - ry * 0.2, cz - rx * 0.2], [cx + side * rx * 0.3, cy - ry, cz], [cx - side * rx, cy - ry * 0.7, cz + rx * 0.2],
    ];
    for (let i = 0; i < rim.length; i++) socketT.push([rim[i], rim[(i + 1) % rim.length], floor]);   // rim → deep floor cup (near-black interior)
    // A raised BONE LIP flaring outward from the rim → a lit rim edge on every fenestra so it
    // reads as a CARVED orbit (bright bone rim + dark hole), not a flat painted chevron (Fable).
    const lip = rim.map((p) => [p[0] + (p[0] - floor[0]) * 0.18, p[1] + (p[1] - floor[1]) * 0.18 + ry * 0.10, p[2] + (p[2] - floor[2]) * 0.18]);
    for (let i = 0; i < rim.length; i++) { const j = (i + 1) % rim.length; rimT.push([rim[i], lip[j], lip[i]], [rim[i], rim[j], lip[j]]); }
  };
  for (const side of [1, -1]) {
    const ex = side * S(0.15), ey = S(0.04), ez = S(-0.14);
    pocket(ex, ey, ez, S(0.17), S(0.14), side);                   // (1) EYE SOCKET — big deep orbit holding the pinlight (~2× wider — Fable)
    pocket(side * S(0.09), S(-0.03), S(-0.46), S(0.075), S(0.075), side);  // (2) NASAL FENESTRA — a void on the muzzle
    pocket(side * S(0.17), S(-0.05), S(0.12), S(0.11), S(0.12), side);     // (3) TEMPORAL/cheek fenestra — a big void behind the eye
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(S(0.05), 0), eyeMat);
    eye.position.set(ex, ey, ez - S(0.02));   // the grave-green pinlight, seated in the orbit
    group.add(eye);
  }
  // A dedicated NEAR-BLACK socket floor material (darker than the umber recess tier) so the
  // orbit interior reads as a true hole (<40 luma) at side-profile game distance, not a decal.
  const sockMat = new THREE.MeshStandardMaterial({ color: 0x0e1113, emissive: 0x000000, flatShading: true, roughness: 1.0, metalness: 0, side: THREE.DoubleSide });
  sockMat.envMapIntensity = 0.0;
  group.add(flatTriMesh(socketT, sockMat));
  group.add(flatTriMesh(rimT, M.bone));   // the bright carved orbit rims

  // ── HORNS — a pair sweeping back + up + out from the occiput, ATTACHED at the base
  // (a 3-segment tapered tent so they curve). Length grows with the ladder (hornLen).
  // Back-swept horns — SHORTER + THICKER (Fable: they read as tall insect antennae). A chunky
  // ram-horn crowning the skull, not a thin antler; length via hornLen (kept low).
  const hornLen = model.hornLen ?? 0.65;
  const hornT = [];
  for (const side of [1, -1]) {
    const base = [side * S(0.14), S(0.15), S(0.32)];
    const mid = [side * S(0.26), S(0.30), S(0.30) + S(0.34) * hornLen];
    const tip = [side * S(0.34), S(0.33), S(0.30) + S(0.62) * hornLen];
    const horn = (a, b, w) => {
      const dz = b[2] - a[2], dx = b[0] - a[0], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
      const aL = [a[0] + nx * w, a[1], a[2] + nz * w], aR = [a[0] - nx * w, a[1], a[2] - nz * w], aU = [a[0], a[1] + w, a[2]], aD = [a[0], a[1] - w * 0.6, a[2]];
      hornT.push([aL, b, aU], [aU, b, aR], [aR, b, aD], [aD, b, aL]);   // 4-sided → chunky, not a flat blade
    };
    horn(base, mid, S(0.09)); horn(mid, tip, S(0.055));   // THICK base tapering to a still-solid tip
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
