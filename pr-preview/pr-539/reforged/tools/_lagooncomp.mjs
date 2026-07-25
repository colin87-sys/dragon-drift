// Natural COMPOSITION shot: the shipping follow-cam, all roster props, the dragon flying by in REAL time
// (no dist-teleport, no freeze) through the drowned-ruin archipelagos + golden-hour god-rays. Health is
// pinned so a clip never ends the run and wrecks the frame; hazards cleared for a clean read. Captures a
// burst — pick the frame where the dragon + an island group compose best.  node tools/_lagooncomp.mjs [tag]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1600, height: 1000 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'comp';
const { page, done, errors } = await boot({ query: '?biome=0&debug', viewport: VIEW, deviceScaleFactor: 1.5, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents();
  // pin health so a clip never ends the run mid-capture; keep hazards cleared
  window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents(); }, 24);
});
// fly into the first archipelago group, then capture a real-time burst across a full breath→congregation
await page.evaluate(() => { window.__dd.player.dist = 300; });
for (let i = 0; i < 16; i++) {
  await page.waitForTimeout(260);
  writeFileSync(`reforged-captures/lagooncomp-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot());
}
await page.evaluate(() => clearInterval(window.__pin));
await done();
console.log(`lagooncomp ${tag}: 16 real-time frames; err=${errors.length}`);
