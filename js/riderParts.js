import * as THREE from 'three';
import { makeGlowTexture } from './util.js';

// ── Rider figures ───────────────────────────────────────────────────────────
// Each rider is a distinct CHARACTER read from BEHIND. The gameplay camera sits
// above-and-behind the dragon, so a rider's identity lives in its back
// silhouette: the headgear crest, the shoulder line, the gear mounted on its
// back and the shape of whatever trails in the slipstream. Built once here and
// shared by the in-game model (dragon.js) and the shop turntable (preview.js)
// so the two always match. Local convention: forward (away from camera) is -z,
// the trailing slipstream is +z, up is +y.

// Proportion presets — the build sets shoulder width (the strongest rear cue),
// head size and how far the torso leans into the flight.
const BUILDS = {
  wanderer: { shoulderW: 0.30, headR: 0.205, torsoR: 0.185, torsoLen: 0.50, headY: 0.50, headZ: -0.16 },
  knight:   { shoulderW: 0.44, headR: 0.200, torsoR: 0.215, torsoLen: 0.54, headY: 0.52, headZ: -0.20 },
  aviator:  { shoulderW: 0.26, headR: 0.190, torsoR: 0.165, torsoLen: 0.52, headY: 0.50, headZ: -0.14 },
  mystic:   { shoulderW: 0.35, headR: 0.210, torsoR: 0.195, torsoLen: 0.56, headY: 0.55, headZ: -0.12 },
};

export function riderMaterials(def) {
  return {
    suit: new THREE.MeshStandardMaterial({
      color: def.suit, roughness: 0.78 - def.suitMetal * 0.42,
      metalness: def.suitMetal, emissive: def.suitEmissive, emissiveIntensity: 0.5,
    }),
    cloak: new THREE.MeshStandardMaterial({
      color: def.cloak, emissive: def.cloakEmissive, emissiveIntensity: 0.32, roughness: 0.74,
    }),
    scarf: new THREE.MeshStandardMaterial({
      color: def.scarf, emissive: def.scarf, emissiveIntensity: 0.24, roughness: 0.6,
    }),
    leather: new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.82 }),
    metal: new THREE.MeshStandardMaterial({
      color: def.trimMetal ?? 0x9a8050, metalness: 0.75, roughness: 0.32,
      emissive: def.trimEmissive ?? 0x000000, emissiveIntensity: 0.6,
    }),
    skin: new THREE.MeshStandardMaterial({ color: 0x33232c, roughness: 0.82 }),
  };
}

// Build the full rider character (torso-up; the saddle/seat belongs to each
// caller). Returns animation handles: the head (ponytail anchor), the trailing
// group, any orbiting shards and the signature glow sprite.
export function buildRiderFigure(def, mats) {
  const B = BUILDS[def.build] || BUILDS.wanderer;
  const g = new THREE.Group();
  const h = { group: g, head: null, trail: null, orbiters: [], glow: null };

  // Torso — leans into the flight; capsule radius/length set by the build.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(B.torsoR, B.torsoLen, 4, 10), mats.suit);
  torso.rotation.x = -0.4;
  g.add(torso);
  // Shoulder yoke: a horizontal bar whose width is the build's defining cue.
  const yoke = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, B.shoulderW * 1.4, 3, 8), mats.suit);
  yoke.rotation.z = Math.PI / 2;
  yoke.position.set(0, 0.26, -0.05);
  g.add(yoke);

  // Head (ponytail anchors here; mostly covered by headgear).
  const head = new THREE.Mesh(new THREE.SphereGeometry(B.headR, 12, 9), mats.skin);
  head.position.set(0, B.headY, B.headZ);
  g.add(head);
  h.head = head;

  buildHeadgear(def, mats, g, head, B);
  buildShoulders(def, mats, g, B);
  buildBack(def, mats, g, B, h);
  h.trail = buildTrail(def, mats, g);

  if (def.glowColor) {
    h.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(def.glowColor), transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    h.glow.scale.set(1.7, 1.7, 1);
    h.glow.position.set(0, 0.45, 0.1);
    g.add(h.glow);
  }

  return h;
}

