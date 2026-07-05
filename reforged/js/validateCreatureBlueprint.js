// validateCreatureBlueprint — loud, ACTIONABLE validation of a creature def
// against the creature grammar (creatureGrammar.js). A malformed blueprint fails
// at AUTHOR time with a clear message ("'nightFuryWngs' is not a registered wings
// builder; did you mean 'nightFuryWings'?") instead of a silent bad render.
//
// Builder/shader/layer ENUMS are checked LIVE against the part registries +
// SURFACE_PATCH_NAMES + the surfaceLayers registry, so the rule set can never
// drift from what is actually buildable. IMPORTANT: those registries are
// populated as the part modules self-register at import — call this only AFTER
// importing dragonModel.js (which imports every part module). The headless test
// (tests/blueprint.mjs) and the runtime dev-guard in buildDragonModel both do.
//
// Returns { ok, errors:[], warnings:[] }. errors block (a real mistake),
// warnings are advisory (e.g. a value just outside the documented range).

import { CREATURE_GRAMMAR } from './creatureGrammar.js';
import { hasTorso, hasWings, hasHead, hasTail, listTorsos, listWings, listHeads, listTails } from './dragonRecipe.js';
import { SURFACE_PATCH_NAMES } from './dragonSurfaceShader.js';
import { hasSurfaceLayer, listSurfaceLayers } from './dragonSurfaceLayers.js';
import { TAIL_STYLES } from './dragonTail.js';

const REGISTRY = {
  torso: { has: hasTorso, list: listTorsos },
  wings: { has: hasWings, list: listWings },
  head: { has: hasHead, list: listHeads },
  tail: { has: hasTail, list: listTails },
};

// Closed VALUE sets for 'enum' knobs — resolved live from the builder's own list so the
// grammar can never drift from what's actually dispatchable (the SURFACE_PATCH_NAMES pattern).
const ENUM_SOURCES = {
  tailStyle: TAIL_STYLES,
};

function getPath(obj, path) {
  let cur = obj;
  for (const key of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

// Tiny edit distance for "did you mean" suggestions.
function editDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(
      d[i - 1][j] + 1, d[i][j - 1] + 1,
      d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
    );
  }
  return d[m][n];
}
function suggest(name, options) {
  if (!options.length) return '';
  let best = options[0], bestD = editDistance(name, best);
  for (const o of options.slice(1)) { const dd = editDistance(name, o); if (dd < bestD) { best = o; bestD = dd; } }
  return bestD <= Math.max(2, Math.ceil(best.length / 2)) ? ` (did you mean '${best}'?)` : '';
}

// Wrong TYPE is a hard error (a real mistake); out-of-RANGE is advisory (the
// documented ranges are harvested from the roster and may be conservative, so a
// new creature pushing a knob a little further should warn, not block).
function checkNumber(val, d, where, errors, warnings) {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    errors.push(`${where} = ${JSON.stringify(val)} must be a finite number.`);
    return;
  }
  if (d.kind === 'int' && !Number.isInteger(val)) {
    errors.push(`${where} = ${val} must be a whole number.`);
  }
  if (d.min != null && val < d.min) warnings.push(`${where} = ${val} is below the documented minimum ${d.min}.`);
  if (d.max != null && val > d.max) warnings.push(`${where} = ${val} is above the documented maximum ${d.max}.`);
}

function checkShingleSpec(spec, where, errors) {
  if (typeof spec !== 'object' || spec == null) { errors.push(`${where} must be an object.`); return; }
  if (spec.count != null) {
    if (Array.isArray(spec.count)) {
      if (spec.count.length > 4) errors.push(`${where}.count array has ${spec.count.length} entries (max 4 — one per form level).`);
      spec.count.forEach((c, i) => { if (typeof c !== 'number' || c < 0) errors.push(`${where}.count[${i}] = ${JSON.stringify(c)} must be a number ≥ 0.`); });
    } else if (typeof spec.count !== 'number' || spec.count < 0) {
      errors.push(`${where}.count = ${JSON.stringify(spec.count)} must be a number ≥ 0 (or a per-form array).`);
    }
  }
  if (spec.zRange != null && (!Array.isArray(spec.zRange) || spec.zRange.length !== 2 || spec.zRange.some((z) => typeof z !== 'number'))) {
    errors.push(`${where}.zRange must be [z0, z1] numbers.`);
  }
  for (const k of ['len', 'wid', 'cup', 'tilt', 'yLift', 'inset']) {
    if (spec[k] != null && typeof spec[k] !== 'number') errors.push(`${where}.${k} = ${JSON.stringify(spec[k])} must be a number.`);
  }
}

