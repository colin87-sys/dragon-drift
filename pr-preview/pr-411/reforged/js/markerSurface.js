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
    rootColor = 0x0c63c8,   // D2: deeper, more saturated cyan glass (root / aft / outer)
    midColor = 0x3fc8ff,    // slip-cyan — the flow signature (continuity with the ribbon orbs)
    apexColor = 0xbfeeff,   // D2: icy hot core — NOT pure white, so it keeps cyan when hot
    flowRef = { value: 0 }, // per-role 0..1 driver (gate: slipMix; orb: chain/boost heat)
    timeRef = { value: 0 }, // globally shared clock
    rimPower = 3.4,         // D1: narrower rim → the glint concentrates on facet edges
    emissive = 1.7,         // base emissive scale (pre-flow)
    hotLift = 0.55,         // D2: uFlow intensity contribution (tunable so hot doesn't fully white out)
    side = THREE.FrontSide, // small closed markers (the Star Shard) pass DoubleSide so winding can't hide them
    glint = 0,              // GLINT master (0 = OFF → the term is exactly 0.0, factory identity until opt-in)
    glintSharp = 36,        // tight specular exponent (per-role: bigger facets want higher; small facets lower)
    glintDir = [0.35, 0.5, 0.78], // fixed VIEW-SPACE "studio key" — flat facet normals sweeping past it sparkle
    lipGlow = 0,            // ALWAYS-ON hot glow at the high-glowT end (0 = OFF). The ring uses it so the inner
                            // aperture lip reads as a bright rim at flight distance (not only during fever/combo).
  } = opts;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a12,                       // near-black body so the emissive carries the read
    emissive: new THREE.Color(apexColor),  // placeholder; the patch overrides totalEmissiveRadiance
    emissiveIntensity: emissive,
    roughness: 0.34,
    metalness: 0.0,
    side,
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
    uHotLift: { value: hotLift },
    uGlint: { value: glint },
    uGlintSharp: { value: glintSharp },
    uGlintDir: { value: new THREE.Vector3(glintDir[0], glintDir[1], glintDir[2]).normalize() },
    uLipGlow: { value: lipGlow },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.markerUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glowT;\nattribute float facetJ;\nvarying float vGlowT;\nvarying float vFacetJ;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vGlowT = glowT;\n  vFacetJ = facetJ;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        `#include <common>
         uniform vec3 uRoot; uniform vec3 uMid; uniform vec3 uApex;
         uniform float uFlow; uniform float uTime; uniform float uRimPow; uniform float uEmisScale; uniform float uHotLift;
         uniform float uGlint; uniform float uGlintSharp; uniform vec3 uGlintDir; uniform float uLipGlow;
         varying float vGlowT; varying float vFacetJ;`)
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
           // FLOW: a bright front that climbs the ramp as uFlow rises + an overall lift.
           // D1: per-facet jitter (centered → a missing attribute defaults 0 → factor 0.9,
           // never black) so the discrete glints survive bloom instead of washing to a tube.
           float front = smoothstep(0.16, 0.0, abs(gt - uFlow));
           float lift = (1.0 + uHotLift * uFlow + 0.9 * front) * (0.9 + 0.2 * vFacetJ);
           // D2: less white-out — smaller apex-fres term, and uApex keeps cyan (see palette).
           vec3 emis = ramp * shim * lift + uApex * fres * (0.5 + 0.7 * uFlow);
           // Sharper specular GLINT (owner-approved 8.5→9 lever): a tight highlight per FLAT facet
           // against a fixed view-space key. Adjacent facets differ → some catch it → the gem
           // sparkles as it rolls / the camera approaches. uGlint=0 → exactly 0 (factory identity).
           float glint = pow(clamp(dot(normalize(normal), uGlintDir), 0.0, 1.0), uGlintSharp);
           emis += uApex * glint * (0.6 + 0.4 * vFacetJ) * uGlint;
           // Always-on hot LIP at the high-glowT end — the ring's bright aperture rim, so the
           // upgrade reads at flight distance (not only during fever/combo). uLipGlow=0 → identity.
           emis += uApex * smoothstep(0.62, 1.0, gt) * uLipGlow;
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

// Deterministic per-face hash in [0,1]. Geometry builders must bake facet jitter from
// a pure INDEX hash — NEVER by drawing from a seeded gameplay rng stream, which would
// shift downstream consumers (a determinism break, not just a Math.random one).
export function facetHash(n) { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }

// Bake a constant `glowT`/`facetJ` value across a whole geometry — for a merge piece
// that must carry the attribute (matching set → mergeGeometries never returns null)
// but has no ramp of its own (e.g. the Windvault keystone).
export function bakeConst(geom, name, value) {
  const n = geom.getAttribute('position').count;
  geom.setAttribute(name, new THREE.BufferAttribute(new Float32Array(n).fill(value), 1));
  return geom;
}

// Bake `facetJ` per TRIANGLE for a NON-INDEXED geometry where each triangle IS a facet
// (e.g. the octahedron/bipyramid-derived Star Shard). For QUAD facets (the Windvault
// tube) bake inline with a per-QUAD id so both tris of a facet share one value.
export function bakeFacetJitterPerTri(geom) {
  const pos = geom.getAttribute('position');
  const t = new Float32Array(pos.count);
  for (let v = 0; v < pos.count; v += 3) { const j = facetHash(v / 3); t[v] = j; t[v + 1] = j; t[v + 2] = j; }
  geom.setAttribute('facetJ', new THREE.BufferAttribute(t, 1));
  return geom;
}
