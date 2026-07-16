import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// BELLADONNA STILETTO — "Venom, patiently brewed" (VENOM-BELLADONNA-BUILDSHEET.md v1
// + BELLADONNA-ARTDIRECTION-LOCK.md). A lethal wasp-DRAGON: a draconic chitin
// skull-mask, a short armored neck, ONE pair of tucked raptorial claws on a gloss
// oil-slick violet-black dart; FOUR gossamer veined blade-wings in a shallow X, a
// pinched wasp-waist, a three-window venom gaster glowing UV-orchid, and a needle
// stinger trailing dead-center at the lens.
//   THE LAW (lock §1): the SKELETON is a dragon; the ANATOMY KIT is wasp. Dragon owns
// the FORWARD half (skull-mask head, collared neck, one raptorial forelimb pair, the
// mass hierarchy); wasp owns the AFT half (waist, 3-window gaster, needle, four wings,
// horn-gauge antennae, chitin surface). ≈60% dragon chassis / 40% insect kit.
//   Four self-registering, default-off builders: chitinWaspTorso · gossamerDoubletWings
// · stilettoMaskHead · stingerLanceTail — the Vesper faceted-assembly STRUCTURE (knapLoft
// value-band loft, −anchor tail chain, outer-wrapper wing mirror), never its look.
//   Axis: head/forward −Z, tail/rear +Z, right +X, up +Y.
//   VENOM-GLOW LAW (lock §5): glow lives ONLY in {3 gaster sac fills, eyes, drip bead
// (f2+), stinger channel (f3), pterostigma ×4 (f3)} — components, never a lit field;
// the fill LEVEL is the spectacle, not intensity. All venom-family emissive mats go in
// materials.flareMats (NEVER spineMats — those take the warm cruise rim, poison for 292°).
//
// BUILD STATE: I0 — all four builders are contract-satisfying violet-black faceted
// PLACEHOLDERS that satisfy the flap/attach contract + carry the aux-pivot four-wing
// hook (parts.auxWingPivots). The real anatomy lands increment by increment:
//   I1 chitinWaspTorso + THE VENOM STILL · I2 gossamerDoubletWings fore pair ·
//   I3 the hind pair + THE HUM · I4 stilettoMaskHead + stingerLanceTail + fever firewall.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.15;
// Palette anchors (violet-black lacquer; apex reference values — the per-form
// darkening ramp rides the def's `colors` hex).
const CHITIN = 0x150b1d, VENTER = 0x2f1a38, SHEEN_V = 0x4a2a68, SHEEN_T = 0x1e4a4e;
// UV-orchid venom family (292°) — the ONLY emissive.
const ORCHID = 0xd936ff, FILL_LINE = 0xe86aff, FILL_BODY = 0x8a1eb0, BEAD = 0xef8aff, BREW = 0x8a1eb0;

