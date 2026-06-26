// Wing QA overlay (self-consistent). Extracts the REFERENCE planform's own leading +
// trailing edges from the image pixels, then overlays the Monarch's wing anatomy
// (leadingCurve + fingertips) CENTERED the same way, so the SHAPE match is visible and
// numeric. Prints a per-span leading-chord comparison (ref vs ours, both relative to the
// wing's own chord centre) so convexity can be tuned with numbers.
//   node tools/wingoverlay.mjs [refPath] -> /tmp/wing-qa.png + table
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
function loadPW(){const c=[process.env.PLAYWRIGHT_PATH];try{c.push(execSync('npm root -g',{encoding:'utf8'}).trim()+'/playwright');}catch{}c.push('playwright');for(const x of c){if(!x)continue;try{return require(x);}catch{}}throw new Error('no pw');}
const { chromium } = loadPW(); const fs = await import('fs');
const refPath = process.argv[2] || '/root/.claude/uploads/7dcf8b04-42e1-52a1-aebf-e2c4dec306b0/0cba6fa0-AB9E8AF08C4C45429296283A6EC103E2.png';
const b64 = fs.readFileSync(refPath).toString('base64');
// keep in sync with dragonFlameMonarch.js monarchWing anatomy:
const LEAD = [[0,0.34],[0.4,0.43],[0.8,0.42],[1.2,0.68],[1.6,0.98],[2.0,1.11],[2.4,1.15],[2.8,1.12],[3.2,1.06],[3.6,0.98],[4.0,0.87],[4.4,0.71],[4.8,0.55],[5.2,0.38],[5.4,0.20]];
const TIPS = [[0,-0.45],[0.4,-0.93],[0.8,-1.39],[1.2,-1.57],[1.6,-1.71],[2.0,-1.28],[2.4,-1.13],[2.8,-1.14],[3.2,-0.54],[3.6,-0.33],[4.0,-0.38],[4.4,0.12],[4.8,0.21],[5.2,0.17],[5.4,0.20]];
const ROOTBACK=[0,-0.62], WRIST=[0.90,0.42];
const browser = await chromium.launch(); const page = await browser.newPage();
const R = await page.evaluate(async ({b64,LEAD,TIPS,ROOTBACK,WRIST})=>{
  const im=new Image(); im.src='data:image/png;base64,'+b64; await im.decode();
  const W=im.naturalWidth,H=im.naturalHeight; const cv=document.createElement('canvas'); cv.width=W;cv.height=H;
  const ctx=cv.getContext('2d'); ctx.drawImage(im,0,0); const d=ctx.getImageData(0,0,W,H).data;
  const wing=(x,y)=>{const i=(y*W+x)*4,r=d[i],g=d[i+1],b=d[i+2]; return r>42&&r>b+10&&r>=g-6;};
  let axis=W/2,bc=-1; for(let x=0;x<W;x++){let c=0;for(let y=0;y<H;y++){const i=(y*W+x)*4;if(d[i]>185&&d[i+1]>120&&d[i+2]<150)c++;}if(c>bc){bc=c;axis=x;}}
  const cols=[]; for(let x=4;x<axis-28;x++){let t=-1,b=-1,n=0;for(let y=0;y<H;y++){if(wing(x,y)){if(t<0)t=y;b=y;n++;}}if(t>=0&&(b-t)>8&&n>6)cols.push({x,top:t,bot:b});}
  cols.sort((a,b)=>a.x-b.x);
  const med=(a,i,k,key)=>{const v=[];for(let j=Math.max(0,i-k);j<=Math.min(a.length-1,i+k);j++)v.push(a[j][key]);v.sort((x,y)=>x-y);return v[v.length>>1];};
  for(let i=0;i<cols.length;i++){const mt=med(cols,i,6,'top');if(Math.abs(cols[i].top-mt)>45)cols[i].top=mt;const mb=med(cols,i,6,'bot');if(Math.abs(cols[i].bot-mb)>55)cols[i].bot=mb;}
  for(let p=0;p<2;p++)for(let i=0;i<cols.length;i++){cols[i].top=med(cols,i,4,'top');cols[i].bot=med(cols,i,4,'bot');}
  const tipX=cols[0].x, rootX=cols[cols.length-1].x, SPAN=5.4, scale=(rootX-tipX)/SPAN;
  // reference chord centre at mid-span (clean) = origin for BOTH curves
  const mid=cols[Math.floor(cols.length*0.5)]; const refCenY=(mid.top+mid.bot)/2;
  const at=(x)=>{let b=cols[0],bd=1e9;for(const c of cols){const dd=Math.abs(c.x-x);if(dd<bd){bd=dd;b=c;}}return b;};
  // ref leading/trailing sampled (span,chord rel to its own centre, +chord=up)
  const refLead=[],refTrail=[]; for(let k=0;k<=12;k++){const x=Math.round(rootX-(rootX-tipX)*k/12);const c=at(x);refLead.push([+( (rootX-x)/scale).toFixed(2), +((refCenY-c.top)/scale).toFixed(2)]);refTrail.push([+((rootX-x)/scale).toFixed(2),+((refCenY-c.bot)/scale).toFixed(2)]);}
  // OUR curves centred on OUR own mean chord, then placed at refCenY for shape compare
  const all=[...LEAD,...TIPS]; const ourCen=all.reduce((s,p)=>s+p[1],0)/all.length;
  const mapRef=([s,c])=>[rootX-s*scale, refCenY-c*scale];
  const mapOur=([s,c])=>[rootX-s*scale, refCenY-(c-ourCen)*scale];
  // draw ref edges (cyan) and our edges (green lead / yellow trail) + points
  function poly(pts,col,map,wd){ctx.lineWidth=wd;ctx.strokeStyle=col;ctx.beginPath();pts.forEach((p,i)=>{const[x,y]=map(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
  poly(refLead,'#00e5ff',mapRef,3); poly(refTrail,'#00bcd4',mapRef,3);          // reference (extracted)
  poly(LEAD,'#39ff14',mapOur,4); poly([LEAD[LEAD.length-1],...TIPS,ROOTBACK],'#ffd000',mapOur,4); // ours
  ctx.fillStyle='#fff'; for(const p of [...LEAD,...TIPS,WRIST]){const[x,y]=mapOur(p);ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();}
  // numeric compare: leading chord rel to centre, ref vs ours, at common spans
  const ourLeadAt=(s)=>{for(let i=0;i<LEAD.length-1;i++){if(s>=LEAD[i][0]&&s<=LEAD[i+1][0]){const t=(s-LEAD[i][0])/(LEAD[i+1][0]-LEAD[i][0]);return (LEAD[i][1]+(LEAD[i+1][1]-LEAD[i][1])*t)-ourCen;}}return LEAD[LEAD.length-1][1]-ourCen;};
  const table=refLead.map(([s,c])=>`s=${s.toFixed(1)}  ref=${c.toFixed(2)}  ours=${ourLeadAt(s).toFixed(2)}  d=${(ourLeadAt(s)-c).toFixed(2)}`);
  return { url:cv.toDataURL('image/png'), table, refPeak:refLead.reduce((a,b)=>b[1]>a[1]?b:a), ourCen:+ourCen.toFixed(2), refLead, refTrail };
}, {b64,LEAD,TIPS,ROOTBACK,WRIST});
await browser.close();
fs.writeFileSync('/tmp/wing-qa.png', Buffer.from(R.url.split(',')[1],'base64'));
console.log('LEADING chord vs reference (relative to wing chord centre, +=forward):');
R.table.forEach(t=>console.log('  '+t));
console.log('ref leading peak (span,chord):',R.refPeak,' our chord-centre offset:',R.ourCen);
console.log('REF lead (span,chord relCentre):',JSON.stringify(R.refLead));
console.log('REF trail(span,chord relCentre):',JSON.stringify(R.refTrail));
console.log('wrote /tmp/wing-qa.png');
