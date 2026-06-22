// ─────────────────────────────────────────────────────────────────────────────
// THE RADIANT PALADIN — a holy war-dragon of gilded light.
//
// Built FROM SCRATCH as a standalone modular creature: its own materials, its own
// module builders, its own hierarchy. It deliberately does NOT use the repo's
// body-plan / gene / chassis system — this file is self-contained so it can show
// what the "prompt → procedural dragon → code in the game" loop produces clean.
//
// Engine axis convention (from the brief):
//   head / forward = -Z      tail / rear = +Z
//   dragon right   = +X      dragon left = -X      up = +Y
//
// The player flies behind the dragon, so every choice favours the REAR chase-cam
// read: a wide gold-rimmed feather-scale wing fan, a halo crowning the head, a
// pearl/gold spine down the centre, and a radiant comet-blade tail aimed at camera.
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = THREE.MathUtils.lerp;
const rad = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;

// ── knobs (every value is a 1.0-centred multiplier we can tune from screenshots)
const DEFAULT_KNOBS = {
  wingspanScale: 1, wingFanFullness: 1, wingPlateSize: 1, wingPlateOverlap: 1,
  haloScale: 1, haloHeight: 1, tailLength: 1, tailCometLength: 1, torsoSlimness: 1,
  pearlBrightness: 1, goldRimThickness: 1, dawnBlueSeamIntensity: 1, gemNodeBrightness: 1,
  chaseCamWingRead: 1,
};

// ── material language: matte pearl armour, thin gilded rims, soft dawn-blue seams,
//    rare crystal gems, holy-white halo/comet. (Not chrome, not neon.)
function makeMaterials(k) {
  const mk = (color, o = {}) => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(o.tint || 1),
    roughness: o.roughness ?? 0.7, metalness: o.metalness ?? 0.05,
    emissive: new THREE.Color(o.emissive || '#000000'),
    emissiveIntensity: o.emissiveIntensity || 0, side: THREE.DoubleSide,
  });
  return {
    pearl: mk('#f4f0e6', { roughness: 0.72, metalness: 0.05, tint: k.pearlBrightness }),
    gold: mk('#d8a935', { roughness: 0.32, metalness: 0.70 }),
    goldGlow: mk('#e9c45a', { roughness: 0.3, metalness: 0.6, emissive: '#d8a935', emissiveIntensity: 0.5 }),
    seam: mk('#13283a', { emissive: '#86dfff', emissiveIntensity: 1.6 * k.dawnBlueSeamIntensity }),
    holy: mk('#fff6d2', { emissive: '#fff6d2', emissiveIntensity: 2.2 }),
    comet: mk('#fff1a8', { emissive: '#fff1a8', emissiveIntensity: 2.0 }),
    halo: mk('#fff3c0', { emissive: '#fff6d2', emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.4 }),
    gem: mk('#8feaff', { emissive: '#8feaff', emissiveIntensity: 2.0 * k.gemNodeBrightness, roughness: 0.12, metalness: 0 }),
    eye: mk('#bdefff', { emissive: '#86dfff', emissiveIntensity: 1.4 }),
  };
}

function tag(geo, mat, role) { const m = new THREE.Mesh(geo, mat); m.userData.role = role; return m; }

