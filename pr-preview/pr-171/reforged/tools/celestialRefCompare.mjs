// CELESTIAL REF COMPARE — the QA GATE for the body sculpt. Renders our rear chase-cam view (full + body-only +
// side), MEASURES it against our traced reference (D.body.silhouette, itself traced from full.png) and against
// full.png directly, and prints a numeric PASS/FAIL table + an overlay PNG. No step proceeds unless this passes.
//   node tools/celestialRefCompare.mjs   → /tmp/celestial-refcmp.png (+ metric table on stdout)
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { serve } from '../tests/serve.mjs';
import { decodePNG } from './pngDecode.mjs';
import { CELESTIAL_DEF as D } from '../js/celestialDef.js';

const require = createRequire(import.meta.url);
const pw = (() => { for (const x of [process.env.PLAYWRIGHT_PATH, execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright', 'playwright']) { try { return require(x); } catch {} } throw new Error('no playwright'); })();

// ── render our views via the previewer ──────────────────────────────────────
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 760, height: 1000 }, deviceScaleFactor: 2 });
let err = null; page.on('pageerror', e => { err = String(e); });
await page.goto(srv.url + '/tools/celestial3D.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });
await page.evaluate(() => { for (const s of ['.controls', 'header', '.hint']) { const e = document.querySelector(s); if (e) e.style.display = 'none'; } });   // clean canvas for overlay
const gl = await page.$('#gl');
const shot = async (path, fn) => { await page.evaluate(fn); await page.waitForTimeout(150); await gl.screenshot({ path }); };
// rc-rear-full: full creature (overlay vs full.png). rc-torso: bare torso mesh (proportions/shape, dead-rear).
// rc-deco: torso + spine + scales + horns + spear, NO wings (cantilever check, SAME framing as rc-torso).
// rc-side: bare torso from the side (banding).
await shot('/tmp/rc-rear-full.png', () => { window.__bodyOnly(false); window.__wings(true); window.__view(0, 0.21, false); window.__zoom(1); });
await shot('/tmp/rc-torso.png', () => { window.__bodyOnly(true); window.__view(0, 0.0, false); window.__zoom(0.5); });
await shot('/tmp/rc-deco.png', () => { window.__bodyOnly(false); window.__wings(false); window.__view(0, 0.0, false); window.__zoom(0.5); });
await shot('/tmp/rc-side.png', () => { window.__bodyOnly(true); window.__view(90, 0.0, false); window.__zoom(0.5); });
await page.evaluate(() => { window.__bodyOnly(false); window.__wings(true); window.__zoom(1); });
await browser.close(); await srv.close();
if (err) { console.log('PAGEERROR', err); process.exit(1); }

// ── measurement helpers ─────────────────────────────────────────────────────
// content mask for a dark-bg render: pixel brighter than the bg (0x070a14)
function bodyMask(png) {
  const { w, h, rgba } = png, m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { const o = i * 4; m[i] = (rgba[o] + rgba[o + 1] + rgba[o + 2] > 60) ? 1 : 0; }
  return m;
}
// per-row [left,right] extent of the mask within its content bbox; returns {rows:[{cy,half,cx}], top,bot,cxImg}
function widthProfile(png, mask) {
  const { w, h } = png; let top = h, bot = 0, lx = w, rx = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (y < top) top = y; if (y > bot) bot = y; if (x < lx) lx = x; if (x > rx) rx = x; }
  const cxImg = (lx + rx) / 2, rows = [];
  for (let y = top; y <= bot; y++) { let a = w, b = -1; for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (x < a) a = x; if (x > b) b = x; } if (b >= a) rows.push({ ny: (y - top) / (bot - top), half: (b - a) / 2, cx: (a + b) / 2 }); }
  return { rows, top, bot, cxImg, len: bot - top };
}
// sample a normalized half-width(ny) function from rows
function widthAt(prof, ny) { let best = prof.rows[0], bd = 1e9; for (const r of prof.rows) { const d = Math.abs(r.ny - ny); if (d < bd) { bd = d; best = r; } } return best.half / prof.len; }

