import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// ── Phoenix: a separate legendary firebird archetype ─────────────────────────
// NOT a recoloured dragon. A celestial bird made of white-hot gold and fire:
//   • compact bright avian body + a glowing heart-fire core
//   • a beaked head with a back-raked feather crown (no horns)
//   • broad, UPSWEPT, layered FEATHER wings (translucent, not flat membranes)
//   • a flowing flame-feather PLUME tail (a fan of luminous ribbons, no reptile
//     tail / spear)
//
// It exposes the SAME animation handles as buildDragonModel so the in-game rig
// and shop turntable drive it unchanged:
//   parts.wingPivotL/R, wingTipL/R, tipMarkerL/R  — wing flap/fold + contrails
//   parts.head, parts.tailSegs, parts.coreGlow    — head sway, plume coil, core
//   materials.bodyMat, wingMat, eyeMat, spineMats — runtime-animated materials
//   auraSprite                                    — fever/idle aura
//
// Form level (0..3) drives the whole progression: body brightness, feather
// count, plume length, crest size, halo, particle density (via model.spineGlow).

const hexRgb = (h) => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;

// A single feather: a leaf shape whose length runs along +Z (trailing back),
// width along ±X, laid flat (face up). Vertex-coloured base→tip for a gradient.
function featherGeo(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(wid * 0.5, len * 0.32, wid * 0.16, len * 0.92);
  s.quadraticCurveTo(0, len, -wid * 0.16, len * 0.92);
  s.quadraticCurveTo(-wid * 0.5, len * 0.32, 0, 0);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(Math.PI / 2); // XY (len +Y) → XZ (len +Z), face up
  return g;
}

