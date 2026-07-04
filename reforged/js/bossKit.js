import * as THREE from 'three';
import { CONFIG } from './config.js';

const TIERS = CONFIG.BOSS.renderTiers;   // render-order law: nothing draws over a bullet

// Shared boss PLUMBING — the plumbing every boss archetype needs regardless of
// its silhouette: the fresnel energy-shell material, the HP bar, the shield
// bubble + its break-into-shards FX, the dissolve-on-death algorithm, and the
// hit-flash decay. Extracted verbatim out of bossModel.js's old monolithic
// buildBoss() so the legacy construct and every new archetype builder
// (bossIdol.js, bossMandala.js, ...) share ONE implementation of this — no
// copy-paste drift between bosses on things like the shield bubble that
// gameplay code (breakShield, graze-bait) depends on reading correctly.
//
// CONTRACT with boss.js (the controller): it stomps `group.rotation` every
// frame (placeGroup) and `setDissolve` owns `group.scale` — so this kit must
// NEVER animate the root transform outside those two paths. All per-archetype
// animation (jaw pivots, iris rings, etc.) belongs on inner rig groups that
// archetype builders add under `group`.

// stripForMerge: strips `uv` (and `uv2`, which ExtrudeGeometry also emits) so
// every part handed to mergeGeometries carries the exact same attribute SET
// (position+normal only) — mergeGeometries returns null, SILENTLY, on any
// mismatch; there is no error otherwise. It also normalises indexing:
// three.js's Polyhedron-based geometries (Icosahedron, Octahedron) and
// ExtrudeGeometry are built NON-indexed while Box/Cylinder/Sphere/Cone/Torus/
// Tube are indexed — mergeGeometries requires ALL inputs indexed or NONE (a
// second, less-documented way it silently returns null). Promoted here from
// identical copies in bossIdol.js/bossMandala.js once the third archetype
// landed (the BOSS-DESIGN.md §8 backlog item). NOTE: returns a NEW geometry
// when it un-indexes — always reassign (`geo = stripForMerge(geo)`).
export function stripForMerge(geo) {
  geo.deleteAttribute('uv');
  if (geo.attributes.uv2) geo.deleteAttribute('uv2');
  if (geo.index) geo = geo.toNonIndexed();
  return geo;
}

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

