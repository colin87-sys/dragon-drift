// Real-engine (WebGL) boss smoke: boot → start a flight → force a boss encounter
// → let it run, then assert the overlay actually engaged and the real renderer
// (boss model + bullet InstancedMesh + collision) ran with zero console errors.
// The HUMAN still judges feel (approach choreography, bullet readability, the
// disintegration) on the PR preview — this only guarantees it doesn't throw.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
await page.waitForTimeout(800);

// Take off.
await page.click('#btn-start');
await page.waitForTimeout(600);
check('game enters playing state', await page.evaluate(() => window.__dd.game.state === 'playing'));

// Force a boss encounter via the debug seam and let it play for a few seconds.
await page.evaluate(() => window.__dd.spawnBoss());
await page.waitForTimeout(400);
check('boss overlay engaged (game.inBoss)', await page.evaluate(() => window.__dd.game.inBoss === true));

await page.waitForTimeout(3500); // approach + a few seconds of bullet-hell

// Force the Surge hyper (bullet-time + double rider fire + all-bullets-reflectable)
// so that whole path runs in the real WebGL engine too.
await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 8; });
await page.waitForTimeout(1500);

// Still flying, still in the fight (the rider chip alone needs ~30s to win), and
// crucially nothing threw in the real WebGL path.
check('still playing after the boss ran', await page.evaluate(() => window.__dd.game.state === 'playing'));
check('no console errors through the boss fight', errors.length === 0) || console.error(errors.join('\n'));

console.log('\nboss real-engine smoke passed.');
await done();
