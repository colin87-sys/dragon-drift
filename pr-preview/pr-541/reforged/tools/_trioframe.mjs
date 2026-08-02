// One-off CP2 trio black-fill frame: ember (new) beside merged azure, shipped jade,
// and the nearest roster neighbors (obsidian, fire) — same view/tool, side-by-side,
// so the gate can judge distinctness of body plan AND wing silhouette.
import { writeFileSync } from 'node:fs';
import { renderSilhouette, pngGray } from './silhouetteCore.mjs';

const keys = ['ember', 'azure', 'jade', 'obsidian', 'fire'];
const view = process.argv[2] || 'threeq';
const CW = 480, CH = 440, pad = 12;
const cells = keys.map((key) => renderSilhouette({ key, view, W: CW, H: CH }));
const W = CW * keys.length + pad * (keys.length + 1);
const H = CH + pad * 2;
const out = new Uint8Array(W * H).fill(0x12);
for (let i = 0; i < cells.length; i++) {
  const { buf } = cells[i];
  const ox = pad + i * (CW + pad), oy = pad;
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++)
      out[(oy + y) * W + (ox + x)] = buf[y * CW + x];
}
writeFileSync(`/tmp/trio-${view}.png`, Buffer.from(pngGray(W, H, out)));
console.log(`wrote /tmp/trio-${view}.png  (${keys.join(' | ')})`);
