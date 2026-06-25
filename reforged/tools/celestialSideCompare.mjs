// celestialSideCompare.mjs — SIDE-PROFILE reference overlay for the Celestial Storm head/neck.
// Renders our model from the exact side (wings hidden, transparent bg) via tools/celestial3D.html,
// rotates that render into the reference's flight orientation, auto-scales it by nose→tail body length,
// and composites it over the painted side reference so the head/neck CONTOUR can be judged against the
// art instead of eyeballed. Outputs /tmp/side-ours.png, /tmp/side-ref.png, /tmp/side-overlay.png.
//   node tools/celestialSideCompare.mjs [refName=side-a] [rotDeg=-90] [flipX=0] [flipY=0]
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const refName = process.argv[2] || 'side-a';
const rotDeg = parseFloat(process.argv[3] ?? '-90');     // rotate OUR render to match the ref's flight orientation
const flipX = process.argv[4] === '1', flipY = process.argv[5] === '1';
const scaleArg = process.argv[6] || '1';     // optional head-region zoom multiplier

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/celestial3D.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });

// our model: bare side profile, transparent bg
await page.evaluate(() => { window.__wings(false); window.__transparent(true); window.__view(90, 0.0, false); window.__zoom(0.62); });
await page.waitForTimeout(250);

const refUrl = srv.url + `/tools/refs/celestial/${refName}.png`;
const out = await page.evaluate(async ({ refUrl, rotDeg, flipX, flipY, refName_, scaleArg }) => {
  // bbox of non-transparent pixels in an ImageData
  // nose = mean y of the leftmost dragon column (a clean landmark present in both images)
  const noseYof = (test, data, w, h) => { for (let x = 0; x < w; x++) { let sum = 0, n = 0; for (let y = 0; y < h; y++) { const i = (y * w + x) * 4; if (test(data, i)) { sum += y; n++; } } if (n > 2) return sum / n; } return h / 2; };
  const bbox = (data, w, h, aMin) => {        // alpha-based (our transparent render)
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (data[(y * w + x) * 4 + 3] > aMin) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const noseY = noseYof((d, i) => d[i + 3] > aMin, data, w, h);
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, noseY };
  };
  // colour-based content mask (the painted ref has an opaque light-grey checker bg; the dragon is dark/saturated)
  const isDragon = (r, g, b) => !((Math.abs(r - g) < 26 && Math.abs(g - b) < 26 && Math.abs(r - b) < 26) && r > 120);
  const bboxColor = (data, w, h) => {
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (data[i + 3] > 16 && isDragon(data[i], data[i + 1], data[i + 2])) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    const noseY = noseYof((d, i) => d[i + 3] > 16 && isDragon(d[i], d[i + 1], d[i + 2]), data, w, h);
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, noseY };
  };
  // nose anchor (both images are oriented HEAD-UP): topmost dragon row y + the mean x over the top band
  const noseAnchor = (mask, w, h, b) => { const band = Math.max(4, Math.round(b.h * 0.06)); let sum = 0, n = 0; for (let y = b.y0; y <= b.y0 + band; y++) for (let x = 0; x < w; x++) { if (mask(x, y)) { sum += x; n++; } } return { x: n ? sum / n : (b.x0 + b.x1) / 2, y: b.y0 }; };
  // shoulder anchor = first row (scanning down from the nose) whose width reaches a fraction of the body's max width
  // (where the neck meets the wing/shoulder mass). Gives a 2nd landmark so head+neck align by nose→shoulder length.
  const rowWidth = (mask, w, y) => { let lo = -1, hi = -1; for (let x = 0; x < w; x++) if (mask(x, y)) { if (lo < 0) lo = x; hi = x; } return lo < 0 ? { wpx: 0 } : { wpx: hi - lo, cx: (lo + hi) / 2 }; };
  const shoulderAnchor = (mask, w, h, b) => { let maxW = 0; for (let y = b.y0; y <= b.y1; y++) maxW = Math.max(maxW, rowWidth(mask, w, y).wpx); for (let y = b.y0; y <= b.y1; y++) { const r = rowWidth(mask, w, y); if (r.wpx >= 0.55 * maxW) return { x: r.cx, y }; } return { x: (b.x0 + b.x1) / 2, y: b.y1 }; };
  const gl = document.getElementById('gl');
  // 1) OUR render — NEUTRAL side view (head-up, dorsal-right): the orientation the previewer shows and we fully understand
  const oc = document.createElement('canvas'); oc.width = gl.width; oc.height = gl.height;
  const octx = oc.getContext('2d'); octx.drawImage(gl, 0, 0);
  const od = octx.getImageData(0, 0, oc.width, oc.height); const ob = bbox(od.data, oc.width, oc.height, 10);
  const oMask = (x, y) => od.data[(y * oc.width + x) * 4 + 3] > 10;
  const oNose = noseAnchor(oMask, oc.width, oc.height, ob), oSh = shoulderAnchor(oMask, oc.width, oc.height, ob);
  // TINT ours to a flat cyan silhouette so its CONTOUR reads over the busy ref
  const tc = document.createElement('canvas'); tc.width = oc.width; tc.height = oc.height; const tctx = tc.getContext('2d');
  tctx.drawImage(oc, 0, 0); tctx.globalCompositeOperation = 'source-in'; tctx.fillStyle = '#37e0ff'; tctx.fillRect(0, 0, tc.width, tc.height);
  // 2) REFERENCE — rotate +90° CW (+ optional flips) so it matches our neutral: head-left→head-UP, dorsal-up→dorsal-RIGHT
  const img = new Image(); img.crossOrigin = 'anonymous'; img.src = refUrl; await img.decode();
  const big = Math.max(img.naturalWidth, img.naturalHeight) * 1.5;
  const fc = document.createElement('canvas'); fc.width = big; fc.height = big; const fctx = fc.getContext('2d');
  fctx.translate(big / 2, big / 2); fctx.rotate((rotDeg + 90) * Math.PI / 180); fctx.scale(flipX ? -1 : 1, flipY ? -1 : 1); fctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const fd = fctx.getImageData(0, 0, big, big); const fb = bboxColor(fd.data, big, big);
  const fMask = (x, y) => { const i = (y * big + x) * 4; return fd.data[i + 3] > 16 && isDragon(fd.data[i], fd.data[i + 1], fd.data[i + 2]); };
  // centroid of a mask within its bbox (pose-independent anchor — robust where landmark detection isn't)
  const centroid = (mask, w, b) => { let sx = 0, sy = 0, n = 0; for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) if (mask(x, y)) { sx += x; sy += y; n++; } return { x: sx / n, y: sy / n }; };
  const oC = centroid(oMask, oc.width, ob), fC = centroid(fMask, big, fb);
  // 3) overlay (both head-up): scale REF so its nose→tail length (bbox height) matches OURS, anchor on the CENTROID
  // (robust, pose-independent). Head ANGLE + neck curve read directly; the body/head SIZE ratio may differ slightly
  // with proportion + wings-pull on the ref centroid (expected). Use the scale arg to zoom the head region.
  const userScale = parseFloat(scaleArg) || 1;
  const W = 760, H = 940, comp = document.createElement('canvas'); comp.width = W; comp.height = H; const cx = comp.getContext('2d');
  cx.fillStyle = '#0b0e16'; cx.fillRect(0, 0, W, H);
  const ourScale = (H * 0.72 / ob.h) * userScale, anchor = { x: W / 2, y: H / 2 };
  const refScale = (ob.h * ourScale) / fb.h;
  const place = (cv, c, sc, alpha) => { cx.save(); cx.globalAlpha = alpha; cx.translate(anchor.x, anchor.y); cx.scale(sc, sc); cx.translate(-c.x, -c.y); cx.drawImage(cv, 0, 0); cx.restore(); };
  place(fc, fC, refScale, 1.0);   // reference (purple) solid
  place(tc, oC, ourScale, 0.6);   // ours (cyan) on top
  cx.globalAlpha = 1; cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.beginPath(); cx.moveTo(anchor.x, 0); cx.lineTo(anchor.x, H); cx.stroke();
  cx.fillStyle = '#bfe8ff'; cx.font = '16px system-ui'; cx.fillText(`SIDE head+neck — ref ${refName_} solid · OURS cyan · centroid-anchored, length-scaled (x${userScale})`, 12, 26);
  return { overlay: comp.toDataURL('image/png'), ours: tc.toDataURL('image/png'), refbb: fb, ourbb: ob };
}, { refUrl, rotDeg, flipX, flipY, refName_: refName, scaleArg });

const save = (dataUrl, path) => writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64'));
save(out.overlay, '/tmp/side-overlay.png');
save(out.ours, '/tmp/side-ours.png');
console.log('wrote /tmp/side-overlay.png + /tmp/side-ours.png');
console.log('ref bbox', out.refbb, 'ours bbox', out.ourbb);
await browser.close();
await srv.close();
process.exit(0);
