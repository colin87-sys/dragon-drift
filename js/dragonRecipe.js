// Dragon "recipe" system — the backbone of the composable part builder.
//
// The legacy builder (dragonModel.js) grew ~38 `model.*` flags branched inside
// one function, plus a wholly separate Phoenix builder. That made every new
// creature either converge on the same silhouette (reusing flags) or bloat the
// builder with another `if`. A recipe replaces that with a small declaration:
//
//   parts: { torso: 'serpent', wings: 'feather', tail: 'plume', head: 'beaked' }
//
// The builder looks each part up in a registry and composes them. Adding a body
// plan becomes "register a module + name it in a recipe", not "edit the god
// builder". Parts talk to each other only through a published ATTACH CONTRACT
// (see dragonTorso.js): the torso reports where wings/neck/head/tail mount, so a
// long serpent and a stocky wyvern each place their limbs correctly without the
// wing/head/tail code knowing which body it's on.
//
// Rollout is incremental and backward-compatible: a dragon that declares no
// `parts` gets a recipe INFERRED from its existing flags, so the whole shipped
// roster keeps rendering identically while modules are extracted one at a time.
// This file currently resolves + dispatches the TORSO; wings/tail/head are still
// assembled inline in dragonModel.js and will move behind this same registry.

// --- part registries --------------------------------------------------------
// Each maps a part name → builder fn. Modules call register* at import time.
const TORSO_BUILDERS = {};

export function registerTorso(name, fn) { TORSO_BUILDERS[name] = fn; }
export function getTorsoBuilder(name) { return TORSO_BUILDERS[name] || TORSO_BUILDERS.arrow; }
export function hasTorso(name) { return !!TORSO_BUILDERS[name]; }

// --- recipe resolution ------------------------------------------------------
// Resolve a dragon def to an explicit { torso, wings, tail, head } recipe.
// An explicit `def.parts` wins; otherwise infer from the legacy flag set so the
// existing roster needs zero data changes and renders byte-identically.
export function resolveRecipe(def) {
  const explicit = def.parts || {};
  const model = def.model || {};

  // TORSO: the body plan. The Phoenix keeps its own avian build for now (it is
  // dispatched before recipe resolution in dragonModel.js); every membrane
  // dragon defaults to the arrowhead loft that the redesign shipped.
  const torso = explicit.torso
    || (def.archetype === 'phoenix' ? 'avian' : 'arrow');

  // WINGS / TAIL / HEAD are resolved here for forward-compatibility but are not
  // yet dispatched (still inline in dragonModel.js). Inferring them now means the
  // recipe object is already complete when those modules are extracted.
  const wings = explicit.wings
    || (model.wingShape === 'feather' ? 'feather' : 'membrane');
  const tail = explicit.tail
    || model.tailStyle
    || (model.maceTail ? 'mace' : model.tailTip === 'fan' ? 'fan' : 'legacy');
  const head = explicit.head
    || (model.earTendrils && !(model.hornLen > 0) ? 'frilled' : 'horned');

  return { torso, wings, tail, head };
}
