// genomeFit.mjs — SILHOUETTE AUTO-FIT (headless authoring tool).
//
// The thing the old hull workflow never had: your reference OUTLINE becomes the
// objective function of an optimizer that drives the creature's silhouette onto it
// — instead of a human eyeballing a % and guessing which dial to turn.
//
// Mechanism (this file):
//   1. rasterize a genome's BODY silhouette (side view: the outline you'd draw).
//   2. score it against a TARGET mask by IoU (intersection-over-union).
//   3. coordinate-descent the spine cross-section heights to MAXIMISE IoU.
//
// The spine cross-sections are continuous numbers (creatureGenome.js), so an
// optimizer can turn them — the exact knob the Night Fury hull hid in builder code.
// Point `target` at a rasterized version of your drawn outline and this does the
// same fit against YOUR reference.
//
// Pure rasterisation on the position buffer; the only three use is building the
// body loft (sweepProfileSmooth). Run with the three-resolver hook registered.

import { sweepProfileSmooth } from '../js/dragonSweep.js';
import { genomeToProfile } from '../js/creatureGenome.js';
import { setActiveDetail } from '../js/modelDetail.js';

const clone = (g) => JSON.parse(JSON.stringify(g));

// build just the BODY loft for a genome (the part the spine controls).
function bodyGeo(g) {
  setActiveDetail('high');
  return sweepProfileSmooth(genomeToProfile(g), 1);
}

// side-view projection: forward is −Z (→ horizontal), up is +Y (→ vertical).
// Fixed world bounds so POSITION + SHAPE both matter (not just a centred blob).
const BOUNDS = { zMin: -1.9, zMax: 2.1, yMin: -0.6, yMax: 1.2 };
function project(x, y, z, W, H) {
  const u = ((z - BOUNDS.zMin) / (BOUNDS.zMax - BOUNDS.zMin)) * (W - 1);
  const v = ((BOUNDS.yMax - y) / (BOUNDS.yMax - BOUNDS.yMin)) * (H - 1); // +y up
  return [u, v];
}

// fill the projected triangles of a geometry into a binary coverage grid.
export function rasterize(geo, W = 100, H = 64) {
  const pos = geo.attributes.position.array;
  const idx = geo.index.array;
  const cov = new Uint8Array(W * H);
  const tri = [[0, 0], [0, 0], [0, 0]];
  for (let t = 0; t < idx.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const o = idx[t + k] * 3;
      const p = project(pos[o], pos[o + 1], pos[o + 2], W, H);
      tri[k][0] = p[0]; tri[k][1] = p[1];
    }
    fillTri(cov, W, H, tri);
  }
  return cov;
}

function fillTri(cov, W, H, p) {
  const minX = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0])));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])));
  const minY = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1])));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])));
  const [ax, ay] = p[0], [bx, by] = p[1], [cx, cy] = p[2];
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  if (Math.abs(d) < 1e-9) return;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const wa = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / d;
      const wb = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / d;
      const wc = 1 - wa - wb;
      if (wa >= 0 && wb >= 0 && wc >= 0) cov[y * W + x] = 1;
    }
  }
}

// intersection-over-union of two coverage grids (1.0 = identical silhouettes).
export function iou(a, b) {
  let inter = 0, uni = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x | y) uni++;
    if (x & y) inter++;
  }
  return uni === 0 ? 1 : inter / uni;
}

// FIT: coordinate-descent the spine joint heights to maximise IoU against a target
// silhouette mask. Returns the fitted genome + the IoU history (so a test/CLI can
// watch the outline converge). `W,H` must match the target mask's dimensions.
export function fitGenome(targetMask, startGenome, opts = {}) {
  const W = opts.W ?? 100, H = opts.H ?? 64;
  const iters = opts.iters ?? 14;
  let g = clone(startGenome);
  let best = iou(rasterize(bodyGeo(g), W, H), targetMask);
  const history = [best];
  let step = opts.step ?? 0.14;
  for (let it = 0; it < iters; it++) {
    for (let j = 0; j < g.spine.length; j++) {
      for (const d of [step, -step]) {
        const trial = clone(g);
        trial.spine[j].h = Math.max(0.02, trial.spine[j].h + d);
        const score = iou(rasterize(bodyGeo(trial), W, H), targetMask);
        if (score > best) { best = score; g = trial; }
      }
    }
    history.push(best);
    step *= 0.72; // anneal toward fine adjustments
  }
  return { genome: g, iou: best, history };
}

// convenience: rasterize a genome's body silhouette to a mask (for making targets).
export function genomeMask(g, W = 100, H = 64) { return rasterize(bodyGeo(g), W, H); }
