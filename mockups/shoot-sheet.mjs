import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1160,height:960}, deviceScaleFactor:1.3 });
await p.goto('file://'+join(here,'renders','sheet.html')); await p.waitForTimeout(400);
await p.screenshot({ path: join(here,'renders','plate-sheet.png'), fullPage:true });
await b.close(); console.log('done');