// ── a single feather-scale / armour plate: a convex rounded-shield kite in the
//    local XZ plane, +Y the outward face. ~6 tris. Width spans X, length spans Z.
function shieldGeo(w, l, camber = 0.04) {
  const x = w * 0.5;
  const ring = [[0, -l * 0.5], [x, -l * 0.14], [x, l * 0.30], [0, l * 0.5], [-x, l * 0.30], [-x, -l * 0.14]];
  const pos = [0, camber, l * 0.05]; const idx = [];
  for (const [px, pz] of ring) pos.push(px, 0, pz);
  for (let i = 0; i < ring.length; i++) idx.push(0, 1 + i, 1 + (i + 1) % ring.length);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

// orient a mesh so local +Y → `normal`, and local +Z → `forward` (projected).
const YUP = V(0, 1, 0);
function place(mesh, pos, normal, forward) {
  mesh.position.copy(pos);
  const n = normal.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(YUP, n);
  if (forward) {
    const f = forward.clone().sub(n.clone().multiplyScalar(forward.dot(n)));
    if (f.lengthSq() > 1e-6) {
      f.normalize();
      const lz = V(0, 0, 1).applyQuaternion(q);
      const zp = lz.sub(n.clone().multiplyScalar(lz.dot(n))).normalize();
      let a = Math.acos(clamp(zp.dot(f), -1, 1));
      if (new THREE.Vector3().crossVectors(zp, f).dot(n) < 0) a = -a;
      q.premultiply(new THREE.Quaternion().setFromAxisAngle(n, a));
    }
  }
  mesh.quaternion.copy(q);
}

// a gilded plate = pearl shield + a slightly larger gold shield set just behind it,
// so a thin gold rim peeks around every feather. The studio's gilded-armour read.
function gildedPlate(w, l, mats, k, camber = 0.04, rimMat) {
  const grp = new THREE.Group();
  const rim = tag(shieldGeo(w * (1 + 0.16 * k.goldRimThickness), l * (1 + 0.12 * k.goldRimThickness), camber), rimMat || mats.gold, 'goldRim');
  rim.position.y = -0.012; grp.add(rim);
  grp.add(tag(shieldGeo(w, l, camber), mats.pearl, 'pearlPlate'));
  return grp;
}

// ── lofted tube along a centreline of stations {z,w,h,cy}; one merged mesh. ───
function tube(stations, mat, role, ring = 10) {
  const pos = [], idx = [];
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      pos.push(Math.cos(a) * s.w * 0.5, s.cy + Math.sin(a) * s.h * 0.5, s.z);
    }
  }
  for (let i = 0; i < stations.length - 1; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j, b = i * ring + (j + 1) % ring, c = a + ring, d = b + ring;
      idx.push(a, c, d, a, d, b);
    }
  // round caps (nose + tail) so the loft doesn't look hollow end-on
  const noseI = pos.length / 3; const s0 = stations[0];
  pos.push(0, s0.cy, s0.z - s0.w * 0.35);
  for (let j = 0; j < ring; j++) idx.push(noseI, (j + 1) % ring, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return tag(g, mat, role);
}

