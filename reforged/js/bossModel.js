import * as THREE from 'three';

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
  const group = new THREE.Group();
  const mats = [];          // every material, for the dissolve
  const track = (m) => { mats.push(m); return m; };

  // --- Core: a dark faceted body with an emissive accent ---
  const coreMat = track(new THREE.MeshStandardMaterial({
    color: 0x140a18, emissive: accent, emissiveIntensity: 0.9,
    roughness: 0.45, metalness: 0.3, flatShading: true,
  }));
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), coreMat);
  group.add(core);

  // Inner glow shell — a slightly larger transparent shell that reads as energy.
  const auraMat = track(new THREE.MeshBasicMaterial({
    color: glow, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const aura = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 1), auraMat);
  group.add(aura);

  // --- Spike crown: cones jutting out around the equator ---
  const spikeMat = track(new THREE.MeshStandardMaterial({
    color: 0x1a0f20, emissive: accent, emissiveIntensity: 0.5,
    roughness: 0.4, metalness: 0.35, flatShading: true,
  }));
  const spikeGeo = new THREE.ConeGeometry(0.55, 2.4, 5);
  const spikeCount = quality < 0.75 ? 6 : 8;
  for (let i = 0; i < spikeCount; i++) {
    const a = (i / spikeCount) * Math.PI * 2;
    const s = new THREE.Mesh(spikeGeo, spikeMat);
    s.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0);
    s.rotation.z = a - Math.PI / 2;       // point outward
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

  // --- Eyes: two emissive sparks flanking the maw ---
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff2ff }));
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), eyeMat);
    eye.position.set(sx * 1.0, 1.0, 1.9);
    group.add(eye);
  }

  // --- Orbiting shards (animated by the controller) ---
  const shardMat = track(new THREE.MeshStandardMaterial({
    color: 0x281030, emissive: glow, emissiveIntensity: 0.7,
    roughness: 0.3, metalness: 0.4, flatShading: true,
  }));
  const shardGeo = new THREE.OctahedronGeometry(0.6, 0);
  const orbiters = [];
  const shardCount = quality < 0.75 ? 2 : 3;
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
  group.add(hpBar);
  function setHealth(frac) { fillWrap.scale.x = Math.max(0.0001, Math.min(1, frac)); }

  // Cache base opacities so the dissolve can scale from each material's own value.
  for (const m of mats) m.userData.baseOpacity = m.transparent ? m.opacity : 1;

  // Telegraph charge level 0→1: the maw flares (toward danger-red) and the throat
  // swells just before an attack releases, so the player gets a fair wind-up read.
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  function tick(dt, time) {
    core.rotation.y += dt * 0.5;
    core.rotation.x += dt * 0.18;
    aura.rotation.y -= dt * 0.3;
    const pulse = 0.85 + Math.sin(time * 3) * 0.15;
    mawMat.opacity = 0.6 + Math.sin(time * 5) * 0.25 + charge * 0.9;
    auraMat.opacity = (0.14 + Math.sin(time * 2) * 0.06) * pulse + charge * 0.3;
    throat.scale.setScalar(1 + charge * 0.6);
    throatMat.opacity = 0.85 + charge * 0.15;
    throatMat.color.setHex(0xff3010).lerp(new THREE.Color(accent), 1 - charge); // reddens as it charges
    coreMat.emissiveIntensity = 0.9 + charge * 1.6;
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
      if (m.emissive) {
        m.emissiveIntensity = 0.5 + dissolve * 3.5;
        m.emissive.lerp(new THREE.Color(0xffffff), dissolve * 0.06);
      }
    }
    // Scatter the spikes/shards outward as it comes apart.
    const spread = 1 + dissolve * 0.6;
    group.scale.setScalar(spread);
  }

  // Hit flash: a quick emissive spike (decayed by the controller).
  let flashAmt = 0;
  function flash(amt) { flashAmt = Math.max(flashAmt, amt); }
  function tickFlash(dt) {
    if (flashAmt <= 0) return;
    flashAmt = Math.max(0, flashAmt - dt * 3);
    coreMat.emissiveIntensity = 0.9 + flashAmt * 4;
  }

  // A front-facing node so FX (and future muzzle flashes) can originate at the maw.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 2.4);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    setDissolve,
    setCharge,
    setHealth,
    flash,
    tick(dt, time) { tick(dt, time); tickFlash(dt); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
