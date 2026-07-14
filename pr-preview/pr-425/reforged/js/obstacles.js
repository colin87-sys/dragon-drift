import * as THREE from 'three';
import { CONFIG } from './config.js';
import { biomeIndexAt } from './biomes.js';
import { halves, band, centre, spineSway, rockSlicePlan, CORRIDOR_HALF, kindMult } from './canyonMath.js';
import { mulberry32 } from './util.js';
import { bindAtmosphere } from './atmosphere.js';
import { makeMarkerSurface, bakeGlowT, bakeConst, facetHash } from './markerSurface.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// Skyforged A/B kill-switch: the premium Windvault gate is ON by default;
// ?skyforged=0 falls back to the old "Sky Gate" (posts/chevron/halo/gem) so the
// owner can compare premium-vs-old on the preview. Guarded so a non-browser
// import can't throw. Branches BOTH the builder and the motion path.
const _mkParams = (typeof window !== 'undefined' && window.location)
  ? new URLSearchParams(window.location.search) : new URLSearchParams();
const SKYFORGED = _mkParams.get('skyforged') !== '0';
// Phase Gate VEIL STYLE — the serene-magical redesign of the "crystal wall" (the
// full-lane barrier you thread the window in). Switchable for fly-testing:
//   ?veil=curtain — a swaying aurora curtain of light-strands, parted at the window (DEFAULT, Fable's champion)
//   ?veil=swirl   — a slow luminous spiral into a calm eye
//   ?veil=wisp    — a field of drifting spirits, the window a soft-lit eye
//   ?veil=crystal — the prior faceted fresnel membrane (kept for A/B)
// All fill the lane (no fly-around — the collider is unchanged), stay see-through
// (lines/points), and are cheap (additive lines/points, no full-lane transparent fill).
let veilStyle = _mkParams.get('veil') || 'curtain';
export function setVeilStyle(s) { veilStyle = s; }   // studio/tests override

// Hazards, spawned ahead and culled behind the dragon:
//   pillar — floor spike (health damage)
//   shard  — floating octahedron, optionally oscillating ("dynamic") (damage)
//   bar    — horizontal beam spanning the lane (damage)
//   gate   — a Phase Gate: a translucent magical veil spanning the lane with a
//            clearly-framed opening on the flight path (FATAL on contact, or
//            roll-phaseable during a Surge). Biome-adaptive (see PHASE_SKINS).
// Each entry doubles as its own collider; `colliders` is consumed by collision.js.
// Body materials are biome-keyed (verdigris stone / sandstone / ice); the Phase
// Gate is skinned per biome too — same shape language, biome-tinted veil + glow.
let scene = null;
let mats = null;
// Phase Gate shared materials, one per biome (built in initObstacles).
let veilMats = null; // translucent fresnel membrane
let edgeMats = null; // bright aperture ring + corner brackets (visual hierarchy #1)
let flowEdgeMat = null, flowCoreMat = null; // FLOW "Sky Gate" signature (fixed cyan/white) — fallback
let markerMat = null;                       // Skyforged glass — the Windvault (shared, one program)
const markerFlow = { value: 0 };            // per-ROLE 0..1 driver (gate: slipMix) — see markerSurface.js
const markerTime = { value: 0 };            // globally shared clock (one write/frame)
let gateFrameMats = null;                   // Phase Gate aperture frame — one per biome (Skyforged)
const gateFlowRef = { value: 0 };           // gate-frame heat ← speedNorm (NEVER markerFlow — that's the flow slip)
let rimMats = null;  // dim outer silhouette frame (secondary) — retired by the crack-lattice
let latticeMat = null; // shared crystalline crack-lattice (vertexColors hot→dark; overdraw-exempt lines)
const entries = [];
export const colliders = entries; // same objects, same array

// Per-biome Phase Gate skin: same gameplay/shape, biome-tinted presentation.
// Colours track each biome's signature accents; `rise` biases the mote drift
// (ember/spore rise, frost settles, astral hovers).
const PHASE_SKINS = [
  { veil: 0x3fd9a8, edge: 0x6ce4ff, core: 0x9ffff0, mote: 0x8fe9ff, rise:  0.4 }, // 0 Sanctuary — ethereal cyan-teal
  { veil: 0xffcf96, edge: 0xffb347, core: 0xfff0c8, mote: 0xffd98a, rise:  0.2 }, // 1 Wastes — gold mirage
  { veil: 0xbfe8ff, edge: 0x9fd8f0, core: 0xffffff, mote: 0xd6f3ff, rise: -0.4 }, // 2 Frozen — frost
  { veil: 0xff8a44, edge: 0xff6a24, core: 0xffd0a0, mote: 0xff8a3a, rise:  0.9 }, // 3 Caldera — ember rift
  { veil: 0x6effc8, edge: 0x4dffd0, core: 0xcfffd8, mote: 0xaaffc0, rise:  0.7 }, // 4 Mire — spore veil
  { veil: 0x8a6aff, edge: 0x9fb8ff, core: 0xd8c8ff, mote: 0xb9a8ff, rise:  0.05 }, // 5 Astral — cosmic violet
  { veil: 0x46e0b8, edge: 0x86ffe0, core: 0xdafff2, mote: 0xa8f0e0, rise: -0.3 }, // 6 Aurora — frost-teal, settles
];

