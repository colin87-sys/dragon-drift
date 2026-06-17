import * as THREE from 'three';
import { seg } from './modelDetail.js';

// Dragon body components — the from-the-ground-up geometry for the redesigned
// anatomy. dragonModel.js assembles these into the full rig; keeping the heavy
// geometry here keeps that file focused on materials, decoration flags and the
// animation hookpoints the rig/preview depend on.
//
// The composable parts (torso / wings / tail / head) each live in their own
// module behind the recipe registry; this file is the shared SHAPE-PRIMITIVES
// library they build from:
//
//   wing system    WING_FORMS / buildWingShape / archWing — per-form wing SHAPE +
//                  a vertical arc PROFILE that bakes a dragon-wing elbow (wrist
//                  peak) so each tier reads differently from the rear camera.
//   tail shapes    buildForkShape / buildBladeShape / buildSpadeShape / fins
//                  (edgedFin / buildLayeredFin) — outlines the tail module
//                  (dragonTail.js) assembles into the continuous tail.

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
  // Root CHORD: how long the wing BASE attaches to the body (front↔back). Default
  // 0.28 = a pinched, bolted-on root; spec.rootChord lengthens it so wide wings read
  // as anchored ALONG the back. The extra depth splits half forward of the pivot so
  // the longer root stays balanced. Other dragons omit it → byte-identical.
  const rc = spec.rootChord ?? 0.28;
  const lead0 = Math.max(0, (rc - 0.28) * 0.5);
  const s = new THREE.Shape();
  s.moveTo(0, lead0);
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
  s.quadraticCurveTo(0.85, -0.34, 0, -rc);
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
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg(5)), mat);
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
export function buildBladeShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(halfW, length * 0.42);
  s.lineTo(0, length);
  s.lineTo(-halfW, length * 0.42);
  s.closePath();
  return s;
}

// A soft leaf / spade outline (rounded body tapering to a point) for the
// hatchling tail tip — a hint of the fin system to come, not a plain stick.
export function buildSpadeShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(halfW * 0.85, length * 0.10, halfW, length * 0.48, halfW * 0.52, length * 0.82);
  s.quadraticCurveTo(halfW * 0.20, length * 1.0, 0, length);
  s.quadraticCurveTo(-halfW * 0.20, length * 1.0, -halfW * 0.52, length * 0.82);
  s.bezierCurveTo(-halfW, length * 0.48, -halfW * 0.85, length * 0.10, 0, 0);
  return s;
}

// A swept stealth-fin outline (upright, tip at +y): a curved leading edge (+x)
// that bows out then sweeps to a fine hooked tip, and a trailing edge (-x) with a
// subtle concave inner notch — an aerodynamic control surface, not a flat diamond.
// Mirror via scale.x to put the leading edge on either side.
function buildStealthFinShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  // leading edge: bow outward, then sweep up and in toward the tip
  s.bezierCurveTo(halfW * 1.05, length * 0.16, halfW * 1.02, length * 0.54, halfW * 0.44, length * 0.86);
  // tip: taper to a fine point, hooked slightly back
  s.quadraticCurveTo(halfW * 0.18, length * 1.03, -halfW * 0.05, length * 0.9);
  // trailing edge: down with a subtle concave inner notch
  s.quadraticCurveTo(-halfW * 0.5, length * 0.68, -halfW * 0.46, length * 0.44);
  s.quadraticCurveTo(-halfW * 0.42, length * 0.30, -halfW * 0.58, length * 0.22);
  s.quadraticCurveTo(-halfW * 0.30, length * 0.07, 0, 0);
  return s;
}

// A POINTED bat-membrane fin (upright, tip at +y): a swept leading edge rising to a
// SHARP point, and a trailing edge broken by a finger NOTCH into a second point —
// the Night Fury tail read (a pointed bat fin), NOT a rounded paddle/lily-pad.
// Drop-in for buildStealthFinShape via buildLayeredFin's `opts.shape`. Mirror via
// scale.x. halfW = half-width at the base, length = tip height.
export function buildBatFinShape(halfW, length) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  // leading edge: a near-straight sweep out and up to a SHARP swept tip
  s.bezierCurveTo(halfW * 0.88, length * 0.22, halfW * 0.74, length * 0.82, halfW * 0.20, length);
  // trailing edge: a fingered bat membrane — upper lobe → notch valley → lower lobe
  // point, so the back edge reads as two clear points, not a round paddle rim.
  s.quadraticCurveTo(-halfW * 0.02, length * 0.82, -halfW * 0.18, length * 0.70); // upper lobe
  s.lineTo(-halfW * 0.46, length * 0.56);                                          // notch valley
  s.quadraticCurveTo(-halfW * 0.26, length * 0.46, -halfW * 0.50, length * 0.30); // lower lobe point
  s.quadraticCurveTo(-halfW * 0.30, length * 0.12, 0, 0);
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

