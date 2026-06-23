// Headless IN-GAME screenshot: boots the real game with forced Dragon Surge (?debug=fever),
// equips each dragon via the __dd.equip test seam, starts a run, and shoots the chase cam —
// so surge particle FX (afterburner sprites) are captured. node tools/ingameShot.mjs [keys...]
import { serve } from '../tests/serve.mjs';
import { createRequire } from 'module'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let chromium; try{({chromium}=require(execSync('npm root -g',{encoding:'utf8'}).trim()+'/playwright'));}catch{({chromium}=require('playwright'));}
const OUT='/tmp/claude-0/-home-user-dragon-drift/cd760551-875c-5e57-b004-41dad2f0ba77/scratchpad';
const keys = process.argv.slice(2).length ? process.argv.slice(2) : ['aurumToroMk2','svjMecha'];
const srv = await serve();
const b = await chromium.launch({ args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'] });
for (const key of keys) {
  const p = await b.newPage({ viewport:{ width:960, height:600 }, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(`${srv.url}/?dev&debug=fever`, { waitUntil:'load' });
  await p.waitForFunction(()=>window.__dd, { timeout:15000 }).catch(()=>{});
  await p.evaluate((k)=>{ window.__dd.toHub && window.__dd.toHub(); window.__dd.equip && window.__dd.equip(k); }, key);
  await p.waitForTimeout(300);
  await p.evaluate(()=>window.__dd.play && window.__dd.play());
  await p.waitForTimeout(2200);                    // fly + forced fever → afterburner emits
  await p.evaluate(()=>{ const d=window.__dd; if(d&&d.game){ d.game.feverActive=true; d.game.feverTimer=999; } });
  await p.waitForTimeout(800);
  const state = await p.evaluate(()=>({ st: window.__dd.game.state, fever: window.__dd.game.feverActive }));
  await p.screenshot({ path:`${OUT}/ingame-${key}.png` });
  console.log(`${key}: state=${state.st} fever=${state.fever} errs=${errs.slice(0,2).join('|')}`);
  await p.close();
}
await b.close(); await srv.close?.();
