// Context frames for the art director: current Sanctuary(0)/Wastes(1) to retool + shipped
// premium Frozen(2)/Caldera(3) to differ from. Static mid-biome + one closer moving frame each.
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
for (const bi of [0,1,2,3]) {
  const { page, done, errors } = await boot({ query: `?biome=${bi}&debug`, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  page.on('pageerror', (e)=>console.log('[pageerror]',bi,e.message));
  await page.click('#btn-start').catch(()=>{});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(()=>{});
  await page.evaluate(() => { window.__dd.noBoss && window.__dd.noBoss(true); });
  const base = bi*1500 + 700;
  let i=0;
  for (const d of [base, base+220]) {
    await page.evaluate((dd)=>{ window.__dd.player.dist = dd; }, d);
    await page.waitForTimeout(500);
    await page.evaluate(()=>{ window.__dd.game.timeScale = 0; });
    await page.waitForTimeout(120);
    writeFileSync(`reforged-captures/bctx-${bi}-${i}.png`, await page.screenshot());
    await page.evaluate(()=>{ window.__dd.game.timeScale = 1; });
    i++;
  }
  await done();
  console.log(`biome ${bi}: ${i} frames, err=${errors.length}`);
}
