// CELESTIAL STORM — full TRACE DEFINITION (silhouette + internal structure), the input for the 3D build.
//
// Beyond the outer silhouette (traceStencil.mjs), this extracts the INTERNAL geometry the human asked for:
//   BODY  — outer silhouette + every individual ARMOUR PLATE / spinal segment + the trident tail (cells).
//   WING  — outer silhouette + finger STRUTS (skeleton of the stencil line-art) + lightning VEINS (skeleton
//           of the bright-cyan accents in the COLOUR reference). Traced on ONE wing, MIRRORED across x=0.5.
// Spine layer is intentionally DROPPED (the human flagged it wrong).
//
//   node tools/traceDefinition.mjs           → /tmp/celestial-def.png   (composite preview, cropped, hi-res)
//   node tools/traceDefinition.mjs --emit      → js/celestialDef.js (normalized definition data)
//
// Uses tools/lineTrace.mjs (thinning + skeleton→polylines + resampling). Pure node; standalone PNG encode.

import { writeFileSync, readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { decodePNG } from './pngDecode.mjs';
import { traceContour } from './tracerCore.mjs';
import { thin, skeletonToPolylines, smoothOpen, resampleOpen, smoothRing, resampleClosed, lum } from './lineTrace.mjs';

const DIR = new URL('./refs/celestial/', import.meta.url).pathname;
const load = (n) => decodePNG(readFileSync(DIR + n + '.png'));
const args = process.argv.slice(2);
const emit = args.includes('--emit');

const W = 941, H = 1672;

// ── masks + morphology ──────────────────────────────────────────────────────
const inkMask = (rgba, thr = 200) => { const m = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) { const o = i * 4; m[i] = lum(rgba[o], rgba[o + 1], rgba[o + 2]) < thr ? 1 : 0; } return m; };
function morph(mask, iters, grow) {
  let cur = mask;
  for (let it = 0; it < iters; it++) { const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = grow ? 0 : 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; const inb = nx >= 0 && ny >= 0 && nx < W && ny < H; const s = inb ? cur[ny * W + nx] : 0; if (grow) { if (s) v = 1; } else { if (!s) v = 0; } } out[y * W + x] = v; } cur = out; }
  return cur;
}
const dilate = (m, n = 1) => morph(m, n, true);
const erode = (m, n = 1) => morph(m, n, false);
function fillInside(sealed) {
  const out = new Uint8Array(W * H); const st = [];
  const push = (q) => { if (!sealed[q] && !out[q]) { out[q] = 1; st.push(q); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; if (x) push(p - 1); if (x < W - 1) push(p + 1); if (y) push(p - W); if (y < H - 1) push(p + W); }
  const solid = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) solid[i] = out[i] ? 0 : 1; return solid;
}
function components(mask, keep, minPx) {
  const lab = new Int32Array(W * H), sizes = [0]; let cur = 0;
  for (let s = 0; s < W * H; s++) { if (!mask[s] || lab[s]) continue; cur++; let sz = 0; const st = [s]; lab[s] = cur; while (st.length) { const p = st.pop(); sz++; const x = p % W, y = (p / W) | 0; const tp = (q, ok) => { if (ok && mask[q] && !lab[q]) { lab[q] = cur; st.push(q); } }; if (x) tp(p - 1, 1); if (x < W - 1) tp(p + 1, 1); if (y) tp(p - W, 1); if (y < H - 1) tp(p + W, 1); } sizes[cur] = sz; }
  let ids = sizes.map((sz, id) => ({ sz, id })).slice(1).filter(o => o.sz > minPx).sort((a, b) => b.sz - a.sz);
  if (keep) ids = ids.slice(0, keep);
  return ids.map(({ id }) => { const out = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) out[i] = lab[i] === id ? 1 : 0; return out; });
}
const centroidX = (m) => { let sx = 0, n = 0; for (let i = 0; i < W * H; i++) if (m[i]) { sx += i % W; n++; } return n ? sx / n / W : 0.5; };
// bbox of a list of {x,y} points (normalized)
function bboxPts(pts) { let minX = 1, minY = 1, maxX = 0, maxY = 0; for (const p of pts) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; } return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY }; }
const norm = (p) => ({ x: p.x / W, y: p.y / H });
// single light smoothing pass keeps sharp tips (horns / wing tip / trident prongs) while de-staircasing
const closed = (mask, n) => resampleClosed(smoothRing(traceContour(mask, W, H), 2), n).map(norm);

