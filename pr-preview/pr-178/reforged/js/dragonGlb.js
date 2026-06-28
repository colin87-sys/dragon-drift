// Asset-backed dragon path (the `aether` experiment) — load a GLB mesh and
// return the SAME { group, parts, materials, auraSprite } contract the engine
// (dragon.js / preview.js) expects, so nothing downstream changes. The roster is
// otherwise 100% procedural; this coexists behind `def.meshUrl` and never runs
// for a procedural dragon.
//
// HOW THE FLAP STAYS GAMEPLAY-REACTIVE (Plan A): we build an empty shoulder→
// elbow→wrist scaffold and expose it as parts.wingRigL/R — the exact shape the
// existing `if (wingRigL)` branch in dragon.js drives via flapWing(). The GLB's
// wing geometry is re-parented under that scaffold, so the shipped, gameplay-
// reactive wingbeat (speed/boost/steer/climb) animates the AI mesh for free, no
// new animation code. A skinned GLB instead plays its baked AnimationClip via an
// AnimationMixer (parts.glbAnim.mixer, ticked by dragon.js) as a fallback.
//
// HEADLESS-SAFE: GLTFLoader is imported DYNAMICALLY and only in a real browser
// (http/https). In Node (tricount/blueprint/flapcheck) this returns the light
// placeholder silhouette synchronously and never touches the DOM.

import * as THREE from 'three';
import { makeGlowTexture } from './util.js';
import { applyFresnelRim } from './surface.js';

// --- module cache: url -> Promise<gltf> (one parse shared by game + preview) ---
const _cache = new Map();
let _loaderP = null;

function inBrowser() {
  return typeof document !== 'undefined' && typeof location !== 'undefined' &&
    typeof location.protocol === 'string' && /^https?:$/.test(location.protocol);
}
function getLoader() {
  if (!_loaderP) _loaderP = import('../lib/loaders/GLTFLoader.js').then((m) => new m.GLTFLoader());
  return _loaderP;
}
// Preload + parse a GLB once. Safe to call early (on dragon select) to avoid a
// pop when the run starts. Resolves to the parsed gltf, or null when not in a
// browser. Errors resolve to null (the placeholder silhouette stays).
export function preloadDragonAsset(url) {
  if (!url || !inBrowser()) return Promise.resolve(null);
  if (!_cache.has(url)) {
    _cache.set(url, getLoader()
      .then((loader) => loader.loadAsync(url))
      .catch((e) => { console.warn('[dragonGlb] load failed', url, e); return null; }));
  }
  return _cache.get(url);
}

// Empty shoulder→elbow→wrist scaffold at a wing root. flapWing() rotates these;
// the GLB wing geometry rides under .shoulder. Positions match the placeholder
// wing-node translations so a re-parented wing pivots at the shoulder. A real
// asset tunes these via def.glb.shoulder.
function makeWingRig(side, sh) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * sh[0], sh[1], sh[2]);
  const elbow = new THREE.Group(); elbow.position.set(side * 0.5, 0, 0);
  const wrist = new THREE.Group(); wrist.position.set(side * 0.5, 0, 0);
  elbow.add(wrist); shoulder.add(elbow);
  return { shoulder, elbow, wrist, side, profile: null };
}

const findFirst = (root, re) => {
  let hit = null;
  root.traverse((o) => { if (!hit && re.test(o.name || '')) hit = o; });
  return hit;
};
const anySkinned = (root) => {
  let s = false;
  root.traverse((o) => { if (o.isSkinnedMesh) s = true; });
  return s;
};

