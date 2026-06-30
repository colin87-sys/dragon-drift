import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { makeGlowTexture } from './util.js';

// ===========================================================================
// ASTRAL CROWN SOVEREIGN — a from-scratch celestial-emperor dragon + SHAPE KIT.
// ===========================================================================
// A dedicated archetype model (def.archetype === 'astralCrown'), built like the
// Phoenix was: its OWN custom geometry, reusing NONE of the shared part-builders.
// It returns the standard rig contract ({group, parts, materials, auraSprite}) so
// the flap/boost/preview drive it unchanged.
//
// TWO layers of control, both driven by the live tuner (tools/crown-tuner.html):
//   • STYLE  — pick the SHAPE of each component from a registry of hand-crafted
//              variants: wings / torso / head / tail (model.crownStyles).
//   • DIALS  — fine-tune proportions/finish with CROWN_PARAMS (model.crownParams).
// A blueprint can pin both; the defaults below are the shipped look.
//
// `F = model.formLevel` (0..3) escalates crown/armor/wings/light.

// ── DIALS (defaults = the shipped look) ─────────────────────────────────────
export const CROWN_PARAMS = {
  chestW: 0.82, chestH: 0.80, thoraxW: 0.66, waistW: 0.44, haunchW: 0.62, bodyLen: 1.0,
  wingSpan: 3.95, wingRise: 1.9, wingChord: 1.05, wingChordRoot: 0.5, wingPennant: 0.08,
  wingRootX: 0.46, wingRootY: 0.86, wingRootZ: -0.66, wingSweep: 0.08,
  hornMainLen: 1.0, hornMainSpread: 1.0, hornSecondLen: 1.0, hornThick: 1.0, crestHeight: 1.0,
  spineCount: 7, spineHeight: 1.0, spinePeak: 0.18,
  shoulderSize: 1.0, shoulderSpread: 1.0, shoulderCup: 0.32,
  tailSegs: 6, tailStep: 0.34, tailTaper: 0.12, tailRootR: 0.26, spadeSize: 1.0,
  coreSize: 1.0, crownGlow: 1.0, edgeGlow: 1.0, coreGlowI: 1.0, membraneOpacity: 0.62,
  bodyMetal: 0.18, bodyRough: 0.46, armorMetal: 0.66,
};

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
    { k: 'spadeSize', min: 0.4, max: 2.2, step: 0.02, label: 'Tail-tip size' },
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

export const CROWN_DEFAULT_STYLES = { torso: 'regal', wings: 'cathedral', head: 'crownedWedge', tail: 'crownSpade' };

// ── shared geometry helpers (all custom — the kit reuses nothing external) ──
const lerp = (a, b, t) => a + (b - a) * t;
const hexRgb = (h) => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;

function ellipseRing(rx, ry, yc, z, m) {
  const r = [];
  for (let i = 0; i < m; i++) { const a = (i / m) * Math.PI * 2; r.push(new THREE.Vector3(Math.cos(a) * rx, yc + Math.sin(a) * ry, z)); }
  return r;
}
function loftRings(rings, mat) {
  const m = rings[0].length, verts = [], idx = [];
  for (const ring of rings) for (const p of ring) verts.push(p.x, p.y, p.z);
  for (let s = 0; s < rings.length - 1; s++) { const a0 = s * m, b0 = (s + 1) * m; for (let k = 0; k < m; k++) { const n = (k + 1) % m; idx.push(a0 + k, b0 + k, a0 + n, a0 + n, b0 + k, b0 + n); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function tube(ax, ay, az, bx, by, bz, r0, r1, mat) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az), len = dir.length() || 1e-3;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg(7)), mat);
  m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}
function archUp(geo, span, h) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = Math.abs(p.getX(i)) / span; p.setY(i, p.getY(i) + x * x * h); }
  p.needsUpdate = true; geo.computeVertexNormals();
}
function spanGradient(geo, c0, c1, span) {
  const p = geo.attributes.position, a = new THREE.Color(c0), b = new THREE.Color(c1), c = new THREE.Color(), col = [];
  for (let i = 0; i < p.count; i++) { const t = Math.min(Math.abs(p.getX(i)) / span, 1); c.copy(a).lerp(b, t); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}
function spineBlade(h, w, sweep, mat) {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.5, 0); s.quadraticCurveTo(-w * 0.16, h * 0.5, sweep * 0.4, h * 0.86);
  s.quadraticCurveTo(sweep * 0.5, h, sweep, h); s.quadraticCurveTo(sweep * 0.5 + w * 0.16, h * 0.6, w * 0.5, 0); s.closePath();
  const g = new THREE.ShapeGeometry(s, seg(5)); g.rotateY(Math.PI / 2);
  return new THREE.Mesh(g, mat);
}
function plate(w, h, cup, mat) {
  const cols = seg(5), rows = seg(3), verts = [], idx = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { const u = c / cols - 0.5, v = r / rows - 0.5; verts.push(u * w, v * h, -cup * (1 - 4 * u * u) * (1 - 4 * v * v)); }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function featherLeaf(len, wid, baseHex, tipHex, mat) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(wid * 0.5, len * 0.32, wid * 0.16, len * 0.92);
  s.quadraticCurveTo(0, len, -wid * 0.16, len * 0.92); s.quadraticCurveTo(-wid * 0.5, len * 0.32, 0, 0);
  const g = new THREE.ShapeGeometry(s, seg(5)); g.rotateX(Math.PI / 2);
  if (baseHex != null) {
    g.computeBoundingBox(); const z0 = g.boundingBox.min.z, span = (g.boundingBox.max.z - z0) || 1;
    const a = new THREE.Color(baseHex), b = new THREE.Color(tipHex), c = new THREE.Color(), col = [];
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const t = (pos.getZ(i) - z0) / span; c.copy(a).lerp(b, t * t); col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  }
  return new THREE.Mesh(g, mat);
}

