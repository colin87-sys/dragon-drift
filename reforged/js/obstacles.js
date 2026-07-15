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
let rimMats = null;  // dim outer silhouette frame (secondary)
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
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vN = normalMatrix * normal;
        vPos = position;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor; uniform vec3 uEdge; uniform float uAlpha;
      varying vec3 vN; varying vec3 vView; varying vec3 vPos;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vView);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
        float band = sin((vPos.y * 0.5 + vPos.x * 0.3) - uTime * 1.5);
        float shimmer = 0.85 + 0.15 * band;
        float a = clamp(uAlpha * (0.30 + 0.70 * fres) * shimmer, 0.0, 0.30);
        vec3 col = mix(uColor, uEdge, clamp(fres * 0.85, 0.0, 1.0));
        col += uEdge * max(0.0, band) * 0.12;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}

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

// Fold the vertex-colour ladder into the EMISSIVE term so it reads in ANY light
// (vertex colours alone only modulate diffuse → they die backlit). frost faces →
// emissive×(bright frost), belly faces → emissive×(deep teal): the ladder's self-lit
// legibility floor. Not applied to moverIce (its coral warning must stay unmodulated).
function withLadderEmissive(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'
    );
  };
  return mat;
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
    // vColor carries the frost/mid/teal ladder. Vertex colours only modulate the
    // DIFFUSE term, so backlit against the bright sunset the whole body collapsed to
    // near-black emissive and the ladder vanished (the owner's "less premium than the
    // side props" — the hazards sit dead-centre in the sun corridor, the worst
    // contrast spot). Fix: fold the ladder into EMISSIVE too (onBeforeCompile below),
    // so frost faces stay bright and belly faces stay teal in ANY light — a self-lit
    // legibility FLOOR for a material-history ladder, not a glow feature.
    frostIce: withLadderEmissive(new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, flatShading: true, roughness: 0.34, metalness: 0.02,
      emissive: 0xcfe4f0, emissiveIntensity: 0.42,
    })),
    // Dark recess backing behind a crevasse glow — the near-black-teal socket that
    // turns "strip stuck on a face" into "crack with light inside".
    frostShadow: new THREE.MeshStandardMaterial({
      color: 0x0e2630, flatShading: true, roughness: 0.6, metalness: 0,
    }),
    // Dynamic-shard material — the SAME vertex-coloured ice as frostIce but with a
    // coral emissive that PULSES in updateObstacles: the ice ladder reads at the
    // trough (clearly ice), coral dominates at the peak (clearly "this one moves").
    // Keeps the reskin instead of the old full-body swap to a solid coral lump.
    moverIce: new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, flatShading: true, roughness: 0.3, metalness: 0.02,
      emissive: 0xff5a47, emissiveIntensity: 0.9,
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
function buildGate(o) {
  const group = new THREE.Group();
  group.userData.phaseGate = true;   // tag: lets tooling hide the harness-interleaved Phase Gate reliably
  const bi = biomeIndexAt(o.dist);
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

  // Layer 3 — translucent phase field (veil panels around the aperture).
  const panel = (w, h, cx, cy) => {
    if (w <= 0.1 || h <= 0.1) return;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), veilMat);
    mesh.position.set(cx, cy, 0);
    group.add(mesh);
  };
  panel(left + X, TOP, (left - X) / 2, TOP / 2); // left of gap
  panel(X - right, TOP, (right + X) / 2, TOP / 2); // right of gap
  panel(right - left, TOP - top, o.gapX, (top + TOP) / 2); // above gap
  panel(right - left, bottom, o.gapX, bottom / 2); // below gap

  const bar = (w, h, cx, cy, mat, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), mat);
    mesh.position.set(cx, cy, z);
    group.add(mesh);
  };

  // Layer 1 — outer silhouette frame: a slim, dim glowing rim around the whole
  // span so the gate reads as an intentional portal from a distance (secondary
  // in the hierarchy, hence rimMat's lower emissive).
  bar(2 * X, 0.3, 0, TOP - 0.15, rimMat, 0.15);
  bar(2 * X, 0.3, 0, 0.15, rimMat, 0.15);
  bar(0.3, TOP, -X + 0.15, TOP / 2, rimMat, 0.15);
  bar(0.3, TOP, X - 0.15, TOP / 2, rimMat, 0.15);

  // Layer 2 — aperture ring: the brightest element, framing the safe route. Skyforged (PR-4):
  // ONE faceted forged-glass frame with a hot inner LIP on the collider boundary (per biome),
  // replacing the four flat bars. Fallback (?skyforged=0): the exact shipped bars.
  if (SKYFORGED) {
    group.add(new THREE.Mesh(buildGateFrame(o), gateFrameMats[bi]));
  } else {
    bar(W + 0.7, 0.5, o.gapX, top + 0.25, edgeMat, 0.3);
    bar(W + 0.7, 0.5, o.gapX, bottom - 0.25, edgeMat, 0.3);
    bar(0.5, H + 0.7, left - 0.25, o.gapY, edgeMat, 0.3);
    bar(0.5, H + 0.7, right + 0.25, o.gapY, edgeMat, 0.3);
  }
  // Corner brackets (viewfinder cue) opening toward the centre of the gap. UNTOUCHED in both
  // modes (on edgeMat) — the highest-leverage safe-route affordance + its speed-aware breath.
  const legLen = 1.2;
  const gap = 0.75;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const cx = o.gapX + sx * (o.gapW + gap);
      const cy = o.gapY + sy * (o.gapH + gap);
      bar(legLen, 0.34, cx - sx * legLen / 2, cy, edgeMat, 0.5); // horizontal leg
      bar(0.34, legLen, cx, cy - sy * legLen / 2, edgeMat, 0.5); // vertical leg
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
  const moteGeo = new THREE.PlaneGeometry(0.45, 0.45);
  const motes = [];
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
  group.userData.motes = motes;
  group.userData.rise = skin.rise;

  group.position.z = -o.dist;
  return group;
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
const _FROST = [0.82, 0.91, 0.99], _MIDICE = [0.36, 0.60, 0.75], _BELLY = [0.13, 0.32, 0.40];   // chalk-BLUE frost (not chalk-gray) — reads as ice, not concrete
// Default (axis = world +Y) is a LIGHTING story: frost on sunlit up-faces, teal in the
// shadowed belly — correct for STATIC props (bar/pillar). For a TUMBLING body pass a
// per-chunk weathering `axis`: the same ladder becomes a MATERIAL-HISTORY story that is
// orientation-invariant (frost = weathered rind, mid = fresh fracture plane, teal = deep
// seam), so a spinning shard doesn't flicker its "sunlight" at the floor. Thresholds
// default to the shipped bar/pillar values (byte-identical when called with no opts).
function bakeIceLadder(geo, opts = {}) {
  const ax0 = opts.ax ?? 0, ay0 = opts.ay ?? 1, az0 = opts.az ?? 0;
  const frostT = opts.frostT ?? 0.35, tealT = opts.tealT ?? -0.30;
  const pos = geo.attributes.position, n = pos.count;
  const col = new Float32Array(n * 3);
  const ax = new THREE.Vector3(), bx = new THREE.Vector3(), cx = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    ax.fromBufferAttribute(pos, i); bx.fromBufferAttribute(pos, i + 1); cx.fromBufferAttribute(pos, i + 2);
    e1.subVectors(bx, ax); e2.subVectors(cx, ax); nr.crossVectors(e1, e2).normalize();
    const d = nr.x * ax0 + nr.y * ay0 + nr.z * az0;
    const c = d > frostT ? _FROST : d < tealT ? _BELLY : _MIDICE;
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

// SERAC SPUR — the Frozen pillar (Fable pre-assess 2026-07-14). A leaning zig-zag
// stack of 4 sheared hex frustums + a blunt chisel cap, authored in UNIT space
// (radius as fractions of r, height as fractions of h) so independent r/h scaling
// stays coherent from squat h=8 to needle h=21. The seg-3 RE-FLARE (mass steps back
// OUT on the way up) is the anti-spike move — its underside gives deep-teal overhang
// faces so the value ladder shows all three rungs on one body. Coverage uses the hex
// INRADIUS (0.866×circumR): 0.866*R − offset ≥ 0.67r keeps the visible ice around the
// r*0.65 collider cylinder to ~80% height (a strict improvement over the needle cone,
// whose top ~60% was hollow); the top ~20% tapers inside the collider by design.
// A stack of sheared, yawed, offset ANGULAR ICE BLOCKS (boxes, not cylinders — hex
// frustums read as a machined rocket; sharp-edged blocks read as calved ice, and
// their flat top/bottom faces feed the frost/teal value ladder). Authored in UNIT
// space (half-widths + offsets as fractions of r, heights as fractions of h). The
// seg-3 RE-FLARE (a block wider than the one below, offset) throws a teal overhang;
// the top block is a sheared blunt wedge (never a party-hat point).
// [y0f, y1f, wx, wz, cx, cz, yaw, tiltZ] — half-widths & offsets in r; heights in h.
const PILLAR_SEGS = [
  [0.00, 0.32, 0.88, 0.84, 0.00, 0.00, 0.10, 0.00],   // rooted base
  [0.28, 0.57, 0.82, 0.86, 0.12, 0.05, 0.55, 0.05],   // step + twist
  [0.53, 0.80, 0.90, 0.82, -0.07, 0.09, 1.00, -0.04], // RE-FLARE (wider → teal overhang) + twist
  [0.76, 0.93, 0.74, 0.70, 0.11, -0.05, 1.45, 0.06],  // narrower shoulder + twist
  [0.90, 1.00, 0.48, 0.44, 0.14, 0.03, 1.85, 0.17],   // blunt sheared top (upright + small so it holds its silhouette vs pale sky)
];
const PILLAR_COVER_TO = 0.78;   // require collider coverage to 78% height; top exempt (tapers inside, per design)
// A single narrow, slightly-diagonal crevasse crack on the +z (approach) face — a
// thin lit fissure, NOT a rectangular window. [y0f, y1f, wide, radius, tilt]
const PILLAR_SEAM = [0.34, 0.64, 0.12, 0.86, 0.28];
// Foot rubble: a broken ARC biased to one side (not a ring), squat so the r-only
// scale keeps them as chunks. [angle, dist, size]
const PILLAR_RUBBLE = [
  [-0.5, 1.00, 0.34], [-0.15, 1.14, 0.26], [0.2, 1.04, 0.30], [0.6, 1.20, 0.24], [1.0, 1.02, 0.28],
];

function buildFrozenPillar() {
  const tower = [], glow = [], shadow = [], rubble = [];
  for (const [y0f, y1f, wx, wz, cx, cz, yaw, tiltZ] of PILLAR_SEGS) {
    const segH = y1f - y0f;
    const b = new THREE.BoxGeometry(wx * 2, segH, wz * 2);
    if (tiltZ) b.rotateZ(tiltZ);
    if (yaw) b.rotateY(yaw);
    b.translate(cx, (y0f + y1f) / 2 - 0.5, cz);   // centre the tower on y (base at -0.5)
    tower.push(b);
  }
  // Crevasse crack — a thin lit fissure on the mid block's OWN front face (built in
  // its local frame then given the block's yaw+offset, so it stays proud of the
  // yawed face instead of being swallowed by it). Slim dark socket + a slightly
  // tilted glow → a natural fracture, not a window pane.
  {
    const [by0, by1, , bwz, bcx, bcz, byaw] = PILLAR_SEGS[1];   // the mid block
    const [sy0, sy1, wide, , tilt] = PILLAR_SEAM;
    const cy = (sy0 + sy1) / 2 - (by0 + by1) / 2, hh = sy1 - sy0;   // seam y relative to the block centre
    const front = bwz;                                             // block's local +z face
    const mk = (geo, z) => { geo.rotateZ(tilt); geo.translate(0.05, cy, z); geo.rotateY(byaw); geo.translate(bcx, (by0 + by1) / 2 - 0.5, bcz); return geo; };
    shadow.push(mk(new THREE.PlaneGeometry(wide + 0.10, hh), front + 0.01));
    glow.push(mk(new THREE.PlaneGeometry(wide, hh - 0.05), front + 0.03));
  }
  // Foot rubble — squat ice chunks (own r-only scale in hazardMesh), tetrahedra (4
  // tris) authored around y=0. Sunk ~20% into the floor so they read as calved debris.
  for (const [ang, dist, size] of PILLAR_RUBBLE) {
    const t = new THREE.TetrahedronGeometry(size);
    t.scale(1, 0.6, 1);                         // squat
    t.rotateY(ang * 1.7);
    xf(t, { x: Math.cos(ang) * dist, y: -size * 0.2, z: Math.sin(ang) * dist });
    rubble.push(t);
  }
  const norm = (arr) => arr.map((g) => g.index ? g.toNonIndexed() : g);
  const towerGeo = bakeIceLadder(mergeGeometries(norm(tower), false)); towerGeo.userData.shared = true;
  const glowGeo = mergeGeometries(norm(glow), false); glowGeo.userData.shared = true;
  const shadowGeo = mergeGeometries(norm(shadow), false); shadowGeo.userData.shared = true;
  const rubbleGeo = bakeIceLadder(mergeGeometries(norm(rubble), false)); rubbleGeo.userData.shared = true;
  return {
    tower: [
      { geo: towerGeo, mat: mats.frostIce },
      { geo: shadowGeo, mat: mats.frostShadow },
      { geo: glowGeo, mat: mats.frostGlow },
    ],
    rubble: [{ geo: rubbleGeo, mat: mats.frostIce }],
  };
}

// Numeric FAIRNESS check for the serac spur: sample the r*0.65 collider circle at a
// ring of angles across heights 0→PILLAR_COVER_TO and assert every point sits inside
// some frustum's hex cross-section (inradius test, yaw-aware). Scale-invariant (x/z
// track r, y tracks h), so one unit-space pass covers all (r,h). Returns { ok, gaps }.
export function pillarColliderCoverage() {
  const R = 0.65;                       // collider radius in unit (r) space
  // Each block is a yawed, offset box; tiltZ shifts the cross-section with height, so
  // include it. A circle point is inside iff, in the block's local frame, |x|<wx & |z|<wz.
  const inBox = (px, pz, seg, y) => {
    const [y0f, y1f, wx, wz, cx, cz, yaw, tiltZ] = seg;
    if (y < y0f - 1e-6 || y > y1f + 1e-6) return false;
    let qx = px - cx, qz = pz - cz;
    // undo yaw about Y
    const cy2 = Math.cos(-yaw), sy2 = Math.sin(-yaw);
    const x1 = qx * cy2 - qz * sy2, z1 = qx * sy2 + qz * cy2; qx = x1; qz = z1;
    // tiltZ shifts x with height off the block centre; account for the worst-case shift
    const dy = y - (y0f + y1f) / 2;
    qx -= Math.tan(tiltZ || 0) * dy;
    return Math.abs(qx) <= wx + 1e-6 && Math.abs(qz) <= wz + 1e-6;
  };
  const gaps = [];
  for (let y = 0; y <= PILLAR_COVER_TO + 1e-9; y += 0.04) {
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      const px = R * Math.cos(a), pz = R * Math.sin(a);
      if (!PILLAR_SEGS.some((s) => inBox(px, pz, s, y))) gaps.push([+y.toFixed(2), +(a).toFixed(2)]);
    }
  }
  return { ok: gaps.length === 0, gaps: gaps.slice(0, 12), gapCount: gaps.length };
}

