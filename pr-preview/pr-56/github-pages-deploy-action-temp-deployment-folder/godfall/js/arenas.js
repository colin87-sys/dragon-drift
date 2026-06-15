// The four arenas. Each is { root, update(dt, time, camera, intensity),
// setQuality(q), dispose() } plus a post-grade tint. Everything is shader +
// primitive work: a radial maelstrom ocean, a strata canyon, a cloud-floor
// storm sanctum, and the star void. `intensity` (0-1, fed by boss phase)
// turns the drama up.

import * as THREE from 'three';
import { on } from './events.js';
import { texFlare, TAU } from './util.js';
import { sfx } from './sfx.js';

// --- Shared sky dome -----------------------------------------------------------

const SKY_SHADER = {
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vDir;
    uniform vec3 top, mid, horizon, band1, band2;
    uniform float bandAmt, starMix, flash, time;
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y, -0.2, 1.0);
      vec3 col = mix(horizon, mid, smoothstep(-0.05, 0.3, h));
      col = mix(col, top, smoothstep(0.25, 0.75, h));
      // Drifting energy curtains (storm light / aurora / nebula).
      float c1 = sin(d.x * 7.0 + time * 0.5 + d.y * 11.0);
      float c2 = sin(d.x * 4.0 - time * 0.33 + d.y * 8.0 + 2.4);
      float veil = smoothstep(0.05, 0.6, h);
      col += (band1 * max(c1, 0.0) + band2 * max(c2, 0.0)) * veil * bandAmt;
      // Stars
      vec3 cell = floor(d * 130.0);
      float sh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float star = smoothstep(0.996, 1.0, sh) * (0.55 + 0.45 * sin(time * 2.2 + sh * 70.0));
      col += vec3(0.9, 0.94, 1.0) * star * starMix * smoothstep(0.0, 0.25, h);
      // Lightning / event flash fills the whole dome.
      col += vec3(0.9, 0.95, 1.0) * flash;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

function makeSky(scene, palette) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(palette.top) },
      mid: { value: new THREE.Color(palette.mid) },
      horizon: { value: new THREE.Color(palette.horizon) },
      band1: { value: new THREE.Color(palette.band1 ?? 0x000000) },
      band2: { value: new THREE.Color(palette.band2 ?? 0x000000) },
      bandAmt: { value: palette.bandAmt ?? 0 },
      starMix: { value: palette.starMix ?? 0 },
      flash: { value: 0 },
      time: { value: 0 },
    },
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 14), mat);
  sky.frustumCulled = false;
  scene.add(sky);
  return sky;
}

// --- Shared ambient sprite field (rain / dust / motes) ---------------------------

function makeField(scene, { count, color, size, stretch }) {
  const tex = texFlare(color);
  const sprites = [];
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(size * (stretch || 1) * 0.22, size, 1);
    sp.position.set((Math.random() - 0.5) * 90, Math.random() * 40, (Math.random() - 0.5) * 90);
    sp.userData.seed = Math.random();
    scene.add(sp);
    sprites.push(sp);
  }
  return sprites;
}

function cycleField(sprites, dt, camera, { fall, drift, span, top, visFrac }) {
  const n = Math.round(sprites.length * visFrac);
  for (let i = 0; i < sprites.length; i++) {
    const sp = sprites[i];
    if (i >= n) { sp.visible = false; continue; }
    sp.visible = true;
    sp.position.y -= fall * dt * (0.7 + sp.userData.seed * 0.6);
    sp.position.x += drift * dt * Math.sin(sp.userData.seed * 9);
    if (sp.position.y < 0) {
      sp.position.y = top;
      sp.position.x = camera.position.x + (Math.random() - 0.5) * span;
      sp.position.z = camera.position.z + (Math.random() - 0.5) * span;
    }
  }
}

// --- Maelstrom (Leviathan) ----------------------------------------------------------

