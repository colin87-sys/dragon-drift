// buildFromBodyPlan — the ONE universal generator (peer to buildDragonModel).
//
// Given a GENE sheet it: picks a body plan (the silhouette skeleton), lofts the
// spine into ONE continuous body+neck+tail tube (the hero shape — no seams to
// hide), then hangs BOLD SEPARATE appendages (wings, legs, head) on it, applies
// the shared "dragon-cue" set (so every plan reads as a dragon) and a small,
// CAPPED decoration pass. skinPass() (separate) handles colour + outline + charm.
//
// Deliberately decoupled from the shipped roster / dragonModel recipe machinery:
// it coexists, proves the inversion on a hero set, and breaks nothing.

import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { BODY_PLANS } from './creatureBodyPlans.js';

// ── gene sheet: names, bounds, defaults. Unmentioned genes keep defaults, so a
//    partial prompt still yields a complete, on-archetype creature. Ranges are
//    deliberately WIDE — sameness comes from timid ranges.
export const GENE_RANGES = {
  mass:        [0.55, 1.8],
  neckLen:     [0.5, 2.4],
  neckArch:    [-0.3, 1.1],
  tailLen:     [0.6, 2.6],
  tailTaper:   [0.1, 0.85],
  limbBulk:    [0.4, 1.6],
  wingAspect:  [1.2, 3.6],
  wingSpan:    [0.7, 1.7],
  bellyDepth:  [0.3, 1.4],
  posturePitch:[-0.3, 0.5],
};
export const GENE_DEFAULTS = {
  plan: 'western',
  mass: 1.0, neckLen: 1.0, neckArch: 0.5, tailLen: 1.1, tailTaper: 0.4,
  limbBulk: 0.9, wingAspect: 2.1, wingSpan: 1.0, bellyDepth: 0.7, posturePitch: 0.0,
  tailTip: 'arrow',           // arrow | fin | spade | frond
  hornStyle: 'swept',         // swept | ram | crown | none   (capped decoration)
  dorsalSpines: 7,            // capped decoration count
  palette: { base: 0x6a7b8c, accent: 0x2d3a47, membrane: 0x8aa0b4, glow: 0x66e0ff, eye: 0xffd24a },
};

export function mergeGenes(genes = {}) {
  const g = { ...GENE_DEFAULTS, ...genes, palette: { ...GENE_DEFAULTS.palette, ...(genes.palette || {}) } };
  for (const k of Object.keys(GENE_RANGES)) {
    const [lo, hi] = GENE_RANGES[k];
    g[k] = Math.max(lo, Math.min(hi, g[k]));   // clamp into range
  }
  return g;
}

// ── small geometry helpers ───────────────────────────────────────────────────
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function tagged(geo, mat, role, extra) {
  const m = new THREE.Mesh(geo, mat);
  m.userData = { role, ...extra };
  return m;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function radAt(arr, u) {
  const f = u * (arr.length - 1), i = Math.floor(f), t = f - i;
  return lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], t);
}

// Loft a smooth elliptical tube along a Catmull-Rom spine. Returns { geometry,
// curve, sample(u) } where sample gives an oriented frame for mounting parts.
function loftSpine(spine, radial) {
  const curve = new THREE.CatmullRomCurve3(spine.points.map((p) => V(...p)), false, 'catmullrom', 0.5);
  const N = seg(spine.points.length * 4 + 6);
  const ring = [];                              // ring[i] = array of Vector3
  const frames = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const pos = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    let up = V(0, 1, 0);
    if (Math.abs(tan.dot(up)) > 0.98) up = V(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(tan, up).normalize();
    up = new THREE.Vector3().crossVectors(right, tan).normalize();
    const rx = radAt(spine.rx, t), ry = radAt(spine.ry, t);
    frames.push({ pos, tan, right, up, rx, ry, t });
    const verts = [];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      verts.push(new THREE.Vector3()
        .copy(pos)
        .addScaledVector(right, Math.cos(a) * rx)
        .addScaledVector(up, Math.sin(a) * ry));
    }
    ring.push(verts);
  }
  // weave quads + cap the two ends with a fan to a centre point
  const pos = [], idx = [];
  const push = (v) => { pos.push(v.x, v.y, v.z); return pos.length / 3 - 1; };
  const ringIdx = ring.map((verts) => verts.map(push));
  for (let i = 0; i < N - 1; i++)
    for (let j = 0; j < radial; j++) {
      const a = ringIdx[i][j], b = ringIdx[i][(j + 1) % radial];
      const c = ringIdx[i + 1][(j + 1) % radial], d = ringIdx[i + 1][j];
      idx.push(a, b, c, a, c, d);
    }
  const capFan = (verts, ids, center, flip) => {
    const ci = push(center);
    for (let j = 0; j < radial; j++) {
      const a = ids[j], b = ids[(j + 1) % radial];
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  };
  capFan(ring[0], ringIdx[0], frames[0].pos.clone().addScaledVector(frames[0].tan, -0.05), true);
  capFan(ring[N - 1], ringIdx[N - 1], frames[N - 1].pos.clone().addScaledVector(frames[N - 1].tan, 0.05), false);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const sample = (u) => {
    const f = u * (N - 1), i = Math.round(f);
    return frames[Math.max(0, Math.min(N - 1, i))];
  };
  return { geometry: geo, curve, sample, frames };
}

