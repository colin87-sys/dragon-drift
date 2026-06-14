import * as THREE from 'three';

// Dragon body components — the from-the-ground-up geometry for the redesigned
// anatomy. dragonModel.js assembles these into the full rig; keeping the heavy
// geometry here keeps that file focused on materials, decoration flags and the
// animation hookpoints the rig/preview depend on.
//
//   buildArrowTorso()   sleek arrowhead torso (keel + strong shoulders + narrow
//                        hips), replacing the round lathe.
//   wing system         WING_FORMS / buildWingShape / archWing — per-form wing
//                        SHAPE + a vertical arc PROFILE that bakes a dragon-wing
//                        elbow (wrist peak) so each tier reads differently from
//                        the direct-rear gameplay camera.
//   buildCleanTail()    one continuous tapered tail (no detached shards), dark
//                        with gold accents so it never reads as a hazard.

// ===========================================================================
// BODY — aerodynamic arrowhead
// ===========================================================================
// Lofted from a blade cross-section: a pointed dorsal keel on top, flatter
// sides (less round/lumpy mass), a tapered belly. Strong shoulders → narrow
// waist → narrow hips → slim tail root that the tail continues cleanly from.
export function buildArrowTorso() {
  // station: [z, halfWidth, keelTop, belly]  (z: head at -, tail at +)
  const stations = [
    [-3.05, 0.15, 0.10, 0.13], // neck cap (meets the neck chain)
    [-2.45, 0.30, 0.22, 0.24], // neck base
    [-1.65, 0.52, 0.42, 0.38], // fore-shoulder
    [-0.85, 0.66, 0.54, 0.46], // shoulder peak — broadest, tallest keel
    [-0.10, 0.55, 0.45, 0.40], // thorax
    [ 0.60, 0.39, 0.33, 0.29], // waist (clear pinch)
    [ 1.15, 0.29, 0.25, 0.20], // narrow hips
    [ 1.70, 0.17, 0.17, 0.11], // slim tail root
  ];
  const M = 8;
  // Unit cross-section: keel apex on top (0,top), widest at mid-height, rounded
  // belly. Ordered CCW looking toward -z so face winding points outward.
  const ring = (w, top, bot) => [
    [0, top], [-w * 0.70, top * 0.30], [-w, -bot * 0.10], [-w * 0.62, -bot * 0.64],
    [0, -bot], [w * 0.62, -bot * 0.64], [w, -bot * 0.10], [w * 0.70, top * 0.30],
  ];
  const verts = [];
  for (const [z, w, top, bot] of stations)
    for (const [x, y] of ring(w, top, bot)) verts.push(x, y, z);
  const idx = [];
  for (let s = 0; s < stations.length - 1; s++) {
    const a0 = s * M, b0 = (s + 1) * M;
    for (let m = 0; m < M; m++) {
      const n = (m + 1) % M;
      idx.push(a0 + m, b0 + m, a0 + n, a0 + n, b0 + m, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Top-of-keel height at a given body z — lets the caller run a glowing spine
// ridge precisely along the crest of the arrowhead back.
export function keelTopAt(z) {
  const pts = [[-2.45, 0.22], [-0.85, 0.54], [-0.10, 0.45], [0.60, 0.33], [1.15, 0.25], [1.70, 0.17]];
  if (z <= pts[0][0]) return pts[0][1];
  if (z >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (z <= pts[i + 1][0]) {
      const t = (z - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    }
  }
  return pts[pts.length - 1][1];
}

// ===========================================================================
// WINGS — shape per form + a baked vertical "elbow" arc profile
// ===========================================================================
// The dominant rear-view lever is the wing's VERTICAL profile. A flat wing is
// edge-on and reads as a strip; bowing it presents a real outline. Better still,
// an outer-weighted bow with a WRIST HUMP gives the classic dragon-wing elbow
// (wrist up, fingers/tip flaring), so each tier's profile is unmistakable:
//
//   arc = { bow, hump, humpAt, hook }  (all measured against the span, ∝ ws)
//     bow     gentle overall rise toward the tip
//     hump    a raised wrist/elbow at humpAt (fraction of span) — the dragon read
//     hook    a sharp up-flare at the very tip (nx^4) — the wingtip personality
//
//   tips    finger-tip anchors [x span, y chord], far tip first (horizontal cut)
//   scallop trailing-web depth · flame: V-notch the OUTER webs only (apex)
export const WING_FORMS = {
  // T0 — baby whelp: short, narrow, almost-straight glider. No elbow.
  0: { tips: [[3.95, 0.26], [3.05, -0.36], [1.95, -0.66]],
       lead: [2.55, 0.44], scallop: 0.16, flame: false,
       arc: { bow: 0.5, hump: 0.0, humpAt: 0.6, hook: 0.12 } },
  // T1 — kindled: a 4th finger, gentle scallop, a small wrist elbow appears.
  1: { tips: [[4.95, 0.32], [3.95, -0.44], [2.65, -0.90], [1.45, -0.96]],
       lead: [3.35, 0.56], scallop: 0.34, flame: false,
       arc: { bow: 0.5, hump: 0.7, humpAt: 0.55, hook: 0.22 } },
  // T2 — radiant: wider, swept, a strong elbow and a hooked-up outer tip.
  2: { tips: [[5.35, 0.42], [4.50, -0.52], [3.10, -1.06], [1.70, -1.18]],
       lead: [3.75, 0.66], scallop: 0.56, flame: false,
       arc: { bow: 0.5, hump: 1.2, humpAt: 0.58, hook: 0.7 } },
  // T3 — eternal: widest framing wings, pronounced elbow + dramatic flared tip,
  // flame V-notches on the outer third only.
  3: { tips: [[5.70, 0.52], [4.85, -0.46], [3.55, -1.02], [2.15, -1.22], [1.05, -1.04]],
       lead: [4.05, 0.74], scallop: 0.50, flame: true,
       arc: { bow: 0.6, hump: 1.7, humpAt: 0.60, hook: 1.2 } },
};
// Legacy membrane for dragons not yet on the per-form system — flat, no elbow.
export const DEFAULT_WING = {
  tips: [[5.25, 0.34], [4.40, -0.50], [3.05, -1.00], [1.70, -1.12]],
  lead: [3.80, 0.64], scallop: 0.50, flame: false,
  arc: { bow: 0, hump: 0, humpAt: 0.6, hook: 0 },
};

// Per-form wing shape: a dragon may define its OWN `wingForms` (so each dragon
// has a distinct silhouette); otherwise fall back to the shared Solar set, then
// the flat legacy default.
export function wingSpecFor(def, model) {
  const f = model.wingForm;
  if (def.wingForms && def.wingForms[f]) return def.wingForms[f];
  return (f != null && WING_FORMS[f]) ? WING_FORMS[f] : DEFAULT_WING;
}

export function buildWingShape(spec) {
  const tips = spec.tips;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  // Leading edge: a clean sweep from the wrist out to the far wing tip.
  s.bezierCurveTo(1.8, 0.62, spec.lead[0], spec.lead[1], tips[0][0], tips[0][1]);
  // Trailing edge: scalloped webs between finger tips. Flame forms V-notch only
  // the OUTER webs (edge drama, disciplined centre).
  for (let i = 0; i < tips.length - 1; i++) {
    const [ax, ay] = tips[i];
    const [bx, by] = tips[i + 1];
    const cx = (ax + bx) / 2;
    if (spec.flame && i < 2) {
      s.lineTo(cx, (ay + by) / 2 + spec.scallop * 1.5);
      s.lineTo(bx, by);
    } else {
      s.quadraticCurveTo(cx, (ay + by) / 2 + spec.scallop, bx, by);
    }
  }
  s.quadraticCurveTo(0.85, -0.34, 0, -0.28);
  return s;
}

// Vertical lift at a normalised span position nx∈[0,1], in wing-local units.
export function archProfile(nx, a) {
  const hump = a.hump * Math.exp(-Math.pow((nx - a.humpAt) / 0.26, 2));
  return a.bow * nx + hump + a.hook * Math.pow(nx, 4);
}
export function archLift(x, maxX, a, k = 1) {
  const nx = maxX > 0 ? Math.min(Math.abs(x) / maxX, 1) : 0;
  return archProfile(nx, a) * k;
}
// Bow a flattened membrane geometry along its arc profile (k scales by ws).
export function archWing(geo, a, k = 1) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const maxX = Math.max(Math.abs(bb.min.x), Math.abs(bb.max.x)) || 1;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) + archLift(pos.getX(i), maxX, a, k));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// A tapered bone strut from the wrist to a finger tip; endY lifts the tip so the
// bone follows the membrane's arc instead of poking through flat.
export function wingStrut(x, z, r0, r1, mat, endY = 0) {
  const dir = new THREE.Vector3(x, endY, z);
  const len = dir.length() || 0.001;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 5), mat);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.position.set(x / 2, 0.015 + endY / 2, z / 2);
  return m;
}

export function buildFeatherWingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.5, 2.2, 1.0, 3.0, 0.7);
  s.lineTo(4.8, 0.2);
  s.lineTo(4.6, -0.25); s.lineTo(4.2, -0.05);
  s.lineTo(3.8, -0.55); s.lineTo(3.3, -0.2);
  s.lineTo(2.8, -0.8);  s.lineTo(2.2, -0.4);
  s.lineTo(1.6, -1.05); s.lineTo(1.2, -0.75);
  s.bezierCurveTo(0.8, -0.6, 0.4, -0.45, 0, -0.4);
  return s;
}

