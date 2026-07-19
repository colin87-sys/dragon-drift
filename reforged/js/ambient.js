import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { makeGlowTexture } from './util.js';
import { bindAtmosphere, chainBeforeCompile } from './atmosphere.js';
import { ROOF_ALT_LO, ROOF_ALT_HI } from './environment.js';   // Fable A1: SAME altitude window as the canopy roof (used at runtime → cyclic import safe)

// MOTE DEPTH-FADE (Fable 70) — a per-biome lever (default 0 = byte-identical, the godrayMul pattern).
// PointsMaterial attenuates SIZE with distance but not ALPHA, so a far mote stays as bright as a near
// one — 1200 identical points collapse into a flat screen overlay ("confetti") that eats the black
// mirror. This fades a mote's alpha by view depth (quadratic, 20→110m) so the field RECEDES. At
// value 0, mix(1.0, x, 0.0) ≡ 1.0 exactly → every other biome's rendered output is bit-identical.
const moteFadeUniform = { value: 0 };
function moteDepthFadeShader(shader) {
  shader.uniforms.moteDepthFade = moteFadeUniform;
  shader.vertexShader = shader.vertexShader
    .replace('void main() {', 'varying float vMoteDepth;\nvoid main() {')
    .replace('#include <project_vertex>', '#include <project_vertex>\n\tvMoteDepth = -mvPosition.z;');
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', 'varying float vMoteDepth;\nuniform float moteDepthFade;\nvoid main() {')
    .replace('#include <opaque_fragment>', '\tfloat _mdf = clamp((vMoteDepth - 20.0) / 90.0, 0.0, 1.0);\n\tdiffuseColor.a *= mix(1.0, 1.0 - _mdf * _mdf, moteDepthFade);\n#include <opaque_fragment>');
}

// Fable A1 HIGH-ALTITUDE MOTE TREATMENT — size octaves + a canopy-hugging stratum, both hung on one uniform,
// both exact-identity at 0 (the moteDepthFade pattern). At the money shot the confetti compresses into a
// living firefly stratum on the canopy floor (big/small octaves break the uniform-dot read) with a sparse
// scatter above the drake ("you are above the world's light"). uMoteAlt 0 → every mix(1,·,0) ≡ 1 → cruise +
// other biomes bit-identical.
const _moteAlt = { value: 0 };
const _moteCamY = { value: 0 };
function moteAltShader(shader) {
  shader.uniforms.uMoteAlt = _moteAlt;
  shader.uniforms.uCamY = _moteCamY;
  shader.vertexShader = shader.vertexShader
    .replace('void main() {', 'attribute float aMoteSize;\nuniform float uMoteAlt;\nvarying float vWY;\nvoid main() {')
    .replace('gl_PointSize = size;', 'gl_PointSize = size * mix(1.0, aMoteSize, uMoteAlt);\n\tvWY = position.y;');
  shader.fragmentShader = shader.fragmentShader
    .replace('void main() {', 'uniform float uMoteAlt, uCamY;\nvarying float vWY;\nvoid main() {')
    .replace('#include <opaque_fragment>', '\tfloat _band = mix(0.18, 1.0, smoothstep(8.0, 13.0, vWY)) * mix(1.0, 0.35, smoothstep(uCamY + 4.0, uCamY + 14.0, vWY));\n\tdiffuseColor.a *= mix(1.0, _band, uMoteAlt);\n#include <opaque_fragment>');
}

// Atmosphere particles wrapped around the camera — snow in Frozen Reach,
// leaves in the Sanctuary, dust in the Wastes, RISING embers in the Caldera,
// spores in the Mire, star motes in the Shallows. One pool, the behaviour
// params lerp with the biome env. Plus a tiny instanced flock circling high
// ahead (re-skinned per biome: gulls, ash-wyverns, glow moths, star petrels)
// and a colossal sky whale that drifts the horizon of the Astral Shallows.

const COUNT = 1200;
const BOX = { x: 80, y: 50, z: 160 };
const feverColor = new THREE.Color(0xff9aee);         // magenta Surge mote tint (shipped default)
const feverWarmColor = new THREE.Color(0xffcf6a);     // Fable 97: EMBER Surge motes for biomes that reserve magenta for danger (the Mire) — "the organisms surge too", never pink
const tmpColor = new THREE.Color();
const _feverTint = new THREE.Color();

let points = null;
let positions = null;
let birds = null;
const BIRD_COUNT = 7;
const birdData = [];
let whale = null;
let whaleTail = null;
let whaleFins = [];
let flyby = null; // foreground single-bird flyby (dusk sanctuary)
// inkShoal (PR-5b, THE EMPYREAN): a coherent SCHOOL of ink-violet koi that replaces the reskinned
// circling bird-flock where a biome declares `shoal`. Invisible + zero-cost everywhere else
// (shoalMix 0 → visible=false → the circling flock renders byte-identical).
let shoal = null;
const SHOAL_COUNT = 10;   // Fable PR-5b: fewer + bigger + aligned reads as fauna; many tiny dark points reads as noise
const shoalData = [];
// Uplift PR-1: a second FAR/HIGH school (depth cue, distinct period) + a sparse layer of LARGER
// ink-violet rising motes with per-mote bob that PART around the dragon — the dark-accent motion
// currency that survives the bright field (pale motes vanish there). All gated on the biome env,
// invisible + zero-cost everywhere else.
let shoal2 = null;
const SHOAL2_COUNT = 7;
const shoal2Data = [];
let inkMotes = null;
let inkPos = null;
const INK_COUNT = 54;
const INK_BOX = { x: 64, y: 46, z: 130 };

// Tier gate: per-frame matrix writers (birds, flyby, shoal) drop out at the lowest tier.
let tierOn = true;
export function setAmbientQuality(q) {
  tierOn = q > 0.4;
  if (birds) birds.visible = tierOn;
  if (flyby) flyby.visible = tierOn;
  if (shoal) shoal.visible = tierOn;
  if (shoal2) shoal2.visible = tierOn;
  if (inkMotes) inkMotes.visible = tierOn;
}

const m4 = new THREE.Matrix4();
const quat = new THREE.Quaternion();
const eul = new THREE.Euler();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();

export function createAmbient(scene) {
  positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * BOX.x;
    positions[i * 3 + 1] = Math.random() * BOX.y;
    positions[i * 3 + 2] = -Math.random() * BOX.z + 30;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  // Fable A1 mote SIZE OCTAVES: a pure per-index class (spore dust / firefly / lantern / rare lantern-moth)
  // — read only at altitude (× uMoteAlt), byte-identical at cruise. ~36 of 1200 are the rare 2.4× moths.
  const moteSize = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const h = Math.abs(Math.sin(i * 127.1) * 43758.5453) % 1;
    moteSize[i] = h < 0.55 ? 0.62 : h < 0.87 ? 1.0 : h < 0.97 ? 1.55 : 2.40;
  }
  geo.setAttribute('aMoteSize', new THREE.BufferAttribute(moteSize, 1));
  points = new THREE.Points(
    geo,
    // N8 PR B: motes join the atmosphere (Points run the fog chunk); identity off. Fable A1 adds the
    // altitude size-octave + stratum, chained after the depth-fade (both idempotent identities at 0).
    chainBeforeCompile(chainBeforeCompile(bindAtmosphere(new THREE.PointsMaterial({
      size: 0.4,
      map: makeGlowTexture('255,255,255'),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      color: 0xffffff,
    })), moteDepthFadeShader), moteAltShader)
  );
  points.frustumCulled = false;
  scene.add(points);

  // Birds: two flattened cones per bird, merged by instance scale animation.
  const wing = new THREE.ConeGeometry(0.5, 2.4, 3);
  wing.rotateZ(Math.PI / 2);
  wing.scale(1, 0.16, 0.55);
  birds = new THREE.InstancedMesh(
    wing,
    bindAtmosphere(new THREE.MeshBasicMaterial({ color: 0x2a2438, fog: true })),
    BIRD_COUNT
  );
  birds.frustumCulled = false;
  birds.layers.set(1);
  for (let i = 0; i < BIRD_COUNT; i++) {
    birdData.push({
      radius: 18 + Math.random() * 26,
      height: 26 + Math.random() * 16,
      speed: 0.25 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      flap: 2.5 + Math.random() * 2,
    });
  }
  scene.add(birds);

  // inkShoal (PR-5b, THE EMPYREAN): a coherent SCHOOL of ink-violet koi — the biome's bespoke ambient
  // fauna, replacing the reskinned circling bird-cones. One koi = a fusiform body (faceted spindle) + a
  // fanned caudal fin, merged into a single ≤14-tri geometry and instanced. Distinct from the bird (no
  // mid-body wing sweep; a tail fan reads as a FISH), and it moves as one school, not lazy circles.
  const koiBody = new THREE.OctahedronGeometry(0.5, 0);
  koiBody.scale(1.4, 0.44, 0.26);                  // 3:1 length:width dash — a single mark reads as a fish, not a fleck (Fable PR-5b)
  const koiTail = new THREE.ConeGeometry(0.34, 0.5, 3).toNonIndexed();  // match the non-indexed body so mergeGeometries can join them
  koiTail.rotateZ(-Math.PI / 2);                    // apex → +X (meets body), base fan → -X (the tail edge)
  koiTail.scale(1.0, 1.4, 0.10);                    // tall + thin = a caudal FAN, never a spike
  koiTail.translate(-0.92, 0, 0);
  const koiGeo = mergeGeometries([koiBody, koiTail], false);
  if (!koiGeo) throw new Error('inkShoal: koi mergeGeometries returned null (attribute mismatch)');
  shoal = new THREE.InstancedMesh(
    koiGeo,
    // Fogged basic material (like the birds/whale) so the dark koi are LIFTED by the opal fog toward the
    // pale field — a soft dark drift, never a true-dark that rivals the Mote. A hair above the canon ink
    // colour 0x1a1424 (Fable PR-5b: at render, 0x1a1424 sat near-black and contested the Mote's true black
    // 0x050308; 0x281f36 keeps koi clearly SUBORDINATE — punctuation, not a second focal dark). Transparent
    // so the school fades in over the biome seam via shoalMix; depthWrite off (distant fauna must not occlude).
    bindAtmosphere(new THREE.MeshBasicMaterial({ color: 0x281f36, fog: true, transparent: true, opacity: 0, depthWrite: false })),
    SHOAL_COUNT
  );
  shoal.frustumCulled = false;
  shoal.layers.set(1);
  shoal.visible = false;
  shoal.name = 'inkShoal';
  for (let i = 0; i < SHOAL_COUNT; i++) {
    // Each koi: an ellipsoidal rest offset inside the school + its own slow churn orbit (the shoal
    // never freezes into a grid) + an undulation phase (the whole-body yaw wag = the cheap "swim").
    shoalData.push({
      ox: (Math.random() - 0.5) * 13,
      oy: (Math.random() - 0.5) * 6,
      oz: (Math.random() - 0.5) * 15,
      wander: 1.1 + Math.random() * 1.4,
      orbSpeed: 0.18 + Math.random() * 0.22,
      orbPhase: Math.random() * Math.PI * 2,
      swimRate: 2.4 + Math.random() * 1.8,
      swimPhase: Math.random() * Math.PI * 2,
      sizeJit: 0.95 + Math.random() * 0.35,   // no tiny strays (a small koi at an odd angle is the residual "scribble" tell)
    });
  }
  scene.add(shoal);

  // Uplift PR-1: the FAR/HIGH second school — same koi geometry + material, smaller and higher on the
  // OTHER flank with its own slower period (a depth cue and a second traversal voice, never a clone).
  shoal2 = new THREE.InstancedMesh(koiGeo, shoal.material, SHOAL2_COUNT);
  shoal2.frustumCulled = false;
  shoal2.layers.set(1);
  shoal2.visible = false;
  shoal2.name = 'inkShoal2';
  for (let i = 0; i < SHOAL2_COUNT; i++) {
    shoal2Data.push({
      ox: (Math.random() - 0.5) * 12,
      oy: (Math.random() - 0.5) * 5,
      oz: (Math.random() - 0.5) * 13,
      wander: 0.9 + Math.random() * 1.2,
      orbSpeed: 0.15 + Math.random() * 0.18,
      orbPhase: Math.random() * Math.PI * 2,
      swimRate: 2.2 + Math.random() * 1.6,
      swimPhase: Math.random() * Math.PI * 2,
      sizeJit: 0.95 + Math.random() * 0.3,
    });
  }
  scene.add(shoal2);

  // Uplift PR-1: ink-drop lumen-motes — the visible mote layer. The shared 1200-mote pool is pale and
  // vanishes on the bright field; this sparse layer is LARGER and slightly ink-violet (dark-on-bright,
  // the ink recipe), rises with a per-mote bob, and PARTS around the dragon (player-coupled). Its own
  // Points object → the shared pool is untouched (byte-identity by construction).
  inkPos = new Float32Array(INK_COUNT * 3);
  for (let i = 0; i < INK_COUNT; i++) {
    inkPos[i * 3] = (Math.random() - 0.5) * INK_BOX.x;
    inkPos[i * 3 + 1] = Math.random() * INK_BOX.y;
    inkPos[i * 3 + 2] = -Math.random() * INK_BOX.z + 20;
  }
  const inkGeo = new THREE.BufferGeometry();
  inkGeo.setAttribute('position', new THREE.BufferAttribute(inkPos, 3));
  inkMotes = new THREE.Points(inkGeo, bindAtmosphere(new THREE.PointsMaterial({
    size: 1.35,
    map: makeGlowTexture('70,58,99'),   // soft ink-violet drop (dark-on-bright reads; pale-on-bright dies)
    transparent: true,
    opacity: 0,
    depthWrite: false,
    color: 0xffffff,
  })));
  inkMotes.frustumCulled = false;
  inkMotes.visible = false;
  inkMotes.name = 'inkMotes';
  scene.add(inkMotes);

  // Foreground flyby: single gull crossing high over the lane (biome 0 only).
  flyby = new THREE.InstancedMesh(
    wing,
    bindAtmosphere(new THREE.MeshBasicMaterial({ color: 0xd0c8e8, fog: true, transparent: true, opacity: 0 })),
    1
  );
  flyby.frustumCulled = false;
  flyby.layers.set(1);
  flyby.visible = false;
  scene.add(flyby);

  // Sky whale: a single colossal silhouette far beyond the course, only
  // visible in the Astral Shallows (opacity follows env.whaleMix). Cheap:
  // one fogged basic material, four meshes, slow drift.
  const whaleMat = bindAtmosphere(new THREE.MeshBasicMaterial({
    color: 0x46467e, fog: true, transparent: true, opacity: 0,
  }));
  whale = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(3.2, 14, 6, 10), whaleMat);
  body.rotation.y = Math.PI / 2;
  whale.add(body);
  const brow = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 6), whaleMat);
  brow.scale.set(1.4, 0.8, 1);
  brow.position.set(7.5, 0.8, 0);
  whale.add(brow);
  whaleTail = new THREE.Mesh(new THREE.ConeGeometry(2.8, 5, 4), whaleMat);
  whaleTail.scale.set(1, 1, 0.25);
  whaleTail.rotation.z = Math.PI / 2;
  whaleTail.position.set(-10.5, 0.5, 0);
  whale.add(whaleTail);
  whaleFins = [];
  for (const s of [-1, 1]) {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.5, 3), whaleMat);
    fin.scale.set(1, 1, 0.2);
    fin.rotation.z = s * 1.9;
    fin.position.set(2, -1.4, s * 3.2);
    whale.add(fin);
    whaleFins.push(fin);
  }
  whale.visible = false;
  scene.add(whale);
}

