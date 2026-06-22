// PART-MAP + MEASUREMENTS — a per-part colored silhouette and a numeric proportion
// report for any creature, rendered HEADLESSLY (no browser, ~100ms) so proportions
// are NUMBERS, not vibes. Each part gets a distinct flat hue (torso grey, wings
// cyan/blue, head yellow, tail magenta, legs green) and the tool prints world-space
// measurements (wing span, body length, span/body ratio, head box, leg length). The
// JSON sidecar feeds tools/parts-overlay.mjs (compare against a reference image).
//
//   node tools/partsil.mjs <key> [view] [tier] [--pose=...] [--no-wings]
//       view = rear (chase cam) | threeq | side | front | top | climb
//     → /tmp/parts-<key>-<view>.png    (per-part colour map)
//     → /tmp/parts-<key>-<view>.json   ({ measurements, parts })

import { writeFileSync } from 'node:fs';
import { renderSilhouette, pngRGBA, DRAGONS } from './silhouetteCore.mjs';

const args = process.argv.slice(2);
const poseArg = args.find((a) => a.startsWith('--pose='));
const pose = poseArg ? poseArg.split('=')[1] : undefined;
const hideWings = args.includes('--no-wings');
const pos = args.filter((a) => !a.startsWith('--'));
const key = pos[0] || 'pearl';
const view = pos[1] || 'rear';
if (!DRAGONS[key]) { console.log(`unknown dragon: ${key}`); process.exit(1); }
const tier = pos[2] != null ? Number(pos[2]) : undefined;
const W = view === 'climb' ? 400 : 560, H = view === 'climb' ? 620 : 440;

const r = renderSilhouette({ key, view, tier, W, H, pose, hideWings, colorParts: true });

// Composite the part-map onto a near-black background (untouched pixels = bg).
const out = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const d = i * 4;
  if (r.rgba[d + 3]) { out[d] = r.rgba[d]; out[d + 1] = r.rgba[d + 1]; out[d + 2] = r.rgba[d + 2]; out[d + 3] = 255; }
  else { out[d] = 14; out[d + 1] = 16; out[d + 2] = 24; out[d + 3] = 255; }
}
const png = `/tmp/parts-${key}-${view}.png`;
writeFileSync(png, pngRGBA(W, H, out));

const m = r.measurements || {};
const jsonPath = `/tmp/parts-${key}-${view}.json`;
writeFileSync(jsonPath, JSON.stringify({ key, view, tier: tier ?? null, measurements: m, parts: r.parts }, null, 2));

console.log(`${r.name} · ${r.formName} · ${view}${pose ? ' · pose:' + pose : ''} — ${r.tris} tris`);
const fmt = (v) => (v == null ? '—' : v);
console.log(`  parts: ${Object.keys(r.parts || {}).join(', ') || 'none'}`);
console.log(`  wingSpan ${fmt(m.wingSpan)}  bodyLength ${fmt(m.bodyLength)}  span/body ${fmt(m.wingSpanToBodyRatio)}`);
if (m.headBox) console.log(`  head ${fmt(m.headBox.x)}×${fmt(m.headBox.y)}×${fmt(m.headBox.z)}  head/body ${fmt(m.headToBodyRatio)}`);
if (m.tailLength != null) console.log(`  tailLength ${fmt(m.tailLength)}`);
if (m.legLength != null) console.log(`  legLength ${fmt(m.legLength)}  leg/body ${fmt(m.legToBodyRatio)}`);
console.log(`  → wrote ${png}  (+ ${jsonPath})`);
