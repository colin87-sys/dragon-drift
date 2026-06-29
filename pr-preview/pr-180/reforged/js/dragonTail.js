import * as THREE from 'three';
import {
  buildForkShape, buildBladeShape, buildSpadeShape, buildLayeredFin,
  featherGeo, featherGradient,
} from './dragonParts.js';
import { registerTail } from './dragonRecipe.js';
import { skinnedTube } from './dragonSweep.js';
import { seg as lod } from './modelDetail.js'; // aliased: this file has a local `seg` mesh var
import { composeSurface, fresnelRimPatch, buildSurfacePatches } from './dragonSurfaceShader.js';

// Tail modules — the fourth part behind the recipe registry. A tail builder takes
// (def, model, mats, anchor) and returns { group, segs, tailFins, accentMats }:
//   group      the tail, ready to add (positioned by the builder)
//   segs       the root→tip chain the rig coils (segs[0] held at the hip)
//   tailFins   apex deployable fin groups the rig opens on boost/Surge (or null)
//   accentMats Surge-flaring accent mats, merged into the model's spineMats
//
// 'clean'  — the modern single continuous tail; one builder dispatches all ~11
//            styles off model.tailStyle (simple/finned/blade/comet/twinfin/shard/
//            spade/splitfin/stealthrudder/apexstealth/firefan). Anchored at the
//            torso's tail mount.
// 'legacy' — the old segmented mace/fan/simple tail (absolute coords, unused by
//            the current roster but kept for any dragon without a tailStyle).
//
// The clean tail's geometry (buildCleanTail) lives here; the shape PRIMITIVES it
// builds from (fork/blade/spade outlines, layered fins) stay in dragonParts.js.

// Old segmented tail: cone chain + a mace / fan / plain tip. Built in tail-local
// space at its original absolute z so it renders exactly as before.
function buildLegacyTail(def, model, mats) {
  const { bodyMat, scalesMat } = mats;
  const root = new THREE.Group();
  const segs = [];
  let radius = 0.4;
  let zTail = 1.7;
  const nTail = Math.min(model.tailSegments, 9);
  const taper = nTail > 7 ? 0.74 : 0.78;
  for (let i = 0; i < nTail; i++) {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, 0.95, lod(7)), bodyMat);
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, 0.1, zTail);
    root.add(seg);
    segs.push(seg);
    zTail += 0.58;
    radius = Math.max(radius * taper, 0.08);
  }
  const bladeMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: def.wingEmissive, emissiveIntensity: 0.7,
    roughness: 0.25, metalness: 0.5, side: THREE.DoubleSide,
  });
  if (model.maceTail) {
    const mace = new THREE.Mesh(new THREE.SphereGeometry(0.28, lod(8), lod(7)), bladeMat);
    mace.position.set(0, 0.1, zTail);
    root.add(mace);
    segs.push(mace);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, lod(4)), bladeMat);
      spike.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24 + 0.1, zTail);
      spike.rotation.z = Math.sin(a) * Math.PI / 2;
      spike.rotation.x = Math.cos(a) * Math.PI / 2;
      root.add(spike);
    }
  } else if (model.tailTip === 'fan') {
    for (let i = 0; i < 3; i++) {
      const angle = (i - 1) * 0.48;
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.74, lod(5)), scalesMat);
      fin.rotation.set(Math.PI / 2, 0, angle);
      fin.position.set(Math.sin(angle) * 0.14, Math.cos(angle) * 0.14 + 0.1, zTail);
      root.add(fin);
      segs.push(fin);
    }
  } else {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, lod(5)), scalesMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(0, 0.1, zTail);
    root.add(tip);
    segs.push(tip);
  }
  return { group: root, segs, tailFins: null, accentMats: null };
}

