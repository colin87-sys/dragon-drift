import * as THREE from 'three';

// ANGEL WING — a single standalone wing built from the ASHTALON wing lessons
// (LEAPFROG L137), re-voiced from hunter to angel. Reference: a classic upswept
// tattoo-style wing — THREE dominant long primaries whose distal thirds BOW
// outward (sickle grace, not straight spindles), TWO near-horizontal secondaries
// beneath them, shingled SCALLOPED covert rows filling the base, all launched
// from a slim S-curved arm whose crest carries a small wrist hook that flows
// straight into the hero primary's leading edge.
//
// The transplanted laws (+ round-1/2 gate directives):
//   1. Feather roots MARCH along the arm (never one origin point).
//   2. Exactly 3 primaries + 2 secondaries — hierarchy, not a radial fan.
//   3. CURVED SPINES: each flight feather is built around an arced centerline
//      (sampled quadratic + width profile), so the tip region sits clearly
//      outside the root→tip chord — the reference's outward bow. No ribs, no
//      seams (straight rachis boxes kept reading as hairline artifacts).
//   4. Coverts SHINGLE with a size gradient — smallest at the wrist, largest at
//      the bottom row — with soft bevels and per-petal wobble so they read as
//      feathers, not cobblestones; their dome tips draw the scalloped boundary.
//   5. One unbroken S-line: arm leading edge → wrist hook → hero primary edge.
//   6. Ivory value tiers: tips brightest, base rows warmest.
//
// Canonical frame: wing in the XY plane facing +Z, shoulder root at the origin,
// sweeping up-and-right (+X out, +Y up). Mirror with scale.x = -1 for a left wing.

const hash = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1;   // deterministic wobble

// Flight feather around a CURVED spine: quadratic centerline (0,0) → tip, with
// the control point pulled toward the wing body so the distal third bows out.
// Width profile: slim quill at the root, full belly near mid, tapering to a
// rounded point; the trailing side runs fuller than the leading side.
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
  // Belly peaks ~40% out, root stays a readable quill, tip closes to a POINT
  // (sin argument clamped to [0,π] — a negative sin under pow() is NaN, which
  // shredded the r3 tips into flat chisels).
  const wt = (t) => {
    const a = Math.PI * Math.min(1, 0.08 + t * 0.92);
    return w * (0.16 + 0.46 * Math.pow(Math.max(0, Math.sin(a)), 1.15)) * (1 - t * 0.78) + 0.008;
  };
  const N = 16, right = [], left = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = q(t), d = dq(t), L = Math.hypot(d.x, d.y) || 1;
    const nx = d.y / L, ny = -d.x / L;
    // Ramp width to EXACTLY zero over the last 10% — with a bowed spine the
    // fuller trailing offset otherwise crosses the leading side at the sharp
    // tip and the triangulator chops it (the r3/r4 chisel-tip artifact).
    const ww = wt(t) * (t > 0.9 ? (1 - t) / 0.1 : 1);
    right.push({ x: p.x + nx * ww * 0.8, y: p.y + ny * ww * 0.8 });   // leading side, tighter
    left.push({ x: p.x - nx * ww * 1.2, y: p.y - ny * ww * 1.2 });    // trailing side, fuller
  }
  const tip = q(1);
  const s = new THREE.Shape();
  s.moveTo(right[0].x, right[0].y);
  for (let i = 1; i <= N; i++) s.lineTo(right[i].x, right[i].y);
  s.lineTo(tip.x, tip.y);                                             // converge to a true point
  for (let i = N; i >= 0; i--) s.lineTo(left[i].x, left[i].y);
  s.closePath();
  return s;
}

// Covert scallop: a blunt petal — round dome tip, symmetric.
function petalShape(len, w) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(w * 0.56, len * 0.28, w * 0.40, len * 0.74);
  s.quadraticCurveTo(w * 0.20, len * 1.04, 0, len);
  s.quadraticCurveTo(-w * 0.20, len * 1.04, -w * 0.40, len * 0.74);
  s.quadraticCurveTo(-w * 0.56, len * 0.28, 0, 0);
  return s;
}

