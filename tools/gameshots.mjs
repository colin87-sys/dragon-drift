// Real behind-view gameplay screenshots: boots the game with a seeded dragon
// tier, starts a run, and screenshots the live canvas (the actual chase cam).
//   node tools/gameshots.mjs [dragonKey]   →   /tmp/game-<key>-t<tier>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
for (const t of [0, 1, 2, 3]) {
  const { page, done } = await boot({
    query: '?debug',
    initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
      v: 2, embers: 50,
      skins: { owned: ['${key}'], equipped: '${key}' },
      ascension: { tiers: [['${key}', ${t}]], radiance: [] },
      cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
      flags: { seenFirstSurge: true, hintsSeen: 9 },
      settings: { reticle: false, slowMo: true, qualityOverride: null },
    }))`,
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(2000); // let it climb into steady flight
  const canvas = await page.$('canvas');
  await canvas.screenshot({ path: `/tmp/game-${key}-t${t}.png` });
  console.log(`wrote /tmp/game-${key}-t${t}.png`);
  await done();
}
