// wingMetrics.mjs — PARAMETRIC wing assessment: measure membrane vs. bright-feature colour, bright-AREA fraction,
// and bright-line WIDTH for BOTH the painted reference (tools/refs/celestial/wings.png) and our wing render
// (tools/celestial3D.html, isolated via window.__wingsOnly), so wing tuning is driven by data, not eyeballing.
//
//   node tools/wingMetrics.mjs --selftest   → validate the metric functions on a SYNTHETIC image of KNOWN values
//   node tools/wingMetrics.mjs              → print the reference-vs-ours assessment table
//
// WHY a self-test: the metrics read a rendered image; a subtle bug (wrong threshold, hue formula, run-length)
// could report numbers that look plausible but are wrong and send the tuning the wrong way. The self-test plants
// KNOWN values (membrane colour, bright hue, bright-area %, line width) and asserts the tool recovers them within
// tolerance. If it fails, the real numbers are NOT trustworthy. Relative metrics (hue, area, ratio) are the
// trustworthy ones — absolute luminance differs between flat art and a lit 3D render, so it is reported, not gated.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

// ── metric functions (installed into the page; pure, operate on {data:Uint8ClampedArray RGBA, width, height}) ──
// Kept as a source string so the SAME code runs for the self-test and the real measurement (no drift).
const METRICS_SRC = `
window.WM = (() => {
  const lum = (r,g,b) => 0.299*r + 0.587*g + 0.114*b;
  const hue = (r,g,b) => { r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; if(d<1e-4)return -1; let h; if(mx===r)h=((g-b)/d+6)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4; return h*60; };
  // collect wing pixels via a predicate(data,i)->bool; returns flat list of [r,g,b] AND a same-size mask + dims
  const collect = (img, pred) => {
    const {data,width:w,height:h} = img, px=[], mask=new Uint8Array(w*h);
    for (let i=0,p=0; i<data.length; i+=4,p++) if (pred(data,i)) { px.push([data[i],data[i+1],data[i+2]]); mask[p]=1; }
    return {px, mask, w, h};
  };
  // colour + bright-area stats. membrane = mean of darkest 50% (the translucent sheet); bright = mean of brightest
  // 10% (struts/veins/lightning). brightFrac = % of wing pixels brighter than membraneMedianLum * K (membrane-relative).
  const colour = (px, K=1.8) => {
    const s = px.slice().sort((a,b)=>lum(...a)-lum(...b)), n=s.length;
    const avg = a => { let r=0,g=0,b=0; for(const p of a){r+=p[0];g+=p[1];b+=p[2];} const k=a.length||1; return [r/k,g/k,b/k]; };
    const mem = avg(s.slice(0, Math.floor(0.5*n))), bri = avg(s.slice(Math.floor(0.9*n)));
    const memMedLum = lum(...s[Math.floor(0.5*n)]); let bc=0; for(const p of px) if(lum(...p) > memMedLum*K) bc++;
    return { membrane:{rgb:mem.map(Math.round), lum:+lum(...mem).toFixed(1), hue:+hue(...mem).toFixed(0)},
             bright:{rgb:bri.map(Math.round), lum:+lum(...bri).toFixed(1), hue:+hue(...bri).toFixed(0)},
             brightFrac:+(bc/n*100).toFixed(1), lumRatio:+(lum(...bri)/Math.max(1,lum(...mem))).toFixed(2),
             memMedLum:+memMedLum.toFixed(1), K };
  };
  // bright-line WIDTH (px): for each bright pixel, local thickness = min(horizontal run, vertical run) through it;
  // report the MEDIAN over bright pixels (robust to line length/orientation). brightTest(data,i)->bool.
  const width = (img, wingPred, brightTest) => {
    const {data,width:w,height:h}=img; const B=new Uint8Array(w*h);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){ const i=(y*w+x)*4; if(wingPred(data,i)&&brightTest(data,i)) B[y*w+x]=1; }
    const run=(x,y,dx,dy)=>{ let n=1; let cx=x+dx,cy=y+dy; while(cx>=0&&cy>=0&&cx<w&&cy<h&&B[cy*w+cx]){n++;cx+=dx;cy+=dy;} cx=x-dx;cy=y-dy; while(cx>=0&&cy>=0&&cx<w&&cy<h&&B[cy*w+cx]){n++;cx-=dx;cy-=dy;} return n; };
    const th=[]; for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(B[y*w+x]){ th.push(Math.min(run(x,y,1,0), run(x,y,0,1))); }
    th.sort((a,b)=>a-b); return th.length? th[Math.floor(0.5*th.length)] : 0;
  };
  // wing half-span in px = half the horizontal bbox extent of wing pixels
  const halfSpan = (img, wingPred) => { const {data,width:w,height:h}=img; let lx=w,rx=0; for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4; if(wingPred(data,i)){if(x<lx)lx=x;if(x>rx)rx=x;}} return (rx-lx)/2; };
  return { lum, hue, collect, colour, width, halfSpan };
})();
`;

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.error('PAGEERROR', String(e)));
await page.goto(srv.url + '/tools/celestial3D.html');
await page.waitForFunction(() => window.__ready, { timeout: 20000 });
await page.addScriptTag({ content: METRICS_SRC });

const SELFTEST = process.argv.includes('--selftest');

