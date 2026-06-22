// PART-AWARE REFERENCE OVERLAY — compare a BUILT creature against a reference image
// PER PART, not as one fused blob. Reads a JSON sidecar (<reference>.targets.json) that
// records, from the reference, each part's pixel box and the scale-independent target
// RATIOS (wing span / body length, head / body, leg / body). Renders the build per-part
// (silhouetteCore Tool B), then prints signed proportion errors ("span/body built 2.31
// vs target 2.50 → -7.6%, wings short") and composites a debug overlay (target boxes
// dashed, built boxes solid in the part palette).
//
//   node tools/parts-overlay.mjs <reference.png> <key> [view] [tier] [--pose=...]
//       reads <reference>.targets.json next to the image (see schema in the repo docs)
//     → /tmp/parts-overlay-<key>-<view>.png
//
// RATIOS are the primary, framing-immune signal (world-space). Pixel boxes are a
// secondary, alignment-dependent check. The mask is YOU: fill the sidecar by LOOKING
// at the reference — this tool does not auto-detect parts (that's the point: exact).

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { renderSilhouette, decodePNG, pngRGBA, PART_PALETTE } from './silhouetteCore.mjs';

const args = process.argv.slice(2);
const poseArg = args.find((a) => a.startsWith('--pose='));
const pose = poseArg ? poseArg.split('=')[1] : undefined;
const pos = args.filter((a) => !a.startsWith('--'));
const refPath = pos[0], key = pos[1];
if (!refPath || !key) { console.log('usage: node tools/parts-overlay.mjs <reference.png> <key> [view] [tier] [--pose=...]'); process.exit(1); }

const sidecarPath = refPath.replace(/\.(png|jpe?g)$/i, '') + '.targets.json';
if (!existsSync(sidecarPath)) {
  console.log(`no sidecar found: ${sidecarPath}`);
  console.log('Create it by LOOKING at the reference. Schema:');
  console.log(JSON.stringify({
    ref: refPath, view: 'side', imageSize: { w: 1024, h: 1024 },
    parts: { torso: { box: [0, 0, 0, 0] }, wingL: { box: [0, 0, 0, 0] }, wingR: { box: [0, 0, 0, 0] }, head: { box: [0, 0, 0, 0] }, tail: { box: [0, 0, 0, 0] } },
    ratios: { wingSpanToBodyLength: 2.5, headToBodyLength: 0.2, legToBodyLength: 0.62 },
  }, null, 2));
  process.exit(1);
}
const tgt = JSON.parse(readFileSync(sidecarPath, 'utf8'));
const view = pos[2] || tgt.view || 'side';
const tier = pos[3] != null ? Number(pos[3]) : undefined;

const { w, h, rgba } = decodePNG(readFileSync(refPath));
const r = renderSilhouette({ key, view, tier, W: w, H: h, pose, perPart: true, colorParts: true });
if (!r.bounds) { console.log('empty render'); process.exit(1); }

// --- RATIO report (primary, scale-independent) ------------------------------
const m = r.measurements || {};
const tr = tgt.ratios || {};
const pct = (built, target) => (built == null || target == null ? null : ((built - target) / target) * 100);
const sign = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';
const note = (n, hi, lo) => (n == null ? '' : `  (${Math.abs(n) < 4 ? 'on target' : (n > 0 ? hi : lo)})`);
console.log(`${r.name} · ${view} · vs ${refPath.split('/').pop()}`);
console.log('  RATIOS');
const ratioRows = [
  ['span/body', m.wingSpanToBodyRatio, tr.wingSpanToBodyLength, 'wings long', 'wings short'],
  ['head/body', m.headToBodyRatio, tr.headToBodyLength, 'head big', 'head small'],
  ['leg/body', m.legToBodyRatio, tr.legToBodyLength, 'legs long', 'legs short'],
];
for (const [label, built, target, hi, lo] of ratioRows) {
  if (target == null) continue;
  const e = pct(built, target);
  console.log(`    ${label.padEnd(10)} built ${built == null ? '—' : built}  target ${target}` + (e == null ? '  (part not built)' : `  → ${sign(e)}${note(e, hi, lo)}`));
}

// --- PIXEL boxes (secondary): bbox-align built render → reference union box --
const refParts = tgt.parts || {};
const refBoxes = Object.values(refParts).map((p) => p.box).filter(Boolean);
const out = Buffer.from(rgba);
if (refBoxes.length) {
  const rX0 = Math.min(...refBoxes.map((b) => b[0])), rY0 = Math.min(...refBoxes.map((b) => b[1]));
  const rX1 = Math.max(...refBoxes.map((b) => b[2])), rY1 = Math.max(...refBoxes.map((b) => b[3]));
  const bX0 = r.bounds.minX, bY0 = r.bounds.minY, bW = (r.bounds.maxX - r.bounds.minX) || 1, bH = (r.bounds.maxY - r.bounds.minY) || 1;
  const sx = (rX1 - rX0) / bW, sy = (rY1 - rY0) / bH;
  const mapX = (x) => rX0 + (x - bX0) * sx, mapY = (y) => rY0 + (y - bY0) * sy;

  // draw helpers on the reference rgba
  const px = (x, y, c) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const d = (y * w + x) * 4; out[d] = c[0]; out[d + 1] = c[1]; out[d + 2] = c[2]; out[d + 3] = 255; };
  const rect = (x0, y0, x1, y1, c, dash) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    for (let x = x0; x <= x1; x++) { if (!dash || (x >> 2) % 2) { px(x, y0, c); px(x, y1, c); } }
    for (let y = y0; y <= y1; y++) { if (!dash || (y >> 2) % 2) { px(x0, y, c); px(x1, y, c); } }
  };
  console.log('  BOXES (built mapped into reference frame · IoU vs target)');
  for (const [label, p] of Object.entries(refParts)) {
    if (!p.box) continue;
    const col = PART_PALETTE[label] || PART_PALETTE.torso;
    rect(p.box[0], p.box[1], p.box[2], p.box[3], [255, 255, 255], true);        // target: dashed white
    const bp = r.parts && r.parts[label] && r.parts[label].screen;
    if (!bp) { console.log(`    ${label.padEnd(7)} (not built)`); continue; }
    const mx0 = mapX(bp.x0), my0 = mapY(bp.y0), mx1 = mapX(bp.x1), my1 = mapY(bp.y1);
    rect(mx0, my0, mx1, my1, col, false);                                        // built: solid part color
    // IoU of mapped built box vs target box
    const ix0 = Math.max(mx0, p.box[0]), iy0 = Math.max(my0, p.box[1]), ix1 = Math.min(mx1, p.box[2]), iy1 = Math.min(my1, p.box[3]);
    const inter = Math.max(0, ix1 - ix0) * Math.max(0, iy1 - iy0);
    const aB = (mx1 - mx0) * (my1 - my0), aT = (p.box[2] - p.box[0]) * (p.box[3] - p.box[1]);
    const iou = inter / (aB + aT - inter || 1);
    const wErr = ((mx1 - mx0) - (p.box[2] - p.box[0])) / ((p.box[2] - p.box[0]) || 1) * 100;
    const hErr = ((my1 - my0) - (p.box[3] - p.box[1])) / ((p.box[3] - p.box[1]) || 1) * 100;
    console.log(`    ${label.padEnd(7)} w ${sign(wErr)}  h ${sign(hErr)}  IoU ${(iou * 100).toFixed(0)}%`);
  }
}
const outPath = `/tmp/parts-overlay-${key}-${view}.png`;
writeFileSync(outPath, pngRGBA(w, h, out));
console.log(`  → wrote ${outPath}`);
