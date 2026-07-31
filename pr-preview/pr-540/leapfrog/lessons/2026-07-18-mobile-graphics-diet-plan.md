# Mobile graphics diet plan — research → plan → adversarial Fable audit (2026-07-18)

**What we did.** Owner asked for a mobile-specific graphics diet: keep the features with
the most graphical progress per fps, trim the fps-eaters. Ran two parallel research
passes — (1) industry practice for tile-based mobile GPUs (Arm post-FX guidance, Vulkan
tile-based best practice, Fortnite/Genshin mobile tiering, three.js mobile guidance) and
(2) a full audit of our own pipeline (tier system, dynRes governor, postfx chain,
god-rays, water mirror) against `GRAPHICS-PERF-PLAN.md` measurements — then wrote
`reforged/MOBILE-GRAPHICS-DIET.md` and put it through a harsh Fable audit before
shipping the doc.

**What we learned.**
- Our KEEP column was already industry-correct (single grading pass, dither, baked AO,
  SH probe, in-material rim, blob shadow, dynRes-as-throttle). The mobile problem is
  four fill/bandwidth items: the 4× MSAA resolve on the HalfFloat composer RT, the
  full-res god-ray march, the water mirror's second scene pass, and ungated additive
  overdraw — i.e. the diet converges with the existing F-series rather than inventing
  a parallel plan.
- The audit caught real rot a self-review would have shipped: a stale `hazards.js`
  citation inherited from the perf plan, a v1-vs-v2 surface-shader patch mix-up, and a
  false "tonemap+grade already one pass" claim (tonemap is a separate OutputPass — which
  is exactly why the fold is worth doing).

**The gotcha.** Two design traps the audit killed: (a) tier-scoping composer `samples`
reallocs both RTs on every 0↔1 oscillation capable devices are designed to make — MSAA
must be deviceClass-scoped at boot, set once; live changes only via the dynRes STAGES
ladder with the `skipQualityFrames` guard. (b) Extending the boss-diet mirror freeze to
"any res-floor state" reintroduces the mid-play brightening pop the boss-diet latch was
built to prevent — cruise freezes need a masking-event engage/release or don't ship.

**The reusable pattern.** Research (industry + own measurements) → plan doc with
file:line citations → adversarial Fable audit that re-verifies every citation against
source → apply required fixes → Gate Log entry in the doc. The audit-of-a-plan is cheap
(one agent) and caught 5 required fixes; also: rank cuts strictly by ms-per-look-lost —
a zero-look pass-merge outranks any cut that spends look.

**What it unlocks.** A vetted D1–D7 execution ladder (`MOBILE-GRAPHICS-DIET.md §C/§E`)
where each PR has identity checks that are machine-gateable and fps targets honestly
classed as on-device-only.
