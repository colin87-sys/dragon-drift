import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PHOENIX — "The Dawnfire Empress" (Firebird of Rebirth). FRESH premium apex
// (PHOENIX-DAWNFIRE-BUILDSHEET.md) — the deliberate OPPOSITE of Solar on every axis.
// Four self-registering parts, DEFAULT-OFF (only phoenixEmpress.parts opts in):
//   pyreHeartTorso · scythePinionWings · cometCrestHead · pyreTrainTail.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
// SIGNATURE = the PYRE-TRAIN: a wide fanned train of ember-eyed quills in the LOWER-
// REAR of the frame (empress's robe), thin rising scythe wings above (not an M).
// LIGHTING = "a coal, not a torch": dark-garnet matte body; fire only on edges/tips/
// gems in three separated warm hues; exactly one tiny near-white (the Dawn Coal, f3).
// Copies only the sovereignMats STRUCTURE (per-stage emissive ladders + surge userData)
// — every hue, count, slot and shape is authored fresh. NEVER Solar's ring/arch/violet.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;
// The three warm emissive stations (~25–35° apart so the structures stay distinct),
// one accent metal, one near-white. Fire lives ONLY here — the body diffuse stays dark.
const CRIMSON = 0xe0173a;   // pinion fire (rose-crimson)
const EMBER   = 0xd9541a;   // keel-seam + vane mid
const AMBER   = 0xd98a12;   // coal-eyes + gorget + eyes
const ROSE    = 0xe83a6a;   // crest + feather-edge kiss (f2+)
const COPPER  = 0x8a4a22;   // burnished copper / rose-gold — beak, talons, shafts, bezels
const DAWNCOAL = 0xffe9c4;  // the ONE near-white — center coal-eye, f3 only
const UMBER   = 0x3a2114;   // belly, one tier warmer than the garnet body
const PALEGOLD = 0xe8c58a;  // f3 belly nod to the retired "white-gold divine" firebird

