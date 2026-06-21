import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerHead } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PEARL SERAPH — TORSO + NECK + HEAD + CROWN-HALO (the "Radiant Paladin" body).
//
// A holy paladin dragon: a slim matte-pearl HULL wrapped in a gilded GORGET collar +
// shoulder PAULDRONS that receive the wings, a long noble NECK, a smooth crowned SKULL
// (not a balloon), and a real-geometry CROWN-HALO (a tilted gold/holy ring + crown
// shards, NOT the old soft sprite). Engine axis: head/forward = −Z, tail/rear = +Z,
// right = +X, up = +Y. The body PUBLISHES the attach contract the proven seraph wings/
// tail mount through, so they integrate into the pauldrons + hull rear.
// Surface grammar: matte pearl + warm gold rims + dawn-blue seam/gem light. No carbon/
// red/vent/thruster (bull/SVJ) vocabulary anywhere.
// ═══════════════════════════════════════════════════════════════════════════════

const D2R = Math.PI / 180;
const TORSO_Y = 0.2;                         // matches the engine's torso baseline

// Surface language (shared with the wing/tail builder's SERAPH_* palette).
const SERAPH_PEARL = 0xF2F0EA, SERAPH_GOLD = 0xD6AF4A, SERAPH_DAWN = 0x88DFFF;
const SERAPH_HOLY = 0xFFF3C8, SERAPH_GEM = 0x8FEAFF;

function seraphMats(def, gi) {
  const g = Math.min(gi ?? 1, 1.3);
  const pearl = new THREE.MeshStandardMaterial({
    color: def.body ?? SERAPH_PEARL, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.58, metalness: 0.06, emissive: SERAPH_PEARL, emissiveIntensity: 0.10,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: def.wingGild ?? SERAPH_GOLD, flatShading: true, side: THREE.DoubleSide,
    roughness: 0.30, metalness: 0.72,
  });
  const dawnCol = def.wingEmissive ?? SERAPH_DAWN;
  const dawn = new THREE.MeshStandardMaterial({ color: dawnCol, emissive: dawnCol, emissiveIntensity: 1.3 * g, roughness: 0.4, side: THREE.DoubleSide });
  dawn.userData.baseEmissive = dawnCol; dawn.userData.baseIntensity = 1.3 * g;
  const holy = new THREE.MeshStandardMaterial({ color: SERAPH_HOLY, emissive: SERAPH_HOLY, emissiveIntensity: 2.0 * g, roughness: 0.25, side: THREE.DoubleSide });
  holy.userData.baseEmissive = SERAPH_HOLY; holy.userData.baseIntensity = 2.0 * g;
  const gem = new THREE.MeshStandardMaterial({ color: SERAPH_GEM, emissive: SERAPH_GEM, emissiveIntensity: 1.9 * g, roughness: 0.10, metalness: 0.0 });
  gem.userData.baseEmissive = SERAPH_GEM; gem.userData.baseIntensity = 1.9 * g;
  return { pearl, gold, dawn, holy, gem };
}

// Loft a smooth closed surface through elliptical rings [{z, rx, ry}] (head/forward = −Z).
function loftEllipse(rings, mat, nSeg) {
  const N = nSeg ?? seg(10);
  const verts = [];
  for (const r of rings) for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    verts.push(Math.cos(a) * r.rx, Math.sin(a) * r.ry + (r.cy ?? 0), r.z);
  }
  const idx = [];
  for (let s = 0; s < rings.length - 1; s++) {
    const a0 = s * N, b0 = (s + 1) * N;
    for (let m = 0; m < N; m++) { const n = (m + 1) % N; idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// A small faceted gem node (octahedron).
const gemNode = (r, mat) => new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), mat);

