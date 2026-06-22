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
    thruster: M('#240d04', { e: '#ff6a18', ei: 2.7 }),
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

// ── MODULE: SVJ wedge head (sports-car nose fused to a dragon skull) ──────────
function headWedge(M) {
  const g = new THREE.Group();
  // low angular wedge: nose tip at -Z, wide low rear at +Z
  const v = [[0, 0.0, -0.9], [-0.42, -0.13, 0.1], [0.42, -0.13, 0.1], [0.4, 0.2, 0.1], [-0.4, 0.2, 0.1]];
  const pos = [], idx = []; v.forEach((p) => pos.push(...p));
  idx.push(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 4, 3, 1, 3, 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(tag(geo, M.gold, 'headShell'));
  // black recessed eye sockets + glowing cyan eyes
  for (const s of [-1, 1]) {
    const socket = tag(new THREE.BoxGeometry(0.16, 0.1, 0.16), M.carbon, 'eyeSocket');
    socket.position.set(s * 0.26, 0.05, -0.18); socket.rotation.y = s * 0.3; g.add(socket);
    const eye = tag(new THREE.BoxGeometry(0.09, 0.05, 0.09), M.eye, 'eye');
    eye.position.set(s * 0.27, 0.06, -0.22); eye.rotation.y = s * 0.3; g.add(eye);
    // backward-swept horn fin
    g.add(strut(V(s * 0.32, 0.18, 0.05), V(s * 0.5, 0.5, 0.7), 0.05, 0.16, M.goldDark, 'hornFin'));
    // diagonal brow vent
    const brow = tag(new THREE.BoxGeometry(0.22, 0.04, 0.04), M.carbon, 'browVent');
    brow.position.set(s * 0.2, 0.21, -0.18); brow.rotation.set(0, 0, s * 0.5); g.add(brow);
  }
  // lower jaw blade panels
  const jaw = tag(new THREE.BoxGeometry(0.5, 0.08, 0.5), M.goldDark, 'jawBlade');
  jaw.position.set(0, -0.16, -0.1); jaw.rotation.x = 0.12; g.add(jaw);
  g.userData.sockets = { neck_socket: V(0, 0.03, 0.1) };
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
  const convex = 0.05 * L * Math.sin((s - segA) / (1 - segA) * Math.PI);          // very subtle convex
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
  root.rotation.z = -side * rad(20);                                             // outward lean → tall rear V
  const mir = new THREE.Group(); mir.scale.x = side; root.add(mir);              // mirror geometry for the left

  // ── thick faceted root PYLON (the bulkiest zone), leaning back ──────────────
  // root chord runs front-to-back ~80% of the torso (≈1.6u) so the wing INTEGRATES
  // into the back along most of the spine, then tapers fast up into the blades.
  const ROOT_CHORD = 1.6;
  const pylon = wedgeBlock(0.5, ROOT_CHORD, 0.34, 0.5, 0.62, M.gold, 'wingMount');
  pylon.rotation.x = rad(-12); mir.add(pylon);
  const pylonEdge = wedgeBlock(0.18, ROOT_CHORD * 0.92, 0.14, 0.46, 0.6, M.goldDark, 'wingMount');
  pylonEdge.position.set(0.28, 0, 0); pylonEdge.rotation.x = rad(-12); mir.add(pylonEdge);
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
  // kinked needle. Chord biased aft so the wide base lies back along the spine.
  const prim = aeroBlade(2.7, ROOT_CHORD, 0.5, 0.06, 0.22, 0.10, 0.035, 0.22, rad(62), rad(48), M.gold, 'outerWingBlade');
  prim.position.set(0, 0, -0.45); outer.add(prim);
  // dark recessed inner face panel hugging the blade (thin, inboard)
  const primInner = aeroBlade(2.4, ROOT_CHORD * 0.7, 0.34, 0.05, 0.05, 0.03, 0.02, 0.22, rad(62), rad(48), M.carbon, 'wingInnerStruct');
  primInner.position.set(-0.11, 0.02, -0.43); outer.add(primInner);
  // SECONDARY blade — clearly smaller (≈62% len / 60% chord), tucked below+inboard
  const sec = aeroBlade(1.7, ROOT_CHORD * 0.6, 0.3, 0.05, 0.14, 0.07, 0.03, 0.24, rad(57), rad(45), M.gold, 'secondaryBlade');
  sec.position.set(-0.14, -0.16, -0.1); outer.add(sec);

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
export function buildSVJDragon(knobs = {}) {
  const M = svjMaterials();
  const root = new THREE.Group(); root.name = 'SVJMechaDragon';
  const torso = engineBay(M); root.add(torso);
  const S = torso.userData.sockets;
  const spineSeams = []; const tailSegs = [];

  // neck: 3 segments forward (-Z) + wedge head
  let z = S.front_neck_socket.z, r = 0.3;
  for (let i = 0; i < 3; i++) {
    const len = 0.4; const seg = spineSegment(len, r, 0.96, M);
    z -= len / 2; seg.position.set(0, 0.06, z); z -= len / 2; r *= 0.95;
    root.add(seg); spineSeams.push(seg);
  }
  const head = headWedge(M); head.position.set(0, 0.08, z - 0.1); root.add(head);

  // body: 4 spine segments behind torso (+Z)
  z = S.rear_spine_socket.z; r = 0.34;
  for (let i = 0; i < 4; i++) {
    const len = 0.48; const seg = spineSegment(len, r, 0.97, M, { vent: i % 2 === 0 });
    z += len / 2; seg.position.set(0, 0.05, z); z += len / 2; r *= 0.97;
    root.add(seg); spineSeams.push(seg);
  }
  // tail: 7 segments tapering gradually (base stays muscular)
  for (let i = 0; i < 7; i++) {
    const len = 0.5 * Math.pow(0.95, i); const taper = 0.92;
    const seg = spineSegment(len, r, taper, M, { vent: i < 2 });
    z += len / 2; seg.position.set(0, 0.02 - i * 0.012, z);
    const base = z; z += len / 2; r *= (i < 2 ? 0.96 : 0.86);                    // keep base muscular, taper later
    root.add(seg); spineSeams.push(seg); tailSegs.push(seg);
    // tail blade fins (aero stabilisers) on the last 3 segments
    if (i >= 4) for (const s of [-1, 1]) {
      const fin = tag(bladeGeo(0.6 + (6 - i) * 0.1, 0.4, 0.12, 0.3), M.goldDark, 'tailBladeFin');
      fin.position.set(s * r * 1.1, 0.05, base); fin.rotation.set(rad(20), 0, s * rad(60)); fin.scale.x = s;
      root.add(fin);
      const tl = chevron(M, 0.7); tl.position.set(s * r * 1.3, 0.05, base + len * 0.3); root.add(tl);
    }
  }
  // tail spear tip
  const spear = tag(new THREE.ConeGeometry(r * 1.1, 0.7, 6), M.gold, 'tailSpear');
  spear.rotation.x = Math.PI / 2; spear.position.set(0, 0.0, z + 0.3); root.add(spear);
  const tailTipZ = z + 0.6;

  // twin thruster pods at the rear torso, flanking the tail base
  const thrusters = [];
  for (const sock of ['rear_thruster_socket_left', 'rear_thruster_socket_right']) {
    const t = thrusterPod(M); t.position.copy(S[sock]); root.add(t); thrusters.push(t);
  }
  // rear diffuser fin array
  const diff = diffuser(M); diff.position.copy(S.bottom_diffuser_socket); root.add(diff);
  // tucked mecha legs
  for (const [sock, side] of [['left_leg_socket', -1], ['right_leg_socket', 1]]) {
    const leg = clawLeg(side, M); leg.position.copy(S[sock]); root.add(leg);
  }
  // mirrored wing systems
  const wings = [];
  for (const [sock, side] of [['left_wing_shoulder_socket', -1], ['right_wing_shoulder_socket', 1]]) {
    const w = wingSystem(side, M); w.position.copy(S[sock]); w.userData.side = side;
    root.add(w); wings.push(w);
  }
  // top-spine vent accents along the back
  for (const sz of [-0.6, 1.3, 1.9]) { const v = ventTriple(M, 1.0); v.position.set(0, 0.5, sz); root.add(v); }

  root.updateMatrixWorld(true);
  root.userData.anim = {
    wings, thrusters, tailSegs,
    glowMats: [M.red, M.thruster, M.eye],
    materials: M, tailTipZ,
  };
  return { group: root, materials: M };
}

export default buildSVJDragon;
