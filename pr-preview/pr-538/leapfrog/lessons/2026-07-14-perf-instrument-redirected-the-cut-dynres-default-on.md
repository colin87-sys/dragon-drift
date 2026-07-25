# Perf — the on-device instrument redirected the cut, and the fix was to ship it default-ON

**What happened.** After building the adaptive-resolution governor + perf-saver + a hitch
instrument (`sim`/`draw`/`gpu` split), the owner read the new HUD `hitch` line on-device in a
flow run. **`hitch 50ms  sim 1 draw 3 gpu 46`** — the worst frame is **46ms of GPU fill**, with
the world-update phase at **1ms**. That single reading **killed the fix I was about to build**:
a code audit had ranked "canyon geometry built synchronously during play" as the likely hitch,
and I was queued to amortize it across frames. But the amortization only helps *`sim`* time, and
`sim` was 1ms. **Building it would have been pure wasted work** — the exact trap the fill-vs-CPU
lesson warns about ("halving draws didn't move fps → you optimized the wrong axis"), avoided this
time only because we'd shipped the instrument *first* and read it *before* cutting.

**Two shots, one conclusion.** With dynRes OFF the device dropped to **tier 1** (features cut) to
hold ~58fps; with dynRes ON it held **tier 0 (full aurora + reflections)** by trimming resolution
just to **0.79**, same fps, slightly better p95 (30 vs 32ms). The governor does exactly what it
was designed to do — spend pixels, keep the look — and the worst frame is a GPU-fill spike that
resolution scaling (not feature-cutting, not CPU amortization) is the right lever for. The arc
was already correct; the only gap was **reach**.

**The capstone — make it default-ON.** The fix shipped *default-off* (the repo's coexist-behind-
a-flag convention), so players only got it by digging into Settings. Default-on is **safe by
construction**: the governor only trims once the frame median is sustained-below-60, so on any
device with headroom `resScale` stays 1.0 and the frame is byte-identical — it activates *only*
where it's needed. So default-on can't regress a capable device and simply lets a struggling one
hold the rate. Changed `save.js` `dynRes: false → true`.

**The migration gotcha — a default flip does NOT reach existing saves.** `deepMerge(clone(DEFAULTS),
parsed)` fills a MISSING key from the default, but a saved value WINS. Since the setting persists
the whole settings object, every player who ran since the setting landed has `dynRes: false` baked
into localStorage → the new default never reaches them. So default-on needs a **one-time versioned
migration**: bump `DEFAULTS.v` and `if ((parsed.v||0) < N) data.settings.dynRes = true`. This flips
everyone on once (including the handful who toggled it off in the few days it was default-off —
acceptable for a no-op-when-not-needed perf feature that stays re-toggleable). **A default change
that must reach the installed base is a migration, not just a default edit.**

**Found in passing — a stale migration test the boss stream left behind.** `reforged/js/save.js`
had already been bumped `v:3 → v:4` by an unrelated (boss-stream) merge, but
`tests/save-migration.mjs` still asserted `s.v === 3` — it was **failing on master** and the
failure was invisible because the harness has no test-runner CI (only a Pages preview deploy), and
local runs were read with `| tail`, which hides a mid-list `✗` and the exit code. Bumped the test to
v5 and added a `dynRes` migration assertion. **Two hazards to remember:** (1) a version-stamp test
must move with every version bump, or it rots silently; (2) `node test.mjs | tail -3` masks failures
— check the exit code / the `N failed` line, not the tail.

**Also a two-tree footgun:** this repo has a **legacy root `js/` + `tests/`** (Jul 7) alongside the
**live game in `reforged/`** (Jul 14). A relative `grep js/save.js` from repo-root silently reads the
STALE tree (`v:3`, no `dynRes`) while the real file (`reforged/js/save.js`) is `v:4` — which sent me
chasing a phantom contradiction. **Always operate on `reforged/...` with absolute paths; a bare
`js/`/`tests/` path from the repo root is the wrong file.**

**The headline lesson — ship the instrument, read it on the device, and let it VETO your plan.** The
audit's #1 suspect and the real cause disagreed, and only a single-axis on-device reading
(`sim`/`draw`/`gpu`, the temporal analogue of the pixelRatio probe) settled it. The measurement
didn't just prioritize the fix — it *cancelled* one and *confirmed* another, then the remaining work
was distribution (default-on + migration), not more cutting. Localize, then cut; often the honest
result is "the cut you planned is unnecessary."

**Verify.** `save-migration` (v5 stamp + the `dynRes` default-on migration assertion; previously
RED on master) green; `resgovernor` 30/30 (guard flipped to `dynRes: true`); `smoke` / `composer` /
`passbudget` / `graphicsfoundation` / `perfhud` / `biomecycle` green with the governor now running
by default (it's a no-op under the headless capture's short windows — the median ring never crosses
the degrade line). The real proof is the owner's device: default-on means a struggling phone now
holds tier 0 at ~60 the moment it loads, no Settings trip.

**Reusable.** (1) Instrument BEFORE you cut and let the reading veto the plan — the flashy suspect
(a mirror, a synchronous build) is often innocent; a single `gpu`-dominated frame says "fill," full
stop. (2) A perf feature that's a no-op when not needed is safe to ship default-on (it activates only
under load); the shipped look stays byte-identical on capable hardware. (3) A default flip reaches
new installs only — reach the installed base with a versioned one-time migration. (4) Version-stamp
tests rot silently without test CI; verify by exit code, never by `| tail`. (5) In a repo with a
legacy tree beside the live one, absolute `reforged/...` paths only.
