# The arena schema gate fires per env addition — and picking the VALUE is the real work

**What we did.** Second time in one session the `unmaskedarena` schema-completeness gate went
red on a master merge: the Lost Lagoon atmosphere stream added `godrayMul` (scalar) +
`godrayTint` (color) to `computeEnv`. Reconciled them into `arenaSkin.js` — `godrayMul` →
`SCALAR_KEYS`, `godrayTint` → `COLOR_KEYS`, plus a value in all four tables (VOID/FLOOD/
HEAVEN/GOLD_FLOOD). Suite back to 60/60. (See `2026-07-16-arena-schema-reconcile-auroramix.md`
for the mechanical pattern; this lesson is about the part that isn't mechanical.)

**What we learned — the recurrence is the signal.** When the graphics streams are active, the
arena schema gate is not a one-off; it fires roughly once per env-field PR that lands on master.
Budget for it on EVERY master merge into an arena branch: after resolving the stamp conflict,
run the two-second key-diff (below) before you even open the browser test. It's faster than
waiting for the full run to tell you the same thing.

    node --input-type=module -e "import {register} from 'node:module';
      register('./tools/three-resolver.mjs', import.meta.url);
      const {computeEnv}=await import('./js/biomes.js');
      const {ARENA_ENV_KEYS}=await import('./js/arenaSkin.js');
      console.log('MISSING', Object.keys(computeEnv(0)).filter(k=>!ARENA_ENV_KEYS.includes(k)))"
    # (biomes.js imports 'three' bare — you MUST register three-resolver.mjs or it's ERR_MODULE_NOT_FOUND)

**The gotcha — the value is a design decision, not a reflex `0`.** `auroraMix` was an easy 0
(the arena has no aurora). `godrayMul` was NOT obviously 0: god-rays are divine sun-shafts and
the heaven is a holy detonation, so "keep them" is a plausible read. What decided it was the
**owner colour law already written into `HEAVEN_HEX`'s own comments**: "the detonation is a
MID-ANNULUS event; the ZENITH and the parry corridor stay dark." Biome sun-shafts crossing the
corridor fight that law and threaten the parry-legibility probe (corridor p90 ≤ 0.75). The
heaven's divine light is *authored* elsewhere (the Godhead Star, `heavenRays`, the ignited
detonation gas) — the biome's shared shaft fan was only ever incidental bleed. So `godrayMul: 0`
is correct-by-owner-law, and empirically it *improved* the probes (corridor p90 0.565→0.533,
sky p50 0.508). **Rule: when the value isn't obvious, grep the target table's own comments for
the owner's stated law for that region before you guess — the answer is usually already written
down.** `godrayTint` gets an inert warm default (`0xffe6b8`) — it must be a valid color for the
lerp/schema even though `mul 0` never renders it.

**Reusable pattern.** New arena env field → (1) key-diff to name it, (2) grep how `biomes.js`
drives it AND grep the arena table comments for the region's colour law, (3) pick the value the
law implies (effects the arena suppresses → 0; things it authors → the authored value), (4) add
to SCALAR/COLOR keys + all four tables, (5) browser-verify the probes didn't move the wrong way.

**What it unlocks.** A green arena suite that survives the graphics streams' churn, and a
divine detonation whose light stays authored — no biome sun-shafts leaking across the dodge lane.
