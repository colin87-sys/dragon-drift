// ARENA montage (THE UNMASKED × THE HOLLOW BEHIND THE SKY / THE UNVEILED HEAVEN, PR-A+B). Boots the real
// game, forces the finale, and captures the full arc from multiple biome sources — the S1 ordinary sky →
// the S2 void → the S3 heaven — the Fable Gate-2 judgment frames + the owner's preview read. The Astral
// source is the void worst case (stars:1 makes starMix a no-op there, so the void read must be carried by
// sun-gone + fog-swallow + the mirror + the prop bands VANISHING); the AMBER WASTES source is the heaven
// worst case (the game's own bright-gold desert biome — the heaven must read as a DISTINCT holy gold, not
// "the wastes with rays"). The heaven is a TOTAL value-space override (biome-independent at mix 2), so its
// frame is near-identical across sources; we shoot it per-source anyway so the montage shows the same
// source transformed end-to-end. Correctness is gated by tests/unmaskedarena.mjs; this is the VISUAL gate.
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

// Sources by biome distance (biomeLength 1500, 6 biomes): Sunken Sanctuary (biome 0, mid ~750) vs
// ASTRAL SHALLOWS (biome 5, mid ~8250 — the MANDATORY worst case: stars:1 makes starMix a no-op there,
// so the void read must be carried by sun-gone + fog-swallow + the mirror + the props VANISHING).
// `__dd.player.dist` sets the biome the fight renders against (the cruise advances it only ~130m before
// the capture — same biome). §CP2 H1: the earlier tool bound the distance and never used it, so every
// frame was Sanctuary — the owner would have judged the worst case on the wrong biome.
const SOURCES = [{ name: 'sanctuary', dist: 750 }, { name: 'amber', dist: 2250 }, { name: 'astral', dist: 8250 }];

for (const src of SOURCES) {
  // S1 — the ordinary sky (the mask, worn).
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(1); window.__dd.spawnBoss(); }, src.dist);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(1400);
  await page.evaluate((d) => { window.__dd.player.dist = d; }, src.dist);   // re-pin after the approach cruise so the capture biome is exact
  await page.waitForTimeout(300);
  await page.screenshot({ path: `/tmp/arena-${src.name}-1-mask.png` });

  // The void — pin S2, snap the beat (skip), settle. Wait out the reveal banner (~2.8s) so the
  // judgment frame isn't covered by "THE UNMASKED / A RELIC ANSWERS" text (§CP2 H1 secondary).
  await page.evaluate(() => window.__dd.bossReset());
  await page.waitForTimeout(300);
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss(); }, src.dist);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(600);
  await page.evaluate(async () => { window.__dd.input.surgeTap = true; for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 50)); if (window.__dd.bossArenaState().voidSky) break; } window.__dd.input.surgeTap = false; });
  await page.waitForTimeout(5200);   // out-wait the reveal + the late "A RELIC ANSWERS" note (the surge-skip brands a relic) so the judgment frame is clean
  await page.evaluate((d) => { window.__dd.player.dist = d; }, src.dist);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/tmp/arena-${src.name}-2-hollow.png` });

  // The heaven — pin S3, snap the beat (skip), settle. Poll on the DERIVED heaven flags (mix 2 + rays
  // swelled) like the test's heaven block, not mix alone (a phase-2 beat mid-crawl reads 1+ss01(0)=1.0).
  // Out-wait the reveal banner so the "lit not blinding" judgment frame is clean.
  await page.evaluate(() => window.__dd.bossReset());
  await page.waitForTimeout(300);
  await page.evaluate((d) => { window.__dd.player.dist = d; window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(3); window.__dd.spawnBoss(); }, src.dist);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__dd.bossForceFight());
  await page.waitForTimeout(600);
  await page.evaluate(async () => { window.__dd.input.surgeTap = true; for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 50)); const s = window.__dd.bossArenaState(); if (s.mix >= 1.99 && s.heavenRays > 0.9) break; } window.__dd.input.surgeTap = false; });
  await page.waitForTimeout(5200);
  await page.evaluate((d) => { window.__dd.player.dist = d; }, src.dist);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/tmp/arena-${src.name}-3-heaven.png` });
  console.log(`captured ${src.name} (dist ${src.dist}): mask + hollow + heaven`);
  await page.evaluate(() => window.__dd.bossReset());
  await page.waitForTimeout(300);
}

await browser.close();
srv.close();
console.log('arena montage → /tmp/arena-*.png');
