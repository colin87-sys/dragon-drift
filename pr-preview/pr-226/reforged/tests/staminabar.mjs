// Stamina bar structure guard. The bar read as "2 notches not 3" on mobile across
// many builds because a single arc was carved up with stroke-dasharray skips, and a
// trailing zero-length dash is dropped by some SVG engines. It's now THREE separate
// arc <path>s with real gaps, which physically can't merge or drop a segment. This
// proves: 3 distinct arcs, each fills fully at max, and Surge lights the container.
import { boot, check } from './browser.mjs';

const { page, errors, done } = await boot();
await page.click('#btn-start');
await page.waitForFunction(() => window.__dd.game.state === 'playing');
const read = () => page.evaluate(() => ({
  d: Array.from(document.querySelectorAll('.arc-cell')).map((p) => p.getAttribute('d')),
  da: Array.from(document.querySelectorAll('.arc-cell')).map((p) => p.getAttribute('stroke-dasharray')),
  trk: document.querySelectorAll('.arc-trk').length,
  surge: document.querySelector('#stamina-arc').classList.contains('surge'),
}));

await page.evaluate(() => { window.__dd.game.stamina = window.__dd.game.staminaMax || 110; window.__dd.game.feverActive = false; });
await page.waitForTimeout(80);
const full = await read();
check('exactly 3 cell arcs and 3 track arcs', full.d.length === 3 && full.trk === 3);
check('the 3 cells are DISTINCT arc paths (physical gaps, cannot merge)',
  new Set(full.d).size === 3);
check('at max, every cell fills fully (≈100 of its own length)',
  full.da.every((s) => parseFloat(s) > 99));
check('no Surge class when not surging', full.surge === false);

await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 60; });
await page.waitForTimeout(120);
check('Surge lights the bar (container .surge class drives the glow)', (await read()).surge === true);
check('no console errors', errors.length === 0) || console.error(errors.join('\n'));
await done();
