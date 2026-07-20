// _ribbonsnap.mjs — reproduce the "stop-motion jump on aggressive snap" bug visually. Drives RAPID
// hard alternating steer edges (full left↔right every ~0.18s) so the whip pulse fires repeatedly, and
// shoots a dense filmstrip from a fixed-lateral tracking cam. Each whip is born at full amplitude in
// one frame → a body pop; rapid snaps → a run of pops that read as stop-motion skipping.
//   node tools/_ribbonsnap.mjs [dragonKey]  →  /tmp/snap-<key>-NN.png
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
await page.waitForTimeout(1200);

await page.evaluate(() => {
  const dd = window.__dd, p = dd.player;
  const t0 = performance.now();
  const LAT = 20;
  dd.cameraCtl.update = () => {
    const t = (performance.now() - t0) / 1000;
    // rapid hard alternation: flip direction every 0.18s (aggressive snapping)
    const dir = (Math.floor(t / 0.18) % 2 === 0) ? 1 : -1;
    p.velocity.x = dir * LAT;
    p.position.x = Math.max(-9, Math.min(9, p.position.x + dir * LAT * (1 / 60)));
    p.position.y = 26; p.velocity.y = 0; p.rollInvuln = 9;
    dd.camera.position.set(0, p.position.y + 6, p.position.z + 20);
    dd.camera.lookAt(0, p.position.y - 1, p.position.z + 2);
  };
});

let n = 0;
const shot = async () => { await page.screenshot({ path: `/tmp/snap-${key}-${String(n).padStart(2, '0')}.png`, timeout: 20000 }); n++; };
// dense: ~55ms apart across several snap cycles
for (let i = 0; i < 20; i++) { await shot(); await page.waitForTimeout(55); }

console.log(`  ✓ ${n} frames · ` + (errors.length ? 'errors: ' + errors.slice(0, 3).join(' | ') : 'no console errors'));
await done();
