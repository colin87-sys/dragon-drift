import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SOLAR SOVEREIGN — "The Eclipse Dragon-King" (Bahamut / Eclipse). FRESH premium apex
// (SOLAR-ECLIPSE-BUILDSHEET.md) — no shipped builder look reused. Four self-registering
// parts: regnalKeelTorso · lanceVaultWings · eclipseCrownHead · scepterWhipTail.
// Axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
// Low-poly doctrine: FEWER, LARGER, confidently faceted forms carried by SILHOUETTE; all
// glow = emissive baked into OPAQUE flat-shaded facets. Gold facets = forged-plate read.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;
const GOLD = 0xd4a84f, GOLD_HI = 0xddc070, VIOLET = 0xb784ff, CRIMSON_OUT = 0x5a160e;

// The IGNITION RAMP is the growth currency (CP2): self-illumination stages 0→3 across the forms.
// `stage` gates WHICH emissives are lit; each is a saturated, bloom-safe hue (sat≥0.75, value≤0.9)
// so it blooms IN ITS OWN COLOUR under ACES + UnrealBloom instead of clipping to washed-out white
// (the "cheap/tacky glow" the old dragons had). All glow = emissive baked into OPAQUE facets — no
// additive shells. Only the f3 spar tips are allowed to approach white (a few dozen px at chase
// distance = under the clip budget).
function sovereignMats(def, glow, stage) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3)));
  // Per-stage intensity ladders (final target values per form; the surge tick multiplies baseIntensity).
  const seamI = [0, 0.8, 1.2, 1.5][st];       // dorsal keel seams
  const mantI = [0, 0, 1.6, 2.2][st];         // shoulder-mantle seam bands (stage≥2)
  const veinI = [0, 0, 2.0, 3.2][st];         // wing vein circuit
  const gemI = [0, 0.9, 1.8, 2.9][st];        // brow star-gem
  const napeI = [0, 0, 1.6, 2.6][st];         // dorsal nape-star (the chase-cam sigil)
  const emberF = [0, 0.3, 0.62, 1.0][st];     // membrane trailing-ember factor (stage-1 KINDLE = f1's first wing-light)
  const coronaI = [0, 0, 0, 3.4][st];         // eclipse-corona rim (Eternal only) — bright enough to read at chase scale
  const sparI = st >= 3 ? 3.5 : 0;            // white-hot spar tips (Eternal only)

  // Body: SATURATED indigo (not gray) + a lifted indigo emissive floor so the king reads
  // faceted-indigo, not void-black, on a dark sky. Stage-independent (always present).
  // DoubleSide guards the open-ended neck/tail loft tubes + stray fairing tris (no hollow read).
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x0a0e1c, emissive: 0x16204a, emissiveIntensity: 0.12, flatShading: true, roughness: 0.66, metalness: 0.12, side: THREE.DoubleSide });
  // Golds: a DEEP-AMBER emissive floor (not self-colour gold) keeps shadowed/away-facing plate warm
  // gold instead of olive/khaki — the chase cam sees the dorsal mantle side-lit, so this matters.
  const gCol = def.scales ?? GOLD, ghCol = def.horn ?? GOLD_HI;
  const gold = new THREE.MeshStandardMaterial({ color: gCol, flatShading: true, roughness: 0.42, metalness: 0.5, emissive: 0xb06a14, emissiveIntensity: 0.20 });
  const goldHi = new THREE.MeshStandardMaterial({ color: ghCol, flatShading: true, roughness: 0.36, metalness: 0.52, emissive: 0xc07a18, emissiveIntensity: 0.20 });
  const vCol = def.apexSeam ?? VIOLET;              // diffuse accent (light blue-violet)
  const vEmis = 0x5a2ce0;                            // saturated blue-violet — bloom-safe (holds hue, no magenta drift)
  const violet = new THREE.MeshStandardMaterial({ color: vCol, emissive: vEmis, emissiveIntensity: seamI, flatShading: true, roughness: 0.4 });
  violet.userData.baseEmissive = vEmis; violet.userData.baseIntensity = seamI;
  const violetMantle = new THREE.MeshStandardMaterial({ color: vCol, emissive: vEmis, emissiveIntensity: mantI, flatShading: true, roughness: 0.4 });
  violetMantle.userData.baseEmissive = vEmis; violetMantle.userData.baseIntensity = mantI;
  // Membrane VALUE TIERS (root dark → outer ember): diffuse tiers kept; the EMISSIVE gradient
  // (root≈dark → trailing-edge ember) is what the chase cam catches on the scallops. Saturated
  // ember orange-red at the outer tier stays mid-value → holds colour through bloom.
  const memEmis = [0x200504, 0x6e1410, 0xb42414, 0xe8401c];
  const memBaseI = [0.05, 0.2, 0.45, 0.8];
  const mem = (col, i) => { const inten = memBaseI[i] * emberF; const m = new THREE.MeshStandardMaterial({ color: col, emissive: memEmis[i], emissiveIntensity: inten, flatShading: true, roughness: 0.76, side: THREE.DoubleSide }); m.userData.baseEmissive = memEmis[i]; m.userData.baseIntensity = inten; return m; };
  const memTiers = [mem(0x45120e, 0), mem(0x5a160e, 1), mem(0x7a1622, 2), mem(0x9c2233, 3)];   // root→outer
  const membrane = memTiers[2];
  // Starlight-vein circuit — saturated violet, upper-surface placement (see buildOneWing).
  const veinEmis = 0x6a2cf6;
  const veinMat = new THREE.MeshStandardMaterial({ color: 0xb784ff, emissive: veinEmis, emissiveIntensity: veinI, flatShading: true, roughness: 0.35 });
  veinMat.userData.baseEmissive = veinEmis; veinMat.userData.baseIntensity = veinI;
  // Gem (brow) + nape-star share the jewel look; baseEmissive now MATCHES emissive so the surge
  // tick pulses the correct hue (was 0x8a44ff vs 0x6a34ea — a real mismatch).
  const gem = new THREE.MeshStandardMaterial({ color: 0xb784ff, emissive: veinEmis, emissiveIntensity: gemI, flatShading: true, roughness: 0.18 });
  gem.userData.baseEmissive = veinEmis; gem.userData.baseIntensity = gemI;
  const napeStar = new THREE.MeshStandardMaterial({ color: 0xb784ff, emissive: veinEmis, emissiveIntensity: napeI, flatShading: true, roughness: 0.18 });
  napeStar.userData.baseEmissive = veinEmis; napeStar.userData.baseIntensity = napeI;
  // f3 white-hot spar tips — the ONE clip-budget element (tiny footprint at chase distance).
  // NOT added to any spineMats array (must not join the surge tick, or Surge detonates to white).
  const sparTip = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffa028, emissiveIntensity: sparI, flatShading: true, roughness: 0.3 });
  // Eclipse corona: a DARK opaque moon-disk body wearing a thin saturated bicolour rim (violet +
  // ember) with gold bevels — jeweled, not a smoky additive halo. Rim mats also stay out of spineMats.
  const coronaDark = new THREE.MeshStandardMaterial({ color: 0x0d0a18, emissive: 0x0d0a18, emissiveIntensity: 0.05, flatShading: true, roughness: 0.7, metalness: 0.1 });
  const coronaRimV = new THREE.MeshStandardMaterial({ color: 0x9a5cff, emissive: veinEmis, emissiveIntensity: coronaI, flatShading: true, roughness: 0.34 });   // deepened lilac→true violet (was 0xb784ff, read pale under bloom)
  const coronaRimA = new THREE.MeshStandardMaterial({ color: 0xffb46a, emissive: 0xff8c1a, emissiveIntensity: coronaI, flatShading: true, roughness: 0.34 });   // saturated amber (was deep-amber 0xd4680f — too dark to read)
  return { bodyFlat, gold, goldHi, violet, violetMantle, membrane, memTiers, veinMat, gem, napeStar, sparTip, coronaDark, coronaRimV, coronaRimA, stage: st };
}

