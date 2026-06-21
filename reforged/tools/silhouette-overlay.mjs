// SHAPE GAP OVERLAY — superimpose a dragon's BUILT silhouette on a concept image so the difference
// between "what you pictured" and "what the engine makes" is exact and measurable, not a vibe.
//
//   node tools/silhouette-overlay.mjs <concept.png> <key> [view] [--debug]
//     view = climb (default) | rear | side | front
//     → /tmp/overlay-<key>-<view>.png   concept + my silhouette as a cyan ghost (bright cyan edge)
//     → /tmp/overlay-<key>-mask.png     (with --debug) the auto-detected concept dragon region
//
// It crudely masks the concept's dragon (bright mass in the lower-centre), scale-aligns my silhouette's
// bounding box onto that region (fair SHAPE compare, scale/position-independent), composites, and prints
// an APPROX overlap %. The mask is heuristic — eyeball the --debug mask before trusting the number.

import { writeFileSync, readFileSync } from 'node:fs';
import { renderSilhouette, decodePNG, pngRGBA, pngGray } from './silhouetteCore.mjs';

const refPath = process.argv[2];
const key = process.argv[3] || 'pearl';
const view = process.argv[4] || 'climb';
const debug = process.argv.includes('--debug');
if (!refPath) { console.log('usage: node tools/silhouette-overlay.mjs <concept.png> <key> [view] [--debug]'); process.exit(1); }

const { w, h, rgba } = decodePNG(readFileSync(refPath));

// 1) Crude concept-dragon mask: bright mass below the sky band (the sun/HUD live up top). The pearl dragon
//    reads much brighter than the sunset water + skyline, so a luminance floor in the lower frame isolates it.
const lum = (d) => 0.3 * rgba[d] + 0.59 * rgba[d + 1] + 0.11 * rgba[d + 2];
const mask = new Uint8Array(w * h);
let mMinX = Infinity, mMaxX = -Infinity, mMinY = Infinity, mMaxY = -Infinity, mCount = 0;
for (let y = Math.floor(h * 0.36); y < h; y++) for (let x = 0; x < w; x++) {
  if (lum((y * w + x) * 4) > 168) { mask[y * w + x] = 1; mCount++;
    if (x < mMinX) mMinX = x; if (x > mMaxX) mMaxX = x; if (y < mMinY) mMinY = y; if (y > mMaxY) mMaxY = y; }
}

// 2) Render my silhouette at the concept resolution, then map MY bbox onto the concept-dragon bbox.
const { buf, bounds } = renderSilhouette({ key, view, W: w, H: h });
if (!bounds || mCount < 50) { console.log('could not isolate a shape (empty render or mask)'); process.exit(1); }
const myW = bounds.maxX - bounds.minX || 1, myH = bounds.maxY - bounds.minY || 1;
const mW = mMaxX - mMinX || 1, mH = mMaxY - mMinY || 1;
const sx = myW / mW, sy = myH / mH;
// is MY silhouette set at concept pixel (x,y)? (inverse-map concept → my-render coords, bbox-aligned)
const mineAt = (x, y) => {
  const mx = Math.round(bounds.minX + (x - mMinX) * sx), my = Math.round(bounds.minY + (y - mMinY) * sy);
  return mx >= 0 && my >= 0 && mx < w && my < h && buf[my * w + mx] > 0;
};

// 3) Composite cyan ghost + bright edge; tally overlap vs the concept mask (within the union region).
const out = Buffer.from(rgba);
let inter = 0, uni = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const mine = mineAt(x, y), targ = mask[y * w + x] === 1;
  if (mine || targ) uni++; if (mine && targ) inter++;
  if (!mine) continue;
  const d = (y * w + x) * 4;
  const edge = !mineAt(x - 1, y) || !mineAt(x + 1, y) || !mineAt(x, y - 1) || !mineAt(x, y + 1);
  if (edge) { out[d] = 40; out[d + 1] = 255; out[d + 2] = 255; }
  else { out[d] = (out[d] * 0.45) | 0; out[d + 1] = (out[d + 1] * 0.45 + 140) | 0; out[d + 2] = (out[d + 2] * 0.45 + 140) | 0; }
}
const path = `/tmp/overlay-${key}-${view}.png`;
writeFileSync(path, pngRGBA(w, h, out));
console.log(`concept ${w}x${h} · mask ${mW}x${mH} (${mCount}px) · my ${view} bbox ${myW}x${myH}`);
console.log(`APPROX shape overlap (IoU, bbox-aligned): ${(inter / uni * 100).toFixed(0)}%   → wrote ${path}`);
if (debug) {
  const g = new Uint8Array(w * h); for (let i = 0; i < mask.length; i++) g[i] = mask[i] ? 255 : 20;
  const mp = `/tmp/overlay-${key}-mask.png`; writeFileSync(mp, pngGray(w, h, g)); console.log(`wrote ${mp}`);
}
