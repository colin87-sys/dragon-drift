import * as THREE from 'three';

// Surface-detail helpers — cheap, procedural, asset-free material upgrades that
// stop the dragons reading as flat smooth blobs, especially from the rear
// gameplay camera where you mostly see the silhouette.
//
// FRESNEL RIM: the body materials are smooth MeshStandardMaterial with a single
// flat colour, so a curved body shows almost no form — it's a dark mass. A
// fresnel rim adds light at grazing view angles (the silhouette edge), which is
// exactly the contour the player sees from behind. It reads as a soft sheen that
// wraps the form and a bright edge that separates the creature from the sky.
//
// It's injected into MeshStandardMaterial via onBeforeCompile (no UVs needed, so
// it works on the UV-less torso loft as well as the spheres/cones), added to
// totalEmissiveRadiance so it tone-maps with ACES and only blooms at the very
// edge where it's brightest. Keep intensity modest — full-scene bloom + ACES
// mean a hot rim would halo and wash out the dark dragons (Obsidian/Solar).
//
//   applyFresnelRim(material, colorHex, { intensity, power, bias })
//     colorHex   rim tint (usually def.apexSeam — on-brand per dragon)
//     intensity  peak rim strength at the silhouette (default 0.42)
//     power      edge tightness — higher = thinner rim hugging the outline (2.6)
//     bias       a faint all-over wrap added under the rim (0.04) so the whole
//                body lifts off flat, not just the contour
//
// Cloned materials inherit onBeforeCompile, so applying this to the shared
// bodyMat also rims the torso's DoubleSide clone and every body sphere/cone.
export function applyFresnelRim(material, colorHex, opts = {}) {
  const intensity = opts.intensity ?? 0.42;
  const power = opts.power ?? 2.6;
  const bias = opts.bias ?? 0.04;
  const rim = new THREE.Color(colorHex);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: rim };
    shader.uniforms.uRimIntensity = { value: intensity };
    shader.uniforms.uRimPower = { value: power };
    shader.uniforms.uRimBias = { value: bias };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform vec3 uRimColor;
uniform float uRimIntensity;
uniform float uRimPower;
uniform float uRimBias;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{
  // normal + vViewPosition are in view space; their alignment gives the fresnel.
  float vDotN = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  float fres = pow(1.0 - vDotN, uRimPower);
  totalEmissiveRadiance += uRimColor * (fres * uRimIntensity + uRimBias);
}`,
      );
  };
  // Distinguish the patched program from any un-patched MeshStandardMaterial in
  // the cache so they don't collide.
  material.customProgramCacheKey = () => 'fresnelRim';
  material.needsUpdate = true;
  return material;
}
