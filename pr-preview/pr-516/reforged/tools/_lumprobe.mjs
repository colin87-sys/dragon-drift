// Tiny PNG luminance sampler (pure node, zlib built-in) — the two-shelf NUMERIC gate (Fable audit build-step 5):
// sample rendered luminance in labelled rectangles of a capture so the value targets are verified with numbers,
// not eyeballs. Usage: node tools/_lumprobe.mjs <png> <x0,y0,x1,y1:label> [<x0,y0,x1,y1:label> ...]
// Coords are FRACTIONS of width/height (0..1) so they're resolution-independent. L = 0.2126R+0.7152G+0.0722B.
import { readFileSync } from 'fs';
import { inflateSync } from 'zlib';

function decodePNG(buf) {
  let p = 8; // skip signature
  let w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8); const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 4;
  if (bitDepth !== 8) throw new Error('only 8-bit PNG supported, got ' + bitDepth);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  const paeth = (a, b, c) => { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const rowIn = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const rowOut = out.subarray(y * stride, y * stride + stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? rowOut[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = rowIn[x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1; else if (ft === 4) v += paeth(a, b, c);
      rowOut[x] = v & 0xff;
    }
  }
  return { w, h, channels, data: out };
}

const file = process.argv[2];
const img = decodePNG(readFileSync(file));
const { w, h, channels, data } = img;
console.log(`${file}  ${w}x${h} ch${channels}`);
for (const spec of process.argv.slice(3)) {
  const [rect, label] = spec.split(':');
  const [fx0, fy0, fx1, fy1] = rect.split(',').map(Number);
  const x0 = Math.round(fx0 * w), y0 = Math.round(fy0 * h), x1 = Math.round(fx1 * w), y1 = Math.round(fy1 * h);
  let sum = 0, n = 0, mn = 1, mx = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * w + x) * channels;
    const L = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
    sum += L; n++; if (L < mn) mn = L; if (L > mx) mx = L;
  }
  console.log(`  ${(label || rect).padEnd(22)} L=${(sum / n).toFixed(3)}  [min ${mn.toFixed(3)} max ${mx.toFixed(3)}]  (${n}px)`);
}
