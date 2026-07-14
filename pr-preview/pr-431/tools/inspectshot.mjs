// Inspect/showcase modal screenshot harness: boots the game, opens the DRAGONS
// shop tab, TAPS a dragon's 3D turntable to open the full-screen showcase, then
// screenshots it. Also exercises the dragon carousel (next chevron). Mobile-ish
// viewport (this is judged on phones).
//   node tools/inspectshot.mjs [key]   →   /tmp/inspect-<key>.png (+ -next)
const key = process.argv[2] || 'jade';
import { boot } from '../tests/browser.mjs';

const { page, errors, done } = await boot({
  query: '?debug&dev',
  viewport: { width: 440, height: 920 },
  deviceScaleFactor: 2,
});
await page.click('#btn-shop');
await page.waitForSelector('.shop-grid');
await page.waitForTimeout(800);
// Tapping the 3D turntable should open the showcase (the new behaviour).
await page.click(`canvas.skin-preview[data-key="${key}"]`);
await page.waitForSelector('.inspect-overlay.open');
await page.waitForTimeout(2200); // let the showcase flap into a good pose
await page.screenshot({ path: `/tmp/inspect-${key}.png` });
console.log(`wrote /tmp/inspect-${key}.png`);

// Swipe to the next dragon via the edge chevron.
await page.click('#inspect-dragon-next');
await page.waitForTimeout(1800);
await page.screenshot({ path: `/tmp/inspect-${key}-next.png` });
console.log(`wrote /tmp/inspect-${key}-next.png`);

if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
else console.log('no console errors');
await done();
