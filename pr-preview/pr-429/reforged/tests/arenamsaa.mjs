// Verify the arena MSAA toggle reallocates the composer's multisample framebuffers
// cleanly at runtime. The heaven arena drops MSAA to 0 (soft additive fire needs no
// AA, and the resolve is the confirmed fill wall); everywhere else keeps 4×. This
// asserts the flip 4→0→4 takes effect and the renderer rebuilds with zero errors.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);

const samples = () => page.evaluate(() => window.__dd.postfx.handle.composer?.renderTarget1?.samples);

check('composer boots with 4× MSAA', (await samples()) === 4);

// Drop MSAA (what the heaven-arena flip does) and let the renderer rebuild.
await page.evaluate(() => window.__dd.postfx.setPostMSAA(0));
await page.waitForTimeout(200);
check('MSAA drops to 0 in the arena', (await samples()) === 0);

// Exit the arena restores full AA.
await page.evaluate(() => window.__dd.postfx.setPostMSAA(4));
await page.waitForTimeout(200);
check('MSAA restored to 4× on exit', (await samples()) === 4);

check('no console errors through the MSAA flips', errors.length === 0) || console.error(errors.join('\n'));

console.log('\narena MSAA toggle passed.');
await done();
