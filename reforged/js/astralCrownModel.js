import * as THREE from 'three';
import { seg } from './modelDetail.js';
import { makeGlowTexture } from './util.js';

// ===========================================================================
// ASTRAL CROWN SOVEREIGN — a from-scratch celestial-emperor dragon.
// ===========================================================================
// A dedicated archetype model (dispatched by def.archetype === 'astralCrown'),
// built like the Phoenix was: its OWN custom geometry from a blank page, reusing
// NONE of the shared dragon part-builders (no membrane kite-frame, no lofted
// blade-tube torso, no chrome shoulder ball). The only thing it shares is the
// invisible RIG CONTRACT — it returns the exact { group, parts, materials,
// auraSprite } handle set the flap/boost/preview drive, so it flies + previews
// unchanged. Everything you SEE is new code.
//
// Design: a classical four-legged western monarch — broad plated shoulders, a
// proud neck, a noble wedge skull wearing a CROWN of back-swept horns, a tall
// dorsal spine line, broad CATHEDRAL-MANTLE wings that throw a royal V, four
// tucked legs, and a long refined tail ending in a crown-spade. Star-metal armor
// over moonlit-ivory scales, a luminous celestial core, gold-white / pale-cyan
// starlight accents. Silhouette-first, tuned for the rear chase camera.
//
// `F = model.formLevel` (0..3) drives growth: crown size, armor coverage, spine
// height/count, wing reach/rise, core blaze, and the apex halo.

const lerp = (a, b, t) => a + (b - a) * t;

// A ring of points on an ellipse (rx,ry) centred at (0, yc, z) — the body loft unit.
function ellipseRing(rx, ry, yc, z, m) {
  const r = [];
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2;
    r.push(new THREE.Vector3(Math.cos(a) * rx, yc + Math.sin(a) * ry, z));
  }
  return r;
}

// Loft a stack of equal-length rings into one smooth closed surface.
function loftRings(rings, mat) {
  const m = rings[0].length;
  const verts = [], idx = [];
  for (const ring of rings) for (const p of ring) verts.push(p.x, p.y, p.z);
  for (let s = 0; s < rings.length - 1; s++) {
    const a0 = s * m, b0 = (s + 1) * m;
    for (let k = 0; k < m; k++) {
      const n = (k + 1) % m;
      idx.push(a0 + k, b0 + k, a0 + n, a0 + n, b0 + k, b0 + n);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// A tapered cylinder from a→b (limbs, horns, spars, leading-edge frame).
function tube(ax, ay, az, bx, by, bz, r0, r1, mat) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az);
  const len = dir.length() || 1e-3;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, seg(7)), mat);
  m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}

// Parabolic upsweep: raise verts toward the wing tip so the wing arcs UP into a
// royal V and presents its surface to the above-and-behind camera (own copy — the
// archetype reuses no shared geometry helpers).
function archUp(geo, span, h) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = Math.abs(p.getX(i)) / span;
    p.setY(i, p.getY(i) + x * x * h);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
}

// Spanwise vertex-colour gradient (root→tip along |x|): deep royal indigo at the
// body, pale star-silver at the edge — the ceremonial-mantle read.
function spanGradient(geo, c0, c1, span) {
  const p = geo.attributes.position;
  const a = new THREE.Color(c0), b = new THREE.Color(c1), c = new THREE.Color();
  const col = [];
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(Math.abs(p.getX(i)) / span, 1);
    c.copy(a).lerp(b, t);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
}

// A flat tapered spine/crest BLADE (pointed, gently back-curved) laid in the XZ
// plane (height +Y). Used for the dorsal line and tail crest.
function spineBlade(h, w, sweep, mat) {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.5, 0);
  s.quadraticCurveTo(-w * 0.16, h * 0.5, sweep * 0.4, h * 0.86);
  s.quadraticCurveTo(sweep * 0.5, h, sweep, h);            // fine tip, swept back
  s.quadraticCurveTo(sweep * 0.5 + w * 0.16, h * 0.6, w * 0.5, 0);
  s.closePath();
  const g = new THREE.ShapeGeometry(s, seg(5));
  g.rotateY(Math.PI / 2);   // face the blade sideways → reads as a tall crest from behind
  return new THREE.Mesh(g, mat);
}

