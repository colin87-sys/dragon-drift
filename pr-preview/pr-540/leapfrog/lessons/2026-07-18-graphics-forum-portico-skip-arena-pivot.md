# Drowned Forum PR-7 — SKIPPING the portico + pivoting the budget to the arena (Fable pre-assess 4.4 PASS)

**What we did.** Before building PR-7 we ran the standing PRE-ASSESS (spawn Fable on the DIRECTION before the
grunt work). The art-director handover had already ruled to CUT the `portico` (temple front) and fold its budget
into the `arena` crown; the pre-assess concurred at **4.4/5** and sharpened three things we're now building to.

**THE PORTICO IS A CLONE, NOT A GAP — the "no compositional hole" test.** The reflex is to fill the roster
(13 archetypes were specced, so build all 13). The kill was structural: the biome already owns the
horizontal-cornice-mass beat THREE times (basilica, aqueduct, pantheon), and **the pantheon already carries a
broken hexastyle portico stub with a snapped pediment at its foot** — a full portico is that exact chord played
louder. Fable, reading the live flythrough: the cornice register is the *most oversubscribed* band in the
composition (the basilica cornice already rules a dead-level line across ~40% of frame width), and "a
pediment-on-columns is another straight cornice with a triangle on top — it thickens the band instead of
breaking it." **A prop earns its slot by filling a HOLE, not by completing a set.** When the roster says build X
but the composition has no hole for X, cut X — and the variety-octave "one-city, no-clone" bar is the arbiter.
(Fallback if the roster later feels statue-poor: the `nymphaeum` — a curved apse of pale figures, a genuinely new
*vocabulary* — never the portico. A vocabulary gap ≠ a compositional hole; it doesn't block the arena.)

**THE ARENA'S REAL NOVELTY IS A CURVE IN PLAN, NOT "THE ONLY CURVE."** We pitched the arena as "the only curved
silhouette left." Fable corrected from the frames: the skyline is *dominated* by arch curves (the triumphgate is
a semicircle dead-centre; a triumphgate-dense stretch shows TWO arch curves at once). Every curve shipped is an
arch in ELEVATION seen face-on. The arena's claim is a curve in **PLAN** — a rank of identical round arches
FORESHORTENING around an ellipse (the Colosseum read). That reframing matters because a plan-curve is *the single
hardest thing to make legible from a low, near-water portrait camera in gold fog* — which is exactly where it can
fail (see the sightline lesson coming next), so the whole build must defend that one read.

**THE #1 FAILURE RISK IS AQUEDUCT DÉJÀ-VU — and the fix is a GATING rule, not a modeling one.** Arena and
aqueduct are both "a rank of round arches with light through the bays"; at 45+ units in fog they are the SAME
object, and the arena's natural home (the arcade flank) is where the aqueduct already lives. Two round-arch ranks
in one frame = an automatic "one-city, no-clone" fail. Two defences, both now built: (1) **aperture content** —
through the aqueduct's bays you see SKY; through the arena's you must see GOLD WATER (the flooded bowl). That is
the identity and it's a *sightline* problem (next lesson). (2) **suppression** — a shared pure predicate
`forumArenaAt(dist)` gates the arena ON and the aqueduct OFF in the same congregation, so the arena *becomes* the
arcade flank's pierced note and the two ranks never share a frame. Implemented as `arenaGate` (arena) +
`suppressForArena` (aqueduct) flags reading the one predicate — render-only, no rnd → gold-determinism
byte-identical.

**PLACEMENT COROLLARIES the pre-assess fixed (before a single tri):**
- **Rarity:** a crown must be rarer than the colossus (~1 per 2-3). `forumArenaAt` = the colossus's own duty hash
  (`P*17+5`<0.55, so **every arena congregation also carries the biased colossus** — the money-shot pairing) AND
  a pharos-shy factor (`P*13+7`≥0.6 → thins to ~1 per 6-7 AND clears any congregation whose adjacent breath holds
  the breath-gated pharos, so crown and tower never share a deep-fog frame).
- **Colossus bias = SEQUENTIAL, not simultaneous.** A hand parked in front of the near bays occludes the only
  gold apertures. Arena step 211 vs colossus step 167 → different z-slots → the player passes the hand, THEN the
  bowl unveils (a two-beat down-lane reveal), and the arena's open quadrant is offset from the hand's |x|.

**PROCESS NOTE — the pre-assess pays for itself.** One direction spawn (a) killed a whole mid-hero build (the
portico) before it started, (b) reframed the pitch so the build defends the right read, and (c) turned the
biggest risk into two concrete gating flags on turn one. Cost: ~40k subagent tokens. This is the two-shelf
"audit the direction before building" law applied to a whole PR, not one prop.

**What it unlocks.** The `forumArenaAt` suppression predicate (a reusable pattern for "landmark X takes over
flank F's rhythm from prop Y") + the "no compositional hole → cut it" roster discipline. The arena build + the
low-camera sightline pivot follow in their own lesson. Portico: **cut** (park nothing — it was never built);
nymphaeum stays a post-arena stretch.

**Verify:** `node tests/gold-determinism.mjs` byte-identical, `node tests/biomecycle.mjs` 12/0 — the new gate
flags are pure render-gates, determinism untouched.
