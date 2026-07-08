import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// SOLAR SOVEREIGN — "The Eclipse Dragon-King" (Bahamut / Eclipse). A FRESH premium
// apex, authored from scratch (see reforged/SOLAR-ECLIPSE-BUILDSHEET.md) — no shipped
// builder look reused. Four self-registering parts:
//   regnalKeelTorso · lanceVaultWings · eclipseCrownHead · scepterWhipTail ('scepter')
// Engine axis: head/forward −Z, tail/rear +Z, right +X, up +Y; torso baseline y≈0.2.
// Low-poly doctrine (feasibility pass): FEWER, LARGER, confidently faceted forms carried
// by silhouette; ALL glow is emissive baked into OPAQUE flat-shaded facets (no additive
// shells). Flat-shaded gold facets ARE the "forged platinum-plate" read.
// ═══════════════════════════════════════════════════════════════════════════════

const TORSO_Y = 0.2;
const GOLD = 0xd4a84f, VIOLET = 0xb784ff, CRIMSON_IN = 0x9c2233, CRIMSON_OUT = 0x5a160e;

// Shared surface language, tinted by def so per-form colours still drive.
function sovereignMats(def, glow) {
  const g = Math.min(glow ?? 1, 1.3);
  const gold = new THREE.MeshStandardMaterial({ color: def.scales ?? GOLD, flatShading: true, roughness: 0.34, metalness: 0.72 });
  const vCol = def.apexSeam ?? VIOLET;
  const violet = new THREE.MeshStandardMaterial({ color: vCol, emissive: vCol, emissiveIntensity: 1.15 * g, flatShading: true, roughness: 0.4 });
  violet.userData.baseEmissive = vCol; violet.userData.baseIntensity = 1.15 * g;
  const memCol = def.wingOuter ?? CRIMSON_OUT;
  const membrane = new THREE.MeshStandardMaterial({ color: memCol, emissive: def.wingEmissive ?? 0x7a1622, emissiveIntensity: 0.24 * g, flatShading: true, roughness: 0.72, side: THREE.DoubleSide });
  membrane.userData.baseEmissive = def.wingEmissive ?? 0x7a1622; membrane.userData.baseIntensity = 0.24 * g;
  const gem = new THREE.MeshStandardMaterial({ color: vCol, emissive: vCol, emissiveIntensity: 1.6 * g, flatShading: true, roughness: 0.25 });
  gem.userData.baseEmissive = vCol; gem.userData.baseIntensity = 1.6 * g;
  return { gold, violet, membrane, gem };
}

// Faceted loft: rings [{z, rx, ry, cy}] with N radial facets → one flat-shaded tube.
function loftRings(rings, mat, N = 8, cap = true) {
  const P = (r, t) => [Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      const a0 = P(a, t0), a1 = P(a, t1), b0 = P(b, t0), b1 = P(b, t1);
      tris.push([a0, b0, b1], [a0, b1, a1]);
    }
  }
  if (cap) {
    const f = rings[0], l = rings[rings.length - 1];
    const fc = [0, f.cy, f.z], lc = [0, l.cy, l.z];
    for (let j = 0; j < N; j++) {
      const t0 = (j / N) * Math.PI * 2, t1 = ((j + 1) / N) * Math.PI * 2;
      tris.push([fc, P(f, t1), P(f, t0)]);
      tris.push([lc, P(l, t0), P(l, t1)]);
    }
  }
  return flatTriMesh(tris, mat);
}

// A tapered facet-cone along a direction (for horns, pikes, tusks, prongs) — low-poly.
function spike(len, rBase, rTip, mat, facets = 5) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(rTip, rBase, len, seg(facets)), mat);
  g.geometry.translate(0, len / 2, 0);   // base at origin, grows +Y
  return g;
}

// A flat faceted chevron shield in the XZ plane (for keel-ridge cuirass plates).
function chevronShield(w, l, mat) {
  const tris = [
    [[-w, 0, l * 0.5], [w, 0, l * 0.5], [0, 0, -l * 0.5]],   // dorsal chevron, point toward head (−z)
  ];
  return flatTriMesh(tris, mat);
}

