// _ribbonresp.mjs — MOVEMENT-RESPONSE capture (Levers 1+2). Drives SHARP step steer edges (right,
// then reverse to left) so the whip pulse fires cleanly, and shoots a dense filmstrip from a
// fixed-lateral tracking camera so the pulse travelling tail-ward + the idle-duck contrast read.
//   node tools/_ribbonresp.mjs [dragonKey]  →  /tmp/resp-<key>-NN.png
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

// Drive SHARP step steer edges (so the whip fires) with matching position, held high + i-framed so it
// never crashes; camera tracks forward only (fixed lateral) so the trail/pulse reads.
await page.evaluate(() => {
  const dd = window.__dd, p = dd.player;
  const t0 = performance.now();
  const LAT = 16;
  dd.cameraCtl.update = () => {
    const t = (performance.now() - t0) / 1000;
    let vx = 0, x = 0;
    if (t < 0.5) { vx = 0; x = 0; }
    else if (t < 1.1) { vx = LAT; x = (t - 0.5) * LAT; }          // step RIGHT (edge → whip)
    else if (t < 1.9) { vx = -LAT; x = 0.6 * LAT - (t - 1.1) * LAT; } // reverse LEFT (big edge → whip)
    else { vx = 0; x = 0.6 * LAT - 0.8 * LAT; }
    p.position.x = x; p.velocity.x = vx;
    p.position.y = 26; p.velocity.y = 0; p.rollInvuln = 9;
    dd.camera.position.set(0, p.position.y + 7, p.position.z + 22);
    dd.camera.lookAt(0, p.position.y - 1, p.position.z + 2);
  };
});

let n = 0;
const shot = async () => { await page.screenshot({ path: `/tmp/resp-${key}-${String(n).padStart(2, '0')}.png`, timeout: 20000 }); n++; };
// Dense filmstrip spanning both edges (~t 0.4 → 2.0), 70ms apart, to catch each pulse travelling.
for (let i = 0; i < 22; i++) { await shot(); await page.waitForTimeout(70); }

console.log(`  ✓ ${n} frames · ` + (errors.length ? 'errors: ' + errors.slice(0, 3).join(' | ') : 'no console errors'));
await done();
