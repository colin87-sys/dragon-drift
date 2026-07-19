# EMBERSIGHT H1–H3 shipped: state machine + Bell, Tape/Tally, the Gauntlet

**What we did.** HUD-REDESIGN.md increments H1–H3. H1: `js/hudState.js` (the
Law-4 state machine — `hud-cruise/combat/boss` body classes + `.rest` ghost
classes on a ≤4Hz ticker riding ui.update, event-driven ≤150ms returns) and
THE BELL (one queued toast lane absorbing popup/popup2/feat-toast/milestone/
hint; coalescing `+50 ×3`, depth 3, role underlines, per-role uiSound). H2:
the TAPE (scrolling tick hairline + PB caret + `--fs-title` numeral in a
`.slug`), the TALLY (score demoted to a slug with tier-hairline, chain
cells-of-5, SVG ember gem, two-caret race strip replacing the navy race-bar),
THE TALLY RITUAL, SCOREKEEPER. H3: the GAUNTLET (the shipped 3-cell arc grows
curved LIFE/SURGE horns + multiplier slug + 4 damage-direction arcs), VIGIL +
ONE postfx grading arbiter (`setHudGrade` — risk #9), impact-side param at
every collision call site (risk #11), boost-denial shake, fever drain-timer,
IMMERSIVE HUD, and `--hud-scale/--hud-alpha` finally honored at the anchors.

**What we learned.**
- **Swiftshader starves the COMPOSITOR, not just rAF waits.** CSS transitions
  on in-run pages sit at `currentTime: 0, startTime: null` for many seconds
  (`el.getAnimations()` shows `running` but frozen) while the WebGL loop and
  JS classes advance normally. Three separate "my element is invisible"
  hunts were all this. For in-run stills: wait on
  `getComputedStyle(el).opacity` reaching the target (or `getAnimations()`
  all `finished`) — never a fixed sleep; for capturing a mid-keyframe pose,
  ring with a long dur, then `anim.pause(); anim.currentTime = X`. Class
  asserts in tests are immune — assert classes, screenshot for composition.
- **The run-0 gesture tutorial is a settle-leg landmine.** It PAUSES the run
  mid-flight and headless never performs the gesture, so any test that adds
  wall time before its crash-and-settle leg (three did, once the Bell waits
  landed) freezes at `state: 'paused'` forever. Seed `stats: { runs: 1 }`
  unless the tutorial IS the subject.
- **Ghost floors multiply through nesting.** Container rest 0.30 × unlit cell
  0.35 = 0.10 — the "sensor dust" the redesign exists to kill, reborn by
  arithmetic. Decide per element which layer owns the ghost; we un-rest the
  surge horn while a chain is building (U8's wording) and let unlit cells
  vanish at rest (Law 5: zero-counts never render).
- **One arbiter, additive channels.** `postfx.setHudGrade(desat, vig)` is the
  only door for HUD grade claims; updatePostFX eases it unconditionally (the
  `_bossMix` idiom, tier-flap safe), composes it additively with fever/boss/
  death, and zeroes the claim outside 'playing' while hudState re-asserts at
  4Hz — self-healing across pause/death/revive with no cross-module writes.
- **A width-0 absolute anchor + static nth-child offsets curves a meter.**
  The surge horn must hold 5 OR 8 cells (feverThreshold varies); a flex
  column becomes a 116px antenna. Cells `position: absolute` off a zero-size
  anchor with per-index `right/bottom` (STATIC layout props — rule (d) only
  bans animating them) curve along the arc's tangent, and the pop/shimmer
  transform animations ride on top untouched.
- **Direction-dependent transition timing = put the duration on the TARGET
  state.** Ghost down slow (`--t-ui` on `.rest`), return fast (`--t-micro` on
  the base rule) — transitions read the destination's `transition` property,
  so one class toggle gets both behaviors for free.

**The reusable pattern.** A HUD increment = spec grammar → markup + module →
relevance/immersive as body/element classes ONLY (JS speaks classes +
transforms, CSS owns appearance) → class-assert tests + settled-transition
stills → uitokens ENFORCED/HUD_RE extended the same day.

**What it unlocks.** H4 (the Lure) and H5 (the Mews plate) start with: the
Bell as the one toast lane (boss callouts can ring it), body-class states to
key boss chrome off, `setHudGrade` for any lens/boss grade claims, the
`.slug` utility + dual-stroke hairline recipe, and a verification kit that
already knows the compositor-starvation and gesture-tutorial traps.