// ── WING ─────────────────────────────────────────────────────────────────────
// A gilded feather-scale fan: shingled rows of gold-rimmed pearl plates over a
// continuous gold leading-edge spar, with dawn-blue glow seams between the rows
// and longer blade-scutes at the tip. Swept back toward the camera so the rear
// chase-cam reads a wide fan.
function buildWing(side, k, mats) {
  const g = new THREE.Group();
  const span = 4.95 * k.wingspanScale;
  // NOTE: the brief's 7° dihedral reads edge-on from a dead-rear chase cam, so we
  // pose a gull arch (chaseCamWingRead) that lifts the fan into a tall silhouette
  // while keeping the swept planform — the knob lets us dial it back if wanted.
  const sweep = rad(18), dih = rad(15);
  const rootZ = -0.34;
  const chordAt = (s) => lerp(1.46, 0.34, s * s * 0.5 + s * 0.5) * k.wingFanFullness;
  const leadZ = (s) => rootZ - 0.18 + Math.tan(sweep) * span * s;           // sweeps aft (+Z) with span
  const baseY = (s) => 0.04 + Math.tan(dih) * span * s + 0.95 * Math.sin(s * Math.PI * 0.85) * k.chaseCamWingRead;
  // wingPoint: s = span fraction (root→tip), c = chord fraction (0 leading → 1 trailing)
  const wp = (s, c) => V(
    side * (0.12 + span * s),
    baseY(s) + 0.10 * Math.sin(c * Math.PI) * chordAt(s),                    // mild upward camber
    leadZ(s) + chordAt(s) * (c - 0.5),
  );
  const normalAt = (s, c) => {
    const e = 0.02;
    const ds = wp(Math.min(1, s + e), c).sub(wp(Math.max(0, s - e), c));
    const dc = wp(s, Math.min(1, c + e)).sub(wp(s, Math.max(0, c - e)));
    const n = new THREE.Vector3().crossVectors(dc, ds).normalize();
    if (n.y < 0) n.negate();
    n.z += 0.55; n.y += 0.25; return n.normalize();                         // tilt faces up-and-aft (toward camera)
  };

  // pearl membrane webbing — a solid lofted sheet under the scales so the fan
  // reads as ONE wing (not a broken chain of plates) and casts a clean silhouette.
  const sSeg = 12, cSeg = 5, mpos = [], midx = [], cols = cSeg + 1;
  for (let i = 0; i <= sSeg; i++) for (let j = 0; j <= cSeg; j++) {
    const p = wp(i / sSeg, j / cSeg); mpos.push(p.x, p.y - 0.05, p.z);
  }
  for (let i = 0; i < sSeg; i++) for (let j = 0; j < cSeg; j++) {
    const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; midx.push(a, c, d, a, d, b);
  }
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.Float32BufferAttribute(mpos, 3));
  mg.setIndex(midx); mg.computeVertexNormals();
  g.add(tag(mg, mats.pearl, 'membrane'));
  // continuous gold leading-edge spar + a thinner gold trailing rail
  const railZ = (c, w) => { const a = []; for (let i = 0; i <= 8; i++) { const s = i / 8; const p = wp(s, c); a.push({ z: p.z, w: w * (1 - s * 0.55), h: w * (1 - s * 0.55), cy: p.y, x: p.x }); } return a; };
  g.add(tubeAlong(railZ(0.02, 0.09), mats.gold, 'spar', 6));
  g.add(tubeAlong(railZ(0.98, 0.045), mats.gold, 'trailRail', 5));

  // shingled feather-scale rows (root→tip columns × leading→trailing rows)
  const rows = 4, overlap = 0.18 * k.wingPlateOverlap;
  for (let r = 0; r < rows; r++) {
    const c0 = 0.12 + (r / rows) * 0.84;
    const cols = r === 0 ? 5 : r === rows - 1 ? 4 : 6;
    // a dawn-blue glow seam riding just inboard of each row boundary
    const seam = [];
    for (let i = 0; i <= 8; i++) { const s = i / 8; const p = wp(s, c0 - 0.04); seam.push({ z: p.z, w: 0.03, h: 0.03, cy: p.y - 0.02, x: p.x }); }
    g.add(tubeAlong(seam, mats.seam, 'seam', 4));
    for (let cI = 0; cI < cols; cI++) {
      const s = 0.06 + (cI + 0.5) / cols * 0.92;
      const isTip = s > 0.74;
      const cw = (span / cols) * (1 + overlap) * 0.62 * k.wingPlateSize;
      const cl = (isTip ? 0.62 : 0.46) * chordAt(s) / 0.9 * (1 + overlap) * k.wingPlateSize;
      const plate = isTip
        ? gildedPlate(cw * 0.7, cl * 1.5, mats, k, 0.05)                    // primary blade-scute: longer, sharper
        : gildedPlate(cw, cl, mats, k, 0.05);
      place(plate, wp(s, c0), normalAt(s, c0), V(0, 0, 1));
      g.add(plate);
    }
  }
  // shoulder pauldron — big gold-rimmed wing-root pod that hides the hinge
  const pauld = gildedPlate(0.5, 0.62, mats, k, 0.12, mats.goldGlow);
  place(pauld, wp(0.02, 0.4), V(side * 0.25, 1, 0.2), V(0, 0, 1));
  pauld.scale.set(1, 1.6, 1); g.add(pauld);
  // wingtip light-trail socket (marker the VFX layer would attach to)
  const tip = wp(1, 0.5); g.userData.wingtip = tip;
  return g;
}

// tube that follows explicit ring centres carrying their own x offset (for wings).
function tubeAlong(stations, mat, role, ring = 6) {
  const pos = [], idx = [];
  for (const s of stations)
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2;
      pos.push((s.x || 0) + Math.cos(a) * s.w * 0.5, s.cy + Math.sin(a) * s.h * 0.5, s.z);
    }
  for (let i = 0; i < stations.length - 1; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j, b = i * ring + (j + 1) % ring, c = a + ring, d = b + ring;
      idx.push(a, c, d, a, d, b);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals(); return tag(g, mat, role);
}

