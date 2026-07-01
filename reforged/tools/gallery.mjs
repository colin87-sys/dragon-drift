// gallery — generate a DIVERSE population of outline variants, render each as a flat-black
// silhouette, filter by silmetrics, and compose a labelled contact sheet for the HUMAN to pick.
//
// This is the core of the new approach (DRAGON-AESTHETICS.md): the silhouette IS the outline,
// and the outline is what the user says is wrong. The AI generates variety + culls the provably
// un-dragonlike; it does NOT rank beauty. The human reads the sheet and names the winners.
//
//   node tools/gallery.mjs <key> [--n=16] [--views=side,top] [--tier=N] [--seed=1] [--out=PATH]
//
import { renderSilhouetteDef, pngRGBA, DRAGONS } from './silhouetteCore.mjs';
import { ascendedDef, maxTierFor } from '../js/ascension.js';
import { computeMetrics, scoreView, advisory } from './silmetrics.mjs';
import { writeFileSync } from 'node:fs';

// --- deterministic RNG (reproducible galleries) ----------------------------------------------
function lcg(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// --- outline variation: multiplicative/additive nudges on the REAL authored knobs ------------
// Each variant is a small param vector; applyVariant mutates a clone of the raw def. Only fields
// that exist are touched, so it degrades gracefully across builders. These are the outline axes:
// body length/girth, wing span/chord (the ribbon dial), scallop depth, wing arc, spine S-curve.
const AXES = {
  bodyStretch: [0.80, 1.30],   // z length (tube ↔ long)
  bodyGirth:   [0.80, 1.35],   // section width/height (thin ↔ deep-bellied)
  wingSpan:    [0.80, 1.25],   // tip x  (narrow ↔ wide)
  wingChord:   [0.80, 1.55],   // tip |y| (ribbon ↔ deep chord)  ← the L53 ribbon dial
  scallop:     [0.70, 2.20],   // trailing-edge festoon depth
  archHump:    [0.40, 2.20],   // elbow rise
  spineArch:   [0.60, 1.80],   // S-curve amount
};
const NEUTRAL = Object.fromEntries(Object.keys(AXES).map(k => [k, 1]));

function applyVariant(rawDef, p) {
  const d = JSON.parse(JSON.stringify(rawDef));
  d.model = d.model || {};
  // body
  d.model.bodyStretch = (d.model.bodyStretch ?? 1) * p.bodyStretch;
  d.model.bodyGirth = (d.model.bodyGirth ?? 1) * p.bodyGirth;        // read by hull/nightfury sections
  d.model.girthScale = (d.model.girthScale ?? 1) * p.bodyGirth;      // alt name some builders use
  d.model.spineArch = (d.model.spineArch ?? 1) * p.spineArch;
  // wings — scale every authored form's outline so all life-stages move together
  for (const wf of d.wingForms || []) {
    if (Array.isArray(wf.tips)) wf.tips = wf.tips.map(([x, y]) => [x * p.wingSpan, y * p.wingChord]);
    if (Array.isArray(wf.lead)) wf.lead = [wf.lead[0] * p.wingSpan, wf.lead[1] * p.wingChord];
    if (typeof wf.scallop === 'number') wf.scallop *= p.scallop;
    if (wf.arc && typeof wf.arc.hump === 'number') wf.arc.hump *= p.archHump;
  }
  return d;
}

// A few DELIBERATE anchors so every sheet contains known reference points for the eye.
function anchors() {
  return [
    { label: 'BASELINE', p: { ...NEUTRAL } },
    { label: 'ribbon+tube (bad)', p: { ...NEUTRAL, wingChord: 0.6, wingSpan: 1.25, bodyGirth: 0.75, scallop: 0.5, spineArch: 0.3 } },
    { label: 'deep-chord fan', p: { ...NEUTRAL, wingChord: 1.45, wingSpan: 0.95, scallop: 1.9, archHump: 1.6 } },
    { label: 'deep belly S', p: { ...NEUTRAL, bodyGirth: 1.3, spineArch: 1.6, bodyStretch: 0.95 } },
  ];
}

// --- tiny 3x5 bitmap digits so each cell is self-labelled on the sheet ------------------------
const FONT = { // rows top→bottom, 3 cols, bit = pixel
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
};
function stampInt(rgba, W, n, ox, oy, scale, rgb) {
  const s = String(n);
  for (let ci = 0; ci < s.length; ci++) {
    const g = FONT[s[ci]]; if (!g) continue;
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r][c] === '1')
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const x = ox + (ci * 4 + c) * scale + dx, y = oy + r * scale + dy, i = (y * W + x) * 4;
        rgba[i] = rgb[0]; rgba[i + 1] = rgb[1]; rgba[i + 2] = rgb[2]; rgba[i + 3] = 255;
      }
  }
}

