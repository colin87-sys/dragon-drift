// Drowned Forum HAZARD capture — the biome-0 Phase Gate reskinned as the sinking triumphal arch
// (?props=forum). Finds a phaseGate group in the scene, parks the dragon on approach, frames it with the
// follow-cam.  node tools/_forumgate.mjs [tag]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 820 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9,phaseTaught:true}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'g1';
const { page, done, errors } = await boot({ query: '?biome=0&debug&props=forum', viewport: VIEW, deviceScaleFactor: 1.4, initScript: save });
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
  const dd = window.__dd; dd.noBoss && dd.noBoss(true);
  window.__pin = setInterval(() => {
    dd.game.health = 100;
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0;
  }, 16);
});
// find the nearest phaseGate group ahead of the player, park just before it
const findGate = () => {
  const dd = window.__dd; let best = null, bd = 1e9;
  dd.scene.traverse((g) => {
    if (!g.userData || !g.userData.phaseGate) return;
    const z = g.position.z; const dist = -z;
    if (dist > dd.player.dist + 40 && dist - dd.player.dist < bd) { bd = dist - dd.player.dist; best = { dist, x: 0 }; }
  });
  return best;
};
await page.evaluate(`window.__findGate = ${findGate.toString()};`);
let shot = 0;
for (let i = 0; i < 8 && shot < 3; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 300 + i * 140 });
  await page.waitForTimeout(200);
  const g = await page.evaluate(() => window.__findGate());
  if (!g) { console.log('probe' + i + ': no gate ahead'); continue; }
  await page.evaluate((o) => { window.__dd.player.dist = o.d - 34; window.__dd.player.speed = 0; window.__dd.player.x = 0; }, { d: g.dist });
  await page.waitForTimeout(300);
  writeFileSync(`reforged-captures/forumgate-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot({ animations: 'disabled', timeout: 15000 }));
  console.log('gate' + shot + ' @ dist', g.dist.toFixed(0));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`forumgate ${tag}: ${shot} frames; err=${errors.length}`);
