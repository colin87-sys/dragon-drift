# Phase 4 theater finish: staying INSIDE the menu law is what made U12 shippable

**What we did.** Phase 4 of `reforged/UI-PREMIUM-OVERHAUL.md` — U13 (entry ritual +
motion finish), U11 (full soundboard wiring + a new `arm()` armed-danger voice), and U12
(menu-as-camera-shot) in a deliberately reduced SAFE scope: (a) the hub-orbit ↔
shop-static camera swap is now a damp-eased dolly (`cameraController.js` `shopW`,
~`--t-screen`, endpoints byte-identical to the shipped poses), (b) an in-engine exposure
mood-dim (×0.84, eased, colour-only) while a dense reading panel covers the live world,
(c) DOM panels already ride `--t-screen`/`--t-exit`, so camera + DOM move in step by
construction. The full per-screen "named shot table" (hub→settings drift, etc.) was
**descoped on purpose** — a smaller correct U12 beats a broken one.

**How U12 stayed inside the menu law (the ~20-round scar).**
- **Reuse, don't invent:** the ease blends the two framings that ALREADY exist
  (showcase orbit / shopMode static); no new camera mode, no per-screen world state.
- **Colour, never displacement:** the "defocus" is `renderer.toneMappingExposure`
  multiplied down — zero world/prop/obstacle/player writes. The dim multiplies the
  tonemap mode's BASE exposure, re-captured on every tonemap change, so it can never
  bake itself in.
- **Hard state gates, same class as the seatbelt:** the untouched
  `hideShopFx = ui.atShop() && game.state !== 'playing'` got a sibling — any
  `'playing'` frame hard-snaps `menuDimW = 0` before the exposure write, so a live run
  can never inherit a menu grade (not even one eased frame of it).
- **Snap-on-entry rule:** the camera ease only runs showcase→showcase (`wasShowcase`).
  Entering the shop from pause/gameover still SNAPS exactly as shipped — easing from a
  mid-run chase pose could swing the camera through world geometry.

**The wall-hold gate proved it.** A throwaway `tools/_wallhold.mjs` (built on
`tests/browser.mjs`, deleted after the report) drove the full circuit headlessly:
hub → shop → hub → settings → hub → start run → pause → shop-from-pause (browse a
different dragon) → back → resume. 23/23: zero console errors, `obstacleCount()` and
`player.dist` frozen through every menu open/close, dim engages on settings/pause,
stays OFF on the shop beauty shot, releases to base on close, and reads exactly base on
every playing frame. Pattern worth keeping: **when a phase touches the world-adjacent
layer, write the circuit test first as a throwaway, run it after each initiative, and
paste the numbers into the report.**

**The U13 gotcha worth the file: exit animations vs. routing semantics.** `.screen`'s
`visible` class is not just paint — `atShop()`, `inSubscreen()`, `hideShopFx` and the
camera's showcase flag all key off it. A naive "fade out, then remove `.visible`" would
have kept the SHOP framing live for 160ms into a resumed run (camera snap to showcase
mid-flight — a real bug caught at design time). The shipped pattern: **drop `visible`
(all semantics) the SAME frame; add a `screen-leaving` class that only holds the last
frame painted** (`display:flex`, `pointer-events:none !important` on the subtree,
`--t-exit`/`--ease-in` fade, self-clearing timeout, cancelled by any new `showScreen`).
Exit theater must never own state.

**Other reusable patterns.**
- **`.stagger-kids`:** the screen-level `.stagger` cascade delegates to any container
  marked `stagger-kids` (its CHILDREN animate; the container itself doesn't), 12-item
  individual cap then an `nth-child(n+13)` wave — one CSS block serves shop grids,
  settings sections, quest cards, pilot lists. Applied fresh-navigation-only so tab
  re-renders never re-cascade (ZZZ).
- **`util.tweenNum()`:** the recap rollup extracted (cubic ease-out, locale format,
  `isConnected` guard, reduced-motion collapse). Wallets tween only on SAME-screen
  re-renders (purchase/claim) — fresh opens paint instantly; numbers aren't entry theater.
- **Sound audit rule that kept U11 tasteful:** commits that trigger a `celebrate`
  overlay do NOT also `confirm()` — the celebrate fanfare IS the confirm; plain equips
  (no celebrate) get the voice. Arming a destructive two-step gets the new falling
  `arm()`; the committing second tap stays silent (erasing is not a celebration).

**Verification status for the parent:** uitokens/smoke/appshell/shop/splash green;
`tests/recap.mjs` fails IDENTICALLY on a clean tree (playwright `waitForSelector`
state-attached quirk in this env — pre-existing, not Phase 4); `uishots --static
--states=hub,shop-dragons,settings,recap` read frame-by-frame vs the banked baseline —
no composition change (the recap-landscape ledger overlap is in the baseline too).
Motion/sound FEEL is the human's call on the PR preview.

**What it unlocks.** The overhaul's build phases (0–4) are complete; what remains on
the 8.5→10 rung is judgment (preview feel-check, Gate 3 Fable review). If a later
session wants the full U12 shot table, the safe rails are now proven: blend existing
framings only, colour for mood, `wasShowcase`-style snap guards, and the wall-hold
circuit as the gate.
