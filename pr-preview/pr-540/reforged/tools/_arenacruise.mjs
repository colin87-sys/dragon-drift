// ARENA in-context CRUISE capture (Fable's turn-one sightline gate) — natural chase camera, portrait (the real
// mobile play surface), hero=arena so only the bowl spawns, sweeping player.dist across the arena's actual
// window so it comes into frame naturally. Confirms the money read: ≥2-3 ground bays showing GOLD WATER + the
// plan-curve reading as a bowl. Hides #hud (the stamina-arc pareidolia law).
// node tools/_arenacruise.mjs [tag] [d0]  → reforged-captures/arenacruise-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 760, height: 1480 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'c1';
const d0 = +(process.argv[3] || 470);
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=arena`, viewport: VIEW, deviceScaleFactor: 1.0, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.waitForFunction(() => window.__dd && window.__dd.game, { timeout: 15000 }).catch(() => {});
for (let a = 0; a < 12; a++) { const st = await page.evaluate(() => window.__dd?.game?.state); if (st === 'playing') break; await page.click('#btn-start').catch(() => {}); await page.keyboard.press('Enter').catch(() => {}); await page.waitForTimeout(320); }
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents();
  window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents();
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0; if (dd.game.hitFlash != null) dd.game.hitFlash = 0; }, 16);
});
await page.evaluate(() => { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; });
let shot = 0;
const dists = [d0, d0 + 55, d0 + 110];
for (let i = 0; i < dists.length; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.player.speed = 0.0001; }, dists[i]);
  await page.waitForTimeout(520);   // let the band matrices scroll to this dist + settle
  writeFileSync(`reforged-captures/arenacruise-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot({ animations: 'disabled', timeout: 15000 }));
  console.log('frame', i, '@ dist', dists[i]);
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`arenacruise ${tag}: ${shot} frames; err=${errors.length}`);
