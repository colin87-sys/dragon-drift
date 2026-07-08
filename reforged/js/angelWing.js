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
// `sharpen` (0..1) morphs the rounded frond toward a straight blade tapering to a SHARP point:
// it drives the width harder to zero over the distal fifth and collapses the rounded dome cap
// toward the spine tip. 0 = the winglab hero's rounded frond (unchanged); high = a seraph
// feather-blade (boss design B — Fable gate: "long straight lifted blades to sharp points").
function curvedFeatherShape(len, w, bow, N = 16, sharpen = 0) {
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
    return w * (0.30 + 0.40 * Math.pow(Math.max(0, Math.sin(a)), 0.9)) * (1 - t * 0.58) + 0.008;
  };
  const right = [], left = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = q(t), d = dq(t), L = Math.hypot(d.x, d.y) || 1;
    const nx = d.y / L, ny = -d.x / L;
    // Ease the width down toward the tip but HOLD a small cap width (a hard
    // zero made a needle; the dome cap below rounds it off).
    // sharpen extends the tip taper earlier (0.86→down to ~0.72) and drives it harder to zero.
    const tStart = 0.86 - 0.14 * sharpen, tSpan = 1 - tStart;
    const ww = t > tStart ? wt(tStart) * (1 - ((t - tStart) / tSpan) * (0.48 + 0.50 * sharpen)) : wt(t) * (1 - 0.16 * sharpen);
    right.push({ x: p.x + nx * ww * 0.8, y: p.y + ny * ww * 0.8 });   // leading side, tighter
    left.push({ x: p.x - nx * ww * 1.2, y: p.y - ny * ww * 1.2 });    // trailing side, fuller
  }
  // ROUNDED tip: a quadratic dome through an apex slightly past the spine end.
  const tip = q(1), dt1 = dq(1), L1 = Math.hypot(dt1.x, dt1.y) || 1;
  const apexOv = w * 0.18 * (1 - 0.85 * sharpen);   // sharpen collapses the rounded dome toward a point
  const apex = { x: tip.x + (dt1.x / L1) * apexOv, y: tip.y + (dt1.y / L1) * apexOv };
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

