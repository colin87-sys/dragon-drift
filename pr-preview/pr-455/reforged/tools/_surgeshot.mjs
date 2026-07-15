import { boot } from '../tests/browser.mjs';
const key='tempest', tier=3;
const { page, done } = await boot({
  query: `?debug=fever&wingDebug=recovery`,
  viewport: { width: 1100, height: 720 }, deviceScaleFactor: 2,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v:2, embers:50, skins:{owned:['${key}'],equipped:'${key}'}, ascension:{tiers:[['${key}',${tier}]],radiance:[]}, cosmetics:{marksOwned:[],markEquipped:'',formPref:[]}, flags:{seenFirstSurge:true,hintsSeen:9}, settings:{reticle:false,slowMo:true,qualityOverride:null} }))`,
});
for (let a=0;a<6;a++){ await page.click('#btn-start').catch(()=>{}); if (await page.waitForSelector('#btn-start',{state:'hidden',timeout:1500}).then(()=>true,()=>false)) break; }
await page.waitForTimeout(2500);
for (let i=0;i<4;i++){ await page.screenshot({ path:`/tmp/surge-tempest-${i}.png`, clip:{x:300,y:250,width:500,height:360} }); console.log('shot',i); await page.waitForTimeout(280); }
await done();
