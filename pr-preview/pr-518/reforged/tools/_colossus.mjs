// COLOSSUS (drowned bronze hand) studio capture — the auto-framers mis-frame a rare mid prop at |x|46-58.
// Frames the hand from the pinned BROADSIDE ¾ (the play angle), a closer detail ¾, and an in-context range shot.
// HERO=colossus node tools/_colossus.mjs [tag] → reforged-captures/colossus-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 1000 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'c1';
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=colossus`, viewport: VIEW, deviceScaleFactor: 1.3, initScript: save });
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
const findHand = () => { const dd = window.__dd; const pz = -dd.player.dist; let pick = null, pdz = 1e9;
  dd.scene.traverse((m) => { if (!m.isInstancedMesh || m.count < 1) return; const arr = m.instanceMatrix.array;
    for (let k = 0; k < m.count; k++) { const sy = Math.hypot(arr[k*16+4], arr[k*16+5], arr[k*16+6]);
      const x = arr[k*16+12], y = arr[k*16+13], z = arr[k*16+14];
      if (sy < 10 || sy > 26 || y < -20 || Math.abs(x) < 30) continue;   // colossus: h 14-17, |x| 46-58
      const dz = Math.abs(z - (pz - 40)); if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy }; } } });
  return pick; };
await page.evaluate(`window.__findHand = ${findHand.toString()};`);
// Hide the HUD overlay: the #hud SVG stamina-arc is a SCREEN-SPACE curve that overlaps the palm at studio
// framing and pareidolias into a "smile" (Fable re-gate). It is NOT colossus geometry — hiding it proves it
// and yields the clean palm-face capture Fable's acceptance requires (zero arc pixels on the palm).
await page.evaluate(() => { const h = document.getElementById('hud'); if (h) h.style.display = 'none'; });
let shot = 0;
for (let i = 0; i < 6 && shot < 3; i++) {
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.player.speed = 0; }, 360 + i * 130);
  await page.waitForTimeout(240);
  const p = await page.evaluate(() => window.__findHand());
  if (!p) { console.log('probe' + i, 'none'); continue; }
  await page.evaluate((o) => { const p = o.p, H = o.p.h, s = Math.sign(p.x) || 1;
    // 0 = BROADSIDE ¾ from the lane side (the play angle: rotY pins the palm broadside to the lane)
    if (o.view === 0) window.__dd.__cam = { p: [s * 8, H * 0.7, p.z + H * 2.0], t: [p.x, H * 0.45, p.z], fov: 40 };
    // 1 = closer detail ¾ from the sun side (lit patina + thumb + forearm)
    else if (o.view === 1) window.__dd.__cam = { p: [p.x - s * H * 0.9, H * 0.85, p.z + H * 1.3], t: [p.x, H * 0.5, p.z], fov: 40 };
    // 2 = in-context at range from lane altitude (~250 down-lane)
    else window.__dd.__cam = { p: [s * 6, 15, p.z + 250], t: [p.x * 0.85, H * 0.5, p.z], fov: 46 };
  }, { p, view: shot });
  await page.waitForTimeout(260);
  writeFileSync(`reforged-captures/colossus-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + ': pick', [p.x.toFixed(0), p.y.toFixed(1), p.z.toFixed(0)], 'h', p.h.toFixed(1));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`colossus ${tag}: ${shot} frames; err=${errors.length}`);
