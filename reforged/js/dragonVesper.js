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
  // Constellation speckle — a DIMMED moon-grey (a notch below the sheet's 0xc9d4e2)
  // so the diffuse flecks read as faint stars on the black wing without becoming the
  // second-brightest surface after the eyes on a dark sky (Fable I2 gate, issue 1).
  const speckle = new THREE.MeshStandardMaterial({ color: 0x656f7e, emissive: 0x000000, flatShading: true, roughness: 0.66, metalness: 0.03, side: THREE.DoubleSide });
  speckle.envMapIntensity = 0.12;
  // THE STARLIT SEAM — ion-blue, WITHHELD entirely in cruise. baseIntensity is set
  // near-zero so at rest the inset seam reads black (the cruise-black law holds — only
  // the eyes carry light); the shipped surge tick multiplies it by (1 + 0.9·sgm) with
  // a HIGH surgeGlowMultiplier so ONLY the Night Surge blazes it to ion-blue → surgeHi.
  // It goes in the surge arrays (spineMats); the eyes stay OUT. Diffuse stays dark blue.
  const seam = new THREE.MeshStandardMaterial({ color: 0x0a1024, emissive: 0x2050e8, emissiveIntensity: 0.04, flatShading: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  seam.userData.baseEmissive = 0x2050e8; seam.userData.baseIntensity = 0.04;   // surge lerps → surgeHi 0x4d86ff
  return { bodyFlat, belly, dorsalFacet, glassStreak, speckle, seam, stage: st };
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

  // THE STARLIT SEAM (dorsal) — an INSET ion-blue groove along the ridge, WITHHELD in
  // cruise (the seam mat's near-zero base reads black; only the Surge lights it). The
  // seamRun ladder carves it progressively: f0 a single nape NOTCH, f1 to mid-spine,
  // f2/f3 the full spine. Seated a hair BELOW the glass-streak so it reads as a carved
  // groove between facets, not a raised rib. Pushed into spineMats (the surge tick).
  const spineMats = [];
  const seamRun = model.seamRun;
  if (seamRun != null && seamRun >= 0) {
    const full = body.length - 1;
    const segCount = seamRun <= 0 ? 1 : Math.max(1, Math.round(full * Math.min(1, seamRun)));
    const srail = body.slice(0, segCount + 1).map(s => [0, s.cy + s.ry + 0.010, s.z]);
    const hw = 0.035, seamT = [];
    for (let i = 0; i < srail.length - 1; i++) {
      const A = srail[i], B = srail[i + 1];
      seamT.push([[A[0] - hw, A[1], A[2]], [B[0] + hw, B[1], B[2]], [B[0] - hw, B[1], B[2]]],
                 [[A[0] - hw, A[1], A[2]], [A[0] + hw, A[1], A[2]], [B[0] + hw, B[1], B[2]]]);
    }
    group.add(flatTriMesh(seamT, M.seam));
    spineMats.push(M.seam);
  }

  // Nape motif-anchor (the Starlit Seam seats here). Publishing it is a documented
  // crash-guard (parts read attach.motifAnchor).
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
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.bodyFlat }, coreGlow: null };
}
registerTorso('knappedTorso', buildKnappedTorso);

// ── WINGS: 'scallopCrescentWings' (the HERO) ──────────────────────────────────
// THE SCALLOP CRESCENT — the reference money-read. Each wing is a broad faceted
// night-glass sail whose TRAILING edge is `lobes` oversized, rounded, CONVEX scallop
// lobes (a fan of big flat tris around a cupped centre — the Sovereign vault-bay
// re-authored with ZERO hardware: no spars, pikes or lances). The rear-chase
// silhouette is the double-crescent of scallops spanning the frame laterally.
//   Seam-failure dead by construction: the membrane root is buried in the body
// silhouette and a SCAPULAR COWL (overlapping knapped flake-plates, static in the
// body frame) laps over the root — overlap > weld, no join to fail.
//   Translucent knife-edge: the outer ~22% of each lobe is a SEPARATE thin band
// (single-layer, opacity 0.72) so light shows through the rim exactly where the refs
// show it; the inboard membrane rides the 0.82 wing-fade contract (transparent from
// day one — the Solar opaque-wall bug). This is the visibility answer for a big dark
// occluder: the edges the player must see past ARE the see-through part.

