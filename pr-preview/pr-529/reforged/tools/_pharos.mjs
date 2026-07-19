// PHAROS full-tower studio capture — the auto-framers are tuned for 15-40-wide props and cut the crown off a
// 55m leaning tower. Frame the WHOLE height, pulled back, centred on mid-height, from a front-¾ that shows the
// cross-lane (+x, HERO-pinned) LEAN. HERO=pharos node tools/_pharos.mjs [tag] → reforged-captures/pharos-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1080, height: 1320 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'p1';
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=pharos`, viewport: VIEW, deviceScaleFactor: 1.2, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.waitForFunction(() => window.__dd && window.__dd.game, { timeout: 15000 }).catch(() => {});
for (let a = 0; a < 12; a++) {
  const st = await page.evaluate(() => window.__dd && window.__dd.game && window.__dd.game.state).catch(() => null);
  if (st === 'playing') break;
  await page.click('#btn-start').catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(320);
}
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents();
  window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents();
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0; if (dd.game.hitFlash != null) dd.game.hitFlash = 0; }, 16);
  const cam = dd.camera; dd.__cam = null;
  dd.cameraCtl.update = () => { if (!dd.__cam) return;
    cam.position.set(dd.__cam.p[0], dd.__cam.p[1], dd.__cam.p[2]);
    cam.up.set(0, 1, 0); cam.lookAt(dd.__cam.t[0], dd.__cam.t[1], dd.__cam.t[2]);
    cam.fov = dd.__cam.fov || 42; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); };
});
const findTall = () => { const dd = window.__dd; const pz = -dd.player.dist; let pick = null, pdz = 1e9;
  dd.scene.traverse((m) => { if (!m.isInstancedMesh || m.count < 1) return; const arr = m.instanceMatrix.array;
    for (let k = 0; k < m.count; k++) { const sy = Math.hypot(arr[k*16+4], arr[k*16+5], arr[k*16+6]);
      const x = arr[k*16+12], y = arr[k*16+13], z = arr[k*16+14];
      if (sy < 40 || y < -20 || Math.abs(x) < 30) continue;   // pharos: h 52-62, |x| 60-72
      const dz = Math.abs(z - (pz - 40)); if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy, r: Math.hypot(arr[k*16+0],arr[k*16+1],arr[k*16+2]) }; } } });
  return pick; };
await page.evaluate(`window.__findTall = ${findTall.toString()};`);
let shot = 0;
for (let i = 0; i < 6 && shot < 3; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.player.speed = 0; }, 360 + i * 130);
  await page.waitForTimeout(240);
  const p = await page.evaluate(() => window.__findTall());
  if (!p) { console.log('probe' + i, 'none'); continue; }
  await page.evaluate((o) => { const p = o.p, H = o.p.h, s = Math.sign(p.x) || 1;
    // views: 0 = front elevation (lean tilts L/R), 1 = ¾ from the inboard/lane side (player vantage), 2 = crown close
    if (o.view === 0) window.__dd.__cam = { p: [p.x, H * 0.52, p.z + H * 2.7], t: [p.x, H * 0.5, p.z], fov: 40 };
    else if (o.view === 1) window.__dd.__cam = { p: [p.x - s * H * 1.1, H * 0.42, p.z + H * 2.1], t: [p.x, H * 0.5, p.z], fov: 42 };
    // view 2 = IN-CONTEXT at range: eye near the flight lane (x≈6), at flight altitude (~15), ~250 down-lane —
    // the pharos as a distant OFF-LANE tilted silhouette with the ember (the actual in-game punctuation read).
    else window.__dd.__cam = { p: [s * 6, 15, p.z + 250], t: [p.x * 0.85, H * 0.55, p.z], fov: 46 };
  }, { p, view: shot });
  await page.waitForTimeout(260);
  writeFileSync(`reforged-captures/pharos-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + ' view' + shot + ': pick', [p.x.toFixed(0), p.y.toFixed(1), p.z.toFixed(0)], 'h', p.h.toFixed(1));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`pharos ${tag}: ${shot} frames; err=${errors.length}`);