// Fresnel veil: a magical membrane that is MOST transparent viewed head-on (so
// the player sees rings/hazards/lane straight through it while planning), and
// only catches light along its grazing silhouette edges. Alpha is hard-capped
// at 0.30 so it can never blind the route ahead. Unlit + cheap.
function makeVeilMat(color, edge) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uEdge: { value: new THREE.Color(edge) },
      uAlpha: { value: 0.6 },
      // View-space low-sun direction (ahead + slightly up) for the per-facet glint.
      // Fixed approximation — the facets already vary the read as the camera flies.
      uSun: { value: new THREE.Vector3(0.0, 0.25, -1.0).normalize() },
    },
    vertexShader: `
      attribute float aFacet;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos; varying float vFacet;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalMatrix * normal;
        vPos = position;
        vFacet = aFacet;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform vec3 uEdge; uniform float uAlpha; uniform vec3 uSun;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos; varying float vFacet;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vView);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - ndv, 3.0);
        // Per-facet sun GLINT: faceted panels flash sequentially as the camera flies
        // and the (view-space) low sun sweeps across the differently-angled planes.
        float glint = pow(max(dot(reflect(-V, N), normalize(uSun)), 0.0), 28.0);
        float band = sin((vPos.y * 0.5 + vPos.x * 0.3) + vFacet * 6.28 - uTime * 1.5);
        float shimmer = 0.85 + 0.15 * band;
        float a = clamp(uAlpha * (0.30 + 0.70 * fres) * shimmer + 0.18 * glint, 0.0, 0.30);
        vec3 col = mix(uColor, uEdge, clamp(fres * 0.85, 0.0, 1.0));
        col += uEdge * max(0.0, band) * 0.12;
        col += uEdge * glint * 0.9;                 // hot spark on the sun-facing facet
        col += uEdge * (vFacet - 0.5) * 0.05;       // faint per-facet tone so panes read distinct head-on
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}

// Serene-veil animated materials (shared; one uTime write/frame). Additive light,
// blooms in postfx, overdraw-cheap (thin lines / small round point sprites).
// Per-vertex aColor carries the biome tint + the hot-near-window gradient.
function makeVeilLineMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aColor; attribute float aPhase; attribute float aSway;
      varying vec3 vCol; uniform float uTime;
      void main(){
        vCol = aColor;
        vec3 p = position;
        p.x += sin(uTime * 0.6 + aPhase + p.y * 0.14) * aSway;   // gentle strand sway (0 for the spiral)
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 0.9); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
function makeVeilPointMat() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aColor; attribute float aPhase; attribute float aSize;
      varying vec3 vCol; uniform float uTime;
      void main(){
        vCol = aColor;
        vec3 p = position;
        p.x += sin(uTime * 0.45 + aPhase) * 0.7;                 // slow drift of each spirit
        p.y += cos(uTime * 0.37 + aPhase * 1.3) * 0.55;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (260.0 / max(0.1, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vCol;
      void main(){
        vec2 d = gl_PointCoord - 0.5; float r = dot(d, d);
        if (r > 0.25) discard;
        float a = smoothstep(0.25, 0.0, r);
        gl_FragColor = vec4(vCol * a, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
let veilLineMat = null, veilPointMat = null;   // built in initObstacles

// Emissive glow line for the frame/ring/brackets — blooms in postfx.
function makeEdgeMat(color, intensity) {
  return new THREE.MeshStandardMaterial({
    color: 0x0a0a12,
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0,
  });
}

export function initObstacles(s) {
  scene = s;
  const bodyOpts = { flatShading: true, roughness: 0.4, metalness: 0.1 };
  mats = {
    body: [
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7fbf9f, emissive: 0x13302a, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0xddb273, emissive: 0x3a230a, emissiveIntensity: 0.35 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x7cc4ee, roughness: 0.3, emissive: 0x10324d, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x4a3038, emissive: 0x8a2208, emissiveIntensity: 0.5 }),  // basalt, ember-lit
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x2a6a52, emissive: 0x14b088, emissiveIntensity: 0.45 }), // biolume moss
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x5a5a9a, emissive: 0x3a3aa0, emissiveIntensity: 0.45 }), // astral slate
      new THREE.MeshStandardMaterial({ ...bodyOpts, color: 0x4e6e86, roughness: 0.3, emissive: 0x155048, emissiveIntensity: 0.42 }), // 6 aurora — steel ice, faint aurora-teal glow
    ],
    // Movers are the active danger: icy body, hot coral warning glow that
    // pulses in updateObstacles (shared material — one update per frame).
    mover: new THREE.MeshStandardMaterial({
      color: 0xbcd8e8,
      flatShading: true,
      roughness: 0.25,
      emissive: 0xff5a47,
      emissiveIntensity: 0.9,
    }),
    // Frozen hazard-skin crevasse glow (PR-3): light escaping from INSIDE calved
    // ice — recessed emissive slivers seated between proud walls (never a proud
    // strip → that's the LED-strip/light-saber failure). Breathes in updateObstacles
    // (shared — one write/frame) to restore the "live hazard" cue the skinned bar
    // loses when its spin is killed.
    frostGlow: new THREE.MeshStandardMaterial({
      color: 0x6ec8ec, flatShading: true, roughness: 0.2, metalness: 0,
      emissive: 0x1fb4ff, emissiveIntensity: 0.95,
    }),
    // Vertex-coloured ICE body for the Frozen hazard skins — the per-face VALUE
    // LADDER (near-white frost on upward faces, mid ice on verticals, deep teal in
    // the belly/shadow planes) that lifts flat-shaded ice from "one blue band" to
    // premium. Base white so the baked vertex colours read as authored.
    frostIce: new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, flatShading: true, roughness: 0.34, metalness: 0.02,
      emissive: 0x11384c, emissiveIntensity: 0.28,
    }),
    // Dark recess backing behind a crevasse glow — the near-black-teal socket that
    // turns "strip stuck on a face" into "crack with light inside".
    frostShadow: new THREE.MeshStandardMaterial({
      color: 0x0e2630, flatShading: true, roughness: 0.6, metalness: 0,
    }),
    // Ancient fossil bone for the Dragon Spine Canyon — warm ivory, faceted, a
    // touch of emissive so the skeleton reads (and blooms) against any biome sky.
    bone: new THREE.MeshStandardMaterial({
      color: 0xe7dcc0, flatShading: true, roughness: 0.7, metalness: 0.0,
      emissive: 0x4a3f2a, emissiveIntensity: 0.35,
    }),
    // Soft pale sea-mist veils for the sea-stack run (low haze hugging the
    // water). Unlit, fogged so it recedes, no depth write so it layers cleanly.
    mist: new THREE.MeshBasicMaterial({
      color: 0xc8d4e4, transparent: true, opacity: 0.08, depthWrite: false,
      side: THREE.DoubleSide, fog: true,
    }),
    // Soul-fire for the skull's eyes — a cold green ember that pulses (shared, one
    // write/frame in updateObstacles) so the mouth reads as "something ancient is
    // awake" from a distance. Bright emissive so it blooms.
    soul: new THREE.MeshStandardMaterial({
      color: 0x0c2415, flatShading: true, roughness: 0.3, metalness: 0.0,
      emissive: 0x4dff9e, emissiveIntensity: 1.8,
    }),
    // Dark recess for the skull's eye sockets — the glowing eye set inside it reads
    // clearly as an eye-in-socket against the ivory bone.
    socket: new THREE.MeshStandardMaterial({
      color: 0x140f0a, flatShading: true, roughness: 0.9, metalness: 0.0,
    }),
  };
  // N8: the solid obstacle bodies (rock gates / spines / skeleton — the big
  // fogged geometry the player flies THROUGH) join the atmosphere so they sink
  // into the height fog and catch the sunward inscatter like the props. Identity
  // when the toggle is off. (Transparent mist/soul-fire left out — mist already
  // reads as haze, soul-fire is a bright detail we don't want fog-tinted.)
  for (const m of mats.body) bindAtmosphere(m);
  bindAtmosphere(mats.mover); bindAtmosphere(mats.bone); bindAtmosphere(mats.socket);
  // Phase Gate skins, one material set per biome.
  veilMats = PHASE_SKINS.map((s) => makeVeilMat(s.veil, s.edge));
  edgeMats = PHASE_SKINS.map((s) => makeEdgeMat(s.edge, 1.4));
  rimMats = PHASE_SKINS.map((s) => makeEdgeMat(s.edge, 0.5));
  // The crystalline crack-lattice — ONE shared line material (per-vertex hot→dark
  // colour carries the biome tint + the fly-here gradient). Fogged so distant lines
  // recede; overdraw-exempt, so it's free richness + the outer silhouette in one.
  latticeMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.92, fog: true });
  // Serene-veil shared materials (curtain/swirl strands + wisp spirits).
  veilLineMat = makeVeilLineMat();
  veilPointMat = makeVeilPointMat();
  // Window-marker materials: iris loops (vertexColors, NORMAL blend so the dark
  // under-stroke reads as a silhouette on bright skies while the bright loop blooms),
  // and the dark faceted ice-petal wreath (neutral dark ice → the cores carry the tint).
  markerLineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 });
  markerStoneMat = new THREE.MeshStandardMaterial({ color: 0x3a4a68, flatShading: true, roughness: 0.4, metalness: 0.2, emissive: 0x14203a, emissiveIntensity: 0.5 });
  bindAtmosphere(markerStoneMat);
  // FLOW "Sky Gate" signature — FIXED slip-cyan / ice-white in EVERY biome (never
  // edgeMats[bi]) so a flow run reads as its own distinct place, not a recoloured ring.
  // Shared: the whole run pulses together with the slipstream (updateObstacles). Opaque
  // emissive → blooms, overdraw-free.
  flowEdgeMat = makeEdgeMat(0x59d8ff, 1.6);   // posts / chevron
  flowCoreMat = makeEdgeMat(0xd6f4ff, 2.4);   // white-hot halo / gem (survives biome wash-out)
  // Skyforged Windvault material — one shared program (customProgramCacheKey), the
  // flow signature cyan family (continuity with the ribbon orbs → "flow = cyan
  // light"). NOT bindAtmosphere'd: deliberate, parity with the old flow mats —
  // a signature emissive marker should not be fog-tinted (same rationale as soul-fire).
  markerMat = makeMarkerSurface({ flowRef: markerFlow, timeRef: markerTime, glint: 0.8, glintSharp: 40 });
  // PR-4: the Phase Gate aperture frame gets the Skyforged treatment PER BIOME — six fresh
  // factory calls derived from PHASE_SKINS (root = darkened biome edge, mid = edge, apex = the
  // hot core), NEVER cloned (r160 Material.copy JSON-kills the uniform refs). All six + the three
  // markers share ONE program (customProgramCacheKey). Driver = gateFlowRef (speed), not markerFlow.
  // A hot inner LIP (lipGlow) puts the safe-route outline on the aperture edge; a restrained glint
  // keeps menace (heavy sparkle would read "treasure"). Family = the VALUE grammar, not the hue.
  // Apex is a BRIGHTENED EDGE (biome hue lerped toward white), NOT skin.core — the pale cores
  // (Caldera peach, Frozen white) washed the frame white and killed biome identity. Keeping the
  // hot lip hue-tinted + restrained lip/glint lets the biome-hued MID carry the read.
  gateFrameMats = PHASE_SKINS.map((s) => makeMarkerSurface({
    rootColor: new THREE.Color(s.edge).multiplyScalar(0.38).getHex(),
    midColor: s.edge,
    apexColor: new THREE.Color(s.edge).lerp(new THREE.Color(0xffffff), 0.5).getHex(),
    flowRef: gateFlowRef, timeRef: markerTime, emissive: 1.8, side: THREE.DoubleSide,
    glint: 0.35, glintSharp: 44, lipGlow: 0.6,
  }));
}

// PR-4 Phase Gate aperture FRAME (Skyforged): a closed rounded-rectangle faceted sweep replacing
// the four flat aperture bars — the Jade-Annulus move on a rectangle. A small chisel cross-section
// (angular, not gem-round → keeps menace) is swept along the gap perimeter; the HOT inner lip
// (glowT=1) lands EXACTLY on the collider gap boundary, so the safe-route outline gets stronger,
// never a frame that looks passable but kills. Non-indexed → flat facets; per-QUAD facetJ; glowT
// baked outer-girdle(0)→inner-lip(1). Drawn from o.gap* only (render-only, determinism-free).
function buildGateFrame(o) {
  // rC clamped to the half-extents: a corner radius > gapW/gapH would bulge the lip OUTSIDE the
  // collider (looks-passable-but-kills). Today gap dims are fixed (~3.8/3.4) so this is a guard.
  const inRad = 0.35, outRad = 0.35, zHalf = 0.35, Z0 = 0.3, rC = Math.min(0.9, o.gapW, o.gapH);
  const HX = o.gapW + inRad, HY = o.gapH + inRad, R = rC + inRad;
  const sx = Math.max(0, o.gapW - rC), sy = Math.max(0, o.gapH - rC); // corner-centre offsets
  const cl = [];                                     // centreline {x,y,nx,ny}: nx,ny = INWARD normal
  const addE = (x, y, nx, ny) => cl.push({ x, y, nx, ny });
  const ES = 3, CS = 4;
  for (let i = 0; i <= ES; i++) addE(HX, -sy + (i / ES) * 2 * sy, -1, 0);                         // right edge ↑
  for (let i = 1; i <= CS; i++) { const a = (i / CS) * (Math.PI / 2); addE(sx + R * Math.cos(a), sy + R * Math.sin(a), -Math.cos(a), -Math.sin(a)); } // TR corner
  for (let i = 1; i <= ES; i++) addE(sx - (i / ES) * 2 * sx, HY, 0, -1);                          // top edge ←
  for (let i = 1; i <= CS; i++) { const a = Math.PI / 2 + (i / CS) * (Math.PI / 2); addE(-sx + R * Math.cos(a), sy + R * Math.sin(a), -Math.cos(a), -Math.sin(a)); } // TL
  for (let i = 1; i <= ES; i++) addE(-HX, sy - (i / ES) * 2 * sy, 1, 0);                          // left edge ↓
  for (let i = 1; i <= CS; i++) { const a = Math.PI + (i / CS) * (Math.PI / 2); addE(-sx + R * Math.cos(a), -sy + R * Math.sin(a), -Math.cos(a), -Math.sin(a)); } // BL
  for (let i = 1; i <= ES; i++) addE(-sx + (i / ES) * 2 * sx, -HY, 0, 1);                         // bottom edge →
  for (let i = 1; i <= CS; i++) { const a = 1.5 * Math.PI + (i / CS) * (Math.PI / 2); addE(sx + R * Math.cos(a), -sy + R * Math.sin(a), -Math.cos(a), -Math.sin(a)); } // BR
  const M = cl.length, prof = [
    [inRad, 0.0], [0.35 * inRad, zHalf], [-0.35 * outRad, zHalf],
    [-outRad, 0.0], [-0.35 * outRad, -zHalf], [0.35 * inRad, -zHalf],
  ], P = prof.length;
  const gAt = (dn) => (dn + outRad) / (inRad + outRad);   // girdle 0 → lip 1
  const pt = (c, dn, dz) => [o.gapX + c.x + c.nx * dn, o.gapY + c.y + c.ny * dn, Z0 + dz];
  const pos = [], gt = [], fj = [];
  const tri = (a, b, cc, ga, gb, gc, f) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2]); gt.push(ga, gb, gc); fj.push(f, f, f); };
  for (let s = 0; s < M; s++) {
    const c0 = cl[s], c1 = cl[(s + 1) % M];
    for (let p = 0; p < P; p++) {
      const pn = (p + 1) % P;
      const a = pt(c0, prof[p][0], prof[p][1]), b = pt(c1, prof[p][0], prof[p][1]);
      const cc = pt(c1, prof[pn][0], prof[pn][1]), d = pt(c0, prof[pn][0], prof[pn][1]);
      const ga = gAt(prof[p][0]), gc = gAt(prof[pn][0]), f = facetHash(s * P + p);
      tri(a, b, cc, ga, ga, gc, f);
      tri(a, cc, d, ga, gc, gc, f);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('glowT', new THREE.Float32BufferAttribute(gt, 1));
  g.setAttribute('facetJ', new THREE.Float32BufferAttribute(fj, 1));
  g.computeVertexNormals();
  return g;
}

// WINDVAULT — a SINGLE tapered arch of forged glass framing the (unchanged) green
// reward ring nested inside as the catch. A hand-rolled swept faceted tube (THREE
// .TubeGeometry can't taper per-point nor bake glowT): a tall HORSESHOE — the lower
// legs stay near-vertical so the "posts" read survives edge-on (the lesson the old
// torus forgot), the crown frames the ring frontally — root-thick tapering to a
// keystone-shard apex, with a z-elongated cross-section so a banking approach still
// sees lit area. glowT ramps 0 (feet) → 1 (crown); the light climbs it with the
// slipstream. Returns ONE merged non-indexed geometry (position + glowT), flat-faceted.
function buildWindvault(gx, gy, j) {
  const geoms = [];
  const footY = Math.max(1.5, gy - 6);       // feet clear max swell (0.6m); no foam weld needed
  const shoulderY = gy + 2.5;                 // legs meet the crown here
  const crownY = gy + 9;                      // apex (keystone) — good ring-to-arch breathing room
  const half = 7.5;                           // half-span between feet
  const clampX = (x) => Math.max(-12.5, Math.min(12.5, x)); // stay in the lane
  const footLx = clampX(gx - half), footRx = clampX(gx + half);
  const cxA = (footLx + footRx) / 2, halfA = (footRx - footLx) / 2;
  // Centreline: near-vertical left leg → elliptical crown → near-vertical right leg.
  const pts = [];
  const push = (x, y) => { const p = pts[pts.length - 1]; if (!p || Math.hypot(p.x - x, p.y - y) > 0.05) pts.push({ x, y }); };
  const legN = 4;
  for (let i = 0; i <= legN; i++) push(footLx, footY + (shoulderY - footY) * (i / legN));
  const crownN = 12;
  for (let i = 0; i <= crownN; i++) { const th = Math.PI * (i / crownN); push(cxA - halfA * Math.cos(th), shoulderY + (crownY - shoulderY) * Math.sin(th)); }
  for (let i = 0; i <= legN; i++) push(footRx, shoulderY + (footY - shoulderY) * (i / legN));
  const glowAt = (y) => Math.max(0, Math.min(1, (y - footY) / (crownY - footY)));
  // Sweep a faceted elliptical cross-section (z-elongated) along the centreline.
  const K = 5;                                // pentagonal facets → forged-glass glints
  const rings = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx;                  // in-plane normal
    const gt = glowAt(p.y), taper = 0.6 + (0.14 - 0.6) * gt; // root-thick → apex-thin
    const rN = taper, rZ = taper * 1.4;       // z-elongated cross-section
    const ring = [];
    for (let k = 0; k < K; k++) { const ang = (k / K) * Math.PI * 2 + 0.3; const c = Math.cos(ang) * rN, s = Math.sin(ang) * rZ; ring.push([p.x + nx * c, p.y + ny * c, s]); }
    rings.push({ ring, gt });
  }
  const posA = [], gtA = [], fjA = [];
  const tri = (v0, v1, v2, g0, g1, g2, fj) => { posA.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2]); gtA.push(g0, g1, g2); fjA.push(fj, fj, fj); };
  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i], r1 = rings[i + 1];
    for (let k = 0; k < K; k++) {
      const kn = (k + 1) % K;
      const fj = facetHash(i * K + k);           // D1: per-QUAD facet id (both tris share it)
      tri(r0.ring[k], r1.ring[k], r1.ring[kn], r0.gt, r1.gt, r1.gt, fj);
      tri(r0.ring[k], r1.ring[kn], r0.ring[kn], r0.gt, r1.gt, r0.gt, fj);
    }
  }
  const tube = new THREE.BufferGeometry();
  tube.setAttribute('position', new THREE.Float32BufferAttribute(posA, 3));
  tube.setAttribute('glowT', new THREE.Float32BufferAttribute(gtA, 1));
  tube.setAttribute('facetJ', new THREE.Float32BufferAttribute(fjA, 1));
  geoms.push(tube);
  // Keystone shard at the crown (glowT baked = 1) — the far-field bloom point. Bake a
  // constant facetJ too so the merged attribute set matches the tube (else mergeGeometries → null).
  const key = new THREE.OctahedronGeometry(0.95, 0).toNonIndexed();
  key.deleteAttribute('normal'); key.deleteAttribute('uv'); // match the tube's attribute set
  key.scale(0.8, 1.3, 0.8); key.rotateY(0.4 + j * 0.5); key.translate(cxA, crownY + 0.4, 0);
  bakeGlowT(key, () => 1.0);
  bakeConst(key, 'facetJ', 0.5);
  geoms.push(key);
  const merged = mergeGeometries(geoms, false); // both are position+glowT → never null
  geoms.forEach((g) => g.dispose());
  merged.computeVertexNormals();               // non-indexed → per-face FLAT normals (facet glints)
  return merged;
}

export function addObstacle(o) {
  const e = { ...o, object: null };
  const bi = biomeIndexAt(o.dist);
  if (o.type === 'pillar') {
    e.object = hazardMesh('pillar', bi, { r: o.r, h: o.h });
    e.object.position.set(o.x, o.h / 2, -o.dist);
  } else if (o.type === 'shard') {
    e.object = hazardMesh('shard', bi, { r: o.r, dynamic: o.dynamic });
    e.object.position.set(o.x, o.y, -o.dist);
  } else if (o.type === 'bar') {
    e.object = hazardMesh('bar', bi, { r: o.r });
    e.object.position.set(0, o.y, -o.dist);
    if (e.object.userData.skinned) e.skinned = true;   // a calved shelf can't barrel-roll — kill the spin
  } else if (o.type === 'gate') {
    e.object = buildGate(o);
  }
  scene.add(e.object);
  entries.push(e);
}

// A biome-adaptive Phase Gate: a translucent fresnel veil spanning the lane
// around a clearly-framed rectangular opening. Layered per the design spec —
//   1. outer silhouette frame (dim, reads from afar)
//   2. bright aperture ring + corner brackets (the clearest "fly here" cue)
//   3. translucent veil membrane (most transparent head-on; never blocks view)
//   4. reactive FX: core-glow locator, long-range beacon, drifting motes
// Veil/ring/rim materials are shared per biome; core/beacon/motes are
// per-instance (marked so removeAt disposes them).
// A faceted crystal PANEL for the Phase Gate veil (graphics veil pass). Same
// rectangular outline as the old flat box face, but the interior is a jittered
// low-poly triangulation of FLAT facets, so the fresnel membrane reads as GROWN
// crystal instead of a flat hologram pane: each facet catches the grazing light
// and the low-sun glint differently, and the sun sweeps across them as
// sequentially flashing planes as the camera flies. Boundary vertices are PINNED
// (z = 0, exact outline, no XY jitter) so the four panels tile seamlessly against
// each other and the frame with no cracks and never bulge into the gameplay
// aperture. Carries a per-facet random attribute `aFacet` (same value on a
// triangle's three verts). Non-indexed → computeVertexNormals yields true flat
// facet normals. Uses Math.random like the motes below (a gate's VISUAL detail is
// not determinism-tracked — the fixture tracks gameplay state, not mesh jitter).
function facetedPanel(w, h, T) {
  const nx = Math.max(1, Math.round(w / 3.0));
  const ny = Math.max(1, Math.round(h / 3.0));
  const cw = w / nx, ch = h / ny;
  const V = [];
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const edge = (i === 0 || i === nx || j === 0 || j === ny);
      let x = -w / 2 + i * cw, y = -h / 2 + j * ch, z = 0;
      if (!edge) {
        x += (Math.random() - 0.5) * 0.6 * cw;
        y += (Math.random() - 0.5) * 0.6 * ch;
        z += (Math.random() - 0.5) * 0.84 * T;   // within the ±T/2 slab, never into the gap (panels sit outside it)
      }
      V.push({ x, y, z });
    }
  }
  const vid = (i, j) => j * (nx + 1) + i;
  const norm = (a, b, c) => {
    const A = V[a], B = V[b], C = V[c];
    const ux = B.x - A.x, uy = B.y - A.y, uz = B.z - A.z, vx = C.x - A.x, vy = C.y - A.y, vz = C.z - A.z;
    let nx2 = uy * vz - uz * vy, ny2 = uz * vx - ux * vz, nz2 = ux * vy - uy * vx;
    const l = Math.hypot(nx2, ny2, nz2) || 1; return [nx2 / l, ny2 / l, nz2 / l];
  };
  const tris = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = vid(i, j), b = vid(i + 1, j), c = vid(i + 1, j + 1), d = vid(i, j + 1);
      if ((i + j) % 2 === 0) { tris.push([a, b, c]); tris.push([a, c, d]); }
      else { tris.push([a, b, d]); tris.push([b, c, d]); }
    }
  }
  const triN = tris.map((t) => norm(t[0], t[1], t[2]));
  // Edge → adjacent triangles, to select the crystalline LATTICE: boundary edges
  // (mesh outline = the gate silhouette) + interior edges whose dihedral angle
  // exceeds ~9° (the facet crease network — line and shade agree → one material).
  const emap = new Map();
  const ek = (p, q) => (p < q ? p * 100000 + q : q * 100000 + p);
  tris.forEach((t, ti) => { for (const [p, q] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) { const k = ek(p, q); (emap.get(k) || emap.set(k, []).get(k)).push(ti); } });
  const lattice = [];
  const cosThresh = Math.cos(9 * Math.PI / 180);
  for (const [k, adj] of emap) {
    const p = Math.floor(k / 100000), q = k % 100000;
    let emit = adj.length === 1;   // boundary/outline edge
    if (adj.length === 2) { const n0 = triN[adj[0]], n1 = triN[adj[1]]; if (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2] < cosThresh) emit = true; }
    if (emit) { const A = V[p], B = V[q]; lattice.push(A.x, A.y, A.z, B.x, B.y, B.z); }
  }
  const pos = [], facet = [];
  for (const t of tris) { const f = Math.random(); for (const vi of t) { const P = V[vi]; pos.push(P.x, P.y, P.z); facet.push(f); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aFacet', new THREE.Float32BufferAttribute(facet, 1));
  g.computeVertexNormals();
  return { geo: g, lattice };
}

// ---- Serene veil STYLES: full-lane light barriers with a mandatory window (the
// crystal-wall redesign). Each fills the lane box (±LX, 0..LTOP) around the
// aperture, leaves the window clear, stays see-through (lines/points), and animates
// via the shared veil shaders. Colour runs HOT (biome edge, blooms) near the window
// → DIM biome tone at the periphery, so the window reads and the far field recedes.
const LX = 16, LTOP = 24;
function _veilGeo(pos, col, phase, extra, extraName) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
  g.setAttribute(extraName, new THREE.Float32BufferAttribute(extra, 1));
  return g;
}
// distance from a window-relative point to the window rect (0 inside), for colour.
function _winDist(rx, ry, o) { return Math.hypot(Math.max(Math.abs(rx) - o.gapW, 0), Math.max(Math.abs(ry) - o.gapH, 0)); }

// SWIRL — a slow luminous spiral into a calm eye. Built eye-relative so the whole
// thing rotates gently about the window (updateObstacles).
function buildVeilSwirl(o, skin) {
  const hot = new THREE.Color(skin.edge), dim = new THREE.Color(skin.edge).multiplyScalar(0.28), _c = new THREE.Color();
  const pos = [], col = [], phase = [], sway = [];
  const arms = 7;
  for (let a = 0; a < arms; a++) {
    const a0 = a / arms * Math.PI * 2; let px = null, py = null;
    for (let t = 0; t < 80; t++) {
      const rr = o.gapW + 0.9 + Math.pow(t, 1.14) * 0.2, th = a0 + t * 0.1;
      const x = Math.cos(th) * rr, y = Math.sin(th) * rr * 0.95;
      if (rr > 26) break;
      if (px != null) {
        _c.copy(hot).lerp(dim, Math.min(_winDist(x, y, o) / 12, 1));
        const b = Math.max(0.16, 1 - t / 40);
        pos.push(px, py, 0, x, y, 0); col.push(_c.r * b, _c.g * b, _c.b * b, _c.r * b, _c.g * b, _c.b * b); phase.push(0, 0); sway.push(0, 0);
      }
      px = x; py = y;
    }
  }
  const lines = new THREE.LineSegments(_veilGeo(pos, col, phase, sway, 'aSway'), veilLineMat);
  lines.position.set(o.gapX, o.gapY, 0);
  const motes = _veilMotes(o, skin, 100);
  return { objects: [lines, motes], spin: lines };
}

// WISP — a still field of drifting spirits filling the lane, the window a calm eye
// ringed by a soft halo of brighter wisps.
function buildVeilWisp(o, skin) {
  const hot = new THREE.Color(skin.edge), dim = new THREE.Color(skin.edge).multiplyScalar(0.5), _c = new THREE.Color();
  const pos = [], col = [], phase = [], size = [];
  for (let i = 0; i < 480; i++) {
    let x, y; do { x = -LX + Math.random() * LX * 2; y = Math.random() * LTOP; } while (Math.abs(x - o.gapX) < o.gapW && Math.abs(y - o.gapY) < o.gapH);
    _c.copy(hot).lerp(dim, Math.min(_winDist(x - o.gapX, y - o.gapY, o) / 14, 1));
    pos.push(x, y, (Math.random() - 0.5) * 9); col.push(_c.r, _c.g, _c.b); phase.push(Math.random() * 6.28); size.push(0.7 + Math.random() * 0.9);
  }
  const field = new THREE.Points(_veilGeo(pos, col, phase, size, 'aSize'), veilPointMat);
  // (the window ring is now the shared marker — iris loops + glacier-bloom wreath)
  return { objects: [field] };
}

// CURTAIN — a swaying veil of light-RIBBONS filling the lane, drawn back at the window
// (Fable's champion). Smooth, gently S-curved strands (no scratchy kinks), brightness
// tapered to a SOFT fade at both ends (kills the hard top/bottom band seams), density
// falling toward the window where the strands sweep aside — the parting doubles as an
// arrow to the safe route.
function buildVeilCurtain(o, skin) {
  const hot = new THREE.Color(skin.edge), dim = new THREE.Color(skin.edge).multiplyScalar(0.4), _c = new THREE.Color();
  const pos = [], col = [], phase = [], sway = [];
  const N = 110, SEG = 26;
  for (let i = 0; i < N; i++) {
    const x0 = -LX + (i + Math.random() * 0.5) / N * LX * 2, ph = Math.random() * 6.28;
    const near = Math.max(0, 1 - Math.abs(x0 - o.gapX) / (o.gapW * 2.4));
    const amp = 0.3 + Math.random() * 0.4;
    const scurve = (0.5 + Math.random()) * (Math.random() < 0.5 ? -1 : 1);  // gentle per-strand S-bend
    const bright = 0.7 + Math.random() * 0.5;
    let px = null, py = null, pE = 0;
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG, y = LTOP - t * LTOP;
      const inWinY = y > o.gapY - o.gapH - 1.5 && y < o.gapY + o.gapH + 1.5;
      const bow = (near > 0.1 && inWinY) ? near * (x0 < o.gapX ? -1 : 1) * o.gapW * 1.2 : near * (x0 < o.gapX ? -1 : 1) * o.gapW * 0.2;
      const x = x0 + bow + Math.sin(t * Math.PI) * scurve;                  // smooth S-curve, zero at both ends
      // soft brightness envelope: fades to 0 at top & bottom → no razor band edge
      const env = Math.pow(Math.sin(t * Math.PI), 0.6) * bright;
      const skip = near > 0.12 && inWinY;
      if (px != null && !skip && pE > 0.02) {
        _c.copy(hot).lerp(dim, Math.min(_winDist(x - o.gapX, y - o.gapY, o) / 11, 1));
        col.push(_c.r * pE, _c.g * pE, _c.b * pE, _c.r * env, _c.g * env, _c.b * env);
        pos.push(px, py, 0, x, y, 0); phase.push(ph, ph); sway.push(amp, amp);
      }
      px = x; py = y; pE = env;
    }
  }
  const lines = new THREE.LineSegments(_veilGeo(pos, col, phase, sway, 'aSway'), veilLineMat);
  return { objects: [lines, _veilMotes(o, skin, 90)] };
}

// ---- Window MARKER (Fable frame redesign): kill the rounded-square + corner
// "viewfinder" brackets. The safe window is instead marked by (a) IRIS OF THE VEIL
// — concentric SUPERELLIPSE (squircle, no hard corners) loops of the veil's own
// light hugging the opening, with a dark under-stroke so the silhouette survives a
// bright sky, and (b) a sparse GLACIER-BLOOM WREATH — a few dark faceted ice-petals
// with a bright emissive core, giving mass + the game's recessed-glow material
// language + bright-sky legibility. Beaded/petaled (not a plain ring) so a mandatory
// gate never reads as an optional reward ring.
let markerLineMat = null, markerStoneMat = null;
function _superellipse(cx, cy, a, b, steps, n = 4) {
  const p = [];
  for (let i = 0; i < steps; i++) {
    const th = i / steps * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    p.push(cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), cy + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n));
  }
  return p;
}
function _loopSegs(cx, cy, a, b, steps, z, color, pos, col) {
  const p = _superellipse(cx, cy, a, b, steps);
  for (let i = 0; i < steps; i++) {
    const j = (i + 1) % steps;
    pos.push(p[i * 2], p[i * 2 + 1], z, p[j * 2], p[j * 2 + 1], z);
    col.push(color.r, color.g, color.b, color.r, color.g, color.b);
  }
}
function buildWindowMarker(o, skin) {
  const objs = [];
  const hot = new THREE.Color(skin.edge);
  const white = new THREE.Color(skin.core);
  const bright = hot.clone().multiplyScalar(2.2), faint = hot.clone().multiplyScalar(0.5), dark = hot.clone().multiplyScalar(0.12);
  const pos = [], col = [], steps = 52;
  _loopSegs(o.gapX, o.gapY, o.gapW + 0.42, o.gapH + 0.42, steps, -0.1, dark, pos, col);   // dark under-stroke → silhouette on bright sky
  _loopSegs(o.gapX, o.gapY, o.gapW + 0.45, o.gapH + 0.45, steps, 0.06, bright, pos, col);  // bright boundary loop (blooms)
  _loopSegs(o.gapX, o.gapY, o.gapW + 1.35, o.gapH + 1.35, steps, 0.0, faint, pos, col);    // faint outer echo loop
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  objs.push(new THREE.LineSegments(g, markerLineMat));
  // wreath: small faceted ice-petals catching light, each with a BRIGHT glowing core
  // (a beaded ring of light — the glow reads even where a dark body would; the core
  // is white-hot skin.core so it blooms and is legible on any sky).
  const wp = _superellipse(o.gapX, o.gapY, o.gapW + 0.9, o.gapH + 0.9, 14);
  const shards = [], cpos = [], ccol = [], cph = [], csz = [];
  const cw = white.clone().lerp(hot, 0.3);
  for (let i = 0; i < 14; i++) {
    const x = wp[i * 2], y = wp[i * 2 + 1], th = Math.atan2(y - o.gapY, x - o.gapX);
    const sg = new THREE.IcosahedronGeometry(0.26, 0);
    sg.scale(1.35, 0.6, 0.6); sg.rotateZ(th); sg.translate(x, y, 0);
    shards.push(sg);
    cpos.push(x, y, 0.2); ccol.push(cw.r, cw.g, cw.b); cph.push(Math.random() * 6.28); csz.push(2.8);
  }
  const wreath = new THREE.Mesh(mergeGeometries(shards, false), markerStoneMat);
  shards.forEach((s) => s.dispose());
  objs.push(wreath);
  objs.push(new THREE.Points(_veilGeo(cpos, ccol, cph, csz, 'aSize'), veilPointMat));
  return objs;
}

// shared drifting motes for the swirl/curtain (soft additive spirits away from the window)
function _veilMotes(o, skin, n) {
  const c = new THREE.Color(skin.mote), pos = [], col = [], phase = [], size = [];
  for (let i = 0; i < n; i++) {
    let x, y; do { x = -LX + Math.random() * LX * 2; y = Math.random() * LTOP; } while (Math.abs(x - o.gapX) < o.gapW && Math.abs(y - o.gapY) < o.gapH);
    pos.push(x, y, (Math.random() - 0.5) * 7); col.push(c.r, c.g, c.b); phase.push(Math.random() * 6.28); size.push(0.5 + Math.random() * 0.7);
  }
  return new THREE.Points(_veilGeo(pos, col, phase, size, 'aSize'), veilPointMat);
}

function buildGate(o, biOverride) {
  const group = new THREE.Group();
  group.userData.phaseGate = true;   // tag: lets tooling hide the harness-interleaved Phase Gate reliably
  const bi = biOverride != null ? biOverride : biomeIndexAt(o.dist);
  const skin = PHASE_SKINS[bi];
  const veilMat = veilMats[bi];
  const edgeMat = edgeMats[bi];
  const rimMat = rimMats[bi];

  const T = 1.2; // veil thickness (thin so the side faces read as a glowing rim)
  const X = 16; // veil half-span
  const TOP = 24;
  const left = o.gapX - o.gapW;
  const right = o.gapX + o.gapW;
  const bottom = o.gapY - o.gapH;
  const top = o.gapY + o.gapH;
  const W = o.gapW * 2;
  const H = o.gapH * 2;

  // Layer 3 — the VEIL: the full-lane barrier you thread the window in. Default is a
  // serene light barrier (swirl/wisp/curtain — the crystal-wall redesign); ?veil=crystal
  // keeps the prior faceted fresnel membrane + crack-lattice for A/B.
  if (veilStyle !== 'crystal') {
    const veil = (veilStyle === 'wisp') ? buildVeilWisp(o, skin)
      : (veilStyle === 'curtain') ? buildVeilCurtain(o, skin) : buildVeilSwirl(o, skin);
    for (const obj of veil.objects) group.add(obj);
    if (veil.spin) group.userData.veilSpin = veil.spin;
  } else {
  const latPos = [];
  const panel = (w, h, cx, cy) => {
    if (w <= 0.1 || h <= 0.1) return;
    const { geo, lattice } = facetedPanel(w, h, T);
    const mesh = new THREE.Mesh(geo, veilMat);
    mesh.position.set(cx, cy, 0);
    group.add(mesh);
    for (let i = 0; i < lattice.length; i += 3) latPos.push(lattice[i] + cx, lattice[i + 1] + cy, lattice[i + 2]);
  };
  panel(left + X, TOP, (left - X) / 2, TOP / 2); // left of gap
  panel(X - right, TOP, (right + X) / 2, TOP / 2); // right of gap
  panel(right - left, TOP - top, o.gapX, (top + TOP) / 2); // above gap
  panel(right - left, bottom, o.gapX, bottom / 2); // below gap

  // The crack-lattice colours: HOT (biome edge) within ~1.5 cells of the aperture
  // — reinforcing "fly here" and blooming — falling to a DARK biome tone at the
  // periphery, which reads as a crisp silhouette even where the glow is invisible
  // on a bright sky (the Frozen legibility fix). Replaces the 4 hairline rim bars.
  const hot = new THREE.Color(skin.edge);
  const dark = new THREE.Color(skin.edge).multiplyScalar(0.26);
  const latCol = [];
  const _lc = new THREE.Color();
  for (let i = 0; i < latPos.length; i += 3) {
    const dx = Math.max(Math.abs(latPos[i] - o.gapX) - o.gapW, 0);
    const dy = Math.max(Math.abs(latPos[i + 1] - o.gapY) - o.gapH, 0);
    const t = Math.min(Math.hypot(dx, dy) / 8, 1);
    _lc.copy(hot).lerp(dark, t);
    latCol.push(_lc.r, _lc.g, _lc.b);
  }
  const latGeo = new THREE.BufferGeometry();
  latGeo.setAttribute('position', new THREE.Float32BufferAttribute(latPos, 3));
  latGeo.setAttribute('color', new THREE.Float32BufferAttribute(latCol, 3));
  group.add(new THREE.LineSegments(latGeo, latticeMat));
  }

  const bar = (w, h, cx, cy, mat, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), mat);
    mesh.position.set(cx, cy, z);
    group.add(mesh);
  };

  // Layer 2 — the WINDOW MARKER. Serene styles: the redesigned iris + glacier-bloom
  // wreath (no UI frame, no viewfinder brackets — the owner rejected those). Crystal
  // (A/B): the prior Skyforged forged-glass frame + corner brackets, unchanged.
  if (veilStyle !== 'crystal') {
    for (const obj of buildWindowMarker(o, skin)) group.add(obj);
  } else {
    if (SKYFORGED) {
      group.add(new THREE.Mesh(buildGateFrame(o), gateFrameMats[bi]));
    } else {
      bar(W + 0.7, 0.5, o.gapX, top + 0.25, edgeMat, 0.3);
      bar(W + 0.7, 0.5, o.gapX, bottom - 0.25, edgeMat, 0.3);
      bar(0.5, H + 0.7, left - 0.25, o.gapY, edgeMat, 0.3);
      bar(0.5, H + 0.7, right + 0.25, o.gapY, edgeMat, 0.3);
    }
    const legLen = 1.2, gap = 0.75;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        const cx = o.gapX + sx * (o.gapW + gap), cy = o.gapY + sy * (o.gapH + gap);
        bar(legLen, 0.34, cx - sx * legLen / 2, cy, edgeMat, 0.5);
        bar(0.34, legLen, cx, cy - sy * legLen / 2, edgeMat, 0.5);
      }
    }
  }

  // Layer 4 — core-glow locator: a faint additive fill of the OPENING so the
  // safe route is easy to find from any altitude. Per-instance (approach-lit).
  const coreMat = new THREE.MeshBasicMaterial({
    color: skin.core, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  coreMat.userData.perInstance = true;
  const core = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coreMat);
  core.position.set(o.gapX, o.gapY, 0.12);
  core.layers.set(1); // out of the water reflection
  group.add(core);
  group.userData.core = core;

  // Layer 4 — long-range beacon: a tall biome-tinted light pillar above the
  // gap, visible through fog/bloom from far away (telegraphs the route early).
  const beaconMat = new THREE.MeshBasicMaterial({
    color: skin.edge, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  beaconMat.userData.perInstance = true;
  const beacon = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, 60), beaconMat);
  beacon.position.set(o.gapX, top + 30, 0.3);
  beacon.layers.set(1); // hidden from water reflection
  group.add(beacon);
  group.userData.beacon = beacon;

  // Layer 4 — sparse drifting motes for life (tertiary; one shared material per
  // gate, animated in updateObstacles). Tiny additive quads, kept low-density.
  const moteMat = new THREE.MeshBasicMaterial({
    color: skin.mote, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  moteMat.userData.perInstance = true;
  const motes = [];
  // The legacy drifting mesh-motes are the crystal style's atmosphere; the serene
  // light styles bring their own additive spirits, and the additive budget is tight
  // (core + beacon + the style's points must stay ≤ the cap), so skip them there.
  if (veilStyle === 'crystal') {
    const moteGeo = new THREE.PlaneGeometry(0.45, 0.45);
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(moteGeo, moteMat);
      const mx = o.gapX + (Math.random() * 2 - 1) * (X * 0.7);
      const my = 2 + Math.random() * (TOP - 4);
      m.position.set(mx, my, 0.4);
      m.userData = { baseX: mx, baseY: my, phase: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 0.7 };
      m.layers.set(1);
      group.add(m);
      motes.push(m);
    }
  }
  group.userData.motes = motes;
  group.userData.rise = skin.rise;

  group.position.z = -o.dist;
  return group;
}

// Inert STUDIO export (tools/veilstudio) — build ONE Phase Gate in ISOLATION for a
// given biome so the veil ("crystal wall") can be judged close-up and reproducibly,
// without the in-game camera/spawn fight (the propstudio pattern, for the gate).
// Lazily builds the shared gate materials via a scene-less initObstacles, and lights
// the approach-lit FX (core glow / beacon start at opacity 0 in-game) so the full
// read shows. Never imported by the running game.
export function buildStudioGate(bi = 0) {
  if (!veilMats) initObstacles({ add() {}, remove() {} });
  const g = buildGate({ dist: 0, gapX: 0, gapY: 11, gapW: 3.8, gapH: 3.4, thick: 1.5 }, bi);
  if (g.userData.core) g.userData.core.material.opacity = 0.12;  // faint — the window is open AIR; the marker carries the read
  if (g.userData.beacon) g.userData.beacon.visible = false;   // the far-range locator pillar distracts the close veil read
  return g;
}
// Drive the veil shimmer (uTime) for the studio — called per frame by the driver.
export function studioGateTick(t) {
  if (veilMats) for (const m of veilMats) m.uniforms.uTime.value = t;
  if (veilLineMat) veilLineMat.uniforms.uTime.value = t;
  if (veilPointMat) veilPointMat.uniforms.uTime.value = t;
}

// --- HAZARD SKINS (PR-3) ---------------------------------------------------
// Per-biome reskins of the in-lane hazards. A skin is a set of SHARED, normalized
// geometries built once and reused by every instance (scaled per collider radius),
// so N hazards cost one geometry. The COLLIDER in collision.js is untouched — the
// skin only changes the mesh — and every skin is authored so its visible silhouette
// stays OUTSIDE the collision envelope (proven with the studio's ghost + the
// numeric coverage check below). Missing skin → null → the byte-identical primitive
// fallback, so non-skinned biomes never change. Shared geos are tagged
// userData.shared so removeAt never disposes them out from under the next instance.
const BAR_REF = 0.85;   // reference collider radius the bar skin is authored at (gauntlet r; level.js spawns 0.7–1.1)

// CALVED SHELF-BEAM — the Frozen bar (Fable pre-assess 2026-07-14). Five sheared,
// interpenetrating flat-shaded ice sections fused into one tabular calving front
// that overshoots the lane (±16.5), with a STEPPED top and belly (excess mass goes
// up on some sections, down on others — never toward the collider), recessed
// crevasse glow at the fracture seams (upper third), and clustered short icicle
// teeth. No spin. Coverage invariant: every section's cross-section individually
// contains the collider box (half-height BAR_REF*0.75=0.64, half-depth BAR_REF=0.85),
// so the union covers the full lane with margin at any r. Sections carry small rolls
// (rx, safe — uniform along the lane axis) and tiny slant (rz, bounded) for the
// calved read; the numeric check asserts coverage holds.
// [len, cx, h, cy, d, rx(roll), rz(slant)] — authored at BAR_REF. Half-heights are
// kept ≥ 0.64(collider)+|cy|+roll-margin so every section covers the collider corner
// even shifted/rolled (the numeric check enforces it); depth is uniform so the front
// face can carry a consistent recessed crevasse channel.
const BAR_BOXES = [
  [7.4, -13.3, 2.06, 0.16, 2.20, 0.07, -0.05],   // end: tall, raw, steep slant
  [9.4, -6.5, 2.12, -0.18, 2.20, -0.08, 0.04],   // belly-heavy (thick slab, low belly)
  [7.6, 0.2, 2.00, 0.18, 2.20, 0.06, -0.03],     // mid: top-heavy
  [9.4, 6.6, 2.12, -0.16, 2.20, 0.08, 0.05],     // belly-heavy
  [7.4, 13.4, 2.08, 0.16, 2.20, -0.07, 0.06],    // end: tall, raw, steep slant
];
// Crevasse seams: [cx, cy, len, height] emissive slivers on the front (+z) face
// (front at z≈+1.1), upper third, sitting just proud of the face but OVERHUNG by a
// proud brow lip that shadows them → light escaping a fracture, NOT a proud LED
// strip. Two short, seam-anchored segments (never one full run = the light-saber).
const BAR_SEAMS = [
  [-8.4, 0.30, 4.6, 0.22],
  [4.2, 0.34, 4.2, 0.22],
];
// Icicle teeth hung under the belly — clustered, three length classes, never more
// than 0.7 below the collider bottom. [cx, len, baseR]
const BAR_TEETH = [
  [-12.6, 0.46, 0.46], [-11.7, 0.68, 0.54], [-11.0, 0.40, 0.40],  // cluster L
  [-4.5, 0.60, 0.50],  [-3.5, 0.80, 0.56],                        // cluster mid-L
  [1.7, 0.48, 0.44],                                              // lone
  [9.3, 0.78, 0.56], [10.2, 0.50, 0.46], [11.0, 0.64, 0.50],     // cluster R
];

function xf(geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = {}) {
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  geo.translate(x, y, z);
  return geo;
}

// The Frozen ICE VALUE LADDER — bake per-face vertex colours onto a merged,
// non-indexed, flat-shaded geometry from each triangle's geometric normal: near-
// white frost on upward faces, mid ice on verticals (hue nudged off the sky so the
// silhouette always separates), deep teal in the belly/shadow planes. This is what
// turns "one blue band" into premium low-poly ice at zero triangle cost.
const _FROST = [0.87, 0.93, 0.99], _MIDICE = [0.36, 0.60, 0.75], _BELLY = [0.13, 0.32, 0.40];
function bakeIceLadder(geo) {
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const ax = new THREE.Vector3(), bx = new THREE.Vector3(), cx = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    ax.fromBufferAttribute(pos, i); bx.fromBufferAttribute(pos, i + 1); cx.fromBufferAttribute(pos, i + 2);
    e1.subVectors(bx, ax); e2.subVectors(cx, ax); nr.crossVectors(e1, e2).normalize();
    const ny = nr.y;
    const c = ny > 0.35 ? _FROST : ny < -0.30 ? _BELLY : _MIDICE;
    for (let k = 0; k < 3; k++) { const o = (i + k) * 3; col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2]; }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

function buildFrozenBar() {
  const body = [], glow = [], shadow = [];
  for (const [len, cx, h, cy, d, rx, rz] of BAR_BOXES) {
    body.push(xf(new THREE.BoxGeometry(len, h, d), { x: cx, y: cy, rx, rz }));
  }
  // Teeth: tetrahedra (4 tris, no base cap needed — embedded), tip pointing down,
  // hung off the FRONT-belly edge so they read against the sky. Beefy girth so they
  // read as MASS, not fuzz. Capped so no tip drops > 0.7 below the collider bottom
  // (a long opaque tooth in the under-gap reads as a collision bug). The value
  // ladder tints their downward faces deep teal.
  const colliderBottom = -BAR_REF * 0.75;   // -0.64
  for (const [cx, len, baseR] of BAR_TEETH) {
    const t = new THREE.TetrahedronGeometry(baseR);
    t.scale(1, len / baseR, 1);             // stretch to a spike
    t.rotateX(Math.PI);                     // point down
    const topY = colliderBottom + 0.05;
    const tipY = Math.max(colliderBottom - 0.7, topY - len);
    xf(t, { x: cx, y: (topY + tipY) / 2, z: 0.86 });   // on the front-belly edge
    body.push(t);
  }
  // Crevasse seams: an emissive sliver PROUD of the front face, set into a dark-teal
  // recess backing (the socket that reads "crack with light inside it") and overhung
  // by a proud brow lip. Faint + short + segmented → a lit fracture, never an LED strip.
  for (const [cx, cy, len, hh] of BAR_SEAMS) {
    shadow.push(xf(new THREE.PlaneGeometry(len + 0.5, hh + 0.28), { x: cx, y: cy, z: 1.13 })); // dark socket
    glow.push(xf(new THREE.BoxGeometry(len, hh, 0.05), { x: cx, y: cy, z: 1.16 }));
    body.push(xf(new THREE.BoxGeometry(len + 0.6, 0.16, 0.12), { x: cx, y: cy + hh / 2 + 0.18, z: 1.20 })); // brow lip
  }
  // Tetrahedron teeth are non-indexed while BoxGeometry is indexed — normalize so
  // mergeGeometries can fuse them.
  const norm = (arr) => arr.map((g) => g.index ? g.toNonIndexed() : g);
  const bodyGeo = bakeIceLadder(mergeGeometries(norm(body), false)); bodyGeo.userData.shared = true;
  const glowGeo = mergeGeometries(norm(glow), false); glowGeo.userData.shared = true;
  const shadowGeo = mergeGeometries(norm(shadow), false); shadowGeo.userData.shared = true;
  return { parts: [
    { geo: bodyGeo, mat: mats.frostIce },
    { geo: shadowGeo, mat: mats.frostShadow },
    { geo: glowGeo, mat: mats.frostGlow },
  ], ref: BAR_REF };
}

const SKIN_BUILDERS = {
  2: { bar: buildFrozenBar },   // Frozen; pillar/shard added in later PR-3 steps
};
const _skinCache = {};
function obstacleSkin(bi, type) {
  const b = SKIN_BUILDERS[bi] && SKIN_BUILDERS[bi][type];
  if (!b) return null;
  const key = bi + ':' + type;
  return (_skinCache[key] || (_skinCache[key] = b()));
}

// Unified hazard builder — used by BOTH addObstacle (game) and the studio, so what
// is Fable-graded is what ships. Returns the object in its LOCAL frame (origin =
// the collider anchor); the caller sets world position. Falls back to the shipped
// primitive when no skin exists (byte-identical for non-skinned biomes).
function hazardMesh(type, bi, p) {
  if (type === 'bar') {
    const skin = obstacleSkin(bi, 'bar');
    if (skin) {
      const g = new THREE.Group();
      for (const part of skin.parts) g.add(new THREE.Mesh(part.geo, part.mat));
      const s = p.r / skin.ref;
      g.scale.set(1, s, s);            // x fixed (spans the lane); y/z track the collider
      g.userData.skinned = true;
      return g;
    }
    const m = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 30, 8), mats.body[bi]);
    m.rotation.z = Math.PI / 2;
    return m;
  }
  if (type === 'pillar') {
    return new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 6), mats.body[bi]);
  }
  // shard
  return new THREE.Mesh(new THREE.OctahedronGeometry(p.r), p.dynamic ? mats.mover : mats.body[bi]);
}

// Numeric FAIRNESS check for the skinned bar: sample the collider outline
// (|dz|<r, |y-cy|<r*0.75, full lane x) and assert every sample point sits INSIDE
// some body section — i.e. the mesh never leaves a gap in the collision envelope
// ("looks passable but kills"). Returns { ok, worstX, gaps }. Studio/tests call it.
export function barColliderCoverage(r = BAR_REF) {
  const s = r / BAR_REF;
  const halfY = r * 0.75, halfZ = r;      // collider half-extents at this r
  const LANE = CONFIG.laneHalfWidth;
  const inBox = (px, py, pz, box) => {
    const [len, cx, h, cy, d, rx, rz] = box;
    // point in the section's local frame (built: rotateX(rx)→rotateZ(rz)→translate(cx,cy),
    // then group-scaled by s in y,z). Undo scale, translate, rz, rx.
    let x = px, y = py / s, z = pz / s;    // undo group y/z scale (x unscaled)
    x -= cx; y -= cy;
    // undo rotateZ
    const cz = Math.cos(-rz), sz = Math.sin(-rz);
    const x1 = x * cz - y * sz, y1 = x * sz + y * cz; x = x1; y = y1;
    // undo rotateX
    const cx2 = Math.cos(-rx), sx2 = Math.sin(-rx);
    const y2 = y * cx2 - z * sx2, z2 = y * sx2 + z * cx2; y = y2; z = z2;
    return Math.abs(x) <= len / 2 + 1e-4 && Math.abs(y) <= h / 2 + 1e-4 && Math.abs(z) <= d / 2 + 1e-4;
  };
  const gaps = [];
  // sample the collider surface densely in x, at the worst-case corners in y,z
  for (let ix = -LANE; ix <= LANE; ix += 0.25) {
    for (const yy of [-halfY, 0, halfY]) {
      for (const zz of [-halfZ, 0, halfZ]) {
        const covered = BAR_BOXES.some((b) => inBox(ix, yy, zz, b));
        if (!covered) gaps.push([+ix.toFixed(2), yy.toFixed(2), zz.toFixed(2)]);
      }
    }
  }
  return { ok: gaps.length === 0, gaps: gaps.slice(0, 12), gapCount: gaps.length };
}

// --- OBSTACLE STUDIO (tools/obstaclestudio) --------------------------------
// The in-lane hazards (bar / pillar / shard) are shipped as generic primitives
// (a cone, a horizontal cylinder "log", an octahedron) that don't read as ice —
// the owner wants them reskinned per biome. Before touching a shipped pixel we
// need a workbench: build ONE hazard in ISOLATION, at its REAL collider scale,
// so a reskin can be Fable-gated AND proven "visual ≥ hitbox, never less". Inert
// (never imported by the running game). Representative params (mid of level.js's
// spawn ranges) so the studio read is honest, overridable via opts.params.
const OBSTACLE_STUDIO_PARAMS = {
  pillar: { r: 2.3, h: 15 },   // level.js: r 1.6–3.0, h 8–21
  shard:  { r: 2.0, y: 0 },    // level.js: r 1.3–2.6
  bar:    { r: 0.85, y: 0 },   // level.js: r 0.7–1.1, spans the full lane
};
// The VISUAL body — the SAME hazardMesh() the game builds (skin when present, else
// primitive fallback), so what is Fable-graded here is exactly what ships. Applies
// the game's local→world y offset (pillar base sits on the floor at y=h/2).
function obstacleBody(type, bi, p) {
  const m = hazardMesh(type, bi, p);
  m.position.y = type === 'pillar' ? p.h / 2 : (p.y || 0);
  return m;
}
// The COLLISION ENVELOPE as a wireframe ghost — the hazard-intrinsic term of the
// collider from collision.js (player radius R is added at runtime; shown as 0
// here). A reskin must keep its visible silhouette OUTSIDE this ghost everywhere
// (never "looks passable but kills"), and the collider itself must stay byte-
// identical, so these ghosts are the acceptance test rendered next to each skin.
function obstacleColliderGhost(type, p) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff4a4a, wireframe: true, transparent: true, opacity: 0.6 });
  let g;
  if (type === 'pillar') {          // horiz < r*0.65  &&  y < h  → vertical cylinder from floor
    g = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.65, p.r * 0.65, p.h, 20), mat);
    g.position.y = p.h / 2;
  } else if (type === 'shard') {    // dist3 < r*0.70  → sphere
    g = new THREE.Mesh(new THREE.SphereGeometry(p.r * 0.70, 20, 14), mat);
    g.position.y = p.y || 0;
  } else {                          // |dz| < r  &&  |y-cy| < r*0.75  → box, FULL lane in x (no x term)
    g = new THREE.Mesh(new THREE.BoxGeometry(32, p.r * 1.5, p.r * 2), mat);
    g.position.y = p.y || 0;
  }
  return g;
}
// Build one hazard for the studio. opts.hitbox overlays the collision-envelope
// ghost; opts.params overrides the representative sizing; opts.dynamic renders the
// oscillating shard (hot mover material). Returns a Group centred for framing.
export function buildObstacleMesh(type, bi = 0, opts = {}) {
  if (!mats) initObstacles({ add() {}, remove() {} });
  const p = { ...(OBSTACLE_STUDIO_PARAMS[type] || {}), ...(opts.params || {}), dynamic: !!opts.dynamic };
  const g = new THREE.Group();
  g.add(obstacleBody(type, bi, p));
  if (opts.hitbox) g.add(obstacleColliderGhost(type, p));
  g.userData.params = p;
  return g;
}

// --- Sky Canyon rock gates -------------------------------------------------
// A canyon segment frames a safe aperture (centered on a reward ring) with rock
// masses, an emissive aperture rim ("glowing crystal cracks"), and an additive
// core-glow locator. The rock uses a PER-INSTANCE clone of the biome body
// material so it can dissolve to nothing as it nears the camera (so a cleared
// rock never blocks the view of what's next). Open-top by design: masses flank /
// arch / shelf the gap but never seal the sky. Each mass also records an
// axis-aligned collider box (`e.boxes`) consumed by collision.js.
export function addCanyonSegment(o) {
  const e = { ...o, type: 'rockGap', object: null, boxes: [], fadeMat: null, core: null };
  e.object = buildRockGap(o, e);
  scene.add(e.object);
  entries.push(e);
}

function buildRockGap(o, e) {
  const bi = biomeIndexAt(o.dist);
  const skin = PHASE_SKINS[bi];
  const rng = mulberry32((o.seed ^ 0x9e3779b9) >>> 0);
  const group = new THREE.Group();
  const gx = o.gapX, gy = o.gapY, W = o.gapW, H = o.gapH, T = o.thick;
  const LANE = CONFIG.laneHalfWidth;
  const CEIL = CONFIG.canyonCeilingY;
  const spine = o.run === 'spine';

  // One per-instance base material for ALL solids in this gate → they dissolve
  // together near the camera. Bone for the Dragon Spine, biome rock otherwise.
  const fadeMat = (spine ? mats.bone : mats.body[bi]).clone();
  fadeMat.transparent = true;
  fadeMat.opacity = 1;
  fadeMat.userData.perInstance = true;
  e.fadeMat = fadeMat;
  const edgeMat = edgeMats[bi];

  // --- build helpers --------------------------------------------------------
  const place = (geo, x, y, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, fadeMat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    group.add(m); return m;
  };
  // oz = the box's local z-offset from the segment centre (lets a ribcage wall
  // sit at a specific rib's depth so collision can follow the lateral sweep).
  const box = (cx, cy, hw, hh, hz = T, oz = 0) => e.boxes.push({ cx, cy, hw, hh, hz, oz });
  // Faceted lump (rock boulder OR a chunk of bone) + matching collider box.
  const lump = (cx, cy, hw, hh, hz, jag = 0.34) => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    geo.scale(hw, hh, hz);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const j = 1 - jag * 0.5 + rng() * jag;
      pos.setXYZ(k, pos.getX(k) * j, pos.getY(k) * j, pos.getZ(k) * j);
    }
    geo.computeVertexNormals();
    place(geo, cx, cy, 0, rng() * 0.3 - 0.15, rng() * Math.PI, rng() * 0.3 - 0.15);
    box(cx, cy, hw, hh, hz);
  };
  const slab = (cx, cy, hw, hh, hz) => {
    place(new THREE.BoxGeometry(hw * 2, hh * 2, hz * 2), cx, cy);
    box(cx, cy, hw, hh, hz);
  };
  const decorCone = (r, h, x, y, z, rx = 0, ry = 0, rz = 0) =>
    place(new THREE.ConeGeometry(r, h, 5), x, y, z, rx, ry, rz);

  // One jagged faceted shard (5-sided crystal/rock spike), jittered, baked into a
  // given transform so a cluster can be MERGED into one mesh (1 draw call).
  const shardGeo = (r, h, ox, oy, oz, tilt, pointDown = false) => {
    const g = new THREE.ConeGeometry(r, h, 5);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      if (v.y < h * 0.42) { const j = 0.78 + rng() * 0.5; v.x *= j; v.z *= j; } // crag the body, keep the tip
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.translate(0, h / 2, 0);                 // base at 0, tip at h
    if (pointDown) g.rotateX(Math.PI);        // tip points down (stalactite)
    g.rotateY(rng() * Math.PI);
    g.rotateZ(tilt);
    g.translate(ox, oy, oz);
    return g;
  };

  // A canyon wall built from the biome's OWN vocabulary: a jagged ridge of sharp
  // faceted shards (like the biome's spire props), tinted by the biome body
  // material — not a smooth blob. Merged to one mesh; collider hugs the lane band.
  const seaStack = (cx, hw, topY, botY, z = 0, lean = 0, hzCol = T, crest = true) => {
    const h = topY - botY;
    const n = Math.max(2, Math.round(hw / 2.2));     // shards across the wall width
    const sr = (hw / n) * 1.15;                       // radius sized to fit WITHIN the wall
    const span = Math.max(0, hw - sr);               // keep shard edges inside ±hw (no poking into the lane/channel)
    const parts = [];
    for (let i = 0; i < n; i++) {
      const base = n > 1 ? -span + (i / (n - 1)) * 2 * span : 0;
      const sx = base + (rng() - 0.5) * sr * 0.3;     // small jitter, stays contained
      const r = sr * (0.85 + rng() * 0.25);
      const sh = h * (0.62 + rng() * 0.42);           // uneven, jagged crest
      parts.push(shardGeo(r, sh, sx, botY, (rng() - 0.5) * hzCol * 0.4, lean + (rng() - 0.5) * 0.16));
    }
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    merged.computeVertexNormals();
    // SEE-THROUGH spire: a per-instance translucent material (like the arches), faded
    // per-spire by its own depth in updateObstacles — SOLID far out so you read the
    // winding channel ahead, TRANSLUCENT as it nears so you see the lateral path
    // THROUGH it (the fix for "blind at boost speed"). Floored so it never fully
    // vanishes — it has a collider.
    const smat = mats.body[bi].clone();
    smat.transparent = true; smat.depthWrite = false; smat.userData.perInstance = true;
    const m = new THREE.Mesh(merged, smat);
    m.position.set(cx, 0, z);
    group.add(m);
    (e.spireFades || (e.spireFades = [])).push({ mat: smat, dist: o.dist - z });
    // Collider TAPERS with the spire so flying high to a ring doesn't clip the
    // full-width box where the rock is only thin tips: a solid lower body, then a
    // narrower crest pulled back up high — and the crest is DROPPED near a ring so
    // lunging up to grab a high ring never clips a thin tip.
    box(cx, 6, hw, 9, hzCol, z);            // body: y -3..15, full width
    if (crest) box(cx, 18, hw * 0.6, 4.5, hzCol, z);   // crest: y 13.5..22.5, narrow
  };

  // A continuous RUN of sea stacks: frequent towers alternating left/right that
  // bound a gently winding channel, so there's essentially ONE path threading
  // between them. The wind is smooth (always reachable) and continuous across
  // sections; towers lean toward the channel; the channel is wider than the gap
  // so the reward ring always sits inside it. Open on the far side of each lone
  // tower, so you can always see the slot ahead and plan.
  const stackRun = (depthHalf, count) => {
    e.depthHalf = Math.max(e.depthHalf || 0, depthHalf);
    e.noDissolve = true;
    const top = CEIL + 2, bot = -3;      // rise from the "sea" below up past the ceiling
    const sp = (2 * depthHalf) / count;
    const hz = sp * 0.6;
    const runIdx = o.runIdx || 0;
    // The channel winds; cos(π·…) sits it centred on the reward ring at each ring
    // plane and stays continuous across section seams. Centre clamped to the lane
    // so a strong wind is always fair.
    const sway = (f) => (o.swaySign || 1) * 5.0 * Math.cos(Math.PI * (runIdx - 2 + f));
    const CLAMP = LANE - (W + 2) - 1;
    for (let k = 0; k < count; k++) {
      const f = (k + 0.5) / count;
      const z = -depthHalf + f * 2 * depthHalf + (rng() - 0.5) * sp * 0.25;
      const xc = Math.max(-CLAMP, Math.min(CLAMP, gx + sway(f)));
      // Breathing channel: claustrophobic pinches that open to a breath and back,
      // one cycle per section — the rhythm is where the adrenaline lives.
      const breathe = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (runIdx - 2 + f));
      const chanHalf = W + 0.1 + breathe * 1.7;
      // BOTH walls — you're flanked left AND right by tall stacks (not one open
      // side), so it reads as a canyon you're INSIDE, not a line you fly past.
      let li = xc - chanHalf, ri = xc + chanHalf;
      // Around the ring — INCLUDING its approach (a wide z-window, not just the ring
      // plane) — carve a generous CENTRED pocket so no tower sits in front of the
      // ring's approach line and you can sit dead-centre to grab it at speed without
      // decelerating. Near the ring we also DROP the spire crests so a high ring is
      // reachable without clipping a tip (the canyon ceiling still caps the climb).
      const nearRing = Math.abs(z) < 12;
      if (nearRing) { li = Math.min(li, gx - 7); ri = Math.max(ri, gx + 7); }
      const lo = -LANE - 3, ro = LANE + 3;
      if (li - lo > 1.4) seaStack((lo + li) / 2, (li - lo) / 2, top, bot, z, 0.06, hz, !nearRing);
      if (ro - ri > 1.4) seaStack((ro + ri) / 2, (ro - ri) / 2, top, bot, z, -0.06, hz, !nearRing);
      // Overhead rock bridge every other slice — caps the canyon so you're caged
      // from ABOVE too (the missing dimension), ducking under arch after arch.
      // Non-fatal rock, so a graze on a wobble just chips, never a cheap death.
      // Each arch is an irregular faceted chunk on its OWN material that fades as
      // you approach, so the near one turns translucent and you see the next ones.
      if (k % 2 === 1) {
        const ay = gy + H + 5;                         // crest, high enough that tips clear the gap
        const aw = chanHalf + 1.6;
        const an = Math.max(2, Math.round(aw / 2.2));
        const aparts = [];
        for (let i = 0; i < an; i++) {                 // a row of downward shards (stalactites)
          const sx = -aw + ((i + 0.5) / an) * 2 * aw + (rng() - 0.5);
          aparts.push(shardGeo(0.9 + rng() * 0.8, 2 + rng() * 2, sx, 0, (rng() - 0.5) * hz * 0.5, (rng() - 0.5) * 0.25, true));
        }
        const ageo = mergeGeometries(aparts, false);
        aparts.forEach((g) => g.dispose());
        ageo.computeVertexNormals();
        const amat = mats.body[bi].clone();
        amat.transparent = true; amat.depthWrite = false; amat.userData.perInstance = true;
        const a = new THREE.Mesh(ageo, amat);
        a.position.set(xc, ay, z);
        group.add(a);
        box(xc, ay - 1.6, chanHalf + 1.4, 2, hz * 0.85, z);
        (e.archFades || (e.archFades = [])).push({ mat: amat, dist: o.dist - z });
      }
    }
    // Low sea-mist hugging the WATER (very subtle, kept low so it never washes the
    // slot into glare). A couple of soft discs; biome fog + parallax do the rest.
    for (let m = 0; m < 2; m++) {
      const mz = -depthHalf + ((m + 0.5) / 2) * 2 * depthHalf;
      const q = new THREE.Mesh(new THREE.CircleGeometry(LANE * (0.85 + rng() * 0.3), 16), mats.mist);
      q.position.set(gx + (rng() - 0.5) * 5, 0.4 + rng() * 2, mz);
      group.add(q);
    }
  };

  // Rock Run v2 — the "carved slot": ONE threaded, gently-swayed channel (the same
  // eased ring-line as the ribcage + a slope-budgeted sway), span-adaptive so
  // sections abut, and NO overhead arches (the vertical duck is the 'overunder'
  // beat's job — one axis at a time). Geometry is driven entirely by the shared
  // rockSlicePlan so the flow audit verifies the literal channel the player flies.
  const stackRunV2 = () => {
    const plan = rockSlicePlan(o);
    e.depthHalf = Math.max(e.depthHalf || 0, plan.bk, plan.fw);
    e.noDissolve = true;
    const top = CEIL + 2, bot = -3;
    const hz = ((plan.wb + plan.wf) / Math.max(plan.slices.length, 1)) * 0.6; // tiles along z
    // Place at -s.z: rockSlicePlan's z>0 is the exit half (toward nextX), but the world
    // maps local +z to a SMALLER dist (the approach side), so the exit half must sit at
    // -z (physical dist = o.dist + z) or each section's forward half lands on the backward
    // side and adjacent sections mismatch at rhythm changes (a wall across the slot).
    for (const s of plan.slices) {
      // Fill from the PER-HALF effective lane edge (s.laneHW: wider in the run interior,
      // ±13 on the boundary halves) so the widened channel still reads as rock, not air.
      const lo = -s.laneHW - 3, ro = s.laneHW + 3;
      if (s.li - lo > 1.4) seaStack((lo + s.li) / 2, (s.li - lo) / 2, top, bot, -s.z, 0.06, hz, !s.noCrest);
      if (ro - s.ri > 1.4) seaStack((ro + s.ri) / 2, (ro - s.ri) / 2, top, bot, -s.z, -0.06, hz, !s.noCrest);
    }
    // Low sea-mist over the section span (same as v1, keyed to the abutting band).
    for (let m = 0; m < 2; m++) {
      const mz = -plan.wb + ((m + 0.5) / 2) * (plan.wb + plan.wf);
      const q = new THREE.Mesh(new THREE.CircleGeometry(LANE * (0.85 + rng() * 0.3), 16), mats.mist);
      q.position.set(gx + (rng() - 0.5) * 5, 0.4 + rng() * 2, -mz);
      group.add(q);
    }
  };

  // A run of SUCCESSIVE rib bones along the flight axis — the actual ribcage.
  // Each rib is a curved hoop around the corridor (open at the belly), hung off a
  // dorsal spine of vertebrae, repeated frequently down z so you fly through a
  // barrel of ribs (sky shows BETWEEN the ribs). Collision is a thin shell hugging
  // the corridor and spanning the section depth — fly down the middle. Going wide
  // around the cage is possible but loses the reward ring at its centre.
  // A ribcage sized to LOCAL ring spacing (backward `span` + forward `spanFwd`), so
  // the bone tunnel tiles edge-to-edge on every rhythm. `mult` shrinks the throat.
  const ribcage = (mult = 1, opts = {}) => {
    const { flare = 0, vert = 0, neural = false } = opts;
    const { bk, fw } = halves(o, mult);            // entry/exit easing lengths
    const { wb, wf } = band(o, bk, fw);            // wall/collider band (abutting tiles)
    e.ribBandBk = wb; e.ribBandFw = wf;            // world rib coverage [dist-wb, dist+wf]
                                                   // → spineWallPresenceAt() fades the
                                                   // speed FX out in genuinely rib-free air
    const { xAt, yAt } = centre(o, bk, fw);        // C1 corridor centre (X AND Y)
    const sway = spineSway(o, bk, fw);             // lateral sweep between rings (racing-tunnel S-curve)
    const nRibs = Math.max(6, Math.round((wb + wf) / 6)); // ~6m rib pitch across the ABUTTING band only
    e.depthHalf = Math.max(e.depthHalf || 0, bk, fw); // broad-phase spans the full section
    e.noDissolve = true;        // thin, open ribs never block the view → don't fade
    const cx = 2 * W;           // TWICE as wide
    const cy = H + 7.0;         // TALLER — the arch clears the forward sightline (raised
                                // +1.5 to hold the dorsal-apex screen height now that the
                                // tube centre dropped onto the ring — see below)
    // The rib centre follows a SMOOTH C1 curve through the rings in BOTH axes now
    // (prevY/nextY thread the vertical the same way prevX/nextX thread the lateral),
    // so the tube no longer teleports up/down at a seam. The tube centre is EXACTLY the
    // ring centre (gapX,gapY) at z=0 — NO belly lift — so flying the visual tunnel
    // centre-line scores a perfect (the old +1.5 lift exceeded ringCenterRadius 1.4, so
    // a centred flight could never perfect, and the ring hung at the open belly). The
    // finale orb (also at gapY) is centred for free.
    const cor = CORRIDOR_HALF;   // shared with the flow audit (== cx * 0.92)
    const bandLen = wb + wf;
    const wallHz = (bandLen / nRibs) * 0.6; // staggered cell pitch, slight overlap
    // Joint relief: on a BIG bend, drop the side-wall colliders (not the visible hoops)
    // for the outer sliver at that end, so the corridor can't pinch below what the
    // player can hold at the blind seam metre. Symmetric from shared pair data.
    const px = o.prevX !== undefined ? o.prevX : gx, nx = o.nextX !== undefined ? o.nextX : gx;
    const py = o.prevY !== undefined ? o.prevY : gy, ny = o.nextY !== undefined ? o.nextY : gy;
    const reliefIn = (Math.abs(px - gx) > 10 || Math.abs(py - gy) > 7) ? 0.15 * bandLen : 0;
    const reliefOut = (Math.abs(nx - gx) > 10 || Math.abs(ny - gy) > 7) ? 0.15 * bandLen : 0;

    // Ribs are emitted ONLY across the abutting band [-wb, wf], cell-centred (staggered)
    // so adjacent sections don't stack a doubled ghost rib on the shared seam plane. The
    // tube centre carries the lateral sweep so the whole run banks like a speed tunnel.
    for (let k = 0; k < nRibs; k++) {
      const f = (k + 0.5) / nRibs;
      const z = -wb + f * bandLen;   // MATH z: >0 = exit half (toward nextX). The world
      const wz = -z;                 // maps local +z to a SMALLER dist (the approach side),
                                     // so the exit half must be PLACED at -z (physical dist
                                     // = o.dist + z). Without this flip each section's
                                     // forward-eased half lands on the backward side and the
                                     // seams mismatch at rhythm changes (doubled ribs / a
                                     // wall across the slot). Math (sway/ease/relief) stays z.
      const sxz = sway(z);
      const ox = xAt(z) + sxz;
      const oy = yAt(z);          // tube centre == ring centre (no belly lift) → perfect flyable
      const inRelief = z < -wb + reliefIn || z > wf - reliefOut;
      if (!inRelief) {
        box(ox - cor, oy, 0.4, cy * 0.9, wallHz, wz);
        box(ox + cor, oy, 0.4, cy * 0.9, wallHz, wz);
      }
      // Rib-free reward window: skip the VISIBLE hoop within 5m of the ring plane so a
      // rib bone never reads as intersecting the reward-ring disc ("stuck in a rib").
      // The wall colliders above stay, so the corridor is unbroken; the ring gets a
      // frame of open air. (Placement flip means the ring plane is z=0 either way.)
      if (Math.abs(z) < 5.0) continue;
      const wS = cx * (1 + flare * Math.abs(f - 0.5) * 1.6);
      const hS = cy * (1 + flare * Math.abs(f - 0.5) * 0.9);
      // Bank the hoop into the turn (roll about the flight axis by the sweep slope) for
      // the racing lean — visual only, the hoop has no collider. Travel is +z now.
      const bank = Math.max(-0.16, Math.min(0.16, 2.4 * (sway(z + 1) - sxz)));
      const rib = place(new THREE.TorusGeometry(1, 0.1, 3, 12, Math.PI * 1.55),
        ox, oy, wz, (rng() - 0.5) * 0.12, 0, -Math.PI * 0.3 + bank); // belly-down + bank
      rib.scale.set(wS, hS, wS);
      place(new THREE.IcosahedronGeometry(0.7 + vert, 0), ox, oy + hS + 0.3, wz); // dorsal vertebra
      if (neural) place(new THREE.ConeGeometry(0.6, 2.2, 5), ox, oy + hS + 1.7, wz); // neural spine
    }
  };

  // --- ROCK RUN -------------------------------------------------------------
  if (o.kind === 'split') {
    // v2: one threaded, slope-budgeted carved slot (weave only — the duck is the
    // 'overunder' beat). v1 (flag off): the old teleporting double-wall + arch-duck.
    if (CONFIG.canyonRockV2) stackRunV2();
    else stackRun(36, 6);
  } else if (o.kind === 'overunder') {
    // A rounded rock mass juts from the ceiling (dive under) or a shelf rises from
    // the floor (climb over) — a vertical squeeze between the tower slots. The lump
    // spans the (v2-widened) rock lane so the wider corridor doesn't open a lateral
    // flank around the squeeze; the outer tips past the eased wall are unreachable.
    const ouHalf = (CONFIG.canyonRockV2 ? CONFIG.canyonRockLaneHalfWidth : LANE) + 1;
    if (o.shelf === 'floor') lump(gx, gy - H - 3, ouHalf, 3, T, 0.5);
    else lump(gx, gy + H + 3, ouHalf, 3, T, 0.5);

  // --- DRAGON SPINE CANYON --------------------------------------------------
  } else if (o.kind === 'skull') {
    // A dragon skull you fly INTO: an elongated cranium + heavy brow over recessed
    // glowing eyes, a tapering snout/jaw framing the mouth, swept-back horns and
    // interlocking fangs. Smoother shapes + deliberate placement so it reads as a
    // HEAD, not a pile of rock. The open mouth IS the gap; colliders frame it but
    // never intrude on the opening.
    const cz = T + 1.2;                          // bring the face toward the approach
    // A smooth-ish bone mass: a once-subdivided icosa, lightly jittered, NO random
    // spin (so elongated shapes keep their intended orientation), + a frame collider.
    const boneMass = (cx, cy, z, hw, hh, hz, jag = 0.13, rx = 0) => {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      geo.scale(hw, hh, hz);
      const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) { const j = 1 - jag * 0.5 + rng() * jag; p.setXYZ(k, p.getX(k) * j, p.getY(k) * j, p.getZ(k) * j); }
      geo.computeVertexNormals();
      place(geo, cx, cy, z, rx, 0, 0);
      box(cx, cy, hw, hh, hz, z);
    };
    boneMass(gx, gy + H + 6.8, -1.5, W + 6, 5.2, T + 4.5, 0.11, -0.25);  // cranium dome (up & back)
    boneMass(gx, gy + H + 3.4, cz, W + 5.2, 1.2, T + 1.8, 0.1);          // heavy brow ridge
    boneMass(gx, gy + H + 1.6, cz + 0.6, W + 3, 1.6, T + 2.6, 0.12);     // snout / upper jaw (bottom at mouth top)
    boneMass(gx, gy - H - 1.6, cz + 0.4, W + 3, 1.6, T + 2.2, 0.13);     // lower jaw (top at mouth bottom)
    boneMass(gx - (W + 2.7), gy + 0.4, cz - 0.4, 1.7, H + 2.2, T + 1, 0.16); // L cheekbone
    boneMass(gx + (W + 2.7), gy + 0.4, cz - 0.4, 1.7, H + 2.2, T + 1, 0.16); // R cheekbone
    // Eye sockets: a dark recessed ring with the soul-fire eye set deep inside,
    // angled down-and-out so the skull reads as glaring at you.
    const socketGeo = new THREE.TorusGeometry(1.45, 0.55, 6, 16);
    for (const sx of [-1, 1]) {
      const ex = gx + sx * (W + 2.3), ey = gy + H + 2.2;
      const sock = new THREE.Mesh(socketGeo, mats.socket);
      sock.position.set(ex, ey, cz + 0.5); sock.rotation.set(0.25, sx * 0.35, 0);
      group.add(sock);
      const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), mats.soul);
      eye.position.set(ex, ey, cz + 0.1);
      group.add(eye);
    }
    // Swept-back horns: long, smooth, angled up & back & splayed out from the crown.
    for (const sx of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(1.4, 11, 7), fadeMat);
      horn.position.set(gx + sx * (W + 4.2), gy + H + 9.5, -2.5);
      horn.rotation.set(-0.7, 0, sx * 0.5);
      group.add(horn);
    }
    // Interlocking fangs along the jaw lines — bigger canines at the corners.
    const nteeth = 6;
    for (let k = 0; k < nteeth; k++) {
      const tx = gx - (W + 0.4) + (k / (nteeth - 1)) * 2 * (W + 0.4);
      const big = (k === 0 || k === nteeth - 1) ? 2.0 : 1.2;
      decorCone(0.46, big, tx, gy + H + 0.1, cz + 1, Math.PI, 0, 0);     // upper fang ↓
      decorCone(0.4, big * 0.8, tx, gy - H - 0.1, cz + 1, 0, 0, 0);      // lower fang ↑
    }
  } else if (o.kind === 'throat') {
    // First interior beat: neck vertebrae + the first ribs, tiling into the cage.
    ribcage(kindMult(o.kind), { vert: 0.6 });
    // Lateral entrance gnarls: bone buttresses fill the OUTER lane margins so you're
    // funnelled INTO the ribcage rather than skimming around it. Sized to whatever
    // room is left beside the (possibly off-centre) opening, so they never seal the
    // way in — the corridor + a margin always stays clear.
    const safeHalf = 2 * W * 0.92 + 1.6;          // just outside the rib corridor
    const cyW = (CONFIG.laneMinY + CEIL) / 2, hhW = (CEIL - CONFIG.laneMinY) / 2;
    const lInner = gx - safeHalf, rInner = gx + safeHalf;
    if (lInner > -LANE + 1.5) lump((-LANE + lInner) / 2, cyW, (lInner + LANE) / 2, hhW, T, 0.3);
    if (rInner < LANE - 1.5) lump((LANE + rInner) / 2, cyW, (LANE - rInner) / 2, hhW, T, 0.3);
  } else if (o.kind === 'rib' || o.kind === 'straightrib') {
    // The rib run: a CONTINUOUS run of successive ribs that wind GENTLY with the ring
    // line (a smooth curve, rings dead-centre), tiling edge-to-edge as one long
    // tunnel. The finale ('straightrib') is the same ribs with a line of speed orbs
    // down the centre (placed in level.js) — boost flat-out and burst into open air.
    ribcage(kindMult(o.kind), {});
  } else if (o.kind === 'flowgate') {
    // FLOW run gate. Two visual grammars, chosen by the ?skyforged kill-switch (both
    // share the fixed slip-cyan signature — never edgeMats[bi] — so a flow run reads as
    // its own place, and both are walls-free: e.boxes stays EMPTY). The green reward ring
    // survives untouched as the bullseye nested inside.
    e.noDissolve = true;
    const fh = halves(o), fb = band(o, fh.bk, fh.fw);
    e.depthHalf = Math.max(e.depthHalf || 0, fh.bk, fh.fw);
    e.ribBandBk = fb.wb; e.ribBandFw = fb.wf;     // presence band → the chain-slipstream FX
    const j = () => (rng() - 0.5);                 // seeded per-gate cosmetic jitter (no Math.random)
    if (SKYFORGED) {
      // WINDVAULT (premium): one tapered arch of forged glass; the light CLIMBS the arch
      // with the slipstream (updateObstacles writes markerFlow). One merged faceted mesh.
      group.add(new THREE.Mesh(buildWindvault(gx, gy, j()), markerMat));
    } else {
      // "SKY GATE" (fallback, ?skyforged=0): twin light-posts + a down-chevron roof + a
      // counter-rotating dashed halo + an apex gem. Kept for the owner's A/B against the
      // Windvault; deleted in a follow-up after sign-off.
      const parts = [];
      const bar = (w, h, d, x, y, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); g.translate(x, y, 0); parts.push(g); };
      const postY0 = Math.max(1.5, gy - 7), postY1 = gy + 6, postH = postY1 - postY0, postYc = (postY0 + postY1) / 2;
      for (const sx of [-1, 1]) {
        const px = Math.max(-12.5, Math.min(12.5, gx + sx * 7.5));
        bar(0.35, postH, 0.35, px, postYc, sx * 0.03 * j());       // post (slight seeded lean)
        bar(5.0, 0.3, 0.3, (px + gx) / 2, (postY1 + gy + 8) / 2, -sx * 0.42); // chevron half → apex (gx, gy+8)
      }
      const gate = new THREE.Mesh(mergeGeometries(parts, false), flowEdgeMat);
      parts.forEach((g) => g.dispose());
      group.add(gate);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), flowCoreMat);
      gem.position.set(gx, gy + 8, 0);
      group.add(gem);
      const arcs = [];
      for (let a = 0; a < 4; a++) { const g = new THREE.TorusGeometry(CONFIG.ringRadius + 2.0, 0.14, 6, 10, Math.PI / 3); g.rotateZ(a * Math.PI / 2); arcs.push(g); }
      const halo = new THREE.Mesh(mergeGeometries(arcs, false), flowCoreMat);
      arcs.forEach((g) => g.dispose());
      halo.position.set(gx, gy, 0);
      halo.rotation.z = j() * 3;                     // seeded start phase
      group.add(halo);
      e.flowHalo = halo;
    }
  }

  // No rim/frame on any canyon gate: every opening is framed by its own rock
  // (sea-stack slot, over-under squeeze, skull jaws/teeth, ribcage). A rectangular
  // bar frame read as an odd "crystal window" box, so it's gone.

  group.position.z = -o.dist;
  return group;
}

export function updateObstacles(dt, time, playerDist, speedNorm = 0, slipMix = 0) {
  // Warning pulse on every moving shard (shared material, one write).
  mats.mover.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.45;
  // Slow crevasse breathe on skinned Frozen hazards (shared, one write) — a ~0.5Hz
  // "live hazard" cue that replaces the deleted bar spin.
  if (mats.frostGlow) mats.frostGlow.emissiveIntensity = 0.95 + Math.sin(time * 3.0) * 0.4;
  // Skull soul-fire eyes breathe (shared material, one write) so the mouth reads as
  // "ancient, awake" — pulsing together across any skull instance.
  if (mats.soul) mats.soul.emissiveIntensity = 1.7 + Math.sin(time * 2.2) * 0.6;
  const sn = Math.max(0, Math.min(1, speedNorm));
  // Phase Gate: flow the veil shimmer (shared per biome) and give the aperture
  // ring a gentle, speed-aware breath. Six writes each — negligible.
  for (const m of veilMats) m.uniforms.uTime.value = time;
  if (veilLineMat) veilLineMat.uniforms.uTime.value = time;   // serene-veil strand sway
  if (veilPointMat) veilPointMat.uniforms.uTime.value = time; // serene-veil spirit drift
  for (const m of edgeMats) m.emissiveIntensity = (1.25 + Math.sin(time * 2.4) * 0.18) * (1 + 0.4 * sn);
  // FLOW gate: the whole run's light BREATHES with the slipstream (slipMix 0..1).
  // WINDVAULT: two shared uniform writes drive the light climbing the arch (uFlow) +
  // the idle shimmer (uTime). SKY GATE fallback: the old emissiveIntensity pulse.
  if (SKYFORGED) {
    markerTime.value = time;
    markerFlow.value = Math.max(0, Math.min(1, slipMix));
    gateFlowRef.value = sn;   // PR-4: the gate frame's light climbs the ramp toward the lip with speed
  } else if (flowEdgeMat) {
    const b = 1 + 0.7 * slipMix;
    flowEdgeMat.emissiveIntensity = (1.4 + Math.sin(time * 2.4) * 0.18) * b;
    flowCoreMat.emissiveIntensity = (2.2 + Math.sin(time * 3.1) * 0.3) * b;
  }

  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    // Cull by the entry's TRAILING edge, not its anchor: a spine ribcage tiles forward
    // to dist+ribBandFw (up to ~150m past the ring now that A1 uncaps the fill), so
    // culling at anchor+cullBehind would pop that forward tube — mesh AND the FX
    // presence band — out mid-tunnel while the dragon is still inside it. ribBandFw is
    // undefined→0 for every non-ribcage entry, so their cull is unchanged.
    if (e.dist + (e.ribBandFw || 0) < playerDist - CONFIG.cullBehind) {
      removeAt(i);
      continue;
    }
    if (e.flowHalo) e.flowHalo.rotation.z -= dt * 0.4; // Sky Gate halo counter-rotates (waypoint, not ring)
    if (e.type === 'shard') {
      e.object.rotation.y += dt * 0.8;
      e.object.rotation.x += dt * 0.3;
      if (e.dynamic) {
        // Oscillates; the collider position (e.x) moves with the mesh.
        e.x = e.baseX + Math.sin(time * e.speed + e.phase) * e.amp;
        e.object.position.x = e.x;
        e.object.position.y = e.baseY;
      } else {
        e.object.position.y = e.y + Math.sin(time * 1.4 + e.dist) * 0.4;
      }
    } else if (e.type === 'bar') {
      if (!e.skinned) e.object.rotation.x += dt * 0.5; // spin around its long axis (skinned calved shelf hangs still)
    } else if (e.type === 'gate') {
      // Phase shatter: blow the gate apart (scale + spin) then hide it. Transform
      // only — shared veil/ring materials are never touched here.
      if (e.shatterT > 0) {
        e.shatterT -= dt;
        const k = 1 - Math.max(e.shatterT, 0) / CONFIG.phaseShatterDur;
        e.object.scale.setScalar(1 + k * (e.shatterBig ? 0.8 : 0.4));
        e.object.rotation.z += dt * (e.shatterBig ? 6 : 3);
        if (e.shatterT <= 0) e.object.visible = false;
      }
      const ud = e.object.userData;
      const dz = e.dist - playerDist;
      if (ud.veilSpin) ud.veilSpin.rotation.z = time * 0.12;   // serene SWIRL: a slow, calm rotation about the eye
      // Beacon: brightest far out, fades off as you arrive so it never blinds
      // the route up close.
      if (ud.beacon) {
        const alpha = Math.min(1, Math.max(0, (dz - 120) / 130));
        const pulse = 0.85 + Math.sin(time * 3) * 0.15;
        ud.beacon.material.opacity = alpha * 0.30 * pulse;
      }
      // Approach state: the core-glow locator and motes "wake up" as the gate
      // nears, then ease back so they stay subtle at the threshold.
      const appr = Math.min(1, Math.max(0, (200 - dz) / 150));
      if (ud.core) ud.core.material.opacity = appr * 0.13 * (0.9 + 0.1 * Math.sin(time * 2.5));
      if (ud.motes && ud.motes.length) {
        ud.motes[0].material.opacity = appr * 0.5;
        const rise = ud.rise || 0;
        for (const m of ud.motes) {
          const u = m.userData;
          m.position.y = u.baseY + Math.sin(time * u.sp + u.phase) * (0.8 + rise * 0.8);
          m.position.x = u.baseX + Math.cos(time * u.sp * 0.6 + u.phase) * 0.5;
        }
      }
    } else if (e.type === 'rockGap') {
      // Camera-proximity dissolve: solid far out, fades to nothing over the last
      // ~15m so a cleared rock never blocks the view of the next gate.
      const dz = e.dist - playerDist;
      const span = CONFIG.canyonFadeFar - CONFIG.canyonFadeNear;
      const fade = Math.min(1, Math.max(0, (dz - CONFIG.canyonFadeNear) / span));
      // Ribcage sections are long tubes of thin, open bone — fading the whole
      // section by its centre would vanish the ribs ahead, so they never fade.
      if (e.fadeMat && !e.noDissolve) e.fadeMat.opacity = fade;
      // Overhead rock bridges fade INDIVIDUALLY (each by its own depth) as you
      // approach, so the near arch turns translucent and the next ones show
      // through it — caging silhouette far, clear view up close. The fade is a
      // long SMOOTHSTEP (solid ~34m out → clear by ~8m) so it eases, never pops.
      if (e.archFades) {
        for (const a of e.archFades) {
          let t = (a.dist - playerDist - 8) / 26;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          // floor at 0.2 so a near arch stays faintly visible — it still has a
          // collider, so it must never become invisible-but-solid (unfair hit).
          a.mat.opacity = 0.2 + 0.8 * (t * t * (3 - 2 * t));
        }
      }
      // Sea-stack spires: SOLID far out (read the winding channel ahead), then
      // TRANSLUCENT as each nears the camera so you can see the lateral path THROUGH
      // it and plan the weave at boost speed. Floored at 0.35 — it still has a
      // collider, so it must never go fully invisible.
      if (e.spireFades) {
        for (const s of e.spireFades) {
          let t = (s.dist - playerDist - 6) / 30;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          s.mat.opacity = 0.35 + 0.65 * (t * t * (3 - 2 * t));
        }
      }
      // Core-glow locator wakes as the gate nears, telegraphing the safe route.
      if (e.core) {
        const appr = Math.min(1, Math.max(0, (180 - dz) / 150));
        e.core.material.opacity = appr * 0.16 * (0.9 + 0.1 * Math.sin(time * 2.5));
      }
    }
  }
}

function removeAt(i) {
  const e = entries[i];
  scene.remove(e.object);
  e.object.traverse((m) => {
    // Shared hazard-skin geometries are reused by every instance — never dispose
    // them here or the next instance renders an emptied buffer.
    if (m.geometry && !(m.geometry.userData && m.geometry.userData.shared)) m.geometry.dispose();
    // Most materials are shared (biome pools); only per-instance ones
    // (gate core-glow / beacon / motes) are owned by this object and disposed.
    const mat = m.material;
    if (mat && mat.userData && mat.userData.perInstance) mat.dispose();
  });
  entries.splice(i, 1);
}

export function obstacleCount() {
  return entries.length;
}

// Test seam: total collider boxes across live FLOW-run gates. A flow run is
// walls-free by design, so this must always be 0 (canyonboot asserts it).
export function flowColliderBoxes() {
  let n = 0;
  for (const e of entries) if (e.type === 'rockGap' && e.run === 'flow') n += (e.boxes ? e.boxes.length : 0);
  return n;
}

// First unpassed gate ahead of a distance (reticle target).
export function nextGateAhead(dist) {
  let best = null;
  for (const e of entries) {
    if (e.type === 'gate' && !e.passed && e.dist > dist && (!best || e.dist < best.dist)) best = e;
  }
  return best;
}

// Local rib-wall presence at a distance (0..1) — used to FADE the speed-tunnel FX
// (streaks / CSS lines / aberration / rib-flutter) out in the genuinely rib-free air
// of a gauntlet-bridged gap, so the slipstream still SPEEDS you up there (physics /
// FOV / wind stay on the raw slip) but the "walls whipping past" cues honestly stop.
// A pure spatial taper of the built world (no state, no damping needed); returns a
// number before any segment exists (0) so a first frame can't feed NaN downstream.
export function spineWallPresenceAt(dist) {
  let p = 0;
  for (const e of entries) {
    if (e.type !== 'rockGap' || e.ribBandBk === undefined) continue;
    const lo = e.dist - e.ribBandBk, hi = e.dist + e.ribBandFw;
    const gap = dist < lo ? lo - dist : dist > hi ? dist - hi : 0;
    p = Math.max(p, 1 - Math.min(1, gap / 25));   // full inside band, fades over 25m
    if (p >= 1) return 1;
  }
  return p;
}

// Revive helper: clear every hazard up to a distance so the player gets a
// clean runway back into the action.
export function clearAhead(untilDist) {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].dist <= untilDist) removeAt(i);
  }
}

export function resetObstacles() {
  while (entries.length) removeAt(entries.length - 1);
}
