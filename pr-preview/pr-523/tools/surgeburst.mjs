// SUNBREAK burst capture: the FULL Surge lifecycle as a multi-shot burst on a CLEAN field
// (obstacles + hazards + rings despawned via the capture seams — nothing competes with the
// dragon), for critic/owner assessment of the world + dragon "vision" (§C: the sky dims and
// the dragon becomes the light source; value-first for the colorblind read).
//
//   node tools/surgeburst.mjs [key] [tier]
//
// Beats (cascade clock pinned via __ddSurgeCascadePin — deterministic at headless fps):
//   armed   fever OFF, surge ready       (the "before" — the world at baseline)
//   crown   t=0.06  crown corona ignites (station 1 — the first tell)
//   spine   t=0.22  spine RUSH           (station 2)
//   wing    t=0.40  wing SPREAD          (station 3)
//   tail    t=0.55  tail CRACK           (station 4 — nearest-element climax)
//   full    t=0.90  rim SEAL             (fully transformed)
//   sus-a   t=3.20  sustain breathe/flare (early hold)
//   sus-b   t=5.50  sustain breathe/flare (counter-phase hold — adaptation/breathe check)
//
// Outputs: /tmp/burst-<key>-<beat>.png per beat + a labelled contact sheet
// /tmp/burst-<key>-sheet.png (2 columns × 4 rows, chronological), plus per-beat
// dragon-crop + world-band greyscale luminance so the value story is measurable.
//
// NOTE ON THE WORLD GRADE: fever is armed continuously from the first ignition beat, so the
// world-suppression grade (which ramps live over ~450ms and is NOT pinned by the cascade
// clock) is at full depth from the `spine` frame onward. In play the world lands at full
// mid-cascade, so frames crown→wing show the world slightly AHEAD of real time — judge the
// dragon's climb per-beat, and the world's drop against `armed`.
import { boot } from '../tests/browser.mjs';

const key = process.argv[2] || 'solar';
const tier = Number(process.argv[3] ?? 3);