// ── BODY: silhouette + armour-plate cells + trident ─────────────────────────
const bink = inkMask(load('stencil-body').rgba);
const bsolid = erode(fillInside(dilate(bink, 2)), 2);
const bodySilhouetteRaw = closed(components(bsolid, 1, 5000)[0], 360);
// interior cells: components of NON-(sealed ink) that don't touch the border
const bsealed = dilate(bink, 1);
const lab = new Int32Array(W * H), border = [false]; let cur = 0;
for (let s = 0; s < W * H; s++) { if (bsealed[s] || lab[s]) continue; cur++; let bd = false; const st = [s]; lab[s] = cur; while (st.length) { const p = st.pop(); const x = p % W, y = (p / W) | 0; if (!x || !y || x === W - 1 || y === H - 1) bd = true; const tp = (q, ok) => { if (ok && !bsealed[q] && !lab[q]) { lab[q] = cur; st.push(q); } }; if (x) tp(p - 1, 1); if (x < W - 1) tp(p + 1, 1); if (y) tp(p - W, 1); if (y < H - 1) tp(p + W, 1); } border[cur] = bd; }
const cellSizes = new Int32Array(cur + 1); for (let i = 0; i < W * H; i++) if (lab[i]) cellSizes[lab[i]]++;
const plates = [];
for (let id = 1; id <= cur; id++) {
  if (border[id] || cellSizes[id] < 300) continue;
  const cm = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) cm[i] = lab[i] === id ? 1 : 0;
  const ring = traceContour(dilate(cm, 1), W, H);            // dilate 1 to span the ink gap to the true edge
  let per = 0; for (let i = 1; i < ring.length; i++) per += Math.hypot(ring[i].x - ring[i - 1].x, ring[i].y - ring[i - 1].y);
  const np = Math.max(12, Math.min(40, Math.round(per / 9)));
  plates.push({ pts: resampleClosed(smoothRing(ring, 2), np).map(norm), cx: centroidX(cm), cy: (() => { let sy = 0, n = 0; for (let i = 0; i < W * H; i++) if (cm[i]) { sy += (i / W) | 0; n++; } return sy / n / H; })() });
}
plates.sort((a, b) => a.cy - b.cy);

// ── WING: one side's silhouette + struts (stencil) + veins (colour) ─────────
const wink = inkMask(load('stencil-wings').rgba);
const wsolidAll = erode(fillInside(dilate(wink, 2)), 2);
const wings2 = components(wsolidAll, 2, 4000);
const rightSolid = centroidX(wings2[0]) > 0.5 ? wings2[0] : wings2[1];
const region = dilate(rightSolid, 6);                          // selector for the right wing's internal lines
const wingSilhouetteRaw = closed(rightSolid, 320);
// STRUTS — from the FULL skeleton of the right wing so struts + outline share junctions (they line up by
// construction and every strut reaches the membrane edge). Keep short branches (wrist/thumb horns). Drop only
// the polylines that ARE the outline (mostly inside the boundary band); internal finger-spokes survive whole.
const wskel = thin(wink, W, H);
const rightSkel = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) rightSkel[i] = (wskel[i] && region[i]) ? 1 : 0;
const bE = erode(rightSolid, 4), bD = dilate(rightSolid, 2);
const wband = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) wband[i] = (bD[i] && !bE[i]) ? 1 : 0;  // ~6px ring straddling the outline
const sampleBand = (x, y) => wband[Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))];
const plen = (p) => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y); return s; };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const allWingPolys = skeletonToPolylines(rightSkel, W, H, 10);
const strutsRaw = allWingPolys
  .filter((p) => (p.reduce((s, q) => s + (sampleBand(q.x, q.y) ? 1 : 0), 0) / p.length) < 0.6)  // not an outline chain
  .map((p) => resampleOpen(smoothOpen(p, 1), clamp(Math.round(plen(p) / 8), 6, 32)).map(norm));

