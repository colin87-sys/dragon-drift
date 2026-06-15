import * as THREE from 'three';
import { registerTail } from './dragonRecipe.js';
import { makeGlowTexture } from './util.js';

// COMET WAKE — the wyrm's body tapers into a streaming comet wisp: the last few
// crystal shards shrink away into a long additive glow-trail that streams BACK and
// slightly DOWN, below the sight-line (§0.5 PLAYABILITY-FIRST). No orbiting parts,
// no stinger — just a luminous tail of light, like a comet. `tailLength` +
// `cometWisps` grow it per form.
//
// It deliberately does NOT return coil `segs`: the rig yanks those onto the
// centreline (and would lift the wake up into the lane). The wake is a
// self-contained low/back wisp instead. The crystal SHARDS are real meshes kept
// compact + shallow so they barely touch the silhouette; the long down-and-back
// drama is carried by additive SPRITES (not counted against readability).
// `accentMats` lets the shards flare cool on Dragon Surge.

function buildCometWake(def, model, mats, anchor) {
  const group = new THREE.Group();
  group.position.set(0, anchor.y, anchor.z);   // root at the (low) rear of the chain
  const accentMats = [];

  const cSeam = def.apexSeam ?? def.wingEmissive;
  const cCore = def.coreGlow ?? def.wingEmissive;
  const F = model.formLevel ?? 0;
  const giM = Math.min(model.glowIntensity ?? 1, 1.3);
  const len = model.tailLength ?? 1;
  const bodyScale = model.bodyScale ?? 1;

  const dz = 0.95 * len;       // backward stride per step (the wake streams +z)
  const dy = -0.18 * len;      // descent per step (it sinks below the sight-line)
  const wisps = Math.max(2, model.cometWisps ?? 3);

  // The wake is built ENTIRELY from additive sprites — no counted mesh reaches
  // back toward the chase camera (which sits just behind the wyrm), so the comet
  // can stream long + low without ever looming into the silhouette metric. The
  // body's own rear crystal plates carry the solid-to-light transition.

  // The COMET GLOW — a chain of additive sprites streaming back + DOWN, softening
  // and fading as they go (the long visible wisp). Sprites aren't counted against
  // the silhouette, so the wake can reach far + low without crowding the frame.
  const coreRgb = `${(cCore >> 16) & 255},${(cCore >> 8) & 255},${cCore & 255}`;
  const seamRgb = `${(cSeam >> 16) & 255},${(cSeam >> 8) & 255},${cSeam & 255}`;
  const glowTex = makeGlowTexture(coreRgb);
  const seamTex = makeGlowTexture(seamRgb);
  const trailN = wisps + 4;
  for (let i = 0; i < trailN; i++) {
    const t = i / (trailN - 1);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: i % 3 === 0 ? seamTex : glowTex,
      transparent: true, opacity: (0.5 + F * 0.08) * (1 - t * 0.82),
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const sc = (0.95 - t * 0.55) * bodyScale * (0.9 + len * 0.4);
    spr.scale.setScalar(sc * 1.9);
    spr.position.set(0, dy * (i + 1), dz * (i + 1));
    spr.layers.set(1);
    group.add(spr);
  }

  // A bright head-of-wake bloom where the body becomes light.
  const headGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.5 + F * 0.1,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  headGlow.scale.setScalar(1.0 * bodyScale * (0.9 + len * 0.3));
  headGlow.layers.set(1);
  group.add(headGlow);

  // Lateral SPARK DEBRIS — faceted crystal shards thrown off to the lower-left and
  // lower-right of the wake (§0.5: decorative FX offset to the SIDES, never into
  // the central sight-line). These are counted geometry, but sit well outside the
  // central column + low + behind, so they enrich the SSSR finish — a shattering
  // comet of starstuff — without ever touching the silhouette metric. Grows per form.
  const shardMat = new THREE.MeshStandardMaterial({
    color: def.body, emissive: cCore, emissiveIntensity: (0.8 + F * 0.5) * giM,
    roughness: 0.28, metalness: 0.55, flatShading: true,
  });
  shardMat.userData.baseEmissive = cCore;
  shardMat.userData.baseIntensity = (0.8 + F * 0.5) * giM;
  accentMats.push(shardMat);
  const debrisN = wisps + 2;
  for (let i = 0; i < debrisN; i++) {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2);
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(1, 1), shardMat);
    const s = (0.18 - row * 0.022) * bodyScale;
    shard.scale.set(s, s * 0.7, s * 1.9);             // faceted sliver
    shard.position.set(
      side * (1.7 + row * 0.55) * bodyScale,          // well OUT to the sides (clear of the central column)
      -0.12 - row * 0.14 * len,                        // a touch low
      dz * (0.05 + row * 0.22));                        // hugging the wake, not reaching the camera
    shard.rotation.set(0.3 * i, 0.7 * i, 0.2 * i);    // deterministic scatter
    group.add(shard);
    // A bright inner glint so each shard reads as living crystal in the bloom.
    const glint = new THREE.Sprite(new THREE.SpriteMaterial({
      map: seamTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    glint.scale.setScalar(s * 3.2);
    glint.position.copy(shard.position);
    glint.layers.set(1);
    group.add(glint);
  }

  return { group, segs: [], tailFins: null, accentMats, orbiters: [] };
}

registerTail('cometWake', buildCometWake);
