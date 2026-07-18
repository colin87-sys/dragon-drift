// _empyregate.mjs — ONE boot, multiple frames for the Fable-model re-gate of PR-1/2/3.
// Frames: sky (blooms+stars+zenith, sun-kill), water (waterline nacre + glitter-kill), mote (the black disc).
// Reapplies the view in a tight loop right before each screenshot to beat the chase-cam reassert.
import { writeFileSync } from 'fs';
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
console.log('done.');
await done();