// createBossCommon: builds every non-silhouette part of a boss (HP bar, shield
// bubble + shards, dissolve, flash) into a fresh root group and hands back the
// hooks an archetype builder composes with its own body parts. Every material
// an archetype creates must also go through the returned `track()` so the
// dissolve (which fades ALL materials as one) and the finalize() dev-assert
// can see it.
export function createBossCommon(def, quality = 1, {
  shieldRadius = 4.3,
  shieldY = 0,          // vertical offset of the shield bubble (a tall boss centres it on its weak point)
  hpBarY = 4.4,
  hpBarZ = 1.6,
  // Counter-scale for the HP bar: the bar lives inside `group`, so a boss with
  // a big def.scale would wear a proportionally huge bar (barW 8 → 16 world
  // units at scale 2). An archetype passes e.g. 0.75 to keep the bar at the
  // roster's usual on-screen width. Default 1 = byte-identical for the shipped
  // bosses.
  hpBarScale = 1,
  baseScale = def.scale ?? 1.5,
} = {}) {
  const glow = def.glow ?? 0xff88cc;

  const group = new THREE.Group();
  const mats = [];          // every material, for the dissolve
  const track = (m) => { mats.push(m); return m; };

  // --- Health bar: floats above the boss on its front face (so it faces the
  // player), notched at the phase thresholds. Drawn depth-test-off + high render
  // order so it's always legible over the body. ---
  const barW = 8;
  const hpBar = new THREE.Group();
  hpBar.position.set(0, hpBarY, hpBarZ);
  hpBar.scale.setScalar(hpBarScale);
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

  // Shield: raised at a phase floor, only a Dragon Surge unleash bursts it. A
  // filled additive bubble used to sit exactly where bullets spawn and washed
  // them out — replaced by two meshes on ONE shared geometry so the muzzle
  // region reads clear: a fresnel RIM (near-transparent face-on, glows at the
  // silhouette) + a dark geodesic CAGE (dark lines vs a bright sky, additive rim
  // vs a dark one — a two-way luminance edge either way). Both live in the same
  // group, both toggle together, both keep the slow rotation.
  const shieldGeo = new THREE.IcosahedronGeometry(shieldRadius, 1);
  const shieldRimMat = track(makeEnergyShell(glow, { power: 3.0, strength: 0.55 }));
  const shieldRim = new THREE.Mesh(shieldGeo, shieldRimMat);
  shieldRim.renderOrder = TIERS.shield;
  const shieldCageMat = track(new THREE.LineBasicMaterial({
    color: new THREE.Color(glow).multiplyScalar(0.45), transparent: true, opacity: 0.30, depthWrite: false,
  }));
  const shieldCage = new THREE.LineSegments(new THREE.EdgesGeometry(shieldGeo), shieldCageMat);
  shieldCage.renderOrder = TIERS.shield;
  const shield = new THREE.Group();
  shield.position.y = shieldY;
  shield.add(shieldRim, shieldCage);
  shield.visible = false;
  group.add(shield);
  let shieldFlash = 0;   // 1→0 decay driven in tick: a raise flashes the rim strength up, then eases back

  // onShieldChange: optional per-archetype hook (jaw clamp, iris close) fired
  // AFTER the shared bubble logic runs, so an archetype can react to a raise/
  // lower without owning the bubble itself — the bubble stays shared because
  // gameplay (breakShield, graze-bait, bossshot captures) all read it.
  let shieldChangeHook = null;
  function onShieldChange(fn) { shieldChangeHook = fn; }
  function setShieldVisible(v) {
    shield.visible = v;
    if (v) { shatter = 0; for (const s of shards) s.mesh.visible = false; shieldFlash = 1; }  // re-arm + flash on raise
    if (shieldChangeHook) shieldChangeHook(v);
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
    m.renderOrder = TIERS.shield;
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
      s.mesh.position.set(d.x * shieldRadius, d.y * shieldRadius, d.z * shieldRadius);   // start on the bubble surface
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

  // finalize(): call once the archetype builder has added ALL its body parts +
  // tracked ALL its materials. Caches base opacities for the dissolve and
  // applies the boss's resting scale. The dev assert below guards the exact
  // failure mode risk #1 in the plan calls out: the dissolve traverses every
  // material via `mats`, so any material an archetype forgets to `track()`
  // would silently not fade — warn loudly in dev instead of shipping that bug.
  function finalize() {
    for (const m of mats) m.userData.baseOpacity = m.transparent ? m.opacity : 1;
    group.scale.setScalar(baseScale);
    group.traverse((o) => {
      if (o.material && !mats.includes(o.material)) {
        console.warn('[bossKit] material on', o.name || o.type, 'was never track()ed — dissolve will miss it');
      }
    });
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
    group.scale.setScalar(baseScale * spread);
  }

  // Hit flash: a quick emissive spike (decayed in tickCommon). Generalised from
  // the old hardcoded `coreMat.emissiveIntensity` write so any archetype can
  // bind whichever material is its "core" read.
  let flashMat = null;
  let flashBase = 0;
  let flashAmt = 0;
  function flashBind(mat, baseIntensity) { flashMat = mat; flashBase = baseIntensity; }
  function flash(amt) { flashAmt = Math.max(flashAmt, amt); }
  function tickFlash(dt) {
    if (flashAmt <= 0) return;
    flashAmt = Math.max(0, flashAmt - dt * 3);
    if (flashMat) flashMat.emissiveIntensity = flashBase + flashAmt * 4;
  }

  // tickCommon: shield rotation/pulse/raise-flash decay, shard fling, flash
  // decay. Archetype builders run their own body tick FIRST, then this LAST —
  // that write order matters where both touch the same material (e.g. the
  // legacy core's emissiveIntensity is written by both the charge flare and
  // the flash; flash must win on the later write to match today's behavior).
  function tickCommon(dt, time) {
    if (shield.visible) {
      shield.rotation.y += dt * 0.9;
      shield.rotation.x += dt * 0.5;
      // Rim strength pulses gently around its base; a raise (setShieldVisible)
      // kicks shieldFlash to 1 and it decays back over ~0.4s, flashing the rim
      // to ~1.2 on the moment of the shield going up.
      if (shieldFlash > 0) shieldFlash = Math.max(0, shieldFlash - dt / 0.4);
      shieldRimMat.uniforms.uStrength.value = 0.55 + Math.sin(time * 4) * 0.15 + shieldFlash * 0.65;
    }
    tickShatter(dt);
    tickFlash(dt);
  }

  return {
    group, mats, track,
    setHealth, setHealthBarVisible,
    setShieldVisible, shatterShield, onShieldChange,
    finalize, setDissolve,
    flashBind, flash,
    tickCommon,
  };
}