// The IGNITION RAMP is the growth currency: `igniteStage` 0→3 gates WHICH emissives
// are lit and how bright, driven through this stage-aware factory (the sovereignMats
// structure, re-authored for warm hues). Each hue is saturated + bloom-safe (sat≥0.75,
// value≤0.9) so it blooms IN ITS OWN COLOUR under ACES + UnrealBloom — never additive
// washout. `glow` (glowLevel) multiplies every emissive for adaptive-tier friendliness.
function empressMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));
  const g = glow ?? 1;
  // Per-stage intensity ladders (surge tick multiplies baseIntensity; g scales the floor).
  const keelI  = [0.10, 0.35, 0.65, 1.05][st] * g;  // dorsal molten keel-seam (faint→molten)
  const pinI   = [0, 0.55, 1.15, 1.75][st] * g;     // pinion crimson fire (first at f1)
  const vaneI  = [0, 0.55, 1.05, 1.65][st] * g;     // train-quill vane edge gradient
  const coalI  = [0, 0.70, 1.25, 2.05][st] * g;     // coal-eye gems (mesh withheld at f0)
  const gorgetI = [0, 0, 1.35, 2.10][st] * g;       // heart-fire gorget (conferred at f2)
  const crestI = [0, 0.55, 1.00, 1.60][st] * g;     // comet-crest coal tips

  // BODY — dark garnet matte, always present (stage-independent). A lifted garnet
  // emissive floor keeps her faceted-garnet, not void-black, on a dark sky. DoubleSide
  // guards the open-ended neck loft + stray fairing tris (no hollow read).
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x241012, emissive: 0x1a0a0a, emissiveIntensity: 0.10, flatShading: true, roughness: 0.72, metalness: 0.10, side: THREE.DoubleSide });
  // Belly one tier warmer (umber); the APEX belly gets the pale-gold underlight nod
  // (belly-only, downward-facing — warms the underside a believer catches on a bank
  // without ever lightening the dorsal read the chase cam sees).
  const bellyCol = st >= 3 ? (def.bellyGold ?? PALEGOLD) : (def.belly ?? UMBER);
  const belly = new THREE.MeshStandardMaterial({ color: bellyCol, emissive: st >= 3 ? 0x2a1408 : 0x160a06, emissiveIntensity: st >= 3 ? 0.16 : 0.06, flatShading: true, roughness: 0.7, metalness: 0.08, side: THREE.DoubleSide });
  // Burnished copper accent (forged tier, never emissive) — beak, talons, shafts, bezels.
  const copper = new THREE.MeshStandardMaterial({ color: def.copper ?? COPPER, flatShading: true, roughness: 0.4, metalness: 0.55, emissive: 0x3a1c0a, emissiveIntensity: 0.18 });

  // Wing COVERT sheet (dark root) — ZERO emissive, so the fire on the primaries reads.
  const covert = new THREE.MeshStandardMaterial({ color: def.covert ?? 0x2a1013, flatShading: true, roughness: 0.82, metalness: 0.06, side: THREE.DoubleSide });

  // Helper: a surge-registered emissive material (baseEmissive/baseIntensity so the
  // Rebirth Surge tick lerps the correct hue toward feverWing and boosts intensity).
  const surgeMat = (col, emis, inten, rough) => { const m = new THREE.MeshStandardMaterial({ color: col, emissive: emis, emissiveIntensity: inten, flatShading: true, roughness: rough ?? 0.5, metalness: 0.1, side: THREE.DoubleSide }); m.userData.baseEmissive = emis; m.userData.baseIntensity = inten; return m; };

  // PINION FIRE — deep CRIMSON (blood-red, not pink) so the wing hue stays its own station,
  // distinct from the rose crest and the amber coals. Dark-root → crimson-tip, emissive only
  // toward the tips. IN spineMats (flare on Surge). Rose is reserved for the CREST alone.
  const PINION_CRIMSON = 0xcc1024;
  const pinionRoot = surgeMat(0x30111a, 0x50101c, pinI * 0.22, 0.72);
  const pinionTip  = surgeMat(0x5e1420, PINION_CRIMSON, pinI, 0.5);
  const pinionEdge = surgeMat(0x6a1626, PINION_CRIMSON, pinI * 0.55, 0.46);

  // TRAIN-QUILL vane — "a COAL, not a torch": the blade DIFFUSE is near-dark ash-maroon; the
  // fire lives on a thin crimson→amber EDGE gradient tracing the rim (lower ember-crimson →
  // upper amber toward the coal-eye), NOT the whole face. Edge mats IN accentMats (flare on
  // Surge); the dark blade holds. The bright element is the coal-eye gem at the tip.
  const vaneDark   = surgeMat(0x241012, 0x260c08, vaneI * 0.10 + 0.05, 0.74);   // near-dark blade
  const vaneEdgeLo = surgeMat(0x3a1218, EMBER, vaneI * 1.05, 0.5);              // lower rim ember-crimson
  const vaneEdgeHi = surgeMat(0x4a2810, AMBER, vaneI * 1.15, 0.46);            // upper rim amber (toward the coal)

  // DORSAL keel-seam (thin ember groove) + heart-fire GORGET (amber breast chevron,
  // withheld until f2). Both IN spineMats (torso) → flare on Surge.
  const keelSeam = surgeMat(0x3a1810, EMBER, keelI, 0.55);
  const gorget = surgeMat(0x5a3410, AMBER, gorgetI, 0.4);

  // COMET-CREST blade emissive (rose) — IN spineMats (head).
  const crestGlow = surgeMat(0x5a1830, ROSE, crestI, 0.5);

  // COAL-EYE gem — amber-gold emissive, the BRIGHTEST point of the train (the constellation
  // that owns the lower frame). Stays OUT of every surge array (holds its own hue — the
  // constellation must not blow to gold-white on Rebirth). A thin dark bezel frames it.
  const coalEye = new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa81e, emissiveIntensity: coalI * 1.5, flatShading: true, roughness: 0.26, metalness: 0.15 });
  const coalBezel = new THREE.MeshStandardMaterial({ color: def.covert ?? 0x2a1013, emissive: 0x2a0e06, emissiveIntensity: 0.2, flatShading: true, roughness: 0.7, metalness: 0.2 });
  // The Dawn Coal — the ONE near-white, f3-only, tiny. OUT of all surge arrays.
  const dawnCoal = new THREE.MeshStandardMaterial({ color: DAWNCOAL, emissive: 0xffdca0, emissiveIntensity: st >= 3 ? 2.4 * g : 0, flatShading: true, roughness: 0.24 });

  // Eyes — amber-gold almond, emissive, the only lit facial point (no brow gem).
  const eyeMat = new THREE.MeshStandardMaterial({ color: def.eye ?? 0xffcf6a, emissive: 0xc07a1a, emissiveIntensity: 1.5, flatShading: true, roughness: 0.3, metalness: 0.2 });
  eyeMat.userData.baseEmissive = 0xc07a1a; eyeMat.userData.baseIntensity = 1.5;

  return { bodyFlat, belly, copper, covert, pinionRoot, pinionTip, pinionEdge, vaneDark, vaneEdgeLo, vaneEdgeHi, keelSeam, gorget, crestGlow, coalEye, coalBezel, dawnCoal, eyeMat, stage: st };
}

