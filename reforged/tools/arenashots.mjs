// ARENA montage (THE UNMASKED × THE HOLLOW BEHIND THE SKY, PR-A). Boots the real game, forces the
// finale, and captures the S1 ordinary sky → the void, from multiple biome sources — the Fable Gate-2
// judgment frames ("another dimension, NOT dimmer") + the owner's preview read. The Astral source is
// the worst case (stars:1 makes starMix a no-op there, so the read must be carried by sun-gone +
// fog-swallow + the mirror + the prop bands VANISHING). Correctness is gated by tests/unmaskedarena.mjs;
// this is the VISUAL gate.
//   node tools/arenashots.mjs   →   /tmp/arena-<source>-<frame>.png
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execSync('npm root -g', { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
}

const { chromium } = loadPlaywright();
const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERROR', String(e)));
await page.addInitScript(`localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`);
await page.goto(srv.url + '/?debug');
await page.waitForFunction(() => !!window.__dd, { timeout: 15000 });
await page.evaluate(() => window.__dd.toHub && window.__dd.toHub());
await page.waitForTimeout(600);
await page.click('#btn-start');
await page.waitForTimeout(600);

// Sources by starting distance: Sanctuary (biome 0) vs Astral (the worst case). biomeLength gates the
// biome; we set the boss's first-encounter distance so the fight lands in each. (A rough placement — the
// owner judges the read; the mandatory row is Astral.)
const SOURCES = [{ name: 'sanctuary', firstAt: 2500 }, { name: 'astral', firstAt: 2500 + 4 * 3200 }];

for (const src of SOURCES) {
  // S1 — the ordinary sky (the mask, worn).
  await page.evaluate((fa) => { window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(1); window.__dd.spawnBoss(); }, src.firstAt);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/arena-${src.name}-1-mask.png` });

  // The void — pin S2, snap the beat (skip), settle.
  await page.evaluate(() => window.__dd.bossReset());
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss(); });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(600);
  await page.evaluate(async () => { window.__dd.input.surgeTap = true; for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 50)); if (window.__dd.bossArenaState().voidSky) break; } });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/arena-${src.name}-2-hollow.png` });
  console.log(`captured ${src.name}: mask + hollow`);
  await page.evaluate(() => window.__dd.bossReset());
  await page.waitForTimeout(300);
}

await browser.close();
srv.close();
console.log('arena montage → /tmp/arena-*.png');
