// ─────────────────────────────────────────────────────────────────────────────
// SVJ MECHA DRAGON — a dragon skeleton wearing aggressive Aventador-SVJ armour.
//
// A REUSABLE hard-surface module KIT (not a sculpted mesh): every part is a small
// repeatable module with named sockets, mirrored L/R where needed, built from one
// of the allowed categories — wedge panel · vent · aero blade · diffuser fin ·
// taillight slash · carbon insert · mechanical joint. The same modules are meant
// to be reused for other mecha dragons / cars / aircraft / boss variants.
//
// Axis convention: head/forward = -Z, tail/rear = +Z, right = +X, up = +Y.
// Chase cam sits behind (+Z): it must read gold blade wings, twin red thrusters,
// red taillight slashes, segmented gold spine, diffuser fins, tail stabilisers.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rad = THREE.MathUtils.degToRad;
const lerp = THREE.MathUtils.lerp;

// ── material kit: metallic yellow/gold, carbon black, gunmetal, red taillights,
//    orange thruster cores, cyan eyes. (Reusable across the whole mecha family.)
export function svjMaterials() {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({
    color: new THREE.Color(c), roughness: o.r ?? 0.42, metalness: o.m ?? 0.85,
    emissive: new THREE.Color(o.e || '#000000'), emissiveIntensity: o.ei || 0, side: THREE.DoubleSide,
  });
  return {
    gold: M('#f5c518', { r: 0.36, m: 0.92 }),
    goldDark: M('#c89a12', { r: 0.46, m: 0.85 }),
    carbon: M('#13151b', { r: 0.58, m: 0.45 }),
    steel: M('#3b424c', { r: 0.4, m: 0.95 }),
    hex: M('#20252e', { r: 0.62, m: 0.55 }),
    red: M('#220604', { e: '#ff2a14', ei: 2.3 }),
    thruster: M('#240d04', { e: '#ff6a18', ei: 2.2 }),
    eye: M('#06141a', { e: '#2ce6ff', ei: 2.2 }),
  };
}

const tag = (geo, mat, role) => { const m = new THREE.Mesh(geo, mat); m.userData.role = role; return m; };
// box strut spanning two points (the workhorse for hard-surface booms/blades)
function strut(from, to, w, h, mat, role) {
  const dir = to.clone().sub(from), len = dir.length();
  const m = tag(new THREE.BoxGeometry(w, h, len), mat, role);
  m.position.copy(from).add(to).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 0, 1), dir.normalize());
  return m;
}

// ── MODULE: hex grille carbon insert (stamped inside every black recess) ──────
// cellMat lets the cells glow (pass M.red for the wing-root energy honeycomb).
function hexGrille(w, h, M, role = 'hexGrille', cellMat = null, nx = 3, ny = 2) {
  const g = new THREE.Group();
  g.add(tag(new THREE.BoxGeometry(w, h, 0.02), M.carbon, role));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const cell = tag(new THREE.CylinderGeometry(w * 0.12, w * 0.12, 0.035, 6), cellMat || M.hex, role);
    cell.rotation.x = Math.PI / 2; cell.rotation.z = Math.PI / 6;
    cell.position.set((i - (nx - 1) / 2) * w * 0.62 / nx, (j - (ny - 1) / 2) * h * 0.9 / ny, 0.012);
    g.add(cell);
  }
  return g;
}

// ── MODULE: angled vent plate (yellow trapezoid + black diagonal slit) ────────
function ventPlate(M, s = 1) {
  const g = new THREE.Group();
  const p = tag(new THREE.BoxGeometry(0.46 * s, 0.05, 0.3 * s), M.gold, 'ventPlate');
  p.rotation.x = -0.12; g.add(p);
  const slit = tag(new THREE.BoxGeometry(0.4 * s, 0.07, 0.05 * s), M.carbon, 'ventSlit');
  slit.position.y = 0.03; slit.rotation.y = 0.7; g.add(slit);
  return g;
}
// three parallel diagonal slashes
function ventTriple(M, s = 1) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const v = ventPlate(M, s); v.position.z = (i - 1) * 0.16 * s; g.add(v); }
  return g;
}

// ── MODULE: chevron taillight strip (red glowing >-slash) ─────────────────────
function chevron(M, s = 1) {
  const g = new THREE.Group();
  const a = tag(new THREE.BoxGeometry(0.035, 0.26 * s, 0.05), M.red, 'chevron'); a.rotation.z = 0.6; a.position.x = -0.06 * s;
  const b = tag(new THREE.BoxGeometry(0.035, 0.26 * s, 0.05), M.red, 'chevron'); b.rotation.z = -0.6; b.position.x = 0.06 * s;
  g.add(a, b); return g;
}

