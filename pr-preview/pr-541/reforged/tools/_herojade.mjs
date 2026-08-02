// _herojade.mjs — premium look-gate capture for the Jade Serpent apex. Renders the APEX (tier 2)
// in-engine at gameplay + studio angles so a critic can judge the model objectively:
//   chase   — the judged rear-chase gameplay frame (player truth)
//   q34     — close 3/4 rear-above (the fan-crown value structure + depth)
//   side    — close side (edge-on truth: do the fan rays read as raised ribs, not a plank?)
//   top     — 3/4 top-down (the fan-row hierarchy, shoulder→aft de-blob)
//   node tools/_herojade.mjs [dragonKey]  →  /tmp/hero-<key>-<view>.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'jade';
const VIEW = { width: 1100, height: 760 };
const save = `localStorage.setItem('dragonDriftSave', JSON.stringify({
  v: 2, embers: 50, stats: { runs: 5 },
  skins: { owned: ['${key}'], equipped: '${key}' },
  ascension: { tiers: [['${key}', 2]], radiance: [] },
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
  flags: { seenFirstSurge: true, hintsSeen: 9 },
  settings: { reticle: false, slowMo: false, qualityOverride: null },
}))`;

const { page, done, errors } = await boot({ query: '?debug&cleanshot', viewport: VIEW, deviceScaleFactor: 1, initScript: save });
await page.waitForSelector('#btn-start', { state: 'attached' }).catch(() => {});
await page.evaluate(() => document.querySelector('#btn-start')?.click());
await page.waitForFunction(() => window.__dd?.game?.state === 'playing', { timeout: 10000 });
await page.waitForTimeout(2200);   // settle into steady straight cruise

const shot = async (name) => { await page.screenshot({ path: `/tmp/hero-${key}-${name}.png`, timeout: 20000 }); console.log('  ✓ ' + name); };

// chase = the game's own cam (player truth)
await shot('chase');

// studio cams: freeze the controller and frame the shoulder/fan-crown close. The head/fan-crown sits
// near the group origin; the body trails +z. Aim a little ahead of the shoulder.
const setCam = (ox, oy, oz, lx, ly, lz) => page.evaluate(([ox, oy, oz, lx, ly, lz]) => {
  const dd = window.__dd, p = dd.player;
  dd.cameraCtl.update = () => {
    dd.camera.position.set(p.position.x + ox, p.position.y + oy, p.position.z + oz);
    dd.camera.lookAt(p.position.x + lx, p.position.y + ly, p.position.z + lz);
  };
}, [ox, oy, oz, lx, ly, lz]);

// close on the shoulder fan-crown (first fans sit ~2-4u behind the head). Aim tight.
await setCam(3.4, 2.2, 5.2, -0.2, 0.2, 2.6); await page.waitForTimeout(250); await shot('q34');
await setCam(6.2, 0.8, 2.6, -0.5, -0.2, 2.8); await page.waitForTimeout(250); await shot('side');
await setCam(1.0, 5.6, 6.6, -0.4, -0.8, 5.2); await page.waitForTimeout(250); await shot('top');   // biased tailward so the leaf-fork reads bigger (Fable CP4)
await setCam(5.0, -2.6, 3.2, -0.5, 1.0, 3.0); await page.waitForTimeout(250); await shot('low');   // belly/underside — the ventral scute band + body mass
// CP4: the koi-mask HEAD + the TAIL REGALIA. Anchor the cams on the ACTUAL dragon geometry (head = the
// dragon-group origin region; tail = the mean of the body mesh's LAST vertices) and frame from the
// SUN side (sun ~ -z) so the subject is lit, not silhouetted. Freeze the controller onto a fixed anchor.
const camAt = (ax, ay, az, ox, oy, oz) => page.evaluate(([ax, ay, az, ox, oy, oz]) => {
  const dd = window.__dd;
  dd.cameraCtl.update = () => { dd.camera.position.set(ax + ox, ay + oy, az + oz); dd.camera.lookAt(ax, ay, az); };
}, [ax, ay, az, ox, oy, oz]);
// head world anchor: the dragon flies -z; the head leads. Use player pos + a small -z lead.
const headA = await page.evaluate(() => { const p = window.__dd.player.position; return [p.x, p.y + 0.15, p.z - 1.0]; });
// tail world anchor: the LEAF-FORK region (~86-93% through the body-mesh buffer — the leaves are emitted
// just before the thin whiskers, so sampling the very end lands on whisker tips; this band is the fork).
const tailA = await page.evaluate(() => {
  const dd = window.__dd; let mesh = null, mx = 0;
  // the jade BODY tube uniquely sets frustumCulled=false and is the largest such mesh — this avoids
  // picking the water/terrain plane (which has far more verts).
  dd.scene.traverse(o => { if (o.isMesh && o.frustumCulled === false && o.geometry?.attributes?.position && o.geometry.attributes.position.count > mx) { mx = o.geometry.attributes.position.count; mesh = o; } });
  if (!mesh) { const p = dd.player.position; return [p.x, p.y, p.z + 8]; }
  mesh.updateWorldMatrix(true, false);
  const pos = mesh.geometry.attributes.position, n = pos.count;
  const lo = Math.floor(n * 0.92), hi = Math.floor(n * 0.975);   // the LEAF-FORK band (past the fans, before the last-~2.5% whisker tips)
  const v = new (dd.player.position.constructor)(); let sx = 0, sy = 0, sz = 0, k = 0;
  for (let i = lo; i < hi; i++) { v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mesh.matrixWorld); sx += v.x; sy += v.y; sz += v.z; k++; }
  return [sx / k, sy / k, sz / k];
});
// head: reliable player-relative close 3/4 from the sun (-z) side (camAt geometry anchor mis-framed)
await setCam(-2.0, 0.32, -1.7, -0.42, 0.3, -1.2); await page.waitForTimeout(250); await shot('head');   // side-front at EYE LEVEL, sun-lit side → the eye/socket glower faces the cam
// tail: tight 3/4 from behind-above over the fork anchor (fills frame with the leaves, terminal fork centred)
await camAt(tailA[0], tailA[1], tailA[2], 0.3, 2.2, 2.4); await page.waitForTimeout(250); await shot('tail');

// ── SURGE frames — force fever so the WITHHELD river-gleam FLOODS the fan-ray tips / tail / whiskers.
// The withheld-glow read is the cruise-subtle → Surge-bright CONTRAST, so the gate needs both.
await page.evaluate(() => { if (window.__dd?.game) { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 99999; } });
await page.waitForTimeout(3800);   // wait PAST the one-shot Surge entrance cinematic (arc-crown rings + gold world-grade) to STEADY-STATE ignition, so the withheld tip-flood reads on the DRAGON, not screen FX
await setCam(1.8, 6.0, 4.2, 0, -0.6, 2.8); await page.waitForTimeout(250); await shot('surge-top');    // top-down keeps the halo out of frame
await setCam(6.2, 0.8, 2.6, -0.5, -0.2, 2.8); await page.waitForTimeout(250); await shot('surge-side'); // side — fan-tip flood in profile
await setCam(3.4, 2.2, 5.2, -0.2, 0.2, 2.6); await page.waitForTimeout(250); await shot('surge-q34');

console.log(errors.length ? '  ! errors: ' + errors.slice(0, 3).join(' | ') : '  ✓ no console errors');
await done();