const hexRgb = (h) => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;

export function buildAstralCrownModel(def, opts = {}) {
  const model = def.model || {};
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  // ── palette ──────────────────────────────────────────────────────────────
  const cBody = def.body ?? 0xEFEDE2;                 // moonlit ivory / pearl
  const cArmor = def.scales ?? 0xB8C2D2;             // star-metal platinum
  const cInner = def.wingInner ?? 0x2a356e;          // membrane root (royal indigo)
  const cOuter = def.wingOuter ?? 0xC9D6F2;          // membrane edge (pale star-silver)
  const cHorn = def.horn ?? 0xEAE7DA;                // ivory crown
  const cEnergy = def.coreGlow ?? 0xBFE6FF;          // pale cyan starlight
  const cSeam = def.apexSeam ?? def.wingEmissive ?? 0xFFF1C8; // gold-white light
  const cEye = def.eye ?? 0xCFE9FF;

  // ── materials ──────────────────────────────────────────────────────────────
  const tag = (mat, em, inten) => { mat.userData.baseEmissive = em; mat.userData.baseIntensity = inten; spineMats.push(mat); return mat; };

  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.46, metalness: 0.18,
    emissive: cBody, emissiveIntensity: 0.05 + F * 0.03, side: THREE.DoubleSide,
  });
  const armorMat = new THREE.MeshStandardMaterial({
    color: cArmor, roughness: 0.28, metalness: 0.66,
    emissive: cInner, emissiveIntensity: 0.06, side: THREE.DoubleSide,
  });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x101522, emissive: cEye, emissiveIntensity: 2.1 });
  const membraneMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide,
    transparent: true, opacity: 0.62 + F * 0.04, emissive: cInner, emissiveIntensity: 0.14 + F * 0.1,
  });
  const crownMat = tag(new THREE.MeshStandardMaterial({
    color: cHorn, emissive: cSeam, emissiveIntensity: 0.45 + F * 0.45, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide,
  }), cSeam, 0.45 + F * 0.45);
  const edgeMat = tag(new THREE.MeshStandardMaterial({
    color: cEnergy, emissive: cEnergy, emissiveIntensity: 0.8 + F * 0.6, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide,
  }), cEnergy, 0.8 + F * 0.6);
  const coreMat = tag(new THREE.MeshStandardMaterial({
    color: cEnergy, emissive: cEnergy, emissiveIntensity: 1.3 + F * 0.9, roughness: 0.3,
  }), cEnergy, 1.3 + F * 0.9);

  // ── BODY — a muscular lofted torso (deep chest → pinched waist → haunches) ──
  // z: head is at -Z (front), tail at +Z. Centred near y=0.5.
  const M = seg(16);
  const stations = [
    // [z, halfWidth(rx), halfHeight(ry), yCentre]
    [-1.78, 0.10, 0.12, 0.56],   // front cap (meets the neck) — closes the loft
    [-1.34, 0.50, 0.56, 0.55],   // lower neck → chest
    [-0.82, 0.82, 0.80, 0.52],   // BROAD DEEP CHEST + shoulders (broadest, tallest)
    [-0.18, 0.66, 0.66, 0.50],   // thorax
    [ 0.46, 0.44, 0.50, 0.50],   // WAIST (slim but muscular)
    [ 1.06, 0.62, 0.58, 0.49],   // HAUNCHES (powerful hips)
    [ 1.54, 0.34, 0.34, 0.50],   // rump
    [ 1.86, 0.10, 0.12, 0.52],   // rear cap → tail root
  ];
  const rings = stations.map(([z, rx, ry, yc]) => ellipseRing(rx, ry, yc, z, M));
  group.add(loftRings(rings, bodyMat));

  // helper: top-of-back Y at a body z (for seating the dorsal crest + plates)
  const backY = (z) => {
    for (let i = 0; i < stations.length - 1; i++) {
      const [z0, , ry0, yc0] = stations[i];
      const [z1, , ry1, yc1] = stations[i + 1];
      if (z <= z1) { const t = (z - z0) / (z1 - z0 || 1); return lerp(yc0 + ry0, yc1 + ry1, t); }
    }
    const last = stations[stations.length - 1]; return last[3] + last[2];
  };
  const halfW = (z) => {
    for (let i = 0; i < stations.length - 1; i++) {
      const [z0, rx0] = stations[i];
      const [z1, rx1] = stations[i + 1];
      if (z <= z1) { const t = (z - z0) / (z1 - z0 || 1); return lerp(rx0, rx1, t); }
    }
    return stations[stations.length - 1][1];
  };

  // ── ARMOR — layered star-metal plates (shoulders, chest sternum, haunches) ──
  // A shallow cupped shell plate, bowed in z, laid on the body flank/back.
  function plate(w, h, cup, mat) {
    const cols = seg(5), rows = seg(3), verts = [], idx = [];
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
      const u = c / cols - 0.5, v = r / rows - 0.5;
      verts.push(u * w, v * h, -cup * (1 - 4 * u * u) * (1 - 4 * v * v));
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  }
  // Pronounced plated SHOULDER MANTLE (the premium rear-read mass), per side — a
  // broad pauldron flanking the wing root so the monarch reads BROAD-SHOULDERED.
  for (const s of [-1, 1]) {
    const sh = plate(0.98 + F * 0.08, 0.78 + F * 0.06, 0.32, armorMat);
    sh.position.set(s * (0.6 + F * 0.03), 0.74, -0.72);
    sh.rotation.set(0.42, s * 0.62, s * -0.34);
    sh.scale.setScalar(1 + F * 0.07);
    group.add(sh);
    // a slim glowing rim spur on the mantle (elite forms) — star-light edge
    if (F >= 1) {
      const spur = tube(s * 0.34, 0.92, -0.92, s * (0.62 + F * 0.04), 1.0 + F * 0.05, -0.95, 0.05, 0.015, crownMat);
      group.add(spur);
    }
    // haunch plate
    const hp = plate(0.5, 0.5, 0.2, armorMat);
    hp.position.set(s * 0.5, 0.6, 1.02);
    hp.rotation.set(0.2, s * -0.5, s * 0.2);
    group.add(hp);
  }
  // Chest sternum plate framing the celestial core.
  const sternum = plate(0.46, 0.66, 0.22, armorMat);
  sternum.position.set(0, 0.34, -0.9);
  sternum.rotation.x = 1.5;
  group.add(sternum);

  // ── CELESTIAL CORE — a luminous gem in the chest + a bloom sprite ──────────
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.17 + F * 0.03, 0), coreMat);
  core.scale.set(0.8, 1.15, 0.8);
  core.position.set(0, 0.4, -0.86);
  group.add(core);
  let coreGlow = null;
  {
    const lvl = 0.4 + F * 0.2;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0.18 + lvl * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.8 + lvl * 0.7);
    coreGlow.position.set(0, 0.4, -0.86);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // ── DORSAL SPINE LINE — crown crest → tall upper-back spines → tapering tail ──
  // The signature back read. Tallest over the shoulders, refining toward the hips.
  const spineN = 7 + F * 2;
  const sz0 = -1.05, sz1 = 1.5;
  for (let i = 0; i < spineN; i++) {
    const t = i / (spineN - 1);
    const z = lerp(sz0, sz1, t);
    // tall over the shoulders (t≈0.18), refine toward the hips
    const peak = Math.exp(-Math.pow((t - 0.18) / 0.5, 2));
    const h = (0.22 + (0.5 + F * 0.12) * peak) * (1 - t * 0.35);
    const blade = spineBlade(h, 0.13 + F * 0.01, -h * 0.5, crownMat);
    blade.position.set(0, backY(z) - 0.02, z);
    group.add(blade);
    // a slim glowing seam up the front of each blade (elite forms)
    if (F >= 2) {
      const seam = tube(0, backY(z) - 0.02, z - 0.02, -h * 0.5 * 0, backY(z) + h - 0.02, z - h * 0.5, 0.02, 0.006, edgeMat);
      group.add(seam);
    }
  }

  // ── NECK + HEAD — a proud arch into a noble wedge skull wearing a crown ─────
  // Short, thick, proud (NOT snake-like): 3 tapering segments arcing up-forward.
  const neckPts = [
    [0, 0.66, -1.5], [0, 0.82, -2.0], [0, 0.95, -2.45],
  ];
  for (let i = 0; i < neckPts.length; i++) {
    const r = 0.34 - i * 0.05;
    const n = new THREE.Mesh(new THREE.SphereGeometry(r, seg(11), seg(9)), bodyMat);
    n.scale.set(0.86, 0.9, 1.05);
    n.position.set(neckPts[i][0], neckPts[i][1], neckPts[i][2]);
    group.add(n);
  }

  // head group (REQUIRED handle — the rig sways head.rotation.y)
  const head = new THREE.Group();
  head.position.set(0, 1.0, -2.62);
  group.add(head);
  // cranium — an angular wedge
  const cran = new THREE.Mesh(new THREE.SphereGeometry(0.3, seg(12), seg(10)), bodyMat);
  cran.scale.set(0.78, 0.82, 1.12);
  head.add(cran);
  // brow ridge (a proud wedge over the eyes)
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.26), bodyMat);
  brow.position.set(0, 0.14, -0.18);
  brow.rotation.x = -0.2;
  head.add(brow);
  // snout — a clean tapered wedge
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.2, 0.5, seg(8)), bodyMat);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.04, -0.42);
  snout.scale.set(1.1, 1, 1);
  head.add(snout);
  // jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.34), bodyMat);
  jaw.position.set(0, -0.13, -0.34);
  head.add(jaw);
  // eyes
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, seg(8), seg(6)), eyeMat);
    e.position.set(s * 0.16, 0.04, -0.22);
    head.add(e);
  }
  // CROWN of horns — 2 main back-swept + 2 secondary outer + a central crest,
  // plus a small cheek-spine pair. Reads as a crown silhouette from behind.
  function crownHorn(x0, y0, z0, dx, dy, dz, r0, segsN) {
    // a gently curved tapered horn built from a couple of tube links
    const px = [x0], py = [y0], pz = [z0];
    for (let i = 1; i <= segsN; i++) {
      const t = i / segsN;
      px.push(x0 + dx * t);
      py.push(y0 + dy * t - dy * 0.18 * t * t);     // gentle upward curve
      pz.push(z0 + dz * t + dz * 0.25 * t * t);     // sweeping back
    }
    for (let i = 0; i < segsN; i++) {
      const r = r0 * (1 - i / segsN * 0.82);
      head.add(tube(px[i], py[i], pz[i], px[i + 1], py[i + 1], pz[i + 1], r, r0 * (1 - (i + 1) / segsN * 0.82), crownMat));
    }
  }
  // main horns + secondary outer + cheek spines → a crown silhouette from behind
  for (const s of [-1, 1]) {
    crownHorn(s * 0.16, 0.22, 0.0, s * (0.34 + F * 0.04), 0.5 + F * 0.12, 0.66 + F * 0.06, 0.06 + F * 0.006, 4);
    crownHorn(s * 0.24, 0.12, 0.04, s * (0.5 + F * 0.05), 0.26 + F * 0.06, 0.5, 0.045, 3);   // secondary outer
    if (F >= 1) crownHorn(s * 0.2, -0.06, -0.06, s * 0.26, -0.04, 0.34, 0.03, 2);             // cheek spine
  }
  // central crest spike (the crown's keystone)
  {
    const c = spineBlade(0.34 + F * 0.08, 0.1, -0.16, crownMat);
    c.position.set(0, 0.2, 0.06);
    head.add(c);
  }

  // ── WINGS — broad CATHEDRAL-MANTLE wings throwing a royal V ─────────────────
  const ws = model.wingScale ?? 1;
  const spanMax = (3.95 + F * 0.4) * ws;     // local half-wingspan (broad, not vast)
  const rise = (1.9 + F * 0.5) * ws;         // tip upsweep → the royal V
  const wristX = spanMax * 0.46;

  function buildWing(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.46, 0.86, -0.66);   // high on the plated shoulders

    // Armored leading-edge FRAME (a structured royal arm) root → wrist → tip.
    pivot.add(tube(0, 0, 0, side * wristX, rise * 0.46, 0.08, 0.1, 0.05, armorMat));
    pivot.add(tube(side * wristX, rise * 0.46, 0.08, side * spanMax, rise, 0.34, 0.05, 0.018, armorMat));

    // The mantle membrane: a broad surface with a PENNANT-scalloped trailing edge
    // (pointed panels, like a ceremonial cloak hem). Built in (x span, y chord),
    // laid flat, arced UP, gradient-shaded indigo→star-silver.
    const fingers = [1.0, 0.74, 0.5, 0.28];          // span fractions = pennant points
    // BROAD cloak chord: stays full across the inner two-thirds, tapering only near
    // the tip (a king's cloak spread wide, not insect wings or a bare spar).
    const chordAt = (f) => (0.5 + 1.05 * Math.pow(1 - f, 0.6)) * ws;
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.22 * ws);                         // root leading
    // leading edge: clean sweep out to the far tip (slightly swept back)
    sh.bezierCurveTo(wristX * 0.5, -0.3 * ws, wristX, -0.2 * ws, spanMax, spanMax * 0.08);
    // trailing edge back via SUBTLE pointed pennants (a scalloped cloak hem)
    let prevX = spanMax, prevY = spanMax * 0.08 + chordAt(1.0);
    sh.lineTo(prevX, prevY);                          // fine tip point
    for (let i = 1; i < fingers.length; i++) {
      const fx = spanMax * fingers[i];
      const fy = fx * 0.05 + chordAt(fingers[i]);     // this finger's pennant point
      const mx = (prevX + fx) / 2;
      const my = Math.min(prevY, fy) - 0.08 * ws;     // shallow scallop between points
      sh.quadraticCurveTo(mx, my, fx, fy);
      prevX = fx; prevY = fy;
    }
    sh.quadraticCurveTo(wristX * 0.4, prevY + 0.04 * ws, 0, 1.28 * ws);  // broad deep root trailing
    sh.lineTo(0, -0.22 * ws);
    const memGeo = new THREE.ShapeGeometry(sh, seg(14));
    memGeo.rotateX(Math.PI / 2);                      // shape-y → world -z (chord), face up
    archUp(memGeo, spanMax, rise);                    // bow into the royal V
    spanGradient(memGeo, cInner, cOuter, spanMax);
    const mem = new THREE.Mesh(memGeo, membraneMat);
    mem.scale.x = side;
    pivot.add(mem);

    // Luminous VEINS / cathedral mullions: bright tapering ribs wrist → each finger
    // tip, sitting just above the membrane (divide it into pointed cathedral bays).
    for (let i = 0; i < fingers.length; i++) {
      const fx = spanMax * fingers[i];
      const fyZ = -(fx * 0.06 + chordAt(fingers[i]) * 0.5);   // mid-bay-ish, on the membrane
      const tipY = (fx / spanMax) * (fx / spanMax) * rise;
      pivot.add(tube(side * wristX, rise * 0.46 + 0.02, 0.06, side * fx, tipY + 0.03, fyZ, 0.03, 0.008, edgeMat));
    }

    // wingTip group at the wrist (the rig folds the outer wing here) + trail marker.
    const wingTip = new THREE.Group();
    wingTip.position.set(side * wristX, rise * 0.46, 0.06);
    const marker = new THREE.Object3D();
    marker.position.set(side * (spanMax - wristX), rise - rise * 0.46, 0.34);
    wingTip.add(marker);
    pivot.add(wingTip);

    group.add(pivot);
    return { pivot, wingTip, marker };
  }
  const R = buildWing(1), L = buildWing(-1);

  // ── LEGS — four tucked/trailing limbs (mass under the body, not clutter) ────
  function leg(x, y, z, back, len, mat) {
    const g = new THREE.Group();
    const thighEnd = [x * 0.7, y - len * 0.4, z + back * 0.5];
    const footEnd = [x * 0.5, y - len * 0.85, z + back];
    g.add(tube(x, y, z, thighEnd[0], thighEnd[1], thighEnd[2], 0.13, 0.08, mat));         // thigh
    g.add(tube(thighEnd[0], thighEnd[1], thighEnd[2], footEnd[0], footEnd[1], footEnd[2], 0.08, 0.045, mat)); // shin
    // 3 small claws
    for (let c = -1; c <= 1; c++) {
      g.add(tube(footEnd[0], footEnd[1], footEnd[2], footEnd[0] + c * 0.06, footEnd[1] - 0.08, footEnd[2] + 0.14, 0.025, 0.008, mat));
    }
    return g;
  }
  for (const s of [-1, 1]) {
    group.add(leg(s * 0.34, 0.3, -0.5, 0.5, 0.7, bodyMat));    // fore legs (tucked)
    group.add(leg(s * 0.4, 0.28, 0.95, 0.6, 0.8, bodyMat));    // hind legs (powerful)
  }

  // ── TAIL — a long refined coil ending in a CROWN-SPADE ─────────────────────
  // tailSegs is a CHAIN (each parented to the previous) so the rig coils it; each
  // seg steps back in +z and carries a tapering body segment + a refining spine.
  const tailSegs = [];
  const tailN = 6 + F;
  let parent = group;
  let baseZ = 1.85, baseY = 0.5, r = 0.26;
  for (let i = 0; i < tailN; i++) {
    const segGrp = new THREE.Group();
    if (i === 0) segGrp.position.set(0, baseY, baseZ);
    else segGrp.position.set(0, 0, 0.34);                 // step back in the parent's local frame
    parent.add(segGrp);
    const r1 = r * (1 - 0.12);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r, 0.36, seg(8)), bodyMat);
    m.rotation.x = Math.PI / 2;
    m.position.z = 0.17;
    segGrp.add(m);
    // tapering dorsal spine on the tail
    const sb = spineBlade(0.16 + (tailN - i) * 0.012 + F * 0.02, 0.07, -0.06, crownMat);
    sb.position.set(0, r1 + 0.02, 0.17);
    segGrp.add(sb);
    tailSegs.push(segGrp);
    parent = segGrp;
    r = r1;
  }
  // CROWN-SPADE tip on the last seg: a clean ornamental star-blade (a refined
  // spade with twin keystone points + a glowing centre rib). NOT barbed/messy.
  {
    const tip = tailSegs[tailSegs.length - 1];
    const s = new THREE.Shape();
    const L2 = 1.0 + F * 0.16, W = 0.42 + F * 0.04;
    s.moveTo(0, 0);
    s.quadraticCurveTo(W, L2 * 0.34, W * 0.5, L2 * 0.66);
    s.lineTo(W * 0.74, L2 * 0.82);                         // a small flared keystone shoulder
    s.quadraticCurveTo(W * 0.18, L2 * 0.9, 0, L2);         // fine point
    s.quadraticCurveTo(-W * 0.18, L2 * 0.9, -W * 0.74, L2 * 0.82);
    s.lineTo(-W * 0.5, L2 * 0.66);
    s.quadraticCurveTo(-W, L2 * 0.34, 0, 0);
    const g = new THREE.ShapeGeometry(s, seg(8));
    g.rotateX(-Math.PI / 2);                               // lay it in the flight plane, point back
    const spade = new THREE.Mesh(g, crownMat);
    spade.position.set(0, 0.02, 0.32);
    tip.add(spade);
    const rib = tube(0, 0.03, 0.34, 0, 0.03, 0.34 + L2 * 0.92, 0.03, 0.008, edgeMat);
    tip.add(rib);
  }

  // ── APEX HALO — a soft celestial corona behind the monarch (form 3) ─────────
  if (F >= 3) {
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cSeam)), transparent: true,
      opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.set(5.4, 6.4, 1);
    halo.position.set(0, 0.95, -0.4);
    halo.layers.set(1);
    group.add(halo);
  }

  // ── fever/idle AURA sprite (the rig fades it on Surge) ──────────────────────
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(hexRgb(cEnergy)), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale ?? 1);   // mirror the GLB archetype (preview framing)

  return {
    group,
    parts: {
      head, tailSegs,
      wingPivotL: L.pivot, wingPivotR: R.pivot,
      wingTipL: L.wingTip, wingTipR: R.wingTip,
      tipMarkerL: L.marker, tipMarkerR: R.marker,
      wingPivot2L: null, wingPivot2R: null,
      coreGlow,
    },
    materials: { bodyMat, wingMat: membraneMat, eyeMat, spineMats },
    auraSprite,
  };
}