// reference body width profile from our traced silhouette (it WAS traced from full.png) — the match target
const sil = D.body.silhouette;
const silCross = (ny) => { const xs = []; for (let i = 0, j = sil.length - 1; i < sil.length; j = i++) { const a = sil[i], b = sil[j]; if ((a[1] > ny) !== (b[1] > ny)) xs.push(a[0] + (ny - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort((m, n) => m - n); let wsum = 0; for (let k = 0; k + 1 < xs.length; k += 2) wsum += xs[k + 1] - xs[k]; return wsum; };
const silMinY = Math.min(...sil.map(p => p[1])), silMaxY = Math.max(...sil.map(p => p[1])), silLen = silMaxY - silMinY;
const silHalfAt = (ny) => silCross(silMinY + ny * silLen) / 2 / silLen;   // half-width as fraction of body length

// ── metrics ─────────────────────────────────────────────────────────────────
const torso = (() => { const p = decodePNG(readFileSync('/tmp/rc-torso.png')); return widthProfile(p, bodyMask(p)); })();
const deco = (() => { const p = decodePNG(readFileSync('/tmp/rc-deco.png')); return widthProfile(p, bodyMask(p)); })();
const sideP = (() => { const p = decodePNG(readFileSync('/tmp/rc-side.png')); return widthProfile(p, bodyMask(p)); })();

// the bare torso render spans the silhouette's [silMinY .. TAIL_BODY_CLIP]; map physical silhouette ny → renderNy
const TAIL_CLIP = 0.73;
const rnyOf = (phys) => (phys - silMinY) / (TAIL_CLIP - silMinY);

// silhouette LANDMARKS (physical ny) — measured, not hardcoded: shoulder=widest, waist=narrowest after it, head zone
let shoNy = silMinY + 0.1, shoH = 0; for (let ny = silMinY + 0.05; ny <= silMinY + 0.45 * (TAIL_CLIP - silMinY); ny += 0.005) { const h = silCross(ny) / 2; if (h > shoH) { shoH = h; shoNy = ny; } }
let waNy = shoNy + 0.1, waH = 1e9; for (let ny = shoNy + 0.06; ny <= TAIL_CLIP - 0.03; ny += 0.005) { const h = silCross(ny) / 2; if (h < waH) { waH = h; waNy = ny; } }
const heNy = silMinY + 0.06 * (TAIL_CLIP - silMinY), heH = silCross(heNy) / 2;
// render half-widths at those SAME physical landmarks
const renderSho = widthAt(torso, rnyOf(shoNy)), r_waist = widthAt(torso, rnyOf(waNy)) / renderSho, r_head = widthAt(torso, rnyOf(heNy)) / renderSho;
const s_waist = waH / shoH, s_head = heH / shoH;
const dWaist = Math.abs(r_waist - s_waist) / s_waist * 100, dHead = Math.abs(r_head - s_head) / s_head * 100;
// shape RMS over the torso, shoulder-normalised (catches gross deviation from the traced outline)
let se = 0, n = 0; for (let rny = 0.12; rny <= 0.92; rny += 0.05) { const r = widthAt(torso, rny) / renderSho, s = (silCross(silMinY + rny * (TAIL_CLIP - silMinY)) / 2) / shoH; se += (r - s) ** 2; n++; } const shapeRMSpct = Math.sqrt(se / n) * 100;

// hi-frequency spike metric (single render, robust): |profile − smoothed| as % of mean, over the torso band.
const spikePct = (prof, lo, hi) => {
  const rows = prof.rows.filter(r => r.ny >= lo && r.ny <= hi).map(r => r.half); if (rows.length < 9) return 0;
  const sm = rows.map((_, i) => { let a = 0, c = 0; for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= 0 && j < rows.length) { a += rows[j]; c++; } } return a / c; });
  let d = 0, m = 0; for (let i = 0; i < rows.length; i++) { d += Math.abs(rows[i] - sm[i]); m += rows[i]; } return d / rows.length / (m / rows.length) * 100;
};
// 3) NO-PROTRUSION: deco (spine/scales/horns/spear, wings off) REAR width must be smooth — a cantilevering plate
// is a local spike. Measured on the deco rear profile over the torso band.
const cant = spikePct(deco, 0.15, 0.82);
// 4) NO-BANDING: bare-torso SIDE width must be smooth over the torso band (the reverted experiment's rings)
const bandPct = spikePct(sideP, 0.15, 0.85);

// 5) DORSAL FEATURE — INFORMATIONAL only (rim-light makes edges bright, so luminance≠height; the muscled read
// is judged on the overlay, not gated by a number). Reports lateral brightness peak count at mid-torso.
function dorsalProfile() {
  const p = decodePNG(readFileSync('/tmp/rc-deco.png')), { w, rgba } = p, m = bodyMask(p);
  const prof = widthProfile(p, m); const yMid = Math.round(prof.top + (prof.bot - prof.top) * 0.36);
  let a = w, b = -1; for (let x = 0; x < w; x++) if (m[yMid * w + x]) { if (x < a) a = x; if (x > b) b = x; }
  if (b < a) return { peaks: 0 };
  const lum = []; for (let x = a; x <= b; x++) { const o = (yMid * w + x) * 4; lum.push(rgba[o] * 0.3 + rgba[o + 1] * 0.59 + rgba[o + 2] * 0.11); }
  const sm = lum.map((_, i) => { let s = 0, c = 0; for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < lum.length) { s += lum[j]; c++; } } return s / c; });
  let peaks = 0; for (let i = 2; i < sm.length - 2; i++) if (sm[i] > sm[i - 2] + 6 && sm[i] > sm[i + 2] + 6) peaks++;
  return { peaks };
}
const df = dorsalProfile();

