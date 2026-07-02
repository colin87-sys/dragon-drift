import * as THREE from 'three';

// Fresnel ENERGY SHELL — a reusable additive material that glows at grazing
// angles (the silhouette edge) and is near-transparent face-on. This is the
// house "reads cleanly against a bright sky" trick (see rimLight.js) packaged as
// a standalone material so the boss body, its shield, and the Surge aura all get
// a premium 3D energy read instead of looking like flat additive blobs. Zero
// assets; `uTime`/`uStrength` are driven per frame for a live pulse.
export function makeEnergyShell(color, { power = 2.4, strength = 1.0, opacity = 1.0 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uStrength: { value: strength },
      uOpacity: { value: opacity },
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uPower; uniform float uStrength; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - clamp(dot(vN, vV), 0.0, 1.0), uPower);
        gl_FragColor = vec4(uColor, f * uStrength * uOpacity);
      }`,
  });
}

// Procedural boss creature — asset-free, like everything else in the game.
// This is deliberately NOT a dragon: a floating eldritch crystal construct (a
// jagged core ringed with spikes, a glowing maw and two eyes, plus a few
// orbiting shards), so the boss reads as an "other" against the dragon roster.
//
// Returns a handle the controller (boss.js) drives:
//   { group, muzzle, orbiters[], setDissolve(k), flash(amt), tick(dt, time) }
// All materials are collected so the disintegration death can fade them as one.

export function buildBoss(def, quality = 1) {
  const accent = def.accent ?? 0xff4488;
  const glow = def.glow ?? 0xff88cc;
  // Nullable BODY RECIPE: silhouette knobs so each boss reads distinct at 30m.
  // Defaults reproduce the original construct (Voidmaw) exactly — a def with no
  // `body` is byte-identical to before this recipe existed (coexist rule).
  // This is knobs on ONE construct, deliberately NOT a creature system.
  const body = {
    silhouette: 'orb',        // 'orb' | 'shard' (elongated prow — bakes a stretch)
    spikeCount: null,         // null = legacy quality-based 6/8
    spikeLen: 2.4,
    spikeSweep: 0,            // 0 = radial crown; >0 sweeps the vanes backward
    orbiterStyle: 'shard',    // 'shard' octa chips | 'ringBlade' spinning blades
    orbiterCount: null,       // null = legacy quality-based 2/3
    eyeCount: 2,
    coreDetail: 1,
    ...(def.body || {}),
  };
  // The boss holds ~30m ahead; at that range the base primitives read small and
  // get lost against the horizon. Scale the whole construct up so it's an
  // imposing centrepiece (the dissolve multiplies from this base, not 1).
  const BASE_SCALE = def.scale ?? 1.5;
  const group = new THREE.Group();
  const mats = [];          // every material, for the dissolve
  const track = (m) => { mats.push(m); return m; };

  // 'shard' silhouette: bake an elongation into the body geometries (geometry-
  // level so the tick's animated scale.setScalar never fights a static scale).
  const stretch = (geo) => {
    if (body.silhouette === 'shard') geo.scale(0.82, 0.82, 1.5);
    return geo;
  };

  // --- Core: a dark faceted body with a strong emissive accent. Brighter than a
  // normal prop so the bloom pass catches it and it reads as a threat, not scenery.
  const coreMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0e22, emissive: accent, emissiveIntensity: 1.5,
    roughness: 0.35, metalness: 0.45, flatShading: true,
  }));
  const core = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(2.2, body.coreDetail)), coreMat);
  group.add(core);

  // Molten INNER CORE: a small bright sphere pulsing inside the faceted shell,
  // seen through the gaps — the "contained energy" read (drives the bloom).
  const innerMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const innerCore = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(1.5, body.coreDetail)), innerMat);
  group.add(innerCore);

  // Fresnel ENERGY SHELL: glows at the silhouette edge so the boss pops against a
  // bright sky or the horizon city (the flat additive shell it replaces vanished).
  const shellMat = track(makeEnergyShell(glow, { power: 2.2, strength: 1.15, opacity: 1.0 }));
  const shell = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(2.9, 2)), shellMat);
  group.add(shell);
  // A wider, softer outer halo shell for atmosphere/scale.
  const haloMat = track(makeEnergyShell(accent, { power: 3.2, strength: 0.6, opacity: 1.0 }));
  const halo = new THREE.Mesh(stretch(new THREE.IcosahedronGeometry(3.9, 2)), haloMat);
  group.add(halo);

  // --- Spike crown: cones jutting out around the equator (spikeSweep > 0 tilts
  // them backward into swept storm-vanes — a clearly different silhouette) ---
  const spikeMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0f20, emissive: accent, emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.35, flatShading: true,
  }));
  const spikeGeo = new THREE.ConeGeometry(0.55, body.spikeLen, 5);
  const spikeCount = body.spikeCount != null
    ? (quality < 0.75 ? Math.max(4, body.spikeCount - 2) : body.spikeCount)
    : (quality < 0.75 ? 6 : 8);
  const UP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2;
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    s.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0);
    if (body.spikeSweep > 0) {
      // Orient the cone outward + backward (away from the player-facing +z).
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), -body.spikeSweep).normalize();
      s.quaternion.setFromUnitVectors(UP, dir);
    } else {
      s.rotation.z = a - Math.PI / 2;       // legacy radial crown (Voidmaw)
    }
    group.add(s);
  }

  // --- Maw: a glowing ring + inner cone on the FRONT face (local +z = toward player) ---
  const mawMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const maw = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.28, 8, 16), mawMat);
  maw.position.z = 1.9;
  group.add(maw);
  const throatMat = track(new THREE.MeshBasicMaterial({
    color: accent, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 12), throatMat);
  throat.position.z = 1.3;
  throat.rotation.x = -Math.PI / 2;       // open end toward the player
  group.add(throat);

  // --- Eyes: emissive sparks over the maw (2 = flanking pair; 1 = a single
  // larger cyclops storm-eye — a distinct face read per boss) ---
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ff }));
  if (body.eyeCount === 1) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), eyeMat);
    eye.position.set(0, 1.05, 1.9);
    group.add(eye);
  } else {
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), eyeMat);
      eye.position.set(sx * 1.0, 1.0, 1.9);
      group.add(eye);
    }
  }

  // --- Orbiters (animated by the controller): octa chips, or thin spinning
  // ring-blades for a bladed-storm read ---
  const shardMat = track(new THREE.MeshStandardMaterial({
    color: 0x281030, emissive: glow, emissiveIntensity: 0.7,
    roughness: 0.3, metalness: 0.4, flatShading: true,
  }));
  const shardGeo = body.orbiterStyle === 'ringBlade'
    ? new THREE.TorusGeometry(0.62, 0.11, 6, 14)
    : new THREE.OctahedronGeometry(0.6, 0);
  const orbiters = [];
  const shardCount = body.orbiterCount != null
    ? (quality < 0.75 ? Math.max(2, body.orbiterCount - 1) : body.orbiterCount)
    : (quality < 0.75 ? 2 : 3);
  for (let i = 0; i < shardCount; i++) {
    const m = new THREE.Mesh(shardGeo, shardMat);
    m.userData = {
      ang: (i / shardCount) * Math.PI * 2,
      radius: 3.6 + i * 0.4,
      speed: 1.1 + i * 0.25,
      baseY: 0,
      tilt: i * 0.5,
    };
    group.add(m);
    orbiters.push(m);
  }

  // --- Health bar: floats above the boss on its front face (so it faces the
  // player), notched at the phase thresholds. Drawn depth-test-off + high render
  // order so it's always legible over the body. ---
  const barW = 8;
  const hpBar = new THREE.Group();
  hpBar.position.set(0, 4.4, 1.6);
  const barBgMat = track(new THREE.MeshBasicMaterial({ color: 0x0a0610, transparent: true, opacity: 0.72, depthTest: false }));
  const barBg = new THREE.Mesh(new THREE.PlaneGeometry(barW + 0.3, 0.62), barBgMat);
  barBg.renderOrder = 998;
  hpBar.add(barBg);
  const fillWrap = new THREE.Group();      // scale.x from the LEFT edge
  fillWrap.position.x = -barW / 2;
  const barFillMat = track(new THREE.MeshBasicMaterial({ color: 0xff4468, transparent: true, depthTest: false }));
  const barFill = new THREE.Mesh(new THREE.PlaneGeometry(barW, 0.44), barFillMat);
  barFill.position.x = barW / 2;           // left edge sits at the wrapper origin
  barFill.renderOrder = 999;
  fillWrap.add(barFill);
  hpBar.add(fillWrap);
  const notchMat = track(new THREE.MeshBasicMaterial({ color: 0x0a0610, transparent: true, opacity: 0.85, depthTest: false }));
  for (const p of (def.phases || [])) {
    if (p.atFrac >= 0.999) continue;       // full-hp threshold isn't a divider
    const notch = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.6), notchMat);
    notch.position.set(-barW / 2 + p.atFrac * barW, 0, 0.02);
    notch.renderOrder = 1000;
    hpBar.add(notch);
  }
  hpBar.visible = false;   // hidden during the fly-in; revealed once it settles ahead
  group.add(hpBar);
  function setHealth(frac) { fillWrap.scale.x = Math.max(0.0001, Math.min(1, frac)); }
  function setHealthBarVisible(v) { hpBar.visible = v; }

  // Shield bubble: raised at a phase floor, only a Dragon Surge unleash bursts it.
  const shieldMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  }));
  const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(4.3, 1), shieldMat);
  shield.visible = false;
  group.add(shield);
  function setShieldVisible(v) {
    shield.visible = v;
    if (v) { shatter = 0; for (const s of shards) s.mesh.visible = false; }  // re-arm on raise
  }

  // Shield SHARDS: faceted chips that the bubble breaks into when a Surge beam
  // bursts it. Pre-built (asset-free) and hidden; shatterShield() flings them
  // outward along their own radial + spin, fading over ~0.7s (driven in tick).
  const shardChipMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide,
  }));
  const chipGeo = new THREE.TetrahedronGeometry(0.7, 0);
  const shards = [];
  const shardN = quality < 0.75 ? 8 : 14;
  for (let i = 0; i < shardN; i++) {
    const m = new THREE.Mesh(chipGeo, shardChipMat);
    m.visible = false;
    // Even-ish spread over a sphere (golden-angle) so the break looks like a bubble.
    const y = 1 - (i / Math.max(shardN - 1, 1)) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const ph = i * 2.399963;
    const dir = new THREE.Vector3(Math.cos(ph) * rr, y, Math.sin(ph) * rr);
    m.userData = { dir, spin: new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6) };
    group.add(m);
    shards.push({ mesh: m });
  }
  let shatter = 0;   // 0 = idle; >0 counts UP while shards fly (seconds since burst)
  function shatterShield() {
    shield.visible = false;
    shatter = 0.0001;
    for (const s of shards) {
      const d = s.mesh.userData.dir;
      s.mesh.position.set(d.x * 4.3, d.y * 4.3, d.z * 4.3);   // start on the bubble surface
      s.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      s.mesh.scale.setScalar(1);
      s.mesh.visible = true;
    }
  }
  function tickShatter(dt) {
    if (shatter <= 0) return;
    shatter += dt;
    const k = shatter / 0.7;                 // 0→1 over the fling
    if (k >= 1) { shatter = 0; for (const s of shards) s.mesh.visible = false; return; }
    for (const s of shards) {
      const u = s.mesh.userData;
      s.mesh.position.addScaledVector(u.dir, dt * 22);           // fly outward
      s.mesh.rotation.x += u.spin.x * dt;
      s.mesh.rotation.y += u.spin.y * dt;
      s.mesh.scale.setScalar(1 - k * 0.6);
    }
    shardChipMat.opacity = 0.9 * (1 - k);
  }

  // Cache base opacities so the dissolve can scale from each material's own value.
  for (const m of mats) m.userData.baseOpacity = m.transparent ? m.opacity : 1;

  // Telegraph charge level 0→1: the maw flares (toward danger-red) and the throat
  // swells just before an attack releases, so the player gets a fair wind-up read.
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  function tick(dt, time) {
    core.rotation.y += dt * 0.5;
    core.rotation.x += dt * 0.18;
    innerCore.rotation.y -= dt * 0.7;
    shell.rotation.y -= dt * 0.3;
    halo.rotation.y += dt * 0.15;
    const pulse = 0.85 + Math.sin(time * 3) * 0.15;
    // Molten inner core breathes (brighter + swelling as it charges an attack).
    innerCore.scale.setScalar(1 + Math.sin(time * 4) * 0.08 + charge * 0.35);
    innerMat.opacity = (0.7 + Math.sin(time * 5) * 0.2) * pulse + charge * 0.3;
    // Fresnel shells pulse their rim strength (and flare hot on a charge).
    shellMat.uniforms.uStrength.value = 1.0 + Math.sin(time * 2.4) * 0.25 + charge * 0.8;
    haloMat.uniforms.uStrength.value = 0.5 + Math.abs(Math.sin(time * 1.7)) * 0.2 + charge * 0.4;
    mawMat.opacity = 0.6 + Math.sin(time * 5) * 0.25 + charge * 0.9;
    throat.scale.setScalar(1 + charge * 0.6);
    throatMat.opacity = 0.85 + charge * 0.15;
    throatMat.color.setHex(0xff3010).lerp(new THREE.Color(accent), 1 - charge); // reddens as it charges
    coreMat.emissiveIntensity = 1.5 + charge * 1.8;
    if (shield.visible) {
      shield.rotation.y += dt * 0.9;
      shield.rotation.x += dt * 0.5;
      shieldMat.opacity = 0.18 + Math.abs(Math.sin(time * 4)) * 0.22;
    }
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.6 + u.tilt) * 0.5,
        Math.sin(u.ang) * u.radius
      );
      o.rotation.x += dt * 2;
      o.rotation.y += dt * 1.4;
    }
  }

  // Disintegration: k 0→1 fades every material to nothing and blows the emissive
  // toward white so the creature "burns out" as it scatters.
  let dissolve = 0;
  function setDissolve(k) {
    dissolve = Math.max(0, Math.min(1, k));
    const a = 1 - dissolve;
    for (const m of mats) {
      m.transparent = true;
      m.opacity = (m.userData.baseOpacity ?? 1) * a;
      // Fresnel energy shells carry opacity in a uniform, not material.opacity.
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = (m.userData.baseOpacity ?? 1) * a;
      if (m.emissive) {
        m.emissiveIntensity = 0.5 + dissolve * 3.5;
        m.emissive.lerp(new THREE.Color(0xffffff), dissolve * 0.06);
      }
    }
    // Scatter the spikes/shards outward as it comes apart.
    const spread = 1 + dissolve * 0.6;
    group.scale.setScalar(BASE_SCALE * spread);
  }

  // Hit flash: a quick emissive spike (decayed by the controller).
  let flashAmt = 0;
  function flash(amt) { flashAmt = Math.max(flashAmt, amt); }
  function tickFlash(dt) {
    if (flashAmt <= 0) return;
    flashAmt = Math.max(0, flashAmt - dt * 3);
    coreMat.emissiveIntensity = 1.5 + flashAmt * 4;
  }

  // A front-facing node so FX (and future muzzle flashes) can originate at the maw.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 2.4);
  group.add(muzzle);

  group.scale.setScalar(BASE_SCALE);   // imposing at its ~30m hold distance

  return {
    group, muzzle, orbiters,
    setDissolve,
    setCharge,
    setHealth,
    setHealthBarVisible,
    setShieldVisible,
    shatterShield,
    flash,
    tick(dt, time) { tick(dt, time); tickFlash(dt); tickShatter(dt); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
