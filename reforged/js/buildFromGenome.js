// buildFromGenome.js — the UNIVERSAL GENERATOR (proof of concept).
//
// One function builds ANY creature from a genome (creatureGenome.js) using a tiny
// set of primitives, instead of dispatching to a registry of ~10 prefab torsos /
// ~12 prefab wings. The thesis of CREATURE-SYSTEM-REDESIGN.md, made runnable:
//
//   Primitive B (body)   → sweepProfileSmooth()  — the engine's REAL loft, already
//                          in dragonSweep.js, here driven straight from the genome.
//   Primitive A (limbs)  → sweptTube()           — a tapered tube along any 3D bone
//                          chain (static POC of skinnedTube; legs, horns, ridges).
//   Primitive C (membrane) → membrane()          — a skin lofted off a spar chain
//                          (wings/fins/frills).
//
// Detail is a SEPARATE axis: every primitive tessellates through seg(), so the SAME
// genome builds denser on a capable device ("ultra mode") with zero re-authoring.
//
// Returns { group, meshes, stats } — stats let headless tests assert topology
// (appendage counts) and resolution (vertex counts scale with detail).

import * as THREE from 'three';
import { sweepProfileSmooth } from './dragonSweep.js';
import { seg } from './modelDetail.js';
import { normalizeGenome, genomeToProfile, hexToRGB } from './creatureGenome.js';

const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
const colorOf = (hex) => { const c = hexToRGB(hex); return new THREE.Color(c.r, c.g, c.b); };

// Resample a polyline of Vector3 to `n` points (linear; enough for the POC — the
// shippable path uses the centripetal Catmull-Rom already in dragonSweep).
function resample(points, n) {
  if (points.length === n) return points.slice();
  const out = [];
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * (points.length - 1);
    const i0 = Math.min(Math.floor(f), points.length - 2);
    const t = f - i0;
    out.push(points[i0].clone().lerp(points[i0 + 1], t));
  }
  return out;
}