// ===========================================================================
// TORSO STYLES — each returns { backY(z), halfW(z) } after lofting its body.
// ===========================================================================
function loftBody(stations, ctx) {
  const M = seg(16);
  const rings = stations.map(([z, rx, ry, yc]) => ellipseRing(rx, ry, yc, z, M));
  ctx.group.add(loftRings(rings, ctx.mats.bodyMat));
  const at = (arr, z, col) => {
    for (let i = 0; i < arr.length - 1; i++) { const a = arr[i], b = arr[i + 1]; if (z <= b[0]) { const t = (z - a[0]) / (b[0] - a[0] || 1); return lerp(col(a), col(b), t); } }
    return col(arr[arr.length - 1]);
  };
  return {
    backY: (z) => at(stations, z, (s) => s[3] + s[2]),
    halfW: (z) => at(stations, z, (s) => s[1]),
  };
}
const TORSO_STYLES = {
  // The shipped regal monarch: deep chest → pinched waist → muscular haunches.
  regal(ctx) {
    const P = ctx.P, zL = P.bodyLen;
    return loftBody([
      [-1.78 * zL, 0.10, 0.12, 0.56], [-1.34 * zL, 0.50, 0.56, 0.55],
      [-0.82 * zL, P.chestW, P.chestH, 0.52], [-0.18 * zL, P.thoraxW, 0.66, 0.50],
      [0.46 * zL, P.waistW, 0.50, 0.50], [1.06 * zL, P.haunchW, 0.58, 0.49],
      [1.54 * zL, 0.34, 0.34, 0.50], [1.86 * zL, 0.10, 0.12, 0.52],
    ], ctx);
  },
  // Longer, slimmer eastern-emperor body — a more elongated, graceful line.
  serpentine(ctx) {
    const P = ctx.P, zL = P.bodyLen * 1.22;
    return loftBody([
      [-1.9 * zL, 0.09, 0.11, 0.54], [-1.4 * zL, 0.42, 0.46, 0.53],
      [-0.8 * zL, P.chestW * 0.82, P.chestH * 0.84, 0.52], [-0.1 * zL, P.thoraxW * 0.86, 0.56, 0.51],
      [0.6 * zL, P.waistW * 0.92, 0.46, 0.5], [1.3 * zL, P.haunchW * 0.82, 0.48, 0.5],
      [1.9 * zL, 0.3, 0.3, 0.5], [2.3 * zL, 0.09, 0.1, 0.51],
    ], ctx);
  },
  // Broad, heavy, powerful — a stronger warlord build (still tapered, not a tank).
  stocky(ctx) {
    const P = ctx.P, zL = P.bodyLen * 0.9;
    return loftBody([
      [-1.6 * zL, 0.12, 0.14, 0.56], [-1.2 * zL, 0.58, 0.62, 0.54],
      [-0.7 * zL, P.chestW * 1.18, P.chestH * 1.1, 0.52], [-0.1 * zL, P.thoraxW * 1.16, 0.74, 0.5],
      [0.5 * zL, P.waistW * 1.3, 0.6, 0.5], [1.05 * zL, P.haunchW * 1.2, 0.68, 0.49],
      [1.5 * zL, 0.42, 0.42, 0.5], [1.84 * zL, 0.12, 0.14, 0.52],
    ], ctx);
  },
  // Slim athletic racer — a lean, fast silhouette.
  lean(ctx) {
    const P = ctx.P, zL = P.bodyLen * 1.08;
    return loftBody([
      [-1.74 * zL, 0.08, 0.10, 0.55], [-1.3 * zL, 0.42, 0.48, 0.54],
      [-0.8 * zL, P.chestW * 0.86, P.chestH * 0.9, 0.52], [-0.18 * zL, P.thoraxW * 0.82, 0.58, 0.5],
      [0.46 * zL, P.waistW * 0.82, 0.42, 0.5], [1.06 * zL, P.haunchW * 0.84, 0.5, 0.49],
      [1.54 * zL, 0.3, 0.3, 0.5], [1.86 * zL, 0.09, 0.1, 0.51],
    ], ctx);
  },
  // Imperial — an even broader, deeper chest & shoulders for maximum rear-read mass.
  imperial(ctx) {
    const P = ctx.P, zL = P.bodyLen;
    return loftBody([
      [-1.8 * zL, 0.11, 0.13, 0.57], [-1.34 * zL, 0.56, 0.62, 0.55],
      [-0.78 * zL, P.chestW * 1.12, P.chestH * 1.14, 0.53], [-0.14 * zL, P.thoraxW * 1.04, 0.72, 0.5],
      [0.5 * zL, P.waistW * 1.04, 0.52, 0.5], [1.08 * zL, P.haunchW * 1.1, 0.62, 0.49],
      [1.56 * zL, 0.36, 0.36, 0.5], [1.88 * zL, 0.1, 0.12, 0.52],
    ], ctx);
  },
};

