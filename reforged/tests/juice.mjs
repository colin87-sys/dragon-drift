// In-run juice: hitstop precedence contract, instant restore, postfx kick
// tier behavior, death grade engage/release.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
// Pin quality tier 0: headless software-GL runs slow enough that the
// adaptive system would otherwise drop tiers mid-test and make every
// postfx assertion timing-dependent.
await page.evaluate(() => { window.__dd.save.settings.qualityOverride = 0; });
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

// Hitstop applies and restores instantly (no ramp residue).
await page.evaluate(() => window.__dd.juice.hitstop(80));
check('hitstop arms the timer', await page.evaluate(() => window.__dd.game.hitstopTimer > 0));
await page.waitForFunction(() => window.__dd.game.hitstopTimer <= 0, { timeout: 10000 });
check('timeScale untouched by hitstop (slow-mo channel separate)',
  await page.evaluate(() => window.__dd.game.timeScale === 1));

// Slow-mo wins: no hitstop while slow-mo runs.
await page.evaluate(() => {
  window.__dd.game.slowMoTimer = 0.6;
  window.__dd.juice.hitstop(80);
});
check('hitstop refused during slow-mo', await page.evaluate(() => window.__dd.game.hitstopTimer === 0));
await page.waitForFunction(() => window.__dd.game.slowMoTimer <= 0, { timeout: 10000 });

// Cooldown: two rapid hitstops merge into one freeze window.
await page.evaluate(() => {
  const dd = window.__dd;
  dd.juice.hitstop(50);
  dd.juice.hitstop(80); // inside the 180ms cooldown → rejected
});
const t = await page.evaluate(() => window.__dd.game.hitstopTimer);
check(`cooldown rejects machine-gun hitstops (timer ${Math.round(t * 1000)}ms ≤ 50ms)`, t <= 0.051);

// State gating: refused outside 'playing'.
await page.evaluate(() => {
  window.__dd.game.hitstopTimer = 0;
  window.__dd.game.state = 'paused';
  window.__dd.juice.hitstop(80);
});
check('hitstop refused while paused', await page.evaluate(() => window.__dd.game.hitstopTimer === 0));
await page.evaluate(() => { window.__dd.game.state = 'playing'; });

// PostFX kicks: tier 2 = true no-op; tier 0 moves the channels.
await page.evaluate(() => window.__dd.postfx.setPostTier(2));
await page.evaluate(() => window.__dd.postfx.kick('goldenEmber')); // must not throw
check('tier-2 kick is a no-op', await page.evaluate(() => {
  const k = window.__dd.postfx.kickState();
  return k.bloom === 0 && k.lift === 0;
}));
await page.evaluate(() => window.__dd.postfx.setPostTier(0));
const kicked = await page.evaluate(() => {
  window.__dd.postfx.kick('goldenEmber');
  return window.__dd.postfx.kickState();
});
check('tier-0 kick raises bloom+lift impulses', kicked.bloom > 0.2 && kicked.lift > 0.2);

// PR-B: the reserved lance-FINALE beat — a 90ms hitstop + the jade postfx kick
// (the physical "impact" on a full volley's climax). Fired via the juice event.
await page.evaluate(() => {
  const dd = window.__dd;
  dd.game.hitstopTimer = 0; dd.game.slowMoTimer = 0; dd.game.state = 'playing';
  dd.postfx.setPostTier(0);
  dd.juice.juiceEvent('wispFinale');
});
const finale = await page.evaluate(() => ({
  hs: window.__dd.game.hitstopTimer, bloom: window.__dd.postfx.kickState().bloom }));
check(`wispFinale hitstops ~90ms (got ${Math.round(finale.hs * 1000)}ms)`, finale.hs > 0.08 && finale.hs <= 0.0905);
check('wispFinale raises the jade postfx kick', finale.bloom > 0.2);
await page.waitForFunction(() => window.__dd.game.hitstopTimer <= 0, { timeout: 10000 });

// Death grade: engages across the freeze, releases for the recap.
await page.evaluate(() => {
  window.__dd.save.revives = 0;
  window.__dd.player.position.x = 99;
});
await page.waitForFunction(() => window.__dd.game.state === 'gameover', { timeout: 15000 });
await page.waitForFunction(() => window.__dd.postfx.kickState().deathMix > 0.2, { timeout: 15000 });
check('death grade ramps during the freeze', true);
await page.waitForFunction(() => !!window.__dd.game.runSummary, { timeout: 30000 });
await page.waitForFunction(() => window.__dd.postfx.kickState().deathMix < 0.1, { timeout: 15000 });
check('death grade releases once the recap shows', true);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
