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
  const bodyFlat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x080b14, flatShading: true, roughness: 0.66, metalness: 0.12 });
  const gold = new THREE.MeshStandardMaterial({ color: def.scales ?? GOLD, flatShading: true, roughness: 0.3, metalness: 0.78, emissive: def.scales ?? GOLD, emissiveIntensity: 0.05 });
  const goldHi = new THREE.MeshStandardMaterial({ color: def.horn ?? GOLD_HI, flatShading: true, roughness: 0.26, metalness: 0.82 });
  const vCol = def.apexSeam ?? VIOLET;
  const violet = new THREE.MeshStandardMaterial({ color: vCol, emissive: vCol, emissiveIntensity: 1.2 * g, flatShading: true, roughness: 0.4 });
  violet.userData.baseEmissive = vCol; violet.userData.baseIntensity = 1.2 * g;
  const memCol = def.wingOuter ?? CRIMSON_OUT;
  const membrane = new THREE.MeshStandardMaterial({ color: memCol, emissive: def.wingEmissive ?? 0x7a1622, emissiveIntensity: 0.28 * g, flatShading: true, roughness: 0.74, side: THREE.DoubleSide });
  membrane.userData.baseEmissive = def.wingEmissive ?? 0x7a1622; membrane.userData.baseIntensity = 0.28 * g;
  const gem = new THREE.MeshStandardMaterial({ color: vCol, emissive: vCol, emissiveIntensity: 2.0 * g, flatShading: true, roughness: 0.2 });
  gem.userData.baseEmissive = vCol; gem.userData.baseIntensity = 2.0 * g;
  return { bodyFlat, gold, goldHi, violet, membrane, gem };
}

// Faceted loft: rings [{z, rx, ry, cy}] → one flat-shaded tube.
function loftRings(rings, mat, N = 8, cap = true) {
  const P = (r, t) => [Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
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
      tris.push([[0, f.cy, f.z], P(f, t1), P(f, t0)], [[0, l.cy, l.z], P(l, t0), P(l, t1)]);
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

  // Horizontal keel body: deep royal chest (mass forward), widest shoulder yoke, taper to tail.
  const body = [
    { z: -1.85, rx: 0.40 * shoulderW, ry: 0.52, cy: 0.10 },   // chest prow
    { z: -1.35, rx: 0.62 * shoulderW, ry: 0.70, cy: 0.14 },   // deep keel chest
    { z: -0.80, rx: 0.70 * shoulderW, ry: 0.64, cy: 0.20 },   // shoulder yoke (widest)
    { z: -0.10, rx: 0.60, ry: 0.54, cy: 0.20 },
    { z: 0.65, rx: 0.44, ry: 0.42, cy: 0.19 },
    { z: 1.35, rx: 0.30, ry: 0.29, cy: 0.17 },
    { z: 1.95, rx: 0.15, ry: 0.15, cy: 0.15 },                // tail root
  ];
  group.add(loftRings(body, M.bodyFlat, seg(9)));

  // Proud up-forward neck (arcs UP to the head — no droop).
  const neck = [
    { z: -1.80, rx: 0.42, ry: 0.46, cy: 0.22 },
    { z: -2.20, rx: 0.34, ry: 0.37, cy: 0.40 },
    { z: -2.55, rx: 0.27, ry: 0.29, cy: 0.58 },
    { z: -2.85, rx: 0.21, ry: 0.22, cy: 0.72 },
  ];
  group.add(loftRings(neck, M.bodyFlat, seg(8)));

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
  const cw = 0.34 + 0.05 * valleys, ch = 0.26 + 0.04 * valleys;
  const corona = new THREE.Group();
  const ctris = [];
  const outer = [], inner = [];
  for (let j = 0; j <= valleys; j++) {
    const a = Math.PI * (0.12 + 0.76 * (j / valleys));
    outer.push([Math.cos(a) * cw, Math.sin(a) * ch, 0.10]);
    inner.push([Math.cos(a) * cw * 0.5, Math.sin(a) * ch * 0.5, 0.0]);
  }
  for (let j = 0; j < valleys; j++) {
    ctris.push([inner[j], outer[j], outer[j + 1]], [inner[j], outer[j + 1], inner[j + 1]]);
  }
  corona.add(flatTriMesh(ctris, M.gold));
  // violet emissive seam ribs radiating in the valleys
  for (let j = 0; j <= valleys; j++) {
    const a = Math.PI * (0.12 + 0.76 * (j / valleys));
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, ch * 0.5, 0.04), M.violet);
    rib.position.set(Math.cos(a) * cw * 0.72, Math.sin(a) * ch * 0.72, 0.08);
    rib.rotation.z = a - Math.PI / 2;
    corona.add(rib);
  }
  corona.position.set(0, TORSO_Y + 0.48, -0.55);
  corona.rotation.x = -0.7;
  group.add(corona);
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(corona.position);
  group.add(motifAnchor);

  const spinePoints = [
    new THREE.Vector3(0, 0.72, -2.85), new THREE.Vector3(0, 0.40, -1.6),
    new THREE.Vector3(0, 0.24, -0.5), new THREE.Vector3(0, 0.19, 0.7),
    new THREE.Vector3(0, 0.15, 1.95),
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
  return { group, attach, spinePoints, spineMats, mats: { bodyMat: M.bodyFlat }, coreGlow: def.coreGlow ?? null };
}
registerTorso('regnalKeelTorso', buildRegnalKeelTorso);