// Faceted loft: rings [{z, rx, ry, cy, cx?}] → one flat-shaded tube. cx = lateral centerline
// offset (for a curved/gesturing spine or tail).
function loftRings(rings, mat, N = 8, cap = true) {
  const P = (r, t) => [(r.cx ?? 0) + Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      // Wind OUTWARD (normals point away from the centerline) so flat-shaded facets light from
      // outside and match the end-caps — the old winding pointed normals inward → hollow read.
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

// Tapered facet cone, base at origin growing +Y (horns, pikes, prongs, studs).
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);
  return g;
}

// CATHEDRAL-ARCH wing profile (CP2 wow move): the rear top-line rises in a two-segment GULL
// arch — inner panel climbs steeply to a CARPAL APEX at t≈0.35 (above the crown), outer panel
// descends ~10° while sweeping out/back — so the silhouette reads M (twin spires enthroning the
// crowned head in the valley), not a flat V-kite. `archRise` 0→1 blends from the old linear
// dihedral (princeling glide) at 0 to the full arch at 1. Vertex-BAKED (survives the flap
// animator overwriting the pivot rotation). MUST be shared by the vault geometry AND the FX
// marker / wingElements tip (else wingtip trails + aero-shear detach from the moved tip).
function wingArchY(t, halfSpan, dih, archRise) {
  const x = t * halfSpan;
  const linear = x * Math.tan(dih) * (1 - archRise);   // old linear dihedral, fades as the arch takes over
  const arch = halfSpan * archRise * (t <= 0.35 ? Math.sin(t / 0.35 * Math.PI / 2) * 0.34 : 0.34 - (t - 0.35) * 0.18);
  return t * 0.30 + linear + arch;
}

