// tools/eitherentrance.mjs — full-frame stills of the BATON CROSS entrance (§5j slot 5),
// pinned at a few clock values so the choreography is capturable headless.
//   node tools/eitherentrance.mjs [roundTag]
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r13';
const bossIdx = BOSS_ORDER.indexOf('eitherwing');
const DIST = 2250;   // Amber Wastes (sunset)
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const US = [0.12, 0.30, 0.50, 0.64, 0.82, 0.95];   // A rises · A revealed · eye crossing · B revealed · scissor · settle

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(290000);   // headless runs ~0.1x real + the entrance dwells in bullet-time; reaching 'fight' is slow
try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForTimeout(1200);
  for (const u of US) {
    await page.evaluate((uu) => window.__dd.bossPinEntrance(uu), u);
    await page.waitForTimeout(700);   // let the pinned pose apply + the model settle
    const path = `${OUT}eitherwing-entrance-u${String(u).replace('.', '')}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    console.log('wrote', path);
  }
  await page.evaluate(() => window.__dd.bossPinEntrance(null));
  await done();
  console.log('\nbaton-cross frames written.');
} catch (e) { await done().catch(() => {}); console.error('eitherentrance error:', e && e.stack || e); process.exit(3); }
