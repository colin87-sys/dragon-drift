// Boot smoke test: game loads with zero console errors, start screen renders,
// HUD + new meta surfaces are present.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.waitForTimeout(1200); // let a few frames render

check('boots with zero console errors', errors.length === 0) ||
  console.error(errors.join('\n'));

check('start screen visible', await page.$eval('#screen', (el) => el.classList.contains('visible')));
check('title rendered', (await page.textContent('#screen h1')) === 'DRAGON DRIFT');
check('mission cards rendered', (await page.$$('.mission-card')).length === 3);
check('daily card rendered', !!(await page.$('.daily-card')));
check('HUD score element exists', !!(await page.$('#score')));
check('weekly strip rendered', !!(await page.$('.weekly-strip')));
check('next-up line rendered', !!(await page.$('.nextup-line')));
check('pilot button rendered', !!(await page.$('#btn-pilot')));

// Start a flight via the debug handle and let it run briefly.
await page.click('#btn-start');
await page.waitForTimeout(800);
check('game enters playing state', await page.evaluate(() => window.__dd.game.state === 'playing'));
check('no errors during flight', errors.length === 0) || console.error(errors.join('\n'));

await done();