// A bold, stylised dragon wing: a CAMBERED membrane surface (cupped, so it
// catches the light and reads as a wing even from dead-behind, not as an edge-on
// sliver) over bat-finger struts. Built in a local frame (x = outboard span,
// +z = aft) then posed in a glide and oriented at the shoulder.
function buildWing(plan, g, mat, strutMat, side) {
  const grp = new THREE.Group();
  const span = plan.wings.span * g.wingSpan;
  const aspect = Math.max(1.2, plan.wings.aspect);
  const rootChord = span / aspect;
  const camber = 0.22 * rootChord;                 // cup depth (downward bow)
  const sSeg = seg(9), cSeg = seg(5);
  const leadZ = (s) => -rootChord * 0.55 * Math.sin(s * Math.PI * 0.72) - 0.04;  // forward-swept leading edge
  const chordAt = (s) => rootChord * (1 - 0.72 * s) * (1 + 0.12 * Math.sin(s * Math.PI * 3));  // taper + finger scallops
  const dipY = (s) => -0.16 * span * s * s;        // wingtip droops in the glide
  // membrane grid
  const pos = [], idx = [];
  const cols = cSeg + 1;
  for (let i = 0; i <= sSeg; i++) {
    const s = i / sSeg, x = span * s, lz = leadZ(s), ch = chordAt(s);
    for (let j = 0; j <= cSeg; j++) {
      const c = j / cSeg;
      const y = dipY(s) - camber * Math.sin(c * Math.PI) - 0.05 * span * s * (1 - s);
      pos.push(x, y, lz + ch * c);
    }
  }
  for (let i = 0; i < sSeg; i++)
    for (let j = 0; j < cSeg; j++) {
      const a = i * cols + j, b = a + 1, d = a + cols, e = d + 1;
      idx.push(a, b, e, a, e, d);
    }
  const mgeo = new THREE.BufferGeometry();
  mgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  mgeo.setIndex(idx); mgeo.computeVertexNormals();
  grp.add(tagged(mgeo, mat, 'membrane'));
  // bat-finger struts: leading-edge spar + a few ribs fanning to the trailing edge
  const sr = plan.wings.type === 'arm' ? 0.055 : 0.035;
  const strut = (from, to, r) => {
    const dir = to.clone().sub(from), len = dir.length();
    if (len < 1e-3) return null;
    const m = tagged(new THREE.CylinderGeometry(r * 0.5, r, len, seg(5)), strutMat, 'limb');
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
    return m;
  };
  const at = (s, c) => V(span * s, dipY(s) - camber * Math.sin(c * Math.PI) - 0.05 * span * s * (1 - s), leadZ(s) + chordAt(s) * c);
  const root = at(0, 0.15);
  const leTip = at(1, 0.0);
  grp.add(strut(root, leTip, sr));                          // leading-edge arm spar
  for (const s of [0.45, 0.7, 0.92]) { const st = strut(root, at(s, 0.96), sr * 0.5); if (st) grp.add(st); }
  // pose: raise into a glide V, sweep aft, tilt the membrane to face back-and-down
  grp.scale.x = side;                                       // mirror
  grp.rotation.z = side * plan.wings.dihedral;
  grp.rotation.y = side * -plan.wings.sweep * 0.5;
  grp.rotation.x = -0.22;
  return grp;
}

