// Throwaway: capture trough frames near local 795 (spire beacon + open mirror). node tools/_miretrough.mjs
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 640, height: 1386 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, ascension:{tiers:[['azure',0]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false,slowMo:false,qualityOverride:null} }))`;
const { page, done, errors } = await boot({ query: '?biome=4&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
for (const d of [700, 740, 780, 820]) {
  await page.evaluate((dd) => { window.__dd.player.dist = dd; window.__dd.game.timeScale = 0.35; }, d);
  await page.waitForTimeout(650);
  await page.evaluate(() => { window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(90);
  writeFileSync(`/tmp/miretrough-${d}.png`, await page.screenshot());
  await page.evaluate(() => { window.__dd.game.timeScale = 0.35; });
}
await done();
console.log('errors', errors.length, 'wrote /tmp/miretrough-*.png');