// ===========================================================================
// WING STYLES — each builds both sides, adds to group, returns { L, R }.
// ===========================================================================
function wingFrame(ctx, side) {
  const P = ctx.P, ws = ctx.ws;
  const spanMax = (P.wingSpan + ctx.F * 0.4) * ws, rise = (P.wingRise + ctx.F * 0.5) * ws, wristX = spanMax * 0.46;
  const pivot = new THREE.Group(); pivot.position.set(side * P.wingRootX, P.wingRootY, P.wingRootZ);
  const wingTip = new THREE.Group(); wingTip.position.set(side * wristX, rise * 0.46, 0.06);
  const marker = new THREE.Object3D(); marker.position.set(side * (spanMax - wristX), rise - rise * 0.46, 0.34); wingTip.add(marker);
  return { pivot, wingTip, marker, spanMax, rise, wristX };
}
function eachWing(ctx, build) {
  const R = build(1), L = build(-1);
  return { L, R };
}
const WING_STYLES = {
  // The shipped cathedral mantle: pennant-scalloped membrane + mullion veins.
  cathedral(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { P, ws, mats } = ctx, { spanMax, rise, wristX } = f;
      f.pivot.add(tube(0, 0, 0, side * wristX, rise * 0.46, 0.08, 0.1, 0.05, mats.armorMat));
      f.pivot.add(tube(side * wristX, rise * 0.46, 0.08, side * spanMax, rise, 0.34, 0.05, 0.018, mats.armorMat));
      const fingers = [1.0, 0.74, 0.5, 0.28], chordAt = (q) => (P.wingChordRoot + P.wingChord * Math.pow(1 - q, 0.6)) * ws;
      const sh = new THREE.Shape(); sh.moveTo(0, -0.22 * ws);
      sh.bezierCurveTo(wristX * 0.5, -0.3 * ws, wristX, -0.2 * ws, spanMax, spanMax * P.wingSweep);
      let px = spanMax, py = spanMax * P.wingSweep + chordAt(1.0); sh.lineTo(px, py);
      for (let i = 1; i < fingers.length; i++) { const fx = spanMax * fingers[i], fy = fx * 0.05 + chordAt(fingers[i]); sh.quadraticCurveTo((px + fx) / 2, Math.min(py, fy) - P.wingPennant * ws, fx, fy); px = fx; py = fy; }
      sh.quadraticCurveTo(wristX * 0.4, py + 0.04 * ws, 0, 1.28 * ws); sh.lineTo(0, -0.22 * ws);
      const g = new THREE.ShapeGeometry(sh, seg(14)); g.rotateX(Math.PI / 2); archUp(g, spanMax, rise); spanGradient(g, ctx.colors.cInner, ctx.colors.cOuter, spanMax);
      const mem = new THREE.Mesh(g, mats.membraneMat); mem.scale.x = side; f.pivot.add(mem);
      for (let i = 0; i < fingers.length; i++) { const fx = spanMax * fingers[i], fyZ = -(fx * 0.06 + chordAt(fingers[i]) * 0.5), tipY = (fx / spanMax) ** 2 * rise; f.pivot.add(tube(side * wristX, rise * 0.46 + 0.02, 0.06, side * fx, tipY + 0.03, fyZ, 0.03, 0.008, mats.edgeMat)); }
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
  // Angelic feathered wings: rows of overlapping luminous feathers on an arced arm
  // (no membrane) — a seraphic, divine read.
  feathered(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { P, ws, mats, colors } = ctx, { spanMax, rise, wristX } = f;
      f.pivot.add(tube(0, 0, 0, side * wristX, rise * 0.46, 0.06, 0.09, 0.05, mats.armorMat));
      f.pivot.add(tube(side * wristX, rise * 0.46, 0.06, side * spanMax, rise, 0.2, 0.045, 0.014, mats.armorMat));
      const rows = 3, per = 5 + ctx.F;
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < per; i++) {
          const t = per > 1 ? i / (per - 1) : 0;                    // 0 root → 1 tip
          const x = side * (0.2 + t * 0.78) * spanMax;
          const y = (Math.abs(x) / spanMax) ** 2 * rise + r * 0.05;
          const len = (1.5 - t * 0.7 + r * 0.12) * ws * (P.wingChord * 0.9 + 0.3);
          const wid = (0.42 - t * 0.12) * ws;
          const fe = featherLeaf(len, wid, colors.cInner, colors.cOuter, mats.membraneMat);
          fe.position.set(x, y, -0.05 + r * 0.16 * ws);
          fe.rotation.set(-0.2 - r * 0.05, side * (0.5 + t * 0.5), side * 0.05);
          f.pivot.add(fe);
        }
      }
      // a couple of bright primary quills for the elite forms
      if (ctx.F >= 2) for (const q of [0.92, 0.78]) f.pivot.add(featherLeaf(2.0 * ws, 0.16 * ws, colors.cSeam, colors.cOuter, mats.edgeMat).translateX(side * q * spanMax).translateY((q ** 2) * rise));
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
  // Swan / angelic membrane: one broad SMOOTH rounded wing, soft scalloped hem, no
  // struts — the cleanest, most elegant silhouette.
  angelic(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { P, ws, mats, colors } = ctx, { spanMax, rise, wristX } = f;
      f.pivot.add(tube(0, 0, 0, side * spanMax, rise, 0.06, 0.08, 0.02, mats.armorMat));
      const sh = new THREE.Shape(); sh.moveTo(0, -0.2 * ws);
      sh.bezierCurveTo(spanMax * 0.45, -0.34 * ws, spanMax * 0.86, -0.1 * ws, spanMax, spanMax * 0.06);
      // smooth rounded trailing edge with three soft lobes
      const lobes = [[0.82, 0.7], [0.55, 1.05], [0.26, 1.2]];
      let px = spanMax, py = spanMax * 0.06 + 0.45 * ws; sh.lineTo(px, py);
      for (const [fx0, depth] of lobes) { const fx = spanMax * fx0, fy = fx * 0.05 + depth * ws * (0.7 + P.wingChord * 0.4); sh.quadraticCurveTo((px + fx) / 2, Math.min(py, fy) - 0.04 * ws, fx, fy); px = fx; py = fy; }
      sh.quadraticCurveTo(wristX * 0.3, py + 0.05 * ws, 0, 1.32 * ws); sh.lineTo(0, -0.2 * ws);
      const g = new THREE.ShapeGeometry(sh, seg(16)); g.rotateX(Math.PI / 2); archUp(g, spanMax, rise); spanGradient(g, colors.cInner, colors.cOuter, spanMax);
      const mem = new THREE.Mesh(g, mats.membraneMat); mem.scale.x = side; f.pivot.add(mem);
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
  // Classic dragon wing done elegantly: an armored leading frame + 4 visible finger
  // struts with a smooth membrane between, a clean scalloped trailing edge.
  dragon(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { P, ws, mats, colors } = ctx, { spanMax, rise, wristX } = f;
      f.pivot.add(tube(0, 0, 0, side * wristX, rise * 0.46, 0.06, 0.1, 0.05, mats.armorMat));
      f.pivot.add(tube(side * wristX, rise * 0.46, 0.06, side * spanMax, rise, 0.3, 0.06, 0.02, mats.armorMat));
      const fingers = [1.0, 0.72, 0.46, 0.22];
      // finger struts (bone) from the wrist out to each tip
      for (const q of fingers) { const fx = side * spanMax * q, ty = (q ** 2) * rise, tz = -(0.9 - q * 0.5) * ws; f.pivot.add(tube(side * wristX, rise * 0.46, 0.05, fx, ty, tz, 0.04, 0.01, mats.armorMat)); }
      const sh = new THREE.Shape(); sh.moveTo(0, -0.18 * ws);
      sh.bezierCurveTo(wristX * 0.5, -0.26 * ws, wristX, -0.14 * ws, spanMax, spanMax * 0.05);
      let px = spanMax, py = spanMax * 0.05 + (0.9 - 0.5) * ws; sh.lineTo(px, py);
      for (let i = 1; i < fingers.length; i++) { const fx = spanMax * fingers[i], fy = fx * 0.05 + (0.9 - fingers[i] * 0.5) * ws * (0.8 + P.wingChord * 0.4); sh.quadraticCurveTo((px + fx) / 2, Math.max(py, fy) + 0.16 * ws, fx, fy); px = fx; py = fy; }
      sh.quadraticCurveTo(wristX * 0.4, py + 0.05 * ws, 0, 1.12 * ws); sh.lineTo(0, -0.18 * ws);
      const g = new THREE.ShapeGeometry(sh, seg(14)); g.rotateX(Math.PI / 2); archUp(g, spanMax, rise); spanGradient(g, colors.cInner, colors.cOuter, spanMax);
      const mem = new THREE.Mesh(g, mats.membraneMat); mem.scale.x = side; f.pivot.add(mem);
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
  // Lance: narrow swept blade wings — sleek, fast, falcon-like (less broad, more sweep).
  lance(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { P, ws, mats, colors } = ctx, { spanMax, rise, wristX } = f;
      const sp = spanMax * 1.12;
      f.pivot.add(tube(0, 0, 0, side * sp, rise * 1.05, 0.5, 0.09, 0.015, mats.armorMat));
      const sh = new THREE.Shape(); sh.moveTo(0, -0.12 * ws);
      sh.lineTo(side >= 0 ? sp : sp, sp * 0.16);                    // (x is magnitude; mirror by scale.x)
      sh.quadraticCurveTo(sp * 0.5, sp * 0.16 + 0.5 * ws, 0, 0.78 * ws);
      sh.lineTo(0, -0.12 * ws);
      const g = new THREE.ShapeGeometry(sh, seg(10)); g.rotateX(Math.PI / 2); archUp(g, sp, rise * 1.05); spanGradient(g, colors.cInner, colors.cOuter, sp);
      const mem = new THREE.Mesh(g, mats.membraneMat); mem.scale.x = side; f.pivot.add(mem);
      f.pivot.add(tube(0, 0, 0, side * sp, rise * 1.05, 0.5, 0.02, 0.006, mats.edgeMat)); // bright leading edge
      f.marker.position.set(side * (sp - wristX), rise * 1.05 - rise * 0.46, sp * 0.16);
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
  // Prismatic: faceted star-metal crystal panels — angular, jewelled, severe-regal.
  prismatic(ctx) {
    return eachWing(ctx, (side) => {
      const f = wingFrame(ctx, side), { ws, mats, colors } = ctx, { spanMax, rise, wristX } = f;
      f.pivot.add(tube(0, 0, 0, side * spanMax, rise, 0.1, 0.08, 0.02, mats.armorMat));
      const facetMat = mats.crystalMat;
      const panels = [[0.0, 0.32], [0.3, 0.6], [0.58, 0.84], [0.82, 1.0]];
      for (const [a, b] of panels) {
        const ax = side * a * spanMax, bx = side * b * spanMax;
        const ay = (a ** 2) * rise, by = (b ** 2) * rise;
        const tri = new THREE.BufferGeometry();
        const depth = (0.9 - (a + b) * 0.35) * ws;
        tri.setAttribute('position', new THREE.Float32BufferAttribute([
          ax, ay, 0, bx, by, 0, (ax + bx) / 2, (ay + by) / 2 - 0.05, depth,
        ], 3));
        tri.computeVertexNormals();
        f.pivot.add(new THREE.Mesh(tri, facetMat));
        f.pivot.add(tube(ax, ay, 0, bx, by, 0, 0.02, 0.02, mats.edgeMat));   // glowing facet edge
      }
      f.pivot.add(f.wingTip); ctx.group.add(f.pivot); return f;
    });
  },
};

// ===========================================================================
// HEAD STYLES — each returns a `head` Group (placed at the neck end).
// ===========================================================================
function headBase(ctx) {
  const head = new THREE.Group(); head.position.set(0, 1.0, -2.62);
  const { mats } = ctx;
  const cran = new THREE.Mesh(new THREE.SphereGeometry(0.3, seg(12), seg(10)), mats.bodyMat); cran.scale.set(0.78, 0.82, 1.12); head.add(cran);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.2, 0.5, seg(8)), mats.bodyMat); snout.rotation.x = Math.PI / 2; snout.position.set(0, -0.04, -0.42); head.add(snout);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.34), mats.bodyMat); jaw.position.set(0, -0.13, -0.34); head.add(jaw);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, seg(8), seg(6)), mats.eyeMat); e.position.set(s * 0.16, 0.04, -0.22); head.add(e); }
  return head;
}
function horn(head, mat, x0, y0, z0, dx, dy, dz, r0, segsN, curl = 0.25) {
  const px = [x0], py = [y0], pz = [z0];
  for (let i = 1; i <= segsN; i++) { const t = i / segsN; px.push(x0 + dx * t); py.push(y0 + dy * t - dy * 0.18 * t * t); pz.push(z0 + dz * t + dz * curl * t * t); }
  for (let i = 0; i < segsN; i++) { const r = r0 * (1 - i / segsN * 0.82); head.add(tube(px[i], py[i], pz[i], px[i + 1], py[i + 1], pz[i + 1], r, r0 * (1 - (i + 1) / segsN * 0.82), mat)); }
  return [px[segsN], py[segsN], pz[segsN]];
}
const HEAD_STYLES = {
  // The shipped crowned wedge: a brow + a crown of main/secondary horns + a crest.
  crownedWedge(ctx) {
    const head = headBase(ctx), { P, F, mats } = ctx;
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.26), mats.bodyMat); brow.position.set(0, 0.14, -0.18); brow.rotation.x = -0.2; head.add(brow);
    for (const s of [-1, 1]) {
      horn(head, mats.crownMat, s * 0.16, 0.22, 0, s * (0.34 + F * 0.04) * P.hornMainSpread, (0.5 + F * 0.12) * P.hornMainLen, (0.66 + F * 0.06) * P.hornMainLen, (0.06 + F * 0.006) * P.hornThick, 4);
      horn(head, mats.crownMat, s * 0.24, 0.12, 0.04, s * (0.5 + F * 0.05) * P.hornMainSpread, (0.26 + F * 0.06) * P.hornSecondLen, 0.5 * P.hornSecondLen, 0.045 * P.hornThick, 3);
      if (F >= 1) horn(head, mats.crownMat, s * 0.2, -0.06, -0.06, s * 0.26, -0.04, 0.34, 0.03 * P.hornThick, 2);
    }
    const c = spineBlade((0.34 + F * 0.08) * P.crestHeight, 0.1, -0.16, mats.crownMat); c.position.set(0, 0.2, 0.06); head.add(c);
    return head;
  },
  // Draconic: a longer noble snout + two long clean back-swept horns (no clutter).
  draconic(ctx) {
    const head = headBase(ctx), { P, F, mats } = ctx;
    const snout2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.4, seg(8)), mats.bodyMat); snout2.rotation.x = Math.PI / 2; snout2.position.set(0, -0.06, -0.72); head.add(snout2);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.3), mats.bodyMat); brow.position.set(0, 0.13, -0.2); brow.rotation.x = -0.18; head.add(brow);
    for (const s of [-1, 1]) horn(head, mats.crownMat, s * 0.18, 0.18, 0.02, s * (0.3 + F * 0.04) * P.hornMainSpread, (0.62 + F * 0.16) * P.hornMainLen, (0.8 + F * 0.08) * P.hornMainLen, (0.06 + F * 0.006) * P.hornThick, 4, 0.35);
    return head;
  },
  // Regal mask: a smooth faceted faceplate + a coronet ring of small upright points.
  regalMask(ctx) {
    const head = headBase(ctx), { P, F, mats } = ctx;
    const mask = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 1), mats.armorMat); mask.scale.set(0.7, 0.8, 1.15); mask.position.set(0, 0.02, -0.28); head.add(mask);
    const coronet = 5 + F;
    for (let i = 0; i < coronet; i++) { const a = (i / (coronet - 1) - 0.5) * Math.PI * 1.1; const pt = spineBlade((0.18 + F * 0.03) * P.crestHeight, 0.06, -0.04, mats.crownMat); pt.position.set(Math.sin(a) * 0.28, 0.16 + Math.cos(a) * 0.06, 0.02 - Math.abs(Math.sin(a)) * 0.1); pt.rotation.z = -Math.sin(a) * 0.5; head.add(pt); }
    for (const s of [-1, 1]) horn(head, mats.crownMat, s * 0.22, 0.1, 0.05, s * 0.4 * P.hornMainSpread, 0.16 * P.hornMainLen, 0.5 * P.hornMainLen, 0.04 * P.hornThick, 3, 0.3);
    return head;
  },
  // Antlered: each horn branches into tines — an ornate ceremonial crown.
  antlered(ctx) {
    const head = headBase(ctx), { P, F, mats } = ctx;
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.26), mats.bodyMat); brow.position.set(0, 0.13, -0.18); brow.rotation.x = -0.2; head.add(brow);
    for (const s of [-1, 1]) {
      const tip = horn(head, mats.crownMat, s * 0.16, 0.2, 0.0, s * 0.3 * P.hornMainSpread, (0.4 + F * 0.1) * P.hornMainLen, 0.5 * P.hornMainLen, (0.055 + F * 0.005) * P.hornThick, 3, 0.3);
      // two tines branching off the main beam
      horn(head, mats.crownMat, tip[0], tip[1], tip[2], s * 0.22 * P.hornMainSpread, (0.26 + F * 0.06) * P.hornMainLen, 0.18, 0.035 * P.hornThick, 2, 0.4);
      horn(head, mats.crownMat, tip[0], tip[1], tip[2], s * 0.08, (0.32 + F * 0.06) * P.hornMainLen, 0.34, 0.03 * P.hornThick, 2, 0.4);
    }
    return head;
  },
  // Horned: a single strong pair of curved horns — minimal, noble, powerful.
  horned(ctx) {
    const head = headBase(ctx), { P, F, mats } = ctx;
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.28), mats.bodyMat); brow.position.set(0, 0.14, -0.16); brow.rotation.x = -0.22; head.add(brow);
    for (const s of [-1, 1]) horn(head, mats.crownMat, s * 0.2, 0.16, 0.02, s * (0.46 + F * 0.05) * P.hornMainSpread, (0.4 + F * 0.1) * P.hornMainLen, (0.5 + F * 0.05) * P.hornMainLen, (0.075 + F * 0.006) * P.hornThick, 4, 0.5);
    return head;
  },
};

