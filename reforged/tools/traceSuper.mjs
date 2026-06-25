// CELESTIAL STORM — SUPERIMPOSE QA. Overlays the traced definition (celestialDef.js) on the ORIGINAL colour
// reference, scaled so the BODY head-to-tail length matches (= correct scale, the only honest way to compare),
// aligned on the long axis. Lets us judge: (a) where the wing sits ALONG the long axis, and (b) the wing's
// ORIENTATION (sweep angle) vs the reference. Reference head/tail are found on the central column (wing tips
// fan off to the sides, so they don't fool the head detection).
//   node tools/traceSuper.mjs   → /tmp/celestial-super.png  (+ prints metrics)
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { CELESTIAL_DEF as D } from '../js/celestialDef.js';

const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const W = D.canvas[0], H = D.canvas[1];
const full = decodePNG(readFileSync(DIR + 'full.png')).rgba;

// ── reference: subject mask, then head/tail on the CENTRAL column ────────────
const subj = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4, r = full[o], g = full[o + 1], b = full[o + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); subj[i] = (mx - mn > 22 || mx < 230) ? 1 : 0; }
const cbLo = Math.round(0.43 * W), cbHi = Math.round(0.57 * W);
let headY = H, tailY = 0, axisSx = 0, axisN = 0;
for (let y = 0; y < H; y++) for (let x = cbLo; x <= cbHi; x++) if (subj[y * W + x]) { if (y < headY) headY = y; if (y > tailY) tailY = y; axisSx += x; axisN++; }
const axisX = axisN ? axisSx / axisN : W / 2;
const refLen = tailY - headY;

// ── def: body head/tail (body only — wings are separate) ─────────────────────
const bys = D.body.silhouette.map(p => p[1]);
const bMinY = Math.min(...bys), bMaxY = Math.max(...bys);
// uniform scale (canvas-px space) so def body head-to-tail == reference head-to-tail; align heads on the axis
const k = refLen / ((bMaxY - bMinY) * H);
const M = (p) => ({ x: axisX + (p[0] * W - 0.5 * W) * k, y: headY + (p[1] * H - bMinY * H) * k });

// ── crop to the union (reference subject + mapped def), render ────────────────
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (subj[y * W + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
const pad = 30; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad);
const cw = maxX - minX + 1, ch = maxY - minY + 1;
const sc = Math.min(2.0, 1300 / ch), RW = Math.round(cw * sc), RH = Math.round(ch * sc);
const buf = Buffer.alloc(RW * RH * 4);
for (let ry = 0; ry < RH; ry++) for (let rx = 0; rx < RW; rx++) {
  const sx = minX + Math.floor(rx / sc), sy = minY + Math.floor(ry / sc), si = (sy * W + sx) * 4, o = (ry * RW + rx) * 4;
  buf[o] = full[si] * 0.5 + 8; buf[o + 1] = full[si + 1] * 0.5 + 9; buf[o + 2] = full[si + 2] * 0.5 + 16; buf[o + 3] = 255;
}
const PX = (p) => (p.x - minX) * sc, PY = (p) => (p.y - minY) * sc;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function stroke(pts, col, wd, closed) { const P = pts.map(M).map(p => [PX(p), PY(p)]); if (closed) P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, col, 1); } } }
function dot(p, col, r) { const x = PX(M(p)) | 0, y = PY(M(p)) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) blend(x + dx, y + dy, col, 1); }

const mir = (p) => [2 * D.mirror - p[0], p[1]];
// long axis (white, head→tail) so wing position relative to it is obvious
{ const ax = PX({ x: axisX, y: 0 }); for (let yy = PY({ x: 0, y: headY }); yy <= PY({ x: 0, y: tailY }); yy += 6) for (let t = 0; t < 3; t++) blend(ax, yy + t, [255, 255, 255], 0.5); }
stroke(D.body.silhouette, [120, 255, 120], 2.0, true);
for (const m of [false, true]) { const f = (c) => m ? c.map(mir) : c; stroke(f(D.wing.silhouette), [90, 220, 255], 2.0, true); for (const s of D.wing.struts) stroke(f(s), [255, 170, 70], 1.0, false); }

// ── metrics: wing-root position along axis + leading-edge sweep angle ─────────
let root = D.wing.silhouette[0]; for (const p of D.wing.silhouette) if (p[0] < root[0]) root = p; // innermost (root touches axis)
let tip = D.wing.silhouette[0]; for (const p of D.wing.silhouette) if (p[1] < tip[1]) tip = p; // highest point = leading-edge tip
const rootPct = ((root[1] - bMinY) / (bMaxY - bMinY) * 100).toFixed(0);
const tipPct = ((tip[1] - bMinY) / (bMaxY - bMinY) * 100).toFixed(0);
// sweep angle of the leading edge (root→tip), measured from the long axis (0deg = straight up)
const dx = (tip[0] - root[0]) * W, dy = (tip[1] - root[1]) * H;
const sweep = (Math.atan2(dx, -dy) * 180 / Math.PI).toFixed(0);

const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-super.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
// ── REFERENCE wing tip (highest subject pixel in the outer-left region) for an apples-to-apples compare ──
let rtx = 0, rty = H; for (let y = 0; y < H; y++) for (let x = 0; x < axisX - 0.10 * W; x++) if (subj[y * W + x] && y < rty) { rty = y; rtx = x; }
const refTipOut = ((axisX - rtx) / refLen * 100).toFixed(0);      // outward distance, % of body length
const refTipY = ((rty - headY) / refLen * 100).toFixed(0);        // height, % down from head (neg = above head)
const defTipOut = (Math.abs(tip[0] - 0.5) * W / ((bMaxY - bMinY) * H) * 100).toFixed(0);
console.log(`superimposed at matched scale → /tmp/celestial-super.png`);
console.log(`  reference head→tail = ${refLen}px  (axisX=${axisX.toFixed(0)})`);
console.log(`  DEF wing: root ${rootPct}% down · tip ${tipPct}% (neg=above head) · tip ${defTipOut}% out · leading-edge sweep ${sweep}° from axis`);
console.log(`  REF wing: tip ${refTipY}% (neg=above head) · tip ${refTipOut}% out`);
console.log(`  → match target: def tip should land near REF tip (${refTipY}% down, ${refTipOut}% out)`);
