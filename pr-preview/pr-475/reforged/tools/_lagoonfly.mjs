// Full-biome FOLLOW-CAM flythrough of the live Lost Lagoon (v3 default kit) — the owner's shipping frame.
// No hero pin: the whole roster + composition + the new colossal karst class + honey rock + no-stars sky.
// Robust playing-state start; health pinned; hazards cleared for a clean read.  node tools/_lagoonfly.mjs [tag]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1000, height: 1560 };   // portrait, ~ the owner's phone crop (the light-axis composition reads best tall); sized so headless GPU readback doesn't stall
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'v3';
const { page, done, errors } = await boot({ query: '?biome=0&debug', viewport: VIEW, deviceScaleFactor: 1.0, initScript: save });
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
const dists = [340, 470, 610, 760, 900, 1050];   // sweep across breaths + congregations to catch a colossal karst
for (let i = 0; i < dists.length; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; }, dists[i]);
  await page.waitForTimeout(360);
  writeFileSync(`reforged-captures/lagoonfly-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot({ animations: 'disabled', timeout: 12000 }));
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`lagoonfly ${tag}: ${dists.length} frames; err=${errors.length}`);
