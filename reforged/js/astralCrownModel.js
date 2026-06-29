import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { makeGlowTexture } from './util.js';

// ===========================================================================
// ASTRAL CROWN SOVEREIGN — a from-scratch celestial-emperor dragon.
// ===========================================================================
// A dedicated archetype model (dispatched by def.archetype === 'astralCrown'),
// built like the Phoenix was: its OWN custom geometry from a blank page, reusing
// NONE of the shared dragon part-builders (no membrane kite-frame, no lofted
// blade-tube torso, no chrome shoulder ball). The only thing it shares is the
// invisible RIG CONTRACT — it returns the exact { group, parts, materials,
// auraSprite } handle set the flap/boost/preview drive, so it flies + previews
// unchanged. Everything you SEE is new code.
//
// EVERY shaping number is a NAMED DIAL in CROWN_PARAMS so the tuner
// (tools/crown-tuner.html) can drive the whole creature with live sliders. A
// blueprint can override any dial via `model.crownParams`; the defaults below are
// the shipped look.
//
// `F = model.formLevel` (0..3) drives growth: crown size, armor coverage, spine
// height/count, wing reach/rise, core blaze, and the apex halo.

// ── THE DIALS (defaults = the shipped Astral Crown look) ────────────────────
export const CROWN_PARAMS = {
  // body masses (cross-section half-extents; bodyLen scales the length)
  chestW: 0.82, chestH: 0.80, thoraxW: 0.66, waistW: 0.44, haunchW: 0.62, bodyLen: 1.0,
  // wings
  wingSpan: 3.95, wingRise: 1.9, wingChord: 1.05, wingChordRoot: 0.5, wingPennant: 0.08,
  wingRootX: 0.46, wingRootY: 0.86, wingRootZ: -0.66, wingSweep: 0.08,
  // crown of horns
  hornMainLen: 1.0, hornMainSpread: 1.0, hornSecondLen: 1.0, hornThick: 1.0, crestHeight: 1.0,
  // dorsal spine line
  spineCount: 7, spineHeight: 1.0, spinePeak: 0.18,
  // star-metal armor
  shoulderSize: 1.0, shoulderSpread: 1.0, shoulderCup: 0.32,
  // tail + crown-spade
  tailSegs: 6, tailStep: 0.34, tailTaper: 0.12, tailRootR: 0.26, spadeSize: 1.0,
  // core, glow + material finish
  coreSize: 1.0, crownGlow: 1.0, edgeGlow: 1.0, coreGlowI: 1.0, membraneOpacity: 0.62,
  bodyMetal: 0.18, bodyRough: 0.46, armorMetal: 0.66,
};

