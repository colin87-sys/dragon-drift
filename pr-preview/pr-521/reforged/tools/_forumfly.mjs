// Full-biome FOLLOW-CAM flythrough of THE DROWNED FORUM atmosphere (?props=forum). PR-1 has no props
// yet, so this is the ATMOSPHERE BLIND TEST (§5 PR-1 / §10 Recipe B): pure water/fog/sky/motes in the
// new gold-on-water Roman palette. Must read as a NEW biome vs the Lost Lagoon captures before any
// geometry lands.  node tools/_forumfly.mjs [tag]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1000, height: 1560 };   // owner's portrait phone crop; sized so headless GPU readback doesn't stall
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'forum';
const { page, done, errors } = await boot({ query: '?biome=0&debug&props=forum', viewport: VIEW, deviceScaleFactor: 1.0, initScript: save });
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
  window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents(); }, 24);
});
const dists = [420, 640, 880];   // a few points across a biome window — atmosphere-only read
for (let i = 0; i < dists.length; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; }, dists[i]);
  await page.waitForTimeout(420);
  writeFileSync(`reforged-captures/forumfly-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot({ animations: 'disabled', timeout: 15000 }));
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`forumfly ${tag}: ${dists.length} frames; err=${errors.length}`);