// ── shared plumbing (look-neutral; copied construction, not appearance) ─────────
// Faceted loft: rings [{z, rx, ry, cy, cx?}] → one flat-shaded tube. Winds OUTWARD
// (normals away from the centerline) so flat facets light from outside, no hollow read.
function loftRings(rings, mat, N = 8, cap = true) {
  const P = (r, t) => [(r.cx ?? 0) + Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      tris.push([P(a, t0), P(b, t1), P(b, t0)], [P(a, t0), P(a, t1), P(b, t1)]);
    }
  }
  if (cap) {
    const f = rings[0], l = rings[rings.length - 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      tris.push([[(f.cx ?? 0), f.cy, f.z], P(f, t1), P(f, t0)], [[(l.cx ?? 0), l.cy, l.z], P(l, t0), P(l, t1)]);
    }
  }
  return flatTriMesh(tris, mat);
}
// Tapered facet cone, base at origin growing +Y (beak wedge, shafts, crest quills).
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);
  return g;
}
// Thin cylinder spanning a→b (copper shafts, keel-seam segments).
function bar(a, b, r, mat) {
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg(4)), mat);
  m.geometry.translate(0, len / 2, 0);
  m.position.set(a[0], a[1], a[2]);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// SCYTHE WING PROFILE (the anti-M signature): a single continuous RISING RAKE whose
// max height is at the far OUTBOARD tip — the mathematically OPPOSITE curve family to
// Solar's interior-peak arch. Vertex-BAKED (survives the flap animator overwriting the
// pivot rotation). MUST be shared by the wing geometry AND the FX marker / wingElements
// tip (documented gotcha: change it in both or the wingtip trails detach).
function scytheY(t, halfSpan, tipRise) {
  return halfSpan * (0.06 + 0.42 * tipRise * Math.pow(t, 1.5));   // monotonic from root, terminal peak
}
function scytheZ(t, halfSpan, rake) {
  return -0.15 + halfSpan * 0.42 * rake * t;                       // swept back 40–45° as it goes out
}

