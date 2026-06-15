import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { buildCleanTail } from './dragonParts.js';
import { resolveRecipe, getTorsoBuilder, getWingsBuilder, getHeadBuilder } from './dragonRecipe.js';
import './dragonTorso.js'; // self-registers the 'arrow' / 'serpent' torso profiles
import './dragonWings.js'; // self-registers the 'membrane' / 'none' wing builders
import './dragonHead.js';  // self-registers the 'horned' / 'beaked' head builders
import { buildPhoenixModel } from './phoenixModel.js';

// Unified procedural dragon mesh builder.
// Both the in-game rig (dragon.js) and the shop turntable (preview.js)
// consume this single function so they always show the same creature.
//
// The heavy redesigned geometry (arrowhead torso, elbow-profile wings, single
// clean tail) lives in dragonParts.js; this file assembles those, layers the
// per-dragon decoration flags, and exposes the animation hookpoints.
//
// Returns { group, parts, materials, auraSprite } where:
//   parts.wingPivotL/R, wingTipL/R, tipMarkerL/R — wing animation hookpoints
//   parts.head, parts.tailSegs                   — head/tail animation
//   materials.bodyMat, .wingMat, .eyeMat         — runtime-animated materials
//   auraSprite                                    — fever/idle aura

// Build the full dragon mesh from a resolved def (post-ascendedDef).
export function buildDragonModel(def, opts = {}) {
  // Legendary firebird archetype has an entirely separate model (avian body,
  // feather wings, flame-plume tail) but returns the same animation handles.
  if (def.archetype === 'phoenix') return buildPhoenixModel(def, opts);

  const model = def.model;
  const group = new THREE.Group();
  // Emissive multiplier (Radiant = 1.0; the apex can exceed 1) shared by every
  // glowing accent so a form's whole light signature ramps from one constant.
  // giM clamps the per-element emissive so high gi reads as MORE cyan glow
  // (chevrons/edges/particles), not a white-blown bloom under the ACES tone-map.
  const gi = model.glowIntensity ?? 1;
  const giM = Math.min(gi, 1.3);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.38, metalness: 0.12,
    emissive: def.body, emissiveIntensity: 0.12,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: def.horn, emissive: 0x6b3400, emissiveIntensity: 0.22, roughness: 0.24,
  });
  // wingMat (the runtime-animated membrane material) is created by the wings
  // module and returned below, so it stays paired with the wing geometry.
  const scalesMat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: 0x0b79aa, emissiveIntensity: 0.42,
    roughness: 0.28, metalness: 0.22,
  });
  const bellyMat = new THREE.MeshStandardMaterial({ color: def.belly, roughness: 0.5 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: def.eye, emissiveIntensity: 2.2,
  });

  // --- Body foundation: composable torso ---------------------------------
  // The body plan (torso loft + wing-root fairings + neck chain) comes from the
  // recipe's TORSO module (dragonTorso.js). That module also publishes the
  // ATTACH contract — where the wings, head and tail mount, and the keel crest
  // for the spine — so a different skeleton (e.g. the long 'serpent' profile)
  // drops in without changing any of the wing / head / tail / spine code below.
  const recipe = resolveRecipe(def);
  const { group: torsoGroup, attach } = getTorsoBuilder(recipe.torso)(def, model, bodyMat);
  group.add(torsoGroup);

  // Accent materials (spine plates, crest, glow seams, tail plates) that flare
  // toward white-gold during Dragon Surge — collected for the rig to drive.
  const spineMats = [];

  // Glowing dorsal spine — runs along the crest of the keel so it reads as a
  // bright stripe from directly behind. Ramps with the forms (spineGlow 0→1).
  // Dragons that author a dorsalGlowCount get the CHEVRON line below instead.
  if (model.spineGlow > 0 && !model.dorsalGlowCount) {
    const g = model.spineGlow;
    const spineCol = def.apexSeam || def.eye;
    const spineMat = new THREE.MeshStandardMaterial({
      color: spineCol, emissive: spineCol,
      emissiveIntensity: (0.7 + g * 2.0) * gi, roughness: 0.3, metalness: 0.3,
    });
    spineMat.userData.baseEmissive = spineCol;
    spineMat.userData.baseIntensity = (0.7 + g * 2.0) * gi;
    spineMats.push(spineMat);
    const segN = 11;
    for (let i = 0; i < segN; i++) {
      const t = i / (segN - 1);
      const z = -1.7 + t * 3.4;                 // shoulders → tail root
      const top = attach.keelTopAt(z);          // crest of the keel (incl. torso y)
      const h = 0.16 + g * 0.22;
      const node = new THREE.Mesh(new THREE.ConeGeometry(0.04 + g * 0.045, h, 4), spineMat);
      node.rotation.x = -Math.PI / 2;
      node.position.set(0, top + h / 2 - 0.04, z);
      group.add(node);
    }
  }

  // Dorsal ENERGY LINE — a row of cyan chevrons marching head→tail along the keel
  // crest (the Night-drake signature). Reads as a bright "<<<" stripe straight
  // down the back from the top-rear camera; count + brightness ramp per form
  // (dorsalGlowCount / glowIntensity) so the apex is unmistakably more charged.
  if (model.dorsalGlowCount > 0) {
    const n = model.dorsalGlowCount;
    const chevCol = def.dorsalHi ?? def.apexSeam ?? def.eye;
    const chevInt = (0.6 + (model.spineGlow || 0) * 0.6) * giM;
    const chevMat = new THREE.MeshStandardMaterial({
      color: chevCol, emissive: chevCol, emissiveIntensity: chevInt,
      roughness: 0.3, metalness: 0.35,
    });
    chevMat.userData.baseEmissive = chevCol;
    chevMat.userData.baseIntensity = chevInt;
    spineMats.push(chevMat);
    const barLen = 0.17 + giM * 0.06;
    const barW = 0.03 + giM * 0.008;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const z = -1.75 + t * 3.55;               // shoulders → tail root
      const top = attach.keelTopAt(z);
      const wide = 0.10 + (1 - Math.abs(t - 0.45) * 1.4) * 0.05; // fuller across the mid-back
      const chev = new THREE.Group();
      for (const sx of [-1, 1]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(barW, barW, barLen * 1.5), chevMat);
        bar.position.set(sx * wide, 0, barLen * 0.36);
        bar.rotation.y = sx * 0.72;             // angle the two bars into a forward "^"
        chev.add(bar);
      }
      chev.position.set(0, top + 0.05, z);
      group.add(chev);
    }
  }

  // Heroic back-crest — a crown of swept, raked-back blades rising off the
  // shoulders. The apex's "crown-like, rear-visible" silhouette.
  if (model.backCrest) {
    const crestMat = new THREE.MeshStandardMaterial({
      color: def.horn, emissive: def.apexSeam || def.wingEmissive,
      emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.5,
      side: THREE.DoubleSide,
    });
    crestMat.userData.baseEmissive = def.apexSeam || def.wingEmissive;
    crestMat.userData.baseIntensity = 0.85;
    spineMats.push(crestMat);
    for (let i = 0; i < 5; i++) {
      const t = (i - 2) / 2;
      const h = 0.95 - Math.abs(t) * 0.32;
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, 4), crestMat);
      blade.scale.set(1, 1, 0.38);
      blade.position.set(t * 0.5, 1.0 + h / 2 - Math.abs(t) * 0.14, -0.5);
      blade.rotation.x = -0.62;
      blade.rotation.z = -t * 0.55;
      group.add(blade);
    }
  }

  // Scale ridge (legacy back detailing kept for the rest of the roster)
  const ridgeCount = model.ridgeCount;
  const ridgeStep = Math.min(0.43, 5.2 / ridgeCount);
  for (let i = 0; i < ridgeCount; i++) {
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(0.09 + Math.max(0, 5 - Math.abs(i - 4)) * 0.016, 0.34, 5), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, attach.keelTopAt(-2.55 + i * ridgeStep) + 0.06, -2.55 + i * ridgeStep);
    group.add(ridge);
  }

  // Dorsal sail fin
  if (model.dorsal) {
    for (let i = 0; i < 5; i++) {
      const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
      const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, 4), scalesMat);
      df.rotation.x = -Math.PI / 2;
      const z = -1.6 + i * 0.8;
      df.position.set(0, attach.keelTopAt(z) + h / 2, z);
      group.add(df);
    }
  }

  // Back spines (Toothless/Charizard — hidden rows that deploy)
  if (model.backSpines) {
    const spineMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.scales, emissiveIntensity: 0.35,
      roughness: 0.2, metalness: 0.3,
    });
    for (let i = 0; i < 7; i++) {
      const h = 0.22 + Math.sin((i / 6) * Math.PI) * 0.32;
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, 4), spineMat);
      spine.rotation.x = -Math.PI / 2;
      spine.rotation.z = (i % 2 === 0 ? 0.12 : -0.12);
      const z = -0.8 + i * 0.55;
      spine.position.set((i % 2 === 0 ? 0.08 : -0.08), attach.keelTopAt(z) + h / 2, z);
      group.add(spine);
    }
  }

  // Armor plates (Bahamut/Charizard — angular shoulder/flank overlays)
  if (model.armorPlates) {
    const plateMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: 0x0b79aa, emissiveIntensity: 0.38,
      roughness: 0.2, metalness: 0.55,
    });
    for (const [zp, sx, ry, rz] of [
      [-1.2, 0.72, 0.3, -0.28], [-1.2, -0.72, -0.3, 0.28],
      [-0.5, 0.62, 0.44, -0.32], [-0.5, -0.62, -0.44, 0.32],
      [0.1, 0.5, 0.55, -0.38], [0.1, -0.5, -0.55, 0.38],
    ]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.48, 0.14), plateMat);
      plate.position.set(sx, 0.46, zp);
      plate.rotation.set(0, ry, rz);
      group.add(plate);
    }
  }

  // Glow seams (under-scale emissive veins — Bahamut/Toothless at apex)
  if (model.glowSeams) {
    const seamColor = def.apexSeam || def.eye;
    const seamMat = new THREE.MeshStandardMaterial({
      color: seamColor, emissive: seamColor, emissiveIntensity: 1.8 * giM, roughness: 0.3,
    });
    seamMat.userData.baseEmissive = seamColor;
    seamMat.userData.baseIntensity = 1.8 * giM;
    spineMats.push(seamMat);
    for (const xo of [-0.26, 0.26]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 3.4), seamMat);
      seam.position.set(xo, 0.5, -0.7);
      group.add(seam);
    }
  }

  // Blade fins (Pearl — sharp blade-like lateral fins)
  if (model.bladeFins) {
    const bladeMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.eye, emissiveIntensity: 0.5,
      roughness: 0.15, metalness: 0.6, side: THREE.DoubleSide,
    });
    for (const [sx, zp, ang] of [
      [0.62, -1.0, -0.55], [-0.62, -1.0, 0.55],
      [0.5, -0.2, -0.65], [-0.5, -0.2, 0.65],
    ]) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.9, 4), bladeMat);
      blade.position.set(sx, 0.35, zp);
      blade.rotation.z = ang;
      blade.rotation.x = -0.15;
      group.add(blade);
    }
  }

  // Head — from the recipe's HEAD module (horned / beaked). Sits at the torso's
  // published head anchor (varies per body plan); the neck chain bridging the
  // torso's neck cap to the head is built inside the torso module.
  const head = getHeadBuilder(recipe.head)(def, model, { bodyMat, hornMat, bellyMat, scalesMat, eyeMat });
  const hb = attach.headBase;
  head.position.set(hb.x, hb.y, hb.z);
  group.add(head);

  // Pearl's luminous head aura: a soft opalescent glow (a body-level sprite, NOT
  // part of the head group), elegant and pristine — never a hard torus ring.
  if (model.halo) {
    const haloRgb = `${(def.eye >> 16) & 255},${(def.eye >> 8) & 255},${def.eye & 255}`;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(haloRgb), transparent: true, opacity: 0.34,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.set(3.4, 4.0, 1);
    glow.position.set(0, 0.7, 0.05);
    glow.layers.set(1);
    group.add(glow);
  }

  // --- Tail --------------------------------------------------------------
  // Redesigned dragons (model.tailStyle) get the single clean tail; the rest of
  // the roster keeps the legacy segmented tail (fan / mace / simple).
  const tailSegs = [];
  let tailFins = null;
  if (model.tailStyle) {
    // Tail root anchored at hipRear and overlapping the body (base radius ≈ hip
    // width) so it flows out of the torso seamlessly — never a detached spear.
    const { group: tailGroup, segs, accentMats, tailFins: tf } = buildCleanTail(def, model, bodyMat);
    if (accentMats) for (const m of accentMats) spineMats.push(m);
    tailFins = tf;
    tailGroup.position.set(0, attach.tailAnchor.y, attach.tailAnchor.z);
    group.add(tailGroup);
    for (const s of segs) tailSegs.push(s);
  } else {
    let radius = 0.4;
    let zTail = 1.7;
    const nTail = Math.min(model.tailSegments, 9);
    const taper = nTail > 7 ? 0.74 : 0.78;
    for (let i = 0; i < nTail; i++) {
      const seg = new THREE.Mesh(new THREE.ConeGeometry(radius, 0.95, 7), bodyMat);
      seg.rotation.x = Math.PI / 2;
      seg.position.set(0, 0.1, zTail);
      group.add(seg);
      tailSegs.push(seg);
      zTail += 0.58;
      radius = Math.max(radius * taper, 0.08);
    }
    const bladeMat = new THREE.MeshStandardMaterial({
      color: def.scales, emissive: def.wingEmissive, emissiveIntensity: 0.7,
      roughness: 0.25, metalness: 0.5, side: THREE.DoubleSide,
    });
    if (model.maceTail) {
      const mace = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 7), bladeMat);
      mace.position.set(0, 0.1, zTail);
      group.add(mace);
      tailSegs.push(mace);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 4), bladeMat);
        spike.position.set(Math.cos(a) * 0.24, Math.sin(a) * 0.24 + 0.1, zTail);
        spike.rotation.z = Math.sin(a) * Math.PI / 2;
        spike.rotation.x = Math.cos(a) * Math.PI / 2;
        group.add(spike);
      }
    } else if (model.tailTip === 'fan') {
      for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.48;
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.74, 5), scalesMat);
        fin.rotation.set(Math.PI / 2, 0, angle);
        fin.position.set(Math.sin(angle) * 0.14, Math.cos(angle) * 0.14 + 0.1, zTail);
        group.add(fin);
        tailSegs.push(fin);
      }
    } else {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 5), scalesMat);
      tip.rotation.x = Math.PI / 2;
      tip.position.set(0, 0.1, zTail);
      group.add(tip);
      tailSegs.push(tip);
    }
  }

  // --- Wings -------------------------------------------------------------
  // The wing system (membrane / none) comes from the recipe's WINGS module
  // (dragonWings.js): it owns the runtime-animated membrane material + the apex
  // fin accents, and mounts via the torso's attach contract. Returns the flap
  // rig handles the in-game animation + shop preview drive. Its Surge-flaring
  // accent mats (the cyan fin rim) merge into the shared spineMats.
  const wingsResult = getWingsBuilder(recipe.wings)(def, model, attach, giM);
  group.add(wingsResult.group);
  for (const m of wingsResult.spineMats) spineMats.push(m);
  const wingMat = wingsResult.wingMat;
  const {
    wingPivotL, wingPivotR, wingTipL, wingTipR,
    tipMarkerL, tipMarkerR, wingPivot2L, wingPivot2R,
  } = wingsResult.parts;

  // Solar aura card (apex only): a tall narrow backlight behind the body — a
  // corona, not a ring that competes with the collectible rings.
  if (model.auraHalo) {
    const haloRgb = def.apexSeam
      ? `${(def.apexSeam >> 16) & 255},${(def.apexSeam >> 8) & 255},${def.apexSeam & 255}`
      : def.fx.auraColor;
    const auraCard = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(haloRgb), transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    auraCard.scale.set(4.0, 6.2, 1);
    auraCard.position.set(0, 0.9, 0.25);
    group.add(auraCard);
  }

  // Violet core energy — a soft amethyst glow nestled between the shoulders that
  // reads as the dragon's power source. Faint on the hatchling, stronger each
  // form (escalates with spineGlow). Controlled size/opacity so it never blooms
  // over the body silhouette. Tagged so the rig can pulse it during Surge.
  let coreGlow = null;
  if (def.coreGlow) {
    const lvl = 0.45 + (model.spineGlow || 0) * 0.55;
    const coreRgb = `${(def.coreGlow >> 16) & 255},${(def.coreGlow >> 8) & 255},${def.coreGlow & 255}`;
    coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(coreRgb), transparent: true, opacity: 0.18 + lvl * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    coreGlow.scale.setScalar(0.85 + lvl * 0.7);
    coreGlow.position.set(0, 0.5, -0.35); // between the shoulders, on the back
    coreGlow.layers.set(1);
    coreGlow.userData.base = coreGlow.material.opacity;
    group.add(coreGlow);
  }

  // Aura sprite (fever glow + idle premium aura)
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx.auraColor), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale);

  // Shop preview: a clean flying showcase (no turntable / no pedestal). Downscale
  // so the widest apex wings fit the small card, and float a soft rarity-tinted
  // corona behind the dragon instead of a spinning rune disc.
  if (opts.preview) {
    const RARITY_GLOW = { R: 0x6affa0, SR: 0x4ac0ff, SSR: 0xc060ff, SSSR: 0xffd040 };
    // A dragon's own signature corona (previewAccent) wins over the rarity tint so
    // its card/showcase stays on-brand (Obsidian cyan, not rarity gold/purple).
    const glowHex = def.previewAccent ?? (RARITY_GLOW[def.rarity] ?? RARITY_GLOW.R);
    const glowRgb = `${(glowHex >> 16) & 255},${(glowHex >> 8) & 255},${glowHex & 255}`;
    const wrapper = new THREE.Group();
    wrapper.add(group);

    const corona = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(glowRgb), transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    corona.scale.set(5.5, 5.5, 1);
    corona.position.set(0, 0.25, -0.6);
    wrapper.add(corona);

    return {
      group: wrapper,
      parts: { head, tailSegs, tailFins, wingPivotL, wingPivotR, wingTipL, wingTipR, wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR, coreGlow },
      materials: { bodyMat, wingMat, eyeMat, spineMats },
      auraSprite,
    };
  }

  return {
    group,
    parts: {
      head, tailSegs, tailFins,
      wingPivotL, wingPivotR,
      wingTipL, wingTipR,
      wingPivot2L, wingPivot2R,
      tipMarkerL, tipMarkerR,
      coreGlow,
    },
    materials: { bodyMat, wingMat, eyeMat, spineMats },
    auraSprite,
  };
}