// ===========================================================================
// TAIL STYLES — a shared coiling chain + a distinct TIP ornament per style.
// ===========================================================================
function tailChain(ctx) {
  const { P, F, mats } = ctx;
  const tailSegs = [], tailN = Math.round(P.tailSegs) + F;
  const tailRoot = new THREE.Group(); tailRoot.position.set(0, 0.5, 1.85); ctx.group.add(tailRoot);
  let parent = tailRoot, r = P.tailRootR;
  for (let i = 0; i < tailN; i++) {
    const segGrp = new THREE.Group(); segGrp.position.set(0, 0, i === 0 ? 0 : P.tailStep); parent.add(segGrp);
    const r1 = r * (1 - P.tailTaper);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r, P.tailStep + 0.02, seg(8)), mats.bodyMat); m.rotation.x = Math.PI / 2; m.position.z = P.tailStep * 0.5; segGrp.add(m);
    const sb = spineBlade((0.16 + (tailN - i) * 0.012 + F * 0.02) * P.spineHeight, 0.07, -0.06, mats.crownMat); sb.position.set(0, r1 + 0.02, P.tailStep * 0.5); segGrp.add(sb);
    tailSegs.push(segGrp); parent = segGrp; r = r1;
  }
  return { tailSegs, tip: tailSegs[tailSegs.length - 1] };
}
const TAIL_STYLES = {
  // The shipped crown-spade / star-blade.
  crownSpade(ctx) {
    const { tailSegs, tip } = tailChain(ctx), { P, F, mats } = ctx;
    const s = new THREE.Shape(), L = (1.0 + F * 0.16) * P.spadeSize, W = (0.42 + F * 0.04) * P.spadeSize;
    s.moveTo(0, 0); s.quadraticCurveTo(W, L * 0.34, W * 0.5, L * 0.66); s.lineTo(W * 0.74, L * 0.82); s.quadraticCurveTo(W * 0.18, L * 0.9, 0, L);
    s.quadraticCurveTo(-W * 0.18, L * 0.9, -W * 0.74, L * 0.82); s.lineTo(-W * 0.5, L * 0.66); s.quadraticCurveTo(-W, L * 0.34, 0, 0);
    const g = new THREE.ShapeGeometry(s, seg(8)); g.rotateX(-Math.PI / 2);
    const spade = new THREE.Mesh(g, mats.crownMat); spade.position.set(0, 0.02, P.tailStep); tip.add(spade);
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + L * 0.92, 0.03, 0.008, mats.edgeMat));
    return tailSegs;
  },
  // Royal trident: a central prong + two flared side blades.
  trident(ctx) {
    const { tailSegs, tip } = tailChain(ctx), { P, F, mats } = ctx;
    const L = (1.0 + F * 0.16) * P.spadeSize;
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + L, 0.05, 0.012, mats.crownMat));
    for (const s of [-1, 1]) { tip.add(tube(0, 0.03, P.tailStep + L * 0.3, s * L * 0.42, 0.03, P.tailStep + L * 0.92, 0.04, 0.01, mats.crownMat)); }
    for (const x of [0, -1, 1]) tip.add(tube(x === 0 ? 0 : x * L * 0.42, 0.03, P.tailStep + L * (x === 0 ? 1 : 0.92), x * L * 0.42, 0.05, P.tailStep + L * (x === 0 ? 1.05 : 0.97), 0.012, 0.004, mats.edgeMat));
    return tailSegs;
  },
  // Layered fan: a peacock-like spread of blades — a regal display tail.
  fan(ctx) {
    const { tailSegs, tip } = tailChain(ctx), { P, F, mats, colors } = ctx;
    const n = 5 + F, L = (0.9 + F * 0.12) * P.spadeSize;
    for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 1.5; const fe = featherLeaf(L * (1 - Math.abs(a) * 0.3), 0.22 * P.spadeSize, colors.cInner, colors.cOuter, mats.membraneMat); fe.position.set(0, 0.03, P.tailStep); fe.rotation.set(-0.1, a, 0); tip.add(fe); }
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + L, 0.035, 0.01, mats.crownMat));
    return tailSegs;
  },
  // A single long star-blade.
  blade(ctx) {
    const { tailSegs, tip } = tailChain(ctx), { P, F, mats } = ctx;
    const s = new THREE.Shape(), L = (1.5 + F * 0.2) * P.spadeSize, W = (0.26 + F * 0.03) * P.spadeSize;
    s.moveTo(0, 0); s.lineTo(W, L * 0.4); s.lineTo(0, L); s.lineTo(-W, L * 0.4); s.closePath();
    const g = new THREE.ShapeGeometry(s, seg(6)); g.rotateX(-Math.PI / 2);
    const blade = new THREE.Mesh(g, mats.crownMat); blade.position.set(0, 0.02, P.tailStep); tip.add(blade);
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + L, 0.025, 0.006, mats.edgeMat));
    return tailSegs;
  },
  // Ringed sceptre: tapering discs + a small spade — a ceremonial staff read.
  ringed(ctx) {
    const { tailSegs, tip } = tailChain(ctx), { P, F, mats } = ctx;
    const L = (0.8 + F * 0.12) * P.spadeSize;
    for (let i = 0; i < 3; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry((0.13 - i * 0.03) * P.spadeSize, 0.03, seg(6), seg(12)), mats.crownMat); ring.position.set(0, 0.03, P.tailStep + 0.1 + i * 0.18 * P.spadeSize); tip.add(ring); }
    const s = new THREE.Shape(), w = 0.22 * P.spadeSize; s.moveTo(0, 0); s.quadraticCurveTo(w, L * 0.5, 0, L); s.quadraticCurveTo(-w, L * 0.5, 0, 0);
    const g = new THREE.ShapeGeometry(s, seg(6)); g.rotateX(-Math.PI / 2); const spade = new THREE.Mesh(g, mats.crownMat); spade.position.set(0, 0.02, P.tailStep + 0.5 * P.spadeSize); tip.add(spade);
    tip.add(tube(0, 0.03, P.tailStep, 0, 0.03, P.tailStep + 0.5 * P.spadeSize + L, 0.022, 0.006, mats.edgeMat));
    return tailSegs;
  },
};