// A simple tapered limb + foot. Mostly a silhouette bump on the belly line.
function buildLeg(mat, clawMat, bulk, len, splay, side) {
  const grp = new THREE.Group();
  const thigh = tagged(new THREE.CylinderGeometry(0.10 * bulk, 0.15 * bulk, len, seg(6)), mat, 'limb');
  thigh.position.y = -len * 0.5;
  const shin = tagged(new THREE.CylinderGeometry(0.06 * bulk, 0.10 * bulk, len * 0.8, seg(6)), mat, 'limb');
  shin.position.set(0, -len, len * 0.18); shin.rotation.x = 0.5;
  const foot = tagged(new THREE.SphereGeometry(0.11 * bulk, seg(6), seg(5)), mat, 'limb');
  foot.position.set(0, -len * 1.55, len * 0.5); foot.scale.set(1, 0.6, 1.5);
  grp.add(thigh, shin, foot);
  for (let c = -1; c <= 1; c++) {                    // three little claws (a dragon cue)
    const claw = tagged(new THREE.ConeGeometry(0.03 * bulk, 0.14 * bulk, seg(4)), clawMat, 'claw');
    claw.position.set(c * 0.07 * bulk, -len * 1.62, len * 0.62); claw.rotation.x = -1.2;
    grp.add(claw);
  }
  grp.rotation.z = side * splay;
  return grp;
}

// The shared dragon-cue head: a reptilian WEDGE (skull + tapering snout + brow),
// big eyes, jaw. Identical recipe across plans — this is the cheap "is-a-dragon".
function buildHead(plan, g, mats) {
  const grp = new THREE.Group();
  const h = plan.head, w = h.width;
  const skull = tagged(new THREE.SphereGeometry(0.34, seg(10), seg(8)), mats.body, 'head');
  skull.scale.set(w / 0.6 * 1.0, 0.82, 1.05);
  const snout = tagged(new THREE.ConeGeometry(0.24 * (w / 0.6), 0.85 * h.len, seg(7)), mats.body, 'head');
  snout.rotation.x = -Math.PI / 2; snout.scale.set(0.9, 1, 1.25); snout.position.set(0, -0.05, -0.62 * h.len);
  const jaw = tagged(new THREE.BoxGeometry(0.34 * w / 0.6, 0.12, 0.5 * h.len), mats.belly, 'head');
  jaw.position.set(0, -0.2, -0.42 * h.len);
  const brow = tagged(new THREE.BoxGeometry(0.5 * w / 0.6, 0.10, 0.22), mats.accent, 'head');
  brow.position.set(0, 0.18 * h.brow, -0.16); brow.rotation.x = 0.3;
  grp.add(skull, snout, jaw, brow);
  for (const s of [-1, 1]) {
    const eye = tagged(new THREE.SphereGeometry(0.095, seg(8), seg(7)), mats.eye, 'eye');
    eye.position.set(s * 0.19 * w / 0.6, 0.13, -0.22); eye.scale.set(1, 1.15, 1);
    grp.add(eye);
    const ridge = tagged(new THREE.ConeGeometry(0.05, 0.16, seg(4)), mats.accent, 'head');  // brow ridge over the eye
    ridge.position.set(s * 0.2 * w / 0.6, 0.24, -0.18); ridge.rotation.set(0.5, 0, s * 0.3);
    grp.add(ridge);
    if (!plan.whiskers) {                                   // swept cheek frill (not on the maned eastern)
      const cheek = tagged(new THREE.ConeGeometry(0.06, 0.34, seg(4)), mats.accent, 'head');
      cheek.position.set(s * 0.28 * w / 0.6, 0.02, 0.04); cheek.scale.set(0.5, 1, 1); cheek.rotation.z = s * -1.25;
      grp.add(cheek);
    }
  }
  if (plan.whiskers) for (const s of [-1, 1]) {
    const wh = tagged(new THREE.CylinderGeometry(0.006, 0.02, 1.1, seg(4)), mats.accent, 'mane');
    wh.position.set(s * 0.2, 0.0, -0.7); wh.rotation.set(0.2, 0, s * 0.5);
    grp.add(wh);
  }
  return grp;
}

