import * as THREE from 'three';

// Dragon body components — the from-the-ground-up geometry for the redesigned
// anatomy. dragonModel.js assembles these into the full rig; keeping the heavy
// geometry here keeps that file focused on materials, decoration flags and the
// animation hookpoints the rig/preview depend on.
//
//   buildArrowTorso()   sleek arrowhead torso (keel + strong shoulders + narrow
//                        hips), replacing the round lathe.
//   wing system         WING_FORMS / buildWingShape / archWing — per-form wing
//                        SHAPE + a vertical arc PROFILE that bakes a dragon-wing
//                        elbow (wrist peak) so each tier reads differently from
//                        the direct-rear gameplay camera.
//   buildCleanTail()    one continuous tapered tail (no detached shards), dark
//                        with gold accents so it never reads as a hazard.

// ===========================================================================
// BODY — aerodynamic arrowhead
// ===========================================================================
// Lofted from a blade cross-section: a pointed dorsal keel on top, flatter
// sides (less round/lumpy mass), a tapered belly. Strong shoulders → narrow
// waist → narrow hips → slim tail root that the tail continues cleanly from.
export function buildArrowTorso() {
  // station: [z, halfWidth, keelTop, belly]  (z: head at -, tail at +)
  const stations = [
    [-3.05, 0.15, 0.10, 0.13], // neck cap (meets the neck chain)
    [-2.45, 0.30, 0.22, 0.24], // neck base
    [-1.65, 0.52, 0.42, 0.38], // fore-shoulder
    [-0.85, 0.66, 0.54, 0.46], // shoulder peak — broadest, tallest keel
    [-0.10, 0.55, 0.45, 0.40], // thorax
    [ 0.60, 0.39, 0.33, 0.29], // waist (clear pinch)
    [ 1.15, 0.29, 0.25, 0.20], // narrow hips
    [ 1.70, 0.17, 0.17, 0.11], // slim tail root
  ];
  const M = 8;
  // Unit cross-section: keel apex on top (0,top), widest at mid-height, rounded
  // belly. Ordered CCW looking toward -z so face winding points outward.
  const ring = (w, top, bot) => [
    [0, top], [-w * 0.70, top * 0.30], [-w, -bot * 0.10], [-w * 0.62, -bot * 0.64],
    [0, -bot], [w * 0.62, -bot * 0.64], [w, -bot * 0.10], [w * 0.70, top * 0.30],
  ];
  const verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of ring(w, top, bot)) verts.push(x, y, z);
  const idx = [];
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Top-of-keel height at a given body z — lets the caller run a glowing spine
// ridge precisely along the crest of the arrowhead back.
export function keelTopAt(z) {
  const pts = [[-2.45, 0.22], [-0.85, 0.54], [-0.10, 0.45], [0.60, 0.33], [1.15, 0.25], [1.70, 0.17]];
  if (z <= pts[0][0]) return pts[0][1];
  if (z >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (z <= pts[i + 1][0]) {
      const t = (z - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}

// ===========================================================================
// WINGS — shape per form + a baked vertical "elbow" arc profile
// ===========================================================================
// The dominant rear-view lever is the wing's VERTICAL profile. A flat wing is
// edge-on and reads as a strip; bowing it presents a real outline. Better still,
// an outer-weighted bow with a WRIST HUMP gives the classic dragon-wing elbow
// (wrist up, fingers/tip flaring), so each tier's profile is unmistakable:
//
//   arc = { bow, hump, humpAt, hook }  (all measured against the span, ∝ ws)
//     bow     gentle overall rise toward the tip
//     hump    a raised wrist/elbow at humpAt (fraction of span) — the dragon read
//     hook    a sharp up-flare at the very tip (nx^4) — the wingtip personality
//
//   tips    finger-tip anchors [x span, y chord], far tip first (horizontal cut)
//   scallop trailing-web depth · flame: V-notch the OUTER webs only (apex)
export const WING_FORMS = {
  // T0 — baby whelp: short, narrow, almost-straight glider. No elbow.
  0: { tips: [[3.95, 0.26], [3.05, -0.36], [1.95, -0.66]],
       lead: [2.55, 0.44], scallop: 0.16, flame: false,
       arc: { bow: 0.5, hump: 0.0, humpAt: 0.6, hook: 0.12 } },
  // T1 — kindled: a 4th finger, gentle scallop, a small wrist elbow appears.
  1: { tips: [[4.95, 0.32], [3.95, -0.44], [2.65, -0.90], [1.45, -0.96]],
       lead: [3.35, 0.56], scallop: 0.34, flame: false,
       arc: { bow: 0.5, hump: 0.7, humpAt: 0.55, hook: 0.22 } },
  // T2 — radiant: wider, swept, a strong elbow and a hooked-up outer tip.
  2: { tips: [[5.35, 0.42], [4.50, -0.52], [3.10, -1.06], [1.70, -1.18]],
       lead: [3.75, 0.66], scallop: 0.56, flame: false,
       arc: { bow: 0.5, hump: 1.2, humpAt: 0.58, hook: 0.7 } },
  // T3 — eternal: widest framing wings, pronounced elbow + dramatic flared tip,
  // flame V-notches on the outer third only.
  3: { tips: [[5.70, 0.52], [4.85, -0.46], [3.55, -1.02], [2.15, -1.22], [1.05, -1.04]],
       lead: [4.05, 0.74], scallop: 0.50, flame: true,
       arc: { bow: 0.6, hump: 1.7, humpAt: 0.60, hook: 1.2 } },
};
// Legacy membrane for dragons not yet on the per-form system — flat, no elbow.
export const DEFAULT_WING = {
  tips: [[5.25, 0.34], [4.40, -0.50], [3.05, -1.00], [1.70, -1.12]],
  lead: [3.80, 0.64], scallop: 0.50, flame: false,
  arc: { bow: 0, hump: 0, humpAt: 0.6, hook: 0 },
};

export function wingSpecFor(model) {
  const f = model.wingForm;
  return (f != null && WING_FORMS[f]) ? WING_FORMS[f] : DEFAULT_WING;
}

export function buildWingShape(spec) {
  const tips = spec.tips;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  // Leading edge: a clean sweep from the wrist out to the far wing tip.
  s.bezierCurveTo(1.8, 0.62, spec.lead[0], spec.lead[1], tips[0][0], tips[0][1]);
  // Trailing edge: scalloped webs between finger tips. Flame forms V-notch only
  // the OUTER webs (edge drama, disciplined centre).
  for (let i = 0; i < tips.length - 1; i++) {
    const [ax, ay] = tips[i];
    const [bx, by] = tips[i + 1];
    const cx = (ax + bx) / 2;
    if (spec.flame && i < 2) {
      s.lineTo(cx, (ay + by) / 2 + spec.scallop * 1.5);
      s.lineTo(bx, by);
    } else {
      s.quadraticCurveTo(cx, (ay + by) / 2 + spec.scallop, bx, by);
    }
  }
  s.quadraticCurveTo(0.85, -0.34, 0, -0.28);
  return s;
}

// Vertical lift at a normalised span position nx∈[0,1], in wing-local units.
export function archProfile(nx, a) {
  const hump = a.hump * Math.exp(-Math.pow((nx - a.humpAt) / 0.26, 2));
  return a.bow * nx + hump + a.hook * Math.pow(nx, 4);
}
export function archLift(x, maxX, a, k = 1) {
  const nx = maxX > 0 ? Math.min(Math.abs(x) / maxX, 1) : 0;
  return archProfile(nx, a) * k;
}
// Bow a flattened membrane geometry along its arc profile (k scales by ws).
export function archWing(geo, a, k = 1) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const maxX = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x)) || 1;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) + archLift(pos.getX(i), maxX, a, k));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// A tapered bone strut from the wrist to a finger tip; endY lifts the tip so the
// bone follows the membrane's arc instead of poking through flat.
export function wingStrut(x, z, r0, r1, mat, endY = 0) {
  const dir = new THREE.Vector3(x, endY, z);
  const len = dir.length() || 0.001;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 5), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.position.set(x / 2, 0.015 + endY / 2, z / 2);
  return m;
}

