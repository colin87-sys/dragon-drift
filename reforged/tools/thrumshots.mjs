// tools/thrumshots.mjs — THRUMSWARM (slot 7) CP2 in-game integration captures.
//
//   node tools/thrumshots.mjs [roundTag]
//
// Boots the real engine and grabs the frames the §7c INTEGRATION pass judges (design
// passed in the studio; these judge survival in the world):
//   1. fight idle/condensed + a live volley at the BRIGHT home biome (the black motes
//      read + bullet contrast over the pale sky),
//   2. the SCATTERED tell (the swarm dispersed = invulnerable),
//   3. the YOUR-DRAGON meme frame pinned live (the copy reads over the real sky),
//   4. the shielded ring read,
//   5. fight idle at the warm SUNSET biome (the §7c/L140 warm-sky trap).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('thrumswarm');
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const written = [];

async function shoot(page, name) {
  const path = `${OUT}thrumswarm-game-${name}-${round}.png`;
  fs.writeFileSync(path, await page.screenshot());
  written.push(path);
  console.log('wrote', path);
}

async function session(dist, fn) {
  const { page, done } = await boot({
    query: `?debug&bossIdx=${bossIdx}&boss=${dist}`,
    viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 8 }, flags: { seenIntro: true } }))`,
  });
  page.setDefaultTimeout(150000);
  try {
    await page.click('#btn-start').catch(() => {});
    await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
    await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d - 5); }, dist);
    await fn(page, dist);
    await done();
  } catch (e) {
    await done().catch(() => {});
    console.warn('  ! session error:', e.message);
  }
}

async function skipToFight(page) {
  // Warn + the deep-dilate entrance crawl under headless rAF throttle; tap surgeTap every
  // poll (a no-op in warn, the skip in flythrough) and poll patiently until fight.
  for (let i = 0; i < 240; i++) {
    const ph = await page.evaluate(() => { try { window.__dd.input.surgeTap = true; return window.__dd.bossState().phase; } catch { return 'idle'; } });
    if (ph === 'fight') break;
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 30000 });
  await page.waitForTimeout(1500);
}

// HOME — the bright biome (FROZEN REACH ~3800; pale sky so the black motes read).
await session(3800, async (page) => {
  await skipToFight(page);
  await page.evaluate(() => window.__dd.bossFireNow('spiral'));   // condense into a ring + fire
  await page.waitForTimeout(700);
  await shoot(page, 'home-fight');
  // the meme frame: pin Your Own Wings mid-path (the model forms the dragon by id)
  await page.evaluate(() => window.__dd.bossPinSetpiece({ id: 'yourWings', k: 0.5, moveGroup: true }));
  await page.waitForTimeout(700);
  await shoot(page, 'home-dragon');
  await page.evaluate(() => window.__dd.bossPinSetpiece(null));
  // let the volley lapse → the swarm scatters (the invulnerable tell)
  await page.waitForTimeout(2200);
  await shoot(page, 'home-scatter');
});

// SUNSET — the warm biome (AMBER WASTES ~2500).
await session(2500, async (page) => {
  await skipToFight(page);
  await page.evaluate(() => window.__dd.bossFireNow('spiral'));
  await page.waitForTimeout(700);
  await shoot(page, 'sunset-fight');
  await page.evaluate(() => window.__dd.bossPinSetpiece({ id: 'yourWings', k: 0.5, moveGroup: true }));
  await page.waitForTimeout(700);
  await shoot(page, 'sunset-dragon');
  await page.evaluate(() => window.__dd.bossPinSetpiece(null));
});

console.log(`\n${written.length} images written.`);
process.exit(0);
