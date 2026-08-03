// _ribbonshot.mjs — RIBBON motion capture: boots jade in-flight and screenshots the body while
// flying STRAIGHT, through a SUSTAINED HARD TURN (the coil), and a SLALOM (the twirl). Proves the
// follow-the-leader body actually trails/coils in-engine (not just headless math).
//   node tools/_ribbonshot.mjs [dragonKey]  →  /tmp/ribbon-<key>-<pose>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'jade';
const VIEW = { width: 1280, height: 800 };
const CLIP = { x: 300, y: 200, width: 700, height: 470 };   // crop around the dragon, above the CTA row
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['${key}'], equipped: '${key}' },
  ascension: { tiers: [['${key}', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

const { page, done, errors } = await boot({ query: '?debug&cleanshot', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.waitForSelector('#btn-start', { state: 'attached' }).catch(() => {});
// fire the DOM click directly — #btn-start has a `breathe` CSS anim so Playwright's actionability
// "stable" wait times out; element.click() bypasses it.
await page.evaluate(() => document.querySelector('#btn-start')?.click());
await page.waitForFunction(() => window.__dd?.game?.state === 'playing', { timeout: 10000 });
await page.waitForTimeout(2600);   // climb into steady flight

const state = () => page.evaluate(() => window.__dd?.game?.state);
const shot = async (name) => { await page.screenshot({ path: `/tmp/ribbon-${key}-${name}.png`, clip: CLIP, timeout: 20000 }); console.log(`  ✓ /tmp/ribbon-${key}-${name}.png  [state=${await state()}]`); };
const hold = async (dir, ms) => { await page.keyboard.down(dir); await page.waitForTimeout(ms); await page.keyboard.up(dir); };

// STRAIGHT — body carries the silky travelling S even at rest.
await shot('straight');

// CRUISE FILMSTRIP — 5 frames ~140ms apart with NO input, to see the travelling wave move down the
// body (silkiness is a motion quality a single still can't show).
for (let i = 0; i < 5; i++) { await shot(`cruise${i}`); await page.waitForTimeout(140); }

// SLALOM — alternate left/right; the lateral S should swell + travel head→tail.
await hold('ArrowLeft', 300); await hold('ArrowRight', 320);
await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(220); await shot('slalom'); await page.keyboard.up('ArrowLeft');
await page.waitForTimeout(300);

// UP/DOWN — gentle climb then a short dip; the VERTICAL S should swell (flows up/down, not just L/R).
await hold('ArrowUp', 260); await page.keyboard.down('ArrowDown'); await page.waitForTimeout(180); await shot('updown'); await page.keyboard.up('ArrowDown');
await page.waitForTimeout(260);

// SUSTAINED HARD TURN — hold right; the head traces a curve so the body sweeps/coils behind it.
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1000); await shot('turn');
await page.waitForTimeout(2000); await shot('coil');   // long sustained hold → the steer-curl fully ramps into a J-hook
await page.keyboard.up('ArrowRight');

console.log(errors.length ? '  ! console errors: ' + errors.slice(0, 3).join(' | ') : '  ✓ no console errors');
await done();
