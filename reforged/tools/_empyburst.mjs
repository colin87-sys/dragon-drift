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
    await page.waitForTimeout(1600);
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
    if (s.pitch) await page.evaluate((p) => {   // undo the pitch so the next shot starts clean
      const c = window.__dd.camera; c.rotation.x -= p; c.updateMatrixWorld();
    }, s.pitch);
  }
  await done();
}

console.log('THE EMPYREAN — holistic burst captures');
await session('desk', { width: 960, height: 600 }, [
  { name: 'early',  dist: 1200 },
  { name: 'mid',    dist: 2000 },
  { name: 'cruise', dist: 2400 },
  { name: 'sky',    dist: 2400, pitch: 0.35 },
  { name: 'water',  dist: 2400, pitch: -0.25 },
  { name: 'live',   dist: 2600, burst: 3 },
  { name: 'late',   dist: 3200 },
]);
await session('phone', { width: 390, height: 780 }, [
  { name: 'cruise', dist: 2400 },
  { name: 'late',   dist: 3200 },
]);
