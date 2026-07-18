// Count SATURATED-TEAL pixels (the HUD arc signature: G >> R, cyan-bright) inside a bbox.
// node tools/_arcprobe.mjs <png> x0 y0 x1 y1
import { readFileSync } from 'fs';
import zlib from 'zlib';
const [png,x0,y0,x1,y1] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const buf = readFileSync(png);
// minimal PNG decode (assume 8-bit RGBA, single IDAT concat)
let p=8, W=0,H=0, idat=[];
while(p<buf.length){ const len=buf.readUInt32BE(p); const type=buf.toString('ascii',p+4,p+8);
  if(type==='IHDR'){ W=buf.readUInt32BE(p+8); H=buf.readUInt32BE(p+12); }
  else if(type==='IDAT'){ idat.push(buf.subarray(p+8,p+8+len)); }
  else if(type==='IEND') break; p+=12+len; }
const raw=zlib.inflateSync(Buffer.concat(idat));
const stride=W*4+1; const px=(x,y)=>{ const o=y*stride+1+x*4; return [raw[o],raw[o+1],raw[o+2]]; };
// unfilter (Paeth/Sub/Up etc.) — do a proper unfilter
const out=Buffer.alloc(W*H*4); const bpp=4;
for(let y=0;y<H;y++){ const f=raw[y*stride]; for(let x=0;x<W*4;x++){ const i=y*stride+1+x; let a=x>=bpp?out[y*W*4+x-bpp]:0; let b=y>0?out[(y-1)*W*4+x]:0; let c=(x>=bpp&&y>0)?out[(y-1)*W*4+x-bpp]:0; let v=raw[i];
  if(f===1)v=(v+a)&255; else if(f===2)v=(v+b)&255; else if(f===3)v=(v+((a+b)>>1))&255; else if(f===4){const pp=a+b-c;const pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255;} out[y*W*4+x]=v; } }
const g=(x,y)=>{ const o=(y*W+x)*4; return [out[o],out[o+1],out[o+2]]; };
let teal=0, tot=0;
for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){ tot++; const [r,gg,b]=g(x,y);
  if(gg-r>45 && b-r>15 && gg>120) teal++; }
console.log(`${png} bbox[${x0},${y0},${x1},${y1}] W=${W}H=${H}: teal-arc px = ${teal}/${tot} (${(100*teal/tot).toFixed(2)}%)`);
