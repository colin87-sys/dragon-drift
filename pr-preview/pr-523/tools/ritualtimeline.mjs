// Boss-ultimate RITUAL timeline capture: samples the CALL→GATHER→APEX→RELEASE→beam wind-up at
// fixed ritual-clock beats (via the __ddSurgeForce {phase,t} seam) against the live boss arena,
// stamping each frame with its ritual t, phase, and the CONDUCTOR timeScale (how slowed the world
// is at that instant) + gatherK. Prints the wall-clock beat timeline so a pacing critique reasons
// on real durations. Builds a labelled contact sheet.
//   node tools/ritualtimeline.mjs [key]
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const { page, errors, done } = await boot({
  query: '?debug', viewport: { width: 1000, height: 640 }, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999, skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', 3]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true }, stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: 0 },
  }))`,
});
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
await page.evaluate(() => window.__dd.setQuality?.(0));
await page.evaluate(() => { window.__dd.spawnBoss(); window.__dd.bossForceFight(); });
let ok = false;
for (let i = 0; i < 48 && !ok; i++) { ok = await page.evaluate(() => window.__dd.bossState?.()?.phase === 'fight'); if (!ok) await page.waitForTimeout(250); }
if (!ok) console.log('WARN: fight not reached');

const beats = await page.evaluate(() => window.__dd.surgeRitualBeats(false));
// [label, phase, t] — dense through the wind-up so "escalating vs dragging" is visible.
const SAMPLES = [
  ['call',    'ritual', 0.07],
  ['gather1', 'ritual', beats.callEnd + (beats.apexStart - beats.callEnd) * 0.25],
  ['gather2', 'ritual', beats.callEnd + (beats.apexStart - beats.callEnd) * 0.55],
  ['gather3', 'ritual', beats.callEnd + (beats.apexStart - beats.callEnd) * 0.85],
  ['apex-in', 'ritual', beats.apexStart + 0.02],
  ['apex-mid','ritual', beats.apexStart + 0.12],
  ['apex-end','ritual', beats.releaseAt - 0.02],
  ['beam-0',  'beam',   0.02],
  ['beam-mid','beam',   0.19],
  ['beam-end','beam',   0.42],
];
const shots = [];
for (const [label, phase, t] of SAMPLES) {
  await page.evaluate((b) => { window.__dd.player.speed = 0; window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeSeam({ phase: b.phase, t: b.t }); }, { phase, t });
  for (let i = 0; i < 20; i++) { const g = await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; return window.__dd.surgeState().gradeMix; }); if (g >= 0.9) break; await page.waitForTimeout(400); }
  await page.waitForTimeout(150);
  const meta = await page.evaluate((b) => ({
    ts: window.__dd.surgeRitualScaleAt(b.t, false),
    gk: b.phase === 'ritual' ? window.__dd.surgeGatherKAt(b.t, false) : null,
  }), { phase, t });
  const buf = await page.screenshot({ path: `/tmp/ritual-${key}-${label}.png` });
  shots.push({ label, phase, t, ts: meta.ts, gk: meta.gk, b64: buf.toString('base64') });
}
await page.evaluate(() => window.__dd.surgeSeam(null));

const sheet = await page.evaluate(async (shots) => {
  const W = 480, H = 307, COLS = 2, PAD = 5, LAB = 20;
  const rows = Math.ceil(shots.length / COLS);
  const c = document.createElement('canvas'); c.width = COLS*(W+PAD)+PAD; c.height = rows*(H+LAB+PAD)+PAD;
  const g = c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,c.width,c.height);
  for (let i=0;i<shots.length;i++){ const s=shots[i]; const img=new Image(); await new Promise(r=>{img.onload=r;img.src='data:image/png;base64,'+s.b64;});
    const x=PAD+(i%COLS)*(W+PAD), y=PAD+Math.floor(i/COLS)*(H+LAB+PAD);
    g.drawImage(img,x,y,W,H); g.fillStyle='#111'; g.fillRect(x,y+H,W,LAB);
    g.fillStyle='#ffd884'; g.font='bold 12px monospace'; g.textBaseline='middle';
    g.fillText(s.label, x+6, y+H+LAB/2); }
  return c.toDataURL('image/png').split(',')[1];
}, shots.map(s => ({ b64: s.b64, label: `${s.label}  t=${s.t.toFixed(2)}s  world=${(s.ts*100).toFixed(0)}%${s.gk!=null?`  gather=${(s.gk*100).toFixed(0)}%`:''}` })));
const { writeFileSync } = await import('fs');
writeFileSync(`/tmp/ritual-${key}-sheet.png`, Buffer.from(sheet, 'base64'));

console.log(`\n== RITUAL TIMELINE (${key}, first cast) — the wind-up before the beam ==`);
console.log(`  CALL   0.00 → ${beats.callEnd.toFixed(2)}s   (${(beats.callEnd*1000).toFixed(0)}ms, world 100%→~97%)`);
console.log(`  GATHER ${beats.callEnd.toFixed(2)} → ${beats.apexStart.toFixed(2)}s   (${((beats.apexStart-beats.callEnd)*1000).toFixed(0)}ms, world eases ~97%→35%)`);
console.log(`  APEX   ${beats.apexStart.toFixed(2)} → ${beats.releaseAt.toFixed(2)}s   (${((beats.releaseAt-beats.apexStart)*1000).toFixed(0)}ms, world FROZEN at 25% — the held breath)`);
console.log(`  → RELEASE at ${beats.releaseAt.toFixed(2)}s : beam fires (0.55s), world snaps 25%→105%→100%`);
console.log(`  TOTAL WIND-UP before beam = ${beats.releaseAt.toFixed(2)}s wall-clock (~${((beats.apexStart-beats.callEnd)+(beats.releaseAt-beats.apexStart)).toFixed(2)}s of it noticeably slowed)`);
console.log(`  repeat cast compresses to CALL 0.10 + GATHER 0.65 + APEX 0.25 = 1.00s`);
console.log(`\n  per-frame:`);
for (const s of shots) console.log(`   ${s.label.padEnd(9)} t=${s.t.toFixed(2)}s  world=${(s.ts*100).toFixed(0)}%${s.gk!=null?`  gather=${(s.gk*100).toFixed(0)}%`:''}`);
console.log(`\n  sheet: /tmp/ritual-${key}-sheet.png   errors: ${errors.length}`);
await done();
