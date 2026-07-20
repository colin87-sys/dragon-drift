// _ribbonvert.mjs — reproduce the "lunge/spasm on UP/DOWN movement" report. Drives aggressive
// vertical velocity steps (up↔down every ~0.18s) with a bounded altitude so the game's pitch / dive-
// climb pose system engages (it reads player.velocity.y), and shoots a dense filmstrip from a side
// tracking cam (which sees the VERTICAL plane clearly — the chase cam foreshortens it).
//   node tools/_ribbonvert.mjs [dragonKey]  →  /tmp/vert-<key>-NN.png
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'jade';
const VIEW = { width: 900, height: 600 };
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
await page.waitForTimeout(1200);

page.on('pageerror', (e) => console.log('  ! pageerror:', String(e).slice(0, 120)));
// side tracking cam ONLY (don't touch physics) so vertical motion reads; keep i-frames on.
await page.evaluate(() => {
  const dd = window.__dd, p = dd.player;
  const baseY = p.position.y;
  dd.cameraCtl.update = () => {
    p.rollInvuln = 9;
    dd.camera.position.set(p.position.x + 22, baseY + 4, p.position.z + 7);
    dd.camera.lookAt(p.position.x - 1, baseY - 1, p.position.z + 3);
  };
});

let n = 0;
const shot = async () => { await page.screenshot({ path: `/tmp/vert-${key}-${String(n).padStart(2, '0')}.png`, timeout: 15000 }); n++; };
// REAL key input: hold each direction ~0.32s while shooting DENSELY (~40ms) so any erratic frame-to-
// frame motion within a single up/down stroke is legible. A few strokes: up, down, up, down.
const dirs = ['ArrowUp', 'ArrowDown', 'ArrowUp', 'ArrowDown'];
for (const k of dirs) {
  await page.keyboard.down(k);
  for (let i = 0; i < 7; i++) { await shot(); await page.waitForTimeout(40); }
  await page.keyboard.up(k);
  if ((await page.evaluate(() => window.__dd?.game?.state)) !== 'playing') { console.log('  ! left playing'); break; }
}

console.log(`  ✓ ${n} frames · ` + (errors.length ? 'errors: ' + errors.slice(0, 3).join(' | ') : 'no console errors'));
await done();
