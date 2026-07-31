// FAIRING ISOLATION PASS — built by the art director because it was asked for twice and
// never shipped. Renders, per pose, at the JUNCTION camera and at the REAR-CHASE camera:
//   <out>/iso-<pose>-<cam>-full.png   the normal render
//   <out>/iso-<pose>-<cam>-fair.png   fairing meshes ONLY (everything else hidden)
//   <out>/iso-<pose>-<cam>-nofair.png fairing hidden (what the flank looks like under it)
// A per-pixel fairing mask is what every B1/B2/B4 measurement needs; without it a critic is
// eyeballing a dark-on-dark boundary and calling it a number.
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { serve } from '../tests/serve.mjs';

const require = createRequire(import.meta.url);
const pw = (() => {
  const c = [process.env.PLAYWRIGHT_PATH];
  try { c.push(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim() + '/playwright'); } catch {}
  c.push('playwright');
  for (const x of c) { if (!x) continue; try { return require(x); } catch {} }
  throw new Error('playwright not found');
})();

const OUT = process.argv[2];
const TIER = Number(process.argv[3] ?? 3);
mkdirSync(OUT, { recursive: true });

const srv = await serve();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('PAGEERR', e.message));
await page.goto(`${srv.url}/tools/dragonstudio.html`);
await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

// size the GL canvas to 1000px square
await page.evaluate(() => { window.dsSheetInit(1, 1, 1000); });

// in-page helpers
await page.addScriptTag({ content: `
window.dsIso = (mode) => {
  const g = window.__dd.group();
  g.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.__isoVis === undefined) o.userData.__isoVis = o.visible;
    const tag = o.userData && (o.userData.fornaxPart || o.userData.bodyPart);
    if (mode === 'all') o.visible = o.userData.__isoVis;
    else if (mode === 'fair') o.visible = o.userData.__isoVis && tag === 'fairing';
    else if (mode === 'nofair') o.visible = o.userData.__isoVis && tag !== 'fairing';
    else if (mode.startsWith('hex:')) o.visible = o.userData.__isoVis && tag === 'fairing' && ('#'+o.material.color.getHexString()) === mode.slice(4);
  });
  window.__dd.renderer.render(window.__dd.scene, window.__dd.camera);
  return true;
};
window.dsFairCensus = () => {
  const g = window.__dd.group(); const out = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    const tag = o.userData && (o.userData.fornaxPart || o.userData.bodyPart);
    if (tag !== 'fairing') return;
    const n = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
    out.push({ hex: '#' + o.material.color.getHexString(), tris: n });
  });
  return out;
};
`});

const POSES = ['glide', 'settle', 'downstroke', 'bank'];
const CAMS = [
  ['junction', { part: 'junction' }],
  ['rear', { part: 'whole' }],
  ['side', { part: 'wing' }],
];

const grab = async () => {
  const d = await page.evaluate(() => document.getElementById('gl').toDataURL('image/png'));
  return Buffer.from(d.split(',')[1], 'base64');
};
for (const pose of POSES) {
  for (const [camName, camOpt] of CAMS) {
    await page.evaluate((o) => window.dsCrop(o), { key: 'fornax', tier: TIER, bg: 'pale', pose, ...camOpt });
    const MODES = [['all','full'],['fair','fair'],['nofair','nofair'],
      ['hex:#54504c','scorch'],['hex:#2a2a2c','char'],['hex:#1e1e20','seam'],['hex:#bdb6ac','rim']];
    for (const [mode, name] of MODES) {
      await page.evaluate((m) => window.dsIso(m), mode);
      const p = `${OUT}/iso-${pose}-${camName}-${name}.png`;
      writeFileSync(p, await grab());
      console.log('wrote', p);
    }
    await page.evaluate(() => window.dsIso('all'));
  }
}
// FREE-EDGE SCREEN TRACE: project the fairing's free-edge ring vertices into the shipped
// rear-chase frame and report peak/valley amplitude in PIXELS.
await page.addScriptTag({ content: `
window.dsFreeEdge = () => {
  const g = window.__dd.group(), cam = window.__dd.camera, gl = document.getElementById('gl');
  const pts = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    const tag = o.userData && (o.userData.fornaxPart || o.userData.bodyPart);
    if (tag !== 'fairing') return;
    if ('#'+o.material.color.getHexString() !== '#bdb6ac') return;   // the RIM strip == the free edge
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new (window.__dd.scene.constructor.prototype.constructor ? Object : Object)();
      const p3 = { x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) };
      pts.push(p3);
    }
  });
  return pts;
};
window.dsProjectFair = () => {
  const THREEV = window.__dd.camera.position.constructor;
  const g = window.__dd.group(), cam = window.__dd.camera, gl = document.getElementById('gl');
  const out = [];
  g.traverse((o) => {
    if (!o.isMesh) return;
    const tag = o.userData && (o.userData.fornaxPart || o.userData.bodyPart);
    if (tag !== 'fairing') return;
    if ('#'+o.material.color.getHexString() !== '#bdb6ac') return;
    const pos = o.geometry.attributes.position;
    o.updateWorldMatrix(true, false);
    for (let i = 0; i < pos.count; i++) {
      const v = new THREEV(pos.getX(i), pos.getY(i), pos.getZ(i));
      v.applyMatrix4(o.matrixWorld);
      const world = [v.x, v.y, v.z];
      v.project(cam);
      out.push({ world, sx: (v.x*0.5+0.5)*gl.width, sy: (-v.y*0.5+0.5)*gl.height });
    }
  });
  return out;
};
`});
await page.evaluate((o) => window.dsRender(o), { key: 'fornax', tier: TIER, state: 'glide', bg: 'pale', angle: 'rear' });
const rearPts = await page.evaluate(() => window.dsProjectFair());
writeFileSync(`${OUT}/freeedge-rear.json`, JSON.stringify(rearPts));
await page.evaluate((o) => window.dsRender(o), { key: 'fornax', tier: TIER, state: 'glide', bg: 'pale', angle: 'side' });
const sidePts = await page.evaluate(() => window.dsProjectFair());
writeFileSync(`${OUT}/freeedge-side.json`, JSON.stringify(sidePts));
console.log('projected free-edge verts', rearPts.length);
console.log('FAIRING MESH CENSUS', JSON.stringify(await page.evaluate(() => window.dsFairCensus())));
await browser.close(); srv.close?.();
