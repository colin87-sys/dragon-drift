// Sky Canyon integration boot: with the ?canyon= test harness forcing rock runs
// right after takeoff, the game flies THROUGH a canyon with zero errors — proving
// buildRockGap (real WebGL geometry), the collision branch, the camera framing,
// and the dissolve all run without throwing. Jumps the player forward so the test
// doesn't have to fly the full distance in real time.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  query: '?debug&canyon=all',
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});

await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
// Hop to the edge of the first forced canyon so the rock gates build immediately.
// (Headless has no steering input, so the dragon may clip the rock — that's fine;
// we're proving the geometry/collision/camera code path runs, not that an
// input-less dragon survives.)
await page.evaluate(() => { window.__dd.player.dist = 300; });
await page.waitForFunction(() => window.__dd.obstacleCount() > 0, { timeout: 10000 });
await page.waitForTimeout(1500); // run dissolve + collision + camera frames over the rocks

check('rock gates built in WebGL (obstacles present)',
  await page.evaluate(() => window.__dd.obstacleCount() > 0));
check('zero console errors building/flying rock gates', errors.length === 0) ||
  console.error(errors.join('\n'));

await done();

// FLOW run: force a flow set-piece and fly it in real WebGL — the light-gate builder
// must run clean AND emit ZERO collider boxes (the run is walls-free by design).
const flow = await boot({
  query: '?debug&canyon=flow',
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
await flow.page.click('#btn-start');
await flow.page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 8000 });
await flow.page.evaluate(() => { window.__dd.player.dist = 300; });
await flow.page.waitForFunction(() => window.__dd.obstacleCount() > 0, { timeout: 10000 });
await flow.page.waitForTimeout(1500);
check('flow light-gates built in WebGL (obstacles present)',
  await flow.page.evaluate(() => window.__dd.obstacleCount() > 0));
check('flow run is walls-free (zero collider boxes on flow gates)',
  await flow.page.evaluate(() => window.__dd.flowColliderBoxes() === 0));
check('zero console errors building/flying flow gates', flow.errors.length === 0) ||
  console.error(flow.errors.join('\n'));
await flow.done();
