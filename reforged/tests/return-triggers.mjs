// Return triggers & onboarding: first-flight hints appear for new pilots,
// the PB beacon pays when passed, a long absence earns the tailwind gift.
import { boot, check } from './browser.mjs';

// --- New pilot: steer hint appears in the first seconds of flight ---
// runs: 1 — on run 0 the PAUSED gesture tutorial owns the steer lesson (and
// headless never performs the gesture, so the run stays frozen); the TEXT
// steer hint is the second-flight path, which is what this asserts.
{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 1 }, flags: { seenIntro: true } }))`,
  });
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__dd.game.state === 'playing');
  // H1: onboarding hints render through THE BELL as sticky hint-role lines.
  // Hint ORDER is gameplay-dependent (an early ember pickup rings its hint
  // first), so log every rung line and wait for the steer hint to appear.
  await page.evaluate(() => {
    const ui = window.__dd.ui;
    const orig = ui.bell.bind(ui);
    window.__bellLog = [];
    ui.bell = (t, r, o) => { window.__bellLog.push(`${r}|${t}`); return orig(t, r, o); };
  });
  await page.waitForFunction(() =>
    window.__bellLog.some((m) => m.startsWith('hint|') && /steer/i.test(m)),
    undefined, { timeout: 60000, polling: 200 });
  check('steer hint rings the Bell for a new pilot', true);
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
  // WELCOME+HUB §2: the gift renders as the choreographed idle-reward POP-IN card
  // (#reward-card, ~620ms after boot) — not the old flat .start-notice line (§2.5).
  await page.waitForFunction(() => !!document.querySelector('#reward-card'), { polling: 120, timeout: 8000 });
  check('welcome-back reward card pops over the hub', true);
  check('lastSeen restamped', await page.evaluate(() =>
    window.__dd.save.lastSeen === new Date().toISOString().slice(0, 10)));
  check('no errors', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