// ── HEAD + HALO ──────────────────────────────────────────────────────────────
function buildHead(k, mats) {
  const g = new THREE.Group();
  // small regal pearl wedge (head barely matters from rear; keep it cheap)
  const skull = [
    { z: -4.95, w: 0.16, h: 0.18, cy: 0.10 }, { z: -4.70, w: 0.34, h: 0.26, cy: 0.12 },
    { z: -4.45, w: 0.42, h: 0.28, cy: 0.13 }, { z: -4.18, w: 0.34, h: 0.26, cy: 0.14 },
  ];
  g.add(tube(skull, mats.pearl, 'skull', 8));
  // gilded brow / crown base
  const brow = tag(new THREE.BoxGeometry(0.44, 0.08, 0.2), mats.gold, 'brow');
  brow.position.set(0, 0.27, -4.5); g.add(brow);
  for (const s of [-1, 1]) {
    // swept horn / crest
    const horn = tag(new THREE.ConeGeometry(0.05, 0.34, 6), mats.gold, 'horn');
    place(horn, V(s * 0.16, 0.34, -4.42), V(s * 0.4, 1, 0.5), null);
    g.add(horn);
    // faceted dawn-blue gem eye
    const eye = tag(new THREE.OctahedronGeometry(0.05), mats.eye, 'eye');
    eye.position.set(s * 0.17, 0.14, -4.62); g.add(eye);
  }
  // floating halo ring (gold-white), crowning the silhouette above/behind the head
  const R = 0.34 * k.haloScale;
  const halo = tag(new THREE.TorusGeometry(R, 0.028, 8, 28), mats.halo, 'halo');
  halo.position.set(0, 0.34 + 0.18 * (k.haloHeight - 1) + 0.34, -4.30);
  halo.rotation.x = Math.PI / 2 - 0.32;                                     // tilt so the ring reads as an O from behind
  g.add(halo);
  g.userData.haloPos = halo.position.clone();
  // small blue-white gem nodes around the halo
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const gem = tag(new THREE.OctahedronGeometry(0.038), mats.gem, 'haloGem');
    gem.position.copy(halo.position).add(V(Math.cos(a) * R, Math.sin(a) * R * 0.6, Math.sin(a) * 0.1));
    g.add(gem);
  }
  return g;
}

// ── TAIL: pearl segments, gold vertebra caps, blue glow slits, radiant blade tip,
//    and a straight luminous comet trail streaming toward the camera (+Z). ──────
function buildTail(k, mats) {
  const g = new THREE.Group();
  const segs = [
    [0.54, 0.46, 0.30], [0.56, 0.43, 0.28], [0.58, 0.40, 0.26], [0.58, 0.36, 0.23], [0.56, 0.32, 0.20],
    [0.54, 0.28, 0.17], [0.50, 0.23, 0.14], [0.44, 0.18, 0.11], [0.36, 0.14, 0.09], [0.30, 0.11, 0.08],
  ];
  let z = -0.22; const stations = []; const caps = [];
  for (let i = 0; i < segs.length; i++) {
    const [len, w, h] = segs[i]; const L = len * k.tailLength;
    const cy = -0.02 - i * 0.012;
    stations.push({ z, w, h, cy });
    // gold vertebra cap riding the dorsal line
    const cap = tag(shieldGeo(w * 0.5, L * 0.8, 0.06), mats.gold, 'vertebra');
    place(cap, V(0, cy + h * 0.5, z + L * 0.5), V(0, 1, 0.25), V(0, 0, 1));
    caps.push(cap);
    // thin dawn-blue glow slit down each flank between segments
    if (i < segs.length - 1) for (const s of [-1, 1]) {
      const slit = tag(new THREE.BoxGeometry(0.02, h * 0.5, L * 0.7), mats.seam, 'tailGlow');
      slit.position.set(s * w * 0.42, cy, z + L * 0.5); g.add(slit);
    }
    z += L;
  }
  stations.push({ z, w: 0.08, h: 0.06, cy: -0.14 });
  g.add(tube(stations, mats.pearl, 'tailCore', 9));
  for (const c of caps) g.add(c);
  // radiant blade-fin tip: an upright pearl blade-diamond, gold-rimmed, with a
  // thin holy-white glowing edge — a clean holy blade, not a trident.
  const bl = 0.64 * k.tailLength * 1.5;
  const blade = gildedPlate(0.22, bl, mats, k, 0.02);
  blade.rotation.set(0, 0, Math.PI / 2);                                    // stand it vertical (height in Y)
  blade.position.set(0, 0.06, z + bl * 0.4); g.add(blade);
  const edge = tag(new THREE.BoxGeometry(0.015, 0.30, bl * 0.7), mats.holy, 'bladeCore');
  edge.position.set(0, 0.06, z + bl * 0.35); g.add(edge);
  // straight luminous comet trail streaming toward the camera (+Z)
  const trailLen = 1.3 * k.tailCometLength;
  const comet = tag(new THREE.ConeGeometry(0.07, trailLen, 8), mats.comet, 'comet');
  comet.rotation.x = -Math.PI / 2;                                          // point +Z (toward camera)
  comet.position.set(0, 0.02, z + 0.5 + trailLen * 0.5); g.add(comet);
  g.userData.tailTip = V(0, 0.02, z + 0.5);
  return g;
}

