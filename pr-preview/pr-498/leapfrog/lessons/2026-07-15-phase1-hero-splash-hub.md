# Phase 1 shipped: the hero pair goes EMBERLINE (blur kill, landscape repair, first voices)

**What we did.** Phase 1 of `reforged/UI-PREMIUM-OVERHAUL.md` (PR #447): the splash +
start hub premium pass. Killed the full-screen `.screen` backdrop blur (§A.4 — per-frame
re-blur over the live scene AND the cause of the "illegible mush" hub) and replaced the
hero screen's navy radial with the warm `--scrim-ink` asymmetric scrim (lighter center =
the dragon reads sharp); repaired both landscape layouts (one-line splash wordmark,
`::after` spacer reserving the hub rail band so "press ENTER to fly" can't render under
the buttons); migrated all splash/hub type to the `--fs-*`/`--track-*` tokens and the
hero chrome to the panel recipe; replaced the CTA's `➤` with an `ICONS.play` SVG (U7);
shipped `js/uiSound.js` — four runtime-synthesized voices (tick/confirm/back/whoosh) on
the existing SFX bus, wired hero-only (U11). Armed the entropy lint for migrated files
via a new `ENFORCED` override list; navy census 46→44.

**What we learned.**
- **`<br>` + `display:none` swallows the word gap.** The splash wordmark is
  `DRAGON<br>DRIFT`; the landscape one-line variant hides the `<br>`, which produced
  "DRAGONDRIFT". Fix: author the markup as `DRAGON <br>DRIFT` — the trailing space is
  trimmed when the break renders and preserved when it's hidden. Screenshot-verify any
  `br{display:none}` responsive trick; you will not catch it in code review.
- **The `::before/::after` flex-spacer centering pattern is ALSO the collision-repair
  lever.** The hub centers content via `.screen`'s pseudo spacers; giving
  `.hero-screen::after { min-height: 106px }` in the landscape query reserves the
  absolutely-positioned rail's band with zero markup changes. Cheaper and safer than
  restructuring to grid.
- **File-prefix allowlists need an ENFORCED override.** uitokens' shrinking allowlist
  exempts by prefix (`'js/'`), which can't arm a single migrated file. A tiny
  `ENFORCED = ['js/splash.js', 'js/uiSound.js']` list checked before `exempt()` lets
  migration proceed file-by-file — and sets the convention that NEW UI files are born
  migrated and enforced on creation.
- **uishots operational notes:** `--bank` re-captures everything before copying (it's a
  full run, not a file copy — budget ~5-8 min); a full 16-state run CAN wedge under
  concurrent load (one did — 30 min, zero frames), while state-subset runs
  (`--states=splash,hub`) are fast and reliable for iteration. Iterate on subsets,
  bank once at the end, never run captures concurrently with anything.
- **Reading the captured PNGs directly (multimodal) beats pixel-diff for a redesign
  phase.** The gate's `--diff` is for *regression* on unchanged screens; on the screens
  you meant to change, look at the frames — that's how the missing wordmark space and
  the fixed rail clearance were actually verified.

**The reusable pattern.** A hero-slice phase = tokens + scrim + layout query + icons +
voices scoped to ONE screen pair, verified by subset captures, with the lint armed for
exactly the files that migrated. Each later wave repeats this recipe on more screens.

**What it unlocks.** Phase 2 (the meta migration wave: shop/settings/pause/quests/
daily/pilot/recap/celebrate/inspect/load screen + U5 settings redesign + U6 shop
composition + U7 completion + U14) now has: a proven scrim recipe to roll out, the
ENFORCED mechanism to arm each screen's files as they migrate, and a banked 16-frame
post-Phase-1 baseline to diff against.
