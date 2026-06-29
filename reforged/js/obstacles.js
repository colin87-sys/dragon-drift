import * as THREE from 'three';
import { CONFIG } from './config.js';
import { biomeIndexAt } from './biomes.js';
import { mulberry32 } from './util.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// Hazards, spawned ahead and culled behind the dragon:
//   pillar — floor spike (health damage)
//   shard  — floating octahedron, optionally oscillating ("dynamic") (damage)
//   bar    — horizontal beam spanning the lane (damage)
//   gate   — a Phase Gate: a translucent magical veil spanning the lane with a
//            clearly-framed opening on the flight path (FATAL on contact, or
//            roll-phaseable during a Surge). Biome-adaptive (see PHASE_SKINS).
// Each entry doubles as its own collider; `colliders` is consumed by collision.js.
// Body materials are biome-keyed (verdigris stone / sandstone / ice); the Phase
// Gate is skinned per biome too — same shape language, biome-tinted veil + glow.
let scene = null;
let mats = null;
// Phase Gate shared materials, one per biome (built in initObstacles).
let veilMats = null; // translucent fresnel membrane
let edgeMats = null; // bright aperture ring + corner brackets (visual hierarchy #1)
let rimMats = null;  // dim outer silhouette frame (secondary)
const entries = [];
export const colliders = entries; // same objects, same array

// Per-biome Phase Gate skin: same gameplay/shape, biome-tinted presentation.
// Colours track each biome's signature accents; `rise` biases the mote drift
// (ember/spore rise, frost settles, astral hovers).
const PHASE_SKINS = [
  { veil: 0x3fd9a8, edge: 0x6ce4ff, core: 0x9ffff0, mote: 0x8fe9ff, rise:  0.4 }, // 0 Sanctuary — ethereal cyan-teal
  { veil: 0xffcf96, edge: 0xffb347, core: 0xfff0c8, mote: 0xffd98a, rise:  0.2 }, // 1 Wastes — gold mirage
  { veil: 0xbfe8ff, edge: 0x9fd8f0, core: 0xffffff, mote: 0xd6f3ff, rise: -0.4 }, // 2 Frozen — frost
  { veil: 0xff8a44, edge: 0xff6a24, core: 0xffd0a0, mote: 0xff8a3a, rise:  0.9 }, // 3 Caldera — ember rift
  { veil: 0x6effc8, edge: 0x4dffd0, core: 0xcfffd8, mote: 0xaaffc0, rise:  0.7 }, // 4 Mire — spore veil
  { veil: 0x8a6aff, edge: 0x9fb8ff, core: 0xd8c8ff, mote: 0xb9a8ff, rise:  0.05 }, // 5 Astral — cosmic violet
];

// Fresnel veil: a magical membrane that is MOST transparent viewed head-on (so
// the player sees rings/hazards/lane straight through it while planning), and
// only catches light along its grazing silhouette edges. Alpha is hard-capped
// at 0.30 so it can never blind the route ahead. Unlit + cheap.
function makeVeilMat(color, edge) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uEdge: { value: new THREE.Color(edge) },
      uAlpha: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalMatrix * normal;
        vPos = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform vec3 uEdge; uniform float uAlpha;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vView);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        float band = sin((vPos.y * 0.5 + vPos.x * 0.3) - uTime * 1.5);
        float shimmer = 0.85 + 0.15 * band;
        float a = clamp(uAlpha * (0.30 + 0.70 * fres) * shimmer, 0.0, 0.30);
        vec3 col = mix(uColor, uEdge, clamp(fres * 0.85, 0.0, 1.0));
        col += uEdge * max(0.0, band) * 0.12;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}

// Emissive glow line for the frame/ring/brackets — blooms in postfx.
function makeEdgeMat(color, intensity) {
  return new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0,
  });
}