// ── TORSO: 'pyreHeartTorso' ─────────────────────────────────────────────────────
// The anti-wyrm: a COMPACT avian breast-keel (mass forward + LOW, a falcon's chest),
// short proud swan-curve neck, body long axis LEVEL. Regalia = the heart-fire gorget
// (withheld to f2) + a dorsal molten keel-seam. Belly one tier warmer; f3 pale-gold nod.
function buildPyreHeartTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = empressMats(def, glow, model.igniteStage);
  const spineMats = [M.keelSeam];    // keel-seam flares with Surge; coal-eyes stay out
  const sw = model.shoulderWidthScale ?? 1;

  // COMPACT breast-keel body: deep falcon chest (belly drops LOW + forward), shoulder
  // yoke widest, quick taper to a short tail root. Long axis LEVEL (no reared body).
  const body = [
    { z: -1.34, rx: 0.24 * sw, ry: 0.28, cy: 0.16 },   // chest prow (forward, low)
    { z: -0.92, rx: 0.50 * sw, ry: 0.64, cy: 0.00 },   // DEEP breast keel (falcon chest, belly drops)
    { z: -0.40, rx: 0.56 * sw, ry: 0.52, cy: 0.14 },   // shoulder / wing yoke (widest)
    { z:  0.16, rx: 0.42, ry: 0.40, cy: 0.20 },        // waist
    { z:  0.64, rx: 0.26, ry: 0.26, cy: 0.18 },        // hip
    { z:  1.02, rx: 0.13, ry: 0.13, cy: 0.16 },        // tail root
  ];
  group.add(loftRings(body, M.bodyFlat, seg(9)));

  // Short proud SWAN-curve neck (2–3 segments) — arcs UP, head carried slightly high
  // (the empress bearing), never a droop.
  const neck = [
    { z: -1.26, rx: 0.24, ry: 0.28, cy: 0.20 },
    { z: -1.58, rx: 0.19, ry: 0.21, cy: 0.36 },
    { z: -1.86, rx: 0.145, ry: 0.155, cy: 0.50 },
  ];
  group.add(loftRings(neck, M.bodyFlat, seg(8), false));

  // BELLY underlight panel — a downward-facing ventral chevron along the keel. Umber at
  // lower forms; the APEX (M.stage≥3) build gives it the pale-gold nod (belly-only).
  for (const s of [1, -1]) {
    const bt = [
      [[s * 0.02, -0.42, -1.0], [s * 0.30, -0.30, -0.5], [s * 0.05, -0.10, -0.4]],
      [[s * 0.05, -0.10, -0.4], [s * 0.30, -0.30, -0.5], [s * 0.28, -0.14, 0.2]],
      [[s * 0.05, -0.10, -0.4], [s * 0.28, -0.14, 0.2], [s * 0.06, 0.02, 0.35]],
    ].map((tri) => tri.map((p) => [p[0], TORSO_Y + p[1], p[2]]));
    group.add(flatTriMesh(bt, M.belly));
  }

  // DORSAL molten KEEL-SEAM: a thin ember emissive groove down the back ridge between the
  // crest and the train (stage-gated via keelSeam intensity), so the body stays anchored
  // between light-structures 1 (train) and 3 (crest) — no dead-black center void.
  const dorsalTop = (z) => TORSO_Y + 0.30 + 0.16 * Math.max(0, 1 - Math.abs(z + 0.4) / 1.9);
  const seamPts = [-1.1, -0.6, -0.1, 0.4, 0.9];
  for (let i = 0; i < seamPts.length - 1; i++) {
    const z0 = seamPts[i], z1 = seamPts[i + 1];
    group.add(bar([0, dorsalTop(z0), z0], [0, dorsalTop(z1), z1], 0.028, M.keelSeam));
  }

  // HEART-FIRE GORGET (withheld to f2 via model.gorget) — a saturated gold 3-facet
  // emissive seam-chevron molded into the breast keel (the dark-body + thin-saturated-rim
  // TECHNIQUE spent on a GORGET, not a ring). Copper bezel behind, gold seam in front.
  const gorgetOn = (model.gorget ?? 0) > 0;
  const gPos = new THREE.Vector3(0, TORSO_Y - 0.40, -0.94);   // deep on the breast keel, forward
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(gPos);
  group.add(motifAnchor);
  if (gorgetOn) {
    const gg = new THREE.Group();
    const bloom = model.gorget ?? 1;   // 0.6 (conferred) → 1 (blazing)
    // 3 nested downward CHEVRON seams (thin V strokes, not a filled plate) molded into the
    // breast keel — the dark-body + thin-saturated-rim technique spent on a GORGET, not a ring.
    const w = 0.15 + 0.04 * bloom, drop = 0.09 + 0.03 * bloom;
    // copper bezel backing (one small facet behind the seams — frames, never out-shines)
    gg.add(flatTriMesh([[[-w * 1.2, 0.03, -0.01], [0, -drop * 2.3, -0.01], [w * 1.2, 0.03, -0.01]]], M.copper));
    for (let k = 0; k < 3; k++) {
      const yy = -k * drop * 0.72, ww = w * (1 - k * 0.24);
      // a thin V = two slim gold bars meeting at the point (a seam-chevron, reads as a stroke)
      gg.add(bar([-ww, yy, 0.02], [0, yy - drop, 0.05], 0.018, M.gorget));
      gg.add(bar([ww, yy, 0.02], [0, yy - drop, 0.05], 0.018, M.gorget));
    }
    gg.position.copy(gPos);
    gg.rotation.x = -0.55;   // face DOWN-and-forward (the underside a believer catches on a bank)
    group.add(gg);
    spineMats.push(M.gorget);
  }

  // Shoulder fairings — body-flat fillets from each wing root inboard to the neck base,
  // so no background survives between neck, shoulder and wing roots in the rear read.
  for (const s of [1, -1]) {
    group.add(flatTriMesh([[[s * 0.5, TORSO_Y + 0.30, -0.55], [s * 0.10, TORSO_Y + 0.28, -1.15], [s * 0.46, TORSO_Y + 0.16, -0.30]]], M.bodyFlat));
  }

  // Line-of-action: head high → neck down → LEVEL body → tail root (the train lifts, not
  // the body). ≥1 inflection for the §7 assert.
  const spinePoints = [
    new THREE.Vector3(0, 0.70, -1.86), new THREE.Vector3(0, 0.40, -1.2),
    new THREE.Vector3(0, 0.34, -0.4), new THREE.Vector3(0, 0.36, 0.4),
    new THREE.Vector3(0, 0.30, 1.02),
  ];

  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.52 * sw) * side, y: TORSO_Y + 0.30 + (wro.y ?? 0), z: -0.42 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.52, z: -1.96 },
    tailAnchor: { y: 0.16, z: 1.00 },
    keelTopAt: (z) => TORSO_Y + 0.46 * Math.max(0, 1 - Math.abs(z + 0.5) / 2.0),
    halfWidthAt: (z) => 0.58 * Math.max(0.2, 1 - Math.abs(z + 0.3) / 2.4),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.66, z: -0.2 },
    motifAnchor,
  };
  // coreGlow MUST be a mesh/null (never a colour number) — the orchestrator builds the
  // real back-glow sprite only when this is falsy; a number crashes on .userData.base.
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.bodyFlat, eyeMat: M.eyeMat }, coreGlow: null };
}
registerTorso('pyreHeartTorso', buildPyreHeartTorso);