// --- main -------------------------------------------------------------------------------------
function parseArgs() {
  const a = { key: process.argv[2] || 'toothless', n: 16, views: ['side', 'top'], seed: 1, tier: undefined, out: null };
  for (const arg of process.argv.slice(3)) {
    const mm = arg.match(/^--(\w+)=(.+)$/); if (!mm) continue;
    if (mm[1] === 'n') a.n = +mm[2]; else if (mm[1] === 'views') a.views = mm[2].split(',');
    else if (mm[1] === 'seed') a.seed = +mm[2]; else if (mm[1] === 'tier') a.tier = +mm[2]; else if (mm[1] === 'out') a.out = mm[2];
  }
  return a;
}

const A = parseArgs();
const raw = DRAGONS[A.key];
if (!raw) { console.error(`unknown dragon '${A.key}'`); process.exit(1); }
const tier = A.tier != null ? A.tier : maxTierFor(A.key);
const rnd = lcg(A.seed);
const CELL = 300, PAD = 6, LABELCOL = 118; // px

// Build the variant list: anchors first, then sampled variety.
const variants = anchors();
while (variants.length < A.n) {
  const p = {};
  for (const [k, [lo, hi]] of Object.entries(AXES)) p[k] = lo + rnd() * (hi - lo);
  variants.push({ label: '', p });
}
variants.length = A.n;

// Render + measure every variant × view.
const rows = [];
for (let i = 0; i < variants.length; i++) {
  const { label, p } = variants[i];
  const def = ascendedDef(applyVariant(raw, p), tier, 0);
  const cells = [], allFails = [];
  for (const view of A.views) {
    const res = renderSilhouetteDef({ def, view, W: CELL, H: CELL, name: A.key });
    const m = computeMetrics(res, view);
    const fails = scoreView(m);
    allFails.push(...fails.map(f => `${view}:${f}`));
    cells.push({ view, buf: res.buf, m, adv: advisory(m) });
  }
  rows.push({ i, label, p, cells, fails: allFails, pass: allFails.length === 0 });
}

// Compose the contact sheet: LABELCOL | one column per view.
const cols = A.views.length;
const sheetW = LABELCOL + cols * (CELL + PAD) + PAD;
const sheetH = PAD + variants.length * (CELL + PAD);
const rgba = Buffer.alloc(sheetW * sheetH * 4);
for (let i = 0; i < rgba.length; i += 4) { rgba[i] = 16; rgba[i + 1] = 18; rgba[i + 2] = 26; rgba[i + 3] = 255; } // dark bg

for (let r = 0; r < rows.length; r++) {
  const row = rows[r], oy = PAD + r * (CELL + PAD);
  // pass/fail band down the label column
  const band = row.pass ? [46, 160, 90] : [176, 54, 54];
  for (let y = oy; y < oy + CELL; y++) for (let x = 4; x < 12; x++) { const i = (y * sheetW + x) * 4; rgba[i] = band[0]; rgba[i + 1] = band[1]; rgba[i + 2] = band[2]; }
  stampInt(rgba, sheetW, row.i, 18, oy + 8, 5, [235, 235, 245]);
  // draw each view's silhouette (coverage → light-on-dark)
  for (let c = 0; c < row.cells.length; c++) {
    const { buf } = row.cells[c], ox = LABELCOL + PAD + c * (CELL + PAD);
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
      const v = buf[y * CELL + x]; if (!v) continue;
      const i = ((oy + y) * sheetW + (ox + x)) * 4; rgba[i] = 210; rgba[i + 1] = 220; rgba[i + 2] = 235; rgba[i + 3] = 255;
    }
  }
}

const outPath = A.out || `/tmp/gallery-${A.key}.png`;
writeFileSync(outPath, pngRGBA(sheetW, sheetH, rgba));

// stdout table (the key the human reads alongside the sheet)
console.log(`\nGALLERY  ${raw.name || A.key} · tier ${tier} · ${variants.length} variants · views ${A.views.join(',')}`);
console.log(`sheet → ${outPath}  (${sheetW}×${sheetH})`);
console.log('idx  P/F  ' + Object.keys(AXES).map(k => k.slice(0, 5).padStart(6)).join('') + '  | advisory (sideAsp/solid · wAsp)   notes');
for (const row of rows) {
  const pv = Object.keys(AXES).map(k => row.p[k].toFixed(2).padStart(6)).join('');
  const tag = row.pass ? ' ok ' : 'FAIL';
  const side = row.cells.find(c => c.view === 'side')?.adv || {};
  const top = row.cells.find(c => c.view === 'top' || c.view === 'threeq' || c.view === 'rear')?.adv || {};
  const adv = `${(side.aspect ?? 0).toFixed(1)}/${(side.solidity ?? 0).toFixed(2)} · ${(top.wAspect ?? 0).toFixed(1)}`;
  console.log(`${String(row.i).padStart(3)}  ${tag} ${pv}  | ${adv.padEnd(18)} ${row.label || ''}${row.fails.length ? '  ✗ ' + row.fails.join(' | ') : ''}`);
}
console.log('\nHUMAN: name the index(es) whose OUTLINE you like (or "none — more X"). The AI does not pick.');
