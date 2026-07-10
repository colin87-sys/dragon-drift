import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { registerTorso, registerWings, registerHead, registerTail } from './dragonRecipe.js';
import { flatTriMesh } from './mechaKit.js';

const BODY_Y = 0.18;
const GARNET = 0x331016, UMBER = 0x3a2114, PALE_GOLD = 0xe8c58a;
const COPPER = 0x8a4a22, CRIMSON = 0xe0173a, EMBER = 0xd9541a, AMBER = 0xd98a12, ROSE = 0xe83a6a;

function mat(color, emissive = 0, intensity = 0, extra = {}) {
  const m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, flatShading: true, roughness: 0.68, metalness: 0.05, side: THREE.DoubleSide, ...extra });
  if (intensity > 0) { m.userData.baseEmissive = emissive; m.userData.baseIntensity = intensity; }
  return m;
}
function empressMats(def, glow = 1, stage = 3) {
  const st = Math.max(0, Math.min(3, Math.round(stage ?? 3))), g = glow * [0.25, 0.5, 0.75, 1][st];
  return {
    stage: st,
    body: mat(def.body ?? GARNET, 0x160404, 0.06),
    belly: mat(def.belly ?? (st >= 3 ? PALE_GOLD : UMBER), 0x2a1006, st >= 3 ? 0.08 : 0.02),
    copper: mat(COPPER, 0x4a1806, 0.08, { metalness: 0.28, roughness: 0.48 }),
    keel: mat(EMBER, EMBER, [0, 0.55, 0.95, 1.25][st] * g),
    gorget: mat(AMBER, AMBER, [0, 0, 1.15, 1.8][st] * g, { metalness: 0.2, roughness: 0.38 }),
    pinion: mat(0x3a1114, CRIMSON, [0.25, 0.65, 1.05, 1.45][st] * g),
    vane: mat(0x341012, EMBER, [0, 0.45, 0.9, 1.35][st] * g),
    coal: mat(AMBER, AMBER, [0, 0.9, 1.5, 2.2][st] * g, { roughness: 0.22 }),
    dawnCoal: mat(0xffe9c4, 0xffc46a, st >= 3 ? 2.7 * g : 0, { roughness: 0.18 }),
    crest: mat(0x3a1114, ROSE, [0, 0.55, 1.0, 1.45][st] * g),
    eye: mat(def.eye ?? AMBER, AMBER, 1.8 * g),
  };
}
function loft(rings, material, N = 8, cap = true) {
  const P = (r, t) => [(r.cx ?? 0) + Math.cos(t) * r.rx, r.cy + Math.sin(t) * r.ry, r.z];
  const tris = [];
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < N; j++) {
    const a = rings[i], b = rings[i + 1], t0 = j / N * Math.PI * 2, t1 = (j + 1) / N * Math.PI * 2;
    tris.push([P(a, t0), P(b, t1), P(b, t0)], [P(a, t0), P(a, t1), P(b, t1)]);
  }
  if (cap) for (const [r, flip] of [[rings[0], 1], [rings[rings.length - 1], -1]]) for (let j = 0; j < N; j++) {
    const t0 = j / N * Math.PI * 2, t1 = (j + 1) / N * Math.PI * 2;
    tris.push(flip > 0 ? [[0, r.cy, r.z], P(r, t1), P(r, t0)] : [[0, r.cy, r.z], P(r, t0), P(r, t1)]);
  }
  return flatTriMesh(tris, material);
}
function blade(points, material) { return flatTriMesh(points, material); }
function spike(len, rb, rt, material, facets = 5) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, seg(facets)), material); m.geometry.translate(0, len / 2, 0); return m; }