export const CROWN_STYLE_LISTS = {
  torso: [
    { k: 'regal', label: 'Regal monarch' }, { k: 'serpentine', label: 'Serpentine' },
    { k: 'stocky', label: 'Stocky warlord' }, { k: 'lean', label: 'Lean racer' }, { k: 'imperial', label: 'Imperial broad' },
  ],
  wings: [
    { k: 'cathedral', label: 'Cathedral mantle' }, { k: 'feathered', label: 'Feathered / seraphic' },
    { k: 'angelic', label: 'Angelic (smooth)' }, { k: 'dragon', label: 'Dragon (finger struts)' },
    { k: 'lance', label: 'Lance (swept blade)' }, { k: 'prismatic', label: 'Prismatic crystal' },
  ],
  head: [
    { k: 'crownedWedge', label: 'Crowned wedge' }, { k: 'draconic', label: 'Draconic (long snout)' },
    { k: 'regalMask', label: 'Regal mask + coronet' }, { k: 'antlered', label: 'Antlered crown' }, { k: 'horned', label: 'Twin horns (noble)' },
  ],
  tail: [
    { k: 'crownSpade', label: 'Crown-spade' }, { k: 'trident', label: 'Royal trident' },
    { k: 'fan', label: 'Peacock fan' }, { k: 'blade', label: 'Star-blade' }, { k: 'ringed', label: 'Ringed sceptre' },
  ],
};

