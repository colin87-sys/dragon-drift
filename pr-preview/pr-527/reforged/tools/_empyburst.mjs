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
      // live motion burst: the sim keeps running so koi/motes/water move between frames
      for (let k = 0; k < s.burst; k++) {
        await page.evaluate(() => {
          window.__dd.clearObstacles && window.__dd.clearObstacles();
          window.__dd.clearVents && window.__dd.clearVents();
          const c = window.__dd.camera; c.fov = 85; c.updateProjectionMatrix();
        });
        const buf = await page.screenshot({ timeout: 60000 });
        writeFileSync(`/tmp/empyburst-${tag}-${s.name}${k + 1}.png`, buf);
        console.log(`  wrote /tmp/empyburst-${tag}-${s.name}${k + 1}.png`);
        await darkBudget(page, buf, `${tag}-${s.name}${k + 1}`);
        if (k < s.burst - 1) await page.waitForTimeout(2000);
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
    if (s.pitch) await page.evaluate((p) => {   // undo the pitch so the next shot starts clean
      const c = window.__dd.camera; c.rotation.x -= p; c.updateMatrixWorld();
    }, s.pitch);
  }
  await done();
}

console.log('THE EMPYREAN — holistic burst captures');
const only = process.argv[2];
if (!only || only === 'desk') await session('desk', { width: 960, height: 600 }, [
  { name: 'early',  dist: 380 },   // congregation peak (~400) INSIDE the early band - the arch family's home; 1200 looked ahead across the 0.34 band cutoff where arches park
  { name: 'mid',    dist: 2000 },
  { name: 'cruise', dist: 2400 },
  { name: 'sky',    dist: 2400, pitch: 0.35 },
  { name: 'water',  dist: 2400, pitch: -0.25 },
  { name: 'live',   dist: 2600, burst: 3 },
  { name: 'late',   dist: 3200 },
]);
if (!only || only === 'phone') await session('phone', { width: 390, height: 780 }, [
  { name: 'cruise', dist: 2400 },
  { name: 'late',   dist: 3200 },
]);