export function buildCleanTail(def, model, bodyMat, swept = false) {
  const root = new THREE.Group();
  const segs = [];
  const tailFins = [];   // deployable fin groups (apex only) — the rig opens these on boost/Surge
  const style = model.tailStyle || 'simple';
  // Obsidian's stealth-tail styles: a SMOOTH stem (no spike plates) lit by a
  // continuous cyan dorsal-segment line, ending in a layered fin assembly.
  const smoothStem = style === 'spade' || style === 'splitfin'
    || style === 'stealthrudder' || style === 'apexstealth' || style === 'nightfury';
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
  // base ≈ hip width so the tail flows out cleanly. The stealth stem keeps a
  // FULLER taper (thicker toward the fins) so the long apex stem reads as a
  // substantial tail-boom the stabilizers root into, not a thin whip.
  const baseR = 0.27, tipR = smoothStem ? 0.095 : 0.05;
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
    const plate = new THREE.Mesh(new THREE.ConeGeometry(0.04 + r * 0.16, h, lod(4)), plateMat);
    plate.position.set(0, r * 0.85, 0.04);
    plate.rotation.x = -0.18;
    return plate;
  }

  // Shaft segments. Each is its own group at a fixed z; the rig sways x/y so the
  // chain coils, with the root (segs[0]) held at the hip.
  for (let i = 0; i < N; i++) {
    const r0 = baseR + (tipR - baseR) * (i / (N - 1));
    const r1 = baseR + (tipR - baseR) * ((i + 1) / (N - 1));
    // sweptTail: the shaft segments become BONES of a skeleton, and ONE continuous
    // skinned tube (built after the loop) replaces the rigid frustums — the rig's
    // existing coil writes the same .position/.rotation on these handles, now bending
    // a seamless surface. Default (Group + per-segment frustum) is byte-identical.
    const seg = swept ? new THREE.Bone() : new THREE.Group();
    seg.position.set(0, 0, i * spacing);
    if (!swept) {
      const frustum = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, lod(8)), bodyMat);
      frustum.rotation.x = Math.PI / 2;
      seg.add(frustum);
    }
    if (!smoothStem) seg.add(spinePlate(r0));
    root.add(seg);
    segs.push(seg);
  }

  // Anatomical root collar (apex): a short flared fairing on the root segment that
  // reaches FORWARD into the hip region so the tail visibly grows out of the hips
  // instead of butting against them — dark body material, no cyan.
  if (model.tailRootCollar) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR * 1.2, 0.44, lod(8)), bodyMat);
    collar.rotation.x = Math.PI / 2;        // lie along z (wide end toward the hip, -z)
    collar.position.set(0, 0, -0.18);
    segs[0].add(collar);
  }

  // Dorsal / tail SEGMENT line (Obsidian): a row of small cyan chevrons marching
  // along the smooth stem crest, continuing the body's dorsal line onto the tail
  // so spine → hips → stem → fins reads as one connected system. Attached to the
  // shaft segments so they coil with the tail. Count + glow ramp per form.
  if (smoothStem && (model.tailGlowSegs ?? 0) > 0) {
    const count = model.tailGlowSegs;
    for (let i = 0; i < count; i++) {
      const f = (i + 0.45) / count;                  // 0..1 along the stem
      const segIdx = Math.min(N - 1, Math.floor(f * N));
      const seg = segs[segIdx];
      const localZ = f * len - segIdx * spacing;     // z within that segment's frame
      const r = baseR + (tipR - baseR) * f;
      const chev = new THREE.Group();
      for (const sx of [-1, 1]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.12 + r * 0.2), plateMat);
        bar.position.set(sx * (0.03 + r * 0.22), 0, 0.02);
        bar.rotation.y = sx * 0.7;                    // angle into a forward "^"
        chev.add(bar);
      }
      chev.position.set(0, r * 0.92, localZ);
      seg.add(chev);
    }
  }

  // Dorsal link (apex): one extra chevron at the very root crest so the body's
  // dorsal line continues UNBROKEN onto the tail stem (head→back→hips→tail reads
  // as one connected spine). Rides the root segment + flares on Surge via plateMat.
  if (model.tailDorsalLink && smoothStem) {
    const chev = new THREE.Group();
    for (const sx of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.12 + baseR * 0.2), plateMat);
      bar.position.set(sx * (0.03 + baseR * 0.22), 0, 0.02);
      bar.rotation.y = sx * 0.7;
      chev.add(bar);
    }
    chev.position.set(0, baseR * 0.92, -0.12);
    segs[0].add(chev);
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
      const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.045, dir.length(), lod(4)), plateMat);
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
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.045, 1.35, lod(4)), plateMat);
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
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.04, dir.length(), lod(4)), plateMat);
      rib.position.copy(a).add(b).multiplyScalar(0.5);
      rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      tip.add(rib);
    }
  } else if (style === 'spade') {
    // HATCHLING: a clean tapered stem ending in a small dark spade / leaf tip —
    // a hint of the fin system to come, kept tiny and simple.
    const spadeGeo = new THREE.ShapeGeometry(buildSpadeShape(0.17, 0.62));
    spadeGeo.rotateX(Math.PI / 2);            // lay flat: a horizontal leaf, tip back
    const spade = new THREE.Mesh(spadeGeo, membraneMat);
    spade.position.set(0, 0.03, 0.04);
    tip.add(spade);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.02, 0.34, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.13);
    tip.add(point);
  } else if (style === 'splitfin') {
    // KINDLED: the first fin identity — a SPLIT dorsal fin (two small flared
    // finlets) with a tiny side-fin hint each side; the tail beginning to evolve
    // into a stealth flight-control surface.
    const fs = model.tailFinScale ?? 0.6;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    for (const sx of [-1, 1]) {
      const lobe = buildLayeredFin(0.13 * fs, 0.64 * fs, fill, em, { seam: false });
      lobe.scale.x = sx;
      const p = new THREE.Group();
      p.add(lobe);
      p.rotation.z = sx * 0.34;               // split into a shallow V
      p.rotation.x = 0.5;
      p.position.set(sx * 0.05, 0.05, 0.0);
      tip.add(p);
      const side = buildLayeredFin(0.08 * fs, 0.3 * fs, fill, em, { seam: false });
      side.scale.x = sx;
      const sp = new THREE.Group();
      sp.add(side);
      sp.rotation.z = sx * 1.1;
      sp.rotation.x = 0.45;
      sp.position.set(sx * 0.12, -0.02, -0.32);
      tip.add(sp);
    }
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.5, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.24);
    tip.add(point);
  } else if (style === 'stealthrudder') {
    // RADIANT: a proper stealth-RUDDER — two main swept LAYERED fins (curved
    // tapered edges, inner notch, raised inner panel, cyan rim + centre seam) in a
    // shallow up-and-out V, flanking a slim central rudder. A refined control
    // surface, not a flat diamond. Sizes with tailFinScale.
    const fs = model.tailFinScale ?? 1;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    for (const sx of [-1, 1]) {
      const fin = buildLayeredFin(0.30 * fs, 1.18 * fs, fill, em);
      fin.scale.x = sx;                       // leading edge outward
      const p = new THREE.Group();
      p.add(fin);
      p.rotation.z = sx * 0.52;               // shallow upward V
      p.rotation.y = sx * 0.14;
      p.rotation.x = 0.5;                      // sweep rearward
      p.position.set(sx * 0.1, 0.06, 0.0);
      tip.add(p);
    }
    const rudder = buildLayeredFin(0.16, 0.74, fill, em);
    rudder.rotation.x = 0.5;
    rudder.position.set(0, 0.12, 0.0);
    tip.add(rudder);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.62, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.3);
    tip.add(point);
  } else if (style === 'apexstealth') {
    // ETERNAL: the apex stealth-tail ASSEMBLY — two LARGE swept layered
    // stabilizers canted down & outward (anhedral), two micro support fins
    // forward on the stem, and a tall central rudder. Layered surfaces, cyan rims
    // + seams. Aerodynamic, elegant, dangerous — the "worth the grind" tail.
    const fs = model.tailFinScale ?? 1.6;
    const spread = model.tailFinSpread ?? 1.55;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    // Register a fin group as DEPLOYABLE: store its rest pose so the rig can open
    // it further (anhedral, down & out — away from the centre lane) on boost/Surge.
    const reg = (grp) => {
      grp.userData.restRotZ = grp.rotation.z;
      grp.userData.restRotY = grp.rotation.y;
      grp.userData.restScale = 1;
      tailFins.push(grp);
      return grp;
    };
    for (const sx of [-1, 1]) {
      const fin = buildLayeredFin(0.34 * fs, 1.42 * fs, fill, em, { curve: 0.18, tipPinch: 0.8 });
      fin.scale.x = sx;
      const p = new THREE.Group();
      p.add(fin);
      // Trailing finlet — a small secondary control surface behind the main fin
      // root, sharing the main fin's deploy transform (parented to p).
      const finlet = buildLayeredFin(0.10, 0.34, fill, em, { seam: false, curve: 0.14 });
      finlet.scale.x = sx;
      finlet.rotation.x = -0.5;
      finlet.position.set(0, 0.05, 0.30);
      p.add(finlet);
      p.rotation.z = sx * (1.0 + 0.3 * spread);   // down & out (anhedral V)
      p.rotation.y = sx * 0.26 * spread;
      p.rotation.x = 0.32;                        // sweep rearward
      p.position.set(sx * 0.12, 0.05, 0.0);
      tip.add(reg(p));
      const micro = buildLayeredFin(0.13, 0.52, fill, em, { seam: false, curve: 0.12 });
      micro.scale.x = sx;
      const mp = new THREE.Group();
      mp.add(micro);
      mp.rotation.z = sx * 0.82;
      mp.rotation.x = 0.42;
      mp.position.set(sx * 0.14, 0.0, -0.62);    // micro-stabilizer forward on the stem
      tip.add(reg(mp));
    }
    const rudder = buildLayeredFin(0.17, 0.96, fill, em, { curve: 0.16 });
    rudder.rotation.x = 0.4;
    rudder.position.set(0, 0.17, 0.0);
    tip.add(rudder);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.66, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.34);
    tip.add(point);
  } else if (style === 'nightfury') {
    // Toothless-style TWIN tail-fins: two broad rounded membrane fans lying FLAT &
    // HORIZONTAL (aircraft horizontal stabilizers), swept out to the sides at the tip
    // of the smooth swept stem — the Night Fury signature. Built from the layered-fin
    // primitive with a strong curve; sizes with tailFinScale so the fins grow per form.
    const fs = model.tailFinScale ?? 1;
    const em = ensureEdgeMat();
    const fill = ensureFinFill();
    for (const sx of [-1, 1]) {
      // Narrower, finer blade (tipPinch down) so the twin fins read as a SLEEK swept
      // rudder, not a broad rounded paddle that foreshortens to a teardrop from the
      // rear chase cam. (Identity-Playbook: detail in a crisp edge, not a blob.)
      const fin = buildLayeredFin(0.4 * fs, 1.42 * fs, fill, em, { curve: 0.12, tipPinch: 0.62 });
      fin.scale.x = sx;
      const p = new THREE.Group();
      p.add(fin);
      p.rotation.x = Math.PI / 2;   // lay the blade FLAT — a crisp horizontal stabilizer (face +Y)
      p.rotation.y = sx * 0.40;     // more swept-back so it reads as a fin, not a fan
      p.rotation.z = 0;             // flat (no anhedral — a droop splits into a 'heart' blob from dead rear)
      p.position.set(sx * 0.05, 0.02, 0.0);
      tip.add(p);
    }
    // A FINE tail point (longer + sharper) instead of a stubby blunt cone — kills the
    // rounded teardrop tip the old fat cone produced.
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR * 0.55, 0.52, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.2);
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
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.46, lod(4)), plateMat);
    fin.scale.set(1, 1, 0.5);
    fin.position.set(0, 0.26, -0.05);
    tip.add(fin);
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.6, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.3);
    tip.add(point);
  } else {
    const point = new THREE.Mesh(new THREE.ConeGeometry(tipR + 0.03, 0.55, lod(6)), bodyMat);
    point.rotation.x = Math.PI / 2;
    point.position.set(0, 0, 0.28);
    tip.add(point);
  }
  root.add(tip);
  segs.push(tip);

  // sweptTail: skin ONE continuous tapered tube to the 7 shaft bones, replacing the
  // rigid frustums with a seamless surface that bends with the rig's coil (the slim
  // Night Fury tail). Fins/plates/tip stay parented to the bones and ride the bend.
  // Bind in local space — root is still at origin here; the recipe positions it (L2).
  if (swept) {
    const bones = segs.slice(0, N);                  // the 7 shaft bones (tip excluded)
    const M = (N - 1) * 2 + 1;                       // longitudinal stations (smooth bend)
    const tEnd = Math.max(tipR, 0.13);               // fuller tail end — not a thin pale rod
    // Dark MATTE stem material so the tail integrates with the black body instead of
    // reading as a lit grey cylinder (no metallic sheen, high roughness).
    const stemMat = new THREE.MeshStandardMaterial({ color: def.body, roughness: 0.85, metalness: 0.04 });
    // WHOLE-CREATURE SHADER SCALE (L31, obsidian2-only, gated): the swept tail's stem
    // is a SEPARATE matte material with NO surface shader, so the body's pebbly relief
    // stopped at the hips. When the creature opts in (model.scaleTail) AND declares a
    // surface shader, compose the SAME relief (fresnel rim + the cellularScalesNormal
    // patches) onto the stem + apply the matte body FINISH, so the scale reads nose-
    // to-tail. The tube is UV-less + a SkinnedMesh (like the body hull, which already
    // runs this shader) and the patch uses object-space vSurfPos, so it tiles fine.
    // obsidian v1 does NOT set scaleTail → its stemMat is byte-identical/untouched.
    const tailShader = def.parts && def.parts.surface && def.parts.surface.shader;
    if (model.scaleTail && tailShader && tailShader.length) {
      composeSurface(stemMat, [fresnelRimPatch(def.apexSeam || def.eye), ...buildSurfacePatches(tailShader, def)]);
      if (def.bodyRoughness != null) stemMat.roughness = def.bodyRoughness;
      if (def.bodyMetalness != null) stemMat.metalness = def.bodyMetalness;
      if (def.bodyEnvIntensity != null) stemMat.envMapIntensity = def.bodyEnvIntensity;
    }
    const centre = [], radii = [], skin = [];
    for (let s = 0; s < M; s++) {
      const z = (s / (M - 1)) * len;
      centre.push({ x: 0, y: 0, z });
      radii.push(baseR + (tEnd - baseR) * (z / len));
      const t = z / spacing, i0 = Math.min(N - 1, Math.floor(t)), i1 = Math.min(N - 1, i0 + 1), f = t - i0;
      skin.push({ si: [i0, i1, 0, 0], sw: [1 - f, f, 0, 0] });
    }
    const tube = skinnedTube(centre, radii, lod(8), (s) => skin[s], stemMat);
    tube.name = 'sweptTailTube';
    root.add(tube);
    root.updateMatrixWorld(true);
    tube.bind(new THREE.Skeleton(bones));
  }

  return { group: root, segs, plateMat, accentMats, tailFins: tailFins.length ? tailFins : null };
}

