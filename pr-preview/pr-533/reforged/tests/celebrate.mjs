// Celebration overlay: shows on purchase, owns input (blank taps + Enter can
// NEVER fall through into a takeoff/restart), dismisses clean, disposes the
// preview canvas. Min-show timing is asserted via the debug handle — real
// clicks at headless ~3fps can outlive the 600ms window.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 2, stats: { runs: 5 }, flags: { seenIntro: true }, embers: 9999 }))`,
});

// Buy a dragon from the start-screen shop. The shop is the hero character-select
// since the hero-scene redesign: pick the thumb on the rail, then the #hero-cta
// UNLOCK button buys. Direct DOM clicks + interval polling (rAF starves under
// swiftshader — the tools/uishots.mjs gotcha).
await page.click('#btn-shop');
await page.waitForSelector('.hero-thumb[data-hero="ember"]');
await page.$eval('.hero-thumb[data-hero="ember"]', (el) => el.click());
await page.waitForFunction(() => !!document.querySelector('#hero-cta button[data-cta="buy"]'), { polling: 120 });
await page.waitForTimeout(600);   // let wireHeroSelect finish re-rendering the CTA (async preview swap re-wires it)
await page.$eval('#hero-cta button[data-cta="buy"]', (el) => el.click());
await page.waitForFunction(() => document.querySelector('#celebrate')?.classList.contains('visible'), { timeout: 20000, polling: 120 });   // waitForSelector's visibility check starves under swiftshader (uishots gotcha) — poll the class
check('celebration overlay appears on purchase', true);
check('purchase landed (owned + equipped)', await page.evaluate(() =>
  window.__dd.save.skins.owned.includes('ember') && window.__dd.save.skins.equipped === 'ember'));
check('live turntable canvas in the spotlight', !!(await page.$('.celebrate-canvas')));

// Blank tap on the overlay: the global tap-to-fly listener must never fire.
await page.waitForTimeout(700); // past min-show
await page.mouse.click(450, 60);
await page.waitForTimeout(250);
check('blank tap dismissed the overlay', !(await page.$eval('#celebrate', (el) => el.classList.contains('visible'))));
check('…without a takeoff underneath (state still ready)',
  await page.evaluate(() => window.__dd.game.state === 'ready'));
check('shop screen still up behind it', await page.evaluate(() => window.__dd.ui.inSubscreen()));
await page.waitForTimeout(400);
check('preview canvas disposed after dismiss', !(await page.$('.celebrate-canvas')));

// Min-show determinism: a dismiss attempt in the same tick as celebrate() is
// eaten (returns true = input owned) and the overlay stays visible.
const minShow = await page.evaluate(() => {
  const ui = window.__dd.ui;
  ui.celebrate({ kind: 'generic', tier: 'small', glyph: '✦', title: 'Test' });
  const eaten = ui.dismissCelebrate();
  const stillVisible = document.querySelector('#celebrate').classList.contains('visible');
  return { eaten, stillVisible };
});
check('immediate dismiss attempt is eaten by min-show', minShow.eaten && minShow.stillVisible);

// Enter after min-show: dismisses instead of launching a run.
await page.waitForTimeout(700);
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
check('Enter dismissed the overlay instead of launching',
  await page.evaluate(() => window.__dd.game.state === 'ready') &&
  !(await page.$eval('#celebrate', (el) => el.classList.contains('visible'))));

// Gameover origin: buy from the recap's shop — blank tap must not restart.
// $eval clicks + polled waits throughout: page.click's actionability checks starve
// under swiftshader (uishots gotcha). Leave the shop via its topbar back button
// (the hero-select redesign dropped the old blank-tap-back affordance).
await page.$eval('#btn-back', (el) => el.click());
await page.waitForFunction(() => !!document.querySelector('#btn-start'), { polling: 120, timeout: 15000 });
await page.$eval('#btn-start', (el) => el.click());
await page.waitForFunction(() => window.__dd.game.state === 'playing');
await page.evaluate(() => {
  window.__dd.save.revives = 0;
  window.__dd.player.position.x = 99;
});
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
await page.waitForSelector('#screen .run-stats', { timeout: 30000 });
await page.$eval('#btn-shop', (el) => el.click());
await page.waitForSelector('.hero-thumb[data-hero="jade"]');
await page.$eval('.hero-thumb[data-hero="jade"]', (el) => el.click());
await page.waitForFunction(() => !!document.querySelector('#hero-cta button[data-cta="buy"]'), { polling: 120 });
await page.waitForTimeout(600);   // CTA re-render settle (see above)
await page.$eval('#hero-cta button[data-cta="buy"]', (el) => el.click());
await page.waitForFunction(() => document.querySelector('#celebrate')?.classList.contains('visible'), { timeout: 20000, polling: 120 });   // waitForSelector's visibility check starves under swiftshader (uishots gotcha) — poll the class
await page.waitForTimeout(700);
await page.mouse.click(450, 60); // blank tap: dismiss, NOT restart
await page.waitForTimeout(300);
check('gameover-origin blank tap dismisses without restarting',
  await page.evaluate(() => window.__dd.game.state === 'gameover'));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