// ── PLACE the wing onto the body, MATCHED to the colour reference ────────────
// The stencils are NOT in the body's frame, so the wing is placed explicitly AND auto-fitted to the art:
// anchor the ROOT at the shoulder (WING_ATTACH_Y down the body) and rotate+uniform-scale (about the root, so
// no distortion) so the wing TIP lands on the REFERENCE wing tip — matching span AND sweep angle. The dials
// below are manual nudges on top of that fit.
const WING_ATTACH_Y = 0.18;   // wing-root height as a fraction down the body (shoulder, just below the neck)
const WING_SCALE = 1.0;       // span multiplier on top of the reference fit (1 = match the art)
const WING_SWEEP_ADJ = 0;     // sweep nudge in degrees (+ = more up & out)
// reference wing tip: highest subject pixel in the outer-left column; central head/tail axis for scale
const fr = load('full').rgba;
const subj = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) { const o = i * 4, r = fr[o], g = fr[o + 1], b = fr[o + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); subj[i] = (mx - mn > 22 || mx < 230) ? 1 : 0; }
const cbLo = Math.round(0.43 * W), cbHi = Math.round(0.57 * W);
let rHeadY = H, rTailY = 0; for (let y = 0; y < H; y++) for (let x = cbLo; x <= cbHi; x++) if (subj[y * W + x]) { if (y < rHeadY) rHeadY = y; if (y > rTailY) rTailY = y; }
let axSx = 0, axN = 0; for (let y = rHeadY; y <= rTailY; y++) for (let x = cbLo; x <= cbHi; x++) if (subj[y * W + x]) { axSx += x; axN++; }
const axisX = axN ? axSx / axN : W / 2, refLen = rTailY - rHeadY;
let rtx = 0, rty = H; for (let y = 0; y < H; y++) for (let x = 0; x < axisX - 0.10 * W; x++) if (subj[y * W + x] && y < rty) { rty = y; rtx = x; }
const refTipOutF = (axisX - rtx) / refLen, refTipUpF = (rHeadY - rty) / refLen;
// raw wing root (innermost) + tip (highest), and a rotate+scale that maps root→tip onto the reference target
const bodyBox = bboxPts(bodySilhouetteRaw);
let wingRoot = wingSilhouetteRaw[0]; for (const p of wingSilhouetteRaw) if (p.x < wingRoot.x) wingRoot = p;
let wingTip = wingSilhouetteRaw[0]; for (const p of wingSilhouetteRaw) if (p.y < wingTip.y) wingTip = p;
const bodyLenPx = bodyBox.h * H, rootNY = bodyBox.minY + WING_ATTACH_Y * bodyBox.h;
const vx = (wingTip.x - wingRoot.x) * W, vy = (wingTip.y - wingRoot.y) * H;       // current root→tip (px)
const tgtX = refTipOutF * bodyLenPx, tgtY = -(refTipUpF + WING_ATTACH_Y) * bodyLenPx;  // target root→tip (px)
const fit = WING_SCALE * Math.hypot(tgtX, tgtY) / Math.hypot(vx, vy);
const th = Math.atan2(tgtY, tgtX) - Math.atan2(vy, vx) + WING_SWEEP_ADJ * Math.PI / 180;
const cs = Math.cos(th) * fit, sn = Math.sin(th) * fit;
const place = (p) => { const rx = (p.x - wingRoot.x) * W, ry = (p.y - wingRoot.y) * H; return { x: (0.5 * W + rx * cs - ry * sn) / W, y: (rootNY * H + rx * sn + ry * cs) / H }; };

const bodySilhouette = bodySilhouetteRaw;
const wingSilhouette = wingSilhouetteRaw.map(place);
const struts = strutsRaw.map((s) => s.map(place));
const veins = [];   // DROPPED — the cyan trace produced stray horizontal fragments, not real veins. In 3D the
                    // veins become an emissive glow generated ALONG the struts (the original brief's intent).