const { page, errors, done } = await boot({
  query: '?debug', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({
    v: 2, embers: 999999, skins: { owned: ['${key}'], equipped: '${key}' },
    ascension: { tiers: [['${key}', ${tier}]], radiance: [] },
    cosmetics: { marksOwned: [], markEquipped: '', formPref: [] },
    flags: { seenFirstSurge: true, hintsSeen: 9, seenIntro: true }, stats: { runs: 5 },
    settings: { reticle: false, slowMo: true, qualityOverride: 0 },
  }))`,
});
await page.click('#btn-start').catch(() => {});
await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 60000 });
await page.evaluate(() => window.__dd.setQuality?.(0));
// Fly a short lead-in so the framing is a real cruise frame, then freeze the pose and
// CLEAR THE FIELD: no obstacles, no hazard vents, no ring toruses — the surge owns the frame.
await page.waitForTimeout(1500);
await page.evaluate(() => {
  window.__dd.player.speed = 0;
  window.__dd.clearObstacles(); window.__dd.clearVents(); window.__dd.clearRings();
  window.__dd.clearCollectibles?.();
  // The HUD is not the dragon: the stamina arc reads as a "cyan collar" and chrome pollutes
  // the luminance metrics — hide the DOM layer entirely for the burst (page-side only).
  const hud = document.getElementById('hud'); if (hud) hud.style.opacity = '0';
});
await page.waitForTimeout(200);
const D0 = await page.evaluate(() => window.__dd.player.dist);

// Greyscale luminance: dragon crop (centre) + world band (upper sky strip) — the two halves
// of the §C value story (dragon UP, world DOWN).
async function lumens(shotB64) {
  return page.evaluate(async (b64) => {
    const img = new Image(); await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const mean = (x, y, w, h) => {
      const d = g.getImageData(x, y, w, h).data; const Ls = []; let s = 0, lit = 0, lit200 = 0;
      for (let i = 0; i < d.length; i += 4) { const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; s += L; Ls.push(L); if (L > 180) lit++; if (L > 200) lit200++; }
      Ls.sort((a, b) => a - b);
      return { mean: +(s / Ls.length).toFixed(1), max: +Ls[Ls.length - 1].toFixed(1), p99: +Ls[Math.floor(Ls.length * 0.99)].toFixed(1), lit, lit200 };
    };
    return {
      dragon: mean(Math.floor(0.40 * img.width), Math.floor(0.38 * img.height), Math.floor(0.20 * img.width), Math.floor(0.26 * img.height)),
      world: mean(Math.floor(0.05 * img.width), Math.floor(0.06 * img.height), Math.floor(0.90 * img.width), Math.floor(0.18 * img.height)),
      // Station acceptance regions (vision re-score): the WING band (wide, mid-height — where the
      // membranes live in rear-chase) and the TAIL band (narrow, low-centre — the crack).
      wings: mean(Math.floor(0.32 * img.width), Math.floor(0.44 * img.height), Math.floor(0.36 * img.width), Math.floor(0.14 * img.height)),
      tail: mean(Math.floor(0.42 * img.width), Math.floor(0.62 * img.height), Math.floor(0.16 * img.width), Math.floor(0.20 * img.height)),
    };
  }, shotB64);
}

const BEATS = [
  ['armed', null], ['crown', 0.06], ['spine', 0.22], ['wing', 0.40],
  ['tail', 0.55], ['full', 0.90], ['sus-a', 3.20], ['sus-b', 5.50],   // counter-phase at the 0.22Hz breathe (8.1s sampled ~the same phase as 3.2s)
];
const shots = [];   // { name, b64, lum }
for (const [name, t] of BEATS) {
  await page.evaluate(({ t, D0 }) => {
    window.__dd.player.speed = 0; window.__dd.player.dist = D0; window.__dd.player.position.z = -D0;
    window.__dd.clearObstacles(); window.__dd.clearVents(); window.__dd.clearRings();
    window.__dd.clearCollectibles?.();
    if (t == null) { window.__dd.game.feverActive = false; window.__dd.game.feverTimer = 0; window.__dd.surgeCascadePin(null); }
    else { window.__dd.game.feverActive = true; window.__dd.game.feverTimer = 999; window.__dd.surgeCascadePin(t); }
  }, { t, D0 });
  // Let the live world grade travel (armed → release back to baseline; ignited → full drop).
  for (let i = 0; i < 14; i++) {
    const g = await page.evaluate(() => window.__dd.surgeState().gradeMix);
    if (t == null ? g <= 0.05 : g >= 0.9) break;
    await page.waitForTimeout(350);
  }
  await page.evaluate((D0) => { window.__dd.player.dist = D0; window.__dd.player.position.z = -D0; }, D0);
  await page.waitForTimeout(60);
  const buf = await page.screenshot({ path: `/tmp/burst-${key}-${name}.png` });
  const b64 = buf.toString('base64');
  shots.push({ name, b64, lum: await lumens(b64) });
}
await page.evaluate(() => window.__dd.surgeCascadePin(null));

// Contact sheet: 2 cols × 4 rows at half scale, labelled — one image tells the whole arc.
const sheetB64 = await page.evaluate(async (shots) => {
  const W = 640, H = 360, COLS = 2, PAD = 6, LAB = 22;
  const rows = Math.ceil(shots.length / COLS);
  const c = document.createElement('canvas');
  c.width = COLS * (W + PAD) + PAD; c.height = rows * (H + LAB + PAD) + PAD;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < shots.length; i++) {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + shots[i].b64; });
    const x = PAD + (i % COLS) * (W + PAD), y = PAD + Math.floor(i / COLS) * (H + LAB + PAD);
    g.drawImage(img, x, y, W, H);
    g.fillStyle = '#111'; g.fillRect(x, y + H, W, LAB);
    g.fillStyle = '#ffd884'; g.font = 'bold 13px monospace'; g.textBaseline = 'middle';
    g.fillText(shots[i].label, x + 8, y + H + LAB / 2);
  }
  return c.toDataURL('image/png').split(',')[1];
}, shots.map((s) => ({
  b64: s.b64,
  label: `${s.name}  ·  dragon L ${s.lum.dragon.mean} (max ${s.lum.dragon.max})  ·  sky L ${s.lum.world.mean}`,
})));
const { writeFileSync } = await import('fs');
writeFileSync(`/tmp/burst-${key}-sheet.png`, Buffer.from(sheetB64, 'base64'));

console.log(`\n== SURGE BURST (${key} t${tier}) — clean field, value story ==`);
for (const s of shots) console.log(`  ${s.name.padEnd(6)} dragon L ${String(s.lum.dragon.mean).padStart(6)}  p99 ${String(s.lum.dragon.p99).padStart(6)}  lit>180 ${String(s.lum.dragon.lit).padStart(6)}px   wings p95≈p99 ${String(s.lum.wings.p99).padStart(6)}  tail p99 ${String(s.lum.tail.p99).padStart(6)}   sky L ${String(s.lum.world.mean).padStart(6)}`);
{ const w22 = shots.find((x) => x.name === 'spine'), w40 = shots.find((x) => x.name === 'wing'), t55 = shots.find((x) => x.name === 'tail');
  if (w22 && w40) console.log(`\n  WING-STATION STEP p99 @0.40 vs @0.22: ${w22.lum.wings.p99} → ${w40.lum.wings.p99} (${(w40.lum.wings.p99 / Math.max(w22.lum.wings.p99, 1)).toFixed(2)}×; acceptance ≥ a clear step)`);
  if (t55) console.log(`  TAIL-CRACK @0.55: p99 ${t55.lum.tail.p99}, px>200 ${t55.lum.tail.lit200} (pixel-space acceptance ≥300)`);
  const f90 = shots.find((x) => x.name === 'full');
  if (f90) console.log(`  TAIL @full: px>200 ${f90.lum.tail.lit200} (crack must DECAY: <50 for a discrete slam, unless the model's own tail crystal holds)`);
  const sa = shots.find((x) => x.name === 'sus-a'), sb = shots.find((x) => x.name === 'sus-b');
  if (sa && sb) { const d = Math.abs(sa.lum.dragon.lit - sb.lum.dragon.lit) / Math.max(sa.lum.dragon.lit, sb.lum.dragon.lit, 1); console.log(`  BREATHE lit-delta sus-a vs sus-b: ${(d * 100).toFixed(1)}% (acceptance ≥8%)`); } }
const a = shots[0], f = shots.find((s) => s.name === 'full');
console.log(`\n  dragon climb full/armed = ${(f.lum.dragon.mean / Math.max(a.lum.dragon.mean, 1)).toFixed(2)}×   sky drop full/armed = ${(f.lum.world.mean / Math.max(a.lum.world.mean, 1)).toFixed(2)}×`);
console.log(`  frames: /tmp/burst-${key}-{${BEATS.map(([n]) => n).join(',')}}.png`);
console.log(`  sheet:  /tmp/burst-${key}-sheet.png`);
console.log(`  errors: ${errors.length}${errors.length ? '\n' + errors.slice(0, 3).join('\n') : ''}`);
await done();
