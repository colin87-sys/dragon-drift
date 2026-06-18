import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { resolveRecipe, getTorsoBuilder, getWingsBuilder, getHeadBuilder, getTailBuilder } from './dragonRecipe.js';
import './dragonTorso.js'; // self-registers the 'arrow' / 'serpent' / 'avian' torsos
import './dragonWings.js'; // self-registers the 'membrane' / 'feather' / 'none' wings
import './dragonHead.js';  // self-registers the 'horned' / 'beaked' head builders
import './dragonTail.js';  // self-registers the 'clean' / 'legacy' tail builders
import './dragonCrystalSerpent.js'; // 'crystalSerpent' torso (continuous astral serpent)
import './dragonSideFins.js';       // 'sideFins' wings (lateral astral vanes)
import './dragonCometWake.js';      // 'cometWake' tail (streaming comet glow-trail)
import './dragonCelestialHead.js';  // 'celestialMask' head (regal faceplate)
import './dragonDraconicHead.js';   // 'draconic' head (modular house-style dragon head)
import './dragonUnifiedHull.js';    // 'unifiedHull' wings + 'unifiedHullTorso' (one continuous skinned hull)
import { shingle } from './dragonShingle.js'; // reusable overlapping scale/plate cards
import { applyFresnelRim } from './surface.js';
import { flapWing, formStrength, formSpeed } from './dragonWingFlap.js';
import { composeSurface, fresnelRimPatch, buildSurfacePatches } from './dragonSurfaceShader.js';
import { setActiveDetail, seg } from './modelDetail.js';

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

// Resolve ONE declarative shingle spec (from def.parts.shingle) into a built run.
// A spec is a flank-style band laid on the body sides:
//   { count, zRange:[z0,z1], len, wid, cup, tilt, yLift, inset, cardRows/Cols, edge, emissive }
// `count` may be a per-form array indexed by model.formLevel (0..3) so density
// ramps with ascension; it is then seg()-scaled so it tracks the device tier. The
// run material is dark (def.scales) with a faint apex-seam emissive; when `edge`
// is set it carries the Surge userData tags + is returned with flare:true so the
// orchestrator pushes it into spineMats (rim light + Surge flare, like the
// chevrons). Returns null when this form/torso has no run (byte-identical skip).
function buildShingleRun(spec, def, model, attach, giM) {
  if (!spec || !attach.halfWidthAt) return null;          // torso has no flank contract
  const lvl = Math.min(model.formLevel ?? 0, 3);
  const baseCount = Array.isArray(spec.count) ? (spec.count[lvl] ?? 0) : (spec.count ?? 0);
  if (baseCount <= 0) return null;                         // this form carries no scales
  const count = seg(baseCount);                            // detail-scaled density
  const [z0, z1] = spec.zRange ?? [-1.5, 1.1];
  const yLift = spec.yLift ?? 0.35;                        // 0 = body mid-line → 1 = keel top
  const inset = spec.inset ?? 0.92;                        // tuck just inside the silhouette
  const midY = attach.bodyMidY ?? 0.2;
  const edge = !!spec.edge;
  const seam = def.apexSeam ?? def.wingEmissive ?? def.eye;
  const baseEmis = (spec.emissive ?? 0.14) * (edge ? Math.min(giM, 1.3) : 1);
  const mat = new THREE.MeshStandardMaterial({
    color: def.scales, emissive: seam, emissiveIntensity: baseEmis,
    roughness: 0.42, metalness: 0.5, side: THREE.DoubleSide,
  });
  mat.userData.shingle = true;                            // marker (tests + future code)
  if (edge) { mat.userData.baseEmissive = seam; mat.userData.baseIntensity = baseEmis; }
  const built = shingle({
    count, rows: 2,                                        // row 0 = left flank, row 1 = right
    length: spec.len ?? 0.32, width: spec.wid ?? 0.2,
    cup: spec.cup ?? 0.3, tilt: spec.tilt ?? 0.4,
    cardRows: spec.cardRows ?? 1, cardCols: spec.cardCols ?? 1,
    material: mat,
    at: (t, row) => {
      const side = row === 0 ? -1 : 1;
      const z = z0 + (z1 - z0) * t;
      const y = midY + (attach.keelTopAt(z) - midY) * yLift;
      return { x: side * attach.halfWidthAt(z) * inset, y, z };
    },
    normalAt: (t, row) => new THREE.Vector3(row === 0 ? -0.96 : 0.96, 0.28, 0),
    tangentAt: () => new THREE.Vector3(0, 0, 1),           // length runs head→tail
  });
  return { mesh: built.mesh, material: mat, flare: edge };
}

