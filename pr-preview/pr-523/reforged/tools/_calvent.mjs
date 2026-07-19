// THE SCOURMAW r4 verification (Fable). Phase is read from the live vent (the cycle runs on the
// render clock), so labels are trustworthy: poll __dd.ventStates() until the nearest vent is in the
// wanted state, THEN shoot. One vent per shot; camera + vent dist + site max-y reported.
//   node tools/_calvent.mjs [tag]  →  reforged-captures/scourmaw-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 1120, height: 720 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 }, skins: { owned: ['azure'], equipped: 'azure' },
  flags: { seenFirstSurge: true, hintsSeen: 9 }, settings: { reticle: false },
}))`;
const tag = process.argv[2] || 'r4';

async function waitState(page, want) {   // want: 'idle' | 'erupt'
  await page.waitForFunction((w) => {
    const vs = window.__dd.ventStates(); if (!vs.length) return false;
    const v = vs[0];
    return w === 'erupt' ? (v.erupting && v.up > 0.85) : (!v.erupting && v.flareOp < 0.4);
  }, want, { timeout: 9000, polling: 80 }).catch(() => {});
}

async function grab(query, label, shots) {
  const { page, done, errors } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: save });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd && window.__dd.game && window.__dd.game.state === 'playing', { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => { window.__dd.noBoss && window.__dd.noBoss(true); window.__dd.player.dist = 5400; });
  await page.waitForTimeout(300);
  for (const s of shots) {
    const info = await page.evaluate(([ahead, x, py]) => {
      window.__dd.clearVents();
      if (py != null) window.__dd.player.position.y = py;
      window.__dd.spawnVent(ahead, x);
      const c = window.__dd.camera.position;
      let maxy = 0;
      window.__dd.scene.traverse((o) => {
        if (o.isMesh && o.geometry && o.geometry.attributes.color) {
          const n = o.geometry.attributes.position.count;
          if (n > 300 && n < 400) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; if (b) maxy = Math.max(maxy, b.max.y); }
        }
      });
      return { cam: [c.x.toFixed(1), c.y.toFixed(1)], ventDist: (window.__dd.player.dist + ahead).toFixed(0), maxy: +maxy.toFixed(2) };
    }, [s.ahead, s.x ?? 0, s.py ?? null]);
    await waitState(page, s.want);
    writeFileSync(`reforged-captures/scourmaw-${label}-${s.name}.png`, await page.screenshot());
    console.log(`  ${s.name} (${s.want}): cam=${info.cam} ventDist=${info.ventDist} siteMaxY=${info.maxy}`);
  }
  await done();
  return errors;
}

console.log(`scourmaw ${tag}:`);
const eNew = await grab('?biome=3&debug', tag, [
  { name: '14m-idle', ahead: 14, x: -4, py: 6, want: 'idle' },
  { name: '25m-plan', ahead: 25, py: 14, want: 'idle' },
  { name: '22m-erupt', ahead: 22, x: 4, py: 8, want: 'erupt' },
  { name: '40m-idle', ahead: 40, py: 7, want: 'idle' },
]);
console.log(`newErr=${eNew.length}`);
if (eNew.length) console.log(eNew.slice(0, 4).join('\n'));