// ── MODULE: tapered hexagonal spine segment ───────────────────────────────────
// black mechanical core, yellow top armour shell, red rear seam light. Named
// sockets so necks/backs/tails are all the same Lego brick at different scales.
function spineSegment(len, r, taper, M, opts = {}) {
  const g = new THREE.Group();
  const core = tag(new THREE.CylinderGeometry(r * taper, r, len, 6), M.carbon, 'spineCore');
  core.rotation.set(Math.PI / 2, 0, Math.PI / 6); g.add(core);                 // axis along Z, flat-top hex
  const top = tag(new THREE.BoxGeometry(r * 1.4, r * 0.55, len * 0.94), M.gold, 'topArmor');
  top.position.y = r * 0.7; top.rotation.x = 0.0; g.add(top);
  // side yellow armour slivers
  for (const sx of [-1, 1]) {
    const side = tag(new THREE.BoxGeometry(r * 0.28, r * 0.7, len * 0.9), M.goldDark, 'sideArmor');
    side.position.set(sx * r * 0.82, r * 0.1, 0); side.rotation.z = sx * 0.25; g.add(side);
  }
  // red rear seam light
  const seam = tag(new THREE.BoxGeometry(r * 1.0, 0.05, 0.05), M.red, 'seamLight');
  seam.position.set(0, r * 0.5, len * 0.5); g.add(seam);
  if (opts.vent) { const v = ventTriple(M, r * 1.8); v.position.set(0, r * 0.95, 0); g.add(v); }
  g.userData.sockets = {
    front_socket: V(0, 0, -len / 2), back_socket: V(0, 0, len / 2), top_plate_socket: V(0, r * 0.95, 0),
    left_side_socket: V(-r, 0, 0), right_side_socket: V(r, 0, 0), bottom_socket: V(0, -r, 0),
  };
  g.userData.len = len; g.userData.r = r;
  return g;
}

// ── MODULE: mechanical dragon SKULL (tall cranium, short snout, distinct jaw) ──
// a quick 5-vert wedge helper (pointed -Z nose, quad base at +Z)
function wedgeMesh(noseZ, baseZ, hw, hb, ht, mat, role) {
  const v = [[0, (hb - ht) * 0, noseZ], [-hw, hb, baseZ], [hw, hb, baseZ], [hw, ht, baseZ], [-hw, ht, baseZ]];
  const pos = [], idx = []; v.forEach((p) => pos.push(...p));
  idx.push(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 4, 3, 1, 3, 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return tag(g, mat, role);
}
function headWedge(M) {
  const g = new THREE.Group();
  // CRANIUM — tall, deep angular skull mass at the back (the "brain case")
  const cran = tag(new THREE.BoxGeometry(0.56, 0.64, 0.58), M.gold, 'headShell');
  cran.position.set(0, 0.12, 0.24); g.add(cran);
  // strong brow / forehead plane sloping down toward the snout (predatory hood)
  const fore = tag(new THREE.BoxGeometry(0.52, 0.18, 0.4), M.goldDark, 'browVent');
  fore.position.set(0, 0.4, -0.06); fore.rotation.x = rad(22); g.add(fore);
  // SNOUT — short, blunt tapered upper jaw (clearly shorter than the cranium)
  const snout = wedgeMesh(-0.4, -0.04, 0.27, 0.16, -0.18, M.gold, 'headShell');
  snout.position.set(0, 0.02, 0); g.add(snout);
  // LOWER JAW — a clearly distinct angular jaw, hinged at the back, slightly open
  const jaw = wedgeMesh(-0.36, 0.08, 0.23, 0.08, -0.15, M.goldDark, 'jawBlade');
  jaw.position.set(0, -0.24, -0.02); jaw.rotation.x = -rad(9); g.add(jaw);
  for (const s of [-1, 1]) {
    // cheek / jaw-hinge plate
    const cheek = tag(new THREE.BoxGeometry(0.1, 0.24, 0.26), M.gold, 'headShell');
    cheek.position.set(s * 0.26, -0.02, 0.06); cheek.rotation.y = s * 0.2; g.add(cheek);
    // recessed eye socket + glowing cyan eye, set into the brow
    const socket = tag(new THREE.BoxGeometry(0.15, 0.12, 0.14), M.carbon, 'eyeSocket');
    socket.position.set(s * 0.24, 0.1, -0.13); socket.rotation.y = s * 0.3; g.add(socket);
    const eye = tag(new THREE.BoxGeometry(0.08, 0.06, 0.08), M.eye, 'eye');
    eye.position.set(s * 0.26, 0.11, -0.17); g.add(eye);
    // backward-swept horn from the skull crown
    g.add(strut(V(s * 0.24, 0.32, 0.18), V(s * 0.5, 0.7, 0.78), 0.06, 0.17, M.goldDark, 'hornFin'));
  }
  // thick NECK COLLAR so the head reads as attached to a real neck, not a spike
  const collar = tag(new THREE.CylinderGeometry(0.28, 0.34, 0.22, 8), M.carbon, 'headShell');
  collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.04, 0.38); g.add(collar);
  g.userData.sockets = { neck_socket: V(0, 0.04, 0.4) };
  return g;
}

