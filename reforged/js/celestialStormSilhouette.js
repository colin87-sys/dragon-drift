// CELESTIAL STORM — the rear-cam 2D SILHOUETTE BUILDER.
//
// Pure geometry: turns the named anchor spec (celestialStormSpec.js) into a set of
// named 2D paths in normalized rear-cam space. NO DOM, NO Three.js — so the exact
// same blueprint drives the headless renderer (tools/celestialSilhouette.mjs), the
// rule tests (tests/celestial.mjs), the interactive overlay (tools/celestialTracer.html),
// and — in the next phase — the 3D extrusion. Solve the logo here; depth comes later.
//
// Output (all coordinates are [x, y], normalized, Y-up, symmetric across X = 0):
//   { bodyOutline, spinePlates, wings:{left,right}, tail, head, anchors, bounds }
// where each wing = { membraneOutline, panels[3], bones[], leadingEdge, trailingEdge, veins[] }

import { CELESTIAL_STORM_DRAGON_REAR_SPEC, resolveSpec, mirrorWing, lerp, mulberry32 } from './celestialStormSpec.js';

const xy = (p) => [p[0], p[1]];

// Catmull-Rom through a sequence of 2D control points → a smooth resampled polyline.
// Used for the lofted body profile so the hull reads as a curve, not a faceted stack.
function catmull(controls, perSeg = 8) {
  const pts = [];
  const n = controls.length;
  const at = (i) => controls[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < perSeg; s++) {
      const t = s / perSeg, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      pts.push([x, y]);
    }
  }
  pts.push(xy(controls[n - 1]));
  return pts;
}

// BODY HULL — a thin fuselage lofted along the vertical centerline. Control stations
// pair a Y with a rear-view half-width; we resample the half-width profile smoothly,
// then mirror it into a closed outline. Widest at the shoulders, narrowing to the tail.
function buildBody(spec) {
  const b = spec.body;
  // [y, halfWidth] control stations, top → bottom. Shoulder is the widest read.
  const controls = [
    [b.head[1] + 0.02, b.headWidth * 0.18],   // rounded crown
    [b.head[1], b.headWidth * 0.5],
    [b.neck[1], b.shoulderWidth * 0.38],
    [b.chest[1] + 0.02, b.shoulderWidth * 0.5], // shoulders — widest
    [b.chest[1] - 0.06, b.torsoWidth * 0.5],
    [b.hips[1], b.hipWidth * 0.5],
    [b.tailMid[1], b.tailBaseWidth * 0.5],
    [-0.50, b.tailTipWidth * 0.5 + 0.012],      // hand off to the tail spear here
  ];
  const prof = catmull(controls, 9);
  const right = prof.map(([y, half]) => [half, y]);
  const left = prof.map(([y, half]) => [-half, y]).reverse();
  return [...right, ...left];   // closed loop: down the right, up the left
}

// DORSAL SPINE — glowing diamond plates down the centerline, big up top → small down
// the tail. The rear-cam follow-line.
function buildSpine(spec) {
  const s = spec.spine;
  const plates = [];
  for (let i = 0; i < s.count; i++) {
    const t = s.count === 1 ? 0 : i / (s.count - 1);
    const y = lerp(s.yTop, s.yBottom, t);
    const h = lerp(s.sizeTop, s.sizeBottom, t);
    const w = h * s.widthRatio;
    plates.push({
      center: [0, y],
      diamond: [[0, y + h], [w, y], [0, y - h], [-w, y]],
    });
  }
  return plates;
}

