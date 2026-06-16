import * as THREE from 'three';

// Volumetric god-rays (crepuscular light shafts) as a single screen-space pass.
// Classic radial light-scatter: from each pixel, march a short way toward the
// sun's screen position, accumulating BRIGHT samples (luminance-masked) with a
// decaying weight so the shafts appear to stream out of the sun. The rays carry
// the colours they sample, so they are biome-correct for free; uTint only warms
// them slightly. Runs in LINEAR space before OutputPass, so it tonemaps with the
// rest of the frame and never blows out the readable gameplay lane (the decay
// concentrates the rays up near the sun).
//
// Cost is N dependent texture reads per pixel — tier-gated hard (tier 0 full,
// tier 1 sparse, tier 2 = composer off). The pass also disables itself entirely
// when the sun is off-screen/behind, so looking away from the sun is free.

export const GODRAY_MAX_SAMPLES = 48;

export const GodRaysShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSunUv: { value: new THREE.Vector2(0.5, 0.85) },
    uIntensity: { value: 0.0 },
    uTint: { value: new THREE.Vector3(1.0, 0.88, 0.66) },
    uSamples: { value: 40.0 },
    uDensity: { value: 0.9 },
    uDecay: { value: 0.965 },
    uWeight: { value: 0.6 },
    uThreshold: { value: 0.55 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    #define MAX_SAMPLES ${GODRAY_MAX_SAMPLES}
    uniform sampler2D tDiffuse;
    uniform vec2 uSunUv;
    uniform float uIntensity;
    uniform vec3 uTint;
    uniform float uSamples;
    uniform float uDensity;
    uniform float uDecay;
    uniform float uWeight;
    uniform float uThreshold;
    varying vec2 vUv;
    void main() {
      vec4 scene = texture2D(tDiffuse, vUv);
      // March from the fragment toward the sun; step size covers the gap in
      // uSamples hops scaled by density.
      vec2 delta = (uSunUv - vUv) * (uDensity / uSamples);
      vec2 coord = vUv;
      float illum = 1.0;
      vec3 shafts = vec3(0.0);
      for (int i = 0; i < MAX_SAMPLES; i++) {
        if (float(i) >= uSamples) break;
        coord += delta;
        vec3 s = texture2D(tDiffuse, coord).rgb;
        // Only genuinely bright pixels (sky/sun/glints) cast shafts.
        float lum = dot(s, vec3(0.299, 0.587, 0.114));
        float mask = smoothstep(uThreshold, uThreshold + 0.7, lum);
        shafts += s * mask * illum;
        illum *= uDecay;
      }
      shafts *= uWeight / uSamples;
      // Fade the shafts toward the screen edges so the radial march never smears
      // a hard seam where samples run off the frame.
      vec2 e = smoothstep(vec2(0.0), vec2(0.12), vUv) *
               smoothstep(vec2(0.0), vec2(0.12), 1.0 - vUv);
      float edge = e.x * e.y;
      vec3 col = scene.rgb + shafts * uTint * uIntensity * edge;
      gl_FragColor = vec4(col, scene.a);
    }`,
};

// Per-tier ray budget. Tier 2 never reaches here (composer is off).
export const GODRAY_TIERS = [
  { samples: 40, weight: 0.62, scale: 1.0 },  // tier 0: full
  { samples: 16, weight: 0.50, scale: 0.7 },  // tier 1: sparse + dimmer
];
