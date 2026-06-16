import { composeSurface, fresnelRimPatch } from './dragonSurfaceShader.js';

// Surface-detail helpers — cheap, procedural, asset-free material upgrades that
// stop the dragons reading as flat smooth blobs, especially from the rear
// gameplay camera where you mostly see the silhouette.
//
// FRESNEL RIM: the body materials are smooth MeshStandardMaterial with a single
// flat colour, so a curved body shows almost no form — it's a dark mass. A
// fresnel rim adds light at grazing view angles (the silhouette edge), which is
// exactly the contour the player sees from behind.
//
// This now delegates to the composable SurfaceShader system (dragonSurfaceShader.js)
// so the rim can STACK with cellular scales / iridescence / subsurface on the same
// material — applying just the rim patch reproduces the original effect exactly.
//
//   applyFresnelRim(material, colorHex, { intensity, power, bias })
export function applyFresnelRim(material, colorHex, opts = {}) {
  return composeSurface(material, [fresnelRimPatch(colorHex, opts)]);
}
