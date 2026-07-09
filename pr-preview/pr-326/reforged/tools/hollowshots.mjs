// tools/hollowshots.mjs — HOLLOWGATE CP2 in-game integration captures.
//
//   node tools/hollowshots.mjs [roundTag]
//
// Boots the real engine and grabs the frames the §7c INTEGRATION pass judges
// (design passed in the studio; these judge survival in the world):
//   1. the fog-exempt HORIZON SEED on the dark home sky (a biome out),
//   2. the Vigil Lights entrance mid-ignition (live flythrough frame),
//   3. fight idle + a live aimed volley at the dark home biome (bullet contrast
//      over the pale body),
//   4. the shielded read,
//   5. PANE BREAK: two panes cracked live, then a radial volley (the deleted
//      arms must visibly be missing),
//   6. fight idle at the warm SUNSET biome (pale-on-warm, the L140 trap).
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('hollowgate');
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const written = [];

async function shoot(page, name) {
  const path = `${OUT}hollowgate-game-${name}-${round}.png`;
  fs.writeFileSync(path, await page.screenshot());
  written.push(path);
  console.log('wrote', path);
}

async function session(dist, fn) {
  const { page, done } = await boot({
    query: `?debug&bossIdx=${bossIdx}&boss=${dist}`,
    viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
  });
  page.setDefaultTimeout(150000);
  try {
    await page.click('#btn-start').catch(() => {});
    await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
    await fn(page, dist);
    await done();
  } catch (e) {
    await done().catch(() => {});
    throw e;
  }
}

async function skipToFight(page) {
  await page.waitForFunction(() => window.__dd.bossState().phase !== 'idle' && window.__dd.bossState().phase !== 'warn', { timeout: 60000 });
  for (let i = 0; i < 40 && (await page.evaluate(() => window.__dd.bossState().phase)) === 'flythrough'; i++) {
    await page.evaluate(() => { window.__dd.input.surgeTap = true; });
    await page.waitForTimeout(400);
  }
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForTimeout(2500);
}

// ---- DARK HOME BIOME (Astral Shallows ~8000m): seed → entrance → fight ----
await session(8000, async (page, dist) => {
  // 1. HORIZON SEED: park ~700m short of the (debug-pinned) encounter mark —
  //    the dead black arch should already sit on the horizon, fog-exempt.
  await page.evaluate((d) => { window.__dd.player.dist = d - 700; }, dist);
  await page.waitForTimeout(2500);
  await shoot(page, 'seed-dark');
  // 2. Cross the mark → warn → the Vigil Lights flythrough; catch mid-ignition.
  await page.evaluate((d) => { window.__dd.player.dist = d - 2; }, dist);
  await page.waitForFunction(() => window.__dd.bossState().phase === 'flythrough', { timeout: 90000 });
  await page.waitForTimeout(2600);   // a few (throttled) beats in — panes igniting
  await shoot(page, 'entrance-ignition');
  // 3. Land the fight (skip the rest), then a live volley.
  await skipToFight(page);
  await shoot(page, 'fight-idle-dark');
  await page.evaluate(() => window.__dd.bossFireNow('aimed'));
  await page.waitForTimeout(700);
  await shoot(page, 'volley-dark');
  // 5. PANE BREAK live: crack two panes, then a radial volley — two arms gone.
  await page.evaluate(() => {
    const st = window.__dd.bossState();
    window.__dd.bossCrackPane?.(3); window.__dd.bossCrackPane?.(4);
    return st;
  });
  await page.evaluate(() => window.__dd.bossFireNow('spiral'));
  await page.waitForTimeout(800);
  await shoot(page, 'panebreak-radial');
});

// ---- WARM SUNSET BIOME (Amber Wastes ~2500m): pale-on-warm presence ----
await session(2500, async (page, dist) => {
  await page.evaluate((d) => { window.__dd.player.dist = d; }, dist);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__dd.spawnBoss());   // direct spawn (a canyon can block the natural mark here)
  await skipToFight(page);
  await shoot(page, 'fight-idle-sunset');
  await page.evaluate(() => window.__dd.bossFireNow('fan'));
  await page.waitForTimeout(700);
  await shoot(page, 'volley-sunset');
});

console.log(`\n${written.length} integration frames written.`);
