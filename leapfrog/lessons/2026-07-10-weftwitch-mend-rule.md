# WEFTWITCH "THE VOLLEY TEARS, SHE MENDS" (rung 11 rule, PR4b) — and the dead-config the pre-audit caught

**What we did.** Gave WEFTWITCH her signature lance verb: a DELIBERATE ≥`burnFloor`-pip
release (manual tap OR the cap auto-loose — never a decay fizzle or the Surge fork) TEARS a
web sector and forces her to MEND it — a ~2.5s mid-phase scheduling-silence window (the shared
`staggerT` her `def.threadCut` consumer already drains), ONCE per phase. "She mends what you
break," made playable. Verified end-to-end (`tests/weftmend.mjs`): sub-floor release doesn't
tear; a ≥floor release opens the window; a 2nd in the same phase is a no-op.

**The pre-audit (CP1, before any code) caught a dead safety valve.** The redesign doc claimed
her stagger windows were safe paint windows because "`quietDwellMult` slows dwell there."
**`quietDwellMult` is DEAD config** — defined in `config.js`, referenced in a `lockLayer.js`
comment, and consumed NOWHERE (the ledger already knew: `LEAPFROG.md` "the quiet-dwell penalty
turned out to be DEAD config… never applied"). So the mend window is a FULL-RATE paint window,
and on her P5 (the thinnest not-a-phase-deleter margin in the endgame, ~1.08) that threatens to
cross the line. **Lesson: never cite a config knob as a balance brake without grepping that it
is actually consumed.** The brake here is DESIGN, not a number: her hands keep WEAVING through
the mend (no stillness freeze), so they stay moving organs and the window's reliable paint is
only the loomHeart anchor — not a free 6-cap buffet.

**The reusable gotchas:**
- **A shared stagger timer needs a `staggerT<=0` bank guard.** The thread-cut bank had none
  (it always deleted ambers, so it never coexisted with live ambers in a window). The mend
  keeps ambers alive, so without the guard, parries during a mend chain a thread-cut → ~5s of
  stacked stillness. The holderStagger precedent (EITHERWING) added exactly this guard for
  exactly this reason. When you add a new writer to a shared timer, audit every reader.
- **Restrict an event-triggered reward to DELIBERATE sources.** The `lockVolley` event fires
  for `tap`/`cap`/`decay`/`fork`. A mend (or burn) must exclude `decay` (a neglected set
  fizzling shouldn't reward) and `fork` (the Surge-break auto-looses at the phase seam, which
  already plays its own restitch — it would fire the rule for free).
- **The window must be genuinely QUIET:** wipe queued `pending` sub-volleys at the trigger
  (the breakShield precedent), or a mid-flight `stream` pours through "she stopped to mend."
- **A window balance cannot be certified headless.** The not-a-phase-deleter model prices pips
  at `REALISTIC_PER_PIP 1.35s` and has NO concept of a free window. At a 1.08 margin the
  calibration constant IS the margin — so the P5 dread-card playthrough is a HARD owner GO
  gate, and the fix dials if it fails are hands-work-harder / window 2.5→1.8s / once-fight —
  NEVER the ROI/burn numbers (the feasibility doc's own ruling).

**Deferred to PR4c (own gate):** V4 parry-snap. Her `aimed` is 3 REAL bullets (the laserLance
is a visual), taggable — but they fire from the LOOM, so the honest wiring spawns the side
bullets FROM her hands (palmL/loom/palmR, count unchanged) + vents the palms amber (resolving
the amber-vocabulary note), NOT a dishonest palm-tag on loom-fired bullets and NOT `emitOrigins`
(6 bullets). Her palms are already dwell-paintable, so parry-snap is a bonus, not required.