// ── TORSO: 'regnalKeelTorso' ──────────────────────────────────────────────────
function buildRegnalKeelTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow, model.igniteStage);
  // Keel seams + mantle seam-bands flare with Surge; the nape-star / corona-rim stay OUT (own hue).
  const spineMats = [M.violet, M.violetMantle];
  const shoulderW = model.shoulderWidthScale ?? 1;

  // Horizontal keel body with a chest→waist→haunch→vent FLOW (convex-concave-convex belly +
  // a dorsal that dips at the waist and re-swells at the haunch) — not a constant-thickness dart.
  const body = [
    { z: -1.92, rx: 0.32 * shoulderW, ry: 0.42, cy: 0.16 },   // chest prow
    { z: -1.32, rx: 0.60 * shoulderW, ry: 0.74, cy: 0.08 },   // deep royal keel chest (belly drops low)
    { z: -0.74, rx: 0.72 * shoulderW, ry: 0.62, cy: 0.16 },   // shoulder yoke (widest)
    { z: -0.10, rx: 0.54, ry: 0.48, cy: 0.21 },
    { z: 0.42, rx: 0.42, ry: 0.39, cy: 0.24 },                // WAIST tuck (thinnest, belly tucks up)
    { z: 0.92, rx: 0.50, ry: 0.46, cy: 0.20 },                // HAUNCH re-swell (hip muscle)
    { z: 1.50, rx: 0.30, ry: 0.29, cy: 0.16 },
    { z: 1.98, rx: 0.16, ry: 0.16, cy: 0.14 },                // tail root
  ];
  group.add(loftRings(body, M.bodyFlat, seg(9)));

  // Proud up-forward neck (arcs UP to the head — no droop).
  const neck = [
    { z: -1.80, rx: 0.42, ry: 0.46, cy: 0.22 },
    { z: -2.20, rx: 0.34, ry: 0.37, cy: 0.40 },
    { z: -2.55, rx: 0.27, ry: 0.29, cy: 0.58 },
    { z: -2.85, rx: 0.21, ry: 0.22, cy: 0.72 },
  ];
  group.add(loftRings(neck, M.bodyFlat, seg(8), false));

  // Dorsal keel-ridge: one bold rank of faceted gold cuirass studs (swell-then-taper),
  // violet seam grooves between — reads as forged armor, never a flat white sticker.
  const shields = Math.round(model.keelShields ?? 5);
  for (let i = 0; i < shields; i++) {
    const t = i / Math.max(1, shields - 1);
    const z = -0.9 + t * 2.3;
    const h = 0.26 * (0.5 + Math.sin(Math.PI * (0.25 + 0.6 * t))) ;
    const topY = TORSO_Y + 0.42 * Math.max(0.2, 1 - Math.abs(z + 0.2) / 2.4);
    const stud = spike(h, 0.16 * (1 - 0.4 * t), 0.02, M.gold, 4);   // 4-facet gold chevron stud
    stud.position.set(0, topY, z);
    group.add(stud);
    if (i > 0) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), M.violet);
      seam.position.set(0, topY - 0.02, z - 0.28);
      group.add(seam);
    }
    // SPINE OF LIGHT (stage≥2): a saturated violet gem crowning each dorsal stud so the valley
    // between the wings is a lit ridge, not a black void from the chase cam (the eclipse-black body
    // keeps its dark mass; only the dorsal line lights). Part of the ignition ladder — dark until Radiant.
    if (M.stage >= 2) {
      // Scale up at Eternal (stage 3) so the spine of light carries the valley on its own at chase
      // distance rather than leaning on the corona (Fable round-2 polish).
      const gemR = (0.055 + 0.03 * (1 - t)) * (M.stage >= 3 ? 1.5 : 1);
      const gemCap = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), M.napeStar);
      gemCap.position.set(0, topY + h * 0.9, z);
      gemCap.scale.set(1, 1.3, 1);
      group.add(gemCap);
    }
  }

  // CORONA MANTLE — a WIDE solid gold dome over the shoulder yoke, spanning PAST the wing roots so
  // from the rear chase the back reads as one solid armored collar (no background gap = no ring/loop).
  // Horizontal violet emissive seam-bands. WITHHELD (CP2): gated on coronaValleys>0 — the Hatchling
  // and Kindled forms (valleys 0) have NO mantle, so the collar arrives with the crown (a rung of the
  // coronation ladder), and their dorsal seams stay the keel-shield violet (built above).
  const valleys = Math.round(model.coronaValleys ?? 5);
  const coronaPos = new THREE.Vector3(0, TORSO_Y + 0.24, -0.80);   // dorsal motif anchor (mantle/ring seat)
  const cw = 0.55 + 0.08 * valleys, dome = 0.30 + 0.02 * valleys, depth = 0.55;
  if (valleys > 0) {
    const corona = new THREE.Group();
    const domeGeo = new THREE.SphereGeometry(1, seg(12), seg(5), 0, Math.PI * 2, 0, Math.PI * 0.52);
    const domeMesh = new THREE.Mesh(domeGeo, M.gold);
    domeMesh.scale.set(cw, dome, depth);
    corona.add(domeMesh);
    for (let j = 1; j < valleys; j++) {                 // horizontal violet seam bands across the dome front
      const yy = (j / valleys) * dome * 0.9;
      const rr = cw * Math.sqrt(Math.max(0.05, 1 - (yy / dome) * (yy / dome)));
      const band = new THREE.Mesh(new THREE.BoxGeometry(rr * 1.7, 0.03, 0.05), M.violetMantle);
      band.position.set(0, yy, -depth * 0.75);
      corona.add(band);
    }
    corona.position.copy(coronaPos);
    group.add(corona);
  }

  // NAPE-STAR — a violet jewel octahedron on the mantle crest centerline (gated by the napeStar dial).
  // The REARWARD sigil: the brow star-gem faces away from the chase cam, so the king wears a second
  // star on the nape that the chase view actually reads. NOT in spineMats (stays its own saturated hue).
  const nape = model.napeStar ?? 0;
  if (nape > 0) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * (0.7 + 0.3 * nape), 0), M.napeStar);
    star.position.set(0, coronaPos.y + dome * 0.72, coronaPos.z - depth * 0.42);
    star.scale.set(1, 1.3, 1);
    group.add(star);
  }

  // ECLIPSE CORONA (coronaRing / Eternal only): an OPAQUE moon-disk annulus standing vertical behind
  // the shoulders, framed by the twin carpal spires with the crowned head enthroned in the valley
  // in front. Built as flat tris (NO torus): a dark matte body wearing a THIN saturated bicolour rim
  // (violet + ember, alternating facets) with gold inner bevels → eclipse-BY-CONSTRUCTION, not a smoky
  // additive halo. Rim mats stay OUT of spineMats (Surge would blow them to white).
  if ((model.coronaRing ?? 0) > 0) {
    const ring = new THREE.Group();
    // Radii: inner DARK moon-disk band [Ri..Rm] + a WIDE saturated RIM band [Rm..Ro] on the
    // CAMERA-FACING front face (the old build put the bright colour on the thin depth-edge, which is
    // edge-on to the rear-chase cam → near-invisible). Now the glowing rose-window rim faces the cam.
    const Ro = 1.10, Rm = 0.90, Ri = 0.78, d = 0.10, N = 12;
    const pt = (r, ang, z) => [Math.cos(ang) * r, Math.sin(ang) * r, z];
    const darkT = [], vT = [], aT = [], goldT = [];
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      // front face, inner dark annulus [Ri..Rm]
      const iF0 = pt(Ri, a0, d / 2), mF0 = pt(Rm, a0, d / 2), mF1 = pt(Rm, a1, d / 2), iF1 = pt(Ri, a1, d / 2);
      darkT.push([iF0, mF0, mF1], [iF0, mF1, iF1]);
      // front face, OUTER saturated rim annulus [Rm..Ro] — alternating violet/amber, faces the cam
      const oF0 = pt(Ro, a0, d / 2), oF1 = pt(Ro, a1, d / 2);
      const rim = (i % 2 === 0) ? vT : aT;
      rim.push([mF0, oF0, oF1], [mF0, oF1, mF1]);
      // back face (all dark) + outer depth band (dark, so only the front rim glows)
      const iB0 = pt(Ri, a0, -d / 2), oB0 = pt(Ro, a0, -d / 2), oB1 = pt(Ro, a1, -d / 2), iB1 = pt(Ri, a1, -d / 2);
      darkT.push([iB0, oB1, oB0], [iB0, iB1, oB1]);
      darkT.push([oF0, oB0, oB1], [oF0, oB1, oF1]);
      goldT.push([iF0, iB1, iB0], [iF0, iF1, iB1]);       // inner bevel (gold)
    }
    ring.add(flatTriMesh(darkT, M.coronaDark));
    ring.add(flatTriMesh(vT, M.coronaRimV));
    ring.add(flatTriMesh(aT, M.coronaRimA));
    ring.add(flatTriMesh(goldT, M.goldHi));
    ring.position.set(0, TORSO_Y + 0.92, -0.72);
    ring.rotation.x = -0.21;   // tilt ~12° forward (top leans toward the head)
    group.add(ring);
  }

  // Shoulder fairings — body-flat fillets from each wing root inboard to the neck base, so no
  // background survives between neck, mantle and wing roots in the rear-chase read.
  for (const s of [1, -1]) {
    const fair = flatTriMesh([[[s * 0.55, TORSO_Y + 0.4, -0.8], [s * 0.12, TORSO_Y + 0.32, -1.5], [s * 0.5, TORSO_Y + 0.2, -0.5]]], M.bodyFlat);
    group.add(fair);
  }
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(coronaPos);
  group.add(motifAnchor);

  // Line-of-action S: head high → neck down → level body → tail DIPS below the line → tip RISES.
  const spinePoints = [
    new THREE.Vector3(0, 0.72, -2.85), new THREE.Vector3(0, 0.40, -1.6),
    new THREE.Vector3(0, 0.24, -0.5), new THREE.Vector3(0, 0.22, 0.6),
    new THREE.Vector3(0, 0.02, 2.9), new THREE.Vector3(0, 0.32, 4.9),
  ];
  const wro = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.55 * shoulderW) * side, y: TORSO_Y + 0.40 + (wro.y ?? 0), z: -0.80 + (wro.z ?? 0) }),
    headBase: { x: 0, y: 0.72, z: -2.95 },
    tailAnchor: { y: 0.15, z: 1.95 },
    keelTopAt: (z) => TORSO_Y + 0.55 * Math.max(0, 1 - Math.abs(z + 0.5) / 2.6),
    halfWidthAt: (z) => 0.66 * Math.max(0.2, 1 - Math.abs(z + 0.4) / 3.2),
    bodyMidY: TORSO_Y, tailShift: 0,
    riderSocket: { x: 0, y: 0.85, z: -0.3 },
    motifAnchor,
  };
  // coreGlow MUST be a mesh/null — the orchestrator builds the real back-glow sprite (with the
  // userData.base the flight tick reads) only when this is falsy. Returning def.coreGlow (a color
  // NUMBER) makes it skip that and then crash on coreGlow.userData.base every frame.
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.bodyFlat }, coreGlow: null };
}
registerTorso('regnalKeelTorso', buildRegnalKeelTorso);

