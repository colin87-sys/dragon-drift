// Freeze at Sun Gate approaches (no flying -> no boss spawn) to judge the hero.
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, ascension:{tiers:[['azure',0]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false,slowMo:false,qualityOverride:null} }))`;
const { page, done, errors } = await boot({ query: '?biome=2&debug', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.click('#btn-start').catch(()=>{});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(()=>{});
// gate dists: 2745, 3045, 3645, 4245. Freeze ~40m before each so the gate frames the sun ahead.
for (const [dist, tag] of [[2645,'g1'],[2745,'g2'],[3545,'g3'],[3645,'g4']]) {
  await page.evaluate((d)=>{ window.__dd.player.dist = d; }, dist);
  await page.waitForTimeout(600);
  await page.evaluate(()=>{ window.__dd.game.timeScale = 0; });
  await page.waitForTimeout(150);
  writeFileSync(`/tmp/gate-${tag}.png`, await page.screenshot());
  await page.evaluate(()=>{ window.__dd.game.timeScale = 1; });
}
await done();
console.log('errors:', errors.length, '-> /tmp/gate-g1..g4.png');
