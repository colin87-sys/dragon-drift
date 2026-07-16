// Race-vs-ghost (EMBERSIGHT H2, HUD-REDESIGN §B.12): the two-caret tick-strip.
// Visible during a challenge run, ghosted until the gap closes to 15%, and the
// overtake drops the rival caret off the strip + rings RIVAL BEATEN.
import { boot, check } from './browser.mjs';

// runs: 1 — the run-0 gesture tutorial pauses mid-flight and would freeze the
// settle leg (the H2 waits added wall time before the crash; same as feats.mjs).
const { page, errors, done } = await boot({
  query: '?challenge=500&seed=1337&debug',
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 1 }, flags: { seenIntro: true } }))`,
});

check('challenge banner on start screen', (await page.textContent('#screen')).includes('CHALLENGE'));
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
await page.waitForTimeout(400);

check('race strip visible during challenge run',
  await page.$eval('#race-bar', (el) => el.classList.contains('on')));
check('both carets present',
  await page.evaluate(() => !!document.getElementById('race-you') && !!document.getElementById('race-rival')));
check('race target labelled', (await page.textContent('#race-target')).includes('500'));
check('strip is relevance-ghosted while the gap is wide',
  await page.$eval('#race-bar', (el) => !el.classList.contains('close')));

// Close within 15% → the strip returns to full alpha.
await page.evaluate(() => { window.__dd.game.score = 430; });
await page.waitForFunction(() =>
  document.getElementById('race-bar').classList.contains('close'), { timeout: 4000, polling: 120 });
check('within 15% of the target the strip un-ghosts (.close)', true);

// Overtake: rival caret falls off, gold flash, RIVAL BEATEN rings the Bell.
// The Bell displays each line ~1.1s, so log rung messages instead of racing
// the lane's pump with screenshot-time round-trips.
await page.evaluate(() => {
  const ui = window.__dd.ui;
  const orig = ui.bell.bind(ui);
  window.__bellLog = [];
  ui.bell = (t, r, o) => { window.__bellLog.push(t); return orig(t, r, o); };
});
await page.evaluate(() => { window.__dd.game.score = 600; });
await page.waitForFunction(() => window.__dd.game.challengeBeaten === true, { timeout: 4000 });
check('crossover flips the strip to won',
  await page.$eval('#race-bar', (el) => el.classList.contains('won')));
check('crossover label updates', (await page.textContent('#race-target')) === 'BEATEN');
check('RIVAL BEATEN rang the Bell',
  await page.evaluate(() => window.__bellLog.includes('RIVAL BEATEN')));

// Recap shows the beaten challenge + riposte share text path
await page.evaluate(() => {
  window.__dd.save.revives = 0;
  window.__dd.player.position.x = 99;
});
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
check('recap shows CHALLENGE BEATEN', (await page.textContent('#screen')).includes('CHALLENGE BEATEN'));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
