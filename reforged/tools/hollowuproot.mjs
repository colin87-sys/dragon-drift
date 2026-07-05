// tools/hollowuproot.mjs — HOLLOWGATE's THE DROWNED DOOR entrance, in-game.
//
//   node tools/hollowuproot.mjs [roundTag]
//
// Boots the real engine at the dark home biome and captures the reworked
// entrance as a strip: the drowned seed on the horizon → the warn banner →
// the dormant arch LOOMING closer (dist-driven, half-sunk on the sea) → the
// UPROOT rise-from-water (pillars clearing the surface, panes igniting) → the
// fight. The entrance is MOTION — this is the honest read the owner judges.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('hollowgate');
const DIST = 8000;   // Astral Shallows — the DARK sky + water the drowned arch needs
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const written = [];

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(150000);

async function shoot(name) {
  const path = `${OUT}hollowgate-uproot-${name}-${round}.png`;
  fs.writeFileSync(path, await page.screenshot());
  written.push(path);
  const st = await page.evaluate(() => window.__dd.bossState());
  console.log('wrote', name, `(phase ${st.phase}, rel ${st.poseRel?.toFixed?.(0)}, y ${st.poseY?.toFixed?.(1)})`);
}

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  // Park ~600m short of the (debug-pinned) mark: the DROWNED SEED should sit on
  // the horizon, half-sunk.
  await page.evaluate((d) => { window.__dd.player.dist = d - 600; }, DIST);
  await page.waitForTimeout(2200);
  await shoot('seed');
  // Cross the mark → warn banner (the boss takes the seed's spot, dormant).
  await page.evaluate((d) => { window.__dd.player.dist = d - 4; }, DIST);
  await page.waitForFunction(() => window.__dd.bossState().phase === 'warn', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shoot('warn');
  // The LOOM: banner cleared, dormant arch getting closer (dist-driven).
  await page.waitForFunction(() => window.__dd.bossState().phase === 'loom', { timeout: 60000 });
  await page.waitForTimeout(500);
  await shoot('loom-far');
  // Sample the UPROOT rise (the model's setEntrance ramp lights the panes as it
  // clears the water). Grab a few frames across the rise.
  await page.waitForFunction(() => window.__dd.bossState().phase === 'uproot', { timeout: 60000 });
  await shoot('uproot-a');
  await page.waitForTimeout(500);
  await shoot('uproot-b');
  await page.waitForTimeout(600);
  await shoot('uproot-c');
  // The fight opens (risen, panes lit, title card).
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 60000 });
  await page.waitForTimeout(900);
  await shoot('fight');
  await done();
  console.log(`\n${written.length} entrance frames written.`);
} catch (e) {
  await done().catch(() => {});
  console.error('hollowuproot error:', e && e.stack || e);
  process.exit(3);
}
