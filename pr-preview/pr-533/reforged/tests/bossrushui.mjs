// Boss Rush UI: the rail entry appears once a boss is beaten, and EXIT TO MENU
// from the pause overlay returns to the start screen (the only route back to the
// rail mid-session). Real browser (mirrors smoke.mjs), so it catches the wiring
// the headless logic tests can't (rail gating, pause-menu handlers).
import { boot, check } from './browser.mjs';

// Returning pilot (runs=5 → full rail) who has beaten BOTH bosses (→ rush unlocked,
// gauntlet available, and every boss is a tappable "fight solo" chip).
const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true }, bossRush: { beaten: ['voidmaw', 'stormrend'], cleared: 0, bestClearMs: 0 } }))`,
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
check('roster shows tappable boss chips (fight solo)', (await page.$$('.rush-chip.pick[data-boss]')).length === 2);
// The dev stage-jump selector is DEV-ONLY — a normal (non-dev) roster must not show it.
check('non-dev roster hides the dev stage selector', (await page.$$('.rush-stage-btn')).length === 0);

// Tap a single boss chip → fight JUST that boss (a length-1 rush).
await page.click('.rush-chip.pick[data-boss="stormrend"]');
await page.waitForTimeout(700);
check('tapping a boss chip launches a single-boss rush', await page.evaluate(() => window.__dd.game.state === 'playing' && window.__dd.game.mode === 'rush'));

// Pause → EXIT TO MENU is a TWO-STEP armed confirm (abandons the run).
await page.keyboard.press('Escape');
await page.waitForSelector('#pm-quit');
check('pause overlay has EXIT TO MENU', !!(await page.$('#pm-quit')));
await page.click('#pm-quit');                       // first tap = arm, does NOT quit
// Interval polling, NOT the default rAF polling: rAF starves under swiftshader load
// (the tools/uishots.mjs gotcha) — if arm-detection outlasts the 4s confirm window the
// "second tap" would re-ARM instead of quitting, and the start screen never returns.
await page.waitForFunction(() => document.querySelector('#pm-quit')?.dataset.armed === '1', { polling: 120 });
check('first tap arms the confirm (still paused)', await page.evaluate(() => window.__dd.game.state === 'paused'));
// Second tap = quit. Re-arm-and-confirm ATOMICALLY in one task: a swiftshader stall
// between the arm-detect above and this tap can outlast the 4s confirm window, in
// which case a lone click would re-ARM instead of quitting (30s flake). Same-task
// double-click can't be split by the disarm timer.
await page.evaluate(() => { const b = document.querySelector('#pm-quit'); if (b.dataset.armed !== '1') b.click(); b.click(); });
await page.waitForFunction(() => !!document.querySelector('#btn-start'), { polling: 120 });
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

// The DEV stage-jump selector: open the roster, arm a later stage, launch the multi-stage
// boss pinned to it. THE UNMASKED is the multi-stage boss; the selector shows S1..Smax for
// however many sub-rigs are BUILT (2 when this test was written, 3 since the unveiling
// became its own stage) — assert ≥2 so a new built stage can't silently break the suite.
await cold.page.click('#btn-rush');
await cold.page.waitForSelector('.rush-stage-btn');
check('dev roster shows the stage-jump selector (multi-stage boss unlocked)', (await cold.page.$$('.rush-stage-btn')).length >= 2);
// Arm stage 2 → the button becomes active (the pick persists for the launch).
await cold.page.click('.rush-stage-btn[data-stage="2"]');
check('arming a stage marks its button active', await cold.page.$eval('.rush-stage-btn[data-stage="2"]', (el) => el.classList.contains('active')));
// Tap THE UNMASKED chip → a single-boss rush launches, pinned to stage 2 (the seraph).
await cold.page.click('.rush-chip.pick[data-boss="unmasked"]');
await cold.page.waitForTimeout(700);
check('stage-armed chip launches a single-boss rush', await cold.page.evaluate(() => window.__dd.game.state === 'playing' && window.__dd.game.mode === 'rush'));
check('the launch pins the boss to the armed stage (S2 → stagePin 2)', await cold.page.evaluate(() => window.__dd.bossState().stagePin === 2));
check('cold + dev: no console errors', cold.errors.length === 0) || console.error(cold.errors.join('\n'));
await cold.done();
