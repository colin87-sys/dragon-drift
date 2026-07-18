// CLOSE-UP in the REAL biome (water/fog/reflection/golden light). The studio has none of that and cruise
// frames put off-lane props at the horizon. THE SEAM: override cameraCtl.update (NOT renderer.render) so
// our camera is placed BEFORE the frame reads it — sky-follow, god-rays, water reflection + fog all stay
// consistent, exactly like normal play. (A render-override moves the cam AFTER that setup → black frame.)
// We move the player up beside a real ACTIVE off-lane prop instance (so it sits in a live band with the
// water/sky centred on it) and frame it from a small offset.  HERO=<prop> node tools/_lagoonclose.mjs [tag] [camDist]
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1280, height: 860 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false} }))`;
const HERO = process.env.HERO || 'rootbastion';
const tag = process.argv[2] || 'c1';
const camDist = +(process.argv[3] || 0); // 0 = auto-frame from the prop's height
const { page, done, errors } = await boot({ query: `?biome=0&debug&hero=${HERO}`, viewport: VIEW, deviceScaleFactor: 1.5, initScript: save });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
await page.evaluate(() => {
  const dd = window.__dd; dd.noBoss && dd.noBoss(true);
  const cam = dd.camera;
  dd.__cam = null;
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
      const sy = Math.hypot(arr[k * 16 + 4], arr[k * 16 + 5], arr[k * 16 + 6]); // h scale
      const x = arr[k * 16 + 12], y = arr[k * 16 + 13], z = arr[k * 16 + 14];
      if (sx < 1 || y < -10 || Math.abs(x) < 8 || Math.abs(x) > 55) continue; nActive++;
      const dz = Math.abs(z - (pz - (o.ahead || 0)));
      if (dz < pdz) { pdz = dz; pick = { x, y, z, h: sy }; }
    }
  });
  return { pick, nActive };
};
await page.evaluate(`window.__findPick = ${findPick.toString()};`);
let logged = false;
for (let i = 0; i < 6; i++) {
  await page.evaluate((o) => { window.__dd.player.dist = o.d; window.__dd.player.speed = 0; }, { d: 320 + i * 80 });
  await page.waitForTimeout(240);
  const a = await page.evaluate((o) => window.__findPick(o), { ahead: 40 });
  if (!a.pick) { if (!logged) console.log('frameA' + i + ':', JSON.stringify(a)); continue; }
  // move the PLAYER up beside the prop so the water/sky band is centred there
  await page.evaluate((o) => { window.__dd.player.dist = o.pz - 24; window.__dd.player.speed = 0; }, { pz: -a.pick.z });
  await page.waitForTimeout(300);
  const info = await page.evaluate((o) => {
    const dd = window.__dd;
    const b = window.__findPick({ ahead: 24 });
    if (!b.pick) return { err: 'no pick B', nActive: b.nActive };
    const p = b.pick, s = Math.sign(p.x);
    // frame proportional to the prop's real height: eye near the mid, distance a touch over the height,
    // low near-water vantage to the prop's outer side so silhouette reads against the gold sky/mirror.
    // HIGH=1 raises the eye + steepens the look-down for FLAT props (lilyraft pads read from above).
    const high = o.high;               // tight low-overhead read for FLAT tiny props (lilyraft pads)
    const H = Math.max(6, p.h * 0.9);  // approx visible height (unit heights ~1)
    const aim = high ? 0.35 : 0.5 + H * 0.45;
    const d = o.camDist > 0 ? o.camDist : (high ? 6 : H * 1.15);
    const eyeY = high ? 4 : 0.5 + H * 0.55;
    dd.__cam = { p: [p.x + s * d, eyeY, p.z + d * 0.7], t: [p.x, aim, p.z] };
    return { pick: [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)], h: +p.h.toFixed(1), nActive: b.nActive };
  }, { camDist, high: !!process.env.HIGH });
  await page.waitForTimeout(320);
  writeFileSync(`reforged-captures/lagoonclose-${tag}-${String(i).padStart(2, '0')}.png`, await page.screenshot());
  if (!logged) { console.log('frame' + i + ':', JSON.stringify(info)); logged = !info.err; }
}
await done();
console.log(`close ${tag} (${HERO}): 6 frames; err=${errors.length}`);
