// karstfang STAGE-2 IN-CONTEXT gate — the prop in the REAL biome (jade water, golden god-rays, fog, the
// mirror double, real (r,h,r) scale, cruise distance). Boots ?props=v3&hero=karstfang so ONLY karstfang
// spawns in biome 0 (isolated for the gate). Two reads: (A) a natural flythrough burst (the owner's
// frame — the dragon flying past an archipelago), then (B) a framed close-up via the cameraCtl.update
// SEAM (place the camera BEFORE the frame reads it — a renderer.render override renders black).
//   node tools/_kfgame.mjs [tag]  →  reforged-captures/kfgame-<tag>-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1600, height: 1000 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const tag = process.argv[2] || 'g1';
const { page, done, errors } = await boot({ query: '?biome=0&debug&props=v3&hero=karstfang', viewport: VIEW, deviceScaleFactor: 1.5, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
// Reach the 'playing' state robustly: the FIRST tap fast-forwards the attract intro (does not launch),
// so click/Enter several times until game.state flips to 'playing' (else the menu overlay stays up).
await page.waitForFunction(() => window.__dd && window.__dd.game, { timeout: 15000 }).catch(() => {});
for (let a = 0; a < 12; a++) {
  const st = await page.evaluate(() => window.__dd && window.__dd.game && window.__dd.game.state).catch(() => null);
  if (st === 'playing') break;
  await page.click('#btn-start').catch(() => {});
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(350);
}
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 6000 }).catch(() => {});
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true); dd.clearVents && dd.clearVents();
  window.__pin = setInterval(() => { dd.game.health = 100; dd.clearVents && dd.clearVents(); }, 24);
});
// ---- (A) natural flythrough burst (the owner's shipping frame) ----
await page.evaluate(() => { window.__dd.player.dist = 300; });
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(300);
  writeFileSync(`reforged-captures/kfgame-${tag}-fly${String(i).padStart(2, '0')}.png`, await page.screenshot());
}
// ---- (B) framed close-up via the cameraCtl seam ----
await page.evaluate(() => {
  const dd = window.__dd; const cam = dd.camera; dd.__cam = null;
  dd.cameraCtl.update = () => {
    if (!dd.__cam) return;
    cam.position.set(dd.__cam.p[0], dd.__cam.p[1], dd.__cam.p[2]);
    cam.up.set(0, 1, 0); cam.lookAt(dd.__cam.t[0], dd.__cam.t[1], dd.__cam.t[2]);
    cam.fov = dd.__cam.fov || 46; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
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
      if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy }; }
    }
  });
  return { pick, nActive };
};
await page.evaluate(`window.__findPick = ${findPick.toString()};`);
let logged = false;
for (let i = 0; i < 6; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 340 + i * 90 });
  await page.waitForTimeout(240);
  const a = await page.evaluate((o) => window.__findPick(o), { ahead: 50 });
  if (!a.pick) { if (!logged) console.log('probeA' + i + ':', JSON.stringify(a)); continue; }
  await page.evaluate((o) => { window.__dd.player.dist = o.pz - 30; window.__dd.player.speed = 0; }, { pz: -a.pick.z });
  await page.waitForTimeout(300);
  const info = await page.evaluate((o) => {
    const dd = window.__dd;
    const b = window.__findPick({ ahead: 28 });
    if (!b.pick) return { err: 'no pick B', nActive: b.nActive };
    const p = b.pick, s = Math.sign(p.x) || 1;
    const H = Math.max(10, p.h * 1.1);        // approx visible world height (unit top ~1.16)
    const d = o.camDist > 0 ? o.camDist : H * 1.25;
    dd.__cam = { p: [p.x + s * d, 0.6 + H * 0.42, p.z + d * 0.62], t: [p.x, 0.5 + H * 0.42, p.z] };
    return { pick: [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)], h: +p.h.toFixed(1), nActive: b.nActive };
  }, { camDist: +(process.argv[3] || 0) });
  await page.waitForTimeout(320);
  writeFileSync(`reforged-captures/kfgame-${tag}-close${String(i).padStart(2, '0')}.png`, await page.screenshot());
  if (!logged) { console.log('close' + i + ':', JSON.stringify(info)); logged = !info.err; }
}
await page.evaluate(() => clearInterval(window.__pin));
await done().catch(() => {});
console.log(`kfgame ${tag}: 6 fly + 6 close frames; err=${errors.length}`);
