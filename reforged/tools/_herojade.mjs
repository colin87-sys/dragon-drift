// _herojade.mjs — premium look-gate capture for the Jade Serpent apex. Renders the APEX (tier 2)
// in-engine at gameplay + studio angles so a critic can judge the model objectively:
//   chase   — the judged rear-chase gameplay frame (player truth)
//   q34     — close 3/4 rear-above (the fan-crown value structure + depth)
//   side    — close side (edge-on truth: do the fan rays read as raised ribs, not a plank?)
//   top     — 3/4 top-down (the fan-row hierarchy, shoulder→aft de-blob)
//   node tools/_herojade.mjs [dragonKey]  →  /tmp/hero-<key>-<view>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'jade';
const VIEW = { width: 1100, height: 760 };
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
await page.waitForTimeout(2200);   // settle into steady straight cruise

const shot = async (name) => { await page.screenshot({ path: `/tmp/hero-${key}-${name}.png`, timeout: 20000 }); console.log('  ✓ ' + name); };

// chase = the game's own cam (player truth)
await shot('chase');

// studio cams: freeze the controller and frame the shoulder/fan-crown close. The head/fan-crown sits
// near the group origin; the body trails +z. Aim a little ahead of the shoulder.
const setCam = (ox, oy, oz, lx, ly, lz) => page.evaluate(([ox, oy, oz, lx, ly, lz]) => {
  const dd = window.__dd, p = dd.player;
  dd.cameraCtl.update = () => {
    dd.camera.position.set(p.position.x + ox, p.position.y + oy, p.position.z + oz);
    dd.camera.lookAt(p.position.x + lx, p.position.y + ly, p.position.z + lz);
  };
}, [ox, oy, oz, lx, ly, lz]);

// close on the shoulder fan-crown (first fans sit ~2-4u behind the head). Aim tight.
await setCam(3.4, 2.2, 5.2, -0.2, 0.2, 2.6); await page.waitForTimeout(250); await shot('q34');
await setCam(6.2, 0.8, 2.6, -0.5, -0.2, 2.8); await page.waitForTimeout(250); await shot('side');
await setCam(1.8, 6.0, 4.2, 0, -0.6, 2.8); await page.waitForTimeout(250); await shot('top');
await setCam(5.0, -2.6, 3.2, -0.5, 1.0, 3.0); await page.waitForTimeout(250); await shot('low');   // belly/underside — the ventral scute band + body mass

console.log(errors.length ? '  ! errors: ' + errors.slice(0, 3).join(' | ') : '  ✓ no console errors');
await done();