// Wing leading-edge profile — SHARED with the tip marker / wingElements (the detach
// gotcha). A KNUCKLED bat arm, NOT a straight bar: a gull ARCH in Y rising to a carpal
// apex (~t 0.42) then easing to the tip, and a raptor OGEE in Z that bows FORWARD at
// mid-span then sweeps hard aft to the tip. This curved-organic leading edge is what
// kills the "delta-kite / plane" read (the owner's 1.5 verdict). Solar's wingArchY +
// Phoenix's sunLeadZ, restyled for a stealth drake (modest archRise).
function vesperArmY(t, hs, archRise) {
  const arch = t <= 0.42 ? Math.sin((t / 0.42) * Math.PI / 2) * 0.30 : 0.30 - (t - 0.42) * 0.20;
  return hs * (0.06 * t + (archRise ?? 0.4) * arch);
}
function vesperArmZ(t, hs) {
  return -0.10 + 0.44 * hs * Math.pow(t, 1.12) - 0.15 * hs * Math.sin(Math.PI * t);
}

// THE FINGERED BAT WING — the hero, rebuilt to the clay-sculpt reference (CP1). A carpal
// KNUCKLE at t≈0.42; FIVE radiating raised finger-BONES fan from it (finger 0 = longest,
// becomes the wingtip); the membrane cuts DEEP INWARD between finger tips in cupped
// concave arcs (never convex bumps on a plane); per-bay value tiers + a translucent
// scalloped knife-edge; a thumb claw at the knuckle + a root gusset sweeping to the hip
// kill the "bolted-on plank". Body-hued finger ridges are ANATOMY — the "zero hardware"
// rule bans gold regalia, not bones.
function buildOneScallopWing(M, dials) {
  const wg = new THREE.Group();
  const { fingers, halfSpan: hs, archRise, cup, gusset, thumb, constellations, edgeBand } = dials;
  const LE = (t) => [t * hs, vesperArmY(t, hs, archRise), vesperArmZ(t, hs)];
  const K = LE(0.42);                    // carpal knuckle — the fingers radiate from here
  const F0 = LE(1);                       // wingtip = longest finger (continues the leading edge)
  const quad = (a, c, b, s) => { const m = 1 - s; return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1], m * m * a[2] + 2 * m * s * c[2] + s * s * b[2]]; };

  // Finger tips fan from K: F0 leading; later fingers sweep progressively AFT + inboard,
  // shorter, drooping (aft-and-down terminal — never an up-curl). Real length variance
  // with a dominant (the Phoenix "fat fingers + a dominant, never a picket fence" law).
  const phi0 = Math.atan2(F0[2] - K[2], F0[0] - K[0]), r0 = Math.hypot(F0[0] - K[0], F0[2] - K[2]);
  const lenFrac = [1, 0.82, 0.66, 0.50, 0.36, 0.26], spanAft = 1.55;
  const tips = [F0];
  for (let i = 1; i < fingers; i++) {
    const phi = phi0 + spanAft * (i / (fingers - 1));
    const r = r0 * lenFrac[Math.min(i, lenFrac.length - 1)];
    tips.push([K[0] + Math.cos(phi) * r, K[1] - (0.05 + 0.12 * (i / (fingers - 1))) * r, K[2] + Math.sin(phi) * r]);
  }
  const tier = (i) => M.memTiers[Math.min(M.memTiers.length - 1, i)];

  // ── FINGER BONES — raised tapered tent-ridges from K to each tip with a lighter
  // rim-catch along the spine so they read as raised skeletal RAYS above the membrane
  // (the clay's piped ridges), not flat wedges. Plus a bolder arm bone (root → carpal).
  const ridgeLift = 0.12 * hs;
  const ridge = (a, b, wB, wT, mat, capMat) => {
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
    const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
    const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
    const aT = [a[0], a[1] + ridgeLift, a[2]], bT = [b[0], b[1] + ridgeLift * 0.35, b[2]];
    wg.add(flatTriMesh([[aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]], mat));
    // a slim brighter spine cap on the ridgeline → the raised-bone rim-catch (light).
    if (capMat) { const aT2 = [a[0] + px * wB * 0.28, a[1] + ridgeLift, a[2] + pz * wB * 0.28]; wg.add(flatTriMesh([[aT, bT, aT2]], capMat)); }
  };
  ridge(LE(0), K, 0.13 * hs, 0.09 * hs, M.dorsalFacet, M.speckle);              // arm bone
  for (let i = 0; i < tips.length; i++) ridge(K, tips[i], 0.075 * hs * (1 - 0.08 * i), 0.006, M.dorsalFacet, i < 2 ? M.speckle : null);

  // ── MEMBRANE BAYS — between consecutive fingers the trailing edge is a SMOOTH concave
  // arc pulled INWARD toward the knuckle (deep stretched-skin cups, the clay-sculpt read
  // — sampled at 4 segments so it's a curved sag, NOT a sharp sawtooth-V; deepest sag
  // biased slightly aft). The bay centre drops below the finger plane so rim light pools.
  // Opaque per-bay tier; the translucent knife-edge is ONE connected rim strip (below).
  const NSEG = 4, trailing = [];
  for (let i = 0; i < tips.length - 1; i++) {
    const Fa = tips[i], Fb = tips[i + 1];
    const base = [Fa[0] + (Fb[0] - Fa[0]) * 0.55, Fa[1] + (Fb[1] - Fa[1]) * 0.55, Fa[2] + (Fb[2] - Fa[2]) * 0.55];   // aft-biased
    const ctrl = [base[0] + (K[0] - base[0]) * cup, base[1] + (K[1] - base[1]) * cup - 0.04, base[2] + (K[2] - base[2]) * cup];
    const arc = [];
    for (let s = 0; s <= NSEG; s++) arc.push(quad(Fa, ctrl, Fb, s / NSEG));
    const mid = [(Fa[0] + Fb[0]) / 2, (Fa[1] + Fb[1]) / 2, (Fa[2] + Fb[2]) / 2];
    const dpair = Math.hypot(Fa[0] - Fb[0], Fa[2] - Fb[2]);
    const C = [(K[0] + mid[0]) / 2, (K[1] + mid[1]) / 2 - 0.11 * dpair, (K[2] + mid[2]) / 2];
    const fan = [[C, K, arc[0]], [C, arc[NSEG], K]];
    for (let s = 0; s < NSEG; s++) fan.push([C, arc[s], arc[s + 1]]);
    wg.add(flatTriMesh(fan, tier(i)));
    for (let s = 0; s <= NSEG; s++) if (!(i > 0 && s === 0)) trailing.push(arc[s]);   // one shared polyline
  }

  // ── TRANSLUCENT KNIFE-EDGE — ONE connected thin band just inboard of the whole
  // scalloped trailing polyline (was per-bay shards that read as floating debris). Lifted
  // a hair so it composites over the membrane; light shows through the rim (the visibility
  // answer — the edges the player sees past ARE the see-through part).
  if (edgeBand && trailing.length > 1) {
    const eT = [], inb = (p) => [p[0] + (K[0] - p[0]) * 0.12, p[1] + (K[1] - p[1]) * 0.12 + 0.005, p[2] + (K[2] - p[2]) * 0.12];
    for (let s = 0; s < trailing.length - 1; s++) {
      const a = trailing[s], b = trailing[s + 1], ai = inb(a), bi = inb(b);
      eT.push([a, b, bi], [a, bi, ai]);
    }
    wg.add(flatTriMesh(eT, M.edgeMat));
  }

  // ── ROOT GUSSET — the inboard membrane sweeps aft to the hip so the wing isn't bolted
  // on (a separate overlapped triangle, buried in the body silhouette / under the cowl).
  // A DARKER inboard tier + a dropped mid so it blends into the wing, not a flat plate.
  if (gusset) {
    const r0p = LE(0), Faft = tips[tips.length - 1];
    const G = [r0p[0] + 0.10 * hs, r0p[1] - 0.06 * hs, r0p[2] + 1.7];
    const gm = [(r0p[0] + Faft[0] + G[0]) / 3, (r0p[1] + Faft[1] + G[1]) / 3 - 0.06, (r0p[2] + Faft[2] + G[2]) / 3];
    wg.add(flatTriMesh([[r0p, K, Faft], [r0p, Faft, gm], [Faft, G, gm], [G, r0p, gm]], tier(Math.min(2, M.memTiers.length - 1))));
  }

  // ── THUMB CLAW — a small knapped blade at the carpal, raked forward-up (the ref's
  // leading-edge break).
  if (thumb) {
    const cl = [K[0] + 0.04 * hs, K[1] + 0.12 * hs, K[2] - 0.18 * hs];
    wg.add(flatTriMesh([[K, [K[0] + 0.02 * hs, K[1] + 0.02 * hs, K[2] - 0.02 * hs], cl], [K, cl, [K[0] - 0.03 * hs, K[1] + 0.03 * hs, K[2] + 0.02 * hs]]], M.dorsalFacet));
  }

  // ── CONSTELLATIONS — diffuse moon-grey flecks near the wingtip, seated CLOSE to the
  // membrane (was floating +0.045 → read as detached dirt; now +0.012). Scattered.
  for (let i = 0; i < constellations; i++) {
    const s = 0.4 + 0.5 * ((i * 0.618) % 1);
    const along = quad(K, tips[Math.min(1, tips.length - 1)], F0, s);
    const base = [along[0], along[1] + 0.012, along[2]];
    const r = 0.05 + 0.028 * ((i * 0.27) % 1), rot = (i * 1.7) % (Math.PI * 2);
    const v = (k, rad) => [base[0] + Math.cos(rot + k) * rad, base[1], base[2] + Math.sin(rot + k) * rad];
    wg.add(flatTriMesh([[v(0, r), v(2.1, r * 0.82), v(4.2, r * 1.12)]], M.speckle));
  }
  return wg;
}

