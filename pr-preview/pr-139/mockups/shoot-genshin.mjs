import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:980,height:420}, deviceScaleFactor:2 });
await p.goto('file://'+join(here,'surge-genshin.html'));
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(500);
await p.screenshot({ path: join(here,'renders','surge-genshin.png') });
await b.close(); console.log('done');
