import * as THREE from 'three';

// SKYFORGED GLASS — the shared premium material language for the Sky Canyon
// collectibles (the Windvault gate now; the Star Shard orb + Jade Annulus ring
// later). Every marker reads as LIGHT SUSPENDED IN FORGED, FACETED GLASS.
//
// It is an OPAQUE emissive MeshStandardMaterial — the right call over anything
// additive here: it blooms in postfx, sorts trivially, and dodges the only perf
// cliff (overdraw). One `onBeforeCompile` adds three premium terms, all driven
// off a per-vertex ABSTRACT ramp attribute `glowT` (0 = root/aft/outer, 1 =
// apex/tip/inner-lip — the GEOMETRY decides what the ramp means; there is no
// world-Y or "up" assumption baked into the GLSL, so the same program serves the
// arch, the shard and the annulus):
//   1. an AXIAL EMISSIVE GRADIENT along glowT through a 3-stop palette
//      (uRoot -> uMid -> uApex) — the "one ramp per role" premium principle;
//   2. a FRESNEL RIM (view-dependent edge catch) — the forged-glass material story
//      (discrete facet glints, not a plastic tube glow — feed it FLAT normals);
//   3. a FLOW phase: `uFlow` (0..1) drives a bright FRONT that CLIMBS the ramp plus
//      an overall intensity lift, so the marker breathes with the run's momentum;
//      `uTime` adds a subtle idle shimmer.
//
// Palette + drivers are UNIFORMS (never string-baked constants) so gate/orb/ring
// all compile to ONE program (`customProgramCacheKey` = 'markerSurface'). The
// drivers are SHARED VALUE OBJECTS passed in by the caller:
//   - `timeRef` is globally shared (one write/frame for every marker).
//   - `flowRef` is per-ROLE, and may be per-INSTANCE: the flow gate passes the
//     slipMix-driven object; the (global) orb/ring can pass their own driver —
//     global markers must NOT be forced onto the flow-only slip stream. Rings
//     already clone a material per instance (feverGlow / collect-flash), so a
//     per-instance flowRef stays compatible.
//
// glowT semantics: a plain abstract 0->1 ramp. Bake it onto EVERY geometry that
// merges into one marker mesh (incl. the keystone at ~1.0) so `mergeGeometries`
// sees a matching attribute set and never returns null.
export function makeMarkerSurface(opts = {}) {
  const {
    rootColor = 0x1f8fd8,   // deep slip-cyan (root / aft / outer)
    midColor = 0x59d8ff,    // slip-cyan — the flow signature (continuity with the ribbon orbs)
    apexColor = 0xd6f4ff,   // ice-white hot core (apex / tip / inner-lip)
    flowRef = { value: 0 }, // per-role 0..1 driver (gate: slipMix)
    timeRef = { value: 0 }, // globally shared clock
    rimPower = 2.4,
    emissive = 1.7,         // base emissive scale (pre-flow)
  } = opts;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,                       // near-black body so the emissive carries the read
    emissive: new THREE.Color(apexColor),  // placeholder; the patch overrides totalEmissiveRadiance
    emissiveIntensity: emissive,
    roughness: 0.34,
    metalness: 0.0,
  });
  // Kept on the material so the caller can hand the SAME driver objects to
  // updateObstacles without re-plumbing (and so a per-instance clone keeps them).
  mat.userData.markerUniforms = {
    uRoot: { value: new THREE.Color(rootColor) },
    uMid: { value: new THREE.Color(midColor) },
    uApex: { value: new THREE.Color(apexColor) },
    uFlow: flowRef,
    uTime: timeRef,
    uRimPow: { value: rimPower },
    uEmisScale: { value: emissive },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.markerUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glowT;\nvarying float vGlowT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlowT = glowT;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        `#include <common>
         uniform vec3 uRoot; uniform vec3 uMid; uniform vec3 uApex;
         uniform float uFlow; uniform float uTime; uniform float uRimPow; uniform float uEmisScale;
         varying float vGlowT;`)
      // Splice at emissivemap_fragment: `normal` (flat, from normal_fragment_begin)
      // and `vViewPosition` are both already in scope, and totalEmissiveRadiance is
      // declared just above — we OWN the emissive here.
      .replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         {
           float gt = clamp(vGlowT, 0.0, 1.0);
           // 3-stop axial ramp (root -> mid -> apex)
           vec3 ramp = gt < 0.5 ? mix(uRoot, uMid, gt * 2.0) : mix(uMid, uApex, (gt - 0.5) * 2.0);
           // forged-glass fresnel edge catch (FLAT normals -> discrete facet glints)
           vec3 Vd = normalize(vViewPosition);
           float fres = pow(1.0 - clamp(dot(normalize(normal), Vd), 0.0, 1.0), uRimPow);
           // subtle idle shimmer travelling along the ramp
           float shim = 0.86 + 0.14 * sin(uTime * 2.4 + gt * 6.2831853);
           // FLOW: a bright front that climbs the ramp as uFlow rises + an overall lift
           float front = smoothstep(0.16, 0.0, abs(gt - uFlow));
           float lift = 1.0 + 0.7 * uFlow + 1.1 * front;
           vec3 emis = ramp * shim * lift + uApex * fres * (0.55 + 0.9 * uFlow);
           totalEmissiveRadiance = emis * uEmisScale;
         }`);
  };
  mat.customProgramCacheKey = () => 'markerSurface';
  return mat;
}

// Bake the abstract `glowT` ramp onto a geometry as a Float32 attribute. `fn`
// receives (x, y, z) of each vertex and returns its 0..1 ramp value. Call it on
// EVERY geometry before merging so the merged attribute set matches (a constant
// like the keystone still needs the attribute present).
export function bakeGlowT(geom, fn) {
  const pos = geom.getAttribute('position');
  const t = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) t[i] = fn(pos.getX(i), pos.getY(i), pos.getZ(i));
  geom.setAttribute('glowT', new THREE.BufferAttribute(t, 1));
  return geom;
}
