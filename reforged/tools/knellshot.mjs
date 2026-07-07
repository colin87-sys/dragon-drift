// tools/knellshot.mjs — KNELLGRAVE in-game OVERHEAD fight-frame captures (the two
// shots that decide "world-ender or wind chime": the overhead loom at station, and
// the late-fight RUIN state). Boots the REAL game (the bossgate in-game path), spawns
// the bell, waits for the fight + the pose to reach the raised station, screenshots
// the true portrait chase-cam frame; then drives bossDamage to the late phase and
// shoots again. → reforged-captures/knellgrave-ingame-<tag>.png
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { boot } from '../tests/browser.mjs';
import { writeFileSync } from 'fs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const bossIdx = BOSS_ORDER.indexOf('knellgrave');
const VIEW = { width: 720, height: 1280 };

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=2500`,
  viewport: VIEW, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(150000);

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate(() => { window.__dd.player.dist = 2500; });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  // settle at the RAISED station (stationY 20) — wait for the climb, then a beat.
  await page.waitForFunction(() => window.__dd.bossState().poseY > 17, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  writeFileSync('reforged-captures/knellgrave-ingame-loom.png', await page.screenshot());
  console.log('wrote knellgrave-ingame-loom.png (the overhead station frame)');

  // catch a mid-charge frame (the widened swing + rain) for the motion read.
  await page.waitForFunction(() => window.__dd.bossState().charging, { timeout: 60000 }).catch(() => {});
  writeFileSync('reforged-captures/knellgrave-ingame-toll.png', await page.screenshot());
  console.log('wrote knellgrave-ingame-toll.png (a toll mid-charge)');

  // drive to the LATE fight (hp ≈ 0.3 → the ruin ladder visibly open): chip with the
  // debug damage seam, bursting each phase-floor shield with the synchronous Surge
  // climax seam (the same path the lifecycle test uses).
  for (let i = 0; i < 80; i++) {
    const st = await page.evaluate(() => {
      const s = window.__dd.bossState();
      if (s.shielded) window.__dd.bossStrikeSurge();
      else window.__dd.emit('bossDamage', { amount: 14, kind: 'debug' });
      return window.__dd.bossState();
    });
    if (st.hp / st.hpMax <= 0.3) break;
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(2500);   // settle the ruined idle (post-transition)
  writeFileSync('reforged-captures/knellgrave-ingame-ruin.png', await page.screenshot());
  console.log('wrote knellgrave-ingame-ruin.png (the late-fight opened bell)');

  await done();
  process.exit(0);
} catch (e) {
  await done().catch(() => {});
  console.error('knellshot error:', e && e.stack || e);
  process.exit(1);
}
