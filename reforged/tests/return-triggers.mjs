// Return triggers & onboarding: first-flight hints appear for new pilots,
// the PB beacon pays when passed, a long absence earns the tailwind gift.
import { boot, check } from './browser.mjs';

// --- New pilot: steer hint appears in the first seconds of flight ---
{
  const { page, errors, done } = await boot();
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__dd.game.state === 'playing');
  // H1: onboarding hints render through THE BELL as sticky hint-role lines.
  await page.waitForFunction(() =>
    document.querySelector('#bell-slug').classList.contains('show') &&
    document.querySelector('#bell-slug').dataset.role === 'hint', { timeout: 30000, polling: 120 });
  const text = await page.textContent('#bell-text');
  check(`steer hint rings the Bell for a new pilot ("${text}")`, /steer/i.test(text));
  check('hint bit persisted', await page.evaluate(() => (window.__dd.save.flags.hintsSeen & 1) === 1));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// --- PB beacon: passing your best distance pays the bonus ---
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, best: { score: 900, dist: 500 },
      stats: { runs: 5 }, flags: { hintsSeen: 15 },
    }))`,
  });
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__dd.game.state === 'playing');
  await page.evaluate(() => { window.__dd.player.dist = 520; });
  await page.waitForFunction(() => window.__dd.game.embersRun >= 10, { timeout: 30000 });
  check('PB beacon pays +10 embers when passed', true);
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// --- Welcome back: 6-day absence → tailwind gift + notice ---
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 50, lastSeen: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    }))`,
  });
  check('tailwind gift credited (+100)', await page.evaluate(() => window.__dd.save.embers === 150));
  check('welcome-back notice on start screen', !!(await page.$('.start-notice')));
  check('lastSeen restamped', await page.evaluate(() =>
    window.__dd.save.lastSeen === new Date().toISOString().slice(0, 10)));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
