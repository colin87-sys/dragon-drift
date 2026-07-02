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

// Launch the gauntlet from the button, confirm we enter a rush run.
await page.click('#btn-rush');
await page.waitForTimeout(700);
check('BOSS RUSH launches a rush run', await page.evaluate(() => window.__dd.game.state === 'playing' && window.__dd.game.mode === 'rush'));

// Pause, then EXIT TO MENU → back on the start screen with the rail.
await page.keyboard.press('Escape');
await page.waitForSelector('#pm-quit');
check('pause overlay has EXIT TO MENU', !!(await page.$('#pm-quit')));
await page.click('#pm-quit');
await page.waitForSelector('#btn-start');
check('EXIT TO MENU returns to the start screen', await page.evaluate(() => window.__dd.game.state === 'ready'));
check('rail reachable again after exit (BOSS RUSH still there)', !!(await page.$('#btn-rush')));
check('no console errors through the flow', errors.length === 0) || console.error(errors.join('\n'));

await done();
