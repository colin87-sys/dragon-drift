import * as THREE from 'three';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { makeGlowTexture } from './util.js';
import { hexRgb } from './dragonParts.js';
import { applyFresnelRim } from './surface.js';
import { seg } from './modelDetail.js';
import { buildAnatomicalWing, mirrorWing } from './dragonWingAnatomy.js';

// ===========================================================================
// FLAME MONARCH — a brand-new, matched part FAMILY (the "Phoenix technique").
// ===========================================================================
// Like the Phoenix, this creature does NOT recompose the existing kit. It ships
// its OWN torso / wings / head / tail builders so the silhouette is genuinely new
// (a classic European fire-dragon evolved into a racing monarch), not a re-skin
// of an existing dragon. Each builder honours the shared CONTRACTS only — the
// torso publishes the attach points, the wings expose the pivot/tip rig handles,
// the head/tail return their accent mats — so the rig + FX (boost/Surge) drive
// them with zero changes elsewhere.
//
//   monarchHull   broad-chest → slim-waist → long-tail western body, four legs,
//                 an S-neck, and the molten dorsal SPINE (shoulder → rump). It
//                 owns the charcoal/bronze body material (vertex-graded belly) +
//                 the molten throat heart-core.
//   monarchWing   bat membrane, 4–5 finger struts, scalloped outer edge, ember-
//                 cracked struts; strong rear-V dihedral on the up-beat.
//   monarchCrown  angular wedge skull read as a small crown from behind — two
//                 swept-back crown horns + two cheek-horn ridges (all raked back).
//   monarchTail   long, thick-based tail tapering evenly, molten spines down to
//                 ember tail-tip fins.
//
// Form level (model.formLevel 0..3) + model.spineGlow ramp the molten light; the
// shared dragon.js Surge loop flares every tagged accent toward def.surgeHi (a hot
// magma pink), and def.boostSpine brightens the spine/struts on boost.

// --- tiny shared helpers -----------------------------------------------------
const rgbArr = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const lerp = (a, b, t) => a + (b - a) * t;

// Tag an emissive accent material so the Surge loop flares it (and boost, via
// def.boostSpine) — exactly how the chevrons/seams register.
function tagFlare(mat, emissive, intensity, into) {
  mat.userData.baseEmissive = emissive;
  mat.userData.baseIntensity = intensity;
  if (into) into.push(mat);
  return mat;
}

