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

  // Baseline ARC: the chain bows up over its length so, from the top-rear camera,
  // the plates fan to different heights and the gaps between them read clearly
  // (a straight chain into depth would just clump into a dark column). Ends sit at
  // bodyY so the head + tail anchors stay level.
  const arcH = leadHalf * 1.7 * bodyScale;
  const yAt = (t) => bodyY + Math.sin(t * Math.PI) * arcH;

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

    // Translucent beveled shell (the dark armored casing).
    const shell = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), shellMat);
    shell.scale.set(size * 1.6, size * 1.4, size * 0.5);
    seg.add(shell);
    // Bright faceted core crystal, glowing through the shell. Brightest at the lead.
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), seamMat);
    const cs = size * (0.74 - i / N * 0.14);
    core.scale.set(cs, cs * 1.1, cs * 0.62);
    seg.add(core);
    // Armor facets — four angular plates clasping the shell edges, catching the
    // fresnel rim as bright crystalline ridges.
    for (let f = 0; f < 4; f++) {
      const a = (f / 4) * Math.PI * 2 + Math.PI / 4;
      const facet = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), bodyMat);
      facet.scale.set(size * 0.34, size * 0.9, size * 0.16);
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
    // Finned dorsal crest — a raked vane + a thin glowing finlet riding the back,
    // a constellation ridge marching down the chain.
    const crest = new THREE.Mesh(new THREE.ConeGeometry(size * 0.15, size * 1.0, 4), vaneMat);
    crest.scale.z = 0.4;
    crest.position.set(0, size * 1.1, 0);
    crest.rotation.x = -0.3;
    seg.add(crest);
    const finlet = new THREE.Mesh(new THREE.ConeGeometry(size * 0.07, size * 0.55, 4), seamMat);
    finlet.scale.z = 0.3;
    finlet.position.set(0, size * 1.45, -0.04);
    finlet.rotation.x = -0.5;
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
  const attach = {
    // Head sits just ahead of the lead plate; tail just behind the last.
    headBase: { x: 0, y: bodyY + 0.04, z: leadZ - sizes[0] * 1.5 - 0.2 },
    tailAnchor: { y: bodyY, z: lastZ + sizes[N - 1] * 1.4 + 0.1 },
    // Side fins mount on the front plates, widening toward the lead.
    wingRoot: (side) => ({ x: 0.28 * side * bodyScale, y: bodyY + 0.1, z: leadZ + spacing * bodyScale }),
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
