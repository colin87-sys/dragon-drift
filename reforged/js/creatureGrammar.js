// Creature grammar — the closed, documented vocabulary a creature blueprint may
// declare. This is Phase 3 of the hull→blueprint arc (LEAPFROG L24/L32/L47): the
// hull GENERATOR was built first, so its parameters ARE the blueprint. This file
// does NOT invent a schema — it HARVESTS the knobs the generator already reads
// (dragonModel/dragonWings/dragonWingFlap/dragonSweep/dragonSurfaceShader) and
// names them, grouped, with kinds + ranges, so a creature can be described as
// validated DATA and CREATURES.md can be generated from one source of truth.
//
// It is pure data + tiny accessors — no Three import, no geometry. Builder/shader
// ENUMS are resolved LIVE at validation time (against the part registries +
// SURFACE_PATCH_NAMES) rather than frozen here, so the vocabulary can never drift
// from what is actually buildable. See validateCreatureBlueprint.js.

export const GROUPS = Object.freeze([
  'recipe', 'hull', 'wing', 'motion', 'surface', 'material', 'surfaceLayers', 'fx',
]);

// Knob KINDS the validator understands:
//   'builder'   — a registered part-builder name (registry: torso|wings|head|tail)
//   'shaderList'— an array of registered surface-shader names
//   'shingleList'— an array (or single) of shingle-run specs
//   'layerList' — an array of declarative surfaceLayers specs (the new path)
//   'stationList'— a body cross-section ring list (parametricArrow's own-shape mode)
//   'wingFormList'— a per-form array of parametric wing-planform knob objects
//   'number'/'int'/'bool'/'color' — primitives ('int' = whole number)
//   'object'    — a sub-blueprint whose children are described by their own paths
// A descriptor with min/max is RANGE-CHECKED when the value is present + numeric.
// `forms` = true means the knob may also appear per-form in forms[].* (checked too).