export function buildAngelWing({ quality = 1 } = {}) {
  const lowQ = quality < 0.75;
  const group = new THREE.Group();
  const FEX = { depth: 0.05, bevelEnabled: !lowQ, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, steps: 1, curveSegments: lowQ ? 8 : 18 };
  const PEX = { depth: 0.03, bevelEnabled: false, steps: 1, curveSegments: lowQ ? 8 : 14 };

  // Ivory value tiers — tips brightest, base warm-shadowed (depth gradient).
  const mat = (hex, rough = 0.66) => new THREE.MeshStandardMaterial({
    color: hex, roughness: rough, metalness: 0.0, flatShading: false, side: THREE.DoubleSide,
  });
  const priMat = mat(0xf8f5ec);        // primaries — brightest
  const secMat = mat(0xf1ecdf);        // secondaries
  const gcMat = mat(0xf4efe4, 0.68);   // greater coverts — near-primary ivory
  const lcMat = mat(0xf0eadd, 0.68);   // lesser coverts — a touch warmer only
  const mgMat = mat(0xebe4d5, 0.7);    // marginal coverts (innermost, warmest)
  const armMat = mat(0xe8e1d2, 0.72);  // the slim arm band (fully buried)

  const addFeather = (matRef, len, w, bow, root, angle, z) => {
    const pivot = new THREE.Object3D();
    pivot.position.set(root.x, root.y, z);
    pivot.rotation.z = angle;          // 0 = straight up; negative leans right/outward
    group.add(pivot);
    pivot.add(new THREE.Mesh(new THREE.ExtrudeGeometry(curvedFeatherShape(len, w, bow), FEX), matRef));
    return pivot;
  };
  const addPetal = (matRef, len, w, root, angle, z) => {
    const pivot = new THREE.Object3D();
    pivot.position.set(root.x, root.y, z);
    pivot.rotation.z = angle;
    group.add(pivot);
    pivot.add(new THREE.Mesh(new THREE.ExtrudeGeometry(petalShape(len, w), PEX), matRef));
    return pivot;
  };

  // ---- THE ARM — a SLIM limb band root→wrist. Its LEFT edge is the wing's
  // leading-edge S-curve; the alula hook sits at the crest, and the hero primary
  // roots AT the hook notch so its leading edge CONTINUES the same silhouette
  // line (no background between hook and primary — round-2 directive 2).
  const armShape = (() => {
    const a = new THREE.Shape();
    a.moveTo(0.0, -0.30);
    a.quadraticCurveTo(-0.26, 0.85, 0.0, 1.95);      // leading edge: shallow concave rise (slim band)
    a.quadraticCurveTo(0.20, 2.60, 0.66, 3.06);      // convex crest to the wrist
    a.lineTo(0.62, 3.24);                            // the alula hook (small, ON the edge)
    a.lineTo(0.90, 3.18);                            // ...notch back down to the hero root
    a.quadraticCurveTo(1.18, 2.98, 1.16, 2.52);      // wrist head (slim)
    a.quadraticCurveTo(0.80, 1.40, 0.42, 0.45);      // inner edge home (slim taper)
    a.quadraticCurveTo(0.18, -0.08, 0.0, -0.30);
    return a;
  })();
  const arm = new THREE.Mesh(new THREE.ExtrudeGeometry(armShape, { ...PEX, depth: 0.14 }), armMat);
  arm.position.z = 0.46;
  group.add(arm);

  // ---- PRIMARIES — exactly THREE, curved spines. The hero roots at the hook
  // notch, angled so its leading edge continues the arm crest (the unbroken S);
  // each next one shorter, more horizontal, less bowed. Deepest z.
  const PRIM = [
    { root: { x: 0.80, y: 3.06 }, angle: -0.58, len: 5.2, w: 1.00, bow: 0.50 },
    { root: { x: 0.84, y: 2.32 }, angle: -0.84, len: 4.4, w: 0.95, bow: 0.45 },
    { root: { x: 0.74, y: 1.62 }, angle: -1.06, len: 3.6, w: 0.90, bow: 0.42 },
  ];
  PRIM.forEach((p, i) => addFeather(priMat, p.len, p.w, p.bow, p.root, p.angle, 0.02 + i * 0.09));

  // ---- SECONDARIES — exactly TWO, conspicuously shorter (~40% of the hero),
  // near-horizontal, gentle bow, tips above their roots.
  const SEC = [
    { root: { x: 0.60, y: 0.95 }, angle: -1.24, len: 2.35, w: 0.92, bow: 0.18 },
    { root: { x: 0.44, y: 0.35 }, angle: -1.38, len: 2.05, w: 0.95, bow: 0.12 },
  ];
  SEC.forEach((p, i) => addFeather(secMat, p.len, p.w, p.bow, p.root, p.angle, 0.30 + i * 0.08));

  // ---- COVERT ROWS — three shingled rows marching the flight-feather root
  // diagonal. SIZE GRADIENT: smallest at the wrist (top), largest at the bottom
  // of each row, and rows grow outward (marginal < lesser < greater). Per-petal
  // wobble breaks the cobblestone read; dome tips draw the scalloped boundary.
  // Row tops start BELOW the wrist crest so the hook region stays clean edge.
  const lerp = (a, b, t) => a + (b - a) * t;
  const row = (matRef, n, p0, p1, a0, a1, len0, len1, w, z0, seed) => {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const wob = 1 + hash(seed + i) * 0.14 - 0.07;
      addPetal(matRef, lerp(len0, len1, t) * wob, w * (1 + hash(seed + i + 40) * 0.1 - 0.05),
        { x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) },
        -(lerp(a0, a1, t) + hash(seed + i + 80) * 0.08 - 0.04), z0 + i * 0.018);
    }
  };
  // Greater coverts: 7 petals over the quill bases — small at top, LARGE at
  // bottom, the last reaching past the arm's lower tip (buries it).
  row(gcMat, 8, { x: 1.00, y: 2.60 }, { x: 0.42, y: -0.16 }, 0.62, 1.36, 1.05, 1.55, 0.72, 0.56, 3);
  // Lesser coverts: 6 petals, tucked closer to the arm.
  row(lcMat, 7, { x: 0.62, y: 2.30 }, { x: 0.26, y: -0.10 }, 0.55, 1.30, 0.72, 1.15, 0.66, 0.64, 11);
  // Marginal coverts: 5 small petals burying the arm's inner edge down to the root.
  row(mgMat, 6, { x: 0.22, y: 1.95 }, { x: 0.10, y: -0.14 }, 0.48, 1.24, 0.52, 0.85, 0.60, 0.72, 23);

  return { group };
}