// A smooth lofted hull through a list of elliptical rings { z, rx, ry, y }. A
// per-vertex top→belly colour gradient bakes the charcoal back / burnt-bronze
// belly into ONE mesh (no second material, no seam). Editing the ring list IS
// sculpting the body (the §6a loft idea), so the silhouette lives in data.
function loftHull(rings, radial, mat, cTop, cBelly) {
  const rs = Math.max(6, seg(radial));
  const rows = rings.length;
  const pos = [], col = [], idx = [];
  for (let i = 0; i < rows; i++) {
    const r = rings[i];
    for (let j = 0; j <= rs; j++) {
      const a = (j / rs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      pos.push(ca * r.rx, r.y + sa * r.ry, r.z);
      const t = (sa + 1) * 0.5;            // 0 = belly, 1 = back
      const w = t * t * (3 - 2 * t);       // smoothstep
      col.push(lerp(cBelly[0], cTop[0], w), lerp(cBelly[1], cTop[1], w), lerp(cBelly[2], cTop[2], w));
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < rs; j++) {
      const a = i * (rs + 1) + j, b = a + 1, c = a + (rs + 1), d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// Linear-interpolate a ring property at an arbitrary z (for the attach contract).
function sampleRing(rings, z, key) {
  if (z <= rings[0].z) return rings[0][key];
  const last = rings[rings.length - 1];
  if (z >= last.z) return last[key];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], b = rings[i + 1];
    if (z >= a.z && z <= b.z) return lerp(a[key], b[key], (z - a.z) / (b.z - a.z));
  }
  return last[key];
}

// A thin oriented box strut from a→b (finger bones, arm spar, tail/leg struts).
function bar(a, b, th, mat) {
  const len = a.distanceTo(b);
  const m = new THREE.Mesh(new THREE.BoxGeometry(th, th, len), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.lookAt(b);
  return m;
}

// A gently back-curving tapered horn along local +Y (chained bend segments).
function makeHorn(len, baseR, mat, bend) {
  const root = new THREE.Group();
  const n = 3;
  let cur = root, r = baseR;
  for (let i = 0; i < n; i++) {
    const tR = baseR * (1 - (i + 1) / n) * 0.85 + 0.012;
    const h = len / n;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(tR, r, h, seg(6), 1, true), mat);
    m.position.y = h / 2;
    const node = new THREE.Group();
    node.rotation.x = bend;            // curve backward a little each segment
    node.add(m);
    cur.add(node);
    const top = new THREE.Group();
    top.position.y = h;
    node.add(top);
    cur = top;
    r = tR;
  }
  return root;
}

// ── TORSO — monarchHull ─────────────────────────────────────────────────────
function buildMonarchHull(def, model, _bodyMat) {
  const F = model.formLevel ?? 0;
  const glow = model.spineGlow ?? (F / 3);
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body, cBelly = def.belly;
  const cMolten = def.coreGlow ?? def.wingEmissive ?? 0xff5a1e;
  const cPlate = def.scales ?? def.horn ?? 0x2a221c;

  // Charcoal/obsidian back → burnt-bronze belly, baked as a vertex gradient. A
  // matte-ish organic hide (low metalness) so it never reads as polished metal.
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: def.bodyRoughness ?? 0.62, metalness: def.bodyMetalness ?? 0.12,
    emissive: cBody, emissiveIntensity: 0.05, side: THREE.DoubleSide,
  });
  applyFresnelRim(hullMat, def.apexSeam || cMolten);
  // Plain charcoal hide for neck/legs (shared, no belly gradient); the head reuses
  // the model's own bodyMat at its anchor.
  const hideMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: def.bodyRoughness ?? 0.6, metalness: def.bodyMetalness ?? 0.12,
    emissive: cBody, emissiveIntensity: 0.06,
  });
  applyFresnelRim(hideMat, def.apexSeam || cMolten);
  const plateMat = new THREE.MeshStandardMaterial({
    color: cPlate, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide,
  });

  // BODY — broad chest/shoulders → pinched waist → hip flare → tail root. Width
  // (rx, the X the rear cam reads) is the silhouette: shoulder 0.62 vs waist 0.32.
  const rings = [
    { z: -1.50, rx: 0.26, ry: 0.30, y: 0.80 },  // neck base / upper chest
    { z: -1.12, rx: 0.50, ry: 0.50, y: 0.66 },  // BROAD CHEST
    { z: -0.72, rx: 0.62, ry: 0.56, y: 0.62 },  // SHOULDER mass (widest) — wing roots
    { z: -0.30, rx: 0.55, ry: 0.52, y: 0.60 },  // back of shoulders
    { z:  0.16, rx: 0.32, ry: 0.42, y: 0.58 },  // PINCHED WAIST
    { z:  0.58, rx: 0.40, ry: 0.45, y: 0.56 },  // HIP / haunches
    { z:  0.98, rx: 0.28, ry: 0.32, y: 0.54 },  // rump
    { z:  1.28, rx: 0.14, ry: 0.16, y: 0.52 },  // tail root cap
  ];
  group.add(loftHull(rings, 13, hullMat, rgbArr(cBody), rgbArr(cBelly)));

  const keelTopAt = (z) => sampleRing(rings, z, 'y') + sampleRing(rings, z, 'ry');
  const halfWidthAt = (z) => sampleRing(rings, z, 'rx');

  // MOLTEN DORSAL SPINE (shoulder → rump). A continuous emissive keel ridge — the
  // "magma in the gaps" read — with dark blades standing over it, TALL at the
  // shoulders and tapering aft (never random spikes). Both register as flare mats
  // so they pulse hot-pink on Surge and brighten on boost.
  const ridgeMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cMolten, emissive: cMolten, emissiveIntensity: 0.5 + glow * 1.1,
    roughness: 0.4, metalness: 0.1,
  }), cMolten, 0.5 + glow * 1.1, spineMats);
  const bladeMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cPlate, emissive: cMolten, emissiveIntensity: 0.1 + glow * 0.25,
    roughness: 0.5, metalness: 0.28, side: THREE.DoubleSide,
  }), cMolten, 0.1 + glow * 0.25, spineMats);

  const spineZ0 = -0.85, spineZ1 = 1.05;
  const nSpine = seg(9);
  // Emissive keel ridge: a thin strip following the back between the blades.
  for (let i = 0; i < nSpine; i++) {
    const t = i / (nSpine - 1);
    const z = lerp(spineZ0, spineZ1, t);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, (spineZ1 - spineZ0) / nSpine + 0.02), ridgeMat);
    r.position.set(0, keelTopAt(z) - 0.01, z);
    group.add(r);
  }
  // Dark serrated blades over the ridge — height ramps shoulder→rump, raked back.
  for (let i = 0; i < nSpine; i++) {
    const t = i / (nSpine - 1);
    const z = lerp(spineZ0, spineZ1, t);
    const h = lerp(0.36, 0.10, t) * (0.7 + 0.3 * glow);   // tall at shoulders
    const ky = keelTopAt(z);
    const w = lerp(0.16, 0.06, t);
    // A flat YZ-plane blade (edge-on from behind → a crisp serrated dorsal line).
    const gBlade = new THREE.BufferGeometry();
    gBlade.setAttribute('position', new THREE.Float32BufferAttribute([
      0, ky, z - w, 0, ky, z + w, 0, ky + h, z + w * 0.4,   // base front, base back, raked apex
    ], 3));
    gBlade.setIndex([0, 1, 2]);
    gBlade.computeVertexNormals();
    group.add(new THREE.Mesh(gBlade, bladeMat));
  }

  // LEGLESS — a sleek wyvern-style flyer (legs read weird tucked under the racing
  // body from the chase cam, per the human). The wings + tail carry the silhouette.

  // S-NECK — a parented bone CHAIN (root→tip) so the front of the creature is ALIVE,
  // not stiff: the rig's role animator bobs + BREATHES the 'neck' bones (continuous,
  // even gliding) and composes the 'head'. Returned as `spineSegs`; the head module
  // parents onto the tip (`attach.headMount`) so it rides the neck instead of floating
  // at a fixed anchor. A small `userData.whip` gives the SHOP preview gentle life too.
  const spineSegs = [];
  const neckPts = [
    { y: 0.84, z: -1.50, r: 0.26, role: 'neck' },
    { y: 0.98, z: -1.74, r: 0.23, role: 'neck' },
    { y: 1.10, z: -1.96, r: 0.20, role: 'neck' },
    { y: 1.15, z: -2.18, r: 0.17, role: 'head' },   // tip = the head mount (= headBase)
  ];
  let parent = group, prevY = 0, prevZ = 0, headMount = null;
  neckPts.forEach((p, i) => {
    const bone = new THREE.Group();
    bone.position.set(0, p.y - prevY, p.z - prevZ);   // local offset from the previous bone
    bone.userData.role = p.role;
    bone.userData.whip = { gain: p.role === 'head' ? 0.02 : 0.05, phase: i * 0.6 };
    const n = new THREE.Mesh(new THREE.SphereGeometry(p.r, seg(8), seg(6)), hideMat);
    n.scale.set(0.92, 0.92, 1.15);
    bone.add(n);
    parent.add(bone);
    spineSegs.push(bone);
    parent = bone; prevY = p.y; prevZ = p.z; headMount = bone;
  });

  // Molten THROAT heart-core — a glow nestled under the jaw that brightens on boost
  // and blazes on Surge (adopted by dragonModel as the creature's coreGlow).
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.4 + glow * 0.5;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cMolten)), transparent: true, opacity: 0.16 + lvl * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.7 + lvl * 0.6);
    coreGlow.position.set(0, 0.96, -1.74);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }
  // A small emissive throat-gorget mesh so the molten throat reads in 3/4/bank too.
  const gorget = tagFlare(new THREE.MeshStandardMaterial({
    color: cMolten, emissive: cMolten, emissiveIntensity: 0.4 + glow * 0.8, roughness: 0.4,
  }), cMolten, 0.4 + glow * 0.8, spineMats);
  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.13, seg(7), seg(6)), gorget);
  throat.scale.set(0.9, 0.7, 1.1);
  throat.position.set(0, 0.86, -1.6);
  group.add(throat);

  const attach = {
    // wings sit just BEHIND the shoulder mass, high on the back (rear-V root).
    wingRoot: (side) => ({ x: 0.44 * side, y: 1.02, z: -0.5 }),
    headBase: { x: 0, y: 1.15, z: -2.18 },
    headMount,                      // the head parents to the animated neck tip
    tailAnchor: { y: 0.52, z: 1.1 },
    keelTopAt,
    halfWidthAt,
    bodyMidY: 0.58,
    tailShift: 0,
  };
  return { group, attach, mats: { bodyMat: hideMat }, coreGlow, spineMats, spineSegs };
}
registerTorso('monarchHull', buildMonarchHull);

