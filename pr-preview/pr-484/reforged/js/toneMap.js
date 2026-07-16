// toneMap.js — N3 scaffolding (GRAPHICS-OVERHAUL.md): a URL-flag A/B between
// ACES (the shipped default), AgX, and Khronos PBR Neutral — so the human can
// judge the three side by side on the PR preview before we pick one.
//
// r160's vendored three ships ACESFilmicToneMapping and AgXToneMapping natively,
// but NOT NeutralToneMapping (that landed r162). Rather than bump the vendored
// engine (violates the no-build / r160 law), we implement Khronos PBR Neutral by
// overriding the `CustomToneMapping` slot in the tonemapping shader chunk. Because
// OutputPass (the composed path) and the tier-2 raw renderer.render path both
// compile this same chunk and key off `renderer.toneMapping`, one override covers
// both paths — the "one shader, both paths" property the water shader already relies on.
//
// DEFAULT IS UNCHANGED: nothing here runs unless `?tm=` is passed or setToneMap is
// called; the renderer stays on ACES @ exposure 0.92 (main.js). installNeutralToneMap()
// only edits an otherwise-unused function body, so with the default ACES tonemapper the
// rendered frame is byte-identical.
import * as THREE from 'three';

// Khronos PBR Neutral (https://github.com/KhronosGroup/ToneMapping) — preserves
// saturated brights far better than ACES/AgX (which push bright hues toward white),
// which matters for this game's neon emissives, aurora, and gold.
const NEUTRAL_GLSL = /* glsl */`vec3 CustomToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	const float startCompression = 0.8 - 0.04;
	const float desaturation = 0.15;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < startCompression ) return color;
	float d = 1.0 - startCompression;
	float newPeak = 1.0 - d * d / ( peak + d - startCompression );
	color *= newPeak / peak;
	float g = 1.0 - 1.0 / ( desaturation * ( peak - newPeak ) + 1.0 );
	return mix( color, newPeak * vec3( 1.0 ), g );
}`;

let installed = false;

// Splice the Neutral implementation into the CustomToneMapping slot. Idempotent,
// and a no-op-on-the-frame until renderer.toneMapping is actually set to
// CustomToneMapping. MUST run before any material first compiles.
export function installNeutralToneMap() {
  if (installed) return;
  const stub = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  const chunk = THREE.ShaderChunk.tonemapping_pars_fragment;
  if (chunk.includes(stub)) {
    THREE.ShaderChunk.tonemapping_pars_fragment = chunk.replace(stub, NEUTRAL_GLSL);
    installed = true;
  } else if (chunk.includes('CustomToneMapping')) {
    // Vendored three changed the stub wording — fail loud in dev, don't guess.
    console.warn('[toneMap] CustomToneMapping stub not found verbatim; Neutral not installed.');
  }
}

// Per-mode tonemapper + exposure. ACES keeps the shipped 0.92; the others open
// exposure slightly (ACES pulls exposure back specifically to fight its own
// highlight wash — Neutral/AgX don't need that). Values are A/B starting points,
// not final; the human tunes on preview.
const MODES = {
  aces:    { tm: THREE.ACESFilmicToneMapping, exposure: 0.92 },
  agx:     { tm: THREE.AgXToneMapping,        exposure: 1.0 },
  neutral: { tm: THREE.CustomToneMapping,     exposure: 1.0 },
};

export function setToneMap(renderer, mode) {
  const m = MODES[(mode || '').toLowerCase()];
  if (!m) return false;
  if (m.tm === THREE.CustomToneMapping) installNeutralToneMap();
  renderer.toneMapping = m.tm;
  renderer.toneMappingExposure = m.exposure;
  return true;
}

export const TONEMAP_MODES = Object.keys(MODES);
