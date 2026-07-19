// ARENA (amphitheater rim — broken quarter-arc) studio capture — the auto-framers mis-frame a wide, curved,
// super-rare crown prop (|x|≥45, rim world-top ~34-40). Frames the CURVE broadside from the lane (the
// name-test angle: the receding rank of round arches must read as a bowl), a ¾ into the flooded-gold interior,
// and an in-context range shot down the lane. Hides #hud before every frame (the screen-space stamina-arc
// pareidolias as surface features on a centred prop — the colossus HUD-arc law).
// HERO=arena node tools/_arena.mjs [tag] → reforged-captures/arena-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 1000 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'a1';
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=arena`, viewport: VIEW, deviceScaleFactor: 1.3, initScript: save });
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
// arena: rim world-top ~34-40, |x|≥45; a wide curved massif. Thresholds env-overridable while place() tunes.
const HMIN = +(process.env.ARENA_HMIN || 26), HMAX = +(process.env.ARENA_HMAX || 60), XMIN = +(process.env.ARENA_XMIN || 38);
const findArena = () => { const dd = window.__dd; const pz = -dd.player.dist; let pick = null, pdz = 1e9;
  const HMIN = window.__aHMIN, HMAX = window.__aHMAX, XMIN = window.__aXMIN;
  dd.scene.traverse((m) => { if (!m.isInstancedMesh || m.count < 1) return; const arr = m.instanceMatrix.array;
    for (let k = 0; k < m.count; k++) { const sy = Math.hypot(arr[k*16+4], arr[k*16+5], arr[k*16+6]);
      const x = arr[k*16+12], y = arr[k*16+13], z = arr[k*16+14];
      if (sy < HMIN || sy > HMAX || y < -20 || Math.abs(x) < XMIN) continue;
      const dz = Math.abs(z - (pz - 40)); if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy }; } } });
  return pick; };
await page.evaluate((o) => { window.__aHMIN = o.a; window.__aHMAX = o.b; window.__aXMIN = o.c; }, { a: HMIN, b: HMAX, c: XMIN });
await page.evaluate(`window.__findArena = ${findArena.toString()};`);
await page.evaluate(() => { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; });
// Bring the arena into the mid-field and let the band matrices SCROLL + settle (the finder needs live matrices —
// a short wait leaves them stale and the finder returns none). Then frame it from the LANE side at low altitude,
// which reproduces the raked oblique player read (never frontal).
await page.evaluate(() => { window.__dd.player.dist = 640; window.__dd.player.speed = 0.0001; });
await page.waitForTimeout(1300);
let shot = 0;
for (let i = 0; i < 3; i++) {
  const p = await page.evaluate(() => window.__findArena());
  if (!p) { console.log('probe' + i, 'none'); await page.waitForTimeout(300); continue; }
  await page.evaluate((o) => { const p = o.p, H = o.p.h, s = Math.sign(p.x) || 1;
    // 0 = LANE-SIDE low oblique ¾ (the shipping cruise read: the raked curved arcade recedes into fog)
    if (o.view === 0) window.__dd.__cam = { p: [s * 10, H * 0.30, p.z + H * 1.9], t: [p.x * 0.75, H * 0.34, p.z - H * 0.3], fov: 46 };
    // 1 = closer low ¾ toward the GROUND bays (does gold water read through the low arches? the dual-aperture flip)
    else if (o.view === 1) window.__dd.__cam = { p: [p.x + s * H * 0.2, H * 0.22, p.z + H * 1.15], t: [p.x, H * 0.30, p.z], fov: 48 };
    // 2 = pulled-back lane vantage (the whole level-topped mass + the bend into fog)
    else window.__dd.__cam = { p: [s * 8, H * 0.55, p.z + H * 3.0], t: [p.x * 0.8, H * 0.40, p.z], fov: 44 };
  }, { p, view: shot });
  await page.waitForTimeout(300);
  writeFileSync(`reforged-captures/arena-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + ': pick', [p.x.toFixed(0), p.y.toFixed(1), p.z.toFixed(0)], 'h', p.h.toFixed(1));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`arena ${tag}: ${shot} frames; err=${errors.length}`);