// ── Headgear: the back-of-head silhouette ───────────────────────────────────
function buildHeadgear(def, mats, g, head, B) {
  const hairMat = new THREE.MeshStandardMaterial({ color: def.hair, roughness: 0.95 });
  const accent = new THREE.MeshStandardMaterial({
    color: def.scarf, emissive: def.scarf, emissiveIntensity: 0.4, roughness: 0.5, metalness: 0.2,
  });

  if (def.headgear === 'bandana') {
    // Loose hair cap + a brow band + a topknot tuft.
    const hair = new THREE.Mesh(new THREE.SphereGeometry(B.headR * 1.04, 10, 8), hairMat);
    hair.position.set(0, head.position.y + 0.015, head.position.z + 0.03);
    hair.scale.set(1, 0.95, 1.08);
    g.add(hair);
    const band = new THREE.Mesh(new THREE.TorusGeometry(B.headR * 0.97, 0.022, 6, 16), mats.scarf);
    band.position.set(0, head.position.y + 0.02, head.position.z);
    band.rotation.x = Math.PI / 2 - 0.22;
    g.add(band);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 5), hairMat);
    knot.position.set(0, head.position.y + B.headR + 0.03, head.position.z + 0.06);
    knot.rotation.x = 0.7;
    g.add(knot);

  } else if (def.headgear === 'plumeHelm') {
    // Metal helm + a back-flared neck guard + a graduated mohawk crest.
    const helm = new THREE.Mesh(new THREE.SphereGeometry(B.headR * 1.12, 12, 10), mats.metal);
    helm.position.copy(head.position);
    helm.scale.set(1, 1.06, 1.08);
    g.add(helm);
    const guard = new THREE.Mesh(new THREE.ConeGeometry(B.headR * 1.05, 0.16, 8, 1, true), mats.metal);
    guard.position.set(0, head.position.y - 0.07, head.position.z + 0.08);
    guard.rotation.x = 0.5;
    g.add(guard);
    const heights = [0.09, 0.16, 0.2, 0.15, 0.08];
    heights.forEach((hh, i) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.03, hh, 0.075), accent);
      plate.position.set(0, head.position.y + B.headR + hh * 0.35, head.position.z - 0.12 + i * 0.075);
      g.add(plate);
    });

  } else if (def.headgear === 'aeroHelm') {
    // Sleek elongated helm, a dorsal fin and two swept-back antennae.
    const helm = new THREE.Mesh(new THREE.SphereGeometry(B.headR * 1.08, 12, 10), mats.metal);
    helm.position.copy(head.position);
    helm.scale.set(0.95, 0.95, 1.24);
    g.add(helm);
    const glowMat = new THREE.MeshStandardMaterial({
      color: def.scarf, emissive: def.scarf, emissiveIntensity: 1.6, roughness: 0.3,
    });
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 3), glowMat);
    fin.scale.set(0.3, 1, 1.1);
    fin.position.set(0, head.position.y + 0.11, head.position.z + 0.06);
    fin.rotation.x = -0.5;
    g.add(fin);
    for (const sx of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.34, 4), glowMat);
      ant.scale.set(0.5, 1, 0.5);
      ant.position.set(sx * 0.11, head.position.y + 0.09, head.position.z + 0.12);
      ant.rotation.set(1.0, 0, sx * 0.5);
      g.add(ant);
    }

  } else if (def.headgear === 'hood') {
    // A deep hood pointing back; the head reads as shadow beneath it.
    const hood = new THREE.Mesh(new THREE.ConeGeometry(B.headR * 1.5, B.headR * 2.7, 8), mats.cloak);
    hood.position.set(0, head.position.y + 0.05, head.position.z + 0.03);
    hood.rotation.x = 0.18;
    g.add(hood);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(B.headR * 1.18, 0.018, 6, 16), accent);
    rim.position.set(0, head.position.y - 0.04, head.position.z - 0.12);
    rim.rotation.x = Math.PI / 2 + 0.5;
    g.add(rim);
  }
}