// ── MODULE: SVJ engine-bay torso (the root: widest mass / armoured chest) ─────
function engineBay(M) {
  const g = new THREE.Group();
  g.add(tag(new THREE.BoxGeometry(1.0, 0.8, 2.0), M.carbon, 'torsoCore'));        // black mechanical core
  // yellow angular side armour
  for (const s of [-1, 1]) {
    const side = tag(new THREE.BoxGeometry(0.42, 0.7, 1.7), M.gold, 'torsoArmor');
    side.position.set(s * 0.62, 0.06, -0.05); side.rotation.z = s * 0.22; g.add(side);
    // triangular side intake cavity + hex grille insert
    const intake = tag(new THREE.BoxGeometry(0.05, 0.4, 0.7), M.carbon, 'sideIntake');
    intake.position.set(s * 0.86, 0.0, -0.2); intake.rotation.z = s * 0.22; g.add(intake);
    const grille = hexGrille(0.5, 0.34, M); grille.position.set(s * 0.9, 0.0, -0.2);
    grille.rotation.set(0, s * Math.PI / 2, s * 0.22); g.add(grille);
  }
  // top engine vent plates
  const topVent = ventTriple(M, 1.2); topVent.position.set(0, 0.46, 0.3); g.add(topVent);
  const topGrille = hexGrille(0.7, 0.5, M); topGrille.position.set(0, 0.42, -0.4); topGrille.rotation.x = -Math.PI / 2; g.add(topGrille);
  // rear taillight chevrons on the black rear panel
  const rearLight = chevron(M, 1.3); rearLight.position.set(0, 0.2, 1.0); g.add(rearLight);
  g.userData.sockets = {
    front_neck_socket: V(0, 0.05, -1.0), rear_spine_socket: V(0, 0.05, 1.0),
    left_wing_shoulder_socket: V(-0.5, 0.42, -0.3), right_wing_shoulder_socket: V(0.5, 0.42, -0.3),
    left_leg_socket: V(-0.46, -0.36, 0.1), right_leg_socket: V(0.46, -0.36, 0.1),
    rear_thruster_socket_left: V(-0.52, 0.16, 1.02), rear_thruster_socket_right: V(0.52, 0.16, 1.02),
    bottom_diffuser_socket: V(0, -0.42, 0.7),
  };
  return g;
}

// ── MODULE: twin circular thruster pod (black housing, orange core, gold frame)
function thrusterPod(M) {
  const g = new THREE.Group();
  const housing = tag(new THREE.CylinderGeometry(0.32, 0.4, 0.55, 16), M.carbon, 'thrusterHousing');
  housing.rotation.x = Math.PI / 2; g.add(housing);
  const frame = tag(new THREE.TorusGeometry(0.33, 0.06, 8, 18), M.gold, 'thrusterFrame');
  frame.position.z = 0.28; g.add(frame);
  const core = tag(new THREE.CircleGeometry(0.27, 18), M.thruster, 'thrusterCore');
  core.position.z = 0.3; g.add(core);                                            // glowing core faces +Z (camera)
  const flame = tag(new THREE.ConeGeometry(0.22, 1.4, 12), M.thruster, 'thrusterFlame');
  flame.rotation.x = -Math.PI / 2; flame.position.z = 1.0; flame.scale.setScalar(0.01); g.add(flame);
  g.userData.flame = flame; g.userData.core = core;
  return g;
}

// ── MODULE: rear diffuser fin array (SVJ rear diffuser — center fin longest) ──
function diffuser(M) {
  const g = new THREE.Group(); const n = 7;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), h = 0.46 * (1 - Math.abs(t - 0.5) * 1.05);
    const fin = tag(new THREE.BoxGeometry(0.05, h, 0.52), M.carbon, 'diffuserFin');
    fin.position.set((t - 0.5) * 1.25, -h / 2, 0.06); fin.rotation.x = -0.5; g.add(fin);
  }
  // a red light slit across the diffuser top
  const slit = tag(new THREE.BoxGeometry(1.2, 0.04, 0.04), M.red, 'diffuserLight'); slit.position.set(0, 0.02, -0.12); g.add(slit);
  return g;
}

// ── MODULE: mecha claw leg — a COMPACT FOLDED limb tucked against the body in
// flight (angular thigh + knee-bent shin + forward talons), not a dangling block.
function clawLeg(side, M) {
  const g = new THREE.Group();
  // angular thigh, swept back-and-down
  const thigh = tag(new THREE.BoxGeometry(0.13, 0.24, 0.16), M.gold, 'upperLegPiston');
  thigh.position.set(side * 0.04, -0.1, 0.04); thigh.rotation.set(rad(34), 0, side * rad(8)); g.add(thigh);
  // shin folded forward (knee bent up), gunmetal blade
  g.add(strut(V(side * 0.05, -0.2, 0.1), V(side * 0.09, -0.27, -0.16), 0.09, 0.13, M.steel, 'lowerLegBlade'));
  // three talons tucked under, hooking forward-down
  for (let c = -1; c <= 1; c++) {
    const claw = tag(new THREE.ConeGeometry(0.028, 0.13, 5), M.goldDark, 'clawFoot');
    claw.position.set(side * 0.09 + c * 0.045, -0.31, -0.2); claw.rotation.x = rad(62); g.add(claw);
  }
  const heel = tag(new THREE.ConeGeometry(0.035, 0.11, 4), M.carbon, 'heelFin');
  heel.position.set(side * 0.05, -0.14, 0.16); heel.rotation.x = rad(-52); g.add(heel);
  return g;
}