// One wing from its anchor set. `side` = -1 (left, anchors already negative-X) or +1.
function buildWing(wing, spec, side) {
  const P = (k) => xy(wing[k]);
  const root = P('root'), elbow = P('elbow'), wrist = P('wrist'), tip = P('tip');
  const outer = P('outerScallop'), mid = P('midScallop'), inner = P('innerScallop'), rootS = P('rootScallop');

  const leadingEdge = [root, elbow, wrist, tip];
  const trailingPts = [tip, outer, mid, inner, rootS, root];

  // Scalloped trailing edge: bow each bay OUTWARD (away from the wing centroid) so the
  // membrane sags between finger landings — the bat-wing read. Notches stay at the
  // scallop anchors (where the finger spokes terminate).
  const cx = (root[0] + tip[0]) / 2, cy = (elbow[1] + rootS[1]) / 2;
  const trailingEdge = [];
  for (let i = 0; i < trailingPts.length - 1; i++) {
    const a = trailingPts[i], b = trailingPts[i + 1];
    trailingEdge.push(a);
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
    // outward normal = the perpendicular pointing away from the wing centroid
    let nx = -dy / len, ny = dx / len;
    if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const depth = Math.min(0.06, len * 0.34) * (spec._scallop ?? 1);
    trailingEdge.push([mx + nx * depth, my + ny * depth]);
  }
  trailingEdge.push(root);

  const membraneOutline = [...leadingEdge, ...trailingEdge.slice(1)];

  const panels = [
    [root, elbow, inner, rootS],
    [elbow, wrist, mid, inner],
    [wrist, tip, outer, mid],
  ];

  // Bones: the swept leading arm + finger spokes out to the scallop notches.
  const bones = [
    [root, elbow, wrist, tip],   // leading edge arm
    [elbow, inner],
    [wrist, mid],
    [tip, outer],
    [root, rootS],
  ];

  // Lightning veins — procedural jagged curves following named bone runs. Seeded per
  // run + side so left/right differ slightly yet stay byte-stable across renders.
  const veins = [];
  spec.veins.runs.forEach((run, ri) => {
    const a = P(run.from), b = P(run.to);
    const rnd = mulberry32(1000 + ri * 7 + (side > 0 ? 3 : 0));
    const segs = spec.veins.segments;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
    const nx = -dy / len, ny = dx / len;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const j = (i === 0 || i === segs) ? 0 : (rnd() - 0.5) * 2 * spec.veins.jitter * run.amp;
      pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
    }
    veins.push({ points: pts, color: run.color });
  });

  return { membraneOutline, panels, bones, leadingEdge, trailingEdge, veins, side };
}

// TAIL SPEAR — long crystal blade + glowing center strip + two swept side fins.
function buildTail(spec) {
  const t = spec.tail;
  const bw = t.bladeHalfWidth, top = t.bladeTop, tip = t.bladeTip;
  const mid = (top + tip[1]) / 2;
  const spear = [
    [0, top + 0.02], [bw, mid + 0.02], [bw * 0.45, tip[1] + 0.10],
    [0, tip[1]],
    [-bw * 0.45, tip[1] + 0.10], [-bw, mid + 0.02], [0, top + 0.02],
  ];
  const fin = (s) => [
    [0, t.finY], [s * t.finSpan, t.finY + 0.01],
    [s * t.finSpan * 0.4, t.finY - t.finDrop], [0, t.finY - t.finDrop * 0.4],
  ];
  return {
    spear,
    fins: [fin(-1), fin(1)],
    centerStrip: [[0, spec.body.chest[1]], [0, tip[1]]],
  };
}

// HEAD — small rear-visible crown with two horns forming a subtle V.
function buildHead(spec) {
  const h = spec.head, c = h.crown;
  const tipY = c[1] + h.hornRise;
  return {
    horns: [
      [[-0.025, c[1] - 0.02], [-h.hornSpan, tipY]],
      [[0.025, c[1] - 0.02], [h.hornSpan, tipY]],
    ],
    crown: c,
  };
}

// Assemble the full rear-cam blueprint from a spec.
export function buildRearSilhouette(specIn = CELESTIAL_STORM_DRAGON_REAR_SPEC) {
  const spec = resolveSpec(specIn);
  const wings = {
    left: buildWing(spec.wingLeft, spec, -1),
    right: buildWing(spec.wingRight, spec, +1),
  };
  const bodyOutline = buildBody(spec);
  const spinePlates = buildSpine(spec);
  const tail = buildTail(spec);
  const head = buildHead(spec);

  // bounds over everything (drives the renderer's fit-to-canvas)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const acc = (p) => { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; };
  bodyOutline.forEach(acc);
  for (const w of [wings.left, wings.right]) w.membraneOutline.forEach(acc);
  tail.spear.forEach(acc);
  head.horns.flat().forEach(acc);

  return { spec, bodyOutline, spinePlates, wings, tail, head, anchors: spec.anchors, bounds: { minX, maxX, minY, maxY } };
}

// Convenience: the bilateral anchor set (used by the QA overlay's draggable markers).
export { resolveSpec, mirrorWing };