// A premium LAYERED swept fin (upright, tip at +y): a curved stealth-fin outline
// built up in depth so it never reads as a flat polygon card —
//   · a bright cyan RIM peeking behind the dark base (edge glow)
//   · the dark base membrane (the main surface)
//   · a smaller, raised INNER panel (a second layer → visible surface step)
//   · a glowing centre SEAM up the spine (seam light)
// Used for every Obsidian tail fin from Kindled up; mirror via scale.x.
export function buildLayeredFin(halfW, length, fillMat, edgeMat, opts = {}) {
  const g = new THREE.Group();
  const shape = opts.shape || buildStealthFinShape;
  const curve = opts.curve ?? 0;        // 0 = flat card (default); >0 dishes the blade
  const pinch = opts.tipPinch ?? 1;     // <1 narrows the inner panel into a finer blade
  // Camber a built layer in local z: a gentle leaf-dish (max at mid-height) plus a
  // shallow spanwise bow, so the fin reads as a curved membrane under load instead
  // of a flat polygon card. Done once at construction → negligible cost.
  const camber = (mesh) => {
    if (curve > 0) {
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const t = Math.max(0, Math.min(1, pos.getY(i) / length));
        const bow = halfW ? (x / halfW) * (x / halfW) : 0;
        pos.setZ(i, pos.getZ(i) + curve * length * (t - t * t) + curve * 0.4 * bow * length);
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
    return mesh;
  };
  const rim = camber(new THREE.Mesh(new THREE.ShapeGeometry(shape(halfW * 1.13, length * 1.08)), edgeMat));
  rim.position.z = -0.022;               // behind → only the cyan border shows
  g.add(rim);
  g.add(camber(new THREE.Mesh(new THREE.ShapeGeometry(shape(halfW, length)), fillMat)));
  // Raised inner panel: a smaller fin sat slightly proud, so the base shows as a
  // dark border around it and the fin reads as two layered surfaces.
  const inner = camber(new THREE.Mesh(new THREE.ShapeGeometry(shape(halfW * 0.58 * pinch, length * 0.72)), fillMat));
  inner.position.set(0, length * 0.10, 0.028);
  g.add(inner);
  // Glowing centre seam (a slim cyan rib up the spine).
  if (opts.seam !== false) {
    const seam = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.02, length * 0.78, seg(4)), edgeMat);
    seam.position.set(0, length * 0.4, 0.05);
    g.add(seam);
  }
  return g;
}

// ===========================================================================
// FEATHER PRIMITIVES — shared by the avian body plan (torso / feather wings /
// plume tail). A firebird is built from leaf-shaped feathers + vertex-colour
// gradients + a parabolic upsweep, not membranes; these are those building blocks.
// ===========================================================================
export const hexRgb = (h) => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;

// A single feather: a leaf shape whose length runs along +Z (trailing back),
// width along ±X, laid flat (face up). Vertex-coloured base→tip for a gradient.
export function featherGeo(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(wid * 0.5, len * 0.32, wid * 0.16, len * 0.92);
  s.quadraticCurveTo(0, len, -wid * 0.16, len * 0.92);
  s.quadraticCurveTo(-wid * 0.5, len * 0.32, 0, 0);
  const g = new THREE.ShapeGeometry(s, seg(6));
  g.rotateX(Math.PI / 2); // XY (len +Y) → XZ (len +Z), face up
  return g;
}

// Lengthwise (base→tip, along Z) vertex-colour gradient on a feather.
export function featherGradient(geo, baseHex, tipHex) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const z0 = min.z, span = (max.z - min.z) || 1;
  const pos = geo.attributes.position;
  const base = new THREE.Color(baseHex), tip = new THREE.Color(tipHex), c = new THREE.Color();
  const col = [];
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) - z0) / span;
    c.copy(base).lerp(tip, t * t);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}

