# Phase 2 shipped: the meta wave goes EMBERLINE (navy census 0, settings/shop redesigned)

**What we did.** Phase 2 of `reforged/UI-PREMIUM-OVERHAUL.md` — the meta migration wave.
U4: executed the ENTIRE §A.2 navy-eviction table (incl. audit finds) — navy census
44 → **0**, and `tests/uitokens.mjs` NAVY_BASELINE is ratcheted to all-zeros (the exit
assert; any squatter returning fails CI). Five panel languages folded into the §A.1
recipe; the inspect overlay blur(12px) and every micro-blur died; pause + gesture cards
share the one-blur budget at 10px behind `@supports`. U5: settings became a grouped
instrument panel (GAME/GRAPHICS/ASSISTS/AUDIO/DATA, sticky topbar, single-accent
switches — gold is ON and only ON, player-voice copy, ?debug-gated DEV row, fenced
danger zone). U6: roster-relative stat bars, CTA de-overload (jade badge ≠ quiet meta
row ≠ gold action), landscape two-column shop with a side scrim, SVG music chips +
silhouette locks + rarity legend. U3: pm-body-scrolls pause card (EXIT always pinned),
topbar spacer fix, landscape two-column meta grids, weekly 3-col grid. U7: ICONS moved
to `js/icons.js` (shared with pilotScreen), emoji evicted outside HUD/boss, press
states + uiSound (tick/whoosh/back) wired across the meta. U14 slice: HUD scale/alpha
sliders → `--hud-scale`/`--hud-alpha`, colorblind presets → `cb-*` root class swapping
the new `--tone-jade`/`--tone-danger` role tokens.

**What we learned.**
- **Playwright's rAF-based machinery starves under swiftshader load — waits AND
  clicks.** `waitForSelector` took 7.5s to see a visible element and `page.click`
  timed out entirely (its actionability/stability checks poll on rAF). The fix for
  wiring-level tests: `waitForFunction(..., { polling: 120 })` + `page.$eval(sel,
  el => el.click())`. The uishots comment warned about waits; clicks starve too.
- **A global freeze stylesheet pauses ENTRANCE animations at 0% → black frames.**
  `animation-play-state: paused` applied before `screen-in`/`rise-in` finish freezes
  the screen at `opacity: 0`. Any ad-hoc capture using the uishots freeze pattern must
  settle ≥1s after navigation *before* injecting the freeze (uishots itself navigates
  first, freezes last — copy that order).
- **Settings toggles must flip IN PLACE.** The old pattern re-rendered the whole
  screen per toggle (`ui.showScreen('settings')`), which snapped a three-section
  scroll back to the top every time. Switches toggle their own class/aria, seg rows
  repaint only their selection — instant, scroll preserved (ZZZ rule made literal).
- **The pause card restructure was CSS-only.** The markup already had `.pm-body`;
  `overflow: hidden` on the card + `overflow-y: auto; flex: 1` on the body pinned
  resume/strip/tabs/footer with zero JS churn. Check for an existing seam before
  restructuring markup.
- **Shared icon sets get their own module.** `pilotScreen.js` needed the lock; ui.js
  importing pilotScreen forbids the reverse import. `js/icons.js` (imports nothing,
  born migrated + ENFORCED) breaks the cycle and is where U8/U9's heart/warning SVGs
  should land in Phase 3.
- **Roster-relative honesty needs a denominator worth showing:** min→max mapped to
  20–100 keeps the floor visible (a starter reads 20, not 0) while the flagship's
  100/100/100 is now *earned* (it genuinely tops every span) — ties between siblings
  are honest and stayed.

**The reusable pattern.** A migration wave = navy grep-table → tokens, panel recipe
fold, blur audit, THEN the per-screen redesigns — palette first makes every later
screenshot readable, and flipping the lint baseline to zero the same day the sweep
lands means no window where a squatter can sneak back.

**What it unlocks.** Phase 3 (EMBERSIGHT H1–H6): `--hud-scale`/`--hud-alpha` are live
root vars waiting to be honored; `--tone-*` role tokens are ready for the HUD/boss
layer's jade/danger call-sites; `js/icons.js` is the home for heart/warning pips; and
the uitokens navy assert now guards the whole repo at zero.