// Build the full dragon mesh from a resolved def (post-ascendedDef).
export function buildDragonModel(def, opts = {}) {
  const model = def.model;
  // Geometry level-of-detail: an explicit opts.detail pins the segment multiplier
  // for THIS build (the tricount tool + any preview that wants a fixed level);
  // otherwise the build inherits the process-wide active level the live rig set
  // (createDragon → setActiveDetail). HIGH is byte-identical to the old geometry.
  if (opts.detail) setActiveDetail(opts.detail);
  const group = new THREE.Group();
  // Emissive multiplier (Radiant = 1.0; the apex can exceed 1) shared by every
  // glowing accent so a form's whole light signature ramps from one constant.
  // giM clamps the per-element emissive so high gi reads as MORE cyan glow
  // (chevrons/edges/particles), not a white-blown bloom under the ACES tone-map.
  const gi = model.glowIntensity ?? 1;
  const giM = Math.min(gi, 1.3);

  // bodyMat / eyeMat are `let` because a torso module may override them (the
  // avian/firebird torso returns its own body + eye materials so the head shares
  // them and the rig pulses body + head together).
  let bodyMat = new THREE.MeshStandardMaterial({
    color: def.body, roughness: 0.38, metalness: 0.12,
    emissive: def.body, emissiveIntensity: 0.12,
  });
  // Surface detail: an on-brand fresnel rim defines the body's contour from the
  // rear camera so it stops reading as a flat dark mass. Set before the torso
  // clones bodyMat, so the DoubleSide torso + every body sphere/cone inherit it.
  // A dragon's blueprint may opt into extra composable patches (cellular scales,
  // iridescence, subsurface) via `parts.surface.shader` — stacked with the rim
  // through one program. No blueprint = just the rim (byte-identical to before).
  const surfaceShaders = def.parts && def.parts.surface && def.parts.surface.shader;
  if (surfaceShaders && surfaceShaders.length) {
    composeSurface(bodyMat, [fresnelRimPatch(def.apexSeam || def.eye), ...buildSurfacePatches(surfaceShaders, def)]);
  } else {
    applyFresnelRim(bodyMat, def.apexSeam || def.eye);
  }
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
  let eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: def.eye, emissiveIntensity: 2.2,
  });

  // --- Body foundation: composable torso ---------------------------------
  // The body plan (torso loft + wing-root fairings + neck chain) comes from the
  // recipe's TORSO module (dragonTorso.js). That module also publishes the
  // ATTACH contract — where the wings, head and tail mount, and the keel crest
  // for the spine — so a different skeleton (e.g. the long 'serpent' profile)
  // drops in without changing any of the wing / head / tail / spine code below.
  const recipe = resolveRecipe(def);
  const torsoResult = getTorsoBuilder(recipe.torso)(def, model, bodyMat);
  const { group: torsoGroup, attach } = torsoResult;
  group.add(torsoGroup);
  // A torso may override the body/eye materials (the firebird body plan returns
  // its own) and provide its own heart-core glow — adopt them.
  if (torsoResult.mats) {
    if (torsoResult.mats.bodyMat) bodyMat = torsoResult.mats.bodyMat;
    if (torsoResult.mats.eyeMat) eyeMat = torsoResult.mats.eyeMat;
  }
  const torsoCoreGlow = torsoResult.coreGlow ?? null;
  // A segmented torso (the centipede-wyrm) returns its plate Groups so the rig
  // sways them as a lead-first travelling wave (see dragon.js / makePreviewTick).
  const bodySegs = torsoResult.bodySegs ?? null;
  // Where the rider sits — the torso publishes it (a believable seat near the
  // front third); default = the back-of-shoulders spot the dragons have always
  // used. The rig (dragon.js) places the rider here.
  const riderSocket = model.riderSocket ?? attach.riderSocket ?? { x: 0, y: 1.12, z: -0.6 };

  // Accent materials (spine plates, crest, glow seams, tail plates) that flare
  // toward white-gold during Dragon Surge — collected for the rig to drive.
  const spineMats = [];
  if (torsoResult.spineMats) for (const m of torsoResult.spineMats) spineMats.push(m);

  // Glowing dorsal spine — runs along the crest of the keel so it reads as a
  // bright stripe from directly behind. Ramps with the forms (spineGlow 0→1).
  // Dragons that author a dorsalGlowCount get the CHEVRON line below instead.
  // Skipped for the avian body plan (a firebird has a feather crown, not a keel)
  // and for any SEGMENTED torso (a chain of separate plates has no continuous
  // crest — it carries its own per-plate vanes + glowing gaps instead).
  if (recipe.torso !== 'avian' && !attach.segmentAnchors && model.spineGlow > 0 && !model.dorsalGlowCount) {
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
      const node = new THREE.Mesh(new THREE.ConeGeometry(0.04 + g * 0.045, h, seg(4)), spineMat);
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
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.085, h, seg(4)), crestMat);
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
      new THREE.ConeGeometry(0.09 + Math.max(0, 5 - Math.abs(i - 4)) * 0.016, 0.34, seg(5)), scalesMat);
    ridge.rotation.x = -Math.PI / 2;
    ridge.position.set(0, attach.keelTopAt(-2.55 + i * ridgeStep) + 0.06, -2.55 + i * ridgeStep);
    group.add(ridge);
  }

  // Dorsal sail fin
  if (model.dorsal) {
    for (let i = 0; i < 5; i++) {
      const h = 0.3 + Math.sin((i / 4) * Math.PI) * 0.28;
      const df = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, seg(4)), scalesMat);
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
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, seg(4)), spineMat);
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
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.9, seg(4)), bladeMat);
      blade.position.set(sx, 0.35, zp);
      blade.rotation.z = ang;
      blade.rotation.x = -0.15;
      group.add(blade);
    }
  }

  // Shingle scale/plate relief (opt-in via def.parts.shingle) — overlapping cupped
  // cards merged to ONE mesh per run (one draw call). Placement-agnostic: a dragon
  // declares one or more flank-style runs; dragons that don't are byte-identical
  // (resolveRecipe ignores parts.shingle). An edge run joins spineMats so it picks
  // up the rim light + flares on Surge, like the chevrons/seams.
  const shingleSpec = def.parts && def.parts.shingle;
  if (shingleSpec) {
    for (const spec of [].concat(shingleSpec)) {
      const run = buildShingleRun(spec, def, model, attach, giM);
      if (run) {
        group.add(run.mesh);
        if (run.flare) spineMats.push(run.material);
      }
    }
  }

  // Head — from the recipe's HEAD module (horned / beaked). Sits at the torso's
  // published head anchor (varies per body plan); the neck chain bridging the
  // torso's neck cap to the head is built inside the torso module.
  const headResult = getHeadBuilder(recipe.head)(def, model, { bodyMat, hornMat, bellyMat, scalesMat, eyeMat });
  const head = headResult.group;
  for (const m of headResult.spineMats) spineMats.push(m);
  const hb = attach.headBase;
  head.position.set(hb.x, hb.y, hb.z);
  group.add(head);

  // AIM MARKER — a small always-on-top cyan-white crystal + halo at the head's
  // nose: the ring-alignment point. depthTest off + a high renderOrder so the
  // body can NEVER hide it, so you always know where to thread a perfect (the
  // playability fix for long/tall creatures whose mass would occlude the head).
  // Rides the head group so it tracks the head sway. ~10 tris, every dragon.
  //
  // SHOP-PREVIEW EXCEPTION: the marker is a gameplay HUD aid for the rear chase
  // camera. In the inspect showcase (which the player rotates to admire the face)
  // its always-on-top crystal becomes an ugly glowing nub stuck on the snout — so
  // the preview build omits it. The shop shows the dragon, not the targeting aid.
  if (!opts.preview) {
    const aimCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.MeshBasicMaterial({ color: 0xe2f6ff, depthTest: false, depthWrite: false, transparent: true }));
    aimCore.renderOrder = 999;
    aimCore.position.set(0, 0.12, -1.18);
    head.add(aimCore);
    const aimHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('190,235,255'), transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    }));
    aimHalo.scale.setScalar(0.62);
    aimHalo.position.copy(aimCore.position);
    aimHalo.renderOrder = 998;
    head.add(aimHalo);
  }

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

  // --- Tail — from the recipe's TAIL module (dragonTail.js). The builder
  // positions the tail at the torso's published anchor and returns the coil
  // chain (segs), the apex deploy fins, and the Surge-flaring accent mats.
  const tailResult = getTailBuilder(recipe.tail)(def, model, { bodyMat, scalesMat }, attach.tailAnchor);
  group.add(tailResult.group);
  if (tailResult.accentMats) for (const m of tailResult.accentMats) spineMats.push(m);
  const tailFins = tailResult.tailFins;
  const tailSegs = tailResult.segs;
  // An orbit-style tail (the wyrm's shard relics) returns orbiters the rig spins.
  const tailOrbiters = tailResult.orbiters ?? null;

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
    wingRigL, wingRigR,
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
  // (The firebird's avian torso supplies its own heart-fire core — adopt it.)
  let coreGlow = torsoCoreGlow;
  if (!coreGlow && def.coreGlow) {
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

  // Pass 2 — bind the torso's shoulder skin to the wing shoulder bones (they live in
  // the wing mounts, a different subtree, so this is a WORLD-rest cross-hierarchy bind
  // done once both exist). A static root bone holds every non-shoulder vertex in place;
  // attached bind mode self-corrects for the later model placement. Obsidian-only.
  if (attach.shoulderSkin && wingRigL && wingRigR) {
    const rootBone = new THREE.Bone();
    torsoGroup.add(rootBone);
    group.updateMatrixWorld(true);
    attach.shoulderSkin.bind(
      new THREE.Skeleton([rootBone, wingRigL.shoulder, wingRigR.shoulder]),
      attach.shoulderSkin.matrixWorld);
  }

  // Shop preview: a clean flying showcase (no turntable / no pedestal). Downscale
  // so the widest apex wings fit the small card, and float a soft rarity-tinted
  // corona behind the dragon instead of a spinning rune disc.
  if (opts.preview) {
    // No corona/aura sprite behind the dragon — the showcase renders a full biome
    // backdrop, so a central glow halo only muddies it (and read as an ugly white
    // aura). The dragon's own plasma (core glow, eyes, edges) + bloom carry the light.
    const wrapper = new THREE.Group();
    wrapper.add(group);

    return {
      group: wrapper,
      parts: { head, tailSegs, tailFins, bodySegs, tailOrbiters, riderSocket, wingPivotL, wingPivotR, wingTipL, wingTipR, wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR, wingRigL, wingRigR, coreGlow },
      materials: { bodyMat, wingMat, eyeMat, spineMats },
      auraSprite,
    };
  }

  return {
    group,
    parts: {
      head, tailSegs, tailFins, bodySegs, tailOrbiters, riderSocket,
      wingPivotL, wingPivotR,
      wingTipL, wingTipR,
      wingPivot2L, wingPivot2R,
      tipMarkerL, tipMarkerR,
      wingRigL, wingRigR,
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
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R, wingTipL, wingTipR, wingRigL, wingRigR } = parts;
  const { bodySegs, tailOrbiters } = parts;
  const flapBias = def.model.flapBias || 1;
  const flapAmp = def.model.flapAmp ?? 1;
  const segLag = (def.model.segmentLag ?? 0.14) * 7;
  const segSway = def.model.segmentSway ?? 0.16;
  const segBob = def.model.segmentBob ?? 0.08;
  return (t) => {
    // Float + gentle bank/pitch — the in-flight read, no spin.
    group.position.y = 0.15 + Math.sin(t * 1.5) * 0.09;
    group.rotation.y = 0;
    group.rotation.z = Math.sin(t * 0.7) * 0.13;        // lazy bank left/right
    group.rotation.x = -0.05 + Math.sin(t * 1.5 + 1) * 0.03;
    // Wingbeat — same shape as the live rig (root flap + feather pitch).
    const phase = t * 6.2 * flapBias * formSpeed(def.model);
    if (wingRigL) {
      // Skinned wings: the shared animator drives the shoulder→elbow→wrist cascade
      // (dt=1 snaps to target, matching the preview's direct-set style).
      const st = { phase, flapAmp: 0.52 * flapAmp, turnBias: 0, climbBias: 0, rollFold: 0, feather: Math.sin(phase + Math.PI * 0.55), strength: formStrength(def.model) };
      flapWing(wingRigL, st, 1);
      flapWing(wingRigR, st, 1);
      if (wingPivot2L) { const f = Math.sin(phase) * 0.52 * flapAmp + 0.12; wingPivot2L.rotation.z = f * 0.65; wingPivot2R.rotation.z = -f * 0.65; }
    } else {
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
    // Segmented-wyrm body: a lead-first travelling wave (each plate trails the
    // one ahead with a phase lag) + a gentle vertical bob — a zero-gravity drift.
    if (bodySegs) {
      for (let i = 0; i < bodySegs.length; i++) {
        const ph = t * 2.0 - i * segLag;
        bodySegs[i].position.x = Math.sin(ph) * segSway;
        bodySegs[i].position.y = (bodySegs[i].userData.baseY ?? 0.5) + Math.cos(ph * 0.85) * segBob;
        bodySegs[i].rotation.z = -Math.sin(ph) * 0.18;
        bodySegs[i].rotation.y = Math.sin(ph) * 0.1;
      }
    }
    // Orbiting tail shards / ring fragments.
    if (tailOrbiters) {
      for (const o of tailOrbiters) {
        o.ang += 0.016 * o.speed * 60;
        o.mesh.position.x = Math.cos(o.ang) * o.radius;
        o.mesh.position.z = Math.sin(o.ang) * o.radius * o.flat;
        o.mesh.position.y = o.baseY + Math.sin(t * 1.6 + o.ang) * 0.05;
        if (o.spin) o.mesh.rotation.y = t * 1.2;
      }
    }
    if (auraSprite) {
      auraSprite.material.opacity = def.fx.auraIdle > 0
        ? 0.3 + def.fx.auraIdle + Math.sin(t * 2.6) * 0.12
        : 0;
    }
    // Core plasma breathes — a slow charge pulse so the shop dragon feels alive
    // and powered (the preview now renders layer 1, so this glow is finally seen).
    if (parts.coreGlow) {
      const base = parts.coreGlow.userData.base ?? 0.3;
      parts.coreGlow.material.opacity = base * (0.82 + Math.sin(t * 2.1) * 0.18);
    }
  };
}
