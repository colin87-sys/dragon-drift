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
await page.waitForSelector('.hero-select');

// Hero character-select: a thumbnail RAIL (one per dragon) + the big hero stage.
const railThumbs = await page.$$eval('.hero-thumb-canvas', els => els.length);
check('rail thumbnails present (one per dragon)', railThumbs >= 6);
check('hero stage canvas present', !!(await page.$('#hero-canvas')));
check('shop render threw nothing', errors.length === 0) || console.error(errors.join('\n'));

// Turntables actually drew: at least one rail thumbnail has non-transparent pixels.
await page.waitForTimeout(700); // let the ~30fps preview loop blit a few frames
const drew = await page.evaluate(() => {
  const cs = [...document.querySelectorAll('.hero-thumb-canvas')];
  return cs.some((c) => {
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) return true;
    } catch { /* tainted/no-2d */ }
    return false;
  });
});
check('a dragon turntable rendered visible pixels', drew);

// Form segments switch the displayed form (the active segment moves). The hero
// defaults to the EQUIPPED dragon (solar), so this also rebuilds the in-game model.
const segBefore = await page.$eval('.hero-seg.on', el => el.dataset.form);
const segs = await page.$$('.hero-forms .hero-seg');
await segs[segBefore === '0' ? 1 : 0].click();
await page.waitForTimeout(150);
const segAfter = await page.$eval('.hero-seg.on', el => el.dataset.form);
check('tapping a form segment changes the active form', segAfter !== segBefore);
check('switching the equipped form rebuilds in-game without erroring', errors.length === 0) || console.error(errors.join('\n'));

// The rail switches the hero to another dragon (the name updates in place).
const heroNameBefore = await page.$eval('#hero-name', el => el.textContent);
await page.click('.hero-thumb:not(.on)');
await page.waitForTimeout(150);
const heroNameAfter = await page.$eval('#hero-name', el => el.textContent);
check('tapping a rail thumbnail switches the hero dragon', heroNameAfter !== heroNameBefore);

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
await page.waitForSelector('.hero-select');
await page.click('#btn-back');
await page.waitForSelector('#btn-start');
check('close button exits the shop to the start screen', !!(await page.$('#btn-start')));

check('no console errors through the whole shop session', errors.length === 0) || console.error(errors.join('\n'));
await done();