// CALVED BERG CHUNK — the Frozen shard (Fable pre-assess 2026-07-14). Three jittered,
// interpenetrating icosahedra at a strong 1 : 0.55 : 0.38 hierarchy (never equal → that's
// a fused-dice gem) plus a couple of micro-shards in the seam, so it reads as a tumbling
// calved iceberg fragment. Because it SPINS, the value ladder is baked per-chunk against a
// fixed WEATHERING AXIS (material-history, not lighting) so it never flickers. Uniform
// r-scale. Same geometry for static & dynamic variants (dynamic just swaps to the coral-
// pulsing moverIce material) so "same hazard, it moves" stays legible.
// WIDER THAN TALL (~1.5 : 1) — a floating hazard you dodge by moving SIDEWAYS, so
// lateral mass is the verb (the owner's note). The dominant chunk A stays centred and
// big enough to carry the r*0.70 collider sphere on EVERY axis (measured post-scale);
// B and C are pushed far out laterally so the fragments extend the mass to the flanks
// (visual edge OUTSIDE the collider = forgiving fringe, the correct direction).
// [circumR, [offX,offY,offZ], [sclX,sclY,sclZ], [axisX,axisY,axisZ]] in r units.
const BERG_CHUNKS = [
  [1.05, [0.00, 0.00, 0.00], [1.20, 0.90, 1.08], [0.28, 0.50, 0.62]],   // dominant — wide, centred on the collider
  [0.66, [0.90, -0.16, 0.32], [1.05, 0.92, 1.00], [-0.7, 0.25, 0.6]],   // fragment flung to the RIGHT flank
  [0.50, [-0.92, 0.20, -0.38], [1.00, 1.04, 0.95], [0.45, -0.6, -0.55]], // fragment flung to the LEFT (~130° from B)
];
const BERG_MICRO = [ [0.17, [0.70, 0.04, 0.50]], [0.15, [-0.42, -0.24, 0.34]] ];   // seam micro-shards
let _bergSupport = 0;   // min face-plane distance of chunk A from centre (proven ≥ collider 0.70r)

