// Standalone 8-bit PNG decoder (colortype 2/6, non-interlaced) → {w,h,rgba}.
// Decoupled from silhouetteCore (which pulls in three + the roster at import).
import { inflateSync } from 'node:zlib';

export function decodePNG(buf) {
  let p = 8, w = 0, h = 0, ct = 0, bd = 0;
  const idat = [];
  let trns = null, palette = null;
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
    else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : ct === 0 ? 1 : 1;  // bytes/px (pre-palette)
  const stride = w * ch;
  const out = Buffer.alloc(w * h * 4);
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  const pae = (a, b, c) => { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let i = 0; i < stride; i++) {
      const x = raw[rp++]; const a = i >= ch ? cur[i - ch] : 0; const b = prev[i]; const c = i >= ch ? prev[i - ch] : 0;
      let v; if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1); else v = x + pae(a, b, c);
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (ct === 2) { out[o] = cur[x * 3]; out[o + 1] = cur[x * 3 + 1]; out[o + 2] = cur[x * 3 + 2]; out[o + 3] = 255; }
      else if (ct === 6) { out[o] = cur[x * 4]; out[o + 1] = cur[x * 4 + 1]; out[o + 2] = cur[x * 4 + 2]; out[o + 3] = cur[x * 4 + 3]; }
      else if (ct === 0) { out[o] = out[o + 1] = out[o + 2] = cur[x]; out[o + 3] = 255; }
    }
    cur.copy(prev);
  }
  return { w, h, rgba: out, colorType: ct };
}
