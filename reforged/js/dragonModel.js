import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { resolveRecipe, getTorsoBuilder, getWingsBuilder, getHeadBuilder, getTailBuilder } from './dragonRecipe.js';
import './dragonTorso.js'; // self-registers the 'arrow' / 'serpent' / 'avian' torsos
import './dragonWings.js'; // self-registers the 'membrane' / 'feather' / 'none' wings
import './dragonHead.js';  // self-registers the 'horned' / 'beaked' head builders
import './dragonTail.js';  // self-registers the 'clean' / 'legacy' tail builders
import './dragonCrystalSerpent.js'; // 'crystalSerpent' torso (continuous astral serpent)
import './dragonKoiSerpent.js';     // 'koiSerpent' torso (undulating jade river-serpent; body IS the tail)
import './dragonSideFins.js';       // 'sideFins' wings (lateral astral vanes)
import './dragonCometWake.js';      // 'cometWake' tail (streaming comet glow-trail)
import './dragonCelestialHead.js';  // 'celestialMask' head (regal faceplate)
import './dragonDraconicHead.js';   // 'draconic' head (modular house-style dragon head)
import './dragonUnifiedHull.js';    // 'unifiedHull' wings + 'unifiedHullTorso' (one continuous skinned hull)
import './dragonOrganism.js';       // 'organismWings' + 'organismTorso' (clean-sheet one-skin creature)
import './dragonNightFury.js';      // 'nightFuryWings' + 'nightFuryTorso' (smooth-loft Night Fury) + 'none' head/tail
import './dragonHull.js';           // 'hullWings' + 'hullTorso' (data-driven Night-Fury kernel for the new starters)
import './dragonFaceted.js';        // 'faceted' torso + 'hexMembrane' wings + 'bullCrown' head + 'bladeJet' tail + aero layers (hard-edge/automotive family)
import './dragonSeraph.js';         // Pearl Seraph: feather-scale wings / crown-halo head / comet tail (celestial multi-module family)
import './dragonSeraphBody.js';     // Pearl Seraph: pearl hull torso + crowned head + real-geometry crown-halo
import './dragonSovereign.js';      // Solar Sovereign (Eclipse Dragon-King): regnalKeelTorso + lanceVaultWings + eclipseCrownHead + scepterWhipTail
import './dragonPhoenixMolten.js';  // Molten Phoenix (living magma): moltenPhoenixTorso + pyreFanWings + calderaCrestHead + emberWakeTail (caldera heat-tier system)
import './dragonPhoenixReforged.js'; // Phoenix Ascendant REFORGED ("Sunhawk"): sunhawkKeelTorso + sunfeatherWings + sunpennantTail + sunhawkCrownHead (white-gold solar-ivory glow-up; coexists with `phoenix`)
import { shingle } from './dragonShingle.js'; // reusable overlapping scale/plate cards
import { resolveSurfaceLayers, getSurfaceLayer } from './dragonSurfaceLayers.js'; // declarative dorsal/flank decoration
import { validateCreatureBlueprint } from './validateCreatureBlueprint.js';
import { applyFresnelRim } from './surface.js';
import { flapWing, formStrength, formSpeed } from './dragonWingFlap.js';
import { solveWing } from './wingFlapSolver.js';
import { composeSurface, fresnelRimPatch, buildSurfacePatches } from './dragonSurfaceShader.js';
import { setActiveDetail, seg } from './modelDetail.js';
import { buildGlbDragon } from './dragonGlb.js'; // asset-backed path (def.meshUrl)

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
  // Dev guard (opt-in via globalThis.DRAGON_DEBUG_BLUEPRINT) — warn on a malformed
  // blueprint at build time. Off by default → zero cost in the shipped game; the
  // hard, blocking failure lives in tests/blueprint.mjs.
  if (globalThis.DRAGON_DEBUG_BLUEPRINT) {
    const v = validateCreatureBlueprint(def);
    if (!v.ok) console.warn(`[blueprint] ${def.name || 'creature'}:\n  ${v.errors.join('\n  ')}`);
  }
  // Geometry level-of-detail: an explicit opts.detail pins the segment multiplier
  // for THIS build (the tricount tool + any preview that wants a fixed level);
  // otherwise the build inherits the process-wide active level the live rig set
  // (createDragon → setActiveDetail). HIGH is byte-identical to the old geometry.
  if (opts.detail) setActiveDetail(opts.detail);
  // Asset-backed coexist path: an AI-generated GLB dragon (def.meshUrl) loads a
  // mesh and returns the SAME { group, parts, materials, auraSprite } contract,
  // so the rest of the engine is untouched. Procedural roster is unaffected.
  if (def.meshUrl) return buildGlbDragon(def, opts);
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
  // Per-dragon body FINISH override (additive + nullable — a creature whose hide
  // should read as MATTE ORGANIC skin rather than the default semi-gloss opts in;
  // default = unchanged, so the roster is byte-identical). Flows to the hull
  // (attach.bodyMatDouble clone) AND the neck. Obsidian2 uses it to kill the
  // "smooth metal" read so the v2 scale relief reads as living hide.
  if (def.bodyRoughness != null) bodyMat.roughness = def.bodyRoughness;
  if (def.bodyMetalness != null) bodyMat.metalness = def.bodyMetalness;
  // envMapIntensity (default 1) — a dark SMOOTH body reflects the bright sky and
  // reads as polished metal/wet even when matte; drop it low for a stealth hide.
  if (def.bodyEnvIntensity != null) bodyMat.envMapIntensity = def.bodyEnvIntensity;
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
    // scale emissive is def-overridable (default = the shared cyan, byte-identical): a
    // warm/cool dragon (ember, jade) tints it to its OWN accent so shared users of this
    // material (scutes, whiskers, ridges) never glow off-palette steel-blue (L164).
    color: def.scales, emissive: def.scaleEmissive ?? 0x0b79aa, emissiveIntensity: def.scaleEmissiveI ?? 0.42,
    roughness: 0.28, metalness: 0.22,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    // a faint def emissive keeps a PALE belly/jaw from desaturating to slate-blue-grey
    // in shadow under ACES (jade's mint jaw, gate r1 dir 8); default 0 → byte-identical.
    color: def.belly, roughness: 0.5, emissive: def.bellyEmissive ?? 0x000000, emissiveIntensity: def.bellyEmissiveI ?? 0,
  });
  let eyeMat = new THREE.MeshStandardMaterial({
    color: 0x223344, emissive: def.eye, emissiveIntensity: def.eyeEmissiveI ?? 2.2,
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
  // Assert-metadata contract (§6.4): a torso may publish a world-space spine
  // polyline (line-of-action asserts). Additive + nullable — other torsos omit it.
  const spinePoints = torsoResult.spinePoints ?? null;
  // A segmented torso (the centipede-wyrm) returns its plate Groups so the rig
  // sways them as a lead-first travelling wave (see dragon.js / makePreviewTick).
  const bodySegs = torsoResult.bodySegs ?? null;
  // A shader-undulated torso (koiSerpent) publishes a travelling-wave uniform the rig
  // advances each frame. Additive + nullable (other torsos omit it).
  const bodyWave = torsoResult.bodyWave ?? null;
  // Where the rider sits — the torso publishes it (a believable seat near the
  // front third); default = the back-of-shoulders spot the dragons have always
  // used. The rig (dragon.js) places the rider here.
  const riderSocket = model.riderSocket ?? attach.riderSocket ?? { x: 0, y: 1.12, z: -0.6 };

  // Accent materials (spine plates, crest, glow seams, tail plates) that flare
  // toward white-gold during Dragon Surge — collected for the rig to drive.
  const spineMats = [];
  if (torsoResult.spineMats) for (const m of torsoResult.spineMats) spineMats.push(m);

  // Dorsal / flank DECORATION layers — spine glow line, cyan chevrons, back
  // crest, scale ridge, dorsal sail, back spines, armour plates, glow seams,
  // blade fins. These were nine inline `if (model.flag)` blocks; they now live as
  // registered builders in dragonSurfaceLayers.js. resolveSurfaceLayers returns
  // them in the SAME order + under the SAME conditions (inferred from the legacy
  // flags), so the roster is byte-identical; a creature may instead declare
  // `parts.surfaceLayers` explicitly. Flare materials join spineMats (rim light +
  // Surge flare), exactly as the inline blocks pushed them.
  const layerCtx = { def, model, attach, recipe, gi, giM, scalesMat };
  for (const { type } of resolveSurfaceLayers(def, recipe, attach)) {
    const build = getSurfaceLayer(type);
    if (!build) continue;
    const { meshes, flareMats } = build(layerCtx);
    for (const m of meshes) group.add(m);
    if (flareMats) for (const fm of flareMats) spineMats.push(fm);
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
  // Motif socket (§6.3): a builder may publish its motif anchor (position invariance
  // + bloom-volume asserts). Additive + nullable. The HEAD publishes it when the
  // motif is a head feature (azure's brow crest); ember's forge collar lives at the
  // wing-root yoke, so the WINGS builder publishes it instead — adopted below.
  let motifAnchor = headResult.motifAnchor ?? null;
  const headLength = headResult.headLength ?? null;   // skull length (§7 head:body assert)
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
    // A small, DIM aiming pip — just enough to read the dragon's centre against the
    // rings, deliberately understated. (It used to be a near-white core + a big
    // additive glow halo, which the always-on-top draw turned into a distracting
    // white "glare" smeared over the front of the body from the chase cam.)
    const aimCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.07, 0),
      new THREE.MeshBasicMaterial({ color: 0x8fc4dd, opacity: 0.55, depthTest: false, depthWrite: false, transparent: true }));
    aimCore.renderOrder = 999;
    aimCore.position.set(0, 0.12, -1.18);
    head.add(aimCore);
  }

  // Pearl's luminous head aura: a soft opalescent glow (a body-level sprite, NOT
  // part of the head group), elegant and pristine — never a hard torus ring.
  // The seraphCrownHead builds its OWN real-geometry crown-halo, so skip the sprite there.
  if (model.halo && recipe.head !== 'seraphCrownHead') {
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
  let tailFins = tailResult.tailFins;
  let tailSegs = tailResult.segs;
  // An orbit-style tail (the wyrm's shard relics) returns orbiters the rig spins.
  const tailOrbiters = tailResult.orbiters ?? null;
  const pyreTrain = tailResult.pyreTrain ?? null;

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
    wingRigL, wingRigR, wingMidL, wingMidR, wingYokeL, wingYokeR,
    wingBladePivotsL, wingBladePivotsR, wingLobePivotsL, wingLobePivotsR, wingElements,
  } = wingsResult.parts;
  // Night-Fury grows its bat-tail fins + tail-bone whip chain INSIDE the wings
  // builder (the tail is part of the continuous hull, not a bolted tail module), so
  // adopt those when present — additive + nullable (other wings builders return
  // neither → the roster is byte-identical).
  if (wingsResult.parts.tailFins) tailFins = wingsResult.parts.tailFins;
  if (wingsResult.parts.tailSegs) tailSegs = wingsResult.parts.tailSegs;
  // Yoke-motif socket: a wings builder may own the motif anchor (ember's forge
  // collar sits between the wing roots). Adopt it only if the head published none.
  if (!motifAnchor && wingsResult.parts.motifAnchor) motifAnchor = wingsResult.parts.motifAnchor;
  const spineSegs = wingsResult.parts.spineSegs || null;   // night-fury body-spine whip (nullable)

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
      parts: { head, tailSegs, tailFins, spineSegs, bodySegs, bodyWave, tailOrbiters, pyreTrain, riderSocket, wingYokeL, wingYokeR, wingPivotL, wingPivotR, wingMidL, wingMidR, wingTipL, wingTipR, wingPivot2L, wingPivot2R, tipMarkerL, tipMarkerR, wingRigL, wingRigR, coreGlow, wingBladePivotsL, wingBladePivotsR, wingLobePivotsL, wingLobePivotsR, wingElements, spinePoints, motifAnchor, headLength },
      materials: { bodyMat, wingMat, eyeMat, spineMats },
      auraSprite,
    };
  }

  return {
    group,
    parts: {
      head, tailSegs, tailFins, spineSegs, bodySegs, bodyWave, tailOrbiters, pyreTrain, riderSocket,
      wingYokeL, wingYokeR,
      wingPivotL, wingPivotR,
      wingMidL, wingMidR,
      wingTipL, wingTipR,
      wingPivot2L, wingPivot2R,
      tipMarkerL, tipMarkerR,
      wingRigL, wingRigR,
      coreGlow,
      wingBladePivotsL, wingBladePivotsR, wingLobePivotsL, wingLobePivotsR, wingElements, spinePoints, motifAnchor, headLength,
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
  const { head, tailSegs, wingPivotL, wingPivotR, wingPivot2L, wingPivot2R, wingTipL, wingTipR, wingRigL, wingRigR, wingMidL, wingMidR, wingYokeL, wingYokeR } = parts;
  const { bodySegs, tailOrbiters, wingBladePivotsL, wingBladePivotsR } = parts;
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
    const phase = t * 6.2 * flapBias * formSpeed(def.model) * (def.model.flapFreqScale ?? 1);
    if (wingRigL) {
      // Skinned wings: the shared animator drives the shoulder→elbow→wrist cascade
      // (dt=1 snaps to target, matching the preview's direct-set style).
      const st = { phase, flapAmp: 0.52 * flapAmp, turnBias: 0, climbBias: 0, rollFold: 0, feather: Math.sin(phase + Math.PI * 0.55), strength: formStrength(def.model) };
      flapWing(wingRigL, st, 1);
      flapWing(wingRigR, st, 1);
      if (wingPivot2L) { const f = Math.sin(phase) * 0.52 * flapAmp + 0.12; wingPivot2L.rotation.z = f * 0.65; wingPivot2R.rotation.z = -f * 0.65; }
    } else if (def.model.flap && wingYokeL) {
      // Mk II YOKE wing (preview): the shared 5-phase solver drives yoke→inner→mid→tip into a
      // HELD high-V apex (matches the gameplay rig so the showcase reads true). No banking here.
      const s = solveWing(phase, def.model.flap);
      const feather = Math.sin(phase + Math.PI * 0.55) * 0.10;
      const poseY = (yk, pv, md, tp) => {
        yk.rotation.set(s.yoke.twist, -0.14 - s.yoke.sweep, s.yoke.elev);
        pv.rotation.set(0.10 + feather, -0.12, s.inner.curl);
        if (md) md.rotation.set(0, -s.mid.sweep, s.mid.curl);
        if (tp) tp.rotation.set(-0.04, 0.07 - s.tip.sweep, s.tip.curl);
      };
      poseY(wingYokeR, wingPivotR, wingMidR, wingTipR);
      poseY(wingYokeL, wingPivotL, wingMidL, wingTipL);
    } else if (def.model.wingParts) {
      // Mk II per-FORM wing (preview): glide-hold waveform + shared-phase root→mid→tip
      // lag, L/R sign-mirror, 1/2/3 segments — matches the in-game rig so the showcase
      // and thumbnails read true per form.
      const m = def.model, gp = m.glidePow ?? 1;
      const shape = (ph) => { const s = Math.sin(ph); return Math.sign(s) * Math.pow(Math.abs(s), gp); };
      const rootA = m.rootAmp ?? 0.5, midA = m.midAmp ?? 0, tipA = m.tipAmp ?? 0;
      const mLag = m.midLag ?? 0, tLag = m.tipLag ?? 0;
      const feather = Math.sin(phase + Math.PI * 0.55) * 0.16;
      const rootF = shape(phase) * rootA;
      const upMid = Math.max(0, Math.sin(phase - mLag));
      const upTip = Math.max(0, Math.sin(phase - tLag));
      const tipSweep = 0.07 + 0.16 * upTip;   // outer-tip backward sweep by stroke
      // The LEFT wing is a scale.x=-1 mirror clone, so we apply the SAME logical pose to
      // both rigs (no banking in the preview → identical → perfectly symmetric mirror).
      const poseW = (pv, md, tp) => {
        pv.rotation.set(0.12 + feather, -0.18, -rootF - 0.1);
        if (md) md.rotation.set(Math.cos(phase - mLag) * 0.10, upMid * 0.08, -shape(phase - mLag) * midA);
        if (tp) { const tipF = md ? shape(phase - tLag) * tipA : (shape(phase - mLag) * midA + shape(phase - tLag) * tipA); tp.rotation.set(-0.05 + Math.cos(phase - tLag) * 0.18, tipSweep, -tipF); }
      };
      poseW(wingPivotR, wingMidR, wingTipR);
      poseW(wingPivotL, wingMidL, wingTipL);
    } else {
      const flap = Math.sin(phase) * 0.52 * flapAmp + 0.12;
      const feather = Math.sin(phase + Math.PI * 0.55) * 0.16;
      wingPivotR.rotation.z = -flap;
      wingPivotL.rotation.z = flap;
      wingPivotR.rotation.x = 0.12 + feather;
      wingPivotL.rotation.x = 0.12 - feather;
      if (wingPivot2L) { wingPivot2L.rotation.z = flap * 0.65; wingPivot2R.rotation.z = -flap * 0.65; }
      if (wingTipR) {
        // Wrist fold — the outer membrane lags the root flap so the wing breaks at
        // the wrist (matches the in-game rig; needs the split outer panel to be felt).
        const tipLag = Math.sin(phase + 0.95) * 0.34;
        wingTipR.rotation.z = tipLag;
        wingTipL.rotation.z = -Math.sin(phase + 1.18) * 0.34;
        wingTipR.rotation.x = -0.06 + feather;
        wingTipL.rotation.x = -0.06 - feather;
      }
    }
    // Per-blade LAG (blade-feather comb): each feather trails the wingbeat a beat
    // behind (ASHTALON covert pattern) — a subtle living ripple across the comb, the
    // lag deepening outward. Additive + nullable (only bladeFeather wings publish it).
    for (const arr of [wingBladePivotsR, wingBladePivotsL]) {
      if (!arr) continue;
      for (const b of arr) {
        const fr = arr.length > 1 ? b.idx / (arr.length - 1) : 0;
        const sw = Math.sin(phase - 0.5 - fr * 0.9) * (0.05 + 0.09 * fr);
        b.pivot.rotation.z = b.side * (0.02 + 0.10 * fr) + sw;
      }
    }
    // Root-locked snake coil (x + y) so the tail stays attached and alive. A SKINNED
    // bone-chain tail (Night-Fury whip) must be driven by ROTATION only (position would
    // tear the chain), so detect bones and sway them in place.
    const nT = tailSegs.length;
    const boneTail = nT > 0 && tailSegs[0].isBone;
    for (let i = 0; i < nT; i++) {
      const lock = nT > 1 ? i / (nT - 1) : 0;
      const l2 = lock * lock;
      const tp = t * 3.6 - i * 0.6;
      if (boneTail) {
        // VERTICAL undulation (rotation.x), matching the in-flight body-whip read.
        tailSegs[i].rotation.x = Math.sin(tp) * 0.16 * ((i + 1) / nT);
      } else {
        tailSegs[i].position.x = Math.sin(tp) * 0.3 * l2;
        tailSegs[i].position.y = Math.cos(tp * 0.8) * 0.16 * l2;
        tailSegs[i].rotation.z = -Math.sin(tp) * 0.16 * l2;
      }
    }
    // Stabilizer-flap idle (gated by flapFlutter → ONLY the SVJ spoiler flaps; every
    // other dragon's tailFins are untouched in the preview): pitch the flaps up/down
    // so the shop pose shows the control surfaces moving like the in-game rig.
    const finsP = result.parts.tailFins;
    if (finsP && finsP.length) for (const f of finsP) {
      const fl = f.userData.flapFlutter || 0;
      if (!fl) continue;
      f.rotation.x = (f.userData.restRotX ?? 0) + Math.sin(t * 3.2 + (f.userData.phase || 0)) * fl;
      f.rotation.z = f.userData.restRotZ ?? 0;
    }
    // Night-Fury body-spine whip: a gentle VERTICAL idle undulation (rotation.x) so the
    // shop pose breathes the same way it flies.
    const spine = result.parts.spineSegs;
    if (spine && spine.length) {
      for (const b of spine) {
        const w = b.userData.whip || { gain: 0, phase: 0 };
        b.rotation.x = w.gain * Math.sin(t * 1.6 + w.phase);
      }
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
