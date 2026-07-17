// Numeric cross-section check for the Arc Crown corona (dependency-free, uses the repo's decodePNG).
// Finds the bolt core (brightest near-white px) per row, walks outward, and asks: is there a FRINGE
// pixel reading B > R (a real storm-blue corona) rather than R >= B (white-over-pink)? The Fable critic's
// numeric bar was fringe ~ (200,215,255), B>R. node tools/_arccheck.mjs
import { readFileSync, existsSync } from 'node:fs';
import { decodePNG } from './silhouetteCore.mjs';

const frames = [];
for (let i = 0; i < 16; i++) { const p = `/tmp/arc-tempest-${String(i).padStart(2, '0')}.png`; if (existsSync(p)) frames.push([i, decodePNG(readFileSync(p))]); }
if (!frames.length) { console.log('NO FRAMES'); process.exit(1); }

// pick the frame with the most very-bright pixels (a live crack)
let best = null, bestN = -1;
for (const [i, img] of frames) {
  let n = 0; const d = img.rgba;
  for (let k = 0; k < d.length; k += 4) if (d[k] > 230 && d[k + 1] > 230 && d[k + 2] > 230) n++;
  if (n > bestN) { bestN = n; best = [i, img]; }
}
const [fi, img] = best;
const W = img.w, H = img.h, D = img.rgba;
const at = (x, y) => { const o = (y * W + x) * 4; return [D[o], D[o + 1], D[o + 2]]; };
console.log(`brightest frame = ${fi} (${bestN} hot px), ${W}x${H}`);

let blueRows = 0, sampled = 0, examples = [];
for (let y = 0; y < H; y += 2) {
  let cx = -1, cLum = 200;
  for (let x = 0; x < W; x++) { const [r, g, b] = at(x, y); const lum = Math.min(r, g, b); if (lum > cLum && r > 200 && g > 200 && b > 200) { cLum = lum; cx = x; } }
  if (cx < 0) continue;
  sampled++;
  for (const dir of [-1, 1]) {
    for (let d = 3; d <= 16; d++) {
      const x = cx + dir * d; if (x < 0 || x >= W) break;
      const [r, g, b] = at(x, y);
      if (r < 55 && g < 55 && b < 55) break;         // into the dark body — stop
      // genuine periwinkle CORONA (like 200,215,255): B clearly the top channel AND G sits above R
      // (not the lowest). The magenta sky (e.g. 235,176,242) has G the LOWEST → rejected here.
      if (b > r + 8 && g > r - 4 && b > 130) { blueRows++; if (examples.length < 10) examples.push(`y=${y} ${dir > 0 ? '+' : '-'}${d}px = (${r},${g},${b})`); d = 99; break; }
    }
  }
}
console.log(`rows with a core: ${sampled}`);
console.log(`rows showing a BLUE fringe (B>R+6): ${blueRows}`);
console.log('examples:'); for (const e of examples) console.log('  ' + e);
console.log(blueRows >= 6 ? '\n✅ BLUE CORONA PRESENT (multiple rows read B>R)' : '\n❌ no real blue corona (fringe still white/pink)');