export const CREATURE_GRAMMAR = Object.freeze([
  // --- recipe: the body plan (which part modules build this creature) ----------
  { path: 'parts.torso', group: 'recipe', kind: 'builder', registry: 'torso', desc: 'Body-plan builder (e.g. arrow, nightFuryTorso, avian).' },
  { path: 'parts.wings', group: 'recipe', kind: 'builder', registry: 'wings', desc: 'Wing builder (e.g. membrane, nightFuryWings, feather, none).' },
  { path: 'parts.head', group: 'recipe', kind: 'builder', registry: 'head', desc: 'Head builder (e.g. horned, draconic, beaked, none).' },
  { path: 'parts.tail', group: 'recipe', kind: 'builder', registry: 'tail', desc: 'Tail builder (e.g. clean, legacy, none).' },

  // --- surface: shaders + relief ----------------------------------------------
  { path: 'parts.surface.shader', group: 'surface', kind: 'shaderList', desc: 'Composable surface-shader patches stacked over the body material.' },
  { path: 'parts.shingle', group: 'surface', kind: 'shingleList', desc: 'Overlapping cupped-card scale/plate runs merged to one mesh.' },
  { path: 'parts.surfaceLayers', group: 'surfaceLayers', kind: 'layerList', desc: 'Declarative dorsal/flank decoration layers (crest, chevrons, spines, armour…).' },

  // --- hull / proportions (model.*) -------------------------------------------
  { path: 'model.scale', group: 'hull', kind: 'number', min: 0.3, max: 2.5, desc: 'Overall body size multiplier.' },
  { path: 'model.wingScale', group: 'hull', kind: 'number', min: 0.4, max: 2.2, desc: 'Wing span multiplier (independent of body).' },
  { path: 'model.wingChordScale', group: 'hull', kind: 'number', min: 0.5, max: 2.2, desc: 'Wing front-to-back depth/fullness, independent of span (seraphWing).' },
  { path: 'model.tailSegments', group: 'hull', kind: 'int', min: 0, max: 16, forms: true, desc: 'Segmented-tail count (0 for hull-grown tails).' },
  { path: 'model.neckSegments', group: 'hull', kind: 'int', min: 0, max: 12, forms: true, desc: 'Neck-chain segment count.' },
  { path: 'model.ridgeCount', group: 'hull', kind: 'int', min: 0, max: 28, forms: true, desc: 'Dorsal scale-ridge count (0 = smooth back).' },
  { path: 'model.hornLen', group: 'hull', kind: 'number', min: 0, max: 2.5, forms: true, desc: 'Horn length multiplier.' },
  { path: 'model.hornPairs', group: 'hull', kind: 'int', min: 0, max: 4, forms: true, desc: 'Number of horn pairs.' },
  { path: 'model.shoulderWidthScale', group: 'hull', kind: 'number', min: 0.4, max: 2.2, desc: 'Shoulder/wing-root breadth.' },
  { path: 'model.wingRootScale', group: 'hull', kind: 'number', min: 0.4, max: 2.5, desc: 'Wing-root attachment thickness.' },
  { path: 'model.headScale', group: 'hull', kind: 'number', min: 0.4, max: 2.2, desc: 'Head proportion.' },
  { path: 'model.eyeScale', group: 'hull', kind: 'number', min: 0.3, max: 2.2, desc: 'Eye proportion.' },

  // --- parametricArrow body shape (model.bodyKnobs.* — dragonBodyProfile.js) -----
  // Dial-able silhouette over the shipped arrowhead table; every knob defaults to
  // identity → byte-identical to the 'arrow' torso. Needs parts.torso:'parametricArrow'.
  { path: 'model.bodyKnobs', group: 'hull', kind: 'object', desc: 'Parametric body-shape knobs (parts.torso:parametricArrow). Children below; default identity = the shipped arrow body.' },
  { path: 'model.bodyKnobs.bodyLength', group: 'hull', kind: 'number', min: 0.6, max: 1.8, desc: 'After-body length multiplier.' },
  { path: 'model.bodyKnobs.shoulderWidth', group: 'hull', kind: 'number', min: 0.5, max: 2.0, desc: 'Shoulder/fore-body breadth.' },
  { path: 'model.bodyKnobs.shoulderZ', group: 'hull', kind: 'number', min: -0.6, max: 0.6, desc: 'Slide the shoulder rows fore/aft.' },
  { path: 'model.bodyKnobs.chestScale', group: 'hull', kind: 'number', min: 0.5, max: 1.6, desc: 'Chest (shoulder-peak/thorax) breadth.' },
  { path: 'model.bodyKnobs.waistPinch', group: 'hull', kind: 'number', min: 0.4, max: 1.3, desc: 'Waist+hip breadth (<1 deepens the pinch).' },
  { path: 'model.bodyKnobs.hipFlare', group: 'hull', kind: 'number', min: 0.5, max: 1.8, desc: 'Hip breadth.' },
  { path: 'model.bodyKnobs.bellyFullness', group: 'hull', kind: 'number', min: 0.6, max: 1.6, desc: 'Belly depth of the mid rows.' },
  { path: 'model.bodyKnobs.neckTaper', group: 'hull', kind: 'number', min: 0.5, max: 1.6, desc: 'Neck-row breadth.' },
  { path: 'model.bodyKnobs.tailTaper', group: 'hull', kind: 'number', min: 0.4, max: 1.6, desc: 'Tail-root breadth.' },
  { path: 'model.bodyKnobs.keelHeightCurve', group: 'hull', kind: 'number', min: 0.6, max: 1.6, desc: 'Dorsal keel-crest height.' },
  { path: 'model.bodyKnobs.sectionPoints', group: 'hull', kind: 'int', min: 6, max: 24, desc: 'Cross-section roundness (control points; 8 = the shipped faceted airfoil).' },
  { path: 'model.bodyKnobs.sectionExponent', group: 'hull', kind: 'number', min: 1.5, max: 4, desc: 'Super-ellipse fullness (higher = boxier; only when a custom section is emitted).' },
  // Own cross-section ring list (the "Phoenix move" as data): [z, halfWidth, keelTop,
  // belly] tuples or { z, halfWidth, keelTop, belly } objects, head(-z) → tail(+z).
  { path: 'profileStations', group: 'hull', kind: 'stationList', desc: 'Own body cross-section ring list (parts.torso:parametricArrow) — head(-z)→tail(+z).' },

  // --- parametric tail tip outlines (model.tailKnobs.* — dragonTail.js) ----------
  { path: 'model.tailKnobs', group: 'hull', kind: 'object', desc: 'Dial-able comet/blade/spade tail-tip outlines; default identity = the shipped shapes.' },
  { path: 'model.tailKnobs.forkSpread', group: 'hull', kind: 'number', min: 0.1, max: 1.2, desc: 'Comet fork tine spread.' },
  { path: 'model.tailKnobs.forkLength', group: 'hull', kind: 'number', min: 0.6, max: 3, desc: 'Comet fork length.' },
  { path: 'model.tailKnobs.forkNotch', group: 'hull', kind: 'number', min: 0.2, max: 2, desc: 'Comet fork inner-V notch depth.' },
  { path: 'model.tailKnobs.bladeHalfW', group: 'hull', kind: 'number', min: 0.1, max: 1, desc: 'Blade-tail half-width.' },
  { path: 'model.tailKnobs.bladeLength', group: 'hull', kind: 'number', min: 0.6, max: 3, desc: 'Blade-tail length.' },
  { path: 'model.tailKnobs.spadeHalfW', group: 'hull', kind: 'number', min: 0.05, max: 0.6, desc: 'Spade-tip half-width.' },
  { path: 'model.tailKnobs.spadeLength', group: 'hull', kind: 'number', min: 0.2, max: 1.6, desc: 'Spade-tip length.' },

  // --- wing shape + surface (model.*) -----------------------------------------
  { path: 'model.wingOpacity', group: 'wing', kind: 'number', min: 0, max: 1, forms: true, desc: 'Membrane translucency.' },
  { path: 'model.wingPanelGlow', group: 'wing', kind: 'number', min: 0, max: 1.5, forms: true, desc: 'Emissive glow on the membrane panel.' },
  { path: 'model.wingBillow', group: 'wing', kind: 'number', min: 0, max: 0.6, desc: 'Chordwise membrane cup amplitude.' },
  { path: 'model.wingArmLeadChord', group: 'wing', kind: 'number', min: 0, max: 1.5, desc: 'Forward sweep of the arm/leading spar toward the leading edge.' },
  { path: 'model.wingWristMedial', group: 'wing', kind: 'number', min: 0, max: 2, desc: 'Inboard pull of the wrist (finger fan spread).' },
  { path: 'model.wingFingerCurve', group: 'wing', kind: 'number', min: 0, max: 1, desc: 'Finger-spoke bow magnitude.' },
  { path: 'model.wingFingerSplay', group: 'wing', kind: 'number', min: 0, max: 1, desc: 'Finger fan splay.' },
  { path: 'model.wingFingerBulge', group: 'wing', kind: 'number', min: 0, max: 0.5, desc: 'Strut ridge bulge amplitude.' },
  { path: 'model.wingFingerRadius', group: 'wing', kind: 'number', min: 0, max: 0.3, desc: 'Finger-strut tube radius.' },
  // Parametric wing PLANFORM per form (dragonWingForms.js) — an alternative to the
  // hand-placed wingForms[] tip arrays. Each entry: { span?, fingerCount?, fingerSplay?,
  // chordTaper?, sweep?, scallop?, flame?, arc?, tips? }. Pairs with a folding
  // skinnedMembrane wing so the planform reshapes without colliding mid-beat.
  { path: 'wingFormKnobs', group: 'wing', kind: 'wingFormList', forms: true, desc: 'Per-form parametric wing-planform knob objects (alt. to wingForms[]).' },

  // --- motion / feel (model.*) ------------------------------------------------
  { path: 'model.flapBias', group: 'motion', kind: 'number', min: 0.4, max: 1.6, desc: 'Wingbeat phase drift.' },
  { path: 'model.flapAmp', group: 'motion', kind: 'number', min: 0.2, max: 1.6, desc: 'Wingbeat amplitude scale.' },
  { path: 'model.flapProfile', group: 'motion', kind: 'object', desc: 'Per-creature wingbeat character (lag/amp/limits/surge/bank — see dragonWingFlap.js).' },
  { path: 'model.flapProfile.lagElbow', group: 'motion', kind: 'number', min: 0, max: 2, desc: 'Shoulder→elbow phase lag (rad).' },
  { path: 'model.flapProfile.lagWrist', group: 'motion', kind: 'number', min: 0, max: 3, desc: 'Shoulder→wrist phase lag (rad).' },
  { path: 'model.flapProfile.elbowAmp', group: 'motion', kind: 'number', min: 0, max: 1.5, desc: 'Elbow swing amplitude.' },
  { path: 'model.flapProfile.foldAmp', group: 'motion', kind: 'number', min: 0, max: 1.5, desc: 'Wrist counter-fold amplitude.' },

  // --- material finish (model.*) ----------------------------------------------
  { path: 'model.bodyMetalness', group: 'material', kind: 'number', min: 0, max: 1, desc: 'Body metalness (0 = matte organic hide).' },
  { path: 'model.bodyRoughness', group: 'material', kind: 'number', min: 0, max: 1, desc: 'Body roughness.' },
  { path: 'model.bodyEnvIntensity', group: 'material', kind: 'number', min: 0, max: 3, desc: 'Environment-map reflection intensity.' },
  { path: 'model.rimBodyMul', group: 'material', kind: 'number', min: 0, max: 3, desc: 'Per-dragon fresnel-rim multiplier (0 suppresses glare on dark bodies).' },
  { path: 'model.scaleSize', group: 'material', kind: 'number', min: 0.5, max: 12, desc: 'Procedural scale cell size (lower = bigger cells).' },
  { path: 'model.scaleRelief', group: 'material', kind: 'number', min: 0, max: 2, desc: 'Scale normal-relief depth.' },

  // --- legacy decoration flags (model/forms.*) — INFERRED into surfaceLayers ---
  // These drive the imperative→declarative surfaceLayers registry. Listed here so
  // the grammar documents them and the validator range-checks them; a creature may
  // instead declare parts.surfaceLayers directly.
  { path: 'model.spineGlow', group: 'surfaceLayers', kind: 'number', min: 0, max: 1.5, forms: true, desc: 'Glowing dorsal spine-line intensity (0 = none).' },
  { path: 'model.dorsalGlowCount', group: 'surfaceLayers', kind: 'int', min: 0, max: 28, forms: true, desc: 'Cyan dorsal chevron count (overrides the spine line).' },
  { path: 'model.backCrest', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Raked-back shoulder crest blades.' },
  { path: 'model.dorsal', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Dorsal sail fin.' },
  { path: 'model.backSpines', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Deploying back-spine row.' },
  { path: 'model.armorPlates', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Angular shoulder/flank armour plates.' },
  { path: 'model.glowSeams', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Under-scale emissive vein seams.' },
  { path: 'model.bladeFins', group: 'surfaceLayers', kind: 'bool', forms: true, desc: 'Sharp lateral blade fins.' },
]);

// Fast lookup: path → descriptor.
const BY_PATH = (() => {
  const m = new Map();
  for (const d of CREATURE_GRAMMAR) m.set(d.path, d);
  return m;
})();

export function grammarGroups() { return GROUPS.slice(); }
export function knobsFor(group) { return CREATURE_GRAMMAR.filter((d) => d.group === group); }
export function knobByPath(path) { return BY_PATH.get(path) || null; }