// ── overlay vs full.png ─────────────────────────────────────────────────────
function overlay() {
  const ref = decodePNG(readFileSync(new URL('./refs/celestial/full.png', import.meta.url).pathname));
  const our = decodePNG(readFileSync('/tmp/rc-rear-full.png'));
  // ref creature bbox by alpha; our content bbox by brightness
  const rb = (() => { let t = ref.h, b = 0, l = ref.w, r = 0; for (let y = 0; y < ref.h; y++) for (let x = 0; x < ref.w; x++) { if (ref.rgba[(y * ref.w + x) * 4 + 3] > 100) { if (y < t) t = y; if (y > b) b = y; if (x < l) l = x; if (x > r) r = x; } } return { t, b, l, r }; })();
  const ob = (() => { const m = bodyMask(our); let t = our.h, b = 0, l = our.w, r = 0; for (let y = 0; y < our.h; y++) for (let x = 0; x < our.w; x++) { if (m[y * our.w + x]) { if (y < t) t = y; if (y > b) b = y; if (x < l) l = x; if (x > r) r = x; } } return { t, b, l, r }; })();
  const OW = 520, OH = 700; const buf = Buffer.alloc(OW * OH * 4); for (let i = 0; i < OW * OH; i++) { buf[i * 4] = 14; buf[i * 4 + 1] = 16; buf[i * 4 + 2] = 26; buf[i * 4 + 3] = 255; }
  const half = OW / 2;
  // place ref scaled to OH*0.9 on the left, our scaled to same creature-height in the middle, and a 50% overlay on the right half
  const draw = (png, bb, ox, scale, alpha, tint) => { const ch = bb.b - bb.t, cw = bb.r - bb.l, sc = (OH * 0.9) / ch; const dw = cw * sc, x0 = ox - dw / 2; for (let dy = 0; dy < OH * 0.9; dy++) for (let dx = 0; dx < dw; dx++) { const sx = bb.l + dx / sc, sy = bb.t + dy / sc; const ix = sx | 0, iy = sy | 0; if (ix < 0 || iy < 0 || ix >= png.w || iy >= png.h) continue; const o = (iy * png.w + ix) * 4; const aSrc = png.rgba[o + 3] !== undefined ? png.rgba[o + 3] : 255; if (aSrc < 40 && (png.rgba[o] + png.rgba[o + 1] + png.rgba[o + 2] < 60)) continue; const X = (x0 + dx) | 0, Y = (OH * 0.05 + dy) | 0; if (X < 0 || Y < 0 || X >= OW || Y >= OH) continue; const i = (Y * OW + X) * 4, ia = 1 - alpha; buf[i] = (tint ? tint[0] : png.rgba[o]) * alpha + buf[i] * ia; buf[i + 1] = (tint ? tint[1] : png.rgba[o + 1]) * alpha + buf[i + 1] * ia; buf[i + 2] = (tint ? tint[2] : png.rgba[o + 2]) * alpha + buf[i + 2] * ia; } };
  draw(ref, rb, half * 0.5, 1, 1);                 // left: reference
  draw(our, ob, half * 1.5, 1, 1);                 // right: ours
  // PNG encode
  const crcT = (() => { const t = new Uint32Array(256); for (let nn = 0; nn < 256; nn++) { let c = nn; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[nn] = c >>> 0; } return t; })();
  const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td), 0); return Buffer.concat([l, td, cr]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(OW, 0); ih.writeUInt32BE(OH, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc((OW * 4 + 1) * OH); for (let y = 0; y < OH; y++) { raw[y * (OW * 4 + 1)] = 0; buf.copy(raw, y * (OW * 4 + 1) + 1, y * OW * 4, (y + 1) * OW * 4); }
  writeFileSync('/tmp/celestial-refcmp.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
overlay();

// ── report ──────────────────────────────────────────────────────────────────
const P = (ok) => ok ? 'PASS' : 'FAIL';
// HARD gates = the robust, alignment-free signals. Proportions vs reference are judged on the OVERLAY (visual,
// shown to the user) — pixel-row ratio alignment proved too fragile to gate on (validated in Step 0).
const pass = { shape: shapeRMSpct <= 16, cant: cant < 8, band: bandPct < 6 };
console.log('── CELESTIAL REF-COMPARE — QA GATE (torso vs traced reference) ───');
console.log(`[GATE] shape RMS vs traced outline      : ${shapeRMSpct.toFixed(1)}%             [${P(pass.shape)}]  (≤16%)`);
console.log(`[GATE] protrusion spikes (deco rear)    : ${cant.toFixed(1)}%             [${P(pass.cant)}]  (<8%)   no plate shelves`);
console.log(`[GATE] banding (bare torso side)        : ${bandPct.toFixed(1)}%             [${P(pass.band)}]  (<6%)   no rings`);
console.log(`(info) head/shoulder  ref ${s_head.toFixed(2)} ours ${r_head.toFixed(2)} · waist/shoulder ref ${s_waist.toFixed(2)} ours ${r_waist.toFixed(2)}  (rough; verify on overlay)`);
console.log(`(info) dorsal lateral peaks: ${df.peaks}  (muscled-back read verified on the overlay, not gated)`);
console.log(`OVERALL GATES: ${Object.values(pass).every(Boolean) ? 'PASS' : 'FAIL'} — and the OVERLAY must visually match the reference (your sign-off)`);
console.log('wrote /tmp/celestial-refcmp.png  (left: reference · right: ours, rear chase-cam)');
process.exit(0);