// ── WINGS: 'lanceVaultWings' ──────────────────────────────────────────────────
// One canonical +X wing (arm + pike rank over a SOLID cambered crimson vault), mirrored
// for the left; dihedral raises the tips into the rear cathedral arch.
function buildOneWing(M, dials) {
  const wg = new THREE.Group();
  const { fingers, pikes, halfSpan } = dials;
  const rootChord = 2.5, tipChord = 0.7, sweepZ = halfSpan * 0.34;
  const Ns = Math.max(5, fingers + 1);

  // Leading-edge + cambered membrane grid (3 chord rows: leading / cambered mid / trailing).
  const L = (t) => [t * halfSpan, t * 0.55, -0.15 + t * sweepZ * 0.25];
  const chordAt = (t) => rootChord + (tipChord - rootChord) * t;
  const rows = [];
  for (let ri = 0; ri < 3; ri++) {
    const row = [];
    for (let i = 0; i < Ns; i++) {
      const t = i / (Ns - 1);
      const l = L(t), c = chordAt(t);
      const back = (ri / 2) * c;                          // 0 → 0.5c → c behind the leading edge
      const camber = 0.30 * (1 - 0.5 * t) * Math.sin(Math.PI * (ri / 2));  // cup lift at mid row
      // scallop: pull the trailing row IN between finger stations
      const scallop = ri === 2 ? -0.12 * c * Math.abs(Math.sin(i * Math.PI)) : 0;
      row.push([l[0], l[1] + camber, l[2] + back + scallop]);
    }
    rows.push(row);
  }
  const mtris = [];
  for (let ri = 0; ri < 2; ri++) for (let i = 0; i < Ns - 1; i++) {
    const A = rows[ri][i], B = rows[ri][i + 1], C = rows[ri + 1][i + 1], D = rows[ri + 1][i];
    mtris.push([A, B, C], [A, C, D]);
  }
  wg.add(flatTriMesh(mtris, M.membrane));

  // Gold armored leading spar (thick root → thin tip) along the leading edge.
  const armPts = [];
  for (let i = 0; i < Ns; i++) armPts.push(L(i / (Ns - 1)));
  for (let i = 0; i < Ns - 1; i++) {
    const a = armPts[i], b = armPts[i + 1];
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const len = dir.length();
    const r0 = 0.11 * (1 - i / Ns), r1 = 0.11 * (1 - (i + 1) / Ns);
    const spar = new THREE.Mesh(new THREE.CylinderGeometry(r1 + 0.01, r0 + 0.01, len, seg(5)), M.gold);
    spar.geometry.translate(0, len / 2, 0);
    spar.position.set(a[0], a[1], a[2]);
    spar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    wg.add(spar);
  }

  // Finger ribs (gold) fanning back across the membrane at each finger station.
  for (let f = 0; f < fingers; f++) {
    const t = 0.08 + 0.9 * (f / Math.max(1, fingers - 1));
    const l = L(t), c = chordAt(t);
    const tip = [l[0], l[1] - 0.02, l[2] + c];
    const dir = new THREE.Vector3(tip[0] - l[0], tip[1] - l[1], tip[2] - l[2]);
    const len = dir.length();
    const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.035, len, seg(4)), M.gold);
    rib.geometry.translate(0, len / 2, 0);
    rib.position.set(l[0], l[1], l[2]);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    wg.add(rib);
    // violet vein emissive along the rib tip
    if (f > 0) {
      const vein = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), M.violet);
      vein.position.set(tip[0], tip[1], tip[2]);
      wg.add(vein);
    }
  }

  // Pike rank — gold spears SOCKETED into the arm (visible base), swell-then-taper, rake up-forward.
  for (let i = 0; i < pikes; i++) {
    const t = 0.30 + 0.42 * (i / Math.max(1, pikes));
    const l = L(t);
    const plen = halfSpan * 0.32 * Math.pow(0.82, i);
    const pk = spike(plen, 0.07, 0.01, M.goldHi, 4);
    pk.position.set(l[0], l[1], l[2]);
    pk.rotation.x = -0.5;          // rake forward (−z) and up
    pk.rotation.z = -0.5;
    wg.add(pk);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), M.violet);
    cap.position.set(l[0] - plen * 0.35, l[1] + plen * 0.55, l[2] - plen * 0.3);
    wg.add(cap);
  }

  // Terminal wingtip spike (the one hard point past the membrane).
  const tp = L(1);
  const ts = spike(halfSpan * 0.22, 0.05, 0.005, M.goldHi, 4);
  ts.position.set(tp[0], tp[1], tp[2]);
  ts.rotation.z = -Math.PI / 2 - 0.1;
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
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    pivot.rotation.z = -dih;               // raise the tip → the cathedral arch
    if (side === -1) pivot.scale.x = -1;   // mirror (membrane is DoubleSide; winding-safe)
    pivot.add(buildOneWing(M, dials));
    group.add(pivot);
    pivots[side === 1 ? 'wingPivotL' : 'wingPivotR'] = pivot;
    wingElements.push({ root: [root.x, root.y, root.z], tip: [root.x + side * halfSpan, root.y + 0.55, root.z + halfSpan * 0.34], length: halfSpan });
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

  // Long regal wedge skull (flat brow → tapered muzzle), pointing −Z. Elongated (not a sphere).
  const skull = [
    { z: 0.45, rx: 0.26 * hs, ry: 0.30 * hs, cy: 0.02 },   // occiput
    { z: 0.05, rx: 0.32 * hs, ry: 0.30 * hs, cy: 0.03 },   // brow (widest)
    { z: -0.55, rx: 0.24 * hs, ry: 0.22 * hs, cy: -0.02 },
    { z: -1.15, rx: 0.15 * hs, ry: 0.14 * hs, cy: -0.06 },
    { z: -1.55, rx: 0.07 * hs, ry: 0.07 * hs, cy: -0.08 },  // muzzle tip
  ];
  group.add(loftRings(skull, M.bodyFlat, seg(7)));
  const headLength = 2.0 * hs;

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
  const gemR = (0.08 + 0.05 * bloom) * hs;
  const setting = new THREE.Mesh(new THREE.OctahedronGeometry(gemR * 1.35, 0), M.gold);
  setting.position.set(0, 0.16 * hs, -0.16 * hs); setting.scale.set(1, 1, 0.5);
  group.add(setting);
  const gemMat = M.gem.clone(); gemMat.emissiveIntensity = M.gem.userData.baseIntensity * (0.35 + 0.65 * bloom);
  gemMat.userData.baseEmissive = M.gem.userData.baseEmissive; gemMat.userData.baseIntensity = gemMat.emissiveIntensity;
  spineMats.push(gemMat);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), gemMat);
  gem.position.set(0, 0.16 * hs, -0.20 * hs);
  group.add(gem);
  const motifAnchor = new THREE.Object3D(); motifAnchor.position.copy(gem.position); group.add(motifAnchor);

  // Eyes — warm gold almond, the second-brightest facial points.
  const es = model.eyeScale ?? 1;
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.075 * hs * es, 0), eyeMat);
    eye.position.set(side * 0.22 * hs, 0.04 * hs, -0.34 * hs); eye.scale.set(1.3, 0.7, 1);
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
  const len = (model.tailLength ?? 1) * 3.0;
  let r = 0.15;
  const ringsAt = [];
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg;
    ringsAt.push({ z: a.z + t * len, rx: r * (1 - t) + 0.015, ry: r * (1 - t) + 0.015, cy: a.y - t * 0.22 });
  }
  group.add(loftRings(ringsAt, M.bodyFlat, seg(6), false));

  // 3–4 bold dorsal fins (swell-then-taper) — not a fine chevron march.
  const fins = Math.round(model.tailFins ?? 4);
  for (let i = 0; i < fins; i++) {
    const t = (i + 0.5) / fins;
    const fh = 0.3 * Math.sin(Math.PI * t) + 0.06;
    const z = a.z + t * len * 0.8, y = a.y - t * 0.22;
    const fin = flatTriMesh([[[0, y + 0.04, z - 0.14], [0, y + 0.04, z + 0.14], [0, y + 0.04 + fh, z]]], M.gold);
    group.add(fin);
  }

  // Scepter crescent finial (open ~35°, gap ≥40%) + violet captive star.
  const tz = a.z + len, ty = a.y - 0.22;
  const bloom = model.crescentBloom ?? 1;
  const spread = 0.4 + 0.3 * bloom, plen = 0.55 * (0.4 + 0.6 * bloom);
  for (const side of [1, -1]) {
    const prong = spike(plen, 0.045, 0.008, M.goldHi, 4);
    prong.position.set(0, ty, tz);
    prong.rotation.x = -Math.PI / 2 + 0.25; prong.rotation.z = side * spread;
    group.add(prong);
  }
  if (bloom > 0.4) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.07 * bloom, 0), M.gem);
    star.position.set(0, ty + 0.16, tz + 0.24);
    group.add(star);
  }
  return { group, segs: [], accentMats: [M.violet, M.gem] };
}
registerTail('scepterWhipTail', buildScepterWhipTail);
