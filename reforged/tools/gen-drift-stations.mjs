// gen-drift-stations — derive the driftBody torso loft stations from the user's
// clean master silhouette trace. Reads refs/master-trace-tb.json (top/bot envelope
// of the full-dragon trace), reads off a dorsal BACK arch + the belly = bot[x], and
// emits driftBodyStations.js (stations [z,halfWidth,keelTop,belly,cy]). The side
// projection of the loft (cy±keel/belly) reconstructs the traced body envelope.
//   node tools/gen-drift-stations.mjs   (run from reforged/)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const M=JSON.parse(readFileSync(join(ROOT,'refs','master-trace-tb.json'),'utf8'));
const bot=M.bot;
// dorsal/back anchor line (nub base + head), head->tail, read off the master
const BACK=[[1345,872],[1300,818],[1250,798],[1200,786],[1140,762],[1070,745],[1000,762],[900,792],[800,820],[700,850],[600,882],[510,910],[420,936],[345,958]];
const ib=(a,x)=>{if(x>=a[0][0])return a[0][1];if(x<=a[a.length-1][0])return a[a.length-1][1];for(let i=0;i<a.length-1;i++){const p=a[i],q=a[i+1];if(x<=p[0]&&x>=q[0])return p[1]+(q[1]-p[1])*((p[0]-x)/(p[0]-q[0]));}};
const XT0=345, XT1=1362, PXPU=205, BASEMID=858, WID=0.6;
const Z=(x)=>-3.2 + (XT1-x)/(XT1-XT0)*7.4;
const tailThk=(x)=>{const t=(560-x)/(560-XT0);return 34 - t*22;};
const belly=(x,bk)=> x<560 ? bk+Math.max(10,tailThk(x)) : (bot[x]!=null?Math.min(bot[x], bk+260):bk+150);
const N=42, st=[];
for(let k=0;k<N;k++){const x=Math.round(XT1-(XT1-XT0)*k/(N-1));const bk=ib(BACK,x),bl=belly(x,bk),mid=(bk+bl)/2;
  const keelTop=Math.max(0.02,(mid-bk)/PXPU),bv=Math.max(0.02,(bl-mid)/PXPU),ry=keelTop+bv;
  st.push([+Z(x).toFixed(2),+(Math.max(0.03,WID*ry)).toFixed(3),+keelTop.toFixed(3),+bv.toFixed(3),+(((BASEMID-mid)/PXPU)).toFixed(3)]);}
writeFileSync(join(ROOT,'js','driftBodyStations.js'),
`// AUTO-GENERATED from refs/master-silhouette.png (the user's clean full trace).
export const DRIFT_STATIONS = ${JSON.stringify(st)};
export const DRIFT_KEEL = ${JSON.stringify(st.filter((_,i)=>i%4===0).map(s=>[s[0],s[2]]))};
`);
console.log('snout ry',(st[0][2]+st[0][3]).toFixed(2),'chest ry',(st[13][2]+st[13][3]).toFixed(2),'tail ry',(st[N-1][2]+st[N-1][3]).toFixed(2));
