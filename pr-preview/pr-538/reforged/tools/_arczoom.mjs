// Crop a region of a captured frame and nearest-neighbour upscale it for close inspection.
// node tools/_arczoom.mjs <src.png> <x> <y> <w> <h> <scale> <out.png>
import { readFileSync, writeFileSync } from 'node:fs';
import { decodePNG, pngRGBA } from './silhouetteCore.mjs';
const [src, X, Y, CW, CH, S, out] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], +process.argv[6], +process.argv[7], process.argv[8]];
const { w, h, rgba } = decodePNG(readFileSync(src));
const OW = CW * S, OH = CH * S, o = Buffer.alloc(OW * OH * 4);
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const sx = Math.min(w - 1, X + Math.floor(x / S)), sy = Math.min(h - 1, Y + Math.floor(y / S));
  const si = (sy * w + sx) * 4, di = (y * OW + x) * 4;
  o[di] = rgba[si]; o[di + 1] = rgba[si + 1]; o[di + 2] = rgba[si + 2]; o[di + 3] = 255;
}
writeFileSync(out, pngRGBA(OW, OH, o));
console.log(`wrote ${out} (${OW}x${OH}) from ${src} @${X},${Y} ${CW}x${CH} x${S}`);
