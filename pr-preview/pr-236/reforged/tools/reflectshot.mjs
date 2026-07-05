// tools/reflectshot.mjs — PR3 reflect HIT-LOCATION verification (§5f, L157).
//
//   node tools/reflectshot.mjs [roundTag]
//
// Boots the real engine at the ASTRAL SHALLOWS, forces MARROWCOIL, waits for the
// fight, then stages a reflect at three screen angles (window.__dd.bossReflectHit):
// RIGHT (dx>0 → right rib), UP (+dy → skull), LOW (−dy → tail). Each parried amber
// flies to and SPARKS ON the body part its reflect angle picked. We grab a burst of
// rail-view frames straddling the ~0.5s the reflected bullet takes to reach the boss,
// so the spark landing on skull vs rib vs tail is visible (the parry no longer
// vanishes into one centre hitbox).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('marrowcoil');
const DIST = 8000;   // Astral Shallows — the dark sky the pale bone pairs against
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(150000);

// dx/dy are player-relative screen offsets; the reflect angle → part mapping is
// up→skull, right→right rib, low→tail (see boss.js partForAngle / MARROWCOIL def).
const ANGLES = [
  { tag: 'rib-right', dx: 2.4, dy: 0 },
  { tag: 'skull-up', dx: 0.2, dy: 2.4 },
  { tag: 'tail-low', dx: 0.2, dy: -2.4 },
];

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForFunction(() => window.__dd.bossState().poseY > 10, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const written = [];
  for (const a of ANGLES) {
    // Stage the reflect; the amber closes ~0.5s to the boss then sparks on the part.
    await page.evaluate(({ dx, dy }) => window.__dd.bossReflectHit(dx, dy), a);
    const FRAMES = [80, 260, 440, 560];   // ms after the parry — bracket the arrival spark
    let prev = 0;
    for (const ms of FRAMES) {
      await page.waitForTimeout(ms - prev); prev = ms;
      const path = `${OUT}marrowcoil-reflect-${a.tag}-t${String(ms).padStart(3, '0')}-${round}.png`;
      fs.writeFileSync(path, await page.screenshot());
      written.push(path);
      console.log('wrote', path);
    }
    await page.waitForTimeout(700);   // let the pool clear before the next angle
  }
  await done();
  console.log(`\n${written.length} reflect frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('reflectshot error:', e && e.stack || e);
  process.exit(3);
}