// ===========================================================================
export function buildAstralCrownModel(def, opts = {}) {
  const model = def.model || {};
  const P = { ...CROWN_PARAMS, ...(model.crownParams || {}), ...(opts.params || {}) };
  const styles = { ...CROWN_DEFAULT_STYLES, ...(model.crownStyles || {}), ...(opts.styles || {}) };
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body ?? 0xEFEDE2, cArmor = def.scales ?? 0xB8C2D2, cInner = def.wingInner ?? 0x2a356e,
    cOuter = def.wingOuter ?? 0xC9D6F2, cHorn = def.horn ?? 0xEAE7DA, cEnergy = def.coreGlow ?? 0xBFE6FF,
    cSeam = def.apexSeam ?? def.wingEmissive ?? 0xFFF1C8, cEye = def.eye ?? 0xCFE9FF;

  const tag = (mat, em, inten) => { mat.userData.baseEmissive = em; mat.userData.baseIntensity = inten; spineMats.push(mat); return mat; };
  const mats = {
    bodyMat: new THREE.MeshStandardMaterial({ color: cBody, roughness: P.bodyRough, metalness: P.bodyMetal, emissive: cBody, emissiveIntensity: 0.05 + F * 0.03, side: THREE.DoubleSide }),
    armorMat: new THREE.MeshStandardMaterial({ color: cArmor, roughness: 0.28, metalness: P.armorMetal, emissive: cInner, emissiveIntensity: 0.06, side: THREE.DoubleSide }),
    crystalMat: new THREE.MeshStandardMaterial({ color: cArmor, roughness: 0.18, metalness: 0.5, emissive: cInner, emissiveIntensity: 0.18, flatShading: true, side: THREE.DoubleSide }),
    eyeMat: new THREE.MeshStandardMaterial({ color: 0x101522, emissive: cEye, emissiveIntensity: 2.1 }),
    membraneMat: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide, transparent: true, opacity: Math.min(1, P.membraneOpacity + F * 0.04), emissive: cInner, emissiveIntensity: 0.14 + F * 0.1 }),
    crownMat: tag(new THREE.MeshStandardMaterial({ color: cHorn, emissive: cSeam, emissiveIntensity: (0.45 + F * 0.45) * P.crownGlow, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide }), cSeam, (0.45 + F * 0.45) * P.crownGlow),
    edgeMat: tag(new THREE.MeshStandardMaterial({ color: cEnergy, emissive: cEnergy, emissiveIntensity: (0.8 + F * 0.6) * P.edgeGlow, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }), cEnergy, (0.8 + F * 0.6) * P.edgeGlow),
    coreMat: tag(new THREE.MeshStandardMaterial({ color: cEnergy, emissive: cEnergy, emissiveIntensity: (1.3 + F * 0.9) * P.coreGlowI, roughness: 0.3 }), cEnergy, (1.3 + F * 0.9) * P.coreGlowI),
  };

  const ctx = { P, F, ws: model.wingScale ?? 1, group, spineMats, mats, colors: { cBody, cArmor, cInner, cOuter, cHorn, cEnergy, cSeam, cEye } };

  // 1) TORSO (publishes the attach surface backY/halfW)
  const attach = (TORSO_STYLES[styles.torso] || TORSO_STYLES.regal)(ctx);

  // 2) shared armor mantle + sternum + haunch plates
  for (const s of [-1, 1]) {
    const sh = plate((0.98 + F * 0.08) * P.shoulderSize, (0.78 + F * 0.06) * P.shoulderSize, P.shoulderCup, mats.armorMat);
    sh.position.set(s * (0.6 + F * 0.03) * P.shoulderSpread, 0.74, -0.72); sh.rotation.set(0.42, s * 0.62, s * -0.34); sh.scale.setScalar(1 + F * 0.07); group.add(sh);
    if (F >= 1) group.add(tube(s * 0.34, 0.92, -0.92, s * (0.62 + F * 0.04) * P.shoulderSpread, 1.0 + F * 0.05, -0.95, 0.05, 0.015, mats.crownMat));
    const hp = plate(0.5, 0.5, 0.2, mats.armorMat); hp.position.set(s * 0.5, 0.6, 1.02); hp.rotation.set(0.2, s * -0.5, s * 0.2); group.add(hp);
  }
  const sternum = plate(0.46, 0.66, 0.22, mats.armorMat); sternum.position.set(0, 0.34, -0.9); sternum.rotation.x = 1.5; group.add(sternum);

  // 3) celestial core
  const core = new THREE.Mesh(new THREE.OctahedronGeometry((0.17 + F * 0.03) * P.coreSize, 0), mats.coreMat); core.scale.set(0.8, 1.15, 0.8); core.position.set(0, 0.4, -0.86); group.add(core);
  const lvl = 0.4 + F * 0.2;
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0.18 + lvl * 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  coreGlow.scale.setScalar((0.8 + lvl * 0.7) * P.coreSize); coreGlow.position.set(0, 0.4, -0.86); coreGlow.layers.set(1); coreGlow.userData.base = coreGlow.material.opacity; group.add(coreGlow);

  // 4) dorsal spine line (rides the chosen torso's back)
  const spineN = Math.round(P.spineCount) + F * 2;
  for (let i = 0; i < spineN; i++) {
    const t = i / (spineN - 1), z = lerp(-1.05, 1.5, t);
    const peak = Math.exp(-Math.pow((t - P.spinePeak) / 0.5, 2));
    const h = (0.22 + (0.5 + F * 0.12) * peak) * (1 - t * 0.35) * P.spineHeight;
    const blade = spineBlade(h, 0.13 + F * 0.01, -h * 0.5, mats.crownMat); blade.position.set(0, attach.backY(z) - 0.02, z); group.add(blade);
    if (F >= 2) group.add(tube(0, attach.backY(z) - 0.02, z - 0.02, 0, attach.backY(z) + h - 0.02, z - h * 0.5, 0.02, 0.006, mats.edgeMat));
  }

  // 5) proud neck (short, not snake-like)
  for (let i = 0; i < 3; i++) { const pt = [[0, 0.66, -1.5], [0, 0.82, -2.0], [0, 0.95, -2.45]][i]; const n = new THREE.Mesh(new THREE.SphereGeometry(0.34 - i * 0.05, seg(11), seg(9)), mats.bodyMat); n.scale.set(0.86, 0.9, 1.05); n.position.set(pt[0], pt[1], pt[2]); group.add(n); }

  // 6) HEAD
  const head = (HEAD_STYLES[styles.head] || HEAD_STYLES.crownedWedge)(ctx); group.add(head);

  // 7) WINGS
  const wings = (WING_STYLES[styles.wings] || WING_STYLES.cathedral)(ctx);

  // 8) legs (four, tucked)
  function leg(x, y, z, back, len) {
    const g = new THREE.Group();
    const t1 = [x * 0.7, y - len * 0.4, z + back * 0.5], t2 = [x * 0.5, y - len * 0.85, z + back];
    g.add(tube(x, y, z, t1[0], t1[1], t1[2], 0.13, 0.08, mats.bodyMat)); g.add(tube(t1[0], t1[1], t1[2], t2[0], t2[1], t2[2], 0.08, 0.045, mats.bodyMat));
    for (let c = -1; c <= 1; c++) g.add(tube(t2[0], t2[1], t2[2], t2[0] + c * 0.06, t2[1] - 0.08, t2[2] + 0.14, 0.025, 0.008, mats.bodyMat));
    return g;
  }
  for (const s of [-1, 1]) { group.add(leg(s * 0.34, 0.3, -0.5, 0.5, 0.7)); group.add(leg(s * 0.4, 0.28, 0.95, 0.6, 0.8)); }

  // 9) TAIL
  const tailSegs = (TAIL_STYLES[styles.tail] || TAIL_STYLES.crownSpade)(ctx);

  // 10) apex halo + idle aura
  if (F >= 3) { const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(hexRgb(cSeam)), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(5.4, 6.4, 1); halo.position.set(0, 0.95, -0.4); halo.layers.set(1); group.add(halo); }
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  auraSprite.scale.set(9, 9, 1); auraSprite.layers.set(1); group.add(auraSprite);

  group.scale.setScalar(model.scale ?? 1);

  return {
    group,
    parts: {
      head, tailSegs,
      wingPivotL: wings.L.pivot, wingPivotR: wings.R.pivot,
      wingTipL: wings.L.wingTip, wingTipR: wings.R.wingTip,
      tipMarkerL: wings.L.marker, tipMarkerR: wings.R.marker,
      wingPivot2L: null, wingPivot2R: null,
      coreGlow,
    },
    materials: { bodyMat: mats.bodyMat, wingMat: mats.membraneMat, eyeMat: mats.eyeMat, spineMats },
    auraSprite,
  };
}