export function updateAmbient(dt, camera, time, playerDist, playerSpeed, feverMix, env, bossMix = 0) {
  // Lerped biome look + fever tint override. Fable 97: per-biome surgeWarm lerps the fever mote target
  // from magenta → ember (Mire), so the Surge motes flare amber-hot, not pink — magenta stays exclusive to
  // the danger telegraph. surgeWarm 0 elsewhere → _feverTint = feverColor → byte-identical.
  _feverTint.copy(feverColor).lerp(feverWarmColor, env.surgeWarm ?? 0);
  tmpColor.copy(env.ambColor).lerp(_feverTint, feverMix);
  points.material.color.copy(tmpColor);
  // Boss-time mote budget: compose (not stomp) on top of the biome/fever look —
  // motes step back so bullets own the near-centre extremes. Zero term at
  // bossMix=0, so a normal run is byte-identical to pre-Increment-3.
  points.material.opacity = (env.ambOpacity + feverMix * 0.2) * (1 - 0.55 * bossMix);
  points.material.size = env.ambSize * (1 - 0.25 * bossMix);
  moteFadeUniform.value = env.moteDepthFade ?? 0;   // Fable 70: per-biome far-mote depth fade (0 = byte-identical)
  _moteAlt.value = THREE.MathUtils.smoothstep(camera.position.y, ROOF_ALT_LO, ROOF_ALT_HI) * (env.canopyRoof ?? 0);  // Fable A1: high-altitude size-octave + stratum (0 at cruise → byte-identical)
  _moteCamY.value = camera.position.y;

  const speedDrift = Math.max(0, playerSpeed - 35) * 0.5 * dt;
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  for (let i = 0; i < COUNT; i++) {
    let x = positions[i * 3];
    let y = positions[i * 3 + 1] - (env.ambFall + (i % 5) * env.ambFall * 0.25) * dt;
    let z = positions[i * 3 + 2] + speedDrift;
    x += Math.sin(time * 1.5 + i) * env.ambSway * dt;
    // Leaves/motes also bob upward occasionally (flutter)
    y += Math.sin(time * 2.2 + i * 1.7) * env.ambSway * 0.3 * dt;

    if (y < cy - 25) y += BOX.y;
    if (y > cy + 25) y -= BOX.y;
    while (x < cx - BOX.x / 2) x += BOX.x;
    while (x > cx + BOX.x / 2) x -= BOX.x;
    // Keep the band strictly ahead of the lens: a glow particle wrapping to
    // the camera plane renders as a giant screen-filling blob.
    while (z < cz - BOX.z - 6) z += BOX.z;
    while (z > cz - 6) z -= BOX.z;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  points.geometry.attributes.position.needsUpdate = true;

  // Sky whale: drifts the far horizon, fading with the biome seam.
  if (whale) {
    // §8: the whale MESH shows only the non-mote remainder of the landmark mix — a 'mote' landmark biome
    // (the Empyrean) renders the Mote (a sky-shader term) instead, so its whale portion is subtracted out.
    const mix = env.whaleMix - (env.moteMix || 0);
    whale.visible = mix > 0.02;
    if (whale.visible) {
      whaleTail.material.opacity = mix * 0.92;
      const wt = time * 0.06;
      whale.position.set(
        Math.sin(wt) * 110,
        46 + Math.sin(time * 0.18) * 4,
        -playerDist - 330 - Math.cos(wt * 0.7) * 60
      );
      whale.rotation.y = wt + Math.PI / 2;
      whale.rotation.z = Math.sin(time * 0.22) * 0.08;
      whaleTail.rotation.y = Math.sin(time * 0.9) * 0.45;
      whaleFins[0].rotation.x = Math.sin(time * 0.7) * 0.3;
      whaleFins[1].rotation.x = -Math.sin(time * 0.7) * 0.3;
    }
  }

  // inkShoal (PR-5b): a coherent SCHOOL of ink-koi drifting high ahead of the lane. Where a biome
  // declares `shoal` (env.shoalMix>0) the lazy circling flock hands off to the school; shoalMix 0
  // elsewhere → shoal.visible=false + birds untouched = the circling flock renders byte-identical.
  if (shoal) {
    const active = tierOn && env.shoalMix > 0.02;
    shoal.visible = active;
    if (active) {
      shoal.material.opacity = env.shoalMix;
      // Whole-school drift + a slow shared wheel: every koi carries the SAME heading (a school, not a
      // scatter), held near BROADSIDE (small swing) so the koi project their full length toward the lens —
      // a foreshortened koi collapses to a 2px fleck (the "noise/scribble" tell Fable caught). The school
      // SWEEPS slowly across the HIGH open sky, passing well ABOVE the Mote's band: a phone in portrait
      // only sees ~±24° horizontally (the vertical FOV is the wide axis there), so a school parked off to
      // one side (the first shipped x≈44, azimuth ~19°) lived on/past the portrait edge and the biome read
      // as stones-only ("cemetery"). Keeping the sweep inside ~±13° azimuth keeps the life in frame on
      // every aspect; ALTITUDE (not X) separates it from both the Mote below and the sentinel tips.
      const st = time * 0.05;
      const cX = 12 + Math.sin(st) * 18;        // slow ~2-min crossing sweep, azimuth ~-3°..+13° — always inside the portrait window
      const cY = 66 + Math.sin(st * 1.3) * 3;   // WELL above the tallest sentinel tips AND ~14° above the Mote's elevation, clear even at the look-up pitch (props are seed-placed; the school is player-relative, so altitude is the robust separator)
      const cZ = -playerDist - 108 + Math.cos(st * 0.8) * 16;
      const heading = 0.2 + Math.sin(st * 0.7) * 0.4;
      const fs = env.faunaScale * 4.8;
      for (let i = 0; i < SHOAL_COUNT; i++) {
        const f = shoalData[i];
        const churn = time * f.orbSpeed + f.orbPhase;
        pos.set(
          cX + f.ox + Math.sin(churn) * f.wander,
          cY + f.oy + Math.sin(churn * 1.3) * f.wander * 0.5,
          cZ + f.oz + Math.cos(churn) * f.wander
        );
        // Face the school heading + a CLAMPED tail-wag yaw sway (±~13°, the cheap "swim") + a faint bank.
        // The tight clamp keeps every koi near the shared heading → aligned school, not a scatter of angles.
        const wag = Math.sin(time * f.swimRate + f.swimPhase) * 0.15;
        eul.set(0, heading + wag, Math.sin(churn * 1.3) * 0.08);
        quat.setFromEuler(eul);
        const s = fs * f.sizeJit;
        scl.set(s, s, s);
        m4.compose(pos, quat, scl);
        shoal.setMatrixAt(i, m4);
      }
      shoal.instanceMatrix.needsUpdate = true;
    }
    // Uplift PR-1: the FAR/HIGH second school — other flank, higher, farther, slower period (0.041 vs
    // 0.05 → the two traversals never sync). Same portrait-azimuth law: sweep stays within ~±9°.
    if (shoal2) {
      shoal2.visible = active;
      if (active) {
        const st2 = time * 0.041 + 1.7;
        const c2X = -10 + Math.sin(st2) * 11;
        const c2Y = 78 + Math.sin(st2 * 1.2) * 3;
        const c2Z = -playerDist - 168 + Math.cos(st2 * 0.7) * 14;
        const h2 = -0.15 + Math.sin(st2 * 0.6) * 0.35;
        const fs2 = env.faunaScale * 2.9;
        for (let i = 0; i < SHOAL2_COUNT; i++) {
          const f = shoal2Data[i];
          const churn = time * f.orbSpeed + f.orbPhase;
          pos.set(
            c2X + f.ox + Math.sin(churn) * f.wander,
            c2Y + f.oy + Math.sin(churn * 1.3) * f.wander * 0.5,
            c2Z + f.oz + Math.cos(churn) * f.wander
          );
          const wag = Math.sin(time * f.swimRate + f.swimPhase) * 0.15;
          eul.set(0, h2 + wag, Math.sin(churn * 1.3) * 0.08);
          quat.setFromEuler(eul);
          const s = fs2 * f.sizeJit;
          scl.set(s, s, s);
          m4.compose(pos, quat, scl);
          shoal2.setMatrixAt(i, m4);
        }
        shoal2.instanceMatrix.needsUpdate = true;
      }
    }
    // Hand off: the lazy circling flock steps aside once the school owns the frame (byte-identical when
    // shoalMix 0 → birds.visible follows the tier gate exactly as before).
    if (tierOn) birds.visible = env.shoalMix <= 0.5;
  }

  // Uplift PR-1: ink-drop lumen-motes — rise with a per-mote bob (a SECOND motion class beside the
  // schools' traversal) and PART around the dragon (the player-coupled class). Gated on empyMix:
  // invisible + zero-cost in every other biome; the shared 1200-mote pool above is untouched.
  if (inkMotes) {
    const inkOn = tierOn && env.empyMix > 0.02;
    inkMotes.visible = inkOn;
    if (inkOn) {
      inkMotes.material.opacity = 0.85 * env.empyMix;
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      // the dragon rides ~10 ahead of the chase-cam — the parting centre
      const px = cx, py = cy - 3, pz = cz - 10;
      for (let i = 0; i < INK_COUNT; i++) {
        let x = inkPos[i * 3];
        let y = inkPos[i * 3 + 1] + (0.55 + (i % 3) * 0.22) * dt;          // everything in the Empyrean RISES
        let z = inkPos[i * 3 + 2];
        x += Math.sin(time * 0.6 + i * 1.9) * 0.5 * dt;                     // slow per-mote bob
        const dx = x - px, dy = y - py, dz = z - pz;
        const dr = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dr < 7 && dr > 0.01) {                                          // part around the dragon
          const push = (7 - dr) * 1.6 * dt / dr;
          x += dx * push; y += dy * push; z += dz * push;
        }
        if (y > cy + 26) y -= INK_BOX.y;
        if (y < cy - 20) y += INK_BOX.y;
        while (x < cx - INK_BOX.x / 2) x += INK_BOX.x;
        while (x > cx + INK_BOX.x / 2) x -= INK_BOX.x;
        while (z < cz - INK_BOX.z - 6) z += INK_BOX.z;
        while (z > cz - 6) z -= INK_BOX.z;
        inkPos[i * 3] = x; inkPos[i * 3 + 1] = y; inkPos[i * 3 + 2] = z;
      }
      inkMotes.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Flock: lazy circles above the course — color, size and wingbeat re-skin
  // per biome. Brought 30m closer than before so they enter the view cone.
  if (!birds.visible) return;
  birds.material.color.copy(env.faunaColor);
  for (let i = 0; i < BIRD_COUNT; i++) {
    const b = birdData[i];
    const a = time * b.speed + b.phase;
    pos.set(
      Math.cos(a) * b.radius,
      b.height + Math.sin(a * 1.7) * 2.5,
      -playerDist - 130 - Math.sin(a) * b.radius * 0.5
    );
    const flapT = time * b.flap * env.faunaFlap + i;
    eul.set(0, a + Math.PI / 2, Math.sin(flapT) * 0.35);
    quat.setFromEuler(eul);
    const flap = 0.75 + Math.abs(Math.sin(flapT)) * 0.5;
    scl.set(env.faunaScale, flap * env.faunaScale, env.faunaScale);
    m4.compose(pos, quat, scl);
    birds.setMatrixAt(i, m4);
  }
  birds.instanceMatrix.needsUpdate = true;

  // Foreground flyby: a lone gull crossing high over the lane (biome 0 dusk
  // sanctuary and transitions towards it, faunaFlyby lerped via whaleMix-like
  // key on env). Reuses the same bird material. Period ~40 s.
  if (flyby && env.flybyMix > 0.02) {
    const ft = (time * 0.025) % 1;
    const side = Math.floor(time * 0.025) % 2 === 0 ? 1 : -1;
    flyby.visible = true;
    flyby.material.opacity = Math.min(env.flybyMix,
      Math.sin(ft * Math.PI) * env.flybyMix * 1.4);
    flyby.material.color.copy(env.faunaColor);
    pos.set(
      side * (ft - 0.5) * 90,
      26 + Math.sin(ft * Math.PI) * 6,
      -playerDist - 55 - ft * 8
    );
    eul.set(0, side > 0 ? Math.PI * 0.55 : Math.PI * 1.45, Math.sin(time * 4) * 0.2);
    quat.setFromEuler(eul);
    scl.set(env.faunaScale * 1.3, env.faunaScale * 1.3, env.faunaScale * 1.3);
    m4.compose(pos, quat, scl);
    flyby.setMatrixAt(0, m4);
    flyby.instanceMatrix.needsUpdate = true;
  } else if (flyby) {
    flyby.visible = false;
  }
}