// Primitive A — a tapered tube swept along a 3D centreline (static framing). The
// shippable version swaps in dragonSweep.skinnedTube so a rig can bend it; the
// geometry topology is identical, which is what these tests assert.
function sweptTube(centreline, radii, mat) {
  const sides = seg(10);
  const N = centreline.length;
  const verts = [], idx = [];
  const tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  for (let s = 0; s < N; s++) {
    const c = centreline[s], r = radii[Math.min(s, radii.length - 1)];
    const a = centreline[Math.max(s - 1, 0)], b = centreline[Math.min(s + 1, N - 1)];
    tan.subVectors(b, a).normalize();
    side.crossVectors(UP, tan);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0); else side.normalize();
    up.crossVectors(tan, side).normalize();
    for (let j = 0; j < sides; j++) {
      const ang = (j / sides) * Math.PI * 2, cos = Math.cos(ang), sin = Math.sin(ang);
      verts.push(
        c.x + (side.x * cos + up.x * sin) * r,
        c.y + (side.y * cos + up.y * sin) * r,
        c.z + (side.z * cos + up.z * sin) * r);
    }
  }
  for (let s = 0; s < N - 1; s++) for (let j = 0; j < sides; j++) {
    const a = s * sides + j, b = s * sides + (j + 1) % sides;
    const c = (s + 1) * sides + j, d = (s + 1) * sides + (j + 1) % sides;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// Primitive C — a membrane lofted off a leading-edge spar chain. Leading edge = the
// limb chain (shoulder→wrist→tip); trailing edge sweeps back toward the tail (+Z)
// by `chord`, ramped along the span so the tip tapers. A flat web is plenty to
// prove topology; the shippable path adds the wing builder's scallop + billow.
function membrane(rootWorld, chain, chord, mat) {
  const span = seg(8);
  const lead = resample([V(rootWorld), ...chain.map(V)], span);
  const back = new THREE.Vector3(0, 0, 1); // toward the tail
  const verts = [], idx = [];
  for (let i = 0; i < span; i++) {
    const f = i / (span - 1);
    const l = lead[i];
    const t = l.clone().addScaledVector(back, chord * (0.35 + 0.65 * f)); // trailing pt
    verts.push(l.x, l.y, l.z, t.x, t.y, t.z);
  }
  for (let i = 0; i < span - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.userData.membrane = true;
  return m;
}

// Primitive C2 — a BAT WING: an arm spar to a wrist, a fan of finger spars swept
// from leading (forward, −Z) to trailing (back, +Z), and a scalloped membrane
// webbed between the fingers + a trailing sail down to the shoulder. Parameterised
// so the whole shape is continuous data an optimizer can drive (span, sweep,
// elevation/pose, finger count, scallop). `side` (+1 right / −1 left) mirrors it.
// Built as real 3D geometry (spreads in X, sweeps in Z, raised in Y by elevation),
// so it reads as a wing from any angle AND projects broadly into the side view.
function batWing(frontRoot, side, p, mat) {
  const fingers = Math.max(3, Math.round(seg(p.fingers ?? 4)));
  const armLen = p.armLen ?? 0.55, span = p.span ?? 1.2;
  const elev = p.elevation ?? 0.35;             // 0 = wings out flat … ~1.2 = upstroke
  const scallop = p.scallop ?? 0.3;
  const backChord = p.backChord ?? 1.0;         // length of the root chord ALONG the body
  // ROOT CHORD — the wing welds to the body along a line, not a point: a front
  // anchor (shoulder) and a back anchor further down the back. Both sit on the
  // body's upper flank so the membrane is connected, not floating.
  const R = new THREE.Vector3(frontRoot[0], frontRoot[1], frontRoot[2]);
  const B = new THREE.Vector3(frontRoot[0] * 0.82, frontRoot[1] - 0.05, frontRoot[2] + backChord);
  // arm out to the wrist (out in X by side, raised in Y by elevation).
  const out = new THREE.Vector3(side * Math.cos(elev), Math.sin(elev), 0);
  const Wr = R.clone().addScaledVector(out, armLen);
  // fingers fan from the wrist: leading finger continues the arm (up/out), trailing
  // fingers sweep back (+Z) toward the back anchor — a real bat-wing fan.
  const backOut = new THREE.Vector3(out.x * 0.45, out.y * 0.5, 1).normalize();
  const tips = [];
  for (let i = 0; i < fingers; i++) {
    const f = i / (fingers - 1);
    const dir = out.clone().lerp(backOut, f).normalize();
    tips.push(Wr.clone().addScaledVector(dir, span * (1 - 0.15 * f)));
  }
  const verts = [], idx = [];
  const push = (a, b, c) => { const base = verts.length / 3; verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); idx.push(base, base + 1, base + 2); };
  // membrane polygon: frontRoot → wrist → tip0..tipN → backRoot → frontRoot.
  push(R, Wr, tips[0]);                                   // leading membrane (arm → 1st finger)
  for (let i = 0; i < fingers - 1; i++) {                 // webbing between fingers, scalloped
    const t0 = tips[i], t1 = tips[i + 1];
    const mid = t0.clone().lerp(t1, 0.5).lerp(Wr, scallop * 0.5);
    push(Wr, t0, mid); push(Wr, mid, t1);
  }
  push(Wr, tips[fingers - 1], B);                         // trailing finger → back anchor
  push(R, B, Wr);                                         // inner sail along the root chord
  const gmt = new THREE.BufferGeometry();
  gmt.setIndex(idx);
  gmt.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  gmt.computeVertexNormals();
  const m = new THREE.Mesh(gmt, mat);
  m.userData.wing = true;
  return m;
}

// Build one creature from a genome. opts.detail (e.g. 'ultra') is applied by the
// caller via setActiveDetail; the primitives read it through seg().
export function buildFromGenome(rawGenome, opts = {}) {
  const g = normalizeGenome(rawGenome);
  const pal = g.palette || {};
  const finish = (g.surface && g.surface.material) || {};
  const group = new THREE.Group();
  const meshes = {};
  const stats = { appendages: 0, byKind: {}, vertices: 0 };

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colorOf(pal.body || '#888888'),
    roughness: finish.roughness ?? 0.7, metalness: finish.metalness ?? 0.1,
  });
  const membMat = new THREE.MeshStandardMaterial({
    color: colorOf(pal.membrane || pal.body || '#666666'),
    roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide,
  });

  // Primitive B — the BODY, lofted straight from the genome spine.
  const bodyGeo = sweepProfileSmooth(genomeToProfile(g), 1);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'body';
  group.add(body);
  meshes.body = body;

  const tally = (kind, mesh) => {
    stats.appendages++;
    stats.byKind[kind] = (stats.byKind[kind] || 0) + 1;
    if (mesh) group.add(mesh);
  };

  // Appendages — ANY count/kind, from the genome list. No per-creature code.
  for (const ap of g.appendages) {
    if (ap.kind === 'membrane') {
      tally('membrane', membrane(ap._from, ap._chain, ap.chord ?? 0.8, membMat));
    } else if (ap.kind === 'wing') {
      // root = shoulder offset to the side; side from the limb chain's x sign.
      const side = Math.sign((ap._chain && ap._chain[0] && ap._chain[0][0]) || 1) || 1;
      const root = [side * (ap.rootX ?? 0.30), (ap._from?.[1] ?? 0.4) + (ap.rootLift ?? 0.18), (ap._from?.[2] ?? -0.4)];
      tally('wing', batWing(root, side, ap, membMat));
    } else if (ap.kind === 'leg') {
      const chain = [V(ap._from), ...ap._chain.map(V)];
      const radii = ap._radii || chain.map(() => 0.08);
      tally('leg', sweptTube(chain, radii, bodyMat));
    } else if (ap.kind === 'horns') {
      const head = (g.spine.find((j) => j.id === (ap.on)) || g.spine[1]).p;
      const len = ap.len ?? 0.5, splay = ap.splay ?? 0.5;
      for (let pair = 0; pair < (ap.pairs ?? 1); pair++) {
        for (const sx of [-1, 1]) {
          const base = V([head[0] + sx * 0.08, head[1] + 0.1, head[2]]);
          const tip = V([head[0] + sx * splay * 0.4, head[1] + len, head[2] - 0.1 - pair * 0.15]);
          tally('horn', sweptTube([base, base.clone().lerp(tip, 0.5), tip], [0.05, 0.03, 0.005], bodyMat));
        }
      }
    } else if (ap.kind === 'ridge') {
      const from = g.spine.find((j) => j.id === ap.from) || g.spine[0];
      const to = g.spine.find((j) => j.id === ap.to) || g.spine[g.spine.length - 1];
      const n = ap.count ?? 8;
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1);
        const z = from.p[2] + (to.p[2] - from.p[2]) * f;
        const y = from.p[1] + (to.p[1] - from.p[1]) * f;
        const base = V([0, y + 0.2, z]);
        const tip = V([0, y + 0.2 + (ap.height ?? 0.15), z + 0.05]);
        tally('ridge', sweptTube([base, tip], [0.04, 0.005], bodyMat));
      }
    }
  }

  // count vertices for the resolution-independence assertion.
  group.traverse((o) => { if (o.geometry) stats.vertices += o.geometry.attributes.position.count; });
  return { group, meshes, stats };
}
