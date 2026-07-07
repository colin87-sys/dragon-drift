// One-off: capture EMBERTIDE in-game at PORTRAIT and LANDSCAPE to verify the
// sky-replacement fills the frame with no edges + one sky (owner's ask).
import { boot } from '../tests/browser.mjs';

const SAVE = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`;
const EMBERTIDE_IDX = 11;   // BOSS_ORDER: ...weftwitch(10), embertide(11)
const DIST = 100;

const ASPECTS = [
  { name: 'portrait', w: 1080, h: 1920 },
  { name: 'landscape', w: 1920, h: 1080 },
];

for (const a of ASPECTS) {
  console.log(`\n=== embertide ${a.name} ${a.w}x${a.h} ===`);
  const { page, done } = await boot({
    query: `?debug&bossIdx=${EMBERTIDE_IDX}&boss=${DIST}`,
    viewport: { width: a.w, height: a.h }, deviceScaleFactor: 1,
    initScript: SAVE,
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.__dd.spawnBoss());   // force the encounter (bossboot idiom); ?bossIdx picks embertide
  await page.waitForFunction(() => window.__dd.game.inBoss === true, { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 30000 })
    .catch(() => console.warn(`  ! ${a.name}: fight phase not confirmed — capturing anyway`));
  await page.waitForTimeout(1200);   // let the sky crossfade settle
  const st = await page.evaluate(() => ({ name: window.__dd.bossState().name, phase: window.__dd.bossState().phase }));
  console.log(`  boss=${st.name} phase=${st.phase}`);
  const out = `/tmp/embertide-${a.name}.png`;
  await page.screenshot({ path: out });
  console.log(`wrote ${out}`);
  await done();
}
