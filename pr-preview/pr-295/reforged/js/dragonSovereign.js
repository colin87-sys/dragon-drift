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

function sovereignMats(def, glow) {
  const g = Math.min(glow ?? 1, 1.3);
  // Body carries a faint indigo emissive floor so the king's body doesn't vanish to pure black
  // on dark skies (polish note 4) — still opaque, degrades with glowLevel-independent lighting.
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x080b14, emissive: 0x0c1322, emissiveIntensity: 0.07, flatShading: true, roughness: 0.66, metalness: 0.12 });
  // Golds: LOWER metalness + a warm emissive floor so shadowed/away-facing facets stay warm gold
  // instead of going olive-drab (metallic gold with no environment to reflect reads green — polish note 1).
  const gCol = def.scales ?? GOLD, ghCol = def.horn ?? GOLD_HI;
  const gold = new THREE.MeshStandardMaterial({ color: gCol, flatShading: true, roughness: 0.42, metalness: 0.5, emissive: gCol, emissiveIntensity: 0.14 });
  const goldHi = new THREE.MeshStandardMaterial({ color: ghCol, flatShading: true, roughness: 0.36, metalness: 0.52, emissive: ghCol, emissiveIntensity: 0.13 });
  const vCol = def.apexSeam ?? VIOLET;              // diffuse accent (light blue-violet)
  const vEmis = 0x5a2ce0;                            // cooler blue-violet emissive — survives bloom without drifting magenta
  // (bright + light emissive clips to white under ACES; a saturated hue holds the arcane read)
  const violet = new THREE.MeshStandardMaterial({ color: vCol, emissive: vEmis, emissiveIntensity: 1.5 * g, flatShading: true, roughness: 0.4 });
  violet.userData.baseEmissive = vEmis; violet.userData.baseIntensity = 1.5 * g;
  // Membrane VALUE TIERS (root dark → outer lighter crimson) — law 11, so the vault isn't a
  // flat sticker. Each bay picks its tier by finger index.
  const mem = (col) => { const m = new THREE.MeshStandardMaterial({ color: col, emissive: def.wingEmissive ?? 0x7a1622, emissiveIntensity: 0.22 * g, flatShading: true, roughness: 0.76, side: THREE.DoubleSide }); m.userData.baseEmissive = def.wingEmissive ?? 0x7a1622; m.userData.baseIntensity = 0.22 * g; return m; };
  const memTiers = [mem(0x45120e), mem(0x5a160e), mem(0x7a1622), mem(0x9c2233)];   // root→outer
  const membrane = memTiers[2];
  // BRIGHT starlight-vein emissive — must read violet at capture distance.
  const veinMat = new THREE.MeshStandardMaterial({ color: 0xb784ff, emissive: 0x6a34ea, emissiveIntensity: 2.6 * g, flatShading: true, roughness: 0.35 });
  veinMat.userData.baseEmissive = 0x8a44ff; veinMat.userData.baseIntensity = 2.6 * g;
  const gem = new THREE.MeshStandardMaterial({ color: 0xb784ff, emissive: 0x6a34ea, emissiveIntensity: 1.1 * g, flatShading: true, roughness: 0.18 });
  gem.userData.baseEmissive = 0x8a44ff; gem.userData.baseIntensity = 1.5 * g;
  return { bodyFlat, gold, goldHi, violet, membrane, memTiers, veinMat, gem };
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
      tris.push([P(a, t0), P(b, t0), P(b, t1)], [P(a, t0), P(b, t1), P(a, t1)]);
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

