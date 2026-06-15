// Shop must always be interactive: dragon turntables render, every tab and the
// close button work, and nothing throws. Regression guard for the bug where a
// numeric glow hex made buildDragonModel throw → blank turntables + dead tabs
// (the preview attach ran before button wiring, so one throw killed the UI).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, stats: { runs: 5 }, flags: { seenIntro: true }, embers: 9000,
    skins: { owned: ['azure', 'ember', 'solar'], equipped: 'solar' },
    ascension: { tiers: [['solar', 3], ['ember', 2]], radiance: [] },
    cosmetics: { marksOwned: ['goldleaf'], markEquipped: '', formPref: [] },
  }))`,
});

await page.click('#btn-shop');
await page.waitForSelector('.shop-grid');

// Both reported symptoms: previews present + nothing threw during render.
const dragonCanvases = await page.$$eval('canvas.skin-preview[data-kind="dragon"]', els => els.length);
check('dragon preview canvases present', dragonCanvases >= 6);
check('shop render threw nothing', errors.length === 0) || console.error(errors.join('\n'));

// Turntable actually drew: at least one dragon canvas has non-transparent pixels.
await page.waitForTimeout(700); // let the ~30fps preview loop blit a few frames
const drew = await page.evaluate(() => {
  const cs = [...document.querySelectorAll('canvas.skin-preview[data-kind="dragon"]')];
  return cs.some((c) => {
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
    } catch { /* tainted/no-2d */ }
    return false;
  });
});
check('a dragon turntable rendered visible pixels', drew);

// Form scrub must change ONLY the scrubbed dragon, not every card.
const emberBefore = await page.$eval('[data-form-label="ember"]', el => el.textContent);
const solarBefore = await page.$eval('[data-form-label="solar"]', el => el.textContent);
await page.click('.form-arrow[data-form-prev="ember"]');
await page.waitForTimeout(120);
const emberAfter = await page.$eval('[data-form-label="ember"]', el => el.textContent);
const solarAfter = await page.$eval('[data-form-label="solar"]', el => el.textContent);
check('scrubbing ember changes ember\'s own form label', emberAfter !== emberBefore);
check('scrubbing ember leaves solar\'s form untouched', solarAfter === solarBefore);

// Scrubbing the EQUIPPED dragon (solar) also rebuilds the in-game model.
await page.click('.form-arrow[data-form-prev="solar"]');
await page.waitForTimeout(150);
check('scrubbing the equipped dragon rebuilds in-game without erroring', errors.length === 0) || console.error(errors.join('\n'));

// Tabs respond (the wiring that was dead before).
await page.click('.seg-btn[data-shoptab="music"]');
await page.waitForSelector('.track-card');
check('MUSIC tab switches', !!(await page.$('.track-card')));

await page.click('.seg-btn[data-shoptab="style"]');
await page.waitForSelector('canvas.trail-preview');
check('STYLE tab switches + trail previews render', !!(await page.$('canvas.trail-preview')));
// Trail-preview canvases must let touch-scroll through (not global touch-action:none).
const trailTouch = await page.$eval('canvas.trail-preview', el => getComputedStyle(el).touchAction);
check('STYLE trail previews allow scroll (touch-action not none)', trailTouch !== 'none');

await page.click('.seg-btn[data-shoptab="riders"]');
await page.waitForSelector('.skin-card[data-rider]');
check('RIDERS tab switches', !!(await page.$('.skin-card[data-rider]')));

// Close button works.
await page.click('.seg-btn[data-shoptab="dragons"]');
await page.waitForSelector('.skin-card[data-dragon]');
await page.click('#btn-back');
await page.waitForSelector('#btn-start');
check('close button exits the shop to the start screen', !!(await page.$('#btn-start')));

check('no console errors through the whole shop session', errors.length === 0) || console.error(errors.join('\n'));
await done();
