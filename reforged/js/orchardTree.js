// GHOST SAKURA HERO TREE (Empyrean Ghost Orchard P2) — build-to-print from Fable's P2 brief.
// Pure procedural geometry, no textures, flat vertex-colour (baked value ladder). Two merged
// geometries per tree — TRUNK (≤150 tris) and CANOPY (≤150 tris; hulls + tip-tufts + weeping
// strands) — so all trees ship as 2 InstancedMeshes (2 draw calls). Deterministic: buildOrchardTree(seed)
// is a pure function, so studio rounds are pixel-comparable and placement is stable.
//
// Laws honoured by CONSTRUCTION (not by luck): bone-ash trunk L70-76 (cool-violet cast, never <L68 so
// the Mote keeps the true-black monopoly); canopy = 5 unequal jittered icosa hulls with ≥8L inter-hull
// spread + 2 built sky-gaps; rose ONLY on under-edges (ny<-0.25) / outer tips, ≤20% coverage, hue ~330°,
// pale clefts L78-80. Everything reads PALE with rose breathing at the under-edges — a ghost tree, not a
// pink lollipop on a stick.
import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// deterministic PRNG (mulberry32) — one per tree seed
function rng(seed) {
  let s = (seed | 0) || 1;
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// petal ladder constants (shared with ambient.js orchardPetals — the canopy rose IS petal material)
const ROSE_BLOOM = [0.90, 0.42, 0.66];   // tips (hue ~330°, S~0.53, L≤0.55 pre-tonemap → legal pastel post-ACES)
const ROSE_MID   = [0.76, 0.28, 0.51];   // under-edge darker facet
const ROSE_DEEP  = [0.86, 0.30, 0.58];   // deepened underside rose (S~0.65, hue ~330°) — breathes at 60m cruise

// bone-ash → L in [0..1] roughly; faint cool-violet cast (hue ~295°, S≤0.06) to family with the monoliths
function ash(L, jitter) {
  const l = Math.max(0.68, L + (jitter || 0));            // dark-budget floor: never below L68
  return [l * 1.00, l * 0.975, l * 1.02];                 // R≈B>G → faint violet, S~0.045
}

// ---- swept tube along a polyline (non-indexed, position+color) --------------------------------------
// pts: [{x,y,z}], radii: [r per point], sides, squash (elliptical), colorFn(t01, nyLocal, roll)
function sweptTube(pts, radii, sides, squash, rand, colorFn) {
  const pos = [], col = [];
  const rings = [];                                        // each ring = array of {p:[x,y,z], ny}
  const up = new THREE.Vector3(0, 1, 0), refX = new THREE.Vector3(1, 0, 0);
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3();
  const roll0 = rand() * Math.PI * 2;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    // tangent from neighbours
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    T.set(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
    // frame: B = T × ref (ref = up unless near-vertical), N = B × T
    tmp.copy(Math.abs(T.y) > 0.92 ? refX : up);
    B.copy(tmp).cross(T).normalize();
    N.copy(B).clone().cross(T).normalize();
    N.crossVectors(B, T).normalize();
    const r = radii[i], roll = roll0 + i * 0.5 + (rand() - 0.5) * 0.3;
    const ring = [];
    for (let s = 0; s < sides; s++) {
      const ang = roll + (s / sides) * Math.PI * 2;
      const cx = Math.cos(ang) * r, cz = Math.sin(ang) * r * squash;
      const vx = p.x + N.x * cx + B.x * cz, vy = p.y + N.y * cx + B.y * cz, vz = p.z + N.z * cx + B.z * cz;
      // local up component of the surface normal (for fake AO underside): approx radial dir's y
      const ny = (N.y * Math.cos(ang) + B.y * Math.sin(ang));
      ring.push({ p: [vx, vy, vz], ny });
    }
    rings.push(ring);
  }
  // stitch consecutive rings into quads (2 tris) — non-indexed
  for (let i = 0; i < rings.length - 1; i++) {
    const t0 = i / (rings.length - 1), t1 = (i + 1) / (rings.length - 1);
    const A = rings[i], C = rings[i + 1];
    for (let s = 0; s < sides; s++) {
      const s2 = (s + 1) % sides;
      const quad = [[A[s], t0], [C[s], t1], [C[s2], t1], [A[s], t0], [C[s2], t1], [A[s2], t0]];
      for (const [v, t] of quad) {
        pos.push(v.p[0], v.p[1], v.p[2]);
        const c = colorFn(t, v.ny, rand);
        col.push(c[0], c[1], c[2]);
      }
    }
  }
  // cap the top ring to an apex (collapsed fan) so no open ends
  const top = rings[rings.length - 1], apex = pts[pts.length - 1];
  for (let s = 0; s < sides; s++) {
    const s2 = (s + 1) % sides;
    const tri = [top[s], top[s2], { p: [apex.x, apex.y, apex.z], ny: 1 }];
    for (const v of tri) { pos.push(v.p[0], v.p[1], v.p[2]); const c = colorFn(1, v.ny, rand); col.push(c[0], c[1], c[2]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---- one jittered icosa hull (indexed→jitter 12 verts→non-indexed flat→colour per face) --------------
// roseFrac: probability a qualifying DOWNWARD face (ny<-0.30) is rose. Crown 0 → mass stays PALE; only
// the low undersides breathe rose. This is what keeps rose ≤20% of canopy pixels (no pink blob).
function hull(cx, cy, cz, r, squashY, rand, baseL, roseFrac, holeZ) {
  const ico = new THREE.IcosahedronGeometry(r, 0);        // indexed, 12 verts / 20 faces
  const p = ico.attributes.position;
  for (let v = 0; v < p.count; v++) {                     // jitter each unique vert radially — SPIKY
    const j = 1 + (0.22 + rand() * 0.16) * (rand() < 0.5 ? -1 : 1);   // spiky (±22-38%) → notched silhouette without splitting into balloons
    p.setXYZ(v, p.getX(v) * j, p.getY(v) * j * squashY, p.getZ(v) * j);
  }
  const flat = ico.toNonIndexed();
  flat.computeVertexNormals();                            // flat per-face normals (facet grain + ny rose)
  flat.translate(cx, cy, cz);
  const nn = flat.attributes.normal, fp = flat.attributes.position;
  const faces = fp.count / 3;
  // holeZ: delete the ±z cap faces → a ring band with a TUNNEL along the camera axis. Placed where sky
  // is behind, the tunnel reads as an enclosed sky-window through the foliage (and costs FEWER tris).
  const keep = [];
  for (let f = 0; f < faces; f++) if (!(holeZ && Math.abs(nn.getZ(f * 3)) > 0.42)) keep.push(f);
  const pos = [], col = [];
  for (const f of keep) {
    const ny = nn.getY(f * 3);                            // flat face normal (all 3 verts equal)
    const grain = (((Math.sin(f * 12.9898 + cx) * 43758.5453) % 1) + 1) % 1 * 0.05 - 0.025;   // ±2.5L per face
    const upMod = ny > 0.2 ? 0.02 : (ny < -0.2 ? -0.03 : 0);   // up +2L / down -3L within hull
    const rHash = (((Math.sin(f * 78.233 + cy) * 21783.1) % 1) + 1) % 1;
    let c;
    if (ny < -0.30 && rHash < roseFrac) {
      // two-tone rose facets (kills flat paper-cut); the low satellites (roseFrac≥0.5) run DEEPER so rose breathes at 60m
      c = (f & 1) ? (roseFrac >= 0.5 ? ROSE_DEEP : ROSE_BLOOM) : ROSE_MID;
    } else {
      const L = Math.max(0.68, baseL + upMod + grain);   // pale body / clefts, never <L68 (Mote monopoly)
      c = [L * 1.00, L * 0.975, L * 1.02];
    }
    for (let k = 0; k < 3; k++) { pos.push(fp.getX(f * 3 + k), fp.getY(f * 3 + k), fp.getZ(f * 3 + k)); col.push(c[0], c[1], c[2]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---- a small tip-tuft (triangular bipyramid, 6 tris) — ceremonial silhouette breaker -----------------
function tuft(cx, cy, cz, r, rand) {
  const pos = [], col = [];
  const top = [cx, cy + r, cz], bot = [cx, cy - r * 0.7, cz];
  const ring = [];
  for (let s = 0; s < 3; s++) { const a = rand() * 6.28 + s * 2.094; ring.push([cx + Math.cos(a) * r, cy + (rand() - 0.5) * r * 0.4, cz + Math.sin(a) * r]); }
  const rose = ROSE_BLOOM;
  for (let s = 0; s < 3; s++) {
    const s2 = (s + 1) % 3;
    for (const v of [top, ring[s], ring[s2]]) { pos.push(v[0], v[1], v[2]); col.push(rose[0], rose[1], rose[2]); }
    for (const v of [bot, ring[s2], ring[s]]) { pos.push(v[0], v[1], v[2]); col.push(rose[0], rose[1], rose[2]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---- a weeping strand (tapered ribbon, 4 segments, catenary droop; tip = petal bloom) ----------------
function strand(ax, ay, az, rand) {
  const pos = [], col = [];
  const segs = 4, len = 2.5 + rand() * 1.5;
  const swayAxis = rand() * 6.28, swayAmp = 0.5 + rand() * 0.6;
  const pts = [], wid = [], lum = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const droop = len * (t * t);                          // catenary-ish: accelerates down
    const sway = Math.sin(t * 3.1 + swayAxis) * swayAmp * t;
    pts.push([ax + Math.cos(swayAxis) * sway, ay - droop, az + Math.sin(swayAxis) * sway]);
    wid.push(0.22 * (1 - t) + 0.05 * t);                  // 0.22→0.05 taper (≥3:1)
    lum.push(t);                                          // 0=pale root → 1=bloom tip
  }
  const colAt = (t) => {
    if (t > 0.72) return ROSE_BLOOM;                      // tip = petal material
    const L = 0.86 - t * 0.06 + ((Math.sin(t * 91.7) % 1) * 0.04 - 0.02);   // pearl L80-86 + grain
    return [L * 1.00, L * 0.985, L * 1.02];
  };
  for (let i = 0; i < segs; i++) {
    const a = pts[i], b = pts[i + 1], wa = wid[i], wb = wid[i + 1];
    const q0 = [a[0] - wa, a[1], a[2]], q1 = [a[0] + wa, a[1], a[2]], q2 = [b[0] + wb, b[1], b[2]], q3 = [b[0] - wb, b[1], b[2]];
    const ca = colAt(lum[i]), cb = colAt(lum[i + 1]);
    for (const [v, c] of [[q0, ca], [q1, ca], [q2, cb], [q0, ca], [q2, cb], [q3, cb]]) { pos.push(v[0], v[1], v[2]); col.push(c[0], c[1], c[2]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// ---- assemble one tree ------------------------------------------------------------------------------
export function buildOrchardTree(seed = 1) {
  const rand = rng(seed);
  // TRUNK: S-curve spine, elliptical 5-sided rings, taper 2.6:1, basal flare, fork ~37%.
  const H = 15;                                            // ~14-15m to crown; per-instance scale ≤1.0
  const forkY = H * 0.37;
  const lean = (rand() - 0.5) * 0.5;
  const spine = [
    { x: 0, y: 0, z: 0 },
    { x: lean * 0.6, y: forkY * 0.34, z: lean * 0.4 },
    { x: -lean * 0.5, y: forkY * 0.68, z: -lean * 0.3 },   // opposing bend (S-curve)
    { x: lean * 0.7, y: forkY, z: lean * 0.5 },
  ];
  const trunkR = [0.62, 0.42, 0.30, 0.24];                 // 2.6:1 taper; basal flare below
  const ashCol = (t, ny) => ash(0.70 + t * 0.06, ny < 0 ? -0.02 : 0);   // L70 root → L76 fork, underside -2L
  const trunkGeo = sweptTube(spine, trunkR, 5, 0.85, rand, ashCol);
  // basal flare: widen the first ring by pushing a squat root ring below
  const rootRing = sweptTube([{ x: 0, y: -0.4, z: 0 }, { x: 0, y: 0.2, z: 0 }], [1.05, 0.62], 5, 0.9, rand, (t, ny) => ash(0.70, ny < 0 ? -0.02 : 0));

  // two primary limbs + a secondary bough, leaving the fork and CURVING UP (drift-up in the wood)
  const fork = spine[3];
  const limb = (dx, dz, up, sides) => {
    const l0 = { x: fork.x, y: fork.y, z: fork.z };
    const l1 = { x: fork.x + dx * 1.4, y: fork.y + up * 0.5, z: fork.z + dz * 1.4 };
    const l2 = { x: fork.x + dx * 2.2, y: fork.y + up * 1.7, z: fork.z + dz * 2.2 };   // curve up
    const l3 = { x: fork.x + dx * 2.6, y: fork.y + up * 3.0, z: fork.z + dz * 2.6 };
    return sweptTube([l0, l1, l2, l3], [0.24, 0.19, 0.13, 0.07], sides, 0.9, rand, (t) => ash(0.72 + t * 0.04));
  };
  const limbA = limb(0.55, 0.18, 1.0, 4);
  const limbB = limb(-0.5, -0.22, 1.0, 4);
  const bough = limb(0.15, 0.6, 0.85, 4);
  const trunk = mergeGeometries([trunkGeo, rootRing, limbA, limbB, bough], false);
  if (!trunk) throw new Error('orchardTree: trunk mergeGeometries returned null');

  // CANOPY: 5 unequal jittered hulls (2 built sky-gaps) + 3 tip-tufts + 3 weeping strands.
  // spaced so ≥2 sky-windows open: an upper gap between crown and each mid, and a lower-centre gap
  // between the two satellites (above the fork). Overlap kept ~20-30% so it still reads as one crown.
  // Open "vase" ring: crown pushed BACK, two mids wide L/R, two satellites low FRONT/BACK — the centre
  // (above the fork) stays hollow so an upper-centre sky-window opens, and the spiky jitter opens more
  // windows between neighbouring lobes. Overlap ~20-30% keeps it reading as one crown.
  // Overlapping crown: hulls interpenetrate ~25-30% so it reads as ONE connected crown (not 5 balloons),
  // the spiky jitter cuts notches into the silhouette, and the low satellites carry the rose undersides.
  // z-spread widened so the SIDE silhouette is wider-than-tall (W/H≥1.1). Two upper gaps are bridged
  // below into enclosed sky-windows.
  // Two hulls are HOLED (z-tunnel) where sky sits behind them → 2 enclosed sky-windows that survive the
  // ¾/cruise projection. The rest overlap into one connected crown; low satellites carry the rose.
  const hulls = [
    hull(0.0, 11.5, -0.2, 2.05, 0.80, rand, 0.88, 0.0, true),   // crown  L88 — HOLED (sky above/behind)
    hull(3.4, 9.6, 1.0, 1.95, 0.82, rand, 0.84, 0.24, false),   // mid A (upper-right, +z)  L84
    hull(-3.3, 10.0, -1.7, 2.05, 0.82, rand, 0.82, 0.24, true), // mid B (rearmost) L82 — HOLED (sky behind)
    hull(1.6, 8.3, 1.3, 1.6, 0.85, rand, 0.78, 0.7, false),     // sat A (low-right)  L78 — rose breathes
    hull(-1.5, 8.5, -1.3, 1.5, 0.85, rand, 0.78, 0.7, false),   // sat B (low-left)  L78
  ];
  // tip-tufts outside the main mass (silhouette breakers)
  const tufts = [tuft(3.6, 7.6, 1.4, 0.7, rand), tuft(-3.5, 7.8, -1.5, 0.65, rand), tuft(0.1, 11.9, -0.3, 0.6, rand)];  // top cap nudged down into the crown mass (Fable polish)
  // weeping strands hung from under-edges of the mid/sat hulls
  const strands = [strand(1.4, 6.9, 1.7, rand), strand(-1.3, 7.1, -1.8, rand), strand(2.7, 8.5, 1.2, rand)];
  const canopy = mergeGeometries([...hulls, ...tufts, ...strands], false);
  if (!canopy) throw new Error('orchardTree: canopy mergeGeometries returned null');

  return { trunk, canopy };
}
