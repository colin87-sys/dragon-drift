// tools/eitherhandoff.mjs — capture the LIVE entrance→fight HANDOFF as a frame sequence
// (NOT pinned): boot, spawn EITHERWING, then grab a frame every INTERVAL ms of wall-clock
// from mid-entrance through a couple seconds into the fight, tagging each with the boss phase.
// This is the only way to SEE the handoff snaps (pinned stills can't). Review the numbered PNGs.
//   node tools/eitherhandoff.mjs [roundTag]
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import fs from 'node:fs';
import { boot } from '../tests/browser.mjs';

const { BOSS_ORDER } = await import('../js/bossDefs.js');
const round = process.argv[2] || 'h1';
const bossIdx = BOSS_ORDER.indexOf('eitherwing');
const DIST = 2250;   // Amber Wastes (sunset)
const OUT = new URL('../../reforged-captures/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

const INTERVAL = 450;   // wall-clock ms between grabs (headless + bullet-time → dense coverage of the transition)
const MAX = 40;         // safety cap
const FIGHT_TAIL = 10;  // keep grabbing this many frames after 'fight' first appears, then stop

const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${DIST}`,
  viewport: { width: 720, height: 1280 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 4, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});
page.setDefaultTimeout(290000);
try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, DIST);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());
  // Wait until the scripted entrance is actually running (flythrough), so we open on the reveal.
  await page.waitForFunction(() => window.__dd.bossState().phase === 'flythrough', { timeout: 60000 });
  let i = 0, fightSeen = 0;
  while (i < MAX) {
    const phase = await page.evaluate(() => window.__dd.bossState().phase);
    const tag = `${String(i).padStart(2, '0')}-${phase}`;
    const path = `${OUT}eitherwing-handoff-${tag}-${round}.png`;
    fs.writeFileSync(path, await page.screenshot());
    console.log('wrote', tag);
    if (phase === 'fight') { fightSeen++; if (fightSeen >= FIGHT_TAIL) break; }
    i++;
    await page.waitForTimeout(INTERVAL);
  }
  await done();
  console.log('\nhandoff sequence written.');
} catch (e) { await done().catch(() => {}); console.error('eitherhandoff error:', e && e.stack || e); process.exit(3); }
