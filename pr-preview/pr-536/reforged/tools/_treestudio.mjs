// tools/_treestudio.mjs — isolated studio + machine-probe rig for the Ghost Sakura hero tree
// (Empyrean Ghost Orchard P2). Renders a contact sheet (front/side/¾/top + 60m cruise + monolith
// family shot) on the pale Empyrean field, plus rigorous probes BEFORE any Fable gate:
//   tris (trunk/canopy ≤150), sky-gaps (flood-fill hole count ≥2 @ ≥1.5%), rose coverage (≤20%),
//   dark floor (p01 luminance ≥ ~173 = L68), warm/green pixels (= 0).
//   node tools/_treestudio.mjs [seed]   → /tmp/treestudio-*.png
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => { const c=[process.env.PLAYWRIGHT_PATH]; try{c.push(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim()+'/playwright');}catch{} c.push('playwright'); for(const x of c){ if(!x) continue; try{return require(x);}catch{} } throw new Error('playwright not found'); })();

const seed = +(process.argv[2] || 3);
const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
await page.goto(`${srv.url}/tools/_treestudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
const err = await page.evaluate(() => document.getElementById('err').textContent);
if (err) { console.error('STUDIO ERROR:', err); await browser.close(); srv.close?.(); process.exit(1); }

const tris = await page.evaluate((s) => window.tsBuild(s), seed);
console.log(`GHOST SAKURA TREE STUDIO — seed ${seed}`);
console.log(`  [tris] trunk=${tris.trunkTris} canopy=${tris.canopyTris}  (bar: each ≤150)`);

const shot = async (name, opts) => { await page.evaluate((o) => window.tsRender(o), opts); const b64 = await page.evaluate(() => window.tsPNG()); writeFileSync(`/tmp/treestudio-${name}.png`, Buffer.from(b64, 'base64')); };

// contact sheet on the pale field
for (const a of ['front', 'side', 'q34', 'top']) await shot(a, { angle: a, bg: 'field', fill: 0.72 });
// 60m cruise read + family shot beside a monolith
await shot('cruise', { angle: 'q34', bg: 'field', cruise: 60, fill: 0.5 });
await shot('family', { angle: 'front', bg: 'field', withMono: true, fill: 0.62 });

// PROBES
const color = await page.evaluate(() => window.tsColorProbe());
console.log(`  [color] rosePct=${color.rosePct}% (≤20) warmGreen=${color.warmGreen} (=0) p01L=${color.p01L} minL=${color.minL} (≥173=L68) treePx=${color.treePx}`);

// sky-gap probe: canopy-only on the green key, from side + ¾
for (const a of ['side', 'q34']) {
  await page.evaluate((o) => window.tsRender(o), { angle: a, bg: 'key', canopyOnly: true, fill: 0.74 });
  const gap = await page.evaluate(() => window.tsGapProbe());
  console.log(`  [sky-gap ${a}] holes≥1.5%=${gap.holes} (≥2) notchFrac=${gap.notchFrac}% (blob<8, airy≥14) fillFrac=${gap.fillFrac} sizes=[${gap.sizes}]`);
}

await browser.close(); srv.close?.();
console.log('  wrote /tmp/treestudio-{front,side,q34,top,cruise,family}.png');
