// Lost Lagoon capture — sweep biome 0 to find + frame the props (the rotunda hero) in the real
// golden-hour shipping light. Static frozen frames at a sweep of distances.
//   node tools/_lagoon.mjs [tag] [startDist] [count] [stepM]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 's1';
const start = +(process.argv[3] || 200);
const count = +(process.argv[4] || 14);
const stepM = +(process.argv[5] || 95);
const { page, done, errors } = await boot({ query: '?biome=0&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
page.on('pageerror', (e)=>console.log('[pageerror]',e.message));
await page.click('#btn-start').catch(()=>{});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(()=>{});
await page.evaluate(() => { const dd = window.__dd; dd.noBoss && dd.noBoss(true); window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents(); }, 24); });
for (let i=0;i<count;i++) {
  const d = start + i*stepM;
  await page.evaluate((dd)=>{ window.__dd.player.dist = dd; }, d);
  await page.waitForTimeout(420);
  await page.evaluate(()=>{ window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(90);
  writeFileSync(`reforged-captures/lagoon-${tag}-${String(i).padStart(2,'0')}.png`, await page.screenshot());
  await page.evaluate(()=>{ window.__dd.game.timeScale = 1; });
}
await done();
console.log(`lagoon ${tag}: ${count} frames from ${start}m step ${stepM}; err=${errors.length}`);
if (errors.length) console.log(errors.slice(0,3).join('\n'));