function buildPyreHeartTorso(def, model) {
  const group = new THREE.Group(), M = empressMats(def, model.glowLevel, model.igniteStage);
  const rings = [
    { z: -1.55, rx: 0.28, ry: 0.36, cy: 0.25 }, { z: -1.05, rx: 0.52, ry: 0.72, cy: 0.05 },
    { z: -0.45, rx: 0.58, ry: 0.54, cy: 0.18 }, { z: 0.30, rx: 0.40, ry: 0.38, cy: 0.24 },
    { z: 1.05, rx: 0.25, ry: 0.25, cy: 0.20 }, { z: 1.50, rx: 0.12, ry: 0.13, cy: 0.18 },
  ];
  group.add(loft(rings, M.body, seg(9)));
  const belly = blade([[[-0.24,-0.55,-1.28],[0.24,-0.55,-1.28],[0,-0.78,-0.35]],[[-0.18,-0.45,-0.20],[0,-0.78,-0.35],[0.18,-0.45,-0.20]]], M.belly); group.add(belly);
  const neck = [{ z: -1.45, rx: .28, ry: .30, cy: .35 }, { z: -1.85, rx: .22, ry: .25, cy: .54 }, { z: -2.18, rx: .17, ry: .18, cy: .72 }];
  group.add(loft(neck, M.body, seg(7), false));
  for (let i = 0; i < 5; i++) { const seam = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.035,0.22), M.keel); seam.position.set(0, 0.54 - Math.abs(i-2)*0.04, -1.12 + i*0.48); group.add(seam); }
  if ((model.gorget ?? 0) > 0) for (let i = -1; i <= 1; i++) { const g = blade([[[i*0.10,-0.37,-1.18],[(i+1)*0.10,-0.36,-1.16],[i*0.05,-0.54,-0.78]]], M.gorget); group.add(g); }
  for (const sx of [-1,1]) for (let l=0;l<2;l++) { const leg=spike(0.42,0.045,0.025,M.copper,4); leg.position.set(sx*(0.22+0.05*l),-0.52,-0.55+0.22*l); leg.rotation.z=sx*0.18; group.add(leg); const tal=spike(0.18,0.025,0.004,M.copper,4); tal.position.set(sx*(0.25+0.05*l),-0.86,-0.72+0.22*l); tal.rotation.x=Math.PI/2; group.add(tal); }
  return { group, attach: { wingRootL:{x:-0.55,y:0.42,z:-0.58}, wingRootR:{x:0.55,y:0.42,z:-0.58}, headBase:{x:0,y:0.72,z:-2.18}, tailAnchor:{x:0,y:0.18,z:1.48}, halfWidthAt:(z)=>Math.max(0.12,0.55*(1-Math.abs(z+0.3)/2.2)), bodyMidY:BODY_Y, riderSocket:{x:0,y:0.78,z:-0.45} }, spinePoints: rings.map(r=>new THREE.Vector3(0,r.cy+r.ry,r.z)), spineMats:[M.keel,M.gorget], coreGlow:null, mats:{ bodyMat:M.body, eyeMat:M.eye } };
}

