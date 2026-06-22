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
    left_wing_shoulder_socket: V(-0.7, 0.28, -0.15), right_wing_shoulder_socket: V(0.7, 0.28, -0.15),
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
// NOT a membrane. A thick armored shoulder/back mount carrying a stacked stack of
// swept-back gold blade panels (primary longest → secondary → tertiary), over a
// dark gunmetal inner structure with recessed red energy channels. Folded/raised:
// the blades rise up-and-back over the spine in a tall, narrow, knife silhouette.
// Built for the RIGHT side; mirror with scale.x = side.
function wingSystem(M) {
  const root = new THREE.Group();

  // ── thick, load-bearing shoulder/back mount (sits high on the dorsal line) ──
  const mount = new THREE.Group(); root.add(mount);
  const scap = tag(new THREE.BoxGeometry(0.66, 0.56, 0.92), M.gold, 'wingMount');
  scap.position.set(0.08, 0.06, 0.08); scap.rotation.z = 0.18; mount.add(scap);
  const scapEdge = tag(new THREE.BoxGeometry(0.22, 0.5, 0.86), M.goldDark, 'wingMount');
  scapEdge.position.set(0.34, 0.05, 0.08); scapEdge.rotation.z = 0.18; mount.add(scapEdge);
  const hingeJ = tag(new THREE.CylinderGeometry(0.26, 0.26, 0.62, 14), M.steel, 'shoulderHinge');
  hingeJ.rotation.z = Math.PI / 2; hingeJ.position.set(0.16, 0.2, 0.05); mount.add(hingeJ);
  for (const s of [-1, 1]) {                                                     // bolt end-caps
    const cap = tag(new THREE.CylinderGeometry(0.28, 0.28, 0.07, 12), M.carbon, 'hingeCap');
    cap.rotation.z = Math.PI / 2; cap.position.set(0.16 + s * 0.32, 0.2, 0.05); mount.add(cap);
  }
  const jcore = tag(new THREE.CylinderGeometry(0.12, 0.12, 0.64, 10), M.red, 'jointCore');  // glowing pivot core
  jcore.rotation.z = Math.PI / 2; jcore.position.set(0.16, 0.2, 0.05); mount.add(jcore);
  const brace = tag(new THREE.BoxGeometry(0.46, 0.28, 0.26), M.steel, 'rootBrace');
  brace.position.set(-0.05, -0.02, 0.42); mount.add(brace);

  // ── the rotatable blade assembly, posed raised + swept back ─────────────────
  const hinge = new THREE.Group(); hinge.position.set(0.18, 0.22, 0.05); root.add(hinge);
  const pose = new THREE.Group(); hinge.add(pose);
  pose.quaternion.setFromUnitVectors(V(1, 0, 0), V(0.34, 0.78, 0.52).normalize());  // length axis → up-and-back
  pose.rotateX(rad(8));                                                          // roll so blade faces read outward

  // dark inner mechanical shell the gold blades mount onto (slightly larger/behind)
  pose.add(tag(bladeGeo2(2.4, 0.6, 0.12, 0.22, 0.2), M.carbon, 'wingInnerStruct'));
  // structural struts / braces under the armor
  for (const z of [0.04, 0.28]) pose.add(strut(V(0.1, 0, z), V(1.5, 0.02, z + 0.08), 0.05, 0.18, M.steel, 'wingStrut'));
  // THE SIGNATURE: a bright red honeycomb energy lattice recessed at the wing root
  const lattice = hexGrille(0.6, 0.5, M, 'energyChannel', M.red, 3, 4);
  lattice.position.set(0.42, 0.06, 0.16); lattice.rotation.set(rad(8), 0, rad(70)); pose.add(lattice);

  // stacked, fanned blade panels — primary longest on top, splaying down-and-back
  const outer = new THREE.Group(); pose.add(outer);
  const fan = [
    { len: 2.7, w: 0.46, tip: 0.04, sw: 0.30, th: 0.14, off: [0, 0, 0], rot: 0, mat: M.gold, role: 'outerWingBlade' },
    { len: 2.25, w: 0.40, tip: 0.04, sw: 0.27, th: 0.12, off: [0.03, -0.10, 0.16], rot: -8, mat: M.gold, role: 'secondaryBlade' },
    { len: 1.85, w: 0.33, tip: 0.03, sw: 0.24, th: 0.10, off: [0.06, -0.20, 0.32], rot: -16, mat: M.gold, role: 'secondaryBlade' },
    { len: 1.45, w: 0.27, tip: 0.03, sw: 0.21, th: 0.08, off: [0.09, -0.30, 0.5], rot: -24, mat: M.goldDark, role: 'tertiaryBlade' },
  ];
  for (const b of fan) {
    const blade = tag(bladeGeo2(b.len, b.w, b.tip, b.sw, b.th), b.mat, b.role);
    blade.position.set(...b.off); blade.rotation.z = rad(b.rot);                 // splay into a fan
    outer.add(blade);
  }
  // red glow channels recessed BETWEEN the fanned panels (inset, structured lines)
  for (let i = 0; i < 5; i++) { const c = tag(new THREE.BoxGeometry(0.05, 0.045, 0.55), M.red, 'energyChannel'); c.position.set(0.4 + i * 0.45, -0.06, 0.18); c.rotation.z = rad(-i * 4); outer.add(c); }

  root.userData.hinge = hinge; root.userData.pose = pose; root.userData.outer = outer;
  return root;
}
// faceted hard-surface blade: a beveled knife panel with a top ridge — thick at
// the base, tapering to a fine point. Length along +X, chord +Z, ridge in +Y.
function bladeGeo2(length, rootChord, tipChord, sweep, thick) {
  const N = 8, pos = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, ease = Math.pow(s, 0.85);
    const x = length * s, c = lerp(rootChord, tipChord, ease);
    const lead = -Math.sin(s * Math.PI * 0.5) * sweep;                          // convex leading sweep
    const t = thick * (1 - ease * 0.85) * (0.45 + 0.55 * Math.sin(s * Math.PI)); // fat base, knife tip
    pos.push(x, 0, lead);                          // 0 leading
    pos.push(x, t, lead + c * 0.42);               // 1 top ridge
    pos.push(x, 0, lead + c);                      // 2 trailing
    pos.push(x, -t * 0.55, lead + c * 0.42);       // 3 bottom ridge
  }
  for (let i = 0; i < N; i++) { const a = i * 4, b = a + 4; for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; idx.push(a + k, b + k, b + k2, a + k, b + k2, a + k2); } }
  idx.push(0, 2, 1, 0, 3, 2);                                                    // base cap
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
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
    const w = wingSystem(M); w.position.copy(S[sock]); w.scale.x = side; w.userData.side = side;
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
