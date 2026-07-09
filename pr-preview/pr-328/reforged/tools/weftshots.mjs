// tools/weftshots.mjs — WEFTWITCH CP2 integration stills (§7 Fable integration gate):
// the Mended Banner entrance (HUD-sew + pinned banner + thread-descent), the clean
// chrome at fight start (the render-order LAW's visual proof), the laserLance beam,
// the thread-cut + mote-harvest bloom, and the gap-restitch tear.
//   node tools/weftshots.mjs [roundTag]
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'r1';
const bossIdx = BOSS_ORDER.indexOf('weftwitch');
const DIST = 8000;   // Astral (her home sky)
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(290000);
const shot = async (tag) => {
  const path = `${OUT}weftwitch-${tag}-${round}.png`;
  fs.writeFileSync(path, await page.screenshot());
  console.log('wrote', path);
};
try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());

  // 1. THE WARN: the banner is pinned half-deployed (the sew now CASTS later, at the lash).
  await page.waitForFunction(() => window.__dd.bossState().phase === 'warn', { timeout: 30000 });
  await page.waitForTimeout(700);
  await shot('sew-warn');

  // 2. THE LASH: wait for the sew to CAST from her hands (the #hud-sew fills with threads
  // + the banner name gets .stitched) — that's the u≈0.45 lash beat mid-descent.
  await page.waitForFunction(() => {
    const svg = document.querySelector('#hud-sew');
    const warn = document.querySelector('#boss-warn');
    return svg && svg.classList.contains('on') && svg.children.length > 0;
  }, { timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(350);   // let the threads draw outward + the name stitch land
  await shot('sew-descend');

  // 3. FIGHT START: the banner tore free, the sew is gone — the chrome is CLEAN
  // before the first bullet exists (the render-order LAW, photographed).
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForTimeout(900);
  await shot('law-fightstart');

  // 4. THE LASERLANCE: the aimed release's HDR lance from the loom-heart. The
  // flash lives ~0.3s of GAME time and headless frames are long — re-fire across
  // the capture window so the screenshot is guaranteed a lit frame.
  await page.evaluate(() => { window.__wsBeam = setInterval(() => window.__dd.bossFireNow('aimed'), 110); });
  await page.waitForTimeout(500);
  await shot('beam');
  await page.evaluate(() => clearInterval(window.__wsBeam));

  // 5. THE THREAD-CUT + BLOOM: hands thrown apart, the falling harvest motes.
  await page.evaluate(() => window.__dd.bossThreadCut());
  await page.waitForTimeout(500);
  await shot('cut-bloom');

  // 6. THE GAP-RESTITCH: a torn web sector mid-mend.
  await page.evaluate(() => window.__dd.bossRestitch());
  await page.waitForTimeout(650);
  await shot('restitch');

  await done();
  console.log('\nweftwitch CP2 integration frames written.');
} catch (e) { await done().catch(() => {}); console.error('weftshots error:', e && e.stack || e); process.exit(3); }