function buildFrozenShard() {
  const rng = mulberry32(0x5e9c0de);
  const parts = [];
  // Coherent per-position jitter (hash unique local positions so the 5 face-copies of a
  // shared icosahedron vertex move together — independent jitter would tear the mesh).
  const jitter = (g, amt) => {
    const p = g.attributes.position, jm = new Map();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
      let j = jm.get(k); if (!j) { j = [(rng() - 0.5) * amt, (rng() - 0.5) * amt, (rng() - 0.5) * amt]; jm.set(k, j); }
      p.setXYZ(i, x * (1 + j[0]), y * (1 + j[1]), z * (1 + j[2]));
    }
  };
  let ai = 0;
  for (const [rad, off, scl, axis] of BERG_CHUNKS) {
    let g = new THREE.IcosahedronGeometry(rad, 0);
    if (g.index) g = g.toNonIndexed();
    jitter(g, 0.16);
    g.scale(scl[0], scl[1], scl[2]);
    if (ai === 0) {   // chunk A carries the collider — measure its inradius AFTER the
      // (non-uniform) scale, so a squashed axis can't secretly drop below the sphere.
      const p = g.attributes.position; let mind = Infinity;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nr = new THREE.Vector3();
      for (let i = 0; i < p.count; i += 3) {
        a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
        e1.subVectors(b, a); e2.subVectors(c, a); nr.crossVectors(e1, e2).normalize();
        mind = Math.min(mind, Math.abs(nr.dot(a)));   // |plane offset| from origin
      }
      _bergSupport = mind;
    }
    g.translate(off[0], off[1], off[2]);
    bakeIceLadder(g, { ax: axis[0], ay: axis[1], az: axis[2], frostT: 0.44, tealT: -0.42 });
    parts.push(g); ai++;
  }
  for (const [rad, off] of BERG_MICRO) {
    let g = new THREE.TetrahedronGeometry(rad);
    jitter(g, 0.2);
    g.translate(off[0], off[1], off[2]);
    bakeIceLadder(g, { ax: off[0], ay: off[1], az: off[2], frostT: 0.2, tealT: -0.5 });
    parts.push(g);
  }
  const geo = mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g), false);
  geo.userData.shared = true;
  return { geo };
}
// Fairness: chunk A's inradius must contain the r*0.70 collider sphere (in r units).
export function shardColliderSupport() {
  obstacleSkin(2, 'shard');   // ensure built (sets _bergSupport)
  return _bergSupport;
}