// ── WINGS — monarchWing ──────────────────────────────────────
// Anatomically-built bat wing (see dragonWingAnatomy.js): a SHORT arm + MEDIAL wrist,
// then LONG CURVED fingers fanning to a convex leading frame + a scalloped trailing
// edge — warm/rounded styling, molten ember-cracked struts. Three-segment articulated
// (wingParts rig); the left is a scale.x=-1 mirror clone of the right master.
function buildMonarchWing(def, model, attach, giM) {
  const group = new THREE.Group();
  const spineMats = [];
  const ws = model.wingScale ?? 1;
  const F = model.formLevel ?? 0;
  const cMolten = def.wingEmissive ?? def.coreGlow ?? 0xff5a1e;

  const wingMat = new THREE.MeshStandardMaterial({
    color: def.wingInner ?? 0x241a16, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide,
    transparent: true, opacity: model.wingOpacity ?? 0.9,
    emissive: def.wingMembraneEmissive ?? cMolten, emissiveIntensity: model.wingPanelGlow ?? 0.12,
  });
  const strutInt = 0.5 + giM * 0.4 + F * 0.12;
  const strutMat = tagFlare(new THREE.MeshStandardMaterial({
    color: def.horn ?? 0x2a221c, emissive: cMolten, emissiveIntensity: strutInt,
    roughness: 0.4, metalness: 0.45,
  }), cMolten, strutInt, spineMats);

  // Warm western-dragon bat wing: SHORT arm, wrist medial (~0.36 span), 5 long curved
  // fingers fanning to rounded scallops; the outer finger frames the wing.
  // SHORT humerus, MEDIAL wrist (~26% of span). 5 fingers fanning from the wrist; the
  // LEADING finger is the long, most-curved convex frame and each finger toward the
  // trailing edge straightens, the innermost ≈ straight (curvature gradient). Swept,
  // tapering planform with protruding claw tips over even scallops.
  const anatomy = {
    rootFront: [0, 0.34], rootBack: [0, -0.58],
    elbow: [0.55, 0.34], wrist: [1.40, 0.46],
    fingers: [
      { tip: [5.30, 0.62], bow: 0.95 },   // leading frame — longest, MOST curved
      { tip: [4.75, -0.25], bow: 0.60 },
      { tip: [3.95, -1.05], bow: 0.36 },
      { tip: [3.00, -1.62], bow: 0.18 },
      { tip: [2.05, -1.90], bow: 0.05 },  // innermost/trailing — nearly STRAIGHT
    ],
    scallop: 0.42, strutR: 0.038, claw: 0.10, hook: 0.9,
  };
  const Rp = buildAnatomicalWing({ ws, membraneMat: wingMat, strutMat, anatomy }).pivot;
  Rp.position.set(...Object.values(attach.wingRoot(1)));
  group.add(Rp);
  const L = mirrorWing(Rp);
  L.pivot.position.set(...Object.values(attach.wingRoot(1)));   // (mirror wrapper flips x)
  group.add(L.wrap);
  const byRole = (root, role) => { let f = null; root.traverse((o) => { if (!f && o.userData && o.userData.wingRole === role) f = o; }); return f; };

  return {
    group,
    parts: {
      wingPivotL: L.pivot, wingPivotR: Rp,
      wingMidL: L.wingMid, wingMidR: byRole(Rp, 'mid'),
      wingTipL: L.wingTip, wingTipR: byRole(Rp, 'tip'),
      tipMarkerL: L.marker, tipMarkerR: byRole(Rp, 'marker'),
      wingPivot2L: null, wingPivot2R: null,
    },
    wingMat,
    spineMats,
  };
}
registerWings('monarchWing', buildMonarchWing);

