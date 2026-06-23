// skinPass — the CHARM layer. Bold separate primitives read as a modelling
// exercise until a unifying skin goes over them. This pass:
//   • upgrades role materials to a stylised toon-ish look (flat bands + rim),
//   • adds an OUTLINE (inverted-hull backface shell) on the big masses — the
//     single biggest charm lever for a rear-chase-cam game,
//   • keeps the 5 palette ROLES (base/accent/membrane/glow/eye) consistent.
//
// In-browser this gives the cartoon contour directly; the headless preview
// renderer derives an equivalent outline in screen space, so both agree.

import * as THREE from 'three';

// A 3-band ramp texture for a cheap cel-shaded look on MeshToonMaterial.
let _ramp = null;
function toonRamp() {
  if (_ramp) return _ramp;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  _ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  _ramp.needsUpdate = true;
  return _ramp;
}

// Add a dark inverted-hull outline shell behind one mesh.
function addOutline(mesh, color, thickness) {
  const geo = mesh.geometry.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(i,
      pos.getX(i) + nor.getX(i) * thickness,
      pos.getY(i) + nor.getY(i) * thickness,
      pos.getZ(i) + nor.getZ(i) * thickness);
  }
  pos.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const shell = new THREE.Mesh(geo, mat);
  shell.userData = { role: 'outline', outline: true };
  shell.position.copy(mesh.position);
  shell.quaternion.copy(mesh.quaternion);
  shell.scale.copy(mesh.scale);
  return shell;
}

const OUTLINE_ROLES = new Set(['body', 'head', 'membrane', 'limb']);

export function skinPass(group, palette, opts = {}) {
  const outlineColor = opts.outlineColor != null ? opts.outlineColor : 0x0a0c10;
  const thickness = opts.outlineThickness != null ? opts.outlineThickness : 0.045;
  const ramp = toonRamp();
  const toAdd = [];
  group.traverse((o) => {
    if (!o.isMesh || o.userData.outline) return;
    // stylise: flat-banded toon material carrying the role colour + a subtle rim.
    const src = o.material;
    if (src && src.color && !o.userData.eye && o.userData.role !== 'eye') {
      const toon = new THREE.MeshToonMaterial({ color: src.color.clone(), gradientMap: ramp });
      if (src.emissive) { toon.emissive = src.emissive.clone(); toon.emissiveIntensity = src.emissiveIntensity || 0; }
      o.material = toon;
    }
    if (OUTLINE_ROLES.has(o.userData.role) && o.parent) toAdd.push([o.parent, addOutline(o, outlineColor, thickness)]);
  });
  for (const [parent, shell] of toAdd) parent.add(shell);
  return group;
}
