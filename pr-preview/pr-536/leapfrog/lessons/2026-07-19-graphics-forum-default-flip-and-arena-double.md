# Drowned Forum PR-8 — the DEFAULT FLIP (biome 0 → Drowned Forum) + the arena double-fix that paid the budget

**What we did.** Flipped the Drowned Forum from the `?props=forum` opt-in seam to the **default biome 0** every
player sees; parked the retired jungle-drowned-temple (v3) kit behind `?props=v3` (deletion deferred to owner
sign-off). Folded in the arena double-fix. All gates green; determinism byte-identical.

**THE FLIP IS TWO ONE-LINERS + A DELIBERATE DEFAULT INVERSION.** `environment.js`: `forumV1 = (opt-in) ? [] :
[0]` (forum default) and `lagoonV3 = PROPS_V3 ? [0] : []` (jungle opt-in). `biomes.js`: `if (!PROPS_LAGOON_AB)
BIOMES[0] = FORUM_BIOME0`. The A/B-seam idiom the repo already used for v1/v2/v3 inverts cleanly — the retired
kit stays alive behind a flag so nothing that was shipped breaks, and only the DEFAULT (no param) changes.

**DETERMINISM SURVIVES THE FLIP BECAUSE THE GOLDEN FIXTURE IS LEVEL-GEN, NOT PROPS.** The scary part — headless
tests had always resolved biome 0 to the Lost Lagoon so `gold-determinism` stayed byte-identical. Flipping means
headless now resolves to the FORUM kit (different archetypes → different prop-band rnd draws). It stayed
byte-identical anyway: `gold-determinism` asserts `level.js` rings/obstacles/golds, which run on a **separate rnd
stream** from the environment prop bands. Verify-before-worrying: the arena's earlier step change was already
byte-identical, which told us the prop rnd is isolated; the flip confirmed it. **When a "sacred byte-identical"
gate might be threatened by a default change, check WHAT the fixture actually captures before assuming the worst.**

**THE FLIP ENFORCES A BUDGET THAT COEXISTENCE HID.** `envcount`'s 50k per-biome band-tri cap is computed from
the archetypes whitelisted INTO that biome. While the forum kit was opt-in (`forumV1=[]` by default), its props
weren't charged to biome 0 — so the cap was never enforced on it. The flip charged all 11 forum props to biome 0
at once: **50930 > 50000, a hard fail the opt-in seam had masked.** A coexistence seam can hide a real budget
until the flip; run the full gate suite immediately after inverting a default, not just determinism.

**ONE FIX PAID TWO DEBTS: the arena double-fix IS the budget trim.** The arena's ~27% arena-vs-arena double
(Codex P2, Fable "must not ship") had no clean gate/peak-lock cure — the band's +900 recycle doesn't preserve the
500m lagoon period (the Frozen hero phase-lock only survives because its 300m period divides 900), so a slot
drifts across all 5 phase-positions and any proximity window catches multiple slots. The cure that WORKS is
structural: **`step ≥ WALL_WINDOW (900) → perSide=1 → at most one slot per side in the band window → ≤1 crown per
congregation BY CONSTRUCTION, 0 doubles.** And perSide 5→1 cut the arena's instance buffer 10→2 = 1500→300
band-tris, which brought the biome to 49730 — under the cap. The double-fix and the budget were the same lever.
**Trade-off logged for the owner/Fable:** the single slot reaches only ~30% of eligible congregations → the crown
drops to ~1-per-15. The architecture (900 window < 3×500 periods) can't give both no-doubles AND high coverage,
and the tri budget has no room for the core-recycling change that might. 0 doubles was the non-negotiable; rarity
is the price.

**THE LEAK AUDIT IS A ONE-SHOT PURE TEST.** `tools/forumleak.mjs` imports `propDiag()` headless (empty
`location.search` → the flipped default) and asserts (a) biome-0's whitelist = exactly the shipped forum keys,
(b) no retired jungle/greco key carries a non-empty `biomes` list. Green. The retired archetype DEFINITIONS still
exist (parked, `biomes:[]`) — that's the correct pre-deletion state; §12a.5 defers the delete to owner sign-off.

**SHIPPED 11/13.** `forumfield` (the mosaic-grid "domestic-order gut-punch") and `roofline` (the villa-gable
scale anchor) were the deferred PR-END low-seasoning props and were never built — flagged for Fable/owner as the
load-bearing "is the default complete without them?" call, not silently dropped.

**What it unlocks.** The default-flip recipe (invert the A/B seam, verify the fixture is prop-independent, re-run
the FULL gate suite to catch the hidden budget); the structural perSide=1 double-kill for any rare band prop whose
recycle stride fights its comp period; the pure `propDiag` leak-whitelist test pattern.

**Verify:** `node tools/forumleak.mjs`; `node tests/gold-determinism.mjs` byte-identical; `node tests/biomecycle.mjs`
14/0; `node tools/envcount.mjs` (THE DROWNED FORUM 49730 < 50000); `node tests/bulletcontrast.mjs`; capture biome 0
with NO `?props` flag → renders the Drowned Forum. Retired kit still reachable via `?props=v1|v2|v3` for A/B.