// ── Shoulders: the upper-back width and edges ───────────────────────────────
function buildShoulders(def, mats, g, B) {
  if (def.shoulders === 'pauldrons') {
    for (const sx of [-1, 1]) {
      const pa = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), mats.metal);
      pa.position.set(sx * B.shoulderW * 0.92, 0.27, -0.03);
      pa.scale.set(1.1, 0.82, 1.12);
      pa.rotation.z = sx * -0.3;
      g.add(pa);
      const stud = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), mats.metal);
      stud.position.set(sx * B.shoulderW * 0.96, 0.36, -0.03);
      g.add(stud);
    }
  } else if (def.shoulders === 'slim') {
    const finMat = new THREE.MeshStandardMaterial({
      color: def.cloak, emissive: def.scarf, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.3,
    });
    for (const sx of [-1, 1]) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.26, 3), finMat);
      fin.scale.set(0.4, 1, 1);
      fin.position.set(sx * B.shoulderW, 0.27, 0.07);
      fin.rotation.set(1.2, 0, sx * 0.4);
      g.add(fin);
    }
  } else if (def.shoulders === 'mantle') {
    // A wide flared collar drapes the shoulders (point up = wide hem at top).
    const collar = new THREE.Mesh(
      new THREE.ConeGeometry(B.shoulderW * 1.4, 0.32, 12, 1, true), mats.cloak);
    collar.position.set(0, 0.34, 0.02);
    collar.rotation.x = Math.PI;
    g.add(collar);
  }
  // 'cloth' adds nothing — the soft-shouldered nomad reads by absence.
}

// ── Back gear: the signature rear feature ───────────────────────────────────
function buildBack(def, mats, g, B, h) {
  if (def.back === 'satchel') {
    // Asymmetric courier load: a pack, its flap, a lashed bedroll.
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.16), mats.leather);
    pack.position.set(0.05, 0.18, 0.2);
    pack.rotation.x = -0.28;
    g.add(pack);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.03), mats.cloak);
    flap.position.set(0.05, 0.31, 0.27);
    flap.rotation.x = -0.28;
    g.add(flap);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), mats.scarf);
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 0.06, 0.24);
    g.add(roll);

  } else if (def.back === 'banner') {
    // Tall pole + glowing pennant — the highest point of the silhouette.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 6), mats.metal);
    pole.position.set(-0.18, 0.7, 0.18);
    pole.rotation.x = 0.2;
    g.add(pole);
    const flagMat = new THREE.MeshStandardMaterial({
      color: def.scarf, emissive: def.scarf, emissiveIntensity: 0.35, roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), flagMat);
    flag.position.set(-0.18, 1.26, 0.28);
    flag.rotation.z = Math.PI / 2;
    flag.scale.set(0.32, 1, 1);
    g.add(flag);

  } else if (def.back === 'vanes') {
    // Twin swept energy vanes forming a V — flat fins with a glowing spine.
    const vaneMat = new THREE.MeshStandardMaterial({
      color: def.cloak, emissive: def.scarf, emissiveIntensity: 1.2, roughness: 0.35,
      metalness: 0.3, side: THREE.DoubleSide,
    });
    const ribMat = new THREE.MeshStandardMaterial({
      color: def.scarf, emissive: def.scarf, emissiveIntensity: 2.0, roughness: 0.3,
    });
    for (const sx of [-1, 1]) {
      const vane = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 4), vaneMat);
      vane.scale.set(1, 1, 0.12);
      vane.position.set(sx * 0.15, 0.44, 0.17);
      vane.rotation.set(-0.5, 0, sx * -0.7);
      g.add(vane);
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), ribMat);
      rib.position.copy(vane.position);
      rib.rotation.copy(vane.rotation);
      g.add(rib);
    }

  } else if (def.back === 'shards') {
    // A constellation of shards orbits the head + a faint halo ring.
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0x150a26, emissive: def.scarf, emissiveIntensity: 2.2, roughness: 0.25, metalness: 0.2,
    });
    const N = 3;
    for (let i = 0; i < N; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 + i * 0.012, 0), shardMat);
      const ang = (i / N) * Math.PI * 2;
      const radius = 0.26;
      const baseY = B.headY + 0.28 + Math.sin(i * 1.3) * 0.04;
      s.position.set(Math.cos(ang) * radius, baseY, Math.sin(ang) * radius * 0.5);
      g.add(s);
      h.orbiters.push({ mesh: s, baseY, radius, ang, flat: 0.5, speed: 0.6 + i * 0.18 });
    }
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.012, 6, 24),
      new THREE.MeshStandardMaterial({ color: def.scarf, emissive: def.scarf, emissiveIntensity: 1.6 }));
    halo.position.set(0, B.headY + 0.3, 0.04);
    halo.rotation.x = 1.2;
    g.add(halo);
  }
}