function buildScythePinionWings(def, model, attach) {
  const group = new THREE.Group(), M = empressMats(def, model.glowLevel, model.igniteStage), parts = {}, els=[];
  const count = Math.round(model.primaryCount ?? 7), span = model.pinionSpan ?? 5.6, chord = 0.62;
  for (const side of [-1,1]) { const pivot = new THREE.Group(); pivot.position.set(side*0.55,0.42,-0.58); group.add(pivot); const tip = new THREE.Group(); pivot.add(tip); let maxX=0, tipY=0, tipZ=0;
    const covert = blade([[[0,0,0],[side*span*.34,.48,-1.0],[side*span*.26,-.08,.20]],[[0,0,0],[side*span*.26,-.08,.20],[side*span*.10,-.12,.45]]], M.body); pivot.add(covert);
    for (let i=0;i<count;i++) { const t=i/(count-1), rootX=side*span*(0.28+t*0.58), rootY=0.10+t*0.70, rootZ=-0.20-t*1.45, len=(0.95+0.22*Math.sin(Math.PI*t))*span*.18, gap=(model.primaryGaps??4)>0?0.07*t:0; const tx=rootX+side*(len+gap), ty=rootY+0.18+t*0.18, tz=rootZ-0.30-t*0.18; const w=chord*(1-t*.45); const bladeMesh=blade([[[rootX,rootY,rootZ-w*.30],[rootX,rootY,rootZ+w*.45],[tx,ty,tz]],[[rootX,rootY,rootZ+w*.45],[tx,ty,tz],[rootX+side*w*.22,rootY-.04,rootZ+w*.75]]], M.pinion); pivot.add(bladeMesh); els.push({ tipObj: bladeMesh, root:new THREE.Vector3(rootX,rootY,rootZ), length:len, gapWidth: Math.max(0.16, gap+0.16) }); if (Math.abs(tx)>Math.abs(maxX)){maxX=tx;tipY=ty;tipZ=tz;} }
    tip.position.set(maxX,tipY,tipZ); parts[side<0?'wingPivotL':'wingPivotR']=pivot; parts[side<0?'wingTipL':'wingTipR']=tip; parts[side<0?'tipMarkerL':'tipMarkerR']=tip; }
  parts.wingElements=els; return { group, parts, wingMat:M.pinion, spineMats:[M.pinion] };
}
function buildCometCrestHead(def, model, mats) {
  const M = empressMats(def, model.glowLevel, model.igniteStage), group = new THREE.Group();
  group.add(loft([{z:-.25,rx:.20,ry:.16,cy:.02},{z:-.70,rx:.16,ry:.13,cy:.05},{z:-.98,rx:.06,ry:.07,cy:.03}], M.body, seg(6)));
  const beak=spike(.34,.06,.01,M.copper,4); beak.rotation.x=Math.PI/2; beak.position.set(0,.03,-.96); group.add(beak);
  for(const sx of [-1,1]) { const eye=new THREE.Mesh(new THREE.SphereGeometry(.055, seg(6), seg(4)), M.eye); eye.scale.set(1.5-(model.eyeShape??.16), .45+(model.eyeShape??.16), .6); eye.position.set(sx*.13,.10,-.72); group.add(eye); }
  const crestN=Math.round(model.crestQuills??5); for(let i=0;i<crestN;i++){const sx=(i-(crestN-1)/2)*.07; const q=blade([[[sx,.16,-.40],[sx+.035,.19,-.32],[sx*.6,.46,.06]]],M.crest); group.add(q); const coal=new THREE.Mesh(new THREE.OctahedronGeometry(.035,0), M.coal); coal.position.set(sx*.6,.47,.07); group.add(coal);}
  return { group, spineMats:[M.crest], motifAnchor:new THREE.Vector3(0,.4,-.1), headLength:.85 };
}
function buildPyreTrainTail(def, model, mats, anchor={x:0,y:0,z:0}) {
  const M = empressMats(def, model.glowLevel, model.igniteStage), group = new THREE.Group(); group.position.set(anchor.x,anchor.y,anchor.z);
  const segs=[]; for(let i=0;i<2;i++){const s=spike(.48,.10,.07,M.body,6); s.rotation.x=Math.PI/2; s.position.z=i*.34; group.add(s); segs.push(s);}
  const qn=Math.round(model.trainQuills??9), fan=(model.trainFan??150)*Math.PI/180, lift=model.trainLift??0.45, orbiters=[];
  for(let i=0;i<qn;i++){ const u=qn===1?0:(i/(qn-1)-.5), a=u*fan, len=(2.35*(1-.30*Math.abs(u))); const x=Math.sin(a)*1.4, z=.60+Math.cos(a)*len, y=-.18+lift*.55-Math.abs(u)*.28; const shaft=spike(len,.025,.012,M.copper,4); shaft.rotation.x=Math.PI/2-a*.12; shaft.rotation.z=-a; shaft.position.set(x*.45,y,z*.45); group.add(shaft); const vane=blade([[[x*.55-.08,y,z*.70],[x*.55+.08,y,z*.70],[x,y+.20,z]],[[x*.55+.08,y,z*.70],[x,y+.20,z],[x*.55,y-.16,z*.76]]],M.vane); group.add(vane); const coal=new THREE.Mesh(new THREE.OctahedronGeometry(i===(qn-1)/2&&M.stage>=3?.09:.07,0), (i===(qn-1)/2&&M.stage>=3)?M.dawnCoal:M.coal); coal.scale.set(.75,1.25,.75); coal.position.set(x,y+.22,z); group.add(coal); orbiters.push(coal); }
  return { group, segs, orbiters, accentMats:[M.vane], pyreTrain:{ quillCount:qn, fanDegrees:model.trainFan??150, minGap:0.22, cantSum:0 } };
}
registerTorso('pyreHeartTorso', buildPyreHeartTorso);
registerWings('scythePinionWings', buildScythePinionWings);
registerHead('cometCrestHead', buildCometCrestHead);
registerTail('pyreTrainTail', buildPyreTrainTail);
