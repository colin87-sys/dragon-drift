import * as THREE from 'three';
import { registerTorso } from './dragonRecipe.js';
import { applyFresnelRim } from './surface.js';
import { makeGlowTexture } from './util.js';

// SEGMENTED WYRM — a torso made of many SEPARATE floating celestial vertebrae, a
// cosmic centipede-serpent. The first NON-CONTINUOUS body plan: instead of one
// lofted tube it builds a chain of faceted armored plates with glowing gaps
// between them, tapering from a large lead plate to small rear plates.
//
// It extends the attach contract with two reusable members so any future
// segmented dragon (and the side-fin wing + the spine gate) can find the chain:
//   attach.segmentAnchors  [{ x, y, z, scale }]  — every plate's world-local spot
//   attach.sideFinRoots(side, pairIndex) → {x,y,z} — fin mounts along the front plates
//
// It also returns `bodySegs` (the plate Groups) so the rig sways them as a
// lead-first travelling wave (see dragon.js / makePreviewTick — the motion the
// tail-coil already does, applied to the body). Because it publishes
// segmentAnchors, dragonModel automatically skips the continuous dorsal spine.

function buildSegmentedWyrmTorso(def, model, _bodyMat) {
  const group = new THREE.Group();
  const spineMats = [];

  const cBody = def.body;
  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCore = def.coreGlow ?? def.wingEmissive;
  const cEye = def.eye;
  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);

  // Faceted celestial shell: dark navy, flat-shaded so each plate reads as a cut
  // crystal vertebra; the fresnel rim picks out every edge from the rear camera.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.34, metalness: 0.5, flatShading: true,
    emissive: cBody, emissiveIntensity: 0.16,
  });
  applyFresnelRim(bodyMat, cSeam, { intensity: 0.5, power: 2.4 });
  // Translucent armored shell — the core crystal glows through it; the fresnel
  // rim picks out every bevel from the rear camera.
  const shellMat = new THREE.MeshStandardMaterial({
    color: cBody, roughness: 0.3, metalness: 0.55, flatShading: true,
    emissive: cBody, emissiveIntensity: 0.18, transparent: true, opacity: 0.6,
  });
  applyFresnelRim(shellMat, cSeam, { intensity: 0.7, power: 2.2 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: cEye, emissiveIntensity: 2.4 });

  // The glowing core gem each plate carries (and the inter-plate seam glow). In
  // spineMats so the whole chain's gaps flare on Dragon Surge.
  const coreInt = (0.8 + (model.coreIntensity ?? 0.3) * 2.2) * giM;
  const seamMat = new THREE.MeshStandardMaterial({
    color: cCore, emissive: cCore, emissiveIntensity: coreInt, roughness: 0.3, metalness: 0.4,
  });
  seamMat.userData.baseEmissive = cCore;
  seamMat.userData.baseIntensity = coreInt;
  spineMats.push(seamMat);
  // A brighter rib/crown accent (apex-seam tinted) for the dorsal vane on each plate.
  const vaneMat = new THREE.MeshStandardMaterial({
    color: def.scales ?? cSeam, emissive: cSeam, emissiveIntensity: (0.5 + F * 0.4) * giM,
    roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide,
  });
  vaneMat.userData.baseEmissive = cSeam;
  vaneMat.userData.baseIntensity = (0.5 + F * 0.4) * giM;
  spineMats.push(vaneMat);

  const N = Math.max(2, model.segmentCount ?? 5);
  const spacing = (model.segmentSpacing ?? 0.72);
  const taper = model.segmentTaper ?? 0.88;
  const bodyScale = model.bodyScale ?? 1;
  const bodyY = 0.5;
  const leadHalf = 0.66; // lead plate half-height
  // Centre the chain around the body so head/tail anchors sit symmetrically.
  const z0 = -((N - 1) * spacing * bodyScale) / 2;

  // Head-led LOW profile (§0.5 PLAYABILITY-FIRST): the lead plate sits just under
  // the head and the chain sinks gently back-and-DOWN behind it — a slither that
  // trails below the sight-line, never an arch that stacks mass over the head. The
  // quadratic ease keeps the FRONT plates near-level (a stable saddle area) and
  // lets the rear plates sink away into the comet wake.
  // Gentle descent only — a LONG creature's rear swings close to the chase camera,
  // so dropping it far there would loom huge + low in the frame. Keep the whole
  // chain in a tight band just under the head; the comet wake (sprites) carries the
  // long trailing-down drama instead of counted body geometry.
  const sink = leadHalf * 0.55 * bodyScale;   // total descent, front → rear
  const yAt = (t) => bodyY - 0.05 - t * t * sink;

  const bodySegs = [];
  const segmentAnchors = [];
  const sizes = [];
  for (let i = 0; i < N; i++) {
    const tt = N > 1 ? i / (N - 1) : 0;
    const size = leadHalf * Math.pow(taper, i) * bodyScale;
    sizes.push(size);
    const z = z0 + i * spacing * bodyScale;
    const segY = yAt(tt);
    const seg = new THREE.Group();
    seg.position.set(0, segY, z);
    seg.userData.baseY = segY; // the rig waves x + y around this base (z stays)

    // A premium armored VERTEBRA, not a flat diamond. A bright faceted core
    // crystal glows THROUGH a translucent beveled shell; armor facets ring the
    // shell; rib-spurs splay out (the centipede-leg read + silhouette); a finned
    // crest rides the back. Built rich so the apex chain reads as cut-jewel
    // vertebrae strung on light — worth the grind.

    // Translucent beveled shell — built WIDER + LONGER than it is tall (§0.5: a
    // low, horizontally-readable vertebra, not a tall diamond standing in the lane).
    const shell = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), shellMat);
    shell.scale.set(size * 1.7, size * 0.92, size * 0.82);
    seg.add(shell);
    // Bright faceted core crystal, glowing through the shell. Brightest at the
    // lead. A finely-cut gem (detail 1) with a small inner star nested in it, so
    // the chain reads as living cut-jewel vertebrae from the rear camera.
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), seamMat);
    const cs = size * (0.74 - i / N * 0.14);
    core.scale.set(cs, cs * 0.8, cs * 0.92);
    seg.add(core);
    const innerGem = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), vaneMat);
    innerGem.scale.set(cs * 0.46, cs * 0.46, cs * 0.6);
    seg.add(innerGem);
    // Armor facets — six angular plates clasping the shell edges, catching the
    // fresnel rim as bright crystalline ridges.
    for (let f = 0; f < 6; f++) {
      const a = (f / 6) * Math.PI * 2 + Math.PI / 6;
      const facet = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), bodyMat);
      facet.scale.set(size * 0.3, size * 0.85, size * 0.16);
      facet.position.set(Math.cos(a) * size * 1.05, Math.sin(a) * size * 0.85, 0);
      facet.rotation.z = a;
      seg.add(facet);
    }
    // Rib-spurs — two swept spur pairs per plate, splaying down-and-out like a
    // celestial centipede's legs, widening the rear silhouette.
    for (const sx of [-1, 1]) {
      for (let r = 0; r < 2; r++) {
        const spur = new THREE.Mesh(new THREE.ConeGeometry(size * 0.09, size * (0.9 - r * 0.2), 5), vaneMat);
        spur.position.set(sx * size * 1.35, -size * (0.1 + r * 0.2), 0.04);
        spur.rotation.z = sx * (1.05 + r * 0.28);
        spur.rotation.x = -0.2 - r * 0.15;
        seg.add(spur);
      }
    }
    // Dorsal crest — swept HARD back (not a vertical spike): a comet-raked sail
    // that LENGTHENS the silhouette down the chain instead of stacking height over
    // the sight-line. Low base + back-rake keeps it under the head line (§0.5).
    const crest = new THREE.Mesh(new THREE.ConeGeometry(size * 0.16, size * 1.05, 4), vaneMat);
    crest.scale.z = 0.42;
    crest.position.set(0, size * 0.5, size * 0.34);
    crest.rotation.x = 1.12;                 // rake the tip back along +z, barely rising
    seg.add(crest);
    const finlet = new THREE.Mesh(new THREE.ConeGeometry(size * 0.07, size * 0.6, 4), seamMat);
    finlet.scale.z = 0.32;
    finlet.position.set(0, size * 0.66, size * 0.5);
    finlet.rotation.x = 1.25;
    seg.add(finlet);

    group.add(seg);
    bodySegs.push(seg);
    segmentAnchors.push({ x: 0, y: segY, z, scale: size / leadHalf });
  }

  // Glowing seam discs floating in the GAPS between plates (additive sprites) —
  // the unmistakable "separated segments with light between them" read. Bright
  // and generous so the gaps carry the centipede identity from the rear camera.
  const gapRgb = `${(cCore >> 16) & 255},${(cCore >> 8) & 255},${cCore & 255}`;
  const gapTex = makeGlowTexture(gapRgb);
  for (let i = 0; i < N - 1; i++) {
    const tt = (i + 0.5) / (N - 1);
    const z = z0 + (i + 0.5) * spacing * bodyScale;
    const s = (sizes[i] + sizes[i + 1]) * 0.5;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: gapTex, transparent: true, opacity: 0.8 + (model.coreIntensity ?? 0.3) * 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(s * 3.0, s * 3.0, 1);
    glow.position.set(0, yAt(tt), z);
    glow.layers.set(1);
    group.add(glow);
  }

  // Heart-core glow the rig pulses (a soft astral corona down the lead body).
  const coreRgb = `${(cCore >> 16) & 255},${(cCore >> 8) & 255},${cCore & 255}`;
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(coreRgb), transparent: true, opacity: 0.2 + (model.coreIntensity ?? 0.3) * 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.scale.setScalar(leadHalf * 3.0 * bodyScale);
  coreGlow.position.set(0, yAt(0.45), z0 + (N - 1) * spacing * bodyScale * 0.45);
  coreGlow.layers.set(1);
  coreGlow.userData.base = coreGlow.material.opacity;
  group.add(coreGlow);

  const leadZ = z0;
  const lastZ = z0 + (N - 1) * spacing * bodyScale;

  // Rider SEAT in the front third (§0.5): a celestial saddle on the lead plate,
  // just behind the head, where the slither stays calm (the wave amplitude ramps
  // toward the tail). Published as attach.riderSocket so the rig seats the rider
  // here, and built as real geometry so the seat reads under the rider.
  const leadSize = sizes[0];
  const riderSocket = {
    x: 0,
    y: yAt(0) + leadSize * 0.62,
    z: leadZ + spacing * bodyScale * 0.28,
  };
  const saddle = new THREE.Group();
  const seatR = leadSize * 0.5;
  // A shallow cradle (open-topped) the rider sits in...
  const cradle = new THREE.Mesh(
    new THREE.CylinderGeometry(seatR, seatR * 1.12, seatR * 0.5, 10, 1, true, Math.PI * 0.16, Math.PI * 0.68),
    vaneMat);
  cradle.rotation.x = Math.PI;            // open side up
  cradle.position.y = -seatR * 0.12;
  saddle.add(cradle);
  // ...flanked by two glowing pommel horns.
  for (const sx of [-1, 1]) {
    const pommel = new THREE.Mesh(new THREE.ConeGeometry(seatR * 0.22, seatR * 0.72, 4), seamMat);
    pommel.position.set(sx * seatR * 0.72, seatR * 0.16, -seatR * 0.28);
    pommel.rotation.z = sx * 0.22;
    saddle.add(pommel);
  }
  saddle.position.set(riderSocket.x, riderSocket.y - seatR * 0.5, riderSocket.z);
  group.add(saddle);

  const attach = {
    // Head sits just ahead of the lead plate; tail just behind the last — now LOW,
    // where the descending chain ends and the comet wake streams on from there.
    headBase: { x: 0, y: bodyY + 0.04, z: leadZ - sizes[0] * 1.5 - 0.2 },
    tailAnchor: { y: yAt(1), z: lastZ + sizes[N - 1] * 1.4 + 0.1 },
    riderSocket,
    // Side fins mount on the front plates, widening toward the lead.
    wingRoot: (side) => ({ x: 0.28 * side * bodyScale, y: yAt(0) + 0.1, z: leadZ + spacing * bodyScale }),
    sideFinRoots: (side, pairIndex) => {
      const a = segmentAnchors[Math.min(pairIndex, segmentAnchors.length - 1)];
      return { x: a.scale * 0.55 * side * bodyScale, y: a.y + a.scale * 0.18, z: a.z };
    },
    segmentAnchors,
    keelTopAt: (z) => bodyY + leadHalf * 0.9,  // stub; the dorsal spine is gated off
    tailShift: 0,
  };

  return { group, attach, mats: { bodyMat, eyeMat }, coreGlow, spineMats, bodySegs };
}

registerTorso('segmentedWyrm', buildSegmentedWyrmTorso);