const SKIN_BUILDERS = {
  2: { bar: buildFrozenBar, pillar: buildFrozenPillar, shard: buildFrozenShard },   // Frozen
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
    const skin = obstacleSkin(bi, 'pillar');
    if (skin) {
      const g = new THREE.Group();
      // Tower scales r×h×r (centred, base on the floor); rubble scales r×r×r so it
      // stays chunky no matter the height, seated at the foot (local y = −h/2).
      for (const part of skin.tower) { const m = new THREE.Mesh(part.geo, part.mat); m.scale.set(p.r, p.h, p.r); g.add(m); }
      for (const part of skin.rubble) { const m = new THREE.Mesh(part.geo, part.mat); m.scale.set(p.r, p.r, p.r); m.position.y = -p.h / 2; g.add(m); }
      g.userData.skinned = true;
      return g;
    }
    return new THREE.Mesh(new THREE.ConeGeometry(p.r, p.h, 6), mats.body[bi]);
  }
  // shard
  const skin = obstacleSkin(bi, 'shard');
  if (skin) {
    const m = new THREE.Mesh(skin.geo, p.dynamic ? mats.moverIce : mats.frostIce);
    m.scale.setScalar(p.r);
    return m;
  }
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

// --- CALVED CANYON wall kit (Fable pre-assess 2026-07-14) ------------------
// Replaces the picket-fence of ConeGeometry shards with stacked, SHEARED calved ice
// blocks for the Frozen rock run: recessed foot → proud re-flare bulge (throws a teal
// underside) → stepped-back broken-ridge crest. Reuses the glacier kit — bakeIceLadder
// + withLadderEmissive so the wall stays lit (frost caps / mid faces / teal belly) in
// the backlit sunset instead of collapsing to a black silhouette. Authored in UNIT
// space (x in hw, y in h, z in hz) so one fairness pass covers every mass size. SHEAR
// (not rotate): a 0.15rad rotate on a 26-tall wall walks the top ~3u sideways into the
// channel; shearing keeps top faces pointing UP (frost survives) and the ±hw check exact.
const WALL_TIERS = {
  footFace: [0.64, 0.74], footTop: [0.26, 0.36],   // deeply recessed undercut (deeper → the bulge underside reads teal from below)
  bodyFace: [0.94, 0.97], bodyTop: [0.55, 0.72],   // proud calved bulge — juts over the foot; top staggered per column into shelves
  crestFace: [0.80, 0.86],                          // clearly stepped back from the body
  shearToward: 0.03, shearZ: 0.22,                  // max shear toward channel (frac hw) / z jitter (frac hz)
  zStep: [0.35, 0.50], hStep: 0.06,                 // HARD alternating depth step (frac hz) + height stagger (frac h) between columns
  batter: 0.18, footMin: 0.22,                      // calved lean-back above band-top (frac hw, hw-proportional) / min foot height (frac h)
  frostT: 0.32,                                     // ladder frost threshold for the wall bake (0.30 over-frosted the upper HALF → cap the top only)
  faceFloor: 0.90,                                  // fairness: body channel-face ≥ this·hw (cones tapered to ~0.5)
  crestBand: 0.60, bodyBandTop: 0.692, crestBandTop: 0.98,  // collider bands in unit-y (body y−3..15, crest 13.5..22.5 over h=26)
};
// Skyline families → crest TOP (unit-y) per column, so each mass reads as a distinct
// BROKEN RIDGE, never a comb. Height variance carries the drama; deep notches only in
// outer columns. Chosen per mass by (stackCount % 3) so consecutive masses differ.
const WALL_SKYLINES = [
  (ci, nc, rng) => 1.10 - (ci / Math.max(nc - 1, 1)) * 0.34 + (rng() - 0.5) * 0.06, // PROW  — tall front tooth, steps down back
  (ci, nc, rng) => 0.99 + Math.abs((ci / Math.max(nc - 1, 1)) - 0.5) * 0.30 + (rng() - 0.5) * 0.05, // SADDLE — high ends, low mid
  (ci, nc, rng) => 1.07 - (ci / Math.max(nc - 1, 1)) * 0.30 + (rng() - 0.5) * 0.05, // STEP  — monotonic stair
];