// SCAPULAR COWL — overlapping knapped flake-plates (triangular flats in the torso's
// knap language, NOT a boxy saddle) that lap DIAGONALLY over the wing root from
// above/behind, STATIC in the body frame so they hide the membrane-root join while
// the wing flaps under them (overlap > weld — no seam to fail).
function buildScapularCowl(M, root, side) {
  const g = new THREE.Group();
  const rx = root.x, ry = root.y, rz = root.z, s = side;
  // Inner flake — laps from the spine side diagonally down-and-out over the root.
  const P = (dx, dy, dz) => [rx + s * dx, ry + dy, rz + dz];
  g.add(flatTriMesh([
    [P(-0.24, 0.18, -0.24), P(0.30, 0.12, -0.14), P(0.02, 0.00, 0.32)],   // upper diagonal flake
    [P(-0.24, 0.18, -0.24), P(0.02, 0.00, 0.32), P(-0.22, 0.04, 0.20)],
  ], M.dorsalFacet));
  // Outer flake — a smaller knapped chip overlapping the first, lapping aft over the
  // root chord (its trailing point buries into the membrane root → no gap).
  g.add(flatTriMesh([
    [P(0.14, 0.14, -0.18), P(0.50, 0.04, 0.04), P(0.16, -0.04, 0.36)],
    [P(0.14, 0.14, -0.18), P(0.16, -0.04, 0.36), P(0.00, 0.02, 0.14)],
  ], M.bodyFlat));
  return g;
}

function buildScallopCrescentWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const fingers = Math.max(2, Math.round(model.scallopLobes ?? 5));   // finger-bone count (repurposed dial)
  const halfSpan = (model.spanScale ?? 1) * 3.4;
  const archRise = model.archRise ?? 0.4;
  const cup = model.wingCup ?? 0.35;                  // how deep the membrane cups inward between fingers
  const edgeBand = (model.edgeBand ?? 1) > 0;
  const gusset = (model.wingGusset ?? 1) > 0;
  const thumb = (model.thumbClaw ?? 1) > 0;
  const constellations = Math.round(model.constellations ?? 0);
  const cowl = (model.cowlPlates ?? 0) > 0;
  const dials = { fingers, halfSpan, archRise, cup, gusset, thumb, edgeBand, constellations };

  // MEMBRANE VALUE TIERS — inboard lighter → outboard = the per-form wingOuter (all in
  // the L≤0.10 blue-black lane), so the wing reads RICH (≥3 values), not one flat black
  // (the owner's "lacks richness"). Transparent from day one so the game's wing-fade
  // (dragon.js drives wingMat.opacity → 0.82/0.77/0.70) works. DoubleSide.
  const wo = def.wingOuter ?? NIGHT;
  M.memTiers = [0.32, 0.20, 0.10, 0].map((f) => {
    const m = new THREE.MeshStandardMaterial({ color: lerpHex(wo, SLATE, f), emissive: 0x000000, flatShading: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.82 });
    m.envMapIntensity = 0.2; return m;
  });
  M.wingMat = M.memTiers[0];   // the game's opacity-fade driver (largest inboard area)
  // Knife-edge band — a SINGLE thin translucent layer (never stacked back-faces; the
  // CP3.2 0.82² lesson). Glossier so the scalloped rim glints as lit night-glass.
  M.edgeMat = new THREE.MeshStandardMaterial({ color: lerpHex(wo, SLATE, 0.6), emissive: 0x000000, flatShading: true, roughness: 0.55, metalness: 0.03, side: THREE.DoubleSide, transparent: true, opacity: 0.68 });
  M.edgeMat.envMapIntensity = 0.3;

  const rootSpark = (model.seamRootSpark ?? 0) > 0;   // f3: one short inset seam streak per wing root
  const wingSpineMats = [];
  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    mid.add(buildOneScallopWing(M, dials));   // canonical +X geometry (rake/dihedral baked in)
    if (side === -1) pivot.scale.x = -1;       // left = mirror → the animator's mirrored poses read symmetric
    group.add(pivot);
    // Scapular cowl is STATIC (body frame), NOT parented to the flapping pivot.
    if (cowl) group.add(buildScapularCowl(M, root, side));
    // WING-ROOT SPARK LINE (f3) — a single short inset seam streak UNDER the cowl (never
    // veins across the membrane — the wing stays black so the scallop owns the frame).
    // WITHHELD in cruise; Surge-lit. Static in the body frame so the cowl laps over it.
    if (rootSpark) {
      const rx = root.x - side * 0.06, ry = root.y - 0.02, rz = root.z, o = 0.02;
      group.add(flatTriMesh([
        [[rx, ry, rz - 0.20], [rx + o, ry, rz + 0.18], [rx - o, ry, rz + 0.18]],
      ], M.seam));
      if (!wingSpineMats.includes(M.seam)) wingSpineMats.push(M.seam);
    }
    const s = side === 1 ? 'R' : 'L';
    // Tip marker MUST duplicate the arm profile (detach gotcha) — the wingtip is the
    // longest finger's tip: LE(1) = (halfSpan, vesperArmY, vesperArmZ).
    const tipY = vesperArmY(1, halfSpan, archRise), tipZ = vesperArmZ(1, halfSpan);
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, tipY, tipZ);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + tipZ], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: wingSpineMats, wingMat: M.wingMat, parts: { ...pivots, wingElements } };
}
registerWings('scallopCrescentWings', buildScallopCrescentWings);

