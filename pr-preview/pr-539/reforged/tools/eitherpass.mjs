// tools/eitherpass.mjs — the EITHERWING close-pass "money frame" (§5d r9 PRESENCE).
//
//   node tools/eitherpass.mjs [roundTag]
//
// Boots the real engine at the SUNSET biome (Amber Wastes, dist ~2250), forces
// EITHERWING, spawns it, then PINS the close-pass figureEight setpiece at a few
// path parameters where the near lobe is diving past the camera — and grabs a
// FULL-FRAME screenshot at each (a twin sweeping the flank, tail crossing the
// screen). Unlike bosscrop (front-on zoomed crops), this keeps the whole frame:
// the pass is a presence beat, judged at the real encounter geometry.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r13';
const bossIdx = BOSS_ORDER.indexOf('eitherwing');
const DIST = 2250;   // Amber Wastes (biome index 1) — the warm sunset-gold sky
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

// Path parameters over the first pass where the near lobe is inbound/closest.
// rel ≈ 26 − near·32 on the plateau; these bracket the big-and-passing window.
const KS = [0.11, 0.14, 0.17, 0.21, 0.25];

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
  await page.waitForTimeout(3200);   // let the reveal title card fade
  const written = [];
  for (const k of KS) {
    await page.evaluate((kk) => window.__dd.bossPinSetpiece({ id: 'figureEight', k: kk, moveGroup: true }), k);
    await page.waitForTimeout(900);   // let the pose ease in + tails settle to the pinned pose
    const relNow = await page.evaluate(() => window.__dd.bossState().poseRel);
    const path = `${OUT}eitherwing-pass-k${String(k).replace('.', '')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    written.push(`${path} (rel ${relNow?.toFixed?.(1)})`);
    console.log('wrote', written[written.length - 1]);
  }
  await page.evaluate(() => window.__dd.bossPinSetpiece(null));
  await done();
  console.log(`\n${written.length} pass frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('eitherpass error:', e && e.stack || e);
  process.exit(3);
}
