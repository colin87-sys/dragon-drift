// Purchase persistence + title backfill regressions.
//
// 1) Shop purchases must hit localStorage SYNCHRONOUSLY (persistNow), not via
//    the 500ms debounce — on mobile the app can be killed before a debounced
//    write flushes, which silently lost bought music stations.
// 2) Pilot-level titles must backfill on boot: a level reached before a title
//    existed (or before the per-level grant fired) should still unlock.
import { boot, check } from './browser.mjs';

// (1) Buying a station writes it to localStorage immediately (no wait).
{
  const SEED = JSON.stringify({
    v: 3, embers: 99999, stats: { runs: 5 }, flags: { seenIntro: true },
    skins: { owned: ['azure'], equipped: 'azure' },
    riders: { owned: ['drifter'], equipped: 'drifter' },
    audio: { musicMuted: false, sfxMuted: false, musicVol: 1, sfxVol: 1, track: 0, ownedTracks: [] },
  });
  const { page, errors, done } = await boot({
    query: '?debug', viewport: { width: 900, height: 1000 },
    initScript: `localStorage.setItem('dragonDriftSave', ${JSON.stringify(SEED)})`,
  });
  await page.click('#btn-shop');
  await page.waitForSelector('.shop-grid');
  await page.click('.seg-btn[data-shoptab="music"]');
  await page.waitForSelector('.skin-card[data-track-i]');
  const idx = await page.evaluate(() =>
    [...document.querySelectorAll('.skin-card[data-track-i].locked')].slice(-1)[0]?.dataset.trackI);
  await page.click(`.skin-card[data-track-i="${idx}"]`);
  // Read localStorage with ZERO delay — only a synchronous write would be here.
  const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('dragonDriftSave')).audio.ownedTracks);
  check('station purchase is in localStorage immediately (persistNow)', owned.length === 1);
  check('the bought station id was stored', typeof owned[0] === 'string' && owned[0].length > 0);
  check('no console errors buying a station', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}

// (2) A level-22 pilot with no titles backfills every level title up to 20.
{
  const SEED = JSON.stringify({
    v: 3, level: 22, embers: 100,
    skins: { owned: ['azure'], equipped: 'azure' },
    riders: { owned: ['drifter'], equipped: 'drifter' },
    titles: { owned: [], equipped: '' },
  });
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', ${JSON.stringify(SEED)})`,
  });
  const s = await page.evaluate(() => window.__dd.save.titles);
  check('backfilled level-5/10/15/20 titles', ['skylark', 'cloudcarver', 'stormrider', 'emberlord'].every(t => s.owned.includes(t)));
  check('did NOT grant a not-yet-earned title (level 25)', !s.owned.includes('skysovereign'));
  check('auto-equipped the first earned title', s.equipped === 'skylark');
  check('backfill boots clean', errors.length === 0) || console.error(errors.join('\n'));
  await done();
}
