import * as THREE from 'three';

// Fresnel rim light for the dragon. A few ALU injected into the standard
// material via onBeforeCompile: grazing-angle fragments (the silhouette edge)
// get an additive light tint, so the hero reads cleanly against a bright sky or
// blown-out water. Zero assets, zero extra draw calls — it rides the dragon's
// existing forward pass.
//
// The injection is ADDITIVE to outgoingLight and fully independent of the heavy
// emissive animation in dragon.js (body/wing/spine glow), so the two never fight.

// Per-material uniform sets, updated together each frame by updateRim().
let registry = [];

const RIM_INJECT = /* glsl */`
  // --- fresnel rim ---
  {
    float _rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
    outgoingLight += uRimColor * pow(_rimF, uRimPower) * uRimStrength;
  }
  #include <opaque_fragment>`;

// Attach a rim to one MeshStandardMaterial. Returns the uniform set (also
// pushed to the registry) in case a caller wants per-material control.
export function applyRim(material, { color = 0xfff0d8, power = 3.0, strength = 0.0, mul = 1, wing = false } = {}) {
  if (!material || material.userData.__rim) return material.userData.__rim;
  const u = {
    uRimColor: { value: new THREE.Color(color) },
    uRimPower: { value: power },
    uRimStrength: { value: strength },
    mul,                                  // per-material scale (e.g. matte hides dim their rim)
    wing,                                 // flat faceted wing panels take a per-biome backlit BOOST damped (Fable 79 cheap-tell #4: rim is per-surface, no facet-wide chrome)
  };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = u.uRimColor;
    shader.uniforms.uRimPower = u.uRimPower;
    shader.uniforms.uRimStrength = u.uRimStrength;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform vec3 uRimColor;\nuniform float uRimStrength;\nuniform float uRimPower;\nvoid main() {'
      )
      .replace('#include <opaque_fragment>', RIM_INJECT);
  };
  // Own program-cache bucket so rim materials never share (or poison) the
  // program of a plain MeshStandardMaterial with identical parameters.
  material.customProgramCacheKey = () => 'dragonRim';
  material.userData.__rim = u;
  material.needsUpdate = true;
  registry.push(u);
  return u;
}

// Drive every rim at once: edge color (follows the biome sky) + strength
// (pulses up in Surge, scaled down on low quality tiers). Called per frame.
// `boost` is the per-biome backlit-rim lever (Fable 79): 0 everywhere but the Mire,
// wings take it at ×0.35 (kept a per-surface edge, not a facet-wide chrome plate),
// THEN the whole sum ×mul so a skin's own tame/kill still rules. boost=0 reduces to
// the shipped `strength * mul` exactly → byte-identical rim in every other biome.
export function updateRim(color, strength, boost = 0) {
  for (const u of registry) {
    if (color) u.uRimColor.value.copy(color);
    u.uRimStrength.value = (strength + boost * (u.wing ? 0.35 : 1)) * (u.mul ?? 1);
  }
}

// Drop stale uniform sets when the dragon is rebuilt (shop equip / ascension),
// so the registry doesn't accumulate references to disposed materials.
export function resetRim() {
  registry = [];
}
