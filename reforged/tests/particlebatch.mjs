// N4 ParticleBatch (GRAPHICS-OVERHAUL.md): the instanced spark backend (?pfx=batch)
// must (a) compile + render with no console errors, (b) keep the exact same pool/cap
// behaviour as the sprite backend (shared spawn/acquire logic), and (c) collapse the
// per-spark draw calls into ~one. Measured at tier2 (qualityOverride:2) where the
// composer is off, so renderer.info.render.calls is a single frame's true scene total.
//   node tests/particlebatch.mjs
import { boot, check } from './browser.mjs';

const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['azure'], equipped: 'azure' },
  ascension: { tiers: [['azure', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: true, qualityOverride: 2 },
}))`;

async function run(mode) {
  const query = `?debug&cleanshot&seed=73101${mode === 'batch' ? '&pfx=batch' : ''}`;
  const { page, errors, done } = await boot({ query, viewport: { width: 900, height: 600 }, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.distance >= 20, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { for (let i = 0; i < 4; i++) window.__dd.pfx.burst(80); });
  await page.waitForTimeout(250);
  const r = await page.evaluate(() => ({ stats: window.__dd.pfx.stats(), calls: window.__dd.pfx.drawCalls() }));
  await done();
  return { ...r, errors: errors.length };
}

const sprite = await run('sprite');
const batch = await run('batch');

check('sprite backend: no console errors', sprite.errors === 0);
check('batch backend: no console errors (shader compiles + renders)', batch.errors === 0);
check('sprite backend reports "sprite"', sprite.stats.backend === 'sprite' && sprite.stats.batched === false);
check('batch backend reports "batch" + instanced mesh built', batch.stats.backend === 'batch' && batch.stats.batched === true);
// Shared spawn/acquire/cap logic → same visible count (±2 for frame-timing jitter).
check('pool parity: visible counts match', Math.abs(sprite.stats.visible - batch.stats.visible) <= 2 && batch.stats.visible > 20);
// The batch collapses ~N spark draws into 1, so it saves ≈ visible-1 draws.
const saved = sprite.calls - batch.calls;
check(`draw calls collapsed (${sprite.calls} → ${batch.calls}, saved ${saved} ≥ ${batch.stats.visible - 5})`, saved >= batch.stats.visible - 5);

console.log(`\nsprite calls=${sprite.calls} visible=${sprite.stats.visible} | batch calls=${batch.calls} visible=${batch.stats.visible}`);