// ── TORSO ──────────────────────────────────────────────────────────────────────
function buildSeraphHull(def, model, bodyMat) {
  const group = new THREE.Group();
  const mats = seraphMats(def, model.glowIntensity);
  const spineMats = [mats.dawn, mats.holy, mats.gem];
  const formLevel = model.formLevel ?? 3;

  // 1 — PEARL HULL: a slim regal loft (broadest at the shoulder, tapering both ways),
  // capped at both ends. Centred near y = TORSO_Y so it anchors the wings without bulk.
  const cy = TORSO_Y;
  // Shape hierarchy (less blob): SHOULDER carries width (×1.04), central/abdomen/tail-root
  // slim (×0.90–0.94), +2% length — so the pauldrons read broad and the belly stays elegant.
  const hull = loftEllipse([
    { z: -1.00, rx: 0.06, ry: 0.07, cy },                  // front cap
    { z: -0.84, rx: 0.32, ry: 0.44, cy },                  // front chest (slimmer)
    { z: -0.43, rx: 0.47, ry: 0.58, cy },                  // upper gorget
    { z: -0.06, rx: 0.62, ry: 0.70, cy },                  // shoulder mass (broadest — carries width)
    { z:  0.49, rx: 0.37, ry: 0.48, cy },                  // abdomen (slimmer, elegant)
    { z:  0.94, rx: 0.225, ry: 0.30, cy },                 // tail root (cleaner taper)
    { z:  1.08, rx: 0.05, ry: 0.06, cy },                  // rear cap
  ], mats.pearl, seg(12));
  group.add(hull);

  // 2 — GORGET STACK: 4 layered collar arcs across the upper chest — the key paladin-armor
  // module. The GOLD backing arc sits proud of a smaller pearl inset so a warm gold rim
  // always reads (shop + rear ¾); nudged up/out so the rider can't hide it. Low torus
  // segments (the cheapest way to keep this readable arc-stack under budget).
  for (let i = 0; i < 4; i++) {
    const widthScale = 1 - 0.16 * (i / 3);
    const z = -0.60 + i * 0.15, y = cy + 0.24 - i * 0.06;
    const rad = 0.53 * widthScale;
    const arc = Math.PI * (118 / 180);
    const goldArc = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.046, seg(5), seg(12), arc), mats.gold);
    goldArc.rotation.y = Math.PI / 2; goldArc.position.set(0, y, z); goldArc.rotation.z = Math.PI - arc / 2;
    const pearlArc = new THREE.Mesh(new THREE.TorusGeometry(rad * 0.88, 0.024, seg(5), seg(12), arc * 0.92), mats.pearl);
    pearlArc.rotation.copy(goldArc.rotation); pearlArc.position.set(0, y + 0.010, z);
    group.add(goldArc, pearlArc);
  }

  // 3 — SHOULDER PAULDRONS at the wing roots (a smooth pearl dome + gold rim + gem node)
  // so the wings plug into holy shoulder armor, not bare flank.
  const wrBase = { x: 0.78, y: cy + 0.03, z: -0.30 };
  for (const s of [-1, 1]) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.31, seg(8), seg(6), 0, Math.PI * 2, 0, Math.PI * 0.6), mats.pearl);
    dome.scale.set(0.90, 0.60, 1.05);
    dome.position.set(s * wrBase.x, wrBase.y, wrBase.z);
    dome.rotation.z = s * -5 * D2R; dome.rotation.y = s * 8 * D2R;
    group.add(dome);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.030, seg(5), seg(14), Math.PI), mats.gold);
    rim.position.copy(dome.position); rim.rotation.x = Math.PI / 2; rim.rotation.z = s * -5 * D2R;
    group.add(rim);
    const gem = gemNode(0.055, mats.gem);
    gem.position.set(s * (wrBase.x + 0.04), wrBase.y + 0.10, wrBase.z - 0.04);
    group.add(gem);
  }

  // 4 — gilded STERNUM KEEL: a thin TAPERED gold ridge (triangular cross-section, apex up)
  // running the chest centerline — a designed central armor line, elegant, not a spike.
  const keelY = cy - 0.34;
  const keelStations = [                                   // {z, halfWidth, height}
    { z: -0.62, w: 0.030, h: 0.030 }, { z: -0.30, w: 0.042, h: 0.050 },
    { z:  0.05, w: 0.038, h: 0.046 }, { z:  0.30, w: 0.026, h: 0.032 },
    { z:  0.46, w: 0.014, h: 0.016 },
  ];
  const keelTris = [];
  for (let i = 0; i < keelStations.length - 1; i++) {
    const a = keelStations[i], b = keelStations[i + 1];
    const aT = [0, keelY + a.h, a.z], aL = [-a.w, keelY, a.z], aR = [a.w, keelY, a.z];
    const bT = [0, keelY + b.h, b.z], bL = [-b.w, keelY, b.z], bR = [b.w, keelY, b.z];
    keelTris.push([aT, bT, aR], [aR, bT, bR]);            // right face
    keelTris.push([aT, aL, bT], [aL, bL, bT]);            // left face
    keelTris.push([aL, aR, bL], [aR, bR, bL]);            // underside
  }
  group.add(flatTriMesh(keelTris, mats.gold));

  // dawn-blue FLANK FILIGREE — subtle glow seams (kept light; not a substitute for shape).
  if (formLevel >= 2) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const fil = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.5), mats.dawn);
    fil.position.set(s * (0.40 - i * 0.04), cy + 0.04, -0.18 + i * 0.22);
    fil.rotation.y = s * 0.3; group.add(fil);
  }

  // 4b — HAUNCH FAIRINGS: small smooth pearl side fairings + a thin gold rim at the tail
  // root, so the long tail flows out of a sculpted body — NOT a tube stuck on an oval.
  // Subtle (low domes), swept back ~10°; sit just proud of the slimmed tail-root flank.
  for (const s of [-1, 1]) {
    const fair = new THREE.Mesh(new THREE.SphereGeometry(0.20, seg(8), seg(6), 0, Math.PI * 2, 0, Math.PI * 0.62), mats.pearl);
    fair.scale.set(0.66, 0.55, 1.40);                      // low + long: a fairing, not a hip
    fair.position.set(s * 0.30, cy - 0.05, 0.60);
    fair.rotation.y = s * 10 * D2R;                        // sweep back toward the tail
    group.add(fair);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, seg(4), seg(12), Math.PI), mats.gold);
    rim.position.set(s * 0.30, cy - 0.05, 0.60);
    rim.rotation.x = Math.PI / 2; rim.rotation.z = s * 10 * D2R;
    group.add(rim);
  }

  // 5 — NECK: 3 tapered pearl segments in a gentle S-curve toward the head (−Z), each
  // ringed by a thin gold collar. Built here so it flows out of the hull cleanly.
  const neckSpecs = [
    { z: -0.92, w: 0.30, h: 0.34, len: 0.34, y: cy + 0.10 },
    { z: -1.22, w: 0.25, h: 0.28, len: 0.34, y: cy + 0.20 },
    { z: -1.52, w: 0.20, h: 0.23, len: 0.34, y: cy + 0.32 },
  ];
  for (let i = 0; i < neckSpecs.length; i++) {
    const sg= neckSpecs[i];
    const v = new THREE.Mesh(new THREE.CylinderGeometry(sg.w * 0.84, sg.w, sg.len, seg(6)), mats.pearl);
    v.rotation.x = Math.PI / 2; v.scale.y = sg.h / sg.w; v.position.set(0, sg.y, sg.z);
    v.rotation.z = 0; group.add(v);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(sg.w * 0.6, 0.018, seg(4), seg(10)), mats.gold);
    collar.position.set(0, sg.y + 0.02, sg.z - sg.len * 0.42); group.add(collar);
  }

  // ── ATTACH CONTRACT (the body defines the new mounts; wings/tail integrate here) ──
  // Wing root sits OUTBOARD/below/behind the pauldron (±0.86, 0.18, −0.34) so the wing
  // emerges from under the holy shoulder armor rather than from bare flank.
  const wr = { x: 0.86, y: cy - 0.02, z: -0.34 };
  const attach = {
    wingRoot: (side) => ({ x: side * wr.x, y: wr.y, z: wr.z }),
    headBase: { x: 0, y: cy + 0.40, z: -1.78 },            // where the crowned head sits
    tailAnchor: { y: cy - 0.18, z: 0.96 },                 // hull rear → the comet tail
    keelTopAt: (z) => cy + 0.40 * Math.max(0, 1 - Math.abs(z + 0.06) / 1.2),
    halfWidthAt: (z) => 0.60 * Math.max(0.15, 1 - Math.abs(z + 0.06) / 1.4),
    bodyMidY: cy,
    tailShift: 0,
    bodyMatDouble: mats.pearl,
    shoulderSkin: null,
  };
  return { group, attach, spineMats };
}
registerTorso('seraphHull', buildSeraphHull);