// Capped decoration: horns (style enum) + a row of dorsal spines. Tagged
// decoration:true so the anti-reskin silhouette gate STRIPS them — trim can
// never be what distinguishes two creatures.
function addDecoration(group, body, plan, g, mats) {
  const horn = (x, y, z, len, rot, r = 0.06) => {
    const m = tagged(new THREE.ConeGeometry(r, len, seg(6)), mats.horn, 'horn', { decoration: true });
    m.position.set(x, y, z); m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };
  const head = group.userData.headGroup;
  if (g.hornStyle !== 'none' && head) {
    const set = {
      swept:  [[0.16, 0.28, 0.05, 0.5, [0.7, 0, -0.2]], [-0.16, 0.28, 0.05, 0.5, [0.7, 0, 0.2]]],
      ram:    [[0.2, 0.18, 0.1, 0.42, [1.4, 0, -0.6], 0.08], [-0.2, 0.18, 0.1, 0.42, [1.4, 0, 0.6], 0.08]],
      crown:  [[0.1, 0.34, 0.0, 0.4, [0.2, 0, -0.15]], [-0.1, 0.34, 0.0, 0.4, [0.2, 0, 0.15]], [0, 0.36, 0.0, 0.46, [0, 0, 0]]],
    }[g.hornStyle] || [];
    for (const hd of set) head.add(horn(...hd));
  }
  // dorsal spines marching along the top of the spine (capped count)
  const n = Math.max(0, Math.min(14, g.dorsalSpines | 0));
  for (let i = 0; i < n; i++) {
    const u = 0.2 + (i / Math.max(1, n - 1)) * 0.6;
    const fr = body.sample(u);
    const sp = tagged(new THREE.ConeGeometry(0.04, 0.16 + 0.12 * fr.ry, seg(4)), mats.accent, 'spine', { decoration: true });
    sp.position.copy(fr.pos).addScaledVector(fr.up, fr.ry + 0.02);
    sp.quaternion.setFromUnitVectors(V(0, 1, 0), fr.up);
    sp.rotateX(-0.5);
    group.add(sp);
  }
}

// A scaled dorsal RIDGE line (a dragon cue, NOT decoration) — small plates that
// read "scaly dragon spine" without dictating the body.
function addSpineRidge(group, body, mats) {
  const n = seg(16);
  for (let i = 0; i < n; i++) {
    const u = 0.12 + (i / (n - 1)) * 0.74, fr = body.sample(u);
    const plate = tagged(new THREE.ConeGeometry(0.03 + 0.04 * fr.ry, 0.07 + 0.05 * fr.ry, seg(4)), mats.accent, 'spine');
    plate.position.copy(fr.pos).addScaledVector(fr.up, fr.ry - 0.005);
    plate.quaternion.setFromUnitVectors(V(0, 1, 0), fr.up);
    group.add(plate);
  }
}

// Soft mane fins along the neck/back (eastern cue).
function addMane(group, body, mats) {
  const n = seg(10);
  for (let i = 0; i < n; i++) {
    const u = 0.04 + (i / (n - 1)) * 0.4, fr = body.sample(u);
    const fin = tagged(new THREE.ConeGeometry(0.05, 0.34, seg(4)), mats.membrane, 'mane');
    fin.scale.set(0.4, 1, 1);
    fin.position.copy(fr.pos).addScaledVector(fr.up, fr.ry + 0.08);
    fin.quaternion.setFromUnitVectors(V(0, 1, 0), fr.up);
    fin.rotateX(-0.7);
    group.add(fin);
  }
}

// Build the tail-tip flourish (enum). Mounted at the last spine frame.
function buildTailTip(kind, mats) {
  const grp = new THREE.Group();
  const mk = (geo, scl, rot) => { const m = tagged(geo, mats.membrane, 'membrane'); if (scl) m.scale.set(...scl); if (rot) m.rotation.set(...rot); return m; };
  if (kind === 'arrow') grp.add(mk(new THREE.ConeGeometry(0.16, 0.5, seg(5)), [1, 0.4, 1], [-Math.PI / 2, 0, 0]));
  else if (kind === 'spade') grp.add(mk(new THREE.SphereGeometry(0.2, seg(8), seg(6)), [1, 0.25, 1.4]));
  else if (kind === 'fin') { grp.add(mk(new THREE.ConeGeometry(0.22, 0.46, seg(5)), [0.18, 1, 1], [0, 0, 0])); }
  else if (kind === 'frond') for (let k = -1; k <= 1; k++) {
    const f = mk(new THREE.ConeGeometry(0.06, 0.4, seg(4)), [0.5, 1, 1], [0, 0, k * 0.5]);
    grp.add(f);
  }
  return grp;
}

