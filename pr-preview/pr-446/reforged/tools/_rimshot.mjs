// Cruise-only capture to verify the P1b cool rim clears bright water. Grabs several fever-off frames
// (the worst case is the dragon backlit over bright teal water). node tools/_rimshot.mjs
import { boot } from '../tests/browser.mjs';
const key = 'tempest', tier = 3;
const { page, done } = await boot({
  query: `?debug`,
  viewport: { width: 1100, height: 720 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, skins:{owned:['${key}'],equipped:'${key}'}, ascension:{tiers:[['${key}',${tier}]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,seenFirstRoll:true,phaseTaught:true,hintsSeen:195}, settings:{reticle:false,slowMo:false,qualityOverride:null} }))`,
});
for (let a = 0; a < 8; a++) { await page.click('#btn-start').catch(() => {}); if (await page.waitForSelector('#btn-start', { state: 'hidden', timeout: 1500 }).then(() => true, () => false)) break; }
await page.waitForTimeout(400);
await page.click('#gx-skip').catch(() => {});
await page.evaluate(() => { document.getElementById('gx-skip')?.click(); if (window.__dd?.save?.flags) window.__dd.save.flags.hintsSeen = 195; }).catch(() => {});
await page.waitForTimeout(2000);
const CLIP = { x: 250, y: 200, width: 600, height: 430 };
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => { if (window.__dd?.game) { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; } globalThis.__ddArcForce = false; });
  await page.screenshot({ path: `/tmp/rim-${String(i).padStart(2, '0')}.png`, clip: { ...CLIP } });
  await page.waitForTimeout(150);
}
console.log('wrote rim frames');
await done();