// ── registry ────────────────────────────────────────────────────────────────
// 'clean' positions the returned tail at the torso's published tail anchor.
registerTail('clean', (def, model, mats, anchor) => {
  const { group, segs, accentMats, tailFins } = buildCleanTail(def, model, mats.bodyMat);
  group.position.set(0, anchor.y, anchor.z);
  return { group, segs, accentMats, tailFins };
});
// 'sweptTail' — same builder, but the shaft is ONE skinned continuous tube bound to
// the 7 shaft bones (the rig's coil bends a seamless Night-Fury tail; fins/plates/tip
// ride the bones). Opt-in via parts.tail; 'clean' stays the byte-identical default.
registerTail('sweptTail', (def, model, mats, anchor) => {
  const { group, segs, accentMats, tailFins } = buildCleanTail(def, model, mats.bodyMat, true);
  group.position.set(0, anchor.y, anchor.z);
  return { group, segs, accentMats, tailFins };
});
// 'legacy' keeps its absolute coords (no anchor).
registerTail('legacy', (def, model, mats) => buildLegacyTail(def, model, mats));

// ── PLUME ─────────────────────────────────────────────────────────────────────
// The firebird flame-feather tail (the Phoenix, folded out of its bespoke
// builder): a fan of luminous ribbons, NOT a reptile tail/spear. A short chain of
// anchor segments (the rig coils them into a flowing wave); each anchor holds a
// fanned cross-section of feather slivers, so consecutive slivers form continuous
// ribbons that taper to the tip. F drives length + fan width + segment count.
function buildPlumeTail(def, model, _mats, anchor) {
  const F = model.formLevel ?? (model.spineGlow >= 1 ? 3 : model.spineGlow >= 0.6 ? 2 : model.spineGlow >= 0.25 ? 1 : 0);
  const cOut = def.featherOut ?? def.wingOuter;
  const cHi = def.featherHi ?? def.scales;
  const cEdge = def.featherEdge ?? def.apexSeam ?? def.wingEmissive;
  const cEmis = def.wingEmissive;

  const plumeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.72, side: THREE.DoubleSide,
    emissive: cEmis, emissiveIntensity: 0.65 + F * 0.35, depthWrite: false,
  });
  plumeMat.userData.baseEmissive = cEmis;
  plumeMat.userData.baseIntensity = 0.65 + F * 0.35;

  const plume = new THREE.Group();
  plume.position.set(0, anchor.y, anchor.z);
  plume.rotation.x = 0.12; // trail slightly downward
  const segs = [];
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
    segs.push(seg);
  }
  return { group: plume, segs, tailFins: null, accentMats: [plumeMat] };
}

registerTail('plume', buildPlumeTail);
