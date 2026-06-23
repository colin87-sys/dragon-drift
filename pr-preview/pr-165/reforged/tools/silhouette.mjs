// SILHOUETTE MIRROR — a clean, filled rear/side/front/climb silhouette of any dragon, rendered HEADLESSLY
// with no browser and no dependencies (~100ms), so shape can be eyeballed (and diffed, via
// silhouette-overlay.mjs) against a concept image without booting Chromium — whose WebGL is unavailable in
// CI/this sandbox. The render itself lives in silhouetteCore.mjs (shared with the overlay tool).
//
//   node tools/silhouette.mjs                 # pearl, rear view, apex form
//   node tools/silhouette.mjs <key> [view] [form]
//       view = rear (default, the chase cam) | side | front | climb (portrait, ascending pose)
//       form = 0..3 (default = apex)
//     → /tmp/sil-<key>-<view>.png   (white fill on near-black)

import { writeFileSync } from 'node:fs';
import { renderSilhouette, pngGray, DRAGONS } from './silhouetteCore.mjs';

const args = process.argv.slice(2);
const poseArg = args.find((a) => a.startsWith('--pose='));
const pose = poseArg ? poseArg.split('=')[1] : undefined;   // glide|recovery|apex|downstroke|settle
const hideWings = args.includes('--no-wings');              // isolate the BODY silhouette (drop wings)
const pos = args.filter((a) => !a.startsWith('--'));
const key = pos[0] || 'pearl';
const view = pos[1] || 'rear';
if (!DRAGONS[key]) { console.log(`unknown dragon: ${key}`); process.exit(1); }
const tier = pos[2] != null ? Number(pos[2]) : undefined;
const W = view === 'climb' ? 400 : 560, H = view === 'climb' ? 620 : 440;

const { buf, bounds, tris, name, formName } = renderSilhouette({ key, view, tier, W, H, pose, hideWings });

const gray = new Uint8Array(W * H);          // lift the background off pure black so the frame reads
for (let i = 0; i < buf.length; i++) gray[i] = buf[i] ? 245 : 18;
const path = `/tmp/sil-${key}-${view}.png`;
writeFileSync(path, pngGray(W, H, gray));

const cov = bounds
  ? `${(((bounds.maxX - bounds.minX) / W) * 100).toFixed(0)}% wide · ${(((bounds.maxY - bounds.minY) / H) * 100).toFixed(0)}% tall`
  : 'EMPTY';
console.log(`${name} · ${formName} · ${view}${pose ? ' · pose:' + pose : ''} — ${tris} tris → ${cov}`);
console.log(`wrote ${path}`);
