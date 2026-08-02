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

  // Faint twin spark-streaks riding just inside the wake (additive sprites only —
  // no detached debris), so the trail reads as a clean comet of light rather than
  // floating bits. They hug the wake centreline and fade out behind.
  const sparkN = wisps + 1;
  for (let i = 0; i < sparkN; i++) {
    const t = i / sparkN;
    for (const side of [-1, 1]) {
      const spark = new THREE.Sprite(new THREE.SpriteMaterial({
        map: seamTex, transparent: true, opacity: 0.4 * (1 - t * 0.7),
        blending: THREE.AdditiveBlending, depthWrite: false }));
      spark.scale.setScalar((0.32 - t * 0.12) * bodyScale * (0.9 + len * 0.3));
      spark.position.set(side * 0.16 * bodyScale * (1 + t), dy * (i + 1) * 0.9, dz * (i + 1) * 0.85);
      spark.layers.set(1);
      group.add(spark);
    }
  }

  return { group, segs: [], tailFins: null, accentMats, orbiters: [] };
}

registerTail('cometWake', buildCometWake);
