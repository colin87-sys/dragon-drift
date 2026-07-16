// Lost Lagoon capture — biome 0 atmosphere/props, static mid-biome frames + optional close moving.
//   node tools/_lagoon.mjs [tag]  →  reforged-captures/lagoon-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'r1';
const { page, done, errors } = await boot({ query: '?biome=0&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('pageerror', (e)=>console.log('[pageerror]',e.message));
await page.click('#btn-start').catch(()=>{});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(()=>{});
await page.evaluate(() => { window.__dd.noBoss && window.__dd.noBoss(true); });
let i=0;
for (const d of [500, 720, 940]) {
  await page.evaluate((dd)=>{ window.__dd.player.dist = dd; }, d);
  await page.waitForTimeout(500);
  await page.evaluate(()=>{ window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(120);
  writeFileSync(`reforged-captures/lagoon-${tag}-${i}.png`, await page.screenshot());
  await page.evaluate(()=>{ window.__dd.game.timeScale = 1; });
  i++;
}
await done();
console.log(`lagoon ${tag}: ${i} frames, err=${errors.length}`);
if (errors.length) console.log(errors.slice(0,3).join('\n'));
