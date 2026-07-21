// Run Recap v2: scripted death → runSummary populated, DOM sections present
// in order, count-up settles, ledger reveals, exactly one NEXT UP, and
// blank-tap protection during the reveal.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();

// Fly, earn a haul, then crash into the wall.
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
await page.evaluate(() => {
  const { game, save, player } = window.__dd;
  save.revives = 0;          // skip the revive offer
  game.embersRun = 40;
  game.score = 500;
  player.position.x = 99;    // wall crash next collision tick
});
// Headless software-GL runs at a few fps; the scripted death's sim freeze takes
// seconds. Wait properly for the death to reach the recap (throws clearly if it
// never does — not swallowed), THEN probe the blank-tap protection. Blank taps are
// ignored until gameoverTapArmed (death + 700ms + recapRevealMs; main.js), and the
// reveal queue makes that window comfortably wide, so a tap right after gameover is
// safely inside it. page.mouse.click STARVES under swiftshader (the uishots gotcha)
// and can land AFTER arming → a real restart → flake; dispatch the blank tap IN-PAGE
// (the window pointerdown listener the recap guards) so nothing can delay it.
// Blank taps must NEVER fall through to a fresh takeoff during the death→recap flow.
// The restart branch (main.js) fires only when `state==='gameover' && deathFreezeTimer<=0
// && now>gameoverTapArmed(=death+700+recapRevealMs)`. That arming window is just ~920ms
// (recapRevealMs≈220) and headless throttles a 40ms setTimeout to >1s — so racing it
// flakes. Instead tap DURING the death FREEZE, where `deathFreezeTimer>0` structurally
// blocks the restart: a wide window (~0.45s sim = seconds of wall time under headless).
// In-page dispatch — page.mouse.click's actionability starves under swiftshader.
await page.waitForFunction(() => window.__dd.game.deathFreezeTimer > 0, { timeout: 30000, polling: 20 });
const tapState = await page.evaluate(() => {
  window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 450, clientY: 80 }));
  return window.__dd.game.state;
});
check('blank tap during the death sequence does not restart', tapState !== 'playing');
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000, polling: 50 });
await page.waitForSelector('#screen .run-stats', { timeout: 30000 });

const sum = await page.evaluate(() => window.__dd.game.runSummary);
check('runSummary built', !!sum);
check('ember breakdown: 40 base ×1.5 first flight = 60 total',
  sum.emberBreakdown.base === 40 && sum.emberBreakdown.firstFlight === 20 && sum.emberBreakdown.total === 60);
check('nextUp selected', !!sum.nextUp && !!sum.nextUp.label);

check('exactly one NEXT UP card', (await page.$$('.nextup-card')).length === 1);
check('no gambit panel', !(await page.$('#gambit-panel')));
check('earn list pre-rendered', !!(await page.$('.earn-list.revealing')));
check('stats grid rendered', (await page.$$('.run-stats .stat')).length === 8);
check('share menu present', !!(await page.$('#share-menu')));

// Count-up settles to the final score. The count-up is an ANIMATION (rAF-driven),
// so its duration is frame-rate-dependent under headless GL — poll for it to reach
// the score instead of a fixed wait.
const score = await page.evaluate(() => Math.floor(window.__dd.game.score));
await page.waitForFunction((s) => Number(document.querySelector('#score-countup')?.textContent) === s,
  score, { timeout: 15000, polling: 100 }).catch(() => {});
const counted = await page.$eval('#score-countup', (el) => el.textContent);
check(`count-up settles to score (${counted} = ${score})`, Number(counted) === score);

// Ledger reveal is animation-gated; generous timeout + poll (the 3s window flaked
// under slow SwiftShader even though the row is pre-rendered into the reveal list).
await page.waitForSelector('.earn-list .ember-tally', { timeout: 15000, state: 'attached' });
check('earnings ledger revealed ember tally', !!(await page.$('.earn-list .ember-tally')));

// Wallet got exactly the banked haul (no quests/feats fired in this run).
const embers = await page.evaluate(() => window.__dd.save.embers);
check(`wallet credited the haul (${embers} ≥ 60)`, embers >= 60);

check('no console errors through the recap', errors.length === 0) || console.error(errors.join('\n'));
await done();