// ── TORSO: 'regnalKeelTorso' ──────────────────────────────────────────────────
function buildRegnalKeelTorso(def, model, bodyMat) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const spineMats = [M.violet, M.gem];

  const bodyScale = model.bodyScale ?? 1;
  const shoulderW = model.shoulderWidthScale ?? 1;

  // Horizontal keel body: deep royal chest, widest at the shoulder yoke, tapering to tail.
  const body = [
    { z: -1.75, rx: 0.52 * shoulderW, ry: 0.60, cy: 0.16 },   // chest (deep keel)
    { z: -1.00, rx: 0.72 * shoulderW, ry: 0.68, cy: 0.20 },   // shoulder yoke (widest)
    { z: -0.20, rx: 0.64, ry: 0.58, cy: 0.20 },
    { z: 0.60, rx: 0.48, ry: 0.44, cy: 0.19 },
    { z: 1.30, rx: 0.32, ry: 0.30, cy: 0.17 },
    { z: 1.90, rx: 0.16, ry: 0.16, cy: 0.15 },                // tail root
  ];
  group.add(loftRings(body, bodyMat, seg(8)));

  // Proud forward-up neck to the head base.
  const neck = [
    { z: -1.70, rx: 0.44, ry: 0.46, cy: 0.24 },
    { z: -2.15, rx: 0.34, ry: 0.36, cy: 0.36 },
    { z: -2.60, rx: 0.26, ry: 0.28, cy: 0.48 },
    { z: -2.95, rx: 0.20, ry: 0.21, cy: 0.55 },
  ];
  group.add(loftRings(neck, bodyMat, seg(8)));

  // Dorsal keel-ridge: ONE bold rank of overlapping gold chevron cuirass-shields, ×0.82,
  // with recessed violet emissive seams between them (SSSR drama, zero added drawables).
  const shields = Math.round(model.keelShields ?? 5);
  let sw = 0.34, sl = 0.5;
  for (let i = 0; i < shields; i++) {
    const z = -1.15 + i * 0.62;
    if (z > 1.6) break;
    const topY = TORSO_Y + 0.55 - i * 0.05;
    const sh = chevronShield(sw, sl, M.gold);
    sh.position.set(0, topY, z);
    group.add(sh);
    if (i > 0) {                                   // violet seam groove ahead of each shield
      const seam = new THREE.Mesh(new THREE.BoxGeometry(sw * 1.1, 0.03, 0.06), M.violet);
      seam.position.set(0, topY - 0.01, z - sl * 0.5);
      group.add(seam);
    }
    sw *= 0.9; sl *= 0.92;
  }

  // CORONA MANTLE (rear-visible motif carrier): ONE solid faceted gold crescent shield on
  // the dorsal yoke between the wing roots, with violet emissive seam-valleys. Blooms by
  // width/valley-count via model.coronaValleys + crescentBloom-independent (grows w/ form).
  const valleys = Math.round(model.coronaValleys ?? 5);
  const cScale = 0.55 + 0.12 * valleys;
  const corona = new THREE.Group();
  const cw = 0.30 * cScale, ch = 0.5 * cScale;
  // faceted crescent: an arc of triangles fanning from a low base — one mesh.
  const ctris = [];
  const arcN = Math.max(3, valleys);
  for (let j = 0; j < arcN; j++) {
    const a0 = Math.PI * (0.15 + 0.7 * (j / arcN)), a1 = Math.PI * (0.15 + 0.7 * ((j + 1) / arcN));
    const base = [0, 0, 0.14];
    const p0 = [Math.cos(a0) * cw, Math.sin(a0) * ch, 0];
    const p1 = [Math.cos(a1) * cw, Math.sin(a1) * ch, 0];
    ctris.push([base, p0, p1]);
  }
  corona.add(flatTriMesh(ctris, M.gold));
  // violet seam-valley strip along the crescent inner edge
  const seamMat = M.violet;
  const cseam = new THREE.Mesh(new THREE.TorusGeometry(cw * 0.9, 0.02, seg(4), seg(arcN + 2), Math.PI * 0.7), seamMat);
  cseam.rotation.z = Math.PI * 0.15; cseam.scale.set(1, ch / cw, 1);
  corona.add(cseam);
  corona.position.set(0, TORSO_Y + 0.5, -0.55);
  corona.rotation.x = -0.5;
  group.add(corona);
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(corona.position);
  group.add(motifAnchor);

  // Spine polyline (line-of-action assert) — a gentle horizontal S: neck up-forward, tail down-back.
  const spinePoints = [
    new THREE.Vector3(0, 0.55, -2.95), new THREE.Vector3(0, 0.30, -1.7),
    new THREE.Vector3(0, 0.24, -0.6), new THREE.Vector3(0, 0.20, 0.6),
    new THREE.Vector3(0, 0.15, 1.9),
  ];

  const wingRootOff = model.wingRootOffset ?? {};
  const attach = {
    wingRoot: (side) => ({ x: (0.58 * shoulderW) * side, y: TORSO_Y + 0.42 + (wingRootOff.y ?? 0), z: -0.95 + (wingRootOff.z ?? 0) }),
    headBase: { x: 0, y: 0.55, z: -3.0 },
    tailAnchor: { y: 0.15, z: 1.9 },
    keelTopAt: (z) => TORSO_Y + 0.55 * Math.max(0, 1 - Math.abs(z + 0.6) / 2.6),
    halfWidthAt: (z) => 0.62 * Math.max(0.2, 1 - Math.abs(z + 0.4) / 3.2),
    bodyMidY: TORSO_Y,
    tailShift: 0,
    riderSocket: { x: 0, y: 0.9, z: -0.35 },
    motifAnchor,
  };

  return { group, attach, spinePoints, spineMats, coreGlow: def.coreGlow ?? null };
}
registerTorso('regnalKeelTorso', buildRegnalKeelTorso);