// ── WINGS: 'lanceVaultWings' ──────────────────────────────────────────────────
// One canonical +X wing (arm + pike rank over a SOLID cambered crimson vault), mirrored
// for the left; dihedral raises the tips into the rear cathedral arch.
function buildOneWing(M, dials, dih) {
  const wg = new THREE.Group();
  const { fingers, pikes, halfSpan, archRise, carpalLance, pinionSlots } = dials;
  const rootChord = 2.7, tipChord = 0.5, sweepZ = halfSpan * 0.28;
  // Built CANONICAL (+X); the left wing is a scale.x=-1 mirror of this (in buildLanceVaultWings)
  // so the shared flap animator's MIRRORED poses land symmetric (it feeds L/R opposite rotations,
  // expecting mirror-image geometry). The ARCH is baked into the vertices (y follows wingArchY) so
  // the rear cathedral silhouette survives the animator overwriting the pivot rotation each frame.
  const L = (t) => [t * halfSpan, wingArchY(t, halfSpan, dih, archRise), -0.10 + t * sweepZ];
  const chordAt = (t) => rootChord * (1 - t) + tipChord * t;

  // FINGER STATIONS marching along the arm; each finger a rib from leading edge back to a tip.
  const st = [];
  for (let f = 0; f <= fingers; f++) {
    const t = f / fingers, l = L(t), c = chordAt(t);
    st.push({ l, t, c, tip: [l[0], l[1] - 0.06 * c, l[2] + c] });
  }
  // thin tube between two points (branch veinlets) laid PROUD of the membrane.
  const tube = (a, b, r, mat) => { const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = dir.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg(3)), mat); m.geometry.translate(0, len / 2, 0); m.position.set(a[0], a[1], a[2]); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); return m; };
  const lift = (p, dy) => [p[0], p[1] + dy, p[2]];

  // VAULT BAYS between consecutive fingers — cambered (cupped), scalloped trailing edge,
  // deeper V-gaps on the outer two bays. Each bay = a fan around a lifted camber center.
  for (let f = 0; f < fingers; f++) {
    const A = st[f], B = st[f + 1];
    const chord = (A.c + B.c) / 2;
    // scallop swell-then-taper (×0.9/step), deeper true V-gap on the outer two bays.
    const scallop = (0.24 * Math.pow(0.9, f) + (f >= fingers - 2 ? 0.34 : 0)) * chord;
    const mid = [(A.tip[0] + B.tip[0]) / 2, (A.tip[1] + B.tip[1]) / 2 - 0.04, (A.tip[2] + B.tip[2]) / 2 - scallop];
    // DEEP cup: drop the bay center well below the rim so rim light pools (a vault, not a flat pleat).
    const ctr = [(A.l[0] + B.l[0] + A.tip[0] + B.tip[0]) / 4, (A.l[1] + B.l[1]) / 2 - 0.26 * chord, (A.l[2] + B.l[2] + A.tip[2] + B.tip[2]) / 4];
    // value tier: root bay darkest → outer bay ember (law 11 + the ignition ember gradient).
    const bayMat = M.memTiers[Math.min(M.memTiers.length - 1, f)];
    // PINION SLOTS: on the outer `pinionSlots` bays, DROP the two trailing-edge center tris so a
    // see-through gap splits the wingtip into separated finger-vanes (spread-primaries) — kills the
    // solid-blob read from the chase cam. Negative tris; membrane is DoubleSide so the slot shows sky.
    const slotted = pinionSlots > 0 && f >= fingers - pinionSlots;
    const bayTris = slotted
      ? [[A.l, B.l, ctr], [B.l, B.tip, ctr], [A.tip, A.l, ctr]]                     // trailing scallop pair omitted → open slot
      : [[A.l, B.l, ctr], [B.l, B.tip, ctr], [B.tip, mid, ctr], [mid, A.tip, ctr], [A.tip, A.l, ctr]];
    wg.add(flatTriMesh(bayTris, bayMat));
    // BRANCH VEINLETS across the bay's UPPER face toward the trailing scallop — the "stained-glass
    // circuit" the chase cam (behind+above) reads. Fork from the outer finger line at 40%/70% chord.
    // Skip the innermost bay so no vein crosses the body from the top-down/planform read.
    if (f >= 1) for (const u of [0.4, 0.7]) {
      const p = [B.l[0] + (B.tip[0] - B.l[0]) * u, B.l[1] + (B.tip[1] - B.l[1]) * u, B.l[2] + (B.tip[2] - B.l[2]) * u];
      wg.add(tube(lift(p, 0.035), lift(mid, 0.03), 0.013, M.veinMat));
    }
  }

  // Gold armored leading spar (thick root → thin tip). The OUTERMOST segment goes white-hot at f3.
  for (let f = 0; f < fingers; f++) {
    const a = st[f].l, b = st[f + 1].l;
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = dir.length();
    const sparMat = (M.stage >= 3 && f === fingers - 1) ? M.sparTip : M.gold;
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * (1 - (f + 1) / fingers) + 0.02, 0.11 * (1 - f / fingers) + 0.02, len, seg(5)), sparMat);
    spar.geometry.translate(0, len / 2, 0);
    spar.position.set(a[0], a[1], a[2]);
    spar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    wg.add(spar);
  }
  // Finger ribs (gold) + a BOLD violet starlight vein running each finger line — now seated ABOVE
  // the rib (proud of the upper surface) so the rear-chase cam actually catches it (it used to sit
  // 0.02 BELOW the rib, occluded from above). The Eclipse identity, emissive-on-opaque.
  for (let f = 1; f <= fingers; f++) {
    const A = st[f];
    const dir = new THREE.Vector3(A.tip[0] - A.l[0], A.tip[1] - A.l[1], A.tip[2] - A.l[2]);
    const len = dir.length();
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.03, len, seg(4)), M.gold);
    rib.geometry.translate(0, len / 2, 0);
    rib.position.set(A.l[0], A.l[1], A.l[2]);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    rib.quaternion.copy(q);
    wg.add(rib);
    if (f >= 2) {   // skip the innermost vein so it never draws a line across the body (top-down)
      const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.036, len * 0.8, seg(3)), M.veinMat);
      vein.geometry.translate(0, len * 0.4, 0);
      vein.position.set(A.l[0], A.l[1] + 0.025, A.l[2]);   // PROUD of the rib (was −0.02)
      vein.quaternion.copy(q);
      wg.add(vein);
    }
  }

  // helper: socket a stage-gated jewel at a raked spike's TRUE rotated tip (applyEuler on (0,len,0)
  // in the pike's own frame — the hand-offset version floated the caps free = the old "motes" bug).
  const tipJewel = (l, len, rot, r) => {
    if (M.stage < 2) return;
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), M.veinMat);
    // Seat the jewel at 0.9× the blade length (not the exact 1.0 tip) so it OVERLAPS the spike and
    // reads welded — at the exact tip a point-narrow spike + a centred octahedron left a visible gap
    // (the "floating gem" Fable flagged), worst in the pure-white silhouette.
    const tipLocal = new THREE.Vector3(0, len * 0.9, 0).applyEuler(rot);
    cap.position.set(l[0] + tipLocal.x, l[1] + tipLocal.y, l[2] + tipLocal.z);
    wg.add(cap);
  };

  // ── TWIN CARPAL LANCE — the scale-hierarchy ANCHOR (the M's spire). ONE dominant pike per wing at
  // the carpal apex (t≈0.35), thick swell base, raked up-back so it breaks the skyline ABOVE the
  // crown and FRAMES the eclipse-corona valley. White-hot spar tip at f3. ~2.6× the largest rank pike.
  if (carpalLance > 0) {
    const t = 0.35, l = L(t);
    const clen = halfSpan * 0.212 * carpalLance;
    const rot = new THREE.Euler(-0.45, 0, -0.18);
    const lance = spike(clen, 0.22, 0.01, M.stage >= 3 ? M.sparTip : M.goldHi, 5);
    lance.position.set(l[0], l[1], l[2]);
    lance.rotation.copy(rot);
    wg.add(lance);
    tipJewel(l, clen, rot, 0.07);
  }

  // Pike rank — DEMOTED behind the carpal: re-stationed OUTBOARD of the lance, steeper 0.62^i decay
  // so the rank reads LANCE → step → step → tip (a scale hierarchy), not a picket fence of equals.
  for (let i = 0; i < pikes; i++) {
    const t = 0.44 + 0.28 * (i / Math.max(1, pikes - 1 || 1));
    const l = L(t);
    const plen = halfSpan * 0.24 * Math.pow(0.62, i);
    const rot = new THREE.Euler(-0.65, 0, -0.3);         // rake up-and-forward off the arm
    const pk = spike(plen, 0.12, 0.012, M.goldHi, 4);    // bold base (swell-then-taper blade)
    pk.position.set(l[0], l[1], l[2]);
    pk.rotation.copy(rot);
    wg.add(pk);
    tipJewel(l, plen, rot, 0.055);
  }
  // Terminal wingtip finger — LONGER (0.40 span) + swept UP ~15° so the outer extreme rakes into the
  // rear frame (a fingered pinion tip, not a stubby cap). White-hot at f3 (the silhouette's outer point).
  const tp = L(1);
  const ts = spike(halfSpan * 0.40, 0.06, 0.005, M.stage >= 3 ? M.sparTip : M.goldHi, 4);
  ts.position.set(tp[0], tp[1], tp[2]);
  ts.rotation.z = -Math.PI / 2 + 0.26;   // was −PI/2−0.05 (flat out) → now swept up ~15°
  wg.add(ts);
  return wg;
}

function buildLanceVaultWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow, model.igniteStage);
  const fingers = Math.round(model.vaultFingers ?? 5);
  const pikes = Math.round(model.pikeCount ?? 3);
  const halfSpan = (model.spanScale ?? 1) * 4.3;
  const dih = ((model.dihedral ?? 20) * Math.PI) / 180;
  const archRise = model.archRise ?? 1;         // 0 (linear princeling glide) → 1 (full cathedral arch)
  const carpalLance = model.carpalLance ?? 2.6; // twin-spire length× (0 = none)
  const pinionSlots = Math.round(model.pinionSlots ?? 2);
  const dials = { fingers, pikes, halfSpan, archRise, carpalLance, pinionSlots };

  const pivots = {}, wingElements = [];
  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    // pivot → mid → tip: the flap rig (dragon.js poseWing) drives all three; publishing them is
    // MANDATORY or the direct-flap path null-derefs wingTip* and the dragon fails to select.
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    const mid = new THREE.Group(); mid.userData.wingRole = 'mid';
    const tip = new THREE.Group(); tip.userData.wingRole = 'tip';
    pivot.add(mid); mid.add(tip);
    mid.add(buildOneWing(M, dials, dih));   // canonical +X geometry; dihedral baked in
    if (side === -1) pivot.scale.x = -1;    // left = mirror image → the animator's mirrored poses read SYMMETRIC
    group.add(pivot);
    // side +1 = +X = RIGHT (axis convention right=+X, matching attach.wingRoot and every other
    // wing builder: R=buildWingSide(1)). The animator drives turn-banking + rollFold through the
    // R/L handles, so mislabelling would tuck/open the physical wings backwards on a hard bank.
    const s = side === 1 ? 'R' : 'L';
    // wingtip FX marker at the real outer tip (canonical +X frame; the scale.x=-1 mirrors it for
    // the left) — parented to `mid` so it rides the flap. Without it dragon.js sees hasWingFx=false
    // and skips the universal wingtip trails + hard-bank aero-shear.
    const marker = new THREE.Object3D();
    // MUST use the arch profile (was the old linear tan(dih)) or the universal wingtip trails +
    // hard-bank aero-shear detach from the tip the cathedral arch actually raised it to.
    const tipY = wingArchY(1, halfSpan, dih, archRise);
    marker.position.set(halfSpan, tipY, -0.10 + halfSpan * 0.28);
    mid.add(marker);
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    pivots['tipMarker' + s] = marker;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + tipY, root.z + halfSpan * 0.34], length: halfSpan, tipObj: marker });
  }
  return { group, spineMats: [M.violet], wingMat: M.membrane, parts: { ...pivots, wingElements } };
}
registerWings('lanceVaultWings', buildLanceVaultWings);

