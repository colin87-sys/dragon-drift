import * as THREE from 'three';

// ANGEL WING — a single standalone wing built from the ASHTALON wing lessons
// (LEAPFROG L137), re-voiced from hunter to angel.
//
// OWNER DIRECTIVE (r-fix): "it needs an ARM, not just a hand — lift the fan up
// onto a raised, bent limb and fill the arm below with the smaller feathers."
// The skeleton is a LIMB, not a point: a leading-edge bone RISES from the
// shoulder (~71° steep), BENDS at a raised wrist (obtuse ~129°), and a short
// hand segment sweeps up-and-out — the graduated primary fan roots along THAT
// raised hand, not at the base. The graduation flows down the limb:
//   small coverts on the arm → medium secondaries packing the crook of the
//   bend → long round-tipped primaries fanning up-and-out from the top.
//
// The transplanted laws (+ five rounds of gate directives):
//   1. Feather roots MARCH along the limb (never one origin point).
//   2. Exactly 3 primaries + 2 secondaries — hierarchy, not a radial fan.
//   3. CURVED SPINES with ROUNDED tips: each flight feather is an arced
//      centerline + width profile, tip capped with a smooth quadratic dome.
//   4. Coverts SHINGLE with a size gradient that grows TOWARD the wrist,
//      per-petal wobble, dome tips drawing the scalloped boundary.
//   5. One unbroken leading edge: shoulder → rising bone → wrist hook → hand →
//      hero primary. No bare plate; the covert rows tile the arm completely.
//   6. Ivory value tiers, one family — tips brightest, base a near-ivory step.
//
// Canonical frame: wing in the XY plane facing +Z, shoulder at the origin,
// sweeping up-and-right (+X out, +Y up). Mirror with scale.x = -1 for a left wing.

const hash = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1;   // deterministic wobble

// Flight feather around a CURVED spine: quadratic centerline (0,0) → tip, with
// the control point pulled toward the wing body so the distal third bows out.
// Width profile: slim quill at the root, full belly near mid, closing into a
// ROUNDED tip (quadratic cap through a small apex overshoot — owner directive).
function curvedFeatherShape(len, w, bow) {
  const P0 = { x: 0, y: 0 }, P1 = { x: -bow, y: len * 0.55 }, P2 = { x: bow * 0.95, y: len };
  const q = (t) => ({
    x: (1 - t) * (1 - t) * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x,
    y: (1 - t) * (1 - t) * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y,
  });
  const dq = (t) => ({
    x: 2 * (1 - t) * (P1.x - P0.x) + 2 * t * (P2.x - P1.x),
    y: 2 * (1 - t) * (P1.y - P0.y) + 2 * t * (P2.y - P1.y),
  });
  // Belly peaks ~40% out; sin argument clamped to [0,π] (negative sin under
  // pow() is NaN — the r3 chisel-tip bug).
  const wt = (t) => {
    const a = Math.PI * Math.min(1, 0.08 + t * 0.92);
    return w * (0.30 + 0.40 * Math.pow(Math.max(0, Math.sin(a)), 0.9)) * (1 - t * 0.45) + 0.008;
  };
  const N = 16, right = [], left = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = q(t), d = dq(t), L = Math.hypot(d.x, d.y) || 1;
    const nx = d.y / L, ny = -d.x / L;
    // Ease the width down toward the tip but HOLD a small cap width (a hard
    // zero made a needle; the dome cap below rounds it off).
    const ww = t > 0.86 ? wt(0.86) * (1 - ((t - 0.86) / 0.14) * 0.25) : wt(t);
    right.push({ x: p.x + nx * ww * 0.8, y: p.y + ny * ww * 0.8 });   // leading side, tighter
    left.push({ x: p.x - nx * ww * 1.2, y: p.y - ny * ww * 1.2 });    // trailing side, fuller
  }
  // ROUNDED tip: a quadratic dome through an apex slightly past the spine end.
  const tip = q(1), dt1 = dq(1), L1 = Math.hypot(dt1.x, dt1.y) || 1;
  const apex = { x: tip.x + (dt1.x / L1) * w * 0.18, y: tip.y + (dt1.y / L1) * w * 0.18 };
  const s = new THREE.Shape();
  s.moveTo(right[0].x, right[0].y);
  for (let i = 1; i <= N; i++) s.lineTo(right[i].x, right[i].y);
  s.quadraticCurveTo(apex.x, apex.y, left[N].x, left[N].y);
  for (let i = N - 1; i >= 0; i--) s.lineTo(left[i].x, left[i].y);
  s.closePath();
  return s;
}

