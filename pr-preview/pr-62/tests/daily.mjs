// Daily Challenge modifier: a real, deterministic per-day twist surfaced on the
// card and applied as run-level multipliers (game.mods), with daily scores kept
// out of the main PB.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();

// Module: pool shape, determinism, neutral defaults, merge.
const mod = await page.evaluate(async () => {
  const d = await import('./js/daily.js');
  const a = d.todaysDailyMod(), b = d.todaysDailyMod();
  return {
    poolLen: d.DAILY_MODS.length,
    allValid: d.DAILY_MODS.every(m => m.id && m.name && m.glyph && m.brief && m.mods && Object.keys(m.mods).length),
    stable: a.id === b.id,
    today: { id: a.id, name: a.name, mods: a.mods },
    neutral: d.dailyMods(null),
    mergedToday: d.dailyMods(a),
  };
});
check('daily modifier pool present & well-formed', mod.poolLen >= 3 && mod.allValid);
check('todaysDailyMod() is deterministic', mod.stable);
check('dailyMods(null) is a neutral 1× set', Object.values(mod.neutral).every(v => v === 1));
check(`today's modifier merges over defaults (${mod.today.name})`,
  Object.keys(mod.today.mods).every(k => mod.mergedToday[k] === mod.today.mods[k]));

// The start-screen daily card announces the modifier (the "briefing").
const cardMod = await page.$eval('.daily-card .daily-mod', el => el.textContent.trim()).catch(() => '');
check(`daily card shows the modifier (${cardMod})`, cardMod.includes(mod.today.name));

// Flying the daily applies the modifier to the run.
await page.click('#btn-daily');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
const run = await page.evaluate(() => ({
  mode: window.__dd.game.mode,
  mods: window.__dd.game.mods,
  modId: window.__dd.game.dailyMod && window.__dd.game.dailyMod.id,
}));
check('the run is in daily mode', run.mode === 'daily');
check('the run carries today\'s modifier id', run.modId === mod.today.id);
check('the run multipliers match the modifier',
  Object.keys(mod.today.mods).every(k => run.mods[k] === mod.today.mods[k]));

check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
