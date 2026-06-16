import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:760,height:560}, deviceScaleFactor:2 });
await p.goto('file://'+join(here,'surge-gems.html'));
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500);
await p.screenshot({ path: join(here,'renders','surge-gems.png') });
await b.close(); console.log('done');
