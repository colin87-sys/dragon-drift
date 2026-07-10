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
  const crestI = [0, 0.75, 1.30, 2.05][st] * g;     // comet-crest rose (bumped so the 3rd hue survives chase distance)

  // BODY — dark garnet matte, always present (stage-independent). A lifted garnet
  // emissive floor keeps her faceted-garnet, not void-black, on a dark sky. DoubleSide
  // guards the open-ended neck loft + stray fairing tris (no hollow read).
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x241012, emissive: 0x1a0a0a, emissiveIntensity: 0.10, flatShading: true, roughness: 0.72, metalness: 0.10, side: THREE.DoubleSide });
  // Belly one tier warmer (umber); the APEX belly gets the pale-gold underlight nod
  // (belly-only, downward-facing — warms the underside a believer catches on a bank
  // without ever lightening the dorsal read the chase cam sees).
  const bellyCol = st >= 3 ? (def.bellyGold ?? PALEGOLD) : (def.belly ?? UMBER);
  const belly = new THREE.MeshStandardMaterial({ color: bellyCol, emissive: st >= 3 ? 0x2a1408 : 0x160a06, emissiveIntensity: st >= 3 ? 0.16 : 0.06, flatShading: true, roughness: 0.7, metalness: 0.08, side: THREE.DoubleSide });
  // Burnished copper accent (forged tier, never emissive) — beak, talons, shafts.
  const copper = new THREE.MeshStandardMaterial({ color: def.copper ?? COPPER, flatShading: true, roughness: 0.4, metalness: 0.55, emissive: 0x3a1c0a, emissiveIntensity: 0.18 });
  // THE EMPRESS'S GOLD — a two-tier JEWELRY metal (rose-gold → bright gold at the apex),
  // high metalness with a DEEP-AMBER emissive floor so shadowed/away-facing gold stays warm
  // gold, never olive (Solar's anti-olive plate trick, spent on JEWELRY not armor — clasp,
  // pectoral, tiara, collets, bezels, spar). This is the "expensive/regal" material MASS the
  // chase cam catches as sun edge-highlights; it is metallic DIFFUSE, not new emissive.
  const goldCol = st >= 3 ? (def.brightGold ?? 0xe8c078) : (def.roseGold ?? 0xc07a3a);
  const gold = new THREE.MeshStandardMaterial({ color: goldCol, flatShading: true, roughness: 0.34, metalness: 0.62, emissive: 0xb06a14, emissiveIntensity: 0.22 });
  const goldHi = new THREE.MeshStandardMaterial({ color: st >= 2 ? 0xf2d89a : 0xd8a860, flatShading: true, roughness: 0.26, metalness: 0.64, emissive: 0xc07a18, emissiveIntensity: 0.22 });

  // Wing COVERT sheet (dark root) — ZERO emissive, so the fire on the primaries reads.
  const covert = new THREE.MeshStandardMaterial({ color: def.covert ?? 0x2a1013, flatShading: true, roughness: 0.82, metalness: 0.06, side: THREE.DoubleSide });

  // Helper: a surge-registered emissive material (baseEmissive/baseIntensity so the
  // Rebirth Surge tick lerps the correct hue toward feverWing and boosts intensity).
  const surgeMat = (col, emis, inten, rough) => { const m = new THREE.MeshStandardMaterial({ color: col, emissive: emis, emissiveIntensity: inten, flatShading: true, roughness: rough ?? 0.5, metalness: 0.1, side: THREE.DoubleSide }); m.userData.baseEmissive = emis; m.userData.baseIntensity = inten; return m; };

  // PINION FIRE — deep CRIMSON (blood-red, not pink) so the wing hue stays its own station,
  // distinct from the rose crest and the amber coals. Dark-root → crimson-tip, emissive only
  // toward the tips. IN spineMats (flare on Surge). Rose is reserved for the CREST alone.
  const PINION_CRIMSON = 0xcc1024;
  // The ash-chick (st 0) wears NO wing fire: the primary DIFFUSE goes dark ash so f0 reads a
  // rounded charcoal whelp; the crimson diffuse + emissive kindle together from f1.
  const pinDiff = st === 0 ? 0x241012 : 0x5e1420, pinDiffE = st === 0 ? 0x2a1013 : 0x6a1626;
  const pinionRoot = surgeMat(0x241012, 0x50101c, pinI * 0.22, 0.72);
  const pinionTip  = surgeMat(pinDiff, PINION_CRIMSON, pinI, 0.5);
  const pinionEdge = surgeMat(pinDiffE, PINION_CRIMSON, pinI * 0.55, 0.46);

  // TRAIN-QUILL vane — "a COAL, not a torch", and the light lives in the GEMS not the wires:
  // near-dark ash-maroon blade + a THIN, dim crimson→amber edge tracing the rim (so the fan
  // reads as dark blades, not gold filigree). Edge mats IN accentMats (flare on Surge); the
  // coal-eye gem at the tip is the bright element — the ember constellation.
  const vaneDark   = surgeMat(0x241012, 0x260c08, vaneI * 0.10 + 0.05, 0.74);   // near-dark blade
  const vaneEdgeLo = surgeMat(0x3a1218, EMBER, vaneI * 0.6, 0.5);               // lower rim ember-crimson (dimmed)
  const vaneEdgeHi = surgeMat(0x4a2810, AMBER, vaneI * 0.65, 0.46);            // upper rim amber (dimmed)
  // The peacock EYE inset on each main vane face — amber, a touch hotter than the rim, so the
  // dark blade carries a readable light MOTIF (empress-train signature). IN accentMats.
  const vaneEye    = surgeMat(0x4a2c0e, AMBER, vaneI * 0.95, 0.4);

  // DORSAL keel-seam (thin ember groove) + heart-fire GORGET (amber breast chevron,
  // withheld until f2). Both IN spineMats (torso) → flare on Surge.
  const keelSeam = surgeMat(0x3a1810, EMBER, keelI, 0.55);
  const gorget = surgeMat(0x5a3410, AMBER, gorgetI, 0.4);

  // COMET-CREST blade emissive (rose) — IN spineMats (head).
  const crestGlow = surgeMat(0x5a1830, ROSE, crestI, 0.5);
  // Crest coal TIP — true ROSE (not amber-gold), so the crown reads as the rose hue-station
  // and does NOT add cream-white points competing with the ONE Dawn Coal. Holds hue (out of
  // surge arrays), like the coal-eyes.
  const crestTip = new THREE.MeshStandardMaterial({ color: 0xe86a90, emissive: ROSE, emissiveIntensity: crestI * 1.3, flatShading: true, roughness: 0.3, metalness: 0.12 });

  // COAL-EYE gem — amber-gold emissive, the BRIGHTEST point of the train (the constellation
  // that owns the lower frame). Stays OUT of every surge array (holds its own hue — the
  // constellation must not blow to gold-white on Rebirth). A thin dark bezel frames it.
  const coalEye = new THREE.MeshStandardMaterial({ color: 0xffd888, emissive: 0xffb028, emissiveIntensity: coalI * 2.7, flatShading: true, roughness: 0.22, metalness: 0.15 });
  // coal-eye BEZEL is now GOLD (a jewel SETTING, the welded-gem law) — the amber gem sits in a
  // gold collet so each coal reads as a set stone, not a floating dot.
  const coalBezel = goldHi;
  // The Dawn Coal — the ONE near-white, f3-only, tiny. OUT of all surge arrays.
  const dawnCoal = new THREE.MeshStandardMaterial({ color: DAWNCOAL, emissive: 0xffdca0, emissiveIntensity: st >= 3 ? 2.4 * g : 0, flatShading: true, roughness: 0.24 });

  // Eyes — amber-gold almond, emissive, the only lit facial point (no brow gem).
  const eyeMat = new THREE.MeshStandardMaterial({ color: def.eye ?? 0xffcf6a, emissive: 0xc07a1a, emissiveIntensity: 1.5, flatShading: true, roughness: 0.3, metalness: 0.2 });
  eyeMat.userData.baseEmissive = 0xc07a1a; eyeMat.userData.baseIntensity = 1.5;

  return { bodyFlat, belly, copper, gold, goldHi, covert, pinionRoot, pinionTip, pinionEdge, vaneDark, vaneEdgeLo, vaneEdgeHi, vaneEye, keelSeam, gorget, crestGlow, crestTip, coalEye, coalBezel, dawnCoal, eyeMat, stage: st };
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
// A CREASED kite feather (4 tris): a diamond blade with a shallow dihedral crease down its
// spine, so flat shading gives TWO facet values per feather for free (the "real plumage" cue).
// base→tip runs `along`; `side` is the width axis; `up` lifts the spine crease proud. Returns tris.
function kiteFeather(base, along, side, up, len, wid, crease = 0.35) {
  // A(s, u, t): move `s` along the width axis, `u` along the up (proud) axis, `t` along the length.
  const A = (s, u, t) => [
    base[0] + along[0] * t + side[0] * s + up[0] * u,
    base[1] + along[1] * t + side[1] * s + up[1] * u,
    base[2] + along[2] * t + side[2] * s + up[2] * u];
  const spine = A(0, wid * crease, 0.55 * len);        // raised mid-spine (the crease apex)
  const tip = A(0, 0, len), l = A(-wid, 0, 0.42 * len), r = A(wid, 0, 0.42 * len), b = A(0, 0, 0);
  return [[b, l, spine], [l, tip, spine], [b, spine, r], [spine, tip, r]];
}
// A shingled ROW of overlapping dark feathers along a centreline path `at(t)` (t 0→1), each
// laid proud of the surface (`normalAt`) and pointing `alongAt`. Overlap ~55% → a scalloped,
// stepped edge that reads in silhouette. Returns one flatTriMesh (one draw call).
const NZ = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
function shingleRow(count, at, alongAt, normalAt, len, wid, mat, crease = 0.35) {
  const tris = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5;
    const c = at(t), al = NZ(alongAt(t)), n = NZ(normalAt(t));
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(...al), new THREE.Vector3(...n)).normalize();
    const base = [c[0] + n[0] * 0.02, c[1] + n[1] * 0.02, c[2] + n[2] * 0.02];
    const L = typeof len === 'function' ? len(t) : len, W = typeof wid === 'function' ? wid(t) : wid;
    tris.push(...kiteFeather(base, al, [side.x, side.y, side.z], n, L, W, crease));
  }
  return flatTriMesh(tris, mat);
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

  // DORSAL molten KEEL-CHANNEL: a faceted molten groove down the back ridge, FLANKED by two thin
  // GOLD bevel rails that catch light — a channel with structure, not a lone stripe. Runs the
  // dorsal from crest to train so the body reads a lit spine between light-structures 1 and 3.
  const dorsalTop = (z) => TORSO_Y + 0.30 + 0.16 * Math.max(0, 1 - Math.abs(z + 0.4) / 1.9);
  const seamPts = [-1.15, -0.7, -0.25, 0.2, 0.6, 0.95];
  for (let i = 0; i < seamPts.length - 1; i++) {
    const z0 = seamPts[i], z1 = seamPts[i + 1], y0 = dorsalTop(z0), y1 = dorsalTop(z1);
    // ember channel floor (the molten groove)
    group.add(flatTriMesh([[[-0.045, y0, z0], [0.045, y0, z0], [0.045, y1, z1]], [[-0.045, y0, z0], [0.045, y1, z1], [-0.045, y1, z1]]], M.keelSeam));
    // two gold bevel rails flanking the groove (the channel edges = precious-metal spine)
    group.add(bar([0.055, y0 + 0.02, z0], [0.055, y1 + 0.02, z1], 0.02, M.gold));
    group.add(bar([-0.055, y0 + 0.02, z0], [-0.055, y1 + 0.02, z1], 0.02, M.gold));
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
    // PECTORAL GORGET — a solid faceted GOLD lamellar collar: 5 large overlapping gold teardrop
    // drops across the breast keel + an amber heart-seam glowing behind them + a central rose
    // heart-stone. The precious-metal MASS on the chest (reads on every bank + in side profile).
    const drops = 5, span = 0.32 + 0.06 * bloom;
    for (let k = 0; k < drops; k++) {
      const f = (k - (drops - 1) / 2) / ((drops - 1) / 2);   // −1..1
      const cx = f * span, cy = -0.02 - 0.07 * Math.abs(f), dl = 0.17 - 0.03 * Math.abs(f);
      gg.add(flatTriMesh([
        [[cx - dl * 0.55, cy + dl * 0.4, 0.03], [cx + dl * 0.55, cy + dl * 0.4, 0.03], [cx, cy - dl, 0.0]],
        [[cx - dl * 0.55, cy + dl * 0.4, 0.03], [cx, cy - dl, 0.0], [cx - dl * 0.45, cy - dl * 0.2, -0.03]],
        [[cx + dl * 0.55, cy + dl * 0.4, 0.03], [cx + dl * 0.45, cy - dl * 0.2, -0.03], [cx, cy - dl, 0.0]],
      ], k % 2 ? M.gold : M.goldHi));
    }
    gg.add(flatTriMesh([[[-span * 0.55, 0.08, -0.02], [span * 0.55, 0.08, -0.02], [0, -0.16, -0.03]]], M.gorget));  // amber heart-seam behind
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), M.crestTip);
    heart.position.set(0, -0.02, 0.08); heart.scale.set(1, 1.35, 0.9); gg.add(heart);
    gg.position.copy(gPos);
    gg.rotation.x = -0.3;
    group.add(gg);
    spineMats.push(M.gorget);
  }

  // ── PLUMAGE + REGALIA richness (all dark covert relief unless noted; richness by facet +
  // silhouette, never new light — the coal doctrine holds) ─────────────────────────────────
  // B1 — NECK RUFF / imperial collar (conferred at f2): a ring of overlapping dark feather-points
  // around the neck base flaring back over the shoulders — the strongest "regal empress" cue and
  // it FRAMES the head in the rear-chase view. Tips kissed rose at f2+ (the crest hue-station).
  const ruff = model.ruff ?? 0;
  if (ruff > 0) {
    const cz = -1.04, cy0 = TORSO_Y + 0.14, R = 0.30 + 0.06 * ruff;
    group.add(shingleRow(seg(11),
      (u) => { const ang = (u - 0.5) * Math.PI * 1.55; return [Math.sin(ang) * R, cy0 + Math.cos(ang) * R * 0.85 + 0.06, cz + 0.04 * Math.abs(Math.sin(ang))]; },
      (u) => { const ang = (u - 0.5) * Math.PI * 1.55; return [Math.sin(ang) * 0.4, 0.2 + 0.2 * Math.cos(ang), 0.9]; },
      (u) => { const ang = (u - 0.5) * Math.PI * 1.55; return [Math.sin(ang), Math.cos(ang) + 0.3, 0.15]; },
      () => (0.40 + 0.08 * ruff), () => 0.12, M.covert, 0.42));
    // rose-kissed tips (a few) — the imperial collar catches the crest hue
    for (let j = -2; j <= 2; j++) {
      const ang = (j / 5) * Math.PI * 1.3;
      const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), M.crestTip);
      tip.position.set(Math.sin(ang) * R * 1.15, cy0 + Math.cos(ang) * R * 0.9 + 0.42, cz + 0.42);
      group.add(tip);
    }
  }

  // B2 — FLANK + breast SHINGLE rows: broad dark feather scallops down each flank (and a breast
  // rank) so the bare fuselage reads as a feathered body from every angle. Rows grow per form.
  const flankRows = Math.round(model.flankShingle ?? 0);
  for (let row = 0; row < flankRows; row++) {
    for (const side of [1, -1]) {
      group.add(shingleRow(seg(6),
        (u) => { const z = -0.55 + u * 1.15; const hw = 0.55 * Math.max(0.3, 1 - Math.abs(z + 0.2) / 2.3); return [side * hw * 0.94, TORSO_Y - 0.06 + row * 0.24, z]; },
        () => [0, -0.12, 1],
        () => [side * 0.92, 0.28, 0],
        () => 0.26, () => 0.11, M.covert, 0.45));
    }
  }

  // B3 — DORSAL PLUME RIDGE: small back-swept dark plumes along the spine (the keel-seam ember
  // now glows BETWEEN structure instead of being a lone stripe). Rear-chase + top stare at this.
  const dPlumes = Math.round(model.dorsalPlumes ?? 0);
  if (dPlumes > 0) {
    group.add(shingleRow(seg(dPlumes),
      (u) => { const z = -0.95 + u * 1.85; return [0, dorsalTop(z) + 0.04, z]; },
      () => [0, -0.25, 1],
      () => [0, 1, -0.1],
      (u) => 0.24 + 0.08 * (1 - Math.abs(u - 0.4)), () => 0.06, M.covert, 0.4));
  }

  // B4 — folded COPPER TALONS tucked under the hip (chick-stub at f0 → full at f3, +anklet band):
  // converts "paper glider" to "creature". Copper, non-emissive — doctrine-clean. Side/below read.
  const talons = model.talons ?? 0;
  if (talons > 0) {
    for (const side of [1, -1]) {
      const shin = spike(0.24 * talons, 0.05, 0.03, M.copper, 4);
      shin.position.set(side * 0.15, TORSO_Y - 0.10, 0.34); shin.rotation.x = 2.05; shin.rotation.z = -side * 0.1;
      group.add(shin);
      const foot = new THREE.Group();
      foot.position.set(side * 0.17, TORSO_Y - 0.32, 0.52);
      for (let c = 0; c < 3; c++) {
        const claw = spike(0.16 * talons, 0.026, 0.004, M.copper, 4);
        claw.rotation.x = 2.5; claw.rotation.z = (c - 1) * 0.34; claw.rotation.y = side * 0.12;
        foot.add(claw);
      }
      group.add(foot);
      if (talons >= 1) {   // anklet band (f3)
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, seg(6)), M.gorget);
        band.position.set(side * 0.16, TORSO_Y - 0.26, 0.47); band.rotation.x = 2.05;
        group.add(band);
      }
    }
  }

  // W4 — SCAPULAR / TERTIAL FILLET: overlapping dark plates from each wing root inboard to the
  // neck base, so the wing grows OUT of the body instead of butting into it (and no background
  // survives between neck, shoulder and wing roots in the rear read). Layered, not a single tri.
  for (const s of [1, -1]) {
    group.add(flatTriMesh([[[s * 0.5, TORSO_Y + 0.30, -0.55], [s * 0.10, TORSO_Y + 0.28, -1.15], [s * 0.46, TORSO_Y + 0.16, -0.30]]], M.bodyFlat));
    // three shingled scapular feathers sweeping off the shoulder over the wing root
    group.add(shingleRow(seg(3),
      (u) => [s * (0.30 + 0.16 * u), TORSO_Y + 0.34 - 0.05 * u, -0.72 + 0.34 * u],
      () => [s * 0.45, -0.05, 0.88],
      () => [s * 0.3, 0.95, 0], () => 0.40, () => 0.13, M.covert, 0.4));
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
  const { halfSpan, rake, tipRise, primaries, pinionSlots, rootChord, tipChord, covertRank, alula } = dials;
  const nz = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
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

  // W1 — SHINGLED SECONDARY-COVERT RANK (conferred at f1): a row of overlapping dark kite
  // feathers along the trailing edge from the covert bed out over the primary roots, so the
  // straight trailing line becomes a SCALLOPED, stepped, feathered edge (the #1 "real wing"
  // cue — reads in pure silhouette). Dark covert diffuse; richness by facet relief, not light.
  if (covertRank > 0) {
    const covMid = (t) => { const a = covLead(t), b = covTrail(t); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; };
    // trailing rank — extended INBOARD to t≈0.08 with deeper scallops so the wing reads feathered
    // from the ROOT to the first primary (kills the blank inner-wing rod the chase cam saw).
    wg.add(shingleRow(seg(11),
      (u) => covTrail(0.08 + 0.54 * u),
      (u) => { const t = 0.08 + 0.54 * u; return nz([covTrail(t)[0] - covLead(t)[0], -0.15, covTrail(t)[2] - covLead(t)[2] + 0.1]); },
      () => nz([0, 0.7, -0.3]),
      (u) => (0.36 + 0.18 * (1 - Math.abs(u - 0.5) * 2)) * rootChord,
      () => 0.12 * rootChord, M.covert, 0.45));
    // a MID-CHORD rank across the inner wing SURFACE (not just the edge) — surface relief so the
    // inner third carries facet steps, not a flat dark plane.
    wg.add(shingleRow(seg(7),
      (u) => covMid(0.06 + 0.34 * u),
      (u) => { const t = 0.06 + 0.34 * u; return nz([covTrail(t)[0] - covLead(t)[0], -0.1, covTrail(t)[2] - covLead(t)[2]]); },
      () => nz([0, 0.85, -0.2]),
      () => 0.24 * rootChord, () => 0.10 * rootChord, M.covert, 0.4));
  }

  // W2 — BLADE PRIMARIES with a SCALE-HIERARCHY (Solar CP2 principle, terminal-peak variant):
  // a steep outward length ramp + a DOMINANT terminal "empress pinion" (~1.7× its neighbour) so
  // the rank reads dominant→step→step→tip, not a picket fence. LIGHT is CONSOLIDATED: only the
  // outer 3 primaries carry crimson fire (discrete fire-feathers at the tips); the inner ones are
  // dark structural feathers; and one continuous ember stroke traces the whole trailing edge —
  // two long burning crescents, not per-feather dashes.
  const nP = Math.max(1, Math.round(primaries));
  const folded = tipRise >= 0.5;   // the whelp keeps simple stubs; folded pinions arrive with rake
  const wingEls = [];
  const tips = [];                 // primary tips → the continuous burning trailing stroke
  for (let k = 0; k < nP; k++) {
    const t0 = tCov + (1 - tCov) * (k / nP);
    const t1 = tCov + (1 - tCov) * ((k + 1) / nP);
    const outer = k / (nP - 1 || 1);
    const isEmpress = (k === nP - 1);          // the dominant EMPRESS PINION (terminal peak)
    const isFire = k >= nP - 3;                 // outer 3 carry the crimson gradient
    const a = L(t0), b = L(t1);
    const c = chord((t0 + t1) / 2);
    const slotted = pinionSlots > 0 && k >= nP - pinionSlots;
    const gap = slotted ? 0.34 : 0.0;
    const wideBase = isEmpress ? 1.4 : 1.0;
    const ba = [a[0] + (b[0] - a[0]) * (gap * 0.5), a[1] + (b[1] - a[1]) * (gap * 0.5), a[2] + (b[2] - a[2]) * (gap * 0.5)];
    const bbRaw = [a[0] + (b[0] - a[0]) * (1 - gap * 0.5), a[1] + (b[1] - a[1]) * (1 - gap * 0.5), a[2] + (b[2] - a[2]) * (1 - gap * 0.5)];
    const bb = [ba[0] + (bbRaw[0] - ba[0]) * wideBase, ba[1] + (bbRaw[1] - ba[1]) * wideBase, ba[2] + (bbRaw[2] - ba[2]) * wideBase];
    const mid = [(ba[0] + bb[0]) / 2, (ba[1] + bb[1]) / 2, (ba[2] + bb[2]) / 2];
    let featherLen = c * (0.82 + 1.15 * Math.pow(outer, 1.5)) * (0.55 + 0.45 * tipRise);
    if (isEmpress) featherLen *= 1.7;           // dominant terminal pinion
    const curl = isEmpress ? -0.13 * featherLen : (k === nP - 2 ? -0.05 * featherLen : 0);
    const drop = -0.10 * featherLen;
    const along = nz([curl, drop, featherLen]);
    const splitP = [mid[0] + curl * 0.6, mid[1] + drop * 0.6, mid[2] + featherLen * 0.6];
    const tipP = [mid[0] + curl, mid[1] + drop, mid[2] + featherLen];
    const tipMat = isFire ? M.pinionTip : M.covert;   // inner feathers dark; outer 3 burn crimson
    const edgeMat = isFire ? M.pinionEdge : M.covert;
    if (!folded) {
      wg.add(flatTriMesh([[ba, bb, splitP]], M.pinionRoot));
      wg.add(flatTriMesh([[ba, splitP, tipP]], tipMat));
      wg.add(flatTriMesh([[splitP, bb, tipP]], edgeMat));
    } else {
      const crH = 0.07 * featherLen;
      const crease = [splitP[0], splitP[1] + crH, splitP[2] - 0.05 * featherLen];
      wg.add(flatTriMesh([[ba, mid, crease], [mid, bb, crease]], M.pinionRoot));
      wg.add(flatTriMesh([[mid, crease, tipP]], tipMat));
      wg.add(flatTriMesh([[crease, bb, tipP]], edgeMat));
      if (isFire) {   // trailing barb only on the burning outer feathers
        const barbRoot = [bb[0] + (tipP[0] - bb[0]) * 0.55, bb[1] + (tipP[1] - bb[1]) * 0.55, bb[2] + (tipP[2] - bb[2]) * 0.55];
        const barbTip = [barbRoot[0] + along[0] * 0.12 * featherLen + 0.02, barbRoot[1] + along[1] * 0.1 * featherLen, barbRoot[2] + along[2] * 0.12 * featherLen];
        wg.add(flatTriMesh([[barbRoot, barbTip, tipP]], M.pinionEdge));
      }
    }
    tips.push(tipP);
    wingEls.push({ station: (t0 + t1) / 2, tip: tipP, length: featherLen });
  }
  // CONTINUOUS EMBER STROKE tracing the primary tips — one long burning crescent edge (reads at
  // chase distance where per-feather dashes vanish). Bright only where the fire is (outer half).
  if (folded && tips.length > 1) {
    for (let i = Math.floor(tips.length * 0.35); i < tips.length - 1; i++) {
      const p = tips[i], q = tips[i + 1], off = 0.07;
      const p2 = [p[0], p[1] - off, p[2] - off], q2 = [q[0], q[1] - off, q[2] - off];
      wg.add(flatTriMesh([[p, q, q2], [p, q2, p2]], M.pinionTip));
    }
  }

  // W3 — ALULA (conferred at f2): three short copper-shafted dark feathers at the wrist
  // (t≈0.34, where covert meets primaries), splayed forward-up — breaks the dead-straight
  // leading spar at the point the rear-chase eye lands, and reads the wing as JOINTED.
  if (alula > 0) {
    const wl = L(0.33);
    for (let j = 0; j < 3; j++) {
      const base = [wl[0] + 0.02 * j, wl[1] + 0.03, wl[2] - 0.04];
      const al = nz([-0.12, 0.55, -0.75 + 0.14 * j]);
      wg.add(flatTriMesh(kiteFeather(base, al, [1, 0, 0], [0, 1, 0], 0.20 - 0.03 * j, 0.05), M.covert));
      wg.add(bar(base, [base[0] + al[0] * 0.16, base[1] + al[1] * 0.16, base[2] + al[2] * 0.16], 0.011, M.copper));
    }
  }

  // GOLD armored LEADING SPAR (thick root → thin tip) tracing the rising rake — a precious-metal
  // crescent edge (not dark copper) + a bevel facet plane that catches the sun (the deliberate
  // metal sun-highlight; Solar's gold-edge principle, spent on her leading crescent).
  const sN = 4, bev = [];
  for (let i = 0; i < sN; i++) {
    const a = L(i / sN), b = L((i + 1) / sN);
    wg.add(bar(a, b, 0.055 * (1 - i / sN) + 0.025, M.goldHi));
  }
  for (let i = 0; i <= sN; i++) bev.push(L(i / sN));
  for (let i = 0; i < sN; i++) {
    const p = bev[i], q = bev[i + 1];
    const pu = [p[0], p[1] + 0.08, p[2] - 0.03], qu = [q[0], q[1] + 0.08, q[2] - 0.03];
    wg.add(flatTriMesh([[p, q, qu], [p, qu, pu]], M.gold));
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
  const dials = { halfSpan, rake, tipRise, primaries, pinionSlots, rootChord: model.rootChord ?? 1.95, tipChord: model.tipChord ?? 0.36,
    covertRank: model.covertRank ?? 1, alula: model.alula ?? 1 };   // +30% chord (Risk #1 fallback exercised)

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

  // Eyes — amber-gold almond, emissive; eyeShape ladders 34% round (chick) → 16% almond. H3:
  // shrunk ~15% + a dark BROW-RIDGE facet above so the eye sits IN the skull, not ON it as a sticker.
  const shape = model.eyeShape ?? 1;
  const eScale = 0.102 * hs * (0.9 + 0.4 * (1 - shape));
  spineMats.push(eyeMat);
  for (const side of [1, -1]) {
    // brow ridge (dark) — a small hooded facet over the eye
    group.add(flatTriMesh([[[side * 0.10 * hs, 0.18 * hs, -0.10 * hs], [side * 0.30 * hs, 0.15 * hs, -0.20 * hs], [side * 0.24 * hs, 0.05 * hs, -0.24 * hs]]], M.bodyFlat));
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(eScale, 0), eyeMat);
    eye.position.set(side * 0.21 * hs, 0.05 * hs, -0.20 * hs);
    eye.scale.set(1.2 + (1 - shape) * 0.9, 0.62 + shape * 0.5, 0.8);   // set INTO the skull (z-flatter)
    group.add(eye);
  }

  // COMET CREST — back-swept streaming crest quills off the crown (1→3→5 per form), each a
  // 2–3-tri copper blade with a small coal-eye tip (the upper echo of the train motif). The
  // crest is the head's motif; it publishes the anchor + blooms with the count.
  const nCrest = Math.round(model.crestQuills ?? 5);
  const crestPos = new THREE.Vector3(0, 0.24 * hs, 0.20);   // crown, back of skull
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.copy(crestPos); group.add(motifAnchor);
  if (nCrest > 0) spineMats.push(M.crestGlow);

  // H2b — NAPE MANTLE: a small fan of dark feathers rooting the crest into the neck (so the
  // crest connects to the body / the B1 ruff instead of floating). Conferred with the crest.
  if (nCrest > 0) {
    group.add(shingleRow(seg(5),
      (u) => [(u - 0.5) * 0.36 * hs, (0.16 - 0.04 * Math.abs(u - 0.5) * 2) * hs, 0.24 * hs],
      () => [0, -0.4, 1], () => [0, 1, -0.2],
      () => 0.34 * hs, () => 0.09 * hs, M.covert, 0.4));
  }

  for (let k = 0; k < nCrest; k++) {
    const cen = (nCrest - 1) / 2;
    const off = nCrest > 1 ? (k - cen) / (cen || 1) : 0;   // −1..1 across the crest
    const clen = (0.50 + 0.18 * (1 - Math.abs(off))) * hs;  // center quill longest (streams rearward)
    const q = new THREE.Group();
    q.position.set(crestPos.x + off * 0.14 * hs, crestPos.y, crestPos.z);
    q.rotation.x = 1.15;                     // rake back over the nape (streams rearward)
    q.rotation.z = -off * 0.42;              // splay outward
    const shaft = spike(clen, 0.03 * hs, 0.006, M.copper, 4); q.add(shaft);
    // H2 — a BARBED streamer vane (wider, notched) rather than a single sliver: two barbs + a
    // point, so the crest reads as real plumage. Rose emissive (the crest hue-station).
    const w = 0.07 * hs;
    q.add(flatTriMesh([
      [[-w, clen * 0.28, 0], [w, clen * 0.28, 0], [0, clen * 0.62, 0.005]],
      [[-w * 0.8, clen * 0.55, 0], [w * 0.8, clen * 0.55, 0], [0, clen * 0.96, 0.01]],
    ], M.crestGlow));
    // a short UNDER-feather behind each main crest quill (dark) — depth
    q.add(flatTriMesh([[[-w * 0.6, clen * 0.2, -0.02], [w * 0.6, clen * 0.2, -0.02], [0, clen * 0.7, -0.03]]], M.covert));
    // small ROSE coal tip (the crest is the rose hue-station; OUT of surge arrays, holds hue).
    if ((model.coalBloom ?? 1) > 0) {
      const coal = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs, 0), M.crestTip);
      coal.position.set(0, clen, 0);
      q.add(coal);
    }
    group.add(q);
  }

  // H1 — the RADIANT TIARA (conferred at f3): a solid GOLD brow band + 5 upswept gold RAYS — a
  // miniature ray-burst that echoes the Dawn Fan (one grammar, two anchors: crown above, train
  // below) — set with 3 rose gems in gold collets at 0.9× ray length (the welded-gem law; no
  // sub-pixel floating confetti). Head-scaled so she stays bottom-heavy (NOT a body ring/halo).
  if ((model.diadem ?? 0) > 0) {
    const tia = new THREE.Group();
    tia.position.set(0, 0.19 * hs, 0.05 * hs);
    const bw = 0.30 * hs;   // solid gold brow band
    tia.add(flatTriMesh([
      [[-bw, 0, 0.02], [bw, 0, 0.02], [bw, 0.06 * hs, -0.02]],
      [[-bw, 0, 0.02], [bw, 0.06 * hs, -0.02], [-bw, 0.06 * hs, -0.02]],
    ], M.goldHi));
    const rays = 5;
    for (let i = 0; i < rays; i++) {
      const f = (i - (rays - 1) / 2) / ((rays - 1) / 2);   // −1..1
      const rl = (0.26 - 0.08 * Math.abs(f)) * hs;          // center ray tallest (ray-burst)
      const bx = f * 0.24 * hs;
      const rot = new THREE.Euler(-0.18, 0, -f * 0.5);
      const ray = spike(rl, 0.032 * hs, 0.004, M.goldHi, 4);
      ray.position.set(bx, 0.05 * hs, 0); ray.rotation.copy(rot);
      tia.add(ray);
      if (i % 2 === 0) {   // 3 rose gems set at 0.9× ray length, in gold collets
        const gp = new THREE.Vector3(0, rl * 0.9, 0).applyEuler(rot);
        const collet = spike(0.05 * hs, 0.036 * hs, 0.024 * hs, M.gold, 4);
        collet.position.set(bx + gp.x * 0.8, 0.05 * hs + gp.y * 0.8, gp.z * 0.8); collet.rotation.copy(rot);
        tia.add(collet);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs, 0), M.crestTip);
        gem.position.set(bx + gp.x, 0.05 * hs + gp.y, gp.z); gem.scale.set(1, 1.3, 1);
        tia.add(gem);
      }
    }
    group.add(tia);
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
  const fanDeg = Math.min(model.trainFan ?? 162, 176);       // hard-capped < 180°
  const half = (fanDeg / 2) * Math.PI / 180;
  const odd = nRaw % 2 === 1;
  const pairs = Math.floor(nRaw / 2);
  // SHAPED LYRE outline (not a broom): the center ray is the tallest, a broad secondary SWELL
  // at ~0.62 of the sector gives the fan shoulders, and the outer rays stay LONG (soft taper).
  // Non-monotonic across the sector — the "shaped outline" doctrine.
  const lenAt = (f) => 0.66 + 0.34 * Math.cos(f * Math.PI / 2) + 0.13 * Math.exp(-Math.pow((f - 0.62) / 0.24, 2));
  const quills = [];
  if (odd) quills.push({ phi: 0, cant: 0, lenScale: lenAt(0), curlOut: 0, mirror: 0 });
  for (let p = 1; p <= pairs; p++) {
    const f = odd ? p / pairs : (p - 0.5) / pairs;                  // sector fraction (0 center → 1 edge)
    const phi = half * f;                                          // roll from center (0=down)
    const cant = (p % 2 === 1 ? 1 : -1) * (8 * Math.PI / 180);      // alternating ±8° per pair
    const lenScale = lenAt(f);
    const curlOut = (p === pairs) ? 1 : 0;                          // outermost pair = the lyre horns
    quills.push({ phi: +phi, cant: +cant, lenScale, curlOut, mirror: +1 });  // right
    quills.push({ phi: -phi, cant: -cant, lenScale, curlOut, mirror: -1 });  // left = mirror → Σ cant = 0
  }
  // angular gap between adjacent quills vs a quill's angular "width" (the not-a-ring assert)
  const angs = quills.map((q) => q.phi).sort((a, b) => a - b);
  let minGap = Infinity;
  for (let i = 1; i < angs.length; i++) minGap = Math.min(minGap, angs[i] - angs[i - 1]);
  return { quills, fanDeg, minGapRad: minGap === Infinity ? half : minGap, nQuills: quills.length };
}