// ── Trail: what streams in the slipstream (returned for animation) ───────────
// Children are oriented to trail back+down at rest; the caller swings the group.
function buildTrail(def, mats, g) {
  const trail = new THREE.Group();
  trail.position.set(0, 0.2, 0.12);
  g.add(trail);

  if (def.trail === 'tatters') {
    // A frayed scarf split into three uneven strips.
    const segs = [{ x: 0.0, len: 0.82 }, { x: 0.09, len: 0.6 }, { x: -0.08, len: 0.7 }];
    for (const s of segs) {
      const strip = new THREE.Mesh(new THREE.ConeGeometry(0.05, s.len, 4), mats.scarf);
      strip.scale.set(0.5, 1, 0.5);
      strip.position.set(s.x, -s.len * 0.32, s.len * 0.34);
      strip.rotation.x = Math.PI / 2 + 0.45;
      trail.add(strip);
    }

  } else if (def.trail === 'splitCape') {
    // Two heavy flat cape tails splitting apart.
    for (const sx of [-1, 1]) {
      const cape = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.98, 4), mats.cloak);
      cape.scale.set(0.62, 1, 0.16);
      cape.position.set(sx * 0.1, -0.36, 0.42);
      cape.rotation.set(Math.PI / 2 + 0.35, 0, sx * 0.12);
      trail.add(cape);
    }

  } else if (def.trail === 'ribbon') {
    // A forked energy ribbon — two thin glowing strips.
    const rMat = new THREE.MeshStandardMaterial({
      color: def.scarf, emissive: def.scarf, emissiveIntensity: 1.3, roughness: 0.4,
      side: THREE.DoubleSide,
    });
    for (const sx of [-1, 1]) {
      const rb = new THREE.Mesh(new THREE.ConeGeometry(0.05, 1.02, 4), rMat);
      rb.scale.set(0.4, 1, 0.08);
      rb.position.set(sx * 0.06, -0.42, 0.46);
      rb.rotation.set(Math.PI / 2 + 0.5, 0, sx * 0.14);
      trail.add(rb);
    }

  } else if (def.trail === 'robe') {
    // A long, voluminous open robe — the deepest trailing silhouette.
    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.3, 8, 1, true), mats.cloak);
    robe.position.set(0, -0.48, 0.36);
    robe.rotation.x = Math.PI / 2 + 0.55;
    trail.add(robe);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.05, 6, 1, true), mats.scarf);
    inner.position.set(0, -0.42, 0.34);
    inner.rotation.x = Math.PI / 2 + 0.55;
    trail.add(inner);
  }

  return trail;
}
