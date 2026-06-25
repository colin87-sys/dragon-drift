// conceptmatch — HONEST rear-silhouette QA against a concept image.
//
// The older silhouette-overlay.mjs masked the concept by "luminance floor in the
// lower frame" (built for a dragon over sunset WATER). For a centred subject on a
// transparent/white background that grabs the wrong region. This tool masks the
// subject correctly (alpha if present, else "not the near-white/near-black corner
// background, OR colourful"), keeps the largest component, then aligns MY build's
// rear silhouette to it (aspect-preserving, centred) and reports IoU + each shape's
// aspect ratio (so a wide-ribbon-vs-tall-broad mismatch shows as a NUMBER, not a
// vibe). Writes a 3-panel PNG: reference | build | overlay (ref grey + build cyan).
//
//   node tools/conceptmatch.mjs <concept.png> <key> [view] [--tier=N]
//     view = rear (default, the chase cam) | climb | threeq | top
//   → prints IoU + aspects; writes /tmp/cm-<key>-<view>.png

import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { renderSilhouette, decodePNG, pngRGBA, DRAGONS } from './silhouetteCore.mjs';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const conceptPath = pos[0];
const key = pos[1] || 'pearl';
const view = pos[2] || 'rear';
const tierArg = args.find((a) => a.startsWith('--tier='));
const tier = tierArg ? Number(tierArg.slice(7)) : undefined;
if (!conceptPath || !DRAGONS[key]) {
  console.log('usage: node tools/conceptmatch.mjs <concept.png> <key> [view] [--tier=N]');
  process.exit(1);
}