// T1 — the INNER UNDER-RANK: a second, shorter arc of downy quills nested a half-step between
// the main rank (f3 only, via model.underQuills), so the fan reads as layered feather-MASS and
// the coal constellation doubles into two nested arcs. Same mirrored-pair construction → Σcant=0.
export function trainUnderLayout(model) {
  const n = Math.max(0, Math.round(model.underQuills ?? 0));
  const fanDeg = Math.min(model.trainFan ?? 150, 175);
  const half = (fanDeg / 2) * Math.PI / 180;
  const pairs = Math.floor(n / 2);
  const quills = [];
  for (let p = 1; p <= pairs; p++) {
    const phi = half * ((p - 0.5) / (pairs + 0.4));           // half-step, tucked inside the main sector
    const cant = (p % 2 === 1 ? 1 : -1) * (6 * Math.PI / 180);
    const lenScale = 0.72 + 0.22 * Math.cos((p / pairs) * Math.PI / 2);   // stay long (doubled arc reads)
    quills.push({ phi: +phi, cant: +cant, lenScale, curlOut: 0, mirror: +1 });
    quills.push({ phi: -phi, cant: -cant, lenScale, curlOut: 0, mirror: -1 });   // mirror → Σ cant = 0
  }
  return { quills, nQuills: quills.length };
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
  const vaneEyes = (model.vaneEyes ?? 0) > 0; // the peacock-eye motif ignites at f2
  const accentMats = [M.vaneEdgeLo, M.vaneEdgeHi, M.vaneEye];  // edge gradient + eye flare on Surge; dark blade + coals stay OUT

  // One quill: copper shaft + a broad teardrop vane (dark blade, flat readable RIBBON rims in a
  // crimson→amber gradient, an optional peacock-eye inset) + a coal-eye gem at the tip. `big` =
  // the main rank; the under-rank is smaller/dimmer with no eye. Camera-facing pitch + ±cant.
  const addQuill = (q, len, big) => {
    const quill = new THREE.Group();
    quill.rotation.z = q.phi;
    fanG.add(quill);
    const shaftDir = new THREE.Vector3(0, -0.32, 1).normalize();
    quill.add(bar([0, 0, 0], [shaftDir.x * len, shaftDir.y * len, shaftDir.z * len], big ? 0.026 : 0.018, M.copper));
    const vane = new THREE.Group();
    vane.rotation.x = 0.42;       // pitch the vane face up toward the elevated chase cam (~24°)
    vane.rotation.z = q.cant;     // ±cant (balanced across the mirrored pair)
    quill.add(vane);
    const wMax = (big ? 0.34 : 0.20) + (big ? 0.22 : 0.11) * q.lenScale;   // ~1.8× broader vanes (FEWER-LARGER)
    const zBase = len * 0.06, zSh = len * 0.42, zTip = len * 0.95;
    const wBase = wMax * 0.5;
    const cx = q.curlOut ? Math.sign(q.mirror || 1) * 0.17 * len : 0;      // lyre-horn tip curl (outermost pair)
    const cy = q.curlOut ? 0.06 * len : 0;
    const b0 = [-wBase, 0, zBase], b1 = [wBase, 0, zBase];
    const s0 = [-wMax, 0.02 * len, zSh], s1 = [wMax, 0.02 * len, zSh];
    const tipP = [cx, cy, zTip];
    vane.add(flatTriMesh([[b0, b1, s1], [b0, s1, s0], [s0, s1, tipP]], M.vaneDark));   // dark blade
    // flat RIBBON rims (readable at chase distance, unlike the old hairline rods) — lower
    // ember-crimson, upper amber. Offset inward in the vane plane so the blade stays dark-centred.
    const rw = big ? 0.05 : 0.035;
    const rimQ = (a, bb, ox, mat) => { const a2 = [a[0] + ox, a[1] + 0.004, a[2]], b2 = [bb[0] + ox, bb[1] + 0.004, bb[2]]; vane.add(flatTriMesh([[a, bb, b2], [a, b2, a2]], mat)); };
    rimQ(b0, s0, +rw, M.vaneEdgeLo); rimQ(b1, s1, -rw, M.vaneEdgeLo);
    rimQ(s0, tipP, +rw, M.vaneEdgeHi); rimQ(s1, tipP, -rw, M.vaneEdgeHi);
    // T2 — peacock EYE inset (~60% out) on the main rank at f2+: a small amber diamond the dark
    // blade carries, so the train has readable light INSIDE the feathers (the empress signature).
    if (big && vaneEyes) {
      const ez = len * 0.60, ew = wMax * 0.34, ey = 0.02 * len;
      vane.add(flatTriMesh([[[-ew, ey, ez], [0, ey, ez + ew * 1.3], [ew, ey, ez]], [[-ew, ey, ez], [ew, ey, ez], [0, ey, ez - ew * 1.3]]], M.vaneEye));
    }
    // coal-eye gem at the tip — the brightest thing in the fan, now ~1.4× larger and SET in a
    // GOLD collet (the welded-gem law) so the doubled arc reads as a constellation of jewels.
    if (coalOn) {
      const isDawn = q.phi === 0 && dawnOn && big;
      const gemR = isDawn ? 0.115 : (big ? 0.098 : 0.064);
      const bezel = new THREE.Mesh(new THREE.OctahedronGeometry(gemR * 1.34, 0), M.coalBezel);   // gold setting (rim shows)
      bezel.position.set(cx, cy, zTip); bezel.scale.set(1, 1.3, 0.8); vane.add(bezel);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), isDawn ? M.dawnCoal : M.coalEye);
      gem.position.set(cx, cy, zTip + (isDawn ? 0.02 : 0)); gem.scale.set(1, 1.3, 1); vane.add(gem);
    }
  };

  for (const q of layout.quills) addQuill(q, maxLen * q.lenScale, true);
  // T1 — inner under-rank (f3): shorter downy quills nested between the main rank → layered
  // feather-mass + a doubled coal constellation (two nested arcs).
  for (const q of trainUnderLayout(model).quills) addQuill(q, maxLen * 0.6 * q.lenScale, false);

  // T3 — TAIL-ROOT COVERT SKIRT: a shingled cone of dark feathers wrapping the fan root at the
  // hip, hiding the naked shafts-glued-to-a-cone junction that sits dead-centre of the rear frame.
  if ((model.trainQuills ?? 9) >= 4) {
    fanG.add(shingleRow(seg(9),
      (u) => { const ang = (u - 0.5) * Math.PI * 1.15; return [Math.sin(ang) * 0.17, -0.03 - 0.02 * Math.cos(ang), Math.cos(ang) * 0.05 - 0.02]; },
      (u) => { const ang = (u - 0.5) * Math.PI * 1.15; return [Math.sin(ang) * 0.55, -0.45, 0.72]; },
      () => [0, 0.55, 0.35],
      () => 0.30, () => 0.085, M.covert, 0.4));
  }

  // THE TRAIN-CLASP (conferred via model.clasp) — a large faceted GOLD brooch at the hip where
  // the robe hangs: a teardrop cabochon + two shoulder plates + a central rose gem, dead-centre
  // of the rear frame. Her jewelry SET-PIECE anchor — the precious-metal MASS Solar has and she
  // lacked. Reads as gold that catches the sun on every bank.
  if ((model.clasp ?? 0) > 0) {
    const cl = new THREE.Group();
    cl.position.set(0, 0.0, 0.03);
    const s = 0.20 + 0.12 * (model.clasp ?? 1);
    cl.add(flatTriMesh([
      [[-s * 0.62, s * 0.5, 0.05], [s * 0.62, s * 0.5, 0.05], [0, -s * 1.15, 0.02]],
      [[-s * 0.62, s * 0.5, 0.05], [0, -s * 1.15, 0.02], [-s * 0.5, -s * 0.2, -0.04]],
      [[s * 0.62, s * 0.5, 0.05], [s * 0.5, -s * 0.2, -0.04], [0, -s * 1.15, 0.02]],
      [[-s * 0.62, s * 0.5, 0.05], [s * 0.62, s * 0.5, 0.05], [0, s * 0.75, -0.02]],
    ], M.goldHi));
    for (const sd of [1, -1]) cl.add(flatTriMesh([[[sd * s * 0.55, s * 0.42, 0], [sd * s * 1.2, s * 0.16, -0.03], [sd * s * 0.5, -s * 0.35, 0]]], M.gold));
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), M.crestTip);
    gem.position.set(0, s * 0.05, 0.1); gem.scale.set(1, 1.35, 0.8); cl.add(gem);
    fanG.add(cl);
  }
  return { group, segs, accentMats };
}
registerTail('pyreTrainTail', buildPyreTrainTail);