export function buildAngelWing({ quality = 1, material = null, blade = 0, shape = {} } = {}) {
  const lowQ = quality < 0.75;
  // `blade` (0..1) re-voices the FROND into a straight, lifted seraph feather-BLADE: straighter
  // spines (less bow), sharper points, slimmer. 0 = the owner's signed-off winglab hero, byte-
  // for-byte unchanged; the boss's design-B emblem passes a high value (Fable gate fix 3). The
  // wing GEOMETRY/skeleton is otherwise the merged wing — this only re-shapes the flight feathers.
  const bld = Math.max(0, Math.min(1, blade));
  const bowMul = 1 - 0.6 * bld;
  // `shape` (all knobs default to 1 / 0 → the wing UNCHANGED, byte-for-byte) lets the wing-shaper
  // tool re-proportion the wing: lengthen/widen/shorten parts, curve the feathers, and swing the
  // WRIST BEND. armLen = arm (shoulder→wrist) length; handLen = fan spread along the hand; bend =
  // degrees to swing the hand+fan about the wrist; primLen/primWidth/primBow/primSpread reshape
  // the primary fan; heroLen = extra length on the peak feather; secLen/secWidth = secondaries;
  // covert = covert-row puffiness.
  const S = { armLen: 1, armWidth: 1, armBow: 0, elbow: 0.5, rootWidth: 1, handLen: 1, bend: 0,
    primLen: 1, primWidth: 1, primBow: 1, primSpread: 1, heroLen: 1, secLen: 1, secWidth: 1, covert: 1, ...shape };
  const group = new THREE.Group();
  // curveSegments scale CONTINUOUSLY with quality (q1 = 18/14, unchanged for the winglab;
  // lower quality — e.g. the six-wing seraph packing 6 wings into one boss budget — steps
  // down smoothly instead of snapping to a single low tier).
  const csF = Math.max(4, Math.round(quality * 18)), csP = Math.max(4, Math.round(quality * 14));
  // Flight-feather outline sample count scales with quality too. The feather's tris are
  // dominated by its N line-segments per side (FIXED regardless of curveSegments), so at the
  // reduced quality the six-wing seraph packs into one boss budget this is the real lever:
  // q1 = 16 (winglab hero, unchanged); a boss instance halves it. 8 is still smooth at fight range.
  const nSamp = Math.max(8, Math.round(quality * 16));
  const FEX = { depth: 0.05, bevelEnabled: !lowQ, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, steps: 1, curveSegments: csF };
  const PEX = { depth: 0.03, bevelEnabled: false, steps: 1, curveSegments: csP };

  // Ivory value tiers — one family; tips brightest, base a near-ivory step. When a
  // `material` is supplied (the seraph passes a tracked NEAR-BLACK feather material so the
  // eyes are the only emissive + dissolve is shared), it overrides every tier.
  const mat = (hex, rough = 0.66) => material || new THREE.MeshStandardMaterial({
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
    pivot.add(new THREE.Mesh(new THREE.ExtrudeGeometry(curvedFeatherShape(len, w, bow * bowMul, nSamp, bld), FEX), matRef));
    return pivot;
  };
  // ---- THE SPINE (owner r-fix 2) lives in the FEATHER LAYOUT, not a bone
  // mesh: segment 1 (shoulder→wrist ~(0.45,3.45)) is the near-vertical covert
  // column; segment 2 (wrist→hand tip ~(2.8,4.3)) is the primary root line.
  // The old bone mesh kept reading as a naked rod and was deleted (round-15).

  // ---- SKELETON (shape-aware) — shoulder S0, wrist/crook C0. `armLen` lengthens the arm
  // (shifts the wrist + everything rooted on the hand up along the arm); `bend` swings the hand
  // (and its fan) about the wrist; `handLen` scales how far the fan spreads along the hand.
  const S0 = { x: 0.12, y: 0.22 }, C0base = { x: 0.48, y: 3.42 };
  const armDx = (C0base.x - S0.x) * (S.armLen - 1), armDy = (C0base.y - S0.y) * (S.armLen - 1);
  const C0 = { x: C0base.x + armDx, y: C0base.y + armDy };
  const wrist = { x: 0.50 + armDx, y: 3.42 + armDy };
  const bendR = S.bend * Math.PI / 180, cB = Math.cos(bendR), sB = Math.sin(bendR);
  // shift a root up the arm, then (rel. to the wrist) scale its reach by `dscale` and rotate by bend
  const place = (root, dscale) => {
    const rx = root.x + armDx, ry = root.y + armDy;
    const dx = (rx - wrist.x) * dscale, dy = (ry - wrist.y) * dscale;
    return { x: wrist.x + (dx * cB - dy * sB), y: wrist.y + (dx * sB + dy * cB) };
  };

  // ---- PRIMARIES — the graduated fan, roots marching along SEGMENT 2 (the hand): hero at the
  // tip, stepping back to the wrist. Base values UNCHANGED; the shape knobs transform them.
  const PRIM = [
    { root: { x: 2.78, y: 4.24 }, angle: -1.06, len: 4.5, w: 0.95, bow: 0.52 },   // outermost finger
    { root: { x: 2.28, y: 4.06 }, angle: -1.17, len: 5.2, w: 1.00, bow: 0.50 },   // THE PEAK — slightly inboard
    { root: { x: 1.78, y: 3.88 }, angle: -1.28, len: 4.7, w: 0.95, bow: 0.45 },
    { root: { x: 1.30, y: 3.70 }, angle: -1.38, len: 4.0, w: 0.90, bow: 0.40 },
    { root: { x: 0.90, y: 3.52 }, angle: -1.47, len: 3.3, w: 0.85, bow: 0.35 },
  ];
  const pMean = PRIM.reduce((s, p) => s + p.angle, 0) / PRIM.length;
  PRIM.forEach((p, i) => {
    const root = place(p.root, S.handLen);
    const angle = pMean + (p.angle - pMean) * S.primSpread + bendR;      // spread about the fan mean, then swing with the bend
    const len = p.len * S.primLen * (i === 1 ? S.heroLen : 1);           // i===1 is THE PEAK/hero
    const f = addFeather(i % 2 ? priMatB : priMat, len, p.w * S.primWidth, p.bow * S.primBow, root, angle, 0.02 + i * 0.07);
    // CUP: rake grades across the fan (+ a tiny alternation for edge light).
    f.children[0].rotation.x = 0.06 - i * 0.025 + (i % 2 ? 0.015 : -0.015);
  });

  // ---- SECONDARIES — the medium broad-blade pair PACKED AT THE WRIST/CROOK.
  const SEC = [
    { root: { x: 0.82, y: 3.02 }, angle: -1.55, len: 2.35, w: 1.15, bow: 0.30 },
    { root: { x: 0.62, y: 2.66 }, angle: -1.52, len: 1.9, w: 1.20, bow: 0.24 },
  ];
  SEC.forEach((p, i) => { const f = addFeather(secMat, p.len * S.secLen, p.w * S.secWidth, p.bow, place(p.root, S.handLen), p.angle + bendR, 0.22 + i * 0.06); f.children[0].rotation.x = -0.07 - i * 0.03; });

  // ---- COVERT REGION — scallop-edged strips along SEGMENT 1 (the near-vertical
  // arm): small at the shoulder, growing toward the crook, band faces toward the
  // camera so the rows read from the front. (C0 already carries the armLen shift.)
  const bx = C0.x - S0.x, by = C0.y - S0.y, bl = Math.hypot(bx, by);
  const dirA = Math.atan2(by, bx);                      // segment-1 direction (from +X)
  const px = by / bl, py = -bx / bl;                    // perp, pointing out (right)

  // ARM CENTERLINE — a quadratic S0→C0 that the coverts + under-lens ride. `armBow` bulges the
  // control point perpendicular (a CONVEX arm); `elbow` slides it along the arm (where the bulge
  // peaks). armBow 0 → the control sits on the chord → a straight line → the shipped wing exactly.
  const ctrlx = S0.x + bx * S.elbow + px * S.armBow, ctrly = S0.y + by * S.elbow + py * S.armBow;
  const boneAt = (t) => {
    const mt = 1 - t;
    const x = mt * mt * S0.x + 2 * mt * t * ctrlx + t * t * C0.x;
    const y = mt * mt * S0.y + 2 * mt * t * ctrly + t * t * C0.y;
    const dx = 2 * mt * (ctrlx - S0.x) + 2 * t * (C0.x - ctrlx);
    const dy = 2 * mt * (ctrly - S0.y) + 2 * t * (C0.y - ctrly);
    return { x, y, dir: Math.atan2(dy, dx) };
  };

  // Under-plumage lens: ivory backing so chinks show ivory, never slate. Its perpendicular
  // spread carries the arm's WIDTH (scaled by `armWidth`).
  const aw = S.armWidth;
  // `rootWidth` broadens the wing's BASE (where it meets the body) from a pinch-point into a
  // flat, wide connection — the lens gets a straight bottom edge spanning ±rw instead of a spike.
  const rw = (S.rootWidth - 1) * 0.6;
  const underShape = (() => {
    const u = new THREE.Shape();
    const lm = boneAt(0.5); const mx = lm.x, my = lm.y;   // lens mid rides the (possibly bowed) arm
    if (rw > 1e-4) {
      const b0x = S0.x - px * rw, b0y = S0.y - py * rw, b1x = S0.x + px * rw, b1y = S0.y + py * rw;
      u.moveTo(b0x, b0y);
      u.quadraticCurveTo(mx - px * 0.25 * aw, my - py * 0.25 * aw, C0.x, C0.y);
      u.quadraticCurveTo(mx + px * 1.05 * aw, my + py * 1.05 * aw, b1x, b1y);
      u.lineTo(b0x, b0y);
    } else {
      u.moveTo(S0.x, S0.y);
      u.quadraticCurveTo(mx - px * 0.25 * aw, my - py * 0.25 * aw, C0.x, C0.y);
      u.quadraticCurveTo(mx + px * 1.05 * aw, my + py * 1.05 * aw, S0.x, S0.y);
    }
    u.closePath();
    return u;
  })();
  const under = new THREE.Mesh(new THREE.ExtrudeGeometry(underShape, { ...PEX, depth: 0.05 }), lcMat);
  under.position.z = 0.40;
  group.add(under);

  const addStrip = (matRef, off, u0, u1, h, lobes, d0, d1, z, seed) => {
    const L = bl * (u1 - u0);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(scallopStrip(L, h, lobes, d0, d1, seed), PEX), matRef);
    // CONVERGED roots: each strip starts ON the (possibly bowed) bone and fans outward so its
    // crook end reaches `off` — shoulder ends meet in one tuft, never a fray.
    const b0 = boneAt(u0);
    // `rootWidth` spreads each covert row's BASE out along the perp (∝ its fan `off`) so the
    // shoulder ends splay into a broad base instead of converging to one tuft/point.
    const rs = (S.rootWidth - 1) * 0.5;
    if (rs) { b0.x += px * rs * off; b0.y += py * rs * off; }
    m.rotation.z = b0.dir - Math.atan2(off, L);   // local +v = MINUS perp
    m.position.set(b0.x, b0.y, z);
    group.add(m);
    return m;
  };
  // `armWidth` (aw) fans the covert rows out + arches them (the arm's WIDTH); `covert` (cv) is
  // just the scallop-lobe depth (the row puffiness).
  const cv = S.covert;
  addStrip(gcMat, 0.95 * aw, 0.14, 1.08, 0.44 * aw, 8, 0.22 * cv, 0.14 * cv, 0.455, 3);   // greater — widest, over the quills
  addStrip(lcMat, 0.62 * aw, 0.10, 1.05, 0.40 * aw, 9, 0.18 * cv, 0.11 * cv, 0.48, 11);
  addStrip(mgMat, 0.34 * aw, 0.07, 1.02, 0.36 * aw, 9, 0.14 * cv, 0.09 * cv, 0.505, 23);
  addStrip(lcMat, 0.08 * aw, 0.05, 0.99, 0.30 * aw, 10, 0.11 * cv, 0.07 * cv, 0.53, 31);  // hugging the leading edge (never past it)

  // Hand coverts: a scalloped row along the primary root line (segment 2),
  // burying the quill bases — a feather, not a bone.
  {
    const a = place({ x: 0.52, y: 3.42 }, S.handLen), b = place({ x: 2.86, y: 4.34 }, S.handLen);
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(scallopStrip(l, 0.24, 6, 0.15, 0.11, 47), PEX), gcMat);
    m.rotation.z = Math.atan2(dy, dx);
    m.position.set(a.x, a.y, 0.44);
    group.add(m);
  }

  return { group };
}