// ── labeled sub-parts for the 3D build ──────────────────────────────────────
// HEAD + HORNS: the body above the NECK (narrowest row in the upper third). The head outline arc lets the 3D
// build raise a snout; the two horn tips are the highest silhouette point on each side of the head.
const rowW = new Float32Array(H); let bTop = H, bBot = 0;
for (let y = 0; y < H; y++) { let mnx = W, mxx = -1; for (let x = 0; x < W; x++) if (bsolid[y * W + x]) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; } if (mxx >= 0) { rowW[y] = mxx - mnx; if (y < bTop) bTop = y; if (y > bBot) bBot = y; } }
const span = bBot - bTop;
let neckY = bTop, neckW = 1e9; for (let y = Math.round(bTop + span * 0.06); y < bTop + span * 0.33; y++) if (rowW[y] > 0 && rowW[y] < neckW) { neckW = rowW[y]; neckY = y; }
const neckYn = neckY / H;
const headPts = bodySilhouette.filter((p) => p.y <= neckYn);
const headTopY = Math.min(...headPts.map((p) => p.y));
const lH = headPts.filter((p) => p.x < 0.5).reduce((a, p) => (p.y < a.y ? p : a), { x: 0.5, y: 1 });
const rH = headPts.filter((p) => p.x >= 0.5).reduce((a, p) => (p.y < a.y ? p : a), { x: 0.5, y: 1 });
const head = { neckY: neckYn, topY: headTopY, outline: headPts, horns: [lH, rH] };
// WING ARM-SPAR: the strut whose far end reaches closest to the wing TIP = the leading-edge arm bone.
const wTipP = wingSilhouette.reduce((a, p) => (p.y < a.y ? p : a), { x: 0.5, y: 1 });
let sparIndex = -1, sparD = 1e9;
struts.forEach((s, i) => { const e = s.reduce((a, p) => (p.y < a.y ? p : a), { x: 0.5, y: 1 }); const d = Math.hypot(e.x - wTipP.x, e.y - wTipP.y); if (d < sparD) { sparD = d; sparIndex = i; } });
console.log(`HEAD  neck@${neckYn.toFixed(3)} · ${headPts.length}-pt outline · horns L(${lH.x.toFixed(2)},${lH.y.toFixed(2)}) R(${rH.x.toFixed(2)},${rH.y.toFixed(2)})   WING arm-spar = strut #${sparIndex}`);

const totalBody = bodySilhouette.length + plates.reduce((s, p) => s + p.pts.length, 0);
const totalWing = wingSilhouette.length + struts.reduce((s, p) => s + p.length, 0) + veins.reduce((s, p) => s + p.length, 0);
console.log(`BODY  silhouette ${bodySilhouette.length} pts · ${plates.length} armour plates (incl. trident) · ${totalBody} verts`);
console.log(`WING  silhouette ${wingSilhouette.length} pts · ${struts.length} struts · ${veins.length} veins · ${totalWing} verts (×2 mirrored)`);

const DEF = {
  canvas: [W, H], source: 'stencil+colour', mirror: 0.5,
  body: { silhouette: bodySilhouette, plates: plates.map(p => p.pts), head },
  wing: { side: 'right', silhouette: wingSilhouette, struts, veins, sparIndex },
};

// ── render composite preview (cropped, hi-res) ──────────────────────────────
const mirX = (c) => c.map((p) => ({ x: 1 - p.x, y: p.y }));
const allWing = [DEF.wing.silhouette, ...DEF.wing.struts, ...DEF.wing.veins];
let mnX = 1, mnY = 1, mxX = 0, mxY = 0;
for (const c of [DEF.body.silhouette, ...allWing, ...allWing.map(mirX)]) for (const p of c) { if (p.x < mnX) mnX = p.x; if (p.x > mxX) mxX = p.x; if (p.y < mnY) mnY = p.y; if (p.y > mxY) mxY = p.y; }
const pad = 0.02; mnX = Math.max(0, mnX - pad); mnY = Math.max(0, mnY - pad); mxX = Math.min(1, mxX + pad); mxY = Math.min(1, mxY + pad);
const aspect = ((mxX - mnX) * W) / ((mxY - mnY) * H);
const RH = 1100, RW = Math.round(RH * aspect);
const buf = Buffer.alloc(RW * RH * 4); for (let i = 0; i < RW * RH; i++) { buf[i * 4] = 9; buf[i * 4 + 1] = 11; buf[i * 4 + 2] = 22; buf[i * 4 + 3] = 255; }
const SXp = (nx) => ((nx - mnX) / (mxX - mnX)) * RW, SYp = (ny) => ((ny - mnY) / (mxY - mnY)) * RH;
function blend(x, y, c, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= RW || y >= RH) return; const i = (y * RW + x) * 4, ia = 1 - a; buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia; }
function fill(c, col, a = 1) { const P = c.map(p => [SXp(p.x), SYp(p.y)]); let mY = 1e9, MY = -1e9; for (const p of P) { if (p[1] < mY) mY = p[1]; if (p[1] > MY) MY = p[1]; } for (let y = Math.max(0, mY | 0); y <= Math.min(RH - 1, MY | 0); y++) { const xs = []; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a2 = P[i], b = P[j]; if ((a2[1] > y) !== (b[1] > y)) xs.push(a2[0] + (y - a2[1]) / (b[1] - a2[1]) * (b[0] - a2[0])); } xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = xs[k] | 0; x <= (xs[k + 1] | 0); x++) blend(x, y, col, a); } }
function stroke(c, col, wd, a = 1, close = false) { const P = c.map(p => [SXp(p.x), SYp(p.y)]); if (close) P.push(P[0]); for (let i = 0; i + 1 < P.length; i++) { const A = P[i], B = P[i + 1]; const len = Math.hypot(B[0] - A[0], B[1] - A[1]); const steps = Math.max(1, len | 0); for (let s = 0; s <= steps; s++) { const t = s / steps, px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t; for (let dy = -wd; dy <= wd; dy++) for (let dx = -wd; dx <= wd; dx++) if (dx * dx + dy * dy <= wd * wd) blend(px + dx, py + dy, col, a); } } }
function dots(c, col, r = 2) { for (const p of c) { const x = SXp(p.x) | 0, y = SYp(p.y) | 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) blend(x + dx, y + dy, col, 1); } }

