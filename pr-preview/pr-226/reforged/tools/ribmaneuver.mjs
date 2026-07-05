// tools/ribmaneuver.mjs — the MARROWCOIL fly-through MANEUVER, live (L151).
//
//   node tools/ribmaneuver.mjs [roundTag]
//
// marrowpass.mjs pins static poses (good for the back-turn / bank silhouette). This one
// runs the beat LIVE via window.__dd.bossRunSetpiece('ribThread') and grabs a time burst
// across the ~8s maneuver, so the RIB BULLETS (slow amber, converging from inside the ribs)
// and the motion are both visible. Frame times target the two close passes where the ribs
// surround the rail (thread ~1.6–2.4s, overtake ~4.8–5.4s) plus the back-turn and bank.
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
  viewport: { width: 600, height: 1066 }, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(150000);

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForFunction(() => window.__dd.bossState().poseY > 10, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);

  await page.evaluate(() => window.__dd.bossRunSetpiece('ribThread'));
  // L152 cinematic beats over the 10s maneuver: loom / thread / off-screen gap /
  // rear-look reveal (mouth open, from-behind shots leaving) / bank-away+camera-return /
  // bullets closing from behind-right / side-lane head-turn shots / restore.
  const MS = [500, 1800, 2600, 3400, 4200, 5400, 6400, 7600, 8400, 9200];   // times after arming
  const written = [];
  let prev = 0;
  for (const ms of MS) {
    await page.waitForTimeout(ms - prev); prev = ms;
    const st = await page.evaluate(() => { const s = window.__dd.bossState(); return { rel: s.poseRel, x: s.poseX }; });
    const path = `${OUT}marrowcoil-maneuver-t${String(ms).padStart(4, '0')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    written.push(`${path} (rel ${st.rel?.toFixed?.(1)}, x ${st.x?.toFixed?.(1)})`);
    console.log('wrote', written[written.length - 1]);
  }
  await done();
  console.log(`\n${written.length} maneuver frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('ribmaneuver error:', e && e.stack || e);
  process.exit(3);
}
