// tools/hollowpass.mjs — the HOLLOWGATE arch FLY-THROUGH verification (L141/L147).
//
//   node tools/hollowpass.mjs [roundTag]
//
// Boots the real engine at HOLLOWGATE's dark home biome, forces the boss, then
// PINS the archPass setpiece across the pass (rel sweeps 8 → −8) and grabs a
// FULL-FRAME rail-view screenshot at each k — the only honest read of a
// through-space beat (L147: measure from the rail camera, not the orbit viewer).
// The gate must SURROUND the rail at the pass instant: pillars flanking on both
// sides, the lintel + window overhead, the corridor visible THROUGH the gap.
// rel 0 ≈ k 0.49 is the threshold instant.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('hollowgate');
const DIST = 8000;   // Astral Shallows — the DARK sky the pale arch pairs against (§5h home-biome law)
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const KS = [0.30, 0.40, 0.46, 0.49, 0.54, 0.62];

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
  // Skip the Vigil Lights entrance headless (the rAF-throttled flythrough +
  // its dilate window stalls the fight wait otherwise): tap-to-skip each frame
  // window until the driver lands at station.
  await page.waitForFunction(() => window.__dd.bossState().phase !== 'idle' && window.__dd.bossState().phase !== 'warn', { timeout: 60000 });
  for (let i = 0; i < 40 && (await page.evaluate(() => window.__dd.bossState().phase)) === 'flythrough'; i++) {
    await page.evaluate(() => { window.__dd.input.surgeTap = true; });
    await page.waitForTimeout(400);
  }
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForTimeout(3200);
  const written = [];
  for (const k of KS) {
    await page.evaluate((kk) => window.__dd.bossPinSetpiece({ id: 'archPass', k: kk, moveGroup: true }), k);
    await page.waitForTimeout(900);
    const relNow = await page.evaluate(() => window.__dd.bossState().poseRel);
    const path = `${OUT}hollowgate-pass-k${String(k).replace('.', '')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    written.push(`${path} (rel ${relNow?.toFixed?.(1)})`);
    console.log('wrote', written[written.length - 1]);
  }
  await page.evaluate(() => window.__dd.bossPinSetpiece(null));
  await done();
  console.log(`\n${written.length} pass frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('hollowpass error:', e && e.stack || e);
  process.exit(3);
}