// hex-lerp — blend two colours by t (derive dorsal / value-band tiers from the
// per-form body/venter hexes so the banding tracks the darkening ladder).
function lerpHex(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// ── The chitin material factory — copies only the vesperMats STRUCTURE (stage-aware,
// flat-shaded mats + surge-tick userData on every ticked mat), never the look. The
// venom-family emissives (fills, bead, channel, stigma, eye) carry
// userData.baseEmissive/baseIntensity so the shipped flareMats Surge loop delivers the
// lock's contract with zero new glow code. Body law: metalness 0, emissive 0x000000 on
// every diffuse mat (the rig ticks bodyMat.emissiveIntensity — black emissive keeps the
// chitin lacquer-dark through it; venom lives on dedicated component meshes).
function stilettoMats(def, glow, stage) {
  const g = Math.max(0, Math.min(1, glow ?? 1));
  const body = def.body ?? CHITIN;
  const mk = (color, extra) => { const m = new THREE.MeshStandardMaterial({ color, emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0, ...extra }); m.envMapIntensity = 0.25; return m; };
  // Chitin lacquer tiers (value bands, ≥0.05 L spread — CP4). The dorsal crown tier is
  // aimed at a LIT violet-steel (not just toward the plum venter, which compressed the
  // tiers to ~0.03 L and read flat-black) so the crown facets read RICH while the flank
  // stays the darkest object (the inverted-value identity holds).
  const LIT_CHITIN = 0x5a4c78;
  const chitinDorsal = mk(lerpHex(body, LIT_CHITIN, 0.44));
  const chitinFlank = mk(body);
  const venter = mk(def.belly ?? VENTER);
  // Oil-slick sheen — diffuse grazing-row tints ONLY (≤10% coverage), roughness 0.35
  // band (the "wet lacquer"); everything else 0.7 (the anti-Vesper gloss finish).
  const sheenViolet = mk(SHEEN_V, { roughness: 0.35 }); sheenViolet.envMapIntensity = 0.4;
  const sheenTeal = mk(SHEEN_T, { roughness: 0.35 }); sheenTeal.envMapIntensity = 0.4;
  // Wing membrane — GOSSAMER pale lavender-pink translucent glass (the concept's airy wings,
  // which outrank the sheet's darker 0x2a1a38→0x6a5a88 spec — the owner's images win on taste),
  // 4 value tiers stepping ≥0.05 L smoke tip-ward → lit pale root; SHARED across all four wings.
  const memTiers = [0x9a7ea6, 0xb89ac4, 0xceb4da, 0xe8d2ee].map((c) => {   // uniformly pale across span (the innermost cell lifted so the gossamer read holds close-up too)
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: 0x000000, flatShading: true, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.42 });
    m.envMapIntensity = 0.25; return m;
  });
  // Vein skeleton — opaque raised ridges + a lighter PINK rim-catch (the concept's pink
  // venation, read as sculpted rays; NON-emissive — the lock's glow budget bans wing glow
  // except the pterostigma, so the pink is diffuse colour, never light).
  const veinMat = mk(0x9a5a92);
  const veinCap = mk(0xe6a4d6);
  // Sac WALL — the ONLY body transparency: a single-layer LOW-opacity glass sheen over the
  // brew (NOT a dark cover — the brew must read bright through it). Bright orchid-tinted glass.
  const sacWall = new THREE.MeshStandardMaterial({ color: lerpHex(ORCHID, 0xffffff, 0.2), emissive: 0x000000, flatShading: true, roughness: 0.28, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.26 });
  sacWall.envMapIntensity = 0.35;
  // The FILL — opaque emissive liquid (the diegetic power meter). fillLine is the near-white-hot
  // surface (the brightest gaster pixel); fillBody the orchid brew. In flareMats.
  const fillLine = mk(FILL_LINE, { emissive: FILL_LINE, emissiveIntensity: 1.7 });
  fillLine.userData.baseEmissive = FILL_LINE; fillLine.userData.baseIntensity = 1.7;
  const fillBody = mk(0xb43ae8, { emissive: 0xb43ae8, emissiveIntensity: 1.0 });   // a brighter orchid brew (the deep 0x8a1eb0 read near-black under the wall)
  fillBody.userData.baseEmissive = 0xb43ae8; fillBody.userData.baseIntensity = 1.0;
  // Drip bead (f2+), stinger channel + pterostigma (f3) — dark until their form, then
  // venom-lit. Seam mats DoubleSide (the culled-ignition gotcha).
  const bead = mk(BEAD, { emissive: BEAD, emissiveIntensity: 0.6 });
  bead.userData.baseEmissive = BEAD; bead.userData.baseIntensity = 0.6;
  const channel = new THREE.MeshStandardMaterial({ color: lerpHex(body, ORCHID, 0.2), emissive: ORCHID, emissiveIntensity: 0.05, flatShading: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  channel.userData.baseEmissive = ORCHID; channel.userData.baseIntensity = 0.05;
  // Pterostigma — a near-black-violet OPAQUE wing-spot that reads as a dark cell on the pale
  // gossamer membrane (diffuse dark until f3, then venom-lit — the only wing emissive).
  const stigma = new THREE.MeshStandardMaterial({ color: 0x140a1c, emissive: ORCHID, emissiveIntensity: 0.05, flatShading: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  stigma.userData.baseEmissive = ORCHID; stigma.userData.baseIntensity = 0.05;
  return { chitinDorsal, chitinFlank, venter, sheenViolet, sheenTeal, memTiers, veinMat, veinCap, sacWall, fillLine, fillBody, bead, channel, stigma, body };
}

// ── Faceted loft over a fixed polygon PROFILE (the Vesper knapLoft) — stations
// [{z, rx, ry, cy, cx?}] → one flat-shaded chined tube whose shared profile indices
// weld the facets into LONGITUDINAL strakes (kills the stacked-rings read). `matOrFn`
// may be a colMat(k) function returning the material for the column between profile[k]
// and profile[k+1] → value bands read from the side; tris grouped per material.
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

// The chitin cross-section: a faceted octagon with a slight dorsal keel + belly flat
// (the armored-ring read). Dorsal columns (k1,k2,k6,k7-ish top) → chitinDorsal; belly
// columns → venter; flanks → chitinFlank.
const CHITIN_PROFILE = [
  [1.00, 0.10],   // k0 right flank apex
  [0.72, 0.72],   // k1 upper-right shoulder
  [0.00, 1.00],   // k2 dorsal ridge
  [-0.72, 0.72],  // k3 upper-left shoulder
  [-1.00, 0.10],  // k4 left flank apex
  [-0.66, -0.74], // k5 lower-left belly
  [0.00, -1.00],  // k6 belly keel
  [0.66, -0.74],  // k7 lower-right belly
];
const bandMat = (M) => (k) => (k === 1 || k === 2 || k === 3) ? M.chitinDorsal : (k >= 5) ? M.venter : M.chitinFlank;

// ── vec helpers (small, local) ────────────────────────────────────────────────
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vscl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vnorm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// A raised SHINGLE plate — an overlapping beveled card (the Vesper cowl overlap-not-weld
// trick): a quad lifted proud along a local normal with a beveled leading rim, so a row of
// them reads as struck lacquer armor, never one smooth tube. Returns tris.
function shinglePlate(c, u, v, n, halfU, halfV, lift, capFrac) {
  const U = vscl(u, halfU), V = vscl(v, halfV), Lp = vscl(n, lift);
  const p00 = vadd(vadd(c, vscl(U, -1)), vscl(V, -1));
  const p10 = vadd(vadd(c, U), vscl(V, -1));
  const p11 = vadd(vadd(vadd(c, U), V), Lp);           // trailing rim lifts proud (the bevel catch)
  const p01 = vadd(vadd(vadd(c, vscl(U, -1)), V), Lp);
  const tris = [[p00, p10, p11], [p00, p11, p01]];
  return tris;
}

// THE HEX SAC WINDOW + THE FILL (the diegetic power meter). A pointy-top hexagon aperture
// in a local frame (center C, across u / vertical v / outward n). Returns:
//   wall  — the translucent hex panel (single layer), proud of the surface by `proud`.
//   fill  — the OPAQUE emissive liquid, the lower `frac` of the hex (fillBody), inset behind.
//   line  — the bright liquid SURFACE strip at the top of the fill (fillLine — the brightest
//           pixels on the gaster). back — a dark backing hex so the empty top reads dark.
function hexVerts(C, u, v, r) {
  const out = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3;
    out.push(vadd(C, vadd(vscl(u, Math.cos(a) * r), vscl(v, Math.sin(a) * r))));
  }
  return out;
}
function fanTris(poly) { const t = []; for (let i = 1; i < poly.length - 1; i++) t.push([poly[0], poly[i], poly[i + 1]]); return t; }
// Core→BLOOM→dark, in depth order (surface outward): a dark sac FLOOR (the empty region
// above the brew reads dark) → the OPAQUE EMISSIVE brew BODY (proud of the chitin, so it is
// the bright interior, never occluded by the wall) → a near-white-hot MENISCUS at the brew
// top (the brightest gaster pixel — the diegetic power line) → a subtle low-opacity glass
// WALL sheen over it (the "vessel" read, NOT a dark cover). The chitin frame around the hex
// is the dark field.
function sacWindow(C, u, v, n, r, frac) {
  const f = Math.max(0.05, Math.min(1, frac));
  const hv = -r + f * 2 * r;   // brew surface height in v (bottom −r → top +r)
  const P = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + k * Math.PI / 3; P.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const kept = [], cross = [];
  for (let i = 0; i < P.length; i++) {
    const A = P[i], B = P[(i + 1) % P.length];
    const Ain = A[1] <= hv, Bin = B[1] <= hv;
    if (Ain) kept.push(A);
    if (Ain !== Bin) { const t = (hv - A[1]) / (B[1] - A[1]); const X = [A[0] + (B[0] - A[0]) * t, hv]; kept.push(X); cross.push(X); }
  }
  const floorC = vadd(C, vscl(n, 0.006));   // dark sac floor (the empty region reads dark)
  const brewC = vadd(C, vscl(n, 0.022));    // the brew sits PROUD → the bright interior
  const wallC = vadd(C, vscl(n, 0.036));    // the glass sheen, furthest proud (subtle, low-opacity)
  const toW = (p, base) => vadd(vadd(base, vscl(u, p[0])), vscl(v, p[1]));
  const fill = fanTris(kept.map((p) => toW(p, brewC)));       // the opaque emissive brew body
  const back = fanTris(hexVerts(floorC, u, v, r * 0.99));     // the dark floor
  const wall = fanTris(hexVerts(wallC, u, v, r));             // the glass wall (low-opacity sheen)
  // The MENISCUS — a bright strip at the brew top, ALWAYS drawn (at full fill it rides the
  // top vertices so the brimming still still shows its power line).
  const up = vscl(v, r * 0.11);
  let line;
  if (cross.length >= 2) { const a0 = toW(cross[0], brewC), a1 = toW(cross[1], brewC); line = [[a0, a1, vadd(a1, up)], [a0, vadd(a1, up), vadd(a0, up)]]; }
  else { const tL = toW([-r * 0.5, r * 0.84], brewC), tR = toW([r * 0.5, r * 0.84], brewC); line = [[tL, tR, vadd(tR, up)], [tL, vadd(tR, up), vadd(tL, up)]]; }
  return { wall, fill, back, line };
}

// THE RAPTORIAL FORELIMB (one pair, ~120 tris) — a lofted shoulder swell → forearm → 3-claw
// hand, folded KNEE-UP and hugged to the thorax underside (the tuck reads folded, not
// landing-gear-down — failure mode 7). STATIC in the body frame. Built canonical for +side.
function buildForelimb(M, side, shoulder) {
  const g = new THREE.Group();
  const s = side;
  // 3-station mini-loft bone: a swell-then-taper profile (the sanctioned knapLoft bone).
  const bone = (a, b, ra, rb, mat) => {
    const stations = [
      { z: 0, rx: ra, ry: ra, cy: 0, cx: 0 },
      { z: 1, rx: rb, ry: rb, cy: 0, cx: 0 },
    ];
    // orient a→b: build a short 5-sided loft along the segment.
    const dir = vsub(b, a), len = Math.hypot(...dir) || 1;
    const d = vnorm(dir);
    const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const uu = vnorm(vcross(up, d)), vv = vnorm(vcross(d, uu));
    const ring = (p, rad) => { const o = []; for (let k = 0; k < 5; k++) { const ang = k * 2 * Math.PI / 5; o.push(vadd(p, vadd(vscl(uu, Math.cos(ang) * rad), vscl(vv, Math.sin(ang) * rad)))); } return o; };
    const r0 = ring(a, ra), r1 = ring(b, rb), tris = [];
    for (let k = 0; k < 5; k++) { const k1 = (k + 1) % 5; tris.push([r0[k], r1[k1], r1[k]], [r0[k], r0[k1], r1[k1]]); }
    g.add(flatTriMesh(tris, mat));
    return { d, uu, vv };
  };
  const hip = [s * 0.30, -0.14, -0.10];               // at the thorax underside
  const knee = [s * 0.34, -0.30, 0.14];               // raised + forward (knee UP)
  const wrist = [s * 0.26, -0.20, 0.34];              // swept forward + up (the tuck)
  bone(hip, knee, 0.10, 0.06, M.chitinFlank);         // upper (shoulder swell → knee)
  bone(knee, wrist, 0.06, 0.04, M.chitinDorsal);      // forearm (tapers)
  // 3 claw nubs — 2-face tents fanning from the wrist, curled under.
  for (let c = 0; c < 3; c++) {
    const sp = 0.06 * (c - 1);
    const tip = [wrist[0] + s * 0.03, wrist[1] - 0.10, wrist[2] + 0.10 + sp];
    const bA = [wrist[0] - s * 0.03 + sp, wrist[1], wrist[2]], bB = [wrist[0] + s * 0.03 + sp, wrist[1] - 0.02, wrist[2] + 0.03];
    g.add(flatTriMesh([[bA, tip, bB], [bB, tip, [wrist[0] + sp, wrist[1] - 0.04, wrist[2] - 0.02]]], M.chitinFlank));
  }
  g.position.set(shoulder.x - s * 0.30, shoulder.y, shoulder.z);
  return g;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TORSO — 'chitinWaspTorso' (I1): the three-mass wasp aft (thorax → petiole/waist →
// gaster) + the draconic PROW (2–3-plate collared neck + ONE raptorial forelimb pair) +
// THE VENOM STILL (3 hex sac windows, single-layer walls + the opaque emissive FILL — the
// diegetic power meter). Publishes the full attach contract (fore + hind wing roots),
// spinePoints (the locked side line-of-action), motifAnchor (gaster seg-2), coreGlow:null
// (the crash guard — the venom still must NEVER breathe with boost/Surge opacity, §4a).
// ═══════════════════════════════════════════════════════════════════════════════
function buildChitinWaspTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const bm = bandMat(M);
  const waistPinch = model.waistPinch ?? 0.34;
  const gasterSegs = Math.round(model.gasterSegments ?? 4);
  const sacWindows = Math.min(3, Math.max(0, gasterSegs - 1));   // {1,2,3,3} for gasterSegs {2,3,4,4}
  const sacFill = model.sacFill ?? 1.0;
  const neckPlates = Math.round(model.neckPlates ?? 3);
  const thoraxR = 0.52;

  // Proportion spline (nose→gaster tip = 1.0): head .12 · neck .08 · thorax .30 ·
  // petiole .08 · gaster .42. Mapped to a body z-scale (the whole dart ~4.4 long).
  const L = 4.4;
  // NECK (0.08) — a short collar arcing forward-down into the level head carriage.
  const neck = [
    { z: -L * 0.38, rx: 0.30, ry: 0.32, cy: 0.20 },
    { z: -L * 0.30, rx: 0.36, ry: 0.38, cy: 0.20 },
  ];
  group.add(knapLoft(neck, CHITIN_PROFILE, bm, false));
  // NECK COLLAR PLATES (2–3, the lock's draconic prow) — overlapping chitin shingles
  // arcing forward-down, each lapping the next (overlap > weld); rhyme with the thorax
  // shingles (hero-echo). On the dorsal + upper flanks so they read from the chase cam.
  {
    const cT = [];
    for (let p = 0; p < neckPlates; p++) {
      const t = p / Math.max(1, neckPlates), z = -L * 0.37 + t * L * 0.09, r = 0.31 + t * 0.10, cy = 0.20;
      const c = [0, cy + r * 0.72, z], n = vnorm([0, 0.9, -0.4]);
      const u = [1, 0, 0], v = vnorm(vcross(n, u));
      for (const tri of shinglePlate(c, u, v, n, r * 0.7, 0.10, 0.04)) cT.push(tri);
    }
    group.add(flatTriMesh(cT, M.chitinDorsal));
  }
  // THORAX (0.30) — the armored keel + shoulder cowls; the highest dorsal point.
  const thorax = [
    { z: -L * 0.30, rx: 0.40, ry: 0.42, cy: 0.20 },
    { z: -L * 0.18, rx: thoraxR, ry: 0.56, cy: 0.22 },   // proud crown (widest)
    { z: -L * 0.06, rx: 0.46, ry: 0.48, cy: 0.20 },
  ];
  group.add(knapLoft(thorax, CHITIN_PROFILE, bm, false));
  // THORAX SHINGLE ROW (5 overlapping lacquer plates) — a dorsal shingle file down the
  // crown (the Vesper cowl overlap-not-weld trick as a struck-armor field), so the thorax
  // reads worked lacquer, not a smooth tube. Alternating value tiers.
  {
    const dP = [], fP = [];
    for (let p = 0; p < 5; p++) {
      const t = p / 5, z = -L * 0.29 + t * L * 0.24, r = 0.42 + 0.10 * Math.sin(t * Math.PI), cy = 0.20 + 0.02 * Math.sin(t * Math.PI);
      const c = [0, cy + r * 0.82, z], n = vnorm([0, 0.95, -0.15]);
      const u = [1, 0, 0], v = vnorm(vcross(n, u));
      for (const tri of shinglePlate(c, u, v, n, r * 0.66, L * 0.032, 0.045)) (p % 2 ? fP : dP).push(tri);
    }
    group.add(flatTriMesh(dP, M.chitinDorsal));
    group.add(flatTriMesh(fP, M.chitinFlank));
  }
  // PETIOLE / WASP-WAIST (0.08) — the signature concave break; painted MID-tier (never the
  // darkest hex); floor 0.22× thorax radius. ONE dorsal strake runs thorax→gaster THROUGH
  // the pinch (law 6 — never severed).
  const wR = Math.max(0.22, waistPinch) * thoraxR;
  const petiole = [
    { z: -L * 0.06, rx: 0.40, ry: 0.42, cy: 0.20 },
    { z: 0.0, rx: wR, ry: wR * 1.05, cy: 0.18 },   // apex pinch
    { z: L * 0.06, rx: 0.44, ry: 0.42, cy: 0.16 },
  ];
  group.add(knapLoft(petiole, CHITIN_PROFILE, () => M.chitinFlank, false));
  // GASTER (0.42) — telescoping armor rings (swell-then-taper), seg radii
  // ×[0.9,1.0,0.82,0.58] of thorax radius. Segments 2–4 carry the sac windows. Hangs low.
  const segR = [0.9, 1.0, 0.82, 0.58].slice(0, gasterSegs);
  const gStations = [{ z: L * 0.06, rx: 0.44, ry: 0.42, cy: 0.16 }];
  const gZ0 = L * 0.06, gZ1 = L * 0.48;
  for (let i = 0; i < segR.length; i++) {
    const t = (i + 1) / segR.length;
    gStations.push({ z: gZ0 + (gZ1 - gZ0) * t, rx: segR[i] * thoraxR, ry: segR[i] * thoraxR * 0.98, cy: 0.14 - 0.05 * t });
  }
  group.add(knapLoft(gStations, CHITIN_PROFILE, bm, true));

  // THE THROUGH-STRAKES — thin tent strips running continuously thorax → THROUGH the pinch →
  // gaster on BOTH the dorsal crown AND the venter (law 6, the anti-severed guard: from the side
  // the pinch must read as a tight coupling, never daylight). The dorsal one carries the
  // oil-slick sheen band.
  {
    const chain = [...thorax, ...petiole, ...gStations].slice().sort((a, b) => a.z - b.z);
    const makeStrake = (yOf, hw, mat) => {
      const rail = chain.map((s) => [0, yOf(s), s.z]), t = [];
      for (let i = 0; i < rail.length - 1; i++) {
        const A = rail[i], B = rail[i + 1];
        t.push([[A[0] - hw, A[1], A[2]], [B[0] + hw, B[1], B[2]], [B[0] - hw, B[1], B[2]]],
               [[A[0] - hw, A[1], A[2]], [A[0] + hw, A[1], A[2]], [B[0] + hw, B[1], B[2]]]);
      }
      group.add(flatTriMesh(t, mat));
    };
    makeStrake((s) => s.cy + s.ry + 0.012, 0.05, M.sheenViolet);   // dorsal (wet-lacquer grazing catch)
    makeStrake((s) => s.cy - s.ry - 0.012, 0.06, M.chitinFlank);   // ventral coupling (mid-tier, never severed)
  }

  // ── THE RAPTORIAL FORELIMBS (one pair, zero hind legs) — folded knee-up, hugged to the
  // thorax underside, static; they thicken the anti-SPINDLE core for free.
  if ((model.forelimbs ?? 1) > 0) for (const side of [1, -1]) {
    group.add(buildForelimb(M, side, { x: (thoraxR - 0.14) * side, y: 0.06, z: -L * 0.10 }));
  }

  // ── THE VENOM STILL — 3 hex sac WINDOWS on gaster segments 2..(1+sacWindows). Each: a
  // single-layer translucent WALL (merged to ONE mesh across all windows) + an opaque
  // emissive FILL (the liquid, lower `sacFill` fraction; fillLine the bright surface,
  // fillBody the deep brew) + a dark BACKING (the empty top reads dark → core→bloom→dark).
  const wallT = [], fillLineT = [], fillBodyT = [], backT = [];
  let motifPos = [0, 0.14, gZ0 + (gZ1 - gZ0) * 0.4];
  for (let w = 0; w < sacWindows; w++) {
    const segIdx = 2 + w;                 // segments 2,3,4 (1-indexed into gStations)
    const s = gStations[Math.min(segIdx, gStations.length - 1)];
    const r = s.rx, hexR = r * 0.82;
    // Window on the UPPER-REAR of the segment facing UP-AND-BACK: the above-behind chase
    // cam looks forward-down onto the trailing gaster and sees these directly, and each
    // window peeks over the SMALLER next segment (the gaster tapers). The near-vertical
    // plane lets the world-up liquid WATERLINE read (the diegetic meter). (Engineering
    // delta from the sheet's "venter": the venter faces AWAY from the above-behind cam —
    // dorsal-rear is where the still actually reads in the judged frame; flagged on the PR.)
    const C = [0, s.cy + r * 0.42, s.z + r * 0.30];
    const n = vnorm([0, 0.5, 0.86]);
    const v0 = [0, 1, 0], v = vnorm(vsub(v0, vscl(n, vdot(v0, n))));   // world-up projected into the window plane (liquid rises along +v)
    const u = vnorm(vcross(v, n));
    const win = sacWindow(C, u, v, n, hexR, sacFill);
    for (const t of win.wall) wallT.push(t);
    for (const t of win.fill) fillBodyT.push(t);
    for (const t of win.line) fillLineT.push(t);
    for (const t of win.back) backT.push(t);
    if (w === 0) motifPos = [0, s.cy, s.z];   // the fixed motif anchor = gaster seg-2
  }
  if (backT.length) group.add(flatTriMesh(backT, M.venter));          // the dark sac floor
  if (fillBodyT.length) group.add(flatTriMesh(fillBodyT, M.fillBody)); // the brew (opaque emissive)
  if (fillLineT.length) group.add(flatTriMesh(fillLineT, M.fillLine)); // the liquid surface (brightest)
  if (wallT.length) group.add(flatTriMesh(wallT, M.sacWall));          // the ONE merged translucent wall

  // Motif anchor — the venom still's fixed reference (gaster seg-2, never re-hues).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(motifPos[0], motifPos[1], motifPos[2]);
  group.add(motifAnchor);

  // Line-of-action (the locked side spline): collar → thorax-crown rise → waist DIP →
  // gaster swell → under-curl start; ≥1 inflection, rest body-axis pitch ≤8°.
  const spinePoints = [
    new THREE.Vector3(0, 0.20, -L * 0.34),
    new THREE.Vector3(0, 0.24, -L * 0.18),   // thorax crown (highest)
    new THREE.Vector3(0, 0.18, 0.0),          // waist dip
    new THREE.Vector3(0, 0.16, L * 0.24),     // gaster swell
    new THREE.Vector3(0, 0.13, L * 0.48),     // under-curl start
  ];

  const attach = {
    // Fore wing roots high on the crown shoulder; hind 0.28 body aft + one plate below.
    wingRoot: (side) => ({ x: (thoraxR - 0.08) * side, y: TORSO_Y + 0.40, z: -L * 0.16 }),
    hindWingRoot: (side) => ({ x: (thoraxR - 0.12) * side, y: TORSO_Y + 0.30, z: -L * 0.16 + L * 0.28 }),
    headBase: { x: 0, y: 0.06, z: -L * 0.40 },
    tailAnchor: { y: 0.13, z: gZ1 },
    halfWidthAt: (z) => 0.55 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 3.2),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.66, z: -L * 0.08 },
    motifAnchor,
  };
  // The fills join flareMats (the Surge flare loop scales them by surgeGlowMultiplier; in
  // cruise they glow at their baked baseIntensity — the fill LEVEL is the read, not intensity).
  // coreGlow MUST be null (the venom still never breathes with opacity — §4a; the null also
  // guards the dragon.js opacity hook against a null-deref crash).
  return {
    group, attach, spinePoints, spineMats: [],
    flareMats: [M.fillLine, M.fillBody],
    mats: { bodyMat: M.chitinFlank }, coreGlow: null,
  };
}
registerTorso('chitinWaspTorso', buildChitinWaspTorso);

// ═══════════════════════════════════════════════════════════════════════════════
// WINGS — 'gossamerDoubletWings' (I0 PLACEHOLDER): four veined glass blade-wings in a
// shallow X (fore + hind TRUE pairs). I0 roughs the blades on the wingParts 3-seg rig +
// carries the HIND pair on the nullable `parts.auxWingPivots` hook (the four-wing HUM,
// specced against the real rig this session). The costa/vein-fan/cells/pterostigma and
// the tuned motion land at I2/I3.
//   Mirror law: canonical +X wings; the LEFT side = ONE outer lmirror scale.x=−1 wrapper
// per side parenting BOTH that side's pivots (fore + hind) — never a scale on a pivot
// itself (the aurumToro convention; wingsymprobe Δ0.000).
// ═══════════════════════════════════════════════════════════════════════════════

// The blade profile — ONE module-level waypoint function shared by fore geometry, hind
// geometry (×0.62), tip markers, and tests (the detach-gotcha law). A long, narrow,
// high-aspect blade: leading costa a taut shallow arc. Returns [x,y,z] along the span t.
export function stilettoBlade(t, len, chord) {
  const x = t * len;
  const y = 0.10 * len * Math.sin(t * Math.PI * 0.55);   // taut shallow leading arc
  const z = -0.06 * len + 0.34 * len * Math.pow(t, 1.15); // gentle aft sweep
  return [x, y, z, chord];
}

// A raised VEIN — a tapered tent-ridge from a→b with a lighter rim-catch cap on its
// spine (the CP1 recipe → the vein reads as a raised sculpted RAY on the glass, not a
// flat print). Pushes tris into `veinT` (opaque body) + `capT` (lighter rim).
function vein(veinT, capT, a, b, wB, wT, lift) {
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1, px = -dz / len, pz = dx / len;
  const aL = [a[0] + px * wB, a[1], a[2] + pz * wB], aR = [a[0] - px * wB, a[1], a[2] - pz * wB];
  const bL = [b[0] + px * wT, b[1], b[2] + pz * wT], bR = [b[0] - px * wT, b[1], b[2] - pz * wT];
  const aT = [a[0], a[1] + lift, a[2]], bT = [b[0], b[1] + lift * 0.4, b[2]];
  veinT.push([aL, bL, bT], [aL, bT, aT], [aR, aT, bT], [aR, bT, bR]);
  const aC = [a[0] + px * wB * 0.3, a[1] + lift, a[2] + pz * wB * 0.3];
  capT.push([aT, bT, aC]);
}

// THE VEINED GLASS BLADE-WING (the hero — a long NARROW gossamer blade with insect
// venation, per the concept). Returns { arm, hand, K } for the wrist fold (the outer
// membrane rides `hand` so the fold never tears it — the −anchor law). A clean high-aspect
// BLADE panel (leading COSTA + a parallel trailing edge tapering to a point), value-tiered
// translucent glass, with a raised VENATION overlay (the bold costa + a fan of veins from
// the carpal node K + a longitudinal vein), an OPAQUE knife-edge HEM along the trailing
// polyline, and the dark PTEROSTIGMA at 0.82 span.
function buildVeinedWing(M, len, chord, cellN) {
  const arm = new THREE.Group(), hand = new THREE.Group();
  const LE = (t) => { const b = stilettoBlade(t, len, chord); return [b[0], b[1], b[2]]; };
  const chordW = chord * len * 0.86;   // pull the planform chord in toward the 0.26 stiletto blade (not a leaf)
  // Chord-width profile: a slim base, swelling to the max chord near t≈0.32, then tapering
  // to a POINT at the tip (a blade, never a fan). Aft direction = +z (the wing sweeps back).
  const cp = (t) => chordW * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0.001, t)), 0.70)), 0.9);
  const TE = (t) => { const p = LE(t); return [p[0], p[1] - 0.015 * len, p[2] + cp(t)]; };
  const K = LE(0.38);
  const tierAt = (t) => t < 0.5 ? M.memTiers[3] : (t < 0.8 ? M.memTiers[2] : M.memTiers[1]);   // root pale-lit → tip smoke
  // Build the membrane STRIP over a t-range into a group, tier-batched (one draw per tier).
  const buildStrip = (t0, t1, grp) => {
    const N = Math.max(3, Math.round((t1 - t0) * 11));
    const byT = new Map();
    for (let i = 0; i < N; i++) {
      const ta = t0 + (t1 - t0) * i / N, tb = t0 + (t1 - t0) * (i + 1) / N;
      const A = LE(ta), B = LE(tb), At = TE(ta), Bt = TE(tb);
      const mat = tierAt((ta + tb) / 2);
      let a = byT.get(mat); if (!a) byT.set(mat, a = []);
      a.push([A, At, Bt], [A, Bt, B]);
    }
    for (const [m, tris] of byT) grp.add(flatTriMesh(tris, m));
  };
  buildStrip(0, 0.38, arm);     // inner root membrane rides the arm
  buildStrip(0.38, 1, hand);    // the outer blade rides the hand (folds at K)
  // ── VENATION overlay (raised pink ridges): the bold COSTA (root→K on arm, K→tip on hand),
  // a fan of veins from K to the trailing edge (dominant + decay), and a longitudinal vein.
  { const rv = [], rc = []; vein(rv, rc, LE(0), K, 0.03 * len, 0.024 * len, 0.035 * len); arm.add(flatTriMesh(rv, M.veinMat)); arm.add(flatTriMesh(rc, M.veinCap)); }
  const cv = [], cc = [];
  vein(cv, cc, K, LE(1), 0.032 * len, 0.006 * len, 0.038 * len);   // costa outer — the DOMINANT vein (bolder)
  // fan veins from K, dominant + steep DECAY (the leading 2–3 primaries strong, the rest fade
  // — kills the equal-rank picket read; holds venation at more angles).
  for (let i = 1; i <= cellN; i++) {
    const tv = 0.44 + 0.5 * (i / (cellN + 1));                     // fan endpoints along the trailing edge
    const decay = Math.pow(0.72, i - 1);                           // steep decay
    vein(cv, cc, K, TE(tv), (0.006 + 0.014 * decay) * len, 0.003 * len, (0.012 + 0.018 * decay) * len);
  }
  // a longitudinal vein mid-chord (root→tip) — the ladder rail the fan crosses (a primary).
  const midOf = (t) => { const a = LE(t), b = TE(t); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; };
  vein(cv, cc, midOf(0.42), midOf(0.92), 0.014 * len, 0.005 * len, 0.022 * len);
  hand.add(flatTriMesh(cv, M.veinMat));
  hand.add(flatTriMesh(cc, M.veinCap));
  // ── CRISP KNIFE-EDGE HEM — a connected DARK-violet opaque border along the trailing edge
  // (a hard line that snaps the blade edge against the pale gossamer membrane; the sharp edge
  // WITHOUT alpha — the census choice). Split at K so it folds with the hand.
  const hemStrip = (t0, t1, grp) => {
    const N = Math.max(2, Math.round((t1 - t0) * 11)), t = [];
    let pT = TE(t0), pL = LE(t0);
    for (let i = 1; i <= N; i++) {
      const tt = t0 + (t1 - t0) * i / N, cT = TE(tt), cL = LE(tt);
      const pin = [pT[0] + (pL[0] - pT[0]) * 0.07, pT[1] + 0.003 * len, pT[2] + (pL[2] - pT[2]) * 0.07];
      const cin = [cT[0] + (cL[0] - cT[0]) * 0.07, cT[1] + 0.003 * len, cT[2] + (cL[2] - cT[2]) * 0.07];
      t.push([pT, cT, cin], [pT, cin, pin]);
      pT = cT; pL = cL;
    }
    grp.add(flatTriMesh(t, M.venter));   // dark plum → a crisp knife-edge that reads against the pale glass
  };
  hemStrip(0.38, 1, hand);
  hemStrip(0.02, 0.38, arm);
  // ── PTEROSTIGMA — the classic dark wing-spot at 0.82 span on the leading costa: a distinct
  // opaque near-black cell (~1 cell wide) proud of the pale membrane so it reads clearly
  // (diffuse dark until f3, then venom-lit — the ONLY wing emissive ever). Rides the hand.
  const ps = LE(0.80), pw = 0.055 * len, py = 0.012 * len;
  const pc = [ps[0], ps[1] + py, ps[2] + cp(0.80) * 0.28];   // seated just aft of the costa
  hand.add(flatTriMesh([
    [[pc[0] - pw, pc[1], pc[2] - pw * 0.7], [pc[0] + pw, pc[1], pc[2] - pw * 0.7], [pc[0] + pw, pc[1], pc[2] + pw * 0.7]],
    [[pc[0] - pw, pc[1], pc[2] - pw * 0.7], [pc[0] + pw, pc[1], pc[2] + pw * 0.7], [pc[0] - pw, pc[1], pc[2] + pw * 0.7]],
  ], M.stigma));
  return { arm, hand, K };
}

