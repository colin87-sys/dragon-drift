import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:680,height:760}, deviceScaleFactor:2 });
await p.goto('file://'+join(here,'minimal.html'));
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500);
await p.screenshot({ path: join(here,'renders','minimal.png') });
await b.close(); console.log('done');