export function buildFeatherWingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.5, 2.2, 1.0, 3.0, 0.7);
  s.lineTo(4.8, 0.2);
  s.lineTo(4.6, -0.25); s.lineTo(4.2, -0.05);
  s.lineTo(3.8, -0.55); s.lineTo(3.3, -0.2);
  s.lineTo(2.8, -0.8);  s.lineTo(2.2, -0.4);
  s.lineTo(1.6, -1.05); s.lineTo(1.2, -0.75);
  s.bezierCurveTo(0.8, -0.6, 0.4, -0.45, 0, -0.4);
  return s;
}

const innerC = new THREE.Color();
const outerC = new THREE.Color();
export function applyWingGradient(geo, palette, tStart = 0, tEnd = 1) {
  innerC.setHex(palette.wingInner);
  outerC.setHex(palette.wingOuter);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const spanX = Math.max(bb.max.x - bb.min.x, 1e-5);
  for (let i = 0; i < pos.count; i++) {
    const kx = Math.abs(pos.getX(i) - (Math.abs(bb.min.x) > Math.abs(bb.max.x) ? bb.max.x : bb.min.x)) / spanX;
    const t = tStart + (tEnd - tStart) * kx;
    c.lerpColors(innerC, outerC, Math.min(t, 1));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// ===========================================================================
// TAIL — one continuous tapered piece (no detached shards)
// ===========================================================================
// A flat swallowtail outline for the comet tail tip.
export function buildForkShape(spread, length, notch) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.16, 0.10);
  s.lineTo(spread, length);   // right tine tip
  s.lineTo(0, notch);         // inner V between the tines
  s.lineTo(-spread, length);  // left tine tip
  s.lineTo(-0.16, 0.10);
  s.closePath();
  return s;
}

