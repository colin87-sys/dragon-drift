# Graphics D1 — deviceClass-scoped composer MSAA at boot (MOBILE-GRAPHICS-DIET rung 2)

**What we did.** Landed D1 (F1): the composer's multisample count is now a BOOT choice —
desktop 4, mobile 2 — from a new `deviceClass.js` detector, set ONCE and never realloc'd
on a tier flip. The arena's 0-drop restores to that base (2 on mobile), not a hardcoded 4.
The mobile 2→0 cut rides the SAME dynRes ladder as a rung before resolution trims, but ships
default-OFF behind `?msaadyn` (A/B seam) because the plan requires an on-device 2× A/B first.
`tests/msaadiet.mjs` 23/23; full suite green.

**What we learned.**
- **deviceClass is for BOOT choices only — one file, cached, never a live driver.** The
  07-18 law: don't device-sniff anything a measured signal (fps/dynRes/tier) can decide.
  MSAA's boot sample count is the rare exception — no frame exists yet to measure — so it
  gets `deviceClass()`; every LIVE cut still rides the resolution-floor handoff. Putting the
  detector in its own module (not inline) is deliberate: D5's mirror ceiling is the second
  and only other legitimate consumer.
- **Headless = desktop-class = free byte-identity.** Headless chromium is `pointer:fine` +
  `maxTouchPoints:0` + non-mobile UA, so `deviceClass()` returns `desktop` → MSAA 4 → every
  existing `samples === 4` assertion and all of CI stay byte-identical with zero test churn.
  The mobile-2 path is real-device-only, exercised in tests via `?device=mobile`. This is the
  cleanest possible shape for a "mobile-only look change": CI can't even see it, so nothing
  false-fails, and the owner judges the real thing on the phone.
- **The MSAA sample delta must NOT be per-tier (the trap the audit caught).** A capable phone
  oscillates tier 0↔1 by design; if `samples` were tier-scoped, every oscillation would
  realloc both composer RTs — a recurring hitch on exactly the good devices. So `samples` is
  boot-fixed; the only live changes are the arena flash-masked flip and the dynRes rung, both
  `skipQualityFrames`-guarded so the realloc frame never feeds the tier signal.
- **A/B-seam a look cut that spends look; ship for free only the part that doesn't.** The
  boot 4→2 on mobile is a near-invisible edge-AA change and ships as the default (the plan's
  one stated non-identity exception). The 2→0 is a bigger, cruise-unproven cut, so it ships
  DARK behind `?msaadyn` for the owner's on-device measurement; a follow-up flips the default
  once proven AND once the re-raise-under-a-masking-event discipline is added (as a bare A/B
  seam the rung currently restores 0→2 with the governor's reverse step — fine for measuring,
  not for shipping, per the 07-18 mid-play-pop lesson).

**The Gate-2 catch (a state added to a ladder must be restored on EVERY reset path).** The
`?msaadyn` rung adds a new piece of live state (composer `samples`) to the dynRes ladder — and
the ladder has three reset paths, not one: the governor's own reverse step, a tier flip
(`applyQuality` calls `resGovReset`), and the settings dynRes-OFF toggle (`setDynRes(false)`).
The first restores `samples` naturally; the other two reset `resScale`/`saver` but were blind to
the new state, stranding a `?msaadyn`-engaged 0 — **permanently** on dynRes-off, because the
governor block that would otherwise restore it is then gated out (`if (dynResEnabled)`). Fable
caught both. The fix is a `dynMSAATarget()` single-source-of-truth (0 at/past the rung, base
below) restored on every reset path + the arena exit. THE LESSON: when you hang a new live knob
off a shared ladder, grep every place that RESETS the ladder — the dangerous one is the reset
that also disables the thing that would recover it.

**The gotcha.** The `__dd` debug object is built ~1000 lines ABOVE where `STAGES`/`MSAA_DYN`
are declared, so putting `stageMSAA: STAGES.map(...)` inside that literal threw
`ReferenceError: Cannot access 'MSAA_DYN' before initialization` (TDZ) and killed boot — with
no console error surfaced by the harness, just a `waitForFunction(window.__dd)` timeout. When
a test times out waiting for `__dd`, the game threw during init; capture `pageerror` directly.
Fix: assign `window.__dd.gfx = {...}` AFTER the `STAGES` declaration, not in the far-earlier
literal.

**The reusable pattern.** A mobile-only boot look-change: (1) a cached `deviceClass()` with a
`?device=` override; (2) the value flows into the *constructor* (initPostFX's RT samples),
remembered on the subsystem (`postfx.baseMSAA`) so every "restore" reads the base, never a
constant; (3) headless classifies desktop so CI is byte-identical by construction; (4) the
riskier live extension is an `?flag` A/B seam, default-off, shipped only after the owner's
on-device number. Verify identity in-CI (samples 4, no realloc on tier flip); verify the cut
on-device.

**What it unlocks.** The diet's biggest single fill lever is now in the owner's hands to A/B
(mobile 2 default; `?msaadyn` for the 0), and `deviceClass.js` is the shared seam D5 (mobile
512² mirror ceiling) plugs into next. Next rung: D3 (half-res god-ray march, `?grhalf`).