// ── WINGS: 'lanceVaultWings' ──────────────────────────────────────────────────
// Two decks: a gold lance-arm + pike rank (upper leading edge) over crimson vault bays.
function buildLanceVaultWings(def, model, attach, giM) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const spineMats = [M.violet];
  const wingMat = M.membrane;

  const fingers = Math.round(model.vaultFingers ?? 5);
  const pikes = Math.round(model.pikeCount ?? 3);
  const span = (model.spanScale ?? 1) * (2.4 + 0.5 * fingers);
  const dih = ((model.dihedral ?? 20) * Math.PI) / 180;
  const sweep = (28 * Math.PI) / 180;
  const wingElements = [];
  const pivots = {};

  for (const side of [1, -1]) {
    const root = attach.wingRoot(side);
    const pivot = new THREE.Group();
    pivot.position.set(root.x, root.y, root.z);
    pivot.userData.wingRole = 'pivot';
    pivot.rotation.z = -side * dih;         // dihedral raises the wing → the rear cathedral arch
    group.add(pivot);
    pivots[side === 1 ? 'wingPivotL' : 'wingPivotR'] = pivot;

    // Deck 1 — gold lance-arm (faceted spar), swept back.
    const armLen = span;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, armLen, seg(5)), M.gold);
    arm.geometry.translate(0, armLen / 2, 0);
    arm.rotation.z = -side * Math.PI / 2;   // extend along +X (out)
    arm.rotation.y = side * sweep;          // sweep back (+z)
    pivot.add(arm);
    const armDir = new THREE.Vector3(side * Math.cos(sweep), 0, Math.sin(sweep));

    // pike rank — gold spears raking up-forward off the arm.
    for (let i = 0; i < pikes; i++) {
      const f = 0.35 + 0.5 * (i / Math.max(1, pikes));
      const plen = span * 0.30 * Math.pow(0.82, i);
      const pk = spike(plen, 0.05, 0.008, M.gold, 4);
      pk.position.copy(armDir.clone().multiplyScalar(armLen * f));
      pk.rotation.z = -side * (Math.PI / 2 - 0.6);   // rake up-forward
      pk.rotation.y = side * 0.2;
      pivot.add(pk);
      // violet emissive tip cap
      const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), M.violet);
      tip.position.copy(pk.position).add(new THREE.Vector3(0, plen * 0.9, 0));
      pivot.add(tip);
    }

    // Deck 2 — crimson vault bays on splayed fingers.
    for (let i = 0; i < fingers; i++) {
      const t = i / Math.max(1, fingers - 1);
      const flen = armLen * (0.95 - 0.5 * t);
      const spread = (0.15 + 0.9 * t) * (Math.PI / 2);
      const fDir = new THREE.Vector3(side * Math.cos(sweep + spread * 0.4), -0.05 - 0.15 * t, Math.sin(sweep + spread * 0.4)).normalize();
      const finRoot = armDir.clone().multiplyScalar(armLen * 0.12 * i);
      const finTip = finRoot.clone().add(fDir.clone().multiplyScalar(flen));
      // finger tube
      const fRib = spike(flen, 0.035, 0.01, M.gold, 4);
      fRib.position.copy(finRoot);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), fDir);
      fRib.quaternion.copy(q);
      pivot.add(fRib);
      wingElements.push({ root: [finRoot.x, finRoot.y, finRoot.z], tip: [finTip.x, finTip.y, finTip.z], length: flen });

      // membrane bay between this finger and the next (crimson, cambered wedge)
      if (i < fingers - 1) {
        const t2 = (i + 1) / Math.max(1, fingers - 1);
        const flen2 = armLen * (0.95 - 0.5 * t2);
        const fDir2 = new THREE.Vector3(side * Math.cos(sweep + (0.15 + 0.9 * t2) * (Math.PI / 2) * 0.4), -0.05 - 0.15 * t2, Math.sin(sweep + (0.15 + 0.9 * t2) * (Math.PI / 2) * 0.4)).normalize();
        const r2 = armDir.clone().multiplyScalar(armLen * 0.12 * (i + 1));
        const tip2 = r2.clone().add(fDir2.clone().multiplyScalar(flen2));
        const mid = finTip.clone().add(tip2).multiplyScalar(0.5).add(fDir.clone().multiplyScalar(-flen * 0.12)); // scallop-in trailing edge
        const bay = flatTriMesh([[[finRoot.x, finRoot.y, finRoot.z], [finTip.x, finTip.y, finTip.z], [mid.x, mid.y, mid.z]],
                                 [[finRoot.x, finRoot.y, finRoot.z], [mid.x, mid.y, mid.z], [tip2.x, tip2.y, tip2.z]],
                                 [[finRoot.x, finRoot.y, finRoot.z], [tip2.x, tip2.y, tip2.z], [r2.x, r2.y, r2.z]]], M.membrane);
        pivot.add(bay);
      }
      // wingtip spike on the outermost finger
      if (i === fingers - 1) {
        const ts = spike(flen * 0.5, 0.02, 0.005, M.gold, 4);
        ts.position.copy(finTip);
        ts.quaternion.copy(q);
        pivot.add(ts);
        wingElements.push({ root: [finTip.x, finTip.y, finTip.z], tip: [finTip.x + fDir.x * flen * 0.5, finTip.y + fDir.y * flen * 0.5, finTip.z + fDir.z * flen * 0.5], length: flen * 0.5 });
      }
    }
  }

  return { group, spineMats, wingMat, parts: { ...pivots, wingElements } };
}
registerWings('lanceVaultWings', buildLanceVaultWings);

