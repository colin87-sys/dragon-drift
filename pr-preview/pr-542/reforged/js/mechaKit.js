import * as THREE from 'three';
import { seg } from './modelDetail.js';

// MECHA KIT — a reusable HARD-SURFACE primitive library: the vocabulary a
// "mecha / vehicle / aircraft" creature is composed from (the angular counterpart
// to the smooth hull generators). Authored first for the SVJ mecha-dragon "Aurum
// Toro", but every export here is GENERIC and PURE: it returns Three.js meshes /
// Groups and creates NO palette-coupled materials — the caller injects materials,
// so the same module reads as gold dragon-armor, a car panel, or a jet wing
// depending on what you feed it. Geometry lives here; palette + Surge-flare tagging
// stay in the registered builders. (LEAPFROG: build systems, not one-offs — the
// registry/attach/tailFins contracts are the assembly graph; this is its parts bin.)
//
// CONVENTIONS
//  • every segment count is wrapped in seg() so the LOD tier scales it (HIGH = exact).
//  • handed parts take a `side` (±1); the composer calls them twice (mirror).
//  • "sockets" are named empty Object3Ds returned in a `sockets` map AND added as
//    children, so a composer can parent a child to a socket and inherit its transform
//    — the literal "named sockets" of an assembly graph.
//  • flat shading throughout (per-face normals) for the chiseled panel read.

// A named empty mount point.
export function socket(x = 0, y = 0, z = 0) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  return o;
}

// Explicit-triangle mesh, non-indexed → each face owns its verts → per-FACE
// (flat) normals. The atom every angular panel is built from.
export function flatTriMesh(tris, mat) {
  const v = [];
  for (const [a, b, c] of tris) v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// WEDGE PANEL — fan-triangulate a 2D outline (XY plane, z=0); the caller orients
// it. The flat angular sheet behind every blade / nose / intake facet. Use a
// DoubleSide material (panels are single-thickness).
export function wedgePanel(pts, mat) {
  const tris = [];
  for (let i = 1; i < pts.length - 1; i++)
    tris.push([[pts[0][0], pts[0][1], 0], [pts[i][0], pts[i][1], 0], [pts[i + 1][0], pts[i + 1][1], 0]]);
  return flatTriMesh(tris, mat);
}

// FRAME BAR — a box strut spanning two 3D points a→b. `th` = [width,height] of the
// bar cross-section. The carbon spar / hinge link / endplate rail.
export function frameBar(a, b, th, mat) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(len, th[1], th[0]), mat);
  bar.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  bar.rotation.z = Math.atan2(dy, dx);
  bar.rotation.y = -Math.atan2(dz, Math.hypot(dx, dy));
  return bar;
}

// A boxy mecha cross-section ring (flat deck top, chamfered sides, wide diffuser
// floor) — the loft section that makes a body read as a vehicle, not an organism.
export function wedgeRing(w, top, bot) {
  return [
    [-w * 0.5, top], [-w, top * 0.45], [-w, -bot * 0.5], [-w * 0.55, -bot],
    [w * 0.55, -bot], [w, -bot * 0.5], [w, top * 0.45], [w * 0.5, top],
  ];
}

// HEX PRISM — a tapered 6-sided prism, long axis along +z (so it chains down a
// neck/back/tail). rTop is the +z (aft) radius. The structural unit of the spine.
export function hexPrism(rTop, rBot, len, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg(6)), mat);
  m.rotation.x = Math.PI / 2;   // long axis y → z
  return m;
}

// SPINE SEGMENT — a tapered hex CORE (black mechanical) wearing a dorsal ARMOR
// shell (yellow), with fore/aft/dorsal sockets. The repeatable vertebra used for
// neck, back and tail. coreMat = carbon, armorMat = gold.
export function spineSegment({ rTop, rBot, len, coreMat, armorMat }) {
  const group = new THREE.Group();
  group.add(hexPrism(rTop, rBot, len, coreMat));
  // Dorsal armor shell — a flat-topped overlapping plate riding the upper hex faces.
  const aw = Math.max(rTop, rBot) * 1.55;
  const shell = new THREE.Mesh(new THREE.BoxGeometry(aw, Math.max(rTop, rBot) * 0.5, len * 0.98), armorMat);
  shell.position.set(0, rBot * 0.66, 0);
  group.add(shell);
  const sockets = { fore: socket(0, 0, -len / 2), aft: socket(0, 0, len / 2), dorsal: socket(0, rBot, 0) };
  for (const k in sockets) group.add(sockets[k]);
  return { group, sockets };
}