// ── WINGS: 'scythePinionWings' ───────────────────────────────────────────────────
// The falcata crescent: high-aspect (long span, narrow chord) feathered scythe. One dark
// covert sheet (inner third) + discrete blade primaries (outer two-thirds) that separate
// toward the tip with true negative-space pinion slots, each carrying a dark-root →
// crimson-tip gradient. Vertical profile = a single continuous RISING RAKE, terminal peak.
function buildOneScytheWing(M, dials) {
  const wg = new THREE.Group();
  const { halfSpan, rake, tipRise, primaries, pinionSlots, rootChord, tipChord } = dials;
  const L = (t) => [t * halfSpan, scytheY(t, halfSpan, tipRise), scytheZ(t, halfSpan, rake)];
  const chord = (t) => rootChord * (1 - t) + tipChord * t;   // narrow, tapering to a point
  const tCov = 0.34;   // covert sheet spans the inner third

  // DARK COVERT SHEET — a single flat fan of large facets, ash-maroon, ZERO emissive: the
  // dark root that makes the pinion fire read. Between the leading edge and a trailing line.
  const cN = seg(4);
  const covLead = (t) => L(t);
  const covTrail = (t) => { const l = L(t), c = chord(t); return [l[0], l[1] - 0.04 * c, l[2] + c]; };
  for (let i = 0; i < cN; i++) {
    const t0 = (i / cN) * tCov, t1 = ((i + 1) / cN) * tCov;
    const a = covLead(t0), b = covLead(t1), at = covTrail(t0), bt = covTrail(t1);
    wg.add(flatTriMesh([[a, b, bt], [a, bt, at]], M.covert));
  }

  // BLADE PRIMARIES — discrete z-staggered feathers off the outer two-thirds. Each = a
  // 2-segment tapered vane (root tier near-dark → tip tier crimson: the fire lives on the
  // tips). The outer `pinionSlots` feathers separate with negative-space gaps (narrowed
  // bases). The last primary curls slightly inward (flame-lick tip).
  const nP = Math.max(1, Math.round(primaries));
  const wingEls = [];
  for (let k = 0; k < nP; k++) {
    const t0 = tCov + (1 - tCov) * (k / nP);
    const t1 = tCov + (1 - tCov) * ((k + 1) / nP);
    const outer = k / (nP - 1 || 1);
    const a = L(t0), b = L(t1);
    const c = chord((t0 + t1) / 2);
    // slot: the outer pinionSlots feathers pull their base narrower → a see-through gap.
    const slotted = pinionSlots > 0 && k >= nP - pinionSlots;
    const gap = slotted ? 0.32 : 0.0;
    const ba = [a[0] + (b[0] - a[0]) * (gap * 0.5), a[1] + (b[1] - a[1]) * (gap * 0.5), a[2] + (b[2] - a[2]) * (gap * 0.5)];
    const bb = [a[0] + (b[0] - a[0]) * (1 - gap * 0.5), a[1] + (b[1] - a[1]) * (1 - gap * 0.5), a[2] + (b[2] - a[2]) * (1 - gap * 0.5)];
    const mid = [(ba[0] + bb[0]) / 2, (ba[1] + bb[1]) / 2, (ba[2] + bb[2]) / 2];
    // primaries project aft — but STUBBY at low rake (f0) so the whelp reads a rounded
    // ash-chick, not pre-conferred flame serrations; they extend into full pinions as rake climbs.
    const featherLen = c * (1.05 + 0.55 * outer) * (0.5 + 0.5 * tipRise);
    const curl = (k === nP - 1) ? -0.10 * featherLen : 0;   // inward flame-lick on the last
    const drop = -0.10 * featherLen;
    // split point (60% out) between the dark root tier and the crimson tip tier
    const sfx = mid[0] + curl * 0.5, sfy = mid[1] + drop * 0.6, sfz = mid[2] + featherLen * 0.6;
    const tfx = mid[0] + curl, tfy = mid[1] + drop, tfz = mid[2] + featherLen;
    const splitP = [sfx, sfy, sfz], tipP = [tfx, tfy, tfz];
    // root tier (dark) — base pair to split point
    wg.add(flatTriMesh([[ba, bb, splitP]], M.pinionRoot));
    // tip tier (crimson) — split to the point; rose feather-edge kiss on the trailing side
    wg.add(flatTriMesh([[ba, splitP, tipP]], M.pinionTip));
    wg.add(flatTriMesh([[splitP, bb, tipP]], M.pinionEdge));
    wingEls.push({ station: (t0 + t1) / 2, tip: tipP, length: featherLen });
  }

  // Gold-copper armored LEADING SPAR (thick root → thin tip) tracing the rising rake —
  // the bright crescent edge the rear-chase silhouette reads.
  const sN = 4;
  for (let i = 0; i < sN; i++) {
    const a = L(i / sN), b = L((i + 1) / sN);
    wg.add(bar(a, b, 0.05 * (1 - i / sN) + 0.02, M.copper));
  }
  return { wg, wingEls };
}

function buildScythePinionWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = empressMats(def, glow, model.igniteStage);
  const halfSpan = (model.spanScale ?? 1) * 3.6;
  const rake = model.sweepRake ?? 1;
  const tipRise = model.tipRise ?? 1;
  const primaries = Math.round(model.primaries ?? 7);
  const pinionSlots = Math.round(model.pinionSlots ?? 3);
  const dials = { halfSpan, rake, tipRise, primaries, pinionSlots, rootChord: model.rootChord ?? 1.5, tipChord: model.tipChord ?? 0.28 };

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    // pivot → mid → tip (the flap rig drives all three; publishing them is MANDATORY or
    // the direct-flap path null-derefs). Geometry is canonical +X; left = scale.x=-1 mirror
    // so the animator's mirrored poses read symmetric (wingsymprobe PASS).
    const pivot = new THREE.Group(); pivot.position.set(root.x, root.y, root.z); pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    const { wg } = buildOneScytheWing(M, dials);
    mid.add(wg);
    if (side === -1) pivot.scale.x = -1;
    group.add(pivot);
    const s = side === 1 ? 'R' : 'L';
    // FX marker at the real outer tip (canonical +X; scale.x=-1 mirrors it for the left) —
    // parented to `mid` so it rides the flap. MUST use the same scytheY/scytheZ profile as
    // the geometry, or the wingtip trails + aero-shear detach from the raised tip.
    const tipY = scytheY(1, halfSpan, tipRise), tipZ = scytheZ(1, halfSpan, rake);
    const marker = new THREE.Object3D();
    marker.position.set(halfSpan, tipY, tipZ);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + tipZ], length: halfSpan, tipObj: marker });
  }
  // wingMat (rig-animated: its emissive is set to def.wingEmissive per frame, feverWing on
  // Surge) = the crimson pinion tier so all pinion fire pulses together on Rebirth.
  return { group, spineMats: [M.pinionRoot, M.pinionTip, M.pinionEdge], wingMat: M.pinionTip, parts: { ...pivots, wingElements } };
}
registerWings('scythePinionWings', buildScythePinionWings);

// ── HEAD: 'cometCrestHead' ───────────────────────────────────────────────────────
// Small sleek falcon-swan head (the face is 0% of play — spend nothing beyond a clean
// beak wedge + almond eye). NO horns, NO brow gem. Regalia = the COMET CREST: 1→3→5
// back-swept streaming crest quills, each coal-tipped — a rear-readable upper echo of
// the train (her own answer to "the face is away from the cam").
function buildCometCrestHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = empressMats(def, glow, model.igniteStage);
  const spineMats = [];
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat || M.eyeMat;

  // Sleek falcon skull → a short tapering muzzle base (the beak proper is copper, below).
  const skull = [
    { z: 0.30, rx: 0.24 * hs, ry: 0.26 * hs, cy: 0.03 },
    { z: 0.00, rx: 0.26 * hs, ry: 0.25 * hs, cy: 0.04 },
    { z: -0.34, rx: 0.20 * hs, ry: 0.18 * hs, cy: 0.00 },
    { z: -0.60, rx: 0.12 * hs, ry: 0.11 * hs, cy: -0.04 },
  ];
  group.add(loftRings(skull, M.bodyFlat, seg(7)));
  const headLength = 1.35 * hs;

  // Short raptor BEAK wedge — burnished copper, pointing −Z (a clean wedge, no ornament).
  const beak = spike(0.42 * hs, 0.13 * hs, 0.015, M.copper, 5);
  beak.position.set(0, -0.02 * hs, -0.58 * hs);
  beak.rotation.x = -Math.PI / 2;   // point forward (−Z)
  group.add(beak);
  // A slim lower mandible line so the beak reads as a raptor bill, not a cone.
  const jaw = spike(0.30 * hs, 0.08 * hs, 0.012, M.copper, 4);
  jaw.position.set(0, -0.10 * hs, -0.52 * hs);
  jaw.rotation.x = -Math.PI / 2 + 0.16;
  group.add(jaw);

  // Eyes — amber-gold almond, emissive; eyeShape ladders 34% round (chick) → 16% almond.
  const shape = model.eyeShape ?? 1;
  const eScale = 0.12 * hs * (0.9 + 0.4 * (1 - shape));   // rounder+bigger young, keener apex
  spineMats.push(eyeMat);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(eScale, 0), eyeMat);
    eye.position.set(side * 0.20 * hs, 0.06 * hs, -0.20 * hs);
    // almond as shape→0: wider + flatter; rounder as shape→1
    eye.scale.set(1.2 + (1 - shape) * 0.9, 0.62 + shape * 0.5, 1);
    group.add(eye);
  }

  // COMET CREST — back-swept streaming crest quills off the crown (1→3→5 per form), each a
  // 2–3-tri copper blade with a small coal-eye tip (the upper echo of the train motif). The
  // crest is the head's motif; it publishes the anchor + blooms with the count.
  const nCrest = Math.round(model.crestQuills ?? 5);
  const crestPos = new THREE.Vector3(0, 0.24 * hs, 0.20);   // crown, back of skull
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.copy(crestPos); group.add(motifAnchor);
  if (nCrest > 0) spineMats.push(M.crestGlow);
  for (let k = 0; k < nCrest; k++) {
    const cen = (nCrest - 1) / 2;
    const off = nCrest > 1 ? (k - cen) / (cen || 1) : 0;   // −1..1 across the crest
    const clen = (0.46 + 0.16 * (1 - Math.abs(off))) * hs;  // center quill longest (streams rearward)
    const q = new THREE.Group();
    q.position.set(crestPos.x + off * 0.14 * hs, crestPos.y, crestPos.z);
    q.rotation.x = 1.15;                     // rake back over the nape (streams rearward)
    q.rotation.z = -off * 0.42;              // splay outward
    // copper shaft
    const shaft = spike(clen, 0.028 * hs, 0.006, M.copper, 4); q.add(shaft);
    // rose emissive vane along the shaft (the crest fire)
    const vt = [[[-0.05 * hs, clen * 0.3, 0], [0.05 * hs, clen * 0.3, 0], [0, clen * 0.92, 0.01]]];
    q.add(flatTriMesh(vt, M.crestGlow));
    // small coal-eye tip (amber-gold on dark bezel; OUT of surge arrays)
    if ((model.coalBloom ?? 1) > 0) {
      const coal = new THREE.Mesh(new THREE.OctahedronGeometry(0.045 * hs, 0), M.coalEye);
      coal.position.set(0, clen, 0);
      q.add(coal);
    }
    group.add(q);
  }
  return { group, spineMats, motifAnchor, headLength };
}
registerHead('cometCrestHead', buildCometCrestHead);