// Shear a box by displacing x/z proportionally to height-from-base (top moves, base fixed).
function shearBoxGeo(w, h, d, shx = 0, shz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (shx || shz) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / h + 0.5;   // 0 at base → 1 at top
      p.setX(i, p.getX(i) + t * shx);
      p.setZ(i, p.getZ(i) + t * shz);
    }
  }
  return g;
}

// Build the block geometries for ONE Frozen canyon wall mass (unit-authored, world-scaled).
// channelSign = +1 puts the calved face toward +x; the caller passes sign(lean) so the
// undercut always faces the channel. Returns non-indexed geos ready to merge.
function frozenWallParts(hw, hz, h, botY, channelSign, crest, familyIdx, rng) {
  const T = WALL_TIERS, parts = [];
  const nc = Math.max(1, Math.min(4, Math.round(hw / 3.0)));
  const sky = WALL_SKYLINES[((familyIdx % 3) + 3) % 3];
  const rr = (a) => a[0] + rng() * (a[1] - a[0]);
  const backX = -hw * channelSign;
  for (let ci = 0; ci < nc; ci++) {
    // HARD-STEP the columns in depth (front/back/front/back) so the grazing flight angle
    // sees the side RETURN faces between them → real THICKNESS, not one flat sheet.
    const zSign = (ci % 2) * 2 - 1;
    const zc = zSign * (T.zStep[0] + rng() * (T.zStep[1] - T.zStep[0])) * hz + (rng() - 0.5) * 0.18 * hz;
    const zspan = hz * (0.55 + rng() * 0.35);
    const seam = (rng() - 0.5) * 0.10 * h;   // per-column seam stagger (kills fortress coursing)
    // STAGGER the tier tops between neighbours so every block top is a SHELF against its
    // lower neighbour — below the flight line those shelves face up (frost), above it they
    // face down (teal): the ladder's own faces, now presented to the camera, zero new tris.
    const hStep = zSign * T.hStep * h;
    const footTop = Math.max(botY + T.footMin * h, botY + Math.min(0.5, rr(T.footTop) + 0.4 * (hStep / h)) * h + seam); // clamp ≥ min height (no degenerate slivers)
    const bodyTop = botY + (rr(T.bodyTop) + hStep / h) * h + seam;
    // Crest MUST reach the crest collider top (0.98) everywhere — a short crest leaves an
    // invisible-kill gap where a high-flying player clips the collider. Skyline drama comes
    // from height variance ABOVE that floor (0.98→1.14 ≈ 4 world units of ridge swing).
    const crestTop = botY + Math.max(WALL_TIERS.crestBandTop, Math.min(1.14, sky(ci, nc, rng))) * h;
    const bandTopW = botY + T.bodyBandTop * h;   // ~y15 — batter pivots here; below it the face stays proud (covered)
    const mk = (faceFrac, yb, yt, shTowardFrac, noShear, shzScale = 1) => {
      const faceX = faceFrac * hw * channelSign;
      const w = Math.abs(faceX - backX), cx = (faceX + backX) / 2;
      const shx = noShear ? 0 : shTowardFrac * hw * channelSign;
      const shz = noShear ? 0 : (rng() - 0.5) * T.shearZ * hz * shzScale;   // foot ROOTED; crest shzScale=0 (batter supplies the lean → no edge-on frost spikes)
      const g = shearBoxGeo(w, yt - yb, zspan, shx, shz);
      g.translate(cx, (yb + yt) / 2, zc);
      // BATTER: lean the channel face BACK above band-top (calved lean + tips upper faces
      // toward frost). hw-PROPORTIONAL (not fixed-angle) so the recede scales with the crest
      // collider margin → narrow masses' crests stay covered. Below band-top: untouched (proud).
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > bandTopW) p.setX(i, p.getX(i) - channelSign * T.batter * hw * (y - bandTopW) / (0.4 * h));
      }
      return g;
    };
    parts.push(mk(rr(T.footFace), botY, footTop, 0, true));                                       // foot: rooted, no shear
    parts.push(mk(rr(T.bodyFace), footTop - 0.05 * h, bodyTop, T.shearToward * (0.5 + rng() * 0.5), false)); // re-flare overhang
    if (crest) parts.push(mk(rr(T.crestFace), bodyTop - 0.05 * h, crestTop, (rng() - 0.5) * 2 * T.shearToward, false, 0)); // shzScale 0: no crest z-spikes
  }
  return parts;
}