const innerC = new THREE.Color();
const outerC = new THREE.Color();
export function applyWingGradient(geo, palette, tStart = 0, tEnd = 1) {
  innerC.setHex(palette.wingInner);
  outerC.setHex(palette.wingOuter);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const spanX = Math.max(bb.max.x - bb.min.x, 1e-5);
  for (let i = 0; i < pos.count; i++) {
    const kx = Math.abs(pos.getX(i) - (Math.abs(bb.min.x) > Math.abs(bb.max.x) ? bb.max.x : bb.min.x)) / spanX;
    const t = tStart + (tEnd - tStart) * kx;
    c.lerpColors(innerC, outerC, Math.min(t, 1));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// ===========================================================================
// TAIL — one continuous tapered piece (no detached shards)
// ===========================================================================
// A flat swallowtail outline for the comet tail tip.
export function buildForkShape(spread, length, notch) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.16, 0.10);
  s.lineTo(spread, length);   // right tine tip
  s.lineTo(0, notch);         // inner V between the tines
  s.lineTo(-spread, length);  // left tine tip
  s.lineTo(-0.16, 0.10);
  s.closePath();
  return s;
}

// A single elongated diamond blade outline (flat), for the T2 blade tail.
function buildBladeShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(halfW, length * 0.42);
  s.lineTo(0, length);
  s.lineTo(-halfW, length * 0.42);
  s.closePath();
  return s;
}

