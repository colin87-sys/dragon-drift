// Run Recap v2: scripted death → runSummary populated, DOM sections present
// in order, count-up settles, ledger reveals, exactly one NEXT UP, gambit
// panel eligibility, and blank-tap protection during the reveal.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();

// Fly, earn a haul, then crash into the wall.
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
await page.evaluate(() => {
  const { game, save, player } = window.__dd;
  save.revives = 0;          // skip the revive offer
  game.embersRun = 60;       // gambit-eligible haul
  game.score = 500;
  player.position.x = 99;    // wall crash next collision tick
});
// Headless software-GL runs at a few fps; the 0.45s sim freeze takes seconds.
// Poll fast and tap IMMEDIATELY — inside the 700ms+reveal arming window.
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000, polling: 50 });
await page.mouse.click(450, 80);
check('blank tap during reveal does not restart', await page.evaluate(() => window.__dd.game.state === 'gameover'));
await page.waitForSelector('#screen .run-stats', { timeout: 30000 });

const sum = await page.evaluate(() => window.__dd.game.runSummary);
check('runSummary built', !!sum);
check('ember breakdown: 60 base ×1.5 first flight = 90 total',
  sum.emberBreakdown.base === 60 && sum.emberBreakdown.firstFlight === 30 && sum.emberBreakdown.total === 90);
check('nextUp selected', !!sum.nextUp && !!sum.nextUp.label);
check('gambit eligible at ◆90 haul', sum.gambit.eligible === true && sum.gambit.stake === 90);

check('exactly one NEXT UP card', (await page.$$('.nextup-card')).length === 1);
check('gambit panel rendered', !!(await page.$('#gambit-panel')));
check('earn list pre-rendered', !!(await page.$('.earn-list.revealing')));
check('stats grid rendered', (await page.$$('.run-stats .stat')).length === 8);
check('share menu present', !!(await page.$('#share-menu')));

// Count-up settles to the final score.
await page.waitForTimeout(1300);
const counted = await page.$eval('#score-countup', (el) => el.textContent);
const score = await page.evaluate(() => Math.floor(window.__dd.game.score));
check(`count-up settles to score (${counted} = ${score})`, Number(counted) === score);

// Ledger is pre-rendered — ember tally is in the DOM without waiting.
await page.waitForSelector('.earn-list .ember-tally', { timeout: 3000 });
check('earnings ledger revealed ember tally', !!(await page.$('.earn-list .ember-tally')));

// Wallet got exactly the banked haul (no quests/feats fired in this run).
const embers = await page.evaluate(() => window.__dd.save.embers);
check(`wallet credited the haul (${embers} ≥ 90)`, embers >= 90);

check('no console errors through the recap', errors.length === 0) || console.error(errors.join('\n'));
await done();
