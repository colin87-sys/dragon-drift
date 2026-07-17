# Menu header consistency: PILOT joins the .screen-topbar system

**What we did.** Owner report: "PILOT has no ✕ and its heading font looks different."
Audited every menu/screen header, then unified PILOT onto the shared topbar grammar.

## The consistency table (before)

| Screen | Title | ✕ close | Tab icons |
|---|---|---|---|
| SHOP | `.screen-topbar` + `.topbar-title` (--fs-title 20px, gold gradient, --track-disp) + wallet chip | ✕ `#btn-back` | SVG `ICONS.*` |
| SETTINGS | topbar, same | ✕ `#btn-back` + bottom `← BACK` (`#btn-back2`) | — |
| QUESTS / DAILY / BOSS RUSH | topbar, same | ✕ `#btn-back` | — |
| **PILOT** | **bare `<h1>PILOT</h1>` (--fs-display ~50px, centered glow)** | **NONE — only a bottom `← BACK` (misusing id `#btn-back`)** | **emoji dingbats ⬢ ✈ « »** |
| Recap (gameover) | `<h1 class="bad/good">` CRASHED!/RUSH CLEAR! | none | — |
| Pause | `<h1 class="pause-title">PAUSED` + composed card | none (tap-outside / RESUME) | text tabs |
| Celebrate | `.celebrate-card` kicker/name | none (CONTINUE) | — |
| Inspect modal | own chrome | own `.inspect-close` ✕ (ICONS.close) | — |

## What we unified

- **PILOT header → `.screen-topbar`**: `topbar-title` PILOT + the equipped «title»
  chip riding the topbar (the shop-wallet-chip slot) + `topbar-close` ✕ (`#btn-back`,
  `ICONS.close`). Bare `<h1>` dropped; bottom back renamed `#btn-back2` (the settings
  pattern for long scrolling screens).
- **PILOT tabs → SVG** (U7): `ICONS.feat` FEATS, new `ICONS.log` (open logbook)
  FLIGHT LOG, new `ICONS.laurel` (medal rosette) TITLES — both in the 18-grid /
  1.6-stroke house style. The `⬢ n/35 feats` meta chip also uses `ICONS.feat` now.
- **`#btn-back` / `#btn-back2` wiring centralized** in `wireScreenButtons` (one
  `goBack` honoring the pause→subscreen `returnScreen` path); the settings-only
  `btn-back2` wiring was deleted.
- **✕ touch target ≥44pt everywhere**: `.topbar-close` stays 34px visually but a
  `::before { inset:-6px }` extends the hit circle to 46px on ALL topbar screens.

**Left distinct on purpose:** PAUSED (a composed in-run card, resume-by-tap-outside —
a ✕ would compete with RESUME), recap/celebrate (event headings, not navigable
panels), inspect modal (its own ✕ already matches ICONS.close).

## Gotchas

- Pilot's old bottom BACK squatted on `#btn-back`; the topbar ✕ needed that id for
  the shared wiring, so the bottom one becomes `#btn-back2` — which was wired only
  inside the settings block. Centralize, don't copy.
- The first-open coachmark injects after the FIRST `</div>` of the screen html; on
  pilot's first-ever open no title is equipped (titles are equipped IN pilot), so the
  topbar closes first and the coach lands under it correctly.
- Header verification is cheap with the __dd seam: `ui.showScreen(x)` + computed-style
  probe of `.topbar-title` proves 20px/0.16em/Russo One IDENTICAL across all six
  screens — trust the numbers, use PNGs for composition only.

**What it unlocks.** Any future meta screen has one header recipe: topbar + title +
optional chip + ✕`#btn-back`, optional `#btn-back2` for long bodies — both pre-wired.