// What the tuner renders as sliders (grouped). Colours are handled separately
// (CROWN_COLOR_KEYS → colour pickers that edit the def palette).
export const CROWN_PARAM_SCHEMA = [
  { group: 'Body', items: [
    { k: 'chestW', min: 0.4, max: 1.3, step: 0.01, label: 'Chest width' },
    { k: 'chestH', min: 0.4, max: 1.3, step: 0.01, label: 'Chest height' },
    { k: 'thoraxW', min: 0.3, max: 1.1, step: 0.01, label: 'Thorax width' },
    { k: 'waistW', min: 0.25, max: 0.9, step: 0.01, label: 'Waist width' },
    { k: 'haunchW', min: 0.3, max: 1.1, step: 0.01, label: 'Haunch width' },
    { k: 'bodyLen', min: 0.7, max: 1.4, step: 0.01, label: 'Body length' },
  ] },
  { group: 'Wings', items: [
    { k: 'wingSpan', min: 2.5, max: 6.0, step: 0.05, label: 'Wingspan' },
    { k: 'wingRise', min: 0.6, max: 3.4, step: 0.05, label: 'Upsweep (royal V)' },
    { k: 'wingChord', min: 0.4, max: 2.0, step: 0.02, label: 'Membrane fullness' },
    { k: 'wingChordRoot', min: 0.1, max: 1.3, step: 0.02, label: 'Tip chord' },
    { k: 'wingPennant', min: 0.0, max: 0.4, step: 0.01, label: 'Scallop depth' },
    { k: 'wingSweep', min: -0.1, max: 0.4, step: 0.01, label: 'Leading sweep' },
    { k: 'wingRootX', min: 0.2, max: 0.9, step: 0.01, label: 'Root spread' },
    { k: 'wingRootY', min: 0.5, max: 1.2, step: 0.01, label: 'Root height' },
    { k: 'wingRootZ', min: -1.2, max: 0.0, step: 0.02, label: 'Root fwd/back' },
  ] },
  { group: 'Crown', items: [
    { k: 'hornMainLen', min: 0.4, max: 2.0, step: 0.02, label: 'Main horn length' },
    { k: 'hornMainSpread', min: 0.4, max: 2.2, step: 0.02, label: 'Main horn spread' },
    { k: 'hornSecondLen', min: 0.0, max: 2.0, step: 0.02, label: '2nd horn length' },
    { k: 'hornThick', min: 0.4, max: 2.2, step: 0.02, label: 'Horn thickness' },
    { k: 'crestHeight', min: 0.0, max: 2.2, step: 0.02, label: 'Crest height' },
  ] },
  { group: 'Dorsal spine', items: [
    { k: 'spineCount', min: 3, max: 16, step: 1, label: 'Spine count' },
    { k: 'spineHeight', min: 0.3, max: 2.2, step: 0.02, label: 'Spine height' },
    { k: 'spinePeak', min: 0.0, max: 0.6, step: 0.01, label: 'Tallest at' },
  ] },
  { group: 'Armor', items: [
    { k: 'shoulderSize', min: 0.4, max: 2.0, step: 0.02, label: 'Shoulder mantle' },
    { k: 'shoulderSpread', min: 0.5, max: 1.8, step: 0.02, label: 'Shoulder spread' },
    { k: 'shoulderCup', min: 0.0, max: 0.6, step: 0.01, label: 'Plate cup' },
  ] },
  { group: 'Tail', items: [
    { k: 'tailSegs', min: 3, max: 12, step: 1, label: 'Tail segments' },
    { k: 'tailStep', min: 0.2, max: 0.6, step: 0.01, label: 'Tail length' },
    { k: 'tailTaper', min: 0.04, max: 0.3, step: 0.01, label: 'Tail taper' },
    { k: 'tailRootR', min: 0.12, max: 0.45, step: 0.01, label: 'Tail thickness' },
    { k: 'spadeSize', min: 0.4, max: 2.2, step: 0.02, label: 'Crown-spade size' },
  ] },
  { group: 'Glow & finish', items: [
    { k: 'coreSize', min: 0.4, max: 2.2, step: 0.02, label: 'Core size' },
    { k: 'coreGlowI', min: 0.2, max: 2.5, step: 0.02, label: 'Core glow' },
    { k: 'crownGlow', min: 0.2, max: 2.5, step: 0.02, label: 'Crown glow' },
    { k: 'edgeGlow', min: 0.2, max: 2.5, step: 0.02, label: 'Vein glow' },
    { k: 'membraneOpacity', min: 0.2, max: 1.0, step: 0.02, label: 'Membrane opacity' },
    { k: 'bodyMetal', min: 0.0, max: 1.0, step: 0.02, label: 'Body metalness' },
    { k: 'bodyRough', min: 0.1, max: 1.0, step: 0.02, label: 'Body roughness' },
    { k: 'armorMetal', min: 0.0, max: 1.0, step: 0.02, label: 'Armor metalness' },
  ] },
];

export const CROWN_COLOR_KEYS = [
  { k: 'body', label: 'Body (ivory)' },
  { k: 'scales', label: 'Armor (star-metal)' },
  { k: 'wingInner', label: 'Membrane root (indigo)' },
  { k: 'wingOuter', label: 'Membrane edge (silver)' },
  { k: 'horn', label: 'Crown horns' },
  { k: 'coreGlow', label: 'Core / starlight' },
  { k: 'apexSeam', label: 'Light seam (gold)' },
  { k: 'eye', label: 'Eyes' },
];

