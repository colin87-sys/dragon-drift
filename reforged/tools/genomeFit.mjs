// genomeFit.mjs — SILHOUETTE AUTO-FIT (headless authoring tool).
//
// The thing the old hull workflow never had: your reference OUTLINE becomes the
// objective function of an optimizer that drives the creature's silhouette onto it
// — instead of a human eyeballing a % and guessing which dial to turn.
//
//   • single view (side):  rasterize → IoU → coordinate-descend spine HEIGHTS.
//   • two views (side+rear): also constrains WIDTH (the rear silhouette the chase
//     cam reads), descending spine WIDTHS + HEIGHTS together.
//   • real reference: loadOutlineMask() ingests a drawn PNG (filled silhouette OR
//     a closed outline) via the repo's own PNG codec, bbox-normalised so the fit
//     is scale/position independent (same alignment the overlay tool uses).
//
// The spine cross-sections are continuous numbers (creatureGenome.js), so an
// optimizer can turn them — the exact knob the Night Fury hull hid in builder code.
//
// CLI:
//   node tools/genomeFit.mjs --make-sample      → write /tmp/outline-{side,rear}.png
//   node tools/genomeFit.mjs <side.png> [rear.png]   → fit a flat start to them
//
// Pure rasterisation on the position buffer; three is used only to build the body
// loft. PNG codec is lazy-imported so unit tests stay light. Run with the
// three-resolver hook registered.

import { readFileSync } from 'node:fs';
import { register } from 'node:module';
// Self-register the three→bundled-lib resolver so this tool runs standalone
// (node tools/genomeFit.mjs). Tests register it too before importing — a second
// idempotent registration of the same resolve hook is harmless.
register('./three-resolver.mjs', import.meta.url);
const { sweepProfileSmooth } = await import('../js/dragonSweep.js');
const { genomeToProfile, SAMPLE_WYVERN } = await import('../js/creatureGenome.js');
const { setActiveDetail } = await import('../js/modelDetail.js');

const clone = (g) => JSON.parse(JSON.stringify(g));

// build just the BODY loft for a genome (the part the spine controls).
function bodyGeo(g) {
  setActiveDetail('high');
  return sweepProfileSmooth(genomeToProfile(g), 1);
}

// fixed world bounds per view so POSITION + SHAPE both matter (not a centred blob).
// side: forward −Z → horizontal, up +Y → vertical (sees HEIGHT + length).
// rear: right +X → horizontal, up +Y → vertical (sees WIDTH + height — the chase cam).
// top: looking DOWN (+Z → horizontal, +X → vertical) — sees WIDTH per station along
// the length, the one thing the rear ENVELOPE can't disambiguate. side+rear+top =
// the orthographic triple that pins height profile, width-the-cam-sees, and
// per-station width respectively.
const BOUNDS = {
  side: { hMin: -1.9, hMax: 2.1, vMin: -0.6, vMax: 1.2, H: 'z', Vc: 'y' },
  rear: { hMin: -0.8, hMax: 0.8, vMin: -0.6, vMax: 1.2, H: 'x', Vc: 'y' },
  top:  { hMin: -1.9, hMax: 2.1, vMin: -0.8, vMax: 0.8, H: 'z', Vc: 'x' },
};
function project(x, y, z, view, W, H) {
  const b = BOUNDS[view];
  const hv = b.H === 'z' ? z : x;
  const vv = b.Vc === 'y' ? y : x;
  const u = ((hv - b.hMin) / (b.hMax - b.hMin)) * (W - 1);
  const v = ((b.vMax - vv) / (b.vMax - b.vMin)) * (H - 1); // +up
  return [u, v];
}

// fill the projected triangles of a geometry into a binary coverage grid.
export function rasterizeView(geo, view = 'side', W = 100, H = 64) {
  const pos = geo.attributes.position.array;
  const idx = geo.index.array;
  const cov = new Uint8Array(W * H);
  const tri = [[0, 0], [0, 0], [0, 0]];
  for (let t = 0; t < idx.length; t += 3) {
    for (let k = 0; k < 3; k++) {
      const o = idx[t + k] * 3;
      const p = project(pos[o], pos[o + 1], pos[o + 2], view, W, H);
      tri[k][0] = p[0]; tri[k][1] = p[1];
    }
    fillTri(cov, W, H, tri);
  }
  return cov;
}
// back-compat: side-view rasterize used by the single-view test.
export function rasterize(geo, W = 100, H = 64) { return rasterizeView(geo, 'side', W, H); }

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

// crop a coverage grid to its bounding box and resample to fill WxH — makes a
// comparison scale/position INDEPENDENT (pure shape), the alignment the overlay
// tool uses. Needed when a target's absolute scale is unknown (a drawn PNG).
export function normalizeCoverage(cov, W, H) {
  let minX = W, maxX = -1, minY = H, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (cov[y * W + x]) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return cov.slice();
  const bw = maxX - minX || 1, bh = maxY - minY || 1;
  const out = new Uint8Array(W * H);
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    const sx = minX + Math.round((gx / (W - 1)) * bw);
    const sy = minY + Math.round((gy / (H - 1)) * bh);
    out[gy * W + gx] = cov[sy * W + sx];
  }
  return out;
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

// ── single-view fit (heights only) — kept for the original proof ─────────────
export function fitGenome(targetMask, startGenome, opts = {}) {
  return fitMultiView({ side: targetMask }, startGenome, { ...opts, params: ['h'] });
}

