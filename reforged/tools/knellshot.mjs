// tools/knellshot.mjs — KNELLGRAVE in-game captures: the decisive frames (real chase
// cam, not studio cards). (1) the ENTRANCE APEX (It Lifts Its Head — the bell looming,
// the clapper's head lifted), (2) the OVERHEAD LOOM at station, (3) a toll mid-charge,
// (4) THE LAST TOLL reveal (P4 — the bell directly overhead, the prisoner straining in
// the gaping crack, seen from beneath). → reforged-captures/knellgrave-ingame-*.png
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
page.setDefaultTimeout(200000);
const shot = (tag) => page.screenshot().then((png) => { writeFileSync(`reforged-captures/knellgrave-ingame-${tag}.png`, png); console.log(`wrote knellgrave-ingame-${tag}.png`); });

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate(() => { window.__dd.player.dist = 2500; });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());

  // (1) THE ENTRANCE APEX — the flythrough's loom beat (rel eases 20→13 at the apex;
  // grab when it closes under ~16 with the bell overhead).
  await page.waitForFunction(() => window.__dd.bossState().phase === 'flythrough', { timeout: 90000 }).catch(() => {});
  const gotApex = await page.waitForFunction(() => {
    const s = window.__dd.bossState();
    return s.phase === 'flythrough' && s.poseRel < 16;
  }, { timeout: 90000 }).then(() => true).catch(() => false);
  if (gotApex) await shot('entrance-apex');

  // (2) THE OVERHEAD LOOM at station.
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 120000 });
  await page.waitForFunction(() => window.__dd.bossState().poseY > 17, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await shot('loom');

  // (3) a toll mid-charge (the widened swing + the rain).
  await page.waitForFunction(() => window.__dd.bossState().charging, { timeout: 60000 }).catch(() => {});
  await shot('toll');

  // (4) THE LAST TOLL — chip through the phases (bursting each floor shield with the
  // synchronous Surge seam) until P4 arms its dread setpiece, then catch the bell
  // riding DIRECTLY OVERHEAD (rel < 8) mid-reveal.
  for (let i = 0; i < 160; i++) {
    const st = await page.evaluate(() => {
      const s = window.__dd.bossState();
      if (s.shielded) window.__dd.bossStrikeSurge();
      else window.__dd.emit('bossDamage', { amount: 16, kind: 'debug' });
      return window.__dd.bossState();
    });
    if (st.phaseIdx >= 3) break;
    await page.waitForTimeout(100);
  }
  const gotReveal = await page.waitForFunction(() => {
    const s = window.__dd.bossState();
    return s.setpiece && s.poseRel < 8;
  }, { timeout: 90000 }).then(() => true).catch(() => false);
  if (gotReveal) {
    await page.waitForTimeout(800);   // ride into the dread peak (sin(kπ) high)
    await shot('reveal');
  } else {
    console.log('reveal window not reached (setpiece/poseRel) — check card/setpiece wiring');
  }

  await done();
  process.exit(0);
} catch (e) {
  await done().catch(() => {});
  console.error('knellshot error:', e && e.stack || e);
  process.exit(1);
}