// ── HEAD + CROWN-HALO ────────────────────────────────────────────────────────────
function buildSeraphCrownHead(def, model, mats0) {
  const headGroup = new THREE.Group();
  const mats = seraphMats(def, model.glowIntensity);
  const spineMats = [mats.dawn, mats.holy, mats.gem];
  const formLevel = model.formLevel ?? 3;

  // 1 — SKULL: a smooth lofted teardrop (broad cranium → narrow snout), NOT a sphere.
  // Local −Z = snout. Slight downward snout tilt for a noble profile.
  const skull = loftEllipse([
    { z: -0.42, rx: 0.06, ry: 0.06 },                      // snout tip
    { z: -0.24, rx: 0.14, ry: 0.11 },                      // snout mid
    { z: -0.02, rx: 0.22, ry: 0.16 },                      // brow
    { z:  0.22, rx: 0.21, ry: 0.16 },                      // cranium
    { z:  0.34, rx: 0.10, ry: 0.10 },                      // rear cap
  ], mats.pearl, seg(8));
  skull.rotation.x = -4 * D2R;
  headGroup.add(skull);

  // small pearl jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.30, 1, 1, 1), mats.pearl);
  jaw.position.set(0, -0.10, -0.20); headGroup.add(jaw);

  // 2 — GILDED BROW + 5 CROWN POINTS (the paladin crown fused into the brow).
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.16), mats.gold);
  brow.position.set(0, 0.14, -0.04); brow.rotation.x = -6 * D2R; headGroup.add(brow);
  const ptH = [0.10, 0.13, 0.18, 0.13, 0.10];
  for (let i = 0; i < 5; i++) {
    const pt = new THREE.Mesh(new THREE.ConeGeometry(0.022, ptH[i], seg(4)), mats.gold);
    pt.position.set((i - 2) * 0.075, 0.20 + ptH[i] * 0.4, -0.02); pt.rotation.x = -10 * D2R;
    headGroup.add(pt);
  }
  const browGem = gemNode(0.038, mats.gem); browGem.position.set(0, 0.17, -0.10); headGroup.add(browGem);

  // 3 — SWEPT HORNS (elegant, gold, rear-swept — not aggressive bull spikes).
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.30, seg(4)), mats.gold);
    horn.position.set(s * 0.15, 0.18, 0.10);
    horn.rotation.set(50 * D2R, 0, s * -10 * D2R);     // sweep back + slightly out
    headGroup.add(horn);
  }

  // 4 — FACETED GEM EYES (larger, crystalline, holy).
  for (const s of [-1, 1]) {
    const eye = gemNode(0.05, mats.gem);
    eye.position.set(s * 0.15, 0.04, -0.16); headGroup.add(eye);
  }

  // 5 — CROWN-HALO (real geometry, gated to the haloed forms): a classic saint's halo —
  // a holy ring lying FLAT (horizontal, in the XZ plane) FLOATING well above the crown,
  // with gold crown shards + gem nodes ringing the flat disc. Tagged for the serene bob +
  // Surge flare. Low torus segments (chase-cam barely reads the head — spend budget aft).
  let halo = null;
  if (model.halo) {
    halo = new THREE.Group();
    halo.position.set(0, 0.62, 0.02);                      // float clearly above the crown points
    const R = 0.34;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.034, seg(6), seg(20)), mats.holy);
    ring.rotation.x = Math.PI / 2;                          // lie flat (disc parallel to the ground)
    halo.add(ring);
    const shards = formLevel >= 3 ? 6 : 5;
    for (let i = 0; i < shards; i++) {
      const a = (i / shards) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, seg(4)), mats.gold);
      shard.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);   // ring the flat disc
      shard.rotation.z = -Math.PI / 2; shard.rotation.y = -a;    // point outward, lying flat
      halo.add(shard);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const gem = gemNode(0.024, mats.gem);
      gem.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); halo.add(gem);
    }
    halo.userData.haloBob = true;     // dragon.js / preview tick: serene bob + Surge glow
    headGroup.add(halo);
  }

  return { group: headGroup, spineMats, halo };
}
registerHead('seraphCrownHead', buildSeraphCrownHead);
