// Forum MIXED-COMPOSITION capture — the WHOLE biome-0 forum (hero arches + viamarina near-rail + drumfall
// foil TOGETHER), from the natural chase camera, to judge RELATIVE SCALE the way the player sees it.
// No hero pin (so every forum archetype spawns). ?biome=0&debug&props=forum
//   node tools/_forumscene.mjs [tag]  →  reforged-captures/forumscene-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1460, height: 760 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 's1';
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum`, viewport: VIEW, deviceScaleFactor: 1.3, initScript: save });
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
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents();
  window.__pin = setInterval(() => {
    dd.game.health = 100; dd.clearVents && dd.clearVents();
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0;
    if (dd.game.hitFlash != null) dd.game.hitFlash = 0;
  }, 16);
});
// Natural chase camera (do NOT override cameraCtl) — sample a few distances and keep the frames.
let shot = 0;
for (let i = 0; i < 5 && shot < 4; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 380 + i * 90 });
  await page.waitForTimeout(400);
  writeFileSync(`reforged-captures/forumscene-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + ' @ dist', 380 + i * 90);
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`forumscene ${tag}: ${shot} frames; err=${errors.length}`);