if (SELFTEST) {
  // plant KNOWN values: 400×400 membrane (dark violet), 10 horizontal bright lines (blue hue~239) of width 6px.
  // expected brightFrac = 10*6/400 = 15.0%; width = 6; membrane hue ~254; bright hue ~239.
  const res = await page.evaluate(() => {
    const w=400,h=400, MEM=[42,21,86] /*0x2a1556 hue~254*/, BRI=[110,112,232] /*hue~239*/;
    const c=document.createElement('canvas'); c.width=w; c.height=h; const cx=c.getContext('2d');
    cx.fillStyle=`rgb(${MEM[0]},${MEM[1]},${MEM[2]})`; cx.fillRect(0,0,w,h);
    const N=10, LW=6, gap=Math.floor(h/N); cx.fillStyle=`rgb(${BRI[0]},${BRI[1]},${BRI[2]})`;
    for(let k=0;k<N;k++) cx.fillRect(0, k*gap, w, LW);
    const img = cx.getImageData(0,0,w,h);
    const wingPred=(d,i)=>d[i+3]>40;                                   // whole rect is "wing"
    const px=WM.collect(img, wingPred).px;
    const col=WM.colour(px);
    const brightTest=(d,i)=>WM.lum(d[i],d[i+1],d[i+2])>col.memMedLum*col.K;
    const wid=WM.width(img, wingPred, brightTest);
    return { col, wid, expect:{brightFrac:15.0, width:6, memHue:254, briHue:239} };
  });
  const c=res.col, e=res.expect;
  const checks=[
    ['membrane hue ≈254', Math.abs(c.membrane.hue-e.memHue)<=8, `${c.membrane.hue}`],
    ['bright hue ≈239',   Math.abs(c.bright.hue-e.briHue)<=8,   `${c.bright.hue}`],
    ['bright-area ≈15%',  Math.abs(c.brightFrac-e.brightFrac)<=2.0, `${c.brightFrac}%`],
    ['line width ≈6px',   Math.abs(res.wid-e.width)<=1,         `${res.wid}px`],
  ];
  let ok=true; console.log('── wingMetrics SELF-TEST (synthetic, known values) ─────────────');
  for(const [name,pass,got] of checks){ console.log(`  [${pass?'PASS':'FAIL'}] ${name}   (measured ${got})`); if(!pass)ok=false; }
  console.log(ok? 'SELF-TEST PASS — metrics are trustworthy.' : 'SELF-TEST FAIL — do NOT trust the real numbers.');
  await browser.close(); await srv.close(); process.exit(ok?0:1);
}

// ── REAL measurement: reference wings.png + our wings-only render ────────────────────────────────────────────
const measureRef = await page.evaluate(async () => {
  const img=new Image(); img.src='/tools/refs/celestial/wings.png'; await img.decode();
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; const cx=c.getContext('2d'); cx.drawImage(img,0,0);
  const id=cx.getImageData(0,0,c.width,c.height);
  const wingPred=(d,i)=>{ const r=d[i],g=d[i+1],b=d[i+2]; const isBg=(Math.abs(r-g)<22&&Math.abs(g-b)<22&&r>150); return d[i+3]>40 && !isBg; };
  const px=WM.collect(id, wingPred).px; const col=WM.colour(px);
  const brightTest=(d,i)=>WM.lum(d[i],d[i+1],d[i+2])>col.memMedLum*col.K;
  return { ...col, width:WM.width(id, wingPred, brightTest), halfSpan:WM.halfSpan(id, wingPred) };
});
const measureOurs = await page.evaluate(async () => {
  window.__wingsOnly(true); window.__transparent(true); window.__view(0, 0.16, false); window.__zoom(1.0); window.__rest && window.__rest();
  await new Promise(r=>setTimeout(r,450));
  const gl=document.getElementById('gl'); const c=document.createElement('canvas'); c.width=gl.width; c.height=gl.height; const cx=c.getContext('2d'); cx.drawImage(gl,0,0);
  const id=cx.getImageData(0,0,c.width,c.height);
  const wingPred=(d,i)=>d[i+3]>40;
  const px=WM.collect(id, wingPred).px; const col=WM.colour(px);
  const brightTest=(d,i)=>WM.lum(d[i],d[i+1],d[i+2])>col.memMedLum*col.K;
  return { ...col, width:WM.width(id, wingPred, brightTest), halfSpan:WM.halfSpan(id, wingPred) };
});

const pct = (w,hs)=> hs? (w/hs*100).toFixed(1)+'%' : 'n/a';
const row = (label, r) => `${label.padEnd(10)} membrane hue ${String(r.membrane.hue).padStart(3)}° lum ${String(r.membrane.lum).padStart(5)} | bright hue ${String(r.bright.hue).padStart(3)}° lum ${String(r.bright.lum).padStart(5)} | bright-area ${String(r.brightFrac).padStart(5)}% | lumRatio ${r.lumRatio} | brightWidth ${pct(r.width,r.halfSpan)} (${r.width}px/${r.halfSpan|0})`;
console.log('── wingMetrics — REFERENCE vs OURS ─────────────────────────────────');
console.log(row('REFERENCE', measureRef));
console.log(row('OURS', measureOurs));
console.log('Δ bright-area: ' + (measureOurs.brightFrac - measureRef.brightFrac).toFixed(1) + ' pts  ·  Δ bright-hue: ' + (measureOurs.bright.hue - measureRef.bright.hue) + '°');
console.log('NOTE: bright-WIDTH in the ref = the lightning veins (the ref bones are dark); in ours = the pale bone slabs. Compare with that in mind; the trustworthy cross-image signals are bright-AREA % and bright-HUE.');
await browser.close();
await srv.close();
process.exit(0);