// VENT PLATE ROW — a yellow trapezoid panel slashed by N parallel black diagonal
// slits (the SVJ side-vent motif). Default 3 slashes. plateMat = gold, slitMat = black.
export function ventPlateRow(n = 3, { w = 0.4, h = 0.26, plateMat, slitMat } = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), plateMat));
  for (let i = 0; i < n; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.045, h * 0.82, 0.05), slitMat);
    slit.position.set((i - (n - 1) / 2) * (w / (n + 0.6)), 0, 0.02);
    slit.rotation.z = 0.62;   // the diagonal slash
    g.add(slit);
  }
  return g;
}

// HEX GRILLE — a recessed black insert with a couple of light crossbars (a carbon
// mesh read on the cheap). Sits inside an intake/vent cavity.
export function hexGrille({ w = 0.4, h = 0.2, mat, barMat } = {}) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), mat));
  for (const oy of [-h * 0.22, h * 0.22]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, h * 0.1, 0.03), barMat ?? mat);
    bar.position.set(0, oy, 0.01);
    g.add(bar);
  }
  return g;
}

// CHEVRON LIGHT — a thin glowing angled strip (the SVJ taillight slash). The caller
// tags the emissive mat (userData.baseEmissive/baseIntensity) and routes it to a
// flare list so it pulses on Surge.
export function chevronLight({ len = 0.34, w = 0.035, mat }) {
  return new THREE.Mesh(new THREE.BoxGeometry(len, w, 0.02), mat);
}

// DIFFUSER ARRAY — a row of raked vertical fins, centre tallest, tapering to the
// edges (the SVJ rear diffuser). Kept compact so it tucks under the thruster block.
export function diffuserArray(n, { centerH = 0.4, sideH = 0.24, thick = 0.04, depth = 0.3, mat, rake = 0.3, spacing = 0.15 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0;
    const finH = centerH * (1 - t) + sideH * t;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(thick, finH, depth), mat);
    fin.position.set((i - (n - 1) / 2) * spacing, -finH * 0.08, 0);
    fin.rotation.x = rake;
    g.add(fin);
  }
  return g;
}

// THRUSTER POD — a black circular housing, a yellow angular frame, and a glowing
// red-orange core disk at the rear opening (faces +z, the chase cam). The
// Lamborghini exhaust translated to a jet thruster. Returns the coreMat for tagging.
export function thrusterPod({ rOuter = 0.2, rCore = 0.12, depth = 0.2, housingMat, frameMat, coreMat }) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(rOuter * 2.3, rOuter * 2.3, depth * 0.55), frameMat);
  frame.position.z = -depth * 0.28;
  frame.rotation.z = Math.PI / 4;   // diamond bezel
  g.add(frame);
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(rOuter, rOuter * 1.06, depth, seg(12)), housingMat);
  housing.rotation.x = Math.PI / 2; // opening faces ±z
  g.add(housing);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(rCore, rCore, depth * 0.4, seg(12)), coreMat);
  core.rotation.x = Math.PI / 2;
  core.position.z = depth * 0.24;   // sits at the rear mouth
  g.add(core);
  return { group: g, coreMat };
}

// MECHA CLAW LEG — upper piston → lower blade → 3-claw foot → heel fin, returned in
// a small FOLDED tuck pose (the layer rotates it up under the belly) so it never
// clutters the chase silhouette. side mirrors the claw splay. Purely static.
export function mechaLeg({ side = 1, pistonMat, bladeMat, clawMat }) {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, 0.28, seg(6)), pistonMat);
  upper.position.set(0, -0.12, 0);
  g.add(upper);
  const knee = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.1), pistonMat);
  knee.position.set(0, -0.26, 0);
  g.add(knee);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.055), bladeMat);
  lower.position.set(0, -0.3, 0.14);
  lower.rotation.x = 1.05;          // shin folded forward against the belly
  g.add(lower);
  for (const cx of [-0.05, 0, 0.05]) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, seg(4)), clawMat);
    claw.position.set(cx, -0.38, 0.28);
    claw.rotation.x = 1.5;          // toes curled
    g.add(claw);
  }
  g.userData.side = side;
  return { group: g };
}
