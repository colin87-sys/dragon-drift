// quick diagnostic: boot biome 5, start playing, freeze + teleport, verify trees render and the game
// is NOT crashed. node tools/_treecheck.mjs
import { boot } from '../tests/browser.mjs';
const mkSave = () => `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:3, stats:{runs:5}, flags:{seenIntro:true,seenFirstSurge:true}, settings:{reticle:false,qualityOverride:0} }))`;
const { page, done } = await boot({ query: `?biome=5&debug&cleanshot&seed=73101`, viewport: { width: 960, height: 600 }, deviceScaleFactor: 1, initScript: mkSave() });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
await page.waitForFunction(() => { const b = document.getElementById('btn-start'); if (b) b.click(); return window.__dd.game && window.__dd.game.state === 'playing'; }, { timeout: 30000, polling: 500 });
await page.waitForTimeout(1000);
await page.evaluate(() => { window.__dd.noBoss(true); window.__dd.game.timeScale = 0; window.__dd.player.dist = 2600; window.__dd.clearObstacles && window.__dd.clearObstacles(); });
await page.waitForTimeout(800);
const r = await page.evaluate(() => {
  const scene = window.__dd.scene || (window.__dd.game && window.__dd.game.scene);
  let tr = null, cn = null; let trees = 0;
  (scene || {}).traverse && scene.traverse((o) => { if (o.name === 'orchardTrunks') { tr = o; } if (o.name === 'orchardCanopies') cn = o; });
  return {
    state: window.__dd.game.state,
    dist: Math.round(window.__dd.player.dist),
    trunkVisible: tr ? tr.visible : 'NO_MESH', trunkCount: tr ? tr.count : 0,
    canopyVisible: cn ? cn.visible : 'NO_MESH',
    orchardMix: window.__dd.env ? window.__dd.env.empyOrchardMix : 'n/a',
  };
});
console.log(JSON.stringify(r, null, 2));
import { writeFileSync } from 'fs';
for (const d of [2600, 2640, 2680, 2720, 2760, 2800, 2840, 2880]) {
  await page.evaluate((dd) => { window.__dd.game.timeScale = 0; window.__dd.player.dist = dd; window.__dd.clearObstacles && window.__dd.clearObstacles(); }, d);
  await page.waitForTimeout(500);
  const buf = await page.screenshot();
  writeFileSync(`/tmp/treecheck-${d}.png`, buf);
  console.log(`wrote /tmp/treecheck-${d}.png`);
}
await done();