// ── TORSO: 'regnalKeelTorso' ──────────────────────────────────────────────────
function buildRegnalKeelTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const spineMats = [M.violet, M.gem];
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
  }

  // CORONA MANTLE (rear motif carrier): ONE solid faceted gold crescent shield on the dorsal
  // yoke between the wing roots — convex to the rear cam, violet emissive seam-valleys. NEVER a ring.
  const valleys = Math.round(model.coronaValleys ?? 5);
  // CORONA MANTLE — a WIDE solid gold dome over the shoulder yoke, spanning PAST the wing roots
  // so from the rear chase the back reads as one solid armored collar (no background gap = no
  // ring/loop). Horizontal violet emissive seam-bands. The wings + neck emerge from it.
  const cw = 0.55 + 0.08 * valleys, dome = 0.30 + 0.02 * valleys, depth = 0.55;
  const corona = new THREE.Group();
  const domeGeo = new THREE.SphereGeometry(1, seg(12), seg(5), 0, Math.PI * 2, 0, Math.PI * 0.52);
  const domeMesh = new THREE.Mesh(domeGeo, M.gold);
  domeMesh.scale.set(cw, dome, depth);
  corona.add(domeMesh);
  for (let j = 1; j < valleys; j++) {                 // horizontal violet seam bands across the dome front
    const yy = (j / valleys) * dome * 0.9;
    const rr = cw * Math.sqrt(Math.max(0.05, 1 - (yy / dome) * (yy / dome)));
    const band = new THREE.Mesh(new THREE.BoxGeometry(rr * 1.7, 0.03, 0.05), M.violet);
    band.position.set(0, yy, -depth * 0.75);
    corona.add(band);
  }
  corona.position.set(0, TORSO_Y + 0.24, -0.80);
  group.add(corona);
  // Shoulder fairings — body-flat fillets from each wing root inboard to the neck base, so no
  // background survives between neck, mantle and wing roots in the rear-chase read.
  for (const s of [1, -1]) {
    const fair = flatTriMesh([[[s * 0.55, TORSO_Y + 0.4, -0.8], [s * 0.12, TORSO_Y + 0.32, -1.5], [s * 0.5, TORSO_Y + 0.2, -0.5]]], M.bodyFlat);
    group.add(fair);
  }
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(corona.position);
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
  const { fingers, pikes, halfSpan } = dials;
  const rootChord = 2.7, tipChord = 0.5, sweepZ = halfSpan * 0.28;
  // Built CANONICAL (+X); the left wing is a scale.x=-1 mirror of this (in buildLanceVaultWings)
  // so the shared flap animator's MIRRORED poses land symmetric (it feeds L/R opposite rotations,
  // expecting mirror-image geometry). DIHEDRAL is baked into the vertices (y rises with x) so the
  // rear arch survives the animator overwriting the pivot rotation each frame.
  const L = (t) => { const x = t * halfSpan; return [x, t * 0.30 + x * Math.tan(dih), -0.10 + t * sweepZ]; };
  const chordAt = (t) => rootChord * (1 - t) + tipChord * t;

  // FINGER STATIONS marching along the arm; each finger a rib from leading edge back to a tip.
  const st = [];
  for (let f = 0; f <= fingers; f++) {
    const t = f / fingers, l = L(t), c = chordAt(t);
    st.push({ l, t, c, tip: [l[0], l[1] - 0.06 * c, l[2] + c] });
  }
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
    // value tier: root bay darkest → outer bay lightest crimson (law 11).
    const bayMat = M.memTiers[Math.min(M.memTiers.length - 1, f)];
    wg.add(flatTriMesh([[A.l, B.l, ctr], [B.l, B.tip, ctr], [B.tip, mid, ctr], [mid, A.tip, ctr], [A.tip, A.l, ctr]], bayMat));
  }

  // Gold armored leading spar (thick root → thin tip).
  for (let f = 0; f < fingers; f++) {
    const a = st[f].l, b = st[f + 1].l;
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = dir.length();
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * (1 - (f + 1) / fingers) + 0.02, 0.11 * (1 - f / fingers) + 0.02, len, seg(5)), M.gold);
    spar.geometry.translate(0, len / 2, 0);
    spar.position.set(a[0], a[1], a[2]);
    spar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    wg.add(spar);
  }
  // Finger ribs (gold) + a BOLD violet starlight vein running the length of each finger line
  // (bright near the leading root, fading to the tip) — the Eclipse identity, emissive-on-opaque.
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
      vein.position.set(A.l[0], A.l[1] - 0.02, A.l[2]);
      vein.quaternion.copy(q);
      wg.add(vein);
    }
  }

  // Pike rank — 3 bold swell-then-taper blades socketed into the arm, rake up-forward.
  for (let i = 0; i < pikes; i++) {
    const t = 0.28 + 0.36 * (i / Math.max(1, pikes - 1 || 1));
    const l = L(t);
    const plen = halfSpan * 0.30 * Math.pow(0.82, i);
    const pk = spike(plen, 0.15, 0.012, M.goldHi, 4);   // bold base (swell-then-taper blade)
    pk.position.set(l[0], l[1], l[2]);
    pk.rotation.x = -0.65; pk.rotation.z = -0.3;         // rake up-and-forward off the arm
    wg.add(pk);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), M.violet);
    cap.position.set(l[0] - plen * 0.3, l[1] + plen * 0.62, l[2] - plen * 0.38);
    wg.add(cap);
  }
  // Terminal wingtip spike.
  const tp = L(1);
  const ts = spike(halfSpan * 0.24, 0.06, 0.005, M.goldHi, 4);
  ts.position.set(tp[0], tp[1], tp[2]);
  ts.rotation.z = -Math.PI / 2 - 0.05;
  wg.add(ts);
  return wg;
}

