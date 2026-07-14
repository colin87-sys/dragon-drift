import * as THREE from 'three';

// N15 — boot-baked procedural vertex AO for props (GRAPHICS-OVERHAUL.md).
// 100% procedural (computed at build from the geometry, no asset), zero per-frame
// cost. A shared `aoUniform` (0 = shipped, 1 = full) gates it at render so it's a
// live toggle with byte-identical off. Grounds the placeholder props (dark bases +
// down-facing undersides) — compounds with the N5 sky probe.

export const PROP_AO_AMT = 0.42;        // max darkening at a fully-occluded vertex
export const aoUniform = { value: 0 };  // shared across all prop materials
export function setPropAO(on) { aoUniform.value = on ? 1 : 0; }

// Bake per-vertex AO into an `aoBake` attribute (1 = lit, <1 = occluded). Prop
// geometry is normalized (base y=0, top ≈ 1): darken the base (height², so it
// concentrates near the ground) and down-facing faces (undersides/eaves/bellies —
// with flat-shaded low-poly props these verts are face-split, so it's crisp).
//
// The DOWN-facing term is kept deliberately light (0.30, was 0.55): a downward
// face already receives almost no sun and only the (often very dark) hemisphere
// ground light, so it is naturally the darkest part of a prop BEFORE any AO. On
// the Frozen Reach ice cones — whose big base-cap faces point straight down over
// a low grazing waterline — the old heavy under-term stacked on that unlit face
// and crushed it to near-black blobs (owner report). Softer weights + the lower
// overall AMT floor every vertex at ≥ 1−AMT = 0.58×, so AO now grounds the base
// without ever reading as a black patch.
export function bakeAO(geo) {
  const pos = geo.getAttribute('position');
  const nrm = geo.getAttribute('normal');
  if (!pos || !nrm) return geo;
  geo.computeBoundingBox();
  const maxY = Math.max(geo.boundingBox.max.y, 0.001);
  const n = pos.count;
  const ao = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const base = 1 - Math.min(Math.max(pos.getY(i) / maxY, 0), 1); // 1 at base → 0 at top
    const under = Math.min(Math.max(-nrm.getY(i), 0), 1);          // 1 for down-facing
    const w = Math.min(0.55 * base * base + 0.30 * under, 1);
    ao[i] = 1 - w * PROP_AO_AMT;
  }
  geo.setAttribute('aoBake', new THREE.BufferAttribute(ao, 1));
  return geo;
}