function featherGradient(geo, baseHex, tipHex) {
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
function webGradient(geo, baseHex, tipHex) {
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
function archUp(geo, span, h) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = Math.abs(pos.getX(i)) / span;
    pos.setY(i, pos.getY(i) + x * x * h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// Oriented bone/cylinder from a→b (for leading-edge arms + feather shafts).
function bone(ax, ay, az, bx, by, bz, r0, r1, mat) {
  const dir = new THREE.Vector3(bx - ax, by - ay, bz - az);
  const len = dir.length() || 0.001;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 6), mat);
  m.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

export function buildPhoenixModel(def, opts = {}) {
  const model = def.model;
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const group = new THREE.Group();
  const spineMats = [];

  // Palette (resolved per-form; sensible fallbacks to the shared dragon fields).
  const cBody = def.body;
  const cIn = def.featherIn ?? def.wingInner;
  const cOut = def.featherOut ?? def.wingOuter;
  const cEdge = def.featherEdge ?? def.apexSeam ?? def.wingEmissive;
  const cHi = def.featherHi ?? def.scales;
  const cEmis = def.wingEmissive;
  const cCore = def.coreGlow ?? def.scales;
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCrest = def.horn ?? def.scales;
  const cEye = def.eye;

  // Materials. wingMat/bodyMat/eyeMat are driven by the rig; the emissive accent
  // mats (edges, crest, core, plume) go in spineMats so they ignite white-gold
  // during Phoenix Surge.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.44, metalness: 0.08,
    emissive: cBody, emissiveIntensity: 0.1 + F * 0.14, side: THREE.DoubleSide,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, roughness: 0.5, side: THREE.DoubleSide,
    transparent: true, opacity: 0.82, emissive: cEmis, emissiveIntensity: 0.3,
  });
  const armMat = new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.5, roughness: 0.32, metalness: 0.45,
  });
  const tagged = (mat, baseEmissive, baseIntensity) => {
    mat.userData.baseEmissive = baseEmissive;
    mat.userData.baseIntensity = baseIntensity;
    spineMats.push(mat);
    return mat;
  };
  const edgeMat = tagged(new THREE.MeshStandardMaterial({
    color: cEdge, emissive: cEdge, emissiveIntensity: 0.85 + F * 0.5, roughness: 0.3, metalness: 0.3,
  }), cEdge, 0.85 + F * 0.5);
  const crestMat = tagged(new THREE.MeshStandardMaterial({
    color: cCrest, emissive: cSeam, emissiveIntensity: 0.8 + F * 0.6, roughness: 0.3, metalness: 0.4,
    side: THREE.DoubleSide,
  }), cSeam, 0.8 + F * 0.6);
  const coreMat = tagged(new THREE.MeshStandardMaterial({
    color: cCore, emissive: cCore, emissiveIntensity: 1.5 + F * 0.9, roughness: 0.3,
  }), cCore, 1.5 + F * 0.9);
  const plumeMat = tagged(new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.72, side: THREE.DoubleSide,
    emissive: cEmis, emissiveIntensity: 0.65 + F * 0.35, depthWrite: false,
  }), cEmis, 0.65 + F * 0.35);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x221100, emissive: cEye, emissiveIntensity: 2.2 });

  // ── Body: a compact egg leaning into the flight + a breast swell ──────────
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), bodyMat);
  body.scale.set(0.8, 0.84, 1.46 + F * 0.08);
  body.position.set(0, 0.5, 0.12);
  group.add(body);
  const breast = new THREE.Mesh(new THREE.SphereGeometry(0.44, 12, 10), bodyMat);
  breast.scale.set(0.92, 0.92, 1.05);
  breast.position.set(0, 0.36, -0.5);
  group.add(breast);

  // Heart-fire core: a bright sphere nestled in the chest (blazes on Surge).
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.24 + F * 0.05, 12, 10), coreMat);
  heart.position.set(0, 0.48, -0.18);
  group.add(heart);

  // ── Back crown: a row of back-raked feathers down the spine (firebird read
  // from directly behind). Grows with the form. ─────────────────────────────
  const backN = 3 + F * 2;
  for (let i = 0; i < backN; i++) {
    const t = i / (backN - 1);
    const h = (0.4 + Math.sin(t * Math.PI) * (0.4 + F * 0.18));
    const fe = new THREE.Mesh(featherGeo(h, 0.16 + F * 0.02), crestMat);
    fe.position.set(0, 0.78 + Math.sin(t * Math.PI) * 0.1, -0.7 + t * 1.7);
    fe.rotation.x = -1.15; // rake up-and-back
    group.add(fe);
  }

  // ── Head: skull + beak + eyes + a back-swept feather crown (no horns) ─────
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 10), bodyMat);
  skull.scale.set(0.92, 0.98, 1.06);
  head.add(skull);
  const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.52, 6), armMat);
  upperBeak.rotation.x = -Math.PI / 2; upperBeak.scale.set(0.92, 1, 0.66);
  upperBeak.position.set(0, 0.02, -0.46);
  head.add(upperBeak);
  const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 6), armMat);
  lowerBeak.rotation.x = -Math.PI / 2; lowerBeak.scale.set(0.8, 1, 0.6);
  lowerBeak.position.set(0, -0.12, -0.38);
  head.add(lowerBeak);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat);
    eye.position.set(0.17 * s, 0.07, -0.16);
    head.add(eye);
  }
  // Crown plume: a fan of back-swept crest feathers rising off the head.
  const crownN = 3 + F;
  for (let i = 0; i < crownN; i++) {
    const t = crownN > 1 ? (i / (crownN - 1)) * 2 - 1 : 0; // -1..1
    const h = (0.5 + F * 0.16) - Math.abs(t) * 0.16;
    const cf = new THREE.Mesh(featherGeo(h, 0.13), crestMat);
    cf.position.set(t * 0.16, 0.3, 0.06);
    cf.rotation.x = -1.0;           // rake back
    cf.rotation.z = -t * 0.5;       // fan
    head.add(cf);
  }
  head.position.set(0, 0.74, -1.32 - F * 0.04);
  group.add(head);

  // Short avian neck (2 small spheres) — bird, not serpent.
  for (let i = 0; i < 2; i++) {
    const t = (i + 1) / 3;
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.34 - i * 0.06, 9, 7), bodyMat);
    n.scale.set(0.82, 0.78, 1.0);
    n.position.set(0, 0.5 + t * 0.22, -0.62 - t * 0.72);
    group.add(n);
  }

  // ── Feather wings ─────────────────────────────────────────────────────────
  // A bird wing, not a membrane: a continuous translucent inner WEB (the
  // secondaries) carries the broad surface, with separated primary "finger"
  // feathers spread at the wrist. Strongly UPSWEPT so it arcs up like a
  // spreading firebird and stays readable from any pitch.
  const ws = model.wingScale;
  const reach = (2.6 + F * 0.5) * ws;   // outward span of one wing
  const rise = (1.0 + F * 0.28) * ws;   // tip upsweep (Y at the wing tip)
  const back = 0.5 + F * 0.14;          // trailing-edge sweep
  const wristX = reach * 0.5, wristY = rise * 0.4, wristZ = 0.06;

  // Place one feather rooted at (rx,ry,rz), length len, swept back/out + raised.
  function feather(parent, side, rx, ry, rz, len, wid, sweep, dihedral, baseHex, tipHex, mat = wingMat) {
    const g = featherGeo(len, wid);
    featherGradient(g, baseHex, tipHex);
    const f = new THREE.Mesh(g, mat);
    f.position.set(rx * side, ry, rz);
    f.rotation.y = side * sweep;   // sweep outward + back
    f.rotation.x = dihedral;       // tilt the plane (dihedral / billow)
    f.rotation.z = side * 0.04;
    parent.add(f);
    return f;
  }

  function buildWing(side) {
    const pivot = new THREE.Group();
    pivot.position.set(0.4 * side, 0.62, -0.12); // root high on the shoulders
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.17, 9, 7), armMat);
    shoulder.scale.set(1.1, 0.85, 1.2);
    pivot.add(shoulder);
    pivot.add(bone(0, 0, 0, wristX * side, wristY, wristZ, 0.09, 0.05, armMat));

    // Inner web — a solid, arced, scalloped wing surface (shoulder → wrist).
    const innerSpan = wristX * 1.08;
    const chordRoot = 0.72 * ws, chordTip = 1.06 * ws;
    const sh = new THREE.Shape();
    sh.moveTo(0, 0);
    sh.lineTo(innerSpan, 0.05 * ws);             // leading edge → wrist
    const nSc = 5;
    for (let k = nSc; k >= 0; k--) {             // scalloped trailing edge → root
      const tx = k / nSc;
      const chord = chordRoot + (chordTip - chordRoot) * tx;
      const scallop = 0.07 * ws * (k % 2 === 0 ? 1 : 0.45);
      sh.lineTo(innerSpan * tx, chord - scallop);
    }
    const webGeo = new THREE.ShapeGeometry(sh, 12);
    webGeo.rotateX(Math.PI / 2);
    archUp(webGeo, innerSpan, rise * 0.5);
    webGradient(webGeo, cIn, cOut);
    const web = new THREE.Mesh(webGeo, wingMat);
    web.scale.x = side;
    pivot.add(web);

    // A few secondary feathers laid on the web for a layered feather edge.
    const nIn = 3 + F;
    for (let k = 0; k < nIn; k++) {
      const t = nIn > 1 ? k / (nIn - 1) : 0;
      const rx = innerSpan * (0.15 + t * 0.8);
      const ry = rise * 0.5 * (rx / innerSpan) * (rx / innerSpan) + 0.05;
      const len = (0.72 + Math.sin(t * Math.PI) * 0.4) * ws;
      feather(pivot, side, rx, ry, 0, len, 0.34 * ws, 0.3 + t * back * 0.4, -(0.04 + t * 0.08), cIn, cOut);
    }

    // Outer primaries: spread "finger" feathers folding at the wrist.
    const wingTip = new THREE.Group();
    wingTip.position.set(wristX * side, wristY, wristZ);
    wingTip.add(bone(0, 0, 0, (reach - wristX) * side, rise - wristY, 0.02, 0.05, 0.02, armMat));
    const nOut = 4 + F;
    for (let k = 0; k < nOut; k++) {
      const t = nOut > 1 ? k / (nOut - 1) : 0;
      const rx = (reach - wristX) * t * 0.55, ry = (rise - wristY) * t * t, rz = 0.02;
      const len = (1.05 + (1 - Math.abs(t - 0.4) * 1.3) * 0.6) * ws;
      feather(wingTip, side, rx, ry, rz, len, 0.42 * ws, 0.5 + t * back, -(0.05 + t * 0.12), cIn, cOut);
      if (F >= 1) { // bright primary shaft — ignites white-gold on Surge
        const ang = 0.5 + t * back;
        wingTip.add(bone(rx * side, ry, rz,
          (rx + Math.sin(ang) * len) * side, ry + len * 0.05, rz + Math.cos(ang) * len,
          0.016, 0.005, edgeMat));
      }
    }
    const marker = new THREE.Object3D();
    marker.position.set((reach - wristX) * side, rise - wristY, 1.1 * ws);
    wingTip.add(marker);
    pivot.add(wingTip);
    group.add(pivot);
    return { pivot, wingTip, marker };
  }

  const R = buildWing(1), L = buildWing(-1);

  // ── Plume tail: a fan of flame-feather ribbons. Built as a short chain of
  // anchor segments (the rig coils them into a flowing wave); each anchor holds
  // a fanned cross-section of slivers, so consecutive slivers form continuous
  // ribbons that taper to the tip. No reptile tail, no spear. ────────────────
  const plume = new THREE.Group();
  plume.position.set(0, 0.42, 0.55);
  plume.rotation.x = 0.12; // trail slightly downward
  group.add(plume);
  const tailSegs = [];
  const segN = 4 + F;
  const plumeLen = 2.4 + F * 0.75;
  const step = plumeLen / segN;
  const fan = F >= 2 ? [-0.5, -0.25, 0, 0.25, 0.5] : F >= 1 ? [-0.34, 0, 0.34] : [-0.26, 0, 0.26];
  for (let i = 0; i < segN; i++) {
    const t = segN > 1 ? i / (segN - 1) : 0;
    const seg = new THREE.Group();
    seg.position.z = i * step; // along the plume; rig waves x/y + banks z/y
    const segScale = 1 - t * 0.5;
    for (const a of fan) {
      const len = step * 2.0 * (1 - t * 0.28);
      const sl = new THREE.Mesh(featherGeo(len, (0.34 - t * 0.12) * (1 + F * 0.1)), plumeMat);
      featherGradient(sl.geometry, t < 0.34 ? cHi : cOut, t > 0.66 ? cEdge : cOut);
      sl.rotation.y = a * (0.7 + t * 0.7);   // fan widens toward the tip
      sl.rotation.x = 0.12 + t * 0.08;       // gentle droop
      sl.scale.setScalar(segScale);
      seg.add(sl);
    }
    plume.add(seg);
    tailSegs.push(seg);
  }

  // ── Solar halo (form 3-4): a ring behind the head + a soft backlight card.
  if (F >= 3) {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 8, 28), tagged(
      new THREE.MeshStandardMaterial({
        color: cSeam, emissive: cSeam, emissiveIntensity: 1.8, roughness: 0.25, metalness: 0.4,
        transparent: true, opacity: 0.92,
      }), cSeam, 1.8));
    halo.position.set(0, 0.95, -0.2);
    halo.rotation.x = 0.4;
    group.add(halo);
    const auraCard = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(def.aura ? hexRgb(def.aura) : hexRgb(cSeam)), transparent: true,
      opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    auraCard.scale.set(4.2, 5.6, 1);
    auraCard.position.set(0, 0.8, 0.3);
    group.add(auraCard);
  }

  // Heart-fire core sprite (white-hot glow that pulses on boost / blazes Surge).
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.4 + F * 0.2;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(cCore)), transparent: true, opacity: 0.2 + lvl * 0.24,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.9 + lvl * 0.8);
    coreGlow.position.set(0, 0.48, -0.18);
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // Fever aura.
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx.auraColor), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale);

  const parts = {
    head, tailSegs,
    wingPivotL: L.pivot, wingPivotR: R.pivot,
    wingTipL: L.wingTip, wingTipR: R.wingTip,
    wingPivot2L: null, wingPivot2R: null,
    tipMarkerL: L.marker, tipMarkerR: R.marker,
    coreGlow,
  };
  const materials = { bodyMat, wingMat, eyeMat, spineMats };

  // Shop preview: same clean flying showcase as the dragons (no turntable), with
  // a rarity-tinted corona behind the bird.
  if (opts.preview) {
    const RARITY_GLOW = { R: 0x6affa0, SR: 0x4ac0ff, SSR: 0xc060ff, SSSR: 0xffd040 };
    const glowHex = RARITY_GLOW[def.rarity] ?? RARITY_GLOW.SSSR;
    const wrapper = new THREE.Group();
    wrapper.add(group);
    const corona = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(hexRgb(glowHex)), transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    corona.scale.set(5.5, 5.5, 1);
    corona.position.set(0, 0.4, -0.6);
    wrapper.add(corona);
    return { group: wrapper, parts, materials, auraSprite };
  }

  return { group, parts, materials, auraSprite };
}