// Fairness check for the calved wall — validates the authoring invariants that keep the
// visible ice covering the collider band (a direct sibling of pillarColliderCoverage).
// Structural (the builder draws from these same ranges), so it can't drift from the code.
export function wallColliderCoverage() {
  const T = WALL_TIERS, issues = [];
  if (T.bodyFace[0] < T.faceFloor) issues.push(`body channel-face ${T.bodyFace[0]} < fairness floor ${T.faceFloor}`);
  const poke = Math.max(T.footFace[1], T.bodyFace[1], T.crestFace[1]) + T.shearToward;
  if (poke > 1.0 + 1e-9) issues.push(`channel poke ${poke.toFixed(3)} > 1.0 (visual crosses ±hw into the channel)`);
  // Crest face must cover the ±0.6hw crest collider AFTER the batter recedes it. Because
  // the batter is hw-proportional (T.batter·hw at the crest top), this holds on EVERY mass
  // size — a fixed-angle batter would uncover narrow crests (fixed-world recede vs hw-scaled margin).
  if (T.crestFace[0] - T.batter < T.crestBand) issues.push(`crest face ${T.crestFace[0]} − batter ${T.batter} < crest band ${T.crestBand}`);
  // The union foot∪body∪crest must cover y 0..crestBandTop with NO gap: tiers overlap by
  // 0.05h (crest bottom = bodyTop−0.05 ≤ bodyTop; body bottom = footTop−0.05 ≤ footTop) and
  // the crest is clamped to reach crestBandTop, so the body collider top (0.692) is always
  // covered by the crest overlap even when body tops out at 0.66.
  if (T.bodyTop[0] + 0.05 < T.footTop[0]) issues.push('body/foot y-bands leave a gap');   // body reaches down into foot
  if (T.bodyTop[1] < T.bodyBandTop - 0.05) issues.push('body top too low for crest to bridge to the body collider top');
  return { ok: issues.length === 0, issues };
}