function buildLanceVaultWings(def, model, attach, _giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const fingers = Math.round(model.vaultFingers ?? 5);
  const pikes = Math.round(model.pikeCount ?? 3);
  const halfSpan = (model.spanScale ?? 1) * 4.3;
  const dih = ((model.dihedral ?? 20) * Math.PI) / 180;
  const dials = { fingers, pikes, halfSpan };

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
    const s = side === 1 ? 'L' : 'R';
    pivots['wingPivot' + s] = pivot; pivots['wingMid' + s] = mid; pivots['wingTip' + s] = tip;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + halfSpan * Math.tan(dih), root.z + halfSpan * 0.34], length: halfSpan });
  }
  return { group, spineMats: [M.violet], wingMat: M.membrane, parts: { ...pivots, wingElements } };
}
registerWings('lanceVaultWings', buildLanceVaultWings);

// ── HEAD: 'eclipseCrownHead' ──────────────────────────────────────────────────
function buildEclipseCrownHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const spineMats = [M.violet, M.gem];
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
  const hlen = (model.hornLen ?? 1.7) * 0.7 * hs;
  for (const side of [1, -1]) {
    const lance = spike(hlen, 0.07 * hs, 0.006, M.goldHi, 5);
    lance.position.set(side * 0.18 * hs, 0.24 * hs, 0.18);
    lance.rotation.x = 0.7; lance.rotation.z = -side * 0.22;
    group.add(lance);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * hs, 0.11 * hs, 0.08 * hs, seg(6)), M.gold);
    collar.position.copy(lance.position); collar.rotation.x = 0.7 + Math.PI / 2; collar.rotation.z = -side * 0.22;
    group.add(collar);
    for (let c = 0; c < Math.max(0, crown - 2); c++) {
      const ch = spike(hlen * (0.55 - c * 0.12), 0.045 * hs, 0.006, M.gold, 4);
      ch.position.set(side * (0.20 + c * 0.09) * hs, 0.18 * hs, 0.30 + c * 0.12);
      ch.rotation.x = 1.3; ch.rotation.z = -side * (0.4 + c * 0.22);
      group.add(ch);
    }
  }

  // STAR-GEM motif (brow center): big faceted violet octahedron in a gold setting. A GEM — never opens.
  const bloom = model.starGemBloom ?? 1;
  const gemR = (0.13 + 0.07 * bloom) * hs;
  const gy = 0.24 * hs, gz = -0.16 * hs;   // proud on the brow, forward + up so it reads face-on
  // Thin flat gold bezel RING behind the gem (frames it — does not out-shine it).
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(gemR * 1.25, gemR * 0.16, seg(3), 8), M.goldHi);
  bezel.position.set(0, gy, gz - 0.02 * hs); bezel.rotation.x = 0.15;
  group.add(bezel);
  // The blazing violet star-gem — the dominant facial point (emissive turned up hard).
  const gemMat = M.gem.clone(); gemMat.emissiveIntensity = 2.6 * (0.5 + 0.9 * bloom);
  gemMat.userData.baseEmissive = M.gem.userData.baseEmissive; gemMat.userData.baseIntensity = gemMat.emissiveIntensity;
  spineMats.push(gemMat);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), gemMat);
  gem.position.set(0, gy, gz); gem.scale.set(1, 1.25, 1);
  group.add(gem);
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.copy(gem.position); group.add(motifAnchor);

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
  const M = sovereignMats(def, glow);
  const a = anchor ?? { y: 0.15, z: 1.95 };
  const nSeg = Math.round(model.tailSegments ?? 9);
  const T = (model.tailLength ?? 1) * 3.0;
  const rootR = 0.20;
  // Line-of-action S (UNCHANGED shape): the tail dips below the root line then RISES so the tip
  // lifts, with a subtle lateral gesture. curveY/curveX/rAt define the exact rest path.
  const curveY = (t) => -0.11 * T * Math.sin(Math.PI * t * 0.9) + 0.09 * T * t;
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
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.075 * bloom, 0), M.gem);
    star.position.set(lx, ly + plen * 0.5, lz + plen * 0.3);
    tipG.add(star);
  }
  return { group, segs, accentMats: [M.violet, M.gem] };
}
registerTail('scepterWhipTail', buildScepterWhipTail);
