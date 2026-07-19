// _empyshot.mjs — THE EMPYREAN PR-1 gate captures (EMPYREAN-BIBLE.md §10). Pins biome 5 and shoots the
// atmosphere substrate: cruise (the money read), a sun-azimuth scan (the three killed suns — no disc, no
// glitter lane, no shaft), a zenith/open-dome frame (blooms + R7 stars), the sky-IBL probe-ON exposure
// check, and a tier-2 degraded frame. Sun dir = (-0.22,0.1,-1) → the sun azimuth sits ~ahead+low, so the
// forward frames ARE the scan.
//   node tools/_empyshot.mjs  →  /tmp/empy-*.png
import { writeFileSync } from 'fs';
import { boot } from '../tests/browser.mjs';

const VIEW = { width: 960, height: 600 };
// Mirror tests/smoke.mjs's save shape (the click→'playing' path is proven there) + the settings we need.
const mkSave = (q = 0) => `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 3, stats: { runs: 5 }, flags: { seenIntro: true, seenFirstSurge: true },
  settings: { reticle: false, qualityOverride: ${q} },
}))`;

async function capture(name, { dist = 3200, ibl = false, q = 0, pitch = 0, yaw = 0, lookUp = 0 }) {
  const query = `?biome=5&debug&cleanshot&seed=73101${ibl ? '&ibl' : ''}`;   // cleanshot strips HUD chrome + course rings + trail
  const { page, done } = await boot({ query, viewport: VIEW, deviceScaleFactor: 1, initScript: mkSave(q) });
  // Robust start: poll-and-click the button's own handler until the game enters 'playing'. Avoids both the
  // overlay pointer-interception (page.click) AND the re-render race that flakes waitForSelector — el.click()
  // dispatches the real DOM click, and re-firing each poll survives a hero-screen re-render.
  await page.waitForFunction(() => !!window.__dd && !!document.getElementById('btn-start'), { timeout: 30000 });
  await page.waitForFunction(() => {
    const b = document.getElementById('btn-start'); if (b) b.click();
    return window.__dd.game && window.__dd.game.state === 'playing';
  }, { timeout: 30000, polling: 500 });
  const st = await page.evaluate(() => window.__dd.game.state);
  console.log(`    [${name}] state=${st}`);
  await page.waitForTimeout(1500);  // climb into steady flight
  await page.evaluate((d) => { window.__dd.noBoss(true); window.__dd.player.dist = d; }, dist);
  await page.waitForFunction((d) => window.__dd.player.dist > d + 40, { timeout: 8000 }, dist).catch(() => {});
  await page.waitForTimeout(1900); // fog/sky lerp settle
  await page.evaluate(() => {
    window.__dd.game.timeScale = 0;               // freeze first so nothing respawns
    window.__dd.clearObstacles && window.__dd.clearObstacles();  // despawn flow-gate tunnels / crystal walls / runs
    window.__dd.clearVents && window.__dd.clearVents();          // and any hazards (Empyrean is a breather, but harmless)
  });
  if (lookUp) await page.evaluate((u) => {
    // Clean upward-forward look (no roll): point the frozen camera up the lane at the SKY DOME so the
    // nebula blooms fill the frame and the water-level props/gates drop below the bottom edge.
    const c = window.__dd.camera, p = c.position; c.up.set(0, 1, 0);
    c.lookAt(p.x, p.y + u, p.z - 3.0); c.updateMatrixWorld();
  }, lookUp);
  else if (pitch || yaw) await page.evaluate(([p, y]) => {
    const c = window.__dd.camera; c.rotation.x += p; c.rotation.y += y; c.updateMatrixWorld();
  }, [pitch, yaw]);
  await page.waitForTimeout(160);
  const buf = await page.screenshot({ timeout: 60000, animations: 'disabled' });
  writeFileSync(`/tmp/empy-${name}.png`, buf);
  console.log(`  wrote /tmp/empy-${name}.png  (ibl=${ibl} q=${q} pitch=${pitch})`);
  await done();
}

const only = process.argv.slice(2);
const want = (n) => only.length === 0 || only.includes(n);
console.log('THE EMPYREAN — PR-1 captures');
if (want('sky'))    await capture('sky',    { dist: 2200, lookUp: 4.0 });  // clean sky-dome read: the nebula blooms + R7 stars + zenith-wins
if (want('cruise')) await capture('cruise', { dist: 2200, pitch: 0 });     // the money read (forward = the sun azimuth)
if (want('down'))   await capture('down',   { dist: 2200, pitch: -0.22 }); // pitch to the waterline: glitter-lane / horizon-dissolve scan
if (want('zenith')) await capture('zenith', { dist: 2580, pitch: 0.55 });  // open-dome (legacy)
if (want('probe'))  await capture('probe',  { ibl: true });                // sky-IBL probe ON (the exposure-blowout check)
if (want('tier2'))  await capture('tier2',  { q: 2 });                     // degraded: nebula 2nd-order warp dropped, motes thinned
console.log('done.');