// Pure fan layout — SHARED by the tail builder and tests/starters.mjs so the not-a-ring
// asserts (sector < 180°, quill gap ≥ 1 quill-width, cant-balance Σ≈0) read the SAME
// numbers the geometry is built from. Returns per-quill { phi, cant, len, mirror } in a
// downward-and-outward sector, built as mirrored pairs so cant-balance is Σ=0 by design.
export function trainFanLayout(model) {
  const nRaw = Math.max(1, Math.round(model.trainQuills ?? 9));
  const fanDeg = Math.min(model.trainFan ?? 150, 175);       // hard-capped < 180°
  const half = (fanDeg / 2) * Math.PI / 180;
  const odd = nRaw % 2 === 1;
  const pairs = Math.floor(nRaw / 2);
  const quills = [];
  // center quill (odd counts): straight down, no cant, longest
  if (odd) quills.push({ phi: 0, cant: 0, lenScale: 1, mirror: 0 });
  for (let p = 1; p <= pairs; p++) {
    const frac = pairs > 0 ? p / pairs : 0;
    const phi = half * (odd ? (p / pairs) : ((p - 0.5) / pairs));   // roll from center (0=down)
    const cant = (p % 2 === 1 ? 1 : -1) * (8 * Math.PI / 180);      // alternating ±8° per pair
    const lenScale = Math.pow(0.85, odd ? p : p - 0.5);             // swell-then-taper outward
    quills.push({ phi: +phi, cant: +cant, lenScale, mirror: +1 });  // right
    quills.push({ phi: -phi, cant: -cant, lenScale, mirror: -1 });  // left = mirror → Σ cant = 0
  }
  // angular gap between adjacent quills vs a quill's angular "width" (the not-a-ring assert)
  const angs = quills.map((q) => q.phi).sort((a, b) => a - b);
  let minGap = Infinity;
  for (let i = 1; i < angs.length; i++) minGap = Math.min(minGap, angs[i] - angs[i - 1]);
  return { quills, fanDeg, minGapRad: minGap === Infinity ? half : minGap, nQuills: quills.length };
}