// ── HEAD: 'vesperCatHead' ─────────────────────────────────────────────────────
// A blunt faceted CAT-WEDGE (short muzzle, broad brow, NO horns). The eyes are the
// face's whole budget — the roster's LARGEST apex eye, acid-green, laddering round
// kitten → almond. Ear-fin nubs (pairs by the ladder) cant ~±10° off-sagittal so
// they read as the top-centre silhouette punctuation from the chase cam.
function buildVesperCatHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Blunt cat-wedge: broad brow, short muzzle, pointing −Z (~12 big facets via the
  // chined loft). Value-banded like the torso so the wedge reads knapped.
  const bandMat = (k) => (k === 1 || k === 2) ? M.dorsalFacet : (k >= 4) ? M.belly : M.bodyFlat;
  const skull = [
    { z: 0.34, rx: 0.26 * hs, ry: 0.28 * hs, cy: 0.02 },   // occiput
    { z: -0.02, rx: 0.32 * hs, ry: 0.30 * hs, cy: 0.03 },  // brow (widest)
    { z: -0.40, rx: 0.24 * hs, ry: 0.22 * hs, cy: -0.02 }, // cheek
    { z: -0.74, rx: 0.13 * hs, ry: 0.13 * hs, cy: -0.06 }, // short muzzle
    { z: -0.94, rx: 0.06 * hs, ry: 0.06 * hs, cy: -0.08 }, // muzzle tip
  ];
  group.add(knapLoft(skull, CHINE_PROFILE, bandMat));
  const headLength = 1.3 * hs;

  // EAR-FIN NUBS — clean swept knapped fin-blades on the occiput (cat-ear read), pairs
  // by the ladder (1→3): the FRONT pair dominant, later pairs a smaller fin-crest so
  // they never crowd into a spiky fringe. Each is ONE bold canted flat blade — its base
  // offset in z tilts the face ~±12° off-sagittal so it reads from behind (the
  // top-centre silhouette punctuation), NOT a horn.
  const pairs = Math.round(model.earFinPairs ?? 1);
  for (let p = 0; p < pairs; p++) {
    const z0 = 0.18 * hs - p * 0.16 * hs;             // front pair = the "ears", later pairs a small crest
    const sc = 1 - 0.30 * p;
    const h = 0.20 * hs * sc, wide = 0.20 * hs * sc;  // SHORT + BROAD (an ear-flake, not a needle)
    for (const side of [1, -1]) {
      const bx = side * 0.12 * hs, by = 0.15 * hs;
      const baseF = [bx - side * 0.02 * hs, by, z0 - wide * 0.5];       // front base
      const baseB = [bx + side * 0.11 * hs * sc, by - 0.03 * hs, z0 + wide * 0.5];  // back-outer base (wide span → the ±12° cant)
      const tip = [bx + side * 0.07 * hs * sc, by + h, z0 - wide * 0.1]; // moderate up + out, swept slightly forward like a cat ear
      group.add(flatTriMesh([[baseF, tip, baseB]], M.dorsalFacet));
    }
  }

  // BIG acid-green cat eyes — round kitten (f0) → almond (f3): eyeScale drives size,
  // eyeAlmond drives the elongation (round 1.2×1.1 → almond 1.75×0.58). Set HIGH on the
  // BROW plane (not low on the muzzle) and CONVERGED forward so both almonds face the
  // camera and OWN the face-front money shot (Fable I3 gate, issue 1).
  const es = model.eyeScale ?? 1, alm = model.eyeAlmond ?? 1;
  const sx = 1.2 + 0.55 * alm, sy = 1.1 - 0.52 * alm;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.172 * hs * es, 0), eyeMat);   // roster's LARGEST eye (identity claim, §6)
    eye.position.set(side * 0.19 * hs, 0.14 * hs, -0.15 * hs);   // high on the brow, forward
    eye.scale.set(sx, sy, 1);
    eye.rotation.y = side * 0.28;          // converge toward the front (face the camera)
    eye.rotation.z = -side * 0.18 * alm;   // almond tilt (outer corner lifts) as it narrows
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.18 * hs, 0.30 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('vesperCatHead', buildVesperCatHead);