// ── multi-view fit — descend the named spine params to maximise MEAN IoU across
// every supplied view. targets = { side?:mask, rear?:mask }. params ⊆ ['w','h'].
export function fitMultiView(targets, startGenome, opts = {}) {
  const W = opts.W ?? 100, H = opts.H ?? 64;
  const iters = opts.iters ?? 16;
  const params = opts.params ?? ['w', 'h'];
  const views = Object.keys(targets);
  const norm = opts.normalize ?? false;   // bbox-normalise when the target scale is unknown (PNG)
  const score = (g) => {
    const geo = bodyGeo(g);
    let s = 0;
    for (const v of views) {
      let cand = rasterizeView(geo, v, W, H);
      if (norm) cand = normalizeCoverage(cand, W, H);
      s += iou(cand, targets[v]);
    }
    return s / views.length;
  };
  let g = clone(startGenome);
  let best = score(g);
  const history = [best];
  let step = opts.step ?? 0.14;
  for (let it = 0; it < iters; it++) {
    for (let j = 0; j < g.spine.length; j++) {
      for (const param of params) {
        for (const d of [step, -step]) {
          const trial = clone(g);
          trial.spine[j][param] = Math.max(0.02, trial.spine[j][param] + d);
          const sc = score(trial);
          if (sc > best) { best = sc; g = trial; }
        }
      }
    }
    history.push(best);
    step *= 0.72;
  }
  return { genome: g, iou: best, history };
}

// convenience: rasterize a genome's body silhouette to a mask (for making targets).
export function genomeMask(g, view = 'side', W = 100, H = 64) {
  return rasterizeView(bodyGeo(g), view, W, H);
}

// ── ingest a REAL drawn outline PNG → a filled, bbox-normalised target mask ───
// Accepts a filled silhouette OR a closed outline: flood-fills the exterior from
// the border over non-ink pixels, so the subject = interior ∪ ink. Then resamples
// the subject's bounding box into the fit grid (scale/position independent).
export async function loadOutlineMask(path, W = 100, H = 64) {
  const { decodePNG } = await import('./silhouetteCore.mjs');
  const { w, h, rgba } = decodePNG(readFileSync(path));
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const d = i * 4, a = rgba[d + 3];
    const lum = 0.3 * rgba[d] + 0.59 * rgba[d + 1] + 0.11 * rgba[d + 2];
    ink[i] = (a > 128 && lum < 200) ? 1 : 0;     // opaque + non-white = the drawing
  }
  // flood-fill background from the border over non-ink.
  const bg = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => { const i = y * w + x; if (!ink[i] && !bg[i]) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i / w) | 0;
    if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
  }
  // subject = not background; find its bbox.
  let minX = w, maxX = -1, minY = h, maxY = -1;
  const subj = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!bg[i]) {
      subj[i] = 1; const x = i % w, y = (i / w) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error(`loadOutlineMask: ${path} has no subject (all background)`);
  // resample the subject bbox into the WxH fit grid.
  const out = new Uint8Array(W * H);
  const bw = maxX - minX || 1, bh = maxY - minY || 1;
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    const sx = minX + Math.round((gx / (W - 1)) * bw);
    const sy = minY + Math.round((gy / (H - 1)) * bh);
    out[gy * W + gx] = subj[sy * w + sx];
  }
  return out;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const args = process.argv.slice(2);
  const W = 100, H = 64;
  if (args[0] === '--make-sample') {
    const { pngGray } = await import('./silhouetteCore.mjs');
    const { writeFileSync } = await import('node:fs');
    for (const view of ['side', 'rear']) {
      const m = genomeMask(SAMPLE_WYVERN, view, W, H);
      const g = new Uint8Array(W * H); for (let i = 0; i < m.length; i++) g[i] = m[i] ? 235 : 18;
      const p = `/tmp/outline-${view}.png`;
      writeFileSync(p, pngGray(W, H, g));
      console.log(`wrote ${p} (${view} silhouette of ${SAMPLE_WYVERN.name})`);
    }
    process.exit(0);
  }
  if (!args[0]) { console.log('usage: node tools/genomeFit.mjs <side.png> [rear.png]  |  --make-sample'); process.exit(1); }
  const targets = { side: await loadOutlineMask(args[0], W, H) };
  if (args[1]) targets.rear = await loadOutlineMask(args[1], W, H);
  // flat start: a featureless tube — the "shape is just wrong" state.
  const start = clone(SAMPLE_WYVERN);
  for (const j of start.spine) { j.w = 0.34; j.h = 0.34; }
  const params = targets.rear ? ['w', 'h'] : ['h'];
  // PNG targets are bbox-normalised (unknown drawing scale) → normalise the
  // candidate the same way so the fit compares pure SHAPE.
  const fit = fitMultiView(targets, start, { W, H, params, iters: 16, normalize: true });
  console.log(`fit over views [${Object.keys(targets).join(', ')}] · params [${params.join(',')}]`);
  console.log(`IoU: ${fit.history[0].toFixed(3)} → ${fit.iou.toFixed(3)}`);
  console.log('recovered spine:');
  for (const j of fit.genome.spine) console.log(`  ${j.id.padEnd(7)} w=${j.w.toFixed(3)} h=${j.h.toFixed(3)}`);
}