// ── HEAD: 'eclipseCrownHead' ──────────────────────────────────────────────────
function buildEclipseCrownHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow, model.igniteStage);
  const spineMats = [M.violet];
  const hs = model.headScale ?? 1;
  const eyeMat = mats.eyeMat;

  // Royal wedge skull — a strong flat brow (where the crown + gem live) breaking to a SHORT
  // tapered muzzle (not a pterosaur beak), pointing −Z.
  const skull = [
    { z: 0.42, rx: 0.30 * hs, ry: 0.34 * hs, cy: 0.04 },   // occiput
    { z: 0.00, rx: 0.36 * hs, ry: 0.34 * hs, cy: 0.05 },   // brow (widest, flat top)
    { z: -0.45, rx: 0.28 * hs, ry: 0.26 * hs, cy: 0.00 },  // cheek
    { z: -0.85, rx: 0.16 * hs, ry: 0.15 * hs, cy: -0.06 }, // short muzzle
    { z: -1.10, rx: 0.08 * hs, ry: 0.08 * hs, cy: -0.09 }, // muzzle tip
  ];
  group.add(loftRings(skull, M.bodyFlat, seg(7)));
  const headLength = 1.5 * hs;

  // Horns: 2 long lance-horns (base mass) + back-swept crown-horns.
  const crown = Math.round(model.crownHorns ?? 4);
  const hornLenDial = model.hornLen ?? 1.7;
  const hlen = hornLenDial * 0.7 * hs;
  // CP2 crown verticality: as the horn ladder climbs (1.7→2.1), STEEPEN the lance rake (0.7→0.55)
  // so the tall Eternal horns rise more vertically into the rear skyline instead of raking flat.
  const lanceRake = 0.7 - 0.15 * Math.max(0, Math.min(1, (hornLenDial - 1.7) / 0.4));
  for (const side of [1, -1]) {
    const lance = spike(hlen, 0.07 * hs, 0.006, M.goldHi, 5);
    lance.position.set(side * 0.18 * hs, 0.24 * hs, 0.18);
    lance.rotation.x = lanceRake; lance.rotation.z = -side * 0.22;
    group.add(lance);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * hs, 0.11 * hs, 0.08 * hs, seg(6)), M.gold);
    collar.position.copy(lance.position); collar.rotation.x = lanceRake + Math.PI / 2; collar.rotation.z = -side * 0.22;
    group.add(collar);
    for (let c = 0; c < Math.max(0, crown - 2); c++) {
      const ch = spike(hlen * (0.55 - c * 0.12), 0.045 * hs, 0.006, M.gold, 4);
      ch.position.set(side * (0.20 + c * 0.09) * hs, 0.18 * hs, 0.30 + c * 0.12);
      ch.rotation.x = 1.3; ch.rotation.z = -side * (0.4 + c * 0.22);
      group.add(ch);
    }
  }
  // Central OCCIPITAL spike (crown≥4 / Eternal): a short third peak on the skull centerline →
  // the crown reads a 3-PEAK skyline (two lances + one central) from the chase cam, not a symmetric V.
  if (crown >= 4) {
    const occ = spike(hlen * 0.62, 0.05 * hs, 0.005, M.goldHi, 5);
    occ.position.set(0, 0.26 * hs, 0.30);
    occ.rotation.x = 0.85;   // rake back over the nape
    group.add(occ);
  }

  // STAR-GEM motif (brow center): big faceted violet octahedron in a gold setting. A GEM — never opens.
  // WITHHELD REGALIA (CP2): the gem + bezel are ABSENT until starGemBloom>0 (the Hatchling has no
  // crown-jewel — the ladder confers it). Uses M.gem DIRECTLY (its emissiveIntensity is the
  // stage-gated gemI ladder [0,0.9,1.8,2.9]) — no hardcoded 2.6 clone that ignored the ignition ramp.
  const bloom = model.starGemBloom ?? 1;
  const gy = 0.24 * hs, gz = -0.16 * hs;   // proud on the brow, forward + up so it reads face-on
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.set(0, gy, gz); group.add(motifAnchor);
  if (bloom > 0) {
    const gemR = (0.13 + 0.07 * bloom) * hs;
    // Thin flat gold bezel RING behind the gem (frames it — does not out-shine it).
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(gemR * 1.25, gemR * 0.16, seg(3), 8), M.goldHi);
    bezel.position.set(0, gy, gz - 0.02 * hs); bezel.rotation.x = 0.15;
    group.add(bezel);
    spineMats.push(M.gem);
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), M.gem);
    gem.position.set(0, gy, gz); gem.scale.set(1, 1.25, 1);
    group.add(gem);
  }

  // Eyes — warm gold almond, emissive, the second-brightest facial points after the gem.
  const es = model.eyeScale ?? 1;
  const eCol = def.eye ?? 0xe0bc78;
  // deeper gold EMISSIVE so it reads gold (a light-gold emissive clips to white); high-set almond.
  const goldEye = new THREE.MeshStandardMaterial({ color: eCol, emissive: 0xc07a1e, emissiveIntensity: 1.6, flatShading: true, roughness: 0.32, metalness: 0.2 });
  goldEye.userData.baseEmissive = 0xc07a1e; goldEye.userData.baseIntensity = 1.6; spineMats.push(goldEye);
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.11 * hs * es, 0), goldEye);
    eye.position.set(side * 0.25 * hs, 0.09 * hs, -0.28 * hs); eye.scale.set(1.6, 0.7, 1);
    group.add(eye);
  }

  // Tusks (inspect view, forms 2–3).
  const tusk = model.tuskScale ?? 0;
  if (tusk > 0) for (const side of [1, -1]) {
    const t = spike(0.2 * tusk * hs, 0.03 * hs, 0.004, M.goldHi, 4);
    t.position.set(side * 0.13 * hs, -0.10 * hs, -0.7 * hs);
    t.rotation.x = -0.7; t.rotation.z = side * 0.25;
    group.add(t);
  }
  return { group, spineMats, motifAnchor, headLength };
}
registerHead('eclipseCrownHead', buildEclipseCrownHead);

