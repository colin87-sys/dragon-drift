// Showcase QA: boots the game, screenshots the new dark-glass shop grid, then
// opens a dragon's full-screen showcase and DRAGS it to prove the 360° turntable
// (screenshots at a few rotation steps).
//   node tools/showcaseshot.mjs [key]
//     → /tmp/shop-cards.png, /tmp/showcase-<key>-{0,a,b,c}.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'obsidian';
const { page, errors, done } = await boot({
  query: '?debug&dev',
  viewport: { width: 460, height: 940 },
  deviceScaleFactor: 2,
});

await page.evaluate(() => window.__dd.ui.showScreen('shop'));   // hub-rework-proof
await page.waitForSelector('.shop-grid');
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/shop-cards.png' });
console.log('wrote /tmp/shop-cards.png');

// Open the showcase by tapping the dragon's turntable.
await page.click(`canvas.skin-preview[data-key="${key}"]`);
await page.waitForSelector('.inspect-overlay.open');
await page.waitForTimeout(1600);
await page.screenshot({ path: `/tmp/showcase-${key}-0.png` });
console.log(`wrote /tmp/showcase-${key}-0.png`);

// Drag to rotate: sweep across the stage centre; each drag adds ~100° of yaw.
const vp = await page.$('#inspect-viewport');
const b = await vp.boundingBox();
const cy = b.y + b.height * 0.42;
const x0 = b.x + b.width * 0.5;
async function spin(label, dx) {
  await page.mouse.move(x0, cy);
  await page.mouse.down();
  const steps = 24;
  for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + (dx * i) / steps, cy); await page.waitForTimeout(8); }
  await page.mouse.up();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `/tmp/showcase-${key}-${label}.png` });
  console.log(`wrote /tmp/showcase-${key}-${label}.png`);
}
await spin('a', 160);
await spin('b', 160);
await spin('c', 160);

if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await done();
