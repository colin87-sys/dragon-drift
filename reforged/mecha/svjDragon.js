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
  const cran = tag(new THREE.BoxGeometry(0.54, 0.56, 0.54), M.gold, 'headShell');
  cran.position.set(0, 0.1, 0.22); g.add(cran);
  // forehead / brow plane sloping down toward the snout
  const fore = tag(new THREE.BoxGeometry(0.5, 0.16, 0.42), M.goldDark, 'browVent');
  fore.position.set(0, 0.34, -0.04); fore.rotation.x = rad(18); g.add(fore);
  // SNOUT — short, blunt tapered upper jaw (clearly shorter than the cranium)
  const snout = wedgeMesh(-0.46, -0.04, 0.26, 0.16, -0.16, M.gold, 'headShell');
  snout.position.set(0, 0.02, 0); g.add(snout);
  // LOWER JAW — a clearly distinct angular jaw, hinged at the back, slightly open
  const jaw = wedgeMesh(-0.4, 0.08, 0.22, 0.08, -0.14, M.goldDark, 'jawBlade');
  jaw.position.set(0, -0.22, -0.02); jaw.rotation.x = -rad(8); g.add(jaw);
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

// ── MODULE: mecha claw leg (tucked) ───────────────────────────────────────────
function clawLeg(side, M) {
  const g = new THREE.Group();
  g.add(strut(V(0, 0, 0), V(side * 0.18, -0.3, 0.05), 0.12, 0.12, M.steel, 'upperLegPiston'));
  g.add(strut(V(side * 0.18, -0.3, 0.05), V(side * 0.12, -0.34, 0.35), 0.1, 0.14, M.goldDark, 'lowerLegBlade'));
  for (let c = -1; c <= 1; c++) {
    const claw = tag(new THREE.ConeGeometry(0.035, 0.16, 5), M.steel, 'clawFoot');
    claw.position.set(side * 0.12 + c * 0.06, -0.4, 0.45); claw.rotation.x = -1.4; g.add(claw);
  }
  const heel = tag(new THREE.ConeGeometry(0.05, 0.14, 4), M.carbon, 'heelFin');
  heel.position.set(side * 0.12, -0.3, -0.05); heel.rotation.x = 1.4; g.add(heel);
  g.scale.x = 1; return g;
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

function wingSystem(side, M) {
  const root = new THREE.Group();
  const LEAN = rad(38);                                                          // wider shoulder-mounted V (tuned to hold ~90 projected width)
  root.rotation.z = -side * LEAN;
  const mir = new THREE.Group(); mir.scale.x = side; root.add(mir);              // mirror geometry for the left

  // ── thick faceted root PYLON (the bulkiest zone), leaning back ──────────────
  // root chord runs front-to-back ~80% of the torso (≈1.6u) so the wing INTEGRATES
  // into the back along most of the spine, then tapers fast up into the blades.
  const ROOT_CHORD = 1.6;
  const pylon = wedgeBlock(0.66, ROOT_CHORD, 0.44, 0.58, 0.74, M.gold, 'wingMount');   // chunkier shoulder pylon
  pylon.rotation.x = rad(-12); mir.add(pylon);
  const pylonEdge = wedgeBlock(0.24, ROOT_CHORD * 0.92, 0.18, 0.5, 0.7, M.goldDark, 'wingMount');
  pylonEdge.position.set(0.34, 0, 0); pylonEdge.rotation.x = rad(-12); mir.add(pylonEdge);
  const hingeJ = tag(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 14), M.steel, 'shoulderHinge');
  hingeJ.rotation.z = Math.PI / 2; hingeJ.position.set(0.05, 0.16, 0.05); mir.add(hingeJ);
  const jcore = tag(new THREE.CylinderGeometry(0.1, 0.1, 0.52, 10), M.red, 'jointCore');
  jcore.rotation.z = Math.PI / 2; jcore.position.set(0.05, 0.16, 0.05); mir.add(jcore);
  const innerBox = tag(new THREE.BoxGeometry(0.26, 0.36, ROOT_CHORD * 0.62), M.carbon, 'wingInnerStruct');  // dark internal mass
  innerBox.position.set(-0.12, 0.16, 0.06); mir.add(innerBox);

  // ── the rigid blade cluster pivoting at the pylon top ───────────────────────
  const hinge = new THREE.Group(); hinge.position.set(0.0, 0.44, 0.0); mir.add(hinge);
  const pose = hinge, outer = new THREE.Group(); hinge.add(outer);

  // PRIMARY blade — broad delta root chord (≈80% torso) sweeping fast to a long
  // kinked needle. Length set against the head-to-tail master scale (see measure.mjs).
  const LP = 6.05;                                                                // primary root→tip length (model u)
  // 3-stage designed blade: thick broad ROOT (held wide through the kink) → a hard
  // KINK at ~27% (steep root angA 68° → swept outer angC 50°) → long clean taper.
  // root chord +20%, root thickness ~3× the mid (a thick armour blade, not a horn).
  const prim = aeroBlade(LP, ROOT_CHORD * 1.2, 0.62, 0.05, 0.36, 0.12, 0.03, 0.27, rad(68), rad(50), M.gold, 'outerWingBlade');
  prim.position.set(0, 0, -0.5); outer.add(prim);
  // dark recessed inner face panel hugging the blade (thin, inboard)
  const primInner = aeroBlade(LP * 0.9, ROOT_CHORD * 0.82, 0.42, 0.05, 0.06, 0.03, 0.02, 0.27, rad(68), rad(50), M.carbon, 'wingInnerStruct');
  primInner.position.set(-0.14, 0.02, -0.48); outer.add(primInner);
  // SECONDARY blade — ≈55% len, dropped well below + behind with a clear negative-
  // space gap and a shallower sweep so it reads as a distinct support fin.
  const sec = aeroBlade(LP * 0.55, ROOT_CHORD * 0.55, 0.26, 0.04, 0.16, 0.07, 0.03, 0.26, rad(52), rad(42), M.gold, 'secondaryBlade');
  sec.position.set(-0.2, -0.42, 0.12); outer.add(sec);

  // ONE inset red Y-channel on each blade's dark inner face (structured, recessed)
  const yChan = (host, x, y, z, scl) => {
    const stem = tag(new THREE.BoxGeometry(0.03, 0.5 * scl, 0.05), M.red, 'energyChannel');
    stem.position.set(x, y, z); stem.rotation.x = rad(20); host.add(stem);
    for (const s of [-1, 1]) {
      const br = tag(new THREE.BoxGeometry(0.03, 0.32 * scl, 0.05), M.red, 'energyChannel');
      br.position.set(x, y + 0.26 * scl, z + 0.02); br.rotation.set(rad(20), 0, s * rad(34)); host.add(br);
    }
  };
  yChan(outer, -0.12, 0.5, 0.18, 1.0);                                           // on the primary inner face
  yChan(outer, -0.16, 0.1, 0.34, 0.55);                                          // smaller, on the secondary

  root.userData.hinge = hinge; root.userData.pose = pose; root.userData.outer = outer;
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
  ['neck', -3.35, 0.44, 0.30, 0.32],      // thicker neck base (head attaches to a real neck)
  ['neck', -2.88, 0.50, 0.46, 0.48],
  ['shoulder', -2.32, 0.48, 0.82, 0.78],  // deeper+wider shoulder mass
  ['chest', -1.75, 0.42, 0.94, 0.98],     // deepest + widest load-bearing mass
  ['chest', -1.18, 0.36, 0.88, 0.92],     // shoulder-back, still deep (wings root just here)
  ['waist', -0.52, 0.28, 0.42, 0.42],     // clear pinch behind the chest
  ['hip', 0.18, 0.26, 0.82, 0.78],        // bulkier hip / engine mass
  ['hip', 0.76, 0.18, 0.66, 0.64],
  ['tailbase', 1.32, 0.10, 0.66, 0.70],   // thick tail base
  ['tail', 1.86, 0.02, 0.46, 0.48],
  ['tail', 2.40, -0.04, 0.33, 0.34],
  ['tail', 2.94, -0.08, 0.23, 0.24],      // clean tapered shaft (no fins along here)
  ['tail', 3.48, -0.10, 0.15, 0.16],
  ['tail', 4.02, -0.10, 0.09, 0.10],
  ['tail', 4.56, -0.06, 0.05, 0.05],
];

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
  const wz = -1.05, wy = ch[2] + ch[4] * 0.38, wx = ch[3] * 1.12;
  for (const side of [-1, 1]) {
    const fair = wedgeBlock(0.82, 1.3, 0.46, 0.66, ch[4] * 0.95, M.gold, 'wingMount');
    fair.position.set(side * ch[3] * 0.78, ch[2] + ch[4] * 0.12, wz);
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
    haunch.position.set(s * hp[3] * 0.55, hp[2] + hp[4] * 0.15, hp[1] + 0.2);
    haunch.rotation.set(Math.PI / 2, 0, s * 0.45); root.add(haunch);
  }
  // gold rear cowl wrapping the thruster mounts → the tail grows from a real chassis
  const cowl = tag(new THREE.BoxGeometry(hp[3] * 1.5, hp[4] * 1.1, 0.55), M.gold, 'hipArmor');
  cowl.position.set(0, hp[2], hpBack[1] + 0.16); root.add(cowl);
  // twin thrusters set into the hip rear, flanking the tail base
  const thrusters = [];
  for (const s of [-1, 1]) {
    const t = thrusterPod(M); t.position.set(s * hp[3] * 0.5, hp[2] - 0.02, hpBack[1] + 0.36); root.add(t); thrusters.push(t);
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
    const et = lastTail, tipY = et[2] + 0.02;
    for (const s of [-1, 1]) {
      const big = tag(bladeGeo(1.05, 0.46, 0.1, 0.36), M.goldDark, 'tailBladeFin');   // forward pair (larger)
      big.position.set(s * 0.13, tipY, 4.15); big.rotation.set(rad(15), 0, s * rad(56)); big.scale.x = s; root.add(big);
      const small = tag(bladeGeo(0.62, 0.32, 0.08, 0.3), M.goldDark, 'tailBladeFin');  // tip pair (smaller)
      small.position.set(s * 0.1, tipY, 4.62); small.rotation.set(rad(10), 0, s * rad(44)); small.scale.x = s; root.add(small);
      const tl = chevron(M, 0.7); tl.position.set(s * 0.12, tipY, 4.3); root.add(tl);  // red accents on the cluster
    }
  }
  const spear = tag(new THREE.ConeGeometry(lastTail[3] * 1.3, 0.7, 6), M.gold, 'tailSpear');
  spear.rotation.x = Math.PI / 2; spear.position.set(0, lastTail[2], lastTail[1] + 0.42); root.add(spear);
  const tailTipZ = lastTail[1] + 0.7;

  // dorsal back-ridge vents following the curve (chest + hip crowns)
  for (const [, z, cy, , hh] of [ch, hp]) { const v = ventTriple(M, 1.1); v.position.set(0, cy + hh + 0.04, z); root.add(v); }

  root.updateMatrixWorld(true);
  root.userData.anim = {
    wings, thrusters, tailSegs,
    glowMats: [M.red, M.thruster, M.eye],
    materials: M, tailTipZ,
  };
  return { group: root, materials: M };
}

export default buildSVJDragon;
