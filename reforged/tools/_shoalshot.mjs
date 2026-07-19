// _shoalshot.mjs — THE EMPYREAN PR-5b inkShoal capture. Pins biome 5, freezes, and frames the ink-koi
// SCHOOL drifting high ahead of the lane (cruise + a slight look-up), plus a diagnostic dump of the
// camera and the shoal instances' world + screen positions so framing/size can be tuned fast.
//   node tools/_shoalshot.mjs  →  /tmp/shoal-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 960, height: 600 };
const mkSave = (q = 0) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, stats: { runs: 5 }, flags: { seenIntro: true, seenFirstSurge: true },
  settings: { reticle: false, qualityOverride: ${q} },
}))`;

async function capture(name, { dist = 2400, pitch = 0, diag = false }) {
  const query = `?biome=5&debug&cleanshot&seed=73101`;
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: mkSave(0) });
  await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-start'); if (b) b.click();
    return window.__dd.game && window.__dd.game.state === 'playing';
  }, { timeout: 30000, polling: 500 });
  await page.waitForTimeout(1500);
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; }, dist);
  await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, dist).catch(() => {});
  await page.waitForTimeout(1900);
  await page.evaluate(() => {
    window.__dd.game.timeScale = 0;
    window.__dd.clearObstacles && window.__dd.clearObstacles();
    window.__dd.clearVents && window.__dd.clearVents();
  });
  if (pitch) await page.evaluate((p) => {
    const c = window.__dd.camera; c.rotation.x += p; c.updateMatrixWorld();
  }, pitch);
  // Pin the FOV so the dynamic speed-eased lens (77–96°) doesn't jump the koi's apparent size between runs.
  await page.evaluate(() => { const c = window.__dd.camera; c.fov = 85; c.updateProjectionMatrix(); });
  await page.waitForTimeout(160);
  if (diag) {
    const d = await page.evaluate(() => {
      const c = window.__dd.camera;
      let shoal = null;
      window.__dd.scene.traverse((o) => { if (o.name === 'inkShoal') shoal = o; });
      const out = { cam: c.position.toArray().map(n => +n.toFixed(1)), fov: c.fov, visible: shoal ? shoal.visible : 'NO-SHOAL', koi: [] };
      if (shoal && shoal.visible) {
        const a = shoal.instanceMatrix.array;
        for (let i = 0; i < shoal.count; i += 4) {
          out.koi.push({ i, w: [+a[i*16+12].toFixed(1), +a[i*16+13].toFixed(1), +a[i*16+14].toFixed(1)] });
        }
      }
      return out;
    });
    console.log(`  [${name}] diag`, JSON.stringify(d));
  }
  const buf = await page.screenshot({ timeout: 60000, animations: 'disabled' });
  writeFileSync(`/tmp/shoal-${name}.png`, buf);
  // 3× zoom crop of the upper-centre band where the school sits, for the silhouette read
  const zoom = await page.screenshot({ timeout: 60000, animations: 'disabled', clip: { x: 470, y: 0, width: 420, height: 290 } });
  writeFileSync(`/tmp/shoal-${name}-zoom.png`, zoom);
  console.log(`  wrote /tmp/shoal-${name}.png (+zoom)`);
  await done();
}

const only = process.argv.slice(2);
const want = (n) => only.length === 0 || only.includes(n);
console.log('THE EMPYREAN — PR-5b inkShoal captures');
if (want('cruise')) await capture('cruise', { dist: 2400, pitch: 0, diag: true });
if (want('up'))     await capture('up',     { dist: 2400, pitch: 0.18, diag: true });
