# Perf — a perf-saver stage: spend the INVISIBLE fill cuts before resolution

**Why.** The just-merged adaptive-resolution governor (`…-adaptive-resolution-global-governor.md`)
trimmed *pixels* first and cut *features* last — good, but the owner pushed back with a sharp
read: **"the boss arena tried to optimize everything first before the res cut. Is there no way
to do the same here?"** They were right about the spirit. The arena's winning lever was a
*near-invisible fill lever* (MSAA-off) that held 60 at **full resolution**, so the resolution
cap ended up an unused fallback. The governor skipped straight to resolution because that's the
one lever proven on-device to reliably recover 60 — but it never spent the cheap, invisible
fill first.

**The honest nuance — the arena's SPECIFIC lever doesn't transfer.** MSAA-off is free in the
heaven because that scene is soft, edgeless additive fire; in cruise the frame is full of hard
edges (props, dragon, rings, canyon), so MSAA-off there = jaggies everywhere. You can't copy the
lever. **But the principle transfers:** cruise has its own near-invisible fill levers, and they
belong *ahead* of resolution.

**What we did — insert a PERF-SAVER rung at the top of the escalation ladder.** The governor's
ladder became `[shipped] → [saver] → [saver + trim res…] → (tier drop)`. Rung 1 engages the
saver at **full resolution**; only rungs 2+ trim pixels. The saver spends two genuinely
low-visibility fill cuts:
- **Water mirror ½ → ¼ rate in cruise** (`water.js setWaterPerfSaver`). The planar mirror is a
  full extra scene render into a 768² RT — real fill + draws, "the biggest single perf line
  item." Its content moves slowly, so quarter-rate is imperceptible. Heaven rates untouched.
- **God-ray march 40 → 24 taps at tier0** (`postfx.js setGodRaySamplesSaver`). The shafts are
  broad, radial-blurred columns — 24 taps over them is indistinguishable, and it's a per-pixel
  saving on a full-res pass (the same call the arena's tier1 already makes at 16).
- **Deliberately NOT the god-ray occlusion mask** — it's *already* duty-cycled to ⅓ (20Hz) with
  a stagger; pushing it further risks visible shaft LAG on fast yaw, i.e. the opposite of
  "invisible." Left alone.

**The elegant part — the saver rung engages for FREE (zero realloc).** Its `STAGES.scale` is
1.0, so `setResScale` no-ops beside it; `setPerfSaver` is pure parameter flips (a duty-cycle
counter + a uniform). So the *first* thing the governor does under load costs nothing to apply
and nothing visible — exactly the property you want in the first line of defense. Resolution
rungs (which realloc the composer RTs) only come after the saver is spent.

**The headline lesson — rank your perf levers by fps-per-VISIBLE-quality-lost and spend them in
that order; the cheapest, most-invisible cut goes FIRST.** A fill-bound frame has a hierarchy of
levers: near-invisible (duty-cycle a slow-moving scene-doubling pass harder; drop samples on a
blurred pass) < mildly-visible (resolution on soft content) < visibly-destructive (cut the
features/look). The controller should walk that hierarchy from cheapest to dearest, not jump to
the one lever that's easiest to reason about. The arena taught this implicitly (find the free
lever for THIS scene); generalizing it means each scene-class gets its own "free lever" spent
before the universal (resolution) one.

**Corollary — "do what the arena did" rarely means copy its lever; it means copy its SEARCH.**
The arena didn't have a graduated runtime ladder — it found the one near-invisible fill lever for
its scene. The cruise analogue isn't MSAA-off (edges); it's the duty-cyclable passes. Same
method (what fill here is invisible to cut?), different answer per scene.

**Identity when off.** All three touch points collapse to shipped when the saver is off:
`water.js` cruise mirror `_perfSaver ? 3 : 1` (→ ½-rate), `postfx.js` `_grSaver ? 24 : 40`
(→ 40 taps), and the saver only ever engages inside the already-default-OFF dynRes path.
`applyQuality`/`setDynRes` reset it; the perf HUD shows `res 0.86 sv` when it's active.

**Verify.** `tests/resgovernor.mjs` 30/30 (adds: a 6-rung ladder ratchets to the floor; saver-
first STAGES shape; saver applied before scale; the `water`/`postfx` identity-off source
guards). `water` (24) · `composer` (36) · `passbudget` (19) · `perfhud` (14) green; a headless
`?dynres=1` boot **+ 2.5s flight** (SwiftShader is slow enough to actually engage the saver live)
ran with zero console errors. The fps is the owner's on-device call: with ADAPTIVE RESOLUTION on,
the HUD should now show `sv` appear in a heavy section *before* the `res` number starts dropping.

**Reusable.** (1) Order perf levers cheapest-invisible → dearest-visible and spend them in that
order; a resolution/feature cut is a *late* lever, not a first one. (2) The near-invisible cuts
are duty-cycling slow-content scene-doubling passes (mirror, occlusion mask, cheap shadow) and
dropping samples on already-blurred passes — spend these first, per scene-class. (3) Make the
first ladder rung realloc-free (a param flip, not an RT resize) so the first response to load is
free to apply. (4) Keep every rung identity-off (`flag ? cheap : shipped`) so the whole ladder
ships dark behind one toggle.