// body fill + plate outlines
fill(DEF.body.silhouette, [40, 34, 74]); stroke(DEF.body.silhouette, [10, 12, 20], 2, 1, true);
for (const pl of DEF.body.plates) stroke(pl, [120, 150, 210], 1, 0.85, true);
// wings (both): fill + outline, then struts (cyan) + veins (magenta)
for (const sil of [DEF.wing.silhouette, mirX(DEF.wing.silhouette)]) { fill(sil, [58, 30, 96], 0.96); stroke(sil, [10, 12, 20], 2, 1, true); }
for (const st of [...DEF.wing.struts, ...DEF.wing.struts.map(mirX)]) stroke(st, [120, 210, 255], 1.4, 0.95);
for (const vn of [...DEF.wing.veins, ...DEF.wing.veins.map(mirX)]) stroke(vn, [255, 110, 235], 1.4, 0.95);
// plate centroid dots to show segment count
dots(DEF.body.plates.map(p => p.reduce((a, q) => ({ x: a.x + q.x / p.length, y: a.y + q.y / p.length }), { x: 0, y: 0 })), [255, 220, 90], 3);
// labeled parts: head outline (lime) + horn tips (red), wing arm-spar (bright cyan, thick) both sides
stroke(DEF.body.head.outline, [120, 255, 140], 2, 0.95);
dots(DEF.body.head.horns, [255, 70, 70], 5);
if (DEF.wing.sparIndex >= 0) for (const sp of [DEF.wing.struts[DEF.wing.sparIndex], mirX(DEF.wing.struts[DEF.wing.sparIndex])]) stroke(sp, [150, 255, 255], 2.6, 1);

// PNG
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const td = Buffer.concat([Buffer.from(ty), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td), 0); return Buffer.concat([l, td, cr]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(RW, 0); ihdr.writeUInt32BE(RH, 4); ihdr[8] = 8; ihdr[9] = 6;
const raw = Buffer.alloc((RW * 4 + 1) * RH); for (let y = 0; y < RH; y++) { raw[y * (RW * 4 + 1)] = 0; buf.copy(raw, y * (RW * 4 + 1) + 1, y * RW * 4, (y + 1) * RW * 4); }
writeFileSync('/tmp/celestial-def.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote /tmp/celestial-def.png');

if (emit) {
  const r = (c) => c.map((p) => [+p.x.toFixed(4), +p.y.toFixed(4)]);
  const H2 = DEF.body.head;
  const head = { neckY: +H2.neckY.toFixed(4), topY: +H2.topY.toFixed(4), outline: r(H2.outline), horns: r(H2.horns) };
  const data = { canvas: DEF.canvas, source: DEF.source, mirror: DEF.mirror, body: { silhouette: r(DEF.body.silhouette), plates: DEF.body.plates.map(r), head }, wing: { side: DEF.wing.side, silhouette: r(DEF.wing.silhouette), struts: DEF.wing.struts.map(r), veins: DEF.wing.veins.map(r), sparIndex: DEF.wing.sparIndex } };
  writeFileSync(new URL('../js/celestialDef.js', import.meta.url), `// AUTO-GENERATED by tools/traceDefinition.mjs — the full Celestial Storm trace definition.\n// Body: outer silhouette + armour-plate/spinal-segment cells (incl. trident). Wing: outer silhouette +\n// finger struts (stencil) + lightning veins (colour), traced on the RIGHT wing, mirror across x=${DEF.mirror}.\n// Normalized 0..1 on the shared ${W}×${H} canvas. Spine layer dropped (flagged wrong).\nexport const CELESTIAL_DEF = ${JSON.stringify(data)};\n`);
  console.log('wrote js/celestialDef.js');
}
