// Boss-fight capture tool: boots the real engine, drops into a fight at a chosen
// biome distance, and screenshots the live canvas mid-volley — a supervisor/PR-
// preview aid for judging bullet visibility (render-order law + shield rework),
// NOT a test (no assertions, not wired into run-all).
//
//   node tools/bossshot.mjs
//     → /tmp/bossshot-amber.png       (Voidmaw, AMBER WASTES ~2500m)
//     → /tmp/bossshot-emberfall.png   (Stormrend, EMBERFALL CALDERA ~5200m)
//     → /tmp/bossshot-astral.png      (Voidmaw, ASTRAL SHALLOWS ~8000m)
//     → /tmp/bossshot-amber-shielded.png (Voidmaw, phase-1 shield up)
//
// Positioning: the existing `?boss=<metres>` debug seam (main.js → boss.js
// setBossDebugFirstAt) already does what an increment-1 `?bossAt=` would have
// added, so it's reused as-is rather than duplicating it. Flying there in real
// time would take minutes (and headless rAF is throttled — see LEAPFROG L105),
// so player.dist is poked directly through the already-exposed window.__dd.player
// handle, the same debug-state-poke idiom tests/bossboot.mjs uses for feverActive
// — no new gameplay cheat, just the harness driving exposed state.
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 1280, height: 720 };
const SCENES = [
  { name: 'amber', dist: 2500, bossIdx: 0 },       // Voidmaw · AMBER WASTES
  { name: 'emberfall', dist: 5200, bossIdx: 1 },   // Stormrend · EMBERFALL CALDERA
  { name: 'astral', dist: 8000, bossIdx: 0 },      // Voidmaw · ASTRAL SHALLOWS
];
const SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;

for (const scene of SCENES) {
  console.log(`\n=== ${scene.name} (bossIdx=${scene.bossIdx}, ~${scene.dist}m) ===`);
  const { page, done } = await boot({
    query: `?debug&bossIdx=${scene.bossIdx}&boss=${scene.dist}`,
    viewport: VIEW, deviceScaleFactor: 1,
    initScript: SAVE,
  });

  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 }).catch(() => {});

  // Jump straight to the target biome distance (a few metres shy of the
  // scheduled encounter so the natural `dist >= nextBossDist` trigger still
  // fires the fight, matching the real gameplay path).
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d - 5); }, scene.dist);

  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 30000 })
    .catch(() => console.warn(`  ! ${scene.name}: fight phase not confirmed in time — capturing whatever's on screen`));
  await page.waitForFunction(() => window.__dd.bossState().bullets > 8, { timeout: 15000 })
    .catch(() => console.warn(`  ! ${scene.name}: no >8-bullet volley confirmed in time — capturing whatever's on screen`));

  const out = `/tmp/bossshot-${scene.name}.png`;
  await page.screenshot({ path: out });
  console.log(`wrote ${out}`);

  if (scene.name === 'amber') {
    // Drive the boss to its phase-1 shield via the same 'bossDamage' event
    // damageBoss() already listens on (emit is exposed on window.__dd) — an
    // existing seam, not a new cheat.
    let shielded = false;
    for (let i = 0; i < 20 && !shielded; i++) {
      shielded = await page.evaluate(() => {
        window.__dd.emit('bossDamage', { amount: 1e6, kind: 'debug' });
        return window.__dd.bossState().shielded;
      });
      if (!shielded) await page.waitForTimeout(100);
    }
    if (!shielded) console.warn('  ! amber: shielded state not reached — skipping the shielded capture');
    else {
      await page.waitForTimeout(500);   // let the raise-flash settle before capturing
      const outShield = '/tmp/bossshot-amber-shielded.png';
      await page.screenshot({ path: outShield });
      console.log(`wrote ${outShield}`);
    }
  }

  await done();
}

console.log('\nbossshot captures done.');
