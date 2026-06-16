import { chromium } from 'playwright';
import { dirname, join } from 'path'; import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'renders');
const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const p = await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
await p.addInitScript(() => {
  localStorage.setItem('dragonDriftSave', JSON.stringify({
    v:2, embers:99999, highScore:24500, level:20,
    skins:{ owned:['azure','solar'], equipped:'solar' },
    ascension:{ tiers:[['solar',3]], radiance:[['solar',3]] },
    stats:{ runs:30 }
  }));
});
await p.goto('http://localhost:8011/reforged/index.html',{waitUntil:'load'});
await p.waitForTimeout(3400);
await p.keyboard.press('Enter'); await p.waitForTimeout(800);
await p.keyboard.press('Enter'); await p.waitForTimeout(1100);
await p.keyboard.down('Space'); await p.waitForTimeout(1600); await p.keyboard.up('Space');
await p.addStyleTag({content:'#hud{opacity:0!important;visibility:hidden!important}'});
await p.waitForTimeout(120);
await p.screenshot({path: join(out,'plate-solar.png')});
// also a slightly later frame
await p.keyboard.down('Space'); await p.waitForTimeout(1400); await p.keyboard.up('Space');
await p.screenshot({path: join(out,'plate-solar2.png')});
await b.close(); console.log('done');