// ── TAIL: 'scepterWhipTail' ('scepter' style) ─────────────────────────────────
function buildScepterWhipTail(def, model, mats, anchor) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow, model.igniteStage);
  const a = anchor ?? { y: 0.15, z: 1.95 };
  const nSeg = Math.round(model.tailSegments ?? 9);
  const T = (model.tailLength ?? 1) * 3.0;
  const rootR = 0.20;
  // Line-of-action S: the tail dips below the root line then RISES so the tip lifts. CP2 BANNER lift
  // (tailRise 0→1): steepen the final climb (0.09→0.20 coeff) so the scepter crescent rises into the
  // rear chase frame instead of trailing flat. Motion note: the raised tip must not whip across the
  // camera on the idle coil (owner verifies live). curveX/rAt unchanged.
  const tailRise = model.tailRise ?? 0;
  const curveY = (t) => -0.11 * T * Math.sin(Math.PI * t * 0.9) + (0.09 + 0.11 * tailRise) * T * t;
  const curveX = (t) => 0.05 * T * Math.max(0, t - 0.45) * Math.max(0, t - 0.45);
  const rAt = (t) => rootR * Math.pow(1 - t * 0.93, 0.7) + 0.012;
  const P = (t) => ({ x: curveX(t), y: a.y + curveY(t), z: a.z + t * T, r: rAt(t) });

  // NESTED segment chain along the path → the gentle idle coil (dragon.js isBone/rotation branch,
  // azure-style, NOT astralWyrm's body undulation) BENDS the whole tail smoothly. Rotation-only
  // (no position writes) so a connected loft never tears; the S-curve REST shape is fully preserved
  // (encoded in the joint offsets). This ADDS motion; it does not change the tail's look.
  const nChain = 4;
  const segs = [];
  let parent = group, prev = { x: 0, y: 0, z: 0 };
  const jointT = (s) => Math.round(s * nSeg / nChain) / nSeg;
  for (let s = 0; s < nChain; s++) {
    const i0 = Math.round(s * nSeg / nChain), i1 = Math.round((s + 1) * nSeg / nChain);
    const j = P(jointT(s));
    const sg = new THREE.Group();
    sg.position.set(j.x - prev.x, j.y - prev.y, j.z - prev.z);
    parent.add(sg);
    const local = [];
    for (let i = i0; i <= i1; i++) { const p = P(i / nSeg); local.push({ z: p.z - j.z, rx: p.r, ry: p.r, cy: p.y - j.y, cx: p.x - j.x }); }
    sg.add(loftRings(local, M.bodyFlat, seg(6), false));
    segs.push(sg); parent = sg; prev = j;
  }
  segs[0].isBone = true;   // drive by ROTATION → a gentle idle coil bends the tail (never tears it)

  // Dorsal fins (unchanged shape), each parented to its segment so it sways with the tail.
  const fins = Math.round(model.tailFins ?? 4);
  for (let k = 0; k < fins; k++) {
    const t = 0.15 + 0.6 * (k / Math.max(1, fins - 1));
    const p = P(t), rr = p.r, fh = (2.0 * rr + 0.05) * Math.pow(0.82, k);
    const si = Math.min(nChain - 1, Math.floor(t * nChain)), sj = P(jointT(si));
    const fin = flatTriMesh([[[p.x - sj.x, p.y - sj.y + rr, p.z - sj.z - rr * 1.2], [p.x - sj.x, p.y - sj.y + rr, p.z - sj.z + rr * 1.2], [p.x - sj.x, p.y - sj.y + rr + fh, p.z - sj.z]]], M.gold);
    segs[si].add(fin);
  }

  // Scepter crescent + captive star at the risen tip, in the LAST segment's local frame.
  const tip = P(1), lj = P(jointT(nChain - 1)), tipG = segs[nChain - 1];
  const lx = tip.x - lj.x, ly = tip.y - lj.y, lz = tip.z - lj.z;
  const bloom = model.crescentBloom ?? 1;
  const spread = 0.4 + 0.3 * bloom, plen = 0.6 * (0.4 + 0.6 * bloom);
  for (const side of [1, -1]) {
    const prong = spike(plen, 0.05, 0.008, M.goldHi, 4);
    prong.position.set(lx, ly, lz);
    prong.rotation.x = -1.2; prong.rotation.z = side * spread; prong.rotation.y = 0.35;
    tipG.add(prong);
  }
  if (bloom > 0.4) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.085 * bloom, 0), M.gem);
    // Seat the captive star DOWN in the crescent crotch so it overlaps the prong bases (welded), not
    // floating free above the barb (the isolated speck Fable flagged in side/rear-¾/top views).
    star.position.set(lx, ly + plen * 0.24, lz + plen * 0.12);
    tipG.add(star);
  }
  return { group, segs, accentMats: [M.violet, M.gem] };
}
registerTail('scepterWhipTail', buildScepterWhipTail);
