// GLOW-UP Phase 1 in-game capture: grab a few CRUISE frames (fever off — judge the cool storm rim,
// off-with-hints bones, steel body) then a few SURGE frames (fever on + arcs forced — bones lit).
// node tools/_p1shot.mjs
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
// CRUISE — fever OFF: the rim + off-with-hints bones + steel body.
for (let i = 0; i < 5; i++) {
  await page.evaluate(() => { if (window.__dd?.game) { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; } globalThis.__ddArcForce = false; });
  await page.screenshot({ path: `/tmp/p1-cruise-${String(i).padStart(2, '0')}.png`, clip: { ...CLIP } });
  await page.waitForTimeout(130);
}
// SURGE — fever ON + arcs pinned full: bones lit + the cage.
await page.evaluate(() => { globalThis.__ddArcForce = true; if (window.__dd?.game) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 99999; } });
await page.waitForTimeout(700);
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => { globalThis.__ddArcForce = true; if (window.__dd?.game) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 99999; } });
  await page.screenshot({ path: `/tmp/p1-surge-${String(i).padStart(2, '0')}.png`, clip: { ...CLIP } });
  await page.waitForTimeout(130);
}
console.log('wrote cruise+surge frames');
await done();
