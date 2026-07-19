// _ribbonweave.mjs — MOVEMENT-RESPONSE diagnostic. Does the body TRAIL/RESPOND when the pilot moves
// left/right/up/down (gymnast-ribbon), or does it just coil idly? The chase cam re-centres the dragon
// every frame, which can HIDE world-space trailing — so here the camera tracks the dragon's FORWARD
// (z) motion only and holds x/y FIXED, like an audience watching a gymnast: when the pilot slides
// right, the dragon slides right IN FRAME and the body should trail/lag behind it.
//   node tools/_ribbonweave.mjs [dragonKey]  →  /tmp/weave-<key>-<n>.png  (filmstrip frames)
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

// Camera: DRIVE the dragon in a controlled lateral sine weave directly (bypasses input/obstacles),
// hold it high + pin i-frames so it never crashes, and track it from a fixed-lateral chase so the
// weave reads as in-frame swing with the body trailing. performance.now() drives the weave clock.
await page.evaluate(() => {
  const dd = window.__dd, p = dd.player;
  const t0 = performance.now();
  dd.cameraCtl.update = () => {
    const t = (performance.now() - t0) / 1000;
    // lateral sine weave (±8 units, ~0.9 Hz) + a slow vertical bob; keep well above the obstacle field.
    p.position.x = Math.sin(t * 5.6) * 8;
    p.position.y = 26 + Math.sin(t * 3.1) * 3;
    p.velocity.x = Math.cos(t * 5.6) * 8 * 5.6;   // real lateral velocity so the drive/curl signals see it
    p.velocity.y = Math.cos(t * 3.1) * 3 * 3.1;
    p.rollInvuln = 9;                              // pin i-frames (belt-and-braces with the high altitude)
    dd.camera.position.set(0, p.position.y + 7, p.position.z + 22);
    dd.camera.lookAt(0, p.position.y - 1, p.position.z + 2);
  };
});
await page.waitForTimeout(300);

let n = 0;
const shot = async () => { await page.screenshot({ path: `/tmp/weave-${key}-${String(n).padStart(2, '0')}.png`, timeout: 20000 }); n++; };
// Dense filmstrip across ~2.4s of the sine weave so the body trailing/lagging the head is legible.
for (let i = 0; i < 24; i++) { await shot(); await page.waitForTimeout(100); }

console.log(`  ✓ ${n} frames · ` + (errors.length ? 'errors: ' + errors.slice(0, 3).join(' | ') : 'no console errors'));
await done();