// ── TAIL: 'splitFanTail' ──────────────────────────────────────────────────────
// A long thin CHINED stem closing in TWIN split fan-fins — each fin knapped petals
// pitched ~+15° toward the chase lens (the cant law). The signature nod to the
// Night-Fury "one fin is different" read is an ASYMMETRY OF MARKING (NO red
// prosthetic): the PORT fin alone carries a white-speckle constellation.
function buildSplitFanTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = vesperMats(def, glow, model.igniteStage);
  const a = anchor ?? { y: 0.13, z: 2.08 };
  const stretch = model.tailStretch ?? 1;
  const T = (model.tailLength ?? 1) * 2.8 * stretch;
  const nSeg = Math.round(model.tailSegments ?? 7);
  const rAt = (t) => 0.13 * Math.pow(1 - t * 0.94, 0.7) + 0.01;
  const curveY = (t) => -0.06 * T * Math.sin(Math.PI * t * 0.9);
  const stem = [];
  for (let i = 0; i <= nSeg; i++) { const t = i / nSeg; stem.push({ z: a.z + t * T, rx: rAt(t), ry: rAt(t), cy: a.y + curveY(t) }); }
  const bandMat = (k) => (k === 1 || k === 2) ? M.dorsalFacet : (k >= 4) ? M.belly : M.bodyFlat;
  group.add(knapLoft(stem, CHINE_PROFILE, bandMat, false));

  // THE STARLIT SEAM (tail stem) — the dorsal circuit continues down the tail (f2/f3:
  // "full spine + tail stem"). WITHHELD in cruise (seam mat near-zero base); Surge-lit.
  const accentMats = [];
  const seamRun = model.seamRun ?? 0;
  if (seamRun >= 1) {
    const srail = stem.map(s => [0, s.cy + s.ry + 0.008, s.z]);
    const hw = 0.026, seamT = [];
    for (let i = 0; i < srail.length - 1; i++) {
      const A = srail[i], B = srail[i + 1];
      seamT.push([[A[0] - hw, A[1], A[2]], [B[0] + hw, B[1], B[2]], [B[0] - hw, B[1], B[2]]],
                 [[A[0] - hw, A[1], A[2]], [A[0] + hw, A[1], A[2]], [B[0] + hw, B[1], B[2]]]);
    }
    group.add(flatTriMesh(seamT, M.seam));
    accentMats.push(M.seam);
  }
  const finRims = (model.seamFinRims ?? 0) > 0;   // f3: the fan-fin rims carry the seam

  const tip = stem[nSeg];   // {z, cy, ...}
  const tx = 0, ty = tip.cy, tz = tip.z;
  const spread = model.tailFinSpread ?? 0;
  const splitFan = Math.round(model.splitFan ?? 0);   // 0 spade nub · 1 twin nubs · 2 split fan
  const speckle = M.speckle;

  if (splitFan <= 0) {
    // f0 — a small spade nub (a single flat knapped spade closing the stem).
    group.add(flatTriMesh([
      [[tx, ty + 0.05, tz], [tx - 0.10, ty, tz + 0.12], [tx + 0.10, ty, tz + 0.12]],
      [[tx - 0.10, ty, tz + 0.12], [tx, ty - 0.03, tz + 0.30], [tx + 0.10, ty, tz + 0.12]],
    ], M.bodyFlat));
  } else if (splitFan === 1) {
    // f1 — twin nubs (the split begins): two small angled spade nubs.
    for (const side of [1, -1]) {
      const nx = side * 0.07;
      group.add(flatTriMesh([
        [[nx, ty + 0.04, tz], [nx + side * 0.10, ty, tz + 0.10], [nx, ty - 0.02, tz + 0.26]],
      ], M.bodyFlat));
    }
  } else {
    // f2/f3 — TWIN SPLIT FAN-FINS: each fin = 3 knapped petals splayed by `spread`,
    // faces pitched ~+15° toward the chase lens (the cant law) so the bright rim (seam,
    // wired in I4) catches the rear cam. Port (side −1) carries the constellation nod.
    for (const side of [1, -1]) {
      const petals = 3;
      // Separate the port + starboard clusters with a visible GAP so the TWIN read is
      // legible (not one symmetric spray) — the anti-fray + twin fix share this (Fable
      // I3 gate, issue 3).
      const rootX = side * 0.13, rootZ = tz;
      for (let p = 0; p < petals; p++) {
        const ang = side * (0.20 + 0.40 * (p / (petals - 1))) * spread;   // fan splay (from the cluster)
        const len = (0.46 - 0.04 * p) * (0.7 + 0.5 * spread);
        const px = rootX + Math.sin(ang) * (0.14 + 0.30 * spread), pz = rootZ + Math.cos(ang) * (0.12 + len);
        const lift = ty + 0.13 + 0.045 * p;                         // pitched +15° up-back toward the lens
        // BROAD knapped-diamond petal (a leaf, not a quill): a wide root + a wide mid so
        // it reads solid + faceted from the chase cam, never a frayed brush.
        const wIn = 0.055, wMid = 0.10 + 0.02 * p;
        const rIn = [rootX - side * wIn, ty, rootZ + 0.04];
        const rOut = [rootX + side * wIn, ty - 0.01, rootZ + 0.10];
        const tipIn = [px - side * wMid, lift, pz - 0.04];
        const tipOut = [px + side * wMid, lift - 0.02, pz + 0.03];
        group.add(flatTriMesh([[rIn, tipIn, tipOut], [rIn, tipOut, rOut]], p % 2 ? M.dorsalFacet : M.bodyFlat));
        // FIN-RIM SEAM (f3) — an ion-blue inset line along the petal's outer rim; the
        // Starlit Seam forks into both fan-fin rims. WITHHELD in cruise, Surge-lit.
        if (finRims) {
          const o = 0.014;
          group.add(flatTriMesh([
            [rOut, tipOut, [tipOut[0], tipOut[1] + o, tipOut[2]]],
            [rOut, [tipOut[0], tipOut[1] + o, tipOut[2]], [rOut[0], rOut[1] + o, rOut[2]]],
          ], M.seam));
        }
        // PORT-FIN CONSTELLATION (asymmetry nod) — diffuse flecks on the port fin only.
        // Zero-tri-cost identity: fresh + legally clean (NO red prosthetic).
        if (side === -1) {
          const fx = (rIn[0] + tipIn[0]) / 2, fy = (rIn[1] + tipIn[1]) / 2 + 0.02, fz = (rIn[2] + tipIn[2]) / 2;
          const r = 0.035;
          group.add(flatTriMesh([[[fx - r, fy, fz], [fx + r, fy + 0.004, fz - r * 0.3], [fx, fy, fz + r]]], speckle));
        }
      }
    }
    // f3 — a central RUDDER facet between the fins (the finished-blade tail closer).
    if ((model.tailRudder ?? 0) > 0) {
      group.add(flatTriMesh([
        [[0, ty + 0.02, tz], [0, ty + 0.30, tz + 0.10], [0, ty - 0.02, tz + 0.40]],
      ], M.dorsalFacet));
    }
  }
  if (finRims && !accentMats.includes(M.seam)) accentMats.push(M.seam);
  return { group, segs: [], accentMats };
}
registerTail('splitFanTail', buildSplitFanTail);