export function initObstacles(s) {
  scene = s;
  const bodyOpts = { flatShading: true, roughness: 0.4, metalness: 0.1 };
  mats = {
    body: [
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7fbf9f, emissive: 0x13302a, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0xddb273, emissive: 0x3a230a, emissiveIntensity: 0.35 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7cc4ee, roughness: 0.3, emissive: 0x10324d, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x4a3038, emissive: 0x8a2208, emissiveIntensity: 0.5 }),  // basalt, ember-lit
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x2a6a52, emissive: 0x14b088, emissiveIntensity: 0.45 }), // biolume moss
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x5a5a9a, emissive: 0x3a3aa0, emissiveIntensity: 0.45 }), // astral slate
    ],
    // Movers are the active danger: icy body, hot coral warning glow that
    // pulses in updateObstacles (shared material — one update per frame).
    mover: new THREE.MeshStandardMaterial({
      color: 0xbcd8e8,
      flatShading: true,
      roughness: 0.25,
      emissive: 0xff5a47,
      emissiveIntensity: 0.9,
    }),
    // Ancient fossil bone for the Dragon Spine Canyon — warm ivory, faceted, a
    // touch of emissive so the skeleton reads (and blooms) against any biome sky.
    bone: new THREE.MeshStandardMaterial({
      color: 0xe7dcc0, flatShading: true, roughness: 0.7, metalness: 0.0,
      emissive: 0x4a3f2a, emissiveIntensity: 0.35,
    }),
    // Soft pale sea-mist veils for the sea-stack run (low haze hugging the
    // water). Unlit, fogged so it recedes, no depth write so it layers cleanly.
    mist: new THREE.MeshBasicMaterial({
      color: 0xc8d4e4, transparent: true, opacity: 0.08, depthWrite: false,
      side: THREE.DoubleSide, fog: true,
    }),
    // Soul-fire for the skull's eyes — a cold green ember that pulses (shared, one
    // write/frame in updateObstacles) so the mouth reads as "something ancient is
    // awake" from a distance. Bright emissive so it blooms.
    soul: new THREE.MeshStandardMaterial({
      color: 0x0c2415, flatShading: true, roughness: 0.3, metalness: 0.0,
      emissive: 0x4dff9e, emissiveIntensity: 1.8,
    }),
    // The dead leviathan's crystal heart — a translucent magenta core suspended in
    // the chest cavity. Surge-coded colour; transparent + no depth write so it
    // glows without ever blocking the view of the path past it.
    heart: new THREE.MeshStandardMaterial({
      color: 0x2a0e1e, flatShading: true, roughness: 0.2, metalness: 0.0,
      emissive: 0xff3a78, emissiveIntensity: 1.4,
      transparent: true, opacity: 0.6, depthWrite: false,
    }),
  };
  // Phase Gate skins, one material set per biome.
  veilMats = PHASE_SKINS.map((s) => makeVeilMat(s.veil, s.edge));
  edgeMats = PHASE_SKINS.map((s) => makeEdgeMat(s.edge, 1.4));
  rimMats = PHASE_SKINS.map((s) => makeEdgeMat(s.edge, 0.5));
}

export function addObstacle(o) {
  const e = { ...o, object: null };
  const body = mats.body[biomeIndexAt(o.dist)];
  if (o.type === 'pillar') {
    e.object = new THREE.Mesh(new THREE.ConeGeometry(o.r, o.h, 6), body);
    e.object.position.set(o.x, o.h / 2, -o.dist);
  } else if (o.type === 'shard') {
    e.object = new THREE.Mesh(new THREE.OctahedronGeometry(o.r), o.dynamic ? mats.mover : body);
    e.object.position.set(o.x, o.y, -o.dist);
  } else if (o.type === 'bar') {
    e.object = new THREE.Mesh(new THREE.CylinderGeometry(o.r, o.r, 30, 8), body);
    e.object.rotation.z = Math.PI / 2;
    e.object.position.set(0, o.y, -o.dist);
  } else if (o.type === 'gate') {
    e.object = buildGate(o);
  }
  scene.add(e.object);
  entries.push(e);
}