const lerp = (a, b, t) => a + (b - a) * t;

// A ring of points on an ellipse (rx,ry) centred at (0, yc, z) — the body loft unit.
function ellipseRing(rx, ry, yc, z, m) {
  const r = [];
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2;
    r.push(new THREE.Vector3(Math.cos(a) * rx, yc + Math.sin(a) * ry, z));
  }
  return r;
}

// Loft a stack of equal-length rings into one smooth closed surface.
function loftRings(rings, mat) {
  const m = rings[0].length;
  const verts = [], idx = [];
  for (const ring of rings) for (const p of ring) verts.push(p.x, p.y, p.z);
  for (let s = 0; s < rings.length - 1; s++) {
    const a0 = s * m, b0 = (s + 1) * m;
    for (let k = 0; k < m; k++) {
      const n = (k + 1) % m;
      idx.push(a0 + k, b0 + k, a0 + n, a0 + n, b0 + k, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// A tapered cylinder from a→b (limbs, horns, spars, leading-edge frame).
function tube(ax, ay, az, bx, by, bz, r0, r1, mat) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az);
  const len = dir.length() || 1e-3;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg(7)), mat);
  m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}

// Parabolic upsweep: raise verts toward the wing tip so the wing arcs UP into a
// royal V and presents its surface to the above-and-behind camera.
function archUp(geo, span, h) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = Math.abs(p.getX(i)) / span;
    p.setY(i, p.getY(i) + x * x * h);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
}

// Spanwise vertex-colour gradient (root→tip along |x|): deep royal indigo at the
// body, pale star-silver at the edge — the ceremonial-mantle read.
function spanGradient(geo, c0, c1, span) {
  const p = geo.attributes.position;
  const a = new THREE.Color(c0), b = new THREE.Color(c1), c = new THREE.Color();
  const col = [];
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(Math.abs(p.getX(i)) / span, 1);
    c.copy(a).lerp(b, t);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}

// A flat tapered spine/crest BLADE (pointed, gently back-curved), height +Y.
function spineBlade(h, w, sweep, mat) {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.5, 0);
  s.quadraticCurveTo(-w * 0.16, h * 0.5, sweep * 0.4, h * 0.86);
  s.quadraticCurveTo(sweep * 0.5, h, sweep, h);
  s.quadraticCurveTo(sweep * 0.5 + w * 0.16, h * 0.6, w * 0.5, 0);
  s.closePath();
  const g = new THREE.ShapeGeometry(s, seg(5));
  g.rotateY(Math.PI / 2);   // face the blade sideways → a tall crest from behind
  return new THREE.Mesh(g, mat);
}

const hexRgb = (h) => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;

