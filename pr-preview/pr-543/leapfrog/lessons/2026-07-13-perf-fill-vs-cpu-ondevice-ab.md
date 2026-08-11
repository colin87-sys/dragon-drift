# Perf — the fill-vs-CPU verdict needs an ON-DEVICE A/B, not a headless guess

**What we did.** After a long draw-call optimization arc (wings + Phoenix + aux passes: ~550 → ~252
draws in the S3 heaven), the owner's 17 Pro Max **still sat at ~50fps flying Phoenix**. The decisive
fact: **halving the draw calls did not move the fps.** That alone rules out draw-call binding — and,
because draw submission + encode is CPU work, it's strong evidence the CPU isn't the binding constraint
either. A Fable profile put GPU **fill-rate** as the ~80% suspect (the full-frame additive detonation
under a 4×MSAA HalfFloat target + 4 full-res composer passes at 1.5 DPR), but the honest move was to
**prove it on the device**, since real-GPU fill and CPU cost are NOT measurable headless (SwiftShader).

**The seams shipped (all no-ops without their param → shipped behaviour unchanged):**
- `?pr=<n>` — caps every tier's pixelRatio (changes ONLY pixel count, not draws/JS/scene). **The
  decisive discriminator:** if fps scales ~1/pr² it's fill-bound; if it barely moves it's CPU.
- `?norays` — skips `setupGodRays` → kills the per-frame 24-tap shaft march AND the mask scene pass.
- `?nodet` — hides the detonation + embers (the big full-frame additive overdraw).
- `?nobloom` — disables the bloom pass (refutation control — bloom is quarter-res, predicted innocent).
- `?msaa0` — composer RT `samples: 4 → 0` (the HalfFloat MSAA-resolve bandwidth probe).
- Plus the zero-code Test 0: pin quality LOW in Settings (`qualityOverride` → tier 2) — if tier 2 still
  can't hold 60 in-arena, the cost is CPU and the fill seams are moot.

**The headline lesson — when an optimization succeeds on its metric but the target metric doesn't move,
you optimized the wrong thing; STOP and re-localize before cutting more.** Halving draw calls with zero
fps gain is the loudest possible signal that the frame is not draw-bound. Continuing to cut draws (the
depth-mask was queued) would have been wasted work. The re-localization can't be a headless guess for a
GPU-fill question — it needs an **on-device A/B where each toggle changes exactly ONE cost axis** and a
**pre-stated expected delta** ("if `?pr=1` jumps to ~60, it's fill; if it moves <15%, it's CPU"). A
toggle that changes two things at once (e.g. a whole tier) can't localize; `?pr` changes pixels ONLY.

**Corollary — design the experiment to be falsifiable and cheap.** Include a refutation control
(`?nobloom`, predicted ~0) so a dead end is proven in one reading instead of chased for a day, and
bracket every session with a repeated baseline (thermal throttling on a phone is worth ±10fps — a cool
vs hot A19 will lie to you if you don't).

**Verify.** `smoke` + `unmaskedarena` 57/57 green with NO params (shipped behaviour byte-identical); a
boot with `?pr=1&nobloom&msaa0` confirmed pixelRatio 1 + bloom disabled + 0 errors. The seams are the
instrument; the owner runs the protocol on the PR preview and reports `fps`/`p95`, then the confirmed
lever (Fable's model favours arena-scoped pixelRatio ~1.2 — near-invisible on soft full-frame fire) gets
built. **Also queued regardless of verdict:** the god-ray mask (period 3) and water mirror (period 8)
duty-cycles collide every 24 frames on independent counters → a shared-counter stagger removes that p95
spike.

**Reusable.** For any "we optimized X but the fps didn't move" moment: (1) treat the flat target metric
as proof X wasn't the bottleneck; (2) re-localize with single-axis on-device toggles + pre-stated
expected deltas (pixelRatio is the cleanest fill-vs-CPU probe — pixels only); (3) include a refutation
control and a repeated baseline for thermal drift; (4) only THEN cut, at the confirmed cost center, by
fps-per-visible-quality-lost.
