// _ribbonside.mjs — SIDE-VIEW ribbon capture: the chase cam foreshortens the trailing body so the
// travelling S is invisible from behind. Freeze the camera controller and track the dragon from the
// side so the swim/curves read broadside. Captures a cruise filmstrip + a slalom + an up/down weave.
//   node tools/_ribbonside.mjs [dragonKey]  →  /tmp/ribside-<key>-<pose>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'jade';
const VIEW = { width: 900, height: 600 };
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
await page.evaluate(() => document.querySelector('#btn-start')?.click());
await page.waitForFunction(() => window.__dd?.game?.state === 'playing', { timeout: 10000 });
await page.waitForTimeout(1500);

// Freeze the camera controller and track the dragon from the SIDE (camera on +x, looking -x at the
// body), so the trailing spine lays out broadside and the S is legible.
await page.evaluate(() => {
  const dd = window.__dd;
  dd.cameraCtl.update = () => {
    const p = dd.player.position;
    dd.camera.position.set(p.x + 22, p.y + 4, p.z + 7);
    dd.camera.lookAt(p.x - 1, p.y - 1.5, p.z + 5);
  };
});
await page.waitForTimeout(300);

const shot = async (name) => { await page.screenshot({ path: `/tmp/ribside-${key}-${name}.png`, timeout: 20000 }); console.log(`  ✓ /tmp/ribside-${key}-${name}.png`); };
const hold = async (dir, ms) => { await page.keyboard.down(dir); await page.waitForTimeout(ms); await page.keyboard.up(dir); };

// CRUISE filmstrip — no input; the idle travelling S should visibly move down the body.
for (let i = 0; i < 6; i++) { await shot(`cruise${i}`); await page.waitForTimeout(120); }

// SLALOM — gentle weave; the lateral S should swell.
await hold('ArrowLeft', 260); await hold('ArrowRight', 260); await shot('slalom');

// UP/DOWN — gentle climb/dive; the vertical S should swell.
await hold('ArrowUp', 240); await hold('ArrowDown', 220); await shot('updown');

console.log(errors.length ? '  ! errors: ' + errors.slice(0, 3).join(' | ') : '  ✓ no console errors');
await done();
