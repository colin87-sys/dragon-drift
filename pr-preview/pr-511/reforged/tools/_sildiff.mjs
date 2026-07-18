// TEMP sil-rear diff — compares two grayscale silhouette PNGs (same dims) and
// reports the fraction of pixels whose filled/empty state differs (the outline
// change). Used for the CP3 "amplify, don't redesign" acceptance test.
//   node tools/_sildiff.mjs <before.png> <after.png>
import { readFileSync } from 'node:fs';
import { decodePNG } from './silhouetteCore.mjs';
const [a, b] = process.argv.slice(2);
const A = decodePNG(readFileSync(a)), B = decodePNG(readFileSync(b));
if (A.w !== B.w || A.h !== B.h) { console.log(`DIM MISMATCH ${A.w}x${A.h} vs ${B.w}x${B.h}`); process.exit(1); }
const on = (d, i) => (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) > 40 ? 1 : 0;
let diff = 0, aOn = 0, bOn = 0, both = 0;
for (let p = 0; p < A.w * A.h; p++) {
  const av = on(A.rgba, p * 4), bv = on(B.rgba, p * 4);
  if (av) aOn++; if (bv) bOn++; if (av && bv) both++;
  if (av !== bv) diff++;
}
const tot = A.w * A.h;
const iou = both / (aOn + bOn - both || 1);
console.log(`px ${tot}  before-on ${aOn}  after-on ${bOn}  changed ${diff} (${(100 * diff / tot).toFixed(3)}% of frame, ${(100 * diff / (aOn || 1)).toFixed(2)}% of silhouette)  IoU ${(100 * iou).toFixed(2)}%`);