// Spanwise vertex-colour gradient (root→tip along X) for the wing web.
export function webGradient(geo, baseHex, tipHex) {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const x0 = min.x, span = (max.x - min.x) || 1;
  const pos = geo.attributes.position;
  const base = new THREE.Color(baseHex), tip = new THREE.Color(tipHex), c = new THREE.Color();
  const col = [];
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getX(i) - x0) / span;
    c.copy(base).lerp(tip, t);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}

// Parabolic upsweep: raise vertices toward the wing tip so the wing arcs up and
// presents its feathered surface to the above-and-behind camera from any pitch.
export function archUp(geo, span, h) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = Math.abs(pos.getX(i)) / span;
    pos.setY(i, pos.getY(i) + x * x * h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Oriented bone/cylinder from a→b (for leading-edge arms + feather shafts).
export function bone(ax, ay, az, bx, by, bz, r0, r1, mat) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az);
  const len = dir.length() || 0.001;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg(6)), mat);
  m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// ===========================================================================
// CURVED MEMBRANE PATCH — the creature framework's smooth surface primitive.
//
// Replaces "flat ShapeGeometry + archWing" (a bent flat sheet, faceted along its
// triangulation and split into clipped panels that crease at the wrist) with a
// regular (segU x segV) GRID resampled from the SAME wing outline, so it keeps
// the silhouette but gains: spanwise arc lift, CHORDWISE BILLOW (the cup a flat
// sheet lacks), smooth vertex normals, and detail-driven tessellation. Reusable
// for wings, fins, sails and future creatures.
//
// The outline is read from buildWingShape(spec).getPoints() and split at the far
// tip (max x) into a leading (front) and trailing (back) boundary; the grid fills
// the chord between them at each span station. Axes match the membrane build's
// rotateX(-PI/2): shape-x -> world x (span), shape-y -> world -z (chord), height
// in world y. spanStart/spanEnd (world x) bound the panel so the grid columns are
// distributed across the REAL extent — no clamped/collapsed columns (which would
// make degenerate triangles → bad normals + doubled strips); origin re-roots it.
export function buildCurvedPatch(spec, opts = {}) {
  const scaleX = opts.scaleX ?? 1;
  const scaleZ = opts.scaleZ ?? 1;
  const arc = opts.arc || spec.arc || DEFAULT_WING.arc;
  const k = opts.k ?? 1;
  const billow = opts.billow ?? 0;
  const segU = Math.max(2, opts.segU ?? 12);
  const segV = Math.max(1, opts.segV ?? 5);
  const originX = opts.originX ?? 0;
  const originY = opts.originY ?? 0;

  const pts = buildWingShape(spec).getPoints(48);
  let maxI = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].x > pts[maxI].x) maxI = i;
  const lead = pts.slice(0, maxI + 1);           // x increasing: leading edge
  const trail = pts.slice(maxI).reverse();        // x increasing: trailing edge
  const maxX = pts[maxI].x || 1;
  const yAt = (poly, x) => {
    if (x <= poly[0].x) return poly[0].y;
    for (let i = 1; i < poly.length; i++) {
      if (x <= poly[i].x) {
        const t = (x - poly[i - 1].x) / Math.max(poly[i].x - poly[i - 1].x, 1e-6);
        return poly[i - 1].y + (poly[i].y - poly[i - 1].y) * t;
      }
    }
    return poly[poly.length - 1].y;
  };

  const verts = [];
  const idx = [];
  const worldMaxX = maxX * scaleX;
  const clamp01x = (x) => Math.min(Math.max(x, 0), worldMaxX);
  const spanStart = clamp01x(opts.spanStart ?? 0);
  const spanEnd = clamp01x(opts.spanEnd ?? worldMaxX);
  const span = Math.max(spanEnd - spanStart, 1e-4);
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const wx = spanStart + u * span;               // distributed across the real panel extent
    const sx = wx / scaleX;
    const frontY = yAt(lead, sx);
    const backY = yAt(trail, sx);
    const liftY = archLift(wx, worldMaxX, arc, k);
    const chordW = Math.abs(backY - frontY) * scaleZ;
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      const chordY = frontY + (backY - frontY) * v;        // shape-y
      const wz = -chordY * scaleZ;                          // shape-y -> world -z
      const cupY = billow * Math.sin(Math.PI * v) * chordW; // chordwise cup
      verts.push(wx - originX, liftY + cupY - originY, wz);
    }
  }
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j, b = a + 1, c = a + (segV + 1), d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setIndex(idx);
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}
