// SUNBREAK surge state-machine baseline (I0). Locks the capture-seam CONTRACT the
// later increments build on: the seams are dormant with `__ddSurgeForce` undefined
// (roster byte-identity), the introspection API is stable, the pin toggles cleanly
// and leaves no residue, and no unleash cinematic leaks into off frames. The cascade
// order / beam value-band / juice asserts arrive in I2–I4 as those systems land.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
// Pin tier 0 so headless software-GL never drops tiers mid-test.
await page.evaluate(() => { window.__dd.save.settings.qualityOverride = 0; });
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');

// 1. The capture seam is DORMANT by default — the byte-identity contract.
check('__ddSurgeForce undefined in play',
  await page.evaluate(() => typeof window.__ddSurgeForce === 'undefined'));
const st0 = await page.evaluate(() => window.__dd.surgeState());
check('surge cinematic inactive by default', st0.active === false && st0.forced === false);
check('beam hidden by default', st0.beamVisible === false);

// 2. The introspection API is stable (the shape I2–I4 read).
check('surgeState exposes the beat fields',
  ['active', 'phase', 't', 'beamVisible', 'forced', 'drawCalls'].every((k) => k in st0));
check('drawCalls is a live number', typeof st0.drawCalls === 'number' && st0.drawCalls > 0);

// 3. The pin toggles cleanly and leaves NO residue when cleared.
await page.evaluate(() => window.__dd.surgeSeam('beam'));
check('surgeSeam arms the force flag',
  await page.evaluate(() => window.__dd.surgeState().forced === true &&
    typeof window.__ddSurgeForce === 'object'));
await page.evaluate(() => window.__dd.surgeSeam('apex'));
check('surgeSeam re-targets the beat',
  await page.evaluate(() => window.__ddSurgeForce.beat === 'apex'));
await page.evaluate(() => window.__dd.surgeSeam(null));
check('surgeSeam(null) clears the force flag → back to dormant',
  await page.evaluate(() => window.__dd.surgeState().forced === false &&
    typeof window.__ddSurgeForce === 'undefined'));

// 4. Off frames stay clean: with no cast and no pin, no cinematic ever appears and
//    the slow-mo/timeScale channel is untouched (the "Surge-off frames byte-identical"
//    proxy — the beam can only show via an explicit cast or pin).
await page.waitForTimeout(500);
const off = await page.evaluate(() => {
  const s = window.__dd.surgeState();
  return { active: s.active, beam: s.beamVisible, ts: window.__dd.game.timeScale };
});
check('no cinematic leaks into off frames', off.active === false && off.beam === false);
check('timeScale untouched with Surge idle', off.ts === 1);

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
