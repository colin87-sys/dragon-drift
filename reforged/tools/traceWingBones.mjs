// CELESTIAL STORM — WING BONE diagnostic v2. Isolates ONE wing, skeletonizes its ink, and marks the skeleton
// GRAPH: endpoints (degree 1 = bone tips / root) in RED, junctions (degree ≥3 = where bones meet) in CYAN with
// their degree. The true WRIST is the junction where the finger bones fan out. This is the ground truth to
// identify each digit against — no guessing.
//   node tools/traceWingBones.mjs   → /tmp/celestial-wingbones.png  (+ prints junctions/endpoints)
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { thin, skeletonToPolylines, lum } from './lineTrace.mjs';

const W = 941, H = 1672;
const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const { rgba } = decodePNG(readFileSync(DIR + 'stencil-wings.png'));
const ink = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4; ink[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < 200 ? 1 : 0; }

// morphology to isolate the RIGHT wing component
const morph = (m, n, grow) => { let cur = m; for (let it = 0; it < n; it++) { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = grow ? 0 : 1; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy, s = (nx >= 0 && ny >= 0 && nx < W && ny < H) ? cur[ny * W + nx] : 0; if (grow) { if (s) v = 1; } else if (!s) v = 0; } o[y * W + x] = v; } cur = o; } return cur; };
const dilate = (m, n) => morph(m, n, true), erode = (m, n) => morph(m, n, false);
function fillInside(seal) { const out = new Uint8Array(W * H), st = []; const push = (q) => { if (!seal[q] && !out[q]) { out[q] = 1; st.push(q); } }; for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); } while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; if (x) push(p - 1); if (x < W - 1) push(p + 1); if (y) push(p - W); if (y < H - 1) push(p + W); } const s = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) s[i] = out[i] ? 0 : 1; return s; }
const solid = erode(fillInside(dilate(ink, 2)), 2);
// largest two components → pick the right one
const lab = new Int32Array(W * H); let cur = 0; const comps = [];
for (let s = 0; s < W * H; s++) { if (!solid[s] || lab[s]) continue; cur++; const st = [s]; lab[s] = cur; let sz = 0, sx = 0; while (st.length) { const p = st.pop(); sz++; sx += p % W; const x = p % W, y = (p / W) | 0; const t = (q, ok) => { if (ok && solid[q] && !lab[q]) { lab[q] = cur; st.push(q); } }; if (x) t(p - 1, 1); if (x < W - 1) t(p + 1, 1); if (y) t(p - W, 1); if (y < H - 1) t(p + W, 1); } comps.push({ id: cur, sz, cx: sx / sz / W }); }
comps.sort((a, b) => b.sz - a.sz);
const right = comps.slice(0, 2).sort((a, b) => b.cx - a.cx)[0];   // larger-two, rightmost
const region = dilate((() => { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) m[i] = lab[i] === right.id ? 1 : 0; return m; })(), 3);
const wink = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) wink[i] = (ink[i] && region[i]) ? 1 : 0;
const sk = thin(wink, W, H);

// degree of each skeleton pixel (8-neighbourhood)
const deg = new Uint8Array(W * H);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (!sk[y * W + x]) continue; let d = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!(dx === 0 && dy === 0) && sk[(y + dy) * W + (x + dx)]) d++; deg[y * W + x] = d; }
// collect junctions (deg>=3) and endpoints (deg==1), clustering adjacent junction pixels
const ends = [], juncRaw = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!sk[y * W + x]) continue; if (deg[y * W + x] === 1) ends.push({ x, y }); else if (deg[y * W + x] >= 3) juncRaw.push({ x, y }); }
// merge junction pixels within 12px into clusters
const juncs = []; for (const j of juncRaw) { const near = juncs.find(c => Math.hypot(c.x - j.x, c.y - j.y) < 12); if (near) { near.x = (near.x * near.n + j.x) / (near.n + 1); near.y = (near.y * near.n + j.y) / (near.n + 1); near.n++; } else juncs.push({ x: j.x, y: j.y, n: 1 }); }
juncs.sort((a, b) => b.n - a.n);

// EXTRACT the actual drawn struts: skeleton MINUS the thin boundary outline = the internal finger bones,
// which lie exactly on the stencil lines (medial axis of the drawn ink). Thin band so the inner arm bone survives.
const rightMask = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) rightMask[i] = lab[i] === right.id ? 1 : 0;
const be = erode(rightMask, 3), bd = dilate(rightMask, 1);
const band = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) band[i] = (bd[i] && !be[i]) ? 1 : 0;   // ~4px outline ring
const internal = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) internal[i] = (sk[i] && !band[i]) ? 1 : 0;
const struts = skeletonToPolylines(internal, W, H, 14);
const slen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return s; };
struts.sort((a, b) => slen(b) - slen(a));
console.log(`internal struts (skeleton minus outline): ${struts.length}, lengths(px): ${struts.map(p => Math.round(slen(p))).join(', ')}`);
console.log(`right wing: ${ends.length} endpoints, ${juncs.length} junction-clusters`);
console.log('top junctions (x,y normalized · pixel-count = how many skeleton branches meet):');
juncs.slice(0, 8).forEach(j => console.log(`  (${(j.x / W).toFixed(3)}, ${(j.y / H).toFixed(3)})  weight ${j.n}`));
console.log('endpoints (normalized):'); ends.forEach(e => console.log(`  (${(e.x / W).toFixed(3)}, ${(e.y / H).toFixed(3)})`));

// ── render ───────────────────────────────────────────────────────────────
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let i = 0; i < W * H; i++) if (wink[i]) { const x = i % W, y = (i / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 24; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1, sc = Math.min(2.6, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) { const sx = minX + (rx / sc | 0), sy = minY + (ry / sc | 0), o = (ry * RW + rx) * 4; const g = ink[sy * W + sx] ? 74 : 14; buf[o] = g; buf[o + 1] = g + 4; buf[o + 2] = g + 14; buf[o + 3] = 255; }   // stencil ink (grey) only — struts overlaid on top
const blend = (px, py, c, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) { const x = (px | 0) + dx, y = (py | 0) + dy; if (x < 0 || y < 0 || x >= RW || y >= RH) continue; const i = (y * RW + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; } };
// extracted struts in orange — should sit exactly on the drawn stencil lines
const strokeLine = (pts, c, wd) => { for (let i = 0; i + 1 < pts.length; i++) { const A = pts[i], B = pts[i + 1], L = Math.hypot(B.x - A.x, B.y - A.y) * sc, st = Math.max(1, L | 0); for (let s = 0; s <= st; s++) { const t = s / st; blend((A.x + (B.x - A.x) * t - minX) * sc, (A.y + (B.y - A.y) * t - minY) * sc, c, wd); } } };
for (const p of struts) strokeLine(p, [255, 150, 40], 2);
blend((juncs[0].x - minX) * sc, (juncs[0].y - minY) * sc, [120, 255, 120], 8);   // wrist (dominant junction) = lime

const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-wingbones.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-wingbones.png (skeleton=cyan, endpoints=red, junctions=blue, biggest junction=lime)');
