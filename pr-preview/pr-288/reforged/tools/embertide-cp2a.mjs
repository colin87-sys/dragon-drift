// tools/embertide-cp2a.mjs — capture the CP2-A spectacle beats in-game:
//   1) THE ENTRANCE (*The Sky Comes Loose*): the ember seed, the face surfacing
//      through the horizon, the hollows torn open at the fight handoff.
//   2) THE TIDE CRUSH: the vertical squeeze (game.bossArenaHY) + strips + letterbox.
// Headless rAF is HEAVILY throttled (L105) and this scene is dome-scale, so every
// wait is state-based with generous timeouts, and the viewport is the bossgate
// 720×1280 (a 1080×1920 canvas halves the headless frame rate again).
import { boot } from '../tests/browser.mjs';

const SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;
const EMBERTIDE_IDX = 12;   // BOSS_ORDER: ...onewing(11), embertide(12)

const { page, done } = await boot({
  query: `?debug&bossIdx=${EMBERTIDE_IDX}&boss=100`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1, initScript: SAVE,
});
page.setDefaultTimeout(300000);
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 }).catch(() => {});
await page.evaluate(() => window.__dd.spawnBoss());
await page.waitForFunction(() => window.__dd.game.inBoss === true, { timeout: 15000 }).catch(() => {});

const faceY = () => page.evaluate(() => {
  let fr = null; window.__dd.scene.traverse((o) => { if (o.name === 'faceRig' && !fr) fr = o; });
  return fr ? fr.position.y : null;
});

// --- THE ENTRANCE ---
const gotFly = await page.waitForFunction(() => window.__dd.bossState().phase === 'flythrough', { timeout: 240000 })
  .then(() => true).catch(() => false);
console.log(`entrance phase reached: ${gotFly} (faceY ${await faceY()})`);
if (gotFly) {
  await page.screenshot({ path: '/tmp/emb-cp2a-ent-seed.png' });
  console.log('wrote /tmp/emb-cp2a-ent-seed.png (the ember seed / horizon lifting)');
  // The face SURFACING: submerge nearly released (rig-local y back above -80).
  await page.waitForFunction(() => {
    let fr = null; window.__dd.scene.traverse((o) => { if (o.name === 'faceRig' && !fr) fr = o; });
    return fr && fr.position.y > -80;
  }, { timeout: 300000 }).catch(() => console.warn('  ! surfacing frame not confirmed'));
  await page.screenshot({ path: '/tmp/emb-cp2a-ent-surface.png' });
  console.log(`wrote /tmp/emb-cp2a-ent-surface.png (the face surfacing; faceY ${await faceY()})`);
}

// --- THE FIGHT + THE CRUSH ---
await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 300000 })
  .catch(() => console.warn('  ! fight not confirmed'));
console.log(`fight reached (faceY ${await faceY()})`);
await page.screenshot({ path: '/tmp/emb-cp2a-fight.png' });
console.log('wrote /tmp/emb-cp2a-fight.png (fight open, pre-crush)');
const gotCrush = await page.waitForFunction(() => window.__dd.game.bossArenaHY != null, { timeout: 240000 })
  .then(() => true).catch(() => false);
console.log(`crush fired: ${gotCrush}`);
if (gotCrush) {
  await page.waitForFunction(() => window.__dd.game.bossArenaHY < 16, { timeout: 120000 }).catch(() => {});
  const probe = await page.evaluate(() => {
    let ceil = null; window.__dd.scene.traverse((o) => { if (o.name === 'crushCeil' && !ceil) ceil = o; });
    return {
      hy: Math.round(window.__dd.game.bossArenaHY * 10) / 10,
      ceilVisible: ceil ? ceil.visible : null,
      ceilY: ceil ? Math.round(ceil.position.y) : null,
      letterbox: !!document.querySelector('.cinebar.on'),
    };
  });
  console.log('crush probe:', JSON.stringify(probe));
  await page.screenshot({ path: '/tmp/emb-cp2a-crush.png' });
  console.log('wrote /tmp/emb-cp2a-crush.png (the sky crushes the lane)');
}
await done();