const MAELSTROM_WATER = {
  vertexShader: /* glsl */`
    varying vec3 vWorld;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    varying vec3 vWorld;
    uniform float time, churn, flash;
    uniform vec3 deep, shallowC, foam, skyLow, skyHigh;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main() {
      vec2 p = vWorld.xz;
      float r = length(p);
      float ang = atan(p.x, p.y);
      // Spiral swell pulled toward the center — the maelstrom breathes.
      float w1 = sin(r * 0.42 - time * 2.0 + ang * 3.0);
      float w2 = sin(r * 0.21 - time * 1.1 - ang * 2.0 + 1.7);
      float w3 = sin(r * 0.8 - time * 3.1 + ang * 6.0) * 0.4;
      float hgt = (w1 + w2 + w3) * (0.5 + churn * 0.5);
      vec3 col = mix(deep, shallowC, clamp(0.5 + hgt * 0.35, 0.0, 1.0));
      // Analytic-ish sky pickup toward grazing distance
      float dist = length(vWorld - cameraPosition);
      float graze = clamp(dist / 220.0, 0.0, 1.0);
      col = mix(col, mix(skyLow, skyHigh, 0.4), graze * 0.65);
      // Foam ribs along wave crests + churn ring near the center
      float crest = smoothstep(0.75, 1.0, hgt);
      float ring = smoothstep(26.0, 14.0, r) * (0.5 + 0.5 * sin(r * 1.4 - time * 5.0));
      col += foam * (crest * 0.5 + ring * (0.25 + churn * 0.45));
      float sp = hash(floor(p * 1.7) + floor(time * 3.0));
      col += foam * step(0.987, sp) * 0.8;
      col += vec3(0.8, 0.9, 1.0) * flash * 0.5;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function makeMaelstrom(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const sky = makeSky(scene, {
    top: 0x0a1626, mid: 0x16344a, horizon: 0x3a6a78,
    band1: 0x1d6a78, band2: 0x2a4a8a, bandAmt: 0.22, starMix: 0.12,
  });
  scene.fog = new THREE.Fog(0x16344a, 80, 420);

  const sun = new THREE.DirectionalLight(0x9fc8e8, 1.5);
  sun.position.set(-40, 60, -80);
  const hemi = new THREE.HemisphereLight(0x9fd0e8, 0x0a2a3a, 0.85);
  root.add(sun, hemi);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }, churn: { value: 0 }, flash: { value: 0 },
      deep: { value: new THREE.Color(0x07202e) },
      shallowC: { value: new THREE.Color(0x1d5e6e) },
      foam: { value: new THREE.Color(0xbfeef2) },
      skyLow: { value: new THREE.Color(0x3a6a78) },
      skyHigh: { value: new THREE.Color(0x16344a) },
    },
    ...MAELSTROM_WATER,
  });
  const water = new THREE.Mesh(new THREE.CircleGeometry(420, 48), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.4;
  root.add(water);

  // Rock fangs ringing the arena.
  const fangMat = new THREE.MeshStandardMaterial({ color: 0x18262e, roughness: 0.85, flatShading: true });
  const fangGeo = new THREE.ConeGeometry(1, 1, 5);
  const fangs = new THREE.InstancedMesh(fangGeo, fangMat, 26);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + Math.random() * 0.2;
    const r = 60 + Math.random() * 45;
    const s = 4 + Math.random() * 9;
    m4.makeRotationY(Math.random() * TAU);
    m4.setPosition(Math.sin(a) * r, s * 0.3, Math.cos(a) * r);
    m4.scale(new THREE.Vector3(s * 0.5, s, s * 0.5));
    fangs.setMatrixAt(i, m4);
  }
  root.add(fangs);

  const rain = makeField(scene, { count: 170, color: '160,200,235', size: 1.6, stretch: 5 });

  // Tidal wall: a ring of water that rises with the wave attack.
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x2a8aa0, transparent: true, opacity: 0, roughness: 0.3,
    emissive: 0x1d6a80, emissiveIntensity: 0.8, side: THREE.DoubleSide,
  });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(23, 25, 18, 36, 1, true), wallMat);
  wall.position.y = -10;
  root.add(wall);
  let wallT = 0;

  let flash = 0;
  let boltTimer = 4;
  const offFx = on('arenaFx', ({ fx }) => {
    if (fx === 'tidalWall') wallT = 3.6;
  });

  return {
    root,
    tint: 0xeaf6ff,
    update(dt, time, camera, intensity) {
      sky.material.uniforms.time.value = time;
      waterMat.uniforms.time.value = time;
      waterMat.uniforms.churn.value = intensity;
      // Storm strobes more as the fight deepens.
      boltTimer -= dt * (0.7 + intensity);
      if (boltTimer <= 0) {
        boltTimer = 4 + Math.random() * 6;
        flash = 0.55 + Math.random() * 0.3;
        if (Math.random() < 0.7) sfx.thunder();
      }
      flash = Math.max(0, flash - dt * 1.8);
      sky.material.uniforms.flash.value = flash;
      waterMat.uniforms.flash.value = flash;
      cycleField(rain, dt, camera, { fall: 38, drift: 4, span: 80, top: 38, visFrac: this._q });
      if (wallT > 0) {
        wallT -= dt;
        const k = wallT > 2.8 ? (3.6 - wallT) / 0.8 : Math.min(wallT / 2.8, 1);
        wall.position.y = -10 + k * 16;
        wallMat.opacity = 0.55 * k;
      } else {
        wall.position.y = -10;
        wallMat.opacity = 0;
      }
    },
    _q: 1,
    setQuality(q) { this._q = q; },
    dispose() {
      offFx();
      scene.remove(root);
      for (const sp of rain) { scene.remove(sp); sp.material.dispose(); }
      scene.remove(sky);
      sky.material.dispose();
      water.geometry.dispose(); waterMat.dispose();
      fangGeo.dispose(); fangMat.dispose();
      wall.geometry.dispose(); wallMat.dispose();
    },
  };
}

// --- Canyon (Titan) -----------------------------------------------------------------

function makeCanyon(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const sky = makeSky(scene, {
    top: 0x6a4a30, mid: 0xc88a50, horizon: 0xf2c894,
    band1: 0x8a5a2a, band2: 0x6a3a1d, bandAmt: 0.1, starMix: 0,
  });
  scene.fog = new THREE.Fog(0xd8a878, 70, 380);

  const sun = new THREE.DirectionalLight(0xffd8a8, 1.9);
  sun.position.set(50, 70, -40);
  const hemi = new THREE.HemisphereLight(0xffe8c8, 0x4a2e1d, 0.75);
  root.add(sun, hemi);

  // Sand floor with magma cracks that brighten with intensity.
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xb8865a, roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(380, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  root.add(floor);
  const crackMat = new THREE.MeshBasicMaterial({
    color: 0xff6a20, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const cracks = new THREE.Mesh(new THREE.RingGeometry(12, 34, 36, 3), crackMat);
  cracks.rotation.x = -Math.PI / 2;
  cracks.position.y = 0.25;
  root.add(cracks);

  // Mesa walls — layered instanced slabs ringing the fight.
  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x9c6a44, roughness: 0.9, flatShading: true });
  const mesaGeo = new THREE.BoxGeometry(1, 1, 1);
  const mesas = new THREE.InstancedMesh(mesaGeo, mesaMat, 42);
  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const s4 = new THREE.Vector3();
  const p4 = new THREE.Vector3();
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * TAU;
    const r = 70 + (i % 3) * 26 + Math.random() * 14;
    const h = 22 + Math.random() * 30;
    q4.setFromEuler(new THREE.Euler(0, a + Math.random() * 0.4, 0));
    s4.set(16 + Math.random() * 14, h, 10 + Math.random() * 8);
    p4.set(Math.sin(a) * r, h / 2 - 2, Math.cos(a) * r);
    m4.compose(p4, q4, s4);
    mesas.setMatrixAt(i, m4);
  }
  root.add(mesas);

  const dust = makeField(scene, { count: 90, color: '230,190,140', size: 1.1, stretch: 1 });

  // Falling rocks (Gaia's Wrath + ambient menace in late phases).
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6a4a34, roughness: 0.9, flatShading: true });
  const rocks = [];
  for (let i = 0; i < 10; i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), rockMat);
    r.visible = false;
    r.userData = { vy: 0, spin: Math.random() * 2 };
    root.add(r);
    rocks.push(r);
  }
  function dropRock() {
    for (const r of rocks) {
      if (r.visible) continue;
      const a = Math.random() * TAU;
      const rad = 18 + Math.random() * 34;
      r.position.set(Math.sin(a) * rad, 48, Math.cos(a) * rad);
      r.scale.setScalar(0.8 + Math.random() * 1.6);
      r.userData.vy = 0;
      r.visible = true;
      return;
    }
  }
  let wrathT = 0;
  const offFx = on('arenaFx', ({ fx }) => {
    if (fx === 'rockfall') wrathT = 4;
  });

  return {
    root,
    tint: 0xfff0dc,
    update(dt, time, camera, intensity) {
      sky.material.uniforms.time.value = time;
      crackMat.opacity = intensity * (0.35 + Math.sin(time * 2.4) * 0.12);
      cycleField(dust, dt, camera, { fall: 2.5, drift: 7, span: 90, top: 30, visFrac: this._q });
      if (wrathT > 0) { wrathT -= dt; if (Math.random() < dt * 9) dropRock(); }
      else if (intensity > 0.6 && Math.random() < dt * 0.5) dropRock();
      for (const r of rocks) {
        if (!r.visible) continue;
        r.userData.vy += 38 * dt;
        r.position.y -= r.userData.vy * dt;
        r.rotation.x += r.userData.spin * dt * 3;
        r.rotation.z += r.userData.spin * dt * 2;
        if (r.position.y < 0.5) r.visible = false;
      }
    },
    _q: 1,
    setQuality(q) { this._q = q; },
    dispose() {
      offFx();
      scene.remove(root);
      for (const sp of dust) { scene.remove(sp); sp.material.dispose(); }
      scene.remove(sky);
      sky.material.dispose();
      floor.geometry.dispose(); floorMat.dispose();
      cracks.geometry.dispose(); crackMat.dispose();
      mesaGeo.dispose(); mesaMat.dispose();
      rockMat.dispose();
      for (const r of rocks) r.geometry.dispose();
    },
  };
}

// --- Storm Sanctum (Ramuh) -------------------------------------------------------------

const CLOUD_FLOOR = {
  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorld;
    uniform float time, flash;
    uniform vec3 low, high;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    void main() {
      vec2 p = vWorld.xz * 0.03;
      float n = noise(p + time * 0.05) * 0.6 + noise(p * 2.6 - time * 0.07) * 0.4;
      vec3 col = mix(low, high, n);
      col += vec3(0.8, 0.8, 1.0) * flash * (0.4 + n * 0.5);
      float edge = smoothstep(380.0, 180.0, length(vWorld.xz));
      gl_FragColor = vec4(col, edge);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

function makeSanctum(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const sky = makeSky(scene, {
    top: 0x10101e, mid: 0x2a2444, horizon: 0x4a3a66,
    band1: 0x6a4acc, band2: 0x3a2a8a, bandAmt: 0.3, starMix: 0.2,
  });
  scene.fog = new THREE.Fog(0x2a2444, 75, 400);

  const moon = new THREE.DirectionalLight(0xb8a8ff, 1.4);
  moon.position.set(-30, 80, 60);
  const hemi = new THREE.HemisphereLight(0x8a7acc, 0x14101e, 0.8);
  root.add(moon, hemi);

  const cloudMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 }, flash: { value: 0 },
      low: { value: new THREE.Color(0x1d1830) },
      high: { value: new THREE.Color(0x4a4070) },
    },
    ...CLOUD_FLOOR,
  });
  const clouds = new THREE.Mesh(new THREE.CircleGeometry(400, 40), cloudMat);
  clouds.rotation.x = -Math.PI / 2;
  clouds.position.y = 0.4;
  root.add(clouds);

  // Broken floating columns orbiting the sanctum.
  const colMat = new THREE.MeshStandardMaterial({ color: 0x4a4466, roughness: 0.7, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x6a5acc, roughness: 0.4, emissive: 0x4a3aac, emissiveIntensity: 0.7, flatShading: true,
  });
  const columns = [];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const a = (i / 12) * TAU;
    const r = 52 + (i % 3) * 16;
    g.position.set(Math.sin(a) * r, 6 + Math.random() * 16, Math.cos(a) * r);
    g.rotation.z = (Math.random() - 0.5) * 0.4;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 9 + Math.random() * 7, 7), colMat);
    g.add(shaft);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 4), capMat);
    cap.position.y = shaft.geometry.parameters.height / 2 + 0.5;
    g.add(cap);
    g.userData.seed = Math.random() * 10;
    root.add(g);
    columns.push(g);
  }

  const rain = makeField(scene, { count: 150, color: '170,160,235', size: 1.5, stretch: 5 });

  let flash = 0;
  let boltTimer = 3;
  const offFx = on('arenaFx', ({ fx }) => {
    if (fx === 'judgment') { flash = 1.4; sfx.thunder(); }
  });

  return {
    root,
    tint: 0xf2eaff,
    update(dt, time, camera, intensity) {
      sky.material.uniforms.time.value = time;
      cloudMat.uniforms.time.value = time;
      boltTimer -= dt * (0.8 + intensity * 1.4);
      if (boltTimer <= 0) {
        boltTimer = 3 + Math.random() * 5;
        flash = Math.max(flash, 0.5 + Math.random() * 0.4);
        if (Math.random() < 0.65) sfx.thunder();
      }
      flash = Math.max(0, flash - dt * 2);
      sky.material.uniforms.flash.value = flash;
      cloudMat.uniforms.flash.value = flash;
      for (const c of columns) {
        c.position.y += Math.sin(time * 0.5 + c.userData.seed) * dt * 0.5;
        c.rotation.y += dt * 0.05;
      }
      cycleField(rain, dt, camera, { fall: 34, drift: 6, span: 85, top: 40, visFrac: this._q });
    },
    _q: 1,
    setQuality(q) { this._q = q; },
    dispose() {
      offFx();
      scene.remove(root);
      for (const sp of rain) { scene.remove(sp); sp.material.dispose(); }
      scene.remove(sky);
      sky.material.dispose();
      clouds.geometry.dispose(); cloudMat.dispose();
      colMat.dispose(); capMat.dispose();
      for (const c of columns) c.children.forEach((m) => m.geometry && m.geometry.dispose());
    },
  };
}

// --- Void (Bahamut) ---------------------------------------------------------------------

function makeVoid(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const sky = makeSky(scene, {
    top: 0x05060e, mid: 0x0e1226, horizon: 0x1a1438,
    band1: 0x8a2a9c, band2: 0x1d5e9c, bandAmt: 0.5, starMix: 1,
  });
  scene.fog = new THREE.Fog(0x0a0c1a, 90, 460);

  const star = new THREE.DirectionalLight(0xb8d4ff, 1.3);
  star.position.set(40, 70, -60);
  const hemi = new THREE.HemisphereLight(0x4a5a9c, 0x0a0612, 0.8);
  root.add(star, hemi);

  // The bottom falls away into nothing — a faint event-horizon disc.
  const wellMat = new THREE.MeshBasicMaterial({
    color: 0x1d2e6a, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const well = new THREE.Mesh(new THREE.RingGeometry(8, 200, 48), wellMat);
  well.rotation.x = -Math.PI / 2;
  well.position.y = -14;
  root.add(well);

  // Drifting crystal shards catching the god's glow.
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x2a3a6a, roughness: 0.25, metalness: 0.4,
    emissive: 0x4a78d8, emissiveIntensity: 0.6, flatShading: true,
  });
  const shardGeo = new THREE.OctahedronGeometry(1, 0);
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, 34);
  const data = [];
  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const e4 = new THREE.Euler();
  const s4 = new THREE.Vector3();
  const p4 = new THREE.Vector3();
  for (let i = 0; i < 34; i++) {
    data.push({
      a: Math.random() * TAU, r: 48 + Math.random() * 60,
      y: 2 + Math.random() * 34, s: 0.8 + Math.random() * 3,
      spin: Math.random() * 0.6 + 0.1, seed: Math.random() * 10,
    });
  }
  root.add(shards);

  const motes = makeField(scene, { count: 80, color: '170,200,255', size: 0.8, stretch: 1 });

  let flash = 0;
  const offFx = on('arenaFx', ({ fx }) => {
    if (fx === 'megaflare') flash = 1.6;
  });

  return {
    root,
    tint: 0xe8ecff,
    update(dt, time, camera, intensity) {
      sky.material.uniforms.time.value = time;
      sky.material.uniforms.bandAmt.value = 0.5 + intensity * 0.5;
      flash = Math.max(0, flash - dt * 1.6);
      sky.material.uniforms.flash.value = flash;
      well.rotation.z += dt * 0.04;
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        d.a += dt * 0.02;
        e4.set(time * d.spin, d.a, time * d.spin * 0.6);
        q4.setFromEuler(e4);
        p4.set(Math.sin(d.a) * d.r, d.y + Math.sin(time * 0.4 + d.seed) * 1.6, Math.cos(d.a) * d.r);
        s4.setScalar(d.s);
        m4.compose(p4, q4, s4);
        shards.setMatrixAt(i, m4);
      }
      shards.instanceMatrix.needsUpdate = true;
      cycleField(motes, dt, camera, { fall: 1.2, drift: 3, span: 95, top: 42, visFrac: this._q });
    },
    _q: 1,
    setQuality(q) { this._q = q; },
    dispose() {
      offFx();
      scene.remove(root);
      for (const sp of motes) { scene.remove(sp); sp.material.dispose(); }
      scene.remove(sky);
      sky.material.dispose();
      wellMat.dispose(); well.geometry.dispose();
      shardGeo.dispose(); shardMat.dispose();
    },
  };
}

// --- Loader -------------------------------------------------------------------------------

const BUILDERS = { maelstrom: makeMaelstrom, canyon: makeCanyon, sanctum: makeSanctum, void: makeVoid };

let current = null;

export function loadArena(id, scene, quality) {
  if (current) current.dispose();
  current = (BUILDERS[id] || makeMaelstrom)(scene);
  current.setQuality(quality);
  return current;
}

export function currentArena() { return current; }

export function updateArena(dt, time, camera, intensity) {
  if (current) current.update(dt, time, camera, intensity);
}

export function setArenaQuality(q) {
  if (current) current.setQuality(q);
}

export function disposeArena() {
  if (current) { current.dispose(); current = null; }
};