// ── the generator ────────────────────────────────────────────────────────────
export function buildCreature(genes = {}, opts = {}) {
  const g = mergeGenes(genes);
  const plan = (BODY_PLANS[g.plan] || BODY_PLANS.western)(g);
  const P = g.palette;
  // flat, role-coloured materials; skinPass() upgrades these for the real game.
  const M = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.05 });
  const mats = {
    body: M(P.base), accent: M(P.accent), belly: M(P.base).clone(),
    membrane: M(P.membrane), eye: new THREE.MeshStandardMaterial({ color: P.eye, emissive: P.eye, emissiveIntensity: 0.8 }),
    horn: M(P.accent), glow: new THREE.MeshStandardMaterial({ color: P.glow, emissive: P.glow, emissiveIntensity: 0.6 }),
  };
  mats.belly.color.multiplyScalar(1.25);

  const group = new THREE.Group();
  group.userData = { genes: g, plan: plan.id, mats };

  // 1) BODY — one continuous spine tube (the hero shape).
  const radial = seg(14);
  const body = loftSpine(plan.spine, radial);
  group.add(tagged(body.geometry, mats.body, 'body'));

  // a smooth blend sphere so an appendage reads as GROWING from the body, not
  // bolted on (the cheap "one creature" trick the original game used).
  const fairing = (pos, r) => {
    const f = tagged(new THREE.SphereGeometry(r, seg(8), seg(6)), mats.body, 'body');
    f.position.copy(pos); f.scale.set(1.25, 1.0, 1.25);
    group.add(f);
  };

  // 2) HEAD — at the front spine frame, aimed forward, with a neck-collar fairing.
  const headFr = body.sample(0);
  const headGroup = buildHead(plan, g, mats);
  headGroup.position.copy(headFr.pos).addScaledVector(headFr.tan, -0.18);
  headGroup.quaternion.setFromUnitVectors(V(0, 0, -1), headFr.tan.clone().multiplyScalar(-1).normalize());
  group.add(headGroup);
  group.userData.headGroup = headGroup;
  fairing(headFr.pos.clone().addScaledVector(headFr.tan, -0.02), headFr.rx * 1.15);

  // 3) WINGS — at the shoulders (skip for the wingless eastern plan).
  if (plan.wings.type !== 'none') {
    const fr = body.sample(plan.shoulderU);
    for (const side of [-1, 1]) {
      const root = fr.pos.clone().addScaledVector(fr.right, side * fr.rx * 0.7).addScaledVector(fr.up, fr.ry * plan.wings.rootLift);
      const wing = buildWing(plan, g, mats.membrane, mats.accent, side);
      wing.position.copy(root);
      group.add(wing);
      fairing(root.clone().addScaledVector(fr.up, -fr.ry * 0.18), fr.rx * 0.5);    // shoulder muscle
    }
  }

  // 4) LEGS — fore (shoulders) + hind (hips), counts per plan topology.
  const legLen = lerp(0.5, 0.9, g.limbBulk) * (plan.id === 'eastern' ? 0.5 : 1);
  const mount = (u, splay) => {
    const fr = body.sample(u);
    for (const side of [-1, 1]) {
      const root = fr.pos.clone().addScaledVector(fr.right, side * fr.rx * 0.8).addScaledVector(fr.up, -fr.ry * 0.5);
      const leg = buildLeg(mats.body, mats.horn, plan.legs.bulk, legLen, splay, side);
      leg.position.copy(root);
      group.add(leg);
      fairing(root.clone().addScaledVector(fr.up, fr.ry * 0.25), fr.rx * 0.42 * plan.legs.bulk);  // haunch
    }
  };
  if (plan.legs.fore) mount(plan.shoulderU + 0.02, 0.25);
  if (plan.legs.hind) mount(plan.hipU, 0.3);

  // 5) TAIL TIP flourish at the last frame.
  const tipFr = body.frames[body.frames.length - 1];
  const tip = buildTailTip(plan.tailTip, mats);
  tip.position.copy(tipFr.pos); tip.quaternion.setFromUnitVectors(V(0, 0, 1), tipFr.tan.clone().normalize());
  group.add(tip);

  // 6) DRAGON CUES (identity) then CAPPED DECORATION (trim).
  addSpineRidge(group, body, mats);
  if (plan.mane) addMane(group, body, mats);
  addDecoration(group, body, plan, g, mats);

  // 7) Normalise to a consistent frame so any plan fills the chase cam fairly.
  normalize(group);
  if (opts.skin !== false) {
    // lazy import to keep the builder usable without the skin pass in tests
  }
  return { group, genes: g, plan: plan.id, mats };
}

// Recentre on origin (x=0, body centre ~y=1) and scale so the longest dimension
// is a fixed size — keeps every plan framed comparably from the chase cam.
function normalize(group, targetLen = 6.2) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3();
  group.traverse((o) => { if (o.isMesh && !o.userData.outline) box.expandByObject(o); });
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const s = targetLen / Math.max(size.x, size.y, size.z);
  group.scale.setScalar(s);
  group.position.set(-ctr.x * s, 1.0 - ctr.y * s, -ctr.z * s);
  group.updateMatrixWorld(true);
}