// A SCALLOP STRIP in local (u, v): a long lens whose TOP edge is one smooth
// arch (tucks under the band above) and whose BOTTOM edge is a chain of wavy
// scallop lobes (wider than tall — the reference's drawn arcs). Both ends
// taper to points, so a strip can never poke a pill or disc into the contour.
// Round-10 lesson: discrete petal meshes ALWAYS read as beads; the reference
// draws the covert region as a solid mass with scalloped EDGE LINES, so that
// is literally what we build. d0→d1 = lobe depth crook end → shoulder end.
function scallopStrip(L, h, lobes, d0, d1, seed = 0) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(L * 0.5, h, L, 0);                 // smooth arched top
  const step = L / lobes;
  for (let k = 0; k < lobes; k++) {                     // wavy scalloped bottom
    const u1 = L - k * step, u0 = u1 - step;
    const t = 1 - (k + 0.5) / lobes;
    const d = (d1 + (d0 - d1) * t) * (1 + hash(seed + k) * 0.16 - 0.08);
    s.quadraticCurveTo((u0 + u1) / 2, -d, u0, -d * 0.1);
  }
  s.closePath();
  return s;
}

export function buildAngelWing({ quality = 1 } = {}) {
  const lowQ = quality < 0.75;
  const group = new THREE.Group();
  const FEX = { depth: 0.05, bevelEnabled: !lowQ, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, steps: 1, curveSegments: lowQ ? 8 : 18 };
  const PEX = { depth: 0.03, bevelEnabled: false, steps: 1, curveSegments: lowQ ? 8 : 14 };

  // Ivory value tiers — one family; tips brightest, base a near-ivory step.
  const mat = (hex, rough = 0.66) => new THREE.MeshStandardMaterial({
    color: hex, roughness: rough, metalness: 0.0, flatShading: false, side: THREE.DoubleSide,
  });
  const priMat = mat(0xf9f6ee);        // primaries — brightest
  const priMatB = mat(0xede7d8);       // alternate finger tone (edge definition)
  const secMat = mat(0xf1ecdf);        // secondaries
  const gcMat = mat(0xf4efe4, 0.68);   // greater coverts
  const lcMat = mat(0xf0eadd, 0.68);   // lesser coverts
  const mgMat = mat(0xebe4d5, 0.7);    // marginal coverts (innermost, warmest)
  const armMat = mat(0xf1ecdf, 0.7);   // the slim limb — same tone as the wing edge

  const addFeather = (matRef, len, w, bow, root, angle, z) => {
    const pivot = new THREE.Object3D();
    pivot.position.set(root.x, root.y, z);
    pivot.rotation.z = angle;          // 0 = straight up; negative leans right/outward
    group.add(pivot);
    pivot.add(new THREE.Mesh(new THREE.ExtrudeGeometry(curvedFeatherShape(len, w, bow), FEX), matRef));
    return pivot;
  };
  // ---- THE SPINE (owner r-fix 2) lives in the FEATHER LAYOUT, not a bone
  // mesh: segment 1 (shoulder→wrist ~(0.45,3.45)) is the near-vertical covert
  // column; segment 2 (wrist→hand tip ~(2.8,4.3)) is the primary root line.
  // The old bone mesh kept reading as a naked rod and was deleted (round-15).

  // ---- PRIMARIES — the graduated fan, UNCHANGED in character, roots marching
  // along SEGMENT 2 (the hand): hero at the tip, stepping back to the wrist.
  const PRIM = [
    { root: { x: 2.78, y: 4.24 }, angle: -1.02, len: 4.5, w: 0.95, bow: 0.52 },   // outermost finger
    { root: { x: 2.28, y: 4.06 }, angle: -1.16, len: 5.2, w: 1.00, bow: 0.50 },   // THE PEAK — slightly inboard
    { root: { x: 1.78, y: 3.88 }, angle: -1.30, len: 4.7, w: 0.95, bow: 0.45 },
    { root: { x: 1.30, y: 3.70 }, angle: -1.42, len: 4.0, w: 0.90, bow: 0.40 },
    { root: { x: 0.90, y: 3.52 }, angle: -1.52, len: 3.3, w: 0.85, bow: 0.35 },
  ];
  PRIM.forEach((p, i) => {
    const f = addFeather(i % 2 ? priMatB : priMat, p.len, p.w, p.bow, p.root, p.angle, 0.02 + i * 0.07);
    f.children[0].rotation.x = (i % 2 ? -1 : 1) * 0.05;   // alternate rake: lighting separates the overlaps
  });

  // ---- SECONDARIES — the medium broad-blade pair PACKED AT THE WRIST/CROOK.
  const SEC = [
    { root: { x: 0.82, y: 3.02 }, angle: -1.55, len: 2.35, w: 1.15, bow: 0.30 },
    { root: { x: 0.62, y: 2.66 }, angle: -1.57, len: 2.05, w: 1.20, bow: 0.24 },
  ];
  SEC.forEach((p, i) => addFeather(secMat, p.len, p.w, p.bow, p.root, p.angle, 0.22 + i * 0.06));

  // ---- COVERT REGION — scallop-edged strips along SEGMENT 1 (the near-vertical
  // arm): small at the shoulder, growing toward the crook, band faces toward the
  // camera so the rows read from the front.
  const S0 = { x: 0.08, y: 0.02 }, C0 = { x: 0.48, y: 3.42 };
  const bx = C0.x - S0.x, by = C0.y - S0.y, bl = Math.hypot(bx, by);
  const dirA = Math.atan2(by, bx);                      // segment-1 direction (from +X)
  const px = by / bl, py = -bx / bl;                    // perp, pointing out (right)

  // Under-plumage lens: ivory backing so chinks show ivory, never slate.
  const underShape = (() => {
    const u = new THREE.Shape();
    const mx = S0.x + bx * 0.5, my = S0.y + by * 0.5;
    u.moveTo(S0.x, S0.y);
    u.quadraticCurveTo(mx - px * 0.25, my - py * 0.25, C0.x, C0.y);
    u.quadraticCurveTo(mx + px * 1.05, my + py * 1.05, S0.x, S0.y);
    u.closePath();
    return u;
  })();
  const under = new THREE.Mesh(new THREE.ExtrudeGeometry(underShape, { ...PEX, depth: 0.05 }), lcMat);
  under.position.z = 0.40;
  group.add(under);

  const addStrip = (matRef, off, u0, u1, h, lobes, d0, d1, z, seed) => {
    const L = bl * (u1 - u0);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(scallopStrip(L, h, lobes, d0, d1, seed), PEX), matRef);
    // CONVERGED roots: each strip starts ON the bone and fans outward so its
    // crook end reaches `off` — shoulder ends meet in one tuft, never a fray.
    m.rotation.z = dirA - Math.atan2(off, L);   // local +v = MINUS perp
    m.position.set(S0.x + bx * u0, S0.y + by * u0, z);
    group.add(m);
    return m;
  };
  addStrip(gcMat, 0.95, 0.14, 1.08, 0.44, 8, 0.22, 0.14, 0.455, 3);   // greater — widest, over the quills
  addStrip(lcMat, 0.62, 0.10, 1.05, 0.40, 9, 0.18, 0.11, 0.48, 11);
  addStrip(mgMat, 0.34, 0.07, 1.02, 0.36, 9, 0.14, 0.09, 0.505, 23);
  addStrip(lcMat, 0.08, 0.05, 0.99, 0.30, 10, 0.11, 0.07, 0.53, 31);  // hugging the leading edge (never past it)

  // Hand coverts: a scalloped row along the primary root line (segment 2),
  // burying the quill bases — a feather, not a bone.
  {
    const a = { x: 0.52, y: 3.42 }, b = { x: 2.86, y: 4.34 };
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(scallopStrip(l, 0.24, 6, 0.15, 0.11, 47), PEX), gcMat);
    m.rotation.z = Math.atan2(dy, dx);
    m.position.set(a.x, a.y, 0.44);
    group.add(m);
  }

  return { group };
}