// ── TORSO + spine + tucked legs ───────────────────────────────────────────────
function buildBody(k, mats) {
  const g = new THREE.Group();
  const sl = k.torsoSlimness;
  const body = [
    { z: -4.05, w: 0.40 * sl, h: 0.34, cy: 0.10 }, { z: -3.55, w: 0.54 * sl, h: 0.46, cy: 0.06 },
    { z: -3.20, w: 0.98 * sl, h: 0.60, cy: 0.02 }, { z: -2.55, w: 1.28 * sl, h: 0.68, cy: 0.00 },
    { z: -1.90, w: 1.10 * sl, h: 0.62, cy: 0.00 }, { z: -1.40, w: 0.86 * sl, h: 0.52, cy: -0.02 },
    { z: -0.80, w: 0.82 * sl, h: 0.46, cy: -0.04 }, { z: -0.22, w: 0.50 * sl, h: 0.34, cy: -0.04 },
  ];
  g.add(tube(body, mats.pearl, 'torsoHull', 12));
  // gilded gorget plates wrapping the chest/back (layered gold rings)
  for (const z of [-3.05, -2.7, -2.35]) {
    const st = body.find((s) => s.z >= z) || body[3];
    const ring = tag(new THREE.TorusGeometry(st.w * 0.46, 0.04, 6, 16), mats.gold, 'gorget');
    ring.position.set(0, st.cy, z); ring.scale.set(1, st.h / st.w, 1); g.add(ring);
  }
  // gilded dorsal keel: a row of small gold spine caps down the centreline
  for (let i = 0; i < 7; i++) {
    const t = i / 6; const z = lerp(-3.2, -0.3, t);
    const st = body.reduce((a, b) => Math.abs(b.z - z) < Math.abs(a.z - z) ? b : a);
    const fin = tag(new THREE.ConeGeometry(0.05, 0.16 + 0.06 * Math.sin(t * Math.PI), 4), mats.gold, 'spineCap');
    place(fin, V(0, st.cy + st.h * 0.5, z), V(0, 1, 0.2), null); g.add(fin);
  }
  // flank glow filigree — thin dawn-blue seams along the lower torso
  for (const s of [-1, 1]) {
    const fil = tag(new THREE.BoxGeometry(0.02, 0.06, 1.6), mats.seam, 'filigree');
    fil.position.set(s * 0.5, -0.12, -2.4); g.add(fil);
  }
  // shoulder gem nodes (rare premium accents) at the wing roots
  for (const s of [-1, 1]) {
    const gem = tag(new THREE.OctahedronGeometry(0.07), mats.gem, 'shoulderGem');
    gem.position.set(s * 0.72, 0.26, -0.30 - 3.0); gem.position.z = -3.0 + 0 - 0; gem.position.set(s * 0.66, 0.30, -2.95); g.add(gem);
  }
  // tucked paladin legs (subtle from rear): small gold/pearl pods with talons
  for (const s of [-1, 1]) {
    const leg = tag(new THREE.SphereGeometry(0.16, 8, 6), mats.pearl, 'leg');
    leg.position.set(s * 0.34, -0.30, -1.7); leg.scale.set(0.8, 0.7, 1.3); g.add(leg);
    const claw = tag(new THREE.ConeGeometry(0.04, 0.16, 5), mats.gold, 'claw');
    place(claw, V(s * 0.34, -0.44, -1.45), V(0, -0.4, 1), null); g.add(claw);
  }
  return g;
}

// ── assemble ───────────────────────────────────────────────────────────────
export function buildRadiantPaladin(knobs = {}) {
  const k = { ...DEFAULT_KNOBS, ...knobs };
  const mats = makeMaterials(k);
  const root = new THREE.Group();
  root.name = 'RadiantPaladin';
  root.add(buildBody(k, mats));
  const head = buildHead(k, mats); root.add(head);
  const tail = buildTail(k, mats); root.add(tail);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = buildWing(side, k, mats);
    wing.position.set(side * 0.5, 0.30, -2.7);                              // wing-root sockets (shoulders)
    wing.userData.side = side; wing.userData.restZ = 0;
    root.add(wing); wings.push(wing);
  }
  root.updateMatrixWorld(true);
  // animation handles + the live emissive materials, so a driver can beat the
  // wings, bob the halo, and pulse the seams/comet without re-traversing.
  root.userData.anim = {
    wings, head, tail,
    halo: head.children.find((c) => c.userData.role === 'halo'),
    comet: tail.children.find((c) => c.userData.role === 'comet'),
    glowMats: [mats.seam, mats.halo, mats.comet, mats.holy, mats.gem, mats.eye],
    materials: mats,
  };
  return { group: root, materials: mats, knobs: k };
}

export default buildRadiantPaladin;