// A hind-blade (uses the same veined-wing builder at 3 cells; I3 seats/rakes the pair).
function buildOneBlade(M, len, chord) {
  const g = new THREE.Group();
  const { arm, hand, K } = buildVeinedWing(M, len, chord, 3);
  g.add(arm);
  const h = new THREE.Group(); h.position.set(K[0], K[1], K[2]);
  hand.position.set(-K[0], -K[1], -K[2]); h.add(hand); g.add(h);
  return g;
}

function buildGossamerDoubletWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spanScale = model.spanScale ?? 2.0;
  const foreLen = spanScale * 1.1;                 // half-span in world units
  const chord = model.forewingChord ?? 0.27;       // × wing length
  const hindScale = model.hindwingScale ?? 0.62;
  const cellN = Math.round(model.forewingCells ?? 5);
  M.wingMat = M.memTiers[3];   // the rig-driven membrane material (the lit cell tier)

  const pivots = {}, wingElements = [];
  const auxEntries = [];
  for (const side of [1, -1]) {
    // FORE pair — the wingParts cascade (pivot → mid → tip). Canonical +X. The whole outer
    // wing (veins + membrane + hem + pterostigma) rides `hand` on `tip`; the costa root
    // rides `arm` on `mid`; the wrist folds at the carpal node K (the −anchor law, rest
    // pose byte-identical).
    const rootC = attach.wingRoot(1);
    const pivot = new THREE.Group();
    pivot.position.set(rootC.x, rootC.y, rootC.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { arm, hand, K } = buildVeinedWing(M, foreLen, chord, cellN);
    mid.add(arm);
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);
    tip.add(hand);

    // HIND pair — a RIGID single-segment veined blade on a builder-internal pivot, seated
    // 0.28 body aft + one plate below + raked 12° flatter (so the four blades read as a
    // shallow X, all separate; fore/hind planform overlap ≤20%), published via auxWingPivots.
    const hindLen = foreLen * hindScale;
    const hindPivot = new THREE.Group();
    const hr = attach.hindWingRoot(1);
    hindPivot.position.set(hr.x, hr.y, hr.z);
    hindPivot.rotation.x = 0.24;   // 12° flatter rake + a touch of down-tilt so the hind reads BELOW the fore spoke
    if (hindScale > 0) hindPivot.add(buildOneBlade(M, hindLen, chord));

    // Mirror the LEFT: ONE outer lmirror wrapper parenting BOTH pivots (fore + hind).
    if (side === -1) {
      const lmirror = new THREE.Group(); lmirror.scale.x = -1;
      lmirror.add(pivot); lmirror.add(hindPivot); group.add(lmirror);
    } else { group.add(pivot); group.add(hindPivot); }

    const s = side === 1 ? 'R' : 'L';
    // Fore tip marker duplicates stilettoBlade() (module-level → the trail-detach bug is
    // impossible) and rides the FOLDING hand.
    const tipP = stilettoBlade(1, foreLen, chord);
    const marker = new THREE.Object3D();
    marker.position.set(tipP[0], tipP[1], tipP[2]);
    hand.add(marker);
    // Hind tip marker rides the rigid hind pivot (the blade tip in the pivot's local frame).
    const htipP = stilettoBlade(1, hindLen, chord);
    const hMarker = new THREE.Object3D();
    hMarker.position.set(htipP[0], htipP[1], htipP[2]);
    hindPivot.add(hMarker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    pivots['hindPivot' + s] = hindPivot; pivots['hindTipMarker' + s] = hMarker;
    wingElements.push({ root: [rootC.x, rootC.y, rootC.z], tip: [rootC.x + side * tipP[0], rootC.y + tipP[1], rootC.z + tipP[2]], length: foreLen, tipObj: marker });
    wingElements.push({ root: [hr.x * side, hr.y, hr.z], tip: [hr.x * side + side * htipP[0], hr.y + htipP[1], hr.z + htipP[2]], length: hindLen, tipObj: hMarker });
  }
  // THE HUM — the hind pair rides the same glide-hold waveform at a 0.35 beat-cycle
  // offset (radians: 0.35·2π ≈ 2.20) / 0.9× amplitude. Nullable + additive: null for
  // every shipped dragon → the rig writes nothing → roster byte-identical.
  if (hindScale > 0) {
    auxEntries.push({ pivotL: pivots.hindPivotL, pivotR: pivots.hindPivotR, phase: 0.35 * 2 * Math.PI, ampScale: 0.9 });
  }

  return {
    group, spineMats: [], flareMats: [M.stigma], wingMat: M.wingMat,   // pterostigma ×4 lights on f3/Surge (the only wing emissive)
    parts: { ...pivots, wingElements, auxWingPivots: auxEntries.length ? auxEntries : null },
  };
}
registerWings('gossamerDoubletWings', buildGossamerDoubletWings);

