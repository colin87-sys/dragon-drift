// karstfang STAGE-2 close-up (lean/fast) — the prop in the REAL biome, framed from a low OUTER-side ¾
// vantage so the golden sky-fill lands on the face we see (honey body / jade waterline + its MIRROR
// double / green crown), not a pure backlit silhouette. Uses the cameraCtl.update SEAM (place the camera
// BEFORE the frame reads it). ?props=v3&hero=karstfang → only karstfang in biome 0.
//   node tools/_forumclose.mjs [tag] [camDistMul]  →  reforged-captures/forumclose-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 820 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'c1';
const camMul = +(process.argv[3] || 1.35);
const HERO = process.env.HERO || 'triumphgate';   // any v3 prop: HERO=figgate node tools/_forumclose.mjs fg1
const { page, done, errors } = await boot({ query: `?biome=0&debug&props=forum&hero=${HERO}`, viewport: VIEW, deviceScaleFactor: 1.4, initScript: save });
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
    if (dd.game.state && dd.game.state !== 'playing') dd.game.state = 'playing';   // revert any crash/damage transition so the capture stays clean
    if (dd.game.dmgFlash != null) dd.game.dmgFlash = 0;                            // kill the red damage vignette
    if (dd.game.hitFlash != null) dd.game.hitFlash = 0;
  }, 16);
  const cam = dd.camera; dd.__cam = null;
  dd.cameraCtl.update = () => {
    if (!dd.__cam) return;
    cam.position.set(dd.__cam.p[0], dd.__cam.p[1], dd.__cam.p[2]);
    cam.up.set(0, 1, 0); cam.lookAt(dd.__cam.t[0], dd.__cam.t[1], dd.__cam.t[2]);
    cam.fov = dd.__cam.fov || 44; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  };
});
const findPick = (o) => {
  const dd = window.__dd; const pz = -dd.player.dist;
  let pick = null, pdz = 1e9, nActive = 0;
  dd.scene.traverse((m) => {
    if (!m.isInstancedMesh || m.count < 2) return;
    const arr = m.instanceMatrix.array;
    for (let k = 0; k < m.count; k++) {
      const sx = Math.hypot(arr[k * 16 + 0], arr[k * 16 + 1], arr[k * 16 + 2]);
      const sy = Math.hypot(arr[k * 16 + 4], arr[k * 16 + 5], arr[k * 16 + 6]);
      const x = arr[k * 16 + 12], y = arr[k * 16 + 13], z = arr[k * 16 + 14];
      if (sx < 1 || y < -10 || Math.abs(x) < 8 || Math.abs(x) > 60) continue; nActive++;
      const dz = Math.abs(z - (pz - (o.ahead || 0)));
      if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy, r: sx }; }
    }
  });
  return { pick, nActive };
};
await page.evaluate(`window.__findPick = ${findPick.toString()};`);
let shot = 0;
for (let i = 0; i < 4 && shot < 3; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 360 + i * 110 });
  await page.waitForTimeout(220);
  const a = await page.evaluate((o) => window.__findPick(o), { ahead: 60 });
  if (!a.pick) { console.log('probe' + i + ':', JSON.stringify(a)); continue; }
  await page.evaluate((o) => { window.__dd.player.dist = o.pz - 34; window.__dd.player.speed = 0; }, { pz: -a.pick.z });
  await page.waitForTimeout(260);
  const info = await page.evaluate((o) => {
    const dd = window.__dd;
    const b = window.__findPick({ ahead: 30 });
    if (!b.pick) return { err: 'no pick B', nActive: b.nActive };
    const p = b.pick, s = Math.sign(p.x) || 1;
    const H = Math.max(11, p.h * 1.14);              // approx visible world height (unit top ~1.16)
    const d = H * o.camMul;
    // low OUTER-side ¾ vantage: eye at ~42% height, out to the prop's outer side + a touch down-lane
    // (toward the sun/horizon at −z) so the seen face catches warm sky-fill and the mirror doubles below.
    dd.__cam = { p: [p.x + s * d * 0.92, 0.6 + H * 0.40, p.z + d * 0.55], t: [p.x, 0.4 + H * 0.44, p.z] };
    return { pick: [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)], h: +p.h.toFixed(1), r: +p.r.toFixed(1), nActive: b.nActive };
  }, { camMul });
  if (info.err) { console.log('frame' + i + ':', JSON.stringify(info)); continue; }
  await page.waitForTimeout(300);
  writeFileSync(`reforged-captures/forumclose-${tag}-${String(shot).padStart(2, '0')}.png`, await page.screenshot());
  console.log('frame' + shot + ':', JSON.stringify(info));
  shot++;
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`forumclose ${tag}: ${shot} frames; err=${errors.length}`);