// ── HEAD: 'eclipseCrownHead' ──────────────────────────────────────────────────
function buildEclipseCrownHead(def, model, mats) {
  const group = new THREE.Group();
  const glow = model.glowLevel ?? 1;
  const M = sovereignMats(def, glow);
  const spineMats = [M.violet, M.gem];
  const hs = model.headScale ?? 1;
  const bodyMat = mats.bodyMat, eyeMat = mats.eyeMat;

  // Regal wedge skull (flat brow → tapered muzzle), pointing −Z.
  const skull = [
    { z: 0.35, rx: 0.30 * hs, ry: 0.28 * hs, cy: 0 },
    { z: -0.15, rx: 0.34 * hs, ry: 0.32 * hs, cy: 0.02 },
    { z: -0.70, rx: 0.24 * hs, ry: 0.22 * hs, cy: -0.02 },
    { z: -1.15, rx: 0.12 * hs, ry: 0.12 * hs, cy: -0.05 },   // muzzle
  ];
  group.add(loftRings(skull, bodyMat, seg(7)));
  const headLength = 1.5 * hs;

  // Twin lance-horns + crown-horns (a crown readable in black fill).
  const crown = Math.round(model.crownHorns ?? 4);
  const hlen = (model.hornLen ?? 1.7) * 0.5 * hs;
  for (const side of [1, -1]) {
    const lance = spike(hlen, 0.05 * hs, 0.006, M.gold, 5);
    lance.position.set(side * 0.16 * hs, 0.22 * hs, 0.05);
    lance.rotation.x = 0.5; lance.rotation.z = -side * 0.18;
    group.add(lance);
    // base gold ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06 * hs, 0.015, seg(4), seg(6)), M.gold);
    ring.position.copy(lance.position); ring.rotation.x = Math.PI / 2 + 0.5;
    group.add(ring);
    // back-swept crown-horns (apex adds count)
    for (let c = 0; c < Math.max(0, crown - 2) / 2; c++) {
      const ch = spike(hlen * (0.5 - c * 0.12), 0.035 * hs, 0.006, M.gold, 4);
      ch.position.set(side * (0.22 + c * 0.1) * hs, 0.16 * hs, 0.16 + c * 0.1);
      ch.rotation.x = 1.1; ch.rotation.z = -side * (0.4 + c * 0.2);
      group.add(ch);
    }
  }

  // STAR-GEM motif (brow center): faceted octahedron + low-facet gold hex bezel. GEM, never opens.
  const bloom = model.starGemBloom ?? 1;
  const gemR = (0.05 + 0.05 * bloom) * hs;
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(gemR, 0), M.gem);
  gem.position.set(0, 0.14 * hs, -0.24 * hs);
  M.gem.emissiveIntensity *= (0.4 + 0.6 * bloom);
  group.add(gem);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(gemR * 1.5, 0.02 * hs, seg(3), 6), M.gold);
  bezel.position.copy(gem.position); bezel.rotation.x = Math.PI / 2;
  group.add(bezel);
  const motifAnchor = new THREE.Object3D();
  motifAnchor.position.copy(gem.position); group.add(motifAnchor);

  // Eyes — gold, the brightest facial points bar the gem.
  for (const side of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 * hs * (model.eyeScale ?? 1), 0), eyeMat);
    eye.position.set(side * 0.20 * hs, 0.04 * hs, -0.30 * hs);
    group.add(eye);
  }

  // Tusks (inspect-view, forms 2–3 via tuskScale).
  const tusk = model.tuskScale ?? 0;
  if (tusk > 0) for (const side of [1, -1]) {
    const t = spike(0.18 * tusk * hs, 0.025 * hs, 0.004, M.gold, 4);
    t.position.set(side * 0.12 * hs, -0.12 * hs, -0.55 * hs);
    t.rotation.x = -0.6; t.rotation.z = side * 0.2;
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
  const bodyMat = mats.bodyMat;
  const a = anchor ?? { y: 0.15, z: 1.9 };

  const segs = [];
  const nSeg = Math.round(model.tailSegments ?? 9);
  const len = (model.tailLength ?? 1) * 3.4;
  let r = 0.16;
  const ringsAt = [];
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg;
    ringsAt.push({ z: a.z + t * len, rx: r * (1 - t) + 0.02, ry: r * (1 - t) + 0.02, cy: a.y - t * 0.25 });
  }
  const whip = loftRings(ringsAt, bodyMat, seg(6), false);
  group.add(whip);

  // 3–4 bold dorsal fins (swell-then-taper), not a fine chevron march.
  const fins = Math.round(model.tailFins ?? 4);
  for (let i = 0; i < fins; i++) {
    const t = (i + 0.5) / fins;
    const fh = 0.28 * Math.sin(Math.PI * t) + 0.06;
    const z = a.z + t * len * 0.85;
    const fin = flatTriMesh([[[0, a.y - t * 0.25 + 0.05, z - 0.12], [0, a.y - t * 0.25 + 0.05, z + 0.12], [0, a.y - t * 0.25 + 0.05 + fh, z]]], M.gold);
    group.add(fin);
  }

  // Scepter crescent finial + captive star (violet).
  const tz = a.z + len, ty = a.y - 0.25;
  const bloom = model.crescentBloom ?? 1;
  const spread = 0.35 + 0.25 * bloom;
  for (const side of [1, -1]) {
    const prong = spike(0.5 * (0.4 + 0.6 * bloom), 0.04, 0.008, M.gold, 4);
    prong.position.set(0, ty, tz);
    prong.rotation.x = -Math.PI / 2 + 0.2; prong.rotation.z = side * spread;
    group.add(prong);
  }
  if (bloom > 0.4) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.06 * bloom, 0), M.gem);
    star.position.set(0, ty + 0.18, tz + 0.28);
    group.add(star);
  }

  return { group, segs, accentMats: [M.violet, M.gem] };
}
registerTail('scepterWhipTail', buildScepterWhipTail);
