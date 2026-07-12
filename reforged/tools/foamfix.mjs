// foamfix.mjs — capture a Frozen Reach crystal base with foam + AO + depth ON, to
// judge the Issue-1 (foam too solid) + Issue-2 (black base patches) fixes. Freezes
// on a frame where a crystal sits close in the chase view.
//   node tools/foamfix.mjs <label>  → /tmp/foamfix-<label>.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const label = process.argv[2] || 'new';
const VIEW = { width: 800, height: 1000 };
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 0 },
}))`;

const query = '?debug&seed=73101&ao&atmos&clouds&swell&depth&foam';
const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 2, initScript: save });
await page.waitForFunction(() => !!document.querySelector('#btn-start'), { timeout: 10000 });
await page.evaluate(() => document.querySelector('#btn-start').click());
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 12000 });
await page.evaluate(() => window.__dd.noBoss(true));

const info = await page.evaluate(async () => {
  const dd = window.__dd;
  function nearest() {
    const cam = dd.camera.position; let best = 1e9;
    dd.scene.traverse((o) => {
      if (!o.isInstancedMesh || !o.visible) return;
      const m = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) {
        const x = m[i*16+12], y = m[i*16+13], z = m[i*16+14];
        if (y < -10) continue;
        const d = Math.hypot(x - cam.x, z - cam.z);
        if (d < best) best = d;
      }
    });
    return best;
  }
  // Warp deep into Frozen Reach (biome 2 = dist 3000–4400) and let the prop bands
  // recycle Frozen crystals into the window (a few rAF per step). Only freeze once
  // we're solidly in-biome AND a tall crystal sits close in the chase view.
  for (let step = 0; step < 90; step++) {
    dd.player.dist = 3500 + step * 12;
    for (let f = 0; f < 3; f++) await new Promise(r => requestAnimationFrame(r));
    if (dd.player.dist > 3200 && nearest() < 24) { dd.game.timeScale = 0; return { dist: dd.player.dist, near: nearest() }; }
  }
  dd.game.timeScale = 0;
  return { dist: dd.player.dist, near: nearest() };
});
await page.waitForTimeout(350);
// Raw CDP capture — Playwright's page.screenshot() waits on document.fonts.ready,
// which never resolves under the SW-block stub. CDP captures the frame directly.
const client = await page.context().newCDPSession(page);
const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(data, 'base64');
writeFileSync(`/tmp/foamfix-${label}.png`, buf);
console.log(`wrote /tmp/foamfix-${label}.png`, info);
await done();
