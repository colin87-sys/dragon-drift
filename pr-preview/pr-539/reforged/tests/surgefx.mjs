// Dragon Surge VFX regression guard. A long-standing bug had main.js call
// setDragonFxVisible(true) every frame during play, which set every pooled trail
// sprite visible=true and starved the emitters' find(s => !s.visible) allocator —
// so the boost/speed/ember trails silently emitted NOTHING. This proves that, in a
// Surge, a dragon actually emits its tail + speed trails (and stays quiet at rest).
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  query: '?debug',
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd && window.__dd.game.state === 'playing', { timeout: 8000 });
const td = () => page.evaluate(() => window.__dd.trailDebug());

await page.waitForTimeout(400);
const idle = await td();
check('at a cruise (no boost/surge) the tail/speed trails are quiet',
  idle.boost === 0 && idle.trail === 0);

// Force a Surge WITHOUT boosting — the path that was dead.
await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 60; });
await page.waitForTimeout(800);
const surge = await td();
check(`Surge emits a tail (boost) trail (boost=${surge.boost})`, surge.boost > 0);
check(`Surge emits a body (speed) trail (trail=${surge.trail})`, surge.trail > 0);
check('no console errors', errors.length === 0) || console.error(errors.join('\n'));

console.log(`  (idle ${JSON.stringify(idle)} → surge ${JSON.stringify(surge)})`);
await done();