// Shared tick for the shop preview — NOT a turntable. The dragon faces away and
// FLAPS exactly like it does in flight (banking, bobbing, coiling its tail), so
// scrubbing forms reads like a real "what you'll fly" preview instead of a janky
// spinning model.
export function makePreviewTick(def, result) {
  const { group, parts, auraSprite } = result;
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R, wingTipL, wingTipR } = parts;
  const flapBias = def.model.flapBias || 1;
  const flapAmp = def.model.flapAmp ?? 1;
  return (t) => {
    // Float + gentle bank/pitch — the in-flight read, no spin.
    group.position.y = 0.15 + Math.sin(t * 1.5) * 0.09;
    group.rotation.y = 0;
    group.rotation.z = Math.sin(t * 0.7) * 0.13;        // lazy bank left/right
    group.rotation.x = -0.05 + Math.sin(t * 1.5 + 1) * 0.03;
    // Wingbeat — same shape as the live rig (root flap + feather pitch).
    const phase = t * 6.2 * flapBias;
    const flap = Math.sin(phase) * 0.52 * flapAmp + 0.12;
    const feather = Math.sin(phase + Math.PI * 0.55) * 0.16;
    wingPivotR.rotation.z = -flap;
    wingPivotL.rotation.z = flap;
    wingPivotR.rotation.x = 0.12 + feather;
    wingPivotL.rotation.x = 0.12 - feather;
    if (wingPivot2L) { wingPivot2L.rotation.z = flap * 0.65; wingPivot2R.rotation.z = -flap * 0.65; }
    // Wrist fold — the outer membrane lags the root flap so the wing breaks at
    // the wrist (matches the in-game rig; needs the split outer panel to be felt).
    if (wingTipR) {
      const tipLag = Math.sin(phase + 0.95) * 0.34;
      wingTipR.rotation.z = tipLag;
      wingTipL.rotation.z = -Math.sin(phase + 1.18) * 0.34;
      wingTipR.rotation.x = -0.06 + feather;
      wingTipL.rotation.x = -0.06 - feather;
    }
    // Root-locked snake coil (x + y) so the tail stays attached and alive.
    const nT = tailSegs.length;
    for (let i = 0; i < nT; i++) {
      const lock = nT > 1 ? i / (nT - 1) : 0;
      const l2 = lock * lock;
      const tp = t * 3.6 - i * 0.6;
      tailSegs[i].position.x = Math.sin(tp) * 0.3 * l2;
      tailSegs[i].position.y = Math.cos(tp * 0.8) * 0.16 * l2;
      tailSegs[i].rotation.z = -Math.sin(tp) * 0.16 * l2;
    }
    head.rotation.y = Math.sin(t * 0.9) * 0.1;
    if (auraSprite) {
      auraSprite.material.opacity = def.fx.auraIdle > 0
        ? 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12
        : 0;
    }
  };
}
