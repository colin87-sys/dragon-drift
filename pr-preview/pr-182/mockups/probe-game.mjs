import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'renders');

const browser = await chromium.launch({
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
});

async function plate(name, w, h, flyMs){
  const page = await browser.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:2 });
  await page.goto('http://localhost:8011/index.html', { waitUntil:'load' });
  await page.waitForTimeout(3200);
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
  await page.keyboard.down('Space'); await page.waitForTimeout(flyMs); await page.keyboard.up('Space');
  // hide the old HUD + reticle so we have a clean plate to overlay on
  await page.addStyleTag({ content: '#hud,#reticle{opacity:0!important;visibility:hidden!important}' });
  await page.waitForTimeout(120);
  await page.screenshot({ path: join(out, name) });
  await page.close();
}

await plate('plate-port.png', 390, 844, 2600);
await plate('plate-land.png', 844, 390, 3000);
console.log('done');
await browser.close();