// --- 1. extract the concept subject mask (white/transparent bg aware) ---------
const { w: cw, h: ch, rgba } = decodePNG(readFileSync(conceptPath));
// Sample the four corners to learn the background colour + whether there's alpha.
const corner = (x, y) => { const i = (y * cw + x) * 4; return [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]; };
const corners = [corner(1, 1), corner(cw - 2, 1), corner(1, ch - 2), corner(cw - 2, ch - 2)];
const hasAlpha = corners.some((c) => c[3] < 32);
const bg = corners.reduce((a, c) => [a[0] + c[0] / 4, a[1] + c[1] / 4, a[2] + c[2] / 4], [0, 0, 0]);
const subj = new Uint8Array(cw * ch);
for (let i = 0; i < cw * ch; i++) {
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
  if (hasAlpha) { subj[i] = a > 64 ? 1 : 0; continue; }
  const dBg = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  subj[i] = (dBg > 60 || chroma > 24) ? 1 : 0;   // differs from bg, or is colourful
}
// Keep the largest connected component (drop stray marks / watermarks).
function largest(mask, w, h) {
  const seen = new Uint8Array(w * h); let best = null, bestN = 0; const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    stack.length = 0; stack.push(s); seen[s] = 1; const cell = []; let n = 0;
    while (stack.length) {
      const p = stack.pop(); cell.push(p); n++;
      const x = p % w, y = (p / w) | 0;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
      if (x < w - 1 && mask[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
      if (y > 0 && mask[p - w] && !seen[p - w]) { seen[p - w] = 1; stack.push(p - w); }
      if (y < h - 1 && mask[p + w] && !seen[p + w]) { seen[p + w] = 1; stack.push(p + w); }
    }
    if (n > bestN) { bestN = n; best = cell; }
  }
  const out = new Uint8Array(w * h); if (best) for (const p of best) out[p] = 1; return out;
}
const refMask = largest(subj, cw, ch);

// --- 2. render MY build's silhouette ----------------------------------------
const RW = 560, RH = 760;
const { buf, bounds } = renderSilhouette({ key, view, tier, W: RW, H: RH });
const buildMask = new Uint8Array(RW * RH);
for (let i = 0; i < buf.length; i++) buildMask[i] = buf[i] ? 1 : 0;

// --- 3. normalise both into a common canvas (aspect-preserving, centred) ------
function bbox(mask, w, h) {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return maxX >= minX ? { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
}
const TW = 300, TH = 420, MARGIN = 0.92;
// Resample `mask` so its bbox is centred + scaled (preserving aspect) into TWxTH.
function normalize(mask, w, h, bb) {
  const out = new Uint8Array(TW * TH);
  if (!bb) return out;
  const s = Math.min((TW * MARGIN) / bb.w, (TH * MARGIN) / bb.h);
  const offX = (TW - bb.w * s) / 2, offY = (TH - bb.h * s) / 2;
  for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
    const sx = Math.round(bb.minX + (tx - offX) / s), sy = Math.round(bb.minY + (ty - offY) / s);
    if (sx >= 0 && sx < w && sy >= 0 && sy < h && mask[sy * w + sx]) out[ty * TW + tx] = 1;
  }
  return out;
}
const rbb = bbox(refMask, cw, ch), bbb = bbox(buildMask, RW, RH);
const refN = normalize(refMask, cw, ch, rbb);
const buildN = normalize(buildMask, RW, RH, bbb);

// --- 4. IoU + aspects --------------------------------------------------------
let inter = 0, uni = 0;
for (let i = 0; i < TW * TH; i++) { const a = refN[i], b = buildN[i]; if (a || b) uni++; if (a && b) inter++; }
const iou = uni ? (inter / uni) : 0;
const refAspect = rbb ? (rbb.w / rbb.h) : 0, buildAspect = bbb ? (bbb.w / bbb.h) : 0;

// --- 5. 3-panel output: reference | build | overlay --------------------------
const PW = TW * 3 + 8, PH = TH;
const rgbaOut = Buffer.alloc(PW * PH * 4);
for (let i = 0; i < PW * PH; i++) { rgbaOut[i * 4] = 14; rgbaOut[i * 4 + 1] = 16; rgbaOut[i * 4 + 2] = 20; rgbaOut[i * 4 + 3] = 255; }
const put = (panelX, ty, tx, r, g, b) => {
  const x = panelX + tx, y = ty, d = (y * PW + x) * 4;
  rgbaOut[d] = r; rgbaOut[d + 1] = g; rgbaOut[d + 2] = b; rgbaOut[d + 3] = 255;
};
for (let ty = 0; ty < TH; ty++) for (let tx = 0; tx < TW; tx++) {
  const r = refN[ty * TW + tx], b = buildN[ty * TW + tx];
  if (r) put(0, ty, tx, 200, 120, 255);                          // panel 1: reference (violet)
  if (b) put(TW + 4, ty, tx, 120, 230, 255);                     // panel 2: build (cyan)
  // panel 3: overlay — ref violet, build cyan, overlap white
  if (r && b) put(TW * 2 + 8, ty, tx, 245, 245, 245);
  else if (r) put(TW * 2 + 8, ty, tx, 150, 70, 200);
  else if (b) put(TW * 2 + 8, ty, tx, 60, 150, 190);
}
const outPath = `/tmp/cm-${key}-${view}.png`;
writeFileSync(outPath, pngRGBA(PW, PH, rgbaOut));

console.log(`concept ${cw}x${ch} (alpha=${hasAlpha}) · bg≈[${bg.map((v) => v | 0)}]`);
console.log(`ref bbox ${rbb ? rbb.w + 'x' + rbb.h : 'none'} (aspect ${refAspect.toFixed(2)}) · build ${view} bbox ${bbb ? bbb.w + 'x' + bbb.h : 'none'} (aspect ${buildAspect.toFixed(2)})`);
console.log(`IoU (aspect-preserving, centred): ${(iou * 100).toFixed(1)}%   ${Math.abs(refAspect - buildAspect) > 0.3 ? '⚠ aspect mismatch' : ''}`);
console.log(`wrote ${outPath}  [reference | build | overlay]`);