// Validate ONE creature def. `name` is used only in messages.
export function validateCreatureBlueprint(def, name = def && def.name) {
  const errors = [], warnings = [];
  const tag = name ? `${name}` : 'creature';
  if (typeof def !== 'object' || def == null) {
    return { ok: false, errors: [`${tag}: blueprint must be an object.`], warnings };
  }
  // Asset-backed dragons (def.meshUrl) carry no procedural torso/wings/head/tail
  // builders — their geometry is a loaded GLB — so the creature grammar doesn't
  // apply. Nothing to validate here beyond the presence of the mesh URL.
  if (def.assetBacked || def.meshUrl) {
    if (typeof def.meshUrl !== 'string') errors.push(`${tag}: assetBacked dragon needs a string meshUrl.`);
    return { ok: errors.length === 0, errors, warnings };
  }

  for (const d of CREATURE_GRAMMAR) {
    const val = getPath(def, d.path);
    const where = `${tag}.${d.path}`;

    if (d.kind === 'builder') {
      if (val == null) continue;                       // optional; resolveRecipe infers
      if (typeof val !== 'string') { errors.push(`${where} must be a builder name string.`); continue; }
      const reg = REGISTRY[d.registry];
      if (!reg.has(val)) errors.push(`${where} = '${val}' is not a registered ${d.registry} builder${suggest(val, reg.list())}.`);

    } else if (d.kind === 'enum') {
      // Closed value set — checked on model AND per-form (a monotonic dial like tailStyle
      // that changes across forms[] must still name a buildable value in every form).
      const allowed = ENUM_SOURCES[d.registry] || [];
      const checkEnum = (v, w) => {
        if (typeof v !== 'string') { errors.push(`${w} must be one of ${allowed.join('/')}.`); return; }
        if (!allowed.includes(v)) errors.push(`${w} = '${v}' is not a known ${d.registry} value${suggest(v, allowed)}.`);
      };
      if (val != null) checkEnum(val, where);
      if (d.forms && Array.isArray(def.forms)) {
        const leaf = d.path.split('.').pop();
        def.forms.forEach((f, i) => { if (f && f[leaf] != null) checkEnum(f[leaf], `${tag}.forms[${i}].${leaf}`); });
      }

    } else if (d.kind === 'shaderList') {
      if (val == null) continue;
      if (!Array.isArray(val)) { errors.push(`${where} must be an array of shader names.`); continue; }
      for (const s of val) {
        if (!SURFACE_PATCH_NAMES.includes(s)) errors.push(`${where}: '${s}' is not a known surface shader${suggest(String(s), SURFACE_PATCH_NAMES)}.`);
      }

    } else if (d.kind === 'shingleList') {
      if (val == null) continue;
      [].concat(val).forEach((spec, i) => checkShingleSpec(spec, `${where}[${i}]`, errors));

    } else if (d.kind === 'layerList') {
      if (val == null) continue;
      [].concat(val).forEach((spec, i) => {
        const type = typeof spec === 'string' ? spec : spec && spec.type;
        if (!type || typeof type !== 'string') { errors.push(`${where}[${i}] must be a layer name or { type }.`); return; }
        if (!hasSurfaceLayer(type)) errors.push(`${where}[${i}] = '${type}' is not a registered surface layer${suggest(type, listSurfaceLayers())}.`);
      });

    } else if (d.kind === 'number' || d.kind === 'int') {
      // Range-check the knob wherever it appears: on model AND per-form.
      if (val != null) checkNumber(val, d, where, errors, warnings);
      if (d.forms && Array.isArray(def.forms)) {
        const leaf = d.path.split('.').pop();
        def.forms.forEach((f, i) => { if (f && f[leaf] != null) checkNumber(f[leaf], d, `${tag}.forms[${i}].${leaf}`, errors, warnings); });
      }

    } else if (d.kind === 'enum') {
      // One of a closed value set (checked on model AND per-form). A bad value is a
      // hard error (a real typo, like a bad builder name).
      const checkEnum = (v, w) => {
        if (typeof v !== 'string' || !d.values.includes(v)) {
          errors.push(`${w} = ${JSON.stringify(v)} is not one of ${d.values.join('/')}${typeof v === 'string' ? suggest(v, d.values) : ''}.`);
        }
      };
      if (val != null) checkEnum(val, where);
      if (d.forms && Array.isArray(def.forms)) {
        const leaf = d.path.split('.').pop();
        def.forms.forEach((f, i) => { if (f && f[leaf] != null) checkEnum(f[leaf], `${tag}.forms[${i}].${leaf}`); });
      }

    } else if (d.kind === 'bool') {
      if (val != null && typeof val !== 'boolean') warnings.push(`${where} = ${JSON.stringify(val)} is usually a boolean.`);
    }
    // 'object' / 'color' / 'fx' are descriptive-only (documented, not enforced).
  }

  return { ok: errors.length === 0, errors, warnings };
}

// Validate every creature in a roster map; returns the aggregate + per-creature.
export function validateRoster(dragons) {
  const results = {};
  let ok = true;
  for (const key of Object.keys(dragons)) {
    const r = validateCreatureBlueprint(dragons[key], dragons[key].name || key);
    results[key] = r;
    if (!r.ok) ok = false;
  }
  return { ok, results };
}