// ── MODULE: hard-surface blade-wing assembly ─────────────────────────────────
// A thick faceted ROOT PYLON on the upper back carrying TWO solid aerofoil blades:
// a dominant PRIMARY (long, kinked, tapering to a needle) and a clearly smaller
// SECONDARY tucked below/inboard. Real volume (swept aerofoil cross-section, not a
// flat triangle), gold armour outside, dark recessed inner face with one inset red
// Y-channel. Raised + leaning back into a tall V. Built RIGHT; `side` mirrors it.

// a blade's centreline in its own up(+y)/back(+z) plane: a steep thick root rise,
// a hard angular KINK around 1/4 length, then a long straight lean-back run to tip.
function bladePath(s, L, segA, angA, angC) {
  const aLen = segA * L;
  if (s <= segA) { const d = s * L; return [Math.sin(angA) * d, Math.cos(angA) * d]; }
  const ky = Math.sin(angA) * aLen, kz = Math.cos(angA) * aLen, d = (s - segA) * L;
  const convex = 0.015 * L * Math.sin((s - segA) / (1 - segA) * Math.PI);         // barely-there bow → clean blade, not a banana
  return [ky + Math.sin(angC) * d, kz + Math.cos(angC) * d + convex];
}
const lerp3 = (s, a, b, c) => (s < 0.5 ? lerp(a, b, s / 0.5) : lerp(b, c, (s - 0.5) / 0.5));
// sweep a tapering aerofoil cross-section along the kinked path → a SOLID blade.
function aeroBlade(L, wR, wM, wT, tR, tM, tT, segA, angA, angC, mat, role) {
  const N = 18, pos = [], idx = [];
  const cs = [[0.5, 0], [0.22, 0.5], [-0.34, 0.42], [-0.5, 0], [-0.3, -0.45], [0.25, -0.55]]; // chord%, thick%
  const path = (s) => bladePath(s, L, segA, angA, angC);
  for (let i = 0; i <= N; i++) {
    const s = i / N, [py, pz] = path(s), e = 0.008;
    const [ay, az] = path(Math.max(0, s - e)), [by, bz] = path(Math.min(1, s + e));
    let Ty = by - ay, Tz = bz - az; const tl = Math.hypot(Ty, Tz) || 1; Ty /= tl; Tz /= tl;
    const Ny = -Tz, Nz = Ty, w = lerp3(s, wR, wM, wT), t = lerp3(s, tR, tM, tT);
    for (const [cn, cx] of cs) pos.push(cx * t, py + Ny * w * cn, pz + Nz * w * cn);
  }
  for (let i = 0; i < N; i++) { const a = i * 6, b = a + 6; for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; idx.push(a + k, b + k, b + k2, a + k, b + k2, a + k2); } }
  for (let k = 1; k < 5; k++) idx.push(0, k, k + 1);                              // base cap
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return tag(g, mat, role);
}
// faceted tapered pylon: broad load-bearing base → narrower top (not cylindrical).
function wedgeBlock(w0, d0, w1, d1, h, mat, role) {
  const v = [[-w0 / 2, 0, -d0 / 2], [w0 / 2, 0, -d0 / 2], [w0 / 2, 0, d0 / 2], [-w0 / 2, 0, d0 / 2],
    [-w1 / 2, h, -d1 / 2 + 0.08], [w1 / 2, h, -d1 / 2 + 0.08], [w1 / 2, h, d1 / 2 + 0.08], [-w1 / 2, h, d1 / 2 + 0.08]];
  const pos = []; v.forEach((p) => pos.push(...p));
  const idx = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return tag(g, mat, role);
}

// extrude a 2D polygon (points in the [y,z] plane) along ±x → a thin faceted panel
function flatPanel(pts, thick, mat, role) {
  const n = pts.length, pos = [], idx = [];
  for (const [y, z] of pts) pos.push(thick, y, z);
  for (const [y, z] of pts) pos.push(-thick, y, z);
  for (let i = 1; i < n - 1; i++) idx.push(0, i, i + 1);                          // front face
  for (let i = 1; i < n - 1; i++) idx.push(n, n + i + 1, n + i);                  // back face
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, j, n + j, i, n + j, n + i); }  // side walls
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return tag(g, mat, role);
}