export function buildAstralCrownModel(def, opts = {}) {
  const model = def.model || {};
  const P = { ...CROWN_PARAMS, ...(model.crownParams || {}), ...(opts.params || {}) };
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  // ── palette ──────────────────────────────────────────────────────────────
  const cBody = def.body ?? 0xEFEDE2;
  const cArmor = def.scales ?? 0xB8C2D2;
  const cInner = def.wingInner ?? 0x2a356e;
  const cOuter = def.wingOuter ?? 0xC9D6F2;
  const cHorn = def.horn ?? 0xEAE7DA;
  const cEnergy = def.coreGlow ?? 0xBFE6FF;
  const cSeam = def.apexSeam ?? def.wingEmissive ?? 0xFFF1C8;
  const cEye = def.eye ?? 0xCFE9FF;

  // ── materials ──────────────────────────────────────────────────────────────
  const tag = (mat, em, inten) => { mat.userData.baseEmissive = em; mat.userData.baseIntensity = inten; spineMats.push(mat); return mat; };

  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: P.bodyRough, metalness: P.bodyMetal,
    emissive: cBody, emissiveIntensity: 0.05 + F * 0.03, side: THREE.DoubleSide,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: cArmor, roughness: 0.28, metalness: P.armorMetal,
    emissive: cInner, emissiveIntensity: 0.06, side: THREE.DoubleSide,
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x101522, emissive: cEye, emissiveIntensity: 2.1 });
  const membraneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide,
    transparent: true, opacity: Math.min(1, P.membraneOpacity + F * 0.04), emissive: cInner, emissiveIntensity: 0.14 + F * 0.1,
  });
  const crownMat = tag(new THREE.MeshStandardMaterial({
    color: cHorn, emissive: cSeam, emissiveIntensity: (0.45 + F * 0.45) * P.crownGlow, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide,
  }), cSeam, (0.45 + F * 0.45) * P.crownGlow);
  const edgeMat = tag(new THREE.MeshStandardMaterial({
    color: cEnergy, emissive: cEnergy, emissiveIntensity: (0.8 + F * 0.6) * P.edgeGlow, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
  }), cEnergy, (0.8 + F * 0.6) * P.edgeGlow);
  const coreMat = tag(new THREE.MeshStandardMaterial({
    color: cEnergy, emissive: cEnergy, emissiveIntensity: (1.3 + F * 0.9) * P.coreGlowI, roughness: 0.3,
  }), cEnergy, (1.3 + F * 0.9) * P.coreGlowI);

  // ── BODY — a muscular lofted torso (deep chest → pinched waist → haunches) ──
  const M = seg(16);
  const zL = P.bodyLen;
  const stations = [
    [-1.78 * zL, 0.10, 0.12, 0.56],
    [-1.34 * zL, 0.50, 0.56, 0.55],
    [-0.82 * zL, P.chestW, P.chestH, 0.52],   // BROAD DEEP CHEST + shoulders
    [-0.18 * zL, P.thoraxW, 0.66, 0.50],
    [ 0.46 * zL, P.waistW, 0.50, 0.50],       // WAIST
    [ 1.06 * zL, P.haunchW, 0.58, 0.49],      // HAUNCHES
    [ 1.54 * zL, 0.34, 0.34, 0.50],
    [ 1.86 * zL, 0.10, 0.12, 0.52],
  ];
  const rings = stations.map(([z, rx, ry, yc]) => ellipseRing(rx, ry, yc, z, M));
  group.add(loftRings(rings, bodyMat));

  const backY = (z) => {
    for (let i = 0; i < stations.length - 1; i++) {
      const [z0, , ry0, yc0] = stations[i];
      const [z1, , ry1, yc1] = stations[i + 1];
      if (z <= z1) { const t = (z - z0) / (z1 - z0 || 1); return lerp(yc0 + ry0, yc1 + ry1, t); }
    }
    const last = stations[stations.length - 1]; return last[3] + last[2];
  };

  // ── ARMOR — star-metal plates (shoulder mantle, sternum, haunches) ─────────
  function plate(w, h, cup, mat) {
    const cols = seg(5), rows = seg(3), verts = [], idx = [];
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const u = c / cols - 0.5, v = r / rows - 0.5;
      verts.push(u * w, v * h, -cup * (1 - 4 * u * u) * (1 - 4 * v * v));
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  for (const s of [-1, 1]) {
    const sh = plate((0.98 + F * 0.08) * P.shoulderSize, (0.78 + F * 0.06) * P.shoulderSize, P.shoulderCup, armorMat);
    sh.position.set(s * (0.6 + F * 0.03) * P.shoulderSpread, 0.74, -0.72);
    sh.rotation.set(0.42, s * 0.62, s * -0.34);
    sh.scale.setScalar(1 + F * 0.07);
    group.add(sh);
    if (F >= 1) {
      const spur = tube(s * 0.34, 0.92, -0.92, s * (0.62 + F * 0.04) * P.shoulderSpread, 1.0 + F * 0.05, -0.95, 0.05, 0.015, crownMat);
      group.add(spur);
    }
    const hp = plate(0.5, 0.5, 0.2, armorMat);
    hp.position.set(s * 0.5, 0.6, 1.02);
    hp.rotation.set(0.2, s * -0.5, s * 0.2);
    group.add(hp);
  }
  const sternum = plate(0.46, 0.66, 0.22, armorMat);
  sternum.position.set(0, 0.34, -0.9);
  sternum.rotation.x = 1.5;
  group.add(sternum);

  // ── CELESTIAL CORE — a luminous gem in the chest + a bloom sprite ──────────
  const core = new THREE.Mesh(new THREE.OctahedronGeometry((0.17 + F * 0.03) * P.coreSize, 0), coreMat);
  core.scale.set(0.8, 1.15, 0.8);
  core.position.set(0, 0.4, -0.86);
  group.add(core);
  let coreGlow = null;
  {
    const lvl = 0.4 + F * 0.2;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0.18 + lvl * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar((0.8 + lvl * 0.7) * P.coreSize);
    coreGlow.position.set(0, 0.4, -0.86);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // ── DORSAL SPINE LINE — crown crest → tall upper-back → tapering tail ───────
  const spineN = Math.round(P.spineCount) + F * 2;
  const sz0 = -1.05, sz1 = 1.5;
  for (let i = 0; i < spineN; i++) {
    const t = i / (spineN - 1);
    const z = lerp(sz0, sz1, t);
    const peak = Math.exp(-Math.pow((t - P.spinePeak) / 0.5, 2));
    const h = (0.22 + (0.5 + F * 0.12) * peak) * (1 - t * 0.35) * P.spineHeight;
    const blade = spineBlade(h, 0.13 + F * 0.01, -h * 0.5, crownMat);
    blade.position.set(0, backY(z) - 0.02, z);
    group.add(blade);
    if (F >= 2) {
      const seam = tube(0, backY(z) - 0.02, z - 0.02, 0, backY(z) + h - 0.02, z - h * 0.5, 0.02, 0.006, edgeMat);
      group.add(seam);
    }
  }

  // ── NECK + HEAD — a proud arch into a noble wedge skull wearing a crown ─────
  const neckPts = [[0, 0.66, -1.5], [0, 0.82, -2.0], [0, 0.95, -2.45]];
  for (let i = 0; i < neckPts.length; i++) {
    const r = 0.34 - i * 0.05;
    const n = new THREE.Mesh(new THREE.SphereGeometry(r, seg(11), seg(9)), bodyMat);
    n.scale.set(0.86, 0.9, 1.05);
    n.position.set(neckPts[i][0], neckPts[i][1], neckPts[i][2]);
    group.add(n);
  }

  const head = new THREE.Group();
  head.position.set(0, 1.0, -2.62);
  group.add(head);
  const cran = new THREE.Mesh(new THREE.SphereGeometry(0.3, seg(12), seg(10)), bodyMat);
  cran.scale.set(0.78, 0.82, 1.12);
  head.add(cran);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.26), bodyMat);
  brow.position.set(0, 0.14, -0.18); brow.rotation.x = -0.2;
  head.add(brow);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.2, 0.5, seg(8)), bodyMat);
  snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.04, -0.42); snout.scale.set(1.1, 1, 1);
  head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.34), bodyMat);
  jaw.position.set(0, -0.13, -0.34);
  head.add(jaw);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, seg(8), seg(6)), eyeMat);
    e.position.set(s * 0.16, 0.04, -0.22);
    head.add(e);
  }
  // CROWN of horns — main back-swept + secondary outer + cheek spines + crest.
  function crownHorn(x0, y0, z0, dx, dy, dz, r0, segsN) {
    const px = [x0], py = [y0], pz = [z0];
    for (let i = 1; i <= segsN; i++) {
      const t = i / segsN;
      px.push(x0 + dx * t);
      py.push(y0 + dy * t - dy * 0.18 * t * t);
      pz.push(z0 + dz * t + dz * 0.25 * t * t);
    }
    for (let i = 0; i < segsN; i++) {
      const r = r0 * (1 - i / segsN * 0.82);
      head.add(tube(px[i], py[i], pz[i], px[i + 1], py[i + 1], pz[i + 1], r, r0 * (1 - (i + 1) / segsN * 0.82), crownMat));
    }
  }
  for (const s of [-1, 1]) {
    crownHorn(s * 0.16, 0.22, 0.0, s * (0.34 + F * 0.04) * P.hornMainSpread, (0.5 + F * 0.12) * P.hornMainLen, (0.66 + F * 0.06) * P.hornMainLen, (0.06 + F * 0.006) * P.hornThick, 4);
    crownHorn(s * 0.24, 0.12, 0.04, s * (0.5 + F * 0.05) * P.hornMainSpread, (0.26 + F * 0.06) * P.hornSecondLen, 0.5 * P.hornSecondLen, 0.045 * P.hornThick, 3);
    if (F >= 1) crownHorn(s * 0.2, -0.06, -0.06, s * 0.26, -0.04, 0.34, 0.03 * P.hornThick, 2);
  }
  {
    const c = spineBlade((0.34 + F * 0.08) * P.crestHeight, 0.1, -0.16, crownMat);
    c.position.set(0, 0.2, 0.06);
    head.add(c);
  }

  // ── WINGS — broad CATHEDRAL-MANTLE wings throwing a royal V ─────────────────
  const ws = model.wingScale ?? 1;
  const spanMax = (P.wingSpan + F * 0.4) * ws;
  const rise = (P.wingRise + F * 0.5) * ws;
  const wristX = spanMax * 0.46;

  function buildWing(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * P.wingRootX, P.wingRootY, P.wingRootZ);
    pivot.add(tube(0, 0, 0, side * wristX, rise * 0.46, 0.08, 0.1, 0.05, armorMat));
    pivot.add(tube(side * wristX, rise * 0.46, 0.08, side * spanMax, rise, 0.34, 0.05, 0.018, armorMat));

    const fingers = [1.0, 0.74, 0.5, 0.28];
    const chordAt = (f) => (P.wingChordRoot + P.wingChord * Math.pow(1 - f, 0.6)) * ws;
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.22 * ws);
    sh.bezierCurveTo(wristX * 0.5, -0.3 * ws, wristX, -0.2 * ws, spanMax, spanMax * P.wingSweep);
    let prevX = spanMax, prevY = spanMax * P.wingSweep + chordAt(1.0);
    sh.lineTo(prevX, prevY);
    for (let i = 1; i < fingers.length; i++) {
      const fx = spanMax * fingers[i];
      const fy = fx * 0.05 + chordAt(fingers[i]);
      const mx = (prevX + fx) / 2;
      const my = Math.min(prevY, fy) - P.wingPennant * ws;
      sh.quadraticCurveTo(mx, my, fx, fy);
      prevX = fx; prevY = fy;
    }
    sh.quadraticCurveTo(wristX * 0.4, prevY + 0.04 * ws, 0, 1.28 * ws);
    sh.lineTo(0, -0.22 * ws);
    const memGeo = new THREE.ShapeGeometry(sh, seg(14));
    memGeo.rotateX(Math.PI / 2);
    archUp(memGeo, spanMax, rise);
    spanGradient(memGeo, cInner, cOuter, spanMax);
    const mem = new THREE.Mesh(memGeo, membraneMat);
    mem.scale.x = side;
    pivot.add(mem);

    for (let i = 0; i < fingers.length; i++) {
      const fx = spanMax * fingers[i];
      const fyZ = -(fx * 0.06 + chordAt(fingers[i]) * 0.5);
      const tipY = (fx / spanMax) * (fx / spanMax) * rise;
      pivot.add(tube(side * wristX, rise * 0.46 + 0.02, 0.06, side * fx, tipY + 0.03, fyZ, 0.03, 0.008, edgeMat));
    }

    const wingTip = new THREE.Group();
    wingTip.position.set(side * wristX, rise * 0.46, 0.06);
    const marker = new THREE.Object3D();
    marker.position.set(side * (spanMax - wristX), rise - rise * 0.46, 0.34);
    wingTip.add(marker);
    pivot.add(wingTip);

    group.add(pivot);
    return { pivot, wingTip, marker };
  }
  const R = buildWing(1), L = buildWing(-1);

  // ── LEGS — four tucked/trailing limbs ──────────────────────────────────────
  function leg(x, y, z, back, len, mat) {
    const g = new THREE.Group();
    const thighEnd = [x * 0.7, y - len * 0.4, z + back * 0.5];
    const footEnd = [x * 0.5, y - len * 0.85, z + back];
    g.add(tube(x, y, z, thighEnd[0], thighEnd[1], thighEnd[2], 0.13, 0.08, mat));
    g.add(tube(thighEnd[0], thighEnd[1], thighEnd[2], footEnd[0], footEnd[1], footEnd[2], 0.08, 0.045, mat));
    for (let c = -1; c <= 1; c++) {
      g.add(tube(footEnd[0], footEnd[1], footEnd[2], footEnd[0] + c * 0.06, footEnd[1] - 0.08, footEnd[2] + 0.14, 0.025, 0.008, mat));
    }
    return g;
  }
  for (const s of [-1, 1]) {
    group.add(leg(s * 0.34, 0.3, -0.5, 0.5, 0.7, bodyMat));
    group.add(leg(s * 0.4, 0.28, 0.95, 0.6, 0.8, bodyMat));
  }

  // ── TAIL — a long refined coil ending in a CROWN-SPADE ─────────────────────
  const tailSegs = [];
  const tailN = Math.round(P.tailSegs) + F;
  // Root the chain at the rump so the rig's coil (which OVERWRITES each seg's local
  // x/y every frame) curls the tail relative to the body instead of snapping seg 0
  // to the origin and detaching it.
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 0.5, 1.85);
  group.add(tailRoot);
  let parent = tailRoot;
  let r = P.tailRootR;
  for (let i = 0; i < tailN; i++) {
    const segGrp = new THREE.Group();
    segGrp.position.set(0, 0, i === 0 ? 0 : P.tailStep);
    parent.add(segGrp);
    const r1 = r * (1 - P.tailTaper);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r, P.tailStep + 0.02, seg(8)), bodyMat);
    m.rotation.x = Math.PI / 2;
    m.position.z = P.tailStep * 0.5;
    segGrp.add(m);
    const sb = spineBlade((0.16 + (tailN - i) * 0.012 + F * 0.02) * P.spineHeight, 0.07, -0.06, crownMat);
    sb.position.set(0, r1 + 0.02, P.tailStep * 0.5);
    segGrp.add(sb);
    tailSegs.push(segGrp);
    parent = segGrp;
    r = r1;
  }
  {
    const tip = tailSegs[tailSegs.length - 1];
    const s = new THREE.Shape();
    const L2 = (1.0 + F * 0.16) * P.spadeSize, W = (0.42 + F * 0.04) * P.spadeSize;
    s.moveTo(0, 0);
    s.quadraticCurveTo(W, L2 * 0.34, W * 0.5, L2 * 0.66);
    s.lineTo(W * 0.74, L2 * 0.82);
    s.quadraticCurveTo(W * 0.18, L2 * 0.9, 0, L2);
    s.quadraticCurveTo(-W * 0.18, L2 * 0.9, -W * 0.74, L2 * 0.82);
    s.lineTo(-W * 0.5, L2 * 0.66);
    s.quadraticCurveTo(-W, L2 * 0.34, 0, 0);
    const g = new THREE.ShapeGeometry(s, seg(8));
    g.rotateX(-Math.PI / 2);
    const spade = new THREE.Mesh(g, crownMat);
    spade.position.set(0, 0.02, P.tailStep);
    tip.add(spade);
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + L2 * 0.92, 0.03, 0.008, edgeMat));
  }

  // ── APEX HALO — a soft celestial corona behind the monarch (form 3) ─────────
  if (F >= 3) {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cSeam)), transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.set(5.4, 6.4, 1);
    halo.position.set(0, 0.95, -0.4);
    halo.layers.set(1);
    group.add(halo);
  }

  // ── fever/idle AURA sprite (the rig fades it on Surge) ──────────────────────
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale ?? 1);

  return {
    group,
    parts: {
      head, tailSegs,
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null,
      coreGlow,
    },
    materials: { bodyMat, wingMat: membraneMat, eyeMat, spineMats },
    auraSprite,
  };
}