// A single elongated diamond blade outline (flat), for the T2 blade tail.
function buildBladeShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(halfW, length * 0.42);
  s.lineTo(0, length);
  s.lineTo(-halfW, length * 0.42);
  s.closePath();
  return s;
}

// Build the whole tail as ONE swaying unit: a continuous tapered shaft of
// heavily-overlapping frustums (reads as a smooth tube, never separates) with a
// gold dorsal ridge and an elegant connected tip. Returns { group, segs } where
// segs is the single entry the rig sways.
export function buildCleanTail(def, model, bodyMat) {
  const root = new THREE.Group();
  const style = model.tailStyle || 'simple';
  const g = model.spineGlow || 0;
  const lenScale = Math.min(model.tailSegments || 6, 9) / 6;
  const len = 3.0 * lenScale;
  const baseR = 0.24, tipR = 0.045;
  const N = 6;

  const accentCol = def.apexSeam || def.scales;
  const edgeMat = new THREE.MeshStandardMaterial({
    color: accentCol, emissive: accentCol, emissiveIntensity: 0.45 + g * 1.3,
    roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide,
  });
  // Dark membrane for blade/comet tips — obsidian body tone with a faint inner
  // ember, never the bright hazard-orange the old shards used.
  const membraneMat = new THREE.MeshStandardMaterial({
    color: def.body, emissive: def.wingOuter || def.body, emissiveIntensity: 0.22,
    roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide,
  });

  // Continuous tapered shaft.
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const r0 = baseR + (tipR - baseR) * t0;
    const r1 = baseR + (tipR - baseR) * t1;
    const z0 = t0 * len, z1 = t1 * len;
    const segLen = (z1 - z0) * 1.7; // overlap → reads as one smooth tube
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, 8), bodyMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, 0.1, (z0 + z1) / 2);
    root.add(seg);
  }

  // Gold dorsal ridge running the shaft — continues the spine onto the tail.
  const ridgeN = 7;
  for (let i = 0; i < ridgeN; i++) {
    const t = i / (ridgeN - 1);
    const r = baseR + (tipR - baseR) * t;
    const h = (0.11 + g * 0.12) * (1 - t * 0.45);
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.028, h, 4), edgeMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, 0.1 + r * 0.75 + h / 2 - 0.03, t * len * 0.94);
    root.add(ridge);
  }

  const tipZ = len - 0.05;
  if (style === 'comet') {
    // Forked comet: dark membrane swallowtail with gold edge lines on the tines.
    const forkGeo = new THREE.ShapeGeometry(buildForkShape(0.5, 1.7, 0.95));
    forkGeo.rotateX(Math.PI / 2);
    const fork = new THREE.Mesh(forkGeo, membraneMat);
    fork.position.set(0, 0.1, tipZ);
    root.add(fork);
    for (const sx of [-1, 1]) {
      const a = new THREE.Vector3(sx * 0.06, 0.1, tipZ);
      const b = new THREE.Vector3(sx * 0.5, 0.1, tipZ + 1.7);
      const dir = b.clone().sub(a);
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.05, dir.length(), 4), edgeMat);
      edge.position.copy(a).add(b).multiplyScalar(0.5);
      edge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      root.add(edge);
    }
  } else if (style === 'blade') {
    // Single elegant blade: dark membrane with a gold leading edge.
    const bladeGeo = new THREE.ShapeGeometry(buildBladeShape(0.34, 1.5));
    bladeGeo.rotateX(Math.PI / 2);
    const blade = new THREE.Mesh(bladeGeo, membraneMat);
    blade.position.set(0, 0.1, tipZ);
    root.add(blade);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.05, 1.5, 4), edgeMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(0, 0.1, tipZ + 0.75);
    root.add(edge);
  } else if (style === 'finned') {
    // A small upright dorsal fin just ahead of a clean tapered point.
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 4), edgeMat);
    fin.scale.set(1, 1, 0.5);
    fin.position.set(0, 0.32, tipZ - 0.45);
    root.add(fin);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.02, 0.55, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0.1, tipZ + 0.2);
    root.add(point);
  } else {
    // simple: a clean tapered point.
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.02, 0.5, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0.1, tipZ + 0.2);
    root.add(point);
  }

  return { group: root, segs: [root] };
}
