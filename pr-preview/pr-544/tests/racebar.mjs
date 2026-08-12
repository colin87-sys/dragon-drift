// Challenge race bar: visible during a challenge run, crosses to gold with a
// popup the moment the friend's score falls.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({ query: '?challenge=500&seed=1337&debug' });

check('challenge banner on start screen', (await page.textContent('#screen')).includes('CHALLENGE'));
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
await page.waitForTimeout(400);

check('race bar visible during challenge run',
  await page.$eval('#race-bar', (el) => el.classList.contains('on')));
check('race target labelled', (await page.textContent('#race-target')).includes('500'));

await page.evaluate(() => { window.__dd.game.score = 600; });
await page.waitForFunction(() => window.__dd.game.challengeBeaten === true, { timeout: 4000 });
check('crossover flips the bar to won',
  await page.$eval('#race-bar', (el) => el.classList.contains('won')));
check('crossover label updates', (await page.textContent('#race-target')) === 'BEATEN!');

// Recap shows the beaten challenge + riposte share text path
await page.evaluate(() => {
  window.__dd.save.revives = 0;
  window.__dd.player.position.x = 99;
});
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
check('recap shows CHALLENGE BEATEN', (await page.textContent('#screen')).includes('CHALLENGE BEATEN'));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
