import { boot } from '../tests/browser.mjs';
const key='jade'; const VIEW={width:1000,height:800};
const save=`localStorage.setItem('dragonDriftSave', JSON.stringify({v:2,embers:50,stats:{runs:5},skins:{owned:['${key}'],equipped:'${key}'},ascension:{tiers:[['${key}',2]],radiance:[]},cosmetics:{marksOwned:[],markEquipped:'',formPref:[]},flags:{seenFirstSurge:true,hintsSeen:9},settings:{reticle:false,slowMo:false,qualityOverride:null}}))`;
const { page, done, errors } = await boot({ query:'?debug&cleanshot', viewport:VIEW, deviceScaleFactor:1, initScript:save });
await page.waitForSelector('#btn-start',{state:'attached'}).catch(()=>{});
await page.evaluate(()=>document.querySelector('#btn-start')?.click());
await page.waitForFunction(()=>window.__dd?.game?.state==='playing',{timeout:10000});
await page.waitForTimeout(2200);
const setCam=(ox,oy,oz,lx,ly,lz)=>page.evaluate(([ox,oy,oz,lx,ly,lz])=>{const dd=window.__dd,p=dd.player;dd.cameraCtl.update=()=>{dd.camera.position.set(p.position.x+ox,p.position.y+oy,p.position.z+oz);dd.camera.lookAt(p.position.x+lx,p.position.y+ly,p.position.z+lz);};},[ox,oy,oz,lx,ly,lz]);
// tight on the head+neck: head sits near group origin, body trails +z; rider just behind head
await setCam(2.6,1.3,2.0,-0.3,0.1,0.2); await page.waitForTimeout(250);
await page.screenshot({path:'/tmp/hero-jade-head.png'});
console.log(errors.length?'! '+errors.slice(0,2).join(' | '):'ok');
await done();
