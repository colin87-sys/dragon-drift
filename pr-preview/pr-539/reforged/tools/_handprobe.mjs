import { register } from 'node:module';
register('./three-resolver.mjs', import.meta.url);
const ctx2d = { createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
  fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, arc() {}, moveTo() {}, lineTo() {}, closePath() {},
  fill() {}, stroke() {}, set fillStyle(v) {}, set strokeStyle(v) {}, set shadowColor(v) {}, set shadowBlur(v) {}, set lineWidth(v) {}, set globalAlpha(v) {}, set lineCap(v) {} };
globalThis.window = globalThis;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
globalThis.document = { hidden:false, addEventListener(){}, removeEventListener(){}, createElement: () => ({ width:0,height:0,getContext:()=>ctx2d }) };
if (!globalThis.localStorage) { const s=new Map(); globalThis.localStorage={getItem:k=>s.get(k)??null,setItem:(k,v)=>s.set(k,String(v)),removeItem:k=>s.delete(k),clear:()=>s.clear()}; }
if (!globalThis.location) globalThis.location={search:'',origin:'http://test',pathname:'/'};
if (!globalThis.navigator) globalThis.navigator={userAgent:'node'};
const THREE = await import('three');
const { DRAGONS } = await import('../js/dragons.js');
const { ascendedDef } = await import('../js/ascension.js');
const { buildDragonModel } = await import('../js/dragonModel.js');
const { setFlapDebugPose } = await import('../js/wingDebugPose.js');
const def = ascendedDef(DRAGONS['tempest'], 3, 0);
const model = buildDragonModel(def);
const P = model.parts || {};
setFlapDebugPose(P, def.model, 'recovery');
(model.group||model).updateWorldMatrix(true,true);
const w = new THREE.Vector3();
function wp(o,label){ if(!o){console.log(label,'MISSING');return;} o.updateWorldMatrix(true,true); o.getWorldPosition(w); console.log(label.padEnd(14), `x=${w.x.toFixed(3)} y=${w.y.toFixed(3)} z=${w.z.toFixed(3)}`); }
// wrist = tip node origin; wingtip = tipMarker
wp(P.wingMidR,'R forearm');  wp(P.wingMidL,'L forearm');
wp(P.wingTipR,'R wrist');    wp(P.wingTipL,'L wrist');
wp(P.tipMarkerR,'R wingtip'); wp(P.tipMarkerL,'L wingtip');
// local rotations of the tip (hand) node — should be identical for L and R (mirror handled by scale.x=-1)
const r=P.wingTipR?.rotation, l=P.wingTipL?.rotation;
if(r&&l) console.log(`\nR tip rot: x=${r.x.toFixed(3)} y=${r.y.toFixed(3)} z=${r.z.toFixed(3)}\nL tip rot: x=${l.x.toFixed(3)} y=${l.y.toFixed(3)} z=${l.z.toFixed(3)}`);
