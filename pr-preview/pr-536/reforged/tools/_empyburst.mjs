// _empyburst.mjs — THE EMPYREAN holistic-review burst. Shoots a SERIES of frames across the biome
// (several lane distances × camera angles × desktop AND portrait aspects, plus a live 3-frame motion
// burst) with obstacles/hazards cleared and the boss schedule pushed out — a clean art read of the
// biome itself for an independent critic. FOV pinned 85° per shot so sizes are comparable.
//   node tools/_empyburst.mjs  →  /tmp/empyburst-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const mkSave = () => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, stats: { runs: 5 }, flags: { seenIntro: true, seenFirstSurge: true },
  settings: { reticle: false, qualityOverride: 0 },
}))`;

// UPLIFT law 2 — the NUMERIC dark budget: summed screen area of sub-L30 pixels EXCLUDING the Mote must
// stay ≤40% of the Mote's own sub-L30 area. Measured by loading the captured PNG back into the page
// (dataURL → canvas, independent of preserveDrawingBuffer), sampling every 2px, taking the median dark
// pixel as the Mote centre and a ±70px box as its region.
async function darkBudget(page, buf, label) {
  const r = await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const xs = [], ys = [];
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
      const i = (y * c.width + x) * 4;
      if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < 30) { xs.push(x); ys.push(y); }
    }
    if (!xs.length) return { mote: 0, other: 0, ratio: 0 };
    xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
    const mx = xs[xs.length >> 1], my = ys[ys.length >> 1];
    let mote = 0, other = 0;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
      const i = (y * c.width + x) * 4;
      if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < 30) {
        if (Math.abs(x - mx) <= 70 && Math.abs(y - my) <= 70) mote++; else other++;
      }
    }
    return { mote, other, ratio: mote ? +(other / mote).toFixed(3) : 0 };
  }, buf.toString('base64'));
  const ok = r.ratio <= 0.40;
  console.log(`  [dark-budget ${label}] mote=${r.mote} other=${r.other} ratio=${r.ratio} ${ok ? 'OK' : 'OVER'}`);
  return ok;
}

// GHOST ORCHARD P1 probes — the petal band must FILL and rise UP. Frozen-camera pair (live1..liveN):
// count moving rose pixels (R>B) per horizontal third of the water→sky band, and the fraction that
// displaced screen-UP. Run on the frozen live sequence.
async function orchardProbe(page, bufA, bufB) {
  const r = await page.evaluate(async ([a, b]) => {
    const load = (x) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + x; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const da = px(ia), db = px(ib), W = ia.width, H = ia.height;
    // band = full frame height (petals rise water→sky); thirds by screen-Y
    const thirds = [0, 0, 0]; let up = 0, moved = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      const roseA = da[i] > da[i + 2] + 6 && da[i] > 150, roseB = db[i] > db[i + 2] + 6 && db[i] > 150;
      const changed = Math.abs(da[i] - db[i]) > 10 || Math.abs(da[i + 2] - db[i + 2]) > 10;
      if ((roseA || roseB) && changed) {
        moved++;
        thirds[Math.min(2, Math.floor(y / (H / 3)))]++;
        // does a rose pixel here appear ABOVE where it was? sample 8px up in A vs here in B
        const iu = ((y - 8) * W + x) * 4;
        if (y > 8 && db[i] > db[i + 2] + 6 && da[iu] <= da[iu + 2] + 6) up++;
      }
    }
    return { thirds, upFrac: moved ? +(up / moved).toFixed(2) : 0 };
  }, [bufA.toString('base64'), bufB.toString('base64')]);
  console.log(`  [orchard-probe] rose/third=[${r.thirds}] upFrac=${r.upFrac} (bars: >=250/120 per third, upFrac>=0.5-ish)`);
}

// PR-A r6 machine probes (gate r5 fix 3): verify the two contested numbers IN THE FRAMEBUFFER before
// any critic spawn — quarter-frame flank delta at the line rows, and moving-ROSE pixels in the water.
async function structProbes(page, bufCruise, bufL1, bufL4) {
  const r = await page.evaluate(async ([c, a, b]) => {
    const load = (x) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + x; });
    const px = async (img) => { const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0); return ctx.getImageData(0, 0, cv.width, cv.height).data; };
    const [ic, ia, ib] = await Promise.all([load(c), load(a), load(b)]);
    const dc = await px(ic), da = await px(ia), db = await px(ib);
    const W = ic.width;
    const L = (d, x, y) => { const i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
    let corr = 0, cn = 0, fl = 0, fn = 0;
    for (let y = 264; y < 300; y += 2) {
      for (let x = 440; x < 520; x += 2) { corr += L(dc, x, y); cn++; }
      for (const x0 of [120, 760]) for (let x = x0; x < x0 + 80; x += 2) { fl += L(dc, x, y); fn++; }
    }
    const delta = +(100 * (corr / cn - fl / fn) / (corr / cn)).toFixed(1);
    let rose = 0;
    for (let y = 302; y < ic.height - 20; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (Math.abs(da[i] - db[i]) > 10 || Math.abs(da[i + 2] - db[i + 2]) > 10) {
        if (db[i] > db[i + 2] + 5) rose++;
        if (da[i] > da[i + 2] + 5) rose++;
      }
    }
    return { delta, rose };
  }, [bufCruise.toString('base64'), bufL1.toString('base64'), bufL4.toString('base64')]);
  console.log(`  [struct-probe] flankDelta=${r.delta}% (bar ~15) movingRose=${r.rose} (bar ~400)`);
}

async function session(tag, view, shots) {
  const query = `?biome=5&debug&cleanshot&seed=73101`;
  const { page, done } = await boot({ query, viewport: view, deviceScaleFactor: 1, initScript: mkSave() });
  await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-start'); if (b) b.click();
    return window.__dd.game && window.__dd.game.state === 'playing';
  }, { timeout: 30000, polling: 500 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__dd.noBoss(true));
  let _cruiseBuf = null, _live1Buf = null, _live2Buf = null, _liveLastBuf = null;
  for (const s of shots) {
    // fly to the shot's lane distance with the sim running, then settle the fog/sky lerp
    await page.evaluate((d) => { window.__dd.game.timeScale = 1; window.__dd.player.dist = d; }, s.dist);
    await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, s.dist).catch(() => {});
    // settle the fog/sky lerp while SWEEPING obstacles — a gate that respawns mid-settle can crash the
    // auto-flying player before the freeze (a phone-late frame once captured the CRASHED! screen).
    for (let w = 0; w < 4; w++) {
      await page.evaluate(() => { window.__dd.clearObstacles && window.__dd.clearObstacles(); });
      await page.waitForTimeout(400);
    }
    if (s.burst) {
      // WORLD-MOTION burst (PR-A gate): FREEZE the sim (shader clock keeps running) so ring travel /
      // orbiters / phase drift are separable from camera scroll; the diff metric below PROVES the freeze.
      if (s.frozen) await page.evaluate(() => { window.__dd.game.timeScale = 0; });
      let _prevB64 = null;
      if (s.frozen) { await page.evaluate((d) => { window.__dd.player.dist = d; }, s.dist + 60); await page.waitForTimeout(900); }   // r4: settle the chase-cam ease BEFORE frame 1 (live1 shipped from a different camera)
      for (let k = 0; k < s.burst; k++) {
        await page.evaluate(([fz, d]) => {
          if (fz) { window.__dd.game.timeScale = 0; window.__dd.player.dist = d; }   // PIN dist too — timeScale 0 alone does not stop dist (the r3 finding)
          window.__dd.clearObstacles && window.__dd.clearObstacles();
          window.__dd.clearVents && window.__dd.clearVents();
          const c = window.__dd.camera; c.fov = 85; c.updateProjectionMatrix();
        }, [!!s.frozen, s.dist + 60]);
        const buf = await page.screenshot({ timeout: 60000 });
        writeFileSync(`/tmp/empyburst-${tag}-${s.name}${k + 1}.png`, buf);
        console.log(`  wrote /tmp/empyburst-${tag}-${s.name}${k + 1}.png`);
        await darkBudget(page, buf, `${tag}-${s.name}${k + 1}`);
        if (_prevB64) {   // frozen-triplet instrument: fraction of pixels changed >0.05 — must be small (world-shader motion only)
          const df = await page.evaluate(async ([a, b]) => {
            const load = (x) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + x; });
            const [ia, ib] = await Promise.all([load(a), load(b)]);
            const c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
            c1.width = c2.width = ia.width; c1.height = c2.height = ia.height;
            const x1 = c1.getContext('2d'), x2 = c2.getContext('2d');
            x1.drawImage(ia, 0, 0); x2.drawImage(ib, 0, 0);
            const d1 = x1.getImageData(0, 0, c1.width, c1.height).data, d2 = x2.getImageData(0, 0, c2.width, c2.height).data;
            let n = 0, t = 0;
            for (let i = 0; i < d1.length; i += 16) { t++; if (Math.abs(d1[i] - d2[i]) > 13 || Math.abs(d1[i + 1] - d2[i + 1]) > 13) n++; }
            return +(n / t).toFixed(4);
          }, [_prevB64, buf.toString('base64')]);
          console.log(`  [motion-diff ${tag}-${s.name}${k + 1}] changed=${df}${s.frozen ? (df < 0.35 ? ' (frozen OK - shader/water motion only)' : ' (FREEZE FAILED)') : ''}`);
        }
        _prevB64 = buf.toString('base64');
        if (k === 0) _live1Buf = buf; if (k === 1) _live2Buf = buf; _liveLastBuf = buf;
        if (k < s.burst - 1) for (let g = 0; g < 5; g++) {   // sweep DURING the live gap too — a gate respawning mid-burst kills the auto-flying player (a live3 frame once caught the death fade-to-black)
          await page.evaluate(([fz, d]) => {
            if (fz) { window.__dd.game.timeScale = 0; window.__dd.player.dist = d; }
            window.__dd.clearObstacles && window.__dd.clearObstacles();
          }, [!!s.frozen, s.dist + 60]);
          await page.waitForTimeout(400);
        }
      }
      continue;
    }
    await page.evaluate(() => {
      window.__dd.game.timeScale = 0;
      window.__dd.clearObstacles && window.__dd.clearObstacles();
      window.__dd.clearVents && window.__dd.clearVents();
      const c = window.__dd.camera; c.fov = 85; c.updateProjectionMatrix();
    });
    if (s.pitch) await page.evaluate((p) => {
      const c = window.__dd.camera; c.rotation.x += p; c.updateMatrixWorld();
    }, s.pitch);
    await page.waitForTimeout(160);
    const buf = await page.screenshot({ timeout: 60000, animations: 'disabled' });
    writeFileSync(`/tmp/empyburst-${tag}-${s.name}.png`, buf);
    console.log(`  wrote /tmp/empyburst-${tag}-${s.name}.png`);
    await darkBudget(page, buf, `${tag}-${s.name}`);
    if (s.name === 'cruise') _cruiseBuf = buf;
    if (s.pitch) await page.evaluate((p) => {   // undo the pitch so the next shot starts clean
      const c = window.__dd.camera; c.rotation.x -= p; c.updateMatrixWorld();
    }, s.pitch);
  }
  if (_cruiseBuf && _live1Buf && _liveLastBuf) await structProbes(page, _cruiseBuf, _live1Buf, _liveLastBuf);
  if (_live2Buf && _liveLastBuf) await orchardProbe(page, _live2Buf, _liveLastBuf);
  await done();
}

console.log('THE EMPYREAN — holistic burst captures');
const only = process.argv[2];
if (!only || only === 'desk') await session('desk', { width: 960, height: 600 }, [
  { name: 'early',  dist: 380 },   // congregation peak (~400) INSIDE the early band - the arch family's home; 1200 looked ahead across the 0.34 band cutoff where arches park
  { name: 'mid',    dist: 2175 },  // local 675, t=0.45 - TRUE mid band (biomeLength=1500; the old 2000 was t=0.33)
  { name: 'cruise', dist: 2400 },
  { name: 'sky',    dist: 2400, pitch: 0.35 },
  { name: 'water',  dist: 2400, pitch: -0.25 },
  { name: 'live',   dist: 2600, burst: 4, frozen: true },   // 4 frames × ~2.6s ≈ most of an 8s pulse cycle — the rose ring's expansion is capturable at any phase
  { name: 'late',   dist: 2700 },  // local 1200, t=0.80 - TRUE late band (the old 3200 was local 200 = EARLY - every prior "late" frame was mislabeled)
  { name: 'gate',   dist: 2755 },  // camera sees local 1255-1405: the RING GATE window (0.88*1500 = 1320 +-60)
]);
if (!only || only === 'phone') await session('phone', { width: 390, height: 780 }, [
  { name: 'cruise', dist: 2400 },
  { name: 'late',   dist: 2700 },  // local 1200, t=0.80 - TRUE late band (the old 3200 was local 200 = EARLY - every prior "late" frame was mislabeled)
  { name: 'gate',   dist: 2755 },  // camera sees local 1255-1405: the RING GATE window (0.88*1500 = 1320 +-60)
]);
