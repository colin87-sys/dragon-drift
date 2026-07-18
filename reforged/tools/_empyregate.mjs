// _empyregate.mjs — ONE boot, multiple frames for the Fable-model re-gate of PR-1/2/3.
// Frames: sky (blooms+stars+zenith, sun-kill), water (waterline nacre + glitter-kill), mote (the black disc).
// Reapplies the view in a tight loop right before each screenshot to beat the chase-cam reassert.
import { writeFileSync, readFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 960, height: 600 };
const mkSave = () => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, stats: { runs: 5 }, flags: { seenIntro: true, seenFirstSurge: true },
  settings: { reticle: false, qualityOverride: 0 },
}))`;

const { page, done } = await boot({ query: `?biome=5&debug&cleanshot&seed=73101`, viewport: VIEW, deviceScaleFactor: 1, initScript: mkSave() });
await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
await page.waitForFunction(() => {
  const b = document.getElementById('btn-start'); if (b) b.click();
  return window.__dd.game && window.__dd.game.state === 'playing';
}, { timeout: 30000, polling: 500 });
await page.waitForTimeout(1400);
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.player.dist = 2200; });
await page.waitForFunction(() => window.__dd.player.dist > 2240, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(1700);
await page.evaluate(() => {
  window.__dd.game.timeScale = 0;
  window.__dd.clearObstacles && window.__dd.clearObstacles();
  window.__dd.clearVents && window.__dd.clearVents();
  // Disable the chase-cam reassert so the camera can be aimed freely (it otherwise re-points forward every frame).
  if (window.__dd.cameraCtl) window.__dd.cameraCtl.update = () => {};
});

async function shot(name, tx, ty, tz) {
  await page.evaluate(([X, Y, Z]) => {
    const c = window.__dd.camera, p = c.position;
    c.up.set(0, 1, 0);
    c.lookAt(p.x + X, p.y + Y, p.z + Z);
    c.updateMatrixWorld();
  }, [tx, ty, tz]);
  await page.waitForTimeout(160);
  writeFileSync(`/tmp/rg-${name}.png`, await page.screenshot({ timeout: 60000, animations: 'disabled' }));
  console.log(`wrote /tmp/rg-${name}.png`);
}

await shot('sky', 0.6, 26, -8);      // PR-1: aim UP the dome — blooms + R7 stars + zenith value + the killed zenith sun
await shot('water', 0.4, -7, -13);   // PR-2: aim DOWN to the waterline — nacre sheen + no gold glitter lane
await shot('mote', 6, 5, -50);       // PR-3: aim at the Mote's bearing (normalize ~0.12,0.10,-1) at the vanishing point

// ── Fable-style machine sample of the sky frame (avg HSV per region + a countable-star estimate) ──
const png = readFileSync('/tmp/rg-sky.png').toString('base64');
const stats = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
  const W = img.width, H = img.height, D = cx.getImageData(0, 0, W, H).data;
  const px = (x, y) => { const i = (y * W + x) * 4; return [D[i], D[i + 1], D[i + 2]]; };
  const toHSV = ([r, g, b]) => { r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
    let h=0; if(d){ if(mx===r)h=((g-b)/d)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0)h+=360;} return [h, mx?d/mx:0, mx]; };
  const avg = (cx0, cy0, r) => { let R=0,G=0,B=0,n=0; for(let y=cy0-r;y<=cy0+r;y++)for(let x=cx0-r;x<=cx0+r;x++){const p=px(x,y);R+=p[0];G+=p[1];B+=p[2];n++;} return toHSV([R/n,G/n,B/n]); };
  // regions (960x600): base upper-centre; rose lower-right; orchid lower-left
  const base = avg(480, 90, 8), rose = avg(760, 430, 10), orchid = avg(210, 380, 10), zenith = avg(480, 40, 8);
  // star estimate: bright outliers in the upper dome (y<300) that exceed the local 9x9 mean by a margin
  let stars = 0; const seen = [];
  for (let y = 60; y < 300; y += 2) for (let x = 20; x < W - 20; x += 2) {
    const c = px(x, y); const L = 0.299*c[0]+0.587*c[1]+0.114*c[2];
    let m = 0; for (let dy=-4;dy<=4;dy+=2)for(let dx=-4;dx<=4;dx+=2){const p=px(x+dx,y+dy);m+=0.299*p[0]+0.587*p[1]+0.114*p[2];} m/=25;
    if (L - m > 12 && L > 210) { if(!seen.some(s=>Math.abs(s[0]-x)<6&&Math.abs(s[1]-y)<6)){seen.push([x,y]);stars++;} }
  }
  return { base, rose, orchid, zenith, stars };
}, png);
// ── Mote measurement: disc px-diameter → degrees, + limb brightness just outside the edge ──
const vfov = await page.evaluate(() => window.__dd.camera.fov);
const motePng = readFileSync('/tmp/rg-mote.png').toString('base64');
const mote = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
  const W = img.width, H = img.height, D = cx.getImageData(0, 0, W, H).data;
  const L = (x, y) => { const i = (y * W + x) * 4; return 0.299*D[i]+0.587*D[i+1]+0.114*D[i+2]; };
  // disc = connected dark pixels near frame centre-top (avoid the brown arch: only scan the upper-centre)
  let minx=W,maxx=0,miny=H,maxy=0,n=0,sx=0,sy=0;
  for (let y=40;y<360;y++) for (let x=260;x<700;x++){ if(L(x,y)<16){ n++; sx+=x; sy+=y; if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y; } }
  if(!n) return { found:false };
  const cxp=sx/n, cyp=sy/n, dpx=Math.max(maxx-minx,maxy-miny)+1, r=dpx/2;
  // limb: max brightness on a ring ~r+3 around the centroid, and the mean, to see one-sidedness
  let lmax=0, lsum=0, ln=0;
  for(let a=0;a<360;a+=4){ const rx=Math.round(cxp+(r+2)*Math.cos(a*Math.PI/180)), ry=Math.round(cyp+(r+2)*Math.sin(a*Math.PI/180)); if(rx<2||rx>W-2||ry<2||ry>H-2)continue; const v=L(rx,ry); lmax=Math.max(lmax,v); lsum+=v; ln++; }
  // local background just beyond the limb
  let bg=0,bn=0; for(let a=0;a<360;a+=8){ const rx=Math.round(cxp+(r+10)*Math.cos(a*Math.PI/180)), ry=Math.round(cyp+(r+10)*Math.sin(a*Math.PI/180)); if(rx<2||rx>W-2||ry<2||ry>H-2)continue; bg+=L(rx,ry); bn++; }
  return { found:true, dpx, cxp:Math.round(cxp), cyp:Math.round(cyp), coreMin:Math.round(Math.min(...[L(Math.round(cxp),Math.round(cyp))])), limbMax:Math.round(lmax), limbMean:Math.round(lsum/ln), bg:Math.round(bg/bn), W, H };
}, motePng);
if (mote.found) {
  const degPerPx = vfov / mote.H;                 // vertical deg per px (vfov is vertical)
  const diamDeg = (mote.dpx * degPerPx).toFixed(2);
  console.log(`MOTE disc=${mote.dpx}px ≈ ${diamDeg}° diam | core L=${mote.coreMin} | limb max=${mote.limbMax} mean=${mote.limbMean} bg=${mote.bg} (limb-bg=${mote.limbMax-mote.bg}) | centre(${mote.cxp},${mote.cyp})`);
} else console.log('MOTE not found in scan window');
const f3 = (a) => `H${a[0].toFixed(0)} S${a[1].toFixed(3)} V${a[2].toFixed(3)}`;
console.log(`SAMPLE base=[${f3(stats.base)}] zenith=[${f3(stats.zenith)}]`);
console.log(`SAMPLE rose=[${f3(stats.rose)}] orchid=[${f3(stats.orchid)}]`);
console.log(`SAMPLE stars≈${stats.stars} | rose-base ΔS=${(stats.rose[1]-stats.base[1]).toFixed(3)} ΔH=${Math.abs(stats.rose[0]-stats.base[0]).toFixed(0)} | orchid-base ΔS=${(stats.orchid[1]-stats.base[1]).toFixed(3)} ΔH=${Math.abs(stats.orchid[0]-stats.base[0]).toFixed(0)}`);
console.log('done.');
await done();
