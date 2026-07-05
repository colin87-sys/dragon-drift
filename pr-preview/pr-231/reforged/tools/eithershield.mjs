// tools/eithershield.mjs — full-frame SHIELDED capture at the sunset biome, to eyeball
// the r9 shield-bubble proportion + the decluttered bottom HUD (owner note).
//   node tools/eithershield.mjs [roundTag]
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
  await page.waitForTimeout(3200);
  // Chip the boss to the first phase floor so the shield raises (the SHIELDED note fires).
  let sh = false;
  for (let i = 0; i < 40 && !sh; i++) {
    sh = await page.evaluate(() => { window.__dd.emit('bossDamage', { amount: 1e6, kind: 'debug' }); return window.__dd.bossState().shielded; });
    if (!sh) await page.waitForTimeout(120);
  }
  await page.waitForTimeout(500);   // catch the note WHILE it's up (fires 3.4s) + the card
  const path = `${OUT}eitherwing-shielded-ingame-${round}.png`;
  fs.writeFileSync(path, await page.screenshot());
  console.log('wrote', path, 'shielded=', sh);
  await done();
} catch (e) { await done().catch(() => {}); console.error('eithershield error:', e && e.stack || e); process.exit(3); }
