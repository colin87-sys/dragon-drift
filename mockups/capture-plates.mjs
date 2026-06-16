import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'renders');
const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await p.goto('http://localhost:8011/reforged/index.html',{waitUntil:'load'});
await p.waitForTimeout(3200);
await p.keyboard.press('Enter'); await p.waitForTimeout(700);
await p.keyboard.press('Enter'); await p.waitForTimeout(900);
await p.addStyleTag({content:'#hud{opacity:0!important;visibility:hidden!important}'});
await p.keyboard.down('Space');
const names=['a','b','c','d','e','f','g','h'];
for(let i=0;i<names.length;i++){
  const k = i%2 ? 'ArrowLeft':'ArrowRight';
  await p.keyboard.down(k); await p.waitForTimeout(450); await p.keyboard.up(k);
  await p.waitForTimeout(2600);
  await p.screenshot({path: join(out, `plate-${names[i]}.png`)});
}
await p.keyboard.up('Space');
await b.close(); console.log('done');
