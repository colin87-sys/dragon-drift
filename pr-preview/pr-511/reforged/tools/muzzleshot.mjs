// tools/muzzleshot.mjs — PR1 body-origin + spawn-in verification (L148).
//
//   node tools/muzzleshot.mjs [roundTag]
//
// Boots the real engine at the ASTRAL SHALLOWS, forces MARROWCOIL, waits for the
// fight, then fires a live 'aimed' volley (window.__dd.bossFireNow) and grabs a
// BURST of rail-view frames across the first ~0.2s so we can see (a) the bullets
// stream FROM the skull rather than lane centre, and (b) they GROW IN from a point
// instead of popping at full size. Frames are ~40ms apart to straddle the 0.12s ramp.
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

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForFunction(() => window.__dd.bossState().poseY > 10, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);

  // Fire one aimed volley and grab a burst straddling the 0.12s spawn ramp.
  const written = [];
  await page.evaluate(() => window.__dd.bossFireNow('aimed'));
  const FRAMES = [0, 40, 90, 160, 260, 420];   // ms after the volley
  let prev = 0;
  for (const ms of FRAMES) {
    await page.waitForTimeout(ms - prev); prev = ms;
    const path = `${OUT}marrowcoil-muzzle-t${String(ms).padStart(3, '0')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    written.push(path);
    console.log('wrote', path);
  }
  await done();
  console.log(`\n${written.length} muzzle frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('muzzleshot error:', e && e.stack || e);
  process.exit(3);
}