// A biome-adaptive Phase Gate: a translucent fresnel veil spanning the lane
// around a clearly-framed rectangular opening. Layered per the design spec —
//   1. outer silhouette frame (dim, reads from afar)
//   2. bright aperture ring + corner brackets (the clearest "fly here" cue)
//   3. translucent veil membrane (most transparent head-on; never blocks view)
//   4. reactive FX: core-glow locator, long-range beacon, drifting motes
// Veil/ring/rim materials are shared per biome; core/beacon/motes are
// per-instance (marked so removeAt disposes them).
function buildGate(o) {
  const group = new THREE.Group();
  const bi = biomeIndexAt(o.dist);
  const skin = PHASE_SKINS[bi];
  const veilMat = veilMats[bi];
  const edgeMat = edgeMats[bi];
  const rimMat = rimMats[bi];

  const T = 1.2; // veil thickness (thin so the side faces read as a glowing rim)
  const X = 16; // veil half-span
  const TOP = 24;
  const left = o.gapX - o.gapW;
  const right = o.gapX + o.gapW;
  const bottom = o.gapY - o.gapH;
  const top = o.gapY + o.gapH;
  const W = o.gapW * 2;
  const H = o.gapH * 2;

  // Layer 3 — translucent phase field (veil panels around the aperture).
  const panel = (w, h, cx, cy) => {
    if (w <= 0.1 || h <= 0.1) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), veilMat);
    mesh.position.set(cx, cy, 0);
    group.add(mesh);
  };
  panel(left + X, TOP, (left - X) / 2, TOP / 2); // left of gap
  panel(X - right, TOP, (right + X) / 2, TOP / 2); // right of gap
  panel(right - left, TOP - top, o.gapX, (top + TOP) / 2); // above gap
  panel(right - left, bottom, o.gapX, bottom / 2); // below gap

  const bar = (w, h, cx, cy, mat, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), mat);
    mesh.position.set(cx, cy, z);
    group.add(mesh);
  };

  // Layer 1 — outer silhouette frame: a slim, dim glowing rim around the whole
  // span so the gate reads as an intentional portal from a distance (secondary
  // in the hierarchy, hence rimMat's lower emissive).
  bar(2 * X, 0.3, 0, TOP - 0.15, rimMat, 0.15);
  bar(2 * X, 0.3, 0, 0.15, rimMat, 0.15);
  bar(0.3, TOP, -X + 0.15, TOP / 2, rimMat, 0.15);
  bar(0.3, TOP, X - 0.15, TOP / 2, rimMat, 0.15);

  // Layer 2 — aperture ring: the brightest element, framing the safe route.
  bar(W + 0.7, 0.5, o.gapX, top + 0.25, edgeMat, 0.3);
  bar(W + 0.7, 0.5, o.gapX, bottom - 0.25, edgeMat, 0.3);
  bar(0.5, H + 0.7, left - 0.25, o.gapY, edgeMat, 0.3);
  bar(0.5, H + 0.7, right + 0.25, o.gapY, edgeMat, 0.3);
  // Corner brackets (viewfinder cue) opening toward the centre of the gap.
  const legLen = 1.2;
  const gap = 0.75;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = o.gapX + sx * (o.gapW + gap);
      const cy = o.gapY + sy * (o.gapH + gap);
      bar(legLen, 0.34, cx - sx * legLen / 2, cy, edgeMat, 0.5); // horizontal leg
      bar(0.34, legLen, cx, cy - sy * legLen / 2, edgeMat, 0.5); // vertical leg
    }
  }

  // Layer 4 — core-glow locator: a faint additive fill of the OPENING so the
  // safe route is easy to find from any altitude. Per-instance (approach-lit).
  const coreMat = new THREE.MeshBasicMaterial({
    color: skin.core, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  coreMat.userData.perInstance = true;
  const core = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coreMat);
  core.position.set(o.gapX, o.gapY, 0.12);
  core.layers.set(1); // out of the water reflection
  group.add(core);
  group.userData.core = core;

  // Layer 4 — long-range beacon: a tall biome-tinted light pillar above the
  // gap, visible through fog/bloom from far away (telegraphs the route early).
  const beaconMat = new THREE.MeshBasicMaterial({
    color: skin.edge, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  beaconMat.userData.perInstance = true;
  const beacon = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, 60), beaconMat);
  beacon.position.set(o.gapX, top + 30, 0.3);
  beacon.layers.set(1); // hidden from water reflection
  group.add(beacon);
  group.userData.beacon = beacon;

  // Layer 4 — sparse drifting motes for life (tertiary; one shared material per
  // gate, animated in updateObstacles). Tiny additive quads, kept low-density.
  const moteMat = new THREE.MeshBasicMaterial({
    color: skin.mote, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  moteMat.userData.perInstance = true;
  const moteGeo = new THREE.PlaneGeometry(0.45, 0.45);
  const motes = [];
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    const mx = o.gapX + (Math.random() * 2 - 1) * (X * 0.7);
    const my = 2 + Math.random() * (TOP - 4);
    m.position.set(mx, my, 0.4);
    m.userData = { baseX: mx, baseY: my, phase: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.7 };
    m.layers.set(1);
    group.add(m);
    motes.push(m);
  }
  group.userData.motes = motes;
  group.userData.rise = skin.rise;

  group.position.z = -o.dist;
  return group;
}

// --- Sky Canyon rock gates -------------------------------------------------
// A canyon segment frames a safe aperture (centered on a reward ring) with rock
// masses, an emissive aperture rim ("glowing crystal cracks"), and an additive
// core-glow locator. The rock uses a PER-INSTANCE clone of the biome body
// material so it can dissolve to nothing as it nears the camera (so a cleared
// rock never blocks the view of what's next). Open-top by design: masses flank /
// arch / shelf the gap but never seal the sky. Each mass also records an
// axis-aligned collider box (`e.boxes`) consumed by collision.js.
export function addCanyonSegment(o) {
  const e = { ...o, type: 'rockGap', object: null, boxes: [], fadeMat: null, core: null };
  e.object = buildRockGap(o, e);
  scene.add(e.object);
  entries.push(e);
}

function buildRockGap(o, e) {
  const bi = biomeIndexAt(o.dist);
  const skin = PHASE_SKINS[bi];
  const rng = mulberry32((o.seed ^ 0x9e3779b9) >>> 0);
  const group = new THREE.Group();
  const gx = o.gapX, gy = o.gapY, W = o.gapW, H = o.gapH, T = o.thick;
  const LANE = CONFIG.laneHalfWidth;
  const CEIL = CONFIG.canyonCeilingY;
  const spine = o.run === 'spine';

  // One per-instance base material for ALL solids in this gate → they dissolve
  // together near the camera. Bone for the Dragon Spine, biome rock otherwise.
  const fadeMat = (spine ? mats.bone : mats.body[bi]).clone();
  fadeMat.transparent = true;
  fadeMat.opacity = 1;
  fadeMat.userData.perInstance = true;
  e.fadeMat = fadeMat;
  const edgeMat = edgeMats[bi];

  // --- build helpers --------------------------------------------------------
  const place = (geo, x, y, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, fadeMat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    group.add(m); return m;
  };
  // oz = the box's local z-offset from the segment centre (lets a ribcage wall
  // sit at a specific rib's depth so collision can follow the lateral sweep).
  const box = (cx, cy, hw, hh, hz = T, oz = 0) => e.boxes.push({ cx, cy, hw, hh, hz, oz });
  // Faceted lump (rock boulder OR a chunk of bone) + matching collider box.
  const lump = (cx, cy, hw, hh, hz, jag = 0.34) => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    geo.scale(hw, hh, hz);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const j = 1 - jag * 0.5 + rng() * jag;
      pos.setXYZ(k, pos.getX(k) * j, pos.getY(k) * j, pos.getZ(k) * j);
    }
    geo.computeVertexNormals();
    place(geo, cx, cy, 0, rng() * 0.3 - 0.15, rng() * Math.PI, rng() * 0.3 - 0.15);
    box(cx, cy, hw, hh, hz);
  };
  const slab = (cx, cy, hw, hh, hz) => {
    place(new THREE.BoxGeometry(hw * 2, hh * 2, hz * 2), cx, cy);
    box(cx, cy, hw, hh, hz);
  };
  const decorCone = (r, h, x, y, z, rx = 0, ry = 0, rz = 0) =>
    place(new THREE.ConeGeometry(r, h, 5), x, y, z, rx, ry, rz);

  // One jagged faceted shard (5-sided crystal/rock spike), jittered, baked into a
  // given transform so a cluster can be MERGED into one mesh (1 draw call).
  const shardGeo = (r, h, ox, oy, oz, tilt, pointDown = false) => {
    const g = new THREE.ConeGeometry(r, h, 5);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      if (v.y < h * 0.42) { const j = 0.78 + rng() * 0.5; v.x *= j; v.z *= j; } // crag the body, keep the tip
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.translate(0, h / 2, 0);                 // base at 0, tip at h
    if (pointDown) g.rotateX(Math.PI);        // tip points down (stalactite)
    g.rotateY(rng() * Math.PI);
    g.rotateZ(tilt);
    g.translate(ox, oy, oz);
    return g;
  };

  // A canyon wall built from the biome's OWN vocabulary: a jagged ridge of sharp
  // faceted shards (like the biome's spire props), tinted by the biome body
  // material — not a smooth blob. Merged to one mesh; collider hugs the lane band.
  const seaStack = (cx, hw, topY, botY, z = 0, lean = 0, hzCol = T) => {
    const h = topY - botY;
    const n = Math.max(2, Math.round(hw / 2.2));     // shards across the wall width
    const sr = (hw / n) * 1.15;                       // radius sized to fit WITHIN the wall
    const span = Math.max(0, hw - sr);               // keep shard edges inside ±hw (no poking into the lane/channel)
    const parts = [];
    for (let i = 0; i < n; i++) {
      const base = n > 1 ? -span + (i / (n - 1)) * 2 * span : 0;
      const sx = base + (rng() - 0.5) * sr * 0.3;     // small jitter, stays contained
      const r = sr * (0.85 + rng() * 0.25);
      const sh = h * (0.62 + rng() * 0.42);           // uneven, jagged crest
      parts.push(shardGeo(r, sh, sx, botY, (rng() - 0.5) * hzCol * 0.4, lean + (rng() - 0.5) * 0.16));
    }
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    merged.computeVertexNormals();
    place(merged, cx, 0, z);
    // Collider TAPERS with the spire so flying high to a ring doesn't clip the
    // full-width box where the rock is only thin tips: a solid lower body, then a
    // narrower crest pulled back from the opening up high.
    box(cx, 6, hw, 9, hzCol, z);            // body: y -3..15, full width
    box(cx, 18, hw * 0.6, 4.5, hzCol, z);   // crest: y 13.5..22.5, narrow (room up high)
  };

  // A continuous RUN of sea stacks: frequent towers alternating left/right that
  // bound a gently winding channel, so there's essentially ONE path threading
  // between them. The wind is smooth (always reachable) and continuous across
  // sections; towers lean toward the channel; the channel is wider than the gap
  // so the reward ring always sits inside it. Open on the far side of each lone
  // tower, so you can always see the slot ahead and plan.
  const stackRun = (depthHalf, count) => {
    e.depthHalf = Math.max(e.depthHalf || 0, depthHalf);
    e.noDissolve = true;
    const top = CEIL + 2, bot = -3;      // rise from the "sea" below up past the ceiling
    const sp = (2 * depthHalf) / count;
    const hz = sp * 0.6;
    const runIdx = o.runIdx || 0;
    // The channel winds; cos(π·…) sits it centred on the reward ring at each ring
    // plane and stays continuous across section seams. Centre clamped to the lane
    // so a strong wind is always fair.
    const sway = (f) => (o.swaySign || 1) * 5.0 * Math.cos(Math.PI * (runIdx - 2 + f));
    const CLAMP = LANE - (W + 2) - 1;
    for (let k = 0; k < count; k++) {
      const f = (k + 0.5) / count;
      const z = -depthHalf + f * 2 * depthHalf + (rng() - 0.5) * sp * 0.25;
      const xc = Math.max(-CLAMP, Math.min(CLAMP, gx + sway(f)));
      // Breathing channel: claustrophobic pinches that open to a breath and back,
      // one cycle per section — the rhythm is where the adrenaline lives.
      const breathe = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (runIdx - 2 + f));
      const chanHalf = W + 0.1 + breathe * 1.7;
      // BOTH walls — you're flanked left AND right by tall stacks (not one open
      // side), so it reads as a canyon you're INSIDE, not a line you fly past.
      let li = xc - chanHalf, ri = xc + chanHalf;
      // Near a ring's plane, carve a generous CENTRED pocket around the reward
      // ring — at least the ring's own radius (3.6) + the dragon + margin on each
      // side — so a far-out ring is never pinched by a close wall and you can sit
      // dead-centre to grab it cleanly.
      if (Math.abs(z) < 8) { li = Math.min(li, gx - 5.6); ri = Math.max(ri, gx + 5.6); }
      const lo = -LANE - 3, ro = LANE + 3;
      if (li - lo > 1.4) seaStack((lo + li) / 2, (li - lo) / 2, top, bot, z, 0.06, hz);
      if (ro - ri > 1.4) seaStack((ro + ri) / 2, (ro - ri) / 2, top, bot, z, -0.06, hz);
      // Overhead rock bridge every other slice — caps the canyon so you're caged
      // from ABOVE too (the missing dimension), ducking under arch after arch.
      // Non-fatal rock, so a graze on a wobble just chips, never a cheap death.
      // Each arch is an irregular faceted chunk on its OWN material that fades as
      // you approach, so the near one turns translucent and you see the next ones.
      if (k % 2 === 1) {
        const ay = gy + H + 5;                         // crest, high enough that tips clear the gap
        const aw = chanHalf + 1.6;
        const an = Math.max(2, Math.round(aw / 2.2));
        const aparts = [];
        for (let i = 0; i < an; i++) {                 // a row of downward shards (stalactites)
          const sx = -aw + ((i + 0.5) / an) * 2 * aw + (rng() - 0.5);
          aparts.push(shardGeo(0.9 + rng() * 0.8, 2 + rng() * 2, sx, 0, (rng() - 0.5) * hz * 0.5, (rng() - 0.5) * 0.25, true));
        }
        const ageo = mergeGeometries(aparts, false);
        aparts.forEach((g) => g.dispose());
        ageo.computeVertexNormals();
        const amat = mats.body[bi].clone();
        amat.transparent = true; amat.depthWrite = false; amat.userData.perInstance = true;
        const a = new THREE.Mesh(ageo, amat);
        a.position.set(xc, ay, z);
        group.add(a);
        box(xc, ay - 1.6, chanHalf + 1.4, 2, hz * 0.85, z);
        (e.archFades || (e.archFades = [])).push({ mat: amat, dist: o.dist - z });
      }
    }
    // Low sea-mist hugging the WATER (very subtle, kept low so it never washes the
    // slot into glare). A couple of soft discs; biome fog + parallax do the rest.
    for (let m = 0; m < 2; m++) {
      const mz = -depthHalf + ((m + 0.5) / 2) * 2 * depthHalf;
      const q = new THREE.Mesh(new THREE.CircleGeometry(LANE * (0.85 + rng() * 0.3), 16), mats.mist);
      q.position.set(gx + (rng() - 0.5) * 5, 0.4 + rng() * 2, mz);
      group.add(q);
    }
  };

  // A run of SUCCESSIVE rib bones along the flight axis — the actual ribcage.
  // Each rib is a curved hoop around the corridor (open at the belly), hung off a
  // dorsal spine of vertebrae, repeated frequently down z so you fly through a
  // barrel of ribs (sky shows BETWEEN the ribs). Collision is a thin shell hugging
  // the corridor and spanning the section depth — fly down the middle. Going wide
  // around the cage is possible but loses the reward ring at its centre.
  const ribcage = (depthHalf, nRibs, opts = {}) => {
    const { flare = 0, vert = 0, neural = false, broken = false, tilt = false, squeeze = 1 } = opts;
    e.depthHalf = Math.max(e.depthHalf || 0, depthHalf); // widen collision broad-phase
    e.noDissolve = true;        // thin, open ribs never block the view → don't fade
    const cx = 2 * W * squeeze; // TWICE as wide (× a tightening factor approaching the heart)
    const cy = H + 5.5;         // TALLER — the arch clears the forward sightline
    const cYc = gy + 1.5;       // lift the cage so the belly opening stays roomy
    const runIdx = o.runIdx || 0;
    // Lateral sweep that fakes the curl of a long body: the tunnel starts on the
    // far side (cos = ±1 at the cage's first rib) and continues seamlessly across
    // sections (phase is shared at the section seams), so it reads as ONE long
    // curving ribcage, not isolated clumps.
    const phaseAt = (f) => runIdx - 2 + f;
    const sway = (f) => (o.swaySign || 1) * 3.0 * Math.cos((Math.PI / 2) * phaseAt(f));

    // Collision FOLLOWS the sweep: thin side walls placed per-rib at each rib's
    // depth (oz), so the safe corridor curves smoothly with the bone instead of
    // jumping sideways at section seams (which forced blind dodges). The corridor
    // is set just at the visible rib inner and the walls are thin, so you can fly
    // right up to a rib before grazing it. Belly + overhead stay open.
    const cor = cx * 0.92;
    const wallHz = (depthHalf / Math.max(nRibs - 1, 1)) * 0.62; // tiles along z, slight overlap

    for (let k = 0; k < nRibs; k++) {
      const f = nRibs > 1 ? k / (nRibs - 1) : 0.5;
      const z = -depthHalf + f * 2 * depthHalf;
      const ox = gx + sway(f);
      // The corridor walls ALWAYS bound the path (fair), no matter how the visible
      // rib above them is varied or broken below — collision stays predictable.
      box(ox - cor, cYc, 0.4, cy * 0.9, wallHz, z);
      box(ox + cor, cYc, 0.4, cy * 0.9, wallHz, z);
      const wJit = 1 + (rng() - 0.5) * 0.16;                       // per-rib size jitter (less uniform)
      const wS = cx * (1 + flare * Math.abs(f - 0.5) * 1.6) * wJit;
      const hS = cy * (1 + flare * Math.abs(f - 0.5) * 0.9) * wJit;
      // A broken/incomplete rib now and then (never first/last): a short arc hung
      // off one side with a snapped-bone stub, so the cage stops reading as a
      // perfect repeating mesh. VISUAL ONLY — the corridor colliders above remain.
      const isBroken = broken && k > 0 && k < nRibs - 1 && rng() < 0.22;
      const bSide = rng() < 0.5 ? -1 : 1;
      const arc = isBroken ? Math.PI * (0.55 + rng() * 0.3) : Math.PI * 1.55;
      const tw = tilt ? (rng() - 0.5) * 0.5 : 0;                   // tunnel hoops tilt/rotate a touch
      const rib = place(new THREE.TorusGeometry(1, 0.1, 3, 12, arc),
        ox, cYc, z, (rng() - 0.5) * 0.12, 0, -Math.PI * 0.3 + (isBroken ? bSide * 0.6 : 0) + tw);
      rib.scale.set(wS, hS, wS);
      if (isBroken) place(shardGeo(0.5, 1.6 + rng(), ox + bSide * wS * 0.7, cYc - hS * 0.2, z, bSide * 0.5), 0, 0, 0);
      place(new THREE.IcosahedronGeometry(0.7 + vert, 0), ox, cYc + hS + 0.3, z); // dorsal vertebra
      if (neural) place(new THREE.ConeGeometry(0.6, 2.2, 5), ox, cYc + hS + 1.7, z); // neural spine
    }
  };

  // The chest cavity: a wide-OPEN breather act. Sparse, hugely-flared rib arches
  // mark the ribcage at the flanks (so the lane reads as a cavern, not a tunnel),
  // and a translucent crystal HEART hangs to one side of the path — pure spectacle,
  // never on the centred ring line, never blocking the view. A second-act contrast
  // that reinforces (not fights) the see-through feel.
  const heartChamber = (depthHalf) => {
    e.depthHalf = Math.max(e.depthHalf || 0, depthHalf);
    e.noDissolve = true;
    const cYc = gy + 1.5;
    const runIdx = o.runIdx || 0;
    const nArch = 4;
    const wallHz = (depthHalf / nArch) * 0.6;
    for (let k = 0; k < nArch; k++) {
      const f = nArch > 1 ? k / (nArch - 1) : 0.5;
      const z = -depthHalf + f * 2 * depthHalf;
      const ox = gx + (o.swaySign || 1) * 2.0 * Math.cos((Math.PI / 2) * (runIdx - 2 + f));
      const wS = 3.2 * W, hS = 2.0 * H;                            // huge → reads wide open
      const rib = place(new THREE.TorusGeometry(1, 0.12, 3, 14, Math.PI * 1.4),
        ox, cYc, z, (rng() - 0.5) * 0.1, 0, -Math.PI * 0.3);
      rib.scale.set(wS, hS, wS);
      // Colliders only far out at the cavity walls — the centred path is clear.
      box(ox - wS * 0.95, cYc, 0.6, hS, wallHz, z);
      box(ox + wS * 0.95, cYc, 0.6, hS, wallHz, z);
    }
    // The crystal heart: offset to the sway side and kept above the floor, so it's
    // clearly beside the route (never a core you'd have to fly around). No collider.
    const hx = Math.max(-(LANE - 2), Math.min(LANE - 2, gx + (o.swaySign || 1) * (W + 5)));
    const hy = Math.max(CONFIG.laneMinY + 2.5, Math.min(CEIL - 3, gy));
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), mats.heart);
    core.position.set(hx, hy, 0);
    group.add(core);
    e.heartCore = core;                                            // slow-spun in updateObstacles
    // A faint bony cradle cupping the heart + a little mist for atmosphere.
    place(new THREE.TorusGeometry(3.0, 0.16, 4, 16, Math.PI * 1.2), hx, hy, 0, 0, 0, Math.PI * 0.15);
    for (let m = 0; m < 2; m++) {
      const mz = -depthHalf + ((m + 0.5) / 2) * 2 * depthHalf;
      const q = new THREE.Mesh(new THREE.CircleGeometry(LANE * (0.8 + rng() * 0.3), 16), mats.mist);
      q.position.set(gx + (rng() - 0.5) * 5, 1 + rng() * 3, mz);
      group.add(q);
    }
  };

  // --- ROCK RUN -------------------------------------------------------------
  if (o.kind === 'split') {
    // A winding rock canyon: tall sea stacks flank both sides + rock bridges arch
    // overhead, so you're caged inside it (not flying past a line). Weave + duck.
    stackRun(36, 6);
  } else if (o.kind === 'overunder') {
    // A rounded rock mass juts from the ceiling (dive under) or a shelf rises from
    // the floor (climb over) — a vertical squeeze between the tower slots.
    if (o.shelf === 'floor') lump(gx, gy - H - 3, LANE + 1, 3, T, 0.5);
    else lump(gx, gy + H + 3, LANE + 1, 3, T, 0.5);

  // --- DRAGON SPINE CANYON --------------------------------------------------
  } else if (o.kind === 'skull') {
    // The enormous open mouth — bigger and more iconic so it announces the set
    // piece: a heavy cranium + long horns above, jaws framing the opening, teeth
    // bordering it, cheek hinges flanking, and two soul-fire eyes that pulse so the
    // mouth reads as "ancient, awake." The mouth centre is the gap.
    lump(gx, gy + H + 6.4, W + 6.5, 4.4, T + 3.2, 0.45);        // cranium (larger)
    decorCone(1.4, 8.5, gx - (W + 4.6), gy + H + 8.4, -1, -0.5, 0, 0.55);  // L horn (longer)
    decorCone(1.4, 8.5, gx + (W + 4.6), gy + H + 8.4, -1, -0.5, 0, -0.55); // R horn
    lump(gx, gy + H + 1.4, W + 3.4, 1.4, T + 0.4, 0.22);        // upper jaw
    lump(gx, gy - H - 1.4, W + 3.4, 1.4, T + 0.4, 0.22);        // lower jaw
    lump(gx - (W + 2.4), gy, 1.6, H + 2, T);                    // L cheek hinge
    lump(gx + (W + 2.4), gy, 1.6, H + 2, T);                    // R cheek hinge
    const eyeGeo = new THREE.IcosahedronGeometry(0.95, 0);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, mats.soul);             // shared soul-fire (pulsed globally)
      eye.position.set(gx + sx * (W + 1.9), gy + H + 4.4, T + 0.9);
      group.add(eye);
    }
    const nteeth = 5;
    for (let k = 0; k < nteeth; k++) {
      const tx = gx - W + (k / (nteeth - 1)) * (2 * W);
      decorCone(0.42, 1.5, tx, gy + H - 0.5, 0.3, Math.PI, 0, 0); // upper fang ↓
      decorCone(0.42, 1.5, tx, gy - H + 0.5, 0.3, 0, 0, 0);       // lower fang ↑
    }
  } else if (o.kind === 'throat') {
    // First interior beat: neck vertebrae + the first ribs, tiling into the cage.
    ribcage(28, 8, { vert: 0.6 });
  } else if (o.kind === 'rib') {
    // Main ribcage corridor: a CONTINUOUS run of successive ribs (a rib ~every 7
    // units), tiling end-to-end as one long tunnel. It TIGHTENS toward the heart
    // (wide → narrow, the build-up before the breather), with the occasional broken
    // rib so the long run never reads as a perfectly repeating mesh.
    const heartAt = Math.round((o.runTotal - 1) * 0.5);
    const prog = Math.max(0, Math.min(1, (o.runIdx - 2) / Math.max(1, heartAt - 2)));
    ribcage(40, 12, { broken: true, squeeze: 1 - 0.22 * prog });
  } else if (o.kind === 'heart') {
    // Second act: the wide-open chest cavity with the crystal heart (a breather).
    heartChamber(34);
  } else if (o.kind === 'vertebra') {
    // Back-third spine tunnel: bony hoops that read DIFFERENTLY from the rib slalom
    // — prominent neural spines, each hoop tilted/rotated a touch (thread the bones).
    ribcage(40, 11, { vert: 1.0, neural: true, tilt: true });
  } else if (o.kind === 'exitflare') {
    // Release: the last ribs flare OUTWARD, spacing opens, mostly sky — payoff.
    ribcage(34, 9, { flare: 0.9 });
  }

  // No rim/frame on any canyon gate: every opening is framed by its own rock
  // (sea-stack slot, over-under squeeze, skull jaws/teeth, ribcage). A rectangular
  // bar frame read as an odd "crystal window" box, so it's gone.

  group.position.z = -o.dist;
  return group;
}

