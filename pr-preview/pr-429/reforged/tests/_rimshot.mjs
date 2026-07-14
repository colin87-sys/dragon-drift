// One-off visual gate: drive to the settled heaven (boss ignited) and SAVE the frame so a human/model
// can LOOK at the rim against the vision — the gate I skipped. Not a test; a capture.
import { boot } from './browser.mjs';
const { page, done } = await boot();
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);
const st = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(3); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500));
  window.__dd.input.surgeTap = true;
  let s; for (let i = 0; i < 80; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (s.mix >= 1.99 && s.heavenRays > 0.9 && (s.igniteLift?.k ?? 0) > 0.95) break; }
  return { mix: s.mix, igniteK: s.igniteLift?.k, rimShellVis: s.igniteLift?.rimShellVis, rimGlow: s.igniteLift?.rimGlow };
});
await page.waitForTimeout(300);
await page.screenshot({ path: process.argv[2] || '/tmp/rimshot.png' });
console.log('captured', JSON.stringify(st));
await done();
