// Save compatibility: a verbatim v1 production blob boots into v2 with every
// legacy value preserved and every new field at its default. A corrupt blob
// must never block boot.
import { boot, check } from './browser.mjs';

const V1_BLOB = {
  v: 1,
  best: { score: 4321, dist: 2100 },
  flags: { seenFirstSurge: true },
  audio: { musicMuted: false, sfxMuted: true, musicVol: 0.8, sfxVol: 1, track: 2, ownedTracks: ['neon'] },
  settings: { qualityOverride: null, reticle: false, slowMo: true },
  embers: 777, xp: 150, level: 3, revives: 2,
  skins: { owned: ['azure', 'ember'], equipped: 'ember' },
  riders: { owned: ['drifter'], equipped: 'drifter' },
  missions: { active: [{ id: 'rings_20run', progress: 5 }], completedCount: 4 },
  daily: { date: '2026-06-10', played: true, bestScore: 2000, streak: 3 },
  stats: { runs: 12, totalDist: 20000, totalRings: 300, totalEmbers: 900 },
};

{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', ${JSON.stringify(JSON.stringify(V1_BLOB))})`,
  });
  const s = await page.evaluate(() => window.__dd.save);
  check('boots a v1 blob with zero errors', errors.length === 0) || console.error(errors.join('\n'));
  check('version stamped to 2', s.v === 2);
  check('legacy embers preserved', s.embers === 777);
  check('legacy level preserved', s.level === 3);
  check('legacy best preserved', s.best.score === 4321 && s.best.dist === 2100);
  check('legacy dragons preserved', s.skins.owned.length === 2 && s.skins.equipped === 'ember');
  check('legacy mission slot preserved', s.missions.active.some((m) => m.id === 'rings_20run' && m.progress === 5));
  check('legacy daily streak preserved', s.daily.streak === 3);
  check('legacy assist setting preserved', s.settings.reticle === false);
  check('new: records defaulted', s.records && s.records.bestChain === 0);
  check('new: feats defaulted', Array.isArray(s.feats.unlocked) && s.feats.unlocked.length === 0);
  check('new: titles defaulted', s.titles.equipped === '' && s.titles.owned.length === 0);
  check('new: weekly drawn for current week', /^\d{4}-W\d{2}$/.test(s.weekly.key) && s.weekly.trialIds.length === 3);
  check('new: milestones/mastery defaulted', s.milestones.claimed.length === 0 && s.mastery.flown.length === 0);
  check('new: gambitPending null', s.gambitPending === null);
  check('new: lifetime stats extended, legacy kept', s.stats.runs === 12 && s.stats.totalPerfects === 0);
  check('new: missions.completedIds defaulted', Array.isArray(s.missions.completedIds));
  check('new: lastSeen stamped today', s.lastSeen === new Date().toISOString().slice(0, 10));
  check('no welcome-back gift on first v2 boot (lastSeen was empty)', s.embers === 777);
  await done();
}

{
  const { page, errors, done } = await boot({
    initScript: `localStorage.setItem('dragonDriftSave', '{"v":2,"embers":###corrupt')`,
  });
  const v = await page.evaluate(() => window.__dd.save.v);
  check('corrupt blob still boots', errors.length === 0 && v === 2) || console.error(errors.join('\n'));
  await done();
}
