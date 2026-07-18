// Night-Fury capture harness — boots the game owning + equipping a dragon (default
// toothless) ascended to Eternal, opens the shop hero scene (the real environment +
// lighting), selects the dragon, and screenshots it at several yaw angles: FRONT,
// ¾-front, SIDE, ¾-rear, REAR — so a render can be compared against the Toothless
// reference imagery (the ¾ menu hero shot + the chase-cam rear).
//   node tools/nfshot.mjs [key]   → /tmp/nf-<key>-{front,q34,side,q34rear,rear}.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'toothless';
const { page, errors, done } = await boot({
  query: '?debug&dev',
  viewport: { width: 520, height: 940 },
  deviceScaleFactor: 3,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, stats: { runs: 9 }, flags: { seenIntro: true }, embers: 999999,
    skins: { owned: ['${key}','obsidian','azure','ember','solar'], equipped: '${key}' },
    ascension: { tiers: [['${key}',3],['obsidian',3]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  }))`,
});

await page.evaluate(() => window.__dd.ui.showScreen('shop'));
await page.waitForSelector('.hero-select');
await page.waitForTimeout(1200);
// select the dragon + its Eternal form (best read).
await page.click(`.hero-thumb[data-hero="${key}"]`).catch(() => {});
await page.waitForTimeout(900);
await page.click('.hero-forms .hero-seg[data-form="3"]').catch(() => {});
await page.waitForTimeout(1400);

// The shop hero renders the dragon on the MAIN WebGL canvas behind the transparent
// HUD (#hero-canvas is hidden), so screenshot the full page and drag on the visible
// stage container to rotate.
const b = await page.evaluate(() => { const r = document.getElementById('hero-stage').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
const cy = b.y + b.height * 0.45, x0 = b.x + b.width * 0.5;
async function shot(name) { await page.screenshot({ path: `/tmp/nf-${key}-${name}.png` }); console.log(`wrote /tmp/nf-${key}-${name}.png`); }
// one continuous drag adds yaw; capture progressively. ~36px per ~20° here.
async function drag(dx) {
  await page.mouse.move(x0, cy); await page.mouse.down();
  for (let i = 1; i <= 22; i++) { await page.mouse.move(x0 + (dx * i) / 22, cy); await page.waitForTimeout(8); }
  await page.mouse.up(); await page.waitForTimeout(450);
}

await shot('front');
await drag(90);  await shot('q34');       // ¾-front (the menu reference)
await drag(90);  await shot('side');      // side
await drag(110); await shot('q34rear');   // ¾-rear (the chase-cam reference)
await drag(90);  await shot('rear');      // rear

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await done();
