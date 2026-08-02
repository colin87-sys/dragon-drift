// Boot smoke test: game loads with zero console errors, the hero start screen
// renders, and the progressively-revealed meta is reachable from the rail.
// Seeded with runs=5 so the full rail (returning-pilot) shows.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
await page.waitForTimeout(1200); // let a few frames render

check('boots with zero console errors', errors.length === 0) ||
  console.error(errors.join('\n'));

check('start screen visible', await page.$eval('#screen', (el) => el.classList.contains('visible')));
check('hero wordmark rendered', (await page.textContent('#screen h1')) === 'DRAGON DRIFT');
check('TAKE OFF button present', !!(await page.$('#btn-start')));
check('rail: SHOP', !!(await page.$('#btn-shop')));
check('rail: QUESTS', !!(await page.$('#btn-quests')));
check('rail: DAILY', !!(await page.$('#btn-daily')));
check('rail: PILOT', !!(await page.$('#btn-pilot')));
check('HUD score element exists', !!(await page.$('#score')));

// QUESTS panel holds the relocated missions / weekly / next-up.
await page.click('#btn-quests');
await page.waitForSelector('.mission-list');
check('mission cards rendered', (await page.$$('.mission-card')).length === 3);
check('weekly strip rendered', !!(await page.$('.weekly-strip')));
check('next-up line rendered', !!(await page.$('.nextup-line')));
await page.click('#btn-back');
await page.waitForSelector('#btn-start');

// DAILY panel holds the relocated daily card.
await page.click('#btn-daily');
await page.waitForSelector('.daily-card');
check('daily card rendered in panel', !!(await page.$('.daily-card')));
await page.click('#btn-back');
await page.waitForSelector('#btn-start');

// Start a flight and let it run briefly.
await page.click('#btn-start');
await page.waitForTimeout(800);
check('game enters playing state', await page.evaluate(() => window.__dd.game.state === 'playing'));
check('no errors during flight', errors.length === 0) || console.error(errors.join('\n'));

await done();
