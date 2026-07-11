# 2026-07-11 — Graphics Phase 0 foundations landed (N1 dither · N2 renderer contract · N3 tone-map A/B)

**Did / learned.** Shipped the first real code of the graphics overhaul — the safe, flag-guarded Phase-0
foundations, deliberately bundled into one PR (documented Gate-1 deviation) because the owner asked for one PR
while away. **N2 renderer contract:** `powerPreference:'high-performance'` + explicit
`renderer.outputColorSpace = SRGBColorSpace` in `main.js` (skipped `stencil:false` — EffectComposer touches
stencil state, and the micro-opt wasn't worth any doubt on unattended work). **N1 dither:** Jimenez
interleaved-gradient-noise ±0.5 LSB as the last line of the postfx `GradingShader`, behind a `uDither` uniform
(default ON, `?dither=0` kill switch via `setDither()`). **N3 scaffolding:** new `toneMap.js` implements Khronos
PBR Neutral by overriding the `CustomToneMapping` ShaderChunk body (r160 ships ACES + AgX natively but not
Neutral), plus `setToneMap()` and a `?tm=aces|agx|neutral` A/B — default stays ACES, so the shipped frame is
byte-identical unless the flag is passed.

**Gotchas banked.** (1) **The three-resolver only applies to imports loaded AFTER `register()`** — a test's own
top-level `import ... from 'three'` is hoisted and resolves *before* the body runs, so it fails
`ERR_MODULE_NOT_FOUND`; the working pattern (copied from `bulletcontrast.mjs`) is `register()` then
`await import('three')` / `await import('../js/x.js')` dynamically. (2) **A banding gate can't compare two
separate boots** — the sky/aurora/camera are non-deterministic between runs, so the first `bandshot` "measured"
scene drift and reported dither ON as *worse*. Fix: capture BOTH frames from ONE frozen frame
(`__dd.game.timeScale = 0`, screenshot, toggle `uDither` via the postfx seam, screenshot again) and count luma
*transitions* down the column — on a frozen frame dither can only ADD transitions where bands were flat, so
ON > OFF is guaranteed and meaningful (179 vs 167). (3) **Bash cwd persists across tool calls** — an earlier
`cd reforged` made later relative `ls reforged/GRAPHICS-OVERHAUL.md` "vanish" the file; use absolute paths or
`git -C` for anything load-bearing.

**Verify.** `tests/graphicsfoundation.mjs` (20/20: Neutral splice + idempotency, `setToneMap` per-mode + reject,
dither/renderer wiring asserts) — CI-safe, no WebGL. Boot tests `appshell.mjs` + `canyonboot.mjs` clean (zero
console errors, real-WebGL render). New tools `tools/bandshot.mjs` (the standing banding gate) and
`tools/tonemapshots.mjs` (the ACES/AgX/Neutral montage) produced the artifacts the Fable Gate-2 judged.

**→ Systematize.** The Phase-0 pattern for unattended graphics work: ship only changes that are **identity-when-off
or pure-improvement** (N3 default unchanged; N1 off-by-flag; N2 invisible), each with a headless gate, so nothing
can regress the shipped look without a human to judge motion. The **frozen-frame same-session toggle** is the
reusable recipe for any "did this shader change do X" gate — freeze the sim, capture, flip one uniform, capture,
diff; it removes all scene-nondeterminism and makes the metric a clean function of the one change.

**→ Leapfrog.** The tonemap montage evidence is now in hand for the one N3 taste decision (Neutral visibly holds
the gold/aurora that ACES washes white and AgX greys out) — pending the owner's preview call, N3's "flip the
default to Neutral" becomes its own tiny PR. Next Phase-0 step is N4 (ParticleBatch, `?pfx=batch`), the one with
real regression surface, held for owner review. The `toneMap.js` ShaderChunk-override technique also de-risks
N8's atmosphere chunk-override (same "patch a vendored chunk before any material compiles" mechanism).
