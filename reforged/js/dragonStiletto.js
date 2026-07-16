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
  // Chitin lacquer tiers (value bands — dorsal a hair lighter, venter dark plum).
  const chitinDorsal = mk(lerpHex(body, VENTER, 0.34));
  const chitinFlank = mk(body);
  const venter = mk(def.belly ?? VENTER);
  // Oil-slick sheen — diffuse grazing-row tints ONLY (≤10% coverage), roughness 0.35
  // band (the "wet lacquer"); everything else 0.7 (the anti-Vesper gloss finish).
  const sheenViolet = mk(SHEEN_V, { roughness: 0.35 }); sheenViolet.envMapIntensity = 0.4;
  const sheenTeal = mk(SHEEN_T, { roughness: 0.35 }); sheenTeal.envMapIntensity = 0.4;
  // Wing membrane — single-layer translucent, 4 value tiers stepping ≥0.05 L
  // smoke-violet tip-ward → lit root; SHARED across all four wings (batching).
  const memTiers = [0.0, 0.34, 0.66, 1.0].map((f) => {
    const m = new THREE.MeshStandardMaterial({ color: lerpHex(0x2a1a38, 0x6a5a88, f), emissive: 0x000000, flatShading: true, roughness: 0.7, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.70 });
    m.envMapIntensity = 0.22; return m;
  });
  // Vein skeleton — opaque raised bones + a lighter rim-catch cap (the CP1 recipe).
  const veinMat = mk(lerpHex(body, VENTER, 0.5));
  const veinCap = mk(lerpHex(body, 0x6a5a88, 0.5));
  // Sac WALL — the ONLY body transparency: single-layer translucent hex panel.
  const sacWall = new THREE.MeshStandardMaterial({ color: lerpHex(body, ORCHID, 0.12), emissive: 0x000000, flatShading: true, roughness: 0.4, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.72 });
  sacWall.envMapIntensity = 0.3;
  // The FILL — opaque emissive liquid (the diegetic power meter). fillLine is the
  // brightest pixels on the gaster; fillBody the deep brew at depth. In flareMats.
  const fillLine = mk(FILL_LINE, { emissive: FILL_LINE, emissiveIntensity: 0.55 });
  fillLine.userData.baseEmissive = FILL_LINE; fillLine.userData.baseIntensity = 0.55;
  const fillBody = mk(FILL_BODY, { emissive: FILL_BODY, emissiveIntensity: 0.35 });
  fillBody.userData.baseEmissive = FILL_BODY; fillBody.userData.baseIntensity = 0.35;
  // Drip bead (f2+), stinger channel + pterostigma (f3) — dark until their form, then
  // venom-lit. Seam mats DoubleSide (the culled-ignition gotcha).
  const bead = mk(BEAD, { emissive: BEAD, emissiveIntensity: 0.6 });
  bead.userData.baseEmissive = BEAD; bead.userData.baseIntensity = 0.6;
  const channel = new THREE.MeshStandardMaterial({ color: lerpHex(body, ORCHID, 0.2), emissive: ORCHID, emissiveIntensity: 0.05, flatShading: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
  channel.userData.baseEmissive = ORCHID; channel.userData.baseIntensity = 0.05;
  const stigma = new THREE.MeshStandardMaterial({ color: lerpHex(body, ORCHID, 0.2), emissive: ORCHID, emissiveIntensity: 0.05, flatShading: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
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

// ═══════════════════════════════════════════════════════════════════════════════
// TORSO — 'chitinWaspTorso' (I0 PLACEHOLDER): the three-mass wasp aft (thorax →
// petiole/waist → gaster) + the draconic prow (short collared neck) roughed in as a
// value-banded loft. The forelimbs, the 5-plate thorax shingles, the hex sac windows,
// and the fills land at I1. Publishes the full attach contract (fore + hind wing roots),
// spinePoints (the locked side line-of-action), motifAnchor (gaster seg-2), coreGlow:null
// (the crash guard — the venom still must NEVER breathe with boost/Surge opacity, §4a).
// ═══════════════════════════════════════════════════════════════════════════════
function buildChitinWaspTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const bm = bandMat(M);
  const waistPinch = model.waistPinch ?? 0.34;
  const gasterSegs = Math.round(model.gasterSegments ?? 4);
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
  // THORAX (0.30) — the armored keel + shoulder cowls; the highest dorsal point.
  const thorax = [
    { z: -L * 0.30, rx: 0.40, ry: 0.42, cy: 0.20 },
    { z: -L * 0.18, rx: thoraxR, ry: 0.56, cy: 0.22 },   // proud crown (widest)
    { z: -L * 0.06, rx: 0.46, ry: 0.48, cy: 0.20 },
  ];
  group.add(knapLoft(thorax, CHITIN_PROFILE, bm, false));
  // PETIOLE / WASP-WAIST (0.08) — the signature concave break; painted mid-tier, never
  // shadow-black; the dorsal strake runs through it (I1). Floor 0.22× thorax radius.
  const wR = Math.max(0.22, waistPinch) * thoraxR;
  const petiole = [
    { z: -L * 0.06, rx: 0.40, ry: 0.42, cy: 0.20 },
    { z: 0.0, rx: wR, ry: wR * 1.05, cy: 0.18 },   // apex pinch
    { z: L * 0.06, rx: 0.44, ry: 0.42, cy: 0.16 },
  ];
  group.add(knapLoft(petiole, CHITIN_PROFILE, (k) => (k === 1 || k === 2 || k === 3) ? M.chitinFlank : M.chitinFlank, false));
  // GASTER (0.42) — telescoping armor rings (swell-then-taper), seg radii
  // ×[0.9,1.0,0.82,0.58] of thorax radius. Carries the sac windows (I1). Hangs low.
  const segR = [0.9, 1.0, 0.82, 0.58].slice(0, gasterSegs);
  const gStations = [{ z: L * 0.06, rx: 0.44, ry: 0.42, cy: 0.16 }];
  const gZ0 = L * 0.06, gZ1 = L * 0.48;
  for (let i = 0; i < segR.length; i++) {
    const t = (i + 1) / segR.length;
    gStations.push({ z: gZ0 + (gZ1 - gZ0) * t, rx: segR[i] * thoraxR, ry: segR[i] * thoraxR * 0.98, cy: 0.14 - 0.02 * t });
  }
  group.add(knapLoft(gStations, CHITIN_PROFILE, bm, true));

  // Oil-slick sheen band — a thin grazing-row strip on the dorsal crown plates.
  {
    const sT = [];
    for (let i = 0; i < thorax.length - 1; i++) {
      const a = thorax[i], b = thorax[i + 1], hw = 0.06;
      const AT = [0, a.cy + a.ry + 0.01, a.z], BT = [0, b.cy + b.ry + 0.01, b.z];
      sT.push([[AT[0] - hw, AT[1], AT[2]], [BT[0] + hw, BT[1], BT[2]], [BT[0] - hw, BT[1], BT[2]]],
              [[AT[0] - hw, AT[1], AT[2]], [AT[0] + hw, AT[1], AT[2]], [BT[0] + hw, BT[1], BT[2]]]);
    }
    group.add(flatTriMesh(sT, M.sheenViolet));
  }

  // Motif anchor — the venom still's fixed reference (gaster seg-2, never re-hues).
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.set(0, 0.14, gZ0 + (gZ1 - gZ0) * 0.4);
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
  // coreGlow MUST be null (the venom still never breathes with opacity — §4a; and the
  // null guards the dragon.js:1159 opacity hook against a null-deref crash).
  return { group, attach, spinePoints, spineMats: [], mats: { bodyMat: M.chitinFlank }, coreGlow: null };
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

// One blade placeholder (canonical +X): the leading costa + a flat translucent membrane
// panel cupping aft. Returns a Group. `cells` unused at I0 (vein fan lands I2).
function buildOneBlade(M, len, chord, tierMat) {
  const g = new THREE.Group();
  const N = 5;
  const LE = [], TE = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y, z] = stilettoBlade(t, len, chord);
    LE.push([x, y, z]);
    TE.push([x, y - 0.02 * len, z + chord * len * (0.4 + 0.6 * Math.sin(t * Math.PI))]);
  }
  const mem = [];
  for (let i = 0; i < N; i++) {
    mem.push([LE[i], TE[i], TE[i + 1]], [LE[i], TE[i + 1], LE[i + 1]]);
  }
  g.add(flatTriMesh(mem, tierMat));
  // Costa — a raised leading bone (a thin tent) so the blade isn't a 2-tri plane.
  const costa = [];
  for (let i = 0; i < N; i++) {
    const a = LE[i], b = LE[i + 1], up = 0.03 * len;
    costa.push([a, b, [a[0], a[1] + up, a[2]]], [[a[0], a[1] + up, a[2]], b, [b[0], b[1] + up, b[2]]]);
  }
  g.add(flatTriMesh(costa, M.veinMat));
  return g;
}

function buildGossamerDoubletWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const M = stilettoMats(def, model.glowLevel ?? 1, model.igniteStage);
  const spanScale = model.spanScale ?? 2.0;
  const foreLen = spanScale * 1.1;                 // half-span in world units
  const chord = model.forewingChord ?? 0.27;       // × wing length
  const hindScale = model.hindwingScale ?? 0.62;
  const foreTier = M.memTiers[3], hindTier = M.memTiers[2];
  M.wingMat = foreTier;

  const pivots = {}, wingElements = [];
  const auxEntries = [];
  for (const side of [1, -1]) {
    // FORE pair — the wingParts 3-seg cascade (pivot → mid → tip). Canonical +X.
    const rootC = attach.wingRoot(1);
    const pivot = new THREE.Group();
    pivot.position.set(rootC.x, rootC.y, rootC.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    // The wrist fold: split the blade at a carpal K (0.38 span node); the whole hand
    // (outer blade) rides tip at −K so the rest pose is byte-identical (the −anchor law).
    const K = stilettoBlade(0.38, foreLen, chord);
    mid.add(buildOneBlade(M, foreLen * 0.42, chord, foreTier));   // arm (inner)
    const hand = buildOneBlade(M, foreLen, chord, foreTier);      // hand (full blade)
    tip.position.set(K[0], K[1], K[2]);
    hand.position.set(-K[0], -K[1], -K[2]);
    tip.add(hand);

    // HIND pair — a RIGID single-segment blade on a builder-internal pivot, seated 0.28
    // body aft + one plate below + raked 12° flatter, published via auxWingPivots.
    const hindPivot = new THREE.Group();
    const hr = attach.hindWingRoot(1);
    hindPivot.position.set(hr.x, hr.y, hr.z);
    hindPivot.rotation.x = 0.21;   // 12° flatter rake
    if (hindScale > 0) hindPivot.add(buildOneBlade(M, foreLen * hindScale, chord, hindTier));

    // Mirror the LEFT: ONE outer lmirror wrapper parenting BOTH pivots (fore + hind).
    if (side === -1) {
      const lmirror = new THREE.Group(); lmirror.scale.x = -1;
      lmirror.add(pivot); lmirror.add(hindPivot); group.add(lmirror);
    } else { group.add(pivot); group.add(hindPivot); }

    const s = side === 1 ? 'R' : 'L';
    // Tip marker duplicates stilettoBlade() (module-level → the trail-detach bug is
    // impossible) and rides the FOLDING hand.
    const tipP = stilettoBlade(1, foreLen, chord);
    const marker = new THREE.Object3D();
    marker.position.set(tipP[0], tipP[1], tipP[2]);
    hand.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    pivots['hindPivot' + s] = hindPivot;
    wingElements.push({ root: [rootC.x, rootC.y, rootC.z], tip: [rootC.x + side * tipP[0], rootC.y + tipP[1], rootC.z + tipP[2]], length: foreLen, tipObj: marker });
  }
  // THE HUM — the hind pair rides the same glide-hold waveform at a 0.35 beat-cycle
  // offset (radians: 0.35·2π ≈ 2.20) / 0.9× amplitude. Nullable + additive: null for
  // every shipped dragon → the rig writes nothing → roster byte-identical.
  if (hindScale > 0) {
    auxEntries.push({ pivotL: pivots.hindPivotL, pivotR: pivots.hindPivotR, phase: 0.35 * 2 * Math.PI, ampScale: 0.9 });
  }

  return {
    group, spineMats: [], flareMats: [], wingMat: M.wingMat,
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

  // Venom-lit almond eyes — the brightest facial points. Octahedron cores; intensity
  // grows as the eye narrows up the ladder (light growing is the grind reward).
  const es = model.eyeScale ?? 1;
  eyeMat.emissiveIntensity = 0.7 + 1.7 * (model.glowLevel ?? 1);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.15 * hs * es, 0), eyeMat);
    eye.position.set(side * 0.18 * hs, 0.09 * hs, -0.14 * hs);
    eye.scale.set(1.4, 0.9, 1);
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
