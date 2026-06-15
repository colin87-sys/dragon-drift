// Feats: event-driven live unlocks pay once (idempotent), toast fires,
// streak thresholds read the game state.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

const w0 = await page.evaluate(() => window.__dd.save.embers);

// First perfect ring → Bullseye (+20), exactly once.
await page.evaluate(() => { window.__dd.emit('ring', { perfect: true }); });
check('Bullseye unlocks on first perfect', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('first_perfect')));
check('feat toast fired', await page.$eval('#feat-toast', (el) => el.textContent.includes('Bullseye')));
await page.evaluate(() => { window.__dd.emit('ring', { perfect: true }); });
const w1 = await page.evaluate(() => window.__dd.save.embers);
check('double emit pays exactly once (+20)', w1 - w0 === 20);

// Streak feat reads live game state.
await page.evaluate(() => {
  window.__dd.game.perfectStreak = 5;
  window.__dd.emit('ring', { perfect: true });
});
check('Threading the Needle at streak 5', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('pstreak_5')));

// Chain feat via consecutiveRings.
await page.evaluate(() => {
  window.__dd.game.consecutiveRings = 15;
  window.__dd.emit('gate');
});
check('Unbroken at chain 15', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('chain_15')));

// Settle feat: runs_10 via stats.
await page.evaluate(() => {
  const dd = window.__dd;
  dd.save.revives = 0;
  dd.save.stats.runs = 9; // recordBests() makes it 10 at settle
  dd.player.position.x = 99;
});
// Headless software-GL runs at a few fps — wait for the settle, not a sleep.
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
check('settle feat Regular at 10 runs', await page.evaluate(() =>
  window.__dd.save.feats.unlocked.includes('runs_10')));
check('feats appear in the run summary ledger', await page.evaluate(() =>
  window.__dd.game.runSummary.featResults.some((f) => f.def.id === 'runs_10')));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
