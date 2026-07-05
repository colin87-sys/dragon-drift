// Composition engine — song STRUCTURE over the 8-bar loop. Pure + dependency-
// free (node-testable, like tracks.js/harmony.js). A station opts in with a
// `form` (an ordered list of section keys) and `sections` (diffs over the base
// 8 bars); the engine walks the form one section per loop-wrap, and compileTrack
// (in sfx.js) applies the resolved section — muting layers, scaling energy,
// varying bar count — so the arrangement breathes: intro → build → drop →
// breakdown instead of the same bars forever. Absent `form` → the legacy single
// infinite section, byte-identical.
//
// A section diff is a plain object; recognised fields (all optional):
//   bars:   int (default 8)   — section length in bars (variable-length form)
//   mute:   [layerKey, ...]   — layers silenced this section (drop the bassline
//                               in a breakdown, drop leads in a build, …)
//   energy: 0..1              — section intensity; scales note velocity + drum
//                               density, and (via sfx.js) can feed the mix
//   riser:  bool              — schedule a noise riser into the last bar (build)
//   crash:  bool              — accent the downbeat (drop / phrase top)
// The base section (key whose diff is {} — conventionally 'A') = today's data.

const KNOWN_FIELDS = new Set(['bars', 'mute', 'energy', 'riser', 'crash', 'melVariant']);

// Resolve a station's form into the ordered list of {key, diff} it cycles
// through. Returns null when the station has no form (legacy path).
export function resolveForm(tr) {
  if (!tr || !Array.isArray(tr.form) || !tr.form.length || !tr.sections) return null;
  return tr.form.map((key) => ({ key, diff: tr.sections[key] || {} }));
}

// The section playing on loop-wrap number `formPass` (0-based, wraps around the
// form). Returns a normalized section descriptor. `null` form → the implicit
// base section so callers have one code path.
export function sectionAt(tr, formPass) {
  const form = resolveForm(tr);
  if (!form) return { key: 'A', bars: 8, mute: new Set(), energy: 1, riser: false, crash: false, melVariant: 0 };
  const { key, diff } = form[((formPass % form.length) + form.length) % form.length];
  return {
    key,
    bars: clampBars(diff.bars),
    mute: new Set(diff.mute || []),
    energy: diff.energy == null ? 1 : Math.max(0, Math.min(1, diff.energy)),
    riser: !!diff.riser,
    crash: !!diff.crash,
    melVariant: diff.melVariant | 0,
  };
}

function clampBars(b) {
  const n = b == null ? 8 : b | 0;
  // 8-bar sections play the authored bars verbatim; shorter sections take the
  // FIRST `bars` bars (a 4-bar breakdown = the first half). >8 would desync the
  // per-bar arp/pad/chord indexing, so cap at 8.
  return Math.max(1, Math.min(8, n));
}

// Total loop count of one full form pass, for tests / UI ("this station is a
// 48-bar song"). 0 when there's no form.
export function formBarLength(tr) {
  const form = resolveForm(tr);
  if (!form) return 0;
  return form.reduce((s, { diff }) => s + clampBars(diff.bars), 0);
}

// Validate a station's form/sections (used by the headless track gate):
// returns [] when clean, else a list of human-readable problems.
export function validateForm(tr) {
  const problems = [];
  if (!tr.form && !tr.sections) return problems; // legacy, nothing to check
  if (tr.form && !tr.sections) problems.push(`${tr.id}: form without sections`);
  if (tr.sections && !tr.form) problems.push(`${tr.id}: sections without form`);
  if (Array.isArray(tr.form)) {
    for (const key of tr.form) {
      if (!tr.sections || !(key in tr.sections)) problems.push(`${tr.id}: form references missing section '${key}'`);
    }
    if (formBarLength(tr) < 8) problems.push(`${tr.id}: form is shorter than one bar-phrase`);
  }
  if (tr.sections) {
    for (const [key, diff] of Object.entries(tr.sections)) {
      if (diff == null || typeof diff !== 'object') { problems.push(`${tr.id}: section '${key}' is not an object`); continue; }
      for (const f of Object.keys(diff)) {
        if (!KNOWN_FIELDS.has(f)) problems.push(`${tr.id}: section '${key}' has unknown field '${f}'`);
      }
      if (diff.bars != null && (diff.bars < 1 || diff.bars > 8)) problems.push(`${tr.id}: section '${key}' bars ${diff.bars} out of 1..8`);
      if (diff.energy != null && (diff.energy < 0 || diff.energy > 1)) problems.push(`${tr.id}: section '${key}' energy ${diff.energy} out of 0..1`);
    }
    // Energy should MOVE across the form — a form where every section is full
    // energy is just a long loop (the "no dynamics" smell).
    const form = resolveForm(tr);
    if (form && form.length >= 2) {
      const energies = form.map(({ diff }) => (diff.energy == null ? 1 : diff.energy));
      if (Math.max(...energies) - Math.min(...energies) < 0.15) {
        problems.push(`${tr.id}: form has no dynamic range (all sections ~same energy) — add a breakdown/build`);
      }
    }
  }
  return problems;
}
