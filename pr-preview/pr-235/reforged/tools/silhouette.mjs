// SILHOUETTE MIRROR — a clean, filled rear/side/front/climb/top/threeq silhouette of any dragon,
// rendered HEADLESSLY with no browser and no dependencies (~100ms), so shape can be eyeballed (and
// diffed, via silhouette-overlay.mjs) against a concept image without booting Chromium — whose WebGL is
// unavailable in CI/this sandbox. The render itself lives in silhouetteCore.mjs (shared with the overlay).
//
//   node tools/silhouette.mjs                 # pearl, rear view, apex form
//   node tools/silhouette.mjs <key> [view] [form]
//       view = rear (default, the chase cam) | side | front | climb | top (planform) | threeq (rear-¾)
//       form = 0..3 (default = apex)
//   Flags:
//       --pose=<glide|recovery|apex|downstroke|settle|fold|bank>   freeze the wings at a named pose
//       --no-wings      isolate the BODY silhouette (drop the wings)
//       --wings-only    isolate the WINGS (drop the body) — for pixel-level gap/scallop judgment
//       --scale=N       multiply the render resolution ×N (default 1) so gaps span enough px to judge
//       --w=N --h=N     explicit render size (overrides scale)
//       --crop          tight auto-crop to the filled subject (+margin) so it fills the frame
//     → /tmp/sil-<key>-<view>.png   (white fill on near-black)

import { writeFileSync } from 'node:fs';
import { renderSilhouette, pngGray, DRAGONS } from './silhouetteCore.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const a = args.find((x) => x.startsWith(name + '=')); return a ? a.split('=')[1] : undefined; };
const pose = opt('--pose');                         // glide|recovery|apex|downstroke|settle|fold|bank
const hideWings = flag('--no-wings');               // isolate the BODY silhouette (drop wings)
const wingsOnly = flag('--wings-only');             // isolate the WINGS (drop body) — the §6.8 inverse
const doCrop = flag('--crop');
const scale = Number(opt('--scale') ?? 1);
const pos = args.filter((a) => !a.startsWith('--'));
const key = pos[0] || 'pearl';
const view = pos[1] || 'rear';
if (!DRAGONS[key]) { console.log(`unknown dragon: ${key}`); process.exit(1); }
if (hideWings && wingsOnly) { console.log('--no-wings and --wings-only are mutually exclusive'); process.exit(1); }
const tier = pos[2] != null ? Number(pos[2]) : undefined;
// Base frame — the §6.9 gap-resolution lever. At the default 560×440 a rear blade-comb's gaps are
// 3–5px (aliasing); --scale / --w/--h raise the render so a gap spans the ≥10px the gate can judge.
const baseW = view === 'climb' ? 400 : 560, baseH = view === 'climb' ? 620 : 440;
const W = Number(opt('--w') ?? Math.round(baseW * scale));
const H = Number(opt('--h') ?? Math.round(baseH * scale));

const { buf, bounds, tris, name, formName } = renderSilhouette({ key, view, tier, W, H, pose, hideWings, wingsOnly });

// Widest interior horizontal GAP inside the fill (background pixels flanked by fill on the same row),
// scanned across the rows that carry the subject — the §6.9 acceptance metric for gap judgeability.
function widestGap(buf, W, H, b) {
  if (!b) return 0;
  let best = 0;
  for (let y = b.minY; y <= b.maxY; y++) {
    let firstFill = -1, lastFill = -1;
    for (let x = b.minX; x <= b.maxX; x++) if (buf[y * W + x]) { if (firstFill < 0) firstFill = x; lastFill = x; }
    if (firstFill < 0) continue;
    let run = 0;
    for (let x = firstFill; x <= lastFill; x++) {
      if (!buf[y * W + x]) { run++; if (run > best) best = run; } else run = 0;
    }
  }
  return best;
}
const gapPx = widestGap(buf, W, H, bounds);

// Optional tight crop so the subject fills the frame (empty margins removed). Crops the coverage
// buffer + a small margin; the fill's absolute px (and the measured gap) are unchanged.
let outBuf = buf, outW = W, outH = H;
if (doCrop && bounds) {
  const m = Math.round(Math.max(W, H) * 0.03);
  const x0 = Math.max(0, bounds.minX - m), y0 = Math.max(0, bounds.minY - m);
  const x1 = Math.min(W - 1, bounds.maxX + m), y1 = Math.min(H - 1, bounds.maxY + m);
  outW = x1 - x0 + 1; outH = y1 - y0 + 1;
  outBuf = new Uint8Array(outW * outH);
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) outBuf[y * outW + x] = buf[(y0 + y) * W + (x0 + x)];
}

const gray = new Uint8Array(outW * outH);    // lift the background off pure black so the frame reads
for (let i = 0; i < outBuf.length; i++) gray[i] = outBuf[i] ? 245 : 18;
const suffix = wingsOnly ? '-wings' : hideWings ? '-body' : '';
const path = `/tmp/sil-${key}-${view}${suffix}.png`;
writeFileSync(path, pngGray(outW, outH, gray));

const cov = bounds
  ? `${(((bounds.maxX - bounds.minX) / W) * 100).toFixed(0)}% wide · ${(((bounds.maxY - bounds.minY) / H) * 100).toFixed(0)}% tall`
  : 'EMPTY';
const sel = wingsOnly ? ' · wings-only' : hideWings ? ' · body-only' : '';
console.log(`${name} · ${formName} · ${view}${pose ? ' · pose:' + pose : ''}${sel} — ${tris} tris · ${W}×${H} → ${cov} · widest gap ${gapPx}px`);
console.log(`wrote ${path} (${outW}×${outH})`);