// ── WING: a SINGLE Aventador-aero-blade DAGGER (per the reference) — a gold outer
// FRAME around a large black inner membrane panel, with one red zig-zag circuit and
// a small lower support strake. Built in the wing-local y(up)/z(aft) plane on a slim
// shoulder pylon; leaned outward + mirrored. NOT a solid blade, not a twin/fan.
function wingSystem(side, M) {
  const root = new THREE.Group();
  const LEAN = rad(32);
  root.rotation.z = -side * LEAN;
  const mir = new THREE.Group(); mir.scale.x = side; root.add(mir);

  // slim armoured shoulder pylon / hinge (root mass cut ~30%)
  const pylon = wedgeBlock(0.42, 0.9, 0.3, 0.4, 0.46, M.gold, 'wingMount');
  pylon.rotation.x = rad(-12); mir.add(pylon);
  const pylonEdge = wedgeBlock(0.16, 0.82, 0.12, 0.36, 0.44, M.goldDark, 'wingMount');
  pylonEdge.position.set(0.24, 0, 0); pylonEdge.rotation.x = rad(-12); mir.add(pylonEdge);
  const hingeJ = tag(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 14), M.steel, 'shoulderHinge');
  hingeJ.rotation.z = Math.PI / 2; hingeJ.position.set(0.04, 0.14, 0.04); mir.add(hingeJ);
  const jcore = tag(new THREE.CylinderGeometry(0.085, 0.085, 0.44, 10), M.red, 'jointCore');
  jcore.rotation.z = Math.PI / 2; jcore.position.set(0.04, 0.14, 0.04); mir.add(jcore);

  const hinge = new THREE.Group(); hinge.position.set(0, 0.4, 0); mir.add(hinge);
  const outer = new THREE.Group(); hinge.add(outer);
  outer.scale.set(1.1, 1.1, 1.19);                                              // z stretched so the root moves forward but the TIP stays put

  // ── dagger TRACED from the reference PNG (scratchpad/trace.mjs): an asymmetric
  // raked blade — long shallow LEADING edge sweeping up+back to a tip at ~0.32 body
  // height / ~0.46 body aft, a shorter steeper TRAILING return to a rear root.
  // anchors [y(up), z(aft)] in model units (front root at origin).
  const A = [0.0, 0.0];          // front root (on the back)
  const L1 = [1.0, 0.5], L2 = [1.5, 1.3], L3 = [1.95, 2.05], L4 = [2.36, 2.8], L5 = [2.75, 3.55];
  const T = [3.1, 4.35];         // raked-back spear tip
  const B = [0.0, 1.85];         // rear root
  const poly = [A, L1, L2, L3, L4, L5, T, B];
  // large BLACK inner membrane panel (fills most of the wing)
  outer.add(flatPanel(poly, 0.05, M.carbon, 'wingInnerStruct'));
  // GOLD outer frame: thick swept leading edge, thinner trailing + root rails
  const edge = (p, q, w, h, mat) => outer.add(strut(V(0, p[0], p[1]), V(0, q[0], q[1]), w, h, mat, 'outerWingBlade'));
  edge(A, L1, 0.11, 0.16, M.gold); edge(L1, L2, 0.09, 0.13, M.gold); edge(L2, L3, 0.08, 0.11, M.gold);
  edge(L3, L4, 0.07, 0.1, M.gold); edge(L4, L5, 0.06, 0.09, M.gold); edge(L5, T, 0.05, 0.08, M.gold);
  edge(T, B, 0.05, 0.07, M.goldDark);      // steeper trailing return
  edge(B, A, 0.06, 0.09, M.goldDark);      // root rail
  // sharp gold spear tip
  const tip = tag(new THREE.ConeGeometry(0.075, 0.6, 6), M.gold, 'outerWingBlade');
  tip.position.set(0, T[0], T[1]); tip.quaternion.setFromUnitVectors(V(0, 1, 0), V(0, T[0] - L5[0], T[1] - L5[1]).normalize());
  outer.add(tip);
  // one clean RED zig-zag circuit inset on the black panel (root → upper rear)
  const zig = [[0.5, 0.45], [1.3, 1.0], [1.05, 1.5], [2.2, 2.4], [2.7, 3.4]];
  for (let i = 0; i < zig.length - 1; i++)
    outer.add(strut(V(0.06, zig[i][0], zig[i][1]), V(0.06, zig[i + 1][0], zig[i + 1][1]), 0.035, 0.05, M.red, 'energyChannel'));
  // small lower gold STRAKE under the rear root (subordinate support fin)
  outer.add(flatPanel([[0.0, 1.55], [-0.42, 2.15], [0.06, 2.25]], 0.04, M.gold, 'secondaryBlade'));

  // wingtip AIR-SLICE streak (VFX) — a thin additive ribbon trailing aft from the
  // tip; driven (opacity/scale) by the animator only on a hard bank. Zero-scaled +
  // hidden by default so the static showcase never shows it.
  const tipTrailMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#eaf7ff'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const tipTrail = tag(new THREE.BoxGeometry(0.015, 0.05, 2.4), tipTrailMat, 'vfxTrail');
  tipTrail.position.set(0, A[0] + (T[0] - A[0]), T[1] + 1.15);   // at the spear tip, extending aft
  tipTrail.visible = false; tipTrail.scale.z = 0.001; outer.add(tipTrail);

  root.userData.hinge = hinge; root.userData.outer = outer;
  root.userData.tipTrail = tipTrail; root.userData.tipTrailMat = tipTrailMat;
  return root;
}
// flat swept aero blade in the X(span)-Z(chord) plane
function bladeGeo(span, rootC, tipC, sweep, camber = 0.05) {
  const pos = [], idx = [], N = 6;
  for (let i = 0; i <= N; i++) {
    const s = i / N, x = span * s, lead = sweep * s, c = lerp(rootC, tipC, s), y = camber * Math.sin(s * Math.PI);
    pos.push(x, y, lead, x, y, lead + c);
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ── ASSEMBLY ──────────────────────────────────────────────────────────────────
// The body is a CURVED centreline with a vertebrate mass rhythm — neck → deep
// chest/shoulder → pinched waist → strong hips → thick tail base → taper — so the
// silhouette reads as a mechanical dragon, not a straight dragonfly fuselage.
// rings: [role, z, cy(centreline height), hw(half-width), hh(half-height/depth)]
const RINGS = [
  // re-proportioned from the reference trace: longer torso (~48%), shorter tail
  // (~33%), thin neck/tail, and WIDTH (hw) slimmed to ~0.8× the height so the 3D
  // body reads leaner (the side image can't show width — it was too thick in 3D).
  ['neck', -3.35, 0.44, 0.26, 0.34],      // thin neck base
  ['neck', -2.95, 0.50, 0.34, 0.42],
  ['shoulder', -2.50, 0.48, 0.60, 0.72],  // shoulder mass (slimmer width)
  ['chest', -1.70, 0.42, 0.74, 0.94],     // deepest mass — tall, but not wide
  ['chest', -0.85, 0.35, 0.70, 0.86],     // torso extended further AFT (longer torso)
  ['waist', 0.00, 0.27, 0.42, 0.48],      // waist pinch
  ['hip', 0.85, 0.24, 0.68, 0.70],        // hip / engine mass (widened ~13% for the pods)
  ['hip', 1.55, 0.16, 0.58, 0.58],
  ['tailbase', 2.10, 0.09, 0.34, 0.50],   // NARROW central tail spine (width) but still tall/strong
  ['tail', 2.60, 0.03, 0.28, 0.38],
  ['tail', 3.10, -0.02, 0.26, 0.30],
  ['tail', 3.60, -0.06, 0.19, 0.22],      // clean tapered shaft (no fins along here)
  ['tail', 4.10, -0.08, 0.13, 0.15],
  ['tail', 4.55, -0.08, 0.08, 0.09],
  ['tail', 4.95, -0.05, 0.05, 0.05],
];

// ── VFX RIG: additive boost/surge effects (tail comet, thruster shock rings, surge
// aura). The animator (svjAnim.js) owns their scale/opacity/colour; everything is
// zero-scaled + hidden here so the static showcase + proof renders are untouched.
function buildVfx(M, tipY, tailTipZ, hipY) {
  const grp = new THREE.Group(); grp.name = 'svjVfx';
  const addMat = (c, back = false) => new THREE.MeshBasicMaterial({
    color: new THREE.Color(c), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
    side: back ? THREE.BackSide : THREE.DoubleSide,
  });
  // tail comet trail — a cone streaming aft (+Z) from the tail tip
  const tailMat = addMat('#ff2a14');
  const tailTrail = tag(new THREE.ConeGeometry(0.16, 1.4, 10), tailMat, 'vfxTrail');
  tailTrail.rotation.x = -Math.PI / 2; tailTrail.position.set(0, tipY, tailTipZ + 0.7);
  tailTrail.visible = false; tailTrail.scale.setScalar(0.001); grp.add(tailTrail);
  // shock-ring pool behind the thrusters
  const rings = [], ringZ = 2.0;
  for (let i = 0; i < 3; i++) {
    const r = tag(new THREE.TorusGeometry(0.5, 0.045, 5, 18), addMat('#ffb060'), 'vfxRing');
    r.position.set(0, hipY, ringZ); r.visible = false; r.scale.setScalar(0.001); r.userData._age = 1;
    grp.add(r); rings.push(r);
  }
  // surge aura — an elongated back-lit shell around the body
  const auraMat = addMat('#ff2bd0', true);
  const aura = tag(new THREE.SphereGeometry(1.0, 16, 10), auraMat, 'vfxAura');
  aura.position.set(0, 0.18, 0.4); aura.visible = false; aura.scale.setScalar(0.001); grp.add(aura);
  return { group: grp, handles: { tailTrail, tailMat, rings, ringZ, aura, auraMat } };
}

export function buildSVJDragon(knobs = {}) {
  const M = svjMaterials();
  const root = new THREE.Group(); root.name = 'SVJMechaDragon';
  const tailSegs = [];
  const ring = (role) => RINGS.find((r) => r[0] === role);
  const lastTail = RINGS[RINGS.length - 1];

  // build the segmented spine along the curved centreline, scaling each segment
  // to the local width/height so the mass hierarchy reads.
  for (let i = 0; i < RINGS.length - 1; i++) {
    const [r0, z0, cy0, hw0, hh0] = RINGS[i], [r1, z1, cy1, hw1, hh1] = RINGS[i + 1];
    const mz = (z0 + z1) / 2, mcy = (cy0 + cy1) / 2, len = Math.hypot(z1 - z0, cy1 - cy0);
    const hw = (hw0 + hw1) / 2, hh = (hh0 + hh1) / 2;
    const seg = spineSegment(len * 0.97, 0.5, 0.94, M, { vent: r0 === 'chest' || r0 === 'hip' });
    seg.scale.set(hw / 0.5, hh / 0.5, 1);
    seg.position.set(0, mcy, mz);
    seg.quaternion.setFromUnitVectors(V(0, 0, 1), V(0, cy1 - cy0, z1 - z0).normalize());
    root.add(seg);
    if (r0 === 'tail' || r0 === 'tailbase') tailSegs.push(seg);
  }

  // HEAD at the front of the neck, dropped slightly + tilted down (head leads low)
  const n0 = RINGS[0];
  const head = headWedge(M); head.scale.set(1.32, 1.5, 1.28);                   // compact, tall mechanical skull
  head.position.set(0, n0[2] - 0.02, n0[1] - 0.46); head.rotation.x = rad(7); root.add(head);

  // CHEST / SHOULDER armour — the main load-bearing block carrying head + wings.
  const ch = ring('chest'), sh = ring('shoulder');
  const chestCore = tag(new THREE.BoxGeometry(ch[3] * 0.95, ch[4] * 0.95, 1.2), M.carbon, 'torsoCore');  // internal dark recess
  chestCore.position.set(0, ch[2] - 0.02, ch[1] + 0.1); root.add(chestCore);
  for (const s of [-1, 1]) {
    // angular gold shoulder plate hugging the chest (tapered wedge, not a slab)
    const plate = wedgeBlock(0.9, ch[4] * 1.2, 0.5, ch[4] * 0.7, 0.3, M.gold, 'torsoArmor');
    plate.position.set(s * ch[3] * 0.6, ch[2] + ch[4] * 0.25, ch[1] + 0.1);
    plate.rotation.set(Math.PI / 2, 0, s * 0.5); root.add(plate);
    const intake = tag(new THREE.BoxGeometry(0.05, ch[4] * 0.6, 0.7), M.carbon, 'sideIntake');
    intake.position.set(s * ch[3] * 1.02, ch[2] - 0.04, ch[1]); intake.rotation.z = s * 0.2; root.add(intake);
    const grille = hexGrille(0.5, 0.36, M); grille.position.set(s * ch[3] * 1.06, ch[2] - 0.04, ch[1]);
    grille.rotation.set(0, s * Math.PI / 2, s * 0.2); root.add(grille);
  }

  // WINGS — mounted on the SHOULDER-BACK junction (~33% of body length, well behind
  // the head), lowered and embedded into the deep chest mass, with a WIDE stance so
  // they read as growing from a real upper back, not a narrow central stalk.
  const wings = [];
  const wz = -1.45, wy = ch[2] + ch[4] * 0.26, wx = ch[3] * 1.35;               // hinge forward over the front shoulder; wider factor compensates the slimmer chest
  for (const side of [-1, 1]) {
    const fair = wedgeBlock(0.72, 1.25, 0.46, 0.6, ch[4] * 0.74, M.gold, 'wingMount');  // stronger scapular support
    fair.position.set(side * ch[3] * 0.72, ch[2] + ch[4] * 0.02, wz);
    fair.rotation.set(0, 0, -side * 0.42); root.add(fair);
    const w = wingSystem(side, M); w.userData.side = side;
    w.position.set(side * wx, wy, wz);
    root.add(w); wings.push(w);
  }

  // HIP CHASSIS — a stronger armoured rear-body mass the thrusters + tail grow from.
  const hp = ring('hip'), hpBack = RINGS[7], tb = ring('tailbase');
  const hipCore = tag(new THREE.BoxGeometry(hp[3] * 1.0, hp[4] * 1.0, 1.1), M.carbon, 'hipChassis');  // internal
  hipCore.position.set(0, hp[2] - 0.02, hp[1] + 0.2); root.add(hipCore);
  for (const s of [-1, 1]) {                                                     // tapered gold haunch wedges
    const haunch = wedgeBlock(0.9, hp[4] * 1.5, 0.44, hp[4] * 0.9, 0.4, M.gold, 'hipArmor');
    haunch.position.set(s * hp[3] * 0.82, hp[2] + hp[4] * 0.15, hp[1] + 0.2);
    haunch.rotation.set(Math.PI / 2, 0, s * 0.45); root.add(haunch);
  }
  // SLOPED beveled ENGINE COVER over the rear deck — two facets to a centre ridge,
  // replacing the stacked-rectangle read with a Lamborghini engine-cover plane.
  const ecZ = (hp[1] + tb[1]) / 2, ecLen = (tb[1] - hp[1]) + 0.7;
  for (const s of [-1, 1]) {
    const facet = tag(new THREE.BoxGeometry(hp[3] * 0.98, 0.07, ecLen), M.gold, 'torsoArmor');
    facet.position.set(s * hp[3] * 0.4, hp[2] + hp[4] * 0.66, ecZ); facet.rotation.set(rad(-5), 0, s * rad(28)); root.add(facet);
  }
  const ridge = tag(new THREE.BoxGeometry(0.09, hp[4] * 0.42, ecLen), M.goldDark, 'spineCap');
  ridge.position.set(0, hp[2] + hp[4] * 0.82, ecZ); ridge.rotation.x = rad(-5); root.add(ridge);
  // recessed central TAIL SOCKET — a dark recess + gold rim, the tail base seated
  // deliberately INTO the pelvis (rear reads: pod | tail socket | pod).
  const recess = tag(new THREE.BoxGeometry(tb[3] * 2.1, tb[4] * 1.5, 0.46), M.carbon, 'hipChassis');
  recess.position.set(0, tb[2], tb[1] - 0.26); root.add(recess);
  const rim = tag(new THREE.TorusGeometry(tb[3] * 1.25, 0.055, 6, 16), M.gold, 'hipArmor');
  rim.position.set(0, tb[2] + 0.02, tb[1] - 0.02); rim.scale.set(1, tb[4] / tb[3], 1); root.add(rim);
  // twin canted ENGINE PODS — a gold pod shell wrapping a recessed thruster, yawed
  // AND rolled outward so each reads as a side-mounted engine pod, not a flat disc.
  // no cant (it read badly); thrusters straight-back, set so their centre-to-centre
  // spacing ≈ 80% of the body shoulder width (≈1.675) → ±0.67.
  const thrusters = []; const podX = 0.67, podZ = hpBack[1] + 0.36, podYaw = 0, podRoll = 0;
  for (const s of [-1, 1]) {
    const housing = tag(new THREE.BoxGeometry(0.46, hp[4] * 0.92, 0.62), M.gold, 'hipArmor');
    housing.position.set(s * podX, hp[2], podZ - 0.12); housing.rotation.set(0, s * podYaw, s * podRoll); root.add(housing);
    const t = thrusterPod(M); t.position.set(s * podX, hp[2] - 0.01, podZ - 0.04); t.rotation.set(0, s * podYaw, s * podRoll); root.add(t); thrusters.push(t);
  }
  // rear diffuser under the hip mass
  const diff = diffuser(M); diff.position.set(0, hp[2] - hp[4] * 0.95, hpBack[1] + 0.1); root.add(diff);

  // TUCKED LEGS — fore under the chest, hind under the hips (quadruped read).
  for (const [zc, hwc, hhc, cyc] of [[ch[1] + 0.25, ch[3], ch[4], ch[2]], [hp[1] + 0.05, hp[3], hp[4], hp[2]]])
    for (const s of [-1, 1]) {
      const leg = clawLeg(s, M); leg.position.set(s * hwc * 0.75, cyc - hhc * 0.82, zc); root.add(leg);
    }

  // TAIL — the shaft stays CLEAN + tapered; all fins concentrate in a deliberate
  // terminal stabiliser CLUSTER at the last ~12% (arrowhead, not a saw-blade shaft).
  {
    const et = lastTail, tipY = et[2] + 0.02, tz = et[1];                       // cluster tracks the actual tail tip
    for (const s of [-1, 1]) {
      const big = tag(bladeGeo(1.05, 0.46, 0.1, 0.36), M.goldDark, 'tailBladeFin');   // forward pair (larger)
      big.position.set(s * 0.13, tipY, tz - 0.8); big.rotation.set(rad(15), 0, s * rad(56)); big.scale.x = s; root.add(big);
      const small = tag(bladeGeo(0.62, 0.32, 0.08, 0.3), M.goldDark, 'tailBladeFin');  // tip pair (smaller)
      small.position.set(s * 0.1, tipY, tz - 0.33); small.rotation.set(rad(10), 0, s * rad(44)); small.scale.x = s; root.add(small);
      const tl = chevron(M, 0.7); tl.position.set(s * 0.12, tipY, tz - 0.65); root.add(tl);  // red accents on the cluster
    }
  }
  const spear = tag(new THREE.ConeGeometry(lastTail[3] * 1.3, 0.7, 6), M.gold, 'tailSpear');
  spear.rotation.x = Math.PI / 2; spear.position.set(0, lastTail[2], lastTail[1] + 0.42); root.add(spear);
  const tailTipZ = lastTail[1] + 0.7;

  // dorsal back-ridge vents following the curve (chest + hip crowns)
  for (const [, z, cy, , hh] of [ch, hp]) { const v = ventTriple(M, 1.1); v.position.set(0, cy + hh + 0.04, z); root.add(v); }

  // VFX rig (boost/surge effects) — hidden until the animator drives it
  const vfx = buildVfx(M, lastTail[2], tailTipZ, hp[2]); root.add(vfx.group);

  root.updateMatrixWorld(true);
  root.userData.anim = {
    wings, thrusters, tailSegs,
    glowMats: [M.red, M.thruster, M.eye],
    materials: M, tailTipZ, vfx: vfx.handles,
  };
  return { group: root, materials: M };
}

export default buildSVJDragon;