// Inert STUDIO export — build one Frozen wall mass in isolation (Fable checkpoint before
// wiring into the canyon). Mirrors the in-canyon material path (self-lit ladder, faded).
export function buildCanyonWallMass(hw = 6, hz = 4, { crest = true, family = 0, seed = 1, lean = 0.06 } = {}) {
  if (!mats) initObstacles({ add() {}, remove() {} });
  const rng = mulberry32((seed ^ 0x1a2b3c4d) >>> 0);
  const h = 26, botY = -3, channelSign = Math.sign(lean) || 1;
  const parts = frozenWallParts(hw, hz, h, botY, channelSign, crest, family, rng);
  // frostT 0.30 (vs the shipped 0.35): the battered upper faces tip into frost, giving a
  // base-mid→top-frost gradient ON the face instead of one flat mid. Wall-bake only.
  const geo = bakeIceLadder(mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g), false), { frostT: WALL_TIERS.frostT });
  const mat = withLadderEmissive(mats.frostIce.clone());   // re-wrap AFTER clone (onBeforeCompile isn't copied)
  return new THREE.Mesh(geo, mat);
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
    let merged;
    if (bi === 2) {
      // CALVED CANYON wall (Frozen, Fable 4.4) — stacked sheared calved ice blocks with
      // the self-lit frost/mid/teal ladder, so the wall doesn't go black backlit like the
      // old cone pickets. Family cycles per mass so consecutive walls differ. Collider
      // (box() below) is UNCHANGED — the visible ice covers it (wallColliderCoverage).
      const fam = (e.wallCount = (e.wallCount || 0) + 1);
      const parts = frozenWallParts(hw, hzCol, h, botY, Math.sign(lean) || 1, crest, fam, rng);
      merged = bakeIceLadder(mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g), false), { frostT: WALL_TIERS.frostT });
      parts.forEach((g) => g.dispose());
    } else {
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
      merged = mergeGeometries(parts, false);
      parts.forEach((g) => g.dispose());
      merged.computeVertexNormals();
    }
    // SEE-THROUGH wall: a per-instance translucent material (like the arches), faded
    // per-mass by its own depth in updateObstacles — SOLID far out so you read the
    // winding channel ahead, TRANSLUCENT as it nears so you see the lateral path
    // THROUGH it (the fix for "blind at boost speed"). Floored so it never fully
    // vanishes — it has a collider. Frozen uses the self-lit ladder ice (re-wrapped
    // after clone so onBeforeCompile survives); other biomes the flat body clone.
    const smat = bi === 2 ? withLadderEmissive(mats.frostIce.clone()) : mats.body[bi].clone();
    smat.transparent = true; smat.depthWrite = false; smat.userData.perInstance = true;
    const m = new THREE.Mesh(merged, smat);
    m.position.set(cx, 0, z);
    group.add(m);
    (e.spireFades || (e.spireFades = [])).push({ mat: smat, dist: o.dist - z, floor: bi === 2 ? 0.75 : undefined });
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
  // Warning pulse on every moving shard (shared material, one write each).
  mats.mover.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.45;
  if (mats.moverIce) mats.moverIce.emissiveIntensity = 0.9 + Math.sin(time * 6) * 0.45;   // skinned berg-chunk warning
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
          // Per-entry near-fade FLOOR: thin cone spike fields fade to 0.35 (see the weave
          // THROUGH them at boost); a solid Frozen calved WALL keeps 0.75 (the channel is
          // read from the gap, not through the wall — 0.35 just ghosts out the calved detail).
          const f = s.floor ?? 0.35;
          s.mat.opacity = f + (1 - f) * (t * t * (3 - 2 * t));
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
