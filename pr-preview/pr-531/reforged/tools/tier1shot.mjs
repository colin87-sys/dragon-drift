// tier1shot.mjs — N11 A/B. Pins tier1 (qualityOverride=1) and captures a Sanctuary
// dusk frame (reflective water + horizon sun) so the god-rays + reflection that N11
// grants tier1 are visible. Run once on the branch (new) and once with N11 stashed
// (old) to get the before/after.
//   node tools/tier1shot.mjs <label>  → /tmp/tier1-<label>.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const label = process.argv[2] || 'new';
const VIEW = { width: 1000, height: 640 };
const noSW = `if (navigator.serviceWorker) { navigator.serviceWorker.register = () => Promise.resolve({}); };\n`;
const save = noSW + `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, qualityOverride: 1 },
}))`;

const { page, done } = await boot({ query: '?debug&seed=73101', viewport: VIEW, deviceScaleFactor: 2, initScript: save });
await page.waitForFunction(() => !!document.querySelector('#btn-start'), { timeout: 10000 });
await page.evaluate(() => document.querySelector('#btn-start').click());
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 12000 });
await page.evaluate(() => { window.__dd.noBoss(true); });
const info = await page.evaluate(async () => {
  const dd = window.__dd;
  // Freeze-at-warp: jump the distance AND freeze in the SAME tick so the input-less
  // dragon can't fly into a prop and die to the summary screen. Sanctuary props
  // already populate near boot (~300 m), sun on the horizon ahead for the shafts.
  dd.player.dist = 300;
  dd.game.timeScale = 0;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  let res = null; dd.scene.traverse(o => { if (o.isReflector) res = o.getRenderTarget().width; });
  return { tier: document.body.dataset.qtier, mirror: res };
});
await page.waitForTimeout(400);
const client = await page.context().newCDPSession(page);
const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
writeFileSync(`/tmp/tier1-${label}.png`, Buffer.from(data, 'base64'));
console.log(`wrote /tmp/tier1-${label}.png`, JSON.stringify(info));
await done();
