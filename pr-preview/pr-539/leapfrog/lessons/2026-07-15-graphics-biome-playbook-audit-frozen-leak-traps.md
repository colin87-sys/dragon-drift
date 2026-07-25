# Auditing the biome-overhaul playbook: the Frozen leaks are silent DEFAULTS, not choices

**What we did.** Engineer-audited `reforged/BIOME-OVERHAUL-PLAYBOOK.md` (the art
director's handoff for premium biome overhauls) against the actual code, fixed the
inaccuracies in place, and hardened Part B (the anti-replication mandate). An
ENGINEER AUDIT section at the top of that doc lists every correction with file:line.

**What we learned.** The doc's inferred-from-comments numbers were mostly right but
mis-CLASSIFIED: the 14.5/15.5/17.5/26 clearance "class floors" + the `tilt ≤ 1/h` cap
are Frozen-tuned per-archetype values (environment.js:330-452); the universal facts
are ±13 fatal lane, ±16 gate veil, and the `laneHalfWidth+1.5 = 14.5` inner-edge floor
audited by `tools/propclearance.mjs`. Presenting tuned values as engine classes is how
a next biome inherits Frozen's numbers without noticing.

**The gotcha (the real find): every path by which Frozen leaks into another biome is a
silent DEFAULT, not a decision someone makes.**
1. `bakeIceLadder` without an explicit `stops:` defaults to Frozen's
   `_FROST/_MIDICE/_BELLY` blue ice (obstacles.js:595,611) — the `stops` option
   already exists, it just isn't mandatory.
2. `hazardMesh`'s skinned-shard branch HARDCODES `mats.frostIce`/`mats.moverIce`
   (obstacles.js:897) — any new biome's shard skin ships Frozen's ice material until
   that seam grows per-biome material selection.
3. `tools/propclearance.mjs` CI-enforces `SCOPE_BIOME = 2` only — a new biome's lane
   violations are warn-level "strays" unless the PR widens the scope.
4. Stale sibling docs: `WALL-PROPS-REDESIGN.md` §4.3 still holds an older Caldera
   roster reusing the same archetype names with different roles — without a supersede
   note, two "authorities" coexist and a fresh session picks the wrong one.

**Reusable pattern.** Anti-replication guardrails must be MECHANICAL to hold: the
playbook's Part B checklist now ends with a grep (every `bakeIceLadder(` call passes
`stops:`; zero references to `_FROST/_MIDICE/_BELLY/_WALL_LADDER/mats.frostIce/
mats.moverIce/glacierWallMat/crevasseCore` or Frozen hex literals in a new kit's
diff). A checklist item you can run beats seven you can only contemplate. Also: when
auditing a handoff doc, verify symbol NAMES (`SKIN_BUILDERS` vs the doc's invented
`OBSTACLE_SKINS`) — a fresh session greps the wrong name, finds nothing, and rebuilds
the seam.

**What it unlocks.** The Caldera overhaul (and every biome after) can execute the
playbook without inheriting Frozen's hues, forms, or tuned numbers by accident — the
leak paths are named, cited, and gated.