export function updateObstacles(dt, time, playerDist, speedNorm = 0) {
  // Warning pulse on every moving shard (shared material, one write).
  mats.mover.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.45;
  // Skull soul-fire eyes + the crystal heart breathe (shared materials, one write
  // each) so the skeleton's "living" elements pulse together across any instance.
  if (mats.soul) mats.soul.emissiveIntensity = 1.7 + Math.sin(time * 2.2) * 0.6;
  if (mats.heart) mats.heart.emissiveIntensity = 1.2 + Math.sin(time * 1.6) * 0.5;
  const sn = Math.max(0, Math.min(1, speedNorm));
  // Phase Gate: flow the veil shimmer (shared per biome) and give the aperture
  // ring a gentle, speed-aware breath. Six writes each — negligible.
  for (const m of veilMats) m.uniforms.uTime.value = time;
  for (const m of edgeMats) m.emissiveIntensity = (1.25 + Math.sin(time * 2.4) * 0.18) * (1 + 0.4 * sn);

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.dist < playerDist - CONFIG.cullBehind) {
      removeAt(i);
      continue;
    }
    if (e.type === 'shard') {
      e.object.rotation.y += dt * 0.8;
      e.object.rotation.x += dt * 0.3;
      if (e.dynamic) {
        // Oscillates; the collider position (e.x) moves with the mesh.
        e.x = e.baseX + Math.sin(time * e.speed + e.phase) * e.amp;
        e.object.position.x = e.x;
        e.object.position.y = e.baseY;
      } else {
        e.object.position.y = e.y + Math.sin(time * 1.4 + e.dist) * 0.4;
      }
    } else if (e.type === 'bar') {
      e.object.rotation.x += dt * 0.5; // spin around its long axis
    } else if (e.type === 'gate') {
      // Phase shatter: blow the gate apart (scale + spin) then hide it. Transform
      // only — shared veil/ring materials are never touched here.
      if (e.shatterT > 0) {
        e.shatterT -= dt;
        const k = 1 - Math.max(e.shatterT, 0) / CONFIG.phaseShatterDur;
        e.object.scale.setScalar(1 + k * (e.shatterBig ? 0.8 : 0.4));
        e.object.rotation.z += dt * (e.shatterBig ? 6 : 3);
        if (e.shatterT <= 0) e.object.visible = false;
      }
      const ud = e.object.userData;
      const dz = e.dist - playerDist;
      // Beacon: brightest far out, fades off as you arrive so it never blinds
      // the route up close.
      if (ud.beacon) {
        const alpha = Math.min(1, Math.max(0, (dz - 120) / 130));
        const pulse = 0.85 + Math.sin(time * 3) * 0.15;
        ud.beacon.material.opacity = alpha * 0.30 * pulse;
      }
      // Approach state: the core-glow locator and motes "wake up" as the gate
      // nears, then ease back so they stay subtle at the threshold.
      const appr = Math.min(1, Math.max(0, (200 - dz) / 150));
      if (ud.core) ud.core.material.opacity = appr * 0.13 * (0.9 + 0.1 * Math.sin(time * 2.5));
      if (ud.motes && ud.motes.length) {
        ud.motes[0].material.opacity = appr * 0.5;
        const rise = ud.rise || 0;
        for (const m of ud.motes) {
          const u = m.userData;
          m.position.y = u.baseY + Math.sin(time * u.sp + u.phase) * (0.8 + rise * 0.8);
          m.position.x = u.baseX + Math.cos(time * u.sp * 0.6 + u.phase) * 0.5;
        }
      }
    } else if (e.type === 'rockGap') {
      // Camera-proximity dissolve: solid far out, fades to nothing over the last
      // ~15m so a cleared rock never blocks the view of the next gate.
      const dz = e.dist - playerDist;
      const span = CONFIG.canyonFadeFar - CONFIG.canyonFadeNear;
      const fade = Math.min(1, Math.max(0, (dz - CONFIG.canyonFadeNear) / span));
      // Ribcage sections are long tubes of thin, open bone — fading the whole
      // section by its centre would vanish the ribs ahead, so they never fade.
      if (e.fadeMat && !e.noDissolve) e.fadeMat.opacity = fade;
      // Overhead rock bridges fade INDIVIDUALLY (each by its own depth) as you
      // approach, so the near arch turns translucent and the next ones show
      // through it — caging silhouette far, clear view up close. The fade is a
      // long SMOOTHSTEP (solid ~34m out → clear by ~8m) so it eases, never pops.
      if (e.archFades) {
        for (const a of e.archFades) {
          let t = (a.dist - playerDist - 8) / 26;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          // floor at 0.2 so a near arch stays faintly visible — it still has a
          // collider, so it must never become invisible-but-solid (unfair hit).
          a.mat.opacity = 0.2 + 0.8 * (t * t * (3 - 2 * t));
        }
      }
      // Core-glow locator wakes as the gate nears, telegraphing the safe route.
      if (e.core) {
        const appr = Math.min(1, Math.max(0, (180 - dz) / 150));
        e.core.material.opacity = appr * 0.16 * (0.9 + 0.1 * Math.sin(time * 2.5));
      }
      // The heart-chamber crystal turns slowly so it catches light as you pass it.
      if (e.heartCore) { e.heartCore.rotation.y += dt * 0.3; e.heartCore.rotation.x += dt * 0.14; }
    }
  }
}

function removeAt(i) {
  const e = entries[i];
  scene.remove(e.object);
  e.object.traverse((m) => {
    if (m.geometry) m.geometry.dispose();
    // Most materials are shared (biome pools); only per-instance ones
    // (gate core-glow / beacon / motes) are owned by this object and disposed.
    const mat = m.material;
    if (mat && mat.userData && mat.userData.perInstance) mat.dispose();
  });
  entries.splice(i, 1);
}

export function obstacleCount() {
  return entries.length;
}

// First unpassed gate ahead of a distance (reticle target).
export function nextGateAhead(dist) {
  let best = null;
  for (const e of entries) {
    if (e.type === 'gate' && !e.passed && e.dist > dist && (!best || e.dist < best.dist)) best = e;
  }
  return best;
}

// Revive helper: clear every hazard up to a distance so the player gets a
// clean runway back into the action.
export function clearAhead(untilDist) {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].dist <= untilDist) removeAt(i);
  }
}

export function resetObstacles() {
  while (entries.length) removeAt(entries.length - 1);
}