// ═══════════════════════════════════════════════════════════════════════════════
// HEAD — 'stilettoMaskHead' (I0 PLACEHOLDER): a draconic muzzle-wedge skull-mask read
// (no separate horns — the antennae ARE the horn slot). I0 roughs the wedge + venom-lit
// eyes + stub horn-gauge antennae; the brow ridge, mandible cheek-blades, and the
// compound-cut eye bevels land at I4.
// ═══════════════════════════════════════════════════════════════════════════════
function buildStilettoMaskHead(def, model, mats) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;
  const bm = bandMat(M);
  // Muzzle-wedge skull (~12 facets): occiput → brow → cheek → muzzle wedge, −Z.
  const skull = [
    { z: 0.30 * hs, rx: 0.24 * hs, ry: 0.26 * hs, cy: 0.02 },
    { z: -0.02 * hs, rx: 0.30 * hs, ry: 0.28 * hs, cy: 0.04 },   // brow (widest)
    { z: -0.38 * hs, rx: 0.22 * hs, ry: 0.20 * hs, cy: -0.02 },
    { z: -0.72 * hs, rx: 0.11 * hs, ry: 0.11 * hs, cy: -0.06 },
    { z: -0.92 * hs, rx: 0.05 * hs, ry: 0.05 * hs, cy: -0.08 },
  ];
  group.add(knapLoft(skull, CHITIN_PROFILE, bm, true));
  const headLength = 1.24 * hs;

  // Horn-gauge antennae (the horn slot) — 1 pair, base ≥0.12× head width, swept back
  // 30–40°, canted ±12°, tapering to ≤0.15× base. 2-face tents (I0 stub).
  const aLen = (model.antennaeLen ?? 1) * 0.6 * hs;
  const baseW = 0.10 * hs;   // ≥0.12× head width (~0.6)
  for (const side of [1, -1]) {
    const bx = side * 0.12 * hs, by = 0.22 * hs, bz = 0.20 * hs;
    const tip = [bx + side * 0.10 * hs, by + aLen * 0.7, bz + aLen];   // swept back + up
    const bL = [bx - side * baseW, by, bz], bR = [bx + side * baseW, by, bz];
    group.add(flatTriMesh([[bL, tip, bR], [bR, tip, [bx, by + 0.02, bz - baseW]]], M.chitinDorsal));
  }

  // Venom-lit almond eyes — bright facial points, but NOT the hero: the VENOM STILL owns the
  // glow hierarchy (the eyes are demoted from the I0 placeholder so they don't out-glow the
  // filling sacs — the real almond ladder + compound-cut bevels land at I4).
  const es = model.eyeScale ?? 1;
  eyeMat.emissiveIntensity = 0.45 + 0.55 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * hs * es, 0), eyeMat);
    eye.position.set(side * 0.17 * hs, 0.09 * hs, -0.14 * hs);
    eye.scale.set(1.5, 0.72, 1);
    eye.rotation.y = side * 0.26;
    group.add(eye);
  }
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, 0.16 * hs, 0.28 * hs); group.add(motifAnchor);
  return { group, spineMats: [], motifAnchor, headLength };
}
registerHead('stilettoMaskHead', buildStilettoMaskHead);