// Procedural body DEFORM: a traveling lateral SLITHER wave down the serpent's
// spine, plus (for a fused winged mesh) a shader WING-FLAP — both injected into
// the GLB material's vertex stage so it keeps its PBR texture/lighting. Done in
// MESH-LOCAL space (before the model matrix) so they're immune to the rotY/rotX/
// scale placement. Driven by uniforms ticked in dragon.js (reactive to speed).
// Normals are intentionally NOT recomputed (a subtle shear; cheaper, holds 60fps).
//
// SLITHER: a wave runs along the spine axis (`opts.axis`: 'z' = the legacy body,
// head +Z→tail −Z, displacing X; 'y' = the unified winged mesh, head +Y→tail −Y,
// displacing X with a faint Z roll). Amplitude ramps 0→1 head→tail (head leads,
// tail whips). The math is the SAME 1-D traveling wave either way (tests/slither.mjs).
//
// WING-FLAP (`opts.flap`, the fused winged mesh): verts past |localX|>uHingeX are
// the wings; they rotate about a fore-aft hinge (local Y, at localX=±uHingeX) by
// −side·amp·sin(phase) so BOTH wings beat together (wingtips swing through local Z,
// which the −90° flight pitch maps to world up/down). Body verts are untouched
// (mask=0 → identity). Mirrors tests/wingflap.mjs.
function attachBodyDeform(mat, u, opts = {}) {
  const axis = opts.axis === 'y' ? 'y' : 'z';
  const SP = axis === 'y' ? 'position.y' : 'position.z';   // spine coordinate
  const LB = axis === 'y' ? 'z' : 'y';                     // secondary "roll" lateral axis
  const flap = !!opts.flap;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = u.uTime; shader.uniforms.uAmp = u.uAmp;
    shader.uniforms.uFreq = u.uFreq;
    shader.uniforms.uSpineMin = u.uSpineMin; shader.uniforms.uSpineMax = u.uSpineMax;
    let decl = 'uniform float uTime;uniform float uAmp;uniform float uFreq;uniform float uSpineMin;uniform float uSpineMax;\n';
    // uTime is the ACCUMULATED wave phase (dragon.js advances it by dt·waveSpeed), not a
    // raw clock — so a speed change never multiplies into a phase jump (see dragon.js).
    let body =
      'float spineT = clamp((uSpineMax - ' + SP + ') / max(0.0001, uSpineMax - uSpineMin), 0.0, 1.0);\n' +
      'float phase = uFreq * ' + SP + ' + uTime;\n' +
      'transformed.x += uAmp * spineT * sin(phase);\n' +
      'transformed.' + LB + ' += uAmp * 0.3 * spineT * cos(phase);\n';
    if (flap) {
      shader.uniforms.uFlapPhase = u.uFlapPhase; shader.uniforms.uFlapAmp = u.uFlapAmp;
      shader.uniforms.uHingeX = u.uHingeX; shader.uniforms.uHingeZ = u.uHingeZ;
      shader.uniforms.uWingMinS = u.uWingMinS; shader.uniforms.uFlapTilt = u.uFlapTilt;
      shader.uniforms.uWingMinB = u.uWingMinB; shader.uniforms.uWingMaxB = u.uWingMaxB;
      decl += 'uniform float uFlapPhase;uniform float uFlapAmp;uniform float uHingeX;uniform float uHingeZ;uniform float uWingMinS;uniform float uFlapTilt;uniform float uWingMinB;uniform float uWingMaxB;\n';
      // Wing verts are wide in X AND in the FRONT/shoulder region (spine coord above
      // uWingMinS). The second gate is essential: the coiled TAIL also swings wide in
      // X, so a |x|-only mask grabs tail verts and flaps them — the "tail warps when it
      // moves" bug. The spine coord is the same axis the slither uses.
      // The wingtip's swing happens in the X/Z (span/depth) plane; `uFlapTilt` (radians)
      // rotates that swing toward the SPINE axis (transformed.y here) so the beat can be
      // angled fore/aft instead of straight up/down. uFlapTilt = 0 ⇒ byte-identical to the
      // shipped beat (Thundercoil), since the depth delta `ndz` is 0 for every non-wing vert.
      body +=
        'float wside = sign(position.x);\n' +
        'float wmask = step(uHingeX, abs(position.x)) * step(uWingMinS, ' + SP + ') * step(uWingMinB, position.z) * step(position.z, uWingMaxB);\n' +
        'float fth = -wside * uFlapAmp * sin(uFlapPhase) * wmask;\n' +
        'float wdx = position.x - wside * uHingeX;\n' +
        'float wdz = position.z - uHingeZ;\n' +
        'float fc = cos(fth), fs = sin(fth);\n' +
        'float ndx = (wside * uHingeX + wdx * fc + wdz * fs) - position.x;\n' +
        'float ndz = (uHingeZ - wdx * fs + wdz * fc) - position.z;\n' +
        'transformed.x += ndx;\n' +
        'transformed.z += ndz * cos(uFlapTilt);\n' +
        'transformed.y += ndz * sin(uFlapTilt);\n';
    }
    shader.vertexShader = decl + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\n' + body);
    // Fresnel RIM + a flat ambient lift — a PBR GLB reads as a black silhouette when
    // backlit (the sun sits ahead on the flight line); procedural dragons solve this
    // with the same rim. View-direction term added to totalEmissiveRadiance, so it's
    // independent of scene lights and survives the bake. Tinted to the electric accent.
    if (opts.rim) {
      const r = opts.rim;
      shader.uniforms.uRimColor = { value: new THREE.Color(r.color ?? 0x8ec8ff) };
      shader.uniforms.uRimInt = { value: r.intensity ?? 0.6 };
      shader.uniforms.uRimPow = { value: r.power ?? 2.4 };
      shader.uniforms.uRimBias = { value: r.bias ?? 0.0 };
      shader.uniforms.uFillColor = { value: new THREE.Color(r.fill ?? 0x5a6a86) };
      shader.uniforms.uFillInt = { value: r.fillIntensity ?? 0.0 };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>',
          '#include <common>\nuniform vec3 uRimColor;uniform float uRimInt;uniform float uRimPow;uniform float uRimBias;uniform vec3 uFillColor;uniform float uFillInt;')
        .replace('#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\n{\n' +
          'float vDotN = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);\n' +
          'float fres = pow(1.0 - vDotN, uRimPow);\n' +
          'totalEmissiveRadiance += uRimColor * (fres * uRimInt + uRimBias) + uFillColor * uFillInt;\n}\n');
    }
  };
  mat.needsUpdate = true;
}