// ── TAIL: 'pyreTrainTail' — THE HERO ─────────────────────────────────────────────
// Short structural tail root → the TRAIN: 2/4/6/9 quills fanned in a downward-aft sector
// (≤150°, hard <180°). Each quill = a copper shaft + a teardrop vane (crimson→amber edge
// gradient) + a faceted coal-eye at the tip (the gem-cluster ARC — the dark-body-bright-rim
// technique spent on a constellation, never a ring). Camera-facing: vanes pitch up toward
// the chase lens, alternating ±8° L/R cant. `trainLift` raises the whole fan's rest pitch.
function buildPyreTrainTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = empressMats(def, glow, model.igniteStage);
  const a = anchor ?? { y: 0.16, z: 1.00 };

  // Short structural tail root (a small nested chain so the idle coil sways the whole
  // train gently). Rotation-only bone → a connected loft never tears.
  const rootLen = 0.6, nRoot = 2;
  const segs = [];
  let parent = group, prevZ = 0;
  for (let s = 0; s < nRoot; s++) {
    const z0 = a.z + (s / nRoot) * rootLen, z1 = a.z + ((s + 1) / nRoot) * rootLen;
    const sg = new THREE.Group();
    sg.position.set(0, s === 0 ? a.y : 0, z0 - prevZ);
    parent.add(sg);
    const rings = [
      { z: 0, rx: 0.12 * (1 - s * 0.3), ry: 0.12 * (1 - s * 0.3), cy: 0 },
      { z: z1 - z0, rx: 0.09 * (1 - s * 0.3), ry: 0.09 * (1 - s * 0.3), cy: 0 },
    ];
    sg.add(loftRings(rings, M.bodyFlat, seg(6), false));
    segs.push(sg); parent = sg; prevZ = z0;
  }
  segs[0].isBone = true;   // idle coil bends the train (never tears it)

  // The TRAIN fan hangs off the last root segment. trainLift raises the whole fan's rest
  // pitch (drooping ember-tail at f0 → proud lifted display at f3) — the ASCENDING read
  // without tilting the body.
  const fanG = new THREE.Group();
  const lift = model.trainLift ?? 1;
  fanG.position.set(0, 0.02, rootLen / nRoot);
  fanG.rotation.x = -0.55 + 0.85 * lift;   // f0 droops down-back, f3 lifts proud
  segs[segs.length - 1].add(fanG);

  const layout = trainFanLayout(model);
  const bodyLen = 2.36;                       // ~torso long-axis (for the ≈1.1× cap)
  const maxLen = Math.min(1.1 * bodyLen, (model.trainQuills ?? 9) >= 4 ? 1.1 * bodyLen : 0.7 * bodyLen);
  const coalOn = (model.coalBloom ?? 1) > 0;
  const dawnOn = (model.dawnCoal ?? 0) > 0;   // the near-white center coal, f3 only
  const accentMats = [M.vaneEdgeLo, M.vaneEdgeHi];  // vane EDGE gradient flares on Surge; the dark blade + coals stay OUT

  for (const q of layout.quills) {
    const len = maxLen * q.lenScale;
    // Quill rest direction: rolled by phi around +Z (0 = straight down), trailing aft (+Z).
    // The vane pitches ~24° up toward the chase lens; the ±8° cant faces the bright face at
    // the cam and balances the row (mirrored pairs → Σ=0).
    const quill = new THREE.Group();
    quill.rotation.z = q.phi;     // fan splay (roll around the trail axis)
    quill.rotation.x = 0.0;
    fanG.add(quill);
    // within the rolled frame, the shaft runs +Z (aft) and slightly down (−Y); the vane
    // tilts up (camera-facing) and cants ±8° about its own axis.
    const shaftDir = new THREE.Vector3(0, -0.32, 1).normalize();
    const shaftEnd = [shaftDir.x * len, shaftDir.y * len, shaftDir.z * len];
    quill.add(bar([0, 0, 0], shaftEnd, 0.028, M.copper));
    // teardrop VANE — a flat blade along the shaft, pitched up + canted to face the lens.
    const vane = new THREE.Group();
    vane.rotation.x = 0.42;       // pitch the vane face up toward the elevated chase cam (~24°)
    vane.rotation.z = q.cant;     // ±8° alternating cant (balanced across the mirrored pair)
    quill.add(vane);
    // Broad TEARDROP vane (widest ~40% out) so the 9 overlap into a full fanned robe. "A coal,
    // not a torch": the blade FACE is near-dark ash-maroon; the fire is a thin crimson→amber
    // EDGE gradient tracing the rim (lower ember → upper amber toward the coal). DoubleSide so
    // it reads canted to the cam. The BRIGHT element is the coal-eye gem at the tip.
    const wMax = 0.19 + 0.12 * q.lenScale;
    const zBase = len * 0.06, zSh = len * 0.40, zTip = len * 0.95;
    const wBase = wMax * 0.5;
    const b0 = [-wBase, 0, zBase], b1 = [wBase, 0, zBase];
    const s0 = [-wMax, 0.02 * len, zSh], s1 = [wMax, 0.02 * len, zSh];
    const tipP = [0, 0, zTip];
    // DARK blade interior (the coal body)
    vane.add(flatTriMesh([[b0, b1, s1], [b0, s1, s0], [s0, s1, tipP]], M.vaneDark));
    // thin GLOWING edge rods tracing the rim — lower half ember-crimson, upper half amber
    const er = 0.017 + 0.006 * q.lenScale;
    vane.add(bar(b0, s0, er, M.vaneEdgeLo)); vane.add(bar(b1, s1, er, M.vaneEdgeLo));
    vane.add(bar(s0, tipP, er, M.vaneEdgeHi)); vane.add(bar(s1, tipP, er, M.vaneEdgeHi));
    // faceted COAL-EYE at the tip — the constellation point, the brightest thing in the fan.
    if (coalOn) {
      const isCenter = q.phi === 0;
      const isDawn = isCenter && dawnOn;
      const bezel = new THREE.Mesh(new THREE.OctahedronGeometry(0.058, 0), M.coalBezel);
      bezel.position.set(0, 0, zTip); bezel.scale.set(1, 1.25, 1);
      vane.add(bezel);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(isDawn ? 0.072 : 0.056, 0), isDawn ? M.dawnCoal : M.coalEye);
      gem.position.set(0, 0, zTip + (isDawn ? 0.02 : 0)); gem.scale.set(1, 1.25, 1);
      vane.add(gem);
    }
  }
  return { group, segs, accentMats };
}
registerTail('pyreTrainTail', buildPyreTrainTail);
