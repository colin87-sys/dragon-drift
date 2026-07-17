// Forum FAR-MASSIF capture — a hero-pinned far prop (aqueduct) seen across the water from the LANE (its real
// job: the horizon element), PLUS a clean dead-front elevation to read the arch rhythm. ?props=forum&hero=<X>
//   HERO=aqueduct node tools/_forumfar.mjs [tag]  →  reforged-captures/forumfar-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 760 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'f1';
const HERO = process.env.HERO || 'aqueduct';
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=${HERO}`, viewport: VIEW, deviceScaleFactor: 1.3, initScript: save });
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
  window.__pin = setInterval(() => {
    dd.game.health = 100; dd.clearVents && dd.clearVents();
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0; if (dd.game.hitFlash != null) dd.game.hitFlash = 0;
  }, 16);
  const cam = dd.camera; dd.__cam = null;
  dd.cameraCtl.update = () => { if (!dd.__cam) return;
    cam.position.set(dd.__cam.p[0], dd.__cam.p[1], dd.__cam.p[2]);
    cam.up.set(0, 1, 0); cam.lookAt(dd.__cam.t[0], dd.__cam.t[1], dd.__cam.t[2]);
    cam.fov = dd.__cam.fov || 42; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); };
});
// find the nearest hero instance at ANY |x| (far massifs sit 80-130 off-lane)
const findFar = () => { const dd = window.__dd; const pz = -dd.player.dist; let pick = null, pdz = 1e9, n = 0;
  dd.scene.traverse((m) => { if (!m.isInstancedMesh || m.count < 1) return; const arr = m.instanceMatrix.array;
    for (let k = 0; k < m.count; k++) { const sx = Math.hypot(arr[k*16+0], arr[k*16+1], arr[k*16+2]);
      const x = arr[k*16+12], y = arr[k*16+13], z = arr[k*16+14];
      if (sx < 1 || y < -20 || Math.abs(x) < 40) continue; n++;
      const dz = Math.abs(z - (pz - 40)); if (dz < pdz) { pdz = dz; pick = { x, y, z, h: Math.hypot(arr[k*16+4],arr[k*16+5],arr[k*16+6]), r: sx }; } } });
  return { pick, n }; };
await page.evaluate(`window.__findFar = ${findFar.toString()};`);
let shot = 0;
for (let i = 0; i < 5 && shot < 3; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 380 + i * 120 });
  await page.waitForTimeout(240);
  const a = await page.evaluate(() => window.__findFar());
  if (!a.pick) { console.log('probe' + i, JSON.stringify(a)); continue; }
  const info = await page.evaluate((o) => {
    const dd = window.__dd; const p = o.p, s = Math.sign(p.x) || 1, H = Math.max(14, p.h * 0.95);
    if (o.elev) {
      // DEAD-FRONT ELEVATION: camera SQUARE to the +z front face (HERO pin → rotY 0 → face points +z), level,
      // framing the whole run so the two-tier arch rhythm reads dead-on.
      dd.__cam = { p: [p.x, H * 0.5, p.z + p.r * 1.15], t: [p.x, H * 0.5, p.z], fov: 46 };
    } else {
      // FROM THE LANE across the water: eye near the flight lane (x≈0), low, looking out at the far massif.
      dd.__cam = { p: [s * 6, H * 0.34, p.z + 46], t: [p.x * 0.9, H * 0.42, p.z], fov: 44 };
    }
    return { pick: [p.x.toFixed(0), p.y.toFixed(1), p.z.toFixed(0)], h: +p.h.toFixed(1), r: +p.r.toFixed(1), n: 1 };
  }, { p: a.pick, elev: i === 0 });
  await page.waitForTimeout(280);
  writeFileSync(`reforged-captures/forumfar-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + (i === 0 ? ' (elevation)' : ' (from-lane)') + ':', JSON.stringify(info));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`forumfar ${tag}: ${shot} frames; err=${errors.length}`);
