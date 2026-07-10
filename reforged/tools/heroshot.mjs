// Captures the LIVE in-game hero character-select (dragons shop tab) to high-res
// PNGs: default, a dragon switched via the rail, a form switched via the segments,
// and after a drag-rotate.  node tools/heroshot.mjs
import { boot } from '../tests/browser.mjs';

const { page, errors, done } = await boot({
  query: '?debug&dev',
  viewport: { width: 460, height: 940 },
  deviceScaleFactor: 3,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, stats: { runs: 9 }, flags: { seenIntro: true }, embers: 12480,
    skins: { owned: ['azure','ember','solar'], equipped: 'solar' },
    ascension: { tiers: [['solar',3],['ember',2]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  }))`,
});

await page.evaluate(() => window.__dd.ui.showScreen('shop'));
await page.waitForSelector('.hero-select');
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/hero-live-1-default.png' });
console.log('wrote /tmp/hero-live-1-default.png');

// Switch dragon via the rail (tap Solar's thumbnail).
await page.click('.hero-thumb[data-hero="solar"]');
await page.waitForTimeout(1400);
await page.screenshot({ path: '/tmp/hero-live-2-solar.png' });
console.log('wrote /tmp/hero-live-2-solar.png');

// Switch form via the segments (tap the first = Hatchling).
await page.click('.hero-forms .hero-seg[data-form="0"]');
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/hero-live-3-hatchling.png' });
console.log('wrote /tmp/hero-live-3-hatchling.png');

// Drag the hero to rotate it.
await page.click('.hero-thumb[data-hero="obsidian"]');
await page.waitForTimeout(900);
const c = await page.$('#hero-canvas');
const b = await c.boundingBox();
const cy = b.y + b.height * 0.45, x0 = b.x + b.width * 0.5;
await page.mouse.move(x0, cy); await page.mouse.down();
for (let i = 1; i <= 22; i++) { await page.mouse.move(x0 + (170 * i) / 22, cy); await page.waitForTimeout(8); }
await page.mouse.up();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/hero-live-4-rotated.png' });
console.log('wrote /tmp/hero-live-4-rotated.png');

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await done();
