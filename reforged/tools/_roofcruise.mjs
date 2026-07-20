// ROOFLINE in-context cruise (PR-8.1 Fable gate) — hero=roofline so the villa roofs populate the congregation
// feet, natural chase camera, portrait gold-sunset water. Judges the REAL read: does the terracotta gable read
// as a drowned villa + scale cue among the pale travertine, does the ridge rhythm survive at cruise, is the clay
// a quiet HUE note (not a focal-rival accent)? node tools/_roofcruise.mjs [tag] [d0]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 720, height: 1480 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'r1';
const d0 = +(process.argv[3] || 85);
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=roofline`, viewport: VIEW, deviceScaleFactor: 1.3, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.waitForFunction(() => window.__dd && window.__dd.game, { timeout: 15000 }).catch(() => {});
for (let a = 0; a < 12; a++) {
  const st = await page.evaluate(() => window.__dd && window.__dd.game && window.__dd.game.state).catch(() => null);
  if (st === 'playing') break;
  await page.click('#btn-start').catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(320);
}
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents(); dd.clearObstacles && dd.clearObstacles();
  window.__pin = setInterval(() => {
    dd.game.health = 100; dd.clearVents && dd.clearVents(); dd.clearObstacles && dd.clearObstacles();
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0; if (dd.game.hitFlash != null) dd.game.hitFlash = 0;
  }, 16);
});
await page.evaluate(() => { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; });
const dists = [d0, d0 + 500, d0 + 1000];   // three lagoon-comp peaks (period 500) where roofline clusters
let shot = 0;
for (let i = 0; i < dists.length; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.player.speed = 0.0001; }, dists[i]);
  await page.waitForTimeout(700);
  try { writeFileSync(`reforged-captures/roofcruise-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot({ timeout: 30000 })); console.log('frame', i, '@ dist', dists[i]); }
  catch (e) { console.log('frame', i, 'screenshot FAILED:', e.message); }
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`roofcruise ${tag}: ${shot} frames; err=${errors.length}`);