// A swept fin with a DARK translucent membrane and a bright glowing RIM — the
// premium "dark base, cyan edges" read (never a solid glowing panel). A slightly
// larger emissive blade sits just behind the dark membrane, so only its border
// peeks out as a luminous outline. Returned upright (tip at +y, width on ±x) in
// its own group; the caller rotates/positions it into a tail stabilizer, a
// wingtip winglet or a hip fin.
export function edgedFin(halfW, length, membraneMat, edgeMat, rim = 1.16) {
  const g = new THREE.Group();
  const rimMesh = new THREE.Mesh(new THREE.ShapeGeometry(buildBladeShape(halfW * rim, length * rim)), edgeMat);
  rimMesh.position.z = -0.014;           // tuck behind so only the rim shows
  g.add(rimMesh);
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(buildBladeShape(halfW, length)), membraneMat));
  return g;
}

// Build the tail as a CHAIN of heavily-overlapping segments, each a little
// group (tapered frustum + dorsal spine plate) so the rig can coil them like a
// snake while the root segment stays locked to the body — it never reads as a
// detached spear, and the spine flows continuously from the back onto the tail.
// Returns { group, segs }: `group` is anchored at the hip by the caller; `segs`
// is the root→tip chain the rig animates (segs[0] locked, amplitude ramps out).
export function buildCleanTail(def, model, bodyMat) {
  const root = new THREE.Group();
  const segs = [];
  const style = model.tailStyle || 'simple';
  const g = model.spineGlow || 0;
  const gi = model.glowIntensity ?? 1;     // emissive multiplier (can exceed 1 at the apex)
  // Emissive-intensity clamp: the apex carries its extra "charge" through MORE
  // glowing elements (chevrons, edges, particles) + size, not a blown-out cyan
  // that the ACES tone-map would just clip to white.
  const giM = Math.min(gi, 1.3);
  // tailLength (Radiant = 1.0) authors the per-form tail proportion directly when
  // present; otherwise fall back to the segment-count proxy used by the rest of
  // the roster.
  const lenScale = model.tailLength != null
    ? model.tailLength * (4 / 3)                          // 3.6 at Radiant (matches the proxy)
    : Math.min(model.tailSegments || 6, 9) / 6;
  const N = 7;
  const len = 2.7 * lenScale;
  const baseR = 0.27, tipR = 0.05;        // base ≈ hip width, so it flows out cleanly
  const spacing = len / (N - 1);
  const segLen = spacing * 2.4;            // big overlap → seamless even when coiling

  // Spine plates: dull at the whelp (def.scales), molten from the lit forms.
  const accentCol = g > 0 ? (def.apexSeam || def.scales) : def.scales;
  const plateMat = new THREE.MeshStandardMaterial({
    color: accentCol, emissive: accentCol, emissiveIntensity: (0.3 + g * 1.5) * giM,
    roughness: 0.35, metalness: 0.5,
  });
  plateMat.userData.baseEmissive = accentCol;
  plateMat.userData.baseIntensity = (0.3 + g * 1.5) * giM;
  const accentMats = [plateMat];
  const membraneMat = new THREE.MeshStandardMaterial({
    color: def.body, emissive: def.wingOuter || def.body, emissiveIntensity: 0.2,
    roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide,
    transparent: true, opacity: 0.9,
  });
  // Bright rim material for edged fins (tail stabilizers) — created lazily so only
  // the apex tail pays for it; flares on Surge via spineMats. The intensity is
  // CLAMPED (giM) so the cyan rim stays cyan under the ACES tone-map.
  let edgeMat = null;
  function ensureEdgeMat() {
    if (edgeMat) return edgeMat;
    const edgeCol = def.apexSeam || def.eye || def.wingEmissive;
    const eInt = 0.7 + giM * 0.35;
    edgeMat = new THREE.MeshStandardMaterial({
      color: edgeCol, emissive: edgeCol, emissiveIntensity: eInt,
      roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
    });
    edgeMat.userData.baseEmissive = edgeCol;
    edgeMat.userData.baseIntensity = eInt;
    accentMats.push(edgeMat);
    return edgeMat;
  }
  // Fin FILL for the edged stabilizers/fins: a dark NAVY membrane (not near-black)
  // so the fins read as solid dark blades with a cyan rim — never hollow.
  let finFillMat = null;
  function ensureFinFill() {
    if (finFillMat) return finFillMat;
    finFillMat = new THREE.MeshStandardMaterial({
      color: def.wingInner || def.body, emissive: def.body, emissiveIntensity: 0.14,
      roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    });
    return finFillMat;
  }

  function spinePlate(r) {
    const h = 0.12 + g * 0.16;
    const plate = new THREE.Mesh(new THREE.ConeGeometry(0.04 + r * 0.16, h, 4), plateMat);
    plate.position.set(0, r * 0.85, 0.04);
    plate.rotation.x = -0.18;
    return plate;
  }

  // Shaft segments. Each is its own group at a fixed z; the rig sways x/y so the
  // chain coils, with the root (segs[0]) held at the hip.
  for (let i = 0; i < N; i++) {
    const r0 = baseR + (tipR - baseR) * (i / (N - 1));
    const r1 = baseR + (tipR - baseR) * ((i + 1) / (N - 1));
    const seg = new THREE.Group();
    seg.position.set(0, 0, i * spacing);
    const frustum = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, 8), bodyMat);
    frustum.rotation.x = Math.PI / 2;
    seg.add(frustum);
    seg.add(spinePlate(r0));
    root.add(seg);
    segs.push(seg);
  }

  // Tip ornament — the final coiling segment, overlapping the shaft end.
  const tip = new THREE.Group();
  tip.position.set(0, 0, (N - 1) * spacing);
  if (style === 'comet') {
    const forkGeo = new THREE.ShapeGeometry(buildForkShape(0.46, 1.5, 0.85));
    forkGeo.rotateX(Math.PI / 2);
    tip.add(new THREE.Mesh(forkGeo, membraneMat));
    for (const sx of [-1, 1]) {
      const a = new THREE.Vector3(sx * 0.05, 0, 0);
      const b = new THREE.Vector3(sx * 0.46, 0, 1.5);
      const dir = b.clone().sub(a);
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.045, dir.length(), 4), plateMat);
      edge.position.copy(a).add(b).multiplyScalar(0.5);
      edge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      tip.add(edge);
    }
  } else if (style === 'firefan') {
    // Phoenix fire-feather fan: a splayed fan of flame plumes (centre longest),
    // each gold-edged — a flowing tail of fire seen from behind.
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) / 2;                       // -1 .. 1 across the fan
      const len = 1.5 - Math.abs(a) * 0.45;
      const plumeGeo = new THREE.ShapeGeometry(buildBladeShape(0.2, len));
      plumeGeo.rotateX(Math.PI / 2);
      const plume = new THREE.Mesh(plumeGeo, plateMat);
      plume.rotation.y = a * 0.6;                   // splay outward
      plume.position.set(a * 0.08, 0, -0.05);
      tip.add(plume);
    }
  } else if (style === 'blade') {
    const bladeGeo = new THREE.ShapeGeometry(buildBladeShape(0.3, 1.35));
    bladeGeo.rotateX(Math.PI / 2);
    tip.add(new THREE.Mesh(bladeGeo, membraneMat));
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.045, 1.35, 4), plateMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(0, 0, 0.67);
    tip.add(edge);
  } else if (style === 'twinfin') {
    // Night-fury twin tail fins: two swept membrane fans flanking the tip, with
    // a glowing rib on each — reads as a distinct forked rudder from behind.
    for (const sx of [-1, 1]) {
      const finGeo = new THREE.ShapeGeometry(buildBladeShape(0.55, 1.25));
      finGeo.rotateX(Math.PI / 2);
      const fin = new THREE.Mesh(finGeo, membraneMat);
      fin.rotation.y = sx * 0.62;          // splay the two fins outward
      fin.position.set(sx * 0.08, 0, -0.05);
      tip.add(fin);
      const a = new THREE.Vector3(sx * 0.05, 0, 0);
      const b = new THREE.Vector3(sx * 0.62, 0, 1.2);
      const dir = b.clone().sub(a);
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.04, dir.length(), 4), plateMat);
      rib.position.copy(a).add(b).multiplyScalar(0.5);
      rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      tip.add(rib);
    }
  } else if (style === 'tailfin') {
    // RADIANT signature: one prominent swept dorsal tail-fin (a dark membrane
    // diamond with a bright cyan rim) plus a small ventral counter-fin — the
    // "full tail fin" that the apex's twin stabilizers later evolve from. Scales
    // with tailFinScale so it reads clearly bigger than the Kindled finlet.
    const fs = model.tailFinScale ?? 1;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    const dorsal = edgedFin(0.34 * fs, 1.12 * fs, fill, em);
    dorsal.rotation.x = 0.6;                  // stand it up + sweep the tip rearward
    dorsal.position.set(0, 0.10, 0.02);
    tip.add(dorsal);
    const ventral = edgedFin(0.18 * fs, 0.52 * fs, fill, em);
    ventral.rotation.x = Math.PI - 0.5;       // mirror below the tail
    ventral.position.set(0, -0.06, 0.02);
    tip.add(ventral);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.6, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.3);
    tip.add(point);
  } else if (style === 'twinstab') {
    // ETERNAL signature — the dramatic rear-silhouette change: TWIN swept
    // stabilizers canted DOWN and OUTWARD (an anhedral V, not a flat fork or a
    // spear) flanking a slim central rudder. Dark membranes, bright cyan rims.
    // tailFinScale sizes them, tailFinSpread sets how far they splay.
    const fs = model.tailFinScale ?? 1.6;
    const spread = model.tailFinSpread ?? 1.6;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    for (const sx of [-1, 1]) {
      // Build upright, then mount on a pivot that cants it down-and-out + toes it
      // outward + sweeps it back — the swept stabilizer read from directly behind.
      const fin = edgedFin(0.30 * fs, 1.30 * fs, fill, em);
      const pivot = new THREE.Group();
      pivot.add(fin);
      pivot.rotation.z = sx * (1.05 + 0.32 * spread);  // past horizontal → tips DOWN & OUT
      pivot.rotation.y = sx * 0.30 * spread;           // toe the blade outward
      pivot.rotation.x = 0.34;                         // sweep the whole fin rearward
      pivot.position.set(sx * 0.12, 0.04, 0.0);
      tip.add(pivot);
    }
    // Slim central rudder — a short upright fin that breaks the gap between the
    // two stabilizers so the cluster never reads as a simple fork.
    const rudder = edgedFin(0.15, 0.74, fill, em);
    rudder.rotation.x = 0.46;
    rudder.position.set(0, 0.14, 0.0);
    tip.add(rudder);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.62, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.32);
    tip.add(point);
  } else if (style === 'shard') {
    // Obsidian crystal shards: a cluster of sharp, faceted obsidian-crystal
    // spikes radiating from the tip — shattered, severe and brutal (not a soft
    // membrane fin), with a dangerous plasma edge. Unique to Obsidian.
    const shardMat = new THREE.MeshStandardMaterial({
      color: def.body, emissive: def.apexSeam || def.eye, emissiveIntensity: 0.25 + g * 1.1,
      roughness: 0.26, metalness: 0.55, flatShading: true,
    });
    shardMat.userData.baseEmissive = def.apexSeam || def.eye;
    shardMat.userData.baseIntensity = 0.25 + g * 1.1;
    const layout = [
      { ry: 0.0, len: 1.6, w: 0.14 },
      { ry: 0.52, len: 1.2, w: 0.11 }, { ry: -0.52, len: 1.2, w: 0.11 },
      { ry: 1.0, len: 0.82, w: 0.085 }, { ry: -1.0, len: 0.82, w: 0.085 },
    ];
    for (const s of layout) {
      // Elongated octahedron = a sharp, faceted obsidian crystal shard.
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), shardMat);
      shard.scale.set(s.w, s.w * 0.72, s.len);
      const reach = s.len * 0.5 + 0.12;       // radiate from a common root
      shard.position.set(Math.sin(s.ry) * reach, 0.02, Math.cos(s.ry) * reach);
      shard.rotation.y = s.ry;
      tip.add(shard);
    }
  } else if (style === 'finned') {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.46, 4), plateMat);
    fin.scale.set(1, 1, 0.5);
    fin.position.set(0, 0.26, -0.05);
    tip.add(fin);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.6, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.3);
    tip.add(point);
  } else {
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.55, 6), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.28);
    tip.add(point);
  }
  root.add(tip);
  segs.push(tip);

  return { group: root, segs, plateMat, accentMats };
}
