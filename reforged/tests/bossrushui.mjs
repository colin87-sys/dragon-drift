// Boss Rush UI: the rail entry appears once a boss is beaten, and EXIT TO MENU
// from the pause overlay returns to the start screen (the only route back to the
// rail mid-session). Real browser (mirrors smoke.mjs), so it catches the wiring
// the headless logic tests can't (rail gating, pause-menu handlers).
import { boot, check } from './browser.mjs';

// Returning pilot (runs=5 → full rail) who has beaten VOIDMAW (→ rush unlocked).
const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true }, bossRush: { beaten: ['voidmaw'], cleared: 0, bestClearMs: 0 } }))`,
});
await page.waitForTimeout(1200);

check('boots with zero console errors', errors.length === 0) || console.error(errors.join('\n'));
check('start screen visible', await page.$eval('#screen', (el) => el.classList.contains('visible')));
// The unlock gate: beating a boss surfaces the BOSS RUSH rail entry.
check('BOSS RUSH rail button present (boss beaten → unlocked)', !!(await page.$('#btn-rush')));

// The rail button opens the ROSTER PANEL (not a direct launch).
await page.click('#btn-rush');
await page.waitForSelector('#btn-fly-rush');
check('BOSS RUSH opens the roster panel', !!(await page.$('#btn-fly-rush')));
check('roster shows a boss chip', (await page.$$('.rush-chip')).length >= 1);

// FLY launches the gauntlet.
await page.click('#btn-fly-rush');
await page.waitForTimeout(700);
check('FLY launches a rush run', await page.evaluate(() => window.__dd.game.state === 'playing' && window.__dd.game.mode === 'rush'));

// Pause → EXIT TO MENU is a TWO-STEP armed confirm (abandons the run).
await page.keyboard.press('Escape');
await page.waitForSelector('#pm-quit');
check('pause overlay has EXIT TO MENU', !!(await page.$('#pm-quit')));
await page.click('#pm-quit');                       // first tap = arm, does NOT quit
await page.waitForFunction(() => document.querySelector('#pm-quit')?.dataset.armed === '1');
check('first tap arms the confirm (still paused)', await page.evaluate(() => window.__dd.game.state === 'paused'));
await page.evaluate(() => document.querySelector('#pm-quit').click());   // second tap = quit (dispatched deterministically)
await page.waitForSelector('#btn-start');
check('second tap returns to the start screen', await page.evaluate(() => window.__dd.game.state === 'ready'));
check('rail reachable again after exit (BOSS RUSH still there)', !!(await page.$('#btn-rush')));
check('no console errors through the flow', errors.length === 0) || console.error(errors.join('\n'));

await done();

// --- Regression: a DEV-unlocked BOSS RUSH must show even on a brand-new (cold)
// save. A cold save hides the rest of the rail, but ?dev / the settings dev toggle
// should still surface the rush entry for testing (the "?dev shows nothing" bug). ---
const cold = await boot({
  query: '?debug&dev',
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 0 }, flags: { seenIntro: true } }))`,
});
await cold.page.waitForTimeout(900);
check('cold save + ?dev still shows BOSS RUSH', !!(await cold.page.$('#btn-rush')));
check('cold + dev: no console errors', cold.errors.length === 0) || console.error(cold.errors.join('\n'));
await cold.done();
