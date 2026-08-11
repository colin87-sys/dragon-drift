// Model-detail (geometry LOD) for the procedural creatures.
//
// THE PROBLEM. The roster's segment counts are hardcoded LOW (cones 4–8, spheres
// 6–14, the wing grid 24×6) so the game holds 60fps on weak mobile. But on a
// high-end phone the GPU sits idle while the CPU/JS is the real bottleneck, and
// the skinned membrane already animates high-poly on the GPU for ~free — so we
// can afford a LOT more triangles (smoother curves, rounder body) on capable
// devices, and a few fewer on the weakest, without touching draw-call count.
//
// THE SYSTEM. A single segment MULTIPLIER, not a per-mesh rewrite. Every geometry
// helper wraps its segment literal in `seg(n)`, which scales by the active detail
// level and rounds with a sane floor:
//
//   • HIGH  (the default) → ×1.0, returned UNCHANGED → byte-identical to today,
//     so turning the system on is a guaranteed no-op until a level other than
//     HIGH is chosen. This is the no-regression contract.
//   • LOW   → trims segments for the weakest devices (auto-selected at low FPS).
//   • ULTRA → densifies for idle-GPU devices (auto-selected on tier-0 hardware,
//     or pinned in Settings).
//
// `active` is process-wide and set synchronously at the top of a build pass
// (buildDragonModel / createDragon / the tricount tool), read by every `seg()`
// call during that pass. Builds never interleave, so a module-level current
// level is safe and keeps the helper call-sites a one-token change.

export const DETAIL_LEVELS = {
  // mul: segment multiplier · floor: never drop a segment count below this
  low:   { key: 'low',   mul: 0.62 },
  high:  { key: 'high',  mul: 1.0  },   // == today (no regression)
  ultra: { key: 'ultra', mul: 1.6  },   // ~2× tris on the skinned hero, idle-GPU only
};

// Process-wide active level (boot default = HIGH so anything that builds before a
// tier is resolved gets exactly today's geometry).
let active = DETAIL_LEVELS.high;

// Normalise a level argument (a key string or a level object) to a level object.
function levelOf(level) {
  if (!level) return null;
  if (typeof level === 'string') return DETAIL_LEVELS[level] || null;
  return level.key ? level : null;
}

export function setActiveDetail(level) {
  active = levelOf(level) || DETAIL_LEVELS.high;
  return active;
}
export function getActiveDetail() { return active; }
export function activeDetailKey() { return active.key; }

// Scale a base segment count by the active (or an explicit) detail level.
// HIGH returns the base EXACTLY (the no-regression contract); other levels round
// and clamp to a floor that is never above the original base, so a small count
// (e.g. a 4-sided cone) can drop to 3 but a deliberately-low count is never
// pushed UP by the floor.
export function seg(base, level) {
  const L = levelOf(level) || active;
  if (L.mul === 1) return base;                 // HIGH: exact passthrough
  const floor = Math.min(base, 3);
  return Math.max(floor, Math.round(base * L.mul));
}

// Resolve the detail level to BUILD from a manual Settings override + the live
// render tier. AUTO (override null/undefined) maps the adaptive render tier:
//   tier 0 (full / high-end, GPU idle) → ULTRA
//   tier 1 (reduced)                    → HIGH
//   tier 2 (low / weak device)          → LOW
// so detail tracks the same FPS signal as graphics quality and NEVER raises
// itself under sustained low FPS. A manual override (high/ultra) pins the level.
export function resolveDetail(override, renderTier = 0) {
  const o = levelOf(override);
  if (o) return o.key;
  return renderTier >= 2 ? 'low' : renderTier === 1 ? 'high' : 'ultra';
}
