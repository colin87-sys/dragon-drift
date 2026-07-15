// Surge ARC-CROWN capture: boot live, poke Surge on, let the thunder beats fire the arcs, and grab a
// burst of frames to catch the cracks (arcs flash ~0.2 s per ~1.15 s beat). node tools/_arcshot.mjs [n]
import { boot } from '../tests/browser.mjs';
const key = 'tempest', tier = 3, N = Number(process.argv[2] ?? 16);
const { page, done } = await boot({
  query: `?debug`,
  viewport: { width: 1100, height: 720 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, skins:{owned:['${key}'],equipped:'${key}'}, ascension:{tiers:[['${key}',${tier}]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false,slowMo:false,qualityOverride:null} }))`,
});
for (let a = 0; a < 8; a++) { await page.click('#btn-start').catch(() => {}); if (await page.waitForSelector('#btn-start', { state: 'hidden', timeout: 1500 }).then(() => true, () => false)) break; }
await page.waitForTimeout(400);
await page.click('#gx-skip').catch(() => {});   // dismiss the gesture tutorial (it pauses the game)
await page.evaluate(() => { document.getElementById('gx-skip')?.click(); }).catch(() => {});
await page.waitForTimeout(1800);   // climb into steady flight
await page.evaluate(() => { if (window.__dd && window.__dd.game) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 99999; } });
await page.waitForTimeout(700);    // let Surge ramp (surgeMix damps up)
const CLIP = { x: 250, y: 210, width: 600, height: 420 };
for (let i = 0; i < N; i++) {
  await page.evaluate(() => { if (window.__dd && window.__dd.game) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 99999; } });
  await page.screenshot({ path: `/tmp/arc-tempest-${String(i).padStart(2, '0')}.png`, clip: { ...CLIP } });
  await page.waitForTimeout(110);
}
console.log('wrote', N, 'frames');
await done();
