// tools/marrowpass.mjs — the MARROWCOIL rib FLY-THROUGH verification (L141).
//
//   node tools/marrowpass.mjs [roundTag]
//
// Boots the real engine at the ASTRAL SHALLOWS, forces MARROWCOIL, spawns it,
// then PINS the ribThread setpiece across the pass (rel sweeps 7 → −6) and grabs
// a FULL-FRAME rail-view screenshot at each k — so we can see whether the rail
// actually threads the ribcage aperture (ribs sweeping past on both flanks +
// overhead) instead of the cage merely looming and trailing away. rel 0 ≈ k 0.52
// is the thread instant.
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

// L155 — bracket the six beats of the full maneuver: loom / thread (dive) /
// back-turned re-approach / accelerate past / bank in / restore.
const KS = [0.12, 0.28, 0.36, 0.48, 0.66, 0.84, 0.96];

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
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
  await page.waitForTimeout(3200);
  const written = [];
  for (const k of KS) {
    await page.evaluate((kk) => window.__dd.bossPinSetpiece({ id: 'ribThread', k: kk, moveGroup: true }), k);
    await page.waitForTimeout(900);
    const relNow = await page.evaluate(() => window.__dd.bossState().poseRel);
    const path = `${OUT}marrowcoil-pass-k${String(k).replace('.', '')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    written.push(`${path} (rel ${relNow?.toFixed?.(1)})`);
    console.log('wrote', written[written.length - 1]);
  }
  await page.evaluate(() => window.__dd.bossPinSetpiece(null));
  await done();
  console.log(`\n${written.length} pass frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('marrowpass error:', e && e.stack || e);
  process.exit(3);
}