// ── HEAD — monarchCrown ──────────────────────────────────────────────────────
// An angular wedge skull read as a small CROWN from behind: two swept-back crown
// horns + two cheek-horn ridges (all raked back to preserve speed/readability).
// Deliberately low-detail in the face (barely visible in gameplay).
function buildMonarchCrown(def, model, mats) {
  const group = new THREE.Group();
  const spineMats = [];
  const F = model.formLevel ?? 0;
  const hornLen = (model.hornLen ?? 1) * (0.9 + 0.1 * F);
  const cMolten = def.coreGlow ?? def.wingEmissive ?? 0xff5a1e;

  const skullMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.55, metalness: 0.14, flatShading: true,
  });
  const hornMat = mats.hornMat || new THREE.MeshStandardMaterial({ color: def.horn, roughness: 0.4, metalness: 0.4 });

  // Cranium — an angular box (high brow), muzzle a 4-sided pyramid pointing -Z.
  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.36), skullMat);
  cranium.position.set(0, 0.02, 0.04);
  group.add(cranium);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.10, 0.16), skullMat);
  brow.position.set(0, 0.12, -0.04);
  group.add(brow);
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.46, 4), skullMat);
  muzzle.rotation.x = -Math.PI / 2;        // point forward (-Z)
  muzzle.rotation.y = Math.PI / 4;         // square the 4-gon to the view
  muzzle.position.set(0, -0.03, -0.34);
  group.add(muzzle);

  // Cheek plates — angular side wedges (the "two side cheek horn ridges" base).
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.22), skullMat);
    cheek.position.set(s * 0.17, -0.02, -0.04);
    cheek.rotation.z = s * 0.3;
    group.add(cheek);
  }

  // Eyes — tiny molten pips (face is barely seen; keep cheap).
  const eyeMat = mats.eyeMat || new THREE.MeshStandardMaterial({ color: 0x221100, emissive: def.eye, emissiveIntensity: 2.2 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), eyeMat);
    eye.position.set(s * 0.13, 0.04, -0.18);
    group.add(eye);
  }

  // CROWN HORNS — two large backward-and-up horns: the dominant rear-crown read.
  for (const s of [-1, 1]) {
    const horn = makeHorn(0.62 * hornLen, 0.075, hornMat, 0.16);
    horn.position.set(s * 0.13, 0.10, 0.12);
    horn.rotation.set(0.7, -s * 0.25, s * 0.45);   // up + back + outward splay
    group.add(horn);
  }
  // CHEEK HORNS — smaller swept-back ridges low on the jaw.
  for (const s of [-1, 1]) {
    const horn = makeHorn(0.34 * hornLen, 0.05, hornMat, 0.2);
    horn.position.set(s * 0.18, -0.06, 0.0);
    horn.rotation.set(1.0, -s * 0.2, s * 0.7);
    group.add(horn);
  }

  // CROWN CREST — a couple of molten-edged blades on top, continuing the dorsal
  // line onto the head (flares on Surge).
  const crestMat = tagFlare(new THREE.MeshStandardMaterial({
    color: def.scales ?? def.horn, emissive: cMolten, emissiveIntensity: 0.2 + 0.2 * F,
    roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide,
  }), cMolten, 0.2 + 0.2 * F, spineMats);
  for (let i = 0; i < 3; i++) {
    const z = -0.02 + i * 0.10;
    const h = 0.14 - i * 0.03;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0.14, z - 0.04, 0, 0.14, z + 0.04, 0, 0.14 + h, z + 0.05,
    ], 3));
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    group.add(new THREE.Mesh(g, crestMat));
  }

  // Face the head forward (it's authored facing -Z already; the torso anchor sits
  // it on the neck). A slight downward set so the crown reads from the chase cam.
  group.rotation.x = 0.12;
  return { group, spineMats };
}
registerHead('monarchCrown', buildMonarchCrown);

