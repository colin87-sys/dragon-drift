// Dense BEAM capture: samples the beam phase across its 0.55s life (birth→sustain→collapse→
// impact) against the live boss arena, for an aesthetics/richness assessment. Closer crop.
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
const T = [0.02, 0.12, 0.30, 0.45, 0.58, 0.68, 0.75, 0.79];
const shots = [];
for (const t of T) {
  await page.evaluate((t) => { window.__dd.player.speed = 0; window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeSeam({ phase: 'beam', t }); }, t);
  for (let i = 0; i < 20; i++) { const g = await page.evaluate(() => { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; return window.__dd.surgeState().gradeMix; }); if (g >= 0.9) break; await page.waitForTimeout(400); }
  await page.waitForTimeout(150);
  const buf = await page.screenshot({ path: `/tmp/beam-${key}-t${Math.round(t*100)}.png` });
  shots.push({ t, b64: buf.toString('base64') });
}
await page.evaluate(() => window.__dd.surgeSeam(null));
const sheet = await page.evaluate(async (shots) => {
  const W = 480, H = 307, COLS = 2, PAD = 5, LAB = 18;
  const c = document.createElement('canvas'); c.width = COLS*(W+PAD)+PAD; c.height = Math.ceil(shots.length/COLS)*(H+LAB+PAD)+PAD;
  const g = c.getContext('2d'); g.fillStyle='#000'; g.fillRect(0,0,c.width,c.height);
  for (let i=0;i<shots.length;i++){ const s=shots[i]; const img=new Image(); await new Promise(r=>{img.onload=r;img.src='data:image/png;base64,'+s.b64;});
    const x=PAD+(i%COLS)*(W+PAD), y=PAD+Math.floor(i/COLS)*(H+LAB+PAD);
    g.drawImage(img,x,y,W,H); g.fillStyle='#111'; g.fillRect(x,y+H,W,LAB);
    g.fillStyle='#8ff'; g.font='bold 12px monospace'; g.textBaseline='middle';
    g.fillText(`beam t=${s.t.toFixed(2)}s (of 0.80) — ${s.t<0.11?'BIRTH':s.t<0.53?'SUSTAIN':'COLLAPSE'}`, x+6, y+H+LAB/2); }
  return c.toDataURL('image/png').split(',')[1];
}, shots);
const { writeFileSync } = await import('fs');
writeFileSync(`/tmp/beam-${key}-sheet.png`, Buffer.from(sheet, 'base64'));
console.log(`wrote /tmp/beam-${key}-sheet.png + frames   errors: ${errors.length}`);
await done();
