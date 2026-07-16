// Freeze in front of a Phase Gate veil ("crystal wall") to judge/rework it.
// Scans forward for a userData.phaseGate group, parks the player a few metres
// before its plane, freezes time, and screenshots — across a couple of biomes.
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';
const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, stats:{runs:5}, skins:{owned:['azure'],equipped:'azure'}, ascension:{tiers:[['azure',0]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,hintsSeen:9,phaseTaught:true}, settings:{reticle:false,slowMo:false,qualityOverride:null} }))`;

async function shoot(biome, tag) {
  const { page, done, errors } = await boot({ query: `?biome=${biome}&debug`, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => window.__dd.noBoss && window.__dd.noBoss(true));
  const shots = [];
  // Walk forward; at each step ask the page for the nearest phaseGate's world -z
  // that is AHEAD of the player. When found, park 14m before it, freeze, shoot.
  for (let d = 280; d <= 4600; d += 60) {
    const gateDist = await page.evaluate((dd) => {
      window.__dd.player.dist = dd;
      let best = Infinity;
      const v = new window.__dd.camera.position.constructor();
      window.__dd.scene.traverse((o) => {
        if (o.userData && o.userData.phaseGate) {
          o.getWorldPosition(v);
          const gd = -v.z;                 // gate distance along the track
          if (gd > dd + 6 && gd < best) best = gd;
        }
      });
      return best === Infinity ? null : best;
    }, d);
    await page.waitForTimeout(40);
    if (gateDist != null) {
      await page.evaluate((gd) => { window.__dd.player.dist = gd - 14; }, gateDist);
      await page.waitForTimeout(500);
      await page.evaluate(() => { window.__dd.game.timeScale = 0; });
      await page.waitForTimeout(120);
      const p = `/tmp/veil-${tag}-${shots.length}.png`;
      writeFileSync(p, await page.screenshot());
      shots.push(p);
      await page.evaluate(() => { window.__dd.game.timeScale = 1; });
      if (shots.length >= 2) break;
      d = Math.ceil(gateDist) + 30; // skip past this gate to find the next
    }
  }
  await done();
  console.log(`biome ${biome} (${tag}): errors=${errors.length}, shots=${shots.join(',') || 'NONE'}`);
  return shots.length;
}

await shoot(0, 'sanctuary');
await shoot(2, 'frozen');
console.log('done');