// ── TAIL — monarchTail ───────────────────────────────────────────────────────
// A SMOOTH muscular taper (heavily-overlapping z-elongated sections that merge into a
// continuous tail — not spaced beads), molten dorsal SCUTES continuing the spine down
// it, ending in a DISTINCT fanned FLAME-BLADE tip (a spray of molten-edged fins, per
// the concept). Sibling-seg chain so the shared position-wave rig sways it.
function buildMonarchTail(def, model, mats, anchor) {
  const root = new THREE.Group();
  root.position.set(0, anchor.y, anchor.z);
  const segs = [];
  const accentMats = [];
  const F = model.formLevel ?? 0;
  const glow = model.spineGlow ?? (F / 3);
  const lenK = 1.5 * (model.tailLength ?? 1);
  const cMolten = def.coreGlow ?? def.wingEmissive ?? 0xff5a1e;

  const hideMat = mats.bodyMat;            // shared charcoal hide (already rimmed)
  const scuteMat = tagFlare(new THREE.MeshStandardMaterial({
    color: def.scales ?? def.horn, emissive: cMolten, emissiveIntensity: 0.18 + glow * 0.4,
    roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide,
  }), cMolten, 0.18 + glow * 0.4, accentMats);
  const finDarkMat = tagFlare(new THREE.MeshStandardMaterial({
    color: def.scales ?? 0x33271f, emissive: cMolten, emissiveIntensity: 0.3 + glow * 0.5,
    roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide,
  }), cMolten, 0.3 + glow * 0.5, accentMats);
  const finHotMat = tagFlare(new THREE.MeshStandardMaterial({
    color: cMolten, emissive: cMolten, emissiveIntensity: 0.9 + glow * 1.0,
    roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide,
  }), cMolten, 0.9 + glow * 1.0, accentMats);

  // Heavily-overlapping z-elongated ellipsoids → a continuous smooth taper. One shared
  // unit sphere, scaled per segment; z-step < the combined radii so sections MERGE.
  const n = seg(12);
  const radii = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); radii.push(lerp(0.21, 0.03, Math.pow(t, 0.85))); }
  const unit = new THREE.SphereGeometry(1, seg(9), seg(7));
  let z = 0;
  for (let i = 0; i < n; i++) {
    const r = radii[i];
    const segG = new THREE.Group();
    segG.position.set(0, 0, z);
    const m = new THREE.Mesh(unit, hideMat);
    m.scale.set(r * 1.05, r * 0.95, r * 1.55);   // tube-like, blends with its neighbours
    segG.add(m);
    // Molten dorsal scute on top (the spine line continuing down the tail, tapering).
    if (i < n - 2) {
      const t = i / (n - 1);
      const h = lerp(0.13, 0.03, t), w = r * 0.55;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([
        0, r * 0.9, -w, 0, r * 0.9, w, 0, r * 0.9 + h, w * 0.5,
      ], 3));
      g.setIndex([0, 1, 2]); g.computeVertexNormals();
      segG.add(new THREE.Mesh(g, scuteMat));
    }
    root.add(segG); segs.push(segG);
    const rN = radii[i + 1] ?? r * 0.8;
    z += (r + rN) * 0.5 * lenK;
  }

  // FLAME-BLADE TIP — a fan of molten-edged blade fins spraying BACK + UP like a flame
  // (the concept's tail terminus). Parented to the last seg so it rides the coil.
  const tipSeg = segs[n - 1];
  const bladeFin = (L, W) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,  W, 0, L * 0.42,  0, 0, L,  -W, 0, L * 0.42,   // a slim leaf-blade pointing +Z
    ], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    return g;
  };
  const fanN = seg(5);
  for (let i = 0; i < fanN; i++) {
    const a = fanN > 1 ? (i / (fanN - 1) - 0.5) : 0;     // −0.5 … +0.5 across the fan
    const central = Math.max(0, 1 - Math.abs(a) * 1.5);  // longest in the middle
    const L = lerp(0.30, 0.6, central) * (0.7 + 0.3 * (model.tailLength ?? 1));
    const fin = new THREE.Mesh(bladeFin(L, 0.05 + 0.035 * central), i % 2 === 0 ? finHotMat : finDarkMat);
    fin.position.set(0, 0.02, 0.04);
    fin.rotation.y = a * 1.5;                              // spread in x
    fin.rotation.x = -0.5 - Math.abs(a) * 0.35;           // rise up + back (flame lick)
    tipSeg.add(fin);
  }

  return { group: root, segs, tailFins: null, accentMats };
}
registerTail('monarchTail', buildMonarchTail);