export function buildGlbDragon(def, opts = {}) {
  const model = def.model || {};
  const cfg = def.glb || {};
  const sh = cfg.shoulder || [0.26, 0.18, 0.0];     // [xAbs, y, z] of each shoulder pivot

  const group = new THREE.Group();

  // Animation rig — STABLE references captured once by dragon.js; the visual is
  // swapped in under them when the GLB resolves.
  const wingRigL = makeWingRig(-1, sh);
  const wingRigR = makeWingRig(1, sh);
  group.add(wingRigL.shoulder, wingRigR.shoulder);

  const head = new THREE.Group();
  head.position.set(0, cfg.headAt ? cfg.headAt[1] : 0.1, cfg.headAt ? cfg.headAt[2] : 1.15);
  group.add(head);

  const riderSocket = new THREE.Group();
  riderSocket.position.set(0, (cfg.riderAt && cfg.riderAt[1]) || 0.35, (cfg.riderAt && cfg.riderAt[2]) || -0.1);
  group.add(riderSocket);

  // Materials — dummies for the rim/Surge/eye hooks dragon.js drives. Tinting on
  // a PBR GLB is reduced (documented tradeoff); these keep the existing emissive
  // animation harmless and also shade the placeholder silhouette.
  const bodyMat = new THREE.MeshStandardMaterial({ color: def.body ?? 0x1c3a42, roughness: 0.6, metalness: 0.2, emissive: def.body ?? 0x103038, emissiveIntensity: 0.12 });
  if (def.bodyRoughness != null) bodyMat.roughness = def.bodyRoughness;
  applyFresnelRim(bodyMat, def.apexSeam || def.eye || 0x66ddee);
  const wingMat = new THREE.MeshStandardMaterial({ color: def.wingInner ?? 0x2a6e76, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 0.96, side: THREE.DoubleSide });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive: def.eye ?? 0x8fe7ff, emissiveIntensity: 2.2 });

  // Light placeholder silhouette — the pre-load BODY+HEAD stand-in (also the
  // headless representation). Hidden the moment a real GLB body is parented in.
  // The WINGS are deliberately NOT part of this silhouette (see authoredWing*).
  const placeholder = new THREE.Group();
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 1.8), bodyMat);
  placeholder.add(bodyMesh);
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), bodyMat);
  head.add(headBox);
  group.add(placeholder);

  // Authored storm-membrane wings. In the HYBRID config (AI-generated body +
  // rigged wings) these ARE the real, gameplay-reactive wings: they live
  // permanently under the flap rig, so the shipped flapWing() beat
  // (speed/boost/steer/climb) animates them with zero new animation code — the
  // image-to-3D mesh need only supply the body, which reconstructs far more
  // reliably than thin wing membranes. If a loaded GLB instead carries its OWN
  // wing nodes (the winged hand-authored placeholder, or a fully-modelled winged
  // export), we hide these and drive the GLB's wings instead. Swept two-panel
  // membrane, tiny tri count.
  const ws = cfg.wingScale || 1;   // scales the authored wing to match a big GLB body
  const makeMembraneWing = (s) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0.34 * ws, s * 2.05 * ws, 0.05 * ws, 0.52 * ws, s * 1.62 * ws, 0.03 * ws, -0.42 * ws,   // leading panel
      0, 0, 0.34 * ws, s * 1.62 * ws, 0.03 * ws, -0.42 * ws, 0, 0, -0.5 * ws,                       // trailing panel
    ], 3));
    g.setIndex([0, 1, 2, 3, 4, 5]); g.computeVertexNormals();
    const m = new THREE.Mesh(g, wingMat); m.name = 'authoredWing';
    return m;
  };
  const authoredWingL = makeMembraneWing(-1); wingRigL.shoulder.add(authoredWingL);
  const authoredWingR = makeMembraneWing(1); wingRigR.shoulder.add(authoredWingR);

  // NOTE: the separate AI-wing path (def.glb.wingMesh on the flap rig) is retired —
  // Thundercoil is now a single UNIFIED winged mesh (def.glb.fusedWings) that carries
  // its own wings, flapped by the shader deform. The authored membranes above remain
  // only as the headless / no-asset fallback (hidden in-browser once the mesh loads).

  // Aura sprite — dragon.js dereferences this UNCONDITIONALLY (fever/idle halo).
  const auraSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(def.fx?.auraColor || '142,213,255'), transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  auraSprite.scale.set(9, 9, 1);
  auraSprite.layers.set(1);
  group.add(auraSprite);

  group.scale.setScalar(model.scale || 1);

  // Holder ticked by dragon.js every frame: a baked-clip mixer (skinned GLB) and/or
  // the procedural body-deform uniforms (the traveling spine wave def.glb.slither,
  // and — for a fused winged mesh — the shader wing-flap def.glb.wing).
  const slither = cfg.slither || null;
  const fused = !!cfg.fusedWings;          // the unified winged mesh (spine along Y, shader flap)
  const wingCt = cfg.wing || null;
  const slitherU = {
    // uTime is the accumulated wave PHASE (dragon.js advances it by dt·waveSpeed).
    uTime: { value: 0 }, uAmp: { value: slither?.amp ?? 0 },
    uFreq: { value: slither?.freq ?? 6.0 },
    uSpineMin: { value: -1 }, uSpineMax: { value: 1 },
    // wing-flap (fused mesh only; harmless no-op uniforms otherwise)
    uFlapPhase: { value: 0 }, uFlapAmp: { value: wingCt?.amp ?? 0 },
    uHingeX: { value: wingCt?.hingeX ?? 1e9 }, uHingeZ: { value: wingCt?.hingeZ ?? 0 },
    // only flap verts whose spine coord is above this (the front/shoulder wing band) —
    // keeps the coiled tail (low spine coord) out of the wingbeat.
    uWingMinS: { value: wingCt?.minS ?? -1e9 },
    // tilt (radians) of the wingbeat plane toward the spine; 0 = the shipped up/down beat.
    uFlapTilt: { value: wingCt?.tilt ?? 0 },
    // depth-axis (fore/aft, local Z) band for the wing mask — the THIRD gate that lets the wing be
    // carved off limbs sharing its span+spine. ±1e9 default ⇒ no effect (Thundercoil unchanged).
    uWingMinB: { value: wingCt?.minB ?? -1e9 }, uWingMaxB: { value: wingCt?.maxB ?? 1e9 },
  };
  const glbAnim = {
    mixer: null,
    // baseSpeed = the cruise wave rate (def.glb.slither.speed); dragon.js scales it with speed.
    slither: slither ? { uniforms: slitherU, baseAmp: slither.amp ?? 0, baseSpeed: slither.speed ?? 4.0 } : null,
    // wing-flap clock (dragon.js advances uFlapPhase reactively); null if not fused.
    wingFlap: (fused && wingCt) ? { uniforms: slitherU, baseAmp: wingCt.amp ?? 0 } : null,
  };

  // --- async swap-in (browser only) ---------------------------------------
  if (inBrowser() && def.meshUrl) {
    preloadDragonAsset(def.meshUrl).then((gltf) => {
      if (!gltf || !gltf.scene) return;
      const skinned = anySkinned(gltf.scene);
      let content;
      if (skinned) {
        // Skinned: clone preserving the skeleton, add static, drive via a mixer.
        // A skinned export animates its OWN full body (wings included), so retire
        // the authored membranes and the whole silhouette.
        return import('../lib/utils/SkeletonUtils.js').then((SU) => {
          content = SU.clone(gltf.scene);
          applyGlbTransform(content, cfg);
          group.add(content);
          authoredWingL.visible = false; authoredWingR.visible = false;
          headBox.visible = false; placeholder.visible = false;
          if (gltf.animations && gltf.animations.length) {
            const mixer = new THREE.AnimationMixer(content);
            mixer.clipAction(gltf.animations[0]).play();
            glbAnim.mixer = mixer;       // dragon.js ticks this (baked-flap fallback)
          }
        });
      }
      // Non-skinned. If the GLB carries named wing nodes, re-parent them under the
      // flap scaffold so the shipped reactive wingbeat drives them (and retire the
      // authored membranes). Otherwise the authored membrane wings stay and ARE
      // the wings (the hybrid AI-body case). Body/head ride the root either way.
      content = gltf.scene.clone(true);
      applyGlbTransform(content, cfg);
      const wl = findFirst(content, /wing.?l\b|wing_l|leftwing/i);
      const wr = findFirst(content, /wing.?r\b|wing_r|rightwing/i);
      const reparent = (node, rig) => {
        if (!node) return;
        node.position.set(0, 0, 0); node.rotation.set(0, 0, 0); node.scale.set(1, 1, 1);
        rig.shoulder.add(node);
      };
      if (fused || wl || wr) {
        // A fused winged mesh carries its own wings (flapped by the shader deform),
        // or a GLB with named wing nodes hangs them on the flap scaffold — either
        // way the authored membrane fallback is retired.
        if (wl || wr) { reparent(wl, wingRigL); reparent(wr, wingRigR); }
        authoredWingL.visible = false; authoredWingR.visible = false;
      }
      const hn = findFirst(content, /^head$/i);
      if (hn) { hn.position.set(0, 0, 0); head.add(hn); }
      headBox.visible = false;       // body+head silhouette retired (GLB body takes over)
      placeholder.visible = false;
      // Procedural deform — wire the spine wave (+ fused wing-flap) into every mesh
      // material. The unified winged mesh's spine runs along local Y (head +Y → tail
      // −Y); the legacy wingless body runs along local Z. Bounds from the real bbox.
      if (slither || (fused && wingCt) || cfg.rim) {
        const axis = fused ? 'y' : 'z';
        // Backlit-silhouette lift: a fresnel rim (+ optional flat fill) folded into the
        // deform shader. Defaults derive from the dragon's electric accent so the edge
        // glows on-brand; all tunable via def.glb.rim.
        const rimCfg = cfg.rim === false ? null : {
          color: (cfg.rim && cfg.rim.color) ?? def.apexSeam ?? def.eye ?? 0x8ec8ff,
          intensity: (cfg.rim && cfg.rim.intensity) ?? 0.5,
          power: (cfg.rim && cfg.rim.power) ?? 2.8,   // tight edge — accent, not a wash
          bias: (cfg.rim && cfg.rim.bias) ?? 0.0,     // no flat electric add (kept the body grey)
          fill: (cfg.rim && cfg.rim.fill) ?? 0x6a7896, // neutral steel fill lifts the backlit side
          fillIntensity: (cfg.rim && cfg.rim.fillIntensity) ?? 0.2,
        };
        content.traverse((o) => {
          if (!o.isMesh || !o.geometry) return;
          o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          slitherU.uSpineMin.value = axis === 'y' ? bb.min.y : bb.min.z;
          slitherU.uSpineMax.value = axis === 'y' ? bb.max.y : bb.max.z;
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(
            (m) => m && attachBodyDeform(m, slitherU, { axis, flap: fused && !!wingCt, rim: rimCfg }));
        });
      }
      group.add(content);            // remaining nodes (body, etc.) ride the root
    });
  }

  const parts = {
    head, tailSegs: [], tailFins: [], spineSegs: [], bodySegs: null, tailOrbiters: null,
    riderSocket, wingRigL, wingRigR, coreGlow: null, glbAnim,
    // legacy hookpoints left undefined on purpose — every consumer guards them
    // (the wingRig path is taken, wingPivot2/tipMarker are `if`-guarded).
  };
  const materials = { bodyMat, wingMat, eyeMat, spineMats: [] };

  if (opts.preview) {
    const wrapper = new THREE.Group();
    wrapper.add(group);
    return { group: wrapper, parts, materials, auraSprite };
  }
  return { group, parts, materials, auraSprite };
}

// scale / rotation(yaw) / offset to fit the GLB into the game's space + facing.
function applyGlbTransform(content, cfg) {
  const s = cfg.scale ?? 1;
  content.scale.multiplyScalar(s);
  // Facing: yaw to point the head down -Z (travel), pitch to lay a reared/curved
  // pose into a flight line, roll if the mesh's "up" needs leveling.
  if (cfg.rotY) content.rotation.y += cfg.rotY;
  if (cfg.rotX) content.rotation.x += cfg.rotX;
  if (cfg.rotZ) content.rotation.z += cfg.rotZ;
  if (cfg.offset) content.position.set(cfg.offset[0] || 0, cfg.offset[1] || 0, cfg.offset[2] || 0);
}
