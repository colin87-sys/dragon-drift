import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'renders');
mkdirSync(out, { recursive: true });

const shots = [
  { file: 'splash.html', name: 'splash',        w: 390, h: 844 },
  { file: 'hud.html',    name: 'hud',           w: 390, h: 844 },
  { file: 'hud.html',    name: 'hud-landscape', w: 844, h: 390 },
  { file: 'shop.html',   name: 'shop',          w: 390, h: 844 },
  { file: 'pilot.html',  name: 'pilot',         w: 390, h: 844 },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 });
  await page.goto('file://' + join(here, s.file));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800); // let shine/dots reach a lively frame
  await page.screenshot({ path: join(out, s.name + '.png') });
  await page.close();
  console.log('shot', s.name);
}
await browser.close();
console.log('done');
