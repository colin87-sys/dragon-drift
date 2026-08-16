import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { applyFresnelRim } from './surface.js';
import { makeGlowTexture } from './util.js';

// CRYSTAL SERPENT — a CONTINUOUS sleek body for the Astral Wyrm.
//
// The original "floating separate vertebrae" plan read as a knobbly column from
// the only view that matters — the chase / back view — because you look straight
// down the chain and the gaps just stack into lumps. So the body is now ONE smooth
// flowing tube of dark astral crystal: overlapping body sections that merge into a
// continuous form, with the glowing "segments" kept as SURFACE detail (bright
// energy bands wrapping the body + a glow core running its length). It still
// slithers (the rig waves the overlapping sections) and keeps the reusable attach
// contract so the side fins, saddle + comet wake mount exactly as before:
//   attach.segmentAnchors  [{ x, y, z, scale, r }]   — sections along the body
//   attach.sideFinRoots(side, i) → {x,y,z}            — fin mounts along the front
//   attach.riderSocket                                — the celestial saddle seat

function buildCrystalSerpentTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body;
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCore = def.coreGlow ?? def.wingEmissive;
  const cEye = def.eye;
  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);

  // Smooth polished astral-crystal hull — dark, with a fresnel rim lighting the
  // body's edge from the rear camera (the "crystal" read without chunky facets).
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.26, metalness: 0.55,
    emissive: cBody, emissiveIntensity: 0.14,
  });
  applyFresnelRim(bodyMat, cSeam, { intensity: 0.75, power: 2.6 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: cEye, emissiveIntensity: 2.4 });

  // Glowing energy bands + core — the astral "segments", now bright rings wrapping
  // a smooth body. In spineMats so they flare toward white on Dragon Surge.
  const ringInt = (0.9 + (model.coreIntensity ?? 0.3) * 2.0) * giM;
  const seamMat = new THREE.MeshStandardMaterial({
    color: cCore, emissive: cCore, emissiveIntensity: ringInt, roughness: 0.3, metalness: 0.35,
  });
  seamMat.userData.baseEmissive = cCore;
  seamMat.userData.baseIntensity = ringInt;
  spineMats.push(seamMat);
  // A brighter apex-seam accent for the low dorsal line + fin glow.
  const vaneMat = new THREE.MeshStandardMaterial({
    color: def.scales ?? cSeam, emissive: cSeam, emissiveIntensity: (0.6 + F * 0.4) * giM,
    roughness: 0.3, metalness: 0.45, side: THREE.DoubleSide,
  });
  vaneMat.userData.baseEmissive = cSeam;
  vaneMat.userData.baseIntensity = (0.6 + F * 0.4) * giM;
  spineMats.push(vaneMat);

  const N = Math.max(3, model.segmentCount ?? 9);
  const bodyScale = model.bodyScale ?? 1;
  const leadR = 0.6 * bodyScale;              // lead cross-section radius
  const taper = model.segmentTaper ?? 0.93;   // gentle taper toward a fine tail
  const bodyY = 0.5;
  const OVAL = [1.06, 0.9];                    // slightly wider + lower than tall (§0.5)

  // Radii + overlapping z-positions: each step ~ the local radius, so consecutive
  // sections always overlap into a CONTINUOUS tube tapering smoothly to the tip.
  const radii = [];
  for (let i = 0; i < N; i++) radii.push(leadR * Math.pow(taper, i));
  const zs = [];
  let z = 0;
  for (let i = 0; i < N; i++) {
    zs.push(z);
    const rNext = radii[i + 1] ?? radii[i] * taper;
    z += (radii[i] + rNext) * 0.5 * 0.92;       // 0.92 < 1 → heavy overlap
  }
  const zMid = zs[Math.floor(N / 2)];
  const yAt = (t) => bodyY - 0.05 - t * t * (leadR * 0.95);   // gentle low descent

  const bodySegs = [];
  const segmentAnchors = [];

  for (let i = 0; i < N; i++) {
    const t = N > 1 ? i / (N - 1) : 0;
    const r = radii[i];
    const zz = zs[i] - zMid;
    const segY = yAt(t);
    const seg = new THREE.Group();
    seg.position.set(0, segY, zz);
    seg.userData.baseY = segY;

    // Smooth crystal body section (overlaps its neighbours → continuous tube).
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), bodyMat);
    body.scale.set(OVAL[0], OVAL[1], 1.12);     // slightly elongated along the body
    seg.add(body);

    // A glowing energy band wrapping the body every other section (the "segments").
    if (i % 2 === 0) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.97, r * 0.12, 6, 12), seamMat);
      ring.scale.set(OVAL[0], OVAL[1], 1);
      seg.add(ring);
    }
    // A LOW swept dorsal finlet on the alternating sections — a glowing spine line
    // that lengthens, never rising into the sight-line (§0.5).
    if (i % 2 === 1 && i < N - 1) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(r * 0.18, r * 0.85, 4), vaneMat);
      fin.scale.z = 0.34;
      fin.position.set(0, r * 0.5, 0);
      fin.rotation.x = 1.18;                     // rake hard back, stays low
      seg.add(fin);
    }

    group.add(seg);
    bodySegs.push(seg);
    segmentAnchors.push({ x: 0, y: segY, z: zz, scale: r / leadR, r });
  }

  // Bright core underglow strung down the body (the energy within), brightest at
  // the front and fading toward the tail.
  const coreRgb = `${(cCore >> 16) & 255},${(cCore >> 8) & 255},${cCore & 255}`;
  const coreTex = makeGlowTexture(coreRgb);
  const glowN = Math.min(N, 6);
  for (let g = 0; g < glowN; g++) {
    const t = glowN > 1 ? g / (glowN - 1) : 0;
    const a = segmentAnchors[Math.round(t * (N - 1))];
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: coreTex, transparent: true, opacity: (0.18 + (model.coreIntensity ?? 0.3) * 0.4) * (1 - t * 0.4),
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.setScalar(a.r * 4.0);
    glow.position.set(0, a.y, a.z);
    glow.layers.set(1);
    group.add(glow);
  }
  // The heart-core glow the rig pulses on Surge (front of the body).
  const z0 = zs[0] - zMid;
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coreTex, transparent: true, opacity: 0.25 + (model.coreIntensity ?? 0.3) * 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(leadR * 4.2);
  coreGlow.position.set(0, yAt(0.2), z0 + leadR * 0.5);
  coreGlow.layers.set(1);
  coreGlow.userData.base = coreGlow.material.opacity;
  group.add(coreGlow);

  const leadZ = z0;
  const lastZ = zs[N - 1] - zMid;
  const leadR2 = radii[0];

  // Rider SADDLE in the front third (§0.5) — on top of the body just behind the head.
  const riderSocket = { x: 0, y: yAt(0.06) + leadR2 * 0.85, z: leadZ + leadR2 * 0.7 };
  const saddle = new THREE.Group();
  const seatR = leadR2 * 0.6;
  const cradle = new THREE.Mesh(
    new THREE.CylinderGeometry(seatR, seatR * 1.12, seatR * 0.5, 10, 1, true, Math.PI * 0.16, Math.PI * 0.68), vaneMat);
  cradle.rotation.x = Math.PI;
  cradle.position.y = -seatR * 0.12;
  saddle.add(cradle);
  for (const sx of [-1, 1]) {
    const pommel = new THREE.Mesh(new THREE.ConeGeometry(seatR * 0.2, seatR * 0.64, 4), seamMat);
    pommel.position.set(sx * seatR * 0.7, seatR * 0.16, -seatR * 0.26);
    pommel.rotation.z = sx * 0.22;
    saddle.add(pommel);
  }
  saddle.position.set(riderSocket.x, riderSocket.y - seatR * 0.55, riderSocket.z);
  group.add(saddle);

  const attach = {
    headBase: { x: 0, y: bodyY + 0.02, z: leadZ - leadR2 * 1.2 },
    tailAnchor: { y: yAt(1), z: lastZ + radii[N - 1] * 1.2 },
    riderSocket,
    wingRoot: (side) => ({ x: 0.2 * side * bodyScale, y: yAt(0) + 0.06, z: leadZ + leadR2 }),
    // Fins mount along the FRONT half of the body, sitting out on the flank (at r).
    sideFinRoots: (side, pairIndex) => {
      const a = segmentAnchors[Math.min(pairIndex * 2, N - 1)];
      return { x: a.r * 0.7 * side, y: a.y + a.r * 0.1, z: a.z };
    },
    segmentAnchors,
    keelTopAt: () => bodyY + leadR,
    tailShift: 0,
  };

  return { group, attach, mats: { bodyMat, eyeMat }, coreGlow, spineMats, bodySegs };
}

registerTorso('crystalSerpent', buildCrystalSerpentTorso);
