// Full-frame captures to eyeball the Spectacle II pass (god-rays, contact
// shadow, rim light, water foam) at tier 0. Pins qualityOverride:0 so every
// effect stays on even on this container's software WebGL.
//   node tools/spectacleshot.mjs
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 1280, height: 720 };

function save(owned) {
  return `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999,
    skins: { owned: ['${owned}'], equipped: '${owned}' },
    ascension: { tiers: [['${owned}', 4]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true },
    stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: 0 },
  }))`;
}

async function shot(query, file, waitMs) {
  const { page, errors, done } = await boot({
    query, viewport: VIEW, deviceScaleFactor: 1, initScript: save('solar'),
  });
  await page.click('#btn-start').catch(() => {});
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: file });
  console.log(`wrote ${file}  (errors: ${errors.length})`);
  if (errors.length) console.log(errors.slice(0, 4).join('\n'));
  await done();
}

// Cruise (biome 0) — god-rays into the sun, water foam, contact shadow, rim.
await shot('?debug', '/tmp/spectacle-cruise.png', 3000);
// Surge — rim flares to the Surge highlight, sky shifts, rays ease down.
await shot('?debug=fever', '/tmp/spectacle-surge.png', 3200);
console.log('done');
