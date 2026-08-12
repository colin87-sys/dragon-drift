# 2026-07-14 — The eruption "feels like a flash": ease the ENVELOPE, not the source

**Why.** Right after the flow-carve→eruption coupling shipped, the owner: "when the eruption occurs it feels
like a flash. It should be a transition in and out." The natural eruption (slow sine drift across the 0.72
activity threshold) was always gradual — but the NEW flow coupling drives `act` up in ~1s as `slipMix`
climbs, so `act` crosses the threshold fast and the colour **popped on/off** every guaranteed aurora flow run.

**The fix — damp the eruption ENVELOPE itself, once, downstream of every source.** Instead of chasing each
input's rate (the flow coupling's `flowExcite` damp, the natural drift, `?auract`), add a single damped
envelope on the OUTPUT: `eruptEnv = damp(eruptEnv, eruptTarget, 0.7, dt)` → `uAurErupt = eruptEnv`. Now the
colour SWELLS and FADES over ~3-4s no matter how fast `act` crossed the threshold. A numeric sim of a real
carve (slip ramp 1.5s, hold 3s, release): eruption rises smoothly to ~0.77 and afterglows back down over
~5s — a transition, not a flash. **Reusable law: when an effect can be driven by MULTIPLE inputs at
different rates, smoothing belongs on the shared OUTPUT envelope, not on each input** — one damp fixes them
all and can't be out-run by a new fast source later.

**Free bonuses of enveloping the output:**
- **Intensity now scales with carve DURATION** — a brief carve gives a partial glow, a full ~11s flow run
  blooms to full. The damp turned a binary threshold into a "build it up" reward, for free.
- **A gentle afterglow** — the colour lingers a few seconds after the carve ends (the target crashes when
  `act` drops below threshold, but `eruptEnv` eases down), which reads as intentional grace, not a cut.

**Gotchas kept:**
- **Raw `dt` (`dt || 0`), not the `|| 0.016` default** — so a frozen montage (`timeScale=0` → `dt=0`) holds
  the envelope (damp is a no-op at `dt=0`), and captured stills stay pinned. The eruption-sweep tool still
  works because `eruptOverride` pins `uAurErupt` AFTER the damp.
- Two test asserts pinned the old `uAurErupt.value = 1.4 * (…)` line — both moved to `eruptTarget = 1.4 *
  (…)` + the new `eruptEnv = damp(…)` / `uAurErupt.value = eruptEnv`. Added a functional check: from
  settled-high, one release frame keeps >85% of the colour (afterglow) — proves the ease, not on/off.

**Leapfrog.** Fresh branch off master (PR #424 merged). The λ (0.7) is a one-line dial if the owner wants a
snappier or slower transition on the preview.
