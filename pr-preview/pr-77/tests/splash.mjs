// Cinematic attract splash: a brand-new pilot lands on the splash (not the
// dashboard), and TAKE OFF flies straight into the run on the shown course.
import { boot, check } from './browser.mjs';

// No initScript → empty save → stats.runs === 0 → genuine first-timer.
const { page, errors, done } = await boot({ splash: true });
await page.waitForSelector('#splash.show', { timeout: 15000 });

check('splash visible for a brand-new pilot',
  await page.$eval('#splash', (el) => el.classList.contains('show')));
check('splash title reads DRAGON DRIFT',
  /DRAGON\s*DRIFT/.test((await page.textContent('.splash-title')) || ''));
check('TAKE OFF button present', !!(await page.$('#splash-takeoff')));
check('dashboard NOT shown over the splash',
  !(await page.$eval('#screen', (el) => el.classList.contains('visible'))));
check('HUD hidden under the splash',
  await page.evaluate(() => document.body.classList.contains('splash-open')));

await page.click('#splash-takeoff');
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
check('TAKE OFF starts the flight',
  await page.evaluate(() => window.__dd.game.state === 'playing'));
check('splash dismissed after takeoff',
  !(await page.evaluate(() => document.body.classList.contains('splash-open'))));
check('no console errors', errors.length === 0) || console.error(errors.join('\n'));

await done();