// ═══════════════════════════════════════════════════════════════════════════════
// TAIL — 'stingerLanceTail' (I0 PLACEHOLDER): the STILETTO — a thick needle loft + the
// venom drip bead. The gaster (torso) carries the mass; the tail slot builds the needle.
// I0 roughs a 5-sided pyramidal loft + the bead on the Vesper isBone 3-joint chain; the
// lancet barbs + the inset venom channel + the drip tick land at I4.
// ═══════════════════════════════════════════════════════════════════════════════
const NEEDLE_PROFILE = [
  [1.00, 0.00], [0.31, 0.95], [-0.81, 0.59], [-0.81, -0.59], [0.31, -0.95],   // 5-sided
];
function buildStingerLanceTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const a = anchor ?? { y: 0.13, z: 2.1 };
  const T = 1.55 * (model.tailStretch ?? 1);   // ~0.35 body beyond the gaster
  const baseR = 0.16;   // ≈0.5× gaster seg-4 radius
  const nSeg = 6;
  const stem = [];
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg;
    const r = baseR * (1 - 0.9 * t) + 0.016;   // taper toward 0.10× (the needle)
    stem.push({ z: a.z + t * T, rx: r, ry: r, cy: a.y - 0.05 * T * Math.sin(Math.PI * t * 0.7) });
  }

  // The Vesper isBone 3-joint nested chain — rotation-only; every piece binned to its
  // joint + position-compensated by −anchor so the assembled rest pose is byte-identical.
  const nChain = 3;
  const jIdx = (j) => Math.min(nSeg, Math.round(j * nSeg / nChain));
  const jAnchor = (j) => { const s = stem[jIdx(j)]; return { x: 0, y: s.cy, z: s.z }; };
  const joints = [];
  let parent = group, prev = { x: 0, y: 0, z: 0 };
  for (let j = 0; j < nChain; j++) { const an = jAnchor(j); const sg = new THREE.Group(); sg.name = 'stilettoTailPivot' + j; sg.position.set(an.x - prev.x, an.y - prev.y, an.z - prev.z); parent.add(sg); joints.push(sg); parent = sg; prev = an; }
  joints[0].isBone = true;
  const chainAdd = (z, mesh) => { let j = nChain - 1; for (; j >= 0; j--) if (z >= jAnchor(j).z - 1e-6) break; const an = jAnchor(Math.max(0, j)); mesh.position.set(-an.x, -an.y, -an.z); joints[Math.max(0, j)].add(mesh); return mesh; };
  for (let j = 0; j < nChain; j++) { const i0 = jIdx(j), i1 = jIdx(j + 1); if (i1 > i0) chainAdd(stem[i0].z, knapLoft(stem.slice(i0, i1 + 1), NEEDLE_PROFILE, M.chitinFlank, false)); }

  // THE DRIP BEAD — a small faceted octahedron at the needle tip (opaque emissive),
  // driven by the deterministic swell-and-cull cycle from f2 (the tick lands I4). Rides
  // the last chain joint so it whips with the tip.
  const tip = stem[nSeg];
  const dripStage = Math.round(model.dripStage ?? 0);
  let dripBead = null;
  if (dripStage >= 1) {
    dripBead = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), M.bead);
    dripBead.position.set(0, 0, 0.06);
    chainAdd(tip.z + 0.06, dripBead);
  }

  return { group, segs: joints, accentMats: [], flareMats: dripBead ? [M.bead] : [], parts: { dripBead } };
}
registerTail('stingerLanceTail', buildStingerLanceTail);
